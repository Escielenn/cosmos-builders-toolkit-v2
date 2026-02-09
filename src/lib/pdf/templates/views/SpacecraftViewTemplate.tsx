import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../../components";

interface WorksheetData {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
}

interface SpacecraftViewTemplateProps {
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

const RenderSpacecraft = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const name = get(d, "identity.name") || ws.title || "Untitled Vessel";

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Vessel: {name}</Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Class" value={get(d, "identity.class") || get(d, "identity.customClass")} />
        <PDFKeyValuePair label="Role" value={get(d, "identity.role") || get(d, "identity.customRole")} />
        <PDFKeyValuePair label="Size" value={get(d, "identity.size")} />
        <PDFKeyValuePair label="Age" value={get(d, "identity.age")} />
        <PDFKeyValuePair label="Drive Type" value={get(d, "propulsion.driveType")} />
        <PDFKeyValuePair label="Fuel Source" value={get(d, "propulsion.fuelSource")} />
        <PDFKeyValuePair label="Crew Quarters" value={get(d, "living.crewQuarters")} />
        <PDFKeyValuePair label="Origin" value={get(d, "identity.origin")} />
        {get(d, "identity.history") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>History</Text>
            <Text style={styles.notesText}>
              {get(d, "identity.history").substring(0, 300)}
              {get(d, "identity.history").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderPropulsion = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const propType = get(d, "propulsionType") || ws.title || "Untitled";

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Propulsion: {propType}</Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Propulsion Type" value={get(d, "propulsionType")} />
        <PDFKeyValuePair label="Fuel Type" value={get(d, "fuelType")} />
        <PDFKeyValuePair label="Max Velocity" value={get(d, "maxVelocity")} />
        {/* Consequence domains */}
        {["travel", "economic", "military", "social", "environmental", "political"].map((domain) => {
          const effect = get(d, `consequences.${domain}`);
          if (!effect) return null;
          return (
            <PDFKeyValuePair
              key={domain}
              label={domain.charAt(0).toUpperCase() + domain.slice(1) + " Impact"}
              value={effect.substring(0, 60) + (effect.length > 60 ? "..." : "")}
            />
          );
        })}
        {get(d, "synthesis.narrativeHook") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Narrative Hook</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.narrativeHook").substring(0, 300)}
              {get(d, "synthesis.narrativeHook").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RENDERERS: Record<string, React.FC<{ ws: WorksheetData }>> = {
  "spacecraft-designer": RenderSpacecraft,
  "propulsion-consequences-map": RenderPropulsion,
};

const SpacecraftViewTemplate = ({
  worldName,
  worksheets,
  date,
}: SpacecraftViewTemplateProps) => {
  const order = ["spacecraft-designer", "propulsion-consequences-map"];
  const sorted = [...worksheets].sort(
    (a, b) => order.indexOf(a.tool_type) - order.indexOf(b.tool_type)
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Spacecraft View" worldName={worldName} date={date} />

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
            Spacecraft & Propulsion
          </Text>
          <Text style={{ fontSize: typography.sizes.md, color: colors.text.secondary }}>
            {worksheets.length} worksheet{worksheets.length !== 1 ? "s" : ""} covering vessel design and propulsion technology
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

export default SpacecraftViewTemplate;
