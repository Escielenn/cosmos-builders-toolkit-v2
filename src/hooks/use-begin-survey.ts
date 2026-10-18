// ---------------------------------------------------------------------------
// useBeginSurvey, creates a world and seeds it from the BEGIN SURVEY wizard.
//
// One mutation: world row, then the seed (star, planet, species, their
// edges, and an empty "Chapter One"), then the caches the Studio reads are
// invalidated and the world palette's entity index is prefetched, so the
// first "/" in Chapter One already finds the star, the planet and the
// species. The caller navigates to /write/:documentId on success.
// ---------------------------------------------------------------------------

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapError } from "@/lib/ship-voice";
import { buildSeedPayload, type SurveyChoices } from "@/lib/onboarding/survey-seed";
import { executeSeed, type SeedResult } from "@/services/world-seed";
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

  return useMutation({
    mutationFn: async ({ choices, icon, description }: BeginSurveyInput): Promise<BeginSurveyResult> => {
      if (!user) throw new Error("Not authenticated");
      const payload = buildSeedPayload(choices);

      const { data: world, error } = await supabase
        .from("worlds")
        .insert({
          user_id: user.id,
          name: payload.worldName,
          description: description?.trim() || null,
          icon: icon || "globe",
          tags: [],
        })
        .select("id")
        .single();
      if (error) throw error;
      const worldId = (world as { id: string }).id;

      const seeded = await executeSeed(payload, worldId, user.id);
      return { worldId, ...seeded };
    },
    onSuccess: async ({ worldId }) => {
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
      toast({
        title: "SURVEY FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });
}
