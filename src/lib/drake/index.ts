/**
 * The Drake equation, in one place.
 *
 *   N = R* · fp · ne · fl · fi · fc · L
 *
 * (Drake 1961; as conventionally written, e.g. Drake & Sobel, "Is Anyone Out
 * There?", 1992.) R* is the galactic star-formation rate (stars/yr), fp the
 * fraction of stars with planets, ne habitable planets per such system, fl,
 * fi, fc the fractions that develop life, intelligence and detectable
 * technology, and L the years a civilisation stays detectable. N is the
 * number of detectable civilisations in the galaxy now.
 *
 * Every surface that shows N (the calculator page, the Drake context hook,
 * the Drake PDF reports, the world-bible and empire views, the infobox)
 * imports from here so they cannot drift apart.
 */

export const DRAKE_FACTORS = ["rStar", "fp", "ne", "fl", "fi", "fc", "L"] as const;
export type DrakeFactor = (typeof DRAKE_FACTORS)[number];
export type DrakeValues = Record<DrakeFactor, number>;

export interface DrakeCalcOptions {
  /**
   * Value used for a factor that is missing, blank or not a number.
   * 0 (default) means "unknown factor, no result"; 1 ignores the factor.
   */
  missingAs?: number;
}

function toFactor(v: unknown, missingAs: number): number {
  if (v === null || v === undefined || v === "") return missingAs;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : missingAs;
}

/** N = R* · fp · ne · fl · fi · fc · L. Extra keys are ignored. */
export function calculateDrakeN(
  values: Partial<Record<DrakeFactor, unknown>> | Record<string, unknown>,
  options: DrakeCalcOptions = {}
): number {
  const missingAs = options.missingAs ?? 0;
  const v = values as Partial<Record<DrakeFactor, unknown>>;
  return DRAKE_FACTORS.reduce((acc, key) => acc * toFactor(v[key], missingAs), 1);
}

export type DrakeBand = "very-lonely" | "lonely" | "sparse" | "moderate" | "crowded" | "teeming";

export interface DrakeInterpretation {
  band: DrakeBand;
  label: string;
  description: string;
}

export function getDrakeInterpretation(n: number): DrakeInterpretation {
  if (n < 1) return {
    band: "very-lonely",
    label: "Very Lonely",
    description: "Fewer than one civilization expected. We may be alone in the galaxy, or civilizations are so rare that contact is essentially impossible.",
  };
  if (n < 10) return {
    band: "lonely",
    label: "Lonely",
    description: "A handful of civilizations might exist. Finding each other would be like finding needles in a cosmic haystack.",
  };
  if (n < 100) return {
    band: "sparse",
    label: "Sparse",
    description: "Dozens of civilizations. Contact is possible but requires patience and luck. Good for stories about first contact as a rare, meaningful event.",
  };
  if (n < 1000) return {
    band: "moderate",
    label: "Moderate",
    description: "Hundreds of civilizations. Enough for a network, but vast distances mean most remain isolated. Good for stories about distant rumors.",
  };
  if (n < 10000) return {
    band: "crowded",
    label: "Crowded",
    description: "Thousands of civilizations. Regional groupings, alliances, and conflicts become possible. Classic space opera territory.",
  };
  return {
    band: "teeming",
    label: "Teeming",
    description: "A galaxy full of life. Civilizations bump into each other regularly. Think Star Trek or Star Wars. The Fermi Paradox becomes very pressing.",
  };
}

/** Display format for N and L: 4 dp below 1, words for millions and billions. */
export function formatDrakeNumber(n: number): string {
  if (n < 1) return n.toFixed(4);
  if (n < 10) return n.toFixed(2);
  if (n < 1000) return n.toFixed(1);
  if (n < 1000000) return Math.round(n).toLocaleString();
  if (n < 1000000000) return (n / 1000000).toFixed(1) + " million";
  return (n / 1000000000).toFixed(1) + " billion";
}
