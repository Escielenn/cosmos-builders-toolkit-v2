# 14 · THE RENDER ENGINE — `forge-gl`

> Stellaris-level effects, in the browser, driven by canon.
> One engine, not five canvases. Written 2026-08-16. Proof: `design/forge-gl-proof.html`.

---

## 0 · What "Stellaris-level" actually means

Stellaris's look is not one effect. It's a *stack* that reads as a single place:

| Layer | What Stellaris does | What it is in WebGL |
|---|---|---|
| **Field** | tens of thousands of stars, depth, parallax | `Points` with a custom sprite shader, additive, size by distance |
| **Nebulae** | soft volumetric colour | layered billboards with procedural noise, or a cheap raymarch |
| **Stars** | corona, limb darkening, chromatic shimmer | sphere + back-face fresnel × 3D noise, animated |
| **Planets** | lit body, atmosphere rim, terminator, clouds | PBR sphere + fresnel shell + terminator softening |
| **Lanes & borders** | hyperlanes, soft territory regions | additive line segments; SDF-shaded territory mesh |
| **Post** | bloom, vignette, grain, lens | `EffectComposer`: `UnrealBloomPass` + a one-pass vignette/grain shader |
| **Camera** | galaxy → system → planet is *one* continuous move | a single scene with LOD, tweened camera, no page loads |
| **UI in the scene** | holographic panels that belong to the space | HUD as DOM over canvas, plane tokens at ~0.8 alpha + backdrop blur |

Every one of those is in the proof file, running at 60fps on a 30,000-star field, in ~220 lines. **The techniques are not the hard part.** The hard part is the decision below.

---

## 1 · The decision: one engine, canon in, pixels out

Today's five simulators are five canvases. Solaris has its own N-body renderer. ExoSky has its own sky. Rogue has its own. Add Stellaris-grade effects to each one separately and you've quintupled the shader code and guaranteed they never look like the same product.

**`forge-gl` is one engine.** A scene graph, a material library, a post stack, a camera controller. Every simulator and the Atlas view are *scenes* on it.

```
src/gl/
├── engine/        renderer, composer, camera rig, LOD, frame budget
├── materials/     StarMaterial · AtmosphereMaterial · NebulaMaterial ·
│                  LaneMaterial · TerritoryMaterial · SurfaceMaterial
├── scenes/        Galaxy · System · Planet · Sky (planetarium) · Encounter (N-body)
├── bind/          canon → scene: the ONLY place facts become uniforms
└── post/          bloom, vignette, grain, (later) chromatic, god-rays
```

### The rule that makes it StellarForge and not a demo

> **Every visual property is a function of canon. Nothing is hand-tuned per scene.**

| Uniform | Reads |
|---|---|
| star colour, corona intensity | `star.spectral_class`, `star.temp_effective` (black-body) |
| star flare activity (corona noise amplitude) | `star.flare_activity` |
| planet radius, orbit | `planet.radius`, `orbit.semi_major_axis` |
| atmosphere rim colour + thickness | `planet.atmo_composition`, `planet.atmo_pressure` |
| terminator softness | `planet.atmo_pressure` |
| tidal lock (no rotation; permanent day/night) | `orbit.tidally_locked` |
| surface albedo / type | `planet.surface_type`, `planet.albedo` |
| hyperlanes | `route.*` between systems |
| territory fill + border | `polity.territory[]` at the current epoch |
| sky (planetarium) star positions | `astro.ts` — already correct, already tested |
| constellation overlays | `planet.sky.constellations[]` from Mythos |
| encounter trajectories | Rogue's N-body output |

That table is why this is Law VI made visible: **simulation is canon-generating, and the render is a view of the graph.** Change `planet.atmo_pressure` in Genesis and the rim on the Atlas thickens. Rogue ejects a moon and its orbit line detaches on screen. Scrub the epoch and territory borders move.

`bind/` is the only module allowed to read canon. Materials take uniforms. Scenes take bound data. No shader ever knows what a worksheet is.

---

## 2 · The effect catalogue

Tiered by what it does for a *writer*, not by how impressive it is.

### Tier 1 — the ones that carry meaning

- **Black-body star colour.** A K-dwarf is orange, an M-dwarf red, an F white-blue. The writer sees their star's *class* before reading it. In the proof: `kelvinToRGB(star.temp_effective)`.
- **Corona.** Fresnel × 3D noise, animated. Amplitude from `flare_activity` — a flare star *looks* dangerous.
- **Atmosphere rim.** Fresnel shell, colour from composition (CO₂ amber, N₂/O₂ blue, methane orange-brown, none = hard limb). Thickness from pressure. In the proof: the `AtmosphereMaterial`.
- **Terminator.** Sharp on airless bodies, soft on thick atmospheres. A tidally-locked world shows a *fixed* terminator — the band where everything lives, visible as geography.
- **Territory regions.** SDF-shaded soft borders in polity colour. Borders that move when you scrub the epoch are Chronicle-as-axis made literal.
- **Hyperlanes.** Additive lines, animated dash for active routes. Distance → travel time via Paradox appears on hover.

