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
    /tools          # Tool route pages (21 files)
    /simulators     # Simulator route pages (5 simulators, each with a Science page)
    /legal          # Privacy, Terms
  /integrations/supabase  # Supabase client + generated types
  /lib              # Utilities, data, calculations, PDF templates
  /hooks            # Custom React hooks
  /contexts         # React contexts (AuthContext)
```

---

## Design System

> **Governing rules live lower in this file.** The "Design system" and
> "Legibility — non-negotiable" sections under THE PRIME LAW, and
> `docs/stellarforge/10-LEGIBILITY.md`, win any disagreement with this
> section. Colour, type and line values come from the GENERATED files
> `src/styles/tokens.css`, `src/styles/themes.css` and `tailwind.config.ts`
> (produced by `design/derive.py`, `design/emit.py`, `design/themes.py`).
> Never hand-edit them and never copy a hex value out of them into a
> component. The values quoted below are the default Void·Teal theme, for
> orientation only.

### Philosophy

> **"Light emerging from void."** The interface is a ship's instrument panel: deep space-navy backgrounds, precise typographic hierarchy, accents that glow like indicator lights, and zero border-radius. Every element earns its brightness.

The guiding principle: **the simulation is the hero, the UI is the instrument panel.**

---

### Color System

#### Planes (three, never four)

| Token | Tailwind | Default | Use |
|-------|----------|---------|-----|
| `--sf-void` | `bg-sf-void` | `#0A0E17` | Page background |
| `--sf-surface` | `bg-sf-surface` | `#1B2334` | Panels, cards |
| `--sf-surface-elevated` | `bg-sf-surface-elevated` | `#273249` | Popovers, modals |
| `--sf-scrim` | — | `rgba(5,7,12,0.72)` | Behind modals only |

Each plane clears 1.22:1 on the one below, so a panel edge reads before any border is drawn.

#### Accents: role vs meaning

