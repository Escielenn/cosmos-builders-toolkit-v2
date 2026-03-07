-- ============================================================
-- UNIFIED WORLD OBJECT: Phase 2
-- Adds automatic snapshots, rate limiting, and version cleanup.
-- ============================================================


-- ============================================================
-- 1. ADD snapshot_at COLUMN TO WORLDS
-- Tracks when the last snapshot was taken for rate limiting.
-- ============================================================

ALTER TABLE public.worlds
  ADD COLUMN snapshot_at TIMESTAMPTZ;


-- ============================================================
-- 2. TRIGGER: Cascade updated_at from child tables to worlds
-- When worksheets, world_notes, world_entries, or
-- world_connections change, touch the parent world's updated_at.
-- ============================================================

CREATE OR REPLACE FUNCTION public.touch_world_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.worlds
  SET updated_at = now()
  WHERE id = NEW.world_id;
  RETURN NEW;
END;
$$;

-- Worksheets → worlds
CREATE TRIGGER trg_worksheets_touch_world
  AFTER INSERT OR UPDATE ON public.worksheets
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_world_updated_at();

-- World notes → worlds
CREATE TRIGGER trg_world_notes_touch_world
  AFTER INSERT OR UPDATE ON public.world_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_world_updated_at();

-- World entries → worlds
CREATE TRIGGER trg_world_entries_touch_world
  AFTER INSERT OR UPDATE ON public.world_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_world_updated_at();

-- World connections → worlds
CREATE TRIGGER trg_world_connections_touch_world
  AFTER INSERT OR UPDATE ON public.world_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_world_updated_at();


-- ============================================================
-- 3. RATE-LIMITED AUTO-SNAPSHOT FUNCTION
-- Called from the frontend after saves. Creates a snapshot
-- only if >15 minutes have passed since the last one.
-- Returns TRUE if a snapshot was created, FALSE if skipped.
-- ============================================================

CREATE OR REPLACE FUNCTION public.maybe_snapshot_world(p_world_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Only owner or collaborators can trigger snapshots
  IF v_world.user_id != auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM public.world_collaborators
       WHERE world_id = p_world_id AND user_id = auth.uid()
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
$$;

GRANT EXECUTE ON FUNCTION public.maybe_snapshot_world(UUID) TO authenticated;


-- ============================================================
-- 4. ENHANCED compile_world_snapshot: also saves + updates snapshot_at
-- The existing compile_world_snapshot only returns JSON.
-- Add a companion that compiles AND saves (for manual snapshots).
-- ============================================================

CREATE OR REPLACE FUNCTION public.save_world_snapshot(p_world_id UUID, p_label TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot JSON;
  v_next_version INTEGER;
  v_version_id UUID;
BEGIN
  -- Verify caller is owner
  IF NOT EXISTS (
    SELECT 1 FROM public.worlds WHERE id = p_world_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Access denied');
  END IF;

  -- Compile the snapshot (bypasses rate limit — explicit save)
  v_snapshot := public.compile_world_snapshot(p_world_id);

  IF v_snapshot->>'error' IS NOT NULL THEN
    RETURN v_snapshot;
  END IF;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.world_versions
  WHERE world_id = p_world_id;

  -- Save to world_versions
  INSERT INTO public.world_versions (world_id, version_number, label, snapshot_data, created_by)
  VALUES (p_world_id, v_next_version, p_label, v_snapshot, auth.uid())
  RETURNING id INTO v_version_id;

  -- Update snapshot_at
  UPDATE public.worlds
  SET snapshot_at = now()
  WHERE id = p_world_id;

  RETURN json_build_object(
    'success', true,
    'version_id', v_version_id,
    'version_number', v_next_version,
    'snapshot', v_snapshot
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_world_snapshot(UUID, TEXT) TO authenticated;


-- ============================================================
-- 5. VERSION RETENTION CLEANUP
-- Tiered retention policy:
--   Last 24h:   keep ALL
--   Days 2-7:   keep one per hour
--   Days 8-30:  keep one per day
--   Days 31-365: keep one per week
--   >365 days:  keep one per month
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_world_versions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_count INTEGER;
BEGIN
  -- Tier 2: Keep hourly for days 2-7
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY world_id, date_trunc('hour', created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM public.world_versions
    WHERE created_at < now() - interval '24 hours'
      AND created_at >= now() - interval '7 days'
  )
  DELETE FROM public.world_versions
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Tier 3: Keep daily for days 8-30
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY world_id, date_trunc('day', created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM public.world_versions
    WHERE created_at < now() - interval '7 days'
      AND created_at >= now() - interval '30 days'
  )
  DELETE FROM public.world_versions
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Tier 4: Keep weekly for days 31-365
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY world_id, date_trunc('week', created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM public.world_versions
    WHERE created_at < now() - interval '30 days'
      AND created_at >= now() - interval '365 days'
  )
  DELETE FROM public.world_versions
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Tier 5: Keep monthly for >365 days
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY world_id, date_trunc('month', created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM public.world_versions
    WHERE created_at < now() - interval '365 days'
  )
  DELETE FROM public.world_versions
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  RETURN v_deleted;
END;
$$;

-- Allow service_role to call cleanup (for edge function or cron)
GRANT EXECUTE ON FUNCTION public.cleanup_world_versions() TO service_role;
