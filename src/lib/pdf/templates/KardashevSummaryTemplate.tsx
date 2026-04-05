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

const KardashevSummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
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
            </View>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Band" value={results.band.label} />
              <PDFKeyValuePair
                label="Earth Multiple"
                value={formatMultiple(results.earthMultiple, "Earth")}
              />
            </View>
          </View>
        </PDFSection>

        {/* Comparisons */}
        <PDFSection title="Scale Comparisons">
          <PDFKeyValuePair
            label="Solar Multiple"
            value={formatMultiple(results.solarMultiple, "Sun")}
          />
          <PDFKeyValuePair
            label="Galactic Multiple"
            value={formatMultiple(results.galaxyMultiple, "Galaxy")}
          />
          {results.yearsToNextLevel != null && (
            <PDFKeyValuePair
              label="Years to Next Level"
              value={formatYears(results.yearsToNextLevel)}
            />
          )}
        </PDFSection>

        {/* Projections */}
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
    </Document>
  );
};

export default KardashevSummaryTemplate;
