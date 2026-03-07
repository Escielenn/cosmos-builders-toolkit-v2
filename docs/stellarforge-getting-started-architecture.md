# StellarForge: Getting Started Architecture

**Content Specification Document**  
Version 1.0 | February 2026

---

## Overview

This document defines the three-layer onboarding system for StellarForge.tools, designed to reduce blank-page paralysis and guide users of varying experience levels into productive worldbuilding.

**The Three Layers:**
1. **The Cascade Tutorial** — Conceptual foundation (60-90 seconds)
2. **Entry Points by Question** — Self-routing mechanism
3. **Guided Pathways** — Tool sequences for different starting conditions

---

## Part One: The Cascade Tutorial

### Purpose
Establish the foundational principle that makes StellarForge different from random generators. This is the "aha moment" that reframes worldbuilding as systematic rather than arbitrary.

### Placement
- Hero section of `/getting-started` page
- Optional modal on first authenticated visit
- Embedded in wiki/help documentation

### Content

#### Headline
**Everything Cascades.**

#### Body Copy (60-second read)

> In science fiction, nothing exists in isolation. A planet's gravity shapes how life moves. How life moves shapes how minds develop. How minds develop shapes what they worship. What they worship shapes how they organize society.
>
> **This is the Environmental Cascade:**
>
> Physics → Environment → Biology → Psychology → Mythology → Culture
>
> Change something upstream, and everything downstream shifts with it. A tidally locked world doesn't just have a permanent day side and night side—it has creatures adapted to the terminator zone, cultures that mythologize the journey between light and dark, and societies structured around migration patterns no Earth civilization has ever needed.
>
> StellarForge tools are organized around this principle. Each tool builds on what comes before. Each output becomes input for what follows.
>
> You don't have to start at the beginning. But understanding *where* you're starting helps you know *what* will cascade from your choices.

#### Visual Element
Horizontal cascade diagram showing the six stages with directional arrows. Interactive version: clicking any stage highlights what flows downstream from it.

```
┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌────────────┐    ┌───────────┐    ┌─────────┐
│ PHYSICS  │ →  │ ENVIRONMENT │ →  │ BIOLOGY  │ →  │ PSYCHOLOGY │ →  │ MYTHOLOGY │ →  │ CULTURE │
└──────────┘    └─────────────┘    └──────────┘    └────────────┘    └───────────┘    └─────────┘
   Gravity         Climate          Anatomy         Cognition          Meaning         Society
   Radiation       Terrain          Senses          Emotion            Ritual          Economy
   Orbit           Resources        Lifecycle       Communication      Taboo           Technology
```

---

## Part Two: Entry Points by Question

### Purpose
Route users to appropriate starting points based on where their creative idea currently sits in development.

### Placement
- Immediately follows Cascade Tutorial on `/getting-started`
- "Start Building" CTA from homepage
- New World creation flow

### The Routing Question

**Where does your world begin?**

*Most stories start with a spark—a scene, a creature, a concept. Where's yours?*

### The Four Entry Points

#### Entry Point A: "I'm starting from scratch"
**Description:** No specific idea yet. Want to explore what's possible and let a world emerge from the tools.

**Suggested Pathway:** The Guided First World (complete sequence)

**Tone:** "Perfect. Let's build from the ground up—literally. We'll start with a star, find a habitable zone, design a planet, and watch how that environment shapes everything that lives there."

---

#### Entry Point B: "I have a story concept and need a setting"
**Description:** Has plot, characters, or themes but needs a world that serves them. Knows *what* should happen but not *where*.

**Suggested Pathway:** Story-First Worldbuilding

**Tone:** "Smart approach. Your story's needs will constrain your world—which actually makes building easier. Let's figure out what your narrative requires and design a setting that delivers it."

**Clarifying Questions:**
- What's the core conflict? (Survival / Political / Personal / Cosmic)
- What technology level? (Pre-industrial / Industrial / Spacefaring / Post-scarcity)
- What's the scope? (Single location / Planet / System / Interstellar)

---

#### Entry Point C: "I have aliens or species and need to ground them"
**Description:** Has a creature concept—visual, behavioral, or psychological—but needs the evolutionary and environmental logic that makes them feel real.

**Suggested Pathway:** Biology-Up Worldbuilding

**Tone:** "You've got the interesting part. Now let's reverse-engineer the world that would produce exactly this species. What pressures shaped them? What environment selected for these traits?"

