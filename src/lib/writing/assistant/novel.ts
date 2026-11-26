// ---------------------------------------------------------------------------
// novel, "New to this world".
//
// Capitalised words the checker does not know and the world has no close
// name for: the names a draft introduces before the Codex has heard of them.
// One click adds each to the lexicon or files a Codex entry; nothing is
// adopted on its own.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { stripPossessive } from "@/lib/writing/lexicon";
import type { ProofIssue } from "./proofread-plugin";

export interface NovelTerm {
  term: string;
  count: number;
  /** The issues behind it, in document order. */
  ids: string[];
}

/**
 * A word seen only once, at the start of a sentence, is left out: its
 * capital is grammar, and it is more likely a typo than a name.
 */
export function novelTerms(issues: readonly ProofIssue[]): NovelTerm[] {
  const groups = new Map<string, NovelTerm & { midSentence: boolean }>();
  for (const issue of issues) {
    if (!issue.spelling || issue.match) continue;
    const term = stripPossessive(issue.problem).stem;
    if (term.length < 3 || !/^\p{Lu}/u.test(term)) continue;
    const g = groups.get(term) ?? { term, count: 0, ids: [], midSentence: false };
    g.count += 1;
    g.ids.push(issue.id);
    if (!issue.sentenceStart) g.midSentence = true;
    groups.set(term, g);
  }
  return [...groups.values()]
    .filter((g) => g.midSentence || g.count > 1)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .map(({ term, count, ids }) => ({ term, count, ids }));
}
