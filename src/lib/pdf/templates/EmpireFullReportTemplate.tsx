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

interface EmpireFullReportTemplateProps {
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

const EmpireFullReportTemplate = ({
  formState: rawFormState,
  worldName,
  date,
}: EmpireFullReportTemplateProps) => {
  const formState = deepStripHtml(rawFormState);
  const foundation = formState?.foundation;
  const power = formState?.power;
  const territory = formState?.territory;
  const economy = formState?.economy;
  const military = formState?.military;
  const culture = formState?.culture;
  const factions = formState?.factions || [];
  const external = formState?.external;
  const stability = formState?.stability;
  const synthesis = formState?.synthesis;

  const factionCount = factions.filter((f) => f.name).length;
  const empireName = foundation?.name || "Unnamed Empire";

  return (
    <Document>
      {/* Page 1: Foundation & Power Structure */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Dominion"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={empireName}
          label={formatId(foundation?.governmentType)}
          description={synthesis?.oneSentenceSummary || undefined}
        />

        <PDFSection title="1. Foundation">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Government Type" value={formatId(foundation?.governmentType)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Legitimacy Source" value={formatId(foundation?.legitimacySource)} />
            </View>
          </View>
          {foundation?.governmentSubtype && (
            <PDFKeyValuePair label="Subtype" value={foundation.governmentSubtype} />
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Age" value={foundation?.age || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Ruler Title" value={foundation?.rulerTitle || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Current Ruler" value={foundation?.currentRuler || "N/A"} />
            </View>
          </View>
          <TextBlock label="Founding Story" value={foundation?.foundingStory} />
        </PDFSection>

        <PDFSection title="2. Power Structure">
          <PDFKeyValuePair
            label="Active Branches"
            value={power?.branches?.map(formatId).join(", ") || "None specified"}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Succession Method" value={formatId(power?.successionMethod)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Bureaucracy Style" value={power?.bureaucracyStyle || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Corruption Level" value={power?.corruptionLevel || "N/A"} />
            </View>
          </View>
          <TextBlock label="Checks & Balances" value={power?.checksAndBalances} />
          <TextBlock label="Power Centers" value={power?.powerCenters} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Territory & Economy */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Dominion"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="3. Territory & Scale">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Scale" value={formatId(territory?.scale)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Population" value={territory?.population || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Capital" value={territory?.capitalLocation || "N/A"} />
            </View>
          </View>
          <TextBlock label="Regions" value={territory?.regions} />
          <TextBlock label="Administration Style" value={territory?.administrationStyle} />
          <TextBlock label="Borders & Security" value={territory?.bordersSecurity} />
        </PDFSection>

        <PDFSection title="4. Economy">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Economic System" value={formatId(economy?.system)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Currency" value={economy?.currency || "N/A"} />
            </View>
          </View>
          <TextBlock label="Primary Resources" value={economy?.primaryResources} />
          <TextBlock label="Trade Relations" value={economy?.tradeRelations} />
          <TextBlock label="Wealth Distribution" value={economy?.wealthDistribution} />
          <TextBlock label="Economic Challenges" value={economy?.economicChallenges} />
        </PDFSection>

        <PDFSection title="5. Military">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Doctrine" value={formatId(military?.doctrine)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Size" value={military?.size || "N/A"} />
            </View>
          </View>
          <TextBlock label="Technology" value={military?.technology} />
          <TextBlock label="Special Units" value={military?.specialUnits} />
          <TextBlock label="Veteran Status" value={military?.veteranStatus} />
          <TextBlock label="Civilian Relations" value={military?.civilianRelations} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Culture & Factions */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Dominion"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="6. Culture">
          <PDFKeyValuePair
            label="Core Values"
            value={culture?.coreValues?.map(formatId).join(", ") || "None specified"}
          />
          <TextBlock label="Symbols" value={culture?.symbols} />
          <TextBlock label="Propaganda" value={culture?.propaganda} />
          <TextBlock label="Language" value={culture?.language} />
          <TextBlock label="Religion" value={culture?.religion} />
          <TextBlock label="Social Classes" value={culture?.socialClasses} />
          <TextBlock label="Cultural Taboos" value={culture?.culturalTaboos} />
        </PDFSection>

        {factionCount > 0 && (
          <PDFSection title={`7. Factions (${factionCount})`}>
            {factions
              .filter((f) => f.name)
              .map((faction) => (
                <View key={faction.id} style={{ marginBottom: spacing.md, paddingLeft: spacing.sm }} wrap={false}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.text.primary }}>
                    {faction.name}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                    Type: {formatId(faction.type)} | Strength: {faction.strength || "Unknown"}
                  </Text>
                  {faction.leader && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                      Leader: {faction.leader}
                    </Text>
                  )}
                  {faction.goals && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 2 }}>
                      Goals: {faction.goals}
                    </Text>
                  )}
                </View>
              ))}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* Page 4: External, Stability & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Dominion"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="8. External Relations">
          <PDFKeyValuePair label="Diplomatic Stance" value={formatId(external?.diplomaticStance)} />
          <TextBlock label="Allies" value={external?.allies} />
          <TextBlock label="Enemies" value={external?.enemies} />
          <TextBlock label="Treaties" value={external?.treaties} />
          <TextBlock label="Foreign Perception" value={external?.foreignPerception} />
          <TextBlock label="Expansion Plans" value={external?.expansionPlans} />
        </PDFSection>

        <PDFSection title="9. Stability Assessment">
          <PDFKeyValuePair
            label="Strengths"
            value={stability?.strengths?.map(formatId).join(", ") || "None identified"}
          />
          <View style={{ marginTop: spacing.xs }}>
            <PDFKeyValuePair
              label="Vulnerabilities"
              value={stability?.vulnerabilities?.map(formatId).join(", ") || "None identified"}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Trajectory" value={stability?.trajectory || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Projected Lifespan" value={stability?.projectedLifespan || "N/A"} />
            </View>
          </View>
          <TextBlock label="Current Crisis" value={stability?.currentCrisis} />
        </PDFSection>

        <PDFSection title="10. Synthesis">
          <TextBlock label="Primary Conflict" value={synthesis?.primaryConflict} />
          <TextBlock label="Unique Feature" value={synthesis?.uniqueFeature} />
          <TextBlock label="Story Potential" value={synthesis?.storyPotential} />
          <TextBlock label="Consistency Notes" value={synthesis?.consistencyNotes} />
          {synthesis?.oneSentenceSummary && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>One-Sentence Summary</Text>
              <Text style={styles.notesText}>{synthesis.oneSentenceSummary}</Text>
            </View>
          )}
        </PDFSection>

        {formState?.generalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>General Notes</Text>
            <Text style={styles.notesText}>{formState.generalNotes}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default EmpireFullReportTemplate;
