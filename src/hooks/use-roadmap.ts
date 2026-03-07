import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'tool' | 'feature' | 'simulator' | 'integration';
  status: 'planned' | 'in_progress' | 'beta' | 'released';
  priority_order: number;
  vote_count: number;
  target_quarter: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapVote {
  id: string;
  user_id: string;
  roadmap_item_id: string;
  vote_count: number;
  period_start: string;
  period_end: string;
}

const MAX_VOTES = 10;

/** Fetch all non-released roadmap items sorted by vote count */
export function useRoadmapItems(statusFilter?: string) {
  return useQuery({
    queryKey: ['roadmap-items', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('roadmap_items')
        .select('*')
        .neq('status', 'released')
        .order('vote_count', { ascending: false })
        .order('priority_order', { ascending: true });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RoadmapItem[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/** Fetch current user's votes for their current billing period */
export function useMyVotes() {
  const { user } = useAuth();
  const { subscription, isVanguard } = useSubscription();

  return useQuery({
    queryKey: ['my-roadmap-votes', user?.id, subscription?.current_period_start],
    queryFn: async () => {
      if (!user || !subscription?.current_period_start) return [];

      const { data, error } = await supabase
        .from('roadmap_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_start', subscription.current_period_start);

      if (error) throw error;
      return (data ?? []) as RoadmapVote[];
    },
    enabled: !!user && isVanguard && !!subscription?.current_period_start,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/** Compute remaining vote budget for the current billing period */
export function useVoteBudget() {
  const { data: myVotes = [] } = useMyVotes();
  const usedVotes = myVotes.reduce((sum, v) => sum + v.vote_count, 0);
  return {
    used: usedVotes,
    remaining: MAX_VOTES - usedVotes,
    max: MAX_VOTES,
  };
}

/** Get votes for a specific item in the current billing period */
export function useMyVotesForItem(itemId: string) {
  const { data: myVotes = [] } = useMyVotes();
  const vote = myVotes.find(v => v.roadmap_item_id === itemId);
  return vote?.vote_count ?? 0;
}

/** Cast votes on a roadmap item (calls the RPC) */
export function useCastVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, count = 1 }: { itemId: string; count?: number }) => {
      const { data, error } = await supabase.rpc('cast_roadmap_vote', {
        p_roadmap_item_id: itemId,
        p_vote_count: count,
      });

      if (error) throw error;
      const result = data as { error?: string; success?: boolean; remaining?: number };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-roadmap-votes'] });
    },
  });
}

/** Remove votes from a roadmap item */
export function useRemoveVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, count = 1 }: { itemId: string; count?: number }) => {
      const { data, error } = await supabase.rpc('remove_roadmap_vote', {
        p_roadmap_item_id: itemId,
        p_vote_count: count,
      });

      if (error) throw error;
      const result = data as { error?: string; success?: boolean };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-roadmap-votes'] });
    },
  });
}
