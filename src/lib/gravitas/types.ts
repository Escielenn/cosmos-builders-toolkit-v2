// GRAVITAS — TypeScript interfaces for all calculation modes

// ─── Calculation & Realism Modes ────────────────────────────────────

export type CalculationMode = 'spin' | 'thrust' | 'combined' | 'orbital' | 'artificial';
export type RealismMode = 'hard_sf' | 'hybrid' | 'soft_sf';
export type PropulsionMode = 'brachistochrone' | 'constant' | 'coast_flip';
export type GravityDirection = 'floor' | 'ceiling' | 'walls' | 'variable';
export type GravityCoverage = 'shipwide' | 'zoned' | 'localized';
export type FailureMode = 'instant' | 'gradual' | 'flickering';
export type TechnobabbleLevel = 'none' | 'minimal' | 'moderate' | 'elaborate';
export type CoriolisIntensity = 'negligible' | 'mild' | 'moderate' | 'strong' | 'severe';
export type AxisOrientation = 'parallel' | 'perpendicular' | 'custom';

export type HabitabilityStatus =
  | 'microgravity'
  | 'milligravity'
  | 'low_gravity'
  | 'reduced_gravity'
  | 'earth_like'
  | 'high_gravity'
  | 'extreme_gravity';

// ─── Spin Gravity ───────────────────────────────────────────────────

export interface SpinGravityInput {
  radius_m: number;
  rotation_rpm: number;
  human_height_m: number;
}

export interface SpinGravityOutput {
  floor_g: number;
  head_g: number;
  gradient_g: number;
  gradient_percent: number;
  tangential_velocity_ms: number;
  coriolis_parameter: number;
  coriolis_intensity: CoriolisIntensity;
  is_comfortable: boolean;
  period_s: number;
}

// ─── Thrust Gravity ─────────────────────────────────────────────────

export interface ThrustGravityInput {
  acceleration_g: number;
  mission_distance_au: number;
  propulsion_mode: PropulsionMode;
  include_relativity: boolean;
}

export interface ThrustGravityOutput {
  effective_g: number;
  trip_duration_days: number;
  delta_v_kms: number;
  peak_velocity_kms: number;
  peak_velocity_c: number;
  time_dilation_factor: number;
  ship_time_years: number;
  earth_time_years: number;
}

// ─── Combined Vector ────────────────────────────────────────────────

export interface CombinedVectorInput {
  spin_g: number;
  thrust_g: number;
  axis_orientation: AxisOrientation;
  custom_angle_deg: number;
}

export interface CombinedVectorOutput {
  resultant_g: number;
  tilt_angle_deg: number;
  walking_difficulty: number; // 1–10
  architectural_impact: string;
}

// ─── Orbital / Surface ──────────────────────────────────────────────

export interface OrbitalInput {
  parent_mass_kg: number;
  parent_radius_km: number;
  altitude_km: number;
  habitat_size_km: number;
}

export interface OrbitalOutput {
  surface_g: number;
  altitude_g: number;
  orbital_velocity_kms: number;
  orbital_period_hours: number;
  orbital_period_days: number;
  tidal_gradient_micro_g_per_km: number;
  escape_velocity_kms: number;
  is_microgravity: boolean;
}

// ─── Artificial Gravity (One Big Lie) ───────────────────────────────

export interface ArtificialInput {
  desired_g: number;
  direction: GravityDirection;
  coverage: GravityCoverage;
  failure_mode: FailureMode;
  technobabble_level: TechnobabbleLevel;
}

export interface ArtificialOutput {
  effective_g: number;
  physics_violations: string[];
  energy_handwave: string;
  technobabble_text: string;
  consistency_warnings: string[];
}

// ─── Experiential Context ───────────────────────────────────────────

export interface GravityContext {
  effective_g: number;
  source: CalculationMode;
  spin_rpm?: number;
  tilt_angle_deg?: number;
  coriolis_intensity?: CoriolisIntensity;
  realism_mode: RealismMode;
}

// ─── Presets ────────────────────────────────────────────────────────

export interface SpinPreset {
  id: string;
  name: string;
  description: string;
  values: SpinGravityInput;
}

export interface OrbitalPreset {
  id: string;
  name: string;
  description: string;
  values: OrbitalInput;
}

export interface ThrustPreset {
  id: string;
  name: string;
  description: string;
  values: Partial<ThrustGravityInput>;
}

// ─── Output Options ─────────────────────────────────────────────────

export interface OutputOptions {
  showMovement: boolean;
  showFluids: boolean;
  showHealth: boolean;
  showArchitecture: boolean;
  showMythology: boolean;
  showNarrative: boolean;
  healthDurationMonths: number;
}

// ─── Form State ─────────────────────────────────────────────────────

export interface GravitasFormState {
  activeMode: CalculationMode;
  realismMode: RealismMode;
  outputOptions: OutputOptions;

  spin: SpinGravityInput;
  thrust: ThrustGravityInput;
  combined: CombinedVectorInput;
  orbital: OrbitalInput;
  artificial: ArtificialInput;

  cascade: {
    biology: string;
    psychology: string;
    culture: string;
    mythology: string;
  };
  storyNotes: {
    physicalExperience: string;
    dailyLife: string;
    architecture: string;
    culturalIdentity: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

// Moodboard image type (matches other tools)
export interface MoodboardImage {
  id: string;
  url: string;
  caption?: string;
}
