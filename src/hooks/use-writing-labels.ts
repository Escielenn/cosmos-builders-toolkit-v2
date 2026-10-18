// ---------------------------------------------------------------------------
// useWritingLabels, the per-world Scrivener-style label set.
//
// Stored at worlds.settings.writingLabels (20261018_writing_p1.sql). Until
// that column exists the set lives in this browser's localStorage, so the
// feature works the day it ships and moves to the server on first save after
// the migration lands.
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapError } from "@/lib/ship-voice";
import { readLabels, sanitizeLabels, writeLabels, type WritingLabel } from "@/lib/writing-labels";

const LOCAL_PREFIX = "sf-writing-labels:";
const NO_LABELS: WritingLabel[] = [];

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === "42703" ||
    e.code === "PGRST204" ||
    (typeof e.message === "string" && /settings/i.test(e.message) && /column/i.test(e.message))
  );
}

function readLocal(worldId: string): WritingLabel[] {
  try {
    return sanitizeLabels(JSON.parse(localStorage.getItem(LOCAL_PREFIX + worldId) ?? "[]"));
  } catch {
    return [];
  }
}

function writeLocal(worldId: string, labels: WritingLabel[]): void {
  try {
    localStorage.setItem(LOCAL_PREFIX + worldId, JSON.stringify(labels));
  } catch {
    /* storage unavailable */
  }
}

interface LabelState {
  labels: WritingLabel[];
  /** Raw worlds.settings, kept so a save merges instead of clobbering. */
  settings: unknown;
  /** True while the settings column is missing and labels live locally. */
  local: boolean;
}

const key = (worldId: string | undefined) => ["writing-labels", worldId] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useWritingLabels(worldId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<LabelState>({
    queryKey: key(worldId),
    enabled: !!worldId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await db.from("worlds").select("settings").eq("id", worldId!).maybeSingle();
      if (error) {
        if (isMissingColumn(error)) return { labels: readLocal(worldId!), settings: {}, local: true };
        throw error;
      }
      const settings = data?.settings ?? {};
      const labels = readLabels(settings);
      // A set saved locally before the migration moves up on next save; show
      // it meanwhile rather than an empty list.
      return { labels: labels.length ? labels : readLocal(worldId!), settings, local: false };
    },
  });

  const save = useMutation({
    mutationFn: async (labels: WritingLabel[]): Promise<LabelState> => {
      const clean = sanitizeLabels(labels);
      const prev = qc.getQueryData<LabelState>(key(worldId));
      if (prev?.local) {
        writeLocal(worldId!, clean);
        return { labels: clean, settings: {}, local: true };
      }
      // Re-read so a concurrent change to another settings key survives.
      const { data: row, error: readErr } = await db
        .from("worlds")
        .select("settings")
        .eq("id", worldId!)
        .maybeSingle();
      if (readErr) {
        if (isMissingColumn(readErr)) {
          writeLocal(worldId!, clean);
          return { labels: clean, settings: {}, local: true };
        }
        throw readErr;
      }
      const next = writeLabels(row?.settings, clean);
      const { error } = await db.from("worlds").update({ settings: next }).eq("id", worldId!);
      if (error) throw error;
      writeLocal(worldId!, []);
      return { labels: clean, settings: next, local: false };
    },
    onSuccess: (state) => {
      qc.setQueryData(key(worldId), state);
      toast({ title: "LABELS UPDATED." });
    },
    onError: (error) => {
      toast({ title: "LABELS NOT SAVED.", description: mapError(error), variant: "destructive" });
    },
  });

  return {
    labels: query.data?.labels ?? NO_LABELS,
    isLocal: query.data?.local ?? false,
    isLoading: query.isLoading,
    saveLabels: save.mutate,
    isSaving: save.isPending,
  };
}
