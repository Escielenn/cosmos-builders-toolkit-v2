import { describe, it, expect } from "vitest";
import { simCanon, defaultEntityTypeFor, tidelockCanon, exoforgeCanon, solarisCanon } from "@/lib/simulators/sim-canon";
import { isKnownPredicate, resolvePredicate, predicateDef } from "@/canon/vocabulary";
import { TIDELOCK_DEFAULT, EXOFORGE_DEFAULT, SOLARIS_DEFAULT, ROGUE_DEFAULT } from "@/lib/__tests__/fixtures/sim-payloads";
import type { SimCanonFact } from "@/lib/simulators/sim-canon";

const num = (facts: SimCanonFact[], predicate: string, child?: string): number | undefined => {
  const f = facts.find((x) => x.predicate === predicate && x.child === child);
  return f && f.value.kind === "scalar" ? f.value.value : undefined;
};

// A minimal sf2System in the native Solaris shape (src/components/solaris/types.ts):
// the Sun with Earth and Mars at their real distances.
const SOL_SF2 = {
  parameters: {
    sf2System: {
      name: "Sol",
      stars: [{ name: "Sun", classification: "G", massSOL: 1, luminositySOL: 1, temperatureK: 5772 }],
      planets: [
        { name: "Earth", semiMajorAxisAU: 1, orbitalPeriodYears: 1, massEarth: 1, radiusEarth: 1, eccentricity: 0.0167 },
        { name: "Mars", semiMajorAxisAU: 1.524, orbitalPeriodYears: 1.881, massEarth: 0.107, radiusEarth: 0.532 },
      ],
    },
  },
};

describe("sim-canon: every published fact is a real, current vocabulary predicate (X7)", () => {
  const all = [tidelockCanon(TIDELOCK_DEFAULT), exoforgeCanon(EXOFORGE_DEFAULT), solarisCanon(SOL_SF2)];
  it.each(all.flatMap((c) => c.facts.map((f) => [f.predicate] as const)))("%s", (p) => {
    expect(isKnownPredicate(p)).toBe(true);
    expect(resolvePredicate(p).via).toBe("exact");
    expect(predicateDef(p)?.provisional).toBeUndefined();
  });
  it("never publishes a single-owner derived value (Atlas, Goldilocks own those)", () => {
    for (const c of all)
      for (const f of c.facts)
        expect(["planet.surface_gravity", "planet.density", "planet.escape_velocity", "system.hz_inner", "system.hz_outer"]).not.toContain(f.predicate);
  });
  it("carries the vocabulary's unit on every scalar", () => {
    for (const c of all)
      for (const f of c.facts) if (f.value.kind === "scalar" && predicateDef(f.predicate)?.unit) expect(f.unit).toBe(predicateDef(f.predicate)?.unit);
  });
});

describe("Tidelock golden default", () => {
  const c = tidelockCanon(TIDELOCK_DEFAULT);
  it("publishes the period in days (X1)", () => {
    expect(num(c.facts, "orbit.period")).toBeCloseTo(21.07, 2);
  });
  it("publishes the ocean as a fraction, not a percent", () => {
    expect(num(c.facts, "planet.hydrosphere_fraction")).toBeCloseTo(0.6, 6);
  });
  it("records the temperature profile and the habitable area", () => {
    const g = c.facts.find((f) => f.predicate === "planet.temp_gradient[]");
    expect(g?.value.kind).toBe("struct");
    expect((g?.value as unknown as { value: { substellar_k: number } }).value.substellar_k).toBeCloseTo(296.57, 1);
    // 42.52% of an Earth-sized surface (5.10e8 km²).
    expect(num(c.facts, "planet.habitable_area")! / 1e6).toBeCloseTo(216.9, 0);
  });
  it("takes the sim's own insolation, Teq and band width (lane T results.units)", () => {
    expect(num(c.facts, "planet.insolation")).toBeCloseTo(0.8332, 3);
    expect(num(c.facts, "planet.temp_equilibrium")).toBeCloseTo(243.2, 1);
    expect(num(c.facts, "planet.terminator_band_width")).toBeCloseTo(9051, 0);
    expect(num(c.facts, "star.temp_effective")).toBe(3210);
  });
  it("defaults the entity to a planet (X8)", () => {
    expect(c.entityType).toBe("planet");
  });
});

