/**
 * Kopparapu et al. (2013), ApJ 765:131 — habitable-zone boundaries from the
 * stellar effective-flux polynomial. Four boundaries:
 *   Recent Venus (optimistic inner) · Runaway Greenhouse (conservative inner)
 *   Maximum Greenhouse (conservative outer) · Early Mars (optimistic outer)
 *
 *   S_eff = S_eff☉ + aΔT + bΔT² + cΔT³ + dΔT⁴,   ΔT = Teff − 5780 K
 *   d(AU)  = sqrt( L / S_eff )
 *
 * Valid for Teff ∈ [2600, 7200] K; hotter stars are clamped to 7200 K (the
 * polynomial's upper bound — flagged, since B/A stars sit above it).
 */

type Coeff = readonly [number, number, number, number, number]; // [S0, a, b, c, d]

const RECENT_VENUS: Coeff = [1.7763, 1.4335e-4, 3.3954e-9, -7.6364e-12, -1.1950e-15];
const RUNAWAY_GREENHOUSE: Coeff = [1.0385, 1.2456e-4, 1.4612e-8, -7.6345e-12, -1.7511e-15];
const MAX_GREENHOUSE: Coeff = [0.3507, 5.9578e-5, 1.6707e-9, -3.0058e-12, -5.1925e-16];
const EARLY_MARS: Coeff = [0.3207, 5.4471e-5, 1.5275e-9, -2.1709e-12, -3.8282e-16];

function seff(teffK: number, c: Coeff): number {
  const t = teffK - 5780;
  return c[0] + c[1] * t + c[2] * t * t + c[3] * t ** 3 + c[4] * t ** 4;
}

export interface HZBoundaries {
  recentVenusAU: number;
  runawayGreenhouseAU: number;
  maxGreenhouseAU: number;
  earlyMarsAU: number;
}

/** All four Kopparapu boundaries (AU) for a star of effective temperature Teff and luminosity L☉. */
export function hzBoundaries(teffK: number, lumSOL: number): HZBoundaries {
  const T = Math.max(2600, Math.min(7200, teffK));
  const dist = (c: Coeff) => Math.sqrt(lumSOL / seff(T, c));
  return {
    recentVenusAU: dist(RECENT_VENUS),
    runawayGreenhouseAU: dist(RUNAWAY_GREENHOUSE),
    maxGreenhouseAU: dist(MAX_GREENHOUSE),
    earlyMarsAU: dist(EARLY_MARS),
  };
}

/** Conservative HZ [inner, outer] = [Runaway Greenhouse, Maximum Greenhouse]. */
export function conservativeHZ(teffK: number, lumSOL: number): [number, number] {
  const b = hzBoundaries(teffK, lumSOL);
  return [b.runawayGreenhouseAU, b.maxGreenhouseAU];
}

/**
 * Combined HZ for a multi-star system. For a circumbinary (P-type) planet the
 * stars are close relative to the HZ distance, so incident flux ≈ Σ L_i/d²:
 * use total luminosity with a luminosity-weighted effective temperature.
 * (A simplification of the true multi-star flux integral — flagged.)
 */
export function combinedHZ(stars: { temperatureK: number; luminositySOL: number }[]): [number, number] {
  const Ltot = stars.reduce((s, st) => s + st.luminositySOL, 0);
  if (Ltot <= 0) return conservativeHZ(5780, 1);
  const teffEff = stars.reduce((s, st) => s + st.luminositySOL * st.temperatureK, 0) / Ltot;
  return conservativeHZ(teffEff, Ltot);
}
