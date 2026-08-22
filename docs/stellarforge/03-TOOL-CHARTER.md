# 03 · TOOL CHARTER

> What every tool must become to be a citizen of the graph.
> No tool ships — new or retrofitted — without a manifest.

---

## The Manifest

Every tool declares itself. Colocated with the tool: `src/tools/<id>/manifest.ts`.

```ts
import type { ToolManifest } from '@/canon/types'

export const manifest: ToolManifest = {
  id: 'genesis',
  name: 'Genesis: Planetary Profile',
  kind: 'worksheet',                    // worksheet | calculator | simulator | cartographer
  category: 'worlds',
  accent: 'azure',

  // ---- what this tool CREATES -------------------------------------------
  entities: [
    { type: 'planet', from: 'field:world_name', primary: true },
  ],

  // ---- what this tool WRITES to the graph --------------------------------
  produces: [
    { predicate: 'planet.radius',           from: 'field:radius',   unit: 'earth_radii' },
    { predicate: 'planet.mass',             from: 'field:mass',     unit: 'earth_masses' },
    { predicate: 'planet.rotation_period',  from: 'field:day_len',  unit: 'hours' },
    { predicate: 'planet.atmo_composition', from: 'field:atmo',     kind: 'text' },
  ],

  // ---- what this tool READS from the graph -------------------------------
  consumes: [
    { predicate: 'star.spectral_class',    required: false, onMissing: 'prompt',
      prompt: 'NO PRIMARY STAR ON FILE. RUN ORRERY OR ENTER MANUALLY.' },
    { predicate: 'star.luminosity',        required: false, onMissing: 'derive' },
    { predicate: 'planet.surface_gravity', required: false, onMissing: 'link',
      producer: 'atlas' },   // readout only — Atlas owns this
  ],

  // ---- derivations this tool registers -----------------------------------
  // NOTE: gravity and escape velocity are Atlas's, not Genesis's. See the
  // anti-duplication registry below. Genesis registers none of its own yet.
  derives: [],

  // ---- situations this tool can trigger ----------------------------------
  // A tool lists a situation if its predicates are anywhere in that rule's
  // input chain — including as inputs to a derived trigger predicate.
  // Genesis owns mass and radius, which feed Atlas's surface_gravity.
  situations: ['high-g-spaceflight-ambition', 'atmo-biochem-mismatch'],

  // ---- how this tool reaches the writing space ---------------------------
  studio: {
    railSection: 'World',
    influences: ['scene.physicality', 'scene.weather', 'scene.travel'],
    narrative: (facts) => [
      `Surface gravity ${facts['planet.surface_gravity']} g.`,
      `A fall here carries ${pct(facts)} more energy than on Earth.`,
    ],
  },

  // ---- neighbors: where the user goes next -------------------------------
  downstream: ['phylo', 'cascade', 'atlas'],
  upstream: ['orrery', 'goldilocks', 'solaris'],
}
```

### Why the manifest is the enforcement mechanism

Written philosophy drifts. A typed object that CI validates does not.

`/sf-audit` reads every manifest and fails on:

- a tool with **no `produces`** → Law I violation (orphan data)
- a `produces` predicate absent from `08-VOCABULARY.md` → namespace drift
- a `consumes` with no `onMissing` handler → dead-end readout, Law III
- a tool with **no `studio` block** → the tool does not reach the page, Prime Law
- a `derives` id with no `narrative` → the cascade will be illegible
- a predicate produced by two tools with no shared derivation → Parallel Truth risk

---

## The five obligations

Every tool, without exception:

**1. Ingest.** Open pre-filled from canon. Never make the writer retype what the world already knows. Where a value comes from canon, mark it: a small mono tag `// FROM ORRERY` with click-through provenance.

**2. Emit.** Every field either maps to a predicate or is declared `ephemeral: true` with a one-line reason. There is no third state.

**3. Narrate.** Every computed value ships with one Ship's-Voice sentence of *consequence*, not restatement. `1.4 g` is data. *"Stairs are a hazard. Your architecture goes low and wide."* is the product.

**4. Reach the page.** Every tool declares what it contributes to the Studio rail. A tool that cannot answer "what does this change about how a scene reads?" has not justified its existence.

**5. Point onward.** `upstream` / `downstream` power the existing UpstreamCallout and CascadeSuggestionToast — but from the manifest, not hardcoded. The writer should never wonder what to do next.

---

## Retrofit table — the 27 existing tools

Ordered by **interconnection leverage**, not by category. The top of this list is where the next 90 days go.

Legend: **P** = produces (highest-value predicates) · **C** = consumes · **★** = leverage rank

### Tier 1 — the load-bearing five (wire these first)

