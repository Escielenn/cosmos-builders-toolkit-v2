// ---------------------------------------------------------------------------
// spans, from the checker's character offsets to ProseMirror positions.
//
// The checker sees one paragraph as plain text and answers with spans counted
// in Unicode scalars. The document counts UTF-16 units and has things that
// are not text at all: an @mention chip, a cited fact, a hard break. Three
// conversions, each tested:
//
//   scalar index  -> UTF-16 offset     (an emoji is one scalar, two units)
//   UTF-16 offset -> document position (marks and inline atoms in between)
//   a span        -> a range, or null when it touches an atom: a chip's
//                    label is the world's data, not prose to correct.
//
// Pure: reads ProseMirror nodes structurally, no editor needed.
// ---------------------------------------------------------------------------

/** The slice of a ProseMirror node this module reads. */
export interface SpanNode {
  isText: boolean;
  isTextblock: boolean;
  isLeaf: boolean;
  text?: string | null;
  nodeSize: number;
  type: { name: string };
  attrs: Record<string, unknown>;
  forEach(fn: (child: SpanNode, offset: number) => void): void;
}

export interface BlockText {
  /** Position of the textblock node itself. */
  pos: number;
  /** The paragraph as the checker reads it. */
  text: string;
  /**
   * UTF-16 offset -> document position; text.length + 1 entries. Offsets
   * inside an atom's label all map to the atom's own position.
   */
  map: number[];
  /** [start, end) offsets that belong to an atom's label. */
  atoms: Array<[number, number]>;
}

/** Which attribute carries an inline atom's visible text. */
const ATOM_LABEL: Record<string, string> = {
  entityMention: "label",
  wikiLink: "title",
  factRef: "value",
};

function atomLabel(node: SpanNode): string {
  const key = ATOM_LABEL[node.type.name];
  const raw = key ? node.attrs[key] : (node.attrs.label ?? node.attrs.title);
  const s = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  return s;
}

/** One textblock as checker text, with its position map. */
export function blockText(node: SpanNode, pos: number): BlockText {
  let text = "";
  const map: number[] = [];
  const atoms: Array<[number, number]> = [];
  const inside = pos + 1;
  node.forEach((child, offset) => {
    const at = inside + offset;
    if (child.isText) {
      const s = child.text ?? "";
      for (let i = 0; i < s.length; i++) map.push(at + i);
      text += s;
      return;
    }
    const label = atomLabel(child);
    if (label) {
      const start = text.length;
      for (let i = 0; i < label.length; i++) map.push(at);
      text += label;
      atoms.push([start, text.length]);
      return;
    }
    // A hard break or an unlabelled leaf: a line break keeps the words on
    // either side apart without inventing a word.
    map.push(at);
    text += "\n";
    atoms.push([text.length - 1, text.length]);
  });
  map.push(pos + node.nodeSize - 1);
  // An offset just past an atom is the position after the atom, which is
  // already what the next entry holds; nothing to patch.
  return { pos, text, map, atoms };
}

/**
 * Scalar index -> UTF-16 offset, for every scalar boundary of `text`
 * (scalars + 1 entries). The checker counts scalars; JavaScript does not.
 */
export function scalarOffsets(text: string): number[] {
  const out: number[] = [0];
  let i = 0;
  while (i < text.length) {
    const c = text.charCodeAt(i);
    const pair = c >= 0xd800 && c <= 0xdbff && i + 1 < text.length;
    const lo = pair ? text.charCodeAt(i + 1) : 0;
    i += pair && lo >= 0xdc00 && lo <= 0xdfff ? 2 : 1;
    out.push(i);
  }
  return out;
}

/**
 * A scalar span -> UTF-16 offsets. When the text at the converted offsets is
 * not `problem`, the raw numbers are tried as UTF-16 (older checker builds
 * reported those); null when neither reading matches.
 */
export function scalarSpanToUtf16(
  text: string,
  offsets: readonly number[],
  start: number,
  end: number,
  problem: string,
): { start: number; end: number } | null {
  const s = offsets[start];
  const e = offsets[end];
  if (s !== undefined && e !== undefined && text.slice(s, e) === problem) return { start: s, end: e };
  if (text.slice(start, end) === problem) return { start, end };
  return null;
}

/**
 * UTF-16 offsets within a block -> a document range. Null when the span is
 * empty, out of bounds, or overlaps an atom.
 */
export function spanToRange(block: BlockText, start: number, end: number): { from: number; to: number } | null {
  if (start < 0 || end > block.text.length || start >= end) return null;
  for (const [a, b] of block.atoms) if (start < b && end > a) return null;
  const from = block.map[start];
  // The end is one past the last character, which also holds across a mark
  // boundary (the next text node starts at the same position).
  const to = block.map[end - 1] + 1;
  if (from === undefined || !Number.isFinite(to) || from >= to) return null;
  return { from, to };
}

/** A zero-width insertion point after offset `end` (for "insert after"). */
export function offsetToPos(block: BlockText, offset: number): number | null {
  const p = block.map[offset];
  return p === undefined ? null : p;
}

export interface CollectedBlock<N extends SpanNode = SpanNode> {
  node: N;
  block: BlockText;
}

export interface SpanDoc<N extends SpanNode = SpanNode> {
  descendants(fn: (node: N, pos: number) => boolean | void): void;
}

/**
 * Textblocks of a document in order, up to `maxChars` of checker text.
 * `limited` says the document went on past the bound. Empty paragraphs are
 * skipped. Code blocks are not prose and are skipped too.
 */
export function collectBlocks<N extends SpanNode>(
  doc: SpanDoc<N>,
  maxChars: number,
): { blocks: Array<CollectedBlock<N>>; limited: boolean } {
  const blocks: Array<CollectedBlock<N>> = [];
  let used = 0;
  let limited = false;
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    if (limited || node.type.name === "codeBlock") return false;
    const block = blockText(node, pos);
    if (!block.text.trim()) return false;
    if (used + block.text.length > maxChars) {
      limited = true;
      return false;
    }
    used += block.text.length;
    blocks.push({ node, block });
    return false;
  });
  return { blocks, limited };
}
