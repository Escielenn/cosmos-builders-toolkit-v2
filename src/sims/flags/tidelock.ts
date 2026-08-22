// ---------------------------------------------------------------------------
// Tidelock consequence flags.
//
// This absorbs src/lib/simulators/plausibility-notes.ts's Tidelock rules
// (Law VII — name what a new view replaces): narrowBand and weakEscape and
// invertedGradient are the same triggers, re-voiced to state the
// consequence rather than the number. noHeatTransport is new — the second
// rule Brief S4 (11-SIMULATOR-CONSTELLATION.md §2) specifies for Tidelock.
//
// Every field read here is already posted in sim.html's STELLARFORGE_SAVE
// results block (public/tools/tidelock/sim.html:1762-1775) — no sim.html
// changes were needed for this sim.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface TidelockOutput {
  tSSP: number; // substellar point temperature, K — the permanent dayside
  tASP: number; // antistellar point temperature, K — the permanent nightside
  tTerm: number; // terminator temperature, K
  habPct: number; // % of the surface inside the habitable temperature band
  escVel: number; // surface escape velocity, km/s
}

function fin(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

const narrowHabitableBand: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.habPct) || o.habPct <= 0 || o.habPct >= 5) return null;
  return {
    id: "tidelock.narrow-habitable-band",
    sim: "tidelock",
    severity: "tension",
    title: `HABITABLE BAND: ${o.habPct.toFixed(1)}°`,
    body: "That is not a civilization. That is a valley. A band this narrow supports one settlement, not a species-scale story — worth knowing before the manuscript assumes more than one.",
    cites: { habPct: Number(o.habPct.toFixed(1)) },
  };
};

const noHeatTransport: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.tSSP) || !fin(o.tASP)) return null;
  if (o.tASP >= 150 || o.tSSP - o.tASP <= 250) return null;
  return {
    id: "tidelock.no-heat-transport",
    sim: "tidelock",
    severity: "tension",
    title: `DAYSIDE ${Math.round(o.tSSP)}K, NIGHTSIDE ${Math.round(o.tASP)}K`,
    body: "No heat transport. Nothing crosses the terminator — the night side is its own separate world, physically, and the day side never cools.",
    cites: { tSSP: Math.round(o.tSSP), tASP: Math.round(o.tASP) },
  };
};

const weakEscapeVelocity: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.escVel) || o.escVel <= 0 || o.escVel >= 5) return null;
  return {
    id: "tidelock.weak-escape-velocity",
    sim: "tidelock",
    severity: "tension",
    title: `ESCAPE VELOCITY: ${o.escVel.toFixed(1)} KM/S`,
    body: "Below Mars's own 5.0 km/s. Over geological time a world this small tends to lose its atmosphere rather than keep one — this world may not have air by the time your story is set.",
    cites: { escVel: Number(o.escVel.toFixed(1)) },
  };
};

const invertedThermalGradient: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.tSSP) || !fin(o.tTerm) || o.tTerm <= o.tSSP) return null;
  return {
    id: "tidelock.inverted-thermal-gradient",
    sim: "tidelock",
    severity: "tension",
    title: `TERMINATOR ${Math.round(o.tTerm)}K OVER SUBSTELLAR ${Math.round(o.tSSP)}K`,
    body: "The terminator reads hotter than the point facing the star directly — the reverse of what tidal heating from the star alone produces. Worth a second look if that wasn't the intent.",
    cites: { tSSP: Math.round(o.tSSP), tTerm: Math.round(o.tTerm) },
  };
};

export const TIDELOCK_RULES: SimFlagRule<TidelockOutput>[] = [
  narrowHabitableBand,
  noHeatTransport,
  weakEscapeVelocity,
  invertedThermalGradient,
];

export function evaluateTidelockFlags(output: TidelockOutput): SimFlag[] {
  return TIDELOCK_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}
