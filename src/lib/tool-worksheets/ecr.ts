/** Chain Reaction worksheet shape and codec (moved from EnvironmentalChainReaction.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { LinkedWorksheetRef } from "@/lib/worksheet-links-config";
import { castCodec } from "@/lib/tool-worksheet";

export interface CascadeLevel {
  responses: Record<string, string>;
}

// Types for form state
export interface PlanetaryParameter {
  type: string;
  specificValue: string;
  mode: "single" | "multiple";
  types?: string[];
  specificValues?: Record<string, string>;
}

export interface FormState {
  parameter: PlanetaryParameter;
  level1: CascadeLevel;
  level2: CascadeLevel;
  level3: CascadeLevel;
  level4: CascadeLevel;
  level5: CascadeLevel;
  synthesis: {
    logicalFlow: string;
    contradictions: string;
    monoCultureCheck: string;
    vestigialQuestion: string;
    soWhatTest: string;
    surprisingConsequence: string;
    biggestGap: string;
    storyPotential: string;
  };
  _linkedWorksheets?: {
    planet?: LinkedWorksheetRef;
    evobio?: LinkedWorksheetRef;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  parameter: { type: "", specificValue: "", mode: "single", types: [], specificValues: {} },
  level1: { responses: {} },
  level2: { responses: {} },
  level3: { responses: {} },
  level4: { responses: {} },
  level5: { responses: {} },
  synthesis: {
    logicalFlow: "",
    contradictions: "",
    monoCultureCheck: "",
    vestigialQuestion: "",
    soWhatTest: "",
    surprisingConsequence: "",
    biggestGap: "",
    storyPotential: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "environmental-chain-reaction";
export const LOCAL_STORAGE_KEY = "ecr-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
