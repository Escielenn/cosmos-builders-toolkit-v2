import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
} from "../components";
import { deepStripHtml } from "@/lib/html-utils";

interface FormState {
  approach: { type: string };
  coreStatement: { statement: string; scienceBroken: string };
  justification: { narrativeJustification: string; whatBecomesPossible: string; whatBecomesImpossible: string };
  physicalConsequences: { primaryImpact: string; secondOrderEffects: string };
  techConsequences: { technologicalImpact: string; economicPowerImpact: string };
  socialConsequences: { socialPsychologicalImpact: string; culturalMythologicalImpact: string };
  rigorCommitment: { rigorArea1: string; rigorArea2: string; rigorArea3: string };
  declaration: { formalDeclaration: string };
  [key: string]: unknown;
}

interface OneBigLieSummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

const OneBigLieSummaryTemplate = ({
  formState,
  worldName,
  date,
}: OneBigLieSummaryTemplateProps) => {
  const data = deepStripHtml(formState);

  const approachType = data?.approach?.type;
  const approachLabel =
    approachType === "what-if" ? "The One What If?" : "The One Big Lie";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
          hideLogo={true}
        />

        {/* Approach */}
        <PDFSection title="Approach">
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, fontWeight: 600 }}>
            {approachLabel}
          </Text>
        </PDFSection>

        {/* Core Statement */}
        <PDFSection title="Core Statement">
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
            {data?.coreStatement?.statement || "Not specified"}
          </Text>
        </PDFSection>

        {/* Formal Declaration, prominent bordered box */}
        <View style={{
          ...styles.resultBox,
          alignItems: "flex-start",
          marginBottom: spacing.xl,
        }} wrap={false}>
          <Text style={{
            fontSize: typography.sizes.xs,
            fontWeight: 600,
            color: colors.primary,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: spacing.sm,
          }}>
            Formal Declaration
          </Text>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: colors.text.primary,
            lineHeight: 1.6,
            fontWeight: 600,
          }}>
            {data?.declaration?.formalDeclaration || "Not specified"}
          </Text>
        </View>

        {/* Areas of Maintained Rigor */}
        <PDFSection title="Areas of Maintained Rigor">
          {[
            data?.rigorCommitment?.rigorArea1,
            data?.rigorCommitment?.rigorArea2,
            data?.rigorCommitment?.rigorArea3,
          ].map((area, index) => (
            <View key={index} style={{ flexDirection: "row", marginBottom: spacing.xs }}>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.primary, fontWeight: 600, marginRight: spacing.sm }}>
                {index + 1}.
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.4, flex: 1 }}>
                {area || "Not specified"}
              </Text>
            </View>
          ))}
        </PDFSection>

        {/* Key Consequences */}
        <PDFSection title="Key Consequences">
          <View style={{ marginBottom: spacing.sm }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
              Physical
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {data?.physicalConsequences?.primaryImpact || "Not specified"}
            </Text>
          </View>
          <View style={{ marginBottom: spacing.sm }} wrap={false}>
            <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
              Technological
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {data?.techConsequences?.technologicalImpact || "Not specified"}
            </Text>
          </View>
          <View wrap={false}>
            <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
              Social
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.4 }}>
              {data?.socialConsequences?.socialPsychologicalImpact || "Not specified"}
            </Text>
          </View>
        </PDFSection>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default OneBigLieSummaryTemplate;
