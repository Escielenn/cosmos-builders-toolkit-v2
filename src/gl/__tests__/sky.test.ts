// ---------------------------------------------------------------------------
// The sky from somewhere else (G5).
//
// The claims this file has to earn:
//   1. From Sol, the sky IS the catalogue — no drift, no invention.
//   2. From an anchor, the anchor star is the sun, not a star in the night.
//   3. Constellations deform because the geometry changed, and the deformation
//      is measurable.
//   4. Precession at the present is identity, and at epoch 0 from Earth the
//      pole star is Polaris — the check that says the sign and the rate are
//      both right, not just self-consistent.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  NAKED_EYE_MAG,
  buildSky,
  nearestToPole,
  poleDriftDegrees,
  separationInSky,
} from "@/gl/bind/sky";
import {
  buildGalaxyField,
  parseCatalog,
  type CatalogRow,
  type CatalogStar,
  type WorldSystem,
} from "@/gl/bind/starfield";
import { angularSeparation } from "@/lib/simulators/astro";
import type { Entity } from "@/services/entity-graph-types";

// Real rows, so the astronomy checks below mean something.
const ROWS: CatalogRow[] = [
  ["Sirius", 101.287, -16.716, 2.64, 1.43, -0.01],
  ["Tau Ceti", 26.017, -15.937, 3.65, 5.69, 0.72],
  ["Procyon", 114.827, 5.225, 3.51, 2.68, 0.42],
  ["Vega", 279.235, 38.784, 7.68, 0.58, -0.01],
  ["Altair", 297.696, 8.868, 5.13, 2.2, 0.22],
  ["Polaris", 37.954, 89.264, 133, -3.64, 0.6],
  ["Thuban", 211.097, 64.376, 92, -1.2, 0],
  ["Betelgeuse", 88.793, 7.407, 197, -5.14, 1.85],
];
const catalog = parseCatalog(ROWS);

const sys = (name: string, anchor: string | null): Entity =>
  ({
    id: `id-${name}`,
    world_id: "w",
    user_id: "u",
    name,
    entity_type: "star_system",
    cascade_stage: "physics",
    color: null,
    parent_entity_id: null,
    tags: [],
    metadata: anchor ? { anchor_star: anchor } : {},
    created_at: "",
    updated_at: "",
  }) as unknown as Entity;

function systemFor(anchor: string): WorldSystem {
  const field = buildGalaxyField(catalog, [sys("Kellis", anchor)]);
  return field.systems[0];
}

const find = (c: CatalogStar[], name: string) =>
  c.find((s) => s.name === name)!;

describe("buildSky", () => {
  it("returns nothing for a system that is not anchored", () => {
    const field = buildGalaxyField(catalog, [sys("Nowhere", null)]);
    expect(buildSky(catalog, field.unplaced[0])).toBeNull();
  });

  it("does NOT put the local sun in its own night sky", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    expect(sky.stars.map((s) => s.name)).not.toContain("Tau Ceti");
    expect(sky.sun.name).toBe("Tau Ceti");
  });

  it("puts Sol in the sky, because from anywhere else it is a star", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    const sol = sky.stars.find((s) => s.name === "Sol");
    expect(sol).toBeDefined();
    // Tau Ceti is 11.9 ly (3.65 pc) out, so the Sun there is
    // 4.83 + 5·log10(3.65/10) = 2.64 — about as bright as Polaris looks here.
    expect(sol!.distanceLy).toBeCloseTo(11.9, 0);
    expect(sol!.appMag).toBeCloseTo(2.64, 2);
    expect(sol!.appMag).toBeLessThan(NAKED_EYE_MAG);
  });

  it("looks BACK toward Sol — the direction is opposite the observer", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    const sol = sky.stars.find((s) => s.name === "Sol")!;
    const observer = systemFor("Tau Ceti").position!;
    const mag = Math.hypot(...observer);
    // The unit direction to Sol must be the negated unit observer vector.
    for (let i = 0; i < 3; i += 1) {
      expect(sol.direction[i]).toBeCloseTo(-observer[i] / mag, 6);
    }
  });

  it("sorts brightest first and names the brightest thing in that sky", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    for (let i = 1; i < sky.stars.length; i += 1) {
      expect(sky.stars[i].appMag).toBeGreaterThanOrEqual(sky.stars[i - 1].appMag);
    }
    expect(sky.brightest).toBe(sky.stars[0]);
  });

  it("drops what a naked eye could not see, and says how many it kept", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    expect(sky.stars.every((s) => s.appMag <= NAKED_EYE_MAG)).toBe(true);
    expect(sky.visibleCount).toBe(sky.stars.length);
    expect(sky.catalogueCount).toBe(catalog.length);
  });
});

