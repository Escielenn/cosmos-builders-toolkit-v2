-- ============================================================
-- Tier 0 security (1.5 programme, 2026-10-18)
--
-- 1. Email enumeration: lookup_user_by_email let ANY signed-in user learn
--    whether an address has an account (and its display name and avatar).
--    Its one caller only needs "is this email already a collaborator on MY
--    world?". Replace it with a world-scoped check that only the world's
--    owner can run, and revoke the old function from clients.
--
-- 2. contact_submissions / support_tickets were created in the dashboard,
--    so the repo could not show their RLS. Record their DDL here
--    (CREATE IF NOT EXISTS: a no-op on production, truth for fresh
--    environments). Live state verified 2026-10-18: RLS on, insert-only for
--    anon/authenticated with non-empty checks, select own rows only.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_world_collaborator_email(p_world_id uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  -- Only the world's owner may ask, and only about their own world.
  IF NOT EXISTS (SELECT 1 FROM public.worlds WHERE id = p_world_id AND user_id = auth.uid()) THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.world_collaborators wc
    JOIN auth.users u ON u.id = wc.user_id
    WHERE wc.world_id = p_world_id
      AND lower(u.email) = lower(p_email)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_world_collaborator_email(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_world_collaborator_email(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text) FROM PUBLIC, anon, authenticated;

-- ── Dashboard-created tables, recorded ─────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  admin_notes text DEFAULT ''
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  subject text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  admin_notes text DEFAULT ''
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Anyone can create contact submissions') THEN
    CREATE POLICY "Anyone can create contact submissions" ON public.contact_submissions
      FOR INSERT TO anon, authenticated
      WITH CHECK (name IS NOT NULL AND name <> '' AND email IS NOT NULL AND email <> '' AND message IS NOT NULL AND message <> '');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Users can view own contact submissions') THEN
    CREATE POLICY "Users can view own contact submissions" ON public.contact_submissions
      FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='Anyone can create support tickets') THEN
    CREATE POLICY "Anyone can create support tickets" ON public.support_tickets
      FOR INSERT TO anon, authenticated
      WITH CHECK (name IS NOT NULL AND name <> '' AND email IS NOT NULL AND email <> '' AND subject IS NOT NULL AND subject <> '' AND message IS NOT NULL AND message <> '');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='Users can view own support tickets') THEN
    CREATE POLICY "Users can view own support tickets" ON public.support_tickets
      FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

-- ── Chronicle FK indexes flagged by the performance advisor ────
CREATE INDEX IF NOT EXISTS idx_chronicle_branches_divergence_event ON public.chronicle_branches(divergence_event_id);
CREATE INDEX IF NOT EXISTS idx_chronicle_jumps_from_branch ON public.chronicle_jumps(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_chronicle_jumps_to_branch ON public.chronicle_jumps(to_branch_id);
