# Simulator Uplift Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Bring all five simulators to the standard of the rest of the product: native React, token-native, mobile-capable, saveable, and connected to the writing surface.

**Relationship to StellarForge II:** this is the execution plan for **Track S** (`STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md` §3.7), which already settled the direction: a *full overhaul*, not a re-skin, on the "beautiful / smooth / effective" axes (S1–S3), with **OQ6 recommending Rogue be rebuilt natively** rather than re-themed in place. Nothing here re-opens those decisions. What this adds is the verified per-simulator state, which changes the sequencing.

---

## 1. Verified current state (measured 2026-08-12)

Track S was written as "five ground-up redesigns." That is no longer accurate, and the difference matters for sequencing:

| Simulator | Implementation | Payload | Status |
|---|---|---|---|
| **Exosky** | **Native React** — `src/components/simulators/ExoSkySimulator.tsx`, 1,863 lines, lazy-loaded | in-bundle, code-split | **Converted, and its persistence was broken until 0.6950.** See §1a before copying it. |
| **Solaris** | iframe → `public/tools/solaris/sim.html` (2,241 lines) | 137 KB static | **Native rebuild already built** (24 components in `src/components/solaris/`, dev route `/dev/solaris`, M1–M6 done). Awaiting cutover sign-off. |
| **Rogue** | iframe → `public/rogue/sim.html` (977 lines) | 73 KB static | To convert. OQ6 says rebuild natively. |
| **Tidelock** | iframe → `public/tools/tidelock/sim.html` (1,616 lines) | 88 KB static | To convert. |
| **ExoForge** | iframe → `public/tools/exoforge/sim.html` (1,686 lines) | 81 KB static | To convert. |

**So the work is not five rebuilds. It is one cutover that is already sitting finished, plus three conversions, against a pattern that has already shipped once.** That is a materially smaller and lower-risk job than §3.7 assumed.

Science pages: `rogue`, `tidelock`, `exoforge`, `exosky` each have a `science.html`. **Solaris has none** — consistent with §3.7's note that a Solaris science page must be authored.

---

## 1a. The reference pattern was broken (found 2026-08-12, fixed in 0.6950)

`simulation_saves` held **zero rows**, across 25 worlds, 30 worksheets and 37 world entries. Users were active; nobody had ever saved a simulation. The cause was not discoverability:

**ExoSky's Save, Load and Publish were all silent no-ops.** `useSimulationSave` speaks the `STELLARFORGE_*` protocol over *window events* when no `iframeRef` is passed, which is the component-simulator path. Nothing in the 1,863-line component was listening. So Save dispatched `REQUEST_STATE`, no `SAVE` came back, `pendingPayload` stayed `null`, and the dialog never opened. No error, no toast. Load dispatched into the same void; Publish opened its dialog with a `null` payload.

Two lessons that bind the remaining conversions:

1. **Do not copy ExoSky's persistence blindly.** It was the pattern this plan pointed at for S-C and S-D, so the bug was one step from being reproduced three more times. The corrected pattern is the `useEffect` in `ExoSkySimulator.tsx` that registers both listeners, plus `src/lib/simulators/exosky-save.ts`.
2. **The payload envelope is not free-form.** `useSimulationSave` inserts `data: {parameters, results}` and **discards every other top-level key**. A payload shaped any other way is silently dropped at the database boundary. State must live under `parameters`. `src/lib/__tests__/simulation-facts.test.ts` asserts the round-trip through exactly what the insert writes, and every new simulator save needs that test.

**Still owed:** browser verification of a real Save → reload → Load round-trip. The unit tests prove the serialiser; they cannot prove the window-event wiring fires in a browser.

---

## 2. Why the iframe is the root problem

Every complaint about the simulators traces back to one architectural fact: three of them are static HTML files in `public/`, outside the application.

- **They cannot use the design system.** Each file carries its own inline CSS. This is precisely why cyan literals and stray fonts survive there while the rest of the product moved on: a token change cannot reach inside an iframe.
- **They cannot share primitives.** Save, Load, and Publish-to-world chrome is re-implemented per file instead of using `SaveSimulationDialog`, `LoadSimulationSheet`, `PublishToWorldDialog` — which already exist and are already used by the native Exosky.
- **They are invisible to the continuity engine.** Simulators persist to `simulation_saves`; `extractWorksheetFacts` reads `worksheets`. So a writer's orbital mechanics, tidal-lock state, and star data cannot contradict their prose, even though that is exactly the product's differentiator. **This is the biggest missed opportunity in the codebase.**
- **Mobile is per-file guesswork** rather than one shared responsive pattern.
- **No shared error boundary, no Sentry context, no route-level code splitting.**

Converting is therefore not cosmetic. It is what makes the simulators part of the product.

---

## 3. Sequence

Ordered so that value lands early and each step de-risks the next.

