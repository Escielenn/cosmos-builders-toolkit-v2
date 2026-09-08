// ---------------------------------------------------------------------------
// Territory (G4) — who holds what, from edges that already exist.
//
// Same finding as hyperlanes, same answer. 14-RENDER-ENGINE §6 wants a
// territory layer; `polity.territory[]` is not canon anywhere in this app —
// territory lives only inside StellarCartographer/, in its own `empires`
// model, which the Atlas cannot read and should not fork.
//
// But `governs` and `rules` are in the F3 vocabulary, the Web view can draw
// them, and "this polity governs these systems" IS a territory. So a territory
// is not declared, it is COUNTED: the set of anchored systems a faction holds.
//
// What gets drawn is the CONVEX HULL of those systems — deliberately, because
// it is the only region shape the data actually supports. A hull is the
// smallest convex volume containing the systems and nothing is assumed about
// what lies outside it. A sphere around the centroid would have swallowed
// systems the polity does not hold; a border drawn to "look right" would have
// been a claim nobody made.
//
// The span is derived the same way a lane's length is: measured between real
// catalogue positions, never typed in.
// ---------------------------------------------------------------------------

import type { Entity, EntityConnection } from "@/services/entity-graph-types";
import { separationLy, type WorldSystem } from "./starfield";
import type { Vec3 } from "@/lib/simulators/astro";

/**
 * The verbs that mean "this is mine".
 *
 * `colonized_by` is not here on purpose even though it sounds like one: it is
 * already a ROUTE (a crossing that happened), and one edge asserting two
 * different layers is how a map starts lying about which fact it is drawing.
 */
export const TERRITORY_VERBS: readonly string[] = ["governs", "rules"];

export interface Territory {
  /** The polity's entity id — ids are the only identity. */
  id: string;
  name: string;
  /** The writer's own colour for this entity when they set one. */
  colour: string | null;
  /** Anchored systems this polity holds, in catalogue position. */
  systems: WorldSystem[];
  /** Mean position of the held systems. A label anchor, not a capital. */
  centroid: Vec3;
  /**
   * Greatest separation between any two held systems, in light years —
   * how far this polity reaches. Derived, like every distance on this chart.
   */
  spanLy: number;
}

export interface TerritoryField {
  territories: Territory[];
  /**
   * Claims that cannot be drawn, and why. A polity holding one unanchored
   * system has a real claim and no shape; saying so is better than dropping it.
   */
  unmappable: Array<{ id: string; name: string; reason: string }>;
}

export function isTerritoryVerb(verb: string): boolean {
  return TERRITORY_VERBS.includes(verb);
}

/**
 * Build the territory layer.
 *
 * Direction is not assumed. `governs` may have been drawn either way round, so
 * the end that IS an anchored system is the holding, and the other end is the
 * polity. An edge between two systems is not a territory claim at all — that
 * is one system governing another, which is a relationship, not a border.
 */
export function buildTerritories(
  systems: WorldSystem[],
  connections: EntityConnection[],
  entities: Entity[],
): TerritoryField {
  const systemById = new Map(systems.map((s) => [s.id, s]));
  const entityById = new Map(entities.map((e) => [e.id, e]));

  // polity id → held system ids (a Set: holding a system twice is not holding
  // it twice as hard).
  const held = new Map<string, Set<string>>();
  const claimed = new Map<string, Set<string>>();

  for (const c of connections) {
    if (!isTerritoryVerb(c.relationship_type)) continue;

    const sourceIsSystem = systemById.has(c.source_entity_id);
    const targetIsSystem = systemById.has(c.target_entity_id);
    if (sourceIsSystem && targetIsSystem) continue; // system governs system

    const systemId = sourceIsSystem
      ? c.source_entity_id
      : targetIsSystem
        ? c.target_entity_id
        : null;
    const polityId = sourceIsSystem ? c.target_entity_id : c.source_entity_id;
    if (!entityById.has(polityId)) continue;

    if (systemId) {
      const set = held.get(polityId) ?? new Set<string>();
      set.add(systemId);
      held.set(polityId, set);
    } else {
      // The claim exists; the system it names is not anchored.
      const set = claimed.get(polityId) ?? new Set<string>();
      set.add(c.source_entity_id === polityId ? c.target_entity_id : c.source_entity_id);
      claimed.set(polityId, set);
    }
  }

  const territories: Territory[] = [];
  const unmappable: TerritoryField["unmappable"] = [];

  for (const [polityId, systemIds] of held) {
    const polity = entityById.get(polityId);
    if (!polity) continue;
    const members = [...systemIds]
      .map((id) => systemById.get(id))
      .filter((s): s is WorldSystem => Boolean(s?.position));

    if (members.length < 2) {
      unmappable.push({
        id: polityId,
        name: polity.name,
        reason:
          members.length === 1
            ? "Holds one anchored system. A single point has no border."
            : "Holds nothing anchored yet.",
      });
      continue;
    }

    territories.push({
      id: polityId,
      name: polity.name,
      colour: polity.color ?? null,
      systems: members,
      centroid: centroidOf(members),
      spanLy: greatestSpanLy(members),
    });
  }

  // A polity whose every claim is on an unanchored system never reached the
  // loop above. Name it rather than losing it.
  for (const [polityId] of claimed) {
    if (held.has(polityId)) continue;
    const polity = entityById.get(polityId);
    if (!polity) continue;
    unmappable.push({
      id: polityId,
      name: polity.name,
      reason: "Holds nothing anchored yet.",
    });
  }

  territories.sort((a, b) => b.systems.length - a.systems.length);
  unmappable.sort((a, b) => a.name.localeCompare(b.name));
  return { territories, unmappable };
}

/** Mean position of the held systems. Not a capital, and never labelled one. */
export function centroidOf(systems: WorldSystem[]): Vec3 {
  const out: Vec3 = [0, 0, 0];
  let n = 0;
  for (const s of systems) {
    if (!s.position) continue;
    out[0] += s.position[0];
    out[1] += s.position[1];
    out[2] += s.position[2];
    n += 1;
  }
  if (n === 0) return [0, 0, 0];
  return [out[0] / n, out[1] / n, out[2] / n];
}

/** The greatest separation between any two held systems, in light years. */
export function greatestSpanLy(systems: WorldSystem[]): number {
  let best = 0;
  for (let i = 0; i < systems.length; i += 1) {
    for (let j = i + 1; j < systems.length; j += 1) {
      const a = systems[i].position;
      const b = systems[j].position;
      if (!a || !b) continue;
      const d = separationLy(a, b);
      if (d > best) best = d;
    }
  }
  return best;
}

/**
 * Which polities hold a given system. A contested system is a real thing and
 * the map must not pick a winner for the writer.
 */
export function holdersOf(
  territories: Territory[],
  systemId: string,
): Territory[] {
  return territories.filter((t) => t.systems.some((s) => s.id === systemId));
}
