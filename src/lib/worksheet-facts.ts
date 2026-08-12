// ---------------------------------------------------------------------------
// worksheet-facts, pull the labelled facts a tool recorded out of its blob.
//
// A filled-in worksheet persists as a single untyped `data: Json` column, so
// the only machine-readable map into it is MasterFieldDef.worksheetPaths
// ("tool slug → dot-notation path"). Pairing that path's value with the
// field's label is what turns an opaque blob into "Surface Gravity (g): 1.47".
//
// entity-sync already runs this exact loop to diff worksheets against entity
// metadata; this module is the pure, testable version so the writing surface
// can render the same facts without duplicating the traversal.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";
import { getNestedValue } from "@/lib/entity-prepopulate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorksheetFact {
  /** Entity-metadata key, e.g. "surfaceGravity". Stable across tools. */
  key: string;
  /** Human label from the master field def, e.g. "Surface Gravity (g)". */
  label: string;
  /** Always a display string; arrays are joined, numbers stringified. */
  value: string;
  /**
   * What to drop into the manuscript, when that differs from what's displayed.
   *
   * A fact whose subject is a proper noun reads the wrong way round: the row
   * "Constellation \"The Drowned Man\" — 3 stars · 6h 22m" should insert the
   * name, not the star count. Defaults to `value` when absent.
   */
  insert?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Values that carry no information for a writer. */
function isEmpty(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  if (typeof raw === "string") return raw.trim() === "";
  if (Array.isArray(raw)) return raw.length === 0;
  // Nested objects are containers, not facts — worksheetPaths points at leaves.
  if (typeof raw === "object") return true;
  return false;
}

function toDisplay(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw.filter((v) => !isEmpty(v)).map(String).join(", ");
  }
  return String(raw);
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Every labelled fact `toolType` recorded in `data`.
 *
 * Returns [] for tools with no worksheetPaths mapping — only a subset of the
 * catalog is mapped today, so callers must handle an empty result as "nothing
 * mapped yet" rather than "nothing filled in".
 */
export function extractWorksheetFacts(
  toolType: string,
  data: unknown,
): WorksheetFact[] {
  if (!toolType || !data || typeof data !== "object") return [];

  const facts: WorksheetFact[] = [];
  const seen = new Set<string>();

  // The same field can appear under several entity types; first hit wins.
  for (const fields of Object.values(ENTITY_MASTER_FIELDS)) {
    for (const field of fields) {
      const path = field.worksheetPaths?.[toolType];
      if (!path || seen.has(field.key)) continue;

      const raw = getNestedValue(data as Record<string, unknown>, path);
      if (isEmpty(raw)) continue;

      seen.add(field.key);
      facts.push({ key: field.key, label: field.label, value: toDisplay(raw) });
    }
  }

  return facts;
}

/** True when this tool has any path mapping at all. */
export function hasFactMapping(toolType: string): boolean {
  return Object.values(ENTITY_MASTER_FIELDS).some((fields) =>
    fields.some((f) => f.worksheetPaths?.[toolType]),
  );
}

/** One-line summary for pin previews and card subtitles. */
export function summarizeFacts(facts: WorksheetFact[], max = 3): string {
  return facts
    .slice(0, max)
    .map((f) => `${f.label}: ${f.value}`)
    .join(" · ");
}
