/** Impulse worksheet shape and codec (moved from PropulsionConsequencesMap.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export interface DomainResponses {
  [key: string]: string | string[];
}

export interface EconomicCosts {
  fuelEnergy: string;
  construction: string;
  maintenance: string;
  crewCapacity: string;
  cargoCapacity: string;
  serviceLife: string;
}

export interface TravelBenchmark {
  earthMars: string;
  earthJupiter: string;
  earthNeptune: string;
  solAlphaCentauri: string;
  solProximaB: string;
  customRoute: string;
  customRouteTime: string;
}

// Types for form state
export interface PropulsionSystem {
  type: string;
  customType: string;
  maxVelocity: string;
  acceleration: string;
  energySource: string;
  communicationSpeed: string;
  costComparison: string;
}

export interface FormState {
  system: PropulsionSystem;
  benchmarks: TravelBenchmark;
  costs: EconomicCosts;
  economic: DomainResponses;
  political: DomainResponses;
  military: DomainResponses;
  social: DomainResponses;
  psychological: DomainResponses;
  synthesis: {
    consistencyChecks: string[];
    inconsistency: string;
    unexpectedConsequences: string;
    economicConflicts: string;
    politicalConflicts: string;
    socialConflicts: string;
    propulsionThesis: string;
    mostImportant: string;
    storyConflict: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  system: {
    type: "",
    customType: "",
    maxVelocity: "",
    acceleration: "",
    energySource: "",
    communicationSpeed: "",
    costComparison: "",
  },
  benchmarks: {
    earthMars: "",
    earthJupiter: "",
    earthNeptune: "",
    solAlphaCentauri: "",
    solProximaB: "",
    customRoute: "",
    customRouteTime: "",
  },
  costs: {
    fuelEnergy: "",
    construction: "",
    maintenance: "",
    crewCapacity: "",
    cargoCapacity: "",
    serviceLife: "",
  },
  economic: {},
  political: {},
  military: {},
  social: {},
  psychological: {},
  synthesis: {
    consistencyChecks: [],
    inconsistency: "",
    unexpectedConsequences: "",
    economicConflicts: "",
    politicalConflicts: "",
    socialConflicts: "",
    propulsionThesis: "",
    mostImportant: "",
    storyConflict: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "propulsion-consequences-map";
export const LOCAL_STORAGE_KEY = "pcm-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
