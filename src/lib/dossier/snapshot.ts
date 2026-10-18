// ---------------------------------------------------------------------------
// Dossier snapshot, facts and text exports.
//
// `deriveBody` turns the writer's height/mass/age plus the resolved homeworld
// traits into the numbers a scene needs. `buildSnapshot` flattens everything
// into the `resolved` / `provenance` records saved with the worksheet, which
// is what worksheet-facts reads (provenance is stamped on by ./facts.ts).
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import {
  convertAge,
  fmt,
  parseGravityG,
  parseLeadingNumber,
  parseOrbitalPeriodDays,
  weightUnderGravity,
  type WeightUnderGravity,
} from "@/lib/dossier/derive";
import { snapshotTraits, type ResolvedTrait } from "@/lib/dossier/inheritance";
import { relationshipLabel } from "@/lib/dossier/relationships";
import type { DossierFormState } from "@/lib/dossier/types";

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export interface BodyDerivation {
  /** Native gravity in g, from the resolved Gravity Adaptation trait. */
  nativeG: number | null;
  weightAtHome: WeightUnderGravity | null;
  /** One local year in standard days, from the resolved Native Year trait. */
  localYearDays: number | null;
  ageStandard: number | null;
  ageLocal: number | null;
}

function traitValue(traits: ResolvedTrait[], key: string): string | null {
  return traits.find((t) => t.key === key)?.value ?? null;
}

/**
 * Derive from the *effective* trait values, so an override flows downstream:
 * a writer who overrides native gravity to 0.9 g sees the weight at home and
 * every felt-weight ratio move with it.
 */
export function deriveBody(state: DossierFormState, traits: ResolvedTrait[]): BodyDerivation {
  const nativeG = parseGravityG(traitValue(traits, "gravityAdaptation"));
  const localYearDays = parseOrbitalPeriodDays(traitValue(traits, "yearLength"));
  const typedAge = parseLeadingNumber(state.body.age);
  const ageValid = typedAge !== null && typedAge >= 0;

  let ageStandard: number | null = null;
  let ageLocal: number | null = null;
  if (ageValid) {
    if (state.body.ageUnit === "standard") {
      ageStandard = typedAge;
      ageLocal = convertAge(typedAge, "standard", localYearDays);
    } else {
      ageLocal = typedAge;
      ageStandard = convertAge(typedAge, "local", localYearDays);
    }
  }

  return {
    nativeG,
    weightAtHome: weightUnderGravity(state.body.massKg, nativeG),
    localYearDays,
    ageStandard,
    ageLocal,
  };
}

export function formatWeight(w: WeightUnderGravity): string {
  return `${fmt(w.earthScaleKg)} kg on an Earth scale (${fmt(w.newtons)} N)`;
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

/** The `resolved` / `provenance` records to save with the worksheet. */
export function buildSnapshot(
  state: DossierFormState,
  traits: ResolvedTrait[],
): { resolved: Record<string, string>; provenance: Record<string, string> } {
  const { resolved, provenance } = snapshotTraits(traits);
  const put = (key: string, value: string | null | undefined, source = "dossier") => {
    const v = typeof value === "string" ? value.trim() : "";
    if (!v) return;
    resolved[key] = v;
    provenance[key] = source;
  };

  const o = state.origins;
  put("homeworld", o.homeworld.name, o.homeworld.worksheetId ? "planetary-profile" : "dossier");
  put("species", o.species.name, o.species.worksheetId ? "evolutionary-biology" : "dossier");
  put("culture", o.culture.name, o.culture.worksheetId ? "xenomythology-framework-builder" : "dossier");
  put("polity", o.polity.name, o.polity.worksheetId ? "empire-designer" : "dossier");
  put("language", o.language.name, o.language.worksheetId ? "lexdrift" : "dossier");

  const body = deriveBody(state, traits);
  if (body.weightAtHome) put("weightAtHome", formatWeight(body.weightAtHome));
  if (body.ageStandard !== null) put("ageStandard", fmt(body.ageStandard));
  if (body.ageLocal !== null) put("ageLocal", fmt(body.ageLocal));

  put(
    "relationships",
    state.relationships
      .filter((r) => r.targetName.trim())
      .map((r) => `${relationshipLabel(r)}: ${r.targetName.trim()}`)
      .join("; "),
  );
  put(
    "arc",
    state.arc
      .filter((b) => b.eventLabel.trim() || b.note.trim())
      .map((b) => [b.eventLabel.trim(), b.note.trim()].filter(Boolean).join(" — "))
      .join("; "),
  );

  return { resolved, provenance };
}

// ---------------------------------------------------------------------------
// Text exports
// ---------------------------------------------------------------------------

/** One character as a dramatis-personae line. Null for an unnamed dossier. */
export function personaLine(data: unknown, fallbackTitle?: string | null): string | null {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const identity = (d.identity ?? {}) as Record<string, string>;
  const resolved = (d.resolved ?? {}) as Record<string, string>;
  const origins = (d.origins ?? {}) as Record<string, unknown>;
  const name = (identity.name ?? "").trim() || (fallbackTitle ?? "").trim();
  if (!name) return null;

  const aliases = (identity.aliases ?? "").trim();
  const role = (identity.role ?? "").trim();
  const house = typeof origins.house === "string" ? origins.house.trim() : "";
  const species = (resolved.species ?? "").trim();
  const homeworld = (resolved.homeworld ?? "").trim();

  const origin = [species, homeworld ? `of ${homeworld}` : "", house].filter(Boolean).join(" ");
  const head = `**${name}**${aliases ? ` (${aliases})` : ""}`;
  const tail = [role, origin].filter(Boolean).join(". ");
  return `- ${head}${tail ? ` — ${tail}.` : ""}`;
}

/** Markdown list of every named character, in the order given. */
export function buildDramatisPersonae(
  dossiers: Array<{ title: string | null; data: unknown }>,
  heading = "Dramatis Personae",
): string {
  const lines = dossiers
    .map((d) => personaLine(d.data, d.title))
    .filter((l): l is string => !!l);
  if (lines.length === 0) return "";
  return [`## ${heading}`, "", ...lines, ""].join("\n");
}

const STATUS_NOTE: Record<ResolvedTrait["status"], string> = {
  inherited: "",
  overridden: " *(override)*",
  manual: " *(writer)*",
  unrecorded: "",
  missing: "",
};

/** The whole dossier as markdown, for clipboard and the plain-text export. */
export function buildDossierMarkdown(state: DossierFormState, traits: ResolvedTrait[]): string {
  const name = state.identity.name.trim() || "Unnamed Character";
  const out: string[] = [`# ${name}`, ""];
  const row = (label: string, value: string | null | undefined) => {
    const v = (value ?? "").trim();
    if (v) out.push(`- **${label}:** ${v}`);
  };
  const section = (title: string) => out.push("", `## ${title}`, "");

  row("Also known as", state.identity.aliases);
  row("Role", state.identity.role);
  row("Pronouns", state.identity.pronouns);

  section("Origins");
  row("Homeworld", state.origins.homeworld.name);
  row("Species", state.origins.species.name);
  row("Culture", state.origins.culture.name);
  row("Polity", state.origins.polity.name);
  row("House", state.origins.house);
  row("Native language", state.origins.language.name);
  row("Born", state.origins.birth.label);

  const body = deriveBody(state, traits);
  section("Body");
  row("Height", state.body.heightCm ? `${state.body.heightCm} cm` : "");
  row("Mass", state.body.massKg ? `${state.body.massKg} kg` : "");
  if (body.weightAtHome) row("Weight at home", formatWeight(body.weightAtHome));
  if (body.ageStandard !== null) row("Age (standard years)", fmt(body.ageStandard));
  if (body.ageLocal !== null) row("Age (local years)", fmt(body.ageLocal));

  for (const [group, title] of [
    ["body", "Inherited Physiology"],
    ["senses", "Senses"],
    ["beliefs", "Beliefs"],
    ["origins", "Polity & Language"],
  ] as const) {
    const items = traits.filter((t) => t.group === group && t.value);
    if (items.length === 0) continue;
    section(title);
    for (const t of items) out.push(`- **${t.label}:** ${t.value}${STATUS_NOTE[t.status]}`);
  }

  const p = state.psychology;
  if (Object.values(p).some((v) => v.trim())) {
    section("Psychology");
    row("Wants", p.want);
    row("Needs", p.need);
    row("Motivation", p.motivation);
    row("Fear", p.fear);
    row("Wound", p.wound);
    row("Values", p.values);
    row("Temperament", p.temperament);
  }

  const v = state.voice;
  if (Object.values(v).some((x) => x.trim())) {
    section("Voice");
    row("Dialect", v.dialect);
    row("Idiolect", v.idiolect);
    if (v.sampleLines.trim()) {
      out.push("", ...v.sampleLines.trim().split("\n").map((l) => `> ${l}`));
    }
  }

  const rels = state.relationships.filter((r) => r.targetName.trim());
  if (rels.length) {
    section("Relationships");
    for (const r of rels) {
      out.push(`- **${relationshipLabel(r)}:** ${r.targetName}${r.note.trim() ? ` — ${r.note.trim()}` : ""}`);
    }
  }

  const beats = state.arc.filter((b) => b.eventLabel.trim() || b.note.trim());
  if (beats.length) {
    section("Arc");
    beats.forEach((b, i) => {
      out.push(`${i + 1}. ${[b.eventLabel.trim(), b.note.trim()].filter(Boolean).join(" — ")}`);
    });
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
