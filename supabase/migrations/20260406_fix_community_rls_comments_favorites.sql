-- ============================================================
-- FIX: Restrict comment and favorite creation to community/public worlds
--
-- Problems found in 20260405_add_community_worlds.sql:
--   1. "Users can create comments" INSERT policy only checked user_id,
--      allowing authenticated users to insert comments on PRIVATE worlds.
--   2. "Users can create own favorites" INSERT policy only checked user_id,
--      allowing authenticated users to favorite PRIVATE worlds.
--
-- This migration replaces both policies with world-visibility checks.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. Fix comment INSERT policy
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can create comments" ON public.world_comments;

CREATE POLICY "Users can create comments on visible worlds"
  ON public.world_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND world_id IN (
      SELECT id FROM public.worlds
      WHERE visibility IN ('community', 'public')
        AND archived_at IS NULL
    )
  );


-- ────────────────────────────────────────────────────────────
-- 2. Fix favorite INSERT policy
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can create own favorites" ON public.world_favorites;

CREATE POLICY "Users can favorite visible worlds"
  ON public.world_favorites FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND world_id IN (
      SELECT id FROM public.worlds
      WHERE visibility IN ('community', 'public')
        AND archived_at IS NULL
    )
  );
