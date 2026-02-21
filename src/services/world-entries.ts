import { supabase } from "@/integrations/supabase/client";
import type { WorldEntry } from "./world-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateEntryInput {
  worldId: string;
  title: string;
  entryType: "note" | "milestone" | "decision" | "reference" | "lore";
  parentId?: string | null;
  content?: string | null;
}

export interface UpdateEntryInput {
  entryId: string;
  title?: string;
  content?: string | null;
  parentId?: string | null;
  entryType?: "note" | "milestone" | "decision" | "reference" | "lore";
  icon?: string | null;
  color?: string | null;
  sortOrder?: number;
}

export interface MoveEntryInput {
  entryId: string;
  newParentId: string | null;
  newSortOrder: number;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function createEntry(
  input: CreateEntryInput,
  userId: string
): Promise<WorldEntry> {
  // Get the next sort_order for the target parent
  const { data: siblings } = await supabase
    .from("world_entries")
    .select("sort_order")
    .eq("world_id", input.worldId)
    .is("parent_id", input.parentId ?? null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = siblings && siblings.length > 0
    ? (siblings[0].sort_order ?? 0) + 1
    : 0;

  const { data, error } = await supabase
    .from("world_entries")
    .insert({
      world_id: input.worldId,
      title: input.title,
      entry_type: input.entryType,
      parent_id: input.parentId ?? null,
      content: input.content ?? null,
      sort_order: nextSortOrder,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WorldEntry;
}

export async function updateEntry(input: UpdateEntryInput): Promise<WorldEntry> {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.content !== undefined) updates.content = input.content;
  if (input.parentId !== undefined) updates.parent_id = input.parentId;
  if (input.entryType !== undefined) updates.entry_type = input.entryType;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.color !== undefined) updates.color = input.color;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("world_entries")
    .update(updates)
    .eq("id", input.entryId)
    .select()
    .single();

  if (error) throw error;
  return data as WorldEntry;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase
    .from("world_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw error;
}

export async function moveEntry(input: MoveEntryInput): Promise<WorldEntry> {
  const { data, error } = await supabase
    .from("world_entries")
    .update({
      parent_id: input.newParentId,
      sort_order: input.newSortOrder,
    })
    .eq("id", input.entryId)
    .select()
    .single();

  if (error) throw error;
  return data as WorldEntry;
}
