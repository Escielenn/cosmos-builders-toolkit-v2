import { supabase } from "@/integrations/supabase/client";
import type { WorldEntry, EntryType } from "./world-data";
import { getTypeForTool } from "./world-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateEntryInput {
  worldId: string;
  title: string;
  entryType: EntryType;
  parentId?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateEntryInput {
  entryId: string;
  title?: string;
  content?: string | null;
  parentId?: string | null;
  entryType?: EntryType;
  icon?: string | null;
  color?: string | null;
  coverImageUrl?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
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
      metadata: input.metadata ?? {},
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
  if (input.coverImageUrl !== undefined) updates.cover_image_url = input.coverImageUrl;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.metadata !== undefined) updates.metadata = input.metadata;

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

// ---------------------------------------------------------------------------
// Draft wiki page (auto-created when tool data saved)
// ---------------------------------------------------------------------------

export interface CreateDraftPageInput {
  worldId: string;
  toolSource: string;
  toolDataId: string;
  title: string;
  layer: string;
}

/**
 * Creates a draft wiki entry linked to a worksheet via tool_source / tool_data_id.
 * Uses upsert semantics — if an entry already exists for this tool+worksheet, it
 * updates the title instead of creating a duplicate.
 */
export async function createDraftWikiPage(
  input: CreateDraftPageInput,
  userId: string
): Promise<WorldEntry> {
  // Check if draft already exists for this worksheet
  const { data: existing } = await supabase
    .from("world_entries")
    .select("id")
    .eq("world_id", input.worldId)
    .eq("tool_source", input.toolSource)
    .eq("tool_data_id", input.toolDataId)
    .maybeSingle();

  if (existing) {
    // Update title in case worksheet was renamed
    const { data, error } = await supabase
      .from("world_entries")
      .update({ title: input.title })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as WorldEntry;
  }

  // Create new draft entry
  const { data, error } = await supabase
    .from("world_entries")
    .insert({
      world_id: input.worldId,
      title: input.title,
      entry_type: getTypeForTool(input.toolSource),
      content: null,
      tool_source: input.toolSource,
      tool_data_id: input.toolDataId,
      layer: input.layer,
      sort_order: 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WorldEntry;
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
