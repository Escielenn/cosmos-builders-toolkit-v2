/** Phylo worksheet shape and codec (moved from EvolutionaryBiology.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { LinkedWorksheetRef } from "@/lib/worksheet-links-config";
import { mergeCodec } from "@/lib/tool-worksheet";

export interface VestigialTraitEntry {
  trait: string;
  ancestralFunction: string;
  currentState: string;
}

export interface LifeStageEntry {
  stage: string;
  duration: string;
  characteristics: string;
}

export interface SensoryOrganEntry {
  sense: string;
  location: string;
  capabilities: string;
}

export interface LimbEntry {
  type: string;
  count: string;
  function: string;
}

// Types for form state
export interface AdaptationEntry {
  trait: string;
  selectivePressure: string;
  tradeoff: string;
}

export interface FormState {
  // Species Identity
  speciesName: string;

  // Section 1: Foundations
  foundations: {
    primarySurvivalPressures: string[];
    extremophileInspiration: string;
    survivalPressuresNotes: string;
  };

  // Section 2: Biochemistry & Metabolism
  biochemistry: {
    biochemicalBasis: string;
    solvent: string;
    energySource: string;
    metabolicRate: string;
    respirationType: string;
    wasteProducts: string;
    temperatureRange: { min: string; max: string; optimal: string };
    biochemistryNotes: string;
  };

  // Section 3: Evolutionary Adaptations
  adaptations: {
    keyAdaptations: AdaptationEntry[];
    convergentEvolution: string;
    uniqueAdaptations: string;
    adaptationsNotes: string;
  };

  // Section 4: Body Plan & Morphology
  bodyPlan: {
    symmetry: string;
    bodySegments: string;
    limbs: LimbEntry[];
    sizeRange: { min: string; max: string };
    integument: string;
    coloration: string;
    colorationFunction: string;
    internalStructure: string;
    bodyPlanNotes: string;
  };

  // Section 5: Sensory Systems
  sensory: {
    primarySenses: string[];
    sensoryOrgans: SensoryOrganEntry[];
    blindSpots: string;
    environmentalTuning: string;
    sensoryNotes: string;
  };

  // Section 6: Reproduction & Life Cycle
  reproduction: {
    reproductionMode: string;
    matingSystem: string;
    fertilizationType: string;
    gestationType: string;
    offspringCount: string;
    parentalCare: string;
    lifeStages: LifeStageEntry[];
    lifespan: string;
    senescence: string;
    reproductionNotes: string;
  };

  // Section 7: Social Evolution & Structure
  social: {
    groupSize: string;
    socialStructure: string;
    hierarchyType: string;
    cooperationMechanisms: string[];
    conflictResolution: string;
    kinRecognition: string;
    territoriality: string;
    socialNotes: string;
  };

  // Section 8: Intelligence & Cognition
  cognition: {
    brainAnalog: string;
    cognitionType: string;
    problemSolving: string;
    memoryType: string;
    learningMechanisms: string[];
    toolUse: string;
    abstractThinking: string;
    cognitionNotes: string;
  };

  // Section 9: Communication Biology
  communication: {
    primaryChannel: string;
    secondaryChannels: string[];
    signalRange: string;
    informationCapacity: string;
    deception: string;
    culturalTransmission: string;
    communicationNotes: string;
  };

  // Section 10: Psychology from Biology
  psychology: {
    emotionAnalogs: string[];
    motivationalDrives: string[];
    fearResponses: string;
    pleasureResponses: string;
    stressResponse: string;
    curiosityLevel: string;
    psychologyNotes: string;
  };

  // Section 11: Vestigial & Transitional Traits
  vestigial: {
    vestigialTraits: VestigialTraitEntry[];
    transitionalFeatures: string;
    evolutionaryHistory: string;
    vestigialNotes: string;
  };

  // Section 12: Non-Human Viewpoint Test
  viewpointTest: {
    alienPerceptionDifferences: string;
    humanAssumptionsAvoided: string[];
    uniqueWorldview: string;
    viewpointNotes: string;
  };

  // Section 13: Integration & Consistency
  integration: {
    traitInteractions: string;
    ecologicalNiche: string;
    evolutionaryPlausibility: string;
    potentialContradictions: string;
    integrationNotes: string;
  };

  // Worksheet linking
  _linkedWorksheets?: {
    planet?: LinkedWorksheetRef;
    ecr?: LinkedWorksheetRef;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  speciesName: "",
  foundations: {
    primarySurvivalPressures: [],
    extremophileInspiration: "",
    survivalPressuresNotes: "",
  },
  biochemistry: {
    biochemicalBasis: "",
    solvent: "",
    energySource: "",
    metabolicRate: "",
    respirationType: "",
    wasteProducts: "",
    temperatureRange: { min: "", max: "", optimal: "" },
    biochemistryNotes: "",
  },
  adaptations: {
    keyAdaptations: [],
    convergentEvolution: "",
    uniqueAdaptations: "",
    adaptationsNotes: "",
  },
  bodyPlan: {
    symmetry: "",
    bodySegments: "",
    limbs: [],
    sizeRange: { min: "", max: "" },
    integument: "",
    coloration: "",
    colorationFunction: "",
    internalStructure: "",
    bodyPlanNotes: "",
  },
  sensory: {
    primarySenses: [],
    sensoryOrgans: [],
    blindSpots: "",
    environmentalTuning: "",
    sensoryNotes: "",
  },
  reproduction: {
    reproductionMode: "",
    matingSystem: "",
    fertilizationType: "",
    gestationType: "",
    offspringCount: "",
    parentalCare: "",
    lifeStages: [],
    lifespan: "",
    senescence: "",
    reproductionNotes: "",
  },
  social: {
    groupSize: "",
    socialStructure: "",
    hierarchyType: "",
    cooperationMechanisms: [],
    conflictResolution: "",
    kinRecognition: "",
    territoriality: "",
    socialNotes: "",
  },
  cognition: {
    brainAnalog: "",
    cognitionType: "",
    problemSolving: "",
    memoryType: "",
    learningMechanisms: [],
    toolUse: "",
    abstractThinking: "",
    cognitionNotes: "",
  },
  communication: {
    primaryChannel: "",
    secondaryChannels: [],
    signalRange: "",
    informationCapacity: "",
    deception: "",
    culturalTransmission: "",
    communicationNotes: "",
  },
  psychology: {
    emotionAnalogs: [],
    motivationalDrives: [],
    fearResponses: "",
    pleasureResponses: "",
    stressResponse: "",
    curiosityLevel: "",
    psychologyNotes: "",
  },
  vestigial: {
    vestigialTraits: [],
    transitionalFeatures: "",
    evolutionaryHistory: "",
    vestigialNotes: "",
  },
  viewpointTest: {
    alienPerceptionDifferences: "",
    humanAssumptionsAvoided: [],
    uniqueWorldview: "",
    viewpointNotes: "",
  },
  integration: {
    traitInteractions: "",
    ecologicalNiche: "",
    evolutionaryPlausibility: "",
    potentialContradictions: "",
    integrationNotes: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "evolutionary-biology";
export const LOCAL_STORAGE_KEY = "evolutionary-biology-local";

/** Rows store the form as-is; older rows gain any missing top-level keys from the defaults (as before). */
export const codec = mergeCodec(initialFormState);
