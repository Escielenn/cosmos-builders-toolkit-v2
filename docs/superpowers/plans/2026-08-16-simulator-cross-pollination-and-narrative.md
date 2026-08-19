# Simulator Cross-Pollination and Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn five independent StellarForge simulators into a system that hands work to itself — a planet generated in one tool can open pre-loaded in another, a disrupted system can publish itself into a world, a sky can be read across centuries instead of one instant, a simulator can flag its own implausible configurations the way the manuscript continuity engine already flags prose, and any simulator's output can be turned into scene-setting prose without leaving the tool.

**Architecture:** Five independent subsystems, each shippable and testable on its own. All five build on infrastructure already in the codebase rather than introducing new categories of thing: the `STELLARFORGE_*` postMessage protocol (`use-simulation-save.ts`), the fact-extraction layer (`simulation-facts.ts`, `iframe-sim-facts.ts`), the non-blocking note pattern from `ContinuityPanel`/`continuity.ts`, the template-based prose pattern already shipped for Sensorium (`perceptual-narrative.ts`), and the tested physics in `nbody.ts` and `astro.ts`. No new backend, no new database tables, no LLM API — this codebase has none today, and nothing here requires one.

**Tech Stack:** React + TypeScript (wrapper pages), vanilla JS (the four static `sim.html` files, which is how ExoForge/Tidelock/Solaris/Rogue are actually built and where their DOM lives), Vitest for pure-function tests, the existing Supabase `simulation_saves`/`world_entries` tables (no schema change).

**Spec:** This document. No separate spec exists; it is the write-up of a live design conversation, and the grounding for each task is cited inline against the actual files read during that conversation rather than assumed.

## Global Constraints

- **Gate: 326+ tests passing, type errors at or below the 248 baseline, eslint `src` at 62 errors / 73 warnings, `typecheck-strict` clean.** Non-negotiable, per every prior session in this plan series.
- **No em dashes in copy.** Plain human voice. Keep "These worlds exist in you. Waiting to be found." intact wherever it appears.
- **Verify claims in the browser, not from source alone.** Twice this session a plan's own claims about what was "missing" were wrong (Rogue's builder and share-URL were already shipped; two "dark" tools turned out to persist nothing). Every task below states what to check live before writing code, not just what to build.
- **Non-blocking is the house style for anything evaluative.** `ContinuityPanel` and the design brief for Tier 1 checks agree: nothing a simulator or the continuity engine says should block the writer or read as an error. Task 4 inherits this tone exactly.
- **`!important` and inline styles are already how the static sims are built.** Follow the existing file's own conventions (see `sim-mobile.css`, `sim.html` inline `<style>` blocks) rather than introducing a build step none of these files have.
- **Two Rogues exist. Know which one you are editing.** `/rogue` (the live route) serves `public/rogue/sim.html`, a static file with its own inline physics (`computeAccel`, `step`, the code edited for gravity vectors in 0.7190). `/dev/rogue` serves `RogueNativeDev.tsx`, a React/Canvas rebuild that imports the tested `src/lib/simulators/nbody.ts`. They are not the same code. Task 2 targets the live one, because a feature nobody can reach does not ship — this is called out explicitly in the task itself, again, so it cannot be missed.

---

## Task 1: Cross-simulator handoff (Solaris → ExoSky / Tidelock)

**What exists today, checked before writing this:** Each simulator wrapper page (`ExoskySimulator.tsx`, `TidelockSimulator.tsx`, `SolarisSimulator.tsx`) reads `useWorldId()` for save context, but nothing passes a *specific generated planet* from one tool into another. The `STELLARFORGE_PUBLISH` message is documented in `sim.html`'s header comment on all four static sims but has no sender anywhere in the codebase (confirmed in the 0.7130 investigation) — it is dead. There is no existing handoff protocol to extend; this task defines one from nothing.

**Files:**
- Create: `src/lib/simulators/handoff.ts`
- Create: `src/lib/simulators/__tests__/handoff.test.ts`
- Modify: `public/tools/solaris/sim.html` (planet info panel — add the "Send to..." action)
- Modify: `src/pages/simulators/SolarisSimulator.tsx` (listen for the handoff message, navigate)
- Modify: `src/pages/simulators/ExoskySimulator.tsx` (read `?handoff=`, seed initial view)
- Modify: `src/pages/simulators/TidelockSimulator.tsx` (read `?handoff=`, seed initial star/orbit)
- Modify: `public/tools/tidelock/sim.html` (accept an initial-state override via `STELLARFORGE_LOAD` with a `handoff` flag)

**Interfaces:**
- Produces: `encodeHandoff(payload: HandoffPayload): string` — a compact query-string value, not a JSON blob, so the resulting URL stays shareable.
- Produces: `decodeHandoff(searchParams: URLSearchParams): HandoffPayload | null`
- Produces: `type HandoffPayload = { from: "solaris"; starType: "blue"|"white"|"yellow"|"orange"|"red"; starMassLum: number; planetAU: number; planetName: string; planetType: string }` — deliberately Solaris's own vocabulary (`STARS` keys, `PTYPES` keys from `public/tools/solaris/sim.html:407-468`), not an invented intermediate schema, because Solaris is the only source this task wires up and translating twice is a bug waiting to happen.
- Consumes (ExoSky side): the ExoSky wrapper computes an initial `viewRa`/`viewDec` from `planetAU` and a synthesized host-star distance, and passes it into `ExoSkySimulator.tsx`'s existing `worldEntityCoords`-style override path (`ExoSkySimulator.tsx:1793` region, the `worldEntity` custom-coordinates branch) rather than a new one.
- Consumes (Tidelock side): the Tidelock wrapper's `STELLARFORGE_LOAD` postMessage payload gains one new optional field, `handoffSeed: { starType: string; starMassSolar: number; auFraction: number }`, read by `public/tools/tidelock/sim.html`'s existing load handler to pre-fill the star and orbital-distance controls before the writer touches anything.

- [ ] **Step 1: Write the failing test for the encode/decode round trip**

