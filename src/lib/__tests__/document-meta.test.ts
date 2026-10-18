import { describe, it, expect } from "vitest";
import {
  readDocMeta,
  writeDocMeta,
  isDocMetaEmpty,
  EMPTY_DOC_META,
  targetProgress,
} from "@/lib/document-meta";

describe("readDocMeta", () => {
  it("reads the five fields", () => {
    expect(
      readDocMeta({
        synopsis: "Ix meets the Talto.",
        pov: "Ix",
        status: "draft",
        when: "Sol 2412",
        subjectEntityId: "11111111-1111-1111-1111-111111111111",
      }),
    ).toEqual({
      synopsis: "Ix meets the Talto.",
      pov: "Ix",
      status: "draft",
      when: "Sol 2412",
      subjectEntityId: "11111111-1111-1111-1111-111111111111",
      notes: "",
      labelId: "",
      keywords: [],
      target: 0,
    });
  });

  it("reads the inspector fields (notes, label, keywords, target)", () => {
    const m = readDocMeta({
      notes: "Check the tide tables.",
      labelId: "lbl-1",
      keywords: ["flashback", " Ix ", "", 7, "FLASHBACK"],
      target: 2500,
    });
    expect(m.notes).toBe("Check the tide tables.");
    expect(m.labelId).toBe("lbl-1");
    expect(m.keywords).toEqual(["flashback", "Ix"]);
    expect(m.target).toBe(2500);
  });

  it("tolerates a junk target", () => {
    expect(readDocMeta({ target: -4 }).target).toBe(0);
    expect(readDocMeta({ target: "abc" }).target).toBe(0);
    expect(readDocMeta({ target: "1200" }).target).toBe(1200);
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

describe("writeDocMeta, inspector fields", () => {
  it("removes cleared keywords and a zero target", () => {
    expect(writeDocMeta({ keywords: ["a"], target: 900 }, { keywords: [], target: 0 })).toEqual({});
  });

  it("normalises keywords on write", () => {
    expect(writeDocMeta({}, { keywords: [" a ", "A", "b"] })).toEqual({ keywords: ["a", "b"] });
  });
});

describe("targetProgress", () => {
  it("clamps to 0..1 and is 0 without a target", () => {
    expect(targetProgress(500, 1000)).toBe(0.5);
    expect(targetProgress(5000, 1000)).toBe(1);
    expect(targetProgress(500, 0)).toBe(0);
  });
});

describe("isDocMetaEmpty", () => {
  it("is true for a fresh document and false once anything is set", () => {
    expect(isDocMetaEmpty(EMPTY_DOC_META)).toBe(true);
    expect(isDocMetaEmpty({ ...EMPTY_DOC_META, pov: "Ix" })).toBe(false);
  });
});
