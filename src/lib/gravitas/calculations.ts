// GRAVITAS, Physics calculation functions for all 5 modes

import type {
  SpinGravityInput,
  SpinGravityOutput,
  ThrustGravityInput,
  ThrustGravityOutput,
  CombinedVectorInput,
  CombinedVectorOutput,
  OrbitalInput,
  OrbitalOutput,
  ArtificialInput,
  ArtificialOutput,
  CoriolisIntensity,
  HabitabilityStatus,
  GravitasFormState,
  CalculationMode,
} from "./types";
import {
  G,
  C,
  AU_M,
  EARTH_G,
  GRAVITY_CLASSIFICATIONS,
  TECHNOBABBLE,
  PHYSICS_VIOLATIONS,
  TILT_TABLE,
} from "./data";
import {
  calculateBrachistochrone,
  G_ACCEL as TD_G_ACCEL,
} from "@/lib/time-dilation/calculations";

const SECONDS_PER_YEAR = 365.25 * 86400;
const COAST_BURN_S = 86400 * 7; // one week of proper (ship) time per burn

// ─── Spin Gravity ───────────────────────────────────────────────────

export function calculateSpinGravity(input: SpinGravityInput): SpinGravityOutput {
  const { radius_m, rotation_rpm, human_height_m } = input;

  const period_s = 60 / rotation_rpm;
  const omega = (2 * Math.PI) / period_s;

  // Floor gravity: a = ω²r
  const floor_accel = omega * omega * radius_m;
  const floor_g = floor_accel / EARTH_G;

  // Head gravity (at reduced radius)
  const head_radius = Math.max(0, radius_m - human_height_m);
  const head_accel = omega * omega * head_radius;
  const head_g = head_accel / EARTH_G;

  // Gradient
  const gradient_g = floor_g - head_g;
  const gradient_percent = floor_g > 0 ? (gradient_g / floor_g) * 100 : 0;

  // Tangential velocity at floor
  const tangential_velocity_ms = omega * radius_m;

  // Coriolis parameter (2ω)
  const coriolis_parameter = 2 * omega;

  // Coriolis intensity classification
  let coriolis_intensity: CoriolisIntensity;
  if (rotation_rpm < 1) coriolis_intensity = "negligible";
  else if (rotation_rpm < 2) coriolis_intensity = "mild";
  else if (rotation_rpm < 4) coriolis_intensity = "moderate";
  else if (rotation_rpm < 6) coriolis_intensity = "strong";
  else coriolis_intensity = "severe";

  return {
    floor_g,
    head_g,
    gradient_g,
    gradient_percent,
    tangential_velocity_ms,
    coriolis_parameter,
    coriolis_intensity,
    is_comfortable: rotation_rpm <= 2,
    period_s,
  };
}

// ─── Thrust Gravity ─────────────────────────────────────────────────

export function calculateThrustGravity(input: ThrustGravityInput): ThrustGravityOutput {
  const { acceleration_g, mission_distance_au, propulsion_mode, include_relativity } = input;

  const accel_ms2 = acceleration_g * EARTH_G;
  const distance_m = mission_distance_au * AU_M;

  if (include_relativity && accel_ms2 > 0 && distance_m > 0) {
    return relativisticThrust(acceleration_g, accel_ms2, distance_m, propulsion_mode);
  }

  // Newtonian kinematics (relativity switched off). Valid while v << c.
  let trip_duration_s: number;
  let delta_v_ms: number;
  let peak_velocity_ms: number;

  if (propulsion_mode === "brachistochrone") {
    const half_distance = distance_m / 2;
    // d = ½at² → t = √(2d/a)
    const time_to_midpoint = Math.sqrt((2 * half_distance) / accel_ms2);
    trip_duration_s = time_to_midpoint * 2;
    peak_velocity_ms = accel_ms2 * time_to_midpoint;
    delta_v_ms = peak_velocity_ms * 2;
  } else if (propulsion_mode === "constant") {
    // Constant acceleration entire journey
    // d = ½at² → t = √(2d/a)
    trip_duration_s = Math.sqrt((2 * distance_m) / accel_ms2);
    peak_velocity_ms = accel_ms2 * trip_duration_s;
    delta_v_ms = peak_velocity_ms;
  } else {
    // Coast with burn phases: 1-week burns at each end
    const burn_duration = COAST_BURN_S;
    const burn_distance = 0.5 * accel_ms2 * burn_duration * burn_duration;
    const coast_distance = Math.max(0, distance_m - 2 * burn_distance);
    const coast_velocity = accel_ms2 * burn_duration;
    const coast_duration = coast_velocity > 0 ? coast_distance / coast_velocity : 0;

    trip_duration_s = 2 * burn_duration + coast_duration;
    peak_velocity_ms = coast_velocity;
    delta_v_ms = coast_velocity * 2;
  }

  // Newtonian speeds are unbounded; cap the display at 0.99c.
  peak_velocity_ms = Math.min(peak_velocity_ms, C * 0.99);
  const peak_velocity_c = peak_velocity_ms / C;
  const earth_time_years = trip_duration_s / SECONDS_PER_YEAR;

  return {
    effective_g: acceleration_g,
    trip_duration_days: trip_duration_s / 86400,
    delta_v_kms: delta_v_ms / 1000,
    peak_velocity_kms: peak_velocity_ms / 1000,
    peak_velocity_c,
    time_dilation_factor: 1,
    ship_time_years: earth_time_years,
    earth_time_years,
  };
}

/**
 * Relativistic thrust trips. Ship (proper) time and Earth (coordinate) time
 * come from the hyperbolic-motion equations for constant proper
 * acceleration a (Rindler; see also Baez & Gibbs, "The Relativistic Rocket",
 * math.ucr.edu/home/baez/physics/Relativity/SR/Rocket/rocket.html):
 *   x = (c²/a)(cosh(aτ/c) − 1),  t = (c/a) sinh(aτ/c),  v = c tanh(aτ/c).
 * The brachistochrone case calls the Time Dilation engine directly, the same
 * call the Ark makes, so both tools agree on every trip.
 * Delta-v is reported as a·τ (the proper velocity change the drive must
 * supply), which reduces to the Newtonian Δv at low speed.
 */
function relativisticThrust(
  acceleration_g: number,
  accel_ms2: number,
  distance_m: number,
  propulsion_mode: ThrustGravityInput["propulsion_mode"]
): ThrustGravityOutput {
  let earth_s: number;
  let ship_s: number;
  let peak_c: number;
  let burn_proper_s: number;

  if (propulsion_mode === "brachistochrone") {
    // calculateBrachistochrone takes standard-g multiples (9.80665 m/s²).
    const r = calculateBrachistochrone(distance_m, accel_ms2 / TD_G_ACCEL, 1, false);
    earth_s = r.observerTimeSeconds;
    ship_s = r.shipTimeSeconds;
    peak_c = r.peakVelocityFraction;
    burn_proper_s = ship_s; // thrusting the whole way (accelerate, then decelerate)
  } else if (propulsion_mode === "constant") {
    // Accelerate the entire distance from rest (flyby at the destination).
    const ratio = (distance_m * accel_ms2) / (C * C) + 1;
    earth_s = (C / accel_ms2) * Math.sqrt(ratio * ratio - 1);
    ship_s = (C / accel_ms2) * Math.acosh(ratio);
    peak_c = Math.tanh((accel_ms2 * ship_s) / C);
    burn_proper_s = ship_s;
  } else {
    // One-week burns (ship time) at each end, coast between.
    const rapidity = (accel_ms2 * COAST_BURN_S) / C;
    const burn_dist = ((C * C) / accel_ms2) * (Math.cosh(rapidity) - 1);
    const burn_coord = (C / accel_ms2) * Math.sinh(rapidity);
    peak_c = Math.tanh(rapidity);
    const coast_v = peak_c * C;
    const coast_dist = Math.max(0, distance_m - 2 * burn_dist);
    const coast_coord = coast_v > 0 ? coast_dist / coast_v : 0;
    earth_s = 2 * burn_coord + coast_coord;
    ship_s = 2 * COAST_BURN_S + coast_coord / Math.cosh(rapidity);
    burn_proper_s = 2 * COAST_BURN_S;
  }

  const gamma = 1 / Math.sqrt(1 - Math.min(peak_c * peak_c, 1 - 1e-15));
  return {
    effective_g: acceleration_g,
    trip_duration_days: earth_s / 86400,
    delta_v_kms: (accel_ms2 * burn_proper_s) / 1000,
    peak_velocity_kms: (peak_c * C) / 1000,
    peak_velocity_c: peak_c,
    time_dilation_factor: gamma,
    ship_time_years: ship_s / SECONDS_PER_YEAR,
    earth_time_years: earth_s / SECONDS_PER_YEAR,
  };
}

// ─── Combined Vector ────────────────────────────────────────────────

/**
 * Spin + thrust gravity felt on the rim of a rotating hull under thrust.
 *
 * Spin gravity points radially outward, in the plane perpendicular to the
 * spin axis. Thrust gravity points aft along the thrust line. Let θ be the
 * angle between the SPIN AXIS and the THRUST LINE, and φ the position of a
 * point around the rim. In the rim's local frame the felt acceleration is
 *   radial (floor-normal):  s + t·sinθ·cosφ
 *   in the floor plane:     t·cosθ (axial) and t·sinθ·sinφ (spinward)
 * so |g|² = s² + t² + 2·s·t·sinθ·cosφ.
 *
 *   θ = 0  (axis parallel to thrust, the usual design): the two vectors are
 *          perpendicular everywhere: |g| = √(s² + t²), tilt = atan(t/s),
 *          identical at every point on the rim.
 *   θ = 90 (axis perpendicular to thrust): |g| sweeps from |s − t| to s + t
 *          once per revolution, and the floor tilt changes with it.
 *
 * Outputs report the rim range and the point of WORST tilt (the value the
 * architecture has to survive). vector_angle_deg is the angle between the
 * two gravity vectors at that point, for the vector diagram.
 */
export function calculateCombinedVector(input: CombinedVectorInput): CombinedVectorOutput {
  const { spin_g, thrust_g, axis_orientation, custom_angle_deg } = input;

  // Angle between the spin axis and the thrust line.
  let axis_angle_deg: number;
  if (axis_orientation === "parallel") axis_angle_deg = 0;
  else if (axis_orientation === "perpendicular") axis_angle_deg = 90;
  else axis_angle_deg = custom_angle_deg;

  const rawSin = Math.sin((axis_angle_deg * Math.PI) / 180);
  const rawCos = Math.cos((axis_angle_deg * Math.PI) / 180);
  // Snap floating-point residue (sin(180°) ≈ 1e-16) so parallel cases stay exact.
  const sinT = Math.abs(rawSin) < 1e-12 ? 0 : Math.abs(rawSin);
  const cosT = Math.abs(rawCos) < 1e-12 ? 0 : rawCos;
  const inPlane = thrust_g * sinT;
  const axial = thrust_g * cosT;

  const components = (phi: number) => {
    const radial = spin_g + inPlane * Math.cos(phi);
    const tangential = inPlane * Math.sin(phi);
    const lateral = Math.sqrt(tangential * tangential + axial * axial);
    return { radial, lateral };
  };
  const magnitudeAt = (phi: number) => {
    const { radial, lateral } = components(phi);
    return Math.sqrt(radial * radial + lateral * lateral);
  };
  const tiltAt = (phi: number) => {
    const { radial, lateral } = components(phi);
    return (Math.atan2(lateral, radial) * 180) / Math.PI;
  };

  // The magnitude extremes sit at φ = 0 and φ = 180°. Tilt has no tidy
  // closed form for a general θ, so sample the rim at 0.5° steps.
  const resultant_max_g = magnitudeAt(0);
  const resultant_min_g = magnitudeAt(Math.PI);
  let worstPhi = 0;
  let abs_tilt = tiltAt(0);
  for (let i = 1; i < 720; i++) {
    const phi = (i * Math.PI) / 360;
    const tilt = tiltAt(phi);
    if (tilt > abs_tilt + 1e-9) {
      abs_tilt = tilt;
      worstPhi = phi;
    }
  }
  const resultant_g = magnitudeAt(worstPhi);
  // Angle between the spin vector and the thrust vector at that point.
  const vector_angle_deg = thrust_g > 0
    ? (Math.acos(Math.max(-1, Math.min(1, sinT * Math.cos(worstPhi)))) * 180) / Math.PI
    : 0;

  // Walking difficulty (1–10)
  let walking_difficulty: number;
  if (abs_tilt < 5) walking_difficulty = 1;
  else if (abs_tilt < 10) walking_difficulty = 2;
  else if (abs_tilt < 15) walking_difficulty = 3;
  else if (abs_tilt < 20) walking_difficulty = 4;
  else if (abs_tilt < 25) walking_difficulty = 5;
  else if (abs_tilt < 30) walking_difficulty = 6;
  else if (abs_tilt < 35) walking_difficulty = 7;
  else if (abs_tilt < 40) walking_difficulty = 8;
  else if (abs_tilt < 45) walking_difficulty = 9;
  else walking_difficulty = 10;

  // Architectural impact from tilt table
  const tiltEntry = TILT_TABLE.find((e) => abs_tilt < e.maxAngle);
  const architectural_impact = tiltEntry?.architecturalImpact ?? "Complete reorientation required.";

  return {
    resultant_g,
    resultant_min_g,
    resultant_max_g,
    vector_angle_deg,
    tilt_angle_deg: abs_tilt,
    walking_difficulty,
    architectural_impact,
  };
}

// ─── Orbital / Surface ──────────────────────────────────────────────

export function calculateOrbitalGravity(input: OrbitalInput): OrbitalOutput {
  const { parent_mass_kg, parent_radius_km, altitude_km, habitat_size_km } = input;

  const parent_radius_m = parent_radius_km * 1000;
  const altitude_m = altitude_km * 1000;
  const orbital_radius_m = parent_radius_m + altitude_m;

  // Surface gravity
  const surface_g_ms2 = (G * parent_mass_kg) / (parent_radius_m * parent_radius_m);
  const surface_g = surface_g_ms2 / EARTH_G;

  // Gravity at altitude
  const altitude_g_ms2 = (G * parent_mass_kg) / (orbital_radius_m * orbital_radius_m);
  const altitude_g = altitude_g_ms2 / EARTH_G;

  // Orbital velocity
  const orbital_velocity_ms = Math.sqrt((G * parent_mass_kg) / orbital_radius_m);

  // Orbital period
  const orbital_period_s = 2 * Math.PI * Math.sqrt(
    Math.pow(orbital_radius_m, 3) / (G * parent_mass_kg)
  );

  // Tidal gradient
  const habitat_size_m = habitat_size_km * 1000;
  const tidal_gradient_ms2 = (2 * G * parent_mass_kg * habitat_size_m) /
    Math.pow(orbital_radius_m, 3);
  const tidal_gradient_micro_g = (tidal_gradient_ms2 / EARTH_G) * 1e6;

  // Escape velocity
  const escape_velocity_ms = Math.sqrt((2 * G * parent_mass_kg) / orbital_radius_m);

  return {
    surface_g,
    altitude_g,
    orbital_velocity_kms: orbital_velocity_ms / 1000,
    orbital_period_hours: orbital_period_s / 3600,
    orbital_period_days: orbital_period_s / 86400,
    tidal_gradient_micro_g_per_km: habitat_size_km > 0 ? tidal_gradient_micro_g : 0,
    escape_velocity_kms: escape_velocity_ms / 1000,
    is_microgravity: altitude_km > 0 && altitude_g < 0.001,
  };
}

// ─── Artificial Gravity (One Big Lie) ───────────────────────────────

export function calculateArtificialGravity(input: ArtificialInput): ArtificialOutput {
  const { desired_g, direction, coverage, failure_mode, technobabble_level } = input;

  // Track physics violations
  const violations: string[] = [
    PHYSICS_VIOLATIONS.graviton_generation,
    PHYSICS_VIOLATIONS.energy_requirement,
    PHYSICS_VIOLATIONS.directionality,
  ];

  if (direction !== "floor") {
    violations.push(PHYSICS_VIOLATIONS.conservation);
  }
  if (coverage === "zoned" || coverage === "localized") {
    violations.push("Gravity fields cannot have sharp spatial boundaries");
  }
  if (failure_mode === "flickering") {
    violations.push(PHYSICS_VIOLATIONS.variable_field);
  }

  // Energy handwave
  let energy_handwave: string;
  if (desired_g < 0.5) energy_handwave = "Substantial but conceivably advanced";
  else if (desired_g < 2.0) energy_handwave = "Implausibly high";
  else energy_handwave = "Civilization-defining";

  // Technobabble generation
  const templates = TECHNOBABBLE[technobabble_level];
  const technobabble_text = templates.length > 0
    ? templates[Math.floor(Math.random() * templates.length)]
    : "";

  // Consistency warnings
  const warnings: string[] = [];
  if (desired_g > 3) {
    warnings.push("Gravity above 3g is physiologically dangerous for humans even short-term");
  }
  if (direction === "variable") {
    warnings.push("Variable gravity direction requires inhabitants to adapt to shifting orientation");
  }

  return {
    effective_g: desired_g,
    physics_violations: violations,
    energy_handwave,
    technobabble_text,
    consistency_warnings: warnings,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

export function classifyGravity(g: number): HabitabilityStatus {
  const entry = GRAVITY_CLASSIFICATIONS.find((c) => g < c.maxG);
  return entry?.status ?? "extreme_gravity";
}

export function getGravityLabel(g: number): string {
  const entry = GRAVITY_CLASSIFICATIONS.find((c) => g < c.maxG);
  return entry?.label ?? "Extreme Gravity";
}

export function formatG(value: number): string {
  if (value < 0.001) return value.toExponential(2) + " g";
  if (value < 0.1) return value.toFixed(3) + " g";
  if (value < 10) return value.toFixed(2) + " g";
  return value.toFixed(1) + " g";
}

export function formatVelocity(kms: number): string {
  if (kms < 1) return (kms * 1000).toFixed(1) + " m/s";
  if (kms < 1000) return kms.toFixed(1) + " km/s";
  return (kms / C * 1000).toFixed(4) + " c";
}

export function formatDuration(days: number): string {
  if (days < 1) return (days * 24).toFixed(1) + " hours";
  if (days < 365) return days.toFixed(1) + " days";
  return (days / 365.25).toFixed(2) + " years";
}

export function formatPeriod(hours: number): string {
  if (hours < 1) return (hours * 60).toFixed(1) + " minutes";
  if (hours < 48) return hours.toFixed(1) + " hours";
  return (hours / 24).toFixed(2) + " days";
}

/** Get the effective g for the currently active mode. */
export function getEffectiveG(
  formState: GravitasFormState,
  results: {
    spin?: SpinGravityOutput;
    thrust?: ThrustGravityOutput;
    combined?: CombinedVectorOutput;
    orbital?: OrbitalOutput;
    artificial?: ArtificialOutput;
  }
): number {
  switch (formState.activeMode) {
    case "spin": return results.spin?.floor_g ?? 0;
    case "thrust": return results.thrust?.effective_g ?? 0;
    case "combined": return results.combined?.resultant_g ?? 0;
    case "orbital": return formState.orbital.altitude_km > 0
      ? (results.orbital?.altitude_g ?? 0)
      : (results.orbital?.surface_g ?? 0);
    case "artificial": return results.artificial?.effective_g ?? 0;
    default: return 0;
  }
}

/** Build text for clipboard copy of results. */
export function buildCopyText(
  mode: CalculationMode,
  results: {
    spin?: SpinGravityOutput;
    thrust?: ThrustGravityOutput;
    combined?: CombinedVectorOutput;
    orbital?: OrbitalOutput;
    artificial?: ArtificialOutput;
  }
): string {
  const lines: string[] = ["Gravitas Results", ""];

  if (mode === "spin" && results.spin) {
    const r = results.spin;
    lines.push(`Mode: Spin Gravity`);
    lines.push(`Floor Gravity: ${formatG(r.floor_g)}`);
    lines.push(`Head Gravity: ${formatG(r.head_g)}`);
    lines.push(`Gradient: ${r.gradient_percent.toFixed(1)}%`);
    lines.push(`Tangential Velocity: ${r.tangential_velocity_ms.toFixed(1)} m/s`);
    lines.push(`Coriolis: ${r.coriolis_intensity}`);
    lines.push(`Comfortable: ${r.is_comfortable ? "Yes" : "No"}`);
  } else if (mode === "thrust" && results.thrust) {
    const r = results.thrust;
    lines.push(`Mode: Thrust Gravity`);
    lines.push(`Effective Gravity: ${formatG(r.effective_g)}`);
    lines.push(`Trip Duration: ${formatDuration(r.trip_duration_days)}`);
    lines.push(`Delta-V: ${r.delta_v_kms.toFixed(1)} km/s`);
    lines.push(`Peak Velocity: ${r.peak_velocity_kms.toFixed(1)} km/s (${(r.peak_velocity_c * 100).toFixed(4)}% c)`);
    if (r.time_dilation_factor > 1.001) {
      lines.push(`Time Dilation: γ = ${r.time_dilation_factor.toFixed(4)}`);
    }
  } else if (mode === "combined" && results.combined) {
    const r = results.combined;
    lines.push(`Mode: Combined Vector`);
    lines.push(`Resultant Gravity: ${formatG(r.resultant_g)} (range around rim ${formatG(r.resultant_min_g)} to ${formatG(r.resultant_max_g)})`);
    lines.push(`Tilt Angle: ${r.tilt_angle_deg.toFixed(1)}°`);
    lines.push(`Walking Difficulty: ${r.walking_difficulty}/10`);
    lines.push(`Architectural Impact: ${r.architectural_impact}`);
  } else if (mode === "orbital" && results.orbital) {
    const r = results.orbital;
    lines.push(`Mode: Orbital / Surface`);
    lines.push(`Surface Gravity: ${formatG(r.surface_g)}`);
    if (r.altitude_g !== r.surface_g) {
      lines.push(`Gravity at Altitude: ${formatG(r.altitude_g)}`);
    }
    lines.push(`Orbital Velocity: ${r.orbital_velocity_kms.toFixed(2)} km/s`);
    lines.push(`Orbital Period: ${formatPeriod(r.orbital_period_hours)}`);
    lines.push(`Escape Velocity: ${r.escape_velocity_kms.toFixed(2)} km/s`);
  } else if (mode === "artificial" && results.artificial) {
    const r = results.artificial;
    lines.push(`Mode: Artificial Gravity (One Big Lie)`);
    lines.push(`Effective Gravity: ${formatG(r.effective_g)}`);
    lines.push(`Energy Handwave: ${r.energy_handwave}`);
    if (r.technobabble_text) lines.push(`Technobabble: ${r.technobabble_text}`);
  }

  return lines.join("\n");
}
