// ---------------------------------------------------------------------------
// Surface (Brief G2 §3).
//
// "MeshStandard with albedo from planet.albedo and a procedural noise map
// keyed by surface_type. Tidally-locked bodies do not rotate."
//
// The last clause is the one that carries meaning. A tidally locked world has
// a FIXED terminator — 14 §2 calls it "the band where everything lives,
// visible as geography". Rotating one would erase the single most
// story-bearing fact Tidelock computes.
// ---------------------------------------------------------------------------

import type { RGB } from "../engine/theme-uniforms";

export interface SurfaceUniforms {
  /** Base albedo colour in linear RGB. */
  colour: RGB;
  /** 0..1, drives how much light the standard material returns. */
  albedo: number;
  roughness: number;
  /** Procedural noise scale — large for continents, small for regolith. */
  noiseScale: number;
  /** How much the noise perturbs the base colour. */
  noiseStrength: number;
  /** Rotations per in-scene day. Exactly 0 for a locked body. */
  spin: number;
  label: string;
}

interface SurfaceProfile {
  match: RegExp;
  colour: RGB;
  roughness: number;
  noiseScale: number;
  noiseStrength: number;
  label: string;
}

const PROFILES: SurfaceProfile[] = [
  {
    match: /ocean|water|aquatic|pelagic/i,
    colour: { r: 0.03, g: 0.10, b: 0.28 },
    roughness: 0.25,
    noiseScale: 2.2,
    noiseStrength: 0.35,
    label: "ocean",
  },
  {
    match: /ice|glacial|frozen|snowball/i,
    colour: { r: 0.62, g: 0.70, b: 0.78 },
    roughness: 0.35,
    noiseScale: 3.4,
    noiseStrength: 0.22,
    label: "ice",
  },
  {
    match: /desert|arid|sand|dune/i,
    colour: { r: 0.48, g: 0.33, b: 0.16 },
    roughness: 0.85,
    noiseScale: 4.0,
    noiseStrength: 0.30,
    label: "desert",
  },
  {
    match: /volcan|lava|molten|magma/i,
    colour: { r: 0.18, g: 0.06, b: 0.04 },
    roughness: 0.65,
    noiseScale: 5.5,
    noiseStrength: 0.55,
    label: "volcanic",
  },
  {
    match: /forest|jungle|verdant|biotic|vegetat/i,
    colour: { r: 0.09, g: 0.22, b: 0.09 },
    roughness: 0.75,
    noiseScale: 3.0,
    noiseStrength: 0.40,
    label: "vegetated",
  },
  {
    match: /rock|barren|regolith|crater|airless|terrestrial/i,
    colour: { r: 0.24, g: 0.22, b: 0.20 },
    roughness: 0.95,
    noiseScale: 6.0,
    noiseStrength: 0.28,
    label: "rock",
  },
  {
    match: /gas|jovian|giant/i,
    colour: { r: 0.52, g: 0.42, b: 0.30 },
    roughness: 0.5,
    // Banded, not blotchy: stretched noise reads as zonal flow.
    noiseScale: 1.4,
    noiseStrength: 0.45,
    label: "gas giant",
  },
];

/** Neutral grey. Visibly unremarkable, which is the honest look for unknown. */
const UNKNOWN: SurfaceProfile = {
  match: /(?:)/,
  colour: { r: 0.28, g: 0.28, b: 0.30 },
  roughness: 0.8,
  noiseScale: 4.0,
  noiseStrength: 0.2,
  label: "unspecified",
};

export function surfaceUniforms(
  surfaceType: string | null | undefined,
  albedo: number | null | undefined,
  tidallyLocked: boolean,
): SurfaceUniforms {
  const text = (surfaceType ?? "").trim();
  const profile = (text && PROFILES.find((p) => p.match.test(text))) || UNKNOWN;

  // Albedo is a reflectance, so it is 0..1 by definition. A value outside that
  // is bad data, not a brighter planet.
  const a =
    typeof albedo === "number" && Number.isFinite(albedo)
      ? Math.min(1, Math.max(0, albedo))
      : 0.3;

  return {
    colour: profile.colour,
    albedo: a,
    roughness: profile.roughness,
    noiseScale: profile.noiseScale,
    noiseStrength: profile.noiseStrength,
    // A locked world does not turn. Its terminator is geography.
    spin: tidallyLocked ? 0 : 1,
    label: profile.label,
  };
}
