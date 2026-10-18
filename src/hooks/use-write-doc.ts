/**
 * Studio editor data layer — operates on the MANUSCRIPT store
 * (world_entries documents), the single canonical writing model.
 * The writing_entries store (/workshop) is retired; its rows were copied
 * into Studio documents (SF-II: one writing model, no parallel tables).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { localDay } from "@/lib/local-day";

export interface WriteDoc {
  id: string;
  world_id: string;
  title: string;
  content: string | null;
  entry_type: string;
  parent_id: string | null;
  updated_at: string;
  /**
   * Bumped by the server whenever content changes; saves are made against
   * it (optimistic concurrency). null before 20261019_writing_scale.sql.
   */
  content_version?: number | null;
  /**
   * Card fields (synopsis, POV, status, in-world date) read via
   * readDocMeta. Untyped in the DB, so it stays unknown here.
   */
  metadata: unknown;
}

/** Resolve a document id → its row (and thus its world_id). */
export function useWriteDoc(docId: string | undefined) {
  return useQuery<WriteDoc | null>({
    queryKey: ["write-doc", docId],
    enabled: !!docId,
    queryFn: async () => {
      const cols = "id, world_id, title, content, entry_type, parent_id, updated_at, metadata";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const first = await db.from("world_entries").select(`${cols}, content_version`).eq("id", docId).maybeSingle();
      if (!first.error) return first.data as WriteDoc | null;
      // content_version is not deployed yet (42703): read without it.
      if (first.error.code !== "42703" && first.error.code !== "PGRST204") throw first.error;
      const { data, error } = await db.from("world_entries").select(cols).eq("id", docId).maybeSingle();
      if (error) throw error;
      return data ? ({ ...data, content_version: null } as WriteDoc) : null;
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
        // Manuscript documents only: lore belongs to the Codex, and a
        // trashed document is not the one to reopen.
        .eq("entry_type", "document")
        .is("trashed_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ? { id: data.id, world_id: data.world_id } : null;
    },
  });
}

/**
 * Add `delta` words to today's session total (streaks). "Today" is the
 * browser's local date (src/lib/local-day.ts), passed to the RPC as p_day.
 *
 * Uses the atomic RPC `increment_writing_session`, applied 2026-08-10 (see
 * supabase/migrations/20260809_atomic_writing_session_increment.sql). The
 * function derives the user from auth.uid() and rejects a mismatched
 * p_user_id, so a bad caller cannot write someone else's row.
 *
 * The read-modify-write fallback below is retained deliberately: it keeps the
 * app working against any environment where the function is absent (a fresh
 * branch database, a local stack, a preview pointed at an older project). It
 * loses concurrent updates, which is why the RPC is preferred.
 */
export async function rollWordSession(userId: string, delta: number): Promise<void> {
  if (delta <= 0) return;
  // The writer's local calendar day, not the UTC one: keyed by UTC, the daily
  // goal reset at 6 pm in Denver. useSessionWords reads with the same key.
  const day = localDay();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db.rpc("increment_writing_session", {
    p_user_id: userId,
    p_day: day,
    p_delta: delta,
  });
  if (!error) return;

  // PGRST202 = function not found in the schema cache (migration not applied).
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

// countWords re-exported from the pure text module (single source, tested).
export { countWords } from "@/lib/text";
