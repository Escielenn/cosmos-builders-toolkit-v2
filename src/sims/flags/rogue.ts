// ---------------------------------------------------------------------------
// Rogue consequence flags.
//
// Brief S4 names two Rogue rules.
//
//   - Accidental habitability (an encounter perturbs a body INTO the
//     habitable zone): LIVE as of 2026-09-02. public/rogue/sim.html now posts
//     `results.bodies[]` — `{name, ptype, a0, a, e, ejected}` — where `a0` is
//     the pre-encounter semi-major axis the body was built with and `a`/`e`
//     are vis-viva elements from the live state (orbitalElementsFromState,
//     the same function Publish Aftermath uses), plus the system's `habZone`
//     bounds. `evaluateRogueRunFlags` compares before and after. It reports
//     nothing before launch, because nothing has happened yet.
//   - An ejected body retaining tidal heating: still NOT wired. There is no
//     tidal-heating-after-ejection model anywhere in sim.html, and inventing
//     a number to cite is exactly what a flag must never do. That is S2
//     (Rogue as world-generator) territory. `ejectedBodyStillWarm` stays a
//     tested predicate against the shape Rogue SHOULD emit.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface RogueEjectionOutput {
  bodyName: string;
  starless: boolean;
  /** Estimated years the body retains internal heat from tidal flexing pre-ejection. */
  tidalHeatingYears: number;
}

export interface RogueEncounterOutput {
  bodyName: string;
  /** Was this body outside the habitable zone before the encounter? */
  wasOutsideHZ: boolean;
  /** Is it inside the habitable zone after the encounter perturbed its orbit? */
  isInsideHZ: boolean;
  epochLabel: string;
}

const ejectedBodyStillWarm: SimFlagRule<RogueEjectionOutput> = (o) => {
  if (!o.starless || o.tidalHeatingYears <= 0) return null;
  return {
    id: "rogue.ejected-body-still-warm",
    sim: "rogue",
    severity: "opportunity",
    title: `${o.bodyName.toUpperCase()}: STARLESS, STILL WARM`,
    body: `A subsurface ocean for roughly ${Math.round(o.tidalHeatingYears / 1e6)} million years after ejection — this world doesn't need a sun to keep a story alive underneath it.`,
    cites: { body: o.bodyName, tidalHeatingYears: Math.round(o.tidalHeatingYears) },
  };
};

const accidentalHabitability: SimFlagRule<RogueEncounterOutput> = (o) => {
  if (!o.wasOutsideHZ || !o.isInsideHZ) return null;
  return {
    id: "rogue.accidental-habitability",
    sim: "rogue",
    severity: "opportunity",
    title: `${o.bodyName.toUpperCase()}: HABITABLE BY ACCIDENT`,
    body: `This world became habitable by accident, at ${o.epochLabel}. Nothing about its formation intended that — the story of how it got here may be more interesting than what lives there now.`,
    cites: { body: o.bodyName, epoch: o.epochLabel },
  };
};

export const ROGUE_RULES = {
  ejectedBodyStillWarm,
  accidentalHabitability,
};

/** One entry of `results.bodies[]` as posted by public/rogue/sim.html. */
export interface RogueBodyReport {
  name: string;
  ptype?: string;
  /** Pre-encounter semi-major axis, AU. */
  a0: number;
  /** Post-encounter semi-major axis, AU; null when unbound / not computable. */
  a: number | null;
  /** Post-encounter eccentricity; null when unbound. */
  e: number | null;
  ejected: boolean;
}

export interface RogueRunOutput {
  /** [inner, outer] habitable-zone bounds in AU, from the system definition. */
  habZone: readonly [number, number] | null | undefined;
  bodies: readonly RogueBodyReport[] | null | undefined;
  /** Simulated years since launch. */
  simTime: number;
}

/**
 * An orbit "sits in" the habitable zone when its semi-major axis is inside
 * the bounds AND it is not so eccentric that it spends most of the year
 * outside them. 0.3 is a conservative writer-facing threshold, not a claim
 * about climate models; it is cited so the writer can see it.
 */
const MAX_HZ_ECCENTRICITY = 0.3;

export function evaluateRogueRunFlags(run: RogueRunOutput): SimFlag[] {
  const hz = run.habZone;
  if (!hz || !Array.isArray(hz) || hz.length !== 2 || !run.bodies || !Array.isArray(run.bodies)) return [];
  const [inner, outer] = hz;
  if (!(inner > 0) || !(outer > inner)) return [];
  const inside = (a: number) => a >= inner && a <= outer;
  const out: SimFlag[] = [];
  for (const b of run.bodies) {
    if (!b || typeof b !== "object" || b.ejected) continue;
    if (typeof b.a0 !== "number" || typeof b.a !== "number" || typeof b.e !== "number") continue;
    if (inside(b.a0)) continue;
    if (!inside(b.a) || b.e > MAX_HZ_ECCENTRICITY) continue;
    const f = accidentalHabitability({
      bodyName: String(b.name ?? "Body"),
      wasOutsideHZ: true,
      isInsideHZ: true,
      epochLabel: `T+${Math.max(0, Math.round(run.simTime))} yr after the encounter`,
    });
    if (f) {
      out.push({
        ...f,
        cites: { ...f.cites, a0_AU: b.a0, a_AU: b.a, e: b.e, hz_AU: `${inner}–${outer}`, maxE: MAX_HZ_ECCENTRICITY },
      });
    }
  }
  return out;
}

export function evaluateRogueEjectionFlags(output: RogueEjectionOutput): SimFlag[] {
  const f = ejectedBodyStillWarm(output);
  return f ? [f] : [];
}

export function evaluateRogueEncounterFlags(output: RogueEncounterOutput): SimFlag[] {
  const f = accidentalHabitability(output);
  return f ? [f] : [];
}
