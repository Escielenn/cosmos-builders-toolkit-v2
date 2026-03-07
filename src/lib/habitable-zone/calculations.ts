// Habitable Zone Calculator — Pure Calculation Engine
// No React dependencies — importable by both page components and PDF templates

import type { MoodboardImage } from "@/hooks/use-moodboard";
import {
  ZONE_NAMES,
  ZONE_DESCRIPTIONS,
  ZONE_IMPLICATIONS,
  type PlanetZone,
  type WorldbuildingImplication,
} from "./data";

// ─── Physical Constants ──────────────────────────────────────────────

export const SOLAR_LUMINOSITY = 3.828e26; // watts
export const SOLAR_MASS_KG = 1.989e30;   // kg
export const SOLAR_TEMP = 5778;           // K
export const STEFAN_BOLTZMANN = 5.67e-8;  // W m^-2 K^-4
export const AU_IN_METERS = 1.496e11;     // 1 AU in meters
export const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
export const EARTH_DAYS_PER_YEAR = 365.25;

// ─── Kopparapu et al. (2013) S_eff values ───────────────────────────

export const S_EFF = {
  recentVenus: 1.776,
  runawayGreenhouse: 1.107,
  maxGreenhouse: 0.356,
  earlyMars: 0.320,
} as const;

// ─── Form State (matches the tool page) ─────────────────────────────

export interface FormStateForCalc {
  star: {
    presetId: string;
    spectralType: string;
    mass: number;
    luminosity: number;
    temperature: number;
    autoLuminosity: boolean;
  };
  planet: {
    orbitalDistance: number;
    name: string;
    greenhouseWarming: number; // K, default 33 (Earth-like)
  };
  storyNotes: {
    starDescription: string;
    planetSetting: string;
    habitabilityNarrative: string;
    worldbuildingNotes: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

// ─── HZ Boundaries ──────────────────────────────────────────────────

export interface HZBoundaries {
  recentVenus: number;       // AU — optimistic inner
  runawayGreenhouse: number; // AU — conservative inner
  maxGreenhouse: number;     // AU — conservative outer
  earlyMars: number;         // AU — optimistic outer
  snowline: number;          // AU
  optimisticWidth: number;   // AU
  conservativeWidth: number; // AU
}

export function calcHZBoundaries(luminosity: number): HZBoundaries {
  const L = Math.max(luminosity, 1e-10);
  const sqrtL = Math.sqrt(L);

  const recentVenus = sqrtL / Math.sqrt(S_EFF.recentVenus);
  const runawayGreenhouse = sqrtL / Math.sqrt(S_EFF.runawayGreenhouse);
  const maxGreenhouse = sqrtL / Math.sqrt(S_EFF.maxGreenhouse);
  const earlyMars = sqrtL / Math.sqrt(S_EFF.earlyMars);
  const snowline = 2.7 * sqrtL;

  return {
    recentVenus,
    runawayGreenhouse,
    maxGreenhouse,
    earlyMars,
    snowline,
    optimisticWidth: earlyMars - recentVenus,
    conservativeWidth: maxGreenhouse - runawayGreenhouse,
  };
}

// ─── Mass-Luminosity Relation ───────────────────────────────────────

export function luminosityFromMass(mass: number): number {
  const M = Math.max(mass, 0.01);
  if (M < 0.43) return 0.23 * Math.pow(M, 2.3);
  if (M < 2) return Math.pow(M, 4);
  if (M < 55) return 1.4 * Math.pow(M, 3.5);
  return 32000 * M;
}

// ─── Equilibrium Temperature ────────────────────────────────────────

export function equilibriumTemperature(
  luminosityLsun: number,
  distanceAU: number,
  albedo = 0.3
): number {
  if (distanceAU <= 0) return 0;
  // T_eq = T_0 * L^0.25 / sqrt(d) * (1-a)^0.25
  // T_0 = (S_0 / (4σ))^0.25 ≈ 278.5 K (zero-albedo equilibrium at 1 AU from Sun)
  // Earth (L=1, d=1, a=0.3): 278.5 × 0.7^0.25 ≈ 254.8 K (-18°C) — correct
  const L = Math.max(luminosityLsun, 1e-10);
  return 278.5 * Math.pow(L, 0.25) / Math.sqrt(distanceAU) * Math.pow(1 - albedo, 0.25);
}

export function estimatedSurfaceTemperature(
  equilibriumTempK: number,
  greenhouseWarmingK: number
): number {
  return equilibriumTempK + greenhouseWarmingK;
}

// ─── Stellar Flux ───────────────────────────────────────────────────

export function stellarFlux(luminosityLsun: number, distanceAU: number): number {
  if (distanceAU <= 0) return Infinity;
  return luminosityLsun / (distanceAU * distanceAU);
}

// ─── Orbital Period ─────────────────────────────────────────────────

export function orbitalPeriod(distanceAU: number, starMass: number): number {
  if (starMass <= 0) return 0;
  // Kepler's 3rd law: P = sqrt(a^3 / M) in years
  return Math.sqrt(Math.pow(distanceAU, 3) / starMass);
}

// ─── Zone Classification ────────────────────────────────────────────

export function classifyPlanetZone(
  distanceAU: number,
  hz: HZBoundaries
): PlanetZone {
  // Check snowline proximity first (within 15% of snowline distance)
  if (Math.abs(distanceAU - hz.snowline) / hz.snowline < 0.15) {
    return "near-snowline";
  }

  if (distanceAU < hz.recentVenus) return "scorched";
  if (distanceAU < hz.runawayGreenhouse) return "hot-optimistic";

  // Within conservative HZ
  const conservativeMid = (hz.runawayGreenhouse + hz.maxGreenhouse) / 2;
  const sweetSpotWidth = hz.conservativeWidth * 0.3;
  if (distanceAU >= hz.runawayGreenhouse && distanceAU <= hz.maxGreenhouse) {
    if (Math.abs(distanceAU - conservativeMid) < sweetSpotWidth / 2) {
      return "sweet-spot";
    }
    if (distanceAU < conservativeMid) return "inner-habitable";
    return "outer-habitable";
  }

  if (distanceAU <= hz.earlyMars) return "cold-optimistic";
  return "frozen";
}

// ─── Percent Through HZ ────────────────────────────────────────────

export function percentThroughHZ(
  distanceAU: number,
  hz: HZBoundaries
): number {
  if (distanceAU < hz.recentVenus) return -1;
  if (distanceAU > hz.earlyMars) return -1;
  const range = hz.earlyMars - hz.recentVenus;
  if (range <= 0) return 50;
  return ((distanceAU - hz.recentVenus) / range) * 100;
}

// ─── Duration/Period Formatting ─────────────────────────────────────

export function formatOrbitalPeriod(periodYears: number): string {
  if (!isFinite(periodYears) || isNaN(periodYears)) return "—";
  const days = periodYears * EARTH_DAYS_PER_YEAR;
  if (days < 1) return `${(days * 24).toFixed(1)} hours`;
  if (days < 10) return `${days.toFixed(2)} Earth days`;
  if (days < 365) return `${days.toFixed(1)} Earth days`;
  if (periodYears < 100) return `${periodYears.toFixed(2)} Earth years`;
  return `${Math.round(periodYears).toLocaleString()} Earth years`;
}

export function formatAU(au: number): string {
  if (!isFinite(au) || isNaN(au)) return "—";
  if (au < 0.001) return `${(au * AU_IN_METERS / 1e6).toFixed(1)} million km`;
  if (au < 0.01) return `${au.toFixed(4)} AU`;
  if (au < 1) return `${au.toFixed(3)} AU`;
  if (au < 100) return `${au.toFixed(2)} AU`;
  return `${Math.round(au).toLocaleString()} AU`;
}

export function formatTemperature(kelvin: number): string {
  if (!isFinite(kelvin) || isNaN(kelvin)) return "—";
  const celsius = kelvin - 273.15;
  return `${Math.round(kelvin)} K (${Math.round(celsius)}\u00B0C)`;
}

export function formatFlux(flux: number): string {
  if (!isFinite(flux) || isNaN(flux)) return "—";
  if (flux < 0.001) return `${(flux * 1000).toFixed(2)} \u00D710\u207B\u00B3 S\u2299`;
  if (flux < 1) return `${flux.toFixed(3)} S\u2299`;
  if (flux < 100) return `${flux.toFixed(2)} S\u2299`;
  return `${Math.round(flux).toLocaleString()} S\u2299`;
}

// ─── Result Interface ────────────────────────────────────────────────

export interface HabitableZoneResult {
  valid: boolean;
  error?: string;

  // HZ boundaries
  hz: HZBoundaries;

  // Planet analysis
  planetZone: PlanetZone;
  zoneName: string;
  zoneDescription: string;
  percentThroughHZ: number;
  equilibriumTemp: number;
  estimatedSurfaceTemp: number;
  stellarFlux: number;
  orbitalPeriodYears: number;

  // Worldbuilding
  implications: WorldbuildingImplication[];
  narrativeSummary: string;

  // Formatted display
  innerEdgeRecentVenusFormatted: string;
  innerEdgeRunawayFormatted: string;
  outerEdgeMaxGreenhouseFormatted: string;
  outerEdgeEarlyMarsFormatted: string;
  snowlineFormatted: string;
  optimisticWidthFormatted: string;
  conservativeWidthFormatted: string;
  equilibriumTempFormatted: string;
  estimatedSurfaceTempFormatted: string;
  stellarFluxFormatted: string;
  orbitalPeriodFormatted: string;
}

// ─── Main Entry Point ────────────────────────────────────────────────

export function calculateHabitableZone(formState: FormStateForCalc): HabitableZoneResult {
  const { star, planet } = formState;

  if (star.luminosity <= 0) {
    return makeErrorResult("Luminosity must be greater than zero.");
  }
  if (star.mass <= 0) {
    return makeErrorResult("Star mass must be greater than zero.");
  }
  if (planet.orbitalDistance <= 0) {
    return makeErrorResult("Orbital distance must be greater than zero.");
  }

  const hz = calcHZBoundaries(star.luminosity);
  const zone = classifyPlanetZone(planet.orbitalDistance, hz);
  const pctHZ = percentThroughHZ(planet.orbitalDistance, hz);
  const eqTemp = equilibriumTemperature(star.luminosity, planet.orbitalDistance);
  const ghWarming = planet.greenhouseWarming ?? 33;
  const surfaceTemp = estimatedSurfaceTemperature(eqTemp, ghWarming);
  const flux = stellarFlux(star.luminosity, planet.orbitalDistance);
  const period = orbitalPeriod(planet.orbitalDistance, star.mass);
  const implications = ZONE_IMPLICATIONS[zone] || [];

  const result: HabitableZoneResult = {
    valid: true,
    hz,
    planetZone: zone,
    zoneName: ZONE_NAMES[zone],
    zoneDescription: ZONE_DESCRIPTIONS[zone],
    percentThroughHZ: pctHZ,
    equilibriumTemp: eqTemp,
    estimatedSurfaceTemp: surfaceTemp,
    stellarFlux: flux,
    orbitalPeriodYears: period,
    implications,
    narrativeSummary: "",
    innerEdgeRecentVenusFormatted: formatAU(hz.recentVenus),
    innerEdgeRunawayFormatted: formatAU(hz.runawayGreenhouse),
    outerEdgeMaxGreenhouseFormatted: formatAU(hz.maxGreenhouse),
    outerEdgeEarlyMarsFormatted: formatAU(hz.earlyMars),
    snowlineFormatted: formatAU(hz.snowline),
    optimisticWidthFormatted: formatAU(hz.optimisticWidth),
    conservativeWidthFormatted: formatAU(hz.conservativeWidth),
    equilibriumTempFormatted: formatTemperature(eqTemp),
    estimatedSurfaceTempFormatted: formatTemperature(surfaceTemp),
    stellarFluxFormatted: formatFlux(flux),
    orbitalPeriodFormatted: formatOrbitalPeriod(period),
  };

  result.narrativeSummary = generateNarrative(result, formState);

  return result;
}

// ─── Narrative Generation ────────────────────────────────────────────

function generateNarrative(
  result: HabitableZoneResult,
  formState: FormStateForCalc
): string {
  const { star, planet } = formState;
  const planetName = planet.name || "Your planet";
  const starLabel = star.presetId === "custom"
    ? `a ${star.spectralType}-type star (${star.mass.toFixed(2)} M\u2609, ${star.luminosity.toFixed(4)} L\u2609)`
    : `${STAR_PRESETS_MAP[star.presetId] || star.spectralType + "-type star"}`;

  let narrative = `${planetName} orbits ${starLabel} at ${formatAU(planet.orbitalDistance)}. `;

  if (result.percentThroughHZ >= 0) {
    narrative += `It sits ${Math.round(result.percentThroughHZ)}% of the way through the habitable zone (from inner to outer edge). `;
  } else if (result.planetZone === "scorched") {
    narrative += `It lies inside the habitable zone — too close to its star for liquid surface water. `;
  } else if (result.planetZone === "frozen" || result.planetZone === "near-snowline") {
    narrative += `It lies beyond the habitable zone — too far from its star for unassisted liquid water. `;
  }

  narrative += `Equilibrium temperature: ${result.equilibriumTempFormatted}. `;
  narrative += `Estimated surface temperature (with greenhouse): ${result.estimatedSurfaceTempFormatted}. `;
  narrative += `Stellar flux: ${result.stellarFluxFormatted} (Earth = 1.0). `;
  narrative += `Year length: ${result.orbitalPeriodFormatted}.`;

  return narrative;
}

// Helper for narrative star name lookup
const STAR_PRESETS_MAP: Record<string, string> = {
  sol: "Sol (our Sun)",
  proxima: "Proxima Centauri",
  sirius: "Sirius A",
  kepler442: "Kepler-442",
  trappist1: "TRAPPIST-1",
};

// ─── Copy Text Builder ──────────────────────────────────────────────

export function buildCopyText(
  result: HabitableZoneResult,
  formState: FormStateForCalc
): string {
  const { star, planet } = formState;

  let text = `HABITABLE ZONE ANALYSIS\n`;
  text += `=======================\n`;
  text += `Star: ${star.spectralType}-type, ${star.mass.toFixed(3)} M\u2609, ${star.luminosity.toFixed(6)} L\u2609, ${Math.round(star.temperature)} K\n`;
  text += `Planet: ${planet.name || "Unnamed"} at ${formatAU(planet.orbitalDistance)}\n`;
  text += `\n`;
  text += `HABITABLE ZONE BOUNDARIES\n`;
  text += `-------------------------\n`;
  text += `Recent Venus (optimistic inner):    ${result.innerEdgeRecentVenusFormatted}\n`;
  text += `Runaway Greenhouse (conservative):  ${result.innerEdgeRunawayFormatted}\n`;
  text += `Maximum Greenhouse (conservative):  ${result.outerEdgeMaxGreenhouseFormatted}\n`;
  text += `Early Mars (optimistic outer):      ${result.outerEdgeEarlyMarsFormatted}\n`;
  text += `Snowline:                           ${result.snowlineFormatted}\n`;
  text += `Conservative HZ Width:              ${result.conservativeWidthFormatted}\n`;
  text += `Optimistic HZ Width:                ${result.optimisticWidthFormatted}\n`;
  text += `\n`;
  text += `PLANET ANALYSIS\n`;
  text += `---------------\n`;
  text += `Zone: ${result.zoneName}\n`;
  if (result.percentThroughHZ >= 0) {
    text += `Position: ${Math.round(result.percentThroughHZ)}% through HZ\n`;
  }
  text += `Equilibrium Temperature: ${result.equilibriumTempFormatted}\n`;
  text += `Est. Surface Temperature: ${result.estimatedSurfaceTempFormatted}\n`;
  text += `Greenhouse Warming: +${planet.greenhouseWarming ?? 33} K\n`;
  text += `Stellar Flux: ${result.stellarFluxFormatted}\n`;
  text += `Orbital Period: ${result.orbitalPeriodFormatted}\n`;
  text += `\n`;
  text += `${result.narrativeSummary}\n`;
  text += `\n`;
  text += `${result.zoneDescription}\n`;
  text += `\nGenerated by StellarForge.tools\n`;

  return text;
}

// ─── Error Result Helper ─────────────────────────────────────────────

function makeErrorResult(error: string): HabitableZoneResult {
  const emptyHz: HZBoundaries = {
    recentVenus: 0,
    runawayGreenhouse: 0,
    maxGreenhouse: 0,
    earlyMars: 0,
    snowline: 0,
    optimisticWidth: 0,
    conservativeWidth: 0,
  };
  return {
    valid: false,
    error,
    hz: emptyHz,
    planetZone: "sweet-spot",
    zoneName: "—",
    zoneDescription: "",
    percentThroughHZ: -1,
    equilibriumTemp: 0,
    estimatedSurfaceTemp: 0,
    stellarFlux: 0,
    orbitalPeriodYears: 0,
    implications: [],
    narrativeSummary: "",
    innerEdgeRecentVenusFormatted: "—",
    innerEdgeRunawayFormatted: "—",
    outerEdgeMaxGreenhouseFormatted: "—",
    outerEdgeEarlyMarsFormatted: "—",
    snowlineFormatted: "—",
    optimisticWidthFormatted: "—",
    conservativeWidthFormatted: "—",
    equilibriumTempFormatted: "—",
    estimatedSurfaceTempFormatted: "—",
    stellarFluxFormatted: "—",
    orbitalPeriodFormatted: "—",
  };
}
