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
//
// SCALE: the list selects metadata and the stored word_count only, never
// content (a 100k-word manuscript used to come down whole on every load and
// again after every autosave). Text is loaded where it is read; see
// src/hooks/use-document-contents.ts. A save patches the caches in place
// (setQueryData) instead of invalidating the list.
//
// CONCURRENCY: a save carries the content_version its edits sit on. Zero
// rows updated raises SaveConflictError (another writer saved first) or
// SaveDeniedError (no write access); see src/lib/writing/doc-scale.ts.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { WorldEntry } from "@/services/world-data";
import { writeDocMeta, type DocumentMeta } from "@/lib/document-meta";
import { mapError } from "@/lib/ship-voice";
import { buildBinderTree, flattenFolders, type BinderNode, type MovePlan } from "@/lib/binder-tree";
import { captureDocumentSnapshot } from "@/hooks/use-document-versions";
import { patchDocContent, settleUnsaved } from "@/hooks/use-document-contents";
import { countWords } from "@/lib/text";
import {
  SaveConflictError,
  SaveDeniedError,
  classifyZeroRowSave,
  isSaveConflict,
  isSaveDenied,
  patchRow,
  type ServerDocCopy,
} from "@/lib/writing/doc-scale";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A binder row: every column but content, plus the stored word count and
 * the content version. Content is deliberately absent from the type, so a
 * surface that needs text has to load it (use-document-contents.ts).
 */
export type BinderDoc = Omit<WorldEntry, "content"> & {
  word_count: number;
  /** -1 when unknown (column not deployed): saves then skip the check. */
  content_version: number;
};

export type WritingDocument = BinderDoc;

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

/** Every column the binder reads. Never content. */
const LIST_COLUMNS =
  "id, world_id, entry_type, title, metadata, sort_order, parent_id, icon, color, tool_source, tool_data_id, layer, cover_image_url, tags, created_by, created_at, updated_at, word_count, content_version";

/** word_count / content_version are absent until 20261019_writing_scale.sql. */
let scaleColumns: boolean | null = null;

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  return typeof e.message === "string" && /column .* does not exist/i.test(e.message);
}

/** The binder rows of a world: metadata and word counts, no text. */
export async function fetchBinderRows(worldId: string): Promise<BinderDoc[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const base = (cols: string) =>
    db
      .from("world_entries")
      .select(cols)
      .eq("world_id", worldId)
      .in("entry_type", ["document", "folder"])
      .is("trashed_at", null)
      .order("updated_at", { ascending: false });

  if (scaleColumns !== false) {
    const { data, error } = await base(LIST_COLUMNS);
    if (!error) {
      scaleColumns = true;
      return (data ?? []) as BinderDoc[];
    }
    if (!isMissingColumn(error)) throw error;
    scaleColumns = false;
  }
  // Pre-migration database: count here once, then drop the text.
  const { data, error } = await base("*");
  if (error) throw error;
  return ((data ?? []) as WorldEntry[]).map(({ content, ...rest }) => ({
    ...rest,
    word_count: countWords(content),
    content_version: -1,
  }));
}

