-- ============================================================
-- CHRONICLE BRANCHES + JUMPS (time-travel timelines)
--
-- Branching lives on the Chronicle (05-NEW-SYSTEMS B2, Law V), not in a
-- standalone tool (Law VII). Three additions:
--
--   chronicle_branches     alternate timelines. parent_branch_id NULL = the
--                          branch forks from the prime timeline. A branch
--                          exists from divergence_sort_value onward.
--   chronicle_events       + branch_id. NULL = prime timeline, so every
--                          existing event stays exactly where it was.
--   chronicle_jumps        a traveller moving from (branch, time) to
--                          (branch, time), with the traveller's own elapsed
--                          (proper) time kept as free text.
--
-- Idempotent. RLS mirrors chronicle_events: world owner full access,
-- collaborators read, editors write. Nothing granted to anon.
--
-- Deleting a branch returns its events and jumps to the prime timeline
-- (ON DELETE SET NULL) rather than destroying them; the UI states the count
-- before it deletes. fork_world() and compile_world_snapshot() do not copy
-- branches or jumps yet (forked events land on the prime timeline); that is
-- a follow-up.
-- ============================================================

-- ── Branches ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chronicle_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- A named-hue token key ('teal', 'amber', 'stellar', ...), never a hex.
  color TEXT NOT NULL DEFAULT 'teal',
  parent_branch_id UUID REFERENCES public.chronicle_branches(id) ON DELETE SET NULL,
  divergence_sort_value NUMERIC,
  divergence_event_id UUID REFERENCES public.chronicle_events(id) ON DELETE SET NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chronicle_branches_not_own_parent CHECK (parent_branch_id IS DISTINCT FROM id),
  CONSTRAINT chronicle_branches_color_key CHECK (color ~ '^[a-z]+$')
);

CREATE INDEX IF NOT EXISTS idx_chronicle_branches_world
  ON public.chronicle_branches(world_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_chronicle_branches_parent
  ON public.chronicle_branches(parent_branch_id);

ALTER TABLE public.chronicle_branches ENABLE ROW LEVEL SECURITY;

-- ── Events gain a branch ───────────────────────────────────────

ALTER TABLE public.chronicle_events
  ADD COLUMN IF NOT EXISTS branch_id UUID
  REFERENCES public.chronicle_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chronicle_events_branch
  ON public.chronicle_events(branch_id);

-- ── Jumps ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chronicle_jumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  traveler_entry_id UUID REFERENCES public.world_entries(id) ON DELETE SET NULL,
  traveler_label TEXT NOT NULL DEFAULT '',
  from_branch_id UUID REFERENCES public.chronicle_branches(id) ON DELETE SET NULL,
  from_sort_value NUMERIC NOT NULL DEFAULT 0,
  to_branch_id UUID REFERENCES public.chronicle_branches(id) ON DELETE SET NULL,
  to_sort_value NUMERIC NOT NULL DEFAULT 0,
  proper_duration TEXT,
  method TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chronicle_jumps_world
  ON public.chronicle_jumps(world_id);
CREATE INDEX IF NOT EXISTS idx_chronicle_jumps_traveler
  ON public.chronicle_jumps(traveler_entry_id);

ALTER TABLE public.chronicle_jumps ENABLE ROW LEVEL SECURITY;

-- ── Policies (mirror chronicle_events) ─────────────────────────
-- CREATE POLICY has no IF NOT EXISTS; drop-then-create keeps this re-runnable.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['chronicle_branches', 'chronicle_jumps'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "World owner can view %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "World owner can create %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "World owner can update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "World owner can delete %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Collaborators can view %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Editors can create %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Editors can update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Editors can delete %1$s" ON public.%1$I', t);

    EXECUTE format($p$
      CREATE POLICY "World owner can view %1$s"
        ON public.%1$I FOR SELECT TO authenticated
        USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()))
    $p$, t);
    EXECUTE format($p$
      CREATE POLICY "World owner can create %1$s"
        ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()))
    $p$, t);
    EXECUTE format($p$
      CREATE POLICY "World owner can update %1$s"
        ON public.%1$I FOR UPDATE TO authenticated
        USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()))
        WITH CHECK (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()))
    $p$, t);
    EXECUTE format($p$
      CREATE POLICY "World owner can delete %1$s"
        ON public.%1$I FOR DELETE TO authenticated
        USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()))
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "Collaborators can view %1$s"
        ON public.%1$I FOR SELECT TO authenticated
        USING (world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid()))
    $p$, t);
    EXECUTE format($p$
      CREATE POLICY "Editors can create %1$s"
        ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (world_id IN (
          SELECT world_id FROM public.world_collaborators
          WHERE user_id = auth.uid() AND role = 'editor'))
    $p$, t);
    EXECUTE format($p$
      CREATE POLICY "Editors can update %1$s"
        ON public.%1$I FOR UPDATE TO authenticated
        USING (world_id IN (
          SELECT world_id FROM public.world_collaborators
          WHERE user_id = auth.uid() AND role = 'editor'))
        WITH CHECK (world_id IN (
          SELECT world_id FROM public.world_collaborators
          WHERE user_id = auth.uid() AND role = 'editor'))
    $p$, t);
    EXECUTE format($p$
      CREATE POLICY "Editors can delete %1$s"
        ON public.%1$I FOR DELETE TO authenticated
        USING (world_id IN (
          SELECT world_id FROM public.world_collaborators
          WHERE user_id = auth.uid() AND role = 'editor'))
    $p$, t);
  END LOOP;
END
$$;

-- ── updated_at triggers ────────────────────────────────────────

DROP TRIGGER IF EXISTS update_chronicle_branches_updated_at ON public.chronicle_branches;
CREATE TRIGGER update_chronicle_branches_updated_at
  BEFORE UPDATE ON public.chronicle_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chronicle_jumps_updated_at ON public.chronicle_jumps;
CREATE TRIGGER update_chronicle_jumps_updated_at
  BEFORE UPDATE ON public.chronicle_jumps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
