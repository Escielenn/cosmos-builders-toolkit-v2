-- ============================================================
-- Document the tables that are service-role only by design
-- 2026-10-17
-- ============================================================
-- The Supabase advisor flags these as "RLS enabled, no policy". That is the
-- intended state: RLS on with no policies means no client role can read or
-- write them; only the service role (edge functions, migrations) can.
-- Comments only; no behavior change.

COMMENT ON TABLE public.waitlist IS
  'Early-access waitlist. Written only by the waitlist-confirmation edge function (service role). RLS on with no policies is intentional: no client access.';
COMMENT ON TABLE public.admin_todos IS
  'Admin to-do list. Reached only through admin_* SECURITY DEFINER RPCs that check is_admin. RLS on with no policies is intentional: no direct client access.';
COMMENT ON TABLE public.entity_fold_map IS
  'F3 one-graph migration bookkeeping: legacy entity id -> world_entries id. Written by migration only. RLS on with no policies is intentional.';
COMMENT ON TABLE public.f3_fold_report IS
  'F3 one-graph migration report. Written by migration only. RLS on with no policies is intentional.';
