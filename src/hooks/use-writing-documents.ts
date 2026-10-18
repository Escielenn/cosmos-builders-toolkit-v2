// ---------------------------------------------------------------------------
// useWritingDocuments, React Query hooks for writing-space documents.
//
// Documents are stored as world_entries with entry_type = 'document'.
// Folders are stored as world_entries with entry_type = 'folder', and nest to
// any depth through parent_id (see src/lib/binder-tree.ts).
//
// 'lore' entries are Codex material (the Codex uses them as its own folders
// and wiki prose). They used to be pulled in here and showed up as binder
// documents; they are reachable from the Codex only now. Their trash rows
// still list in the binder's Trash so nothing trashed earlier is stranded.
// Provides CRUD operations with tanstack-query cache invalidation.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { WorldEntry } from "@/services/world-data";
import { writeDocMeta, type DocumentMeta } from "@/lib/document-meta";
import { mapError } from "@/lib/ship-voice";
import { buildBinderTree, flattenFolders, type BinderNode, type MovePlan } from "@/lib/binder-tree";
import { captureDocumentSnapshot } from "@/hooks/use-document-versions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WritingDocument = WorldEntry;

export interface WritingFolder {
  id: string;
  title: string;
  sort_order: number;
  /** Direct child documents, in binder order. */
  documents: WritingDocument[];
  /** Effective parent folder (null = binder root). */
  parent_id: string | null;
  /** Nesting depth, 0 at the root. */
  depth: number;
  /** Folder titles from the root down to this one. */
  path: string[];
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("world_entries")
        .select("*")
        .eq("world_id", worldId!)
        .in("entry_type", ["document", "folder"])
        .is("trashed_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as WorldEntry[];
    },
    enabled: !!worldId,
    staleTime: 30_000,
  });

  // Derive the binder tree, plus the flat shapes older callers read
  // (Corkboard and Compile walk `folders` then `unfiledDocs`).
  const structured = useMemo(() => {
    const allEntries = query.data ?? [];
    const tree = buildBinderTree(allEntries);
    const docsOf = (n: BinderNode<WorldEntry>) =>
      n.children.filter((c) => !c.isFolder).map((c) => c.entry);

    // Every folder, depth-first, so nested chapters compile in reading order.
    const folders: WritingFolder[] = flattenFolders(tree).map(({ node, path }) => ({
      id: node.entry.id,
      title: node.entry.title,
      sort_order: node.entry.sort_order,
      documents: docsOf(node),
      parent_id: node.depth === 0 ? null : node.entry.parent_id,
      depth: node.depth,
      path,
    }));

    // Documents at the binder root (no folder, or an orphaned parent).
    const unfiledDocs = tree.filter((n) => !n.isFolder).map((n) => n.entry);
    const allDocs = allEntries.filter((e) => e.entry_type !== "folder");

    // Every document in binder reading order (depth-first, folders and
    // documents interleaved exactly as the binder shows them), with the
    // folder that holds it. This is the order a compile must follow.
    const folderById = new Map(folders.map((f) => [f.id, f]));
    const orderedDocs: { doc: WorldEntry; folder: WritingFolder | null }[] = [];
    const walk = (nodes: BinderNode<WorldEntry>[], folder: WritingFolder | null) => {
      for (const n of nodes) {
        if (n.isFolder) walk(n.children, folderById.get(n.entry.id) ?? null);
        else orderedDocs.push({ doc: n.entry, folder });
      }
    };
    walk(tree, null);

    return { tree, folders, unfiledDocs, allDocs, allEntries, orderedDocs };
  }, [query.data]);

  return {
    ...query,
    /** All documents (excludes folders), for backward compat */
    data: structured.allDocs,
    /** Every folder, depth-first, with its direct child documents */
    folders: structured.folders,
    /** Documents at the binder root */
    unfiledDocs: structured.unfiledDocs,
    /** The binder as a tree (folders nest to any depth) */
    tree: structured.tree,
    /** Folders and documents, flat (input for binder-tree planners) */
    entries: structured.allEntries,
    /** Documents in binder reading order, with their folder (compile order) */
    orderedDocs: structured.orderedDocs,
  };
}

// ---------------------------------------------------------------------------
// Create a new document
// ---------------------------------------------------------------------------

/**
 * Next free slot at the end of a sibling list.
 *
 * Creating everything at 0 used to tie every new row, and because the query
 * orders by updated_at desc those ties resolved to most-recently-edited —
 * so typing in a document jumped it above ones the user had dragged into
 * place. Reordering persists multiples of 10 (see useReorderDocuments).
 */
