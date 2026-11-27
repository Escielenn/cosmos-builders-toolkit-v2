// ---------------------------------------------------------------------------
// exosky-brief, the scene sky conditions brief (1.9, N7).
//
// 11-SIMULATOR-CONSTELLATION §3 draws the line: a briefing describes
// conditions, impersonally, every clause citing the number it came from; it
// never narrates, never names a character, and is never a one-click insert.
// It may be copied by hand. Labelled as such.
//
// Deterministic: the same sky gives the same brief. No model is involved;
// numbers come from the simulation and the sentences are templates.
// ---------------------------------------------------------------------------

export const BRIEF_LABEL = "// CONDITIONS BRIEF · DERIVED · NOT CANON, NOT PROSE";

export interface BriefLine {
  text: string;
  /** "key = value" strings the line is grounded in. */
  cites: string[];
}

export interface BriefInput {
  place: string;
  epochYears: number;
  latitude: number;
  host: { name: string; sizeDeg: number; mag: number; altDeg: number } | null;
  locked: boolean;
  solarDayHours: number;
  orbitDays: number;
  poleStar: { name: string; separationDeg: number } | null;
  nakedEye: number;
  catalogueComplete: boolean;
  brightestNight: { name: string; mag: number } | null;
  moons: Array<{ name: string; phase: number; sizeDeg: number }>;
  sol: { mag: number; visible: boolean } | null;
  extinctionAtHorizon: number;
  atmoName: string;
}

const SUN_DISC_DEG = 0.533; // the Sun's mean angular diameter from Earth

function fmt(n: number, d = 1): string {
  return Number.isFinite(n) ? n.toFixed(d) : "∞";
}

export function skyConditionsBrief(b: BriefInput): { label: string; lines: BriefLine[] } {
  const lines: BriefLine[] = [];
  if (b.host) {
    const ratio = b.host.sizeDeg / SUN_DISC_DEG;
    lines.push({
      text: `The sun is a disc ${fmt(b.host.sizeDeg, 2)}° across, ${ratio >= 1 ? `${fmt(ratio, 1)} times` : `${fmt(ratio, 2)} of`} the Sun's width from Earth, at magnitude ${fmt(b.host.mag, 1)}.`,
      cites: [`host.angular_diameter = ${fmt(b.host.sizeDeg, 3)}°`, `host.apparent_mag = ${fmt(b.host.mag, 2)}`],
    });
  }
  if (b.locked) {
    lines.push({
      text: b.host
        ? `The sun does not move across the sky. Here it stands ${fmt(b.host.altDeg, 0)}° ${b.host.altDeg >= 0 ? "above" : "below"} the horizon, always.`
        : "The sun does not move across the sky.",
      cites: ["orbit.tidally_locked = true", ...(b.host ? [`host.altitude = ${fmt(b.host.altDeg, 1)}°`] : [])],
    });
    lines.push({
      text: `The stars turn once every ${fmt(b.orbitDays, 1)} days, one orbit.`,
      cites: [`orbit.period = ${fmt(b.orbitDays, 2)} d`],
    });
  } else {
    lines.push({
      text: `A full day, sunrise to sunrise, lasts ${fmt(b.solarDayHours, 1)} hours.`,
      cites: [`solar_day = ${fmt(b.solarDayHours, 2)} h`],
    });
  }
  lines.push({
    text: b.poleStar
      ? `${b.poleStar.name} marks the ${b.latitude >= 0 ? "north" : "south"} pole, ${fmt(b.poleStar.separationDeg, 1)}° from it.`
      : "No bright star marks the pole. North is found from the turning of the sky, not a single point.",
    cites: [b.poleStar ? `planet.sky.pole_star = ${b.poleStar.name}` : "planet.sky.pole_star = None"],
  });
  lines.push({
    text: `On a dark, clear night about ${b.nakedEye.toLocaleString()} stars show to the naked eye${b.catalogueComplete ? "" : " (a lower bound: the catalogue thins this far from the Sun)"}.`,
    cites: [`planet.sky.naked_eye_count = ${b.nakedEye}`],
  });
  if (b.brightestNight) {
    lines.push({
      text: `The brightest point in the night sky is ${b.brightestNight.name}, magnitude ${fmt(b.brightestNight.mag, 1)}.`,
      cites: [`brightest.apparent_mag = ${fmt(b.brightestNight.mag, 2)}`],
    });
  }
  for (const m of b.moons) {
    lines.push({
      text: `${m.name} is ${Math.round(m.phase * 100)}% lit and ${fmt(m.sizeDeg, 2)}° across.`,
      cites: [`${m.name}.phase = ${fmt(m.phase, 2)}`, `${m.name}.angular_diameter = ${fmt(m.sizeDeg, 3)}°`],
    });
  }
  if (b.sol) {
    lines.push({
      text: b.sol.visible
        ? `The Sun is a magnitude ${fmt(b.sol.mag, 1)} star here, visible without aid.`
        : `The Sun is magnitude ${fmt(b.sol.mag, 1)} from here, too faint to see without a telescope.`,
      cites: [`sol.apparent_mag = ${fmt(b.sol.mag, 2)}`],
    });
  }
  if (b.extinctionAtHorizon > 0.05) {
    lines.push({
      text: `${b.atmoName}: at the horizon the air takes ${fmt(b.extinctionAtHorizon, 1)} magnitudes from starlight; overhead, ${fmt(b.extinctionAtHorizon / 38, 2)}.`,
      cites: [`extinction.horizon = ${fmt(b.extinctionAtHorizon, 2)} mag`, "airmass(0°) = 38 (Kasten & Young 1989)"],
    });
  }
  lines.push({
    text: `Sky as of ${b.epochYears === 0 ? "the present epoch (J2000)" : `${Math.abs(b.epochYears).toLocaleString()} years ${b.epochYears > 0 ? "after" : "before"} J2000`}, at ${fmt(Math.abs(b.latitude), 0)}° ${b.latitude >= 0 ? "north" : "south"} on ${b.place}.`,
    cites: [`epoch = ${b.epochYears} yr`, `latitude = ${b.latitude}°`],
  });
  return { label: BRIEF_LABEL, lines };
}

/** Plain text for copying by hand (no insert button exists by design). */
export function briefAsText(brief: { label: string; lines: BriefLine[] }): string {
  return [brief.label, ...brief.lines.map((l) => `- ${l.text}  [${l.cites.join("; ")}]`)].join("\n");
}
