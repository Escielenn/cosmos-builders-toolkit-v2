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

interface SpacecraftFullReportTemplateProps {
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
  tiny: "Tiny (Under 20m, 1-4 crew)",
  small: "Small (20-100m, 5-20 crew)",
  medium: "Medium (100-300m, 20-100 crew)",
  large: "Large (300-1000m, 100-500 crew)",
  huge: "Huge (1-5km, 500-5000 crew)",
  massive: "Massive (5km+, 5000+ crew)",
};

const ROLE_LABELS: Record<string, string> = {
  military: "Military Combat",
  patrol: "Patrol/Security",
  transport: "Cargo Transport",
  passenger: "Passenger Service",
  exploration: "Exploration",
  mining: "Mining/Industrial",
  smuggling: "Smuggling",
  piracy: "Piracy/Raiding",
  salvage: "Salvage",
  medical: "Medical/Hospital",
  diplomatic: "Diplomatic",
  private: "Private Yacht",
  other: "Other",
};

const GRAVITY_LABELS: Record<string, string> = {
  none: "Zero-G (No artificial gravity)",
  spin: "Spin Gravity (Rotating sections)",
  thrust: "Thrust Gravity (Acceleration provides 'down')",
  artificial: "Artificial Gravity (Technology-based)",
  mixed: "Mixed Zones (Different areas have different gravity)",
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

const SpacecraftFullReportTemplate = ({
  formState,
  worldName,
  date,
}: SpacecraftFullReportTemplateProps) => {
  // Safe access to nested properties
  const identity = formState?.identity;
  const propulsion = formState?.propulsion;
  const lifeSupport = formState?.lifeSupport;
  const living = formState?.living;
  const cultural = formState?.cultural;
  const character = formState?.character;
  const synthesis = formState?.synthesis;

  const shipName = identity?.name || "Unnamed Vessel";
  const shipClass = SHIP_CLASS_LABELS[identity?.class || ""] || identity?.customClass || "Unclassified";
  const shipSize = SIZE_LABELS[identity?.size || ""] || "Unknown size";
  const shipRole = ROLE_LABELS[identity?.role || ""] || identity?.customRole || "Unknown role";
  const gravityType = GRAVITY_LABELS[lifeSupport?.gravity || ""] || "Not specified";

  return (
    <Document>
      {/* Page 1: Identity & Overview */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Spacecraft Designer"
          worldName={worldName}
          date={date}
        />

        {/* Introduction */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "The best SF ships aren't just vehicles—they're places people live, with all the mess, personality, and history that implies."
          </Text>
        </View>

        {/* Ship Name Result Box */}
        <PDFResultBox
          value={shipName}
          label={shipClass}
          description={`${shipRole} • ${shipSize}`}
        />

        {/* Identity Section */}
        <PDFSection title="1. Ship Identity & History">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Ship Name" value={shipName} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Class" value={shipClass} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Role" value={shipRole} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Size" value={shipSize} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Age" value={identity?.age || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Origin" value={identity?.origin || "Not specified"} />
            </View>
          </View>
          <PDFKeyValuePair label="Current Owner" value={identity?.currentOwner || "Not specified"} />
          {identity?.history && (
            <NotesBox label="Ship History" content={identity?.history} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Propulsion */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft Designer" worldName={worldName} date={date} />

        <PDFSection title="2. Propulsion & Architecture">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Drive Type" value={propulsion?.driveType || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Acceleration Profile" value={propulsion?.accelerationProfile || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Fuel Source" value={propulsion?.fuelSource || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Range/Endurance" value={propulsion?.rangeLimit || "Not specified"} />
            </View>
          </View>
          {propulsion?.architecturalConsequences && (
            <NotesBox label="Architectural Consequences" content={propulsion?.architecturalConsequences} />
          )}
          {propulsion?.thrustOrientation && (
            <NotesBox label="Thrust Orientation" content={propulsion?.thrustOrientation} />
          )}
          {propulsion?.noiseVibration && (
            <NotesBox label="Noise & Vibration" content={propulsion?.noiseVibration} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Life Support */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft Designer" worldName={worldName} date={date} />

        <PDFSection title="3. Life Support Systems">
          <PDFKeyValuePair label="Gravity" value={gravityType} />
          {lifeSupport?.atmosphere && (
            <NotesBox label="Atmosphere Management" content={lifeSupport?.atmosphere} />
          )}
          {lifeSupport?.water && (
            <NotesBox label="Water Systems" content={lifeSupport?.water} />
          )}
          {lifeSupport?.food && (
            <NotesBox label="Food & Nutrition" content={lifeSupport?.food} />
          )}
          {lifeSupport?.waste && (
            <NotesBox label="Waste Management" content={lifeSupport?.waste} />
          )}
          {lifeSupport?.medical && (
            <NotesBox label="Medical Facilities" content={lifeSupport?.medical} />
          )}
          {lifeSupport?.emergencyBackups && (
            <NotesBox label="Emergency Backups" content={lifeSupport?.emergencyBackups} />
          )}
          {lifeSupport?.failureModes && (
            <NotesBox label="Failure Modes" content={lifeSupport?.failureModes} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Living Spaces */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft Designer" worldName={worldName} date={date} />

        <PDFSection title="4. Living Spaces & Sensory Experience">
          {living?.crewQuarters && (
            <NotesBox label="Crew Quarters" content={living?.crewQuarters} />
          )}
          {living?.commonAreas && (
            <NotesBox label="Common Areas" content={living?.commonAreas} />
          )}
          {living?.recreation && (
            <NotesBox label="Recreation & Exercise" content={living?.recreation} />
          )}
          {living?.workspaces && (
            <NotesBox label="Work Spaces" content={living?.workspaces} />
          )}

          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Soundscape</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                {living?.soundscape || "Not specified"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Lighting</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                {living?.lighting || "Not specified"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>Smells</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                {living?.smells || "Not specified"}
              </Text>
            </View>
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 5: Cultural Elements */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft Designer" worldName={worldName} date={date} />

        <PDFSection title="5. Cultural Design Elements">
          {cultural?.originCulture && (
            <NotesBox label="Origin Culture" content={cultural?.originCulture} />
          )}
          {cultural?.decorations && (
            <NotesBox label="Decorations & Art" content={cultural?.decorations} />
          )}
          {cultural?.modifications && (
            <NotesBox label="Crew Modifications" content={cultural?.modifications} />
          )}
          {cultural?.rituals && (
            <NotesBox label="Shipboard Rituals" content={cultural?.rituals} />
          )}
          {cultural?.taboos && (
            <NotesBox label="Taboos & Rules" content={cultural?.taboos} />
          )}
          {cultural?.superstitions && (
            <NotesBox label="Superstitions & Traditions" content={cultural?.superstitions} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 6: Ship Character & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft Designer" worldName={worldName} date={date} />

        <PDFSection title="6. Ship as Character">
          {character?.personality && (
            <NotesBox label="Ship Personality" content={character?.personality} />
          )}
          {character?.quirks && (
            <NotesBox label="Quirks & Idiosyncrasies" content={character?.quirks} />
          )}
          {character?.secrets && (
            <NotesBox label="Ship's Secrets" content={character?.secrets} />
          )}
          {character?.reputation && (
            <NotesBox label="Reputation" content={character?.reputation} />
          )}
          {character?.metaphor && (
            <NotesBox label="Thematic Metaphor" content={character?.metaphor} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 7: Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft Designer" worldName={worldName} date={date} />

        <PDFSection title="Synthesis: Bringing It Together">
          {synthesis?.livedInDetails && (
            <NotesBox label="Key Lived-In Details" content={synthesis?.livedInDetails} />
          )}
          {synthesis?.storyHooks && (
            <NotesBox label="Story Hooks" content={synthesis?.storyHooks} />
          )}
          {synthesis?.sensorySignature && (
            <View style={{ marginBottom: spacing.lg }} wrap={false}>
              <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.sm }}>
                Sensory Signature
              </Text>
              <View style={{ padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.6, fontStyle: "italic" }}>
                  {synthesis?.sensorySignature}
                </Text>
              </View>
            </View>
          )}
        </PDFSection>

        {/* Final Quote */}
        <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
            "Function → Culture → Personalization → History → Character"
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpacecraftFullReportTemplate;
