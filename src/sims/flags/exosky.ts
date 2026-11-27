// ---------------------------------------------------------------------------
// ExoSky consequence flags.
//
// `visibleCount` is the naked-eye count (V <= 6.5, no atmosphere) of real
// catalogue stars as seen from the observer. 1.8 also counted a fixed
// 20,000-point Earth-frame backdrop, so the count read 10,000+ everywhere and
// this rule could never fire (E6). The backdrop is no longer counted.
//
// `catalogueComplete` is false when the observer is far enough from the Sun
// that faint neighbours are missing from the catalogue (exosky-sky.ts
// catalogueReach). An empty-looking sky there is the catalogue's edge, not
// the sky's, so the rule stays quiet rather than telling a writer something
// untrue.
//
// Sky Drift (N5, 11-SIMULATOR-CONSTELLATION §4): a constellation drawn at one
// epoch, seen at another, has moved relative to the pole by the planet's OWN
// precession (not Earth's 25,772 years).
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface ExoSkyOutput {
  visibleCount: number; // naked-eye stars at this vantage point
  /** Defaults to true for callers that predate 1.9. */
  catalogueComplete?: boolean;
  /** Constellations with the epoch they were drawn in (years from J2000). */
  constellations?: Array<{ name: string; epochYears: number }>;
  /** The epoch being viewed, years from J2000. */
  epochYears?: number;
  /** How far the pole has moved since each constellation's epoch, deg (precomputed with poleDriftDeg). */
  driftDeg?: Record<string, number>;
  /** The planet's precession period, years. */
  precessionYears?: number;
}

/**
 * Below this, a sky reads as visually empty — too few reference points for
 * a culture to have drawn lines between them at all.
 */
const EMPTY_SKY_THRESHOLD = 20;

/** Drift that a navigator or a calendar-keeper would notice, degrees. */
export const SKY_DRIFT_THRESHOLD_DEG = 2;

const emptySky: SimFlagRule<ExoSkyOutput> = (o) => {
  if (typeof o.visibleCount !== "number" || o.visibleCount >= EMPTY_SKY_THRESHOLD) return null;
  if (o.catalogueComplete === false) return null;
  return {
    id: "exosky.empty-sky",
    sim: "exosky",
    severity: "tension",
    title: `NAKED EYE: ${o.visibleCount} STARS`,
    body: "A sky this empty produces no constellations. No navigation by starlight, no astrology, and no founding myths written across it. Whatever this culture worships, it is not up there.",
    cites: { visibleCount: o.visibleCount },
  };
};

/** One flag for the constellation that has drifted furthest. */
const skyDrift: SimFlagRule<ExoSkyOutput> = (o) => {
  if (!o.constellations?.length || !o.driftDeg || typeof o.epochYears !== "number") return null;
  let worst: { name: string; epochYears: number; drift: number } | null = null;
  for (const c of o.constellations) {
    const d = o.driftDeg[c.name];
    if (typeof d === "number" && d >= SKY_DRIFT_THRESHOLD_DEG && (!worst || d > worst.drift)) worst = { ...c, drift: d };
  }
  if (!worst) return null;
  const years = Math.abs(Math.round(o.epochYears - worst.epochYears));
  return {
    id: "exosky.sky-drift",
    sim: "exosky",
    severity: "opportunity",
    title: `SKY DRIFT: ${worst.name.toUpperCase()} HAS PRECESSED ${worst.drift.toFixed(1)}°`,
    body: `The pole has moved ${worst.drift.toFixed(1)}° since this sky was named, ${years.toLocaleString()} years ${o.epochYears >= worst.epochYears ? "ago" : "from now"}. The old star-lore no longer lines up. Someone still teaches it anyway.`,
    cites: {
      constellation: worst.name,
      drawnAtEpoch: worst.epochYears,
      viewedAtEpoch: o.epochYears,
      driftDeg: Number(worst.drift.toFixed(2)),
      ...(typeof o.precessionYears === "number" && Number.isFinite(o.precessionYears) ? { precessionYears: Math.round(o.precessionYears) } : {}),
    },
  };
};

export const EXOSKY_RULES: SimFlagRule<ExoSkyOutput>[] = [emptySky, skyDrift];

export function evaluateExoSkyFlags(output: ExoSkyOutput): SimFlag[] {
  return EXOSKY_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}
