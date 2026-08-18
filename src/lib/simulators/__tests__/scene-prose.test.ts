import { describe, it, expect } from "vitest";
import { generateSceneProse } from "@/lib/simulators/scene-prose";
import type { WorksheetFact } from "@/lib/worksheet-facts";

const tidelockFacts = (over: Partial<Record<string, string>> = {}): WorksheetFact[] => {
  const defaults: Record<string, string> = {
    "locked.daySide": "391 K (118°C), scorching",
    "locked.nightSide": "168 K (-105°C), frozen",
    "locked.terminator": "279 K (6°C), temperate",
    "locked.habitableBand": "12.4% of the surface (marginal)",
    "locked.gravity": "1.03 g",
    "locked.tidalState": "Locked",
  };
  const merged = { ...defaults, ...over };
  return Object.entries(merged).map(([key, value]) => ({
    key, label: key, value,
  }));
};

describe("generateSceneProse", () => {
  it("produces non-empty prose from a full Tidelock fact set", () => {
    const prose = generateSceneProse(tidelockFacts());
    expect(prose.length).toBeGreaterThan(40);
  });

  it("mentions the terminator band, the setting the tool exists to describe", () => {
    const prose = generateSceneProse(tidelockFacts());
    expect(prose.toLowerCase()).toContain("terminator");
  });

  it("reflects a wide habitable band differently than a narrow one", () => {
    const wide = generateSceneProse(tidelockFacts({ "locked.habitableBand": "40% of the surface (habitable)" }));
    const narrow = generateSceneProse(tidelockFacts({ "locked.habitableBand": "1.2% of the surface (uninhabitable)" }));
    expect(wide).not.toBe(narrow);
  });

  it("returns an honest empty-input message rather than a hallucinated scene", () => {
    expect(generateSceneProse([])).toBe("");
  });

  it("does not fabricate a fact it was not given", () => {
    // Facts missing gravity should not produce a sentence claiming a gravity value.
    const withoutGravity = tidelockFacts();
    const filtered = withoutGravity.filter(f => f.key !== "locked.gravity");
    const prose = generateSceneProse(filtered);
    expect(prose).not.toMatch(/\d+(\.\d+)?\s*g\b/);
  });
});
