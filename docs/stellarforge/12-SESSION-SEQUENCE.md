# 12 · SESSION SEQUENCE

> How to actually run this in VS Code with Claude Code.
> Every session below is one sitting, has one goal, and ends with something you can look at.
> Revised 2026-08-16 against what the continuity diagnostic found — see `11-SIMULATOR-CONSTELLATION.md` §0.

---

## How to run a session

The same five steps every time. This is the whole method.

1. **Open a fresh Claude Code session.** Not a continuation. Long sessions drift and the docs stop being re-read.
2. **Paste the brief** from this file, verbatim. Don't paraphrase it — the constraints are load-bearing.
3. **Stop where the brief says stop.** Every brief has a checkpoint before the irreversible part. Actually look.
4. **Run the gate.** `/sf-ship`, or `/sf-contrast` for anything visual.
5. **Commit, then close the session.** One session, one commit, one thing.

### Three rules that prevent most of the trouble

- **One unit of work per session.** One tool wired, one bug fixed, one phase. Never "and while you're in there."
- **When Claude asks to skip a checkpoint, say no.** The checkpoints are where wrong turns get caught for free.
- **If a session runs past ~90 minutes, stop and split it.** A brief that can't finish in one sitting was scoped wrong; say so and re-scope rather than pushing through.

---

## The sequence

Grouped into four blocks. Each block ends with something demonstrable. **Don't reorder within a block.**

| # | Session | Brief lives in | Rough size | Ends with |
|---|---|---|---|---|
| | **BLOCK A — stop the bleeding** | | | |
| A1 | Install the package | `INSTALL-SIMPLE.md` | 15 min | `/sf-audit` runs |
| A2 | Fix the wrong-answer bug | `11` → Brief S-FIX | ~2 days | Check tab stops lying |
| A3 | Legibility: shared components | `10` → component pass | ~2 days | You can see the buttons |
| A4 | Legibility: tool pages | same brief, wider scope | ~2 days | **done 2026-09-02** — 73 files in pages/ + components/: alpha borders → `sf-line-*`, t5 → t4, opacity states → `sf-disabled-*`, 113 hex classes → solved accent tokens, suppressed focus rings restored |
| | **BLOCK B — give facts a subject** | | | |
| B1 | Subjects on facts | `11` → Brief S0 | ~3–5 days | **done before 2026-09-02** — `subject_id` + scoped `checkContinuity`, two-planet tests |
| B2 | Sim consequence flags | `11` → Brief S4 | ~1 week | **done 2026-09-02** — `src/sims/flags/` live on Tidelock, ExoForge, ExoSky, Gravitas, **Solaris** (stability posted from sim.html) and **Rogue** (accidental habitability from posted orbital elements). Two rules stay predicate-only, honestly: Solaris flares and Rogue tidal heating have no model to cite |
| | **BLOCK E — appearance** *(see `13-THE-LIFT.md` §4)* | | | |
| E1 | `sf-teal` role → `sf-primary` | `13` → Brief E1 | ~2 days | **done 2026-09-02** — 300 sites / 89 files + 69 hardcoded teal rgba in `index.css`; `sf-teal` survives only as a meaning (`tool-accents.ts`, category dots, cascade). Hex in canvas/WebGL code is Block G |
| E2 | Switchable themes | `13` → Brief E2 | ~1 day | **done 2026-09-02** — Profile → Appearance; `use-theme.ts`; Parallel Truth in `index.css` removed; Tailwind utilities theme-aware |
| E3 | Light-mode ambient audit | `13` §4 | ~1 day | **done 2026-09-02** — ParallaxStrips on theme planes; 95 white-alpha rules in `index.css` → foreground twins; light bases read as designed. Canvas/WebGL surfaces still Block G |
| | **BLOCK F — one IA** *(see `13-THE-LIFT.md` §1, §4)* | | | |
| F1 | Codex entity page | `13` → Brief F1 | ~2 weeks | **shipped 2026-09-03 (first cut)** — `/worlds/:id/codex/:entityId` is the one URL; `/pages/:id` redirects; sidebar, Elements, Recent, Chronicle, tools all link there. Generated infobox (`FactInfobox`, provenance chips, contradictions surfaced), aliases + epoch range, Mentioned-in, Chronicle. **Open:** relations still read `world_connections`; the typed-edge model lives on the separate `entities` table (see AMENDMENTS 2026-09-03) — F3 |
| F2 | Wiki → entity pages | `13` §4 | ~3 days | **done 2026-09-03** — `/worlds/:id/codex` is the List view (the former WikiBrowse, over `world_entries`); `/wiki` redirects; every "Wiki" link and label now says Codex. No data migration was needed: wiki entries were already `world_entries`, so they were already entity pages |
| F3 | One graph | `13` → Brief F3 | ~1 week | **done 2026-09-06** — `/graph` and `/connections` both redirect to `/codex?view=web`. Nodes are entities, edges are typed (`RELATIONSHIP_TYPES_BY_STAGE` on `world_connections`), toolbar = cascade · kind · relation · search · epoch. `entities`/`entity_connections` fold into `world_entries`/`world_connections` (`20260906_f3_one_graph.sql`, **applied 2026-09-06**: 39 entities moved, 0 collisions, 0 near-duplicates, 50 edges folded, 1 pin batch; `f3_fold_report` + `entity_fold_map` hold the audit); `entity-graph-crud` reads the folded tables through `entity-graph-mapping` so every existing caller sees one truth. Deleted: `WorldConnections`, EntityTreeView + the rest of `components/graph/`, `components/outline/`, `DrakeContextCard`, `use-world-graph` (−6,230 lines). `sf-navigate-entity` finally resolves. **Open:** the epoch scrubber is local until F6's global one; the sidebar's Codex/Entities tabs now show the same rows and F6 folds them; `ENTITY_TYPE_COLORS`/`CASCADE_STAGE_COLORS` are still hex, not tokens (8 call sites concatenate hex alpha) |
| F4 | Instruments open on an entity | `13` §4 | ~1 week | **first cut 2026-09-03** — `?entityId=` is the subject on every tool page (`use-subject-entity`, banner in ToolPageLayout); every `createWorksheet` attaches to it (`attachWorksheetToEntity`, idempotent, id-only); prepopulate hook now reads `world_entries` (it read `entities` — a live bug). **Open:** simulators (S1 open-on), the Bridge "Begin survey" wizard |
| F5 | Atlas view | `13` §4 | ~2 weeks | **first cut 2026-09-07** — `/codex?view=atlas` is the third Codex view. Pins are the writer's entities (`metadata.atlas_x/atlas_y`, 0..1, draggable); zoom is `parent_id`, so galaxy → system → inside-a-world is the hierarchy, not a scale factor; a pin only enters when something is inside it; click → that entity's Codex page. **Unplaced entities sit in a named tray and are never scattered** — a map that invents positions is a map that lies. **Scope +1 (owner) delivered:** a surface map sheet per planet/moon, rendered as the map itself at that world's zoom. **Open:** the Cartographer is NOT absorbed and was not deleted — it carries empires, trade routes, wormholes and black holes the Atlas has no model for, and its procedural galaxy becomes the Atlas's top level only when `forge-gl` exists (**G4**, `14-RENDER-ENGINE.md` §6). F5 could not honestly retire it |
| F6 | Four spaces, Bridge | `13` §4 | ~1 week | **nav half done 2026-09-07** — `WorldSpaceNav` (Bridge · Codex · Instruments · Manuscript) is sticky above every world surface, and `/worlds/:id/tools` is the **Instruments** space, which never existed: a world's own index, subject-first, launching every tool with `?worldId=` and `?entityId=`. The Codex's four views are now complete (List · Web · Atlas · Timeline). **Open, and deliberately left for you:** folding the dashboard into the Bridge and Notes/Pages into the Manuscript. Those DELETE surfaces; the nav tells the truth about where things are today so the folds can happen behind it without moving the door twice |
| F7 | Tool folds (7 sessions) | `13` §3 | ~2 weeks | 27 → 17 instruments |
| | **BLOCK G — render engine** *(see `14-RENDER-ENGINE.md`; after F5)* | | | |
| G1 | Engine core, tiers, token binding, dispose | `14` → Brief G1 | ~1 week | **done 2026-09-07** — `src/gl/engine/`: `DisposalRegistry` (every disposable registered, teardown complete by construction, idempotent for StrictMode), tiers by MEDIAN benchmark with `chart` FORCED under reduced-motion and light themes, token binding sRGB→linear off computed style with **zero hex in `src/gl`**, `CameraRig.flyTo` on the design system's own bezier with log-space distance, and `createEngine` (ACES, capped pixel ratio, RenderPass → half-res bloom → one grain+vignette pass, both scaling `--sf-ambient`). 42 tests. Writing the dispose test first caught a real double-dispose. **Nothing mounts it yet — that is G2/G3.** Brief G1's checkpoint (show the dispose test and the tier benchmark before materials) is where this stops |
| G2 | Star / Atmosphere / Surface materials + canon binding | `14` → Brief G2 | ~1 week | **done 2026-09-08** — `src/gl/materials/` + `src/gl/bind/`. Black-body star colour with limb darkening (the proof's white-clip, fixed), corona amplitude from `star.flare_activity`; atmosphere rim coloured by composition and **logarithmic** in pressure (linear would hide the Mars/Earth difference and blow Venus up); surface keyed by `surface_type`, and a **tidally locked body does not rotate** — its terminator is geography. `bind/` produces **uniforms, never facts**: a temperature inferred from a spectral class travels with `derived: true` and a note, so nothing can display it as canon. The graded test — rim thickens 0.6 → 1.4 bar, nothing else moves — is pinned in vitest. 29 tests |
| G3 | System scene → Orrery + Atlas | `14` §6 | ~1 week | **done 2026-09-08** — `src/gl/scenes/SystemScene.tsx`, mounted at the Atlas's system level (lazy, so three.js never loads for the galaxy view). **Every position is a fact**: a body sits where `orbit.semi_major_axis` says, so this level has no drag-grid and nothing can be placed wrongly by hand. A body with no distance on file is listed as unplaced, never drawn at a plausible radius. Orbit scale is logarithmic with a **floor** — a naive `log10` hits zero at 0.1 AU and goes negative below it, which drew close-in worlds inside their own star (Tidelock's whole premise is 0.02–0.05 AU). Ring and selection read `--sf-line` / `--sf-primary` via `useThemeUniforms`, so **zero hex in `src/gl`** still holds. 21 tests |
| G4 | Galaxy scene: field, nebulae, lanes, territory | `14` §6 | ~2 weeks | **first cut 2026-09-08 — REAL STARS AND INVENTED ONES, together** (owner's call). `/codex?view=atlas` gains a **Chart / Real sky** switch at the galaxy level: Chart is the writer's own arrangement, Real sky is the **178 named Hipparcos stars already shipped for ExoSky** (`public/exosky-stars.json` — one catalogue, not a second one) with the writer's systems anchored onto it via a `anchor_star` fact. Anchoring yields real distance and 3D separation, which is what feeds Impulse and Paradox. **The two kinds never merge**: catalogue stars are unlabelled POINTS, the writer's systems are RINGS — separate types all the way through, so no renderer can forget which it holds. B−V → temperature (Ballesteros, validated against the Sun at 5778 K) → the existing black-body colour. 24 tests. **Hyperlanes added 2026-09-08:** `route.*` is in the vocabulary and **nothing in the app writes it** (checked), so a lane layer over those predicates would have been a renderer for an empty table. Instead a lane IS an F3 typed edge — `travels_via` / `trades_with` / `colonized_by` between two anchored systems — and `route.distance_ly` becomes **derived**, measured from the two anchors' catalogue positions rather than typed in. Political verbs are excluded on purpose: an alliance is not a road. A route with one end unanchored is **reported as waiting**, never drawn at a guess. 37 tests. **Territory added 2026-09-08, same finding, same answer:** `polity.territory[]` is not canon anywhere (territory lives only inside `StellarCartographer/`, in its own `empires` model), so a territory is **counted, not declared** — the set of anchored systems a polity holds via `governs` / `rules`. Direction is not assumed; the end that IS a system is the holding. Drawn as the **convex hull** of those systems, deliberately: the smallest region the holdings support, claiming nothing about the space outside it. Three systems are a triangle; two, or a set with no volume, fall back to edges. A polity holding one anchored system is **named, not bordered** — a single point has no border. Contested systems report both holders and the map picks no winner. 53 tests. **Still to come:** nebulae — the honest odd one out, since a nebula has no fact behind it yet |
| G5 | Sky scene → ExoSky | `14` §6 | ~1 week | precession renders |
| G6 | Encounter scene → Rogue | `14` §6 | ~1 week | ejection is visible |
| G7 | Chart tier, light themes, integrated-GPU pass | `14` §6 | ~1 week | works on a MacBook Air |
| | **BLOCK H — after G, only if the user base warrants** | | | |
| H1 | Compile via Pandoc job (DOCX/EPUB/.scriv) | `13` §2.2 note | ~1 week | a manuscript Word file a publisher accepts |
| H2 | Real-time co-editing (Yjs over Supabase Realtime) | `13` §2.5 note | ~2 weeks | two cursors, one document, no lost keystrokes |
| | **BLOCK C — the constellation** | | | |
| C1 | Publish / open-on | `11` → Brief S1 | ~1 week | **done 2026-09-07** — open-on on all five sims via `?entityId=` (+ legacy `?entity=`, + `?epoch=`); `use-sim-open-on` + `lib/simulators/open-on.ts` seed through the STELLARFORGE_LOAD every sim.html already implements. ExoForge takes a planet's full canon; Solaris and Rogue hydrate thinly **on purpose** (Rogue's mass/speed/angle describe the intruder, not the subject — a test forbids seeding them). `PublishProvenance` gains `run_id` + `seed`; the generic Publish dialog shows a real reviewable list instead of a bare count. `SimSubjectChip` in all five toolbars. **Open:** the four non-Solaris sims still record extractor keys (`sky.*`, `system.*`, `encounter.*`), not canon predicates — mapping those onto `08-VOCABULARY` is its own session and was deliberately not guessed at |
| C2 | The facts table | `12` → Brief C2 below | ~3 days | Asserted facts persist |
| C3 | Rogue as world-generator | `11` §2 S2 | ~1–2 weeks | An encounter creates a world |
| C4 | Living sky | `11` §2 S3 | ~1 week | The sky precesses |
| | **BLOCK D — reach the page** | | | |
| D1 | Canon Capture | `06` → Brief 3 | ~2 weeks | Prose proposes canon |
| D2 | Contradiction Ledger | `06` weeks 5–7 | ~1 week | World-level, three-way resolution |
| D3 | Dossier / characters | `05` A1 | ~2 weeks | POV points at something |
| D4 | Sensory brief | `11` → Brief S5 | ~1 week | The sim writes conditions |
| | **BLOCK C — the constellation** | | | |
| C1 | Publish / open-on | `11` → Brief S1 | ~1 week | **done 2026-09-07** — open-on on all five sims via `?entityId=` (+ legacy `?entity=`, + `?epoch=`); `use-sim-open-on` + `lib/simulators/open-on.ts` seed through the STELLARFORGE_LOAD every sim.html already implements. ExoForge takes a planet's full canon; Solaris and Rogue hydrate thinly **on purpose** (Rogue's mass/speed/angle describe the intruder, not the subject — a test forbids seeding them). `PublishProvenance` gains `run_id` + `seed`; the generic Publish dialog shows a real reviewable list instead of a bare count. `SimSubjectChip` in all five toolbars. **Open:** the four non-Solaris sims still record extractor keys (`sky.*`, `system.*`, `encounter.*`), not canon predicates — mapping those onto `08-VOCABULARY` is its own session and was deliberately not guessed at |
| C2 | The facts table | `12` → Brief C2 below | ~3 days | Asserted facts persist |
| C3 | Rogue as world-generator | `11` §2 S2 | ~1–2 weeks | An encounter creates a world |
| C4 | Living sky | `11` §2 S3 | ~1 week | The sky precesses |
| | **BLOCK D — reach the page** | | | |
| D1 | Canon Capture | `06` → Brief 3 | ~2 weeks | Prose proposes canon |
| D2 | Contradiction Ledger | `06` weeks 5–7 | ~1 week | World-level, three-way resolution |
| D3 | Dossier / characters | `05` A1 | ~2 weeks | POV points at something |
| D4 | Sensory brief | `11` → Brief S5 | ~1 week | The sim writes conditions |

### Why this order

**A2 before everything.** A continuity engine that reports confident wrong answers is worse than one that reports nothing — it trains the writer to dismiss the panel, and that lesson doesn't wash out. Two days.

**A3/A4 early because they're cheap and you feel them daily.** The whole legibility problem lives in shared components; fixing those fixes most screens at once.

**B1 before B2 is a judgement call, not a dependency.** B2 needs nothing. If you want a win in your hands this week, swap them — B2 is the more enjoyable build and it ships standalone.

**C2 sits between C1 and C3 deliberately.** Everything before it runs on derived-on-read facts. C3 (encounter epochs) and C4 (validity intervals) are the first things that genuinely cannot. Building the table earlier is premature; building it later blocks two phases.

**Blocks E and F sit between B and C deliberately.** E is cheap and you feel it every day. F is the holistic product — and the simulators publishing into a Codex with one page per entity (F1) is a far better outcome than publishing into a wiki, a graph, and an elements tab that don't agree. `13-THE-LIFT.md` §4 has the argument.

**Block G needs F5 first.** An engine without the Atlas as its destination is a tech demo. G runs alongside C — the sims publish entities, the engine renders them.

**Block D is where the product actually becomes itself.** If the calendar slips, slip Block C and G, not Block D.

---

## Session A1 — install

```
Install the StellarForge System Package. It's unzipped at ../stellarforge-system

Run its install.sh against this repo, then do the three manual steps it prints
at the end. Show me what changed when you're done.
```

**Stop and check:** `/sf-audit` and `/sf-contrast` both run and print a report. They will report a lot. That's the backlog.

---

## Sessions A2, B1, B2, C1, D4

Briefs are in `11-SIMULATOR-CONSTELLATION.md` §6. Paste them verbatim.

Order: **S-FIX** (A2) → **S0** (B1) → **S4** (B2) → **S1** (C1) → **S5** (D4).

---

## Sessions A3 / A4 — legibility

**A3 — shared components:**

```
Read docs/stellarforge/10-LEGIBILITY.md, then run the component pass brief at
the end of it.

Scope: src/components/ui/ ONLY. Do not touch tool pages or the Studio yet.

Stop after the primitives (Button, Input, Select, Panel, Tag, Toggle,
Checkbox) and show me a screenshot of each before continuing to the rest.
```

**A4 — everything else**, in a *new* session:

```
Read docs/stellarforge/10-LEGIBILITY.md.

The shared primitives are done. Run the same component pass across
src/components/tools/ and the Studio rail.

Grep the whole repo first and show me the counts before changing anything:
  - alpha borders (rgba/border-white)
  - disabled:opacity-*
  - t5 / sf-border / sf-border-strong
  - focus:outline-none with no replacement

Then work through them in that order. /sf-contrast when done.
```

