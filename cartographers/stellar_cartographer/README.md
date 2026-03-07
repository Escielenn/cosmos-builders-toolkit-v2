# Stellar Cartographer — Claude Code Integration Guide

## Quick Start for Claude Code

This package contains everything needed to integrate the Stellar Cartographer tool into StellarForge.tools.

### Reference Implementation
The complete working implementation is in:
```
reference/stellar-cartographer-v4-reference.html
```
This is a standalone HTML file with all functionality. Use it as the authoritative source for all algorithms, visual effects, and behaviors.

---

## Integration Steps

### 1. Create the Component Directory
```bash
mkdir -p src/components/tools/StellarCartographer
```

### 2. Files to Create

```
src/components/tools/StellarCartographer/
├── index.ts                          # Export
├── StellarCartographer.tsx           # Main component
├── StellarCartographer.module.css    # Styles (SIMULATOR_AESTHETIC)
├── StellarCartographerCanvas.tsx     # Canvas rendering (optional split)
├── types.ts                          # TypeScript interfaces
├── constants.ts                      # Configuration values
├── hooks/
│   ├── useGalaxyGenerator.ts         # Galaxy generation logic
│   ├── useCamera.ts                  # Camera controls
│   └── useExport.ts                  # PNG/SVG/JSON/MD export
└── utils/
    ├── seededRandom.ts               # Deterministic RNG
    ├── starTypes.ts                  # Spectral class data
    ├── nameGenerator.ts              # Procedural naming
    └── colorUtils.ts                 # Color manipulation
```

### 3. Key Implementation Notes

**Canvas Setup:**
- Full viewport canvas with `#050508` background
- Use `requestAnimationFrame` for render loop
- Delta-time camera smoothing per SIMULATOR_AESTHETIC.md

**3D Projection:**
The critical function - must match the reference exactly:
```typescript
function project3D(x: number, y: number, z: number, rotation: number, tilt: number) {
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

**Star Click Detection:**
IMPORTANT: Use screen coordinates, not world coordinates:
```typescript
// Find clicked star by SCREEN position (accounts for 3D projection)
for (const star of stars) {
  const screen = worldToScreen(star.x, star.y, star.z);
  const dx = mouseX - screen.x;
  const dy = mouseY - screen.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 25) { // 25 screen pixels
    clicked = star;
    break;
  }
}
```

**Spiral Arm Generation:**
True logarithmic spiral - not parallel lines:
```typescript
const spiralTightness = 0.4;
const spiralAngle = armOffset + Math.log(distFromCenter / 20 + 1) * spiralTightness * Math.PI * 2;
```

---

## Feature Checklist

### Galaxy Generation
- [ ] Spiral (logarithmic arms with gaussian scatter)
- [ ] Barred Spiral (central bar + arms from ends)
- [ ] Elliptical (gaussian with flattening)
- [ ] Irregular (multiple random clusters)
- [ ] Deterministic seeding (same seed = same galaxy)
- [ ] Star count: 2,000 - 25,000

### Star System
- [ ] 7 spectral classes (O, B, A, F, G, K, M) with realistic distribution
- [ ] Per-star variation (brightness, luminosity, size, hue shift)
- [ ] Habitable world probability per class
- [ ] Empire-based naming with 4 styles
- [ ] Hot star glow effects (O, B, A)

### View Controls
- [ ] Rotation slider: -360° to +360°
- [ ] Tilt slider: -360° to +360°
- [ ] Auto-rotate toggle
- [ ] Reset view button
- [ ] Smooth camera pan/zoom

### Empire Territories
- [ ] 4 default empires with distinct colors
- [ ] Territory opacity slider (0-100%)
- [ ] Border style: Soft/Fuzzy, Sharp/Defined, None
- [ ] Click empire name to pan to center

### Trade Routes
- [ ] Manual drawing (click stars, Z to undo, ESC to finish)
- [ ] Auto-generate (5 routes, 4-8 waypoints each)
- [ ] Glow + dashed line + waypoint markers
- [ ] Clear all button

### Wormholes
- [ ] Manual drawing (click two stars)
- [ ] Auto-generate (2 wormholes, distant notable stars)
- [ ] Stable: slow pulse, concentric rings, crosshair
- [ ] Unstable: fast pulse, spinning spiral arms
- [ ] Curved connection line between endpoints

### Display Options
- [ ] Toggle territories
- [ ] Toggle routes
- [ ] Toggle habitable indicators (green rings)
- [ ] Labels at zoom ≥ 2.5× with collision detection

### Export
- [ ] PNG (2× resolution, watermark)
- [ ] SVG (vector, all elements as paths)
- [ ] JSON (full data export)
- [ ] Markdown (formatted documentation)

### Interaction
- [ ] Click star to select
- [ ] Hover for tooltip
- [ ] Drag to pan
- [ ] Scroll to zoom
- [ ] Rename selected star
- [ ] Rename galaxy

---

## Styling Reference

Follow SIMULATOR_AESTHETIC.md exactly. Key values:

```css
/* Backgrounds */
--bg-deep-space: #050508;      /* Canvas */
--bg-panel: rgba(15, 15, 16, 0.92);
--bg-panel-solid: #0F0F10;

/* Accent */
--accent-cyan: #00D4FF;
--accent-orange: #FFA500;
--accent-green: #2ECC71;
--accent-red: #E74C3C;
--accent-gold: #FFD43B;
--accent-purple: #9B59B6;

/* Text */
--text-primary: #FAFAFA;
--text-secondary: #C8C8C8;
--text-muted: rgba(255, 255, 255, 0.35);
--text-ghost: rgba(255, 255, 255, 0.18);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-cyan: rgba(0, 212, 255, 0.2);

/* Fonts */
--font-display: 'Space Grotesk', sans-serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**Button States:**
```css
/* Default */
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.1);
color: rgba(255, 255, 255, 0.6);

/* Hover */
background: rgba(0, 212, 255, 0.08);
border-color: rgba(0, 212, 255, 0.2);
color: #fff;

/* Active */
background: rgba(0, 212, 255, 0.1);
border-color: rgba(0, 212, 255, 0.3);
color: #00D4FF;
```

---

## Panel Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ STELLAR CARTOGRAPHER          [Canvas fills viewport]    Statistics │
│ STELLARFORGE.TOOLS                                       - Stars    │
│ Galaxy Name                                              - Habitable│
│ [MAPPED]                                                 - Routes   │
│                                                                     │
│ ┌──────────────┐                                   ┌──────────────┐ │
│ │ Control Panel│                                   │  Data Panel  │ │
│ │ (scrollable) │                                   │              │ │
│ │ 240px wide   │                                   │  260px wide  │ │
│ │              │                                   │              │ │
│ │ - Galaxy ID  │                                   │ Selected Star│ │
│ │ - Structure  │                                   │ - Name       │ │
│ │ - View       │                                   │ - Class      │ │
│ │ - Empires    │                                   │ - Habitable  │ │
│ │ - Routes     │                                   │ - Empire     │ │
│ │ - Wormholes  │                                   │              │ │
│ │ - Display    │                                   │ Spectral Key │ │
│ │ - Export     │                                   │ O B A F G K M│ │
│ └──────────────┘                                   └──────────────┘ │
│                                                                     │
│                    © 2025-2026 Jason D. Batt, Ph.D.        [1.00×]  │
│                                                             ZOOM    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

Before marking complete:

1. **Generate all 4 galaxy types** - verify spiral arms curve properly
2. **Rotate/tilt full 360°** - no visual glitches at extreme angles
3. **Click stars at various rotations** - selection works correctly
4. **Draw trade route** - manual with undo (Z key)
5. **Draw wormhole** - both endpoints register correctly
6. **Auto-generate routes and wormholes** - reasonable placement
7. **Export all 4 formats** - files download correctly
8. **Territory controls** - opacity slider and border styles work
9. **Labels appear** - at zoom ≥ 2.5× without overlap
10. **Mobile responsive** - panels collapse appropriately

---

## File Locations

| File | Purpose |
|------|---------|
| `STELLAR_CARTOGRAPHER_SPEC.md` | Full technical specification |
| `reference/stellar-cartographer-v4-reference.html` | Working implementation |
| `src/types/index.ts` | TypeScript interfaces |
| `src/utils/seededRandom.ts` | Deterministic RNG |
| `src/utils/starTypes.ts` | Spectral class data |
| `src/utils/nameGenerator.ts` | Procedural naming |
| `src/utils/colorUtils.ts` | Color manipulation |
| `src/constants.ts` | Configuration values |
| `src/components/StellarCartographer.tsx` | React component (partial) |

---

## Common Pitfalls

1. **Parallel spiral arms** — Use logarithmic spiral formula, not linear angle
2. **Click detection broken with rotation** — Must use screen coordinates, not world
3. **Stars too large at low zoom** — Use `Math.pow(zoom, 0.7)` not linear
4. **Labels overwhelming** — Max 30 with collision detection
5. **Wormholes not animating** — Need `Date.now()` in render loop

---

## Questions?

The reference HTML at `reference/stellar-cartographer-v4-reference.html` is the source of truth. When in doubt, check that file for the exact implementation.

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
