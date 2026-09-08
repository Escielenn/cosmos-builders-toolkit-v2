// ---------------------------------------------------------------------------
// Hyperlanes (G4) — routes between systems, from edges that already exist.
//
// 14-RENDER-ENGINE §1 binds hyperlanes to `route.*`. Those predicates are in
// the vocabulary and NOTHING IN THE APP WRITES THEM — checked 2026-09-08.
// Building a renderer for them would be the declared-but-unwired pattern:
// a lane layer over an empty table, looking like coverage and delivering
// nothing.
//
// But F3 gave `world_connections` a typed-edge vocabulary, and a route is
// exactly that: a typed edge between two systems. So a lane is drawn from an
// edge the writer already made in the Web view, and `route.distance_ly` stops
// being an orphan predicate and becomes DERIVED — measured from the two
// anchors' real catalogue positions.
//
// That is the shape the Prime Law asks for. Draw a connection between two
// systems; the galaxy view renders it; the distance is real; Impulse turns it
// into travel time. Nothing here is invented, and nothing waits on a table
// nobody fills.
// ---------------------------------------------------------------------------

import type { EntityConnection } from "@/services/entity-graph-types";
import { separationLy, type WorldSystem } from "./starfield";
import type { Vec3 } from "@/lib/simulators/astro";

/**
 * The verbs that mean "you can get from here to there".
 *
 * Deliberately narrow. `allied_with` and `enemy_of` are political, not
 * navigational — an alliance is not a road, and drawing one as a lane would
 * assert a crossing nobody claimed. `governs` is territory, which is its own
 * layer and still has no canon behind it.
 */
export const ROUTE_VERBS: readonly string[] = [
  "travels_via",
  "trades_with",
  "colonized_by",
];

export interface Lane {
  id: string;
  from: WorldSystem;
  to: WorldSystem;
  verb: string;
  /**
   * DERIVED from the two anchors' real positions. Null when either end is
   * unanchored — a lane between an unanchored system and anywhere has no
   * length, and a made-up one would be worse than none.
   */
  distanceLy: number | null;
  /** True when both ends sit at real catalogue positions. */
  measured: boolean;
}

export interface LaneField {
  lanes: Lane[];
  /**
   * Edges that ARE routes but cannot be drawn, and why. Named so the writer
   * can see that their connection was understood and is waiting on an anchor,
   * rather than silently vanishing.
   */
  undrawable: Array<{ id: string; reason: string }>;
}

/** Is this edge a route at all? */
export function isRouteVerb(verb: string): boolean {
  return ROUTE_VERBS.includes(verb);
}

/**
 * Build the lane layer.
 *
 * `systems` are the ANCHORED systems from buildGalaxyField — the only ones
 * with a position to draw a line between.
 */
export function buildLanes(
  systems: WorldSystem[],
  connections: EntityConnection[],
): LaneField {
  const byId = new Map(systems.map((s) => [s.id, s]));
  const lanes: Lane[] = [];
  const undrawable: LaneField["undrawable"] = [];

  for (const c of connections) {
    if (!isRouteVerb(c.relationship_type)) continue;

    const from = byId.get(c.source_entity_id);
    const to = byId.get(c.target_entity_id);

    if (!from || !to) {
      undrawable.push({
        id: c.id,
        reason: "One end is not an anchored system.",
      });
      continue;
    }
    if (from.id === to.id) {
      undrawable.push({ id: c.id, reason: "Both ends are the same system." });
      continue;
    }

    const measured = from.position !== null && to.position !== null;
    lanes.push({
      id: c.id,
      from,
      to,
      verb: c.relationship_type,
      distanceLy: measured
        ? separationLy(from.position as Vec3, to.position as Vec3)
        : null,
      measured,
    });
  }

  // Longest last, so short lanes are not overdrawn by long ones crossing them.
  lanes.sort((a, b) => (a.distanceLy ?? 0) - (b.distanceLy ?? 0));
  return { lanes, undrawable };
}

/** Total network length, for a readout. Null when nothing is measured. */
export function networkLengthLy(lanes: Lane[]): number | null {
  const measured = lanes.filter((l) => l.distanceLy !== null);
  if (measured.length === 0) return null;
  return measured.reduce((sum, l) => sum + (l.distanceLy ?? 0), 0);
}

/** The longest single hop — the one a drive has to be able to make. */
export function longestHop(lanes: Lane[]): Lane | null {
  let best: Lane | null = null;
  for (const lane of lanes) {
    if (lane.distanceLy === null) continue;
    if (!best || lane.distanceLy > (best.distanceLy ?? 0)) best = lane;
  }
  return best;
}
