// ---------------------------------------------------------------------------
// The galaxy level's two kinds of star (G4).
//
// The owner's call, 2026-09-08: allow BOTH. Real stars and invented ones, on
// one chart.
//
// So the rule this file exists to hold is the same one the Atlas holds for
// unplaced pins and the Timeline for undated entities, in its sharpest form
// yet: A CATALOGUE POSITION AND A POSITION THE WRITER CHOSE MUST NEVER WEAR
// THE SAME DOT. `CatalogStar` and `WorldSystem` are separate types all the way
// through — there is no union that lets a renderer forget which it is holding.
//
// The catalogue is the 178 named Hipparcos stars already shipped for ExoSky
// (public/exosky-stars.json). Reusing it rather than adding a second star
// list is deliberate: two catalogues of real stars is precisely the Parallel
// Truth the Constitution names.
//
// Coordinates go through src/lib/simulators/astro.ts, which doc 14 §1 calls
// "already correct, already tested".
// ---------------------------------------------------------------------------

import { raDecDistToXYZ, type Vec3 } from "@/lib/simulators/astro";
import type { Entity } from "@/services/entity-graph-types";
import { kelvinToRGB } from "../materials/blackbody";
import type { RGB } from "../engine/theme-uniforms";

/** A row of public/exosky-stars.json: name, RA°, Dec°, distance pc, absMag, B−V. */
export type CatalogRow = [string, number, number, number, number, number];

export interface CatalogStar {
  /** Discriminant. Nothing may treat one of these as a world the writer made. */
  kind: "catalog";
  name: string;
  raDeg: number;
  decDeg: number;
  distancePc: number;
  absMag: number;
  colourIndex: number;
  /** Derived for rendering only — see bvToKelvin. */
  kelvin: number;
  colour: RGB;
  /** Equatorial cartesian, parsecs, Sol at the origin. */
  position: Vec3;
}

export interface WorldSystem {
  kind: "world";
  id: string;
  name: string;
  /** The catalogue star this system was anchored to, if any. */
  anchor: CatalogStar | null;
  /**
   * Where to draw it. When anchored this is the anchor's real position; when
   * not, it is null and the caller must list it rather than place it.
   */
  position: Vec3 | null;
  /** True when the position came from a catalogue rather than from the writer. */
  positionIsReal: boolean;
}

export interface GalaxyField {
  stars: CatalogStar[];
  systems: WorldSystem[];
  /** Systems with neither an anchor nor a placement. Listed, never drawn. */
  unplaced: WorldSystem[];
}

/**
 * B−V colour index → effective temperature, Ballesteros (2012).
 *
 * Checked against the Sun: B−V 0.65 gives 5778 K, which is the accepted value.
 * Used ONLY to pick a render colour — like the spectral-class fallback in
 * bind/index.ts, this is never written back as a fact about a star.
 */
export function bvToKelvin(bv: number): number {
  if (!Number.isFinite(bv)) return 5778;
  // Outside the calibrated range the fit misbehaves; real stars sit inside it.
  const b = Math.min(2.0, Math.max(-0.4, bv));
  return 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));
}

/** Parse the shipped catalogue. Malformed rows are dropped, never guessed at. */
export function parseCatalog(rows: unknown): CatalogStar[] {
  if (!Array.isArray(rows)) return [];
  const out: CatalogStar[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const [name, ra, dec, dist, absMag, bv] = row as CatalogRow;
    if (typeof name !== "string" || !name.trim()) continue;
    if (![ra, dec, dist, absMag, bv].every((n) => typeof n === "number" && Number.isFinite(n))) {
      continue;
    }
    if (dist <= 0) continue;

    const kelvin = bvToKelvin(bv);
    out.push({
      kind: "catalog",
      name: name.trim(),
      raDeg: ra,
      decDeg: dec,
      distancePc: dist,
      absMag,
      colourIndex: bv,
      kelvin,
      colour: kelvinToRGB(kelvin),
      position: raDecDistToXYZ(ra, dec, dist),
    });
  }
  return out;
}

/**
 * Find a catalogue star by name.
 *
 * This IS a name match, and that is correct here for the reason it is wrong
 * everywhere else in this codebase: a catalogue star has no id in our
 * database — its NAME is its identifier, the way a spectral class is. The
 * house rule ("ids are the only identity") is about entities the writer
 * created, which do have ids and are matched by them.
 *
 * Exact match first, then case- and space-insensitive, so "tau ceti" finds
 * "Tau Ceti" without ever matching something merely similar.
 */
export function findCatalogStar(
  catalog: CatalogStar[],
  name: string | null | undefined,
): CatalogStar | null {
  if (!name || !name.trim()) return null;
  const wanted = name.trim();
  const exact = catalog.find((s) => s.name === wanted);
  if (exact) return exact;
  const key = wanted.toLowerCase().replace(/\s+/g, " ");
  return catalog.find((s) => s.name.toLowerCase().replace(/\s+/g, " ") === key) ?? null;
}

/** The anchor a writer set on a system, if any. Read from metadata. */
export function readAnchorName(entity: Entity): string | null {
  const meta = (entity.metadata ?? {}) as Record<string, unknown>;
  const v = meta.anchor_star;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Build the galaxy level from the catalogue and the writer's own systems.
 *
 * An anchored system takes the REAL position of its anchor — that is the
 * point of anchoring — but keeps `kind: "world"` and `positionIsReal: true`,
 * so a renderer always knows it is drawing the writer's system at a
 * catalogue location rather than a catalogue star.
 */
export function buildGalaxyField(
  catalog: CatalogStar[],
  entities: Entity[],
): GalaxyField {
  const systems: WorldSystem[] = [];
  const unplaced: WorldSystem[] = [];

  for (const entity of entities) {
    if (entity.entity_type !== "star_system" && entity.entity_type !== "star") {
      continue;
    }
    const anchor = findCatalogStar(catalog, readAnchorName(entity));
    const system: WorldSystem = {
      kind: "world",
      id: entity.id,
      name: entity.name,
      anchor,
      position: anchor ? anchor.position : null,
      positionIsReal: anchor !== null,
    };
    if (system.position) systems.push(system);
    else unplaced.push(system);
  }

  systems.sort((a, b) => a.name.localeCompare(b.name));
  unplaced.sort((a, b) => a.name.localeCompare(b.name));

  return { stars: catalog, systems, unplaced };
}

// ---------------------------------------------------------------------------
// What anchoring is FOR: real numbers a writer can use
// ---------------------------------------------------------------------------

const PC_TO_LY = 3.26156;

/** Straight-line separation between two catalogue positions, in light years. */
export function separationLy(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz) * PC_TO_LY;
}

/** Distance from Sol, in light years. */
export function distanceFromSolLy(star: CatalogStar): number {
  return star.distancePc * PC_TO_LY;
}

/**
 * The nearest catalogue neighbours to a star, by true 3D separation.
 *
 * This is the payoff of anchoring: "my world orbits Tau Ceti" becomes "and
 * here is what is next door, and how far". Those numbers feed Impulse for
 * travel time and Paradox for dilation — a fact the writer decided producing
 * sentences they can write.
 */
export function nearestNeighbours(
  catalog: CatalogStar[],
  origin: CatalogStar,
  count = 6,
): Array<{ star: CatalogStar; separationLy: number }> {
  return catalog
    .filter((s) => s.name !== origin.name)
    .map((star) => ({ star, separationLy: separationLy(origin.position, star.position) }))
    .sort((a, b) => a.separationLy - b.separationLy)
    .slice(0, Math.max(0, count));
}
