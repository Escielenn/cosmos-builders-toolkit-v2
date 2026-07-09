# CLAUDE.md — StellarForge Development Instructions

**For Claude Code in VS Code**
*Place this file in your project root*

---

## Project Overview

**StellarForge.tools** is a science fiction worldbuilding platform for writers. The tagline is "These worlds exist in you. Waiting to be found."

### Core Philosophy

StellarForge follows the **Environmental Cascade** principle:
> Physics → Environment → Biology → Psychology → Mythology → Culture

Change something upstream, and everything downstream shifts. Tools are organized around this principle—each builds on what comes before, each output becomes input for what follows.

### Target Audience

Beginning SF writers who struggle with blank page syndrome. They want rigorous, science-based tools—not vague creative prompts or "humans in rubber suits" aliens.

### Key Differentiators

- Scientific credibility meets creative imagination
- Systematic methodology over random generation
- Privacy-first: "Your Worlds Are Yours Alone"
- Educational foundation (workshop curriculum)
- Cascade framework creates internal consistency

---

## Tech Stack

```
Frontend:        React + TypeScript + Vite
Styling:         Tailwind CSS (with custom design tokens)
Database:        Supabase (PostgreSQL)
Auth:            Supabase Auth
Hosting:         Vercel
Payments:        Stripe ($4.99/month Pro tier)
Email:           Resend (transactional), ImprovMX (forwarding)
CMS:             Sanity (blog, marketing content)
Messaging:       Knock (in-app notifications, future)
```

### File Structure Conventions

```
/src
  /components
    /ui             # Reusable UI primitives (GlassPanel, Badge, Label, etc.)
    /tools          # Tool-specific components (CollapsibleSection, QuestionSection, etc.)
    /simulators     # Simulator iframe wrappers
    /timeline       # Timeline-specific components
    /onboarding     # Field Manual, first-time hints
    /layout         # Header, Footer, FABStack
    /landing        # Marketing/homepage components
    /world          # World dashboard components
    /sharing        # Share/collaborate dialogs
  /pages
    /tools          # Tool route pages (20 files)
    /simulators     # Simulator route pages (4 files)
    /legal          # Privacy, Terms
  /integrations/supabase  # Supabase client + generated types
  /lib              # Utilities, data, calculations, PDF templates
  /hooks            # Custom React hooks
  /contexts         # React contexts (AuthContext)
```

---

## Design System

### Philosophy

> **"Light emerging from void."** The interface is a ship's instrument panel: deep space-navy backgrounds, precise typographic hierarchy, teal-green accents that glow like indicator lights, and zero border-radius. Every element earns its brightness.

The guiding principle: **the simulation is the hero, the UI is the instrument panel.**

---

### Color System

#### Background Layers (Three Depths)

```css
:root {
  /* Backgrounds — darkest to lightest */
  --sf-void: hsl(222 30% 5%);              /* #0A0E17 — Page background, deepest */
  --sf-surface: hsl(222 25% 9%);           /* #0E1320 — Panel/card surfaces */
  --sf-surface-elevated: hsl(222 20% 12%); /* #161C2B — Elevated panels, popovers */

  /* Glass panel */
  --glass: var(--sf-surface) / 0.9;
  --glass-border: hsl(0 0% 100% / 0.08);
}
```

#### Accent Spectrum

```css
:root {
  /* Primary — solid fills, borders, CTAs */
  --sf-teal: hsl(157 80% 42%);        /* #15C17B */

  /* Glow only — light arcs, hover states (NEVER solid fills) */
  --sf-teal-bright: hsl(157 100% 62%); /* #3DFFCD */

  /* Simulators only (legacy) */
  --sf-cyan: hsl(157 80% 42%);         /* RETIRED alias → teal (legacy cyan is gone, SF-II #3) */

  /* Data & highlights */
  --sf-amber: hsl(43 100% 50%);        /* #FFB800 — velocity, warnings */
  --sf-accent-amber: hsl(30 100% 64%); /* #FFB347 — nav numbers */

  /* Semantic colors */
  --sf-stellar: hsl(220 82% 65%);      /* #5B8DEF — wonder/creativity */
  --sf-emerald: hsl(153 100% 50%);     /* #00FF88 — section headers */
  --sf-violet: hsl(263 74% 63%);       /* #9B5DE5 — Pro badges */
  --sf-crimson: hsl(347 100% 60%);     /* #FF3366 — destructive actions */
  --sf-azure: hsl(215 100% 65%);       /* #4D9FFF — links, info */
  --sf-magenta: hsl(328 100% 50%);     /* #FF00AA — sparingly */
}
```

