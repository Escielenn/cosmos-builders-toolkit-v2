// ---------------------------------------------------------------------------
// Territory (G4) — a border is counted, never declared.
//
// The rules under test:
//   1. A territory is the set of anchored systems a polity holds via an edge
//      the writer drew. Nothing is generated.
//   2. Direction is not assumed — `governs` drawn either way round means the
//      same thing, and neither reading may invent a polity.
//   3. A claim that cannot be drawn is NAMED, not dropped.
//   4. A contested system has two holders, and the map does not pick one.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  TERRITORY_VERBS,
  buildTerritories,
  centroidOf,
  greatestSpanLy,
  holdersOf,
  isTerritoryVerb,
} from "@/gl/bind/territory";
import {
  buildGalaxyField,
  parseCatalog,
  separationLy,
  type CatalogRow,
} from "@/gl/bind/starfield";
import {
  ALL_RELATIONSHIP_TYPES,
  type Entity,
  type EntityConnection,
} from "@/services/entity-graph-types";

const ROWS: CatalogRow[] = [
  ["Sirius", 101.287, -16.716, 2.64, -1.43, -0.01],
  ["Tau Ceti", 26.017, -15.937, 3.65, 5.69, 0.72],
  ["Procyon", 114.827, 5.225, 3.51, 2.68, 0.42],
  ["Altair", 297.696, 8.868, 5.13, 2.2, 0.22],
];
const catalog = parseCatalog(ROWS);

const sys = (id: string, name: string, anchor: string | null): Entity =>
  ({
    id,
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

const faction = (id: string, name: string, color: string | null = null): Entity =>
  ({
    id,
    world_id: "w",
    user_id: "u",
    name,
    entity_type: "faction",
    cascade_stage: "culture",
    color,
    parent_entity_id: null,
    tags: [],
    metadata: {},
    created_at: "",
    updated_at: "",
  }) as unknown as Entity;

let n = 0;
const edge = (source: string, target: string, verb: string): EntityConnection =>
  ({
    id: `c${++n}`,
    world_id: "w",
    user_id: "u",
    source_entity_id: source,
    target_entity_id: target,
    relationship_type: verb,
    relationship_label: null,
    cascade_stage: "culture",
    bidirectional: false,
    strength: 1,
    status: "active",
    time_start: null,
    time_end: null,
    notes: null,
    metadata: {},
    sort_order: 0,
    created_at: "",
    updated_at: "",
  }) as unknown as EntityConnection;

const KELLIS = sys("k", "Kellis", "Tau Ceti");
const HALDEN = sys("h", "Halden", "Sirius");
const PROC = sys("p", "Procyon Station", "Procyon");
const ALT = sys("a", "Altair Reach", "Altair");
const DRIFT = sys("d", "Drift", null);
const COMPACT = faction("f1", "The Compact", "#9B5DE5");
const HEGEMONY = faction("f2", "Hegemony", null);

const ALL = [KELLIS, HALDEN, PROC, ALT, DRIFT, COMPACT, HEGEMONY];
const field = buildGalaxyField(catalog, ALL);

describe("the territory vocabulary is real", () => {
  it("uses only verbs the connection editor can produce", () => {
    for (const verb of TERRITORY_VERBS) {
      expect(ALL_RELATIONSHIP_TYPES).toContain(verb);
    }
  });

  it("does not treat a route verb as a border", () => {
    // colonized_by is a crossing that happened, not a claim on file.
    expect(isTerritoryVerb("colonized_by")).toBe(false);
    expect(isTerritoryVerb("travels_via")).toBe(false);
    expect(isTerritoryVerb("allied_with")).toBe(false);
    expect(isTerritoryVerb("governs")).toBe(true);
  });
});

describe("buildTerritories", () => {
  it("counts the systems a polity holds", () => {
    const { territories } = buildTerritories(
      field.systems,
      [edge("f1", "k", "governs"), edge("f1", "h", "governs")],
      ALL,
    );
    expect(territories).toHaveLength(1);
    expect(territories[0].name).toBe("The Compact");
    expect(territories[0].systems.map((s) => s.name).sort()).toEqual([
      "Halden",
      "Kellis",
    ]);
  });

  it("reads the edge either way round — a writer may draw it in either direction", () => {
    const forward = buildTerritories(
      field.systems,
      [edge("f1", "k", "governs"), edge("f1", "h", "rules")],
      ALL,
    );
    const backward = buildTerritories(
      field.systems,
      [edge("k", "f1", "governs"), edge("h", "f1", "rules")],
      ALL,
    );
    expect(backward.territories[0].systems.map((s) => s.id).sort()).toEqual(
      forward.territories[0].systems.map((s) => s.id).sort(),
    );
    expect(backward.territories[0].id).toBe("f1");
  });

  it("does not invent a polity out of a system-to-system edge", () => {
    const { territories, unmappable } = buildTerritories(
      field.systems,
      [edge("k", "h", "governs")],
      ALL,
    );
    expect(territories).toEqual([]);
    expect(unmappable).toEqual([]);
  });

  it("ignores an edge whose polity end is not an entity on file", () => {
    const { territories } = buildTerritories(
      field.systems,
      [edge("ghost", "k", "governs")],
      ALL,
    );
    expect(territories).toEqual([]);
  });

  it("does not count the same system twice", () => {
    const { territories } = buildTerritories(
      field.systems,
      [
        edge("f1", "k", "governs"),
        edge("f1", "k", "rules"),
        edge("k", "f1", "governs"),
        edge("f1", "h", "governs"),
      ],
      ALL,
    );
    expect(territories[0].systems).toHaveLength(2);
  });

  it("NAMES a polity that holds one anchored system instead of drawing a border", () => {
    const { territories, unmappable } = buildTerritories(
      field.systems,
      [edge("f1", "k", "governs")],
      ALL,
    );
    expect(territories).toEqual([]);
    expect(unmappable).toHaveLength(1);
    expect(unmappable[0].name).toBe("The Compact");
    expect(unmappable[0].reason).toMatch(/single point/i);
  });

  it("NAMES a polity whose every holding is unanchored", () => {
    const { territories, unmappable } = buildTerritories(
      field.systems,
      [edge("f1", "d", "governs")],
      ALL,
    );
    expect(territories).toEqual([]);
    expect(unmappable[0].reason).toMatch(/anchored/i);
  });

  it("survives an empty world", () => {
    expect(buildTerritories([], [], [])).toEqual({
      territories: [],
      unmappable: [],
    });
  });

  it("carries the writer's own colour through, and null when they set none", () => {
    const { territories } = buildTerritories(
      field.systems,
      [
        edge("f1", "k", "governs"),
        edge("f1", "h", "governs"),
        edge("f2", "p", "governs"),
        edge("f2", "a", "governs"),
      ],
      ALL,
    );
    const compact = territories.find((t) => t.id === "f1")!;
    const hegemony = territories.find((t) => t.id === "f2")!;
    expect(compact.colour).toBe("#9B5DE5");
    expect(hegemony.colour).toBeNull();
  });
});

describe("what a territory tells a writer", () => {
  const { territories } = buildTerritories(
    field.systems,
    [
      edge("f1", "k", "governs"),
      edge("f1", "h", "governs"),
      edge("f1", "a", "governs"),
    ],
    ALL,
  );
  const compact = territories[0];

  it("measures how far the polity reaches, between real positions", () => {
    // The span is the LARGEST pairwise separation, not the average and not
    // the distance from a centroid — "how far apart are my two furthest
    // holdings" is the question a drive has to answer.
    let expected = 0;
    for (let i = 0; i < compact.systems.length; i += 1) {
      for (let j = i + 1; j < compact.systems.length; j += 1) {
        expected = Math.max(
          expected,
          separationLy(
            compact.systems[i].position!,
            compact.systems[j].position!,
          ),
        );
      }
    }
    expect(compact.spanLy).toBeCloseTo(expected, 9);
    expect(compact.spanLy).toBeGreaterThan(0);
  });

  it("puts the centroid inside the holdings, not at the origin", () => {
    const c = centroidOf(compact.systems);
    expect(c).toEqual(compact.centroid);
    expect(Math.hypot(...c)).toBeGreaterThan(0);
  });

  it("is zero span for a single point and empty input", () => {
    expect(greatestSpanLy([])).toBe(0);
    expect(greatestSpanLy([compact.systems[0]])).toBe(0);
    expect(centroidOf([])).toEqual([0, 0, 0]);
  });
});

describe("contested space", () => {
  it("reports BOTH holders of a system and does not pick a winner", () => {
    const { territories } = buildTerritories(
      field.systems,
      [
        edge("f1", "k", "governs"),
        edge("f1", "h", "governs"),
        edge("f2", "k", "governs"), // the same system, a second claim
        edge("f2", "p", "governs"),
      ],
      ALL,
    );
    const holders = holdersOf(territories, "k");
    expect(holders.map((t) => t.name).sort()).toEqual([
      "Hegemony",
      "The Compact",
    ]);
  });

  it("returns nothing for a system nobody holds", () => {
    const { territories } = buildTerritories(
      field.systems,
      [edge("f1", "k", "governs"), edge("f1", "h", "governs")],
      ALL,
    );
    expect(holdersOf(territories, "a")).toEqual([]);
  });
});
