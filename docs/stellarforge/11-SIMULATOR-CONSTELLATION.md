# 11 · THE SIMULATOR CONSTELLATION

> Five simulators stop being islands. Written August 2026 against five directions Jason proposed
> from the sim side, which turn out to be one substrate and five surfaces of it.
> Read `00-CONSTITUTION.md` and `02-ARCHITECTURE.md` first.

---

## 0 · Identity — settle this before anything else

The continuity engine reconciles facts across tools. **How it decides two records are the same thing determines everything below.**

### The rule

> **Ids are the only truth. Similarity never merges — it suggests.**

- Every entity gets a UUID from whichever tool creates it.
- Every other tool references it **by id**, always.
- When two entities look alike, the system emits a **candidate**, not a merge:
  `POSSIBLE DUPLICATE · KEPLER-442B (SOLARIS, 3d ago) · KEPLER-442B (GENESIS, 1h ago) · REVIEW`
- Merging is explicit, recorded (`alias_of` + a merge event at an epoch), and reversible.

### Why "id first, name/value as fallback" is the wrong shape

It sounds like belt-and-braces. It isn't, for three reasons:

**It's not a fallback, it's the whole system.** If two records share an id there is nothing to reconcile — that's a join. The matcher only ever runs when the id is *absent*. Calling it a backup guarantees you under-build it and over-trust it.

**Names are your least stable key.** Renaming is not an edge case in worldbuilding; it's the main activity. Keying identity on the field most likely to change is backwards.

**Silent merges destroy distinctions the writer meant to keep.** Fork a world to test "what if the planet were bigger" and you have two planets, same name, that must stay separate. A helpful matcher welds them, and nothing records that it happened. That is unrecoverable data loss wearing the costume of a convenience feature.

### The reframe that makes the matcher worth keeping

**Instrument it. Every firing is a bug report.**

When the matcher finds a candidate, it has discovered a place where a tool minted a new entity instead of reusing an existing one. Log it, count it, and put the count on the Bridge:

```
// IDENTITY
DUPLICATE CANDIDATES THIS WEEK    40   ← 40 missing id handoffs
                          (prev)  61
```

Drive it toward zero. A continuity engine whose job is to eliminate its own reason to exist is a far better asset than one that papers over gaps indefinitely.

### What the diagnostic found — 2026-08-16

Three things. The shape of all the work below follows from them.

**1 · There is no entity identity anywhere in the continuity path.**
`ContinuityPanel` pools facts from every worksheet and every simulation in the world into one flat array (`ContinuityPanel.tsx:52-68`), and the resolution step is:

```ts
const fact = facts.find((f) => spec.keys.includes(f.key));   // continuity.ts:315
```

First match on a field-name string like `"surfaceGravity"`. Nothing in the chain knows which planet a paragraph is about — the panel's own props are `{ worldId, content }`. There is no entity id to pass, so none is passed.

**2 · That is a live correctness bug, not an architecture smell.**
In any world with two planets, every gravity sentence in the manuscript is checked against whichever Planetary Profile happens to sort first in the pooled array. The tab does not fail loudly. It reports confident, specific, wrong results.

That is worse than not shipping the feature. A writer who is warned about a contradiction that isn't one learns to dismiss the panel, and that lesson does not wash out. **Fix this before building anything on top of it.**

**3 · The hard part is already built.**

| Exists today | Is exactly |
|---|---|
| `entities` table with UUIDs, joined to worksheets via `entity_id` (`entity-sync.ts:30-36`) | the Entity node from `02-ARCHITECTURE.md` |
| `extractWorksheetFacts(tool_type, data)` (`worksheet-facts.ts`) | the per-tool **projection function** from Phase A |
| `WorksheetFact.key` = a master field key stable across tools | half a predicate — the attribute, with no subject |

Both halves of the substrate exist. They have simply never been introduced to each other: `checkContinuity` does not touch the entity table.

**The gap is one hop wide: facts know their value but not their subject.**

And one clean finding — the Check tab *is* the continuity engine. One system, not two. No Parallel Truth at the infrastructure layer.

### What this changes about the architecture

`02-ARCHITECTURE.md` implies a `facts` table on day one. Given what exists, that's heavier than necessary. Split facts by origin instead:

| Kind | Where it lives | Why |
|---|---|---|
| **Projected** — derived from a worksheet or sim blob | stays **derived on read**, via the existing `extractWorksheetFacts` | always fresh, no migration, no dual-write. Just add `subject_id`. |
| **Asserted** — from prose, manual entry, sim promotion | needs a small **`facts` table** | there is no blob to project from, and these carry `confidence`, `valid_from/to`, and provenance |

`canon.facts()` unions the two and callers never know the difference.

This means **you do not need a facts table to fix the bug or to ship the first three phases.** Persistence becomes necessary at exactly two moments: when prose can propose canon (Canon Capture), and when facts need validity intervals (the living sky, and Rogue's encounter epochs). Not before.

### Interim behaviour while subjects are still ambiguous

Between fixing the bug and having real scene→entity binding, `.find()` first-match must not survive. Two honest options, in order of preference:

1. **Ask.** `AMBIGUOUS: 2 PLANETS ON FILE. WHICH IS THIS SCENE ABOUT?` — one click sets it, and that click is the on-ramp to `set_in` / POV binding later.
2. **Only flag universal contradictions.** Check the sentence against *every* candidate subject and warn only if it contradicts all of them. Zero false positives, some false negatives. A vastly better failure mode than confident wrongness.

Ship 2 as the safety net, then 1 as the real fix.

---

## 1 · The five ideas are one primitive

| Idea | What it's actually asking for | Already specced in |
|---|---|---|
| **1** Solaris → ExoSky / Tidelock | tools reading **shared entities** | `02-ARCHITECTURE.md` (Entity) |
| **2** Rogue publishes survivors | a simulator **writing** entities + facts | `02` (SimRun contract) |
| **3** Living sky over centuries | facts with **validity intervals** | `00` Law V, `02` (Epochs) |
| **4** Unprompted consequence flags | the **Situation engine**, aimed inward | `02` (Situation) |
| **5** Simulators writing prose | the **narrative layer**, extended | `02` (Derivation.narrative) |

Build them as five features and you get five bespoke integrations. Build the substrate and all five fall out of it — along with Genesis, Phylo, Atlas, and everything else.

### On the word "handoff"

The UX in idea 1 is exactly right: click a planet in Solaris, land in ExoSky already pointed at it. The *plumbing* should not be a handoff.

A handoff is A→B. Five simulators with four destinations each is twenty directed integrations, each with its own parameter mapping, none of which compose with the other 22 tools.

What you want is **publish / open-on**:

```
Solaris  ──publish──▶  entities + facts  ◀──open-on──  ExoSky
                            ▲     ▲
                    Tidelock ┘     └ Genesis, Phylo, Atlas, …
```

Two verbs, implemented once. The route is just `/tools/exosky?entity=<uuid>&epoch=<n>`. ExoSky doesn't know Solaris exists — it reads `star.spectral_class`, `orbit.semi_major_axis`, `planet.radius` from canon and renders. Add a sixth simulator later and it costs a manifest, not twenty integrations.

---

## 2 · Sequence

### The quick win: **#4, standalone, no dependencies**

**Idea 4 is the only one of the five that needs no architecture at all.** A Tidelock flag that reads Tidelock's own output requires zero entities, zero epochs, zero canon. It is a pure function over numbers the simulator already has in memory.

It is also, per engineer-hour, the most valuable of the five — it's the thing that makes a simulator feel like it's paying attention.

Ship ~10 rules across the five sims. Each is a pure predicate over that sim's own output, each cites the values that triggered it, each is dismissible.

| Sim | Rule | Fires as |
|---|---|---|
| Tidelock | terminator band < 5° | `HABITABLE BAND: 4.1°. THAT IS NOT A CIVILIZATION. THAT IS A VALLEY.` |
| Tidelock | atmosphere too thin to redistribute heat | `NO HEAT TRANSPORT. DAYSIDE 480K, NIGHTSIDE 90K. NOTHING CROSSES.` |
| Solaris | N-body instability inside the habitable zone | `ORBIT UNSTABLE ON 10⁵yr TIMESCALES. NO TIME FOR BIOLOGY.` |
| Solaris | flare-active M-dwarf, unmagnetised planet | `ATMOSPHERE STRIPPED IN ~200 Myr. SURFACE LIFE UNSUPPORTED.` |
| ExoForge | density implies iron core / no plate tectonics | `NO CARBON CYCLE. CLIMATE HAS NO THERMOSTAT.` |
| ExoForge | insolation below the photosynthesis floor | `LIGHT BUDGET BELOW PLANT VIABILITY. WHAT EATS HERE?` |
| Rogue | ejected body retains tidal heating | `STARLESS. STILL WARM. SUBSURFACE OCEAN FOR ~40 Myr.` |
| Rogue | encounter perturbs a body into the HZ | `THIS WORLD BECAME HABITABLE BY ACCIDENT, AT A DATE.` |
| ExoSky | fewer than N naked-eye stars | `A SKY THIS EMPTY PRODUCES NO CONSTELLATIONS. NO NAVIGATION. NO ASTROLOGY.` |
| Gravitas | spin gravity with a Coriolis gradient over comfort threshold | `WALKING ALONG THE RING FEELS WRONG. EVERYONE HERE HAS SEA LEGS.` |

Two of these — the empty-sky rule and the accidental-habitability rule — are the kind of thing a writer will screenshot.

**Voice discipline:** state the consequence, not the number. `HABITABLE BAND: 4.1°` is data; *"that is not a civilization, that is a valley"* is the product. Same rule as derivation narratives.

---

### The track — subjects first, then the five

**S-FIX · Stop the wrong answers** *(~2 days — do this first)*
Replace `.find()` with the universal-contradiction check above. No new tables, no new concepts. This is a bug fix, and it stands alone.
**Studio consequence:** the Check tab stops lying.

**S0 · Subjects** *(~3–5 days)*
`WorksheetFact` gains `subject_id`, populated from the `entity_id` join that already exists. `checkContinuity` takes a subject scope instead of pooling the world. The matcher — where one exists at all — is demoted to a *suggester* and instrumented per §0.
**Studio consequence:** the Check tab becomes correct for multi-planet worlds, and the `Refs` rail can group by entity.

**S1 · Publish / open-on** *(~1 week)*
Two verbs on every simulator. `publish` writes entities + facts with `source:{kind:'sim', run_id, seed}`. `open-on` accepts `?entity=&epoch=`. Add the click-through from Solaris's system view.
**Studio consequence:** published planets appear in the Codex, and the Studio rail's `World` tab can cite them.

**S2 · Rogue as world-generator** *(~1–2 weeks)*
Rogue's outcome becomes a set of entity mutations at an epoch: `ejected`, `captured`, `destroyed`, `orbit_changed`. Publishing closes `valid_to` on the old orbital facts and opens new ones at the encounter epoch. Ejected bodies get `planet.starless = true`.
The payoff: open an ejected planet in **ExoSky** and get a sky with no sun. Open it in **Tidelock** and the tool correctly says *this no longer applies* — which is itself information.
**Studio consequence:** the encounter writes a Chronicle event.

**S3 · Living sky** *(~1 week — `astro.ts` already does the maths)*
ExoSky takes an epoch and precesses. Wire it to the **world-level** epoch scrubber rather than a local slider, so it's the same control the Codex and the Studio rail use.
**Studio consequence:** a scene with a pinned `set_in` epoch shows that scene's sky.

**S5 · Sensory brief** *(~1 week + guardrails — see §3)*

### On persistence

S-FIX, S0, S1 and #4 all run on derived-on-read facts. The small `facts` table arrives with **S2** (Rogue needs encounter epochs) and is required by **S3** (the sky needs validity intervals). That is the right moment — not earlier.

---

## 3 · Idea 5 — where it collides with the Constitution

`04-STUDIO-CHARTER.md`: **"Never write the prose. Not a sentence, not a paraphrase, not a smart rewrite."**

"Three sentences of what a character standing there would feel" crosses that line. Don't drop the idea — draw the line precisely, because the difference is real and it is the difference between a tool writers trust and one they resent.

| | |
|---|---|
| **Briefing — allowed** | *"Sunlight at this flux on bare skin is roughly two metres from an open forge. Sound carries about a third as far as Earth-normal: shouting is useless, so people stand close. The sun does not move."* |
| **Ghostwriting — forbidden** | *"Kira squinted against the red glare, her throat raw with dust."* |

**The test: if it could be pasted into chapter 3 unchanged, it's ghostwriting.**

Hard rules:

- **Impersonal or second person.** Never a named character, never a POV, never an interior state.
- **Conditions, not events.** Describe what is true of the place, never something that happens.
- **No one-click insert.** It may be copied by hand. It may never be a button that puts text in the manuscript.
- **Labelled.** `// CONDITIONS BRIEF · DERIVED · NOT CANON, NOT PROSE`
- **Grounded.** Every clause traces to a fact in the bundle handed to the model. If it can't cite, it doesn't ship.
- **Deterministic bundle in.** The model phrases; it never computes. Numbers come from the sim.

Done this way it is a field-manual entry, it is the single best screenshot in the product, and it does not touch the manuscript.

---

## 4 · The idea none of the five contained

**Precession × Mythos.**

Once ExoSky precesses (S3) and Mythos knows which constellations a culture named (`planet.sky.constellations[]`), the drift between them is derivable — and it is a story:

```
// SKY DRIFT
THE FOUNDING COMPASS HAS PRECESSED 14° SINCE THE MYTH WAS RECORDED.
NO LIVING WITNESS HAS SEEN IT ALIGNED.
CITES: culture.myth[founding_compass] · planet.sky.constellations[] @ epoch 2140 / 2340
```

Real astronomy, derived from the writer's own decisions, and no competitor can generate it. It costs one Situation rule once S3 exists.

---

## 5 · The discipline that keeps this honest

All five ideas are simulator-side. The simulators are the most enjoyable surface in the product and the least connected to the page. There is a real path where a quarter goes by, the five sims talk to each other beautifully, and the Studio is exactly where it is today.

**The rule: no simulator phase ships without one downstream Studio consequence.** Each phase above names its own. If a phase can't name one, it isn't ready.

Run the Prime Law question on each before starting:

| | *What does this change about how a scene reads?* |
|---|---|
| #4 | Directly — the flag becomes a constraint the writer honours |
| #3 | Directly — a flashback scene gets the sky of its own epoch |
| #5 | Directly — that's its entire purpose |
| #1 | **Only once something downstream consumes it** |
| #2 | **Only once the Chronicle event lands** |

#1 and #2 are infrastructure. That's fine — but be honest that they're infrastructure, and don't let them absorb a quarter on their own merits.

---

## 6 · Paste-ready briefs

### Brief S-FIX — stop the wrong answers (do this first)

```
Read docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §0.

continuity.ts:315 resolves a fact with:
    facts.find((f) => spec.keys.includes(f.key))

The facts array is pooled across every worksheet and simulation in the world
(ContinuityPanel.tsx:52-68), so in any world with two planets this checks the
prose against whichever Planetary Profile sorts first. It reports confident,
specific, wrong contradictions.

Fix the failure mode without building new architecture:

1. Group the pooled facts by key. Where a key has exactly one fact, behaviour
   is unchanged.

2. Where a key has MORE THAN ONE fact, only report a contradiction if the
   sentence contradicts EVERY candidate. If any candidate is consistent,
   report nothing.

3. When it does fire on a multi-candidate key, say so:
     CONTRADICTS ALL 3 PLANETS ON FILE.

4. Add a test with a two-planet fixture world that fails against the current
   code and passes after.

Constraints:
  - No schema changes. No new tables. No entity wiring yet — that's S0.
  - Do not change what counts as a contradiction, only which subjects are
    considered.
  - Ship's Voice on any new string.

This is a bug fix and it stands alone. Show me the diff.
```

### Brief S0 — give facts a subject

```
Read docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §0 and
docs/stellarforge/02-ARCHITECTURE.md (Entity, Fact).

Everything needed already exists and is not connected:
  - entities table with UUIDs, joined to worksheets via entity_id
    (entity-sync.ts:30-36)
  - extractWorksheetFacts(tool_type, data) in worksheet-facts.ts — the
    per-tool projection

Wire them together.

1. WorksheetFact gains `subject_id: UUID | null`, populated from the
   worksheet's entity_id join. A fact with no subject is still valid — it
   just can't be scoped.

2. checkContinuity takes an optional subject scope. When scoped, it considers
   only facts whose subject_id matches. When unscoped, it keeps the S-FIX
   universal-contradiction behaviour.

3. ContinuityPanel accepts an entityId prop. When the current document has a
   subject, pass it. When it doesn't, render the picker:
     AMBIGUOUS: 3 PLANETS ON FILE. WHICH IS THIS SCENE ABOUT?
   Persist the choice on the document — this is the on-ramp to set_in/POV.

4. Any place that resolves identity by name or value similarity becomes a
   SUGGESTER: it may propose "possible duplicate — review", never merge.
   Count the proposals and log the count.

Constraints:
  - Facts stay derived-on-read. Do NOT add a facts table in this session.
  - Never merge two entities automatically, for any reason.
  - Two-planet fixture test: scoped check must return different results for
    each planet.

Stop and show me the WorksheetFact type and the checkContinuity signature
before touching the panel.
```

### Brief S4 — consequence flags (no dependencies, start here)

```
Read docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §2 and
docs/stellarforge/02-ARCHITECTURE.md (the Situation node).

Build sim-local consequence flags. No canon graph needed — these are pure
functions over each simulator's own output.

1. src/sims/flags/ — a SimFlag type: { id, sim, severity, reads, when, title,
   body, cites }. Pure predicates. No randomness, no model calls, no side effects.

2. Implement the ten rules in the table in §2. Each MUST cite the specific
   values that triggered it — a flag the writer can't trace is a flag they'll
   learn to ignore.

3. Render inside the simulator chrome, below the readouts. Ship's Voice.
   Dismissible per run. Never modal, never blocking.

Voice rule: state the CONSEQUENCE, not the number.
  BAD   "Terminator band: 4.1 degrees"
  GOOD  "HABITABLE BAND: 4.1°. THAT IS NOT A CIVILIZATION. THAT IS A VALLEY."

Follow the stellarforge-design skill. Simulator chrome keeps product teal
and rounded-lg per the Tidelock reference. Legacy cyan #00D4FF is retired
(SF-II settled decision #3) — do not use it.

Show me the ten rule predicates before wiring any UI.
```

### Brief S1 — publish / open-on

```
Read docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §1 and the SimRun
contract in 02-ARCHITECTURE.md.

Give every simulator two verbs. Do NOT write pairwise integrations.

1. publish(runId) → writes entities + facts through canon.assert() with
   source:{kind:'sim', tool_id, run_id, seed}. Always a reviewable diff first:
   "PROMOTE 14 VALUES TO CANON". Never automatic.

2. open-on: every simulator route accepts ?entity=<uuid>&epoch=<n> and
   hydrates from canon. A simulator must NOT know which other simulator
   produced the entity — it reads predicates, not tool output.

3. Solaris system view: clicking a planet links to
   /tools/exosky?entity=<uuid> and /tools/tidelock?entity=<uuid>.

4. Studio consequence (required): published planets appear in the Codex.

Verify by hand: generate a system in Solaris, publish, click a planet, land
in ExoSky already pointed at it. Screenshot each step.

Constraint: if you find yourself writing a function whose name contains two
tool names, stop — that's a handoff, and it's the thing we're avoiding.
```

### Brief S5 — sensory brief (only after S4)

```
Read docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §3. The guardrails there
are not suggestions — they're the line between a tool writers trust and one
they resent.

Build "conditions brief" on the simulators.

IN:  a deterministic fact bundle from the sim (gravity, insolation, spectral
     class, atmospheric pressure, day length, temperature range).
OUT: 3–5 sentences of PHYSICAL CONDITIONS.

HARD RULES — a violation of any is a failed review:
  • Impersonal or second person. No named characters. No POV. No interior state.
  • Conditions, never events. What is true of the place, not what happens in it.
  • No insert-into-manuscript button. Copyable by hand only.
  • Labelled: // CONDITIONS BRIEF · DERIVED · NOT CANON, NOT PROSE
  • Every clause traces to a fact in the input bundle. No invented numbers —
    the model phrases, it never computes.

The test: if the output could be pasted into chapter 3 unchanged, it failed.

Show me five sample outputs from five different worlds before wiring the UI.
I want to check the voice before it ships.
```
