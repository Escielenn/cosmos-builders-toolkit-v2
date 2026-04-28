-- ============================================================
-- FIX: world_invites SELECT policy 403s for authenticated role
--
-- The "Invited users can view own invites" policy reads from
-- auth.users:
--
--   USING (
--     lower(invited_email) = lower(
--       (SELECT email FROM auth.users WHERE id = auth.uid())
--     )
--   );
--
-- The `authenticated` Postgres role lacks SELECT on auth.users,
-- so the subquery errors during RLS evaluation and PostgREST
-- returns 403 for the whole request — even when the user isn't
-- actually checking against this policy (e.g. the badge
-- evaluator queries world_invites filtered by invited_by, which
-- is authorized by the OTHER policy "World owner can view
-- invites", but RLS still tries to evaluate every applicable
-- policy and fails on this one).
--
-- Fix: replace the auth.users subquery with the JWT email claim
-- via Supabase's auth.jwt() function. No table read required.
-- ============================================================

DROP POLICY IF EXISTS "Invited users can view own invites" ON public.world_invites;

CREATE POLICY "Invited users can view own invites"
  ON public.world_invites FOR SELECT
  TO authenticated
  USING (
    lower(invited_email) = lower((auth.jwt() ->> 'email'))
  );
