// ---------------------------------------------------------------------------
// Dossier → master fields. The map from a saved dossier to the facts the rest
// of the product reads.
//
// These are spread into ENTITY_MASTER_FIELDS.character, which does two jobs
// at once: worksheet-facts reads the paths to put a character's values in the
// Studio Refs and Check tabs, and entity-sync reads them to keep the
// character's Codex infobox in step with the dossier.
//
// Keys are character-prefixed on purpose. The continuity engine pools facts
// by key, and a character's inherited "Dominant Sense" must never be read as
// a second, competing value of the species' own `dominantSense`.
// ---------------------------------------------------------------------------

import type { MasterFieldDef } from "@/lib/entity-config";

const T = "dossier";

function f(label: string, key: string, path: string, type: MasterFieldDef["type"] = "text"): MasterFieldDef {
  return { label, key, type, worksheetPaths: { [T]: path } };
}

export const DOSSIER_MASTER_FIELDS: MasterFieldDef[] = [
  // Identity
  f("Character Name", "characterName", "identity.name"),
  f("Also Known As", "characterAliases", "identity.aliases"),
  f("Role In Story", "characterRole", "identity.role"),
  f("Pronouns", "characterPronouns", "identity.pronouns"),
  // Origins
  f("Homeworld", "characterHomeworld", "resolved.homeworld"),
  f("Species", "characterSpecies", "resolved.species"),
  f("Polity", "characterPolity", "resolved.polity"),
  f("House", "characterHouse", "origins.house"),
  f("Culture", "characterCulture", "resolved.culture"),
  f("Native Language", "characterLanguage", "resolved.language"),
  f("Born", "characterBorn", "origins.birth.label"),
  f("Raised Under", "characterGovernment", "resolved.government"),
  f("Native Phonology", "characterPhonology", "resolved.phonology"),
  // Body
  f("Height (cm)", "characterHeightCm", "body.heightCm", "number"),
  f("Mass (kg)", "characterMassKg", "body.massKg", "number"),
  f("Weight At Home", "characterWeightAtHome", "resolved.weightAtHome"),
  f("Gravity Adaptation (native g)", "characterNativeGravity", "resolved.gravityAdaptation"),
  f("Age (standard years)", "characterAgeStandard", "resolved.ageStandard"),
  f("Age (local years)", "characterAgeLocal", "resolved.ageLocal"),
  f("Lifespan", "characterLifespan", "resolved.lifespan"),
  // Senses
  f("Sensory Range", "characterSenses", "resolved.senses"),
  f("Dominant Sense (character)", "characterDominantSense", "resolved.dominantSense"),
  f("Blind To", "characterBlindTo", "resolved.blindTo"),
  // Beliefs
  f("Gods Sworn By", "characterDeities", "resolved.deities"),
  f("Funeral Customs", "characterFuneralCustoms", "resolved.funeralCustoms"),
  f("Taboos", "characterTaboos", "resolved.taboos"),
  // Psychology
  f("Wants", "characterWant", "psychology.want"),
  f("Needs", "characterNeed", "psychology.need"),
  f("Motivation", "characterMotivation", "psychology.motivation"),
  f("Fear", "characterFear", "psychology.fear"),
  f("Wound", "characterWound", "psychology.wound"),
  f("Values", "characterValues", "psychology.values"),
  f("Temperament", "characterTemperament", "psychology.temperament"),
  // Voice
  f("Dialect", "characterDialect", "voice.dialect"),
  f("Idiolect", "characterIdiolect", "voice.idiolect"),
  // Web
  f("Relationships", "characterRelationships", "resolved.relationships"),
  f("Arc", "characterArc", "resolved.arc"),
];

/** Master-field key → the `resolved.*` key it reads, for provenance lookup. */
export const DOSSIER_RESOLVED_KEY: Record<string, string> = Object.fromEntries(
  DOSSIER_MASTER_FIELDS.flatMap((field) => {
    const p = field.worksheetPaths?.[T] ?? "";
    return p.startsWith("resolved.") ? [[field.key, p.slice("resolved.".length)]] : [];
  }),
);
