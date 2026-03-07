# StellarForge Simulator Aesthetic Guide v2

**For interactive canvas-based tools at stellarforge.tools**
*Reference implementations: ROGUE Gravitational Simulator, ExoForge Planet Builder*

---

## Philosophy

StellarForge simulators are scientific instruments wrapped in cinematic interfaces. They should feel like the control console of a research vessel — precise, dark, information-dense, but never clinical. Every element serves function first, then beauty. The darkness isn't decorative; it makes the simulation *the light source* of the page.

The guiding principle: **the simulation is the hero, the UI is the instrument panel.**

---

## What Changed from v1

This is a **breaking aesthetic update**. Every simulator must be migrated.

| Element | v1 (Old) | v2 (Current) |
|---|---|---|
| **Structural font** | Space Grotesk | MD Nichrome Test (Light 300) |
| **Border radius** | 6px buttons, 8px panels, 12px modals | **0px everywhere** |
| **Accent system** | Cyan-only (#00D4FF) | **Dual: Cyan + Green** |
| **Section headers** | Space Grotesk 600, muted cyan | Nichrome 300, muted green |
| **Slider thumbs** | Round, 11px | **Square, 12px** |
| **Hover/brand color** | Cyan glow | **Green glow** |
| **Active/data color** | Cyan | Cyan (unchanged) |
| **Scrollbar tint** | Cyan | Green |
| **Font import** | Google Fonts only | Google Fonts + cdnfonts |

### Migration Checklist (per simulator)

1. Replace font import line (see Fonts > Loading below)
2. Find/replace `border-radius: 6px` → `border-radius: 0` (all instances)
3. Find/replace `border-radius: 8px` → `border-radius: 0`
4. Find/replace `border-radius: 12px` → `border-radius: 0`
5. Find/replace `border-radius: 50%` on slider thumbs → `border-radius: 0`
6. Replace `font-family: 'Space Grotesk'` → `font-family: 'MD Nichrome Test', 'Space Grotesk'` on structural elements (titles, section headers, buttons, badges, planet names)
7. Update section header color from `rgba(0, 212, 255, ...)` → `rgba(0, 229, 160, ...)`
8. Update button hover from cyan glow → green glow
9. Update scrollbar thumb color to green
10. Update credit link color to green
11. Fix slider CSS (see Sliders section — critical thumb alignment fix)
12. Add CSS custom properties block (see Color System)

---

## Fonts

### Loading

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<link href="https://fonts.cdnfonts.com/css/md-nichrome-test" rel="stylesheet">
```

**Note:** Space Grotesk is no longer imported directly. It remains as a CSS fallback only (`'MD Nichrome Test', 'Space Grotesk', sans-serif`).

### Usage Hierarchy

| Role | Font | Weight | Size | Spacing | Transform |
|---|---|---|---|---|---|
| **Tool title** | MD Nichrome Test | 300 | 28px | 4px | uppercase |
| **Section headers** | MD Nichrome Test | 300 | 8px | 3px | uppercase |
| **Buttons** | MD Nichrome Test | 300 | 8px | 2px | uppercase |
| **Planet/object names** | MD Nichrome Test | 300 | 10px | 1px | none |
| **Labels** | DM Sans | 400 | 8–8.5px | 1.2px | uppercase |
| **Body / UI text** | DM Sans | 400 | 9–10px | normal | none |
| **Data values** | JetBrains Mono | 300–500 | 9–10px | normal | none |
| **Subtitles** | MD Nichrome Test | 300 | 8px | 3px | uppercase |
| **Credits** | DM Sans | 400 | 7px | 1px | uppercase |

### Rules

- **MD Nichrome Test** = anything structural (titles, section dividers, buttons, modal headings, object names in search results). Always weight **300** (Light). The semi-wide letter-spacing (3–4px) creates the characteristic retro-SF aesthetic.
- **DM Sans** = anything readable (labels, descriptions, input fields, notes, badges, status text)
- **JetBrains Mono** = anything numerical (data readouts, slider values, coordinates, telemetry)
- Never use JetBrains Mono for prose. Never use Nichrome for body paragraphs.
- Nichrome weight is **always 300** — never use bold weights. The thin strokes are the point.

### Fallback Chain

All Nichrome declarations must include the fallback:
```css
font-family: 'MD Nichrome Test', 'Space Grotesk', sans-serif;
```

If the CDN font fails to load, Space Grotesk (still referenced via the fallback) provides a similar geometric display feel. The layout should not break.

---

## Color System

### CSS Custom Properties

Every simulator should define these at `:root`:

```css
:root {
  /* === DUAL ACCENT SYSTEM === */
  --accent-cyan: #00D4FF;        /* data, interactive states, loaded content */
  --accent-green: #00E5A0;       /* brand, structural, navigation, hover */
  --accent-teal: #00DCCC;        /* blended — use sparingly for bridging elements */

  /* === STATUS COLORS === */
  --status-green: #2ECC71;       /* success / habitable / positive outcome */
  --status-red: #E74C3C;         /* danger / critical / destructive */
  --status-gold: #FFD43B;        /* stellar / highlighted measurements */
  --status-orange: #FFA500;      /* warning / perturbation / transition */

  /* === SURFACES === */
  --bg-void: #09090B;            /* canvas fill, body background */
  --bg-panel: rgba(15, 15, 16, 0.92);  /* floating panels */
  --border-subtle: rgba(255, 255, 255, 0.06);  /* panel edges */
  --border-active: rgba(0, 229, 160, 0.2);     /* focused/hover edges */

  /* === TEXT === */
  --text-primary: #FAFAFA;
  --text-secondary: #C8C8C8;
  --text-muted: rgba(255, 255, 255, 0.35);
  --text-ghost: rgba(255, 255, 255, 0.18);
}
```

### Dual Accent Philosophy

The two accents serve distinct roles and should never be swapped:

**Cyan (#00D4FF)** — the *instrument* color
- Slider thumbs
- Active/selected button states
- Loaded data indicators ("Real Exoplanet Loaded")
- Data value highlights
- Input focus borders use green (see below), but active *selection* states stay cyan
- Primary action buttons (Generate, Launch, Start)

**Green (#00E5A0)** — the *forge* color
- Section headers (muted: `rgba(0, 229, 160, 0.4)`)
- Section header underlines (`rgba(0, 229, 160, 0.06)`)
- Button hover glow (`rgba(0, 229, 160, 0.06)` bg, `rgba(0, 229, 160, 0.2)` border)
- Subtitle text (STELLARFORGE.TOOLS)
- Scrollbar thumbs
- Search status text
- Input focus borders
- Spinner accent
- Credit link color
- Custom idle badge state

### Opacity Pattern for Status Elements

Every status color follows the same opacity structure — **unchanged from v1**:

```css
/* Background */    rgba(COLOR, 0.06–0.08)   /* barely visible tint */
/* Border */        rgba(COLOR, 0.2)          /* subtle edge */
/* Text */          COLOR at full              /* readable label */
```

The 0.06–0.08 / 0.2 / 1.0 ratio creates the characteristic "glow from within." Non-negotiable.

### Section Header Green

Section dividers use muted green — **never** the full #00E5A0:

```css
color: rgba(0, 229, 160, 0.4);                    /* text */
border-bottom: 1px solid rgba(0, 229, 160, 0.06); /* underline */
```

---

## Geometry: Zero Border Radius

**All elements use `border-radius: 0`.** No exceptions except spinners (which remain circular for semantic reasons).

This applies to:
- Panels
- Buttons
- Inputs (text, select, range thumbs)
- Badges
- Search results
- Modals
- Spectrum bars
- Scrollbar thumbs
- Habitability indicators

The sharp edges evoke precision instrumentation — oscilloscope screens, mission control readouts, aperture cards. Rounded corners are friendly consumer UI. StellarForge is not that.

---

## Panel Structure

### Floating Panels

```css
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 0;
  padding: 14px 18px;
}
```

### Panel Placement

- **Top-left**: Tool title + status badge
- **Left side**: Control panel (scrollable, 220–260px wide)
- **Top-right**: Data readout panel (240–260px wide)
- **Bottom-right**: Zoom / viewport info
- **Bottom-center** (optional): Search bar, timeline scrubber, secondary controls

### Scrollbars

Custom scrollbars use green accent:

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 229, 160, 0.12); border-radius: 0; }
```

---

## Control Elements

### Sliders (Range Inputs) — CRITICAL FIX

The v1 slider CSS caused thumb misalignment in WebKit browsers. The fix: make the `<input>` element tall enough to contain the thumb, keep only the *track* thin.

```css
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 14px;              /* CRITICAL: tall enough for thumb */
  background: transparent;    /* track handles its own bg */
  outline: none;
  margin: 4px 0 10px 0;
  cursor: pointer;
  touch-action: none;         /* prevents mobile scroll-jacking */
}

/* WebKit track — thin line */
input[type=range]::-webkit-slider-runnable-track {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

/* WebKit thumb — square, centered on track */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 0;                      /* SQUARE thumb */
  background: var(--accent-cyan);        /* cyan — instrument color */
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.5);
  margin-top: -5px;                      /* centers 12px thumb on 2px track */
  transition: transform 0.1s, box-shadow 0.15s;
}
input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}
input[type=range]:active::-webkit-slider-thumb {
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.5);
}

/* Firefox track + thumb */
input[type=range]::-moz-range-track {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
}
input[type=range]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 0;
  background: var(--accent-cyan);
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.5);
}
```

The slider value display sits floated right of the label:

```css
.value-display {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(255, 255, 255, 0.5);
  float: right;
  font-weight: 300;
}
```

