# StellarForge Wiki System Architecture

**Content & Feature Specification**  
Version 1.0 | February 2026

---

## Overview

This document defines two interconnected systems:

1. **Wiki Tagging System** — Structured metadata for tool documentation, enabling navigation, discovery, and relationship mapping
2. **Public World Pages** — User-controlled publishing of world documentation, creating shareable showcases and organic marketing

Both systems serve the core mission: helping writers build internally consistent science fiction worlds through systematic methodology.

---

# Part One: Wiki Tagging System

## Purpose

Transform the tool wiki from a flat list into a navigable knowledge graph where users can:
- Find tools by what they're trying to build (subject)
- Find tools appropriate to their experience level (complexity)
- Understand how tools connect to each other (cascade relationships)
- Discover tools they didn't know they needed (contextual suggestions)

---

## Tag Taxonomy

### Primary Tags

Every tool entry receives exactly one tag from each primary category:

#### 1. Subject Category

What does this tool help you build?

| Tag | Scope | Color Code |
|-----|-------|------------|
| `stars-systems` | Stellar classification, orbital mechanics, habitable zones, system architecture | Yellow (#F5C542) |
| `worlds` | Planetary parameters, atmospheres, climates, geology, biomes | Blue (#4A90D9) |
| `life` | Biology, evolution, ecosystems, sensory systems, biochemistry | Green (#4CAF50) |
| `civilizations` | Cultures, technology, economics, politics, communication | Purple (#9C27B0) |
| `mythology` | Religion, meaning-making, rituals, sacred structures, cosmology | Orange (#FF9800) |
| `integration` | World bibles, consistency checking, export, cross-referencing | Cyan (#00D4FF) |

#### 2. Complexity Level

What experience level is this tool designed for?

| Tag | Definition | Icon |
|-----|------------|------|
| `entry` | No prerequisites. Good first tool in its category. Guided experience with defaults. | ○ (single ring) |
| `intermediate` | Assumes basic familiarity. More configuration options. Benefits from prior tool outputs. | ◐ (half-filled) |
| `advanced` | Requires understanding of related concepts. Maximum flexibility. Expert-level detail. | ● (filled) |

#### 3. Tool Type

What kind of interaction does this tool provide?

| Tag | Definition |
|-----|------------|
| `simulator` | Interactive, visual, physics-driven canvas experience |
| `calculator` | Input parameters, receive computed outputs |
| `worksheet` | Guided form with prompts, produces exportable document |
| `generator` | Produces content based on parameters (names, myths, etc.) |
| `reference` | Static information resource, lookup tables, guides |

#### 4. Cascade Position

Where does this tool sit in the Environmental Cascade?

| Tag | Position | Tools affect... |
|-----|----------|-----------------|
| `cascade-physics` | 1 | Fundamental laws, gravity, radiation, orbital mechanics |
| `cascade-environment` | 2 | Climate, terrain, resources, day/night cycles |
| `cascade-biology` | 3 | Anatomy, senses, metabolism, reproduction |
| `cascade-psychology` | 4 | Cognition, emotion, communication, perception |
| `cascade-mythology` | 5 | Meaning, sacred, ritual, cosmology |
| `cascade-culture` | 6 | Society, economics, politics, technology |
| `cascade-meta` | — | Tools that span multiple positions (bibles, consistency checkers) |

---

### Relationship Tags

Tools connect to each other. These relationships power the "Builds On / Feeds Into" navigation.

#### Upstream Dependencies (`builds-on`)

What tools/outputs should ideally exist before using this tool?

```yaml
# Example: Biology Design Worksheet
builds-on:
  - tool: planetary-profile
    relationship: required
    note: "Need gravity, atmosphere, and climate data"
  - tool: biome-designer
    relationship: recommended
    note: "Helps specify environmental pressures"
```

**Relationship Types:**
- `required` — Tool won't function properly without this input
- `recommended` — Better results with this input, but can proceed without
- `optional` — Enhances output if available

#### Downstream Enablement (`feeds-into`)

What tools become more useful after completing this tool?

```yaml
# Example: Biology Design Worksheet
feeds-into:
  - tool: cultural-matrix
    relationship: required
    note: "Culture emerges from biology"
  - tool: sensory-system-designer
    relationship: recommended
    note: "Can deepen sensory details established here"
  - tool: communication-designer
    relationship: recommended
    note: "Biology constrains communication methods"
```

---

### Secondary Tags

Optional tags that enhance discoverability:

#### Content Tags

| Tag | Meaning |
|-----|---------|
| `pro-only` | Requires Pro subscription |
| `beta` | Feature in testing |
| `new` | Added within last 30 days |
| `popular` | High usage metrics |
| `workshop-week-N` | Used in workshop week N |

#### Feature Tags

| Tag | Meaning |
|-----|---------|
| `exportable` | Produces downloadable output |
| `printable` | Designed for physical printing |
| `interactive` | Real-time manipulation |
| `ai-assisted` | Uses AI for generation/suggestions |
| `collaborative` | Supports multi-user editing (future) |

#### Science Tags

| Tag | Meaning |
|-----|---------|
| `nasa-data` | Uses NASA databases |
| `peer-reviewed` | Based on published research |
| `speculative` | Extrapolates beyond current science |
| `showing-work` | Includes methodology documentation |

---

## Wiki Entry Schema

Every tool in the wiki follows this structured format:

```yaml
tool:
  # Identity
  id: "biology-design-worksheet"
  name: "Biology Design Worksheet"
  tagline: "Design species shaped by their world"
  version: "2.1"
  
  # Primary Tags (exactly one each)
  category: "life"
  complexity: "entry"
  type: "worksheet"
  cascade: "cascade-biology"
  
  # Secondary Tags (any applicable)
  tags:
    - "exportable"
    - "workshop-week-3"
    - "popular"
  
  # Relationships
  builds-on:
    - tool: "planetary-profile"
      relationship: "required"
    - tool: "biome-designer"
      relationship: "recommended"
  
  feeds-into:
    - tool: "cultural-matrix"
      relationship: "required"
    - tool: "sensory-system-designer"
      relationship: "recommended"
  
  # Metadata
  time-estimate: "15-30 minutes"
  output-format: ["docx", "pdf", "notion"]
  last-updated: "2026-02-15"
  
  # Content
  description: |
    Design species that feel inevitable rather than arbitrary. 
    This worksheet guides you through evolutionary logic: what 
    environmental pressures shaped this species? What adaptations 
    emerged? How does biology constrain and enable their civilization?
  
  # Sections (for structured worksheets)
  sections:
    - name: "Environmental Pressures"
      description: "What survival challenges does this world present?"
    - name: "Body Plan"
      description: "Physical form emerging from those pressures"
    - name: "Sensory Priorities"
      description: "Which senses matter most, and why?"
    - name: "Metabolism & Lifecycle"
      description: "Energy, reproduction, lifespan"
    - name: "Social Implications"
      description: "How biology shapes group behavior"
  
  # Scientific grounding
  sources:
    - "NASA Astrobiology Institute guidelines"
    - "Convergent evolution research (McGhee, 2011)"
  
  # Related content
  related-reading:
    - type: "blog"
      title: "Why Your Aliens Shouldn't Have Human Eyes"
      url: "/blog/alien-sensory-systems"
    - type: "example"
      title: "Tchaikovsky's Portiids: Biology-First Worldbuilding"
      url: "/wiki/examples/children-of-time"
```

---

## Navigation Implementation

### Tools Page Views

Users can navigate the wiki through multiple lenses:

#### 1. Category View (Default)

Tools grouped by subject category. Within each category, sorted by complexity (entry → intermediate → advanced).

```
STARS & SYSTEMS
  ○ Habitable Zone Calculator
  ○ Star Classification Guide  
  ◐ ExoSky Simulator
  ◐ Binary System Designer
  ● Stellar Evolution Timeline

WORLDS
  ○ Surface Gravity Calculator
  ○ Planetary Profile Worksheet
  ◐ TIDELOCK Simulator
  ◐ Atmosphere Builder
  ● ROGUE Simulator
  
[etc.]
```

#### 2. Cascade View

Tools arranged along the Environmental Cascade, showing flow from physics to culture.

```
PHYSICS ──→ ENVIRONMENT ──→ BIOLOGY ──→ PSYCHOLOGY ──→ MYTHOLOGY ──→ CULTURE
   │            │              │            │              │            │
   ├─ Gravity   ├─ Biomes      ├─ Biology   ├─ Communi-    ├─ Myth      ├─ Cultural
   │  Calc      │  Designer    │  Worksheet │  cation      │  Generator │  Matrix
   │            │              │            │  Designer    │            │
   ├─ Hab Zone  ├─ TIDELOCK    ├─ Sensory   │              ├─ Ritual    ├─ Tech
   │  Calc      │              │  Designer  │              │  Builder   │  Progression
   │            ├─ Atmosphere  │            │              │            │
   └─ ROGUE     │  Builder     └─ Ecosystem │              │            └─ Fermi
                │                 Builder   │              │               Calc
                └─ Planetary               │              │
                   Profile                 │              └─ Cosmology
                                           │                 Framework
                                           │
                                           └─ [Feeds into both
                                               Mythology and Culture]
```

#### 3. Complexity View

Tools grouped by experience level, helping new users find entry points.

```
ENTRY LEVEL — Start Here
  Habitable Zone Calculator (Stars & Systems)
  Surface Gravity Calculator (Worlds)
  Planetary Profile Worksheet (Worlds)
  Biology Design Worksheet (Life)
  Cultural Matrix Worksheet (Civilizations)
  Mythology Generator (Mythology)
  Quick Consistency Checker (Integration)

INTERMEDIATE — Building Deeper
  [tools listed with category badges]

ADVANCED — Expert Tools
  [tools listed with category badges]
```

#### 4. Workshop View

Tools organized by workshop week, mirroring the course structure.

```
WEEK 1: Environment & Planet
  Tool 1: Environmental Chain Reaction
  Tool 2: Planetary Profile
  Tool 12: Biome Diversity

WEEK 2: Physics & Propulsion
  Tool 3: Physics Declaration (One Big Lie)
  Tool 4: Propulsion Consequences

[etc.]
```

### Tool Detail Page

Individual tool pages show:

**Header Block:**
- Tool name and tagline
- Category badge (colored)
- Complexity indicator (○/◐/●)
- Type badge (Simulator/Calculator/Worksheet/etc.)
- Time estimate
- Pro badge (if applicable)

**Cascade Position:**
Visual indicator showing where this tool sits in the cascade, with clickable links to adjacent tools.

**Relationship Panel:**
```
BUILDS ON                          FEEDS INTO
├─ Planetary Profile [Required]    ├─ Cultural Matrix [Required]
└─ Biome Designer [Recommended]    ├─ Sensory Designer [Recommended]
                                   └─ Communication Designer [Recommended]
```

**Description and Sections:**
Full tool documentation.

**Scientific Sources:**
"Showing Our Work" section with methodology and references.

**Related Content:**
Blog posts, examples, and related tools.

---

## Search & Filter

### Filter Controls

Available on Tools page:

```
Category:    [All] [Stars] [Worlds] [Life] [Civs] [Myth] [Integration]
Complexity:  [All] [Entry] [Intermediate] [Advanced]
Type:        [All] [Simulators] [Calculators] [Worksheets] [Generators]
Features:    [ ] Pro Only  [ ] Exportable  [ ] AI-Assisted  [ ] New
```

### Search Behavior

Search queries match against:
- Tool name (highest weight)
- Tagline
- Description
- Section names
- Tags
- Related content titles

Results show category badge and complexity indicator for quick scanning.

---

# Part Two: Public World Pages

## Concept

Users can publish selected portions of their world documentation as public-facing pages, creating:
- **Showcases** for their creative work
- **Portfolios** for professional writers
- **Shared resources** for collaborative projects (RPG campaigns, shared universes)
- **Organic marketing** as readers discover StellarForge through shared worlds

This feature respects the core privacy principle ("Your Worlds Are Yours Alone") by being entirely opt-in with granular control.

---

## Privacy Architecture

### The Principle

**Default: Private.** Nothing is ever public unless the user explicitly publishes it.

### Visibility Levels

| Level | Meaning |
|-------|---------|
| `private` | Only visible to owner. Default for all content. |
| `unlisted` | Accessible via direct link. Not indexed or discoverable. |
| `public` | Indexed in StellarForge gallery. Discoverable via search. |

### Granular Control

Users control visibility at multiple levels:

1. **World Level** — Entire world can be private, unlisted, or public
2. **Section Level** — Individual sections (Planet, Species, Culture, etc.) can have different visibility
3. **Field Level** — Specific fields within sections can be redacted from public view

```
WORLD: Kepler-442 Chronicles
├─ Planet Profile ──────── PUBLIC
│   ├─ Physical Parameters ── visible
│   ├─ Climate Zones ──────── visible
│   └─ Resource Distribution ─ REDACTED (plot spoilers)
│
├─ Dominant Species ─────── PUBLIC
│   ├─ Biology ────────────── visible
│   ├─ Psychology ─────────── visible
│   └─ Secret History ─────── REDACTED
│
├─ Culture ─────────────── UNLISTED (sharing with writing group only)
│
└─ Plot Notes ──────────── PRIVATE (never published)
```

---

## Public Page Structure

### World Landing Page

The public face of a published world:

**URL Structure:**
```
stellarforge.tools/worlds/[username]/[world-slug]
stellarforge.tools/w/[short-code]  (for sharing)
```

**Page Elements:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [World Banner Image - optional, user-uploaded or generated]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  KEPLER-442 CHRONICLES                                          │
│  A world of eternal twilight and bioluminescent forests         │
│                                                                 │
│  Created by [username] · Last updated Feb 2026                  │
│  Built with StellarForge                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WORLD OVERVIEW                                                 │
│  [User-written introduction - 2-3 paragraphs]                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EXPLORE THIS WORLD                                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   🌍 PLANET  │  │   🧬 LIFE    │  │  🏛 CULTURE  │          │
│  │              │  │              │  │              │          │
│  │  K-type star │  │  The Veleth  │  │  Twilight    │          │
│  │  Tidally     │  │  Six-limbed  │  │  Clans       │          │
│  │  locked      │  │  foresters   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CASCADE DIAGRAM                                                │
│  [Visual showing how this world's elements connect]             │
│                                                                 │
│  K-type Star → Tidal Locking → Terminator Zone Life →          │
│  Bioluminescence → Light-Based Communication → Clan Structure   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOOLS USED                                                     │
│  [Badges linking to tools that generated this content]          │
│                                                                 │
│  🔧 TIDELOCK  🔧 Biology Worksheet  🔧 Cultural Matrix          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Section Pages

Deeper pages for each published section:

```
stellarforge.tools/worlds/[username]/[world-slug]/planet
stellarforge.tools/worlds/[username]/[world-slug]/species/veleth
stellarforge.tools/worlds/[username]/[world-slug]/culture
```

Section pages display the worksheet/tool output in a readable format, with:
- Clean typography (not form fields)
- Optional images (user-uploaded)
- Cross-links to related sections
- "Built with [Tool Name]" attribution

---

## Publishing Workflow

### Step 1: Select Content

From World Dashboard, user clicks "Publish" on any section.

```
PUBLISH: PLANETARY PROFILE

This will make your planetary profile visible to others.

Visibility:
○ Unlisted — Only people with the link can view
● Public — Listed in StellarForge gallery, discoverable via search

Content Review:
The following fields will be visible:
  ✓ Planet Name
  ✓ Star Type
  ✓ Orbital Parameters
  ✓ Surface Gravity
  ✓ Atmosphere
  ✓ Climate Zones
  
Redact any fields? [Select fields to hide]

[ Cancel ]  [ Preview ]  [ Publish ]
```

### Step 2: Preview

User sees exactly how the public page will appear before confirming.

### Step 3: Publish

Content goes live. User receives shareable link.

### Step 4: Manage

From World Dashboard, published content shows visibility badges:
- 🌐 Public
- 🔗 Unlisted  
- 🔒 Private

User can change visibility or unpublish at any time.

---

## World Gallery

### Public Discovery

Users who publish worlds as "Public" appear in the StellarForge gallery:

```
stellarforge.tools/gallery
```

**Gallery Features:**

**Browse by Category:**
- Featured Worlds (staff picks)
- Recently Published
- Most Viewed
- By Environment Type (Tidally Locked, Ocean Worlds, Binary Systems, etc.)
- By Life Type (Silicon-based, Hive minds, Uplifted species, etc.)

**Search:**
- Full-text search across public world content
- Filter by tools used, star types, life forms, etc.

**World Cards:**
```
┌─────────────────────────────────┐
│  [World Banner Thumbnail]       │
├─────────────────────────────────┤
│  KEPLER-442 CHRONICLES          │
│  Bioluminescent twilight world  │
│                                 │
│  by [username]                  │
│  🌍 Tidally Locked  🧬 Alien   │
│                                 │
│  ♡ 142  👁 2.3k                 │
└─────────────────────────────────┘
```

### Engagement Features

**Reactions:**
Users can "favorite" worlds (♡). No comments system initially—keeps moderation simple.

**View Counts:**
Public worlds track views. Displayed on world page and in gallery.

**Share Tools:**
One-click sharing to Twitter/X, Bluesky, Reddit, with auto-generated preview cards.

---

## Attribution & Licensing

### StellarForge Attribution

All public world pages include subtle attribution:

```
Built with StellarForge.tools
[Create Your Own World →]
```

This drives organic discovery without being intrusive.

### User Content Licensing

When publishing, users select a license for their content:

| License | Meaning |
|---------|---------|
| All Rights Reserved | Default. Others can view but not reuse. |
| CC BY | Others can reuse with attribution. |
| CC BY-SA | Others can reuse with attribution, must share alike. |
| CC BY-NC | Others can reuse non-commercially with attribution. |
| Public Domain | No restrictions on reuse. |

License displayed on world page. StellarForge never claims rights to user content.

---

## Customization Options

### Theming (Pro Feature)

Pro users can customize their public world pages:

**Color Scheme:**
- Default (StellarForge dark)
- Custom accent color
- Light mode option

**Typography:**
- Default (MD Nichrome / Jura / DM Sans)
- Alternative font pairings

**Banner Image:**
- Upload custom image
- Choose from gallery of space/planet imagery
- AI-generated based on world parameters (future)

**Custom CSS (Advanced):**
For users who want complete control.

### Custom Domain (Future)

Eventually, Pro users could map custom domains:

```
worlds.mynovel.com → stellarforge.tools/worlds/username/my-novel-world
```

---

## Export Integration

Public world pages can be exported in multiple formats:

**For Readers:**
- Clean PDF of all public sections
- EPUB for e-readers
- Print-formatted document

**For Writers:**
- Scrivener-compatible package
- Notion export
- World Anvil import format (future)

**For Developers:**
- JSON API for public world data
- Embed widgets for external sites

---

## Moderation & Safety

### Content Guidelines

Published worlds must not contain:
- Hate speech or discrimination
- Sexual content involving minors
- Real-world violence incitement
- Harassment of real individuals
- Copyright-infringing content

### Reporting System

All public pages include "Report" option. Reports reviewed by staff.

### Automated Screening

Basic content screening on publish (profanity filter, CSAM detection). Flagged content held for review.

### Takedown Process

If content violates guidelines:
1. Content hidden immediately
2. User notified with specific violation
3. Appeal process available
4. Repeat violations may result in publishing privileges revoked

---

## Marketing Integration

### Organic Discovery Loop

```
User creates world with StellarForge
         ↓
User publishes world publicly
         ↓
User shares on social media / writing communities
         ↓
Readers discover world page
         ↓
Readers see "Built with StellarForge"
         ↓
Readers explore other worlds in gallery
         ↓
Readers sign up to build their own worlds
         ↓
[Cycle repeats]
```

### Content Marketing Synergy

**Substack Integration:**
- "World of the Week" features in The Stellar Furnace
- Writer interviews alongside their published worlds
- Workshop student showcases

**Social Proof:**
- Gallery becomes portfolio of what StellarForge enables
- "See what others have built" on homepage
- Testimonials linked to actual world pages

---

## Implementation Phases

### Phase 1: Foundation (Launch)
- Basic public/private toggle at world level
- Simple world landing pages
- Unlisted sharing via link
- No gallery (just direct links)

### Phase 2: Gallery (Post-Launch +2 months)
- Public gallery with browse/search
- World cards and previews
- Favorites system
- Share buttons

### Phase 3: Customization (Post-Launch +4 months)
- Pro theming options
- Section-level visibility controls
- Custom banner images
- Enhanced export options

### Phase 4: Community (Post-Launch +6 months)
- Featured worlds curation
- Category browsing
- API access
- Embed widgets

---

## Technical Considerations

### URL Structure

```
/worlds                           → Gallery
/worlds/[username]                → User's public worlds
/worlds/[username]/[world-slug]   → World landing page
/worlds/[username]/[world-slug]/[section]  → Section page
/w/[short-code]                   → Short URL redirect
```

### SEO

Public world pages are:
- Server-rendered for crawlability
- Include Open Graph meta tags for social sharing
- Structured data for rich search results
- Sitemap inclusion for gallery worlds

### Performance

- World pages cached aggressively
- Images served via CDN
- Lazy loading for gallery
- Incremental static regeneration for popular worlds

### Privacy Compliance

- No tracking on public pages beyond basic analytics
- GDPR-compliant data handling
- Clear privacy policy for published content
- Right to deletion includes all published content

---

## Success Metrics

### Engagement
- Worlds published (total, monthly)
- Public vs. unlisted ratio
- Gallery views
- Shares to social media

### Conversion
- Sign-ups originating from public world pages
- Gallery → Sign-up funnel
- "Create Your Own World" CTA clicks

### Retention
- Published world creators return rate
- Worlds updated after initial publish
- Multiple worlds published per user

---

*Document prepared for StellarForge.tools*  
*© 2025-2026 Jason D. Batt, Ph.D.*
