// ---------------------------------------------------------------------------
// Rogue consequence flags — predicates only, NOT wired to live UI yet.
//
// Brief S4 names two Rogue rules: an ejected body retaining tidal heating,
// and an encounter perturbing a body into the habitable zone by accident.
// Neither has a live number today. Per the investigation behind this
// module: `pendingPayload.results` from STELLARFORGE_REQUEST_STATE
// (public/rogue/sim.html:1198-1203) is `{systemName, launched, running,
// simTime}` — no per-body state at all. The "Publish Aftermath" postMessage
// (sim.html:1073-1088) carries survivor names but explicitly filters OUT
// ejected bodies (survivorsToSystemPayload, sim.html:683-718), and there is
// no tidal-heating-after-ejection model or before/after habitable-zone
// comparison anywhere in the file — `ejectedSet` (sim.html:661-674) and
// `habZone` bounds exist only as internal variables, never posted out.
//
// Both rules need real physics added to sim.html (a tidal-heating decay
// curve, an orbital-crossing-vs-HZ check) before they can cite a true
// number — that is S2 (Rogue as world-generator) territory per
// 11-SIMULATOR-CONSTELLATION.md's own sequencing, not a wiring gap this
// session should paper over with an invented figure.
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

export function evaluateRogueEjectionFlags(output: RogueEjectionOutput): SimFlag[] {
  const f = ejectedBodyStillWarm(output);
  return f ? [f] : [];
}

export function evaluateRogueEncounterFlags(output: RogueEncounterOutput): SimFlag[] {
  const f = accidentalHabitability(output);
  return f ? [f] : [];
}
