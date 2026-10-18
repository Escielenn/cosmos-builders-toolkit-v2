// ---------------------------------------------------------------------------
// tree, the shape every importer produces and the import writes.
//
// An ImportNode is a folder or a document with its HTML and card metadata.
// Importers (Markdown, plain text, DOCX, Scrivener) build a forest of them;
// the preview counts it; planImportRows turns it into world_entries rows in
// parent-before-child order, appended after whatever the binder already
// holds. Imports are additive only: nothing here can address an existing row
// except as a parent the writer chose, and top-level names that collide with
// existing ones are suffixed rather than merged.
//
// Pure: no React, no network. Tested.
// ---------------------------------------------------------------------------

import { countWords } from "@/lib/text";
import { writeDocMeta, type DocumentMeta } from "@/lib/document-meta";

export interface ImportNode {
  kind: "folder" | "doc";
  title: string;
  /** Tiptap HTML. Folders carry "" (or folder text, kept as a first doc). */
  html: string;
  /** Card metadata for documents (Scrivener synopsis, notes, label, …). */
  meta?: Partial<DocumentMeta>;
  /** False when the source excluded it from compile (Scrivener). */
  includeInCompile?: boolean;
  children: ImportNode[];
}

export interface ImportCounts {
  folders: number;
  documents: number;
  words: number;
}

export function folderNode(title: string, children: ImportNode[] = []): ImportNode {
  return { kind: "folder", title: title.trim() || "Untitled folder", html: "", children };
}

export function docNode(title: string, html: string, meta?: Partial<DocumentMeta>): ImportNode {
  return { kind: "doc", title: title.trim() || "Untitled", html, children: [], ...(meta ? { meta } : {}) };
}

export function countImport(nodes: ImportNode[]): ImportCounts {
  const c: ImportCounts = { folders: 0, documents: 0, words: 0 };
  const walk = (list: ImportNode[]) => {
    for (const n of list) {
      if (n.kind === "folder") c.folders++;
      else {
        c.documents++;
        c.words += countWords(n.html);
      }
      walk(n.children);
    }
  };
  walk(nodes);
  return c;
}

/** Ship's Voice result line: "MANUSCRIPT IMPORTED. 42 DOCUMENTS. 98,214 WORDS." */
export function importResultLine(c: ImportCounts): string {
  const docs = `${c.documents.toLocaleString("en-US")} DOCUMENT${c.documents === 1 ? "" : "S"}`;
  const words = `${c.words.toLocaleString("en-US")} WORD${c.words === 1 ? "" : "S"}`;
  return `MANUSCRIPT IMPORTED. ${docs}. ${words}.`;
}

/**
 * A name not already taken among `taken` (case-insensitive): "Draft",
 * "Draft (2)", "Draft (3)". Adds the result to `taken`.
 */
