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
  // Safe access to nested properties
  const sensory = formState?.sensoryArchitecture;
  const physical = formState?.physicalForm;
  const cognitive = formState?.cognitiveArchitecture;
  const planetary = formState?.planetaryConditions;
  const existential = formState?.existentialParameters;
  const archetypes = formState?.archetypePantheon;
  const creation = formState?.creationNarrative;
  const cosmos = formState?.cosmologicalStructure;
  const divine = formState?.divineConceptualization;
  const synthesis = formState?.synthesis;

  const archetypeCount = archetypes?.length || 0;
  const deityCount = divine?.deities?.length || 0;
  const primarySenses = sensory?.primaryModalities?.join(", ") || "Not specified";

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
          description={`${deityCount} Divine Entities • ${cosmos?.dimensionalStructure || "Undefined"} Cosmos`}
        />

        {/* Species Overview */}
        <PDFSection title="Species Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Primary Senses" value={primarySenses} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Body Plan" value={physical?.bodyPlan || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Lifespan" value={physical?.lifespanCategory || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Consciousness" value={cognitive?.consciousnessType || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Environmental Context */}
        <PDFSection title="Environmental Context">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Planet Type" value={planetary?.planetType || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Day/Night" value={planetary?.dayNightCycle || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Stellar System" value={planetary?.stellarEnvironment || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mortality" value={existential?.mortalitySalience || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Archetype Pantheon */}
        {archetypes && archetypes.length > 0 && (
          <PDFSection title="Archetype Pantheon">
            {archetypes.slice(0, 5).map((archetype, index) => (
              <View key={index} style={{ marginBottom: spacing.sm }} wrap={false}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>
                  {archetype.name || `Archetype ${index + 1}`}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {archetype.narrativeRole || archetype.symbolicForm || "No description"}
                </Text>
              </View>
            ))}
            {archetypes.length > 5 && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, fontStyle: "italic" }}>
                + {archetypes.length - 5} more archetypes...
              </Text>
            )}
          </PDFSection>
        )}

        {/* Creation Narrative Preview */}
        {creation?.fullNarrative && (
          <PDFSection title="Creation Narrative">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
              {creation?.fullNarrative.length > 400
                ? creation?.fullNarrative.substring(0, 397) + "..."
                : creation?.fullNarrative}
            </Text>
          </PDFSection>
        )}

        {/* Ethics Summary */}
        {(synthesis?.ethicalVirtues || synthesis?.ethicalTaboos) && (
          <PDFSection title="Ethical Framework">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              {synthesis?.ethicalVirtues && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Virtues</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                    {synthesis?.ethicalVirtues.length > 150
                      ? synthesis?.ethicalVirtues.substring(0, 147) + "..."
                      : synthesis?.ethicalVirtues}
                  </Text>
                </View>
              )}
              {synthesis?.ethicalTaboos && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Taboos</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                    {synthesis?.ethicalTaboos.length > 150
                      ? synthesis?.ethicalTaboos.substring(0, 147) + "..."
                      : synthesis?.ethicalTaboos}
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
