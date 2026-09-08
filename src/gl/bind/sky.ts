// ---------------------------------------------------------------------------
// The sky from somewhere else (G5).
//
// This is what anchoring was for. A system anchored to Tau Ceti is not just a
// dot at Tau Ceti's coordinates — it is a place with a night sky, and that sky
// is computable: translate every catalogue star by the observer's heliocentric
// position and re-project. Constellations deform because the geometry actually
// changed, not because anything was invented. Sol becomes a star in it.
//
// Nothing here is a new number. `starFromObserver`, `applyPrecession` and
// `angularSeparation` are in lib/simulators/astro.ts, already tested, and the
// precession sign is already validated against Thuban's and Vega's real
// pole-star epochs. This file binds them to the writer's entities.
//
// bind/ produces UNIFORMS, never FACTS. A sky is derived on read; none of it
// is written back as canon.
// ---------------------------------------------------------------------------

import {
  angularSeparation,
  applyPrecession,
  raDecDistToXYZ,
  starFromObserver,
  xyzToRaDec,
  type Vec3,
} from "@/lib/simulators/astro";
import type { RGB } from "../engine/theme-uniforms";
import type { CatalogStar, WorldSystem } from "./starfield";

const PC_TO_LY = 3.26156;

/** The naked-eye limit. Below this a star is there and nobody can see it. */
export const NAKED_EYE_MAG = 6.5;

export interface SkyStar {
  name: string;
  /** Right ascension and declination AS SEEN FROM THE OBSERVER, degrees. */
  ra: number;
  dec: number;
  /** Unit direction, equatorial cartesian. What a renderer puts on the dome. */
  direction: Vec3;
  /** Distance from the observer, light years — not from Sol. */
  distanceLy: number;
  /** Apparent magnitude from here. Lower is brighter. */
  appMag: number;
  colour: RGB;
}

export interface SkyView {
  /** The system this sky is seen from. */
  observerId: string;
  observerName: string;
  /** The catalogue star the system is anchored to — the local sun. */
  sun: CatalogStar;
  /**
   * Years from J2000. The epoch the sky is drawn at; 0 is the present.
   * Null means no epoch was chosen, which is drawn the same as 0 but must
   * never be reported as a choice the writer made.
   */
  epoch: number | null;
  /** Stars a naked eye could see from there, brightest first. */
  stars: SkyStar[];
  /** How many of the catalogue are visible from here, and out of how many. */
  visibleCount: number;
  catalogueCount: number;
  /** The brightest thing in this sky, which is rarely the same as from Earth. */
  brightest: SkyStar | null;
  /** The catalogue star nearest the celestial pole at this epoch, if any. */
  poleStar: { star: SkyStar; degreesFromPole: number } | null;
}

/**
 * Build the sky seen from an anchored system.
 *
 * The anchor star itself is EXCLUDED: from a world orbiting Tau Ceti, Tau Ceti
 * is the sun, not a point of light in the night. Including it would put a
 * magnitude −26 object in the star list and drown every real answer.
 */
export function buildSky(
  catalog: CatalogStar[],
  system: WorldSystem,
  epoch: number | null = null,
): SkyView | null {
  if (!system.anchor || !system.position) return null;

  const observer = system.position;
  const years = epoch ?? 0;
  const stars: SkyStar[] = [];

  for (const star of catalog) {
    // The local sun is not a star in its own night sky.
    if (star.name === system.anchor.name) continue;

    const seen = starFromObserver(
      {
        ra: star.raDeg,
        dec: star.decDeg,
        distPc: star.distancePc,
        absMag: star.absMag,
      },
      observer,
    );
    if (!Number.isFinite(seen.appMag) || seen.appMag > NAKED_EYE_MAG) continue;

    stars.push(toSkyStar(star.name, seen, star.colour, years));
  }

  // Sol is a star from anywhere but here. Its absolute magnitude is 4.83 and
  // it sits at the origin, so it falls out of the same maths — but it is only
  // in the shipped catalogue as a convenience row at distance 0.001 pc, which
  // would divide by nothing. Handle it explicitly instead.
  const sol = solFromObserver(observer, years);
  if (sol && sol.appMag <= NAKED_EYE_MAG) stars.push(sol);

  stars.sort((a, b) => a.appMag - b.appMag);

  return {
    observerId: system.id,
    observerName: system.name,
    sun: system.anchor,
    epoch,
    stars,
    visibleCount: stars.length,
    catalogueCount: catalog.length,
    brightest: stars[0] ?? null,
    poleStar: nearestToPole(stars),
  };
}

