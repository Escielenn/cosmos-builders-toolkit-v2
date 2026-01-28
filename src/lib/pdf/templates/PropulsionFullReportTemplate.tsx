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
  system: {
    type: string;
    customType: string;
    maxVelocity: string;
    acceleration: string;
    energySource: string;
    communicationSpeed: string;
    costComparison: string;
  };
  benchmarks: {
    earthMars: string;
    earthJupiter: string;
    earthNeptune: string;
    solAlphaCentauri: string;
    solProximaB: string;
    customRoute: string;
    customRouteTime: string;
  };
  costs: {
    fuelEnergy: string;
    construction: string;
    maintenance: string;
    crewCapacity: string;
    cargoCapacity: string;
    serviceLife: string;
  };
  economic: Record<string, string | string[]>;
  political: Record<string, string | string[]>;
  military: Record<string, string | string[]>;
  social: Record<string, string | string[]>;
  psychological: Record<string, string | string[]>;
  synthesis: {
    consistencyChecks: string[];
    inconsistency: string;
    unexpectedConsequences: string;
    economicConflicts: string;
    politicalConflicts: string;
    socialConflicts: string;
    propulsionThesis: string;
    mostImportant: string;
    storyConflict: string;
  };
}

interface PropulsionFullReportTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

const PROPULSION_LABELS: Record<string, string> = {
  chemical: "Chemical Rockets",
  ion: "Ion Drives",
  "nuclear-thermal": "Nuclear Thermal",
  "nuclear-pulse": "Nuclear Pulse",
  fusion: "Fusion Drive",
  antimatter: "Antimatter",
  "solar-sail": "Solar/Laser Sails",
  bussard: "Bussard Ramjet",
  alcubierre: "Alcubierre Warp Drive",
  hyperspace: "Hyperspace/Jump Drive",
  wormhole: "Wormholes/Portals",
  generation: "Generation Ships",
  other: "Other",
};

const COST_LABELS: Record<string, string> = {
  cheap: "Cheaper than Air Travel (Democratized)",
  air: "Like Air Travel (Middle class accessible)",
  "private-jet": "Like Private Jet (Wealthy only)",
  government: "Government/Corps Only",
  ruinous: "Ruinously Expensive (Rare, desperate journeys)",
};

