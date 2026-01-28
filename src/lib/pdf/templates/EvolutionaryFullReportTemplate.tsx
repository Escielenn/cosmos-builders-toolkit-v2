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
  foundations: {
    primarySurvivalPressures: string[];
    extremophileInspiration: string;
    survivalPressuresNotes: string;
  };
  biochemistry: {
    biochemicalBasis: string;
    solvent: string;
    energySource: string;
    metabolicRate: string;
    respirationType: string;
    wasteProducts: string;
    temperatureRange: { min: string; max: string; optimal: string };
    biochemistryNotes: string;
  };
  adaptations: {
    keyAdaptations: Array<{
      trait: string;
      selectivePressure: string;
      tradeoff: string;
    }>;
    convergentEvolution: string;
    uniqueAdaptations: string;
    adaptationsNotes: string;
  };
  bodyPlan: {
    symmetry: string;
    bodySegments: string;
    limbs: Array<{ type: string; count: string; function: string }>;
    sizeRange: { min: string; max: string };
    integument: string;
    coloration: string;
    colorationFunction: string;
    internalStructure: string;
    bodyPlanNotes: string;
  };
  sensory: {
    primarySenses: string[];
    sensoryOrgans: Array<{ sense: string; location: string; capabilities: string }>;
    blindSpots: string;
    environmentalTuning: string;
    sensoryNotes: string;
  };
  reproduction: {
    reproductionMode: string;
    matingSystem: string;
    fertilizationType: string;
    gestationType: string;
    offspringCount: string;
    parentalCare: string;
    lifeStages: Array<{ stage: string; duration: string; characteristics: string }>;
    lifespan: string;
    senescence: string;
    reproductionNotes: string;
  };
  social: {
    groupSize: string;
    socialStructure: string;
    hierarchyType: string;
    cooperationMechanisms: string[];
    conflictResolution: string;
    kinRecognition: string;
    territoriality: string;
    socialNotes: string;
  };
  cognition: {
    brainAnalog: string;
    cognitionType: string;
    problemSolving: string;
    memoryType: string;
    learningMechanisms: string[];
    toolUse: string;
    abstractThinking: string;
    cognitionNotes: string;
  };
  communication: {
    primaryChannel: string;
    secondaryChannels: string[];
    signalRange: string;
    informationCapacity: string;
    deception: string;
    culturalTransmission: string;
    communicationNotes: string;
  };
  psychology: {
    emotionAnalogs: string[];
    motivationalDrives: string[];
    fearResponses: string;
    pleasureResponses: string;
    stressResponse: string;
    curiosityLevel: string;
    psychologyNotes: string;
  };
  vestigial: {
    vestigialTraits: Array<{ trait: string; ancestralFunction: string; currentState: string }>;
    transitionalFeatures: string;
    evolutionaryHistory: string;
    vestigialNotes: string;
  };
  viewpointTest: {
    alienPerceptionDifferences: string;
    humanAssumptionsAvoided: string[];
    uniqueWorldview: string;
    viewpointNotes: string;
  };
  integration: {
    traitInteractions: string;
    ecologicalNiche: string;
    evolutionaryPlausibility: string;
    potentialContradictions: string;
    integrationNotes: string;
  };
}

interface EvolutionaryFullReportTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

// Helper to format IDs to readable names
const formatId = (id: string): string => {
  if (!id) return "Not specified";
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const TextBlock = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={{ marginBottom: spacing.sm }} wrap={false}>
      <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
        {value}
      </Text>
    </View>
  );
};

