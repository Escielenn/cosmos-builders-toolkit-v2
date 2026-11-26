// ---------------------------------------------------------------------------
// entity-match, "Did you mean <Entity>?"
//
// The checker flags a word it does not know. Before calling it a misspelling
// we ask whether it is a near miss on something the world DOES know: a case
// slip ("kellis"), a plural ("Vaultborns"), a possessive of a typo
// ("Kelis's"), or a one- or two-letter slip ("Kelis"). The answer is an
// offer, never a change: the writer clicks, or nothing happens.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { lexiconWords, normalizeApostrophes, stripPossessive, type LexiconName } from "@/lib/writing/lexicon";

export type MatchKind = "case" | "plural" | "near";

export interface NameMatch {
  /** The lexicon name the word resembles. */
  name: LexiconName;
  kind: MatchKind;
  /** The token of the name that matched ("Kellis" of "Kellis Prime"). */
  token: string;
  /** The flagged word, corrected, with its own plural/possessive kept. */
  replacement: string;
  distance: number;
}

/**
 * Optimal string alignment distance (Levenshtein + adjacent transposition),
 * abandoned once it must exceed `max`. Returns max + 1 in that case.
 */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prev2: number[] = [];
  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[lb];
}

/** How many slips a word of this length may carry and still be "close". */
export function nearThreshold(length: number): number {
  if (length < 4) return 0;
  return length >= 8 ? 2 : 1;
}

const SOURCE_RANK: Record<LexiconName["source"], number> = {
  codex: 0, alias: 1, custom: 2, pov: 3, type: 4, chronicle: 5, canon: 6,
};
const KIND_RANK: Record<MatchKind, number> = { case: 0, plural: 1, near: 2 };

function pluralStem(lower: string): string[] {
  const out: string[] = [];
  if (lower.length > 3 && lower.endsWith("es")) out.push(lower.slice(0, -2));
  if (lower.length > 2 && lower.endsWith("s")) out.push(lower.slice(0, -1));
  return out;
}

/**
 * The closest world name to a flagged word, or null. A word the lexicon
 * already accepts should not be passed here (it is not flagged).
 */
export function matchName(word: string, names: readonly LexiconName[]): NameMatch | null {
  const { stem, suffix } = stripPossessive(normalizeApostrophes(word));
  if (stem.length < 2) return null;
  const lower = stem.toLowerCase();
  const capitalised = /^\p{Lu}/u.test(stem);
  let best: NameMatch | null = null;

  const consider = (m: NameMatch) => {
    if (!best) {
      best = m;
      return;
    }
    const a = [KIND_RANK[m.kind], m.distance, SOURCE_RANK[m.name.source], m.name.name.length];
    const b = [KIND_RANK[best.kind], best.distance, SOURCE_RANK[best.name.source], best.name.name.length];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        if (a[i] < b[i]) best = m;
        return;
      }
    }
  };

  for (const name of names) {
    for (const token of lexiconWords(name.name)) {
      // Parts of an apostrophe/hyphen form ("thar" of "K'thar") are for the
      // dictionary; nobody means them.
      if (token.length < 3 || !/^\p{Lu}/u.test(token)) continue;
      const tl = token.toLowerCase();
      if (tl === lower) {
        if (token !== stem) consider({ name, kind: "case", token, replacement: token + suffix, distance: 0 });
        continue;
      }
      const plural = pluralStem(lower).find((p) => p === tl);
      if (plural !== undefined) {
        consider({ name, kind: "plural", token, replacement: token + stem.slice(plural.length) + suffix, distance: 0 });
        continue;
      }
      // Near misses only for words written as names: a lower-case typo of an
      // ordinary word should not be steered toward the Codex.
      if (!capitalised) continue;
      const max = Math.min(nearThreshold(stem.length), nearThreshold(token.length));
      if (max === 0) continue;
      const d = editDistance(lower, tl, max);
      if (d <= max) consider({ name, kind: "near", token, replacement: token + suffix, distance: d });
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Linking a multi-word name
// ---------------------------------------------------------------------------

const WORD_AT = /[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu;

function wordsOf(text: string): Array<{ w: string; start: number; end: number }> {
  return [...text.matchAll(WORD_AT)].map((m) => ({ w: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length }));
}

function sameish(written: string, token: string): boolean {
  const a = stripPossessive(normalizeApostrophes(written)).stem.toLowerCase();
  const b = token.toLowerCase();
  if (a === b) return true;
  const max = Math.min(nearThreshold(a.length), nearThreshold(b.length));
  return max > 0 && editDistance(a, b, max) <= max;
}

/**
 * The stretch of `text` to replace when linking the flagged word at
 * [start, end) to an entity called `name`. For a one-word name that is the
 * word itself. For "Kellis Prime", flagged on "Kelis" in "Kelis Prime", it
 * grows to cover both words so the chip does not leave a stray "Prime"
 * behind. It only grows when every other word of the name is there, in
 * order, separated by plain spaces.
 */
export function linkSpan(text: string, start: number, end: number, name: string): { start: number; end: number } {
  const tokens = wordsOf(name).map((x) => x.w);
  if (tokens.length < 2) return { start, end };
  const words = wordsOf(text);
  const at = words.findIndex((x) => x.start <= start && x.end >= end);
  if (at < 0) return { start, end };
  for (let j = 0; j < tokens.length; j++) {
    if (!sameish(words[at].w, tokens[j])) continue;
    const first = at - j;
    const last = first + tokens.length - 1;
    if (first < 0 || last >= words.length) continue;
    let ok = true;
    for (let k = 0; k < tokens.length && ok; k++) {
      if (!sameish(words[first + k].w, tokens[k])) ok = false;
      if (ok && k > 0 && !/^ +$/.test(text.slice(words[first + k - 1].end, words[first + k].start))) ok = false;
    }
    if (!ok) continue;
    // A possessive on the last word stays in the prose, outside the chip.
    const tail = words[last];
    const { stem } = stripPossessive(tail.w);
    return { start: words[first].start, end: tail.start + stem.length };
  }
  return { start, end };
}
