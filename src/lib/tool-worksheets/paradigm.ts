/** Paradigm (Technology Consequences) worksheet shape and codec (moved from TechnologyConsequences.tsx). */
import { type MoodboardImage } from "@/hooks/use-moodboard";
import { castCodec } from "@/lib/tool-worksheet";

export interface FormState {
  // Technology Definition
  technologyName: string;
  technologyCategory: string;
  technologyDescription: string;
  maturityLevel: string;
  accessLevel: string;
  keyCapabilities: string;
  limitations: string;

  // Physical Consequences
  infrastructureEffect: string;
  infrastructureNotes: string;
  environmentEffect: string;
  environmentNotes: string;
  resourceEffect: string;
  resourceNotes: string;
  physicalTimeframe: string;

  // Economic Consequences
  industryEffect: string;
  industryNotes: string;
  employmentEffect: string;
  employmentNotes: string;
  wealthEffect: string;
  wealthNotes: string;
  economicTimeframe: string;

  // Social Consequences
  classEffect: string;
  classNotes: string;
  familyEffect: string;
  familyNotes: string;
  communityEffect: string;
  communityNotes: string;
  identityEffect: string;
  identityNotes: string;
  socialTimeframe: string;

  // Political Consequences
  powerEffect: string;
  powerNotes: string;
  surveillanceEffect: string;
  surveillanceNotes: string;
  governanceEffect: string;
  governanceNotes: string;
  politicalTimeframe: string;

  // Military Consequences
  warfareEffect: string;
  warfareNotes: string;
  defenseEffect: string;
  defenseNotes: string;
  deterrenceEffect: string;
  deterrenceNotes: string;
  militaryTimeframe: string;

  // Psychological Consequences
  perceptionEffect: string;
  perceptionNotes: string;
  valuesEffect: string;
  valuesNotes: string;
  fearsEffect: string;
  fearsNotes: string;
  psychologicalTimeframe: string;

  // Synthesis
  primaryContradiction: string;
  contradictionAnalysis: string;
  storyConflicts: string;
  winnersLosers: string;
  unexpectedUses: string;
  technologyCharacter: string;

  // Additional
  notes: string;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

export const initialFormState: FormState = {
  technologyName: "",
  technologyCategory: "",
  technologyDescription: "",
  maturityLevel: "",
  accessLevel: "",
  keyCapabilities: "",
  limitations: "",

  infrastructureEffect: "",
  infrastructureNotes: "",
  environmentEffect: "",
  environmentNotes: "",
  resourceEffect: "",
  resourceNotes: "",
  physicalTimeframe: "",

  industryEffect: "",
  industryNotes: "",
  employmentEffect: "",
  employmentNotes: "",
  wealthEffect: "",
  wealthNotes: "",
  economicTimeframe: "",

  classEffect: "",
  classNotes: "",
  familyEffect: "",
  familyNotes: "",
  communityEffect: "",
  communityNotes: "",
  identityEffect: "",
  identityNotes: "",
  socialTimeframe: "",

  powerEffect: "",
  powerNotes: "",
  surveillanceEffect: "",
  surveillanceNotes: "",
  governanceEffect: "",
  governanceNotes: "",
  politicalTimeframe: "",

  warfareEffect: "",
  warfareNotes: "",
  defenseEffect: "",
  defenseNotes: "",
  deterrenceEffect: "",
  deterrenceNotes: "",
  militaryTimeframe: "",

  perceptionEffect: "",
  perceptionNotes: "",
  valuesEffect: "",
  valuesNotes: "",
  fearsEffect: "",
  fearsNotes: "",
  psychologicalTimeframe: "",

  primaryContradiction: "",
  contradictionAnalysis: "",
  storyConflicts: "",
  winnersLosers: "",
  unexpectedUses: "",
  technologyCharacter: "",

  notes: "",
  generalNotes: "",
  moodboard: [],
};

export const TOOL_TYPE = "technology-consequences";
export const LOCAL_STORAGE_KEY = "tc-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
