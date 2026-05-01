// SENSORIUM, Alien Sensory System Designer
// Type definitions shared across data, calculations, and the tool page

import type { LinkedWorksheetRef } from "@/lib/worksheet-links-config";
import type { MoodboardImage } from "@/hooks/use-moodboard";

// ─── Modality Categories ─────────────────────────────────────────

export type ModalityCategory =
  | "electromagnetic"
  | "mechanical"
  | "chemical"
  | "magnetic-thermal"
  | "other";

// ─── Environmental Requirements ──────────────────────────────────

export type MediumType =
  | "terrestrial"
  | "aquatic"
  | "aerial"
  | "subsurface"
  | "vacuum-interface";

export interface ModalityRequirements {
  medium: MediumType[];
  atmosphereRequired: boolean;
  minPressure?: number; // atm, for sound propagation
  maxPressure?: number; // atm
  minTemp?: number; // Kelvin
  maxTemp?: number; // Kelvin
  liquidRequired?: boolean; // aquatic chemoreception
  conductiveMedium?: boolean; // electroreception
  magneticFieldRequired?: boolean; // magnetoreception
}

// ─── Evolution Info ──────────────────────────────────────────────

export type MetabolicCostTier = "low" | "medium" | "high" | "extreme";
export type EvolutionComplexity = "simple" | "moderate" | "complex" | "extreme";

export interface EvolutionInfo {
  metabolicCost: MetabolicCostTier;
  metabolicWeight: number; // low=0.05, medium=0.15, high=0.25, extreme=0.40
  complexity: EvolutionComplexity;
  evolutionTime: string; // e.g., "~50 million years"
  earthAnalogs: string[];
}

// ─── Worldbuilding Implications ──────────────────────────────────

export interface WorldbuildingImplications {
  communication: string;
  navigation: string;
  hunting: string;
  socialBehavior: string;
  art: string;
  architecture: string;
  technology: string;
  mythology: string;
}

// ─── Sensory Modality (single entry in database) ─────────────────

export interface SensoryModality {
  id: string;
  name: string;
  category: ModalityCategory;
  description: string;
  spectrumRange?: string; // e.g., "10-400nm", "20 Hz-20 kHz"
  requirements: ModalityRequirements;
  evolution: EvolutionInfo;
  worldbuilding: WorldbuildingImplications;
}

// ─── Derivation Results ──────────────────────────────────────────

export type DerivationStatus = "recommended" | "possible" | "implausible";

export interface DerivedModality {
  modality: SensoryModality;
  status: DerivationStatus;
  rationale: string;
  confidenceScore: number; // 0-100
}

// ─── Validation Results ──────────────────────────────────────────

export interface ModalityValidation {
  modalityId: string;
  plausible: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

export interface SenseConflict {
  a: string;
  b: string;
  reason: string;
}

export interface ValidationResult {
  overallPlausibility: number; // 0-100
  perModality: ModalityValidation[];
  warnings: string[];
  conflictingSenses: SenseConflict[];
}

// ─── Metabolic Budget ────────────────────────────────────────────

export interface MetabolicBudgetResult {
  totalCost: number;
  maxSustainable: number; // 1.0
  warningThreshold: number; // 0.8
  overBudget: boolean;
  perSense: { modalityId: string; name: string; cost: number }[];
}

// ─── Perception Gaps ─────────────────────────────────────────────

export interface PerceptionGap {
  speciesPerceives: string[];
  speciesBlind: string[];
  conflictPotential: string[];
}

// ─── Star Spectral Preset ────────────────────────────────────────

export type UVOutput = "extreme" | "high" | "moderate" | "low" | "negligible";

export interface SpectralPreset {
  id: string;
  label: string;
  temperature: number; // Kelvin
  peakWavelength: number; // nm (Wien's law)
  uvOutput: UVOutput;
  luminosity: number; // solar luminosities
}

// ─── Atmosphere Preset ───────────────────────────────────────────

export type OpacityLevel = "transparent" | "translucent" | "opaque";

export interface AtmospherePreset {
  id: string;
  label: string;
  hasAtmosphere: boolean;
  pressure: number; // atm
  opacity: OpacityLevel;
  composition: string; // descriptive
}

// ─── Environment Config (form input) ─────────────────────────────

export interface StarConfig {
  preset: string;
  temperature: number;
  peakWavelength: number;
  uvOutput: UVOutput;
  luminosity: number;
}

export interface AtmosphereConfig {
  preset: string;
  hasAtmosphere: boolean;
  pressure: number;
  opacity: OpacityLevel;
}

export type MagneticStrength = "weak" | "moderate" | "strong";
export type MagneticStability = "stable" | "variable" | "chaotic";
export type SeasonalVariation = "none" | "mild" | "extreme";
export type Conductivity = "none" | "low" | "medium" | "high";

export interface MediumConfig {
  type: MediumType;
  liquidType?: string;
  conductivity: Conductivity;
}

export interface MagneticFieldConfig {
  present: boolean;
  strength: MagneticStrength;
  stability: MagneticStability;
}

export interface LightingConfig {
  dayNightCycle: boolean;
  tidallyLocked: boolean;
  seasonalVariation: SeasonalVariation;
}

export interface EnvironmentConfig {
  star: StarConfig;
  atmosphere: AtmosphereConfig;
  medium: MediumConfig;
  magneticField: MagneticFieldConfig;
  lighting: LightingConfig;
}

// ─── FormState (persisted to worksheet JSONB) ────────────────────

export interface SensoriumFormState {
  speciesName: string;
  mode: "derive" | "validate";
  environment: EnvironmentConfig;

  // Derive mode: algorithm results (recomputed via useMemo, stored for export)
  derivedResults: DerivedModality[];

  // Validate mode: user's manual selection before validation
  selectedModalities: string[];
  validationResult: ValidationResult | null;

  // Final curated selection (both modes, user's accepted senses)
  finalSelection: string[];

  // Narrative sections
  perceptionProfile: {
    dominantSense: string;
    sensoryHierarchy: string;
    perceptionNotes: string;
  };
  worldbuildingNotes: {
    communicationNotes: string;
    artNotes: string;
    architectureNotes: string;
    technologyNotes: string;
    mythologyNotes: string;
    socialNotes: string;
  };
  perceptionGapNotes: {
    speciesPerceives: string;
    speciesBlind: string;
    conflictPotential: string;
  };
  synthesis: {
    narrativeSummary: string;
    storyHooks: string;
    integrationNotes: string;
  };

  // Environment fine-tuning sliders (0-10, supplement presets)
  environmentSliders?: {
    atmosphericDensity: number;
    lightLevel: number;
    temperatureRange: number;
    conductivity: number;
  };

  // Worksheet linking
  _linkedWorksheets?: {
    starSystem?: LinkedWorksheetRef;
    planet?: LinkedWorksheetRef;
    evoBio?: LinkedWorksheetRef;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}
