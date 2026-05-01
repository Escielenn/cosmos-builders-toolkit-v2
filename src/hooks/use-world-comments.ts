// ---------------------------------------------------------------------------
// useWorldComments, CRUD hooks for world comments
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WorldComment {
  id: string;
  world_id: string;
  user_id: string;
  body: string;
  created_at: string;
  // Joined from profiles
  display_name: string;
  avatar_url: string | null;
}

/** Fetch all comments for a world, ordered by created_at ascending */
export function useWorldComments(worldId: string | undefined) {
  return useQuery<WorldComment[]>({
    queryKey: ["world-comments", worldId],
    queryFn: async () => {
      if (!worldId) return [];

      const { data, error } = await supabase
        .from("world_comments")
        .select(`
          id,
          world_id,
          user_id,
          body,
          created_at,
          profiles!world_comments_user_id_fkey ( display_name, avatar_url )
        `)
        .eq("world_id", worldId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((c) => {
        const profile = c.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null;
        return {
          id: c.id,
          world_id: c.world_id,
          user_id: c.user_id,
          body: c.body,
          created_at: c.created_at,
          display_name: profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url ?? null,
        };
      });
    },
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

/** Create a new comment on a world */
export function useCreateComment(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      if (!user || !worldId) throw new Error("Not authenticated or missing worldId");

      const { data, error } = await supabase
        .from("world_comments")
        .insert({
          world_id: worldId,
          user_id: user.id,
          body,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-comments", worldId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/** Delete a comment (only own comments) */
export function useDeleteComment(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("world_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-comments", worldId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
