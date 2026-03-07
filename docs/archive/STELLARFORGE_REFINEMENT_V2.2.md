# STELLARFORGE DESIGN REFINEMENT v2.2
## From "Mission Control" to "Living Starship"

**This document refines v2.1, not replaces it.** The typography stack, font loading, Layer system, and icon preservation rules from v2.1 remain unchanged. This document adjusts color, texture, background, and introduces new structural elements based on live site review.

---

## WHAT CHANGED AND WHY

v2.1 achieved the typography and identity shift but overcorrected on darkness and texture. The site now feels like a decommissioned station rather than a living ship. The scanline/vignette filter approach creates oppressive darkness rather than analog warmth. The teal-green accent, while better than cyan, is applied uniformly enough to create a new version of the same "AI picked one color" problem.

v2.2 fixes this with five targeted adjustments:
1. Background shifts from pure black to space navy
2. Teal-green gains a counterweight: stellar blue
3. Filter-based analog (grain/scanlines/vignette) replaced by structural analog (dashed lines, corner brackets, data scatter)
4. Text softens from pure white to cool off-white
5. Writing surfaces get their own light treatment

---

## 1. BACKGROUND: SPACE NAVY

### Replace Pure Black

```css
/* OLD */
--sf-bg-deep: #09090B;
--sf-bg-panel: #0F0F10;

/* NEW */
--sf-bg-deep: #0A0E17;          /* Space navy — reads as deep space, not void */
--sf-bg-panel: #0E1320;         /* Panel surface — slightly lighter navy */
--sf-bg-panel-alpha: rgba(14, 19, 32, 0.92);   /* Floating panels */
--sf-bg-tool-panel: rgba(14, 19, 32, 0.95);    /* Layer 3 tool panels */
```

This is a subtle shift. Side-by-side you'll barely see it. But the entire site will feel less oppressive. Navy-black has depth where pure black has nothing.

### Why Not Darker?

Because the tools, simulators, and canvas elements need room below the background. If the background is already at the floor, nothing can recede behind it. Navy-black gives you a "below the surface" layer to work with.

---

## 2. COLOR: THREE-ACCENT SYSTEM

### The Problem

Teal-green (#3DFFCD) is on every interactive element, every border, every hover state. It reads as monochrome. The 85/15 teal/amber split isn't enough variety.

### The Solution: Add Stellar Blue

```css
--sf-accent-primary: #3DFFCD;      /* Teal-green — system/active/interactive */
--sf-accent-secondary: #FFB347;     /* Amber — data/premium/velocity */
--sf-accent-tertiary: #5B8DEF;      /* Stellar blue — wonder/creativity/explore */
```

### Where Each Color Lives

**Teal-green (#3DFFCD)** — THE system color. Stays on:
- Active/focused interactive elements (buttons, links, toggles)
- Primary CTA buttons
- Active nav states
- Form focus rings
- Status: online/active/connected
- The `//` section prefix color
- Corner brackets on active/selected panels

**Amber (#FFB347)** — THE data color. Stays on:
- Velocity ticker values
- Numeric readouts and measurements
- Pro/premium badges and highlights
- Warnings
- Coordinate data in background scatter
- Tool numbering badges ("Tool 1", "Tool 2")

**Stellar blue (#5B8DEF)** — THE wonder color. NEW, appears on:
- The "Waiting to be found." tagline glow
- Learn section accents and links
- Writing space UI chrome (the editor toolbar, word count)
- Hover states on world cards (your creative work = blue glow)
- The "Create New World" card accent
- Moodboard and creative features
- Background star scatter dots (tiny, very low opacity)
- Section headers for creative/exploratory content
- Epigraph text (instead of pure white at low opacity, try blue at low opacity)

### Revised Ratio

~55% teal-green, ~15% amber, ~20% stellar blue, ~10% white/neutral. No single color dominates.

### Stellar Blue Opacity Scale

```css
#5B8DEF                               Full — rare, links and creative accents only
rgba(91, 141, 239, 0.6)              Dimmed — hover text, writing UI
rgba(91, 141, 239, 0.08)             Glow — background tints on creative panels
rgba(91, 141, 239, 0.15)             Border — world cards, writing surfaces
rgba(91, 141, 239, 0.03)             Dust — background star scatter
```

---

## 3. TEXT: COOL OFF-WHITE

### Replace Pure White

```css
/* OLD */
--sf-text-primary: #FAFAFA;
--sf-text-secondary: #C8C8C8;

/* NEW */
--sf-text-primary: #E0E4E8;          /* Cool off-white — softer on navy */
--sf-text-secondary: #B0B8C4;        /* Cool gray — body text */
--sf-text-muted: rgba(224, 228, 232, 0.35);   /* Labels */
--sf-text-ghost: rgba(224, 228, 232, 0.18);   /* Hints, credits */
```

Against space navy, cool off-white reads as "starlight" rather than "flashlight." MD Nichrome at this color will feel like embossed metal rather than harsh neon.

---

## 4. TEXTURE: STRUCTURAL ANALOG (REPLACES FILTER ANALOG)

### What to Remove

- **CRT vignette** — DELETE entirely. This is the primary cause of "too dark."
- **Scanlines** — REDUCE to barely perceptible (opacity 0.008) or remove entirely. The structural elements will carry the analog feel.
- **Film grain** — KEEP but at 0.015–0.020 opacity. Subliminal only.

### What to Add: Structural Analog Elements

These replace the filter approach with design elements that create the same retro-technical feeling without darkening anything.

#### A. Dashed Divider Lines with Data Bursts

Inspired by EVE Frontier. Horizontal section dividers are dashed lines with small data readouts at intervals.

```css
.sf-divider {
  position: relative;
  width: 100%;
  height: 1px;
  border: none;
  border-top: 1px dashed rgba(224, 228, 232, 0.08);
  margin: 48px 0;
}

/* Optional: data burst at center or offset position */
.sf-divider-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--sf-font-mono);
  font-size: 7px;
  letter-spacing: 1px;
  color: rgba(255, 179, 71, 0.25);     /* amber, very muted */
  background: var(--sf-bg-deep);
  padding: 0 12px;
  white-space: nowrap;
}
```

Example data bursts (contextual, not random):
```
— ·· — 39.87°N 104.97°W — ·· —
— ·· — SECTOR: BIOLOGY — ·· —
— ·· — 2026.02.19 — ·· —
```

#### B. Corner Brackets on Featured Panels

Squared bracket corners instead of (or in addition to) border-radius. Creates a technical-readout feel.

```css
.sf-bracket-panel {
  position: relative;
  padding: 24px;
  /* No border or very faint border */
  border: 1px solid rgba(224, 228, 232, 0.04);
}

/* Corner brackets via pseudo-elements or border-image */
.sf-bracket-panel::before,
.sf-bracket-panel::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(224, 228, 232, 0.25);   /* bright enough to see */
  border-style: solid;
}

.sf-bracket-panel::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;     /* top-left corner */
}

.sf-bracket-panel::after {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;     /* top-right corner */
}

/* Bottom corners need a wrapper or additional elements */
.sf-bracket-panel .sf-bracket-bottom-left {
  position: absolute;
  bottom: -1px;
  left: -1px;
  width: 16px;
  height: 16px;
  border-left: 2px solid rgba(224, 228, 232, 0.25);
  border-bottom: 2px solid rgba(224, 228, 232, 0.25);
}

.sf-bracket-panel .sf-bracket-bottom-right {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 16px;
  height: 16px;
  border-right: 2px solid rgba(224, 228, 232, 0.25);
  border-bottom: 2px solid rgba(224, 228, 232, 0.25);
}
```

Use corner brackets on: featured tool cards, the hero section, modal dialogs, the writing editor frame. NOT on every card — reserve for emphasis. Regular cards keep subtle borders.

Corner bracket colors can vary:
- White/off-white: default/neutral panels
- Teal-green: active/selected states
- Stellar blue: creative/writing panels
- Amber: data/premium panels

#### C. Background Data Scatter

Small, nearly invisible coordinate data placed at strategic points in backgrounds. Like EVE's random numbers in the margins. These are NOT interactive, NOT readable at a glance — they're atmospheric.

```css
.sf-data-scatter {
  position: absolute;
  font-family: var(--sf-font-mono);
  font-size: 6px;
  letter-spacing: 0.5px;
  color: rgba(255, 179, 71, 0.08);     /* amber, barely visible */
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}
```

Place 3-5 per major section, at edges and corners. Content should be plausible astronomical data:
```
47.3892  -122.0841
RA 14h 29m 43s
DEC +46° 27' 14"
2.741 pc
V = 12.6 mag
```

This is NOT a randomly generated matrix of numbers. Each value should look like it means something even if the user never reads it. Coordinates, right ascension, declination, parsecs, magnitudes.

#### D. Bilateral Hover Lines

Replace the left-border-only hover with thin lines on BOTH left and right edges of cards/panels on hover. This preserves symmetry (important for Jason) while adding color.

```css
.tool-card {
  position: relative;
  transition: all 0.25s ease-out;
}

.tool-card::before,
.tool-card::after {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: transparent;
  transition: background 0.25s ease-out;
}

.tool-card::before { left: -1px; }
.tool-card::after { right: -1px; }

.tool-card:hover::before,
.tool-card:hover::after {
  background: rgba(91, 141, 239, 0.4);    /* stellar blue hover */
}

.tool-card:hover {
  transform: translateY(-2px);
}
```

Color varies by card type:
- Tool cards: stellar blue bilateral lines
- World cards: stellar blue bilateral lines
- Data/calculator cards: amber bilateral lines
- Active/selected: teal-green bilateral lines

The lines don't span the full height — they're inset 8px from top and bottom, which looks more refined than edge-to-edge.

---

## 5. WRITING SURFACE: LIGHT MODE (LOCAL ONLY)

The RTF editor where users write creative text gets a light treatment. This is NOT a site-wide light mode. It's the captain's log — the one warm, human space on the ship.

```css
.sf-writing-surface {
  background: #F5F3EF;              /* Warm cream/parchment */
  color: #1A1A2E;                   /* Deep navy text */
  border: 1px solid rgba(91, 141, 239, 0.15);   /* stellar blue border */
  border-radius: 4px;
  padding: 32px 40px;
  font-family: var(--sf-font-body);
  font-size: 16px;
  line-height: 1.7;
  caret-color: #5B8DEF;             /* blue cursor */
}

.sf-writing-surface::selection {
  background: rgba(91, 141, 239, 0.2);
  color: #1A1A2E;
}

/* The toolbar above the writing surface stays dark */
.sf-writing-toolbar {
  background: var(--sf-bg-panel);
  border-bottom: 1px dashed rgba(91, 141, 239, 0.12);
  padding: 8px 16px;
}

.sf-writing-toolbar button {
  color: var(--sf-text-muted);
}

.sf-writing-toolbar button:hover {
  color: #5B8DEF;
}
```

The frame around the editor stays dark (it's still the ship). The writing surface itself is warm and readable. The contrast between dark frame and light surface emphasizes that this is *your* space — the instrument panels are the ship's, but the page is yours.

---

## 6. PERSISTENT STATUS BAR

The velocity ticker and session data moves from a hidden footer element to a persistent bottom bar that's always visible, like a browser status bar or a game HUD.

```css
.sf-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: rgba(10, 14, 23, 0.95);       /* navy, nearly opaque */
  border-top: 1px solid rgba(224, 228, 232, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 9000;
  font-family: var(--sf-font-mono);
  font-size: 8px;
  letter-spacing: 0.5px;
  color: rgba(224, 228, 232, 0.25);
}

.sf-status-bar .velocity {
  color: rgba(255, 179, 71, 0.4);           /* amber values */
}

.sf-status-bar .sector {
  color: rgba(61, 255, 205, 0.3);           /* teal-green sector info */
}

.sf-status-bar .session {
  color: rgba(224, 228, 232, 0.18);         /* very muted session data */
}
```

### Layout (left to right)

```
LEFT:   CMB 627 km/s · GALACTIC 230 km/s · SOLAR 29.78 km/s
CENTER: // SECTOR: TOOLS → BIOLOGY · DEPTH: 3/7                (contextual, changes per page)
RIGHT:  SESSION 00:14:32 · 39.87°N 104.97°W · 2026.02.19
```

The status bar accounts for 24px of bottom space — add `padding-bottom: 24px` to the body to prevent content overlap.

On mobile: collapse to single line showing only CMB velocity and session time.

---

## 7. PAGE TRANSITIONS (OPTIONAL, PHASE 3+)

Inspired by EVE Frontier's grid-shutter effect. When navigating between major sections:

1. A grid of small squares (8×6 or similar) rapidly fills in from top-left to bottom-right with the navy background color
2. Brief flash of shuffling monospace digits (2-3 rows, very fast, 150ms)
3. Grid squares dissolve to reveal the new page

This is a polish feature. Do NOT implement during the initial uplift. Flag for Phase 3+ consideration. The effect should feel like a system initializing, not like a loading screen.

---

## 8. SIMULATOR COLOR EVOLUTION

The simulators (ROGUE, ExoSky, TIDELOCK) currently use cyan (#00D4FF). Rather than migrating all to teal-green (which would just create the same uniformity problem), give each simulator its own accent pulled from the existing icon color map:

```
ROGUE       →  Keep its red/danger aesthetic (#E74C3C tints)
ExoSky      →  Stellar blue (#5B8DEF) — it's about wonder and sky
TIDELOCK    →  Amber (#FFB347) — it's about warmth and tidally locked worlds
```

This is a longer-term migration. Don't change simulators now. But when they're touched next, move toward their icon-matched color rather than forcing everything to one accent.

---

## SUMMARY: WHAT TO TELL CLAUDE CODE

### Immediate Changes (v2.2 uplift)

1. **Background**: `#09090B` → `#0A0E17` everywhere on the site shell. Panel surfaces to `#0E1320`.
2. **Text**: `#FAFAFA` → `#E0E4E8` for primary. `#C8C8C8` → `#B0B8C4` for secondary.
3. **Add stellar blue**: `--sf-accent-tertiary: #5B8DEF;` with full opacity scale. Apply to: "Waiting to be found" tagline, Create New World card, world card hovers, Learn section, writing UI, epigraph text.
4. **Reduce teal-green**: Audit every teal-green usage. If it's not an interactive/active state, consider if stellar blue or neutral would be better.
5. **Remove vignette**: Delete entirely.
6. **Reduce grain/scanlines**: Grain to 0.015 max. Scanlines to 0.008 or remove.
7. **Add dashed dividers**: Replace solid HR/divider elements with dashed lines + optional data bursts.
8. **Add corner brackets**: On featured/hero panels, the writing editor frame, and modal dialogs.
9. **Bilateral hover lines**: Replace left-border hover with symmetric left+right thin lines on cards, inset 8px from edges.
10. **Persistent status bar**: 24px fixed bottom bar with velocity data, sector info, session time.
11. **Writing surface**: Light cream background (#F5F3EF) for RTF editor areas only, with stellar blue accents.
12. **Background data scatter**: 3-5 faint astronomical coordinate readouts per major section, amber at 0.08 opacity.

### Do NOT Change
- Typography stack (MD Nichrome, Jura, DM Sans, JetBrains Mono, Michroma — all correct)
- Custom tool icons
- Simulator panels (ROGUE, ExoSky, TIDELOCK)
- Grid symmetry
- Layer 3 tool/worksheet CSS classes (just update the color values within them)

---

## QUICK REFERENCE (UPDATED)

```
Background:          #0A0E17 (space navy, not pure black)
Panel surface:       #0E1320
Text primary:        #E0E4E8 (cool off-white)
Text secondary:      #B0B8C4
Accent primary:      #3DFFCD (teal-green — system/active)
Accent secondary:    #FFB347 (amber — data/premium)
Accent tertiary:     #5B8DEF (stellar blue — wonder/creativity)
Writing surface:     #F5F3EF (warm cream, local to editor only)
Writing text:        #1A1A2E (deep navy)
Grain opacity:       0.015 max
Scanline opacity:    0.008 or none
Vignette:            REMOVED
Dividers:            Dashed, 1px, rgba(224,228,232,0.08)
Corner brackets:     16px, 2px solid, off-white/colored per context
Hover lines:         Bilateral, 2px, inset 8px, color by card type
Status bar:          24px fixed bottom, 8px mono, amber velocities
```

---

*These worlds exist in you. Waiting to be found.*
