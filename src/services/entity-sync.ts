import { supabase } from "@/integrations/supabase/client";
import { toJson } from "@/lib/rpc-json";
import type { Json } from "@/integrations/supabase/types";
import { ENTITY_MASTER_FIELDS, readMasterField } from "@/lib/entity-config";
import { getNestedValue } from "@/lib/entity-prepopulate";
import { TOOL_TYPE_MAP } from "@/services/world-data";

export interface PendingChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  sourceWorksheetId: string;
  sourceToolType: string;
}

/**
 * After a worksheet is saved, checks if the worksheet is linked to an entity
 * and computes any diffs between worksheet data and entity master fields.
 *
 * If diffs are found, stores them in `entity.metadata._pending_changes`
 * so the wiki page can display a sync notice.
 */
export async function syncWorksheetToEntity(
  worksheetId: string,
  worksheetData: Record<string, unknown>,
  toolType: string
): Promise<void> {
  // Find linked entity via entity_worksheets
  const { data: links } = await supabase
    .from("entity_worksheets")
    .select("entity_id")
    .eq("worksheet_id", worksheetId)
    .limit(1);

  if (!links || links.length === 0) return;

  const entityId = links[0].entity_id;

  // Fetch the entity entry
  const { data: entry } = await supabase
    .from("world_entries")
    .select("entry_type, metadata")
    .eq("id", entityId)
    .single();

  if (!entry) return;

  const entityType = entry.entry_type;
  const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
  const fields = ENTITY_MASTER_FIELDS[entityType];
  if (!fields) return;

  // Compute diff
  const changes: PendingChange[] = [];

  for (const field of fields) {
    const worksheetPath = field.worksheetPaths?.[toolType];
    if (!worksheetPath) continue;

    const worksheetValue = getNestedValue(worksheetData, worksheetPath);
    if (worksheetValue === undefined || worksheetValue === null || worksheetValue === "") continue;

    const entityValue = readMasterField(metadata, field);

    // Only flag if the values differ and the worksheet has a meaningful value
    if (entityValue !== worksheetValue && String(entityValue) !== String(worksheetValue)) {
      changes.push({
        field: field.key,
        label: field.label,
        oldValue: entityValue,
        newValue: worksheetValue,
        sourceWorksheetId: worksheetId,
        sourceToolType: toolType,
      });
    }
  }

  if (changes.length === 0) {
    // Clear any existing pending changes
    if (metadata._pending_changes) {
      const { _pending_changes, ...rest } = metadata;
      await supabase
        .from("world_entries")
        .update({ metadata: toJson(rest) })
        .eq("id", entityId);
    }
    return;
  }

  // Store pending changes in metadata
  await supabase
    .from("world_entries")
    .update({
      metadata: toJson({
        ...metadata,
        _pending_changes: changes,
      }),
    })
    .eq("id", entityId);
}

/**
 * Pure core of acceptPendingChanges: apply the pending changes named in
 * `fields` (or every pending change when `fields` is omitted) onto a copy of
 * the entity metadata. Changes that were not accepted stay pending; the
 * `_pending_changes` marker is removed only once nothing is left.
 *
 * Note: there is no canon/confidence marker on entity metadata today (that
 * arrives with the canon layer, src/canon/). Until then the writer's
 * protection is that nothing is applied without being named field by field
 * or by an explicit "accept all".
 */
export function applyPendingChanges(
  metadata: Record<string, unknown>,
  fields?: readonly string[],
): { metadata: Record<string, unknown>; applied: string[] } {
  const pending = (metadata._pending_changes as PendingChange[] | undefined) ?? [];
  if (pending.length === 0) return { metadata, applied: [] };

  const wanted = fields ? new Set(fields) : null;
  const updated: Record<string, unknown> = { ...metadata };
  const remaining: PendingChange[] = [];
  const applied: string[] = [];

  for (const change of pending) {
    if (wanted && !wanted.has(change.field)) {
      remaining.push(change);
      continue;
    }
    updated[change.field] = change.newValue;
    applied.push(change.field);
  }

  if (remaining.length > 0) {
    updated._pending_changes = remaining;
  } else {
    delete updated._pending_changes;
  }
  return { metadata: updated, applied };
}

/**
 * Accept pending changes, copying worksheet values into entity master fields.
 *
 * Pass `fields` to accept only those field keys; the rest stay pending.
 * Omit it to accept every pending change ("accept all").
 */
export async function acceptPendingChanges(
  entityId: string,
  fields?: readonly string[],
): Promise<void> {
  const { data: entry } = await supabase
    .from("world_entries")
    .select("metadata")
    .eq("id", entityId)
    .single();

  if (!entry) return;

  const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
  const { metadata: updated, applied } = applyPendingChanges(metadata, fields);
  if (applied.length === 0) return;

  await supabase
    .from("world_entries")
    .update({ metadata: updated as Json })
    .eq("id", entityId);
}

/**
 * Dismiss all pending changes without applying them.
 */
export async function dismissPendingChanges(entityId: string): Promise<void> {
  const { data: entry } = await supabase
    .from("world_entries")
    .select("metadata")
    .eq("id", entityId)
    .single();

  if (!entry) return;

  const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
  const { _pending_changes, ...rest } = metadata;

  await supabase
    .from("world_entries")
    .update({ metadata: toJson(rest) })
    .eq("id", entityId);
}
