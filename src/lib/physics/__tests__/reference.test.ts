/**
 * Reference values. Earth/Mars: NASA Planetary Fact Sheets. Proxima b:
 * Anglada-Escudé et al. 2016 (Nature 536:437). TRAPPIST-1: Agol et al. 2021
 * (PSJ 2:1). Alpha Cen A/B: Kervella et al. 2016; Pourbaix & Boffin 2016.
 */
import { describe, expect, it } from "vitest";
import {
  MAIN_SEQUENCE,
  MOLECULAR_MASS,
  bulkDensity,
  condensationTemperature,
  equilibriumTemperature,
  escapeVelocityKms,
  greenhouseMultiplier,
  internalHeatTemperature,
  holmanWiegertPType,
  holmanWiegertSType,
  insolation,
  kopparapuEdges,
  liquidWaterBand,
  lockedHemispheres,
  lockedSurfaceTemperature,
  luminosityFromRadiusTeff,
  mainSequenceStar,
  massFromRadius,
  massRadiusCheck,
  orbitalPeriodDays,
  radiusFromMass,
  redistributionEfficiency,
  retention,
  semiMajorAxisAU,
  starFromSpectralType,
  substellarTemperature,
  surfaceGravity,
  tidalLockTimescaleYears,
  waterBoilingPoint,
} from "@/lib/physics";

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("main-sequence table", () => {
  it("is mass-ascending and Stefan–Boltzmann consistent", () => {
    for (let i = 1; i < MAIN_SEQUENCE.length; i++) {
      expect(MAIN_SEQUENCE[i].mass).toBeGreaterThan(MAIN_SEQUENCE[i - 1].mass);
      expect(MAIN_SEQUENCE[i].teff).toBeGreaterThan(MAIN_SEQUENCE[i - 1].teff);
    }
    const s = mainSequenceStar(0.8);
    expect(rel(s.luminosity, luminosityFromRadiusTeff(s.radius, s.teff))).toBeLessThan(1e-12);
  });
  it("returns the Sun at 1 M☉", () => {
    const sun = mainSequenceStar(1);
    expect(sun.teff).toBeCloseTo(5772, 6);
    expect(sun.luminosity).toBeCloseTo(1, 6);
    expect(sun.spt).toBe("G2V");
  });
  it("TRAPPIST-1 row gives its measured luminosity (5.53e-4 L☉)", () => {
    const t1 = starFromSpectralType("m8v")!;
    expect(rel(t1.luminosity, 5.53e-4)).toBeLessThan(0.02);
  });
  it("Alpha Cen A (1.08 M☉) and B (0.91 M☉) land near measured L (1.52, 0.50)", () => {
    expect(mainSequenceStar(1.08).luminosity).toBeGreaterThan(1.2);
    expect(mainSequenceStar(1.08).luminosity).toBeLessThan(1.8);
    expect(mainSequenceStar(0.91).luminosity).toBeGreaterThan(0.4);
    expect(mainSequenceStar(0.91).luminosity).toBeLessThan(0.75);
  });
  it("clamps outside the table and says so", () => {
    expect(mainSequenceStar(0.01).clamped).toBe(true);
    expect(mainSequenceStar(100).clamped).toBe(true);
  });
});

