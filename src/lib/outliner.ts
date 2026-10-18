// ---------------------------------------------------------------------------
// outliner, the binder as a table: one row per folder or document in reading
// order, with the inspector's card fields as columns.
//
// Folder rows aggregate their descendants (words, targets, document count),
// so a chapter's row reads as the chapter's total. Totals count documents
// only, so nothing is counted twice.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import type { BinderEntry, BinderNode } from "@/lib/binder-tree";
import { readDocMeta, type DocumentMeta } from "@/lib/document-meta";
import { rowWords } from "@/lib/writing/doc-scale";

export const OUTLINER_COLUMNS = [
  "synopsis",
  "label",
  "status",
  "pov",
  "keywords",
  "words",
  "target",
  "modified",
] as const;

export type OutlinerColumn = (typeof OUTLINER_COLUMNS)[number];

export const COLUMN_LABELS: Record<OutlinerColumn, string> = {
  synopsis: "Synopsis",
  label: "Label",
  status: "Status",
  pov: "POV",
  keywords: "Keywords",
  words: "Words",
  target: "Target",
  modified: "Modified",
};

export const DEFAULT_COLUMNS: OutlinerColumn[] = [
  "synopsis",
  "label",
  "status",
  "words",
  "target",
  "modified",
];

/** Validate a stored column list. Canonical order; default if unusable. */
export function sanitizeColumns(raw: unknown): OutlinerColumn[] {
  if (!Array.isArray(raw)) return [...DEFAULT_COLUMNS];
  const want = new Set(raw.filter((c): c is string => typeof c === "string"));
  return OUTLINER_COLUMNS.filter((c) => want.has(c));
}

export function toggleColumn(cols: OutlinerColumn[], col: OutlinerColumn): OutlinerColumn[] {
  const set = new Set(cols);
  if (set.has(col)) set.delete(col);
  else set.add(col);
  return OUTLINER_COLUMNS.filter((c) => set.has(c));
}

export interface OutlinerEntry extends BinderEntry {
  content?: string | null;
  /** Stored word count (the binder list); counted from content when absent. */
  word_count?: number | null;
  metadata?: unknown;
  updated_at?: string | null;
}

export interface OutlinerRow<T extends OutlinerEntry = OutlinerEntry> {
  entry: T;
  isFolder: boolean;
  depth: number;
  /** Document card fields; null for a folder. */
  meta: DocumentMeta | null;
  /** Own words for a document; descendants' total for a folder. */
  words: number;
  /** Own target for a document; sum of descendant targets for a folder. */
  target: number;
  /** Documents inside a folder at any depth (1 for a document). */
  docCount: number;
  /** Has children (folders only), for the expand control. */
  hasChildren: boolean;
}

/**
 * Rows in reading order. Children of a collapsed folder are skipped, but the
 * folder's aggregates still include them.
 */
export function buildOutlinerRows<T extends OutlinerEntry>(
  tree: BinderNode<T>[],
  collapsed: ReadonlySet<string> = new Set(),
): OutlinerRow<T>[] {
  const out: OutlinerRow<T>[] = [];

  // Returns [words, target, docCount] for the subtree and pushes rows.
  const visit = (node: BinderNode<T>, emit: boolean): [number, number, number] => {
    if (!node.isFolder) {
      const meta = readDocMeta(node.entry.metadata);
      const words = rowWords(node.entry);
      if (emit) {
        out.push({
          entry: node.entry,
          isFolder: false,
          depth: node.depth,
          meta,
          words,
          target: meta.target,
          docCount: 1,
          hasChildren: false,
        });
      }
      return [words, meta.target, 1];
    }
    const row: OutlinerRow<T> = {
      entry: node.entry,
      isFolder: true,
      depth: node.depth,
      meta: null,
      words: 0,
      target: 0,
      docCount: 0,
      hasChildren: node.children.length > 0,
    };
    if (emit) out.push(row);
    const showKids = emit && !collapsed.has(node.entry.id);
    for (const c of node.children) {
      const [w, t, d] = visit(c, showKids);
      row.words += w;
      row.target += t;
      row.docCount += d;
    }
    return [row.words, row.target, row.docCount];
  };

  for (const n of tree) visit(n, true);
  return out;
}

export interface OutlinerTotals {
  words: number;
  target: number;
  docs: number;
}

/** Totals over every document in the tree (collapse does not hide words). */
export function outlinerTotals<T extends OutlinerEntry>(tree: BinderNode<T>[]): OutlinerTotals {
  const rows = buildOutlinerRows(tree);
  let words = 0;
  let target = 0;
  let docs = 0;
  for (const r of rows) {
    if (r.isFolder) continue;
    words += r.words;
    target += r.target;
    docs += 1;
  }
  return { words, target, docs };
}

/** Cut to `max` characters at a word boundary, with an ellipsis. */
export function truncateText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

/** Compact "modified" stamp: time today, else day and month (year if not this year). */
export function formatModified(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}
