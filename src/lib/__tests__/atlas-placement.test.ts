// ---------------------------------------------------------------------------
// The Atlas's placement model (F5).
//
// The rule under test: an unplaced entity is UNPLACED. It is never scattered
// to a plausible spot, because then the writer cannot tell which pins they
// placed and which the software invented.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  atlasPins,
  canZoomInto,
  clampToMap,
  placedPins,
  placementPatch,
  unplacedPins,
} from "@/lib/atlas/placement";
import type { Entity, EntityType } from "@/services/entity-graph-types";

let n = 0;
function ent(over: Partial<Entity> = {}): Entity {
  n += 1;
  return {
    id: `e${n}`,
    world_id: "w",
    user_id: "u",
    name: `Entity ${n}`,
    entity_type: "star_system" as EntityType,
    custom_type_label: null,
    cascade_stage: "physics",
    color: null,
    icon: null,
    summary: null,
    image_url: null,
    description: null,
    notes: null,
    parent_entity_id: null,
    sort_order: 0,
    tags: [],
    graph_x: null,
    graph_y: null,
    pinned: false,
    metadata: {},
    created_at: "",
    updated_at: "",
    ...over,
  };
}

const at = (x: number, y: number) => ({ metadata: { atlas_x: x, atlas_y: y } });

describe("atlasPins — the galaxy level", () => {
  it("shows systems and loose stars, not their contents", () => {
    const sys = ent({ id: "sys", entity_type: "star_system" });
    const planet = ent({ id: "p", entity_type: "planet", parent_entity_id: "sys" });
    const star = ent({ id: "s", entity_type: "star" });
    const pins = atlasPins([sys, planet, star], null);
    expect(pins.map((p) => p.id).sort()).toEqual(["s", "sys"]);
  });

  it("excludes species, factions and characters — a star map is not a cast list", () => {
    const people = (["species", "faction", "character", "language"] as EntityType[]).map(
      (entity_type) => ent({ entity_type }),
    );
    expect(atlasPins(people, null)).toEqual([]);
  });

  it("counts what is inside each pin", () => {
    const sys = ent({ id: "sys" });
    const kids = [1, 2, 3].map((i) =>
      ent({ id: `p${i}`, entity_type: "planet", parent_entity_id: "sys" }),
    );
    expect(atlasPins([sys, ...kids], null)[0].childCount).toBe(3);
  });
});

describe("atlasPins — inside one entity", () => {
  it("shows that entity's children whatever their type", () => {
    const sys = ent({ id: "sys" });
    const planet = ent({ id: "p", entity_type: "planet", parent_entity_id: "sys" });
    const vessel = ent({ id: "v", entity_type: "vessel", parent_entity_id: "sys" });
    const elsewhere = ent({ id: "x", entity_type: "planet", parent_entity_id: "other" });
    const pins = atlasPins([sys, planet, vessel, elsewhere], "sys");
    expect(pins.map((p) => p.id).sort()).toEqual(["p", "v"]);
  });

  it("is empty for an entity that contains nothing", () => {
    expect(atlasPins([ent({ id: "sys" })], "sys")).toEqual([]);
  });
});

describe("placed vs unplaced — the honesty rule", () => {
  it("reads a coordinate the writer set", () => {
    const pins = atlasPins([ent({ id: "a", ...at(0.25, 0.75) })], null);
    expect(pins[0].at).toEqual({ x: 0.25, y: 0.75 });
  });

  it("reports no coordinate as unplaced rather than inventing one", () => {
    const pins = atlasPins([ent({ id: "a" })], null);
    expect(pins[0].at).toBeNull();
    expect(unplacedPins(pins).map((p) => p.id)).toEqual(["a"]);
    expect(placedPins(pins)).toEqual([]);
  });

  it("treats a corrupt or out-of-range coordinate as unplaced, never clamped", () => {
    // Clamping would silently move a pin the writer placed.
    for (const bad of [
      { atlas_x: 2, atlas_y: 0.5 },
      { atlas_x: -0.1, atlas_y: 0.5 },
      { atlas_x: "0.5", atlas_y: 0.5 },
      { atlas_x: Number.NaN, atlas_y: 0.5 },
      { atlas_x: 0.5 },
    ]) {
      expect(atlasPins([ent({ metadata: bad })], null)[0].at).toBeNull();
    }
  });

  it("orders both lists stably so a render does not reshuffle", () => {
    const pins = atlasPins(
      [
        ent({ id: "b", name: "Beta", ...at(0.2, 0.2) }),
        ent({ id: "a", name: "Alpha", ...at(0.1, 0.1) }),
        ent({ id: "z", name: "Zed" }),
        ent({ id: "m", name: "Mu" }),
      ],
      null,
    );
    expect(placedPins(pins).map((p) => p.id)).toEqual(["a", "b"]);
    expect(unplacedPins(pins).map((p) => p.name)).toEqual(["Mu", "Zed"]);
  });
});

describe("placement writes", () => {
  it("clamps a live drag into map space", () => {
    expect(clampToMap({ x: 1.4, y: -0.2 })).toEqual({ x: 1, y: 0 });
    expect(clampToMap({ x: 0.3, y: 0.9 })).toEqual({ x: 0.3, y: 0.9 });
  });

  it("rounds to a precision that is still sub-pixel on a huge map", () => {
    const patch = placementPatch({ x: 0.123456789, y: 0.987654321 });
    expect(patch).toEqual({ atlas_x: 0.123457, atlas_y: 0.987654 });
  });

  it("round-trips: what placementPatch writes, atlasPins reads back", () => {
    const patch = placementPatch({ x: 0.42, y: 0.58 });
    const pins = atlasPins([ent({ metadata: patch })], null);
    expect(pins[0].at).toEqual({ x: 0.42, y: 0.58 });
  });
});

describe("canZoomInto", () => {
  it("is true only when something is actually inside", () => {
    const sys = ent({ id: "sys" });
    const child = ent({ entity_type: "planet", parent_entity_id: "sys" });
    expect(canZoomInto(atlasPins([sys, child], null)[0])).toBe(true);
    expect(canZoomInto(atlasPins([ent({ id: "empty" })], null)[0])).toBe(false);
  });
});
