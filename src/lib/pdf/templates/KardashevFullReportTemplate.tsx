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
import {
  calculateKardashev,
  formatPower,
  formatKardashev,
  formatYears,
  formatMultiple,
  type KardashevFormState,
} from "@/lib/kardashev/calculations";
import { GROWTH_RATES, BUDGET_CATEGORIES } from "@/lib/kardashev/data";

interface Props {
  formState: Record<string, unknown>;
  worldName?: string;
  date?: string;
}

const KardashevFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState) as unknown as Record<string, unknown>;
  if (!data) return null;

  const calcInput: KardashevFormState = {
    totalPowerWatts: (data.totalPowerWatts as number) || 0,
    growthRate: (data.growthRate as KardashevFormState["growthRate"]) || "moderate",
    budgetPercentages: (data.budgetPercentages as Record<string, number>) || {},
  };

  const results = calculateKardashev(calcInput);
  const growthLabel = GROWTH_RATES[calcInput.growthRate]?.label || calcInput.growthRate;
  const civilizationPreset = (data.civilizationPreset as string) || "custom";
  const cascade = (data.cascade as Record<string, string>) || {};
  const storyNotes = (data.storyNotes as Record<string, string>) || {};
  const generalNotes = (data.generalNotes as string) || "";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Kardashev Scale" worldName={worldName} date={date} hideLogo />

        {/* Primary Result */}
        <PDFSection title="Civilization Energy Rating">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFResultBox
                label="Kardashev Number"
                value={formatKardashev(results.kardashevNumber)}
                subtitle={`Type ${results.level}`}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PDFResultBox
                label="Total Power Output"
                value={formatPower(results.totalPowerWatts)}
                subtitle={`10^${results.log10Power.toFixed(2)} W`}
              />
            </View>
          </View>
        </PDFSection>

        {/* Configuration */}
        <PDFSection title="Configuration">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Preset" value={civilizationPreset} />
              <PDFKeyValuePair label="Growth Rate" value={growthLabel} />
              <PDFKeyValuePair label="Band" value={results.band.label} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair
                label="Earth Multiple"
                value={formatMultiple(results.earthMultiple, "Earth")}
              />
              <PDFKeyValuePair
                label="Solar Multiple"
                value={formatMultiple(results.solarMultiple, "Sun")}
              />
              <PDFKeyValuePair
                label="Galactic Multiple"
                value={formatMultiple(results.galaxyMultiple, "Galaxy")}
              />
            </View>
          </View>
          {results.yearsToNextLevel != null && (
            <PDFKeyValuePair
              label="Years to Next Level"
              value={formatYears(results.yearsToNextLevel)}
            />
          )}
        </PDFSection>

        {/* Band Description */}
        <PDFSection title="Band Description">
          <Text style={{ fontSize: typography.sizes.body, color: colors.text.secondary, lineHeight: 1.5 }}>
            {results.band.description}
          </Text>
          {results.band.characteristics.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              {results.band.characteristics.map((c, i) => (
                <Text key={i} style={{ fontSize: typography.sizes.body, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {"\u2022 "}{c}
                </Text>
              ))}
            </View>
          )}
        </PDFSection>

        {/* Energy Budget */}
        {Object.keys(calcInput.budgetPercentages).length > 0 && (
          <PDFSection title="Energy Budget Allocation">
            {BUDGET_CATEGORIES.map((cat) => {
              const pct = calcInput.budgetPercentages[cat.id];
              if (pct == null) return null;
              return (
                <PDFKeyValuePair key={cat.id} label={cat.label} value={`${pct}%`} />
              );
            })}
          </PDFSection>
        )}

        {/* Growth Projections */}
        {results.projections.length > 0 && (
          <PDFSection title="Growth Projections">
            {results.projections.map((p) => (
              <PDFKeyValuePair
                key={p.level}
                label={p.label}
                value={p.yearsToReach != null ? formatYears(p.yearsToReach) : "Already reached"}
              />
            ))}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* Page 2: Cascade & Story Notes */}
      {(Object.values(cascade).some(Boolean) || Object.values(storyNotes).some(Boolean) || generalNotes) && (
        <Page size="LETTER" style={styles.page}>
          <PDFHeader toolName="Kardashev Scale" worldName={worldName} date={date} hideLogo />

          {/* Cascade Implications */}
          {Object.values(cascade).some(Boolean) && (
            <PDFSection title="Cascade Implications">
              {cascade.governance && (
                <PDFKeyValuePair label="Governance" value={cascade.governance} />
              )}
              {cascade.warfare && (
                <PDFKeyValuePair label="Warfare" value={cascade.warfare} />
              )}
              {cascade.economics && (
                <PDFKeyValuePair label="Economics" value={cascade.economics} />
              )}
              {cascade.biology && (
                <PDFKeyValuePair label="Biology & Identity" value={cascade.biology} />
              )}
              {cascade.culture && (
                <PDFKeyValuePair label="Culture & Mythology" value={cascade.culture} />
              )}
            </PDFSection>
          )}

          {/* Story Notes */}
          {Object.values(storyNotes).some(Boolean) && (
            <PDFSection title="Story Notes">
              {storyNotes.energySources && (
                <PDFKeyValuePair label="Energy Sources" value={storyNotes.energySources} />
              )}
              {storyNotes.limitations && (
                <PDFKeyValuePair label="Limitations" value={storyNotes.limitations} />
              )}
              {storyNotes.conflicts && (
                <PDFKeyValuePair label="Conflicts" value={storyNotes.conflicts} />
              )}
              {storyNotes.dailyLife && (
                <PDFKeyValuePair label="Daily Life" value={storyNotes.dailyLife} />
              )}
            </PDFSection>
          )}

          {/* General Notes */}
          {generalNotes && (
            <PDFSection title="General Notes">
              <Text style={{ fontSize: typography.sizes.body, color: colors.text.secondary, lineHeight: 1.5 }}>
                {generalNotes}
              </Text>
            </PDFSection>
          )}

          <PDFFooter />
        </Page>
      )}
    </Document>
  );
};

export default KardashevFullReportTemplate;
