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

interface EvolutionarySummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

// Helper to format IDs to readable names
const formatId = (id: string): string => {
  if (!id) return "N/A";
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const EvolutionarySummaryTemplate = ({
  formState,
  worldName,
  date,
}: EvolutionarySummaryTemplateProps) => {
  const foundations = formState?.foundations;
  const biochemistry = formState?.biochemistry;
  const adaptations = formState?.adaptations;
  const bodyPlan = formState?.bodyPlan;
  const sensory = formState?.sensory;
  const reproduction = formState?.reproduction;
  const social = formState?.social;
  const cognition = formState?.cognition;
  const communication = formState?.communication;
  const integration = formState?.integration;

  const pressureCount = foundations?.primarySurvivalPressures?.length || 0;
  const adaptationCount = adaptations?.keyAdaptations?.length || 0;
  const senseCount = sensory?.primarySenses?.length || 0;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Evolutionary Biology"
          worldName={worldName}
          date={date}
        />

        {/* Overview Result Box */}
        <PDFResultBox
          value={`${adaptationCount} Adaptations`}
          label="Species Design"
          description={`${pressureCount} Survival Pressures • ${senseCount} Senses`}
        />

        {/* Biochemistry Overview */}
        <PDFSection title="Biochemistry & Metabolism">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Biochemistry" value={formatId(biochemistry?.biochemicalBasis)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Solvent" value={formatId(biochemistry?.solvent)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Energy Source" value={formatId(biochemistry?.energySource)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Metabolism" value={formatId(biochemistry?.metabolicRate)} />
            </View>
          </View>
          {biochemistry?.temperatureRange?.optimal && (
            <View style={{ marginTop: spacing.xs }}>
              <PDFKeyValuePair
                label="Temperature Range"
                value={`${biochemistry.temperatureRange.min || "?"} to ${biochemistry.temperatureRange.max || "?"}°C (optimal: ${biochemistry.temperatureRange.optimal}°C)`}
              />
            </View>
          )}
        </PDFSection>

        {/* Body Plan */}
        <PDFSection title="Body Plan & Morphology">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Symmetry" value={formatId(bodyPlan?.symmetry)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Segments" value={formatId(bodyPlan?.bodySegments)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Covering" value={formatId(bodyPlan?.integument)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Structure" value={formatId(bodyPlan?.internalStructure)} />
            </View>
          </View>
          {bodyPlan?.sizeRange?.min && (
            <View style={{ marginTop: spacing.xs }}>
              <PDFKeyValuePair
                label="Size Range"
                value={`${bodyPlan.sizeRange.min} to ${bodyPlan.sizeRange.max}`}
              />
            </View>
          )}
        </PDFSection>

        {/* Sensory & Cognition */}
        <PDFSection title="Sensory & Cognitive Systems">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <PDFKeyValuePair
                label="Primary Senses"
                value={sensory?.primarySenses?.map(formatId).join(", ") || "N/A"}
              />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Brain Type" value={formatId(cognition?.brainAnalog)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Cognition" value={formatId(cognition?.cognitionType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Memory" value={formatId(cognition?.memoryType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Tool Use" value={formatId(cognition?.toolUse)} />
            </View>
          </View>
        </PDFSection>

        {/* Reproduction & Social */}
        <PDFSection title="Reproduction & Social Structure">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Reproduction" value={formatId(reproduction?.reproductionMode)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Lifespan" value={formatId(reproduction?.lifespan)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Parental Care" value={formatId(reproduction?.parentalCare)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Group Size" value={formatId(social?.groupSize)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Social Structure" value={formatId(social?.socialStructure)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Territoriality" value={formatId(social?.territoriality)} />
            </View>
          </View>
        </PDFSection>

        {/* Key Adaptations */}
        {adaptations?.keyAdaptations && adaptations.keyAdaptations.length > 0 && (
          <PDFSection title="Key Evolutionary Adaptations">
            {adaptations.keyAdaptations.slice(0, 4).map((adaptation, index) => (
              <View key={index} style={{ marginBottom: spacing.xs }} wrap={false}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>
                  {adaptation.trait || `Adaptation ${index + 1}`}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  Pressure: {adaptation.selectivePressure || "Unknown"} | Tradeoff: {adaptation.tradeoff || "None noted"}
                </Text>
              </View>
            ))}
            {adaptations.keyAdaptations.length > 4 && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, fontStyle: "italic" }}>
                + {adaptations.keyAdaptations.length - 4} more adaptations...
              </Text>
            )}
          </PDFSection>
        )}

        {/* Ecological Niche */}
        {integration?.ecologicalNiche && (
          <PDFSection title="Ecological Niche">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
              {integration.ecologicalNiche.length > 400
                ? integration.ecologicalNiche.substring(0, 397) + "..."
                : integration.ecologicalNiche}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default EvolutionarySummaryTemplate;
