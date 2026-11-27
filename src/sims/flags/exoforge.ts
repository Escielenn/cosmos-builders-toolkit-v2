// ---------------------------------------------------------------------------
// ExoForge consequence flags.
//
// 1.9 (EF1): ExoForge now derives temperature from the star and orbit
// (results.surfaceTemp) and checks mass against radius with Chen & Kipping
// 2017 and a pure-iron floor (results.massRadiusVerdict). The temperature
// rule reads the derived surface temperature; pre-1.9 saves fall back to
// the old `parameters.temp` slider value.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface ExoForgeOutput {
  density: number; // g/cm³ (5.514 × mass / radius³)
  temp: number; // surface temperature, K
  massRadiusVerdict?: string; // "consistent" | "unusual" | "implausible"
  expectedRadius?: number; // R⊕ for this mass (Chen & Kipping 2017)
  mass?: number; // M⊕
  radius?: number; // R⊕
}

function fin(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Above real super-Mercury territory (K2-229b ≈ 8.9 g/cm³) — iron-dominated. */
const IRON_CORE_DENSITY = 8.0;
const HABITABLE_FLOOR_K = 180;

const impossibleDensity: SimFlagRule<ExoForgeOutput> = (o) => {
  if (o.massRadiusVerdict !== "implausible" || !fin(o.density)) return null;
  const rho = o.density < 100 ? o.density.toFixed(1) : String(Math.round(o.density));
  return {
    id: "exoforge.impossible-density",
    sim: "exoforge",
    severity: "tension",
    title: `DENSITY ${rho} G/CM³. NO KNOWN MATERIAL.`,
    body: `Denser than pure iron at this mass, so no planet like this can exist.${fin(o.expectedRadius) ? ` A planet of this mass should be about ${o.expectedRadius.toFixed(2)} Earth radii.` : ""} Change the mass or the radius before anything downstream (gravity, escape velocity) is trusted.`,
    cites: {
      density: Number(o.density.toPrecision(3)),
      ...(fin(o.mass) ? { mass: Number(o.mass.toPrecision(3)) } : {}),
      ...(fin(o.radius) ? { radius: Number(o.radius.toFixed(2)) } : {}),
      ...(fin(o.expectedRadius) ? { expectedRadius: Number(o.expectedRadius.toFixed(2)) } : {}),
    },
  };
};

const ironCoreNoTectonics: SimFlagRule<ExoForgeOutput> = (o) => {
  if (!fin(o.density) || o.density < IRON_CORE_DENSITY || o.massRadiusVerdict === "implausible") return null;
  return {
    id: "exoforge.iron-core-no-tectonics",
    sim: "exoforge",
    severity: "tension",
    title: `DENSITY: ${o.density.toFixed(1)} G/CM³`,
    body: "No carbon cycle. A body this dense for its size is mostly iron. With little silicate mantle to drive plate tectonics, its climate has no long-term thermostat.",
    cites: { density: Number(o.density.toFixed(2)) },
  };
};

const belowPhotosynthesisFloor: SimFlagRule<ExoForgeOutput> = (o) => {
  if (!fin(o.temp) || o.temp <= 0 || o.temp >= HABITABLE_FLOOR_K) return null;
  return {
    id: "exoforge.below-photosynthesis-floor",
    sim: "exoforge",
    severity: "tension",
    title: `SURFACE TEMPERATURE: ${Math.round(o.temp)}K`,
    body: "What eats here? A food web built on photosynthesis needs more warmth than this world receives from its star, so any life here runs on something other than sunlight.",
    cites: { temp: Math.round(o.temp), floor: HABITABLE_FLOOR_K },
  };
};

export const EXOFORGE_RULES: SimFlagRule<ExoForgeOutput>[] = [
  impossibleDensity,
  ironCoreNoTectonics,
  belowPhotosynthesisFloor,
];

export function evaluateExoForgeFlags(output: ExoForgeOutput): SimFlag[] {
  return EXOFORGE_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}

/** Read an ExoForgeOutput from a sim payload (1.9 results, or a pre-1.9 save). */
export function exoforgeOutputFromPayload(payload: { parameters?: Record<string, unknown>; results?: Record<string, unknown> }): ExoForgeOutput {
  const p = payload.parameters ?? {};
  const r = payload.results ?? {};
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  return {
    density: n(r.density) ?? 0,
    temp: n(r.surfaceTemp) ?? n(p.temp) ?? 0,
    massRadiusVerdict: typeof r.massRadiusVerdict === "string" ? r.massRadiusVerdict : undefined,
    expectedRadius: n(r.expectedRadius),
    mass: n(p.mass),
    radius: n(p.radius),
  };
}
