/**
 * Planetary physics shared by the app and the static simulators.
 * Mirrored function for function in public/tools/_shared/physics.js.
 * Every formula carries its source; tests use Earth, Mars, Proxima b and
 * TRAPPIST-1e as reference values.
 */
import {
  AMU,
  DAYS_PER_YEAR,
  G,
  G_EARTH,
  K_B,
  M_EARTH_IN_SUN,
  M_EARTH_KG,
  M_SUN_KG,
  AU_M,
  R_EARTH_M,
  RHO_EARTH,
  S_EARTH_WM2,
  SECONDS_PER_YEAR,
  SIGMA_SB,
  V_ESC_EARTH_KMS,
} from "./constants";

/* ── Orbits ─────────────────────────────────────────────────────────── */

/**
 * Kepler's third law in solar units: P[yr] = √(a[AU]³ / (M★ + m_p)[M☉]).
 * Returns days (Julian year). Earth: 365.25 d. Mars: 687 d.
 */
export function orbitalPeriodDays(aAU: number, starMassMsun: number, planetMassEarth = 0): number {
  const m = Math.max(starMassMsun + planetMassEarth * M_EARTH_IN_SUN, 1e-12);
  return DAYS_PER_YEAR * Math.sqrt(Math.max(aAU, 0) ** 3 / m);
}

/** Inverse of orbitalPeriodDays: a[AU] = (M · P[yr]²)^(1/3). */
export function semiMajorAxisAU(periodDays: number, starMassMsun: number, planetMassEarth = 0): number {
  const m = starMassMsun + planetMassEarth * M_EARTH_IN_SUN;
  const pYr = periodDays / DAYS_PER_YEAR;
  return Math.cbrt(Math.max(m, 0) * pYr * pYr);
}

/** Bolometric insolation relative to Earth's: S/S⊕ = (L/L☉) / a[AU]². */
export function insolation(lumLsun: number, aAU: number): number {
  return lumLsun / Math.max(aAU * aAU, 1e-12);
}

/** Distance at which a star of luminosity L gives insolation S: a = √(L/S). */
export function distanceForInsolation(lumLsun: number, sEarth: number): number {
  return Math.sqrt(Math.max(lumLsun, 0) / Math.max(sEarth, 1e-12));
}

/* ── Temperatures ───────────────────────────────────────────────────── */

/**
 * Irradiation temperature T₀ = (S·S⊕ / σ)^¼: the substellar temperature of a
 * black, non-redistributing surface (Cowan & Agol 2011, ApJ 729:54, eq. 1,
 * T₀ = T★√(R★/a)). Earth: 393.6 K.
 */
export function irradiationTemperature(sEarth: number): number {
  return ((Math.max(sEarth, 0) * S_EARTH_WM2) / SIGMA_SB) ** 0.25;
}

/**
 * Redistribution factors f in T = T₀ [(1−A) f]^¼.
 *   SUBSTELLAR 1      one point facing the star, no transport (true substellar)
 *   DAYSIDE 1/2       dayside only, uniform (hemisphere average, no transport)
 *   FULL 1/4          whole globe uniform (classic "equilibrium temperature")
 * Cowan & Agol 2011 §2; Seager 2010, "Exoplanet Atmospheres", §3.1.
 */
export const REDISTRIBUTION = { SUBSTELLAR: 1, DAYSIDE: 0.5, FULL: 0.25 } as const;

/**
 * Equilibrium temperature T = T₀ [(1−A) f]^¼. Earth (A 0.3, f ¼): 255 K.
 * The old Tidelock "substellar" used f = ¼ (the planet-average 16πσd²
 * form), √2 too cold for an airless day side.
 */
export function equilibriumTemperature(sEarth: number, albedo: number, f: number = REDISTRIBUTION.FULL): number {
  const a = Math.min(Math.max(albedo, 0), 1);
  return irradiationTemperature(sEarth) * ((1 - a) * f) ** 0.25;
}

/** True substellar temperature of a non-redistributing surface: f = 1. */
export function substellarTemperature(sEarth: number, albedo: number): number {
  return equilibriumTemperature(sEarth, albedo, REDISTRIBUTION.SUBSTELLAR);
}

