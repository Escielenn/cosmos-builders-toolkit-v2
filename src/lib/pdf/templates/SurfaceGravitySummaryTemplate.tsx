import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateSurfaceGravity, formatGravity } from "@/lib/surface-gravity/calculations";
import type { FormStateForCalc } from "@/lib/surface-gravity/calculations";
import { COMPOSITION_PRESETS } from "@/lib/surface-gravity/data";

interface Props {
  formState: FormStateForCalc & {
    cascade?: Record<string, string>;
    storyNotes?: Record<string, string>;
    generalNotes?: string;
    [key: string]: unknown;
  };
  worldName?: string;
  date?: string;
}

const SurfaceGravitySummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateSurfaceGravity(data as unknown as FormStateForCalc);
  const composition = COMPOSITION_PRESETS.find((p) => p.id === data?.primary?.compositionPreset);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Atlas"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Planet Parameters */}
        <PDFSection title="Planet Parameters">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Mass" value={`${data?.primary?.mass?.toFixed(3) || "-"} M⊕`} />
              <PDFKeyValuePair label="Radius" value={`${data?.primary?.radius?.toFixed(3) || "-"} R⊕`} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Composition" value={composition?.label || "Custom"} />
              <PDFKeyValuePair label="Surface Temp" value={`${data?.advanced?.surfaceTemp || 288} K`} />
            </View>
          </View>
        </PDFSection>

        {/* Core Results */}
        {result.valid && (
          <PDFSection title="Core Results">
            <PDFResultBox
              label="Surface Gravity"
              value={formatGravity(result.gravity)}
              subtitle={`${result.gravityMs2.toFixed(2)} m/s², ${result.regimeLabel}`}
            />
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Escape Velocity" value={`${result.escapeVelocity.toFixed(2)} km/s`} />
                <PDFKeyValuePair label="Orbital Velocity" value={`${result.orbitalVelocity.toFixed(2)} km/s`} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Mean Density" value={`${result.meanDensity.toFixed(2)} g/cm³`} />
                <PDFKeyValuePair label="Δv to Orbit" value={`${result.deltaV.deltaVToOrbit.toFixed(1)} km/s (${result.deltaV.earthComparison.toFixed(2)}× Earth)`} />
              </View>
            </View>
          </PDFSection>
        )}

        {/* Atmospheric Retention */}
        {result.valid && (
          <PDFSection title="Atmospheric Retention">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {result.gasRetention.map((gas) => (
                <View
                  key={gas.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    minWidth: 120,
                    marginBottom: 4,
                  }}
                >
                  <Text style={{
                    fontSize: typography.sizes.xs,
                    color: gas.status === "retained" ? "#2ECC71" : gas.status === "marginal" ? "#FFA500" : "#E74C3C",
                    fontWeight: 600,
                  }}>
                    {gas.status === "retained" ? "✓" : gas.status === "marginal" ? "⚠" : "✗"}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.primary }}>
                    {gas.formula}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                    ({gas.status})
                  </Text>
                </View>
              ))}
            </View>
          </PDFSection>
        )}

        {/* Delta-V Verdict */}
        {result.valid && (
          <PDFSection title="Orbital Access">
            <PDFKeyValuePair label="Verdict" value={result.deltaV.verdict.label} />
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: spacing.xs }}>
              {result.deltaV.verdict.description}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SurfaceGravitySummaryTemplate;
