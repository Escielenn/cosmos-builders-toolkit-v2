# Simulator Rendering and Reach

**Written 2026-08-14, at v0.7100.** Supersedes the sequencing in
[`2026-08-12-simulator-uplift.md`](2026-08-12-simulator-uplift.md), which is now
largely delivered. Everything below is grounded in a measurement recorded here,
not in an assumption about what is slow or missing.

---

## 1. Where things actually stand

| | Status |
|---|---|
| Simulators reaching the writing surface | **5 of 5** |
| Tools reaching it | **18 of 23** |
| Tests | **299**, from 93 at the start of the session |
| Type errors / eslint | 254 / 62 errors, 73 warnings, both at baseline |
| Native rebuilds | Solaris (`/dev/solaris`), Rogue (`/dev/rogue`) |
| Still iframes | Tidelock, ExoForge, and the live Rogue and Solaris routes |
| Pro gating | **ExoSky and Solaris temporarily ungated** (0.7100) |

Physics and astronomy are now under test where they were not: `nbody.ts` (33),
`rogue-systems.ts` (39), `astro.ts` (38), `trail-buffer.ts` (13).

---

## 2. Task R: ExoSky rendering (the priority)

**Reported:** "it stutters when attempted to rotate and pan and zoom, the
stuttering makes it lose cohesion."

**Confirmed, and located in code.** `ExoSkySimulator.tsx` draws the Milky Way
with a per-pixel double loop across the whole canvas:

```
const step = Math.max(2, Math.floor(4 * (_fov / 90)));
for (let sx = 0; sx < W; sx += step)
  for (let sy = 0; sy < H; sy += step)
```

At 1920x1009 with a 90 degree field that is a step of 4, so roughly **121,000
iterations per redraw**. Each one runs a normalise, an `eqToGal` matrix multiply,
an `asin`, an `atan2`, a texture sample, and then a `fillRect` whose `fillStyle`
is a **freshly constructed `rgba()` string**. That is ~121,000 string
allocations and style parses per redraw.

The redraw condition includes `viewRa`, `viewDec` and `fov`. **So it re-runs on
every frame in which the camera moves**, which is exactly and only when the user
is rotating, panning or zooming.

### R-1: DONE, and it withdrew the diagnosis above

The loop is now instrumented (0.7110): `?profile=1`, then read
`window.__exoskyProfile()` for a rolling median per stage over 120 frames.

**The claim that the Milky Way causes the stutter is withdrawn.** The mechanism
in the code is real, but the evidence was not: the drag I measured never rotated
the view. RA/Dec read identically before and after, so every "while dragging"
figure, including the 1000 ms frames, was an idle canvas.

Measured per stage, headless:

```
clear             0.0 ms
milkyWay          0.1 ms
backgroundField   4.7 - 7.6 ms   <- 80% of the frame
skyGradient       0.0 ms
horizon           0.5 ms
grid              0.0 ms
constellations    0.1 ms
stars             0.2 ms
                  ---------
total             5.9 - 8.5 ms
```

Two conclusions. The entire JS draw fits inside a 16 ms budget, so the 700 to
1000 ms frames measured here are **not** explained by this code and are an
artefact of headless software rasterisation at 1920x1009. And the dominant cost
is the **dense background star field**, not the Milky Way.

The Milky Way is *untested*, not cleared: sweeping the two sliders in its redraw
condition left it at 0.1 ms, which suggests the block is skipped at its
`_mwReady` gate rather than running cheaply.

- [ ] **Run `?profile=1` on real hardware and drag the sky.** That is the number
      that decides R-2 and R-3, and nothing measured in a headless browser can
      stand in for it. Record the result here.

### R-1b: What the stage numbers already point at
- [ ] `backgroundField` is 20,000 procedural points behind a spatial-bucket
      index. At 5 to 8 ms it is the first candidate regardless of what real
      hardware says. Check whether the bucket lookup is actually culling, or
      whether it walks most of the field every frame.

