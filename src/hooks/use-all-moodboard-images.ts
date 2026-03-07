import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { MoodboardImage } from "@/hooks/use-moodboard";

export interface MoodboardImageWithContext extends MoodboardImage {
  worksheetId: string;
  worksheetTitle: string;
  worldName: string;
}

export function useAllMoodboardImages() {
  const { user } = useAuth();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["all-moodboard-images", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("worksheets")
        .select("id, title, data, world_id, worlds(name)")
        .eq("user_id", user.id);

      if (error) throw error;

      const result: MoodboardImageWithContext[] = [];

      for (const worksheet of data || []) {
        const wsData = worksheet.data as Record<string, unknown> | null;
        const moodboard = (wsData?.moodboard || []) as MoodboardImage[];
        if (moodboard.length === 0) continue;

        const worldName = (worksheet.worlds as unknown as { name: string })?.name || "Unknown World";

        for (const image of moodboard) {
          result.push({
            ...image,
            worksheetId: worksheet.id,
            worksheetTitle: worksheet.title || "Untitled",
            worldName,
          });
        }
      }

      return result;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { images, isLoading };
}
