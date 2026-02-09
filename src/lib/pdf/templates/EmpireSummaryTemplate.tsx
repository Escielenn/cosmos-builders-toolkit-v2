import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";

interface Faction {
  id: string;
  name: string;
  type: string;
  goals: string;
  strength: string;
  leader: string;
}

interface FormState {
  foundation: {
    name: string;
    governmentType: string;
    governmentSubtype: string;
    legitimacySource: string;
    age: string;
    foundingStory: string;
    rulerTitle: string;
    currentRuler: string;
  };
  power: {
    branches: string[];
    checksAndBalances: string;
    successionMethod: string;
    powerCenters: string;
    bureaucracyStyle: string;
    corruptionLevel: string;
  };
  territory: {
    scale: string;
    population: string;
    capitalLocation: string;
    regions: string;
    administrationStyle: string;
    bordersSecurity: string;
  };
  economy: {
    system: string;
    primaryResources: string;
    tradeRelations: string;
    currency: string;
    wealthDistribution: string;
    economicChallenges: string;
  };
  military: {
    doctrine: string;
    size: string;
    technology: string;
    specialUnits: string;
    veteranStatus: string;
    civilianRelations: string;
  };
  culture: {
    coreValues: string[];
    symbols: string;
    propaganda: string;
    language: string;
    religion: string;
    socialClasses: string;
    culturalTaboos: string;
  };
  factions: Faction[];
  external: {
    diplomaticStance: string;
    allies: string;
    enemies: string;
    treaties: string;
    foreignPerception: string;
    expansionPlans: string;
  };
  stability: {
    strengths: string[];
    vulnerabilities: string[];
    currentCrisis: string;
    trajectory: string;
    projectedLifespan: string;
  };
  synthesis: {
    primaryConflict: string;
    uniqueFeature: string;
    storyPotential: string;
    consistencyNotes: string;
    oneSentenceSummary: string;
  };
  generalNotes: string;
}

interface EmpireSummaryTemplateProps {
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

const EmpireSummaryTemplate = ({
  formState,
  worldName,
  date,
}: EmpireSummaryTemplateProps) => {
  const foundation = formState?.foundation;
  const territory = formState?.territory;
  const economy = formState?.economy;
  const military = formState?.military;
  const factions = formState?.factions || [];
  const synthesis = formState?.synthesis;

  const factionCount = factions.filter((f) => f.name).length;
  const empireName = foundation?.name || "Unnamed Empire";
  const govType = formatId(foundation?.governmentType);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Empire/Government Designer"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={empireName}
          label={govType}
          description={
            foundation?.legitimacySource
              ? `Legitimacy: ${formatId(foundation.legitimacySource)}`
              : undefined
          }
        />

        {/* Foundation */}
        <PDFSection title="Foundation">
          <PDFKeyValuePair label="Government Type" value={govType} />
          {foundation?.governmentSubtype && (
            <PDFKeyValuePair label="Subtype" value={foundation.governmentSubtype} />
          )}
          <PDFKeyValuePair label="Legitimacy Source" value={formatId(foundation?.legitimacySource)} />
          <PDFKeyValuePair label="Age" value={foundation?.age || "Not specified"} />
          {foundation?.currentRuler && (
            <PDFKeyValuePair
              label="Current Ruler"
              value={`${foundation.rulerTitle ? foundation.rulerTitle + " " : ""}${foundation.currentRuler}`}
            />
          )}
        </PDFSection>

        {/* Territory & Economy */}
        <PDFSection title="Territory & Economy">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Scale" value={formatId(territory?.scale)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Population" value={territory?.population || "N/A"} />
            </View>
          </View>
          {territory?.capitalLocation && (
            <PDFKeyValuePair label="Capital" value={territory.capitalLocation} />
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Economic System" value={formatId(economy?.system)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Currency" value={economy?.currency || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Military & Power */}
        <PDFSection title="Military & Power">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Military Doctrine" value={formatId(military?.doctrine)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Succession Method" value={formatId(formState?.power?.successionMethod)} />
            </View>
          </View>
          <PDFKeyValuePair label="Corruption Level" value={formState?.power?.corruptionLevel || "N/A"} />
        </PDFSection>

        {/* Key Factions */}
        {factionCount > 0 && (
          <PDFSection title={`Key Factions (${factionCount})`}>
            {factions
              .filter((f) => f.name)
              .slice(0, 3)
              .map((faction) => (
                <View key={faction.id} style={{ marginBottom: spacing.xs }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                    {faction.name}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                    {formatId(faction.type)}
                    {faction.leader ? ` | Leader: ${faction.leader}` : ""}
                  </Text>
                </View>
              ))}
            {factionCount > 3 && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                +{factionCount - 3} more faction{factionCount - 3 > 1 ? "s" : ""}
              </Text>
            )}
          </PDFSection>
        )}

        {/* Synthesis Note */}
        {synthesis?.oneSentenceSummary && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Summary</Text>
            <Text style={styles.notesText}>{synthesis.oneSentenceSummary}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default EmpireSummaryTemplate;
