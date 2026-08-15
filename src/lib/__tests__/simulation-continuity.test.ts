import { describe, it, expect } from "vitest";
import {
  extractSimulationFacts,
  toContinuityFacts,
  simulationSourceLabel,
} from "@/lib/simulation-facts";
import { checkContinuity } from "@/lib/continuity";

// ---------------------------------------------------------------------------
// The point of this file: a saved simulation should be able to contradict the
// manuscript the same way a filled-in worksheet already can. Until now the
// Check tab read worksheets only, so a world could be modelled in detail and
// the prose could still say the opposite of it without a word.
// ---------------------------------------------------------------------------

const exoforgeSave = (over: Record<string, unknown> = {}) => ({
  parameters: { radius: 1.4, mass: 2.6, temp: 288, rotation: 26.5, name: "Ashgrave", ...over },
  results: { classification: "Super-Earth", gravity: 2.4, density: 7.31, escapeVelocity: 15.2 },
});

const tidelockSave = () => ({
  parameters: { composition: "Silicate" },
  results: {
    starType: "M3V",
    tSSP: 391,
    tASP: 168,
    tTerm: 279,
    habPct: 12.4,
    surfGrav: 1.03,
    orbPeriod: 0.031,
  },
});

const factsFor = (sim: string, save: unknown) =>
  toContinuityFacts(extractSimulationFacts(sim, save));

describe("re-keying simulator facts for the continuity engine", () => {
  it("turns a formatted display value into the bare number the engine parses", () => {
    // The display fact reads "2.40 g, heavy going"; the engine needs 2.4.
    const g = factsFor("exoforge", exoforgeSave()).find((f) => f.key === "surfaceGravity");
    expect(g?.value).toBe("2.4");
    expect(g?.label).toBe("Surface Gravity (g)");
  });

  it("maps temperature and day length as well", () => {
    const byKey = Object.fromEntries(factsFor("exoforge", exoforgeSave()).map((f) => [f.key, f.value]));
    expect(byKey.surfaceTemperature).toBe("288");
    expect(byKey.dayLength).toBe("26.5");
  });

  it("takes Tidelock's terminator, not its day side", () => {
    // The day side is 391 K and the night side 168 K, but the habitable band is
    // 279 K and that is the temperature a writer is describing.
    const byKey = Object.fromEntries(factsFor("tidelock", tidelockSave()).map((f) => [f.key, f.value]));
    expect(byKey.surfaceTemperature).toBe("279");
    expect(byKey.surfaceGravity).toBe("1.03");
  });

  it("maps nothing it is not certain about", () => {
    // Escape velocity, density, classification and the rest have no continuity
    // check that means the same thing, so they stay out rather than being
    // forced onto an approximate match.
    const keys = factsFor("exoforge", exoforgeSave()).map((f) => f.key);
    expect(keys).not.toContain("cruiseVelocity");
    expect(keys).not.toContain("population");
    expect(keys.every((k) => !k.includes("."))).toBe(true);
  });

  it("emits one fact per continuity key, never two that disagree", () => {
    const facts = factsFor("tidelock", tidelockSave());
    expect(new Set(facts.map((f) => f.key)).size).toBe(facts.length);
  });

  it("is empty for a simulator with nothing comparable", () => {
    // ExoSky records a viewpoint, not a planet's physical readings.
    expect(factsFor("exosky", { parameters: { exosky: { vantage: { planetName: "X" } } } })).toEqual([]);
  });
});

describe("a saved simulation can now contradict the prose", () => {
  it("flags prose that contradicts a simulated world's gravity", () => {
    // A numeral, because that is what the engine is built to catch. Worded
    // fractions like "a tenth of a gravity" are not parsed as quantities, which
    // is a limitation of the engine rather than of this wiring.
    const notes = checkContinuity(
      "<p>She crossed the yard at a stroll, barely 0.4 gravities to fight.</p>",
      factsFor("exoforge", exoforgeSave()),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0].factKey).toBe("surfaceGravity");
    expect(notes[0].worldValue).toBe("2.4");
    expect(notes[0].proseValue).toBe("0.4");
  });

  it("flags a tidally locked world written as far hotter than its terminator", () => {
    const notes = checkContinuity(
      "<p>The terminator held at 480 kelvin, hot enough to blister paint.</p>",
      factsFor("tidelock", tidelockSave()),
    );
    expect(notes.some((n) => n.factKey === "surfaceTemperature")).toBe(true);
  });

  it("stays quiet when the prose agrees with the simulation", () => {
    const notes = checkContinuity(
      "<p>At 2.4 gravities every step was a decision.</p>",
      factsFor("exoforge", exoforgeSave()),
    );
    expect(notes).toEqual([]);
  });

  it("stays quiet when the prose makes no measurable claim", () => {
    const notes = checkContinuity(
      "<p>The gravity here was punishing, and she felt every hour of it.</p>",
      factsFor("exoforge", exoforgeSave()),
    );
    expect(notes).toEqual([]);
  });

  it("names the save the number came from, so the writer knows what to change", () => {
    const facts = toContinuityFacts(
      extractSimulationFacts("tidelock", tidelockSave()),
      simulationSourceLabel("tidelock", "Ashgrave"),
    );
    const notes = checkContinuity(
      "<p>The terminator held at 480 kelvin, hot enough to blister paint.</p>",
      facts,
    );
    expect(notes[0].message).toContain('Your "Ashgrave" save records');
    // Both numbers still present, and still phrased as an observation.
    expect(notes[0].message).toContain("279");
    expect(notes[0].message).toContain("480");
  });

  it("falls back to the simulator's name, then to the world", () => {
    expect(simulationSourceLabel("tidelock", null)).toBe("Your Tidelock save");
    expect(simulationSourceLabel("tidelock", "   ")).toBe("Your Tidelock save");
    expect(simulationSourceLabel("unknown-sim", null)).toBe("Your world");
  });

  it("still says 'Your world' for a value the writer typed themselves", () => {
    // Worksheet facts carry no source, and that is correct: the writer does not
    // need telling where their own typing came from.
    const notes = checkContinuity("<p>Gravity ran to 2.4 g on the plateau.</p>", [
      { key: "surfaceGravity", label: "Surface Gravity (g)", value: "1.0" },
    ]);
    expect(notes[0].message).toContain("Your world records");
  });

  it("lets a worksheet value win over a simulated one", () => {
    // Both sources are passed to the engine with worksheets first, and
    // checkContinuity takes the first fact matching a key. A number the writer
    // typed should outrank one a simulator derived.
    const worksheetFact = {
      key: "surfaceGravity",
      label: "Surface Gravity (g)",
      value: "1.0",
    };
    const combined = [worksheetFact, ...factsFor("exoforge", exoforgeSave())];
    const notes = checkContinuity("<p>Gravity ran to 2.4 g on the plateau.</p>", combined);
    expect(notes).toHaveLength(1);
    // Compared against the writer's 1.0, not the simulator's 2.4.
    expect(notes[0].worldValue).toBe("1.0");
  });
});
