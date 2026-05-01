/**
 * Persisted export preferences via Supabase auth user_metadata.
 * Falls back to localStorage when unauthenticated.
 * No database schema changes required.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ExportFormat } from "@/components/tools/ExportDialog";

export interface PersistedExportPreferences {
  defaultFormat: ExportFormat;
  themeId: string;
  includeWorldName: boolean;
  includeDate: boolean;
}

const DEFAULTS: PersistedExportPreferences = {
  defaultFormat: "pdf-summary",
  themeId: "classic",
  includeWorldName: true,
  includeDate: true,
};

const LOCAL_KEY = "stellarforge-export-preferences-v2";

function readLocal(): PersistedExportPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function writeLocal(prefs: PersistedExportPreferences) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch {
    /* noop */
  }
}

export function useExportPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: preferences = DEFAULTS } = useQuery({
    queryKey: ["export-preferences", user?.id],
    queryFn: async (): Promise<PersistedExportPreferences> => {
      if (!user) return readLocal();

      // Read from auth user_metadata
      const meta = user.user_metadata?.export_preferences as
        | Partial<PersistedExportPreferences>
        | undefined;

      if (meta) {
        const merged = { ...DEFAULTS, ...meta };
        writeLocal(merged); // sync local cache
        return merged;
      }

      // No cloud prefs yet, use local
      return readLocal();
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<PersistedExportPreferences>) => {
      const next = { ...preferences, ...updates };

      // Always write to local
      writeLocal(next);

      // If authenticated, also persist to Supabase user_metadata
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: { export_preferences: next },
        });
        if (error) throw error;
      }

      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(["export-preferences", user?.id], next);
    },
  });

  return {
    preferences,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
