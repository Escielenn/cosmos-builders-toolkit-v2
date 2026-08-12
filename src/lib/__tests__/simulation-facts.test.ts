import { describe, it, expect } from "vitest";
import {
  toExoskySave,
  toExoskyPayload,
  fromExoskySave,
  extractExoskyFacts,
  formatSkyPosition,
} from "@/lib/simulators/exosky-save";
import {
  extractSimulationFacts,
  extractSolarisFacts,
  hasSimulationFactSupport,
} from "@/lib/simulation-facts";

// ---------------------------------------------------------------------------
// Fixtures mirror the shapes the simulators actually hold in state, including
// the component's newRa/newDec naming, which is the field pair that would have
// silently produced positionless constellations if guessed wrong.
// ---------------------------------------------------------------------------

const drawnStar = (name: string, newRa: number, newDec: number, appMag = 2.1) => ({
  name,
  newRa,
  newDec,
  appMag,
});

const exoskyState = () => ({
  starName: "Tau Ceti",
  planetName: "Tau Ceti e",
  distPc: 3.65,
  armNote: "Local Bubble",
  atmoDesc: "N₂/CO₂ mix, possible H₂O vapor",
  viewRa: 120.5,
  viewDec: -14.2,
  fov: 65,
  showConstellations: false,
  showStarNames: true,
  customConstellations: [
    {
      id: 1,
      name: "The Drowned Man",
      color: "#FFA500",
      visible: true,
      planetName: "Tau Ceti e",
      stars: [
        drawnStar("Sol", 92.1, 4.5, 3.4),
        drawnStar("Procyon", 95.0, 8.5, 1.2),
        drawnStar("Sirius", 99.4, 12.5, 0.9),
      ],
    },
  ],
});

describe("toExoskySave", () => {
  it("keeps the vantage, the view and the writer's named constellations", () => {
    const save = toExoskySave(exoskyState());
    expect(save.vantage.starName).toBe("Tau Ceti");
    expect(save.vantage.planetName).toBe("Tau Ceti e");
    expect(save.view.fov).toBe(65);
    expect(save.display.starNames).toBe(true);
    expect(save.display.constellations).toBe(false);
    expect(save.constellations).toHaveLength(1);
    expect(save.constellations[0].name).toBe("The Drowned Man");
    expect(save.constellations[0].stars.map((s) => s.name)).toEqual([
      "Sol",
      "Procyon",
      "Sirius",
    ]);
  });

  it("reads the component's newRa/newDec into ra/dec", () => {
    const save = toExoskySave(exoskyState());
    expect(save.constellations[0].stars[0]).toMatchObject({ ra: 92.1, dec: 4.5 });
  });

  it("derives a centroid when the component did not supply one", () => {
    const save = toExoskySave(exoskyState());
    // Mean of 92.1, 95.0, 99.4.
    expect(save.constellations[0].centRa).toBeCloseTo(95.5, 1);
    expect(save.constellations[0].centDec).toBeCloseTo(8.5, 1);
  });

  it("drops a one-star 'constellation' and an unnamed one", () => {
    const save = toExoskySave({
      ...exoskyState(),
      customConstellations: [
        { name: "One Star", stars: [drawnStar("Sol", 1, 1)] },
        { name: "   ", stars: [drawnStar("A", 1, 1), drawnStar("B", 2, 2)] },
      ],
    });
    expect(save.constellations).toEqual([]);
  });

  it("survives junk without throwing", () => {
    const save = toExoskySave({
      planetName: 42,
      distPc: "not a number",
      viewRa: null,
      customConstellations: "nope",
    } as never);
    expect(save.vantage.planetName).toBe("Unnamed vantage");
    expect(save.vantage.distPc).toBe(0);
    expect(save.view.ra).toBe(180);
    expect(save.constellations).toEqual([]);
  });
});

