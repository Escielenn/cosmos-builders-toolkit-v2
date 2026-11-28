/**
 * The static sims cannot import the app bundle, so public/tools/_shared/
 * physics.js is a hand-kept twin of src/lib/physics. This test loads it in a
 * sandbox and compares every shared function over a grid of inputs.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import * as TS from "@/lib/physics";

type Api = Record<string, unknown>;
function loadJs(): Api {
  const src = readFileSync(path.resolve(__dirname, "../../../../public/tools/_shared/physics.js"), "utf8");
  const sandbox: { window: Api } = { window: {} };
  vm.runInNewContext(src, sandbox);
  return sandbox.window.SFPhysics as Api;
}
const JS = loadJs();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fn = (name: string) => JS[name] as (...a: any[]) => any;

const close = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") {
    if (!Number.isFinite(b)) return expect(a).toBe(b);
    return expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-12 * Math.max(1, Math.abs(b)));
  }
  expect(JSON.parse(JSON.stringify(a))).toEqual(JSON.parse(JSON.stringify(b)));
};

describe("physics.js ↔ src/lib/physics parity", () => {
  it("constants", () => {
    for (const k of ["G", "SIGMA_SB", "K_B", "AMU", "AU_M", "M_SUN_KG", "R_SUN_M", "L_SUN_W", "T_SUN_K", "M_EARTH_KG", "R_EARTH_M", "S_EARTH_WM2", "G_EARTH", "RHO_EARTH", "V_ESC_EARTH_KMS", "DAYS_PER_YEAR", "IRON_FLOOR_TOLERANCE", "WATER_TRIPLE_BAR", "EARTH_INTERNAL_FLUX_WM2"]) {
      expect(JS[k], k).toBe((TS as unknown as Api)[k]);
    }
    close(JS.MOLECULAR_MASS, TS.MOLECULAR_MASS);
    close(JS.MAIN_SEQUENCE, TS.MAIN_SEQUENCE);
    close(JS.KOPPARAPU_2014, TS.KOPPARAPU_2014);
    close(JS.CONDENSABLE, TS.CONDENSABLE);
    close(JS.CHEN_KIPPING_SIGMA_DEX, TS.CHEN_KIPPING_SIGMA_DEX);
    close(JS.REDISTRIBUTION, TS.REDISTRIBUTION);
  });

  it("stars and HZ", () => {
    for (const m of [0.05, 0.0898, 0.12, 0.3, 0.57, 0.8, 1, 1.08, 2, 5, 20, 35, 80]) close(fn("mainSequenceStar")(m), TS.mainSequenceStar(m));
    for (const s of ["G2V", "m8v", "B0V", "X9"]) close(fn("starFromSpectralType")(s), TS.starFromSpectralType(s));
    for (const t of [2000, 2566, 3500, 5772, 7000, 9000]) {
      close(fn("kopparapuEdges")(t, 0.5), TS.kopparapuEdges(t, 0.5));
      close(fn("kopparapuSeff")(t, "earlyMars"), TS.kopparapuSeff(t, "earlyMars"));
    }
    close(fn("internalHeatTemperature")(), TS.internalHeatTemperature());
    close(fn("greenhouseMultiplier")(0.84), TS.greenhouseMultiplier(0.84));
    close(fn("mainSequenceLifetimeGyr")(2, 16), TS.mainSequenceLifetimeGyr(2, 16));
  });

  it("orbits, temperatures, phases", () => {
    for (const a of [0.02, 0.0485, 1, 5.2]) for (const m of [0.09, 1, 2]) {
      close(fn("orbitalPeriodDays")(a, m, 3), TS.orbitalPeriodDays(a, m, 3));
      close(fn("semiMajorAxisAU")(a * 300, m, 3), TS.semiMajorAxisAU(a * 300, m, 3));
      close(fn("insolation")(m, a), TS.insolation(m, a));
      close(fn("distanceForInsolation")(m, a), TS.distanceForInsolation(m, a));
    }
    for (const s of [0.01, 0.65, 1, 4]) for (const A of [0, 0.3, 0.9]) {
      close(fn("equilibriumTemperature")(s, A), TS.equilibriumTemperature(s, A));
      close(fn("equilibriumTemperature")(s, A, 0.5), TS.equilibriumTemperature(s, A, 0.5));
      close(fn("substellarTemperature")(s, A), TS.substellarTemperature(s, A));
      for (const e of [0, 0.4, 1]) {
        close(fn("lockedHemispheres")(s, A, e), TS.lockedHemispheres(s, A, e));
        close(fn("lockedHemispheres")(s, A, e, 0.8, 35), TS.lockedHemispheres(s, A, e, 0.8, 35));
        for (const th of [0, 45, 89.9, 90, 135]) {
          close(fn("lockedSurfaceTemperature")(s, A, e, th), TS.lockedSurfaceTemperature(s, A, e, th));
          close(fn("lockedSurfaceTemperature")(s, A, e, th, 1.2, 35), TS.lockedSurfaceTemperature(s, A, e, th, 1.2, 35));
        }
        const band = { sEarth: s, albedo: A, epsilon: e, pressureBar: 1, radiusKm: 6371, stepDeg: 0.5 };
        close(fn("liquidWaterBand")(band), TS.liquidWaterBand(band));
        const band2 = { ...band, tau: 0.84, internalK: 35 };
        close(fn("liquidWaterBand")(band2), TS.liquidWaterBand(band2));
      }
    }
    for (const p of [0, 0.01, 1, 90]) {
      const o = { pressureBar: p, gravityMs2: 9.8, radiusM: 6.4e6, temperatureK: 250, cpJkgK: 850, windMs: 15 };
      close(fn("redistributionEfficiency")(o), TS.redistributionEfficiency(o));
      if (p > 0) {
        close(fn("condensationTemperature")("N2", p), TS.condensationTemperature("N2", p));
        for (const gas of ["CO2", "CH4", "SO2", "H2"] as const) close(fn("condensationTemperature")(gas, p), TS.condensationTemperature(gas, p));
        close(fn("waterBoilingPoint")(p), TS.waterBoilingPoint(p));
      }
    }
  });

  it("bulk, retention, stability, tides, mass–radius", () => {
    for (const m of [0.0553, 0.692, 1, 2.04, 17, 50, 131.6, 318, 4000]) for (const r of [0.38, 0.92, 1, 4, 11.2]) {
      close(fn("surfaceGravity")(m, r), TS.surfaceGravity(m, r));
      close(fn("bulkDensity")(m, r), TS.bulkDensity(m, r));
      close(fn("escapeVelocityKms")(m, r), TS.escapeVelocityKms(m, r));
      close(fn("massRadiusCheck")(m, r), TS.massRadiusCheck(m, r));
      close(fn("tidalLockTimescaleYears")({ aAU: 0.05, starMassMsun: 0.3, planetMassEarth: m, planetRadiusEarth: r }), TS.tidalLockTimescaleYears({ aAU: 0.05, starMassMsun: 0.3, planetMassEarth: m, planetRadiusEarth: r }));
    }
    for (const r of [0.5, 1.2, 1.9, 5, 20]) close(fn("massFromRadius")(r), TS.massFromRadius(r));
    for (const m of [0.3, 3, 300]) close(fn("radiusFromMass")(m), TS.radiusFromMass(m));
    for (const T of [100, 300, 1000]) for (const mu of [2.016, 28.014]) close(fn("retention")(11.2, T, mu), TS.retention(11.2, T, mu));
    for (const mu of [0.1, 0.5]) for (const e of [0, 0.3, 0.7]) {
      close(fn("holmanWiegertSType")(mu, e), TS.holmanWiegertSType(mu, e));
      close(fn("holmanWiegertPType")(mu, e), TS.holmanWiegertPType(mu, e));
    }
  });
});
