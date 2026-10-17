-- ============================================================
-- Stripe webhook idempotency log + protect profiles.stripe_customer_id
-- 2026-10-17
-- ============================================================

-- ── 1. Processed-event log ─────────────────────────────────
-- The stripe-webhook function records each event id after handling it and
-- skips ids already present. Service role only: RLS on, no policies.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id           TEXT PRIMARY KEY,           -- Stripe event id (evt_...)
  type         TEXT NOT NULL,
  livemode     BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_events FROM anon, authenticated;

COMMENT ON TABLE public.stripe_events IS
  'Stripe webhook events already processed (idempotency). Written by the stripe-webhook edge function with the service role. RLS on with no policies is intentional: no client access.';


-- ── 2. stripe_customer_id is written by the server only ────
-- The profiles UPDATE policy lets a user update their own row with no column
-- limit, so a user could set stripe_customer_id to any value.
-- create-portal-session opens the billing portal for whatever customer id the
-- profile holds. The UNIQUE constraint blocks taking an id another profile
-- already holds, but the column should simply not be client-writable.
-- Same pattern as protect_admin_flag: a client change is silently reverted,
-- so a profile save that sends the whole row keeps working.

CREATE OR REPLACE FUNCTION public.prevent_client_stripe_customer_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     AND coalesce(auth.role(), '') IN ('anon', 'authenticated') THEN
    NEW.stripe_customer_id := OLD.stripe_customer_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_client_stripe_customer_change() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER protect_stripe_customer_id
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_stripe_customer_change();
