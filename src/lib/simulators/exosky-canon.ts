// ---------------------------------------------------------------------------
// exosky-canon, ExoSky on the Canon Graph (1.9, E10 / E11 / N4 / N8).
//
// Reads: the subject planet's facts, its star's facts (parent entity), its
// sibling planets and its moons, all from one canon.facts() call grouped by
// subject. Writes: the pole, the precession period, the pole star, the
// naked-eye count, the system's galactic position, and constellations as
// entities with member star ids, epoch and the planet they are seen from.
//
// Writes are assembled here as plain AssertInput-shaped objects so they can
// be tested without a database; the component sends them through
// useAssertFact (canon.assert never silently overwrites canon: a conflict
// comes back as a result and the writer chooses).
// ---------------------------------------------------------------------------

import type { CanonFact, FactValue } from "@/canon/types";
import type { AssertInput } from "@/canon";
import type { OrbitingBody } from "@/lib/simulators/exosky-systems";
import { longitudeFromId, type FactMap } from "@/lib/simulators/exosky-vantage";
import { EARTH_RADIUS_KM, orbitalPeriodDays } from "@/lib/simulators/astro";

export const EXOSKY_TOOL_ID = "exosky";

/** The bits of an entity ExoSky needs; satisfied by the entity-graph Entity row. */
export interface EntityLike {
  id: string;
  name: string;
  entity_type: string;
  parent_entity_id: string | null;
  custom_type_label?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** A canon fact's value as a plain JS value (number, string, bool, struct). */
export function factValue(f: CanonFact): FactMap[string] {
  const v = f.value;
  if (v) {
    switch (v.kind) {
      case "scalar": return v.value;
      case "bool": return v.value;
      case "enum":
      case "text": return v.value;
      case "struct": return { schema: v.schema, value: v.value };
      case "text[]": return v.values.join(", ");
      default: break;
    }
  }
  // Projected (computed-on-read) facts carry display text only.
  return f.valueText;
}

/** Group facts by subject into FactMaps. Best-ranked fact per predicate wins (merge order). */
export function factsBySubject(facts: readonly CanonFact[]): Map<string, FactMap> {
  const out = new Map<string, FactMap>();
  for (const f of facts) {
    if (!f.subjectId) continue;
    let m = out.get(f.subjectId);
    if (!m) { m = {}; out.set(f.subjectId, m); }
    if (m[f.predicate] === undefined) m[f.predicate] = factValue(f);
  }
  return out;
}

const n = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") { const x = parseFloat(v); return Number.isFinite(x) ? x : undefined; }
  return undefined;
};

export function isConstellationEntity(e: EntityLike): boolean {
  return (e.metadata as { kind?: unknown } | null | undefined)?.kind === "constellation";
}

export interface CanonSkyContext {
  label: string;
  subject: EntityLike;
  star: EntityLike | null;
  planet: FactMap;
  starFacts: FactMap;
  siblings: OrbitingBody[];
  moons: OrbitingBody[];
  /** Constellations already in canon for this planet. */
  constellations: Array<{ entity: EntityLike; stars: string[]; epoch: number | null }>;
}

/**
 * Everything canon knows about the sky over `subjectId`. A star entity as
 * subject is treated as the host with no planet facts; a moon as subject
 * looks up its parent planet's star.
 */
