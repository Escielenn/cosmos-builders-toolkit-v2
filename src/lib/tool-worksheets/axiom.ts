/** One Big Lie worksheet shape and codec (moved from OneBigLie.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

// Types
export interface FormState {
  approach: {
    type: "big-lie" | "what-if" | "";
  };
  coreStatement: {
    statement: string;
    scienceBroken: string;
  };
  justification: {
    narrativeJustification: string;
    whatBecomesPossible: string;
    whatBecomesImpossible: string;
  };
  testability: {
    inWorldTest: string;
    rules: string;
    knownUnknowns: string;
  };
  physicalConsequences: {
    primaryImpact: string;
    secondOrderEffects: string;
  };
  techConsequences: {
    technologicalImpact: string;
    economicPowerImpact: string;
  };
  socialConsequences: {
    socialPsychologicalImpact: string;
    culturalMythologicalImpact: string;
  };
  rigorCommitment: {
    rigorArea1: string;
    rigorArea2: string;
    rigorArea3: string;
  };
  consistencyTest: {
    hardestQuestion: string;
    edgeCase: string;
    connectionToWorld: string;
  };
  declaration: {
    formalDeclaration: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  approach: { type: "" },
  coreStatement: { statement: "", scienceBroken: "" },
  justification: {
    narrativeJustification: "",
    whatBecomesPossible: "",
    whatBecomesImpossible: "",
  },
  testability: { inWorldTest: "", rules: "", knownUnknowns: "" },
  physicalConsequences: { primaryImpact: "", secondOrderEffects: "" },
  techConsequences: { technologicalImpact: "", economicPowerImpact: "" },
  socialConsequences: {
    socialPsychologicalImpact: "",
    culturalMythologicalImpact: "",
  },
  rigorCommitment: { rigorArea1: "", rigorArea2: "", rigorArea3: "" },
  consistencyTest: {
    hardestQuestion: "",
    edgeCase: "",
    connectionToWorld: "",
  },
  declaration: { formalDeclaration: "" },
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "one-big-lie";
export const LOCAL_STORAGE_KEY = "one-big-lie-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
