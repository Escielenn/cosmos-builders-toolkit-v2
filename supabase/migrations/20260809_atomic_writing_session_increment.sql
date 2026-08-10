-- Atomic daily word increment for the writing session ledger.
--
-- Why: rollWordSession (src/hooks/use-write-doc.ts) does a read-modify-write —
-- SELECT words, then upsert (words + delta). Two autosaves resolving
-- concurrently, or two open tabs, both read the same value and the second
-- overwrites the first, so daily word totals silently under-count.
--
-- PREREQUISITE CONFIRMED. writing_sessions is declared with
--   primary key (user_id, day)
-- in 20260710_add_manuscript_layer.sql:67-73, and a composite PK is a unique
-- constraint, so the ON CONFLICT target below is valid. The column list there
-- (user_id, day, words, updated_at) also matches what this function writes.
--
-- This migration adds a FUNCTION only; it creates no table and alters no
-- column, so it does not touch the world_entries/entities merge surface and
-- does not need the StellarForge II Phase-0 sign-off that table DDL would.
--
-- Safe to apply at any time: the client calls this RPC and falls back to the
-- old read-modify-write if the function is absent, so applying it upgrades
-- behaviour without a coordinated deploy.

create or replace function public.increment_writing_session(
  p_user_id uuid,
  p_day date,
  p_delta int
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into writing_sessions (user_id, day, words, updated_at)
  values (p_user_id, p_day, greatest(p_delta, 0), now())
  on conflict (user_id, day)
  do update set
    words = writing_sessions.words + greatest(excluded.words, 0),
    updated_at = now();
$$;

revoke all on function public.increment_writing_session(uuid, date, int) from public;
grant execute on function public.increment_writing_session(uuid, date, int) to authenticated;
