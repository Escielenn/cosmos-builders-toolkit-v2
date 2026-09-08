// ---------------------------------------------------------------------------
// Hyperlanes (G4) — a lane is an edge the writer drew, and its length is measured.
//
// Two rules are under test, and they are the same rule the rest of the engine
// holds:
//
//   1. A lane is never invented. It comes from a `world_connections` row.
//   2. A lane's LENGTH is never invented either. It is computed from the two
//      anchors' real catalogue positions, or it is null.
//
// The second is why `route.distance_ly` stops being an orphan predicate. It is
// derived, not typed in — so it cannot be wrong in the way a hand-entered
// number can.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  ROUTE_VERBS,
  buildLanes,
  isRouteVerb,
  longestHop,
  networkLengthLy,
} from "@/gl/bind/routes";
import {
  buildGalaxyField,
  findCatalogStar,
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
  ["Betelgeuse", 88.793, 7.407, 197, -5.14, 1.85],
];

const catalog = parseCatalog(ROWS);

const ent = (id: string, name: string, anchor?: string): Entity =>
  ({
    id,
    world_id: "w",
    user_id: "u",
    name,
    entity_type: "star_system",
    cascade_stage: "physics",
    parent_entity_id: null,
    tags: [],
    metadata: anchor ? { anchor_star: anchor } : {},
    created_at: "",
    updated_at: "",
  }) as unknown as Entity;

let edgeN = 0;
const edge = (
  source: string,
  target: string,
  verb: string,
): EntityConnection =>
  ({
    id: `c${++edgeN}`,
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

// Two anchored systems and one that is not anchored anywhere.
const KELLIS = ent("k", "Kellis", "Tau Ceti");
const HALDEN = ent("h", "Halden", "Sirius");
const DRIFT = ent("d", "Drift");
const field = buildGalaxyField(catalog, [KELLIS, HALDEN, DRIFT]);

describe("the route vocabulary is real", () => {
  it("uses only verbs the connection editor can actually produce", () => {
    // If a verb here is not in the taxonomy, no writer could ever draw this
    // lane, and the layer would be decoration.
    for (const verb of ROUTE_VERBS) {
      expect(ALL_RELATIONSHIP_TYPES).toContain(verb);
    }
  });

  it("excludes political verbs — an alliance is not a road", () => {
    expect(isRouteVerb("allied_with")).toBe(false);
    expect(isRouteVerb("enemy_of")).toBe(false);
    expect(isRouteVerb("governs")).toBe(false);
    expect(isRouteVerb("travels_via")).toBe(true);
  });
});

describe("buildLanes", () => {
  it("draws a lane between two anchored systems", () => {
    const { lanes } = buildLanes(field.systems, [edge("k", "h", "travels_via")]);
    expect(lanes).toHaveLength(1);
    expect(lanes[0].from.name).toBe("Kellis");
    expect(lanes[0].to.name).toBe("Halden");
    expect(lanes[0].measured).toBe(true);
  });

  it("MEASURES the lane from the anchors' real positions", () => {
    // The whole point: route.distance_ly is derived, never typed in.
    const { lanes } = buildLanes(field.systems, [edge("k", "h", "trades_with")]);
    const tau = findCatalogStar(catalog, "Tau Ceti")!;
    const sirius = findCatalogStar(catalog, "Sirius")!;
    expect(lanes[0].distanceLy).toBeCloseTo(
      separationLy(tau.position, sirius.position),
      9,
    );
    // And it is a real number of light years, not a scene unit.
    expect(lanes[0].distanceLy).toBeGreaterThan(1);
  });

  it("ignores edges that are not routes", () => {
    const { lanes, undrawable } = buildLanes(field.systems, [
      edge("k", "h", "allied_with"),
      edge("k", "h", "enemy_of"),
    ]);
    expect(lanes).toEqual([]);
    // Not drawable is not the same as not a route: these were never routes,
    // so they are not reported as blocked either.
    expect(undrawable).toEqual([]);
  });

  it("REPORTS a route to an unanchored system instead of guessing where it goes", () => {
    const { lanes, undrawable } = buildLanes(field.systems, [
      edge("k", "d", "travels_via"),
    ]);
    expect(lanes).toEqual([]);
    expect(undrawable).toHaveLength(1);
    expect(undrawable[0].reason).toMatch(/anchored/i);
  });

  it("reports an edge to an entity that is not a system at all", () => {
    const { lanes, undrawable } = buildLanes(field.systems, [
      edge("k", "does-not-exist", "trades_with"),
    ]);
    expect(lanes).toEqual([]);
    expect(undrawable).toHaveLength(1);
  });

  it("refuses a lane from a system to itself", () => {
    const { lanes, undrawable } = buildLanes(field.systems, [
      edge("k", "k", "travels_via"),
    ]);
    expect(lanes).toEqual([]);
    expect(undrawable[0].reason).toMatch(/same system/i);
  });

  it("survives an empty world without throwing", () => {
    expect(buildLanes([], [])).toEqual({ lanes: [], undrawable: [] });
    expect(buildLanes(field.systems, [])).toEqual({ lanes: [], undrawable: [] });
  });

  it("orders lanes shortest first, so long hops do not overdraw short ones", () => {
    const three = buildGalaxyField(catalog, [
      KELLIS,
      HALDEN,
      ent("p", "Procyon Station", "Procyon"),
      ent("b", "Far Watch", "Betelgeuse"),
    ]);
    const { lanes } = buildLanes(three.systems, [
      edge("k", "b", "travels_via"), // Tau Ceti → Betelgeuse, ~600 ly
      edge("k", "h", "travels_via"), // Tau Ceti → Sirius, short
      edge("h", "p", "travels_via"), // Sirius → Procyon, short
    ]);
    for (let i = 1; i < lanes.length; i += 1) {
      expect(lanes[i].distanceLy!).toBeGreaterThanOrEqual(
        lanes[i - 1].distanceLy!,
      );
    }
  });
});

describe("what the lane layer tells a writer", () => {
  const built = buildLanes(field.systems, [
    edge("k", "h", "travels_via"),
    edge("h", "k", "trades_with"),
  ]);

  it("adds up the network, so a drive has a total to answer for", () => {
    const total = networkLengthLy(built.lanes);
    expect(total).toBeCloseTo(
      built.lanes.reduce((s, l) => s + l.distanceLy!, 0),
      9,
    );
  });

  it("names the longest hop — the one the ship has to be able to make", () => {
    const hop = longestHop(built.lanes);
    expect(hop).not.toBeNull();
    for (const lane of built.lanes) {
      expect(hop!.distanceLy!).toBeGreaterThanOrEqual(lane.distanceLy!);
    }
  });

  it("says NOTHING rather than zero when there is nothing to measure", () => {
    // Zero light years would be a claim. Null is the absence of one.
    expect(networkLengthLy([])).toBeNull();
    expect(longestHop([])).toBeNull();
  });
});
