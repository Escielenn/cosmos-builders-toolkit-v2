# Solaris — Native React/R3F Rebuild (Track S flagship)

**Status:** In progress · Branch `feat/solaris-native-rebuild` · Started 2026-07-12
**Decision (Jason, 2026-07-12):** Rebuild Solaris natively on the existing R3F component tree (`src/components/solaris/*`) rather than re-skin the live static-HTML iframe. Port A's hard-won physics; do not rewrite them.

## Why
Two Solaris implementations exist today:
- **A — live:** `public/tools/solaris/sim.html` (2,401 lines, 2D canvas). Feature-complete: procedural generation, multi-star N-body (Velocity Verlet), Kopparapu (2013) habitable zones, full editing, save/load/publish. Worst design-drift in the toolkit (cyan #00D4FF ×19, Space Grotesk ×8). Iframe seam.
- **B — unwired:** `src/components/solaris/*` R3F. Beautiful true-3D renderer (atmospheres, rings, coronas, moons, tilt) already on design tokens — but a hollow **viewer**: no generator, no editing, no persistence, single-star only, and its speed/camera controls are stubs that do nothing.

Rebuild = keep B's superior 3D rendering + token cleanliness, and port A's simulator half into it.

## Hard constraints
- **Live product.** The live Solaris (`/tools/solaris` → static HTML) stays in place and untouched until parity + Jason sign-off. B is built behind a **hidden dev route** (`/dev/solaris`), not in prod nav.
- **No prod cutover without Jason's OK.** No database changes. No Supabase migrations.
- Keep B on the design tokens (no cyan, no Space Grotesk).
- Work in reviewable chunks; commit + push incrementally on the branch.

## Source-of-truth for the port
`public/tools/solaris/sim.html` ("SOLARIS v4"), physics verified 2026-04-25:
- Single-star: analytic Keplerian (Newton–Raphson on M = E − e·sinE, 5 iters).
- Multi-star: Velocity Verlet N-body, adaptive substeps capping planet displacement ~2%/step; shell-theorem interior mass for orbital velocity.
- Habitable zone: Kopparapu et al. (2013) effective-flux boundaries (Recent Venus / Runaway Greenhouse / Max Greenhouse / Early Mars); multi-star combined luminosity L = √(Σ Lᵢ²).
- Star class O/B/A/F/G/K/M → mass/luminosity/radius.
- StellarForge postMessage protocol: LOAD / REQUEST_STATE / SAVE / PUBLISH.

## Milestones

| # | Milestone | Deliverable | Depends on |
|---|---|---|---|
| **M0** | Branch + plan | this doc; `feat/solaris-native-rebuild` | — |
| **M1** | Wire stubs + real system on dev route | `/dev/solaris` renders a real sample `StarSystem` in B; speed multiplier wired (no more hardcoded `useSimulationTime(10)`); camera modes wired (free / star / planet-follow) | M0 |
| **M2** | Port generator | seed-based procedural `StarSystem` generator (native TS module); dev route can generate from a seed | M1 |
| **M3** | Port physics | multi-star Velocity Verlet N-body + Kopparapu (2013) four-boundary HZ w/ combined luminosity | M2 |
| **M4** | Editing UI | seed/generate, drag-drop planet palette, mass/radius/eccentricity sliders, moon panel, rings/belts/HZ/label toggles — on tokens | M3 |
| **M5** | Persistence | save / load / publish-to-world via existing StellarForge integration (`useSimulationSave`), adapted to native (no iframe postMessage seam) | M4 |
| **M6** | Parity + cutover | parity checklist vs A, perf + mobile pass, cutover proposal for sign-off | M5 |

**Gate:** M6 parity sign-off → swap `/tools/solaris` from the static-HTML iframe to the native page (Jason approves; separate commit).

## Open decision points (flag as they arise)
- Camera "planet-follow" UX: orbit-around-followed-body vs locked chase cam. (M1 default: orbit-around, target lerps to the body.)
- Whether the native persistence keeps A's exact save payload shape (for cross-compatibility with existing `simulation_saves` rows) or a new native shape with a migration adapter. (Resolve at M5; default: preserve A's payload schema for continuity.)
- Multi-star editing UX (A supports up to quaternary) — how the palette/controls express adding stars. (Resolve at M4.)
