import { describe, it, expect } from "vitest";
import { evaluateTidelockFlags, tidelockOutputFromResults } from "../tidelock";
import { evaluateExoForgeFlags, exoforgeOutputFromPayload } from "../exoforge";
import { evaluateExoSkyFlags } from "../exosky";
import { evaluateGravitasFlags } from "../gravitas";
import { evaluateSolarisStabilityFlags, evaluateSolarisFlareFlags, evaluateSolarisSystemFlags } from "../solaris";
import { evaluateRogueEjectionFlags, evaluateRogueEncounterFlags, evaluateRogueRunFlags } from "../rogue";

describe("Tidelock", () => {
  const calm = {
    tSSP: 300, tASP: 250, tTerm: 275, habPct: 40, escVel: 11.2,
    bandWidthDeg: 60, bandWidthKm: 6700, collapse: false, condensationK: 77, condensingGas: "N₂",
    epsilon: 0.9, atmRetention: "Retained", tidalLock: "Locked", lockTimescaleYr: 8e5, systemAgeGyr: 5, starLifetimeGyr: 300,
  };

  it("stays quiet on an unremarkable configuration", () => {
    expect(evaluateTidelockFlags(calm)).toEqual([]);
  });

  it("flags a narrow band in degrees and km, never a percent with a degree sign", () => {
    const flags = evaluateTidelockFlags({ ...calm, bandWidthDeg: 4.1, bandWidthKm: 456 });
    const f = flags.find((x) => x.id === "tidelock.narrow-habitable-band")!;
    expect(f.title).toBe("LIQUID-WATER BAND: 4.1° (456 KM)");
    expect(f.cites).toEqual({ bandWidthDeg: 4.1, bandWidthKm: 456 });
    expect(f.title).not.toContain("%");
  });

  it("does not flag a band of exactly 0 (no band, or a pre-1.9 save)", () => {
    expect(evaluateTidelockFlags({ ...calm, bandWidthDeg: 0 })).toEqual([]);
    const { bandWidthDeg: _d, bandWidthKm: _k, ...old } = calm;
    expect(evaluateTidelockFlags(old)).toEqual([]);
  });

  it("flags no heat transport from ε, with the temperatures cited", () => {
    const flags = evaluateTidelockFlags({ ...calm, tSSP: 480, tASP: 90, epsilon: 0.02 });
    const flag = flags.find((f) => f.id === "tidelock.no-heat-transport");
    expect(flag!.title).toBe("DAYSIDE 480K, NIGHTSIDE 90K");
    expect(flag!.cites).toEqual({ tSSP: 480, tASP: 90, epsilon: 0.02 });
  });

  it("does not flag heat transport on a modest gradient", () => {
    expect(evaluateTidelockFlags({ ...calm, tSSP: 320, tASP: 200, epsilon: 0.5 })).toEqual([]);
  });

  it("flags atmosphere collapse", () => {
    const flags = evaluateTidelockFlags({ ...calm, tASP: 52, collapse: true, condensationK: 63, pressureAtm: 0.1 });
    const f = flags.find((x) => x.id === "tidelock.atmosphere-collapse")!;
    expect(f.title).toBe("NIGHTSIDE 52K. N₂ FREEZES BELOW 63K.");
  });

  it("flags a lost atmosphere from the sim's retention test", () => {
    const flags = evaluateTidelockFlags({ ...calm, atmRetention: "Lost", retentionGas: "H₂", escVel: 6.1, exobaseK: 1000 });
    expect(flags.map((f) => f.id)).toContain("tidelock.atmosphere-escapes");
  });

  it("flags a world that is not locked within the system's age", () => {
    const flags = evaluateTidelockFlags({ ...calm, tidalLock: "Not locked", lockTimescaleYr: 3e11, systemAgeGyr: 5 });
    const f = flags.find((x) => x.id === "tidelock.not-locked")!;
    expect(f.title).toBe("LOCKING TAKES 300 GYR. THE SYSTEM IS 5.0 GYR OLD.");
  });

  it("flags a star past its main-sequence life", () => {
    const flags = evaluateTidelockFlags({ ...calm, systemAgeGyr: 5, starLifetimeGyr: 2.2 });
    expect(flags.map((f) => f.id)).toContain("tidelock.star-past-main-sequence");
  });

  it("reads its input from a payload results block", () => {
    const o = tidelockOutputFromResults({ tSSP: 300, collapse: true, tidalLock: "Locked", bogus: "x" });
    expect(o.tSSP).toBe(300);
    expect(o.collapse).toBe(true);
    expect(o.bandWidthDeg).toBeUndefined();
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

  it("flags an impossible mass-radius pair with the density cited", () => {
    const flags = evaluateExoForgeFlags({ density: 275.7, temp: 288, massRadiusVerdict: "implausible", expectedRadius: 8.09, mass: 50, radius: 1 });
    expect(flags.map((f) => f.id)).toEqual(["exoforge.impossible-density"]);
    expect(flags[0].title).toBe("DENSITY 276 G/CM³. NO KNOWN MATERIAL.");
  });

  it("reads the derived surface temperature, falling back to a pre-1.9 slider value", () => {
    expect(exoforgeOutputFromPayload({ parameters: { temp: 150 }, results: { density: 5.5, surfaceTemp: 288 } }).temp).toBe(288);
    expect(exoforgeOutputFromPayload({ parameters: { temp: 150 }, results: { density: 5.5 } }).temp).toBe(150);
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

  it("stays quiet where the catalogue thins (far from the Sun), rather than lie", () => {
    expect(evaluateExoSkyFlags({ visibleCount: 3, catalogueComplete: false })).toEqual([]);
  });

  it("flags sky drift once the pole has moved past the threshold, citing the planet's own precession", () => {
    const flags = evaluateExoSkyFlags({
      visibleCount: 3000,
      constellations: [{ name: "The Founding Compass", epochYears: 0 }],
      epochYears: 2000,
      driftDeg: { "The Founding Compass": 14.2 },
      precessionYears: 25772,
    });
    const drift = flags.find((f) => f.id === "exosky.sky-drift");
    expect(drift?.title).toContain("14.2°");
    expect(drift?.cites).toMatchObject({ drawnAtEpoch: 0, viewedAtEpoch: 2000, precessionYears: 25772 });
  });

  it("does not flag drift under 2°", () => {
    expect(evaluateExoSkyFlags({ visibleCount: 3000, constellations: [{ name: "A", epochYears: 0 }], epochYears: 10, driftDeg: { A: 0.1 } })).toEqual([]);
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

describe("Solaris (stability rule live via results.planets[]; flare rule predicate-only — see solaris.ts)", () => {
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

describe("Rogue (accidental habitability live via results.bodies[]; tidal-heating rule predicate-only — see rogue.ts)", () => {
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

describe("Solaris — system-level wiring over sim.html's results.planets[]", () => {
  const planets = [
    { name: "Kepler-16b", au: 0.7, band: "habitable", stabCls: "stable" as const, inHabitableZone: true },
    { name: "Outer", au: 4.2, band: "outer", stabCls: "unstable" as const, inHabitableZone: false },
  ];

  it("stays quiet when nothing unstable sits in the habitable zone", () => {
    expect(evaluateSolarisSystemFlags(planets)).toEqual([]);
  });

  it("flags only the unstable planet inside the habitable zone, citing its name", () => {
    const flags = evaluateSolarisSystemFlags([
      ...planets,
      { name: "Twilight", au: 1.1, band: "habitable", stabCls: "unstable", inHabitableZone: true },
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].id).toBe("solaris.unstable-orbit-in-hz");
    expect(flags[0].title).toContain("TWILIGHT");
    expect(flags[0].cites).toMatchObject({ planet: "Twilight", stability: "unstable" });
  });

  it("treats marginal as not-yet-unstable and tolerates garbage", () => {
    expect(evaluateSolarisSystemFlags([{ name: "M", au: 1, band: "habitable", stabCls: "marginal", inHabitableZone: true }])).toEqual([]);
    expect(evaluateSolarisSystemFlags(null)).toEqual([]);
    expect(evaluateSolarisSystemFlags(undefined)).toEqual([]);
    // @ts-expect-error — the iframe boundary is untyped; junk must not throw
    expect(evaluateSolarisSystemFlags([null, 3, "x"])).toEqual([]);
  });
  it("flags an ejected planet with the year it left (1.9: never respawned)", () => {
    const flags = evaluateSolarisSystemFlags([
      { name: "Lost", au: 9, band: "outer", stabCls: "unstable", inHabitableZone: false, ejected: true, ejectedAtYears: 12.345 },
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].id).toBe("solaris.planet-ejected");
    expect(flags[0].title).toBe("LOST: EJECTED AT YEAR 12.3");
    expect(flags[0].cites).toMatchObject({ planet: "Lost", ejected_at_yr: 12.35 });
  });
});

describe("Rogue — run-level wiring over sim.html's results.bodies[] + habZone", () => {
  const hz: [number, number] = [0.95, 1.37];
  const earth = { name: "Earth", ptype: "rocky", a0: 1.0, a: 1.02, e: 0.02, ejected: false };
  const mars = { name: "Mars", ptype: "rocky", a0: 1.524, a: 1.51, e: 0.09, ejected: false };

  it("reports nothing when no orbit changed zone", () => {
    expect(evaluateRogueRunFlags({ habZone: hz, bodies: [earth, mars], simTime: 120 })).toEqual([]);
  });

  it("flags a body the encounter dropped INTO the habitable zone, citing before/after elements", () => {
    const flags = evaluateRogueRunFlags({ habZone: hz, bodies: [earth, { ...mars, a: 1.2, e: 0.12 }], simTime: 342.6 });
    expect(flags).toHaveLength(1);
    expect(flags[0].id).toBe("rogue.accidental-habitability");
    expect(flags[0].title).toContain("MARS");
    expect(flags[0].body).toContain("T+343 yr");
    expect(flags[0].cites).toMatchObject({ body: "Mars", a0_AU: 1.524, a_AU: 1.2, e: 0.12, hz_AU: "0.95–1.37" });
  });

  it("does not call a highly eccentric HZ-crossing orbit habitable, nor an ejected body", () => {
    expect(evaluateRogueRunFlags({ habZone: hz, bodies: [{ ...mars, a: 1.2, e: 0.55 }], simTime: 10 })).toEqual([]);
    expect(evaluateRogueRunFlags({ habZone: hz, bodies: [{ ...mars, a: 1.2, e: 0.1, ejected: true }], simTime: 10 })).toEqual([]);
  });

  it("stays quiet with no habZone, unbound elements, or before launch (empty bodies)", () => {
    expect(evaluateRogueRunFlags({ habZone: null, bodies: [{ ...mars, a: 1.2, e: 0.1 }], simTime: 10 })).toEqual([]);
    expect(evaluateRogueRunFlags({ habZone: hz, bodies: [{ ...mars, a: null, e: null }], simTime: 10 })).toEqual([]);
    expect(evaluateRogueRunFlags({ habZone: hz, bodies: [], simTime: 0 })).toEqual([]);
  });
});
