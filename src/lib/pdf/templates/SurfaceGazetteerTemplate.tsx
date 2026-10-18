import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter } from "../components";
import type { GazetteerReport } from "@/lib/surface-cartographer/places";

interface Props {
  report: GazetteerReport;
  /** JPEG/PNG data URL of the map with numbered pins (composeMapSheet). */
  mapImage?: string | null;
  worldName?: string;
  date?: string;
}

/**
 * Surface Cartographer map sheet: the map with numbered pins on page one,
 * then the gazetteer grouped by place type, numbers matching the pins.
 */
const SurfaceGazetteerTemplate = ({ report, mapImage, worldName, date }: Props) => (
  <Document>
    <Page size="LETTER" orientation="landscape" style={styles.page}>
      <PDFHeader toolName={report.title} worldName={worldName} date={date} hideLogo />
      <Text style={[styles.notesText, { marginBottom: spacing.sm }]}>{report.subtitle}</Text>
      {mapImage ? (
        <Image src={mapImage} style={{ width: "100%", objectFit: "contain", maxHeight: 400 }} />
      ) : (
        <Text style={styles.notesText}>Map image unavailable. The gazetteer follows.</Text>
      )}
      <PDFFooter />
    </Page>
    <Page size="LETTER" style={styles.page}>
      <PDFHeader toolName={report.title} worldName={worldName} date={date} hideLogo />
      {report.groups.map((g) => (
        <View key={g.label} style={styles.section}>
          <Text style={styles.sectionTitle} minPresenceAhead={40}>
            {g.label}
          </Text>
          {g.entries.map((e) => (
            <View key={e.id} style={{ marginBottom: spacing.sm }} wrap={false}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ width: 22, fontSize: typography.sizes.base, color: colors.primary }}>{e.n}</Text>
                <Text style={{ flex: 1, fontSize: typography.sizes.base, color: colors.text.primary }}>{e.name}</Text>
                <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>{e.coords}</Text>
              </View>
              {e.meta ? (
                <Text style={{ marginLeft: 22, fontSize: typography.sizes.sm, color: colors.text.muted }}>{e.meta}</Text>
              ) : null}
              {e.description ? (
                <Text style={[styles.notesText, { marginLeft: 22, marginTop: 2 }]}>{e.description}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
      {report.unplaced.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unplaced</Text>
          <Text style={styles.notesText}>{report.unplaced.join(", ")}</Text>
        </View>
      )}
      {report.groups.length === 0 && report.unplaced.length === 0 && (
        <Text style={styles.notesText}>No places on file for this body.</Text>
      )}
      <PDFFooter />
    </Page>
  </Document>
);

export default SurfaceGazetteerTemplate;