/**
 * Day–night heat-redistribution efficiency ε ∈ [0, 1] from the ratio of
 * radiative to advective timescales (Showman & Guillot 2002, A&A 385:166;
 * Cowan & Agol 2011 §5; the scaling Koll & Abbot 2016, ApJ 825:99, test
 * against GCMs for rocky tidally locked planets):
 *   τ_rad = (p / g) · c_p / (4σT³),   τ_adv = R_p / U,   ε = τ_rad / (τ_rad + τ_adv)
 * U defaults to 20 m/s, typical terminator-crossing wind speed in rocky
 * tidally locked GCMs (Koll & Abbot 2016, fig. 4). No atmosphere → ε = 0.
 * Earth-like 1 bar gives ε ≈ 0.9; 0.01 bar gives ε ≈ 0.08.
 */
export function redistributionEfficiency(opts: {
  pressureBar: number;
  gravityMs2: number;
  radiusM: number;
  temperatureK: number;
  cpJkgK?: number;
  windMs?: number;
}): number {
  const { pressureBar, gravityMs2, radiusM, temperatureK } = opts;
  if (!(pressureBar > 0)) return 0;
  const cp = opts.cpJkgK ?? 1040;
  const u = opts.windMs ?? 20;
  const T = Math.max(temperatureK, 1);
  const tauRad = ((pressureBar * 1e5) / Math.max(gravityMs2, 1e-6)) * cp / (4 * SIGMA_SB * T ** 3);
  const tauAdv = radiusM / u;
  return tauRad / (tauRad + tauAdv);
}

/**
 * Grey-atmosphere greenhouse warming of the surface, Eddington two-stream:
 *   T_s⁴ = T_e⁴ · (1 + ¾τ)
 * with τ the infrared optical depth (Catling & Kasting 2017, "Atmospheric
 * Evolution on Inhabited and Lifeless Worlds", §2.5; Pierrehumbert 2010,
 * "Principles of Planetary Climate", §4.3). Earth's 255 → 288 K needs τ ≈ 0.84.
 * Returns the multiplier on T⁴.
 */
export function greenhouseMultiplier(tau: number): number {
  return 1 + 0.75 * Math.max(tau, 0);
}

/**
 * Night-side floor from internal heat: a geothermal flux F gives
 * T = (F/σ)^¼. Earth's 0.087 W/m² (Davies & Davies 2010, Solid Earth 1:5)
 * gives 35 K, the temperature an airless permanent night settles to.
 */
export const EARTH_INTERNAL_FLUX_WM2 = 0.087;
export function internalHeatTemperature(fluxWm2: number = EARTH_INTERNAL_FLUX_WM2): number {
  return (Math.max(fluxWm2, 0) / SIGMA_SB) ** 0.25;
}

/**
 * Local surface temperature on a synchronously rotating planet at angle θ
 * from the substellar point. A fraction ε of the absorbed starlight is
 * spread over the whole globe, the rest is re-emitted where it lands:
 *   σT(θ)⁴ = S·S⊕·(1−A) · [ (1−ε)·max(cos θ, 0) + ε/4 ] · (1 + ¾τ) + σT_int⁴
 * Energy-conserving (global mean of the stellar term = S(1−A)/4); ε = 0,
 * τ = 0 gives the true substellar T₀(1−A)^¼ at θ = 0, and the night side
 * σT⁴ = ε·S(1−A)/4 is the Cowan & Agol 2011 eq. 5 night-side temperature.
 * Continuous across the terminator, so day, terminator and night come from
 * one profile. τ (greenhouse) and T_int (internal heat) default to 0.
 */
export function lockedSurfaceTemperature(
  sEarth: number,
  albedo: number,
  epsilon: number,
  thetaDeg: number,
  tau = 0,
  internalK = 0,
): number {
  const a = Math.min(Math.max(albedo, 0), 1);
  const e = Math.min(Math.max(epsilon, 0), 1);
  const mu = Math.max(Math.cos((thetaDeg * Math.PI) / 180), 0);
  const flux = Math.max(sEarth, 0) * S_EARTH_WM2 * (1 - a) * ((1 - e) * mu + e / 4);
  return ((flux / SIGMA_SB) * greenhouseMultiplier(tau) + internalK ** 4) ** 0.25;
}

