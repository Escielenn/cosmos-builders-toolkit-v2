import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

interface FormState {
  sensoryArchitecture: {
    primaryModalities: string[];
    integrationStyle: string;
    sensoryRange: string;
    cognitionImpact: string;
  };
  physicalForm: {
    bodyPlan: string;
    movementMode: string;
    limbArrangement: string;
    lifespanCategory: string;
    developmentalStages: string;
    reproductionStrategy: string;
    offspringInvestment: string;
  };
  cognitiveArchitecture: {
    consciousnessType: string;
    memoryArchitecture: string[];
    cognitiveStrengths: string[];
    emotionalRange: string;
    selfAwarenessLevel: string;
  };
  planetaryConditions: {
    planetType: string;
    atmosphericComposition: string;
    dayNightCycle: string;
    seasonalVariation: string;
    stellarEnvironment: string;
    skyAppearance: string;
  };
  existentialParameters: {
    mortalitySalience: string;
    deathPhenomenology: string;
    generationalContinuity: string;
    timeExperience: string;
    temporalHorizon: string;
  };
  archetypePantheon: Array<{
    name: string;
    evolutionaryOrigin: string;
    cognitiveFunction: string;
    symbolicForm: string;
    narrativeRole: string;
  }>;
  creationNarrative: {
    primordialArchetypes: string[];
    primordialState: string;
    creativeAct: string;
    firstCreatedThing: string;
    fullNarrative: string;
  };
  cosmologicalStructure: {
    dimensionalStructure: string;
    primaryDivision: string;
    sacredGeography: string;
  };
  divineConceptualization: {
    divineOntology: string;
    deities: Array<{
      archetypeName: string;
      divineStatus: string;
      domain: string;
    }>;
  };
  ritualStructure: {
    primaryFunctions: string[];
    sensoryModality: string;
    ritualTiming: string;
  };
  synthesis: {
    ethicalVirtues: string;
    ethicalTaboos: string;
    ethicalAmbiguous: string;
    artExpressions: string;
    scienceHarmony: string;
    scienceTension: string;
    scienceResolution: string[];
  };
}

interface XenomythologySummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

const XenomythologySummaryTemplate = ({
  formState,
  worldName,
  date,
}: XenomythologySummaryTemplateProps) => {
  const archetypeCount = formState.archetypePantheon?.length || 0;
  const deityCount = formState.divineConceptualization?.deities?.length || 0;
  const primarySenses = formState.sensoryArchitecture.primaryModalities?.join(", ") || "Not specified";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Xenomythology Framework"
          worldName={worldName}
          date={date}
        />

        {/* Overview Result Box */}
        <PDFResultBox
          value={`${archetypeCount} Archetypes`}
          label="Mythic Framework"
          description={`${deityCount} Divine Entities • ${formState.cosmologicalStructure.dimensionalStructure || "Undefined"} Cosmos`}
        />

        {/* Species Overview */}
        <PDFSection title="Species Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Primary Senses" value={primarySenses} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Body Plan" value={formState.physicalForm.bodyPlan || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Lifespan" value={formState.physicalForm.lifespanCategory || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Consciousness" value={formState.cognitiveArchitecture.consciousnessType || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Environmental Context */}
        <PDFSection title="Environmental Context">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Planet Type" value={formState.planetaryConditions.planetType || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Day/Night" value={formState.planetaryConditions.dayNightCycle || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Stellar System" value={formState.planetaryConditions.stellarEnvironment || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mortality" value={formState.existentialParameters.mortalitySalience || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Archetype Pantheon */}
        {formState.archetypePantheon && formState.archetypePantheon.length > 0 && (
          <PDFSection title="Archetype Pantheon">
            {formState.archetypePantheon.slice(0, 5).map((archetype, index) => (
              <View key={index} style={{ marginBottom: spacing.sm }} wrap={false}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>
                  {archetype.name || `Archetype ${index + 1}`}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {archetype.narrativeRole || archetype.symbolicForm || "No description"}
                </Text>
              </View>
            ))}
            {formState.archetypePantheon.length > 5 && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, fontStyle: "italic" }}>
                + {formState.archetypePantheon.length - 5} more archetypes...
              </Text>
            )}
          </PDFSection>
        )}

        {/* Creation Narrative Preview */}
        {formState.creationNarrative.fullNarrative && (
          <PDFSection title="Creation Narrative">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
              {formState.creationNarrative.fullNarrative.length > 400
                ? formState.creationNarrative.fullNarrative.substring(0, 397) + "..."
                : formState.creationNarrative.fullNarrative}
            </Text>
          </PDFSection>
        )}

        {/* Ethics Summary */}
        {(formState.synthesis.ethicalVirtues || formState.synthesis.ethicalTaboos) && (
          <PDFSection title="Ethical Framework">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              {formState.synthesis.ethicalVirtues && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Virtues</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                    {formState.synthesis.ethicalVirtues.length > 150
                      ? formState.synthesis.ethicalVirtues.substring(0, 147) + "..."
                      : formState.synthesis.ethicalVirtues}
                  </Text>
                </View>
              )}
              {formState.synthesis.ethicalTaboos && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Taboos</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                    {formState.synthesis.ethicalTaboos.length > 150
                      ? formState.synthesis.ethicalTaboos.substring(0, 147) + "..."
                      : formState.synthesis.ethicalTaboos}
                  </Text>
                </View>
              )}
            </View>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default XenomythologySummaryTemplate;