export function useWritingDocuments(worldId: string | undefined) {
  const query = useQuery<BinderDoc[]>({
    queryKey: docKeys.all(worldId!),
    queryFn: () => fetchBinderRows(worldId!),
    enabled: !!worldId,
    staleTime: 30_000,
  });

  // Derive the binder tree, plus the flat shapes older callers read
  // (Corkboard and Compile walk `folders` then `unfiledDocs`).
  const structured = useMemo(() => {
    const allEntries = query.data ?? [];
    const tree = buildBinderTree(allEntries);
    const docsOf = (n: BinderNode<BinderDoc>) =>
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
    const orderedDocs: { doc: BinderDoc; folder: WritingFolder | null }[] = [];
    const walk = (nodes: BinderNode<BinderDoc>[], folder: WritingFolder | null) => {
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
            (qc.getQueryData<BinderDoc[]>(docKeys.all(worldId!)) ?? []).filter(
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

/** What a confirmed save hands back (no text: the caller has it). */
export interface SavedDoc {
  id: string;
  updated_at: string;
  word_count: number;
  /** null when the column is not deployed yet. */
  content_version: number | null;
}

export interface SaveContentVars {
  docId: string;
  content: string;
  /**
   * The content_version the edits were made on. When given, the update only
   * lands if the server copy is still on it; otherwise SaveConflictError.
   * Omit (or null, or -1 for unknown) to write unconditionally.
   */
  baseVersion?: number | null;
}

const SAVED_COLUMNS = "id, updated_at, word_count, content_version";

/**
 * Write a document's text. Pure data layer (no React): the version check,
 * the zero-row diagnosis, and the pre-migration fallback.
 */
export async function saveDocumentContent({ docId, content, baseVersion }: SaveContentVars): Promise<SavedDoc> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const checked = typeof baseVersion === "number" && baseVersion >= 0;

  if (scaleColumns !== false) {
    let q = db.from("world_entries").update({ content }).eq("id", docId);
    if (checked) q = q.eq("content_version", baseVersion);
    const { data, error } = await q.select(SAVED_COLUMNS);
    if (!error) {
      const row = (data ?? [])[0] as SavedDoc | undefined;
      if (row) return row;
      return diagnoseZeroRows(docId, content, checked ? baseVersion : null);
    }
    if (!isMissingColumn(error)) throw error;
    scaleColumns = false;
  }

  // Pre-migration database: no version to check against.
  const { data, error } = await db
    .from("world_entries")
    .update({ content })
    .eq("id", docId)
    .select("id, updated_at");
  if (error) throw error;
  const row = (data ?? [])[0] as { id: string; updated_at: string } | undefined;
  if (!row) return diagnoseZeroRows(docId, content, null);
  return { ...row, word_count: countWords(content), content_version: null };
}

async function diagnoseZeroRows(docId: string, mine: string, baseVersion: number | null): Promise<SavedDoc> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const cols =
    scaleColumns === false
      ? "id, title, content, updated_at"
      : "id, title, content, updated_at, content_version, word_count";
  const { data } = await db.from("world_entries").select(cols).eq("id", docId).maybeSingle();
  const server: ServerDocCopy | null = data
    ? {
        id: data.id,
        title: data.title ?? null,
        content: data.content ?? null,
        updated_at: data.updated_at ?? null,
        content_version: typeof data.content_version === "number" ? data.content_version : null,
      }
    : null;
  const verdict = classifyZeroRowSave(server, baseVersion, mine);
  if (verdict === "same" && server) {
    return {
      id: server.id,
      updated_at: server.updated_at ?? new Date().toISOString(),
      word_count: typeof data.word_count === "number" ? data.word_count : countWords(mine),
      content_version: server.content_version,
    };
  }
  if (verdict === "conflict" && server) throw new SaveConflictError(docId, server, mine);
  throw new SaveDeniedError(docId);
}

/**
 * After a confirmed save: patch every cache that shows this document, in
 * place. The list is NOT invalidated (that refetched every row of a long
 * manuscript after each autosave).
 */
export function applySavedToCaches(
  qc: QueryClient,
  worldId: string | undefined,
  docId: string,
  content: string,
  row: SavedDoc,
): void {
  settleUnsaved(docId, content);
  if (worldId) {
    qc.setQueryData<BinderDoc[]>(docKeys.all(worldId), (list) =>
      patchRow(list, docId, {
        updated_at: row.updated_at,
        word_count: row.word_count,
        ...(row.content_version !== null ? { content_version: row.content_version } : {}),
      }),
    );
    patchDocContent(qc, worldId, docId, {
      updated_at: row.updated_at,
      content_version: row.content_version,
    });
  }
  // The editor header and the snapshot hook read the single-doc query; it
  // gets the saved copy without a round-trip.
  qc.setQueryData<{ content: string | null; updated_at: string; content_version?: number | null } | null>(
    ["write-doc", docId],
    (old) => (old ? { ...old, content, updated_at: row.updated_at, content_version: row.content_version } : old),
  );
}

export function useUpdateDocumentContent(
  worldId: string | undefined,
  opts: {
    /**
     * The caller reports failures itself (the Studio footer's UNSAVED,
     * RETRYING state, and one toast per failure run). Without this a timed
     * retry would toast every few seconds.
     */
    silentErrors?: boolean;
  } = {},
) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveDocumentContent,
    onSuccess: (row, variables) => {
      applySavedToCaches(qc, worldId, variables.docId, variables.content, row);
    },
    // A failed autosave used to be completely silent.
    onError: (error) => {
      if (opts.silentErrors) return;
      // A conflict or a viewer is not a failed save: the caller shows them.
      if (isSaveConflict(error) || isSaveDenied(error)) return;
      toast({
        title: "SAVE FAILED.",
        description: "Your words are held on this device. Retrying.",
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
            (qc.getQueryData<BinderDoc[]>(docKeys.all(worldId!)) ?? []).filter(
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
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Each row is its own request; a failed one used to be ignored, so the
      // binder showed an order the server never stored.
      const results = await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("world_entries").update({ sort_order: i * 10 }).eq("id", id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (orderedIds: string[]) => {
      // optimistic: reflect the new order immediately
      await qc.cancelQueries({ queryKey: docKeys.all(worldId!) });
      const prev = qc.getQueryData<BinderDoc[]>(docKeys.all(worldId!));
      if (prev) {
        const pos = new Map(orderedIds.map((id, i) => [id, i * 10]));
        qc.setQueryData<BinderDoc[]>(
          docKeys.all(worldId!),
          prev.map((e) => (pos.has(e.id) ? { ...e, sort_order: pos.get(e.id)! } : e)),
        );
      }
      return { prev };
    },
    onError: async (error, orderedIds, ctx) => {
      toast({ title: "REORDER FAILED.", description: mapError(error), variant: "destructive" });
      if (!ctx?.prev) return;
      qc.setQueryData(docKeys.all(worldId!), ctx.prev);
      // Some rows may have landed. Put them back to their previous order so
      // the server matches the rolled-back binder, not half of each.
      const before = new Map(ctx.prev.map((e) => [e.id, e.sort_order]));
      await Promise.all(
        orderedIds
          .filter((id) => before.has(id))
          .map((id) =>
            supabase.from("world_entries").update({ sort_order: before.get(id)! }).eq("id", id),
          ),
      ).catch(() => undefined);
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
      const prev = qc.getQueryData<BinderDoc[]>(docKeys.all(worldId!));
      if (prev) {
        const pos = new Map(plan.orderedIds.map((id, i) => [id, i * 10]));
        qc.setQueryData<BinderDoc[]>(
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
