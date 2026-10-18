// ---------------------------------------------------------------------------
// word-diff, a readable word-level comparison of two document versions.
//
// Used by the Snapshots panel: a writer comparing "Tuesday's draft" with the
// current text wants to see which words changed, paragraph by paragraph, not
// a character soup or a raw HTML diff.
//
// Strategy (hierarchical, so a 100k-word novel chapter never allocates a
// quadratic table):
//   1. HTML → paragraphs of plain text.
//   2. LCS over paragraphs (paragraph counts are small).
//   3. Each run of changed paragraphs is paired positionally and diffed at
//      the word level with LCS, unless the pair is too large, in which case
//      it degrades to a whole-paragraph replace.
//
// Pure: no React, no DOM, safe in tests and workers.
// ---------------------------------------------------------------------------

export type DiffOp = "equal" | "insert" | "delete";

export interface DiffSegment {
  op: DiffOp;
  /** Words joined by single spaces. */
  text: string;
}

/** One rendered paragraph of the comparison. */
export interface DiffParagraph {
  /** "equal": untouched; "insert"/"delete": whole paragraph; "change": mixed. */
  kind: "equal" | "insert" | "delete" | "change";
  segments: DiffSegment[];
}

export interface WordDiff {
  paragraphs: DiffParagraph[];
  wordsAdded: number;
  wordsRemoved: number;
  /** True when both sides are identical. */
  identical: boolean;
}

/** Above this many LCS cells a paragraph pair is shown as a whole replace. */
const MAX_WORD_CELLS = 2_000_000;
/** Above this many LCS cells the paragraph pass itself degrades. */
const MAX_PARA_CELLS = 4_000_000;

// ---------------------------------------------------------------------------
// HTML → plain paragraphs
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)));
}

/**
 * Split Tiptap HTML into plain-text paragraphs. Block closers and <br> become
 * paragraph breaks; inline tags vanish; empty paragraphs are dropped.
 */
export function htmlToParagraphs(html: string | null | undefined): string[] {
  if (!html) return [];
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|pre|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(withBreaks)
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function words(p: string): string[] {
  return p ? p.split(" ") : [];
}

// ---------------------------------------------------------------------------
// LCS core (generic, equality by ===)
// ---------------------------------------------------------------------------

type Edit<T> = { op: DiffOp; item: T };

/** Classic LCS backtrack. Caller guarantees a.length * b.length is bounded. */
function lcsEdits<T>(a: T[], b: T[]): Edit<T>[] {
  const n = a.length;
  const m = b.length;
  // Row-major (n+1) x (m+1) table of LCS lengths from the END, so the
  // forward walk below emits edits in reading order.
  const w = m + 1;
  const table = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * w + j] =
        a[i] === b[j]
          ? table[(i + 1) * w + j + 1] + 1
          : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
    }
  }
  const out: Edit<T>[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ op: "equal", item: a[i] });
      i++;
      j++;
    } else if (table[(i + 1) * w + j] >= table[i * w + j + 1]) {
      out.push({ op: "delete", item: a[i++] });
    } else {
      out.push({ op: "insert", item: b[j++] });
    }
  }
  while (i < n) out.push({ op: "delete", item: a[i++] });
  while (j < m) out.push({ op: "insert", item: b[j++] });
  return out;
}

/** LCS with common prefix/suffix trimmed first (the usual case is a small edit). */
function diffSequences<T>(a: T[], b: T[], maxCells: number): Edit<T>[] | null {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  if (midA.length * midB.length > maxCells) return null;

  const out: Edit<T>[] = [];
  for (let k = 0; k < start; k++) out.push({ op: "equal", item: a[k] });
  out.push(...lcsEdits(midA, midB));
  for (let k = endA; k < a.length; k++) out.push({ op: "equal", item: a[k] });
  return out;
}

/** Merge adjacent same-op word edits into segments. */
function toSegments(edits: Edit<string>[]): DiffSegment[] {
  const segs: DiffSegment[] = [];
  for (const e of edits) {
    const last = segs[segs.length - 1];
    if (last && last.op === e.op) last.text += ` ${e.item}`;
    else segs.push({ op: e.op, text: e.item });
  }
  return segs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Word-level diff of two paragraphs (already plain text). */
export function diffParagraph(before: string, after: string): DiffSegment[] {
  const a = words(before);
  const b = words(after);
  const edits = diffSequences(a, b, MAX_WORD_CELLS);
  if (!edits) {
    const segs: DiffSegment[] = [];
    if (before) segs.push({ op: "delete", text: before });
    if (after) segs.push({ op: "insert", text: after });
    return segs;
  }
  return toSegments(edits);
}

/**
 * Compare two versions of a document (Tiptap HTML or plain text).
 * `before` is the older text (the snapshot), `after` the newer (current).
 */
export function diffDocuments(beforeHtml: string, afterHtml: string): WordDiff {
  const a = htmlToParagraphs(beforeHtml);
  const b = htmlToParagraphs(afterHtml);

  const paraEdits =
    diffSequences(a, b, MAX_PARA_CELLS) ??
    // Pathological: thousands of paragraphs all changed. Whole replace.
    [...a.map((item) => ({ op: "delete" as const, item })), ...b.map((item) => ({ op: "insert" as const, item }))];

  const paragraphs: DiffParagraph[] = [];
  let wordsAdded = 0;
  let wordsRemoved = 0;

  // Walk the paragraph edits, collecting each run of non-equal edits so that
  // deleted and inserted paragraphs in the same run can be paired up.
  let i = 0;
  while (i < paraEdits.length) {
    const e = paraEdits[i];
    if (e.op === "equal") {
      paragraphs.push({ kind: "equal", segments: [{ op: "equal", text: e.item }] });
      i++;
      continue;
    }
    const dels: string[] = [];
    const ins: string[] = [];
    while (i < paraEdits.length && paraEdits[i].op !== "equal") {
      if (paraEdits[i].op === "delete") dels.push(paraEdits[i].item);
      else ins.push(paraEdits[i].item);
      i++;
    }
    const pairs = Math.min(dels.length, ins.length);
    for (let k = 0; k < pairs; k++) {
      const segs = diffParagraph(dels[k], ins[k]);
      for (const s of segs) {
        if (s.op === "insert") wordsAdded += words(s.text).length;
        if (s.op === "delete") wordsRemoved += words(s.text).length;
      }
      paragraphs.push({ kind: "change", segments: segs });
    }
    for (let k = pairs; k < dels.length; k++) {
      wordsRemoved += words(dels[k]).length;
      paragraphs.push({ kind: "delete", segments: [{ op: "delete", text: dels[k] }] });
    }
    for (let k = pairs; k < ins.length; k++) {
      wordsAdded += words(ins[k]).length;
      paragraphs.push({ kind: "insert", segments: [{ op: "insert", text: ins[k] }] });
    }
  }

  return {
    paragraphs,
    wordsAdded,
    wordsRemoved,
    identical: wordsAdded === 0 && wordsRemoved === 0 && a.length === b.length,
  };
}
