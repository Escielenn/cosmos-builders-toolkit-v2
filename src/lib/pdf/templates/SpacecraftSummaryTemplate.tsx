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
  identity: {
    name: string;
    class: string;
    customClass: string;
    role: string;
    customRole: string;
    size: string;
    age: string;
    origin: string;
    currentOwner: string;
    history: string;
  };
  propulsion: {
    driveType: string;
    accelerationProfile: string;
    fuelSource: string;
    rangeLimit: string;
    architecturalConsequences: string;
    thrustOrientation: string;
    noiseVibration: string;
  };
  lifeSupport: {
    atmosphere: string;
    water: string;
    food: string;
    waste: string;
    temperature: string;
    radiation: string;
    gravity: string;
    medical: string;
    emergencyBackups: string;
    failureModes: string;
  };
  living: {
    crewQuarters: string;
    commonAreas: string;
    privateSpace: string;
    storage: string;
    recreation: string;
    workspaces: string;
    traffic: string;
    soundscape: string;
    lighting: string;
    smells: string;
  };
  cultural: {
    originCulture: string;
    decorations: string;
    modifications: string;
    rituals: string;
    taboos: string;
    naming: string;
    superstitions: string;
    memorials: string;
    conflicts: string;
  };
  character: {
    personality: string;
    quirks: string;
    secrets: string;
    reputation: string;
    relationships: string;
    evolution: string;
    metaphor: string;
  };
  synthesis: {
    livedInDetails: string;
    storyHooks: string;
    sensorySignature: string;
  };
}

interface SpacecraftSummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

const SHIP_CLASS_LABELS: Record<string, string> = {
  fighter: "Fighter/Interceptor",
  shuttle: "Shuttle/Transport",
  freighter: "Freighter/Cargo",
  corvette: "Corvette/Patrol",
  frigate: "Frigate/Escort",
  cruiser: "Cruiser",
  carrier: "Carrier",
  liner: "Passenger Liner",
  colony: "Colony Ship",
  generation: "Generation Ship",
  station: "Mobile Station",
  mining: "Mining/Industrial",
  science: "Research/Science",
  privateer: "Privateer/Pirate",
  other: "Other",
};

const SIZE_LABELS: Record<string, string> = {
  tiny: "Tiny (Under 20m)",
  small: "Small (20-100m)",
  medium: "Medium (100-300m)",
  large: "Large (300-1000m)",
  huge: "Huge (1-5km)",
  massive: "Massive (5km+)",
};

const GRAVITY_LABELS: Record<string, string> = {
  none: "Zero-G",
  spin: "Spin Gravity",
  thrust: "Thrust Gravity",
  artificial: "Artificial Gravity",
  mixed: "Mixed Zones",
};

const SpacecraftSummaryTemplate = ({
  formState,
  worldName,
  date,
}: SpacecraftSummaryTemplateProps) => {
  const shipName = formState.identity.name || "Unnamed Vessel";
  const shipClass = SHIP_CLASS_LABELS[formState.identity.class] || formState.identity.customClass || "Unclassified";
  const shipSize = SIZE_LABELS[formState.identity.size] || "Unknown";
  const gravityType = GRAVITY_LABELS[formState.lifeSupport.gravity] || "Not specified";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Spacecraft Designer"
          worldName={worldName}
          date={date}
        />

        {/* Ship Name Result Box */}
        <PDFResultBox
          value={shipName}
          label={shipClass}
          description={`${shipSize} • ${formState.identity.age || "Age unknown"}`}
        />

        {/* Quick Stats */}
        <PDFSection title="Ship Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Class" value={shipClass} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Size" value={shipSize} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Age" value={formState.identity.age || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Origin" value={formState.identity.origin || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Propulsion & Life Support */}
        <PDFSection title="Technical Systems">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Drive Type" value={formState.propulsion.driveType || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Acceleration" value={formState.propulsion.accelerationProfile || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Gravity" value={gravityType} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Range" value={formState.propulsion.rangeLimit || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Ship Character */}
        {formState.character.personality && (
          <PDFSection title="Ship Character">
            <View style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
                Personality
              </Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                {formState.character.personality.length > 200
                  ? formState.character.personality.substring(0, 197) + "..."
                  : formState.character.personality}
              </Text>
            </View>
            {formState.character.metaphor && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
                  Thematic Metaphor
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.character.metaphor.length > 150
                    ? formState.character.metaphor.substring(0, 147) + "..."
                    : formState.character.metaphor}
                </Text>
              </View>
            )}
          </PDFSection>
        )}

        {/* Sensory Signature */}
        {formState.synthesis.sensorySignature && (
          <PDFSection title="Sensory Signature">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
              {formState.synthesis.sensorySignature.length > 400
                ? formState.synthesis.sensorySignature.substring(0, 397) + "..."
                : formState.synthesis.sensorySignature}
            </Text>
          </PDFSection>
        )}

        {/* Story Hooks */}
        {formState.synthesis.storyHooks && (
          <PDFSection title="Story Hooks">
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {formState.synthesis.storyHooks.length > 300
                ? formState.synthesis.storyHooks.substring(0, 297) + "..."
                : formState.synthesis.storyHooks}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpacecraftSummaryTemplate;
