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

interface PlanetaryBody {
  id: string;
  name: string;
  type: string;
  subtype: string;
  orbitalZone: string;
  orbitalPeriod: string;
  distanceFromStar: string;
  moons: string;
  rings: boolean;
  tidallyLocked: boolean;
  notes: string;
}

interface FormState {
  systemName: string;
  primaryStar: {
    name: string;
    spectralClass: string;
    customClass: string;
    age: string;
    luminosity: string;
    mass: string;
    notes: string;
  };
  configuration: {
    type: string;
    secondaryStarClass: string;
    tertiaryStarClass: string;
    binaryOrbitalPeriod: string;
    binarySeparation: string;
    configurationNotes: string;
  };
  bodies: PlanetaryBody[];
  orbits: {
    resonancePattern: string;
    resonanceNotes: string;
    stabilityAssessment: string;
    asteroidBelts: string[];
    kuiperBelt: boolean;
    oortCloud: boolean;
    hazards: string;
  };
  history: {
    age: string;
    formationScenario: string;
    majorEvents: string;
    collisionHistory: string;
    migrationHistory: string;
    futureProjection: string;
  };
  habitability: {
    habitableZoneInner: string;
    habitableZoneOuter: string;
    modifiers: string[];
    bestCandidate: string;
    terraformingPotential: string;
    resourceRichness: string;
  };
  narrative: {
    systemCharacter: string;
    visualSignature: string;
    navigationChallenges: string;
    travelTimes: string;
    culturalSignificance: string;
    mysteries: string;
    storyHooks: string;
  };
  synthesis: {
    consistencyChecks: string[];
    primaryConflict: string;
    uniqueFeature: string;
    connectionToPlanetary: string;
    oneSentenceSummary: string;
  };
  generalNotes: string;
}

interface StarSystemSummaryTemplateProps {
  formState: FormState;
  worldName?: string;
  date?: string;
}

const formatId = (id: string): string => {
  if (!id) return "Not specified";
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const StarSystemSummaryTemplate = ({
  formState,
  worldName,
  date,
}: StarSystemSummaryTemplateProps) => {
  const cleanState = deepStripHtml(formState);

  const primaryStar = cleanState?.primaryStar;
  const configuration = cleanState?.configuration;
  const bodies = cleanState?.bodies || [];
  const habitability = cleanState?.habitability;
  const synthesis = cleanState?.synthesis;

  const bodyCount = bodies.filter((b) => b.name || b.type).length;
  const systemName = cleanState?.systemName || "Unnamed System";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Orrery"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={systemName}
          label={`${bodyCount} Bod${bodyCount === 1 ? "y" : "ies"} | ${formatId(configuration?.type || "single")}`}
          description={
            primaryStar?.spectralClass
              ? `Primary: ${formatId(primaryStar.spectralClass)} class star`
              : undefined
          }
        />

        {/* Primary Star */}
        <PDFSection title="Primary Star">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Name" value={primaryStar?.name || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Spectral Class" value={formatId(primaryStar?.spectralClass)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Age" value={primaryStar?.age || "N/A"} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Luminosity" value={primaryStar?.luminosity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mass" value={primaryStar?.mass || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Configuration */}
        {configuration?.type && configuration.type !== "single" && (
          <PDFSection title="Stellar Configuration">
            <PDFKeyValuePair label="Configuration" value={formatId(configuration.type)} />
            {configuration.secondaryStarClass && (
              <PDFKeyValuePair label="Secondary Star" value={formatId(configuration.secondaryStarClass)} />
            )}
            {configuration.tertiaryStarClass && (
              <PDFKeyValuePair label="Tertiary Star" value={formatId(configuration.tertiaryStarClass)} />
            )}
          </PDFSection>
        )}

        {/* Planetary Bodies Table */}
        {bodyCount > 0 && (
          <PDFSection title="Planetary Bodies">
            {/* Table Header */}
            <View style={{ ...styles.tableHeader, flexDirection: "row" }}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Name</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Type</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Zone</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Period</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Moons</Text>
            </View>
            {bodies
              .filter((b) => b.name || b.type)
              .slice(0, 8)
              .map((body) => (
                <View key={body.id} style={{ ...styles.tableRow, flexDirection: "row" }}>
                  <Text style={{ ...styles.tableCell, flex: 2 }}>{body.name || "Unnamed"}</Text>
                  <Text style={{ ...styles.tableCell, flex: 2 }}>{formatId(body.type)}</Text>
                  <Text style={{ ...styles.tableCell, flex: 1.5 }}>{formatId(body.orbitalZone)}</Text>
                  <Text style={{ ...styles.tableCell, flex: 1.5 }}>{body.orbitalPeriod || "N/A"}</Text>
                  <Text style={{ ...styles.tableCell, flex: 1 }}>{body.moons || "0"}</Text>
                </View>
              ))}
          </PDFSection>
        )}

        {/* Habitability */}
        <PDFSection title="Habitability">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair
                label="Habitable Zone"
                value={
                  habitability?.habitableZoneInner && habitability?.habitableZoneOuter
                    ? `${habitability.habitableZoneInner} - ${habitability.habitableZoneOuter} AU`
                    : "N/A"
                }
              />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Best Candidate" value={habitability?.bestCandidate || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Resource Richness" value={habitability?.resourceRichness || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Synthesis Note */}
        {synthesis?.oneSentenceSummary && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Summary</Text>
            <Text style={styles.notesText}>{synthesis.oneSentenceSummary}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default StarSystemSummaryTemplate;
