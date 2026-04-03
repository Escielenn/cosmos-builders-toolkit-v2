# SOLARIS — StellarForge Integration Brief
**For Claude Code · StellarForge.tools repo**
*Read this entire document before touching any files.*

---

## Pre-Flight Protocol (Mandatory)

Before writing a single line of code:

1. Read `SIMULATOR_AESTHETIC.md` in the repo root
2. Read `CLAUDE.md` in the repo root
3. Read `StellarForge_Integration_Spec.md` if it exists
4. Run `grep -r "solaris\|SOLARIS" src/ --include="*.tsx" --include="*.ts" -l` to check for any existing SOLARIS references
5. Identify the route pattern used by existing simulators (e.g., ROGUE, TIDELOCK) — match it exactly
6. Run a clean build (`npm run build`) and confirm zero errors before making any changes
7. Check Supabase schema for a `tools` or `simulators` table — do not add columns without confirming the existing pattern

Do not proceed if the build is broken. Fix it first.

---

## What This Is

**SOLARIS** is a procedural star system simulator — a new entry in the Simulators category of StellarForge tools. It lives as a self-contained HTML file served via an iframe or a dedicated route. The simulator itself is complete and does not need to be rewritten. Your job is to wire it into the platform cleanly.

The simulator file: `solaris-v5.html` (provided alongside this brief — place it in `public/simulators/` or wherever ROGUE and TIDELOCK live; match the existing convention exactly).

---

## Integration Tasks

### 1. Place the simulator file

Find where existing simulator HTML files live (likely `public/simulators/` or `public/tools/`). Place `solaris-v5.html` there. Do not rename it unless the existing convention requires a different naming pattern — in that case, use `solaris.html`.

### 2. Create the route

Find the existing route for ROGUE or TIDELOCK. Duplicate that route structure for SOLARIS. The URL path should be `/simulators/solaris` (or match the existing pattern if it differs).

If simulators use a wrapper component (e.g., `SimulatorPage.tsx` or `ToolFrame.tsx`), use that wrapper — do not create a new one.

### 3. Add SOLARIS to the tools registry / metadata

Wherever tool metadata lives (could be a TypeScript constant, a Supabase `tools` table, a JSON file, or a CMS entry), add SOLARIS with the following data:

```typescript
{
  id: 'solaris',
  name: 'SOLARIS',
  category: 'Simulators',
  tagline: 'Procedural star system simulator',
  description: 'Build single and multi-star systems with real orbital mechanics. Kepler\'s third law, N-body physics, Holman-Wiegert stability limits, and combined habitable zone calculations. Supports single, binary, trinary, and quaternary stellar configurations.',
  path: '/simulators/solaris',
  cascade_layer: 'A', // Physics layer
  status: 'beta',     // adjust to match platform convention — 'beta' | 'active' | 'new'
  tier: 'free',       // adjust if platform uses freemium gating — confirm existing pattern
  icon: null,         // assign icon per platform convention; do not create a new icon system
}
```

Adjust field names to exactly match the existing schema. Do not add new fields.

### 4. Add to the Simulators listing page

Find where ROGUE and TIDELOCK are listed (tools index, dashboard, or simulators page). Add SOLARIS to the same list in the same format. Do not create a new card component — use the existing one.

SOLARIS belongs with the other Simulators. Its Cascade layer is **A (Physics/Environment)** — it belongs near ROGUE (gravitational), TIDELOCK (tidally locked worlds), and GRAVITAS (gravity).

### 5. Nav / sidebar

If Simulators appear in a sidebar or nav dropdown, no change should be needed — SOLARIS will appear automatically if the listing page pulls from the tools registry. Confirm this is the case. If it requires a manual nav entry, add it following the exact existing pattern.

### 6. Verify the iframe integration

SOLARIS uses `localStorage` internally for save/load. Confirm the platform's iframe `sandbox` attribute (if any) permits `allow-same-origin` and `allow-scripts`. If the simulator is served from the same origin as the platform, this is not an issue. If it is cross-origin (e.g., served from a CDN), `localStorage` will be blocked — flag this for Jason before deploying.

---

## What NOT to Do

- Do not rewrite or modify `solaris-v5.html` — the simulator is complete and tested
- Do not create new shared components for this integration — use what already exists
- Do not change the aesthetic of existing tool cards to match SOLARIS or vice versa
- Do not add new Supabase tables or columns without confirming the existing data model
- Do not change routing patterns — match what ROGUE/TIDELOCK use exactly
- Do not add SOLARIS to any auth-gating unless other free-tier simulators are also gated

---

## Tool Metadata Reference (for descriptions / copy)

Use this if the platform displays tool descriptions on cards, tooltips, or detail pages.

**Short tagline (≤ 60 chars):**
> Procedural star system simulator

**One-line description:**
> Design single and multi-star systems with real orbital mechanics and habitable zone science.

**Full description (for tool detail pages):**
> SOLARIS generates procedural star systems grounded in real astrophysics. Configure single, binary, trinary, or quaternary stellar architectures and watch Keplerian orbits evolve in real time. Habitable zone calculation follows Kopparapu et al. (2013), orbital stability uses Holman-Wiegert (1999) limits, and multi-star N-body dynamics use a Velocity Verlet integrator with adaptive substeps. The "Show Your Work" overlay explains every calculation — both as general physics education and as a per-system breakdown. Export your system as JSON or a plain-text World Notes file. Part of the Cascade framework: stellar physics drives planetary environment, which drives everything else.

**Cascade layer:** Physics → Environment (Layer A)

**Related tools:** ROGUE (N-body gravitational), TIDELOCK (tidally locked exoplanets), GRAVITAS (gravity calculator), Habitable Zone Calculator

---

## Checklist Before Deploying

- [ ] `solaris-v5.html` is in the correct public directory
- [ ] Route `/simulators/solaris` (or equivalent) resolves and loads the simulator
- [ ] SOLARIS appears on the Simulators listing page with correct card
- [ ] Tool metadata matches existing schema exactly — no new fields
- [ ] Clean build with zero TypeScript errors (`npm run build`)
- [ ] Simulator loads correctly in production iframe (test on Vercel preview URL)
- [ ] `localStorage` is accessible (save/load works inside the deployed iframe)
- [ ] No console errors on load
- [ ] Verified on mobile viewport (simulator is functional, panels accessible)

---

## Notes for Jason (Post-Integration)

Once Claude Code confirms the Vercel preview URL is live, test these specifically:

1. Generate a Quaternary system → verify "Show Your Work" → "This System" tab populates fully
2. Save a system → reload page → load saved system (confirms localStorage in iframe context)
3. Export JSON → confirm the file downloads
4. Open on mobile → confirm panels are accessible (known limitation: no mobile collapse yet)
5. Click "Show Your Work" before generating a system → should open to "How It Works" tab without error

---

*© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools*
*These worlds exist in you. Waiting to be found.*
