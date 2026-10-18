/** Empire worksheet shape and codec (moved from EmpireDesigner.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export const createEmptyFaction = (): Faction => ({
  id: crypto.randomUUID(),
  name: "",
  type: "",
  goals: "",
  strength: "",
  leader: "",
});

export interface Synthesis {
  primaryConflict: string;
  uniqueFeature: string;
  storyPotential: string;
  consistencyNotes: string;
  oneSentenceSummary: string;
}

export interface Stability {
  strengths: string[];
  vulnerabilities: string[];
  currentCrisis: string;
  trajectory: string;
  projectedLifespan: string;
}

export interface ExternalRelations {
  diplomaticStance: string;
  allies: string;
  enemies: string;
  treaties: string;
  foreignPerception: string;
  expansionPlans: string;
}

export interface Faction {
  id: string;
  name: string;
  type: string;
  goals: string;
  strength: string;
  leader: string;
}

export interface Culture {
  coreValues: string[];
  symbols: string;
  propaganda: string;
  language: string;
  religion: string;
  socialClasses: string;
  culturalTaboos: string;
}

export interface Military {
  doctrine: string;
  size: string;
  technology: string;
  specialUnits: string;
  veteranStatus: string;
  civilianRelations: string;
}

export interface Economy {
  system: string;
  primaryResources: string;
  tradeRelations: string;
  currency: string;
  wealthDistribution: string;
  economicChallenges: string;
}

export interface TerritoryScale {
  scale: string;
  population: string;
  capitalLocation: string;
  regions: string;
  administrationStyle: string;
  bordersSecurity: string;
}

export interface PowerStructure {
  branches: string[];
  checksAndBalances: string;
  successionMethod: string;
  powerCenters: string;
  bureaucracyStyle: string;
  corruptionLevel: string;
}

export interface Foundation {
  name: string;
  governmentType: string;
  governmentSubtype: string;
  legitimacySource: string;
  age: string;
  foundingStory: string;
  rulerTitle: string;
  currentRuler: string;
}

export interface FormState {
  foundation: Foundation;
  power: PowerStructure;
  territory: TerritoryScale;
  economy: Economy;
  military: Military;
  culture: Culture;
  factions: Faction[];
  external: ExternalRelations;
  stability: Stability;
  synthesis: Synthesis;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  foundation: {
    name: "",
    governmentType: "",
    governmentSubtype: "",
    legitimacySource: "",
    age: "",
    foundingStory: "",
    rulerTitle: "",
    currentRuler: "",
  },
  power: {
    branches: [],
    checksAndBalances: "",
    successionMethod: "",
    powerCenters: "",
    bureaucracyStyle: "",
    corruptionLevel: "",
  },
  territory: {
    scale: "",
    population: "",
    capitalLocation: "",
    regions: "",
    administrationStyle: "",
    bordersSecurity: "",
  },
  economy: {
    system: "",
    primaryResources: "",
    tradeRelations: "",
    currency: "",
    wealthDistribution: "",
    economicChallenges: "",
  },
  military: {
    doctrine: "",
    size: "",
    technology: "",
    specialUnits: "",
    veteranStatus: "",
    civilianRelations: "",
  },
  culture: {
    coreValues: [],
    symbols: "",
    propaganda: "",
    language: "",
    religion: "",
    socialClasses: "",
    culturalTaboos: "",
  },
  factions: [createEmptyFaction()],
  external: {
    diplomaticStance: "",
    allies: "",
    enemies: "",
    treaties: "",
    foreignPerception: "",
    expansionPlans: "",
  },
  stability: {
    strengths: [],
    vulnerabilities: [],
    currentCrisis: "",
    trajectory: "",
    projectedLifespan: "",
  },
  synthesis: {
    primaryConflict: "",
    uniqueFeature: "",
    storyPotential: "",
    consistencyNotes: "",
    oneSentenceSummary: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "empire-designer";
export const LOCAL_STORAGE_KEY = "ed-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
