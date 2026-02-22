import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorldBackupInfo {
  id: string;
  name: string;
  snapshotAt: string | null;
  versionCount: number;
}

export function useBackupStats(worlds: { id: string; name: string; snapshot_at: string | null }[]) {
  const { user } = useAuth();

  const worldIds = worlds.map((w) => w.id);

  const versionCountsQuery = useQuery({
    queryKey: ["backup-version-counts", ...worldIds],
    queryFn: async () => {
      if (worldIds.length === 0) return {};

      const { data, error } = await supabase
        .from("world_versions")
        .select("world_id")
        .in("world_id", worldIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.world_id] = (counts[row.world_id] || 0) + 1;
      }
      return counts;
    },
    enabled: !!user && worldIds.length > 0,
    staleTime: 60_000,
  });

  const versionCounts = versionCountsQuery.data || {};

  const worldBackups: WorldBackupInfo[] = worlds.map((w) => ({
    id: w.id,
    name: w.name,
    snapshotAt: w.snapshot_at,
    versionCount: versionCounts[w.id] || 0,
  }));

  const totalVersions = worldBackups.reduce((sum, w) => sum + w.versionCount, 0);

  // Find the most recent snapshot across all worlds
  const lastBackup = worlds.reduce<string | null>((latest, w) => {
    if (!w.snapshot_at) return latest;
    if (!latest) return w.snapshot_at;
    return new Date(w.snapshot_at) > new Date(latest) ? w.snapshot_at : latest;
  }, null);

  return {
    worldBackups,
    totalVersions,
    lastBackup,
    isLoading: versionCountsQuery.isLoading,
  };
}
