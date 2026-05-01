// ---------------------------------------------------------------------------
// useForkWorld, Calls the fork_world RPC to clone a world
// ---------------------------------------------------------------------------

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useForkWorld() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (sourceWorldId: string) => {
      const { data, error } = await supabase.rpc("fork_world", {
        p_source_world_id: sourceWorldId,
      });

      if (error) throw error;
      if (!data) throw new Error("Fork returned no world ID");

      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      queryClient.invalidateQueries({ queryKey: ["community-worlds"] });
      toast({
        title: "WORLD FORKED.",
        description: "A copy of this world has been added to your worlds.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to fork world",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