describe("Kepler, insolation, temperatures", () => {
  it("Earth", () => {
    expect(orbitalPeriodDays(1, 1)).toBeCloseTo(365.25, 2);
    expect(insolation(1, 1)).toBe(1);
    expect(equilibriumTemperature(1, 0.306)).toBeCloseTo(254.0, 0); // NASA fact sheet black-body T
    expect(surfaceGravity(1, 1)).toBe(1);
    expect(escapeVelocityKms(1, 1)).toBeCloseTo(11.186, 3);
  });
  it("Mars: 687 d, 0.43 S⊕, ~210 K, 0.38 g", () => {
    expect(orbitalPeriodDays(1.5237, 1)).toBeCloseTo(687, 0);
    expect(insolation(1, 1.5237)).toBeCloseTo(0.431, 2);
    expect(Math.abs(equilibriumTemperature(0.431, 0.25) - 210)).toBeLessThan(3);
    expect(surfaceGravity(0.107, 0.532)).toBeCloseTo(0.378, 2);
  });
  it("Proxima b: 11.19 d around 0.122 M☉ at 0.0485 AU, ~0.65 S⊕", () => {
    expect(Math.abs(orbitalPeriodDays(0.0485, 0.122, 1.07) - 11.186)).toBeLessThan(0.1);
    expect(Math.abs(insolation(0.00155, 0.0485) - 0.65)).toBeLessThan(0.03);
    expect(semiMajorAxisAU(11.186, 0.122)).toBeCloseTo(0.0485, 3);
  });
  it("TRAPPIST-1e: 6.10 d, 0.66 S⊕, Teq ~250 K (A 0)", () => {
    expect(Math.abs(orbitalPeriodDays(0.02925, 0.0898, 0.692) - 6.0999)).toBeLessThan(0.02);
    const s = insolation(5.53e-4, 0.02925);
    expect(Math.abs(s - 0.646)).toBeLessThan(0.02);
    expect(Math.abs(equilibriumTemperature(s, 0) - 251)).toBeLessThan(3);
  });
  it("true substellar is √2 hotter than the f=¼ planet average (Cowan & Agol 2011)", () => {
    expect(substellarTemperature(1, 0) / equilibriumTemperature(1, 0)).toBeCloseTo(Math.SQRT2, 6);
    expect(substellarTemperature(1, 0)).toBeCloseTo(393.6, 0);
  });
});

describe("tidally locked profile", () => {
  it("airless limit: substellar T₀(1−A)^¼, night 0 K", () => {
    const h = lockedHemispheres(1, 0.1, 0);
    expect(h.substellar).toBeCloseTo(substellarTemperature(1, 0.1), 6);
    expect(h.night).toBe(0);
  });
  it("is energy-conserving (global mean σT⁴ = S(1−A)/4)", () => {
    const eps = 0.37;
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const th = ((i + 0.5) / n) * 180; // weight by area: sin θ dθ / 2
      sum += lockedSurfaceTemperature(1, 0.3, eps, th) ** 4 * Math.sin((th * Math.PI) / 180) * (Math.PI / n) / 2;
    }
    expect(rel(sum, equilibriumTemperature(1, 0.3) ** 4)).toBeLessThan(1e-3);
  });
  it("thick air redistributes, thin air does not", () => {
    const base = { gravityMs2: 9.81, radiusM: 6.371e6, temperatureK: 255 };
    expect(redistributionEfficiency({ ...base, pressureBar: 1 })).toBeGreaterThan(0.8);
    expect(redistributionEfficiency({ ...base, pressureBar: 0.01 })).toBeLessThan(0.15);
    expect(redistributionEfficiency({ ...base, pressureBar: 0 })).toBe(0);
  });
  it("N₂ condenses at 77 K at 1 bar and colder at lower pressure; water boils at 100 °C", () => {
    expect(condensationTemperature("N2", 1.01325)).toBeCloseTo(77.36, 2);
    expect(condensationTemperature("N2", 0.1)).toBeLessThan(65);
    expect(condensationTemperature("CO2", 1.01325)).toBeCloseTo(194.7, 1);
    expect(waterBoilingPoint(1.01325)).toBeCloseTo(373.15, 2);
    expect(waterBoilingPoint(0.1)).toBeLessThan(330);
  });
  it("finds a liquid-water band in km on a 1-bar Proxima-b-like world", () => {
    const band = liquidWaterBand({ sEarth: 0.65, albedo: 0.3, epsilon: 0.5, pressureBar: 1, radiusKm: 6600 });
    expect(band.widthKm).toBeGreaterThan(0);
    expect(band.innerDeg).not.toBeNull();
    expect(liquidWaterBand({ sEarth: 0.65, albedo: 0.3, epsilon: 0.5, pressureBar: 0.001, radiusKm: 6600 }).widthKm).toBe(0);
  });
});

describe("greenhouse and internal heat", () => {
  it("τ ≈ 0.84 warms Earth from 255 K to 288 K; Earth's heat flow gives a 35 K floor", () => {
    expect(Math.abs(equilibriumTemperature(1, 0.306) * greenhouseMultiplier(0.84) ** 0.25 - 288)).toBeLessThan(1.5);
    expect(internalHeatTemperature()).toBeCloseTo(35.3, 0);
  });
});

