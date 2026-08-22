import { describe, it, expect } from "vitest";
import { evaluateTidelockFlags } from "../tidelock";
import { evaluateExoForgeFlags } from "../exoforge";
import { evaluateExoSkyFlags } from "../exosky";
import { evaluateGravitasFlags } from "../gravitas";
import { evaluateSolarisStabilityFlags, evaluateSolarisFlareFlags } from "../solaris";
import { evaluateRogueEjectionFlags, evaluateRogueEncounterFlags } from "../rogue";

describe("Tidelock", () => {
  const calm = { tSSP: 300, tASP: 250, tTerm: 275, habPct: 40, escVel: 11.2 };

  it("stays quiet on an unremarkable configuration", () => {
    expect(evaluateTidelockFlags(calm)).toEqual([]);
  });

  it("flags a narrow habitable band", () => {
    const flags = evaluateTidelockFlags({ ...calm, habPct: 4.1 });
    expect(flags.map((f) => f.id)).toContain("tidelock.narrow-habitable-band");
    expect(flags[0].title).toContain("4.1");
  });

  it("does not flag a habitable band of exactly 0 (no atmosphere data)", () => {
    expect(evaluateTidelockFlags({ ...calm, habPct: 0 })).toEqual([]);
  });

  it("flags no heat transport on a huge day/night gradient", () => {
    const flags = evaluateTidelockFlags({ ...calm, tSSP: 480, tASP: 90 });
    const flag = flags.find((f) => f.id === "tidelock.no-heat-transport");
    expect(flag).toBeDefined();
    expect(flag!.title).toContain("480");
    expect(flag!.title).toContain("90");
  });

  it("does not flag heat transport on a modest gradient", () => {
    expect(evaluateTidelockFlags({ ...calm, tSSP: 320, tASP: 200 })).toEqual([]);
  });

  it("flags a weak escape velocity", () => {
    const flags = evaluateTidelockFlags({ ...calm, escVel: 3.2 });
    expect(flags.map((f) => f.id)).toContain("tidelock.weak-escape-velocity");
  });

  it("flags an inverted thermal gradient", () => {
    const flags = evaluateTidelockFlags({ ...calm, tSSP: 300, tTerm: 310 });
    expect(flags.map((f) => f.id)).toContain("tidelock.inverted-thermal-gradient");
  });

  it("cites the values that triggered each flag", () => {
    const flags = evaluateTidelockFlags({ ...calm, habPct: 2 });
    expect(flags[0].cites).toEqual({ habPct: 2 });
  });
});

describe("ExoForge", () => {
  it("stays quiet on an Earth-like world", () => {
    expect(evaluateExoForgeFlags({ density: 5.51, temp: 288 })).toEqual([]);
  });

  it("flags an iron-dominated core", () => {
    const flags = evaluateExoForgeFlags({ density: 8.9, temp: 288 });
    expect(flags.map((f) => f.id)).toContain("exoforge.iron-core-no-tectonics");
  });

  it("does not flag density right at Earth's own value", () => {
    expect(evaluateExoForgeFlags({ density: 5.51, temp: 288 })).toEqual([]);
  });

  it("flags a world below the photosynthesis floor", () => {
    const flags = evaluateExoForgeFlags({ density: 5.51, temp: 150 });
    const flag = flags.find((f) => f.id === "exoforge.below-photosynthesis-floor");
    expect(flag).toBeDefined();
    expect(flag!.title).toContain("150");
  });

  it("does not flag a world right at the habitable floor", () => {
    expect(evaluateExoForgeFlags({ density: 5.51, temp: 180 })).toEqual([]);
  });
});

describe("ExoSky", () => {
  it("stays quiet on a normal sky", () => {
    expect(evaluateExoSkyFlags({ visibleCount: 2500 })).toEqual([]);
  });

  it("flags an empty sky", () => {
    const flags = evaluateExoSkyFlags({ visibleCount: 3 });
    expect(flags.map((f) => f.id)).toContain("exosky.empty-sky");
  });

  it("does not flag right at the threshold", () => {
    expect(evaluateExoSkyFlags({ visibleCount: 20 })).toEqual([]);
  });
});

describe("Gravitas", () => {
  it("stays quiet when the spin config is comfortable", () => {
    expect(
      evaluateGravitasFlags({ coriolis_intensity: "negligible", is_comfortable: true, gradient_percent: 1 }),
    ).toEqual([]);
  });

  it("flags an uncomfortable Coriolis gradient", () => {
    const flags = evaluateGravitasFlags({
      coriolis_intensity: "severe",
      is_comfortable: false,
      gradient_percent: 40,
    });
    expect(flags.map((f) => f.id)).toContain("gravitas.coriolis-discomfort");
    expect(flags[0].title).toContain("SEVERE");
  });
});

describe("Solaris (predicate-only, not yet wired — see solaris.ts)", () => {
  it("flags an unstable orbit inside the habitable zone", () => {
    const flags = evaluateSolarisStabilityFlags({
      stabCls: "unstable",
      inHabitableZone: true,
      planetName: "Kepler-442b",
    });
    expect(flags.map((f) => f.id)).toContain("solaris.unstable-orbit-in-hz");
  });

  it("does not flag an unstable orbit outside the habitable zone", () => {
    expect(
      evaluateSolarisStabilityFlags({ stabCls: "unstable", inHabitableZone: false, planetName: "X" }),
    ).toEqual([]);
  });

  it("does not flag a stable orbit even inside the habitable zone", () => {
    expect(
      evaluateSolarisStabilityFlags({ stabCls: "stable", inHabitableZone: true, planetName: "X" }),
    ).toEqual([]);
  });

  it("flags atmosphere stripping on an unmagnetised planet around a flare-active star", () => {
    const flags = evaluateSolarisFlareFlags({ flareActive: true, hasMagnetosphere: false, planetName: "X" });
    expect(flags.map((f) => f.id)).toContain("solaris.atmosphere-stripped-by-flares");
  });

  it("does not flag a magnetised planet even around a flare-active star", () => {
    expect(
      evaluateSolarisFlareFlags({ flareActive: true, hasMagnetosphere: true, planetName: "X" }),
    ).toEqual([]);
  });
});

describe("Rogue (predicate-only, not yet wired — see rogue.ts)", () => {
  it("flags an ejected body that retains tidal heating", () => {
    const flags = evaluateRogueEjectionFlags({ bodyName: "X-7", starless: true, tidalHeatingYears: 40e6 });
    expect(flags.map((f) => f.id)).toContain("rogue.ejected-body-still-warm");
    expect(flags[0].title).toContain("STARLESS");
  });

  it("does not flag a body that still orbits a star", () => {
    expect(
      evaluateRogueEjectionFlags({ bodyName: "X-7", starless: false, tidalHeatingYears: 40e6 }),
    ).toEqual([]);
  });

  it("flags accidental habitability from an encounter", () => {
    const flags = evaluateRogueEncounterFlags({
      bodyName: "X-7",
      wasOutsideHZ: true,
      isInsideHZ: true,
      epochLabel: "2140 CE",
    });
    expect(flags.map((f) => f.id)).toContain("rogue.accidental-habitability");
  });

  it("does not flag a body that was already inside the habitable zone", () => {
    expect(
      evaluateRogueEncounterFlags({ bodyName: "X-7", wasOutsideHZ: false, isInsideHZ: true, epochLabel: "" }),
    ).toEqual([]);
  });
});
