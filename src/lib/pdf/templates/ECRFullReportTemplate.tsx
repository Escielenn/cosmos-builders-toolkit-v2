import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

// Level definitions with full question data
const LEVELS = [
  {
    id: "level1",
    name: "Physical Implications",
    number: 1,
    thinkLike: "a systems engineer: How does physics constrain everything?",
    questions: [
      { id: "architecture", label: "Architecture & Settlement Patterns" },
      { id: "movement", label: "Movement & Transportation" },
      { id: "resources", label: "Resource Availability & Distribution" },
      { id: "technology", label: "Technology Pressures" },
    ],
  },
  {
    id: "level2",
    name: "Biological Adaptations",
    number: 2,
    thinkLike: "an evolutionary biologist: Every trait serves survival or is vestigial.",
    questions: [
      { id: "physical", label: "Physical Form & Structure" },
      { id: "sensory", label: "Sensory Systems" },
      { id: "metabolic", label: "Metabolic & Energy Systems" },
      { id: "vestigial", label: "Vestigial Traits" },
    ],
  },
  {
    id: "level3",
    name: "Psychological Consequences",
    number: 3,
    thinkLike: "a psychologist: Biology determines baseline psychology.",
    questions: [
      { id: "normal", label: "Concept of \"Normal\"" },
      { id: "fears", label: "Primal Fears" },
      { id: "temporal", label: "Temporal Perception" },
      { id: "values", label: "Values & Priorities" },
      { id: "cognitive", label: "Cognitive Differences" },
    ],
  },
  {
    id: "level4",
    name: "Cultural Expressions",
    number: 4,
    thinkLike: "an anthropologist: Culture is collective psychology made visible.",
    questions: [
      { id: "social", label: "Social Organization" },
      { id: "economic", label: "Economic Systems" },
      { id: "status", label: "Status Symbols & Achievement" },
      { id: "taboos", label: "Taboos & Prohibitions" },
      { id: "art", label: "Art & Aesthetics" },
      { id: "conflict", label: "Conflict & Resolution" },
    ],
  },
  {
    id: "level5",
    name: "Mythological Framework",
    number: 5,
    thinkLike: "a mythographer: Myth explains existence and validates culture.",
    questions: [
      { id: "creation", label: "Creation Myth" },
      { id: "sacred", label: "Sacred/Divine Associations" },
      { id: "cosmological", label: "Central Cosmological Metaphor" },
      { id: "ritual", label: "Ritual Practices" },
      { id: "suffering", label: "Mythological Explanation of Suffering" },
    ],
  },
];

