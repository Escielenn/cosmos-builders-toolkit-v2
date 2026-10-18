/** Vessel worksheet shape and codec (moved from SpacecraftDesigner.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export interface ShipCharacter {
  personality: string;
  quirks: string;
  secrets: string;
  reputation: string;
  relationships: string;
  evolution: string;
  metaphor: string;
}

export interface CulturalElements {
  originCulture: string;
  decorations: string;
  modifications: string;
  rituals: string;
  taboos: string;
  naming: string;
  superstitions: string;
  memorials: string;
  conflicts: string;
}

export interface LivingSpaces {
  /** Head count. vessel.crew_size has its home here (1.5 item 10). */
  crewSize?: string;
  crewQuarters: string;
  commonAreas: string;
  privateSpace: string;
  storage: string;
  recreation: string;
  workspaces: string;
  traffic: string;
  soundscape: string;
  lighting: string;
  smells: string;
}

export interface LifeSupport {
  atmosphere: string;
  water: string;
  food: string;
  waste: string;
  temperature: string;
  radiation: string;
  gravity: string;
  medical: string;
  emergencyBackups: string;
  failureModes: string;
}

export interface PropulsionIntegration {
  driveType: string;
  accelerationProfile: string;
  fuelSource: string;
  rangeLimit: string;
  architecturalConsequences: string;
  thrustOrientation: string;
  noiseVibration: string;
}

// Types for form state
export interface ShipIdentity {
  name: string;
  class: string;
  customClass: string;
  role: string;
  customRole: string;
  size: string;
  age: string;
  origin: string;
  currentOwner: string;
  history: string;
}

export interface FormState {
  identity: ShipIdentity;
  propulsion: PropulsionIntegration;
  lifeSupport: LifeSupport;
  living: LivingSpaces;
  cultural: CulturalElements;
  character: ShipCharacter;
  synthesis: {
    livedInDetails: string;
    storyHooks: string;
    sensorySignature: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  identity: {
    name: "",
    class: "",
    customClass: "",
    role: "",
    customRole: "",
    size: "",
    age: "",
    origin: "",
    currentOwner: "",
    history: "",
  },
  propulsion: {
    driveType: "",
    accelerationProfile: "",
    fuelSource: "",
    rangeLimit: "",
    architecturalConsequences: "",
    thrustOrientation: "",
    noiseVibration: "",
  },
  lifeSupport: {
    atmosphere: "",
    water: "",
    food: "",
    waste: "",
    temperature: "",
    radiation: "",
    gravity: "",
    medical: "",
    emergencyBackups: "",
    failureModes: "",
  },
  living: {
    crewSize: "",
    crewQuarters: "",
    commonAreas: "",
    privateSpace: "",
    storage: "",
    recreation: "",
    workspaces: "",
    traffic: "",
    soundscape: "",
    lighting: "",
    smells: "",
  },
  cultural: {
    originCulture: "",
    decorations: "",
    modifications: "",
    rituals: "",
    taboos: "",
    naming: "",
    superstitions: "",
    memorials: "",
    conflicts: "",
  },
  character: {
    personality: "",
    quirks: "",
    secrets: "",
    reputation: "",
    relationships: "",
    evolution: "",
    metaphor: "",
  },
  synthesis: {
    livedInDetails: "",
    storyHooks: "",
    sensorySignature: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "spacecraft-designer";
export const LOCAL_STORAGE_KEY = "spacecraft-designer";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
