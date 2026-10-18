/**
 * Kopparapu habitable-zone boundaries for the Solaris engine. Four
 * boundaries: Recent Venus (optimistic inner) · Runaway Greenhouse
 * (conservative inner) · Maximum Greenhouse (conservative outer) · Early
 * Mars (optimistic outer).
 *
 *   S_eff = S_eff☉ + aΔT + bΔT² + cΔT³ + dΔT⁴,   ΔT = Teff − 5780 K
 *   d(AU)  = sqrt( L / S_eff )
 *
 * The coefficients live in one place, `@/lib/habitable-zone/kopparapu`
 * (Kopparapu et al. 2014, 1 M⊕), so Solaris, the Habitable Zone calculator
 * and the standalone sim agree on every edge. Valid for Teff ∈ [2600, 7200] K;
 * outside that range Teff is clamped (B/A stars sit above it).
 */

import { kopparapuEdges } from "@/lib/habitable-zone/kopparapu";

export interface HZBoundaries {
  recentVenusAU: number;
  runawayGreenhouseAU: number;
  maxGreenhouseAU: number;
  earlyMarsAU: number;
}

/** All four Kopparapu boundaries (AU) for a star of effective temperature Teff and luminosity L☉. */
export function hzBoundaries(teffK: number, lumSOL: number): HZBoundaries {
  const e = kopparapuEdges(teffK, lumSOL);
  return {
    recentVenusAU: e.recentVenus,
    runawayGreenhouseAU: e.runawayGreenhouse,
    maxGreenhouseAU: e.maxGreenhouse,
    earlyMarsAU: e.earlyMars,
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
