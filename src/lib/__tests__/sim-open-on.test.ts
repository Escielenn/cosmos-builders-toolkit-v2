// ---------------------------------------------------------------------------
// open-on (Brief S1) — a simulator hydrating from the entity it opened ON.
//
// The rule these tests exist to hold: a simulator reads PREDICATES, never a
// producer. Nothing in open-on.ts may branch on `_source.tool_id`, and no
// mapping may feed a value into a control that means something else.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { buildSimSeed, OPEN_ON_SIMULATORS } from "@/lib/simulators/open-on";
import type { WorldEntry } from "@/services/world-data";

function entry(over: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "e1",
    world_id: "w1",
    entry_type: "planet",
    title: "Kellis Prime",
    content: null,
    metadata: {},
    sort_order: 0,
    parent_id: null,
    icon: null,
    color: null,
    tool_source: null,
    tool_data_id: null,
    layer: null,
    cover_image_url: null,
    tags: [],
    created_by: "u1",
    created_at: "",
    updated_at: "",
    ...over,
  } as WorldEntry;
}

const published = (facts: Array<{ predicate: string; value: number | string }>) =>
  entry({
    metadata: {
      _published_facts: facts.map((f) => ({ ...f, label: f.predicate })),
      _source: { kind: "sim", tool_id: "solaris", run_id: "r1", seed: null, published_at: "" },
    },
  });

describe("buildSimSeed", () => {
  it("returns null for a simulator with no seed builder", () => {
    expect(buildSimSeed("tidelock", published([{ predicate: "planet.radius", value: 1 }]))).toBeNull();
    expect(buildSimSeed("not-a-sim", published([{ predicate: "planet.radius", value: 1 }]))).toBeNull();
  });

  it("returns null for a missing entry rather than an empty seed", () => {
    expect(buildSimSeed("exoforge", null)).toBeNull();
    expect(buildSimSeed("exoforge", undefined)).toBeNull();
  });

  describe("exoforge — a planet, so a planet's canon lands on it", () => {
    it("maps each predicate onto the control that means the same quantity", () => {
      const seed = buildSimSeed(
        "exoforge",
        published([
          { predicate: "planet.radius", value: 1.02 },
          { predicate: "planet.mass", value: 1.47 },
          { predicate: "planet.temp_mean", value: 288 },
          { predicate: "planet.rotation_period", value: 1.03 },
          { predicate: "planet.hydrosphere_fraction", value: 71 },
          { predicate: "planet.atmo_pressure", value: 1.0 },
          { predicate: "star.temp_effective", value: 5778 },
        ]),
      );
      expect(seed).toMatchObject({
        radius: 1.02,
        mass: 1.47,
        temp: 288,
        period: 1.03,
        ocean: 71,
        atmo: 1.0,
        starTemp: 5778,
        name: "Kellis Prime",
      });
    });

    it("falls back to the entity's own master fields when nothing was published", () => {
      const seed = buildSimSeed(
        "exoforge",
        entry({ metadata: { radius: "1.02", mass: "1.47", surfaceTemperature: "288" } }),
      );
      expect(seed).toMatchObject({ radius: 1.02, mass: 1.47, temp: 288 });
    });

    it("parses master fields that carry their unit as text", () => {
      const seed = buildSimSeed("exoforge", entry({ metadata: { radius: "1.02 R⊕" } }));
      expect(seed?.radius).toBe(1.02);
    });

    it("omits a value it cannot read rather than seeding a zero", () => {
      const seed = buildSimSeed("exoforge", entry({ metadata: { radius: "unknown" } }));
      expect(seed === null || !("radius" in seed)).toBe(true);
    });

    it("accepts mass_earths as an alias for mass", () => {
      const seed = buildSimSeed("exoforge", published([{ predicate: "planet.mass_earths", value: 3.1 }]));
      expect(seed?.mass).toBe(3.1);
    });
  });

  describe("rogue — the intruder is invented, not read", () => {
    it("NEVER seeds mass, speed, angle or distance from the subject", () => {
      // Rogue's p.mass is the INTRUDER's mass. Feeding a planet's mass to it
      // would be a category error the writer could not see.
      const seed = buildSimSeed(
        "rogue",
        published([
          { predicate: "planet.mass", value: 1.47 },
          { predicate: "planet.radius", value: 1.02 },
        ]),
      );
      for (const forbidden of ["mass", "speed", "angle", "dist", "intruderType"]) {
        expect(seed ?? {}).not.toHaveProperty(forbidden);
      }
    });

    it("names the host system and stops there", () => {
      const seed = buildSimSeed("rogue", entry({ title: "Anseth" }));
      expect(seed).toEqual({ currentSystem: "Anseth" });
    });
  });

  describe("solaris — only what unambiguously matches", () => {
    it("seeds the system name and body count", () => {
      const seed = buildSimSeed(
        "solaris",
        entry({ title: "Anseth", metadata: {
          _published_facts: [{ predicate: "system.body_count", label: "Bodies", value: 6 }],
        } }),
      );
      expect(seed).toEqual({ systemName: "Anseth", planetCount: 6 });
    });

    it("does not guess at its own architecture vocabulary", () => {
      const seed = buildSimSeed(
        "solaris",
        published([{ predicate: "system.configuration", value: "binary" }]),
      );
      for (const forbidden of ["arch", "starMode", "bsep", "csep", "dsep"]) {
        expect(seed ?? {}).not.toHaveProperty(forbidden);
      }
    });
  });

  it("never reads _source.tool_id to change what it seeds", () => {
    const facts = [{ predicate: "planet.radius", value: 1.02 }];
    const fromSolaris = published(facts);
    const fromExosky = entry({
      metadata: {
        _published_facts: facts.map((f) => ({ ...f, label: f.predicate })),
        _source: { kind: "sim", tool_id: "exosky", run_id: "r2", seed: null, published_at: "" },
      },
    });
    expect(buildSimSeed("exoforge", fromSolaris)).toEqual(buildSimSeed("exoforge", fromExosky));
  });

  it("declares which simulators can hydrate, so a sixth cannot be added silently", () => {
    expect(OPEN_ON_SIMULATORS.sort()).toEqual(["exoforge", "rogue", "solaris"]);
  });
});
