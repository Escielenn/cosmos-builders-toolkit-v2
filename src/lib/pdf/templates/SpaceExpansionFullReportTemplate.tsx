import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import type { FormState, ForceCategory, ExpansionPhaseId } from "@/lib/space-expansion-data";
import {
  FORCE_CATEGORIES,
  TRAJECTORY_OPTIONS,
  getForceDef,
  getModifierDef,
  getInteractionDef,
  getForceConfig,
  getConsequenceMatrix,
  generateForcePairs,
} from "@/lib/space-expansion-data";

interface Props {
  formState: FormState;
  worldName?: string | null;
}

const SpaceExpansionFullReportTemplate = ({ formState, worldName }: Props) => {
  const data = deepStripHtml(formState) as unknown as FormState;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reachedPhases = data.phases?.filter((p) => p.reached) || [];
  const forcePairs = generateForcePairs();
  const trajectoryLabel = TRAJECTORY_OPTIONS.find(
    (t) => t.value === data.synthesis?.overallTrajectory
  )?.label;
  const dominantForceLabel = data.synthesis?.dominantForce
    ? getForceDef(data.synthesis.dominantForce as ForceCategory)?.name
    : null;

  return (
    <Document>
      {/* ── Page 1: Foundation & Phases ── */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Exodus, Full Report"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="Foundation">
          <View style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 120 }}>
                Scenario Name:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
                {data.foundation?.expansionName || "Not specified"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 120 }}>
                Origin:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
                {data.foundation?.originCivilization || "Not specified"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 120 }}>
                Start Year:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
                {data.foundation?.startYear || "Not specified"}
              </Text>
            </View>
          </View>

          {data.foundation?.oneBigLie && (
            <View style={{ ...styles.notesBox, marginBottom: spacing.md }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs }}>
                The One Big Lie
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.foundation.oneBigLie}
              </Text>
            </View>
          )}

          {data.foundation?.startingConditions && (
            <View>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, marginBottom: spacing.xs }}>
                Starting Conditions:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.foundation.startingConditions}
              </Text>
            </View>
          )}
        </PDFSection>

        <PDFSection title="Expansion Phases">
          {data.phases?.map((phase, idx) => (
            <View key={phase.id} style={{ marginBottom: spacing.md }} wrap={false}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 700, color: phase.reached ? colors.text.primary : colors.text.muted }}>
                  {idx + 1}. {phase.name}
                </Text>
                {!phase.reached && (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                    (Not yet reached)
                  </Text>
                )}
              </View>
              {phase.reached && (
                <View style={{ marginLeft: spacing.md }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xs }}>
                    {phase.yearReached && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                        Year: {phase.yearReached}
                      </Text>
                    )}
                    {phase.infrastructureLevel && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, textTransform: "capitalize" }}>
                        Level: {phase.infrastructureLevel}
                      </Text>
                    )}
                    {phase.population && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                        Pop: {phase.population}
                      </Text>
                    )}
                    {phase.selfSufficiency > 0 && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                        Self-sufficiency: {phase.selfSufficiency}%
                      </Text>
                    )}
                  </View>
                  {phase.milestone && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginBottom: spacing.xs }}>
                      Milestone: {phase.milestone}
                    </Text>
                  )}
                  {phase.description && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                      {phase.description}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* ── Page 2+: Force Configurations Per Reached Phase ── */}
      {reachedPhases.map((phase) => (
        <Page key={phase.id} size="LETTER" style={styles.page}>
          <PDFHeader
            toolName="Exodus, Full Report"
            worldName={worldName}
            date={date}
            hideLogo
          />

          <PDFSection title={`Forces at ${phase.name}`}>
            {FORCE_CATEGORIES.map((forceDef) => {
              const force = getForceConfig(data.forces || [], phase.id, forceDef.id);
              if (!force) return null;
              return (
                <View key={forceDef.id} style={{ marginBottom: spacing.md }} wrap={false}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
                    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                      {forceDef.name}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                      {force.intensity}%, {force.direction}
                    </Text>
                  </View>
                  {force.keyActors && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md, marginBottom: spacing.xs }}>
                      Key Actors: {force.keyActors}
                    </Text>
                  )}
                  {force.dependencies && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md, marginBottom: spacing.xs }}>
                      Dependencies: {force.dependencies}
                    </Text>
                  )}
                  {force.description && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.md }}>
                      {force.description}
                    </Text>
                  )}
                </View>
              );
            })}
          </PDFSection>

          <PDFFooter />
        </Page>
      ))}

      {/* ── Page: Modifiers ── */}
      {data.modifiers?.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader
            toolName="Exodus, Full Report"
            worldName={worldName}
            date={date}
            hideLogo
          />

          <PDFSection title="Expansion Modifiers">
            {data.modifiers.map((mod, idx) => {
              const modDef = getModifierDef(mod.type as never);
              return (
                <View key={idx} style={{ marginBottom: spacing.md }} wrap={false}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {modDef?.name || mod.type}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary, marginLeft: spacing.sm }}>
                      {mod.name || "Unnamed"}
                    </Text>
                    {mod.yearOccurred && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                        ({mod.yearOccurred})
                      </Text>
                    )}
                    {mod.severity && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm, textTransform: "capitalize" }}>
                        [{mod.severity}]
                      </Text>
                    )}
                  </View>
                  {mod.description && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md, marginBottom: spacing.xs }}>
                      {mod.description}
                    </Text>
                  )}
                  {mod.impact && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md, marginBottom: spacing.xs }}>
                      Impact: {mod.impact}
                    </Text>
                  )}
                  {mod.resolution && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.md }}>
                      Resolution: {mod.resolution}
                    </Text>
                  )}
                </View>
              );
            })}
          </PDFSection>

          <PDFFooter />
        </Page>
      )}

      {/* ── Page: Consequence Matrix (one per reached phase) ── */}
      {reachedPhases.map((phase) => {
        const matrix = getConsequenceMatrix(data.consequenceMatrices || [], phase.id);
        if (!matrix) return null;
        const filledCells = matrix.cells.filter((c) => c.interaction && c.interaction !== "");
        if (filledCells.length === 0) return null;

        return (
          <Page key={`matrix-${phase.id}`} size="LETTER" style={styles.page}>
            <PDFHeader
              toolName="Exodus, Full Report"
              worldName={worldName}
              date={date}
              hideLogo
            />

            <PDFSection title={`Consequence Matrix: ${phase.name}`}>
              {filledCells.map((cell, idx) => {
                const defA = getForceDef(cell.forceA);
                const defB = getForceDef(cell.forceB);
                const interDef = getInteractionDef(cell.interaction);
                return (
                  <View key={idx} style={{ marginBottom: spacing.sm }} wrap={false}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
                      <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary }}>
                        {defA.name} × {defB.name}
                      </Text>
                      <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginLeft: spacing.sm, textTransform: "uppercase" }}>
                        {interDef?.label || cell.interaction}
                      </Text>
                    </View>
                    {cell.description && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md }}>
                        {cell.description}
                      </Text>
                    )}
                    {cell.narrativeHook && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.md, fontStyle: "italic" }}>
                        Story Hook: {cell.narrativeHook}
                      </Text>
                    )}
                  </View>
                );
              })}
            </PDFSection>

            <PDFFooter />
          </Page>
        );
      })}

      {/* ── Page: Synthesis ── */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Exodus, Full Report"
          worldName={worldName}
          date={date}
          hideLogo
        />

        <PDFSection title="Synthesis">
          <View style={{ marginBottom: spacing.md }}>
            {dominantForceLabel && (
              <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 130 }}>
                  Dominant Force:
                </Text>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                  {dominantForceLabel}
                </Text>
              </View>
            )}
            {trajectoryLabel && (
              <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 130 }}>
                  Overall Trajectory:
                </Text>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                  {trajectoryLabel}
                </Text>
              </View>
            )}
            {data.synthesis?.biggestTensionPoint && (
              <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 130 }}>
                  Biggest Tension:
                </Text>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
                  {data.synthesis.biggestTensionPoint}
                </Text>
              </View>
            )}
          </View>

          {data.synthesis?.narrativeTheme && (
            <View style={{ ...styles.notesBox, marginBottom: spacing.md }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs }}>
                Narrative Theme
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.synthesis.narrativeTheme}
              </Text>
            </View>
          )}

          {data.synthesis?.storyHooks && (
            <View style={styles.notesBox}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs }}>
                Story Hooks
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.synthesis.storyHooks}
              </Text>
            </View>
          )}
        </PDFSection>

        {/* General Notes */}
        {data.generalNotes && (
          <PDFSection title="Notes">
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
              {data.generalNotes}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpaceExpansionFullReportTemplate;
