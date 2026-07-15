# Solaris Native Rebuild — M6: Parity Check & Cutover Proposal

**Status:** Proposal — awaiting Jason's sign-off. **No cutover executed.**
**Branch:** `feat/solaris-native-rebuild` (M0–M5 complete)
**Live today:** `/tools/solaris` → `SolarisSimulator.tsx` → `<iframe src="/tools/solaris/sim.html">` (A, 2,401-line static HTML). **Untouched.**
**Rebuild:** `/dev/solaris` → `SolarisNativeDev.tsx` → `SolarisViewer` (B, native React/R3F).

---

## 1. Headline

**B is ahead of A on physics, science, rendering, determinism and save fidelity — but B is NOT yet at feature parity on controls.** A has a meaningful set of generator controls, display overlays and explainer content that B does not have. Cutting over today would be a **regression** for users who rely on those.

**Recommendation: do not flip `/tools/solaris` yet.** Close the P0 gaps in §2, verify the three open items in §4, then flip via §5.

---

## 2. Feature-by-feature parity vs A

Legend: ✅ parity · 🟢 B better · 🟡 partial · ❌ missing in B

### 2.1 Physics & science
| Feature | A | B | |
|---|---|---|---|
| Single-star Keplerian orbits | analytic (Newton–Raphson) | analytic, exact | ✅ (verified to machine precision, 4e-16) |
| Multi-star N-body (Velocity Verlet + adaptive substeps) | yes | yes | ✅ ported |
| Gravity mass source | **luminosity used as a mass proxy** | real stellar mass | 🟢 |
| Unit system | arbitrary "14 sim-second" calibration | real AU / yr / M☉ (G=4π²) | 🟢 |
| Binary barycenter | stars placed symmetrically (ignores mass ratio) | mass-weighted | 🟢 |
| Habitable zone | per-bucket constants × √ΣL (labelled Kopparapu, actually simplified) | rigorous Kopparapu (2013) 4-boundary polynomial + combined multi-star | 🟢 |
| HZ vs orbital bands | mismatched for K/M dwarfs (no in-zone worlds) | bands anchored to real HZ | 🟢 (fixed) |
| Shell-theorem circular seeding | yes | yes | ✅ |
| Ejection guard | yes | yes | ✅ |
| Holman–Wiegert outer stability limit | yes | yes | ✅ |
| Energy stability | — | drift 1.3e-7 / 100 orbits; circumbinary bounded 500 yr | 🟢 measured |

### 2.2 Generation
| Feature | A | B | |
|---|---|---|---|
| 5 star buckets, uniform pick | yes | yes | ✅ |
| ~26–30 planet archetypes + narrative meta | yes | all ported | ✅ |
| Band-based orbit placement | yes | yes (HZ-anchored) | 🟢 |
| Seeded determinism (same seed → same system) | **no** (Math.random) | yes | 🟢 |
| Star mode single/binary/trinary/quaternary | yes | yes | ✅ |
| **Named architecture presets** (tri_31, tri_22_1, quad_22, quad_31 + notes) | yes (5 presets) | one generic hierarchical model | ❌ |
| **Per-companion star type pickers** (a/b/c/d) | yes | primary only (via opts); companions random | 🟡 |
| **Generation conditions** (force habitable / gas giant / tidal-lock / rogue) | yes | none | ❌ |
| **Separation sliders** (bsep/csep/dsep) | yes | randomized, no UI | ❌ |
| **Planet-count slider** | yes | 4–8 random (opts only, no UI) | ❌ |
| Asteroid belt at generate | checkbox | generator supports it; no UI checkbox | 🟡 |
| **System name input / rename** | yes | seed-derived only | ❌ |
| **Oort cloud** (Hills + outer cloud, comets w/ tails, density/size/scale) | yes | none | ❌ |

### 2.3 Rendering
| Feature | A | B | |
|---|---|---|---|
| Renderer | 2D canvas (pseudo-3D) | true 3D WebGL (R3F) | 🟢 |
| Spheres, atmospheres, rings, coronas, moons, axial tilt | flat discs | full 3D | 🟢 |
| Orbit camera (pan/zoom/rotate) | pan/zoom only | full orbit + damping | 🟢 |
| Star glow / corona | yes | yes | ✅ |
| Orbital paths / HZ overlay / labels / moons | yes | yes | ✅ |
| Asteroid belt render | yes | yes (instanced) | ✅ |
| **Trails** | yes | none | ❌ |
| **Gravity-vector display** | yes | none | ❌ |
| **Rotation display + per-planet rotation controls** (tidal-lock / retrograde / speed) | yes | planets spin; no controls/toggle | 🟡 |
| **Star-name toggle / star-brightness slider** | yes | none | ❌ (minor) |
| **Per-planet gradient icon** (info panel) | yes | none | ❌ (minor) |
| Zoom readout | yes | none | ❌ (minor) |

