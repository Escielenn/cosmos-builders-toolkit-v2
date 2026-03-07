import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateLexDrift } from "@/lib/lexdrift/calculations";
import type { FormStateForCalc } from "@/lib/lexdrift/calculations";
import { STARTING_LANGUAGES, ISOLATION_LEVELS, EDUCATION_POLICIES, MEDIA_ACCESS_LEVELS } from "@/lib/lexdrift/data";

interface Props {
  formState: FormStateForCalc & {
    storyNotes?: {
      linguisticIdentity?: string;
      firstContact?: string;
      culturalPreservation?: string;
      generationalShift?: string;
    };
    generalNotes?: string;
    [key: string]: unknown;
  };
  worldName?: string;
  date?: string;
}

const LexDriftSummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateLexDrift(data as unknown as FormStateForCalc);

  const languageNames = (data?.linguistic?.selectedLanguages || [])
    .map((id: string) => STARTING_LANGUAGES.find((l) => l.id === id)?.label || id)
    .join(", ");

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Lexdrift: Language Evolution"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Mission Parameters */}
        <PDFSection title="Mission Parameters">
          <PDFKeyValuePair label="Duration" value={`${data?.mission?.duration || 0} years`} />
          <PDFKeyValuePair label="Population" value={`${(data?.mission?.population || 0).toLocaleString()}`} />
          <PDFKeyValuePair
            label="Isolation"
            value={ISOLATION_LEVELS.find((l) => l.id === data?.mission?.isolation)?.label || "Not specified"}
          />
        </PDFSection>

        {/* Linguistic Config */}
        <PDFSection title="Linguistic Configuration">
          <PDFKeyValuePair label="Starting Languages" value={languageNames || "Not specified"} />
          <PDFKeyValuePair
            label="Education Policy"
            value={EDUCATION_POLICIES.find((p) => p.id === data?.social?.educationPolicy)?.label || "Not specified"}
          />
          <PDFKeyValuePair
            label="Media Access"
            value={MEDIA_ACCESS_LEVELS.find((l) => l.id === data?.social?.mediaAccess)?.label || "Not specified"}
          />
          <PDFKeyValuePair
            label="Identity Pressure"
            value={`${data?.social?.identityPressure || 0}%`}
          />
        </PDFSection>

        {/* Results */}
        {result.valid && (
          <>
            <PDFResultBox
              label="Language Divergence"
              value={`${result.divergencePercent.toFixed(1)}%`}
            />

            <PDFSection title="Predicted Outcomes">
              <PDFKeyValuePair label="Status" value={result.severityLabel} />
              <PDFKeyValuePair label="Mutual Intelligibility" value={`${result.intelligibilityPercent.toFixed(0)}%`} />
              <PDFKeyValuePair label="Estimated New Terms" value={`~${result.estimatedNewTerms.toLocaleString()}`} />
              <PDFKeyValuePair label="Generations" value={result.generations.toFixed(0)} />
            </PDFSection>

            {result.narrativeSummary && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                  Narrative Summary
                </Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{result.narrativeSummary}</Text>
                </View>
              </View>
            )}
          </>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default LexDriftSummaryTemplate;
