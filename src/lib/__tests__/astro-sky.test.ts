import { describe, it, expect } from "vitest";
import {
  EARTH_POLE,
  EARTH_ORBIT_NORMAL,
  EARTH_OBLIQUITY_DEG,
  AU_KM,
  airmass,
  altAz,
  angularDiameterDeg,
  angularSeparation,
  apparentMag,
  apparentMagAtAu,
  horizonFrame,
  hostStarDirection,
  lambertPhase,
  planetEquatorialFrame,
  planetRaDec,
  precessedPole,
  reflectedMagnitude,
  solarDayLength,
  solarPrecessionPeriodYears,
  stellarRadiusSolar,
  unitFromRaDec,
  xyzToRaDec,
} from "@/lib/simulators/astro";
import { teffFromBV } from "@/lib/simulators/exosky-systems";

// Reference values, each with its source. These test the astronomy, not the
// implementation: a wrong constant fails here.

describe("air mass (Kasten & Young 1989)", () => {
  it("is 1 at the zenith", () => expect(airmass(90)).toBeCloseTo(1, 3));
  it("is ~2 at 30° altitude (sec z = 2)", () => expect(airmass(30)).toBeCloseTo(1.995, 2));
  it("is ~38 at the horizon, finite where sec z is not", () => {
    expect(airmass(0)).toBeGreaterThan(37);
    expect(airmass(0)).toBeLessThan(39);
  });
  it("is infinite below the horizon", () => expect(airmass(-1)).toBe(Infinity));
});

describe("days", () => {
  it("Earth: 23.934 h sidereal and 365.256 d orbit give a 24.000 h solar day", () => {
    expect(solarDayLength(23.9345, 365.256 * 24)).toBeCloseTo(24.0, 2);
  });
  it("Venus: retrograde 243.0 d sidereal and 224.7 d orbit give a 116.8 d solar day", () => {
    expect(solarDayLength(-243.0, 224.7)).toBeCloseTo(116.75, 1);
  });
  it("tidal lock: the sun never moves", () => {
    expect(solarDayLength(11.1868 * 24, 11.1868 * 24)).toBe(Infinity);
  });
});

describe("Earth's own frame", () => {
  const eq = planetEquatorialFrame(EARTH_POLE, EARTH_ORBIT_NORMAL);
  it("puts the equinox at +x (the March equinox, RA 0)", () => {
    expect(eq[0][0]).toBeCloseTo(1, 9);
    expect(eq[2][2]).toBeCloseTo(1, 9);
  });
  it("puts the June solstice sun at Dec +23.44", () => {
    const s = hostStarDirection(eq, EARTH_ORBIT_NORMAL, 90);
    const { ra, dec } = planetRaDec(eq, s);
    expect(dec).toBeCloseTo(EARTH_OBLIQUITY_DEG, 3);
    expect(ra).toBeCloseTo(90, 3);
  });
  it("puts the March equinox sun at RA 0, Dec 0", () => {
    const { ra, dec } = planetRaDec(eq, hostStarDirection(eq, EARTH_ORBIT_NORMAL, 0));
    expect(dec).toBeCloseTo(0, 6);
    expect(Math.min(ra, 360 - ra)).toBeCloseTo(0, 6);
  });
});

describe("the horizon", () => {
  const eq = planetEquatorialFrame(EARTH_POLE, EARTH_ORBIT_NORMAL);
  it("at latitude 40°N the celestial pole stands 40° up, due north", () => {
    const h = horizonFrame(eq, 40, 123);
    const { alt, az } = altAz(h, [0, 0, 1]);
    expect(alt).toBeCloseTo(40, 6);
    expect(Math.min(az, 360 - az)).toBeCloseTo(0, 4);
  });
  it("on the equator at sidereal 0, RA 90° on the equator is rising due east", () => {
    const h = horizonFrame(eq, 0, 0);
    const { alt, az } = altAz(h, unitFromRaDec(90, 0));
    expect(alt).toBeCloseTo(0, 6);
    expect(az).toBeCloseTo(90, 6);
  });
  it("at the north pole the zenith is the celestial pole", () => {
    const h = horizonFrame(eq, 90, 0);
    expect(altAz(h, [0, 0, 1]).alt).toBeCloseTo(90, 6);
  });
  it("stars rise in the east: altitude grows with sidereal time for an eastern star", () => {
    const s = unitFromRaDec(90, 0);
    const a1 = altAz(horizonFrame(eq, 40, 0), s).alt;
    const a2 = altAz(horizonFrame(eq, 40, 15), s).alt;
    expect(a2).toBeGreaterThan(a1);
  });
});

describe("precession of the pole", () => {
  const sepToPole = (years: number, ra: number, dec: number) => {
    const p = precessedPole(EARTH_POLE, EARTH_ORBIT_NORMAL, 25772, years);
    const pr = xyzToRaDec(p[0], p[1], p[2]);
    return angularSeparation(pr, { ra, dec });
  };
  it("is unchanged at zero years", () => expect(sepToPole(0, 0, 90)).toBeCloseTo(0, 9));
  it("brings Vega near the pole around 13,700 CE (~+11,800 yr)", () => {
    expect(sepToPole(11800, 279.235, 38.784)).toBeLessThan(6);
    expect(sepToPole(0, 279.235, 38.784)).toBeGreaterThan(50);
  });
  it("brought Thuban to the pole around 2800 BCE (~-4,850 yr)", () => {
    expect(sepToPole(-4850, 211.097, 64.376)).toBeLessThan(2);
  });
  it("sun-only precession for Earth is ~80,000 yr (Fitzpatrick: ~79,400 yr)", () => {
    const y = solarPrecessionPeriodYears(23.9345, 365.256, 23.4393);
    expect(y).toBeGreaterThan(75000);
    expect(y).toBeLessThan(85000);
  });
});

describe("bodies", () => {
  it("the Sun from Earth: 0.533° across, magnitude -26.74", () => {
    expect(angularDiameterDeg(695700, AU_KM)).toBeCloseTo(0.533, 2);
    expect(apparentMagAtAu(4.83, 1)).toBeCloseTo(-26.74, 1);
  });
  it("Stefan-Boltzmann: the Sun is one solar radius", () => {
    expect(stellarRadiusSolar(1, 5772)).toBeCloseTo(1, 6);
  });
  it("Lambert phase function: 1 at full, 0 at new, 1/π at quarter", () => {
    expect(lambertPhase(0)).toBeCloseTo(1, 9);
    expect(lambertPhase(180)).toBeCloseTo(0, 9);
    expect(lambertPhase(90)).toBeCloseTo(1 / Math.PI, 9);
  });
  it("Jupiter at opposition is about magnitude -2.7 (Mallama et al. 2018)", () => {
    const m = reflectedMagnitude({ starAbsMag: 4.83, starBodyAu: 5.2026, observerBodyKm: 4.2026 * AU_KM, radiusKm: 69911, albedo: 0.538, phaseAngleDeg: 0 });
    expect(m).toBeGreaterThan(-3.0);
    expect(m).toBeLessThan(-2.4);
  });
  it("the full Moon is about magnitude -12.7", () => {
    const m = reflectedMagnitude({ starAbsMag: 4.83, starBodyAu: 1, observerBodyKm: 384400, radiusKm: 1737.4, albedo: 0.12, phaseAngleDeg: 0 });
    expect(m).toBeCloseTo(-12.7, 0);
  });
  it("from TRAPPIST-1e, TRAPPIST-1f at closest approach is wider than our Moon (0.52°)", () => {
    const d = (0.03849 - 0.02925) * AU_KM;
    expect(angularDiameterDeg(1.05 * 6371, d)).toBeGreaterThan(0.52);
  });
  it("the Sun from Alpha Centauri is a magnitude ~0.4 star", () => {
    expect(apparentMag(4.83, 1.3248)).toBeCloseTo(0.44, 1);
  });
  it("B-V to temperature (Ballesteros 2012): the Sun's 0.65 gives ~5,800 K", () => {
    expect(teffFromBV(0.65)).toBeGreaterThan(5650);
    expect(teffFromBV(0.65)).toBeLessThan(5950);
  });
});
