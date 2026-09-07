-- ============================================================================
-- F3 · ONE GRAPH — fold `entities` into `world_entries`
--
-- docs/stellarforge/F3-ONE-GRAPH-PROPOSAL.md, decided 2026-09-06:
--   fold direction   entities → world_entries
--   collision policy keep the world_entries row, re-attach the entities row's
--                    edges to it, print every collision
--   renderer         WorldConnectionsGraph (app-side, not this file)
--
-- WHY: AMENDMENTS 2026-09-03 recorded two entity tables. `world_entries` is
-- where the facts are (entity_worksheets, chronicle_events.linked_entry_id,
-- writing_entry_entities). `entities` is where the good typed-edge vocabulary
-- is. This migration moves the vocabulary to the facts and retires the second
-- table. Constitution: Forbidden Pattern "Parallel Truth".
--
-- ON MATCHING BY NAME: the house rule is "ids are the only identity". The two
-- tables share no id, so a fold has no id to join on — that IS the finding.
-- The (world_id, entry_type, title) match below is therefore a one-time
-- migration heuristic, not a runtime one, and every match it makes is written
-- to public.f3_fold_report for a human to read. Nothing in the application
-- resolves an entity by name, before or after this runs.
--
-- SAFETY: forward-only, re-runnable (every step is guarded), and additive —
-- no row in `entities` or `entity_connections` is modified or deleted. Those
-- two tables are left in place, read-only, for one release; a later migration
-- drops them. public.entity_fold_map is the permanent legacy-id → entry-id
-- record, so an old id found in a URL or client storage still resolves.
--
-- NOT APPLIED to the live project. Read the report, then apply.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · entry_type gains the five entity kinds that only `entities` carried
--     (star, moon, event, concept, religion). Nothing is lost in the fold.
-- ---------------------------------------------------------------------------

-- Added NOT VALID, then validated in a guarded block below: a live row
-- carrying an entry_type nobody wrote down must not abort the whole fold.
-- NOT VALID still constrains every new row, which is what the fold needs.
alter table public.world_entries
  drop constraint if exists world_entries_entry_type_check;

alter table public.world_entries add constraint world_entries_entry_type_check
  check (entry_type in (
    -- Original types
    'note', 'milestone', 'decision', 'reference', 'lore',
    -- Writing space types
    'document', 'folder',
    -- Worldbuilding entity types
    'planet', 'star_system', 'species', 'faction', 'character',
    'technology', 'location', 'artifact', 'vessel', 'language',
    'mythology', 'custom',
    -- F3: entity kinds folded in from public.entities
    'star', 'moon', 'event', 'concept', 'religion',
    -- Tool-specific output types
    'chain_reaction', 'habitable_zone', 'axiom', 'gravity_profile',
    'sensory_system', 'interaction_matrix', 'government',
    'expansion_model', 'propulsion', 'time_dilation', 'gravity_sim',
    'timeline', 'signal_profile'
  )) not valid;

do $$
declare r record;
begin
  begin
    alter table public.world_entries validate constraint world_entries_entry_type_check;
    raise notice 'F3: world_entries.entry_type constraint validated against existing rows.';
  exception when check_violation then
    raise notice 'F3: entry_type constraint left NOT VALID — existing rows carry types outside the list:';
    for r in
      select entry_type, count(*) as n
      from public.world_entries
      where entry_type not in (
        'note','milestone','decision','reference','lore','document','folder',
        'planet','star_system','species','faction','character','technology',
        'location','artifact','vessel','language','mythology','custom',
        'star','moon','event','concept','religion',
        'chain_reaction','habitable_zone','axiom','gravity_profile',
        'sensory_system','interaction_matrix','government','expansion_model',
        'propulsion','time_dilation','gravity_sim','timeline','signal_profile')
      group by entry_type order by n desc
    loop
      raise notice '  entry_type "%" on % row(s)', r.entry_type, r.n;
    end loop;
  end;
end $$;


-- ---------------------------------------------------------------------------
-- 2 · world_connections becomes the typed edge table
--     (every column below already existed on entity_connections)
-- ---------------------------------------------------------------------------

alter table public.world_connections
  add column if not exists relationship_label text,
  add column if not exists cascade_stage      text,
  add column if not exists bidirectional      boolean not null default false,
  add column if not exists strength           integer,
  add column if not exists status             text default 'active',
  add column if not exists time_start         text,
  add column if not exists time_end           text,
  add column if not exists notes              text,
  add column if not exists legacy_entity_connection_id uuid;

-- Re-runnability: at most one world_connections row per folded edge.
create unique index if not exists world_connections_legacy_conn_uniq
  on public.world_connections (legacy_entity_connection_id)
  where legacy_entity_connection_id is not null;

-- The Web view reads entry-to-entry edges, filtered by cascade stage.
create index if not exists idx_world_connections_target_entry
  on public.world_connections (target_entry_id)
  where target_entry_id is not null;

create index if not exists idx_world_connections_cascade
  on public.world_connections (world_id, cascade_stage)
  where cascade_stage is not null;


-- ---------------------------------------------------------------------------
-- 3 · The fold report and the permanent legacy-id map
-- ---------------------------------------------------------------------------

create table if not exists public.f3_fold_report (
  id          uuid primary key default gen_random_uuid(),
  phase       text        not null,   -- COLLISION | MOVED | REVIEW | EDGE | PINS
  world_id    uuid,
  legacy_id   uuid,                   -- entities.id / entity_connections.id
  entry_id    uuid,                   -- the world_entries row that won
  name        text,
  entry_type  text,
  note        text,
  created_at  timestamptz not null default now()
);

-- Operator artifact. RLS on with no policy = invisible to anon and to
-- authenticated; readable with the service role or from the SQL editor.
alter table public.f3_fold_report enable row level security;

comment on table public.f3_fold_report is
  'F3 fold audit. One row per collision, moved node, near-duplicate, dropped edge and pin batch.';

