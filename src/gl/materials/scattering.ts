// ---------------------------------------------------------------------------
// Atmospheric scattering, cheaply and honestly (14-RENDER-ENGINE §2 Tier 1).
//
// The G2 atmosphere picked a rim colour from a lookup ("CO₂ amber, N₂/O₂
// blue"). That is a picture of the answer. This computes it: two colours per
// world, both from the gas mix, the pressure and the gravity in canon.
//
//   scatter   the colour of the lit limb and the day sky: light scattered
//             once out of the beam, ∝ 1 − e^(−τ_λ).
//   sunset    the colour of light that has crossed the terminator at grazing
//             incidence, ∝ e^(−m·τ_λ). Earth's comes out orange, a thin
//             atmosphere's stays the star's own colour, and a Venus-thick one
//             goes to nothing (the haze takes over instead).
//
// Three wavelengths stand in for the three display channels (R 680 nm,
// G 550 nm, B 440 nm). That is the "two-colour approximation": no
// raymarch, no lookup tables, two uniforms a shader can afford on a phone.
//
// SOURCES
//   Rayleigh optical depth of Earth's air at sea level,
//     τ⊕(λ) = 0.0088 · λ^(−4.15 + 0.2λ), λ in µm.
//     Fröhlich & Shaw 1980, Appl. Opt. 19:1773; the fit reproduces Bucholtz
//     1995 (Appl. Opt. 34:2765) to a few percent across the visible:
//     τ(550 nm) = 0.098.
//   Scaling to another world: τ ∝ column number density × cross-section,
//     column N = P / (g · μ · m_u), so τ = τ⊕ · (P/P⊕)(g⊕/g)(μ_air/μ)(σ/σ_air).
//   Relative Rayleigh cross-sections at 550 nm, from refractivity
//     (σ ∝ (n−1)²): Sneep & Ubachs 2005, JQSRT 92:293 (N₂, O₂, CO₂, CH₄,
//     Ar); H₂ and He from Shardanand & Prasad Rao 1977, NASA TN D-8442;
//     H₂O, SO₂ and NH₃ from their refractivities in the CRC Handbook.
//   Absorbers that colour real skies:
//     CH₄ absorbs red/near-IR (619, 727, 890 nm bands): why Uranus and
//       Neptune are cyan. Karkoschka 1994, Icarus 111:174.
//     Sulphuric-acid haze and its unknown UV/blue absorber: why Venus is
//       pale yellow. Pérez-Hoyos et al. 2018, JGR Planets 123:145.
//
// Pure: no three.js, so the physics is tested without a GPU.
// ---------------------------------------------------------------------------

import type { RGB } from "../engine/theme-uniforms";

/** Display channels → wavelengths in micrometres. */
export const CHANNEL_WAVELENGTH_UM = { r: 0.68, g: 0.55, b: 0.44 } as const;

/** Earth's sea-level Rayleigh optical depth at λ (µm). Fröhlich & Shaw 1980. */
export function earthRayleighTau(lambdaUm: number): number {
  return 0.0088 * lambdaUm ** (-4.15 + 0.2 * lambdaUm);
}

const EARTH_G = 9.80665;
const AIR_MU = 28.97;

interface GasProps {
  /** g/mol. */
  mu: number;
  /** Rayleigh cross-section relative to dry air at 550 nm. */
  sigma: number;
  /**
   * Extra extinction per bar of this gas, per channel, beyond Rayleigh.
   * Only the absorbers that visibly tint a planet carry one.
   */
  absorb?: RGB;
}

