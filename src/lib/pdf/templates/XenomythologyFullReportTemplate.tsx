import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

interface ArchetypeEntry {
  name: string;
  evolutionaryOrigin: string;
  cognitiveFunction: string;
  symbolicForm: string;
  narrativeRole: string;
}

interface DeityEntry {
  archetypeName: string;
  divineStatus: string;
  domain: string;
  physicalRelationship: string;
  interaction: string;
}

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
    cognitiveChallenges: string;
  };
  planetaryConditions: {
    planetType: string;
    atmosphericComposition: string;
    dayNightCycle: string;
    seasonalVariation: string;
    stellarEnvironment: string;
    skyAppearance: string;
    environmentalVolatility: string;
    geographicDiversity: string;
  };
  evolutionaryPressures: {
    survivalChallenges: string[];
    socialStructureEvolution: string;
    adaptiveBreakthrough: string;
  };
  existentialParameters: {
    mortalitySalience: string;
    deathPhenomenology: string;
    generationalContinuity: string;
    timeExperience: string;
    temporalHorizon: string;
  };
  archetypePantheon: ArchetypeEntry[];
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
    deities: DeityEntry[];
  };
  mythicCycles: {
    greatCrisis: string;
    crisisArchetypes: string[];
    crisisResolution: string;
    crisisExplanation: string;
    currentOrder: string;
    unresolvedTension: string;
  };
  ritualStructure: {
    primaryFunctions: string[];
    sensoryModality: string;
    ritualTiming: string;
  };
  sacredSpecialists: {
    leadershipModel: string;
    specialistAbilities: string;
    identificationMethod: string;
    specialistDangers: string;
  };
  sacredSpaces: {
    whatMakesSacred: string;
    templeCharacteristics: string;
    pilgrimageTypes: string[];
    pilgrimagePurpose: string;
  };
  deathPractices: {
    consciousnessAtDeath: string;
    deathRituals: string;
    ancestorRelations: string;
    cosmicEschatology: string;
    endTimesNarrative: string;
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

interface XenomythologyFullReportTemplateProps {
  formState: FormState;
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

const XenomythologyFullReportTemplate = ({
  formState,
  worldName,
  date,
}: XenomythologyFullReportTemplateProps) => {
  // Safe access to nested properties
  const sensory = formState?.sensoryArchitecture;
  const physical = formState?.physicalForm;
  const cognitive = formState?.cognitiveArchitecture;
  const planetary = formState?.planetaryConditions;
  const evolutionary = formState?.evolutionaryPressures;
  const existential = formState?.existentialParameters;
  const archetypes = formState?.archetypePantheon;
  const creation = formState?.creationNarrative;
  const cosmos = formState?.cosmologicalStructure;
  const divine = formState?.divineConceptualization;
  const mythic = formState?.mythicCycles;
  const ritual = formState?.ritualStructure;
  const specialists = formState?.sacredSpecialists;
  const death = formState?.deathPractices;
  const synthesis = formState?.synthesis;

  const archetypeCount = archetypes?.length || 0;
  const deityCount = divine?.deities?.length || 0;

  return (
    <Document>
      {/* Page 1: Species Biology & Psychology */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Xenomythology Framework"
          worldName={worldName}
          date={date}
        />

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "To understand an alien religion, you must first understand their biology, their world, and their death."
          </Text>
        </View>

        <PDFResultBox
          value={`${archetypeCount} Archetypes`}
          label="Mythic Framework"
          description={`${deityCount} Divine Entities Defined`}
        />

        <PDFSection title="1. Sensory Architecture">
          <PDFKeyValuePair
            label="Primary Modalities"
            value={sensory?.primaryModalities?.join(", ") || "Not specified"}
          />
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Integration Style" value={sensory?.integrationStyle || "N/A"} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Sensory Range" value={sensory?.sensoryRange || "N/A"} />
            </View>
          </View>
          {sensory?.cognitionImpact && (
            <NotesBox label="Cognition Impact" content={sensory?.cognitionImpact} />
          )}
        </PDFSection>

        <PDFSection title="Physical Form">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Body Plan" value={physical?.bodyPlan || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Movement" value={physical?.movementMode || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Lifespan" value={physical?.lifespanCategory || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Reproduction" value={physical?.reproductionStrategy || "N/A"} />
            </View>
          </View>
        </PDFSection>

        <PDFSection title="Cognitive Architecture">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Consciousness Type" value={cognitive?.consciousnessType || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Self-Awareness" value={cognitive?.selfAwarenessLevel || "N/A"} />
            </View>
          </View>
          <PDFKeyValuePair
            label="Memory Architecture"
            value={cognitive?.memoryArchitecture?.join(", ") || "Not specified"}
          />
          <PDFKeyValuePair
            label="Cognitive Strengths"
            value={cognitive?.cognitiveStrengths?.join(", ") || "Not specified"}
          />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Environmental Context */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Xenomythology Framework" worldName={worldName} date={date} />

        <PDFSection title="2. Planetary Conditions">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Planet Type" value={planetary?.planetType || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Atmosphere" value={planetary?.atmosphericComposition || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Day/Night Cycle" value={planetary?.dayNightCycle || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Stellar Environment" value={planetary?.stellarEnvironment || "N/A"} />
            </View>
          </View>
          {planetary?.skyAppearance && (
            <NotesBox label="Sky Appearance" content={planetary?.skyAppearance} />
          )}
        </PDFSection>

        <PDFSection title="Evolutionary Pressures">
          <PDFKeyValuePair
            label="Survival Challenges"
            value={evolutionary?.survivalChallenges?.join(", ") || "Not specified"}
          />
          {evolutionary?.socialStructureEvolution && (
            <NotesBox label="Social Structure Evolution" content={evolutionary?.socialStructureEvolution} />
          )}
          {evolutionary?.adaptiveBreakthrough && (
            <NotesBox label="Adaptive Breakthrough" content={evolutionary?.adaptiveBreakthrough} />
          )}
        </PDFSection>

        <PDFSection title="Existential Parameters">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mortality Salience" value={existential?.mortalitySalience || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Generational Continuity" value={existential?.generationalContinuity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Time Experience" value={existential?.timeExperience || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Temporal Horizon" value={existential?.temporalHorizon || "N/A"} />
            </View>
          </View>
          {existential?.deathPhenomenology && (
            <NotesBox label="Death Phenomenology" content={existential?.deathPhenomenology} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Archetype Pantheon */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Xenomythology Framework" worldName={worldName} date={date} />

        <PDFSection title="3. Archetype Pantheon">
          {archetypes && archetypes.length > 0 ? (
            archetypes.map((archetype, index) => (
              <View key={index} style={{ marginBottom: spacing.md, padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4 }} wrap={false}>
                <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                  {archetype.name || `Archetype ${index + 1}`}
                </Text>
                {archetype.evolutionaryOrigin && (
                  <View style={{ marginBottom: 2 }}>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Origin:</Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>{archetype.evolutionaryOrigin}</Text>
                  </View>
                )}
                {archetype.cognitiveFunction && (
                  <View style={{ marginBottom: 2 }}>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Function:</Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>{archetype.cognitiveFunction}</Text>
                  </View>
                )}
                {archetype.symbolicForm && (
                  <View style={{ marginBottom: 2 }}>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Symbolic Form:</Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>{archetype.symbolicForm}</Text>
                  </View>
                )}
                {archetype.narrativeRole && (
                  <View>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Narrative Role:</Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>{archetype.narrativeRole}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted, fontStyle: "italic" }}>
              No archetypes defined
            </Text>
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Mythic Expression */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Xenomythology Framework" worldName={worldName} date={date} />

        <PDFSection title="4. Creation Narrative">
          <PDFKeyValuePair
            label="Primordial Archetypes"
            value={creation?.primordialArchetypes?.join(", ") || "Not specified"}
          />
          {creation?.primordialState && (
            <NotesBox label="Primordial State" content={creation?.primordialState} />
          )}
          {creation?.creativeAct && (
            <NotesBox label="The Creative Act" content={creation?.creativeAct} />
          )}
          {creation?.fullNarrative && (
            <View style={{ marginBottom: spacing.md }} wrap={false}>
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                Full Creation Narrative
              </Text>
              <View style={{ padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.6, fontStyle: "italic" }}>
                  {creation?.fullNarrative}
                </Text>
              </View>
            </View>
          )}
        </PDFSection>

        <PDFSection title="Cosmological Structure">
          <PDFKeyValuePair label="Dimensional Structure" value={cosmos?.dimensionalStructure || "N/A"} />
          {cosmos?.primaryDivision && (
            <NotesBox label="Primary Division" content={cosmos?.primaryDivision} />
          )}
          {cosmos?.sacredGeography && (
            <NotesBox label="Sacred Geography" content={cosmos?.sacredGeography} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 5: Divine Beings & Mythic Cycles */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Xenomythology Framework" worldName={worldName} date={date} />

        <PDFSection title="Divine Conceptualization">
          <PDFKeyValuePair label="Divine Ontology" value={divine?.divineOntology || "N/A"} />
          {divine?.deities && divine?.deities.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
                Divine Entities ({divine?.deities.length})
              </Text>
              {divine?.deities.map((deity, index) => (
                <View key={index} style={{ marginBottom: spacing.sm, paddingLeft: spacing.sm, borderLeft: `2px solid ${colors.primary}` }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                    {deity.archetypeName || `Deity ${index + 1}`}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                    {deity.divineStatus} • Domain: {deity.domain || "Unspecified"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </PDFSection>

        <PDFSection title="Mythic Cycles">
          {mythic?.greatCrisis && (
            <NotesBox label="The Great Crisis" content={formState.mythicCycles.greatCrisis} />
          )}
          {mythic?.crisisResolution && (
            <NotesBox label="Crisis Resolution" content={formState.mythicCycles.crisisResolution} />
          )}
          {mythic?.unresolvedTension && (
            <NotesBox label="Unresolved Tension" content={formState.mythicCycles.unresolvedTension} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 6: Ritual & Practices */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Xenomythology Framework" worldName={worldName} date={date} />

        <PDFSection title="5. Ritual Structure">
          <PDFKeyValuePair
            label="Primary Functions"
            value={ritual?.primaryFunctions?.join(", ") || "Not specified"}
          />
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Sensory Modality" value={ritual?.sensoryModality || "N/A"} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Ritual Timing" value={ritual?.ritualTiming || "N/A"} />
            </View>
          </View>
        </PDFSection>

        <PDFSection title="Sacred Specialists">
          <PDFKeyValuePair label="Leadership Model" value={specialists?.leadershipModel || "N/A"} />
          {specialists?.specialistAbilities && (
            <NotesBox label="Specialist Abilities" content={formState.sacredSpecialists.specialistAbilities} />
          )}
        </PDFSection>

        <PDFSection title="Death Practices">
          {death?.consciousnessAtDeath && (
            <NotesBox label="Consciousness at Death" content={formState.deathPractices.consciousnessAtDeath} />
          )}
          {death?.deathRituals && (
            <NotesBox label="Death Rituals" content={formState.deathPractices.deathRituals} />
          )}
          <PDFKeyValuePair label="Ancestor Relations" value={death?.ancestorRelations || "N/A"} />
          <PDFKeyValuePair label="Cosmic Eschatology" value={death?.cosmicEschatology || "N/A"} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 7: Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Xenomythology Framework" worldName={worldName} date={date} />

        <PDFSection title="6. Ethical Framework">
          {synthesis?.ethicalVirtues && (
            <NotesBox label="Core Virtues" content={synthesis?.ethicalVirtues} />
          )}
          {synthesis?.ethicalTaboos && (
            <NotesBox label="Sacred Taboos" content={synthesis?.ethicalTaboos} />
          )}
          {synthesis?.ethicalAmbiguous && (
            <NotesBox label="Moral Ambiguities" content={synthesis?.ethicalAmbiguous} />
          )}
        </PDFSection>

        <PDFSection title="Art & Expression">
          {synthesis?.artExpressions && (
            <NotesBox label="Artistic Expressions" content={synthesis?.artExpressions} />
          )}
        </PDFSection>

        <PDFSection title="Science & Myth">
          {synthesis?.scienceHarmony && (
            <NotesBox label="Areas of Harmony" content={synthesis?.scienceHarmony} />
          )}
          {synthesis?.scienceTension && (
            <NotesBox label="Areas of Tension" content={synthesis?.scienceTension} />
          )}
          <PDFKeyValuePair
            label="Resolution Strategies"
            value={synthesis?.scienceResolution?.join(", ") || "Not specified"}
          />
        </PDFSection>

        {/* Final Quote */}
        <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
            "Biology shapes psychology, psychology shapes mythology, and mythology shapes culture for all intelligent species."
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default XenomythologyFullReportTemplate;
