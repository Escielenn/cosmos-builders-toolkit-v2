// ---------------------------------------------------------------------------
// useWritingActivity, the Studio's writing ledgers for streaks, badges and
// the word-count history chart. Shaping lives in src/lib/writing-activity.ts.
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SessionRow, StudioDocSummary } from "@/lib/writing-activity";

/** Every writing_sessions row for the user (one per day written). */
export function useWritingSessions() {
  const { user } = useAuth();
  return useQuery<SessionRow[]>({
    queryKey: ["writing-sessions-all", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("writing_sessions")
        .select("day, words")
        .eq("user_id", user!.id)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });
}

/**
 * The user's live Studio documents (no content: counts, worlds and tags are
 * all badges need), plus the ids of their Workshop worlds.
 */
export function useStudioDocSummaries() {
  const { user } = useAuth();
  return useQuery<{ docs: StudioDocSummary[]; workshopWorldIds: Set<string> }>({
    queryKey: ["studio-doc-summaries", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [docsRes, worldsRes] = await Promise.all([
        supabase
          .from("world_entries")
          .select("id, world_id, tags")
          .eq("created_by", user!.id)
          .eq("entry_type", "document")
          .is("trashed_at", null),
        supabase
          .from("worlds")
          .select("id")
          .eq("user_id", user!.id)
          .eq("settings->>workshop", "true"),
      ]);
      if (docsRes.error) throw docsRes.error;
      return {
        docs: (docsRes.data ?? []) as StudioDocSummary[],
        workshopWorldIds: new Set((worldsRes.data ?? []).map((w) => w.id)),
      };
    },
  });
}