/** Day-side and night-side hemisphere temperatures (flux-weighted) for the profile above. */
export function lockedHemispheres(
  sEarth: number,
  albedo: number,
  epsilon: number,
  tau = 0,
  internalK = 0,
): { day: number; night: number; substellar: number; terminator: number } {
  const a = Math.min(Math.max(albedo, 0), 1);
  const e = Math.min(Math.max(epsilon, 0), 1);
  const base = ((Math.max(sEarth, 0) * S_EARTH_WM2 * (1 - a)) / SIGMA_SB) * greenhouseMultiplier(tau);
  const floor = internalK ** 4;
  // Hemisphere mean of max(cos θ, 0) over the day side is 1/2.
  return {
    day: (base * ((1 - e) / 2 + e / 4) + floor) ** 0.25,
    night: (base * (e / 4) + floor) ** 0.25,
    substellar: lockedSurfaceTemperature(sEarth, albedo, epsilon, 0, tau, internalK),
    terminator: lockedSurfaceTemperature(sEarth, albedo, epsilon, 90, tau, internalK),
  };
}

/* ── Phase boundaries ───────────────────────────────────────────────── */

const R_GAS = 8.314462618; // J mol⁻¹ K⁻¹

/**
 * Clausius–Clapeyron: temperature at which a vapour's saturation pressure
 * equals p, from a reference point (T_ref, p_ref) and latent heat L:
 *   1/T = 1/T_ref − (R/L) ln(p/p_ref)
 */
export function clausiusClapeyronT(pBar: number, tRefK: number, pRefBar: number, latentJmol: number): number {
  const inv = 1 / tRefK - (R_GAS / latentJmol) * Math.log(Math.max(pBar, 1e-12) / pRefBar);
  return 1 / inv;
}

/**
 * Condensation (collapse) temperature of the bulk gas at surface pressure p.
 * Reference points (NIST Chemistry WebBook): N₂ boils at 77.36 K at 1.013
 * bar, ΔH_vap 5.57 kJ/mol; CO₂ sublimes at 194.7 K at 1.013 bar, ΔH_sub
 * 25.2 kJ/mol; H₂ boils at 20.3 K, 0.9 kJ/mol; CH₄ at 111.66 K, 8.19
 * kJ/mol; SO₂ at 263.1 K, 24.9 kJ/mol. Night sides colder than this
 * freeze the atmosphere out (Joshi, Haberle & Reynolds 1997, Icarus 129:450;
 * Wordsworth 2015, ApJ 806:180).
 */
export const CONDENSABLE = {
  N2: { tRef: 77.36, pRef: 1.01325, latent: 5570 },
  CO2: { tRef: 194.7, pRef: 1.01325, latent: 25200 },
  H2: { tRef: 20.3, pRef: 1.01325, latent: 900 },
  CH4: { tRef: 111.66, pRef: 1.01325, latent: 8190 },
  SO2: { tRef: 263.1, pRef: 1.01325, latent: 24900 },
} as const;
export type Condensable = keyof typeof CONDENSABLE;

export function condensationTemperature(gas: Condensable, pBar: number): number {
  const c = CONDENSABLE[gas];
  return clausiusClapeyronT(pBar, c.tRef, c.pRef, c.latent);
}

/** Water: triple point 0.00611 bar; boiling point from Clausius–Clapeyron (ΔH_vap 40.65 kJ/mol). */
export const WATER_TRIPLE_BAR = 0.00611;
export function waterBoilingPoint(pBar: number): number {
  return clausiusClapeyronT(pBar, 373.15, 1.01325, 40650);
}

/**
 * Width of the band where surface water can be liquid (273.15 K to the local
 * boiling point) on a synchronously rotating planet, measured along a great
 * circle from the substellar point. Returns degrees of arc and kilometres
 * (arc × radius), plus the inner and outer angles. Null bounds when no band
 * exists (too hot everywhere, too cold everywhere, or below the triple
 * point).
 */