describe("atmospheric retention", () => {
  it("Earth keeps N₂ and loses H₂ at its ~1000 K exobase", () => {
    const v = escapeVelocityKms(1, 1);
    expect(retention(v, 1000, MOLECULAR_MASS.N2).verdict).toBe("retained");
    expect(retention(v, 1000, MOLECULAR_MASS.H2).verdict).toBe("lost");
  });
  it("the Moon keeps nothing at 390 K", () => {
    const v = escapeVelocityKms(0.0123, 0.273);
    expect(retention(v, 390, MOLECULAR_MASS.N2).verdict).toBe("lost");
  });
});

describe("Holman–Wiegert 1999", () => {
  it("matches the paper's μ=0.5 values", () => {
    expect(holmanWiegertSType(0.5, 0)).toBeCloseTo(0.274, 3);
    expect(holmanWiegertSType(0.5, 0.2)).toBeCloseTo(0.208, 2);
    expect(holmanWiegertPType(0.5, 0)).toBeCloseTo(2.39, 2);
  });
  it("Alpha Cen AB (μ 0.46, e 0.52, a 23.4 AU): S-type limit near 2.8 AU", () => {
    const ac = holmanWiegertSType(0.46, 0.52) * 23.4;
    expect(ac).toBeGreaterThan(2.3);
    expect(ac).toBeLessThan(3.3);
  });
});

describe("tidal locking (Gladman et al. 1996)", () => {
  it("Earth is not locked within the Sun's age; Proxima b and TRAPPIST-1e lock fast", () => {
    expect(tidalLockTimescaleYears({ aAU: 1, starMassMsun: 1, planetMassEarth: 1, planetRadiusEarth: 1 })).toBeGreaterThan(1e10);
    expect(tidalLockTimescaleYears({ aAU: 0.0485, starMassMsun: 0.122, planetMassEarth: 1.07, planetRadiusEarth: 1.03 })).toBeLessThan(1e7);
    expect(tidalLockTimescaleYears({ aAU: 0.02925, starMassMsun: 0.0898, planetMassEarth: 0.692, planetRadiusEarth: 0.92 })).toBeLessThan(1e6);
  });
});

describe("Chen & Kipping 2017 mass–radius", () => {
  it("TRAPPIST-1e is consistent (0.692 M⊕, 0.920 R⊕, ρ 4.9)", () => {
    expect(radiusFromMass(0.692)).toBeCloseTo(0.91, 2);
    const c = massRadiusCheck(0.692, 0.92);
    expect(c.verdict).toBe("consistent");
    expect(c.density).toBeCloseTo(4.9, 1);
  });
  it("Earth is consistent; Mercury is not flagged; 1 R⊕ at 50 M⊕ is implausible", () => {
    expect(massRadiusCheck(1, 1).verdict).toBe("consistent");
    expect(massRadiusCheck(0.0553, 0.383).verdict).not.toBe("implausible");
    const bad = massRadiusCheck(50, 1);
    expect(bad.verdict).toBe("implausible");
    expect(bad.density).toBeCloseTo(275.7, 0);
  });
  it("is continuous and invertible below the Jovian break", () => {
    for (const m of [0.1, 1, 2.03, 2.05, 10, 100]) expect(massFromRadius(radiusFromMass(m))!).toBeCloseTo(m, 6);
    expect(massFromRadius(20)).toBeNull();
    expect(rel(radiusFromMass(2.0399), radiusFromMass(2.0401))).toBeLessThan(1e-3);
  });
  it("density from mass and radius", () => {
    expect(bulkDensity(1, 1)).toBeCloseTo(5.514, 3);
  });
});

describe("Kopparapu 2014 HZ via the physics module", () => {
  it("Sun: runaway greenhouse ~0.95 AU, max greenhouse ~1.67 AU", () => {
    const e = kopparapuEdges(5772, 1);
    expect(e.runawayGreenhouse).toBeCloseTo(0.95, 1);
    expect(e.maxGreenhouse).toBeCloseTo(1.67, 1);
  });
});