describe("the persistence envelope", () => {
  // useSimulationSave inserts only data.parameters and data.results. A payload
  // that puts state anywhere else is silently dropped on save, which is exactly
  // how ExoSky's save came to be a no-op.
  it("nests the whole save under parameters so the row keeps it", () => {
    const payload = toExoskyPayload(exoskyState());
    expect(payload.parameters.exosky).toBeDefined();
    expect(payload.results.constellationNames).toEqual(["The Drowned Man"]);
    expect(payload.name).toBe("Tau Ceti e");
  });

  it("round-trips through the envelope the database stores", () => {
    const payload = toExoskyPayload(exoskyState());
    // Exactly what the insert writes back out.
    const stored = { parameters: payload.parameters, results: payload.results };
    const restored = fromExoskySave(stored);
    expect(restored?.vantage.planetName).toBe("Tau Ceti e");
    expect(restored?.constellations[0].name).toBe("The Drowned Man");
    expect(restored?.constellations[0].stars).toHaveLength(3);
    expect(restored?.view.fov).toBe(65);
  });

  it("round-trips a bare save too", () => {
    const save = toExoskySave(exoskyState());
    expect(fromExoskySave(save)?.vantage.starName).toBe("Tau Ceti");
  });

  it("keeps custom galactic coordinates, which cannot be recovered from ra/dec", () => {
    const restored = fromExoskySave(
      toExoskyPayload({ ...exoskyState(), galacticL: 210.5, galacticB: -8.25 }).parameters
        .exosky,
    );
    expect(restored?.vantage.galacticL).toBe(210.5);
    expect(restored?.vantage.galacticB).toBe(-8.25);
  });

  it("is null for a blob that is not an ExoSky save", () => {
    expect(fromExoskySave(null)).toBeNull();
    expect(fromExoskySave({ unrelated: true })).toBeNull();
    expect(fromExoskySave("string")).toBeNull();
  });
});

describe("formatSkyPosition", () => {
  it("renders degrees as hours and minutes with a signed declination", () => {
    expect(formatSkyPosition(0, 0)).toBe("0h 00m +0° 00'");
    expect(formatSkyPosition(180, -14.5)).toBe("12h 00m -14° 30'");
  });
  it("carries the hour rather than printing 60 minutes", () => {
    expect(formatSkyPosition(14.999, 0)).not.toContain("60m");
  });
});

describe("extractExoskyFacts", () => {
  it("surfaces the vantage, host star and distance in light years first", () => {
    const facts = extractExoskyFacts(toExoskyPayload(exoskyState()));
    const byKey = Object.fromEntries(facts.map((f) => [f.key, f]));

    expect(byKey["sky.vantage"].value).toBe("Tau Ceti e");
    expect(byKey["sky.hostStar"].value).toBe("Tau Ceti");
    // 3.65 pc = 11.90 ly. Prose says light years.
    expect(byKey["sky.distance"].value).toContain("11.90 ly");
    expect(byKey["sky.distance"].value).toContain("3.65 pc");
    expect(byKey["sky.region"].value).toBe("Local Bubble");
  });

  it("makes each named constellation its own quotable fact", () => {
    const facts = extractExoskyFacts(toExoskyPayload(exoskyState()));
    const cons = facts.find((f) => f.key.startsWith("sky.constellation."));
    expect(cons?.label).toBe('Constellation "The Drowned Man"');
    expect(cons?.value).toContain("3 stars");
    // Brightest = lowest apparent magnitude, so Sirius at 0.9, not Sol at 3.4.
    expect(cons?.value).toContain("brightest Sirius");
  });

  it("inserts the constellation's name, not its star count", () => {
    const facts = extractExoskyFacts(toExoskyPayload(exoskyState()));
    const cons = facts.find((f) => f.key.startsWith("sky.constellation."));
    expect(cons?.insert).toBe("The Drowned Man");
  });

  it("is empty for an unreadable blob", () => {
    expect(extractExoskyFacts({})).toEqual([]);
    expect(extractExoskyFacts(undefined)).toEqual([]);
  });

  it("emits unique keys so React lists and dedupe stay correct", () => {
    const facts = extractExoskyFacts(toExoskyPayload(exoskyState()));
    expect(new Set(facts.map((f) => f.key)).size).toBe(facts.length);
  });
});

// ---------------------------------------------------------------------------
// Solaris
// ---------------------------------------------------------------------------

