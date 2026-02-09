import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../../components";

interface WorksheetData {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
}

interface CultureViewTemplateProps {
  worldName: string;
  worksheets: WorksheetData[];
  date?: string;
}

const get = (obj: Record<string, unknown>, path: string): string => {
  const parts = path.split(".");
  let val: unknown = obj;
  for (const p of parts) {
    if (val && typeof val === "object" && p in val) {
      val = (val as Record<string, unknown>)[p];
    } else {
      return "";
    }
  }
  if (Array.isArray(val)) return val.filter(Boolean).join(", ");
  return val != null ? String(val) : "";
};

const RenderXenomythology = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>
        {ws.title || "Xenomythology Framework"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Species" value={get(d, "species.name") || get(d, "speciesName")} />
        <PDFKeyValuePair label="Primary Sense" value={get(d, "sensoryFoundation.primarySense")} />
        <PDFKeyValuePair label="Temporal Perception" value={get(d, "sensoryFoundation.temporalPerception")} />
        <PDFKeyValuePair label="Sacred Concept" value={get(d, "sacredConcepts.primaryConcept")} />
        <PDFKeyValuePair label="Taboo" value={get(d, "sacredConcepts.primaryTaboo")} />
        <PDFKeyValuePair label="Creation Myth Theme" value={get(d, "mythStructures.creationMyth")} />
        <PDFKeyValuePair label="Death Concept" value={get(d, "mythStructures.deathConcept")} />
        <PDFKeyValuePair label="Ritual Practice" value={get(d, "ritualPractice.primaryRitual")} />
        {get(d, "synthesis.mythologicalWorldview") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Mythological Worldview</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.mythologicalWorldview").substring(0, 400)}
              {get(d, "synthesis.mythologicalWorldview").length > 400 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const CultureViewTemplate = ({
  worldName,
  worksheets,
  date,
}: CultureViewTemplateProps) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Culture View" worldName={worldName} date={date} />

        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: 8,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: typography.sizes.xl, fontWeight: 700, color: colors.primary, marginBottom: spacing.xs }}>
            Culture & Mythology
          </Text>
          <Text style={{ fontSize: typography.sizes.md, color: colors.text.secondary }}>
            {worksheets.length} worksheet{worksheets.length !== 1 ? "s" : ""} covering mythological and cultural frameworks
          </Text>
        </View>

        {worksheets.map((ws) => (
          <RenderXenomythology key={ws.id} ws={ws} />
        ))}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default CultureViewTemplate;
