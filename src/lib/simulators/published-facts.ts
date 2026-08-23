// ---------------------------------------------------------------------------
// published-facts, the "publish" and "open-on" halves of Brief S1
// (docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §1).
//
// The whole point of publish/open-on is that a simulator reading a published
// entity must NOT know which other simulator produced it — it reads named
// predicates ("star.luminosity_lsun"), never another tool's internal shape.
// This module is the one place that boundary is enforced: writers (publish)
// and readers (open-on) both go through PublishedFact, never through a raw
// simulator payload directly.
//
// Scope of this pass: Solaris's per-planet publish only (STELLARFORGE_
// PUBLISH_PLANET, sent from a real button in sim.html's planet panel next to
// the existing "Send to..." handoff buttons — see sim.html's
// publishSelectedPlanet()). The other four simulators' existing whole-
// payload "Publish to World" flow (PublishToWorldDialog.tsx) is untouched;
// generalizing this module to them is future work, not attempted here. Two
// reasons, not one: (1) Solaris's own STELLARFORGE_SAVE payload only ever
// contains generation config and bare counts (starMode, planetCount, ...),
// never real per-planet numbers — extractSolarisFacts's rich shape
// (simulation-facts.ts) has no live data to read today, confirmed against
// the actual sim.html source. The handoff button already proves real numbers
// ARE available, just not through that path — through the live in-memory
// selPlanet/system objects at the moment of a click, exactly like this
// module's source data. (2) Brief S1's own acceptance test is specifically
// "generate a system in Solaris, publish, click a planet, land in ExoSky
// already pointed at it" — a working vertical slice beats five shallow ones.
//
// Pure by design where possible: no React, no network in the fact-shaping
// functions. Storage/read helpers touch Supabase (via world-entries.ts) at
// the call sites, not here.
// ---------------------------------------------------------------------------

import type { HandoffPayload } from "./handoff";
import { SOLARIS_HZ_MID, solarisPlanetTypeLabel } from "./handoff";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishedFact {
  /** "<domain>.<attribute>", e.g. "planet.orbital_distance_au". Never a tool name. */
  predicate: string;
  /** Shown in the reviewable diff before publish, and wherever a fact renders. */
  label: string;
  value: number | string;
  unit?: string;
}

export interface PublishProvenance {
  kind: "sim";
  tool_id: string;
  published_at: string; // ISO
}

/** The shape written into world_entries.metadata by a publish. */
export interface PublishedEntityMetadata {
  _published_facts: PublishedFact[];
  _source: PublishProvenance;
}

// ---------------------------------------------------------------------------
// Publish: HandoffPayload → PublishedFact[]
// ---------------------------------------------------------------------------

/**
 * The reviewable diff for a Solaris planet publish. Every value here is a
 * real number or string already flowing through the proven-live handoff
 * path — nothing here is invented to fill a gap.
 */
export function solarisPlanetPublishFacts(payload: HandoffPayload): PublishedFact[] {
  return [
    { predicate: "planet.name", label: "Planet Name", value: payload.planetName },
    // The RAW typeKey (e.g. "gasgiant"), not the humanized label — this
    // value round-trips into readSolarisHandoffPredicate below, which feeds
    // it back through solarisPlanetTypeLabel() the same way the original
    // ?handoff= path does. Storing the already-humanized string here would
    // make that a no-op-by-coincidence today and a silent bug the day
    // solarisPlanetTypeLabel's fallback behaviour changes.
    { predicate: "planet.type", label: "Planet Type", value: payload.planetType },
    {
      predicate: "planet.orbital_distance_au",
      label: "Orbital Distance",
      value: Number(payload.planetAU.toFixed(3)),
      unit: "AU",
    },
    { predicate: "star.spectral_class", label: "Star Spectral Class", value: payload.starType },
    {
      predicate: "star.luminosity_lsun",
      label: "Stellar Luminosity",
      value: Number(payload.starMassLum.toFixed(4)),
      unit: "L☉",
    },
    ...(payload.systemName
      ? [{ predicate: "system.name", label: "Star System", value: payload.systemName }]
      : []),
  ];
}

/**
 * Human-readable value for the reviewable diff / any other render surface.
 * The stored value stays raw (see the comment on planet.type above); this is
 * where the one Solaris-specific humanization (typeKey → "Gas Giant") lives,
 * kept out of the stored predicate so a reader never has to know it needs
 * undoing.
 */
export function formatPublishedFact(fact: PublishedFact): string {
  const value = fact.predicate === "planet.type" ? solarisPlanetTypeLabel(String(fact.value)) : fact.value;
  return `${value}${fact.unit ? ` ${fact.unit}` : ""}`;
}

/** A short prose summary for world_entries.content, so a published entity
 * doesn't render as an empty draft in the Codex (its previous behaviour —
 * PublishToWorldDialog wrote metadata only, never content). */
