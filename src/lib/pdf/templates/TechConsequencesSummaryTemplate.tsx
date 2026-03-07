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

interface FormState {
  technologyName: string;
  technologyCategory: string;
  technologyDescription: string;
  maturityLevel: string;
  accessLevel: string;
  keyCapabilities: string;
  limitations: string;
  infrastructureEffect: string;
  infrastructureNotes: string;
  environmentEffect: string;
  environmentNotes: string;
  resourceEffect: string;
  resourceNotes: string;
  physicalTimeframe: string;
  industryEffect: string;
  industryNotes: string;
  employmentEffect: string;
  employmentNotes: string;
  wealthEffect: string;
  wealthNotes: string;
  economicTimeframe: string;
  classEffect: string;
  classNotes: string;
  familyEffect: string;
  familyNotes: string;
  communityEffect: string;
  communityNotes: string;
  identityEffect: string;
  identityNotes: string;
  socialTimeframe: string;
  powerEffect: string;
  powerNotes: string;
  surveillanceEffect: string;
  surveillanceNotes: string;
  governanceEffect: string;
  governanceNotes: string;
  politicalTimeframe: string;
  warfareEffect: string;
  warfareNotes: string;
  defenseEffect: string;
  defenseNotes: string;
  deterrenceEffect: string;
  deterrenceNotes: string;
  militaryTimeframe: string;
  perceptionEffect: string;
  perceptionNotes: string;
  valuesEffect: string;
  valuesNotes: string;
  fearsEffect: string;
  fearsNotes: string;
  psychologicalTimeframe: string;
  primaryContradiction: string;
  contradictionAnalysis: string;
  storyConflicts: string;
  winnersLosers: string;
  unexpectedUses: string;
  technologyCharacter: string;
  notes: string;
  generalNotes: string;
}

interface TechConsequencesSummaryTemplateProps {
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

interface DomainRow {
  domain: string;
  effects: string[];
  timeframe: string;
}

const TechConsequencesSummaryTemplate = ({
  formState,
  worldName,
  date,
}: TechConsequencesSummaryTemplateProps) => {
  const cleanState = deepStripHtml(formState);

  const techName = cleanState?.technologyName || "Unnamed Technology";
  const category = formatId(cleanState?.technologyCategory);

  const domains: DomainRow[] = [
    {
      domain: "Physical",
      effects: [cleanState?.infrastructureEffect, cleanState?.environmentEffect, cleanState?.resourceEffect].filter(Boolean),
      timeframe: cleanState?.physicalTimeframe,
    },
    {
      domain: "Economic",
      effects: [cleanState?.industryEffect, cleanState?.employmentEffect, cleanState?.wealthEffect].filter(Boolean),
      timeframe: cleanState?.economicTimeframe,
    },
    {
      domain: "Social",
      effects: [cleanState?.classEffect, cleanState?.familyEffect, cleanState?.communityEffect, cleanState?.identityEffect].filter(Boolean),
      timeframe: cleanState?.socialTimeframe,
    },
    {
      domain: "Political",
      effects: [cleanState?.powerEffect, cleanState?.surveillanceEffect, cleanState?.governanceEffect].filter(Boolean),
      timeframe: cleanState?.politicalTimeframe,
    },
    {
      domain: "Military",
      effects: [cleanState?.warfareEffect, cleanState?.defenseEffect, cleanState?.deterrenceEffect].filter(Boolean),
      timeframe: cleanState?.militaryTimeframe,
    },
    {
      domain: "Psychological",
      effects: [cleanState?.perceptionEffect, cleanState?.valuesEffect, cleanState?.fearsEffect].filter(Boolean),
      timeframe: cleanState?.psychologicalTimeframe,
    },
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Paradigm"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={techName}
          label={category}
          description={
            cleanState?.maturityLevel
              ? `Maturity: ${formatId(cleanState.maturityLevel)} | Access: ${formatId(cleanState.accessLevel)}`
              : undefined
          }
        />

        {/* Technology Overview */}
        <PDFSection title="Technology Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Maturity Level" value={formatId(cleanState?.maturityLevel)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Access Level" value={formatId(cleanState?.accessLevel)} />
            </View>
          </View>
          {cleanState?.keyCapabilities && (
            <View style={{ marginTop: spacing.xs }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
                Key Capabilities
              </Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {cleanState.keyCapabilities}
              </Text>
            </View>
          )}
        </PDFSection>

        {/* Consequence Summary Table */}
        <PDFSection title="Consequence Summary">
          {/* Table Header */}
          <View style={{ ...styles.tableHeader, flexDirection: "row" }}>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Domain</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Effects</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Timeframe</Text>
          </View>
          {domains.map((row) => (
            <View key={row.domain} style={{ ...styles.tableRow, flexDirection: "row" }}>
              <Text style={{ ...styles.tableCell, flex: 1.5, fontWeight: 600 }}>{row.domain}</Text>
              <Text style={{ ...styles.tableCell, flex: 3 }}>
                {row.effects.length > 0
                  ? row.effects.map(formatId).join(", ")
                  : "Not specified"}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1.5 }}>
                {formatId(row.timeframe)}
              </Text>
            </View>
          ))}
        </PDFSection>

        {/* Primary Contradiction */}
        {cleanState?.primaryContradiction && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Primary Contradiction</Text>
            <Text style={styles.notesText}>{cleanState.primaryContradiction}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default TechConsequencesSummaryTemplate;
