# F3 · One graph — node/edge types and the fold

> Brief F3 says: *show me the node/edge types before touching the renderer.*
> This is that. Nothing in the renderer has been touched. Decide the three
> questions at the bottom and the implementing session is mechanical.

---

## 0 · What exists (the finding from F1)

Two graphs, two tables, nothing joins them.

| | `world_entries` + `world_connections` | `entities` + `entity_connections` |
|---|---|---|
| Nodes | every wiki/Codex page — planets, species, characters, *and* notes, tool outputs, documents | typed worldbuilding entities only |
| Edges | `connection_type` free text; UI offers 10 verbs (`related_to`, `lives_on`, `evolved_from`, `governs`, `worships`, `speaks`, `travels_via`, `fights`, `created`, `parent_of`) | 100+ typed verbs in `RELATIONSHIP_TYPES_BY_STAGE`, per cascade stage, with `bidirectional`, `strength`, `status`, `time_start/time_end` |
| Who references it | `entity_worksheets` (facts), `chronicle_events.linked_entry_id`, `writing_entry_entities` (mentions), the Codex page (F1), Chronicle, tools | `scene_pins.entity_id`, the `@mention` editor extension, EntitySidebar, EntityTreeView, `/connections` |
| Renderers | Mind Map / Worksheet Graph / Outline on `/connections`; `/graph` redirects | EntityTreeView (dnd tree), `WorldConnectionsGraph` (react-flow) |

The facts live on the left. The good edge vocabulary lives on the right. F3 is: move the vocabulary left, retire the right.

---

## 1 · Nodes — `world_entries.entry_type`, partitioned

A **node** in the Web view is a `world_entries` row whose `entry_type` is an *entity kind*. Everything else is a property of a node, not a node.

| Class | `entry_type` values | In the Web view? |
|---|---|---|
| **Entity** | `planet`, `star_system`, `species`, `faction`, `character`, `technology`, `location`, `artifact`, `vessel`, `language`, `mythology`, `custom` | **yes** — these are the nodes |
| Entity (add) | `star`, `moon`, `event`, `concept`, `religion` — exist on `entities.entity_type` today, not on `EntryType` | **yes** — add to `EntryType` so nothing is lost in the fold |
| Instrument output | `chain_reaction`, `habitable_zone`, `axiom`, `gravity_profile`, `sensory_system`, `interaction_matrix`, `government`, `expansion_model`, `propulsion`, `time_dilation`, `gravity_sim`, `timeline`, `signal_profile` | **no** — a worksheet is a property of the entity it is attached to (`entity_worksheets`). Brief F3 §1. |
| Manuscript | `document`, `lore`, `note` | **no** — they are Manuscript; "mentioned in" is an edge *to* them, shown on the entity page, not a node in the Web |
| Bookkeeping | `milestone`, `decision`, `reference` | **no** |

Node colour = the cascade layer of its type (amber Physics · azure Worlds · emerald Life · violet Civilizations · stellar Mythology), which is what `tool-accents.ts` already says and what the Codex List already uses. Meaning, not role — it does not follow the theme's primary.

---

## 2 · Edges — one vocabulary, typed, staged

Keep `RELATIONSHIP_TYPES_BY_STAGE` from `src/services/entity-graph-types.ts` **as the vocabulary**, and put it on `world_connections.connection_type`. It is already grouped by cascade stage (physics · environment · biology · psychology · mythology · sociology · history), already has inverse pairs (`orbits`/`orbited_by`, `preys_on`/`hosts`…), and already carries the metadata an edge needs.

The ten `world_connections` verbs map onto it with no loss:

| today | becomes |
|---|---|
| `related_to` | `related_to` (kept as the untyped fallback, stage `none`) |
| `lives_on` | `inhabits` |
| `evolved_from` | `evolved_from` |
| `governs` | `governs` |
| `worships` | `worships` |
| `speaks` | `speaks` |
| `travels_via` | `travels_via` (add to sociology) |
| `fights` | `enemy_of` |
| `created` | `created_by` (direction flips: source ↔ target) |
| `parent_of` | `contains` for places · `descended_from` (flipped) for lineages · `orbited_by` for bodies — decided per row by the two endpoints' types |

Edge columns to add to `world_connections` (all nullable, all already on `entity_connections`):
`relationship_label text`, `cascade_stage text`, `bidirectional bool default false`, `strength int`, `status text`, `time_start text`, `time_end text`.

`time_start`/`time_end` are the epoch axis. The Web view's epoch filter hides edges outside the scrubber's epoch — Law V without a new table.

---

## 3 · The fold — migration sketch

One migration, reversible, in this order:

```sql
-- 1. edge columns
alter table world_connections
  add column relationship_label text, add column cascade_stage text,
  add column bidirectional boolean not null default false,
  add column strength int, add column status text,
  add column time_start text, add column time_end text,
  add column legacy_entity_connection_id uuid;

-- 2. nodes: every `entities` row becomes a world_entries row, remembering where it came from
insert into world_entries (id, world_id, entry_type, title, content, metadata, tags, icon, color,
                           parent_id, sort_order, created_by, created_at, updated_at)
select gen_random_uuid(), e.world_id, e.entity_type, e.name,
       coalesce(e.description, ''), 
       jsonb_build_object('legacy_entity_id', e.id, 'summary', e.summary, 'notes', e.notes,
                          'cascade_stage', e.cascade_stage, 'custom_type_label', e.custom_type_label,
                          'graph_x', e.graph_x, 'graph_y', e.graph_y, 'pinned', e.pinned,
                          'image_url', e.image_url) || coalesce(e.metadata, '{}'::jsonb),
       e.tags, e.icon, e.color, null, e.sort_order, e.user_id, e.created_at, e.updated_at
from entities e
where not exists (   -- skip when a world_entries row of the same type+name already exists in that world
  select 1 from world_entries w where w.world_id = e.world_id and w.title = e.name and w.entry_type = e.entity_type);

-- 2b. parent links (second pass, ids now known)
update world_entries w set parent_id = p.id
from entities e join world_entries p on p.metadata->>'legacy_entity_id' = e.parent_entity_id::text
where w.metadata->>'legacy_entity_id' = e.id::text and e.parent_entity_id is not null;

-- 3. edges
insert into world_connections (world_id, source_entry_id, target_entry_id, connection_type, description,
   relationship_label, cascade_stage, bidirectional, strength, status, time_start, time_end,
   legacy_entity_connection_id, created_by)
select c.world_id, s.id, t.id, c.relationship_type, null,
       c.relationship_label, c.cascade_stage, coalesce(c.bidirectional,false), c.strength, c.status,
       c.time_start, c.time_end, c.id, c.user_id
from entity_connections c
join world_entries s on s.metadata->>'legacy_entity_id' = c.source_entity_id::text
join world_entries t on t.metadata->>'legacy_entity_id' = c.target_entity_id::text;

-- 4. repoint scene_pins.entity_id → the new world_entries id (same join)
-- 5. leave `entities` in place, read-only, for one release; drop in the next.
```

Name collisions (step 2's `where not exists`) are the one place a human should look: if *Kellis Prime* exists in both tables, the fold keeps the `world_entries` one (it has the facts) and re-attaches the `entities` one's edges to it. The migration should print those rows.

App-side, after the fold: `EntityMention` reads `world_entries`; `sf-navigate-entity` and `sf-navigate-element` become one event; `useEntities`/`useEntityConnections` become thin views over `world_entries`/`world_connections` (so EntitySidebar and EntityTreeView keep working during the transition); `WorldConnections`' three modes and `/graph` redirect to `/codex?view=web`.

---

## 4 · The renderer — keep one

| Candidate | What it does well | What it lacks |
|---|---|---|
| `WorldConnectionsGraph` (react-flow) — `src/components/connections/` | typed edges (`ConnectionEdge`), legend, pan/zoom, node hover | reads `entities`; Drake Context card bolted on |
| `EntityTreeView` — `src/components/graph/` | hierarchy (parent_id) with dnd re-parenting, cascade filter, search, timeline scrubber (`TimelineScrubber.tsx`!), export | a tree, not a web — can't show `allied_with` |
| Worksheet Graph / Outline modes on `/connections` | outline is a fine *List* view | worksheets as nodes — exactly what F3 §1 forbids |

**Recommendation:** keep `WorldConnectionsGraph` as the Web view's renderer, take `CascadeFilterBar`, `GraphSearch` and `TimelineScrubber` from `src/components/graph/` into its toolbar (they are the filter bar the brief asks for, already written), and delete the rest of both folders. Delete `DrakeContextCard` — the brief is explicit; it is a Signal readout for the galaxy entity's page.

---

## 5 · Three decisions before the implementing session

1. **Fold direction confirmed?** `entities` → `world_entries` (this proposal), not the reverse. The facts, chronicle and manuscript already point at `world_entries`; moving those three would be the bigger migration.
2. **Collision policy:** keep the `world_entries` row, re-attach edges (proposed) — or keep both and let the writer merge from the Codex page?
3. **Renderer:** `WorldConnectionsGraph` + the graph/ toolbar pieces (proposed), or EntityTreeView promoted to a web?

Answer those and F3 is ~1 week as estimated. Until then `/connections` keeps working and the Codex page's Relations section reads `world_connections` (untyped) — see AMENDMENTS 2026-09-03.
