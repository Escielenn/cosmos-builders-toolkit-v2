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

const HZSummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateHabitableZone(data as unknown as FormStateForCalc);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Goldilocks"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Star Parameters */}
        <PDFSection title="Star Parameters">
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
        </PDFSection>

        {/* Zone Classification */}
        {result.valid && (
          <PDFResultBox
            label={`Zone: ${result.zoneName}`}
            value={result.estimatedSurfaceTempFormatted}
            description={`Est. Surface Temperature (Eq: ${result.equilibriumTempFormatted}, +${data?.planet?.greenhouseWarming ?? 33} K greenhouse)`}
          />
        )}

        {/* HZ Boundaries */}
        {result.valid && (
          <PDFSection title="Habitable Zone Boundaries">
            <PDFKeyValuePair label="Recent Venus (optimistic inner)" value={result.innerEdgeRecentVenusFormatted} />
            <PDFKeyValuePair label="Runaway Greenhouse (conservative)" value={result.innerEdgeRunawayFormatted} />
            <PDFKeyValuePair label="Maximum Greenhouse (conservative)" value={result.outerEdgeMaxGreenhouseFormatted} />
            <PDFKeyValuePair label="Early Mars (optimistic outer)" value={result.outerEdgeEarlyMarsFormatted} />
            <PDFKeyValuePair label="Snowline" value={result.snowlineFormatted} />
          </PDFSection>
        )}

        {/* Planet Analysis */}
        {result.valid && (
          <PDFSection title="Planet Analysis">
            <PDFKeyValuePair label="Planet" value={data?.planet?.name || "Unnamed"} />
            <PDFKeyValuePair label="Orbital Distance" value={`${data?.planet?.orbitalDistance?.toFixed(4)} AU`} />
            <PDFKeyValuePair label="Equilibrium Temperature" value={result.equilibriumTempFormatted} />
            <PDFKeyValuePair label="Est. Surface Temperature" value={result.estimatedSurfaceTempFormatted} />
            <PDFKeyValuePair label="Greenhouse Warming" value={`+${data?.planet?.greenhouseWarming ?? 33} K`} />
            <PDFKeyValuePair label="Stellar Flux" value={result.stellarFluxFormatted} />
            <PDFKeyValuePair label="Orbital Period" value={result.orbitalPeriodFormatted} />
          </PDFSection>
        )}

        {/* Narrative */}
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
    </Document>
  );
};

export default HZSummaryTemplate;
