// GRAVITAS, Constants, presets, reference tables, section definitions

import type {
  SpinPreset,
  OrbitalPreset,
  ThrustPreset,
  CoriolisIntensity,
  HabitabilityStatus,
  GravitasFormState,
} from "./types";

// ─── Physical Constants ─────────────────────────────────────────────

export const G = 6.674e-11; // Gravitational constant (m³ kg⁻¹ s⁻²)
export const C = 299_792_458; // Speed of light (m/s)
export const AU_M = 1.496e11; // Astronomical Unit (meters)
export const EARTH_G = 9.81; // Earth surface gravity (m/s²)
export const LY_M = 9.461e15; // Light-year (meters)

// ─── Spin Presets ───────────────────────────────────────────────────

export const SPIN_PRESETS: SpinPreset[] = [
  {
    id: "oneill",
    name: "O'Neill Cylinder",
    description: "3.2 km radius, 0.5 RPM, ~1g",
    values: { radius_m: 3200, rotation_rpm: 0.5, human_height_m: 1.8 },
  },
  {
    id: "stanford",
    name: "Stanford Torus",
    description: "900m radius, 1 RPM, ~1g",
    values: { radius_m: 900, rotation_rpm: 1.0, human_height_m: 1.8 },
  },
  {
    id: "babylon5",
    name: "Babylon 5 Station",
    description: "400m radius, ~1.4 RPM, ~0.8g",
    values: { radius_m: 400, rotation_rpm: 1.4, human_height_m: 1.8 },
  },
  {
    id: "compact",
    name: "Compact Station",
    description: "100m radius, 3 RPM, ~1g",
    values: { radius_m: 100, rotation_rpm: 3.0, human_height_m: 1.8 },
  },
  {
    id: "freighter",
    name: "Cramped Freighter",
    description: "50m radius, 4.2 RPM, ~1g",
    values: { radius_m: 50, rotation_rpm: 4.2, human_height_m: 1.8 },
  },
];

// ─── Orbital Presets ────────────────────────────────────────────────

export const ORBITAL_PRESETS: OrbitalPreset[] = [
  {
    id: "earth",
    name: "Earth Surface",
    description: "1g baseline",
    values: { parent_mass_kg: 5.972e24, parent_radius_km: 6371, altitude_km: 0, habitat_size_km: 0 },
  },
  {
    id: "luna",
    name: "Luna Surface",
    description: "0.166g",
    values: { parent_mass_kg: 7.342e22, parent_radius_km: 1737, altitude_km: 0, habitat_size_km: 0 },
  },
  {
    id: "mars",
    name: "Mars Surface",
    description: "0.38g",
    values: { parent_mass_kg: 6.417e23, parent_radius_km: 3390, altitude_km: 0, habitat_size_km: 0 },
  },
  {
    id: "iss",
    name: "ISS Orbit",
    description: "Microgravity at ~400km altitude",
    values: { parent_mass_kg: 5.972e24, parent_radius_km: 6371, altitude_km: 400, habitat_size_km: 0.1 },
  },
  {
    id: "ceres",
    name: "Ceres Surface",
    description: "0.029g",
    values: { parent_mass_kg: 9.393e20, parent_radius_km: 473, altitude_km: 0, habitat_size_km: 0 },
  },
  {
    id: "titan",
    name: "Titan Surface",
    description: "Saturn's largest moon, 0.14g",
    values: { parent_mass_kg: 1.345e23, parent_radius_km: 2575, altitude_km: 0, habitat_size_km: 0 },
  },
  {
    id: "jupiter-orbit",
    name: "Jupiter High Orbit",
    description: "Station at 100,000 km altitude",
    values: { parent_mass_kg: 1.898e27, parent_radius_km: 69911, altitude_km: 100000, habitat_size_km: 1 },
  },
];

// ─── Thrust Presets ─────────────────────────────────────────────────

