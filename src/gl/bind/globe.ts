// ---------------------------------------------------------------------------
// bind/globe — a body's canon, as the uniforms of a sheet-on-sphere globe.
//
// F5 (owner, 2026-09-07): "the sheet is a texture, never a second set of
// sliders. Tilt, spin, lock, atmosphere and star colour still come from
// canon." This is where that sentence is enforced. The globe scene receives a
// GlobeBinding and nothing else; it cannot know where a number came from, so
// it cannot let a picture assert one.
//
// Inputs here are already-resolved plain values (the Surface Cartographer
// resolves them, with provenance, in src/lib/surface-cartographer/body.ts).
// Every inference travels with `derived: true` and a reason, as in bind/index.
// ---------------------------------------------------------------------------

import { atmosphereUniforms, type AtmosphereUniforms } from "../materials/atmosphere";
import { kelvinToRGB, spectralClassKelvin } from "../materials/blackbody";
import type { RGB } from "../engine/theme-uniforms";
import type { Provenanced } from "./index";

export interface GlobeFacts {
  tiltDeg: number | null;
  tidallyLocked: boolean | null;
  /** Hours per rotation. Only sets which way and how slowly the globe turns. */
  dayLengthHours: number | null;
  atmoPressureBar: number | null;
  atmoComposition: string | null;
  starClass: string | null;
  substellarLon: number;
}

export interface GlobeBinding {
  /** Axial tilt, radians, about the view's z axis. */
  tilt: Provenanced<number>;
  /** True: the globe never turns, and the star stands over substellarLon. */
  locked: Provenanced<boolean>;
  /** Radians per second of display time. 0 when locked. Negative = retrograde. */
  spinRate: number;
  atmosphere: AtmosphereUniforms;
  /** Linear RGB tint of the light, from the star's black-body colour. */
  starColour: RGB;
  starColourDerived: boolean;
  substellarLon: number;
}

const NEUTRAL_K = 5700;
/** One display revolution per ~90 s: slow enough to read, never a spinner. */
const DISPLAY_SPIN = (2 * Math.PI) / 90;

export function bindGlobe(f: GlobeFacts): GlobeBinding {
  const tiltDeg = f.tiltDeg;
  const tilt: Provenanced<number> =
    tiltDeg === null || !Number.isFinite(tiltDeg)
      ? { value: 0, derived: true, note: "No axial tilt on file; drawn upright." }
      : { value: (tiltDeg * Math.PI) / 180, derived: false };

  const locked: Provenanced<boolean> =
    f.tidallyLocked === null
      ? { value: false, derived: true, note: "Nothing on file says this body is locked; drawn turning." }
      : { value: f.tidallyLocked, derived: false };

  // A retrograde rotator (tilt past 90°) turns the other way — already
  // encoded by the tilt itself; the spin sign stays positive. A negative day
  // length is the other common convention for retrograde, and is honoured.
  const dir = f.dayLengthHours !== null && f.dayLengthHours < 0 ? -1 : 1;

  const k = spectralClassKelvin(f.starClass);
  return {
    tilt,
    locked,
    spinRate: locked.value ? 0 : dir * DISPLAY_SPIN,
    atmosphere: atmosphereUniforms(f.atmoComposition, f.atmoPressureBar),
    starColour: kelvinToRGB(k ?? NEUTRAL_K),
    starColourDerived: k === null,
    substellarLon: f.substellarLon,
  };
}

/**
 * Unit vector for a coordinate, in the globe mesh's own frame.
 *
 * Matches three.js SphereGeometry's UV layout, so an equirectangular texture
 * and a pin agree: u = (lon + 180) / 360 puts lon 0 on +X and lon +90 on −Z.
 */
export function globeDirection(latDeg: number, lonDeg: number): [number, number, number] {
  const phi = (latDeg * Math.PI) / 180;
  const lam = (lonDeg * Math.PI) / 180;
  return [Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam)];
}

/**
 * Rotation about the globe's own axis that brings `lonDeg` to face the +X
 * world direction (where the star sits). For a locked world this is the
 * whole pose: it never changes.
 */
export function yawToFace(lonDeg: number): number {
  // Rotating (cos λ, 0, −sin λ) by θ about +Y gives x' = cos(λ + θ); x' = 1
  // when θ = −λ.
  return -(lonDeg * Math.PI) / 180;
}
