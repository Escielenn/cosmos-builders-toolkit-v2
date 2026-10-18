import { describe, it, expect } from "vitest";
import { mergeCanonFacts, displayValue, sameValue } from "@/canon/merge";
import type { ProjectedInput } from "@/canon/types";
import { row } from "./memory-store";

function projected(p: Partial<ProjectedInput> & Pick<ProjectedInput, "ref" | "factKey" | "insert">): ProjectedInput {
  return {
    label: p.factKey,
    value: p.insert,
    entityId: null,
    href: "/tools/planetary-profile?worldId=w&worksheetId=ws",
    sourceKind: "worksheet",
    toolLabel: "Genesis",
    sourceTitle: "Kellis Prime",
    tool: "planetary-profile",
    ...p,
  };
}

const gWorksheet = projected({ ref: "worksheet:ws:surfaceGravity", factKey: "surfaceGravity", insert: "1.6 g", entityId: "kellis" });
const gCanon = row({
  id: "c1",
  subject_id: "kellis",
  predicate: "planet.surface_gravity",
  value: { kind: "scalar", value: 1.4, unit: "g" },
  value_text: "1.4 g",
  confidence: "canon",
});
const gProposed = row({
  id: "p1",
  subject_id: "kellis",
  predicate: "planet.surface_gravity",
  value: { kind: "scalar", value: 1.5, unit: "g" },
  value_text: "1.5 g",
  confidence: "proposed",
  source_kind: "prose",
});

describe("mergeCanonFacts: precedence canon > proposed > projected", () => {
  it("projected alone is returned as projected", () => {
    const [f] = mergeCanonFacts("w", [], [gWorksheet]);
    expect(f).toMatchObject({ predicate: "planet.surface_gravity", confidence: "projected", valueText: "1.6 g", subjectId: "kellis" });
    expect(f.provenance).toMatchObject({ kind: "worksheet", label: "Genesis · Kellis Prime" });
    expect(f.outranks).toEqual([]);
  });

  it("canon outranks proposed and projected for the same (subject, predicate)", () => {
    const out = mergeCanonFacts("w", [gProposed, gCanon], [gWorksheet]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: "c1", confidence: "canon", valueText: "1.4 g", conflicted: true });
    expect(out[0].outranks.map((o) => o.confidence)).toEqual(["proposed", "projected"]);
  });

  it("proposed outranks projected, and the disagreement is surfaced, not hidden", () => {
    const [f] = mergeCanonFacts("w", [gProposed], [gWorksheet]);
    expect(f).toMatchObject({ id: "p1", confidence: "proposed", conflicted: true });
    expect(f.outranks[0].valueText).toBe("1.6 g");
  });

  it("agreeing values are not a conflict", () => {
    const [f] = mergeCanonFacts("w", [{ ...gCanon, value_text: "1.6 g" }], [gWorksheet]);
    expect(f.conflicted).toBe(false);
  });

  it("different subjects never compete", () => {
    const other = projected({ ref: "worksheet:ws2:surfaceGravity", factKey: "surfaceGravity", insert: "0.9 g", entityId: "verrid" });
    const out = mergeCanonFacts("w", [gCanon], [gWorksheet, other]);
    expect(out.map((f) => [f.subjectId, f.confidence])).toEqual([
      ["kellis", "canon"],
      ["verrid", "projected"],
    ]);
  });

  it("ignores superseded rows and rows from other worlds", () => {
    const out = mergeCanonFacts("w", [{ ...gCanon, superseded_at: "2026-10-02T00:00:00Z" }, { ...gProposed, world_id: "x" }], [gWorksheet]);
    expect(out).toHaveLength(1);
    expect(out[0].confidence).toBe("projected");
  });

  it("the newest of two stored facts in the same tier wins", () => {
    const older = { ...gProposed, id: "p0", updated_at: "2026-09-01T00:00:00Z", value_text: "1.2 g" };
    const [f] = mergeCanonFacts("w", [older, gProposed], []);
    expect(f.id).toBe("p1");
  });

  it("deprecated spellings land in the same slot as their canonical name", () => {
    const old = row({ id: "d1", predicate: "planet.mass_earths", subject_id: "kellis", value: { kind: "scalar", value: 2, unit: "earth_masses" } });
    const mass = projected({ ref: "worksheet:ws:mass", factKey: "mass", insert: "1.8 Earth masses", entityId: "kellis" });
    const [f] = mergeCanonFacts("w", [old], [mass]);
    expect(f).toMatchObject({ predicate: "planet.mass", confidence: "canon", valueText: "2 M⊕" });
    expect(f.outranks).toHaveLength(1);
  });

  it("filters by subject and by predicate (alias-aware)", () => {
    const tilt = projected({ ref: "worksheet:ws:axialTilt", factKey: "axialTilt", insert: "23 degrees", entityId: "kellis" });
    expect(mergeCanonFacts("w", [gCanon], [gWorksheet, tilt], { predicate: "planet.obliquity" }).map((f) => f.id)).toEqual([
      "worksheet:ws:axialTilt",
    ]);
    expect(mergeCanonFacts("w", [gCanon], [gWorksheet], { subjectId: "nobody" })).toEqual([]);
    expect(mergeCanonFacts("w", [], [gWorksheet], { predicate: "surfaceGravity" })).toHaveLength(1);
  });
});

describe("value helpers", () => {
  it("formats typed values with their unit", () => {
    expect(displayValue({ kind: "scalar", value: 1.4, unit: "g" })).toBe("1.4 g");
    expect(displayValue({ kind: "range", min: 1, max: 2, unit: "au" })).toBe("1–2 AU");
    expect(displayValue({ kind: "bool", value: true })).toBe("Yes");
    expect(displayValue({ kind: "text[]", values: ["a", "b"] })).toBe("a, b");
  });
  it("compares values structurally, key order ignored", () => {
    expect(sameValue({ kind: "scalar", value: 1, unit: "g" }, { unit: "g", value: 1, kind: "scalar" } as never)).toBe(true);
    expect(sameValue({ kind: "scalar", value: 1, unit: "g" }, { kind: "scalar", value: 1.1, unit: "g" })).toBe(false);
  });
});
