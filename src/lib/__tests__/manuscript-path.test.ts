import { describe, expect, it } from "vitest";
import { isManuscriptPath, isWorldManuscriptPath, manuscriptPath } from "../manuscript-path";

describe("manuscriptPath", () => {
  it("nests a document under its world", () => {
    expect(manuscriptPath("w1", "d1")).toBe("/worlds/w1/write/d1");
  });

  it("names the world's Manuscript when no document is given", () => {
    expect(manuscriptPath("w1")).toBe("/worlds/w1/write");
    expect(manuscriptPath("w1", null)).toBe("/worlds/w1/write");
  });

  it("carries the import flag", () => {
    expect(manuscriptPath("w1", "d1", { import: true })).toBe("/worlds/w1/write/d1?import=1");
    expect(manuscriptPath("w1", undefined, { import: true })).toBe("/worlds/w1/write?import=1");
  });
});

describe("isManuscriptPath", () => {
  it("matches the nested editor and the legacy routes", () => {
    expect(isManuscriptPath("/worlds/w1/write/d1")).toBe(true);
    expect(isManuscriptPath("/worlds/w1/write")).toBe(true);
    expect(isManuscriptPath("/write")).toBe(true);
    expect(isManuscriptPath("/write/d1")).toBe(true);
  });

  it("does not match neighbours that share a prefix", () => {
    expect(isManuscriptPath("/writer")).toBe(false);
    expect(isManuscriptPath("/worlds/w1/writers")).toBe(false);
    expect(isManuscriptPath("/worlds/w1/codex")).toBe(false);
    expect(isManuscriptPath("/worlds/w1/compile")).toBe(false);
  });
});

describe("isWorldManuscriptPath", () => {
  it("is scoped to one world", () => {
    expect(isWorldManuscriptPath("/worlds/w1/write/d1", "w1")).toBe(true);
    expect(isWorldManuscriptPath("/worlds/w1/write", "w1")).toBe(true);
    expect(isWorldManuscriptPath("/worlds/w2/write/d1", "w1")).toBe(false);
    expect(isWorldManuscriptPath("/worlds/w1/writeup", "w1")).toBe(false);
  });
});
