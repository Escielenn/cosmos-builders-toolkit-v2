# 05 · NEW SYSTEMS

> Tools, simulators, and surfaces that only make sense once the Canon Graph exists.
> Everything here is **[NEW]**. Ranked by leverage on the Prime Law, not by how fun it is to build.

---

## The rule for adding anything

Before a new tool is approved, it must answer all four:

1. What predicates does it **produce** that nothing else produces?
2. What does it **consume** that already exists?
3. What does it change about **how a scene reads**?
4. What existing surface does it **absorb or replace**?

A tool that fails #3 is a calculator, not a StellarForge tool. A tool that fails #4 in a product with 27 tools and ten always-on overlays is chrome creep.

---

## Tier A — the missing spine

### A1 · Dossier: Character Development

*On the public roadmap as "Character Development." It is not a nice-to-have; it is the missing join between the world and the book.*

StellarForge models stars, planets, species, polities, mythologies — and no people. But a novel is people. Every Studio document has a POV and there is nothing to point it at.

**Produces:** `character.*` — species ref, birth epoch, polity ref, native language ref, body facts (height/mass under local g), sensory profile inherited from Sensorium, beliefs inherited from Mythos, relationships (typed edges to other characters), arc beats bound to Chronicle events.

**Consumes:** Phylo, Sensorium, Mythos, Dominion, Lexdrift, Chronicle.

**Scene impact:** binds `Doc.pov_entity_id`. Unlocks perception advisories, dialect, oath vocabulary, age-in-local-years, weight-under-local-gravity. Unlocks dramatis personae in Compile. Unlocks the relationship graph.

**Absorbs:** nothing — this is net-new, and it is the highest-value single build in this document.

> A character in StellarForge is not a card with a bio. It is an entity whose every trait is *inherited from the world*, with overrides. Fill in "born on Kellis, Verrid, House Adran" and the dossier pre-populates lifespan, sensory range, gravity adaptation, native phonology, and funeral customs. **That's the pitch.**

### A2 · Situations Engine

The Stellaris event layer. Spec in `02-ARCHITECTURE.md`.

**Produces:** `Situation[]` — deterministic, cited, actionable.

**Scene impact:** a fifth Studio rail tab and a Bridge counter. Turns the graph from a reference into a collaborator.

**Starter rule set.** These nine are specified here. Write roughly a dozen more in the same shape — hand-authored, deterministic, cited — before considering anything generative. Ship the tab when you have twenty you'd defend.

| Rule | Fires when | Reads as |
|---|---|---|
| `high-g-spaceflight-ambition` | `planet.surface_gravity > 1.3` ∧ `polity.has_spaceflight` | `GRAVITY WELL / EXIT COST` — every kilogram to orbit costs disproportionately. Who pays? |
| `tidelock-no-diurnal-myth` | `orbit.tidally_locked` ∧ `culture.has_solar_deity` | `NO SUNRISE ON FILE` — a locked world has no dawn. What replaces the resurrection motif? |
| `atmo-biochem-mismatch` | `species.biochemistry` incompatible with `planet.atmo_composition` | `RESPIRATION UNSUPPORTED` — this body cannot breathe this air. Native, imported, or wrong? |
| `language-drift-past-intelligibility` | `language.mutual_intelligibility[]` below threshold between two languages ∧ a single `polity.territory[]` contains both | `ADMINISTRATIVE APHASIA` — the empire's two halves no longer share a language. |
| `sensory-mismatch-first-contact` | two species with disjoint sensory modalities ∧ contact event | `NO SHARED CHANNEL` — how did they say hello? |
| `carrying-capacity-negative` | derived population curve crosses zero within the Chronicle span | `POPULATION FAILURE AT EPOCH n` |
| `axiom-violated-downstream` | a fact contradicts `world.axiom_constraints` | `SECOND LIE DETECTED` — Axiom permits one violation. This is a second. |
| `sky-myth-mismatch` | Mythos constellations ∉ Exosky visible set | `THEY CANNOT SEE THAT STAR` |
| `orphan-entity` | entity with no facts and no mentions for 30 days | `UNSURVEYED` |

Each cites its facts and offers a scene prompt. **`axiom-violated-downstream` and `sky-myth-mismatch` are the two that will make writers tell other writers about this product.**

### A3 · The Bridge

Replace the current home/dashboard-of-cards with a single **state view of one world at one epoch**.

```
// KELLIS · EPOCH 2340 CE

CANON        847 facts   ·   12 proposed   ·   2 contradicted
ENTITIES     3 stars · 7 planets · 4 species · 11 polities · 23 characters
MANUSCRIPT   64,120 words   ·   41 documents   ·   4 canon-changed
PENDING      3 situations   ·   2 contradictions   ·   6 stale derivations
```

Below: the three things to do next, chosen by the system. Not a grid of 27 tool cards — the writer already knows the tools exist.

**Absorbs:** the current world dashboard card grid, the Recent Activity feed, and at least three of the always-on chrome layers.

### A4 · Canon Capture

Spec in `04-STUDIO-CHARTER.md` §2.2. Listed here because it is a *system*, not a Studio feature — the claim detector, the proposal queue, the `proposed` confidence tier, and the provenance-to-prose link are shared infrastructure.

---

## Tier B — high leverage, moderate cost

### B1 · Onomastics (naming service)

Not a page. A **service** with a `⟳` affordance on every entity-name field in every tool.

**Consumes:** `language.phonology` from Lexdrift, `culture.*` from Mythos, entity type.
**Produces:** name suggestions that are *actually from the culture that would have named the thing*.

Cheap to build, appears everywhere, and every use is a visible proof that the tools are connected. Highest perceived-interconnection per engineer-hour in this document.

### B2 · Chronicle as axis

Not a new page — a promotion of the existing one. Facts gain `valid_from`/`valid_to`; a world-level epoch scrubber propagates to Codex, graph, map, and Studio rail; documents can pin an epoch (`set_in`).

**Absorbs:** the separate `Timeline` tool (Law VII).

### B3 · Pressure Model / Advance the Clock

The systemic-simulation layer, kept honest.

Take population, energy, ecology, and cohesion as slow variables with derivations already in the graph. Let the writer **advance the world N years** and watch which facts drift, which Situations fire, and where the model breaks.

**Critical framing:** this is a *stress test*, not a generator. The output is `THESE 6 FACTS BECOME UNSUSTAINABLE BY EPOCH 2520`, not a generated history. The writer decides what actually happened; the model tells them what their premise can't support.

Scope discipline: four to six slow variables, transparent equations, every projection labelled `PROJECTED — NOT CANON` until promoted.

### B4 · Fork & Diff (What-If)

Fork a world, change one upstream fact, diff the cascade and the affected prose.

*"What if the planet weren't tidally locked?"* → 40 facts change, 9 scenes flagged, 3 Situations resolve, 2 new ones appear. Merge back or discard.

The existing `The Tidelock Archives (Fork)` world suggests forking already partly exists. The diff is the new part.

### B5 · Cartographer as spatial index

Promote Stellar Cartographer from Pro toy to navigational spine. Every located entity renders. Click a system → Codex. Click a planet → Genesis. Draw a route → `route.distance_ly` written to canon and Impulse seeded with it. Overlay polity territory from Dominion, trade lanes from Impulse, contact events from Chronicle.

**Absorbs:** the roadmapped "Solar System Cartographer" and "Planet / Moon Cartographer" — these are zoom levels of one map, not three tools.

### B6 · Ecology (Symbiosis, promoted)

Symbiosis currently records a matrix. Make it a **trophic model**: energy flux from `star.luminosity` → primary productivity → trophic levels → viable predator body mass. Then Phylo's 400 kg apex predator on a low-productivity world gets flagged.

Produces `ecology.*`. Consumes Genesis, Phylo, Tidelock. Fires `carrying-capacity-negative`. This is Symbiosis promoted, not a new tool — it keeps the `symbiosis` tool id.

---

## Tier C — roadmap items, respecified as graph citizens

The public roadmap already promises these. Build them under the charter or don't build them.

| Roadmap item | Produces | Consumes | Scene impact | Verdict |
|---|---|---|---|---|
| **Generation Ship Designer** | `vessel.closed_loop_efficiency`, `vessel.pop_genetics`, drift events → Chronicle | Vessel, Phylo, Impulse, Paradox | Shipboard scenes get real deck plans, real air, real drift | **Build** — high graph density |
| **BDO: Big Dumb Object** | `artifact.*` — scale, engineering constraints, observability | Axiom, Paradigm, Cartographer | The awe scene needs numbers to be awe | **Build** |
| **Warp Travel Calculator** | `route.*` alt metric | Axiom, Impulse | Merges with Paradox as a mode, not a separate tool | **Merge into Paradox** |
| **Orbital Mechanics / Year Calculator** | `orbit.period`, `planet.year_length`, seasons | Orrery, Genesis | Seasons, calendars, festival timing — feeds Mythos | **Fold into Orrery** |
| **Atmosphere Composition** | `planet.atmo_*` detailed | Genesis, ExoForge | Breathability, sky colour, sound propagation, fire behaviour | **Fold into Genesis** |
| **Solar System Cartographer** | — | — | — | **Fold into Cartographer** as a zoom level |
| **Planet / Moon Cartographer** | `place.*` with coordinates, biomes | Genesis, Tidelock, Symbiosis | Settings become located; scenes get a `set_in` target | **Build** — this is what makes `set_in` real |
| **AI Development** | `tech.ai_*`, `polity.ai_relations` | Paradigm, Dominion, Axiom | A character class and a political actor | **Build after Dossier** |
| **Quantum and Beyond** | `world.axiom` variants | Axiom | — | **Fold into Axiom** as a preset library |
| **Character Development** | see A1 | | | **Build first** |

Net: the ten promised roadmap items become **five real builds, four folds, and one merge**. That is the Law VII dividend — the roadmap gets shorter and the product gets denser.

---

## Tier D — the far edge

Only after Tiers A–C. Listed so they don't get built by accident first.

- **Reader mode / published world** — Showcase, upgraded: an explorable canon for readers, epoch-scrubbable, spoiler-gated by Chronicle position.
- **Continuity reader export** — hand a copy-editor the manuscript plus a machine-checkable canon.
- **Series manager** — multiple manuscripts over one world, with per-book epoch spans and shared canon.
- **Collaborative canon** — co-authors proposing facts against a shared world with review. Real-time cursors remain out of scope.
- **Physical output** — a printed world bible from the graph. This is Cosmos Builders Toolkit territory and it is a real revenue line.

---

## What to remove

Interconnection is also subtraction. Candidates, in order:

1. **Timeline** — absorbed by Chronicle.
2. **One of `/graph` and `/connections`** — three views of two graphs across two routes. Pick one route, keep the view toggle.
3. **Always-on chrome** — the persistent stack is ten layers deep. Audit `FABStack`, `StatusBar`, `CosmicVelocityTicker`, `TextureOverlay`, `DataBurstOverlay`, `VideoBackground`. Ambient telemetry is signature; ambient noise is slop. Target: six.
4. **ToolPageLayout vertical chrome** — back link → quote → action bar → pin → eyebrow → title → Pro chip → subtitle → arc → worksheet title → tags → intro → upstream callout, all before the first input. Measure scroll-to-first-input on every tool; target under 400 px.
5. **Warp / Orbital / Atmosphere / Solar-System-Cartographer / Quantum** as standalone roadmap tools — folded per Tier C.
