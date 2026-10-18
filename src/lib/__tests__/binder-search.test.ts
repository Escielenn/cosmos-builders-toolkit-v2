import { describe, it, expect } from "vitest";
import {
  htmlToPlain,
  buildMatcher,
  findAllMatches,
  searchBinder,
  snippetAround,
  matchingDocIds,
} from "@/lib/binder-search";
import {
  sanitizeCollections,
  readCollections,
  writeCollections,
  collectionDocs,
} from "@/lib/writing-collections";

const docs = [
  { id: "a", title: "Arrival at Ix", content: "<p>The ship fell toward Ix.</p><p>Nobody spoke.</p>", metadata: { synopsis: "Landing", keywords: ["ix"] } },
  { id: "b", title: "Night", content: "<p>Ixian lanterns &amp; rain.</p>", metadata: { notes: "check the IX timeline" } },
  { id: "c", title: "Empty", content: "", metadata: {} },
];

describe("htmlToPlain", () => {
  it("separates blocks with newlines and decodes entities", () => {
    expect(htmlToPlain("<p>One</p><p>Two &amp; three</p>")).toBe("One\nTwo & three");
    expect(htmlToPlain("<p>a<br>b</p>")).toBe("a\nb");
    expect(htmlToPlain("<ul><li><p>x</p></li></ul><p></p><p>y</p>")).toBe("x\ny");
    expect(htmlToPlain(null)).toBe("");
  });
});

describe("buildMatcher", () => {
  it("escapes plain queries and reports a bad regex", () => {
    const plain = buildMatcher("a.b", { regex: false, caseSensitive: false });
    expect(plain.re?.test("a.b")).toBe(true);
    expect(buildMatcher("a.b", { regex: false, caseSensitive: false }).re?.test("axb")).toBe(false);
    const bad = buildMatcher("(", { regex: true, caseSensitive: false });
    expect(bad.re).toBeNull();
    expect(bad.error).toMatch(/PATTERN INVALID/);
  });
});

describe("findAllMatches", () => {
  it("skips zero-width matches without looping forever", () => {
    expect(findAllMatches("abc", /\b/g)).toEqual([]);
    expect(findAllMatches("aXbX", /x/gi)).toEqual([{ start: 1, end: 2 }, { start: 3, end: 4 }]);
  });
});

describe("snippetAround", () => {
  it("keeps the match and marks cut edges", () => {
    const text = "word ".repeat(30) + "TARGET" + " tail".repeat(30);
    const s = snippetAround(text, { start: 150, end: 156 }, 20);
    expect(s.match).toBe("TARGET");
    expect(s.before.startsWith("…")).toBe(true);
    expect(s.after.endsWith("…")).toBe(true);
  });
});

describe("searchBinder", () => {
  it("searches every field, grouped by document in the given order", () => {
    const out = searchBinder(docs, "ix", { regex: false, caseSensitive: false });
    expect(out.error).toBeNull();
    expect(out.results.map((r) => r.docId)).toEqual(["a", "b"]);
    const a = out.results[0];
    expect(a.hits.map((h) => h.field)).toEqual(["title", "keywords", "text"]);
    expect(out.results[1].hits.map((h) => h.field)).toEqual(["notes", "text"]);
    expect(out.totalHits).toBe(5);
  });

  it("honours case sensitivity and regex", () => {
    expect(matchingDocIds(docs, "IX", { regex: false, caseSensitive: true })).toEqual(["b"]);
    expect(matchingDocIds(docs, "^Nobody", { regex: true, caseSensitive: false })).toEqual([]);
    expect(matchingDocIds(docs, "Nobody\\s+spoke", { regex: true, caseSensitive: false })).toEqual(["a"]);
  });

  it("numbers occurrences per field so a click can land on the Nth match", () => {
    const out = searchBinder(
      [{ id: "x", title: "t", content: "<p>ab ab</p><p>ab</p>" }],
      "ab",
      { regex: false, caseSensitive: false },
    );
    expect(out.results[0].hits.map((h) => h.occurrence)).toEqual([0, 1, 2]);
  });

  it("returns nothing for a blank query and an error for a bad pattern", () => {
    expect(searchBinder(docs, "  ", { regex: false, caseSensitive: false }).results).toEqual([]);
    expect(searchBinder(docs, "[", { regex: true, caseSensitive: false }).error).not.toBeNull();
  });
});

describe("collections", () => {
  it("sanitizes untyped JSON", () => {
    const list = sanitizeCollections([
      { id: "1", name: "Ix scenes", kind: "search", query: "ix", regex: true },
      { id: "2", name: "Act two", kind: "manual", docIds: ["b", "b", 3, "a"] },
      { id: "1", name: "dup", kind: "manual", docIds: [] },
      { id: "3", name: "blank query", kind: "search", query: "  " },
      { id: "4", name: "", kind: "manual" },
      { id: "5", name: "bad kind", kind: "other" },
      "junk",
    ]);
    expect(list).toEqual([
      { id: "1", name: "Ix scenes", kind: "search", query: "ix", regex: true, caseSensitive: false },
      { id: "2", name: "Act two", kind: "manual", docIds: ["b", "a"] },
    ]);
  });

  it("round-trips through worlds.settings without touching other keys", () => {
    const settings = writeCollections({ writingLabels: [] }, [
      { id: "1", name: "A", kind: "manual", docIds: ["a"] },
    ]);
    expect(settings.writingLabels).toEqual([]);
    expect(readCollections(settings)).toHaveLength(1);
  });

  it("resolves members in reading order; manual drops missing docs, search re-runs", () => {
    expect(
      collectionDocs({ id: "m", name: "m", kind: "manual", docIds: ["b", "gone", "a"] }, docs).map((d) => d.id),
    ).toEqual(["a", "b"]);
    expect(
      collectionDocs({ id: "s", name: "s", kind: "search", query: "rain", regex: false, caseSensitive: false }, docs).map((d) => d.id),
    ).toEqual(["b"]);
  });
});
