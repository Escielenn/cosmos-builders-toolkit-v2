// ---------------------------------------------------------------------------
// astro, the coordinate and photometry maths behind ExoSky.
//
// Extracted from ExoSkySimulator.tsx, whose header claims "MATH VALIDATION
// (verified 2026-04-25)" and which had no tests. A comment asserting the maths
// is right is not the same as the maths being right, and the same file carried
// an unresolved "Wait:" mid-derivation in production.
//
// Everything here is checkable against published astronomy, and the tests do
// exactly that: the north galactic pole, Sagittarius A*, the distance modulus,
// and the orthonormality of the rotation matrix itself.
//
// Pure by design: no canvas, no React.
// ---------------------------------------------------------------------------

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

// ---------------------------------------------------------------------------
// Galactic structure constants
// ---------------------------------------------------------------------------

/** Sun's distance from the galactic centre, in parsecs. */
export const R_SUN = 8200;
/** Sun's height above the galactic plane, in parsecs. */
export const Z_SUN = 25;
export const DISK_SCALE_H = 2600;
export const DISK_SCALE_Z = 300;
export const DUST_SCALE_Z = 120;
export const ARM_WIDTH = 500;
export const ARM_PITCH = 12 * DEG;
export const BULGE_RADIUS = 1200;

// ---------------------------------------------------------------------------
// Equatorial to galactic
// ---------------------------------------------------------------------------

/**
 * IAU 1958 equatorial-to-galactic rotation.
 *
 * Defined by the north galactic pole at RA 192.859°, Dec +27.128°, with the
 * galactic longitude of the north celestial pole at 122.932°. Being a rotation,
 * its inverse is its transpose, which is what galToEq uses.
 */
export const R_EQ_TO_GAL: readonly (readonly number[])[] = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.4448296300, 0.7469822445],
  [-0.8676661490, -0.1980763734, 0.4559837762],
];

export type Vec3 = [number, number, number];

export function eqToGal(x: number, y: number, z: number): Vec3 {
  return [
    R_EQ_TO_GAL[0][0] * x + R_EQ_TO_GAL[0][1] * y + R_EQ_TO_GAL[0][2] * z,
    R_EQ_TO_GAL[1][0] * x + R_EQ_TO_GAL[1][1] * y + R_EQ_TO_GAL[1][2] * z,
    R_EQ_TO_GAL[2][0] * x + R_EQ_TO_GAL[2][1] * y + R_EQ_TO_GAL[2][2] * z,
  ];
}

/** Inverse of eqToGal, by transpose. */
export function galToEq(gx: number, gy: number, gz: number): Vec3 {
  return [
    R_EQ_TO_GAL[0][0] * gx + R_EQ_TO_GAL[1][0] * gy + R_EQ_TO_GAL[2][0] * gz,
    R_EQ_TO_GAL[0][1] * gx + R_EQ_TO_GAL[1][1] * gy + R_EQ_TO_GAL[2][1] * gz,
    R_EQ_TO_GAL[0][2] * gx + R_EQ_TO_GAL[1][2] * gy + R_EQ_TO_GAL[2][2] * gz,
  ];
}

// ---------------------------------------------------------------------------
// Spherical and Cartesian
// ---------------------------------------------------------------------------

/** Right ascension and declination in degrees, distance in any unit, to XYZ. */
export function raDecDistToXYZ(ra: number, dec: number, dist: number): Vec3 {
  const cd = Math.cos(dec * DEG);
  return [
    dist * cd * Math.cos(ra * DEG),
    dist * cd * Math.sin(ra * DEG),
    dist * Math.sin(dec * DEG),
  ];
}

export interface SkyPosition {
  /** Right ascension in degrees, 0 to 360. */
  ra: number;
  /** Declination in degrees, -90 to +90. */
  dec: number;
  dist: number;
}

export function xyzToRaDec(x: number, y: number, z: number): SkyPosition {
  const dist = Math.sqrt(x * x + y * y + z * z);
  if (dist < 1e-12) return { ra: 0, dec: 0, dist: 0 };
  // Clamped before asin: floating point can push z/dist a hair past 1 and turn
  // a pole into NaN, which propagates silently through the whole render.
  const dec = Math.asin(Math.max(-1, Math.min(1, z / dist))) * RAD;
  let ra = Math.atan2(y, x) * RAD;
  if (ra < 0) ra += 360;
  return { ra, dec, dist };
}

/**
 * Heliocentric equatorial XYZ to galactocentric XYZ, in parsecs.
 *
 * The Sun sits R_SUN from the centre and Z_SUN above the plane. Galactic
 * coordinates from eqToGal are Sun-centred with +x toward the galactic centre,
 * so the centre-relative position is (R_SUN - gx, -gy, Z_SUN + gz): subtract
 * because +x points at the centre, negate y to keep the frame right-handed once
 * x has flipped direction.
 *
 * The original carried a "Wait:" here mid-derivation. The result is unchanged;
 * the reasoning is now stated once, and the round-trip is asserted in tests.
 */
