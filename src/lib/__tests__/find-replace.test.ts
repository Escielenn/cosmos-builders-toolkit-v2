import { describe, it, expect } from "vitest";
import { findMatches, replaceAll, nextMatchIndex } from "@/lib/find-replace";

describe("findMatches", () => {
  it("finds every occurrence, case-insensitively by default", () => {
    const m = findMatches("Ix met Ix again, IX.", "ix");
    expect(m).toHaveLength(3);
    expect(m[0]).toEqual({ start: 0, end: 2, text: "Ix" });
    // Preserves the original casing of each hit.
    expect(m.map((x) => x.text)).toEqual(["Ix", "Ix", "IX"]);
  });

  it("respects caseSensitive", () => {
    expect(findMatches("Ix and ix", "Ix", { caseSensitive: true })).toHaveLength(1);
  });

  it("respects wholeWord so a name does not hit a longer word", () => {
    // The reason this option exists: renaming "Ix" must not touch "Ixian".
    expect(findMatches("Ix the Ixian", "Ix", { wholeWord: true })).toHaveLength(1);
    expect(findMatches("Ix the Ixian", "Ix")).toHaveLength(2);
  });

  it("treats apostrophes and hyphens as word characters", () => {
    expect(findMatches("Ix's ship", "Ix", { wholeWord: true })).toHaveLength(0);
    expect(findMatches("Ix-class ship", "Ix", { wholeWord: true })).toHaveLength(0);
  });

  it("counts repeats non-overlapping, as editors do", () => {
    expect(findMatches("aaa", "aa")).toHaveLength(1);
  });

  it("returns nothing for an empty query rather than every position", () => {
    expect(findMatches("some text", "")).toEqual([]);
    expect(findMatches("", "x")).toEqual([]);
  });

  it("finds a match at the very start and end", () => {
    expect(findMatches("Ix", "Ix", { wholeWord: true })).toHaveLength(1);
  });
});

describe("replaceAll", () => {
  it("replaces every occurrence and reports the count", () => {
    const { result, count } = replaceAll("Ix met Ix", "Ix", "Kael");
    expect(result).toBe("Kael met Kael");
    expect(count).toBe(2);
  });

  it("is a no-op when nothing matches", () => {
    const { result, count } = replaceAll("nothing here", "Ix", "Kael");
    expect(result).toBe("nothing here");
    expect(count).toBe(0);
  });

  it("honours wholeWord", () => {
    const { result } = replaceAll("Ix the Ixian", "Ix", "Kael", { wholeWord: true });
    expect(result).toBe("Kael the Ixian");
  });

  it("handles a replacement that contains the query", () => {
    // "Ix" -> "Ix Prime" must not loop forever or double-apply.
    const { result, count } = replaceAll("Ix here", "Ix", "Ix Prime");
    expect(result).toBe("Ix Prime here");
    expect(count).toBe(1);
  });

  it("can delete by replacing with empty string", () => {
    expect(replaceAll("a-b-c", "-", "").result).toBe("abc");
  });
});

describe("nextMatchIndex", () => {
  it("finds the next match at or after the caret", () => {
    const m = findMatches("Ix .. Ix .. Ix", "Ix");
    expect(nextMatchIndex(m, 0)).toBe(0);
    expect(nextMatchIndex(m, 1)).toBe(1);
  });

  it("wraps to the first match past the last one", () => {
    const m = findMatches("Ix .. Ix", "Ix");
    expect(nextMatchIndex(m, 999)).toBe(0);
  });

  it("is -1 with no matches", () => {
    expect(nextMatchIndex([], 0)).toBe(-1);
  });
});
