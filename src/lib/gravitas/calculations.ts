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
    const burn_duration = 86400 * 7;
    const burn_distance = 0.5 * accel_ms2 * burn_duration * burn_duration;
    const coast_distance = Math.max(0, distance_m - 2 * burn_distance);
    const coast_velocity = accel_ms2 * burn_duration;
    const coast_duration = coast_velocity > 0 ? coast_distance / coast_velocity : 0;

    trip_duration_s = 2 * burn_duration + coast_duration;
    peak_velocity_ms = coast_velocity;
    delta_v_ms = coast_velocity * 2;
  }

  // Cap peak velocity at 0.99c for sanity
  peak_velocity_ms = Math.min(peak_velocity_ms, C * 0.99);
  const peak_velocity_c = peak_velocity_ms / C;

  // Relativistic corrections
  let time_dilation_factor = 1;
  let earth_time_years = trip_duration_s / (365.25 * 86400);
  let ship_time_years = earth_time_years;

  if (include_relativity && peak_velocity_c > 0.01) {
    const v2c2 = peak_velocity_c * peak_velocity_c;
    time_dilation_factor = 1 / Math.sqrt(1 - v2c2);
    ship_time_years = earth_time_years / time_dilation_factor;
  }

  return {
    effective_g: acceleration_g,
    trip_duration_days: trip_duration_s / 86400,
    delta_v_kms: delta_v_ms / 1000,
    peak_velocity_kms: peak_velocity_ms / 1000,
    peak_velocity_c,
    time_dilation_factor,
    ship_time_years,
    earth_time_years,
  };
}

// ─── Combined Vector ────────────────────────────────────────────────

export function calculateCombinedVector(input: CombinedVectorInput): CombinedVectorOutput {
  const { spin_g, thrust_g, axis_orientation, custom_angle_deg } = input;

  // Determine angle between vectors
  let angle_deg: number;
  if (axis_orientation === "parallel") angle_deg = 0;
  else if (axis_orientation === "perpendicular") angle_deg = 90;
  else angle_deg = custom_angle_deg;

  const angle_rad = (angle_deg * Math.PI) / 180;

  // Vector addition
  const resultant_g = Math.sqrt(
    spin_g * spin_g +
    thrust_g * thrust_g +
    2 * spin_g * thrust_g * Math.cos(angle_rad)
  );

  // Tilt angle (from spin "down" toward thrust "down")
  const tilt_angle_deg = (Math.atan2(thrust_g * Math.sin(angle_rad), spin_g + thrust_g * Math.cos(angle_rad)) * 180) / Math.PI;
  const abs_tilt = Math.abs(tilt_angle_deg);

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
    lines.push(`Resultant Gravity: ${formatG(r.resultant_g)}`);
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
