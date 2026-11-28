// ---------------------------------------------------------------------------
// Tidelock consequence flags (1.9, T5).
//
// Every field read here is posted in sim.html's STELLARFORGE_SAVE results
// block (public/tools/tidelock/sim.html, REQUEST_STATE handler). The 1.9
// fields are optional so a save made before 1.9 still evaluates: a rule
// whose inputs are missing stays quiet.
//
// Changes from 1.8: the narrow-band title printed a surface PERCENT with a
// degree sign; it now reads the band's real width in degrees and km. The
// inverted-gradient rule could never fire (the profile is monotonic) and
// is gone. The escape-velocity rule is replaced by the sim's own retention
// test of the actual bulk gas. Two new rules: atmosphere collapse, and a
// world that is not tidally locked at all.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface TidelockOutput {
  tSSP: number; // substellar surface temperature, K
  tASP: number; // antistellar (coldest night-side) temperature, K
  tTerm: number; // terminator temperature, K
  habPct: number; // % of the surface where water can be liquid (0–100)
  escVel: number; // surface escape velocity, km/s
  bandWidthDeg?: number; // liquid-water band, degrees of arc
  bandWidthKm?: number; // liquid-water band, km
  collapse?: boolean; // night side below the bulk gas's condensation point
  condensationK?: number;
  condensingGas?: string;
  pressureAtm?: number;
  epsilon?: number; // day–night heat redistribution efficiency 0–1
  atmRetention?: string; // "Retained" | "Marginal" | "Lost" | "No atmosphere"
  retentionGas?: string;
  exobaseK?: number;
  tidalLock?: string; // "Locked" | "Likely locked" | "Not locked"
  lockTimescaleYr?: number;
  systemAgeGyr?: number;
  starLifetimeGyr?: number;
}

function fin(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** 1.2e5 → "120 KYR", 3e11 → "300 GYR". */
export function formatYears(y: number): string {
  if (y < 1e3) return `${Math.round(y)} YR`;
  if (y < 1e6) return `${Number((y / 1e3).toPrecision(2))} KYR`;
  if (y < 1e9) return `${Number((y / 1e6).toPrecision(2))} MYR`;
  return `${Number((y / 1e9).toPrecision(2))} GYR`;
}

const narrowHabitableBand: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.bandWidthDeg) || o.bandWidthDeg <= 0 || o.bandWidthDeg >= 5) return null;
  const km = fin(o.bandWidthKm) ? Math.round(o.bandWidthKm) : null;
  return {
    id: "tidelock.narrow-habitable-band",
    sim: "tidelock",
    severity: "tension",
    title: `LIQUID-WATER BAND: ${o.bandWidthDeg.toFixed(1)}°${km !== null ? ` (${km} KM)` : ""}`,
    body: "That is not a civilization, that is a valley. A band this narrow holds one strip of settlement around the planet. Check this before the manuscript assumes more than one city.",
    cites: { bandWidthDeg: Number(o.bandWidthDeg.toFixed(1)), ...(km !== null ? { bandWidthKm: km } : {}) },
  };
};

const noHeatTransport: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.tSSP) || !fin(o.tASP)) return null;
  // 1.9 saves carry ε; older ones fall back to the temperature contrast.
  const weak = fin(o.epsilon) ? o.epsilon < 0.1 : o.tASP < 150 && o.tSSP - o.tASP > 250;
  if (!weak || o.tSSP - o.tASP <= 150) return null;
  return {
    id: "tidelock.no-heat-transport",
    sim: "tidelock",
    severity: "tension",
    title: `DAYSIDE ${Math.round(o.tSSP)}K, NIGHTSIDE ${Math.round(o.tASP)}K`,
    body: "No heat transport. Nothing crosses the terminator. The night side is physically a separate world, and the day side never cools.",
    cites: {
      tSSP: Math.round(o.tSSP),
      tASP: Math.round(o.tASP),
      ...(fin(o.epsilon) ? { epsilon: Number(o.epsilon.toFixed(2)) } : {}),
    },
  };
};

const atmosphereCollapse: SimFlagRule<TidelockOutput> = (o) => {
  if (o.collapse !== true || !fin(o.tASP) || !fin(o.condensationK)) return null;
  const gas = (o.condensingGas || "THE AIR").toUpperCase();
  return {
    id: "tidelock.atmosphere-collapse",
    sim: "tidelock",
    severity: "tension",
    title: `NIGHTSIDE ${Math.round(o.tASP)}K. ${gas} FREEZES BELOW ${Math.round(o.condensationK)}K.`,
    body: "The atmosphere condenses onto the night side as ice until too little is left to carry heat. The temperatures shown assume it holds; it does not. Thicken the air, add greenhouse warming, or let this world lose its sky.",
    cites: {
      tASP: Math.round(o.tASP),
      condensationK: Math.round(o.condensationK),
      ...(fin(o.pressureAtm) ? { pressureAtm: Number(o.pressureAtm.toFixed(2)) } : {}),
    },
  };
};

const atmosphereEscapes: SimFlagRule<TidelockOutput> = (o) => {
  if (o.atmRetention !== "Lost") return null;
  const gas = (o.retentionGas || "THE BULK GAS").toUpperCase();
  return {
    id: "tidelock.atmosphere-escapes",
    sim: "tidelock",
    severity: "tension",
    title: `${gas} ESCAPES. ESCAPE VELOCITY ${fin(o.escVel) ? o.escVel.toFixed(1) : "?"} KM/S.`,
    body: "Its molecules move fast enough at the top of the atmosphere to leak away over geological time. By the time your story is set, this world may have no air of this kind left.",
    cites: {
      ...(fin(o.escVel) ? { escVel: Number(o.escVel.toFixed(1)) } : {}),
      ...(fin(o.exobaseK) ? { exobaseK: Math.round(o.exobaseK) } : {}),
    },
  };
};

const notTidallyLocked: SimFlagRule<TidelockOutput> = (o) => {
  if (o.tidalLock !== "Not locked" || !fin(o.lockTimescaleYr) || !fin(o.systemAgeGyr)) return null;
  return {
    id: "tidelock.not-locked",
    sim: "tidelock",
    severity: "tension",
    title: `LOCKING TAKES ${formatYears(o.lockTimescaleYr)}. THE SYSTEM IS ${o.systemAgeGyr.toFixed(1)} GYR OLD.`,
    body: "This world still turns. Its sun rises and sets, so nothing in this simulator's day-side and night-side picture applies yet. Move it closer to its star, or let it have days.",
    cites: { lockTimescaleYr: Number(o.lockTimescaleYr.toPrecision(2)), systemAgeGyr: o.systemAgeGyr },
  };
};

const starTooOld: SimFlagRule<TidelockOutput> = (o) => {
  if (!fin(o.systemAgeGyr) || !fin(o.starLifetimeGyr) || o.systemAgeGyr <= o.starLifetimeGyr) return null;
  return {
    id: "tidelock.star-past-main-sequence",
    sim: "tidelock",
    severity: "tension",
    title: `SYSTEM AGE ${o.systemAgeGyr.toFixed(1)} GYR. STAR LEAVES THE MAIN SEQUENCE AT ${o.starLifetimeGyr.toFixed(1)} GYR.`,
    body: "A star this massive has already swollen into a giant by this age. The planet as shown would have been cooked, then left orbiting a remnant.",
    cites: { systemAgeGyr: o.systemAgeGyr, starLifetimeGyr: Number(o.starLifetimeGyr.toFixed(1)) },
  };
};

export const TIDELOCK_RULES: SimFlagRule<TidelockOutput>[] = [
  atmosphereCollapse,
  notTidallyLocked,
  narrowHabitableBand,
  noHeatTransport,
  atmosphereEscapes,
  starTooOld,
];

export function evaluateTidelockFlags(output: TidelockOutput): SimFlag[] {
  return TIDELOCK_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}

/** Read a TidelockOutput from a sim payload's `results` block. */
export function tidelockOutputFromResults(r: Record<string, unknown>): TidelockOutput {
  const num = (k: string) => (typeof r[k] === "number" && Number.isFinite(r[k]) ? (r[k] as number) : undefined);
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : undefined);
  return {
    tSSP: num("tSSP") ?? 0,
    tASP: num("tASP") ?? 0,
    tTerm: num("tTerm") ?? 0,
    habPct: num("habPct") ?? 0,
    escVel: num("escVel") ?? 0,
    bandWidthDeg: num("bandWidthDeg"),
    bandWidthKm: num("bandWidthKm"),
    collapse: typeof r.collapse === "boolean" ? r.collapse : undefined,
    condensationK: num("condensationK"),
    condensingGas: str("condensingGas"),
    pressureAtm: num("pressureAtm"),
    epsilon: num("epsilon"),
    atmRetention: str("atmRetention"),
    retentionGas: str("retentionGas"),
    exobaseK: num("exobaseK"),
    tidalLock: str("tidalLock"),
    lockTimescaleYr: num("lockTimescaleYr"),
    systemAgeGyr: num("systemAgeGyr"),
    starLifetimeGyr: num("starLifetimeGyr"),
  };
}
