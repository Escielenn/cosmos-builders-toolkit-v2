import { describe, it, expect } from "vitest";
import {
  readDocMeta,
  writeDocMeta,
  isDocMetaEmpty,
  EMPTY_DOC_META,
} from "@/lib/document-meta";

describe("readDocMeta", () => {
  it("reads the four fields", () => {
    expect(
      readDocMeta({ synopsis: "Ix meets the Talto.", pov: "Ix", status: "draft", when: "Sol 2412" }),
    ).toEqual({ synopsis: "Ix meets the Talto.", pov: "Ix", status: "draft", when: "Sol 2412" });
  });

  it("returns empty for the {} every existing document was created with", () => {
    expect(readDocMeta({})).toEqual(EMPTY_DOC_META);
  });

  it("never throws on junk, since the column is untyped", () => {
    expect(readDocMeta(null)).toEqual(EMPTY_DOC_META);
    expect(readDocMeta(undefined)).toEqual(EMPTY_DOC_META);
    expect(readDocMeta("nonsense")).toEqual(EMPTY_DOC_META);
    expect(readDocMeta(42)).toEqual(EMPTY_DOC_META);
    expect(readDocMeta([1, 2, 3])).toEqual(EMPTY_DOC_META);
  });

  it("drops a status that is not in the vocabulary", () => {
    expect(readDocMeta({ status: "banana" }).status).toBe("");
  });

  it("coerces non-string field values to empty rather than rendering them", () => {
    const m = readDocMeta({ synopsis: 12, pov: { a: 1 }, when: false });
    expect(m.synopsis).toBe("");
    expect(m.pov).toBe("");
    expect(m.when).toBe("");
  });
});

describe("writeDocMeta", () => {
  it("merges a patch", () => {
    expect(writeDocMeta({ synopsis: "old" }, { pov: "Ix" })).toEqual({
      synopsis: "old",
      pov: "Ix",
    });
  });

  it("preserves keys other features may own", () => {
    const out = writeDocMeta({ someOtherFeature: { keep: true } }, { pov: "Ix" });
    expect(out.someOtherFeature).toEqual({ keep: true });
  });

  it("removes a field when cleared, instead of storing an empty string", () => {
    expect(writeDocMeta({ pov: "Ix" }, { pov: "" })).toEqual({});
  });

  it("starts from an object when the column held junk", () => {
    expect(writeDocMeta(null, { status: "final" })).toEqual({ status: "final" });
    expect(writeDocMeta("junk", { status: "final" })).toEqual({ status: "final" });
  });

  it("round-trips through read", () => {
    const written = writeDocMeta({}, { synopsis: "A leap on Ashfall.", status: "revised" });
    const read = readDocMeta(written);
    expect(read.synopsis).toBe("A leap on Ashfall.");
    expect(read.status).toBe("revised");
  });
});

describe("isDocMetaEmpty", () => {
  it("is true for a fresh document and false once anything is set", () => {
    expect(isDocMetaEmpty(EMPTY_DOC_META)).toBe(true);
    expect(isDocMetaEmpty({ ...EMPTY_DOC_META, pov: "Ix" })).toBe(false);
  });
});
