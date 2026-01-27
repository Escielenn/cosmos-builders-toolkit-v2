import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

// Drake variable definitions with full info
const DRAKE_VARIABLES = [
  {
    id: "rStar",
    symbol: "R*",
    name: "Star Formation Rate",
    unit: "stars/year",
    description: "Average rate of star formation in our galaxy (per year)",
    scientificRange: "1–3 stars/year",
  },
  {
    id: "fp",
    symbol: "fp",
    name: "Fraction with Planets",
    unit: "",
    description: "Fraction of stars that have planetary systems",
    scientificRange: "0.9–1.0",
  },
  {
    id: "ne",
    symbol: "ne",
    name: "Habitable Planets per System",
    unit: "planets",
    description: "Average number of planets that could support life per star with planets",
    scientificRange: "0.1–0.5",
  },
  {
    id: "fl",
    symbol: "fl",
    name: "Fraction Where Life Develops",
    unit: "",
    description: "Fraction of habitable planets where life actually arises",
    scientificRange: "0.001–1.0",
  },
  {
    id: "fi",
    symbol: "fi",
    name: "Fraction with Intelligence",
    unit: "",
    description: "Fraction of life-bearing planets that develop intelligent life",
    scientificRange: "0.001–1.0",
  },
  {
    id: "fc",
    symbol: "fc",
    name: "Fraction with Detectable Technology",
    unit: "",
    description: "Fraction of intelligent civilizations that develop detectable technology",
    scientificRange: "0.01–0.2",
  },
  {
    id: "L",
    symbol: "L",
    name: "Civilization Longevity",
    unit: "years",
    description: "Average length of time civilizations release detectable signals",
    scientificRange: "100–10,000,000",
  },
];

interface DrakeFormState {
  values: {
    rStar: number;
    fp: number;
    ne: number;
    fl: number;
    fi: number;
    fc: number;
    L: number;
  };
  notes: Record<string, string>;
  worldbuilding: {
    fermiAnswer: string;
    greatFilterLocation: string;
    galaxyCharacter: string;
    storyImplications: string;
    civilizationTypes: string;
  };
}

interface DrakeFullReportTemplateProps {
  formState: DrakeFormState;
  worldName?: string;
  date?: string;
}

// Calculate N from values
const calculateN = (values: DrakeFormState["values"]): number => {
  return values.rStar * values.fp * values.ne * values.fl * values.fi * values.fc * values.L;
};

// Format large numbers
const formatNumber = (n: number): string => {
  if (n < 1) return n.toFixed(4);
  if (n < 10) return n.toFixed(2);
  if (n < 1000) return n.toFixed(1);
  if (n < 1000000) return Math.round(n).toLocaleString();
  if (n < 1000000000) return (n / 1000000).toFixed(1) + " million";
  return (n / 1000000000).toFixed(1) + " billion";
};

// Get interpretation
const getInterpretation = (n: number): { label: string; description: string } => {
  if (n < 1) return {
    label: "Very Lonely",
    description: "Fewer than one civilization expected. We may be alone in the galaxy, or civilizations are so rare that contact is essentially impossible.",
  };
  if (n < 10) return {
    label: "Lonely",
    description: "A handful of civilizations might exist. Finding each other would be like finding needles in a cosmic haystack.",
  };
  if (n < 100) return {
    label: "Sparse",
    description: "Dozens of civilizations. Contact is possible but requires patience and luck. Good for stories about first contact as a rare, meaningful event.",
  };
  if (n < 1000) return {
    label: "Moderate",
    description: "Hundreds of civilizations. Enough for a network, but vast distances mean most remain isolated. Good for stories about distant rumors.",
  };
  if (n < 10000) return {
    label: "Crowded",
    description: "Thousands of civilizations. Regional groupings, alliances, and conflicts become possible. Classic space opera territory.",
  };
  return {
    label: "Teeming",
    description: "A galaxy full of life. Civilizations bump into each other regularly. Think Star Trek or Star Wars. The Fermi Paradox becomes very pressing.",
  };
};

