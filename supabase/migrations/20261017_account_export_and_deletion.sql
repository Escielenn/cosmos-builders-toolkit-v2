-- ============================================================
-- Account data export + account deletion support
-- 2026-10-17
-- ============================================================
-- The Privacy Policy promises a user can take all their data and delete
-- their account. Until now neither existed beyond per-world snapshots.
--
-- export_account_data()           signed-in user, returns everything of theirs
-- prepare_account_deletion(uuid)  service role only, called by the
--                                 delete-account edge function just before
--                                 auth.admin.deleteUser()
-- ============================================================


-- ── 1. Export ──────────────────────────────────────────────
-- One JSON document: account, profile, subscriptions, a full snapshot of
-- every world the user owns, and every user-keyed row elsewhere. Secrets are
-- removed (Notion access token, share and invite tokens). Rows the user wrote
-- inside other people's worlds are listed by id only in "contributions", since
-- the content belongs to that world.

CREATE OR REPLACE FUNCTION public.export_account_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'format', 'stellarforge-account-export',
    'format_version', 1,
    'exported_at', now(),
    'account', (SELECT jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at)
                FROM auth.users u WHERE u.id = v_uid),
    'profile', (SELECT to_jsonb(p) - 'is_admin' FROM public.profiles p WHERE p.id = v_uid),
    'subscriptions', (SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]') FROM public.subscriptions s WHERE s.user_id = v_uid),
    'worlds', (SELECT coalesce(jsonb_agg(public.compile_world_snapshot(w.id)::jsonb ORDER BY w.created_at), '[]')
               FROM public.worlds w WHERE w.user_id = v_uid),
    'worksheets_outside_worlds', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.worksheets t WHERE t.user_id = v_uid AND t.world_id IS NULL),
    'writing_entries',      (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.writing_entries t      WHERE t.user_id = v_uid),
    'writing_sessions',     (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.writing_sessions t     WHERE t.user_id = v_uid),
    'document_versions',    (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.document_versions t    WHERE t.user_id = v_uid),
    'binder_nodes',         (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.binder_nodes t         WHERE t.user_id = v_uid),
    'scene_pins',           (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.scene_pins t           WHERE t.user_id = v_uid),
    'simulation_saves',     (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.simulation_saves t     WHERE t.user_id = v_uid),
    'entities',             (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.entities t             WHERE t.user_id = v_uid),
    'entity_connections',   (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.entity_connections t   WHERE t.user_id = v_uid),
    'entity_type_templates',(SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.entity_type_templates t WHERE t.user_id = v_uid),
    'world_tags',           (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.world_tags t           WHERE t.user_id = v_uid),
    'world_favorites',      (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.world_favorites t      WHERE t.user_id = v_uid),
    'world_comments',       (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.world_comments t       WHERE t.user_id = v_uid),
    'collaborations',       (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.world_collaborators t  WHERE t.user_id = v_uid),
    'user_badges',          (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.user_badges t          WHERE t.user_id = v_uid),
    'user_playlists',       (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.user_playlists t       WHERE t.user_id = v_uid),
    'user_audio_tracks',    (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.user_audio_tracks t    WHERE t.user_id = v_uid),
    'roadmap_votes',        (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.roadmap_votes t        WHERE t.user_id = v_uid),
    'support_tickets',      (SELECT coalesce(jsonb_agg(to_jsonb(t) - 'admin_notes'), '[]') FROM public.support_tickets t     WHERE t.user_id = v_uid),
    'contact_submissions',  (SELECT coalesce(jsonb_agg(to_jsonb(t) - 'admin_notes'), '[]') FROM public.contact_submissions t WHERE t.user_id = v_uid),
    'share_links', jsonb_build_object(
      'worlds',     (SELECT coalesce(jsonb_agg(to_jsonb(t) - 'share_token'), '[]') FROM public.world_link_shares t     WHERE t.owner_id = v_uid),
      'worksheets', (SELECT coalesce(jsonb_agg(to_jsonb(t) - 'share_token'), '[]') FROM public.worksheet_link_shares t WHERE t.owner_id = v_uid)
    ),
    'notion', (SELECT coalesce(jsonb_agg(to_jsonb(t) - 'access_token' - 'bot_id'), '[]') FROM public.notion_connections t WHERE t.user_id = v_uid),
    'contributions_to_other_worlds', jsonb_build_object(
      'entries',     (SELECT coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'world_id', e.world_id, 'title', e.title)), '[]')
                      FROM public.world_entries e JOIN public.worlds w ON w.id = e.world_id
                      WHERE e.created_by = v_uid AND w.user_id <> v_uid),
      'connections', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'world_id', c.world_id)), '[]')
                      FROM public.world_connections c JOIN public.worlds w ON w.id = c.world_id
                      WHERE c.created_by = v_uid AND w.user_id <> v_uid)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.export_account_data() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.export_account_data() TO authenticated;


-- ── 2. Deletion preparation ────────────────────────────────
-- Three tables point at auth.users with no delete rule (created_by NOT NULL,
-- NO ACTION): world_entries, world_connections, world_versions. Rows in the
-- user's own worlds go with the world by cascade. Rows the user wrote as a
-- collaborator in someone else's world would block auth.admin.deleteUser().
-- Those rows belong to that world, so they stay, credited to the world owner.
--
-- Returns the storage objects to remove: everything under the user's prefix,
-- except world-headers images that another person's world still displays.

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
   WHERE o.bucket_id IN ('avatars', 'audio-tracks', 'moodboard-images', 'world-headers')
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
