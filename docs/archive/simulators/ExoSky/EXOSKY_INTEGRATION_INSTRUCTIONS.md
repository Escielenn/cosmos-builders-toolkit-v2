# EXOSKY v2 Integration Instructions for Claude Code

**Objective**: Integrate the EXOSKY v2 Alien Night Sky Simulator and its companion "Showing Our Work" science methodology page into the StellarForge.tools codebase (React/TypeScript/Supabase/Vercel).

---

## STEP 0 — DISCOVERY (Do This First)

Before writing any code, run these commands to understand the existing codebase structure:

```bash
# Find the project root and list top-level structure
ls -la
find . -name "package.json" -maxdepth 2 | head -5
cat package.json | head -30

# Discover the routing pattern (Next.js App Router vs Pages Router)
ls -la src/app/ 2>/dev/null || ls -la pages/ 2>/dev/null || ls -la app/ 2>/dev/null

# Find where existing simulators/tools live
find . -type f -name "*.tsx" -o -name "*.jsx" | grep -iE "rogue|tidelock|simulator|tool" | head -20

# Find the existing layout/navigation to add EXOSKY to it
find . -type f -name "*.tsx" | grep -iE "layout|nav|header|sidebar" | head -20

# Check existing tool routing pattern
find . -type d | grep -iE "tools|simulators|calculators" | head -20

# Check for existing shared styles or design tokens
find . -type f -name "*.css" | head -20
```

Use the discovered structure to adapt all paths below. The instructions use placeholder paths like `src/app/tools/exosky/` — replace with whatever pattern the codebase actually uses.

---

## STEP 1 — ADD THE SIMULATOR COMPONENT

### 1a. Create the component file

The source file is `exosky_v2.jsx` (attached / provided). This is a **self-contained React component** — ~1795 lines, zero external dependencies beyond React itself. It uses only `useState`, `useRef`, `useEffect`, `useCallback`, and `useMemo` from React.

Place it in the project following the existing tool component pattern. Likely locations:

```
src/components/tools/ExoSkySimulator.tsx    (if components are separate from pages)
src/app/tools/exosky/ExoSkySimulator.tsx    (if components live with their routes)
```

### 1b. TypeScript conversion (if the project uses TypeScript)

The component is written in JSX. If the project is TypeScript-only, you have two options:

**Option A (recommended)**: Rename to `.tsx` and add minimal type annotations:
- Add type annotations to function parameters (the component has no props, so the main work is typing internal state and refs)
- The `useRef<HTMLCanvasElement>(null)` refs need canvas typing
- The seeded RNG functions, star catalog arrays, and coordinate transform functions are all pure math — they type cleanly

**Option B (quick)**: Keep as `.jsx` and ensure `tsconfig.json` has `"allowJs": true`

### 1c. Verify no import conflicts

The component imports ONLY from React:
```javascript
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
```

No other dependencies. No CSS modules, no external packages, no image assets. Everything is self-contained including all inline styles, star catalog data, and the Milky Way volumetric model.

---

## STEP 2 — CREATE THE ROUTE / PAGE

Create the page file following the project's existing routing pattern.

### If Next.js App Router (`src/app/`):

```
src/app/tools/exosky/page.tsx
```

```tsx
import ExoSkySimulator from './ExoSkySimulator';  // adjust path

export const metadata = {
  title: 'EXOSKY v2 — Alien Night Sky Simulator | StellarForge.tools',
  description: 'See the night sky from any confirmed exoplanet. Real star positions from the Hipparcos catalog, volumetric Milky Way modeling, and atmospheric optics — computed, not painted.',
  openGraph: {
    title: 'EXOSKY v2 — Alien Night Sky Simulator',
    description: 'See the night sky from any confirmed exoplanet. Computed from real astrophysical data.',
    siteName: 'StellarForge.tools',
  },
};

export default function ExoSkyPage() {
  return <ExoSkySimulator />;
}
```

### If Next.js Pages Router (`pages/`):

```
pages/tools/exosky.tsx
```

```tsx
import Head from 'next/head';
import ExoSkySimulator from '../components/tools/ExoSkySimulator';

export default function ExoSkyPage() {
  return (
    <>
      <Head>
        <title>EXOSKY v2 — Alien Night Sky Simulator | StellarForge.tools</title>
        <meta name="description" content="See the night sky from any confirmed exoplanet. Real star positions from the Hipparcos catalog, volumetric Milky Way modeling, and atmospheric optics." />
      </Head>
      <ExoSkySimulator />
    </>
  );
}
```

### Critical layout consideration

EXOSKY is a **full-viewport canvas application**. It renders its own background, panels, and UI — it should NOT be wrapped in the site's standard content layout (nav bar, footer, sidebars). Check how ROGUE or TIDELOCK handle this:

```bash
# Find how existing simulators handle layout
grep -r "layout" src/app/tools/rogue/ 2>/dev/null || \
grep -r "layout" src/app/tools/tidelock/ 2>/dev/null || \
grep -r "getLayout" pages/tools/ 2>/dev/null
```

If the site uses a shared layout that adds nav/footer, you likely need to either:
- Set a `layout.tsx` in the exosky directory that returns just `{children}` (App Router)
- Or set `ExoSkyPage.getLayout = (page) => page` to skip the default layout (Pages Router)
- Or match whatever pattern ROGUE uses — it has the same full-viewport requirement

---

## STEP 3 — ADD THE SCIENCE METHODOLOGY PAGE

### 3a. Create the science page

The source file is `exosky_science.html` — a standalone HTML page with its own animated starfield background. This needs to be converted to a React component OR served as a static page.

**Option A — Convert to React component (recommended)**:

Create `src/app/tools/exosky/science/page.tsx` (or equivalent path). The HTML page is mostly static content with one `<canvas>` animation. Convert:
- The `<style>` block → CSS module, Tailwind classes, or a `<style jsx>` block
- The `<script>` for the starfield → a `useEffect` with canvas ref
- The HTML body → JSX return

The page's CSS follows the Content Aesthetic Guide (`CONTENT_AESTHETIC.md`) — use the design tokens from `stellarforge-content-tokens.css` if those have been integrated.

**Option B — Static HTML page**:

Place in the `public/` directory:
```
public/tools/exosky/science.html
```
This makes it accessible at `stellarforge.tools/tools/exosky/science.html` with no build step, but it won't share the site's navigation or auth context.

### 3b. Link the science page from the simulator

In the EXOSKY simulator component, there's a credit line at the bottom of the control panel. Add a "SHOWING OUR WORK" link:

Search for the STELLARFORGE.TOOLS credit text in the component and add a link nearby:

```jsx
<a href="/tools/exosky/science"
   target="_blank"
   style={{
     fontFamily: "'Space Grotesk', sans-serif",
     fontSize: '7px',
     letterSpacing: '1.5px',
     textTransform: 'uppercase',
     color: 'rgba(0,212,255,0.25)',
     textDecoration: 'none',
     marginTop: '4px',
     display: 'block'
   }}>
  Showing Our Work →
</a>
```

---

## STEP 4 — NAVIGATION INTEGRATION

### 4a. Add EXOSKY to the tools listing

Find the existing tools/simulators navigation or listing page:

```bash
grep -rn "ROGUE\|Tidelock\|TIDELOCK\|rogue" --include="*.tsx" --include="*.jsx" -l | head -10
```

Add EXOSKY v2 to the same list/grid with:

```
Name:        EXOSKY v2
Subtitle:    Alien Night Sky Simulator  
Description: See the night sky from any confirmed exoplanet. Real star positions,
             volumetric Milky Way, and atmospheric optics — computed, not painted.
Category:    Simulator (same category as ROGUE)
Route:       /tools/exosky
Icon color:  Cyan (#00D4FF) — use the star/constellation icon pattern
Badge:       Free (or Pro, depending on access tier decision)
```

### 4b. If there's a tools index or dashboard

Add EXOSKY to the tool card grid matching the existing card pattern. Reference the Aesthetic Guidelines for card styling (dark bg, colorful icon, Space Grotesk title, DM Sans description, hover lift).

---

## STEP 5 — GOOGLE FONTS

Verify the three required fonts are loaded globally. The simulator renders its own UI text using these font families in inline styles — they MUST be available:

```bash
grep -r "Space.Grotesk\|DM.Sans\|JetBrains.Mono" --include="*.tsx" --include="*.jsx" --include="*.html" --include="*.css" | head -10
```

If they're already loaded site-wide (likely, since ROGUE uses them too), you're good. If not, add to the root layout `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

---

## STEP 6 — SEO & META

### Open Graph image

If the project has OG image generation, create one for EXOSKY. The simulator renders to canvas, so a static screenshot can be saved as:

```
public/og/exosky.png    (1200×630)
```

### Structured data (optional)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "EXOSKY v2 — Alien Night Sky Simulator",
  "url": "https://stellarforge.tools/tools/exosky",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web Browser",
  "description": "Interactive simulator showing the night sky from any confirmed exoplanet using real astrophysical data from the Hipparcos catalog and NASA Exoplanet Archive.",
  "author": {
    "@type": "Person",
    "name": "Jason D. Batt, Ph.D."
  }
}
```

---

## STEP 7 — VERIFY & TEST

### Build check
```bash
npm run build
# or
yarn build
```

The component is pure React with zero external deps — if it fails, it's a TypeScript or import path issue, not a missing package.

### Runtime checklist

- [ ] Canvas renders at full viewport (no scrollbars, no layout chrome)
- [ ] All 17 exoplanet systems load in the dropdown
- [ ] Star field renders ~45,000 stars (background + galactic + catalog)
- [ ] Milky Way band is visible and smooth (bilinear interpolation)
- [ ] Mouse drag rotates the sky
- [ ] Scroll wheel zooms
- [ ] Constellation drawer: click stars to connect, color picker works, save/load/export
- [ ] Atmosphere selector changes sky color/extinction
- [ ] Coordinate grid toggles on/off
- [ ] Earth constellation overlay toggles on/off
- [ ] Horizon line renders with ground plane gradient
- [ ] Star names toggle works
- [ ] Export JSON downloads valid constellation data
- [ ] Science methodology page loads and renders starfield animation
- [ ] Mobile: panels collapse, touch drag works

### Performance check

The heaviest operation is the initial Milky Way brightness map computation (~360×180 ray marching). This runs once in `useMemo` on first render. Subsequent renders are just canvas drawing. Should be smooth at 60fps on any modern device after the initial ~200ms computation.

---

## FILE MANIFEST

Two source files to integrate:

| File | Lines | Purpose | Destination |
|---|---|---|---|
| `exosky_v2.jsx` | 1,795 | Full React simulator component | Component directory (convert to .tsx if needed) |
| `exosky_science.html` | 816 | "Showing Our Work" methodology page | Convert to React page or place in public/ |

### Supporting reference docs (for Claude Code context, not deployment):

| File | Purpose |
|---|---|
| `CONTENT_AESTHETIC.md` | Design system for the science page and all content pages |
| `SIMULATOR_AESTHETIC.md` | Design system for canvas-based tools (EXOSKY follows this) |
| `stellarforge-content-tokens.css` | CSS custom properties for content pages |

---

## WHAT NOT TO CHANGE

The simulator component is architecturally complete. Do NOT:

- Split it into multiple files — the single-file architecture is intentional for portability and self-containment
- Add external dependencies (Three.js, D3, star catalog npm packages) — everything is built-in
- Modify the star catalog data, galactic constants, or coordinate transform matrices — these are from peer-reviewed sources (Hipparcos, IAU 1958, Bland-Hawthorn & Gerhard 2016)
- Replace inline styles with Tailwind or CSS modules — the simulator's styles are tightly coupled to the canvas rendering logic and render-time calculations
- Wrap it in the site's standard page layout with nav/footer — it's a full-viewport application

The ONLY modifications needed are:
1. File placement in the correct directory
2. TypeScript annotations if project requires .tsx
3. Import path adjustments
4. Route/page wrapper creation
5. Navigation entry addition

---

© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools
*These worlds exist in you. Waiting to be found.*
