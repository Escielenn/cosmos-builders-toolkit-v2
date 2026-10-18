/** Orrery worksheet shape and codec (moved from StarSystemBuilder.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export const createEmptyBody = (): PlanetaryBody => ({
  id: crypto.randomUUID(),
  name: "",
  type: "",
  subtype: "",
  orbitalZone: "",
  orbitalPeriod: "",
  distanceFromStar: "",
  moons: "",
  rings: false,
  tidallyLocked: false,
  notes: "",
});

export interface Synthesis {
  consistencyChecks: string[];
  primaryConflict: string;
  uniqueFeature: string;
  connectionToPlanetary: string;
  oneSentenceSummary: string;
}

export interface NarrativeElements {
  systemCharacter: string;
  visualSignature: string;
  navigationChallenges: string;
  travelTimes: string;
  culturalSignificance: string;
  mysteries: string;
  storyHooks: string;
}

export interface Habitability {
  habitableZoneInner: string;
  habitableZoneOuter: string;
  modifiers: string[];
  bestCandidate: string;
  terraformingPotential: string;
  resourceRichness: string;
}

export interface SystemHistory {
  age: string;
  formationScenario: string;
  majorEvents: string;
  collisionHistory: string;
  migrationHistory: string;
  futureProjection: string;
}

export interface OrbitalMechanics {
  resonancePattern: string;
  resonanceNotes: string;
  stabilityAssessment: string;
  asteroidBelts: string[];
  kuiperBelt: boolean;
  oortCloud: boolean;
  hazards: string;
}

export interface PlanetaryBody {
  id: string;
  name: string;
  type: string;
  subtype: string;
  orbitalZone: string;
  orbitalPeriod: string;
  distanceFromStar: string;
  moons: string;
  rings: boolean;
  tidallyLocked: boolean;
  notes: string;
}

export interface StellarConfiguration {
  type: string;
  secondaryStarClass: string;
  tertiaryStarClass: string;
  binaryOrbitalPeriod: string;
  binarySeparation: string;
  configurationNotes: string;
}

// Types for form state
export interface PrimaryStar {
  name: string;
  spectralClass: string;
  customClass: string;
  age: string;
  luminosity: string;
  mass: string;
  notes: string;
}

export interface FormState {
  systemName: string;
  primaryStar: PrimaryStar;
  configuration: StellarConfiguration;
  bodies: PlanetaryBody[];
  orbits: OrbitalMechanics;
  history: SystemHistory;
  habitability: Habitability;
  narrative: NarrativeElements;
  synthesis: Synthesis;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  systemName: "",
  primaryStar: {
    name: "",
    spectralClass: "",
    customClass: "",
    age: "",
    luminosity: "",
    mass: "",
    notes: "",
  },
  configuration: {
    type: "single",
    secondaryStarClass: "",
    tertiaryStarClass: "",
    binaryOrbitalPeriod: "",
    binarySeparation: "",
    configurationNotes: "",
  },
  bodies: [createEmptyBody()],
  orbits: {
    resonancePattern: "",
    resonanceNotes: "",
    stabilityAssessment: "",
    asteroidBelts: [],
    kuiperBelt: false,
    oortCloud: false,
    hazards: "",
  },
  history: {
    age: "",
    formationScenario: "",
    majorEvents: "",
    collisionHistory: "",
    migrationHistory: "",
    futureProjection: "",
  },
  habitability: {
    habitableZoneInner: "",
    habitableZoneOuter: "",
    modifiers: [],
    bestCandidate: "",
    terraformingPotential: "",
    resourceRichness: "",
  },
  narrative: {
    systemCharacter: "",
    visualSignature: "",
    navigationChallenges: "",
    travelTimes: "",
    culturalSignificance: "",
    mysteries: "",
    storyHooks: "",
  },
  synthesis: {
    consistencyChecks: [],
    primaryConflict: "",
    uniqueFeature: "",
    connectionToPlanetary: "",
    oneSentenceSummary: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "star-system-builder";
export const LOCAL_STORAGE_KEY = "ssb-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