### Task S-A: Land the Solaris cutover — **BLOCKED, do not flip the route**

The native rebuild exists and is complete through M6. It is reachable only at `/dev/solaris`, so no user has it.

**Verified 2026-08-12: cutting over would have been a regression.** `docs/SOLARIS_M6_PARITY_AND_CUTOVER.md` says so in its own words. B was ahead on physics, science, rendering, determinism and save fidelity, and behind on controls.

**Closed in 0.6960 and 0.6970:**

- [x] **Naming.** System, star, planet and moon. Verified in a browser through to the `sf2System` snapshot in the save payload, which is what `extractSolarisFacts` reads. This was the gap that blocked the stated product goal: reference elements cannot be pulled into the writing studio if the writer could never name them.
- [x] **Play / pause / single step**, plus spacebar. Verified against label motion, not a canvas hash — `toDataURL` on a WebGL canvas returns empty without `preserveDrawingBuffer`, so a naive check makes "frozen" and "blind" look identical.
- [x] **Generation conditions** (habitable, gas giant, tidal lock, rogue), forced at both the band list and the archetype pool, as the original does. Deliberately fixes the original's bug where the habitable rule overwrites the tidal one.
- [x] **Planet-count slider, star-class picker, asteroid-belt control, named architecture presets.** The generator already supported these; no UI reached them.
- [x] **Rich info panel.** Life, atmosphere, water, hazard, resources, the archetype note, named moons, eccentricity, tilt. All of it was preserved through generation and save and simply never displayed.
- [x] **Reorbit planet by dragging.** Keyed by planet id, since reorbiting re-sorts the list and a captured index would follow the wrong body.
- [x] Contrast pass on all four panels. The transport controls were unfindable, and not only because they were hidden: control text sat at `white/30` with `0.06` borders.
- [x] Panel layout. Both left panels were anchored to the same edge with overlapping heights, so the edit panel completely covered the transport row.

**Still open before the cutover:**

- [ ] Separation sliders, trails, gravity vectors, Oort cloud, rotation controls, math overlay.
- [ ] **Mobile is unusable:** scrollWidth 585 against clientWidth 390.
- [ ] Unverified: real-hardware FPS (the headless harness returned contradictory 0/29/40 fps and was never a usable result), and click-to-select raycast in a real browser.
- [ ] Re-read `docs/SOLARIS_M6_PARITY_AND_CUTOVER.md` and confirm the parity table against the current native components.

The cutover itself stays cheap: §5 is a single-file change to `src/pages/simulators/SolarisSimulator.tsx`, with the route and `ProToolGuard` unchanged and nothing deleted.
- [ ] Drive both versions side by side at 1728×1080 and at 420px: `/tools/solaris` (iframe) vs `/dev/solaris` (native). Compare system generation, orbital motion, habitable-zone rendering, save, load, publish.
- [ ] Point the `/tools/solaris` route at the native component; keep `/dev/solaris` alive for one release as a fallback.
- [ ] Delete `public/tools/solaris/sim.html` (137 KB) **only after** a release has shipped with the native version live.
- [ ] Verify: 93+ tests still pass, type errors stay at the 254 baseline, eslint at 62/73, production build succeeds.

### Task S-B: Author the missing Solaris science page

- [ ] Every other simulator has a science explainer; Solaris has none. Author it as a **React route**, not another static HTML file, so it inherits tokens and the WRITER register. Model the content on `public/tools/exosky/science.html` (759 lines, the fullest one) but write it in the site's current voice: plain, active, no em dashes.

### Task S-C: Convert Rogue to native React

Rogue is the smallest static app (977 lines), which makes it the right first conversion.

- [ ] Confirm which file is authoritative: `public/rogue/sim.html` vs `simulators/Rogue/index.html` (908 lines, likely an older copy). §3.4 flags this as an S0 question and it is still open.
- [ ] Port the N-body integrator to a pure, testable module (`src/lib/simulators/nbody.ts`) with unit tests. The physics is the valuable part and it currently has no test coverage at all.
- [ ] Build the React component against the Exosky pattern: lazy-loaded, `useSimulationSave`, the three shared dialogs, `NarrativeBridgePanel`.
- [ ] Match the existing feature set before adding anything. Parity first, improvements second.
- [ ] Retire the iframe and its 73 KB payload.

### Task S-D: Convert Tidelock, then ExoForge

Same shape as S-C, in ascending size order (Tidelock 1,616 → ExoForge 1,686).

- [ ] Extract each one's physics into a tested pure module first.
- [ ] Then the component, against the same pattern.
- [ ] Then retire the static file.

### Task S-E: Connect simulators to the writing surface (the differentiator)

This is the step that makes the uplift worth more than a re-skin. **Landed in 0.6950 for ExoSky and Solaris.**

- [x] `extractSimulationFacts(simulatorType, data)` in `src/lib/simulation-facts.ts` (its own module, not `worksheet-facts.ts`, to avoid an import cycle with the ExoSky extractor). Returns the same `WorksheetFact[]` shape.
- [x] Surfaced in `WorksheetFactsPanel` beside worksheet facts, via a new `useWorldSimulations(worldId)` reading every save for a world rather than one simulator's. `WorksheetFact` gained an optional `insert`, so a row whose subject is a proper noun ("Constellation \"The Drowned Man\"") inserts the *name* rather than its star count.
- [x] ExoSky: vantage point, host star, distance in light years first, galactic region, sky description, and each hand-named constellation with its star count, sky position and brightest member.
- [x] Solaris: system name, stars with classifications, habitable zone, planet count, and per planet its type, semi-major axis, orbital period (rendered in days when under a year) and habitable-zone flag, plus named moons.
- [x] 24 tests in `src/lib/__tests__/simulation-facts.test.ts`, including the database round-trip and the junk-input cases.
- [ ] **Rogue, Tidelock and ExoForge return `[]`.** They are still static iframes writing their own shapes; each needs an extractor as it converts. `hasSimulationFactSupport` reports this honestly rather than implying an empty save.
- [ ] Extend the continuity engine: Tidelock's locked state should drive the existing `rotation-locked` implausibility rule; Solaris orbital data should feed `orbitalDistance` and `dayLength` Tier 1 checks. **Confirm each field exists in the saved shape before writing a check** — three of the engine's first five checks were dead because they targeted unmapped fields. `extractSolarisFacts` was written against the verified `sf2System` shape for exactly this reason.
- [ ] Solaris naming (Task S-A P0) is the missing half: the extractor reads names the writer currently cannot set.

---

## 4. Per-simulator quality bar (Track S S1/S2/S3)

Applied to each conversion as it lands, rather than as a separate later pass.

**Smooth (S1)**
- [ ] Measure before optimising: FPS desktop and mobile, time to first interaction, bundle delta. Record the numbers in the PR.
- [ ] Delta-time animation everywhere (per `CLAUDE.md`: framerate-independent camera smoothing).
- [ ] Route-level lazy loading; a simulator must not weigh on first paint of any other page.

**Believable (S2a), added 2026-08-12 from owner feedback**
- [x] Planets carry a surface, not a tint. Six procedural treatments by type, generated on a canvas and cached by type and colour (`utils/planetTexture.ts`). A gas giant and a desert world used to differ only in hue.
- [x] The star cannot swallow its innermost planet. Stars render ~68x oversized for visibility, which put a Sun-like star's disc at 0.31 AU against a first planet at 0.34 AU, and swallowed a red dwarf's first planet entirely. The disc is now capped at half the closest approach, using periapsis.
- [x] Default speed 1x, not 10x. Opening at 10x looked frantic and blurred the inner planets.
- [ ] Apply the same three checks to each simulator as it converts. Flat-tinted bodies and an oversized primary are not Solaris-specific problems.

**Beautiful (S2)**
- [ ] Token-native: import from the generated tokens, no literals. Zero `#00D4FF`, zero Space Grotesk. CI cyan-watch becomes a hard failure once the last static file is gone.
- [ ] Canvas background `#09090B`, panels `rgba(15,15,16,0.92)` with `rounded-lg` — the documented simulator exception to zero-radius.
- [ ] Accent is the product teal `#15C17B`; legacy cyan stays retired.

**Effective (S3)**
- [ ] Input/output clarity: every control labelled, every readout carrying its unit.
- [ ] Mobile: one shared responsive pattern across all five, not per-file.
- [ ] Publish-to-world polished and consistent.
- [ ] Science page reachable from each simulator.

---

## 5. Gates

Every task holds the standing bar: **93+ tests passing, type errors at the 254 pre-existing baseline, eslint at 62 errors / 73 warnings, `typecheck-strict` clean, production build succeeds.** Physics modules must ship with unit tests; a converted simulator with untested physics is a regression against this plan even if it looks identical.

Browser verification is mandatory per conversion. These are canvas apps: tests cannot tell you the orbits render.

---

## 6. Honest risks

- **Parity drift.** A rebuild that quietly loses a feature is worse than an ugly iframe. Every conversion needs a written parity checklist before the old file is deleted, and the old file stays one release beyond cutover.
- **The physics is the asset.** Those static files hold real N-body integration, tidal-lock modelling, and Kopparapu habitable-zone maths. Port it as pure modules with tests; do not rewrite it from memory.
- **Scope growth.** §3.7 already flags Track S as the largest single Pillar-A item. Converting one simulator end to end, shipping it, and looking at it beats four half-conversions.
- **`simulators/Rogue/index.html` ambiguity** is unresolved from S0 and blocks S-C. Settle it first.
- **Exosky is native but unaudited against S1–S3.** It was converted before this bar existed, so it needs the same measurement pass rather than an assumption that native means done.
