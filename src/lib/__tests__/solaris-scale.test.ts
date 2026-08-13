import { describe, it, expect } from "vitest";
import {
  auToScene,
  radiusToScene,
  starRadiusToScene,
  starRadiusCapForApproach,
} from "@/components/solaris/utils/scaleAU";
import { generateSystem } from "@/components/solaris/generator";

describe("auToScene stays linear", () => {
  // Planet positions are computed in AU then mapped through auToScene, and the
  // drawn orbit is auToScene(semiMajorAxis). Bend this curve and planets leave
  // their own orbits.
  it("is proportional", () => {
    const k = auToScene(1);
    for (const au of [0.05, 0.5, 1, 3.7, 40]) {
      expect(auToScene(au)).toBeCloseTo(au * k, 10);
    }
  });
  it("maps zero to zero", () => {
    expect(auToScene(0)).toBe(0);
  });
});

describe("a planet never outsizes its star", () => {
  it("caps the largest planet below the smallest star", () => {
    const biggestPlanet = radiusToScene(30);
    const smallestStar = starRadiusToScene(0.05);
    expect(biggestPlanet).toBeLessThan(smallestStar);
  });
});

describe("the star cannot swallow its innermost planet", () => {
  it("shrinks to fit a close orbit", () => {
    // A red dwarf's first planet can sit at ~0.07 AU, well inside the 2.2-unit
    // disc the star would otherwise draw.
    const cap = starRadiusCapForApproach(0.07);
    const radius = starRadiusToScene(0.4, cap);
    expect(radius).toBeLessThan(auToScene(0.07));
  });

  it("leaves the uncapped size alone when there is room", () => {
    const roomy = starRadiusCapForApproach(40);
    expect(starRadiusToScene(1, roomy)).toBe(starRadiusToScene(1));
  });

  it("never shrinks to nothing", () => {
    expect(starRadiusToScene(1, starRadiusCapForApproach(0.0001))).toBeGreaterThan(0);
  });

  it("ignores a missing or nonsense cap", () => {
    expect(starRadiusToScene(1, undefined)).toBe(starRadiusToScene(1));
    expect(starRadiusToScene(1, NaN)).toBe(starRadiusToScene(1));
  });

  // The real assertion: across many generated systems, including the red-dwarf
  // and tight-orbit cases, the disc always clears the closest approach.
  it("holds for generated systems, using periapsis not mean distance", () => {
    for (let i = 0; i < 60; i++) {
      const sys = generateSystem({ seed: `clearance-${i}` });
      if (sys.planets.length === 0) continue;

      const closest = Math.min(
        ...sys.planets.map((p) => p.semiMajorAxisAU * (1 - Math.max(0, p.eccentricity))),
      );
      const cap = starRadiusCapForApproach(closest);

      for (const star of sys.stars ?? [sys.star]) {
        const drawn = starRadiusToScene(star.radiusSOL, cap);
        expect(
          drawn,
          `seed clearance-${i}: ${star.name} radius ${drawn} vs closest approach ${auToScene(closest)}`,
        ).toBeLessThan(auToScene(closest));
      }
    }
  });

  it("keeps the corona rings inside the innermost orbit too", () => {
    // StarObject draws corona rings at 1.5x the disc radius.
    for (let i = 0; i < 30; i++) {
      const sys = generateSystem({ seed: `corona-${i}` });
      if (sys.planets.length === 0) continue;
      const closest = Math.min(
        ...sys.planets.map((p) => p.semiMajorAxisAU * (1 - Math.max(0, p.eccentricity))),
      );
      const drawn = starRadiusToScene(sys.star.radiusSOL, starRadiusCapForApproach(closest));
      expect(drawn * 1.5, `seed corona-${i}`).toBeLessThanOrEqual(auToScene(closest));
    }
  });
});
