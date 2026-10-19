# StellarForge II — Definitive Implementation Plan (v2)

**Status:** Definitive v2.3 · Authored 2026-06-11 (v2.1: codex/graph merge settled; v2.2: cyan/font/fork/cutover/resourcing settled, Rogue source located in-repo, **Phase 0 begun** — first artifacts in working tree, §5 Phase 0 status; v2.3: **Track S — Simulator Overhaul** added per Jason — sims get a full beautiful/smooth/effective overhaul, not just a re-skin; §3.7 + Phase 4 elevated) · Supersedes `STELLARFORGE_II_IMPLEMENTATION_PLAN.md` (Draft v1)
**Live-product rule:** StellarForge has paying users. Phase work lands in the working tree as reviewable artifacts; **nothing is committed or applied to production until Jason reviews.**
**Baseline build:** v0.6642 (`src/config/version.ts`, commit `ca04ffd`)
**Stack decision (locked):** STAY on Vite + React + TypeScript + Supabase (Postgres + Supabase Auth) + Vercel + Stripe + Sanity. **No Clerk. No Next.js.** `docs/STACK-ARCHITECTURE.md` and the Clerk items in `docs/ROADMAP.md` are flagged aspirational-not-current (§6.1).
**Scope:** Two pillars — (A) a ground-up, cohesive design & aesthetic system applied to every surface (landing, world/graph layer, all 21 tools, 5 simulators, exports), unifying the drifted token layers; and (B) a cohesive, deduplicated database — single source of truth, real foreign keys, no duplicate models — with existing user worlds migrated cleanly.

> **What changed from v1:** Draft v1 labeled its schema and design claims **(inferred)**. This version replaces those inferences with **verified facts** from reading the migration bodies, the generated Supabase types, `src/index.css`, `tailwind.config.ts`, and client usage greps. Several v1 hypotheses were corrected (no `--sim-*` CSS layer exists; "world_tags" is actually `worksheet_tags`; there is no `subscription_tiers` table) and two outright schema **bugs** were found that v1 missed (§4.3). The Phase 0 audits shrink accordingly: most of B0 is done; what remains is **row-level profiling against production data**, which cannot be done from the repo.

---

## 1. Vision & Non-Negotiables

### 1.1 The two pillars

