-- Atomic daily word increment for the writing session ledger.
--
-- Why: rollWordSession (src/hooks/use-write-doc.ts) does a read-modify-write —
-- SELECT words, then upsert (words + delta). Two autosaves resolving
-- concurrently, or two open tabs, both read the same value and the second
-- overwrites the first, so daily word totals silently under-count.
--
-- NOT YET APPLIED. Two things must be confirmed by someone with database
-- access before this ships:
--
--   1. A unique constraint on (user_id, day) must already exist, because the
--      ON CONFLICT target below depends on it. Check with:
--        select conname, pg_get_constraintdef(oid)
--        from pg_constraint
--        where conrelid = 'writing_sessions'::regclass and contype = 'u';
--      If it is absent, STOP: adding it is DDL on a table and falls under the
--      StellarForge II Phase-0 gate ("no DDL ships before sign-off",
--      STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md §B0).
--
--   2. Confirm the column list matches production (user_id, day, words,
--      updated_at) — the client currently also writes updated_at.
--
-- This migration adds a FUNCTION only; it creates no table and alters no
-- column, so it does not touch the world_entries/entities merge surface.

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
