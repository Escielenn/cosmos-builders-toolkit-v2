/**
 * React Query hooks for writing workshop entries (CRUD).
 * Follows the use-worksheets.ts / use-all-worksheets.ts pattern.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────────────

export interface WritingEntry {
  id: string;
  user_id: string;
  world_id: string | null;
  prompt_id: string | null;
  title: string;
  content: string;
  word_count: number;
  tags: string[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WritingEntryWithWorld extends WritingEntry {
  worlds: { name: string; icon: string } | null;
}

interface CreateEntryInput {
  promptId?: string;
  worldId?: string;
  title?: string;
  content?: string;
}

interface UpdateEntryInput {
  entryId: string;
  title?: string;
  content?: string;
  wordCount?: number;
  tags?: string[];
  worldId?: string | null;
}

// ─── Query Keys ─────────────────────────────────────────────────────────

const entryKeys = {
  all: (userId?: string) => ["writing-entries", userId] as const,
  byWorld: (userId?: string, worldId?: string) =>
    ["writing-entries", userId, worldId] as const,
  single: (entryId: string) => ["writing-entry", entryId] as const,
};

// ─── List Entries ───────────────────────────────────────────────────────

export function useWritingEntries(worldId?: string) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: worldId
      ? entryKeys.byWorld(user?.id, worldId)
      : entryKeys.all(user?.id),
    queryFn: async () => {
      if (!user) return [];

      let q = supabase
        .from("writing_entries")
        .select("*, worlds(name, icon)")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (worldId) {
        q = q.eq("world_id", worldId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as WritingEntryWithWorld[]) || [];
    },
    enabled: !!user,
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ─── Single Entry ───────────────────────────────────────────────────────

export function useWritingEntry(entryId: string | null) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: entryKeys.single(entryId || ""),
    queryFn: async () => {
      if (!user || !entryId) return null;

      const { data, error } = await supabase
        .from("writing_entries")
        .select("*, worlds(name, icon)")
        .eq("id", entryId)
        .single();

      if (error) throw error;
      return data as unknown as WritingEntryWithWorld;
    },
    enabled: !!user && !!entryId,
  });

  return {
    entry: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ─── Create Entry ───────────────────────────────────────────────────────

export function useCreateEntry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("writing_entries")
        .insert({
          user_id: user.id,
          prompt_id: input.promptId || null,
          world_id: input.worldId || null,
          title: input.title || "",
          content: input.content || "",
          word_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as WritingEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["writing-entries"],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ─── Update Entry ───────────────────────────────────────────────────────

export function useUpdateEntry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEntryInput) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.wordCount !== undefined) updateData.word_count = input.wordCount;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.worldId !== undefined) updateData.world_id = input.worldId;

      const { data, error } = await supabase
        .from("writing_entries")
        .update(updateData)
        .eq("id", input.entryId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as WritingEntry;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["writing-entries"],
      });
      queryClient.invalidateQueries({
        queryKey: entryKeys.single(variables.entryId),
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ─── Archive Entry (soft-delete) ────────────────────────────────────────

export function useDeleteEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("writing_entries")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["writing-entries"],
      });
      toast({
        title: "Entry archived",
        description: "Your writing entry has been archived.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to archive entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
