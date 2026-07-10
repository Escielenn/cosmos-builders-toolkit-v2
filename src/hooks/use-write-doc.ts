/**
 * Studio editor data layer — operates on the MANUSCRIPT store
 * (world_entries documents), the single canonical writing model.
 * Replaces the earlier writing_entries-based useManuscript for the
 * main editor (SF-II: one writing model, no parallel tables).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WriteDoc {
  id: string;
  world_id: string;
  title: string;
  content: string | null;
  entry_type: string;
  parent_id: string | null;
  updated_at: string;
}

/** Resolve a document id → its row (and thus its world_id). */
export function useWriteDoc(docId: string | undefined) {
  return useQuery<WriteDoc | null>({
    queryKey: ["write-doc", docId],
    enabled: !!docId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("world_entries")
        .select("id, world_id, title, content, entry_type, parent_id, updated_at")
        .eq("id", docId)
        .maybeSingle();
      if (error) throw error;
      return data as WriteDoc | null;
    },
  });
}

/** Most-recently-edited manuscript document across the user's worlds. */
export function useLatestDoc() {
  const { user } = useAuth();
  return useQuery<{ id: string; world_id: string } | null>({
    queryKey: ["latest-doc", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Documents the user owns: join through worlds for ownership.
      const { data: worlds } = await supabase
        .from("worlds")
        .select("id")
        .eq("user_id", user!.id)
        .is("archived_at", null);
      const ids = (worlds ?? []).map((w) => w.id);
      if (ids.length === 0) return null;
      const { data } = await supabase
        .from("world_entries")
        .select("id, world_id, updated_at")
        .in("world_id", ids)
        .in("entry_type", ["document", "lore"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ? { id: data.id, world_id: data.world_id } : null;
    },
  });
}

/** Roll a positive word delta into today's writing_sessions row (streaks). */
export async function rollWordSession(userId: string, delta: number): Promise<void> {
  if (delta <= 0) return;
  const day = new Date().toISOString().slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: row } = await db
    .from("writing_sessions")
    .select("words")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  await db.from("writing_sessions").upsert({
    user_id: userId,
    day,
    words: (row?.words ?? 0) + delta,
    updated_at: new Date().toISOString(),
  });
}

export function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}
