# StellarForge Development Roadmap

Active task list and development priorities. Review this at the start of each session — if current work touches a task below, flag it.

**Convention:** Mark tasks `[x]` when complete. Add date completed in parentheses.

---

## Priority 1 — Critical Bugs & Blockers

> Must fix before any feature work.

### PDF Preview/Download
- [x] Fix download timing (delayed revokeObjectURL across 5 export dialogs) (2026-04-04)
- [x] Verify PDF preview renders correctly in ExportDialog preview tab (2026-08-20) — was completely broken (crashed on every Preview/Download, all tools); root cause was WOFF2 font embedding, not the CSP violation it first looked like. Fixed by switching to Helvetica (a PDF base-14 font, no embedding needed). Live-verified: a real PDF renders. Shared fix in `src/lib/pdf/styles.ts` covers every tool's export since they all import from it.
- [x] Test PDF export across all tools that support it (2026-08-20) — spot-verified on Orrery (Preview + Download) since the fix is in the shared font/style module every PDF template imports; not individually re-tested per tool.

### Security Review
- [x] Security review — fixed comments/favorites INSERT policies (2026-04-05)
- [x] Audit RLS on entities, entity_connections, world_favorites, world_comments (2026-04-05)
- [x] Review exposed API surfaces and auth guards (deeper pass) (2026-08-20) — structurally swept every SECURITY DEFINER function in the schema (not just the advisor's flagged list). Found and fixed 3 with no caller-identity check: `lookup_user_by_email` (unauthenticated email enumeration + PII leak), `get_subscription_tier` (arbitrary user's tier readable by anyone, unused dead code), `cleanup_world_versions` (anyone could force the global retention job to run). All confirmed RLS-enabled tables (37/37), no overly-permissive policies, share-link tokens are 128-bit crypto-random. See migrations `20260820_*`.

### Phase 3 Bug Fix Pass
- [ ] Systematic bug-fix pass across all tools and features — partial: bugs found during the save/load and simulator audits (Sensorium save path, K-Scale routing, world_tags 404) were fixed as found; no separate exhaustive pass has been run.
- [x] Test all 21 worksheet tools load and save correctly (2026-08-19) — 19/21 passed outright; 2 bugs found (Sensorium save path fully dead, K-Scale world-scoped routing) and fixed same session.
- [x] Test all 5 simulators load/save/publish (2026-08-20) — 5/5 pass: Save, Load, and Publish all verified live for Tidelock, ExoSky, Rogue, Solaris, ExoForge.

---

## Priority 2 — Auth & Infrastructure (Dedicated Session)

> Clerk migration needs dashboard config + careful cutover.

### Clerk Auth Migration
- [ ] **Migrate from Supabase Auth to Clerk** — see [STACK-ARCHITECTURE.md](STACK-ARCHITECTURE.md)
  - [ ] Create Clerk application, configure JWT template
  - [ ] Install `@clerk/clerk-react`, configure `<ClerkProvider>`
  - [ ] Replace `supabase.auth.*` calls with Clerk session/token flow
  - [ ] Build webhook handler for user/org sync
  - [ ] Rewrite RLS policies for `clerk_user_id()`
  - [ ] Migrate existing users (bcrypt import)
  - [ ] Add 2FA + additional OAuth (GitHub, Discord, Apple, Notion)
  - [ ] Test full flow end-to-end

### Stripe Billing
- [ ] Finalize org-tier pricing
- [ ] Build checkout/portal endpoints
- [ ] Wire Stripe Customer to Clerk user ID

---

## Priority 3 — UX Polish & Core Features

> High-impact features and polish work.

### Writing & Focus Mode
- [x] Dedicated Writing Space (`/worlds/:id/write`) (2026-04-04)
- [x] Zen Mode — full-screen distraction-free editing (2026-04-04)
- [x] Editor correctness pass — folders, binder order, autosave lifecycle, save state (2026-08-09)
- [x] Tool data in the writing surface — Refs panel, real pin previews, compile appendix (2026-08-09)

