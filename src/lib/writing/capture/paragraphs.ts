// ---------------------------------------------------------------------------
// capture/paragraphs, a document as the detector reads it.
//
// Two sources, one shape:
//   - paragraphsFromHtml: a stored document (the binder's copy), for the
//     world-level ledger. Regex over the TipTap HTML; no DOM.
//   - paragraphsFromDoc: the live ProseMirror document of the open editor,
//     with each text node's position, so a claim can be located and its
//     margin marker placed beside the right paragraph.
//
// Both read every textblock (paragraph, heading, code block) in document
// order, put an entity mention's or wiki link's label in the text (so an
// excerpt reads as the writer wrote it) and record where it sits, and fence a
// cited fact-ref so its value is never re-read as a claim.
//
// Pure. paragraphsFromDoc takes a structural node type, not @tiptap, so it is
// testable without an editor.
// ---------------------------------------------------------------------------

import type { Paragraph, ParagraphMention, Span } from "@/lib/writing/capture/detect";

export interface TextSegment {
  /** Offset of this text node in the paragraph text. */
  offset: number;
  /** ProseMirror position of its first character. */
  pos: number;
  length: number;
}

export interface LiveParagraph extends Paragraph {
  /** ProseMirror position of the textblock node itself. */
  pos: number;
  segments: readonly TextSegment[];
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const BLOCK_RE = /<(p|h[1-6]|pre)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const INLINE_RE =
  /<(entity-mention|wiki-link|fact-ref)\b([^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>|<[^>]+>|([^<]+)/gi;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decode(s: string): string {
  return s
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/g, (e) => ENTITIES[e] ?? e)
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)));
}

function attr(attrs: string, name: string): string | null {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? decode(m[1]) : null;
}

/** Every textblock in a stored document, in order. */
export function paragraphsFromHtml(html: string | null | undefined): Paragraph[] {
  if (!html) return [];
  const out: Paragraph[] = [];
  BLOCK_RE.lastIndex = 0;
  let b: RegExpExecArray | null;
  while ((b = BLOCK_RE.exec(html)) !== null) {
    const inner = b[2];
    let text = "";
    const mentions: ParagraphMention[] = [];
    const blocked: Span[] = [];
    INLINE_RE.lastIndex = 0;
    let t: RegExpExecArray | null;
    while ((t = INLINE_RE.exec(inner)) !== null) {
      if (t[1]) {
        const tag = t[1].toLowerCase();
        const label = decode(t[3].replace(/<[^>]+>/g, ""));
        const start = text.length;
        text += label;
        const span = { start, end: text.length };
        if (tag === "fact-ref") blocked.push(span);
        else {
          const id = tag === "entity-mention" ? attr(t[2], "data-id") : attr(t[2], "data-element-id");
          if (id && id !== "null") mentions.push({ id, ...span });
          else blocked.push(span);
        }
      } else if (/^<br/i.test(t[0])) {
        text += "\n";
      } else if (t[4] !== undefined) {
        text += decode(t[4]);
      }
    }
    out.push({ text, mentions, blocked });
  }
  return out;
}

// ---------------------------------------------------------------------------
// ProseMirror
// ---------------------------------------------------------------------------

/** The slice of a ProseMirror node this module reads. */
export interface PMNodeLike {
  isTextblock: boolean;
  isText: boolean;
  text?: string | null;
  type: { name: string };
  attrs: Record<string, unknown>;
  nodeSize: number;
  forEach(fn: (child: PMNodeLike, offset: number) => void): void;
}

export interface PMDocLike {
  descendants(fn: (node: PMNodeLike, pos: number) => boolean | void): void;
}

const MENTION_TYPES: Record<string, { id: string; label: string }> = {
  entityMention: { id: "id", label: "label" },
  wikiLink: { id: "elementId", label: "title" },
};

/** One textblock node → a LiveParagraph. */
export function paragraphFromNode(node: PMNodeLike, pos: number): LiveParagraph {
  let text = "";
  const mentions: ParagraphMention[] = [];
  const blocked: Span[] = [];
  const segments: TextSegment[] = [];
  node.forEach((child, offset) => {
    const childPos = pos + 1 + offset;
    if (child.isText) {
      const s = child.text ?? "";
      segments.push({ offset: text.length, pos: childPos, length: s.length });
      text += s;
      return;
    }
    const name = child.type.name;
    if (name === "hardBreak") {
      text += "\n";
      return;
    }
    const mt = MENTION_TYPES[name];
    if (mt) {
      const label = String(child.attrs[mt.label] ?? "");
      const id = child.attrs[mt.id];
      const start = text.length;
      text += label;
      const span = { start, end: text.length };
      if (typeof id === "string" && id && id !== "null") mentions.push({ id, ...span });
      else blocked.push(span);
      return;
    }
    if (name === "factRef") {
      const start = text.length;
      text += String(child.attrs.value ?? "");
      blocked.push({ start, end: text.length });
      return;
    }
    // Any other inline atom: a fenced placeholder, so offsets stay honest.
    const start = text.length;
    text += "￼";
    blocked.push({ start, end: text.length });
  });
  return { text, mentions, blocked, pos, segments };
}

/** Every textblock in the live document, in order. */
export function paragraphsFromDoc(doc: PMDocLike): LiveParagraph[] {
  const out: LiveParagraph[] = [];
  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      out.push(paragraphFromNode(node, pos));
      return false;
    }
    return true;
  });
  return out;
}

function posAt(p: LiveParagraph, offset: number, isEnd: boolean): number | null {
  for (const s of p.segments) {
    const inside = isEnd
      ? offset > s.offset && offset <= s.offset + s.length
      : offset >= s.offset && offset < s.offset + s.length;
    if (inside) return s.pos + (offset - s.offset);
  }
  return null;
}

/**
 * The ProseMirror range of [start, end) in a live paragraph. Both ends must
 * fall in text (not inside a mention's label); the range may cross marks and
 * atoms between them. Null otherwise.
 */
export function rangeInParagraph(p: LiveParagraph, start: number, end: number): { from: number; to: number } | null {
  if (end <= start) return null;
  const from = posAt(p, start, false);
  const to = posAt(p, end, true);
  return from === null || to === null ? null : { from, to };
}

/**
 * Where a claim is now. Tries the paragraph it was found in first, then the
 * whole document for the same words, nearest paragraph first, so a claim
 * still lands after the writer typed above it.
 */
export function locateInParagraphs(
  paragraphs: readonly LiveParagraph[],
  target: { paragraphIndex: number; start: number; end: number; match: string },
): { from: number; to: number; paragraphIndex: number } | null {
  const at = paragraphs[target.paragraphIndex];
  if (at && at.text.slice(target.start, target.end) === target.match) {
    const r = rangeInParagraph(at, target.start, target.end);
    if (r) return { ...r, paragraphIndex: target.paragraphIndex };
  }
  const order = paragraphs
    .map((_, i) => i)
    .sort((a, b) => Math.abs(a - target.paragraphIndex) - Math.abs(b - target.paragraphIndex));
  for (const i of order) {
    const p = paragraphs[i];
    let from = p.text.indexOf(target.match);
    while (from >= 0) {
      const r = rangeInParagraph(p, from, from + target.match.length);
      if (r) return { ...r, paragraphIndex: i };
      from = p.text.indexOf(target.match, from + 1);
    }
  }
  return null;
}
