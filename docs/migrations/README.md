# Entity Unification Migration — Review Guide

**File:** [`unify_entities_DRAFT.sql`](unify_entities_DRAFT.sql)
**Status:** DRAFT — do not run yet
**Plan reference:** Phase A1 of the Unified Elements + Novel-Writing expansion plan

---

## What this migration does

Takes the entity-like rows out of `world_entries` (`planet`, `species`, `character`, etc.) and copies them into `entities` — preserving the original IDs so existing foreign keys keep working. Converts entry-to-entry connections in `world_connections` into `entity_connections`.

**What it does NOT migrate:**
- Writing documents (`entry_type='document'` / `'folder'`) — these are manuscript chapters and stay in `world_entries`.
- Plain notes (`note`, `milestone`, `decision`, `reference`, `lore`) — user jottings, stay put.

**Side effects:**
- `entity_worksheets.entity_id` FK is re-pointed from `world_entries(id)` → `entities(id)`. Orphans (pointing at docs/folders) are deleted.
- `writing_entry_entities.entity_id` FK same treatment.
- Nothing is dropped. `world_entries` stays populated with docs/folders/notes; migrated rows stay in both tables until a later cleanup migration.

---

## Decisions (resolved 2026-04-15)

1. ✅ **`star_system` → `star`.** Mapped as-is.
2. ✅ **`vessel` → `vessel`** as a first-class entity_type. The `entities.entity_type` column has no CHECK constraint so this works without a schema change; `CREATABLE_ENTITY_TYPES` in [`src/lib/entity-config.ts`](../../src/lib/entity-config.ts) already includes `vessel` in the creatable list.
3. ✅ **`mythology` → `religion`.** Simple remap, no custom_type_label.
4. ✅ **Tool-output types (`habitable_zone`, `chain_reaction`, etc.) migrate as `custom` entities** with their original entry_type in `custom_type_label`.
5. ✅ **Take a Supabase backup before running.** Manual snapshot in dashboard → Project Settings → Database → Backups.

---

## Pre-flight checklist

Before running:

- [ ] Review the pre-check queries at the top of the SQL file. Copy them into the Supabase SQL editor and run against production. Share the row counts back so we can confirm expectations.
- [ ] Take a Supabase snapshot (dashboard → Project Settings → Database → Backups).
- [ ] Confirm the 5 decisions above.
- [ ] Run against **a staging Supabase project first** if one exists. If not, this is high-risk to run straight on production.
- [ ] Stash current production URL traffic in mind: this is an online migration; reads during the transaction block briefly.

---

## Application sequence

When you're ready to proceed:

1. **Rename** `docs/migrations/unify_entities_DRAFT.sql` → `supabase/migrations/<YYYYMMDD>_unify_entities.sql` (with today's date as prefix).
2. Remove the `DRAFT — DO NOT APPLY` header so CI doesn't flag it.
3. Apply via `supabase db push` or the Supabase dashboard SQL editor inside the same transaction.
4. Run the POST-MIGRATION VERIFICATION queries at the bottom of the file.
5. Do a smoke test on the app:
   - Load World Dashboard → entities still show
   - Load World Connections page → graph renders
   - Load a Wiki page → infobox still populated
   - Create a new entity via the (legacy) dialog → appears in both dashboard and graph
6. If smoke test fails, don't panic: nothing was deleted, the legacy `world_entries` rows are still there. Follow the ROLLBACK NOTES section of the SQL file.
7. Proceed to A2 (new unified create dialog) only after verification passes.

---

## Code changes that follow this migration

The SQL alone doesn't finish A1. After the schema is in place, rewrites needed:

- `src/services/world-data.ts` — query functions that currently hit `world_entries` for entity-like rows need to switch to `entities`. Leave queries that target `document`/`folder`/`note` types on `world_entries`.
- `src/hooks/use-world-entities.ts` (if it exists) — same treatment.
- `src/pages/WorldDashboard.tsx` — entity list section.
- `src/components/codex/Codex.tsx` — entity browser.
- `src/components/world/WikiPage.tsx` + `EntityMasterInfobox.tsx` — read path.
- `src/components/writing/WritingEntityPanel.tsx` — mention population.
- `src/lib/entity-sync.ts` — pending-diff logic.
- `src/components/simulators/PublishToWorldDialog.tsx` — tool → entity publish.

Separately, feature flag scaffolding:

- `src/lib/feature-flags.ts` (new) — simple `FLAG_UNIFIED_ENTITIES` boolean read from `VITE_FLAG_UNIFIED_ENTITIES` env var.
- Branch the read paths on the flag so we can cut over gradually.

---

## Why this is drafted instead of shipped

Running a migration like this against a live database needs a human in the loop to:
- Confirm the entity_type mapping decisions (see above)
- Take the backup
- Watch the pre-check counts
- Decide timing (don't run during peak user activity if there is any)

The plan is approved; the SQL is drafted; the code changes downstream are mapped. The step of running SQL against production is the one I won't take autonomously.
