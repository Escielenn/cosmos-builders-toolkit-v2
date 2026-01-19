import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface Worksheet {
  id: string;
  world_id: string;
  user_id: string;
  tool_type: string;
  title: string | null;
  data: Json;
  created_at: string;
  updated_at: string;
}

export const useWorksheets = (worldId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const worksheetsQuery = useQuery({
    queryKey: ["worksheets", worldId],
    queryFn: async () => {
      if (!worldId) return [];

      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .eq("world_id", worldId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Worksheet[];
    },
    enabled: !!user && !!worldId,
  });

  const deleteWorksheet = useMutation({
    mutationFn: async (worksheetId: string) => {
      const { error } = await supabase
        .from("worksheets")
        .delete()
        .eq("id", worksheetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worksheets", worldId] });
      toast({
        title: "Worksheet deleted",
        description: "The worksheet has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete worksheet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    worksheets: worksheetsQuery.data || [],
    isLoading: worksheetsQuery.isLoading,
    error: worksheetsQuery.error,
    deleteWorksheet,
  };
};
