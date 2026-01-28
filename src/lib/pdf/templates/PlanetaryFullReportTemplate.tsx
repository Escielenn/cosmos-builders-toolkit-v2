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
  // Safe access to nested properties
  const stellar = formState?.stellarEnvironment;
  const physical = formState?.physicalCharacteristics;
  const atmosphere = formState?.atmosphericComposition;
  const hydro = formState?.hydrosphere;
  const temp = formState?.temperatureProfile;
  const habitability = formState?.habitability;
  const geological = formState?.geological;
  const pressures = formState?.threePressures;
  const narrative = formState?.narrative;
  const consistency = formState?.consistencyCheck;

  const starTypeLabel = STAR_TYPE_LABELS[stellar?.starType || ""] || stellar?.starType || "Not specified";
  const tierInfo = TIER_LABELS[habitability?.habitabilityTier || ""];
  const tidalLabel = TIDAL_LABELS[stellar?.tidalLocking || ""] || "Not specified";
  const waterLabel = WATER_LABELS[hydro?.waterPresence || ""] || hydro?.waterPresence || "Not specified";
  const tectonicLabel = TECTONIC_LABELS[geological?.tectonicActivity || ""] || geological?.tectonicActivity || "Not specified";

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
          value={tierInfo ? `Tier ${habitability?.habitabilityTier}` : "Unclassified"}
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
              <PDFKeyValuePair label="Luminosity" value={stellar?.luminosity || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Habitable Zone Position" value={stellar?.habitableZonePosition || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Orbital Period" value={stellar?.orbitalPeriod || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Orbital Eccentricity" value={stellar?.orbitalEccentricity || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Tidal Status" value={tidalLabel} />
            </View>
          </View>
          {stellar?.starTypeNotes && (
            <NotesBox label="Star Type Notes" content={stellar.starTypeNotes} />
          )}
          {stellar?.tidalLockingNotes && (
            <NotesBox label="Tidal Locking Notes" content={stellar.tidalLockingNotes} />
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
              <PDFKeyValuePair label="Planetary Mass" value={physical?.planetaryMass || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Surface Gravity" value={physical?.surfaceGravity || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Planetary Radius" value={physical?.planetaryRadius || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Day Length" value={physical?.dayLength || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Axial Tilt" value={physical?.axialTilt || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Seasonal Variation" value={physical?.seasonalVariation || "Not specified"} />
            </View>
          </View>
        </PDFSection>

        <PDFSection title="3. Atmospheric Composition">
          <PDFKeyValuePair
            label="Primary Gases"
            value={atmosphere?.primaryGases?.length ? atmosphere.primaryGases.join(", ") : "Not specified"}
          />
          <PDFKeyValuePair
            label="Secondary Gases"
            value={atmosphere?.secondaryGases?.length ? atmosphere.secondaryGases.join(", ") : "Not specified"}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Atmospheric Pressure" value={atmosphere?.atmosphericPressure || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Greenhouse Effect" value={atmosphere?.greenhouseEffect || "Not specified"} />
            </View>
          </View>
          <PDFKeyValuePair label="Sky Color" value={atmosphere?.skyColor || "Not specified"} />
          {atmosphere?.weatherPatterns && (
            <NotesBox label="Weather Patterns" content={atmosphere.weatherPatterns} />
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
              <PDFKeyValuePair label="Ocean Coverage" value={hydro?.oceanCoverage || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Water Composition" value={hydro?.waterComposition || "Not specified"} />
            </View>
          </View>
          <PDFKeyValuePair label="Ice Presence" value={hydro?.icePresence || "Not specified"} />
          {hydro?.hydrosphereNotes && (
            <NotesBox label="Hydrosphere Notes" content={hydro.hydrosphereNotes} />
          )}
        </PDFSection>

        <PDFSection title="5. Temperature Profile">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Average Temperature" value={temp?.averageSurfaceTemp || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Temperature Range" value={temp?.temperatureRange || "Not specified"} />
            </View>
          </View>
          {temp?.climateZones && (
            <NotesBox label="Climate Zones" content={temp.climateZones} />
          )}
          {temp?.temperatureNotes && (
            <NotesBox label="Temperature Notes" content={temp.temperatureNotes} />
          )}
        </PDFSection>

        <PDFSection title="6. Habitability Assessment">
          <View style={{ padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4, marginBottom: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, textAlign: "center" }}>
              Tier {habitability?.habitabilityTier || "?"}: {tierInfo?.name || "Unclassified"}
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, textAlign: "center", marginTop: 2 }}>
              {tierInfo?.description || "Complete the assessment"}
            </Text>
          </View>
          {habitability?.tierJustification && (
            <NotesBox label="Tier Justification" content={habitability.tierJustification} />
          )}
          <PDFKeyValuePair
            label="Required Adaptations"
            value={habitability?.requiredAdaptations?.length ? habitability.requiredAdaptations.join(", ") : "None specified"}
          />
          {habitability?.adaptationNotes && (
            <NotesBox label="Adaptation Notes" content={habitability.adaptationNotes} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Geological Features */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="7. Geological & Environmental Features">
          <PDFKeyValuePair label="Tectonic Activity" value={tectonicLabel} />
          {geological?.volcanism && (
            <NotesBox label="Volcanism" content={geological.volcanism} />
          )}
          {geological?.mountainRanges && (
            <NotesBox label="Mountain Ranges" content={geological.mountainRanges} />
          )}
          {geological?.uniqueFormations && (
            <NotesBox label="Unique Geological Formations" content={geological.uniqueFormations} />
          )}
          {geological?.naturalResources && (
            <NotesBox label="Natural Resources" content={geological.naturalResources} />
          )}
          {geological?.geologicalHazards && (
            <NotesBox label="Geological Hazards" content={geological.geologicalHazards} />
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
            {pressures?.survivalPressure && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Primary Challenge:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {pressures.survivalPressure}
                </Text>
              </View>
            )}
            {pressures?.survivalManifestations && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Manifestations:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {pressures.survivalManifestations}
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
            {pressures?.socialPressure && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Social Structure Driver:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {pressures.socialPressure}
                </Text>
              </View>
            )}
            {pressures?.socialManifestations && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Manifestations:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {pressures.socialManifestations}
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
            {pressures?.psychologicalPressure && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Psychological Challenge:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {pressures.psychologicalPressure}
                </Text>
              </View>
            )}
            {pressures?.psychologicalManifestations && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.secondary }}>Manifestations:</Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {pressures.psychologicalManifestations}
                </Text>
              </View>
            )}
          </View>

          {pressures?.pressureInteractions && (
            <NotesBox label="Pressure Interactions" content={pressures.pressureInteractions} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 6: Narrative Integration */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planetary Profile" worldName={worldName} date={date} />

        <PDFSection title="9. Narrative Integration">
          {narrative?.environmentAsCharacter && (
            <NotesBox label="Environment as Character" content={narrative.environmentAsCharacter} />
          )}
          {narrative?.conflictSources && (
            <NotesBox label="Conflict Sources" content={narrative.conflictSources} />
          )}
          {narrative?.plotOpportunities && (
            <NotesBox label="Plot Opportunities" content={narrative.plotOpportunities} />
          )}
          {narrative?.sensoryDetails && (
            <NotesBox label="Sensory Details" content={narrative.sensoryDetails} />
          )}
          {narrative?.uniqueMoments && (
            <NotesBox label="Unique Moments" content={narrative.uniqueMoments} />
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
            <Text style={{ fontSize: typography.sizes.xs, color: consistency?.starGravityConsistent ? "#22c55e" : colors.text.muted }}>
              {consistency?.starGravityConsistent ? "✓" : "○"} Star Type ↔ Gravity Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: consistency?.atmosphereTempConsistent ? "#22c55e" : colors.text.muted }}>
              {consistency?.atmosphereTempConsistent ? "✓" : "○"} Atmosphere ↔ Temperature Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: consistency?.waterTempConsistent ? "#22c55e" : colors.text.muted }}>
              {consistency?.waterTempConsistent ? "✓" : "○"} Water State ↔ Temperature Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: consistency?.gravityBiologyConsistent ? "#22c55e" : colors.text.muted }}>
              {consistency?.gravityBiologyConsistent ? "✓" : "○"} Gravity ↔ Biology Consistent
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: consistency?.pressuresEnvironmentConsistent ? "#22c55e" : colors.text.muted }}>
              {consistency?.pressuresEnvironmentConsistent ? "✓" : "○"} Three Pressures ↔ Environment Consistent
            </Text>
          </View>
          {consistency?.consistencyNotes && (
            <NotesBox label="Consistency Notes" content={consistency.consistencyNotes} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default PlanetaryFullReportTemplate;
