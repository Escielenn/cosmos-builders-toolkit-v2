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

interface PlanetViewTemplateProps {
  worldName: string;
  worksheets: WorksheetData[];
  date?: string;
}

// Safe nested property access
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

const STAR_TYPE_LABELS: Record<string, string> = {
  "m-dwarf": "M-Dwarf (Red Dwarf)",
  "k-dwarf": "K-Dwarf (Orange Dwarf)",
  "g-type": "G-Type (Sun-like)",
  "f-type": "F-Type",
  binary: "Binary System",
  rogue: "Rogue Planet",
};

const TIER_LABELS: Record<string, string> = {
  "1": "Tier 1, Shirtsleeve",
  "2": "Tier 2, Habitable",
  "3": "Tier 3, Challenging",
  "4": "Tier 4, Hostile",
  "5": "Tier 5, Extreme",
};

const RenderStarSystem = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Star System: {ws.title || "Untitled"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="System Name" value={get(d, "systemName") || ws.title || "-"} />
        <PDFKeyValuePair label="Star Classification" value={get(d, "starClassification")} />
        <PDFKeyValuePair label="Configuration" value={get(d, "configuration")} />
        <PDFKeyValuePair label="Number of Bodies" value={get(d, "bodies.length") || "-"} />
        {get(d, "narrativeHook") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Narrative Hook</Text>
            <Text style={styles.notesText}>{get(d, "narrativeHook")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderPlanetaryProfile = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const starType = get(d, "stellarEnvironment.starType");
  const tier = get(d, "habitability.habitabilityTier");

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Planet: {ws.title || "Untitled"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Star Type" value={STAR_TYPE_LABELS[starType] || starType || "-"} />
        <PDFKeyValuePair label="Surface Gravity" value={get(d, "physicalCharacteristics.surfaceGravity")} />
        <PDFKeyValuePair label="Day Length" value={get(d, "physicalCharacteristics.dayLength")} />
        <PDFKeyValuePair label="Avg Temperature" value={get(d, "temperatureProfile.averageSurfaceTemp")} />
        <PDFKeyValuePair label="Atmosphere" value={get(d, "atmosphericComposition.primaryGases")} />
        <PDFKeyValuePair label="Water Coverage" value={get(d, "hydrosphere.oceanCoverage")} />
        <PDFKeyValuePair label="Habitability" value={TIER_LABELS[tier] || "Unclassified"} />
        <PDFKeyValuePair label="Sky Color" value={get(d, "atmosphericComposition.skyColor")} />
      </View>
    </View>
  );
};

const RenderECR = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const param = get(d, "parameter.selectedParameter");

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Environmental Cascade: {ws.title || param || "Untitled"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Parameter" value={param} />
        {get(d, "synthesis.logicalFlow") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Synthesis</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.logicalFlow").substring(0, 300)}
              {get(d, "synthesis.logicalFlow").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RENDERERS: Record<string, React.FC<{ ws: WorksheetData }>> = {
  "star-system-builder": RenderStarSystem,
  "planetary-profile": RenderPlanetaryProfile,
  "environmental-chain-reaction": RenderECR,
};

const PlanetViewTemplate = ({
  worldName,
  worksheets,
  date,
}: PlanetViewTemplateProps) => {
  // Strip any residual HTML from worksheet data (defensive)
  const sanitized = worksheets.map((ws) => ({
    ...ws,
    data: deepStripHtml(ws.data),
  }));

  // Order worksheets: star system → planetary → ECR
  const order = [
    "star-system-builder",
    "planetary-profile",
    "environmental-chain-reaction",
  ];
  const sorted = [...sanitized].sort(
    (a, b) => order.indexOf(a.tool_type) - order.indexOf(b.tool_type)
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Planet View" worldName={worldName} date={date} hideLogo />

        {/* Summary */}
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
          <Text
            style={{
              fontSize: typography.sizes.xl,
              fontWeight: 700,
              color: colors.primary,
              marginBottom: spacing.xs,
            }}
          >
            {worldName}
          </Text>
          <Text
            style={{
              fontSize: typography.sizes.md,
              color: colors.text.secondary,
            }}
          >
            {worksheets.length} worksheet{worksheets.length !== 1 ? "s" : ""} across star systems, planets, and environments
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

export default PlanetViewTemplate;