- **`sf-primary` is a role.** Buttons, focus, selection, active nav and links use `sf-primary` / `sf-primary-text` / `sf-primary-bright` / `sf-on-primary`. The user chooses its hue (60 themes, `design/themes.py`). It defaults to teal.
- **Named hues are meanings.** `sf-teal`, `sf-amber`, `sf-stellar`, `sf-emerald`, `sf-violet`, `sf-crimson`, `sf-azure`, `sf-magenta` carry cascade-layer or status meaning and never move. Never put a role on a named hue.
- **Two stops per accent.** `--sf-X` for fills, borders, icons and large text. `--sf-X-text` for any accent-coloured text at body size. `--sf-on-X` for a label on a filled `--sf-X`.
- **`*-bright` is glow only** (`sf-primary-bright`, `sf-teal-bright`): box-shadow, light arcs, hover fills on `::before`/`::after`. Never a solid surface fill.
- **`sf-cyan` is a retired alias** that resolves to teal. Legacy cyan `#00D4FF` is banned (SF-II settled decision #3, CI hard-fails on it). Do not use `sf-cyan` in new code.

#### Text hierarchy (four tiers)

| Tier | Tailwind | Default | Use |
|------|----------|---------|-----|
| t1 | `text-t1` | `#FAFAFA` | Titles, result values, body where emphasis is earned |
| t2 | `text-t2` | `#C9CDD3` | Body copy |
| t3 | `text-t3` | `#A7AAB0` | Secondary text, captions, labels |
| t4 | `text-t4` | `#9799A0` | Micro labels, eyebrows, units, helper text |

`t5` is retired; see Legibility below. **Never** put all text at the same tier.

#### Lines

Solid `sf-line-*` tokens only (`sf-line-hairline`, `sf-line`, `sf-line-interactive`, `sf-line-emphasis`). The old alpha borders (`hsl(0 0% 100% / 0.08)`, the `0.15` glow border) are banned; see Legibility below for which line goes where.

#### Glow pattern

Interactive accent elements keep the old shape with solid edges:

```tsx
// Tint + solid edge + accent text. The tint is fill, not a border, so
// alpha is acceptable there; the border is always a solid token.
<span className="bg-sf-primary/[0.06] border border-sf-primary text-sf-primary-text" />

// Glow is decoration, never the only signal of a state.
<div className="hover:shadow-sf-glow-teal" />   // follows the theme's primary
```

---

### Typography

#### Font Stack

| Font | Tailwind | Usage |
|------|----------|-------|
| **MD Nichrome** | `font-display` | H1 tool page titles ONLY |
| **Jura** | `font-heading` | Section headers, eyebrows, nav |
| **DM Sans** | `font-sans` | Body, labels, **ALL BUTTONS** |
| **JetBrains Mono** | `font-mono` | Numbers, coordinates, IDs, timestamps. Never body copy. |

Four interface fonts, plus **Lora** (`font-serif`, italic) as the writer voice. Lora belongs to the writing surfaces (Studio, Write, Codex, Chronicle, Corkboard, shelves) and to the marketing "Studio meld" accents (a hero phrase, a lead-in, the tagline). It never appears on instrument or ops chrome (tool pages, simulators' controls, settings) or on buttons. **NEVER** use MD Nichrome on buttons. **NEVER** use Inter. Space Grotesk is retired (CI hard-fails on it). *(Decision 2026-10-17.)*

#### Type Scale

Use the generated sizes in `tailwind.config.ts`:

| Element | Classes |
|---------|---------|
| H1 tool title | `font-display text-sf-h1 tracking-title text-t1` |
| H2 section | `font-heading text-sf-h2 text-t1` |
| H3 | `font-heading text-sf-h3 text-t1` |
| Eyebrow / section label | `font-heading text-sf-eyebrow uppercase text-t4` (12px, 0.12em) |
| Body | `font-sans text-sf-body text-t2` (16px), bounded by `.sf-measure` |
| Studio prose | `text-sf-prose` (18px) |
| Data readout | `font-mono text-t1`; mono labels use `text-sf-mono` (12px, 0.10em) |

Nothing readable is smaller than 12px, and only 12px-and-up text is tracked. Letter-spacing tokens: `tracking-title` 0.06em, `tracking-wide` 0.12em, `tracking-ultra` 0.24em (lockups at 24px+ only).

#### Weight

Never 700/bold. Display and headings sit at 300 or 400, body at 400, labels and emphasis at 500. The one heavier weight in the system is the generated `text-sf-eyebrow` at 600, which compensates for its 12px size; do not use 600 anywhere else.

---

### Border Radius

**Zero radius everywhere** (`rounded-none`). One documented exception:

- **Tag**: `rounded-sf-tag` (2px).

`rounded-md`/`rounded-sm`/`rounded-xs` still exist in `tailwind.config.ts` only because unmigrated shadcn primitives use them. Do not use them in new code.

---

### Component Patterns

Use the primitives in `src/components/ui/` rather than restyling raw elements.

#### GlassPanel

```tsx
<GlassPanel glow>{/* Content */}</GlassPanel>
<GlassPanel layer="elevated" bracket>{/* Focal panel */}</GlassPanel>
```

`.glass-panel` (in `src/index.css`) is `rounded-none`, `border-color: var(--sf-line)`, with backdrop blur. `glow` adds the bottom light arc in `sf-primary-bright`. `bracket` adds corner brackets and is for focal panels only (one focal moment per screen).

#### Buttons

```tsx
<Button variant="sf-primary">Get Started</Button>  // filled: bg-sf-primary text-sf-on-primary
<Button variant="sf-ghost">Cancel</Button>         // outline: border-sf-line-interactive
```

DM Sans, weight 500, `rounded-none`, `min-h-hit`. Hover may add `shadow-sf-glow-teal`; focus uses the global `:focus-visible` ring.

#### Cards with Hover Effect

`.sf-card-hover` (or `<GlassPanel hover>`): a 2px bottom-edge fill bar in `sf-primary-bright` that scales in from the left on hover, with a `translateY(-2px)` lift. Card edges use `sf-line`; hover may raise them to `sf-line-emphasis`.

#### Badges

`<Badge variant="glow">` and `<Badge variant="glow-amber">` follow the glow pattern above. `glow-cyan` is a retired alias that renders teal; do not use it in new code. Badge text is 12px minimum, weight 500.

#### Numbered Badges (CollapsibleSection)

32×32, `font-mono`, glow pattern in `sf-primary`, zero radius.

#### Labels

All form labels use `<Label>`: DM Sans, 12px, weight 500, uppercase, `text-t3`.

#### Section Headers

Jura, uppercase, `text-sf-eyebrow`, with a `sf-line-hairline` rule beneath.

#### Instrument Nav (SectionNavigation)

`.sf-instrument-nav-item`: Jura, 12px, uppercase, 2px left border that turns `sf-primary-bright` when `data-active="true"`. Numbers in `font-mono`, 12px.

#### Form Inputs

Defaults come from `tokens.css`: `bg-sf-surface`, solid `sf-line-interactive` border (`sf-line-emphasis` on hover), `text-t1`, placeholders at `t3`, 16px type (iOS zooms below 16px), `min-h-hit`, zero radius. Disabled uses the `sf-disabled-*` tokens.

#### Scrollbars

Defined in `tokens.css` (`--sb-track`, `--sb-thumb`, `--sb-thumb-hover`, 10px wide, solid colours). Every scrollable container gets `sf-sb`. Scrollbars never hide.

---

### Background Effects

- **Atmosphere** (`.sf-atmosphere`): fixed radial glow over a void gradient. Hidden when the user picks a custom, gradient or video background.
- **Light arc** (`.sf-light-arc`, `.sf-panel-glow`): 1px horizontal gradient at an element's bottom edge, in the primary/teal bright stop. The signature motif. Decoration only.
- **Divider** (`.sf-divider`): 1px dashed `sf-line-hairline`, 48px vertical margin. Optional centred mono label (`.sf-divider-data`) at 12px.
- Every ambient layer multiplies `var(--sf-ambient)`. Text over video or imagery gets `.sf-scrim`.

---

### Animation Tokens

Motion runs 120–280ms. No springs, no overshoot, no reveals over 300ms outside ambient telemetry.

| Tailwind | Value |
|----------|-------|
| `duration-fast` | 120ms |
| `duration-base` | 180ms |
| `duration-slow` | 280ms |
| `duration-ambient` | 2400ms (ambient telemetry only) |
| `ease-sf-out` | `cubic-bezier(0.2, 0, 0, 1)` |
| `ease-sf-inout` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `ease-sf-snap` | `cubic-bezier(0.6, 0, 0.1, 1)` |

Use `transition-sf` for the property list. The legacy `--duration-*` and `--ease-out-back` / `--ease-spring` variables in `src/index.css` are not for new code. `prefers-reduced-motion` is handled globally in `tokens.css`.

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

Simulators follow the site-wide token rules (solid `sf-line-*` borders, four text tiers, `sf-primary` for interactive state, 120–280ms motion). Only one thing is simulator-specific: the deeper canvas (`#09090B`). Simulator panels are square like everything else (decision 2026-10-17: every simulator already shipped square, so the old `rounded-lg` exception was retired rather than applied). Legacy cyan `#00D4FF` is retired product-wide (SF-II settled decision #3); CI hard-fails on it.

#### Canvas Setup

```typescript
import { tokens } from '@/styles/tokens';

// Simulators use a deeper black than the site void
ctx.fillStyle = tokens.surface.simCanvas;  // #09090B
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Star field: 500 points, parallax at 0.04x camera rate
// Sizes: 0.6-1.6px, brightness: 0.05-0.35 opacity
```

#### Simulator Colors

No `--sim-*` CSS variables exist and none should be added. DOM chrome uses the Tailwind tokens (`sf-primary`, `sf-line-*`, `t1`–`t4`, `sf-crimson` / `sf-amber` for status). Canvas and three.js draw loops, which cannot read CSS variables, import hex from `src/styles/tokens.ts` (`tokens.surface.simCanvas`, `tokens.surface.simPanel`, `tokens.sim.*`, `tokens.status.*`). `tokens.ts` is a hand-kept mirror of the default Void·Teal theme (synced 2026-10-17); it does not follow the user's theme, so prefer `getToken()` (reads the live CSS variable) where you can. Data palettes (spectral classes, albedos) are not theme colours and belong in `src/lib/palettes/`. The old `#FFA500` / `#2ECC71` / `#E74C3C` / `#FFD43B` status hexes are legacy; do not add new uses.

#### Panel Placement

```
Top-left:      Tool title + status badge
Left side:     Control panel (220-260px, scrollable, sf-sb)
Top-right:     Data readout panel (240-260px)
Bottom-right:  Zoom / viewport info
Bottom-center: Timeline scrubber (if time-based)
```

#### Simulator Panels

```tsx
<div className="rounded-none border border-sf-line bg-sf-surface/90 backdrop-blur-sf-panel px-[18px] py-[14px]">
  {/* square, like every other panel */}
</div>
```

#### Status Badges

States are distinguished by colour **and** text or icon, never colour alone, and never by opacity:

- **Waiting**: `border-sf-line-interactive text-t3`
- **Active**: `bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text`
- **Danger**: `bg-sf-crimson/[0.06] border-sf-crimson text-sf-crimson-text`, with an icon or `//` prefix. `animate-sf-pulse` is allowed.

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

- Use the generated tokens (`tokens.css` / `tailwind.config.ts`), never hex
- Use `sf-primary` for roles (buttons, focus, selection, active nav, links) and named hues for meanings
- Follow the glow pattern: tint fill, solid token border, accent `-text` colour
- Use the four text tiers `t1`–`t4` (never same brightness everywhere)
- Use MD Nichrome for H1 tool titles ONLY
- Use Jura for section headers and nav
- Use DM Sans for body text AND all buttons
- Use JetBrains Mono for data, readouts, numbered badges
- Use zero border-radius everywhere (one exception: Tag 2px)
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
- **No bold text** — Never 700. 300/400/500 only; 600 is reserved for the generated `text-sf-eyebrow`.
- **No faint body text** — Running text is `text-t1` or `text-t2`, never `text-t3`. See Legibility below.
- **No glow colors in solid fills** — `*-bright` stops are for box-shadow and ::before/::after only
- **No single muted plane** — Never put labels, units, and descriptions all at same brightness
- **No alpha borders, no opacity for states, no `t5`, no tracking under 12px** — see Legibility below
- Use colors outside the defined palette
- Forget the backdrop-filter blur on floating panels
- Use browser-default scrollbars (every scroll container gets `sf-sb`)
- Make interactive elements smaller than 44px touch target (`min-h-hit`)
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
      <h1 className="font-display text-sf-h1 tracking-title text-t1">
        NEW CALCULATOR
      </h1>

      <GlassPanel glow>
        <ControlPanel>
          {/* <Label>: DM Sans, 12px, 500, uppercase, t3 */}
          <Label>Planet Mass</Label>
          <Input type="number" value={inputs.mass} onChange={...} />
        </ControlPanel>
      </GlassPanel>

      <GlassPanel>
        <ResultsPanel>
          {/* Results use JetBrains Mono, t1; units t4 */}
          <span className="font-mono text-t1">{results.gravity}</span>
          <span className="text-t4 text-xs">Earth gravities</span>
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
      {/* Section headers use Jura, uppercase, text-sf-eyebrow */}
      <CollapsibleSection
        title="ENVIRONMENTAL PRESSURES"
        levelNumber={1}
      >
        {/* All labels: <Label>, 12px, uppercase, t3 */}
        <FormField label="Primary Challenge" required>
          <TextArea
            value={form.fieldOne}
            onChange={(v) => updateField('fieldOne', v)}
            placeholder="e.g., extreme gravity, radiation, temperature..."
            /* Inputs are zero-radius; defaults come from tokens.css */
          />
        </FormField>
      </CollapsibleSection>

      {/* More sections */}
    </WorksheetLayout>
  );
}
```

### Creating a New Simulator

Read `docs/stellarforge/11-SIMULATOR-CONSTELLATION.md` and the Simulator-Specific Guidelines above. (`simulators/Rogue/SIMULATOR_AESTHETIC.md` predates the cyan retirement and the solved palette; do not take colour values from it.) Key differences from site-wide styles:

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
    ctx.fillStyle = tokens.surface.simCanvas;
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

      {/* Square chrome; interactive state uses sf-primary */}
      <ControlPanel>
        {/* Sliders, buttons use sf-primary like every other surface */}
      </ControlPanel>

      <DataPanel>
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
| Primary accent | `sf-primary` | `sf-primary` (cyan retired) |
| Glow | `sf-primary-bright` | `sf-primary-bright` |
| Background | `sf-void` | `#09090B` canvas (`tokens.surface.simCanvas`) |
| Panel radius | `rounded-none` | `rounded-none` |
| Panel border | `sf-line` | `sf-line` |

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

Defaults for the Void·Teal theme. Source of truth: `src/styles/tokens.css` (generated). Use the Tailwind names, never the hex.

```css
/* Planes: three, never four */
--sf-void: #0A0E17;             /* bg-sf-void */
--sf-surface: #1B2334;          /* bg-sf-surface */
--sf-surface-elevated: #273249; /* bg-sf-surface-elevated */

/* Primary role (user-chosen; defaults to teal) */
--sf-primary / --sf-primary-text / --sf-primary-bright / --sf-on-primary

/* Text tiers (t5 retired) */
--t1: #FAFAFA;   /* text-t1  headings, results */
--t2: #C9CDD3;   /* text-t2  body */
--t3: #A7AAB0;   /* text-t3  secondary, labels */
--t4: #9799A0;   /* text-t4  micro labels, units */

/* Lines: solid, never alpha */
--sf-line-hairline / --sf-line / --sf-line-interactive / --sf-line-emphasis

/* States: colour, never opacity */
--sf-disabled-bg / --sf-disabled-line / --sf-disabled-text / --sf-focus

/* Fonts */
font-display  MD Nichrome     H1 only
font-heading  Jura            section headers, eyebrows, nav
font-sans     DM Sans         body, buttons
font-mono     JetBrains Mono  data

/* Radius */
rounded-none everywhere · rounded-sf-tag (2px) Tag

/* Motion */
duration-fast 120ms · duration-base 180ms · duration-slow 280ms · ease-sf-out
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
SENTRY_AUTH_TOKEN=xxxxx   # build-time only; enables source-map upload
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

### Source maps

Source-map upload is wired in [vite.config.ts](vite.config.ts) via `@sentry/vite-plugin`, and runs **only when `SENTRY_AUTH_TOKEN` is set in the build environment** (build-time only, never `VITE_`-prefixed). With the token, the build emits `hidden` source maps, uploads them under the release `stellarforge@<APP_VERSION>` (matching `src/lib/sentry.ts`), deletes the `.map` files from `dist/`, and fails the build if the upload fails. Without the token, the plugin is not registered and no source maps are generated, so Sentry sees minified names like `Ft` instead of `PlanetaryProfile`.

### What's NOT yet wired

- **Session Replay** is intentionally off. Heavy on bandwidth and stylistically too "session recorder" for early access. Revisit if a bug is reproducible only via interaction recording.
- **User identification** (`Sentry.setUser`) is not called automatically — events are anonymous by default. `src/lib/sentry.ts` exports `setUser`; call it with `{ id }` from `AuthContext` (Supabase Auth) if per-user error tracking is wanted. The Clerk migration was never started and is cancelled (see `docs/STACK-ARCHITECTURE.md`).

---

*These worlds exist in you. Waiting to be found.*

(c) 2025-2026 Jason D. Batt, Ph.D. - StellarForge.tools


<!--
  StellarForge — appended by the StellarForge System Package v2 (August 2026).
  Governs every Claude Code session in this repo.
  Source docs: docs/stellarforge/ · Palette: design/ (generated)
  Placement + session recipes: docs/stellarforge/START-HERE.md
-->

## THE PRIME LAW OF THIS CODEBASE

StellarForge is Scrivener × Stellaris × World Anvil: one instrument in which
deciding what is true about a universe and writing that universe are the same
motion.

**The tools and the writing space are one organism.** Anything that weakens
the connection between them is a regression, regardless of how good it looks
in isolation.

Every change is measured against one question:

> Does this shorten the distance between a number the writer decided and a
> sentence the writer wrote?

Full text: `docs/stellarforge/00-CONSTITUTION.md`. Read it before any
architectural decision. The seven laws are not aspirational.

### The seven laws, in brief

1. **No orphan data.** Every input becomes a Fact on the Canon Graph or is
   explicitly tagged ephemeral. There is no third state.
2. **Provenance up, consequence down.** Every fact knows who asserted it and
   what breaks if it changes.
3. **Every surface is two-way.** No dead-end readouts. Display implies edit,
   or a one-click path to the place you edit.
4. **Prose is a first-class citizen of the graph.** Scenes bind to facts.
   Prose can propose canon.
5. **Time is an axis, not a page.** Facts carry validity intervals.
6. **Simulation is canon-generating, not decorative.**
7. **One focal surface per intent.** Before adding a view, name the view it
   absorbs.

### Non-negotiables

- All world data reads and writes go through `src/canon/`. A component that
  imports Supabase to read world data is a Constitution violation.
- Every tool has a `manifest.ts` conforming to `ToolManifest`. No manifest,
  no merge.
- Predicates come from `src/canon/vocabulary.ts`. Adding one is deliberate —
  use `/sf-fact`. Never rename a predicate; deprecate and alias.
- `canon.assert()` never silently overwrites `confidence:'canon'`.
- Nothing ever modifies the user's prose.
- Recompute marks stale and offers. It does not silently recalculate.
- No new always-on chrome layer without naming the one it replaces.

### Before you build

| If you're... | Read |
|---|---|
| making any architectural call | `00-CONSTITUTION.md` |
| touching the data model | `02-ARCHITECTURE.md` |
| adding or wiring a tool | `03-TOOL-CHARTER.md` + `08-VOCABULARY.md` |
| touching the Studio | `04-STUDIO-CHARTER.md` |
| touching any simulator | `11-SIMULATOR-CONSTELLATION.md` |
| proposing a new feature | `05-NEW-SYSTEMS.md` (the four questions) |
| deciding what's next | `12-SESSION-SEQUENCE.md`, then `06-BUILD-ORDER.md` |
| about to merge | `07-REVIEW-GATES.md` |
| themes, IA, or what to build next at scale | `13-THE-LIFT.md` |
| anything WebGL / three.js / the Atlas / sim rendering | `14-RENDER-ENGINE.md` |

### Commands

`/sf-audit` · `/sf-new-tool` · `/sf-wire` · `/sf-fact` · `/sf-situation` ·
`/sf-studio-bind` · `/sf-contrast` · `/sf-ship`

Use `/sf-wire` for retrofitting existing tools — one tool per session, never
batched.

### Design system

The visual language is governed by the `stellarforge-design` skill and the
design handoff README. Summary of the rules most often broken:

- Zero radius everywhere, simulators included. One documented exception:
  Tag (2px). (The old simulator `rounded-lg` exception was retired
  2026-10-17; no simulator ever shipped rounded.) Simulator canvases are
  #09090B with product teal; legacy cyan #00D4FF is retired product-wide,
  SF-II settled decision #3, and must never reappear.
- MD Nichrome for H1 only. Jura for eyebrows and section labels. DM Sans for
  body and buttons. JetBrains Mono for numbers, coordinates, IDs, timestamps
  — never body copy. Lora italic is the writer voice: writing surfaces and
  marketing accents only, never instrument chrome or buttons.
- Three surface layers maximum: void → surface → elevated. Modals sit on
  `elevated` above `--sf-scrim`; there is no fourth plane.
- One focal moment per screen.
- Motion 120–280ms. No springs. No reveals over 300ms outside ambient
  telemetry.
- Colour is a cascade layer, matching the tool categories: amber = Physics,
  azure = Environment/Worlds, emerald = Biology/Life, magenta = Psychology,
  stellar = Mythology, violet = Culture/Civilizations, teal = Integration,
  crimson = Stop. These never move. (Corrected 2026-10-17: this line used
  to say stellar = Worlds, which the code never did.)
- **`sf-primary` is a role, `sf-teal` is a meaning.** Buttons, focus, selection,
  active nav, links use `sf-primary` — the user chooses it (60 themes, all
  contrast-solved, `design/themes.py`). Never put a role on a named hue.
- Tokens, never hardcoded hex.
- Every scrollable container gets `sf-sb`.

### Legibility — non-negotiable

`tokens.css`, `tailwind.config.ts`, `themes.css` (+ `themes.json`) are **GENERATED** by
`design/derive.py` + `design/emit.py` + `design/themes.py`. Every value is solved against a WCAG
target in OKLab. Hand-editing either file is a blocking review failure.
To change a colour, change its target and re-run both scripts.

Full audit and rationale: `docs/stellarforge/10-LEGIBILITY.md`.

- **No alpha borders.** Solid `sf-line-*` tokens only — alpha composites
  unpredictably over the starfield, grain, and video layers.
    - `sf-line-hairline` table rules · `sf-line` panel edges
    - `sf-line-interactive` anything operable (WCAG 1.4.11, ≥3:1)
    - `sf-line-emphasis` hover, active, selected
- **No opacity for states.** Disabled uses `sf-disabled-bg` /
  `sf-disabled-line` / `sf-disabled-text`. `opacity-40` guarantees nothing.
- **`t5` is retired.** Nothing readable lives below `t4`. If it should
  recede, make it smaller — never fainter.
- **Accent text uses the `-text` stop.** `--sf-crimson` for the error
  border and icon; `--sf-crimson-text` for the sentence. Never the reverse.
- **Every interactive element has a visible `:focus-visible` ring.** No
  component may suppress the global default.
- **44px minimum hit target** (`min-h-hit`). Icon-only buttons need an
  `aria-label`.
- **No tracking under 12px.** Wide tracking on small text destroys word
  shape — it was the worst legibility defect in the old system.
- **Running prose is bounded** by `.sf-measure` (68ch).
- **Colour is never the only signal.** Errors carry an icon or `//` prefix.
- **Text over video or imagery gets `.sf-scrim`.**
- **New ambient layers multiply `var(--sf-ambient)`** or they don't ship.
- Body copy is `text-t1` or `text-t2`. Never `text-t3` for running text.

- **One definition per token.** `tokens.css`/`themes.css` own every `--sf-*`
  and `--t*` name. `src/index.css`'s legacy `.dark` block maps shadcn's
  semantic variables onto the generated `--x-hsl` twins and defines nothing
  of its own. Tailwind utilities read `rgb(var(--x-rgb) / a)`, which is
  what makes `text-t1` follow the active theme. Redefining a token name
  anywhere else is Parallel Truth and `/sf-contrast` check 14 blocks it.

Run `/sf-contrast` before any visual merge.

### Ship's Voice

All system strings: uppercase, no emoji, no exclamation points, no second-
person excitement. Past tense for confirmations, imperative for actions.

  WORLD FILE SECURED.
  PARAMETERS OUTSIDE OPERATIONAL RANGE.
  CLAIM DETECTED. NOT ON FILE. ADOPT?
  PARAMETER REVISED. 6 DERIVED VALUES STALE. 4 DOCUMENTS AFFECTED.

Never: "Oops!", "Great job!", "Let's go!", emoji, or exclamation points.

Map PostgREST errors before display. `23505` → `RECORD CONFLICT. ENTRY
ALREADY ON FILE.`

### The two one-line tests

> If the screen feels like a ship, ship it. If it feels like a website,
> start over.

> If the writer can't feel the world pushing back on the page, start over.
