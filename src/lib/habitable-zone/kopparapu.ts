/**
 * Habitable-zone boundaries from the stellar effective-flux polynomial of
 * Kopparapu et al. (2013, ApJ 765:131; erratum ApJ 770:82) as updated for a
 * 1 Earth-mass planet by Kopparapu et al. (2014, ApJ 787:L29, Table 1).
 *
 *   S_eff = S_eff☉ + a·T + b·T² + c·T³ + d·T⁴,   T = Teff − 5780 K
 *   d(AU) = √( L / S_eff )                        (L in L☉)
 *
 * Valid for 2600 K ≤ Teff ≤ 7200 K. Outside that range Teff is clamped to
 * the nearest bound and `teffClamped` is set so the UI can say so.
 *
 * This is the single source for HZ edges. The Habitable Zone calculator,
 * the Star System builder, the Solaris engine and the standalone Solaris sim
 * (public/tools/solaris/sim.html, which carries a copy of the same table)
 * all use these coefficients.
 */

export type KopparapuCoeff = readonly [number, number, number, number, number]; // [S☉, a, b, c, d]

/** Kopparapu et al. 2014, Table 1, 1 M⊕ column. */
export const KOPPARAPU_2014 = {
  recentVenus: [1.776, 2.136e-4, 2.533e-8, -1.332e-11, -3.097e-15],
  runawayGreenhouse: [1.107, 1.332e-4, 1.58e-8, -8.308e-12, -1.931e-15],
  maxGreenhouse: [0.356, 6.171e-5, 1.698e-9, -3.198e-12, -5.575e-16],
  earlyMars: [0.32, 5.547e-5, 1.526e-9, -2.874e-12, -5.011e-16],
} as const satisfies Record<string, KopparapuCoeff>;

export type KopparapuLimit = keyof typeof KOPPARAPU_2014;

export const KOPPARAPU_T_MIN = 2600;
export const KOPPARAPU_T_MAX = 7200;
export const KOPPARAPU_T_SUN = 5780;

export function clampTeff(teffK: number): { teff: number; clamped: boolean } {
  if (!Number.isFinite(teffK)) return { teff: KOPPARAPU_T_SUN, clamped: true };
  const teff = Math.max(KOPPARAPU_T_MIN, Math.min(KOPPARAPU_T_MAX, teffK));
  return { teff, clamped: teff !== teffK };
}

/** Effective flux S_eff (in units of Earth's insolation) at one HZ limit. */
export function seff(teffK: number, limit: KopparapuLimit): number {
  const [s0, a, b, c, d] = KOPPARAPU_2014[limit];
  const t = clampTeff(teffK).teff - KOPPARAPU_T_SUN;
  return s0 + a * t + b * t * t + c * t ** 3 + d * t ** 4;
}

export interface KopparapuEdges {
  recentVenus: number; // AU, optimistic inner
  runawayGreenhouse: number; // AU, conservative inner
  maxGreenhouse: number; // AU, conservative outer
  earlyMars: number; // AU, optimistic outer
  teffClamped: boolean;
}

/** All four HZ edges (AU) for a star of effective temperature Teff and luminosity L (L☉). */
export function kopparapuEdges(teffK: number, luminositySOL: number): KopparapuEdges {
  const L = Math.max(luminositySOL, 1e-10);
  const { clamped } = clampTeff(teffK);
  const dist = (limit: KopparapuLimit) => Math.sqrt(L / seff(teffK, limit));
  return {
    recentVenus: dist("recentVenus"),
    runawayGreenhouse: dist("runawayGreenhouse"),
    maxGreenhouse: dist("maxGreenhouse"),
    earlyMars: dist("earlyMars"),
    teffClamped: clamped,
  };
}
