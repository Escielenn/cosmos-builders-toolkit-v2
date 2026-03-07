/**
 * Persisted writing surface preferences via Supabase auth user_metadata.
 * Falls back to localStorage when unauthenticated.
 * Pattern mirrors use-export-preferences.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WritingPreferences {
  themeId: string;
  dailyGoalWords: number;
}

const DEFAULTS: WritingPreferences = {
  themeId: "deep-space",
  dailyGoalWords: 500,
};

const LOCAL_KEY = "stellarforge-writing-preferences-v1";

function readLocal(): WritingPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function writeLocal(prefs: WritingPreferences) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch {
    /* noop */
  }
}

export function useWritingPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: preferences = DEFAULTS } = useQuery({
    queryKey: ["writing-preferences", user?.id],
    queryFn: async (): Promise<WritingPreferences> => {
      if (!user) return readLocal();

      const meta = user.user_metadata?.writing_preferences as
        | Partial<WritingPreferences>
        | undefined;

      if (meta) {
        const merged = { ...DEFAULTS, ...meta };
        writeLocal(merged);
        return merged;
      }

      return readLocal();
    },
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<WritingPreferences>) => {
      const next = { ...preferences, ...updates };

      writeLocal(next);

      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: { writing_preferences: next },
        });
        if (error) throw error;
      }

      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(["writing-preferences", user?.id], next);
    },
  });

  return {
    preferences,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