#### 5-Tier Text Hierarchy (Critical)

```css
:root {
  --sf-tier-1: hsl(0 0% 98%);              /* #FAFAFA — Titles, result values ONLY */
  --sf-tier-2: hsl(0 0% 78%);              /* #C8C8C8 — Body text, descriptions */
  --sf-tier-3: hsla(0 0% 100% / 0.45);     /* Labels, column headers */
  --sf-tier-4: hsla(0 0% 100% / 0.28);     /* Units, helper text, chevrons */
  --sf-tier-5: hsla(0 0% 100% / 0.15);     /* Citations, metadata, ghost text */
}
```

**Never** put all text at the same brightness. Use the hierarchy.

#### Glow Pattern (0.06 / 0.15 / 1.0)

```css
/* Interactive elements follow this opacity structure */
.glow-element {
  background: hsl(var(--sf-teal) / 0.06);   /* Barely visible tint */
  border: 1px solid hsl(var(--sf-teal) / 0.15);  /* Subtle edge */
  color: hsl(var(--sf-teal));               /* Full color text */
}

/* Glow effects use bright variant at 0.2 alpha */
.glow-element::after {
  box-shadow: 0 0 20px hsl(var(--sf-teal-bright) / 0.2);
}
```

---

### Typography

#### Font Stack

```css
:root {
  --sf-font-display: 'MD Nichrome', sans-serif;    /* H1 tool titles ONLY */
  --sf-font-heading: 'Jura', sans-serif;           /* Section headers, nav */
  --sf-font-sans: 'DM Sans', sans-serif;           /* Body, ALL buttons */
  --sf-font-mono: 'JetBrains Mono', monospace;     /* Data, readouts, badges */
}
```

#### Font Rules (Strict)

| Context | Font | Tailwind | Usage |
|---------|------|----------|-------|
| **MD Nichrome** | Display | `font-display` | H1 tool page titles ONLY |
| **Jura** | Headings | `font-heading` | Section headers, nav items |
| **DM Sans** | Body | `font-sans` | Everything else, **ALL BUTTONS** |
| **JetBrains Mono** | Data | `font-mono` | Results, readouts, numbered badges |

**NEVER** use MD Nichrome on buttons.
**NEVER** use Inter anywhere.
**NEVER** use bold (700) — only light (300) or medium (500).

#### Type Scale

| Element | Font | Classes | Example |
|---------|------|---------|---------|
| H1 Tool Title | MD Nichrome | `font-display text-3xl md:text-4xl tracking-sf-title` | ROGUE Simulator |
| H2 Section | Jura | `font-heading text-xl font-light uppercase tracking-[2px]` | ORBITAL PARAMETERS |
| H3 Collapsible | Jura | `font-heading text-sm font-light uppercase tracking-[3px] text-emerald` | STAR CONFIGURATION |
| H4 Meta | Jura | `font-heading text-xs font-medium uppercase tracking-sf-wide text-tier-4` | IN PUBLISHED SF |
| Body | DM Sans | `font-sans text-tier-2` | Running text |
| Labels | DM Sans | `text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3` | PLANET MASS |
| Data | JetBrains Mono | `font-mono text-tier-1` | 1.47 Earth masses |

#### Letter Spacing Scale

```css
:root {
  --tracking-sf-title: 0.08em;   /* MD Nichrome titles */
  --tracking-sf-wide: 0.2em;     /* Standard uppercase */
  --tracking-sf-ultra: 0.4em;    /* Hero display text */
}
/* Also used: tracking-[3px], tracking-[2px], tracking-[1.5px], tracking-[1.2px] */
```

#### Weight Philosophy

**Extremes only** — ultralight vs medium. No bold anywhere.

| Weight | Value | Use |
|--------|-------|-----|
| Light | 300 | Display/heading text |
| Normal | 400 | Body text |
| Medium | 500 | Labels, emphasis |

---

### Border Radius

