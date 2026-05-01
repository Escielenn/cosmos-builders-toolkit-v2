import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../../components";
import { deepStripHtml } from "@/lib/html-utils";

interface WorksheetData {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
}

interface SpeciesViewTemplateProps {
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

const RenderEvoBio = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const speciesName = get(d, "speciesName") || ws.title || "Untitled Species";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Species: {speciesName}</Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Biochemical Basis" value={get(d, "biochemistry.biochemicalBasis")} />
        <PDFKeyValuePair label="Energy Source" value={get(d, "biochemistry.energySource")} />
        <PDFKeyValuePair label="Symmetry" value={get(d, "bodyPlan.symmetry")} />
        <PDFKeyValuePair label="Integument" value={get(d, "bodyPlan.integument")} />
        <PDFKeyValuePair label="Size Range" value={
          get(d, "bodyPlan.sizeRange.min") && get(d, "bodyPlan.sizeRange.max")
            ? `${get(d, "bodyPlan.sizeRange.min")} - ${get(d, "bodyPlan.sizeRange.max")}`
            : "-"
        } />
        <PDFKeyValuePair label="Primary Senses" value={get(d, "sensory.primarySenses")} />
        <PDFKeyValuePair label="Locomotion" value={get(d, "locomotion.primaryMode")} />
        <PDFKeyValuePair label="Reproduction" value={get(d, "reproduction.reproductionMode")} />
        <PDFKeyValuePair label="Cognition" value={get(d, "cognition.cognitionType")} />
        <PDFKeyValuePair label="Social Structure" value={get(d, "social.socialStructure")} />
        {get(d, "synthesis.narrativePotential") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Narrative Potential</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.narrativePotential").substring(0, 300)}
              {get(d, "synthesis.narrativePotential").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderSpeciesMatrix = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const species = (d.species as Array<{ id: string; name: string; type: string }>) || [];
  const interactions = (d.interactions as Record<string, Record<string, unknown>>) || {};

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Species Interaction Matrix: {ws.title || "Untitled"}
      </Text>
      <View style={styles.sectionContent}>
        {/* Species registry */}
        {species.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Species</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Type</Text>
            </View>
            {species.map((sp) => (
              <View key={sp.id} style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 1 }}>{sp.name || "-"}</Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}>{sp.type || "-"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Interaction count */}
        <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, marginTop: spacing.sm }}>
          {Object.keys(interactions).length} interaction pair{Object.keys(interactions).length !== 1 ? "s" : ""} defined
        </Text>

        {get(d, "synthesis.equilibriumState") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Equilibrium State</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.equilibriumState").substring(0, 300)}
              {get(d, "synthesis.equilibriumState").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderSensorium = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const speciesName = get(d, "speciesName") || ws.title || "Untitled Sensorium";
  const finalSelection = (d.finalSelection as string[]) || [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sensory Systems: {speciesName}</Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Mode" value={get(d, "mode") === "derive" ? "Derived from environment" : "Manually validated"} />
        <PDFKeyValuePair label="Star Type" value={get(d, "environment.star.preset")} />
        <PDFKeyValuePair label="Atmosphere" value={get(d, "environment.atmosphere.preset")} />
        <PDFKeyValuePair label="Medium" value={get(d, "environment.medium.type")} />
        <PDFKeyValuePair label="Selected Senses" value={finalSelection.length > 0 ? `${finalSelection.length} senses` : "None"} />
        <PDFKeyValuePair label="Dominant Sense" value={get(d, "perceptionProfile.dominantSense")} />
        {get(d, "synthesis.narrativeSummary") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Narrative Summary</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.narrativeSummary").substring(0, 300)}
              {get(d, "synthesis.narrativeSummary").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RENDERERS: Record<string, React.FC<{ ws: WorksheetData }>> = {
  "evolutionary-biology": RenderEvoBio,
  "sensorium": RenderSensorium,
  "species-interaction-matrix": RenderSpeciesMatrix,
};

const SpeciesViewTemplate = ({
  worldName,
  worksheets,
  date,
}: SpeciesViewTemplateProps) => {
  // Strip any residual HTML from worksheet data (defensive)
  const sanitized = worksheets.map((ws) => ({
    ...ws,
    data: deepStripHtml(ws.data),
  }));

  const order = ["evolutionary-biology", "sensorium", "species-interaction-matrix"];
  const sorted = [...sanitized].sort(
    (a, b) => order.indexOf(a.tool_type) - order.indexOf(b.tool_type)
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Species View" worldName={worldName} date={date} hideLogo />

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
            Species & Biology
          </Text>
          <Text style={{ fontSize: typography.sizes.md, color: colors.text.secondary }}>
            {worksheets.length} worksheet{worksheets.length !== 1 ? "s" : ""} covering species design and interactions
          </Text>
        </View>

        {sorted.map((ws) => {
          const Renderer = RENDERERS[ws.tool_type];
          if (!Renderer) return null;
          return <Renderer key={ws.id} ws={ws} />;
        })}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SpeciesViewTemplate;