### Buttons

```css
button {
  font-family: 'MD Nichrome Test', 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

/* Hover — GREEN glow (brand color) */
button:hover {
  background: rgba(0, 229, 160, 0.06);
  border-color: rgba(0, 229, 160, 0.2);
  color: #fff;
}

/* Active / selected — CYAN (instrument color) */
button.active {
  background: rgba(0, 212, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.25);
  color: var(--accent-cyan);
}
```

### Primary Action Button (Launch / Start / Generate)

Same as `.active` by default — cyan-tinted before interaction, so it reads as the obvious entry point.

### Checkboxes

```css
input[type=checkbox] {
  accent-color: var(--accent-cyan);
  width: 11px;
  height: 11px;
}
```

### Select Dropdowns

```css
select {
  font-family: 'DM Sans', sans-serif;
  font-size: 9px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 8px;
  border-radius: 0;
  outline: none;
}
select option {
  background: #0F0F10;
  color: #C8C8C8;
}
```

### Text Inputs

```css
input[type=text], input[type=number] {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 7px 10px;
  border-radius: 0;
  outline: none;
}
input:focus {
  border-color: rgba(0, 229, 160, 0.35);  /* green focus */
}
```

---

## Transport Controls

Any simulator with time progression should include a transport bar:

```
[ ⏪ Rewind ] [ ◀ Step ] [ ⏸ Pause / ▶ Play ] [ ▶ Step ] [ ↺ Reset ]
```

### Layout

```css
.transport {
  display: flex;
  gap: 3px;
  align-items: center;
}
.transport button {
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 10px;
  padding: 7px 6px;
  letter-spacing: 0;        /* exception: transport icons don't need spacing */
}
```

### State Indicators

- **Playing**: Cyan highlight (`.playing` — 0.08/0.25 pattern)
- **Rewinding**: Orange highlight (hold-to-rewind interaction)
- **Paused**: Default button state (no highlight)

### Behavior

- **Rewind**: Hold-to-scrub (mousedown/touchstart), rate scales with time slider
- **Step Back/Forward**: Single-click, advances fixed number of physics steps
- **Play/Pause**: Toggle, spacebar shortcut
- **Reset**: Always visible, returns to initial state