**Sharp edges are core identity.** Zero radius on primary containers.

| Token | Value | Use |
|-------|-------|-----|
| `rounded-none` | 0px | GlassPanel, cards, major containers |
| `rounded-md` | 4px | Bridge cards, secondary panels |
| `rounded-sm` | 3px | Badges, small buttons |
| `rounded-xs` | 2px | Inputs, micro elements |

---

### Component Patterns

#### GlassPanel

```tsx
<GlassPanel glow>
  {/* Content */}
</GlassPanel>
```

```css
.glass-panel {
  background: hsl(var(--sf-surface) / 0.9);
  border: 1px solid hsl(0 0% 100% / 0.08);
  border-radius: 0;  /* ALWAYS zero */
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px hsl(0 0% 0% / 0.4);
}

/* Light arc glow (bottom edge) */
.glass-panel-glow::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(to right, transparent, hsl(157 100% 62% / 0.25), transparent);
}
```

#### Buttons

```tsx
// All buttons use DM Sans, never Nichrome
<Button>Get Started</Button>
```

```css
.btn-primary {
  background: hsl(var(--sf-teal));
  color: white;
  font-family: var(--sf-font-sans);  /* DM Sans */
  font-weight: 500;
  border-radius: 0;
  padding: 12px 24px;
  transition: all 200ms ease;
}

.btn-primary:hover {
  box-shadow: 0 0 20px hsl(var(--sf-teal-bright) / 0.2);
}
```

#### Cards with Hover Effect

```css
.sf-card {
  background: hsl(var(--sf-surface));
  border: 1px solid hsl(0 0% 100% / 0.08);
  border-radius: 0;
  position: relative;
  overflow: hidden;
}

/* Bottom edge fill bar on hover */
.sf-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(157 100% 62% / 0.6);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 300ms ease;
}

.sf-card:hover {
  transform: translateY(-2px);
}

.sf-card:hover::after {
  transform: scaleX(1);
}
```

#### Badges (Glow Variants)

```tsx
<Badge variant="glow">Default Teal</Badge>
<Badge variant="glow-amber">Amber</Badge>
<Badge variant="glow-cyan">Retired alias — renders teal</Badge>
```

```css
.badge-glow {
  background: hsl(var(--sf-teal) / 0.06);
  border: 1px solid hsl(var(--sf-teal) / 0.15);
  color: hsl(var(--sf-teal));
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
}

.badge-glow-amber {
  background: hsl(43 100% 50% / 0.06);
  border-color: hsl(43 100% 50% / 0.15);
  color: hsl(43 100% 50%);
}
```

#### Numbered Badges (CollapsibleSection)

```css
.numbered-badge {
  width: 32px;
  height: 32px;
  background: hsl(var(--sf-teal) / 0.06);
  border: 1px solid hsl(var(--sf-teal) / 0.15);
  color: hsl(var(--sf-teal));
  font-family: var(--sf-font-mono);
  font-size: 14px;
  border-radius: 3px;
}
```

#### Labels

```css
/* ALL form labels site-wide */
.label {
  font-family: var(--sf-font-sans);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--sf-tier-3);
}
```

#### Section Headers (Green Dividers)

```css
.section-header {
  font-family: var(--sf-font-heading);  /* Jura */
  font-size: 14px;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: hsl(153 80% 60%);  /* Teal-green */
  border-bottom: 1px solid hsl(153 100% 45% / 0.06);
}
```

#### Instrument Nav (SectionNavigation)

```css
.instrument-nav-item {
  font-family: var(--sf-font-heading);  /* Jura */
  font-size: 11px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  border-left: 2px solid transparent;
  color: hsl(0 0% 88% / 0.4);  /* Dim by default */
}

.instrument-nav-item[data-active="true"] {
  border-left-color: #3DFFCD;
  color: #3DFFCD;
}

.instrument-nav-number {
  font-family: var(--sf-font-mono);
  font-size: 9px;
  color: hsl(30 100% 64% / 0.4);  /* Amber numbers */
}
```

#### Form Inputs

```css
input[type="text"],
input[type="number"],
textarea {
  font-family: var(--sf-font-sans);
  font-size: 14px;
  background: hsl(0 0% 100% / 0.04);
  color: hsl(0 0% 100% / 0.8);
  border: 1px solid hsl(0 0% 100% / 0.1);
  border-radius: 2px;
  padding: 12px 16px;
}

input:focus {
  border-color: hsl(var(--sf-teal) / 0.35);
}
```

