import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

interface StellarEnvironment {
  starType: string;
  starTypeNotes: string;
  luminosity: string;
  habitableZonePosition: string;
  orbitalPeriod: string;
  orbitalEccentricity: string;
  tidalLocking: string;
  tidalLockingNotes: string;
}

interface PhysicalCharacteristics {
  planetaryMass: string;
  surfaceGravity: string;
  planetaryRadius: string;
  dayLength: string;
  axialTilt: string;
  seasonalVariation: string;
}

interface AtmosphericComposition {
  primaryGases: string[];
  secondaryGases: string[];
  atmosphericPressure: string;
  greenhouseEffect: string;
  skyColor: string;
  weatherPatterns: string;
}

interface Hydrosphere {
  waterPresence: string;
  oceanCoverage: string;
  waterComposition: string;
  icePresence: string;
  hydrosphereNotes: string;
}

interface TemperatureProfile {
  averageSurfaceTemp: string;
  temperatureRange: string;
  climateZones: string;
  temperatureNotes: string;
}

interface HabitabilityAssessment {
  habitabilityTier: string;
  tierJustification: string;
  requiredAdaptations: string[];
  adaptationNotes: string;
}

interface GeologicalFeatures {
  tectonicActivity: string;
  volcanism: string;
  mountainRanges: string;
  uniqueFormations: string;
  naturalResources: string;
  geologicalHazards: string;
}

interface ThreePressures {
  survivalPressure: string;
  survivalManifestations: string;
  socialPressure: string;
  socialManifestations: string;
  psychologicalPressure: string;
  psychologicalManifestations: string;
  pressureInteractions: string;
}

interface NarrativeIntegration {
  environmentAsCharacter: string;
  conflictSources: string;
  plotOpportunities: string;
  sensoryDetails: string;
  uniqueMoments: string;
}

interface ConsistencyCheck {
  starGravityConsistent: boolean;
  atmosphereTempConsistent: boolean;
  waterTempConsistent: boolean;
  gravityBiologyConsistent: boolean;
  pressuresEnvironmentConsistent: boolean;
  consistencyNotes: string;
}

interface FormState {
  stellarEnvironment: StellarEnvironment;
  physicalCharacteristics: PhysicalCharacteristics;
  atmosphericComposition: AtmosphericComposition;
  hydrosphere: Hydrosphere;
  temperatureProfile: TemperatureProfile;
  habitability: HabitabilityAssessment;
  geological: GeologicalFeatures;
  threePressures: ThreePressures;
  narrative: NarrativeIntegration;
  consistencyCheck: ConsistencyCheck;
}

interface PlanetarySummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

// Star type labels
const STAR_TYPE_LABELS: Record<string, string> = {
  "m-dwarf": "M-Dwarf (Red Dwarf)",
  "k-dwarf": "K-Dwarf (Orange Dwarf)",
  "g-type": "G-Type (Sun-like)",
  "f-type": "F-Type",
  binary: "Binary System",
  rogue: "Rogue Planet",
};

// Habitability tier labels
const TIER_LABELS: Record<string, { name: string; description: string }> = {
  "1": { name: "Shirtsleeve", description: "Walk outside with minimal protection" },
  "2": { name: "Habitable", description: "Breathable but requires some adaptations" },
  "3": { name: "Challenging", description: "Requires significant technology/adaptation" },
  "4": { name: "Hostile", description: "Survival requires extensive life support" },
  "5": { name: "Extreme", description: "Near-impossible without major intervention" },
};

// Tidal locking labels
const TIDAL_LABELS: Record<string, string> = {
  locked: "Tidally Locked",
  resonance: "Spin-Orbit Resonance",
  free: "Free Rotation",
};

const PlanetarySummaryTemplate = ({
  formState,
  worldName,
  date,
}: PlanetarySummaryTemplateProps) => {
  // Safe access to nested properties
  const stellar = formState?.stellarEnvironment;
  const physical = formState?.physicalCharacteristics;
  const atmosphere = formState?.atmosphericComposition;
  const hydro = formState?.hydrosphere;
  const temp = formState?.temperatureProfile;
  const habitability = formState?.habitability;
  const pressures = formState?.threePressures;
  const consistency = formState?.consistencyCheck;

  const starTypeLabel = STAR_TYPE_LABELS[stellar?.starType || ""] || stellar?.starType || "Not specified";
  const tierInfo = TIER_LABELS[habitability?.habitabilityTier || ""];
  const tidalLabel = TIDAL_LABELS[stellar?.tidalLocking || ""] || "Not specified";

  // Count consistency checks
  const consistencyChecks = [
    consistency?.starGravityConsistent,
    consistency?.atmosphereTempConsistent,
    consistency?.waterTempConsistent,
    consistency?.gravityBiologyConsistent,
    consistency?.pressuresEnvironmentConsistent,
  ];
  const consistencyScore = consistencyChecks.filter(Boolean).length;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Planetary Profile"
          worldName={worldName}
          date={date}
        />

        {/* Main Result - Habitability */}
        <PDFResultBox
          value={tierInfo ? `Tier ${habitability?.habitabilityTier}` : "Unclassified"}
          label={tierInfo?.name || "Habitability"}
          description={tierInfo?.description || "Complete the habitability assessment to classify this world"}
        />

        {/* Quick Stats */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
            QUICK STATS
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Star Type</Text>
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>{starTypeLabel}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Surface Gravity</Text>
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                {physical?.surfaceGravity || "Not specified"}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Day Length</Text>
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                {physical?.dayLength || tidalLabel}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>Avg Temperature</Text>
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                {temp?.averageSurfaceTemp || "Not specified"}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Parameters */}
        <PDFSection title="Key Parameters">
          <PDFKeyValuePair label="Star Type" value={starTypeLabel} />
          <PDFKeyValuePair label="Habitable Zone Position" value={stellar?.habitableZonePosition || "Not specified"} />
          <PDFKeyValuePair label="Orbital Period" value={stellar?.orbitalPeriod || "Not specified"} />
          <PDFKeyValuePair label="Tidal Status" value={tidalLabel} />
          <PDFKeyValuePair label="Planetary Mass" value={physical?.planetaryMass || "Not specified"} />
          <PDFKeyValuePair label="Atmosphere" value={atmosphere?.primaryGases?.join(", ") || "Not specified"} />
          <PDFKeyValuePair label="Water Coverage" value={hydro?.oceanCoverage || "Not specified"} />
          <PDFKeyValuePair label="Sky Color" value={atmosphere?.skyColor || "Not specified"} />
        </PDFSection>

        {/* Three Pressures Summary */}
        <PDFSection title="Three Pressures Summary">
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>Survival</Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {pressures?.survivalPressure ?
                pressures.survivalPressure.substring(0, 150) + (pressures.survivalPressure.length > 150 ? "..." : "") :
                "Not defined"}
            </Text>
          </View>
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>Social</Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {pressures?.socialPressure ?
                pressures.socialPressure.substring(0, 150) + (pressures.socialPressure.length > 150 ? "..." : "") :
                "Not defined"}
            </Text>
          </View>
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>Psychological</Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {pressures?.psychologicalPressure ?
                pressures.psychologicalPressure.substring(0, 150) + (pressures.psychologicalPressure.length > 150 ? "..." : "") :
                "Not defined"}
            </Text>
          </View>
        </PDFSection>

        {/* Consistency Score */}
        <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.sm, textAlign: "center", color: colors.text.secondary }}>
            Consistency Score: {consistencyScore}/5 checks passed
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default PlanetarySummaryTemplate;
