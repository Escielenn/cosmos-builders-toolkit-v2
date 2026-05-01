import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { calculateMetabolicBudget, calculatePerceptionGaps } from "@/lib/sensorium/calculations";
import { getModalityById, SPECTRAL_PRESETS, ATMOSPHERE_PRESETS, MODALITY_CATEGORIES } from "@/lib/sensorium/data";
import type { SensoriumFormState } from "@/lib/sensorium/types";

interface Props {
  formState: SensoriumFormState & { [key: string]: unknown };
  worldName?: string;
  date?: string;
}

const SensoriumSummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState) as unknown as SensoriumFormState;

  const starPreset = SPECTRAL_PRESETS.find((p) => p.id === data?.environment?.star?.preset);
  const atmoPreset = ATMOSPHERE_PRESETS.find((p) => p.id === data?.environment?.atmosphere?.preset);
  const selectedIds = data?.finalSelection || [];
  const budget = calculateMetabolicBudget(selectedIds);
  const gaps = calculatePerceptionGaps(selectedIds);

  const selectedModalities = selectedIds
    .map((id) => getModalityById(id))
    .filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Sensorium, Alien Sensory Systems"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Species Name */}
        {data?.speciesName && (
          <PDFSection title="Species">
            <PDFKeyValuePair label="Species Name" value={data.speciesName} />
            <PDFKeyValuePair label="Mode" value={data.mode === "derive" ? "Derive (environment → senses)" : "Validate (senses → assessment)"} />
          </PDFSection>
        )}

        {/* Environment Overview */}
        <PDFSection title="Environment Configuration">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Star Type" value={starPreset?.label || data?.environment?.star?.preset || "-"} />
              <PDFKeyValuePair label="Peak Wavelength" value={`${data?.environment?.star?.peakWavelength || "-"} nm`} />
              <PDFKeyValuePair label="UV Output" value={data?.environment?.star?.uvOutput || "-"} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Atmosphere" value={atmoPreset?.label || "Custom"} />
              <PDFKeyValuePair label="Pressure" value={`${data?.environment?.atmosphere?.pressure ?? "-"} atm`} />
              <PDFKeyValuePair label="Medium" value={data?.environment?.medium?.type || "-"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Magnetic Field" value={data?.environment?.magneticField?.present ? `Yes (${data.environment.magneticField.strength})` : "None"} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Day/Night Cycle" value={data?.environment?.lighting?.tidallyLocked ? "Tidally locked" : data?.environment?.lighting?.dayNightCycle ? "Yes" : "No"} />
            </View>
          </View>
        </PDFSection>

        {/* Selected Senses */}
        {selectedModalities.length > 0 && (
          <PDFSection title={`Selected Senses (${selectedModalities.length})`}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {selectedModalities.map((mod) => {
                if (!mod) return null;
                const cat = MODALITY_CATEGORIES.find((c) => c.id === mod.category);
                return (
                  <View
                    key={mod.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      minWidth: 140,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      color: cat?.color || colors.primary,
                      fontWeight: 600,
                    }}>
                      ●
                    </Text>
                    <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                      {mod.name}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                      ({mod.evolution.metabolicCost})
                    </Text>
                  </View>
                );
              })}
            </View>
          </PDFSection>
        )}

        {/* Metabolic Budget */}
        {selectedIds.length > 0 && (
          <PDFSection title="Metabolic Budget">
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.sizes.lg,
                fontWeight: 700,
                color: budget.overBudget ? "#E74C3C" : budget.totalCost > budget.warningThreshold ? "#FFA500" : colors.primary,
              }}>
                {(budget.totalCost * 100).toFixed(0)}%
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>
                of metabolic capacity ({budget.overBudget ? "OVER BUDGET" : budget.totalCost > budget.warningThreshold ? "Warning" : "Sustainable"})
              </Text>
            </View>
          </PDFSection>
        )}

        {/* Perception Gaps */}
        {selectedIds.length > 0 && (
          <PDFSection title="Perception Gaps (vs. Human Baseline)">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                  Species Perceives (Humans Don't)
                </Text>
                {gaps.speciesPerceives.length > 0 ? gaps.speciesPerceives.map((name) => (
                  <Text key={name} style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginBottom: 2 }}>
                    + {name}
                  </Text>
                )) : (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>None</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: "#E74C3C", marginBottom: spacing.xs }}>
                  Species Blind (Humans Have)
                </Text>
                {gaps.speciesBlind.length > 0 ? gaps.speciesBlind.map((name) => (
                  <Text key={name} style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginBottom: 2 }}>
                    − {name}
                  </Text>
                )) : (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>None</Text>
                )}
              </View>
            </View>
          </PDFSection>
        )}

        {/* Dominant Sense */}
        {data?.perceptionProfile?.dominantSense && (
          <PDFSection title="Perception Profile">
            <PDFKeyValuePair label="Dominant Sense" value={getModalityById(data.perceptionProfile.dominantSense)?.name || data.perceptionProfile.dominantSense} />
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SensoriumSummaryTemplate;
