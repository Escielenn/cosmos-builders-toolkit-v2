// ---------------------------------------------------------------------------
// palette-trigger, when "/" in the prose means "find something in my world".
//
// A slash opens the world palette only at a word boundary: at the start of a
// paragraph or after whitespace. "and/or", "1/2", "km/s" and URLs never
// trigger it. The query is what follows the slash, up to 40 characters, and a
// double space or a leading space ends it (the writer moved on).
//
// `textBefore` must keep one character per document position, so callers
// read it with a leaf placeholder (OBJECT REPLACEMENT CHARACTER for inline
// atoms). Otherwise a mention earlier in the paragraph shifts every offset.
//
// Pure, tested.
// ---------------------------------------------------------------------------

export const LEAF_PLACEHOLDER = "￼";

export interface SlashTrigger {
  /** Offset of the "/" within the text block. */
  at: number;
  query: string;
}

export const MAX_SLASH_QUERY = 40;

export function findSlashTrigger(textBefore: string): SlashTrigger | null {
  const at = textBefore.lastIndexOf("/");
  if (at < 0) return null;
  const prev = at > 0 ? textBefore[at - 1] : "";
  if (prev && !/\s/.test(prev)) return null;
  const query = textBefore.slice(at + 1);
  if (query.length > MAX_SLASH_QUERY) return null;
  if (query.startsWith(" ") || /\s{2}/.test(query) || query.includes(LEAF_PLACEHOLDER)) return null;
  return { at, query };
}