### State History

Simulators should maintain a circular buffer of state snapshots (~4000 frames) for rewind capability.

---

## Data Readout Panel

### Section Headers

```css
.data-section {
  font-size: 8px;
  font-family: 'MD Nichrome Test', 'Space Grotesk', sans-serif;
  font-weight: 300;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(0, 229, 160, 0.4);          /* green accent */
  margin-top: 7px;
  margin-bottom: 1px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(0, 229, 160, 0.06);
}
```

### Data Rows

Two-column layout — label left, value right:

```css
.data-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
  padding: 3px 0;
}
.data-label {
  color: var(--text-muted);
  font-weight: 300;
  font-family: 'DM Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
.data-value {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
}
.data-unit {
  font-family: 'DM Sans', sans-serif;
  font-size: 7px;
  color: rgba(255, 255, 255, 0.2);
  margin-left: 3px;
}
```

### Color-Coded Values

```
Intruder data    → intruder's type color (#E74C3C for black hole, etc.)
Star data        → gold (#FFD43B)
Planet data      → planet's assigned color
Success data     → green (#2ECC71)
Neutral data     → default white at 0.7 opacity
```

---

## Status Badge

Floating badge below the title that reflects simulation state:

```css
#badge {
  padding: 5px 12px;
  font-size: 8px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all 0.5s;
  border-radius: 0;
}
```

### States

| State | Background | Border | Color | Animation |
|---|---|---|---|---|
| Idle / Custom | `rgba(0,229,160,.03)` | `rgba(0,229,160,.08)` | `rgba(0,229,160,.4)` | none |
| Active | `rgba(0,229,160,.06)` | `rgba(0,229,160,.2)` | `#00E5A0` | none |
| Data Loaded | `rgba(0,212,255,.06)` | `rgba(0,212,255,.2)` | `#00D4FF` | pulse 2s |
| Warning | `rgba(255,165,0,.08)` | `rgba(255,165,0,.2)` | `#FFA500` | none |
| Danger | `rgba(231,76,60,.08)` | `rgba(231,76,60,.2)` | `#E74C3C` | pulse 1.5s |

**Note:** v1 used green for "success" and cyan for "active." v2 inverts this — green is the *idle/brand* state, cyan indicates *loaded external data*. This reflects the dual accent philosophy: cyan = data, green = forge identity.

### Pulse Animation

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}
```

---

## Canvas Rendering

### Background

Canvas clear color is always `#09090B` — matches body background for seamless edge blending.

### Star Field

Parallax background stars rendered at 0.04× camera movement rate. 500 points, sizes 0.6–1.6px, brightness 0.05–0.35 opacity.

### Grid Lines

```css
stroke: rgba(255, 255, 255, 0.02);
line-width: 1px;
```

Grid spacing adapts to zoom level — auto-subdivides as you zoom in.

### Orbital Reference Lines

```css
stroke: rgba(PLANET_COLOR, 0.07);
line-width: 1px;
dash-pattern: [2, 4];
```

### Habitable Zone Overlay

```css
fill: rgba(46, 204, 113, 0.03);
stroke: rgba(46, 204, 113, 0.08);
dash-pattern: [3, 5];
```

### Trail Rendering

Trails fade from current opacity to zero over their length using graduated alpha. Trail color matches body color. Max trail points capped per body (~800) for performance.

### Labels (Canvas-Rendered)

```
Font: 8px "DM Sans"
Color: rgba(BODY_COLOR, 0.4)
Position: Below the body by radius + 14px
Alignment: center
```

### Glow Effects

Stars and luminous objects use radial gradients, not box-shadows:

```javascript
const glow = ctx.createRadialGradient(sx, sy, radius, sx, sy, radius * 6);
glow.addColorStop(0, 'rgba(STAR_COLOR, 0.15)');
glow.addColorStop(1, 'rgba(STAR_COLOR, 0)');
```

---

## Modal / Builder Overlay

