// ---------------------------------------------------------------------------
// ExoSky consequence flags.
//
// `visibleCount` is a live useMemo in ExoSkySimulator.tsx (magnitude < 6.5,
// extinction-adjusted) already rendered as the "Naked Eye" readout — read
// directly, no payload round-trip needed since ExoSky is native React, not
// an iframe.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface ExoSkyOutput {
  visibleCount: number; // naked-eye stars at this vantage point
}

/**
 * Below this, a sky reads as visually empty — too few reference points for
 * a culture to have drawn lines between them at all.
 */
const EMPTY_SKY_THRESHOLD = 20;

const emptySky: SimFlagRule<ExoSkyOutput> = (o) => {
  if (typeof o.visibleCount !== "number" || o.visibleCount >= EMPTY_SKY_THRESHOLD) return null;
  return {
    id: "exosky.empty-sky",
    sim: "exosky",
    severity: "tension",
    title: `NAKED EYE: ${o.visibleCount} STARS`,
    body: "A sky this empty produces no constellations. No navigation by starlight, no astrology, no founding myths written across it — whatever this culture worships, it isn't up there.",
    cites: { visibleCount: o.visibleCount },
  };
};

export const EXOSKY_RULES: SimFlagRule<ExoSkyOutput>[] = [emptySky];

export function evaluateExoSkyFlags(output: ExoSkyOutput): SimFlag[] {
  return EXOSKY_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}