#### Scrollbars

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: hsl(222 30% 5% / 0.5); }
::-webkit-scrollbar-thumb {
  background: hsl(0 0% 88% / 0.12);
  border-radius: 0;  /* Sharp */
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(157 100% 62% / 0.25);
}
```

---

### Background Effects

#### Atmosphere Gradient

```css
.sf-atmosphere::before {
  background:
    radial-gradient(ellipse at 70% 20%, hsl(157 100% 62% / 0.2) 0%, transparent 50%),
    linear-gradient(180deg, hsl(222 30% 5%) 0%, hsl(222 35% 3%) 100%);
}
```

#### Light Arc Motif

Signature visual element — horizontal gradient line at element edges.

```css
.sf-light-arc::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, hsl(157 100% 62%), transparent);
}
```

#### Dividers

```css
.sf-divider {
  border-top: 1px dashed hsl(0 0% 88% / 0.25);
  margin: 48px 0;
}

/* Centered amber label */
.sf-divider-label {
  font-family: var(--sf-font-mono);
  font-size: 7px;
  letter-spacing: 1px;
  color: hsl(30 100% 64% / 0.3);
}
```

---

### Animation Tokens

```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-smooth: 300ms;
  --duration-dramatic: 500ms;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.5, 1.5, 0.5, 1);
}
```

---

### Layout Patterns

#### Tool Page Content

```css
.tool-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 32px;
}

@media (max-width: 640px) {
  .tool-content {
    padding: 16px 16px 24px;
  }
}
```

#### Tool Page Sidebar

Desktop (xl+): Fixed right column, vertically centered.
```css
.tool-sidebar {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}
```

Mobile: Floating button bottom-right opens a Sheet.

---

### Z-Index Stacking Order

The site has many always-on overlays. Use this stack so new chrome doesn't fight existing chrome.

| Layer | Range | Used by |
|-------|-------|---------|
| Backgrounds | `z-0` | StellarBackground, VideoBackground, DataBurstOverlay, BreathingStar (ambient) |
| In-flow content overlap | `z-[1]` | Icons / text that need to sit above their own button hover-fill |
| Default page content | `z-10` to `z-30` | `<main>` regions, page sections |
| FABStack (help button) | `z-40` | Floating help / contact menu |
| Header (fixed top) | `z-50` | Site header bar |
| Site banner | `z-50` | BetaBanner (sits inside Header context, doesn't need higher) |
| Toast / Sonner | `z-[100]` | Default Sonner toaster |
| Radix dialog overlay | `z-50` (its own context) | All dialogs/modals via Radix |
| AudioPlayer | `z-[8999]` | Persistent player bar |
| Site-critical overlays | `z-[9999]` | TextureOverlay, KonamiCode reveal |

**Rules:**
- Don't introduce new z-index values without consulting this table.
- Avoid `z-[8999]` and `z-[9999]` for new components. Those are reserved.
- New overlays should slot into one of the existing tiers (40, 50, 100).
- AudioPlayer's `bottom-6` interacts with FABStack — if both are mounted, the FABStack's `audioOffset` logic in [`FABStack.tsx`](src/components/layout/FABStack.tsx) lifts the help button above the player bar. Maintain that pattern when adding new bottom-anchored chrome.

---

### Simulator-Specific Guidelines

When building interactive canvas-based tools:

**Note (updated 2026-07-09):** Legacy cyan is **RETIRED product-wide** (SF-II settled decision #3). Simulators now use the **product teal accent** (`#15C17B`, glow `#3DFFCD`) like every other surface; only the deeper canvas (`#09090B`) and slight panel radius remain simulator-specific. CI hard-fails on any legacy-cyan literal.

#### Canvas Setup

```javascript
// Simulators use deeper black than site panels
ctx.fillStyle = '#09090B';  // Simulator canvas background
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Star field: 500 points, parallax at 0.04x camera rate
// Sizes: 0.6-1.6px, brightness: 0.05-0.35 opacity
```

#### Simulator Color Palette

