import { describe, it, expect } from "vitest";
import {
  extractTidelockFacts,
  extractExoforgeFacts,
} from "@/lib/simulators/iframe-sim-facts";
import {
  extractSimulationFacts,
  hasSimulationFactSupport,
  FACT_CAPABLE_SIMULATORS,
} from "@/lib/simulation-facts";
import { SIMULATOR_TOOL_IDS } from "@/lib/tools-config";

// ---------------------------------------------------------------------------
// Fixtures mirror the exact `state` object each sim posts in its
// STELLARFORGE_SAVE message. Tidelock: public/tools/tidelock/sim.html ~1690.
// ExoForge: public/tools/exoforge/sim.html ~1815. If either shape drifts, these
// fail rather than the panel silently going blank.
// ---------------------------------------------------------------------------

const tidelockSave = () => ({
  parameters: {
    starIdx: 2,
    planetMass: 1.1,
    planetRadius: 1.05,
    orbDist: 0.04,
    composition: "Silicate",
    ocean: 0.4,
    moonCount: 2,
    showClouds: true,
  },
  results: {
    starType: "M3V",
    tSSP: 391,
    tASP: 168,
    tTerm: 279,
    habStatus: "Marginal",
    habPct: 12.4,
    surfGrav: 1.03,
    escVel: 11.4,
    atmRetention: "Retained",
    liquidWater: "Stable",
    tidalLock: "1:1 locked",
    orbPeriod: 0.031,
  },
});

const exoforgeSave = () => ({
  parameters: {
    radius: 1.4,
    mass: 2.6,
    temp: 288,
    period: 1.2,
    ocean: 0.62,
    cloud: 0.45,
    composition: "Iron-rich silicate",
    ringOpacity: 0.3,
    starTemp: 5400,
    rotation: 26.5,
    name: "Ashgrave",
  },
  results: {
    classification: "Super-Earth",
    gravity: 1.327,
    density: 7.31,
    escapeVelocity: 15.2,
  },
});