/** Cross-sections: see the header for sources. */
const GASES: Record<string, GasProps> = {
  N2: { mu: 28.01, sigma: 1.06 },
  O2: { mu: 32.0, sigma: 0.86 },
  Ar: { mu: 39.95, sigma: 0.93 },
  CO2: { mu: 44.01, sigma: 2.45 },
  // Methane: strong red absorption, so even a few percent turns the limb
  // and the body cyan-blue (Karkoschka 1994).
  CH4: { mu: 16.04, sigma: 2.25, absorb: { r: 0.9, g: 0.12, b: 0 } },
  H2: { mu: 2.016, sigma: 0.22 },
  He: { mu: 4.003, sigma: 0.015 },
  H2O: { mu: 18.02, sigma: 0.76 },
  // SO₂ stands for the sulphur cycle, and with it the H₂SO₄ haze whose
  // absorber eats blue (Pérez-Hoyos et al. 2018).
  SO2: { mu: 64.07, sigma: 4.5, absorb: { r: 0, g: 0.08, b: 0.6 } },
  NH3: { mu: 17.03, sigma: 1.9 },
};

const ALIASES: Array<[RegExp, keyof typeof GASES]> = [
  [/\bn2\b|nitrogen/i, "N2"],
  [/\bo2\b|oxygen/i, "O2"],
  [/\bar\b|argon/i, "Ar"],
  [/\bco2\b|carbon\s*dioxide/i, "CO2"],
  [/\bch4\b|methane/i, "CH4"],
  [/\bh2\b|hydrogen/i, "H2"],
  [/\bhe\b|helium/i, "He"],
  [/\bh2o\b|water|steam/i, "H2O"],
  [/\bso2\b|sulph|sulfur/i, "SO2"],
  [/\bnh3\b|ammonia/i, "NH3"],
];

export interface GasMix {
  /** Mole fractions, summing to 1. Empty when nothing was recognised. */
  fractions: Partial<Record<keyof typeof GASES, number>>;
  /** True when the text named at least one gas we know. */
  recognised: boolean;
}

/**
 * Parse an atmospheric composition as writers type it: "N2 78%, O2 21%",
 * "CO2", "N₂/CO₂", "mostly nitrogen with methane". Percentages are used when
 * given; otherwise the named gases share equally, which is the honest reading
 * of a list with no numbers.
 */
export function parseGasMix(text: string | null | undefined): GasMix {
  const raw = (text ?? "").replace(/₂/g, "2").replace(/₃/g, "3").replace(/₄/g, "4");
  if (!raw.trim()) return { fractions: {}, recognised: false };
  const parts = raw.split(/[,;/+&]|\band\b|\bwith\b/i);
  const weights: Partial<Record<keyof typeof GASES, number>> = {};
  let anyPercent = false;
  for (const part of parts) {
    const hit = ALIASES.find(([re]) => re.test(part));
    if (!hit) continue;
    const pct = part.match(/(\d+(?:\.\d+)?)\s*%/);
    const w = pct ? Number.parseFloat(pct[1]) : NaN;
    if (Number.isFinite(w)) anyPercent = true;
    weights[hit[1]] = (weights[hit[1]] ?? 0) + (Number.isFinite(w) ? w : NaN);
  }
  const keys = Object.keys(weights) as Array<keyof typeof GASES>;
  if (keys.length === 0) return { fractions: {}, recognised: false };
  // Named without a number: when others carry percentages, it gets the
  // remainder shared out; when none do, everyone shares equally.
  const stated = keys.filter((k) => Number.isFinite(weights[k]!));
  const unstated = keys.filter((k) => !Number.isFinite(weights[k]!));
  const statedSum = stated.reduce((s, k) => s + weights[k]!, 0);
  const remainder = anyPercent ? Math.max(0, 100 - statedSum) : 100;
  for (const k of unstated) weights[k] = remainder / Math.max(1, unstated.length) || 1;
  const total = keys.reduce((s, k) => s + weights[k]!, 0);
  const fractions: GasMix["fractions"] = {};
  for (const k of keys) fractions[k] = weights[k]! / total;
  return { fractions, recognised: true };
}

export interface ScatteringInput {
  composition: string | null | undefined;
  pressureBar: number | null | undefined;
  /** Surface gravity, m/s². Lower gravity = taller column = more scattering. */
  gravityMs2: number;
  /** The star's black-body colour, linear RGB (kelvinToRGB). */
  starColour: RGB;
}

