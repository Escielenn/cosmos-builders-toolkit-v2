# StellarForge Simulator Aesthetic Guide

**For interactive canvas-based tools at stellarforge.tools**
*Derived from the ROGUE Gravitational Simulator â€” the reference implementation*

---

## Philosophy

StellarForge simulators are scientific instruments wrapped in cinematic interfaces. They should feel like the control console of a research vessel â€” precise, dark, information-dense, but never clinical. Every element serves function first, then beauty. The darkness isn't decorative; it makes the simulation *the light source* of the page.

The guiding principle: **the simulation is the hero, the UI is the instrument panel.**

---

## Fonts

### Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

### Usage Hierarchy

| Role | Font | Weight | Size | Spacing | Transform |
|---|---|---|---|---|---|
| **Tool title** | Space Grotesk | 300 | 26px | 6px | uppercase |
| **Section headers** | Space Grotesk | 600 | 7.5px | 2.5px | uppercase |
| **Labels** | DM Sans | 400 | 8â€“8.5px | 1.2px | uppercase |
| **Body / UI text** | DM Sans | 400 | 9â€“10px | normal | none |
| **Data values** | JetBrains Mono | 300â€“500 | 9â€“10px | normal | none |
| **Buttons** | Space Grotesk | 500 | 8px | 1.5px | uppercase |
| **Subtitles / credits** | DM Sans | 400 | 7â€“8px | 1â€“2px | uppercase |

### Rules

- **Space Grotesk** = anything structural (titles, section dividers, buttons, modal headings)
- **DM Sans** = anything readable (labels, descriptions, input fields, notes)
- **JetBrains Mono** = anything numerical (data readouts, slider values, coordinates, telemetry)
- Never use JetBrains Mono for prose. Never use Space Grotesk for body paragraphs.
- Title weight is always **300** (light) â€” heavier weights are reserved for small section headers.

---

## Color System

### Core Palette

```
Background (Deep Space)    #09090B     Canvas fill, body background
Panel Surface              #0F0F10     Control panels, modals, data readouts
Panel Surface (alpha)      rgba(15,15,16, 0.92)   Floating panels with backdrop-filter
Primary Accent (Cyan)      #00D4FF     All interactive states, focus, active elements
Text Primary               #FAFAFA     Titles, emphasized text
Text Secondary             #C8C8C8     Body text default
Text Muted                 rgba(255,255,255, 0.35)   Labels, supporting text
Text Ghost                 rgba(255,255,255, 0.18)   Hints, credits, secondary labels
```

### Status Colors

Each status has a semantic color used for badges, state indicators, and contextual highlights:

```
Cyan      #00D4FF    Default / active / primary state
Orange    #FFA500    Warning / perturbation / transition states
Green     #2ECC71    Success / positive outcome / habitable
Red       #E74C3C    Danger / critical / destructive events
Gold      #FFD43B    Stellar / highlighted measurements
```

### Opacity Pattern for Status Elements

Every status color follows the same opacity structure:

```css
/* Background */    rgba(COLOR, 0.08)   /* barely visible tint */
/* Border */        rgba(COLOR, 0.2)    /* subtle edge */
/* Text */          COLOR at full        /* readable label */

/* Example: cyan status badge */
background: rgba(0, 212, 255, 0.08);
border: 1px solid rgba(0, 212, 255, 0.2);
color: #00D4FF;
```

This pattern applies to badges, active buttons, status indicators, and transport controls. The 0.08/0.2/1.0 ratio is non-negotiable â€” it creates the characteristic "glow from within" that defines StellarForge interactive elements.

### Section Header Cyan

Section dividers use a distinct muted cyan â€” never the full #00D4FF:

```css
color: rgba(0, 212, 255, 0.35);        /* text */
border-bottom: 1px solid rgba(0, 212, 255, 0.06);  /* underline */
```

---

## Panel Structure

### Floating Panels

All control surfaces float over the canvas with glass-morphism:

```css
background: rgba(15, 15, 16, 0.92);
border: 1px solid rgba(255, 255, 255, 0.08);
backdrop-filter: blur(16px);
border-radius: 8px;
padding: 14px 18px;
```

### Panel Placement

- **Top-left**: Tool title + status badge
- **Left side**: Control panel (scrollable, 220â€“260px wide)
- **Top-right**: Data readout panel (240â€“260px wide)
- **Bottom-right**: Zoom / viewport info
- **Bottom-center** (optional): Timeline scrubber or secondary controls

### Scrollbars

Custom scrollbars on all panels â€” never use browser defaults:

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.12); }
```

---

## Control Elements

### Sliders (Range Inputs)

```css
input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
  outline: none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #00D4FF;
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
/* Default state */
button {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

/* Hover â€” cyan glow */
button:hover {
  background: rgba(0, 212, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.2);
  color: #fff;
}

/* Active / selected state */
button.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00D4FF;
}
```

### Primary Action Button (Launch / Start / Generate)

Same as `.active` by default â€” cyan-tinted before interaction, so it reads as the obvious entry point.

### Checkboxes

```css
input[type=checkbox] {
  accent-color: #00D4FF;
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
  border-radius: 6px;
  outline: none;
}
select option {
  background: #0F0F10;
  color: #C8C8C8;
}
```

### Text Inputs (for builder/editor modals)

```css
input[type=text], input[type=number] {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 7px 10px;
  border-radius: 6px;
  outline: none;
}
input:focus {
  border-color: rgba(0, 212, 255, 0.35);
}
```

---

## Transport Controls

Any simulator with time progression should include a transport bar:

```
[ âª Rewind ] [ â—€ Step ] [ â¸ Pause / â–¶ Play ] [ â–¶ Step ] [ â†º Reset ]
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

- **Playing**: Cyan highlight (`.playing` state â€” same 0.08/0.3 pattern)
- **Rewinding**: Orange highlight (hold-to-rewind interaction)
- **Paused**: Default button state (no highlight)

### Behavior

- **Rewind**: Hold-to-scrub (mousedown/touchstart), rate scales with time slider
- **Step Back/Forward**: Single-click, advances fixed number of physics steps
- **Play/Pause**: Toggle, spacebar shortcut
- **Reset**: Always visible, returns to initial state

### State History

Simulators should maintain a circular buffer of state snapshots (~4000 frames) for rewind capability. Save body positions, velocities, and trail lengths. Trim on restore.

---

## Data Readout Panel

### Section Headers

```css
.data-section {
  font-size: 7.5px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(0, 212, 255, 0.3);
  margin-top: 7px;
  margin-bottom: 1px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.06);
}
```

### Data Rows

Two-column layout â€” label left, value right:

```css
.data-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.9;
}
.data-label {
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
  font-family: 'DM Sans', sans-serif;
  font-size: 9.5px;
}
.data-value {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
}
```

### Color-Coded Values

Data values can be tinted to match their subject:

```
Intruder data    â†’ intruder's type color (#E74C3C for black hole, etc.)
Star data        â†’ gold (#FFD43B)
Planet data      â†’ planet's assigned color
Neutral data     â†’ default white at 0.7 opacity
```

---

## Status Badge

Floating badge below the title that reflects simulation state:

```css
#badge {
  padding: 6px 14px;
  font-size: 9px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.5s;
  border-radius: 6px;
}
```

### States

| State | Background | Border | Color | Animation |
|---|---|---|---|---|
| Waiting | `rgba(0,212,255,.03)` | `rgba(0,212,255,.08)` | `rgba(0,212,255,.4)` | none |
| Active | `rgba(0,212,255,.08)` | `rgba(0,212,255,.2)` | `#00D4FF` | none |
| Warning | `rgba(255,165,0,.08)` | `rgba(255,165,0,.2)` | `#FFA500` | none |
| Success | `rgba(46,204,113,.08)` | `rgba(46,204,113,.2)` | `#2ECC71` | pulse 2s |
| Danger | `rgba(231,76,60,.08)` | `rgba(231,76,60,.2)` | `#E74C3C` | pulse 1.5s |

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

Canvas clear color is always `#09090B` â€” matches body background for seamless edge blending.

### Star Field

Parallax background stars rendered at 0.04Ã— camera movement rate. 500 points, sizes 0.6â€“1.6px, brightness 0.05â€“0.35 opacity.

### Grid Lines

```css
stroke: rgba(255, 255, 255, 0.02);   /* barely visible */
line-width: 1px;
```

Grid spacing adapts to zoom level â€” auto-subdivides as you zoom in.

### Orbital Reference Lines

```css
stroke: rgba(PLANET_COLOR, 0.07);
line-width: 1px;
dash-pattern: [2, 4];
```

### Habitable Zone Overlay

```css
fill: rgba(46, 204, 113, 0.03);       /* subtle green wash */
stroke: rgba(46, 204, 113, 0.08);     /* dashed boundary */
dash-pattern: [3, 5];
```

### Trail Rendering

Trails fade from current opacity to zero over their length using graduated alpha. Trail color matches body color. Max trail points capped per body (~800) for performance.

### Labels (Canvas-Rendered)

```
Font: 8px "DM Sans"
Color: rgba(BODY_COLOR, 0.4)          /* muted to not compete with bodies */
Position: Below the body by radius + 14px
Alignment: center
```

### Glow Effects

Stars and luminous objects use radial gradients, not box-shadows:

```javascript
// Star glow
const glow = ctx.createRadialGradient(sx, sy, radius, sx, sy, radius * 6);
glow.addColorStop(0, 'rgba(STAR_COLOR, 0.15)');
glow.addColorStop(1, 'rgba(STAR_COLOR, 0)');
```

---

## Modal / Builder Overlay

For configuration screens (system builder, settings, etc.):

```css
/* Overlay backdrop */
background: rgba(9, 9, 11, 0.94);
backdrop-filter: blur(20px);

/* Modal card */
max-width: 680px;
padding: 30px 36px;
background: rgba(15, 15, 16, 0.98);
border: 1px solid rgba(0, 212, 255, 0.08);
border-radius: 12px;                    /* slightly rounder than panels */
```

Modal headings use Space Grotesk 300 at 28px with 4px letter-spacing.

---

## Zoom / Viewport Info

Bottom-right floating indicator showing current viewport scale:

```css
/* Large numeric value */
font-size: 16px;
font-family: 'Space Grotesk', sans-serif;
font-weight: 300;
color: rgba(0, 212, 255, 0.5);

/* Unit label below */
font-size: 7px;
letter-spacing: 1px;
text-transform: uppercase;
color: rgba(255, 255, 255, 0.18);
```

---

## Camera System

### Smoothing

Use delta-time exponential interpolation â€” never fixed lerp values:

```javascript
const smoothing = 1 - Math.pow(0.0001, frameDt / 1000);
cam.x += (targetCam.x - cam.x) * smoothing;
cam.y += (targetCam.y - cam.y) * smoothing;
cam.zoom += (targetCam.zoom - cam.zoom) * smoothing;
```

This produces identical visual smoothing at 30fps and 144fps.

### Camera Mode Buttons

Follow the standard button pattern. Active mode gets `.active` (cyan) state. Typical modes: Free, Star, Intruder, + per-body tracking.

### Zoom Controls

Mouse wheel: `zoom *= (deltaY > 0 ? 0.87 : 1.15)` â€” asymmetric for natural feel.
Touch: Pinch-to-zoom with distance ratio scaling.
Buttons: `zoom *= 1.6` per click.
Range: 0.5Ã— to 5000Ã— (adjust per simulator).

---

## Responsive Considerations

### Mobile Layout

- Control panel collapses to bottom sheet or hamburger
- Data readout becomes expandable overlay
- Touch targets minimum 44px
- Transport controls get slightly more padding (9px vertical)
- Title shrinks: 20px at <600px viewport

### Panel Overflow

```css
max-height: calc(100vh - 80px);
overflow-y: auto;
```

Always provide scrollable panels rather than hiding controls.

---

## Animation Principles

1. **Simulation drives the visual** â€” UI animations are subtle (0.2â€“0.5s transitions). The canvas simulation is the spectacle.
2. **Status transitions are smooth** â€” badge state changes use `transition: all 0.5s`.
3. **No easing on physics** â€” simulation bodies move according to their integrator, never CSS-eased.
4. **Camera is the only lerped element** â€” and it uses framerate-independent exponential smoothing.
5. **Pulse for attention** â€” critical states (ejection, chaos) pulse at 1.5â€“2s intervals. Never more than one pulsing element simultaneously.

---

## Branding Element

### Title Block

```
TOOL NAME                    â† Space Grotesk 300, 26px, 6px spacing, uppercase, white
STELLARFORGE.TOOLS          â† DM Sans 400, 8px, 2px spacing, uppercase, rgba(255,255,255,.28)
Current Context Label       â† DM Sans 400, 10px, #00D4FF at 0.6 opacity, italic off
Â© 2025-2026 Jason D. Batt   â† DM Sans 400, 7px, 1px spacing, rgba(255,255,255,.12)
```

The credit link to stellarforge.tools uses `rgba(0, 212, 255, 0.25)` â€” present but never attention-grabbing.

---

## Object-Specific Color Semantics

When simulators involve typed objects (e.g., intruder types, element categories), each type gets a distinctive color that follows the 0.08/0.2â€“0.35/1.0 opacity pattern for its active button:

```css
/* Example: three intruder types */
.type-danger.active  { background: rgba(231,76,60,.12);  border-color: rgba(231,76,60,.35);  color: #E74C3C; }
.type-warm.active    { background: rgba(200,85,61,.12);  border-color: rgba(200,85,61,.35);  color: #C8553D; }
.type-neutral.active { background: rgba(139,105,20,.12); border-color: rgba(139,105,20,.35); color: #8B6914; }
```

Type buttons include a 6px color dot (::before pseudo-element) for identification even in inactive state.

---

## Quick Reference: The Numbers

```
Border radius:     6px (buttons, inputs)  |  8px (panels)  |  12px (modals)
Panel border:      rgba(255,255,255, 0.08)
Panel background:  rgba(15,15,16, 0.92)
Backdrop blur:     16px (panels)  |  20px (modals)
Transition speed:  0.2s (buttons)  |  0.3s (fades)  |  0.5s (status badges)
Section gap:       14px margin-top between sections
Button gap:        4px margin-right between inline buttons  |  3px in transport
Label size:        8â€“8.5px uppercase with 1.2px spacing
Data font size:    9â€“10px JetBrains Mono
Max panel width:   220â€“260px for side panels
```

---

## Checklist for New Simulators

- [ ] Canvas fills viewport, `#09090B` background
- [ ] Three Google Fonts loaded (Space Grotesk, DM Sans, JetBrains Mono)
- [ ] Floating glass panels with blur and `rgba(15,15,16,0.92)`
- [ ] Section headers in Space Grotesk 600, muted cyan
- [ ] Slider thumbs are `#00D4FF` circles
- [ ] All buttons use Space Grotesk uppercase
- [ ] Hover state: cyan glow at 0.08 opacity
- [ ] Active state: cyan at 0.1 bg / 0.3 border
- [ ] Data values in JetBrains Mono
- [ ] Status badge with state-appropriate color
- [ ] Custom 3px cyan scrollbars
- [ ] Delta-time camera smoothing
- [ ] Transport controls (if time-based)
- [ ] State history for rewind (if time-based)
- [ ] Title block with STELLARFORGE.TOOLS subtitle
- [ ] Credit line with rgba link
- [ ] Parallax star field background
- [ ] Mobile-responsive panel collapse

---

*These worlds exist in you. Waiting to be found.*

Â© 2025â€“2026 Jason D. Batt, Ph.D. Â· StellarForge.tools
