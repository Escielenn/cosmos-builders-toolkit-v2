# StellarForge Aesthetic Reference Sheet

*Current as of Feb 2026 — "Aesthetic Bridge" era*

---

## Design Philosophy

**"Light emerging from void."** The interface is a ship's instrument panel: deep space-navy backgrounds, precise typographic hierarchy, teal-green accents that glow like indicator lights, and zero border-radius. Every element earns its brightness.

---

## Color Foundation (Dark Mode)

### Backgrounds — three depth layers

| Token | HSL | Hex | Use |
|---|---|---|---|
| `--sf-void` | `222 30% 5%` | `#0A0E17` | Page background, deepest layer |
| `--sf-surface` | `222 25% 9%` | `#0E1320` | Panel/card surfaces |
| `--sf-surface-elevated` | `222 20% 12%` | `#161C2B` | Elevated panels, popovers |

### Accent Spectrum — one per component

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--sf-teal` | `157 80% 42%` | `#15C17B` | **Primary** — solid fills, borders, CTA |
| `--sf-teal-bright` | `157 100% 62%` | `#3DFFCD` | Glow only — light arcs, hover states |
| `--sf-cyan` | `190 100% 50%` | `#00D4FF` | Simulators only (legacy) |
| `--sf-amber` | `43 100% 50%` | `#FFB800` | Data highlights, velocity, warnings |
| `--sf-accent-amber` | `30 100% 64%` | `#FFB347` | Nav numbers, data bursts |
| `--sf-stellar` | `220 82% 65%` | `#5B8DEF` | Wonder/creativity (writing surface caret) |
| `--sf-emerald` | `153 100% 50%` | `#00FF88` | Section headers green |
| `--sf-magenta` | `328 100% 50%` | `#FF00AA` | Sparingly — destructive accents |
| `--sf-violet` | `263 74% 63%` | `#9B5DE5` | Pro badges |
| `--sf-crimson` | `347 100% 60%` | `#FF3366` | Destructive actions |
| `--sf-azure` | `215 100% 65%` | `#4D9FFF` | Links, info accents |

### Glow Variants — `box-shadow` / pseudo-elements only

All glows are the accent color at `0.2` alpha:
```
--sf-glow-teal: 157 100% 62% / 0.2
--sf-glow-amber: 43 100% 50% / 0.2
--sf-glow-stellar: 220 82% 65% / 0.2
```

---

## Typography

### Font Stack

| Role | Family | Tailwind | Use |
|---|---|---|---|
| **Display** | MD Nichrome | `font-display` | H1 tool titles only |
| **Heading** | Jura | `font-heading` | Section headers, nav items |
| **Body** | DM Sans | `font-sans` | Everything else, **all buttons** |
| **Mono** | JetBrains Mono | `font-mono` | Results, readouts, data, numbered badges |

### 5-Tier Text Hierarchy

| Tier | Token | Value | Tailwind | Use |
|---|---|---|---|---|
| **1** | `--sf-tier-1` | `hsl(0 0% 98%)` — `#FAFAFA` | `text-tier-1` | Tool page titles, result values |
| **2** | `--sf-tier-2` | `hsl(0 0% 78%)` — `#C8C8C8` | `text-tier-2` | Body text, descriptions |
| **3** | `--sf-tier-3` | `hsla(0 0% 100% / 0.45)` | `text-tier-3` | Labels, column headers |
| **4** | `--sf-tier-4` | `hsla(0 0% 100% / 0.28)` | `text-tier-4` | Units, helper text, subtitles, chevrons |
| **5** | `--sf-tier-5` | `hsla(0 0% 100% / 0.15)` | `text-tier-5` | Citations, metadata, ghost text |

Legacy tokens still active: `text-muted-foreground` maps to `--sf-text-muted` (`hsl(212 10% 73%)`).

### Letter Spacing Scale

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `sf-title` | `0.08em` | `tracking-sf-title` | H1 Nichrome titles |
| `sf-wide` | `0.2em` | `tracking-sf-wide` | Standard uppercase headlines |
| `sf-ultra` | `0.4em` | `tracking-sf-ultra` | Hero/display text |
| Custom | `3px` | `tracking-[3px]` | CollapsibleSection headers |
| Custom | `2px` | `tracking-[2px]` | ToolIntro + inline h2 headers |
| Custom | `1.5px` | `tracking-[1.5px]` | Labels (`<Label>` component) |
| Custom | `1.2px` | inline | Instrument nav items |

### Font Weight Philosophy

Extremes only — ultralight (300) vs medium (500). No bold anywhere.

