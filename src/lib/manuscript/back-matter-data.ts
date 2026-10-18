// ---------------------------------------------------------------------------
// back-matter-data, the world's Codex entries and canon facts in the shape
// the compile back matter reads (lib/manuscript/back-matter.ts).
//
// Facts come from the canon facade (useCanonFacts → canon.facts); the layer
// of each is its predicate's cascade layer in the vocabulary. Pure.
// ---------------------------------------------------------------------------

import { predicateDef } from "@/canon/vocabulary";
import type { CanonFact } from "@/canon/types";
import { ENTITY_TYPE_LABELS, type Entity } from "@/services/entity-graph-types";
import type { BackMatterData, BackMatterEntity, BackMatterFact, BackMatterLayer } from "./back-matter";

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Aliases from a dossier field: an array, or a comma/semicolon list. */
function aliasesOf(meta: Record<string, unknown> | null | undefined): string[] {
  const raw = meta?.characterAliases ?? meta?.aliases;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim());
  const s = str(raw);
  return s ? s.split(/[;,]/).map((x) => x.trim()).filter(Boolean) : [];
}

export function toBackMatterEntity(e: Entity): BackMatterEntity {
  const meta = e.metadata && typeof e.metadata === "object" ? e.metadata : {};
  return {
    id: e.id,
    name: e.name,
    type: e.entity_type,
    typeLabel: e.entity_type === "custom" ? e.custom_type_label || "Entry" : ENTITY_TYPE_LABELS[e.entity_type] ?? "Entry",
    summary: str(e.summary) ?? str(e.description),
    role: str(meta.characterRole) ?? str(meta.role),
    aliases: aliasesOf(meta),
  };
}

const LAYERS = new Set<BackMatterLayer>(["physics", "environment", "biology", "psychology", "mythology", "culture", "integration"]);

export function toBackMatterFact(f: CanonFact, nameOf: (id: string) => string | null): BackMatterFact {
  const layer = predicateDef(f.predicate)?.layer;
  return {
    subjectId: f.subjectId,
    subjectName: f.subjectId ? nameOf(f.subjectId) : null,
    label: f.label,
    valueText: f.valueText,
    confidence: f.confidence,
    layer: layer && LAYERS.has(layer) ? layer : "other",
  };
}

export function backMatterData(entities: Entity[], facts: CanonFact[]): BackMatterData {
  const names = new Map(entities.map((e) => [e.id, e.name]));
  return {
    entities: entities.filter((e) => e.name.trim()).map(toBackMatterEntity),
    facts: facts.map((f) => toBackMatterFact(f, (id) => names.get(id) ?? null)),
  };
}
