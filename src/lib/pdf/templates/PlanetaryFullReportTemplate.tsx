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

interface PlanetaryFullReportTemplateProps {
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

// Water presence labels
const WATER_LABELS: Record<string, string> = {
  ocean: "Ocean World",
  terrestrial: "Terrestrial with Oceans",
  arid: "Arid World",
  ice: "Ice World",
  subsurface: "Subsurface Ocean",
};

// Tectonic labels
const TECTONIC_LABELS: Record<string, string> = {
  active: "Tectonically Active",
  moderate: "Moderate Activity",
  dead: "Geologically Dead",
  hyperactive: "Hyperactive",
};

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

const PlanetaryFullReportTemplate = ({
  formState,
  worldName,
  date,
}: PlanetaryFullReportTemplateProps) => {
  const starTypeLabel = STAR_TYPE_LABELS[formState.stellarEnvironment.starType] || formState.stellarEnvironment.starType || "Not specified";
  const tierInfo = TIER_LABELS[formState.habitability.habitabilityTier];
  const tidalLabel = TIDAL_LABELS[formState.stellarEnvironment.tidalLocking] || "Not specified";
  const waterLabel = WATER_LABELS[formState.hydrosphere.waterPresence] || formState.hydrosphere.waterPresence || "Not specified";
  const tectonicLabel = TECTONIC_LABELS[formState.geological.tectonicActivity] || formState.geological.tectonicActivity || "Not specified";

  // Count consistency checks
  const consistencyChecks = [
    formState.consistencyCheck.starGravityConsistent,
    formState.consistencyCheck.atmosphereTempConsistent,
    formState.consistencyCheck.waterTempConsistent,
    formState.consistencyCheck.gravityBiologyConsistent,
    formState.consistencyCheck.pressuresEnvironmentConsistent,
  ];
  const consistencyScore = consistencyChecks.filter(Boolean).length;

  return (
    <Document>
      {/* Page 1: Overview and Stellar Environment */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Planetary Profile"
          worldName={worldName}
          date={date}
        />

        {/* Introduction */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "The environment isn't just a backdrop—it's a character that shapes every aspect of the story."
          </Text>
        </View>

        {/* Habitability Result */}
        <PDFResultBox
          value={tierInfo ? `Tier ${formState.habitability.habitabilityTier}` : "Unclassified"}
          label={tierInfo?.name || "Habitability"}
          description={tierInfo?.description || "Complete the habitability assessment to classify this world"}
        />

        {/* Stellar Environment */}
        <PDFSection title="1. Stellar Environment">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Star Type" value={starTypeLabel} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Luminosity" value={formState.stellarEnvironment.luminosity || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Habitable Zone Position" value={formState.stellarEnvironment.habitableZonePosition || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Orbital Period" value={formState.stellarEnvironment.orbitalPeriod || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Orbital Eccentricity" value={formState.stellarEnvironment.orbitalEccentricity || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Tidal Status" value={tidalLabel} />
            </View>
          </View>
          {formState.stellarEnvironment.starTypeNotes && (
            <NotesBox label="Star Type Notes" content={formState.stellarEnvironment.starTypeNotes} />
          )}
          {formState.stellarEnvironment.tidalLockingNotes && (
            <NotesBox label="Tidal Locking Notes" content={formState.stellarEnvironment.tidalLockingNotes} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Physical Characteristics and Atmosphere */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="2. Physical Characteristics">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Planetary Mass" value={formState.physicalCharacteristics.planetaryMass || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Surface Gravity" value={formState.physicalCharacteristics.surfaceGravity || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Planetary Radius" value={formState.physicalCharacteristics.planetaryRadius || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Day Length" value={formState.physicalCharacteristics.dayLength || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Axial Tilt" value={formState.physicalCharacteristics.axialTilt || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Seasonal Variation" value={formState.physicalCharacteristics.seasonalVariation || "Not specified"} />
            </View>
          </View>
        </PDFSection>

        <PDFSection title="3. Atmospheric Composition">
          <PDFKeyValuePair
            label="Primary Gases"
            value={formState.atmosphericComposition.primaryGases.length > 0 ? formState.atmosphericComposition.primaryGases.join(", ") : "Not specified"}
          />
          <PDFKeyValuePair
            label="Secondary Gases"
            value={formState.atmosphericComposition.secondaryGases.length > 0 ? formState.atmosphericComposition.secondaryGases.join(", ") : "Not specified"}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Atmospheric Pressure" value={formState.atmosphericComposition.atmosphericPressure || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Greenhouse Effect" value={formState.atmosphericComposition.greenhouseEffect || "Not specified"} />
            </View>
          </View>
          <PDFKeyValuePair label="Sky Color" value={formState.atmosphericComposition.skyColor || "Not specified"} />
          {formState.atmosphericComposition.weatherPatterns && (
            <NotesBox label="Weather Patterns" content={formState.atmosphericComposition.weatherPatterns} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Hydrosphere and Temperature */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="4. Hydrosphere">
          <PDFKeyValuePair label="Water Presence" value={waterLabel} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Ocean Coverage" value={formState.hydrosphere.oceanCoverage || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Water Composition" value={formState.hydrosphere.waterComposition || "Not specified"} />
            </View>
          </View>
          <PDFKeyValuePair label="Ice Presence" value={formState.hydrosphere.icePresence || "Not specified"} />
          {formState.hydrosphere.hydrosphereNotes && (
            <NotesBox label="Hydrosphere Notes" content={formState.hydrosphere.hydrosphereNotes} />
          )}
        </PDFSection>

        <PDFSection title="5. Temperature Profile">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Average Temperature" value={formState.temperatureProfile.averageSurfaceTemp || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Temperature Range" value={formState.temperatureProfile.temperatureRange || "Not specified"} />
            </View>
          </View>
          {formState.temperatureProfile.climateZones && (
            <NotesBox label="Climate Zones" content={formState.temperatureProfile.climateZones} />
          )}
          {formState.temperatureProfile.temperatureNotes && (
            <NotesBox label="Temperature Notes" content={formState.temperatureProfile.temperatureNotes} />
          )}
        </PDFSection>

        <PDFSection title="6. Habitability Assessment">
          <View style={{ padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4, marginBottom: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, textAlign: "center" }}>
              Tier {formState.habitability.habitabilityTier || "?"}: {tierInfo?.name || "Unclassified"}
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, textAlign: "center", marginTop: 2 }}>
              {tierInfo?.description || "Complete the assessment"}
            </Text>
          </View>
          {formState.habitability.tierJustification && (
            <NotesBox label="Tier Justification" content={formState.habitability.tierJustification} />
          )}
          <PDFKeyValuePair
            label="Required Adaptations"
            value={formState.habitability.requiredAdaptations.length > 0 ? formState.habitability.requiredAdaptations.join(", ") : "None specified"}
          />
          {formState.habitability.adaptationNotes && (
            <NotesBox label="Adaptation Notes" content={formState.habitability.adaptationNotes} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Geological Features */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="7. Geological & Environmental Features">
          <PDFKeyValuePair label="Tectonic Activity" value={tectonicLabel} />
          {formState.geological.volcanism && (
            <NotesBox label="Volcanism" content={formState.geological.volcanism} />
          )}
          {formState.geological.mountainRanges && (
            <NotesBox label="Mountain Ranges" content={formState.geological.mountainRanges} />
          )}
          {formState.geological.uniqueFormations && (
            <NotesBox label="Unique Geological Formations" content={formState.geological.uniqueFormations} />
          )}
          {formState.geological.naturalResources && (
            <NotesBox label="Natural Resources" content={formState.geological.naturalResources} />
          )}
          {formState.geological.geologicalHazards && (
            <NotesBox label="Geological Hazards" content={formState.geological.geologicalHazards} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 5: Three Pressures */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="8. The Three Pressures">
          {/* Survival Pressure */}
          <View style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: "#fafafa", borderRadius: 4 }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.sm }}>
              1. Survival Pressure
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              The physical challenges of staying alive
            </Text>
            {formState.threePressures.survivalPressure && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Primary Challenge:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.threePressures.survivalPressure}
                </Text>
              </View>
            )}
            {formState.threePressures.survivalManifestations && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Manifestations:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.threePressures.survivalManifestations}
                </Text>
              </View>
            )}
          </View>

          {/* Social Pressure */}
          <View style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: "#fafafa", borderRadius: 4 }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.sm }}>
              2. Social Pressure
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              How the environment shapes society and culture
            </Text>
            {formState.threePressures.socialPressure && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Social Structure Driver:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.threePressures.socialPressure}
                </Text>
              </View>
            )}
            {formState.threePressures.socialManifestations && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Manifestations:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.threePressures.socialManifestations}
                </Text>
              </View>
            )}
          </View>

