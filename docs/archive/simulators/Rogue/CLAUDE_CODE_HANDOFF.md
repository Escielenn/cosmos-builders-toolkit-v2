# ROGUE — Claude Code Handoff

## What This Is

**ROGUE** is a full N-body gravitational encounter simulator for [stellarforge.tools/rogue](https://stellarforge.tools/rogue). Users launch black holes, brown dwarfs, and rogue planets at real star systems and watch gravitational chaos unfold with real physics. Vanilla JS + Canvas API, zero dependencies.

## Files

- `index.html` — Complete simulator application (~900 lines)
- `science.html` — Standalone "Showing Our Work" science page (~375 lines) with full physics documentation, data tables, equations, and 15+ academic citations with DOI/ADS links
- `CLAUDE_CODE_HANDOFF.md` — This file
- `SIMULATOR_AESTHETIC.md` — **READ THIS FIRST** — Full design system spec for all StellarForge simulator tools (fonts, colors, component patterns, CSS values, rendering rules)

## File Relationships

- `index.html` links to `science.html` via "The Science" in the credit line (`target="_blank"`, opens new tab)
- `science.html` links back to `index.html` via "Back to ROGUE" in the sticky header
- Both files must be deployed to the same `/rogue/` directory
- Both are fully self-contained with no shared CSS/JS files (styles are inline)

## Aesthetic Rules (Critical)

This tool follows the StellarForge Simulator Aesthetic. Before making ANY visual changes, read `SIMULATOR_AESTHETIC.md`. Key constraints:

- **Fonts**: Space Grotesk (titles, headers, buttons), DM Sans (labels, body, inputs), JetBrains Mono (numerical data only)
- **Background**: `#09090B` everywhere (canvas + body)
- **Panels**: `rgba(15,15,16, 0.92)` with `backdrop-filter: blur(16px)`, border `rgba(255,255,255, 0.08)`, radius `8px`
- **Accent**: `#00D4FF` cyan for ALL interactive states (sliders, focus, active buttons, scrollbars)
- **Status opacity triad**: Every colored element follows `background: rgba(COLOR, 0.08)` / `border: rgba(COLOR, 0.2)` / `color: COLOR` — this is the visual signature
- **Section headers**: Space Grotesk 600, 7.5px, 2.5px spacing, `rgba(0,212,255, 0.35)`
- **Buttons**: Space Grotesk 500, 8px, 1.5px spacing, uppercase
- **Data values**: JetBrains Mono 300-500, 9px
- **Scrollbars**: 3px wide, `rgba(0,212,255, 0.12)` thumb, transparent track
- **No border-radius above 12px.** Panels 8px, modals 12px, buttons 6px.

## Science Page Design

`science.html` is a standalone dark page matching the simulator aesthetic:

- **Sticky header**: Frosted glass bar with "Back to ROGUE" link and "STELLARFORGE.TOOLS" right-aligned
- **Body text**: DM Sans 13.5px, `rgba(255,255,255, 0.6)`, line-height 1.8
- **Section headers**: Space Grotesk 600, 9px, uppercase, `rgba(0,212,255, 0.35)`, with 1px cyan border-bottom
- **Equations**: JetBrains Mono 12.5px in cyan on dark card backgrounds
- **Citations**: 11px with left cyan border, links at 0.4 opacity cyan
- **Notes**: Italic, left-bordered callout boxes
- **Data tables**: Alternating opacity rows, Space Grotesk headers, JetBrains Mono for values
- **Footer**: Gradient divider, copyright in ghost text
- **Mobile responsive** at 600px breakpoint

### Science Sections (11 total)
1. Gravitational Physics (Newton's law, solar-normalized units)
2. Numerical Integrator (kick-drift-kick leapfrog, softening)
3. Conditional N-Body Forces (resonance chain explanation)
4. Adaptive Timestep (scaling equations)
5. Stellar & Planetary Data (5-system table with sources)
6. Habitable Zones (Kopparapu et al. 2013 model)
7. Intruder Objects (mass ranges and physical basis)
8. Velocity & Unit Conversions (AU/yr to km/s)
9. Visual Sizing (proportional rendering formulas)
10. What This Tool Cannot Do (5 explicit limitations)
11. For Writers (connection to StellarForge cascading framework)

## Architecture

### Physics Engine
- **Kick-drift-kick leapfrog integrator** (better energy conservation than Euler)
- **Conditional N-body**: Before intruder launch, only star-planet forces (preserves Keplerian orbits). After launch, full N-body with planet-planet interactions
- **Adaptive timestep**: `dt` scales with system compactness (`minOrbit / 0.5`), step count compensates to maintain wall-clock speed
- **Softening**: epsilon-squared = 0.00005 AU-squared to prevent singularities at close approach
- **dt_base**: 0.00008 years per step, 60 base steps/frame, max 8000

### System Scale Adaptation
`getSystemScale()` computes per-system parameters:
- Slider ranges (distance, speed, mass) adapt to system extent
- TRAPPIST-1 sliders: 0.005-0.185 AU. Solar System: 0.1-15 AU
- Called on every system switch via `updateSliderRanges()`

### Proportional Sizing
- Star pixel size: `max(6, min(28, zoom * 0.04 * starR + 4))` where `starR = mass^0.8`
- Planet pixels capped at 45% of star pixel radius
- Intruder sizes proportional: black hole 70%, brown dwarf 60%, rogue planet 50% of star

### Camera System
- **Delta-time exponential smoothing**: `smoothing = 1 - pow(0.0001, frameDt/1000)` — framerate independent
- Camera modes: Free (drag), Star tracking, Intruder tracking, per-planet tracking
- Zoom range: 0.5x - 5000x

### Transport Controls
Post-launch transport bar: Rewind | Step Back | Pause/Play | Step Forward | Reset
- **State history**: Circular buffer of ~4000 snapshots (positions, velocities, trail lengths)
- **Rewind**: Hold-to-scrub, rate scales with time slider
- **Step**: Single-click advances/reverses fixed physics steps
- **Spacebar**: Play/pause toggle

### Preset Systems
1. **Solar System** — 8 planets, habitable zone, default zoom 55
2. **TRAPPIST-1** — 7 planets within 0.06 AU, zoom 2500, red dwarf
3. **Kepler-90** — 8 planets, zoom 30
4. **Proxima Centauri** — 3 planets, zoom 2500, red dwarf
5. **Alpha Centauri AB** — Binary star (23 AU separation), 2 hypothetical planets, zoom 10

### Custom System Builder
- Modal overlay with star config (mass, spectral type, optional binary)
- Up to 12 custom planets (name, type, mass, orbital distance)
- Encodes to URL hash for shareable links
- Parses on page load for link sharing

## Deploy

### Target
Both files serve from `stellarforge.tools/rogue/`:
- `stellarforge.tools/rogue/` -> `index.html` (simulator)
- `stellarforge.tools/rogue/science.html` (science documentation)

### Next.js / React (Vercel)
Place both in `public/rogue/`:
```
public/
  rogue/
    index.html
    science.html
```

### Static hosting
Place both files in a `/rogue` directory. Deploy normally.

## SEO (Pre-configured in index.html)
- Title: ROGUE — N-Body Gravitational Encounter Simulator | Stellar Forge Tools
- Canonical: https://stellarforge.tools/rogue
- OG + Twitter card tags present (add og:image screenshot at 1200x630)
- Author: Jason D. Batt, Ph.D. — Dreamside Studios

## Known Behaviors (Not Bugs)

- TRAPPIST-1 planets orbit in near-circular paths pre-launch because planet-planet forces are disabled until intruder activates. This is intentional — the real system's stability depends on resonances the integrator cannot maintain.
- At very high time scales (80-100x), compact systems may show slight energy drift. This is acceptable for visualization purposes.
- Trail memory caps at ~800 points per body. Old trail segments are dropped for performance.

## Future Considerations

- Collision detection / merger events
- Trojan asteroid fields
- Lagrange point visualization
- Tidal disruption visual effects
- Sound design (optional ambient + event-driven)
- Screenshot / recording export
- Integration with StellarForge Star System worksheet

---

Copyright 2025-2026 Jason D. Batt, Ph.D. - StellarForge.tools
