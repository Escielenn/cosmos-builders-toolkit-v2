import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateSurfaceGravity, formatGravity } from "@/lib/surface-gravity/calculations";
import type { FormStateForCalc } from "@/lib/surface-gravity/calculations";
import { COMPOSITION_PRESETS, CASCADE_CONTENT, getGravityRegimeInfo } from "@/lib/surface-gravity/data";

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

const SurfaceGravityFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState);
  const result = calculateSurfaceGravity(data as unknown as FormStateForCalc);
  const composition = COMPOSITION_PRESETS.find((p) => p.id === data?.primary?.compositionPreset);

  return (
    <Document>
      {/* Page 1: Parameters & Core Results */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Atlas"
          worldName={worldName}
          date={date}
          hideLogo
        />

        <PDFSection title="Planet Parameters">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Mass" value={`${data?.primary?.mass?.toFixed(3) || "—"} M⊕ (${result.massKg.toExponential(3)} kg)`} />
              <PDFKeyValuePair label="Radius" value={`${data?.primary?.radius?.toFixed(3) || "—"} R⊕ (${result.radiusKm.toFixed(0)} km)`} />
              <PDFKeyValuePair label="Composition" value={composition?.label || "Custom"} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Surface Temperature" value={`${data?.advanced?.surfaceTemp || 288} K`} />
              <PDFKeyValuePair label="Mean Density" value={`${result.meanDensity.toFixed(2)} g/cm³ (${result.densityRatio.toFixed(2)}× Earth)`} />
            </View>
          </View>
        </PDFSection>

        {result.valid && (
          <>
            <PDFSection title="Core Results">
              <PDFResultBox
                label="Surface Gravity"
                value={formatGravity(result.gravity)}
                subtitle={`${result.gravityMs2.toFixed(2)} m/s² — ${result.regimeLabel}`}
              />
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <PDFKeyValuePair label="Escape Velocity" value={`${result.escapeVelocity.toFixed(2)} km/s`} />
                  <PDFKeyValuePair label="Orbital Velocity" value={`${result.orbitalVelocity.toFixed(2)} km/s`} />
                </View>
                <View style={{ flex: 1 }}>
                  <PDFKeyValuePair label="Δv to Orbit" value={`${result.deltaV.deltaVToOrbit.toFixed(1)} km/s`} />
                  <PDFKeyValuePair label="vs Earth" value={`${result.deltaV.earthComparison.toFixed(2)}×`} />
                </View>
              </View>
            </PDFSection>

            <PDFSection title="Weight Comparisons">
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <PDFKeyValuePair label="70 kg Human Weighs" value={`${result.humanWeight.planetWeightKg.toFixed(1)} kg`} />
                  <PDFKeyValuePair label="2m Drop Time" value={`${result.dropTime.toFixed(2)}s (${result.dropSpeed.toFixed(1)} km/h)`} />
                </View>
                <View style={{ flex: 1 }}>
                  <PDFKeyValuePair label="High Jump (2m on Earth)" value={`${result.jumpHeight.toFixed(2)}m`} />
                  <PDFKeyValuePair label="Terminal Velocity" value={`~${result.terminalVelocity.toFixed(0)} km/h`} />
                </View>
              </View>
            </PDFSection>
          </>
        )}

        <PDFFooter />
      </Page>

      {/* Page 2: Atmosphere & Delta-V */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Atlas" hideLogo />

        {result.valid && (
          <>
            <PDFSection title="Atmospheric Retention">
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
                Planet retains gas if escape velocity exceeds 6× thermal velocity (Jeans escape parameter λ ≥ 6)
              </Text>
              {result.gasRetention.map((gas) => (
                <View
                  key={gas.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 3,
                    borderBottomWidth: 0.5,
                    borderBottomColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <Text style={{
                    fontSize: typography.sizes.sm,
                    color: gas.status === "retained" ? "#2ECC71" : gas.status === "marginal" ? "#FFA500" : "#E74C3C",
                    width: 14,
                    fontWeight: 600,
                  }}>
                    {gas.status === "retained" ? "✓" : gas.status === "marginal" ? "⚠" : "✗"}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, width: 40 }}>
                    {gas.formula}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, width: 80 }}>
                    {gas.name}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, flex: 1 }}>
                    λ = {gas.escapeParameter.toFixed(1)} — {gas.status}
                  </Text>
                </View>
              ))}
            </PDFSection>

            <PDFSection title="Orbital Access Assessment">
              <PDFResultBox
                label="Δv to Low Orbit"
                value={`${result.deltaV.deltaVToOrbit.toFixed(1)} km/s`}
                subtitle={`${result.deltaV.earthComparison.toFixed(2)}× Earth's 9.4 km/s`}
              />
              <View style={{ marginTop: spacing.sm }}>
                <PDFKeyValuePair label="Verdict" value={result.deltaV.verdict.label} />
                <PDFKeyValuePair label="Chemical Rocket Mass Ratio" value={result.deltaV.massRatio > 10000 ? "Impractical" : `${result.deltaV.massRatio.toFixed(1)}:1`} />
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: spacing.xs }}>
                  {result.deltaV.verdict.description}
                </Text>
              </View>
            </PDFSection>
          </>
        )}

        <PDFFooter />
      </Page>

      {/* Page 3: Worldbuilding Cascade */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Atlas" hideLogo />

        {result.valid && CASCADE_CONTENT.map((category) => {
          const block = category.blocks.find((b) => b.regime === result.gravityRegime) || category.blocks[2];
          const userNotes = data?.cascade?.[category.id as keyof typeof data.cascade];

          return (
            <PDFSection key={category.id} title={`${category.label}: ${block.heading}`}>
              {block.paragraphs.map((p, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: typography.sizes.xs,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                    lineHeight: 1.5,
                  }}
                >
                  {p}
                </Text>
              ))}
              {userNotes && (
                <View style={{ marginTop: spacing.xs, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: 2 }}>Your Notes:</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.primary }}>{userNotes}</Text>
                </View>
              )}
            </PDFSection>
          );
        })}

        <PDFFooter />
      </Page>

      {/* Page 4: Story Notes */}
      {data?.storyNotes && Object.values(data.storyNotes).some((v) => v) && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader toolName="Atlas" hideLogo />

          {data.storyNotes.physicalExperience && (
            <PDFSection title="Physical Experience">
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {data.storyNotes.physicalExperience}
              </Text>
            </PDFSection>
          )}
          {data.storyNotes.dailyLife && (
            <PDFSection title="Daily Life Impact">
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {data.storyNotes.dailyLife}
              </Text>
            </PDFSection>
          )}
          {data.storyNotes.architecture && (
            <PDFSection title="Architectural Consequences">
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {data.storyNotes.architecture}
              </Text>
            </PDFSection>
          )}
          {data.storyNotes.culturalIdentity && (
            <PDFSection title="Cultural Identity">
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {data.storyNotes.culturalIdentity}
              </Text>
            </PDFSection>
          )}
          {data.generalNotes && (
            <PDFSection title="General Notes">
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {data.generalNotes}
              </Text>
            </PDFSection>
          )}

          <PDFFooter />
        </Page>
      )}
    </Document>
  );
};

export default SurfaceGravityFullReportTemplate;
