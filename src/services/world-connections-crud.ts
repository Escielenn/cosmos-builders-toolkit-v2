import { supabase } from "@/integrations/supabase/client";
import type { WorldConnection } from "./world-data";
import {
  ALL_RELATIONSHIP_TYPES,
  formatRelationshipType,
} from "./entity-graph-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateConnectionInput {
  worldId: string;
  sourceId: string;
  sourceType: "worksheet" | "entry";
  targetId: string;
  targetType: "worksheet" | "entry";
  connectionType: string;
  description?: string | null;
}

export interface UpdateConnectionInput {
  connectionId: string;
  connectionType?: string;
  description?: string | null;
}

/**
 * F3 · one vocabulary. These ten free-text verbs were `world_connections`'
 * own list; the graph model's RELATIONSHIP_TYPES_BY_STAGE is the vocabulary
 * now, and 20260906_f3_one_graph.sql rewrites stored rows onto it. Anything
 * that offers a verb to a writer reads from here.
 */
export const CONNECTION_TYPES = ALL_RELATIONSHIP_TYPES;

export type ConnectionType = string;

/** Label for any verb, typed or not — never a raw snake_case string. */
export function connectionTypeLabel(type: string): string {
  return formatRelationshipType(type);
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function createConnection(
  input: CreateConnectionInput,
  userId: string
): Promise<WorldConnection> {
  const row: Record<string, unknown> = {
    world_id: input.worldId,
    connection_type: input.connectionType,
    description: input.description ?? null,
    created_by: userId,
  };

  // Set source
  if (input.sourceType === "worksheet") {
    row.source_worksheet_id = input.sourceId;
  } else {
    row.source_entry_id = input.sourceId;
  }

  // Set target
  if (input.targetType === "worksheet") {
    row.target_worksheet_id = input.targetId;
  } else {
    row.target_entry_id = input.targetId;
  }

  const { data, error } = await supabase
    .from("world_connections")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as WorldConnection;
}

export async function deleteConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from("world_connections")
    .delete()
    .eq("id", connectionId);

  if (error) throw error;
}

export async function updateConnection(
  input: UpdateConnectionInput
): Promise<WorldConnection> {
  const updates: Record<string, unknown> = {};
  if (input.connectionType !== undefined) updates.connection_type = input.connectionType;
  if (input.description !== undefined) updates.description = input.description;

  const { data, error } = await supabase
    .from("world_connections")
    .update(updates)
    .eq("id", input.connectionId)
    .select()
    .single();

  if (error) throw error;
  return data as WorldConnection;
}
