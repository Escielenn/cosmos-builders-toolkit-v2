/** Drake Equation worksheet shape and codec (moved from DrakeEquationCalculator.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { calculateDrakeN } from "@/lib/drake";
import type { ToolWorksheetCodec } from "@/lib/tool-worksheet";
import type { Json } from "@/integrations/supabase/types";
import { castCodec } from "@/lib/tool-worksheet";

// Form state interface
export interface FormState {
  values: {
    rStar: number;
    fp: number;
    ne: number;
    fl: number;
    fi: number;
    fc: number;
    L: number;
  };
  notes: {
    rStar: string;
    fp: string;
    ne: string;
    fl: string;
    fi: string;
    fc: string;
    L: string;
  };
  worldbuilding: {
    fermiAnswer: string;
    greatFilterLocation: string;
    galaxyCharacter: string;
    storyImplications: string;
    civilizationTypes: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  values: {
    rStar: 1.5,
    fp: 1,
    ne: 0.4,
    fl: 0.5,
    fi: 0.5,
    fc: 0.2,
    L: 10000,
  },
  notes: {
    rStar: "",
    fp: "",
    ne: "",
    fl: "",
    fi: "",
    fc: "",
    L: "",
  },
  worldbuilding: {
    fermiAnswer: "",
    greatFilterLocation: "",
    galaxyCharacter: "",
    storyImplications: "",
    civilizationTypes: "",
  },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "drake-equation-calculator";
export const LOCAL_STORAGE_KEY = "drake-equation-calculator-v1";

/**
 * Rows store the form plus a `derived` snapshot (1.9 F-08): N itself, the
 * number a story quotes, recomputed on every save so it can reach canon.
 */
export const codec: ToolWorksheetCodec<FormState> = {
  ...castCodec(initialFormState),
  serialize: (f) =>
    ({ ...f, derived: { N: Number(calculateDrakeN(f.values).toPrecision(4)) } }) as unknown as Json,
};
