# STELLARFORGE DESIGN SYSTEM — AESTHETIC GUIDELINES

## CORE PHILOSOPHY
"Less is more." The forge is not an object, but the action of carving existence out of nothingness. We provide tools to shape the cosmos. Every design decision should feel like light emerging from void.

This is a premium, distinctive product. Generic "AI slop" aesthetics are forbidden. Every element should feel intentionally designed, surprising, and unmistakably StellarForge.

---

## COLOR SYSTEM

### CSS Variables (required for all implementations)
```css
:root {
  /* Foundation */
  --sf-void: #0D0D0F;
  --sf-surface: #151518;
  --sf-surface-elevated: #1C1C21;
  --sf-text-primary: #FAFAFA;
  --sf-text-muted: #6B6B70;
  --sf-text-ghost: #3A3A3F;

  /* Accent Spectrum — use ONE per component as focal point */
  --sf-cyan: #00D4FF;
  --sf-magenta: #FF00AA;
  --sf-violet: #9B5DE5;
  --sf-amber: #FFB800;
  --sf-emerald: #00FF88;
  --sf-crimson: #FF3366;
  --sf-azure: #4D9FFF;

  /* Glow variants (20% opacity for subtle, 40% for emphasis) */
  --sf-glow-cyan: rgba(0, 212, 255, 0.2);
  --sf-glow-magenta: rgba(255, 0, 170, 0.2);
  /* ... etc */
}
```

### Color Philosophy
- **Dominant darkness with sharp accent punctuation.** 90%+ of any screen is void/surface colors.
- One accent color owns each component. Never mix accents within a single element.
- Light is precious — every colored pixel should feel earned.
- Reject timid, evenly-distributed palettes. Commit fully.

### Forbidden
- Pure black (#000000) — always use tinted near-blacks
- Purple gradients on white backgrounds (the ultimate AI cliché)
- Evenly distributed rainbow palettes
- Pastel washes that lack conviction

---

## TYPOGRAPHY

### Font Selection (choose ONE pairing, commit fully)

**Option A — Technical Precision**
- Headlines: `Space Grotesk` (weight 300) or `JetBrains Mono` (weight 200)
- Body: `IBM Plex Sans` (weight 400)

**Option B — Editorial Cosmos**
- Headlines: `Crimson Pro` (weight 200) — unexpected elegance
- Body: `Source Sans 3` (weight 400)

**Option C — Brutalist Future (recommended for StellarForge)**
- Headlines: `Clash Display` or `Cabinet Grotesk` (weight 200-300)
- Body: `Satoshi` (weight 400)

**Option D — Monospace Purity**
- Everything: `Fira Code` or `JetBrains Mono` — weights 200 vs 600

### CURRENT IMPLEMENTATION (Google Fonts)
- Headlines: `Space Grotesk` (weight 300)
- Body: `DM Sans` (weight 400)
- Mono: `JetBrains Mono` (weight 400)

### FORBIDDEN FONTS
Never use: Inter, Roboto, Open Sans, Lato, Arial, Helvetica, system-ui, sans-serif defaults. These instantly signal generic AI output.

### Weight & Size Extremes
- Headlines: Weight 100-300 (ultralight), never 400-500
- Body: Weight 400, never bold for running text
- Size jumps must be dramatic: 14px body → 48px+ headlines (3x minimum)
- Letter-spacing on headlines: `0.2em` to `0.4em` (UPPERCASE only)

### Hierarchy Example
```css
.sf-display {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--sf-text-primary);
}

.sf-body {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--sf-text-muted);
}
```

---

## BACKGROUNDS & ATMOSPHERE

Solid colors are lazy. Every background should create depth and atmosphere.

### Layered Void Technique
```css
.sf-background {
  background:
    /* Subtle noise texture for tactility */
    url("data:image/svg+xml,...") repeat,
    /* Radial glow from accent (positioned contextually) */
    radial-gradient(ellipse at 70% 20%, var(--sf-glow-cyan) 0%, transparent 50%),
    /* Base gradient for depth */
    linear-gradient(180deg, var(--sf-void) 0%, #0A0A0C 100%);
}
```

### Atmospheric Options
1. **Radial accent glow** — single color bloom positioned off-center
2. **Subtle grid overlay** — 1px lines at 5% opacity, suggests infinite space
3. **Floating particles** — sparse, slow-moving dots (CSS-only preferred)
4. **Horizon line** — single luminous arc suggesting planetary edge

### The Light Arc Motif
StellarForge's signature: a sweeping crescent of light representing emergence and trajectory.
- Use as hero element, card edge accent, or background detail
- Always a single color with soft gaussian bloom
- Animated on page load: sweeps in from edge

---

## MOTION & ANIMATION

### Philosophy
One orchestrated moment beats scattered micro-interactions. Focus budget on:
1. Page load reveal sequence
2. Major state transitions
3. Hero element entrance

### Page Load Choreography (high-impact pattern)
```css
/* Staggered reveal system */
.sf-reveal {
  opacity: 0;
  transform: translateY(20px);
  animation: sf-emerge 0.8s ease-out forwards;
}

.sf-reveal:nth-child(1) { animation-delay: 0.1s; }
.sf-reveal:nth-child(2) { animation-delay: 0.2s; }
.sf-reveal:nth-child(3) { animation-delay: 0.3s; }
/* ... continue pattern */

@keyframes sf-emerge {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Glow Pulse (for active/live elements only)
```css
@keyframes sf-breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.sf-glow-active {
  animation: sf-breathe 3s ease-in-out infinite;
}
```

### Timing Principles
- Reveals: 600-800ms, ease-out
- Hovers: 200-300ms, ease-in-out
- Never use linear easing
- Delays create rhythm — use deliberately

### For React (when Motion library available)
Use Framer Motion for complex sequences. Orchestrate with `staggerChildren` and `delayChildren`.

---

## ICONOGRAPHY

### Style Rules
- Abstract, symbolic, minimal — never illustrative
- Single accent color per icon against void background
- Shapes defined by light emission, not outlines
- Soft bloom effect (gaussian blur 10-30px on glow layer)
- Icons should feel like they're glowing from within

### Construction
1. Dark silhouette base shape
2. Accent color light source within
3. Blur layer for bloom
4. No strokes, no outlines

---

## COMPONENT PATTERNS

### Cards
```css
.sf-card {
  background: var(--sf-surface);
  border: 1px solid var(--sf-text-ghost);
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* Optional: accent light at bottom edge */
.sf-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--sf-cyan), transparent);
}
```

### Buttons
```css
.sf-button {
  background: transparent;
  border: 1px solid var(--sf-text-muted);
  color: var(--sf-text-primary);
  padding: 0.875rem 2rem;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease-out;
}

.sf-button:hover {
  border-color: var(--sf-cyan);
  box-shadow: 0 0 20px var(--sf-glow-cyan);
  color: var(--sf-cyan);
}
```

### Navigation
- Widely spaced, uppercase, ultralight weight
- No visible dividers — whitespace defines separation
- Hover: subtle underline or color shift, never background change

---

## LAYOUT PRINCIPLES

### Spacing Scale
```css
--sf-space-xs: 0.5rem;   /* 8px */
--sf-space-sm: 1rem;     /* 16px */
--sf-space-md: 2rem;     /* 32px */
--sf-space-lg: 4rem;     /* 64px */
--sf-space-xl: 8rem;     /* 128px */
--sf-space-2xl: 12rem;   /* 192px */
```

### Negative Space Philosophy
- Sections separated by `--sf-space-xl` minimum
- Content floats in void — never feels cramped
- Hero sections: cinematic proportions, 60-80vh minimum
- Let one element own the viewport at a time

### Grid
- 12-column with generous gutters (2rem+)
- Content rarely spans full width — max-width containers
- Asymmetric layouts create tension and interest

---

## ANTI-PATTERNS (explicitly forbidden)

### Generic AI Aesthetic Markers
- Rounded rectangles with soft shadows on white backgrounds
- Gradient buttons (especially blue-to-purple)
- Card grids with identical spacing and sizes
- Hero sections with centered text + stock illustration
- "Friendly" illustrations with blob people
- Excessive border-radius (pill shapes, fully rounded cards)

### Typography Crimes
- Multiple font weights fighting for attention
- Centered body text
- Justified text
- ALL CAPS body copy
- Inconsistent letter-spacing

### Color Mistakes
- More than 2-3 colors visible simultaneously
- Accent colors at equal visual weight
- Gradients used decoratively without purpose
- White backgrounds in a dark-theme system

---

## IMPLEMENTATION CHECKLIST

Before shipping any component, verify:

- [ ] Uses CSS variables, not hardcoded colors
- [ ] Typography uses approved font pairing
- [ ] No forbidden fonts present
- [ ] Weight extremes respected (200 vs 600, not 400 vs 500)
- [ ] Background has depth (not solid color)
- [ ] Single accent color per component
- [ ] Glow effects use blur, not solid shapes
- [ ] Animation uses ease-out, appropriate duration
- [ ] Adequate negative space
- [ ] Feels distinctly StellarForge, not generic

---

## FINAL DIRECTIVE

When in doubt, remove elements. Darkness is our canvas. Light is our medium. Every pixel of color should feel like a star igniting in void.

Make it feel like the interface for forging galaxies.
