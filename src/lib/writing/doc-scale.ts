// ---------------------------------------------------------------------------
// doc-scale, the pure parts of keeping a long manuscript cheap.
//
// The binder list carries metadata and a stored word_count, never content
// (20261019_writing_scale.sql). Content is loaded per open document, or for
// the whole world only by the features that read every document (binder
// search, canon-changed badges, the capture scan, compile), and kept current
// in place as the writer types rather than refetched after each save.
//
// Saves carry the content_version they were made on. Zero rows updated is
// either another writer's save (a conflict, offered to the writer) or no
// write access (a viewer): never a silent overwrite, never a lost word.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { countWords } from "@/lib/text";
import type { WorldEntry } from "@/services/world-data";

/**
 * A binder row as the binder surfaces read it: the list row (stored
 * word_count, no text), or a full row that still carries content (tests,
 * older callers). Either way the words come from rowWords().
 */
export type BinderRowLike = Omit<WorldEntry, "content"> & {
  content?: string | null;
  word_count?: number | null;
};

/** Words in a binder row: the stored count, else counted from its text. */
export function rowWords(row: { word_count?: number | null; content?: string | null }): number {
  if (typeof row.word_count === "number") return row.word_count;
  return countWords(row.content ?? "");
}

/** One document's text as the server (or this device, unsaved) holds it. */
export interface DocContent {
  content: string;
  updated_at: string | null;
  /** null when unknown (the column is not deployed yet). */
  content_version: number | null;
}

export type ContentRecord = Readonly<Record<string, DocContent>>;

/** Split ids into request-sized groups (PostgREST URLs have a length cap). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  const n = Math.max(1, Math.floor(size));
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n));
  return out;
}

/**
 * Put one document's newest text into a content record. Returns the same
 * record when nothing changed (so React Query observers do not re-render),
 * and leaves the record alone when it does not hold the document.
 */
export function patchContent(
  record: ContentRecord | undefined,
  docId: string,
  patch: Partial<DocContent>,
): ContentRecord | undefined {
  if (!record) return record;
  const cur = record[docId];
  if (!cur) return record;
  const next: DocContent = { ...cur, ...patch };
  if (
    next.content === cur.content &&
    next.updated_at === cur.updated_at &&
    next.content_version === cur.content_version
  ) {
    return record;
  }
  return { ...record, [docId]: next };
}

/**
 * Lay words this device holds but the server has not confirmed over a
 * freshly fetched record, so a fetch that raced a pending save can never put
 * older text in front of a feature (or an editor that mounts from it).
 */
export function overlayUnsaved(
  record: Record<string, DocContent>,
  unsaved: ReadonlyMap<string, string>,
): Record<string, DocContent> {
  for (const [id, html] of unsaved) {
    const cur = record[id];
    if (cur && cur.content !== html) record[id] = { ...cur, content: html };
  }
  return record;
}

/** Update one row of a list in place; the same array when nothing changed. */
export function patchRow<T extends { id: string }>(
  list: T[] | undefined,
  id: string,
  patch: Partial<T>,
): T[] | undefined {
  if (!list) return list;
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return list;
  const row = list[i];
  const keys = Object.keys(patch) as (keyof T)[];
  if (keys.every((k) => row[k] === patch[k])) return list;
  const next = list.slice();
  next[i] = { ...row, ...patch };
  return next;
}

/** Rows with their text attached (rows the record does not hold get null). */
export function withContents<T extends { id: string }>(
  rows: readonly T[],
  record: ContentRecord | undefined,
): (T & { content: string | null })[] {
  return rows.map((r) => ({ ...r, content: record?.[r.id]?.content ?? null }));
}

// ---------------------------------------------------------------------------
// Optimistic concurrency
// ---------------------------------------------------------------------------

export interface ServerDocCopy {
  id: string;
  title: string | null;
  content: string | null;
  updated_at: string | null;
  content_version: number | null;
}

/** Another writer saved this document after the copy these edits sit on. */
export class SaveConflictError extends Error {
  readonly kind = "conflict" as const;
  constructor(
    readonly docId: string,
    readonly theirs: ServerDocCopy,
    readonly mine: string,
  ) {
    super("RECORD CHANGED ELSEWHERE.");
  }
}

/** The row is readable but this account may not write it (viewer access). */
export class SaveDeniedError extends Error {
  readonly kind = "denied" as const;
  constructor(readonly docId: string) {
    super("READ ONLY. VIEWER ACCESS.");
  }
}

export function isSaveConflict(e: unknown): e is SaveConflictError {
  return e instanceof SaveConflictError;
}
export function isSaveDenied(e: unknown): e is SaveDeniedError {
  return e instanceof SaveDeniedError;
}

/**
 * A save updated no rows. What happened?
 *   - "same":     the server already holds exactly these words (another tab
 *                 or device saved them); treat as saved
 *   - "conflict": the server copy moved past the version the edits sit on
 *   - "denied":   nothing moved, or the row is not visible: no write access
 */
export function classifyZeroRowSave(
  server: ServerDocCopy | null,
  baseVersion: number | null | undefined,
  mine: string,
): "same" | "conflict" | "denied" {
  if (!server) return "denied";
  if ((server.content ?? "") === mine) return "same";
  if (
    baseVersion !== null &&
    baseVersion !== undefined &&
    server.content_version !== null &&
    server.content_version !== baseVersion
  ) {
    return "conflict";
  }
  return "denied";
}

// ---------------------------------------------------------------------------
// Scrivenings virtualization
// ---------------------------------------------------------------------------

/** Words per line at the writing measure (68ch of Lora at the prose size). */
const WORDS_PER_LINE = 11;
const LINE_PX = 32;
const MIN_SECTION_PX = 96;

/**
 * Height a section's placeholder takes before its editor mounts: the height
 * last measured for it if there is one, else an estimate from its stored
 * word count, so the scrollbar and scroll position stay honest.
 */
export function estimateSectionHeight(words: number, measuredPx?: number | null): number {
  if (measuredPx && measuredPx > 0) return Math.round(measuredPx);
  const lines = Math.ceil(Math.max(0, words) / WORDS_PER_LINE);
  return Math.max(MIN_SECTION_PX, lines * LINE_PX);
}
