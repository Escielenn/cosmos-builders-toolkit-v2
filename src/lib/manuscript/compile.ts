// ---------------------------------------------------------------------------
// compile, the binder → a manuscript every output format renders.
//
// Settings live per world at worlds.settings.compile (the jsonb column from
// 20261018_writing_p1.sql), with a localStorage fallback until it exists.
// Ordering here is a COMPILE order: it never moves anything in the binder.
// Exclusion is by document or folder id; an excluded folder drops its subtree.
//
// Chapters: a folder that directly holds included documents is a chapter
// (numbered when numbering is on). A folder that only holds folders is a
// part heading (never numbered), unless it is the one top-level container
// of the whole book ("Manuscript"), which prints nothing. A document at the
// top level is its own section titled by itself (Prologue, Epilogue). When
// no folder holds documents at all, top-level documents are the chapters.
//
// Pure: no React, no network. Tested in src/lib/__tests__/manuscript-compile.test.ts.
// ---------------------------------------------------------------------------

import { htmlToBlocks, blocksWordCount, type Block } from "./blocks";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const COMPILE_FORMATS = ["docx", "pdf", "epub", "md", "txt"] as const;
export type CompileFormat = (typeof COMPILE_FORMATS)[number];

export const SEPARATORS = ["none", "blank", "hash", "stars", "custom"] as const;
export type SeparatorStyle = (typeof SEPARATORS)[number];

export const NUMBERINGS = ["none", "chapter", "words", "roman"] as const;
export type NumberingStyle = (typeof NUMBERINGS)[number];

export const PRESETS = ["submission", "reading", "ebook", "custom"] as const;
export type CompilePresetId = (typeof PRESETS)[number];

export type ManuscriptFont = "times" | "courier";

export interface CompileSettings {
  preset: CompilePresetId;
  format: CompileFormat;
  /** Document or folder ids left out of the compile. */
  excluded: string[];
  /** Compile-only sibling order: parent id (or "root") → child ids. */
  order: Record<string, string[]>;
  separator: SeparatorStyle;
  customSeparator: string;
  /** Print folder (chapter) headings. */
  folderHeadings: boolean;
  numbering: NumberingStyle;
  /** Print the folder's own title with its number ("Chapter 3: The Fall"). */
  folderTitles: boolean;
  /** Print each document's title as a scene heading. */
  docTitles: boolean;
  titlePage: boolean;
  title: string;
  subtitle: string;
  author: string;
  /** Multi-line contact block for the title page (address, email, agent). */
  contact: string;
  includeAbout: boolean;
  aboutAuthor: string;
  includeAppendix: boolean;
  font: ManuscriptFont;
  doubleSpaced: boolean;
}

export const DEFAULT_COMPILE: CompileSettings = {
  preset: "submission",
  format: "docx",
  excluded: [],
  order: {},
  separator: "hash",
  customSeparator: "",
  folderHeadings: true,
  numbering: "chapter",
  folderTitles: true,
  docTitles: false,
  titlePage: true,
  title: "",
  subtitle: "",
  author: "",
  contact: "",
  includeAbout: false,
  aboutAuthor: "",
  includeAppendix: false,
  font: "times",
  doubleSpaced: true,
};

/** What each preset sets. Front matter text, selection and order are never touched. */
export const PRESET_VALUES: Record<Exclude<CompilePresetId, "custom">, Partial<CompileSettings>> = {
  submission: {
    format: "docx",
    separator: "hash",
    folderHeadings: true,
    numbering: "chapter",
    folderTitles: false,
    docTitles: false,
    titlePage: true,
    doubleSpaced: true,
    font: "times",
  },
  reading: {
    format: "pdf",
    separator: "stars",
    folderHeadings: true,
    numbering: "words",
    folderTitles: true,
    docTitles: false,
    titlePage: true,
    doubleSpaced: false,
    font: "times",
  },
  ebook: {
    format: "epub",
    separator: "stars",
    folderHeadings: true,
    numbering: "chapter",
    folderTitles: true,
    docTitles: false,
    titlePage: true,
    doubleSpaced: false,
  },
};

