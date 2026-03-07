# StellarForge Tool Inventory & Tag Mapping

**Complete Tool Registry**
Version 2.0 | February 2026

---

## Overview

This document maps every StellarForge tool to the wiki tagging system, identifies relationship dependencies, and flags gaps where new tools could strengthen the ecosystem.

**Source of truth:** `src/lib/tools-config.ts` — 25 live tools (3 Free + 22 Pro)

**Tag Legend:**
- **Category:** stars-systems | worlds | life | civilizations | mythology | integration
- **Complexity:** (entry) | (intermediate) | (advanced)
- **Type:** simulator | calculator | worksheet | generator | reference | cartographer
- **Cascade:** physics | environment | biology | psychology | mythology | culture | meta

---

## Current Tool Inventory

### SIMULATORS

Interactive, physics-driven canvas experiences. Use legacy cyan accent (`#00D4FF`).

---

#### ROGUE: Wandering Object Encounters

**Slug:** `rogue`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `worlds` |
| Complexity | advanced |
| Type | `simulator` |
| Cascade | `cascade-physics` |

**Description:**
Real-time gravitational dynamics visualization. Model orbital mechanics, multi-body systems, stellar encounters, and planetary stability. See how gravity shapes your system.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Goldilocks: Habitable Zone Calculator | recommended | Helps establish where to place planets |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | recommended | Orbital parameters inform planetary conditions |
| Exosky: Alien Night Sky | optional | System architecture affects sky appearance |

**Workshop Week:** 2 (Physics & Propulsion)

**Time Estimate:** 15-45 minutes (exploration-based)

**Output:** Visual simulation, exportable system parameters

---

#### Exosky: Alien Night Sky

**Slug:** `exosky`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `stars-systems` |
| Complexity | intermediate |
| Type | `simulator` |
| Cascade | `cascade-environment` |

**Description:**
Visualize alien skies. See what the heavens look like from your world's surface—star colors, visible planets, moons, ring systems, and celestial events that shape culture.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Orrery: Star System Builder | recommended | System architecture determines sky |
| Genesis: Planetary Profile | recommended | Atmosphere affects sky appearance |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Mythos: Xenomythology Framework | recommended | Celestial appearance shapes religious imagery |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 10-20 minutes

**Output:** Visual sky rendering, exportable sky description

---

#### Tidelock: Locked World Simulator

**Slug:** `tidelock`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `worlds` |
| Complexity | intermediate |
| Type | `simulator` |
| Cascade | `cascade-environment` |

**Description:**
Explore tidally locked worlds. Visualize the terminator zone, heat distribution, atmospheric circulation, and habitable regions on worlds with permanent day and night sides.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Goldilocks: Habitable Zone Calculator | required | Most tidally locked worlds orbit red dwarfs in close habitable zones |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | recommended | Tidal locking creates unique environmental conditions |
| Phylo: Evolutionary Biology | recommended | Life adapts to terminator zone conditions |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 15-30 minutes

**Output:** Terminator zone visualization, climate parameters, exportable world profile

---

#### ExoForge: Procedural Exoplanet Forge

**Slug:** `exoforge`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `worlds` |
| Complexity | intermediate |
| Type | `simulator` |
| Cascade | `cascade-environment` |

**Description:**
Procedurally generate exoplanets with scientifically grounded parameters. Explore realistic planetary configurations as starting points for worldbuilding.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Goldilocks: Habitable Zone Calculator | recommended | Establishes orbital constraints |
| Orrery: Star System Builder | optional | System context for the planet |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | recommended | Generated planet becomes starting point for detailed profile |
| Phylo: Evolutionary Biology | optional | Environmental parameters constrain biology |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 10-20 minutes (exploration-based)

**Output:** Generated exoplanet parameters, visual rendering

---

#### Gravitas: Spacecraft & Habitat Gravity Simulator

**Slug:** `gravitas`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | intermediate |
| Type | `simulator` |
| Cascade | `cascade-physics` |

