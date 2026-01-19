import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface World {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateWorldInput {
  name: string;
  description?: string;
}

export const useWorlds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const worldsQuery = useQuery({
    queryKey: ["worlds", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("worlds")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as World[];
    },
    enabled: !!user,
  });

  const createWorld = useMutation({
    mutationFn: async (input: CreateWorldInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("worlds")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as World;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds", user?.id] });
      toast({
        title: "World created!",
        description: "Your new world is ready for building.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWorld = useMutation({
    mutationFn: async (worldId: string) => {
      const { error } = await supabase
        .from("worlds")
        .delete()
        .eq("id", worldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds", user?.id] });
      toast({
        title: "World deleted",
        description: "The world has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete world",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    worlds: worldsQuery.data || [],
    isLoading: worldsQuery.isLoading,
    error: worldsQuery.error,
    createWorld,
    deleteWorld,
  };
};
