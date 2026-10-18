import type { ReactNode } from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter } from "../components";
import { buildDossierFullReport, type ReportRow } from "@/lib/dossier/full-report";

interface Props {
  formState: Record<string, unknown>;
  worldName?: string;
  date?: string;
}

/** A section that may break across pages (PDFSection is wrap={false}). */
const FlowSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle} minPresenceAhead={40}>
      {title}
    </Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

/** Label / value, with the value's provenance underneath when known. */
const SourcedRow = ({ row }: { row: ReportRow }) => (
  <View style={styles.keyValueRow} wrap={false}>
    <Text style={styles.keyValueLabel}>{row.label}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.keyValueValue}>{row.value}</Text>
      {row.source ? (
        <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2, textAlign: "right" }}>
          {row.source}
        </Text>
      ) : null}
    </View>
  </View>
);

const RowList = ({ rows }: { rows: ReportRow[] }) => (
  <>
    {rows.map((r, i) => (
      <SourcedRow key={`${r.label}-${i}`} row={r} />
    ))}
  </>
);

const Prose = ({ text }: { text: string }) => (
  <View style={[styles.notesBox, { marginBottom: spacing.sm }]}>
    <Text style={styles.notesText}>{text}</Text>
  </View>
);

/**
 * Dossier full report. Where the summary prints effective values, this prints
 * every value with where it came from (inherited tool, override, or the
 * writer's own entry), plus the overrides list, relationship and arc detail,
 * voice samples and general notes. Rows come from buildDossierFullReport.
 */
const DossierFullReportTemplate = ({ formState, worldName, date }: Props) => {
  const rep = buildDossierFullReport(formState);
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName={`Dossier: ${rep.name}`} worldName={worldName} date={date} hideLogo />
        {rep.identity.length > 0 && (
          <FlowSection title="Identity">
            <RowList rows={rep.identity} />
          </FlowSection>
        )}
        {rep.origins.length > 0 && (
          <FlowSection title="Origins & Sources">
            <RowList rows={rep.origins} />
          </FlowSection>
        )}
        {rep.body.length > 0 && (
          <FlowSection title="Body">
            <RowList rows={rep.body} />
          </FlowSection>
        )}
        {rep.traits.map((g) => (
          <FlowSection key={g.title} title={g.title}>
            <RowList rows={g.rows} />
          </FlowSection>
        ))}
        {rep.overrides.length > 0 && (
          <FlowSection title="Writer Overrides">
            <Text style={[styles.notesText, { marginBottom: spacing.xs }]}>
              Values set by hand in place of what the upstream tools would give.
            </Text>
            <RowList rows={rep.overrides} />
          </FlowSection>
        )}
        {rep.psychology.length > 0 && (
          <FlowSection title="Psychology">
            <RowList rows={rep.psychology} />
          </FlowSection>
        )}
        {(rep.voice.length > 0 || rep.sampleLines !== "") && (
          <FlowSection title="Voice">
            <RowList rows={rep.voice} />
            {rep.sampleLines ? <Prose text={rep.sampleLines} /> : null}
          </FlowSection>
        )}
        {rep.relationships.length > 0 && (
          <FlowSection title="Relationships">
            <RowList rows={rep.relationships} />
          </FlowSection>
        )}
        {rep.arc.length > 0 && (
          <FlowSection title="Arc">
            <RowList rows={rep.arc} />
          </FlowSection>
        )}
        {rep.generalNotes ? (
          <FlowSection title="Notes">
            <Prose text={rep.generalNotes} />
          </FlowSection>
        ) : null}
        <PDFFooter />
      </Page>
    </Document>
  );
};

export default DossierFullReportTemplate;
