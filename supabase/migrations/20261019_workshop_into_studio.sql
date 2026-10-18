-- ============================================================================
-- 20261019_workshop_into_studio.sql
-- Retire /workshop as a second writing store (1.5 item 17).
--
-- STATUS: WRITTEN FOR REVIEW. NOT APPLIED. The lead applies it.
--
-- What it does
--   Copies every live writing_entries row into the Studio binder
--   (world_entries, entry_type 'document') so workshop writing reaches the
--   binder, compile and the graph like any other document. One-time and
--   idempotent: a second run copies nothing.
--   writing_entries is NEVER deleted. It stays as a read-only archive: the
--   insert/update/delete policies are dropped, select is kept (account
--   export still reads it).
--
-- Mapping (pinned by src/lib/workshop-migration.ts and its tests)
--   1. archived entries are not copied (they remain in the archive)
--   2. already-copied entries (metadata.workshop.entryId) are skipped
--   3. target world = the entry's world if it exists, is the same user's and
--      is not archived; else the user's "Workshop" world
--      (worlds.settings.workshop = true), created here when missing
--   4. inside the target world: a root folder "Workshop"
--      (metadata.workshopFolder = true), reused when present
--   5. title falls back to 'Untitled entry'; HTML content verbatim, plain
--      text escaped and wrapped in <p> (none exists today: all 13 rows are HTML)
--   6. created_at / updated_at preserved; tags copied
--   7. oldest first in the folder, sort_order steps of 10 after existing children
--
-- Row counts before applying (read-only, 2026-10-18, project sgoefchwjumzgfupqdzt):
--   select count(*)                                          as total,
--          count(*) filter (where e.archived_at is null)     as live,
--          count(*) filter (where e.archived_at is null and (w.id is null
--            or w.archived_at is not null or w.user_id <> e.user_id)) as to_workshop_world,
--          count(distinct e.user_id)                         as users
--   from public.writing_entries e left join public.worlds w on w.id = e.world_id;
--   -> total 13, live 10, archived 3, to_workshop_world 7 (3 users), 3 into
--      2 existing worlds. writing_entry_entities: 0 rows.
--   Expected effect: 3 worlds named "Workshop", 5 "Workshop" folders,
--   10 documents. Re-running: 0 / 0 / 0.
--
-- Triggers: world_entries has only BEFORE UPDATE (updated_at) and AFTER
-- INSERT/UPDATE (touch world) triggers, so inserted created_at/updated_at
-- are kept as given.
-- ============================================================================

drop table if exists pg_temp._workshop_copy;

create temp table _workshop_copy as
select e.id,
       e.user_id,
       e.prompt_id,
       e.title,
       e.content,
       e.tags,
       e.created_at,
       e.updated_at,
       case
         when w.id is not null and w.user_id = e.user_id and w.archived_at is null then w.id
       end as target_world,
       null::uuid as folder_id
from public.writing_entries e
left join public.worlds w on w.id = e.world_id
where e.archived_at is null
  and not exists (
    select 1 from public.world_entries d
    where d.entry_type = 'document'
      and d.metadata -> 'workshop' ->> 'entryId' = e.id::text
  );

-- 3. A Workshop world for each user with world-less entries and none yet.
insert into public.worlds (user_id, name, description, settings)
select distinct c.user_id,
       'Workshop',
       'Pieces written from daily prompts. Moved here from the old writing workshop.',
       jsonb_build_object('workshop', true)
from _workshop_copy c
where c.target_world is null
  and not exists (
    select 1 from public.worlds x
    where x.user_id = c.user_id and x.settings ->> 'workshop' = 'true'
  );

update _workshop_copy c
set target_world = (
  select x.id from public.worlds x
  where x.user_id = c.user_id and x.settings ->> 'workshop' = 'true'
  order by x.archived_at nulls first, x.created_at
  limit 1
)
where c.target_world is null;

-- 4. A root "Workshop" folder in each target world, unless one exists.
insert into public.world_entries
  (world_id, entry_type, title, content, metadata, sort_order, parent_id, created_by)
select t.target_world,
       'folder',
       'Workshop',
       '',
       jsonb_build_object('workshopFolder', true),
       coalesce((
         select max(r.sort_order) from public.world_entries r
         where r.world_id = t.target_world and r.parent_id is null
           and r.entry_type in ('document', 'folder')
       ), -10) + 10,
       null,
       t.user_id
from (select distinct target_world, user_id from _workshop_copy) t
where not exists (
  select 1 from public.world_entries f
  where f.world_id = t.target_world
    and f.entry_type = 'folder'
    and f.parent_id is null
    and f.trashed_at is null
    and f.metadata ->> 'workshopFolder' = 'true'
);

update _workshop_copy c
set folder_id = (
  select f.id from public.world_entries f
  where f.world_id = c.target_world
    and f.entry_type = 'folder'
    and f.parent_id is null
    and f.trashed_at is null
    and f.metadata ->> 'workshopFolder' = 'true'
  order by f.created_at
  limit 1
);

-- 5-7. The documents.
insert into public.world_entries
  (world_id, entry_type, title, content, metadata, tags, sort_order, parent_id,
   created_by, created_at, updated_at)
select c.target_world,
       'document',
       coalesce(nullif(btrim(c.title), ''), 'Untitled entry'),
       case
         when coalesce(btrim(c.content), '') = '' then ''
         when c.content ~ '^\s*<' then c.content
         else '<p>' || replace(
                regexp_replace(
                  replace(replace(replace(
                    regexp_replace(c.content, E'\r\n?', E'\n', 'g'),
                    '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
                  E'\n{2,}', '</p><p>', 'g'),
                E'\n', '<br>') || '</p>'
       end,
       jsonb_build_object(
         'workshop', jsonb_build_object(
           'entryId', c.id::text,
           'promptId', c.prompt_id,
           'migratedFrom', 'writing_entries'
         )
       ),
       coalesce(c.tags, '{}'),
       coalesce((
         select max(k.sort_order) from public.world_entries k where k.parent_id = c.folder_id
       ), -10) + 10 * row_number() over (partition by c.folder_id order by c.created_at, c.id),
       c.folder_id,
       c.user_id,
       c.created_at,
       c.updated_at
from _workshop_copy c
where c.target_world is not null and c.folder_id is not null;

drop table if exists pg_temp._workshop_copy;

-- writing_entries becomes a read-only archive. Never deleted.
drop policy if exists "Own entries: insert" on public.writing_entries;
drop policy if exists "Own entries: update" on public.writing_entries;
drop policy if exists "Own entries: delete" on public.writing_entries;
comment on table public.writing_entries is
  'ARCHIVE (read-only since 20261019_workshop_into_studio). The retired /workshop store. Live rows were copied into world_entries documents (metadata.workshop.entryId). Never delete.';

-- Post-apply verification:
--   select count(*) from public.world_entries where metadata ? 'workshop';           -- 10
--   select count(*) from public.worlds where settings ->> 'workshop' = 'true';        -- 3
--   select count(*) from public.world_entries where metadata ->> 'workshopFolder' = 'true'; -- 5
--   select e.id from public.writing_entries e where e.archived_at is null and not exists (
--     select 1 from public.world_entries d where d.metadata -> 'workshop' ->> 'entryId' = e.id::text); -- 0 rows
