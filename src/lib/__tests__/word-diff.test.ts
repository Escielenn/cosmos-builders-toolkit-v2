import { describe, it, expect } from "vitest";
import { diffDocuments, diffParagraph, htmlToParagraphs } from "@/lib/word-diff";

describe("htmlToParagraphs", () => {
  it("splits Tiptap blocks and drops inline tags", () => {
    expect(
      htmlToParagraphs("<h1>Ashfall</h1><p>The <strong>Spires</strong> rise.</p><p></p><p>Ix&nbsp;waits &amp; listens.</p>"),
    ).toEqual(["Ashfall", "The Spires rise.", "Ix waits & listens."]);
  });

  it("treats <br> as a break and tolerates empty input", () => {
    expect(htmlToParagraphs("<p>one<br>two</p>")).toEqual(["one", "two"]);
    expect(htmlToParagraphs("")).toEqual([]);
    expect(htmlToParagraphs(null)).toEqual([]);
  });

  it("decodes numeric entities", () => {
    expect(htmlToParagraphs("<p>&#8212; &#x2014;</p>")).toEqual(["— —"]);
  });
});

describe("diffParagraph", () => {
  it("marks a changed word in place", () => {
    expect(diffParagraph("the red sky burned", "the blue sky burned")).toEqual([
      { op: "equal", text: "the" },
      { op: "delete", text: "red" },
      { op: "insert", text: "blue" },
      { op: "equal", text: "sky burned" },
    ]);
  });

  it("handles a pure insertion", () => {
    expect(diffParagraph("Ix waits", "Ix waits alone")).toEqual([
      { op: "equal", text: "Ix waits" },
      { op: "insert", text: "alone" },
    ]);
  });

  it("handles empty sides", () => {
    expect(diffParagraph("", "new words")).toEqual([{ op: "insert", text: "new words" }]);
    expect(diffParagraph("old words", "")).toEqual([{ op: "delete", text: "old words" }]);
  });
});

describe("diffDocuments", () => {
  it("reports identical documents", () => {
    const d = diffDocuments("<p>A</p><p>B c</p>", "<p>A</p><p>B c</p>");
    expect(d.identical).toBe(true);
    expect(d.wordsAdded).toBe(0);
    expect(d.wordsRemoved).toBe(0);
    expect(d.paragraphs.every((p) => p.kind === "equal")).toBe(true);
  });

  it("shows added and removed paragraphs, and word changes inside edited ones", () => {
    const before = "<p>One two three.</p><p>Gone forever.</p><p>Kept.</p>";
    const after = "<p>One two four.</p><p>Kept.</p><p>Brand new line.</p>";
    const d = diffDocuments(before, after);
    expect(d.identical).toBe(false);
    expect(d.paragraphs.map((p) => p.kind)).toEqual(["change", "delete", "equal", "insert"]);
    expect(d.wordsRemoved).toBe(1 + 2);
    expect(d.wordsAdded).toBe(1 + 3);
  });

  it("stays linear-ish on a long document with one edit", () => {
    const para = (i: number) => `<p>Paragraph ${i} ${"word ".repeat(40)}</p>`;
    const base = Array.from({ length: 2000 }, (_, i) => para(i)).join("");
    const edited = base.replace("Paragraph 1000 word", "Paragraph 1000 changed");
    const t0 = Date.now();
    const d = diffDocuments(base, edited);
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(d.wordsAdded).toBe(1);
    expect(d.wordsRemoved).toBe(1);
  });
});
