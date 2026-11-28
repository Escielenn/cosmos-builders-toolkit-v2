// ---------------------------------------------------------------------------
// Canon → PlanetSceneFacts. The only place the planet scene reads canon.
//
// Two sources, in order of authority:
//   1. merged canon facts for the planet (canon.facts, via useCanonFacts):
//      what the writer asserted or accepted;
//   2. facts a simulator published onto the entity (readPublishedFact):
//      what Solaris, Tidelock or ExoForge put there.
// A value missing from both stays null, and bindPlanetScene derives it and
// says so. Nothing here writes.
//
// Civilisation and life are read, never guessed: city lights need a
// population on the planet or a polity that claims it as territory;
// vegetation needs an ecology fact on the planet.
// ---------------------------------------------------------------------------

import type { CanonFact } from "@/canon/types";
import type { WorldEntry } from "@/services/world-data";
import { readPublishedFact } from "@/lib/simulators/published-facts";
import { EMPTY_FACTS, type PlanetSceneFacts } from "./planet-scene";

/** A canon FactValue, a published raw value, or a display string. */
type Value = unknown;

/** Unwrap a FactValue to its payload; pass anything else through. */
function payload(v: Value): unknown {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.kind === "range" && typeof o.min === "number" && typeof o.max === "number") return (o.min + o.max) / 2;
    if ("value" in o) return o.value;
  }
  return v;
}

function asNumber(raw: Value): number | null {
  const v = payload(raw);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(/[^\d.eE+-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asText(raw: Value): string | null {
  const v = payload(raw);
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function asBool(raw: Value): boolean | null {
  const v = payload(raw);
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    if (/^(true|yes|locked|tidally[\s_-]?locked|synchronous|1)$/i.test(v.trim())) return true;
    if (/^(false|no|unlocked|free|0)$/i.test(v.trim())) return false;
  }
  return null;
}

/** A stable seed from an id, so a world keeps its coastlines between visits. */
export function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000 || 1;
}

export interface CanonPlanetSources {
  entry: WorldEntry;
  /** Merged canon facts for the WORLD (all subjects); filtered here. */
  facts: CanonFact[];
}

export function planetSceneFactsFromCanon({ entry, facts }: CanonPlanetSources): PlanetSceneFacts {
  const own = facts.filter((f) => f.subjectId === entry.id);
  const canonValue = (predicate: string): Value | null => {
    const hit = own.find((f) => f.predicate === predicate);
    if (!hit) return null;
    return hit.value ?? hit.valueText;
  };
  const read = (...predicates: string[]): Value => {
    for (const p of predicates) {
      const c = canonValue(p);
      if (c !== null && c !== undefined) return c;
    }
    for (const p of predicates) {
      const pub = readPublishedFact(entry, p);
      if (pub) return pub.value;
    }
    return null;
  };
  const num = (...p: string[]) => asNumber(read(...p));

  const hydroRaw = num("planet.hydrosphere_fraction");
  const population = num("place.population");
  const claimed = facts.some(
    (f) =>
      f.predicate === "polity.territory[]" &&
      (JSON.stringify(f.value ?? "").includes(entry.id) || (f.valueText ?? "").includes(entry.id)),
  );
  const life = own.some((f) => f.predicate.startsWith("ecology."));
  const ringsSaid = own.some((f) => /rings/i.test(f.predicate) && /present|yes|true/i.test(f.valueText ?? ""));

  return {
    ...EMPTY_FACTS,
    name: entry.title ?? null,
    spectralClass: asText(read("star.spectral_class")),
    starTeffK: num("star.temp_effective"),
    starLuminosityLsun: num("star.luminosity", "star.luminosity_lsun"),
    starMassMsun: num("star.mass"),
    starAgeGyr: num("star.age"),
    aAU: num("orbit.semi_major_axis", "planet.orbital_distance_au"),
    massEarth: num("planet.mass", "planet.mass_earths"),
    radiusEarth: num("planet.radius"),
    albedo: num("planet.albedo"),
    pressureBar: num("planet.atmo_pressure"),
    composition: asText(read("planet.atmo_composition")),
    // Percent or fraction: canon says "fraction", writers type both.
    hydrosphere: hydroRaw === null ? null : hydroRaw > 1 ? hydroRaw / 100 : hydroRaw,
    obliquityDeg: num("planet.obliquity"),
    rotationHours: num("planet.rotation_period"),
    tidallyLocked: asBool(read("orbit.tidally_locked")),
    // ExoForge publishes "Rings: Present" without an extent; Saturn's
    // proportions stand in until a ring predicate exists (/sf-fact).
    rings: ringsSaid ? { inner: 1.3, outer: 2.2 } : null,
    civilisation: (population !== null && population > 0) || claimed ? true : null,
    life: life ? true : null,
    seed: seedFromId(entry.id),
  };
}
