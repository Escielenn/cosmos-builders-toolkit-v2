# TIDELOCK — Integration Guide for StellarForge.tools

## Overview

TIDELOCK is a WebGL-based tidally locked exoplanet simulator built with Three.js (r128) and custom GLSL shaders. It runs as a **standalone HTML page** served from the `public/` directory — this is intentional. The 1300+ lines of inline GLSL shaders, Three.js scene graph management, and real-time physics make React componentization fragile with no meaningful benefit. This is a common pattern for complex WebGL tools in React/Next.js projects.

## File Structure

```
public/
  tools/
    tidelock/
      index.html          ← The complete simulator (self-contained)

src/
  app/ (or pages/)
    tools/
      tidelock/
        page.tsx           ← React route that embeds the simulator
```

## Step 1: Place the Static File

Copy `index.html` to your project:

```bash
mkdir -p public/tools/tidelock
cp index.html public/tools/tidelock/index.html
```

Vercel serves everything in `public/` as static files. The simulator will be directly accessible at:
```
https://stellarforge.tools/tools/tidelock/
```

## Step 2: Create the React Route Page

### Option A: Next.js App Router (recommended if using app/)

Create `src/app/tools/tidelock/page.tsx`:

```tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TIDELOCK — Tidally Locked World Simulator · StellarForge.tools',
  description:
    'Interactive 3D simulator for tidally locked exoplanets. Explore habitable zones, atmospheric dynamics, and surface conditions around M-dwarf and K-dwarf stars.',
  openGraph: {
    title: 'TIDELOCK — Tidally Locked World Simulator',
    description:
      'Interactive 3D simulator for tidally locked exoplanets. A StellarForge.tools worldbuilding instrument.',
    url: 'https://stellarforge.tools/tools/tidelock',
    siteName: 'StellarForge.tools',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TIDELOCK — Tidally Locked World Simulator',
    description:
      'Interactive 3D simulator for tidally locked exoplanets. A StellarForge.tools worldbuilding instrument.',
  },
}

export default function TidelockPage() {
  return (
    <iframe
      src="/tools/tidelock/index.html"
      className="w-full h-screen border-0"
      title="TIDELOCK — Tidally Locked World Simulator"
      allow="fullscreen"
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    />
  )
}
```

### Option B: Direct Static Route (simplest)

If you don't need the React wrapper, Vercel will serve the HTML directly at `/tools/tidelock/`. No React page needed — just the file in `public/`.

### Option C: Redirect from React Route

If your tools page has a listing/card layout and you want to open TIDELOCK in a new tab:

```tsx
// In your tools listing component
<a
  href="/tools/tidelock/"
  target="_blank"
  rel="noopener noreferrer"
  className="tool-card"
>
  <h3>TIDELOCK</h3>
  <p>Tidally Locked World Simulator</p>
</a>
```

## Step 3: Navigation Integration

Add TIDELOCK to your tools navigation/listing wherever other simulators appear:

```tsx
{
  name: 'TIDELOCK',
  slug: 'tidelock',
  description: 'Tidally Locked World Simulator',
  category: 'simulators',       // or whatever your category system uses
  href: '/tools/tidelock/',
  status: 'live',               // vs 'coming-soon', 'beta', etc.
  isFullscreen: true,           // flag for tools that take over the viewport
}
```

## Step 4: Auth Gate (if applicable)

If TIDELOCK should be behind authentication (premium feature), wrap the route:

```tsx
// App Router middleware or layout approach
import { requireAuth } from '@/lib/auth'  // your auth utility

export default async function TidelockPage() {
  await requireAuth()  // redirects to login if not authenticated

  return (
    <iframe src="/tools/tidelock/index.html" /* ... */ />
  )
}
```

Note: The static HTML in `public/` is accessible without auth. If you need to gate access to the HTML itself, move it out of `public/` and serve it via an API route instead:

```tsx
// src/app/api/tools/tidelock/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect('/login')
  }

  const html = fs.readFileSync(
    path.join(process.cwd(), 'src/tools/tidelock/index.html'),
    'utf-8'
  )
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
```

## Dependencies

**External (CDN-loaded by the HTML)**:
- Three.js r128: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- Google Fonts: Space Grotesk, DM Sans, JetBrains Mono

**No npm dependencies required.** The simulator is fully self-contained.

If you'd prefer to bundle Three.js locally:
```bash
npm install three@0.128.0
```
Then replace the CDN script tag with a module import — but this requires converting the inline script to a module, which is a nontrivial refactor.

## OG Image

The HTML includes Open Graph meta tags but no `og:image` yet. When you have a screenshot or branded card:

1. Add to the HTML `<head>`:
```html
<meta property="og:image" content="https://stellarforge.tools/og/tidelock.png">
<meta name="twitter:image" content="https://stellarforge.tools/og/tidelock.png">
```

2. Place the image at `public/og/tidelock.png` (recommended: 1200×630px)

## Canonical URL

The HTML sets `<link rel="canonical" href="https://stellarforge.tools/tools/tidelock">`. If your final URL differs, update this in the HTML head.

## Performance Notes

- Three.js r128 is ~600KB gzipped from CDN (cached across visits)
- The simulator creates a single WebGL context with ~10 draw calls per frame
- Planet sphere is 128×64 segments — good balance of detail vs performance
- Shader complexity is moderate (noise functions, multi-zone temperature model)
- Mobile-responsive with touch controls (drag to orbit, pinch to zoom)
- No memory leaks — geometries and materials are created once at init

## What's Inside

| Feature | Description |
|---|---|
| 20 star types | M9V through F0V with accurate luminosity/temperature/HZ data |
| Temperature model | Substellar-to-antistellar gradient with atmospheric redistribution |
| Biome rendering | GLSL procedural terrain: desert → grassland → forest → ocean → tundra → ice |
| Orbital mechanics | Kepler-scaled orbit with tidal locking (quaternion rotation) |
| Atmosphere shell | Fresnel rim glow scaled by atmospheric density |
| Cloud layer | Animated procedural clouds with day/night terminator |
| Moon system | Up to 3 moons with orbital motion and eclipse shadows |
| 6 presets | TRAPPIST-1e, Proxima b, Eyeball Earth, Super Venus, Snowball, Ribbon World |
| Physics readout | 20+ calculated values including escape velocity, Jeans parameter, hab band |
| Animation controls | Pause/play (spacebar), speed slider 0-5× |

## Future Enhancements (Roadmap)

- [ ] Export planet configuration as JSON (for worksheet integration)
- [ ] Import from StellarForge planet worksheet data
- [ ] Screenshot/share functionality
- [ ] Atmosphere composition visual effects (methane haze, sulfur clouds)
- [ ] Ring system option
- [ ] Sound design (ambient stellar wind)
- [ ] Guided tour mode for educational use

---

*These worlds exist in you. Waiting to be found.*

© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools
