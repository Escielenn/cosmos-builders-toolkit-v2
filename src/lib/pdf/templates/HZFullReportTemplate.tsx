import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateHabitableZone } from "@/lib/habitable-zone/calculations";
import type { FormStateForCalc } from "@/lib/habitable-zone/calculations";

interface Props {
  formState: FormStateForCalc & {
    storyNotes?: {
      starDescription?: string;
      planetSetting?: string;
      habitabilityNarrative?: string;
      worldbuildingNotes?: string;
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

const CATEGORY_LABELS: Record<string, string> = {
  climate: "Climate",
  biology: "Biology",
  culture: "Culture",
  technology: "Technology",
};

const HZFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateHabitableZone(data as unknown as FormStateForCalc);

  return (
    <Document>
      {/* Page 1: Star Parameters + HZ Boundaries */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Goldilocks" worldName={worldName} date={date} />

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "The first domino in the cascading framework: orbital position shapes climate, which shapes biology, psychology, mythology, culture."
          </Text>
        </View>

        <PDFSection title="1. Star Parameters">
          <PDFKeyValuePair
            label="Spectral Type"
            value={data?.star?.spectralType || "Not specified"}
          />
          <PDFKeyValuePair
            label="Mass"
            value={data?.star?.mass ? `${data.star.mass.toFixed(3)} M\u2609` : "Not specified"}
          />
          <PDFKeyValuePair
            label="Luminosity"
            value={data?.star?.luminosity ? `${data.star.luminosity.toFixed(6)} L\u2609` : "Not specified"}
          />
          <PDFKeyValuePair
            label="Temperature"
            value={data?.star?.temperature ? `${Math.round(data.star.temperature)} K` : "Not specified"}
          />
          <PDFKeyValuePair
            label="Auto-Luminosity"
            value={data?.star?.autoLuminosity ? "Yes (derived from mass)" : "No (manual)"}
          />
        </PDFSection>

        <PDFSection title="2. Habitable Zone Boundaries">
          <PDFKeyValuePair label="Recent Venus (optimistic inner)" value={result.innerEdgeRecentVenusFormatted} />
          <PDFKeyValuePair label="Runaway Greenhouse (conservative inner)" value={result.innerEdgeRunawayFormatted} />
          <PDFKeyValuePair label="Maximum Greenhouse (conservative outer)" value={result.outerEdgeMaxGreenhouseFormatted} />
          <PDFKeyValuePair label="Early Mars (optimistic outer)" value={result.outerEdgeEarlyMarsFormatted} />
          <PDFKeyValuePair label="Snowline (frost line)" value={result.snowlineFormatted} />

          <View style={{ marginTop: spacing.md }}>
            <PDFKeyValuePair label="Conservative HZ Width" value={result.conservativeWidthFormatted} />
            <PDFKeyValuePair label="Optimistic HZ Width" value={result.optimisticWidthFormatted} />
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Planet Analysis + Narrative */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Goldilocks" worldName={worldName} date={date} />

        {result.valid && (
          <PDFResultBox
            label={`Zone Classification: ${result.zoneName}`}
            value={result.estimatedSurfaceTempFormatted}
            description={`Est. Surface Temperature (Eq: ${result.equilibriumTempFormatted}, +${data?.planet?.greenhouseWarming ?? 33} K greenhouse)`}
          />
        )}

        <PDFSection title="3. Planet Analysis">
          <PDFKeyValuePair label="Planet Name" value={data?.planet?.name || "Unnamed"} />
          <PDFKeyValuePair label="Orbital Distance" value={`${data?.planet?.orbitalDistance?.toFixed(4)} AU`} />
          <PDFKeyValuePair label="Equilibrium Temperature" value={result.equilibriumTempFormatted} />
          <PDFKeyValuePair label="Est. Surface Temperature" value={result.estimatedSurfaceTempFormatted} />
          <PDFKeyValuePair label="Greenhouse Warming" value={`+${data?.planet?.greenhouseWarming ?? 33} K`} />
          <PDFKeyValuePair label="Stellar Flux" value={`${result.stellarFluxFormatted} (Earth = 1.0)`} />
          <PDFKeyValuePair label="Orbital Period (Year Length)" value={result.orbitalPeriodFormatted} />
          {result.percentThroughHZ >= 0 && (
            <PDFKeyValuePair label="Position in HZ" value={`${Math.round(result.percentThroughHZ)}% (inner to outer)`} />
          )}
        </PDFSection>

        {/* Zone Description */}
        {result.valid && result.zoneDescription && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
              Zone Analysis
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{result.zoneDescription}</Text>
            </View>
          </View>
        )}

        {/* Narrative */}
        {result.valid && result.narrativeSummary && (
          <NotesBox label="Narrative Summary" content={result.narrativeSummary} />
        )}

        <PDFFooter />
      </Page>

      {/* Page 3: Worldbuilding Implications */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Goldilocks" worldName={worldName} date={date} />

        <PDFSection title="4. Worldbuilding Implications">
          {result.valid && result.implications.length > 0 ? (
            result.implications.map((impl, i) => (
              <View key={i} style={{ marginBottom: spacing.md }} wrap={false}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                    {impl.title}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                    [{CATEGORY_LABELS[impl.category] || impl.category}]
                  </Text>
                </View>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {impl.description}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>
              No implications available, configure star and planet parameters.
            </Text>
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Story Notes + General Notes */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Goldilocks" worldName={worldName} date={date} />

        <PDFSection title="5. Story Notes">
          <NotesBox label="Star Description" content={data?.storyNotes?.starDescription || ""} />
          <NotesBox label="Planet Setting" content={data?.storyNotes?.planetSetting || ""} />
          <NotesBox label="Habitability Narrative" content={data?.storyNotes?.habitabilityNarrative || ""} />
          <NotesBox label="Worldbuilding Notes" content={data?.storyNotes?.worldbuildingNotes || ""} />
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

export default HZFullReportTemplate;
