/**
 * World-parameter taxonomy for the World Influence panel (the cascade
 * differentiator in the Studio editor). Mirrors PLANETARY_PARAMETERS in
 * the Environmental Chain Reaction tool, which stores each chosen driver
 * as a "{category}-{value}" slug (e.g. "gravity-low", "rotation-locked").
 *
 * Pure + dependency-free so it's unit-testable. For each parameter we
 * carry a human label and the keywords to scan a scene's prose for, so
 * the panel can tell a writer which world physics their scene engages.
 */

export type ParamCategory =
  | "gravity" | "rotation" | "stellar" | "hydrosphere"
  | "atmosphere" | "tilt" | "geological" | "other";

interface CategorySpec {
  label: string;
  /** category-wide scan keywords (lowercased, word-ish) */
  keywords: string[];
  /** per-value label + extra keywords */
  values: Record<string, { label: string; keywords?: string[] }>;
}

const CATALOG: Record<ParamCategory, CategorySpec> = {
  gravity: {
    label: "Gravity",
    keywords: ["gravity", "gravities", "weight", "weightless", "heavy", "g-force", "g's"],
    values: {
      high: { label: "High gravity", keywords: ["crushing", "heavy"] },
      low: { label: "Low gravity", keywords: ["float", "leap", "light-footed"] },
    },
  },
  rotation: {
    label: "Rotation / Day",
    keywords: ["day", "night", "rotation", "dawn", "dusk", "twilight", "hours long"],
    values: {
      slow: { label: "Slow rotation", keywords: ["long day", "long night"] },
      fast: { label: "Fast rotation", keywords: ["short day"] },
      locked: { label: "Tidally locked", keywords: ["tidally locked", "day side", "night side", "terminator"] },
    },
  },
  stellar: {
    label: "Stellar",
    keywords: ["star", "stars", "sun", "suns", "sunlight", "starlight"],
    values: {
      binary: { label: "Binary system", keywords: ["binary", "two suns", "second sun"] },
      reddwarf: { label: "Red dwarf", keywords: ["red dwarf", "flare", "dim red"] },
      rogue: { label: "Rogue planet", keywords: ["starless", "eternal dark", "no sun", "sunless"] },
    },
  },
  hydrosphere: {
    label: "Hydrosphere",
    keywords: ["water", "ocean", "sea", "rain", "river", "drought", "dry"],
    values: {
      ocean: { label: "Ocean world", keywords: ["endless sea", "waves"] },
      desert: { label: "Desert world", keywords: ["desert", "arid", "parched"] },
      archipelago: { label: "Archipelago", keywords: ["island", "islands", "archipelago"] },
    },
  },
  atmosphere: {
    label: "Atmosphere",
    keywords: ["air", "atmosphere", "pressure", "breathe", "wind", "storm", "sky"],
    values: {
      thick: { label: "Thick atmosphere", keywords: ["heavy air", "dense air"] },
      thin: { label: "Thin atmosphere", keywords: ["thin air", "gasping"] },
      exotic: { label: "Exotic air", keywords: ["methane", "ammonia", "toxic air"] },
    },
  },
  tilt: {
    label: "Axial Tilt",
    keywords: ["season", "seasons", "solstice", "equinox", "tilt"],
    values: {
      none: { label: "No tilt", keywords: ["no seasons", "unchanging"] },
      extreme: { label: "Extreme tilt", keywords: ["endless summer", "endless winter"] },
      chaotic: { label: "Chaotic tilt", keywords: ["unpredictable season"] },
    },
  },
  geological: {
    label: "Geology",
    keywords: ["quake", "earthquake", "volcano", "volcanic", "tremor", "eruption", "tectonic", "lava"],
    values: {
      high: { label: "Tectonic activity", keywords: ["mountain", "fault"] },
      dead: { label: "Geologically dead", keywords: ["ancient surface", "no volcano"] },
      cryo: { label: "Cryovolcanism", keywords: ["ice volcano", "cryovolcano"] },
    },
  },
  other: { label: "Unique factor", keywords: [], values: {} },
};

export interface WorldParameter {
  slug: string;
  category: ParamCategory;
  label: string;
  keywords: string[];
}

/** Parse a stored slug like "gravity-low" into a labelled parameter. */
export function parseParameterSlug(slug: string): WorldParameter | null {
  if (!slug || typeof slug !== "string") return null;
  const dash = slug.indexOf("-");
  const cat = (dash === -1 ? slug : slug.slice(0, dash)) as ParamCategory;
  const val = dash === -1 ? "" : slug.slice(dash + 1);
  const spec = CATALOG[cat];
  if (!spec) return null;
  const valSpec = spec.values[val];
  const label = valSpec ? valSpec.label : spec.label;
  const keywords = Array.from(
    new Set([...spec.keywords, ...(valSpec?.keywords ?? [])].map((k) => k.toLowerCase())),
  );
  return { slug, category: cat, label, keywords };
}

/** How many times the scene's text engages a parameter's keywords. */
export function countParameterHits(plainText: string, param: WorldParameter): number {
  if (!plainText) return 0;
  const hay = plainText.toLowerCase();
  let hits = 0;
  for (const kw of param.keywords) {
    // word-boundary-ish match for single words; substring for phrases
    const re = kw.includes(" ")
      ? new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      : new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    hits += (hay.match(re) ?? []).length;
  }
  return hits;
}

/** Strip HTML to plain text for scanning. */
export function toPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
