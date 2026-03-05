import { supabase } from "@/integrations/supabase/client";
import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";
import { getNestedValue } from "@/lib/entity-prepopulate";
import { TOOL_TYPE_MAP } from "@/services/world-data";

interface PendingChange {
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

    const entityValue = metadata[field.key];

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
        .update({ metadata: rest })
        .eq("id", entityId);
    }
    return;
  }

  // Store pending changes in metadata
  await supabase
    .from("world_entries")
    .update({
      metadata: {
        ...metadata,
        _pending_changes: changes,
      },
    })
    .eq("id", entityId);
}

/**
 * Accept all pending changes — copies worksheet values into entity master fields
 * and clears the pending changes marker.
 */
export async function acceptPendingChanges(entityId: string): Promise<void> {
  const { data: entry } = await supabase
    .from("world_entries")
    .select("metadata")
    .eq("id", entityId)
    .single();

  if (!entry) return;

  const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
  const pending = metadata._pending_changes as PendingChange[] | undefined;
  if (!pending || pending.length === 0) return;

  // Apply changes
  const updated = { ...metadata };
  for (const change of pending) {
    updated[change.field] = change.newValue;
  }
  delete updated._pending_changes;

  await supabase
    .from("world_entries")
    .update({ metadata: updated })
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
    .update({ metadata: rest })
    .eq("id", entityId);
}
