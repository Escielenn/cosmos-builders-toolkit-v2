// ---------------------------------------------------------------------------
// Solaris consequence flags — predicates only, NOT wired to live UI yet.
//
// Brief S4 (11-SIMULATOR-CONSTELLATION.md §2) names two Solaris rules:
// N-body instability inside the habitable zone, and atmosphere stripping
// from an active M-dwarf hitting an unmagnetised planet. Neither has a live
// number to read today:
//
//   - A real Holman-Wiegert stability check (`stab`/`stabCls`) exists inside
//     sim.html's "Show Your Work" overlay generator (public/tools/solaris/
//     sim.html:2108-2117), but it is never posted through STELLARFORGE_SAVE
//     — `results` only carries {systemName, starCount, planetCount,
//     planetNames, hasSystem}. This rule is buildable once that value is
//     threaded into `results`; it is a small, additive change (expose an
//     already-computed number) rather than new physics.
//   - Flare activity and planetary magnetic fields have no model anywhere in
//     sim.html at all — not even internally. Building this rule for real
//     means inventing a flare/magnetosphere model from scratch, which is a
//     feature, not a flag. STAR_SPECTRAL_FLARE_ACTIVE below is left as a
//     documented placeholder for that future work.
//
// Shipping either as "live" today would mean citing a number the tool never
// actually computed — the thing this whole document set is most careful
// never to do (see continuity.ts's note on the moonCount field it left out
// for the same reason). These stay as pure, tested predicates against the
// shape Solaris SHOULD emit, so the day `results.stab` exists this is a
// one-line wiring change, not a rewrite.
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

export function evaluateSolarisFlareFlags(output: SolarisFlareOutput): SimFlag[] {
  const f = atmosphereStrippedByFlares(output);
  return f ? [f] : [];
}
