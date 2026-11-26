import { describe, expect, it } from "vitest";
import { novelTerms } from "./novel";
import type { ProofIssue } from "./proofread-plugin";

let n = 0;
function issue(problem: string, over: Partial<ProofIssue> = {}): ProofIssue {
  n += 1;
  return {
    id: `i${n}`, problem, message: "", kind: "Spelling", key: `k${n}`, spelling: true,
    sentenceStart: false, suggestions: [], ...over,
  };
}

describe("novelTerms", () => {
  it("groups capitalised unknown words, possessives included, most used first", () => {
    const terms = novelTerms([issue("Ashmere"), issue("Thessaly"), issue("Ashmere\u2019s"), issue("Ashmere")]);
    expect(terms.map((t) => [t.term, t.count])).toEqual([["Ashmere", 3], ["Thessaly", 1]]);
    expect(terms[0].ids).toHaveLength(3);
  });
  it("leaves out lower-case words, grammar flags and words the world nearly knows", () => {
    expect(
      novelTerms([
        issue("teh"),
        issue("Ashmere", { spelling: false, kind: "Capitalization" }),
        issue("Kelis", { match: { name: "Kellis Prime", kind: "near", replacement: "Kellis" } }),
      ]),
    ).toEqual([]);
  });
  it("leaves out a capital that only opens a sentence, unless it recurs", () => {
    expect(novelTerms([issue("Teh", { sentenceStart: true })])).toEqual([]);
    expect(novelTerms([issue("Orrin", { sentenceStart: true }), issue("Orrin", { sentenceStart: true })])).toHaveLength(1);
    expect(novelTerms([issue("Orrin", { sentenceStart: true }), issue("Orrin")])[0].count).toBe(2);
  });
});
