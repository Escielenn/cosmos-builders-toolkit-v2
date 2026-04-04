// ---------------------------------------------------------------------------
// Entity Graph CRUD
// Supabase operations for entities and entity_connections tables.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import type {
  Entity,
  EntityConnection,
  CreateEntityInput,
  UpdateEntityInput,
  CreateConnectionInput,
  UpdateConnectionInput,
} from "./entity-graph-types";

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export async function fetchEntities(worldId: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("world_id", worldId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as Entity[];
}

export async function createEntity(
  input: CreateEntityInput,
  userId: string
): Promise<Entity> {
  const { data, error } = await supabase
    .from("entities")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Entity;
}

export async function updateEntity(input: UpdateEntityInput): Promise<Entity> {
  const { id, ...updates } = input;
  const { data, error } = await supabase
    .from("entities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Entity;
}

export async function deleteEntity(entityId: string): Promise<void> {
  const { error } = await supabase
    .from("entities")
    .delete()
    .eq("id", entityId);

  if (error) throw error;
}

/** Batch update graph positions (debounced from the graph view) */
export async function batchUpdatePositions(
  updates: Array<{ id: string; graph_x: number; graph_y: number; pinned: boolean }>
): Promise<void> {
  // Supabase doesn't have native batch update, so we use Promise.all
  // with individual updates. For <500 entities this is fine.
  const promises = updates.map(({ id, graph_x, graph_y, pinned }) =>
    supabase
      .from("entities")
      .update({ graph_x, graph_y, pinned })
      .eq("id", id)
  );

  const results = await Promise.all(promises);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
}

// ---------------------------------------------------------------------------
// Entity Connections
// ---------------------------------------------------------------------------

export async function fetchEntityConnections(
  worldId: string
): Promise<EntityConnection[]> {
  const { data, error } = await supabase
    .from("entity_connections")
    .select("*")
    .eq("world_id", worldId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as EntityConnection[];
}

export async function createEntityConnection(
  input: CreateConnectionInput,
  userId: string
): Promise<EntityConnection> {
  const { data, error } = await supabase
    .from("entity_connections")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as EntityConnection;
}

export async function updateEntityConnection(
  input: UpdateConnectionInput
): Promise<EntityConnection> {
  const { id, ...updates } = input;
  const { data, error } = await supabase
    .from("entity_connections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as EntityConnection;
}

export async function deleteEntityConnection(
  connectionId: string
): Promise<void> {
  const { error } = await supabase
    .from("entity_connections")
    .delete()
    .eq("id", connectionId);

  if (error) throw error;
}