export function nextSortOrder(siblings: { sort_order: number | null }[]): number {
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((s) => s.sort_order ?? 0)) + 10;
}

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
          sort_order: nextSortOrder(
            (qc.getQueryData<WorldEntry[]>(docKeys.all(worldId!)) ?? []).filter(
              (e) => (e.parent_id ?? null) === (parentId ?? null),
            ),
          ),
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
          mapError(error),
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
  const { toast } = useToast();

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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      // The editor header and tab title read the single-doc query; without
      // this they keep showing pre-save values until an unrelated refetch.
      qc.invalidateQueries({ queryKey: ["write-doc", variables.docId] });
    },
    // A failed autosave used to be completely silent.
    onError: () => {
      toast({
        title: "SAVE FAILED.",
        description:
          "Your last change did not reach the server. Copy your text before closing this tab.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Rename a document
// ---------------------------------------------------------------------------

/**
 * Update a document's card metadata (synopsis, POV, status, in-world date).
 *
 * Writes into the existing world_entries.metadata jsonb column, merging so any
 * keys another feature owns survive. No schema change.
 */
/**
 * Read-modify-write on one document's metadata. Safe because writes for a
 * document are queued (below) and the merge preserves keys it doesn't touch.
 */
async function writeMeta(docId: string, patch: Partial<DocumentMeta>): Promise<WorldEntry> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: current, error: readErr } = await db
    .from("world_entries")
    .select("metadata")
    .eq("id", docId)
    .single();
  if (readErr) throw readErr;

  const next = writeDocMeta(current?.metadata, patch);
  const { data, error } = await db
    .from("world_entries")
    .update({ metadata: next })
    .eq("id", docId)
    .select()
    .single();
  if (error) throw error;
  return data as WorldEntry;
}

// Per-document write queue. The inspector can commit two fields in quick
// succession (keywords, then target); two overlapping read-modify-writes
// would each read the old metadata and the second would drop the first's key.
const metaQueues = new Map<string, Promise<unknown>>();

export function useUpdateDocumentMeta(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ docId, patch }: { docId: string; patch: Partial<DocumentMeta> }) => {
      const run = (metaQueues.get(docId) ?? Promise.resolve())
        .catch(() => undefined)
        .then(() => writeMeta(docId, patch));
      metaQueues.set(docId, run);
      return run;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      qc.invalidateQueries({ queryKey: ["write-doc", variables.docId] });
    },
    onError: (error) => {
      toast({
        title: "COULD NOT SAVE DETAILS.",
        description:
          mapError(error),
        variant: "destructive",
      });
    },
  });
}

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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      qc.invalidateQueries({ queryKey: ["write-doc", variables.docId] });
    },
    onError: (error) => {
      toast({
        title: "RENAME FAILED.",
        description:
          mapError(error),
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete a document
// ---------------------------------------------------------------------------

/** Move a document to the trash (soft delete — recoverable, auto-purged ~90d). */
export function useDeleteDocument(worldId: string | undefined) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      // Never lose words: a structural operation captures the text first.
      if (user) await captureDocumentSnapshot(docId, user.id, "trash");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("world_entries")
        .update({ trashed_at: new Date().toISOString() })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      qc.invalidateQueries({ queryKey: ["trashed-documents", worldId] });
      toast({ title: "MOVED TO TRASH.", description: "Recoverable for 90 days." });
    },
    onError: (error) => {
      toast({
        title: "DELETE FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });
}

/** Trashed documents for a world (the Trash section). */
export function useTrashedDocuments(worldId: string | undefined) {
  return useQuery<WorldEntry[]>({
    queryKey: ["trashed-documents", worldId],
    enabled: !!worldId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("world_entries")
        .select("*")
        .eq("world_id", worldId!)
        .in("entry_type", ["document", "lore"])
        .not("trashed_at", "is", null)
        .order("trashed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WorldEntry[];
    },
  });
}

/** Restore a trashed document. */
export function useRestoreDocument(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("world_entries")
        .update({ trashed_at: null })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      qc.invalidateQueries({ queryKey: ["trashed-documents", worldId] });
      toast({ title: "RESTORED." });
    },
  });
}

/** Permanently delete a trashed document (empties one item). */
export function usePurgeDocument(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("world_entries").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trashed-documents", worldId] });
      toast({ title: "DELETED PERMANENTLY." });
    },
  });
}