```css
/* Overlay backdrop */
background: rgba(9, 9, 11, 0.94);
backdrop-filter: blur(20px);

/* Modal card */
max-width: 680px;
padding: 30px 36px;
background: rgba(15, 15, 16, 0.98);
border: 1px solid rgba(0, 229, 160, 0.08);   /* green-tinted border */
border-radius: 0;
```

Modal headings use MD Nichrome Test 300 at 28px with 4px letter-spacing.

---

## Zoom / Viewport Info

```css
/* Large numeric value */
font-size: 16px;
font-family: 'MD Nichrome Test', 'Space Grotesk', sans-serif;
font-weight: 300;
color: rgba(0, 212, 255, 0.5);    /* cyan — this is data */

/* Unit label below */
font-size: 7px;
letter-spacing: 1px;
text-transform: uppercase;
color: var(--text-ghost);
```

---

## Branding Element

### Title Block

```
TOOL NAME                    ← MD Nichrome Test 300, 28px, 4px spacing, uppercase, white
STELLARFORGE.TOOLS           ← MD Nichrome Test 300, 8px, 3px spacing, uppercase, rgba(0,229,160,.35)
Current Context Label        ← DM Sans 400, 10px, var(--accent-cyan) at 0.6 opacity
© 2025–2026 Jason D. Batt   ← DM Sans 400, 7px, 1px spacing, rgba(255,255,255,.12)
```

The credit link to stellarforge.tools uses `rgba(0, 229, 160, 0.25)` — green-tinted, present but never attention-grabbing.

---

## Camera System

### Smoothing

Use delta-time exponential interpolation — never fixed lerp values:

```javascript
const smoothing = 1 - Math.pow(0.0001, frameDt / 1000);
cam.x += (targetCam.x - cam.x) * smoothing;
cam.y += (targetCam.y - cam.y) * smoothing;
cam.zoom += (targetCam.zoom - cam.zoom) * smoothing;
```

### Zoom Controls

Mouse wheel: `zoom *= (deltaY > 0 ? 0.87 : 1.15)` — asymmetric for natural feel.
Touch: Pinch-to-zoom with distance ratio scaling.
Range: 0.5× to 5000× (adjust per simulator).

---

## Object-Specific Color Semantics

When simulators involve typed objects, each type gets a distinctive color following the 0.06–0.08 / 0.2 / 1.0 opacity pattern:

```css
.type-danger.active  { background: rgba(231,76,60,.12);  border-color: rgba(231,76,60,.35);  color: #E74C3C; }
.type-warm.active    { background: rgba(200,85,61,.12);  border-color: rgba(200,85,61,.35);  color: #C8553D; }
.type-neutral.active { background: rgba(139,105,20,.12); border-color: rgba(139,105,20,.35); color: #8B6914; }
```

Type buttons include a 6px color dot (::before pseudo-element) for identification even in inactive state.

---

## Performance: Dirty Flag Pattern

Simulators with many sliders should use batched rendering to avoid frame drops:

```javascript
let dirty = { terrain: false, shell: false, readouts: false };
let isDraggingSlider = false;

// Sliders set flags instead of calling render directly
function scheduleUpdate(terrainNeeded) {
  if (terrainNeeded) dirty.terrain = true;
  dirty.shell = true;
  dirty.readouts = true;
}

// Animation loop processes flags once per frame
function animate(time) {
  requestAnimationFrame(animate);
  if (dirty.shell) { updateShell(); dirty.shell = false; }
  if (dirty.terrain) {
    generateTexture(isDraggingSlider ? 2 : 6); // fast preview while dragging
    dirty.terrain = false;
  }
  if (dirty.readouts && time - lastReadoutUpdate > 80) {
    updateDataReadouts();
    lastReadoutUpdate = time;
    dirty.readouts = false;
  }
  // ... render
}

// Full quality pass on slider release
document.addEventListener('mouseup', () => {
  if (isDraggingSlider) {
    isDraggingSlider = false;
    generateTexture(6); // full quality
    updateDataReadouts();
  }
});
```

