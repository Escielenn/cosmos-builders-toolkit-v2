import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateTimeDilation, formatDuration } from "@/lib/time-dilation/calculations";
import type { FormStateForCalc } from "@/lib/time-dilation/calculations";
import { PROPULSION_METHODS, REFERENCE_FRAMES } from "@/lib/time-dilation/data";

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

const NotesBox = ({ label, content }: { label: string; content: string }) => (
  <View style={{ marginBottom: spacing.md }} wrap={false}>
    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
      {label}
    </Text>
    <View style={styles.notesBox}>
      <Text style={styles.notesText}>{content || "Not specified"}</Text>
    </View>
  </View>
);

const TimeDilationFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateTimeDilation(data as unknown as FormStateForCalc);
  const method = PROPULSION_METHODS.find((m) => m.id === data?.propulsion?.method);
  const frame = REFERENCE_FRAMES.find((f) => f.id === data?.referenceFrame?.frame);

  return (
    <Document>
      {/* Page 1: Journey + Propulsion + Velocity */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Paradox" worldName={worldName} date={date} />

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "Every journey costs time. Know what yours will cost."
          </Text>
        </View>

        <PDFSection title="1. Journey Parameters">
          <PDFKeyValuePair
            label="Route"
            value={
              data?.journey?.originName && data?.journey?.destinationName
                ? `${data.journey.originName} → ${data.journey.destinationName}`
                : "Not specified"
            }
          />
          <PDFKeyValuePair label="Distance" value={result.valid ? result.distanceFormatted : "Not specified"} />
          <PDFKeyValuePair label="Round Trip" value={data?.roundTrip ? "Yes" : "No"} />
        </PDFSection>

        <PDFSection title="2. Propulsion System">
          <PDFKeyValuePair label="Method" value={method?.label || "Not specified"} />
          <PDFKeyValuePair
            label="Maximum Velocity"
            value={
              method
                ? method.isAlcubierre
                  ? `${method.maxVelocityC}×c (Superluminal)`
                  : `${(method.maxVelocityC * 100).toFixed(3)}% c`
                : "Not specified"
            }
          />
          {method && <PDFKeyValuePair label="Notes" value={method.note} />}
        </PDFSection>

        <PDFSection title="3. Velocity Profile">
          <PDFKeyValuePair
            label="Profile Mode"
            value={data?.velocityProfile?.mode === "brachistochrone" ? "Brachistochrone (constant acceleration)" : "Constant velocity"}
          />
          {data?.velocityProfile?.mode === "brachistochrone" && (
            <PDFKeyValuePair label="Acceleration" value={`${data?.velocityProfile?.gForce || "1"}g`} />
          )}
          {data?.velocityProfile?.mode === "constant" && result.valid && (
            <PDFKeyValuePair
              label="Travel Velocity"
              value={`${(result.peakVelocityFraction * 100).toFixed(4)}% c`}
            />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Results */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Paradox" worldName={worldName} date={date} />

        {result.valid ? (
          <>
            <PDFResultBox
              label="Lorentz Factor (γ)"
              value={
                result.lorentzFactor < 100
                  ? result.lorentzFactor.toFixed(6)
                  : Math.round(result.lorentzFactor).toLocaleString()
              }
            />

            <PDFSection title="4. Time Dilation Results">
              <PDFKeyValuePair label="Ship Time (Travelers)" value={result.shipTimeFormatted} />
              <PDFKeyValuePair label="Observer Time" value={result.observerTimeFormatted} />
              <PDFKeyValuePair label="Time Difference" value={result.timeDifferenceFormatted} />
              <PDFKeyValuePair
                label="Peak Velocity"
                value={
                  result.peakVelocityFraction >= 1
                    ? `${result.peakVelocityFraction.toFixed(1)}×c (FTL)`
                    : `${(result.peakVelocityFraction * 100).toFixed(4)}% c`
                }
              />
              <PDFKeyValuePair
                label="Dilation Severity"
                value={result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
              />
            </PDFSection>

            {/* Brachistochrone breakdown */}
            {data?.velocityProfile?.mode === "brachistochrone" && result.accelerationPhaseSeconds !== undefined && (
              <PDFSection title="Flight Profile">
                <PDFKeyValuePair label="Acceleration Phase" value={formatDuration(result.accelerationPhaseSeconds)} />
                {result.cruisePhaseSeconds !== undefined && result.cruisePhaseSeconds > 0 && (
                  <PDFKeyValuePair label="Cruise Phase (capped)" value={formatDuration(result.cruisePhaseSeconds)} />
                )}
                <PDFKeyValuePair label="Deceleration Phase" value={formatDuration(result.decelerationPhaseSeconds!)} />
                {result.peakVelocityCapped && (
                  <View style={{ marginTop: spacing.xs }}>
                    <Text style={{ fontSize: typography.sizes.xs, color: "#F59E0B", fontStyle: "italic" }}>
                      Peak velocity was capped at propulsion maximum.
                    </Text>
                  </View>
                )}
              </PDFSection>
            )}
          </>
        ) : (
          <PDFSection title="4. Results">
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>
              {result.error || "No valid calculation—configure journey and propulsion."}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* Page 3: Reference Frame + Narrative + Story Prompts */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Paradox" worldName={worldName} date={date} />

        <PDFSection title="5. Reference Frame">
          <PDFKeyValuePair
            label="Home Clock"
            value={
              data?.referenceFrame?.frame === "custom"
                ? data?.referenceFrame?.customName || "Custom"
                : frame?.label || "Earth Standard Time"
            }
          />
        </PDFSection>

        {result.valid && result.narrativeSummary && (
          <NotesBox label="Narrative Summary" content={result.narrativeSummary} />
        )}

        {result.valid && result.storyCallouts.length > 0 && (
          <PDFSection title="Story Prompts">
            {result.storyCallouts.map((callout, i) => (
              <View key={i} style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary, marginBottom: 2 }}>
                  {callout.title}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {callout.prompt}
                </Text>
              </View>
            ))}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* Page 4: Story Notes + General Notes */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Paradox" worldName={worldName} date={date} />

        <PDFSection title="6. Story Notes">
          <NotesBox label="The Departure Moment" content={data?.storyNotes?.departureMoment || ""} />
          <NotesBox label="The Time Gap's Impact" content={data?.storyNotes?.timeDilationImpact || ""} />
          <NotesBox label="The Return / Arrival" content={data?.storyNotes?.returnExperience || ""} />
          <NotesBox label="Social Consequences" content={data?.storyNotes?.socialConsequences || ""} />
        </PDFSection>

        {data?.generalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>General Notes</Text>
            <Text style={styles.notesText}>{data.generalNotes}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default TimeDilationFullReportTemplate;
