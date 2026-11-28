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

// ---------------------------------------------------------------------------
// HDR star core that keeps its colour under bloom (Brief G2 §1).
//
// A photosphere has to be brighter than anything else in the frame (it is
// what blooms), but naive HDR — kelvinToRGB × 4 — clips every channel past
// the tone curve's shoulder and every class turns the same white. That is
// the proof file's failure, which 14 §2 says to fix.
//
// So the gain goes through a hue-preserving soft clip: scale the colour by
// a factor chosen on its brightest channel only, m' = M·(1 − e^(−m/M)).
// Channel RATIOS are untouched, so an M-dwarf core stays red at any gain;
// the brightest channel approaches M and never passes it. M = 1.6 sits
// above the bloom threshold (1.0, post.ts) so the star glows, and below
// the point where AgX's path-to-white has eaten the hue (AgX keeps
// saturation up to roughly 2–3× diffuse white; Sobotka 2023).
// The GLSL in StarMaterial mirrors this function line for line.
// ---------------------------------------------------------------------------

/** Ceiling of the brightest channel of a star core, linear HDR. */
export const STAR_CORE_MAX = 1.6;

export function starCoreRadiance(colour: RGB, gain: number): RGB {
  const g = Math.max(0, Number.isFinite(gain) ? gain : 0);
  const r = colour.r * g;
  const gg = colour.g * g;
  const b = colour.b * g;
  const m = Math.max(r, gg, b);
  if (m <= 0) return { r: 0, g: 0, b: 0 };
  const k = (STAR_CORE_MAX * (1 - Math.exp(-m / STAR_CORE_MAX))) / m;
  return { r: r * k, g: gg * k, b: b * k };
}

/** kelvinToRGB rescaled so its brightest channel is 1: hue without brightness. */
export function blackbodyHue(kelvin: number): RGB {
  const c = kelvinToRGB(kelvin);
  const m = Math.max(c.r, c.g, c.b, 1e-9);
  return { r: c.r / m, g: c.g / m, b: c.b / m };
}

/**
 * The star's light as an adapted observer sees it: von Kries chromatic
 * adaptation of degree D toward the illuminant,
 *   c' = c / (D·c + 1 − D),  then renormalised (max channel 1).
 *
 * A camera white-balanced for the Sun would show an M-dwarf world as uniform
 * orange, and ice, ocean and rock would stop being distinguishable, which is
 * not what anyone standing there would see: the eye adapts most of the way
 * to its illuminant. D = 0.8 is CIECAM02's degree of adaptation for an
 * average surround under a bright adapting field (CIE 159:2004; Fairchild,
 * "Color Appearance Models", 3rd ed., §9). The residual tint is the star's
 * class, still visible: warm under K and M, cool under F and A.
 *
 * Used for REFLECTED and SCATTERED light. The photosphere itself keeps its
 * true black-body colour.
 */
export const CHROMATIC_ADAPTATION_D = 0.8;

export function adaptedLight(hue: RGB, d: number = CHROMATIC_ADAPTATION_D): RGB {
  const k = Math.min(1, Math.max(0, d));
  const f = (c: number) => c / (k * c + 1 - k);
  const r = f(hue.r);
  const g = f(hue.g);
  const b = f(hue.b);
  const m = Math.max(r, g, b, 1e-9);
  return { r: r / m, g: g / m, b: b / m };
}
