/**
 * Main-sequence dwarf table: one row per spectral subtype, mass ascending.
 *
 * Teff, mass and radius follow the mean dwarf sequence of Pecaut & Mamajek
 * (2013, ApJS 208:9) as maintained in E. Mamajek's "A Modern Mean Dwarf
 * Stellar Color and Effective Temperature Sequence" (2022 revision), rounded.
 * The M8V row is TRAPPIST-1 (Agol et al. 2021, PSJ 2:1) and G2V is the IAU
 * 2015 nominal Sun.
 *
 * Luminosity is NOT tabulated: it is derived from radius and temperature by
 * the Stefan–Boltzmann law, L/L☉ = (R/R☉)² (Teff/5772 K)⁴, so every row (and
 * every interpolated star) is self-consistent by construction. The old sim
 * tables broke this (a 30,000 K "blue" star at 4.5 L☉ implies 0.08 R☉).
 *
 * Mirrored row for row in public/tools/_shared/physics.js.
 */
import { T_SUN_K } from "./constants";

export interface MainSequenceRow {
  readonly spt: string;
  readonly teff: number; // K
  readonly mass: number; // M☉
  readonly radius: number; // R☉
}

export const MAIN_SEQUENCE: readonly MainSequenceRow[] = [
  { spt: "M8V", teff: 2566, mass: 0.0898, radius: 0.1192 },
  { spt: "M7V", teff: 2650, mass: 0.097, radius: 0.127 },
  { spt: "M6V", teff: 2810, mass: 0.105, radius: 0.137 },
  { spt: "M5V", teff: 3060, mass: 0.16, radius: 0.196 },
  { spt: "M4V", teff: 3210, mass: 0.23, radius: 0.27 },
  { spt: "M3V", teff: 3410, mass: 0.36, radius: 0.38 },
  { spt: "M2V", teff: 3560, mass: 0.44, radius: 0.446 },
  { spt: "M1V", teff: 3680, mass: 0.5, radius: 0.5 },
  { spt: "M0V", teff: 3850, mass: 0.57, radius: 0.588 },
  { spt: "K7V", teff: 4050, mass: 0.63, radius: 0.63 },
  { spt: "K5V", teff: 4440, mass: 0.7, radius: 0.68 },
  { spt: "K3V", teff: 4830, mass: 0.78, radius: 0.76 },
  { spt: "K0V", teff: 5270, mass: 0.88, radius: 0.85 },
  { spt: "G8V", teff: 5490, mass: 0.94, radius: 0.92 },
  { spt: "G5V", teff: 5650, mass: 0.98, radius: 0.96 },
  { spt: "G2V", teff: 5772, mass: 1.0, radius: 1.0 },
  { spt: "G0V", teff: 5920, mass: 1.05, radius: 1.1 },
  { spt: "F8V", teff: 6170, mass: 1.15, radius: 1.2 },
  { spt: "F5V", teff: 6510, mass: 1.33, radius: 1.47 },
  { spt: "F2V", teff: 6810, mass: 1.46, radius: 1.6 },
  { spt: "F0V", teff: 7220, mass: 1.61, radius: 1.73 },
  { spt: "A5V", teff: 8180, mass: 1.86, radius: 1.86 },
  { spt: "A0V", teff: 9700, mass: 2.34, radius: 2.19 },
  { spt: "B8V", teff: 12300, mass: 3.4, radius: 2.7 },
  { spt: "B5V", teff: 15700, mass: 4.7, radius: 3.36 },
  { spt: "B2V", teff: 20600, mass: 7.3, radius: 4.3 },
  { spt: "B0V", teff: 31400, mass: 15, radius: 6.5 },
  { spt: "O5V", teff: 41400, mass: 35, radius: 10 },
];

/** Stefan–Boltzmann: L/L☉ = (R/R☉)² (T/T☉)⁴. */
export function luminosityFromRadiusTeff(radiusRsun: number, teffK: number): number {
  return radiusRsun * radiusRsun * (teffK / T_SUN_K) ** 4;
}

/** Inverse Stefan–Boltzmann: R/R☉ = √L / (T/T☉)². */
export function radiusFromLuminosityTeff(lumLsun: number, teffK: number): number {
  return Math.sqrt(Math.max(lumLsun, 0)) / (teffK / T_SUN_K) ** 2;
}

export interface Star {
  spt: string;
  mass: number; // M☉
  radius: number; // R☉
  teff: number; // K
  luminosity: number; // L☉
  /** True when the requested mass lay outside the table and was clamped. */
  clamped: boolean;
}

function rowToStar(r: MainSequenceRow, clamped = false): Star {
  return {
    spt: r.spt,
    mass: r.mass,
    radius: r.radius,
    teff: r.teff,
    luminosity: luminosityFromRadiusTeff(r.radius, r.teff),
    clamped,
  };
}

/**
 * Main-sequence star of a given mass. Teff and radius are interpolated
 * linearly in log–log space between table rows (power-law segments), then L
 * follows from Stefan–Boltzmann. The spectral type is the nearest row.
 */
export function mainSequenceStar(massMsun: number): Star {
  const rows = MAIN_SEQUENCE;
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!Number.isFinite(massMsun) || massMsun <= first.mass) return rowToStar(first, massMsun !== first.mass);
  if (massMsun >= last.mass) return rowToStar(last, massMsun !== last.mass);
  let i = 1;
  while (rows[i].mass < massMsun) i++;
  const a = rows[i - 1];
  const b = rows[i];
  const t = Math.log(massMsun / a.mass) / Math.log(b.mass / a.mass);
  const teff = Math.exp(Math.log(a.teff) + t * Math.log(b.teff / a.teff));
  const radius = Math.exp(Math.log(a.radius) + t * Math.log(b.radius / a.radius));
  return {
    spt: t < 0.5 ? a.spt : b.spt,
    mass: massMsun,
    radius,
    teff,
    luminosity: luminosityFromRadiusTeff(radius, teff),
    clamped: false,
  };
}

/** Exact table row for a spectral type ("G2V", "m5v"), or null. */
export function starFromSpectralType(spt: string): Star | null {
  const key = spt.trim().toUpperCase();
  const row = MAIN_SEQUENCE.find((r) => r.spt === key);
  return row ? rowToStar(row) : null;
}

/**
 * Main-sequence lifetime, t ≈ 10 Gyr · (M/M☉) / (L/L☉): fuel ∝ M, burn rate
 * ∝ L, normalised to the Sun's ~10 Gyr (Hansen, Kawaler & Trimble,
 * "Stellar Interiors", 2004, §1.4). Order-of-magnitude only.
 */
export function mainSequenceLifetimeGyr(massMsun: number, lumLsun: number): number {
  return (10 * massMsun) / Math.max(lumLsun, 1e-12);
}
