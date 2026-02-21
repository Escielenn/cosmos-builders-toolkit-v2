import { useQuery } from "@tanstack/react-query";
import {
  getWorldData,
  type WorldDataSummary,
  type WorldLayerData,
  type WorldEntry,
  type WorldConnection,
} from "@/services/world-data";

export interface UseWorldOutlineResult {
  layers: WorldLayerData[];
  entries: WorldEntry[];
  connections: WorldConnection[];
  totalCompletion: number;
  isLoading: boolean;
  error: Error | null;
}

export function useWorldOutline(
  worldId: string | undefined
): UseWorldOutlineResult {
  const { data, isLoading, error } = useQuery<WorldDataSummary>({
    queryKey: ["world-outline", worldId],
    queryFn: () => getWorldData(worldId!),
    enabled: !!worldId,
    staleTime: 30_000,
  });

  return {
    layers: data?.layers ?? [],
    entries: data?.entries ?? [],
    connections: data?.connections ?? [],
    totalCompletion: data?.totalCompletion ?? 0,
    isLoading,
    error: error as Error | null,
  };
}
