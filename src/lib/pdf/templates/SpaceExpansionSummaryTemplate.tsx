import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import type { FormState } from "@/lib/space-expansion-data";
import { getForceDef, getModifierDef, FORCE_CATEGORIES, TRAJECTORY_OPTIONS } from "@/lib/space-expansion-data";

interface Props {
  formState: FormState;
  worldName?: string | null;
}

const SpaceExpansionSummaryTemplate = ({ formState, worldName }: Props) => {
  const data = deepStripHtml(formState) as unknown as FormState;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reachedPhases = data.phases?.filter((p) => p.reached) || [];
  const trajectoryLabel = TRAJECTORY_OPTIONS.find(
    (t) => t.value === data.synthesis?.overallTrajectory
  )?.label;
  const dominantForceLabel = data.synthesis?.dominantForce
    ? getForceDef(data.synthesis.dominantForce as never)?.name
    : null;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Exodus"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Foundation */}
        <PDFSection title="Foundation">
          <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 100 }}>
              Scenario:
            </Text>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
              {data.foundation?.expansionName || "Not specified"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 100 }}>
              Origin:
            </Text>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
              {data.foundation?.originCivilization || "Not specified"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 100 }}>
              Start Year:
            </Text>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, flex: 1 }}>
              {data.foundation?.startYear || "Not specified"}
            </Text>
          </View>
          {data.foundation?.oneBigLie && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                THE ONE BIG LIE
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.foundation.oneBigLie}
              </Text>
            </View>
          )}
        </PDFSection>

        {/* Expansion Phases */}
        <PDFSection title="Expansion Phases">
          {reachedPhases.length > 0 ? (
            reachedPhases.map((phase) => (
              <View key={phase.id} style={{ marginBottom: spacing.sm }} wrap={false}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                    {phase.name}
                  </Text>
                  {phase.yearReached && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                      Year {phase.yearReached}
                    </Text>
                  )}
                  {phase.infrastructureLevel && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, marginLeft: spacing.sm, textTransform: "capitalize" }}>
                      {phase.infrastructureLevel}
                    </Text>
                  )}
                </View>
                {phase.milestone && (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md }}>
                    Milestone: {phase.milestone}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted }}>
              No phases reached yet.
            </Text>
          )}
        </PDFSection>

        {/* Top Forces at Latest Phase */}
        {reachedPhases.length > 0 && (
          <PDFSection title={`Forces at ${reachedPhases[reachedPhases.length - 1].name}`}>
            {FORCE_CATEGORIES.map((forceDef) => {
              const force = data.forces?.find(
                (f) =>
                  f.phaseId === reachedPhases[reachedPhases.length - 1].id &&
                  f.forceCategory === forceDef.id
              );
              if (!force || force.intensity === 0) return null;
              return (
                <View key={forceDef.id} style={{ flexDirection: "row", marginBottom: spacing.xs }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 90 }}>
                    {forceDef.name}:
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.primary, width: 40 }}>
                    {force.intensity}%
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, textTransform: "capitalize" }}>
                    {force.direction}
                  </Text>
                  {force.keyActors && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                      , {force.keyActors}
                    </Text>
                  )}
                </View>
              );
            })}
          </PDFSection>
        )}

        {/* Key Modifiers */}
        {data.modifiers?.length > 0 && (
          <PDFSection title="Key Modifiers">
            {data.modifiers.slice(0, 5).map((mod, idx) => {
              const modDef = getModifierDef(mod.type as never);
              return (
                <View key={idx} style={{ marginBottom: spacing.sm }} wrap={false}>
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
                  </View>
                  {mod.impact && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginLeft: spacing.md }}>
                      {mod.impact}
                    </Text>
                  )}
                </View>
              );
            })}
          </PDFSection>
        )}

        {/* Synthesis */}
        <PDFSection title="Synthesis">
          {dominantForceLabel && (
            <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 120 }}>
                Dominant Force:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {dominantForceLabel}
              </Text>
            </View>
          )}
          {trajectoryLabel && (
            <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, width: 120 }}>
                Trajectory:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {trajectoryLabel}
              </Text>
            </View>
          )}
          {data.synthesis?.biggestTensionPoint && (
            <View style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, marginBottom: spacing.xs }}>
                Biggest Tension:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.synthesis.biggestTensionPoint}
              </Text>
            </View>
          )}
          {data.synthesis?.narrativeTheme && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary, marginBottom: spacing.xs }}>
                Narrative Theme:
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
                {data.synthesis.narrativeTheme}
              </Text>
            </View>
          )}
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpaceExpansionSummaryTemplate;
