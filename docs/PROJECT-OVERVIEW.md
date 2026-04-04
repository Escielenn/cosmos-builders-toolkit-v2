# StellarForge — Complete Project Overview

**For:** Claude Code context in separate instances  
**Last updated:** 2026-04-01  
**Repository:** `cosmos-builders-toolkit-v2`

---

## What Is StellarForge?

StellarForge.tools is a science fiction worldbuilding platform for writers. The tagline is *"These worlds exist in you. Waiting to be found."*

It provides ~25 specialized tools — worksheets, calculators, and interactive simulators — that help beginning SF writers build rigorous, science-based fictional worlds. The platform follows the **Environmental Cascade** principle:

> Physics → Environment → Biology → Psychology → Mythology → Culture

Change something upstream, and everything downstream shifts. Tools are organized around this chain — each builds on what comes before, each output becomes input for what follows.

**Target audience:** Beginning SF writers who struggle with blank page syndrome. They want scientific credibility, not vague creative prompts or "humans in rubber suits" aliens.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (custom design tokens, glass-panel aesthetic) |
| UI Components | Radix UI primitives + custom sci-fi components |
| Rich Text | TipTap editor |
| State | TanStack React Query v5, React Context |
| Routing | React Router DOM v6 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (currently; migrating to Clerk — see STACK-ARCHITECTURE.md) |
| Hosting | Vercel |
| Payments | Stripe ($4.99/mo Pro, $49/yr) |
| CMS | Sanity (blog, learn articles) |
| Email | Resend (transactional), ImprovMX (forwarding) |
| PDF Export | @react-pdf/renderer |
| DOCX Export | docx library |
| Visualization | D3-Force, @xyflow/react |
| Icons | Lucide React + custom SVGs |
| i18n | i18next (infrastructure ready, string extraction pending) |
| Testing | Vitest + Playwright (minimal coverage currently) |

---

## Directory Structure

```
cosmos-builders-toolkit-v2/
├── src/
│   ├── App.tsx                    # Root component, all routing
│   ├── main.tsx                   # Vite entry
│   ├── index.css                  # Tailwind output + global styles (~90KB)
│   │
│   ├── pages/                     # Route components (~30 pages)
│   │   ├── tools/                 # 21 tool pages (worksheets, calculators)
│   │   ├── simulators/            # 9 simulator wrapper + science pages
│   │   ├── cartographers/         # Galaxy mapping tool
│   │   ├── learn/                 # Educational content
│   │   ├── legal/                 # Privacy, Terms, Credits, Changelog
│   │   ├── Index.tsx              # Homepage (30KB, dual hero: logged-in/out)
│   │   ├── Auth.tsx               # Login/signup
│   │   ├── Worlds.tsx             # World browser
│   │   ├── WorldDashboard.tsx     # Main world editor (45KB)
│   │   ├── Profile.tsx            # User profile
│   │   ├── ToolsWiki.tsx          # Full tool index with relationships
│   │   ├── Bookshelf.tsx          # Reference library
│   │   ├── Admin.tsx              # Admin dashboard (48KB)
│   │   └── NotFound.tsx           # 404
│   │
│   ├── components/                # 400+ components in 30+ directories
│   │   ├── ui/                    # 40+ base components (Radix + custom)
│   │   ├── tools/                 # Tool-specific (CollapsibleSection, ExportDialog, etc.)
│   │   ├── codex/                 # World knowledge base sidebar (10 files)
│   │   ├── layout/                # Header, Footer, FABStack, TextureOverlay
│   │   ├── landing/               # Homepage sections (Hero, ToolShowcase, etc.)
│   │   ├── dashboard/             # World cards, create button, filters
│   │   ├── simulators/            # Simulator UI wrappers
│   │   ├── admin/                 # Admin interface
│   │   ├── auth/                  # SiteGate, OAuth buttons
│   │   ├── subscription/          # Pricing cards, upgrade prompts
│   │   ├── badges/                # Achievement display
│   │   ├── sharing/               # Share dialogs, invite links
│   │   ├── world/                 # World components + chronicle
│   │   ├── writing/               # Workshop editor
│   │   ├── editor/                # Rich text components
│   │   ├── notes/                 # Floating notes
│   │   ├── moodboard/             # Image collage
│   │   ├── connections/           # D3 relationship graph
│   │   ├── search/                # Global search
│   │   ├── audio/                 # Player, playlists
│   │   ├── icons/                 # Custom SVG icons
│   │   ├── onboarding/            # Welcome flows
│   │   ├── settings/              # User preferences
│   │   ├── tags/                  # Tag system
│   │   ├── timeline/              # Chronicle visualization
│   │   ├── providers/             # Context providers
│   │   ├── common/                # CookieConsent, BetaBanner, ErrorBoundary
│   │   ├── contact/               # Contact form
│   │   ├── outline/               # Outline editor
│   │   ├── quotes/                # Rotating quotes
│   │   ├── sanity/                # CMS integration
│   │   ├── showcase/              # Showcase mockups
│   │   └── dialogs/               # Dialog components
│   │
│   ├── hooks/                     # 50+ custom React hooks
│   ├── contexts/                  # AuthContext, BadgeContext, WorldLayout, WorldTheme
│   ├── services/                  # Business logic (world CRUD, entity sync, export)
│   ├── lib/                       # 104 files — utilities, data, calculations
│   ├── integrations/supabase/     # Supabase client + auto-generated types (37K)
│   ├── layouts/                   # WorldLayout (nested routing)
│   └── test/                      # Test configuration
│
├── simulators/                    # Standalone HTML/JS simulators (loaded via iframe)
│   ├── Rogue/                     # N-body gravitational encounters
│   ├── Tidelock/                  # Tidally-locked world sim
│   ├── ExoSky/                    # Alien night sky viewer (real star data)
│   ├── EXOFORGE/                  # Procedural exoplanet generator
│   └── solaris/                   # Procedural star system sim
│
├── cartographers/                 # Stellar Cartographer subproject
│   └── stellar_cartographer/src/  # Galaxy mapping (components, hooks, utils)
│
├── public/
│   ├── fonts/                     # DM Sans, JetBrains Mono, Space Grotesk
│   ├── images/                    # Screenshots, logos
│   ├── icons/                     # Favicon set
│   ├── music/                     # Curated ambient playlists (MP3)
│   ├── audio/                     # Sound effects (WAV)
│   ├── profile-pics/              # Avatar presets
│   ├── locales/                   # i18n translation files
│   ├── rogue/                     # Rogue simulator assets
│   ├── exosky-stars.json          # Real star catalog
│   └── exosky-mw-worker.js        # Web Worker for star calculations
│
├── supabase/                      # Supabase config
├── docs/                          # Project documentation
│   ├── STACK-ARCHITECTURE.md      # Clerk + Stripe + Supabase architecture
│   ├── ROADMAP.md                 # Active task list / dev priorities
│   ├── BACKLOG.md                 # Detailed feature backlog
│   └── [reference docs...]
│
├── CLAUDE.md                      # Design system + code conventions (canonical)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── components.json                # shadcn/ui config
```

---

## Complete Tool Inventory

### Free Tools (3)

| ID | Name | Category | Type |
|----|------|----------|------|
| `environmental-chain-reaction` | **Cascade:** Environmental Chain Reaction | Integration | Worksheet |
| `spacecraft-designer` | **Vessel:** Lived-In Spacecraft Designer | Civilizations | Worksheet |
| `propulsion-consequences-map` | **Impulse:** Propulsion Consequences | Civilizations | Worksheet |

### Pro Worksheets (12)

| ID | Name | Category | Complexity |
|----|------|----------|------------|
| `planetary-profile` | **Genesis:** Planetary Profile | Worlds | Entry |
| `one-big-lie` | **Axiom:** The One Big Lie | Civilizations | Entry |
| `evolutionary-biology` | **Phylo:** Evolutionary Biology | Life | Entry |
| `xenomythology-framework-builder` | **Mythos:** Xenomythology Framework | Mythology | Entry |
| `star-system-builder` | **Orrery:** Star System Builder | Stars & Systems | Intermediate |
| `empire-designer` | **Dominion:** Empire Designer | Civilizations | Intermediate |
| `technology-consequences` | **Paradigm:** Technology Consequences | Civilizations | Intermediate |
| `species-interaction-matrix` | **Symbiosis:** Species Interaction Matrix | Life | Intermediate |
| `timeline` | **Timeline** | Integration | Intermediate |
| `space-expansion-modeler` | **Exodus:** Space Expansion Modeler | Civilizations | Advanced |
| `drake-equation-calculator` | **Drake Equation Calculator** | Stars & Systems | — |
| `writing-workshop` | **Writing Workshop** | Integration | — |

### Pro Calculators (7)

| ID | Name | Category | Complexity |
|----|------|----------|------------|
| `habitable-zone-calculator` | **Goldilocks:** Habitable Zone Calculator | Stars & Systems | Entry |
| `surface-gravity-calculator` | **Atlas:** Surface Gravity Calculator | Worlds | Entry |
| `time-dilation` | **Paradox:** Time Dilation Calculator | Stars & Systems | Entry |
| `lexdrift` | **Lexdrift:** Language Evolution | Civilizations | Intermediate |
| `sensorium` | **Sensorium:** Alien Sensory Systems | Life | Intermediate |
| `gravitas` | **Gravitas:** Spacecraft & Habitat Gravity | Worlds | Intermediate |
| `kardashev-scale` | **K-Scale:** Kardashev Scale Calculator | Civilizations | Intermediate |

### Simulators (5) — Standalone HTML/JS in iframes

| ID | Name | Description |
|----|------|-------------|
| `rogue` | **Rogue:** Wandering Object Encounters | N-body gravitational simulator. Drag rogue objects into real exoplanet systems (TRAPPIST-1, Kepler-90, Alpha Centauri, custom). Full physics. |
| `tidelock` | **Tidelock:** Locked World Simulator | Tidally-locked world visualization — terminator line, atmospheric effects, heat distribution. |
| `exosky` | **Exosky:** Alien Night Sky | View real constellations from any exoplanet. Uses actual star catalog data + Web Worker. |
| `exoforge` | **ExoForge:** Procedural Exoplanet Forge | Generate exoplanets with realistic characteristics, 3D visualization. |
| `solaris` | **Solaris:** Procedural Star System | Generate multi-star systems with N-body dynamics. Orbital visualization and parameter export. |

### Cartographer Tools (1)

| ID | Name | Description |
|----|------|-------------|
| `stellar-cartographer` | **Stellar Cartographer:** Galaxy Mapper | Procedural galaxy mapping with star types, naming, seeded randomization. Separate subproject in `/cartographers/`. |

### Tool Categories (Cascade Order)

| Category | Accent Color | Cascade Position | Tools |
|----------|-------------|------------------|-------|
| Stars & Systems | Amber `#FFB800` | Physics | Orrery, Goldilocks, Paradox, Drake, Rogue, ExoSky, ExoForge, Solaris, Stellar Cartographer |
| Worlds | Azure `#4D9FFF` | Environment | Genesis, Atlas, Gravitas, Tidelock |
| Life | Emerald `#00FF88` | Biology | Phylo, Sensorium, Symbiosis |
| Civilizations | Violet `#9B5DE5` | Culture | Axiom, Vessel, Impulse, Dominion, Paradigm, Lexdrift, K-Scale, Exodus |
| Mythology | Stellar `#5B8DEF` | Mythology | Mythos |
| Integration | Teal `#15C17B` | Meta | Cascade, Timeline, Writing Workshop |

---

## Routing Map

### Public Routes
- `/` — Homepage (WelcomeHero for logged-out, LoggedInHero + worlds for logged-in)
- `/auth` — Login/signup
- `/pricing` — Subscription tiers
- `/features` — Feature showcase
- `/roadmap` — Development timeline
- `/contact` — Contact form
- `/learn`, `/learn/:slug` — Educational articles (Sanity CMS)
- `/guide`, `/guide/field-manual`, `/guide/tools` — Getting started, reference
- `/getting-started` — Onboarding pathway
- `/bookshelf` — Reference library
- `/privacy`, `/terms`, `/credits`, `/changelog` — Legal
- `/share/worksheet/:token`, `/share/world/:token` — Public shared views (no auth)
- `/invite/:token`, `/join/:code` — Invitation/onboarding links

### Protected Routes
- `/worlds` — World browser
- `/worlds/:worldId` — World dashboard (nested layout with Codex sidebar)
  - `/worlds/:worldId/tools/:toolName` — Tool within world context
  - `/worlds/:worldId/pages/:entryId` — Wiki page
  - `/worlds/:worldId/wiki` — Full wiki
  - `/worlds/:worldId/chronicle` — Timeline
  - `/worlds/:worldId/graph` — Force-directed entity graph
  - `/worlds/:worldId/connections` — Relationship graph
- `/profile` — User profile/settings
- `/collection` — Saved items
- `/archive` — Archived worlds
- `/commendations` — Badge/achievement view
- `/workshop` — Writing workshop (Pro)
- `/admin` — Admin dashboard

### Tool Routes (wrapped in `ProToolGuard` for Pro tools)
- `/tools/:toolId` — Each tool at its own route
- `/rogue`, `/rogue/science` — Rogue simulator + science page
- `/tools/tidelock`, `/tools/tidelock/science` — Tidelock
- `/tools/exosky`, `/tools/exosky/science` — ExoSky
- `/tools/exoforge`, `/tools/exoforge/science` — ExoForge
- `/tools/solaris` — Solaris
- `/tools/stellar-cartographer` — Galaxy mapper

---

## World System

Each user can create multiple **worlds**. A world is the central container for all worldbuilding work.

### World Dashboard (`/worlds/:worldId`)
The main editing environment. Uses a nested layout (`WorldLayout.tsx`) with:

- **Codex sidebar** — Knowledge base with sections for Characters, Locations, Items, Factions, Species, Concepts, plus custom sections. Real-time search, context menus, completion tracking.
- **Wiki pages** — Rich-text entries (TipTap editor with Markdown support) for each entity.
- **Chronicle** — Timeline visualization for world events.
- **Connections graph** — D3 force-directed graph showing relationships between entities.
- **Notes** — Floating sticky notes on the world.
- **Moodboard** — Image collage for visual reference.
- **Tool integration** — Use any tool within world context; results save to the world.

### World Data Model
```
worlds → world_entities → world_entries (wiki pages)
       → world_connections (entity relationships)
       → world_notes
       → world_tags
       → worksheets → worksheet_elements
       → chronicle_events
       → world_outline
       → moodboard_images
```

### Entity Types
Characters, Locations, Items, Factions, Species, Concepts — each with configurable sections and pre-population templates.

---

## Authentication & Authorization (Current)

**Current:** Supabase Auth with email+password and OAuth (Google, GitHub, Discord, Apple, Notion).

- `AuthContext.tsx` provides `useAuth()` — user, session, profile, loading, sign-in/out methods.
- `SiteGate` — Site-wide access control wrapper.
- `ProToolGuard` — Subscription gating per tool.
- `useSubscription()` — Checks user tier (free / pro / vanguard).
- Profiles table mirrors auth users with display_name, avatar, bio, is_admin.

**Planned migration:** Moving to **Clerk** for auth, keeping Supabase for data only. See `docs/STACK-ARCHITECTURE.md` for the full spec — Clerk JWT → Supabase RLS, webhook sync, `clerk_user_id` as primary identifier throughout.

---

## Subscription & Pricing

| Tier | Price | Access |
|------|-------|--------|
| Free | $0 | 3 tools (Cascade, Vessel, Impulse) |
| Pro | $4.99/mo or $49/yr | All 25+ tools, simulators, workshop, cartographer |
| Vanguard | $7.99/mo or $79.99/yr | Pro + early access + course discounts |

Stripe handles payments. Subscription state stored in Supabase `subscriptions` table. `ProToolGuard` component wraps Pro tool routes — shows upgrade prompt if user lacks an active subscription.

---

## Export System

All worksheet tools support multiple export formats:

| Format | Library | Notes |
|--------|---------|-------|
| PDF | @react-pdf/renderer | Custom "World Bible" template with StellarForge branding. Per-tool generators in `src/lib/pdf/generators/`. |
| DOCX | docx | Word document export via `src/lib/docx/generator.ts`. |
| Markdown | — | Copy to clipboard. Templates in `src/lib/text/templates/`. |
| PNG | html2canvas | Cover image / screenshot export. |

The `ExportDialog` component provides format selection. `QuickExportButton` offers one-click PDF.

---

## Key Custom Hooks (50+)

**Data fetching:** `use-worlds`, `use-world`, `use-world-entities`, `use-world-entries`, `use-worksheets`, `use-all-worksheets`, `use-category-worksheets`, `use-wiki-page`, `use-chronicle`, `use-sanity-articles`, `use-roadmap`, `use-courses`

**Auth & subscription:** `use-auth`, `use-subscription`, `use-admin`

**World features:** `use-world-notes`, `use-world-outline`, `use-world-graph`, `use-world-connections`, `use-connection-suggestions`, `use-sharing`, `use-shared-worlds`, `use-collaborators`, `use-tags`, `use-moodboard`, `use-linked-entry`

**Writing:** `use-writing-entries`, `use-writing-prompts`, `use-writing-preferences`, `use-writing-stats`

**UI/UX:** `use-background`, `use-audio-player`, `use-audio-playlists`, `use-audio-uploads`, `use-entity-audio`, `use-mobile`, `use-toast`, `use-pwa-install`, `use-typewriter-burst`, `use-hint-dismissed`, `use-export-preferences`, `use-auto-draft-page`, `use-tool-order`

**Gamification:** `use-badge-evaluator`, `use-badges`

**Integration:** `use-notion`, `use-timeline-presence`, `use-backup-stats`, `use-contact`

---

## Key UI Components

### Design Language
Deep space-navy backgrounds, zero border-radius on primary containers, teal-green accents that glow like indicator lights. The interface is a ship's instrument panel. See `CLAUDE.md` for the complete design system spec.

### Custom Components
- **GlassPanel** — Glassmorphism card (`backdrop-filter: blur(16px)`, zero radius, optional bottom-edge light arc glow)
- **BracketPanel** — Sci-fi bracket-corner decoration
- **DataBurst** — Floating animated data elements (page-specific sets configured in `src/lib/data-bursts/`)
- **CollapsibleSection** — Numbered, expandable form sections with Jura heading + teal numbered badge
- **SectionNavigation** — Instrument-panel style nav with amber numbered indicators
- **Loader** — Custom bracket-aesthetic spinner
- **SFDivider** — Styled divider with optional amber label

### Fonts (Strict Rules)
| Font | Use | Never |
|------|-----|-------|
| MD Nichrome | H1 tool page titles ONLY | Buttons, body text |
| Jura | Section headers, nav | — |
| DM Sans | Body text, ALL buttons | — |
| JetBrains Mono | Data readouts, badges | — |

### Color Accents Per Category
Stars & Systems = Amber, Worlds = Azure, Life = Emerald, Civilizations = Violet, Mythology = Stellar blue, Integration = Teal.

### Simulator Aesthetic
Simulators use a **legacy cyan accent** (`#00D4FF`) instead of site-wide teal, with deeper black backgrounds (`#09090B`) and slight border-radius on panels. This is intentional.

---

## Notable Features & Systems

### Badge/Achievement System
- Tier progression: Novice → Adept → Expert → Master → Vanguard
- Auto-evaluation via `use-badge-evaluator.ts` — continuously checks eligibility
- `BadgeEarnedDialog` shows on achievement unlock
- Definitions in `src/lib/badges/definitions.ts`

### Audio System
- Background ambient music player with curated playlists
- User-uploadable audio per entity
- Playlist data in `src/lib/audio/curated-playlists.ts`
- Files served from `/public/music/` and `/public/audio/`

### Tool Intros
Each tool has a narrative introduction with 2-3 relevant SF book examples (e.g., *Foundation*, *Dune*, *Blindsight*). This contextualizes the tool within literary tradition. Data in `src/lib/tool-intros.ts`.

### Loading Messages ("Ship's Voice")
Thematic loading messages styled as ship computer readouts. Data in `src/lib/loading-messages.ts`.

### Data Bursts
Floating animated data elements that appear on specific pages — different sets for the dashboard, tool pages, contact form, etc. Configured per-route in `src/lib/data-bursts/`.

### Cosmic Telemetry
A velocity ticker / telemetry data overlay. Data in `src/lib/cosmic-telemetry.ts`.