**Two-tier quality**: Separate "cheap" updates (uniforms, materials, colors) from "expensive" updates (geometry regeneration, texture computation). Only the expensive params (temperature, composition, ocean coverage) trigger terrain rebuilds.

---

## Responsive Considerations

### Mobile Layout

- Control panel collapses to bottom sheet or hamburger
- Data readout becomes expandable overlay
- Touch targets minimum 44px
- Transport controls get slightly more padding (9px vertical)
- Title shrinks: 20px at <600px viewport
- `touch-action: none` on all range inputs to prevent scroll-jacking

### Panel Overflow

```css
max-height: calc(100vh - 80px);
overflow-y: auto;
```

---

## Quick Reference: The Numbers

```
Border radius:     0 (everything)
Panel border:      rgba(255,255,255, 0.06)
Panel background:  rgba(15,15,16, 0.92)
Backdrop blur:     16px (panels)  |  20px (modals)
Transition speed:  0.2s (buttons)  |  0.3s (fades)  |  0.5s (status badges)
Section gap:       14px margin-top between sections
Button gap:        4px margin-right between inline buttons  |  3px in transport
Label size:        8–8.5px DM Sans uppercase with 1.2px spacing
Header size:       8px MD Nichrome 300 uppercase with 3px spacing
Data font size:    9–10px JetBrains Mono
Title size:        28px MD Nichrome 300 uppercase with 4px spacing
Max panel width:   220–260px for side panels
Slider thumb:      12px square, cyan, 2px dark border
Slider track:      2px, rgba(255,255,255,0.06)
Input height:      14px (transparent) — track handles the thin line
```

---

## Checklist for New Simulators

- [ ] Canvas fills viewport, `#09090B` background
- [ ] Font imports: Google Fonts (DM Sans, JetBrains Mono) + cdnfonts (MD Nichrome Test)
- [ ] CSS custom properties defined at `:root`
- [ ] Floating glass panels with blur and `rgba(15,15,16,0.92)`
- [ ] `border-radius: 0` on ALL elements (panels, buttons, inputs, badges, thumbs)
- [ ] Section headers in MD Nichrome 300, muted green
- [ ] Slider thumbs are `var(--accent-cyan)` squares, properly centered with `margin-top: -5px`
- [ ] Slider input `height: 14px` with `background: transparent`
- [ ] All buttons use MD Nichrome 300 uppercase, green hover, cyan active
- [ ] Data values in JetBrains Mono
- [ ] Status badge with dual-accent state logic (green idle, cyan data-loaded)
- [ ] Custom 3px green scrollbars
- [ ] Delta-time camera smoothing
- [ ] Transport controls (if time-based)
- [ ] State history for rewind (if time-based)
- [ ] Title block with green STELLARFORGE.TOOLS subtitle
- [ ] Credit line with green rgba link
- [ ] Parallax star field background
- [ ] Dirty flag rendering (if multiple expensive sliders)
- [ ] Mobile-responsive panel collapse
- [ ] `touch-action: none` on range inputs

---

## Checklist for Migrating v1 Simulators

- [ ] Replace font import line
- [ ] Add `:root` CSS custom properties block
- [ ] Find/replace all `border-radius` values → `0`
- [ ] Replace `'Space Grotesk'` → `'MD Nichrome Test', 'Space Grotesk'` on structural elements
- [ ] Change structural font-weight from `500`/`600` → `300`
- [ ] Update section header color: cyan → green
- [ ] Update button hover: cyan glow → green glow
- [ ] Update scrollbar thumb: cyan → green
- [ ] Update credit/subtitle colors: cyan/white → green
- [ ] Fix slider CSS: `height: 14px`, `background: transparent`, add `-webkit-slider-runnable-track`, add `margin-top: -5px` to thumb, remove `border-radius` from thumb
- [ ] Verify Nichrome renders (check CDN loads, check fallback works)

---

*These worlds exist in you. Waiting to be found.*

© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools
