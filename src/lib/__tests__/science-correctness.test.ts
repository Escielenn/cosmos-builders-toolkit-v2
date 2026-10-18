// Science-correctness regression tests (1.5 item 21). Every expectation is
// anchored to a published reference value or a closed-form limit, cited in
// place, not to whatever the code happened to output.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  calculateBrachistochrone,
  calculateConstantVelocity,
  calculateTimeDilation,
  LY_IN_METERS,
  AU_IN_METERS,
  SECONDS_PER_YEAR,
  C,
  G_ACCEL,
  type FormStateForCalc,
} from "@/lib/time-dilation/calculations";
import { calculateThrustGravity, calculateCombinedVector } from "@/lib/gravitas/calculations";
import { EARTH_G as GRAVITAS_G } from "@/lib/gravitas/data";
import { calcDeltaV, calcOrbitalVelocity } from "@/lib/surface-gravity/calculations";
import {
  calcHZBoundaries,
  calculateHabitableZone,
  type FormStateForCalc as HZForm,
} from "@/lib/habitable-zone/calculations";
import { kopparapuEdges, seff, KOPPARAPU_2014 } from "@/lib/habitable-zone/kopparapu";
import { hzBoundaries } from "@/components/solaris/kopparapu";
import {
  calculateDrakeN,
  getDrakeInterpretation,
  formatDrakeNumber,
} from "@/lib/drake";

const YR = SECONDS_PER_YEAR;

// ─── 1. Time Dilation round trip ─────────────────────────────────────────

describe("time dilation: brachistochrone", () => {
  // Baez & Gibbs, "The Relativistic Rocket" (UCR physics FAQ), 1 g table:
  // 4.3 ly (Alpha Centauri), accelerate half way and decelerate the rest:
  // 3.6 years ship time, 5.9 years Earth time.
  it("matches the Relativistic Rocket table one way at 1 g", () => {
    const r = calculateBrachistochrone(4.3 * LY_IN_METERS, 1, 1, false);
    expect(r.shipTimeSeconds / YR).toBeCloseTo(3.6, 1);
    expect(r.observerTimeSeconds / YR).toBeCloseTo(5.9, 1);
  });

  it("reduces to Newtonian t = 2·sqrt(d/a) at low speed", () => {
    // Over 1 AU at 1 g the peak speed is ~0.004c; relativistic terms are
    // ~1e-5 of the total.
    const r = calculateBrachistochrone(AU_IN_METERS, 1, 1, false);
    const newtonian = 2 * Math.sqrt(AU_IN_METERS / G_ACCEL);
    expect(r.observerTimeSeconds / newtonian).toBeCloseTo(1, 4);
  });

  it("round trip is two full stop-to-stop legs (exactly twice one way)", () => {
    const d = 4.2465 * LY_IN_METERS;
    const one = calculateBrachistochrone(d, 1, 1, false);
    const rt = calculateBrachistochrone(d, 1, 1, true);
    expect(rt.shipTimeSeconds).toBeCloseTo(2 * one.shipTimeSeconds, 3);
    expect(rt.observerTimeSeconds).toBeCloseTo(2 * one.observerTimeSeconds, 3);
    // Peak speed is the one-way peak; the ship stops at the destination.
    expect(rt.peakVelocityFraction).toBeCloseTo(one.peakVelocityFraction, 12);
    // Proxima at 1 g: 7.08 yr ship, 11.75 yr Earth (was 4.59 / 10.25 when
    // the round trip was one profile over 2d, passing the star at peak).
    expect(rt.shipTimeSeconds / YR).toBeCloseTo(7.08, 2);
    expect(rt.observerTimeSeconds / YR).toBeCloseTo(11.75, 2);
  });

  it("round trip with a velocity cap is also two capped legs", () => {
    const d = 10 * LY_IN_METERS;
    const one = calculateBrachistochrone(d, 1, 0.5, false);
    const rt = calculateBrachistochrone(d, 1, 0.5, true);
    expect(one.peakVelocityCapped).toBe(true);
    expect(rt.observerTimeSeconds).toBeCloseTo(2 * one.observerTimeSeconds, 3);
    expect(rt.shipTimeSeconds).toBeCloseTo(2 * one.shipTimeSeconds, 3);
  });

  it("constant-velocity round trip is still 2d/v", () => {
    const d = 4 * LY_IN_METERS;
    const rt = calculateConstantVelocity(d, 0.5, true);
    expect(rt.observerTimeSeconds).toBeCloseTo((2 * d) / (0.5 * C), 0);
  });
});

describe("time dilation: Alcubierre", () => {
  const base: FormStateForCalc = {
    journey: { presetCategory: "custom", presetId: "", customDistance: "10", customDistanceUnit: "ly", originName: "", destinationName: "" },
    propulsion: { method: "custom", customMaxVelocity: "0.5" },
    velocityProfile: { mode: "constant", velocityFraction: "0.5", gForce: "1" },
    referenceFrame: { frame: "earth", customName: "" },
    roundTrip: false,
    alcubierreNoDilation: true,
  };
  it("custom drives are unaffected by the speculative switch", () => {
    const a = calculateTimeDilation(base);
    const b = calculateTimeDilation({ ...base, alcubierreNoDilation: false });
    expect(a.shipTimeSeconds).toBe(b.shipTimeSeconds);
  });
});

// ─── 2. Gravitas combined spin + thrust ──────────────────────────────────

describe("gravitas: combined spin + thrust", () => {
  // Spin gravity is radial; thrust gravity is along the thrust line. With
  // the spin axis parallel to thrust they are perpendicular at every point
  // on the rim, so |g| = sqrt(s² + t²) and tilt = atan(t/s).
  it("axis parallel to thrust: quadrature sum, constant around the rim", () => {
    const r = calculateCombinedVector({ spin_g: 1, thrust_g: 1, axis_orientation: "parallel", custom_angle_deg: 0 });
    expect(r.resultant_g).toBeCloseTo(Math.SQRT2, 6);
    expect(r.resultant_min_g).toBeCloseTo(Math.SQRT2, 6);
    expect(r.resultant_max_g).toBeCloseTo(Math.SQRT2, 6);
    expect(r.tilt_angle_deg).toBeCloseTo(45, 6);
    expect(r.vector_angle_deg).toBeCloseTo(90, 6);
  });

  it("parallel case, 0.8 g spin + 0.6 g thrust: 1.0 g at 36.87°", () => {
    // 3-4-5 triangle: atan(0.6/0.8) = 36.8699°.
    const r = calculateCombinedVector({ spin_g: 0.8, thrust_g: 0.6, axis_orientation: "parallel", custom_angle_deg: 0 });
    expect(r.resultant_g).toBeCloseTo(1, 6);
    expect(r.tilt_angle_deg).toBeCloseTo(36.8699, 3);
  });

  it("axis perpendicular to thrust: |g| sweeps |s−t| to s+t", () => {
    const r = calculateCombinedVector({ spin_g: 1, thrust_g: 0.5, axis_orientation: "perpendicular", custom_angle_deg: 0 });
    expect(r.resultant_min_g).toBeCloseTo(0.5, 6);
    expect(r.resultant_max_g).toBeCloseTo(1.5, 6);
    // Worst tilt for t < s is asin(t/s) = 30°, where |g| = sqrt(s² − t²).
    expect(r.tilt_angle_deg).toBeCloseTo(30, 1);
    expect(r.resultant_g).toBeCloseTo(Math.sqrt(0.75), 2);
  });

  it("custom 0° equals parallel and custom 90° equals perpendicular", () => {
    const p = calculateCombinedVector({ spin_g: 1, thrust_g: 0.3, axis_orientation: "parallel", custom_angle_deg: 0 });
    const c0 = calculateCombinedVector({ spin_g: 1, thrust_g: 0.3, axis_orientation: "custom", custom_angle_deg: 0 });
    const q = calculateCombinedVector({ spin_g: 1, thrust_g: 0.3, axis_orientation: "perpendicular", custom_angle_deg: 0 });
    const c90 = calculateCombinedVector({ spin_g: 1, thrust_g: 0.3, axis_orientation: "custom", custom_angle_deg: 90 });
    expect(c0.resultant_g).toBeCloseTo(p.resultant_g, 9);
    expect(c90.tilt_angle_deg).toBeCloseTo(q.tilt_angle_deg, 9);
  });
});

// ─── 3. Gravitas thrust trips use the relativistic engine ────────────────

describe("gravitas: thrust trips", () => {
  const AU_PER_LY = LY_IN_METERS / 1.496e11;

  it("brachistochrone with relativity agrees with the Time Dilation engine", () => {
    const au = 4.3 * AU_PER_LY;
    const g = calculateThrustGravity({ acceleration_g: 1, mission_distance_au: au, propulsion_mode: "brachistochrone", include_relativity: true });
    const td = calculateBrachistochrone(au * 1.496e11, GRAVITAS_G / G_ACCEL, 1, false);
    expect(g.ship_time_years).toBeCloseTo(td.shipTimeSeconds / YR, 6);
    expect(g.earth_time_years).toBeCloseTo(td.observerTimeSeconds / YR, 6);
    // Baez & Gibbs: 3.6 yr ship / 5.9 yr Earth for 4.3 ly at 1 g.
    expect(g.ship_time_years).toBeCloseTo(3.6, 1);
    expect(g.earth_time_years).toBeCloseTo(5.9, 1);
    expect(g.trip_duration_days).toBeCloseTo(g.earth_time_years * 365.25, 3);
  });

  it("accelerate-all-the-way obeys t = (c/a)·sinh(aτ/c)", () => {
    const g = calculateThrustGravity({ acceleration_g: 1, mission_distance_au: 10 * AU_PER_LY, propulsion_mode: "constant", include_relativity: true });
    const a = GRAVITAS_G;
    const tau = g.ship_time_years * YR;
    const t = (C / a) * Math.sinh((a * tau) / C);
    expect(g.earth_time_years * YR).toBeCloseTo(t, -2);
    expect(g.peak_velocity_c).toBeLessThan(1);
    expect(g.peak_velocity_c).toBeCloseTo(Math.tanh((a * tau) / C), 9);
  });

  it("coast mode matches Newtonian at interplanetary speeds", () => {
    const rel = calculateThrustGravity({ acceleration_g: 0.01, mission_distance_au: 5, propulsion_mode: "coast_flip", include_relativity: true });
    const newt = calculateThrustGravity({ acceleration_g: 0.01, mission_distance_au: 5, propulsion_mode: "coast_flip", include_relativity: false });
    expect(rel.trip_duration_days / newt.trip_duration_days).toBeCloseTo(1, 5);
    expect(rel.delta_v_kms / newt.delta_v_kms).toBeCloseTo(1, 5);
  });

  it("relativity off keeps Newtonian ship time = Earth time", () => {
    const g = calculateThrustGravity({ acceleration_g: 1, mission_distance_au: 4.3 * AU_PER_LY, propulsion_mode: "brachistochrone", include_relativity: false });
    expect(g.ship_time_years).toBe(g.earth_time_years);
  });
});

// ─── 4. Surface Gravity delta-v to orbit ─────────────────────────────────

describe("surface gravity: delta-v to orbit", () => {
  it("Earth is exactly 1.00x and 9.4 km/s", () => {
    // ~9.4 km/s to LEO including gravity and drag losses (Sutton &
    // Biblarz, Rocket Propulsion Elements; NASA quotes 9.3–10 km/s).
    const r = calcDeltaV(1, 1);
    expect(r.earthComparison).toBeCloseTo(1, 12);
    expect(r.deltaVToOrbit).toBeCloseTo(9.4, 6);
  });
  it("scales with surface orbital velocity √(GM/R)", () => {
    // Mars: 0.107 M⊕, 0.532 R⊕ → v_orb ≈ 3.55 km/s (NASA Mars fact sheet).
    expect(calcOrbitalVelocity(0.107, 0.532)).toBeCloseTo(3.55, 1);
    const mars = calcDeltaV(0.107, 0.532);
    expect(mars.earthComparison).toBeCloseTo(Math.sqrt(0.107 / 0.532), 6);
  });
});

// ─── 5. Habitable Zone (Kopparapu) ───────────────────────────────────────

describe("habitable zone: Kopparapu et al. 2014", () => {
  it("reproduces the solar conservative HZ, 0.95–1.67 AU", () => {
    // Kopparapu et al. 2014, ApJ 787:L29: for a 1 M⊕ planet around the Sun
    // the runaway-greenhouse inner edge is 0.95 AU and the maximum-greenhouse
    // outer edge ~1.67 AU (S_eff = 1.107 and 0.356).
    const hz = calcHZBoundaries(1, 5780);
    expect(hz.runawayGreenhouse).toBeCloseTo(0.95, 2);
    expect(hz.maxGreenhouse).toBeCloseTo(1.676, 2);
    expect(hz.teffClamped).toBe(false);
  });

  it("uses the published coefficient table", () => {
    expect(KOPPARAPU_2014.runawayGreenhouse[0]).toBe(1.107);
    expect(KOPPARAPU_2014.maxGreenhouse[0]).toBe(0.356);
    expect(seff(5780, "runawayGreenhouse")).toBeCloseTo(1.107, 10);
  });

  it("an M dwarf's HZ edges move inward in flux (S_eff falls with Teff)", () => {
    // At Teff = 3000 K the runaway limit is S_eff ≈ 0.92 (polynomial value).
    expect(seff(3000, "runawayGreenhouse")).toBeCloseTo(0.922, 2);
    const cool = calcHZBoundaries(0.01, 3000);
    const solarShape = calcHZBoundaries(0.01, 5780);
    expect(cool.runawayGreenhouse).toBeGreaterThan(solarShape.runawayGreenhouse);
  });

  it("clamps outside 2600–7200 K and says so", () => {
    const hot = kopparapuEdges(10000, 10);
    const edge = kopparapuEdges(7200, 10);
    expect(hot.teffClamped).toBe(true);
    expect(hot.runawayGreenhouse).toBeCloseTo(edge.runawayGreenhouse, 12);
  });

  const form = (orbitalDistance: number, temperature = 5778): HZForm => ({
    star: { presetId: "custom", spectralType: "G", mass: 1, luminosity: 1, temperature, autoLuminosity: false },
    planet: { orbitalDistance, name: "Test", greenhouseWarming: 33 },
    storyNotes: { starDescription: "", planetSetting: "", habitabilityNarrative: "", worldbuildingNotes: "" },
    generalNotes: "",
    moodboard: [],
  });

  it("scorched planets are described as inside the inner edge", () => {
    const r = calculateHabitableZone(form(0.3));
    expect(r.planetZone).toBe("scorched");
    expect(r.narrativeSummary).toContain("inside the inner edge of the habitable zone");
    expect(r.narrativeSummary).not.toMatch(/lies inside the habitable zone/);
  });

  it("notes a clamped Teff in the narrative", () => {
    const r = calculateHabitableZone(form(1, 9000));
    expect(r.narrativeSummary).toContain("clamped");
  });

  it("Solaris engine and the calculator share one table", () => {
    const a = hzBoundaries(4500, 0.3);
    const b = calcHZBoundaries(0.3, 4500);
    expect(a.runawayGreenhouseAU).toBeCloseTo(b.runawayGreenhouse, 12);
    expect(a.maxGreenhouseAU).toBeCloseTo(b.maxGreenhouse, 12);
  });
});

// ─── 6. Standalone Solaris sim ───────────────────────────────────────────

describe("solaris sim.html star physics", () => {
  const html = readFileSync(resolve(__dirname, "../../../public/tools/solaris/sim.html"), "utf8");
  const start = html.indexOf("const STARS={");
  const endMarker = "SKEYS.forEach(k=>{const d=STARS[k];";
  const end = html.indexOf("\n", html.indexOf(endMarker));
  type Def = { lum: number; teffK: number; mass: number; hz: [number, number] };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const mod = new Function(`${html.slice(start, end)}; return { STARS, combinedHZ, massFromLum };`)() as {
    STARS: Record<string, Def>;
    combinedHZ: (defs: Def[]) => [number, number];
    massFromLum: (l: number) => number;
  };

  it("the yellow star's HZ is the Sun's Kopparapu HZ (~0.95–1.67 AU)", () => {
    const [inner, outer] = mod.STARS.yellow.hz;
    expect(inner).toBeCloseTo(0.95, 2);
    expect(outer).toBeCloseTo(1.676, 2);
  });

  it("a binary's HZ uses total luminosity once (no double scaling)", () => {
    const y = mod.STARS.yellow;
    const [inner, outer] = mod.combinedHZ([y, y]);
    // Two suns: d scales as √2 of the single-star HZ, not 2×.
    expect(inner).toBeCloseTo(Math.SQRT2 * y.hz[0], 9);
    expect(outer).toBeCloseTo(Math.SQRT2 * y.hz[1], 9);
  });

  it("stellar mass comes from the mass-luminosity relation, not L", () => {
    // L = M^4 on the main sequence (0.43–2 M☉): 1 L☉ → 1 M☉, 0.42 L☉ → 0.805 M☉.
    expect(mod.STARS.yellow.mass).toBeCloseTo(1, 9);
    expect(mod.STARS.orange.mass).toBeCloseTo(Math.pow(0.42, 0.25), 9);
    expect(mod.massFromLum(8)).toBeCloseTo(Math.pow(8, 0.25), 9);
    // Low-mass branch, L = 0.23·M^2.3: 0.01 L☉ → 0.256 M☉.
    expect(mod.massFromLum(0.01)).toBeCloseTo(Math.pow(0.01 / 0.23, 1 / 2.3), 9);
    for (const d of Object.values(mod.STARS)) {
      if (d.lum !== 1) expect(d.mass).not.toBeCloseTo(d.lum, 2);
    }
  });

  it("orbital speed and Hill sphere read stellar mass", () => {
    expect(html).toContain("Math.sqrt(GM_base * system.stars[0].def.mass / p.orbitPx)");
    expect(html).toContain("(3 * system.stars[0].def.mass * 1e4)");
    expect(html).toContain("GM: GM_base * (s.def.mass || 1)");
  });
});

// ─── 8. Drake ────────────────────────────────────────────────────────────

describe("drake equation", () => {
  it("reproduces Drake's 1961 Green Bank estimate, N = 10", () => {
    // R*=10, fp=0.5, ne=2, fl=1, fi=0.01, fc=0.01, L=10,000 → N = 10
    // (Drake 1961 Green Bank meeting values, as in Drake & Sobel 1992).
    const N = calculateDrakeN({ rStar: 10, fp: 0.5, ne: 2, fl: 1, fi: 0.01, fc: 0.01, L: 10000 });
    expect(N).toBeCloseTo(10, 9);
    expect(getDrakeInterpretation(N).label).toBe("Sparse");
  });

  it("missing factors: 0 by default, 1 when asked", () => {
    expect(calculateDrakeN({ rStar: 2, fp: 1 })).toBe(0);
    expect(calculateDrakeN({ rStar: 2, fp: 1 }, { missingAs: 1 })).toBe(2);
    expect(calculateDrakeN({ rStar: "3", fp: "", ne: null } as Record<string, unknown>, { missingAs: 1 })).toBe(3);
  });

  it("ignores keys that are not Drake factors", () => {
    expect(calculateDrakeN({ rStar: 1, fp: 1, ne: 1, fl: 1, fi: 1, fc: 1, L: 5, extra: 100 } as Record<string, unknown>)).toBe(5);
  });

  it("interpretation bands and number format", () => {
    expect(getDrakeInterpretation(0.5).band).toBe("very-lonely");
    expect(getDrakeInterpretation(10000).band).toBe("teeming");
    expect(formatDrakeNumber(2_500_000)).toBe("2.5 million");
    expect(formatDrakeNumber(0.5)).toBe("0.5000");
  });
});
