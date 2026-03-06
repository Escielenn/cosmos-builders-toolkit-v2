-- ============================================================
-- Audio tracks storage bucket + metadata table
-- Follows moodboard-images pattern from 20260205 migration.
-- ============================================================

-- 1. Storage bucket (public read, per-user-folder write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-tracks', 'audio-tracks', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can listen to audio tracks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-tracks');

CREATE POLICY "Authenticated users can upload audio tracks"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio-tracks'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own audio tracks"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'audio-tracks'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own audio tracks"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio-tracks'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 2. Metadata table for uploaded tracks
CREATE TABLE IF NOT EXISTS public.user_audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_audio_tracks_user ON public.user_audio_tracks (user_id);

ALTER TABLE public.user_audio_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audio tracks"
  ON public.user_audio_tracks FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own audio tracks"
  ON public.user_audio_tracks FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own audio tracks"
  ON public.user_audio_tracks FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
