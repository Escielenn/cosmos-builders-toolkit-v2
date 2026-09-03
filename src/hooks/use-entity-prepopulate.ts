// ---------------------------------------------------------------------------
// useEntityPrepopulate, pre-fills tool form state from the entity a tool was
// opened ON (?entityId=<world_entries.id>) — Brief F4.
//
//   1. Fetches the entity from `world_entries` (the table entity_worksheets,
//      chronicle_events and writing_entry_entities reference). Until
//      2026-09-03 this read the separate `entities` table, whose ids never
//      coincide with world_entries ids, so a tool opened from an entity's
//      page found nothing to pre-fill. See AMENDMENTS 2026-09-03.
//   2. Extracts any metadata fields that map to this tool via the
//      worksheetPaths in entity-config.ts.
//   3. Returns a partial form state that the tool can spread into its
//      initial state.
//   4. Returns `linkWorksheet(worksheetId)` — idempotent; useWorksheets'
//      createWorksheet already attaches on save, so this is only needed by
//      tools that write worksheets through another path.
//
// If the entity has no relevant metadata values, returns the entity name
// only, still useful for pre-filling the worksheet title.
// ---------------------------------------------------------------------------

import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSubjectEntity } from "@/hooks/use-subject-entity";
import { attachWorksheetToEntity } from "@/services/worksheet-subjects";
import { ENTITY_MASTER_FIELDS, type MasterFieldDef } from "@/lib/entity-config";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set a value at a dot-notation path on an object (mutates). */
function setAtPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Build a partial form state by reading entity metadata fields and
 * mapping them to the tool's dot-notation paths.
 */
export function buildFormPatch(
  entity: Pick<WorldEntry, "entry_type" | "metadata">,
  toolSlug: string
): Record<string, unknown> {
  const fields: MasterFieldDef[] =
    ENTITY_MASTER_FIELDS[entity.entry_type] ?? [];
  const metadata = (entity.metadata ?? {}) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  for (const field of fields) {
    const dotPath = field.worksheetPaths?.[toolSlug];
    if (!dotPath) continue;
    const value = metadata[field.key];
    if (value !== undefined && value !== null && value !== "") {
      setAtPath(patch, dotPath, value);
    }
  }

  return patch;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface EntityPrepopulateResult {
  /** The entity fetched via ?entityId=, or null. */
  entity: WorldEntry | null;
  /** Entity's name, use for worksheet title pre-fill. */
  entityName: string | null;
  /**
   * Partial form state derived from the entity's metadata fields
   * mapped through worksheetPaths for this tool. Spread into your
   * initial state. Empty {} when no entity or no mapped fields.
   */
  formPatch: Record<string, unknown>;
  /**
   * Call after saving the worksheet to create the entity↔worksheet
   * junction row. Safe to call multiple times (upsert).
   */
  linkWorksheet: (worksheetId: string) => Promise<void>;
  /** Whether an entityId was present in the URL. */
  hasEntityId: boolean;
}

export function useEntityPrepopulate(
  toolSlug: string
): EntityPrepopulateResult {
  const subject = useSubjectEntity();
  const entity = subject.entry;
  const entityId = subject.id;

  const formPatch = useMemo(
    () => (entity ? buildFormPatch(entity, toolSlug) : {}),
    [entity, toolSlug]
  );

  const linkWorksheet = useCallback(
    async (worksheetId: string) => {
      if (!entityId) return;
      const res = await attachWorksheetToEntity(entityId, worksheetId);
      if (!res.ok) console.warn("[entity-prepopulate] link failed:", "error" in res ? res.error : "unknown");
    },
    [entityId]
  );

  return {
    entity,
    entityName: entity?.title ?? null,
    formPatch,
    linkWorksheet,
    hasEntityId: !!entityId,
  };
}