### Tier 2 — the ones that make it feel like a place

- **Bloom** — the single biggest Stellaris tell. `UnrealBloomPass`, strength ~0.5, threshold ~0.75. Too much and the star clips to white (the proof shows this; production uses limb-darkening to keep colour in the core).
- **Nebulae** — three layered noise billboards, hue from a seed on the galaxy entity. Cheap, parallaxes with the camera.
- **Depth parallax** — the star field is *behind* the system, and moves less. Two-layer minimum.
- **Vignette + grain** — one shader pass. Ties into `--sf-ambient` (see §4).
- **The continuous camera** — galaxy → click a system → the camera *flies* there and the system scene fades in under it. Never a route change with a spinner. This is the thing that makes it feel like one universe.
- **Selection glow** — the hovered/selected body gets a rim in `--sf-primary`. Theme-aware.

### Tier 3 — later, when the above is solid

- **Lens flare / anamorphic streak** on the star, camera-relative
- **God rays** from the star through nebula — expensive; gate behind a quality setting
- **Ring systems, moons, asteroid belts** as instanced particles from Orrery data
- **Clouds** as a second sphere with scrolling noise, opacity from `hydrosphere_fraction`
- **City lights on the night side** when `polity.population` on the planet > threshold — a *story* in one texture
- **Ship trails / fleet markers** once Vessel entities have positions
- **Chromatic aberration** at screen edges — subtle, optional, off by default
- **WebGPU path** when three.js's WebGPU renderer stabilises — same scenes, faster

---

## 3 · Performance budget — non-negotiable

Effects that make the writing tool stutter are effects that get turned off. Budget first, effects second.

| Constraint | Value |
|---|---|
| Frame budget | 16ms, and the *Studio* must never drop a frame because a canvas is mounted somewhere |
| Canvas lifecycle | **Unmount** when the Atlas/sim isn't visible. No hidden canvases rendering. |
| Pixel ratio cap | `min(devicePixelRatio, 2)`; 1.5 on integrated GPUs (detect via `WEBGL_debug_renderer_info` or a 1-second benchmark) |
| Star count | 30k on desktop, 8k on mobile, LOD by camera distance |
| Bloom resolution | half-res render target. Full-res bloom is the classic mistake. |
| Quality tiers | `cinematic` / `standard` / `chart` — auto-selected, user-overridable in Display settings |
| `prefers-reduced-motion` | no camera drift, no corona animation, no dash animation. Static is fine; nauseating isn't. |
| `--sf-ambient: 0` | grain off, vignette off, nebulae off, bloom down to 0.2 |
| Memory | dispose geometries/materials on scene change. Leaks in three.js are the norm, not the exception — test for them. |

**The Chart tier is not a fallback — it's a feature.** On light themes and on low-end hardware, the Atlas becomes a *star chart*: lines and dots on paper, no bloom, no grain, orbit rings as ink. That's a beautiful mode in its own right and it's what a 1950s astronomy plate looks like. Design it deliberately.

---

## 4 · Theme integration

The engine reads the *same tokens* the DOM does.

| Token | Drives |
|---|---|
| `--sf-void` | `scene.background` and fog colour |
| `--sf-primary` | selection rim, hover glow, active lane |
| `--sf-line` / `--sf-line-interactive` | orbit rings, grid, chart-mode ink |
| `--sf-amber` / `--sf-crimson` / `--sf-stellar` / `--sf-violet` | semantic overlays: physics warnings on a body, Stop markers, Worlds selection, Lore pins |
| `--sf-ambient` | post-stack intensity |
| `color-scheme: light` | switches to **Chart** tier automatically |

Read tokens from `getComputedStyle(document.documentElement)` once per theme change (listen for `data-theme` mutation), convert to `THREE.Color`, push to uniforms. Do **not** hardcode a colour in a shader.

On light themes, bloom on a white page is a smear. Chart tier: no bloom, stars as dark points sized by magnitude, the star as a ringed disc, atmosphere as a thin coloured line. It should look like it was drafted.

---

## 5 · Where it lives in the IA

`forge-gl` powers exactly these surfaces from `13-THE-LIFT.md`:

| Surface | Scene | Notes |
|---|---|---|
| **Codex → Atlas view** | Galaxy → System → Planet, continuous | the primary home of the engine. Cartographer's successor. |
| **Orrery** (with Solaris as its generate mode) | System | the same System scene, with editing handles |
| **Genesis** (with ExoForge as its generate mode) | Planet | close orbit, surface + atmosphere |
| **ExoSky** | Sky (planetarium) | ground-up view; `astro.ts` drives positions; constellation overlays from Mythos |
| **Rogue** | Encounter | N-body trajectories rendered as trails; ejected bodies visibly detach |
| **Tidelock** | Planet, locked | the fixed terminator as geography; temperature gradient as a heat overlay |
| **StellarBackground** | Field only | the app-wide ambient starfield becomes a *very* cheap `Points` layer — 2k stars, no post — or stays CSS. Measure; don't assume. |

