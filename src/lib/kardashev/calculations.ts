// ─── K-Scale: Kardashev Scale Calculations ───────────────────────────
// Pure functions, no React dependencies.

import {
  KARDASHEV_BANDS,
  type KardashevLevel,
  type KardashevBand,
  type GrowthRateKey,
  GROWTH_RATES,
} from "./data";

// ─── Constants ────────────────────────────────────────────────────────

/** Sun's luminosity in watts */
export const SOLAR_LUMINOSITY = 3.828e26;

/** Milky Way luminosity in watts (approx) */
export const GALAXY_LUMINOSITY = 5e36;

/** Earth's current power consumption in watts (2025) */
export const EARTH_POWER = 1.8e13;

// ─── Types ────────────────────────────────────────────────────────────

export interface KardashevResult {
  /** Total power in watts */
  totalPowerWatts: number;

  /** Log10 of total power */
  log10Power: number;

  /** Kardashev number (continuous scale) */
  kardashevNumber: number;

  /** Discrete level classification */
  level: KardashevLevel;

  /** Band metadata */
  band: KardashevBand;

  /** Ratio to Earth's current power */
  earthMultiple: number;

  /** Ratio to Sun's luminosity */
  solarMultiple: number;

  /** Ratio to Milky Way's luminosity */
  galaxyMultiple: number;

  /** Years to reach next full integer level at given growth rate */
  yearsToNextLevel: number | null;

  /** Growth projections (years to reach each level) */
  projections: LevelProjection[];

  /** Valid result */
  valid: boolean;

  /** Error message */
  error?: string;
}

export interface LevelProjection {
  level: KardashevLevel;
  label: string;
  yearsToReach: number | null;
  powerRequired: number; // watts
}

export interface BudgetAllocation {
  categoryId: string;
  percent: number;
  powerWatts: number;
  log10Power: number;
}

// ─── Core Calculations ───────────────────────────────────────────────

/**
 * Calculate the continuous Kardashev number from power in watts.
 * Uses the Sagan interpolation: K = (log10(P) - 6) / 10
 * Where P is power in watts.
 */
export function calcKardashevNumber(powerWatts: number): number {
  if (powerWatts <= 0) return 0;
  const log10P = Math.log10(powerWatts);
  return (log10P - 6) / 10;
}

/**
 * Calculate power in watts from a Kardashev number.
 * Inverse of calcKardashevNumber.
 */
export function kardashevToPower(k: number): number {
  return Math.pow(10, k * 10 + 6);
}

/**
 * Classify power level into a discrete Kardashev band.
 */
export function classifyLevel(log10Power: number): KardashevBand {
  for (let i = KARDASHEV_BANDS.length - 1; i >= 0; i--) {
    if (log10Power >= KARDASHEV_BANDS[i].minPower) {
      return KARDASHEV_BANDS[i];
    }
  }
  return KARDASHEV_BANDS[0];
}

/**
 * Calculate years to reach a target power level at a given annual growth rate.
 */
export function yearsToReach(
  currentPower: number,
  targetPower: number,
  annualGrowthRate: number
): number | null {
  if (currentPower <= 0 || targetPower <= 0 || annualGrowthRate <= 0) return null;
  if (currentPower >= targetPower) return 0;
  // P(t) = P0 * (1 + r)^t  →  t = ln(Pt/P0) / ln(1 + r)
  return Math.log(targetPower / currentPower) / Math.log(1 + annualGrowthRate);
}

/**
 * Generate projections for how long until reaching each integer level.
 */
export function calcProjections(
  currentPower: number,
  growthRate: number
): LevelProjection[] {
  const targets: { level: KardashevLevel; label: string; k: number }[] = [
    { level: "I", label: "Type I", k: 1.0 },
    { level: "II", label: "Type II", k: 2.0 },
    { level: "III", label: "Type III", k: 3.0 },
  ];

  return targets.map(({ level, label, k }) => {
    const powerRequired = kardashevToPower(k);
    const years = yearsToReach(currentPower, powerRequired, growthRate);
    return { level, label, yearsToReach: years, powerRequired };
  });
}

/**
 * Calculate budget allocations from percentages and total power.
 */
export function calcBudgetAllocations(
  totalPowerWatts: number,
  percentages: Record<string, number>
): BudgetAllocation[] {
  return Object.entries(percentages).map(([categoryId, percent]) => {
    const powerWatts = totalPowerWatts * (percent / 100);
    return {
      categoryId,
      percent,
      powerWatts,
      log10Power: powerWatts > 0 ? Math.log10(powerWatts) : 0,
    };
  });
}

// ─── Main Calculation ─────────────────────────────────────────────────

export interface KardashevFormState {
  totalPowerWatts: number;
  growthRate: GrowthRateKey;
  budgetPercentages: Record<string, number>;
}

export function calculateKardashev(form: KardashevFormState): KardashevResult {
  const { totalPowerWatts, growthRate } = form;

  if (totalPowerWatts <= 0) {
    return {
      totalPowerWatts: 0,
      log10Power: 0,
      kardashevNumber: 0,
      level: "sub-I",
      band: KARDASHEV_BANDS[0],
      earthMultiple: 0,
      solarMultiple: 0,
      galaxyMultiple: 0,
      yearsToNextLevel: null,
      projections: [],
      valid: false,
      error: "Total power must be greater than zero.",
    };
  }

  const log10Power = Math.log10(totalPowerWatts);
  const kardashevNumber = calcKardashevNumber(totalPowerWatts);
  const band = classifyLevel(log10Power);
  const rate = GROWTH_RATES[growthRate].rate;
  const projections = calcProjections(totalPowerWatts, rate);

  // Find next integer level
  const currentK = Math.floor(kardashevNumber);
  const nextK = currentK + 1;
  const nextPower = kardashevToPower(nextK);
  const yearsToNext = yearsToReach(totalPowerWatts, nextPower, rate);

  return {
    totalPowerWatts,
    log10Power,
    kardashevNumber,
    level: band.level,
    band,
    earthMultiple: totalPowerWatts / EARTH_POWER,
    solarMultiple: totalPowerWatts / SOLAR_LUMINOSITY,
    galaxyMultiple: totalPowerWatts / GALAXY_LUMINOSITY,
    yearsToNextLevel: yearsToNext,
    projections,
    valid: true,
  };
}

// ─── Format Helpers ───────────────────────────────────────────────────

export function formatPower(watts: number): string {
  if (watts === 0) return "0 W";
  const log = Math.log10(watts);
  if (log < 3) return `${watts.toFixed(1)} W`;
  if (log < 6) return `${(watts / 1e3).toFixed(1)} kW`;
  if (log < 9) return `${(watts / 1e6).toFixed(1)} MW`;
  if (log < 12) return `${(watts / 1e9).toFixed(1)} GW`;
  if (log < 15) return `${(watts / 1e12).toFixed(1)} TW`;
  if (log < 18) return `${(watts / 1e15).toFixed(1)} PW`;
  if (log < 21) return `${(watts / 1e18).toFixed(1)} EW`;
  return `10^${log.toFixed(1)} W`;
}

export function formatKardashev(k: number): string {
  return k.toFixed(3);
}

export function formatYears(years: number | null): string {
  if (years === null) return "N/A";
  if (years === 0) return "Already reached";
  if (years < 1) return "< 1 year";
  if (years < 1000) return `~${Math.round(years)} years`;
  if (years < 1e6) return `~${(years / 1e3).toFixed(1)}k years`;
  if (years < 1e9) return `~${(years / 1e6).toFixed(1)}M years`;
  return `~${(years / 1e9).toFixed(1)}B years`;
}

export function formatMultiple(multiple: number): string {
  if (multiple < 0.001) return `${multiple.toExponential(1)}x`;
  if (multiple < 1) return `${multiple.toFixed(3)}x`;
  if (multiple < 1000) return `${multiple.toFixed(1)}x`;
  if (multiple < 1e6) return `${(multiple / 1e3).toFixed(1)}k x`;
  return `${multiple.toExponential(1)}x`;
}

// ─── Copy Text Builder ────────────────────────────────────────────────

export function buildCopyText(result: KardashevResult, form: KardashevFormState): string {
  if (!result.valid) return "No valid results to copy.";

  const lines = [
    "K-SCALE: KARDASHEV CLASSIFICATION",
    "═".repeat(40),
    "",
    `Kardashev Number: ${formatKardashev(result.kardashevNumber)}`,
    `Classification: ${result.band.label}`,
    `Total Power: ${formatPower(result.totalPowerWatts)} (10^${result.log10Power.toFixed(1)} W)`,
    "",
    `Earth Comparison: ${formatMultiple(result.earthMultiple)}`,
    `Solar Comparison: ${formatMultiple(result.solarMultiple)}`,
    `Galaxy Comparison: ${formatMultiple(result.galaxyMultiple)}`,
    "",
    `Growth Rate: ${GROWTH_RATES[form.growthRate].description}`,
  ];

  if (result.projections.length > 0) {
    lines.push("", "PROJECTIONS:");
    for (const p of result.projections) {
      lines.push(`  ${p.label}: ${formatYears(p.yearsToReach)}`);
    }
  }

  lines.push("", "Generated by StellarForge.tools, K-Scale Calculator");
  return lines.join("\n");
}
