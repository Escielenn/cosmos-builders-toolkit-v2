// Surface Gravity Calculator, Pure calculation functions
// No React dependencies, importable from PDF templates

import { hueVar, type HueName } from "@/styles/hue";
import { meanThermalSpeedKms, retention } from "@/lib/physics";
import { GAS_DATA, DELTA_V_VERDICTS, COMPOSITION_PRESETS, getGravityRegimeInfo } from "./data";
import type { GravityRegime, DeltaVVerdict } from "./data";

// ─── Physical Constants ──────────────────────────────────────────────────────

export const G = 6.674e-11; // m³ kg⁻¹ s⁻²
export const EARTH_MASS = 5.972e24; // kg
export const EARTH_RADIUS = 6.371e6; // m
export const EARTH_G = 9.80665; // m/s²
export const EARTH_ESCAPE_V = 11186; // m/s
export const EARTH_DENSITY = 5.514; // g/cm³
export const BOLTZMANN = 1.381e-23; // J/K
export const PROTON_MASS = 1.661e-27; // kg (atomic mass unit)

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface FormStateForCalc {
  primary: {
    mass: number; // Earth masses
    radius: number; // Earth radii
    compositionPreset: string;
    planetPreset: string;
    linked: boolean; // mass-radius linked via composition
  };
  advanced: {
    surfaceTemp: number; // K
    molecularWeightPreset: string;
    molecularWeight: number; // g/mol
  };
}

export interface GasRetention {
  id: string;
  name: string;
  formula: string;
  molecularWeight: number;
  thermalVelocity: number; // m/s
  escapeParameter: number; // v_esc / v_thermal
  status: "retained" | "marginal" | "escapes";
  color: string;
  /** What the status means, as a named hue (src/styles/hue.ts). */
  statusHue: HueName;
  /** `statusHue` as a live CSS value, for fills and icons. */
  statusColor: string;
}

export interface WeightComparison {
  earthWeight: number; // N
  planetWeight: number; // N
  earthWeightKg: number;
  planetWeightKg: number; // "apparent weight" in kg
}

export interface DeltaVResult {
  orbitalVelocity: number; // km/s
  deltaVToOrbit: number; // km/s
  earthComparison: number; // ratio to Earth's ~9.4 km/s
  massRatio: number; // Tsiolkovsky mass ratio for chemical rockets
  verdict: DeltaVVerdict;
  gravityLocked: boolean;
}

export interface SurfaceGravityResult {
  // Core gravitational data
  gravity: number; // g (Earth = 1.0)
  gravityMs2: number; // m/s²
  escapeVelocity: number; // km/s
  orbitalVelocity: number; // km/s
  meanDensity: number; // g/cm³
  densityRatio: number; // vs Earth's 5.51

  // Regime
  gravityRegime: GravityRegime;
  regimeLabel: string;
  regimeColor: string;

  // Weight comparisons
  humanWeight: WeightComparison;
  dropTime: number; // seconds for 2m fall
  dropSpeed: number; // km/h at impact from 2m fall
  jumpHeight: number; // meters (scaled from 2m Earth high jump)
  terminalVelocity: number; // km/h (rough estimate)

  // Atmospheric retention (tested at the exobase temperature, F-06)
  gasRetention: GasRetention[];
  exobaseTemp: number;

  // Delta-v
  deltaV: DeltaVResult;

  // Input echo
  massKg: number;
  radiusKm: number;

  valid: boolean;
  error?: string;
}

// ─── Core Calculations ───────────────────────────────────────────────────────

export function calcSurfaceGravity(massEarth: number, radiusEarth: number): { gRatio: number; gMs2: number } {
  const gRatio = massEarth / (radiusEarth * radiusEarth);
  const gMs2 = gRatio * EARTH_G;
  return { gRatio, gMs2 };
}

export function calcEscapeVelocity(massEarth: number, radiusEarth: number): number {
  // v_esc = v_esc_earth * sqrt(M/R)
  return (EARTH_ESCAPE_V / 1000) * Math.sqrt(massEarth / radiusEarth);
}

export function calcOrbitalVelocity(massEarth: number, radiusEarth: number): number {
  // v_orb = sqrt(G*M/R)
  const M = massEarth * EARTH_MASS;
  const R = radiusEarth * EARTH_RADIUS;
  return Math.sqrt(G * M / R) / 1000; // km/s
}

