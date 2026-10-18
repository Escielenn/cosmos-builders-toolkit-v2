-- ============================================================
-- CANON FACTS (Session C2, 1.5 item 9)
--
-- Persistence for the facts that CANNOT be derived on read: prose-asserted,
-- manually entered, sim-promoted and imported. Facts projected from
-- worksheet blobs stay computed on read (src/lib/worksheet-facts.ts →
-- src/lib/writing/world-index.ts); this table is never filled from them.
-- See docs/stellarforge/02-ARCHITECTURE.md ("The five node kinds" §2) and
-- AMENDMENTS.md 2026-10-19.
--
-- All reads and writes go through src/canon/ (the facade). Nothing else in
-- the client may touch this table.
--
--   subject_id     the world_entries row the fact is about. NULL = the world
--                  itself (world.* predicates) or a subject not yet on file.
--   predicate      a name from src/canon/vocabulary.ts. Not FK-checked: the
--                  vocabulary is code, and `legacy.<key>` names are open.
--   value          FactValue JSON ({kind:'scalar', value, unit} etc.).
--   value_text     the display string, what the Studio inserts into prose.
--   confidence     'proposed' | 'canon'. 'projected' is never stored: it is
--                  the tier of a computed-on-read fact.
--   source_kind    who asserted it: tool | sim | prose | manual | import.
--   source_ref     detail for the provenance trail, e.g.
--                  {tool, worksheet_id, field} or {document_id, excerpt}.
--   superseded_at  non-NULL = retired (superseded by a newer canon fact, or
--                  retracted). Kept, not deleted, so provenance survives.
--
-- Invariant (Constitution non-negotiable): at most ONE live canon fact per
-- (world, subject, predicate). The partial unique index enforces it, so a
-- second canon write without an explicit supersede fails with 23505, which
-- the facade maps to RECORD CONFLICT rather than overwriting.
--
-- RLS mirrors world_entries: world owner full access, collaborators read,
-- editors write. Nothing granted to anon. Idempotent; re-runnable.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.world_entries(id) ON DELETE CASCADE,
  predicate TEXT NOT NULL,
  value JSONB NOT NULL,
  value_text TEXT,
  unit TEXT,
  confidence TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  asserted_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  superseded_at TIMESTAMPTZ,
  CONSTRAINT facts_confidence_check CHECK (confidence IN ('proposed', 'canon')),
  CONSTRAINT facts_source_kind_check CHECK (source_kind IN ('tool', 'sim', 'prose', 'manual', 'import')),
  CONSTRAINT facts_predicate_shape CHECK (predicate ~ '^[a-z][a-z0-9_]*(\.[A-Za-z0-9_\[\]-]+)+$')
);

-- One live canon fact per (world, subject, predicate). NULL subject is
-- folded to the nil UUID so world-level facts are unique too.
CREATE UNIQUE INDEX IF NOT EXISTS facts_one_live_canon
  ON public.facts (
    world_id,
    COALESCE(subject_id, '00000000-0000-0000-0000-000000000000'::uuid),
    predicate
  )
  WHERE confidence = 'canon' AND superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_facts_world
  ON public.facts (world_id);
CREATE INDEX IF NOT EXISTS idx_facts_world_predicate
  ON public.facts (world_id, predicate);
CREATE INDEX IF NOT EXISTS idx_facts_subject
  ON public.facts (subject_id)
  WHERE subject_id IS NOT NULL;

ALTER TABLE public.facts ENABLE ROW LEVEL SECURITY;

-- ── Policies (mirror world_entries) ────────────────────────────
-- CREATE POLICY has no IF NOT EXISTS; drop-then-create keeps this re-runnable.

DROP POLICY IF EXISTS "World owner can view facts" ON public.facts;
DROP POLICY IF EXISTS "World owner can create facts" ON public.facts;
DROP POLICY IF EXISTS "World owner can update facts" ON public.facts;
DROP POLICY IF EXISTS "World owner can delete facts" ON public.facts;
DROP POLICY IF EXISTS "Collaborators can view facts" ON public.facts;
DROP POLICY IF EXISTS "Editors can create facts" ON public.facts;
DROP POLICY IF EXISTS "Editors can update facts" ON public.facts;
DROP POLICY IF EXISTS "Editors can delete facts" ON public.facts;

CREATE POLICY "World owner can view facts"
  ON public.facts FOR SELECT TO authenticated
  USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can create facts"
  ON public.facts FOR INSERT TO authenticated
  WITH CHECK (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can update facts"
  ON public.facts FOR UPDATE TO authenticated
  USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()))
  WITH CHECK (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can delete facts"
  ON public.facts FOR DELETE TO authenticated
  USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid()));

CREATE POLICY "Collaborators can view facts"
  ON public.facts FOR SELECT TO authenticated
  USING (world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid()));

CREATE POLICY "Editors can create facts"
  ON public.facts FOR INSERT TO authenticated
  WITH CHECK (world_id IN (
    SELECT world_id FROM public.world_collaborators
    WHERE user_id = auth.uid() AND role = 'editor'
  ));

CREATE POLICY "Editors can update facts"
  ON public.facts FOR UPDATE TO authenticated
  USING (world_id IN (
    SELECT world_id FROM public.world_collaborators
    WHERE user_id = auth.uid() AND role = 'editor'
  ))
  WITH CHECK (world_id IN (
    SELECT world_id FROM public.world_collaborators
    WHERE user_id = auth.uid() AND role = 'editor'
  ));

CREATE POLICY "Editors can delete facts"
  ON public.facts FOR DELETE TO authenticated
  USING (world_id IN (
    SELECT world_id FROM public.world_collaborators
    WHERE user_id = auth.uid() AND role = 'editor'
  ));

REVOKE ALL ON public.facts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facts TO authenticated;

-- ── updated_at ─────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_facts_updated_at ON public.facts;
CREATE TRIGGER update_facts_updated_at
  BEFORE UPDATE ON public.facts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
