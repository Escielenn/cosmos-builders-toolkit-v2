// ---------------------------------------------------------------------------
// Black-body colour (Brief G2 §1, 14-RENDER-ENGINE §2 Tier 1).
//
// "A K-dwarf is orange, an M-dwarf red, an F white-blue. The writer sees their
// star's CLASS before reading it."
//
// This is the single highest-leverage effect in the catalogue: it turns a
// number the writer chose into something they recognise without reading a
// label. Which is the Prime Law, rendered.
//
// Pure. No three.js import, so the colour science is testable without a GPU.
// ---------------------------------------------------------------------------

import type { RGB } from "../engine/theme-uniforms";

/**
 * Kelvin → linear RGB, Tanner Helland's piecewise fit to the Planckian locus,
 * converted to linear space.
 *
 * Accurate enough between roughly 1000K and 40000K, which covers every
 * spectral class a writer can pick. Outside that it clamps rather than
 * extrapolating into imaginary colours.
 */
export function kelvinToRGB(kelvin: number): RGB {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;

  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * (t - 60) ** -0.1332047592;
    g = 288.1221695283 * (t - 60) ** -0.0755148492;
    b = 255;
  }

  const to01 = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  // sRGB → linear, matching the renderer's working space.
  const lin = (v: number) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

  return { r: lin(to01(r)), g: lin(to01(g)), b: lin(to01(b)) };
}

/**
 * Effective temperature by spectral class, for RENDERING ONLY.
 *
 * These are midpoints of the standard main-sequence ranges. They exist so a
 * star that carries a class but no measured temperature still renders as the
 * right colour instead of grey.
 *
 * IMPORTANT: this never becomes a fact. bind/ produces uniforms, not canon —
 * a temperature nobody computed must not be written back as though someone
 * had. See bind/star.ts.
 */
export const SPECTRAL_CLASS_KELVIN: Record<string, number> = {
  O: 35000,
  B: 18000,
  A: 8500,
  F: 6600,
  G: 5700,
  K: 4400,
  M: 3200,
  L: 1900,
  T: 1200,
};

/** The leading letter of a spectral class string ("K4V" → 4400). */
export function spectralClassKelvin(spectralClass: string | null | undefined): number | null {
  if (!spectralClass) return null;
  const letter = spectralClass.trim().charAt(0).toUpperCase();
  return SPECTRAL_CLASS_KELVIN[letter] ?? null;
}

/**
 * Limb darkening coefficient.
 *
 * 14 §2: "the proof clips to white — fix that." A star rendered as a flat disc
 * blows out to white under bloom and every class looks identical, which
 * destroys the one effect that was carrying meaning. Darkening the limb keeps
 * saturated colour at the edge so the class survives the post stack.
 *
 * Cooler stars darken more steeply, which is both true and useful: an M-dwarf
 * reads as unmistakably red.
 */
export function limbDarkening(kelvin: number): number {
  const t = Math.min(40000, Math.max(1000, kelvin));
  // 0.9 at the coolest, 0.45 at the hottest.
  const scaled = (t - 1000) / (40000 - 1000);
  return 0.9 - 0.45 * scaled;
}

/**
 * Corona noise amplitude from flare activity, 0..1.
 *
 * §2: "a flare star *looks* dangerous." Absent activity is calm, not average —
 * an unmeasured star must not render as though someone had measured it and
 * found it violent.
 */
export function coronaAmplitude(flareActivity: number | null | undefined): number {
  if (typeof flareActivity !== "number" || !Number.isFinite(flareActivity)) {
    return 0.15;
  }
  return Math.min(1, Math.max(0, flareActivity));
}