/** Purge trashed docs older than 90 days for a world (idempotent, fire-and-forget). */
export async function purgeExpiredTrash(worldId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("world_entries")
    .delete()
    .eq("world_id", worldId)
    .not("trashed_at", "is", null)
    .lt("trashed_at", cutoff);
}

// ---------------------------------------------------------------------------
// Create a folder (chapter)
// ---------------------------------------------------------------------------

export function useCreateFolder(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    /** A bare title creates at the root; pass parentId to nest. */
    mutationFn: async (arg: string | { title: string; parentId?: string | null }) => {
      const { title, parentId = null } = typeof arg === "string" ? { title: arg } : arg;
      const { data, error } = await supabase
        .from("world_entries")
        .insert({
          world_id: worldId!,
          title,
          entry_type: "folder",
          content: "",
          metadata: {},
          sort_order: nextSortOrder(
            (qc.getQueryData<WorldEntry[]>(docKeys.all(worldId!)) ?? []).filter(
              (e) => (e.parent_id ?? null) === parentId,
            ),
          ),
          parent_id: parentId,
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
          mapError(error),
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
          mapError(error),
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Reorder documents within a list — persist sort_order (Studio binder DnD)
// ---------------------------------------------------------------------------

export function useReorderDocuments(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("world_entries").update({ sort_order: i * 10 }).eq("id", id),
        ),
      );
    },
    onMutate: async (orderedIds: string[]) => {
      // optimistic: reflect the new order immediately
      await qc.cancelQueries({ queryKey: docKeys.all(worldId!) });
      const prev = qc.getQueryData<WorldEntry[]>(docKeys.all(worldId!));
      if (prev) {
        const pos = new Map(orderedIds.map((id, i) => [id, i * 10]));
        qc.setQueryData<WorldEntry[]>(
          docKeys.all(worldId!),
          prev.map((e) => (pos.has(e.id) ? { ...e, sort_order: pos.get(e.id)! } : e)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(docKeys.all(worldId!), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
    },
  });
}

// ---------------------------------------------------------------------------
// Move any binder row (document or folder): new parent + sibling order.
// Plans come from binder-tree.ts, which refuses a folder-into-descendant move.
// ---------------------------------------------------------------------------

export function useMoveBinderItem(worldId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (plan: MovePlan) => {
      const { error } = await supabase
        .from("world_entries")
        .update({ parent_id: plan.parentId })
        .eq("id", plan.id);
      if (error) throw error;
      const results = await Promise.all(
        plan.orderedIds.map((id, i) =>
          supabase.from("world_entries").update({ sort_order: i * 10 }).eq("id", id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (plan: MovePlan) => {
      await qc.cancelQueries({ queryKey: docKeys.all(worldId!) });
      const prev = qc.getQueryData<WorldEntry[]>(docKeys.all(worldId!));
      if (prev) {
        const pos = new Map(plan.orderedIds.map((id, i) => [id, i * 10]));
        qc.setQueryData<WorldEntry[]>(
          docKeys.all(worldId!),
          prev.map((e) => {
            const next = pos.has(e.id) ? { ...e, sort_order: pos.get(e.id)! } : e;
            return e.id === plan.id ? { ...next, parent_id: plan.parentId } : next;
          }),
        );
      }
      return { prev };
    },
    onError: (error, _plan, ctx) => {
      if (ctx?.prev) qc.setQueryData(docKeys.all(worldId!), ctx.prev);
      toast({ title: "MOVE FAILED.", description: mapError(error), variant: "destructive" });
    },
    onSettled: (_d, _e, plan) => {
      qc.invalidateQueries({ queryKey: docKeys.all(worldId!) });
      qc.invalidateQueries({ queryKey: ["write-doc", plan.id] });
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
          mapError(error),
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
      // Step 1: Move all children (documents AND nested folders) up to the
      // folder's own parent, so nothing inside it is ever orphaned.
      const { data: folder, error: readError } = await supabase
        .from("world_entries")
        .select("parent_id")
        .eq("id", folderId)
        .maybeSingle();
      if (readError) throw readError;
      const { error: moveError } = await supabase
        .from("world_entries")
        .update({ parent_id: folder?.parent_id ?? null })
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
      toast({ title: "FOLDER DELETED.", description: "Its contents moved up one level." });
    },
    onError: (error) => {
      toast({
        title: "DELETE FAILED.",
        description:
          mapError(error),
        variant: "destructive",
      });
    },
  });
}