export interface Scattering {
  present: boolean;
  /** Optical depth per channel, Rayleigh + absorbers. */
  tau: RGB;
  /** Hue of the lit limb, max channel = 1. */
  scatter: RGB;
  /** Hue of grazing light at the terminator, max channel = 1. */
  sunset: RGB;
  /** How much of the grazing light survives, 0..1. */
  sunsetStrength: number;
  /** 0..1: how visible the limb glow is. 1 − e^(−3τ₅₅₀). */
  density: number;
  /** τ at 550 nm, for the readout. */
  tau550: number;
}

/** Airmass of a grazing ray at the terminator. Thin-shell geometry caps it near 38 for Earth; 10 keeps the band wide enough to see. */
export const TERMINATOR_AIRMASS = 10;

const NONE: Scattering = {
  present: false,
  tau: { r: 0, g: 0, b: 0 },
  scatter: { r: 0, g: 0, b: 0 },
  sunset: { r: 0, g: 0, b: 0 },
  sunsetStrength: 0,
  density: 0,
  tau550: 0,
};

const normalise = (c: RGB): RGB => {
  const m = Math.max(c.r, c.g, c.b, 1e-9);
  return { r: c.r / m, g: c.g / m, b: c.b / m };
};

export function scattering(input: ScatteringInput): Scattering {
  const p = input.pressureBar;
  if (typeof p !== "number" || !Number.isFinite(p) || p <= 0) return NONE;
  const mix = parseGasMix(input.composition);
  // A stated pressure with no recognisable gas: treat as air. The pressure is
  // the fact; air is the least surprising guess for the rest, and the note
  // in bind/ says so.
  const fractions = mix.recognised ? mix.fractions : { N2: 0.79, O2: 0.21 };
  let mu = 0;
  let sigma = 0;
  const absorb: RGB = { r: 0, g: 0, b: 0 };
  for (const [k, f] of Object.entries(fractions) as Array<[keyof typeof GASES, number]>) {
    const gas = GASES[k];
    mu += gas.mu * f;
    sigma += gas.sigma * f;
    if (gas.absorb) {
      absorb.r += gas.absorb.r * f * p;
      absorb.g += gas.absorb.g * f * p;
      absorb.b += gas.absorb.b * f * p;
    }
  }
  const g = Math.max(input.gravityMs2, 0.05);
  const column = p * (EARTH_G / g) * (AIR_MU / Math.max(mu, 1));
  const rayleigh = (lambda: number) => earthRayleighTau(lambda) * column * sigma;
  const tau: RGB = {
    r: rayleigh(CHANNEL_WAVELENGTH_UM.r) + absorb.r,
    g: rayleigh(CHANNEL_WAVELENGTH_UM.g) + absorb.g,
    b: rayleigh(CHANNEL_WAVELENGTH_UM.b) + absorb.b,
  };
  const s = input.starColour;
  // Single scattering out of the beam. Absorption removes light without
  // scattering it, so only the Rayleigh share is re-emitted toward the eye.
  const scatterShare = (ch: "r" | "g" | "b") => {
    const t = tau[ch];
    if (t <= 0) return 0;
    const r = rayleigh(CHANNEL_WAVELENGTH_UM[ch]);
    return (1 - Math.exp(-t)) * (r / t);
  };
  const scatter = normalise({ r: s.r * scatterShare("r"), g: s.g * scatterShare("g"), b: s.b * scatterShare("b") });
  const through = {
    r: s.r * Math.exp(-TERMINATOR_AIRMASS * tau.r),
    g: s.g * Math.exp(-TERMINATOR_AIRMASS * tau.g),
    b: s.b * Math.exp(-TERMINATOR_AIRMASS * tau.b),
  };
  const sunsetStrength = Math.max(through.r, through.g, through.b) / Math.max(s.r, s.g, s.b, 1e-9);
  const tau550 = tau.g;
  return {
    present: true,
    tau,
    scatter,
    sunset: sunsetStrength > 1e-6 ? normalise(through) : normalise(s),
    sunsetStrength,
    density: 1 - Math.exp(-3 * tau550),
    tau550,
  };
}
