import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../../components";

interface WorksheetData {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
}

interface EmpireViewTemplateProps {
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

const GOV_LABELS: Record<string, string> = {
  monarchy: "Monarchy",
  oligarchy: "Oligarchy",
  democracy: "Democracy",
  theocracy: "Theocracy",
  technocracy: "Technocracy",
  military: "Military Junta",
  corporate: "Corporate State",
  hive: "Hive Mind",
  anarchy: "Anarchy",
  federation: "Federation",
  other: "Other",
};

const RenderEmpire = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const name = get(d, "foundation.name") || ws.title || "Untitled Empire";
  const govType = get(d, "foundation.governmentType");

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Empire: {name}</Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Government Type" value={GOV_LABELS[govType] || govType || "—"} />
        <PDFKeyValuePair label="Legitimacy Source" value={get(d, "foundation.legitimacySource")} />
        <PDFKeyValuePair label="Age" value={get(d, "foundation.age")} />
        <PDFKeyValuePair label="Ruler" value={
          get(d, "foundation.rulerTitle") && get(d, "foundation.currentRuler")
            ? `${get(d, "foundation.rulerTitle")} ${get(d, "foundation.currentRuler")}`
            : get(d, "foundation.currentRuler") || "—"
        } />
        <PDFKeyValuePair label="Scale" value={get(d, "territory.scale")} />
        <PDFKeyValuePair label="Population" value={get(d, "territory.population")} />
        <PDFKeyValuePair label="Economic System" value={get(d, "economy.system")} />
        <PDFKeyValuePair label="Military Doctrine" value={get(d, "military.doctrine")} />
        {get(d, "synthesis.storyPotential") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Story Potential</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.storyPotential").substring(0, 300)}
              {get(d, "synthesis.storyPotential").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderTechConsequences = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const techName = get(d, "technology.name") || ws.title || "Untitled Technology";

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Technology: {techName}</Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Category" value={get(d, "technology.category")} />
        <PDFKeyValuePair label="Maturity Level" value={get(d, "technology.maturityLevel")} />
        <PDFKeyValuePair label="Accessibility" value={get(d, "technology.accessibility")} />
        {/* Show domain summaries */}
        {["physical", "economic", "social", "political", "military", "psychological"].map((domain) => {
          const effect = get(d, `${domain}.primaryEffect`);
          if (!effect) return null;
          return (
            <PDFKeyValuePair
              key={domain}
              label={domain.charAt(0).toUpperCase() + domain.slice(1)}
              value={effect.substring(0, 60) + (effect.length > 60 ? "..." : "")}
            />
          );
        })}
        {get(d, "synthesis.primaryContradiction") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Primary Contradiction</Text>
            <Text style={styles.notesText}>
              {get(d, "synthesis.primaryContradiction").substring(0, 300)}
              {get(d, "synthesis.primaryContradiction").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderDrake = ({ ws }: { ws: WorksheetData }) => {
  const d = ws.data;
  const values = d.values as Record<string, number> | undefined;
  if (!values) return null;

  const N = (values.rStar || 0) * (values.fp || 0) * (values.ne || 0) *
    (values.fl || 0) * (values.fi || 0) * (values.fc || 0) * (values.L || 0);

  const formatN = (n: number): string => {
    if (n < 1) return n.toFixed(4);
    if (n < 1000) return n.toFixed(1);
    if (n < 1000000) return Math.round(n).toLocaleString();
    return (n / 1000000).toFixed(1) + " million";
  };

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>
        Drake Equation: {ws.title || "Calculation"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Estimated Civilizations (N)" value={formatN(N)} />
        <PDFKeyValuePair label="Star Formation Rate (R*)" value={String(values.rStar)} />
        <PDFKeyValuePair label="Civilization Longevity (L)" value={formatN(values.L)} unit="years" />
        {get(d, "worldbuilding.galaxyCharacter") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Galaxy Character</Text>
            <Text style={styles.notesText}>
              {get(d, "worldbuilding.galaxyCharacter").substring(0, 300)}
              {get(d, "worldbuilding.galaxyCharacter").length > 300 ? "..." : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RENDERERS: Record<string, React.FC<{ ws: WorksheetData }>> = {
  "empire-designer": RenderEmpire,
  "technology-consequences": RenderTechConsequences,
  "drake-equation-calculator": RenderDrake,
};

const EmpireViewTemplate = ({
  worldName,
  worksheets,
  date,
}: EmpireViewTemplateProps) => {
  const order = [
    "empire-designer",
    "technology-consequences",
    "drake-equation-calculator",
  ];
  const sorted = [...worksheets].sort(
    (a, b) => order.indexOf(a.tool_type) - order.indexOf(b.tool_type)
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Empire View" worldName={worldName} date={date} />

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
            Civilizations & Empires
          </Text>
          <Text style={{ fontSize: typography.sizes.md, color: colors.text.secondary }}>
            {worksheets.length} worksheet{worksheets.length !== 1 ? "s" : ""} covering governance, technology, and civilization
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

export default EmpireViewTemplate;
