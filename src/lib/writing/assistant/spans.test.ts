import { describe, expect, it } from "vitest";
import { blockText, collectBlocks, offsetToPos, scalarOffsets, scalarSpanToUtf16, spanToRange } from "./spans";
import { bold, br, doc, fact, mention, p, schema } from "./test-schema";

/** The document text a range covers, the way the engine verifies it. */
const slice = (d: ReturnType<typeof doc>, r: { from: number; to: number }) => d.textBetween(r.from, r.to, "\n", "\n");

describe("scalarOffsets", () => {
  it("is the identity for plain text", () => {
    expect(scalarOffsets("abc")).toEqual([0, 1, 2, 3]);
  });
  it("gives an emoji one scalar and two units", () => {
    // "a😀b": scalars a, 😀, b -> offsets 0, 1, 3, 4
    expect(scalarOffsets("a\u{1F600}b")).toEqual([0, 1, 3, 4]);
  });
  it("treats a lone surrogate as one unit", () => {
    expect(scalarOffsets("a\uD83Db")).toEqual([0, 1, 2, 3]);
  });
});

describe("scalarSpanToUtf16", () => {
  const text = "\u{1F680} Teh ship \u{1F6F0}️ lef orbit";
  const offsets = scalarOffsets(text);
  it("converts a span that follows an emoji", () => {
    // Scalars: 🚀(0) space(1) T(2) e(3) h(4)
    expect(scalarSpanToUtf16(text, offsets, 2, 5, "Teh")).toEqual({ start: 3, end: 6 });
  });
  it("converts a span after two emoji and a variation selector", () => {
    const scalars = Array.from(text);
    const start = scalars.join("").indexOf("lef");
    const scalarStart = Array.from(text.slice(0, start)).length;
    expect(scalarSpanToUtf16(text, offsets, scalarStart, scalarStart + 3, "lef")).toEqual({ start, end: start + 3 });
  });
  it("falls back to UTF-16 numbers when those are what match", () => {
    expect(scalarSpanToUtf16(text, offsets, 3, 6, "Teh")).toEqual({ start: 3, end: 6 });
  });
  it("is null when neither reading matches", () => {
    expect(scalarSpanToUtf16(text, offsets, 0, 2, "Teh")).toBeNull();
    expect(scalarSpanToUtf16(text, offsets, 90, 95, "Teh")).toBeNull();
  });
});

describe("blockText and spanToRange", () => {
  it("maps plain text one to one", () => {
    const d = doc(p("First."), p("Teh ship left."));
    const second = d.child(1);
    const block = blockText(second, d.child(0).nodeSize);
    expect(block.text).toBe("Teh ship left.");
    const range = spanToRange(block, 0, 3);
    expect(range).not.toBeNull();
    expect(slice(d, range!)).toBe("Teh");
  });

  it("maps across marks", () => {
    const d = doc(p("The ", bold("gravty"), " held."));
    const block = blockText(d.child(0), 0);
    expect(block.text).toBe("The gravty held.");
    const start = block.text.indexOf("gravty");
    const range = spanToRange(block, start, start + 6)!;
    expect(slice(d, range)).toBe("gravty");
    // A span that crosses the mark boundary still maps.
    const across = spanToRange(block, start + 4, start + 11)!;
    expect(slice(d, across)).toBe("ty held");
  });

  it("maps text after an emoji (UTF-16 offsets, two units per emoji)", () => {
    const d = doc(p("\u{1F680}\u{1F680} Teh ship"));
    const block = blockText(d.child(0), 0);
    const start = block.text.indexOf("Teh");
    expect(start).toBe(5);
    const range = spanToRange(block, start, start + 3)!;
    expect(range).toEqual({ from: 6, to: 9 });
    expect(slice(d, range)).toBe("Teh");
  });

  it("reads an @mention as its label and maps text on both sides of it", () => {
    const d = doc(p("Jessa reched ", mention("Kellis Prime"), " befor dusk."));
    const block = blockText(d.child(0), 0);
    expect(block.text).toBe("Jessa reched Kellis Prime befor dusk.");
    const before = block.text.indexOf("reched");
    expect(slice(d, spanToRange(block, before, before + 6)!)).toBe("reched");
    const after = block.text.indexOf("befor");
    const range = spanToRange(block, after, after + 5)!;
    expect(slice(d, range)).toBe("befor");
    // The mention is one position wide in the document, twelve in the text.
    expect(range.from).toBe(1 + "Jessa reched ".length + 1 + 1);
  });

  it("refuses a span that touches a mention or a cited fact", () => {
    const d = doc(p("At ", mention("Kelis Prime"), " the pull was ", fact("1.8 g"), "."));
    const block = blockText(d.child(0), 0);
    const name = block.text.indexOf("Kelis");
    expect(spanToRange(block, name, name + 5)).toBeNull();
    // Overlapping from the prose into the chip is refused too.
    expect(spanToRange(block, 0, name + 2)).toBeNull();
    const value = block.text.indexOf("1.8");
    expect(spanToRange(block, value, value + 3)).toBeNull();
    // Prose between the two chips still maps.
    const pull = block.text.indexOf("pull");
    expect(slice(d, spanToRange(block, pull, pull + 4)!)).toBe("pull");
  });

  it("handles an emoji, a mention and a mark in one paragraph", () => {
    const d = doc(p("\u{1F525} ", mention("Orrin"), " sed ", bold("nothng"), " \u{1F30C} agian."));
    const block = blockText(d.child(0), 0);
    for (const word of ["sed", "nothng", "agian"]) {
      const at = block.text.indexOf(word);
      const range = spanToRange(block, at, at + word.length);
      expect(range, word).not.toBeNull();
      expect(slice(d, range!), word).toBe(word);
    }
  });

  it("treats a hard break as a line break it will not underline", () => {
    const d = doc(p("one", br(), "twoo"));
    const block = blockText(d.child(0), 0);
    expect(block.text).toBe("one\ntwoo");
    expect(spanToRange(block, 2, 5)).toBeNull();
    expect(slice(d, spanToRange(block, 4, 8)!)).toBe("twoo");
  });

  it("rejects empty and out-of-range spans", () => {
    const block = blockText(doc(p("abc")).child(0), 0);
    expect(spanToRange(block, 1, 1)).toBeNull();
    expect(spanToRange(block, -1, 2)).toBeNull();
    expect(spanToRange(block, 1, 9)).toBeNull();
  });

  it("gives an insertion point after a word, including at the paragraph end", () => {
    const d = doc(p("ab cd"));
    const block = blockText(d.child(0), 0);
    expect(offsetToPos(block, 2)).toBe(3);
    expect(offsetToPos(block, 5)).toBe(6);
    expect(offsetToPos(block, 9)).toBeNull();
  });
});

describe("collectBlocks", () => {
  it("returns textblocks in order with their positions, skipping empties and code", () => {
    const d = doc(p("One."), p(), schema.nodes.codeBlock.create(null, schema.text("let x")), p("Two."));
    const { blocks, limited } = collectBlocks(d, 1000);
    expect(blocks.map((b) => b.block.text)).toEqual(["One.", "Two."]);
    expect(limited).toBe(false);
    expect(d.nodeAt(blocks[1].block.pos)).toBe(blocks[1].node);
  });
  it("stops at the character bound and says so", () => {
    const d = doc(p("a".repeat(60)), p("b".repeat(60)), p("c".repeat(60)));
    const { blocks, limited } = collectBlocks(d, 130);
    expect(blocks).toHaveLength(2);
    expect(limited).toBe(true);
  });
});
