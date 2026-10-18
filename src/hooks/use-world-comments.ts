// ---------------------------------------------------------------------------
// useWorldComments, CRUD hooks for world comments
// ---------------------------------------------------------------------------
//
// Live table: world_comments(id, world_id, user_id, content, created_at,
// updated_at). user_id references auth.users, not profiles, so PostgREST
// cannot embed profiles; and profiles RLS only exposes the caller's own row.
// Author names come from the world_comment_authors() RPC instead
// (migration 20261018_world_comment_authors.sql), which returns display
// name + avatar for commenters on a community/public world only. Until that
// migration is applied the RPC errors and names fall back to "Anonymous";
// the comments themselves still load.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mapError } from "@/lib/ship-voice";

export interface WorldComment {
  id: string;
  world_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Resolved via world_comment_authors()
  display_name: string;
  avatar_url: string | null;
}

interface CommentRow {
  id: string;
  world_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface AuthorRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

/** Join comment rows to author rows. Pure, exported for tests. */
export function joinCommentAuthors(rows: CommentRow[], authors: AuthorRow[]): WorldComment[] {
  const byId = new Map(authors.map((a) => [a.user_id, a]));
  return rows.map((c) => {
    const author = byId.get(c.user_id);
    return {
      id: c.id,
      world_id: c.world_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      display_name: author?.display_name || "Anonymous",
      avatar_url: author?.avatar_url ?? null,
    };
  });
}

/** Fetch all comments for a world, ordered by created_at ascending */
export function useWorldComments(worldId: string | undefined) {
  return useQuery<WorldComment[]>({
    queryKey: ["world-comments", worldId],
    queryFn: async () => {
      if (!worldId) return [];

      const { data, error } = await supabase
        .from("world_comments")
        .select("id, world_id, user_id, content, created_at")
        .eq("world_id", worldId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return [];

      // Names are decoration: a failed lookup must not hide the comments.
      const { data: authors } = await supabase.rpc("world_comment_authors", {
        p_world_id: worldId,
      });

      return joinCommentAuthors(rows, authors ?? []);
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
    mutationFn: async (content: string) => {
      if (!user || !worldId) throw new Error("Not authenticated or missing worldId");

      const { data, error } = await supabase
        .from("world_comments")
        .insert({
          world_id: worldId,
          user_id: user.id,
          content,
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
        title: "FAILED TO POST COMMENT.",
        description: mapError(error),
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
        title: "FAILED TO DELETE COMMENT.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });
}
