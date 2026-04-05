# StellarForge Development Roadmap

Active task list and development priorities. Review this at the start of each session — if current work touches a task below, flag it.

**Convention:** Mark tasks `[x]` when complete. Add date completed in parentheses.

---

## Priority 1 — Critical Bugs & Blockers

> Must fix before any feature work.

### PDF Preview/Download
- [x] Fix download timing (delayed revokeObjectURL across 5 export dialogs) (2026-04-04)
- [ ] Verify PDF preview renders correctly in ExportDialog preview tab
- [ ] Test PDF export across all tools that support it

### Security Review
- [ ] **Full security review** — refresh after entity layer + writing space additions
- [ ] Audit RLS policies on new tables (entities, entity_connections)
- [ ] Review exposed API surfaces and auth guards

### Phase 3 Bug Fix Pass
- [ ] Systematic bug-fix pass across all tools and features
- [ ] Test all 21 worksheet tools load and save correctly
- [ ] Test all 5 simulators load/save/publish

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

### World Display
- [x] World Showcase page (`/worlds/:id/showcase`) (2026-04-04)
- [ ] **Public/private toggle** for world showcase visibility

### About Us
- [x] About Us page (`/about`) (2026-04-04)

### Social Sharing
- [x] SocialShareButtons component (Twitter/X, Reddit, LinkedIn, Facebook, copy) (2026-04-04)
- [x] Social sharing on World Showcase (2026-04-04)
- [ ] **Open Graph meta tags** — dynamic OG tags per page for rich link previews
- [ ] Social sharing on individual worksheets and tool outputs

### Writing Prompts Expansion
- [x] Writing prompts system exists (15-20 static prompts, PromptBrowser, PromptCard) (pre-existing)
- [ ] **Expand prompt library** — add 50+ prompts across all categories
- [ ] **Personalized prompts from entity data** — "Write a scene where [Species X] encounters [Challenge Y] on [Planet Z]"
- [ ] **Prompt of the Day** — rotating featured prompt on homepage/dashboard

### SF Quotes with Affiliate Links
- [ ] **Extend ToolPageQuote with affiliate URLs** — cite source with purchase link
- [ ] Add affiliate link click tracking

### Archive & Delete UX
- [ ] **Polish confirm dialogs** — recovery from archive, permanent delete with warning
- [ ] Ensure archive/delete works for entities and documents (not just worlds/worksheets)

### World Activity & History
- [ ] **Recent activity section** at top of each world dashboard (last edited worksheets, entities, notes)
- [ ] **History section** per world and per element (changelog of modifications)

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

*Last updated: 2026-04-04*