```typescript
// src/lib/simulators/__tests__/handoff.test.ts
import { describe, it, expect } from "vitest";
import { encodeHandoff, decodeHandoff, type HandoffPayload } from "@/lib/simulators/handoff";

describe("encodeHandoff / decodeHandoff", () => {
  const payload: HandoffPayload = {
    from: "solaris",
    starType: "orange",
    starMassLum: 0.42,
    planetAU: 1.3,
    planetName: "Ashgrave-III",
    planetType: "terrestrial",
  };

  it("round-trips a payload through a URL query string", () => {
    const encoded = encodeHandoff(payload);
    const params = new URLSearchParams(`handoff=${encoded}`);
    expect(decodeHandoff(params)).toEqual(payload);
  });

  it("returns null for a missing handoff param", () => {
    expect(decodeHandoff(new URLSearchParams())).toBeNull();
  });

  it("returns null rather than throwing on a corrupted value", () => {
    expect(decodeHandoff(new URLSearchParams("handoff=not-valid-base64!!"))).toBeNull();
  });

  it("rejects a payload whose starType is not one of Solaris's five", () => {
    const params = new URLSearchParams(
      `handoff=${encodeHandoff({ ...payload, starType: "purple" as HandoffPayload["starType"] })}`,
    );
    // encodeHandoff itself is typed to prevent this at compile time; this test
    // guards the runtime decode path against a hand-crafted or future-version URL.
    const tampered = encodeHandoff(payload).slice(0, -2) + "xx";
    expect(decodeHandoff(new URLSearchParams(`handoff=${tampered}`))).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails with "Cannot find module"**

Run: `npx vitest run src/lib/simulators/__tests__/handoff.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `handoff.ts`**

```typescript
// src/lib/simulators/handoff.ts
// ---------------------------------------------------------------------------
// handoff, passing one generated planet from one simulator into another.
//
// Solaris generates systems; ExoSky and Tidelock each want a single planet's
// worth of context (its star, its orbital distance) to open pre-loaded rather
// than at their own defaults. This is not the STELLARFORGE_SAVE/PUBLISH
// envelope: that carries a whole simulation's state to Supabase. A handoff is
// smaller, lives entirely in the URL, and exists only to seed a fresh session
// in a *different* tool. Nothing here is persisted.
// ---------------------------------------------------------------------------

export type SolarisStarType = "blue" | "white" | "yellow" | "orange" | "red";

export interface HandoffPayload {
  from: "solaris";
  starType: SolarisStarType;
  /** Solaris's own `lum` value for the star, e.g. 0.42 for an orange star. */
  starMassLum: number;
  /** Orbital distance in AU. */
  planetAU: number;
  planetName: string;
  planetType: string;
}

const STAR_TYPES: readonly SolarisStarType[] = ["blue", "white", "yellow", "orange", "red"];

function isSolarisStarType(v: unknown): v is SolarisStarType {
  return typeof v === "string" && (STAR_TYPES as readonly string[]).includes(v);
}

export function encodeHandoff(payload: HandoffPayload): string {
  const json = JSON.stringify(payload);
  // btoa/atob, matching the same base64-in-URL approach Rogue's own
  // share-by-URL already ships (public/rogue/sim.html saveToURL/loadFromURL),
  // so a reader who has seen one has seen both.
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeHandoff(searchParams: URLSearchParams): HandoffPayload | null {
  const raw = searchParams.get("handoff");
  if (!raw) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const data = JSON.parse(json) as Record<string, unknown>;
    if (data.from !== "solaris") return null;
    if (!isSolarisStarType(data.starType)) return null;
    if (typeof data.starMassLum !== "number" || !Number.isFinite(data.starMassLum)) return null;
    if (typeof data.planetAU !== "number" || !Number.isFinite(data.planetAU) || data.planetAU <= 0) return null;
    if (typeof data.planetName !== "string" || !data.planetName) return null;
    if (typeof data.planetType !== "string" || !data.planetType) return null;
    return {
      from: "solaris",
      starType: data.starType,
      starMassLum: data.starMassLum,
      planetAU: data.planetAU,
      planetName: data.planetName,
      planetType: data.planetType,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `npx vitest run src/lib/simulators/__tests__/handoff.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit the pure module**

```bash
git add src/lib/simulators/handoff.ts src/lib/simulators/__tests__/handoff.test.ts
git commit -m "feat(sim): handoff payload encode/decode for cross-simulator links"
```

- [ ] **Step 6: Add the sender in Solaris's static sim**

First, verify live: open `/tools/solaris`, generate a system, click a planet, confirm the planet info panel that opens has a fixed set of action buttons to extend (in the current build this is the info popup driven by `openInfo(p)` in `public/tools/solaris/sim.html` — read that function before editing, its exact button markup is the anchor point, not assumed here).

Add one button per target simulator to that panel:

```html
<!-- inside the planet info panel markup, alongside its existing action buttons -->
<button class="pinfo-btn" onclick="sendToSimulator('exosky')">Open Sky in ExoSky →</button>
<button class="pinfo-btn" onclick="sendToSimulator('tidelock')">Model Surface in Tidelock →</button>
```

```javascript
// public/tools/solaris/sim.html, alongside the other postMessage senders
function sendToSimulator(target){
  if(!selPlanet || !system) return;
  const star = system.stars[0];
  window.parent.postMessage({
    type: 'STELLARFORGE_HANDOFF',
    target,
    payload: {
      from: 'solaris',
      starType: star.key,
      starMassLum: star.def.lum,
      planetAU: selPlanet.orbitPx / system.AU,
      planetName: selPlanet.name,
      planetType: selPlanet.typeKey,
    },
  }, '*');
}
```

- [ ] **Step 7: Listen for it in `SolarisSimulator.tsx` and navigate**

```typescript
// src/pages/simulators/SolarisSimulator.tsx, alongside the existing
// STELLARFORGE_SAVE listener already registered in this file
import { encodeHandoff, type HandoffPayload } from "@/lib/simulators/handoff";
import { useNavigate } from "react-router-dom";

// inside the component
const navigate = useNavigate();

useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data?.type !== "STELLARFORGE_HANDOFF") return;
    const { target, payload } = event.data as { target: string; payload: HandoffPayload };
    const encoded = encodeHandoff(payload);
    const routes: Record<string, string> = {
      exosky: "/tools/exosky",
      tidelock: "/tools/tidelock",
    };
    const route = routes[target];
    if (route) navigate(`${route}?handoff=${encoded}`);
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}, [navigate]);
```

- [ ] **Step 8: Receive it in ExoSky — seed the initial view**

In `ExoskySimulator.tsx`, on mount, check `useSearchParams()` for `handoff`. If present and it decodes, synthesize a plausible host-star distance (ExoSky needs a distance in parsecs, Solaris only has AU; use a fixed placeholder distance of 10 pc with a clear on-screen note "distance approximated, not part of the handoff" rather than inventing false precision) and pass that as the initial custom-coordinates state, reusing the exact `worldEntityCoords` override path the "From Your World" dropdown already uses (`ExoSkySimulator.tsx`, the `worldEntity && !worldEntityCoords` branch and its sibling success path) — do not build a second custom-coordinates mechanism.

