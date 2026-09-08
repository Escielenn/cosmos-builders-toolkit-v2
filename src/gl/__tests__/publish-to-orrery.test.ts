// ---------------------------------------------------------------------------
// The publish → orrery path (the Prime Law, end to end).
//
// "Does this shorten the distance between a number the writer decided and a
// sentence the writer wrote?" A writer sets a planet's orbital distance in
// Solaris and publishes it. The Atlas's system level draws every body where
// its orbital distance says. Those are the same number, and the only question
// that matters is whether it survives the trip.
//
// It did not. Solaris publishes `planet.orbital_distance_au`; bind/system.ts
// reads `orbit.semi_major_axis`, which is the name 08-VOCABULARY declares and
// which NOTHING IN THE APP WRITES. So a published planet arrived at the orrery
// carrying its distance and was reported unplaced.
//
// These tests are built from the real publish builder rather than a hand-made
// entry, because the bug lived exactly in the gap between what that builder
// writes and what the renderer reads. A fixture with the "right" key in it
// would have passed while the product stayed broken.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  PREDICATE_ALIASES,
  buildPublishedMetadata,
  predicateSpellings,
  solarisPlanetPublishFacts,
} from "@/lib/simulators/published-facts";
import type { HandoffPayload } from "@/lib/simulators/handoff";
import { bindSystem } from "@/gl/bind/system";
import type { WorldEntry } from "@/services/world-data";

const PAYLOAD: HandoffPayload = {
  from: "solaris",
  starType: "yellow",
  starMassLum: 1.0,
  planetAU: 1.4,
  planetName: "Kellis II",
  planetType: "terrestrial",
  systemName: "Kellis",
};

/** An entry exactly as a Solaris publish leaves it. */
function publishedPlanet(payload = PAYLOAD): WorldEntry {
  const metadata = buildPublishedMetadata(solarisPlanetPublishFacts(payload), {
    toolId: "solaris",
    runId: "run-1",
    seed: null,
  });
  return {
    id: "planet-1",
    world_id: "w",
    user_id: "u",
    title: payload.planetName,
    entry_type: "planet",
    content: null,
    parent_id: "star-1",
    metadata,
    created_at: "",
    updated_at: "",
  } as unknown as WorldEntry;
}

const star: WorldEntry = {
  id: "star-1",
  world_id: "w",
  user_id: "u",
  title: "Kellis",
  entry_type: "star",
  content: null,
  parent_id: null,
  metadata: { "star.spectral_class": "G2V" },
  created_at: "",
  updated_at: "",
} as unknown as WorldEntry;

describe("a planet published from Solaris reaches the orrery", () => {
  it("is PLACED, not reported unplaced", () => {
    const bound = bindSystem(star, [publishedPlanet()]);
    expect(bound.unplaced).toEqual([]);
    expect(bound.bodies).toHaveLength(1);
  });

  it("sits at the distance the writer set in the simulator", () => {
    const bound = bindSystem(star, [publishedPlanet()]);
    expect(bound.bodies[0].orbit.semiMajorAxisAU).toBeCloseTo(1.4, 3);
  });

  it("carries the same number the publish diff showed", () => {
    // The reviewable diff and the ring must not be able to disagree.
    const facts = solarisPlanetPublishFacts(PAYLOAD);
    const shown = facts.find((f) => f.predicate === "planet.orbital_distance_au")!;
    const bound = bindSystem(star, [publishedPlanet()]);
    expect(bound.bodies[0].orbit.semiMajorAxisAU).toBeCloseTo(Number(shown.value), 6);
  });

  it("works for a close-in world and a distant one alike", () => {
    for (const au of [0.05, 0.4, 9.6, 40]) {
      const bound = bindSystem(star, [
        publishedPlanet({ ...PAYLOAD, planetAU: au }),
      ]);
      expect(bound.unplaced).toEqual([]);
      expect(bound.bodies[0].orbit.semiMajorAxisAU).toBeCloseTo(au, 3);
    }
  });
});

describe("the canonical name still wins", () => {
  it("prefers orbit.semi_major_axis when both are present", () => {
    // The alias exists to rescue an older publish, never to outrank the name
    // 08-VOCABULARY declares.
    const entry = publishedPlanet();
    const meta = entry.metadata as { _published_facts: unknown[] };
    meta._published_facts = [
      ...(meta._published_facts as Array<Record<string, unknown>>),
      { predicate: "orbit.semi_major_axis", label: "Semi-major axis", value: 3.3 },
    ];
    const bound = bindSystem(star, [entry]);
    expect(bound.bodies[0].orbit.semiMajorAxisAU).toBeCloseTo(3.3, 6);
  });

  it("still reports a planet with NO distance at all as unplaced", () => {
    // The alias must not become a way to invent an orbit for something that
    // has none. That rule is the whole point of bind/system.ts.
    const bare = {
      ...publishedPlanet(),
      metadata: {},
    } as unknown as WorldEntry;
    const bound = bindSystem(star, [bare]);
    expect(bound.bodies).toEqual([]);
    expect(bound.unplaced).toHaveLength(1);
  });
});

describe("the alias table", () => {
  it("resolves in both directions, so an old reader and a new one agree", () => {
    expect(predicateSpellings("orbit.semi_major_axis")).toContain(
      "planet.orbital_distance_au",
    );
    expect(predicateSpellings("planet.orbital_distance_au")).toContain(
      "orbit.semi_major_axis",
    );
  });

  it("puts the requested name first, so an exact match always wins", () => {
    expect(predicateSpellings("orbit.semi_major_axis")[0]).toBe(
      "orbit.semi_major_axis",
    );
    expect(predicateSpellings("planet.orbital_distance_au")[0]).toBe(
      "planet.orbital_distance_au",
    );
  });

  it("leaves a predicate with no alias alone", () => {
    expect(predicateSpellings("planet.albedo")).toEqual(["planet.albedo"]);
  });

  it("never maps a canonical name onto itself twice", () => {
    for (const name of Object.keys(PREDICATE_ALIASES)) {
      const spellings = predicateSpellings(name);
      expect(new Set(spellings).size).toBe(spellings.length);
    }
  });
});

describe("no new predicate arrives unnoticed", () => {
  it("pins exactly what a Solaris publish writes", () => {
    // This list is the contract between a simulator and every reader. Adding
    // to it is fine; doing so WITHOUT deciding which name readers already use
    // is what put a planet's orbital distance out of the orrery's reach. If
    // this fails, add the predicate here and check that whatever reads that
    // fact asks for the same spelling — or add an alias.
    expect(solarisPlanetPublishFacts(PAYLOAD).map((f) => f.predicate).sort()).toEqual([
      "planet.name",
      "planet.orbital_distance_au",
      "planet.type",
      "star.luminosity_lsun",
      "star.spectral_class",
      "system.name",
    ]);
  });
});
