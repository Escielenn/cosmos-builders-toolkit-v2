# Stellar Cartographer — Integration Specification

**Tool Name:** Stellar Cartographer  
**Version:** 4.0  
**Target:** StellarForge.tools  
**Integration Method:** Claude Code in VS Code  

---

## Overview

Stellar Cartographer is an interactive galaxy mapping tool for science fiction worldbuilders. It generates procedural galaxies with multiple star types, empire territories, trade routes, and wormhole networks. Users can customize, rotate in 3D, and export their galaxy maps.

**Tagline:** *Map the stars. Chart the empires. Plot the routes.*

---

## File Structure

```
src/
├── components/
│   └── tools/
│       └── StellarCartographer/
│           ├── index.tsx                    # Main component export
│           ├── StellarCartographer.tsx      # Primary component
│           ├── StellarCartographerCanvas.tsx # Canvas rendering logic
│           ├── hooks/
│           │   ├── useGalaxyGenerator.ts    # Galaxy generation logic
│           │   ├── useCamera.ts             # Camera/viewport controls
│           │   └── useExport.ts             # Export functions (PNG/SVG/JSON/MD)
│           ├── utils/
│           │   ├── starTypes.ts             # Star type definitions & colors
│           │   ├── nameGenerator.ts         # Procedural naming system
│           │   ├── seededRandom.ts          # Deterministic RNG
│           │   └── colorUtils.ts            # Color manipulation helpers
│           ├── types/
│           │   └── index.ts                 # TypeScript interfaces
│           └── constants.ts                 # Configuration constants
```

---

## TypeScript Interfaces

```typescript
// types/index.ts

export interface Star {
  id: number;
  x: number;
  y: number;
  z: number;
  type: SpectralClass;
  baseColor: string;
  color: string;           // May be hue-shifted from base
  size: number;
  brightness: number;      // 0.6-1.0
  luminosity: number;      // Per spectral class range
  name: string;
  empire: Empire | null;
  hasHabitable: boolean;
  labelPriority: number;
}

export interface Empire {
  id: number;
  name: string;
  color: string;
  namingStyle: NamingStyle;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface TradeRoute {
  id: number;
  name: string;
  color: string;
  stars: Star[];
}

export interface Wormhole {
  id: number;
  name: string;
  starA: Star;
  starB: Star;
  color: string;
  stable: boolean;
}

export interface GalaxyConfig {
  type: GalaxyType;
  starCount: number;
  armCount: number;
  armSpread: number;
  seed: number;
}

export interface ViewConfig {
  rotation: number;        // -360 to 360
  tilt: number;            // -360 to 360
  autoRotate: boolean;
}

export interface DisplayConfig {
  showTerritories: boolean;
  showRoutes: boolean;
  showHabitableIndicators: boolean;
  territoryOpacity: number;           // 0-100
  territoryBorderStyle: 'soft' | 'sharp' | 'none';
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
export type GalaxyType = 'spiral' | 'barred' | 'elliptical' | 'irregular';
export type NamingStyle = 'terran' | 'harsh' | 'flowing' | 'poetic';
```

---

## Star Type Definitions

```typescript
// utils/starTypes.ts

export const STAR_TYPES: Record<SpectralClass, StarTypeData> = {
  O: { 
    color: '#9BB0FF', 
    temp: '30,000K+', 
    mass: '16-150 M☉', 
    rarity: 0.00003, 
    habitable: 0.02, 
    size: 5,
    luminosity: [0.9, 1.0]
  },
  B: { 
    color: '#AABFFF', 
    temp: '10,000-30,000K', 
    mass: '2.1-16 M☉', 
    rarity: 0.0013, 
    habitable: 0.05, 
    size: 4,
    luminosity: [0.85, 1.0]
  },
  A: { 
    color: '#CAD7FF', 
    temp: '7,500-10,000K', 
    mass: '1.4-2.1 M☉', 
    rarity: 0.006, 
    habitable: 0.12, 
    size: 3.2,
    luminosity: [0.75, 0.95]
  },
  F: { 
    color: '#F8F7FF', 
    temp: '6,000-7,500K', 
    mass: '1.04-1.4 M☉', 
    rarity: 0.03, 
    habitable: 0.25, 
    size: 2.6,
    luminosity: [0.65, 0.9]
  },
  G: { 
    color: '#FFF4EA', 
    temp: '5,200-6,000K', 
    mass: '0.8-1.04 M☉', 
    rarity: 0.076, 
    habitable: 0.45, 
    size: 2.2,
    luminosity: [0.5, 0.85]
  },
  K: { 
    color: '#FFD2A1', 
    temp: '3,700-5,200K', 
    mass: '0.45-0.8 M☉', 
    rarity: 0.121, 
    habitable: 0.35, 
    size: 1.9,
    luminosity: [0.35, 0.7]
  },
  M: { 
    color: '#FFAA6F', 
    temp: '2,400-3,700K', 
    mass: '0.08-0.45 M☉', 
    rarity: 0.765, 
    habitable: 0.15, 
    size: 1.5,
    luminosity: [0.2, 0.55]
  }
};
```

---

## Core Features

### 1. Galaxy Generation

**Galaxy Types:**
- **Spiral** — Logarithmic spiral arms with organic scatter
- **Barred Spiral** — Central bar with arms from bar ends  
- **Elliptical** — Gaussian distribution with flattening
- **Irregular** — Multiple random clusters

**Algorithm (Spiral):**
```typescript
// True logarithmic spiral with organic scatter
function generateSpiral(rng: SeededRandom): Position {
  // 15% core stars
  if (rng.next() < 0.15) {
    const r = Math.abs(rng.gaussian()) * GALAXY_RADIUS * 0.12;
    const angle = rng.next() * Math.PI * 2;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, z: rng.gaussian() * 8 };
  }

  // Arm stars
  const armIndex = rng.int(0, armCount - 1);
  const armOffset = (armIndex / armCount) * Math.PI * 2;
  const t = rng.next();
  const distFromCenter = GALAXY_RADIUS * 0.08 + Math.pow(t, 0.7) * GALAXY_RADIUS * 0.92;
  
  // Logarithmic spiral angle
  const spiralTightness = 0.4;
  const spiralAngle = armOffset + Math.log(distFromCenter / 20 + 1) * spiralTightness * Math.PI * 2;
  
  // Organic scatter increases with distance
  const scatter = rng.gaussian() * (15 + distFromCenter * armSpread);
  const angleScatter = rng.gaussian() * armSpread * 0.5;
  
  const finalAngle = spiralAngle + angleScatter;
  return {
    x: Math.cos(finalAngle) * distFromCenter + scatter * 0.5,
    y: Math.sin(finalAngle) * distFromCenter + scatter * 0.5,
    z: rng.gaussian() * (5 + distFromCenter * 0.02)
  };
}
```

### 2. Naming System

Four naming styles for empire-based star names:

