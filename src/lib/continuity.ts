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
  /**
   * Ship's-Voice plural noun for the multi-candidate message, e.g.
   * "CONTRADICTS ALL 3 PLANETS ON FILE." This is display phrasing only — it
   * is not entity binding. Facts carry no subject_id yet (that's S0); this
   * just names what kind of thing a spec's field usually belongs to.
   */
  subjectNoun: string;
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
    subjectNoun: "PLANETS",
  },
  {
    keys: ["dayLength"],
    keywords: ["hour", "hours", "hour-long", "daylength"],
    kind: "measure",
    tolerance: 0.15,
    subjectNoun: "PLANETS",
  },
  {
    keys: ["axialTilt"],
    keywords: ["tilt", "tilted", "obliquity", "degrees"],
    kind: "measure",
    tolerance: 0.2,
    subjectNoun: "PLANETS",
  },
  {
    keys: ["mass"],
    keywords: ["earth-mass", "earth-masses", "earth masses"],
    kind: "measure",
    tolerance: 0.15,
    subjectNoun: "PLANETS",
  },
  {
    keys: ["radius"],
    keywords: ["earth-radii", "earth radii", "earth-radius"],
    kind: "measure",
    tolerance: 0.15,
    subjectNoun: "PLANETS",
  },
  {
    keys: ["surfaceTemperature"],
    keywords: ["kelvin", "k"],
    kind: "measure",
    tolerance: 0.15,
    subjectNoun: "PLANETS",
  },
  // ── System ──────────────────────────────────────────────────────────
  {
    keys: ["orbitalDistance"],
    keywords: ["au", "astronomical", "astronomical units"],
    kind: "measure",
    tolerance: 0.15,
    subjectNoun: "ORBITS",
  },
  {
    keys: ["stellarLuminosity"],
    keywords: ["luminosity", "luminosities", "solar luminosity"],
    kind: "measure",
    tolerance: 0.2,
    subjectNoun: "STARS",
  },
  // ── Vessel / journey ────────────────────────────────────────────────
  {
    keys: ["cruiseVelocity"],
    keywords: ["lightspeed", "light-speed", "of c", "fraction of c"],
    kind: "measure",
    tolerance: 0.15,
    subjectNoun: "VESSELS",
  },
  {
    keys: ["crewSize"],
    keywords: ["crew", "crewmembers", "crewmen", "hands", "complement"],
    kind: "count",
    subjectNoun: "VESSELS",
  },
  // ── Civilisation ────────────────────────────────────────────────────
  {
    keys: ["population"],
    keywords: ["population", "inhabitants", "citizens", "souls", "people"],
    // Populations are quoted loosely ("about nine billion" for 8.7e9), so this
    // is a measurement with a wide band, not an exact count.
    kind: "measure",
    tolerance: 0.25,
    subjectNoun: "CIVILIZATIONS",
  },
  {
    keys: ["civilizationLongevity"],
    keywords: ["years", "millennia", "centuries"],
    kind: "measure",
    tolerance: 0.25,
    subjectNoun: "CIVILIZATIONS",
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
 * Facts are pooled across every worksheet and simulation in the world with
 * no subject attached (that arrives with S0 — see
 * docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §0). Until then, a key like
 * "surfaceGravity" can have more than one candidate fact — one per planet
 * that recorded it. Picking whichever sorts first would report confident,
 * specific, wrong contradictions in any world with two-plus of the same
 * entity type. Instead: a contradiction only fires when the sentence
 * contradicts EVERY candidate for that key. If even one candidate is
 * consistent, there is no way yet to know which one the sentence is about,
 * so nothing is reported — a false negative, never a false positive.
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

  // Group pooled facts by key — a key with exactly one fact is the common
  // case and behaves exactly as before; a key with several is where the
  // wrong-answer bug lived.
  const byKey = new Map<string, WorksheetFact[]>();
  for (const fact of facts) {
    const bucket = byKey.get(fact.key);
    if (bucket) bucket.push(fact);
    else byKey.set(fact.key, [fact]);
  }

  for (const spec of CHECKS) {
    const candidates = spec.keys.flatMap((k) => byKey.get(k) ?? []);
    if (candidates.length === 0) continue;

    // A value the writer typed outranks one a simulator derived (pre-existing
    // rule — see toContinuityFacts/simulationSourceLabel). Worksheet facts
    // carry no `source`; simulator-derived facts do. When both exist for a
    // key, only the writer-typed ones are candidates — this is a source
    // precedence rule, not a subject-ambiguity one, and orthogonal to the
    // two-planet case just below: it only narrows the set BEFORE asking
    // whether every remaining candidate agrees.
    const authored = candidates.filter((f) => !f.source);
    const working = authored.length > 0 ? authored : candidates;

    const comparable = working
      .map((fact) => ({ fact, worldNum: factNumber(fact) }))
      .filter((c): c is { fact: WorksheetFact; worldNum: number } => c.worldNum !== null);
    if (comparable.length === 0) continue; // every candidate is qualitative; nothing to compare

    for (const sentence of sentences(text)) {
      const claimed = quantityNear(sentence, spec.keywords);
      if (claimed === null) continue;

      const allContradict = comparable.every(({ worldNum }) =>
        spec.kind === "count"
          ? claimed !== worldNum
          : Math.abs(claimed - worldNum) >
            Math.max(Math.abs(worldNum) * (spec.tolerance ?? 0.15), 1e-9),
      );
      if (!allContradict) continue;

      // One note per key — repeating the same mismatch every sentence is noise.
      const dedupeKey = spec.keys.join("|");
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const first = comparable[0].fact;
      const multi = comparable.length > 1;

      notes.push({
        factKey: first.key,
        factLabel: first.label,
        worldValue: multi ? comparable.map((c) => c.fact.value).join(" / ") : first.value,
        proseValue: formatNumber(claimed),
        excerpt: sentence.length > 160 ? sentence.slice(0, 157) + "…" : sentence,
        message: multi
          ? `CONTRADICTS ALL ${comparable.length} ${spec.subjectNoun} ON FILE.`
          : `${first.source ?? "Your world"} records ${first.label} as ${first.value}; this reads ${formatNumber(claimed)}.`,
      });
      break;
    }
  }

  return notes;
}

// ---------------------------------------------------------------------------
// TIER 2 — physical implausibility
//
// Tier 1 catches a contradicted *number*. Tier 2 catches a contradicted
// *implication*: a tidally locked world has no sunrise, a 1.5 g world has no
// effortless leaping, a starless rogue planet has no noon.
//
// Keyed to the qualitative cascade drivers the Environmental Chain Reaction
// tool already stores as "{category}-{value}" slugs (see world-parameters.ts),
// so every rule below is backed by data a writer actually chose. Nothing here
// infers a driver the world never recorded.
// ---------------------------------------------------------------------------

export interface ImplausibilityRule {
  /** ECR slug this applies to, e.g. "rotation-locked". */
  slug: string;
  /** Shown to the writer as the world's stated condition. */
  condition: string;
  /** Phrases that contradict it. Lowercase; matched as substrings. */
  contradicts: string[];
  /** Why it conflicts, in one plain sentence. */
  because: string;
}

const IMPLAUSIBILITY: ImplausibilityRule[] = [
  {
    slug: "rotation-locked",
    condition: "tidally locked",
    contradicts: ["sunrise", "sunset", "sun rose", "sun set", "sun sank", "dawn broke", "at dawn", "at dusk"],
    because:
      "One face always holds the star, so the sun never rises or sets. The terminator is the only twilight.",
  },
  {
    slug: "gravity-high",
    condition: "high gravity",
    contradicts: ["leapt", "leaped", "bounded", "effortless", "weightless", "light on her feet", "light on his feet", "sprang up", "floated"],
    because: "Under high gravity, every step and lift costs more, not less.",
  },
  {
    slug: "gravity-low",
    condition: "low gravity",
    contradicts: ["crushing weight", "could barely lift", "pinned to the", "leaden limbs", "impossibly heavy"],
    because: "Low gravity makes mass easier to move, not harder.",
  },
  {
    slug: "stellar-rogue",
    condition: "a starless rogue planet",
    contradicts: ["sunlight", "sunrise", "sunset", "noon", "the sun ", "daylight", "sunny"],
    because: "A rogue planet has no star, so there is no sunlight and no day.",
  },
  {
    slug: "atmosphere-thin",
    condition: "a thin atmosphere",
    contradicts: ["shouted across", "heard the roar", "gust knocked", "howling wind"],
    because: "Thin air carries sound poorly and cannot deliver much wind force.",
  },
  {
    slug: "hydrosphere-ocean",
    condition: "an ocean world",
    contradicts: ["endless desert", "miles of sand", "arid plain"],
    because: "An ocean world has little exposed land, let alone desert.",
  },
  {
    slug: "tilt-none",
    condition: "no axial tilt",
    contradicts: ["midsummer", "midwinter", "first snow of", "seasons turned", "autumn came"],
    because: "Without tilt there are no seasons to turn.",
  },
];

/**
 * Flag prose that contradicts what the world's chosen drivers imply.
 *
 * @param html   The document's HTML.
 * @param slugs  ECR parameter slugs for this world (from useWorldParameters).
 */
export function checkImplausibility(
  html: string | null | undefined,
  slugs: string[],
): ContinuityNote[] {
  const text = proseToText(html);
  if (!text || slugs.length === 0) return [];

  const lower = text.toLowerCase();
  const active = new Set(slugs);
  const notes: ContinuityNote[] = [];

  for (const rule of IMPLAUSIBILITY) {
    if (!active.has(rule.slug)) continue;

    const hit = rule.contradicts.find((phrase) => lower.includes(phrase));
    if (!hit) continue;

    // Quote the sentence it appeared in, so the note is actionable.
    const sentence =
      sentences(text).find((s) => s.toLowerCase().includes(hit)) ?? "";

    notes.push({
      factKey: rule.slug,
      factLabel: rule.condition,
      worldValue: rule.condition,
      proseValue: hit.trim(),
      excerpt: sentence.length > 160 ? sentence.slice(0, 157) + "…" : sentence,
      message: `Your world is ${rule.condition}. ${rule.because}`,
    });
  }

  return notes;
}
