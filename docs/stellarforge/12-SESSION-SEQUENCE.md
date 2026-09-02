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
| F1 | Codex entity page | `13` → Brief F1 | ~2 weeks | one URL per thing |
| F2 | Wiki → entity pages | `13` §4 | ~3 days | `/wiki` redirects |
| F3 | One graph | `13` → Brief F3 | ~1 week | `/graph` + `/connections` gone |
| F4 | Instruments open on an entity | `13` §4 | ~1 week | no blank worksheets |
| F5 | Atlas view | `13` §4 | ~2 weeks | Cartographer is the map |
| F6 | Four spaces, Bridge | `13` §4 | ~1 week | 14 surfaces → 4 |
| F7 | Tool folds (7 sessions) | `13` §3 | ~2 weeks | 27 → 17 instruments |
| | **BLOCK G — render engine** *(see `14-RENDER-ENGINE.md`; after F5)* | | | |
| G1 | Engine core, tiers, token binding, dispose | `14` → Brief G1 | ~1 week | blank scene, theme-aware |
| G2 | Star / Atmosphere / Surface materials + canon binding | `14` → Brief G2 | ~1 week | change a fact, the render changes |
| G3 | System scene → Orrery + Atlas | `14` §6 | ~1 week | fly-in |
| G4 | Galaxy scene: field, nebulae, lanes, territory | `14` §6 | ~2 weeks | the Stellaris shot |
| G5 | Sky scene → ExoSky | `14` §6 | ~1 week | precession renders |
| G6 | Encounter scene → Rogue | `14` §6 | ~1 week | ejection is visible |
| G7 | Chart tier, light themes, integrated-GPU pass | `14` §6 | ~1 week | works on a MacBook Air |
| | **BLOCK C — the constellation** | | | |
| C1 | Publish / open-on | `11` → Brief S1 | ~1 week | Solaris planet → ExoSky, one click |
| C2 | The facts table | `12` → Brief C2 below | ~3 days | Asserted facts persist |
| C3 | Rogue as world-generator | `11` §2 S2 | ~1–2 weeks | An encounter creates a world |
| C4 | Living sky | `11` §2 S3 | ~1 week | The sky precesses |
| | **BLOCK D — reach the page** | | | |
| D1 | Canon Capture | `06` → Brief 3 | ~2 weeks | Prose proposes canon |
| D2 | Contradiction Ledger | `06` weeks 5–7 | ~1 week | World-level, three-way resolution |
| D3 | Dossier / characters | `05` A1 | ~2 weeks | POV points at something |
| D4 | Sensory brief | `11` → Brief S5 | ~1 week | The sim writes conditions |
| | **BLOCK C — the constellation** | | | |
| C1 | Publish / open-on | `11` → Brief S1 | ~1 week | Solaris planet → ExoSky, one click |
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
