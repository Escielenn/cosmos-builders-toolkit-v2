// ---------------------------------------------------------------------------
// useRecentWork — documents, Codex entries and worksheets across the
// writer's worlds, newest first. Shared by the signed-in home and ⌘K so the
// two never disagree about what "recent" means (one query key, one cache).
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRecentWork, type RecentWork } from "@/services/recent-work";

const EMPTY: RecentWork = { docs: [], entries: [], worksheets: [] };

export function useRecentWork(worldIds: readonly string[], options: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  const enabled = options.enabled ?? true;
  // Stable key regardless of world order.
  const ids = useMemo(() => [...worldIds].sort(), [worldIds]);

  const query = useQuery<RecentWork>({
    queryKey: ["recent-work", user?.id, ids.join(",")],
    enabled: !!user && enabled,
    staleTime: 30_000,
    queryFn: () => fetchRecentWork(user!.id, ids),
  });

  return {
    data: query.data ?? EMPTY,
    isLoading: query.isLoading && !!user && enabled,
    error: query.error,
  };
}
