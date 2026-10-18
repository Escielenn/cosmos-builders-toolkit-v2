import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, spacing } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { htmlToPlainText } from "@/lib/html-utils";
import { computeGenShip, normalizeGenShipState, DAYS_PER_YEAR } from "@/lib/generation-ship/calculations";
import { buildDriftEvents, chronicleYear } from "@/lib/generation-ship/drift-events";
import { MVP_REFERENCES, CONSUMABLES_SOURCE } from "@/lib/generation-ship/data";
import { fmt, fmtYears } from "@/lib/generation-ship/markdown";

interface Props {
  formState: Record<string, unknown>;
  worldName?: string;
  date?: string;
  /** Full report adds the reference ranges, the drift events and the notes. */
  full?: boolean;
}

const GenerationShipSummaryTemplate = ({ formState, worldName, date, full = false }: Props) => {
  const form = normalizeGenShipState(formState);
  const r = computeGenShip(form);
  const events = full ? buildDriftEvents(form, r) : [];
  const name = form.identity.shipName.trim() || "Unnamed generation ship";
  const v = r.voyage;
  const g = r.genetics;
  const h = r.habitat;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName={`Ark: ${name}`} worldName={worldName} date={date} hideLogo />

        <PDFSection title="Voyage">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFResultBox
                label="Years aboard"
                value={v.valid ? fmt(v.shipYears, 1) : "-"}
                description={v.valid ? `${fmtYears(v.earthYears)} at home` : v.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PDFResultBox
                label="Generations"
                value={fmt(g.generations, 1)}
                description={`${fmt(form.population.generationYears, 1)} years each`}
              />
            </View>
          </View>
          <PDFKeyValuePair label="Route" value={`${form.identity.originName || "origin"} to ${form.identity.destinationName || "destination"}`} />
          <PDFKeyValuePair label="Distance" value={fmt(form.voyage.distanceLy, 2)} unit="ly" />
          <PDFKeyValuePair label="Cruise speed" value={fmt(form.voyage.cruiseFractionC * 100, 3)} unit="% c" />
        </PDFSection>

        <PDFSection title="Population genetics">
          <PDFKeyValuePair label="Founding population" value={fmt(form.population.founding, 0)} />
          <PDFKeyValuePair label="Effective population (Ne)" value={fmt(g.eff.ne, 0)} />
          <PDFKeyValuePair label="Inbreeding at arrival (F)" value={g.fAtArrival.toFixed(4)} />
          <PDFKeyValuePair label="Heterozygosity retained" value={fmt(g.heterozygosityRetained * 100, 1)} unit="%" />
          <PDFKeyValuePair label="Ne needed for F below 0.0625" value={fmt(g.neNeededFirstCousin, 0)} />
        </PDFSection>

        <PDFSection title="Closed loop">
          <PDFKeyValuePair label="Closed-loop efficiency" value={fmt(r.lifeSupport.closedLoopEfficiency * 100, 2)} unit="%" />
          {r.lifeSupport.loops.map((l) => (
            <PDFKeyValuePair
              key={l.id}
              label={`${l.label} reserves last`}
              value={Number.isFinite(l.daysToFailure) ? fmtYears(l.daysToFailure / DAYS_PER_YEAR) : "indefinitely"}
            />
          ))}
          <Text style={styles.resultDescription}>{CONSUMABLES_SOURCE}</Text>
        </PDFSection>

        <PDFSection title="Habitat">
          <PDFKeyValuePair label="Rim gravity" value={h.rimG.toFixed(2)} unit="g" />
          <PDFKeyValuePair label="Spin" value={`${fmt(form.habitat.rpm, 2)} rpm at ${fmt(form.habitat.radiusM, 0)} m`} />
          <PDFKeyValuePair label="Deck area" value={`${fmt(h.availableAreaM2, 0)} of ${fmt(h.requiredAreaM2, 0)} m² required`} />
          <PDFKeyValuePair label="Shielding" value={fmt(h.shieldMassTonnes, 0)} unit="t" />
        </PDFSection>

        {r.warnings.length > 0 && (
          <PDFSection title="Warnings">
            {r.warnings.map((w) => (
              <Text key={w.id} style={styles.resultDescription}>{`// ${w.message}`}</Text>
            ))}
          </PDFSection>
        )}

        {full && (
          <PDFSection title="Published minimum populations">
            {MVP_REFERENCES.map((m) => (
              <PDFKeyValuePair key={m.id} label={`${m.label} (${m.source})`} value={m.figure} />
            ))}
          </PDFSection>
        )}

        {full && events.length > 0 && (
          <PDFSection title="Drift events">
            {events.map((e) => (
              <View key={e.id} style={{ marginBottom: spacing.xs }} wrap={false}>
                <PDFKeyValuePair label={`${chronicleYear(form.identity.launchYear, e)} · gen ${e.generation}`} value={e.title} />
                <Text style={styles.resultDescription}>{e.description}</Text>
              </View>
            ))}
          </PDFSection>
        )}

        {full && (form.notes.shipboardLife || form.notes.forgotten) && (
          <PDFSection title="Shipboard notes">
            {form.notes.shipboardLife ? <Text style={styles.resultDescription}>{htmlToPlainText(form.notes.shipboardLife)}</Text> : null}
            {form.notes.forgotten ? <Text style={styles.resultDescription}>{htmlToPlainText(form.notes.forgotten)}</Text> : null}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default GenerationShipSummaryTemplate;
