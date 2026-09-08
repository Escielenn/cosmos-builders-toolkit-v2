// ---------------------------------------------------------------------------
// Atmosphere (Brief G2 §2, 14-RENDER-ENGINE §2 Tier 1).
//
// "Fresnel shell, colour from composition (CO₂ amber, N₂/O₂ blue, methane
// orange-brown, none = hard limb). Thickness from pressure."
//
// And the terminator: "Sharp on airless bodies, soft on thick atmospheres. A
// tidally-locked world shows a FIXED terminator — the band where everything
// lives, visible as geography."
//
// This is the test G2 is graded on: change atmo_pressure from 0.6 to 1.4 in
// canon and the rim must visibly thicken. So thickness is a pure function of
// pressure, and it is tested as one.
// ---------------------------------------------------------------------------

import type { RGB } from "../engine/theme-uniforms";

/** Rim colours in linear RGB. Physical, not thematic — these are not tokens. */
const COMPOSITION_COLOURS: Array<{ match: RegExp; colour: RGB; label: string }> = [
  // Order matters: the first match wins, so the more specific patterns lead.
  {
    match: /\bch4\b|methane/i,
    colour: { r: 0.42, g: 0.16, b: 0.05 },
    label: "methane",
  },
  {
    match: /\bco2\b|carbon\s*dioxide/i,
    colour: { r: 0.55, g: 0.33, b: 0.08 },
    label: "carbon dioxide",
  },
  {
    match: /\bn2\b|nitrogen|\bo2\b|oxygen/i,
    colour: { r: 0.15, g: 0.35, b: 0.75 },
    label: "nitrogen–oxygen",
  },
  {
    match: /\bh2\b|hydrogen|helium|\bhe\b/i,
    colour: { r: 0.55, g: 0.52, b: 0.45 },
    label: "hydrogen–helium",
  },
  {
    match: /\bso2\b|sulphur|sulfur/i,
    colour: { r: 0.62, g: 0.55, b: 0.20 },
    label: "sulphur dioxide",
  },
];

export interface AtmosphereUniforms {
  /** No shell at all. An airless body gets a hard limb, not a faint glow. */
  present: boolean;
  colour: RGB;
  /** Shell height as a fraction of planet radius. */
  thickness: number;
  /** 0 = knife-edge terminator, 1 = wide soft twilight. */
  terminatorSoftness: number;
  /** For the readout beside the render, so the colour is explainable. */
  label: string;
}

const AIRLESS: AtmosphereUniforms = {
  present: false,
  colour: { r: 0, g: 0, b: 0 },
  thickness: 0,
  terminatorSoftness: 0,
  label: "none",
};

/**
 * Rim thickness from surface pressure, in bars.
 *
 * Logarithmic, because pressure spans orders of magnitude and a linear map
 * would make Venus (92 bar) a hundred times Earth's rim — absurd on screen —
 * while leaving Mars (0.006) and Earth (1) visually identical, which is the
 * distinction that actually matters to a writer.
 *
 * Anchored so Earth ≈ 0.025 of radius, which is about right against a real
 * limb photograph.
 */
export function rimThickness(pressureBar: number): number {
  if (!Number.isFinite(pressureBar) || pressureBar <= 0) return 0;
  const t = 0.025 * (1 + Math.log10(pressureBar) / 2.5);
  return Math.min(0.09, Math.max(0.004, t));
}

/** Thicker air scatters light further round the limb. */
export function terminatorSoftness(pressureBar: number): number {
  if (!Number.isFinite(pressureBar) || pressureBar <= 0) return 0;
  return Math.min(1, Math.max(0.05, 0.35 * (1 + Math.log10(pressureBar) / 2)));
}

export function atmosphereUniforms(
  composition: string | null | undefined,
  pressureBar: number | null | undefined,
): AtmosphereUniforms {
  // No pressure means no atmosphere to draw. An unmeasured world gets a hard
  // limb rather than an invented haze — the render must not imply a fact.
  if (typeof pressureBar !== "number" || !Number.isFinite(pressureBar) || pressureBar <= 0) {
    return AIRLESS;
  }

  const text = (composition ?? "").trim();
  const hit = text ? COMPOSITION_COLOURS.find((c) => c.match.test(text)) : undefined;

  return {
    present: true,
    // A stated pressure with an unrecognised composition still gets a shell:
    // the pressure is the fact, and a neutral haze is honest about the rest.
    colour: hit?.colour ?? { r: 0.35, g: 0.40, b: 0.50 },
    thickness: rimThickness(pressureBar),
    terminatorSoftness: terminatorSoftness(pressureBar),
    label: hit?.label ?? (text ? text : "unspecified"),
  };
}

export { AIRLESS as AIRLESS_ATMOSPHERE };
