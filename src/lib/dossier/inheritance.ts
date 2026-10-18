// ---------------------------------------------------------------------------
// Dossier inheritance — every trait a character gets from the world.
//
// "Fill in 'born on Kellis, Verrid, House Adran' and the dossier pre-populates
// lifespan, sensory range, gravity adaptation, native phonology, and funeral
// customs." (05-NEW-SYSTEMS.md §A1). This module is that sentence as code.
//
// A TraitSpec names one inherited trait: which origin slot it reads from,
// which tool owns the value, and how to read it out of that tool's saved
// worksheet. Resolution then layers the writer's override on top and reports
// the status honestly:
//
//   inherited   value comes from the upstream worksheet, untouched
//   overridden  the writer departed from an upstream value on purpose
//   manual      the writer supplied a value with nothing upstream to depart from
//   unrecorded  the upstream worksheet exists but this field in it is empty
//   missing     no upstream worksheet is linked at all ("NOT ON FILE")
//
// Nothing here invents a value. A trait with no source and no override
// resolves to null, and the page says so.
//
// Pure: no React, no network. Reads upstream catalogues (lifespan categories,
// sensory modalities, languages) only to turn stored ids into words.
// ---------------------------------------------------------------------------

import { htmlToPlainText } from "@/lib/html-utils";
import { LIFESPAN_CATEGORIES } from "@/lib/evolutionary-biology-data";
import { getModalityById } from "@/lib/sensorium/data";
import { STARTING_LANGUAGES, LINGUA_FRANCA_SPECIAL } from "@/lib/lexdrift/data";
import { calculateLexDrift, type FormStateForCalc } from "@/lib/lexdrift/calculations";
import { fmt, gravityFromMassRadius, parseGravityG, parseOrbitalPeriodDays } from "@/lib/dossier/derive";
import type { OriginSlot } from "@/lib/dossier/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TraitGroup = "origins" | "body" | "senses" | "beliefs";

export type TraitStatus = "inherited" | "overridden" | "manual" | "unrecorded" | "missing";

/** An upstream worksheet as the dossier sees it. */
export interface UpstreamSheet {
  id: string;
  title: string | null;
  toolType: string;
  data: Record<string, unknown>;
}

export interface TraitSpec {
  key: string;
  label: string;
  group: TraitGroup;
  /** Origin slot whose worksheet this trait reads. */
  slot: OriginSlot;
  /** Tool slug that owns the value (for the provenance chip). */
  tool: string;
  /** Where in the tool to fill it, phrased for "NOT RECORDED IN <tool>: …". */
  hint: string;
  read: (data: Record<string, unknown>) => string | null;
}

