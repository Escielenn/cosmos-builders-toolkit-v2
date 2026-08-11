-- Atomic daily word increment for the writing session ledger.
--
-- APPLIED to project sgoefchwjumzgfupqdzt (StellarForge) on 2026-08-10.
--
-- Why: rollWordSession (src/hooks/use-write-doc.ts) did a read-modify-write --
-- SELECT words, then upsert (words + delta). Two autosaves resolving
-- concurrently, or two open tabs, both read the same value and the second
-- overwrote the first, silently under-counting the day.
--
-- Prerequisite verified against the live database:
--   writing_sessions has PRIMARY KEY (user_id, day)
-- which is the unique constraint ON CONFLICT needs. Columns are
-- (user_id uuid, day date, words int default 0, updated_at timestamptz default now()).
--
-- Function only: creates no table and alters no column, so it sits outside the
-- StellarForge II Phase-0 table-DDL gate.
--
-- SECURITY NOTE. A first version used "revoke all ... from public", which does
-- NOT remove Supabase's default-privilege grants to anon/authenticated on
-- public-schema functions -- the ACL came back as {anon=X, authenticated=X},
-- meaning an unauthenticated caller could invoke this SECURITY DEFINER function
-- and increment an arbitrary user's row, bypassing RLS. Two defences now:
--   1. the function derives the caller from auth.uid() and refuses to write any
--      other user's row, so it is safe even if EXECUTE is granted broadly;
--   2. EXECUTE is revoked from anon explicitly.
-- p_user_id stays in the signature so the deployed client keeps working; it is
-- validated, not trusted.
--
-- The client (rollWordSession) calls this RPC and falls back to the old
-- read-modify-write if the function is missing, so this needed no coordinated
-- deploy.

create or replace function public.increment_writing_session(
  p_user_id uuid,
  p_day date,
  p_delta int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'increment_writing_session: authentication required';
  end if;

  if p_user_id is distinct from v_uid then
    raise exception 'increment_writing_session: cannot write another user''s session';
  end if;

  insert into writing_sessions (user_id, day, words, updated_at)
  values (v_uid, p_day, greatest(coalesce(p_delta, 0), 0), now())
  on conflict (user_id, day)
  do update set
    words = writing_sessions.words + greatest(coalesce(excluded.words, 0), 0),
    updated_at = now();
end;
$$;

revoke execute on function public.increment_writing_session(uuid, date, int) from anon;
revoke execute on function public.increment_writing_session(uuid, date, int) from public;
grant execute on function public.increment_writing_session(uuid, date, int) to authenticated;

-- Post-apply verification (run to confirm):
--   select p.proacl::text,
--          has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'increment_writing_session';
-- Expected: {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
--           anon_can_execute = false