export function eqXYZtoGalactocentric(eqX: number, eqY: number, eqZ: number): Vec3 {
  const [gx, gy, gz] = eqToGal(eqX, eqY, eqZ);
  return [R_SUN - gx, -gy, Z_SUN + gz];
}

/** Inverse of eqXYZtoGalactocentric. */
export function galactocentricToEqXYZ(cx: number, cy: number, cz: number): Vec3 {
  return galToEq(R_SUN - cx, -cy, cz - Z_SUN);
}

// ---------------------------------------------------------------------------
// Photometry
// ---------------------------------------------------------------------------

/**
 * Apparent magnitude from absolute magnitude and distance: m = M + 5·log10(d/10).
 *
 * At exactly 10 parsecs the two are equal, which is the definition of absolute
 * magnitude and the sharpest test of this function.
 */
export function apparentMag(absMag: number, distPc: number): number {
  // Standing on the star is not a distance the formula covers; the Sun's own
  // apparent magnitude stands in so the renderer gets something finite.
  if (distPc <= 0.001) return -26.7;
  return absMag + 5 * Math.log10(distPc / 10);
}

/** Absolute magnitude from apparent magnitude and distance. */
export function absoluteMag(appMag: number, distPc: number): number {
  if (distPc <= 0) return appMag;
  return appMag - 5 * Math.log10(distPc / 10);
}

/**
 * B-V colour index to an approximate RGB triple.
 *
 * Blue-white at negative B-V through to deep orange past 1.2. Piecewise rather
 * than a blackbody fit: the fit is more correct and reads worse on a dark sky,
 * where what matters is that spectral classes stay tellable apart.
 */
export function bvToRGB(bv: number): Vec3 {
  const v = Math.max(-0.4, Math.min(2.0, bv));
  let t: number;
  let r: number;
  let g: number;
  let b: number;

  if (v < 0) {
    t = (v + 0.4) / 0.4;
    r = 0.61 + 0.39 * t;
    g = 0.7 + 0.3 * t;
    b = 1;
  } else if (v < 0.4) {
    t = v / 0.4;
    r = 0.83 + 0.17 * (1 - t);
    g = 0.87 + 0.13 * (1 - t);
    b = 1;
  } else if (v < 0.8) {
    t = (v - 0.4) / 0.4;
    r = 1;
    g = 1 - 0.2 * t;
    b = 1 - 0.4 * t;
  } else if (v < 1.2) {
    t = (v - 0.8) / 0.4;
    r = 1;
    g = 0.8 - 0.15 * t;
    b = 0.6 - 0.25 * t;
  } else {
    t = Math.min(1, (v - 1.2) / 0.8);
    r = 1;
    g = 0.65 - 0.2 * t;
    b = 0.35 - 0.2 * t;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ---------------------------------------------------------------------------
// Observer transform
// ---------------------------------------------------------------------------

/**
 * A catalogue star as seen from somewhere other than the Sun.
 *
 * This is the whole point of ExoSky: translate every star by the observer's
 * heliocentric position, then re-project. Constellations deform because the
 * geometry actually changed, not because anything was faked.
 *
 * Returns the new sky position and the apparent magnitude from there, which is
 * how a star can drop out of naked-eye visibility by being further away.
 */
export function starFromObserver(
  star: { ra: number; dec: number; distPc: number; absMag: number },
  observerEqXYZ: Vec3,
): SkyPosition & { appMag: number } {
  const [sx, sy, sz] = raDecDistToXYZ(star.ra, star.dec, star.distPc);
  const rel = xyzToRaDec(sx - observerEqXYZ[0], sy - observerEqXYZ[1], sz - observerEqXYZ[2]);
  return { ...rel, appMag: apparentMag(star.absMag, rel.dist) };
}

/** Angular separation between two sky positions, in degrees. */
export function angularSeparation(
  a: { ra: number; dec: number },
  b: { ra: number; dec: number },
): number {
  const d1 = a.dec * DEG;
  const d2 = b.dec * DEG;
  const dRa = (b.ra - a.ra) * DEG;
  // Vincenty form: stable for both tiny and near-180° separations, unlike the
  // plain cosine rule which loses precision on small angles.
  const num = Math.hypot(
    Math.cos(d2) * Math.sin(dRa),
    Math.cos(d1) * Math.sin(d2) - Math.sin(d1) * Math.cos(d2) * Math.cos(dRa),
  );
  const den = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dRa);
  return Math.atan2(num, den) * RAD;
}
