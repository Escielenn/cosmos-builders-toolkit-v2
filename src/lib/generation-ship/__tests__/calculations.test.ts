import { describe, it, expect } from "vitest";
import {
  INITIAL_GENSHIP_STATE,
  buildDerivedSnapshot,
  computeDrift,
  computeGenShip,
  computeGenetics,
  computeHabitat,
  computeLifeSupport,
  computeVoyage,
  daysToFailure,
  effectivePopulation,
  generationsToReach,
  inbreedingAt,
  isolationForDistance,
  neRequiredFor,
  normalizeGenShipState,
  shipToEarthYears,
  spinComfort,
  spinGravity,
  type GenShipFormState,
} from "../calculations";
import { F_DANGER, F_FIRST_COUSIN } from "../data";

function form(patch: (f: GenShipFormState) => void = () => {}): GenShipFormState {
  const f = normalizeGenShipState(JSON.parse(JSON.stringify(INITIAL_GENSHIP_STATE)));
  patch(f);
  return f;
}

describe("voyage", () => {
  it("coasting at 1% of c to Alpha Centauri takes about 424 years both ways of counting", () => {
    const v = computeVoyage({ distanceLy: 4.24, cruiseFractionC: 0.01, accelG: 0 });
    expect(v.valid).toBe(true);
    expect(v.earthYears).toBeCloseTo(424, 0);
    // γ at 0.01c is 1.00005: about eight days over four centuries.
    expect(v.earthYears - v.shipYears).toBeGreaterThan(0.015);
    expect(v.earthYears - v.shipYears).toBeLessThan(0.03);
    expect(v.boostYearsEach).toBe(0);
  });

  it("adds boost and braking time when an acceleration is set", () => {
    const coast = computeVoyage({ distanceLy: 4.24, cruiseFractionC: 0.01, accelG: 0 });
    const boost = computeVoyage({ distanceLy: 4.24, cruiseFractionC: 0.01, accelG: 0.001 });
    expect(boost.valid).toBe(true);
    expect(boost.boostYearsEach).toBeGreaterThan(0);
    // Reaching 0.01c at 0.001 g takes v/a ≈ 3e6 / 0.0098 s ≈ 9.7 years.
    expect(boost.boostYearsEach).toBeCloseTo(9.7, 0);
    expect(boost.reachesCruise).toBe(true);
    // Half the boost time is "lost" each end versus instant cruise.
    expect(boost.earthYears - coast.earthYears).toBeCloseTo(boost.boostYearsEach, 0);
  });

  it("shows real dilation at high speed", () => {
    const v = computeVoyage({ distanceLy: 10, cruiseFractionC: 0.866, accelG: 0 });
    expect(v.lorentzFactor).toBeCloseTo(2, 2);
    expect(v.shipYears).toBeCloseTo(v.earthYears / 2, 1);
  });

  it("refuses an empty or superluminal voyage in Ship's Voice", () => {
    expect(computeVoyage({ distanceLy: 0, cruiseFractionC: 0.01, accelG: 0 }).error).toBe("SET A VOYAGE DISTANCE.");
    expect(computeVoyage({ distanceLy: 4, cruiseFractionC: 0, accelG: 0 }).error).toBe("SET A CRUISE SPEED.");
    expect(computeVoyage({ distanceLy: 4, cruiseFractionC: 1.2, accelG: 0 }).valid).toBe(false);
  });

  it("maps ship time onto the home calendar", () => {
    const v = computeVoyage({ distanceLy: 10, cruiseFractionC: 0.866, accelG: 0 });
    expect(shipToEarthYears(v.shipYears, v)).toBeCloseTo(v.earthYears, 6);
    expect(shipToEarthYears(1, v)).toBeCloseTo(2, 2);
  });
});

describe("effective population", () => {
  it("equals the breeding census for an even sex ratio and Poisson family sizes", () => {
    const e = effectivePopulation(form().population);
    expect(e.breeders).toBe(500);
    expect(e.neSexRatio).toBe(500);
    expect(e.varianceFactor).toBe(1);
    expect(e.ne).toBe(500);
    expect(e.neOverN).toBe(0.5);
  });

  it("doubles when every couple has exactly two children (Vk = 0)", () => {
    const e = effectivePopulation(form((f) => { f.population.familySizeVariance = 0; }).population);
    expect(e.ne).toBe(1000);
  });

  it("collapses with a skewed breeding sex ratio (Wright 1931)", () => {
    const e = effectivePopulation(
      form((f) => {
        f.population.founding = 100;
        f.population.breedingPct = 100;
        f.population.femalePct = 80;
      }).population,
    );
    // 4 × 20 × 80 / 100
    expect(e.neSexRatio).toBeCloseTo(64, 6);
  });

  it("shrinks with unequal family sizes", () => {
    const e = effectivePopulation(form((f) => { f.population.familySizeVariance = 6; }).population);
    expect(e.ne).toBeCloseTo(250, 6);
  });
});

describe("inbreeding", () => {
  it("follows F_t = 1 − (1 − 1/2Ne)^t", () => {
    expect(inbreedingAt(50, 1)).toBeCloseTo(0.01, 10);
    expect(inbreedingAt(500, 10)).toBeCloseTo(1 - Math.pow(0.999, 10), 10);
    expect(inbreedingAt(500, 0)).toBe(0);
  });

  it("inverts cleanly", () => {
    const t = generationsToReach(100, F_FIRST_COUSIN);
    expect(inbreedingAt(100, t)).toBeCloseTo(F_FIRST_COUSIN, 10);
    const ne = neRequiredFor(F_FIRST_COUSIN, 15);
    expect(inbreedingAt(ne, 15)).toBeCloseTo(F_FIRST_COUSIN, 10);
  });

  it("finds when a small crew crosses first-cousin and danger levels", () => {
    const f = form((x) => {
      x.population.founding = 100;
      x.voyage.distanceLy = 10;
    });
    const v = computeVoyage(f.voyage);
    const g = computeGenetics(f, v.shipYears);
    expect(g.eff.ne).toBe(50);
    expect(g.generations).toBeGreaterThan(30);
    expect(g.fAtArrival).toBeGreaterThan(F_DANGER);
    expect(g.firstCousinGeneration).toBeCloseTo(generationsToReach(50, F_FIRST_COUSIN), 6);
    expect(g.dangerGeneration!).toBeGreaterThan(g.firstCousinGeneration!);
    expect(g.heterozygosityRetained).toBeCloseTo(1 - g.fAtArrival, 10);
  });

  it("a frozen bank slows inbreeding, until it runs out", () => {
    const base = form((x) => {
      x.population.founding = 100;
      x.voyage.distanceLy = 10;
    });
    const shipYears = computeVoyage(base.voyage).shipYears;
    const without = computeGenetics(base, shipYears);

    const big = form((x) => {
      x.population.founding = 100;
      x.voyage.distanceLy = 10;
      x.population.bank = { enabled: true, contributionPct: 10, samples: 1_000_000 };
    });
    const withBank = computeGenetics(big, shipYears);
    expect(withBank.fAtArrival).toBeLessThan(without.fAtArrival);
    expect(withBank.bank.exhaustedBeforeArrival).toBe(false);
    // Island-model equilibrium bound: F ≤ 1 / (1 + 4·Ne·m) roughly.
    expect(withBank.fAtArrival).toBeLessThan(1 / (1 + 4 * 50 * 0.1) + 0.02);

    const small = form((x) => {
      x.population.founding = 100;
      x.voyage.distanceLy = 10;
      x.population.bank = { enabled: true, contributionPct: 10, samples: 10 };
    });
    const tiny = computeGenetics(small, shipYears);
    // 100 × 28/80 = 35 births a generation; 10% from the bank = 3.5; 10 samples ≈ 2.9 generations.
    expect(tiny.bank.birthsPerGeneration).toBeCloseTo(35, 6);
    expect(tiny.bank.lastsGenerations).toBeCloseTo(10 / 3.5, 6);
    expect(tiny.bank.exhaustedBeforeArrival).toBe(true);
    expect(tiny.fAtArrival).toBeGreaterThan(withBank.fAtArrival);
    expect(tiny.fAtArrival).toBeLessThan(without.fAtArrival);
  });
});

describe("closed loop", () => {
  it("reserves last reserveDays / (1 − efficiency)", () => {
    expect(daysToFailure(365, 0.99)).toBeCloseTo(36500, 6);
    expect(daysToFailure(365, 1)).toBe(Infinity);
  });

  it("flags the loop that runs dry before arrival and the efficiency that would save it", () => {
    const f = form((x) => {
      x.lifeSupport.airEfficiencyPct = 99; // 100 years of reserve at 365 days
      x.lifeSupport.waterEfficiencyPct = 99.99;
      x.lifeSupport.foodEfficiencyPct = 99.99;
    });
    const ls = computeLifeSupport(f, 424);
    const air = ls.loops.find((l) => l.id === "air")!;
    expect(air.daysToFailure / 365.25).toBeCloseTo(99.93, 1);
    expect(air.failsBeforeArrival).toBe(true);
    expect(ls.firstFailureLoop).toBe("air");
    expect(air.requiredEfficiency).toBeCloseTo(1 - 365 / (424 * 365.25), 6);
    // 1000 people × 0.84 kg × 1%.
    expect(air.makeupKgDay).toBeCloseTo(8.4, 6);
  });

  it("weights closed-loop efficiency by mass", () => {
    const f = form((x) => {
      x.lifeSupport.airEfficiencyPct = 100;
      x.lifeSupport.waterEfficiencyPct = 100;
      x.lifeSupport.foodEfficiencyPct = 0;
    });
    const ls = computeLifeSupport(f, 10);
    expect(ls.closedLoopEfficiency).toBeCloseTo((0.84 + 3.5) / (0.84 + 3.5 + 1.8), 10);
  });
});

describe("habitat", () => {
  it("gives 1 g at 224 m and 2 rpm", () => {
    expect(spinGravity(224, 2)).toBeCloseTo(1.0, 2);
    const h = computeHabitat(form());
    expect(h.radiusFor1gAtComfort).toBeCloseTo(223.6, 1);
    expect(h.comfort).toBe("comfortable");
  });

  it("classifies spin rates against Hall's comfort limits", () => {
    expect(spinComfort(0)).toBe("none");
    expect(spinComfort(2)).toBe("comfortable");
    expect(spinComfort(3.5)).toBe("adaptable");
    expect(spinComfort(6)).toBe("severe");
  });

  it("puts inner decks at lower gravity and sums their floor area", () => {
    const h = computeHabitat(form());
    expect(h.decks).toHaveLength(3);
    expect(h.decks[1].g).toBeLessThan(h.decks[0].g);
    expect(h.decks[0].areaM2).toBeCloseTo(2 * Math.PI * 224 * 120, 6);
    expect(h.availableAreaM2).toBeCloseTo(h.decks.reduce((s, d) => s + d.areaM2, 0), 6);
  });

  it("requires crop area in proportion to the food grown aboard", () => {
    const h = computeHabitat(form());
    expect(h.cropAreaM2).toBeCloseTo(1000 * 45 * 0.98, 6);
    expect(h.requiredAreaM2).toBeCloseTo((h.cropAreaM2 + 1000 * 40) * 1.25, 6);
  });

  it("Coriolis grows as the radius shrinks at the same g", () => {
    const big = computeHabitat(form());
    const small = computeHabitat(form((x) => { x.habitat.radiusM = 56; x.habitat.rpm = 4; }));
    expect(small.rimG).toBeCloseTo(big.rimG, 1);
    expect(small.coriolisRatio).toBeGreaterThan(big.coriolisRatio * 1.9);
  });
});

describe("social drift", () => {
  it("uses LexDrift's isolation bands", () => {
    expect(isolationForDistance(4)).toBe("low");
    expect(isolationForDistance(12)).toBe("moderate");
    expect(isolationForDistance(50)).toBe("high");
    expect(isolationForDistance(500)).toBe("extreme");
  });

  it("shared core vocabulary decays at the Swadesh rate on both lines", () => {
    const d = computeDrift(form(), 1000, 4.24);
    expect(d.retainedCoreVocabulary).toBeCloseTo(0.86, 6);
    expect(d.sharedCoreVocabulary).toBeCloseTo(0.86 * 0.86, 6);
  });

  it("dates the end of first-hand memory of home", () => {
    const d = computeDrift(form(), 400, 4.24);
    expect(d.lastHomeBornYears).toBe(50);
    expect(d.secondHandMemoryEndsYears).toBe(120);
    expect(d.oralHorizonYears).toBe(84);
  });
});

describe("computeGenShip", () => {
  it("raises the inbreeding and reserve warnings the spec calls for", () => {
    const r = computeGenShip(
      form((x) => {
        x.population.founding = 80;
        x.voyage.distanceLy = 12;
        x.lifeSupport.airEfficiencyPct = 95;
      }),
    );
    const ids = r.warnings.map((w) => w.id);
    expect(ids).toContain("f-danger");
    expect(ids).toContain("loop-fails");
    expect(ids).toContain("ne-50");
    for (const w of r.warnings) {
      expect(w.message).toBe(w.message.toUpperCase());
      expect(w.message).not.toContain("!");
    }
  });

  it("is quiet for a well-provisioned ship", () => {
    const r = computeGenShip(
      form((x) => {
        x.population.founding = 10000;
        x.lifeSupport.cropAreaPerPerson = 30;
        x.lifeSupport.livingAreaPerPerson = 20;
        x.habitat.lengthM = 2000;
        x.habitat.decks = 4;
        x.lifeSupport.airEfficiencyPct = 100;
        x.lifeSupport.waterEfficiencyPct = 100;
        x.lifeSupport.foodEfficiencyPct = 100;
      }),
    );
    expect(r.warnings).toEqual([]);
  });

  it("snapshots rounded values for the rest of the product", () => {
    const snap = buildDerivedSnapshot(computeGenShip(form()))!;
    // Default: 4.24 ly at 1% c with a 0.01 g boost, about a year longer than coasting.
    expect(snap.earthYears).toBeCloseTo(computeVoyage(form().voyage).earthYears, 1);
    expect(snap.earthYears).toBeGreaterThan(424);
    expect(snap.earthYears).toBeLessThan(426);
    expect(snap.effectivePopulation).toBe(500);
    expect(snap.rimGravityG).toBe(1);
    expect(Number.isInteger(snap.closedLoopEfficiencyPct * 100)).toBe(true);
  });
});

describe("normalizeGenShipState", () => {
  it("fills a blank row with defaults", () => {
    expect(normalizeGenShipState(null)).toEqual({ ...INITIAL_GENSHIP_STATE, derived: undefined });
  });

  it("coerces prepopulated strings and clamps out-of-range values", () => {
    const f = normalizeGenShipState({
      population: { founding: "1,200", femalePct: 140 },
      voyage: { cruiseFractionC: 3 },
      habitat: { shape: "sphere", decks: 0 },
      provenance: { "voyage.distanceLy": { tool: "time-dilation", worksheetId: "w1", worksheetTitle: "Run" }, junk: 4 },
    });
    expect(f.population.founding).toBe(1200);
    expect(f.population.femalePct).toBe(99);
    expect(f.voyage.cruiseFractionC).toBeLessThan(1);
    expect(f.habitat.shape).toBe("ring");
    expect(f.habitat.decks).toBe(1);
    expect(Object.keys(f.provenance)).toEqual(["voyage.distanceLy"]);
  });
});
