// ---------------------------------------------------------------------------
// continuity, check prose against the world's own recorded numbers.
//
// This is the thing Scrivener structurally cannot do. Its research folder holds
// notes, which cannot disagree with your manuscript. StellarForge's research is
// structured data — a planet knows its gravity, a drive knows its cruise
// velocity — so the world can tell you when the prose contradicts it.
//
// TIER 1 (this module): contradiction of *stated* facts. If the world records
// one moon and the prose says "two moons rose", say so. No physics modelling,
// no ML: extract numbers near a concept's keywords and compare them to the
// value the writer already recorded.
//
// Deliberately conservative. A false alarm costs the writer trust, and writers
// break their own rules on purpose all the time — so this only fires when it
// finds an explicit numeric claim about a fact the world states numerically,
// and it always reports both numbers so the writer can judge.
//
// Pure: no React, no network, no I/O. Unit-tested.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContinuityNote {
  /** Master-field key the claim contradicts, e.g. "moonCount". */
  factKey: string;
  /** Human label, e.g. "Number of Moons". */
  factLabel: string;
  /** What the world records. */
  worldValue: string;
  /** What the prose appears to claim. */
  proseValue: string;
  /** The sentence the claim was found in, for context. */
  excerpt: string;
  /** Message to show the writer. Always names both numbers. */
  message: string;
}

// ---------------------------------------------------------------------------
// Number words
//
// Prose spells small numbers. "two moons" must be comparable to moonCount: 1.
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  no: 0, zero: 0,
  one: 1, a: 1, an: 1, single: 1, lone: 1, solitary: 1,
  two: 2, twin: 2, both: 2, pair: 2, double: 2,
  three: 3, triple: 3,
  four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12,
};

/**
 * Facts worth checking, and the words that signal prose is talking about them.
 *
 * Only countable/measurable facts appear here. A qualitative field ("Composition:
 * iron-rich") cannot be contradicted numerically, so it is left alone.
 */
interface CheckSpec {
  /** Master-field keys this spec applies to (see entity-config worksheetPaths). */
  keys: string[];
  /** Words that mean the prose is discussing this fact. */
  keywords: string[];
  /** Integer count (moons) vs measurement (gravity) changes the tolerance. */
  kind: "count" | "measure";
  /**
   * Fractional tolerance for measurements. Prose rounds ("about 1.5 g" for
   * 1.47) and that must not fire.
   */
  tolerance?: number;
}

/**
 * Every spec below targets a field that is ACTUALLY extractable — i.e. it has a
 * `worksheetPaths` mapping in entity-config.ts. Verify with:
 *
 *   grep -c 'worksheetPaths' src/lib/entity-config.ts
 *
 * A spec keyed to a field nothing maps is dead code that can never fire. An
 * earlier draft of this file checked `moonCount`, which no tool records: moons
 * exist only as `PlanetaryBody[].moons` inside Star System Builder, an array
 * path that `worksheetPaths` cannot express safely. Left out until array-aware
 * extraction exists, rather than shipping a check that silently never runs.
 */