describe("ExoForge golden default", () => {
  const c = exoforgeCanon(EXOFORGE_DEFAULT);
  it("Earth: 365.25 days, 70% ocean, 288 K, no rotation (X1, X2)", () => {
    expect(num(c.facts, "orbit.period")).toBeCloseTo(365.25, 2);
    expect(num(c.facts, "planet.hydrosphere_fraction")).toBeCloseTo(0.7, 6);
    expect(num(c.facts, "planet.temp_mean")).toBeCloseTo(287.65, 1);
    expect(num(c.facts, "planet.insolation")).toBeCloseTo(1, 1);
    expect(c.facts.some((f) => f.predicate === "planet.rotation_period")).toBe(false);
    expect(c.ephemeral.map((e) => e.key)).toContain("rotation");
  });
});

describe("Solaris sf2System (lane S contract; read defensively)", () => {
  it("reads the live sim's sf2System: every planet a child, periods in days matching years × 365.25", () => {
    const c = solarisCanon(SOLARIS_DEFAULT);
    expect(c.entityType).toBe("star_system");
    const sys = (SOLARIS_DEFAULT.parameters as unknown as { sf2System: { planets: { orbitalPeriodYears: number; orbitalPeriodDays: number }[] } }).sf2System;
    expect(c.children).toHaveLength(sys.planets.length);
    c.children.forEach((child, i) => {
      expect(num(c.facts, "orbit.period", child.key)).toBeCloseTo(sys.planets[i].orbitalPeriodDays, -1);
      expect(sys.planets[i].orbitalPeriodDays).toBeCloseTo(sys.planets[i].orbitalPeriodYears * 365.25, 0);
    });
  });
  it("returns no facts for a save with generator settings only", () => {
    expect(solarisCanon({ parameters: { starMode: "single" } }).facts).toEqual([]);
  });
  const c = solarisCanon(SOL_SF2);
  it("makes each planet a child entity with orbit facts in days", () => {
    expect(c.children.map((x) => x.name)).toEqual(["Earth", "Mars"]);
    expect(num(c.facts, "orbit.period", "earth")).toBeCloseTo(365.25, 2);
    expect(num(c.facts, "orbit.period", "mars")).toBeCloseTo(687.0, 0);
  });
  it("computes insolation and equilibrium temperature: Earth 1 S⊕ / 255 K, Mars 0.43 S⊕ / 206 K", () => {
    expect(num(c.facts, "planet.insolation", "earth")).toBeCloseTo(1, 3);
    expect(num(c.facts, "planet.temp_equilibrium", "earth")).toBeCloseTo(255, 0);
    expect(num(c.facts, "planet.insolation", "mars")).toBeCloseTo(0.4305, 3);
    expect(num(c.facts, "planet.temp_equilibrium", "mars")).toBeCloseTo(206, 0);
  });
  it("puts the star's facts on the system", () => {
    expect(num(c.facts, "star.temp_effective")).toBe(5772);
    expect(c.facts.find((f) => f.predicate === "star.spectral_class" && !f.child)?.value).toEqual({ kind: "enum", value: "g" });
  });
});

describe("Rogue outcomes for the Chronicle (lane S R4)", () => {
  const run = (energyError: number) => ({
    results: {
      epoch: { unit: "yr", reference: "launch", encounterYears: 3.25, elapsedYears: 9 },
      energyError,
      publishMaxEnergyError: 0.001,
      bodies: [
        { name: "Earth", a0: 1, a: 1.0002, e: 0.02, outcome: "retained" },
        { name: "Mars", a0: 1.524, a: null, e: null, outcome: "ejected", ejected: true },
        { name: "Venus", a0: 0.723, a: 0.6, e: 0.31, outcome: "orbit_changed", boundTo: "Sun" },
      ],
    },
  });
  it("dates each changed body at the encounter, years after launch", () => {
    const c = simCanon("rogue", run(1e-6));
    expect(c.refusal).toBeUndefined();
    expect(c.events!.map((e) => e.body)).toEqual(["Mars", "Venus"]);
    expect(c.events![0].offsetYears).toBe(3.25);
    expect(c.events![1].description).toMatch(/0.72 AU before; 0.60 AU, e 0.31 after, bound to Sun/);
  });
  it("refuses a run above the sim's energy-error limit", () => {
    expect(simCanon("rogue", run(0.02)).refusal).toMatch(/INTEGRATION ERROR 2\.0e-2/);
  });
});

describe("Rogue and ExoSky", () => {
  it("assert nothing numeric; Rogue is an encounter, ExoSky facts are lane E's", () => {
    expect(simCanon("rogue", ROGUE_DEFAULT).facts).toEqual([]);
    expect(simCanon("exosky", {}).facts).toEqual([]);
  });
  it("default entity types are never 'custom' for a known sim (X8)", () => {
    for (const s of ["tidelock", "exoforge", "solaris", "rogue", "exosky"]) expect(defaultEntityTypeFor(s)).not.toBe("custom");
  });
});
