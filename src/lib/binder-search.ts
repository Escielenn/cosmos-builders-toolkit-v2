// ---------------------------------------------------------------------------
// binder-search, search every document in a world: text, titles, synopses,
// notes and keywords, with optional regex and case sensitivity.
//
// Runs client-side over the documents the binder already holds
// (useWritingDocuments selects full rows, content included), so there is no
// extra query and no server index to keep in step.
//
// Text is flattened with "\n" between blocks, the same separator the
// in-document find uses (src/lib/editor-text-map.ts), so the Nth match here
// is the Nth match there and a click can land on the exact occurrence.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { readDocMeta } from "@/lib/document-meta";

export interface SearchOptions {
  regex: boolean;
  caseSensitive: boolean;
  /** Only whole words: no letter, digit or underscore on either side. */
  wholeWord?: boolean;
}

export type SearchField = "title" | "synopsis" | "notes" | "keywords" | "text";

export const FIELD_LABELS: Record<SearchField, string> = {
  title: "Title",
  synopsis: "Synopsis",
  notes: "Notes",
  keywords: "Keywords",
  text: "Text",
};

export interface SearchHit {
  field: SearchField;
  /** Index of this match among the field's matches (0-based). */
  occurrence: number;
  before: string;
  match: string;
  after: string;
}

export interface DocSearchResult {
  docId: string;
  title: string;
  hits: SearchHit[];
  /** Matches in this document, including any beyond the shown hits. */
  total: number;
}

export interface SearchOutcome {
  results: DocSearchResult[];
  totalHits: number;
  /** Set when the regex does not compile. Ship's Voice. */
  error: string | null;
}

export interface SearchableDoc {
  id: string;
  title: string;
  content?: string | null;
  metadata?: unknown;
}

const BLOCK_TAGS =
  /<\/?(p|div|h[1-6]|li|ul|ol|blockquote|pre|br|hr|tr|td|th|table|section|article|figure|figcaption)\b[^>]*>/gi;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** HTML → plain text, blocks separated by "\n", entities decoded. */
export function htmlToPlain(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(BLOCK_TAGS, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{2,}/g, "\n")
    .replace(/^\n+|\n+$/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Compile the query. A plain query is escaped; a bad regex reports why. */
export function buildMatcher(
  query: string,
  opts: SearchOptions,
): { re: RegExp; error: null } | { re: null; error: string } {
  if (!query) return { re: null, error: "EMPTY QUERY." };
  try {
    const source = opts.regex ? query : escapeRegex(query);
    const flags = opts.caseSensitive ? "g" : "gi";
    if (opts.wholeWord) {
      // Unicode-aware edges, so "café" and "Ödön" are words too. \b alone
      // treats every accented letter as a boundary.
      return {
        re: new RegExp(`(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`, `${flags}u`),
        error: null,
      };
    }
    return { re: new RegExp(source, flags), error: null };
  } catch {
    return { re: null, error: "PATTERN INVALID. CHECK THE EXPRESSION." };
  }
}

export interface Span {
  start: number;
  end: number;
}

/** Every non-empty match of `re` in `text`, up to `limit`. */
export function findAllMatches(text: string, re: RegExp, limit = 1000): Span[] {
  const out: Span[] = [];
  if (!text) return out;
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = g.exec(text)) !== null) {
    if (m[0].length === 0) {
      // Zero-width (e.g. ^ or \b): skip, or the loop never advances.
      g.lastIndex += 1;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length });
    if (out.length >= limit) break;
  }
  return out;
}

/** The text around a match, cut at a word boundary and kept to one line. */
export function snippetAround(
  text: string,
  span: Span,
  radius = 40,
): { before: string; match: string; after: string } {
  const flat = (s: string) => s.replace(/\s+/g, " ");
  let from = Math.max(0, span.start - radius);
  let to = Math.min(text.length, span.end + radius);
  if (from > 0) {
    const sp = text.indexOf(" ", from);
    if (sp !== -1 && sp < span.start) from = sp + 1;
  }
  if (to < text.length) {
    const sp = text.lastIndexOf(" ", to);
    if (sp > span.end) to = sp;
  }
  return {
    before: (from > 0 ? "…" : "") + flat(text.slice(from, span.start)),
    match: flat(text.slice(span.start, span.end)),
    after: flat(text.slice(span.end, to)) + (to < text.length ? "…" : ""),
  };
}

/** The searchable text of each field of one document. */
export function docFields(doc: SearchableDoc): Record<SearchField, string> {
  const meta = readDocMeta(doc.metadata);
  return {
    title: doc.title || "",
    synopsis: meta.synopsis,
    notes: meta.notes,
    keywords: meta.keywords.join(", "),
    text: htmlToPlain(doc.content),
  };
}

const FIELD_ORDER: SearchField[] = ["title", "synopsis", "keywords", "notes", "text"];

/**
 * Search documents (pass them in reading order; results keep that order).
 * At most `maxHitsPerDoc` hits are listed per document; `total` counts all.
 */
export function searchBinder(
  docs: SearchableDoc[],
  query: string,
  opts: SearchOptions,
  maxHitsPerDoc = 6,
): SearchOutcome {
  if (!query.trim()) return { results: [], totalHits: 0, error: null };
  const built = buildMatcher(query, opts);
  if (!built.re) return { results: [], totalHits: 0, error: built.error };

  const results: DocSearchResult[] = [];
  let totalHits = 0;
  for (const doc of docs) {
    const fields = docFields(doc);
    const hits: SearchHit[] = [];
    let total = 0;
    for (const field of FIELD_ORDER) {
      const text = fields[field];
      const spans = findAllMatches(text, built.re);
      total += spans.length;
      spans.forEach((span, occurrence) => {
        if (hits.length < maxHitsPerDoc) {
          hits.push({ field, occurrence, ...snippetAround(text, span) });
        }
      });
    }
    if (total > 0) {
      results.push({ docId: doc.id, title: doc.title || "Untitled", hits, total });
      totalHits += total;
    }
  }
  return { results, totalHits, error: null };
}

/** Ids of the documents a query matches, in the order given. */
export function matchingDocIds(docs: SearchableDoc[], query: string, opts: SearchOptions): string[] {
  return searchBinder(docs, query, opts, 0).results.map((r) => r.docId);
}
