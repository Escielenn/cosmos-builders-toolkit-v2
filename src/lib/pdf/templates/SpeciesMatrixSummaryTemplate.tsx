import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";
import { deepStripHtml } from "@/lib/html-utils";

interface Species {
  id: string;
  name: string;
  shortDescription: string;
  homeworld: string;
  physicalTraits: string;
  culturalTraits: string;
}

interface SpeciesPair {
  speciesAId: string;
  speciesBId: string;
  overallRelationship: string;
  environmentCompatibility: string;
  biologyCompatibility: string;
  communicationNotes: string;
  economicNotes: string;
  politicalNotes: string;
  culturalNotes: string;
  currentTensions: string;
  [key: string]: string;
}

interface FormState {
  species: Species[];
  pairs: SpeciesPair[];
  overallEquilibrium: string;
  overallTrajectory: string;
  dominantSpecies: string;
  mostVolatilePair: string;
  synthesisNotes: string;
  storyPrompt: string;
  centralConflict: string;
  peaceOpportunity: string;
  wildcardFactor: string;
  notes: string;
  generalNotes: string;
}

interface SpeciesMatrixSummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

const formatId = (id: string): string => {
  if (!id) return "Not specified";
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const SpeciesMatrixSummaryTemplate = ({
  formState,
  worldName,
  date,
}: SpeciesMatrixSummaryTemplateProps) => {
  const cleanState = deepStripHtml(formState);

  const species = cleanState?.species || [];
  const pairs = cleanState?.pairs || [];

  const namedSpecies = species.filter((s) => s.name);
  const speciesCount = namedSpecies.length;
  const pairCount = pairs.length;

  const getSpeciesName = (id: string): string => {
    const s = species.find((sp) => sp.id === id);
    return s?.name || "Unknown";
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Symbiosis"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={`${speciesCount} Species`}
          label={`${pairCount} Interaction Pair${pairCount !== 1 ? "s" : ""}`}
          description={
            cleanState?.overallEquilibrium
              ? `Equilibrium: ${formatId(cleanState.overallEquilibrium)}`
              : undefined
          }
        />

        {/* Species Registry */}
        {speciesCount > 0 && (
          <PDFSection title="Species Registry">
            {/* Table Header */}
            <View style={{ ...styles.tableHeader, flexDirection: "row" }}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Name</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Homeworld</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Key Traits</Text>
            </View>
            {namedSpecies.map((s) => (
              <View key={s.id} style={{ ...styles.tableRow, flexDirection: "row" }}>
                <Text style={{ ...styles.tableCell, flex: 2, fontWeight: 600 }}>{s.name}</Text>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{s.homeworld || "N/A"}</Text>
                <Text style={{ ...styles.tableCell, flex: 3 }}>
                  {s.physicalTraits
                    ? s.physicalTraits.length > 60
                      ? s.physicalTraits.substring(0, 60) + "..."
                      : s.physicalTraits
                    : "N/A"}
                </Text>
              </View>
            ))}
          </PDFSection>
        )}

        {/* Interaction Pairs */}
        {pairCount > 0 && (
          <PDFSection title="Key Interactions">
            {pairs.slice(0, 4).map((pair, index) => (
              <View key={index} style={{ marginBottom: spacing.sm }} wrap={false}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                  {getSpeciesName(pair.speciesAId)} & {getSpeciesName(pair.speciesBId)}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: 600 }}>
                  {formatId(pair.overallRelationship)}
                </Text>
                {pair.currentTensions && (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 2 }}>
                    Tensions: {pair.currentTensions.length > 80 ? pair.currentTensions.substring(0, 80) + "..." : pair.currentTensions}
                  </Text>
                )}
              </View>
            ))}
            {pairCount > 4 && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                +{pairCount - 4} more pair{pairCount - 4 > 1 ? "s" : ""} in full report
              </Text>
            )}
          </PDFSection>
        )}

        {/* Synthesis */}
        <PDFSection title="Synthesis">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Overall Equilibrium" value={formatId(cleanState?.overallEquilibrium)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Overall Trajectory" value={formatId(cleanState?.overallTrajectory)} />
            </View>
          </View>
          {cleanState?.dominantSpecies && (
            <PDFKeyValuePair label="Dominant Species" value={cleanState.dominantSpecies} />
          )}
          {cleanState?.mostVolatilePair && (
            <PDFKeyValuePair label="Most Volatile Pair" value={cleanState.mostVolatilePair} />
          )}
          {cleanState?.centralConflict && (
            <PDFKeyValuePair label="Central Conflict" value={cleanState.centralConflict} />
          )}
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpeciesMatrixSummaryTemplate;
