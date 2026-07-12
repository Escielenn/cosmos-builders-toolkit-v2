-- Applied to production 2026-07-10. Soft-delete (trash) for manuscript docs.
alter table public.world_entries add column if not exists trashed_at timestamptz;
create index if not exists idx_world_entries_trashed on public.world_entries (trashed_at)
  where trashed_at is not null;
comment on column public.world_entries.trashed_at is
  'Soft-delete timestamp for the Studio trash. NULL = live. Purged ~90 days after set.';
