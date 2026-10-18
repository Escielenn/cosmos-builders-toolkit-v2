// ---------------------------------------------------------------------------
// useBeginSurvey, creates a world and seeds it from the BEGIN SURVEY wizard.
//
// One mutation: world row, then the seed (star, planet, species, their
// edges, and an empty "Chapter One"), then the caches the Studio reads are
// invalidated and the world palette's entity index is prefetched, so the
// first "/" in Chapter One already finds the star, the planet and the
// species. The caller navigates to /write/:documentId on success.
//
// Retry-safe: the run (payload, world id, what is already written) is kept
// across a failure, and the next mutate() resumes it from the failed step
// instead of creating a second world. `partialWorldId` is set while a run
// has a world on file but is not finished; `reset()` drops the run.
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapError } from "@/lib/ship-voice";
import { buildSeedPayload, type SurveyChoices } from "@/lib/onboarding/survey-seed";
import {
  fileSurveyRun,
  newSurveyRun,
  type SeedResult,
  type SurveyRun,
} from "@/services/world-seed";
import { fetchEntities, fetchEntityConnections } from "@/services/entity-graph-crud";
import {
  entityGraphKeys,
  invalidateWorldConnections,
  invalidateWorldEntries,
} from "@/services/entity-graph-keys";

export interface BeginSurveyInput {
  choices: SurveyChoices;
  icon?: string;
  description?: string;
}

export interface BeginSurveyResult extends SeedResult {
  worldId: string;
}

export function useBeginSurvey() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const runRef = useRef<SurveyRun | null>(null);
  const [partialWorldId, setPartialWorldId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ choices, icon, description }: BeginSurveyInput): Promise<BeginSurveyResult> => {
      if (!user) throw new Error("Not authenticated");
      // A run left by a failure is resumed as first filed.
      if (!runRef.current) runRef.current = newSurveyRun(buildSeedPayload(choices));
      const run = runRef.current;

      return fileSurveyRun(run, user.id, async (worldName) => {
        const { data: world, error } = await supabase
          .from("worlds")
          .insert({
            user_id: user.id,
            name: worldName,
            description: description?.trim() || null,
            icon: icon || "globe",
            tags: [],
          })
          .select("id")
          .single();
        if (error) throw error;
        return (world as { id: string }).id;
      });
    },
    onSuccess: async ({ worldId }) => {
      runRef.current = null;
      setPartialWorldId(null);
      qc.invalidateQueries({ queryKey: ["worlds"] });
      qc.invalidateQueries({ queryKey: ["writing-documents", worldId] });
      invalidateWorldEntries(qc, worldId);
      invalidateWorldConnections(qc, worldId);
      // Prime the palette: the Studio's world index reads these two keys.
      await Promise.allSettled([
        qc.prefetchQuery({
          queryKey: entityGraphKeys.entities(worldId),
          queryFn: () => fetchEntities(worldId),
        }),
        qc.prefetchQuery({
          queryKey: entityGraphKeys.connections(worldId),
          queryFn: () => fetchEntityConnections(worldId),
        }),
      ]);
      toast({ title: "SURVEY FILED. WORLD ON RECORD." });
    },
    onError: (error) => {
      const worldId = runRef.current?.worldId ?? null;
      if (worldId) {
        // The world exists; show it in the index even though seeding stopped.
        qc.invalidateQueries({ queryKey: ["worlds"] });
        invalidateWorldEntries(qc, worldId);
      } else {
        // Nothing was written: the next attempt starts clean.
        runRef.current = null;
      }
      setPartialWorldId(worldId);
      toast({
        title: worldId ? "SEEDING INTERRUPTED. RETRY RESUMES." : "SURVEY FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });

  const reset = useCallback(() => {
    runRef.current = null;
    setPartialWorldId(null);
    mutation.reset();
  }, [mutation]);

  return { ...mutation, partialWorldId, reset };
}
