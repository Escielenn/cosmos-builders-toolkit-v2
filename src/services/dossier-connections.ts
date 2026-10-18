// ---------------------------------------------------------------------------
// Dossier relationships → world_connections rows.
//
// A character's relationships are edges in the one world graph (F3), so the
// Codex Web view and every other reader of world_connections can draw "Kael
// · Rival · Ilse" without knowing Dossier exists. The dossier worksheet is the
// source end (source_worksheet_id); the target is another dossier worksheet
// or any world_entries entity.
//
// Best effort by design. A failed edge never blocks the save: the worksheet
// JSON keeps the relationship either way, and the next save retries any edge
// that has no row id yet. Failures are counted and returned so the page can
// say so in Ship's Voice rather than pretend.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import { RELATIONSHIP_STAGE_OF } from "@/services/entity-graph-types";
import {
  RELATIONSHIP_BIDIRECTIONAL,
  RELATIONSHIP_VERBS,
  planConnectionSync,
  relationshipLabel,
} from "@/lib/dossier/relationships";
import type { DossierRelationship } from "@/lib/dossier/types";

export interface ConnectionSyncResult {
  /** The relationship list with fresh connection ids filled in. */
  relationships: DossierRelationship[];
  failed: number;
}

function rowFor(r: DossierRelationship) {
  const verb = RELATIONSHIP_VERBS[r.type];
  return {
    connection_type: verb,
    relationship_label: relationshipLabel(r),
    cascade_stage: RELATIONSHIP_STAGE_OF[verb] ?? null,
    bidirectional: RELATIONSHIP_BIDIRECTIONAL[r.type],
    description: r.note.trim() || null,
  };
}

export async function syncDossierConnections(args: {
  worldId: string;
  worksheetId: string;
  userId: string;
  current: DossierRelationship[];
  saved: DossierRelationship[];
}): Promise<ConnectionSyncResult> {
  const { worldId, worksheetId, userId, current, saved } = args;
  const plan = planConnectionSync(current, saved);
  let failed = 0;
  const newIds = new Map<string, string>();

  for (const id of plan.remove) {
    const { error } = await supabase.from("world_connections").delete().eq("id", id);
    if (error) failed++;
  }

  for (const r of plan.update) {
    if (!r.connectionId) continue;
    const { error } = await supabase
      .from("world_connections")
      .update(rowFor(r))
      .eq("id", r.connectionId);
    if (error) failed++;
  }

  for (const r of plan.create) {
    // A dossier cannot be its own relation; world_connections forbids it too.
    if (r.targetKind === "dossier" && r.targetId === worksheetId) continue;
    const { data, error } = await supabase
      .from("world_connections")
      .insert({
        world_id: worldId,
        created_by: userId,
        source_worksheet_id: worksheetId,
        ...(r.targetKind === "dossier"
          ? { target_worksheet_id: r.targetId }
          : { target_entry_id: r.targetId }),
        ...rowFor(r),
      })
      .select("id")
      .single();
    if (error || !data) failed++;
    else newIds.set(r.id, data.id);
  }

  const removed = new Set(plan.remove);
  return {
    relationships: current.map((r) => {
      const fresh = newIds.get(r.id);
      if (fresh) return { ...r, connectionId: fresh };
      // A retargeted edge lost its old row; forget the stale id.
      if (r.connectionId && removed.has(r.connectionId)) return { ...r, connectionId: null };
      return r;
    }),
    failed,
  };
}
