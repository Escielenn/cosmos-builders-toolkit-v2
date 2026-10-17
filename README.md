# StellarForge

*These worlds exist in you. Waiting to be found.*

StellarForge is a science fiction worldbuilding platform for writers. Its tools follow the **Environmental Cascade** — Physics → Environment → Biology → Psychology → Mythology → Culture — so a decision made upstream (a star's class, a planet's gravity) carries into everything downstream. Worksheets, calculators and real-time simulators write into a world's Codex (one page per entity), and the Studio and Manuscript are where the writing happens against that canon.

**Live site:** [stellarforge.tools](https://stellarforge.tools)

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5, React Router |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix), generated design tokens |
| Data + auth | Supabase (Postgres with RLS, Supabase Auth, Edge Functions) |
| Payments | Stripe (Pro tier, checkout and portal via Edge Functions) |
| Email | Resend (transactional, from Edge Functions) |
| CMS | Sanity (Learn articles; studio config in `studio/`) |
| Error monitoring | Sentry (DSN-gated; source maps uploaded when `SENTRY_AUTH_TOKEN` is set at build) |
| 3D | three.js via React Three Fiber (Atlas, system and sky scenes) |
| Editor | Tiptap |
| Hosting | Vercel |

## Running locally

Requires Node.js 20 (what CI uses) and npm.

```sh
git clone https://github.com/Escielenn/cosmos-builders-toolkit-v2.git
cd cosmos-builders-toolkit-v2
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev
```

Environment variables (see `.env.example`; never commit values):

- `VITE_SUPABASE_URL` — required
- `VITE_SUPABASE_PUBLISHABLE_KEY` — required
- `VITE_SUPABASE_PROJECT_ID` — optional, reference only
- `VITE_STRIPE_PUBLISHABLE_KEY` — optional, for subscriptions
- `VITE_SENTRY_DSN` — optional; when unset, Sentry is a no-op
- `SENTRY_AUTH_TOKEN` — build environment only, enables source-map upload

Stripe secret keys, webhook secrets and the Resend key are Supabase Edge Function secrets, not front-end variables.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Strict typecheck gate, then production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Full `tsc` check (not yet clean) |
| `npm run typecheck:strict` | The blocking gate CI runs (undefined identifiers) |
| `npm run lint` | ESLint (blocking in CI) |
| `npm run test` / `test:watch` | Vitest |

CI (`.github/workflows/sf2-guardrails.yml`) runs the strict typecheck, lint, tests and build, plus a raw-hex ratchet against `.github/sf2-hex-baseline.txt` and hard bans on legacy cyan and Space Grotesk.

## Project layout

```
src/
  components/    UI primitives (ui/), tool, simulator, world, writing, layout components
  pages/         Routes: tools/, simulators/, learn/, legal/, Studio, Write, world pages
  layouts/       World layout (Bridge · Codex · Instruments · Manuscript nav)
  gl/            three.js engine, materials, canon binding, scenes
  sims/          Simulator consequence flags
  services/      World data, entity graph, Chronicle
  hooks/         React hooks
  contexts/      AuthContext (Supabase Auth)
  lib/           Calculations, tool config, PDF templates, Sanity client, Sentry
  integrations/  Supabase client and generated types
  styles/        Generated tokens.css, themes.css (do not hand-edit)
  config/        Version and launch config
  content/       Learn content
supabase/        Migrations and Edge Functions
design/          Palette generators (derive.py, emit.py, themes.py) and design references
docs/            Project docs; docs/stellarforge/ is the governing set
```

## Governing docs

- `CLAUDE.md` — development rules, design system, Ship's Voice. Read first.
- `docs/stellarforge/` — the Constitution (`00`), architecture, tool and Studio charters, legibility (`10`), session sequence (`12`), render engine (`14`). `START-HERE.md` is the entry point.

## Tool catalog

Grouped as the site header groups them. Three tools are free; the rest are Pro.

**Stars & Systems** — Orrery (Star System Builder) · Goldilocks (Habitable Zone Calculator) · Exosky (Alien Night Sky, simulator) · Solaris (Procedural Star System, simulator) · Stellar Cartographer (Galaxy Mapper)

**Worlds** — Genesis (Planetary Profile) · Atlas (Surface Gravity Calculator) · Rogue (Wandering Object Encounters, simulator) · Tidelock (Locked World, simulator) · ExoForge (Procedural Exoplanet Forge, simulator)

**Life** — Phylo (Evolutionary Biology) · Symbiosis (Species Interaction Matrix) · Sensorium (Alien Sensory Systems)

**Travel & Spacecraft** — Vessel (Lived-In Spacecraft Designer, free) · Impulse (Propulsion Consequences, free) · Exodus (Space Expansion Modeler) · Paradox (Time Dilation Calculator) · Gravitas (Spacecraft & Habitat Gravity)

**Civilizations** — Axiom (The One Big Lie) · Dominion (Empire Designer) · Paradigm (Technology Consequences) · Signal (Drake Equation Calculator) · Lexdrift (Language Evolution) · K-Scale (Kardashev Scale Calculator)

**Mythology** — Mythos (Xenomythology Framework)

**Integration** — Cascade (Environmental Chain Reaction, free) · Epoch (Timeline)

**Writing** — Writing Prompts (`/workshop`), the Studio (`/studio`) and the Manuscript editor (`/write`).

Each simulator has a companion Science page. Catalog membership, display names and routes live in `src/lib/tools-config.ts`; categories in `src/lib/tool-wiki-data.ts`.

## Your data

A signed-in user can export all of their account data or delete the account from the Profile page (`/profile`, `AccountDataSettings.tsx`: the `export_account_data` RPC, and the `delete-account` Edge Function, which stops Stripe billing before erasing anything).

---

(c) 2025-2026 Jason D. Batt, Ph.D. - StellarForge.tools