### 2.4 Camera & playback
| Feature | A | B | |
|---|---|---|---|
| Free / star / planet camera | yes | yes | ✅ |
| **Play / pause** | yes | none | ❌ |
| Speed control | 7 steps (0.1–10×) | 4 steps (0.1/1/10/100×) | 🟡 |
| Fit-to-system | on generate | on mount/Generate; no refit button | 🟡 |

### 2.5 Editing
| Feature | A | B | |
|---|---|---|---|
| Planet palette (drag-drop add) | yes | yes (click **and** drag) | ✅ |
| Resize planet | display size | physical radius (R⊕) | ✅ |
| Mass slider | derived | explicit | 🟢 |
| Eccentricity slider | n/a (circular orbits) | yes | 🟢 |
| Rings toggle | by type | per-planet toggle | 🟢 |
| Moons add/remove/resize | yes | yes | ✅ |
| **Moon detail panel** (A's fuller moon editor) | yes | size only | 🟡 |
| **Reorbit planet** (orbit-radius slider) | yes | none | ❌ |
| **Rename planet** | yes | none | ❌ |
| **Rotation controls** (normal/tidal/retrograde + speed) | yes | none | ❌ |
| Remove planet | yes | yes | ✅ |
| **Rich info panel** (life/water/atmo/temp/hazard/resources/gravity/rotation/orbit-AU + world note) | yes | data **is preserved** (`PlanetData.meta`) but **not displayed** | ❌ (display only — cheap to close) |

### 2.6 Persistence
| Feature | A | B | |
|---|---|---|---|
| Save / Load via `simulation_saves` | yes | yes (same shared hook) | ✅ |
| Publish to world | yes | wired (needs world context) | 🟡 |
| **Save fidelity** | settings-recipe; re-rolls a new system on load; **loses all edits** | exact restore incl. edits/moons/rings/multi-star/meta | 🟢 |
| A→B and B→A compatibility | — | verified 29/29 | ✅ |
| `spdIdx` in save | live value | writes default 10× (speed not lifted out of viewer) | 🟡 (cosmetic) |
| Narrative-bridge panel | on the live wrapper | not on dev route | 🟡 (cutover item) |

### 2.7 Explainers & mobile
| Feature | A | B | |
|---|---|---|---|
| **"Show your work" math overlay** (formulas, integrator explanation, Kopparapu reference, per-body math) | yes (~400 lines) | none | ❌ (notable) |
| Science page | **neither** has one | — | pre-existing gap (plan S3: "author the Solaris science page") |
| Mobile | iframe w/ own touch context | 3D renders fine; **desktop-fixed panels collide + overflow** (scrollW 585 vs clientW 390) | ❌ |

---

## 3. Perf pass

**What is measured and true:**
- **Code-splitting (S1 requirement) — met.** `vendor-three` = **828 KB** in its own lazy chunk; `SolarisNativeDev` = **47 KB** lazy chunk; the **797 KB main bundle contains no three.js**. Solaris only downloads three.js when the route is opened.
- **Per-frame React re-render eliminated (the S1 win banked in M3).** Positions were previously pushed through `setState` every frame, re-rendering the whole scene subtree at 60 fps. They are now mutated imperatively inside `useFrame`; React re-renders only on real state changes (selection, toggles, edits). This also fixed the software-WebGL context loss on multi-star scenes.
- **Integrator cost is bounded.** Adaptive substeps cap at ~2% of the shortest orbit (~6–19 substeps/frame); a 600-frame binary run completes instantly in a node harness with zero NaN/ejections.

**What is NOT verified — flagged, not fabricated:**
- ⚠️ **Real frame rate is unmeasured.** The headless harness runs software WebGL (SwiftShader) and its rAF-based FPS probe returned mutually contradictory results (0 / 29 / 40 fps across runs) while the scene demonstrably animates. Those numbers are untrustworthy and are **not** reported as a result. **Real FPS must be measured on actual GPU hardware before cutover** (plan budget: 60 fps desktop / 30 fps floor mid-tier mobile).

---

## 4. Open items to verify before cutover
1. **Real-hardware FPS** on desktop + a mid-tier phone, against the plan's 60/30 budgets.
2. **Click-to-select a planet in a real browser.** The pipeline is verified (selection → editor → live edit) and larger invisible hit-areas were added, but blind pixel-clicks in the headless harness couldn't confirm the raycast itself.
3. **Mobile layout** — currently not usable (see §2.7).

---

## 5. Cutover proposal (for sign-off — NOT executed)

### 5.1 What actually flips
A **single file**: `src/pages/simulators/SolarisSimulator.tsx`.

- **Today:** renders `<iframe src="/tools/solaris/sim.html">` + Header + NarrativeBridgePanel + Save/Load/Publish + `SimulatorWorldEntityPicker`, wired via `useSimulationSave({ simulatorType:"solaris", worldId, iframeRef })`.
- **After:** the iframe is replaced by `<SolarisViewer>` + `<SolarisEditPanel>`; everything else stays. `useSimulationSave` is called **without** `iframeRef` (component mode), and the page adds the STELLARFORGE window-event bridge already proven in M5.

The route path `/tools/solaris` and its `ProToolGuard toolId="solaris"` do **not** change. Users see the same URL.

### 5.2 What happens to the old static HTML
**Nothing is deleted.** `public/tools/solaris/sim.html` stays on disk and stays deployed:
- it remains directly reachable at `/tools/solaris/sim.html`,
- it is the rollback artifact,
- proposed: also expose it at `/tools/solaris/legacy` for one release so users (and Jason) can A/B compare.

Delete only after a clean soak window — mirroring the plan's "never drop before the new model is proven" rule.

### 5.3 Rollback path
- **Primary:** revert the single wrapper commit → the iframe returns. Because the static HTML was never removed, rollback is a one-file revert + deploy.
- **Fastest:** Vercel "promote previous deployment" — instant, no code change.
- **Optional safety:** gate the swap behind `VITE_SOLARIS_NATIVE` so the wrapper can render either path; flipping the env var + redeploy reverts without touching code.
- No database state is involved in rollback (see 5.4), so rollback is **stateless and instant**.

### 5.4 Risk to existing user saves — LOW
- **No schema change, no migration.** M5 added only an extra key *inside* the existing `data` jsonb column.
- **Existing A saves keep working after cutover:** B reads A's settings and regenerates — which is precisely what A itself does with its own saves today. **Users see no behavioural change** when loading an old save.
- **New B saves keep working if we roll back to A:** verified against A's real loader guards (types, and that `starChoices` resolve to real A star keys — a bad value there would crash A's `doGen`). A ignores the extra `sf2System` key.
- **Only nuance:** an A-era save can never restore a *specific* system (A never stored one). B doesn't fix old saves retroactively — it just stops the data loss going forward.
- Risk if we roll back *after* users create B saves with edits: those saves still load in A, but A will re-roll the system and drop the edits — i.e. A behaves like A. No data is lost from the row; A simply can't express it.

### 5.5 Recommended sequence
1. **Close P0 parity gaps** (below) on the branch.
2. Verify §4 open items.
3. Ship native to `/tools/solaris/beta` (or keep `/dev/solaris`) for Jason's hands-on trial.
4. On Jason's approval: flip the wrapper, keep `sim.html` deployed + `/tools/solaris/legacy` for one release.
5. Soak one week (Sentry-tagged release). Then consider retiring the HTML.

### 5.6 Suggested gap triage
- **P0 (block cutover — user-visible regressions):** rich info-panel display (data already stored — cheap), play/pause, planet-count + separation + star-type generation controls, system/planet rename, reorbit slider, mobile layout.
- **P1 (fast-follow):** math "show your work" overlay, trails, rotation controls, named architecture presets, conditions, speed-step parity, `spdIdx` wiring, narrative-bridge on the native page.
- **P2 (nice-to-have):** Oort cloud, gravity vectors, star-brightness, per-planet icon, zoom readout.
- **Separate track (plan S3):** author the Solaris science page — missing in *both* A and B.

---

*Prepared for Jason's sign-off. Live `/tools/solaris` remains on the original static-HTML sim; nothing has been cut over.*
