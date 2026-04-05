-- ============================================================
-- COMMUNITY WORLDS: Visibility, Forking, Favorites, Comments
-- Enables public/community world sharing, GitHub-style forking,
-- social features, and an example world system.
-- ============================================================


-- ============================================================
-- 1. NEW COLUMNS ON WORLDS TABLE
-- ============================================================

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'community', 'public'));

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS forked_from UUID REFERENCES public.worlds(id) ON DELETE SET NULL;

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS fork_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS license TEXT NOT NULL DEFAULT 'view_only'
  CHECK (license IN ('view_only', 'fork_allowed', 'fork_modify', 'open'));

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS is_example BOOLEAN NOT NULL DEFAULT false;

-- Indexes for community browsing
CREATE INDEX IF NOT EXISTS idx_worlds_visibility ON public.worlds(visibility) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_worlds_fork_count ON public.worlds(fork_count DESC);


-- ============================================================
-- 2. WORLD FAVORITES TABLE
-- ============================================================

CREATE TABLE public.world_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT world_favorites_unique UNIQUE (user_id, world_id)
);

CREATE INDEX idx_world_favorites_user ON public.world_favorites(user_id);
CREATE INDEX idx_world_favorites_world ON public.world_favorites(world_id);

ALTER TABLE public.world_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.world_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own favorites"
  ON public.world_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
  ON public.world_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- 3. WORLD COMMENTS TABLE
-- ============================================================

CREATE TABLE public.world_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_world_comments_world ON public.world_comments(world_id);

ALTER TABLE public.world_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible worlds"
  ON public.world_comments FOR SELECT TO authenticated
  USING (
    world_id IN (
      SELECT id FROM public.worlds WHERE visibility IN ('community', 'public')
    )
  );

CREATE POLICY "Users can create comments"
  ON public.world_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.world_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.world_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "World owners can delete comments"
  ON public.world_comments FOR DELETE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_world_comments_updated_at
  BEFORE UPDATE ON public.world_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 4. HIDDEN EXAMPLE WORLDS (dismiss tracking)
-- ============================================================

CREATE TABLE public.hidden_example_worlds (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hidden_example_worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hidden state"
  ON public.hidden_example_worlds FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 5. RLS: Community/public worlds visible to authenticated users
-- ============================================================

CREATE POLICY "Auth can view community/public worlds"
  ON public.worlds FOR SELECT TO authenticated
  USING (
    visibility IN ('community', 'public') AND archived_at IS NULL
  );

-- Entities in community/public worlds are viewable
CREATE POLICY "Auth can view entities in community worlds"
  ON public.entities FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE visibility IN ('community', 'public'))
  );

-- Entity connections in community/public worlds
CREATE POLICY "Auth can view connections in community worlds"
  ON public.entity_connections FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE visibility IN ('community', 'public'))
  );

-- Worksheets in community/public worlds
CREATE POLICY "Auth can view worksheets in community worlds"
  ON public.worksheets FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE visibility IN ('community', 'public'))
  );

-- World entries in community/public worlds
CREATE POLICY "Auth can view entries in community worlds"
  ON public.world_entries FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE visibility IN ('community', 'public'))
  );

-- World notes in community/public worlds
CREATE POLICY "Auth can view notes in community worlds"
  ON public.world_notes FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE visibility IN ('community', 'public'))
  );