### R-2: Cheap wins, likely large
- [ ] **Write pixels, not rects.** Replace the 121k `fillRect` calls and their
      `rgba()` strings with a single `ImageData` buffer written directly and one
      `putImageData`. This alone is typically an order of magnitude.
- [ ] **Progressive refinement.** Use a coarse step (8 to 12) while the camera is
      moving and refine to the fine step once it settles for ~150 ms. The user
      cannot see detail mid-drag, and this is what makes map applications feel
      instant.
- [ ] **Decouple the redraw from the frame.** The Milky Way only needs
      recomputing when the view changes materially; small deltas can reuse the
      cached bitmap with an offset rather than a full recompute.

### R-3: The rebuild question
Only after R-1. A rebuild is justified **if** profiling shows the cost is spread
across every stage rather than concentrated. In that case the target is WebGL:
the sky is a textured sphere seen from inside, which is one draw call rather than
a per-pixel loop, and the constellation lines are a line list. Solaris already
uses R3F, so the dependency and the pattern exist.

Do not start here. `astro.ts` is already extracted and tested, so a renderer
swap cannot alter the astronomy, which is the part that would have been
dangerous.

---

## 3. Task S: finish what the simulators promise

- [ ] **Rogue custom system builder.** The original's whole overlay for composing
      a system rather than picking a preset. The largest remaining parity gap.
- [ ] **Rogue share-by-URL**, which encodes a system in the link.
- [ ] **Gravity vectors**, distinct from the gravity lines already drawn.
- [ ] **Mobile.** Unverified on every simulator. The parity doc measured Solaris
      at scrollWidth 585 against clientWidth 390, and nothing has re-checked it.
- [ ] **Solaris science page**, still the only simulator without one.
- [ ] Then flip `/tools/rogue` and `/tools/solaris` to the native builds, keeping
      the static files one release beyond the cutover.

---

## 4. Task T: the rest of the reach

- [ ] Five tools still dark: `sensorium`, `stellar-cartographer`, `timeline`,
      `writing-workshop`, and `environmental-chain-reaction`. The last is a
      deliberate exception, feeding prose through `useWorldParameters` and the
      Tier 2 continuity rules rather than as numeric facts. The other four need
      their persisted shapes read and mapped, exactly as 0.7010 and 0.7070 did.
- [ ] **Feed simulator facts to the continuity engine**, not just the Refs panel.
      `ContinuityPanel` still reads worksheets only, so a Tidelock save saying the
      day side is 391 K cannot contradict prose that calls it temperate. This is
      the single highest-value integration left.

---

## 5. Decisions waiting on the owner

- [ ] **Restore the Pro gate** on ExoSky and Solaris when the runtime work is
      done. While it stands, two Pro tools are free to everyone. One line each,
      marked in `App.tsx`.
- [ ] **`public/video`, 901 MB.** A Dropbox online-only placeholder there breaks
      every local `vite build` at the asset-copy stage, after the module graph
      has compiled. Gitignored, so production is unaffected. The fix is moving it
      out of the repo, which is the owner's data and the owner's call.
- [ ] **Collaborator access to `simulation_saves`** (T-1 in
      [`2026-08-12-one-source-of-truth.md`](2026-08-12-one-source-of-truth.md)).
      Owner-only today, so a collaborator on a shared world sees no simulations
      at all. May be deliberate; if so the fix is the panel's wording, not the
      policy.

---

## 6. Gates

Unchanged and non-negotiable: **299+ tests passing, type errors at the 254
baseline, eslint `src` at 62 errors and 73 warnings, `typecheck-strict` clean.**

Two additions earned this session:

- **Measure the thing, not a shadow of it.** Twice a bad proxy nearly became a
  bug report against working code: inferring zoom from label spacing, and reading
  a stale `window.__rogueDev` whose methods close over per-render values. Read
  the real state.
- **Verify UI in the browser, not in the source.** A grep for Tailwind classes
  found a third of the small-type problem; the rest was in CSS files and inline
  `fontSize` numbers, and only computed styles on live elements revealed it.