**Pillar A — One design system, everywhere.** Today the product carries three visual layers that have drifted: (1) the site-wide `--sf-*` teal "instrument panel" system in `src/index.css` (3,427 lines), (2) a **legacy cyan system that exists only as ~24 files of hardcoded `#00D4FF` literals** plus the `simulators/Rogue/SIMULATOR_AESTHETIC.md` spec (there is *no* `--sim-*` CSS variable layer — the drift is worse than a parallel token set; it's untokenized), and (3) the shadcn semantic layer (`--primary`, `--card`, `--sidebar-*`) mapped on top. Beyond those: **811 raw hex literals across 114 files**, two competing text-hierarchy token sets (`--t1…--t5` and the "Aesthetic Bridge v2.2" `--sf-text-*` set), a fifth font (Space Grotesk) still specified for simulator headers, and PDF exports themed in a **pre-teal cyan brand** (`#007a7a` / `#00E5E5` in `src/lib/pdf/styles.ts`). StellarForge II collapses all of this into one governed three-tier token architecture and re-skins every surface against it.

**Pillar B — One database, no duplicates.** The schema grew across ~50 migrations (2026-01-19 → 2026-04-28) by accretion, and the audit confirms the result: **two live edge tables with incompatible semantics** (`world_connections` linking worksheets/entries vs `entity_connections` linking graph entities), **two live "thing in a world" content models** (`world_entries`, used in 15+ client files, vs `entities`, used in 3), **five separate tag homes**, a **fork function that deep-copies five tables but silently drops three others and breaks outline hierarchy**, **snapshots that omit the entire graph layer**, a join table whose name lies about what it joins (`entity_worksheets` actually joins `world_entries`), and a link table whose FK points at the wrong table (`writing_entry_entities.entity_id → world_entries`). StellarForge II establishes one canonical model with real FK integrity — without losing a single user world.

### 1.2 Non-negotiables (hard constraints)

1. **Stay on Vite + Supabase.** React 18 + TS + Vite + React Router; Supabase Postgres + Supabase Auth. No framework or auth swap.
2. **Existing user data is sacred.** Every world, entity, entry, worksheet, connection, snapshot, note, writing entry, chronicle event, and simulation save survives migration with relationships intact. Additive-then-cutover with tested rollback; never drop-and-recreate.
3. **RLS parity or better.** Every new/reshaped table ships RLS at least as strict as today's owner + collaborator + community-visibility pattern (§4.6). No row becomes more visible than it was.
4. **Billing & content continuity.** Stripe edge functions (`create-checkout-session`, `create-portal-session`, `stripe-webhook`) and Sanity keep working throughout. $4.99/mo Pro pricing unchanged. (Note: there is **no** `subscription_tiers` table — tier is a constrained column on `subscriptions` + `get_subscription_tier()`; this area needs only FK hygiene, not dedup. v1's signal #7 is retired.)
5. **Ship incrementally.** Both pillars roll out surface-by-surface behind existing routes; the site is shippable at the end of every phase.

### 1.3 Settled decisions (Jason, 2026-06-11 — not open questions)

1. **Full codex/graph unification.** `world_entries` (codex/wiki/documents) and `entities` (graph) **merge into a single unified entity model** — one canonical "thing in a world" table, single source of truth. No parallel structures, no dual content tables survive StellarForge II. Codex, wiki, outline, and graph become *views/roles over the one table*, not separate models. This is the highest-value dedup in Pillar B and the migration's center of gravity; the consolidation runs through the provenance map so every existing world survives intact. The Phase 0 production profiling (§4.1) informs *merge keys and taxonomy mapping* — it does not re-litigate whether to merge.
2. **Stack stays Vite + Supabase** (restating non-negotiable #1 as an explicit decision): no Clerk, no Next.js; `docs/STACK-ARCHITECTURE.md` is aspirational-not-current (banner applied in Phase 0).
3. **Cyan `#00D4FF` is RETIRED entirely.** No Tier-1 cyan primitive; `--sim-accent` aliases the product accent (teal/teal-bright). This includes the "Comm Channel" writing theme, which gets re-expressed on governed primitives during the writing-surface re-skin. CI watches the count to zero (hard ban at Phase 4).
4. **Space Grotesk is RETIRED.** Four fonts only (MD Nichrome / Jura / DM Sans / JetBrains Mono); simulator headers move to Jura.
5. **Fork stays copy-on-fork** (isolation is the product promise) — made *complete and correct* (fork v2 + the Phase-0 fix migration, §4.3).
6. **Cutover = brief READ-ONLY maintenance window with a user-facing warning** (not zero-downtime dual-write). This simplifies §4.4: the dual-write machinery shrinks to a verification aid; the flip happens inside the window with a banner + writes disabled, which removes the write-skew risk class entirely.
7. **Resourcing: "do all now."** Sequencing optimized for immediate, continuous execution — phases overlap where the dependency graph allows (Phase 1 token work can start while Phase 0 production profiling is awaited; see §5).
8. **Rogue is in-repo and overhaul-able.** The simulator iframe loads `/rogue/sim.html` → `public/rogue/sim.html`, a self-contained ~1,070-line static HTML app (source/spec copies under `simulators/Rogue/`), served same-origin and actively maintained in git. Jason's contingency ("if external, bring in-house or rebuild natively") resolves favorably — it's already in-house; the residual choice is rebuild-natively vs overhaul-in-place (**OQ6**, decided at Track S0; recommendation: rebuild natively). Former open question Q3 and risk #8 are retired.
9. **Simulators get a FULL OVERHAUL (Track S, §3.7), not just a re-skin** — beautiful (ground-up token-native redesign), smooth (perf pass: rendering, latency, load, frame rate), effective (IO clarity, Science explainers incl. a new Solaris science page, mobile, publish-to-world). Scheduled after Phase 0 as its own track with milestones S0–S3.

---

## 2. Verified Current State

### 2.1 Design system — facts

| Area | Verified state |
|---|---|
| Token files | `src/index.css` (3,427 lines, 97 hex refs) is the live source; `tailwind.config.ts` surfaces `sf.*`, `t1–t5`, fonts, `sf-*` spacing/shadow/blur scales. `design_handoff_April_2026/tokens.css` + `shared.css` are **unimported archives** (safe to leave; mark as archive). |
| Token layers | (1) `--sf-*` primitives, (2) shadcn semantics mapped onto them (`--primary` → `--sf-teal`, `--background` → `--sf-void`, full sidebar set), (3) **two text-hierarchy systems**: flat `--t1…--t5` *and* "Aesthetic Bridge v2.2" `--sf-text-primary/muted/ghost/label/hint`. No `--sim-*` layer exists anywhere. |
| Cyan footprint | `#00D4FF`/`sf-cyan` in **24 files** — not just simulators: all 5 simulator pages + Solaris UI, **6 graph components** (`src/components/graph/*`), StellarCartographer, OrbitalDiagram, PlanetSizeComparison, SurfaceGravity + HabitableZone tools, `EntitySidebar`, `WorldCustomTypes`, `entity-graph-types.ts`, `lib/writing/themes.ts` ("Comm Channel" theme), `example-world-data.ts`, and `index.css` itself (`--sf-cyan`, `--sf-glow-cyan`, writing-surface theme). |
| Raw hex | **811 occurrences / 114 files.** Worst: `index.css` (97), `lib/timeline/constants.ts` (52), `StellarCartographer.tsx` (27), `surface-gravity/data.ts` (13), `solaris/utils/starColor.ts` (8), 72 PDF templates (~3+ each). Note: some hex is *data, not theme* (star spectral colors, planet albedo) — the token lint must distinguish (§3.6). |
| Simulators | 5: **Rogue (iframe of the in-repo static app `public/rogue/sim.html`, ~1,070 lines, same-origin, actively maintained — fully re-skinnable; located 2026-06-11)**, ExoSky (2D canvas, Hipparcos star catalog), Solaris (three.js/`@react-three/fiber` WebGL — only sim *without* a Science page), Tidelock & Exoforge (tech unconfirmed — the one remaining A0 verification). All except Solaris have paired `*Science` pages. |
| Fonts | MD Nichrome self-hosted (`public/fonts/md-nichrome/`); Jura, DM Sans, JetBrains Mono **and Space Grotesk** from Google Fonts via `index.html`. Space Grotesk is the simulator-header font per `SIMULATOR_AESTHETIC.md` but absent from `CLAUDE.md`'s four-font law — a fifth-font drift to resolve. |
| UI primitives | 60 files in `src/components/ui/`: ~28 shadcn/Radix wrappers + custom StellarForge primitives (`glass-panel`, `bracket-panel`, `sf-divider`, `data-burst`, `badge` w/ shimmer, `eyebrow`, `stat-grid`, `status-pill`, etc.). Spot-checks show mixed token usage — e.g. `button.tsx` hardcodes `text-[#08110C]`; `glass-panel.tsx` hardcodes its glow gradient. |
| Exports | `@react-pdf/renderer` + **72 PDF templates** (Summary + Full per tool, world-bible, view-specific). `src/lib/pdf/styles.ts` themes them in **old cyan brand** `#007a7a`/`#00E5E5` — print colors must be explicit (no CSS vars in PDF), so the fix is a generated print palette, not var references (§3.5). |
| CI / tests | **No `.github/workflows/`. One placeholder test** (`src/test/example.test.ts`). ESLint configured; no stylelint; Vitest/RTL/Playwright installed but unwired. |
| Docs | `DESIGN.md`/`DESIGN.json` (schemaVersion 2, 2026-04-27, includes `legacy-cyan`), `SIMULATOR_AESTHETIC.md` (cyan spec, Space Grotesk), `docs/STACK-ARCHITECTURE.md` (describes **Clerk** + Vite — not Next.js — as canonical; it is not current), `docs/ROADMAP.md` (Clerk migration listed Priority 2, all unchecked). |

### 2.2 Database — verified duplication & integrity map

All claims below were verified by reading migration bodies and grepping client usage.

1. **Two edge tables, both live, incompatible semantics — CONFIRMED.**
   - `world_connections` (20260221, expanded 20260223): polymorphic edges — `source/target_worksheet_id` (FK→worksheets, CASCADE, nullable) **or** `source/target_entry_id` (FK→world_entries, CASCADE), + `connection_type` (default `'references'`), `description`. Written by `src/services/world-connections-crud.ts`, `use-connection-suggestions.ts`, `lib/export/world-snapshot.ts`.
   - `entity_connections` (20260404): strict entity↔entity edges with the **richer model** — `relationship_type` + `relationship_label`, `cascade_stage` (physics→culture + cross_cascade), `bidirectional`, `strength` 1–10, `status` (active/historical/potential/severed), `time_start/end`, `metadata`, UNIQUE(world_id, source, target, relationship_type), plus the `entity_connections_bidirectional` view. Written by `src/services/entity-graph-crud.ts`, `WorldShowcase.tsx`.
   - No migration path between them exists. No bidirectional view exists for `world_connections`.
2. **Two content models, both live — CONFIRMED.**
   - `world_entries` (20260221 + 20260223 tree/`parent_id`/icon/color + 20260309 tags & ~30 entry types): manifest, wiki/codex, **and documents** (`document_versions` FKs to it; entry types span notes/milestones, semantic types like `character`/`planet`/`faction`, and 13 tool-output types like `habitable_zone`/`gravity_profile`). Used in **15+ client files** (wiki, documents, exports, connections).
   - `entities` (20260404): graph nodes — `entity_type` (14 values + custom + `custom_type_label`), `cascade_stage`, `parent_entity_id` (SET NULL), `graph_x/y`, `pinned`, `tags`, `metadata`. Used in **3 client files** (`entity-graph-crud.ts`, `WorldShowcase.tsx`, entity-prepopulate). `CreateElementDialog.tsx` carries a comment calling entities "the canonical model post-unification" — the intent exists; the unification doesn't.
   - The same character/place can exist in both with no shared identity. **No bridging column between them.**
3. **`entity_worksheets` is misnamed — CONFIRMED.** Its `entity_id` FKs **`world_entries(id)`**, not `entities(id)` (20260312, with a backfill from `world_entries.tool_data_id`). Semantics in practice: which worksheet sourced an entry, with `is_primary`.
4. **BUG — `writing_entry_entities.entity_id` FKs `world_entries(id)`** (20260402), not `entities(id)`, despite the name. Also has loose RLS (`auth.uid() IS NOT NULL`).
5. **Snapshots omit the graph layer — CONFIRMED.** `world_versions.snapshot_data` (format v2 per 20260226) includes world meta, worksheets, world_notes, world_connections, world_entries, chronicle_events — **but NOT `entities` or `entity_connections`**. The graph is currently unversioned. There is **no restore RPC** — restore would be client-side deserialization (today effectively read-only history). `cleanup_world_versions` caps retention; `document_versions` separately versions documents (20-row cap per doc via trigger).
6. **Fork = lossy deep copy — CONFIRMED (worse than v1 assumed).** `fork_world` (20260405) validates visibility/license, then copies: worlds row (with `forked_from` provenance, SET NULL on source delete), **entities** (with old→new UUID remap; `parent_entity_id` remap attempted post-loop, correctness unverified), **entity_connections** (remapped), **worksheets**, **world_entries** (**`parent_id` NOT remapped → forked outlines/wiki trees orphan/flatten — data-integrity bug**), **world_notes**. It does **not** copy: `world_connections`, `chronicle_events`, `document_versions`, `world_versions`. Forks today silently lose timelines, entry-level connections, and document history.
7. **Tags live in five places — CONFIRMED.** `TEXT[]` arrays on `worksheets` (GIN + usage trigger), `world_entries` (GIN), `entities` (GIN), `world_notes` (no index), plus the `worksheet_tags` per-user dictionary (UNIQUE(user_id, name), color, usage_count — maintained by trigger **only for worksheets**). One taxonomy, five disconnected homes; autocomplete/usage stats only work for worksheets. *(v1 called this table `world_tags` — wrong; it's `worksheet_tags`.)*
8. **FK / user-deletion hygiene.** `world_id` FKs are consistently CASCADE (good). Gaps: `created_by`/`user_id` on `world_entries`, `world_connections`, `world_versions` FK `auth.users` with **no ON DELETE behavior** → user deletion orphans rows. `world_entries.parent_id` is CASCADE (deleting a parent entry **destroys its whole subtree** — likely surprising; `entities.parent_entity_id` is SET NULL, the saner default). `writing_entries.world_id` is SET NULL (intentional: writing survives world deletion). `world_connections` post-20260223 nullable source/target columns lack an exactly-one-of constraint.
9. **Subscriptions are fine.** Stripe-authoritative; `subscriptions` mirror written by webhook (service role only); `tier` column ('pro'|'vanguard') + `get_subscription_tier()`. **No `subscription_tiers` table exists.** Out of dedup scope; only verify continuity at cutover.
10. **RLS pattern.** Owner-based + collaborator-aware (editor role for writes), community/public visibility bypass for SELECT (20260405-06 fixes), SECURITY DEFINER `get_shared_world`/`get_shared_worksheet` for link shares. Known gap: some tables' policies lack a viewer-role branch.

---

## 3. Pillar A — Design & Aesthetic Overhaul

### 3.1 Token architecture: three governed tiers

One canonical file, `src/styles/tokens.css` (imported first by `index.css`, which shrinks to component styles only), plus a generated TS mirror for non-CSS consumers:

```
Tier 1 — PRIMITIVES (raw ramps; never referenced by components)
  --color-navy-950 … --color-navy-800        (void / surface / elevated)
  --color-teal-500 / --color-teal-300        (#15C17B / #3DFFCD)
  --color-amber-*, --color-emerald-*, --color-violet-*, --color-azure-*,
  --color-crimson-*, --color-stellar-*, --color-magenta-*
  (cyan #00D4FF enters as --color-cyan-400 ONLY if Q1 keeps a sim accent; otherwise it does not exist in Tier 1)

Tier 2 — SEMANTIC (what components consume)
  Surfaces:  --surface-void / --surface-panel / --surface-elevated / --surface-canvas (#09090B, sims)
  Text:      --text-1 … --text-5            ← SINGLE hierarchy; --sf-text-* "Aesthetic Bridge" set
                                               and --t1…--t5 both alias to these during transition, then retire
  Accent:    --accent / --accent-glow / --accent-on-accent
  Category:  --cat-stars / --cat-worlds / --cat-life / --cat-civ / --cat-myth / --cat-integration
  Status:    --ok / --warn / --danger / --info
  Lines:     --border-subtle (8% white) / --border-strong / --focus-ring
  Glow:      --glow-tint (6%) / --glow-border (15%) / --glow-shadow (20% bright)   ← the 0.06/0.15/1.0 pattern as tokens
  Motion:    --duration-* / --ease-*          (promoted from index.css)
  Z-index:   --z-content / --z-fab / --z-header / --z-toast / --z-player / --z-critical  (CLAUDE.md table, tokenized)
  Radius:    --radius-0/2/3/4 (sharp-edge ladder)   Spacing: keep sf-1…sf-24

Tier 3 — COMPONENT/SURFACE (only where a surface legitimately differs)
  Simulator shell:  --sim-surface (rgba(15,15,16,.92)), --sim-radius (8px), --sim-accent → var(--accent)  [SETTLED: cyan retired]
  Print/PDF:        generated palette (§3.5)
  Writing themes:   each theme in lib/writing/themes.ts re-expressed as a Tier-3 token set over Tier-1 primitives
```

**Mechanics:**
- `tailwind.config.ts` regenerated to resolve `sf.*`, `t1–t5`, and shadcn semantics **through Tier 2 only**. shadcn vars (`--primary` etc.) become aliases of semantic tokens — third-party shadcn components inherit automatically.
- **`src/styles/tokens.ts` — generated** (build script from tokens.css, or vice versa): a typed object for canvas/WebGL/PDF/three.js code. Plus a runtime `getToken(name)` helper (reads computed style once, caches, invalidates on theme change) for code that must track live CSS. Canvas draw loops use the cached object — **never per-frame `getComputedStyle`**.
- **Theme-vs-data rule:** spectral star colors, planet albedos, timeline *event-category* colors are **data palettes**, not theme tokens. They move to named exported palettes (`lib/palettes/`) — exempt from the hex lint but centralized, so they're still single-source.

**Cyan resolution (recommendation):** unify on teal site-wide; retire `#00D4FF` everywhere *except* possibly the simulator canvas accent, expressed as one Tier-3 token. My recommendation is full retirement — teal-bright `#3DFFCD` reads as well on `#09090B` as cyan does, and the graph components already mix both today (which is exactly the incoherence II exists to kill). Final call is **Q1**. Space Grotesk retires with it; simulator headers move to Jura (**Q2**).

### 3.2 Component re-founding

Keep Radix + shadcn + CVA + tailwind-merge + Framer Motion. Work, in order:

1. **Re-found the ~32 custom primitives** (`glass-panel`, `bracket-panel`, `badge`, `sf-divider`, `data-burst`, `status-pill`, `eyebrow`, `stat-grid`, …) on Tier-2 tokens; purge hardcodes found in spot-checks (`button.tsx` `text-[#08110C]` → `--accent-on-accent`; `glass-panel` glow gradient → `--glow-*`).
2. **Audit the ~28 shadcn wrappers** — most inherit fixes via the semantic aliases; verify each.
3. **Tone prop contract:** primitives accept `tone?: 'accent' | 'stars' | 'worlds' | 'life' | 'civ' | 'myth' | 'integration' | 'danger'` resolving to category tokens — kills per-tool bespoke CSS across the 21 tools.
4. **Gallery route** `/dev/components` (auth-gated, lazy, excluded from prod nav): every primitive × tone × state. This is the visual-review and Playwright-snapshot harness. (Cheaper than Storybook, stays on-stack.)
5. **Motion:** central variants file on motion tokens; `prefers-reduced-motion` honored globally.

### 3.3 Surface-by-surface re-skin sequence

Ordered by leverage ÷ risk, and by the Pillar-B dependency (data-coupled surfaces re-skin **after** schema cutover so they're built once):

| # | Surface | Files | Data-coupled? | Notes |
|---|---|---|---|---|
| 1 | **Landing/marketing** | `components/landing/*` (6), `Index/AboutUs/Features/Pricing/Guide/Contact/Roadmap`, legal, Learn (Sanity) | No | First proof of tokens on real layouts; continues v0.6632/0.6602 cleanup momentum. |
| 2 | **Shells & chrome** | Header/Footer/FABStack, Auth/Join/Profile, Community/Collection/Bookshelf, tool & worksheet *shells* (`CollapsibleSection`, `QuestionSection`, FormField, export dialog chrome, SectionNavigation) | No | Re-founding the shared shells here means each of the 21 tools later inherits 80% of its re-skin for free. |
| 3 | **The 21 tools** (`pages/tools/*`) | Batched by category accent: Stars & Systems → Worlds → Life → Civilizations → Mythology → Integration | Worksheet data only (schema-stable) | Each batch validates one `tone` path. The two cyan-contaminated tools (SurfaceGravity, HabitableZone) and the cyan viz components (OrbitalDiagram, PlanetSizeComparison, StellarCartographer) get their literals routed through tokens here. |
| 4 | **World & graph layer** | `components/world/*` (35), `components/graph/*` (6), `pages/World*` (10), timeline, wiki, sharing | **YES — after B cutover** | The 6 graph components are cyan-heavy AND read `entities`/`entity_connections`; `EntitySidebar`/wiki read `world_entries`. Re-skinning before the model unifies means doing it twice. This is the pillar-interlock (§5). |
| 5 | **Simulators — ELEVATED to Track S (§3.7), a full overhaul, not a re-skin** | All 5 sims + `*Science` pages | simulation_saves; publish-to-world touches canonical model | Beautiful + Smooth + Effective; cyan retirement and Space Grotesk removal complete here. See §3.7 for scope, milestones, dependencies. |
| 6 | **Exports** | 72 PDF templates + `lib/pdf/styles.ts`, docx, Notion edge function, markdown/clipboard | Reads canonical model post-B | Last, so they bake **final** tokens. §3.5. |

### 3.4 Canvas / WebGL / iframe mechanics

- **2D canvas + three.js:** import the generated `tokens.ts` object (zero runtime cost). Solaris materials (`StarObject`, `PlanetObject`, `OrbitalPath`, `HabitableZone`) take theme colors from it; **star spectral colors stay data** (`starColor.ts` → `lib/palettes/spectral.ts`).
- **Rogue iframe (RESOLVED):** the embedded app is `public/rogue/sim.html` in this repo — a single self-contained static HTML file served same-origin (dev/spec copies in `simulators/Rogue/`). Re-theme path if kept as an iframe: its inline CSS consumes the token values directly (static include or generated CSS snippet); no postMessage bridge needed. One `#00D4FF` literal in the deployed file; `public/rogue/science.html` re-skins with it. Note `simulators/Rogue/index.html` (908 lines) appears to be an older source copy — confirm which file is authoritative (Track S0). **Superseding consideration (v2.3):** under Track S (§3.7) the recommendation is to rebuild Rogue natively rather than re-theme the iframe — see OQ6.
- **Writing-surface themes** (`lib/writing/themes.ts`): user-facing theme presets (incl. "Comm Channel" cyan). These are *product features*, not drift — re-express each over Tier-1 primitives. **SETTLED:** cyan is retired entirely, including here — Comm Channel gets re-expressed on governed primitives (teal/azure family) during the writing-surface re-skin.

### 3.5 Exports / PDF

PDFs can't read CSS vars; the fix is **generation, not var references**: a `lib/pdf/palette.ts` derived from Tier-1 primitives at build time, with print-legibility transforms (darken accents for white paper — today's `#007a7a` was exactly that for the old cyan; regenerate the equivalent from teal). One palette module replaces the hardcodes in `styles.ts` and the ~72 templates' inline colors. Word/docx and Notion exports consume the same module. Re-verify the WCAG-on-white contrast of derived print colors.

### 3.6 Guardrails (CI — wired in Phase 0)

- **GitHub Actions:** typecheck, ESLint, `vitest run`, build on every PR; Playwright on main.
- **Token lint:** CI grep/ESLint rule banning `#hex` and `hsl(...)` literals in `src/**` outside `src/styles/tokens.css`, `lib/palettes/**`, `lib/pdf/palette.ts`. Ratcheted: baseline **909** (recorded 2026-06-11 with the exact enforcement command in `.github/workflows/sf2-guardrails.yml`; the audit's ~811 used different globs) may only decrease per PR — a hard ban day-one would block all work.
- **Visual regression:** Playwright snapshots of gallery + one page per surface class.
- **Accessibility:** axe checks in CI; AA contrast verified **per text tier per surface** — tier-4 (28% white) and tier-5 (15% white) will fail 4.5:1 on panels; resolve by policy (tier-5 = decorative-only, never informational; bump tier-4 where it carries meaning) and encode the policy in `DESIGN-TOKENS.md`. 44px touch targets; focus-ring tokens continue the v0.6602 work.

**Deliverables for Pillar A:** `src/styles/tokens.css` + generated `tokens.ts` + `lib/palettes/*` + `lib/pdf/palette.ts` + re-founded `components/ui/*` + `/dev/components` gallery + `DESIGN-TOKENS.md` (supersedes the scattered guidance; `DESIGN.md`/`DESIGN.json`/`SIMULATOR_AESTHETIC.md` updated or archived) + CI guardrails.

### 3.7 Track S — Simulator Overhaul (added v2.3; directive from Jason, 2026-06-11)

**Mandate:** all five simulators (Rogue, ExoSky, Exoforge, Tidelock, Solaris) made **beautiful, smooth, and effective** — a ground-up overhaul, **not** the re-skin originally scoped as Surface 5. Scheduled after Phase 0; runs as its own track with its own milestones (roadmap slot: Phase 4, but sub-milestones can start earlier where dependencies allow — see S-milestones below). *Do not start before Phase 0 completes.*

**Three workstreams per simulator:**

1. **BEAUTIFUL — ground-up visual redesign on the token system.** Not "swap the colors": rethink each sim's panel layout, hierarchy, and instrument-panel chrome against the Tier-2/Tier-3 tokens (`--sim-canvas`/`--sim-surface`/`--sim-accent`→teal). This is where cyan `#00D4FF` and Space Grotesk **fully die** (settled decisions #3–4). `SIMULATOR_AESTHETIC.md` is rewritten as a token-native spec (or folded into `DESIGN-TOKENS.md`) instead of archived. Canvas/WebGL draw code pulls from `tokens.ts`; star spectral colors stay data palettes.

2. **SMOOTH — a real performance pass, with budgets.** Per sim: profile then fix — three.js/`@react-three/fiber` rendering (Solaris: draw calls, material reuse, geometry instancing for star fields/asteroid belts, `frameloop="demand"` where the scene is static), 2D-canvas frame cost (ExoSky and the TBD sims: offscreen buffering, dirty-region redraws, devicePixelRatio handling — the repo already did high-DPI work in `f6e294e`), **interaction latency** (slider→render round trip; no React re-render in the draw path), **load time** (lazy-load each sim route + its three.js chunk; Solaris should not be in the main bundle), and **frame rate** (budget: 60fps desktop / 30fps floor on mid-tier mobile, measured not vibes). Keep the delta-time camera smoothing and star-field budgets from CLAUDE.md. Budgets get a Playwright/perf-trace check so they can't silently regress.

3. **EFFECTIVE — UX + functional improvements.** Per sim: clarity of **inputs** (controls labeled in plain language with unit hints, sensible defaults, presets for common scenarios) and **outputs** (readouts that tell a writer what this *means* for their world, not just numbers); the **paired `*Science` explainer** reviewed and upgraded (accuracy, narrative usefulness, links into the relevant tools); **author the missing Solaris science page** (only sim without one); **mobile behavior** (touch targets, panel collapse/sheet patterns, pinch-zoom on canvases, portrait layouts); and the **publish-to-world / simulation_saves flow** polished (saves → world content is the sims' bridge into the cascade — this is where Track S touches Pillar B).

**Rogue gate — resolved, with a residual decision.** Jason's directive anticipated Rogue's source might be external (in which case: bring it in-house or rebuild natively). Phase-0 finding: **it is already in-house** — `public/rogue/sim.html`, a single ~1,070-line static HTML file with inline JS/CSS, iframed same-origin (older copy at `simulators/Rogue/index.html`; authority to be confirmed). So the gate passes — Rogue *can* be overhauled. The residual decision (**OQ6**): overhaul it **in place** as the static file (cheapest, keeps its self-contained physics; tokens via a generated CSS include) vs. **rebuild it natively** as a React route like the other sims (full token/router/mobile-shell/simulation_saves integration; kills the iframe seam; more work). **Recommendation: rebuild natively** — "beautiful, smooth, effective" is hard to deliver through an iframe boundary (no shared fonts/tokens without duplication, separate scroll/touch context on mobile, no shared state for publish-to-world), and the physics core can be ported as a module rather than rewritten.

**Per-sim inventory (start of track):**

| Sim | Tech | Science page | Known issues going in |
|---|---|---|---|
| Rogue | static HTML iframe (in-repo) | yes | iframe seam; OQ6 rebuild decision; 1 cyan literal; dual source copies |
| ExoSky | 2D canvas (Hipparcos catalog) | yes | heavy cyan use; catalog render perf unprofiled |
| Exoforge | TBD (A0 confirm) | yes | tech unconfirmed; cyan |
| Tidelock | TBD (A0 confirm) | yes | tech unconfirmed; cyan; was the chrome reference for `f6e294e` |
| Solaris | three.js / R3F WebGL | **missing — author it** | cyan in UI/controls; bundle weight; draw-call profile unknown |

**Track S milestones:**
- **S0 — Baseline audit** (can start immediately after Phase 0): per-sim measurements — FPS desktop/mobile, load time/bundle split, interaction latency, tech confirmation (Tidelock/Exoforge), UX issue list per sim, Rogue source-copy authority. Output: `docs/SIM_OVERHAUL_AUDIT.md` with the per-sim budgets. OQ6 decided here.
- **S1 — Smooth:** perf budgets met per sim (lazy-loaded routes, profiled draw paths). *Dependency: none beyond Phase 0 — can run before/alongside the visual work.*
- **S2 — Beautiful:** token-native redesign shipped per sim; zero `#00D4FF`, zero Space Grotesk (CI cyan-watch flips to hard fail). *Dependency: Phase 1 tokens + primitives.*
- **S3 — Effective:** input/output clarity pass, Science pages upgraded + Solaris science page authored, mobile patterns shipped, publish-to-world flow polished. *Dependency: the publish-to-world piece lands after the Phase-3 cutover (it writes world content → canonical entities); everything else in S3 is data-independent.*
- **Gate M4 = S1+S2+S3 complete for all five sims.**

**Dependencies summary (design ↔ perf ↔ data):** S0/S1 need only Phase 0 · S2 needs Phase 1 (tokens) · S3's publish-to-world needs Phase 3 (canonical model); Science pages, mobile, and IO clarity don't · Rogue's path through all three depends on OQ6 · Exports of sim results (PDF) ride Phase 5 as before.

---

## 4. Pillar B — Cohesive, Deduplicated Database

### 4.1 What remains to audit (Phase B0 is now small)

Schema-level duplication is **verified** (§2.2) and the merge itself is **decided** (§1.3). B0 shrinks to what only production data can answer — all of it in service of executing the merge well, none of it re-opening the merge:

- **Row profiling:** counts per table; how many `world_entries` and `entities` coexist per world; candidate-duplicate pairs (same world, similar name, compatible type) and their rate; orphan counts (dangling `created_by`, entries whose `tool_data_id` worksheet is gone, connections at deleted endpoints); how many worlds actively use the graph vs the codex vs both.
- **Snapshot usage:** does anything in production read `world_versions.snapshot_data` beyond the VersionHistory UI; size distribution of snapshots.
- **Fork inventory:** how many forked worlds exist (`forked_from IS NOT NULL`), and how many have broken entry trees (orphaned `parent_id`) from the fork bug — these need **repair**, not just migration.
- **`writing_entry_entities` rows:** how many exist and what they actually point at (decides the §4.3 fix path).
- Output: `docs/migrations/SF2_SCHEMA_AUDIT.md` with numbers, merge-key decisions, and per-finding confirm/refute. **Gate: no DDL ships before sign-off.**

### 4.2 Target model — single source of truth

`worlds` stays the root aggregate with unchanged IDs. The center of gravity:

**`entities` becomes the one canonical "thing in a world" — DECIDED (§1.3): full merge, no parallel structures.** The merge direction is *into* `entities` (the richer model, and the one the code already calls "canonical post-unification"), fully absorbing `world_entries`; `world_entries` does not survive past Phase 5:

```sql
entities (canonical, extended)
  id, world_id FK CASCADE, user_id FK CASCADE,
  name, entity_type,            -- union of today's entity_type + world_entries.entry_type taxonomies
  kind,                          -- 'element' | 'document' | 'note' | 'tool_output'  (role discriminator)
  custom_type_label, cascade_stage,
  summary, content,              -- content absorbed from world_entries.content / document body
  icon, color, image_url, tags TEXT[],
  parent_entity_id FK SET NULL,  -- one hierarchy (replaces world_entries.parent_id; SET NULL not CASCADE)
  source_worksheet_id FK SET NULL,  -- replaces tool_data_id AND the misnamed entity_worksheets join (1:N confirmed)
  graph_x, graph_y, pinned, sort_order, metadata JSONB,
  created_at, updated_at, created_by FK SET NULL   -- explicit ON DELETE for user refs
```

- **Taxonomy mapping** (B0 deliverable): each of the ~30 `entry_type` values maps to (entity_type, kind) — e.g. `character` → (`character`, `element`); `habitable_zone` → (`tool_output:habitable_zone` or metadata, `tool_output`); `note`/`milestone`/`decision` → (`concept`/custom, `note`); `document` → (n/a, `document`). Wiki/codex/graph/outline become **views over one table** filtered by kind — not separate tables.
- **Dedup at merge:** where a world has both an entity and an entry that are the same thing (matched on B0 merge keys: normalized name + compatible type + same world), merge into one row, union tags, prefer the richer description, log both source IDs in provenance. **Conservative default: when unsure, keep both** (a duplicate is recoverable; a wrong merge isn't).

**`connections` — one canonical edge table**, superset of both ancestors:

```sql
connections
  id, world_id FK CASCADE, user_id FK CASCADE,
  source_entity_id FK CASCADE, target_entity_id FK CASCADE,   -- entities only; worksheet-endpoint edges
                                                              -- re-point to the worksheet's tool_output entity
  relationship_type, relationship_label,
  cascade_stage, bidirectional, strength, status, time_start, time_end,
  description, notes, metadata, sort_order, created_at, updated_at,
  UNIQUE(world_id, source_entity_id, target_entity_id, relationship_type)
```

- `world_connections` rows backfill in: entry endpoints map via provenance to entity IDs; worksheet endpoints map to that worksheet's `tool_output` entity (created during backfill if absent); `connection_type` → `relationship_type`; cross-system duplicate edges (same endpoints + type from both old tables) collapse to one. Rebuild `entity_connections_bidirectional` → `connections_bidirectional`.

**Documents:** `document_versions.document_id` re-points to the entity (kind='document') via provenance map. Same 20-version trigger.

**Tags — one model:** keep `TEXT[]` + GIN on `entities`, `worksheets`, `world_notes`, `writing_entries` (arrays are working well and RLS-simple), but promote the dictionary: `worksheet_tags` → **`user_tags`** (rename + widen), usage-count triggers extended to all tagged tables, giving one autocomplete/stats source. (Full relational `taggables` join is over-engineering for this product — recommend against; **OQ2** confirms.)

**Fork v2:** keep copy-on-fork semantics (isolation is the product promise; reference-with-overrides is a product change — **Q4**) but make it **complete and correct**: copy connections (remapped), chronicle_events (with `parent_id` + `linked_entry_id` remap), and remap the entity hierarchy properly; carry `forked_from` + add `forked_at`. Plus a **repair script** for existing forks with orphaned trees (count from B0).

**Snapshots v3:** `world_versions` stays immutable history, never live-read. `compile_world_snapshot` v3 includes the canonical entities + connections (closing today's graph-layer blindspot), with `format_version: 3`; old v1/v2 snapshots remain readable as-is (versioned deserializer). Decide restore semantics: recommend **fork-from-snapshot** (restore materializes as a new world or explicit overwrite via the same remap machinery as fork v2) rather than in-place mutation — **OQ1**.

**Hygiene sweep (same migration series):** explicit `ON DELETE` for every `auth.users` reference (`SET NULL` for `created_by`-style provenance, CASCADE for ownership); `world_notes` tags GIN index; exactly-one-of CHECKs where polymorphism remains; viewer-role RLS branches where missing.

### 4.3 The two bugs — fix early, independent of the big migration

**Status: fix migrations WRITTEN (Phase 0, 2026-06-11) — in the working tree for review, NOT yet applied to production.**

1. **`writing_entry_entities`** → `supabase/migrations/20260611_fix_writing_entry_entities_rls.sql`.
   Verification nuance found while writing the fix: the live client (`src/hooks/use-writing-entity-links.ts:91`) sources its IDs **from `world_entries`** — so the FK target *matches the data being written*; integrity is intact and re-pointing the FK now would **break the live linking feature**. The actual fixable bug today is the RLS: `USING (auth.uid() IS NOT NULL)` for ALL commands let any authenticated user read/create/delete any user's links. The migration replaces it with owner-scoped SELECT/INSERT/DELETE policies (initplan-safe `(SELECT auth.uid())` pattern per 20260215 convention) and adds a schema COMMENT documenting the misnamed FK so nobody "fixes" it prematurely. The FK re-point to canonical entities happens at the merge, via provenance.
2. **`fork_world`** → `supabase/migrations/20260611_fix_fork_world_completeness.sql`.
   Reading the function body surfaced **seven** defects, not two: ① `world_entries.parent_id` not remapped (trees flatten); ② entries copied without `icon`/`color`/`tags`/`tool_data_id`; ③ worksheets copied with no ID map (so nothing referencing them could remap); ④ `world_connections` not copied at all; ⑤ `chronicle_events` not copied at all (forks lose their timeline); ⑥ entities copied without `graph_x`/`graph_y`/`pinned` (graph layout lost); ⑦ `entity_worksheets` links not copied. The replacement function fixes all seven with clean two-pass ID-map remapping, keeps signature/validation/license/fork_count behavior identical (no client change needed), and documents what is *deliberately* not copied (world_versions, document_versions, simulation_saves). Existing forks damaged by ① still need a repair pass once B0 profiling counts them.

### 4.4 Migration strategy: expand → backfill → dual-read → cutover → contract

Cardinal rule: **never drop before the new model is proven on a full copy of production.**

0. **Safety:** PITR checkpoint + `pg_dump` before each migration phase; a restored-copy environment (Supabase branch or local) is stood up in Phase 0 and every step rehearses there first.
1. **Expand (additive):** new columns on `entities`, new `connections` table, `user_tags`, provenance table (below). Old tables untouched; app behavior unchanged. RLS authored with each table.
2. **Backfill (idempotent, logged):** SQL/Deno scripts copy + transform + dedupe. Re-runnable (upsert on provenance), chunked per world, resumable. Every transformed row writes provenance:

```sql
sf2_provenance (
  id bigserial PK,
  source_table text, source_id uuid,
  target_table text, target_id uuid,
  action text CHECK (action IN ('copied','merged','repointed','synthesized','skipped')),
  merge_key text,            -- which rule matched, for merged rows
  details jsonb,             -- e.g. both source ids of a merge, field-level conflict resolutions
  migrated_at timestamptz default now(),
  UNIQUE(source_table, source_id, target_table)
)
```

3. **Dual-read / verify:** data-access flag (`VITE_SF2_CANONICAL_READS`) flips reads to canonical tables in preview/staging while production writes continue to the old tables. *(Per settled decision #6 — read-only-window cutover — full production dual-write is NOT needed; the service-layer seam (`src/services/*-crud.ts`) still hosts the flag.)* Reconciliation invariants, run in CI against seeded fixtures and manually against the restored copy:
   - ∀ old row: a provenance row exists; merged rows have ≥2 sources accounted.
   - Per-world integrity counts logged (entities, connections, worksheets, events, notes — before vs after; merges explain any delta).
   - Zero dangling FKs in canonical tables; RLS spot-checks as owner / editor / viewer / community-visitor / link-share visitor.
   - Snapshot v3 round-trip on sample worlds; fork v2 round-trip preserves trees.
4. **Cutover (SETTLED: brief read-only maintenance window with user-facing warning):** announce in advance (banner + email); at window start, revoke writes app-wide (maintenance banner, read-only mode); run the **final delta backfill** (rows changed since the last full backfill — cheap because backfills are idempotent and provenance-keyed); run reconciliation one last time against live; flip the flag so reads AND writes target canonical tables; reopen. Old tables stay intact and read-only. Sentry release-tagged; watch one full week minimum. The window removes the write-skew risk class entirely — nothing can write the old tables while the delta copies.
5. **Contract (point of no return):** after a clean Sentry window + explicit sign-off + fresh backup: drop `world_entries`, `world_connections`, `entity_worksheets`, `writing_entry_entities` (old form), rename/finalize, regenerate `src/integrations/supabase/types.ts`. **`sf2_provenance` is retained permanently.**
6. **Rollback:** any time before step 5 = re-enter a read-only window, flip the flag back to the old tables (still intact; any canonical-only writes since cutover are replayed back or accepted as loss within the announced window — kept tiny by cutting over only after a clean reconciliation). After step 5 = restore from backup (which is why 5 is gated). Each backfill script ships with an inverse/cleanup script for canonical-side abort.

### 4.5 Client-code migration surface

The service layer is the choke point: `entity-graph-crud.ts`, `world-connections-crud.ts`, hooks (`use-world-entities`, `use-wiki-page`, `use-tags`, `use-connection-suggestions`), `lib/export/world-snapshot.ts`, and `WorldShowcase.tsx`. Plan: introduce a single `services/canonical/` module exposing the unified model; old call sites migrate to it during the dual-read window; the 15-file `world_entries` read surface is the bulk of the work and lands with the world/graph re-skin (same files — §5).

### 4.6 RLS parity matrix

For each canonical table, author policies replicating today's five access paths — owner, collaborator-editor, collaborator-viewer (fixing today's gaps), community/public SELECT bypass, link-share via SECURITY DEFINER functions — and add a CI test that asserts each path on fixtures. The existing hardening history (initplan fixes, permissive-insert fixes, invite RLS) is the floor, not the ceiling.

---

## 5. Interdependencies, Phases & Milestones

**The interlock:** the world/graph surface (re-skin #4) reads exactly the tables Pillar B reshapes, and the graph components are also the most cyan-contaminated non-sim code. Therefore: foundations and data-independent surfaces first; DB expand/backfill in parallel; world/graph re-skin lands **together with** the canonical-model client migration (same files, one pass); simulators and exports close.

### Phase 0 — Truth & Safety Nets (no user-visible change) — **IN PROGRESS (started 2026-06-11)**

**Done — in working tree, awaiting Jason's review (HOLD git; nothing committed or applied):**
- ✅ Bug-fix migrations written: `supabase/migrations/20260611_fix_writing_entry_entities_rls.sql` + `20260611_fix_fork_world_completeness.sql` (§4.3).
- ✅ Token-foundation scaffold: `src/styles/tokens.css` (primitives → semantic → surface, shadcn aliases, cyan-free) + `src/styles/tokens.ts` (canvas/WebGL/PDF mirror + cached `getToken()`/`withAlpha()`). **Inert — not imported by the build yet**; activation is Phase 1.
- ✅ CI hex ratchet: `.github/workflows/sf2-guardrails.yml` + baseline `.github/sf2-hex-baseline.txt` = **909** (recorded with the exact enforcement command; the audit's ~811 used different globs). Includes an informational `#00D4FF` countdown that becomes a hard failure at Phase 4.
- ✅ `docs/STACK-ARCHITECTURE.md` flagged **ASPIRATIONAL — NOT CURRENT**.
- ✅ Rogue source located: in-repo, `public/rogue/sim.html` (settled decision #8).

**Remaining in Phase 0:**
- Jason: review + commit the above; **apply the two migrations** (staging/branch first, then production — they are forward-only and client-compatible).
- B0 production profiling (§4.1 — needs production DB access: row counts, coexistence/duplicate rates, orphan counts, damaged-fork count) → `docs/migrations/SF2_SCHEMA_AUDIT.md`. **Gate: no merge DDL before sign-off.**
- Restored-production-copy rehearsal environment + PITR/backup verification.
- Rest of CI: typecheck/lint/`vitest run`/build jobs (the guardrails workflow hosts them); Playwright + axe harness.
- `docs/STACK-CURRENT.md` (as-built stack reference); mark ROADMAP's Clerk items deferred-indefinitely.
- A0 remainder: confirm Tidelock/Exoforge rendering tech; classify the 909 hex literals theme-vs-data; confirm `public/rogue/sim.html` vs `simulators/Rogue/index.html` authority.
- **Gate M0:** CI green; audit signed off; rehearsal environment works.

### Phase 1 — Design Foundation
- `tokens.css` + generated `tokens.ts` + palettes; Tailwind regen; both legacy text-tier systems aliased; re-found all `components/ui/*` primitives; tone-prop contract; `/dev/components` gallery; `DESIGN-TOKENS.md`.
- **Gate M1:** every primitive renders from semantic tokens; gallery snapshot baseline locked; hex ratchet trending down.

### Phase 2 — Data-independent re-skin ‖ DB expand + backfill (parallel tracks)
- A: Surfaces 1–2 (landing/marketing; shells & chrome), then start Surface 3 tool batches (category by category).
- B: additive DDL → backfill + provenance on restored copy → reconciliation green → enable dual-write + dual-read flag in preview.
- **Gate M2:** landing + shells live on new design; canonical model proven on full production copy (zero dangling FKs, counts reconciled, RLS matrix passing). Nothing dropped.

### Phase 3 — Cutover + world/graph rebuild (the convergence phase)
- B: flip canonical reads/writes in production; old tables read-only.
- A+B together: world/graph layer re-skinned **and** re-pointed to `services/canonical/` in one pass (the 15-file surface); remaining tool batches finish; fork v2 + snapshot v3 ship; existing damaged forks repaired.
- **Gate M3:** whole app minus simulators on new design + canonical model; rollback still available; Sentry clean.

### Phase 4 — Track S: Simulator Overhaul (full scope in §3.7)
All five sims made **beautiful, smooth, effective** — a ground-up overhaul, not a re-skin (elevated v2.3 per Jason). Track S sub-milestones overlap earlier phases where dependencies allow ("do all now"):
- **S0 Baseline audit** — start immediately after Phase 0: perf measurements (FPS/load/latency), Tidelock+Exoforge tech confirmation, per-sim budgets, OQ6 Rogue rebuild-vs-in-place decision → `docs/SIM_OVERHAUL_AUDIT.md`.
- **S1 Smooth** (perf budgets met: rendering, interaction latency, load time, frame rate) — needs only Phase 0; can run alongside Phases 1–3.
- **S2 Beautiful** (ground-up token-native visual redesign; cyan + Space Grotesk fully die) — needs Phase 1 tokens.
- **S3 Effective** (input/output clarity, Science explainers upgraded, **new Solaris science page authored**, mobile patterns, publish-to-world polish) — the publish-to-world piece lands after the Phase-3 cutover (writes canonical entities); the rest is data-independent.
- **Gate M4 = S1+S2+S3 complete for all five sims**; zero `#00D4FF` outside governed palettes (CI cyan-watch flips from informational to hard failure); zero Space Grotesk.

### Phase 5 — Contract, exports, polish, GA
- B: drop deprecated tables (gated: clean Sentry week + sign-off + fresh backup); regen Supabase types; provenance retained.
- A: export/PDF re-theme (print palette); AA pass across all surfaces; visual baselines locked.
- Docs: CLAUDE.md / DESIGN-TOKENS.md / ROADMAP updated; version line bumped to the II series.
- **Gate M5 (StellarForge II GA):** one design system, one schema, CI enforcing both, every user world intact and verified by per-world integrity logs.

*(SETTLED: resourcing = "do all now." Gates remain the contract; execution is continuous and immediate, with phases overlapping where the dependency graph allows — e.g. Phase 1 token activation can proceed while B0 production profiling is awaited, and tool-batch re-skins (Surface 3) can run during the Phase 2 backfill. The only hard serialization points: no merge DDL before the B0 audit sign-off; no world/graph re-skin before cutover; no drop before the clean post-cutover week.)*

---

## 6. Risks (ranked) & Mitigations

1. **Data loss/corruption in the entries→entities merge** — the dominant risk; it's a *merge*, not a copy. → Conservative merge keys (keep-both default), permanent provenance, per-world integrity counts, full rehearsal on restored production copy, dual-write window, rollback = flag-flip, drop gated behind a clean week.
2. **Wrong merges** (two similar-named things that are genuinely distinct). → Merge report per world generated before cutover, human-reviewable; originals intact until Phase 5; provenance allows post-hoc unmerge.
3. **Edge-table consolidation drops semantics** (worksheet-endpoint edges have no entity analog until tool_output entities exist). → Backfill synthesizes tool_output entities first, then edges; `synthesized` provenance action makes these auditable.
4. **Double work on the world/graph surface** if re-skinned before cutover. → Hard sequencing rule (Phase 3 convergence); enforced in review.
5. **RLS regression during the dual-table window.** → Policies authored with the DDL, parity matrix tested in CI per role, existing hardening discipline as floor.
6. **Fork/snapshot machinery breaking mid-migration** (fork copies *old* tables until v2 lands). → Fork v2 + snapshot v3 land *with* cutover (Phase 3), not after; the standalone bug patch (§4.3) keeps pre-cutover forks from corrupting; consider briefly disabling forking during the cutover flip itself.
7. **Track S scope growth / regression.** The simulator overhaul (§3.7) is the largest single Pillar-A work item — five ground-up redesigns plus perf plus UX. → Per-sim budgets and issue lists fixed at S0 (no unscoped "while we're in here"); perf budgets enforced by trace checks so Smooth can't regress while Beautiful lands; build-time `tokens.ts` (no per-frame CSS reads); visual snapshots per sim; OQ6 decided before Rogue work starts.
8. ~~**Rogue iframe scope unknown.**~~ **RETIRED 2026-06-11** — source located in-repo (`public/rogue/sim.html`); re-skinnable like any sim.
9. **Stripe/tier continuity.** → No structural change planned (verified: no tier-table dedup needed); re-test checkout/portal/webhook on restored copy at cutover anyway.
10. **Scope creep toward Clerk/Next.** → Flagged out of scope in Phase 0 docs; non-negotiable #1.
11. **909-hex cleanup stalls as toil.** → Ratchet (never increases) + per-surface budgets attached to each re-skin batch, so cleanup rides the re-skin instead of being a separate slog.

---

## 7. Open Questions for Jason

*(Settled 2026-06-11 and moved to §1.3: codex/graph full merge; stack; cyan retirement incl. Comm Channel re-expression [was Q1/Q1b]; Space Grotesk retirement [Q2]; Rogue located in-repo [Q3]; copy-on-fork [Q4]; read-only-window cutover [Q7]; resourcing = "do all now" [Q8]. Remaining items renumbered; none block Phase 0–1 work — defaults below apply until overridden.)*

| # | Question | Drives | Recommendation (default until answered) |
|---|---|---|---|
| OQ1 | **Snapshot restore:** add restore as fork-from-snapshot / explicit overwrite, or leave snapshots view-only history? | §4.2 snapshots v3 (Phase 3) | Fork-from-snapshot. |
| OQ2 | **Tags:** arrays + one promoted `user_tags` dictionary, or full relational tagging? | §4.2 tags (Phase 2 DDL) | Arrays + dictionary. |
| OQ3 | **Entry-type taxonomy:** any of the ~30 `world_entries.entry_type` values dead/droppable (vs mapped) during the merge? | §4.2 taxonomy map (B0 output) | Map all; drop none without data proof. |
| OQ4 | **User deletion policy:** `created_by` traces on shared/collaborative worlds → SET NULL (keep content, anonymize) or CASCADE? | §4.2 hygiene (Phase 2 DDL) | SET NULL on provenance refs; CASCADE only on owned roots. |
| OQ5 | **Read-only window logistics:** acceptable window length and time-of-day; announcement lead time (banner days + email?) | §4.4 step 4 (Phase 3) | ≤60 min, low-traffic hour, 7-day banner notice. |
| OQ6 | **Rogue overhaul path:** rebuild natively as a React route (full token/mobile/saves integration, kills the iframe seam), or overhaul in place as the static HTML file (cheaper, keeps self-contained physics)? | §3.7 Track S (decided at S0) | Rebuild natively; port the physics core as a module. |

---

## Appendix A — Verified table inventory (live data tables)

`worlds`, `worksheets`, `worksheet_tags`, `entities`, `entity_connections` (+ `entity_connections_bidirectional` view), `world_connections`, `world_entries`, `entity_worksheets` (misnamed: joins world_entries↔worksheets), `writing_entries`, `writing_entry_entities` (buggy FK), `document_versions`, `world_versions`, `world_notes`, `chronicle_events`, `simulation_saves`, `entity_type_templates`, `entity_type_fields`, `world_collaborators`, `world_comments`, `world_favorites`, `world_invites`, `world_link_shares`, `worksheet_link_shares`, `subscriptions`, `profiles`, `notion_connections`, `user_badges`, `user_audio_tracks`, `user_playlists`, `support_tickets`, `contact_submissions`, `roadmap_items`, `roadmap_votes`, `admin_todos`, `hidden_example_worlds`.
RPCs: `fork_world`, `compile_world_snapshot`, `save_world_snapshot`, `maybe_snapshot_world`, `cleanup_world_versions`, `accept_world_invite`, `get_shared_world`, `get_shared_worksheet`, `get_subscription_tier`, `has_active_subscription`.

## Appendix B — Old → canonical mapping summary

| Today | StellarForge II | How |
|---|---|---|
| `world_entries` | `entities` (kind: element/document/note/tool_output) | Backfill + taxonomy map + dedup-merge; provenance per row |
| `entities` | `entities` (extended) | In-place ALTERs; IDs preserved |
| `world_connections` | `connections` | Endpoints → entity IDs via provenance; worksheet endpoints → synthesized tool_output entities |
| `entity_connections` | `connections` | Near-1:1 column carryover; IDs preserved where possible |
| `entity_worksheets` | `entities.source_worksheet_id` | 1:N confirmed → column, not join table |
| `writing_entry_entities` | re-pointed link table → `entities` | Bug fix + provenance re-point; RLS tightened |
| `document_versions.document_id` | → entity (kind='document') | Provenance re-point |
| `worksheet_tags` | `user_tags` | Rename + widen usage triggers to all tagged tables |
| `world_versions` (v1/v2 JSON) | retained; new snapshots format v3 incl. graph | Versioned deserializer; immutable history only |
| `fork_world` | fork v2 (complete, remapped) + repair of damaged forks | New function at cutover; standalone bug patch in Phase 0 |

---

*Grounded in repo build v0.6642 with migration bodies and client usage verified 2026-06-11. Stay Vite + Supabase. Preserve every world. These worlds exist in you — and in exactly one table.*
