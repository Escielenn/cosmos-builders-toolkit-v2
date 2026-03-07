import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateLexDrift } from "@/lib/lexdrift/calculations";
import type { FormStateForCalc } from "@/lib/lexdrift/calculations";
import {
  STARTING_LANGUAGES,
  ISOLATION_LEVELS,
  EDUCATION_POLICIES,
  MEDIA_ACCESS_LEVELS,
  SAMPLE_ORIGINAL,
  SAMPLE_TRANSFORMATIONS,
} from "@/lib/lexdrift/data";

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

const NotesBox = ({ label, content }: { label: string; content: string }) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
      {label}
    </Text>
    <View style={styles.notesBox}>
      <Text style={styles.notesText}>{content || "Not specified"}</Text>
    </View>
  </View>
);

const LexDriftFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateLexDrift(data as unknown as FormStateForCalc);

  const languageNames = (data?.linguistic?.selectedLanguages || [])
    .map((id: string) => STARTING_LANGUAGES.find((l) => l.id === id)?.label || id)
    .join(", ");

  return (
    <Document>
      {/* Page 1: Parameters */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Lexdrift: Language Evolution" worldName={worldName} date={date} />

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "Isolation is the engine of linguistic divergence."
          </Text>
        </View>

        <PDFSection title="1. Mission Parameters">
          <PDFKeyValuePair label="Duration" value={`${data?.mission?.duration || 0} years`} />
          <PDFKeyValuePair label="Population" value={`${(data?.mission?.population || 0).toLocaleString()}`} />
          <PDFKeyValuePair
            label="Isolation Level"
            value={ISOLATION_LEVELS.find((l) => l.id === data?.mission?.isolation)?.label || "Not specified"}
          />
        </PDFSection>

        <PDFSection title="2. Linguistic Configuration">
          <PDFKeyValuePair label="Starting Languages" value={languageNames || "Not specified"} />
          {data?.linguistic?.customLanguage && (
            <PDFKeyValuePair label="Additional Language" value={data.linguistic.customLanguage} />
          )}
          <PDFKeyValuePair
            label="Lingua Franca"
            value={
              data?.linguistic?.linguaFranca === "none"
                ? "None (multilingual equality)"
                : data?.linguistic?.linguaFranca === "constructed"
                  ? "New constructed language"
                  : STARTING_LANGUAGES.find((l) => l.id === data?.linguistic?.linguaFranca)?.label || "Not specified"
            }
          />
          {data?.linguistic?.includeSignLanguage && (
            <PDFKeyValuePair label="Sign Language" value="Included" />
          )}
          {data?.linguistic?.liturgicalPreservation && (
            <PDFKeyValuePair label="Liturgical Preservation" value="Enabled" />
          )}
        </PDFSection>

        <PDFSection title="3. Social Factors">
          <PDFKeyValuePair
            label="Education Policy"
            value={EDUCATION_POLICIES.find((p) => p.id === data?.social?.educationPolicy)?.label || "Not specified"}
          />
          <PDFKeyValuePair
            label="Identity Pressure"
            value={`${data?.social?.identityPressure || 0}%`}
          />
          <PDFKeyValuePair
            label="Media Access"
            value={MEDIA_ACCESS_LEVELS.find((l) => l.id === data?.social?.mediaAccess)?.label || "Not specified"}
          />
          {(data?.social?.contactEvents || []).length > 0 && (
            <PDFKeyValuePair label="Contact Events" value={`${data.social.contactEvents.length} event(s)`} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Results */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Lexdrift: Language Evolution" worldName={worldName} date={date} />

        {result.valid ? (
          <>
            <PDFResultBox
              label="Language Divergence"
              value={`${result.divergencePercent.toFixed(1)}%`}
            />

            <PDFSection title="4. Predicted Outcomes">
              <PDFKeyValuePair label="Status" value={result.severityLabel} />
              <PDFKeyValuePair label="Mutual Intelligibility" value={`${result.intelligibilityPercent.toFixed(0)}% — ${result.intelligibilityDescription}`} />
              <PDFKeyValuePair label="Generations" value={result.generations.toFixed(0)} />
              <PDFKeyValuePair label="Estimated New Terms" value={`~${result.estimatedNewTerms.toLocaleString()}`} />
            </PDFSection>

            <PDFSection title="Sound Changes">
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
                {result.soundChanges}
              </Text>
            </PDFSection>

            <PDFSection title="Grammar Changes">
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
                {result.grammarChanges}
              </Text>
            </PDFSection>

            <PDFSection title="Historical Analogue">
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary, marginBottom: spacing.xs }}>
                {result.historicalAnalogue.title} ({result.historicalAnalogue.period})
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
                {result.historicalAnalogue.description}
              </Text>
            </PDFSection>

            {/* Modifier Breakdown */}
            <PDFSection title="Divergence Modifiers">
              <PDFKeyValuePair label="Population" value={`×${result.populationModifier.toFixed(2)}`} />
              <PDFKeyValuePair label="Isolation" value={`×${result.isolationModifier.toFixed(2)}`} />
              <PDFKeyValuePair label="Education" value={`×${result.educationModifier.toFixed(2)}`} />
              <PDFKeyValuePair label="Identity" value={`×${result.identityModifier.toFixed(2)}`} />
              <PDFKeyValuePair label="Media" value={`×${result.mediaModifier.toFixed(2)}`} />
              <PDFKeyValuePair label="Combined Modifier" value={`×${result.totalModifier.toFixed(3)}`} />
            </PDFSection>

            {result.liturgicalNote && (
              <PDFSection title="Liturgical Preservation">
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {result.liturgicalNote}
                </Text>
              </PDFSection>
            )}

            {result.signLanguageDivergence !== undefined && (
              <PDFSection title="Sign Language Track">
                <PDFKeyValuePair label="Divergence" value={`${result.signLanguageDivergence.toFixed(1)}%`} />
                <PDFKeyValuePair label="Intelligibility" value={`${result.signLanguageIntelligibility?.toFixed(0)}%`} />
                {result.signLanguageNote && (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, lineHeight: 1.4, marginTop: spacing.xs, fontStyle: "italic" }}>
                    {result.signLanguageNote}
                  </Text>
                )}
              </PDFSection>
            )}
          </>
        ) : (
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted }}>
            Unable to generate predictions. Please complete all required parameters.
          </Text>
        )}

        <PDFFooter />
      </Page>

      {/* Page 3: Samples & Narrative */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Lexdrift: Language Evolution" worldName={worldName} date={date} />

        <PDFSection title="5. Language Samples">
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
            Original (Earth Standard)
          </Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{SAMPLE_ORIGINAL}</Text>
          </View>

          {SAMPLE_TRANSFORMATIONS.map((sample) => (
            <View key={sample.years} style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, marginBottom: 2 }}>
                {sample.label}
              </Text>
              <View style={styles.notesBox}>
                <Text style={{ ...styles.notesText, fontFamily: "Courier" }}>{sample.text}</Text>
              </View>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, fontStyle: "italic", marginTop: 2 }}>
                {sample.notes}
              </Text>
            </View>
          ))}
        </PDFSection>

        {result.valid && result.narrativeSummary && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Narrative Summary
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{result.narrativeSummary}</Text>
            </View>
          </View>
        )}

        <PDFFooter />
      </Page>

      {/* Page 4: Story Notes (if present) */}
      {(data?.storyNotes?.linguisticIdentity || data?.storyNotes?.firstContact || data?.storyNotes?.culturalPreservation || data?.storyNotes?.generationalShift || data?.generalNotes) && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader toolName="Lexdrift: Language Evolution" worldName={worldName} date={date} />

          <PDFSection title="6. Story Notes">
            {data?.storyNotes?.linguisticIdentity && (
              <NotesBox label="Linguistic Identity" content={data.storyNotes.linguisticIdentity} />
            )}
            {data?.storyNotes?.firstContact && (
              <NotesBox label="First Contact Moment" content={data.storyNotes.firstContact} />
            )}
            {data?.storyNotes?.culturalPreservation && (
              <NotesBox label="Cultural Preservation" content={data.storyNotes.culturalPreservation} />
            )}
            {data?.storyNotes?.generationalShift && (
              <NotesBox label="Generational Shift" content={data.storyNotes.generationalShift} />
            )}
            {data?.generalNotes && (
              <NotesBox label="General Notes" content={data.generalNotes} />
            )}
          </PDFSection>

          <PDFFooter />
        </Page>
      )}

      {/* Page 5: Multi-Ship Results (if present) */}
      {result.valid && result.shipResults && result.shipResults.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader toolName="Lexdrift: Language Evolution" worldName={worldName} date={date} />

          <PDFSection title="7. Multi-Ship Analysis">
            {result.shipResults.map((sr, i) => (
              <View key={i} style={{ marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary, marginBottom: spacing.xs }}>
                  {sr.shipName} (Departs Year {sr.departureYear})
                </Text>
                <PDFKeyValuePair label="Divergence from Earth" value={`${sr.divergenceFromEarth.toFixed(1)}%`} />
                <PDFKeyValuePair label="Inter-Ship Intelligibility" value={`${sr.intelligibilityWithPrimary.toFixed(0)}%`} />
                <PDFKeyValuePair label="Creole Potential" value={sr.creolePotential ? "Yes" : "No"} />
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, lineHeight: 1.4, marginTop: spacing.xs }}>
                  {sr.note}
                </Text>
              </View>
            ))}
          </PDFSection>

          <PDFFooter />
        </Page>
      )}
    </Document>
  );
};

export default LexDriftFullReportTemplate;
