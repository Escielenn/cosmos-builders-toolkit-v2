/** Mythos (Xenomythology Framework Builder) worksheet shape and codec (moved from XenomythologyFrameworkBuilder.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

// Types for form state
export interface PressureAnalysisEntry {
  pressure: string;
  cognitiveChallenge: string;
  symbolicResolution: string;
  archetypeStructure: string;
  archetypeForm: string;
}

export interface ArchetypeEntry {
  name: string;
  evolutionaryOrigin: string;
  cognitiveFunction: string;
  symbolicForm: string;
  narrativeRole: string;
}

export interface DeityEntry {
  archetypeName: string;
  divineStatus: string;
  domain: string;
  physicalRelationship: string;
  interaction: string;
}

export interface SymbolicEntity {
  entityName: string;
  symbolicImportance: string;
  archetypeAssociation: string;
  mythicRole: string;
}

export interface FormState {
  // Section 1: Species Biology & Psychology
  sensoryArchitecture: {
    primaryModalities: string[];
    primaryModalitiesOther?: string;
    integrationStyle: string;
    sensoryRange: string;
    cognitionImpact: string;
  };
  physicalForm: {
    bodyPlan: string;
    bodyPlanOther?: string;
    movementMode: string;
    movementModeOther?: string;
    limbArrangement: string;
    lifespanCategory: string;
    developmentalStages: string;
    reproductionStrategy: string;
    reproductionStrategyOther?: string;
    offspringInvestment: string;
  };
  cognitiveArchitecture: {
    consciousnessType: string;
    consciousnessTypeOther?: string;
    memoryArchitecture: string[];
    memoryArchitectureOther?: string;
    cognitiveStrengths: string[];
    emotionalRange: string;
    selfAwarenessLevel: string;
    cognitiveChallenges: string;
  };

  // Section 2: Environmental Context
  planetaryConditions: {
    planetType: string;
    planetTypeOther?: string;
    atmosphericComposition: string;
    dayNightCycle: string;
    seasonalVariation: string;
    stellarEnvironment: string;
    stellarEnvironmentOther?: string;
    skyAppearance: string;
    environmentalVolatility: string;
    geographicDiversity: string;
  };
  evolutionaryPressures: {
    survivalChallenges: string[];
    survivalChallengesOther?: string;
    socialStructureEvolution: string;
    adaptiveBreakthrough: string;
  };
  existentialParameters: {
    mortalitySalience: string;
    deathPhenomenology: string;
    generationalContinuity: string;
    timeExperience: string;
    temporalHorizon: string;
  };

  // Section 3: Archetypal Foundations
  pressureAnalysis: PressureAnalysisEntry[];
  novelArchetypes: {
    metamorphicArchetype: string;
    hiveMindArchetype: string;
    multiParentalArchetype: string;
    longevityArchetype: string;
    binaryStarArchetype: string;
    tidallyLockedArchetype: string;
    oceanWorldArchetype: string;
    noSkyArchetype: string;
  };
  archetypePantheon: ArchetypeEntry[];

  // Section 4: Mythic Expression
  creationNarrative: {
    primordialArchetypes: string[];
    primordialState: string;
    creativeAct: string;
    firstCreatedThing: string;
    fullNarrative: string;
  };
  cosmologicalStructure: {
    dimensionalStructure: string;
    primaryDivision: string;
    sacredGeography: string;
  };
  divineConceptualization: {
    divineOntology: string;
    deities: DeityEntry[];
  };
  mythicCycles: {
    greatCrisis: string;
    crisisArchetypes: string[];
    crisisResolution: string;
    crisisExplanation: string;
    currentOrder: string;
    unresolvedTension: string;
  };
  symbolicCatalog: SymbolicEntity[];

  // Section 5: Religious/Ritual Practices
  ritualStructure: {
    primaryFunctions: string[];
    sensoryModality: string;
    ritualTiming: string;
  };
  sacredSpecialists: {
    leadershipModel: string;
    specialistAbilities: string;
    identificationMethod: string;
    specialistDangers: string;
  };
  sacredSpaces: {
    whatMakesSacred: string;
    templeCharacteristics: string;
    pilgrimageTypes: string[];
    pilgrimagePurpose: string;
  };
  deathPractices: {
    consciousnessAtDeath: string;
    deathRituals: string;
    ancestorRelations: string;
    cosmicEschatology: string;
    endTimesNarrative: string;
  };

  // Section 6: Synthesis
  synthesis: {
    ethicalVirtues: string;
    ethicalTaboos: string;
    ethicalAmbiguous: string;
    artExpressions: string;
    scienceHarmony: string;
    scienceTension: string;
    scienceResolution: string[];
  };

  // Linked worksheets for cross-tool integration
  _linkedWorksheets?: {
    ecrWorksheetId?: string;
    lastSyncedAt?: string;
    species?: {
      worksheetId: string;
      speciesName: string;
      syncedAt: string;
    };
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  sensoryArchitecture: {
    primaryModalities: [],
    primaryModalitiesOther: "",
    integrationStyle: "",
    sensoryRange: "",
    cognitionImpact: "",
  },
  physicalForm: {
    bodyPlan: "",
    bodyPlanOther: "",
    movementMode: "",
    movementModeOther: "",
    limbArrangement: "",
    lifespanCategory: "",
    developmentalStages: "",
    reproductionStrategy: "",
    reproductionStrategyOther: "",
    offspringInvestment: "",
  },
  cognitiveArchitecture: {
    consciousnessType: "",
    consciousnessTypeOther: "",
    memoryArchitecture: [],
    memoryArchitectureOther: "",
    cognitiveStrengths: [],
    emotionalRange: "",
    selfAwarenessLevel: "",
    cognitiveChallenges: "",
  },
  planetaryConditions: {
    planetType: "",
    planetTypeOther: "",
    atmosphericComposition: "",
    dayNightCycle: "",
    seasonalVariation: "",
    stellarEnvironment: "",
    stellarEnvironmentOther: "",
    skyAppearance: "",
    environmentalVolatility: "",
    geographicDiversity: "",
  },
  evolutionaryPressures: {
    survivalChallenges: [],
    survivalChallengesOther: "",
    socialStructureEvolution: "",
    adaptiveBreakthrough: "",
  },
  existentialParameters: {
    mortalitySalience: "",
    deathPhenomenology: "",
    generationalContinuity: "",
    timeExperience: "",
    temporalHorizon: "",
  },
  pressureAnalysis: [],
  novelArchetypes: {
    metamorphicArchetype: "",
    hiveMindArchetype: "",
    multiParentalArchetype: "",
    longevityArchetype: "",
    binaryStarArchetype: "",
    tidallyLockedArchetype: "",
    oceanWorldArchetype: "",
    noSkyArchetype: "",
  },
  archetypePantheon: [],
  creationNarrative: {
    primordialArchetypes: [],
    primordialState: "",
    creativeAct: "",
    firstCreatedThing: "",
    fullNarrative: "",
  },
  cosmologicalStructure: {
    dimensionalStructure: "",
    primaryDivision: "",
    sacredGeography: "",
  },
  divineConceptualization: {
    divineOntology: "",
    deities: [],
  },
  mythicCycles: {
    greatCrisis: "",
    crisisArchetypes: [],
    crisisResolution: "",
    crisisExplanation: "",
    currentOrder: "",
    unresolvedTension: "",
  },
  symbolicCatalog: [],
  ritualStructure: {
    primaryFunctions: [],
    sensoryModality: "",
    ritualTiming: "",
  },
  sacredSpecialists: {
    leadershipModel: "",
    specialistAbilities: "",
    identificationMethod: "",
    specialistDangers: "",
  },
  sacredSpaces: {
    whatMakesSacred: "",
    templeCharacteristics: "",
    pilgrimageTypes: [],
    pilgrimagePurpose: "",
  },
  deathPractices: {
    consciousnessAtDeath: "",
    deathRituals: "",
    ancestorRelations: "",
    cosmicEschatology: "",
    endTimesNarrative: "",
  },
  synthesis: {
    ethicalVirtues: "",
    ethicalTaboos: "",
    ethicalAmbiguous: "",
    artExpressions: "",
    scienceHarmony: "",
    scienceTension: "",
    scienceResolution: [],
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "xenomythology-framework-builder";
export const LOCAL_STORAGE_KEY = "xenomythology-framework-builder";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
