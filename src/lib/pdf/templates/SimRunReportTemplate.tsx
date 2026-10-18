import type { ReactNode } from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { PDFHeader, PDFFooter, PDFKeyValuePair } from "../components";
import type { SimRunReport, SimRunRow } from "@/lib/simulators/run-report";

interface Props {
  report: SimRunReport;
  worldName?: string;
  date?: string;
}

/**
 * A section that may break across pages. PDFSection is wrap={false}, which
 * suits a short summary block but not a 40-row output table.
 */
const FlowSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle} minPresenceAhead={40}>
      {title}
    </Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const Rows = ({ rows, empty }: { rows: SimRunRow[]; empty: string }) =>
  rows.length ? (
    <>
      {rows.map((r, i) => (
        <PDFKeyValuePair key={`${r.label}-${i}`} label={r.label} value={r.value} />
      ))}
    </>
  ) : (
    <Text style={styles.notesText}>{empty}</Text>
  );

/**
 * One simulation run: inputs, key outputs, and the facts Publish promotes to
 * canon. Reads the same SimRunReport the Markdown export renders, so the two
 * formats always agree.
 */
const SimRunReportTemplate = ({ report, worldName, date }: Props) => {
  const title = report.runName
    ? `${report.simulatorName} Run: ${report.runName}`
    : `${report.simulatorName} Run`;
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName={title} worldName={worldName ?? report.worldName} date={date} hideLogo />
        <FlowSection title="Inputs">
          <Rows rows={report.inputs} empty="No inputs recorded." />
        </FlowSection>
        <FlowSection title="Key Outputs">
          <Rows rows={report.outputs} empty="No outputs recorded." />
        </FlowSection>
        <FlowSection title="Facts for Canon">
          {report.facts.length > 0 ? (
            <>
              <Text style={styles.notesText}>Values Publish promotes to the world's canon.</Text>
              {report.facts.map((f) => (
                <PDFKeyValuePair key={f.key} label={f.label} value={f.value} />
              ))}
            </>
          ) : (
            <Text style={styles.notesText}>This run yields no publishable facts yet.</Text>
          )}
        </FlowSection>
        {report.notes.length > 0 && (
          <FlowSection title="Narrative Notes">
            {report.notes.map((n) => (
              <View key={n.label} style={styles.notesBox}>
                <Text style={styles.notesLabel}>{n.label}</Text>
                <Text style={styles.notesText}>{n.value}</Text>
              </View>
            ))}
          </FlowSection>
        )}
        <PDFFooter />
      </Page>
    </Document>
  );
};

export default SimRunReportTemplate;