const ENERGY_LABELS: Record<string, string> = {
  chemical: "Chemical Combustion",
  fission: "Nuclear Fission",
  fusion: "Nuclear Fusion",
  antimatter: "Matter-Antimatter Annihilation",
  "zero-point": "Zero-Point Energy",
  other: "Other",
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

const PropulsionFullReportTemplate = ({
  formState,
  worldName,
  date,
}: PropulsionFullReportTemplateProps) => {
  // Safe access to nested properties
  const system = formState?.system;
  const benchmarks = formState?.benchmarks;
  const costs = formState?.costs;
  const economic = formState?.economic;
  const political = formState?.political;
  const military = formState?.military;
  const social = formState?.social;
  const psychological = formState?.psychological;
  const synthesis = formState?.synthesis;

  const propulsionType = PROPULSION_LABELS[system?.type || ""] || system?.customType || "Unspecified";
  const costLevel = COST_LABELS[system?.costComparison || ""] || "Not specified";
  const energySource = ENERGY_LABELS[system?.energySource || ""] || system?.energySource || "Not specified";

  return (
    <Document>
      {/* Page 1: Propulsion System Definition */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Propulsion Consequences Map"
          worldName={worldName}
          date={date}
        />

        {/* Introduction */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "Your propulsion system isn't just a way to move the plot between locations—it fundamentally shapes economics, politics, relationships, and psychology."
          </Text>
        </View>

        {/* Propulsion Result Box */}
        <PDFResultBox
          value={propulsionType}
          label="Drive System"
          description={costLevel}
        />

        {/* System Parameters */}
        <PDFSection title="1. Propulsion System Parameters">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Propulsion Type" value={propulsionType} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Energy Source" value={energySource} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Max Velocity" value={system?.maxVelocity || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Acceleration" value={system?.acceleration || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Cost Level" value={costLevel} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Communication Speed" value={system?.communicationSpeed || "Not specified"} />
            </View>
          </View>
        </PDFSection>

        {/* Travel Benchmarks */}
        <PDFSection title="Travel Time Benchmarks">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth → Mars" value={benchmarks?.earthMars || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth → Jupiter" value={benchmarks?.earthJupiter || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth → Neptune" value={benchmarks?.earthNeptune || "N/A"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Sol → Alpha Centauri" value={benchmarks?.solAlphaCentauri || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Sol → Proxima b" value={benchmarks?.solProximaB || "N/A"} />
            </View>
            {benchmarks?.customRoute && (
              <View style={{ flex: 1, minWidth: 140 }}>
                <PDFKeyValuePair label={benchmarks?.customRoute} value={benchmarks?.customRouteTime || "N/A"} />
              </View>
            )}
          </View>
        </PDFSection>

        {/* Economic Costs */}
        <PDFSection title="Economic Costs">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Fuel/Energy" value={costs?.fuelEnergy || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Construction" value={costs?.construction || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Maintenance" value={costs?.maintenance || "N/A"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Crew Capacity" value={costs?.crewCapacity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Cargo Capacity" value={costs?.cargoCapacity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Service Life" value={costs?.serviceLife || "N/A"} />
            </View>
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Economic & Political Domains */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Propulsion Consequences Map" worldName={worldName} date={date} />

        <PDFSection title="2. Economic Implications">
          {economic?.immediateConsequence && (
            <NotesBox label="Immediate Consequence" content={economic?.immediateConsequence as string} />
          )}
          {economic?.tradeGoods && (
            <NotesBox label="Primary Interstellar Trade Goods" content={economic?.tradeGoods as string} />
          )}
          {economic?.wealthDisparities && (
            <NotesBox label="Wealth Disparities Created" content={economic?.wealthDisparities as string} />
          )}
          {economic?.laborPatterns && (
            <NotesBox label="Labor & Migration Patterns" content={economic?.laborPatterns as string} />
          )}
        </PDFSection>

        <PDFSection title="3. Political & Governance">
          {political?.transitTime && (
            <NotesBox label="Message/Command Transit Time" content={political?.transitTime as string} />
          )}
          {political?.implications && (
            <NotesBox label="Governance Implications" content={political?.implications as string} />
          )}
          {political?.rebellionResponse && (
            <NotesBox label="Rebellion Response" content={political?.rebellionResponse as string} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Military & Social Domains */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Propulsion Consequences Map" worldName={worldName} date={date} />

        <PDFSection title="4. Military Implications">
          {military?.warfareNature && (
            <NotesBox label="Nature of Warfare" content={military?.warfareNature as string} />
          )}
          {military?.defensePossible && (
            <NotesBox label="Defense Possibilities" content={military?.defensePossible as string} />
          )}
          {military?.forceProjection && (
            <NotesBox label="Force Projection" content={military?.forceProjection as string} />
          )}
        </PDFSection>

        <PDFSection title="5. Social Implications">
          {social?.familyRelations && (
            <NotesBox label="Family Relationships" content={social?.familyRelations as string} />
          )}
          {social?.culturalDrift && (
            <NotesBox label="Cultural Drift" content={social?.culturalDrift as string} />
          )}
          {social?.spacerIdentity && (
            <NotesBox label="Spacer Identity" content={social?.spacerIdentity as string} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Psychological & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Propulsion Consequences Map" worldName={worldName} date={date} />

        <PDFSection title="6. Psychological Implications">
          {psychological?.perceptionDistance && (
            <NotesBox label="Perception of Distance" content={psychological?.perceptionDistance as string} />
          )}
          {psychological?.timePressures && (
            <NotesBox label="Time Pressures" content={psychological?.timePressures as string} />
          )}
          {psychological?.alienation && (
            <NotesBox label="Alienation Effects" content={psychological?.alienation as string} />
          )}
        </PDFSection>

        <PDFSection title="7. Final Synthesis">
          {synthesis?.propulsionThesis && (
            <View style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }} wrap={false}>
              <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.sm }}>
                Propulsion Thesis
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.6, fontStyle: "italic" }}>
                {synthesis?.propulsionThesis}
              </Text>
            </View>
          )}
          {synthesis?.mostImportant && (
            <NotesBox label="Most Important Consequence" content={synthesis?.mostImportant} />
          )}
          {synthesis?.storyConflict && (
            <NotesBox label="Most Interesting Story Conflict" content={synthesis?.storyConflict} />
          )}
          {synthesis?.unexpectedConsequences && (
            <NotesBox label="Unexpected Consequences" content={synthesis?.unexpectedConsequences} />
          )}
        </PDFSection>

        {/* Final Quote */}
        <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
            "Fast travel creates empires; slow travel creates autonomous colonies. Cheap travel democratizes; expensive travel stratifies."
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default PropulsionFullReportTemplate;
