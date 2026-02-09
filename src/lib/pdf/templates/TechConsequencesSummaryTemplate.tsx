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
  const techName = formState?.technologyName || "Unnamed Technology";
  const category = formatId(formState?.technologyCategory);

  const domains: DomainRow[] = [
    {
      domain: "Physical",
      effects: [formState?.infrastructureEffect, formState?.environmentEffect, formState?.resourceEffect].filter(Boolean),
      timeframe: formState?.physicalTimeframe,
    },
    {
      domain: "Economic",
      effects: [formState?.industryEffect, formState?.employmentEffect, formState?.wealthEffect].filter(Boolean),
      timeframe: formState?.economicTimeframe,
    },
    {
      domain: "Social",
      effects: [formState?.classEffect, formState?.familyEffect, formState?.communityEffect, formState?.identityEffect].filter(Boolean),
      timeframe: formState?.socialTimeframe,
    },
    {
      domain: "Political",
      effects: [formState?.powerEffect, formState?.surveillanceEffect, formState?.governanceEffect].filter(Boolean),
      timeframe: formState?.politicalTimeframe,
    },
    {
      domain: "Military",
      effects: [formState?.warfareEffect, formState?.defenseEffect, formState?.deterrenceEffect].filter(Boolean),
      timeframe: formState?.militaryTimeframe,
    },
    {
      domain: "Psychological",
      effects: [formState?.perceptionEffect, formState?.valuesEffect, formState?.fearsEffect].filter(Boolean),
      timeframe: formState?.psychologicalTimeframe,
    },
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Technology Consequences Map"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={techName}
          label={category}
          description={
            formState?.maturityLevel
              ? `Maturity: ${formatId(formState.maturityLevel)} | Access: ${formatId(formState.accessLevel)}`
              : undefined
          }
        />

        {/* Technology Overview */}
        <PDFSection title="Technology Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Maturity Level" value={formatId(formState?.maturityLevel)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Access Level" value={formatId(formState?.accessLevel)} />
            </View>
          </View>
          {formState?.keyCapabilities && (
            <View style={{ marginTop: spacing.xs }}>
              <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
                Key Capabilities
              </Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
                {formState.keyCapabilities}
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
        {formState?.primaryContradiction && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Primary Contradiction</Text>
            <Text style={styles.notesText}>{formState.primaryContradiction}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default TechConsequencesSummaryTemplate;
