import { describe, it, expect } from "vitest";
import { evaluateTidelockFlags } from "../tidelock";
import { evaluateExoForgeFlags } from "../exoforge";
import { evaluateExoSkyFlags } from "../exosky";
import { evaluateGravitasFlags } from "../gravitas";
import { evaluateSolarisStabilityFlags, evaluateSolarisFlareFlags, evaluateSolarisSystemFlags } from "../solaris";
import { evaluateRogueEjectionFlags, evaluateRogueEncounterFlags, evaluateRogueRunFlags } from "../rogue";

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
