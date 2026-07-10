# StellarForge Changelog

## 0.6722
Unified writing: Studio is now the ONE writing surface, on the real manuscript store.

- FIXED the two-writing-systems split. The old "Writing Space"
  (/worlds/:id/write) and the new Studio editor edited DIFFERENT tables
  (world_entries documents vs writing_entries), so your manuscript work
  and Studio showed different content. Studio's editor now operates on
  world_entries documents — the mature manuscript store — via the
  existing, battle-tested document hooks. Your 16 real documents now
  appear in Studio (verified: all reachable by the new queries).
- Studio editor (/write/:docId) rebuilt on the manuscript store: binder
  shows real documents + folders, autosave writes world_entries and
  rolls word deltas into writing_sessions (streaks), Lora writer
  register throughout. Full entity tool in the inspector — the
  WritingEntityPanel (browse/search world entities, insert @mention,
  insert [[wiki link]], pin) plus quick links to the wiki and graph.
- The old /worlds/:id/write route now REDIRECTS into Studio on that
  world's latest document (WorldWriteRedirect), so every existing "Write"
  link across the app (dashboard, codex, prompts, compile, hero) lands
  in the unified Studio editor with the right world context. Nav/menu
  "Write" → Studio; Studio continue-card → /write/:docId.
- Studio home (useStudioData) now reads world_entries documents for the
  continue-card, recent list, and word/streak stats.
- SF-II alignment: one writing model (world_entries), no parallel content
  table for the main editor. The earlier writing_entries/binder_nodes/
  scene_pins scaffolding is now unused by the main editor (writing_sessions
  still powers streaks); safe to retire in the Pillar-B merge.


## 0.6712
Backlog Tier 0/1 — DB performance sweep + auth resilience.

- PERF (DB): wrapped every bare auth.uid()/auth.role()/auth.jwt() in RLS
  policies as (select ...) scalar subqueries so the planner evaluates
  them once per statement instead of per row (~80 auth_rls_initplan
  advisor warnings → 0). Done via a transactional, sentinel-safe
  rewrite; RLS semantics verified unchanged (owner sees own rows, not
  others'). Zero truly-bare calls remain.
- PERF (DB): added covering indexes on all 26 unindexed foreign keys
  (faster joins + cascade deletes).
- RESILIENCE: AuthContext no longer hangs forever when the backend is
  unreachable (the paused-DB failure mode). getSession() now races a
  10s timeout and catches rejection; on failure the app shows a
  branded, retryable "connection lost" overlay ("your worlds are safe")
  with a Reconnect button instead of an infinite spinner. connectionError
  is exposed on the auth context.
- Deliberately NOT changed: multiple_permissive_policies warnings are
  inherent to the owner/collaborator/community access model —
  consolidating would risk access semantics for marginal gain (backlog).
  Bundle: verified @react-pdf (1.6MB) + lucide are already off the
  first-paint path via manualChunks; deeper defer-to-export-click is a
  risky 54-file refactor left for a measured pass.
- Applied to production: perf_index_unindexed_fks, perf_wrap_auth_initplan
  (migrations mirrored in supabase/migrations for repo history).


## 0.6702
fork_world completeness fix — applied and verified in production.

- FIXED: fork_world silently corrupted/dropped data on every fork. The
  replacement (written 2026-06-11, now applied) fixes all seven defects:
  world_entries parent tree flattening (children orphaned to root);
  lost entry icon/color/tags/tool_data_id; unmapped worksheet IDs;
  world_connections never copied; chronicle_events (timeline) never
  copied; entity graph_x/y/pinned layout lost; entity_worksheets
  provenance links never copied. Signature/validation/license/
  fork_count behavior unchanged (no client change).
- Verified end-to-end against production: built a synthetic source world
  with nested entries, nested events, entity hierarchy + graph layout,
  entity/world connections, worksheet links, and notes; forked it;
  confirmed all 14 layer/tree assertions pass and zero cross-world
  reference leaks; removed the test data.
- Deliberately not copied (documented policy): world_versions,
  document_versions, simulation_saves.
- Note: pre-existing forks damaged by the old function are unchanged;
  a repair pass is future work (SF-II Phase B0 — needs the merge
  provenance map).


## 0.6692
Comprehensive security review + repairs (all verified in production).

- FIXED (high): writing_entry_entities RLS was `auth.uid() IS NOT NULL`
  for ALL commands — any signed-in user could read/create/delete any
  user's writing↔entity links. Applied the Phase-0 owner-scoped policy
  migration (had been written 2026-06-11 but never applied).
- FIXED (high): entity_connections_bidirectional view was SECURITY
  DEFINER (Supabase advisor ERROR) — bypassed caller RLS, exposing all
  users' graph edges to any authenticated user. Now security_invoker;
  owner/collaborator/community policies verified intact.
- FIXED (medium): stored-XSS defense-in-depth — added DOMPurify and a
  shared sanitizeHtml(); all 7 dangerouslySetInnerHTML sites (wiki,
  chronicle, infobox, writing panels, compile) now sanitize. CSP
  (script-src 'self') remains the first wall; this is the second.
- FIXED (medium): waitlist-confirmation v2 — per-IP throttle (5/hour,
  SHA-256-hashed IPs, 429 beyond). Verified live: 5 pass, 6th → 429.
- FIXED (low): audio-tracks bucket allowed ANYONE to enumerate all
  users' file paths; listing now owner-scoped (playback via public
  URLs unaffected). Pinned trim_document_versions search_path.
- AUDITED clean: no secrets in repo or git history (only VITE_
  publishable values, public by design); CSP strict (no unsafe-inline
  scripts); edge functions verify JWT + CORS allow-listed origins;
  Stripe webhook sig handling untouched; new manuscript tables all
  owner-scoped RLS; waitlist/admin_todos policy-less BY DESIGN (now
  documented in schema comments).
- Remaining (flagged, not applied): fork_world completeness fix
  migration (data integrity, awaiting Jason's review); advisor WARNs
  about EXECUTE grants on SECURITY DEFINER functions are the intended
  share-link/subscription helpers.


## 0.6682
Manuscript editor + ambient telemetry (Implementation Guide phases 4–5) + connective audit.

- Added: /write/:entryId — the Scrivener-style manuscript editor (writer
  register). 44px topbar with Outline/Editor/Corkboard segmented modes
  (all three functional), breadcrumb, session meter, Focus toggle.
  Binder rail: binder_nodes tree + Unfiled entries, status dots,
  + Scene / + Chapter / + Folder (all wired). Center: Lora 18px/1.78
  prose with drop-cap, editable Lora-italic title, status select,
  autosaving through the existing StellarForgeEditor (@-mentions and
  wiki-links included). Pin bar: world entities pinned per scene,
  color-coded, unpinnable. Inspector: Synopsis tab (synopsis, time &
  place, target words + progress bar) and References tab (entity
  search + pin). Status bar: pulsing save state, counts, JD.
  /write resolves to your latest piece.
- Added: manuscript schema (additive, applied to production):
  writing_entries gains synopsis/status/pov/location/time_label/target;
  binder_nodes tree; scene_pins; writing_sessions daily word rollup —
  writing_entries stays the ONE writing model (SF-II: no parallel
  content tables). Owner-scoped RLS on all new tables.
- Changed: all Write links now lead to the studio experience (Jason's
  request): header user-menu Write → /studio; nav "Writing Space" →
  "Studio" → /studio; Studio continue-card → /write/:id; Codex writing
  entries → /write/:id.
- Phase 5: existing footer VelocityDial gained a prefers-reduced-motion
  guard; duplicate dial I nearly introduced was caught and removed;
  Julian Day line added to the footer telemetry column.
- Connective audit: scanned every to=/navigate/href target in src
  against the route table — fixed the two real broken links
  (/writing → /workshop; /writing-workshop?entryId → /write/:id).
- Note: Supabase generated types not yet regenerated for the new
  tables; access is quarantined in useManuscript.ts pending the next
  `supabase gen types` pass.


## 0.6672
Studio Home — the writer's home at /studio (Cowork Implementation Guide phase 3).

- Added: /studio (authed; redirects to /auth) in the WRITER register —
  Lora italic voice, sentence case, no // prefixes, glowing status dots,
  single footer telemetry strip (JD + coordinates). Zero radius, tokens only.
- Modules: time-aware greeting with contextual sub-line from the last
  writing session · 14-day streak strip with lit cells + three ledger
  stats · continue-writing hero card (world crumb, title, THE actual
  last sentence as a teal-bordered blockquote, deep-link into
  /worlds/:id/write) · bookshelf of world covers (3:4, gradient + inset
  frame + Lora titles, "+ Begin a new project" dashed tile) · cast grid
  from character entities · scratchpad from world_notes · activity log ·
  left rail (Projects / Workbench / Tools with real routes).
- Data: useStudioData maps the guide's model onto the LIVE schema
  (projects→worlds, manuscript→writing_entries, cast→entities,
  scratchpad→world_notes); streaks derive from entry-touch dates until
  the Phase-4 sessions/word_events rollup lands. Graceful empty states
  throughout for new accounts.
- Note: guide phase 4 (manuscript editor: binder, pins, @mentions,
  inspector) requires new schema (binder_nodes, scenes, pins) that must
  be designed WITH the SF-II canonical-model migration (no parallel
  structures) — next session's work.


## 0.6662
Launch infrastructure — /early waitlist page live (Cowork Implementation Guide phases 1–2).

- Added: /early public landing/waitlist page (mono campaign register) built
  from design/Landing Page.html — hero, ship's manifest panel, stat strip,
  10-tool sample grid, live T-MINUS countdown chip.
- Added: src/config/launch.ts — THE single LAUNCH_DATE constant
  (2026-08-11 09:00 PT); all countdowns and copy derive from it.
- Added: public.waitlist table (RLS enabled, deliberately NO client
  policies) + waitlist-confirmation edge function: validates, idempotent
  dedupe, sends mono-register Resend confirmation with EARLY40 code.
  Applied to production and smoke-tested (invalid→400, valid→email sent,
  duplicate→success, anon read→blocked).
- Added: Lora serif (writer register) to font load + --font-serif token +
  Tailwind serif family. Writer voice is Studio/editor-only per the two-
  register rule; campaign/ops chrome stays mono.
- Changed: design/Operating Plan.html asset checklist — waitlist landing
  row marked DONE (was due Jul 15; shipped Jul 9).


## 0.6652
StellarForge II Phase 1 — token foundation activated; cyan & Space Grotesk retired.

- Added: `src/styles/tokens.css` is now ACTIVE — imported first by `index.css`.
  Canonical three-tier token architecture (primitives → semantic → surface)
  with shadcn aliases and unified `--text-1…5` hierarchy; both legacy text-tier
  systems (`--t1…--t5`, `--sf-tier-*`) alias to it during the transition.
- Changed: **legacy cyan retired product-wide** (SF-II settled decision #3).
  `--sf-cyan` / `--sf-glow-cyan` now alias the teal accent, so every legacy
  `sf-cyan` class renders teal; all ~45 files with literal cyan values
  (graph components, simulators, Solaris UI, StellarCartographer, tools,
  showcase mockups, Rogue's `public/rogue/*.html`) swept to teal values.
  The "Comm Channel" writing theme re-expressed on the azure family
  (deep blue + azure signal text) per the plan's governed-primitives rule.
  Entity/cascade color maps: environment, technology, and custom types now
  use teal.
- Changed: **Space Grotesk retired** (SF-II settled decision #4). Removed from
  the Google Fonts load; simulator/cartographer headers now use Jura. Four
  fonts only. Canvas-export weights normalized 600 → 500 (no-bold law).
- Changed: PDF/DOCX exports re-branded off the pre-teal cyan palette
  (`#007a7a`/`#00E5E5`). New `src/lib/pdf/palette.ts` derives the print
  palette from canonical tokens at module load (teal darkened for AA on
  white paper); `lib/pdf/styles.ts`, the "Classic" export theme, and the
  PDF header logo consume it.
- Changed: UI primitives purged of hardcodes — `button.tsx` (`text-[#08110C]`
  → `--accent-on-accent`), `scroll-area.tsx`, `rich-text-editor.tsx`
  (stellar-blue literals → `sf-stellar`), `badge.tsx` glow-cyan variant now
  aliases teal tokens instead of raw Tailwind cyan-500.
- Removed: dead light-theme palette from `index.css` (:root) — the app
  hard-sets `<html class="dark">`, so it was unreachable; 46 lines gone.
  Unused `--glow-cyan`/`--glow-cyan-subtle` deleted. Stray junk file at repo
  root deleted. `src/lib/STELLARFORGE-DESIGN-SYSTEM.md` (contradictory
  cyan-era doc) replaced with a superseded stub; April 2026 design handoff
  README marked ARCHIVE (its "Clerk" line flagged wrong).
- Added: CI guardrails extended — typecheck/lint/vitest/build job in
  `sf2-guardrails.yml`; cyan watch and a new Space Grotesk watch are now
  HARD FAILURES; hex ratchet baseline lowered 909 → (post-sweep count).
- Added: `docs/DESIGN-TOKENS.md` (token architecture & usage policy).
  CLAUDE.md simulator sections corrected (sims use the product teal; the
  "legacy cyan is intentional" note was stale).
- Note: the two Phase-0 DB migrations (`20260611_fix_*`) remain in the repo
  UNAPPLIED, awaiting Jason's review per the live-product rule.


## 0.6642
- Fixed: Source-maps could ship publicly when SENTRY_AUTH_TOKEN was unset
  or upload failed. The plugin's filesToDeleteAfterUpload only fires after
  a successful upload, and the previous errorHandler swallowed failures,
  so a misconfigured Vercel preview or an expired/missing token would
  result in ./dist/**/*.map being deployed and served, exposing the
  pre-bundle source tree (file paths, variable names, comments, internal
  Supabase patterns) to anyone who follows the //# sourceMappingURL=
  comment in the bundle.
- Changed: build.sourcemap is now conditional on !!process.env.SENTRY_AUTH_TOKEN.
  When the token is set, maps emit as "hidden" so the //# sourceMappingURL=
  comment is omitted from the bundle and the URLs aren't trivially
  discoverable, while the Sentry plugin still gets the .map files for
  upload + deletion. When the token is unset, maps aren't generated at
  all so there's nothing to leak.
- Changed: sentryVitePlugin is now only registered in the plugins array
  when SENTRY_UPLOAD_ENABLED is true. Contributor clones and any
  unconfigured environment skip both map generation and the upload
  attempt entirely.
- Changed: errorHandler now throws on upload failure instead of logging a
  warning. With the token gating above, this only fires when the token IS
  set but upload fails (network error, expired token, project quota),
  which is a real CI-time misconfiguration worth surfacing rather than
  silently shipping unuploaded maps.

## 0.6632
- Changed: ValueProposition.tsx rewritten from a 3-column identical-card grid
  (an explicit absolute ban in the impeccable design rules) to a numbered
  cascade. Mono "01"/"02"/"03" amber-warm prefixes, Jura uppercase headings,
  DM Sans Tier-2 body, light-arc dividers between rows. Body lengths vary
  intentionally so the rhythm isn't three equal blocks. Copy now leans into
  the Cascade voice from PRODUCT.md ("Define gravity once. Biology,
  psychology, mythology, and culture rearrange themselves around it").
  Eyebrow uses the same `// WHY STELLARFORGE` mono-with-hairline pattern as
  WelcomeHero.
- Changed: font-semibold (weight 600) replaced with font-medium (weight 500)
  in 10 locations across PlanetaryProfile, SelectedParametersSidebar,
  SuggestedImplications, StarSystemDiagram, WorksheetTitle, and
  RecentArticles. Weight 600 violated the Two-Weight Rule (300 / 500 only)
  documented in DESIGN.md and CLAUDE.md.
- Fixed: LoggedInHero H1 was using text-white and tracking-sf-wide. Both
  violate the design system: text-white bypasses the navy-tinted Tier-1
  neutral, and tracking-sf-wide (0.2em) is the eyebrow/label tracking, not
  H1 tracking. Now uses text-t1 and tracking-sf-title (0.08em) per the
  CLAUDE.md H1 spec. WelcomeHero already had this right; LoggedInHero is
  now consistent.
- Changed: Generic Tailwind palette swatches in LoggedInHero badges
  (bg-violet-500/20, bg-amber-500/20) replaced with the design tokens
  (bg-sf-violet/20, bg-sf-amber/20) so future Pro-tier color tweaks
  propagate from the token layer.
- Changed: rounded-lg on tool diagram containers (PlanetSizeComparison,
  OrbitalDiagram, StarSystemDiagram placeholder) replaced with rounded-none
  to match the surrounding GlassPanel. The rounded canvas inside a sharp
  panel was reading as a styling discontinuity.
- Changed: Hardcoded #0D0D0F backgrounds in OrbitalDiagram and
  StarSystemDiagram replaced with bg-sf-void so the canvas plane sits on
  the same color as the rest of the UI.
- Changed: rounded-full indicator pips on GravityScaleBar (planet marker),
  ToolActionBar (share-status dot), and AtmosphericRetentionChart (legend
  pips) switched to rounded-sm. Sharp edges are core identity; circular
  markers were the most divergent end of the radius spectrum. Progress
  bars in AtmosphericRetentionChart kept rounded-full because they're
  functional UI, not chrome.
- Fixed: text-white/20 ghost text in OrbitalDiagram switched to text-t5,
  aligning with the 5-tier hierarchy instead of inventing a 0.20-alpha
  off-ladder slot.
- Distilled: pure #fff in StellarCartographer.module.css button-hover
  state changed to #FAFAFA (Tier-1) per the No Pure-Black Rule. Canvas
  hex literals (#FFFFFF/#000000) in StellarCartographer.tsx and
  OrbitalDiagram.tsx were left intact because they're physics-driven
  (event horizons, star-core gradient endpoints), not UI chrome.

## 0.6622
- Added: @sentry/vite-plugin wired in vite.config.ts for source-map upload.
  Plugin reads SENTRY_AUTH_TOKEN from env at build time, uploads .map files
  to Sentry release `stellarforge@<APP_VERSION>` (matched against the
  runtime release in src/lib/sentry.ts by reading version.ts at build
  time), then deletes the .map files post-upload via
  filesToDeleteAfterUpload so they don't ship in the public bundle.
  build.sourcemap: true enables .map generation. errorHandler logs a
  warning instead of failing the build when the token's missing, so
  contributor clones and unconfigured environments still build cleanly.
- Configured: org=dreamside-studios, project=javascript-react-r3.
  Stack traces in Sentry should now resolve to file:line in src/.

## 0.6612
- Added: Sentry error monitoring via @sentry/react. Initialized from
  src/lib/sentry.ts and called in src/main.tsx before App renders.
  DSN-gated: when VITE_SENTRY_DSN is unset, init returns early and every
  Sentry call is a no-op (safe for local dev and contributor clones).
- Added: ErrorBoundary now reports caught exceptions to Sentry with the
  React component stack as context. The visual SYSTEM FAULT screen is
  unchanged; this just adds the silent backchannel.
- Added: Performance tracing at 10% sample rate in production, 100% in
  dev/preview. Browser tracing integration enabled by default.
- Added: ignoreErrors filter to drop non-actionable noise from the Sentry
  inbox: chunk-load errors auto-recovered by preload-error-recovery,
  ResizeObserver loop messages, AbortError, common Tanstack-retried
  network blips. Also strips Referer header in beforeSend to avoid
  leaking share-tokens.
- Added: VITE_SENTRY_DSN entry in .env.example with setup notes.
- Added: Error Monitoring (Sentry) section in CLAUDE.md documenting what
  gets reported, what gets filtered, and what's intentionally not yet
  wired (source-maps upload, Session Replay, user identification).

Source-maps upload via @sentry/vite-plugin is a follow-up that needs a
Sentry auth token from the user. Until then, stack traces in Sentry use
minified function names.

## 0.6602
- Changed: Header wordmark switched from ALL-CAPS "STELLARFORGE" to mixed-case
  "Stellarforge" with the existing teal-split treatment ("Stellar" in Beacon Teal,
  "forge" in tier-1). ALL CAPS stays for instrument vocabulary (eyebrows, status,
  telemetry, button labels). Wordmark is now visible to ALL users at xl+ widths
  during OPEN EARLY ACCESS, not just subscribed users; "SF" abbreviation kept
  for compact widths.
- Removed: All user-facing em-dashes from JSX, attributes, and string literals.
  ~150 instances replaced across pages, components, MDX learn content, and the
  ExoSkySimulator atmoDesc data strings. Replacements use commas, colons,
  semicolons, periods, parens, or middle-dot separators per impeccable's rule
  set. Placeholder em-dashes ("—" for missing values) replaced with hyphens.
  Code comments and CSS comments left untouched (rule applies to copy, not
  comments). The regex character class in services/entity-match.ts was
  intentionally preserved.
- Fixed: Typo `text-sf-crimson-foreground` (which doesn't resolve to anything
  in tailwind.config.ts) replaced with `text-destructive-foreground` across
  5 files: DeleteConfirmDialog, badge.tsx, button.tsx, SettingsDialog,
  BackgroundSelector. Destructive button text is now actually white instead
  of inheriting whatever was up the cascade.
- Added: Visible :focus-visible ring to .sf-nav-link in src/index.css for
  keyboard a11y. Beacon Teal outline + activates the bottom accent line for
  parity with hover state.
- Added: Z-Index Stacking Order section in CLAUDE.md documenting the canonical
  layer assignments (backgrounds at 0, content at 10-30, FABStack 40, Header 50,
  toasts 100, AudioPlayer 8999, site-critical overlays 9999) plus the
  FABStack-AudioPlayer collision-avoidance pattern.

## 0.6592
- Added: Logo-adjacent "Sign Up / Log In" button in Header, visible only to
  logged-out users. Uses the Beacon Teal accent (matches the primary CTA
  color) with sm size so it doesn't compete with the wordmark. Hidden on
  mobile (< sm); the existing mobile menu still has its full AUTHENTICATE
  button. Hidden once the user is signed in.
- Added: /auth#create-account anchor support. The button links to
  /auth#create-account; Auth.tsx now listens for location.hash and scrolls
  the CREATE ACCOUNT card into view via requestAnimationFrame on mount,
  honoring scroll-mt-24 for clearance under the fixed header + banner.
  Pattern extends to any future hash deep-link to /auth.

## 0.6582
- Changed: Opened the site for OPEN EARLY ACCESS. SiteGate's PRIVATE_MODE flipped
  to false. Logged-out users can now browse the public surface (Index, Features,
  Pricing, About, Community, Bookshelf, Learn, Guide, legal). Authenticated routes
  (/worlds/*, /tools/*, /profile, /archive, /admin) are still protected by their
  own per-page redirects and ProToolGuard wrappers.
- Changed: Auth.tsx replaced the early-access REQUEST form (which submitted a
  contact-form notification, not a real account) with a working CREATE ACCOUNT
  flow. OAuth at top (Google, one-click signup-or-signin), email/password signup
  below (calls signUp from AuthContext with optional display name). Existing-user
  Sign In collapsible still at the bottom. Eyebrow updated from "// CLEARANCE
  REQUIRED" to "// OPEN EARLY ACCESS".
- Changed: WelcomeHero eyebrow from "// SCIENCE FICTION WORLDBUILDING" to
  "// OPEN EARLY ACCESS". Added a short disclaimer line below the existing
  free/pro tools note: "Still under construction. Surfaces may shift. Your
  feedback shapes what we ship."
- Changed: BetaBanner copy from "SYSTEM STATUS: BETA · OPERATIONAL" to
  "OPEN EARLY ACCESS · STILL BUILDING". Reduced vertical padding (py-2 to py-1)
  and text size (text-xs to text-[10px]) for a tighter banner. Icon now w-3 h-3.

## 0.6572
- Fixed: ArchiveToggle catch-22 on /worlds. The toggle hides itself when
  `archivedCount === 0`, but the count was computed from the already-filtered
  `worlds` array (which excludes archived rows by design). Result: users
  with only archived worlds had no way to see the toggle, and no path to
  recover archived worlds from /worlds. Added a separate `archivedCount`
  count-only query in useWorlds that is independent of the current view.
  Toggle now appears correctly whenever the user has any archived worlds,
  regardless of which view they're on.
- Added: preload-error-recovery handler. When a dynamic import fails to
  fetch a chunk (e.g., long-lived tab on a previous deploy whose chunk
  hashes no longer exist on the server), the page auto-reloads once to
  pick up the latest deploy. A sessionStorage guard with a 30-second TTL
  prevents reload loops if the issue persists. Imported as a side effect
  at the top of App.tsx.

## 0.6562
- Fixed: Genesis (Planetary Profile) crash continued after 0.6552 — `<Check />` and
  `<AlertCircle />` lucide icons in the consistency-score block at line 1607-1609 were
  also missing from the import. Added both.
- Fixed: build gate from 0.6552 was security theater. Root tsconfig.json uses project
  references with `"files": []`, so `tsc --noEmit` against it was a no-op (exited 0
  without checking anything). Replaced with `scripts/typecheck-strict.mjs` which runs
  tsc against tsconfig.app.json and fails the build only on TS2304/TS2552 (the exact
  "Cannot find name" class that crashed Genesis). Pre-existing type-mismatch errors
  do not block the build.
- Fixed: forks still not appearing in My Worlds after 0.6552. The embed
  `source:forked_from(id, name)` was suspected of triggering RLS interaction that
  filtered parent rows. Removed the JOIN; world cards render without source-name
  attribution for now (FORK badge still shows). Source attribution can be added back
  via a separate query if/when the PostgREST embed behavior is understood.

## 0.6552
- Fixed: Genesis (Planetary Profile) crash on render — `<Info />` lucide icon was used in
  the Tidal Locking section but never imported, throwing ReferenceError into the
  ErrorBoundary as soon as the worksheet mounted
- Hardened: Build script now runs `tsc --noEmit` before `vite build` so undefined-identifier
  bugs fail CI instead of reaching production. Added standalone `npm run typecheck` script.
- Fixed: Forks now appear in My Worlds. The useWorlds query was relying on RLS alone with
  no row filter and silently returned [] in production; added explicit
  `.eq("user_id", user.id)` to mirror the working pattern used elsewhere
- Added: FORK badge (Wonder Blue accent, mono small caps) on world cards when
  forked_from is set, stacked with the Archived badge in the header overlay
- Added: "Forked from {sourceName}" subtitle below the description on fork cards.
  useWorlds now joins `source:forked_from(id, name)` for one-round-trip attribution.
- Fixed: world_invites 403 hitting the badge evaluator on every page load. The
  "Invited users can view own invites" RLS policy read from auth.users which the
  authenticated role cannot SELECT; replaced with `auth.jwt() ->> 'email'`.
  Migration: `supabase/migrations/20260428_fix_world_invites_rls_auth_users.sql`
- Added: PRODUCT.md, DESIGN.md, and DESIGN.json at repo root (impeccable design-system
  foundation — Stitch-format token spec, register: product, scholarly/instrumental/patient
  brand voice, four named anti-references, WCAG 2.2 AA target). North Star metaphor:
  "The Bridge of a Slow Ship."

## 0.6512
- Fixed: Dark background gap in writing area (bg-void on center column)
- Fixed: Zen mode exit button more visible (opacity 60 instead of 40)
- Fixed: Pin to References now shows toast confirmation
- Added: Multiple notes open simultaneously in reference panel
- Added: Scratchpad tab in reference panel (auto-saves to localStorage)
- Added: Line spacing options (1x / 1.5x / 2x) in writing formatting bar
- Added: Font selector (DM Sans / Georgia / Merriweather) for prose writing
- Added: Writing format preferences persist per world

## 0.6462
- Fixed: "Continue Writing" hero button now routes to most recent world's Writing Space
  (was going to /workshop prompt page)
- Added: Chapters/folders in Writing Space - organize documents into named chapters
- Added: Hierarchical document navigator in top bar (expandable folders, drag-to-move)
- Added: Create Chapter, Create Document in Chapter, Rename/Delete Chapter
- Added: Drag documents between chapters (HTML5 drag-drop)
- Added: Unfiled section for parentless documents
- Added: useCreateFolder, useMoveDocument, useRenameFolder, useDeleteFolder hooks
- Uses existing parent_id column in world_entries (zero migration needed)

## 0.6432
- Moved: Writing prompt now below tools on homepage (was above)
- Removed: All emdashes from user-facing copy (35+ in prompts, 17+ in example world, quotes, pages)
- Fixed: Duplicate fork prevention on ExampleWorldBanner (shows "Go to Your Copy" if already forked)
- Expanded: Example world now has 14 entities, 19 connections (added character, technology, artifact, event)
- Added: Kel Vorathi (blind negotiator), Bloom Lanterns, The Farthest Shade Stone, The Great Dimming
- Cleaned: Emdashes removed from database entity descriptions and notes

## 0.6421
- Fixed: Showcase visibility now database-backed (Private/Community/Public selector
  replaces localStorage, updates worlds.visibility column directly)
- Fixed: Security — comments and favorites INSERT policies now require world to be
  community/public (prevented commenting/favoriting private worlds)
- Added: Affiliate link click tracking (localStorage-based, fire-and-forget)
- Added: Security fix migration applied to Supabase

## 0.6411
- Fixed: Write dropdown links — Writing Space goes to most recent world's /write,
  Daily Prompt to /workshop, Prompt Browser to new /prompts page
- Added: Prompt Browser page (/prompts) — weekly rotation of 7 prompts with timer,
  acted-upon tracking, expired prompt count, deterministic selection by week
- Added: useWeeklyPrompts hook — deterministic weekly prompt rotation with localStorage
- Added: "Pin to Writing Space" button on all worksheet tool pages
- Added: PinToWritingButton component — works from any page, pin/unpin toggle with toast
- Added: Worksheets browsable in Writing Space reference panel (Notes tab, top section)
- Added: Worksheet pins show stellar-blue badges in Pinned tab
- Extended: PinnedItem type supports 'worksheet' alongside entity/note/snippet

## 0.6381
- Fixed: Dropdown positioning — viewport wrapper now spans full nav width (left-0 right-0)
  so Guide dropdown aligns under its trigger instead of shifting left
- Changed: "Workshop" → "Write" dropdown with Writing Space, Daily Prompt, Prompt Browser
- Reordered: Header nav is now Worlds | Tools | Write | Learn | Community | Guide | Pricing
- Updated: Mobile menu "Workshop" → "Write" with sub-items (Daily Prompt, Prompt Browser)
- Updated: User dropdown "Workshop" → "Write"

## 0.6371
- Added: EntityHistory component (created/modified timestamps on entity details)
- Added: Entity history in TreeView detail panel and WritingEntityPanel
- Added: Delete confirmation for writing documents (window.confirm with name)
- Added: Social sharing on SharedWorksheetView (public share pages)
- Updated: Roadmap — marked 10+ previously completed items as done

## 0.6361
- Fixed: Header nav alignment — flat links (Learn/Workshop/Community) now match
  dropdown trigger baseline with h-10 flex items-center
- Added: "WRITING SPACE" page title label in top bar
- Fixed: Zen mode document title reduced from text-2xl to text-lg
- Added: "Pin to References" button in entity detail panel (pins entity to right panel)
- Added: Entity pins show emerald badges in reference panel (vs amber for notes)
- Added: [[ and @ shortcut buttons in writing top bar (blue bracket, green at-sign)
- Added: Tooltips on [[ and @ buttons explaining wiki links and entity mentions

## 0.6351
- Fixed: UX navigation — every major feature now reachable through normal navigation
- Added: "Write" and "Showcase" links in world sidebar quick access
- Added: Prominent "Write" CTA (primary button) on World Dashboard toolbar
- Added: "Community" flat link in desktop header navigation
- Added: "Bookshelf" and "About StellarForge" in Guide dropdown
- Added: Community, Commendations, Bookshelf, About in mobile menu
- Added: Community, Commendations in Footer product column; About in resources
- Added: "From the Community" section on homepage for logged-in users
- Added: "Continue Writing" button in LoggedInHero

## 0.6341
- Added: Community Worlds system — visibility (private/community/public), licensing,
  favorites, comments, fork_world RPC for deep-copying worlds
- Added: Community browse page at /community with search, sort, world cards
- Added: Fork button, favorite toggle, license badges, comment section
- Added: Example world banner on worlds page
- Added: Visibility + license controls in ShareDialog
- Added: Community features on World Showcase (fork, favorite, comments)
- Added: "The Tidelock Archives" example world seed data (10 entities, 12 connections,
  full cascade from physics through culture)
- Rebuilt: Writing Space with three-panel layout
  - Left: Entity Facts panel (list mode → detail mode with connections)
  - Right: Reference panel (Notes tab, Pinned tab, History tab)
  - Top: Collapsible moodboard strip
  - Extracted: WritingTopBar, WritingEntityPanel, WritingReferencePanel,
    WritingMoodboardStrip components
- Added: Keyboard shortcuts for panel toggling (Ctrl+\, Ctrl+Shift+\, Ctrl+M)
- Added: Pinnable reference items (localStorage-based)

## 0.6241
- Fixed: KardashevScale export — wrong QuickExportButton props, missing PDF templates
- Added: KardashevSummaryTemplate + KardashevFullReportTemplate PDF exports
- Fixed: PDF preview memory leak — previewBlob helper with 60s delayed revocation
- Added: OG meta tags on all 21 tool pages (via ToolPageLayout), WorldDashboard, WritingWorkshop, WorldConnections
- Added: vendor-three and vendor-html2canvas manual chunks for bundle optimization
- Completed: Systematic bug-fix audit — 21 tools checked, 1 critical fix (K-Scale), 20 passing

## 0.6231
- Added: Dynamic Open Graph meta tags (useMetaTags hook) on Showcase, About, Writing Space
- Added: Social sharing buttons in ExportDialog (all tools get share on export)
- Added: Public/private toggle on World Showcase (owner-only, localStorage placeholder)
- Added: Showcase owner banner ("This showcase is private" with Make Public button)

## 0.6221
- Added: 47 new writing prompts (62 total across 5 categories)
- Added: Personalized prompt generator from world entity data
- Added: Prompt of the Day on homepage (deterministic by date)
- Added: SF quote affiliate links with "Get the book" links
- Added: Archive undo toast with restore action
- Added: Type-to-confirm delete dialogs for worlds and worksheets
- Added: Recent Activity section on World Dashboard (last 10 edited items)
- Verified: RLS policies on entities + entity_connections tables are secure
- Updated: Roadmap with 3 new Notion items (See it in Action, features video, activity/history)

## 0.6196
- Fixed: PDF export download — delayed URL.revokeObjectURL across all 5 export dialogs
- Added: Zen Mode for Writing Space — full-screen distraction-free editing (Escape to exit)
- Added: About Us page at /about — team, mission, Environmental Cascade philosophy
- Added: World Showcase page at /worlds/:id/showcase — public-facing world display with
  entity gallery, cascade coverage bar, stats, inline entity detail expansion
- Added: SocialShareButtons component — share to Twitter/X, Reddit, LinkedIn, Facebook, copy link
- Added: Social sharing on World Showcase hero section

## 0.6166
- Added: CSV export for worksheets (flattened key-value), entities, and connections
- Added: CSV tab in ExportDialog with preview
- Added: Cross-tool linked export (unified document with inline cross-references)
- Added: "Include cross-references" checkbox in World Export for Text/Markdown formats
- Added: Relationships appendix in linked exports

## 0.6156
- Fixed: Mind Map now uses EntityTreeView with full entity hierarchy
- Fixed: WorldConnections "Mind Map" view replaced with entity-based tree (drag-to-reparent, context menus, detail panel)
- Added: Three view modes on Connections page: Mind Map (entity tree), Worksheet Graph (old D3), Outline
- Added: Create Entity button on empty mind map state
- Added: Entity creation from mind map with parent pre-fill

## 0.6146
- Added: SENSORIUM push-to-worksheet sync (insights pushed to linked star/planet/evo-bio worksheets)
- Added: SENSORIUM environment fine-tuning sliders (atmospheric density, light, temp, conductivity)
- Added: SENSORIUM comparative species view (your species vs human baseline side-by-side)
- Added: SENSORIUM perceptual narrative generator (template-based "what it feels like" snapshot)
- Added: SENSORIUM tooltips on environment settings and sliders
- Added: SENSORIUM Ctrl+S keyboard shortcut for save
- Added: SENSORIUM tutorial banner (dismissible, localStorage-persisted)
- Added: Framer Motion fade-in on Perceptual Snapshot card

## 0.6121
- Added: Writing Space version history (localStorage snapshots, 5-min auto, Ctrl+S manual)
- Added: Version history panel with preview and restore
- Replaced: World Notes RichTextEditor → StellarForgeEditor preset="rich" with @mentions
- Added: World Notes now supports @entity mentions and [[wiki links

## 0.6116
- Replaced: Entity description/notes/summary textareas with StellarForgeEditor (4 components)
- Added: Node right-click context menu in graph (Cascade Audit, Unpin, Delete)
- Added: Timeline scrubber temporal filtering (edges hide/show based on time position)
- Added: Historical connections shown as dashed lines during timeline playback

## 0.6111
- Added: Mind Map drag-to-reparent (HTML5 drag-and-drop with circular reference prevention)
- Added: Entity detail side panel on tree node click (280px slide-out with edit/delete)
- Added: Enhanced context menu (Edit Entity, Remove from Tree, divider before Delete)
- Added: Visual drag feedback (cyan glow for valid targets, red for invalid)
- Added: Drop on empty space makes entity a root node

## 0.6101
- Fixed: World Graph crash — default to Knowledge Graph, Entity Graph wrapped in error boundary
- Fixed: Note/document title reduced from oversized to text-xl, editable title in writing space
- Fixed: Resize handle now expands content (flex:1), not just border
- Fixed: New note starts at 160px min-height instead of single line
- Fixed: Notes title field restyled (font-heading text-lg font-light)
- Archived completed spec docs, updated ROADMAP and PROJECT-OVERVIEW

## 0.6100
- Added: World Graph & Entity Layer (entities, connections, cascade-aware relationships)
- Added: Graph analytical tools (gravity, narrative distance, tension detection, clusters, what-if removal)
- Added: Cascade Audit mode (upstream/downstream tree tracing)
- Added: Timeline scrubber for temporal exploration
- Added: Graph export (PNG, JSON, Markdown)
- Added: Cascade Filter Bar, Cascade Flow Layout, List View
- Added: Mind Map / Tree View (entity hierarchy)
- Added: Dedicated Writing Space with Tiptap editor
- Added: Entity-powered sidebar with drag-and-drop reordering
- Added: Version number display in navigation header
- Added: Xenomythology CTA on Mythos worksheet
- Added: General Notes freeform textarea in Narrative Bridge
- Fixed: Worksheet content overlap by navigation/readout panels
- Fixed: Navigation panel font consistency
- Fixed: Simulator title style (unboxed across all simulators)
- Fixed: Tools mega menu (three-column with icons)
- Fixed: Guide dropdown alignment
- Fixed: Background video thumbnail fallback for .mov files
- Fixed: World Notes resizable via drag handle
- Fixed: Left sidebar font sizes increased

## Pre-0.6100
- Initial StellarForge platform with 21 worldbuilding tools
- 5 interactive simulators (ROGUE, ExoSky, TIDELOCK, ExoForge, Solaris)
- Stellar Cartographer
- Supabase auth, worlds, worksheets, collaboration
- Stripe Pro tier ($4.99/month)
