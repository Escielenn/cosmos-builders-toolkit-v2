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

  // The test above uses the brief's given default of "1.03 g", which sits
  // inside the neutral 0.7-1.3 range that never emits a gravity sentence
  // either way, so it does not actually exercise present-vs-absent contrast.
  // This uses "1.5 g" instead, which crosses the g > 1.3 branch in
  // generateTidelockProse, so removing the fact provably removes the sentence.
  it("states a gravity fact when given and omits it when the fact is absent", () => {
    const withGravity = generateSceneProse(tidelockFacts({ "locked.gravity": "1.5 g" }));
    expect(withGravity).toMatch(/1\.50\s*g\b/);

    const facts = tidelockFacts({ "locked.gravity": "1.5 g" });
    const withoutGravity = generateSceneProse(facts.filter(f => f.key !== "locked.gravity"));
    expect(withoutGravity).not.toMatch(/\d+(\.\d+)?\s*g\b/);
  });

  // extractTidelockFacts's real values (public/tools/tidelock/sim.html:1089)
  // are "Confirmed", "Likely", or "Unlikely", never the word "locked" itself.
  // The brief's own test fixture uses the synthetic value "Locked", which
  // never appears from a live simulator run, so it alone cannot catch a
  // regression that reverts or narrows the match down to that literal word.
  // These three pin the real-world behavior directly.
  it("states the star never moves when tidal lock is Confirmed", () => {
    const prose = generateSceneProse(tidelockFacts({ "locked.tidalState": "Confirmed" }));
    expect(prose.toLowerCase()).toContain("the star does not move");
  });

  it("does not assert the star never moves when tidal lock is only Likely", () => {
    // "Likely" has not earned the certainty that sentence asserts.
    const prose = generateSceneProse(tidelockFacts({ "locked.tidalState": "Likely" }));
    expect(prose.toLowerCase()).not.toContain("the star does not move");
  });

  it("does not assert the star never moves when tidal lock is Unlikely", () => {
    const prose = generateSceneProse(tidelockFacts({ "locked.tidalState": "Unlikely" }));
    expect(prose.toLowerCase()).not.toContain("the star does not move");
  });
});
