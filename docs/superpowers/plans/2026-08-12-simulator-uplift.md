# Simulator Uplift Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Bring all five simulators to the standard of the rest of the product: native React, token-native, mobile-capable, saveable, and connected to the writing surface.

**Relationship to StellarForge II:** this is the execution plan for **Track S** (`STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md` §3.7), which already settled the direction: a *full overhaul*, not a re-skin, on the "beautiful / smooth / effective" axes (S1–S3), with **OQ6 recommending Rogue be rebuilt natively** rather than re-themed in place. Nothing here re-opens those decisions. What this adds is the verified per-simulator state, which changes the sequencing.

---

## 1. Verified current state (measured 2026-08-12)

Track S was written as "five ground-up redesigns." That is no longer accurate, and the difference matters for sequencing:

| Simulator | Implementation | Payload | Status |
|---|---|---|---|
| **Exosky** | **Native React** — `src/components/simulators/ExoSkySimulator.tsx`, 1,863 lines, lazy-loaded | in-bundle, code-split | **Already converted.** This is the reference pattern. |
| **Solaris** | iframe → `public/tools/solaris/sim.html` (2,241 lines) | 137 KB static | **Native rebuild already built** (24 components in `src/components/solaris/`, dev route `/dev/solaris`, M1–M6 done). Awaiting cutover sign-off. |
| **Rogue** | iframe → `public/rogue/sim.html` (977 lines) | 73 KB static | To convert. OQ6 says rebuild natively. |
| **Tidelock** | iframe → `public/tools/tidelock/sim.html` (1,616 lines) | 88 KB static | To convert. |
| **ExoForge** | iframe → `public/tools/exoforge/sim.html` (1,686 lines) | 81 KB static | To convert. |

**So the work is not five rebuilds. It is one cutover that is already sitting finished, plus three conversions, against a pattern that has already shipped once.** That is a materially smaller and lower-risk job than §3.7 assumed.

Science pages: `rogue`, `tidelock`, `exoforge`, `exosky` each have a `science.html`. **Solaris has none** — consistent with §3.7's note that a Solaris science page must be authored.

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

### Task S-A: Land the Solaris cutover (highest value, already built)

The native rebuild exists and is complete through M6. It is reachable only at `/dev/solaris`, so no user has it.

- [ ] Read `docs/SOLARIS_M6_PARITY_AND_CUTOVER.md` and confirm the parity table is still accurate against the current native components.
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

This is the step that makes the uplift worth more than a re-skin.

- [ ] Write `extractSimulationFacts(toolType, data)` in `src/lib/worksheet-facts.ts`, returning the same `WorksheetFact[]` shape, reading `simulation_saves` rows.
- [ ] Surface those facts in `WorksheetFactsPanel` alongside worksheet facts, so a writer can drop a real orbital period or star class into prose.
- [ ] Extend the continuity engine: Tidelock's locked state should drive the existing `rotation-locked` implausibility rule; Solaris orbital data should feed `orbitalDistance` and `dayLength` Tier 1 checks. **Confirm each field exists in the saved shape before writing a check** — three of the engine's first five checks were dead because they targeted unmapped fields.
- [ ] Add tests per fact type, following `src/lib/__tests__/continuity.test.ts`.

---

## 4. Per-simulator quality bar (Track S S1/S2/S3)

Applied to each conversion as it lands, rather than as a separate later pass.

**Smooth (S1)**
- [ ] Measure before optimising: FPS desktop and mobile, time to first interaction, bundle delta. Record the numbers in the PR.
- [ ] Delta-time animation everywhere (per `CLAUDE.md`: framerate-independent camera smoothing).
- [ ] Route-level lazy loading; a simulator must not weigh on first paint of any other page.

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
