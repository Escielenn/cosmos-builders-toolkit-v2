/** Paradox (Time Dilation) worksheet shape and codec (moved from TimeDilationCalculator.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";
import type { FormStateForCalc } from "@/lib/time-dilation/calculations";

export interface FormState extends FormStateForCalc {
  storyNotes: {
    departureMoment: string;
    timeDilationImpact: string;
    returnExperience: string;
    socialConsequences: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  journey: {
    presetCategory: "",
    presetId: "",
    customDistance: "",
    customDistanceUnit: "ly",
    originName: "",
    destinationName: "",
  },
  propulsion: {
    method: "",
    customMaxVelocity: "",
  },
  velocityProfile: {
    mode: "constant",
    velocityFraction: "",
    gForce: "1",
  },
  referenceFrame: {
    frame: "earth",
    customName: "",
  },
  roundTrip: false,
  alcubierreNoDilation: true,
  storyNotes: {
    departureMoment: "",
    timeDilationImpact: "",
    returnExperience: "",
    socialConsequences: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "time-dilation";
export const LOCAL_STORAGE_KEY = "time-dilation-calculator-v1";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