const EvolutionaryFullReportTemplate = ({
  formState,
  worldName,
  date,
}: EvolutionaryFullReportTemplateProps) => {
  const foundations = formState?.foundations;
  const biochemistry = formState?.biochemistry;
  const adaptations = formState?.adaptations;
  const bodyPlan = formState?.bodyPlan;
  const sensory = formState?.sensory;
  const reproduction = formState?.reproduction;
  const social = formState?.social;
  const cognition = formState?.cognition;
  const communication = formState?.communication;
  const psychology = formState?.psychology;
  const vestigial = formState?.vestigial;
  const viewpointTest = formState?.viewpointTest;
  const integration = formState?.integration;

  const adaptationCount = adaptations?.keyAdaptations?.length || 0;
  const pressureCount = foundations?.primarySurvivalPressures?.length || 0;

  return (
    <Document>
      {/* Page 1: Overview & Foundations */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={`${adaptationCount} Adaptations`}
          label="Complete Species Design"
          description={`${pressureCount} Survival Pressures`}
        />

        {/* Section 1: Foundations */}
        <PDFSection title="1. Foundations">
          <PDFKeyValuePair
            label="Primary Survival Pressures"
            value={foundations?.primarySurvivalPressures?.map(formatId).join(", ") || "None specified"}
          />
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair label="Extremophile Inspiration" value={formatId(foundations?.extremophileInspiration)} />
          </View>
          <TextBlock label="Notes" value={foundations?.survivalPressuresNotes} />
        </PDFSection>

        {/* Section 2: Biochemistry */}
        <PDFSection title="2. Biochemistry & Metabolism">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Biochemical Basis" value={formatId(biochemistry?.biochemicalBasis)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Solvent" value={formatId(biochemistry?.solvent)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Energy Source" value={formatId(biochemistry?.energySource)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Metabolic Rate" value={formatId(biochemistry?.metabolicRate)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Respiration" value={formatId(biochemistry?.respirationType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Waste Products" value={biochemistry?.wasteProducts || "N/A"} />
            </View>
          </View>
          {biochemistry?.temperatureRange?.optimal && (
            <View style={{ marginTop: spacing.xs }}>
              <PDFKeyValuePair
                label="Temperature Range"
                value={`Min: ${biochemistry.temperatureRange.min || "?"}°C | Optimal: ${biochemistry.temperatureRange.optimal}°C | Max: ${biochemistry.temperatureRange.max || "?"}°C`}
              />
            </View>
          )}
          <TextBlock label="Notes" value={biochemistry?.biochemistryNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Adaptations & Body Plan */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        {/* Section 3: Adaptations */}
        <PDFSection title="3. Evolutionary Adaptations">
          {adaptations?.keyAdaptations && adaptations.keyAdaptations.length > 0 && (
            <View style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                Key Adaptations
              </Text>
              {adaptations.keyAdaptations.map((adaptation, index) => (
                <View key={index} style={{ marginBottom: spacing.xs, paddingLeft: spacing.sm }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary }}>
                    {adaptation.trait || `Adaptation ${index + 1}`}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                    Selective Pressure: {adaptation.selectivePressure || "Unknown"}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                    Tradeoff: {adaptation.tradeoff || "None noted"}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <TextBlock label="Convergent Evolution" value={adaptations?.convergentEvolution} />
          <TextBlock label="Unique Adaptations" value={adaptations?.uniqueAdaptations} />
          <TextBlock label="Notes" value={adaptations?.adaptationsNotes} />
        </PDFSection>

        {/* Section 4: Body Plan */}
        <PDFSection title="4. Body Plan & Morphology">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Symmetry" value={formatId(bodyPlan?.symmetry)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Body Segments" value={formatId(bodyPlan?.bodySegments)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Integument" value={formatId(bodyPlan?.integument)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Internal Structure" value={formatId(bodyPlan?.internalStructure)} />
            </View>
          </View>
          {bodyPlan?.limbs && bodyPlan.limbs.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                Limbs & Appendages
              </Text>
              {bodyPlan.limbs.map((limb, index) => (
                <Text key={index} style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                  {formatId(limb.type)} x{limb.count}: {limb.function}
                </Text>
              ))}
            </View>
          )}
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair label="Size Range" value={`${bodyPlan?.sizeRange?.min || "?"} to ${bodyPlan?.sizeRange?.max || "?"}`} />
          </View>
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair label="Coloration" value={`${bodyPlan?.coloration || "N/A"} (${formatId(bodyPlan?.colorationFunction)})`} />
          </View>
          <TextBlock label="Notes" value={bodyPlan?.bodyPlanNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Sensory & Reproduction */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        {/* Section 5: Sensory */}
        <PDFSection title="5. Sensory Systems">
          <PDFKeyValuePair
            label="Primary Senses"
            value={sensory?.primarySenses?.map(formatId).join(", ") || "None specified"}
          />
          {sensory?.sensoryOrgans && sensory.sensoryOrgans.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                Sensory Organs
              </Text>
              {sensory.sensoryOrgans.map((organ, index) => (
                <Text key={index} style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                  {formatId(organ.sense)} at {formatId(organ.location)}: {organ.capabilities}
                </Text>
              ))}
            </View>
          )}
          <TextBlock label="Blind Spots & Limitations" value={sensory?.blindSpots} />
          <TextBlock label="Environmental Tuning" value={sensory?.environmentalTuning} />
          <TextBlock label="Notes" value={sensory?.sensoryNotes} />
        </PDFSection>

        {/* Section 6: Reproduction */}
        <PDFSection title="6. Reproduction & Life Cycle">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mode" value={formatId(reproduction?.reproductionMode)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mating System" value={formatId(reproduction?.matingSystem)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Fertilization" value={formatId(reproduction?.fertilizationType)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Gestation" value={formatId(reproduction?.gestationType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Offspring Count" value={reproduction?.offspringCount || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Parental Care" value={formatId(reproduction?.parentalCare)} />
            </View>
          </View>
          {reproduction?.lifeStages && reproduction.lifeStages.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                Life Stages
              </Text>
              {reproduction.lifeStages.map((stage, index) => (
                <Text key={index} style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                  {stage.stage} ({stage.duration}): {stage.characteristics}
                </Text>
              ))}
            </View>
          )}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Lifespan" value={formatId(reproduction?.lifespan)} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Senescence" value={formatId(reproduction?.senescence)} />
            </View>
          </View>
          <TextBlock label="Notes" value={reproduction?.reproductionNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Social & Cognition */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        {/* Section 7: Social */}
        <PDFSection title="7. Social Evolution & Structure">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Group Size" value={formatId(social?.groupSize)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Social Structure" value={formatId(social?.socialStructure)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Conflict Resolution" value={formatId(social?.conflictResolution)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Territoriality" value={formatId(social?.territoriality)} />
            </View>
          </View>
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair
              label="Cooperation Mechanisms"
              value={social?.cooperationMechanisms?.map(formatId).join(", ") || "None"}
            />
          </View>
          <TextBlock label="Hierarchy Type" value={social?.hierarchyType} />
          <TextBlock label="Kin Recognition" value={social?.kinRecognition} />
          <TextBlock label="Notes" value={social?.socialNotes} />
        </PDFSection>

        {/* Section 8: Cognition */}
        <PDFSection title="8. Intelligence & Cognition">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Brain Analog" value={formatId(cognition?.brainAnalog)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Cognition Type" value={formatId(cognition?.cognitionType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Memory Type" value={formatId(cognition?.memoryType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Tool Use" value={formatId(cognition?.toolUse)} />
            </View>
          </View>
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair
              label="Learning Mechanisms"
              value={cognition?.learningMechanisms?.map(formatId).join(", ") || "None"}
            />
          </View>
          <TextBlock label="Problem Solving" value={cognition?.problemSolving} />
          <TextBlock label="Abstract Thinking" value={cognition?.abstractThinking} />
          <TextBlock label="Notes" value={cognition?.cognitionNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 5: Communication & Psychology */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        {/* Section 9: Communication */}
        <PDFSection title="9. Communication Biology">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Primary Channel" value={formatId(communication?.primaryChannel)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Signal Range" value={formatId(communication?.signalRange)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Info Capacity" value={formatId(communication?.informationCapacity)} />
            </View>
          </View>
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair
              label="Secondary Channels"
              value={communication?.secondaryChannels?.map(formatId).join(", ") || "None"}
            />
          </View>
          <TextBlock label="Deception" value={communication?.deception} />
          <TextBlock label="Cultural Transmission" value={communication?.culturalTransmission} />
          <TextBlock label="Notes" value={communication?.communicationNotes} />
        </PDFSection>

        {/* Section 10: Psychology */}
        <PDFSection title="10. Psychology from Biology">
          <PDFKeyValuePair
            label="Emotion Analogs"
            value={psychology?.emotionAnalogs?.map(formatId).join(", ") || "None"}
          />
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair
              label="Motivational Drives"
              value={psychology?.motivationalDrives?.map(formatId).join(", ") || "None"}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Stress Response" value={formatId(psychology?.stressResponse)} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Curiosity Level" value={formatId(psychology?.curiosityLevel)} />
            </View>
          </View>
          <TextBlock label="Fear Responses" value={psychology?.fearResponses} />
          <TextBlock label="Pleasure Responses" value={psychology?.pleasureResponses} />
          <TextBlock label="Notes" value={psychology?.psychologyNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 6: Vestigial, Viewpoint, Integration */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        {/* Section 11: Vestigial */}
        <PDFSection title="11. Vestigial & Transitional Traits">
          {vestigial?.vestigialTraits && vestigial.vestigialTraits.length > 0 && (
            <View style={{ marginBottom: spacing.sm }}>
              {vestigial.vestigialTraits.map((trait, index) => (
                <View key={index} style={{ marginBottom: spacing.xs }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary }}>
                    {trait.trait}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                    Original: {trait.ancestralFunction} | Current: {formatId(trait.currentState)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <TextBlock label="Transitional Features" value={vestigial?.transitionalFeatures} />
          <TextBlock label="Evolutionary History" value={vestigial?.evolutionaryHistory} />
        </PDFSection>

        {/* Section 12: Viewpoint Test */}
        <PDFSection title="12. Non-Human Viewpoint Test">
          <PDFKeyValuePair
            label="Human Assumptions Avoided"
            value={viewpointTest?.humanAssumptionsAvoided?.map(formatId).join(", ") || "None checked"}
          />
          <TextBlock label="Alien Perception Differences" value={viewpointTest?.alienPerceptionDifferences} />
          <TextBlock label="Unique Worldview" value={viewpointTest?.uniqueWorldview} />
        </PDFSection>

        {/* Section 13: Integration */}
        <PDFSection title="13. Integration & Consistency">
          <TextBlock label="Trait Interactions" value={integration?.traitInteractions} />
          <TextBlock label="Ecological Niche" value={integration?.ecologicalNiche} />
          <TextBlock label="Evolutionary Plausibility" value={integration?.evolutionaryPlausibility} />
          <TextBlock label="Potential Contradictions" value={integration?.potentialContradictions} />
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default EvolutionaryFullReportTemplate;
