-- ============================================================
-- Manuscript layer for the Studio editor (Implementation Guide §4)
-- SF-II-compliant: writing_entries IS the scene store (no parallel
-- content table). Additive only.
-- ============================================================

-- Scene fields on the existing writing model
alter table public.writing_entries
  add column if not exists synopsis text,
  add column if not exists status text not null default 'draft1',
  add column if not exists pov_entity_id uuid references public.entities(id) on delete set null,
  add column if not exists location_entity_id uuid references public.entities(id) on delete set null,
  add column if not exists time_label text,
  add column if not exists target_words integer;

alter table public.writing_entries
  add constraint writing_entries_status_check
  check (status in ('todo','draft1','draft2','final'));

-- Binder tree: Books → Parts → Chapters → Scenes (+ folders/research/trash)
create table if not exists public.binder_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  parent_id uuid references public.binder_nodes(id) on delete cascade,
  kind text not null check (kind in ('book','part','chapter','scene','folder','research','trash')),
  title text not null default 'Untitled',
  entry_id uuid references public.writing_entries(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists binder_nodes_world_idx on public.binder_nodes (world_id);
create index if not exists binder_nodes_parent_idx on public.binder_nodes (parent_id);

alter table public.binder_nodes enable row level security;
create policy binder_nodes_owner_select on public.binder_nodes
  for select using ((select auth.uid()) = user_id);
create policy binder_nodes_owner_insert on public.binder_nodes
  for insert with check ((select auth.uid()) = user_id);
create policy binder_nodes_owner_update on public.binder_nodes
  for update using ((select auth.uid()) = user_id);
create policy binder_nodes_owner_delete on public.binder_nodes
  for delete using ((select auth.uid()) = user_id);

-- Pin bar: entities pinned to a scene
create table if not exists public.scene_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.writing_entries(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (entry_id, entity_id)
);
create index if not exists scene_pins_entry_idx on public.scene_pins (entry_id);

alter table public.scene_pins enable row level security;
create policy scene_pins_owner_select on public.scene_pins
  for select using ((select auth.uid()) = user_id);
create policy scene_pins_owner_insert on public.scene_pins
  for insert with check ((select auth.uid()) = user_id);
create policy scene_pins_owner_delete on public.scene_pins
  for delete using ((select auth.uid()) = user_id);

-- Daily word rollup: real streaks + ledgers for Studio
create table if not exists public.writing_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  words integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.writing_sessions enable row level security;
create policy writing_sessions_owner_select on public.writing_sessions
  for select using ((select auth.uid()) = user_id);
create policy writing_sessions_owner_insert on public.writing_sessions
  for insert with check ((select auth.uid()) = user_id);
create policy writing_sessions_owner_update on public.writing_sessions
  for update using ((select auth.uid()) = user_id);

comment on table public.binder_nodes is 'Manuscript binder tree (Studio editor). Scene nodes reference writing_entries — the single writing model (SF-II: no parallel content tables).';
