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

interface CreateWorksheetInput {
  worldId: string;
  toolType: string;
  title?: string;
  data: Json;
}

interface UpdateWorksheetInput {
  worksheetId: string;
  title?: string;
  data?: Json;
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

  const createWorksheet = useMutation({
    mutationFn: async (input: CreateWorksheetInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("worksheets")
        .insert({
          world_id: input.worldId,
          user_id: user.id,
          tool_type: input.toolType,
          title: input.title || null,
          data: input.data,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Worksheet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worksheets", worldId] });
      toast({
        title: "Worksheet saved",
        description: "Your work has been saved to the cloud.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save worksheet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateWorksheet = useMutation({
    mutationFn: async (input: UpdateWorksheetInput) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: { title?: string; data?: Json } = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.data !== undefined) updateData.data = input.data;

      const { data, error } = await supabase
        .from("worksheets")
        .update(updateData)
        .eq("id", input.worksheetId)
        .select()
        .single();

      if (error) throw error;
      return data as Worksheet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worksheets", worldId] });
      toast({
        title: "Worksheet updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update worksheet",
        description: error.message,
        variant: "destructive",
      });
    },
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
    createWorksheet,
    updateWorksheet,
    deleteWorksheet,
  };
};

// Hook to fetch a single worksheet by ID
export const useWorksheet = (worksheetId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["worksheet", worksheetId],
    queryFn: async () => {
      if (!worksheetId) return null;

      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", worksheetId)
        .single();

      if (error) throw error;
      return data as Worksheet;
    },
    enabled: !!user && !!worksheetId,
  });
};