create table if not exists public.entity_fold_map (
  legacy_entity_id uuid primary key,
  entry_id         uuid        not null references public.world_entries(id) on delete cascade,
  world_id         uuid        not null,
  collided         boolean     not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists entity_fold_map_entry_idx on public.entity_fold_map (entry_id);

alter table public.entity_fold_map enable row level security;

comment on table public.entity_fold_map is
  'F3: public.entities.id -> public.world_entries.id. Resolves legacy entity ids found in old URLs or client storage.';


-- ---------------------------------------------------------------------------
-- 4 · Nodes — collisions first, then the rows that move
-- ---------------------------------------------------------------------------

do $$
declare
  v_collisions int := 0;
  v_moved      int := 0;
  v_review     int := 0;
  r            record;
begin
  if to_regclass('public.entities') is null then
    raise notice 'F3: public.entities does not exist — node fold skipped.';
    return;
  end if;

  -- The report always describes the latest run.
  delete from public.f3_fold_report;

  -- 4a · COLLISION: a world_entries row of the same world, type and title
  --      already exists. It keeps its id; the entities row's edges are
  --      re-attached to it in step 5. Oldest surviving row wins.
  insert into public.entity_fold_map (legacy_entity_id, entry_id, world_id, collided)
  select distinct on (e.id) e.id, w.id, e.world_id, true
  from public.entities e
  join public.world_entries w
    on w.world_id   = e.world_id
   and w.entry_type = e.entity_type
   and w.title      = e.name
   and w.trashed_at is null
  order by e.id, w.created_at asc
  on conflict (legacy_entity_id) do nothing;

  get diagnostics v_collisions = row_count;

  insert into public.f3_fold_report (phase, world_id, legacy_id, entry_id, name, entry_type, note)
  select 'COLLISION', m.world_id, m.legacy_entity_id, m.entry_id, e.name, e.entity_type,
         'world_entries row kept; entities row edges re-attached to it'
  from public.entity_fold_map m
  join public.entities e on e.id = m.legacy_entity_id
  where m.collided;

  -- 4b · MOVED: everything else becomes a world_entries row.
  with moved as (
    insert into public.world_entries (
      world_id, entry_type, title, content, metadata, tags, icon, color,
      parent_id, sort_order, created_by, created_at, updated_at
    )
    select
      e.world_id,
      e.entity_type,
      e.name,
      coalesce(e.description, ''),
      coalesce(e.metadata, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
        'legacy_entity_id',  e.id,
        'summary',           e.summary,
        'notes',             e.notes,
        'cascade_stage',     e.cascade_stage,
        'custom_type_label', e.custom_type_label,
        'graph_x',           e.graph_x,
        'graph_y',           e.graph_y,
        'pinned',            e.pinned,
        'image_url',         e.image_url
      )),
      coalesce(e.tags, '{}'),
      e.icon,
      e.color,
      null,                                  -- parent_id resolved in 4c
      coalesce(e.sort_order, 0),
      e.user_id,
      e.created_at,
      e.updated_at
    from public.entities e
    where not exists (select 1 from public.entity_fold_map m where m.legacy_entity_id = e.id)
    returning id, world_id, (metadata->>'legacy_entity_id')::uuid as legacy_entity_id
  )
  insert into public.entity_fold_map (legacy_entity_id, entry_id, world_id, collided)
  select legacy_entity_id, id, world_id, false from moved
  on conflict (legacy_entity_id) do nothing;

  get diagnostics v_moved = row_count;

  insert into public.f3_fold_report (phase, world_id, legacy_id, entry_id, name, entry_type, note)
  select 'MOVED', m.world_id, m.legacy_entity_id, m.entry_id, e.name, e.entity_type,
         'new world_entries row'
  from public.entity_fold_map m
  join public.entities e on e.id = m.legacy_entity_id
  where not m.collided;

  -- 4c · parent links, second pass — ids are known now. The BEFORE UPDATE
  --      trigger bumps updated_at on the rows it touches; created_at, which
  --      is the provenance that matters, is preserved from the entities row.
  update public.world_entries w
     set parent_id = pm.entry_id
    from public.entity_fold_map m
    join public.entities e       on e.id = m.legacy_entity_id
    join public.entity_fold_map pm on pm.legacy_entity_id = e.parent_entity_id
   where w.id = m.entry_id
     and e.parent_entity_id is not null
     and w.parent_id is null
     and pm.entry_id <> m.entry_id;        -- a collision must not parent itself

  -- 4d · REVIEW: pairs a human should look at that were NOT folded — same
  --      world and type, titles differing only by case or surrounding space.
  insert into public.f3_fold_report (phase, world_id, legacy_id, entry_id, name, entry_type, note)
  select 'REVIEW', e.world_id, e.id, w.id, e.name, e.entity_type,
         'near-duplicate title NOT folded; world_entries has "' || w.title || '"'
  from public.entities e
  join public.entity_fold_map m on m.legacy_entity_id = e.id and not m.collided
  join public.world_entries w
    on w.world_id   = e.world_id
   and w.entry_type = e.entity_type
   and w.id        <> m.entry_id
   and w.trashed_at is null
   and lower(btrim(w.title)) = lower(btrim(e.name))
   and w.title <> e.name;

  get diagnostics v_review = row_count;

  raise notice 'F3 nodes: % collision(s), % moved, % near-duplicate(s) flagged',
    v_collisions, v_moved, v_review;

  for r in
    select phase, world_id, legacy_id, entry_id, name, entry_type, note
    from public.f3_fold_report
    where phase in ('COLLISION', 'REVIEW')
    order by phase, world_id, name
  loop
    raise notice 'F3 % | world % | "%" (%) | entities.id % -> world_entries.id % | %',
      r.phase, r.world_id, r.name, r.entry_type, r.legacy_id, r.entry_id, r.note;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- 5 · Edges — entity_connections becomes typed world_connections
-- ---------------------------------------------------------------------------

do $$
declare
  v_edges  int := 0;
  v_selfed int := 0;
begin
  if to_regclass('public.entity_connections') is null then
    raise notice 'F3: public.entity_connections does not exist — edge fold skipped.';
    return;
  end if;

  -- A collision can map two different `entities` rows onto one entry, turning
  -- an edge between them into a self-edge. Those are dropped and reported.
  insert into public.f3_fold_report (phase, world_id, legacy_id, entry_id, name, note)
  select 'EDGE', c.world_id, c.id, s.entry_id, c.relationship_type,
         'dropped: both endpoints folded onto the same world_entries row'
  from public.entity_connections c
  join public.entity_fold_map s on s.legacy_entity_id = c.source_entity_id
  join public.entity_fold_map t on t.legacy_entity_id = c.target_entity_id
  where s.entry_id = t.entry_id;

  get diagnostics v_selfed = row_count;

  insert into public.world_connections (
    world_id, source_entry_id, target_entry_id, connection_type, description,
    relationship_label, cascade_stage, bidirectional, strength, status,
    time_start, time_end, notes, legacy_entity_connection_id, created_by,
    created_at, updated_at
  )
  select
    c.world_id, s.entry_id, t.entry_id, c.relationship_type, null,
    c.relationship_label, c.cascade_stage, coalesce(c.bidirectional, false),
    c.strength, coalesce(c.status, 'active'),
    c.time_start, c.time_end, c.notes, c.id, c.user_id,
    c.created_at, c.updated_at
  from public.entity_connections c
  join public.entity_fold_map s on s.legacy_entity_id = c.source_entity_id
  join public.entity_fold_map t on t.legacy_entity_id = c.target_entity_id
  where s.entry_id <> t.entry_id
  on conflict (legacy_entity_connection_id)
    where legacy_entity_connection_id is not null
    do nothing;

  get diagnostics v_edges = row_count;

  raise notice 'F3 edges: % folded, % dropped as self-edges', v_edges, v_selfed;
end $$;


-- ---------------------------------------------------------------------------
-- 6 · The ten legacy world_connections verbs join the one vocabulary
--     (F3-ONE-GRAPH-PROPOSAL.md §2). Runs once; after it, no legacy verb
--     remains for it to match.
-- ---------------------------------------------------------------------------

do $$
declare
  v_flipped int := 0;
  v_typed   int := 0;
  v_parent  int := 0;
  n         int;
begin
  -- 6a · `created` (source created target) becomes `created_by`
  --      (target created_by source), so the endpoints swap.
  with flipped as (
    update public.world_connections
       set source_entry_id     = target_entry_id,
           target_entry_id     = source_entry_id,
           source_worksheet_id = target_worksheet_id,
           target_worksheet_id = source_worksheet_id,
           connection_type     = 'created_by',
           cascade_stage       = coalesce(cascade_stage, 'cross_cascade')
     where connection_type = 'created'
    returning 1
  )
  select count(*) into v_flipped from flipped;

  -- 6b · straight renames onto RELATIONSHIP_TYPES_BY_STAGE
  with typed as (
    update public.world_connections c
       set connection_type = m.new_type,
           cascade_stage   = coalesce(c.cascade_stage, m.stage)
      from (values
        ('lives_on',     'inhabits',     'biology'),
        ('evolved_from', 'evolved_from', 'biology'),
        ('governs',      'governs',      'culture'),
        ('worships',     'worships',     'mythology'),
        ('speaks',       'speaks',       'culture'),
        ('travels_via',  'travels_via',  'culture'),
        ('fights',       'enemy_of',     'culture'),
        ('related_to',   'related_to',   'cross_cascade'),
        ('references',   'references',   'cross_cascade')
      ) as m(old_type, new_type, stage)
     where c.connection_type = m.old_type
    returning 1
  )
  select count(*) into v_typed from typed;

  -- 6c · `parent_of` is three different edges, decided by the endpoints'
  --      types. Each branch runs on rows still typed `parent_of`, so the
  --      branches are mutually exclusive by construction and no edge that
  --      was already `descended_from` is ever touched.

  -- bodies: parent_of -> orbited_by, direction unchanged
  with bodies as (
    update public.world_connections c
       set connection_type = 'orbited_by',
           cascade_stage   = coalesce(c.cascade_stage, 'physics')
      from public.world_entries st, public.world_entries tt
     where c.connection_type = 'parent_of'
       and st.id = c.source_entry_id and tt.id = c.target_entry_id
       and st.entry_type in ('star', 'planet', 'moon', 'star_system')
       and tt.entry_type in ('star', 'planet', 'moon', 'star_system')
    returning 1
  )
  select count(*) into n from bodies;
  v_parent := v_parent + n;

  -- lineages: parent_of (parent -> child) becomes descended_from
  -- (child -> ancestor), so the endpoints swap.
  with lineages as (
    update public.world_connections c
       set connection_type = 'descended_from',
           cascade_stage   = coalesce(c.cascade_stage, 'culture'),
           source_entry_id = c.target_entry_id,
           target_entry_id = c.source_entry_id
      from public.world_entries st, public.world_entries tt
     where c.connection_type = 'parent_of'
       and st.id = c.source_entry_id and tt.id = c.target_entry_id
       and st.entry_type in ('species', 'character', 'faction')
       and tt.entry_type in ('species', 'character', 'faction')
    returning 1
  )
  select count(*) into n from lineages;
  v_parent := v_parent + n;

  -- places: parent_of -> contains, direction unchanged
  with places as (
    update public.world_connections c
       set connection_type = 'contains',
           cascade_stage   = coalesce(c.cascade_stage, 'environment')
      from public.world_entries st, public.world_entries tt
     where c.connection_type = 'parent_of'
       and st.id = c.source_entry_id and tt.id = c.target_entry_id
       and st.entry_type in ('location', 'star_system', 'planet', 'moon')
    returning 1
  )
  select count(*) into n from places;
  v_parent := v_parent + n;

  -- Anything still `parent_of` has an endpoint this migration cannot type
  -- (a worksheet, or a pair with no sensible verb). It keeps the verb and is
  -- reported rather than guessed at.
  insert into public.f3_fold_report (phase, world_id, legacy_id, name, note)
  select 'EDGE', world_id, id, 'parent_of',
         'legacy verb left as-is: endpoints are not both typed entities'
  from public.world_connections
  where connection_type = 'parent_of';

  raise notice 'F3 vocabulary: % re-typed, % `created` flipped, % `parent_of` resolved',
    v_typed, v_flipped, v_parent;