#### SESSION LOG — 2026-08-11, shipped through v0.6921

All on `main` and live. Note that Vercel deploys **`main` only**; feature branches
get *preview* deployments, which is how the work once looked "deployed" while
production still served 0.6844.

- [x] Continuity engine + Check inspector tab (2026-08-11) — compares prose against
      recorded tool values. 12 checks, scale words ("nine billion" vs 8700000000),
      scientific notation. `src/lib/continuity.ts`
- [x] Per-document metadata: synopsis, POV, status, in-world date, in the existing
      `world_entries.metadata` jsonb. No schema change. `src/lib/document-meta.ts`
- [x] Corkboard: Board toggle, index cards grouped by chapter, drag to reorder
- [x] Find & replace: Ctrl+F, whole-word, ProseMirror transactions
- [x] File-into-chapter menu (wired the orphaned `useMoveDocument`)
- [x] Per-document export (docx/md/txt); goal progress replaces the Julian Day
- [x] World dashboard: 13 panels → 4 above the fold + a 5-drawer rail
- [x] One `Wordmark` component (the name had rendered four different ways)
- [x] Atomic word-ledger RPC applied + hardened (an `anon` EXECUTE grant on a
      SECURITY DEFINER function would have let anyone inflate any user's count)
- [x] Human-voice copy passes: landing value blocks, hero, early access, Studio,
      Pricing CTAs, changelog

#### BLOCKER — toolchain unusable while the repo sits in Dropbox

Dropbox syncs `node_modules` (44,461 files), `dist` (1.4 GB) and `public/video`
(901 MB). Under that contention `vitest` collects zero tests
(`Timeout calling "fetch" with "/@vite/env"`), `tsc` exceeds 17 minutes,
ripgrep times out, and `.git/index.lock` strands as a zero-byte file.

- [ ] Dropbox → Preferences → Sync → Selective Sync → untick those three folders.
      All are gitignored; copy `public/video` out first, it regenerates from nothing.
- [ ] Then confirm: `npx vitest run` (~66 tests), `node scripts/typecheck-strict.mjs`

#### NOT VERIFIED — needs a browser with a logged-in account

- [ ] Corkboard (Board toggle), file-into-chapter menu, Check tab. These parse and
      their logic is asserted, but nobody has clicked them. `/write` needs auth.
- [ ] The 31 committed vitest specs have never been observed passing. Logic was
      verified by transpiling the pure modules with esbuild and asserting in node
      (58 assertions green) — that covers functions, never UI.

#### NEXT

- [ ] Finish the copy sweep: About, Features, Getting Started, Guide, Community
- [x] Writer-register conversion (2026-08-24): `Worlds` (SectionHero `warm`,
      dropped `//` eyebrow, sentence-cased the community-browse link),
      `Collection` (section heads were already converted; only its two
      `EmptyState` calls needed the new `warm` prop), `WikiBrowse` (header
      was already converted; softened the four filter-panel labels),
      `WorldChronicle`/`Chronicle.tsx` (`.sf-chronicle-heading` was MONO
      despite the wrapper's own comment claiming otherwise; empty-state copy
      had a literal `//` prefix), `WorldGraph` (page no longer exists - it
      was absorbed into `WorldConnections.tsx`, whose header and mind-map
      empty state were still MONO; canvas/legend left untouched, per the
      "chrome only" rule). Added a `warm` prop to the shared `EmptyState`
      component (mirrors `SectionHero`'s), since two pages needed it.
- [ ] Continuity Tier 2: physical implausibility (high gravity vs effortless
      motion, tidally locked vs "sunset")
- [ ] Widen continuity coverage — only fields with a `worksheetPaths` entry in
      `entity-config.ts` can be checked. **Confirm the mapping exists before
      writing a check**: an earlier draft checked `moonCount`, which nothing
      records, so 3 of 5 checks were dead code.

#### RESOLVED — one writing surface
`WorldWritingSpace.tsx` was imported at `App.tsx` but never rendered as a
route; `/worlds/:worldId/write` went to `WorldWriteRedirect`. Ctrl+S and Esc
(focus mode) were already ported (0.6874).
- [x] Port font + line-spacing prefs (2026-08-23) — moved onto the shared
      `useWritingPreferences` hook (cross-device via Supabase auth metadata)
      rather than reviving the old page's bespoke per-world localStorage key.
      `Write.tsx` gets a Spacing/Font bar above the editor.
- [x] Port ChapterTree's rename/delete UX into Write.tsx's binder — it had
      drag-and-drop but no rename/delete; ChapterTree had the reverse.
      Consolidated onto Write.tsx's binder, which keeps the drag-and-drop.
- [x] Delete `WorldWritingSpace.tsx` + its six single-purpose dependents
      (ChapterTree, WritingSidebar, WritingTopBar, WritingReferencePanel,
      WritingMoodboardStrip, EntityHoverCard) + the dead `App.tsx` import
      (2026-08-23)
- [ ] Version history was never ported and still isn't — the old
      implementation has three real defects (snapshots capture content as of
      document *open*, the 5-minute auto-snapshot condition is permanently
      false, a failed migration deletes local history unconditionally). Fix
      those first if this gets rebuilt; do not port as-is. The old code is
      recoverable from git history (pre-`e2a8a4c0`) as a reference, not a
      base to copy from.

#### Blocked on the StellarForge II schema gate
- [ ] Cloud-synced pins — needs a table/payload column; pins are localStorage-only
      today while "cloud sync across devices" is a sold Pro feature
- [ ] Worksheet facts on entities in the editor — needs the `world_entries`/
      `entities` merge (SF-II §4.2), since the two tables are unlinked
- [ ] Apply `supabase/migrations/20260809_atomic_writing_session_increment.sql`
      after confirming a `(user_id, day)` unique constraint exists — until then
      the daily word ledger under-counts under concurrent saves

#### Needs a product decision
- [ ] Two disjoint "words today" ledgers: the editor writes `writing_sessions`,
      the goal/streak UI reads `writing_entries.word_count`. Streaks also measure
      *entry creation*, so a novelist editing one chapter daily shows 0 words
- [ ] Per-document metadata (POV, status, synopsis) — `metadata: {}` is written
      at creation and never read
- [x] Find/replace (Ctrl+F, `FindReplaceBar`) and per-doc export (docx/md/txt)
      both exist and are wired in `Write.tsx` — stale entry, corrected 2026-08-24
- [ ] Typewriter mode (keep cursor vertically centered while typing), a scene
      tier below chapters

### World Display
- [x] World Showcase page (`/worlds/:id/showcase`) (2026-04-04)
- [x] Database-backed visibility toggle (Private/Community/Public) on Showcase (2026-04-05)

### About Us
- [x] About Us page (`/about`) (2026-04-04)

### Social Sharing
- [x] SocialShareButtons component (Twitter/X, Reddit, LinkedIn, Facebook, copy) (2026-04-04)
- [x] Social sharing on World Showcase (2026-04-04)
- [x] Dynamic OG meta tags on all tool pages, Showcase, About, Dashboard, Writing (2026-04-04)
- [x] Social sharing in ExportDialog (all tools get share on export) (2026-04-04)
- [x] Social sharing on individual worksheet public share pages (2026-04-05)

### Writing Prompts Expansion
- [x] Expanded to 62 prompts across 5 categories (2026-04-04)
- [x] Personalized prompt generator from entity data (2026-04-04)
- [x] Prompt of the Day on homepage (2026-04-04)

### SF Quotes with Affiliate Links
- [x] Affiliate URLs on ToolPageQuote and HomepageQuote (2026-04-04)
- [x] Affiliate link click tracking (localStorage-based) (2026-04-05)

### Archive & Delete UX
- [x] Type-to-confirm delete dialogs for worlds and worksheets (2026-04-04)
- [x] Archive undo toast with restore action (2026-04-04)
- [x] Delete confirmation for documents (2026-04-05) — entities already had confirm

### World Activity & History
- [x] Recent Activity section on World Dashboard (last 10 items) (2026-04-04)
- [x] Entity history timestamps (created/modified) on detail panels (2026-04-05)

### Promotional Content
- [ ] **"See it in Action" section** on preview/landing page — interactive demo or video embed
- [ ] **Features screenshot video** — screen recording walkthrough of key features

### Icons & Visual Polish
- [ ] **Improve tool icons** — custom SVGs, wire into tool-icons.tsx
- [ ] **Additional screenshots** for Features page

### Tutorial Videos
- [ ] Tutorial videos per tool/workflow
- [ ] Onboarding video, "build a world with me" series

### Additional Apps / Tools
- [ ] Scope TBD — new worldbuilding tools beyond current 21

---

## Priority 4 — Long-Term / Backlog

### Remaining Editor Migration
- [ ] Replace remaining plain textareas on worksheet tools (low priority)
- [ ] Migrate existing plain-text content → Tiptap JSON

### Runtime Verification
- [ ] Test Graph with 100+ entities for performance
- [ ] Test cascade audit markdown export end-to-end
- [ ] Verify undo/redo, onboarding dismiss, entity sidebar drag-drop
- [ ] Test writing space auto-save, document CRUD, @mentions

### i18n
- [ ] Extract ~2,000-4,000 keys
- [ ] Add target languages
- [ ] PDF font support for CJK

### CI/CD & Testing
- [ ] GitHub Actions pipeline
- [ ] Vitest + React Testing Library
- [ ] Bundle size optimization

### In-App Writing Tools (Advanced)
- [x] Tiptap editor foundation (StellarForgeEditor with 3 presets) (2026-04-04)
- [x] Entity @mentions wired to world data (2026-04-04)
- [ ] **BlockNote evaluation** — Notion-style block editor on top of Tiptap (blocknotejs.org) for cleaner default UX
- [ ] **Novel.sh reference study** — open-source Notion editor with AI slash-commands (novel.sh)
- [ ] **Pandoc export quality** — wrap Pandoc in Trigger.dev background job for professional Word/PDF/Scrivener exports
- [ ] **Yjs collaborative editing** — CRDT-based real-time sync via Supabase Realtime transport (yjs.dev)
- [ ] **PartyKit alternative** — multiplayer features without raw Yjs complexity (partykit.dev)

### Collaboration
- [ ] Real-time co-editing (via Yjs + Supabase Realtime or PartyKit)
- [ ] Per-field comments/annotations
- [ ] Activity feed on world dashboard

### Accessibility
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Color contrast audit
- [ ] `prefers-reduced-motion` support

### Content
- [ ] More Learn articles via Sanity CMS
- [ ] Bookshelf expansion
- [ ] Embedded video walkthroughs

---

## Completed

### April 4, 2026 — v0.6100 → v0.6231
- [x] World Graph & Entity Layer (5 phases, analytical tools, cascade audit, timeline)
- [x] Mind Map functional rebuild (entity tree on Connections page)
- [x] StellarForgeEditor (Tiptap, 3 presets, @mentions, focus mode)
- [x] Entity-Powered Sidebar (Tool/Wiki views, drag-drop, color picker)
- [x] Dedicated Writing Space + Zen Mode + version history
- [x] SENSORIUM Phases 2-5 (scoring, push-to-worksheet, sliders, narrative, polish)
- [x] Export System (CSV, cross-tool linked, Notion pre-existing)
- [x] UI Consistency Fixes (10 issues), PDF download fix
- [x] About Us page, World Showcase, Social sharing, OG meta tags
- [x] Writing prompts (62 total + personalized + Prompt of the Day)
- [x] SF quote affiliate links, Archive/Delete UX, Recent Activity dashboard
- [x] About Us page, World Showcase page, Social sharing
- [x] Version system (v0.6196), CHANGELOG.md
- [x] Multiple hotfixes (graph crash, notes bugs, @mentions)

### April 1-2, 2026 — Remediation Phases 1-12
- [x] Layout Normalization through Guided First-World Experience

---

*Last updated: 2026-08-23*
