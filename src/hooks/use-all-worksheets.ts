import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

export interface WorksheetWithWorld {
  id: string;
  world_id: string;
  user_id: string;
  tool_type: string;
  title: string | null;
  tags: string[];
  archived_at: string | null;
  data: Json;
  created_at: string;
  updated_at: string;
  worlds: {
    name: string;
    icon: string;
  };
}

export const useAllWorksheets = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["all-worksheets", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("worksheets")
        .select("*, worlds(name, icon)")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as WorksheetWithWorld[]) || [];
    },
    enabled: !!user,
  });

  return {
    worksheets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
