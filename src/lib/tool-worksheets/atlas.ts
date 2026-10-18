/** Atlas (Surface Gravity) worksheet shape and codec (moved from SurfaceGravityCalculator.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";
import type { FormStateForCalc } from "@/lib/surface-gravity/calculations";

export interface FormState extends FormStateForCalc {
  cascade: {
    biology: string;
    psychology: string;
    culture: string;
    mythology: string;
  };
  storyNotes: {
    physicalExperience: string;
    dailyLife: string;
    architecture: string;
    culturalIdentity: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  primary: {
    mass: 1.0,
    radius: 1.0,
    compositionPreset: "rocky",
    planetPreset: "earth",
    linked: true,
  },
  advanced: {
    surfaceTemp: 288,
    molecularWeightPreset: "earth",
    molecularWeight: 29,
  },
  cascade: {
    biology: "",
    psychology: "",
    culture: "",
    mythology: "",
  },
  storyNotes: {
    physicalExperience: "",
    dailyLife: "",
    architecture: "",
    culturalIdentity: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "surface-gravity-calculator";
export const LOCAL_STORAGE_KEY = "surface-gravity-calculator-v1";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
