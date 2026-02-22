import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { WorldTheme } from "@/hooks/use-world";

interface World {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  header_image_url: string | null;
  header_image_focus_y: number;
  icon: string;
  tags: string[];
  theme: WorldTheme;
  snapshot_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateWorldInput {
  name: string;
  description?: string;
  icon?: string;
  header_image_url?: string;
  tags?: string[];
}

interface UpdateWorldInput {
  worldId: string;
  name?: string;
  description?: string;
  icon?: string;
  header_image_url?: string | null;
  header_image_focus_y?: number;
  tags?: string[];
  theme?: WorldTheme;
}

export const useWorlds = (includeArchived: boolean = false) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const worldsQuery = useQuery({
    queryKey: ["worlds", user?.id, includeArchived],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("worlds")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!includeArchived) {
        query = query.is("archived_at", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as World[];
    },
    enabled: !!user,
  });

  const allWorldTagsQuery = useQuery({
    queryKey: ["worldTags", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("world_tags")
        .select("name")
        .eq("user_id", user.id)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      return data.map((t) => t.name);
    },
    enabled: !!user,
  });

  const createWorld = useMutation({
    mutationFn: async (input: CreateWorldInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("worlds")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          icon: input.icon || "globe",
          header_image_url: input.header_image_url || null,
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as World;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      queryClient.invalidateQueries({ queryKey: ["worldTags", user?.id] });
      toast({
        title: "NEW WORLD INITIALIZED.",
        description: "Your new world is ready for building.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateWorld = useMutation({
    mutationFn: async (input: UpdateWorldInput) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: { name?: string; description?: string; icon?: string; header_image_url?: string | null; header_image_focus_y?: number; tags?: string[]; theme?: WorldTheme } = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.header_image_url !== undefined) updateData.header_image_url = input.header_image_url;
      if (input.header_image_focus_y !== undefined) updateData.header_image_focus_y = input.header_image_focus_y;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.theme !== undefined) updateData.theme = input.theme;

      const { data, error } = await supabase
        .from("worlds")
        .update(updateData)
        .eq("id", input.worldId)
        .select()
        .single();

      if (error) throw error;
      return data as World;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      queryClient.invalidateQueries({ queryKey: ["world", data.id] });
      queryClient.invalidateQueries({ queryKey: ["worldTags", user?.id] });
      toast({
        title: "World updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveWorld = useMutation({
    mutationFn: async (worldId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("worlds")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", worldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      toast({
        title: "World archived",
        description: "The world has been moved to your archive.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to archive world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unarchiveWorld = useMutation({
    mutationFn: async (worldId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("worlds")
        .update({ archived_at: null })
        .eq("id", worldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      toast({
        title: "World restored",
        description: "The world has been restored from your archive.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to restore world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWorld = useMutation({
    mutationFn: async (worldId: string) => {
      const { error } = await supabase
        .from("worlds")
        .delete()
        .eq("id", worldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      queryClient.invalidateQueries({ queryKey: ["worldTags", user?.id] });
      toast({
        title: "World deleted",
        description: "The world has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    worlds: worldsQuery.data || [],
    isLoading: worldsQuery.isLoading,
    error: worldsQuery.error,
    allWorldTags: allWorldTagsQuery.data || [],
    createWorld,
    updateWorld,
    deleteWorld,
    archiveWorld,
    unarchiveWorld,
  };
};
