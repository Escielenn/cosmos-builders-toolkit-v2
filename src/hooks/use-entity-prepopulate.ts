// ---------------------------------------------------------------------------
// useEntityPrepopulate — pre-fills tool form state from a linked entity.
//
// When a tool page is opened with ?entityId=<uuid> in the URL:
//   1. Fetches the entity from the `entities` table.
//   2. Extracts any metadata fields that map to this tool via the
//      worksheetPaths in entity-config.ts.
//   3. Returns a partial form state that the tool can spread into its
//      initial state.
//   4. Returns a `linkWorksheet(worksheetId)` function to create the
//      entity_worksheets junction row after saving.
//
// If the entity has no relevant metadata values, returns the entity name
// only — still useful for pre-filling the worksheet title.
// ---------------------------------------------------------------------------

import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEntities } from "@/hooks/use-entity-graph";
import { useWorldId } from "@/hooks/use-world-id";
import { ENTITY_MASTER_FIELDS, type MasterFieldDef } from "@/lib/entity-config";
import type { Entity } from "@/services/entity-graph-types";

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
function buildFormPatch(
  entity: Entity,
  toolSlug: string
): Record<string, unknown> {
  const fields: MasterFieldDef[] =
    ENTITY_MASTER_FIELDS[entity.entity_type] ?? [];
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
  entity: Entity | null;
  /** Entity's name — use for worksheet title pre-fill. */
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
  const worldId = useWorldId();
  const [searchParams] = useSearchParams();
  const entityId = searchParams.get("entityId");

  const { data: entities = [] } = useEntities(worldId ?? undefined);

  const entity = useMemo(
    () => (entityId ? entities.find((e) => e.id === entityId) ?? null : null),
    [entityId, entities]
  );

  const formPatch = useMemo(
    () => (entity ? buildFormPatch(entity, toolSlug) : {}),
    [entity, toolSlug]
  );

  const linkWorksheet = useCallback(
    async (worksheetId: string) => {
      if (!entityId) return;
      // Upsert the entity_worksheets junction row
      const { error } = await supabase
        .from("entity_worksheets")
        .upsert(
          { entity_id: entityId, worksheet_id: worksheetId, is_primary: true },
          { onConflict: "entity_id,worksheet_id" }
        );
      if (error) {
        console.warn("[entity-prepopulate] link failed:", error.message);
      }
    },
    [entityId]
  );

  return {
    entity,
    entityName: entity?.name ?? null,
    formPatch,
    linkWorksheet,
    hasEntityId: !!entityId,
  };
}
