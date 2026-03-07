-- ============================================================
-- UNIFIED WORLD OBJECT: Phase 1
-- Adds world versioning (snapshots), cross-worksheet connections,
-- and world-level entries (manifest/journal).
-- ============================================================


-- ============================================================
-- 1. WORLD VERSIONS (snapshots)
-- Stores complete point-in-time snapshots of a world's state.
-- snapshot_data contains the full world object (minus user_id).
-- ============================================================

CREATE TABLE public.world_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  label TEXT,
  snapshot_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT world_versions_unique_number UNIQUE (world_id, version_number)
);

CREATE INDEX idx_world_versions_world ON public.world_versions (world_id);
CREATE INDEX idx_world_versions_created ON public.world_versions (created_at DESC);

ALTER TABLE public.world_versions ENABLE ROW LEVEL SECURITY;

-- World owner can do everything with versions
CREATE POLICY "World owner can view versions"
  ON public.world_versions FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can create versions"
  ON public.world_versions FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can delete versions"
  ON public.world_versions FOR DELETE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

-- Collaborators can view versions (read-only)
CREATE POLICY "Collaborators can view versions"
  ON public.world_versions FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );


-- ============================================================
-- 2. WORLD CONNECTIONS (cross-worksheet relationships)
-- Tracks typed links between worksheets within a world.
-- E.g., a species references a planet, or a myth derives from biology.
-- ============================================================

CREATE TABLE public.world_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  source_worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  target_worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'references',
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_connection CHECK (source_worksheet_id <> target_worksheet_id)
);

CREATE INDEX idx_world_connections_world ON public.world_connections (world_id);
CREATE INDEX idx_world_connections_source ON public.world_connections (source_worksheet_id);
CREATE INDEX idx_world_connections_target ON public.world_connections (target_worksheet_id);

ALTER TABLE public.world_connections ENABLE ROW LEVEL SECURITY;

-- World owner full access
CREATE POLICY "World owner can view connections"
  ON public.world_connections FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can create connections"
  ON public.world_connections FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can update connections"
  ON public.world_connections FOR UPDATE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can delete connections"
  ON public.world_connections FOR DELETE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

-- Collaborators: view + editor create/update/delete
CREATE POLICY "Collaborators can view connections"
  ON public.world_connections FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors can create connections"
  ON public.world_connections FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can update connections"
  ON public.world_connections FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can delete connections"
  ON public.world_connections FOR DELETE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE TRIGGER update_world_connections_updated_at
  BEFORE UPDATE ON public.world_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 3. WORLD ENTRIES (world-level manifest/journal)
-- General-purpose entries for world lore, decisions, milestones,
-- and references that aren't tied to a specific tool worksheet.
-- ============================================================

CREATE TABLE public.world_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('note', 'milestone', 'decision', 'reference', 'lore')),
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_world_entries_world ON public.world_entries (world_id);
CREATE INDEX idx_world_entries_type ON public.world_entries (world_id, entry_type);

ALTER TABLE public.world_entries ENABLE ROW LEVEL SECURITY;

-- World owner full access
CREATE POLICY "World owner can view entries"
  ON public.world_entries FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can create entries"
  ON public.world_entries FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can update entries"
  ON public.world_entries FOR UPDATE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE POLICY "World owner can delete entries"
  ON public.world_entries FOR DELETE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

-- Collaborators: view + editor create/update/delete
CREATE POLICY "Collaborators can view entries"
  ON public.world_entries FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors can create entries"
  ON public.world_entries FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can update entries"
  ON public.world_entries FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can delete entries"
  ON public.world_entries FOR DELETE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE TRIGGER update_world_entries_updated_at
  BEFORE UPDATE ON public.world_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 4. COMPILE WORLD SNAPSHOT (SECURITY DEFINER RPC)
-- Gathers the complete world state into a single JSON object.
-- Never includes user_id in the output — safe for export.
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
         archived_at, created_at, updated_at
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

  -- Compute next version number for this world
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.world_versions
  WHERE world_id = p_world_id;

  -- Build the complete snapshot
  v_result := json_build_object(
    'format_version', 1,
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
      'updated_at', v_world.updated_at
    ),
    'worksheets', v_worksheets,
    'notes', v_notes,
    'connections', v_connections,
    'entries', v_entries
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compile_world_snapshot(UUID) TO authenticated;
