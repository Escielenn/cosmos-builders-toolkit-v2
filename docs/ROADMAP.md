# StellarForge Development Roadmap

Active task list and development priorities. Review this at the start of each session — if current work touches a task below, flag it.

**Convention:** Mark tasks `[x]` when complete. Add date completed in parentheses.

---

## Priority 1 — Critical Bugs & Blockers

> Must fix before any feature work.

### PDF Preview/Download Not Working
- [ ] **PDF export neither previews nor initiates download** — check PDF generation library, verify async handling, ensure download triggers after generation
- [ ] Test across all tools that offer PDF export (ExportDialog + QuickExportButton)

### Security Review
- [ ] **Full security review** — first pass done 2/5, needs refresh after entity layer + writing space additions
- [ ] Audit RLS policies on new tables (entities, entity_connections)
- [ ] Review exposed API surfaces and auth guards

### Phase 3 Bug Fix Pass
- [ ] Systematic bug-fix pass across all tools and features
- [ ] Test all 21 worksheet tools load and save correctly
- [ ] Test all 5 simulators load/save/publish

---

## Priority 2 — Auth & Infrastructure (Dedicated Session Required)

> Clerk migration needs dashboard config + careful cutover. Plan a focused session.

### Clerk Auth Migration
- [ ] **Migrate from Supabase Auth to Clerk** — see [STACK-ARCHITECTURE.md](STACK-ARCHITECTURE.md) for full spec
  - [ ] Create Clerk application, configure JWT template (`supabase`)
  - [ ] Install `@clerk/clerk-react` and configure `<ClerkProvider>`
  - [ ] Replace `supabase.auth.*` calls with Clerk session/token flow
  - [ ] Build webhook handler for user/org sync
  - [ ] Rewrite all RLS policies to use `clerk_user_id()` helper
  - [ ] Migrate existing users from Supabase Auth → Clerk (bcrypt password import)
  - [ ] Add 2FA support via Clerk dashboard
  - [ ] Add additional OAuth providers (GitHub, Discord, Apple, Notion)
  - [ ] Remove all Supabase Auth references
  - [ ] Test full flow: sign-up → user sync → subscribe → access gated content

### Stripe Billing
- [ ] Finalize org-tier pricing (Group, Classroom, Institution)
- [ ] Build checkout session creation endpoint
- [ ] Build customer portal endpoint
- [ ] Wire Stripe Customer to Clerk user ID
- [ ] Add Pro badge gating throughout the UI based on subscription status

---

## Priority 3 — UX Polish & Core Features

> High-impact features and polish work.

### Writing & Focus Mode
- [x] Dedicated Writing Space (`/worlds/:id/write`) (2026-04-04)
- [ ] **Pure writing mode** — ability to see only their writing and nothing else (full-screen distraction-free editor, hide all chrome)

### World Display Page
- [ ] **World Display Page like Kanka** — public-facing world showcase page
  - Reference: https://kanka.io/features
  - Entity gallery, hierarchical navigation, public/private toggle
  - Rich world overview with header image, description, entity counts

### About Us Page
- [ ] **About Us page** — team, mission, story behind StellarForge

### Share System
- [x] Share Links for individual worksheets (ShareDialog exists on all tools) (pre-existing)
- [ ] **Share links for all tool outputs** — shareable URLs for planet profiles, species designs, etc.
  - Public/private toggle
  - Share to anyone with link vs members only
- [ ] **Social sharing links** — share to Twitter/X, Reddit, Discord, etc. with Open Graph previews

### Archive & Delete
- [x] Archive functionality exists (worlds have `archived_at`, worksheets have archive support) (pre-existing)
- [ ] **Polish archive/delete UX** — confirm dialogs, recovery from archive, permanent delete with warning
- [ ] Ensure archive/delete works for all entity types (worlds, worksheets, entities, documents)

### Mind Map Tool
- [x] Mind Map functional rebuild — entity-based tree with drag-to-reparent (2026-04-04)
- [ ] **Verify all 7 functional requirements** in production (runtime testing needed)

### Icons & Visual Polish
- [ ] **Improve icons for UI elements** — mail, tool icons, etc.
  - Upload custom SVGs for tools
  - Wire into tool-icons.tsx and profile avatar picker
- [ ] **Additional screenshots for Features page** — capture current tool states for marketing

### Writing Prompts
- [ ] **Writing Prompts / Prompt of the Day** — AI-generated or curated prompts based on worldbuilding data
  - "Write a scene where [Species X] encounters [Environmental Challenge Y] on [Planet Z]"
  - Prompt engine reads from entity data for personalization

### SF Quotes with Affiliate Links
- [ ] **Rotating SF quotes across platform** — cite source with affiliate link to purchase book
  - Extend existing ToolPageQuote system with affiliate URLs
  - Track click-through for revenue reporting

### Tutorial Videos
- [ ] **Tutorial videos per major tool/workflow** — onboarding video, tool walkthroughs, "build a world with me" series

### Additional Apps / Tools
- [ ] **Additional apps** — scope TBD (new worldbuilding tools beyond current 21?)

---

## Priority 4 — Long-Term / Backlog

> Tracked for reference.

### Remaining Editor Migration
- [ ] Replace remaining plain textareas on worksheet tools (80+ across 5 tools — low priority, short-form fields)
- [ ] Migrate existing plain-text content → Tiptap JSON (or render HTML gracefully)

### Graph & Sidebar Testing (Runtime Verification)
- [ ] Test Graph with 100+ entities for performance
- [ ] Test cascade audit export (markdown) end-to-end
- [ ] Verify undo/redo history tracks operations correctly
- [ ] Test onboarding tooltips dismiss permanently
- [ ] Test entity sidebar drag-and-drop with live Supabase data
- [ ] Verify color picker updates persist
- [ ] Test writing space auto-save, document CRUD lifecycle
- [ ] Verify @mentions work in all replaced editors

### i18n String Extraction
- [ ] Extract ~2,000-4,000 keys across tools, simulators, landing, exports
- [ ] Add target languages and translation files
- [ ] PDF font support for CJK languages

### CI/CD & Testing
- [ ] GitHub Actions pipeline (replace manual deploy)
- [ ] Vitest + React Testing Library test suite
- [ ] Bundle size optimization (lazy-load react-pdf)

### Collaboration Features
- [ ] Real-time co-editing (field-level sync via Supabase Realtime)
- [ ] Per-field comments/annotations on worksheets
- [ ] Activity feed on world dashboard

### Accessibility Audit
- [ ] Full keyboard navigation audit
- [ ] Screen reader testing (ARIA labels, live regions)
- [ ] Color contrast audit on glass-panel components
- [ ] `prefers-reduced-motion` support

### Content
- [ ] More Learn articles via Sanity CMS
- [ ] Bookshelf expansion (curated reading lists)
- [ ] Embedded video walkthroughs per tool

---

## Completed

### April 4, 2026 — v0.6100 → v0.6166
- [x] **World Graph & Entity Layer** — entities/entity_connections tables, 5 phases, all analytical tools
- [x] **Mind Map functional rebuild** — entity tree with drag-to-reparent on Connections page
- [x] **StellarForgeEditor** — Tiptap with 3 presets, @entity mentions, word count, focus mode
- [x] **Entity-Powered Sidebar** — Tool/Wiki views, drag-and-drop, color picker, Registry/Entities tabs
- [x] **Dedicated Writing Space** — /worlds/:id/write with document CRUD, auto-save, version history
- [x] **SENSORIUM Phases 2-5** — scoring, push-to-worksheet, sliders, comparative view, narrative, polish
- [x] **Export System** — CSV export, cross-tool linked export, Notion (pre-existing)
- [x] **UI Consistency Fixes** — 10 issues (worksheet overlap, nav fonts, simulator titles, mega menu, etc.)
- [x] **Version System** — v0.6166 in header, CHANGELOG.md
- [x] **Hotfixes** — graph crash, notes resize, title sizing, @mentions threading

### April 1-2, 2026 — Remediation Phases 1-12
- [x] Layout Normalization, UX Discoverability, Entity Recognition, Export Fixes
- [x] Simulator Normalization, Save/Replay, Narrative Bridge, Publish to World
- [x] Cascade Guidance, Writing-Entity Linking, World Bible Export, Guided First-World

---

*Last updated: 2026-04-04*
