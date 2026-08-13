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
const STAR_FLOOR = 0.15; // absolute smallest, only reached by very tight systems

export function auToScene(au: number): number {
  return au * AU_TO_SCENE;
}

/** Scene units back to AU. Needed to turn a drag position into an orbit. */
export function sceneToAU(units: number): number {
  return units / AU_TO_SCENE;
}

export function radiusToScene(radiusEarth: number): number {
  const r = 0.35 + 0.75 * Math.cbrt(Math.max(0, radiusEarth));
  return Math.min(PLANET_MAX, Math.max(0.22, r));
}

/**
 * The star's rendered radius, optionally capped so it cannot swallow its own
 * innermost planet.
 *
 * Stars are drawn far larger than scale on purpose: 1 R☉ is 0.00465 AU, which at
 * AU_TO_SCENE would be 0.03 scene units and invisible. STAR_MIN of 2.2 units is
 * the equivalent of 0.31 AU, roughly 68x oversized.
 *
 * That exaggeration is what made the innermost planet overlap the star. The
 * inner band begins at 0.35 x hzInner, so a Sun-like star (hzInner ~0.98 AU)
 * puts its first planet at ~0.34 AU, a hair outside a disc that already reaches
 * 0.31 AU. Around a red dwarf (hzInner ~0.2 AU) the first planet sits at
 * ~0.07 AU, entirely inside the rendered star.
 *
 * The orbits are physically fine, so the fix belongs here rather than in the
 * generator: pass the innermost approach and the star shrinks to leave room.
 */
export function starRadiusToScene(radiusSOL: number, maxRadius?: number): number {
  const r = Math.max(STAR_MIN, STAR_MIN * Math.sqrt(Math.max(0, radiusSOL)));
  if (maxRadius === undefined || !Number.isFinite(maxRadius)) return r;
  // The cap wins over the floor. A generous floor would defeat the whole point
  // on the tightest systems: a 0.07 AU orbit is only 0.49 scene units out, so a
  // 0.5-unit "minimum" star would still swallow it. STAR_FLOOR is small enough
  // to stay under any orbit the generator produces while remaining visible.
  return Math.max(STAR_FLOOR, Math.min(r, maxRadius));
}

/**
 * The largest a star may render given its closest planetary approach.
 *
 * Half the gap leaves the planet clearly outside the disc while keeping the star
 * the visual anchor. Corona rings sit at 1.5x this, so they stay inside the
 * orbit too.
 */
export function starRadiusCapForApproach(closestApproachAU: number): number {
  return auToScene(closestApproachAU) * 0.5;
}
