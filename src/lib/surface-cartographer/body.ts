// ---------------------------------------------------------------------------
// The body a map is drawn on, read from canon. Never edited here.
//
// The Surface Cartographer CONSUMES planet facts; it produces none of them.
// Every number below is read from wherever the world already records it, in
// this order, and travels with the place it came from so the page can offer
// a one-click path to the single place it is edited (Law III):
//
//   1. a published fact on the planet entity        (planet.radius, …)
//   2. the entity's own infobox field               (metadata.radius, …)
//   3. a Genesis worksheet for the body             (physicalCharacteristics.*)
//   4. a Tidelock save the writer pointed at        (tidal state, habitable band)
//
// Nothing is defaulted into a fact. An unknown radius is `null`, and the
// distance readout says so instead of quietly measuring an Earth.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import type { Entity } from "@/services/entity-graph-types";
import { readPublishedFact } from "@/lib/simulators/published-facts";
import { entityToWorldEntry } from "@/gl/bind/entity-entry";
import { EARTH_RADIUS_KM } from "./geo";

export type FactSourceKind = "entity" | "worksheet" | "tidelock";

export interface BodyFactSource {
  kind: FactSourceKind;
  /** "Codex · Kellis", "Genesis · Kellis profile", "Tidelock · Run 3". */
  label: string;
  /** Where the writer goes to change it. */
  href: string;
}

export interface BodyFact<T> {
  value: T;
  source: BodyFactSource;
}

export interface BodyFacts {
  name: string;
  radiusEarth: BodyFact<number> | null;
  surfaceGravityG: BodyFact<number> | null;
  tiltDeg: BodyFact<number> | null;
  dayLengthHours: BodyFact<number> | null;
  tidallyLocked: BodyFact<boolean> | null;
  meanTempC: BodyFact<number> | null;
  /** 0..1 of the surface under water. */
  oceanFraction: BodyFact<number> | null;
  atmoPressureBar: BodyFact<number> | null;
  atmoComposition: BodyFact<string> | null;
  starClass: BodyFact<string> | null;
  /** Tidelock's habitable-band share of the surface, percent. */
  habitablePercent: BodyFact<number> | null;
}

/** Radius in km, or null. Never Earth's by default. */
export function bodyRadiusKm(facts: BodyFacts): number | null {
  const r = facts.radiusEarth?.value;
  return typeof r === "number" && r > 0 ? r * EARTH_RADIUS_KM : null;
}

export interface ProfileWorksheetInput {
  id: string;
  title: string | null;
  data: unknown;
}

export interface TidelockSaveInput {
  id: string;
  name: string;
  data: unknown;
}