export function calcMeanDensity(massEarth: number, radiusEarth: number): number {
  // ρ = 3M / (4πR³) in g/cm³
  const M = massEarth * EARTH_MASS;
  const R = radiusEarth * EARTH_RADIUS;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(R, 3);
  const densityKgM3 = M / volumeM3;
  return densityKgM3 / 1000; // convert to g/cm³
}

export function calcWeightComparison(gRatio: number, massKg: number = 70): WeightComparison {
  const earthWeight = massKg * EARTH_G;
  const planetWeight = massKg * gRatio * EARTH_G;
  return {
    earthWeight,
    planetWeight,
    earthWeightKg: massKg,
    planetWeightKg: massKg * gRatio,
  };
}

export function calcDropTime(gMs2: number, heightM: number = 2): { time: number; speed: number } {
  // t = sqrt(2h/g), v = sqrt(2gh)
  if (gMs2 <= 0) return { time: Infinity, speed: 0 };
  const time = Math.sqrt((2 * heightM) / gMs2);
  const speedMs = Math.sqrt(2 * gMs2 * heightM);
  const speedKmh = speedMs * 3.6;
  return { time, speed: speedKmh };
}

export function calcJumpHeight(gRatio: number, earthJumpM: number = 2): number {
  // Jump height scales inversely with gravity
  if (gRatio <= 0) return Infinity;
  return earthJumpM / gRatio;
}

export function calcTerminalVelocity(gRatio: number): number {
  // Rough estimate: terminal velocity scales as sqrt(g) relative to Earth
  // Earth terminal velocity for human ~200 km/h
  return 200 * Math.sqrt(gRatio);
}

export function calcThermalVelocity(molecularWeightGmol: number, tempK: number): number {
  // v_thermal = sqrt(3 * k_B * T / m)
  const massKg = molecularWeightGmol * PROTON_MASS;
  return Math.sqrt((3 * BOLTZMANN * tempK) / massKg);
}

/**
 * Exobase (escape-level) temperature estimated from the surface temperature.
 *
 * 1.9 F-06: retention was tested at the SURFACE temperature, so Earth (288 K)
 * kept helium, which it does not. Gas escapes from the exobase, where EUV
 * heating makes the thermosphere far hotter: ~1000 K on Earth (Catling &
 * Kasting 2017, Atmospheric Evolution on Inhabited and Lifeless Worlds, ch. 5;
 * range 700 to 1400 K with the solar cycle). Scaling by Earth's ratio
 * (1000 / 288 ≈ 3.5) is a first-order estimate, labelled as one in the UI.
 */
export const EXOBASE_TO_SURFACE = 3.5;
export function exobaseTemperature(surfaceTempK: number): number {
  return Math.max(surfaceTempK, Math.min(2500, surfaceTempK * EXOBASE_TO_SURFACE));
}

/** Shown under the retention chart: what a thermal model cannot see. */
export const NON_THERMAL_CAVEAT =
  "Thermal (Jeans) escape only. Small worlds without a magnetic field also lose gas to the solar wind and to sunlight splitting water: Mars lost most of its water that way.";

/**
 * Which gases stay over geological time, from the shared physics module
 * (src/lib/physics retention(): mean thermal speed at most 1/6 of escape
 * velocity is retained, up to 1/5 marginal, above that lost; Seager 2010).
 * λ = v_esc / v̄, so the chart's λ = 6 line is the same rule. Tested at the
 * EXOBASE temperature (F-06). Earth keeps N₂, O₂ and water and loses
 * hydrogen and helium.
 */
export function calcAtmosphericRetention(
  escapeVelocityKms: number,
  tempK: number
): GasRetention[] {
  return GAS_DATA.map((gas) => {
    const r = retention(escapeVelocityKms, tempK, gas.molecularWeight);
    const thermalV = meanThermalSpeedKms(tempK, gas.molecularWeight) * 1000;
    const status: "retained" | "marginal" | "escapes" = r.verdict === "lost" ? "escapes" : r.verdict;
    const statusHue: HueName = status === "retained" ? "emerald" : status === "marginal" ? "amber" : "crimson";
    return {
      id: gas.id,
      name: gas.name,
      formula: gas.formula,
      molecularWeight: gas.molecularWeight,
      thermalVelocity: thermalV,
      escapeParameter: 1 / r.ratio,
      status,
      color: gas.color,
      statusHue,
      statusColor: hueVar(statusHue),
    };
  });
}

