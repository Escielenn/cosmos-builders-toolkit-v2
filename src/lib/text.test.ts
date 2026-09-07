import { describe, it, expect } from "vitest";
import { countWords, countWordsInText } from "@/lib/text";

describe("text helpers (streaks + continue-card)", () => {
  it("counts words in plain and HTML content", () => {
    expect(countWords("<p>one two three</p>")).toBe(3);
    expect(countWords("<h1>Title</h1><p>a b c d</p>")).toBe(5);
    expect(countWords("word&nbsp;spaced")).toBe(2);
  });
  it("returns 0 for empty/blank/null", () => {
    expect(countWords("")).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWords("<p></p>")).toBe(0);
    expect(countWords("   <br/>  ")).toBe(0);
  });
  it("collapses tags without merging adjacent words", () => {
    // "<strong>a</strong><em>b</em>" -> tags become spaces -> "a b" -> 2
    expect(countWords("<strong>a</strong> <em>b</em>")).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// One count, everywhere.
//
// The Studio footer counted countWords(html); the editor's own readout counted
// `doc.textContent`, which prosemirror-model defines as textBetween(0, size,
// "") — an EMPTY block separator. Paragraphs were glued, so the readout lost
// one word per block boundary: an eight paragraph scene showed 133 in the
// editor and 140 in the footer, on screen at the same time.
// ---------------------------------------------------------------------------

describe("word count agrees with itself", () => {
  const paragraphs = ["the terminator band", "is three hundred kilometres wide"];
  const html = paragraphs.map((p) => `<p>${p}</p>`).join("");
  const expected = paragraphs.join(" ").split(/\s+/).length; // 8

  it("counts HTML block boundaries as word boundaries", () => {
    expect(countWords(html)).toBe(expected);
  });

  it("agrees with the text a ProseMirror doc yields when separated properly", () => {
    // What doc.textBetween(0, size, " ", " ") produces.
    expect(countWordsInText(paragraphs.join(" "))).toBe(countWords(html));
  });

  it("would have disagreed with textContent — the bug this locks out", () => {
    // What doc.textContent produced: an empty separator glues the boundary.
    const glued = paragraphs.join("");
    expect(countWordsInText(glued)).toBe(expected - 1);
    expect(countWordsInText(glued)).not.toBe(countWords(html));
  });

  it("loses exactly one word per boundary, however many blocks there are", () => {
    for (const n of [2, 5, 9]) {
      const blocks = Array.from({ length: n }, (_, i) => `para${i} tail`);
      expect(countWords(blocks.map((b) => `<p>${b}</p>`).join(""))).toBe(n * 2);
      expect(countWordsInText(blocks.join(""))).toBe(n * 2 - (n - 1));
    }
  });

  it("treats headings, quotes and list items as boundaries too", () => {
    expect(countWords("<h1>one</h1><blockquote>two</blockquote><li>three</li>")).toBe(3);
  });

  it("is empty-safe on both entry points", () => {
    expect(countWordsInText("")).toBe(0);
    expect(countWordsInText(null)).toBe(0);
    expect(countWordsInText(undefined)).toBe(0);
    expect(countWordsInText("   ")).toBe(0);
  });
});