export function liquidWaterBand(opts: {
  sEarth: number;
  albedo: number;
  epsilon: number;
  pressureBar: number;
  radiusKm: number;
  tau?: number;
  internalK?: number;
  stepDeg?: number;
}): { widthDeg: number; widthKm: number; innerDeg: number | null; outerDeg: number | null } {
  const none = { widthDeg: 0, widthKm: 0, innerDeg: null, outerDeg: null };
  if (opts.pressureBar < WATER_TRIPLE_BAR) return none;
  const tBoil = waterBoilingPoint(opts.pressureBar);
  const step = opts.stepDeg ?? 0.1;
  let inner: number | null = null;
  let outer: number | null = null;
  for (let th = 0; th <= 180 + 1e-9; th += step) {
    const T = lockedSurfaceTemperature(opts.sEarth, opts.albedo, opts.epsilon, th, opts.tau ?? 0, opts.internalK ?? 0);
    if (T >= 273.15 && T <= tBoil) {
      if (inner === null) inner = th;
      outer = th;
    }
  }
  if (inner === null || outer === null) return none;
  const widthDeg = outer - inner;
  return { widthDeg, widthKm: (widthDeg * Math.PI / 180) * opts.radiusKm, innerDeg: inner, outerDeg: outer };
}

/* ── Bulk planet ────────────────────────────────────────────────────── */

/** Surface gravity in g⊕: g = M / R² (Earth units). */
export function surfaceGravity(massEarth: number, radiusEarth: number): number {
  return massEarth / Math.max(radiusEarth * radiusEarth, 1e-12);
}

/** Surface gravity in m/s². */
export function surfaceGravityMs2(massEarth: number, radiusEarth: number): number {
  return surfaceGravity(massEarth, radiusEarth) * G_EARTH;
}

/** Bulk density in g/cm³: ρ = ρ⊕ · M / R³. Earth 5.51, TRAPPIST-1e 4.9. */
export function bulkDensity(massEarth: number, radiusEarth: number): number {
  return (RHO_EARTH * massEarth) / Math.max(radiusEarth ** 3, 1e-12);
}

/** Escape velocity in km/s: v = 11.186 · √(M/R) (Earth units). */
export function escapeVelocityKms(massEarth: number, radiusEarth: number): number {
  return V_ESC_EARTH_KMS * Math.sqrt(Math.max(massEarth, 0) / Math.max(radiusEarth, 1e-12));
}

/* ── Atmospheric retention ──────────────────────────────────────────── */

/** Mean molecular speed v̄ = √(8kT / πm) in km/s (Maxwell–Boltzmann). */
export function meanThermalSpeedKms(temperatureK: number, molecularMassGmol: number): number {
  const m = molecularMassGmol * AMU;
  return Math.sqrt((8 * K_B * Math.max(temperatureK, 0)) / (Math.PI * m)) / 1000;
}

export type Retention = "retained" | "marginal" | "lost";

/**
 * Thermal (Jeans) retention rule of thumb: a gas is held for billions of
 * years if its mean speed is at most 1/6 of escape velocity, lost quickly
 * above 1/5 (≈0.2·v_esc), marginal between (Seager 2010 §4; the 6× rule as
 * taught in Strobel, astronomynotes.com "Planetary Atmospheres"). Use the
 * exobase temperature where known: real exospheres run hotter than the
 * surface (Earth ~1000 K), and non-thermal loss strips more than this.
 */
export function retention(escapeKms: number, temperatureK: number, molecularMassGmol: number): { ratio: number; verdict: Retention } {
  const ratio = meanThermalSpeedKms(temperatureK, molecularMassGmol) / Math.max(escapeKms, 1e-9);
  const verdict: Retention = ratio <= 1 / 6 ? "retained" : ratio <= 0.2 ? "marginal" : "lost";
  return { ratio, verdict };
}

/* ── Dynamical stability ────────────────────────────────────────────── */