/**
 * Delta-v to reach low orbit, first-order approximation:
 *   Δv ≈ k · v_orb(surface),  v_orb = √(GM/R)
 * where k folds gravity losses and atmospheric drag losses into one
 * multiplier on the ideal circular-orbit speed. k is calibrated so Earth
 * reproduces the usual ~9.4 km/s budget to LEO (7.9 km/s orbital speed plus
 * ~1.5 km/s of gravity and drag losses; see e.g. Sutton & Biblarz, "Rocket
 * Propulsion Elements", 9th ed., §4.4, and NASA's 9.3–10 km/s LEO figure),
 * giving k ≈ 1.19. The Earth reference is computed with the SAME formula, so
 * Earth compares as exactly 1.00×. It ignores how losses scale with a
 * different atmosphere or surface gravity, so treat other worlds as an
 * order-of-magnitude guide.
 */
export const EARTH_DELTA_V_TO_ORBIT_KMS = 9.4;
export const DELTA_V_LOSS_FACTOR = EARTH_DELTA_V_TO_ORBIT_KMS / calcOrbitalVelocity(1, 1);

export function calcDeltaV(massEarth: number, radiusEarth: number): DeltaVResult {
  const vOrb = calcOrbitalVelocity(massEarth, radiusEarth);
  const deltaV = DELTA_V_LOSS_FACTOR * vOrb; // includes gravity + drag losses
  const earthDeltaV = DELTA_V_LOSS_FACTOR * calcOrbitalVelocity(1, 1); // = 9.4 km/s
  const exhaustV = 4.4; // km/s (LOX/LH2 best case)
  const massRatio = Math.exp(deltaV / exhaustV);

  const verdict = DELTA_V_VERDICTS.find((v) => deltaV <= v.maxDeltaV) ?? DELTA_V_VERDICTS[DELTA_V_VERDICTS.length - 1];

  return {
    orbitalVelocity: vOrb,
    deltaVToOrbit: deltaV,
    earthComparison: deltaV / earthDeltaV,
    massRatio,
    verdict,
    gravityLocked: deltaV > 20,
  };
}

// ─── Composition Preset Application ──────────────────────────────────────────

export function applyCompositionPreset(
  presetId: string,
  currentMass: number,
  currentRadius: number,
  changedField: "mass" | "radius"
): { mass: number; radius: number } {
  if (presetId === "custom") {
    return { mass: currentMass, radius: currentRadius };
  }

  const preset = COMPOSITION_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { mass: currentMass, radius: currentRadius };

  if (changedField === "mass") {
    return { mass: currentMass, radius: preset.massToRadius(currentMass) };
  } else {
    return { mass: preset.radiusToMass(currentRadius), radius: currentRadius };
  }
}

// ─── Main Calculation Entry Point ────────────────────────────────────────────

export function calculateSurfaceGravity(formState: FormStateForCalc): SurfaceGravityResult {
  const { mass, radius } = formState.primary;
  const { surfaceTemp } = formState.advanced;

  // Validate inputs
  if (mass <= 0 || radius <= 0) {
    return {
      gravity: 0, gravityMs2: 0, escapeVelocity: 0, orbitalVelocity: 0,
      meanDensity: 0, densityRatio: 0,
      gravityRegime: "earthlike", regimeLabel: "Invalid", regimeColor: "text-muted-foreground",
      humanWeight: { earthWeight: 0, planetWeight: 0, earthWeightKg: 70, planetWeightKg: 0 },
      dropTime: 0, dropSpeed: 0, jumpHeight: 0, terminalVelocity: 0,
      gasRetention: [], exobaseTemp: 0, deltaV: {
        orbitalVelocity: 0, deltaVToOrbit: 0, earthComparison: 0,
        massRatio: 0, verdict: DELTA_V_VERDICTS[0], gravityLocked: false,
      },
      massKg: 0, radiusKm: 0,
      valid: false, error: "Mass and radius must be positive",
    };
  }

  const { gRatio, gMs2 } = calcSurfaceGravity(mass, radius);
  const escapeV = calcEscapeVelocity(mass, radius);
  const orbitalV = calcOrbitalVelocity(mass, radius);
  const density = calcMeanDensity(mass, radius);
  const regimeInfo = getGravityRegimeInfo(gRatio);

  const humanWeight = calcWeightComparison(gRatio, 70);
  const drop = calcDropTime(gMs2, 2);
  const jumpH = calcJumpHeight(gRatio, 2);
  const termV = calcTerminalVelocity(gRatio);

  const exobaseTemp = exobaseTemperature(surfaceTemp);
  const gasRetention = calcAtmosphericRetention(escapeV, exobaseTemp);
  const deltaV = calcDeltaV(mass, radius);

  return {
    gravity: gRatio,
    gravityMs2: gMs2,
    escapeVelocity: escapeV,
    orbitalVelocity: orbitalV,
    meanDensity: density,
    densityRatio: density / EARTH_DENSITY,

    gravityRegime: regimeInfo.regime,
    regimeLabel: regimeInfo.label,
    regimeColor: regimeInfo.color,

    humanWeight,
    dropTime: drop.time,
    dropSpeed: drop.speed,
    jumpHeight: jumpH,
    terminalVelocity: termV,

    gasRetention,
    exobaseTemp,
    deltaV,

    massKg: mass * EARTH_MASS,
    radiusKm: radius * EARTH_RADIUS / 1000,

    valid: true,
  };
}

