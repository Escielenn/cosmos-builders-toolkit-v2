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
  const propulsionType = PROPULSION_LABELS[formState.system.type] || formState.system.customType || "Unspecified";
  const costLevel = COST_LABELS[formState.system.costComparison] || "Not specified";
  const energySource = ENERGY_LABELS[formState.system.energySource] || formState.system.energySource || "Not specified";

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
              <PDFKeyValuePair label="Max Velocity" value={formState.system.maxVelocity || "Not specified"} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Acceleration" value={formState.system.acceleration || "Not specified"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Cost Level" value={costLevel} />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <PDFKeyValuePair label="Communication Speed" value={formState.system.communicationSpeed || "Not specified"} />
            </View>
          </View>
        </PDFSection>

        {/* Travel Benchmarks */}
        <PDFSection title="Travel Time Benchmarks">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth → Mars" value={formState.benchmarks.earthMars || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth → Jupiter" value={formState.benchmarks.earthJupiter || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth → Neptune" value={formState.benchmarks.earthNeptune || "N/A"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Sol → Alpha Centauri" value={formState.benchmarks.solAlphaCentauri || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Sol → Proxima b" value={formState.benchmarks.solProximaB || "N/A"} />
            </View>
            {formState.benchmarks.customRoute && (
              <View style={{ flex: 1, minWidth: 140 }}>
                <PDFKeyValuePair label={formState.benchmarks.customRoute} value={formState.benchmarks.customRouteTime || "N/A"} />
              </View>
            )}
          </View>
        </PDFSection>

        {/* Economic Costs */}
        <PDFSection title="Economic Costs">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Fuel/Energy" value={formState.costs.fuelEnergy || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Construction" value={formState.costs.construction || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Maintenance" value={formState.costs.maintenance || "N/A"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Crew Capacity" value={formState.costs.crewCapacity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Cargo Capacity" value={formState.costs.cargoCapacity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Service Life" value={formState.costs.serviceLife || "N/A"} />
            </View>
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Economic & Political Domains */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Propulsion Consequences Map" worldName={worldName} date={date} />

        <PDFSection title="2. Economic Implications">
          {formState.economic.immediateConsequence && (
            <NotesBox label="Immediate Consequence" content={formState.economic.immediateConsequence as string} />
          )}
          {formState.economic.tradeGoods && (
            <NotesBox label="Primary Interstellar Trade Goods" content={formState.economic.tradeGoods as string} />
          )}
          {formState.economic.wealthDisparities && (
            <NotesBox label="Wealth Disparities Created" content={formState.economic.wealthDisparities as string} />
          )}
          {formState.economic.laborPatterns && (
            <NotesBox label="Labor & Migration Patterns" content={formState.economic.laborPatterns as string} />
          )}
        </PDFSection>

        <PDFSection title="3. Political & Governance">
          {formState.political.transitTime && (
            <NotesBox label="Message/Command Transit Time" content={formState.political.transitTime as string} />
          )}
          {formState.political.implications && (
            <NotesBox label="Governance Implications" content={formState.political.implications as string} />
          )}
          {formState.political.rebellionResponse && (
            <NotesBox label="Rebellion Response" content={formState.political.rebellionResponse as string} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Military & Social Domains */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Propulsion Consequences Map" worldName={worldName} date={date} />

        <PDFSection title="4. Military Implications">
          {formState.military.warfareNature && (
            <NotesBox label="Nature of Warfare" content={formState.military.warfareNature as string} />
          )}
          {formState.military.defensePossible && (
            <NotesBox label="Defense Possibilities" content={formState.military.defensePossible as string} />
          )}
          {formState.military.forceProjection && (
            <NotesBox label="Force Projection" content={formState.military.forceProjection as string} />
          )}
        </PDFSection>

        <PDFSection title="5. Social Implications">
          {formState.social.familyRelations && (
            <NotesBox label="Family Relationships" content={formState.social.familyRelations as string} />
          )}
          {formState.social.culturalDrift && (
            <NotesBox label="Cultural Drift" content={formState.social.culturalDrift as string} />
          )}
          {formState.social.spacerIdentity && (
            <NotesBox label="Spacer Identity" content={formState.social.spacerIdentity as string} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Psychological & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Propulsion Consequences Map" worldName={worldName} date={date} />

        <PDFSection title="6. Psychological Implications">
          {formState.psychological.perceptionDistance && (
            <NotesBox label="Perception of Distance" content={formState.psychological.perceptionDistance as string} />
          )}
          {formState.psychological.timePressures && (
            <NotesBox label="Time Pressures" content={formState.psychological.timePressures as string} />
          )}
          {formState.psychological.alienation && (
            <NotesBox label="Alienation Effects" content={formState.psychological.alienation as string} />
          )}
        </PDFSection>

        <PDFSection title="7. Final Synthesis">
          {formState.synthesis.propulsionThesis && (
            <View style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }} wrap={false}>
              <Text style={{ fontSize: typography.sizes.md, fontWeight: 600, color: colors.primary, marginBottom: spacing.sm }}>
                Propulsion Thesis
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.6, fontStyle: "italic" }}>
                {formState.synthesis.propulsionThesis}
              </Text>
            </View>
          )}
          {formState.synthesis.mostImportant && (
            <NotesBox label="Most Important Consequence" content={formState.synthesis.mostImportant} />
          )}
          {formState.synthesis.storyConflict && (
            <NotesBox label="Most Interesting Story Conflict" content={formState.synthesis.storyConflict} />
          )}
          {formState.synthesis.unexpectedConsequences && (
            <NotesBox label="Unexpected Consequences" content={formState.synthesis.unexpectedConsequences} />
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
