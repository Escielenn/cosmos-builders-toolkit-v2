import { describe, expect, it } from "vitest";
import {
  locateInParagraphs,
  paragraphFromNode,
  paragraphsFromDoc,
  paragraphsFromHtml,
  rangeInParagraph,
  type PMNodeLike,
} from "@/lib/writing/capture/paragraphs";
import { createCaptureCache, detectParagraphs, type Paragraph } from "@/lib/writing/capture/detect";
import { buildBindContext, captureParagraphs, indexFactsByPredicate } from "@/lib/writing/capture";

// --- a tiny ProseMirror stand-in --------------------------------------------

type Child = { text: string } | { mention: string; label: string } | { fact: string } | { br: true };

function textblock(children: Child[]): PMNodeLike {
  const nodes: PMNodeLike[] = children.map((c) => {
    if ("text" in c) return leaf("text", c.text.length, {}, true, c.text);
    if ("mention" in c) return leaf("entityMention", 1, { id: c.mention, label: c.label });
    if ("fact" in c) return leaf("factRef", 1, { value: c.fact });
    return leaf("hardBreak", 1, {});
  });
  return {
    isTextblock: true,
    isText: false,
    type: { name: "paragraph" },
    attrs: {},
    nodeSize: 2 + nodes.reduce((n, x) => n + x.nodeSize, 0),
    forEach(fn) {
      let off = 0;
      for (const n of nodes) {
        fn(n, off);
        off += n.nodeSize;
      }
    },
  };
}

function leaf(name: string, size: number, attrs: Record<string, unknown>, isText = false, text?: string): PMNodeLike {
  return { isTextblock: false, isText, text, type: { name }, attrs, nodeSize: size, forEach() {} };
}

function doc(blocks: PMNodeLike[]) {
  return {
    descendants(fn: (n: PMNodeLike, pos: number) => boolean | void) {
      let pos = 0;
      for (const b of blocks) {
        fn(b, pos);
        pos += b.nodeSize;
      }
    },
  };
}

describe("paragraphsFromHtml", () => {
  it("reads textblocks, mention labels, fenced fact refs and entities", () => {
    const html =
      '<h2>Arrival</h2><p>On <entity-mention data-id="k1" data-label="Kellis">Kellis</entity-mention> gravity was ' +
      '<fact-ref data-value="1.4 g">1.4 g</fact-ref> &amp; more.</p>' +
      '<ul><li><p>A <wiki-link data-element-id="s1" data-title="Spires">Spires</wiki-link> line<br>two</p></li></ul>';
    const ps = paragraphsFromHtml(html);
    expect(ps.map((p) => p.text)).toEqual(["Arrival", "On Kellis gravity was 1.4 g & more.", "A Spires line\ntwo"]);
    expect(ps[1].mentions).toEqual([{ id: "k1", start: 3, end: 9 }]);
    expect(ps[1].blocked).toEqual([{ start: 22, end: 27 }]);
    expect(ps[2].mentions[0].id).toBe("s1");
  });

  it("is empty for empty input", () => {
    expect(paragraphsFromHtml("")).toEqual([]);
    expect(paragraphsFromHtml(null)).toEqual([]);
  });
});

