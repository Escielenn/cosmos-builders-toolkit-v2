import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../../components";
import { deepStripHtml } from "@/lib/html-utils";
import {
  type ChapterWithWorksheets,
  type WorksheetRecord,
  get,
  TOOL_NAMES,
} from "./helpers";
import type { ExportSection, ExportSubsection } from "@/services/worldExportFormatter";

interface WorldBibleTemplateProps {
  worldName: string;
  worldDescription?: string;
  worldNotes?: string;
  chapters: ChapterWithWorksheets[];
  exportSections?: ExportSection[];
  date?: string;
}

// ── Cover Page ──────────────────────────────────────────────────────────

const CoverPage = ({
  worldName,
  worldDescription,
  date,
  totalWorksheets,
  chapterCount,
}: {
  worldName: string;
  worldDescription?: string;
  date?: string;
  totalWorksheets: number;
  chapterCount: number;
}) => (
  <Page size="LETTER" style={{ ...styles.page, justifyContent: "center", alignItems: "center" }}>
    <View style={{ alignItems: "center", marginBottom: spacing["3xl"] }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: colors.primary,
          textTransform: "uppercase",
          letterSpacing: 4,
          marginBottom: spacing.lg,
        }}
      >
        STELLARFORGE WORLD BIBLE
      </Text>
      <View
        style={{
          borderBottomWidth: 3,
          borderBottomColor: colors.primary,
          width: 120,
          marginBottom: spacing.xl,
        }}
      />
      <Text
        style={{
          fontSize: typography.sizes["3xl"],
          fontWeight: 700,
          color: colors.text.primary,
          textAlign: "center",
          marginBottom: spacing.md,
        }}
      >
        {worldName}
      </Text>
      {worldDescription && (
        <Text
          style={{
            fontSize: typography.sizes.md,
            color: colors.text.secondary,
            textAlign: "center",
            maxWidth: 400,
            lineHeight: 1.6,
          }}
        >
          {worldDescription}
        </Text>
      )}
    </View>
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted, marginBottom: spacing.xs }}>
        {chapterCount} chapter{chapterCount !== 1 ? "s" : ""} • {totalWorksheets} worksheet{totalWorksheets !== 1 ? "s" : ""}
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted }}>
        Generated {date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </Text>
    </View>
    <PDFFooter />
  </Page>
);

// ── Table of Contents Page ──────────────────────────────────────────────

const TOCPage = ({
  chapters,
  hasWorldNotes,
}: {
  chapters: ChapterWithWorksheets[];
  hasWorldNotes: boolean;
}) => (
  <Page size="LETTER" style={styles.page}>
    <Text
      style={{
        fontSize: typography.sizes.xl,
        fontWeight: 700,
        color: colors.primary,
        marginBottom: spacing.xl,
        textTransform: "uppercase",
        letterSpacing: 2,
      }}
    >
      Table of Contents
    </Text>
    <View style={{ borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: spacing.lg }} />

    {hasWorldNotes && (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 600, color: colors.text.primary }}>
          World Overview & Notes
        </Text>
      </View>
    )}

    {chapters.map((cw) => (
      <View
        key={cw.chapter.id}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.sizes.base, fontWeight: 600, color: colors.text.primary }}>
            Chapter {cw.chapter.number}: {cw.chapter.title}
          </Text>
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2 }}>
            {cw.worksheets.length} worksheet{cw.worksheets.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    ))}

    <PDFFooter />
  </Page>
);

// ── World Notes Page ────────────────────────────────────────────────────

const WorldNotesPage = ({ worldName, worldNotes }: { worldName: string; worldNotes: string }) => (
  <Page size="LETTER" style={styles.page}>
    <PDFHeader toolName="World Overview" worldName={worldName} hideLogo />
    <PDFSection title="World Notes">
      <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, lineHeight: 1.6 }}>
        {worldNotes}
      </Text>
    </PDFSection>
    <PDFFooter />
  </Page>
);

// ── Worksheet Renderers ─────────────────────────────────────────────────