export interface ResolvedTrait {
  key: string;
  label: string;
  group: TraitGroup;
  slot: OriginSlot;
  tool: string;
  hint: string;
  /** The effective value: override if present, else inherited, else null. */
  value: string | null;
  /** What the upstream worksheet says, regardless of override. */
  inheritedValue: string | null;
  status: TraitStatus;
  source: { worksheetId: string; title: string | null } | null;
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

function at(data: Record<string, unknown>, path: string): unknown {
  let cur: unknown = data;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** A trimmed, HTML-free string, or null for anything blank. */
export function text(raw: unknown): string | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? String(raw) : null;
  if (typeof raw !== "string") return null;
  const t = htmlToPlainText(raw).trim();
  return t ? t : null;
}

function list(raw: unknown): string | null {
  if (!Array.isArray(raw)) return text(raw);
  const parts = raw.map((v) => text(v)).filter((v): v is string => !!v);
  return parts.length ? parts.join(", ") : null;
}

const path = (p: string) => (d: Record<string, unknown>) => text(at(d, p));

function lifespan(d: Record<string, unknown>): string | null {
  const id = text(at(d, "reproduction.lifespan"));
  if (!id) return null;
  const cat = LIFESPAN_CATEGORIES.find((c) => c.id === id);
  return cat ? `${cat.name} (${cat.description.toLowerCase()})` : id;
}

function sizeRange(d: Record<string, unknown>): string | null {
  const min = text(at(d, "bodyPlan.sizeRange.min"));
  const max = text(at(d, "bodyPlan.sizeRange.max"));
  if (min && max) return `${min} to ${max}`;
  return min ?? max ?? null;
}

/** Sensorium's accepted senses, by name, with their range where known. */
function senses(d: Record<string, unknown>): string | null {
  const ids = at(d, "finalSelection");
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const parts = ids
    .filter((id): id is string => typeof id === "string")
    .map((id) => {
      const m = getModalityById(id);
      if (!m) return id;
      return m.spectrumRange ? `${m.name} (${m.spectrumRange})` : m.name;
    });
  return parts.length ? parts.join(", ") : null;
}

/** Native gravity: Genesis' recorded value, else derived from its mass and radius. */
export function homeworldGravity(d: Record<string, unknown>): number | null {
  return (
    parseGravityG(at(d, "physicalCharacteristics.surfaceGravity")) ??
    gravityFromMassRadius(
      at(d, "physicalCharacteristics.planetaryMass"),
      at(d, "physicalCharacteristics.planetaryRadius"),
    )
  );
}

function gravity(d: Record<string, unknown>): string | null {
  const g = homeworldGravity(d);
  return g === null ? null : `${fmt(g)} g`;
}

/** The homeworld's year in standard days, from Genesis' orbital period. */
export function homeworldYearDays(d: Record<string, unknown>): number | null {
  return parseOrbitalPeriodDays(at(d, "stellarEnvironment.orbitalPeriod"));
}

function deities(d: Record<string, unknown>): string | null {
  const raw = at(d, "divineConceptualization.deities");
  if (!Array.isArray(raw)) return null;
  const names = raw
    .map((e) => (e && typeof e === "object" ? text((e as Record<string, unknown>).archetypeName) : null))
    .filter((v): v is string => !!v);
  return names.length ? names.join(", ") : null;
}

function languageRoot(d: Record<string, unknown>): string | null {
  const id = text(at(d, "linguistic.linguaFranca"));
  const custom = text(at(d, "linguistic.customLanguage"));
  if (!id) return custom;
  return (
    STARTING_LANGUAGES.find((l) => l.id === id)?.label ??
    LINGUA_FRANCA_SPECIAL.find((l) => l.id === id)?.label ??
    id
  );
}

function lexResult(d: Record<string, unknown>) {
  try {
    const r = calculateLexDrift(d as unknown as FormStateForCalc);
    return r.valid ? r : null;
  } catch {
    return null;
  }
}

function phonology(d: Record<string, unknown>): string | null {
  return text(lexResult(d)?.soundChanges);
}

function drift(d: Record<string, unknown>): string | null {
  const r = lexResult(d);
  if (!r) return null;
  return `${r.severityLabel} · ${Math.round(r.intelligibilityPercent)}% intelligible to the root`;
}

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

export const TRAIT_SPECS: TraitSpec[] = [
  // ── Body (Phylo, Genesis) ──
  { key: "lifespan", label: "Lifespan", group: "body", slot: "species", tool: "evolutionary-biology",
    hint: "Reproduction & Life Cycle → Lifespan", read: lifespan },
  { key: "speciesSize", label: "Species Size Range", group: "body", slot: "species", tool: "evolutionary-biology",
    hint: "Body Plan → Size Range", read: sizeRange },
  { key: "biochemistry", label: "Biochemistry", group: "body", slot: "species", tool: "evolutionary-biology",
    hint: "Biochemistry → Biochemical Basis", read: path("biochemistry.biochemicalBasis") },
  { key: "cognition", label: "Cognition", group: "body", slot: "species", tool: "evolutionary-biology",
    hint: "Intelligence & Cognition → Cognition Type", read: path("cognition.cognitionType") },
  { key: "gravityAdaptation", label: "Gravity Adaptation (native g)", group: "body", slot: "homeworld",
    tool: "planetary-profile", hint: "Physical Characteristics → Surface Gravity, or Mass and Radius", read: gravity },
  { key: "dayLength", label: "Native Day", group: "body", slot: "homeworld", tool: "planetary-profile",
    hint: "Physical Characteristics → Day Length", read: path("physicalCharacteristics.dayLength") },
  { key: "yearLength", label: "Native Year", group: "body", slot: "homeworld", tool: "planetary-profile",
    hint: "Stellar Environment → Orbital Period", read: path("stellarEnvironment.orbitalPeriod") },

  // ── Senses (Sensorium) ──
  { key: "senses", label: "Sensory Range", group: "senses", slot: "sensorium", tool: "sensorium",
    hint: "Final sense selection", read: senses },
  { key: "dominantSense", label: "Dominant Sense", group: "senses", slot: "sensorium", tool: "sensorium",
    hint: "Perception Profile → Dominant Sense", read: path("perceptionProfile.dominantSense") },
  { key: "perceives", label: "Perceives", group: "senses", slot: "sensorium", tool: "sensorium",
    hint: "Perception Gap → What the species perceives", read: path("perceptionGapNotes.speciesPerceives") },
  { key: "blindTo", label: "Blind To", group: "senses", slot: "sensorium", tool: "sensorium",
    hint: "Perception Gap → What the species cannot perceive", read: path("perceptionGapNotes.speciesBlind") },

  // ── Beliefs (Mythos) ──
  { key: "cosmology", label: "Cosmology", group: "beliefs", slot: "culture", tool: "xenomythology-framework-builder",
    hint: "Cosmological Structure → Primary Division", read: path("cosmologicalStructure.primaryDivision") },
  { key: "deities", label: "Gods Sworn By", group: "beliefs", slot: "culture", tool: "xenomythology-framework-builder",
    hint: "Divine Conceptualization → Deities", read: deities },
  { key: "funeralCustoms", label: "Funeral Customs", group: "beliefs", slot: "culture", tool: "xenomythology-framework-builder",
    hint: "Death Practices → Death Rituals", read: path("deathPractices.deathRituals") },
  { key: "afterlife", label: "What Happens At Death", group: "beliefs", slot: "culture", tool: "xenomythology-framework-builder",
    hint: "Death Practices → Consciousness at Death", read: path("deathPractices.consciousnessAtDeath") },
  { key: "taboos", label: "Taboos", group: "beliefs", slot: "culture", tool: "xenomythology-framework-builder",
    hint: "Synthesis → Ethical Taboos", read: path("synthesis.ethicalTaboos") },
  { key: "virtues", label: "Virtues", group: "beliefs", slot: "culture", tool: "xenomythology-framework-builder",
    hint: "Synthesis → Ethical Virtues", read: path("synthesis.ethicalVirtues") },

  // ── Origins (Dominion, Lexdrift) ──
  { key: "government", label: "Raised Under", group: "origins", slot: "polity", tool: "empire-designer",
    hint: "Foundation → Government Type", read: path("foundation.governmentType") },
  { key: "polityValues", label: "Polity Core Values", group: "origins", slot: "polity", tool: "empire-designer",
    hint: "Culture → Core Values", read: (d) => list(at(d, "culture.coreValues")) },
  { key: "languageRoot", label: "Language Descends From", group: "origins", slot: "language", tool: "lexdrift",
    hint: "Linguistic → Lingua Franca", read: languageRoot },
  { key: "phonology", label: "Native Phonology", group: "origins", slot: "language", tool: "lexdrift",
    hint: "Mission, Linguistic and Social inputs (drift result)", read: phonology },
  { key: "languageDrift", label: "Language Drift", group: "origins", slot: "language", tool: "lexdrift",
    hint: "Mission, Linguistic and Social inputs (drift result)", read: drift },
];

export const TRAIT_BY_KEY: Record<string, TraitSpec> = Object.fromEntries(
  TRAIT_SPECS.map((s) => [s.key, s]),
);

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/** One trait, given the worksheet in its slot (or null) and any override. */
export function resolveTrait(
  spec: TraitSpec,
  sheet: UpstreamSheet | null,
  override: string | undefined,
): ResolvedTrait {
  let inheritedValue: string | null = null;
  if (sheet) {
    try {
      inheritedValue = spec.read(sheet.data ?? {});
    } catch {
      inheritedValue = null;
    }
  }
  const ov = typeof override === "string" && override.trim() ? override.trim() : null;

  let status: TraitStatus;
  if (ov !== null) status = inheritedValue !== null ? "overridden" : "manual";
  else if (!sheet) status = "missing";
  else if (inheritedValue === null) status = "unrecorded";
  else status = "inherited";

  return {
    key: spec.key,
    label: spec.label,
    group: spec.group,
    slot: spec.slot,
    tool: spec.tool,
    hint: spec.hint,
    value: ov ?? inheritedValue,
    inheritedValue,
    status,
    source: sheet ? { worksheetId: sheet.id, title: sheet.title } : null,
  };
}

/** Every trait in `specs`, reading each from the worksheet in its slot. */
export function resolveTraits(
  sheets: Partial<Record<OriginSlot, UpstreamSheet | null>>,
  overrides: Record<string, string>,
  specs: TraitSpec[] = TRAIT_SPECS,
): ResolvedTrait[] {
  return specs.map((s) => resolveTrait(s, sheets[s.slot] ?? null, overrides[s.key]));
}

/**
 * Set or clear one override. An empty or whitespace value clears it, which
 * returns the trait to inheriting. Returns a new record; never mutates.
 */
export function setOverride(
  overrides: Record<string, string>,
  key: string,
  value: string | null,
): Record<string, string> {
  const next = { ...overrides };
  if (value === null || !value.trim()) delete next[key];
  else next[key] = value;
  return next;
}

/**
 * Flatten resolved traits for the save-time snapshot. Traits with no value are
 * left out entirely, so a fact extractor never sees a blank.
 */
export function snapshotTraits(traits: ResolvedTrait[]): {
  resolved: Record<string, string>;
  provenance: Record<string, string>;
} {
  const resolved: Record<string, string> = {};
  const provenance: Record<string, string> = {};
  for (const t of traits) {
    if (t.value === null) continue;
    resolved[t.key] = t.value;
    provenance[t.key] = t.status === "inherited" ? t.tool : "override";
  }
  return { resolved, provenance };
}

// ---------------------------------------------------------------------------
// Auto-linking: which Sensorium and Mythos records belong to a species
// ---------------------------------------------------------------------------

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

/**
 * The Sensorium worksheet for a Phylo species: first an explicit link
 * (`_linkedWorksheets.evoBio.worksheetId`), then a species-name match. Never
 * a guess beyond that; null means the writer picks.
 */
export function matchSensoriumForSpecies(
  sensoria: UpstreamSheet[],
  species: UpstreamSheet | null,
): UpstreamSheet | null {
  if (!species) return null;
  const linked = sensoria.find(
    (s) => norm(at(s.data, "_linkedWorksheets.evoBio.worksheetId")) === norm(species.id),
  );
  if (linked) return linked;
  const name = norm(species.data.speciesName) || norm(species.title);
  if (!name) return null;
  return sensoria.find((s) => norm(s.data.speciesName) === name || norm(s.title) === name) ?? null;
}

/** The Mythos worksheet for a Phylo species, by its explicit species link only. */
export function matchMythosForSpecies(
  myths: UpstreamSheet[],
  species: UpstreamSheet | null,
): UpstreamSheet | null {
  if (!species) return null;
  return (
    myths.find((m) => norm(at(m.data, "_linkedWorksheets.species.worksheetId")) === norm(species.id)) ??
    null
  );
}
