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

interface TechConsequencesFullReportTemplateProps {
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

const EffectRow = ({ label, effect, notes }: { label: string; effect?: string; notes?: string }) => {
  if (!effect && !notes) return null;
  return (
    <View style={{ marginBottom: spacing.sm, paddingLeft: spacing.sm }} wrap={false}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.text.primary, flex: 1 }}>
          {label}
        </Text>
        <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: 600 }}>
          {formatId(effect)}
        </Text>
      </View>
      {notes && (
        <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5, marginTop: 2 }}>
          {notes}
        </Text>
      )}
    </View>
  );
};

const TechConsequencesFullReportTemplate = ({
  formState: rawFormState,
  worldName,
  date,
}: TechConsequencesFullReportTemplateProps) => {
  const formState = deepStripHtml(rawFormState);
  const techName = formState?.technologyName || "Unnamed Technology";

  return (
    <Document>
      {/* Page 1: Technology Definition */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Paradigm"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={techName}
          label={formatId(formState?.technologyCategory)}
          description={
            formState?.maturityLevel
              ? `Maturity: ${formatId(formState.maturityLevel)} | Access: ${formatId(formState.accessLevel)}`
              : undefined
          }
        />

        <PDFSection title="1. Technology Definition">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Category" value={formatId(formState?.technologyCategory)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Maturity Level" value={formatId(formState?.maturityLevel)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Access Level" value={formatId(formState?.accessLevel)} />
            </View>
          </View>
          <TextBlock label="Description" value={formState?.technologyDescription} />
          <TextBlock label="Key Capabilities" value={formState?.keyCapabilities} />
          <TextBlock label="Limitations" value={formState?.limitations} />
        </PDFSection>

        {/* Physical Consequences */}
        <PDFSection title="2. Physical Consequences">
          <PDFKeyValuePair label="Timeframe" value={formatId(formState?.physicalTimeframe)} />
          <EffectRow label="Infrastructure" effect={formState?.infrastructureEffect} notes={formState?.infrastructureNotes} />
          <EffectRow label="Environment" effect={formState?.environmentEffect} notes={formState?.environmentNotes} />
          <EffectRow label="Resources" effect={formState?.resourceEffect} notes={formState?.resourceNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Economic & Social */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Paradigm"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="3. Economic Consequences">
          <PDFKeyValuePair label="Timeframe" value={formatId(formState?.economicTimeframe)} />
          <EffectRow label="Industry" effect={formState?.industryEffect} notes={formState?.industryNotes} />
          <EffectRow label="Employment" effect={formState?.employmentEffect} notes={formState?.employmentNotes} />
          <EffectRow label="Wealth Distribution" effect={formState?.wealthEffect} notes={formState?.wealthNotes} />
        </PDFSection>

        <PDFSection title="4. Social Consequences">
          <PDFKeyValuePair label="Timeframe" value={formatId(formState?.socialTimeframe)} />
          <EffectRow label="Class Structure" effect={formState?.classEffect} notes={formState?.classNotes} />
          <EffectRow label="Family" effect={formState?.familyEffect} notes={formState?.familyNotes} />
          <EffectRow label="Community" effect={formState?.communityEffect} notes={formState?.communityNotes} />
          <EffectRow label="Identity" effect={formState?.identityEffect} notes={formState?.identityNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Political & Military */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Paradigm"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="5. Political Consequences">
          <PDFKeyValuePair label="Timeframe" value={formatId(formState?.politicalTimeframe)} />
          <EffectRow label="Power Distribution" effect={formState?.powerEffect} notes={formState?.powerNotes} />
          <EffectRow label="Surveillance" effect={formState?.surveillanceEffect} notes={formState?.surveillanceNotes} />
          <EffectRow label="Governance" effect={formState?.governanceEffect} notes={formState?.governanceNotes} />
        </PDFSection>

        <PDFSection title="6. Military Consequences">
          <PDFKeyValuePair label="Timeframe" value={formatId(formState?.militaryTimeframe)} />
          <EffectRow label="Warfare" effect={formState?.warfareEffect} notes={formState?.warfareNotes} />
          <EffectRow label="Defense" effect={formState?.defenseEffect} notes={formState?.defenseNotes} />
          <EffectRow label="Deterrence" effect={formState?.deterrenceEffect} notes={formState?.deterrenceNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Psychological & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Paradigm"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="7. Psychological Consequences">
          <PDFKeyValuePair label="Timeframe" value={formatId(formState?.psychologicalTimeframe)} />
          <EffectRow label="Perception" effect={formState?.perceptionEffect} notes={formState?.perceptionNotes} />
          <EffectRow label="Values" effect={formState?.valuesEffect} notes={formState?.valuesNotes} />
          <EffectRow label="Fears & Anxieties" effect={formState?.fearsEffect} notes={formState?.fearsNotes} />
        </PDFSection>

        <PDFSection title="8. Synthesis">
          <TextBlock label="Primary Contradiction" value={formState?.primaryContradiction} />
          <TextBlock label="Contradiction Analysis" value={formState?.contradictionAnalysis} />
          <TextBlock label="Story Conflicts" value={formState?.storyConflicts} />
          <TextBlock label="Winners & Losers" value={formState?.winnersLosers} />
          <TextBlock label="Unexpected Uses" value={formState?.unexpectedUses} />
          <TextBlock label="Technology as Character" value={formState?.technologyCharacter} />
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

export default TechConsequencesFullReportTemplate;
