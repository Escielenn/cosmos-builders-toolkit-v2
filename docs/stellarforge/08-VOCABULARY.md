# 08 · CANON VOCABULARY

> The predicate namespace. This is the thing that makes tools speak to each other.
> Port to `src/canon/vocabulary.ts` as a typed union. Adding a predicate is a deliberate act — use `/sf-fact`.

---

## Naming rules

```
<domain>.<attribute>              star.spectral_class
<domain>.<attribute>_<qualifier>  planet.temp_mean
<domain>.<collection>[]           species.senses[]
```

- **snake_case** attributes, singular domain.
- **Units live on the value**, never in the name. `planet.mass` with `unit:'earth_masses'`, never `planet.mass_earths`.
- **No tool names in predicates.** `planet.surface_gravity`, never `atlas.gravity`. Predicates outlive tools.
- **Derivation ids** *do* carry the tool: `atlas.surface_gravity_from_mass_radius`. Those are functions, not facts.
- **Never rename a predicate.** Deprecate and alias.

---

## Domains

**One producer per predicate.** The table below names the *domain owner* — the tool that produces most of a domain. Individual predicates may be owned by a different tool; where they are, the predicate tables below say so, and the anti-duplication registry in `03-TOOL-CHARTER.md` is the tiebreaker.

**Simulators are never second producers.** ExoForge computes `planet.radius`; Solaris computes `star.spectral_class`. They emit SimRun snapshots the user may *promote*, which write through the domain owner with `source:{kind:'sim'}`. One owner, two entry paths.

| Domain | Subject entity type | Domain owner | Predicate-level exceptions |
|---|---|---|---|
| `world` | world | Axiom | — |
| `galaxy` | world | Signal | — |
| `system` | system | Orrery | `system.hz_inner`/`hz_outer` → Goldilocks; `system.stability` → Solaris (promote) |
| `star` | star | Orrery | Solaris via promote |
| `orbit` | planet or moon | Orrery | — |
| `planet` | planet | Genesis | `planet.surface_gravity`, `planet.escape_velocity`, `planet.density` → **Atlas** (derived); `planet.terminator_band_width`, `planet.temp_gradient[]` → **Tidelock** (promote); `planet.sky.*` → **Exosky** (promote); `planet.surface_type`, `planet.composition` → **ExoForge** (promote); `planet.hz_position` → **Goldilocks** |
| `moon` | moon | Orrery | — |
| `place` | place | Planet Cartographer *(planned)* | `place.g_profile` → **Gravitas** |
| `ecology` | planet | Symbiosis | — |
| `species` | species | Phylo | `species.senses[]`, `species.absent_modalities[]` → **Sensorium** |
| `character` | character | Dossier *(planned)* | — |
| `language` | language | Lexdrift | — |
| `culture` | species or polity | Mythos | — |
| `polity` | polity | Dominion | `polity.energy_budget`, `polity.kardashev` → **K-Scale** |
| `economy` | polity | Impulse | — |
| `tech` | polity or world | Paradigm | — |
| `propulsion` | vessel or polity | Impulse | — |
| `route` | route | Cartographer | `route.proper_time`, `route.coordinate_time`, `route.dilation_factor` → **Paradox** (derived) |
| `vessel` | vessel | Vessel | `vessel.spin_gravity` → **Gravitas** |
| `artifact` | artifact | BDO *(planned)* | — |
| `expansion` | polity | Exodus | — |
| `scene` | *not an entity — a `Doc`, see 02* | *derived, read-only — never stored as a fact* | — |

---

## Starter predicate set

Enough to run Phases 0–5. Extend via `/sf-fact`.

### `world.*`

| Predicate | Kind | Notes |
|---|---|---|
| `world.axiom` | text | The One Big Lie. Root fact — nothing upstream. |
| `world.axiom_constraints[]` | text[] | What the lie forbids. Feeds `axiom-violated-downstream`. |
| `world.present_epoch` | scalar | The default read epoch. |
| `world.epoch_label` | text | e.g. "After Landing" |

### `galaxy.*`

| Predicate | Kind | Unit | Producer |
|---|---|---|---|
| `galaxy.civ_count` | scalar | — | Signal (Drake N) |
| `galaxy.contact_probability` | scalar | `fraction` | Signal — derived |
| `galaxy.density_class` | enum | `sparse\|moderate\|teeming` | Signal |

### `star.*` · `system.*`

| Predicate | Kind | Unit |
|---|---|---|
| `star.spectral_class` | enum | `o\|b\|a\|f\|g\|k\|m\|wd\|bd` + subtype |
| `star.mass` | scalar | `solar_masses` |
| `star.luminosity` | scalar | `solar_lum` |
| `star.temp_effective` | scalar | `K` |
| `star.age` | scalar | `gyr` |
| `star.flare_activity` | enum | `quiet\|moderate\|active` |
| `system.configuration` | enum | `single\|close_binary\|wide_binary\|trinary` |
| `system.body_count` | scalar | — |
| `system.hz_inner` / `system.hz_outer` | scalar | `au` — derived, Goldilocks |
| `system.stability` | enum | N-body result from Solaris |
| `system.perturbation_events[]` | struct[] | `{epoch, body_ref, delta_a, outcome}` — Rogue → Chronicle |

### `orbit.*`

`orbit.semi_major_axis` (au) · `orbit.eccentricity` · `orbit.period` (days) · `orbit.inclination` (deg) · `orbit.tidally_locked` (bool) · `orbit.resonance` (text)

### `planet.*`

| Predicate | Kind | Unit | Producer |
|---|---|---|---|
| `planet.radius` | scalar | `earth_radii` | Genesis |
| `planet.mass` | scalar | `earth_masses` | Genesis |
| `planet.density` | scalar | `g_cm3` | Atlas — derived |
| `planet.surface_gravity` | scalar | `g` | **Atlas only** |
| `planet.escape_velocity` | scalar | `km_s` | Atlas — derived |
| `planet.rotation_period` | scalar | `hours` | Genesis |
| `planet.obliquity` | scalar | `deg` | Genesis |
| `planet.year_length` | scalar | `local_days` | derived from `orbit.period` |
| `planet.atmo_pressure` | scalar | `bar` | Genesis |
| `planet.atmo_composition` | text | — | Genesis |
| `planet.temp_mean` | scalar | `K` | derived |
| `planet.temp_gradient[]` | range[] | `K` | Tidelock |
| `planet.hydrosphere_fraction` | scalar | `0–1` | Genesis |
| `planet.albedo` | scalar | `0–1` | Genesis |
| `planet.magnetosphere` | enum | `none\|weak\|strong` | Genesis |
| `planet.terminator_band_width` | scalar | `km` | Tidelock |
| `planet.habitable_area` | scalar | `km2` | derived |
| `planet.surface_type` | enum | `rocky\|oceanic\|ice\|gas\|desert\|...` | ExoForge |
| `planet.composition` | struct | — | ExoForge |
| `planet.hz_position` | enum | `inner\|habitable\|outer` | Goldilocks — derived |
| `planet.sky.visible_stars[]` | ref[] | — | Exosky |
| `planet.sky.constellations[]` | text[] | — | Exosky → **Mythos** |
| `planet.sky.daylight_colour` | text | — | derived from `star.temp_effective` |

### `ecology.*`

`ecology.primary_productivity` (kg_C_m2_yr) · `ecology.trophic_levels` · `ecology.relations[]` (typed species↔species edges: predation, mutualism, parasitism, commensalism) · `ecology.carrying_capacity` (individuals) · `ecology.biome_set[]`

### `place.*`

`place.height` (m) · `place.coordinates` (struct: lat/long or grid) · `place.biome` (ref to `ecology.biome_set[]`) · `place.g_profile` (g — Gravitas, for habitats and non-planetary surfaces) · `place.settlement_type` · `place.population`

### `species.*`

| Predicate | Kind | Notes |
|---|---|---|
| `species.biochemistry` | enum | `carbon_water\|carbon_ammonia\|silicon\|...` |
| `species.body_plan` | text | |
| `species.mass_typical` | scalar | `kg` |
| `species.height_typical` | scalar | `m` |
| `species.lifespan` | scalar | `local_years` |
| `species.metabolic_rate` | scalar | `w_kg` |
| `species.reproduction_mode` | enum | |
| `species.social_structure` | enum | |
| `species.cognition_profile` | text | |
| `species.senses[]` | struct[] | `{modality, range_min, range_max, unit, acuity}` — **Sensorium** |
| `species.absent_modalities[]` | enum[] | The ones that matter most for prose. |
| `species.g_tolerance` | range | `g` |

### `character.*` *(Dossier — planned)*

`character.species` (ref) · `character.polity` (ref) · `character.native_language` (ref) · `character.birth_epoch` · `character.height` · `character.mass` · `character.sensory_overrides[]` · `character.beliefs[]` (refs to `culture.deities`) · `character.relations[]` · `character.arc_beats[]` (refs to Chronicle events)

### `language.*` · `culture.*`

`language.phonology` (struct — feeds Onomastics) · `language.drift_rate` · `language.divergence` (vs. a reference, 0–1) · `language.mutual_intelligibility[]`

`culture.cosmology` · `culture.deities[]` · `culture.taboos[]` · `culture.death_rites` · `culture.calendar` · `culture.oath_forms[]` · `culture.has_solar_deity` (bool — fires `tidelock-no-diurnal-myth`)

### `expansion.*`

`expansion.phase_timeline[]` (struct[]: `{epoch, phase, driver, population}` — Exodus, projects to Chronicle events) · `expansion.limiting_factor`

### `polity.*` · `economy.*` · `tech.*`

`polity.governance` · `polity.factions[]` · `polity.succession` · `polity.legitimacy_source` · `polity.cohesion_radius` (ly) · `polity.energy_budget` (W) · `polity.kardashev` · `polity.territory[]` (refs, for the map) · `polity.has_spaceflight` (bool)

`economy.transit_cost` · `economy.scarcity[]` · `economy.trade_lanes[]`

`tech.level` · `tech.ai_capability` · `tech.ai_autonomy` · `tech.ai_relations` · `tech.constraints[]`

### `propulsion.*` · `route.*` · `vessel.*`

`propulsion.type` · `propulsion.cruise_fraction_c` · `propulsion.delta_v` (km/s) · `propulsion.exhaust_velocity`

`route.origin` / `route.destination` (refs) · `route.distance_ly` · `route.proper_time` (yr) · `route.coordinate_time` (yr) · `route.dilation_factor`

`vessel.crew_size` · `vessel.life_support_type` · `vessel.radius` (m) · `vessel.spin_gravity` (g — **Gravitas**) · `vessel.layout` · `vessel.culture_aboard` · `vessel.closed_loop_efficiency` · `vessel.pop_genetics`

### `scene.*` — derived, read-only

Never written by a tool. Computed by `canon.forDoc()` for the Studio rail.

`scene.physicality` · `scene.weather` · `scene.light` · `scene.sound` · `scene.travel` · `scene.perception_limits` · `scene.taboos_in_play`

---

## Value kinds

```ts
type FactValue =
  | { kind:'scalar', value:number, unit:Unit }
  | { kind:'range',  min:number, max:number, unit:Unit }
  | { kind:'enum',   value:string, vocabulary:string }
  | { kind:'text',   value:string }
  | { kind:'ref',    entity_id:UUID }
  | { kind:'ref[]',  entity_ids:UUID[] }
  | { kind:'bool',   value:boolean }
  | { kind:'struct', schema:string, value:Record<string,unknown> }
```

`struct` is the escape hatch. **Every use needs a registered schema name and a code comment justifying why it isn't decomposable into scalars.** Unjustified structs are how the Worksheet Silo comes back through the side door.

---

## Units

One registry, `src/canon/units.ts`. Conversions live there, nowhere else.

`earth_radii · earth_masses · solar_masses · solar_lum · au · ly · pc · K · C · bar · g · m_s2 · km_s · c · hours · days · local_days · local_years · yr · kyr · myr · gyr · kg · m · km · km2 · W · individuals · fraction`

Display formatting is a separate concern from storage. Store SI-ish canonical units; format for humans at the edge, in mono, per the design system.

---

## Deprecation

Never rename. Add:

```ts
{ predicate:'planet.gravity', deprecated:true, alias_of:'planet.surface_gravity' }
```

Reads follow the alias. Writes to a deprecated predicate warn in dev and fail in `/sf-audit`.
