import { describe, expect, it } from "vitest";
import { editDistance, linkSpan, matchName, nearThreshold } from "./entity-match";
import type { LexiconName } from "@/lib/writing/lexicon";

const NAMES: LexiconName[] = [
  { name: "Kellis Prime", source: "codex", entityId: "e1" },
  { name: "Vaultborn", source: "codex", entityId: "e2" },
  { name: "Orrin", source: "pov" },
  { name: "K'thar", source: "codex", entityId: "e3" },
  { name: "Thessaly Okonkwo-Reyes", source: "codex", entityId: "e4" },
];

describe("editDistance", () => {
  it("counts substitutions, insertions, deletions and swaps", () => {
    expect(editDistance("kellis", "kellis")).toBe(0);
    expect(editDistance("kelis", "kellis")).toBe(1);
    expect(editDistance("kellsi", "kellis")).toBe(1);
    expect(editDistance("kellix", "kellis")).toBe(1);
    expect(editDistance("vaultbron", "vaultborn")).toBe(1);
  });
  it("gives up past the bound", () => {
    expect(editDistance("abcdef", "uvwxyz", 2)).toBe(3);
    expect(editDistance("a", "abcdef", 2)).toBe(3);
  });
});

describe("nearThreshold", () => {
  it("allows nothing on short words, one slip on medium, two on long", () => {
    expect(nearThreshold(3)).toBe(0);
    expect(nearThreshold(5)).toBe(1);
    expect(nearThreshold(9)).toBe(2);
  });
});

describe("matchName", () => {
  it("finds a case slip", () => {
    expect(matchName("kellis", NAMES)).toMatchObject({ kind: "case", replacement: "Kellis", name: { entityId: "e1" } });
    expect(matchName("VaultBorn", NAMES)).toMatchObject({ kind: "case", replacement: "Vaultborn" });
  });
  it("finds a plural and keeps the plural", () => {
    expect(matchName("Vaultborns", NAMES)).toMatchObject({ kind: "plural", replacement: "Vaultborns", name: { entityId: "e2" } });
    expect(matchName("vaultborns", NAMES)).toMatchObject({ kind: "plural", replacement: "Vaultborns" });
  });
  it("finds a near miss and keeps the possessive", () => {
    expect(matchName("Kelis", NAMES)).toMatchObject({ kind: "near", replacement: "Kellis", distance: 1 });
    expect(matchName("Kelis's", NAMES)).toMatchObject({ kind: "near", replacement: "Kellis's" });
    expect(matchName("Kelis’s", NAMES)).toMatchObject({ kind: "near", replacement: "Kellis's" });
    expect(matchName("Thesaly", NAMES)).toMatchObject({ kind: "near", replacement: "Thessaly", name: { entityId: "e4" } });
  });
  it("prefers a case match to a near one and the Codex to weaker sources", () => {
    const names: LexiconName[] = [
      { name: "Orrin", source: "canon" },
      { name: "Orrin", source: "codex", entityId: "x" },
      { name: "Orran", source: "codex", entityId: "y" },
    ];
    expect(matchName("orrin", names)).toMatchObject({ kind: "case", name: { entityId: "x" } });
  });
  it("does not steer lower-case typos or short words toward the Codex", () => {
    expect(matchName("kelis", NAMES)).toBeNull();
    expect(matchName("Prim", [{ name: "Pri", source: "codex" }])).toBeNull();
    expect(matchName("Zebulon", NAMES)).toBeNull();
  });
  it("ignores apostrophe fragments of a name", () => {
    expect(matchName("Thar", NAMES)).toBeNull();
    expect(matchName("k'thar", NAMES)).toMatchObject({ kind: "case", replacement: "K'thar" });
  });
});

describe("linkSpan", () => {
  it("is the word itself for a one-word name", () => {
    const text = "The Vaultbron waited.";
    expect(linkSpan(text, 4, 13, "Vaultborn")).toEqual({ start: 4, end: 13 });
  });
  it("grows over the rest of a multi-word name", () => {
    const text = "They reached Kelis Prime at dusk.";
    const start = text.indexOf("Kelis");
    expect(linkSpan(text, start, start + 5, "Kellis Prime")).toEqual({ start, end: text.indexOf(" at dusk") });
  });
  it("grows backwards when the flagged word is the last one", () => {
    const text = "On Kellis Prine, nothing grew.";
    const start = text.indexOf("Prine");
    expect(linkSpan(text, start, start + 5, "Kellis Prime")).toEqual({ start: 3, end: start + 5 });
  });
  it("leaves a possessive outside the chip", () => {
    const text = "Kelis Prime's moons rose.";
    expect(linkSpan(text, 0, 5, "Kellis Prime")).toEqual({ start: 0, end: 11 });
  });
  it("does not grow when the other words are not there", () => {
    const text = "Kelis was quiet. Prime time.";
    expect(linkSpan(text, 0, 5, "Kellis Prime")).toEqual({ start: 0, end: 5 });
    const split = "Kelis, Prime of the fleet";
    expect(linkSpan(split, 0, 5, "Kellis Prime")).toEqual({ start: 0, end: 5 });
  });
});
