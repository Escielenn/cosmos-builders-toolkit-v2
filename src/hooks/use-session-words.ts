// ---------------------------------------------------------------------------
// useSessionWords, today's word total from the session ledger.
//
// The editor has always WRITTEN this number (rollWordSession -> writing_sessions)
// and never read it back, so the writer's own progress was invisible while
// writing. The footer showed a Julian Day instead.
//
// Reads writing_sessions, the ledger the Studio writes. The old /workshop
// store (writing_entries) is retired and no longer counted anywhere.
// ---------------------------------------------------------------------------

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { localDay } from "@/lib/local-day";

/**
 * Must match rollWordSession's key exactly: both use the writer's local
 * calendar day (localDay). Before 2026-10-19 both used the UTC date, which
 * reset the daily goal at 6 pm in Denver. Rows written before the switch keep
 * their UTC key; on the switch-over evening, words written after local 6 pm
 * sit on the next day's row. That is a one-time edge, not a data loss.
 */
function sessionDay(): string {
  return localDay();
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
