// ---------------------------------------------------------------------------
// useWorldSetting, one key of worlds.settings (jsonb) with a browser fallback.
//
// The same pattern as useWritingLabels (Phase 1), generalised for the other
// world-level writing settings: saved collections (writingCollections) and the
// project target (writingProject). Until 20261018_writing_p1.sql adds the
// column, the value lives in this browser's localStorage, so the feature works
// the day it ships and moves to the server on the first save after the
// migration lands. A save re-reads settings and merges only its own key, so
// labels, collections and targets never clobber each other.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapError } from "@/lib/ship-voice";
import { readSettingsKey, writeSettingsKey } from "@/lib/world-settings";

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === "42703" ||
    e.code === "PGRST204" ||
    (typeof e.message === "string" && /settings/i.test(e.message) && /column/i.test(e.message))
  );
}

const localKey = (key: string, worldId: string) => `sf-world-setting:${key}:${worldId}`;

function readLocal(key: string, worldId: string): unknown {
  try {
    const raw = localStorage.getItem(localKey(key, worldId));
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, worldId: string, value: unknown): void {
  try {
    if (value === undefined) localStorage.removeItem(localKey(key, worldId));
    else localStorage.setItem(localKey(key, worldId), JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

interface SettingState {
  raw: unknown;
  /** True while the settings column is missing and the value lives locally. */
  local: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useWorldSetting<T>(
  worldId: string | undefined,
  key: string,
  sanitize: (raw: unknown) => T,
  /** Ship's Voice title for a failed save. */
  failTitle = "SETTING NOT SAVED.",
) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const qk = ["world-setting", worldId, key] as const;

  const query = useQuery<SettingState>({
    queryKey: qk,
    enabled: !!worldId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await db.from("worlds").select("settings").eq("id", worldId!).maybeSingle();
      if (error) {
        if (isMissingColumn(error)) return { raw: readLocal(key, worldId!), local: true };
        throw error;
      }
      const raw = readSettingsKey(data?.settings, key);
      // A value saved locally before the migration shows until it moves up.
      return { raw: raw === undefined ? readLocal(key, worldId!) : raw, local: false };
    },
  });

  const save = useMutation({
    mutationFn: async (value: T): Promise<SettingState> => {
      const prev = qc.getQueryData<SettingState>(qk);
      if (prev?.local) {
        writeLocal(key, worldId!, value);
        return { raw: value, local: true };
      }
      const { data: row, error: readErr } = await db
        .from("worlds")
        .select("settings")
        .eq("id", worldId!)
        .maybeSingle();
      if (readErr) {
        if (isMissingColumn(readErr)) {
          writeLocal(key, worldId!, value);
          return { raw: value, local: true };
        }
        throw readErr;
      }
      const next = writeSettingsKey(row?.settings, key, value);
      const { error } = await db.from("worlds").update({ settings: next }).eq("id", worldId!);
      if (error) throw error;
      writeLocal(key, worldId!, undefined);
      // The labels hook caches the whole settings object; keep it fresh.
      qc.invalidateQueries({ queryKey: ["writing-labels", worldId] });
      return { raw: value, local: false };
    },
    onMutate: async (value: T) => {
      // Optimistic, so a toggle or a new collection shows at once.
      const prev = qc.getQueryData<SettingState>(qk);
      qc.setQueryData<SettingState>(qk, { raw: value, local: prev?.local ?? false });
      return { prev };
    },
    onSuccess: (state) => {
      qc.setQueryData(qk, state);
    },
    onError: (error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk, ctx.prev);
      toast({ title: failTitle, description: mapError(error), variant: "destructive" });
    },
  });

  const raw = query.data?.raw;
  const value = useMemo(() => sanitize(raw), [sanitize, raw]);

  return {
    value,
    isLocal: query.data?.local ?? false,
    isLoading: query.isLoading,
    save: save.mutate,
    saveAsync: save.mutateAsync,
    isSaving: save.isPending,
  };
}