Every instrument opens *on an entity* (F4), so the scene always has canon to bind. There is no "empty scene" state to design.

---

## 6 · Sequencing — Block G

Slots after Block F (the Atlas view exists as a destination) and alongside Block C (the sims publish entities the engine can render).

| # | Session | Size | Ends with |
|---|---|---|---|
| G1 | Engine core: renderer, composer, camera rig, quality tiers, token binding, dispose discipline | ~1 week | a blank scene that respects theme + ambient + reduced-motion |
| G2 | Materials: Star (corona, black-body), Atmosphere, Surface | ~1 week | the proof, as components, bound to a real planet entity |
| G3 | System scene → Orrery + Atlas system level | ~1 week | click a planet in the Atlas, camera flies in |
| G4 | Galaxy scene → Atlas top level; Field + Nebulae + Lanes + Territory | ~2 weeks | the Stellaris shot |
| G5 | Sky scene → ExoSky on the engine; constellation overlays | ~1 week | precession (C4) now renders |
| G6 | Encounter scene → Rogue on the engine | ~1 week | ejection is visible |
| G7 | Chart tier + light themes + perf pass on integrated GPUs | ~1 week | it works on a MacBook Air on Paper·Teal |

**Do not start G before F5 exists.** An engine without a destination is a tech demo. The Atlas view is the destination.

---

## 7 · Briefs

### Brief G1 — engine core

```
Read docs/stellarforge/14-RENDER-ENGINE.md §1, §3, §4. Look at
design/forge-gl-proof.html for the techniques, but do NOT copy it — it's a
single-file demo, not architecture.

Build src/gl/engine/:

1. Renderer — one WebGLRenderer, ACES tone mapping, pixel ratio capped per §3.
   Mounts into a container; UNMOUNTS and disposes when the container leaves
   the DOM. Write the dispose test first.
2. Composer — RenderPass + UnrealBloomPass (half-res) + one vignette/grain
   ShaderPass. Bloom strength and grain read var(--sf-ambient).
3. Quality tiers — cinematic / standard / chart. Auto-select by a 1s
   benchmark; override from Display settings; force `chart` when
   color-scheme is light or prefers-reduced-motion.
4. Token binding — read --sf-void, --sf-primary, --sf-line, the four
   semantic accents from computed style; re-read on data-theme change;
   expose as a `useThemeUniforms()` hook.
5. Camera rig — a controller with `flyTo(target, distance, ms)` using the
   design system's ease-sf-out. No spring physics.

Constraints:
  - Use @react-three/fiber + drei for React integration; raw three for
    materials.
  - No hardcoded colours anywhere in src/gl/. /sf-contrast will grep for hex.
  - A mounted engine must add < 2ms to the Studio's frame time when the
    Studio is the active view — meaning it isn't mounted at all.

Stop and show me the dispose test and the tier benchmark before materials.
```

### Brief G2 — the three materials

```
Read docs/stellarforge/14-RENDER-ENGINE.md §1 (the binding table) and §2 Tier 1.

Build src/gl/materials/ and src/gl/bind/:

1. StarMaterial — sphere + back-face corona (fresnel × 3D noise). Colour from
   a black-body function of star.temp_effective. Add LIMB DARKENING so the
   core keeps its colour under bloom (the proof clips to white — fix that).
   Corona noise amplitude from star.flare_activity.
2. AtmosphereMaterial — fresnel shell. Colour from a composition → colour map
   (CO2 amber, N2/O2 blue, CH4 orange-brown, none → no shell). Thickness
   from atmo_pressure. Terminator softness from the same.
3. SurfaceMaterial — MeshStandard with albedo from planet.albedo and a
   procedural noise map keyed by surface_type. Tidally-locked bodies do not
   rotate.
4. bind/planet.ts and bind/star.ts — the ONLY code that reads canon. Takes
   an entity id, returns a uniforms object. Everything else is pure.

Test: render Kellis Prime (K4V, 0.6 bar N2/CO2, tidally locked) and screenshot.
Then change atmo_pressure to 1.4 in canon and screenshot again. The rim
must visibly thicken. That's the whole point.
```

---

## 8 · What this is not

- **Not a game engine.** No physics tick in the renderer. Rogue's N-body runs in a worker and hands the engine positions.
- **Not a replacement for the writing space.** The Studio never mounts a canvas. If a writer wants the sky while writing, it's a small still image in the rail, generated on demand.
- **Not hand-tuned per world.** If a world looks wrong, the fix is in canon or in `bind/`, never in a scene file.
- **Not blocking.** Every scene has a Chart-tier fallback that is *good*, not apologetic.
