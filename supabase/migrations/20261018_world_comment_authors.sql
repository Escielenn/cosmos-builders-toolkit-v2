-- world_comment_authors(p_world_id)
--
-- Community comments need the commenter's display name and avatar, but
-- profiles RLS only exposes a user's own row, and world_comments.user_id
-- references auth.users (so PostgREST cannot embed profiles). This function
-- returns ONLY display_name + avatar_url, ONLY for users who have commented
-- on the given world, and ONLY when that world is community/public and not
-- archived (the same visibility the world_comments SELECT policy uses).
-- Requires a signed-in caller. No email, bio, admin flag or Stripe id leaves.
--
-- Idempotent: CREATE OR REPLACE + explicit grants.

CREATE OR REPLACE FUNCTION public.world_comment_authors(p_world_id uuid)
RETURNS TABLE (user_id uuid, display_name text, avatar_url text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.worlds w
    WHERE w.id = p_world_id
      AND w.visibility IN ('community', 'public')
      AND w.archived_at IS NULL
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT p.id, p.display_name, p.avatar_url
  FROM public.world_comments c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.world_id = p_world_id;
END;
$$;

REVOKE ALL ON FUNCTION public.world_comment_authors(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.world_comment_authors(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.world_comment_authors(uuid) TO authenticated;
