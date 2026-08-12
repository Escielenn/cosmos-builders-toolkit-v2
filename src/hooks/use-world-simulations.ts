/**
 * useWorldSimulations, every saved simulation for one world.
 *
 * useSimulationSave already queries this table, but scoped to a single
 * simulator_type because a simulator only ever loads its own saves. The writing
 * surface wants the opposite: everything the world has locked in, whatever
 * produced it.
 *
 * Read-only on purpose. Saving stays with the simulator that owns the state.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorldSimulation {
  id: string;
  simulator_type: string;
  name: string;
  data: unknown;
  updated_at: string | null;
}

export const useWorldSimulations = (worldId: string | undefined) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["world-simulations", worldId],
    queryFn: async (): Promise<WorldSimulation[]> => {
      if (!worldId) return [];
      const { data, error } = await supabase
        .from("simulation_saves")
        .select("id, simulator_type, name, data, updated_at")
        .eq("world_id", worldId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as WorldSimulation[];
    },
    enabled: !!user && !!worldId,
  });

  return {
    simulations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

export default useWorldSimulations;
