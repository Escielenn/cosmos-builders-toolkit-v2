import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useEarnedBadges() {
  const { user } = useAuth();

  const { data: earnedBadges = [], isLoading } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const earnedSet = new Set(earnedBadges.map((b) => b.badge_id));
  const earnedMap = new Map(earnedBadges.map((b) => [b.badge_id, b.earned_at]));

  return { earnedBadges, earnedSet, earnedMap, isLoading };
}

export function useEarnBadge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_badges")
        .insert({ user_id: user.id, badge_id: badgeId });
      // Ignore unique constraint violations (badge already earned)
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges", user?.id] });
    },
  });
}
