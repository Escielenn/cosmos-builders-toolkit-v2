// ---------------------------------------------------------------------------
// The Atlas's placement model (F5, 13-THE-LIFT.md §1).
//
// The Stellar Cartographer generates a galaxy procedurally: 2,300 lines of
// stars that are not the writer's stars. The Atlas is the other thing — the
// map OF THIS WORLD, where every pin is an entity that already exists and
// clicking one lands on its Codex page.
//
// A pin therefore needs a position, and an entity has never had one. It lives
// in `metadata.atlas_x` / `atlas_y`, exactly as the Web view's graph position
// lives in `graph_x`/`graph_y`: per-world, writer-controlled, no astronomy.
// Real coordinates would be worse here — a writer placing their worlds on a
// map is composing, not surveying.
//
// THE RULE THIS FILE EXISTS TO HOLD: an entity with no coordinate is UNPLACED,
// and says so. It is never scattered to a plausible-looking spot. A map that
// invents positions is a map that lies, and the writer cannot tell which pins
// they placed and which the software guessed.
// ---------------------------------------------------------------------------

import type { Entity, EntityType } from "@/services/entity-graph-types";

/** Normalised map space. Pins store 0..1 so the map can be any pixel size. */
export interface AtlasPoint {
  x: number;
  y: number;
}

export interface AtlasPin {
  id: string;
  name: string;
  entityType: EntityType;
  /** null when the writer has not placed it yet. */
  at: AtlasPoint | null;
  /** Entities that sit inside this one — a system's planets, a planet's places. */
  childCount: number;
}

/**
 * What the galaxy level shows. Everything else is inside one of these, and
 * appears when you zoom into it rather than as a competing pin.
 */
export const GALAXY_LEVEL_TYPES: readonly EntityType[] = [
  "star_system",
  "star",
];

/** What a system contains, at the system level. */
export const SYSTEM_LEVEL_TYPES: readonly EntityType[] = [
  "planet",
  "moon",
  "artifact",
  "vessel",
];

function readPoint(entity: Entity): AtlasPoint | null {
  const meta = entity.metadata ?? {};
  const x = (meta as Record<string, unknown>).atlas_x;
  const y = (meta as Record<string, unknown>).atlas_y;
  if (typeof x !== "number" || typeof y !== "number") return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  // Out-of-range coordinates are corrupt, not clamped: clamping would move a
  // pin the writer placed and never say so.
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

/**
 * Pins for one zoom level.
 *
 * `parentId` null = the galaxy level: every system, plus any loose star.
 * `parentId` set  = inside that entity: its children, whatever their type.
 */
export function atlasPins(
  entities: Entity[],
  parentId: string | null,
): AtlasPin[] {
  const childCounts = new Map<string, number>();
  for (const e of entities) {
    if (e.parent_entity_id) {
      childCounts.set(
        e.parent_entity_id,
        (childCounts.get(e.parent_entity_id) ?? 0) + 1,
      );
    }
  }

  const inScope = entities.filter((e) =>
    parentId === null
      ? // Top level: things with no parent that belong on a star map.
        !e.parent_entity_id && GALAXY_LEVEL_TYPES.includes(e.entity_type)
      : e.parent_entity_id === parentId,
  );

  return inScope.map((e) => ({
    id: e.id,
    name: e.name,
    entityType: e.entity_type,
    at: readPoint(e),
    childCount: childCounts.get(e.id) ?? 0,
  }));
}

/** The placed pins, in a stable order so the render does not reshuffle. */
export function placedPins(pins: AtlasPin[]): AtlasPin[] {
  return pins
    .filter((p): p is AtlasPin & { at: AtlasPoint } => p.at !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The pins the writer has not placed. These are shown in a tray beside the
 * map, to be dragged on — visible and honest, rather than auto-scattered.
 */
export function unplacedPins(pins: AtlasPin[]): AtlasPin[] {
  return pins
    .filter((p) => p.at === null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Clamp a drop into map space. Only ever applied to a live drag. */
export function clampToMap(point: AtlasPoint): AtlasPoint {
  return {
    x: Math.min(1, Math.max(0, point.x)),
    y: Math.min(1, Math.max(0, point.y)),
  };
}

/** The metadata patch that places a pin. Shape matches entityUpdateToRow. */
export function placementPatch(point: AtlasPoint): {
  atlas_x: number;
  atlas_y: number;
} {
  const { x, y } = clampToMap(point);
  // Six places is ~1px at a 10,000px map. Storing full float noise makes
  // diffs unreadable for no visible gain.
  return {
    atlas_x: Number(x.toFixed(6)),
    atlas_y: Number(y.toFixed(6)),
  };
}

/**
 * Can this entity be zoomed into? Only if something is actually inside it —
 * a zoom control that opens an empty level is a dead end.
 */
export function canZoomInto(pin: AtlasPin): boolean {
  return pin.childCount > 0;
}
