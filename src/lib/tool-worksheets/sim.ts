/** Species Interaction Matrix worksheet shape and codec (moved from SpeciesInteractionMatrix.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export const createEmptySpecies = (): Species => ({
  id: crypto.randomUUID(),
  name: "",
  shortDescription: "",
  homeworld: "",
  physicalTraits: "",
  culturalTraits: "",
});

export interface SpeciesPair {
  speciesAId: string;
  speciesBId: string;
  overallRelationship: string;
  environmentCompatibility: string;
  biologyCompatibility: string;
  reproductionCompatibility: string;
  lifespanDifference: string;
  physicalNotes: string;
  languageStatus: string;
  perceptionOverlap: string;
  nonverbalUnderstanding: string;
  culturalConceptGap: string;
  communicationNotes: string;
  tradeRelationship: string;
  resourceRelationship: string;
  laborRelationship: string;
  economicDependency: string;
  economicNotes: string;
  sovereignty: string;
  alliance: string;
  representation: string;
  treatyStatus: string;
  politicalNotes: string;
  culturalAdoption: string;
  populationMixing: string;
  attitudesEach: string;
  hybridStatus: string;
  culturalNotes: string;
  firstContactTime: string;
  firstContactType: string;
  warHistory: string;
  cooperationHistory: string;
  historicalNotes: string;
  currentTensions: string;
  futureRisks: string;
  tensionNotes: string;
}

export interface Species {
  id: string;
  name: string;
  shortDescription: string;
  homeworld: string;
  physicalTraits: string;
  culturalTraits: string;
}

export interface FormState {
  species: Species[];
  pairs: SpeciesPair[];
  overallEquilibrium: string;
  overallTrajectory: string;
  dominantSpecies: string;
  mostVolatilePair: string;
  synthesisNotes: string;
  storyPrompt: string;
  centralConflict: string;
  peaceOpportunity: string;
  wildcardFactor: string;
  notes: string;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  species: [createEmptySpecies(), createEmptySpecies()],
  pairs: [],
  overallEquilibrium: "",
  overallTrajectory: "",
  dominantSpecies: "",
  mostVolatilePair: "",
  synthesisNotes: "",
  storyPrompt: "",
  centralConflict: "",
  peaceOpportunity: "",
  wildcardFactor: "",
  notes: "",
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "species-interaction-matrix";
export const LOCAL_STORAGE_KEY = "sim-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
