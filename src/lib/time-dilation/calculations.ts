// Time Dilation Calculator, Pure Calculation Engine
// No React dependencies, importable by both page components and PDF templates

import type { DilationSeverity } from "./data";
import { PROPULSION_METHODS, JOURNEY_PRESETS, STORY_PROMPTS } from "./data";

// ─── Physical Constants ──────────────────────────────────────────────

export const C = 299_792_458; // speed of light in m/s
export const LY_IN_METERS = 9.461e15; // 1 light-year in meters
export const AU_IN_METERS = 1.496e11; // 1 AU in meters
export const PC_IN_METERS = 3.086e16; // 1 parsec in meters
export const G_ACCEL = 9.80665; // 1g in m/s²
export const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
export const SECONDS_PER_DAY = 24 * 3600;

// ─── Result Interface ────────────────────────────────────────────────

export interface TimeDilationResult {
  valid: boolean;
  error?: string;

  // Distance info
  distanceMeters: number;
  distanceLY: number;

  // Core results
  lorentzFactor: number;
  peakVelocityFraction: number; // v/c at peak
  shipTimeSeconds: number;
  observerTimeSeconds: number;
  timeDifferenceSeconds: number;

  // Formatted display
  shipTimeFormatted: string;
  observerTimeFormatted: string;
  timeDifferenceFormatted: string;
  distanceFormatted: string;

  // Brachistochrone-specific (observer frame times)
  accelerationPhaseSeconds?: number;
  cruisePhaseSeconds?: number;
  decelerationPhaseSeconds?: number;
  peakVelocityCapped?: boolean;

  // Severity
  severity: DilationSeverity;

  // Narrative
  narrativeSummary: string;
  storyCallouts: { title: string; prompt: string }[];
}

// ─── FormState (matches the tool page) ───────────────────────────────

export interface FormStateForCalc {
  journey: {
    presetCategory: string;
    presetId: string;
    customDistance: string;
    customDistanceUnit: string;
    originName: string;
    destinationName: string;
  };
  propulsion: {
    method: string;
    customMaxVelocity: string;
  };
  velocityProfile: {
    mode: string;
    velocityFraction: string;
    gForce: string;
  };
  referenceFrame: {
    frame: string;
    customName: string;
  };
  roundTrip: boolean;
  alcubierreNoDilation: boolean;
}

// ─── Unit Conversion ─────────────────────────────────────────────────

export function convertToMeters(distance: number, unit: string): number {
  switch (unit) {
    case "ly":
      return distance * LY_IN_METERS;
    case "au":
      return distance * AU_IN_METERS;
    case "km":
      return distance * 1000;
    case "pc":
      return distance * PC_IN_METERS;
    default:
      return distance * LY_IN_METERS;
  }
}

export function convertToLY(distanceMeters: number): number {
  return distanceMeters / LY_IN_METERS;
}

// ─── Lorentz Factor ──────────────────────────────────────────────────

export function lorentzFactor(velocityFractionC: number): number {
  const v = Math.abs(velocityFractionC);
  if (v >= 1) return Infinity;
  if (v <= 0) return 1;

  // Clamp for floating-point safety near c
  const vSquared = Math.min(v * v, 1 - 1e-15);
  return 1 / Math.sqrt(1 - vSquared);
}

// ─── Duration Formatting ─────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "-";

  const absSeconds = Math.abs(seconds);

  if (absSeconds < 1) return "< 1 second";
  if (absSeconds < 60) return `${absSeconds.toFixed(1)} seconds`;
  if (absSeconds < 3600) return `${(absSeconds / 60).toFixed(1)} minutes`;
  if (absSeconds < SECONDS_PER_DAY) return `${(absSeconds / 3600).toFixed(1)} hours`;
  if (absSeconds < SECONDS_PER_YEAR * 0.1) return `${(absSeconds / SECONDS_PER_DAY).toFixed(1)} days`;
  if (absSeconds < SECONDS_PER_YEAR * 1000) {
    const years = absSeconds / SECONDS_PER_YEAR;
    if (years < 10) return `${years.toFixed(2)} years`;
    if (years < 100) return `${years.toFixed(1)} years`;
    return `${Math.round(years).toLocaleString()} years`;
  }
  if (absSeconds < SECONDS_PER_YEAR * 1e6) {
    return `${(absSeconds / (SECONDS_PER_YEAR * 1000)).toFixed(1)} millennia`;
  }
  if (absSeconds < SECONDS_PER_YEAR * 1e9) {
    return `${(absSeconds / (SECONDS_PER_YEAR * 1e6)).toFixed(1)} million years`;
  }
  return `${(absSeconds / (SECONDS_PER_YEAR * 1e9)).toFixed(1)} billion years`;
}

export function formatDistance(distanceLY: number): string {
  if (distanceLY < 1e-7) {
    // Light-seconds
    const lightSeconds = distanceLY * SECONDS_PER_YEAR;
    return `${lightSeconds.toFixed(2)} light-seconds`;
  }
  if (distanceLY < 1e-4) {
    // Light-minutes
    const lightMinutes = (distanceLY * SECONDS_PER_YEAR) / 60;
    return `${lightMinutes.toFixed(1)} light-minutes`;
  }
  if (distanceLY < 0.01) {
    // Light-hours
    const lightHours = (distanceLY * SECONDS_PER_YEAR) / 3600;
    return `${lightHours.toFixed(2)} light-hours`;
  }
  if (distanceLY < 1000) {
    return `${distanceLY.toFixed(2)} light-years`;
  }
  return `${distanceLY.toLocaleString(undefined, { maximumFractionDigits: 0 })} light-years`;
}

// ─── Severity ────────────────────────────────────────────────────────

export function getDilationSeverity(gamma: number): DilationSeverity {
  if (gamma < 1.0001) return "negligible";
  if (gamma < 1.1) return "notable";
  if (gamma < 5) return "significant";
  return "extreme";
}

// ─── Constant Velocity Calculation ───────────────────────────────────

export function calculateConstantVelocity(
  distanceMeters: number,
  velocityFractionC: number,
  roundTrip: boolean
): TimeDilationResult {
  const v = velocityFractionC;
  const distanceLY = convertToLY(distanceMeters);
  const effectiveDistance = roundTrip ? distanceMeters * 2 : distanceMeters;

  if (v <= 0) {
    return makeErrorResult(distanceMeters, distanceLY, "Set a velocity to calculate time dilation.");
  }
  if (v >= 1) {
    return makeErrorResult(distanceMeters, distanceLY, "Cannot exceed the speed of light.");
  }

  const gamma = lorentzFactor(v);
  const velocityMs = v * C;

  // Observer time: t = d / v
  const observerTime = effectiveDistance / velocityMs;
  // Ship time: τ = t / γ
  const shipTime = observerTime / gamma;
  const timeDiff = Math.abs(observerTime - shipTime);

  const severity = getDilationSeverity(gamma);

  return {
    valid: true,
    distanceMeters,
    distanceLY,
    lorentzFactor: gamma,
    peakVelocityFraction: v,
    shipTimeSeconds: shipTime,
    observerTimeSeconds: observerTime,
    timeDifferenceSeconds: timeDiff,
    shipTimeFormatted: formatDuration(shipTime),
    observerTimeFormatted: formatDuration(observerTime),
    timeDifferenceFormatted: formatDuration(timeDiff),
    distanceFormatted: formatDistance(distanceLY),
    severity,
    narrativeSummary: "",
    storyCallouts: STORY_PROMPTS[severity] || [],
  };
}

// ─── Brachistochrone Calculation ─────────────────────────────────────

export function calculateBrachistochrone(
  distanceMeters: number,
  gForce: number,
  maxVelocityFractionC: number,
  roundTrip: boolean
): TimeDilationResult {
  const distanceLY = convertToLY(distanceMeters);
  const effectiveDistance = roundTrip ? distanceMeters * 2 : distanceMeters;
  const halfDistance = effectiveDistance / 2;
  const a = gForce * G_ACCEL; // proper acceleration in m/s²

  if (a <= 0) {
    return makeErrorResult(distanceMeters, distanceLY, "Set acceleration to calculate.");
  }
  if (maxVelocityFractionC <= 0) {
    return makeErrorResult(distanceMeters, distanceLY, "Set a propulsion method to calculate.");
  }

  const maxVelocityMs = Math.min(maxVelocityFractionC, 1 - 1e-15) * C;

  // Phase 1: Acceleration from rest
  // Relativistic constant-acceleration equations:
  //   x(t) = (c²/a)(√(1 + (at/c)²) - 1)
  //   v(t) = at / √(1 + (at/c)²)
  //   τ(t) = (c/a) arcsinh(at/c)

  // Find coordinate time to reach max velocity:
  // v_max = a*t_vmax / √(1 + (a*t_vmax/c)²)
  // Solving: t_vmax = v_max / (a * √(1 - v_max²/c²))
  const vMaxRatio = maxVelocityMs / C;
  const gammaMax = lorentzFactor(vMaxRatio);
  const t_vmax = (maxVelocityMs * gammaMax) / a; // coordinate time to reach v_max

  // Distance covered during acceleration to v_max:
  const d_accel = (C * C / a) * (Math.sqrt(1 + (a * t_vmax / C) ** 2) - 1);

  let observerTime: number;
  let shipTime: number;
  let accelPhaseObserver: number;
  let cruisePhaseObserver: number;
  let peakVelocityCapped: boolean;
  let peakV: number;

  if (d_accel >= halfDistance) {
    // Pure brachistochrone: ship reaches midpoint before hitting velocity cap
    peakVelocityCapped = false;

    // Find coordinate time to cover halfDistance:
    // halfDistance = (c²/a)(√(1 + (at/c)²) - 1)
    // Solving: t = (1/a)√((halfDistance + c²/a)² - (c²/a)²) / c...
    // Simpler: t = √(halfDistance(halfDistance + 2c²/a)) / c ... no
    // Let's solve properly:
    // d = (c²/a)(√(1 + (at/c)²) - 1)
    // d*a/c² + 1 = √(1 + (at/c)²)
    // (d*a/c² + 1)² = 1 + (at/c)²
    // (at/c)² = (d*a/c² + 1)² - 1
    // t = (c/a) √((d*a/c² + 1)² - 1)

    const ratio = halfDistance * a / (C * C) + 1;
    const t_half = (C / a) * Math.sqrt(ratio * ratio - 1);

    // Proper time for acceleration to midpoint:
    const tau_half = (C / a) * Math.asinh(a * t_half / C);

    // Total: accel half + decel half (symmetric)
    observerTime = 2 * t_half;
    shipTime = 2 * tau_half;
    accelPhaseObserver = t_half;
    cruisePhaseObserver = 0;

    // Peak velocity at midpoint:
    peakV = a * t_half / Math.sqrt(1 + (a * t_half / C) ** 2) / C;
  } else {
    // Velocity-capped: accel → cruise → decel
    peakVelocityCapped = true;
    peakV = vMaxRatio;

    // Proper time during acceleration phase (to reach v_max):
    const tau_accel = (C / a) * Math.asinh(a * t_vmax / C);

    // Remaining distance at cruise velocity:
    const cruiseDistance = halfDistance * 2 - 2 * d_accel; // total distance minus accel+decel
    const cruiseObserverTime = cruiseDistance / maxVelocityMs;
    const cruiseShipTime = cruiseObserverTime / gammaMax;

    accelPhaseObserver = t_vmax;
    cruisePhaseObserver = cruiseObserverTime;

    // Total times
    observerTime = 2 * t_vmax + cruiseObserverTime;
    shipTime = 2 * tau_accel + cruiseShipTime;
  }

  const timeDiff = Math.abs(observerTime - shipTime);
  const gamma = lorentzFactor(peakV);
  const severity = getDilationSeverity(gamma);

  return {
    valid: true,
    distanceMeters,
    distanceLY,
    lorentzFactor: gamma,
    peakVelocityFraction: peakV,
    shipTimeSeconds: shipTime,
    observerTimeSeconds: observerTime,
    timeDifferenceSeconds: timeDiff,
    shipTimeFormatted: formatDuration(shipTime),
    observerTimeFormatted: formatDuration(observerTime),
    timeDifferenceFormatted: formatDuration(timeDiff),
    distanceFormatted: formatDistance(distanceLY),
    accelerationPhaseSeconds: accelPhaseObserver,
    cruisePhaseSeconds: cruisePhaseObserver,
    decelerationPhaseSeconds: accelPhaseObserver, // symmetric
    peakVelocityCapped,
    severity,
    narrativeSummary: "",
    storyCallouts: STORY_PROMPTS[severity] || [],
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────

export function calculateTimeDilation(formState: FormStateForCalc): TimeDilationResult {
  // Resolve distance
  let distanceLY: number;

  if (formState.journey.presetCategory === "custom") {
    const raw = parseFloat(formState.journey.customDistance);
    if (isNaN(raw) || raw <= 0) {
      return makeErrorResult(0, 0, "Enter a valid distance to calculate.");
    }
    const meters = convertToMeters(raw, formState.journey.customDistanceUnit);
    distanceLY = convertToLY(meters);
  } else {
    // Find the preset pair
    const category = JOURNEY_PRESETS.find((c) => c.id === formState.journey.presetCategory);
    const pair = category?.pairs.find((p) => p.id === formState.journey.presetId);
    if (!pair) {
      return makeErrorResult(0, 0, "Select a journey to calculate.");
    }
    distanceLY = pair.distanceLY;
  }

  const distanceMeters = distanceLY * LY_IN_METERS;

  // Resolve propulsion max velocity
  const method = PROPULSION_METHODS.find((m) => m.id === formState.propulsion.method);
  if (!method && formState.propulsion.method !== "custom") {
    return makeErrorResult(distanceMeters, distanceLY, "Select a propulsion method.");
  }

  let maxVelocityC: number;
  if (formState.propulsion.method === "custom") {
    maxVelocityC = parseFloat(formState.propulsion.customMaxVelocity);
    if (isNaN(maxVelocityC) || maxVelocityC <= 0) {
      return makeErrorResult(distanceMeters, distanceLY, "Enter a valid max velocity for your custom drive.");
    }
  } else {
    maxVelocityC = method!.maxVelocityC;
  }

  // Alcubierre special handling
  const isAlcubierre = method?.isAlcubierre === true;
  if (isAlcubierre && formState.alcubierreNoDilation) {
    // Inside warp bubble: flat spacetime, no dilation
    const effectiveDistance = formState.roundTrip ? distanceMeters * 2 : distanceMeters;
    const travelTime = effectiveDistance / (maxVelocityC * C);
    return {
      valid: true,
      distanceMeters,
      distanceLY,
      lorentzFactor: 1,
      peakVelocityFraction: maxVelocityC,
      shipTimeSeconds: travelTime,
      observerTimeSeconds: travelTime,
      timeDifferenceSeconds: 0,
      shipTimeFormatted: formatDuration(travelTime),
      observerTimeFormatted: formatDuration(travelTime),
      timeDifferenceFormatted: "None (flat spacetime inside bubble)",
      distanceFormatted: formatDistance(distanceLY),
      severity: "negligible",
      narrativeSummary: generateNarrative(
        {
          shipTimeSeconds: travelTime,
          observerTimeSeconds: travelTime,
          timeDifferenceSeconds: 0,
          severity: "negligible",
          peakVelocityFraction: maxVelocityC,
          lorentzFactor: 1,
        },
        formState,
        true
      ),
      storyCallouts: [
        {
          title: "Inside the Warp Bubble",
          prompt: "Your character experiences normal time inside the Alcubierre bubble. The strangeness is outside, causality violations, potential communication paradoxes, and the question of what happens at the bubble boundary.",
        },
      ],
    };
  }

  // For Alcubierre with dilation: treat effective velocity as superluminal
  // but use Lorentz with the effective sub-c fraction for dramatic effect
  if (isAlcubierre && !formState.alcubierreNoDilation) {
    const effectiveDistance = formState.roundTrip ? distanceMeters * 2 : distanceMeters;
    const observerTime = effectiveDistance / (maxVelocityC * C);
    // With dilation interpretation: traveler experiences MORE time (inverted effect)
    const dilationMultiplier = maxVelocityC; // warp factor as time multiplier
    const shipTime = observerTime * dilationMultiplier;
    const timeDiff = Math.abs(shipTime - observerTime);

    return {
      valid: true,
      distanceMeters,
      distanceLY,
      lorentzFactor: maxVelocityC,
      peakVelocityFraction: maxVelocityC,
      shipTimeSeconds: shipTime,
      observerTimeSeconds: observerTime,
      timeDifferenceSeconds: timeDiff,
      shipTimeFormatted: formatDuration(shipTime),
      observerTimeFormatted: formatDuration(observerTime),
      timeDifferenceFormatted: formatDuration(timeDiff),
      distanceFormatted: formatDistance(distanceLY),
      severity: timeDiff > SECONDS_PER_YEAR * 10 ? "extreme" : timeDiff > SECONDS_PER_YEAR ? "significant" : "notable",
      narrativeSummary: generateNarrative(
        {
          shipTimeSeconds: shipTime,
          observerTimeSeconds: observerTime,
          timeDifferenceSeconds: timeDiff,
          severity: "significant",
          peakVelocityFraction: maxVelocityC,
          lorentzFactor: maxVelocityC,
        },
        formState,
        true
      ),
      storyCallouts: [
        {
          title: "Inverted Dilation",
          prompt: "At superluminal speeds with this interpretation, the traveler ages MORE than the observer. Time debt runs in the opposite direction, your character arrives older than expected.",
        },
        {
          title: "Causality Concerns",
          prompt: "FTL travel raises deep causality paradoxes. Can messages be sent to the past? Your story needs rules about how information propagates.",
        },
      ],
    };
  }

  // Standard sub-luminal calculation
  if (formState.velocityProfile.mode === "brachistochrone") {
    const gForce = parseFloat(formState.velocityProfile.gForce);
    if (isNaN(gForce) || gForce <= 0) {
      return makeErrorResult(distanceMeters, distanceLY, "Set a valid acceleration (g-force).");
    }
    const result = calculateBrachistochrone(distanceMeters, gForce, maxVelocityC, formState.roundTrip);
    result.narrativeSummary = generateNarrative(result, formState, false);
    return result;
  } else {
    // Constant velocity
    let velocityC = parseFloat(formState.velocityProfile.velocityFraction);
    if (isNaN(velocityC) || velocityC <= 0) {
      return makeErrorResult(distanceMeters, distanceLY, "Set a travel velocity to calculate.");
    }
    // Cap at propulsion max
    velocityC = Math.min(velocityC, maxVelocityC);
    const result = calculateConstantVelocity(distanceMeters, velocityC, formState.roundTrip);
    result.narrativeSummary = generateNarrative(result, formState, false);
    return result;
  }
}

// ─── Narrative Generation ────────────────────────────────────────────

interface NarrativeInput {
  shipTimeSeconds: number;
  observerTimeSeconds: number;
  timeDifferenceSeconds: number;
  severity: DilationSeverity;
  peakVelocityFraction: number;
  lorentzFactor: number;
}

function generateNarrative(
  result: NarrativeInput,
  formState: FormStateForCalc,
  isAlcubierre: boolean
): string {
  const origin = formState.journey.originName || "origin";
  const destination = formState.journey.destinationName || "destination";
  const roundTrip = formState.roundTrip;
  const shipTime = formatDuration(result.shipTimeSeconds);
  const observerTime = formatDuration(result.observerTimeSeconds);
  const timeDiff = formatDuration(result.timeDifferenceSeconds);

  const frameName =
    formState.referenceFrame.frame === "custom"
      ? formState.referenceFrame.customName || "home"
      : formState.referenceFrame.frame === "earth"
        ? "Earth"
        : formState.referenceFrame.frame === "origin"
          ? origin
          : formState.referenceFrame.frame === "destination"
            ? destination
            : formState.referenceFrame.frame.charAt(0).toUpperCase() + formState.referenceFrame.frame.slice(1);

  if (isAlcubierre) {
    return `Ship departs ${origin} for ${destination} via Alcubierre drive. At warp factor ${result.peakVelocityFraction.toFixed(1)}×c, the journey takes ${observerTime} from ${frameName}'s perspective. ${result.timeDifferenceSeconds === 0 ? "Inside the warp bubble, the traveler experiences the same duration, no time dilation." : `The traveler experiences ${shipTime}, ${timeDiff} more than observers.`}`;
  }

  const velocityStr = result.peakVelocityFraction < 0.001
    ? `${(result.peakVelocityFraction * C / 1000).toFixed(1)} km/s (${(result.peakVelocityFraction * 100).toFixed(4)}% c)`
    : `${(result.peakVelocityFraction * 100).toFixed(2)}% c`;

  let narrative = `Ship departs ${origin} for ${destination} at peak velocity ${velocityStr}. `;

  if (result.severity === "negligible") {
    narrative += `On ${frameName}: ${observerTime} pass. On the ship: ${shipTime} pass. Time dilation is negligible at this speed, your travelers won't notice the difference.`;
  } else {
    narrative += `On ${frameName}: ${observerTime} pass. On the ship: ${shipTime} pass. Time lost by the traveler: ${timeDiff}.`;
  }

  if (roundTrip && result.severity !== "negligible") {
    const totalObserver = formatDuration(result.observerTimeSeconds);
    const totalShip = formatDuration(result.shipTimeSeconds);
    narrative += ` This is the total round-trip calculation: ${totalObserver} at home, ${totalShip} aboard the ship.`;
  }

  // Add absurd travel time note
  if (result.observerTimeSeconds > SECONDS_PER_YEAR * 10000) {
    narrative += " Note: This journey would take longer than recorded human history.";
  }
  if (result.observerTimeSeconds > SECONDS_PER_YEAR * 1e6) {
    narrative += " At this timescale, stellar evolution becomes relevant, stars may have died en route.";
  }

  return narrative;
}

// ─── Copy Text Builder ───────────────────────────────────────────────

export function buildCopyText(result: TimeDilationResult, formState: FormStateForCalc): string {
  const method = PROPULSION_METHODS.find((m) => m.id === formState.propulsion.method);
  const methodName = method?.label || formState.propulsion.method;
  const profileMode = formState.velocityProfile.mode === "brachistochrone"
    ? `Brachistochrone at ${formState.velocityProfile.gForce}g`
    : `Constant velocity at ${(result.peakVelocityFraction * 100).toFixed(4)}% c`;

  let text = `TIME DILATION ANALYSIS\n`;
  text += `======================\n`;
  text += `Route: ${formState.journey.originName} → ${formState.journey.destinationName} (${result.distanceFormatted})\n`;
  text += `Propulsion: ${methodName}\n`;
  text += `Profile: ${profileMode}\n`;
  text += `Round Trip: ${formState.roundTrip ? "Yes" : "No"}\n`;
  text += `\n`;
  text += `RESULTS\n`;
  text += `-------\n`;
  text += `Lorentz Factor (γ): ${result.lorentzFactor.toFixed(6)}\n`;
  text += `Peak Velocity: ${(result.peakVelocityFraction * 100).toFixed(4)}% c\n`;
  text += `Ship Time: ${result.shipTimeFormatted}\n`;
  text += `Observer Time: ${result.observerTimeFormatted}\n`;
  text += `Time Difference: ${result.timeDifferenceFormatted}\n`;

  if (result.accelerationPhaseSeconds !== undefined) {
    text += `\nFLIGHT PROFILE\n`;
    text += `--------------\n`;
    text += `Acceleration Phase: ${formatDuration(result.accelerationPhaseSeconds)}\n`;
    if (result.cruisePhaseSeconds && result.cruisePhaseSeconds > 0) {
      text += `Cruise Phase: ${formatDuration(result.cruisePhaseSeconds)}\n`;
    }
    text += `Deceleration Phase: ${formatDuration(result.decelerationPhaseSeconds!)}\n`;
    if (result.peakVelocityCapped) {
      text += `(Peak velocity capped at propulsion maximum)\n`;
    }
  }

  text += `\n${result.narrativeSummary}\n`;
  text += `\nGenerated by StellarForge.tools\n`;

  return text;
}

// ─── Error Result Helper ─────────────────────────────────────────────

function makeErrorResult(distanceMeters: number, distanceLY: number, error: string): TimeDilationResult {
  return {
    valid: false,
    error,
    distanceMeters,
    distanceLY,
    lorentzFactor: 1,
    peakVelocityFraction: 0,
    shipTimeSeconds: 0,
    observerTimeSeconds: 0,
    timeDifferenceSeconds: 0,
    shipTimeFormatted: "-",
    observerTimeFormatted: "-",
    timeDifferenceFormatted: "-",
    distanceFormatted: formatDistance(distanceLY),
    severity: "negligible",
    narrativeSummary: "",
    storyCallouts: [],
  };
}
