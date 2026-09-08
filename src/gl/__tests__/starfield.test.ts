// ---------------------------------------------------------------------------
// G4 — real stars and invented ones on one chart.
//
// The owner's decision (2026-09-08): allow both. So the rule under test is the
// sharpest form of the one the Atlas and the Timeline already hold — a
// catalogue position and a position the writer chose must never wear the same
// dot, and no code path may lose track of which it is holding.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildGalaxyField,
  bvToKelvin,
  distanceFromSolLy,
  findCatalogStar,
  nearestNeighbours,
  parseCatalog,
  readAnchorName,
  separationLy,
  type CatalogRow,
} from "@/gl/bind/starfield";
import type { Entity } from "@/services/entity-graph-types";

const ROWS: CatalogRow[] = [
  ["Sirius", 101.287, -16.716, 2.64, -1.43, -0.01],
  ["Tau Ceti", 26.017, -15.937, 3.65, 5.69, 0.72],
  ["Procyon", 114.827, 5.225, 3.51, 2.68, 0.42],
  ["Betelgeuse", 88.793, 7.407, 197, -5.14, 1.85],
];

let n = 0;
const ent = (over: Partial<Entity> = {}): Entity =>
  ({
    id: `e${++n}`,
    world_id: "w",
    user_id: "u",
    name: `System ${n}`,
    entity_type: "star_system",
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
  }) as Entity;

describe("bvToKelvin", () => {
  it("gives the Sun its accepted temperature", () => {
    // B−V 0.65 → 5778 K. If this drifts, every star colour is wrong.
    expect(bvToKelvin(0.65)).toBeCloseTo(5778, 0);
  });

  it("makes redder stars cooler and bluer stars hotter", () => {
    expect(bvToKelvin(1.85)).toBeLessThan(bvToKelvin(0.65));
    expect(bvToKelvin(-0.01)).toBeGreaterThan(bvToKelvin(0.65));
  });

  it("stays finite on nonsense input", () => {
    for (const bv of [Number.NaN, Infinity, -99, 99]) {
      const k = bvToKelvin(bv);
      expect(Number.isFinite(k)).toBe(true);
      expect(k).toBeGreaterThan(0);
    }
  });
});

describe("parseCatalog", () => {
  it("reads the shipped row shape", () => {
    const stars = parseCatalog(ROWS);
    expect(stars).toHaveLength(4);
    const sirius = stars[0];
    expect(sirius.kind).toBe("catalog");
    expect(sirius.name).toBe("Sirius");
    expect(sirius.distancePc).toBeCloseTo(2.64, 3);
    expect(sirius.position).toHaveLength(3);
  });

  it("gives each star a colour from its own colour index", () => {
    const [sirius, , , betelgeuse] = parseCatalog(ROWS);
    // Sirius is blue-white, Betelgeuse deep red.
    expect(sirius.colour.b).toBeGreaterThan(sirius.colour.r);
    expect(betelgeuse.colour.r).toBeGreaterThan(betelgeuse.colour.b);
  });

  it("drops malformed rows rather than inventing values for them", () => {
    const junk = [
      ["OnlyName"],
      ["Bad", "x", 1, 1, 1, 1],
      ["", 1, 1, 1, 1, 1],
      ["Negative", 1, 1, -5, 1, 1],
      null,
      42,
    ];
    expect(parseCatalog(junk)).toEqual([]);
  });

  it("survives a catalogue that is not an array at all", () => {
    expect(parseCatalog(null)).toEqual([]);
    expect(parseCatalog({})).toEqual([]);
  });

  it("puts a nearer star nearer to the origin", () => {
    const stars = parseCatalog(ROWS);
    const mag = (s: (typeof stars)[number]) => Math.hypot(...s.position);
    expect(mag(stars[0])).toBeLessThan(mag(stars[3])); // Sirius vs Betelgeuse
  });
});

describe("findCatalogStar", () => {
  const catalog = parseCatalog(ROWS);

  it("matches a name exactly", () => {
    expect(findCatalogStar(catalog, "Tau Ceti")?.name).toBe("Tau Ceti");
  });

  it("tolerates case and spacing, because a name is the catalogue's id", () => {
    expect(findCatalogStar(catalog, "tau  ceti")?.name).toBe("Tau Ceti");
    expect(findCatalogStar(catalog, "  SIRIUS ")?.name).toBe("Sirius");
  });

  it("does NOT match something merely similar", () => {
    expect(findCatalogStar(catalog, "Tau")).toBeNull();
    expect(findCatalogStar(catalog, "Ceti")).toBeNull();
    expect(findCatalogStar(catalog, "Sirius B")).toBeNull();
  });

  it("is null for nothing", () => {
    expect(findCatalogStar(catalog, null)).toBeNull();
    expect(findCatalogStar(catalog, "   ")).toBeNull();
  });
});

