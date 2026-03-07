import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export interface Tag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
}

export function useTags() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all tags for the current user (sorted by usage)
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["worksheet-tags", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("worksheet_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  // Update worksheet tags
  const updateWorksheetTags = useMutation({
    mutationFn: async ({
      worksheetId,
      tags,
    }: {
      worksheetId: string;
      tags: string[];
    }) => {
      const { error } = await supabase
        .from("worksheets")
        .update({ tags })
        .eq("id", worksheetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worksheets"] });
      queryClient.invalidateQueries({ queryKey: ["worksheet-tags"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tags",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create a new tag (or update existing)
  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("worksheet_tags")
        .upsert(
          {
            user_id: user.id,
            name: name.toLowerCase().trim(),
            color: color || getRandomTagColor(),
          },
          { onConflict: "user_id,name" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worksheet-tags"] });
    },
  });

  // Delete a tag
  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from("worksheet_tags")
        .delete()
        .eq("id", tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worksheet-tags"] });
    },
  });

  // Search tags for autocomplete
  const searchTags = (query: string): Tag[] => {
    if (!query) return tags.slice(0, 10);
    const lowerQuery = query.toLowerCase();
    return tags.filter((t) => t.name.includes(lowerQuery)).slice(0, 10);
  };

  // Update world entry tags
  const updateEntryTags = useMutation({
    mutationFn: async ({
      entryId,
      tags,
    }: {
      entryId: string;
      tags: string[];
    }) => {
      const { error } = await supabase
        .from("world_entries")
        .update({ tags } as any)
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codex-data"] });
      queryClient.invalidateQueries({ queryKey: ["wiki-page"] });
      queryClient.invalidateQueries({ queryKey: ["worksheet-tags"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tags",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tags,
    isLoading,
    updateWorksheetTags,
    updateEntryTags,
    createTag,
    deleteTag,
    searchTags,
  };
}

// Tag colors for visual distinction
const TAG_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
];

export function getRandomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length];
}