```css
/* Simulator-specific (teal accent since SF-II; cyan retired) */
--sim-bg: #09090B;
--sim-panel: rgba(15, 15, 16, 0.92);
--sim-accent: #15C17B;           /* Product teal for interactive elements */
--sim-accent-glow: rgba(61, 255, 205, 0.2);

/* Status colors remain consistent */
--sim-warning: #FFA500;
--sim-success: #2ECC71;
--sim-danger: #E74C3C;
--sim-stellar: #FFD43B;
```

#### Panel Placement

```
Top-left:      Tool title + status badge
Left side:     Control panel (220-260px, scrollable)
Top-right:     Data readout panel (240-260px)
Bottom-right:  Zoom / viewport info
Bottom-center: Timeline scrubber (if time-based)
```

#### Simulator Panels

```css
/* Simulator panels use the legacy system */
.sim-panel {
  background: rgba(15, 15, 16, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border-radius: 8px;  /* Exception: simulator panels keep slight radius */
  padding: 14px 18px;
}
```

#### Status Badges

```css
/* Badge states use the product teal in simulators */
.sim-badge-waiting {
  background: rgba(21, 193, 123, 0.03);
  border: 1px solid rgba(21, 193, 123, 0.08);
  color: rgba(21, 193, 123, 0.4);
}

.sim-badge-active {
  background: rgba(21, 193, 123, 0.08);
  border: 1px solid rgba(21, 193, 123, 0.2);
  color: #15C17B;
}

.sim-badge-danger {
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: #E74C3C;
  animation: pulse 1.5s infinite;
}
```

#### Transport Controls (Time-Based Sims)

```
[ Rewind ] [ Step ] [ Pause / Play ] [ Step ] [ Reset ]
```

- Rewind: Hold-to-scrub interaction
- Step: Single physics frame advance
- Play/Pause: Spacebar shortcut
- Reset: Returns to initial state

#### Camera Smoothing

```javascript
// Use delta-time exponential interpolation (framerate-independent)
const smoothing = 1 - Math.pow(0.0001, frameDt / 1000);
cam.x += (targetCam.x - cam.x) * smoothing;
cam.y += (targetCam.y - cam.y) * smoothing;
cam.zoom += (targetCam.zoom - cam.zoom) * smoothing;
```

---

### Worksheet Guidelines

When building form-based worksheet tools:

#### Section Structure

```tsx
<WorksheetSection title="Environmental Pressures">
  <SectionDescription>
    What survival challenges does this world present?
  </SectionDescription>

  <FormField label="Primary Challenge" required>
    <TextArea placeholder="e.g., extreme gravity, radiation, temperature..." />
  </FormField>

  <FormField label="Secondary Challenges">
    <CheckboxGroup options={challengeOptions} />
  </FormField>
</WorksheetSection>
```

#### Progress Indication

Show users where they are in multi-section worksheets:

```tsx
<WorksheetProgress
  sections={['Environment', 'Body Plan', 'Senses', 'Metabolism', 'Social']}
  currentSection={2}
  completedSections={[0, 1]}
/>
```

#### Export Options

All worksheets should support:
- PDF export
- Word (.docx) export
- Notion export
- Copy to clipboard (markdown)

---

## Code Conventions

### TypeScript

```typescript
// Use explicit types, avoid `any`
interface Planet {
  name: string;
  mass: number;        // Earth masses
  radius: number;      // Earth radii
  gravity: number;     // Surface g
  atmosphere: AtmosphereConfig;
}

// Use const assertions for enums
const COMPLEXITY_LEVELS = ['entry', 'intermediate', 'advanced'] as const;
type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];

// Prefer interfaces for objects, types for unions
type ToolCategory = 'stars-systems' | 'worlds' | 'life' | 'civilizations' | 'mythology' | 'integration';
```

### React Components

```tsx
// Prefer function components with explicit return types
interface ToolCardProps {
  name: string;
  description: string;
  category: ToolCategory;
  complexity: ComplexityLevel;
  isPro?: boolean;
}

export function ToolCard({
  name,
  description,
  category,
  complexity,
  isPro = false
}: ToolCardProps): JSX.Element {
  return (
    <div className="card">
      {/* ... */}
    </div>
  );
}
```

### Naming Conventions

