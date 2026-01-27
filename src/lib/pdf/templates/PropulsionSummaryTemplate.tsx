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

interface PropulsionSummaryTemplateProps {
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
  cheap: "Cheaper than Air Travel",
  air: "Like Air Travel",
  "private-jet": "Like Private Jet",
  government: "Government/Corps Only",
  ruinous: "Ruinously Expensive",
};

const PropulsionSummaryTemplate = ({
  formState,
  worldName,
  date,
}: PropulsionSummaryTemplateProps) => {
  const propulsionType = PROPULSION_LABELS[formState.system.type] || formState.system.customType || "Unspecified";
  const costLevel = COST_LABELS[formState.system.costComparison] || "Not specified";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Propulsion Consequences Map"
          worldName={worldName}
          date={date}
        />

        {/* Propulsion Result Box */}
        <PDFResultBox
          value={propulsionType}
          label="Drive System"
          description={`${costLevel} • ${formState.system.maxVelocity || "Velocity unspecified"}`}
        />

        {/* Quick Stats */}
        <PDFSection title="System Parameters">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Max Velocity" value={formState.system.maxVelocity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Acceleration" value={formState.system.acceleration || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Energy Source" value={formState.system.energySource || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Cost Level" value={costLevel} />
            </View>
          </View>
        </PDFSection>

        {/* Travel Benchmarks */}
        <PDFSection title="Travel Times">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth→Mars" value={formState.benchmarks.earthMars || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Earth→Jupiter" value={formState.benchmarks.earthJupiter || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Sol→α Centauri" value={formState.benchmarks.solAlphaCentauri || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Sol→Proxima b" value={formState.benchmarks.solProximaB || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Propulsion Thesis */}
        {formState.synthesis.propulsionThesis && (
          <PDFSection title="Propulsion Thesis">
            <View style={{ padding: spacing.sm, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
                {formState.synthesis.propulsionThesis}
              </Text>
            </View>
          </PDFSection>
        )}

        {/* Key Insights */}
        {(formState.synthesis.mostImportant || formState.synthesis.storyConflict) && (
          <PDFSection title="Key Insights">
            {formState.synthesis.mostImportant && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
                  Most Important Consequence
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.synthesis.mostImportant.length > 200
                    ? formState.synthesis.mostImportant.substring(0, 197) + "..."
                    : formState.synthesis.mostImportant}
                </Text>
              </View>
            )}
            {formState.synthesis.storyConflict && (
              <View>
                <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
                  Story Conflict
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
                  {formState.synthesis.storyConflict.length > 200
                    ? formState.synthesis.storyConflict.substring(0, 197) + "..."
                    : formState.synthesis.storyConflict}
                </Text>
              </View>
            )}
          </PDFSection>
        )}

        {/* Final Quote */}
        <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
            "Travel speed → Economics → Politics → Social structures → Psychology → Culture"
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default PropulsionSummaryTemplate;
