// ---------------------------------------------------------------------------
// G3 — the System scene's binding.
//
// The rule under test is the one the Atlas and the Timeline already hold: a
// body with no orbital distance on file HAS NO ORBIT. It is named and listed,
// never drawn at a plausible radius. An orrery that invents distances is a
// picture of a solar system rather than a picture of THIS one.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  bindSystem,
  bodyScale,
  orbitPosition,
  orbitScale,
} from "@/gl/bind/system";
import type { WorldEntry } from "@/services/world-data";

let n = 0;
function entry(
  title: string,
  facts: Record<string, number | string> = {},
): WorldEntry {
  n += 1;
  return {
    id: `e${n}`,
    world_id: "w",
    entry_type: "planet",
    title,
    content: null,
    metadata: {
      _published_facts: Object.entries(facts).map(([predicate, value]) => ({
        predicate,
        label: predicate,
        value,
      })),
    },
    sort_order: 0,
    parent_id: null,
    icon: null,
    color: null,
    tool_source: null,
    tool_data_id: null,
    layer: null,
    cover_image_url: null,
    tags: [],
    created_by: "u",
    created_at: "",
    updated_at: "",
  } as WorldEntry;
}

describe("orbitScale — a system spans orders of magnitude", () => {
  it("keeps the inner and outer system on screen together", () => {
    // Mercury 0.39 AU and Neptune 30 AU. Linearly, one of them is unusable.
    const mercury = orbitScale(0.39);
    const neptune = orbitScale(30);
    expect(mercury).toBeGreaterThan(0);
    expect(neptune / mercury).toBeLessThan(6);
  });

  it("preserves order — a farther planet is always drawn farther", () => {
    let prev = -1;
    for (const au of [0.1, 0.39, 0.72, 1, 1.5, 5.2, 9.5, 19, 30, 100]) {
      const r = orbitScale(au);
      expect(r).toBeGreaterThan(prev);
      prev = r;
    }
  });

  it("keeps close-in worlds OUTSIDE the star — the bug this caught", () => {
    // A naive log10 hits zero at 0.1 AU and goes negative below it, drawing a
    // hot Jupiter inside its own star. Tidelock's premise is a locked world at
    // 0.02–0.05 AU, so this is the common case, not an edge one.
    for (const au of [0.005, 0.01, 0.02, 0.05, 0.1]) {
      expect(orbitScale(au)).toBeGreaterThan(1.2); // clear of the largest star
    }
    expect(orbitScale(0.05)).toBeLessThan(orbitScale(0.5));
  });

  it("is zero for a distance that is not a distance", () => {
    for (const bad of [0, -1, Number.NaN, Infinity]) {
      expect(orbitScale(bad)).toBe(0);
    }
  });
});

describe("bodyScale", () => {
  it("keeps a gas giant from swallowing its own orbit", () => {
    // Jupiter is 11x Earth in truth; on screen it must be far less.
    expect(bodyScale(11) / bodyScale(1)).toBeLessThan(3);
  });

  it("still shows a bigger planet as bigger", () => {
    expect(bodyScale(4)).toBeGreaterThan(bodyScale(1));
    expect(bodyScale(1)).toBeGreaterThan(bodyScale(0.4));
  });

  it("falls back to a visible size rather than a zero-radius sphere", () => {
    expect(bodyScale(0)).toBeGreaterThan(0);
    expect(bodyScale(Number.NaN)).toBeGreaterThan(0);
  });
});

