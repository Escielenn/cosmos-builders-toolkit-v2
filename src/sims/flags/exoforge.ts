// ---------------------------------------------------------------------------
// ExoForge consequence flags.
//
// Both fields are already posted by sim.html's STELLARFORGE_SAVE block
// (public/tools/exoforge/sim.html:1818-1841) — no sim.html changes needed.
//
// The brief's second rule ("insolation below the photosynthesis floor")
// assumes a true stellar-flux number. ExoForge has no orbital-distance-to-
// flux model — `temp` is a direct slider value, not derived from the star
// (see sim.html:1244-1246) — so this is reframed around the one number that
// IS real: surface temperature against the tool's own habitable band
// (180-330 K, sim.html:636). Citing an invented flux figure would be worse
// than not shipping the rule at all.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface ExoForgeOutput {
  density: number; // Earth-relative, g/cm³ equivalent (5.51 * mass / radius³)
  temp: number; // surface temperature, K (writer-set)
}

function fin(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Above real super-Mercury territory (K2-229b ≈ 8.9 g/cm³) — iron-dominated. */
const IRON_CORE_DENSITY = 8.0;
const HABITABLE_FLOOR_K = 180;

const ironCoreNoTectonics: SimFlagRule<ExoForgeOutput> = (o) => {
  if (!fin(o.density) || o.density < IRON_CORE_DENSITY) return null;
  return {
    id: "exoforge.iron-core-no-tectonics",
    sim: "exoforge",
    severity: "tension",
    title: `DENSITY: ${o.density.toFixed(1)} G/CM³`,
    body: "No carbon cycle. A body this dense for its size is iron-dominated straight through — there's no silicate mantle left to drive plate tectonics, and climate has no long-term thermostat.",
    cites: { density: Number(o.density.toFixed(2)) },
  };
};

const belowPhotosynthesisFloor: SimFlagRule<ExoForgeOutput> = (o) => {
  if (!fin(o.temp) || o.temp >= HABITABLE_FLOOR_K) return null;
  return {
    id: "exoforge.below-photosynthesis-floor",
    sim: "exoforge",
    severity: "tension",
    title: `SURFACE TEMPERATURE: ${Math.round(o.temp)}K`,
    body: "Below this tool's own habitable floor. What eats here? A food web built on photosynthesis needs more warmth than this world receives — life, if any, runs on something other than sunlight.",
    cites: { temp: Math.round(o.temp), floor: HABITABLE_FLOOR_K },
  };
};

export const EXOFORGE_RULES: SimFlagRule<ExoForgeOutput>[] = [
  ironCoreNoTectonics,
  belowPhotosynthesisFloor,
];

export function evaluateExoForgeFlags(output: ExoForgeOutput): SimFlag[] {
  return EXOFORGE_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}
