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

interface StarSystemFullReportTemplateProps {
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

const TextBlock = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={{ marginBottom: spacing.sm }} wrap={false}>
      <Text style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 }}>
        {value}
      </Text>
    </View>
  );
};

const StarSystemFullReportTemplate = ({
  formState: rawFormState,
  worldName,
  date,
}: StarSystemFullReportTemplateProps) => {
  const formState = deepStripHtml(rawFormState);
  const primaryStar = formState?.primaryStar;
  const configuration = formState?.configuration;
  const bodies = formState?.bodies || [];
  const orbits = formState?.orbits;
  const history = formState?.history;
  const habitability = formState?.habitability;
  const narrative = formState?.narrative;
  const synthesis = formState?.synthesis;

  const bodyCount = bodies.filter((b) => b.name || b.type).length;
  const systemName = formState?.systemName || "Unnamed System";

  return (
    <Document>
      {/* Page 1: Star & Configuration */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Orrery"
          worldName={worldName}
          date={date}
        />

        <PDFResultBox
          value={systemName}
          label={`${bodyCount} Bod${bodyCount === 1 ? "y" : "ies"} | ${formatId(configuration?.type || "single")}`}
          description={synthesis?.oneSentenceSummary || undefined}
        />

        <PDFSection title="1. Primary Star">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Name" value={primaryStar?.name || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Spectral Class" value={formatId(primaryStar?.spectralClass)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Age" value={primaryStar?.age || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Luminosity" value={primaryStar?.luminosity || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Mass" value={primaryStar?.mass || "N/A"} />
            </View>
          </View>
          <TextBlock label="Notes" value={primaryStar?.notes} />
        </PDFSection>

        <PDFSection title="2. Stellar Configuration">
          <PDFKeyValuePair label="Type" value={formatId(configuration?.type)} />
          {configuration?.secondaryStarClass && (
            <PDFKeyValuePair label="Secondary Star Class" value={formatId(configuration.secondaryStarClass)} />
          )}
          {configuration?.tertiaryStarClass && (
            <PDFKeyValuePair label="Tertiary Star Class" value={formatId(configuration.tertiaryStarClass)} />
          )}
          {configuration?.binaryOrbitalPeriod && (
            <PDFKeyValuePair label="Binary Orbital Period" value={configuration.binaryOrbitalPeriod} />
          )}
          {configuration?.binarySeparation && (
            <PDFKeyValuePair label="Binary Separation" value={configuration.binarySeparation} />
          )}
          <TextBlock label="Notes" value={configuration?.configurationNotes} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 2: Planetary Bodies */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Orrery"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="3. Planetary Bodies">
          {bodies
            .filter((b) => b.name || b.type)
            .map((body, index) => (
              <View key={body.id} style={{ marginBottom: spacing.md }} wrap={false}>
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, color: colors.primary, marginBottom: spacing.xs }}>
                  {body.name || `Body ${index + 1}`}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm }}>
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <PDFKeyValuePair label="Type" value={formatId(body.type)} />
                  </View>
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <PDFKeyValuePair label="Subtype" value={formatId(body.subtype)} />
                  </View>
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <PDFKeyValuePair label="Orbital Zone" value={formatId(body.orbitalZone)} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: spacing.sm, marginTop: spacing.xs }}>
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <PDFKeyValuePair label="Orbital Period" value={body.orbitalPeriod || "N/A"} />
                  </View>
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <PDFKeyValuePair label="Distance" value={body.distanceFromStar || "N/A"} />
                  </View>
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <PDFKeyValuePair label="Moons" value={body.moons || "0"} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.md, paddingLeft: spacing.sm, marginTop: spacing.xs }}>
                  {body.rings && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: 600 }}>
                      Has Rings
                    </Text>
                  )}
                  {body.tidallyLocked && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: 600 }}>
                      Tidally Locked
                    </Text>
                  )}
                </View>
                {body.notes && (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, paddingLeft: spacing.sm, marginTop: 2 }}>
                    {body.notes}
                  </Text>
                )}
              </View>
            ))}
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Orbital Mechanics & History */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Orrery"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="4. Orbital Mechanics">
          <PDFKeyValuePair label="Resonance Pattern" value={formatId(orbits?.resonancePattern)} />
          <PDFKeyValuePair label="Stability Assessment" value={orbits?.stabilityAssessment || "N/A"} />
          {orbits?.asteroidBelts && orbits.asteroidBelts.length > 0 && (
            <PDFKeyValuePair
              label="Asteroid Belts"
              value={orbits.asteroidBelts.join(", ")}
            />
          )}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xs }}>
            <PDFKeyValuePair label="Kuiper Belt" value={orbits?.kuiperBelt ? "Yes" : "No"} />
            <PDFKeyValuePair label="Oort Cloud" value={orbits?.oortCloud ? "Yes" : "No"} />
          </View>
          <TextBlock label="Resonance Notes" value={orbits?.resonanceNotes} />
          <TextBlock label="Hazards" value={orbits?.hazards} />
        </PDFSection>

        <PDFSection title="5. System History">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="System Age" value={formatId(history?.age)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Formation Scenario" value={formatId(history?.formationScenario)} />
            </View>
          </View>
          <TextBlock label="Major Events" value={history?.majorEvents} />
          <TextBlock label="Collision History" value={history?.collisionHistory} />
          <TextBlock label="Migration History" value={history?.migrationHistory} />
          <TextBlock label="Future Projection" value={history?.futureProjection} />
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 4: Habitability, Narrative & Synthesis */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Orrery"
          worldName={worldName}
          date={date}
        />

        <PDFSection title="6. Habitability">
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
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Terraforming Potential" value={habitability?.terraformingPotential || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Resource Richness" value={habitability?.resourceRichness || "N/A"} />
            </View>
          </View>
          {habitability?.modifiers && habitability.modifiers.length > 0 && (
            <View style={{ marginTop: spacing.xs }}>
              <PDFKeyValuePair
                label="HZ Modifiers"
                value={habitability.modifiers.map(formatId).join(", ")}
              />
            </View>
          )}
        </PDFSection>

        <PDFSection title="7. Narrative Elements">
          <TextBlock label="System Character" value={narrative?.systemCharacter} />
          <TextBlock label="Visual Signature" value={narrative?.visualSignature} />
          <TextBlock label="Navigation Challenges" value={narrative?.navigationChallenges} />
          <TextBlock label="Travel Times" value={narrative?.travelTimes} />
          <TextBlock label="Cultural Significance" value={narrative?.culturalSignificance} />
          <TextBlock label="Mysteries" value={narrative?.mysteries} />
          <TextBlock label="Story Hooks" value={narrative?.storyHooks} />
        </PDFSection>

        <PDFSection title="8. Synthesis">
          <TextBlock label="Primary Conflict" value={synthesis?.primaryConflict} />
          <TextBlock label="Unique Feature" value={synthesis?.uniqueFeature} />
          <TextBlock label="Connection to Planetary" value={synthesis?.connectionToPlanetary} />
          {synthesis?.consistencyChecks && synthesis.consistencyChecks.length > 0 && (
            <PDFKeyValuePair
              label="Consistency Checks"
              value={synthesis.consistencyChecks.join(", ")}
            />
          )}
          {synthesis?.oneSentenceSummary && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>One-Sentence Summary</Text>
              <Text style={styles.notesText}>{synthesis.oneSentenceSummary}</Text>
            </View>
          )}
        </PDFSection>

        {formState?.generalNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>General Notes</Text>
            <Text style={styles.notesText}>{formState.generalNotes}</Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default StarSystemFullReportTemplate;