/**
 * Holman & Wiegert 1999 (AJ 117:621, astro-ph/9809315) critical semimajor
 * axes, in units of the binary separation, for mass ratio μ = m₂/(m₁+m₂)
 * and binary eccentricity e.
 *   S-type (eq. 1, planet orbiting one star; stable INSIDE a_c):
 *     a_c = 0.464 − 0.380μ − 0.631e + 0.586μe + 0.150e² − 0.198μe²
 *   P-type (eq. 3, circumbinary; stable OUTSIDE a_c):
 *     a_c = 1.60 + 5.10e − 2.22e² + 4.12μ − 4.27eμ − 5.09μ² + 4.61e²μ²
 * μ = 0.5, e = 0 → S 0.274, P 2.39.
 */
export function holmanWiegertSType(mu: number, e: number): number {
  return 0.464 - 0.38 * mu - 0.631 * e + 0.586 * mu * e + 0.15 * e * e - 0.198 * mu * e * e;
}
export function holmanWiegertPType(mu: number, e: number): number {
  return 1.6 + 5.1 * e - 2.22 * e * e + 4.12 * mu - 4.27 * e * mu - 5.09 * mu * mu + 4.61 * e * e * mu * mu;
}

/* ── Tidal locking ──────────────────────────────────────────────────── */

/**
 * Time to despin into synchronous rotation (Gladman et al. 1996, Icarus
 * 122:166, eq. 9; Peale 1977):
 *   t_lock = ω a⁶ I Q / (3 G M★² k₂ R⁵),   I = α m R²,
 *   k₂ = 1.5 / (1 + 19μ_r / (2 ρ g R))
 * Defaults: initial spin 12 h, Q = 100, rigidity μ_r = 3×10¹⁰ N/m² (rock),
 * α = 0.4 (the values behind Gladman's t ≈ 6 a⁶Rμ/(m M²) × 10¹⁰ yr form).
 * Earth around the Sun: ~10¹¹ yr (not locked). Proxima b: ~10⁴–10⁵ yr.
 * Returns years.
 */
export function tidalLockTimescaleYears(opts: {
  aAU: number;
  starMassMsun: number;
  planetMassEarth: number;
  planetRadiusEarth: number;
  initialSpinHours?: number;
  Q?: number;
  rigidity?: number;
  alpha?: number;
}): number {
  const a = opts.aAU * AU_M;
  const M = opts.starMassMsun * M_SUN_KG;
  const m = opts.planetMassEarth * M_EARTH_KG;
  const R = opts.planetRadiusEarth * R_EARTH_M;
  const omega = (2 * Math.PI) / ((opts.initialSpinHours ?? 12) * 3600);
  const Q = opts.Q ?? 100;
  const mu = opts.rigidity ?? 3e10;
  const alpha = opts.alpha ?? 0.4;
  const rho = m / ((4 / 3) * Math.PI * R ** 3);
  const g = (G * m) / (R * R);
  const k2 = 1.5 / (1 + (19 * mu) / (2 * rho * g * R));
  const I = alpha * m * R * R;
  const seconds = (omega * a ** 6 * I * Q) / (3 * G * M * M * k2 * R ** 5);
  return seconds / SECONDS_PER_YEAR;
}

/* ── Mass–radius ────────────────────────────────────────────────────── */

/**
 * Chen & Kipping 2017 (ApJ 834:17, arXiv:1603.08614) "Forecaster" mean
 * relation, R = C·M^S piecewise (Earth units), continuous at the breaks:
 *   Terran      M < 2.04 M⊕           S = 0.279, C = 1.008, σ = 0.0403 dex
 *   Neptunian   2.04 – 131.6 M⊕       S = 0.589,            σ = 0.146 dex
 *   Jovian      131.6 M⊕ – 0.08 M☉   S = −0.044,           σ = 0.0737 dex
 * (0.414 M_J = 131.6 M⊕.) The σ values are the paper's intrinsic scatter.
 */
