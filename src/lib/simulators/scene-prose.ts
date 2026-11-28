// ---------------------------------------------------------------------------
// Conditions brief (1.9, T6): what is physically true where a scene is set,
// derived from a simulator's own numbers, each line citing the values it
// rests on.
//
// This replaces "Describe This Scene", which wrote pasteable second-person
// prose ("You are standing in the terminator band...") that cited nothing
// and asserted people live at the terminator whatever its temperature. That
// crossed the line drawn in docs/stellarforge/11-SIMULATOR-CONSTELLATION.md
// §3: if it could be pasted into chapter 3 unchanged, it is ghostwriting.
//
// The rules from §3, enforced here and in the tests:
//   - Impersonal. Never a named character, a POV or an interior state.
//   - Conditions, not events: what is true of the place.
//   - No one-click insert: the panel offers no "insert" or "copy to scene".
//   - Labelled with CONDITIONS_BRIEF_LABEL.
//   - Grounded: every line carries the values it was computed from. A line
//     whose inputs are missing is not written.
//   - Deterministic: numbers come from the sim; nothing here computes
//     physics beyond unit conversion.
//
// Pure: no React, no network, no randomness.
// ---------------------------------------------------------------------------

export const CONDITIONS_BRIEF_LABEL = "// CONDITIONS BRIEF · DERIVED · NOT CANON, NOT PROSE";

export interface BriefCite {
  label: string;
  value: string;
}

export interface BriefLine {
  /** Stable id for keys and tests. */
  id: string;
  text: string;
  cites: BriefCite[];
}

type Results = Record<string, unknown>;