| ★ | Tool | Route | Must produce | Must consume | Studio contribution |
|---|---|---|---|---|---|
| 1 | **Genesis** | `/tools/planetary-profile` | `planet.*` — radius, mass, rotation, obliquity, atmosphere, hydrosphere, temp | `star.spectral_class`, `star.luminosity`, `orbit.semi_major_axis` | The physical texture of every scene set on the planet. Weight, weather, day length, sky colour. |
| 2 | **Cascade** | `/tools/environmental-chain-reaction` | *nothing new* — **[NEW]** becomes the live derivation-DAG viewer | everything | The "World" rail tab **is** Cascade, scoped to the current scene. |
| 3 | **Phylo** | `/tools/evolutionary-biology` | `species.*` — biochemistry, body plan, lifespan, metabolism, cognition, reproduction | `planet.surface_gravity`, `planet.atmo_composition`, `planet.temp_mean`, `star.spectral_class` | POV physiology. What this body can do, how long it lives, what it eats. |
| 4 | **Sensorium** | `/tools/sensorium` | `species.senses[]` — modality, range, acuity, absent modalities | `species.*`, `planet.atmo_pressure`, `star.spectral_class` | **The single best tools↔writing bridge in the product.** See below. |
| 5 | **Mythos** | `/tools/xenomythology-framework-builder` | `culture.cosmology`, `culture.deities[]`, `culture.taboos[]`, `culture.death_rites` | `species.*`, `planet.*`, `culture.*`, Chronicle events | What a character swears by, fears, and refuses to say. |

> **Sensorium is the demo.** When the writer sets a scene's POV to a species with no trichromatic vision, the rail should say `// POV: VERRID · NO COLOUR VISION · INFRASOUND TO 4 Hz`, and the phrase "the red sunset" should get a soft advisory flag. Nothing else in the worldbuilding-software market does this. Build it early, film it, put it on the landing page.

### Tier 2 — the physics spine

| ★ | Tool | Route | Must produce | Must consume |
|---|---|---|---|---|
| 6 | **Orrery** | `/tools/star-system-builder` | `star.*`, `orbit.*`, `system.body_count`, entity tree of bodies | `system.*` from Solaris |
| 7 | **Goldilocks** | `/tools/habitable-zone-calculator` | `system.hz_inner`, `system.hz_outer`, `planet.hz_position` | `star.luminosity`, `star.spectral_class`, `orbit.semi_major_axis` |
| 8 | **Atlas** | `/tools/surface-gravity-calculator` | `planet.surface_gravity`, `planet.escape_velocity` | `planet.mass`, `planet.radius` |
| 9 | **Gravitas** | `/tools/gravitas` | `vessel.spin_gravity`, `place.g_profile` | `vessel.radius`, `planet.surface_gravity` |
| 10 | **Paradox** | `/tools/time-dilation` | `route.dilation_factor`, `route.proper_time`, `route.coordinate_time` | `route.distance_ly`, `propulsion.cruise_fraction_c` |

**Note on 8:** Atlas and Genesis both currently ask for gravity. Under the charter, exactly one of them *produces* `planet.surface_gravity` (Atlas, via derivation) and the other *consumes* it. Resolving this duplication is the cleanest possible first demonstration of the whole architecture — a two-hour change that proves the model.

### Tier 3 — civilization and consequence

| ★ | Tool | Route | Must produce | Must consume |
|---|---|---|---|---|
| 11 | **Axiom** | `/tools/one-big-lie` | `world.axiom`, `world.axiom_constraints[]` | — (this is a root fact) |
| 12 | **Impulse** | `/tools/propulsion-consequences-map` | `propulsion.*`, `economy.transit_cost` | `world.axiom`, `route.distance_ly` |
| 13 | **Dominion** | `/tools/empire-designer` | `polity.*` — governance, factions, succession, legitimacy, `polity.cohesion_radius`, `polity.territory[]` | `species.*`, `culture.*`, `propulsion.cruise_fraction_c` |
| 14 | **Paradigm** | `/tools/technology-consequences` | `tech.*`, second/third-order social effects | `world.axiom`, `polity.*`, `species.*` |
| 15 | **Vessel** | `/tools/spacecraft-designer` | `vessel.*` — crew, life support, layout, culture-aboard | `propulsion.*`, `species.*`, `planet.surface_gravity`, `route.*` |
| 16 | **Exodus** | `/tools/space-expansion-modeler` | `expansion.phase_timeline[]` → Chronicle events | `propulsion.*`, `economy.*`, `polity.*` |
| 17 | **K-Scale** | `/tools/kardashev-scale` | `polity.energy_budget`, `polity.kardashev` | `polity.*`, `system.*` |
| 18 | **Signal** | `/tools/drake-equation-calculator` | `galaxy.civ_count`, `galaxy.contact_probability` | `star.*`, `system.*` — already surfaces in Connections as "Drake Context" |
| 19 | **Symbiosis** | `/tools/species-interaction-matrix` | `ecology.relations[]` (typed edges between species entities), `ecology.biome_set[]` | `species.*`, `planet.temp_mean`, `planet.hydrosphere_fraction` |
| 20 | **Lexdrift** | `/tools/lexdrift` | `language.*` — phonology, drift rate, divergence tree | `route.*`, `polity.*`, Chronicle spans |

**Lexdrift is under-used.** Once it produces a phonology, it can seed an **onomastics service**: every entity-creation field in every tool gets a `⟳ SUGGEST` affordance drawing on the actual language of the actual culture. Cheap to build, enormous perceived interconnection.

### Tier 4 — simulators (apply the SimRun contract from `02-ARCHITECTURE.md`)

| ★ | Tool | Route | Snapshot must emit |
|---|---|---|---|
| 21 | **Tidelock** | `/tools/tidelock` | `planet.terminator_band_width`, `planet.temp_gradient[]`, `planet.habitable_area`, wind regime |
| 22 | **ExoForge** | `/tools/exoforge` | `planet.composition`, `planet.radius`, `planet.mass`, `planet.surface_type`, NASA import provenance |
| 23 | **Solaris** | `/tools/solaris` | `system.*`, `star.*`, `orbit.*` for every generated body, N-body stability flag |
| 24 | **Exosky** | `/tools/exosky` | `planet.sky.visible_stars[]`, `planet.sky.constellations[]` — **feeds Mythos directly** |
| 25 | **Rogue** | `/rogue` | `system.perturbation_events[]` → **Chronicle events with epochs** |

**Exosky → Mythos is the most poetic edge in the product.** The constellations a species can actually see from their world should be the constellations their myths are about. Wire it and say so on the marketing site.

### Tier 5 — the integration surfaces

| ★ | Surface | Change |
|---|---|---|
| 26 | **Stellar Cartographer** | `/tools/stellar-cartographer` — promote to **spatial index**: every located entity renders; click-through to Codex; drawn routes produce `route.distance_ly` and seed Impulse. Produces `route.*`; consumes `polity.territory[]` to draw territory overlays. |
| 27 | **Timeline** | Merge into Chronicle. Two timeline surfaces is a Law VII violation. Produces nothing after the merge. |
| — | **Connections** | Not a tool — a view. Currently three projections (Mind Map / Worksheet Graph / Outline) over worksheet links. Re-point at the fact graph; consider absorbing `/graph`. |

That is all 27: 5 in Tier 1, 5 in Tier 2, 10 in Tier 3, 5 in Tier 4, 2 in Tier 5.

---

## Anti-duplication registry

These predicates are currently entered in more than one tool. Each must get exactly one producer.

| Predicate | Sole producer | Consumers (read-only, provenance tag + one-click path to producer) |
|---|---|---|
| `planet.surface_gravity` | **Atlas** — derived from `planet.mass` + `planet.radius` | Genesis, Gravitas, Phylo, Vessel, Studio rail |
| `planet.radius`, `planet.mass` | **Genesis** | Atlas, Tidelock, ExoForge |
| `star.spectral_class`, `star.luminosity` | **Orrery** | Goldilocks, Genesis, Tidelock, Exosky, Phylo, Solaris |
| `polity.cohesion_radius` | **Dominion** | Impulse, Exodus, Cartographer |
| `vessel.spin_gravity` | **Gravitas** | Vessel, Studio rail |
| `propulsion.cruise_fraction_c` | **Impulse** | Paradox, Vessel, Exodus |
| `route.distance_ly` | **Cartographer** | Paradox, Impulse, Exodus |
| `polity.territory[]` | **Dominion** | Cartographer (overlay), Exodus |

**Simulators are not second producers.** ExoForge can compute `planet.radius`; Solaris can compute `star.spectral_class`. Neither *produces* the predicate — they emit a SimRun snapshot the user may **promote**, which writes the fact with `source:{kind:'sim'}` through the same single owner. One producer, two entry paths.

**Entity names are not predicates.** `planet.name`, `species.name`, and `polity.name` live on the `Entity` record, not on a Fact. The rule that matters is *which tool creates the entity* — declared in each manifest's `entities[]` with `primary: true`. Exactly one tool per entity type may be primary:

| Entity type | Created by |
|---|---|
| `planet` | Genesis | 
| `star`, `system` | Orrery |
| `species` | Phylo |
| `polity` | Dominion |
| `vessel` | Vessel |
| `language` | Lexdrift |
| `character` | Dossier *(planned)* |
| `place` | Planet Cartographer *(planned)* |

Resolving this table *is* the interconnection work. Everything else is downstream of it.

---

## Definition of done for a wired tool

- [ ] `manifest.ts` exists and passes `/sf-audit`
- [ ] Opens pre-filled from canon; canon-sourced fields carry a provenance tag
- [ ] Every non-ephemeral field maps to a vocabulary predicate
- [ ] Save writes facts through `canon.assert()`, not directly to Supabase
- [ ] Conflicts with existing canon surface as a diff, never a silent overwrite
- [ ] At least one derivation with a `narrative` string
- [ ] Appears in the Studio rail for a relevant scene, verified by hand
- [ ] `upstream`/`downstream` drive the UpstreamCallout and CascadeSuggestionToast
- [ ] The Two-Hop Test passes (see `07-REVIEW-GATES.md`)