**Stop and check:** tab through a tool page end to end. Every stop should show a visible teal ring. If any element swallows focus, that's a bug, not a preference.

---

## Session C2 — the facts table

```
Read docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §0 ("What this changes
about the architecture") and 02-ARCHITECTURE.md.

Facts are currently derived-on-read from worksheet blobs, which is correct and
should stay. This session adds persistence for the facts that CANNOT be
derived: prose-asserted, manually entered, and sim-promoted.

1. supabase/migrations — a `facts` table per 02-ARCHITECTURE.md: subject_id,
   predicate, object (FactValue), confidence, valid_from, valid_to, source.
   RLS mirroring `worlds`. Indexes per the "Indexing notes" section.

2. src/canon/index.ts — canon.facts() UNIONS derived facts (via the existing
   extractWorksheetFacts projection) with asserted rows. Callers must not be
   able to tell which is which.

3. canon.assert() writes asserted facts only, and returns
   { conflicts, staleDerived, affectedDocs }. It must never silently overwrite
   a fact with confidence:'canon'.

4. Precedence rule, and write it down in a comment: an asserted fact with
   confidence:'canon' outranks a projected fact for the same
   (subject, predicate, epoch). Anything lower does not — it surfaces as a
   conflict instead.

Constraints:
  - Do not migrate any worksheet data. Blobs stay the write path.
  - Do not change extractWorksheetFacts' signature beyond what S0 did.
  - Unit tests for the union and for the precedence rule.

Stop and show me the migration and the precedence test before wiring callers.
```