- [ ] **Step 9: Receive it in Tidelock — seed star and orbit**

In `TidelockSimulator.tsx`, on mount, decode `?handoff=`, and if present, send an extra field on the existing `STELLARFORGE_LOAD` message the wrapper already posts to the iframe on ready: `{ type: 'STELLARFORGE_LOAD', payload: { handoffSeed: { starType, starMassSolar: starMassLum, auFraction } } }`. In `public/tools/tidelock/sim.html`'s load handler, when `handoffSeed` is present, set the star-type dropdown and the orbital-distance slider from it before the first render, exactly as a saved-state load already does for its own fields.

- [ ] **Step 10: Verify live, both directions**

Manual check (no automated E2E exists for iframe-to-iframe navigation in this codebase, and this task should not be the one to add Playwright infra as a side effect): generate a system in Solaris, click a habitable-band planet, click "Model Surface in Tidelock", confirm the URL carries `?handoff=`, confirm Tidelock's star type and orbital distance match what was clicked rather than Tidelock's own defaults. Repeat for ExoSky.

- [ ] **Step 11: Run full gates and commit**

```bash
npx vitest run
npx tsc -p tsconfig.app.json --noEmit
npx eslint src
git add -A
git commit -m "feat(sim): Solaris planets hand off into ExoSky and Tidelock"
```

---

## Task 2: Rogue survivors become a publishable system

**What exists today, checked before writing this:** `public/rogue/sim.html` (the live `/rogue` route) has its own inline `computeAccel`/`step` physics, just edited in 0.7190 for gravity vectors. It already has `loadFromURL`/`saveToURL` (`public/rogue/sim.html:900-930`) that serialize a system as `{n, sm, st, b, p:[{n,t,m,d}]}` — name, star mass, star type, optional binary, planets by name/type/mass/distance. Separately, `src/lib/simulators/nbody.ts` has `ejectedBodies()` and `specificOrbitalEnergy()`, tested (33 tests), but is consumed only by `RogueNativeDev.tsx` at `/dev/rogue`, which is **not the live route**. Building this against `nbody.ts` would ship a feature nobody can reach. This task builds it against the live static file.

Rogue's live physics tracks `x, y, vx, vy, mass` per body but has no function converting a state vector back into orbital elements (semi-major axis, eccentricity) — `saveToURL` only ever serializes bodies that were *never disturbed* (the builder's own input), not bodies mid-encounter. That conversion is the one genuinely new piece of physics this task adds.

**Files:**
- Modify: `public/rogue/sim.html` (add orbital-elements-from-state-vector, the "Publish Aftermath" button, the survivor-packaging function)
- No test file: this logic lives in a `<script>` tag with no build step and no existing test harness reaches it (consistent with how `computeAccel`/`step` in this same file are untested today — this task does not unilaterally add a testing framework to a file that has none).

**Interfaces:**
- Produces (new function in `public/rogue/sim.html`): `orbitalElementsFromState(body, mu)` → `{ a: number, e: number }`, the semi-major axis in the same units `orbitPx`/`AU` already use and the eccentricity, via the vis-viva equation:

```javascript
// r, v relative to the central mass (the primary star, or the star
// barycenter if the intruder disrupted things enough that a single star
// is no longer the obvious reference — this task uses the most massive
// surviving star, which is correct for every preset system and every
// custom system the builder can produce today).
function orbitalElementsFromState(body, primary){
  const dx = body.x - primary.x, dy = body.y - primary.y;
  const dvx = body.vx - primary.vx, dvy = body.vy - primary.vy;
  const r = Math.sqrt(dx*dx + dy*dy);
  const v2 = dvx*dvx + dvy*dvy;
  const mu = G * primary.mass;
  // Vis-viva: v^2 = mu(2/r - 1/a)  =>  a = 1 / (2/r - v^2/mu)
  const a = 1 / (2/r - v2/mu);
  // Specific angular momentum magnitude and specific energy give e directly.
  const h = dx*dvy - dy*dvx;
  const e2 = 1 - (h*h) / (mu * a);
  const e = e2 > 0 ? Math.sqrt(e2) : 0;
  return { a, e };
}
```

