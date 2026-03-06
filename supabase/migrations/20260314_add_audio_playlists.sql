-- ============================================================
-- User audio playlists
-- Tracks stored as denormalized JSONB array for easy reordering.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Playlist',
  tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_playlists_user ON public.user_playlists (user_id);

ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;

-- Users can only access their own playlists
CREATE POLICY "Users can read own playlists"
  ON public.user_playlists FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own playlists"
  ON public.user_playlists FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own playlists"
  ON public.user_playlists FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own playlists"
  ON public.user_playlists FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- updated_at trigger
CREATE TRIGGER set_user_playlists_updated_at
  BEFORE UPDATE ON public.user_playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