describe("paragraphsFromDoc and locating", () => {
  const d = doc([
    textblock([{ text: "Rain." }]),
    textblock([{ text: "On " }, { mention: "k1", label: "Kellis" }, { text: " gravity was 1.6 g of gravity." }]),
    textblock([{ text: "Cited " }, { fact: "1.4 g" }, { br: true }, { text: "end" }]),
  ]);

  it("matches the HTML reading and keeps positions", () => {
    const ps = paragraphsFromDoc(d);
    expect(ps.map((p) => p.text)).toEqual(["Rain.", "On Kellis gravity was 1.6 g of gravity.", "Cited 1.4 g\nend"]);
    expect(ps[1].mentions).toEqual([{ id: "k1", start: 3, end: 9 }]);
    expect(ps[2].blocked).toEqual([{ start: 6, end: 11 }]);
    // Paragraph 1 starts at pos 7 (first block is 5 chars + 2); its text
    // "On " sits at 8, the mention atom at 11, the next text node at 12.
    expect(ps[1].pos).toBe(7);
    expect(ps[1].segments).toEqual([
      { offset: 0, pos: 8, length: 3 },
      { offset: 9, pos: 12, length: 30 },
    ]);
  });

  it("maps a claim back to a ProseMirror range, also after text moved", () => {
    const ps = paragraphsFromDoc(d);
    const start = ps[1].text.indexOf("1.6 g");
    expect(rangeInParagraph(ps[1], start, start + 5)).toEqual({ from: 12 + (start - 9), to: 12 + (start - 9) + 5 });
    // A range starting inside a mention label cannot be selected as text.
    expect(rangeInParagraph(ps[1], 4, 12)).toBeNull();
    const found = locateInParagraphs(ps, { paragraphIndex: 0, start: 0, end: 5, match: "1.6 g" });
    expect(found?.paragraphIndex).toBe(1);
    expect(locateInParagraphs(ps, { paragraphIndex: 0, start: 0, end: 4, match: "nope" })).toBeNull();
  });

  it("paragraphFromNode puts a placeholder for unknown atoms", () => {
    const p = paragraphFromNode(
      { ...textblock([{ text: "a" }]), forEach: (fn) => fn(leaf("image", 1, {}), 0) },
      0,
    );
    expect(p.text).toBe("￼");
    expect(p.blocked).toEqual([{ start: 0, end: 1 }]);
  });
});

describe("performance: a 100k-word manuscript", () => {
  const FILLER =
    "The wind moved over the long grass of the plain and the light went thin and gold across the water while she counted the hours " +
    "and listened to the hull settle and thought about everything they had left behind on the far side of the dark between stars ";
  const CLAIMS = [
    "The planet's gravity was 1.6 g.",
    "Its day lasts thirty hours.",
    "A crew of 400 slept below.",
    "The year lasts 400 days.",
    "",
  ];
  const paragraphs: Paragraph[] = [];
  let words = 0;
  for (let i = 0; words < 100_000; i++) {
    const text = `${FILLER}${FILLER.slice(0, 120)} ${CLAIMS[i % CLAIMS.length]}`;
    words += text.split(/\s+/).filter(Boolean).length;
    paragraphs.push({ text, mentions: [] });
  }

  it("reads it cold in well under a second, and one edited paragraph in milliseconds", () => {
    expect(words).toBeGreaterThanOrEqual(100_000);
    const cache = createCaptureCache();
    const t0 = performance.now();
    const cold = detectParagraphs(paragraphs, cache);
    const coldMs = performance.now() - t0;
    expect(cold.flat().length).toBeGreaterThan(1000);
    // Generous for CI machines; locally this is ~100ms.
    expect(coldMs).toBeLessThan(2000);

    const edited = paragraphs.slice();
    edited[500] = { text: `${paragraphs[500].text} The mean temperature was 15 °C.`, mentions: [] };
    const before = cache.misses;
    const t1 = performance.now();
    detectParagraphs(edited, cache);
    const warmMs = performance.now() - t1;
    expect(cache.misses - before).toBe(1);
    expect(warmMs).toBeLessThan(50);
  });

  it("the full pipeline (bind + ledger) on a warm cache stays fast", () => {
    const cache = createCaptureCache();
    const ctx = buildBindContext([{ id: "k", entity_type: "planet" }], {});
    const index = indexFactsByPredicate([]);
    captureParagraphs("d", paragraphs, cache, ctx, index);
    const t = performance.now();
    const items = captureParagraphs("d", paragraphs, cache, ctx, index);
    expect(performance.now() - t).toBeLessThan(200);
    expect(items.length).toBeGreaterThan(1000);
  });
});