const CK_T_BREAK = 2.04;
const CK_J_BREAK = 131.6;
const CK_C_T = 1.008;
const CK_S_T = 0.279;
const CK_S_N = 0.589;
const CK_S_J = -0.044;
const CK_R_T_BREAK = CK_C_T * CK_T_BREAK ** CK_S_T;
const CK_R_J_BREAK = CK_R_T_BREAK * (CK_J_BREAK / CK_T_BREAK) ** CK_S_N;

export type MassRadiusRegime = "terran" | "neptunian" | "jovian";

export function chenKippingRegime(massEarth: number): MassRadiusRegime {
  return massEarth < CK_T_BREAK ? "terran" : massEarth < CK_J_BREAK ? "neptunian" : "jovian";
}

export const CHEN_KIPPING_SIGMA_DEX: Record<MassRadiusRegime, number> = {
  terran: 0.0403,
  neptunian: 0.146,
  jovian: 0.0737,
};

/** Mean radius (R⊕) for a mass (M⊕). TRAPPIST-1e 0.69 M⊕ → 0.91 R⊕. */
export function radiusFromMass(massEarth: number): number {
  const m = Math.max(massEarth, 1e-6);
  if (m < CK_T_BREAK) return CK_C_T * m ** CK_S_T;
  if (m < CK_J_BREAK) return CK_R_T_BREAK * (m / CK_T_BREAK) ** CK_S_N;
  return CK_R_J_BREAK * (m / CK_J_BREAK) ** CK_S_J;
}

/**
 * Mean mass (M⊕) for a radius (R⊕), inverting the Terran and Neptunian
 * branches. Above the Jovian break radius the relation is flat (all masses
 * from Saturn to brown dwarfs share a radius), so the mass is not
 * recoverable: returns null and the caller must say "estimate unavailable".
 */
export function massFromRadius(radiusEarth: number): number | null {
  const r = Math.max(radiusEarth, 1e-6);
  if (r < CK_R_T_BREAK) return (r / CK_C_T) ** (1 / CK_S_T);
  if (r < CK_R_J_BREAK) return CK_T_BREAK * (r / CK_R_T_BREAK) ** (1 / CK_S_N);
  return null;
}

/**
 * Pure-iron planet radius (Zeng, Sasselov & Jacobsen 2016, ApJ 819:127,
 * eq. 8 with core-mass fraction 1): R = (1.07 − 0.21·CMF) M^(1/3.7). Fit for
 * 1–8 M⊕; used here as a floor: nothing natural is smaller at that mass.
 * Below 1 M⊕ the fit is an extrapolation, so the check allows 5% (Mercury,
 * core fraction ~0.7, sits 3% above it).
 */
export const IRON_FLOOR_TOLERANCE = 0.95;
export function ironPlanetRadius(massEarth: number): number {
  return (1.07 - 0.21) * Math.max(massEarth, 0) ** (1 / 3.7);
}

export type MassRadiusVerdict = "consistent" | "unusual" | "implausible";

/**
 * Compare a mass/radius pair against Chen & Kipping and the iron floor.
 * z = log₁₀(R / R_CK) / σ. |z| ≤ 2 consistent; denser than pure iron or
 * |z| > 5 implausible; otherwise unusual. 1 R⊕ at 50 M⊕ (275 g/cm³) is
 * implausible.
 */
export function massRadiusCheck(massEarth: number, radiusEarth: number): {
  expectedRadius: number;
  ironRadius: number;
  density: number;
  z: number;
  regime: MassRadiusRegime;
  verdict: MassRadiusVerdict;
} {
  const regime = chenKippingRegime(massEarth);
  const expectedRadius = radiusFromMass(massEarth);
  const ironRadius = ironPlanetRadius(massEarth);
  const density = bulkDensity(massEarth, radiusEarth);
  const z = Math.log10(Math.max(radiusEarth, 1e-6) / expectedRadius) / CHEN_KIPPING_SIGMA_DEX[regime];
  let verdict: MassRadiusVerdict = Math.abs(z) <= 2 ? "consistent" : "unusual";
  if (radiusEarth < ironRadius * IRON_FLOOR_TOLERANCE || Math.abs(z) > 5) verdict = "implausible";
  return { expectedRadius, ironRadius, density, z, regime, verdict };
}