```typescript
const NAMING_STYLES = {
  terran: {
    prefixes: ['Nova', 'Proxima', 'Alpha', 'Beta', 'Tau', 'Sigma', 'Delta', 'Omega', 'Stella', 'Sol', 'Kepler', 'Gliese'],
    roots: ['Centauri', 'Eridani', 'Cygni', 'Lyrae', 'Draconis', 'Aquilae', 'Pavonis', 'Carinae', 'Velorum', 'Orionis'],
    suffixes: [' Prime', ' Major', ' Minor', '', '-IV', '-VII', ' Secundus', '']
  },
  harsh: {
    prefixes: ["Kz'", "Vr'", "Xh'", "Gr'", "Th'", "Zk'", "Kr'", "Dr'", "Gh'", "Sk'"],
    roots: ['thral', 'gnoth', 'krath', 'vorn', 'zekt', 'morg', 'drek', 'skarn', 'grath', 'vrex'],
    suffixes: ['-ak', '-ix', '-or', '-ux', '-eth', '-al', '-om', '-ur']
  },
  flowing: {
    prefixes: ['Ae', 'Io', 'Eu', 'Ai', 'Oa', 'Ei', 'Au', 'Ia', 'Eo', 'Ua'],
    roots: ['laria', 'selia', 'moria', 'velia', 'naia', 'theia', 'reia', 'leia', 'saia', 'vaia'],
    suffixes: ['-an', '-is', '-us', '-ae', '-os', '-ia', '-ea', '-o']
  },
  poetic: {
    prefixes: ['Whisper', 'Shadow', 'Crystal', 'Storm', 'Mist', 'Dream', 'Star', 'Moon', 'Dawn', 'Dusk'],
    roots: [' Harbor', ' Haven', ' Gate', ' Reach', ' Deep', ' Crown', ' Light', ' Song', ' Vale', ' Peak'],
    suffixes: ["'s End", "'s Edge", "'s Rest", '', ' Eternal', ' Ascendant', '']
  }
};
```

### 3. 3D Projection

Full 360° rotation and tilt with perspective:

```typescript
function project3D(x: number, y: number, z: number, rotation: number, tilt: number): ProjectedPoint {
  const rotRad = rotation * Math.PI / 180;
  const tiltRad = tilt * Math.PI / 180;

  // Rotate around Z axis (yaw)
  let rx = x * Math.cos(rotRad) - y * Math.sin(rotRad);
  let ry = x * Math.sin(rotRad) + y * Math.cos(rotRad);
  let rz = z;

  // Tilt around X axis (pitch)
  const ty = ry * Math.cos(tiltRad) - rz * Math.sin(tiltRad);
  const tz = ry * Math.sin(tiltRad) + rz * Math.cos(tiltRad);

  // Perspective
  const perspective = 1000;
  const zOffset = tz + 200;
  const scale = perspective / (perspective + zOffset * 0.4);

  return { x: rx * scale, y: ty * scale, z: tz, scale: Math.max(0.1, scale) };
}
```

### 4. Empire Territories

Three border styles:
- **Soft/Fuzzy** — Radial gradient with outer glow, dashed border
- **Sharp/Defined** — Solid fill with crisp 2px border
- **None** — Gradient fill only, no border

Opacity slider (0-100%) affects all territory rendering.

### 5. Trade Routes

**Manual Drawing:**
- Click stars to add waypoints
- Z/Backspace to undo last waypoint
- ESC to finish route

**Auto-Generation:**
- Creates 5 routes
- Prioritizes habitable and notable (O/B/A) stars
- 4-8 waypoints per route
- 500 unit max reach between stops
- Starts from outer galaxy for longer routes

**Rendering:**
- Glow layer (5px, 25% opacity)
- Main dashed line (2.5px, 70% opacity, 10-6 dash)
- Waypoint markers at high zoom (ring + dot)

### 6. Wormholes

**Manual Drawing:**
- Click first star (shows pulsing portal preview)
- Click second star to complete

**Auto-Generation:**
- Creates 2 wormholes
- Connects distant (>280 units) notable stars
- Random stability assignment (70% stable)

**Portal Graphics:**

*Stable:*
- Slow pulse (1.5× speed)
- Concentric rings
- Crosshair pattern in center
- White core with color gradient

*Unstable:*
- Fast pulse (4× speed)
- Spinning spiral arms (3 arms, rotating)
- More erratic animation

**Connection Line:**
- Curved bezier path
- Glow behind
- Stable: 2-8 dash | Unstable: 1-4 dash

### 7. Star Rendering

**Per-Star Variation:**
- `brightness`: 0.6-1.0
- `luminosity`: Per spectral class range
- `sizeVariation`: 0.8-1.2
- `colorShift`: -15° to +15° hue

**Visual Effects:**
- Hot stars (O/B/A with luminosity >0.7): Outer glow
- Very luminous (>0.8): Secondary soft glow
- Bright core for luminous stars (>0.6)
- Depth fade based on Z position

**Size Scaling:**
```typescript
const zoomFactor = Math.pow(zoom, 0.7); // Sublinear for smaller stars at low zoom
const size = Math.max(0.3, baseSize * zoomFactor * 0.5);
```

### 8. Labels

**Display Conditions:**
- Only at zoom ≥ 2.5×
- Maximum 30 labels
- Priority: Selected > Habitable > O/B stars
- Collision detection (60px minimum spacing)

### 9. Export Functions

**PNG:**
- 2× resolution
- Current view with all visible elements
- Galaxy name + StellarForge.tools watermark
- Filename: `{galaxy_name}_map.png`

**SVG:**
- Vector format, infinitely scalable
- All elements as proper SVG paths
- Embedded font styles
- Radial gradients for territories
- Same watermark

**JSON:**
```json
{
  "meta": { "generator": "StellarForge Stellar Cartographer v4", "seed": 42 },
  "galaxyName": "Andromeda Sector",
  "galaxy": { "type": "spiral", "starCount": 8000, "armCount": 4, "armSpread": 0.35, "seed": 42 },
  "empires": [...],
  "tradeRoutes": [...],
  "wormholes": [...],
  "notableSystems": [...]  // First 100 habitable stars
}
```

**Markdown:**
```markdown
# Galaxy Name

**Seed:** 42
**Type:** spiral
**Stars:** 8,000

## Empires
### Empire Name
- Systems: 1,234

## Trade Routes
### Route Name
- Waypoints: Star A → Star B → Star C

## Wormholes
### Wormhole 1
- Connection: Star A ↔ Star B
- Stability: Stable
```

---

## UI Layout

Following SIMULATOR_AESTHETIC.md:

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Title Panel - Top Left]                                            │
│   STELLAR CARTOGRAPHER                                              │
│   STELLARFORGE.TOOLS                                                │
│   Galaxy Name Display                                               │
│   [Status Badge]                                                    │
│                                                                     │
│ [Control Panel - Left]          [Canvas]          [Data Panel - Right]
│   Galaxy Identity                                   Selected Star     │
│   - Galaxy Name Input                               - Name + Rename   │
│                                                     - Class Badge     │
│   Galaxy Structure                                  - Temperature     │
│   - Type Dropdown                                   - Mass            │
│   - Stars Slider                                    - Habitable       │
│   - Arms Slider                                     - Sovereignty     │
│   - Arm Spread Slider                                                │
│   - Seed Slider                                     Statistics        │
│   [Generate] [Random]                               - Total Stars     │
│                                                     - Named Systems   │
│   View Controls                                     - Habitable       │
│   - Rotation Slider                                 - Trade Routes    │
│   - Tilt Slider                                     - Wormholes       │
│   [Auto Rotate] [Reset View]                                         │
│                                                     Spectral Classes  │
│   Empires                                           - O B A F G K M   │
│   - Empire List (clickable)                                          │
│   [+ Add Empire]                                    Indicators        │
│                                                     - Habitable ring  │
│   Trade Routes                                      - Selected ring   │
│   - Route List                                                       │
│   [+ Draw] [Auto] [Clear]                                            │
│                                                                     │
│   Wormholes                                                         │
│   - Wormhole List                                                   │
│   [+ Draw] [Auto] [Clear]                                           │
│                                                                     │
│   Display                                                           │
│   - Territory Opacity Slider                                        │
│   - Territory Borders Dropdown                     [Zoom Panel]     │
│   [Territories] [Routes]                            1.00×            │
│   [Habitable Rings]                                 ZOOM             │
│                                                                     │
│   Export                                                            │
│   [PNG] [SVG]                                                       │
│   [JSON] [Markdown]                                                 │
│                                                                     │
│                    [Credits - Bottom Center]                        │
│                    © 2025-2026 Jason D. Batt, Ph.D.                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Z / Backspace | Undo last route waypoint |
| ESC | Finish/cancel current drawing mode |

---

## Mouse/Touch Interactions

| Action | Result |
|--------|--------|
| Click star | Select star / Add to route / Set wormhole endpoint |
| Click empty | Deselect star |
| Drag canvas | Pan view |
| Scroll wheel | Zoom in/out |
| Hover star | Show tooltip |

---

## State Management

Use React hooks with the following state structure:

```typescript
interface CartographerState {
  galaxyName: string;
  config: GalaxyConfig;
  view: ViewConfig;
  display: DisplayConfig;
  camera: CameraState;
  targetCamera: CameraState;
  stars: Star[];
  backgroundStars: BackgroundStar[];
  empires: Empire[];
  tradeRoutes: TradeRoute[];
  wormholes: Wormhole[];
  selectedStar: Star | null;
  routeDrawing: { active: boolean; stars: Star[] };
  wormholeDrawing: { active: boolean; firstStar: Star | null };
}
```

---

## Default Values

```typescript
const DEFAULT_CONFIG: GalaxyConfig = {
  type: 'spiral',
  starCount: 8000,
  armCount: 4,
  armSpread: 0.35,
  seed: 42
};

const DEFAULT_EMPIRES: Empire[] = [
  { id: 1, name: 'Terran Federation', color: '#00D4FF', namingStyle: 'terran', centerX: -180, centerY: 0, radius: 320 },
  { id: 2, name: 'Krath Dominion', color: '#E74C3C', namingStyle: 'harsh', centerX: 220, centerY: -120, radius: 260 },
  { id: 3, name: 'Aelarian Collective', color: '#E056FD', namingStyle: 'flowing', centerX: 80, centerY: 220, radius: 280 },
  { id: 4, name: 'Storm Reach Alliance', color: '#2ECC71', namingStyle: 'poetic', centerX: -280, centerY: -220, radius: 230 }
];

const GALAXY_RADIUS = 450;
```

---

## Performance Considerations

1. **Star rendering** — Only render stars within viewport bounds + margin
2. **Label collision** — Limit to 30 labels max, use spatial hashing if needed
3. **Background stars** — Fixed count (600), parallax at 0.03× camera movement
4. **Animation loop** — Use requestAnimationFrame, smooth camera with lerp
5. **Large galaxy support** — Up to 25,000 stars tested

---

## Integration Notes

1. Follow StellarForge aesthetic guide exactly (fonts, colors, opacities)
2. Canvas background: `#050508` (slightly different from panel `#09090B`)
3. Use delta-time camera smoothing for consistent feel across framerates
4. All panels use glass-morphism with backdrop-filter blur
5. Status badge reflects current mode: "Mapping" / "Drawing Route" / "Placing Wormhole"

---

## Testing Checklist

- [ ] Galaxy generates correctly for all 4 types
- [ ] Seed produces reproducible results
- [ ] 3D rotation/tilt works full 360° both directions
- [ ] Star clicking works correctly with 3D projection
- [ ] Trade route drawing (manual + auto)
- [ ] Wormhole drawing (manual + auto)
- [ ] Territory opacity slider affects all empires
- [ ] All three border styles render correctly
- [ ] Habitable indicator toggle works
- [ ] Star renaming saves to state
- [ ] Galaxy naming appears in title and exports
- [ ] PNG export captures current view at 2×
- [ ] SVG export produces valid, scalable output
- [ ] JSON export includes all data
- [ ] Markdown export is properly formatted
- [ ] Zoom works via scroll and maintains center
- [ ] Pan works via drag
- [ ] Labels appear only at zoom ≥ 2.5× with collision detection
- [ ] Tooltip shows on star hover
- [ ] Empire click pans to empire center
- [ ] Auto-rotate functions smoothly

---

## Reference Implementation

The standalone HTML file at `/home/claude/stellar-cartographer-v4.html` serves as the complete reference implementation. All algorithms, visual effects, and interactions are implemented there and should be ported to React/TypeScript following this specification.

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
