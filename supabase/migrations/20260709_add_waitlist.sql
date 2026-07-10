-- ============================================================
-- Waitlist for the Aug 11, 2026 Early Access launch
-- (Cowork Implementation Guide §2 — landing page backend)
--
-- Access model: NO anon/authenticated policies on purpose.
-- All writes go through the `waitlist-confirmation` edge function
-- (service role), which validates + dedupes + sends the
-- confirmation email. RLS is enabled with no policies, so the
-- anon key can neither read nor write this table directly.
-- ============================================================

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'early-landing',
  confirmation_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Case-insensitive dedupe
create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email));

-- Sanity check on shape (real validation happens in the edge function)
alter table public.waitlist
  add constraint waitlist_email_format
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table public.waitlist enable row level security;

comment on table public.waitlist is
  'Early-access launch waitlist. Writes only via waitlist-confirmation edge function (service role). No client policies by design.';
