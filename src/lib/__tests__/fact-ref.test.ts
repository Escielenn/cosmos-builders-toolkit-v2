import { describe, it, expect } from "vitest";
import {
  extractFactRefs,
  factRefId,
  factRefStatus,
  factRefToHtml,
  flattenFactRefs,
  sanitizeFactRefAttrs,
  staleLine,
  type FactRefAttrs,
} from "@/lib/writing/fact-ref";
import { DEFAULT_COMPILE, buildManuscript } from "@/lib/manuscript/compile";
import { manuscriptToMarkdown, manuscriptToText } from "@/lib/manuscript/text-formats";

// The per-document export and the compile page share one pipeline now
// (the old lib/manuscript-compile.ts is gone): a one-document manuscript.
type Chapter = { id: string; title: string; content: string };
const one = (meta: { title: string; author: string }, chapters: Chapter[]) =>
  buildManuscript(
    chapters.map((c) => ({ id: c.id, title: c.title, isFolder: false, html: c.content, children: [] })),
    { ...DEFAULT_COMPILE, title: meta.title, author: meta.author, numbering: "none", titlePage: false },
  );
const compileManuscriptPlainText = (meta: { title: string; author: string }, chapters: Chapter[]) =>
  manuscriptToText(one(meta, chapters));
const compileManuscriptMarkdown = (meta: { title: string; author: string }, chapters: Chapter[]) =>
  manuscriptToMarkdown(one(meta, chapters));

const GRAVITY: FactRefAttrs = {
  factKey: "surfaceGravity",
  value: "1.4 g",
  tool: "planetary-profile",
  worksheetId: "ws-1",
  sourceKind: "worksheet",
  entityId: "planet-1",
  label: "Surface Gravity (g)",
};

describe("fact-ref serialization", () => {
  it("round-trips through HTML", () => {
    const html = `<p>The pull was ${factRefToHtml(GRAVITY)} and rising.</p>`;
    expect(html).toContain('data-fact-key="surfaceGravity"');
    expect(html).toContain(">1.4 g</fact-ref>");
    expect(extractFactRefs(html)).toEqual([GRAVITY]);
  });

  it("escapes values and labels", () => {
    const a = { ...GRAVITY, value: `<3 "quoted" & more`, label: "A & B" };
    const html = factRefToHtml(a);
    expect(html).not.toContain("<3");
    expect(extractFactRefs(html)[0]).toEqual(a);
  });

  it("omits empty ids and reads them back as null", () => {
    const a = { ...GRAVITY, worksheetId: null, entityId: null, sourceKind: "entity" as const };
    const html = factRefToHtml(a);
    expect(html).not.toContain("data-worksheet-id");
    expect(extractFactRefs(html)[0]).toEqual(a);
  });

  it("tolerates a ref with no data-value (uses its text) and junk attributes", () => {
    const refs = extractFactRefs('<fact-ref data-fact-key="k" data-source-kind="bogus">9 days</fact-ref>');
    expect(refs[0].value).toBe("9 days");
    expect(refs[0].sourceKind).toBe("worksheet");
    expect(refs[0].worksheetId).toBeNull();
  });

  it("finds nothing in an old document", () => {
    expect(extractFactRefs("<p>Plain prose, no refs.</p>")).toEqual([]);
    expect(extractFactRefs(null)).toEqual([]);
  });

  it("sanitizes partial attrs", () => {
    expect(sanitizeFactRefAttrs({ factKey: "x", worksheetId: "null" })).toMatchObject({
      factKey: "x",
      value: "",
      worksheetId: null,
      sourceKind: "worksheet",
    });
  });

  it("gives refs to the same fact the same id", () => {
    expect(factRefId(GRAVITY)).toBe("worksheet:ws-1:surfaceGravity");
    expect(factRefId({ ...GRAVITY, value: "2 g" } as FactRefAttrs)).toBe(factRefId(GRAVITY));
    expect(factRefId({ sourceKind: "entity", worksheetId: null, entityId: "e1", factKey: "k" })).toBe("entity:e1:k");
  });
});

describe("flattenFactRefs", () => {
  it("prints the STORED value, never the inner markup", () => {
    // The text inside the tag disagrees with data-value: the stored value wins.
    const html = '<p>It was <fact-ref data-fact-key="g" data-value="1.4 g">1.6 g</fact-ref>.</p>';
    expect(flattenFactRefs(html)).toBe("<p>It was 1.4 g.</p>");
  });

  it("leaves documents without refs untouched", () => {
    const html = "<p>No refs <strong>here</strong>.</p>";
    expect(flattenFactRefs(html)).toBe(html);
  });

  it("keeps escaping intact for downstream decoders", () => {
    const html = `<p>${factRefToHtml({ ...GRAVITY, value: "a < b" })}</p>`;
    expect(flattenFactRefs(html)).toBe("<p>a &lt; b</p>");
  });
});

describe("staleness", () => {
  it("is current when the source still says the same", () => {
    expect(factRefStatus(GRAVITY, { insert: "1.4 g" })).toEqual({ state: "current", now: "1.4 g" });
    // Whitespace noise is not a change.
    expect(factRefStatus(GRAVITY, { insert: " 1.4  g " }).state).toBe("current");
  });

  it("is stale when the source moved on", () => {
    const s = factRefStatus(GRAVITY, { insert: "1.6 g" });
    expect(s).toEqual({ state: "stale", was: "1.4 g", now: "1.6 g" });
    expect(staleLine(s)).toBe("WAS 1.4 g · NOW 1.6 g");
  });

  it("is missing when the source no longer records it", () => {
    const s = factRefStatus(GRAVITY, undefined);
    expect(s.state).toBe("missing");
    expect(staleLine(s)).toBe("WAS 1.4 g · NO LONGER ON FILE");
  });

  it("treats case as meaning", () => {
    expect(factRefStatus({ value: "M4V" }, { insert: "m4v" }).state).toBe("stale");
  });
});

describe("compile renders fact refs as plain text of the stored value", () => {
  const meta = { title: "Kellis", author: "J" };
  const content = `<p>Gravity: <fact-ref data-fact-key="g" data-value="1.4 g" data-label="Surface Gravity (g)">1.6 g</fact-ref>, <em>${factRefToHtml({ ...GRAVITY, value: "34 hours" })}</em> days.</p>`;

  it("plain text", () => {
    const txt = compileManuscriptPlainText(meta, [{ id: "1", title: "One", content }]);
    expect(txt).toContain("Gravity: 1.4 g, 34 hours days.");
    expect(txt).not.toContain("fact-ref");
    expect(txt).not.toContain("1.6 g");
  });

  it("markdown", () => {
    const md = compileManuscriptMarkdown(meta, [{ id: "1", title: "One", content }]);
    expect(md).toContain("Gravity: 1.4 g, *34 hours* days.");
    expect(md).not.toContain("data-");
  });

  it("old documents compile as before", () => {
    const md = compileManuscriptMarkdown(meta, [{ id: "1", title: "One", content: "<p>Just <strong>words</strong>.</p>" }]);
    expect(md).toContain("Just **words**.");
  });
});