const DrakeFullReportTemplate = ({
  formState,
  worldName,
  date,
}: DrakeFullReportTemplateProps) => {
  const N = calculateN(formState.values);
  const interpretation = getInterpretation(N);

  return (
    <Document>
      {/* Page 1: Title, Result, Introduction */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Drake Equation Calculator"
          worldName={worldName}
          date={date}
        />

        {/* Introduction */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
            The Drake Equation, developed by astronomer Frank Drake in 1961, estimates the number of
            active, communicative extraterrestrial civilizations in the Milky Way. For worldbuilders,
            it provides a framework for deciding how populated your galaxy should be.
          </Text>
        </View>

        {/* Main Result */}
        <PDFResultBox
          value={formatNumber(N)}
          label={interpretation.label}
          description={interpretation.description}
        />

        {/* Equation Display */}
        <View style={{ marginBottom: spacing.xl, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.xs }}>
            THE EQUATION
          </Text>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: typography.sizes.md,
              color: colors.text.primary,
              textAlign: "center",
              marginBottom: spacing.sm,
            }}
          >
            N = R* × fp × ne × fl × fi × fc × L
          </Text>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: typography.sizes.sm,
              color: colors.primary,
              textAlign: "center",
            }}
          >
            N = {formState.values.rStar} × {formState.values.fp} × {formState.values.ne} × {formState.values.fl} × {formState.values.fi} × {formState.values.fc} × {formatNumber(formState.values.L)}
          </Text>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: typography.sizes.md,
              color: colors.primary,
              textAlign: "center",
              fontWeight: 600,
              marginTop: spacing.xs,
            }}
          >
            N = {formatNumber(N)}
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* Page 2+: Variables with Notes */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Drake Equation Calculator"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="Variables">
          {DRAKE_VARIABLES.map((variable, index) => {
            const value = formState.values[variable.id as keyof typeof formState.values];
            const note = formState.notes[variable.id] || "";

            return (
              <View key={variable.id} style={{ marginBottom: spacing.lg }} wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary }}>
                      {variable.symbol} — {variable.name}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2 }}>
                      {variable.description}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: typography.sizes.lg, fontWeight: 600, color: colors.text.primary }}>
                      {variable.id === "L" ? formatNumber(value) : value}
                    </Text>
                    {variable.unit && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                        {variable.unit}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                  Scientific range: {variable.scientificRange}
                </Text>
                {note ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Your Notes</Text>
                    <Text style={styles.notesText}>{note}</Text>
                  </View>
                ) : (
                  <View style={[styles.notesBox, { backgroundColor: "#fafafa" }]}>
                    <Text style={[styles.notesText, { fontStyle: "italic", color: colors.text.muted }]}>
                      No notes provided
                    </Text>
                  </View>
                )}
                {index < DRAKE_VARIABLES.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3+: Worldbuilding Implications */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Drake Equation Calculator"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="Worldbuilding Implications">
          {/* Fermi Paradox Answer */}
          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Your Answer to the Fermi Paradox
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              If your N is high but your galaxy seems empty, why? If N is low, what does that mean for your characters?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState.worldbuilding.fermiAnswer || "Not specified"}
              </Text>
            </View>
          </View>

          {/* Great Filter */}
          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Where Is the Great Filter?
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              Which step is hardest to pass? This shapes whether your ruins are biological or technological.
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState.worldbuilding.greatFilterLocation || "Not specified"}
              </Text>
            </View>
          </View>

          {/* Galaxy Character */}
          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Character of Your Galaxy
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              Based on your N, what's the general feel of space travel in your world?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState.worldbuilding.galaxyCharacter || "Not specified"}
              </Text>
            </View>
          </View>

          {/* Story Implications */}
          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Story Implications
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              What kinds of stories does your galactic population enable or prevent?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState.worldbuilding.storyImplications || "Not specified"}
              </Text>
            </View>
          </View>

          {/* Civilization Types */}
          <View style={{ marginBottom: spacing.lg }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Types of Civilizations
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              What kinds of civilizations exist in your galaxy? What are their relationships?
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {formState.worldbuilding.civilizationTypes || "Not specified"}
              </Text>
            </View>
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default DrakeFullReportTemplate;
