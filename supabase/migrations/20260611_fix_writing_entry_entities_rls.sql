-- ============================================================
-- SF2 Phase 0 — Bug fix #1: writing_entry_entities
-- Status: WRITTEN FOR REVIEW — NOT YET APPLIED TO PRODUCTION
-- ============================================================
--
-- Two problems with this table (created 20260402):
--
-- 1. MISNAMED FK (documented here, fixed later):
--    `entity_id` REFERENCES world_entries(id), not entities(id).
--    The live client code (src/hooks/use-writing-entity-links.ts)
--    sources its IDs from world_entries, so the FK target MATCHES
--    the data being written — referential integrity is intact and
--    re-pointing the FK now would break the live linking feature.
--    The re-point to the canonical entity model happens during the
--    StellarForge II world_entries→entities merge, via the
--    sf2_provenance map (see STELLARFORGE_II_IMPLEMENTATION_PLAN_v2).
--    This migration only documents the situation in the schema.
--
-- 2. OVERLY PERMISSIVE RLS (fixed here, now):
--    The original policy was `USING (auth.uid() IS NOT NULL)` for
--    ALL commands — any authenticated user could read, create, and
--    delete ANY user's writing↔entity links. The comment in the
--    original migration claimed "RLS on writing_entries already
--    gates access", but RLS on writing_entries does not constrain
--    rows in THIS table. Replace with owner-scoped policies.
--    Pattern follows 20260215_fix_rls_initplan: wrap auth.uid()
--    in a scalar subquery so it is evaluated once per statement.
-- ============================================================

-- Document the FK's true target so nobody "fixes" it prematurely.
COMMENT ON COLUMN public.writing_entry_entities.entity_id IS
  'NOTE: references world_entries(id), not entities(id), despite the name. '
  'Live client code writes world_entries IDs, so data and FK agree. '
  'Re-pointed to the canonical entity model during the SF2 merge.';

-- Replace the permissive policy with owner-scoped access:
-- a user may see/manage a link iff they own the writing entry it belongs to.
DROP POLICY IF EXISTS "Authenticated users manage writing entity links"
  ON public.writing_entry_entities;

CREATE POLICY "Users view links for their own writing entries"
  ON public.writing_entry_entities FOR SELECT TO authenticated
  USING (
    writing_entry_id IN (
      SELECT id FROM public.writing_entries
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users insert links for their own writing entries"
  ON public.writing_entry_entities FOR INSERT TO authenticated
  WITH CHECK (
    writing_entry_id IN (
      SELECT id FROM public.writing_entries
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users delete links for their own writing entries"
  ON public.writing_entry_entities FOR DELETE TO authenticated
  USING (
    writing_entry_id IN (
      SELECT id FROM public.writing_entries
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- No UPDATE policy: links are create/delete only (matches client usage).

-- Supporting index for the policy subquery path and the hook's
-- .eq("writing_entry_id", ...) queries (table previously relied on
-- the UNIQUE(writing_entry_id, entity_id) index, which also covers
-- this; kept explicit for clarity if that constraint ever changes).
CREATE INDEX IF NOT EXISTS idx_writing_entry_entities_entry
  ON public.writing_entry_entities(writing_entry_id);