const RenderPlanetaryProfile = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {ws.title || "Untitled Planet"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Star Type" value={get(d, "stellarEnvironment.starType")} />
        <PDFKeyValuePair label="Surface Gravity" value={get(d, "physicalCharacteristics.surfaceGravity")} />
        <PDFKeyValuePair label="Day Length" value={get(d, "physicalCharacteristics.dayLength")} />
        <PDFKeyValuePair label="Avg Temperature" value={get(d, "temperatureProfile.averageSurfaceTemp")} />
        <PDFKeyValuePair label="Atmosphere" value={get(d, "atmosphericComposition.primaryGases")} />
        <PDFKeyValuePair label="Water Coverage" value={get(d, "hydrosphere.oceanCoverage")} />
        <PDFKeyValuePair label="Habitability Tier" value={get(d, "habitability.habitabilityTier")} />
        <PDFKeyValuePair label="Sky Color" value={get(d, "atmosphericComposition.skyColor")} />
        {get(d, "threePressures.survivalPressure") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Survival Pressure</Text>
            <Text style={styles.notesText}>{get(d, "threePressures.survivalPressure")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderStarSystem = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {ws.title || "Untitled Star System"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="System Name" value={get(d, "systemName") || ws.title || "-"} />
        <PDFKeyValuePair label="Star Classification" value={get(d, "starClassification")} />
        <PDFKeyValuePair label="Configuration" value={get(d, "configuration")} />
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

const RenderECR = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {ws.title || get(d, "parameter.selectedParameter") || "Untitled Cascade"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Parameter" value={get(d, "parameter.selectedParameter")} />
        {get(d, "synthesis.logicalFlow") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Synthesis</Text>
            <Text style={styles.notesText}>{get(d, "synthesis.logicalFlow")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderEvoBio = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {get(d, "speciesName") || ws.title || "Untitled Species"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Biochemical Basis" value={get(d, "biochemistry.biochemicalBasis")} />
        <PDFKeyValuePair label="Energy Source" value={get(d, "biochemistry.energySource")} />
        <PDFKeyValuePair label="Symmetry" value={get(d, "bodyPlan.symmetry")} />
        <PDFKeyValuePair label="Primary Senses" value={get(d, "sensory.primarySenses")} />
        <PDFKeyValuePair label="Locomotion" value={get(d, "locomotion.primaryMode")} />
        <PDFKeyValuePair label="Cognition" value={get(d, "cognition.cognitionType")} />
        <PDFKeyValuePair label="Social Structure" value={get(d, "social.socialStructure")} />
      </View>
    </View>
  );
};

const RenderSpeciesMatrix = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  const species = (d.species as Array<{ id: string; name: string; type: string }>) || [];
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {ws.title || "Species Interaction Matrix"}
      </Text>
      <View style={styles.sectionContent}>
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
        {get(d, "synthesis.equilibriumState") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Equilibrium</Text>
            <Text style={styles.notesText}>{get(d, "synthesis.equilibriumState")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderEmpire = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {get(d, "foundation.name") || ws.title || "Untitled Empire"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Government" value={get(d, "foundation.governmentType")} />
        <PDFKeyValuePair label="Legitimacy" value={get(d, "foundation.legitimacySource")} />
        <PDFKeyValuePair label="Age" value={get(d, "foundation.age")} />
        <PDFKeyValuePair label="Scale" value={get(d, "territory.scale")} />
        <PDFKeyValuePair label="Population" value={get(d, "territory.population")} />
        <PDFKeyValuePair label="Economy" value={get(d, "economy.system")} />
        {get(d, "synthesis.storyPotential") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Story Potential</Text>
            <Text style={styles.notesText}>{get(d, "synthesis.storyPotential")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderTechConsequences = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {get(d, "technology.name") || ws.title || "Untitled Technology"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Category" value={get(d, "technology.category")} />
        <PDFKeyValuePair label="Maturity" value={get(d, "technology.maturityLevel")} />
        {get(d, "synthesis.primaryContradiction") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Primary Contradiction</Text>
            <Text style={styles.notesText}>{get(d, "synthesis.primaryContradiction")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderDrake = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  const values = d.values as Record<string, number> | undefined;
  if (!values) return null;
  const N = (values.rStar || 0) * (values.fp || 0) * (values.ne || 0) *
    (values.fl || 0) * (values.fi || 0) * (values.fc || 0) * (values.L || 0);
  const fmt = (n: number) => {
    if (n < 1) return n.toFixed(4);
    if (n < 1000) return n.toFixed(1);
    return Math.round(n).toLocaleString();
  };
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {ws.title || "Drake Equation"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Estimated Civilizations (N)" value={fmt(N)} />
        <PDFKeyValuePair label="Civilization Longevity (L)" value={fmt(values.L)} unit="years" />
        {get(d, "worldbuilding.galaxyCharacter") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Galaxy Character</Text>
            <Text style={styles.notesText}>{get(d, "worldbuilding.galaxyCharacter")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderXenomythology = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {ws.title || "Xenomythology Framework"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Species" value={get(d, "species.name") || get(d, "speciesName")} />
        <PDFKeyValuePair label="Primary Sense" value={get(d, "sensoryFoundation.primarySense")} />
        <PDFKeyValuePair label="Sacred Concept" value={get(d, "sacredConcepts.primaryConcept")} />
        {get(d, "synthesis.mythologicalWorldview") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Mythological Worldview</Text>
            <Text style={styles.notesText}>{get(d, "synthesis.mythologicalWorldview")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderSpacecraft = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {get(d, "identity.name") || ws.title || "Untitled Vessel"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Class" value={get(d, "identity.class") || get(d, "identity.customClass")} />
        <PDFKeyValuePair label="Role" value={get(d, "identity.role") || get(d, "identity.customRole")} />
        <PDFKeyValuePair label="Size" value={get(d, "identity.size")} />
        <PDFKeyValuePair label="Drive Type" value={get(d, "propulsion.driveType")} />
        {get(d, "identity.history") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>History</Text>
            <Text style={styles.notesText}>{get(d, "identity.history")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RenderPropulsion = ({ ws }: { ws: WorksheetRecord }) => {
  const d = ws.data;
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
        {get(d, "propulsionType") || ws.title || "Untitled Propulsion"}
      </Text>
      <View style={styles.sectionContent}>
        <PDFKeyValuePair label="Propulsion Type" value={get(d, "propulsionType")} />
        <PDFKeyValuePair label="Fuel Type" value={get(d, "fuelType")} />
        <PDFKeyValuePair label="Max Velocity" value={get(d, "maxVelocity")} />
        {get(d, "synthesis.narrativeHook") && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Narrative Hook</Text>
            <Text style={styles.notesText}>{get(d, "synthesis.narrativeHook")}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RENDERERS: Record<string, React.FC<{ ws: WorksheetRecord }>> = {
  "planetary-profile": RenderPlanetaryProfile,
  "star-system-builder": RenderStarSystem,
  "environmental-chain-reaction": RenderECR,
  "evolutionary-biology": RenderEvoBio,
  "species-interaction-matrix": RenderSpeciesMatrix,
  "empire-designer": RenderEmpire,
  "technology-consequences": RenderTechConsequences,
  "drake-equation-calculator": RenderDrake,
  "xenomythology-framework-builder": RenderXenomythology,
  "spacecraft-designer": RenderSpacecraft,
  "propulsion-consequences-map": RenderPropulsion,
};

// ── Chapter Page ────────────────────────────────────────────────────────

const ChapterPage = ({
  chapter,
  worldName,
}: {
  chapter: ChapterWithWorksheets;
  worldName: string;
}) => (
  <Page size="LETTER" style={styles.page} break>
    <PDFHeader
      toolName={`Chapter ${chapter.chapter.number}: ${chapter.chapter.title}`}
      worldName={worldName}
      hideLogo
    />

    <View
      style={{
        backgroundColor: colors.primaryLight,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        padding: spacing.md,
        marginBottom: spacing.xl,
      }}
    >
      <Text style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: colors.primary }}>
        Chapter {chapter.chapter.number}
      </Text>
      <Text style={{ fontSize: typography.sizes.xl, fontWeight: 700, color: colors.text.primary }}>
        {chapter.chapter.title}
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, marginTop: spacing.xs }}>
        {chapter.worksheets.length} worksheet{chapter.worksheets.length !== 1 ? "s" : ""}
      </Text>
    </View>

    {chapter.worksheets.map((ws) => {
      const Renderer = RENDERERS[ws.tool_type];
      if (!Renderer) return null;
      return <Renderer key={ws.id} ws={ws} />;
    })}

    <PDFFooter />
  </Page>
);

// ── ExportSection-based Rendering ────────────────────────────────────

const SectionSubsection = ({ sub }: { sub: ExportSubsection }) => (
  <View style={{ ...styles.section, marginBottom: spacing.lg }}>
    <Text style={{ ...styles.sectionTitle, color: colors.text.primary }}>
      {sub.title}
    </Text>

    {/* Infobox data table */}
    {sub.infobox.length > 0 && (
      <View style={{ ...styles.sectionContent, marginBottom: spacing.md }}>
        {sub.infobox.map((row, i) => (
          <PDFKeyValuePair key={i} label={row.label} value={row.value} />
        ))}
      </View>
    )}

    {/* Prose content from wiki page */}
    {sub.prose && sub.prose.trim() !== "" && (
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        {sub.prose.split("\n\n").map((paragraph, i) => {
          if (paragraph.startsWith("## ")) {
            return (
              <Text
                key={i}
                style={{
                  fontSize: typography.sizes.md,
                  fontWeight: 700,
                  color: colors.text.primary,
                  marginTop: spacing.md,
                  marginBottom: spacing.xs,
                }}
              >
                {paragraph.replace("## ", "")}
              </Text>
            );
          }
          if (paragraph.startsWith("### ")) {
            return (
              <Text
                key={i}
                style={{
                  fontSize: typography.sizes.base,
                  fontWeight: 600,
                  color: colors.text.secondary,
                  marginTop: spacing.sm,
                  marginBottom: spacing.xs,
                }}
              >
                {paragraph.replace("### ", "")}
              </Text>
            );
          }
          if (paragraph.trim()) {
            return (
              <Text
                key={i}
                style={{
                  fontSize: typography.sizes.base,
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  marginBottom: spacing.sm,
                }}
              >
                {paragraph.trim()}
              </Text>
            );
          }
          return null;
        })}
      </View>
    )}

    {/* Connections */}
    {sub.connections.length > 0 && (
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: 700,
            color: colors.primary,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: spacing.xs,
          }}
        >
          CONNECTIONS
        </Text>
        {sub.connections.map((conn, i) => (
          <Text
            key={i}
            style={{
              fontSize: typography.sizes.sm,
              color: colors.text.secondary,
              marginBottom: 2,
              paddingLeft: spacing.xs,
            }}
          >
            {conn.relationship} {"\u2192"} {conn.targetTitle}
          </Text>
        ))}
      </View>
    )}

    {/* Timeline events */}
    {sub.timelineEvents.length > 0 && (
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: 700,
            color: colors.primary,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: spacing.xs,
          }}
        >
          TIMELINE
        </Text>
        {sub.timelineEvents.map((ev, i) => (
          <View key={i} style={{ marginBottom: spacing.xs, paddingLeft: spacing.xs }}>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary }}>
              <Text style={{ fontWeight: 600 }}>{ev.date}:</Text> {ev.title}
            </Text>
            {ev.description && (
              <Text
                style={{
                  fontSize: typography.sizes.xs,
                  color: colors.text.muted,
                  paddingLeft: spacing.sm,
                  marginTop: 1,
                }}
              >
                {ev.description.slice(0, 200)}
                {ev.description.length > 200 ? "..." : ""}
              </Text>
            )}
          </View>
        ))}
      </View>
    )}
  </View>
);

const ExportSectionPage = ({
  section,
  worldName,
  sectionIndex,
}: {
  section: ExportSection;
  worldName: string;
  sectionIndex: number;
}) => (
  <Page size="LETTER" style={styles.page} break>
    <PDFHeader
      toolName={section.title}
      worldName={worldName}
      hideLogo
    />

    <View
      style={{
        backgroundColor: colors.primaryLight,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        padding: spacing.md,
        marginBottom: spacing.xl,
      }}
    >
      <Text style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: colors.primary }}>
        Section {sectionIndex}
      </Text>
      <Text style={{ fontSize: typography.sizes.xl, fontWeight: 700, color: colors.text.primary }}>
        {section.title}
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, marginTop: spacing.xs }}>
        {section.subsections.length} element{section.subsections.length !== 1 ? "s" : ""}
      </Text>
    </View>

    {section.subsections.map((sub, i) => (
      <SectionSubsection key={i} sub={sub} />
    ))}

    <PDFFooter />
  </Page>
);

const SectionTOCPage = ({
  sections,
  hasWorldNotes,
}: {
  sections: ExportSection[];
  hasWorldNotes: boolean;
}) => (
  <Page size="LETTER" style={styles.page}>
    <Text
      style={{
        fontSize: typography.sizes.xl,
        fontWeight: 700,
        color: colors.primary,
        marginBottom: spacing.xl,
        textTransform: "uppercase",
        letterSpacing: 2,
      }}
    >
      Table of Contents
    </Text>
    <View style={{ borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: spacing.lg }} />

    {hasWorldNotes && (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 600, color: colors.text.primary }}>
          World Overview & Notes
        </Text>
      </View>
    )}

    {sections
      .filter((s) => s.layer !== "overview" && s.layer !== "notes")
      .map((section, i) => (
        <View
          key={section.layer}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.sizes.base, fontWeight: 600, color: colors.text.primary }}>
              {i + 1}. {section.title}
            </Text>
            <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2 }}>
              {section.subsections.length} element{section.subsections.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      ))}

    <PDFFooter />
  </Page>
);

// ── Main Template ───────────────────────────────────────────────────────

const WorldBibleTemplate = ({
  worldName,
  worldDescription,
  worldNotes,
  chapters,
  exportSections,
  date,
}: WorldBibleTemplateProps) => {
  // Strip any residual HTML from worksheet data and text fields (defensive)
  const sanitizedNotes = worldNotes ? deepStripHtml(worldNotes) : undefined;
  const sanitizedDescription = worldDescription ? deepStripHtml(worldDescription) : undefined;

  // If ExportSections are provided, use the new rendering path
  if (exportSections && exportSections.length > 0) {
    const contentSections = exportSections.filter(
      (s) => s.layer !== "overview" && s.layer !== "notes"
    );
    const totalElements = contentSections.reduce(
      (sum, s) => sum + s.subsections.length,
      0
    );

    return (
      <Document>
        <CoverPage
          worldName={worldName}
          worldDescription={sanitizedDescription}
          date={date}
          totalWorksheets={totalElements}
          chapterCount={contentSections.length}
        />

        <SectionTOCPage
          sections={exportSections}
          hasWorldNotes={!!sanitizedNotes}
        />

        {sanitizedNotes && (
          <WorldNotesPage worldName={worldName} worldNotes={sanitizedNotes} />
        )}

        {contentSections.map((section, i) => (
          <ExportSectionPage
            key={section.layer}
            section={section}
            worldName={worldName}
            sectionIndex={i + 1}
          />
        ))}
      </Document>
    );
  }

  // Legacy: chapter-based rendering
  const sanitizedChapters = chapters.map((cw) => ({
    ...cw,
    worksheets: cw.worksheets.map((ws) => ({
      ...ws,
      data: deepStripHtml(ws.data),
    })),
  }));

  const totalWorksheets = sanitizedChapters.reduce(
    (sum, cw) => sum + cw.worksheets.length,
    0
  );

  return (
    <Document>
      {/* Cover */}
      <CoverPage
        worldName={worldName}
        worldDescription={sanitizedDescription}
        date={date}
        totalWorksheets={totalWorksheets}
        chapterCount={sanitizedChapters.length}
      />

      {/* Table of Contents */}
      <TOCPage chapters={sanitizedChapters} hasWorldNotes={!!sanitizedNotes} />

      {/* World Notes (optional) */}
      {sanitizedNotes && (
        <WorldNotesPage worldName={worldName} worldNotes={sanitizedNotes} />
      )}

      {/* Chapters */}
      {sanitizedChapters.map((cw) => (
        <ChapterPage key={cw.chapter.id} chapter={cw} worldName={worldName} />
      ))}
    </Document>
  );
};

export default WorldBibleTemplate;