// ─── Copy Text Builder ───────────────────────────────────────────────────────

export function buildCopyText(result: SurfaceGravityResult, formState: FormStateForCalc): string {
  if (!result.valid) return "Invalid parameters.";

  const lines: string[] = [
    "SURFACE GRAVITY CALCULATOR, StellarForge.tools",
    "═".repeat(50),
    "",
    "PLANET PARAMETERS",
    `  Mass: ${formState.primary.mass.toFixed(3)} M⊕ (${result.massKg.toExponential(3)} kg)`,
    `  Radius: ${formState.primary.radius.toFixed(3)} R⊕ (${result.radiusKm.toFixed(0)} km)`,
    `  Composition: ${formState.primary.compositionPreset}`,
    `  Surface Temperature: ${formState.advanced.surfaceTemp} K`,
    "",
    "CORE RESULTS",
    `  Surface Gravity: ${result.gravity.toFixed(3)}g (${result.gravityMs2.toFixed(2)} m/s²)`,
    `  Regime: ${result.regimeLabel}`,
    `  Escape Velocity: ${result.escapeVelocity.toFixed(2)} km/s`,
    `  Orbital Velocity: ${result.orbitalVelocity.toFixed(2)} km/s`,
    `  Mean Density: ${result.meanDensity.toFixed(2)} g/cm³ (${result.densityRatio.toFixed(2)}× Earth)`,
    "",
    "WEIGHT COMPARISONS",
    `  70 kg human weighs: ${result.humanWeight.planetWeightKg.toFixed(1)} kg`,
    `  Drop from 2m: ${result.dropTime.toFixed(2)}s, impact at ${result.dropSpeed.toFixed(1)} km/h`,
    `  High jump (2m on Earth): ${result.jumpHeight.toFixed(2)}m here`,
    `  Terminal velocity: ~${result.terminalVelocity.toFixed(0)} km/h`,
    "",
    "ATMOSPHERIC RETENTION",
    ...result.gasRetention.map(
      (g) => `  ${g.formula.padEnd(6)} ${g.status.padEnd(10)} (escape param: ${g.escapeParameter.toFixed(1)})`
    ),
    "",
    "DELTA-V TO ORBIT",
    `  Δv to low orbit: ${result.deltaV.deltaVToOrbit.toFixed(2)} km/s (${result.deltaV.earthComparison.toFixed(2)}× Earth)`,
    `  Chemical rocket mass ratio: ${result.deltaV.massRatio.toFixed(1)}:1`,
    `  Verdict: ${result.deltaV.verdict.label}`,
    `  ${result.deltaV.verdict.description}`,
    "",
    "─".repeat(50),
    "Generated by StellarForge.tools, Surface Gravity Calculator",
    "© 2025–2026 Jason D. Batt, Ph.D.",
  ];

  return lines.join("\n");
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

export function formatGravity(g: number): string {
  if (g < 0.01) return g.toExponential(2) + "g";
  if (g < 10) return g.toFixed(3) + "g";
  return g.toFixed(1) + "g";
}

export function formatVelocity(kms: number): string {
  if (kms < 0.1) return (kms * 1000).toFixed(0) + " m/s";
  return kms.toFixed(2) + " km/s";
}

export function formatMass(earthMasses: number): string {
  if (earthMasses < 0.1) return (earthMasses * EARTH_MASS).toExponential(2) + " kg";
  return earthMasses.toFixed(3) + " M⊕";
}

export function formatRadius(earthRadii: number): string {
  return earthRadii.toFixed(3) + " R⊕";
}

export function formatDensity(gcm3: number): string {
  return gcm3.toFixed(2) + " g/cm³";
}