export const THRUST_PRESETS: ThrustPreset[] = [
  {
    id: "brachistochrone-1g",
    name: "1g Brachistochrone",
    description: "Constant 1g to midpoint, flip, decelerate",
    values: { acceleration_g: 1.0, propulsion_mode: "brachistochrone" },
  },
  {
    id: "gentle-cruise",
    name: "Gentle Cruise (0.3g)",
    description: "Comfortable long-duration thrust",
    values: { acceleration_g: 0.3, propulsion_mode: "brachistochrone" },
  },
  {
    id: "torch-ship",
    name: "Torch Ship (2g)",
    description: "High-performance military/courier vessel",
    values: { acceleration_g: 2.0, propulsion_mode: "brachistochrone" },
  },
  {
    id: "generation-ship",
    name: "Generation Ship (0.01g)",
    description: "Low continuous thrust over decades",
    values: { acceleration_g: 0.01, propulsion_mode: "constant" },
  },
  {
    id: "coast-flip",
    name: "Coast & Flip",
    description: "Burn/coast/burn with zero-g mid-journey",
    values: { acceleration_g: 1.0, propulsion_mode: "coast_flip" },
  },
];

// ─── Coriolis Effects Table ─────────────────────────────────────────

export interface CoriolisEntry {
  maxRpm: number;
  intensity: CoriolisIntensity;
  humanImpact: string;
}

export const CORIOLIS_TABLE: CoriolisEntry[] = [
  { maxRpm: 1, intensity: "negligible", humanImpact: "Undetectable" },
  { maxRpm: 2, intensity: "mild", humanImpact: "Subtle disorientation during fast movement" },
  { maxRpm: 4, intensity: "moderate", humanImpact: "Noticeable curve to thrown objects, vestibular adjustment required" },
  { maxRpm: 6, intensity: "strong", humanImpact: "Significant nausea risk, movement restrictions advised" },
  { maxRpm: Infinity, intensity: "severe", humanImpact: "Incapacitating for unadapted humans" },
];

// ─── Microgravity Classifications ───────────────────────────────────

export interface GravityClassification {
  maxG: number;
  status: HabitabilityStatus;
  label: string;
  practicalImpact: string;
}

export const GRAVITY_CLASSIFICATIONS: GravityClassification[] = [
  { maxG: 1e-6, status: "microgravity", label: "True Microgravity", practicalImpact: "Free-float environment" },
  { maxG: 1e-3, status: "milligravity", label: "Milli-gravity", practicalImpact: "Convection barely functions" },
  { maxG: 0.1, status: "low_gravity", label: "Low Gravity", practicalImpact: "Walking possible but strange" },
  { maxG: 0.5, status: "reduced_gravity", label: "Reduced Gravity", practicalImpact: "Human-tolerable long-term" },
  { maxG: 1.5, status: "earth_like", label: "Earth-like", practicalImpact: "Optimal human range" },
  { maxG: 3.0, status: "high_gravity", label: "High Gravity", practicalImpact: "Physiological strain" },
  { maxG: Infinity, status: "extreme_gravity", label: "Extreme Gravity", practicalImpact: "Lethal for prolonged exposure" },
];

// ─── Tilt Impact Table ──────────────────────────────────────────────

export interface TiltEntry {
  maxAngle: number;
  label: string;
  architecturalImpact: string;
}

export const TILT_TABLE: TiltEntry[] = [
  { maxAngle: 6, label: "Imperceptible", architecturalImpact: "Standard furniture and architecture." },
  { maxAngle: 14, label: "Noticeable lean", architecturalImpact: "Secure loose items. Minor adjustments." },
  { maxAngle: 27, label: "Significant slope", architecturalImpact: "Furniture must be anchored. Walking impaired." },
  { maxAngle: 45, label: "Severe angle", architecturalImpact: "Gimbaled decks recommended. Handrails essential." },
  { maxAngle: Infinity, label: "Complete reorientation", architecturalImpact: "Walls become floors during thrust." },
];

// ─── Technobabble Templates ─────────────────────────────────────────

export const TECHNOBABBLE = {
  none: [] as string[],
  minimal: [
    "Graviton field generators",
    "Mass-field emitters",
    "Gravity plating",
    "Inertial compensation arrays",
  ],
  moderate: [
    "Localized spacetime curvature via exotic matter containment",
    "Graviton flux induction through polarized field coils",
    "Controlled micro-singularity gravity wells with dynamic shielding",
    "Higgs field modulation through crystalline metamaterial substrates",
  ],
  elaborate: [
    "Higgs field manipulation through quantum-locked monopole arrays creating standing gravitational waves at tunable frequencies",
    "Casimir-effect harvesting drives coupled with topological spacetime folding to generate persistent gravitational gradients across hab sections",
    "Neutronium-lattice gravity emitters exploiting degenerate matter phase transitions to project controlled curvature fields through composite hull layers",
    "Trans-dimensional flux capacitors interfacing with the universal Higgs condensate to produce arbitrary gravitational potentials within a defined containment geometry",
  ],
};