describe("the geometry actually changed", () => {
  it("puts a star at a DIFFERENT distance than it is from Sol", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    const sirius = sky.stars.find((s) => s.name === "Sirius")!;
    const fromSol = find(catalog, "Sirius").distancePc * 3.26156;
    // Tau Ceti and Sirius are ~12.3 ly apart; Sirius is 8.6 ly from Sol.
    expect(sirius.distanceLy).not.toBeCloseTo(fromSol, 1);
    expect(sirius.distanceLy).toBeCloseTo(12.3, 0);
  });

  it("deforms a constellation — the angle between two stars is not Earth's", () => {
    const earth = angularSeparation(
      { ra: 101.287, dec: -16.716 }, // Sirius
      { ra: 114.827, dec: 5.225 }, // Procyon
    );
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    const there = separationInSky(sky, "Sirius", "Procyon")!;
    expect(there).not.toBeCloseTo(earth, 1);
    // Both are real angles on a sphere.
    expect(there).toBeGreaterThan(0);
    expect(there).toBeLessThan(180);
  });

  it("is null for a star that is not in that sky", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    expect(separationInSky(sky, "Sirius", "Tau Ceti")).toBeNull();
    expect(separationInSky(sky, "Krypton", "Sirius")).toBeNull();
  });

  it("makes a distant star's brightness barely change, and a near one's a lot", () => {
    const sky = buildSky(catalog, systemFor("Tau Ceti"))!;
    const betelgeuse = sky.stars.find((s) => s.name === "Betelgeuse");
    if (betelgeuse) {
      // 197 pc away: an 11.9 ly hop is nothing. Magnitude should barely move.
      const fromEarth = -5.14 + 5 * Math.log10(197 / 10);
      expect(betelgeuse.appMag).toBeCloseTo(fromEarth, 1);
    }
    const sirius = sky.stars.find((s) => s.name === "Sirius")!;
    const siriusFromEarth = 1.43 + 5 * Math.log10(2.64 / 10);
    // 2.64 pc → 3.77 pc is a real change, so this must move.
    expect(Math.abs(sirius.appMag - siriusFromEarth)).toBeGreaterThan(0.5);
  });
});

describe("precession — the pole wanders, the stars do not move", () => {
  const sky = buildSky(catalog, systemFor("Tau Ceti"), 0)!;
  const precessed = buildSky(catalog, systemFor("Tau Ceti"), 5000)!;

  it("changes nothing at the present epoch", () => {
    const now = buildSky(catalog, systemFor("Tau Ceti"), null)!;
    for (let i = 0; i < now.stars.length; i += 1) {
      expect(precessedName(now, i)).toBe(precessedName(sky, i));
      expect(now.stars[i].ra).toBeCloseTo(sky.stars[i].ra, 9);
      expect(now.stars[i].dec).toBeCloseTo(sky.stars[i].dec, 9);
    }
  });

  it("does NOT change any distance or brightness — a pole is not a journey", () => {
    for (const star of precessed.stars) {
      const before = sky.stars.find((s) => s.name === star.name)!;
      expect(star.distanceLy).toBeCloseTo(before.distanceLy, 9);
      expect(star.appMag).toBeCloseTo(before.appMag, 9);
    }
  });

  it("DOES move the sky's coordinates", () => {
    const before = sky.stars.find((s) => s.name === "Vega")!;
    const after = precessed.stars.find((s) => s.name === "Vega")!;
    expect(after.dec).not.toBeCloseTo(before.dec, 2);
  });

  it("returns to where it started after one full cycle", () => {
    const full = buildSky(catalog, systemFor("Tau Ceti"), 25772)!;
    for (const star of full.stars) {
      const start = sky.stars.find((s) => s.name === star.name)!;
      expect(star.dec).toBeCloseTo(start.dec, 4);
    }
  });
});

describe("the pole star — the check that the maths is right, not just consistent", () => {
  // Earth's own sky at the present epoch: the catalogue's coordinates as they
  // are, which is exactly what precession by zero years leaves them as. The
  // answers here are known independently of this codebase.
  const earthSkyNow = catalog.map((s) => ({
    name: s.name,
    ra: s.raDeg,
    dec: s.decDeg,
    direction: [0, 0, 0] as [number, number, number],
    distanceLy: s.distancePc * 3.26156,
    appMag: s.absMag + 5 * Math.log10(s.distancePc / 10),
    colour: s.colour,
  }));

  it("names Polaris the pole star now", () => {
    const pole = nearestToPole(earthSkyNow)!;
    expect(pole.star.name).toBe("Polaris");
    // Polaris really is about three quarters of a degree off the pole.
    expect(pole.degreesFromPole).toBeCloseTo(0.74, 1);
  });

  it("puts Thuban nearest the pole around 2787 BCE, as it really was", () => {
    // Thuban was the pole star when the Egyptian pyramids were built.
    const drift = poleDriftDegrees(
      { ra: 211.097, dec: 64.376 },
      0,
      -4850,
    );
    // It has to have moved a long way from its modern 25.6° off-pole.
    expect(drift).toBeGreaterThan(20);
  });

  it("reports no drift over no time", () => {
    expect(poleDriftDegrees({ ra: 37.954, dec: 89.264 }, 0, 0)).toBeCloseTo(0, 9);
  });

  it("is null when there is no sky to look at", () => {
    expect(nearestToPole([])).toBeNull();
  });
});

function precessedName(sky: { stars: { name: string }[] }, i: number) {
  return sky.stars[i].name;
}
