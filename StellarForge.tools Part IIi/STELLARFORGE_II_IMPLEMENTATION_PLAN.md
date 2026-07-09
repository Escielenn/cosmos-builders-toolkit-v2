# StellarForge II — Implementation Plan

> **SUPERSEDED 2026-06-11** by `STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md` (definitive — inferences below were verified against migration bodies and client code; several were corrected). Kept for history.

**Status:** Draft v1 · Authored 2026-06-11
**Baseline build:** v0.6642 (`src/config/version.ts`)
**Stack decision:** STAY on Vite + React + Supabase (Supabase Auth included). No Clerk/Next.js migration in scope.
**Scope:** Two pillars — (A) a ground-up design & aesthetic overhaul applied consistently across the entire product, and (B) a cohesive, deduplicated database with a single source of truth and real foreign-key integrity — while preserving every existing user world.

> **Confidence labeling.** This plan is grounded in a direct scan of the repo: `package.json`, `tailwind.config.ts`, `src/index.css`, the 50 files under `supabase/migrations/`, the generated `src/integrations/supabase/types.ts`, `docs/ROADMAP.md`, `docs/STACK-ARCHITECTURE.md`, and `CLAUDE.md`. Where a claim rests on table/file *names* and migration *history* rather than line-by-line reading of every migration body or component, it is marked **(inferred)**. Phase 0 of each pillar exists specifically to convert those inferences into certainty before any destructive work.

---

## 1. Vision & Non-Negotiables

### 1.1 The two pillars

**Pillar A — One cohesive design system, applied everywhere.** Today the product carries (at least) three visual layers that have drifted apart: the site-wide teal "instrument panel" system (`--sf-*` tokens), a legacy cyan simulator system (`--sim-*` / `#00D4FF`, referenced across ~50 source files), and the shadcn/Radix semantic token layer (`--primary`, `--background`, etc.) sitting on top. StellarForge II unifies these into a single token foundation and component library, then re-skins every surface — landing, world/graph layer, all 21 tools, and all simulators — to one coherent language. The cyan-vs-teal divergence is resolved as part of this, not left as a permanent exception.

**Pillar B — One cohesive, deduplicated database.** The schema grew across 50 migrations (2026-01-19 → 2026-04-28) by accretion. That history left overlapping models doing similar jobs: two relationship/edge tables, two "thing in a world" content models, denormalized full-world snapshot blobs, tags stored two different ways, and a fork operation that deep-copies entire worlds. StellarForge II establishes a normalized model with a single source of truth per concept, real foreign keys with `ON DELETE` integrity, and deduplication — without losing a single existing user world.

### 1.2 Non-negotiables (hard constraints)

1. **Stay on Vite + Supabase.** React 18 + TypeScript + Vite + React Router remain. Supabase Postgres + **Supabase Auth** remain. No Clerk. No Next.js. No framework swap. `docs/STACK-ARCHITECTURE.md` (which currently describes a Clerk/Next.js target as if canonical) gets flagged as **aspirational, not current** (see §4.1).
2. **Existing user data is sacred.** Every world, entity, worksheet, connection, snapshot, document, and writing entry that exists today must survive migration with its relationships intact. Migration is additive-then-cutover with a tested rollback, never drop-and-recreate.
3. **RLS parity or better.** Every new or reshaped table ships with Row Level Security policies at least as strict as today's. No row becomes more visible than it was. (The repo has a long history of RLS hardening migrations — `20260215_fix_rls_initplan`, `20260217_fix_permissive_insert_policies`, `20260406_fix_community_rls_*`, `20260428_fix_world_invites_rls` — that posture must be preserved.)
4. **Billing & content continuity.** Stripe checkout/portal/webhook (`supabase/functions/create-checkout-session`, `create-portal-session`, `stripe-webhook`) and Sanity (blog/Learn) keep working throughout. Pricing stays $4.99/mo Pro (no org/seat repricing in this scope).
5. **Ship incrementally, never big-bang.** Both pillars roll out surface-by-surface behind the existing route structure so the site is shippable at the end of every phase.

---

## 2. Pillar A — Ground-Up Design & Aesthetic Overhaul

### 2.1 Current state (what we're overhauling) — grounded

- **Token source of truth:** `src/index.css` defines the raw `--sf-*` palette (void/surface/teal/teal-bright/amber/emerald/violet/stellar/etc.) and a five-tier text hierarchy, mirrored in `design_handoff_April_2026/tokens.css` and `shared.css`. `tailwind.config.ts` surfaces them as `sf.*` utilities **and** wires the shadcn semantic layer (`--primary`, `--card`, `--sidebar-*`, …). So there are effectively **two token layers stacked** (raw `sf.*` + semantic shadcn), plus a **third legacy simulator layer** (`--sim-*` / cyan `#00D4FF`).
- **Divergence is real and measurable:** ~50 source files reference the legacy cyan system (`#00D4FF`, `--sim-accent`, `sf-cyan`). Per `CLAUDE.md`, this was an intentional choice for canvas legibility on near-black simulator backgrounds — StellarForge II keeps the *rationale* (sims may run a darker canvas) but folds it into one governed token set rather than a separate palette.
- **Design language already documented:** `CLAUDE.md`, `DESIGN.md`/`DESIGN.json`, and `STELLARFORGE_SHIPS_VOICE_COPYWRITING.md` describe the "light emerging from void" instrument-panel aesthetic (zero border-radius, MD Nichrome/Jura/DM Sans/JetBrains Mono, the 0.06/0.15/1.0 glow pattern). This is an asset — II is a *consolidation and consistent application*, not a from-scratch reinvention of taste.
- **Component substrate:** Radix primitives + shadcn/ui + Tailwind + CVA (`class-variance-authority`) + `tailwind-merge`, with Framer Motion for animation and lucide-react icons. This is the right foundation to build on — we extend it, we do not replace it.

### 2.2 Foundation layer — the design tokens (Phase A0/A1)

Establish a **single canonical token file** as the one source of truth, consumed by Tailwind and by any canvas/3D code that currently hardcodes hex.

- **Color.**
  - Collapse `--sf-*`, `--sim-*`, and the shadcn semantic vars into one layered system: **primitives** (raw hues/ramps) → **semantic tokens** (`--surface`, `--accent`, `--accent-glow`, `--text-1…5`, `--danger`, …) → **shadcn aliases** (`--primary` etc. point at semantics, not at raw values).
  - **Resolve cyan vs teal:** pick teal (`--sf-teal #15C17B` / glow `#3DFFCD`) as the single product accent and define a governed **simulator accent token** that is *either* the same teal *or* a deliberately-chosen sim variant — but defined once, in the token file, not as 50 scattered `#00D4FF` literals. Recommendation: unify on teal site-wide and retire `#00D4FF`; if sims need extra punch on black, express it as `--sim-accent: var(--accent)` with an optional brightness modifier so it stays traceable. **(Decision needed — see Open Questions Q1.)**
  - Encode the glow pattern (0.06 tint / 0.15 border / 1.0 text) as reusable tokens/utilities so it stops being copy-pasted.
- **Type.** Lock the four-font system (MD Nichrome display / Jura headings / DM Sans body+buttons / JetBrains Mono data) as tokens with a defined scale and the existing weight discipline (300/400/500, never 700). Self-host fonts (already present under `public/fonts/` and `design_handoff_April_2026/source/assets/fonts/`) to kill layout shift.
- **Spacing & radius.** Tokenize the spacing scale and the radius ladder (0 / 2 / 3 / 4px) so "sharp edges" is enforced by tokens rather than convention.
- **Motion.** Promote the documented duration/easing tokens (`--duration-*`, `--ease-out-expo`, etc.) into the canonical file and standardize on Framer Motion variants + `prefers-reduced-motion` from day one.
- **Elevation/z-index.** Fold the existing z-index table from `CLAUDE.md` into tokens to prevent the overlay-stacking fights it warns about.

**Deliverable:** `src/styles/tokens.css` (canonical) + a regenerated `tailwind.config.ts` whose `sf.*` and semantic colors both resolve through it, plus a short `DESIGN-TOKENS.md` that supersedes the scattered guidance. A lint rule (or CI grep) bans raw hex in `src/**` outside the token file.

### 2.3 Component-library strategy (build on Radix/shadcn, don't replace)

- Keep Radix + shadcn + Tailwind + CVA. Audit `src/components/ui/*` and **re-found each primitive on the new semantic tokens** (GlassPanel, Badge/glow variants, Label, Button, Input, numbered badges, section headers, instrument-nav). Goal: no primitive references a raw color or the legacy cyan directly.
- Introduce a thin **component contract**: every primitive takes an `accent`/`tone` prop resolving to semantic tokens, so the same Button can render in tool-teal or a category accent without bespoke CSS.
- Stand up a lightweight **component gallery/storybook surface** (a private `/dev/components` route or Ladle/Storybook — Storybook is heavier; a route-based gallery is cheaper and on-stack). This is the visual regression and review harness for the re-skin.

### 2.4 Per-surface redesign approach & sequencing

Sequence chosen so the **token + primitive foundation lands first**, then surfaces re-skin from highest-leverage/lowest-risk to most-specialized:

1. **Landing / marketing** (`src/components/landing/*`, `src/pages` home, About, Pricing, Features). Lowest data risk, highest first-impression payoff, exercises the new tokens on real layouts. Includes the `ValueProposition`, `LoggedInHero`, `RecentArticles` pieces recently touched in v0.6632.
2. **World & graph layer** (`src/components/world/*`, `src/components/timeline/*`, the `@xyflow/react` + `d3-force` graph, entity sidebar, dashboard, showcase, sharing dialogs). Re-skin only — **no data-model changes here yet**; this surface is where Pillar A and Pillar B meet, so it re-skins on current data and is revisited when Pillar B lands (see §5 interdependencies).
3. **The 21 tools** (`src/pages/tools/*` + `src/components/tools/*`). Batch by category accent (Stars & Systems / Worlds / Life / Civilizations / Mythology / Integration) so each batch validates one accent path through the token system. Worksheet shell, CollapsibleSection, FormField, export dialog, and result/readout components get re-founded once and inherited by all 21.
4. **Simulators** (`src/pages/simulators/*` + `src/components/simulators/*`: Rogue, Exosky, Exoforge, Tidelock, Solaris). Most specialized — canvas/2D drawing code currently hardcodes the cyan system, so this is where the cyan→token unification does the most file-level work. Each sim's paired `*Science` page re-skins with the tool batch; the interactive sim shell re-skins here. **(inferred: simulators are primarily canvas-2D per `CLAUDE.md`; `three`/`@react-three/fiber` are dependencies, so some 3D surfaces exist — confirm which sims are WebGL vs 2D in Phase A0.)**
5. **Exports** (`@react-pdf/renderer` PDF templates in `src/lib`, `docx`, Notion export edge function, clipboard/markdown). The export look-and-feel must track the new tokens — PDFs especially, since they bake colors at render time. Re-theme PDF/docx templates last so they target final tokens.

### 2.5 3D / Framer / canvas considerations

- **Canvas & WebGL can't read CSS variables directly.** Provide a tiny `getToken(name)` runtime helper (reads computed style once, caches) so simulator draw loops and any three.js materials pull from the same token source instead of literals. This is the mechanism that actually retires the 50 hardcoded cyan references without forking the palette.
- **Framer Motion:** centralize variants/transitions on the motion tokens; gate everything on `prefers-reduced-motion`.
- **Performance:** keep the delta-time camera smoothing and star-field budgets documented in `CLAUDE.md`; the re-skin must not regress simulator frame rate (add a perf check to the sim review checklist).

### 2.6 Accessibility (baked into Pillar A, not a bolt-on)

- Enforce WCAG AA contrast **as a token constraint** — the five-tier text hierarchy must hit 4.5:1 on each surface background; verify the dim tiers (tier-4/5) on actual panel colors, since low-opacity white-on-dark is the likely failure point.
- 44px minimum touch targets, visible focus rings (the v0.6602 work already started focus-ring hygiene — extend it system-wide), full keyboard nav, semantic HTML, `prefers-reduced-motion`.
- Wire the installed `design:accessibility-review` / axe-style checks into CI (§4.3) so a11y regressions block merge.

---

## 3. Pillar B — Cohesive, Deduplicated Database

### 3.1 Current schema — grounded inventory

From `src/integrations/supabase/types.ts` and the 50 migration files, the live data tables include:

`worlds`, `worksheets`, `entities`, `entity_connections`, `world_connections`, `world_entries`, `entity_worksheets`, `writing_entries`, `writing_entry_entities`, `world_versions`, `world_notes`, `world_tags`, `chronicle_events`, `simulation_saves`, `world_collaborators`, `world_comments`, `world_favorites`, `world_invites`, `world_link_shares`, `worksheet_link_shares`, `subscriptions`, `profiles`, `notion_connections`, `user_badges`, `user_audio_tracks`, `user_playlists`, `support_tickets`, `contact_submissions`, `roadmap_items`, `roadmap_votes`, `admin_todos`, `hidden_example_worlds`; plus the view `entity_connections_bidirectional` and RPCs such as `fork_world`, `save_world_snapshot`, `maybe_snapshot_world`, `compile_world_snapshot`, `cleanup_world_versions`, `accept_world_invite`, `get_shared_world`, `get_shared_worksheet`, `get_subscription_tier`.

### 3.2 Duplication & integrity audit — what to verify in Phase B0

These are the concrete overlap signals visible from table names + migration history. Each is a **hypothesis to confirm by reading the migration bodies and profiling real rows** before any change — that profiling *is* Phase B0.

1. **Two edge/relationship systems.** `world_connections` (introduced `20260221_add_world_versions_connections_entries.sql`) and `entity_connections` (introduced `20260404_add_entities_and_entity_connections.sql`, with a `entity_connections_bidirectional` view). Strong candidate for "two tables modeling graph edges," likely with overlapping/duplicated relationships. **Target: one canonical edge table.** (inferred)
2. **Two "thing in a world" content models.** `world_entries` (older codex/wiki entries — see `20260224_codex_entry_links`, `20260309_expand_entry_types_and_tags`) vs `entities` (the Apr-4 graph entity layer, `20260415_add_custom_entity_types`). The same character/place can plausibly exist as both a codex entry and a graph entity with no shared identity → duplication and drift. **Target: a single canonical "entity" as source of truth, with codex/wiki/graph as views/roles over it.** (inferred — highest-value and highest-risk dedup)
3. **Denormalized snapshot blobs.** `world_versions` + `compile_world_snapshot`/`save_world_snapshot`/`maybe_snapshot_world`/`cleanup_world_versions` store whole-world JSON copies for versioning/auto-snapshot. This duplicates live rows by design. **Target: keep versioning, but define whether snapshots are immutable history (fine) or are being read as live data (not fine); ensure they never become a second source of truth.** (inferred)
4. **Tags stored two ways.** `world_tags` (relational) plus a `tags` array column on worksheets (`20260131_add_worksheet_tags`, `20260214_fix_worksheets_tags_column`). **Target: one tagging model.** (inferred)
5. **Fork = deep copy.** `fork_world` duplicates an entire world's rows into a new world (the late-April `phase-0.5-*fork*` branches and `nervous-bhaskara`/`interesting-northcutt` worktrees were patching fork visibility/JOIN behavior). Forking inherently multiplies rows. **Target: decide copy-on-fork vs reference-with-overrides; at minimum ensure forks carry clean provenance FKs and don't orphan.** (inferred)
6. **Multiple text-content homes.** `world_entries`, `world_notes` (`20260311_multiple_world_notes`), `writing_entries` (`20260308`) + `writing_entry_entities`. Overlap risk between "notes," "entries," and "writing." **Target: clarify each model's role; merge where they're the same thing wearing two names.** (inferred)
7. **Subscription tier representation.** `subscriptions` + `subscription_tiers` (`20260306`) + `get_subscription_tier` + Stripe. **Target: one tier source of truth (Stripe-authoritative, mirrored once).** (inferred)
8. **Orphan/FK integrity sweep.** Profile for rows whose parent world/entity no longer exists, connections pointing at deleted nodes, worksheets/entries with null or dangling `world_id`, and missing `ON DELETE` rules. This is the "unlinked/orphaned data" the brief calls out. (certain that this sweep is needed; specific orphan counts unknown until profiled.)

**Phase B0 output:** a written audit (`docs/migrations/SF2_SCHEMA_AUDIT.md`) with, per signal above: confirmed/refuted, row counts, duplication rate, orphan counts, and the chosen canonical model. **No schema change ships before this exists.**

### 3.3 Target normalized model (single source of truth)

