// ---------------------------------------------------------------------------
// find-replace, locating matches in a document's plain text.
//
// Renaming a character across a manuscript was impossible before this: the
// editor had no find, let alone replace. Scrivener users do this constantly.
//
// The matching is pure and offset-based so it can be unit-tested without a
// ProseMirror document; the editor layer maps these offsets onto positions.
// ---------------------------------------------------------------------------

export interface FindOptions {
  caseSensitive?: boolean;
  /** Match only at word boundaries — "Ix" must not hit "Ixian". */
  wholeWord?: boolean;
}

export interface Match {
  /** 0-based offset into the searched text. */
  start: number;
  /** Exclusive end offset. */
  end: number;
  /** The matched substring, preserving original case. */
  text: string;
}

/**
 * Every occurrence of `query` in `text`.
 *
 * Returns [] for an empty query rather than every position, which would
 * otherwise make the UI claim an absurd match count on each keystroke.
 */
export function findMatches(
  text: string,
  query: string,
  options: FindOptions = {},
): Match[] {
  if (!text || !query) return [];

  const { caseSensitive = false, wholeWord = false } = options;
  const hay = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();

  const matches: Match[] = [];
  let from = 0;

  for (;;) {
    const idx = hay.indexOf(needle, from);
    if (idx === -1) break;

    const end = idx + needle.length;
    if (!wholeWord || isWordBounded(text, idx, end)) {
      matches.push({ start: idx, end, text: text.slice(idx, end) });
    }
    // Non-overlapping, which is what every editor's find does: "aa" in "aaa"
    // is one match, not two. Max(…, 1) guards against an infinite loop.
    from = idx + Math.max(needle.length, 1);
  }

  return matches;
}

/** True when neither side of [start,end) touches a word character. */
function isWordBounded(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  const isWord = (c: string) => c !== "" && /[\w'-]/.test(c);
  return !isWord(before) && !isWord(after);
}

/**
 * Replace every match in a plain string.
 *
 * Used for the "replace all" preview and for tests; the editor performs the
 * real replacement through transactions so undo stays granular.
 */
export function replaceAll(
  text: string,
  query: string,
  replacement: string,
  options: FindOptions = {},
): { result: string; count: number } {
  const matches = findMatches(text, query, options);
  if (matches.length === 0) return { result: text, count: 0 };

  let out = "";
  let cursor = 0;
  for (const m of matches) {
    out += text.slice(cursor, m.start) + replacement;
    cursor = m.end;
  }
  out += text.slice(cursor);
  return { result: out, count: matches.length };
}

/** Index of the next match at or after `caret`, wrapping around. */
export function nextMatchIndex(matches: Match[], caret: number): number {
  if (matches.length === 0) return -1;
  const i = matches.findIndex((m) => m.start >= caret);
  return i === -1 ? 0 : i;
}
