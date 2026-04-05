// ---------------------------------------------------------------------------
// useCommunityWorlds — Fetches worlds with visibility IN ('community','public')
// Joins with profiles for owner display_name, includes fork_count & entity count.
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommunitySort = "recent" | "most_forked" | "most_favorited";

export interface CommunityWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  tags: string[];
  header_image_url: string | null;
  visibility: string;
  fork_count: number;
  forked_from: string | null;
  license: string;
  is_example: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  owner_display_name: string;
  entity_count: number;
  favorite_count: number;
}

export function useCommunityWorlds(search?: string, sort: CommunitySort = "recent") {
  return useQuery<CommunityWorld[]>({
    queryKey: ["community-worlds", search, sort],
    queryFn: async () => {
      // Fetch community/public worlds with owner profile
      const { data: worlds, error } = await supabase
        .from("worlds")
        .select(`
          id,
          user_id,
          name,
          description,
          icon,
          tags,
          header_image_url,
          visibility,
          fork_count,
          forked_from,
          license,
          is_example,
          created_at,
          updated_at,
          profiles!worlds_user_id_fkey ( display_name )
        `)
        .in("visibility", ["community", "public"]);

      if (error) throw error;
      if (!worlds || worlds.length === 0) return [];

      // Fetch entity counts for all returned world IDs
      const worldIds = worlds.map((w) => w.id);

      const { data: entityCounts, error: entityErr } = await supabase
        .from("entities")
        .select("world_id")
        .in("world_id", worldIds);

      if (entityErr) throw entityErr;

      // Count entities per world
      const entityCountMap = new Map<string, number>();
      (entityCounts ?? []).forEach((e) => {
        entityCountMap.set(e.world_id, (entityCountMap.get(e.world_id) || 0) + 1);
      });

      // Fetch favorite counts
      const { data: favCounts, error: favErr } = await supabase
        .from("world_favorites")
        .select("world_id")
        .in("world_id", worldIds);

      if (favErr) throw favErr;

      const favCountMap = new Map<string, number>();
      (favCounts ?? []).forEach((f) => {
        favCountMap.set(f.world_id, (favCountMap.get(f.world_id) || 0) + 1);
      });

      // Build result array
      let result: CommunityWorld[] = worlds.map((w) => {
        const profile = w.profiles as unknown as { display_name: string | null } | null;
        return {
          id: w.id,
          user_id: w.user_id,
          name: w.name,
          description: w.description,
          icon: w.icon,
          tags: w.tags ?? [],
          header_image_url: w.header_image_url,
          visibility: w.visibility ?? "private",
          fork_count: w.fork_count ?? 0,
          forked_from: w.forked_from,
          license: w.license ?? "cc_by",
          is_example: w.is_example ?? false,
          created_at: w.created_at,
          updated_at: w.updated_at,
          owner_display_name: profile?.display_name || "Anonymous",
          entity_count: entityCountMap.get(w.id) || 0,
          favorite_count: favCountMap.get(w.id) || 0,
        };
      });

      // Apply search filter
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        result = result.filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            (w.description ?? "").toLowerCase().includes(q) ||
            (w.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
            w.owner_display_name.toLowerCase().includes(q)
        );
      }

      // Sort
      if (sort === "most_forked") {
        result.sort((a, b) => b.fork_count - a.fork_count);
      } else if (sort === "most_favorited") {
        result.sort((a, b) => b.favorite_count - a.favorite_count);
      } else {
        // recent
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      }

      return result;
    },
    staleTime: 30_000,
  });
}