const CHECKS: CheckSpec[] = [
  // ── Planet ──────────────────────────────────────────────────────────
  {
    keys: ["surfaceGravity"],
    keywords: ["gravity", "gravities", "g-force", "gee", "gees", "gs"],
    kind: "measure",
    tolerance: 0.15,
  },
  {
    keys: ["dayLength"],
    keywords: ["hour", "hours", "hour-long", "daylength"],
    kind: "measure",
    tolerance: 0.15,
  },
  {
    keys: ["axialTilt"],
    keywords: ["tilt", "tilted", "obliquity", "degrees"],
    kind: "measure",
    tolerance: 0.2,
  },
  {
    keys: ["mass"],
    keywords: ["earth-mass", "earth-masses", "earth masses"],
    kind: "measure",
    tolerance: 0.15,
  },
  {
    keys: ["radius"],
    keywords: ["earth-radii", "earth radii", "earth-radius"],
    kind: "measure",
    tolerance: 0.15,
  },
  {
    keys: ["surfaceTemperature"],
    keywords: ["kelvin", "k"],
    kind: "measure",
    tolerance: 0.15,
  },
  // ── System ──────────────────────────────────────────────────────────
  {
    keys: ["orbitalDistance"],
    keywords: ["au", "astronomical", "astronomical units"],
    kind: "measure",
    tolerance: 0.15,
  },
  {
    keys: ["stellarLuminosity"],
    keywords: ["luminosity", "luminosities", "solar luminosity"],
    kind: "measure",
    tolerance: 0.2,
  },
  // ── Vessel / journey ────────────────────────────────────────────────
  {
    keys: ["cruiseVelocity"],
    keywords: ["lightspeed", "light-speed", "of c", "fraction of c"],
    kind: "measure",
    tolerance: 0.15,
  },
  {
    keys: ["crewSize"],
    keywords: ["crew", "crewmembers", "crewmen", "hands", "complement"],
    kind: "count",
  },
  // ── Civilisation ────────────────────────────────────────────────────
  {
    keys: ["population"],
    keywords: ["population", "inhabitants", "citizens", "souls", "people"],
    // Populations are quoted loosely ("about nine billion" for 8.7e9), so this
    // is a measurement with a wide band, not an exact count.
    kind: "measure",
    tolerance: 0.25,
  },
  {
    keys: ["civilizationLongevity"],
    keywords: ["years", "millennia", "centuries"],
    kind: "measure",
    tolerance: 0.25,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip tags and decode the entities TipTap emits. */
export function proseToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split into sentences. Claims are judged one sentence at a time. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Scale words, so prose and recorded values are comparable.
 *
 * Without these, "nine billion people" parses as 9 and a recorded population of
 * 8700000000 looks like a wild contradiction — a false positive on the most
 * loosely-quoted figure in fiction. Also handles scientific notation, which is
 * how Kardashev energy output is stored (3.8e26).
 */
const SCALE_WORDS: Record<string, number> = {
  hundred: 1e2,
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
};

/** First number in a string, accepting digits, scientific notation, or a word. */
function parseNumeric(token: string): number | null {
  const cleaned = token.replace(/,/g, "");
  // Scientific notation first: 3.8e26 must not be read as 3.8.
  const sci = cleaned.match(/-?\d+(?:\.\d+)?[eE][+-]?\d+/);
  if (sci) {
    const n = Number(sci[0]);
    return Number.isFinite(n) ? n : null;
  }
  const digits = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (digits) {
    const n = Number(digits[0]);
    return Number.isFinite(n) ? n : null;
  }
  const word = NUMBER_WORDS[cleaned.toLowerCase()];
  return word === undefined ? null : word;
}

/** Scale multiplier if this token is "billion", "million", etc. */
function parseScale(token: string): number | null {
  const s = SCALE_WORDS[token.toLowerCase().replace(/[.!?,]$/, "")];
  return s === undefined ? null : s;
}

/**
 * The numeric value a fact records.
 *
 * Facts are display strings, so a population may arrive as "12 billion" or
 * "8.7e9" and both must reduce to the same magnitude.
 */
function factNumber(fact: WorksheetFact): number | null {
  const base = parseNumeric(fact.value);
  if (base === null) return null;
  // A trailing scale word multiplies: "12 billion".
  for (const tok of fact.value.split(/\s+/)) {
    const s = parseScale(tok);
    if (s !== null) return base * s;
  }
  return base;
}

/**
 * Find a quantity attached to one of `keywords` within a sentence.
 *
 * Looks a few tokens before the keyword ("two moons", "1.47 g of gravity") and
 * immediately after ("gravity of 1.47"). Returns null when no number is
 * attached — a sentence can mention moons without counting them.
 */
function quantityNear(sentence: string, keywords: string[]): number | null {
  const tokens = sentence.split(/[\s,;:()"']+/).filter(Boolean);
  const lower = tokens.map((t) => t.toLowerCase().replace(/[.!?]$/, ""));

  for (let i = 0; i < lower.length; i++) {
    if (!keywords.includes(lower[i])) continue;

    // Look back up to 3 tokens: "nine billion people", "about 1.47 g".
    for (let back = 1; back <= 3 && i - back >= 0; back++) {
      const n = parseNumeric(lower[i - back]);
      if (n === null) continue;
      // A scale word sits between the number and the noun: "nine billion souls".
      for (let s = 1; s < back; s++) {
        const scale = parseScale(lower[i - back + s]);
        if (scale !== null) return n * scale;
      }
      return n;
    }
    // Then forward: "gravity of 1.47", "crew of 400".
    for (let fwd = 1; fwd <= 3 && i + fwd < lower.length; fwd++) {
      const n = parseNumeric(lower[i + fwd]);
      if (n === null) continue;
      const scale = i + fwd + 1 < lower.length ? parseScale(lower[i + fwd + 1]) : null;
      return scale !== null ? n * scale : n;
    }
  }
  return null;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

/**
 * Compare prose against recorded facts and report explicit contradictions.
 *
 * @param html   The document's HTML (TipTap output).
 * @param facts  Facts from extractWorksheetFacts across the world's worksheets.
 */
export function checkContinuity(
  html: string | null | undefined,
  facts: WorksheetFact[],
): ContinuityNote[] {
  const text = proseToText(html);
  if (!text || facts.length === 0) return [];

  const notes: ContinuityNote[] = [];
  const seen = new Set<string>();

  for (const spec of CHECKS) {
    const fact = facts.find((f) => spec.keys.includes(f.key));
    if (!fact) continue;

    const worldNum = factNumber(fact);
    if (worldNum === null) continue; // qualitative value; nothing to compare

    for (const sentence of sentences(text)) {
      const claimed = quantityNear(sentence, spec.keywords);
      if (claimed === null) continue;

      const contradicts =
        spec.kind === "count"
          ? claimed !== worldNum
          : Math.abs(claimed - worldNum) >
            Math.max(Math.abs(worldNum) * (spec.tolerance ?? 0.15), 1e-9);

      if (!contradicts) continue;

      // One note per fact — repeating the same mismatch every sentence is noise.
      if (seen.has(fact.key)) continue;
      seen.add(fact.key);

      notes.push({
        factKey: fact.key,
        factLabel: fact.label,
        worldValue: fact.value,
        proseValue: formatNumber(claimed),
        excerpt: sentence.length > 160 ? sentence.slice(0, 157) + "…" : sentence,
        message: `Your world records ${fact.label} as ${fact.value}; this reads ${formatNumber(claimed)}.`,
      });
      break;
    }
  }

  return notes;
}
