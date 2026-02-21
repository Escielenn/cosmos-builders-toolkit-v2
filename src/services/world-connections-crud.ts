import { supabase } from "@/integrations/supabase/client";
import type { WorldConnection } from "./world-data";

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

export const CONNECTION_TYPES = [
  "lives_on",
  "evolved_from",
  "governs",
  "worships",
  "speaks",
  "travels_via",
  "fights",
  "created",
  "parent_of",
  "related_to",
  "custom",
] as const;

export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  lives_on: "Lives On",
  evolved_from: "Evolved From",
  governs: "Governs",
  worships: "Worships",
  speaks: "Speaks",
  travels_via: "Travels Via",
  fights: "Fights",
  created: "Created",
  parent_of: "Parent Of",
  related_to: "Related To",
  custom: "Custom",
};

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
