import { describe, it, expect } from "vitest";
import {
  extractWorksheetFacts,
  hasFactMapping,
  summarizeFacts,
} from "@/lib/worksheet-facts";

describe("extractWorksheetFacts", () => {
  it("pairs the master-field label with the value at the tool's mapped path", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: 1.47 },
    });
    expect(facts).toContainEqual({
      key: "surfaceGravity",
      label: "Surface Gravity (g)",
      value: "1.47",
    });
  });

  it("reads a second mapped path on the same tool", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      stellarEnvironment: { starType: "K2V" },
    });
    expect(facts.map((f) => f.key)).toContain("starType");
  });

  it("omits unfilled fields rather than emitting blanks", () => {
    expect(extractWorksheetFacts("planetary-profile", {})).toEqual([]);
    expect(
      extractWorksheetFacts("planetary-profile", {
        physicalCharacteristics: { surfaceGravity: "" },
      }),
    ).toEqual([]);
  });

  it("returns nothing for a tool with no mapping", () => {
    expect(extractWorksheetFacts("not-a-real-tool", { a: 1 })).toEqual([]);
  });

  it("survives junk input instead of throwing", () => {
    expect(extractWorksheetFacts("planetary-profile", null)).toEqual([]);
    expect(extractWorksheetFacts("", { a: 1 })).toEqual([]);
    expect(
      extractWorksheetFacts("planetary-profile", { physicalCharacteristics: null }),
    ).toEqual([]);
  });

  it("joins array values into one display string", () => {
    const facts = extractWorksheetFacts("evolutionary-biology", {
      biochemistry: { biochemicalBasis: ["carbon", "silicon"] },
    });
    const fact = facts.find((f) => f.key === "biochemicalBasis");
    expect(fact?.value).toBe("carbon, silicon");
  });

  it("does not emit a container object as a fact", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: { nested: 1 } },
    });
    expect(facts.find((f) => f.key === "surfaceGravity")).toBeUndefined();
  });

  it("never repeats a key even when shared across entity types", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: 1.47 },
      stellarEnvironment: { starType: "G2V" },
    });
    expect(new Set(facts.map((f) => f.key)).size).toBe(facts.length);
  });
});

describe("hasFactMapping", () => {
  it("is true for a mapped tool and false for an unmapped one", () => {
    expect(hasFactMapping("planetary-profile")).toBe(true);
    // Simulators persist to simulation_saves, not worksheets, so they are
    // deliberately unmapped here.
    expect(hasFactMapping("rogue")).toBe(false);
  });
});

describe("summarizeFacts", () => {
  it("joins the leading facts for a one-line preview", () => {
    const summary = summarizeFacts([
      { key: "a", label: "Gravity", value: "1.47" },
      { key: "b", label: "Star", value: "K2V" },
      { key: "c", label: "Day", value: "18h" },
      { key: "d", label: "Extra", value: "dropped" },
    ]);
    expect(summary).toBe("Gravity: 1.47 · Star: K2V · Day: 18h");
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(summarizeFacts([])).toBe("");
  });
});