| Token | Weight | Tailwind | Use |
|---|---|---|---|
| `sf-light` | 300 | `font-sf-light` | Display/heading text |
| `sf-normal` | 400 | `font-sf-normal` | Body text |
| `sf-medium` | 500 | `font-sf-medium` | Labels, emphasis |

---

## Component Patterns

### H1 — Tool Page Title (Nichrome display)

```
font-display text-3xl md:text-4xl tracking-sf-title
```
Pattern: `<span className="font-normal">Brandname:</span> Subtitle`

### H2 — Inline Section Headers (tool intros, standalone headers)

```
font-heading text-xl font-light uppercase tracking-[2px] gradient-text
```
The `gradient-text` class applies the teal gradient via `bg-clip-text text-transparent`.

### H3 — CollapsibleSection Headers (green dividers)

```
font-heading text-sm font-light uppercase tracking-[3px] text-[hsl(var(--sf-section-green))]
```
`--sf-section-green`: `153 80% 60% / 1` — full-opacity teal-green.

Section trigger has a bottom border: `border-b border-[hsl(var(--sf-section-border))]` where `--sf-section-border` is `153 100% 45% / 0.06`.

### H4 — Meta Headers ("In Published Science Fiction")

```
font-heading text-xs font-medium uppercase tracking-sf-wide text-tier-4
```

### Labels (`<Label>` component)

```
text-[11px] font-medium uppercase tracking-[1.5px] leading-none text-tier-3
```
All form labels across the entire site are small, uppercase, tracked, and distinctly dimmer than body text. This is intentional — instrument-panel aesthetic.

### Numbered Badges (CollapsibleSection `levelNumber`)

```
w-8 h-8 rounded-sm bg-primary/[0.06] border border-primary/[0.15] text-primary font-mono text-sm
```
Hollow glow style, not filled gradient. Monospace numerals.

### Badges (glow variants)

```tsx
// Teal glow (default)
<Badge variant="glow">Label</Badge>
// bg-primary/[0.06] border-primary/[0.15] text-primary

// Amber glow
<Badge variant="glow-amber">Label</Badge>
// bg-amber-500/[0.06] border-amber-500/[0.15] text-amber-500

// Cyan glow
<Badge variant="glow-cyan">Label</Badge>
// bg-cyan-500/[0.06] border-cyan-500/[0.15] text-cyan-400
```

Base badge shape: `rounded-sm` (3px), `text-xs`, `font-semibold`.

### GlassPanel

```css
.glass-panel {
  rounded-none border backdrop-blur-xl
  background: hsl(var(--glass));      /* surface at 0.9 alpha */
  border-color: hsl(var(--glass-border)); /* white at 0.08 */
  box-shadow: var(--shadow-glass);    /* 0 8px 32px black/0.4 */
}
```
`glow` prop adds a bottom-edge teal light arc via `::before` pseudo-element.

### GlassPanel Glow (light arc)

```css
.glass-panel-glow::before {
  /* horizontal gradient line at bottom edge */
  background: linear-gradient(to right, transparent, rgba(61, 255, 205, 0.25), transparent);
}
```

### Card Hover Effect

```css
.sf-card-hover::after {
  /* bottom-edge fill bar, teal, scaleX(0) → scaleX(1) on hover */
  background: rgba(61, 255, 205, 0.6);
  transform-origin: left;
  transition: transform 0.3s ease;
}
.sf-card-hover:hover { transform: translateY(-2px); }
```
Color variants via `data-hover-color`: `stellar` (blue), `amber`.

### Bracket Panel (corner accents)

Four corner brackets (`sf-bracket-tl/tr/bl/br`) at 16px × 16px with 2px borders. Color variants: `teal`, `stellar`, `amber`, `bright`. Hover brightens to teal.

### Instrument Nav (SectionNavigation)

```css
.sf-instrument-nav-item {
  font-family: var(--sf-font-heading);  /* Jura */
  font-size: 11px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  border-left: 2px solid transparent;
  color: rgba(224, 228, 232, 0.4);      /* dim by default */
}
.sf-instrument-nav-item[data-active="true"] {
  border-left-color: #3DFFCD;
  color: #3DFFCD;
}
.sf-instrument-nav-number {
  font-family: var(--sf-font-mono);     /* JetBrains Mono */
  font-size: 9px;
  color: rgba(255, 179, 71, 0.4);      /* amber numbers */
}
```
Header: `font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground/60` — displays as `// NAVIGATION`.

---

## Layout Patterns

### Tool Page Sidebar (ToolSidebar)

Desktop (xl+): fixed right column, vertically centered.
```
fixed right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-40
```

Contents: `SectionNavigation` (inline mode) + optional readout `GlassPanel`.

Mobile: `MobileSectionNav` floating button (bottom-right) opens a `Sheet`.
```tsx
<Button className="rounded-none w-auto h-auto px-3 py-2.5 shadow-lg">
  <List className="w-4 h-4 mr-2" />
  <span className="text-[10px] tracking-[1.5px] uppercase font-heading">NAV</span>
</Button>
```

### Tool Page Content Width

```css
.sf-tool-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 32px;
}
```
Mobile: `16px 16px 24px`.

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius` / `lg` | `0px` | GlassPanel, cards, major containers |
| `md` | `4px` | Bridge cards, secondary panels |
| `sm` | `3px` | Badges, small buttons |
| `xs` | `2px` | Inputs, micro elements |

**Philosophy**: Sharp edges are core identity. Zero radius on primary containers. Micro-radius only on small interactive elements.

---

## Scrollbars

```css
/* Webkit */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(10, 14, 23, 0.5); }
::-webkit-scrollbar-thumb { background: rgba(224, 228, 232, 0.12); border-radius: 0px; }
::-webkit-scrollbar-thumb:hover { background: rgba(61, 255, 205, 0.25); }

/* Firefox */
scrollbar-width: thin;
scrollbar-color: rgba(224, 228, 232, 0.12) rgba(10, 14, 23, 0.5);
```

---

## Status Bar (HUD)

Fixed bottom bar, 24px tall, dashed top border.
```css
.sf-status-bar {
  background: hsl(var(--sf-void) / 0.95);
  border-top: 1px dashed rgba(224, 228, 232, 0.2);
  font-family: var(--sf-font-mono);
  font-size: 8px;
  letter-spacing: 0.5px;
  color: rgba(224, 228, 232, 0.3);
}
```

---

## Animation Tokens

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | `100ms` | Micro-interactions |
| `--duration-fast` | `150ms` | Button hover, focus |
| `--duration-normal` | `200ms` | Card hover, transitions |
| `--duration-smooth` | `300ms` | Panel open/close |
| `--duration-dramatic` | `500ms` | Page transitions |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard deceleration |
| `--ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot |
| `--ease-spring` | `cubic-bezier(0.5, 1.5, 0.5, 1)` | Spring-like bounce |

---

## Background Effects

### Atmosphere (main page gradient)

```css
.sf-atmosphere::before {
  background:
    radial-gradient(ellipse at 70% 20%, hsl(var(--sf-glow-teal)) 0%, transparent 50%),
    linear-gradient(180deg, hsl(var(--sf-void)) 0%, hsl(222 35% 3%) 100%);
}
```

### Light Arc Motif

Horizontal gradient line at element bottom edge — signature visual element.
```css
.sf-light-arc::after {
  background: linear-gradient(90deg, transparent, hsl(var(--sf-teal-bright)), transparent);
  height: 1px;
}
```

### Divider

```css
.sf-divider {
  border-top: 1px dashed rgba(224, 228, 232, 0.25);
  margin: 48px 0;
}
.sf-divider-data {
  /* Centered amber label on the dashed line */
  font-family: var(--sf-font-mono);
  font-size: 7px;
  letter-spacing: 1px;
  color: rgba(255, 179, 71, 0.3);
}
```

---

## Writing Surface (Rich Text Editor)

```css
.sf-writing-surface {
  background: #F5F3EF;    /* warm cream — the only light element */
  color: #1A1A2E;
  caret-color: #5B8DEF;   /* stellar blue */
  line-height: 1.7;
}
```

---

## What NOT to Do

- **No Inter** — Forbidden. DM Sans for body, Jura for headings, MD Nichrome for display.
- **No Nichrome on buttons** — All buttons use DM Sans (`font-sans`).
- **No rounded corners on panels** — GlassPanel is `rounded-none`. Always.
- **No bold text** — Use weight 300 (light) or 500 (medium). Never 700.
- **No bright body text** — Tier-2 (`#C8C8C8`) is the max brightness for running text. Only tier-1 (`#FAFAFA`) for titles and results.
- **No glow colors in solid fills** — `--sf-teal-bright` is for `box-shadow` and `::before/::after` only. Solid fills use `--sf-teal`.
- **No single muted plane** — Never put labels, units, helpers, and descriptions all at `text-muted-foreground`. Use the 5-tier hierarchy.
- **No marketing changes** — Landing pages, pricing, and marketing sections follow their own rules.
