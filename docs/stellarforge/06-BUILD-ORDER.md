# 06 · BUILD ORDER

> North star in `01`. This is the part you can start tomorrow.
> Each phase ends with something demonstrable. Nothing here requires a rewrite.

---

> **Revised 2026-08-16.** A diagnostic of the continuity engine found that the
> `entities` table and the per-tool fact projection **already exist** — they're
> just not connected, and the resolution step has a live first-match bug.
> `11-SIMULATOR-CONSTELLATION.md` §0 has the findings; `12-SESSION-SEQUENCE.md`
> is the revised running order. Weeks 1–2 below compress substantially as a
> result, and the facts table moves later than stated here. Read 12 first.

---

## Phase 0 — Clear the deck (before anything in this bundle)

> **Cleared 2026-08-20.** All four blockers and all three "cheap" items below
> were run down this session. Two landed narrower than their literal wording
> by deliberate choice, not oversight — see the notes. Nothing here is still
> blocking Weeks 1–2; the open items are either genuine follow-on product
> decisions or lower-priority polish. `docs/ROADMAP.md` has the fix-by-fix
> detail.

The roadmap already carries blockers that make architecture work unsafe:

- [x] PDF preview rendering — was completely broken, every export crashed. Root cause was WOFF2 font embedding (not the CSP violation it first looked like); fixed by switching to a PDF base-14 font. Live-verified.
- [x] Full-tools save/load test pass — 21/21, 2 bugs found and fixed (Sensorium, K-Scale).
- [x] Simulator save/publish test pass — 5/5, Save/Load/Publish all verified live.
- [x] P3 bug-fix pass — scoped to what the two passes above actually surfaced, plus one more found during the security pass (`world_tags` 404 on every tool page). All fixed. A separately-scoped "systematic pass across all tools and features" has not been run.

**Do these first.** Building a canon graph on top of a save path that isn't proven is how you spend a month debugging the wrong layer. This is not optional sequencing advice; it is the cheapest risk reduction available.

Also in Phase 0, and cheap:

- [x] Pick **one** of `/graph` and `/connections`. Redirect the other. — Done: `/connections` is canonical, `/graph` redirects.
- [~] Merge `Timeline` into `Chronicle`. — Given a dismissible in-app pointer instead of a full merge. The literal merge means renumbering the 21-tool registry and migrating live worksheet data into `chronicle_events` — a real product decision, not "cheap." Flagged, not silently done.
- [~] Chrome audit: get the always-on layer count from ten to six. — Ten to seven: removed a dead toast provider and merged two redundant layer pairs. The remaining seven (Toaster, BackgroundLayer, FABStack, CookieConsent, AmbientEffects, StatusBar, AudioPlayer) are each independently justified with real conditional logic; cutting further means removing an actual feature, which wants a product call, not an engineering one.

---

## The 90 days

Five phases. Each ends in a demo you could record.

### Weeks 1–2 · The spine exists

**Goal:** the Canon Graph is real, empty, and read-only.

- `src/canon/` module — the only thing that touches the new tables (`02-ARCHITECTURE.md`, "Query surface")
- Tables: `entities`, `facts`, `doc_bindings`, `sim_runs`, `situations`. RLS mirroring `worlds`.
- `08-VOCABULARY.md` committed as `src/canon/vocabulary.ts` — a typed predicate namespace
- `ToolManifest` type + `/sf-audit` command wired to fail CI on violations
- Projection functions for **three** tools only: Genesis, Atlas, Phylo. Blob stays the write path; graph is derived on save.

**Demo:** `canon.facts(worldId)` returns real facts projected from three existing worksheets, with provenance.

**Deliberately not doing:** migrating anything, changing any tool UI, touching the Studio.

---

### Weeks 3–4 · The gravity demo

**Goal:** prove the whole architecture with the smallest possible slice.

Atlas becomes the sole producer of `planet.surface_gravity`. Genesis consumes it. The Studio rail's `World` tab shows it with its `narrative` string. Change it in Atlas, and Genesis updates, and the rail updates, and the affected scenes get a badge.

- Resolve the Atlas/Genesis duplication (see the anti-duplication registry in `03`)
- First real derivation with a `narrative`
- `canon.forDoc()` powering the `World` rail tab for real
- `canon-changed` badge in the binder
- Blast-radius view: `canon.blastRadius(factId)` rendered as a list

**Demo (record this one):** change one number in Atlas. Watch Genesis, the rail, and four binder documents react. **This is the whole product in 30 seconds.**

---

### Weeks 5–7 · Prose becomes a citizen

**Goal:** Law IV, both directions.

- `doc_bindings` populated from `@mentions` and `[[links]]` — the `mention` kind, retroactively across existing documents
- `depends_on` bindings inferred when a document is open while a rail fact is pinned or cited
- **Canon Capture** v1 — narrow claim detection (number + unit near an entity mention), gutter affordance, `proposed` confidence tier
- **Contradiction Ledger** — the `Check` tab generalized to a world surface, with the three-way resolution (canon right / prose right / both right, add epoch boundary)
- `Refs` rail tab re-ranked by relevance and given inline edit

**Demo:** type a measurement into a draft, adopt it as canon, open the worksheet, see it there marked *proposed from Chapter 3*.

---

### Weeks 8–10 · Characters

**Goal:** the missing join.

- `Dossier` tool (`05-NEW-SYSTEMS.md` A1) — character entity type, inheritance from Phylo / Sensorium / Mythos / Dominion / Lexdrift, with overrides
- `Doc.pov_entity_id` — set in document metadata, shown in the outliner
- **Sensorium → POV rail binding**: the rail states what this POV can and cannot perceive
- Perception advisories, off by default, gutter-only
- Dramatis personae in Compile

**Demo:** set a scene's POV to a species with no colour vision. The rail says so. Write "the red sky." A quiet flag appears.

---

### Weeks 11–13 · Tension

**Goal:** the world starts talking back.

- `SituationRule` engine + the starter rules from `05-NEW-SYSTEMS.md` A2
- Fifth Studio rail tab: `Situations`, with `INSERT AS BEAT` and `LOG TO CHRONICLE`
- **The Bridge** replaces the dashboard card grid
- Chronicle as axis: `valid_from`/`valid_to` on facts, world epoch scrubber, `set_in` on documents

**Demo:** open a world. The Bridge reports two contradictions and three situations. One of them is genuinely interesting and the writer had not noticed it.

---

## After 90 days — the next three quarters

| Quarter | Theme | Contents |
|---|---|---|
| **Q+1** | Scrivener parity | Corkboard, outliner, document metadata, snapshots, collections (including graph-query collections), split view, search, `.scriv` import, Compile with canon appendices |
| **Q+2** | The map and the sims | Cartographer as spatial index; SimRun contract applied to all five simulators; Exosky → Mythos; Rogue → Chronicle; Planet/Moon Cartographer for `set_in` |
| **Q+3** | The systemic layer | Pressure Model / Advance the Clock; Fork & Diff; Symbiosis promotion; Onomastics; Generation Ship; BDO |

Roadmap folds (`05-NEW-SYSTEMS.md` Tier C) happen opportunistically inside these quarters, not as a project.

---

## Paste-ready briefs

Each of these is written to be handed to Claude Code as the opening message of a session. They assume the bundle is installed and `CLAUDE.md` carries the addendum.

---

### Brief 1 — Canon module foundation

```
Read docs/stellarforge/00-CONSTITUTION.md and 02-ARCHITECTURE.md before writing code.

Build the canon module foundation:

1. src/canon/types.ts — Entity, Fact, FactValue, SourceRef, Derivation,
   DocBinding, SimRun, SituationRule, Epoch, ToolManifest. Exactly as
   specified in 02-ARCHITECTURE.md. Do not improvise field names.

2. src/canon/vocabulary.ts — port docs/stellarforge/08-VOCABULARY.md into a
   typed const. Predicate must be a union type, not string.

3. supabase/migrations/ — entities, facts, doc_bindings, sim_runs,
   situations. RLS policies mirroring the existing worlds table exactly.
   Indexes per the "Indexing notes" section.

4. src/canon/index.ts — the query surface: facts(), entity(), assert(),
   blastRadius(), provenance(), forDoc(), situations(), promote().
   assert() returns { conflicts, staleDerived, affectedDocs } and must
   never silently overwrite a fact with confidence:'canon'.

Constraints:
- Do not modify any existing worksheet table or component.
- Do not migrate any data.
- Every public function gets a unit test with a fixture world.

Stop and show me the types file before writing the migrations.
```