describe("buildGalaxyField — the two kinds never merge", () => {
  const catalog = parseCatalog(ROWS);

  it("anchors a system to a real star and takes its real position", () => {
    const field = buildGalaxyField(catalog, [
      ent({ name: "Kellis", metadata: { anchor_star: "Tau Ceti" } }),
    ]);
    const system = field.systems[0];
    expect(system.kind).toBe("world");
    expect(system.anchor?.name).toBe("Tau Ceti");
    expect(system.positionIsReal).toBe(true);
    expect(system.position).toEqual(findCatalogStar(catalog, "Tau Ceti")!.position);
  });

  it("keeps an anchored system a WORLD, never a catalogue star", () => {
    // A renderer must always be able to tell which it is holding.
    const field = buildGalaxyField(catalog, [
      ent({ name: "Kellis", metadata: { anchor_star: "Sirius" } }),
    ]);
    expect(field.systems[0].kind).toBe("world");
    expect(field.stars.every((s) => s.kind === "catalog")).toBe(true);
    // And the catalogue is untouched by anchoring.
    expect(field.stars).toHaveLength(ROWS.length);
  });

  it("LISTS an unanchored system instead of placing it", () => {
    const field = buildGalaxyField(catalog, [ent({ name: "Nowhere" })]);
    expect(field.systems).toEqual([]);
    expect(field.unplaced.map((s) => s.name)).toEqual(["Nowhere"]);
    expect(field.unplaced[0].position).toBeNull();
    expect(field.unplaced[0].positionIsReal).toBe(false);
  });

  it("treats an anchor that names no catalogue star as no anchor", () => {
    const field = buildGalaxyField(catalog, [
      ent({ name: "Bad", metadata: { anchor_star: "Krypton" } }),
    ]);
    expect(field.unplaced.map((s) => s.name)).toEqual(["Bad"]);
    expect(field.unplaced[0].anchor).toBeNull();
  });

  it("ignores entities that are not systems — a species is not on a star map", () => {
    const field = buildGalaxyField(catalog, [
      ent({ entity_type: "species", metadata: { anchor_star: "Sirius" } }),
      ent({ entity_type: "character" }),
    ]);
    expect(field.systems).toEqual([]);
    expect(field.unplaced).toEqual([]);
  });

  it("orders both lists stably", () => {
    const field = buildGalaxyField(catalog, [
      ent({ name: "Zed", metadata: { anchor_star: "Sirius" } }),
      ent({ name: "Alpha", metadata: { anchor_star: "Procyon" } }),
      ent({ name: "Yew" }),
      ent({ name: "Beta" }),
    ]);
    expect(field.systems.map((s) => s.name)).toEqual(["Alpha", "Zed"]);
    expect(field.unplaced.map((s) => s.name)).toEqual(["Beta", "Yew"]);
  });
});

describe("readAnchorName", () => {
  it("reads a set anchor and ignores an empty one", () => {
    expect(readAnchorName(ent({ metadata: { anchor_star: "Vega" } }))).toBe("Vega");
    expect(readAnchorName(ent({ metadata: { anchor_star: "  " } }))).toBeNull();
    expect(readAnchorName(ent({ metadata: { anchor_star: 42 } }))).toBeNull();
    expect(readAnchorName(ent({}))).toBeNull();
  });
});

describe("what anchoring is for — real numbers", () => {
  const catalog = parseCatalog(ROWS);

  it("reports distance from Sol in light years", () => {
    // Sirius is 8.6 ly.
    const sirius = findCatalogStar(catalog, "Sirius")!;
    expect(distanceFromSolLy(sirius)).toBeCloseTo(8.61, 1);
  });

  it("measures true 3D separation, not a difference of distances", () => {
    const sirius = findCatalogStar(catalog, "Sirius")!;
    const procyon = findCatalogStar(catalog, "Procyon")!;
    // Sirius and Procyon are both ~3 pc away but far apart on the sky, so
    // their separation must exceed the difference of their distances.
    const naive = Math.abs(sirius.distancePc - procyon.distancePc) * 3.26156;
    expect(separationLy(sirius.position, procyon.position)).toBeGreaterThan(naive);
  });

  it("is zero from a star to itself", () => {
    const sirius = findCatalogStar(catalog, "Sirius")!;
    expect(separationLy(sirius.position, sirius.position)).toBeCloseTo(0, 9);
  });

  it("lists nearest neighbours in order, excluding the origin", () => {
    const tau = findCatalogStar(catalog, "Tau Ceti")!;
    const near = nearestNeighbours(catalog, tau, 3);
    expect(near.map((x) => x.star.name)).not.toContain("Tau Ceti");
    for (let i = 1; i < near.length; i += 1) {
      expect(near[i].separationLy).toBeGreaterThanOrEqual(near[i - 1].separationLy);
    }
    // Betelgeuse at 197 pc must not outrank the nearby stars.
    expect(near[0].star.name).not.toBe("Betelgeuse");
  });

  it("returns nothing rather than throwing when asked for none", () => {
    const tau = findCatalogStar(catalog, "Tau Ceti")!;
    expect(nearestNeighbours(catalog, tau, 0)).toEqual([]);
    expect(nearestNeighbours([], tau)).toEqual([]);
  });
});