**Clarifying Questions:**
- What's distinctive about them? (Physical form / Senses / Cognition / Social structure)
- Are they the dominant species or one of many?
- How alien do you want them? (Humanoid / Recognizable Earth analogs / Radically other)

---

#### Entry Point D: "Just exploring"
**Description:** Wants to browse, experiment, learn the tools without commitment to a specific project.

**Suggested Pathway:** Tool Explorer Mode

**Tone:** "The forge is yours. Here are the tools organized by what they help you build. Try anything—nothing you create is permanent until you save it."

**Experience:** Drops user into Tools page with "Recommended First" badges on entry-level tools in each category.

---

## Part Three: The Guided Pathways

### Pathway A: The Guided First World

**Audience:** Complete beginners, "starting from scratch" users  
**Duration:** 30-45 minutes for core sequence  
**Output:** A documented planet with basic life and cultural implications

#### Sequence Overview

| Step | Tool | What You'll Create | Time |
|------|------|-------------------|------|
| 1 | Star Builder | Your system's star with spectral class and habitable zone | 5 min |
| 2 | Planetary Parameters | A world with mass, gravity, atmosphere, day length | 10 min |
| 3 | Biome Designer | Climate zones and environmental regions | 10 min |
| 4 | Biology Foundations | One dominant species shaped by this environment | 15 min |
| 5 | Culture Seed | Basic social implications of biology and environment | 10 min |

#### Step 1: Star Builder

**Intro Copy:**
> Every world orbits something. The star you choose determines almost everything else—how much light and heat reach your planet, what colors dominate the sky, how long a "year" feels, and whether your world is tidally locked to a red dwarf or spinning freely around a yellow sun like ours.

**Tool:** Star Classification Selector (or simplified Habitable Zone Calculator)

**Key Decisions:**
- Stellar class (with plain-language implications)
- Single star or binary system
- Age of system (affects planetary development)

**Output Preview:**
> "Your world orbits an K-type orange dwarf, smaller and cooler than our Sun. The habitable zone is closer in. Your planet likely has a longer year but possibly a shorter day. The light has a warm, amber quality—Earth plants might appear darker here."

**Cascade Forward:**
"This star determines where your planet can exist and still have liquid water. Let's place your world in that zone."

---

#### Step 2: Planetary Parameters

**Intro Copy:**
> Now we build the planet itself. Mass determines gravity—how hard it is to stand up, how high creatures can jump, how thick the atmosphere can be. Rotation determines day length—how organisms sleep, hunt, and photosynthesize. These aren't arbitrary numbers; they're the physics that will shape every living thing.

**Tool:** Planetary Profile Worksheet (simplified) or Surface Gravity Calculator

**Key Decisions:**
- Planet mass/radius (gravity implications)
- Rotation period (day length)
- Axial tilt (seasons)
- Atmospheric composition (simplified: Earth-like / Thicker / Thinner)

**Output Preview:**
> "Your world has 1.3 Earth masses and 1.15g surface gravity. A 28-hour day. A 15-degree axial tilt means mild seasons. The thicker atmosphere retains more heat—your world runs warmer than the habitable zone might suggest."

**Cascade Forward:**
"Gravity and atmosphere determine climate patterns. Higher gravity means denser air, different weather systems, and constraints on how large flying creatures can be. Let's see what environments emerge."

---

#### Step 3: Biome Designer

**Intro Copy:**
> Planets aren't uniform. Earth has deserts and rainforests, tundras and tropics. Your world's biomes emerge from its physical parameters—where the sunlight hits, where the moisture gathers, where the mountains force air upward and strip it of rain.

**Tool:** Biome Diversity Worksheet or Climate Zone Generator

**Key Decisions:**
- Primary biome (where your story likely takes place)
- Contrasting biomes (for variety and conflict)
- Extreme environments (edges of habitability)

**Output Preview:**
> "With a warm, thick atmosphere and mild axial tilt, your world favors broad equatorial forests and temperate zones that extend far toward the poles. The polar regions aren't frozen wastelands—they're cool temperate zones. True extremes are rare here."

**Cascade Forward:**
"These environments are the selection pressure. Life that evolves here will be shaped by warmth, humidity, and the absence of extreme seasons. Let's design what thrives."

---

#### Step 4: Biology Foundations

**Intro Copy:**
> Now the cascade reaches life itself. The environment you've built isn't just a backdrop—it's a filter. Every trait your species has exists because it helped their ancestors survive *here*, in *this* gravity, under *this* light, across *these* biomes. Evolution isn't random; it's a conversation between organisms and their world.

