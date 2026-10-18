/** K-Scale (kardashev-scale) worksheet shape and codec. */
import type { MoodboardImage } from "@/hooks/use-moodboard";
import type { Json } from "@/integrations/supabase/types";
import { BUDGET_CATEGORIES, type GrowthRateKey } from "@/lib/kardashev/data";
import type { ToolWorksheetCodec } from "@/lib/tool-worksheet";

export interface FormState {
  totalPowerWatts: number;
  powerLog10: number; // slider value (log10)
  growthRate: GrowthRateKey;
  civilizationPreset: string;
  budgetPercentages: Record<string, number>;
  cascade: {
    governance: string;
    warfare: string;
    economics: string;
    biology: string;
    culture: string;
  };
  storyNotes: {
    energySources: string;
    limitations: string;
    conflicts: string;
    dailyLife: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  totalPowerWatts: 1.8e13,
  powerLog10: 13.26,
  growthRate: "moderate",
  civilizationPreset: "earth-2025",
  budgetPercentages: Object.fromEntries(
    BUDGET_CATEGORIES.map((c) => [c.id, c.defaultPercent])
  ),
  cascade: {
    governance: "",
    warfare: "",
    economics: "",
    biology: "",
    culture: "",
  },
  storyNotes: {
    energySources: "",
    limitations: "",
    conflicts: "",
    dailyLife: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "kardashev-scale";
export const LOCAL_STORAGE_KEY = "kardashev-scale-v1";

/** Older sheets may lack sections; they open with the defaults filled in (as before). */
export const codec: ToolWorksheetCodec<FormState> = {
  defaults: initialFormState,
  hydrate: (data, defaults) => {
    const d = (data ?? {}) as Partial<FormState>;
    return {
      ...defaults,
      ...d,
      budgetPercentages: d.budgetPercentages || defaults.budgetPercentages,
      cascade: { ...defaults.cascade, ...d.cascade },
      storyNotes: { ...defaults.storyNotes, ...d.storyNotes },
      moodboard: d.moodboard || defaults.moodboard,
    };
  },
  serialize: (state) => ({ ...state }) as unknown as Json,
};
