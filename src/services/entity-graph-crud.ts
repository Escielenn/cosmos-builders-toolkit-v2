// ---------------------------------------------------------------------------
// Entity Graph CRUD — one graph (F3).
//
// Reads and writes `world_entries` / `world_connections`. The old `entities`
// and `entity_connections` tables are folded into those two by
// supabase/migrations/20260906_f3_one_graph.sql and are read-only afterwards;
// nothing in the app touches them any more.
//
// The `Entity` / `EntityConnection` shapes are unchanged, so every existing
// caller — EntitySidebar, WritingEntityPanel, the Showcase, the simulators'
// entity picker — keeps working and now sees the same rows the Codex sees.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import {
  ENTITY_ENTRY_TYPES,
  connectionCreateToRow,
  connectionUpdateToRow,
  entityCreateToRow,
  entityUpdateToRow,
  rowToConnection,
  rowToEntity,
  type WorldConnectionRow,
  type WorldEntryRow,
} from "./entity-graph-mapping";
import type {
  Entity,
  EntityConnection,
  CreateEntityInput,
  UpdateEntityInput,
  CreateConnectionInput,
  UpdateConnectionInput,
} from "./entity-graph-types";

// ---------------------------------------------------------------------------
// Deploy ordering
//
// The seven typed-edge columns arrive with 20260906_f3_one_graph.sql. If this
// build reaches a database that has not run it yet, a write carrying those
// columns comes back as PGRST204 (unknown column in the schema cache) or
// 42703. Rather than lose the write, we retry with the pre-F3 columns only and
// remember the answer for the rest of the session. Reads need no such guard —
// the mapping treats every F3 column as optional.
// ---------------------------------------------------------------------------

let typedEdgeColumns: boolean | null = null;

function isUnknownColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42703") return true;
  return /column .* does not exist|could not find the .* column/i.test(
    error.message ?? ""
  );
}

// ---------------------------------------------------------------------------
// Entities  (world_entries rows whose entry_type is an entity kind)
// ---------------------------------------------------------------------------

export async function fetchEntities(worldId: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from("world_entries")
    .select("*")
    .eq("world_id", worldId)
    .in("entry_type", ENTITY_ENTRY_TYPES as string[])
    .is("trashed_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as WorldEntryRow[]).map(rowToEntity);
}

export async function createEntity(
  input: CreateEntityInput,
  userId: string
): Promise<Entity> {
  const { data, error } = await supabase
    .from("world_entries")
    .insert(entityCreateToRow(input, userId) as never)
    .select()
    .single();

  if (error) throw error;
  return rowToEntity(data as unknown as WorldEntryRow);
}

export async function updateEntity(input: UpdateEntityInput): Promise<Entity> {
  // Metadata is a merge, never a replace: setting graph_x must not drop the
  // summary. Read the current blob only when a metadata key is in play.
  const probe = entityUpdateToRow(input, {});
  let updates = probe.columns;

  if (probe.metadata !== null) {
    const { data: current, error: readError } = await supabase
      .from("world_entries")
      .select("metadata")
      .eq("id", input.id)
      .single();
    if (readError) throw readError;

    const merged = entityUpdateToRow(input, current?.metadata);
    updates = { ...merged.columns, metadata: merged.metadata };
  }

  const { data, error } = await supabase
    .from("world_entries")
    .update(updates as never)
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;
  return rowToEntity(data as unknown as WorldEntryRow);
}

export async function deleteEntity(entityId: string): Promise<void> {
  const { error } = await supabase
    .from("world_entries")
    .delete()
    .eq("id", entityId);

  if (error) throw error;
}

/** Batch update graph positions (debounced from the Web view) */
export async function batchUpdatePositions(
  updates: Array<{ id: string; graph_x: number; graph_y: number; pinned: boolean }>
): Promise<void> {
  if (updates.length === 0) return;

  // Positions live in metadata, so each row needs its current blob before it
  // can be merged. One read for the whole batch, then one write per row.
  const ids = updates.map((u) => u.id);
  const { data: current, error: readError } = await supabase
    .from("world_entries")
    .select("id, metadata")
    .in("id", ids);
  if (readError) throw readError;

  const byId = new Map<string, unknown>(
    (current ?? []).map((r) => [r.id as string, r.metadata])
  );

  const results = await Promise.all(
    updates.map(({ id, graph_x, graph_y, pinned }) => {
      const merged = entityUpdateToRow(
        { id, graph_x, graph_y, pinned },
        byId.get(id)
      );
      return supabase
        .from("world_entries")
        .update({ metadata: merged.metadata } as never)
        .eq("id", id);
    })
  );

  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
}

// ---------------------------------------------------------------------------
// Entity connections  (world_connections rows between two entries)
// ---------------------------------------------------------------------------

export async function fetchEntityConnections(
  worldId: string
): Promise<EntityConnection[]> {
  const { data, error } = await supabase
    .from("world_connections")
    .select("*")
    .eq("world_id", worldId)
    .not("source_entry_id", "is", null)
    .not("target_entry_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as WorldConnectionRow[])
    .map(rowToConnection)
    .filter((c): c is EntityConnection => c !== null);
}

export async function createEntityConnection(
  input: CreateConnectionInput,
  userId: string
): Promise<EntityConnection> {
  const { base, f3 } = connectionCreateToRow(input, userId);

  if (typedEdgeColumns !== false) {
    const { data, error } = await supabase
      .from("world_connections")
      .insert({ ...base, ...f3 } as never)
      .select()
      .single();

    if (!error) {
      typedEdgeColumns = true;
      return rowToConnection(data as unknown as WorldConnectionRow)!;
    }
    if (!isUnknownColumnError(error)) throw error;
    typedEdgeColumns = false;
  }

  const { data, error } = await supabase
    .from("world_connections")
    .insert(base as never)
    .select()
    .single();

  if (error) throw error;
  return rowToConnection(data as unknown as WorldConnectionRow)!;
}

export async function updateEntityConnection(
  input: UpdateConnectionInput
): Promise<EntityConnection> {
  const { base, f3 } = connectionUpdateToRow(input);

  if (typedEdgeColumns !== false && Object.keys(f3).length > 0) {
    const { data, error } = await supabase
      .from("world_connections")
      .update({ ...base, ...f3 } as never)
      .eq("id", input.id)
      .select()
      .single();

    if (!error) {
      typedEdgeColumns = true;
      return rowToConnection(data as unknown as WorldConnectionRow)!;
    }
    if (!isUnknownColumnError(error)) throw error;
    typedEdgeColumns = false;
  }

  const { data, error } = await supabase
    .from("world_connections")
    .update(base as never)
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;
  return rowToConnection(data as unknown as WorldConnectionRow)!;
}

export async function deleteEntityConnection(
  connectionId: string
): Promise<void> {
  const { error } = await supabase
    .from("world_connections")
    .delete()
    .eq("id", connectionId);

  if (error) throw error;
}
