// ---------------------------------------------------------------------------
// Solaris consequence flags.
//
// Brief S4 (11-SIMULATOR-CONSTELLATION.md §2) names two Solaris rules.
//
//   - N-body instability inside the habitable zone: LIVE as of 2026-09-02.
//     public/tools/solaris/sim.html now runs its Holman-Wiegert check through
//     one shared `planetStability(p)` — the same function that fills the
//     "Show Your Work" overlay — and posts `results.planets[]` with
//     `{name, au, band, stabCls, inHabitableZone}` on STELLARFORGE_SAVE.
//     `evaluateSolarisSystemFlags` maps that array through the rule, so the
//     number the writer sees in the overlay and the number the flag cites are
//     the same number.
//   - Flare activity and planetary magnetic fields still have no model
//     anywhere in sim.html — not even internally. Building that rule for real
//     means inventing a flare/magnetosphere model, which is a feature, not a
//     flag. `atmosphereStrippedByFlares` stays a tested predicate against the
//     shape Solaris SHOULD emit; it is not wired.
//
// A flag must never cite a number the tool never computed (see continuity.ts
// on the moonCount field it left out for the same reason).
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";

export interface SolarisStabilityOutput {
  /** Holman-Wiegert (or equivalent) stability classification. */
  stabCls: "stable" | "marginal" | "unstable";
  /** True when the unstable body's orbit crosses the system's habitable zone. */
  inHabitableZone: boolean;
  planetName: string;
}

export interface SolarisFlareOutput {
  /** True for a flare-active star, e.g. an active M-dwarf. */
  flareActive: boolean;
  /** True when the planet has no magnetosphere to deflect stellar wind. */
  hasMagnetosphere: boolean;
  planetName: string;
}

const unstableOrbitInHZ: SimFlagRule<SolarisStabilityOutput> = (o) => {
  if (o.stabCls !== "unstable" || !o.inHabitableZone) return null;
  return {
    id: "solaris.unstable-orbit-in-hz",
    sim: "solaris",
    severity: "tension",
    title: `${o.planetName.toUpperCase()}: ORBIT UNSTABLE`,
    body: "Unstable on 10⁵-year timescales, and it's inside the habitable zone. That's no time for biology — evolution needs a stable climate for longer than this orbit will hold one.",
    cites: { planet: o.planetName, stability: o.stabCls },
  };
};

const atmosphereStrippedByFlares: SimFlagRule<SolarisFlareOutput> = (o) => {
  if (!o.flareActive || o.hasMagnetosphere) return null;
  return {
    id: "solaris.atmosphere-stripped-by-flares",
    sim: "solaris",
    severity: "tension",
    title: `${o.planetName.toUpperCase()}: UNMAGNETISED, FLARE-ACTIVE STAR`,
    body: "Atmosphere stripped in roughly 200 million years. With no magnetic field to deflect it, stellar wind from an active star erodes the air faster than outgassing can replace it — surface life as written is unsupported.",
    cites: { planet: o.planetName },
  };
};

export const SOLARIS_RULES = {
  unstableOrbitInHZ,
  atmosphereStrippedByFlares,
};

export function evaluateSolarisStabilityFlags(output: SolarisStabilityOutput): SimFlag[] {
  const f = unstableOrbitInHZ(output);
  return f ? [f] : [];
}

/** Shape of one entry in `results.planets[]` as posted by sim.html. */
export interface SolarisPlanetResult {
  name: string;
  au: number;
  band: string;
  stabCls: "stable" | "marginal" | "unstable";
  inHabitableZone: boolean;
}

/** Evaluate the stability rule across every planet the simulator posted. */
export function evaluateSolarisSystemFlags(planets: readonly SolarisPlanetResult[] | undefined | null): SimFlag[] {
  if (!planets || !Array.isArray(planets)) return [];
  const out: SimFlag[] = [];
  for (const pl of planets) {
    if (!pl || typeof pl !== "object") continue;
    const f = unstableOrbitInHZ({
      planetName: String(pl.name ?? "Planet"),
      stabCls: pl.stabCls === "unstable" || pl.stabCls === "marginal" ? pl.stabCls : "stable",
      inHabitableZone: !!pl.inHabitableZone,
    });
    if (f) out.push(f);
  }
  return out;
}

export function evaluateSolarisFlareFlags(output: SolarisFlareOutput): SimFlag[] {
  const f = atmosphereStrippedByFlares(output);
  return f ? [f] : [];
}