describe("orbitPosition", () => {
  it("puts the star at a focus, not at the centre", () => {
    // On a circle the two coincide; on an ellipse they must not.
    const e = 0.5;
    const near = orbitPosition(10, e, 0);
    const far = orbitPosition(10, e, Math.PI);
    expect(Math.abs(near.x)).not.toBeCloseTo(Math.abs(far.x), 3);
  });

  it("traces a closed path", () => {
    const start = orbitPosition(10, 0.2, 0);
    const round = orbitPosition(10, 0.2, Math.PI * 2);
    expect(round.x).toBeCloseTo(start.x, 6);
    expect(round.z).toBeCloseTo(start.z, 6);
  });

  it("is a circle at zero eccentricity", () => {
    for (const theta of [0, 1, 2, 3]) {
      const p = orbitPosition(7, 0, theta);
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(7, 6);
    }
  });

  it("clamps eccentricity below 1 — a parabolic path is not an orbit", () => {
    const p = orbitPosition(10, 5, 1);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.z)).toBe(true);
  });
});

describe("bindSystem", () => {
  const star = entry("Kellis", { "star.spectral_class": "K4V" });

  it("orders bodies by true distance, not by name or entry order", () => {
    const system = bindSystem(star, [
      entry("Outer", { "orbit.semi_major_axis": 5.2 }),
      entry("Inner", { "orbit.semi_major_axis": 0.4 }),
      entry("Middle", { "orbit.semi_major_axis": 1.1 }),
    ]);
    expect(system.bodies.map((b) => b.name)).toEqual(["Inner", "Middle", "Outer"]);
  });

  it("LISTS a body with no orbital distance instead of drawing it", () => {
    const system = bindSystem(star, [
      entry("Placed", { "orbit.semi_major_axis": 1 }),
      entry("Nowhere"),
    ]);
    expect(system.bodies.map((b) => b.name)).toEqual(["Placed"]);
    expect(system.unplaced).toEqual([
      { id: expect.any(String), name: "Nowhere", reason: "No orbital distance on file." },
    ]);
  });

  it("treats a zero or negative distance as no distance", () => {
    for (const au of [0, -3]) {
      const system = bindSystem(star, [entry("Bad", { "orbit.semi_major_axis": au })]);
      expect(system.bodies).toHaveLength(0);
      expect(system.unplaced).toHaveLength(1);
    }
  });

  it("carries each planet's own material binding through", () => {
    const system = bindSystem(star, [
      entry("Locked", {
        "orbit.semi_major_axis": 0.1,
        "orbit.tidally_locked": "true",
        "planet.atmo_pressure": 0.6,
      }),
    ]);
    const body = system.bodies[0];
    expect(body.planet.surface.spin).toBe(0);
    expect(body.planet.atmosphere.present).toBe(true);
  });

  it("defaults eccentricity to a circle rather than inventing an ellipse", () => {
    const system = bindSystem(star, [entry("P", { "orbit.semi_major_axis": 1 })]);
    expect(system.bodies[0].orbit.eccentricity).toBe(0);
  });

  it("clamps a stated eccentricity into a closed orbit", () => {
    const system = bindSystem(star, [
      entry("P", { "orbit.semi_major_axis": 1, "orbit.eccentricity": 3 }),
    ]);
    expect(system.bodies[0].orbit.eccentricity).toBeLessThan(1);
  });

  it("leaves period null when nobody computed one", () => {
    const system = bindSystem(star, [entry("P", { "orbit.semi_major_axis": 1 })]);
    expect(system.bodies[0].orbit.periodYears).toBeNull();
  });

  it("binds the star through the same path as everything else", () => {
    const system = bindSystem(star, []);
    expect(system.starName).toBe("Kellis");
    // K4V with no measured temperature: inferred, and marked as such.
    expect(system.star.temperature.derived).toBe(true);
    expect(system.starDisplayRadius).toBeGreaterThan(0);
  });

  it("keeps the star small enough not to eat the inner orbits", () => {
    const huge = bindSystem(entry("Giant", { "star.radius": 40 }), [
      entry("P", { "orbit.semi_major_axis": 0.1 }),
    ]);
    expect(huge.starDisplayRadius).toBeLessThan(huge.bodies[0].displayOrbit);
  });

  it("handles a system with nothing in it", () => {
    const system = bindSystem(star, []);
    expect(system.bodies).toEqual([]);
    expect(system.unplaced).toEqual([]);
  });
});
