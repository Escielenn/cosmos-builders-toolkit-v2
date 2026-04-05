# StellarForge Development Roadmap

Active task list and development priorities. Review this at the start of each session — if current work touches a task below, flag it.

**Convention:** Mark tasks `[x]` when complete. Add date completed in parentheses.

---

## Priority 1 — Active / Imminent

> Tasks currently in progress or next up.

### Textarea → StellarForgeEditor Migration
- [x] Audit ALL `<textarea>` elements in the codebase (2026-04-04)
- [ ] Replace World Notes textarea with `<StellarForgeEditor preset="rich" />`
- [x] Replace Entity Description textarea with `<StellarForgeEditor preset="rich" />` (2026-04-04)
- [x] Replace Entity Notes textarea with `<StellarForgeEditor preset="rich" />` (2026-04-04)
- [x] Replace Connection Notes with `<StellarForgeEditor preset="compact" />` (2026-04-04)
- [ ] Replace remaining plain textareas on worksheet tools (80+ across 5 tools — low priority, short-form fields)
- [ ] Migrate existing plain-text content → Tiptap JSON (or render HTML gracefully)
- [ ] Verify @ mentions work in all replaced editors

### World Graph Polish & Edge Cases
- [x] Timeline scrubber: wire temporal filtering to hide/show edges (2026-04-04)
- [ ] Test Graph with 100+ entities for performance (force sim, React Flow virtualization)
- [x] Add "Unpin" option to node right-click context menu (2026-04-04)
- [x] Add right-click context menu with Cascade Audit, Unpin, Delete (2026-04-04)
- [ ] Test cascade audit export (markdown) end-to-end
- [ ] Verify undo/redo history tracks operations correctly
- [ ] Test onboarding tooltips display once then dismiss permanently

### Entity Sidebar Refinements
- [ ] Test drag-and-drop reorder with live Supabase data
- [ ] Verify color picker updates persist to Supabase
- [ ] Test Registry↔Entities tab toggle in WorldLayout

### Writing Space Polish
- [ ] Test auto-save with real Supabase documents
- [ ] Verify entity sidebar click inserts @mention at cursor
- [ ] Test document create/rename/delete lifecycle
- [ ] Add version history (snapshot on manual save / every 5 minutes)

---

## Priority 2 — Near-Term

> Planned work with clear scope, ready to start when bandwidth allows.

### Auth & Infrastructure Migration
- [ ] **Migrate from Supabase Auth to Clerk** — see [STACK-ARCHITECTURE.md](STACK-ARCHITECTURE.md) for full spec
  - [ ] Install Clerk SDK (`@clerk/nextjs`) and configure `<ClerkProvider>`
  - [ ] Create Clerk JWT template (`supabase`) in Clerk dashboard
  - [ ] Replace `supabase.auth.*` calls with Clerk session/token flow
  - [ ] Build Clerk webhook handler (`/api/webhooks/clerk`) for user/org sync
  - [ ] Create `users`, `organizations`, `org_members` tables in Supabase with `clerk_user_id` as primary identifier
  - [ ] Rewrite all RLS policies to use `clerk_user_id()` helper instead of `auth.uid()`
  - [ ] Update Stripe webhook handler to sync subscription state using `clerk_user_id`
  - [ ] Remove all Supabase Auth references (`AuthContext`, `supabase.auth.signIn`, etc.)
  - [ ] Configure Clerk middleware to exclude `/api/webhooks/*` from auth
  - [ ] Test full flow: sign-up → user sync → subscribe → access gated content

### Stripe Billing
- [ ] Finalize org-tier pricing (Group, Classroom, Institution)
- [ ] Build checkout session creation endpoint (`/api/billing/create-checkout`)
- [ ] Build customer portal endpoint (`/api/billing/portal`)
- [ ] Add Pro badge gating throughout the UI based on subscription status

---

## Priority 3 — Medium-Term

> Important but not blocking current work.

### SENSORIUM Completion
- [ ] Phase 2: Weighted plausibility scoring (`calculatePlausibilityScore`)
- [ ] Phase 3: Push-to-worksheet sync
- [ ] Phase 4: Fine-tuning sliders, comparative species view, perceptual simulation text
- [ ] Phase 5: Tooltips, keyboard nav, Framer Motion, tutorial overlay

### Export System
- [ ] Notion export expansion
- [ ] CSV/spreadsheet export for data-heavy tools
- [ ] Cross-tool linked export (multiple worksheets as one document)

---

## Priority 4 — Long-Term / Backlog

> Tracked for reference.

### i18n String Extraction
- [ ] Extract ~2,000-4,000 keys across tools, simulators, landing, exports
- [ ] Add target languages and translation files
- [ ] PDF font support for CJK languages

### CI/CD & Testing
- [ ] GitHub Actions pipeline (replace manual `npx vercel --prod`)
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

### April 4, 2026 — World Graph + Editor + Writing Space (v0.6100)
- [x] **World Graph & Entity Layer** — entities/entity_connections tables, migration applied, types regenerated
- [x] **Graph Phases 1-5** — EntityNode, CascadeEdge, force layout, cascade gravity, pinning, cascade filter bar, cascade flow layout, list view, search, graph export (PNG/JSON/MD)
- [x] **Analytical Tools** — gravity analysis, narrative distance, tension detection, cluster discovery, what-if removal
- [x] **Cascade Audit Mode** — full upstream/downstream tree tracing with what-if prompts
- [x] **Timeline Scrubber** — temporal layer UI with play/pause/rewind
- [x] **Mind Map / Tree View** — entity hierarchy from parent_entity_id, expand/collapse, add child
- [x] **StellarForgeEditor** — Tiptap with 3 presets (compact/rich/full), @entity mentions, word count, focus mode
- [x] **Entity-Powered Sidebar** — Tool/Wiki views, drag-and-drop, color picker, search, Registry/Entities tabs
- [x] **Dedicated Writing Space** — /worlds/:id/write with document CRUD, entity sidebar, auto-save
- [x] **Version Number** — v0.6100 in header, CHANGELOG.md created
- [x] **UI Consistency Fixes** (10 issues) — worksheet overlap, nav fonts, simulator unboxed titles, tools mega menu, Guide dropdown, Narrative Bridge notes, video thumbnail fallback, Mythos CTA
- [x] **Quick Bug Fixes** — World Notes resize, Codex font bump, Connections click-to-select

### April 1-2, 2026 — Remediation Phases 1-12
- [x] Phase 1: Layout Normalization — ToolPageLayout + tool-page-config
- [x] Phase 2: UX Discoverability — Codex Quick Access, wiki edit hint
- [x] Phase 3: Cross-Tool Entity Recognition — fuzzy matching, EntityMatchDialog
- [x] Phase 4: Export Format Bugs — explicit PDF MIME types
- [x] Phase 5: Simulator Normalization — font increases, nav branding
- [x] Phase 6: Simulation Save/Replay — simulation_saves table, PostMessage bridge
- [x] Phase 7: Narrative Bridge Panel — NarrativeBridgePanel, per-simulator questions
- [x] Phase 8: Publish to World — PublishToWorldDialog, fuzzy match integration
- [x] Phase 9: Cascade Guidance System — CascadeSuggestionToast, CascadeProgressBar
- [x] Phase 10: Writing ↔ Entity Linking — writing_entry_entities table, entity scanning
- [x] Phase 11: World Bible Dual Export — cascade vs entity structure toggle
- [x] Phase 12: Guided First-World Experience — GuidedFirstWorld component

---

*Last updated: 2026-04-04*
