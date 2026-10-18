-- ============================================================
-- Private storage for writer material (Tier 0, privacy) — NOT YET APPLIED
-- ============================================================
--
-- Before: avatars, world-headers, moodboard-images and audio-tracks were all
-- `public = true`. A public bucket serves every object at
-- /storage/v1/object/public/<bucket>/<path> to anyone holding the URL; RLS
-- SELECT policies do not apply to that route. Map sheets (the writer's own
-- drawn planet maps) were filed in the public world-headers bucket.
--
-- After, per bucket:
--   avatars           PUBLIC (unchanged). Profile pictures show on community
--                     pages and shared-world bylines to signed-out viewers.
--   world-headers     PUBLIC (unchanged). Header and Codex cover images show
--                     on community/showcase pages and shared-link views.
--                     Map sheets no longer go here (see map-sheets).
--   moodboard-images  PRIVATE. Read: the uploader, plus anyone who can read
--                     the worksheet's world (owner, collaborator, or a
--                     signed-in reader of a community/public world, matching
--                     the worksheets table RLS). Path: <uid>/<worksheet_id>/…
--   audio-tracks      PRIVATE. Read: the uploader only. Tracks and playlists
--                     are owner-only tables; the path carries no world.
--                     Path: <uid>/<uuid>.<ext>
--   map-sheets        NEW, PRIVATE. Read: the uploader, plus anyone who can
--                     read the world. Path: <uid>/<world_id>/<entity_id>-<ts>.<ext>
--
-- The client resolves private objects to 1-hour signed URLs
-- (src/services/storage-urls.ts). Rows keep storing the public-URL form,
-- which encodes bucket + path, so legacy rows resolve the same way.
--
-- Write rules everywhere: first path segment = auth.uid().
-- Idempotent: every policy is dropped before it is created; buckets upsert.
-- ============================================================

BEGIN;

-- ── 1. Buckets ──────────────────────────────────────────────

UPDATE storage.buckets SET public = false
 WHERE id IN ('moodboard-images', 'audio-tracks');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('map-sheets', 'map-sheets', false, 12582912, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 2. Helpers ──────────────────────────────────────────────

-- A path segment as a uuid, or NULL. Storage paths are user-controlled text;
-- a bare ::uuid cast would raise inside a policy and fail the whole request.
CREATE OR REPLACE FUNCTION public.storage_segment_uuid(p_segment text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN p_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN p_segment::uuid
  END;
$function$;

-- Can the caller read this world's stored files? Owner, accepted
-- collaborator, or (signed in) a community/public world that is not archived.
-- Mirrors the SELECT policies on worlds / worksheets / world_entries.
-- SECURITY DEFINER so the check does not depend on, or recurse through, the
-- RLS of worlds and world_collaborators.
CREATE OR REPLACE FUNCTION public.can_read_world_storage(p_world_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_world_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.worlds w
     WHERE w.id = p_world_id
       AND (
         w.user_id = v_uid
         OR (w.visibility IN ('community', 'public') AND w.archived_at IS NULL)
         OR EXISTS (SELECT 1 FROM public.world_collaborators c
                     WHERE c.world_id = w.id AND c.user_id = v_uid)
       )
  );
END;
$function$;

-- The same question for a worksheet (moodboard paths carry the worksheet id).
CREATE OR REPLACE FUNCTION public.can_read_worksheet_storage(p_worksheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_world uuid;
BEGIN
  IF v_uid IS NULL OR p_worksheet_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT ws.world_id INTO v_world FROM public.worksheets ws WHERE ws.id = p_worksheet_id;
  RETURN public.can_read_world_storage(v_world);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.can_read_world_storage(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_read_worksheet_storage(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_read_world_storage(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.can_read_worksheet_storage(uuid) TO authenticated;

-- ── 3. moodboard-images policies ────────────────────────────

DROP POLICY IF EXISTS "Anyone can view moodboard images" ON storage.objects;

DROP POLICY IF EXISTS "Users can view own moodboard images" ON storage.objects;
CREATE POLICY "Users can view own moodboard images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'moodboard-images'
         AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "World readers can view moodboard images" ON storage.objects;
CREATE POLICY "World readers can view moodboard images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'moodboard-images'
         AND public.can_read_worksheet_storage(
               public.storage_segment_uuid((storage.foldername(name))[2])));

DROP POLICY IF EXISTS "Authenticated users can upload moodboard images" ON storage.objects;
CREATE POLICY "Authenticated users can upload moodboard images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moodboard-images'
              AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own moodboard images" ON storage.objects;
CREATE POLICY "Users can update their own moodboard images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'moodboard-images'
         AND (select auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'moodboard-images'
              AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own moodboard images" ON storage.objects;
CREATE POLICY "Users can delete their own moodboard images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'moodboard-images'
         AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- ── 4. audio-tracks policies (owner only) ───────────────────

DROP POLICY IF EXISTS "Anyone can listen to audio tracks" ON storage.objects;

DROP POLICY IF EXISTS "Users can list their own audio tracks" ON storage.objects;
CREATE POLICY "Users can list their own audio tracks"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audio-tracks'
         AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload audio tracks" ON storage.objects;
CREATE POLICY "Authenticated users can upload audio tracks"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio-tracks'
              AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own audio tracks" ON storage.objects;
CREATE POLICY "Users can update their own audio tracks"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'audio-tracks'
         AND (select auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'audio-tracks'
              AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own audio tracks" ON storage.objects;
CREATE POLICY "Users can delete their own audio tracks"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'audio-tracks'
         AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- ── 5. map-sheets policies ──────────────────────────────────

DROP POLICY IF EXISTS "Users can view own map sheets" ON storage.objects;
CREATE POLICY "Users can view own map sheets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'map-sheets'
         AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "World readers can view map sheets" ON storage.objects;
CREATE POLICY "World readers can view map sheets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'map-sheets'
         AND public.can_read_world_storage(
               public.storage_segment_uuid((storage.foldername(name))[2])));

DROP POLICY IF EXISTS "Users can upload own map sheets" ON storage.objects;
CREATE POLICY "Users can upload own map sheets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'map-sheets'
              AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own map sheets" ON storage.objects;
CREATE POLICY "Users can update own map sheets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'map-sheets'
         AND (select auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'map-sheets'
              AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own map sheets" ON storage.objects;
CREATE POLICY "Users can delete own map sheets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'map-sheets'
         AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- ── 6. Account deletion also removes map sheets ─────────────
-- Same body as 20261017_account_export_and_deletion.sql; the only change is
-- 'map-sheets' in the bucket list.

CREATE OR REPLACE FUNCTION public.prepare_account_deletion(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_entries int;
  v_connections int;
  v_versions int;
  v_objects jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id required';
  END IF;

  UPDATE public.world_entries e SET created_by = w.user_id
    FROM public.worlds w
   WHERE w.id = e.world_id AND e.created_by = p_user_id AND w.user_id <> p_user_id;
  GET DIAGNOSTICS v_entries = ROW_COUNT;

  UPDATE public.world_connections c SET created_by = w.user_id
    FROM public.worlds w
   WHERE w.id = c.world_id AND c.created_by = p_user_id AND w.user_id <> p_user_id;
  GET DIAGNOSTICS v_connections = ROW_COUNT;

  UPDATE public.world_versions v SET created_by = w.user_id
    FROM public.worlds w
   WHERE w.id = v.world_id AND v.created_by = p_user_id AND w.user_id <> p_user_id;
  GET DIAGNOSTICS v_versions = ROW_COUNT;

  SELECT coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'name', o.name)), '[]')
    INTO v_objects
    FROM storage.objects o
   WHERE o.bucket_id IN ('avatars', 'audio-tracks', 'moodboard-images', 'world-headers', 'map-sheets')
     AND split_part(o.name, '/', 1) = p_user_id::text
     AND NOT (
       o.bucket_id = 'world-headers' AND (
         EXISTS (SELECT 1 FROM public.world_entries e JOIN public.worlds w ON w.id = e.world_id
                  WHERE w.user_id <> p_user_id
                    AND (coalesce(e.cover_image_url, '') LIKE '%' || o.name || '%'
                         OR coalesce(e.content::text, '') LIKE '%' || o.name || '%'
                         OR coalesce(e.metadata::text, '') LIKE '%' || o.name || '%'))
         OR EXISTS (SELECT 1 FROM public.worlds w
                     WHERE w.user_id <> p_user_id
                       AND coalesce(w.header_image_url, '') LIKE '%' || o.name || '%')
       )
     );

  RETURN jsonb_build_object(
    'recredited', jsonb_build_object('entries', v_entries, 'connections', v_connections, 'versions', v_versions),
    'storage_objects', v_objects
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.prepare_account_deletion(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.prepare_account_deletion(uuid) TO service_role;

COMMIT;

-- ============================================================
-- EXISTING OBJECTS THAT NEED A MOVE (not done here; read-only listings)
-- ============================================================
--
-- (a) Map sheets still in the PUBLIC world-headers bucket. They keep
--     displaying (the client passes public-bucket URLs through), but they
--     stay readable by anyone with the URL until moved to
--     map-sheets/<uid>/<world_id>/<file> and the entry's
--     metadata.map_sheet_url is rewritten.
--
-- SELECT o.name                         AS object_path,
--        o.created_at,
--        e.id                           AS entry_id,
--        e.world_id,
--        e.metadata->>'map_sheet_url'   AS stored_url
--   FROM storage.objects o
--   LEFT JOIN public.world_entries e
--     ON e.metadata->>'map_sheet_url' LIKE '%/world-headers/' || o.name
--  WHERE o.bucket_id = 'world-headers'
--    AND (storage.foldername(o.name))[2] = 'map-sheets'
--  ORDER BY o.created_at;
--
-- (b) World headers that were picked FROM a moodboard before this change
--     (worlds.header_image_url pointing into moodboard-images). Once the
--     bucket is private, signed-out viewers (shared links, community cards)
--     can no longer load them; copy each object into world-headers and
--     rewrite the URL. New picks are copied automatically by the client.
--
-- SELECT w.id, w.user_id, w.visibility, w.header_image_url
--   FROM public.worlds w
--  WHERE w.header_image_url LIKE '%/storage/v1/object/public/moodboard-images/%';
--
-- SELECT w.id, w.user_id, w.theme->>'cover_image_url' AS cover_image_url
--   FROM public.worlds w
--  WHERE w.theme->>'cover_image_url' LIKE '%/storage/v1/object/public/moodboard-images/%';
