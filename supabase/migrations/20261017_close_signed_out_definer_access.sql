-- ============================================================
-- Close signed-out access to SECURITY DEFINER functions
-- 2026-10-17
-- ============================================================
--
-- THE HOLE
-- Three functions guarded access with a comparison against auth.uid():
--
--   compile_world_snapshot      IF auth.uid() NOT IN (owner ∪ collaborators)
--   get_collaborators_for_world IF auth.uid() NOT IN (owner ∪ collaborators)
--   maybe_snapshot_world        IF owner != auth.uid() AND NOT EXISTS (...)
--
-- For a signed-out caller auth.uid() is NULL. `NULL NOT IN (...)` and
-- `x != NULL` evaluate to NULL, an IF on NULL is skipped, and the function
-- carried on with owner rights. Anyone holding a world's UUID could read
-- the whole world (worksheets, notes, Codex, Chronicle), read its
-- collaborator list, or write an auto-snapshot to it.
--
-- Every function in public was also EXECUTE-able by PUBLIC and anon, the
-- Postgres and Supabase defaults, so all 41 SECURITY DEFINER functions
-- were reachable at /rest/v1/rpc/* without signing in. The admin_* ones
-- check is_admin internally and were not open; the rest relied on the
-- comparisons above.
--
-- THE FIX
-- 1. Each guard now refuses a NULL auth.uid() first, then tests
--    membership with EXISTS against auth.uid(). Bodies are otherwise
--    unchanged from production as of this date.
-- 2. EXECUTE is revoked from PUBLIC and anon on every SECURITY DEFINER
--    function. Signed-in users keep what the app calls. Only the two
--    share-link readers stay open to anon, because /share pages load
--    signed out. Trigger and event-trigger functions are revoked from
--    every API role: Postgres checks EXECUTE on a trigger function only
--    at CREATE TRIGGER, so the triggers keep firing.
--
-- cleanup_world_versions is left as 20260820 set it (service_role only).
-- ============================================================


-- ── 1a. compile_world_snapshot ─────────────────────────────

CREATE OR REPLACE FUNCTION public.compile_world_snapshot(p_world_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_world RECORD;
  v_worksheets JSON;
  v_notes JSON;
  v_connections JSON;
  v_entries JSON;
  v_chronicle JSON;
  v_next_version INTEGER;
  v_result JSON;
BEGIN
  -- Verify caller is the world owner or a collaborator.
  -- auth.uid() IS NULL is tested first: a NULL comparison is not a refusal.
  IF auth.uid() IS NULL OR NOT (
    EXISTS (SELECT 1 FROM public.worlds
            WHERE id = p_world_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.world_collaborators
               WHERE world_id = p_world_id AND user_id = auth.uid())
  ) THEN
    RETURN json_build_object('error', 'Access denied');
  END IF;

  -- Fetch world metadata (no user_id)
  SELECT id, name, description, icon, tags,
         header_image_url, header_image_focus_y,
         archived_at, created_at, updated_at, calendar_config
  INTO v_world
  FROM public.worlds
  WHERE id = p_world_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'World not found');
  END IF;

  -- Fetch all worksheets (no user_id)
  SELECT COALESCE(json_agg(json_build_object(
    'id', w.id,
    'tool_type', w.tool_type,
    'title', w.title,
    'tags', w.tags,
    'data', w.data,
    'archived_at', w.archived_at,
    'created_at', w.created_at,
    'updated_at', w.updated_at
  ) ORDER BY w.tool_type, w.updated_at DESC), '[]'::json)
  INTO v_worksheets
  FROM public.worksheets w
  WHERE w.world_id = p_world_id;

  -- Fetch world notes (no user_id)
  SELECT COALESCE(json_agg(json_build_object(
    'id', n.id,
    'content', n.content,
    'created_at', n.created_at,
    'updated_at', n.updated_at
  )), '[]'::json)
  INTO v_notes
  FROM public.world_notes n
  WHERE n.world_id = p_world_id;

  -- Fetch connections (includes entry-based connections)
  SELECT COALESCE(json_agg(json_build_object(
    'id', c.id,
    'source_worksheet_id', c.source_worksheet_id,
    'target_worksheet_id', c.target_worksheet_id,
    'source_entry_id', c.source_entry_id,
    'target_entry_id', c.target_entry_id,
    'connection_type', c.connection_type,
    'description', c.description,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) ORDER BY c.created_at), '[]'::json)
  INTO v_connections
  FROM public.world_connections c
  WHERE c.world_id = p_world_id;

  -- Fetch entries (includes Codex fields)
  SELECT COALESCE(json_agg(json_build_object(
    'id', e.id,
    'entry_type', e.entry_type,
    'title', e.title,
    'content', e.content,
    'metadata', e.metadata,
    'sort_order', e.sort_order,
    'parent_id', e.parent_id,
    'tool_source', e.tool_source,
    'tool_data_id', e.tool_data_id,
    'layer', e.layer,
    'cover_image_url', e.cover_image_url,
    'icon', e.icon,
    'color', e.color,
    'created_at', e.created_at,
    'updated_at', e.updated_at
  ) ORDER BY e.sort_order, e.created_at), '[]'::json)
  INTO v_entries
  FROM public.world_entries e
  WHERE e.world_id = p_world_id;

  -- Fetch chronicle events
  SELECT COALESCE(json_agg(json_build_object(
    'id', ce.id,
    'title', ce.title,
    'description', ce.description,
    'event_date', ce.event_date,
    'sort_value', ce.sort_value,
    'end_date', ce.end_date,
    'end_sort_value', ce.end_sort_value,
    'event_type', ce.event_type,
    'layer', ce.layer,
    'parent_id', ce.parent_id,
    'linked_entry_id', ce.linked_entry_id,
    'icon', ce.icon,
    'color', ce.color,
    'tags', ce.tags,
    'created_at', ce.created_at,
    'updated_at', ce.updated_at
  ) ORDER BY ce.sort_value), '[]'::json)
  INTO v_chronicle
  FROM public.chronicle_events ce
  WHERE ce.world_id = p_world_id;

  -- Compute next version number for this world
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.world_versions
  WHERE world_id = p_world_id;

  -- Build the complete snapshot
  v_result := json_build_object(
    'format_version', 2,
    'exported_at', now(),
    'version_number', v_next_version,
    'world', json_build_object(
      'id', v_world.id,
      'name', v_world.name,
      'description', v_world.description,
      'icon', v_world.icon,
      'tags', v_world.tags,
      'header_image_url', v_world.header_image_url,
      'header_image_focus_y', v_world.header_image_focus_y,
      'archived_at', v_world.archived_at,
      'created_at', v_world.created_at,
      'updated_at', v_world.updated_at,
      'calendar_config', v_world.calendar_config
    ),
    'worksheets', v_worksheets,
    'notes', v_notes,
    'connections', v_connections,
    'entries', v_entries,
    'chronicle', v_chronicle
  );

  RETURN v_result;
END;
$function$;


-- ── 1b. get_collaborators_for_world ────────────────────────

CREATE OR REPLACE FUNCTION public.get_collaborators_for_world(p_world_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
BEGIN
  -- Verify caller is the world owner or a collaborator.
  -- auth.uid() IS NULL is tested first: a NULL comparison is not a refusal.
  IF auth.uid() IS NULL OR NOT (
    EXISTS (SELECT 1 FROM public.worlds
            WHERE id = p_world_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.world_collaborators
               WHERE world_id = p_world_id AND user_id = auth.uid())
  ) THEN
    RETURN '[]'::json;
  END IF;

  SELECT json_agg(json_build_object(
    'id', wc.id,
    'user_id', wc.user_id,
    'role', wc.role,
    'created_at', wc.created_at,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url
  ) ORDER BY wc.created_at ASC)
  INTO v_result
  FROM public.world_collaborators wc
  JOIN public.profiles p ON p.id = wc.user_id
  WHERE wc.world_id = p_world_id;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;


-- ── 1c. maybe_snapshot_world ───────────────────────────────

CREATE OR REPLACE FUNCTION public.maybe_snapshot_world(p_world_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_world RECORD;
  v_snapshot JSON;
  v_next_version INTEGER;
BEGIN
  -- Verify caller is the world owner or a collaborator
  SELECT snapshot_at, updated_at, user_id
  INTO v_world
  FROM public.worlds
  WHERE id = p_world_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Only owner or collaborators can trigger snapshots.
  -- auth.uid() IS NULL is tested first: a NULL comparison is not a refusal.
  IF auth.uid() IS NULL OR (
    v_world.user_id IS DISTINCT FROM auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.world_collaborators
      WHERE world_id = p_world_id AND user_id = auth.uid()
    )
  ) THEN
    RETURN FALSE;
  END IF;

  -- Rate limit: skip if last snapshot was <15 minutes ago
  IF v_world.snapshot_at IS NOT NULL
     AND v_world.snapshot_at > now() - interval '15 minutes' THEN
    RETURN FALSE;
  END IF;

  -- Skip if world hasn't changed since last snapshot
  IF v_world.snapshot_at IS NOT NULL
     AND v_world.updated_at <= v_world.snapshot_at THEN
    RETURN FALSE;
  END IF;

  -- Compile the snapshot
  v_snapshot := public.compile_world_snapshot(p_world_id);

  -- Check for errors
  IF v_snapshot->>'error' IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.world_versions
  WHERE world_id = p_world_id;

  -- Save to world_versions
  INSERT INTO public.world_versions (world_id, version_number, label, snapshot_data, created_by)
  VALUES (p_world_id, v_next_version, 'auto', v_snapshot, auth.uid());

  -- Update snapshot_at timestamp
  UPDATE public.worlds
  SET snapshot_at = now()
  WHERE id = p_world_id;

  RETURN TRUE;
END;
$function$;


-- ── 2a. Trigger and event-trigger functions: no API role calls these ──

REVOKE EXECUTE ON FUNCTION public.auto_todo_from_contact()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_todo_from_ticket()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_tag_usage()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_world_tag_usage()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_self_promotion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_world_updated_at()       FROM PUBLIC, anon, authenticated;


-- ── 2b. App RPCs: signed-in only ───────────────────────────

REVOKE EXECUTE ON FUNCTION public.accept_world_invite(text)                                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_clear_done_todos()                                    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_roadmap_item(text,text,text,text)              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_todo(text,text,text,uuid,uuid)                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_roadmap_item(uuid)                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_todo(uuid)                                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_recent_activity(integer)                          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_stats()                                           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_subscription_stats()                              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_detail(uuid)                                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_contacts(text,integer,integer)                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_roadmap_items(text,integer)                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_subscriptions(text,integer)                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_tickets(text,integer,integer)                    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_tickets(text,text,integer,integer)               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_todos(text,integer)                              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(integer,integer)                           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_search_users(text,integer)                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_contact(uuid,text,text)                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_roadmap_item(uuid,text,text,text,text,integer,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_ticket(uuid,text,text,text)                    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_todo(uuid,text,text,text)                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cast_roadmap_vote(uuid,integer)                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.compile_world_snapshot(uuid)                                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fork_world(uuid)                                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_collaborators_for_world(uuid)                           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.maybe_snapshot_world(uuid)                                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_roadmap_vote(uuid,integer)                           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_world_snapshot(uuid,text)                              FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_world_invite(text)                                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_done_todos()                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_roadmap_item(text,text,text,text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_todo(text,text,text,uuid,uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_roadmap_item(uuid)                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_todo(uuid)                                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_recent_activity(integer)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_stats()                                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_subscription_stats()                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_detail(uuid)                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_contacts(text,integer,integer)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_roadmap_items(text,integer)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions(text,integer)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_tickets(text,integer,integer)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_tickets(text,text,integer,integer)                TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_todos(text,integer)                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(integer,integer)                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text,integer)                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_contact(uuid,text,text)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_roadmap_item(uuid,text,text,text,text,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_ticket(uuid,text,text,text)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_todo(uuid,text,text,text)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_roadmap_vote(uuid,integer)                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.compile_world_snapshot(uuid)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.fork_world(uuid)                                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_collaborators_for_world(uuid)                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.maybe_snapshot_world(uuid)                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_roadmap_vote(uuid,integer)                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_world_snapshot(uuid,text)                               TO authenticated;


-- ── 2c. Share-link readers: open to signed-out visitors by design ──

REVOKE EXECUTE ON FUNCTION public.get_shared_world(text)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_shared_worksheet(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_shared_world(text)     TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_shared_worksheet(text) TO anon, authenticated;