Direction (final shape set by the B0 audit):

- **`worlds`** — root aggregate, owner FK to `auth.users`, unchanged identity so existing IDs are preserved.
- **`entities`** — the canonical "thing in a world" (characters, places, objects, factions, custom types). Codex/wiki pages and graph nodes become *roles/views* over `entities`, not separate tables. `world_entries` content is migrated in as entities (or as a typed sub-record FK'd to an entity), retiring the parallel model.
- **`connections`** — one canonical edge table (`from_entity_id`, `to_entity_id`, `type`, `directionality`, `world_id`), replacing `world_connections` + `entity_connections`; the bidirectional view is rebuilt over it. Hard FKs with `ON DELETE CASCADE`/`SET NULL` as appropriate.
- **`tool_outputs` (worksheets)** — worksheet/tool results FK'd to `world_id` and optionally to an `entity_id` (replacing the `entity_worksheets` join if that relationship is 1:N; keep a join only if truly N:N). One tagging model (relational `tags` + `taggables`, or a single normalized array — decided in B0), not both.
- **`timeline` (chronicle_events)** and **`simulation_saves`** — FK'd cleanly to world/entity with integrity; confirm no duplicated event/state representations.
- **`world_versions`** — retained as immutable snapshot history only, explicitly *not* a live-data source.
- **Sharing/collab/social** (`world_collaborators`, `world_invites`, `*_link_shares`, `world_comments`, `world_favorites`) — keep, but verify FK integrity and RLS against the new canonical tables.
- **Billing/profile/admin/content** tables — largely untouched structurally; only tier dedup (#7) and FK hygiene.

Every table: explicit PK, explicit FKs with `ON DELETE` behavior, `created_at`/`updated_at`, and an RLS policy mirrored from or stricter than today.

### 3.4 Migration strategy (additive → backfill → cutover → rollback)

The cardinal rule: **never drop before the new model is proven on a full copy of production data.**

1. **Expand (additive).** New canonical tables/columns created alongside the old ones via forward-only migrations in `supabase/migrations/`. Nothing removed yet. App keeps reading old tables.
2. **Backfill.** Idempotent, re-runnable backfill scripts (SQL or a Supabase edge/Deno job) copy + deduplicate old rows into the canonical tables, writing a **provenance map** (old_id → new_id) so nothing is lost and the transform is auditable. Dedup logic is explicit and logged (which rows merged, on what key).
3. **Dual-read / verify.** Point reads at the new tables behind a flag while continuing to write both (or shadow-write), and run reconciliation: counts match, every old row maps to a new row, no orphan introduced, RLS spot-checks per role. Validate against a **restored copy of production**, not just dev seed data.
4. **Cutover.** Flip writes to canonical tables. Old tables retained read-only for a defined window.
5. **Contract (cleanup).** After the safety window and a clean Sentry/error window, drop deprecated tables/columns in a final migration.
6. **Rollback.** Because steps 1–4 are additive, rollback at any point = flip the flag back to old tables (still intact) and stop the backfill. The point-of-no-return is step 5; gate it behind explicit sign-off and a verified backup. Take a full `pg_dump`/PITR checkpoint before B-phase begins and before step 5.

**Data-preservation guarantees:** existing world IDs and ownership preserved; provenance map retained permanently; a per-user "world integrity" check (entity count, connection count, worksheet count before vs after) run and logged for every affected world.

---

## 4. Cross-Cutting Concerns

### 4.1 Stack continuity (Vite + Supabase retained)

- No Clerk, no Next.js. React Router stays. Supabase Auth stays.
- **Action:** add a banner to the top of `docs/STACK-ARCHITECTURE.md` marking it **ASPIRATIONAL — NOT CURRENT** (it presently describes a Clerk + Next.js target that the code does not implement), and either (a) write a short `STACK-CURRENT.md` describing the real Vite + Supabase-Auth + React-Router stack, or (b) rewrite STACK-ARCHITECTURE.md to match reality with the Clerk path moved to an explicit "Future / not scheduled" appendix. Recommend (a) for speed; do it in Phase 0 so all subsequent work references truth.

### 4.2 Stripe & Sanity continuity

- Stripe edge functions (`create-checkout-session`, `create-portal-session`, `stripe-webhook`) and the `subscriptions`/tier read path must keep working across the DB migration. Treat the subscription tier dedup (§3.2 #7) carefully: Stripe remains authoritative; Supabase mirrors it in exactly one place. Re-test checkout + portal + webhook on the restored-copy environment after cutover.
- Sanity (`@sanity/client`, `studio/`) is independent of the core DB work; the only touchpoint is re-skinning blog/Learn surfaces under Pillar A. No content migration needed.

### 4.3 CI / tests (wire up what's already installed)

Vitest, `@testing-library/react`, jsdom, and Playwright are in `devDependencies` but there is **no CI pipeline** (no GitHub Actions; `docs/ROADMAP.md` lists "GitHub Actions pipeline" and "Vitest + RTL" as still-to-do). StellarForge II is the moment to wire them, because both pillars need a safety net:

- **GitHub Actions:** typecheck (`tsc`), lint (eslint), `vitest run`, `playwright test`, and a build, on every PR.
- **Pillar A guardrails:** a token-lint step (grep/ESLint rule banning raw hex outside the token file), and Playwright visual snapshots of key surfaces (landing, a tool, a simulator) so the re-skin is regression-checked.
- **Pillar B guardrails:** migration tests against an ephemeral Postgres (Supabase local) — apply all migrations, run backfill on a seeded fixture, assert reconciliation invariants (no orphans, counts preserved, dedup correct, RLS holds per role).
- **Accessibility check** (axe) in CI per §2.6.

### 4.4 Sentry

- Sentry is wired and DSN-gated (`src/lib/sentry.ts`, `src/main.tsx`, `ErrorBoundary.tsx`; v0.6612–v0.6642). Keep it. During the DB cutover window it's the early-warning system — add release tagging per phase and watch the inbox before each "contract"/drop step. The existing `ignoreErrors` list and the sourcemap-gating fix (v0.6642) stay as-is.

---

## 5. Phased Roadmap, Milestones & Sequencing

> **The core interdependency:** Pillar A's *world/graph re-skin* (Surface 2) reads the data that Pillar B reshapes. So: re-skin landing + foundations first (no data dependency), do the DB audit + expand/backfill in parallel, and schedule the **world/graph and tool re-skins to consume the canonical data model once it's stable** — not before. Re-skinning tools twice (once on old schema, once on new) is the waste to avoid.

### Phase 0 — Foundations & Truth (no user-visible change)
- A0: confirm 2D-vs-WebGL per simulator; inventory every hardcoded color; stand up the component gallery route.
- B0: write `SF2_SCHEMA_AUDIT.md` — confirm/refute each duplication signal in §3.2 with real row counts and orphan profiling. **Gate: no schema change before this is signed off.**
- X: flag `STACK-ARCHITECTURE.md` aspirational; add `STACK-CURRENT.md`; stand up GitHub Actions (typecheck/lint/test/build) and a restored-production-copy environment.
- **Milestone 0:** audits done, CI green, token+migration test harnesses exist.

### Phase 1 — Design Foundation
- Build canonical `tokens.css` + regenerated Tailwind config + `getToken()` runtime helper + `DESIGN-TOKENS.md`. Re-found `src/components/ui/*` primitives on semantic tokens. Token-lint in CI.
- **Milestone 1:** every UI primitive renders from canonical tokens; raw hex banned in `src/**`; gallery shows old vs new.

### Phase 2 — Re-skin (data-independent surfaces) ‖ DB Expand+Backfill (parallel)
- A: re-skin **landing/marketing** (Surface 1) and the **tool/worksheet shell + export templates** structurally (chrome only, not data wiring).
- B: ship **additive** canonical tables + **backfill + reconciliation** on the restored copy; produce the provenance map; dual-read behind a flag. Nothing dropped.
- **Milestone 2:** landing on new design in production; canonical DB proven on a full data copy with zero orphans and counts preserved (still behind flag).

### Phase 3 — Canonical-data cutover + world/graph & tools re-skin
- B: dual-read → **cutover** writes to canonical tables; old tables read-only.
- A: re-skin **world/graph layer (Surface 2)** and the **21 tools (Surface 3)** *on the canonical model*, batched by category accent.
- **Milestone 3:** whole app (minus simulators) on new design + new data model; rollback still available (old tables intact).

### Phase 4 — Simulators + cyan retirement
- A: re-skin **all simulators (Surface 4)** and their `*Science` pages; route canvas/WebGL draw code through `getToken()`; delete the last `#00D4FF`/`--sim-*` literals. Perf-check each sim.
- **Milestone 4:** cyan/teal divergence fully resolved; zero legacy-cyan references remain.

### Phase 5 — Contract, harden, polish
- B: after a clean Sentry window, **drop deprecated tables/columns** (point of no return — gated on sign-off + fresh backup).
- A: accessibility pass to AA across all surfaces; visual-regression snapshots locked; export (PDF/docx) re-theme verified.
- Update `CLAUDE.md`/`DESIGN.md`/`ROADMAP.md` to describe the unified system; bump to the StellarForge II version line.
- **Milestone 5 (StellarForge II GA):** one design system, one deduplicated schema, CI enforcing both, all user worlds intact.

*(No calendar durations attached — sequencing and gates are the contract. Add dates once you confirm solo-vs-help and any deadline; see Q5.)*

---

## 6. Risks, Mitigations & Open Questions

### 6.1 Risks (ranked)

1. **Data loss / corruption during DB migration — the dominant risk.**
   *Mitigation:* additive-then-cutover (never drop early); idempotent re-runnable backfills; permanent provenance map; reconcile on a **restored copy of production**; per-world integrity counts logged; full backup + PITR checkpoint before B-phases and before the final drop; rollback = flag-flip while old tables live.
2. **Dedup that merges rows it shouldn't** (two entities that *look* like duplicates but aren't).
   *Mitigation:* explicit, logged merge keys decided in B0; conservative default (keep separate when unsure); a human-reviewable merge report per world before cutover; preserve originals until Phase 5.
3. **Re-skinning tools twice** if the world/graph surface is re-skinned before the schema stabilizes.
   *Mitigation:* the §5 sequencing — data-independent surfaces first, data-coupled surfaces only post-cutover.
4. **RLS regression** exposing rows during the dual-table window.
   *Mitigation:* RLS policies authored with each additive migration; per-role reconciliation spot-checks in CI; the repo's existing RLS-hardening discipline as the baseline.
5. **Simulator visual/perf regression** from routing canvas colors through tokens.
   *Mitigation:* `getToken()` caches computed values (no per-frame CSS reads); perf check in the sim review checklist; Playwright visual snapshots.
6. **Stripe/tier mismatch** if subscription dedup changes the tier read path.
   *Mitigation:* Stripe stays authoritative; one mirror; full checkout/portal/webhook re-test post-cutover.
7. **Scope creep into the Clerk/Next migration** because STACK-ARCHITECTURE.md invites it.
   *Mitigation:* §4.1 explicitly flags it out of scope; non-negotiable #1.

### 6.2 Open Questions for Jason

1. **Cyan vs teal final call:** unify everything on teal and retire `#00D4FF` entirely (my recommendation), or keep a *governed* simulator accent token that's distinct-but-traceable? (Drives §2.2 and Phase 4 scope.)
2. **Entity vs codex unification (the big one):** are `world_entries` (codex/wiki) and `entities` (graph) meant to be the *same underlying thing* (so we merge to one canonical entity), or genuinely distinct concepts that should stay separate but get clean FKs? Your answer sets the single highest-value/highest-risk dedup in Pillar B.
3. **Fork semantics:** should forking keep deep-copying a world (isolated but duplicative), or move to reference-with-overrides? Affects the canonical model and the dedup math.
4. **Snapshots (`world_versions`):** confirm they're purely immutable history and nothing reads them as live data. If anything does, that's a hidden second source of truth to unwind.
5. **Resourcing & deadline:** solo or with help, and is there a target date? That's all I need to attach real durations to the §5 phases.
6. **Acceptable downtime for cutover:** is a brief read-only maintenance window acceptable for the Phase 3 cutover, or must it be zero-downtime? (Changes how aggressive the dual-write needs to be.)
7. **Tagging model:** relational tags vs array columns — any product reason to keep both, or consolidate freely?

---

*Grounded in repo build v0.6642. Inferences are labeled; Phase 0 audits convert them to certainty before any irreversible change. Stay Vite + Supabase. Preserve every world.*