          {/* Psychological Pressure */}
          <View style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: "#fafafa", borderRadius: 4 }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.sm }}>
              3. Psychological Pressure
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginBottom: spacing.sm }}>
              Mental and emotional effects of the environment
            </Text>
            {formState.threePressures.psychologicalPressure && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Psychological Challenge:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.threePressures.psychologicalPressure}
                </Text>
              </View>
            )}
            {formState.threePressures.psychologicalManifestations && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Manifestations:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.threePressures.psychologicalManifestations}
                </Text>
              </View>
            )}
          </View>

          {formState.threePressures.pressureInteractions && (
            <NotesBox label="Pressure Interactions" content={formState.threePressures.pressureInteractions} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 6: Narrative Integration */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="9. Narrative Integration">
          {formState.narrative.environmentAsCharacter && (
            <NotesBox label="Environment as Character" content={formState.narrative.environmentAsCharacter} />
          )}
          {formState.narrative.conflictSources && (
            <NotesBox label="Conflict Sources" content={formState.narrative.conflictSources} />
          )}
          {formState.narrative.plotOpportunities && (
            <NotesBox label="Plot Opportunities" content={formState.narrative.plotOpportunities} />
          )}
          {formState.narrative.sensoryDetails && (
            <NotesBox label="Sensory Details" content={formState.narrative.sensoryDetails} />
          )}
          {formState.narrative.uniqueMoments && (
            <NotesBox label="Unique Moments" content={formState.narrative.uniqueMoments} />
          )}
        </PDFSection>

        {/* Consistency Check */}
        <PDFSection title="10. Consistency Check">
          <View style={{ padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4, marginBottom: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, textAlign: "center", color: consistencyScore === 5 ? "#22c55e" : colors.text.secondary }}>
              Consistency Score: {consistencyScore}/5
            </Text>
          </View>
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={{ fontSize: typography.sizes.xs, color: formState.consistencyCheck.starGravityConsistent ? "#22c55e" : colors.text.muted }}>
              {formState.consistencyCheck.starGravityConsistent ? "✓" : "○"} Star Type ↔ Gravity Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: formState.consistencyCheck.atmosphereTempConsistent ? "#22c55e" : colors.text.muted }}>
              {formState.consistencyCheck.atmosphereTempConsistent ? "✓" : "○"} Atmosphere ↔ Temperature Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: formState.consistencyCheck.waterTempConsistent ? "#22c55e" : colors.text.muted }}>
              {formState.consistencyCheck.waterTempConsistent ? "✓" : "○"} Water State ↔ Temperature Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: formState.consistencyCheck.gravityBiologyConsistent ? "#22c55e" : colors.text.muted }}>
              {formState.consistencyCheck.gravityBiologyConsistent ? "✓" : "○"} Gravity ↔ Biology Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: formState.consistencyCheck.pressuresEnvironmentConsistent ? "#22c55e" : colors.text.muted }}>
              {formState.consistencyCheck.pressuresEnvironmentConsistent ? "✓" : "○"} Three Pressures ↔ Environment Consistent
            </Text>
          </View>
          {formState.consistencyCheck.consistencyNotes && (
            <NotesBox label="Consistency Notes" content={formState.consistencyCheck.consistencyNotes} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default PlanetaryFullReportTemplate;