end $$;

-- Any row still carrying no stage is an edge written before F3.
update public.world_connections
   set cascade_stage = 'cross_cascade'
 where cascade_stage is null;


-- ---------------------------------------------------------------------------
-- 7 · scene_pins.entity_id now points at world_entries
-- ---------------------------------------------------------------------------

do $$
declare
  v_pins int := 0;
begin
  if to_regclass('public.scene_pins') is null then
    return;
  end if;

  -- Drop the FK to `entities` before repointing, or every update fails.
  alter table public.scene_pins drop constraint if exists scene_pins_entity_id_fkey;

  with repointed as (
    update public.scene_pins p
       set entity_id = m.entry_id
      from public.entity_fold_map m
     where p.entity_id = m.legacy_entity_id
    returning 1
  )
  select count(*) into v_pins from repointed;

  -- A pin whose entity vanished before this ran has nothing left to point at.
  delete from public.scene_pins p
   where not exists (select 1 from public.world_entries w where w.id = p.entity_id);

  alter table public.scene_pins
    add constraint scene_pins_entity_id_fkey
    foreign key (entity_id) references public.world_entries(id) on delete cascade;

  insert into public.f3_fold_report (phase, note)
  values ('PINS', v_pins || ' scene pin(s) repointed to world_entries');

  raise notice 'F3 pins: % scene pin(s) repointed', v_pins;
end $$;


-- ---------------------------------------------------------------------------
-- 8 · The Showcase reads world_connections now — it needs the same
--     community-world SELECT policy entity_connections already had.
-- ---------------------------------------------------------------------------

drop policy if exists "Auth can view connections in community worlds" on public.world_connections;

create policy "Auth can view connections in community worlds"
  on public.world_connections for select to authenticated
  using (
    world_id in (select id from public.worlds where visibility in ('community', 'public'))
  );


-- ---------------------------------------------------------------------------
-- 9 · `entities` / `entity_connections` go read-only for one release.
--     A later migration drops them.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.entities') is not null then
    revoke insert, update, delete on public.entities from authenticated;
    comment on table public.entities is
      'DEPRECATED (F3, 2026-09-06). Folded into public.world_entries; read-only. Mapping: public.entity_fold_map. Dropped in a later migration.';
  end if;

  if to_regclass('public.entity_connections') is not null then
    revoke insert, update, delete on public.entity_connections from authenticated;
    comment on table public.entity_connections is
      'DEPRECATED (F3, 2026-09-06). Folded into public.world_connections; read-only. Dropped in a later migration.';
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 10 · Final report
-- ---------------------------------------------------------------------------

do $$
declare r record;
begin
  raise notice '--- F3 FOLD REPORT ---';
  for r in
    select phase, count(*) as n from public.f3_fold_report group by phase order by phase
  loop
    raise notice '  % %', rpad(r.phase, 10), r.n;
  end loop;
  raise notice 'Full detail: select * from public.f3_fold_report order by phase, name;';
end $$;
