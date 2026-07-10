-- ============================================================
-- SF2 Phase 0 — Bug fix #2: fork_world completeness
-- Status: APPLIED TO PRODUCTION 2026-07-10 — verified end-to-end
-- (synthetic source world forked; all 7 bug-fixes + zero cross-world
--  leakage confirmed, then test data removed).
-- ============================================================
--
-- The original fork_world (20260405_add_community_worlds.sql) deep-copies
-- a world but silently corrupts or drops data:
--
--   BUG 1  world_entries copied WITHOUT parent_id  → forked outline/wiki
--          trees flatten (children orphan to root).
--   BUG 2  world_entries copied WITHOUT icon, color, tags, tool_data_id
--          → entry styling, tagging, and worksheet backlinks lost.
--   BUG 3  worksheets copied without an old→new ID map → nothing that
--          references worksheets can be remapped.
--   BUG 4  world_connections not copied at all → all entry/worksheet
--          relationship links lost in forks.
--   BUG 5  chronicle_events not copied at all → forked worlds lose
--          their entire timeline.
--   BUG 6  entities copied without graph_x/graph_y/pinned → forked
--          graphs lose their layout.
--   BUG 7  entity_worksheets links not copied → "sourced from worksheet"
--          provenance lost on forked entries.
--
-- DELIBERATELY NOT COPIED (unchanged policy, now documented):
--   - world_versions     (snapshot history belongs to the source world)
--   - document_versions  (forked documents start with fresh history)
--   - simulation_saves   (user-owned, not world-content)
--
-- This is a forward-only CREATE OR REPLACE; signature, validation,
-- license semantics, and fork_count behavior are unchanged, so existing
-- client callers are unaffected. Existing forks damaged by BUG 1 need a
-- separate repair pass after production profiling counts them (SF2
-- Phase B0; see STELLARFORGE_II_IMPLEMENTATION_PLAN_v2 §4.1).
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
  v_entity_map JSONB := '{}';   -- old entity id  → new entity id
  v_ws_map     JSONB := '{}';   -- old worksheet id → new worksheet id
  v_entry_map  JSONB := '{}';   -- old world_entry id → new world_entry id
  v_event_map  JSONB := '{}';   -- old chronicle_event id → new id
  v_new_id UUID;
  v_entity RECORD;
  v_conn RECORD;
  v_ws RECORD;
  v_entry RECORD;
  v_note RECORD;
  v_event RECORD;
  v_link RECORD;
  v_src_ws UUID; v_tgt_ws UUID; v_src_entry UUID; v_tgt_entry UUID;
