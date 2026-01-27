import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

// Level names for display
const LEVEL_NAMES = [
  { id: "level1", name: "Physical Implications", number: 1 },
  { id: "level2", name: "Biological Adaptations", number: 2 },
  { id: "level3", name: "Psychological Consequences", number: 3 },
  { id: "level4", name: "Cultural Expressions", number: 4 },
  { id: "level5", name: "Mythological Framework", number: 5 },
];

// Question labels by level
const QUESTION_LABELS: Record<string, Record<string, string>> = {
  level1: {
    architecture: "Architecture & Settlement",
    movement: "Movement & Transportation",
    resources: "Resources",
    technology: "Technology",
  },
  level2: {
    physical: "Physical Form",
    sensory: "Sensory Systems",
    metabolic: "Metabolic Systems",
    vestigial: "Vestigial Traits",
  },
  level3: {
    normal: "Concept of Normal",
    fears: "Primal Fears",
    temporal: "Temporal Perception",
    values: "Values & Priorities",
    cognitive: "Cognitive Differences",
  },
  level4: {
    social: "Social Organization",
    economic: "Economic Systems",
    status: "Status Symbols",
    taboos: "Taboos",
    art: "Art & Aesthetics",
    conflict: "Conflict Resolution",
  },
  level5: {
    creation: "Creation Myth",
    sacred: "Sacred/Divine",
    cosmological: "Cosmological Metaphor",
    ritual: "Ritual Practices",
    suffering: "Meaning of Suffering",
  },
};

// Planetary parameter labels
const PARAMETER_LABELS: Record<string, Record<string, string>> = {
  gravity: { high: "High Gravity", low: "Low Gravity" },
  rotation: { slow: "Slow Rotation", fast: "Fast Rotation", locked: "Tidally Locked" },
  stellar: { binary: "Binary Star", reddwarf: "Red Dwarf", rogue: "Rogue Planet" },
  hydrosphere: { ocean: "Ocean World", desert: "Desert World", archipelago: "Archipelago" },
  atmosphere: { thick: "Thick Atmosphere", thin: "Thin Atmosphere", exotic: "Exotic Atmosphere" },
  tilt: { none: "No Axial Tilt", extreme: "Extreme Tilt", chaotic: "Chaotic Orbit" },
  geological: { high: "High Tectonic Activity", dead: "Geologically Dead", cryo: "Cryovolcanism" },
  other: {},
};

interface PlanetaryParameter {
  type: string;
  specificValue: string;
  mode: "single" | "multiple";
  types?: string[];
  specificValues?: Record<string, string>;
}

interface CascadeLevel {
  responses: Record<string, string>;
}

interface FormState {
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
}

interface ECRSummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

// Get parameter display name
const getParameterDisplay = (typeId: string): string => {
  const [category, option] = typeId.split("-");
  if (option && PARAMETER_LABELS[category]?.[option]) {
    return PARAMETER_LABELS[category][option];
  }
  if (category === "other") return "Custom Parameter";
  return typeId;
};

// Count filled responses
const countFilledResponses = (formState: FormState): number => {
  let count = 0;
  for (const level of LEVEL_NAMES) {
    const levelData = formState[level.id as keyof FormState] as CascadeLevel;
    count += Object.values(levelData.responses).filter((v) => v && v.trim()).length;
  }
  return count;
};

// Get first non-empty response per level for summary
const getLevelSummary = (responses: Record<string, string>, labels: Record<string, string>): string => {
  for (const [key, value] of Object.entries(responses)) {
    if (value && value.trim()) {
      const preview = value.trim().substring(0, 150);
      return preview + (value.length > 150 ? "..." : "");
    }
  }
  return "No responses yet";
};

const ECRSummaryTemplate = ({
  formState,
  worldName,
  date,
}: ECRSummaryTemplateProps) => {
  const filledCount = countFilledResponses(formState);
  const totalQuestions = 24; // Total questions across all levels
  const completionPercent = Math.round((filledCount / totalQuestions) * 100);

  // Get selected parameters
  const selectedParams: string[] = [];
  if (formState.parameter.mode === "single" && formState.parameter.type) {
    selectedParams.push(formState.parameter.type);
  } else if (formState.parameter.mode === "multiple" && formState.parameter.types) {
    selectedParams.push(...formState.parameter.types);
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Environmental Chain Reaction"
          worldName={worldName}
          date={date}
        />

        {/* Parameter Result Box */}
        <PDFResultBox
          value={selectedParams.length > 0 ? getParameterDisplay(selectedParams[0]) : "No Parameter"}
          label="Core Environmental Factor"
          description={
            formState.parameter.specificValue ||
            (selectedParams.length > 1 ? `+ ${selectedParams.length - 1} more factors` : "Define your world's core constraint")
          }
        />

        {/* Completion Status */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, textAlign: "center" }}>
            Cascade Progress: {filledCount} / {totalQuestions} questions ({completionPercent}% complete)
          </Text>
        </View>

        {/* Selected Parameters */}
        {selectedParams.length > 0 && (
          <PDFSection title="Selected Parameters">
            {selectedParams.map((param) => {
              const specificValue =
                formState.parameter.mode === "single"
                  ? formState.parameter.specificValue
                  : formState.parameter.specificValues?.[param];
              return (
                <PDFKeyValuePair
                  key={param}
                  label={getParameterDisplay(param)}
                  value={specificValue || "Not specified"}
                />
              );
            })}
          </PDFSection>
        )}

        {/* Cascade Summary */}
        <PDFSection title="Cascade Summary">
          {LEVEL_NAMES.map((level) => {
            const levelData = formState[level.id as keyof FormState] as CascadeLevel;
            const summary = getLevelSummary(levelData.responses, QUESTION_LABELS[level.id] || {});
            const filledInLevel = Object.values(levelData.responses).filter((v) => v && v.trim()).length;

            return (
              <View key={level.id} style={{ marginBottom: spacing.md }} wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>
                    {level.number}. {level.name}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                    {filledInLevel} responses
                  </Text>
                </View>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {summary}
                </Text>
              </View>
            );
          })}
        </PDFSection>

        {/* Key Synthesis Notes */}
        {(formState.synthesis.surprisingConsequence || formState.synthesis.storyPotential) && (
          <PDFSection title="Key Insights">
            {formState.synthesis.surprisingConsequence && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Surprising Consequence</Text>
                <Text style={styles.notesText}>{formState.synthesis.surprisingConsequence}</Text>
              </View>
            )}
            {formState.synthesis.storyPotential && (
              <View style={[styles.notesBox, { marginTop: spacing.sm }]}>
                <Text style={styles.notesLabel}>Story Potential</Text>
                <Text style={styles.notesText}>{formState.synthesis.storyPotential}</Text>
              </View>
            )}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default ECRSummaryTemplate;
