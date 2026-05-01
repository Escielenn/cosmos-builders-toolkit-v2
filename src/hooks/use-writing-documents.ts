// ---------------------------------------------------------------------------
// useWritingDocuments, React Query hooks for writing-space documents.
//
// Documents are stored as world_entries with entry_type = 'document'.
// Folders are stored as world_entries with entry_type = 'folder'.
// Provides CRUD operations with tanstack-query cache invalidation.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WritingDocument = WorldEntry;

export interface WritingFolder {
  id: string;
  title: string;
  sort_order: number;
  documents: WritingDocument[];
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const docKeys = {
  all: (worldId: string) => ["writing-documents", worldId] as const,
  single: (worldId: string, docId: string) =>
    ["writing-documents", worldId, docId] as const,
};

// ---------------------------------------------------------------------------
// Fetch all writing documents + folders for a world
// ---------------------------------------------------------------------------

export function useWritingDocuments(worldId: string | undefined) {
  const query = useQuery<WorldEntry[]>({
    queryKey: docKeys.all(worldId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("world_entries")
        .select("*")
        .eq("world_id", worldId!)
        .in("entry_type", ["document", "lore", "folder"])
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as WorldEntry[];
    },
    enabled: !!worldId,
    staleTime: 30_000,
  });

  // Derive structured folder/document data from the flat list
  const structured = useMemo(() => {
    const allEntries = query.data ?? [];

    // Separate folders from documents
    const folderEntries = allEntries
      .filter((e) => e.entry_type === "folder")
      .sort((a, b) => a.sort_order - b.sort_order);

    const docEntries = allEntries.filter((e) => e.entry_type !== "folder");

    // Build folder map with their children
    const folders: WritingFolder[] = folderEntries.map((f) => ({
      id: f.id,
      title: f.title,
      sort_order: f.sort_order,
      documents: docEntries
        .filter((d) => d.parent_id === f.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));

    // Unfiled documents have no parent_id or a parent_id that doesn't match any folder
    const folderIds = new Set(folderEntries.map((f) => f.id));
    const unfiledDocs = docEntries.filter(
      (d) => !d.parent_id || !folderIds.has(d.parent_id)
    );

    return { folders, unfiledDocs, allDocs: docEntries };
  }, [query.data]);

  return {
    ...query,
    /** All documents (excludes folders), for backward compat */
    data: structured.allDocs,
    /** Folders with their child documents */
    folders: structured.folders,
    /** Documents not assigned to any folder */
    unfiledDocs: structured.unfiledDocs,
  };
}

// ---------------------------------------------------------------------------
// Create a new document
// ---------------------------------------------------------------------------

export function useCreateDocument(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      parentId,
    }: {
      title: string;
      parentId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("world_entries")
        .insert({
          world_id: worldId!,
          title,
          entry_type: "document",
          content: "",
          metadata: {},
          sort_order: 0,
          parent_id: parentId ?? null,
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

// ---------------------------------------------------------------------------
// Create a folder (chapter)
// ---------------------------------------------------------------------------

export function useCreateFolder(worldId: string | undefined) {
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
          entry_type: "folder",
          content: "",
          metadata: {},
          sort_order: 0,
          parent_id: null,
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
        title: "FOLDER CREATION FAILED.",
        description:
          error instanceof Error ? error.message : "Could not create folder.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Move a document into a folder (or unfiled)
// ---------------------------------------------------------------------------

export function useMoveDocument(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      docId,
      folderId,
    }: {
      docId: string;
      folderId: string | null;
    }) => {
      const { data, error } = await supabase
        .from("world_entries")
        .update({ parent_id: folderId })
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
        title: "MOVE FAILED.",
        description:
          error instanceof Error ? error.message : "Could not move document.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Rename a folder
// ---------------------------------------------------------------------------

export function useRenameFolder(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      folderId,
      title,
    }: {
      folderId: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("world_entries")
        .update({ title })
        .eq("id", folderId)
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
          error instanceof Error ? error.message : "Could not rename folder.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete a folder (moves children to unfiled first)
// ---------------------------------------------------------------------------

export function useDeleteFolder(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      // Step 1: Move all children to unfiled (parent_id = null)
      const { error: moveError } = await supabase
        .from("world_entries")
        .update({ parent_id: null })
        .eq("parent_id", folderId);

      if (moveError) throw moveError;

      // Step 2: Delete the folder itself
      const { error: deleteError } = await supabase
        .from("world_entries")
        .delete()
        .eq("id", folderId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      toast({ title: "CHAPTER DELETED." });
    },
    onError: (error) => {
      toast({
        title: "DELETE FAILED.",
        description:
          error instanceof Error ? error.message : "Could not delete folder.",
        variant: "destructive",
      });
    },
  });
}
