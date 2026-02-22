-- ============================================================
-- CHRONICLE EVENTS
-- Stores timeline events for each world's Chronicle view.
-- Supports arbitrary calendar systems via display date + sort key.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chronicle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,

  -- Timing
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  sort_value BIGINT NOT NULL DEFAULT 0,
  end_date TEXT,
  end_sort_value BIGINT,

  -- Classification
  event_type TEXT NOT NULL DEFAULT 'event',
  layer TEXT,

  -- Hierarchy
  parent_id UUID REFERENCES public.chronicle_events(id) ON DELETE CASCADE,

  -- Cross-references
  linked_entry_id UUID REFERENCES public.world_entries(id) ON DELETE SET NULL,

  -- Display
  icon TEXT,
  color TEXT,

  -- Meta
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chronicle_events_world_sort
  ON public.chronicle_events(world_id, sort_value);
CREATE INDEX IF NOT EXISTS idx_chronicle_events_parent
  ON public.chronicle_events(parent_id);

-- RLS
ALTER TABLE public.chronicle_events ENABLE ROW LEVEL SECURITY;

-- World owner full access
CREATE POLICY "World owner can view chronicle events"
  ON public.chronicle_events FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can create chronicle events"
  ON public.chronicle_events FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can update chronicle events"
  ON public.chronicle_events FOR UPDATE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can delete chronicle events"
  ON public.chronicle_events FOR DELETE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

-- Collaborators
CREATE POLICY "Collaborators can view chronicle events"
  ON public.chronicle_events FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors can create chronicle events"
  ON public.chronicle_events FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can update chronicle events"
  ON public.chronicle_events FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can delete chronicle events"
  ON public.chronicle_events FOR DELETE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE TRIGGER update_chronicle_events_updated_at
  BEFORE UPDATE ON public.chronicle_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CALENDAR CONFIG on worlds table
-- ============================================================

ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS calendar_config JSONB DEFAULT '{
  "era_label": "",
  "epoch_label": "Year",
  "date_format": "numeric"
}'::jsonb;

-- ============================================================
-- Add chronicle_events to compile_world_snapshot
-- ============================================================

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

  -- Fetch connections (no user_id / created_by)
  SELECT COALESCE(json_agg(json_build_object(
    'id', c.id,
    'source_worksheet_id', c.source_worksheet_id,
    'target_worksheet_id', c.target_worksheet_id,
    'connection_type', c.connection_type,
    'description', c.description,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) ORDER BY c.created_at), '[]'::json)
  INTO v_connections
  FROM public.world_connections c
  WHERE c.world_id = p_world_id;

  -- Fetch entries (no user_id / created_by)
  SELECT COALESCE(json_agg(json_build_object(
    'id', e.id,
    'entry_type', e.entry_type,
    'title', e.title,
    'content', e.content,
    'metadata', e.metadata,
    'sort_order', e.sort_order,
    'created_at', e.created_at,
    'updated_at', e.updated_at
  ) ORDER BY e.sort_order, e.created_at), '[]'::json)
  INTO v_entries
  FROM public.world_entries e
  WHERE e.world_id = p_world_id;

  -- Fetch chronicle events (no user_id)
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
