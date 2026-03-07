# ExoForge — Production Integration Spec

**Extracting the prototype into StellarForge's React/TypeScript/Supabase stack**

---

## What Exists

`exoforge-v3.html` — a single-file prototype containing:

- Three.js procedural planet renderer (sphere + atmosphere + clouds + rings)
- 6-octave simplex noise terrain generation with temperature-driven biome colors
- Continuous rocky→gas composition spectrum with visual interpolation
- Full ring system (multi-band with Cassini gap, 5 color presets)
- Logarithmic temperature slider (35% of range dedicated to habitable zone)
- 58 embedded real exoplanets from NASA Exoplanet Archive
- Search with auto-classification and parameter import
- Two-tier rendering (2-octave preview while dragging, 6-octave on release)
- Dirty flag batched update system
- Export to PNG with blob/fallback methods
- Custom orbit controls (spherical coordinates with exponential smoothing)
- v2 aesthetic: MD Nichrome, dual cyan/green accent, zero border-radius

---

## React Component Architecture

### File Structure

```
src/
├── components/
│   └── tools/
│       └── exoforge/
│           ├── ExoForge.tsx                 # Main page wrapper
│           ├── ExoForgeCanvas.tsx           # R3F Canvas + planet mesh
│           ├── PlanetMesh.tsx               # Planet sphere + atmo + clouds + rings
│           ├── PlanetTexture.ts             # Simplex noise terrain generator (worker-ready)
│           ├── ExoForgeControls.tsx          # Left panel: all sliders
│           ├── ExoForgeData.tsx             # Right panel: data readouts
│           ├── ExoForgeSearch.tsx           # Bottom panel: NASA search
│           ├── ExoForgeTitleBadge.tsx       # Top-left: title + status badge
│           ├── useExoForgeState.ts          # Zustand store or useReducer
│           ├── usePlanetParams.ts           # Parameter derivations (gravity, density, etc.)
│           ├── exoplanet-catalog.ts         # Embedded 58-planet dataset
│           ├── biome-palettes.ts            # Temperature→color mapping tables
│           ├── composition-interpolation.ts # Rocky↔gas visual blending logic
│           └── types.ts                     # PlanetParams, ExoplanetData, etc.
├── lib/
│   └── simplex-noise.ts                    # Simplex noise with fbm (extracted)
└── styles/
    └── simulator.css                       # Shared simulator aesthetic (v2)
```

### Key Component Decisions

**ExoForgeCanvas.tsx** — Uses `@react-three/fiber` with `@react-three/drei` for orbit controls. The canvas component wraps `<Canvas>` and mounts `<PlanetMesh>`.

**PlanetMesh.tsx** — Declarative R3F component. Receives `params` prop. Updates geometry/materials reactively. The expensive terrain pass runs in a `useEffect` with debounce during drag, immediate on release.

**PlanetTexture.ts** — Pure function: `(params: PlanetParams, octaves: number) => { positions: Float32Array, colors: Float32Array }`. This is the hot path. Can be moved to a Web Worker for non-blocking terrain generation.

**useExoForgeState.ts** — Central state. All sliders write here. The dirty flag system lives here. Exposes `isDragging`, `setParam()`, `loadExoplanet()`, `resetToEarth()`.

### State Shape

```typescript
interface PlanetParams {
  name: string;
  source: string;
  radius: number;       // Earth radii
  mass: number;         // Earth masses
  temp: number;         // Kelvin
  period: number;       // days
  ocean: number;        // 0-100%
  atmo: number;         // 0-5 (Earth = 1)
  cloud: number;        // 0-100%
  roughness: number;    // 0-1
  composition: number;  // 0 = pure rock, 100 = pure gas
  ringOpacity: number;  // 0-100%
  ringWidth: number;    // 0.3-3.0
  ringTilt: number;     // 0-90 degrees
  ringColor: 'amber' | 'ice' | 'dust' | 'iron' | 'silicate';
  starTemp: number;     // Kelvin
  starRadius: number;   // Solar radii
  rotation: number;     // multiplier
}

interface DerivedData {
  gravity: number;      // g
  density: number;      // g/cm³
  escapeVelocity: number; // km/s
  classification: string;
  habitableZone: 'habitable' | 'too-hot' | 'too-cold';
  atmosphereRetention: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';
  liquidWater: boolean;
  starType: string;
}
```

---

## Supabase Edge Function: NASA Proxy

The prototype's embedded catalog is a stopgap. Production needs live TAP queries.

### Edge Function: `supabase/functions/nasa-exoplanet-search/index.ts`

