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

// ---------------------------------------------------------------------------
// Axial precession
// ---------------------------------------------------------------------------

/**
 * Axial precession: the ~25,772-year wobble of a planet's rotational axis,
 * traced out by the pole against the fixed stars (Earth's own version is
 * why Polaris was not the pole star in Vega's era, roughly 12,000 years ago,
 * and will not be again roughly 12,000 years from now).
 *
 * Modeled as lunisolar precession only, at the modern IAU rate. Does not
 * model nutation (the smaller, faster wobble on top of it) or the very slow
 * change in the precession rate itself over tens of thousands of years:
 * both are second-order against the rate itself and not the effect a writer
 * reaching for a multi-century time slider is trying to see.
 *
 * Reference: IAU 2006 precession model, general precession in longitude
 * ≈ 50.29 arcsec/year (Capitaine, N. et al. (2003), Astronomy & Astrophysics,
 * 412, 567). 360° / 50.29 arcsec/yr ≈ 25,772 years for one full cycle.
 */
const PRECESSION_PERIOD_YEARS = 25772;
const OBLIQUITY_DEG = 23.4393; // Earth's own axial tilt, held fixed by this model.

function matMul3(a: number[][], b: number[][]): number[][] {
  const out: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        out[i][j] += a[i][k] * b[k][j];
  return out;
}

export function precessionMatrix(yearsFromJ2000: number): number[][] {
  // Negated: precession of the equinoxes runs retrograde (westward against the
  // planet's own spin and orbital motion). Checked against two real fixed
  // points rather than trusted on sight: with this sign, Thuban (RA 211.097,
  // Dec 64.376) comes closest to the pole at yearsFromJ2000 ≈ -4850, matching
  // its real epoch as pole star around 2787 BCE, and Vega (RA 279.235,
  // Dec 38.784) comes closest at yearsFromJ2000 ≈ +11800, matching its real
  // future epoch around 13,727 CE. Without the negation both land exactly
  // half a cycle off (the sky spins the right amount, the wrong way), which
  // the algebraic tests below (identity, period, length) cannot detect since
  // none of them depend on rotation direction.
  const theta = -(yearsFromJ2000 / PRECESSION_PERIOD_YEARS) * 2 * Math.PI;
  const eps = OBLIQUITY_DEG * DEG;
  // Precession is a rotation of the equatorial pole around the ecliptic pole.
  // Composed as: rotate into the ecliptic frame, spin by theta, rotate back.
  const cosE = Math.cos(eps), sinE = Math.sin(eps);
  const cosT = Math.cos(theta), sinT = Math.sin(theta);
  const toEcliptic = [
    [1, 0, 0],
    [0, cosE, sinE],
    [0, -sinE, cosE],
  ];
  const spin = [
    [cosT, sinT, 0],
    [-sinT, cosT, 0],
    [0, 0, 1],
  ];
  const fromEcliptic = [
    [1, 0, 0],
    [0, cosE, -sinE],
    [0, sinE, cosE],
  ];
  return matMul3(fromEcliptic, matMul3(spin, toEcliptic));
}

export function applyPrecession(x: number, y: number, z: number, yearsFromJ2000: number): Vec3 {
  const m = precessionMatrix(yearsFromJ2000);
  return [
    m[0][0] * x + m[0][1] * y + m[0][2] * z,
    m[1][0] * x + m[1][1] * y + m[1][2] * z,
    m[2][0] * x + m[2][1] * y + m[2][2] * z,
  ];
}

// ===========================================================================
// 1.9 "True Numbers": the sky from a planet's surface.
//
// Everything below is new in 1.9 and has reference-value tests in
// src/lib/__tests__/astro-sky.test.ts. Conventions, stated once:
//
//   - Every direction is a unit vector in the J2000 equatorial frame
//     (+x to the March equinox, +z to the north celestial pole). Directions
//     do not depend on where the observer stands, so the same frame serves
//     Earth and Kepler-452b.
//   - A display frame is three rows [x, y, z] of unit vectors in that frame,
//     right-handed. A star's display coordinates are those rows dotted with
//     its direction.
//   - Local horizontal frame: x = north, y = west, z = zenith. Right-handed
//     (north x west = up), so longitude in it runs north -> west, and the
//     usual azimuth (north through east) is its negative.
// ===========================================================================

export type Frame3 = readonly [Vec3, Vec3, Vec3];

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function norm3(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l < 1e-15 ? [0, 0, 1] : [a[0] / l, a[1] / l, a[2] / l];
}

export function unitFromRaDec(raDeg: number, decDeg: number): Vec3 {
  return raDecDistToXYZ(raDeg, decDeg, 1);
}

/** Rotate v about the unit axis k by angle (radians), Rodrigues' formula. */
export function rotateAbout(v: Vec3, k: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  const kxv = cross3(k, v);
  const kdv = dot3(k, v);
  return [
    v[0] * c + kxv[0] * s + k[0] * kdv * (1 - c),
    v[1] * c + kxv[1] * s + k[1] * kdv * (1 - c),
    v[2] * c + kxv[2] * s + k[2] * kdv * (1 - c),
  ];
}

/** Display coordinates of direction s in frame f. */
export function toFrame(f: Frame3, s: Vec3): Vec3 {
  return [dot3(f[0], s), dot3(f[1], s), dot3(f[2], s)];
}

/** Direction (J2000) of display-frame coordinates d: the transpose. */
export function fromFrame(f: Frame3, d: Vec3): Vec3 {
  return [
    f[0][0] * d[0] + f[1][0] * d[1] + f[2][0] * d[2],
    f[0][1] * d[0] + f[1][1] * d[1] + f[2][1] * d[2],
    f[0][2] * d[0] + f[1][2] * d[1] + f[2][2] * d[2],
  ];
}

/** Longitude/latitude (deg) of display-frame coordinates. Longitude 0..360. */
export function lonLatOf(d: Vec3): { lon: number; lat: number } {
  const lat = Math.asin(Math.max(-1, Math.min(1, d[2]))) * RAD;
  let lon = Math.atan2(d[1], d[0]) * RAD;
  if (lon < 0) lon += 360;
  return { lon, lat };
}

/** Earth's present pole and orbit normal (J2000 ecliptic pole, RA 270°, Dec 90°-ε). */
export const EARTH_POLE: Vec3 = [0, 0, 1];
export const EARTH_OBLIQUITY_DEG = 23.4393; // IAU 2006 mean obliquity at J2000 (Capitaine et al. 2003)
export const EARTH_ORBIT_NORMAL: Vec3 = unitFromRaDec(270, 90 - EARTH_OBLIQUITY_DEG);

/** The north galactic pole as a J2000 direction (row 2 of R_EQ_TO_GAL). */
export const GALACTIC_NORTH: Vec3 = [R_EQ_TO_GAL[2][0], R_EQ_TO_GAL[2][1], R_EQ_TO_GAL[2][2]];

/**
 * The orbit normal for a planet whose pole is P and whose obliquity is ε,
 * when nothing says which way the orbit is tilted.
 *
 * Obliquity fixes the angle between pole and orbit normal, not its direction.
 * ExoSky needs a direction to put the equinox somewhere among the stars, so it
 * uses a stated convention: the normal leans from the pole toward the north
 * galactic pole. It decides which stars are behind the sun in which season,
 * nothing else; the science page says so.
 */
export function conventionalOrbitNormal(pole: Vec3, obliquityDeg: number): Vec3 {
  let w: Vec3 = [
    GALACTIC_NORTH[0] - dot3(GALACTIC_NORTH, pole) * pole[0],
    GALACTIC_NORTH[1] - dot3(GALACTIC_NORTH, pole) * pole[1],
    GALACTIC_NORTH[2] - dot3(GALACTIC_NORTH, pole) * pole[2],
  ];
  if (Math.hypot(...w) < 1e-6) w = cross3(pole, [1, 0, 0]);
  w = norm3(w);
  const e = obliquityDeg * DEG;
  return norm3([
    Math.cos(e) * pole[0] + Math.sin(e) * w[0],
    Math.cos(e) * pole[1] + Math.sin(e) * w[1],
    Math.cos(e) * pole[2] + Math.sin(e) * w[2],
  ]);
}

/**
 * The planet's equatorial frame: [equinox, 90° east along the equator, pole].
 *
 * The equinox is the ascending node of the orbit on the equator, P x N. For
 * Earth (P the celestial pole, N the ecliptic pole) that is +x, the March
 * equinox, which the tests check. At zero obliquity the node is undefined;
 * the frame falls back to the conventional normal's node so it stays smooth.
 */
export function planetEquatorialFrame(pole: Vec3, orbitNormal: Vec3): Frame3 {
  const p = norm3(pole);
  let e1 = cross3(p, orbitNormal);
  if (Math.hypot(...e1) < 1e-9) e1 = cross3(p, conventionalOrbitNormal(p, 10));
  e1 = norm3(e1);
  const e2 = norm3(cross3(p, e1));
  return [e1, e2, p];
}

/**
 * The host star's direction at orbital longitude λ (deg from the planet's
 * equinox, prograde), seen from the planet. Circular orbit.
 */
export function hostStarDirection(eqFrame: Frame3, orbitNormal: Vec3, orbitalLongitudeDeg: number): Vec3 {
  const e1 = eqFrame[0];
  const q = norm3(cross3(orbitNormal, e1));
  const l = orbitalLongitudeDeg * DEG;
  return norm3([
    Math.cos(l) * e1[0] + Math.sin(l) * q[0],
    Math.cos(l) * e1[1] + Math.sin(l) * q[1],
    Math.cos(l) * e1[2] + Math.sin(l) * q[2],
  ]);
}

/**
 * Local horizontal frame [north, west, zenith] at latitude φ and local
 * sidereal angle θ (deg east of the equinox along the equator).
 *
 * Zenith = cos φ (cos θ e1 + sin θ e2) + sin φ P. North is the pole's
 * component along the ground. At a geographic pole every direction is south
 * (or north); north there falls back to the meridian θ + 180°, so the frame
 * never degenerates.
 */
export function horizonFrame(eqFrame: Frame3, latitudeDeg: number, siderealDeg: number): Frame3 {
  const [e1, e2, p] = eqFrame;
  const ph = Math.max(-90, Math.min(90, latitudeDeg)) * DEG;
  const th = siderealDeg * DEG;
  const c = Math.cos(ph), s = Math.sin(ph);
  const ct = Math.cos(th), st = Math.sin(th);
  const zen: Vec3 = norm3([
    c * (ct * e1[0] + st * e2[0]) + s * p[0],
    c * (ct * e1[1] + st * e2[1]) + s * p[1],
    c * (ct * e1[2] + st * e2[2]) + s * p[2],
  ]);
  let north: Vec3 = [p[0] - dot3(p, zen) * zen[0], p[1] - dot3(p, zen) * zen[1], p[2] - dot3(p, zen) * zen[2]];
  if (Math.hypot(...north) < 1e-6) {
    // At a pole: "north" along the meridian away from the observer's θ.
    const away: Vec3 = [-(ct * e1[0] + st * e2[0]), -(ct * e1[1] + st * e2[1]), -(ct * e1[2] + st * e2[2])];
    north = latitudeDeg > 0 ? away : [-away[0], -away[1], -away[2]];
  }
  north = norm3(north);
  const west = norm3(cross3(zen, north));
  return [north, west, zen];
}

/** Altitude and azimuth (deg, azimuth from north through east) in a horizon frame. */
export function altAz(hframe: Frame3, s: Vec3): { alt: number; az: number } {
  const d = toFrame(hframe, s);
  const alt = Math.asin(Math.max(-1, Math.min(1, d[2]))) * RAD;
  let az = Math.atan2(-d[1], d[0]) * RAD;
  if (az < 0) az += 360;
  return { alt, az };
}

/** Right ascension / declination (deg) of a direction in a planet's equatorial frame. */
export function planetRaDec(eqFrame: Frame3, s: Vec3): { ra: number; dec: number } {
  const { lon, lat } = lonLatOf(toFrame(eqFrame, s));
  return { ra: lon, dec: lat };
}

/**
 * The sidereal angle that puts the host star at a given local solar time.
 * Noon (0.5 of the solar day) is the star on the meridian: hour angle 0.
 */
export function siderealForSolarTime(hostRaDeg: number, solarDayFraction: number): number {
  return (((hostRaDeg + (solarDayFraction - 0.5) * 360) % 360) + 360) % 360;
}

/**
 * Solar day from the sidereal rotation period and the orbital period, both in
 * the same unit: 1/solar = 1/sidereal - 1/orbit for prograde spin (Earth:
 * 23.934 h sidereal, 365.256 d orbit -> 24.000 h). A spin period equal to the
 * orbit (tidal lock) gives an infinite solar day: the sun does not move.
 * A negative sidereal period means retrograde spin (Venus: -243.0 d sidereal,
 * 224.7 d orbit -> 116.8 d solar).
 */
export function solarDayLength(siderealPeriod: number, orbitalPeriod: number): number {
  const f = 1 / siderealPeriod - 1 / orbitalPeriod;
  if (Math.abs(f) < 1e-12) return Infinity;
  return Math.abs(1 / f);
}

// ---------------------------------------------------------------------------
// The pole over time: the planet's own precession (N5)
// ---------------------------------------------------------------------------

/**
 * The pole after `years` of precession about the orbit normal, retrograde
 * (as Earth's is), with one cycle every `periodYears`.
 *
 * With Earth's pole, Earth's ecliptic pole and 25,772 yr this reproduces
 * precessionMatrix above (tested against Thuban and Vega).
 */
export function precessedPole(pole: Vec3, orbitNormal: Vec3, periodYears: number, years: number): Vec3 {
  if (!Number.isFinite(periodYears) || periodYears <= 0 || years === 0) return norm3(pole);
  return norm3(rotateAbout(norm3(pole), norm3(orbitNormal), -(years / periodYears) * 2 * Math.PI));
}

/** Earth's dynamical ellipticity H = (C - A)/C (IERS Conventions 2010, H = 0.0032737949). */
const EARTH_H = 0.0032737949;
const EARTH_SIDEREAL_DAY_H = 23.9344696;

/**
 * Precession period driven by the host star alone, for a planet with no
 * stated value.
 *
 * Rate = (3/2) (n² / ω) H cos ε (the solar torque on an oblate spinning body;
 * Williams 1994, AJ 108, 711, and the derivation at
 * farside.ph.utexas.edu/teaching/celestial/Celestial/node74.html). H, the
 * dynamical ellipticity, is not something a writer knows; for a fluid-like
 * planet flattening scales with spin squared, so H is scaled from Earth's by
 * (ω / ω_Earth)². For Earth this gives ~81,000 yr, the "Sun only" figure
 * (Fitzpatrick quotes ~79,400 yr); the Moon brings Earth's real value down to
 * 25,772 yr. Moons are not modelled here, and the readout says so.
 *
 * rotationHours: sidereal day; orbitDays: orbital period. Returns years.
 */
export function solarPrecessionPeriodYears(rotationHours: number, orbitDays: number, obliquityDeg: number): number {
  if (!(rotationHours > 0) || !(orbitDays > 0)) return Infinity;
  const yearS = 365.25 * 86400;
  const omega = (2 * Math.PI) / (rotationHours * 3600);
  const n = (2 * Math.PI) / (orbitDays * 86400);
  const omegaE = (2 * Math.PI) / (EARTH_SIDEREAL_DAY_H * 3600);
  const H = EARTH_H * (omega / omegaE) ** 2;
  const cosE = Math.cos(obliquityDeg * DEG);
  const rate = 1.5 * (n * n / omega) * H * Math.abs(cosE); // rad/s
  if (rate < 1e-30) return Infinity;
  return (2 * Math.PI) / rate / yearS;
}

// ---------------------------------------------------------------------------
// Atmosphere: extinction by airmass (E9)
// ---------------------------------------------------------------------------

/**
 * Relative optical air mass at a given altitude, Kasten & Young (1989),
 * Applied Optics 28, 4735: X = 1 / (cos z + 0.50572 (96.07995 - z)^-1.6364),
 * z the zenith angle in degrees. 1 at the zenith, ~38 at the horizon (the
 * plane-parallel sec z would be infinite). Below the horizon: Infinity.
 */
export function airmass(altitudeDeg: number): number {
  if (altitudeDeg < 0) return Infinity;
  const z = 90 - Math.min(90, altitudeDeg);
  return 1 / (Math.cos(z * DEG) + 0.50572 * Math.pow(96.07995 - z, -1.6364));
}

/** Magnitudes lost to the atmosphere: k (mag per airmass) x airmass. */
export function extinctionMag(altitudeDeg: number, kPerAirmass: number): number {
  return kPerAirmass * airmass(altitudeDeg);
}

// ---------------------------------------------------------------------------
// Bodies in the sky: host star, sibling planets, moons (N2)
// ---------------------------------------------------------------------------

export const AU_KM = 149597870.7;
export const PC_AU = 206264.806;
export const SUN_RADIUS_KM = 695700;
export const EARTH_RADIUS_KM = 6371;
export const SUN_ABS_MAG_V = 4.83;
export const SUN_TEFF_K = 5772;

/** Angular diameter (deg) of a sphere of radius r at distance d (same units). */
export function angularDiameterDeg(radius: number, distance: number): number {
  if (!(distance > radius)) return 180;
  return 2 * Math.asin(radius / distance) * RAD;
}

/**
 * Stellar radius (solar radii) from luminosity (L☉) and effective
 * temperature (K), Stefan-Boltzmann: R = sqrt(L) (5772 / T)².
 */
export function stellarRadiusSolar(luminositySolar: number, teffK: number): number {
  if (!(luminositySolar > 0) || !(teffK > 0)) return NaN;
  return Math.sqrt(luminositySolar) * (SUN_TEFF_K / teffK) ** 2;
}

/**
 * Absolute V magnitude from luminosity, ignoring the bolometric correction:
 * M = 4.83 - 2.5 log10(L). Good to a few tenths for F-K stars; red dwarfs are
 * fainter in V than this says (their light is infrared). Used only when the
 * host is not a catalogue star with a measured magnitude.
 */
export function absMagFromLuminosity(luminositySolar: number): number {
  if (!(luminositySolar > 0)) return NaN;
  return SUN_ABS_MAG_V - 2.5 * Math.log10(luminositySolar);
}

/** Apparent magnitude of a star of absolute magnitude M seen from `au` AU. */
export function apparentMagAtAu(absMag: number, au: number): number {
  return absMag + 5 * Math.log10(au / PC_AU / 10);
}

/** Lambert sphere phase function Φ(α) = (sin α + (π - α) cos α) / π; 1 at full. */
export function lambertPhase(phaseAngleDeg: number): number {
  const a = Math.max(0, Math.min(180, phaseAngleDeg)) * DEG;
  return (Math.sin(a) + (Math.PI - a) * Math.cos(a)) / Math.PI;
}

/** Illuminated fraction of the disc, (1 + cos α) / 2. */
export function illuminatedFraction(phaseAngleDeg: number): number {
  return (1 + Math.cos(phaseAngleDeg * DEG)) / 2;
}

/**
 * Apparent magnitude of a body shining by reflected starlight.
 *
 * F_body / F_star(r) = p Φ(α) (R / Δ)², so
 *   m = m_star(r) - 2.5 log10(p Φ(α) R² / Δ²)
 * with r the body-star distance, Δ the observer-body distance, R its radius
 * (same unit as Δ), p the geometric albedo. Checked against Jupiter at
 * opposition from Earth (-2.7; Mallama et al. 2018, Icarus) in the tests.
 */
export function reflectedMagnitude(opts: {
  starAbsMag: number;
  starBodyAu: number;
  observerBodyKm: number;
  radiusKm: number;
  albedo: number;
  phaseAngleDeg: number;
}): number {
  const mStar = apparentMagAtAu(opts.starAbsMag, opts.starBodyAu);
  const phi = lambertPhase(opts.phaseAngleDeg);
  const ratio = opts.albedo * phi * (opts.radiusKm / opts.observerBodyKm) ** 2;
  if (!(ratio > 0)) return Infinity;
  return mStar - 2.5 * Math.log10(ratio);
}

/** Kepler's third law: period (days) from semi-major axis (AU) and star mass (M☉). */
export function orbitalPeriodDays(au: number, starMassSolar: number): number {
  return 365.256 * Math.sqrt(au ** 3 / Math.max(1e-6, starMassSolar));
}

/**
 * A star closer than this to the observer is the observer's own star, not a
 * point in its sky. 0.01 pc is ~2,000 AU: past any planet, inside any
 * neighbour (Proxima is 13,000 AU from Alpha Cen A/B).
 */
export const OWN_STAR_PC = 0.01;
