-- Fix storage bucket policies to restrict SELECT to file owner
-- Previously, anyone could view files if they guessed the path

-- Fix avatars bucket - restrict SELECT to owner
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Users can view own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix world-headers bucket - restrict SELECT to owner
DROP POLICY IF EXISTS "Anyone can view world headers" ON storage.objects;
CREATE POLICY "Users can view own world headers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'world-headers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix moodboard-images bucket - restrict SELECT to owner
DROP POLICY IF EXISTS "Anyone can view moodboard images" ON storage.objects;
CREATE POLICY "Users can view own moodboard images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'moodboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);