export const PRESET_LABELS: Record<CompilePresetId, string> = {
  submission: "Standard Manuscript (submission)",
  reading: "Reading copy",
  ebook: "Ebook",
  custom: "Custom",
};

export function applyPreset(s: CompileSettings, preset: CompilePresetId): CompileSettings {
  if (preset === "custom") return { ...s, preset };
  return { ...s, ...PRESET_VALUES[preset], preset };
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function text(v: unknown, max = 4000): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}
function ids(v: unknown): string[] {
  return Array.isArray(v) ? Array.from(new Set(v.filter((x): x is string => typeof x === "string" && !!x))) : [];
}

/** Read settings from untyped JSON. Never throws; unknown keys are dropped. */
export function sanitizeCompileSettings(raw: unknown): CompileSettings {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const order: Record<string, string[]> = {};
  if (r.order && typeof r.order === "object" && !Array.isArray(r.order)) {
    for (const [k, v] of Object.entries(r.order as Record<string, unknown>)) {
      const list = ids(v);
      if (list.length) order[k] = list;
    }
  }
  const d = DEFAULT_COMPILE;
  return {
    preset: pick(r.preset, PRESETS, d.preset),
    format: pick(r.format, COMPILE_FORMATS, d.format),
    excluded: ids(r.excluded),
    order,
    separator: pick(r.separator, SEPARATORS, d.separator),
    customSeparator: text(r.customSeparator, 80),
    folderHeadings: bool(r.folderHeadings, d.folderHeadings),
    numbering: pick(r.numbering, NUMBERINGS, d.numbering),
    folderTitles: bool(r.folderTitles, d.folderTitles),
    docTitles: bool(r.docTitles, d.docTitles),
    titlePage: bool(r.titlePage, d.titlePage),
    title: text(r.title, 300),
    subtitle: text(r.subtitle, 300),
    author: text(r.author, 200),
    contact: text(r.contact, 1000),
    includeAbout: bool(r.includeAbout, d.includeAbout),
    aboutAuthor: text(r.aboutAuthor, 8000),
    includeAppendix: bool(r.includeAppendix, d.includeAppendix),
    font: pick(r.font, ["times", "courier"] as const, d.font),
    doubleSpaced: bool(r.doubleSpaced, d.doubleSpaced),
  };
}

/** Merge compile settings into worlds.settings, preserving every other key. */
export function writeCompileSettings(settings: unknown, compile: CompileSettings): Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? { ...(settings as Record<string, unknown>) }
      : {};
  base.compile = sanitizeCompileSettings(compile);
  return base;
}

/** Add ids to the exclusion list (import marks IncludeInCompile = No this way). */
export function withExcluded(s: CompileSettings, add: string[]): CompileSettings {
  if (!add.length) return s;
  return { ...s, excluded: Array.from(new Set([...s.excluded, ...add])) };
}

// ---------------------------------------------------------------------------
// Numbering and separators
// ---------------------------------------------------------------------------