**Tool:** Biology Design Worksheet (simplified First Species section)

**Key Decisions:**
- Body plan (constrained by gravity)
- Sensory priorities (constrained by atmosphere and stellar light)
- Metabolism (constrained by available energy sources)
- Social structure (constrained by resource distribution)

**Guiding Questions:**
- In 1.15g, how does body structure differ from Earth? (Stockier builds, lower centers of gravity, stronger bones)
- Under K-type light, what visual spectrum matters? (Shifted toward infrared; ultraviolet-dependent features less useful)
- In a warm, humid world without harsh seasons, what pressures drive intelligence? (Not cold survival—perhaps social complexity, predator evasion, or resource competition)

**Output Preview:**
> "Your dominant species evolved as mid-sized omnivores in the forest-edge zones. The higher gravity favored a low, stable body plan—six-limbed for stability, with the middle pair adaptable for manipulation or locomotion. Their vision extends into infrared, compensating for the K-dwarf's shifted spectrum. Without seasonal resource scarcity, their intelligence likely emerged from social competition rather than environmental pressure."

**Cascade Forward:**
"Biology becomes psychology. A six-limbed, infrared-seeing social species doesn't think like a human. Their bodies shape their metaphors, their senses shape their art, their social evolution shapes their politics. Let's seed a culture."

---

#### Step 5: Culture Seed

**Intro Copy:**
> Culture isn't arbitrary. It emerges from bodies, environments, and minds. A species that sees in infrared has different aesthetics than one that sees in visible light. A species that never experienced winter has no harvest festivals. A species whose intelligence came from social competition has different values than one whose intelligence came from tool use.

**Tool:** Cultural Matrix Worksheet (simplified first-contact section)

**Key Decisions:**
- Core values (what does survival on this world reward?)
- Social organization (what does their biology enable/constrain?)
- Relationship to environment (do they dominate, harmonize, or fear it?)
- Blind spots (what does their experience make them unable to understand?)

