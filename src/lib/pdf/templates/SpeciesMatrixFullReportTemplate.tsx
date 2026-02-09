import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

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
  reproductionCompatibility: string;
  lifespanDifference: string;
  physicalNotes: string;
  languageStatus: string;
  perceptionOverlap: string;
  nonverbalUnderstanding: string;
  culturalConceptGap: string;
  communicationNotes: string;
  tradeRelationship: string;
  resourceRelationship: string;
  laborRelationship: string;
  economicDependency: string;
  economicNotes: string;
  sovereignty: string;
  alliance: string;
  representation: string;
  treatyStatus: string;
  politicalNotes: string;
  culturalAdoption: string;
  populationMixing: string;
  attitudesEach: string;
  hybridStatus: string;
  culturalNotes: string;
  firstContactTime: string;
  firstContactType: string;
  warHistory: string;
  cooperationHistory: string;
  historicalNotes: string;
  currentTensions: string;
  futureRisks: string;
  tensionNotes: string;
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

interface SpeciesMatrixFullReportTemplateProps {
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

const TextBlock = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={{ marginBottom: spacing.sm }} wrap={false}>
      <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
        {value}
      </Text>
    </View>
  );
};

const SpeciesMatrixFullReportTemplate = ({
  formState,
  worldName,
  date,
}: SpeciesMatrixFullReportTemplateProps) => {
  const species = formState?.species || [];
  const pairs = formState?.pairs || [];

  const namedSpecies = species.filter((s) => s.name);
  const speciesCount = namedSpecies.length;
  const pairCount = pairs.length;

  const getSpeciesName = (id: string): string => {
    const s = species.find((sp) => sp.id === id);
    return s?.name || "Unknown";
  };

  return (
    <Document>
      {/* Page 1: Overview & Species Registry */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Species Interaction Matrix"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={`${speciesCount} Species`}
          label={`${pairCount} Interaction Pair${pairCount !== 1 ? "s" : ""}`}
          description={
            formState?.overallEquilibrium
              ? `Equilibrium: ${formatId(formState.overallEquilibrium)}`
              : undefined
          }
        />

        <PDFSection title="1. Species Registry">
          {namedSpecies.map((s) => (
            <View key={s.id} style={{ marginBottom: spacing.md }} wrap={false}>
              <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary }}>
                {s.name}
              </Text>
              {s.shortDescription && (
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 2 }}>
                  {s.shortDescription}
                </Text>
              )}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs, paddingLeft: spacing.sm }}>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <PDFKeyValuePair label="Homeworld" value={s.homeworld || "N/A"} />
                </View>
              </View>
              {s.physicalTraits && (
                <View style={{ paddingLeft: spacing.sm, marginTop: 2 }}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary }}>Physical Traits</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>{s.physicalTraits}</Text>
                </View>
              )}
              {s.culturalTraits && (
                <View style={{ paddingLeft: spacing.sm, marginTop: 2 }}>
                  <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary }}>Cultural Traits</Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>{s.culturalTraits}</Text>
                </View>
              )}
            </View>
          ))}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Pages 2+: Interaction Pairs (one pair per section, react-pdf will break pages as needed) */}
      {pairs.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <PDFHeader
            toolName="Species Interaction Matrix"
            worldName={worldName}
            date={date}
          />

          {pairs.map((pair, index) => {
            const nameA = getSpeciesName(pair.speciesAId);
            const nameB = getSpeciesName(pair.speciesBId);
            const pairTitle = `${nameA} & ${nameB}`;

            return (
              <View key={index} style={{ marginBottom: spacing.xl }} wrap={false}>
                <PDFSection title={`2.${index + 1}. ${pairTitle}`}>
                  <PDFKeyValuePair label="Overall Relationship" value={formatId(pair.overallRelationship)} />

                  {/* Physical Compatibility */}
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                      Physical Compatibility
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Environment" value={formatId(pair.environmentCompatibility)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Biology" value={formatId(pair.biologyCompatibility)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Reproduction" value={formatId(pair.reproductionCompatibility)} />
                      </View>
                    </View>
                    <View style={{ paddingLeft: spacing.sm, marginTop: spacing.xs }}>
                      <PDFKeyValuePair label="Lifespan Difference" value={pair.lifespanDifference || "N/A"} />
                    </View>
                    <TextBlock label="Physical Notes" value={pair.physicalNotes} />
                  </View>

                  {/* Communication */}
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                      Communication
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Language" value={formatId(pair.languageStatus)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Perception Overlap" value={formatId(pair.perceptionOverlap)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Nonverbal" value={formatId(pair.nonverbalUnderstanding)} />
                      </View>
                    </View>
                    <TextBlock label="Communication Notes" value={pair.communicationNotes} />
                  </View>

                  {/* Economic */}
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                      Economic Relations
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Trade" value={formatId(pair.tradeRelationship)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Resources" value={formatId(pair.resourceRelationship)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Dependency" value={formatId(pair.economicDependency)} />
                      </View>
                    </View>
                    <TextBlock label="Economic Notes" value={pair.economicNotes} />
                  </View>

                  {/* Political */}
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                      Political Relations
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Sovereignty" value={formatId(pair.sovereignty)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Alliance" value={formatId(pair.alliance)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Treaty Status" value={formatId(pair.treatyStatus)} />
                      </View>
                    </View>
                    <TextBlock label="Political Notes" value={pair.politicalNotes} />
                  </View>

                  {/* Cultural Exchange */}
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                      Cultural Exchange
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Adoption" value={formatId(pair.culturalAdoption)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Population Mixing" value={formatId(pair.populationMixing)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Hybrid Status" value={formatId(pair.hybridStatus)} />
                      </View>
                    </View>
                    <TextBlock label="Cultural Notes" value={pair.culturalNotes} />
                  </View>

                  {/* Historical Context */}
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                      Historical Context
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="First Contact" value={formatId(pair.firstContactType)} />
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <PDFKeyValuePair label="Contact Time" value={pair.firstContactTime || "N/A"} />
                      </View>
                    </View>
                    <TextBlock label="War History" value={pair.warHistory} />
                    <TextBlock label="Cooperation History" value={pair.cooperationHistory} />
                    <TextBlock label="Historical Notes" value={pair.historicalNotes} />
                  </View>

                  {/* Tensions */}
                  <TextBlock label="Current Tensions" value={pair.currentTensions} />
                  <TextBlock label="Future Risks" value={pair.futureRisks} />
                  <TextBlock label="Tension Notes" value={pair.tensionNotes} />
                </PDFSection>
              </View>
            );
          })}

          <PDFFooter />
        </Page>
      )}

      {/* Final Page: Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Species Interaction Matrix"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="3. System Synthesis">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Overall Equilibrium" value={formatId(formState?.overallEquilibrium)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Overall Trajectory" value={formatId(formState?.overallTrajectory)} />
            </View>
          </View>
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair label="Dominant Species" value={formState?.dominantSpecies || "N/A"} />
          </View>
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair label="Most Volatile Pair" value={formState?.mostVolatilePair || "N/A"} />
          </View>
          <TextBlock label="Central Conflict" value={formState?.centralConflict} />
          <TextBlock label="Peace Opportunity" value={formState?.peaceOpportunity} />
          <TextBlock label="Wildcard Factor" value={formState?.wildcardFactor} />
          <TextBlock label="Story Prompt" value={formState?.storyPrompt} />
          <TextBlock label="Synthesis Notes" value={formState?.synthesisNotes} />
        </PDFSection>

        {(formState?.notes || formState?.generalNotes) && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>General Notes</Text>
            <Text style={styles.notesText}>{formState.generalNotes || formState.notes}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpeciesMatrixFullReportTemplate;
