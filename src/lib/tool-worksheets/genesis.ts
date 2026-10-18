/** Planetary Profile worksheet shape and codec (moved from PlanetaryProfile.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export interface ConsistencyCheck {
  starGravityConsistent: boolean;
  atmosphereTempConsistent: boolean;
  waterTempConsistent: boolean;
  gravityBiologyConsistent: boolean;
  pressuresEnvironmentConsistent: boolean;
  consistencyNotes: string;
}

export interface NarrativeIntegration {
  environmentAsCharacter: string;
  conflictSources: string;
  plotOpportunities: string;
  sensoryDetails: string;
  uniqueMoments: string;
}

export interface ThreePressures {
  survivalPressure: string;
  survivalManifestations: string;
  socialPressure: string;
  socialManifestations: string;
  psychologicalPressure: string;
  psychologicalManifestations: string;
  pressureInteractions: string;
}

export interface GeologicalFeatures {
  tectonicActivity: string;
  volcanism: string;
  mountainRanges: string;
  uniqueFormations: string;
  naturalResources: string;
  geologicalHazards: string;
}

export interface HabitabilityAssessment {
  habitabilityTier: string;
  tierJustification: string;
  requiredAdaptations: string[];
  adaptationNotes: string;
}

export interface TemperatureProfile {
  averageSurfaceTemp: string;
  temperatureRange: string;
  climateZones: string;
  temperatureNotes: string;
}

export interface Hydrosphere {
  waterPresence: string;
  oceanCoverage: string;
  waterComposition: string;
  icePresence: string;
  hydrosphereNotes: string;
}

export interface AtmosphericComposition {
  primaryGases: string[];
  secondaryGases: string[];
  atmosphericPressure: string;
  greenhouseEffect: string;
  skyColor: string;
  weatherPatterns: string;
}

export interface PhysicalCharacteristics {
  planetaryMass: string;
  surfaceGravity: string;
  planetaryRadius: string;
  dayLength: string;
  axialTilt: string;
  seasonalVariation: string;
}

// Types for form state
export interface StellarEnvironment {
  starType: string;
  starTypeNotes: string;
  luminosity: string;
  habitableZonePosition: string;
  orbitalPeriod: string;
  orbitalEccentricity: string;
  tidalLocking: string;
  tidalLockingNotes: string;
}

export interface FormState {
  stellarEnvironment: StellarEnvironment;
  physicalCharacteristics: PhysicalCharacteristics;
  atmosphericComposition: AtmosphericComposition;
  hydrosphere: Hydrosphere;
  temperatureProfile: TemperatureProfile;
  habitability: HabitabilityAssessment;
  geological: GeologicalFeatures;
  threePressures: ThreePressures;
  narrative: NarrativeIntegration;
  consistencyCheck: ConsistencyCheck;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  stellarEnvironment: {
    starType: "",
    starTypeNotes: "",
    luminosity: "",
    habitableZonePosition: "",
    orbitalPeriod: "",
    orbitalEccentricity: "",
    tidalLocking: "",
    tidalLockingNotes: "",
  },
  physicalCharacteristics: {
    planetaryMass: "",
    surfaceGravity: "",
    planetaryRadius: "",
    dayLength: "",
    axialTilt: "",
    seasonalVariation: "",
  },
  atmosphericComposition: {
    primaryGases: [],
    secondaryGases: [],
    atmosphericPressure: "",
    greenhouseEffect: "",
    skyColor: "",
    weatherPatterns: "",
  },
  hydrosphere: {
    waterPresence: "",
    oceanCoverage: "",
    waterComposition: "",
    icePresence: "",
    hydrosphereNotes: "",
  },
  temperatureProfile: {
    averageSurfaceTemp: "",
    temperatureRange: "",
    climateZones: "",
    temperatureNotes: "",
  },
  habitability: {
    habitabilityTier: "",
    tierJustification: "",
    requiredAdaptations: [],
    adaptationNotes: "",
  },
  geological: {
    tectonicActivity: "",
    volcanism: "",
    mountainRanges: "",
    uniqueFormations: "",
    naturalResources: "",
    geologicalHazards: "",
  },
  threePressures: {
    survivalPressure: "",
    survivalManifestations: "",
    socialPressure: "",
    socialManifestations: "",
    psychologicalPressure: "",
    psychologicalManifestations: "",
    pressureInteractions: "",
  },
  narrative: {
    environmentAsCharacter: "",
    conflictSources: "",
    plotOpportunities: "",
    sensoryDetails: "",
    uniqueMoments: "",
  },
  consistencyCheck: {
    starGravityConsistent: false,
    atmosphereTempConsistent: false,
    waterTempConsistent: false,
    gravityBiologyConsistent: false,
    pressuresEnvironmentConsistent: false,
    consistencyNotes: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "planetary-profile";
export const LOCAL_STORAGE_KEY = "planetary-profile";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