export interface ResolveBodyInput {
  worldId: string | null;
  entity: Entity | null;
  /** The Genesis (planetary-profile) worksheet for this body, if any. */
  profile: ProfileWorksheetInput | null;
  tidelock: TidelockSaveInput | null;
  /** The star this body orbits, if the entity tree says. */
  star: Entity | null;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function obj(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

/** The leading number in a free-text field: "1.2 R⊕" → 1.2, "~24h" → 24. */
export function parseLeadingNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const m = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/**
 * A temperature in Celsius from what a writer types: "15°C", "288 K",
 * "-40 F", "15". A bare number is read as Celsius, which is what the Genesis
 * placeholder ("e.g., -20°C, 15°C (Earth)") asks for.
 */
export function parseTemperatureC(raw: unknown): number | null {
  const n = parseLeadingNumber(raw);
  if (n === null) return null;
  const text = typeof raw === "string" ? raw : "";
  if (/\bK\b|kelvin/i.test(text) && !/°\s*C|celsius/i.test(text)) return n - 273.15;
  if (/°\s*F|\bF\b|fahrenheit/i.test(text)) return ((n - 32) * 5) / 9;
  return n;
}

/** Temperature in Kelvin (the vocabulary's unit for planet.temp_mean) to Celsius. */
function kelvinToC(k: number): number {
  return k - 273.15;
}

/** "70%", "0.7", "seven tenths" (no) → 0.7. A bare number above 1 is a percent. */
export function parseFraction(raw: unknown): number | null {
  const n = parseLeadingNumber(raw);
  if (n === null) return null;
  const text = typeof raw === "string" ? raw : "";
  const f = /%/.test(text) || n > 1 ? n / 100 : n;
  return f >= 0 && f <= 1 ? f : null;
}

/** Genesis's water presence options, as an ocean fraction when no coverage is typed. */
const WATER_PRESENCE_FRACTION: Record<string, number> = {
  "global-ocean": 0.97,
  "partial-ocean": 0.7,
  "subsurface-ocean": 0,
  "desert-world": 0.05,
  "no-water": 0,
};

/** True / false from a lock statement, or null when it does not say. */
export function parseTidalLock(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const t = raw.trim().toLowerCase();
  if (/\b(not|unlikely|free|no|unlocked|false)\b/.test(t) || t === "resonance") return false;
  if (/resonan/.test(t)) return false; // a 3:2 world still has days
  // "Possibly locked" is a question, not a fact. Draw nothing from it.
  if (/possibl|maybe|uncertain|\?/.test(t)) return null;
  if (/lock|synchron|true|yes/.test(t)) return true;
  return null;
}

/** Map Genesis gas ids ("nitrogen", "carbon-dioxide") into a composition string bind/ understands. */
function compositionFromGases(raw: unknown): string | null {
  if (!Array.isArray(raw)) return null;
  const parts = raw.filter((g): g is string => typeof g === "string" && !!g.trim());
  return parts.length ? parts.map((g) => g.replace(/-/g, " ")).join(", ") : null;
}

function get(data: Record<string, unknown> | null, path: string): unknown {
  let cur: unknown = data;
  for (const key of path.split(".")) {
    const o = obj(cur);
    if (!o) return undefined;
    cur = o[key];
  }
  return cur;
}

function textAt(data: Record<string, unknown> | null, path: string): string | null {
  const v = get(data, path);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

export function resolveBodyFacts(input: ResolveBodyInput): BodyFacts {
  const { worldId, entity, profile, tidelock, star } = input;
  const w = worldId ? `worldId=${encodeURIComponent(worldId)}` : "";

  const entitySource: BodyFactSource | null = entity
    ? {
        kind: "entity",
        label: `Codex · ${entity.name}`,
        href: worldId ? `/worlds/${worldId}/codex/${entity.id}` : "/worlds",
      }
    : null;
  const profileSource: BodyFactSource | null = profile
    ? {
        kind: "worksheet",
        label: `Genesis · ${profile.title || "Planetary Profile"}`,
        href: `/tools/planetary-profile?${w}${w ? "&" : ""}worksheetId=${profile.id}`,
      }
    : null;
  const tidelockSource: BodyFactSource | null = tidelock
    ? {
        kind: "tidelock",
        label: `Tidelock · ${tidelock.name || "Saved run"}`,
        href: `/tools/tidelock?${w}${entity ? `${w ? "&" : ""}entityId=${entity.id}` : ""}`,
      }
    : null;
  const starSource: BodyFactSource | null = star
    ? {
        kind: "entity",
        label: `Codex · ${star.name}`,
        href: worldId ? `/worlds/${worldId}/codex/${star.id}` : "/worlds",
      }
    : null;

  const entry = entity ? entityToWorldEntry(entity) : null;
  const meta = (entity?.metadata ?? null) as Record<string, unknown> | null;
  const pdata = obj(profile?.data);
  const tdata = obj(tidelock?.data);
  const tresults = obj(tdata?.results);

  // First present value wins; the source travels with it.
  function first<T>(
    candidates: Array<[T | null | undefined, BodyFactSource | null]>,
  ): BodyFact<T> | null {
    for (const [value, source] of candidates) {
      if (value !== null && value !== undefined && source) return { value, source };
    }
    return null;
  }

  const pubNum = (predicate: string) =>
    parseLeadingNumber(readPublishedFact(entry, predicate)?.value);
  const pubText = (predicate: string) => {
    const v = readPublishedFact(entry, predicate)?.value;
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const metaNum = (key: string) => parseLeadingNumber(meta?.[key]);
  const metaText = (key: string) => {
    const v = meta?.[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const positive = (n: number | null) => (n !== null && n > 0 ? n : null);

  const pubTempK = pubNum("planet.temp_mean");
  const metaTempK = metaNum("surfaceTemperature");

  const waterPresence = get(pdata, "hydrosphere.waterPresence");
  const typedCoverage = parseFraction(get(pdata, "hydrosphere.oceanCoverage"));
  const presenceFraction =
    typeof waterPresence === "string" && waterPresence in WATER_PRESENCE_FRACTION
      ? WATER_PRESENCE_FRACTION[waterPresence]
      : null;

  const starClassFromStar = star
    ? (() => {
        const v = readPublishedFact(entityToWorldEntry(star), "star.spectral_class")?.value;
        if (typeof v === "string" && v.trim()) return v.trim();
        const m = (star.metadata ?? {}) as Record<string, unknown>;
        const c = m.primaryStarClass ?? m.spectralClass;
        return typeof c === "string" && c.trim() ? c.trim() : null;
      })()
    : null;

  return {
    name: entity?.name ?? profile?.title ?? "Unnamed body",
    radiusEarth: first<number>([
      [positive(pubNum("planet.radius")), entitySource],
      [positive(metaNum("radius")), entitySource],
      [positive(parseLeadingNumber(get(pdata, "physicalCharacteristics.planetaryRadius"))), profileSource],
    ]),
    surfaceGravityG: first<number>([
      [positive(pubNum("planet.surface_gravity")), entitySource],
      [positive(metaNum("surfaceGravity")), entitySource],
      [positive(parseLeadingNumber(get(pdata, "physicalCharacteristics.surfaceGravity"))), profileSource],
      [positive(parseLeadingNumber(tresults?.surfGrav)), tidelockSource],
    ]),
    tiltDeg: first<number>([
      [pubNum("planet.obliquity"), entitySource],
      [metaNum("axialTilt"), entitySource],
      [parseLeadingNumber(get(pdata, "physicalCharacteristics.axialTilt")), profileSource],
    ]),
    dayLengthHours: first<number>([
      [positive(pubNum("planet.rotation_period")), entitySource],
      [positive(metaNum("dayLength")), entitySource],
      [positive(parseLeadingNumber(get(pdata, "physicalCharacteristics.dayLength"))), profileSource],
    ]),
    tidallyLocked: first<boolean>([
      [parseTidalLock(readPublishedFact(entry, "orbit.tidally_locked")?.value), entitySource],
      [parseTidalLock(meta?.tidallyLocked), entitySource],
      [parseTidalLock(get(pdata, "stellarEnvironment.tidalLocking")), profileSource],
      [parseTidalLock(tresults?.tidalLock), tidelockSource],
    ]),
    meanTempC: first<number>([
      [pubTempK !== null ? kelvinToC(pubTempK) : null, entitySource],
      [metaTempK !== null ? kelvinToC(metaTempK) : null, entitySource],
      [parseTemperatureC(get(pdata, "temperatureProfile.averageSurfaceTemp")), profileSource],
    ]),
    oceanFraction: first<number>([
      [parseFraction(readPublishedFact(entry, "planet.hydrosphere_fraction")?.value), entitySource],
      [typedCoverage, profileSource],
      [presenceFraction, profileSource],
    ]),
    atmoPressureBar: first<number>([
      [pubNum("planet.atmo_pressure"), entitySource],
      [parseLeadingNumber(get(pdata, "atmosphericComposition.atmosphericPressure")), profileSource],
    ]),
    atmoComposition: first<string>([
      [pubText("planet.atmo_composition"), entitySource],
      [compositionFromGases(get(pdata, "atmosphericComposition.primaryGases")), profileSource],
    ]),
    starClass: first<string>([
      [starClassFromStar, starSource],
      [pubText("star.spectral_class"), entitySource],
      [metaText("starType"), entitySource],
      [textAt(pdata, "stellarEnvironment.starType"), profileSource],
      [textAt(tresults, "starType"), tidelockSource],
    ]),
    habitablePercent: first<number>([
      [parseLeadingNumber(tresults?.habPct), tidelockSource],
    ]),
  };
}

/** The star that lights a body: walk up the entity tree to the first star. */
export function findStarFor(entity: Entity | null, all: readonly Entity[]): Entity | null {
  let cur = entity;
  const seen = new Set<string>();
  while (cur && cur.parent_entity_id && !seen.has(cur.id)) {
    seen.add(cur.id);
    const parent = all.find((e) => e.id === cur!.parent_entity_id) ?? null;
    if (!parent) return null;
    if (parent.entity_type === "star") return parent;
    if (parent.entity_type === "star_system") {
      // A system's own star, if one is filed under it; else the system itself
      // carries the primary class.
      const child = all.find((e) => e.parent_entity_id === parent.id && e.entity_type === "star");
      return child ?? parent;
    }
    cur = parent;
  }
  return null;
}