```typescript
// Proxies requests to NASA Exoplanet Archive TAP service
// Adds CORS headers, caches results for 1 hour
// Endpoint: POST /functions/v1/nasa-exoplanet-search
// Body: { query: string }

const NASA_TAP = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

Deno.serve(async (req) => {
  const { query } = await req.json();

  const params = new URLSearchParams({
    query: `SELECT pl_name, pl_rade, pl_bmasse, pl_eqt, pl_orbper,
            hostname, disc_facility, pl_orbsmax, st_teff, st_rad
            FROM ps
            WHERE default_flag = 1
            AND (pl_name LIKE '%${query}%' OR hostname LIKE '%${query}%')
            ORDER BY pl_name
            LIMIT 20`,
    format: 'json'
  });

  const response = await fetch(`${NASA_TAP}?${params}`);
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});
```

### Fallback Strategy

1. Try Supabase Edge Function (live NASA data)
2. Fall back to embedded 58-planet catalog
3. Show user-friendly message with catalog count

---

## World Object Integration

ExoForge planets should persist as part of the user's World Object.

### Schema Extension

```sql
-- Add to world_objects table or create related table
CREATE TABLE world_planets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  params JSONB NOT NULL,           -- Full PlanetParams object
  source TEXT DEFAULT 'User-defined',
  thumbnail_url TEXT,              -- Supabase Storage path
  annotations JSONB DEFAULT '[]', -- Surface annotations (future)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Save/Load Flow

1. User clicks "Save to World" → writes PlanetParams as JSONB
2. Thumbnail generated via `renderer.toDataURL()` → uploaded to Supabase Storage
3. World Outline shows planet with thumbnail + classification
4. Clicking planet in outline reopens ExoForge with params loaded

---

## Export Pipeline

### Image Export (existing, needs cleanup)

```typescript
async function exportImage(renderer: THREE.WebGLRenderer, name: string) {
  renderer.render(scene, camera); // force fresh frame
  const blob = await new Promise<Blob>((resolve) =>
    renderer.domElement.toBlob((b) => resolve(b!), 'image/png')
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_exoforge.png`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### World Bible Integration (future)

Planet data exports as a formatted section in the World Bible PDF/DOCX:
- Planet thumbnail image
- Full parameter table
- Classification and habitability assessment
- Source attribution (NASA or custom)
- Surface annotations (when implemented)

---

## Dual Deployment

### Standalone Page

`/tools/exoforge` — Full viewport canvas with floating panels. Same as prototype layout.

### Embeddable Component

`<ExoForgeEmbed worldId={id} planetId={id} />` — Compact version for World Object detail pages. Reduced controls, no search panel, read-only option.

---

## Performance Notes from Prototype

| Operation | Cost | Strategy |
|---|---|---|
| Terrain generation (6 octaves) | ~15ms on M1, ~40ms on mid-range | Web Worker, 2-octave preview while dragging |
| Ring geometry rebuild | ~2ms | Cache, only rebuild when width changes by >0.005 |
| Atmosphere/cloud uniforms | <0.1ms | Always immediate |
| Data readout DOM updates | ~1ms | Throttle to 80ms intervals |
| NASA search (live) | 200-800ms | Edge function cache, debounce input 300ms |

### Dirty Flag Categories

**Cheap (always immediate):** atmosphere density, cloud coverage, ring opacity/tilt/color, star temperature/radius, rotation speed

**Expensive (preview while dragging, full on release):** temperature, ocean coverage, roughness, composition

---

## Implementation Timeline Estimate

| Phase | Scope | Est. |
|---|---|---|
| 1 | React component scaffold + R3F canvas + basic planet | 2 days |
| 2 | Port terrain generator + composition interpolation | 2 days |
| 3 | Control panel sliders with dirty flag state | 1 day |
| 4 | NASA Edge Function + search UI | 1 day |
| 5 | Data readout panel + derived calculations | 0.5 day |
| 6 | Ring system + star light | 0.5 day |
| 7 | Export image + World Object save/load | 1 day |
| 8 | v2 aesthetic pass (Nichrome, dual accent, sharp corners) | 0.5 day |
| 9 | Mobile responsive + touch controls | 1 day |
| 10 | Testing + polish | 1 day |
| **Total** | | **~10 days** |

---

## Extractable Utilities

These modules from the prototype are reusable across StellarForge:

- **SimplexNoise + fbm** — Used by any procedural terrain/texture tool
- **Temperature→biome color mapping** — Useful for habitable zone calculators
- **Logarithmic slider mapping** — Piecewise linear mapping for any slider with uneven distributions
- **Black body color function** — Star visualization across the platform
- **Composition classification** — Auto-classify planets from radius/mass data
- **Dirty flag render system** — Pattern for any tool with many sliders driving expensive computation
