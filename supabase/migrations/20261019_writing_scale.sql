-- ============================================================
-- WRITING AT SCALE (1.5 items 15 and 18)
--
-- 1. world_entries.word_count: stored, computed by trigger from the
--    stripped HTML, so the binder list can select metadata only and still
--    show word counts (Binder, Board, Outline, project target). Same rule
--    as countWords() in src/lib/text.ts: tags become spaces, &nbsp; a
--    space, then whitespace-separated tokens.
-- 2. world_entries.content_version: bumped by trigger every time content
--    actually changes, and nothing else. Saves send the version they were
--    made on (WHERE content_version = base); 0 rows updated means another
--    writer saved first, and the client offers KEEP MINE / LOAD THEIRS /
--    COMPARE instead of overwriting. A version, not updated_at, because
--    metadata, rename, move and reorder all bump updated_at and would
--    raise false conflicts. Clients cannot set either column: the trigger
--    owns them.
-- 3. The world_entries -> worlds touch trigger (20260222) fired on every
--    autosave. It stays (maybe_snapshot_world reads worlds.updated_at to
--    decide whether anything changed since the last snapshot), but:
--      - on world_entries it only fires when a real column changed, not
--        on an update that changes nothing but updated_at;
--      - it writes the worlds row at most once a minute, except the first
--        change after a snapshot, which always marks the world dirty so a
--        snapshot is never skipped.
--
-- Idempotent. Not applied by the author; the lead applies it.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Word count from HTML (mirrors src/lib/text.ts countWords)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.html_word_count(p_html text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT CASE
    WHEN s.t = '' THEN 0
    ELSE coalesce(array_length(regexp_split_to_array(s.t, '\s+'), 1), 0)
  END
  FROM (
    SELECT regexp_replace(
      replace(regexp_replace(coalesce(p_html, ''), '<[^>]+>', ' ', 'g'), '&nbsp;', ' '),
      '^\s+|\s+$', '', 'g'
    ) AS t
  ) s;
$$;

COMMENT ON FUNCTION public.html_word_count(text) IS
  'Words in an HTML string: tags to spaces, &nbsp; to a space, whitespace-separated tokens. Mirrors countWords() in src/lib/text.ts.';


-- ------------------------------------------------------------
-- 2. Columns
-- ------------------------------------------------------------
ALTER TABLE public.world_entries
  ADD COLUMN IF NOT EXISTS word_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.world_entries
  ADD COLUMN IF NOT EXISTS content_version integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.world_entries.word_count IS
  'Words in content, kept by trigger world_entries_content_derived. Read by the binder list instead of content.';
COMMENT ON COLUMN public.world_entries.content_version IS
  'Incremented by trigger whenever content changes. Saves send the version they were made on (optimistic concurrency).';


-- ------------------------------------------------------------
-- 3. Backfill word_count. User triggers are off for the backfill so it
--    does not bump every updated_at (binder order, device-journal bases)
--    or touch every world.
-- ------------------------------------------------------------
ALTER TABLE public.world_entries DISABLE TRIGGER USER;

UPDATE public.world_entries
SET word_count = public.html_word_count(content)
WHERE content IS NOT NULL
  AND word_count IS DISTINCT FROM public.html_word_count(content);

ALTER TABLE public.world_entries ENABLE TRIGGER USER;


-- ------------------------------------------------------------
-- 4. Trigger: derived columns are always right, never client-set
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.world_entries_content_derived()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.word_count := public.html_word_count(NEW.content);
    NEW.content_version := 0;
  ELSIF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.word_count := public.html_word_count(NEW.content);
    NEW.content_version := OLD.content_version + 1;
  ELSE
    NEW.word_count := OLD.word_count;
    NEW.content_version := OLD.content_version;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS world_entries_content_derived ON public.world_entries;
CREATE TRIGGER world_entries_content_derived
  BEFORE INSERT OR UPDATE ON public.world_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.world_entries_content_derived();


-- ------------------------------------------------------------
-- 5. Cheaper world touch
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_world_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- At most once a minute, except the first change after a snapshot, which
  -- always lands (maybe_snapshot_world skips when updated_at <= snapshot_at).
  UPDATE public.worlds
  SET updated_at = now()
  WHERE id = NEW.world_id
    AND (
      updated_at < now() - interval '60 seconds'
      OR updated_at <= coalesce(snapshot_at, '-infinity'::timestamptz)
    );
  RETURN NEW;
END;
$$;

-- world_entries: insert always counts; an update only when a real column
-- changed (update_world_entries_updated_at bumps updated_at on every update,
-- so it is left out of the comparison).
DROP TRIGGER IF EXISTS trg_world_entries_touch_world ON public.world_entries;
CREATE TRIGGER trg_world_entries_touch_world
  AFTER INSERT ON public.world_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_world_updated_at();

DROP TRIGGER IF EXISTS trg_world_entries_touch_world_update ON public.world_entries;
CREATE TRIGGER trg_world_entries_touch_world_update
  AFTER UPDATE ON public.world_entries
  FOR EACH ROW
  WHEN (
    OLD.content IS DISTINCT FROM NEW.content
    OR OLD.title IS DISTINCT FROM NEW.title
    OR OLD.metadata IS DISTINCT FROM NEW.metadata
    OR OLD.parent_id IS DISTINCT FROM NEW.parent_id
    OR OLD.sort_order IS DISTINCT FROM NEW.sort_order
    OR OLD.entry_type IS DISTINCT FROM NEW.entry_type
    OR OLD.trashed_at IS DISTINCT FROM NEW.trashed_at
    OR OLD.tags IS DISTINCT FROM NEW.tags
    OR OLD.icon IS DISTINCT FROM NEW.icon
    OR OLD.color IS DISTINCT FROM NEW.color
    OR OLD.layer IS DISTINCT FROM NEW.layer
    OR OLD.cover_image_url IS DISTINCT FROM NEW.cover_image_url
  )
  EXECUTE FUNCTION public.touch_world_updated_at();
