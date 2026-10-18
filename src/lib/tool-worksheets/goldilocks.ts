/** Goldilocks (habitable-zone-calculator) worksheet shape and codec. */
import type { MoodboardImage } from "@/hooks/use-moodboard";
import type { FormStateForCalc } from "@/lib/habitable-zone/calculations";
import { castCodec } from "@/lib/tool-worksheet";

export interface FormState extends FormStateForCalc {
  storyNotes: {
    starDescription: string;
    planetSetting: string;
    habitabilityNarrative: string;
    worldbuildingNotes: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  star: {
    presetId: "sol",
    spectralType: "G",
    mass: 1.0,
    luminosity: 1.0,
    temperature: 5778,
    autoLuminosity: true,
  },
  planet: {
    orbitalDistance: 1.0,
    name: "",
    greenhouseWarming: 33,
  },
  storyNotes: {
    starDescription: "",
    planetSetting: "",
    habitabilityNarrative: "",
    worldbuildingNotes: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "habitable-zone-calculator";
export const LOCAL_STORAGE_KEY = "habitable-zone-calculator-v1";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
