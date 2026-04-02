# StellarForge Development Roadmap

Active task list and development priorities. Review this at the start of each session — if current work touches a task below, flag it.

**Convention:** Mark tasks `[x]` when complete. Add date completed in parentheses.

---

## Priority 1 — Active / Imminent

> Tasks currently in progress or next up.

### Remediation Implementation (from diagnostic specs)
- [x] **Phase 1: Layout Normalization** — `ToolPageLayout.tsx` + `tool-page-config.ts` (2026-04-01)
  - [x] Create shared `ToolPageLayout` component enforcing canonical structure
  - [x] Create `tool-page-config.ts` with metadata for all 21 tools
  - [x] Add missing TOOL_INTROS entry for ECR (Cascade)
  - [x] Assign Timeline brand name: "Chronolog"
  - [x] Migrate all 21 tool pages to ToolPageLayout
  - [x] Remove all "Tool N" / "Pro Tool" badges from headers
  - [x] Standardize export labels to "Export [BrandName]"
  - [x] Standardize back link (context-aware: "Back to World" / "Back to Tools")
- [x] **Phase 2: UX Discoverability** (2026-04-01) — Codex Quick Access descriptions, wiki edit hint, WorldGraph label, Timeline QuickExport
- [x] **Phase 3: Cross-Tool Entity Recognition** (2026-04-01) — fuzzy name matching, EntityMatchDialog, useEntityMatch hook, all 21 tools integrated
- [x] **Phase 4: Export Format Bugs** (2026-04-02) — explicit PDF MIME types in ExportDialog, QuickExportButton, WorldBibleDialog
- [ ] **Phase 5: Simulator Normalization** — fonts, nav, branding (see Simulator Addendum)
- [ ] **Phase 6: Simulation Save/Replay** — PostMessage bridge + DB table
- [ ] **Phase 7: Narrative Bridge panel** — simulator writing connection
- [ ] **Phase 8: Publish to World** — all simulators + Cartographer
- [ ] **Phase 9: Cascade Guidance System** — downstream suggestions, progress indicator
- [ ] **Phase 10: Writing ↔ Entity Linking** — junction table, post-write suggestions
- [ ] **Phase 11: World Bible Dual Export** — cascade-organized vs entity-centric
- [ ] **Phase 12: Guided First-World Experience** — cascade-path empty state

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

### Solaris Simulator
- [ ] Integrate Solaris simulator into main app routing
- [ ] Landing page entry and tool showcase card

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

> Tracked for reference. See also [BACKLOG.md](BACKLOG.md) for detailed specs.

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

> Move finished tasks here with completion date.

*(none yet)*

---

*Last updated: 2026-04-01*