export function publishedFactsSummary(facts: PublishedFact[]): string {
  const line = facts.map((f) => `${f.label}: ${formatPublishedFact(f)}`).join(" · ");
  return `<p>${line}</p>`;
}

/**
 * Return type is deliberately the wider Record<string, unknown>, not
 * PublishedEntityMetadata: world_entries.metadata is typed as Json at the
 * database boundary (world-entries.ts's CreateEntryInput/WorldEntry), and a
 * plain interface has no index signature to satisfy that structurally. The
 * object shape still matches PublishedEntityMetadata exactly — that type
 * exists to document the shape for readers, not to round-trip through here.
 */
export function buildPublishedMetadata(
  facts: PublishedFact[],
  toolId: string,
): Record<string, unknown> {
  return {
    _published_facts: facts,
    _source: { kind: "sim", tool_id: toolId, published_at: new Date().toISOString() },
  } satisfies PublishedEntityMetadata;
}

// ---------------------------------------------------------------------------
// Open-on: WorldEntry → predicate lookups
//
// Deliberately reads ONLY metadata._published_facts by predicate name. A
// simulator hydrating from this never touches _source.tool_id to change its
// own behaviour — that field is provenance for a human to read, not a
// dispatch key. That's what keeps this generic instead of another handoff.
// ---------------------------------------------------------------------------

function fin(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Every published fact on an entry, or [] if it was never published through this module. */
export function readPublishedFacts(entry: WorldEntry | null | undefined): PublishedFact[] {
  if (!entry) return [];
  const meta = entry.metadata as Record<string, unknown> | null;
  const facts = meta?._published_facts;
  return Array.isArray(facts) ? (facts as PublishedFact[]) : [];
}

/** One fact by predicate name, or undefined. */
export function readPublishedFact(
  entry: WorldEntry | null | undefined,
  predicate: string,
): PublishedFact | undefined {
  return readPublishedFacts(entry).find((f) => f.predicate === predicate);
}

/**
 * Everything Tidelock's existing ?handoff= consumer already needs
 * (SOLARIS_HZ_MID + auFraction — see TidelockSimulator.tsx), computed
 * generically from predicates instead of a Solaris-shaped payload. Returns
 * null when the entry doesn't carry both facts — a partial/foreign entity is
 * "nothing to hydrate from", not a crash.
 */
export function readTidelockSeed(
  entry: WorldEntry | null | undefined,
): { auFraction: number; starLuminosity: number } | null {
  const starType = readPublishedFact(entry, "star.spectral_class");
  const orbitalAU = readPublishedFact(entry, "planet.orbital_distance_au");
  const luminosity = readPublishedFact(entry, "star.luminosity_lsun");
  if (!starType || typeof starType.value !== "string") return null;
  if (!orbitalAU || !fin(orbitalAU.value)) return null;
  if (!luminosity || !fin(luminosity.value)) return null;
  const hzMid = SOLARIS_HZ_MID[starType.value as keyof typeof SOLARIS_HZ_MID];
  if (!fin(hzMid) || hzMid <= 0) return null;
  return { auFraction: orbitalAU.value / hzMid, starLuminosity: luminosity.value };
}

/**
 * ExoSky's existing ?handoff= consumer (src/pages/simulators/
 * ExoskySimulator.tsx) already knows how to turn a full HandoffPayload into
 * a sky vantage (deriveExoskySeed + describeHandoffPlanet). Rather than
 * duplicate that logic for the entity-based path, this reconstructs the same
 * shape from generic predicates — internal reuse of an existing consumer,
 * not a new coupling: the predicates read here carry no tool identity, only
 * `_source.tool_id` (never inspected by this function) records where they
 * came from. If a future publisher writes these same five predicates from
 * a different tool, this reconstruction is equally valid for it — the
 * `from: "solaris"` tag on the output exists only because HandoffPayload's
 * type requires *a* literal there today; nothing here checks it.
 */
export function reconstructSolarisHandoff(entry: WorldEntry | null | undefined): HandoffPayload | null {
  const planetName = readPublishedFact(entry, "planet.name");
  const planetType = readPublishedFact(entry, "planet.type");
  const orbitalAU = readPublishedFact(entry, "planet.orbital_distance_au");
  const starType = readPublishedFact(entry, "star.spectral_class");
  const luminosity = readPublishedFact(entry, "star.luminosity_lsun");
  if (!planetName || typeof planetName.value !== "string") return null;
  if (!planetType || typeof planetType.value !== "string") return null;
  if (!orbitalAU || !fin(orbitalAU.value)) return null;
  if (!starType || typeof starType.value !== "string") return null;
  if (!luminosity || !fin(luminosity.value)) return null;
  if (!(starType.value in SOLARIS_HZ_MID)) return null;

  return {
    from: "solaris",
    starType: starType.value as HandoffPayload["starType"],
    starMassLum: luminosity.value,
    planetAU: orbitalAU.value,
    planetName: planetName.value,
    planetType: planetType.value,
  };
}
