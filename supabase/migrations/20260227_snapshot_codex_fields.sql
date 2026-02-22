-- Phase 6: Update compile_world_snapshot to include Codex columns
-- Entries: parent_id, tool_source, tool_data_id, layer, cover_image_url, icon, color
-- Connections: source_entry_id, target_entry_id

CREATE OR REPLACE FUNCTION public.compile_world_snapshot(p_world_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Verify caller is the world owner or a collaborator
  IF auth.uid() NOT IN (
    SELECT user_id FROM public.worlds WHERE id = p_world_id
    UNION
    SELECT user_id FROM public.world_collaborators WHERE world_id = p_world_id
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
$$;