describe("Tidelock", () => {
  it("surfaces the three temperatures the tool exists to compute", () => {
    const byKey = Object.fromEntries(
      extractTidelockFacts(tidelockSave()).map((f) => [f.key, f.value]),
    );
    // A tidally locked world is defined by the contrast across its terminator.
    expect(byKey["locked.daySide"]).toContain("391 K");
    expect(byKey["locked.nightSide"]).toContain("168 K");
    expect(byKey["locked.terminator"]).toContain("279 K");
    expect(byKey["locked.spread"]).toBe("223 K");
  });

  it("gives each temperature in Celsius too, and says how survivable it is", () => {
    const byKey = Object.fromEntries(
      extractTidelockFacts(tidelockSave()).map((f) => [f.key, f.value]),
    );
    // 391 K is 118 C: past boiling, so scorching rather than merely hot.
    expect(byKey["locked.daySide"]).toContain("118°C");
    expect(byKey["locked.daySide"]).toContain("scorching");
    expect(byKey["locked.nightSide"]).toContain("frozen");
    // 279 K is 6 C, which is where a story can actually take place.
    expect(byKey["locked.terminator"]).toContain("hot but survivable");
  });

  it("reports the habitable band as a share of the surface", () => {
    const byKey = Object.fromEntries(
      extractTidelockFacts(tidelockSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey["locked.habitableBand"]).toContain("12.4%");
    expect(byKey["locked.habitableBand"]).toContain("marginal");
  });

  it("states that the year is also the day, which prose usually gets wrong", () => {
    const byKey = Object.fromEntries(
      extractTidelockFacts(tidelockSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey["locked.period"]).toContain("days");
    const label = extractTidelockFacts(tidelockSave()).find(
      (f) => f.key === "locked.period",
    )?.label;
    expect(label).toMatch(/year/i);
    expect(label).toMatch(/day/i);
  });

  it("carries the physical readings a writer would quote", () => {
    const byKey = Object.fromEntries(
      extractTidelockFacts(tidelockSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey["locked.gravity"]).toBe("1.03 g");
    expect(byKey["locked.escape"]).toBe("11.4 km/s");
    expect(byKey["locked.water"]).toBe("Stable");
    expect(byKey["locked.star"]).toBe("M3V");
    expect(byKey["locked.moons"]).toBe("2");
  });

  it("omits fields the save did not carry rather than printing blanks", () => {
    const facts = extractTidelockFacts({
      parameters: {},
      results: { tSSP: 400, starType: "", liquidWater: "" },
    });
    expect(facts.some((f) => f.key === "locked.daySide")).toBe(true);
    expect(facts.some((f) => f.key === "locked.star")).toBe(false);
    expect(facts.some((f) => f.key === "locked.water")).toBe(false);
    expect(facts.every((f) => f.value.length > 0)).toBe(true);
  });

  it("is empty for an unreadable blob", () => {
    expect(extractTidelockFacts(null)).toEqual([]);
    expect(extractTidelockFacts({ parameters: {}, results: {} })).toEqual([]);
  });
});

describe("ExoForge", () => {
  it("surfaces the world by name and class", () => {
    const facts = extractExoforgeFacts(exoforgeSave());
    const byKey = Object.fromEntries(facts.map((f) => [f.key, f.value]));
    expect(byKey["forged.name"]).toBe("Ashgrave");
    expect(byKey["forged.class"]).toBe("Super-Earth");
    // The name is the quotable part, so it inserts as itself.
    expect(facts.find((f) => f.key === "forged.name")?.insert).toBe("Ashgrave");
  });

  it("reports gravity with what it would feel like", () => {
    const byKey = Object.fromEntries(
      extractExoforgeFacts(exoforgeSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey["forged.gravity"]).toContain("1.33 g");
    // 1.33 g is under the 1.4 threshold, so no editorialising.
    expect(byKey["forged.gravity"]).not.toContain("heavy going");
  });

  it("calls out a heavy world and a light one", () => {
    const heavy = extractExoforgeFacts({
      parameters: {},
      results: { gravity: 2.1 },
    }).find((f) => f.key === "forged.gravity");
    const light = extractExoforgeFacts({
      parameters: {},
      results: { gravity: 0.4 },
    }).find((f) => f.key === "forged.gravity");
    expect(heavy?.value).toContain("heavy going");
    expect(light?.value).toContain("light on your feet");
  });

  it("carries the rest of the physical picture", () => {
    const byKey = Object.fromEntries(
      extractExoforgeFacts(exoforgeSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey["forged.radius"]).toBe("1.40 R⊕");
    expect(byKey["forged.mass"]).toBe("2.60 M⊕");
    expect(byKey["forged.density"]).toBe("7.31 g/cm³");
    expect(byKey["forged.escape"]).toBe("15.2 km/s");
    expect(byKey["forged.temperature"]).toContain("288 K");
    expect(byKey["forged.ocean"]).toBe("62%");
    expect(byKey["forged.rings"]).toBe("Present");
    expect(byKey["forged.rotation"]).toBe("26.5 hours");
  });

  it("leaves rings out when there are none", () => {
    const facts = extractExoforgeFacts({
      parameters: { ringOpacity: 0 },
      results: { gravity: 1 },
    });
    expect(facts.some((f) => f.key === "forged.rings")).toBe(false);
  });

  it("is empty for an unreadable blob", () => {
    expect(extractExoforgeFacts(undefined)).toEqual([]);
    expect(extractExoforgeFacts({ parameters: {}, results: {} })).toEqual([]);
  });
});

describe("every simulator now reaches the writing surface", () => {
  it("supports all five, with none left dark", () => {
    for (const sim of SIMULATOR_TOOL_IDS) {
      expect(hasSimulationFactSupport(sim), sim).toBe(true);
    }
    expect([...FACT_CAPABLE_SIMULATORS].sort()).toEqual([...SIMULATOR_TOOL_IDS].sort());
  });

  it("dispatches each to its own extractor", () => {
    expect(extractSimulationFacts("tidelock", tidelockSave()).length).toBeGreaterThan(0);
    expect(extractSimulationFacts("exoforge", exoforgeSave()).length).toBeGreaterThan(0);
  });

  it("still returns nothing for a simulator that does not exist", () => {
    expect(extractSimulationFacts("nonesuch", tidelockSave())).toEqual([]);
    expect(hasSimulationFactSupport("nonesuch")).toBe(false);
  });

  it("gives every fact a unique key, so React lists stay correct", () => {
    for (const [sim, save] of [
      ["tidelock", tidelockSave()],
      ["exoforge", exoforgeSave()],
    ] as const) {
      const facts = extractSimulationFacts(sim, save);
      expect(new Set(facts.map((f) => f.key)).size, sim).toBe(facts.length);
    }
  });
});
