/**
 * Scene-unit scaling for the orrery.
 *
 * auToScene MUST stay linear: planet positions are computed in AU then run
 * through auToScene, and the orbital-path ellipse is auToScene(semiMajorAxis).
 * A non-linear map would put planets off their drawn orbits. Compress the
 * *visual* spread by tuning AU_TO_SCENE, not by bending the curve.
 *
 * Body radii use sub-linear (cube-root) compression so a gas giant reads as
 * the largest planet without dwarfing the system — and never exceeds the star.
 */

const AU_TO_SCENE = 7;

// Star is always the visual anchor; planets are capped below this.
const STAR_MIN = 2.2;
const PLANET_MAX = 1.7; // < STAR_MIN, so no planet can outsize its star

export function auToScene(au: number): number {
  return au * AU_TO_SCENE;
}

export function radiusToScene(radiusEarth: number): number {
  const r = 0.35 + 0.75 * Math.cbrt(Math.max(0, radiusEarth));
  return Math.min(PLANET_MAX, Math.max(0.22, r));
}

export function starRadiusToScene(radiusSOL: number): number {
  return Math.max(STAR_MIN, STAR_MIN * Math.sqrt(Math.max(0, radiusSOL)));
}