// Planetary parameter labels
const PARAMETER_LABELS: Record<string, { category: string; options: Record<string, string> }> = {
  gravity: {
    category: "Gravity",
    options: { high: "High gravity (1.5-3x Earth)", low: "Low gravity (0.3-0.8x Earth)" },
  },
  rotation: {
    category: "Rotation / Day Length",
    options: { slow: "Slow rotation (48+ hour days)", fast: "Fast rotation (6-12 hour days)", locked: "Tidally locked" },
  },
  stellar: {
    category: "Stellar Environment",
    options: { binary: "Binary/multiple star system", reddwarf: "Red dwarf orbit", rogue: "Rogue planet" },
  },
  hydrosphere: {
    category: "Hydrosphere",
    options: { ocean: "Ocean world (90-100% water)", desert: "Desert world (0-20% water)", archipelago: "Archipelago world" },
  },
  atmosphere: {
    category: "Atmosphere",
    options: { thick: "Thick atmosphere", thin: "Thin atmosphere", exotic: "Exotic composition" },
  },
  tilt: {
    category: "Axial Tilt",
    options: { none: "No tilt (0-5°)", extreme: "Extreme tilt (>45°)", chaotic: "Chaotic/tumbling" },
  },
  geological: {
    category: "Geological Activity",
    options: { high: "High tectonic activity", dead: "Geologically dead", cryo: "Cryovolcanism" },
  },
  other: { category: "Other Unique Factor", options: {} },
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

interface ECRFullReportTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

// Get parameter display info
const getParameterInfo = (typeId: string): { category: string; option: string } => {
  const [categoryId, optionId] = typeId.split("-");
  const paramData = PARAMETER_LABELS[categoryId];
  if (!paramData) return { category: "Unknown", option: typeId };

  const optionLabel = optionId ? paramData.options[optionId] : "Custom";
  return {
    category: paramData.category,
    option: optionLabel || "Custom factor",
  };
};

const ECRFullReportTemplate = ({
  formState,
  worldName,
  date,
}: ECRFullReportTemplateProps) => {
  // Get selected parameters with null safety
  const selectedParams: string[] = [];
  const parameter = formState?.parameter;
  if (parameter?.mode === "single" && parameter?.type) {
    selectedParams.push(parameter.type);
  } else if (parameter?.mode === "multiple" && parameter?.types) {
    selectedParams.push(...parameter.types);
  }

  return (
    <Document>
      {/* Page 1: Title, Parameters, Introduction */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Environmental Chain Reaction"
          worldName={worldName}
          date={date}
        />

        {/* Introduction */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "Environment shapes biology, biology shapes psychology, psychology shapes culture, culture shapes mythology."
          </Text>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: spacing.sm, lineHeight: 1.4 }}>
            This worksheet traces how planetary conditions cascade through five levels to create unique cultures,
            psychologies, and spiritualities. A desert world doesn't just have different weather—it produces
            different religions, social structures, technologies, and concepts of value.
          </Text>
        </View>

        {/* Selected Parameters */}
        <PDFSection title="Core Environmental Parameters">
          {selectedParams.length > 0 ? (
            selectedParams.map((param) => {
              const info = getParameterInfo(param);
              const specificValue =
                parameter?.mode === "single"
                  ? parameter?.specificValue
                  : parameter?.specificValues?.[param];

              return (
                <View key={param} style={{ marginBottom: spacing.md, padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4 }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>{info.category}</Text>
                  <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginTop: 2 }}>
                    {info.option}
                  </Text>
                  {specificValue && (
                    <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, marginTop: spacing.xs }}>
                      Specific value: {specificValue}
                    </Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted, fontStyle: "italic" }}>
              No environmental parameter selected
            </Text>
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Pages 2-6: One page per cascade level */}
      {LEVELS.map((level) => {
        const levelData = formState?.[level.id as keyof FormState] as CascadeLevel | undefined;
        const responses = levelData?.responses || {};

        return (
          <Page key={level.id} size="LETTER" style={styles.page}>
            <PDFHeader
              toolName="Environmental Chain Reaction"
              worldName={worldName}
              date={date}
            />

            {/* Level Header */}
            <View style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: spacing.sm,
                }}>
                  <Text style={{ fontSize: typography.sizes.md, fontWeight: 700, color: "#ffffff" }}>
                    {level.number}
                  </Text>
                </View>
                <Text style={{ fontSize: typography.sizes.xl, fontWeight: 600, color: colors.text.primary }}>
                  {level.name}
                </Text>
              </View>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontStyle: "italic" }}>
                Think like {level.thinkLike}
              </Text>
            </View>

            {/* Questions and Responses */}
            {level.questions.map((question, index) => {
              const response = responses[question.id] || "";

              return (
                <View key={question.id} style={{ marginBottom: spacing.lg }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                    {question.label}
                  </Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>
                      {response || "No response provided"}
                    </Text>
                  </View>
                  {index < level.questions.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}

            <PDFFooter />
          </Page>
        );
      })}

      {/* Final Page: Consistency Check & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Environmental Chain Reaction"
          worldName={worldName}
          date={date}
        />

        {/* Consistency Check */}
        <PDFSection title="Cascade Consistency Check">
          <View style={{ marginBottom: spacing.md }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Logical Flow
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.logicalFlow || "Not assessed"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: spacing.md }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Internal Contradictions
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.contradictions || "Not assessed"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: spacing.md }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Mono-Culture Check
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.monoCultureCheck || "Not assessed"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: spacing.md }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Vestigial Question
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.vestigialQuestion || "Not assessed"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: spacing.md }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              "So What?" Test
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.soWhatTest || "Not assessed"}
              </Text>
            </View>
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Synthesis Page */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Environmental Chain Reaction"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="Synthesis">
          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Most Surprising Consequence
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              What unexpected connection emerged from working through the cascade?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.surprisingConsequence || "Not specified"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Biggest Gap or Unresolved Tension
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              What needs more development or contains productive contradictions?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.biggestGap || "Not specified"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Story Potential
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              What conflicts, characters, or narratives does this world naturally generate?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState?.synthesis?.storyPotential || "Not specified"}
              </Text>
            </View>
          </View>
        </PDFSection>

        {/* Final Quote */}
        <View style={{ marginTop: spacing.xl, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
            "The most believable worlds aren't the most complex—they're the most internally consistent.
            Every element should cascade logically from your core environmental choice."
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default ECRFullReportTemplate;
