// ---------------------------------------------------------------------------
// simulation-facts, what a saved simulation can tell the writing surface.
//
// This is the join the product was missing. Simulators persist to
// simulation_saves; the writing surface read only `worksheets`. So a writer
// could spend an hour naming stars and drawing constellations in ExoSky, then
// open the editor and find none of it — the numbers and names existed in the
// database and no writing surface could see them.
//
// Facts come back in the same WorksheetFact shape the worksheet extractor
// emits, so panels and the continuity engine consume both without branching.
// Keys are namespaced (`sky.`, `system.`) so a simulator fact can never be
// mistaken for an entity-metadata key.
//
// Every field read here was checked against the actual saved shape first.
// Three of the continuity engine's original checks were dead because they
// targeted fields nothing wrote; that mistake is not worth repeating.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";
import { extractExoskyFacts } from "@/lib/simulators/exosky-save";
import { extractRogueFacts } from "@/lib/simulators/rogue-save";
import {
  extractTidelockFacts,
  extractExoforgeFacts,
} from "@/lib/simulators/iframe-sim-facts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function obj(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function fin(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** Trim a float to something a writer would actually type. */
function tidy(n: number): string {
  if (Math.abs(n) >= 100) return Math.round(n).toLocaleString();
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

// ---------------------------------------------------------------------------
// Solaris
// ---------------------------------------------------------------------------

/**
 * A saved star system, as facts.
 *
 * Native saves carry an exact `parameters.sf2System` snapshot. Saves written by
 * the original static simulator carry generator settings only and no body
 * names, so those yield just the system name — correct, and better than
 * inventing names that were never chosen.
 */
export function extractSolarisFacts(raw: unknown): WorksheetFact[] {
  const payload = obj(raw);
  if (!payload) return [];

  const facts: WorksheetFact[] = [];
  const params = obj(payload.parameters) ?? {};
  const system = obj(params.sf2System);

  const systemName = str(system?.name) || str(payload.name);
  if (systemName) {
    facts.push({ key: "system.name", label: "Star system", value: systemName });
  }

  if (!system) return facts;

  // ── Stars ──
  const starList = Array.isArray(system.stars)
    ? system.stars
    : system.star
      ? [system.star]
      : [];

  const stars = starList.map(obj).filter((s): s is Record<string, unknown> => s !== null);

  if (stars.length > 0) {
    const arch = str(system.architecture);
    const described = stars
      .map((s) => {
        const name = str(s.name);
        const cls = str(s.classification);
        return name && cls ? `${name} (${cls})` : name || cls;
      })
      .filter(Boolean);

    if (described.length > 0) {
      facts.push({
        key: "system.stars",
        label: stars.length === 1 ? "Star" : `Stars (${arch || `${stars.length}`})`,
        value: described.join(", "),
      });
    }

    // The habitable zone of the primary is the number most likely to end up in
    // prose, and the one most likely to be contradicted by it.
    const primary = stars[0];
    const hzIn = fin(primary.habitableZoneInnerAU);
    const hzOut = fin(primary.habitableZoneOuterAU);
    if (hzIn !== null && hzOut !== null) {
      facts.push({
        key: "system.habitableZone",
        label: "Habitable zone",
        value: `${tidy(hzIn)}–${tidy(hzOut)} AU`,
      });
    }
  }

  // ── Planets ──
  const planets = (Array.isArray(system.planets) ? system.planets : [])
    .map(obj)
    .filter((p): p is Record<string, unknown> => p !== null);

  if (planets.length > 0) {
    facts.push({
      key: "system.planetCount",
      label: "Planets",
      value: String(planets.length),
    });

    for (const p of planets) {
      const name = str(p.name);
      if (!name) continue;

      const au = fin(p.semiMajorAxisAU);
      const period = fin(p.orbitalPeriodYears);
      const type = str(p.type).replace(/-/g, " ");

      const detail = [
        type,
        au !== null ? `${tidy(au)} AU` : "",
        // Years under one are far more legible as days.
        period !== null
          ? period < 1
            ? `${Math.round(period * 365.25)} day year`
            : `${tidy(period)} year orbit`
          : "",
        p.inHabitableZone === true ? "in the habitable zone" : "",
      ]
        .filter(Boolean)
        .join(" · ");

      facts.push({
        key: `system.planet.${name.toLowerCase().replace(/\s+/g, "-")}`,
        label: name,
        value: detail || "planet",
        // The row's subject is the planet's name; that's what goes in the prose.
        insert: name,
      });

      // Named moons are prime setting material, so surface them with the planet.
      const moons = (Array.isArray(p.moons) ? p.moons : [])
        .map(obj)
        .map((m) => str(m?.name))
        .filter(Boolean);
      if (moons.length > 0) {
        facts.push({
          key: `system.moons.${name.toLowerCase().replace(/\s+/g, "-")}`,
          label: `Moons of ${name}`,
          value: moons.join(", "),
        });
      }
    }
  }

  return facts;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/** Simulators whose save shape this module can read: now all five. */
export const FACT_CAPABLE_SIMULATORS = [
  "exosky",
  "solaris",
  "rogue",
  "tidelock",
  "exoforge",
] as const;

/**
 * Labelled facts from one saved simulation.
 *
 * Returns [] for a simulator with no extractor yet (Rogue, Tidelock, ExoForge
 * are still static iframes writing their own shapes), so callers must treat an
 * empty result as "not readable yet" rather than "the save is empty".
 */
export function extractSimulationFacts(
  simulatorType: string,
  data: unknown,
): WorksheetFact[] {
  switch (simulatorType) {
    case "exosky":
      return extractExoskyFacts(data);
    case "solaris":
      return extractSolarisFacts(data);
    case "rogue":
      return extractRogueFacts(data);
    case "tidelock":
      return extractTidelockFacts(data);
    case "exoforge":
      return extractExoforgeFacts(data);
    default:
      return [];
  }
}

/** True when a saved simulation of this type can be read for facts. */
export function hasSimulationFactSupport(simulatorType: string): boolean {
  return (FACT_CAPABLE_SIMULATORS as readonly string[]).includes(simulatorType);
}

// ---------------------------------------------------------------------------
// Feeding the continuity engine
// ---------------------------------------------------------------------------

/**
 * Where a simulator fact means exactly what a continuity check means.
 *
 * The display facts above are written to be read: "1.33 g, heavy going", or
 * "391 K (118°C), scorching". The continuity engine parses a number out of the
 * value and compares it to the prose, so it needs the bare figure and it needs
 * the key the checks actually match on (`surfaceGravity`, not `forged.gravity`).
 *
 * Only exact semantic matches are listed. A simulator number that merely
 * resembles a check is worse than nothing here: the engine would tell a writer
 * their prose contradicts their world using a figure that was never about the
 * same thing.
 */
const CONTINUITY_EQUIVALENTS: Record<
  string,
  { key: string; label: string; unit?: string }
> = {
  // ExoForge builds a single world; its numbers are that world's numbers.
  "forged.gravity": { key: "surfaceGravity", label: "Surface Gravity (g)" },
  "forged.temperature": { key: "surfaceTemperature", label: "Surface Temperature (K)" },
  "forged.rotation": { key: "dayLength", label: "Day Length (hours)" },

  // Tidelock: the terminator, not the day side. A tidally locked world's
  // habitable band is where a story happens, and it is the temperature a writer
  // is describing when they describe weather.
  "locked.gravity": { key: "surfaceGravity", label: "Surface Gravity (g)" },
  "locked.terminator": { key: "surfaceTemperature", label: "Surface Temperature (K)" },
};

/** The leading number in a formatted display value, e.g. "391 K (118°C)" → 391. */
function leadingNumber(value: string): number | null {
  const m = value.match(/-?\d[\d,]*\.?\d*/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Simulator facts re-expressed in the keys and bare values the continuity
 * engine compares against prose.
 *
 * Returns only the ones that map. Feed these to `checkContinuity` alongside
 * worksheet facts, so a saved simulation can contradict the manuscript the same
 * way a filled-in worksheet already can.
 */
export function toContinuityFacts(facts: WorksheetFact[]): WorksheetFact[] {
  const out: WorksheetFact[] = [];
  const seen = new Set<string>();

  for (const fact of facts) {
    const equiv = CONTINUITY_EQUIVALENTS[fact.key];
    if (!equiv || seen.has(equiv.key)) continue;
    const n = leadingNumber(fact.value);
    if (n === null) continue;
    seen.add(equiv.key);
    out.push({ key: equiv.key, label: equiv.label, value: String(n) });
  }
  return out;
}
