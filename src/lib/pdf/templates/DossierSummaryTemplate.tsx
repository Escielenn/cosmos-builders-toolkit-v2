import { Document, Page, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import { normalizeDossier } from "@/lib/dossier/types";
import { relationshipLabel } from "@/lib/dossier/relationships";

interface Props {
  formState: Record<string, unknown>;
  worldName?: string;
  date?: string;
}

/**
 * Dossier PDF. Reads the save-time snapshot (`resolved`), which the page
 * refreshes before export, so the PDF prints the same effective values the
 * writer sees, overrides included, without re-reading five upstream tools.
 */
const DossierSummaryTemplate = ({ formState: raw, worldName, date }: Props) => {
  const d = normalizeDossier(deepStripHtml(raw));
  const r = d.resolved;
  const isOverride = (key: string) => d.provenance[key] === "override";

  const rows = (pairs: Array<[string, string | undefined]>) =>
    pairs
      .filter(([, v]) => v && v.trim())
      .map(([label, v]) => <PDFKeyValuePair key={label} label={label} value={v as string} />);

  const traitRows = (pairs: Array<[string, string]>) =>
    rows(pairs.map(([label, key]) => [isOverride(key) ? `${label} (override)` : label, r[key]]));

  const identity = rows([
    ["Also known as", d.identity.aliases],
    ["Role", d.identity.role],
    ["Pronouns", d.identity.pronouns],
  ]);
  const origins = rows([
    ["Homeworld", r.homeworld],
    ["Species", r.species],
    ["Culture", r.culture],
    ["Polity", r.polity],
    ["House", d.origins.house],
    ["Native language", r.language],
    ["Born", d.origins.birth.label],
  ]);
  const body = [
    ...rows([
      ["Height", d.body.heightCm ? `${d.body.heightCm} cm` : ""],
      ["Mass", d.body.massKg ? `${d.body.massKg} kg` : ""],
      ["Weight at home", r.weightAtHome],
      ["Age (standard years)", r.ageStandard],
      ["Age (local years)", r.ageLocal],
    ]),
    ...traitRows([
      ["Gravity adaptation", "gravityAdaptation"],
      ["Lifespan", "lifespan"],
      ["Species size range", "speciesSize"],
      ["Biochemistry", "biochemistry"],
      ["Cognition", "cognition"],
      ["Native day", "dayLength"],
      ["Native year", "yearLength"],
    ]),
  ];
  const senses = traitRows([
    ["Sensory range", "senses"],
    ["Dominant sense", "dominantSense"],
    ["Perceives", "perceives"],
    ["Blind to", "blindTo"],
  ]);
  const beliefs = traitRows([
    ["Cosmology", "cosmology"],
    ["Gods sworn by", "deities"],
    ["Funeral customs", "funeralCustoms"],
    ["What happens at death", "afterlife"],
    ["Taboos", "taboos"],
    ["Virtues", "virtues"],
    ["Raised under", "government"],
    ["Polity core values", "polityValues"],
    ["Language descends from", "languageRoot"],
    ["Native phonology", "phonology"],
    ["Language drift", "languageDrift"],
  ]);
  const psychology = rows([
    ["Wants", d.psychology.want],
    ["Needs", d.psychology.need],
    ["Motivation", d.psychology.motivation],
    ["Fear", d.psychology.fear],
    ["Wound", d.psychology.wound],
    ["Values", d.psychology.values],
    ["Temperament", d.psychology.temperament],
  ]);
  const voice = rows([
    ["Dialect", d.voice.dialect],
    ["Idiolect", d.voice.idiolect],
  ]);
  const relationships = d.relationships
    .filter((x) => x.targetName.trim())
    .map((x) => (
      <PDFKeyValuePair
        key={x.id}
        label={relationshipLabel(x)}
        value={x.note.trim() ? `${x.targetName} (${x.note.trim()})` : x.targetName}
      />
    ));
  const arc = d.arc
    .filter((b) => b.eventLabel.trim() || b.note.trim())
    .map((b, i) => (
      <PDFKeyValuePair key={b.id} label={`Beat ${i + 1}`} value={[b.eventLabel, b.note].filter((s) => s.trim()).join(": ")} />
    ));

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName={`Dossier: ${d.identity.name || "Unnamed Character"}`} worldName={worldName} date={date} hideLogo />
        {identity.length > 0 && <PDFSection title="Identity">{identity}</PDFSection>}
        {origins.length > 0 && <PDFSection title="Origins">{origins}</PDFSection>}
        {body.length > 0 && <PDFSection title="Body">{body}</PDFSection>}
        {senses.length > 0 && <PDFSection title="Senses">{senses}</PDFSection>}
        {beliefs.length > 0 && <PDFSection title="Beliefs, Polity & Language">{beliefs}</PDFSection>}
        {psychology.length > 0 && <PDFSection title="Psychology">{psychology}</PDFSection>}
        {(voice.length > 0 || d.voice.sampleLines.trim()) && (
          <PDFSection title="Voice">
            {voice}
            {d.voice.sampleLines.trim() ? <Text style={styles.notesText}>{d.voice.sampleLines.trim()}</Text> : null}
          </PDFSection>
        )}
        {relationships.length > 0 && <PDFSection title="Relationships">{relationships}</PDFSection>}
        {arc.length > 0 && <PDFSection title="Arc">{arc}</PDFSection>}
        <PDFFooter />
      </Page>
    </Document>
  );
};

export default DossierSummaryTemplate;
