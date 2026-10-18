// ---------------------------------------------------------------------------
// Document text, loaded only where it is read.
//
// The binder list (useWritingDocuments) selects metadata and word_count,
// never content. Text comes from here:
//   - useWorldDocumentContents(worldId, { enabled }): every document's text,
//     for the features that genuinely read all of it (binder full-text search
//     and saved searches, canon-changed badges, the capture scan of other
//     documents, compile). Fetched once when first enabled, kept for minutes,
//     and kept current IN PLACE as the writer types (patchDocContent), so a
//     save never refetches it.
//   - useDocumentContentSet(worldId, ids): the documents one surface opens
//     (Scrivenings).
//   - the single-document query ["write-doc", id] (useWriteDoc) for one.
//
// Words typed on this device and not yet confirmed by the server are held in
// an in-memory overlay (noteUnsaved / settleUnsaved) and laid over every
// fetch, so a fetch racing a pending save never opens an older copy.
// ---------------------------------------------------------------------------

import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  chunk,
  overlayUnsaved,
  patchContent,
  type ContentRecord,
  type DocContent,
} from "@/lib/writing/doc-scale";

export const contentKeys = {
  /** Prefix for every content query of a world (whole world and sets). */
  root: (worldId: string) => ["writing-doc-contents", worldId] as const,
  world: (worldId: string) => ["writing-doc-contents", worldId, "all"] as const,
  set: (worldId: string, ids: readonly string[]) =>
    ["writing-doc-contents", worldId, "set", ids.join(",")] as const,
};

// ---- the unsaved overlay ----------------------------------------------------

const unsaved = new Map<string, string>();

/** Words typed for a document that the server has not confirmed yet. */
export function noteUnsaved(docId: string, html: string): void {
  unsaved.set(docId, html);
}

/** A save of `savedHtml` landed; forget the overlay if it holds exactly that. */
export function settleUnsaved(docId: string, savedHtml: string): void {
  if (unsaved.get(docId) === savedHtml) unsaved.delete(docId);
}

/** The writer chose the server copy (or discarded): drop the overlay. */
export function dropUnsaved(docId: string): void {
  unsaved.delete(docId);
}

/** This device's newest unsaved words for a document, if any. */
export function unsavedHtml(docId: string): string | undefined {
  return unsaved.get(docId);
}

// ---- fetching ---------------------------------------------------------------

/** content_version is absent until 20261019_writing_scale.sql is applied. */
let versionColumn: boolean | null = null;

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  return typeof e.message === "string" && /column .* does not exist/i.test(e.message);
}

interface ContentRow {
  id: string;
  content: string | null;
  updated_at: string | null;
  content_version?: number | null;
}

const IDS_PER_REQUEST = 120;

async function selectContents(
  apply: (q: ReturnType<typeof baseSelect>) => ReturnType<typeof baseSelect>,
): Promise<ContentRow[]> {
  const run = async (withVersion: boolean) => {
    const cols = withVersion ? "id, content, updated_at, content_version" : "id, content, updated_at";
    return apply(baseSelect(cols));
  };
  let res = await run(versionColumn !== false);
  if (res.error && versionColumn !== false && isMissingColumn(res.error)) {
    versionColumn = false;
    res = await run(false);
  }
  if (res.error) throw res.error;
  if (versionColumn === null) versionColumn = true;
  return (res.data ?? []) as ContentRow[];
}

function baseSelect(cols: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("world_entries").select(cols);
}

function toRecord(rows: ContentRow[]): Record<string, DocContent> {
  const out: Record<string, DocContent> = {};
  for (const r of rows) {
    out[r.id] = {
      content: r.content ?? "",
      updated_at: r.updated_at ?? null,
      content_version: typeof r.content_version === "number" ? r.content_version : null,
    };
  }
  return overlayUnsaved(out, unsaved);
}

/** Text of every manuscript document in a world (not folders, not trashed). */
export async function fetchWorldContents(worldId: string): Promise<Record<string, DocContent>> {
  const rows = await selectContents((q) =>
    q.eq("world_id", worldId).eq("entry_type", "document").is("trashed_at", null),
  );
  return toRecord(rows);
}

/** Text of the given documents, in request-sized groups. */
export async function fetchDocContents(ids: readonly string[]): Promise<Record<string, DocContent>> {
  const groups = chunk(ids, IDS_PER_REQUEST);
  const parts = await Promise.all(groups.map((g) => selectContents((q) => q.in("id", g))));
  return toRecord(parts.flat());
}

// ---- hooks ------------------------------------------------------------------

/**
 * Every document's text for a world, only while `enabled`. Not refetched on
 * focus or after saves: typing patches it in place (patchDocContent).
 */
export function useWorldDocumentContents(
  worldId: string | undefined,
  opts: { enabled: boolean },
) {
  return useQuery<ContentRecord>({
    queryKey: contentKeys.world(worldId ?? ""),
    queryFn: () => fetchWorldContents(worldId!),
    enabled: !!worldId && opts.enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Every document's text for a world, on demand, outside a hook (a dialog
 * that opens and needs the whole manuscript, e.g. project-wide replace).
 * Shares the useWorldDocumentContents cache: no second fetch when it is
 * already loaded and fresh, and the result is kept current in place.
 */
export function ensureWorldContents(qc: QueryClient, worldId: string): Promise<ContentRecord> {
  return qc.fetchQuery<ContentRecord>({
    queryKey: contentKeys.world(worldId),
    queryFn: () => fetchWorldContents(worldId),
    staleTime: 5 * 60_000,
  });
}

/** The text of a fixed set of documents (Scrivenings opens these). */
export function useDocumentContentSet(worldId: string | undefined, ids: readonly string[]) {
  return useQuery<ContentRecord>({
    queryKey: contentKeys.set(worldId ?? "", ids),
    queryFn: () => fetchDocContents(ids),
    enabled: !!worldId && ids.length > 0,
    // Opened once per Scrivenings session; the sections own their text after.
    staleTime: Infinity,
    gcTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Put one document's newest text into every content query of its world that
 * holds it, without a fetch. Called as the writer types and after saves.
 */
export function patchDocContent(
  qc: QueryClient,
  worldId: string,
  docId: string,
  patch: Partial<DocContent>,
): void {
  qc.setQueriesData<ContentRecord>({ queryKey: contentKeys.root(worldId) }, (rec) =>
    patchContent(rec, docId, patch),
  );
}

/** For tests: forget module state. */
export function __resetDocContentsForTests(): void {
  unsaved.clear();
  versionColumn = null;
}
