import { describe, expect, it } from "vitest";
import {
  chunk,
  classifyZeroRowSave,
  estimateSectionHeight,
  overlayUnsaved,
  patchContent,
  patchRow,
  rowWords,
  withContents,
  type DocContent,
  type ServerDocCopy,
} from "@/lib/writing/doc-scale";

const server = (over: Partial<ServerDocCopy> = {}): ServerDocCopy => ({
  id: "d1",
  title: "One",
  content: "<p>theirs</p>",
  updated_at: "2026-10-18T10:00:00.000000+00:00",
  content_version: 4,
  ...over,
});

describe("classifyZeroRowSave", () => {
  it("a moved version is a conflict", () => {
    expect(classifyZeroRowSave(server(), 3, "<p>mine</p>")).toBe("conflict");
  });
  it("identical text on the server is already saved", () => {
    expect(classifyZeroRowSave(server({ content: "<p>mine</p>" }), 3, "<p>mine</p>")).toBe("same");
  });
  it("an invisible row, or nothing moved, is no write access", () => {
    expect(classifyZeroRowSave(null, 3, "<p>mine</p>")).toBe("denied");
    expect(classifyZeroRowSave(server({ content_version: 3 }), 3, "<p>mine</p>")).toBe("denied");
  });
  it("without a base version it can never claim a conflict", () => {
    expect(classifyZeroRowSave(server(), null, "<p>mine</p>")).toBe("denied");
    expect(classifyZeroRowSave(server({ content_version: null }), 3, "<p>mine</p>")).toBe("denied");
  });
});

describe("content records", () => {
  const rec: Record<string, DocContent> = {
    a: { content: "<p>a</p>", updated_at: "t1", content_version: 1 },
  };

  it("patchContent keeps identity when nothing changes, and ignores unknown docs", () => {
    expect(patchContent(rec, "a", { content: "<p>a</p>" })).toBe(rec);
    expect(patchContent(rec, "zz", { content: "x" })).toBe(rec);
    expect(patchContent(undefined, "a", { content: "x" })).toBeUndefined();
    const next = patchContent(rec, "a", { content: "<p>b</p>" });
    expect(next).not.toBe(rec);
    expect(next?.a.content).toBe("<p>b</p>");
    expect(rec.a.content).toBe("<p>a</p>");
  });

  it("overlayUnsaved lays this device's unconfirmed words over a fetch", () => {
    const fetched: Record<string, DocContent> = {
      a: { content: "<p>old</p>", updated_at: "t1", content_version: 1 },
      b: { content: "<p>b</p>", updated_at: "t1", content_version: 1 },
    };
    const out = overlayUnsaved(fetched, new Map([["a", "<p>typed</p>"], ["gone", "<p>x</p>"]]));
    expect(out.a.content).toBe("<p>typed</p>");
    expect(out.b.content).toBe("<p>b</p>");
    expect(out.gone).toBeUndefined();
  });

  it("withContents attaches text, null where not loaded", () => {
    const rows = withContents([{ id: "a" }, { id: "b" }], rec);
    expect(rows).toEqual([
      { id: "a", content: "<p>a</p>" },
      { id: "b", content: null },
    ]);
  });
});

describe("patchRow", () => {
  it("returns the same array when the row already matches", () => {
    const list = [{ id: "a", word_count: 3 }, { id: "b", word_count: 1 }];
    expect(patchRow(list, "a", { word_count: 3 })).toBe(list);
    expect(patchRow(list, "x", { word_count: 9 })).toBe(list);
    const next = patchRow(list, "b", { word_count: 9 })!;
    expect(next).not.toBe(list);
    expect(next[1].word_count).toBe(9);
    expect(next[0]).toBe(list[0]);
  });
});

describe("rowWords", () => {
  it("prefers the stored count, else counts the text", () => {
    expect(rowWords({ word_count: 12, content: "<p>one</p>" })).toBe(12);
    expect(rowWords({ content: "<p>one two</p><p>three</p>" })).toBe(3);
    expect(rowWords({})).toBe(0);
  });
});

describe("chunk", () => {
  it("splits into request-sized groups", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("estimateSectionHeight", () => {
  it("uses a measured height when known, else estimates from words", () => {
    expect(estimateSectionHeight(500, 812.4)).toBe(812);
    expect(estimateSectionHeight(0)).toBeGreaterThan(0);
    expect(estimateSectionHeight(1100)).toBeGreaterThan(estimateSectionHeight(110));
  });
});
