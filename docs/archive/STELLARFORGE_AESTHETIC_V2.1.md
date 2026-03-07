# STELLARFORGE DESIGN SYSTEM v2.1
## "You Are Always On A Ship"

**The definitive aesthetic reference for stellarforge.tools**
*Updated: February 2026 — Final typography, color, and texture specifications*

**This document is the source of truth.** When implementing any UI changes, consult this file first. It supersedes the original SIMULATOR_AESTHETIC.md for all non-simulator contexts and supersedes the previous stellarforge-css-reference.css for site-wide styling decisions.

---

## PHILOSOPHY

The original StellarForge aesthetic was technically correct but recognizably AI-generated. Bright cyan on dark backgrounds, Space Grotesk + DM Sans pairing, perfect 0.08/0.2/1.0 opacity ratios everywhere, rigid 12px border radius — these are the visual equivalent of "As an AI language model..."

Version 2.1 keeps what works (dark-first, information-dense, simulation-as-hero) and replaces the generic with the specific:

1. **1970s–80s sci-fi paperback typography** — MD Nichrome for display, Michroma for rare accents
2. **Analog mission control interfaces** — film grain, scanlines, coordinate readouts that feel *used*
3. **The philosophical anchor** — you are hurtling through space at 1.3 million mph relative to the cosmic microwave background. The UI should occasionally remind you.

**"You are always on a ship."**

---

## TYPOGRAPHY

### The Final Stack

| Role | Font | Source | Weight | CSS Variable | Notes |
|---|---|---|---|---|---|
| **Display / Hero** | MD Nichrome | Self-hosted (licensed from Mass-Driver) | 300, 400 | `--sf-font-display` | Hero titles, tool page names, marketing headlines. |
| **UI Structure** | Jura | Google Fonts (free) | 300–700 | `--sf-font-heading` | Buttons, nav, section headers, badges, modal titles. |
| **Body / Readable** | DM Sans | Google Fonts (free) | 300–500 | `--sf-font-body` | Labels, descriptions, forms, tooltips, prose. |
| **Data / Telemetry** | JetBrains Mono | Google Fonts (free) | 300–500 | `--sf-font-mono` | Coordinates, values, readouts, velocity ticker. |
| **Accent / Rare** | Michroma | Google Fonts (free) | 400 only | `--sf-font-accent` | SF book epigraphs, pull quotes. ≤1 per page. |

### Font File Location

MD Nichrome .woff2 files are located at:
```
public/fonts/md-nichrome/
```

Claude Code must create `public/fonts/md-nichrome/md-nichrome.css` by scanning that directory for the actual .woff2 filenames and generating the appropriate @font-face declarations. The pattern:

```css
@font-face {
  font-family: 'MD Nichrome';
  src: url('/fonts/md-nichrome/[LIGHT-FILENAME].woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'MD Nichrome';
  src: url('/fonts/md-nichrome/[REGULAR-FILENAME].woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

If a variable font file is present instead, use:
```css
@font-face {
  font-family: 'MD Nichrome';
  src: url('/fonts/md-nichrome/[VARIABLE-FILENAME].woff2') format('woff2-variations');
  font-weight: 300 400;
  font-style: normal;
  font-display: swap;
}
```

### Google Fonts Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&family=Jura:wght@300;400;500;600;700&family=Michroma&display=swap" rel="stylesheet">
```

### CSS Custom Properties (Replace existing font variables)

```css
:root {
  --sf-font-display: 'MD Nichrome', 'Jura', system-ui, sans-serif;
  --sf-font-heading: 'Jura', system-ui, sans-serif;
  --sf-font-body: 'DM Sans', system-ui, sans-serif;
  --sf-font-mono: 'JetBrains Mono', monospace;
  --sf-font-accent: 'Michroma', 'Jura', system-ui, sans-serif;

  /* Legacy — simulator panels only (ROGUE, ExoSky, TIDELOCK) */
  --sf-font-sim-heading: 'Space Grotesk', system-ui, sans-serif;
}
```

### Three-Layer Typography System

The site has three distinct UI contexts. Each uses different font sizes. Applying the wrong layer's sizes is a common mistake.

**LAYER 1 — Site Shell** (landing page, marketing, navigation, account UI)

| Role | Font Variable | Weight | Size | Spacing | Transform |
|---|---|---|---|---|---|
| Page hero / landing | `--sf-font-display` | 300 | 48–72px | 2–4px | uppercase |
| Page H1 | `--sf-font-display` | 300 | 32px | 3px | uppercase |
| Section H2 | `--sf-font-heading` | 600 | 20–24px | 1px | none |
| Card H3 | `--sf-font-heading` | 500 | 16–18px | 0.5px | none |
| Buttons | `--sf-font-heading` | 500 | 12–14px | 1.5px | uppercase |
| Nav items | `--sf-font-heading` | 400 | 12–13px | 1px | uppercase |
| Body text | `--sf-font-body` | 400 | 15–16px | normal | none |
| Labels | `--sf-font-body` | 400 | 12px | 0.1em | uppercase |
| Epigraph | `--sf-font-accent` | 400 | 10–11px | 3px | uppercase |

**LAYER 2 — Simulator Panels** (ROGUE, ExoSky, TIDELOCK — canvas + side panel)
*Unchanged. Space Grotesk + DM Sans + JetBrains Mono at simulator sizes per SIMULATOR_AESTHETIC.md*

| Role | Font | Weight | Size | Spacing | Transform |
|---|---|---|---|---|---|
| Tool title | Space Grotesk | 300 | 26px | 6px | uppercase |
| Section headers | Space Grotesk | 600 | 7.5px | 2.5px | uppercase |
| Labels | DM Sans | 400 | 8–8.5px | 1.2px | uppercase |
| Body / UI text | DM Sans | 400 | 9–10px | normal | none |
| Data values | JetBrains Mono | 300–500 | 9–10px | normal | none |
| Buttons | Space Grotesk | 500 | 8px | 1.5px | uppercase |

**LAYER 3 — Tool / Worksheet UI** (worksheets, calculators, designers, all non-simulator tools)

| Role | Font Variable | Weight | Size | Spacing | Transform |
|---|---|---|---|---|---|
| Tool page title | `--sf-font-display` | 300 | 22–26px | 4px | uppercase |
| Section headers | `--sf-font-heading` | 500 | 13px | 2px | uppercase |
| Field labels | `--sf-font-body` | 400 | 11px | 0.8px | uppercase |
| Helper text | `--sf-font-body` | 300 | 12px | normal | none |
| Data readouts | `--sf-font-mono` | 400 | 13px | normal | none |
| Buttons | `--sf-font-heading` | 500 | 11px | 1.2px | uppercase |
| Progress/status | `--sf-font-mono` | 300 | 10px | 0.5px | uppercase |
| Epigraph | `--sf-font-accent` | 400 | 10px | 3px | uppercase |

### Typography Rules

- **MD Nichrome** = display only. Never below 18px. Only weights 300 and 400.
- **Jura** = structural UI on website shell. Replaces Space Grotesk everywhere except simulator panels.
- **DM Sans** = readable prose. Unchanged role.
- **JetBrains Mono** = data and telemetry. Unchanged role.
- **Michroma** = rare accent. All-caps only. ≤1 element per page. Always muted opacity (0.20–0.30), wide spacing (2–4px). Never for UI elements or navigation.
- **Space Grotesk** = simulator panels ONLY (ROGUE, ExoSky, TIDELOCK). Do NOT use on the website shell.

### Michroma Epigraph Treatment

```css
.sf-tool-epigraph {
  font-family: var(--sf-font-accent);
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  line-height: 1.8;
  max-width: 600px;
  text-align: center;
  margin: 0 auto 32px;
}

.sf-tool-epigraph-attribution {
  font-family: var(--sf-font-body);
  font-style: italic;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.15);
  margin-top: 8px;
}
```

---

## COLOR SYSTEM

### Primary Accent: Teal-Green (replaces Cyan on website shell)