```
Components:     PascalCase     ToolCard.tsx, WorksheetSection.tsx
Hooks:          camelCase      useGravityCalculator.ts, useWorldData.ts
Utilities:      camelCase      calculateSurfaceGravity.ts, formatOrbitalPeriod.ts
Constants:      SCREAMING_CASE MAX_PLANET_MASS, DEFAULT_STAR_TYPE
CSS classes:    kebab-case     .tool-card, .section-header
```

### File Organization

```typescript
// Component file structure
// ToolCard.tsx

// 1. Imports (external, then internal)
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ProBadge } from '@/components/ui/ProBadge';
import type { ToolCategory } from '@/types';

// 2. Types/Interfaces
interface ToolCardProps {
  // ...
}

// 3. Constants
const CATEGORY_COLORS: Record<ToolCategory, string> = {
  // ...
};

// 4. Component
export function ToolCard(props: ToolCardProps): JSX.Element {
  // ...
}

// 5. Sub-components (if small and tightly coupled)
function CardIcon({ category }: { category: ToolCategory }) {
  // ...
}
```

---

## Do's and Don'ts

### DO

- Use the exact color values from the design system
- Follow the 0.06/0.15/1.0 opacity pattern for glow elements
- Use the 5-tier text hierarchy (never same brightness everywhere)
- Use MD Nichrome for H1 tool titles ONLY
- Use Jura for section headers and nav
- Use DM Sans for body text AND all buttons
- Use JetBrains Mono for data, readouts, numbered badges
- Use zero border-radius on GlassPanel and major containers
- Include hover states with bottom-edge fill bar animation
- Make all worksheets exportable
- Show cascade relationships between tools
- Include loading states for async operations
- Support keyboard navigation and screen readers
- Test on mobile viewports

### DON'T