**Description:**
Simulate gravity conditions aboard spacecraft and habitats. Model rotation for artificial gravity, thrust gravity, zero-g environments, and experiential effects on daily life.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Atlas: Surface Gravity Calculator | recommended | Understand gravity fundamentals |
| Vessel: Lived-In Spacecraft Designer | optional | Spacecraft parameters inform habitat gravity |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Vessel: Lived-In Spacecraft Designer | recommended | Gravity choices affect ship design |
| Phylo: Evolutionary Biology | optional | Long-term gravity affects biology |

**Workshop Week:** 2 (Physics & Propulsion)

**Time Estimate:** 10-30 minutes (exploration-based)

**Output:** Gravity simulation, experiential descriptions, exportable parameters

**Data:** `src/lib/gravitas/` (types.ts + data.ts + calculations.ts + experiential.ts)

---

### CALCULATORS

Input parameters, receive computed scientific outputs.

---

#### Goldilocks: Habitable Zone Calculator

**Slug:** `habitable-zone-calculator`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `stars-systems` |
| Complexity | entry |
| Type | `calculator` |
| Cascade | `cascade-physics` |

**Description:**
Calculate where life-supporting planets can exist around any star. Input stellar type and get the orbital distances where liquid water is possible.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| (none) | — | Entry point tool |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | required | Establishes orbital distance for your world |
| Tidelock: Locked World Simulator | recommended | Close-in habitable zones cause tidal locking |
| Rogue: Wandering Object Encounters | optional | Defines stable orbital regions |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 2-5 minutes

**Output:** Habitable zone boundaries (inner/outer), orbital period estimates

**Tags:** `popular`, `workshop-week-1`, `nasa-data`

---

#### Atlas: Surface Gravity Calculator

**Slug:** `surface-gravity-calculator`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `worlds` |
| Complexity | entry |
| Type | `calculator` |
| Cascade | `cascade-physics` |

**Description:**
Calculate surface gravity from mass and radius. Understand how gravity affects everything from biology to architecture to the feel of daily life.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| (none) | — | Entry point tool |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | required | Core physical parameter |
| Phylo: Evolutionary Biology | required | Gravity constrains body plans |
| Gravitas: Gravity Simulator | recommended | Foundation for habitat gravity |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 2-5 minutes

**Output:** Surface gravity in g, escape velocity, implications summary

**Tags:** `popular`, `workshop-week-1`, `peer-reviewed`

**Data:** `src/lib/surface-gravity/` (data.ts + calculations.ts)

---

#### Paradox: Time Dilation Calculator

**Slug:** `time-dilation`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | intermediate |
| Type | `calculator` |
| Cascade | `cascade-physics` |

**Description:**
Calculate relativistic time dilation for interstellar travel. See how time passes differently for travelers versus those who stay behind—essential for hard SF plotting.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Axiom: The One Big Lie | required | Must know your propulsion capabilities |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Impulse: Propulsion Consequences | required | Time dilation shapes interstellar society |
| Exodus: Space Expansion Modeler | optional | Affects expansion timelines |

**Workshop Week:** 2 (Physics & Propulsion)

**Time Estimate:** 5-10 minutes

**Output:** Time dilation factor, travel time (ship vs. home), twin paradox implications

**Tags:** `workshop-week-2`, `peer-reviewed`

**Data:** `src/lib/time-dilation/` (data.ts + calculations.ts)

---

#### Signal: Drake Equation Calculator

**Slug:** `drake-equation-calculator`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | advanced |
| Type | `calculator` |
| Cascade | `cascade-culture` |

**Description:**
Explore the Drake Equation parameters to estimate the number of communicating civilizations in the galaxy. Establish your universe's cosmic context.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| (none) | — | Standalone analytical tool |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | optional | Cosmic context affects empire design |
| Timeline | optional | Historical context for civilization development |

**Workshop Week:** 5 (Communication & Fermi)

**Time Estimate:** 10-15 minutes

**Output:** Estimated N (communicating civilizations), parameter breakdown, uncertainty ranges

**Tags:** `workshop-week-5`, `speculative`, `showing-work`

---

#### Lexdrift: Language Evolution

**Slug:** `lexdrift`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | advanced |
| Type | `calculator` |
| Cascade | `cascade-psychology` |

**Description:**
Model language evolution during interstellar travel and isolation. See how dialects diverge, languages split, and communication barriers emerge over generations.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Impulse: Propulsion Consequences | recommended | Travel times affect linguistic isolation |
| Exodus: Space Expansion Modeler | optional | Expansion patterns create language branches |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | recommended | Language barriers affect governance |
| Mythos: Xenomythology Framework | optional | Language shapes mythological expression |

**Workshop Week:** 5 (Communication & Fermi)

**Time Estimate:** 10-20 minutes

**Output:** Language divergence timeline, dialect maps, mutual intelligibility scores

**Data:** `src/lib/lexdrift/` (data.ts + calculations.ts)

---

#### Sensorium: Alien Sensory Systems

**Slug:** `sensorium`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `life` |
| Complexity | intermediate |
| Type | `calculator` |
| Cascade | `cascade-biology` |

**Description:**
Design and visualize alien sensory systems. Explore how different senses—echolocation, infrared, electroreception, chemical senses—create fundamentally different experiences of reality.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Phylo: Evolutionary Biology | recommended | Biology constrains sensory systems |
| Genesis: Planetary Profile | recommended | Environment determines useful senses |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Mythos: Xenomythology Framework | optional | Perception shapes what's sacred |
| Symbiosis: Species Interaction Matrix | optional | Sensory differences affect inter-species relations |

**Workshop Week:** 3 (Biology)

**Time Estimate:** 10-20 minutes

**Output:** Sensory system profile, perceptual comparisons, experiential descriptions

**Data:** `src/lib/sensorium/` (types.ts + data.ts + calculations.ts)

---

### WORKSHEETS

Guided forms with prompts, producing exportable documents.

---

#### Cascade: Environmental Chain Reaction

**Slug:** `environmental-chain-reaction`
**Status:** Live
**Tier:** Free

| Tag | Value |
|-----|-------|
| Category | `integration` |
| Complexity | entry |
| Type | `worksheet` |
| Cascade | `cascade-meta` |

**Description:**
The foundational framework tool. Change one environmental variable and trace its cascading effects through biology, psychology, mythology, and culture. The theoretical basis made interactive.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| (none) | — | Conceptual foundation, entry point |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| All tools | recommended | Understanding cascade improves all tool use |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 10-20 minutes

**Output:** Chain reaction document, cascade pathway visualization

**Tags:** `popular`, `exportable`

---

#### Vessel: Lived-In Spacecraft Designer

**Slug:** `spacecraft-designer`
**Status:** Live
**Tier:** Free

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-culture` |

**Description:**
Design spacecraft as lived-in spaces. Go beyond engineering specs to explore how people actually live, work, sleep, eat, and maintain sanity in artificial environments.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Axiom: The One Big Lie | recommended | Propulsion type constrains ship design |
| Gravitas: Gravity Simulator | recommended | Gravity choices affect layout |
| Impulse: Propulsion Consequences | recommended | Travel duration affects life support needs |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Exodus: Space Expansion Modeler | optional | Ship capabilities affect expansion patterns |
| Timeline | optional | Ship journeys as historical events |

**Workshop Week:** 2 (Physics & Propulsion)

**Time Estimate:** 20-30 minutes

**Output:** Spacecraft profile document, lived-in space descriptions

**Tags:** `popular`, `exportable`, `workshop-week-2`

---

#### Impulse: Propulsion Consequences

**Slug:** `propulsion-consequences-map`
**Status:** Live
**Tier:** Free

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-culture` |

**Description:**
Map how your FTL or propulsion system shapes economics, military strategy, colonization patterns, and social structures. Transportation technology is civilization technology.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Axiom: The One Big Lie | required | Must know your propulsion rules |
| Paradox: Time Dilation Calculator | recommended | If relativistic travel |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | required | Travel shapes governance |
| Exodus: Space Expansion Modeler | required | Propulsion determines expansion rate |
| Vessel: Lived-In Spacecraft Designer | recommended | Propulsion affects ship design |
| Lexdrift: Language Evolution | optional | Travel time affects linguistic isolation |

**Workshop Week:** 2 (Physics & Propulsion)

**Time Estimate:** 20-30 minutes

**Output:** Propulsion implications document, travel time matrix

**Sections:**
1. Travel Times (key routes, journey durations)
2. Economic Implications (trade feasibility, arbitrage, specialization)
3. Military Implications (force projection, defense, piracy)
4. Colonization Patterns (expansion rate, connection to homeworld)
5. Social Implications (family across light-years, governance, identity)
6. Communication Lag (how does information travel vs. ships?)

**Tags:** `exportable`, `workshop-week-2`

---

#### Genesis: Planetary Profile

**Slug:** `planetary-profile`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `worlds` |
| Complexity | entry |
| Type | `worksheet` |
| Cascade | `cascade-environment` |

**Description:**
Systematic documentation of your world's physical characteristics. The foundation document that all other worldbuilding builds upon.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Goldilocks: Habitable Zone Calculator | recommended | Establishes orbital parameters |
| Atlas: Surface Gravity Calculator | recommended | Core physical parameter |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Phylo: Evolutionary Biology | required | Life adapts to planetary conditions |
| Tidelock: Locked World Simulator | optional | If tidally locked world |
| Sensorium: Alien Sensory Systems | recommended | Environment determines useful senses |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 15-30 minutes

**Output:** Exportable world profile (docx, pdf, Notion)

**Sections:**
1. Stellar Context (star type, distance, year length)
2. Orbital Parameters (eccentricity, axial tilt, seasons)
3. Physical Parameters (mass, radius, gravity, density)
4. Atmosphere (composition, pressure, greenhouse effect)
5. Hydrosphere (water coverage, ocean depth, ice caps)
6. Day/Night (rotation period, day length, light cycles)
7. Moons & Rings (satellites, tidal effects, sky features)

**Tags:** `popular`, `exportable`, `workshop-week-1`

---

#### Axiom: The One Big Lie

**Slug:** `one-big-lie`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | entry |
| Type | `worksheet` |
| Cascade | `cascade-physics` |

**Description:**
Declare your single speculative element and commit to rigor elsewhere. The foundational constraint that defines your universe's rules.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| (none) | — | Often the first conceptual decision |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Impulse: Propulsion Consequences | required | Your "lie" often involves FTL or propulsion |
| Paradox: Time Dilation Calculator | optional | If relativistic travel is involved |
| Paradigm: Technology Consequences | recommended | Your speculative element has tech implications |

**Workshop Week:** 2 (Physics & Propulsion)

**Time Estimate:** 15-20 minutes

**Output:** Physics declaration document, boundary definitions

**Sections:**
1. The One Big Lie (what rule are you breaking?)
2. The Mechanism (how does it work, in-universe?)
3. The Limitations (what can't it do?)
4. The Costs (energy, time, side effects?)
5. The Consequences (how does this change everything?)
6. Everything Else (commitment to rigor)

**Tags:** `exportable`, `workshop-week-2`

---

#### Phylo: Evolutionary Biology

**Slug:** `evolutionary-biology`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `life` |
| Complexity | entry |
| Type | `worksheet` |
| Cascade | `cascade-biology` |

**Description:**
Design species that emerge logically from environmental pressures. Evolution isn't random—it's a conversation between organisms and their world.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | required | Gravity, atmosphere, radiation determine body constraints |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Sensorium: Alien Sensory Systems | recommended | Deepens sensory details |
| Symbiosis: Species Interaction Matrix | recommended | Species interact in ecosystems |
| Mythos: Xenomythology Framework | optional | Biology shapes what's sacred |

**Workshop Week:** 3 (Biology)

**Time Estimate:** 25-40 minutes

**Output:** Species profile document, evolutionary rationale

**Sections:**
1. Environmental Pressures (survival challenges on this world)
2. Body Plan (size, symmetry, limbs, posture—constrained by gravity)
3. Sensory Apparatus (which senses, why these, what's missing)
4. Metabolism (energy sources, temperature regulation, activity patterns)
5. Reproduction (cycle, investment, social implications)
6. Lifecycle (development stages, lifespan, metamorphosis)
7. Social Biology (solitary vs. social, pack size, hierarchy basis)
8. Evolutionary History (how did they get here?)

**Tags:** `popular`, `exportable`, `workshop-week-3`

---

#### Mythos: Xenomythology Framework

**Slug:** `xenomythology-framework-builder`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `mythology` |
| Complexity | entry |
| Type | `worksheet` |
| Cascade | `cascade-mythology` |

**Description:**
Create mythological systems using Campbell's Four Functions. Myths aren't decoration—they're how cultures explain reality, justify power, and guide lives.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Phylo: Evolutionary Biology | recommended | Biology shapes what's sacred |
| Genesis: Planetary Profile | recommended | Environment provides mythological imagery |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | optional | Mythology influences governance structures |
| Timeline | optional | Mythological events as historical anchors |

**Workshop Week:** 6 (Mythology & Integration)

**Time Estimate:** 25-40 minutes

**Output:** Mythology profile, creation myth, ritual descriptions

**Sections:**
1. Mystical Function (experience of awe, the numinous)
2. Cosmological Function (creation myth, explaining the universe)
3. Sociological Function (myths justifying social order)
4. Pedagogical Function (myths guiding life transitions)
5. Sacred Objects/Places (what's holy, and why this world made it so)
6. Collective Shadow (what does the culture repress?)

**Tags:** `popular`, `exportable`, `ai-assisted`, `workshop-week-6`

---

#### Orrery: Star System Builder

**Slug:** `star-system-builder`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `stars-systems` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-physics` |

**Description:**
Build complete star systems with multiple planets, moons, asteroid belts, and orbital relationships. Define the celestial neighborhood your world inhabits.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Goldilocks: Habitable Zone Calculator | recommended | Establishes orbital viability |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Genesis: Planetary Profile | required | System context for individual worlds |
| Exosky: Alien Night Sky | recommended | System architecture determines sky |
| Rogue: Wandering Object Encounters | optional | Tests orbital stability |

**Workshop Week:** 1 (Environment)

**Time Estimate:** 20-30 minutes

**Output:** Star system profile, orbital diagram, exportable parameters

**Tags:** `exportable`, `workshop-week-1`

**Data:** `src/lib/star-system-data.ts`

---

#### Dominion: Empire Designer

**Slug:** `empire-designer`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-culture` |

**Description:**
Design interstellar empires and governance structures. Map territorial control, political systems, economic networks, and the tensions that hold civilizations together—or tear them apart.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Impulse: Propulsion Consequences | required | Travel shapes governance feasibility |
| Phylo: Evolutionary Biology | recommended | Biology shapes social structures |
| Lexdrift: Language Evolution | optional | Language barriers affect governance |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Mythos: Xenomythology Framework | optional | Empire generates founding myths |
| Timeline | recommended | Political events as history |
| Exodus: Space Expansion Modeler | optional | Empire as expansion result |

**Workshop Week:** 4 (Culture)

**Time Estimate:** 25-40 minutes

**Output:** Empire profile document, governance structure, territorial overview

**Tags:** `exportable`, `workshop-week-4`

---

#### Paradigm: Technology Consequences

**Slug:** `technology-consequences`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-culture` |

**Description:**
Map the cascading consequences of a technology across society. Every invention changes everything—trace the ripple effects through economics, warfare, social structure, and daily life.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Axiom: The One Big Lie | recommended | Your speculative technology |
| Genesis: Planetary Profile | optional | Environment constrains technology |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | recommended | Technology shapes governance |
| Impulse: Propulsion Consequences | optional | If technology affects travel |
| Timeline | optional | Technological milestones as events |

**Workshop Week:** 4 (Culture)

**Time Estimate:** 20-30 minutes

**Output:** Technology impact map, consequence chains, society comparison

**Tags:** `exportable`, `workshop-week-4`

---

#### Symbiosis: Species Interaction Matrix

**Slug:** `species-interaction-matrix`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `life` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-biology` |

**Description:**
Design and map interactions between multiple species in your world. Predator-prey dynamics, mutualism, parasitism, competition—the ecological relationships that create living worlds.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Phylo: Evolutionary Biology | required | Need species to interact |
| Genesis: Planetary Profile | recommended | Environment shapes ecological niches |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Mythos: Xenomythology Framework | optional | Ecological relationships become mythological symbols |
| Dominion: Empire Designer | optional | Resource competition shapes politics |

**Workshop Week:** 3 (Biology)

**Time Estimate:** 20-30 minutes

**Output:** Interaction matrix, ecological relationship map, food web

**Tags:** `exportable`, `workshop-week-3`

---

#### Timeline

**Slug:** `timeline`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `integration` |
| Complexity | intermediate |
| Type | `worksheet` |
| Cascade | `cascade-meta` |

**Description:**
Multi-track timeline builder for world history. Plot geological eras, civilizational milestones, conflicts, migrations, and personal events. Supports compression markers for deep time and custom calendar systems.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Any completed worksheets | recommended | Events emerge from world elements |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| World Bible export | required | Timeline is core reference document |

**Workshop Week:** 6 (Mythology & Integration)

**Time Estimate:** 30-60 minutes (ongoing)

**Output:** Visual timeline, exportable event list, PNG export

**Features:**
- Multi-track lanes (geological, political, cultural, personal)
- Time compression markers for deep time
- Event links and causality overlay
- Template picker for common history patterns
- Real-time collaboration (Pro + world, via Supabase Presence)
- Keyboard shortcuts (Ctrl+Z undo, Ctrl+Shift+Z redo)
- PNG export via html2canvas

**Tags:** `exportable`, `workshop-week-6`

**Data:** `src/lib/timeline/` (types.ts + constants.ts + utils.ts + context.tsx + templates.ts + visual-export.ts)
**Components:** `src/components/timeline/`

---

#### Exodus: Space Expansion Modeler

**Slug:** `space-expansion-modeler`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | advanced |
| Type | `worksheet` |
| Cascade | `cascade-culture` |

**Description:**
Model how civilizations expand through space over time. Simulate colonization waves, trade networks, frontier dynamics, and the political consequences of distance.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Impulse: Propulsion Consequences | required | Travel capability determines expansion rate |
| Paradox: Time Dilation Calculator | optional | Relativistic effects on expansion |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | required | Expansion creates empires |
| Lexdrift: Language Evolution | recommended | Expansion creates linguistic isolation |
| Timeline | recommended | Expansion waves as historical events |

**Workshop Week:** 4 (Culture)

**Time Estimate:** 20-30 minutes

**Output:** Expansion model, colonization timeline, trade network visualization

**Tags:** `exportable`, `workshop-week-4`

**Data:** `src/lib/space-expansion-data.ts`

---

### CARTOGRAPHERS

Spatial mapping and galaxy-scale visualization tools.

---

#### Stellar Cartographer: Galaxy Mapper

**Slug:** `stellar-cartographer`
**Status:** Live
**Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `stars-systems` |
| Complexity | advanced |
| Type | `cartographer` |
| Cascade | `cascade-physics` |

**Description:**
Map star systems, sectors, and regions within your galaxy. Create spatial relationships between worlds, trade routes, borders, and points of interest.

**Builds On:**
| Tool | Relationship | Note |
|------|--------------|------|
| Orrery: Star System Builder | recommended | Individual systems to place on the map |
| Exodus: Space Expansion Modeler | optional | Expansion patterns inform map layout |

**Feeds Into:**
| Tool | Relationship | Note |
|------|--------------|------|
| Dominion: Empire Designer | recommended | Territory visualization |
| Impulse: Propulsion Consequences | optional | Route planning |

**Workshop Week:** 6 (Mythology & Integration)

**Time Estimate:** 30-60 minutes (ongoing)

**Output:** Galaxy/sector map, system relationships, exportable map data

**Tags:** `exportable`, `workshop-week-6`

**Components:** `src/components/tools/StellarCartographer/`

---

## Planned Tools

Tools mentioned in development roadmap but not yet live.

---

### K-SCALE — Kardashev Civilization Simulator

**Status:** Planned
**Target Tier:** Pro

| Tag | Value |
|-----|-------|
| Category | `civilizations` |
| Complexity | advanced |
| Type | `simulator` |
| Cascade | `cascade-culture` |

**Description:**
Model civilization development along the Kardashev Scale. Explore energy usage, megastructures, and long-term civilizational trajectories.

**Rationale:**
Supports far-future worldbuilding and connects to Fermi Paradox considerations.

---

## Phantom Tools

Tools referenced in earlier documentation that do not exist as standalone routed tools. Listed here for context and future planning.

---

#### Biome Designer Worksheet

**Status:** Not a standalone tool
**Note:** Biome design functionality is subsumed into Genesis: Planetary Profile (atmosphere, hydrosphere, biome sections). A dedicated biome tool could be a future addition.

---

#### Cultural Matrix Worksheet

**Status:** Not a standalone tool
**Note:** Cultural design is partially addressed by Dominion: Empire Designer (governance, politics) and Mythos: Xenomythology Framework (belief systems). A dedicated cultural deep-dive tool could fill the gap between biology and governance.

---

#### Communication Designer Worksheet

**Status:** Not a standalone tool
**Note:** Communication and language aspects are partially covered by Lexdrift: Language Evolution (linguistic drift over time). A dedicated first-contact and communication system design tool remains a gap.

---

#### Fermi Paradox Worksheet

**Status:** Not a standalone tool
**Note:** The Fermi question is partially addressed by Signal: Drake Equation Calculator. A dedicated Fermi Paradox analysis tool that explores possible answers (Great Filter, Zoo Hypothesis, etc.) remains a gap.

---

#### Master Worldbuilding Bible

**Status:** Exists as export feature, not standalone tool
**Note:** The World Bible is generated via the hierarchical export system (`src/lib/pdf/templates/world-bible/`). It compiles outputs from all worksheets into a single document. It does not have its own tool page or route.

---

#### Quick Consistency Checker

**Status:** Not a standalone tool
**Note:** No automated consistency checking tool exists. Cross-tool validation remains a future feature opportunity.

---

#### Star Classification Guide

**Status:** Reference content, not a routed tool
**Note:** Stellar classification information is integrated into relevant tools (Orrery, Goldilocks, etc.) rather than existing as a standalone reference page.

---

## Gap Analysis

Tools that would strengthen the ecosystem but aren't currently planned.

---

### Atmosphere Builder

**Category:** `worlds`
**Complexity:** intermediate
**Cascade:** `cascade-environment`

**Gap:** Currently, atmosphere is a section in Genesis: Planetary Profile. A dedicated tool could model atmospheric composition, pressure, greenhouse effects, and sky color with more precision.

**Would connect:**
- Builds on: Genesis: Planetary Profile, Atlas: Surface Gravity Calculator
- Feeds into: Phylo: Evolutionary Biology (breathability), Exosky (sky appearance)

---

### Ecosystem Builder

**Category:** `life`
**Complexity:** intermediate
**Cascade:** `cascade-biology`

**Gap:** Symbiosis handles species interaction matrices, but there's no tool for designing complete food webs, energy flow, and ecological succession.

**Would connect:**
- Builds on: Phylo: Evolutionary Biology, Symbiosis: Species Interaction Matrix
- Feeds into: Dominion: Empire Designer (resource management), Mythos (animal symbolism)

---

### Ritual & Practice Builder

**Category:** `mythology`
**Complexity:** intermediate
**Cascade:** `cascade-mythology`

**Gap:** Mythos creates beliefs but not behaviors. A dedicated tool for designing rituals, ceremonies, and daily practices would deepen cultural detail.

**Would connect:**
- Builds on: Mythos: Xenomythology Framework, Phylo: Evolutionary Biology
- Feeds into: Timeline (ceremonial events), Dominion (religious governance)

---

## Category Summary

### By Category

| Category | Tools | Entry | Intermediate | Advanced |
|----------|-------|-------|--------------|----------|
| Stars & Systems | 4 | 1 | 2 | 1 |
| Worlds | 5 | 2 | 3 | 0 |
| Life | 3 | 1 | 2 | 0 |
| Civilizations | 9 | 1 | 5 | 3 |
| Mythology | 1 | 1 | 0 | 0 |
| Integration | 3 | 1 | 2 | 0 |
| **Total** | **25** | **7** | **14** | **4** |

### By Type

| Type | Count |
|------|-------|
| Simulator | 5 (ROGUE, Exosky, Tidelock, ExoForge, Gravitas) |
| Calculator | 6 (Goldilocks, Atlas, Paradox, Signal, Lexdrift, Sensorium) |
| Worksheet | 13 (Cascade, Vessel, Impulse, Genesis, Axiom, Phylo, Mythos, Orrery, Dominion, Paradigm, Symbiosis, Timeline, Exodus) |
| Cartographer | 1 (Stellar Cartographer) |

### By Tier

| Tier | Count | Tools |
|------|-------|-------|
| Free | 3 | Cascade, Vessel, Impulse |
| Pro | 22 | All others |

### By Workshop Week

| Week | Theme | Tools |
|------|-------|-------|
| 1 | Environment | Genesis, Goldilocks, Atlas, Orrery, ExoForge, Exosky, Tidelock |
| 2 | Physics & Propulsion | Axiom, Impulse, Paradox, Vessel, Gravitas, Rogue |
| 3 | Biology | Phylo, Sensorium, Symbiosis |
| 4 | Culture | Dominion, Paradigm, Exodus |
| 5 | Communication & Fermi | Signal, Lexdrift |
| 6 | Mythology & Integration | Mythos, Timeline, Cascade, Stellar Cartographer |

---

## Cascade Visualization

```
                           TOOLS BY CASCADE POSITION

    PHYSICS              ENVIRONMENT           BIOLOGY
    -------              -----------           -------
    * Goldilocks (entry)  * Genesis (entry)     * Phylo (entry)
    * Atlas (entry)       + ExoForge (int)      + Sensorium (int)
    + Orrery (int)        + Exosky (int)        + Symbiosis (int)
    + Paradox (int)       + Tidelock (int)
    + Gravitas (int)
    # Rogue (adv)
    * Axiom (entry)
    # Stellar Cart (adv)

         |                    |                    |

    PSYCHOLOGY           MYTHOLOGY             CULTURE
    ----------           ---------             -------
    # Lexdrift (adv)     * Mythos (entry)      + Impulse (int)
                                               + Vessel (int)
                                               + Dominion (int)
                                               + Paradigm (int)
                                               + Exodus (adv)
                                               # Signal (adv)

         |                    |                    |

                         INTEGRATION
                         -----------
                         * Cascade (entry)
                         + Timeline (int)

    Legend: * entry  + intermediate  # advanced
           Free tools: Cascade, Vessel, Impulse
           All others: Pro
```

---

*Document prepared for StellarForge.tools*
*Source of truth: `src/lib/tools-config.ts`*
*(c) 2025-2026 Jason D. Batt, Ph.D.*
