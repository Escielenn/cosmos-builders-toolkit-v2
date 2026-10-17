-- ============================================================
-- Contact form throttle
-- 2026-10-17
-- ============================================================
-- submit-contact sent a confirmation email to whatever address it was given,
-- with no limit, so it could be used to send mail to strangers from our
-- domain. The function now records each submission here (hashed IP and
-- recipient, never the raw values) and enforces:
--   5 submissions per IP per hour
--   2 confirmation emails per recipient per 24 hours
-- Service role only.

CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  ip_hash    TEXT NOT NULL,
  email_hash TEXT,
  confirmed  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip    ON public.contact_rate_limits (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_email ON public.contact_rate_limits (email_hash, created_at) WHERE confirmed;

ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_rate_limits FROM anon, authenticated;

COMMENT ON TABLE public.contact_rate_limits IS
  'Throttle log for the submit-contact edge function (hashed IP and recipient only). RLS on with no policies is intentional: service role only. Rows older than 2 days carry no meaning and may be deleted.';
REVOKE ALL ON SEQUENCE public.contact_rate_limits_id_seq FROM anon, authenticated;
