// ---------------------------------------------------------------------------
// useWorldFavorites, Favorite toggle, check, and count hooks
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Check whether the current user has favorited a world */
export function useIsFavorited(worldId: string | undefined) {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: ["world-favorite", worldId, user?.id],
    queryFn: async () => {
      if (!user || !worldId) return false;

      const { data, error } = await supabase
        .from("world_favorites")
        .select("id")
        .eq("world_id", worldId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!worldId,
    staleTime: 60_000,
  });
}

/** Toggle favorite on/off for the current user */
export function useToggleFavorite(worldId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !worldId) throw new Error("Not authenticated or missing worldId");

      // Check if already favorited
      const { data: existing, error: checkErr } = await supabase
        .from("world_favorites")
        .select("id")
        .eq("world_id", worldId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (existing) {
        // Un-favorite
        const { error } = await supabase
          .from("world_favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return false; // now un-favorited
      } else {
        // Favorite
        const { error } = await supabase
          .from("world_favorites")
          .insert({ world_id: worldId, user_id: user.id });
        if (error) throw error;
        return true; // now favorited
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-favorite", worldId] });
      queryClient.invalidateQueries({ queryKey: ["world-favorite-count", worldId] });
      queryClient.invalidateQueries({ queryKey: ["community-worlds"] });
    },
  });
}

/** Get the total favorite count for a world */
export function useFavoriteCount(worldId: string | undefined) {
  return useQuery<number>({
    queryKey: ["world-favorite-count", worldId],
    queryFn: async () => {
      if (!worldId) return 0;

      const { count, error } = await supabase
        .from("world_favorites")
        .select("id", { count: "exact", head: true })
        .eq("world_id", worldId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!worldId,
    staleTime: 60_000,
  });
}