-- ============================================================
-- 6. FORK WORLD RPC
-- Deep copies a world and all its data for the calling user.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fork_world(p_source_world_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source RECORD;
  v_new_world_id UUID;
  v_entity_map JSONB := '{}';
  v_new_id UUID;
  v_entity RECORD;
  v_conn RECORD;
  v_ws RECORD;
  v_entry RECORD;
  v_note RECORD;
BEGIN
  -- Validate source world allows forking
  SELECT * INTO v_source FROM public.worlds
  WHERE id = p_source_world_id
    AND archived_at IS NULL
    AND visibility IN ('community', 'public')
    AND license IN ('fork_allowed', 'fork_modify', 'open');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'World not found or forking not allowed';
  END IF;

  -- Create new world
  INSERT INTO public.worlds (
    user_id, name, description, icon, header_image_url,
    header_image_focus_y, tags, theme, visibility, forked_from, license
  ) VALUES (
    auth.uid(),
    v_source.name || ' (Fork)',
    v_source.description,
    v_source.icon,
    v_source.header_image_url,
    v_source.header_image_focus_y,
    v_source.tags,
    v_source.theme,
    'private',
    p_source_world_id,
    CASE WHEN v_source.license = 'open' THEN 'open' ELSE 'view_only' END
  ) RETURNING id INTO v_new_world_id;

  -- Copy entities (build old→new ID map)
  FOR v_entity IN
    SELECT * FROM public.entities WHERE world_id = p_source_world_id
  LOOP
    v_new_id := gen_random_uuid();
    v_entity_map := v_entity_map || jsonb_build_object(v_entity.id::text, v_new_id::text);

    INSERT INTO public.entities (
      id, world_id, user_id, name, entity_type, custom_type_label,
      cascade_stage, color, icon, summary, image_url, description,
      notes, sort_order, tags, metadata
    ) VALUES (
      v_new_id, v_new_world_id, auth.uid(), v_entity.name,
      v_entity.entity_type, v_entity.custom_type_label,
      v_entity.cascade_stage, v_entity.color, v_entity.icon,
      v_entity.summary, v_entity.image_url, v_entity.description,
      v_entity.notes, v_entity.sort_order, v_entity.tags, v_entity.metadata
    );
  END LOOP;

  -- Remap parent_entity_id
  UPDATE public.entities e
  SET parent_entity_id = (v_entity_map ->> (
    SELECT oe.parent_entity_id::text FROM public.entities oe WHERE oe.id = (
      SELECT key::uuid FROM jsonb_each_text(v_entity_map) jem WHERE jem.value = e.id::text
    )
  ))::uuid
  WHERE e.world_id = v_new_world_id
    AND EXISTS (
      SELECT 1 FROM jsonb_each_text(v_entity_map) jem
      WHERE jem.value = e.id::text
      AND (SELECT oe.parent_entity_id FROM public.entities oe WHERE oe.id = jem.key::uuid) IS NOT NULL
    );

  -- Copy entity connections (remap IDs)
  FOR v_conn IN
    SELECT * FROM public.entity_connections WHERE world_id = p_source_world_id
  LOOP
    INSERT INTO public.entity_connections (
      world_id, user_id, source_entity_id, target_entity_id,
      relationship_type, relationship_label, cascade_stage,
      bidirectional, strength, status, time_start, time_end,
      notes, metadata, sort_order
    ) VALUES (
      v_new_world_id, auth.uid(),
      (v_entity_map ->> v_conn.source_entity_id::text)::uuid,
      (v_entity_map ->> v_conn.target_entity_id::text)::uuid,
      v_conn.relationship_type, v_conn.relationship_label,
      v_conn.cascade_stage, v_conn.bidirectional, v_conn.strength,
      v_conn.status, v_conn.time_start, v_conn.time_end,
      v_conn.notes, v_conn.metadata, v_conn.sort_order
    );
  END LOOP;

  -- Copy worksheets
  FOR v_ws IN
    SELECT * FROM public.worksheets
    WHERE world_id = p_source_world_id AND archived_at IS NULL
  LOOP
    INSERT INTO public.worksheets (
      world_id, user_id, tool_type, title, tags, data
    ) VALUES (
      v_new_world_id, auth.uid(), v_ws.tool_type, v_ws.title,
      v_ws.tags, v_ws.data
    );
  END LOOP;

  -- Copy world entries
  FOR v_entry IN
    SELECT * FROM public.world_entries WHERE world_id = p_source_world_id
  LOOP
    INSERT INTO public.world_entries (
      world_id, created_by, title, entry_type, content,
      metadata, sort_order
    ) VALUES (
      v_new_world_id, auth.uid(), v_entry.title, v_entry.entry_type,
      v_entry.content, v_entry.metadata, v_entry.sort_order
    );
  END LOOP;

  -- Copy world notes
  FOR v_note IN
    SELECT * FROM public.world_notes WHERE world_id = p_source_world_id
  LOOP
    INSERT INTO public.world_notes (
      world_id, user_id, title, content, tags, sort_order
    ) VALUES (
      v_new_world_id, auth.uid(), v_note.title, v_note.content,
      v_note.tags, v_note.sort_order
    );
  END LOOP;

  -- Increment fork count
  UPDATE public.worlds SET fork_count = fork_count + 1
  WHERE id = p_source_world_id;

  RETURN v_new_world_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fork_world(UUID) TO authenticated;