function toSkyStar(
  name: string,
  seen: { ra: number; dec: number; dist: number; appMag: number },
  colour: RGB,
  years: number,
): SkyStar {
  // Precession rotates the equatorial FRAME, so it is applied to the direction
  // after the geometry, never to the distance. A star does not move closer
  // because a pole wandered.
  const [x, y, z] = raDecDistToXYZ(seen.ra, seen.dec, 1);
  const [px, py, pz] = years ? applyPrecession(x, y, z, years) : [x, y, z];
  const precessed = xyzToRaDec(px, py, pz);

  return {
    name,
    ra: precessed.ra,
    dec: precessed.dec,
    direction: [px, py, pz],
    distanceLy: seen.dist * PC_TO_LY,
    appMag: seen.appMag,
    colour,
  };
}

/** Sol seen from an observer's position. Absolute magnitude 4.83, B−V 0.65. */
function solFromObserver(observer: Vec3, years: number): SkyStar | null {
  const distPc = Math.hypot(observer[0], observer[1], observer[2]);
  if (!Number.isFinite(distPc) || distPc <= 0) return null;
  // Looking back at the Sun means looking opposite the observer's position.
  const back = xyzToRaDec(-observer[0], -observer[1], -observer[2]);
  const appMag = 4.83 + 5 * Math.log10(distPc / 10);
  return toSkyStar(
    "Sol",
    { ra: back.ra, dec: back.dec, dist: distPc, appMag },
    // The Sun's own black-body colour, from its own B−V — a G2V white.
    { r: 1, g: 0.968, b: 0.925 },
    years,
  );
}

/**
 * Which star sits closest to the celestial pole at this epoch.
 *
 * This is what precession is FOR in a writer's hands. It is why Polaris is the
 * pole star now and Thuban was one when the pyramids were built, and it is a
 * fact about a culture's navigation, calendar and myth — not decoration.
 */
export function nearestToPole(
  stars: SkyStar[],
): { star: SkyStar; degreesFromPole: number } | null {
  let best: { star: SkyStar; degreesFromPole: number } | null = null;
  for (const star of stars) {
    const d = angularSeparation({ ra: star.ra, dec: star.dec }, { ra: star.ra, dec: 90 });
    if (!best || d < best.degreesFromPole) best = { star, degreesFromPole: d };
  }
  return best;
}

/**
 * How far a star has drifted from the pole between two epochs, in degrees.
 *
 * The number behind "the founding compass has precessed 14° since the myth was
 * recorded" — derived from the writer's own epochs, not asserted.
 */
export function poleDriftDegrees(
  star: { ra: number; dec: number },
  fromEpoch: number,
  toEpoch: number,
): number {
  const at = (years: number) => {
    const [x, y, z] = raDecDistToXYZ(star.ra, star.dec, 1);
    const [px, py, pz] = applyPrecession(x, y, z, years);
    const p = xyzToRaDec(px, py, pz);
    return angularSeparation({ ra: p.ra, dec: p.dec }, { ra: p.ra, dec: 90 });
  };
  return Math.abs(at(toEpoch) - at(fromEpoch));
}

/**
 * The angular separation between two named stars in THIS sky.
 *
 * The reason constellations deform: from 12 light years away, two stars that
 * look adjacent from Earth may be nowhere near each other.
 */
export function separationInSky(
  sky: SkyView,
  a: string,
  b: string,
): number | null {
  const first = sky.stars.find((s) => s.name === a);
  const second = sky.stars.find((s) => s.name === b);
  if (!first || !second) return null;
  return angularSeparation(first, second);
}