- Produces: `survivorsToSystemPayload()` → the same `{n, sm, st, b, p}` shape `saveToURL`'s `data` object already uses, so it can be handed to the *same* `loadFromURL`-compatible consumer (Rogue's own builder, or a future Solaris import) without a second schema.
- Consumes: `bodies` (Rogue's existing global array), `G` (existing constant), `launched`/`simTime` (existing globals, to gate the button on "an encounter actually ran").

- [ ] **Step 1: Verify live what "survivor" means before writing the packaging function**

Open `/rogue/sim.html`, load the default Solar System, launch a black hole intruder at close approach, let it run past the encounter, and read `d-pej` ("Ejected" count in the data panel) and each planet's row in `planet-status-list`. Confirm which per-body flag marks a planet as ejected (this is the same flag `ejectedBodies()` in `nbody.ts` models conceptually via `specificOrbitalEnergy > 0`, but the *live* file's own flag, whatever it is named on the body object, is the one this task reads — find it by inspecting `bodies` in the console mid-run, not by assuming it matches `nbody.ts`'s naming).

- [ ] **Step 2: Add `orbitalElementsFromState` next to `computeAccel`**

Insert the function from the Interfaces block above directly after `computeAccel` in `public/rogue/sim.html`, matching the file's existing single-line, no-framework style (this file has no linter pass in the gates; match its own idiom, which the rest of this file already establishes).

- [ ] **Step 3: Add the survivor-packaging function**

```javascript
function survivorsToSystemPayload(){
  const stars = bodies.filter(b=>b.isStar);
  const primary = stars.reduce((m,s)=>s.mass>m.mass?s:m, stars[0]);
  const survivors = bodies.filter(b=>b.isPlanet && !b.ejected);
  const planets = survivors.map(b=>{
    const {a,e} = orbitalElementsFromState(b, primary);
    return { n: b.name, t: b.typeKey || 'rocky', m: +b.mass.toFixed(3), d: +Math.max(a,0.05).toFixed(4) };
  }).sort((x,y)=>x.d-y.d);
  return {
    n: (document.getElementById('sys-display')?.textContent || 'Aftermath System').split(' — ')[0] + ' — Aftermath',
    sm: primary.mass,
    st: primary.starType || 'G',
    b: null,
    p: planets,
  };
}
```

Note the eccentricity `e` computed by `orbitalElementsFromState` is intentionally read but not yet threaded into the payload: the `{n,t,m,d}` shape `loadFromURL` already parses has no eccentricity field. Extending that shape is out of scope for this task (it would require updating `loadFromURL`'s parser too, which is a second concern); leaving `e` computed but unused here is correct scoping, not an oversight, and is called out in the commit message so a future task can see the room was left deliberately.

- [ ] **Step 4: Add the "Publish Aftermath" button, gated on a completed encounter**

```html
<!-- in #ctrl, near the existing transport controls -->
<button id="btn-publish-aftermath" style="display:none">Publish Aftermath →</button>
```

```javascript
// shown once the intruder has passed and at least one planet survived
function updateAftermathButton(){
  const btn = document.getElementById('btn-publish-aftermath');
  const survivors = bodies.filter(b=>b.isPlanet && !b.ejected).length;
  const show = launched && simTime > 0 && survivors > 0;
  btn.style.display = show ? '' : 'none';
}
// called from the same place updateData() already runs each frame
```

- [ ] **Step 5: Wire the button to the existing publish pipe, not a new one**

```javascript
document.getElementById('btn-publish-aftermath').addEventListener('click', ()=>{
  const payload = survivorsToSystemPayload();
  window.parent.postMessage({
    type: 'STELLARFORGE_SAVE',
    payload: {
      name: payload.n,
      outputType: 'system',
      parameters: payload,
      results: { survivorCount: payload.p.length, encounterType: currentIntruderType || 'unknown' },
    },
  }, '*');
});
```

This reuses the exact `STELLARFORGE_SAVE` message the 0.7130 fix already made reliable end to end (payload → `pendingPayload` → `SaveSimulationDialog`/`PublishToWorldDialog`), rather than inventing a parallel path. No change to `use-simulation-save.ts` or `PublishToWorldDialog.tsx` is needed for this task; the reuse is the point.

- [ ] **Step 6: Verify live end to end**

Run the same black-hole encounter as Step 1, wait for it to settle, confirm "Publish Aftermath" appears, click it, confirm the Save dialog opens pre-filled with a name ending in "— Aftermath" and confirm the `parameters` blob contains only surviving planets with an `d` (AU) value that is plausible (not negative, not absurdly large — a planet mid-ejection can have vis-viva return a huge or negative `a`, which the `.toFixed(4)` and `Math.max(a,0.05)` guard in Step 3 exist specifically to keep sane; verify this guard actually fires on a genuinely disrupted orbit, not just a calm one).

- [ ] **Step 7: Run gates and commit**

```bash
npx vitest run
npx tsc -p tsconfig.app.json --noEmit
npx eslint src
git add public/rogue/sim.html
git commit -m "feat(rogue): publish the survivors of an encounter as a new system"
```

---

## Task 3: A sky that changes over centuries (ExoSky epoch slider)

**What exists today, checked before writing this:** `src/lib/simulators/astro.ts` has real, tested coordinate transforms (`eqToGal`, `galToEq`, `raDecDistToXYZ`, `xyzToRaDec`) but nothing time-dependent — every transform assumes the epoch is fixed. ExoSky's background field is procedural (`generateBackgroundField(20000, 77777)`, a fixed seed) and its named stars come from `EXOPLANET_SYSTEMS`, real exoplanet host stars with no proper-motion data attached anywhere in this codebase. There is no existing "time" concept in ExoSky beyond the profiler's `t` used for star twinkle.

**Scope decision, stated up front so it is not silently narrowed later:** real stellar proper motion for the named exoplanet hosts is not implemented in this task. The data does not exist in this codebase and fabricating per-star motion vectors for real, named stars would be presenting invention as fact — exactly what the "For Writers" sections on every science page in this product explicitly avoid doing. What *is* real, cited, and implementable without new data is Earth-analog **axial precession**: the slow (~25,772-year period) precession of a planet's rotational axis, which rotates the entire equatorial coordinate frame relative to the fixed stars. This is a pure coordinate transform, needs no star-specific data, and is the effect that actually changes "which star is the pole star" over centuries, which is the single most narratively useful thing a writer would reach for a time slider to show. Procedural background-field stars, being fictional, may additionally be given a synthetic proper-motion drift as a stretch step (Step 8, separable, skippable without touching the precession work).

**Files:**
- Modify: `src/lib/simulators/astro.ts` (add the precession transform)
- Modify: `src/lib/simulators/__tests__/astro.test.ts`
- Modify: `src/components/simulators/ExoSkySimulator.tsx` (epoch slider, apply precession before existing transforms)
- Modify: `public/tools/exosky/science.html` (document the effect and its citation, matching every other science page's citation discipline)

**Interfaces:**
- Produces: `precessionMatrix(yearsFromJ2000: number): number[][]` — a 3x3 rotation matrix, composable with the existing `R_EQ_TO_GAL` matrix multiply pattern already used in `eqToGal`.
- Produces: `applyPrecession(x: number, y: number, z: number, yearsFromJ2000: number): Vec3`
- Consumes: nothing new; operates on the same `Vec3` type `astro.ts` already exports and defines.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/simulators/__tests__/astro.test.ts, appended to the existing file
import { applyPrecession, precessionMatrix } from "@/lib/simulators/astro";

describe("axial precession", () => {
  it("is the identity at the reference epoch (year 0 offset)", () => {
    const [x, y, z] = applyPrecession(1, 0, 0, 0);
    expect(x).toBeCloseTo(1, 5);
    expect(y).toBeCloseTo(0, 5);
    expect(z).toBeCloseTo(0, 5);
  });

  it("completes a full cycle at the standard 25,772-year period", () => {
    const [x, y, z] = applyPrecession(1, 0.3, -0.2, 25772);
    expect(x).toBeCloseTo(1, 2);
    expect(y).toBeCloseTo(0.3, 2);
    expect(z).toBeCloseTo(-0.2, 2);
  });

  it("visibly rotates the pole over a 13,000-year half-cycle", () => {
    // At half the precession period, a point near the pole should have moved
    // substantially, not sit within rounding of where it started.
    const before = applyPrecession(0, 0, 1, 0);
    const after = applyPrecession(0, 0, 1, 12886);
    const dist = Math.hypot(before[0] - after[0], before[1] - after[1], before[2] - after[2]);
    expect(dist).toBeGreaterThan(0.3);
  });

  it("preserves vector length (precession is a pure rotation)", () => {
    const [x, y, z] = applyPrecession(0.6, -0.5, 0.62, 6000);
    const len = Math.hypot(x, y, z);
    expect(len).toBeCloseTo(1, 5);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run src/lib/simulators/__tests__/astro.test.ts`
Expected: FAIL, `applyPrecession` is not exported.

- [ ] **Step 3: Implement the precession transform in `astro.ts`**

```typescript
// Appended to src/lib/simulators/astro.ts

/**
 * Axial precession: the ~25,772-year wobble of a planet's rotational axis,
 * traced out by the pole against the fixed stars (Earth's own version is
 * why Polaris was not the pole star in Vega's era, roughly 12,000 years ago,
 * and will not be again roughly 12,000 years from now).
 *
 * Modeled as lunisolar precession only, at the modern IAU rate. Does not
 * model nutation (the smaller, faster wobble on top of it) or the very slow
 * change in the precession rate itself over tens of thousands of years —
 * both are second-order against the rate itself and not the effect a writer
 * reaching for a multi-century time slider is trying to see.
 *
 * Reference: IAU 2006 precession model, general precession in longitude
 * ≈ 50.29 arcsec/year (Capitaine, N. et al. (2003), Astronomy & Astrophysics,
 * 412, 567). 360° / 50.29 arcsec/yr ≈ 25,772 years for one full cycle.
 */
const PRECESSION_PERIOD_YEARS = 25772;
const OBLIQUITY_DEG = 23.4393; // Earth's own axial tilt, held fixed by this model.

export function precessionMatrix(yearsFromJ2000: number): number[][] {
  const theta = (yearsFromJ2000 / PRECESSION_PERIOD_YEARS) * 2 * Math.PI;
  const eps = OBLIQUITY_DEG * DEG;
  // Precession is a rotation of the equatorial pole around the ecliptic pole.
  // Composed as: rotate into the ecliptic frame, spin by theta, rotate back.
  const cosE = Math.cos(eps), sinE = Math.sin(eps);
  const cosT = Math.cos(theta), sinT = Math.sin(theta);
  const toEcliptic = [
    [1, 0, 0],
    [0, cosE, sinE],
    [0, -sinE, cosE],
  ];
  const spin = [
    [cosT, sinT, 0],
    [-sinT, cosT, 0],
    [0, 0, 1],
  ];
  const fromEcliptic = [
    [1, 0, 0],
    [0, cosE, -sinE],
    [0, sinE, cosE],
  ];
  return matMul3(fromEcliptic, matMul3(spin, toEcliptic));
}

function matMul3(a: number[][], b: number[][]): number[][] {
  const out: number[][] = [[0,0,0],[0,0,0],[0,0,0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        out[i][j] += a[i][k] * b[k][j];
  return out;
}

export function applyPrecession(x: number, y: number, z: number, yearsFromJ2000: number): Vec3 {
  const m = precessionMatrix(yearsFromJ2000);
  return [
    m[0][0]*x + m[0][1]*y + m[0][2]*z,
    m[1][0]*x + m[1][1]*y + m[1][2]*z,
    m[2][0]*x + m[2][1]*y + m[2][2]*z,
  ];
}
```

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `npx vitest run src/lib/simulators/__tests__/astro.test.ts`
Expected: PASS, all tests including the 4 new ones.

- [ ] **Step 5: Commit the pure physics**

```bash
git add src/lib/simulators/astro.ts src/lib/simulators/__tests__/astro.test.ts
git commit -m "feat(exosky): axial precession transform, cited and tested"
```

- [ ] **Step 6: Add the epoch slider to ExoSky's UI**

In `ExoSkySimulator.tsx`, add a new state value `epochYears` (default `0`, meaning "now") and a slider control in the existing control panel (the same panel edited for mobile stacking in 0.7160 — reuse its structure, do not add a third panel), range roughly -13000 to +13000 (a full half-cycle either direction, enough to visibly move the pole without claiming precision this model does not have at the tens-of-thousands-of-years scale).

- [ ] **Step 7: Apply the precession before the existing sky transforms**

Find where `ExoSkySimulator.tsx` currently calls `eqToGal` for the observer's own viewing direction (the render loop's use of `raDecDistToXYZ` then `eqToGal`, read the exact call site before editing rather than assuming its line number, since this file has changed twice already this session). Insert `applyPrecession(x, y, z, epochYears)` on the observer-frame vector between those two calls, so every star's rendered position reflects "what the sky looks like from this epoch" rather than only rotating a label.

- [ ] **Step 8 (stretch, separable): synthetic proper motion for the procedural background field**

Only after Steps 1-7 are verified working. Give each procedurally generated background star (from `generateBackgroundField`, which already has a stable seed) a small fixed angular drift derived from that same seed, so background stars visibly shift relative to each other — not toward any real catalog value, and labeled in the UI as "background field drift, illustrative" rather than implying it is measured. Skip this step entirely if time-constrained; Steps 1-7 alone deliver the narratively useful effect (which star sits at the pole) without it.

- [ ] **Step 9: Document it on ExoSky's science page**

Add a new `sci-section` to `public/tools/exosky/science.html` titled "Axial Precession," following the exact structure every other science-page section in this codebase uses (an `<div class="eq">` for the formula, a `.src` citation block, a `.note` stating what is and is not modeled). State explicitly, in the same "What This Tool Cannot Do" spirit as Solaris's and Tidelock's pages, that real stellar proper motion is not modeled due to lack of per-star data in this build.

- [ ] **Step 10: Verify live**

Open `/tools/exosky`, drag the epoch slider to roughly -12886 years (half the precession period), confirm the sky visibly reorients around a different point (a different star sits near the fixed camera-up direction than at epoch 0). Confirm the slider at 0 renders pixel-identical to the current build with no slider present (regression check: precession at `yearsFromJ2000=0` must be a true no-op, which Step 1's first test already pins).

- [ ] **Step 11: Run full gates and commit**

```bash
npx vitest run
npx tsc -p tsconfig.app.json --noEmit
npx eslint src
git add -A
git commit -m "feat(exosky): epoch slider, the sky as it looked or will look across millennia"
```

---

## Task 4: Simulators flag their own implausible configurations

**What exists today, checked before writing this:** `src/lib/continuity.ts` and `ContinuityPanel.tsx` already establish the exact tone this task needs: non-blocking, both numbers shown, explicit "breaking your own rules on purpose is allowed" permission. That machinery checks *prose against recorded facts*. This task checks *a simulator's own current configuration against physical plausibility*, using facts already being extracted — `iframe-sim-facts.ts`'s `extractTidelockFacts` already reads `r.habPct`, `r.tSSP`, `r.tASP`, `r.escVel`, `r.atmRetention` from Tidelock's live results object (confirmed by reading the function directly, `iframe-sim-facts.ts:57-115`), so the raw numbers this task thresholds against are already flowing through the app; nothing new needs to be read out of the simulator, only interpreted differently.

**Files:**
- Create: `src/lib/simulators/plausibility-notes.ts`
- Create: `src/lib/simulators/__tests__/plausibility-notes.test.ts`
- Create: `src/components/simulators/PlausibilityStrip.tsx`
- Modify: `src/pages/simulators/TidelockSimulator.tsx` (render the strip, wired to `pendingPayload`/`refreshPayload` already in scope from `useSimulationSave`)

**Interfaces:**
- Produces: `interface PlausibilityNote { key: string; message: string; severity: "note" }` — one severity value on purpose. This is not a graduated warning system; introducing "warning" vs. "info" tiers would be the first step toward the blocking, red-and-yellow pattern `ContinuityPanel`'s own header comment explicitly rejects.
- Produces: `checkTidelockPlausibility(results: Record<string, unknown>): PlausibilityNote[]`
- Consumes: the `results` object already present in a Tidelock `SimulatorPayload` (the same shape `extractTidelockFacts` in `iframe-sim-facts.ts` reads from).

- [ ] **Step 1: Write the failing tests, using real Tidelock result shapes**

```typescript
// src/lib/simulators/__tests__/plausibility-notes.test.ts
import { describe, it, expect } from "vitest";
import { checkTidelockPlausibility } from "@/lib/simulators/plausibility-notes";

describe("checkTidelockPlausibility", () => {
  it("notes a habitable band under 5 degrees as vanishingly narrow", () => {
    const notes = checkTidelockPlausibility({ habPct: 1.2, tSSP: 391, tASP: 168, tTerm: 279, escVel: 11.2 });
    expect(notes.some(n => n.key === "narrowBand")).toBe(true);
  });

  it("says nothing about a habitable band of ordinary width", () => {
    const notes = checkTidelockPlausibility({ habPct: 22, tSSP: 391, tASP: 168, tTerm: 279, escVel: 11.2 });
    expect(notes.some(n => n.key === "narrowBand")).toBe(false);
  });

  it("notes an escape velocity too low to plausibly hold an atmosphere", () => {
    // Below roughly Mars's 5 km/s, atmospheric retention over geological time
    // becomes the exception rather than the rule (Jeans escape, the same
    // reasoning Tidelock's own science page already cites).
    const notes = checkTidelockPlausibility({ habPct: 20, tSSP: 300, tASP: 200, tTerm: 250, escVel: 3.1 });
    expect(notes.some(n => n.key === "weakEscape")).toBe(true);
  });

  it("notes a terminator hotter than the dayside as a physically inverted result", () => {
    // Should not happen from the tool's own generator, but a hand-edited
    // custom config can produce it, and the note exists to catch exactly that.
    const notes = checkTidelockPlausibility({ habPct: 10, tSSP: 300, tASP: 200, tTerm: 320, escVel: 11 });
    expect(notes.some(n => n.key === "invertedGradient")).toBe(true);
  });

  it("returns no notes for an empty or missing results object", () => {
    expect(checkTidelockPlausibility({})).toEqual([]);
  });

  it("never returns a severity other than note", () => {
    const notes = checkTidelockPlausibility({ habPct: 0.5, tSSP: 500, tASP: 100, tTerm: 300, escVel: 2 });
    expect(notes.every(n => n.severity === "note")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run src/lib/simulators/__tests__/plausibility-notes.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `plausibility-notes.ts`**

```typescript
// src/lib/simulators/plausibility-notes.ts
// ---------------------------------------------------------------------------
// plausibility-notes, a simulator noticing its own configuration.
//
// ContinuityPanel checks prose against what a writer already recorded. This
// checks a simulator's live output against physical plausibility, using the
// same "margin note, not correction" tone: nothing here blocks, nothing is
// severity-ranked beyond a single "note" level, and every message states the
// number rather than passing a bare judgment. A writer building a genuinely
// exotic world on purpose should see the note and keep going, not be stopped.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

export interface PlausibilityNote {
  key: string;
  message: string;
  severity: "note";
}

function fin(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function checkTidelockPlausibility(results: Record<string, unknown>): PlausibilityNote[] {
  const notes: PlausibilityNote[] = [];

  const habPct = fin(results.habPct);
  if (habPct !== null && habPct > 0 && habPct < 5) {
    notes.push({
      key: "narrowBand",
      severity: "note",
      message: `The habitable band covers ${habPct.toFixed(1)}% of the surface. That is closer to a single valley than a civilization's worth of territory, worth knowing if the story needs more than one settlement.`,
    });
  }

  const escVel = fin(results.escVel);
  if (escVel !== null && escVel > 0 && escVel < 5) {
    notes.push({
      key: "weakEscape",
      severity: "note",
      message: `Escape velocity is ${escVel.toFixed(1)} km/s, below Mars's own 5.0. Over geological time a world this small tends to lose its atmosphere rather than keep one, per the same Jeans-escape reasoning this tool's science page cites.`,
    });
  }

  const ssp = fin(results.tSSP);
  const term = fin(results.tTerm);
  if (ssp !== null && term !== null && term > ssp) {
    notes.push({
      key: "invertedGradient",
      severity: "note",
      message: `The terminator reads hotter than the substellar point (${Math.round(term)} K against ${Math.round(ssp)} K). That is the reverse of what tidal heating from the star alone would produce, worth a second look if this was not the intent.`,
    });
  }

  return notes;
}
```

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `npx vitest run src/lib/simulators/__tests__/plausibility-notes.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit the pure module**

```bash
git add src/lib/simulators/plausibility-notes.ts src/lib/simulators/__tests__/plausibility-notes.test.ts
git commit -m "feat(sim): Tidelock plausibility notes, same tone as continuity checks"
```

- [ ] **Step 6: Build the display component**

```typescript
// src/components/simulators/PlausibilityStrip.tsx
import type { PlausibilityNote } from "@/lib/simulators/plausibility-notes";

interface PlausibilityStripProps {
  notes: PlausibilityNote[];
}

export function PlausibilityStrip({ notes }: PlausibilityStripProps) {
  if (notes.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {notes.map((n) => (
        <p key={n.key} className="border-l border-sf-border pl-3 font-serif text-[13px] italic leading-relaxed text-t3">
          {n.message}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Wire it into the Tidelock wrapper page**

In `TidelockSimulator.tsx`, `pendingPayload` is already in scope from `useSimulationSave` (confirmed present in every simulator wrapper page as of 0.7130). Add:

```typescript
import { checkTidelockPlausibility } from "@/lib/simulators/plausibility-notes";
import { PlausibilityStrip } from "@/components/simulators/PlausibilityStrip";

// inside the component, near the existing data-panel JSX
const notes = pendingPayload?.results
  ? checkTidelockPlausibility(pendingPayload.results as Record<string, unknown>)
  : [];
```

Render `<PlausibilityStrip notes={notes} />` inside the existing data readout panel, below the numeric results, matching `ContinuityPanel`'s own placement convention of notes-after-numbers rather than notes-before.

Because `pendingPayload` only fills after a state request (per the 0.7130 fix), call `refreshPayload()` on an interval or on the same trigger the Publish button already uses, so the strip reflects the *current* configuration rather than only the last explicit save. The cheapest correct choice: call it once on mount and again whenever the iframe posts an unsolicited `STELLARFORGE_SAVE` (which already happens on certain in-sim actions) — do not poll on a timer, which would be new, unbounded background work this simulator has never done.

- [ ] **Step 8: Verify live**

Open `/tools/tidelock`, dial atmosphere density and orbital distance to produce a habitable band under 5%, confirm the note appears in the data panel worded as specified, confirm it disappears when the band is widened back out, confirm nothing about the Save or Publish flow is blocked by the note's presence.

- [ ] **Step 9: Run full gates and commit**

```bash
npx vitest run
npx tsc -p tsconfig.app.json --noEmit
npx eslint src
git add -A
git commit -m "feat(tidelock): the simulator notices its own narrow habitable bands"
```

**Explicitly out of scope for this task:** extending `checkTidelockPlausibility`'s pattern to Solaris, ExoForge, or Rogue. Each has a different results shape and different plausibility questions worth asking (Solaris: a circumbinary planet inside the Holman-Wiegert clearance zone its own science page already cites; ExoForge: a super-Earth with an Earth-like atmosphere at an escape velocity that would strip it). Tidelock is the proof of the pattern; the other three are the same shape of work repeated, not designed here, so a future task can scope them against whichever simulator's writers actually ask for it first rather than building three more speculative rule sets today.

---

## Task 5: Turn a simulator's facts into a few sentences of prose

**What exists today, checked before writing this:** `src/lib/sensorium/perceptual-narrative.ts` already ships exactly this pattern — `generatePerceptualNarrative(selectedModalities, environment): string`, a pure function that branches on structured input and composes pre-written sentence fragments into a paragraph, no LLM, no network call. A repo-wide check for any LLM or AI API integration (`openai`, `anthropic`, edge functions under `supabase/functions/`) confirms none exists anywhere in this codebase — Sensorium's template approach is not a fallback, it is the only pattern available, and it is already proven in production. This task generalizes it to the fact shape `simulation-facts.ts` already extracts, rather than building a second bespoke generator.

**Files:**
- Create: `src/lib/simulators/scene-prose.ts`
- Create: `src/lib/simulators/__tests__/scene-prose.test.ts`
- Create: `src/components/simulators/SceneProseButton.tsx`
- Modify: `src/pages/simulators/TidelockSimulator.tsx` (mount the button)

**Interfaces:**
- Produces: `generateSceneProse(facts: WorksheetFact[]): string` — takes the exact `WorksheetFact[]` shape `extractSimulationFacts()` already returns (imported from `@/lib/worksheet-facts`'s `WorksheetFact` type, no new type introduced), so this works from the same data `ContinuityPanel` and the Refs panel already consume, not a parallel extraction.
- Consumes: nothing new at the data layer. The facts this reads (`locked.daySide`, `locked.nightSide`, `locked.terminator`, `locked.habitableBand`, `locked.gravity`, `locked.tidalState`) are already produced by `extractTidelockFacts` today.

- [ ] **Step 1: Write the failing tests against real fact shapes**

```typescript
// src/lib/simulators/__tests__/scene-prose.test.ts
import { describe, it, expect } from "vitest";
import { generateSceneProse } from "@/lib/simulators/scene-prose";
import type { WorksheetFact } from "@/lib/worksheet-facts";

const tidelockFacts = (over: Partial<Record<string, string>> = {}): WorksheetFact[] => {
  const defaults: Record<string, string> = {
    "locked.daySide": "391 K (118°C), scorching",
    "locked.nightSide": "168 K (-105°C), frozen",
    "locked.terminator": "279 K (6°C), temperate",
    "locked.habitableBand": "12.4% of the surface (marginal)",
    "locked.gravity": "1.03 g",
    "locked.tidalState": "Locked",
  };
  const merged = { ...defaults, ...over };
  return Object.entries(merged).map(([key, value]) => ({
    key, label: key, value,
  }));
};

describe("generateSceneProse", () => {
  it("produces non-empty prose from a full Tidelock fact set", () => {
    const prose = generateSceneProse(tidelockFacts());
    expect(prose.length).toBeGreaterThan(40);
  });

  it("mentions the terminator band, the setting the tool exists to describe", () => {
    const prose = generateSceneProse(tidelockFacts());
    expect(prose.toLowerCase()).toContain("terminator");
  });

  it("reflects a wide habitable band differently than a narrow one", () => {
    const wide = generateSceneProse(tidelockFacts({ "locked.habitableBand": "40% of the surface (habitable)" }));
    const narrow = generateSceneProse(tidelockFacts({ "locked.habitableBand": "1.2% of the surface (uninhabitable)" }));
    expect(wide).not.toBe(narrow);
  });

  it("returns an honest empty-input message rather than a hallucinated scene", () => {
    expect(generateSceneProse([])).toBe("");
  });

  it("does not fabricate a fact it was not given", () => {
    // Facts missing gravity should not produce a sentence claiming a gravity value.
    const withoutGravity = tidelockFacts();
    const filtered = withoutGravity.filter(f => f.key !== "locked.gravity");
    const prose = generateSceneProse(filtered);
    expect(prose).not.toMatch(/\d+(\.\d+)?\s*g\b/);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run src/lib/simulators/__tests__/scene-prose.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scene-prose.ts`, following the Sensorium precedent's exact shape**

```typescript
// src/lib/simulators/scene-prose.ts
// ---------------------------------------------------------------------------
// scene-prose, turning a simulator's numbers into a few sentences to stand in.
//
// Every simulator in this product answers "what would this look like" in
// numbers. None of them answer it in prose, and this codebase has no LLM
// integration to lean on for that (checked: no API client, no edge function,
// nothing under supabase/functions/ that calls out to one). What it does have
// is exactly this pattern already shipped for Sensorium
// (src/lib/sensorium/perceptual-narrative.ts): template fragments, chosen by
// condition, composed into a paragraph. This generalizes that pattern to the
// WorksheetFact shape every simulator's facts already arrive in, rather than
// inventing a second bespoke generator alongside the first.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";

function findValue(facts: WorksheetFact[], key: string): string | null {
  return facts.find((f) => f.key === key)?.value ?? null;
}

/** The leading number in a formatted display value, e.g. "391 K (118°C)" -> 391. */
function leadingNumber(value: string): number | null {
  const m = value.match(/-?\d[\d,]*\.?\d*/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function generateTidelockProse(facts: WorksheetFact[]): string {
  const parts: string[] = [];

  const day = findValue(facts, "locked.daySide");
  const night = findValue(facts, "locked.nightSide");
  const term = findValue(facts, "locked.terminator");
  const band = findValue(facts, "locked.habitableBand");
  const gravity = findValue(facts, "locked.gravity");
  const tidal = findValue(facts, "locked.tidalState");

  if (day && night) {
    const dayK = leadingNumber(day);
    const nightK = leadingNumber(night);
    if (dayK !== null && nightK !== null) {
      const spread = dayK - nightK;
      if (spread > 150) {
        parts.push("The sky here never changes. One horizon holds a sun that never sets; the other holds a night that never breaks.");
      } else {
        parts.push("The day-night divide is gentler than most tidally locked worlds manage, the two hemispheres closer in temperament than in name.");
      }
    }
  }

  if (term) {
    const termK = leadingNumber(term);
    parts.push(
      termK !== null && termK > 273 && termK < 320
        ? "You are standing in the terminator band, the only strip of this world where the air does not immediately try to kill you."
        : "The terminator band is where anyone who lives here actually lives, whatever its exact temperature turns out to be.",
    );
  }

  if (band) {
    const pct = leadingNumber(band);
    if (pct !== null) {
      parts.push(
        pct < 5
          ? "That livable ground amounts to a sliver: a valley, a coastline, not a country."
          : pct < 20
            ? "That livable ground is a ring around the whole planet, narrow but continuous, enough for a road and the towns strung along it."
            : "That livable ground is wide enough to hold real geography: mountains, coastlines, more than one nation's worth of room.",
      );
    }
  }

  if (gravity) {
    const g = leadingNumber(gravity);
    if (g !== null && g > 1.3) {
      parts.push(`At ${g.toFixed(2)} g, every step here costs more than it would at home.`);
    } else if (g !== null && g < 0.7) {
      parts.push(`At ${g.toFixed(2)} g, movement here is looser than Earth ever allowed.`);
    }
  }

  if (tidal && /lock/i.test(tidal)) {
    parts.push("The star does not move in this sky. It never has, and to anyone born here, the idea that it could is the strange one.");
  }

  return parts.join(" ");
}

/**
 * A simulator identified by the same `simulatorType` strings
 * `simulation-facts.ts` already dispatches on.
 */
export function generateSceneProse(facts: WorksheetFact[], simulatorType: string = "tidelock"): string {
  if (facts.length === 0) return "";
  switch (simulatorType) {
    case "tidelock":
      return generateTidelockProse(facts);
    default:
      return "";
  }
}
```

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `npx vitest run src/lib/simulators/__tests__/scene-prose.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit the pure module**

```bash
git add src/lib/simulators/scene-prose.ts src/lib/simulators/__tests__/scene-prose.test.ts
git commit -m "feat(sim): template-based scene prose from a simulator's own facts"
```

- [ ] **Step 6: Build the button component**

```typescript
// src/components/simulators/SceneProseButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateSceneProse } from "@/lib/simulators/scene-prose";
import type { WorksheetFact } from "@/lib/worksheet-facts";

interface SceneProseButtonProps {
  facts: WorksheetFact[];
  simulatorType: string;
}

export function SceneProseButton({ facts, simulatorType }: SceneProseButtonProps) {
  const [prose, setProse] = useState<string | null>(null);
  const canGenerate = facts.length > 0;

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        disabled={!canGenerate}
        onClick={() => setProse(generateSceneProse(facts, simulatorType))}
      >
        Describe This Scene
      </Button>
      {prose && (
        <p className="mt-2 border-l border-sf-border pl-3 font-serif text-[14px] italic leading-relaxed text-t2">
          {prose}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Wire it into the Tidelock wrapper**

In `TidelockSimulator.tsx`, alongside the `PlausibilityStrip` mounted in Task 4 (if both tasks land; if this task lands alone, alongside the existing data panel), derive facts the same way `ContinuityPanel` already does — via `extractSimulationFacts("tidelock", pendingPayload)` from `@/lib/simulation-facts` — and pass them to `<SceneProseButton facts={facts} simulatorType="tidelock" />`.

- [ ] **Step 8: Verify live**

Open `/tools/tidelock`, generate or load a world, click "Describe This Scene," confirm prose appears reflecting the actual current numbers (change the habitable band width and regenerate, confirm the prose's second sentence changes to match, per the test in Step 1 that pins this behavior).

- [ ] **Step 9: Run full gates and commit**

```bash
npx vitest run
npx tsc -p tsconfig.app.json --noEmit
npx eslint src
git add -A
git commit -m "feat(tidelock): a button that turns the current world into a few sentences"
```

**Explicitly out of scope for this task:** ExoForge, Solaris, ExoSky, and Rogue prose generators. `generateSceneProse`'s `switch` statement is written to make adding one a self-contained addition (one new `generateXProse` function, one new `case`), but writing four more template sets in one task would be exactly the kind of scope creep this plan's own tasks have been keeping in check all session (see Task 4's identical scoping note). Tidelock is the proof; the rest are follow-on tasks sized the same way, once this one is verified against a real writer's reaction to the prose it produces.

---

## Verification Checklist (run once, after all five tasks land)

- [ ] `npx vitest run` — 326 (session baseline) + roughly 24 new tests across the five tasks, all passing.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` — at or below 248.
- [ ] `npx eslint src` — at or below 62 errors / 73 warnings.
- [ ] `npm run typecheck:strict` — clean.
- [ ] Manual pass, in order: generate a Solaris system → hand a planet off to Tidelock → confirm its star/orbit seeded correctly → dial the habitable band narrow and see the plausibility note appear → click "Describe This Scene" and confirm the prose reflects that narrow band → separately, run a Rogue encounter and publish its aftermath → separately, drag ExoSky's epoch slider and confirm the pole visibly moves.
