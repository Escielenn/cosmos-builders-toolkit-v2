// ---------------------------------------------------------------------------
// useSessionWords, today's word total from the session ledger.
//
// The editor has always WRITTEN this number (rollWordSession -> writing_sessions)
// and never read it back, so the writer's own progress was invisible while
// writing. The footer showed a Julian Day instead.
//
// Deliberately reads writing_sessions rather than use-writing-stats: that hook
// computes "words today" from writing_entries.word_count, a different ledger
// that the manuscript editor never touches. Reconciling the two is a product
// decision (see the D3 note in the writing-integration plan); until then this
// reports the number the editor actually produces.
// ---------------------------------------------------------------------------

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Must match rollWordSession's key exactly.
 *
 * That writer uses `new Date().toISOString().slice(0, 10)` — the UTC date, not
 * the local one. Reading by local date would miss the row for several hours
 * either side of midnight depending on timezone. Keeping both on UTC is the
 * safe fix; switching the pair to local days later would need a data migration
 * of existing writing_sessions rows.
 */
function sessionDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useSessionWords() {
  const { user } = useAuth();
  const day = sessionDay();

  const query = useQuery<number>({
    queryKey: ["writing-session", user?.id, day],
    enabled: !!user,
    // Short, so the number moves as the writer works without hammering the API.
    staleTime: 15_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("writing_sessions")
        .select("words")
        .eq("user_id", user!.id)
        .eq("day", day)
        .maybeSingle();
      if (error) throw error;
      return data?.words ?? 0;
    },
  });

  const qc = useQueryClient();
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["writing-session", user?.id, day] });
  }, [qc, user?.id, day]);

  return {
    sessionWords: query.data ?? 0,
    isLoading: query.isLoading,
    /** Call after writing to the ledger so the number advances immediately. */
    refresh,
  };
}
