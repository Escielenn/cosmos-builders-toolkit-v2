// ---------------------------------------------------------------------------
// open-on (Brief S1) — hydrate a simulator from the entity it was opened ON.
//
// A simulator must NOT know which other simulator produced the entity. It
// reads PREDICATES by name (08-VOCABULARY) and falls back to the entity's own
// master fields, both of which are tool-agnostic. Nothing here dispatches on
// `_source.tool_id`, and no function in this file names two tools — that would
// be a handoff, which is the thing S1 exists to replace.
//
// The seed goes out through the STELLARFORGE_LOAD message every sim.html
// already implements, and every one of them applies each field only when it
// is present (`if (p.x != null)`). So a partial seed is a supported input:
// no new protocol, no sim.html edits.
//
// HONESTY NOTE. The mappings below are only the ones where the predicate and
// the simulator's own control mean the same quantity in the same unit.
// ExoForge is a planet, so most of a planet's canon lands on it. Rogue's
// `mass` is the INTRUDER's mass, not the subject's, so a planet's mass must
// never be fed to it — an open-on that quietly mis-seeds is worse than one
// that seeds nothing. Solaris and Rogue therefore hydrate thinly on purpose,
// and the simulator still knows its subject for publishing and for the banner.
// ---------------------------------------------------------------------------

import type { WorldEntry } from "@/services/world-data";
import { readPublishedFact } from "./published-facts";

/** A partial `parameters` object for STELLARFORGE_LOAD. */
export type SimSeed = Record<string, number | string>;

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    // Master fields are free text: "1.47", "1.47 g", "1.47g".
    const n = Number.parseFloat(value.replace(/[^\d.eE+-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * One quantity, looked up by canon predicate first and the entity's own
 * master field second. Both are tool-agnostic; neither names a producer.
 */
function readNumber(
  entry: WorldEntry,
  predicate: string,
  masterField?: string,
): number | null {
  const fact = readPublishedFact(entry, predicate);
  const fromFact = asNumber(fact?.value);
  if (fromFact !== null) return fromFact;
  if (!masterField) return null;
  const meta = (entry.metadata ?? {}) as Record<string, unknown>;
  return asNumber(meta[masterField]);
}

function readText(
  entry: WorldEntry,
  predicate: string,
  masterField?: string,
): string | null {
  const fact = readPublishedFact(entry, predicate);
  const fromFact = asText(fact?.value);
  if (fromFact !== null) return fromFact;
  if (!masterField) return null;
  const meta = (entry.metadata ?? {}) as Record<string, unknown>;
  return asText(meta[masterField]);
}

function put(seed: SimSeed, key: string, value: number | string | null): void {
  if (value !== null) seed[key] = value;
}

// ---------------------------------------------------------------------------
// Per-simulator seeds
// ---------------------------------------------------------------------------

/**
 * ExoForge builds a planet, so a planet's canon maps onto it directly. Each
 * pair below is the same quantity in the same unit on both sides — see the
 * sim's own STELLARFORGE_LOAD handler (public/tools/exoforge/sim.html).
 */
function exoforgeSeed(entry: WorldEntry): SimSeed {
  const seed: SimSeed = {};
  put(seed, "name", entry.title || null);
  put(seed, "radius", readNumber(entry, "planet.radius", "radius"));
  put(
    seed,
    "mass",
    readNumber(entry, "planet.mass", "mass") ??
      readNumber(entry, "planet.mass_earths"),
  );
  put(seed, "temp", readNumber(entry, "planet.temp_mean", "surfaceTemperature"));
  put(seed, "period", readNumber(entry, "planet.rotation_period", "dayLength"));
  put(seed, "ocean", readNumber(entry, "planet.hydrosphere_fraction"));
  put(seed, "atmo", readNumber(entry, "planet.atmo_pressure"));
  put(seed, "starTemp", readNumber(entry, "star.temp_effective"));
  put(seed, "composition", readText(entry, "planet.composition", "composition"));
  return seed;
}

/**
 * Solaris builds a system. Its architecture vocabulary (`arch`, separations,
 * star modes) is its own and has no canon equivalent, so only the two values
 * that unambiguously match are seeded. The writer sets the rest — which is
 * correct: Solaris is where a system's shape is decided, not where it is
 * read back.
 */
function solarisSeed(entry: WorldEntry): SimSeed {
  const seed: SimSeed = {};
  put(seed, "systemName", entry.title || readText(entry, "system.name", "systemName"));
  put(seed, "planetCount", readNumber(entry, "system.body_count"));
  return seed;
}

/**
 * Rogue stages an encounter. Everything it loads except the host system
 * describes the INTRUDER — mass, speed, approach angle, distance — which is
 * the thing the writer is inventing, not something the subject entity knows.
 * Seeding those from the subject would be a category error, so it names the
 * system and stops.
 */
function rogueSeed(entry: WorldEntry): SimSeed {
  const seed: SimSeed = {};
  put(
    seed,
    "currentSystem",
    readText(entry, "system.name", "systemName") ?? entry.title ?? null,
  );
  return seed;
}

/**
 * Tidelock's seed is already computed by readTidelockSeed, which speaks its
 * own `handoffSeed` shape rather than a `parameters` patch. It is wired in
 * TidelockSimulator and deliberately not duplicated here.
 */
const SEED_BUILDERS: Record<string, (entry: WorldEntry) => SimSeed> = {
  exoforge: exoforgeSeed,
  solaris: solarisSeed,
  rogue: rogueSeed,
};

/**
 * The `parameters` patch for a simulator opened on an entity, or null when
 * there is nothing this simulator can honestly take from it. Null means
 * "leave the sim at its defaults" — never a half-applied guess.
 */
export function buildSimSeed(
  simulatorType: string,
  entry: WorldEntry | null | undefined,
): SimSeed | null {
  if (!entry) return null;
  const build = SEED_BUILDERS[simulatorType];
  if (!build) return null;
  const seed = build(entry);
  return Object.keys(seed).length > 0 ? seed : null;
}

/** Which simulators can hydrate through this module. */
export const OPEN_ON_SIMULATORS = Object.keys(SEED_BUILDERS);
