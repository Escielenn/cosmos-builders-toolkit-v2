import { describe, it, expect } from "vitest";
import {
  R_EQ_TO_GAL,
  R_SUN,
  Z_SUN,
  eqToGal,
  galToEq,
  raDecDistToXYZ,
  xyzToRaDec,
  eqXYZtoGalactocentric,
  galactocentricToEqXYZ,
  apparentMag,
  absoluteMag,
  bvToRGB,
  starFromObserver,
  angularSeparation,
} from "@/lib/simulators/astro";

// ---------------------------------------------------------------------------
// The source file claimed "MATH VALIDATION (verified 2026-04-25)" in a comment
// and had no tests. These check the claim against published astronomy rather
// than against the implementation, so a wrong constant fails rather than being
// enshrined.
// ---------------------------------------------------------------------------

describe("the equatorial-to-galactic matrix is a real rotation", () => {
  it("is orthonormal: every row is a unit vector", () => {
    for (const row of R_EQ_TO_GAL) {
      expect(Math.hypot(...row)).toBeCloseTo(1, 8);
    }
  });

  it("is orthonormal: rows are mutually perpendicular", () => {
    const dot = (a: readonly number[], b: readonly number[]) =>
      a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    expect(dot(R_EQ_TO_GAL[0], R_EQ_TO_GAL[1])).toBeCloseTo(0, 8);
    expect(dot(R_EQ_TO_GAL[0], R_EQ_TO_GAL[2])).toBeCloseTo(0, 8);
    expect(dot(R_EQ_TO_GAL[1], R_EQ_TO_GAL[2])).toBeCloseTo(0, 8);
  });

  it("has determinant +1, so it rotates without mirroring", () => {
    const [a, b, c] = R_EQ_TO_GAL;
    const det =
      a[0] * (b[1] * c[2] - b[2] * c[1]) -
      a[1] * (b[0] * c[2] - b[2] * c[0]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
    // A determinant of -1 would silently flip the sky's handedness: every
    // constellation would render as its own mirror image.
    expect(det).toBeCloseTo(1, 8);
  });

  it("round-trips through its transpose", () => {
    // The published constants carry 10 significant figures, so the matrix is
    // orthonormal only to about 1e-10. Asserting past that would be testing
    // floating point, not the astronomy: a unit-length row here is 1 to within
    // 7e-11, and the round-trip inherits exactly that.
    const [gx, gy, gz] = eqToGal(0.3, -0.5, 0.81);
    const [x, y, z] = galToEq(gx, gy, gz);
    expect(x).toBeCloseTo(0.3, 9);
    expect(y).toBeCloseTo(-0.5, 9);
    expect(z).toBeCloseTo(0.81, 9);
  });
});

describe("it agrees with the sky", () => {
  it("puts the north galactic pole at galactic b = +90", () => {
    // The NGP is at RA 192.859°, Dec +27.128° by definition of the IAU system.
    const [x, y, z] = raDecDistToXYZ(192.859508, 27.128336, 1);
    const [gx, gy, gz] = eqToGal(x, y, z);
    expect(gz).toBeCloseTo(1, 5);
    expect(Math.hypot(gx, gy)).toBeCloseTo(0, 5);
  });

  it("puts the galactic centre where Sagittarius A* is", () => {
    // Galactic (l, b) = (0, 0) is RA 17h45m40s, Dec -28°56'10", or
    // 266.405°, -28.936° in degrees.
    const [ex, ey, ez] = galToEq(1, 0, 0);
    const { ra, dec } = xyzToRaDec(ex, ey, ez);
    expect(ra).toBeCloseTo(266.405, 2);
    expect(dec).toBeCloseTo(-28.936, 2);
  });

  it("puts the galactic anticentre opposite it", () => {
    const { ra, dec } = xyzToRaDec(...galToEq(-1, 0, 0));
    expect(ra).toBeCloseTo(86.405, 2);
    expect(dec).toBeCloseTo(28.936, 2);
  });
});

describe("spherical and Cartesian round-trip", () => {
  it.each([
    [0, 0, 10],
    [359.9, -89.9, 1],
    [180, 45, 1000],
    [270, -45, 3.26],
    [123.456, 12.345, 42],
  ])("ra %s dec %s dist %s survives the trip", (ra, dec, dist) => {
    const [x, y, z] = raDecDistToXYZ(ra, dec, dist);
    const back = xyzToRaDec(x, y, z);
    expect(back.dist).toBeCloseTo(dist, 9);
    expect(back.dec).toBeCloseTo(dec, 9);
    expect(back.ra).toBeCloseTo(ra, 9);
  });

  it("always reports right ascension in 0 to 360, never negative", () => {
    for (let ra = 0; ra < 360; ra += 17) {
      const back = xyzToRaDec(...raDecDistToXYZ(ra, 10, 5));
      expect(back.ra).toBeGreaterThanOrEqual(0);
      expect(back.ra).toBeLessThan(360);
    }
  });

  it("returns a defined position at the origin instead of NaN", () => {
    expect(xyzToRaDec(0, 0, 0)).toEqual({ ra: 0, dec: 0, dist: 0 });
  });

  it("does not produce NaN at the poles from floating-point overshoot", () => {
    // z/dist can land a hair above 1, and an unclamped asin would return NaN
    // that then spreads through every downstream position.
    const p = xyzToRaDec(0, 0, 1);
    expect(p.dec).toBeCloseTo(90, 9);
    expect(Number.isNaN(p.dec)).toBe(false);
  });
});

describe("galactocentric frame", () => {
  it("places the Sun at the documented offset from the centre", () => {
    const [x, y, z] = eqXYZtoGalactocentric(0, 0, 0);
    expect(x).toBeCloseTo(R_SUN, 9);
    expect(y).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(Z_SUN, 9);
  });

  it("round-trips, which the original's unresolved derivation never checked", () => {
    const sample: [number, number, number][] = [
      [10, -20, 30],
      [-500, 250, -75],
      [0, 0, 100],
    ];
    for (const [x, y, z] of sample) {
      const [a, b, c] = eqXYZtoGalactocentric(x, y, z);
      const [rx, ry, rz] = galactocentricToEqXYZ(a, b, c);
      // Relative, not absolute: these are parsecs, and the round-trip goes via
      // the Sun's 8,200 pc offset, so absolute error scales with that. A part
      // in 1e-10 of a parsec is far below any distance the catalogue knows.
      const tol = (v: number) => Math.max(1e-6, Math.abs(v) * 1e-9);
      expect(Math.abs(rx - x)).toBeLessThan(tol(R_SUN));
      expect(Math.abs(ry - y)).toBeLessThan(tol(R_SUN));
      expect(Math.abs(rz - z)).toBeLessThan(tol(R_SUN));
    }
  });

  it("moves toward the centre as a star sits toward the galactic centre", () => {
    // A star 100 pc toward l=0 should be 100 pc closer to the centre.
    const towardGC = galToEq(100, 0, 0);
    const [x] = eqXYZtoGalactocentric(...towardGC);
    expect(x).toBeCloseTo(R_SUN - 100, 6);
  });
});

describe("magnitudes", () => {
  it("makes apparent equal absolute at exactly 10 parsecs", () => {
    // The definition of absolute magnitude, and the sharpest check available.
    expect(apparentMag(4.83, 10)).toBeCloseTo(4.83, 12);
  });

  it("dims by five magnitudes per factor of ten in distance", () => {
    expect(apparentMag(0, 100) - apparentMag(0, 10)).toBeCloseTo(5, 12);
    expect(apparentMag(0, 1000) - apparentMag(0, 100)).toBeCloseTo(5, 12);
  });

  it("matches Sirius as seen from Earth", () => {
    // Sirius: absolute magnitude 1.43, distance 2.64 pc, apparent about -1.46.
    expect(apparentMag(1.43, 2.64)).toBeCloseTo(-1.46, 1);
  });

  it("matches Betelgeuse as seen from Earth", () => {
    // Absolute -5.85 at roughly 168 pc gives about 0.4.
    expect(apparentMag(-5.85, 168)).toBeCloseTo(0.4, 0);
  });

  it("inverts", () => {
    expect(absoluteMag(apparentMag(2.5, 88), 88)).toBeCloseTo(2.5, 10);
  });

  it("returns something finite when standing on the star", () => {
    expect(Number.isFinite(apparentMag(4.83, 0))).toBe(true);
  });
});

describe("colour", () => {
  it("returns channels inside 0 to 255", () => {
    for (let bv = -1; bv <= 3; bv += 0.1) {
      for (const c of bvToRGB(bv)) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(255);
      }
    }
  });

  it("runs blue for hot stars and red for cool ones", () => {
    const hot = bvToRGB(-0.3); // O and B class
    const cool = bvToRGB(1.8); // M class
    expect(hot[2]).toBeGreaterThan(hot[0]); // more blue than red
    expect(cool[0]).toBeGreaterThan(cool[2]); // more red than blue
  });

  it("gives the Sun something recognisably yellow-white", () => {
    // The Sun's B-V is 0.65.
    const [r, g, b] = bvToRGB(0.65);
    expect(r).toBe(255);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeLessThan(g);
  });

  it("clamps beyond the defined range rather than extrapolating", () => {
    expect(bvToRGB(-99)).toEqual(bvToRGB(-0.4));
    expect(bvToRGB(99)).toEqual(bvToRGB(2.0));
  });
});

describe("the sky from somewhere else, which is the whole product", () => {
  const sirius = { ra: 101.287, dec: -16.716, distPc: 2.64, absMag: 1.43 };

  it("is unchanged when the observer is the Sun", () => {
    const seen = starFromObserver(sirius, [0, 0, 0]);
    expect(seen.ra).toBeCloseTo(sirius.ra, 6);
    expect(seen.dec).toBeCloseTo(sirius.dec, 6);
    expect(seen.dist).toBeCloseTo(sirius.distPc, 6);
    // From here it should read as the brightest star in the sky.
    expect(seen.appMag).toBeCloseTo(-1.46, 1);
  });

  it("moves a star across the sky when the observer moves", () => {
    // Stand 2 pc off to one side and Sirius, only 2.64 pc away, shifts a lot.
    const offset = starFromObserver(sirius, [2, 0, 0]);
    expect(angularSeparation(sirius, offset)).toBeGreaterThan(5);
  });

  it("dims a star you have moved away from", () => {
    const near = starFromObserver(sirius, [0, 0, 0]);
    // Move 20 pc directly away from it.
    const away = starFromObserver(sirius, raDecDistToXYZ(101.287 + 180, 16.716, 20));
    expect(away.dist).toBeGreaterThan(near.dist);
    expect(away.appMag).toBeGreaterThan(near.appMag);
  });

  it("puts a star behind you on the opposite side of the sky", () => {
    // Observer well past the star along its own line of sight.
    const past = starFromObserver(sirius, raDecDistToXYZ(101.287, -16.716, 10));
    expect(angularSeparation(sirius, past)).toBeCloseTo(180, 3);
  });
});

describe("angular separation", () => {
  it("is zero for a point against itself", () => {
    expect(angularSeparation({ ra: 42, dec: 13 }, { ra: 42, dec: 13 })).toBeCloseTo(0, 9);
  });

  it("is 180 for opposite poles", () => {
    expect(angularSeparation({ ra: 0, dec: 90 }, { ra: 0, dec: -90 })).toBeCloseTo(180, 9);
  });

  it("is 90 between the pole and the equator", () => {
    expect(angularSeparation({ ra: 0, dec: 90 }, { ra: 123, dec: 0 })).toBeCloseTo(90, 9);
  });

  it("handles the right-ascension wrap without a jump", () => {
    expect(angularSeparation({ ra: 359, dec: 0 }, { ra: 1, dec: 0 })).toBeCloseTo(2, 9);
  });

  it("stays precise on very small separations", () => {
    // The plain cosine rule loses precision here; this is why Vincenty is used.
    const sep = angularSeparation({ ra: 10, dec: 20 }, { ra: 10.0001, dec: 20 });
    expect(sep).toBeGreaterThan(0);
    expect(sep).toBeCloseTo(0.0001 * Math.cos(20 * (Math.PI / 180)), 8);
  });

  it("matches a known pair: the Big Dipper's Dubhe and Merak", () => {
    // Dubhe (165.932, 61.751) and Merak (165.460, 56.382) are about 5.4° apart.
    const sep = angularSeparation({ ra: 165.932, dec: 61.751 }, { ra: 165.46, dec: 56.382 });
    expect(sep).toBeCloseTo(5.37, 1);
  });
});
