/** LexDrift worksheet shape and codec (moved from LexDrift.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { type FormStateForCalc } from "@/lib/lexdrift/calculations";
import { castCodec } from "@/lib/tool-worksheet";

export interface FormState extends FormStateForCalc {
  storyNotes: {
    linguisticIdentity: string;
    firstContact: string;
    culturalPreservation: string;
    generationalShift: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  mission: {
    duration: 200,
    population: 2500,
    isolation: "high",
  },
  linguistic: {
    selectedLanguages: ["english"],
    customLanguage: "",
    linguaFranca: "english",
    includeSignLanguage: false,
    signLanguage: "",
    liturgicalPreservation: false,
    liturgicalLanguage: "",
  },
  social: {
    educationPolicy: "moderate",
    identityPressure: 50,
    mediaAccess: "archived",
    contactEvents: [],
  },
  multiShip: {
    enabled: false,
    ships: [],
  },
  storyNotes: {
    linguisticIdentity: "",
    firstContact: "",
    culturalPreservation: "",
    generationalShift: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "lexdrift";
export const LOCAL_STORAGE_KEY = "lexdrift-v1";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
