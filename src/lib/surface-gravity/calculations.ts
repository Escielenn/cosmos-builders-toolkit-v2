// Surface Gravity Calculator, Pure calculation functions
// No React dependencies, importable from PDF templates

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

  // Atmospheric retention
  gasRetention: GasRetention[];

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

export function calcAtmosphericRetention(
  escapeVelocityKms: number,
  tempK: number
): GasRetention[] {
  const escapeMs = escapeVelocityKms * 1000;

  return GAS_DATA.map((gas) => {
    const thermalV = calcThermalVelocity(gas.molecularWeight, tempK);
    const param = escapeMs / thermalV;

    let status: "retained" | "marginal" | "escapes";
    let statusColor: string;

    if (param >= 6) {
      status = "retained";
      statusColor = "#2ECC71";
    } else if (param >= 4) {
      status = "marginal";
      statusColor = "#FFA500";
    } else {
      status = "escapes";
      statusColor = "#E74C3C";
    }

    return {
      id: gas.id,
      name: gas.name,
      formula: gas.formula,
      molecularWeight: gas.molecularWeight,
      thermalVelocity: thermalV,
      escapeParameter: param,
      status,
      color: gas.color,
      statusColor,
    };
  });
}

export function calcDeltaV(massEarth: number, radiusEarth: number): DeltaVResult {
  const vOrb = calcOrbitalVelocity(massEarth, radiusEarth);
  const deltaV = 1.5 * vOrb; // includes gravity + drag losses
  const earthDeltaV = 9.4; // km/s
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
      gasRetention: [], deltaV: {
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

  const gasRetention = calcAtmosphericRetention(escapeV, surfaceTemp);
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
