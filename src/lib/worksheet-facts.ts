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
import { extractTimelineFacts } from "@/lib/timeline-facts";

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
  /**
   * Where this number came from, phrased to complete "… records X as Y".
   *
   * A continuity note that only says "your world records" leaves the writer
   * unable to act on it: if they disagree with the number they have to guess
   * which tool or save to go and change. Defaults to "Your world" when absent,
   * which is right for a fact the writer typed into a worksheet themselves.
   */
  source?: string;
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
/**
 * Tools whose saved shape needs a reader of its own.
 *
 * Kept deliberately small. A dot path is checkable at a glance and a function
 * is not, so a tool only earns an entry here when its data is genuinely not
 * scalars-at-paths.
 */
const BESPOKE_EXTRACTORS: Record<string, (data: unknown) => WorksheetFact[]> = {
  timeline: extractTimelineFacts,
};

export function extractWorksheetFacts(
  toolType: string,
  data: unknown,
): WorksheetFact[] {
  if (!toolType || !data || typeof data !== "object") return [];

  // Tools whose saved shape a dot path cannot describe get their own reader.
  // Timeline records a list of events rather than scalars at fixed paths, so
  // `worksheetPaths` has nothing to point at and the tool reached the writing
  // surface not at all.
  const bespoke = BESPOKE_EXTRACTORS[toolType];
  if (bespoke) return bespoke(data);

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
  if (toolType in BESPOKE_EXTRACTORS) return true;
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