const ONES = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** 1 → "One", 21 → "Twenty-One", 105 → "One Hundred Five" (to 9,999). */
export function numberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  n = Math.floor(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${numberToWords(n % 100)}` : ""}`;
  if (n < 10000) return `${numberToWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${numberToWords(n % 1000)}` : ""}`;
  return String(n);
}

export function toRoman(n: number): string {
  if (!Number.isFinite(n) || n <= 0 || n >= 4000) return String(n);
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let rest = Math.floor(n);
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}

/** The chapter label for a style, or null when numbering is off. */
export function chapterLabel(n: number, style: NumberingStyle): string | null {
  if (style === "chapter") return `Chapter ${n}`;
  if (style === "words") return numberToWords(n);
  if (style === "roman") return toRoman(n);
  return null;
}

/** The scene separator line, "" for a blank line, or null for none. */
export function separatorText(style: SeparatorStyle, custom: string): string | null {
  if (style === "none") return null;
  if (style === "blank") return "";
  if (style === "hash") return "#";
  if (style === "stars") return "* * *";
  return custom.trim() || "* * *";
}

/**
 * Manuscript convention: "about 98,000 words", rounded to the nearest
 * thousand; short work rounds to the nearest hundred.
 */
export function roundWordCount(words: number): number {
  if (words <= 0) return 0;
  if (words < 1000) return Math.max(100, Math.round(words / 100) * 100);
  return Math.round(words / 1000) * 1000;
}

export function approxWordsLine(words: number): string {
  return `about ${roundWordCount(words).toLocaleString("en-US")} words`;
}

/** The surname for the running header: the last word of the byline. */
export function surnameOf(author: string): string {
  const parts = author.replace(/,.*$/, "").trim().split(/\s+/).filter(Boolean);
  // "Jason D. Batt, Ph.D." → "Batt"
  return parts.length ? parts[parts.length - 1] : "";
}

// ---------------------------------------------------------------------------
// Tree → manuscript
// ---------------------------------------------------------------------------

export interface CompileNode {
  id: string;
  title: string;
  isFolder: boolean;
  /** Stored editor HTML (documents). */
  html: string;
  children: CompileNode[];
}

/** Sort each sibling list by the compile order; unknown ids keep binder order after. */
export function applyCompileOrder(nodes: CompileNode[], order: Record<string, string[]>, parentKey = "root"): CompileNode[] {
  const wanted = order[parentKey];
  let list = nodes;
  if (wanted?.length) {
    const pos = new Map(wanted.map((id, i) => [id, i]));
    list = nodes
      .map((n, i) => ({ n, i }))
      .sort((a, b) => {
        const pa = pos.has(a.n.id) ? pos.get(a.n.id)! : wanted.length + a.i;
        const pb = pos.has(b.n.id) ? pos.get(b.n.id)! : wanted.length + b.i;
        return pa - pb;
      })
      .map((x) => x.n);
  }
  return list.map((n) => (n.isFolder ? { ...n, children: applyCompileOrder(n.children, order, n.id) } : n));
}

/** Move one id up or down among its siblings; returns the new order map. */
export function moveInOrder(
  siblings: string[],
  id: string,
  delta: number,
  order: Record<string, string[]>,
  parentKey: string,
): Record<string, string[]> {
  const list = siblings.slice();
  const from = list.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return order;
  list.splice(from, 1);
  list.splice(to, 0, id);
  return { ...order, [parentKey]: list };
}

/** Drop excluded documents and excluded folders (with their subtrees). */
export function filterExcluded(nodes: CompileNode[], excluded: Set<string>): CompileNode[] {
  const out: CompileNode[] = [];
  for (const n of nodes) {
    if (excluded.has(n.id)) continue;
    out.push(n.isFolder ? { ...n, children: filterExcluded(n.children, excluded) } : n);
  }
  return out;
}

export interface CompiledDoc {
  id: string;
  title: string;
  blocks: Block[];
}

export interface ManuscriptSection {
  id: string;
  kind: "chapter" | "part" | "loose" | "continued";
  /** "Chapter 3", "Three", "III", or null. */
  label: string | null;
  /** The folder or document title when printed, or null. */
  title: string | null;
  docs: CompiledDoc[];
}

export interface Manuscript {
  title: string;
  subtitle: string;
  author: string;
  contact: string;
  words: number;
  titlePage: boolean;
  /** Separator between documents inside a section ("" blank line, null none). */
  separator: string | null;
  docTitles: boolean;
  sections: ManuscriptSection[];
  about: string | null;
  /** World reference appendix as blocks, or null. */
  appendix: Block[] | null;
  font: ManuscriptFont;
  doubleSpaced: boolean;
}

/** The heading line(s) of a section, joined for one-line formats. */
export function sectionHeading(s: ManuscriptSection): string | null {
  if (s.label && s.title) return `${s.label}: ${s.title}`;
  return s.label ?? s.title;
}

const GENERIC_TITLE = /^(chapter|part|book)\s+([0-9]+|[ivxlcdm]+|[a-z-]+)$|^(new folder|untitled( folder)?)$/i;

export function buildManuscript(
  tree: CompileNode[],
  settings: CompileSettings,
  extras: { appendixHtml?: string; fallbackTitle?: string; fallbackAuthor?: string } = {},
): Manuscript {
  const ordered = filterExcluded(applyCompileOrder(tree, settings.order), new Set(settings.excluded));
  const sections: ManuscriptSection[] = [];
  const blocksOf = (n: CompileNode): CompiledDoc => ({ id: n.id, title: n.title || "Untitled", blocks: htmlToBlocks(n.html) });

  const hasDirectDocs = (n: CompileNode) => n.children.some((c) => !c.isFolder);
  const anyChapterFolder = (list: CompileNode[]): boolean =>
    list.some((n) => n.isFolder && (hasDirectDocs(n) || anyChapterFolder(n.children)));
  const folderMode = anyChapterFolder(ordered);
  // One top-level folder holding everything prints no heading of its own.
  const soleContainer = ordered.length === 1 && ordered[0].isFolder && !hasDirectDocs(ordered[0]) ? ordered[0].id : null;

  let chapterNo = 0;
  const heading = (n: CompileNode, numbered: boolean) => {
    if (!settings.folderHeadings) return { label: null, title: null };
    if (numbered) {
      chapterNo++;
      const label = chapterLabel(chapterNo, settings.numbering);
      if (!label) return { label: null, title: n.title || "Untitled" };
      const showTitle = settings.folderTitles && !!n.title && !GENERIC_TITLE.test(n.title.trim());
      return { label, title: showTitle ? n.title : null };
    }
    return { label: null, title: n.title || "Untitled" };
  };

  const walkFolder = (folder: CompileNode) => {
    const isChapter = hasDirectDocs(folder);
    if (!isChapter && folder.id !== soleContainer && folder.children.length) {
      sections.push({ id: folder.id, kind: "part", ...heading(folder, false), docs: [] });
    }
    let current: ManuscriptSection | null = null;
    let opened = false;
    for (const c of folder.children) {
      if (c.isFolder) {
        current = null;
        walkFolder(c);
        continue;
      }
      if (!current) {
        // Documents after a nested folder continue the chapter without a new heading.
        current = !opened
          ? { id: folder.id, kind: "chapter", ...heading(folder, true), docs: [] }
          : { id: `${folder.id}:${c.id}`, kind: "continued", label: null, title: null, docs: [] };
        opened = true;
        sections.push(current);
      }
      current.docs.push(blocksOf(c));
    }
  };

  for (const n of ordered) {
    if (n.isFolder) {
      walkFolder(n);
      continue;
    }
    // Top-level document: its own section. Without chapter folders it is a chapter.
    if (folderMode) sections.push({ id: n.id, kind: "loose", ...heading(n, false), docs: [blocksOf(n)] });
    else sections.push({ id: n.id, kind: "chapter", ...heading(n, true), docs: [blocksOf(n)] });
  }

  const words = sections.reduce((sum, s) => sum + s.docs.reduce((a, d) => a + blocksWordCount(d.blocks), 0), 0);
  const appendixBlocks = settings.includeAppendix && extras.appendixHtml ? htmlToBlocks(extras.appendixHtml) : null;
  return {
    title: settings.title.trim() || extras.fallbackTitle || "Untitled Manuscript",
    subtitle: settings.subtitle.trim(),
    author: settings.author.trim() || extras.fallbackAuthor || "",
    contact: settings.contact.trim(),
    words,
    titlePage: settings.titlePage,
    separator: separatorText(settings.separator, settings.customSeparator),
    docTitles: settings.docTitles,
    sections: sections.filter((s) => s.docs.length || s.kind === "part"),
    about: settings.includeAbout && settings.aboutAuthor.trim() ? settings.aboutAuthor.trim() : null,
    appendix: appendixBlocks && appendixBlocks.length ? appendixBlocks : null,
    font: settings.font,
    doubleSpaced: settings.doubleSpaced,
  };
}

/** Show a document's title above it? (Never when it repeats the section title.) */
export function showDocTitle(m: Manuscript, s: ManuscriptSection, d: CompiledDoc): boolean {
  if (!m.docTitles) return false;
  if (s.kind === "loose") return false;
  return d.title.trim().toLowerCase() !== (s.title ?? "").trim().toLowerCase();
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "manuscript";
}
