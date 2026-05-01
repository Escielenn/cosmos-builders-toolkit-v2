import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
} from "../components";
import { deepStripHtml } from "@/lib/html-utils";

interface Props {
  formState: {
    approach: { type: string };
    coreStatement: { statement: string; scienceBroken: string };
    justification: { narrativeJustification: string; whatBecomesPossible: string; whatBecomesImpossible: string };
    testability: { inWorldTest: string; rules: string; knownUnknowns: string };
    physicalConsequences: { primaryImpact: string; secondOrderEffects: string };
    techConsequences: { technologicalImpact: string; economicPowerImpact: string };
    socialConsequences: { socialPsychologicalImpact: string; culturalMythologicalImpact: string };
    rigorCommitment: { rigorArea1: string; rigorArea2: string; rigorArea3: string };
    consistencyTest: { hardestQuestion: string; edgeCase: string; connectionToWorld: string };
    declaration: { formalDeclaration: string };
    generalNotes: string;
    [key: string]: unknown;
  };
  worldName?: string;
  date?: string;
}

const NotesBox = ({ label, content }: { label: string; content: string }) => (
  <View style={{ marginBottom: spacing.md }} wrap={false}>
    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
      {label}
    </Text>
    <View style={styles.notesBox}>
      <Text style={styles.notesText}>{content || "Not specified"}</Text>
    </View>
  </View>
);

const OneBigLieFullReportTemplate = ({
  formState: rawFormState,
  worldName,
  date,
}: Props) => {
  const data = deepStripHtml(rawFormState);

  return (
    <Document>
      {/* Page 1: Approach + Core Statement + Science Broken */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
        />

        {/* Introduction */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 1.5, fontStyle: "italic" }}>
            "Hard SF isn't about getting everything right, it's about choosing what you break, and then
            rigorously exploring the consequences."
          </Text>
        </View>

        <PDFSection title="1. Approach">
          <PDFKeyValuePair label="Approach Type" value={data?.approach?.type || "Not specified"} />
        </PDFSection>

        <PDFSection title="2. Core Statement">
          <NotesBox label="The One Big Lie" content={data?.coreStatement?.statement || "Not specified"} />
          <NotesBox label="What Science Is Broken?" content={data?.coreStatement?.scienceBroken || "Not specified"} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Justification */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="3. Justification">
          <NotesBox label="Narrative Justification" content={data?.justification?.narrativeJustification || "Not specified"} />
          <NotesBox label="What Becomes Possible?" content={data?.justification?.whatBecomesPossible || "Not specified"} />
          <NotesBox label="What Becomes Impossible?" content={data?.justification?.whatBecomesImpossible || "Not specified"} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Testability */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="4. Testability & Internal Rules">
          <NotesBox label="In-World Test" content={data?.testability?.inWorldTest || "Not specified"} />
          <NotesBox label="Rules & Constraints" content={data?.testability?.rules || "Not specified"} />
          <NotesBox label="Known Unknowns" content={data?.testability?.knownUnknowns || "Not specified"} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Cascading Consequences */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="5. Physical & Biological Consequences">
          <NotesBox label="Primary Impact" content={data?.physicalConsequences?.primaryImpact || "Not specified"} />
          <NotesBox label="Second-Order Effects" content={data?.physicalConsequences?.secondOrderEffects || "Not specified"} />
        </PDFSection>

        <PDFSection title="6. Technological & Economic Consequences">
          <NotesBox label="Technological Impact" content={data?.techConsequences?.technologicalImpact || "Not specified"} />
          <NotesBox label="Economic & Power Impact" content={data?.techConsequences?.economicPowerImpact || "Not specified"} />
        </PDFSection>

        <PDFSection title="7. Social & Psychological Consequences">
          <NotesBox label="Social & Psychological Impact" content={data?.socialConsequences?.socialPsychologicalImpact || "Not specified"} />
          <NotesBox label="Cultural & Mythological Impact" content={data?.socialConsequences?.culturalMythologicalImpact || "Not specified"} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 5: Rigor Commitment + Consistency Stress Test */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="8. Rigor Commitment">
          <NotesBox label="Rigor Area 1" content={data?.rigorCommitment?.rigorArea1 || "Not specified"} />
          <NotesBox label="Rigor Area 2" content={data?.rigorCommitment?.rigorArea2 || "Not specified"} />
          <NotesBox label="Rigor Area 3" content={data?.rigorCommitment?.rigorArea3 || "Not specified"} />
        </PDFSection>

        <PDFSection title="9. Consistency Stress Test">
          <NotesBox label="Hardest Question" content={data?.consistencyTest?.hardestQuestion || "Not specified"} />
          <NotesBox label="Edge Case" content={data?.consistencyTest?.edgeCase || "Not specified"} />
          <NotesBox label="Connection to World" content={data?.consistencyTest?.connectionToWorld || "Not specified"} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 6: Formal Declaration + General Notes */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Axiom"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="10. Formal Declaration">
          <View style={{ ...styles.notesBox, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryLight, padding: spacing.lg }}>
            <Text style={{ fontSize: typography.sizes.md, color: colors.text.primary, lineHeight: 1.6, fontStyle: "italic" }}>
              {data?.declaration?.formalDeclaration || "No formal declaration provided."}
            </Text>
          </View>
        </PDFSection>

        {data?.generalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>General Notes</Text>
            <Text style={styles.notesText}>{data.generalNotes}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default OneBigLieFullReportTemplate;