function num(r: Results, k: string): number | null {
  const v = r[k];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(r: Results, k: string): string | null {
  const v = r[k];
  return typeof v === "string" && v.trim() ? v : null;
}
const K = (t: number) => `${Math.round(t)} K (${Math.round(t - 273.15)} °C)`;
const fixed = (n: number, d: number) => n.toFixed(d);

function tidelockBrief(r: Results): BriefLine[] {
  const lines: BriefLine[] = [];
  const lock = str(r, "tidalLock");
  const lockYr = num(r, "lockTimescaleYr");
  const age = num(r, "systemAgeGyr");
  const lockCites: BriefCite[] = [{ label: "tidal lock", value: lock ?? "" }];
  if (lockYr !== null) lockCites.push({ label: "time to lock", value: `${Number(lockYr.toPrecision(2)).toExponential(1)} yr` });
  if (age !== null) lockCites.push({ label: "system age", value: `${fixed(age, 1)} Gyr` });

  if (lock === "Not locked") {
    lines.push({
      id: "not-locked",
      text: "This world is not tidally locked: its star still rises and sets. The day-side and night-side conditions below would apply only once it locks.",
      cites: lockCites,
    });
  } else if (lock) {
    lines.push({
      id: "fixed-star",
      text: "The star holds one position in the sky. From any spot on the surface it never rises, never sets and never moves.",
      cites: lockCites,
    });
  }

  const S = num(r, "insolation");
  const teff = num(r, "starTeff");
  if (S !== null && teff !== null) {
    const colour = teff < 5300 ? "redder than the Sun's 5772 K" : teff > 6200 ? "whiter than the Sun's 5772 K" : "close to the Sun's 5772 K";
    lines.push({
      id: "light",
      text: `Face-on starlight delivers ${fixed(S, 2)} times the energy of sunlight at Earth, from a ${Math.round(teff)} K star, ${colour}.`,
      cites: [
        { label: "insolation", value: `${fixed(S, 3)} S⊕` },
        { label: "star Teff", value: `${Math.round(teff)} K` },
      ],
    });
  }

  const P = num(r, "orbPeriod");
  if (P !== null && lock && lock !== "Not locked") {
    lines.push({
      id: "year",
      text: `One orbit takes ${fixed(P, 2)} Earth days. Locked, the world turns once per orbit, so its sidereal day lasts as long.`,
      cites: [{ label: "orbital period", value: `${fixed(P, 2)} d` }],
    });
  }

  const tSSP = num(r, "tSSP");
  const tAir = num(r, "tSubstellarAirless");
  if (tSSP !== null) {
    const cites: BriefCite[] = [{ label: "substellar surface", value: K(tSSP) }];
    let text = `Directly beneath the star the surface sits at ${K(tSSP)}.`;
    if (tAir !== null && Math.abs(tAir - tSSP) > 5) {
      text += ` Bare rock there, with no air to move heat, would reach ${K(tAir)}.`;
      cites.push({ label: "substellar, bare rock", value: K(tAir) });
    }
    lines.push({ id: "substellar", text, cites });
  }

  const tTerm = num(r, "tTerm");
  if (tTerm !== null) {
    lines.push({
      id: "terminator",
      text: `At the terminator, where the star sits on the horizon, the surface is ${K(tTerm)}.`,
      cites: [{ label: "terminator", value: K(tTerm) }],
    });
  }

  const tASP = num(r, "tASP");
  if (tASP !== null) {
    const cites: BriefCite[] = [{ label: "antistellar point", value: K(tASP) }];
    let text = `The far point of the night side, opposite the star, reaches ${K(tASP)}.`;
    const condK = num(r, "condensationK");
    const gas = str(r, "condensingGas");
    if (r.collapse === true && condK !== null) {
      text += ` That is below the ${gas ?? "air's"} frost point of ${Math.round(condK)} K: the atmosphere freezes out there as ice.`;
      cites.push({ label: `${gas ?? "air"} frost point`, value: `${Math.round(condK)} K` });
    }
    lines.push({ id: "night", text, cites });
  }

  const w = num(r, "bandWidthDeg");
  const km = num(r, "bandWidthKm");
  const inner = num(r, "bandInnerDeg");
  const outer = num(r, "bandOuterDeg");
  const pct = num(r, "habPct");
  if (w !== null) {
    if (w > 0 && km !== null && inner !== null && outer !== null) {
      lines.push({
        id: "band",
        text: `Water can stay liquid from ${Math.round(inner)}° to ${Math.round(outer)}° out from the point under the star: a band about ${Math.round(km).toLocaleString("en-US")} km across${pct !== null ? `, ${fixed(pct, 1)}% of the surface` : ""}.`,
        cites: [
          { label: "liquid-water band", value: `${Math.round(km)} km · ${fixed(w, 1)}°` },
          ...(pct !== null ? [{ label: "of the surface", value: `${fixed(pct, 1)}%` }] : []),
        ],
      });
    } else {
      lines.push({
        id: "band",
        text: "Nowhere on the surface can water stay liquid under these conditions.",
        cites: [{ label: "liquid-water band", value: "0 km" }],
      });
    }
  }

  const g = num(r, "surfGrav");
  if (g !== null) {
    lines.push({
      id: "gravity",
      text: `Surface gravity is ${fixed(g, 2)} g: a load of 70 kg weighs what ${Math.round(70 * g)} kg would on Earth.`,
      cites: [{ label: "surface gravity", value: `${fixed(g, 2)} g` }],
    });
  }

  const p = num(r, "pressureAtm");
  const H = num(r, "scaleHeightKm");
  if (p !== null) {
    if (p <= 0) {
      lines.push({
        id: "air",
        text: "There is no atmosphere. Sound does not carry through the air, and nothing filters the starlight.",
        cites: [{ label: "surface pressure", value: "0 atm" }],
      });
    } else if (H !== null) {
      lines.push({
        id: "air",
        text: `Surface pressure is ${fixed(p, 2)} atm, and it falls by about two thirds with every ${fixed(H, 1)} km of height.`,
        cites: [
          { label: "surface pressure", value: `${fixed(p, 2)} atm` },
          { label: "scale height", value: `${fixed(H, 1)} km` },
        ],
      });
    }
  }

  return lines.filter((l) => l.cites.every((c) => c.value !== ""));
}

/**
 * The conditions brief for one simulator's current `results` block.
 * Returns no lines for a simulator without a brief yet.
 */
export function buildConditionsBrief(simulatorType: string, results: unknown): BriefLine[] {
  if (!results || typeof results !== "object") return [];
  switch (simulatorType) {
    case "tidelock":
      return tidelockBrief(results as Results);
    default:
      return [];
  }
}