---

## Sessions C3 / C4 — Rogue, and the living sky

Both are specced in `11-SIMULATOR-CONSTELLATION.md` §2 (S2, S3). Write the brief from that spec at the time — they depend on how C1 and C2 actually landed, and a brief written now would be guessing.

Two things to carry into them:

- **C3 must write a Chronicle event.** That's its required Studio consequence. An encounter that changes the world and leaves no trace on the timeline hasn't finished.
- **C4 must use the world-level epoch scrubber, not a local slider.** If ExoSky gets its own private time control, the Chronicle-as-axis work later has to undo it.

---

## Sessions D1 / D2 / D3

- **D1 Canon Capture** — Brief 3 in `06-BUILD-ORDER.md`, unchanged. It now has a real facts table to write into, which is why it sits after C2.
- **D2 Contradiction Ledger** — `06`, weeks 5–7. The three-way resolution (canon right / prose right / both right, add an epoch boundary) is the part that matters; a two-way version will train writers to ignore it.
- **D3 Dossier** — `05-NEW-SYSTEMS.md` A1. Still the highest-value single build in the whole plan.

---

## What to say when things go sideways

| Situation | Say this |
|---|---|
| Claude proposes a schema change mid-session | `That's out of scope for this session. Note it and stop.` |
| Claude wants to fix adjacent code | `Leave it. One thing per session — add it to a list at the end.` |
| The diff has grown past what you can read | `Stop. Show me the file list and a one-line summary of each. We're splitting this.` |
| A gate blocks something you believe in | `Log it in docs/stellarforge/AMENDMENTS.md with a date and a reason, then proceed.` |
| Claude is confident but you're unsure | `Show me the evidence — file and line — before you change anything.` |
| A colour needs to change | `Change the target in design/derive.py and re-run derive.py && emit.py. Don't edit tokens.css.` |
| You're not sure a feature is worth it | `/sf-new-tool <name>` — it will argue against it if it should |

---

## The weekly loop, once you're moving

**Monday** — `/sf-audit`. Read one line: cross-surface reference density. If tool count is rising while density is flat, you're building World Anvil with better fonts. Say it out loud.

**Every visual change** — `/sf-contrast`.

**Every merge** — `/sf-ship`.

**Every simulator phase** — name its downstream Studio consequence *before* starting. If you can't, the phase isn't ready. This single rule is what stops a quarter disappearing into five islands talking beautifully to each other while the writing space stands still.

---

## The one question, again

Before starting any session, ask it about that session's work:

> **What does this change about how a scene reads?**

A2 answers it (the writer stops being lied to). A3 answers it. B2, C4, D1, D3, D4 answer it. B1, C1, C2, C3 are infrastructure — that's fine, but know which ones they are and don't let them expand on their own charm.
