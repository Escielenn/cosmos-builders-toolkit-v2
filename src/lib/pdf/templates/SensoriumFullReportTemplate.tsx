import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import {
  calculateMetabolicBudget,
  calculatePerceptionGaps,
  aggregateImplications,
} from "@/lib/sensorium/calculations";
import {
  getModalityById,
  SPECTRAL_PRESETS,
  ATMOSPHERE_PRESETS,
  MODALITY_CATEGORIES,
} from "@/lib/sensorium/data";
import type { SensoriumFormState } from "@/lib/sensorium/types";

interface Props {
  formState: SensoriumFormState & { [key: string]: unknown };
  worldName?: string;
  date?: string;
}

const SensoriumFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState) as unknown as SensoriumFormState;

  const starPreset = SPECTRAL_PRESETS.find((p) => p.id === data?.environment?.star?.preset);
  const atmoPreset = ATMOSPHERE_PRESETS.find((p) => p.id === data?.environment?.atmosphere?.preset);
  const selectedIds = data?.finalSelection || [];
  const budget = calculateMetabolicBudget(selectedIds);
  const gaps = calculatePerceptionGaps(selectedIds);
  const implications = aggregateImplications(selectedIds);

  const selectedModalities = selectedIds
    .map((id) => getModalityById(id))
    .filter(Boolean);

  return (
    <Document>
      {/* Page 1: Environment & Selected Senses */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Sensorium, Full Report"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {data?.speciesName && (
          <PDFSection title="Species">
            <PDFKeyValuePair label="Species Name" value={data.speciesName} />
            <PDFKeyValuePair label="Mode" value={data.mode === "derive" ? "Derive (environment → senses)" : "Validate (senses → assessment)"} />
          </PDFSection>
        )}

        <PDFSection title="Environment Configuration">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Star Type" value={starPreset?.label || data?.environment?.star?.preset || "-"} />
              <PDFKeyValuePair label="Temperature" value={`${data?.environment?.star?.temperature || "-"} K`} />
              <PDFKeyValuePair label="Peak Wavelength" value={`${data?.environment?.star?.peakWavelength || "-"} nm`} />
              <PDFKeyValuePair label="UV Output" value={data?.environment?.star?.uvOutput || "-"} />
              <PDFKeyValuePair label="Luminosity" value={`${data?.environment?.star?.luminosity || "-"} L☉`} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Atmosphere" value={atmoPreset?.label || "Custom"} />
              <PDFKeyValuePair label="Pressure" value={`${data?.environment?.atmosphere?.pressure ?? "-"} atm`} />
              <PDFKeyValuePair label="Opacity" value={data?.environment?.atmosphere?.opacity || "-"} />
              <PDFKeyValuePair label="Medium" value={data?.environment?.medium?.type || "-"} />
              <PDFKeyValuePair label="Conductivity" value={data?.environment?.medium?.conductivity || "-"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Magnetic Field" value={data?.environment?.magneticField?.present ? `${data.environment.magneticField.strength} / ${data.environment.magneticField.stability}` : "None"} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Lighting" value={data?.environment?.lighting?.tidallyLocked ? "Tidally locked" : data?.environment?.lighting?.dayNightCycle ? `Day/night cycle (${data.environment.lighting.seasonalVariation} seasonal)` : "No day/night cycle"} />
            </View>
          </View>
        </PDFSection>

        {/* Selected Senses Table */}
        {selectedModalities.length > 0 && (
          <PDFSection title={`Selected Sensory Modalities (${selectedModalities.length})`}>
            {/* Table header */}
            <View style={{
              flexDirection: "row",
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
              paddingBottom: spacing.xs,
              marginBottom: spacing.xs,
            }}>
              <Text style={{ flex: 2, fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary }}>Sense</Text>
              <Text style={{ flex: 1.5, fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary }}>Category</Text>
              <Text style={{ flex: 1, fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary }}>Cost</Text>
              <Text style={{ flex: 1, fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary }}>Complexity</Text>
            </View>
            {selectedModalities.map((mod) => {
              if (!mod) return null;
              const cat = MODALITY_CATEGORIES.find((c) => c.id === mod.category);
              return (
                <View key={mod.id} style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                  paddingVertical: 3,
                }}>
                  <Text style={{ flex: 2, fontSize: typography.sizes.xs, color: colors.text.primary }}>{mod.name}</Text>
                  <Text style={{ flex: 1.5, fontSize: typography.sizes.xs, color: cat?.color || colors.text.secondary }}>{cat?.label || mod.category}</Text>
                  <Text style={{ flex: 1, fontSize: typography.sizes.xs, color: colors.text.secondary }}>{mod.evolution.metabolicCost} ({(mod.evolution.metabolicWeight * 100).toFixed(0)}%)</Text>
                  <Text style={{ flex: 1, fontSize: typography.sizes.xs, color: colors.text.secondary }}>{mod.evolution.complexity}</Text>
                </View>
              );
            })}
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
                fontSize: typography.sizes.xl,
                fontWeight: 700,
                color: budget.overBudget ? "#E74C3C" : budget.totalCost > budget.warningThreshold ? "#FFA500" : colors.primary,
              }}>
                {(budget.totalCost * 100).toFixed(0)}%
              </Text>
              <View>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>
                  of metabolic capacity used
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                  {budget.overBudget ? "Over budget, requires extraordinary justification" : budget.totalCost > budget.warningThreshold ? "Approaching limit, metabolically expensive" : "Within sustainable range"}
                </Text>
              </View>
            </View>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* Page 2: Modality Details */}
      {selectedModalities.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader toolName="Sensorium, Modality Details" hideLogo />

          {selectedModalities.map((mod) => {
            if (!mod) return null;
            return (
              <PDFSection key={mod.id} title={mod.name}>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 1.5 }}>
                  {mod.description}
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    {mod.spectrumRange && <PDFKeyValuePair label="Range" value={mod.spectrumRange} />}
                    <PDFKeyValuePair label="Evolution Time" value={mod.evolution.evolutionTime} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PDFKeyValuePair label="Earth Analogs" value={mod.evolution.earthAnalogs.join(", ")} />
                  </View>
                </View>
              </PDFSection>
            );
          })}

          <PDFFooter />
        </Page>
      )}

      {/* Page 3: Worldbuilding Implications */}
      {selectedIds.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader toolName="Sensorium, Worldbuilding Implications" hideLogo />

          {Object.entries(implications).map(([category, entries]) => {
            if (entries.length === 0) return null;
            const label = category.charAt(0).toUpperCase() + category.slice(1);
            return (
              <PDFSection key={category} title={label}>
                {entries.map((entry, i) => (
                  <View key={i} style={{
                    marginBottom: spacing.xs,
                    paddingLeft: spacing.sm,
                    borderLeftWidth: 2,
                    borderLeftColor: colors.borderLight,
                  }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary }}>
                      {entry.modalityName}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                      {entry.text}
                    </Text>
                  </View>
                ))}

                {/* User notes for this worldbuilding category */}
                {data?.worldbuildingNotes && (data.worldbuildingNotes as Record<string, string>)[`${category}Notes`] && (
                  <View style={{ marginTop: spacing.xs, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: 2 }}>Your Notes:</Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.primary }}>
                      {(data.worldbuildingNotes as Record<string, string>)[`${category}Notes`]}
                    </Text>
                  </View>
                )}
              </PDFSection>
            );
          })}

          <PDFFooter />
        </Page>
      )}

      {/* Page 4: Perception Gaps + Profile + Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Sensorium, Perception & Synthesis" hideLogo />

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
            {gaps.conflictPotential.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: "#FFA500", marginBottom: spacing.xs }}>
                  Conflict Potential
                </Text>
                {gaps.conflictPotential.map((hook, i) => (
                  <Text key={i} style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginBottom: 2 }}>
                    • {hook}
                  </Text>
                ))}
              </View>
            )}
          </PDFSection>
        )}

        {/* Perception Profile */}
        {data?.perceptionProfile?.dominantSense && (
          <PDFSection title="Perception Profile">
            <PDFKeyValuePair label="Dominant Sense" value={getModalityById(data.perceptionProfile.dominantSense)?.name || data.perceptionProfile.dominantSense} />
            {data.perceptionProfile.sensoryHierarchy && (
              <View style={{ marginTop: spacing.xs }}>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: 2 }}>Sensory Hierarchy:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {data.perceptionProfile.sensoryHierarchy}
                </Text>
              </View>
            )}
            {data.perceptionProfile.perceptionNotes && (
              <View style={{ marginTop: spacing.xs }}>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: 2 }}>Notes:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {data.perceptionProfile.perceptionNotes}
                </Text>
              </View>
            )}
          </PDFSection>
        )}

        {/* Synthesis */}
        {data?.synthesis?.narrativeSummary && (
          <PDFSection title="Narrative Summary">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
              {data.synthesis.narrativeSummary}
            </Text>
          </PDFSection>
        )}
        {data?.synthesis?.storyHooks && (
          <PDFSection title="Story Hooks">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
              {data.synthesis.storyHooks}
            </Text>
          </PDFSection>
        )}
        {data?.synthesis?.integrationNotes && (
          <PDFSection title="Integration Notes">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
              {data.synthesis.integrationNotes}
            </Text>
          </PDFSection>
        )}

        {/* General Notes */}
        {data?.generalNotes && (
          <PDFSection title="General Notes">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
              {data.generalNotes}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SensoriumFullReportTemplate;
