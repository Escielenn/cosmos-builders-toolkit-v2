import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateTimeDilation, formatDuration } from "@/lib/time-dilation/calculations";
import type { FormStateForCalc } from "@/lib/time-dilation/calculations";
import { PROPULSION_METHODS } from "@/lib/time-dilation/data";

interface Props {
  formState: FormStateForCalc & {
    storyNotes?: {
      departureMoment?: string;
      timeDilationImpact?: string;
      returnExperience?: string;
      socialConsequences?: string;
    };
    generalNotes?: string;
    [key: string]: unknown;
  };
  worldName?: string;
  date?: string;
}

const TimeDilationSummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateTimeDilation(data as unknown as FormStateForCalc);
  const method = PROPULSION_METHODS.find((m) => m.id === data?.propulsion?.method);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Paradox"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Journey */}
        <PDFSection title="Journey Parameters">
          <PDFKeyValuePair
            label="Route"
            value={
              data?.journey?.originName && data?.journey?.destinationName
                ? `${data.journey.originName} → ${data.journey.destinationName}`
                : "Not specified"
            }
          />
          <PDFKeyValuePair
            label="Distance"
            value={result.valid ? result.distanceFormatted : "Not specified"}
          />
          <PDFKeyValuePair
            label="Round Trip"
            value={data?.roundTrip ? "Yes" : "No"}
          />
        </PDFSection>

        {/* Propulsion */}
        <PDFSection title="Propulsion & Velocity">
          <PDFKeyValuePair
            label="Propulsion Method"
            value={method?.label || data?.propulsion?.method || "Not specified"}
          />
          <PDFKeyValuePair
            label="Velocity Profile"
            value={
              data?.velocityProfile?.mode === "brachistochrone"
                ? `Brachistochrone at ${data?.velocityProfile?.gForce || "1"}g`
                : "Constant velocity"
            }
          />
          {result.valid && (
            <PDFKeyValuePair
              label="Peak Velocity"
              value={
                result.peakVelocityFraction >= 1
                  ? `${result.peakVelocityFraction.toFixed(1)}×c (FTL)`
                  : `${(result.peakVelocityFraction * 100).toFixed(4)}% c`
              }
            />
          )}
        </PDFSection>

        {/* Results */}
        {result.valid && (
          <>
            <PDFResultBox
              label="Lorentz Factor (γ)"
              value={
                result.lorentzFactor < 100
                  ? result.lorentzFactor.toFixed(6)
                  : result.lorentzFactor.toLocaleString(undefined, { maximumFractionDigits: 2 })
              }
            />

            <PDFSection title="Time Dilation Results">
              <PDFKeyValuePair label="Ship Time (Travelers)" value={result.shipTimeFormatted} />
              <PDFKeyValuePair label="Observer Time" value={result.observerTimeFormatted} />
              <PDFKeyValuePair label="Time Difference" value={result.timeDifferenceFormatted} />
              <PDFKeyValuePair
                label="Dilation Severity"
                value={result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
              />
            </PDFSection>

            {/* Narrative */}
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

export default TimeDilationSummaryTemplate;
