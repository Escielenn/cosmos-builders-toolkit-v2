// ---------------------------------------------------------------------------
// useWritingDocuments — React Query hooks for writing-space documents.
//
// Documents are stored as world_entries with entry_type = 'document'.
// Provides CRUD operations with tanstack-query cache invalidation.
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const docKeys = {
  all: (worldId: string) => ["writing-documents", worldId] as const,
  single: (worldId: string, docId: string) =>
    ["writing-documents", worldId, docId] as const,
};

// ---------------------------------------------------------------------------
// Fetch all writing documents for a world
// ---------------------------------------------------------------------------

export function useWritingDocuments(worldId: string | undefined) {
  return useQuery<WorldEntry[]>({
    queryKey: docKeys.all(worldId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("world_entries")
        .select("*")
        .eq("world_id", worldId!)
        .in("entry_type", ["document", "lore"])
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as WorldEntry[];
    },
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Create a new document
// ---------------------------------------------------------------------------

export function useCreateDocument(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from("world_entries")
        .insert({
          world_id: worldId!,
          title,
          entry_type: "document",
          content: "",
          metadata: {},
          sort_order: 0,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorldEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "DOCUMENT CREATION FAILED.",
        description:
          error instanceof Error ? error.message : "Could not create document.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Update document content (auto-save)
// ---------------------------------------------------------------------------

export function useUpdateDocumentContent(worldId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      docId,
      content,
    }: {
      docId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("world_entries")
        .update({ content })
        .eq("id", docId)
        .select()
        .single();

      if (error) throw error;
      return data as WorldEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
    },
  });
}

// ---------------------------------------------------------------------------
// Rename a document
// ---------------------------------------------------------------------------

export function useRenameDocument(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      docId,
      title,
    }: {
      docId: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("world_entries")
        .update({ title })
        .eq("id", docId)
        .select()
        .single();

      if (error) throw error;
      return data as WorldEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "RENAME FAILED.",
        description:
          error instanceof Error ? error.message : "Could not rename document.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete a document
// ---------------------------------------------------------------------------

export function useDeleteDocument(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("world_entries")
        .delete()
        .eq("id", docId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      toast({ title: "DOCUMENT DELETED." });
    },
    onError: (error) => {
      toast({
        title: "DELETE FAILED.",
        description:
          error instanceof Error ? error.message : "Could not delete document.",
        variant: "destructive",
      });
    },
  });
}