- **No Inter** — Forbidden anywhere. Use DM Sans, Jura, or MD Nichrome.
- **No Nichrome on buttons** — All buttons use DM Sans (`font-sans`)
- **No rounded corners on panels** — GlassPanel is `rounded-none`. Always.
- **No bold text** — Use weight 300 (light) or 500 (medium). Never 700.
- **No bright body text** — Tier-2 (#C8C8C8) max for running text. Tier-1 (#FAFAFA) for titles/results only.
- **No glow colors in solid fills** — `--sf-teal-bright` is for box-shadow and ::before/::after only
- **No single muted plane** — Never put labels, units, and descriptions all at same brightness
- Use colors outside the defined palette
- Forget the backdrop-filter blur on floating panels
- Use browser-default scrollbars
- Make interactive elements smaller than 44px touch target
- Use "Generative AI" terminology—use "AI-assisted" or "smart tools"

---

## Common Tasks

### Creating a New Calculator

```tsx
// 1. Create the hook for calculation logic
// /src/hooks/useNewCalculator.ts

export function useNewCalculator(inputs: CalculatorInputs) {
  const [results, setResults] = useState<CalculatorResults | null>(null);

  const calculate = useCallback(() => {
    // Physics/math logic here
    const computed = /* ... */;
    setResults(computed);
  }, [inputs]);

  return { results, calculate };
}

// 2. Create the UI component
// /src/components/tools/NewCalculator.tsx

export function NewCalculator(): JSX.Element {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const { results, calculate } = useNewCalculator(inputs);

  return (
    <ToolLayout title="New Calculator" category="worlds">
      {/* H1 uses MD Nichrome */}
      <h1 className="font-display text-3xl md:text-4xl tracking-sf-title text-tier-1">
        NEW CALCULATOR
      </h1>

      <GlassPanel glow>
        <ControlPanel>
          {/* Labels use DM Sans, 11px, uppercase, tier-3 */}
          <Label>Planet Mass</Label>
          <Input type="number" value={inputs.mass} onChange={...} />
        </ControlPanel>
      </GlassPanel>

      <GlassPanel>
        <ResultsPanel>
          {/* Results use JetBrains Mono, tier-1 */}
          <span className="font-mono text-tier-1">{results.gravity}</span>
          <span className="text-tier-4 text-xs">Earth gravities</span>
        </ResultsPanel>
      </GlassPanel>
    </ToolLayout>
  );
}
```

### Creating a New Worksheet

```tsx
// /src/components/worksheets/NewWorksheet.tsx

export function NewWorksheet(): JSX.Element {
  const { form, updateField, exportAs } = useWorksheet('new-worksheet');

  return (
    <WorksheetLayout
      title="New Worksheet"
      category="life"
      onExport={exportAs}
    >
      {/* Section headers use Jura, green, tracked */}
      <CollapsibleSection
        title="ENVIRONMENTAL PRESSURES"
        levelNumber={1}
      >
        {/* All labels: 11px, uppercase, tracking-[1.5px], tier-3 */}
        <FormField label="Primary Challenge" required>
          <TextArea
            value={form.fieldOne}
            onChange={(v) => updateField('fieldOne', v)}
            placeholder="e.g., extreme gravity, radiation, temperature..."
            className="rounded-xs"  /* 2px radius on inputs */
          />
        </FormField>
      </CollapsibleSection>

      {/* More sections */}
    </WorksheetLayout>
  );
}
```

### Creating a New Simulator

Follow SIMULATOR_AESTHETIC.md for the complete specification. Key differences from site-wide styles:

```tsx
// /src/components/tools/NewSimulator.tsx

export function NewSimulator(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, controls } = useSimulation();

  // Animation loop with delta-time
  useAnimationFrame((dt) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    // Simulators use #09090B (darker than site --sf-void)
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    drawStarField(ctx, camera, dt);
    drawSimulation(ctx, state, camera);
  });

  return (
    <SimulatorLayout>
      {/* Simulator titles still use display font */}
      <TitleBlock
        name="NEW SIMULATOR"
        status={state.status}
      />

      <Canvas ref={canvasRef} />

      {/* Simulator panels keep slight border-radius; accent is product teal */}
      <ControlPanel className="rounded-lg">
        {/* Sliders, buttons use the product teal accent */}
      </ControlPanel>

      <DataPanel className="rounded-lg">
        {/* Readouts in JetBrains Mono */}
      </DataPanel>

      {state.hasTime && (
        <TransportControls
          isPlaying={state.isPlaying}
          onPlay={controls.play}
          onPause={controls.pause}
          onReset={controls.reset}
        />
      )}
    </SimulatorLayout>
  );
}
```

**Key Simulator vs Site-Wide Differences:**

| Aspect | Site-Wide | Simulators |
|--------|-----------|------------|
| Primary accent | Teal `#15C17B` | Teal `#15C17B` (cyan retired) |
| Glow color | `#3DFFCD` | `#3DFFCD` at 0.2 alpha |
| Background | `#0A0E17` (void) | `#09090B` (deeper) |
| Panel radius | `rounded-none` | `rounded-lg` (8px) |
| Panel background | `--sf-surface` at 0.9 | `rgba(15,15,16,0.92)` |

---

## Supabase Patterns

### Database Schema Conventions

```sql
-- Tables use snake_case
CREATE TABLE user_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_worlds ENABLE ROW LEVEL SECURITY;

-- Policies follow pattern: action_table_condition
CREATE POLICY select_own_worlds ON user_worlds
  FOR SELECT USING (auth.uid() = user_id);
```

### Client Usage

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Typed queries
const { data: worlds } = await supabase
  .from('user_worlds')
  .select('*')
  .eq('user_id', userId);
```

---

## Accessibility Requirements

- All interactive elements must have 44px minimum touch target
- Color contrast must meet WCAG AA (4.5:1 for text)
- All images need alt text
- Forms need proper labels and error messages
- Support keyboard navigation (Tab, Enter, Escape)
- Use semantic HTML elements
- Include skip links for keyboard users
- Test with screen readers

---

## Testing Checklist

Before committing:

- [ ] Component renders without errors
- [ ] TypeScript compiles with no errors
- [ ] Matches design system colors/typography
- [ ] Hover/focus states work correctly
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Keyboard navigable
- [ ] Loading states for async operations
- [ ] Error states handled gracefully
- [ ] Export functions work (if worksheet)
- [ ] Performance acceptable (no jank on interactions)

---

## Quick Reference: Tool Categories

| Category | Accent | Icon Style | Cascade Position |
|----------|--------|------------|------------------|
| Stars & Systems | Amber `#FFB800` | Star, orbit rings | Physics |
| Worlds | Azure `#4D9FFF` | Planet, globe | Environment |
| Life | Emerald `#00FF88` | DNA, organism | Biology |
| Civilizations | Violet `#9B5DE5` | Buildings, people | Culture |
| Mythology | Stellar `#5B8DEF` | Temple, symbol | Mythology |
| Integration | Teal `#15C17B` | Links, document | Meta |

---

## Quick Reference: Design Tokens

```css
/* Backgrounds */
--sf-void: #0A0E17;           /* Page background */
--sf-surface: #0E1320;        /* Panel surfaces */
--sf-surface-elevated: #161C2B; /* Popovers */

/* Primary Accent */
--sf-teal: #15C17B;           /* Solid fills, CTAs */
--sf-teal-bright: #3DFFCD;    /* Glow only (never solid) */

/* Text Tiers */
--sf-tier-1: #FAFAFA;         /* Titles, results only */
--sf-tier-2: #C8C8C8;         /* Body text */
--sf-tier-3: rgba(255,255,255,0.45); /* Labels */
--sf-tier-4: rgba(255,255,255,0.28); /* Units, helpers */
--sf-tier-5: rgba(255,255,255,0.15); /* Ghost text */

/* Fonts */
--sf-font-display: 'MD Nichrome';   /* H1 only */
--sf-font-heading: 'Jura';          /* Section headers */
--sf-font-sans: 'DM Sans';          /* Body, buttons */
--sf-font-mono: 'JetBrains Mono';   /* Data */

/* Glow Pattern */
background: hsl(accent / 0.06);
border: 1px solid hsl(accent / 0.15);
color: hsl(accent);

/* Border Radius */
Panels: 0px (rounded-none)
Secondary: 4px (rounded-md)
Badges: 3px (rounded-sm)
Inputs: 2px (rounded-xs)
```

---

## Environment Variables

```env
# .env.local

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend
RESEND_API_KEY=re_xxxxx

# Sanity
VITE_SANITY_PROJECT_ID=xxxxx
VITE_SANITY_DATASET=production
SANITY_API_TOKEN=xxxxx

# Sentry (optional)
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## Error Monitoring (Sentry)

Sentry is wired in via [src/lib/sentry.ts](src/lib/sentry.ts), initialized from [src/main.tsx](src/main.tsx) before App renders. The integration is **DSN-gated**: when `VITE_SENTRY_DSN` is unset (local dev, contributor clones), `initSentry()` returns early and every subsequent Sentry call becomes a no-op. Set the env var in Vercel for preview/production to turn it on.

### What gets reported

- Anything caught by [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) (the SYSTEM FAULT screen) is also sent to Sentry with the React component stack as context.
- Unhandled promise rejections and uncaught exceptions in any browser context.
- Performance traces at 10% sample rate in production, 100% in dev/preview.

### What's filtered out (in `ignoreErrors`)

Update the list in [src/lib/sentry.ts](src/lib/sentry.ts) when a non-actionable pattern shows up in the inbox.

- `Failed to fetch dynamically imported module` / `Importing a module script failed` / `error loading dynamically imported module` — already auto-recovered by [src/lib/preload-error-recovery.ts](src/lib/preload-error-recovery.ts).
- `ResizeObserver loop limit exceeded` / `ResizeObserver loop completed with undelivered notifications` — browser scheduling noise, not user-impacting.
- `AbortError` / `The user aborted a request` — expected when users navigate away mid-fetch.
- `NetworkError when attempting to fetch resource` / `Load failed` — Tanstack Query already retries these; only the unrecovered ones matter, and those get re-raised under different messages.

### What's NOT yet wired

- **Source-maps upload** (readable stack traces) is a follow-up. Requires a Sentry auth token (server-side, build-time only) and the `@sentry/vite-plugin`. Until that's added, Sentry sees minified function names like `Ft` and `Bt` instead of `PlanetaryProfile`.
- **Session Replay** is intentionally off. Heavy on bandwidth and stylistically too "session recorder" for early access. Revisit if a bug is reproducible only via interaction recording.
- **User identification** (`Sentry.setUser`) is not called automatically — events are anonymous by default. Add a `setUser({ id })` call from `AuthContext` when the Clerk migration lands and we want per-user error tracking.

---

*These worlds exist in you. Waiting to be found.*

(c) 2025-2026 Jason D. Batt, Ph.D. - StellarForge.tools