// ─── Physics Violations (Artificial Gravity) ────────────────────────

export const PHYSICS_VIOLATIONS: Record<string, string> = {
  graviton_generation: "Gravitons (if they exist) cannot be generated or directed with known physics",
  energy_requirement: "Energy required to curve spacetime at this scale exceeds civilizational energy budgets",
  exotic_matter: "Requires negative-mass exotic matter, which has never been observed",
  conservation: "Violates conservation of momentum without reaction mass",
  directionality: "Gravity is always attractive and cannot be directed to specific surfaces",
  variable_field: "Gravity fields cannot be turned on/off without mass changes",
};

// ─── Section Definitions (for CollapsibleSections) ──────────────────

export const GRAVITAS_SECTIONS = [
  { id: "mode", label: "Calculation Mode", defaultOpen: true },
  { id: "parameters", label: "Parameters", defaultOpen: true },
  { id: "results", label: "Results", defaultOpen: true },
  { id: "experiential", label: "Experiential Output", defaultOpen: true },
  { id: "cascade", label: "Cascade Notes", defaultOpen: false },
  { id: "story", label: "Story Notes", defaultOpen: false },
] as const;

// ─── Initial Form State ─────────────────────────────────────────────

export const INITIAL_FORM_STATE: GravitasFormState = {
  activeMode: "spin",
  realismMode: "hybrid",
  outputOptions: {
    showMovement: true,
    showFluids: true,
    showHealth: true,
    showArchitecture: true,
    showMythology: true,
    showNarrative: true,
    healthDurationMonths: 12,
  },
  spin: {
    radius_m: 500,
    rotation_rpm: 1.0,
    human_height_m: 1.8,
  },
  thrust: {
    acceleration_g: 1.0,
    mission_distance_au: 1.0,
    propulsion_mode: "brachistochrone",
    include_relativity: false,
  },
  combined: {
    spin_g: 0.87,
    thrust_g: 0.5,
    axis_orientation: "perpendicular",
    custom_angle_deg: 90,
  },
  orbital: {
    parent_mass_kg: 5.972e24,
    parent_radius_km: 6371,
    altitude_km: 0,
    habitat_size_km: 0,
  },
  artificial: {
    desired_g: 1.0,
    direction: "floor",
    coverage: "shipwide",
    failure_mode: "gradual",
    technobabble_level: "moderate",
  },
  cascade: {
    biology: "",
    psychology: "",
    culture: "",
    mythology: "",
  },
  storyNotes: {
    physicalExperience: "",
    dailyLife: "",
    architecture: "",
    culturalIdentity: "",
  },
  generalNotes: "",
  moodboard: [],
};

// ─── Mode Labels ────────────────────────────────────────────────────

export const MODE_LABELS: Record<string, string> = {
  spin: "Spin",
  thrust: "Thrust",
  combined: "Combined",
  orbital: "Orbital",
  artificial: "Artificial",
};

export const MODE_DESCRIPTIONS: Record<string, string> = {
  spin: "Centrifugal pseudogravity in rotating habitats",
  thrust: "Apparent gravity from linear acceleration",
  combined: "Resultant gravity from spin + thrust vectors",
  orbital: "Gravity on planetary surfaces and in orbit",
  artificial: "Handwaved gravity (One Big Lie)",
};

export const REALISM_LABELS: Record<string, string> = {
  hard_sf: "Hard SF",
  hybrid: "Hybrid",
  soft_sf: "Soft SF",
};

export const REALISM_DESCRIPTIONS: Record<string, string> = {
  hard_sf: "Physics-only solutions. No handwaving permitted.",
  hybrid: "Real physics baseline with One Big Lie permitted.",
  soft_sf: "Specify outcomes freely. Optional technobabble.",
};
