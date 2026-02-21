import { useQuery } from "@tanstack/react-query";
import { getCodexData } from "@/services/world-data";
import { useAuth } from "@/contexts/AuthContext";

export function useCodexData(worldId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["codex-data", worldId],
    queryFn: () => getCodexData(worldId!),
    enabled: !!user && !!worldId,
    staleTime: 30_000,
  });
}