---

### Brief 2 — The gravity demo

```
Read docs/stellarforge/03-TOOL-CHARTER.md, especially the anti-duplication
registry.

Goal: planet.surface_gravity has exactly one producer, and changing it
visibly propagates.

1. src/tools/atlas/manifest.ts — Atlas produces planet.surface_gravity via
   the derivation atlas.surface_gravity_from_mass_radius. Include a
   narrative() that returns one Ship's-Voice sentence of consequence.

2. src/tools/genesis/manifest.ts — Genesis CONSUMES planet.surface_gravity.
   Remove it as an input field. Render it as a canon-sourced readout with a
   provenance chip and a one-click path to Atlas (Law III: no dead ends).

3. Wire the Studio rail's World tab to canon.forDoc() so it renders the
   gravity narrative for any document bound to that planet.

4. canon-changed badge: when the fact changes, mark dependent docs. Badge
   in the binder, filter in the binder header. No modal.

Verify by hand: change mass in Atlas → Genesis readout updates → rail
narrative updates → binder badges appear. Screenshot each step.

Do not add any new UI chrome. Reuse existing primitives from
src/components/ui/ and follow the stellarforge-design skill.
```

---

### Brief 3 — Canon Capture v1

```
Read docs/stellarforge/04-STUDIO-CHARTER.md §2.2 and 00-CONSTITUTION.md
Law IV.

Build claim detection in the Studio editor. Scope deliberately narrow:

DETECT: a numeric value with a unit within 200 characters of an @mention or
[[link]], where no fact exists for a plausible predicate on that entity.
Rule-based only. No model calls in v1.

OFFER: a gutter affordance beside the paragraph. Never a modal, never a
popup, never anything that interrupts typing. Copy:
  ⟡ NO FACT ON FILE: <predicate>
    "<matched text>" → <ENTITY> · <predicate label>
    [ADOPT AS CANON] [WORKING] [DISMISS]

ADOPT: writes a Fact with confidence:'proposed' and
source:{kind:'prose', doc_id, range}, plus a DocBinding of kind 'asserts'.

Hard constraints:
- Never modify the user's text.
- Never write confidence:'canon' from prose.
- Debounce at 1200ms; detection runs off the main thread if it costs
  more than 8ms.
- Dismissals persist per document.
- All of it disappears in Focus mode.

Ship's Voice throughout. Show me the detector's rule table before wiring
the UI.
```

---

### Brief 4 — Situations engine

```
Read docs/stellarforge/02-ARCHITECTURE.md (Situation) and
05-NEW-SYSTEMS.md A2.

1. src/canon/situations/ — the SituationRule type, a registry, and an
   evaluator that runs rules against a world at an epoch.

2. Implement the starter rules listed in 05-NEW-SYSTEMS.md A2. Each rule
   MUST cite the specific facts that triggered it — a situation the writer
   cannot trace is a situation they will not trust.

3. Fifth Studio rail tab: Situations, scoped to the current document's
   entities and epoch. Actions: INSERT AS BEAT (adds a synopsis line),
   LOG TO CHRONICLE (creates an event at a suggested epoch).

4. Bridge counter.

Constraints:
- Rules are pure predicates over the graph. No side effects, no model
  calls, no randomness.
- A rule that cannot cite its facts fails review.
- Situations are dismissible per world and never block anything.
```

---

## Sequencing rules

- **Never start a phase while the previous phase's demo doesn't work.** These build on each other; a broken foundation compounds.
- **Never add tool #28 during Phase 0–5.** The wiring debt is the whole problem.
- **One tool per `/sf-wire` session.** Retrofitting is mechanical; batching it is how subtle mistakes get made across 27 files at once.
- **Record every demo.** The roadmap already lists "See it in Action" and screenshots/videos as outstanding. These five demos *are* that content — the marketing asset and the engineering milestone are the same artifact.
