import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { WorldEntry } from "@/services/world-data";
import { createEntry, updateEntry } from "@/services/world-entries";
import type { CreatableEntityType } from "@/lib/entity-config";

// ---------------------------------------------------------------------------
// Query: all entity-first entries (no tool_source) grouped by type
// ---------------------------------------------------------------------------

export function useWorldEntities(worldId: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["world-entities", worldId],
    queryFn: async () => {
      if (!worldId || !user) return [];

      const { data, error } = await supabase
        .from("world_entries")
        .select("*")
        .eq("world_id", worldId)
        .is("tool_source", null)
        .is("tool_data_id", null)
        .order("entry_type")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as WorldEntry[];
    },
    enabled: !!user && !!worldId,
  });

  // Group by entry_type
  const grouped = (query.data ?? []).reduce<Record<string, WorldEntry[]>>(
    (acc, entry) => {
      const type = entry.entry_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(entry);
      return acc;
    },
    {}
  );

  return {
    entities: query.data ?? [],
    grouped,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ---------------------------------------------------------------------------
// Mutation: create a new entity entry
// ---------------------------------------------------------------------------

interface CreateEntityInput {
  title: string;
  entryType: CreatableEntityType;
  description?: string;
  metadata?: Record<string, unknown>;
}

export function useCreateEntityEntry(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      if (!worldId || !user) throw new Error("Missing world or user");

      // Strip internal _-prefixed keys to prevent injection of _pending_changes etc.
      const sanitized: Record<string, unknown> = {};
      if (input.metadata) {
        for (const [k, v] of Object.entries(input.metadata)) {
          if (!k.startsWith("_")) sanitized[k] = v;
        }
      }

      const metadata: Record<string, unknown> = {
        name: input.title,
        description: input.description ?? "",
        ...sanitized,
      };

      return createEntry(
        {
          worldId,
          title: input.title,
          entryType: input.entryType,
          metadata,
        },
        user.id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-entities", worldId] });
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
      queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
    },
    onError: (error) => {
      toast({
        title: "ENTITY CREATION FAILED.",
        description:
          error instanceof Error ? error.message : "Could not create entity.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: update entity metadata
// ---------------------------------------------------------------------------

export function useUpdateEntityMetadata(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      metadata,
    }: {
      entryId: string;
      metadata: Record<string, unknown>;
    }) => {
      return updateEntry({ entryId, metadata });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-entities", worldId] });
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
      queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
    },
    onError: (error) => {
      toast({
        title: "UPDATE FAILED.",
        description:
          error instanceof Error ? error.message : "Could not update entity.",
        variant: "destructive",
      });
    },
  });
}
