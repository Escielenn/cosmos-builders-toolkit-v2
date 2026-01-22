import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface World {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  header_image_url: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export const useWorld = (worldId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["world", worldId],
    queryFn: async () => {
      if (!worldId) return null;

      const { data, error } = await supabase
        .from("worlds")
        .select("*")
        .eq("id", worldId)
        .maybeSingle();

      if (error) throw error;
      return data as World | null;
    },
    enabled: !!user && !!worldId,
  });
};
