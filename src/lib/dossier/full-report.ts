// ---------------------------------------------------------------------------
// Dossier full report: everything the summary PDF leaves out.
//
// The summary prints effective values only. The full report adds where each
// value came from (the upstream tool, an override, or the writer's own entry),
// which worksheets the origin slots link to, relationship verbs and targets,
// arc beats with their timeline anchors, voice samples and general notes.
//
// Pure: normalises the raw worksheet and returns rows. The PDF template only
// lays them out, so this is what the tests pin down.
// ---------------------------------------------------------------------------

import { normalizeDossier, type DossierSourceRef } from "@/lib/dossier/types";
import { relationshipLabel } from "@/lib/dossier/relationships";
import { getToolDisplayName } from "@/lib/tools-config";
import { deepStripHtml } from "@/lib/html-utils";

export interface ReportRow {
  label: string;
  value: string;
  /** Where the value came from, in words. Empty when not applicable. */
  source?: string;
}

export interface DossierFullReport {
  name: string;
  identity: ReportRow[];
  origins: ReportRow[];
  body: ReportRow[];
  traits: { title: string; rows: ReportRow[] }[];
  psychology: ReportRow[];
  voice: ReportRow[];
  sampleLines: string;
  relationships: ReportRow[];
  arc: ReportRow[];
  overrides: ReportRow[];
  generalNotes: string;
}

export const TRAIT_GROUPS: { title: string; traits: [string, string][] }[] = [
  {
    title: "Body & Biology",
    traits: [
      ["Weight at home", "weightAtHome"],
      ["Age (standard years)", "ageStandard"],
      ["Age (local years)", "ageLocal"],
      ["Gravity adaptation", "gravityAdaptation"],
      ["Lifespan", "lifespan"],
      ["Species size range", "speciesSize"],
      ["Biochemistry", "biochemistry"],
      ["Cognition", "cognition"],
      ["Native day", "dayLength"],
      ["Native year", "yearLength"],
    ],
  },
  {
    title: "Senses",
    traits: [
      ["Sensory range", "senses"],
      ["Dominant sense", "dominantSense"],
      ["Perceives", "perceives"],
      ["Blind to", "blindTo"],
    ],
  },
  {
    title: "Beliefs, Polity & Language",
    traits: [
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
    ],
  },
];

/** A provenance tag ("override", "dossier", a tool id) in words. */
export function sourceLabel(provenance: string | undefined): string {
  if (!provenance) return "";
  if (provenance === "override") return "Writer override";
  if (provenance === "dossier") return "Dossier";
  if (provenance === "derived") return "Derived";
  const name = getToolDisplayName(provenance);
  return `Inherited from ${name.includes(":") ? name.split(":")[0].trim() : name}`;
}

function rows(pairs: [string, string | undefined, string?][]): ReportRow[] {
  return pairs
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([label, v, source]) => ({ label, value: (v as string).trim(), ...(source ? { source } : {}) }));
}

function originSource(ref: DossierSourceRef, linkedTool: string, provenance?: string): string {
  if (provenance) return sourceLabel(provenance);
  if (!ref.name.trim()) return "";
  return ref.worksheetId ? sourceLabel(linkedTool) : "Dossier";
}

export function buildDossierFullReport(raw: unknown): DossierFullReport {
  // Notes and psychology fields are rich text; the report prints plain text.
  const d = normalizeDossier(deepStripHtml(raw));
  const r = d.resolved;
  const p = d.provenance;
  const o = d.origins;

  const traits = TRAIT_GROUPS.map((g) => ({
    title: g.title,
    rows: rows(g.traits.map(([label, key]) => [label, r[key], sourceLabel(p[key])])),
  })).filter((g) => g.rows.length > 0);

  // Overrides the writer set, with the value they replaced when the snapshot
  // still knows it. Keys are shown by their trait label where there is one.
  const traitLabel = new Map(TRAIT_GROUPS.flatMap((g) => g.traits.map(([l, k]) => [k, l] as const)));
  const overrides = Object.entries(d.overrides)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => ({ label: traitLabel.get(k) ?? k, value: v.trim() }));

  return {
    name: d.identity.name.trim() || "Unnamed Character",
    identity: rows([
      ["Name", d.identity.name],
      ["Also known as", d.identity.aliases],
      ["Role", d.identity.role],
      ["Pronouns", d.identity.pronouns],
    ]),
    origins: rows([
      ["Homeworld", r.homeworld || o.homeworld.name, originSource(o.homeworld, "planetary-profile", p.homeworld)],
      ["Species", r.species || o.species.name, originSource(o.species, "evolutionary-biology", p.species)],
      ["Sensory profile", o.sensorium.name, originSource(o.sensorium, "sensorium")],
      ["Culture", r.culture || o.culture.name, originSource(o.culture, "xenomythology-framework-builder", p.culture)],
      ["Polity", r.polity || o.polity.name, originSource(o.polity, "empire-designer", p.polity)],
      ["House", o.house],
      ["Native language", r.language || o.language.name, originSource(o.language, "lexdrift", p.language)],
      ["Born", o.birth.label, o.birth.eventId ? "Anchored to a timeline event" : undefined],
    ]),
    body: rows([
      ["Height", d.body.heightCm ? `${d.body.heightCm} cm` : ""],
      ["Mass", d.body.massKg ? `${d.body.massKg} kg` : ""],
      ["Age as entered", d.body.age ? `${d.body.age} (${d.body.ageUnit} years)` : ""],
    ]),
    traits,
    psychology: rows([
      ["Wants", d.psychology.want],
      ["Needs", d.psychology.need],
      ["Motivation", d.psychology.motivation],
      ["Fear", d.psychology.fear],
      ["Wound", d.psychology.wound],
      ["Values", d.psychology.values],
      ["Temperament", d.psychology.temperament],
    ]),
    voice: rows([
      ["Dialect", d.voice.dialect],
      ["Idiolect", d.voice.idiolect],
    ]),
    sampleLines: d.voice.sampleLines.trim(),
    relationships: d.relationships
      .filter((x) => x.targetName.trim())
      .map((x) => ({
        label: relationshipLabel(x),
        value: x.note.trim() ? `${x.targetName.trim()}: ${x.note.trim()}` : x.targetName.trim(),
        source: x.targetKind === "entry" ? "Codex entry" : "Dossier",
      })),
    arc: d.arc
      .filter((b) => b.eventLabel.trim() || b.note.trim())
      .map((b, i) => ({
        label: `Beat ${i + 1}`,
        value: [b.eventLabel.trim(), b.note.trim()].filter(Boolean).join(": "),
        ...(b.eventId ? { source: "Timeline event" } : {}),
      })),
    overrides,
    generalNotes: d.generalNotes.trim(),
  };
}
