// ---------------------------------------------------------------------------
// manuscript-import, what the writer picked → an import forest + preview.
//
// Formats: Markdown (.md, .markdown), plain text (.txt), Word (.docx, via
// mammoth), RTF (.rtf), a .zip of any of those (folders kept), and a
// Scrivener project (a picked .scriv folder or a .zip of one).
//
// Nothing here writes. useManuscriptImport writes the forest after the
// writer has seen the preview and confirmed.
// ---------------------------------------------------------------------------

import type { WritingLabel } from "@/lib/writing-labels";
import { markdownToHtml } from "./markdown";
import { plainTextToHtml, sanitizeImportHtml } from "./html";
import { rtfToHtml } from "./rtf";
import { importScrivener } from "./scrivener";
import { findScrivx, sourceFromFiles, sourceFromZip, type FileSource } from "./sources";
import {
  countImport,
  docNode,
  folderNode,
  naturalCompare,
  pruneEmptyFolders,
  splitHtmlAtHeadings,
  titleFromFileName,
  type ImportCounts,
  type ImportNode,
} from "./tree";

export * from "./tree";
export { markdownToHtml } from "./markdown";
export { sanitizeImportHtml, plainTextToHtml } from "./html";
export { rtfToHtml, rtfToText } from "./rtf";

export type ImportKind = "scrivener" | "files";

export interface ImportOptions {
  /** Split Markdown and Word files at H1/H2 (H1 → folder, H2 → document). */
  splitHeadings: boolean;
}

export interface ImportPreview {
  kind: ImportKind;
  /** Short name of what was picked, for the dialog header. */
  sourceName: string;
  nodes: ImportNode[];
  counts: ImportCounts;
  /** Scrivener only: the world's label set after merging (when labels were created). */
  labels?: WritingLabel[];
  labelsCreated: number;
  /** Files or binder items left behind, with why. */
  skipped: { media: number; unsupported: number; missingContent: number };
}

const TEXT_EXT = /\.(md|markdown|mdown|txt|text|docx|rtf|html?)$/i;

/** docx → editor HTML. mammoth loads only when a .docx is opened. */
export async function docxToHtml(data: ArrayBuffer): Promise<string> {
  const mammoth = (await import("mammoth")).default ?? (await import("mammoth"));
  // Node reads `buffer`, the browser build reads `arrayBuffer`; give both.
  const input = { arrayBuffer: data, buffer: new Uint8Array(data) } as unknown as { arrayBuffer: ArrayBuffer };
  const result = await mammoth.convertToHtml(input, {
    // Images are not prose and would bloat the document; drop them.
    convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: "" })),
  });
  return sanitizeImportHtml(result.value);
}

/** One file → nodes (one document, or a split forest). */
async function fileToNodes(source: FileSource, path: string, opts: ImportOptions): Promise<ImportNode[] | null> {
  const title = titleFromFileName(path);
  const lower = path.toLowerCase();
  let html: string;
  let splittable = false;
  if (/\.docx$/.test(lower)) {
    const buf = await source.readBinary(path);
    if (!buf) return null;
    html = await docxToHtml(buf);
    splittable = true;
  } else if (/\.(md|markdown|mdown)$/.test(lower)) {
    html = markdownToHtml((await source.readText(path)) ?? "");
    splittable = true;
  } else if (/\.rtf$/.test(lower)) {
    html = rtfToHtml((await source.readText(path)) ?? "");
  } else if (/\.html?$/.test(lower)) {
    html = sanitizeImportHtml((await source.readText(path)) ?? "");
    splittable = true;
  } else {
    html = plainTextToHtml((await source.readText(path)) ?? "");
  }
  if (splittable && opts.splitHeadings) return splitHtmlAtHeadings(html, title);
  return [docNode(title, html)];
}

/** A tree of files → a forest, directories as folders, natural order. */
async function filesToForest(
  source: FileSource,
  opts: ImportOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<{ nodes: ImportNode[]; unsupported: number }> {
  const paths = source.paths.slice().sort(naturalCompare);
  const usable = paths.filter((p) => TEXT_EXT.test(p));
  const unsupported = paths.length - usable.length;
  const root = folderNode("root");
  const folders = new Map<string, ImportNode>([["", root]]);
  const folderFor = (dir: string): ImportNode => {
    const hit = folders.get(dir);
    if (hit) return hit;
    const parentDir = dir.includes("/") ? dir.slice(0, dir.lastIndexOf("/")) : "";
    const node = folderNode(dir.split("/").pop() ?? dir);
    folderFor(parentDir).children.push(node);
    folders.set(dir, node);
    return node;
  };
  let done = 0;
  for (const p of usable) {
    const dir = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
    const nodes = await fileToNodes(source, p, opts);
    if (nodes) folderFor(dir).children.push(...nodes);
    done++;
    onProgress?.(done, usable.length);
    if (done % 10 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return { nodes: pruneEmptyFolders(root.children), unsupported };
}

/**
 * Read what the writer picked into a preview. `files` is the raw selection
 * (one zip, several files, or a directory listing).
 */
export async function buildImport(
  files: File[],
  opts: ImportOptions,
  existingLabels: WritingLabel[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportPreview> {
  if (!files.length) throw new Error("NO FILE SELECTED.");
  let source: FileSource;
  let sourceName: string;
  let fromZip = false;
  if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
    source = await sourceFromZip(await files[0].arrayBuffer());
    sourceName = files[0].name;
    fromZip = true;
  } else {
    source = sourceFromFiles(files);
    const rel = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath;
    sourceName = rel ? rel.split("/")[0] : files.length === 1 ? files[0].name : `${files.length} files`;
  }
  return buildImportFromSource(source, sourceName, opts, existingLabels, { fromZip, onProgress });
}

export async function buildImportFromSource(
  source: FileSource,
  sourceName: string,
  opts: ImportOptions,
  existingLabels: WritingLabel[],
  extra: { fromZip?: boolean; onProgress?: (done: number, total: number) => void } = {},
): Promise<ImportPreview> {
  const scrivx = findScrivx(source);
  if (scrivx) {
    const s = await importScrivener(source, scrivx, existingLabels, extra.onProgress);
    return {
      kind: "scrivener",
      sourceName: s.projectName,
      nodes: s.nodes,
      counts: countImport(s.nodes),
      ...(s.labelsCreated ? { labels: s.labels } : {}),
      labelsCreated: s.labelsCreated,
      skipped: { media: s.skippedMedia, unsupported: 0, missingContent: s.missingContent },
    };
  }
  const { nodes: forest, unsupported } = await filesToForest(source, opts, extra.onProgress);
  // A zip of loose files arrives as one folder named after the zip.
  const nodes =
    extra.fromZip && forest.length > 1 ? [folderNode(titleFromFileName(sourceName), forest)] : forest;
  return {
    kind: "files",
    sourceName,
    nodes,
    counts: countImport(nodes),
    labelsCreated: 0,
    skipped: { media: 0, unsupported, missingContent: 0 },
  };
}
