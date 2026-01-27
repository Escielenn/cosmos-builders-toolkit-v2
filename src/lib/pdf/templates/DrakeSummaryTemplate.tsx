import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

// Drake variable definitions for display
const DRAKE_VARIABLES = [
  { id: "rStar", symbol: "R*", name: "Star Formation Rate", unit: "stars/year" },
  { id: "fp", symbol: "fp", name: "Fraction with Planets", unit: "" },
  { id: "ne", symbol: "ne", name: "Habitable Planets per System", unit: "planets" },
  { id: "fl", symbol: "fl", name: "Fraction Where Life Develops", unit: "" },
  { id: "fi", symbol: "fi", name: "Fraction with Intelligence", unit: "" },
  { id: "fc", symbol: "fc", name: "Fraction with Detectable Technology", unit: "" },
  { id: "L", symbol: "L", name: "Civilization Longevity", unit: "years" },
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

interface DrakeSummaryTemplateProps {
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
    description: "Fewer than one civilization expected. We may be alone in the galaxy.",
  };
  if (n < 10) return {
    label: "Lonely",
    description: "A handful of civilizations might exist. Contact would be extremely rare.",
  };
  if (n < 100) return {
    label: "Sparse",
    description: "Dozens of civilizations. Contact is possible but requires patience.",
  };
  if (n < 1000) return {
    label: "Moderate",
    description: "Hundreds of civilizations. Regional groupings become possible.",
  };
  if (n < 10000) return {
    label: "Crowded",
    description: "Thousands of civilizations. Alliances and conflicts become common.",
  };
  return {
    label: "Teeming",
    description: "A galaxy full of life. Civilizations encounter each other regularly.",
  };
};

const DrakeSummaryTemplate = ({
  formState,
  worldName,
  date,
}: DrakeSummaryTemplateProps) => {
  const N = calculateN(formState.values);
  const interpretation = getInterpretation(N);

  // Get first non-empty worldbuilding note for summary
  const summaryNote =
    formState.worldbuilding.fermiAnswer ||
    formState.worldbuilding.galaxyCharacter ||
    "";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Drake Equation Calculator"
          worldName={worldName}
          date={date}
        />

        {/* Main Result */}
        <PDFResultBox
          value={formatNumber(N)}
          label={interpretation.label}
          description={interpretation.description}
        />

        {/* Equation Display */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: typography.sizes.sm,
              color: colors.text.secondary,
              textAlign: "center",
              marginBottom: spacing.xs,
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
            N = {formState.values.rStar} × {formState.values.fp} ×{" "}
            {formState.values.ne} × {formState.values.fl} ×{" "}
            {formState.values.fi} × {formState.values.fc} ×{" "}
            {formatNumber(formState.values.L)} = {formatNumber(N)}
          </Text>
        </View>

        {/* Variables Table */}
        <PDFSection title="Variable Values">
          {DRAKE_VARIABLES.map((variable) => (
            <PDFKeyValuePair
              key={variable.id}
              label={`${variable.symbol} — ${variable.name}`}
              value={
                variable.id === "L"
                  ? formatNumber(
                      formState.values[variable.id as keyof typeof formState.values]
                    )
                  : formState.values[variable.id as keyof typeof formState.values]
              }
              unit={variable.unit}
            />
          ))}
        </PDFSection>

        {/* Key Worldbuilding Notes */}
        {summaryNote && (
          <PDFSection title="Key Notes">
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{summaryNote}</Text>
            </View>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default DrakeSummaryTemplate;