### Sharing & Collaboration
- Public share links for worlds and worksheets (token-based, no auth required)
- Invitation system with codes
- Collaborator roles (view, edit, admin)
- Timeline presence (see who's editing)

### Notion Integration
OAuth-based Notion export — push world data to Notion pages. Callback at `/api/notion/callback`.

---

## Database Schema (Key Tables)

**Users & Auth:** `profiles` (display_name, avatar, bio, is_admin)

**Worlds:** `worlds`, `world_entities`, `world_entries`, `world_notes`, `world_tags`, `world_connections`, `world_outline`, `moodboard_images`

**Tools:** `worksheets`, `worksheet_elements`

**Timeline:** `chronicle_events`

**Writing:** `writing_entries`, `writing_prompts`

**Sharing:** `shared_worksheet_tokens`, `shared_world_tokens`, `collaboration_invites`, `workspace_invites`

**Integrations:** `notion_connections`

**System:** `contact_submissions`, `support_tickets`, `admin_todos`, `badges`

**Subscriptions:** `subscriptions` (stripe_customer_id, plan, status, current_period_end)

Full auto-generated types in `src/integrations/supabase/types.ts` (~37K lines).

---

## Development Commands

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Local preview of build
npm run lint       # ESLint
npm run test       # Vitest
npm test:watch     # Watch mode
```

Deploy: `npx vercel --prod` (manual; CI/CD pipeline is on the backlog).

---

## Codebase Stats

- ~563 TypeScript/TSX files in `src/`
- ~32,000+ lines in tool pages alone
- 104 utility/data files in `lib/`
- 50+ custom hooks
- 400+ components across 30+ directories
- ~50 routes
- 5 standalone HTML/JS simulators
- 1 separate cartographer subproject

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | **Design system + code conventions** — fonts, colors, spacing, component patterns, do's/don'ts. The canonical style reference. |
| `docs/STACK-ARCHITECTURE.md` | Planned Clerk + Stripe + Supabase architecture. Read before writing auth/billing code. |
| `docs/ROADMAP.md` | Active task list and development priorities. |
| `docs/BACKLOG.md` | Detailed feature backlog (i18n, SENSORIUM phases, tool enhancements, etc.). |
| `docs/STELLARFORGE-IMPLEMENTATION-GUIDE.md` | Implementation patterns and conventions. |
| `docs/stellarforge-tool-inventory-mapping.md` | Tool inventory and cascade mapping. |
| `docs/stellarforge-wiki-system-architecture.md` | Wiki/knowledge base system design. |

---

## Current State & Active Work

### Recently Deployed (April 2-4, 2026)
- **Remediation Phases 1-12:** Layout normalization, entity recognition, simulator save/replay, narrative bridge, publish-to-world, cascade guidance, writing-entity linking, world bible dual export, guided first-world experience
- **World Graph & Entity Layer (v0.6100):** `entities` and `entity_connections` Supabase tables with full CRUD. React Flow graph with cascade filter bar, cascade flow layout, list view, tree view. Analytical tools (gravity, narrative distance, tension detection, clusters, what-if). Cascade audit mode. Timeline scrubber. Export (PNG/JSON/MD).
- **StellarForgeEditor:** Tiptap-based unified editor with 3 presets (compact/rich/full), @entity mentions, wiki links, word count, focus mode
- **Entity-Powered Sidebar:** Tool/Wiki views, drag-and-drop reorder, color picker, Registry/Entities tabs in WorldLayout
- **Dedicated Writing Space:** `/worlds/:id/write` route with document CRUD, entity sidebar, auto-save
- **UI Consistency Fixes:** 10 issues resolved (worksheet overlap, nav fonts, simulator unboxed titles, tools mega menu, Narrative Bridge notes, video fallbacks, Mythos CTA)
- **Version numbering:** v0.6100 displayed in header, CHANGELOG.md established

### Planned / In Progress
- **Textarea migration:** Replace remaining plain `<textarea>` elements with StellarForgeEditor across all surfaces
- **Auth migration:** Supabase Auth → Clerk (spec complete in STACK-ARCHITECTURE.md, implementation pending)
- **Stripe billing:** Org-tier pricing, checkout/portal endpoints
- **SENSORIUM:** ~70% complete (Phase 1 done, Phases 2-5 partial)
- **i18n:** Infrastructure ready, ~2,000-4,000 strings need extraction
- **Testing:** Minimal coverage — Vitest + Playwright configured but few tests written
- **CI/CD:** Manual deploys via Vercel git integration; GitHub Actions pipeline on backlog

---

*These worlds exist in you. Waiting to be found.*

(c) 2025-2026 Jason D. Batt, Ph.D. — StellarForge.tools