**Guiding Questions:**
- What do they consider beautiful? (Infrared patterns humans can't see? Heat signatures? Thermal symmetry?)
- What's sacred? (In a world without winter, what natural cycles matter?)
- What's their greatest fear? (Perhaps cold—the one condition their world never prepared them for?)

**Output Preview:**
> "Your species values social harmony over individual achievement—their evolutionary path selected for coalition-builders, not lone innovators. Their art emphasizes thermal patterns, invisible to human eyes but vivid to them. Their religion centers on the eternal forest, the warmth that never fails. Their deepest horror? The concept of cold. A species that has never experienced winter finds the mere idea of frozen water existentially terrifying."

**Completion:**
"You've built a world. Not just a planet—a cascading system where physics led to environment, environment led to biology, biology led to psychology, and psychology led to culture. Everything connects. This is your foundation. You can now explore any tool to deepen any layer."

---

### Pathway B: Story-First Worldbuilding

**Audience:** Users with story concepts needing settings  
**Duration:** 20-30 minutes  
**Output:** Environmental constraints that serve narrative needs

#### Sequence Overview

| Step | Focus | Key Question |
|------|-------|--------------|
| 1 | Narrative Requirements | What must your world make possible? |
| 2 | Constraint Mapping | What physics/environment enables those requirements? |
| 3 | World Selection | Configure planetary parameters to match |
| 4 | Implication Discovery | What else becomes true as a consequence? |

#### Step 1: Narrative Requirements

**Intro Copy:**
> Your story needs certain things to be true. Maybe your plot requires isolated communities that can't easily communicate. Maybe your theme needs a world where resources are genuinely scarce. Maybe your characters need a reason to stay in one place despite danger. Let's identify what your world *must* provide.

**Tool:** Story Requirements Worksheet (new tool concept)

**Key Questions:**
- What technology level does your story assume?
- What kind of conflict drives your plot? (Resource scarcity / Political distance / Environmental danger / Cosmic threat)
- What should be difficult in your world? (Travel? Communication? Survival? Trust?)
- What should be possible that isn't on Earth? (Or what should be impossible that *is* possible on Earth?)

---

#### Step 2: Constraint Mapping

**Intro Copy:**
> Now we reverse-engineer. If your story needs isolated communities, what physical conditions create isolation? Vast oceans? Extreme terrain? A tidally locked world where crossing the terminator is deadly? If your story needs resource scarcity, what planetary conditions make resources rare?

**Tool:** Constraint-to-Parameter Mapper (reference tool, possibly part of wiki)

**Example Mappings:**
- "Isolated communities" → Archipelago world (95% ocean), tidally locked with deadly terminator, or extreme mountain ranges
- "Resource scarcity" → Young planet (metals still deep), ice world, or post-collapse civilization
- "Environmental danger as constant presence" → Tidally locked terminator, high radiation, active geology, or predator ecology
- "Fast travel impossible" → No fossil fuels, extreme weather, or orbital mechanics that make spaceflight impractical

---

#### Steps 3-4: Configure and Discover

Once requirements are mapped to parameters, user proceeds through relevant Calculators and Worksheets to establish specifics, then explores what *else* becomes true as a consequence of those choices.

---

### Pathway C: Biology-Up Worldbuilding

**Audience:** Users with creature/species concepts needing grounding  
**Duration:** 25-35 minutes  
**Output:** Environmental and evolutionary justification for existing creature concept

#### Sequence Overview

| Step | Focus | Key Question |
|------|-------|--------------|
| 1 | Creature Audit | What are the defining traits of your species? |
| 2 | Evolutionary Logic | What selection pressures would produce these traits? |
| 3 | Environment Design | What world creates those pressures? |
| 4 | Cascade Completion | What else must be true about their psychology and culture? |

#### Step 1: Creature Audit

**Intro Copy:**
> Let's look at what you've got. Every trait your species has is a clue about their homeworld. Big eyes? Low light environment. Thick skin? High radiation or abrasive terrain. Echolocation? Dense atmosphere or visual obstacles. What are the distinctive features you're committed to?

**Tool:** Biology Reverse-Engineering Worksheet (new tool concept)

**Categories to Assess:**
- **Body plan:** Size, symmetry, limb structure, posture
- **Senses:** Which are primary? Which are absent or reduced?
- **Metabolism:** Endotherm/ectotherm, energy sources, activity patterns
- **Reproduction:** Cycle, investment, social implications
- **Special features:** Any unique adaptations?

---

#### Steps 2-4: Reverse-Engineer and Complete

From the creature audit, the pathway guides users backward through environmental conditions that would select for these traits, then forward through the psychological and cultural implications of this biology.

---

### Pathway D: Tool Explorer Mode

**Audience:** Browsers, experimenters, returning users  
**Experience:** Free navigation with contextual guidance

#### Implementation

- Default Tools page view with enhanced organization
- "Recommended First" badges on entry-level tools per category
- "Builds On" and "Feeds Into" indicators showing cascade relationships
- Quick-start presets for tools (don't require full configuration to experiment)
- "Random World Seed" feature for zero-commitment exploration

---

## Part Four: Tool Categories

### The Category System

Tools are organized by **what they help you build**, not by tool type. Within each category, tools span from entry-level to advanced.

#### Category 1: Stars & Systems

*The cosmic context—what your world orbits and who its neighbors are.*

**Entry Level:**
- Habitable Zone Calculator — Where can life exist around your star?
- Star Classification Guide — What kind of star, and what does that mean?

**Intermediate:**
- ExoSky Simulator — What do the heavens look like from your world?
- Binary System Designer — Stable orbits in two-star systems

**Advanced:**
- Stellar Evolution Timeline — How will your star change over billions of years?
- System Architecture Planner — Multi-planet system design with stability checks

---

#### Category 2: Worlds

*Planetary parameters—the physics that constrains everything else.*

**Entry Level:**
- Surface Gravity Calculator — Mass, radius, and what it feels like to stand there
- Planetary Profile Worksheet — Core parameters in one document

**Intermediate:**
- TIDELOCK Simulator — Tidally locked world environments and dynamics
- Atmosphere Builder — Composition, pressure, and climate implications
- Day/Night Calculator — Rotation, illumination, and biological rhythms

**Advanced:**
- ROGUE Simulator — Gravitational dynamics and orbital mechanics
- Tectonic & Geology Designer — Plate movement, mountain formation, resource distribution

---

#### Category 3: Life

*Biology—from basic biochemistry to complex organisms.*

**Entry Level:**
- Biology Foundations Worksheet — First species design with evolutionary logic
- Sensory System Designer — What senses, and what do they imply?

**Intermediate:**
- SENSORIUM Simulator — Alien perception modeling (planned)
- Ecosystem Builder — Food webs, niches, and interdependence
- Evolutionary Pressure Mapper — Selection forces and adaptation paths

**Advanced:**
- Biochemistry Alternatives — Non-carbon, non-water life possibilities
- Hive Mind / Colonial Organism Designer — Non-individual consciousness
- Uplift & Modification Framework — Engineered vs. evolved life

---

#### Category 4: Civilizations

*Societies—how intelligent life organizes itself.*

**Entry Level:**
- Cultural Matrix Worksheet — Basic social structure from biological foundations
- Technology Progression Guide — What capabilities, in what order?

**Intermediate:**
- Communication System Designer — Language, writing, signaling
- Economic Structure Builder — Resources, exchange, and power
- Political Organization Framework — Governance emerging from environment and biology

**Advanced:**
- Fermi Calculator — Where is everyone? Your species' answer
- Drake Equation Explorer — Probability of contact and its implications
- K-SCALE Simulator — Kardashev-scale civilization modeling (planned)

---

#### Category 5: Mythology & Meaning

*The stories civilizations tell themselves.*

**Entry Level:**
- Mythology Generator — Creation myths from environmental realities
- Sacred Structure Designer — What's holy, and why this world made it so

**Intermediate:**
- Ritual & Practice Builder — Repeated behaviors and their social functions
- Cosmology Framework — How they understand their place in the universe

**Advanced:**
- Comparative Mythology Mapper — Multiple cultures, divergent myths
- Religious Conflict Designer — When meaning systems collide

---

#### Category 6: Integration & Export

*Bringing it all together.*

**Entry Level:**
- Quick Consistency Checker — Rapid audit for contradictions
- World Bible Template — Structured documentation

**Intermediate:**
- Master Worldbuilding Bible — Comprehensive compilation
- Cross-Reference Validator — Connections between worksheet outputs

**Advanced:**
- Export Suite — Word, PDF, Notion, Scrivener formats
- "Showing Our Work" Documentation — Scientific sources for your choices

---

## Part Five: Implementation Notes

### Wiki Integration

Each tool entry in the wiki should include:
- **Category badge** (Stars & Systems, Worlds, Life, etc.)
- **Complexity indicator** (Entry / Intermediate / Advanced)
- **Cascade position** (Where in Physics → Culture does this sit?)
- **Builds On** (What tools/outputs does this assume you have?)
- **Feeds Into** (What tools/outputs does this enable?)
- **Time estimate** (How long for a first pass?)

### World Dashboard Integration

User's World view should show:
- Cascade progress visualization (which stages have content?)
- Suggested "next tools" based on what's been completed
- Consistency alerts when new entries conflict with existing ones

### Onboarding Modal Behavior

**First authenticated visit:**
- Show Cascade Tutorial (skippable)
- Show Entry Point question
- Route to appropriate pathway or Tools page

**Subsequent visits:**
- "Continue your world" if work in progress
- "Start new world" triggers Entry Point question
- Direct to Tools if user prefers

### "New World" Flow

When user explicitly creates a new world:
1. Name your world (can change later)
2. Entry Point question (or "Skip—I know what I'm doing")
3. Route to pathway or Tools

---

## Appendix: Tool Inventory Mapping

*To be completed with full current tool list, mapping each to category and complexity level.*

| Tool Name | Category | Level | Cascade Position | Status |
|-----------|----------|-------|------------------|--------|
| ROGUE Simulator | Worlds | Advanced | Physics/Environment | Live |
| ExoSky Simulator | Stars & Systems | Intermediate | Environment | Live |
| TIDELOCK Simulator | Worlds | Intermediate | Environment | Live |
| Habitable Zone Calculator | Stars & Systems | Entry | Physics | Live |
| Surface Gravity Calculator | Worlds | Entry | Physics | Live |
| Time Dilation Calculator | Civilizations | Intermediate | Physics | Live |
| Drake Equation Calculator | Civilizations | Advanced | Culture | Live |
| Planetary Profile Worksheet | Worlds | Entry | Environment | Live |
| Biology Design Worksheet | Life | Entry | Biology | Live |
| Cultural Matrix Worksheet | Civilizations | Entry | Culture | Live |
| Mythology Generator | Mythology & Meaning | Entry | Mythology | Live |
| Master Worldbuilding Bible | Integration | Intermediate | All | Live |
| Consistency Checker | Integration | Entry | All | Live |
| *[Continue with full inventory...]* | | | | |

---

*Document prepared for StellarForge.tools*  
*© 2025-2026 Jason D. Batt, Ph.D.*