```
#3DFFCD                               Full — interactive states, focus, links
rgba(61, 255, 205, 0.6)              Dimmed — hover text, secondary highlights
rgba(61, 255, 205, 0.08)             Glow — background tints
rgba(61, 255, 205, 0.2)              Border — active borders
```

### Secondary Accent: Amber (10–15% frequency max)

Use for: Pro badges, cosmic velocity ticker, warnings, premium highlights, coordinate readout values.

```
#FFB347                               Full
rgba(255, 179, 71, 0.6)              Dimmed
rgba(255, 179, 71, 0.08)             Glow
rgba(255, 179, 71, 0.2)              Border
```

**The 85/15 rule:** ~85% teal-green, ~15% amber per screen. Amber on ≤2 elements per view.

### Core Palette (Retained)

```
#09090B                               Background (Deep Space)
#0F0F10                               Panel Surface
rgba(15, 15, 16, 0.92)               Panel Surface (alpha) — floating
rgba(15, 15, 16, 0.95)               Tool Panel Surface — Layer 3
#FAFAFA                               Text Primary
#C8C8C8                               Text Secondary
rgba(255, 255, 255, 0.35)            Text Muted
rgba(255, 255, 255, 0.18)            Text Ghost
```

### Status Colors

```
Teal-Green    #3DFFCD    Default/active/primary (replaces cyan on shell)
Amber         #FFB347    Warning/premium/velocity
Green         #2ECC71    Success/habitable/positive
Red           #E74C3C    Danger/critical/destructive
Gold          #FFD43B    Stellar data/measurements
```

### Opacity — Break the Machine Precision

Baseline 0.08/0.2/1.0 but vary by ±0.04. Acceptable: 0.04, 0.06, 0.12, 0.15. The eye senses a system without counting identical values.

### Where Cyan (#00D4FF) Survives

Simulator tools only (ROGUE, ExoSky, TIDELOCK). Everything else uses teal-green. Simulators migrate one by one over time.

---

## LAYER 3: TOOL / WORKSHEET CSS

New classes for worksheets, calculators, designers, and all future non-simulator tools.

```css
/* ==========================================================================
   LAYER 3: TOOL / WORKSHEET UI
   ========================================================================== */

.sf-tool-title {
  font-family: var(--sf-font-display);
  font-weight: 300;
  font-size: 22px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--sf-text-primary);
}

.sf-tool-section {
  font-family: var(--sf-font-heading);
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sf-tool-section::before {
  content: '// ';
  color: rgba(61, 255, 205, 0.25);
}

.sf-tool-label {
  font-family: var(--sf-font-body);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

.sf-tool-helper {
  font-family: var(--sf-font-body);
  font-size: 12px;
  font-weight: 300;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.28);
}

.sf-tool-value {
  font-family: var(--sf-font-mono);
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.65);
}

.sf-tool-status {
  font-family: var(--sf-font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
}

.sf-btn-worksheet {
  font-family: var(--sf-font-heading);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 9px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.55);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sf-btn-worksheet:hover {
  background: rgba(61, 255, 205, 0.08);
  border-color: rgba(61, 255, 205, 0.2);
  color: rgba(255, 255, 255, 0.85);
}

.sf-btn-worksheet.active {
  background: rgba(61, 255, 205, 0.1);
  border-color: rgba(61, 255, 205, 0.3);
  color: #3DFFCD;
}

.sf-tool-panel {
  background: rgba(15, 15, 16, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 20px 24px;
}

.sf-tool-section-gap { margin-bottom: 28px; }
.sf-tool-field-gap { margin-bottom: 16px; }
```

---

## TEXTURE: FILM GRAIN + SCANLINES

### Film Grain (global, always present)

```css
.film-grain::after {
  content: '';
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.03;
  background-image: url('/textures/grain-tile.png');
  background-size: 200px 200px;
  animation: grain-shift 0.5s steps(4) infinite;
}

@keyframes grain-shift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-2px, 1px); }
  50%  { transform: translate(1px, -1px); }
  75%  { transform: translate(-1px, 2px); }
  100% { transform: translate(0, 0); }
}
```

Opacity: 0.02–0.03 marketing, 0.04–0.05 tools. If no grain-tile.png exists, use the CSS SVG noise fallback:

```css
.noise::after {
  content: '';
  position: fixed;
  top: -50%; left: -50%; width: 200%; height: 200%;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}
```

### Scanlines (global, always present)

```css
.scanlines::before {
  content: '';
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9997;
  opacity: 0.015;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}
```

### Rules

- Combined ≤0.06 perceived opacity
- DISABLE inside `<canvas>` elements
- Grain uses `steps()` timing
- Reduce grain 50% on mobile
- Barely perceptible in screenshots

---

## SIGNATURE: COSMIC VELOCITY TICKER

Footer element. Philosophical anchor: "You are always on a ship."

### Data

```
SURFACE ROTATION       ~0.36 km/s
SOLAR ORBIT           29.78 km/s
GALACTIC TRANSIT     ~230 km/s
LOCAL GROUP DRIFT    ~300 km/s
CMB RELATIVE         ~627 km/s
```

### Styling

```css
.cosmic-ticker {
  font-family: var(--sf-font-mono);
  font-size: 7px;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.18);
}

.ticker-label {
  font-family: var(--sf-font-heading);
  font-size: 6.5px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.12);
}

.velocity-value {
  color: rgba(255, 179, 71, 0.35);
}
```

Bottom-left footer. Static version (no geolocation). Default: Thornton, CO.

---

## ICONS: PRESERVE AND PROTECT

Existing custom homepage tool icons are NOT to be replaced. No generic icon libraries for tool identification. New tools needing icons: ask Jason. Hover states use teal-green glow.

---

## LAYOUT: FEATURED CARD

One card may span two columns on the homepage tool grid — the most recently added tool or one deserving focus. All other grids remain symmetrical. All forms, navigation, simulator panels, and data tables remain precisely aligned.

---

## HOVER STATES (Varied)

```css
.tool-card:hover { transform: translateY(-2px); border-left-color: rgba(61,255,205,0.25); }
button:hover { background: rgba(61,255,205,0.08); border-color: rgba(61,255,205,0.2); }
.nav-link:hover { color: #3DFFCD; }
.tool-icon:hover { filter: brightness(1.15); }
.data-value:hover { color: rgba(255,179,71,0.8); }
```

---

## RETRO SCI-FI INTEGRATION

Not cosplay. The *feeling* of 1970s–80s science fiction design.

- Squared slider thumbs (`border-radius: 2px`)
- Stronger left panel borders
- `//` section prefixes, `[BRACKET]` status text
- System messages: `INITIALIZING SIMULATION...`
- Avoid: green-on-black, pixel fonts, glitch effects, VHS distortion

---

## BRANDING BLOCKS

### Landing Page

```
STELLARFORGE                    MD Nichrome 300, 48-72px, 3px spacing, uppercase, white
These worlds exist in you.      DM Sans 400 italic, 16px, rgba(255,255,255,0.4)
Waiting to be found.            DM Sans 400 italic, 16px, #3DFFCD at 0.5 opacity
```

### Tool Page

```
TOOL NAME                       MD Nichrome 300, 22-26px, 4px spacing, uppercase, white
// SECTOR: [CATEGORY]           Jura 400, 10px, 2px spacing, rgba(255,255,255,0.22)
```

---

## QUICK REFERENCE

```
Border radius:       6px buttons | 8px panels | 12px modals
Panel bg:            rgba(15,15,16, 0.92) shell | rgba(15,15,16, 0.95) tools
Backdrop blur:       16px panels | 20px modals
Transitions:         0.15s nav | 0.2s buttons | 0.25s cards | 0.3s fades
Label size:          11px tools | 12px site | 8.5px sims
Data size:           13px tools | 9-10px sims
Grain:               0.02-0.05
Scanlines:           0.015
```

---

## FONT LICENSING

| Font | Cost | Status |
|---|---|---|
| MD Nichrome Light + Regular | ~$75–150 | **PURCHASED** — in `public/fonts/md-nichrome/` |
| Jura, DM Sans, JetBrains Mono, Michroma | Free | Google Fonts |

---

*These worlds exist in you. Waiting to be found.*

© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools
