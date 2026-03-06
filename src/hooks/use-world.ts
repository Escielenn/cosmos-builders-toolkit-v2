import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorldTheme {
  accent_color?: string;
  cover_image_url?: string;
  icon?: string;
  font_mood?: "bridge" | "archive" | "terminal";
  soundtrack_playlist_id?: string;
}

interface World {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  header_image_url: string | null;
  header_image_focus_y: number;
  icon: string;
  tags: string[];
  theme: WorldTheme;
  snapshot_at: string | null;
  archived_at: string | null;
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

      // RLS handles access control — owners and collaborators both allowed
      if (data) {
        return {
          ...data,
          theme: (data.theme ?? {}) as WorldTheme,
        } as World;
      }
      return null;
    },
    enabled: !!user && !!worldId,
  });
};
