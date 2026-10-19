// ---------------------------------------------------------------------------
// recent-work service — the reads behind the signed-in home and ⌘K.
//
// Metadata only. Documents never bring their content down (a manuscript can
// be 100k words; see use-writing-documents.ts SCALE). Shaping lives in
// src/lib/recent-work.ts and src/lib/command-palette.ts.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import type { RecentCodexEntry, RecentDoc, RecentWorksheet } from "@/lib/recent-work";

/** Binder structure, not Codex material. */
const NON_CODEX_ENTRY_TYPES = ["document", "folder"];

export interface RecentWorkLimits {
  docs: number;
  entries: number;
  worksheets: number;
}

export const DEFAULT_RECENT_LIMITS: RecentWorkLimits = {
  docs: 200,
  entries: 200,
  worksheets: 50,
};

export interface RecentWork {
  docs: RecentDoc[];
  entries: RecentCodexEntry[];
  worksheets: RecentWorksheet[];
}

export async function fetchRecentDocuments(worldIds: string[], limit: number): Promise<RecentDoc[]> {
  if (worldIds.length === 0) return [];
  const { data, error } = await supabase
    .from("world_entries")
    .select("id, world_id, title, updated_at")
    .in("world_id", worldIds)
    .eq("entry_type", "document")
    .is("trashed_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RecentDoc[];
}

export async function fetchRecentCodexEntries(
  worldIds: string[],
  limit: number,
): Promise<RecentCodexEntry[]> {
  if (worldIds.length === 0) return [];
  const { data, error } = await supabase
    .from("world_entries")
    .select("id, world_id, title, entry_type, updated_at")
    .in("world_id", worldIds)
    .not("entry_type", "in", `(${NON_CODEX_ENTRY_TYPES.join(",")})`)
    .is("trashed_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RecentCodexEntry[];
}

export async function fetchRecentWorksheets(userId: string, limit: number): Promise<RecentWorksheet[]> {
  const { data, error } = await supabase
    .from("worksheets")
    .select("id, world_id, tool_type, title, updated_at, data")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RecentWorksheet[];
}

export async function fetchRecentWork(
  userId: string,
  worldIds: string[],
  limits: RecentWorkLimits = DEFAULT_RECENT_LIMITS,
): Promise<RecentWork> {
  const [docs, entries, worksheets] = await Promise.all([
    fetchRecentDocuments(worldIds, limits.docs),
    fetchRecentCodexEntries(worldIds, limits.entries),
    fetchRecentWorksheets(userId, limits.worksheets),
  ]);
  return { docs, entries, worksheets };
}