const solarisPayload = () => ({
  outputType: "star_system",
  name: "Kestrel's Reach",
  parameters: {
    sf2System: {
      id: "sys-1",
      name: "Kestrel's Reach",
      architecture: "binary",
      star: {
        name: "Kestrel A",
        classification: "G",
        habitableZoneInnerAU: 0.95,
        habitableZoneOuterAU: 1.37,
      },
      stars: [
        {
          name: "Kestrel A",
          classification: "G",
          habitableZoneInnerAU: 0.95,
          habitableZoneOuterAU: 1.37,
        },
        { name: "Kestrel B", classification: "M" },
      ],
      planets: [
        {
          name: "Ashfall",
          type: "lava-world",
          semiMajorAxisAU: 0.21,
          orbitalPeriodYears: 0.09,
          inHabitableZone: false,
          moons: [],
        },
        {
          name: "Tenehm",
          type: "super-earth",
          semiMajorAxisAU: 1.12,
          orbitalPeriodYears: 1.18,
          inHabitableZone: true,
          moons: [{ name: "Little Sister" }, { name: "Bell" }],
        },
      ],
      asteroidBelts: [],
      generatedAt: "2026-08-12T00:00:00Z",
    },
  },
  results: {},
});

describe("extractSolarisFacts", () => {
  it("names the system, its stars and its habitable zone", () => {
    const byKey = Object.fromEntries(
      extractSolarisFacts(solarisPayload()).map((f) => [f.key, f]),
    );
    expect(byKey["system.name"].value).toBe("Kestrel's Reach");
    expect(byKey["system.stars"].value).toBe("Kestrel A (G), Kestrel B (M)");
    expect(byKey["system.stars"].label).toContain("binary");
    expect(byKey["system.habitableZone"].value).toBe("0.95–1.37 AU");
    expect(byKey["system.planetCount"].value).toBe("2");
  });

  it("gives each planet its orbit, and short years in days", () => {
    const byKey = Object.fromEntries(
      extractSolarisFacts(solarisPayload()).map((f) => [f.key, f]),
    );
    expect(byKey["system.planet.tenehm"].label).toBe("Tenehm");
    expect(byKey["system.planet.tenehm"].value).toContain("1.12 AU");
    expect(byKey["system.planet.tenehm"].value).toContain("in the habitable zone");
    // 0.09 years reads as nothing; 33 days reads as a year.
    expect(byKey["system.planet.ashfall"].value).toContain("33 day year");
  });

  it("inserts a planet's name rather than its orbital detail", () => {
    const byKey = Object.fromEntries(
      extractSolarisFacts(solarisPayload()).map((f) => [f.key, f]),
    );
    expect(byKey["system.planet.tenehm"].insert).toBe("Tenehm");
  });

  it("lists named moons with their planet", () => {
    const byKey = Object.fromEntries(
      extractSolarisFacts(solarisPayload()).map((f) => [f.key, f]),
    );
    expect(byKey["system.moons.tenehm"].value).toBe("Little Sister, Bell");
  });

  it("returns just the system name for a settings-only legacy save", () => {
    // The original static simulator saved generator settings and no body names.
    // Inventing names here would be worse than returning fewer facts.
    const facts = extractSolarisFacts({
      name: "Old System",
      parameters: { starMode: "single", starChoices: { a: "yellow" } },
      results: {},
    });
    expect(facts).toEqual([
      { key: "system.name", label: "Star system", value: "Old System" },
    ]);
  });
});

describe("extractSimulationFacts", () => {
  it("dispatches on simulator type", () => {
    expect(extractSimulationFacts("exosky", toExoskyPayload(exoskyState())).length).toBeGreaterThan(0);
    expect(extractSimulationFacts("solaris", solarisPayload()).length).toBeGreaterThan(0);
  });

  it("is empty for a simulator with no extractor yet", () => {
    // Rogue, Tidelock and ExoForge are still static iframes writing their own
    // shapes. Empty means "not readable yet", not "the save is empty".
    expect(extractSimulationFacts("rogue", { parameters: {}, results: {} })).toEqual([]);
    expect(hasSimulationFactSupport("rogue")).toBe(false);
    expect(hasSimulationFactSupport("exosky")).toBe(true);
  });
});
