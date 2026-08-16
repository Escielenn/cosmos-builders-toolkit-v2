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
| Tools reaching it | **20 of 23**, the other 3 by design (§4) |
| Tests | **326**, from 93 at the start of the session |
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

## 4. Task T: the rest of the reach — DONE (0.7120, 0.7140)

- [x] **Simulator facts feed the continuity engine** (0.7120). Five conservative
      equivalences; a simulator number that merely resembles a check stays out.
- [x] **`sensorium` mapped** (0.7140): three new `species` master fields for the
      narrative pair prose contradicts most, dominant sense and blind spot.
- [x] **`timeline` mapped** (0.7140) through a bespoke extractor, because a list
      of events is the one shape `worksheetPaths` cannot describe.

**The other two were never gaps**, and the list above was wrong to imply it:

- `writing-workshop` persists nothing. Zero references to `createWorksheet`,
  `useWorksheet` or `supabase`; it is a prompt browser that reads worlds.
- `stellar-cartographer` publishes straight to `world_entries`, so its output
  is entity metadata and never becomes a worksheet. It reaches worlds already.
- `environmental-chain-reaction` remains the deliberate exception, feeding
  prose through `useWorldParameters` and the Tier 2 rules.

Tools reaching the writing surface: **20 of 23**, and the remaining three are
exceptions rather than a backlog. The coverage test now asks `hasFactMapping`
rather than reading the `worksheetPaths` table underneath it.

---

## 4b. Task P: publishing carried nothing — DONE (0.7130)

Reported: publishing any simulator to a world produced a bare title and empty
notes. Three bugs on one symptom, none of them in the simulators.

`pendingPayload` is a mailbox, not a getter: it only fills when a
`STELLARFORGE_SAVE` message *arrives*, which only happens on Save. Publish read
it directly, got `null`, and the dialog writes `payload?.parameters ?? {}`.
Verified in-browser that Solaris answers a state request with 16 fields and
ExoSky with 6 — nobody was asking. Also: `createSave` cleared the payload on
success (so save-then-publish sent nothing) and invalidated the wrong world's
query; and the saves list was scoped to a `worldId` that is absent when a
simulator is opened from the tools index.

**Trap worth remembering:** the `STELLARFORGE_PUBLISH` listener the pages carry
has five listeners and **no sender anywhere**. The real entry point is the
toolbar button's `onClick`. Grep for senders before fixing a message path.

- [ ] ExoForge, Tidelock and Rogue are Pro-gated, so the publish fix is verified
      live only on Solaris and ExoSky. The other three share the iframe
      mechanism Solaris proved and implement the protocol, but that is inference.

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

Unchanged and non-negotiable: **326+ tests passing, type errors at the 254
baseline, eslint `src` at 62 errors and 73 warnings, `typecheck-strict` clean.**

Two additions earned this session:

- **Measure the thing, not a shadow of it.** Twice a bad proxy nearly became a
  bug report against working code: inferring zoom from label spacing, and reading
  a stale `window.__rogueDev` whose methods close over per-render values. Read
  the real state.
- **Verify UI in the browser, not in the source.** A grep for Tailwind classes
  found a third of the small-type problem; the rest was in CSS files and inline
  `fontSize` numbers, and only computed styles on live elements revealed it.