BEGIN
  -- Validate source world allows forking (unchanged)
  SELECT * INTO v_source FROM public.worlds
  WHERE id = p_source_world_id
    AND archived_at IS NULL
    AND visibility IN ('community', 'public')
    AND license IN ('fork_allowed', 'fork_modify', 'open');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'World not found or forking not allowed';
  END IF;

  -- Create new world (unchanged)
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

  -- ── Entities (now preserving graph layout: BUG 6) ──────────────
  FOR v_entity IN
    SELECT * FROM public.entities WHERE world_id = p_source_world_id
  LOOP
    v_new_id := gen_random_uuid();
    v_entity_map := v_entity_map || jsonb_build_object(v_entity.id::text, v_new_id::text);

    INSERT INTO public.entities (
      id, world_id, user_id, name, entity_type, custom_type_label,
      cascade_stage, color, icon, summary, image_url, description,
      notes, sort_order, tags, metadata, graph_x, graph_y, pinned
    ) VALUES (
      v_new_id, v_new_world_id, auth.uid(), v_entity.name,
      v_entity.entity_type, v_entity.custom_type_label,
      v_entity.cascade_stage, v_entity.color, v_entity.icon,
      v_entity.summary, v_entity.image_url, v_entity.description,
      v_entity.notes, v_entity.sort_order, v_entity.tags, v_entity.metadata,
      v_entity.graph_x, v_entity.graph_y, v_entity.pinned
    );
  END LOOP;

  -- Remap entity hierarchy (clean second pass replaces the original
  -- reverse-lookup UPDATE, same result, readable and verifiable)
  FOR v_entity IN
    SELECT * FROM public.entities
    WHERE world_id = p_source_world_id AND parent_entity_id IS NOT NULL
  LOOP
    UPDATE public.entities
    SET parent_entity_id = (v_entity_map ->> v_entity.parent_entity_id::text)::uuid
    WHERE id = (v_entity_map ->> v_entity.id::text)::uuid;
  END LOOP;

  -- ── Entity connections (unchanged logic) ───────────────────────
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

  -- ── Worksheets (now building an ID map: BUG 3) ──────────────────
  FOR v_ws IN
    SELECT * FROM public.worksheets
    WHERE world_id = p_source_world_id AND archived_at IS NULL
  LOOP
    v_new_id := gen_random_uuid();
    v_ws_map := v_ws_map || jsonb_build_object(v_ws.id::text, v_new_id::text);

    INSERT INTO public.worksheets (
      id, world_id, user_id, tool_type, title, tags, data
    ) VALUES (
      v_new_id, v_new_world_id, auth.uid(), v_ws.tool_type, v_ws.title,
      v_ws.tags, v_ws.data
    );
  END LOOP;

  -- ── World entries (BUGS 1 & 2: full fidelity + ID map) ─────────
  -- tool_data_id remaps via the worksheet map; references to archived
  -- (uncopied) worksheets resolve to NULL, matching ON DELETE SET NULL.
  FOR v_entry IN
    SELECT * FROM public.world_entries WHERE world_id = p_source_world_id
  LOOP
    v_new_id := gen_random_uuid();
    v_entry_map := v_entry_map || jsonb_build_object(v_entry.id::text, v_new_id::text);

    INSERT INTO public.world_entries (
      id, world_id, created_by, title, entry_type, content,
      metadata, sort_order, icon, color, tags, tool_data_id
    ) VALUES (
      v_new_id, v_new_world_id, auth.uid(), v_entry.title, v_entry.entry_type,
      v_entry.content, v_entry.metadata, v_entry.sort_order,
      v_entry.icon, v_entry.color, v_entry.tags,
      (v_ws_map ->> v_entry.tool_data_id::text)::uuid
    );
  END LOOP;

  -- Remap entry tree (BUG 1)
  FOR v_entry IN
    SELECT * FROM public.world_entries
    WHERE world_id = p_source_world_id AND parent_id IS NOT NULL
  LOOP
    UPDATE public.world_entries
    SET parent_id = (v_entry_map ->> v_entry.parent_id::text)::uuid
    WHERE id = (v_entry_map ->> v_entry.id::text)::uuid;
  END LOOP;

  -- ── World connections (BUG 4) ──────────────────────────────────
  -- Endpoints remap through the worksheet/entry maps. A row is copied
  -- only if it still has at least one source and one target endpoint
  -- after remapping (satisfying connection_has_source/_target);
  -- connections to archived worksheets are dropped, matching the
  -- decision not to copy archived worksheets.
  FOR v_conn IN
    SELECT * FROM public.world_connections WHERE world_id = p_source_world_id
  LOOP
    v_src_ws    := (v_ws_map    ->> v_conn.source_worksheet_id::text)::uuid;
    v_tgt_ws    := (v_ws_map    ->> v_conn.target_worksheet_id::text)::uuid;
    v_src_entry := (v_entry_map ->> v_conn.source_entry_id::text)::uuid;
    v_tgt_entry := (v_entry_map ->> v_conn.target_entry_id::text)::uuid;

    IF (v_src_ws IS NULL AND v_src_entry IS NULL)
       OR (v_tgt_ws IS NULL AND v_tgt_entry IS NULL) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.world_connections (
      world_id, source_worksheet_id, target_worksheet_id,
      source_entry_id, target_entry_id,
      connection_type, description, created_by
    ) VALUES (
      v_new_world_id, v_src_ws, v_tgt_ws, v_src_entry, v_tgt_entry,
      v_conn.connection_type, v_conn.description, auth.uid()
    );
  END LOOP;

  -- ── Chronicle events (BUG 5) ───────────────────────────────────
  FOR v_event IN
    SELECT * FROM public.chronicle_events
    WHERE world_id = p_source_world_id
    ORDER BY sort_value
  LOOP
    v_new_id := gen_random_uuid();
    v_event_map := v_event_map || jsonb_build_object(v_event.id::text, v_new_id::text);

    INSERT INTO public.chronicle_events (
      id, world_id, title, description, event_date, sort_value,
      end_date, end_sort_value, event_type, layer,
      linked_entry_id, icon, color, tags
    ) VALUES (
      v_new_id, v_new_world_id, v_event.title, v_event.description,
      v_event.event_date, v_event.sort_value,
      v_event.end_date, v_event.end_sort_value, v_event.event_type, v_event.layer,
      (v_entry_map ->> v_event.linked_entry_id::text)::uuid,
      v_event.icon, v_event.color, v_event.tags
    );
  END LOOP;

  -- Remap event hierarchy
  FOR v_event IN
    SELECT * FROM public.chronicle_events
    WHERE world_id = p_source_world_id AND parent_id IS NOT NULL
  LOOP
    UPDATE public.chronicle_events
    SET parent_id = (v_event_map ->> v_event.parent_id::text)::uuid
    WHERE id = (v_event_map ->> v_event.id::text)::uuid;
  END LOOP;

  -- ── Entry↔worksheet source links (BUG 7) ───────────────────────
  -- entity_worksheets joins world_entries↔worksheets (misnamed table;
  -- see SF2 plan §2.2). Copy only rows where both sides were copied.
  FOR v_link IN
    SELECT * FROM public.entity_worksheets ew
    WHERE ew.entity_id IN (
      SELECT id FROM public.world_entries WHERE world_id = p_source_world_id
    )
  LOOP
    IF (v_entry_map ->> v_link.entity_id::text) IS NOT NULL
       AND (v_ws_map ->> v_link.worksheet_id::text) IS NOT NULL THEN
      INSERT INTO public.entity_worksheets (entity_id, worksheet_id, is_primary)
      VALUES (
        (v_entry_map ->> v_link.entity_id::text)::uuid,
        (v_ws_map ->> v_link.worksheet_id::text)::uuid,
        v_link.is_primary
      );
    END IF;
  END LOOP;

  -- ── World notes (unchanged) ────────────────────────────────────
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

  -- Increment fork count (unchanged)
  UPDATE public.worlds SET fork_count = fork_count + 1
  WHERE id = p_source_world_id;

  RETURN v_new_world_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fork_world(UUID) TO authenticated;
