import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SharedWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  header_image_url: string | null;
  header_image_focus_y: number;
  icon: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  myRole: "viewer" | "editor";
  ownerDisplayName: string | null;
}

export const useSharedWorlds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sharedWorlds", user?.id],
    queryFn: async (): Promise<SharedWorld[]> => {
      if (!user) return [];

      // Get world IDs where user is a collaborator
      const { data: collabs, error: collabError } = await supabase
        .from("world_collaborators")
        .select("world_id, role")
        .eq("user_id", user.id);

      if (collabError) throw collabError;
      if (!collabs || collabs.length === 0) return [];

      const worldIds = collabs.map((c) => c.world_id);

      // Fetch those worlds (RLS allows this via collaborator policy)
      const { data: worlds, error: worldsError } = await supabase
        .from("worlds")
        .select("*")
        .in("id", worldIds)
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (worldsError) throw worldsError;
      if (!worlds || worlds.length === 0) return [];

      // Fetch owner profiles
      const ownerIds = [...new Set(worlds.map((w) => w.user_id))];
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds);

      const ownerMap = new Map(
        (owners || []).map((o) => [o.id, o.display_name])
      );

      return worlds.map((world) => {
        const collab = collabs.find((c) => c.world_id === world.id);
        return {
          ...world,
          myRole: (collab?.role || "viewer") as "viewer" | "editor",
          ownerDisplayName: ownerMap.get(world.user_id) || null,
        };
      });
    },
    enabled: !!user,
  });
};