export function uniqueTitle(title: string, taken: Set<string>): string {
  const base = title.trim() || "Untitled";
  let candidate = base;
  let n = 2;
  while (taken.has(candidate.toLowerCase())) candidate = `${base} (${n++})`;
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** Suffix top-level titles that collide with existing root titles (or each other). */
export function dedupeTopLevel(nodes: ImportNode[], existingRootTitles: string[]): ImportNode[] {
  const taken = new Set(existingRootTitles.map((t) => (t || "Untitled").trim().toLowerCase()));
  return nodes.map((n) => ({ ...n, title: uniqueTitle(n.title, taken) }));
}

/** Drop folders that hold nothing at all (e.g. a zip directory of images). */
export function pruneEmptyFolders(nodes: ImportNode[]): ImportNode[] {
  const out: ImportNode[] = [];
  for (const n of nodes) {
    if (n.kind === "folder") {
      const children = pruneEmptyFolders(n.children);
      if (children.length) out.push({ ...n, children });
    } else out.push(n);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

export interface ImportRow {
  id: string;
  parent_id: string | null;
  title: string;
  entry_type: "folder" | "document";
  content: string;
  metadata: Record<string, unknown>;
  sort_order: number;
  /** 0 for top-level rows. Rows are emitted in non-decreasing depth. */
  depth: number;
  includeInCompile: boolean;
}

/**
 * Plan rows in breadth-first order (every parent before its children), so
 * a chunked insert never references a parent that is not yet written.
 * `rootSortStart` is the first sort_order for top-level rows (after the
 * binder's existing root items); children start at 0. Steps of 10, like the
 * binder's own reorder.
 */
export function planImportRows(
  nodes: ImportNode[],
  opts: { parentId: string | null; rootSortStart: number; newId: () => string },
): ImportRow[] {
  const rows: ImportRow[] = [];
  let level: { node: ImportNode; parentId: string | null; sort: number }[] = nodes.map((node, i) => ({
    node,
    parentId: opts.parentId,
    sort: opts.rootSortStart + i * 10,
  }));
  let depth = 0;
  while (level.length) {
    const next: typeof level = [];
    for (const { node, parentId, sort } of level) {
      const id = opts.newId();
      rows.push({
        id,
        parent_id: parentId,
        title: node.title,
        entry_type: node.kind === "folder" ? "folder" : "document",
        content: node.kind === "doc" ? node.html : "",
        metadata: node.kind === "doc" && node.meta ? writeDocMeta({}, node.meta) : {},
        sort_order: sort,
        depth,
        includeInCompile: node.includeInCompile !== false,
      });
      node.children.forEach((child, i) => next.push({ node: child, parentId: id, sort: i * 10 }));
    }
    level = next;
    depth++;
  }
  return rows;
}

/** Split rows into insert chunks of at most `size`, never mixing depths. */
export function chunkRows(rows: ImportRow[], size = 50): ImportRow[][] {
  const chunks: ImportRow[][] = [];
  let cur: ImportRow[] = [];
  for (const r of rows) {
    if (cur.length && (cur.length >= size || cur[0].depth !== r.depth)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(r);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

// ---------------------------------------------------------------------------
// Splitting at headings
// ---------------------------------------------------------------------------

/**
 * Split editor HTML at top-level <h1>/<h2> into a forest.
 *
 * When both levels appear, H1 opens a folder and H2 a document inside it.
 * When only one appears, each heading opens a document. Text before the first
 * heading becomes a document titled `leadTitle`; text directly under an H1
 * before its first H2 becomes a document titled with the H1. Heading text is
 * the title and is not repeated in the body.
 */
export function splitHtmlAtHeadings(html: string, leadTitle: string): ImportNode[] {
  const parts = html.split(/(?=<h[12][ >])/i);
  const heads = parts
    .map((p) => /^<h([12])[^>]*>([\s\S]*?)<\/h\1>/i.exec(p))
    .filter((m): m is RegExpExecArray => !!m);
  const levels = new Set(heads.map((m) => m[1]));
  if (levels.size === 0) return [docNode(leadTitle, html)];
  const twoLevel = levels.size === 2;
  const text = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();

  const out: ImportNode[] = [];
  let folder: ImportNode | null = null;
  for (const part of parts) {
    const m = /^<h([12])[^>]*>([\s\S]*?)<\/h\1>/i.exec(part);
    if (!m) {
      if (part.replace(/<[^>]+>/g, "").trim()) out.push(docNode(leadTitle, part));
      continue;
    }
    const title = text(m[2]) || "Untitled";
    const body = part.slice(m[0].length);
    const hasBody = !!body.replace(/<[^>]+>/g, "").trim();
    if (twoLevel && m[1] === "1") {
      folder = folderNode(title);
      if (hasBody) folder.children.push(docNode(title, body));
      out.push(folder);
      continue;
    }
    const doc = docNode(title, body);
    if (twoLevel && folder) folder.children.push(doc);
    else out.push(doc);
  }
  return out;
}

/** Natural sort for file names: "Chapter 2" before "Chapter 10". */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** A file name without its folder and extension, tidied into a title. */
export function titleFromFileName(name: string): string {
  const base = name.split("/").pop() ?? name;
  return base.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim() || "Untitled";
}