export function canonSkyContext(
  entities: readonly EntityLike[],
  facts: readonly CanonFact[],
  subjectId: string,
): CanonSkyContext | null {
  const subject = entities.find((e) => e.id === subjectId);
  if (!subject) return null;
  const by = factsBySubject(facts);
  const byId = new Map(entities.map((e) => [e.id, e]));
  let star: EntityLike | null = null;
  if (subject.entity_type === "star") star = subject;
  else {
    let p = subject.parent_entity_id ? byId.get(subject.parent_entity_id) ?? null : null;
    // A moon's parent is a planet; that planet's parent is the star.
    if (p && p.entity_type !== "star" && p.parent_entity_id) p = byId.get(p.parent_entity_id) ?? p;
    if (p && (p.entity_type === "star" || p.entity_type === "star_system")) star = p;
  }
  const planet = subject.entity_type === "star" ? {} : by.get(subject.id) ?? {};
  const starFacts = star ? by.get(star.id) ?? {} : {};
  const starMass = n(starFacts["star.mass"]) ?? 1;

  const siblings: OrbitingBody[] = [];
  if (star) {
    for (const e of entities) {
      if (e.id === subject.id || e.entity_type !== "planet" || e.parent_entity_id !== star.id) continue;
      const f = by.get(e.id) ?? {};
      const au = n(f["orbit.semi_major_axis"]);
      if (!au) continue;
      const rE = n(f["planet.radius"]) ?? 1;
      siblings.push({
        id: e.id, name: e.name, au,
        periodDays: n(f["orbit.period"]) ?? orbitalPeriodDays(au, starMass),
        radiusKm: rE * EARTH_RADIUS_KM,
        albedo: n(f["planet.albedo"]) ?? 0.3,
        longitude0: longitudeFromId(e.id),
        source: "canon; orbital phase not set, placed by id",
      });
    }
  }
  const moons: OrbitingBody[] = [];
  for (const e of entities) {
    if (e.entity_type !== "moon" || e.parent_entity_id !== subject.id) continue;
    const f = by.get(e.id) ?? {};
    const au = n(f["orbit.semi_major_axis"]);
    if (!au) continue;
    const planetMassEarth = n(planet["planet.mass"]) ?? 1;
    moons.push({
      id: e.id, name: e.name, au,
      // Kepler around the planet: M in solar masses = M⊕ / 332,946.
      periodDays: n(f["orbit.period"]) ?? orbitalPeriodDays(au, planetMassEarth / 332946),
      radiusKm: (n(f["planet.radius"]) ?? 0.273) * EARTH_RADIUS_KM,
      albedo: n(f["planet.albedo"]) ?? 0.12,
      longitude0: longitudeFromId(e.id),
      source: "canon; orbital phase not set, placed by id",
    });
  }
  const constellations: CanonSkyContext["constellations"] = [];
  for (const e of entities) {
    if (!isConstellationEntity(e)) continue;
    const f = by.get(e.id) ?? {};
    const seen = f["constellation.seen_from"];
    const seenId = typeof seen === "string" ? seen : (e.metadata as { seenFrom?: string } | null)?.seenFrom;
    if (seenId !== subject.id && e.parent_entity_id !== subject.id) continue;
    const starsRaw = f["constellation.stars[]"];
    const stars = typeof starsRaw === "string" ? starsRaw.split(/,\s*/).filter(Boolean) : [];
    constellations.push({ entity: e, stars, epoch: n(f["constellation.epoch"]) ?? null });
  }
  return { label: subject.name, subject, star, planet, starFacts, siblings, moons, constellations };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type ExoskyAssert = Omit<AssertInput, "worldId">;

const sourceRef = (extra: Record<string, unknown> = {}) => ({ tool: EXOSKY_TOOL_ID, ...extra });

const scalar = (value: number, unit: string): FactValue => ({ kind: "scalar", value, unit });

/** Pole direction and precession period for a planet. */
export function poleFacts(planetId: string, pole: { ra: number; dec: number }, precessionYears: number | null): ExoskyAssert[] {
  const out: ExoskyAssert[] = [
    { subjectId: planetId, predicate: "planet.pole_ra", value: scalar(round(pole.ra, 2), "deg"), sourceKind: "sim", sourceRef: sourceRef() },
    { subjectId: planetId, predicate: "planet.pole_dec", value: scalar(round(pole.dec, 2), "deg"), sourceKind: "sim", sourceRef: sourceRef() },
  ];
  if (precessionYears !== null && Number.isFinite(precessionYears) && precessionYears > 0) {
    out.push({ subjectId: planetId, predicate: "planet.precession_period", value: scalar(Math.round(precessionYears), "yr"), sourceKind: "sim", sourceRef: sourceRef() });
  }
  return out;
}

/** star.galactic_position for the system's star (or the planet when no star entity exists). */
export function galacticPositionFact(
  subjectId: string,
  p: { l: number; b: number; distPc: number; catalogueId?: string | null },
): ExoskyAssert {
  const value: Record<string, unknown> = { l_deg: round(p.l, 3), b_deg: round(p.b, 3), distance_pc: round(p.distPc, 3) };
  if (p.catalogueId) value.catalogue_id = p.catalogueId;
  return {
    subjectId,
    predicate: "star.galactic_position",
    value: { kind: "struct", schema: "galactic_position", value },
    valueText: `l ${value.l_deg}°, b ${value.b_deg}°, ${value.distance_pc} pc${p.catalogueId ? ` (${p.catalogueId})` : ""}`,
    sourceKind: "sim",
    sourceRef: sourceRef(),
  };
}

/** Navigation readouts that a scene can cite. */
export function skyReadoutFacts(planetId: string, r: { poleStar: string | null; nakedEye: number; epochYears: number }): ExoskyAssert[] {
  return [
    { subjectId: planetId, predicate: "planet.sky.pole_star", value: { kind: "text", value: r.poleStar ?? "None" }, sourceKind: "sim", sourceRef: sourceRef({ epochYears: r.epochYears }) },
    { subjectId: planetId, predicate: "planet.sky.naked_eye_count", value: scalar(r.nakedEye, ""), sourceKind: "sim", sourceRef: sourceRef({ epochYears: r.epochYears }) },
  ];
}

export interface ConstellationDraft {
  name: string;
  starIds: string[];
  epochYears: number;
}

/** The entity row a constellation becomes. */
export function constellationEntityInput(c: ConstellationDraft, planet: { id: string; name: string }) {
  return {
    name: c.name,
    entity_type: "custom" as const,
    custom_type_label: "Constellation",
    cascade_stage: "mythology" as const,
    parent_entity_id: planet.id,
    summary: `${c.starIds.length} stars in the sky of ${planet.name}.`,
    metadata: { kind: "constellation", seenFrom: planet.id, source: EXOSKY_TOOL_ID },
  };
}

/** Facts on a constellation entity, plus the planet's name list. */
export function constellationFacts(constellationId: string, c: ConstellationDraft, planetId: string, allNames: string[]): ExoskyAssert[] {
  return [
    { subjectId: constellationId, predicate: "constellation.stars[]", value: { kind: "text[]", values: c.starIds }, sourceKind: "sim", sourceRef: sourceRef() },
    { subjectId: constellationId, predicate: "constellation.epoch", value: scalar(Math.round(c.epochYears), "yr"), sourceKind: "sim", sourceRef: sourceRef() },
    { subjectId: constellationId, predicate: "constellation.seen_from", value: { kind: "ref", entity_id: planetId }, sourceKind: "sim", sourceRef: sourceRef() },
    { subjectId: planetId, predicate: "planet.sky.constellations[]", value: { kind: "text[]", values: [...new Set(allNames)] }, sourceKind: "sim", sourceRef: sourceRef() },
  ];
}

function round(x: number, places: number): number {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}
