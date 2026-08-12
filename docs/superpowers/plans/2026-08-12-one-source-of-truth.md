# One Source of Truth per World

**Goal:** every tool and simulator reads and writes the same world, through one model, with one permission story.

**Standing gate: no DDL ships before sign-off.** This document is the evidence and the sequence, not a migration.

---

## 1. What is actually there (measured 2026-08-12, production)

39 tables. The problem is not that data is missing, it is that the same *kind* of data lives in several places that cannot see each other.

### Content stores, and which are actually parallel

| Table | Rows | Used by | Collaborator access |
|---|---|---|---|
| `world_entries` | **36** | `/write`, the manuscript surface | ✅ 9 policies |
| `writing_entries` | **12** | `/workshop`, the prompt-based Writing Workshop | ❌ 4 policies, owner only |
| `binder_nodes` | **0** | **nothing. Dead.** | ❌ 4 policies, owner only |

Two of these are not duplicates. The Writing Workshop is a prompt-driven surface (`writing_entries.prompt_id`) and the manuscript editor is a binder of chapters and scenes. Different features that both happen to hold prose.

`binder_nodes` is genuinely dead: nothing imports `useManuscript.ts`, whose own successor says so ("Replaces the earlier writing_entries-based useManuscript"), and the changelog records it as quarantined pending this migration.

**The finding that matters most:** `writing_entries` carries typed columns for exactly the document metadata the manuscript surface stores as **untyped JSON** in `world_entries.metadata` — `synopsis`, `status`, `pov_entity_id`, `location_entity_id`, `time_label`, `target_words`. Those were added for the abandoned manuscript attempt. So the metadata model was designed properly once, with real foreign keys, and the surviving surface reimplemented it as a blob.

That has a direct cost. `pov_entity_id` is a reference; `metadata.pov` is a string. One can answer "show me every scene from this character's viewpoint" and survive a rename. The other cannot.

### Two entity stores

| Table | Rows | Notes |
|---|---|---|
| `world_entries` (wiki rows) | part of the 36 | what the product actually uses |
| `entities` | **0** | 22 columns, 9 policies with collaborator access, `graph_x/y`, `cascade_stage`, `parent_entity_id`. Built, never populated |

`entities` is the SF-II merge target from `STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md`. It exists, it is well-shaped, and it is empty. Meanwhile `entity_connections` holds **50 rows**, the largest content table in the database, pointing into a graph whose node table is unused.

### Simulators

`simulation_saves` held **zero rows** until 0.6950, because ExoSky's save was a silent no-op (see [`2026-08-12-simulator-uplift.md`](2026-08-12-simulator-uplift.md) §1a). Its shape is also the odd one out: `data.parameters` / `data.results` free-form jsonb, per-simulator conventions inside, and no relationship to any entity. A star named in Solaris has no link to a star entity in the world.

---

## 2. The permission split nobody declared

Three tables are **owner-only** while every comparable world table grants collaborators access:

| Owner-only | Has collaborator policies |
|---|---|
| `simulation_saves` (1 policy, `FOR ALL`) | `world_entries`, `worksheets`, `entities`, `world_notes`, `chronicle_events`, `entity_connections`, `document_versions` |
| `writing_entries` (4) | |
| `binder_nodes` (4) | |

`simulation_saves`'s single `FOR ALL USING (auth.uid() = user_id)` policy is correct and complete for an owner. It is also the whole story: **a collaborator on a shared world cannot see its simulations at all.**

That has a live consequence as of 0.6950. `useWorldSimulations` queries by `world_id`, so the new simulator facts in the writing inspector return **nothing for a collaborator**, silently, while worksheet facts beside them work. Not a data-loss bug, but the panel quietly tells two different users two different truths.

Also flagged, unrelated to worlds: `waitlist` and `admin_todos` have RLS **enabled with zero policies**. That denies all access to `anon` and `authenticated` alike. If the waitlist form writes with the publishable key, it cannot be working.

---

## 3. Sequence

Ordered so nothing is destroyed and each step is reversible.

### Task T-0: Remove the dead branch, keep the live one (no DDL)

- [ ] Delete `src/hooks/useManuscript.ts`. Nothing imports it, it holds the only `any`-cast access to `binder_nodes`, and `docs/IMPROVEMENTS_BACKLOG.md` item 3 exists only to restore type safety on code that is not running. Deleting it closes that item outright.
- [ ] Leave `writing_entries` and `/workshop` alone. It is a live feature, not a duplicate.
- [ ] Decide the target for document metadata: typed columns or the `metadata` blob. **Recommendation: typed**, because `pov_entity_id` and `location_entity_id` are references and a blob cannot express them. `src/lib/document-meta.ts` already isolates every read and write, so the swap is one module rather than a sweep.

### Task T-1: Close the permission inconsistency (small DDL, needs sign-off)

- [ ] Add collaborator policies to `simulation_saves` matching `worksheets`, so a shared world's simulations are visible to the people sharing it.
- [ ] Until then, state the limitation in the facts panel rather than showing an empty section.
- [ ] Separately: give `waitlist` an insert policy for `anon`, or confirm it is written server-side only.

### Task T-2: Land the `world_entries` → `entities` merge (the SF-II decision)

Already decided; the blocker was never the design.

- [ ] Backfill `entities` from the wiki rows of `world_entries`. 36 rows total, so this is a small, verifiable migration.
- [ ] Point `entity_connections`' 50 rows at real `entities` nodes and verify none dangle.
- [ ] Keep `world_entries` for writing documents. **Do not** collapse documents and entities into one table: `folder → document` is already chapter → scene, and `parent_id` is `ON DELETE CASCADE`, so a wrong move there destroys subtrees.
- [ ] Migrate reads behind the existing service layer, not at call sites.

### Task T-3: Give simulator saves a place in the model

- [ ] Add `entity_id` (nullable) to `simulation_saves`, so a saved system can *be* the star entity a writer already has, rather than a parallel record with a matching name.
- [ ] On publish-to-world, create or update that entity instead of a loose row. `PublishToWorldDialog` already exists for this.
- [ ] Normalise the payload envelope across simulators. `parameters`/`results` stays (the insert depends on it), but each simulator should declare its shape in a typed module with a round-trip test, as `exosky-save.ts` and `saveFormat.ts` now do.

### Task T-4: One read path

- [ ] `extractWorksheetFacts` and `extractSimulationFacts` already return one `WorksheetFact` shape. Extend the same treatment to entities, so the writing surface has a single "what does this world know" query rather than three hooks.

---

## 4. Gates

Standing bar holds: **135 tests passing, type errors at the 254 baseline, eslint `src` at 62/73, `typecheck-strict` clean, build green.** Plus, for anything here:

- No DDL without sign-off, and no `DROP` in the same release as the code change that stops using a column.
- Every migration verified by row counts before and after, in production, quoted in the PR.
- RLS changes verified by querying as a collaborator, not by reading the policy text.

---

## 5. Honest risks

- **The 12 rows in `writing_entries` are somebody's writing.** Find out what still writes them before touching anything.
- **`entity_connections` has more rows than any other content table** and points into an empty node table. Whatever populated it disagrees with the rest of the product about where entities live. Understand that before backfilling, or the backfill will orphan the graph.
- **`ON DELETE CASCADE` on `world_entries.parent_id`** makes any restructuring of that tree dangerous. Snapshot before, verify after.
- Owner-only RLS on three tables may be deliberate. Confirm intent rather than assuming it is an oversight; "collaborators should not see your unpublished simulations" is a defensible product position, and if it is the intended one, the fix is the panel's copy, not the policy.
