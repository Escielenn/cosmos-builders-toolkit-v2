# StellarForge World Graph & Entity Layer
# Comprehensive Specification

**Spec Version:** 1.0  
**Date:** April 4, 2026  
**Author:** Jason D. Batt, Ph.D. / Claude (Planning)  
**Handoff Target:** Claude Code  
**Status:** Planning / Ready for Pre-Flight  
**Depends On:** `StellarForge_Writing_System_Spec.md` (entity table definitions)

---

## Table of Contents

1. Philosophy: Why the Graph Matters
2. The Entity Data Layer (Foundation)
3. The Connection Data Layer
4. Graph View: Core Implementation
5. List View: Structured Relationship Browser
6. The Cascade Graph (StellarForge Differentiator)
7. Analytical Tools: Narrative Distance, Tension Detection, Gravity
8. Interactive Tools: What-If Removal, Path Tracing, Temporal Layers
9. Cascade Audit Mode
10. UI/UX Design Requirements
11. Technical Architecture
12. Implementation Phases
13. Pre-Flight Protocol

---

## 1. Philosophy: Why the Graph Matters

Most worldbuilding tools that include a graph feature treat it as a visualization 
afterthought. You build your world in forms and text fields, and the graph just 
mirrors what you already know. It is a picture of your data, not a thinking tool. 
That is why people open it once, say "neat," and never come back.

The StellarForge World Graph must be a **thinking tool**. It must surface insights, 
reveal problems, and generate creative possibilities that the writer would not 
discover any other way. It must do things that text and lists cannot do.

The graph becomes indispensable when it satisfies three conditions:

1. **It reveals structure you did not consciously build.** Clusters, bottlenecks, 
   orphans, and emergent patterns that only become visible when connections are 
   rendered spatially.

2. **It surfaces contradictions that become story opportunities.** Conflicting 
   alliances, paradoxical relationships, entities caught between incompatible 
   forces. These are where drama lives.

3. **It is organized around the Environmental Cascade.** Because every connection 
   carries a cascade stage, the graph can do something no generic tool can: show 
   how a single change at the physics layer ripples through biology, psychology, 
   mythology, and culture. This is the cascade made tangible.

**The graph is not a feature. It is the Environmental Cascade, visualized.**

---

## 2. The Entity Data Layer (Foundation)

Every node in the graph is an entity. Without the entity table, nothing works.

### 2.1 Entity Table

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  -- Allowed values: 'star', 'planet', 'moon', 'species', 'faction', 
  -- 'character', 'location', 'technology', 'event', 'concept', 
  -- 'language', 'religion', 'artifact', 'custom'
  custom_type_label TEXT,         -- user label when entity_type = 'custom'
  
  -- Cascade Classification
  cascade_stage TEXT NOT NULL DEFAULT 'culture',
  -- Allowed values: 'physics', 'environment', 'biology', 
  -- 'psychology', 'mythology', 'culture'
  -- Determines default positioning in cascade-organized views.
  -- The stage represents WHERE in the cascade this entity primarily 
  -- operates. A planet is 'physics'. A species is 'biology'. 
  -- A religion is 'mythology'. Users can override.
  
  -- Display
  color TEXT,                     -- hex color override (null = derive from type)
  icon TEXT,                      -- icon identifier or emoji
  summary TEXT,                   -- one-line description for tooltips/cards
  image_url TEXT,                 -- concept art or reference image
  
  -- Content
  description TEXT,               -- rich text (Tiptap JSON or HTML)
  notes TEXT,                     -- private author notes
  
  -- Organization
  parent_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Graph Layout (per-world, user-controlled positions)
  graph_x FLOAT,                  -- null = auto-layout via force simulation
  graph_y FLOAT,                  -- null = auto-layout via force simulation
  pinned BOOLEAN DEFAULT false,   -- if true, node stays where user placed it
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  -- Extensible. Examples:
  -- For planets: { "mass": 5.97e24, "radius": 6371, "orbital_period": 365.25 }
  -- For species: { "lifespan": 200, "avg_height": 2.1, "senses": ["sight","echolocation"] }
  -- For factions: { "government_type": "oligarchy", "population": 1200000 }
  -- For events: { "date_start": "Year 412", "date_end": "Year 415" }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_entities_world ON entities(world_id);
CREATE INDEX idx_entities_type ON entities(world_id, entity_type);
CREATE INDEX idx_entities_cascade ON entities(world_id, cascade_stage);
CREATE INDEX idx_entities_parent ON entities(parent_entity_id);
CREATE INDEX idx_entities_tags ON entities USING GIN(tags);
CREATE INDEX idx_entities_user ON entities(user_id);

-- Row Level Security
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entities" ON entities
  FOR ALL USING (user_id = auth.uid());
```

### 2.2 Default Type-to-Cascade Mapping

When a user creates an entity and selects a type, the cascade_stage auto-fills 
(but remains editable):

| Entity Type | Default Cascade Stage | Default Color |
|---|---|---|
| star | physics | `#FFB800` (amber) |
| planet | physics | `#4D9FFF` (azure) |
| moon | physics | `#9B5DE5` (violet) |
| species | biology | `#FF00AA` (magenta) |
| character | psychology | `#00FF88` (emerald) |
| faction | culture | `#FFB800` (amber) |
| location | environment | `#4D9FFF` (azure) |
| technology | culture | `#00D4FF` (cyan) |
| event | culture | `#FF3366` (crimson) |
| concept | psychology | `#9B5DE5` (violet) |
| language | culture | `#00FF88` (emerald) |
| religion | mythology | `#FF00AA` (magenta) |
| artifact | culture | `#FFB800` (amber) |
| custom | culture | `#00D4FF` (cyan) |

### 2.3 Cascade Stage Color Scheme (for edges and filters)

These colors represent the cascade stages themselves (distinct from entity colors):

```
physics      → #4D9FFF (azure)     — laws, forces, parameters
environment  → #00D4FF (cyan)      — terrain, atmosphere, climate
biology      → #00FF88 (emerald)   — evolution, adaptation, physiology
psychology   → #9B5DE5 (violet)    — cognition, emotion, perception
mythology    → #FF00AA (magenta)   — belief, sacred narrative, symbol
culture      → #FFB800 (amber)     — society, politics, art, technology
```

These are used to color-code edges in the graph and to tint filter controls.

---

## 3. The Connection Data Layer

Every edge in the graph is a connection. A connection always links a source entity 
to a target entity through a typed, cascade-aware relationship.

### 3.1 Connection Table

```sql
CREATE TABLE entity_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- The relationship
  source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  
  -- Classification
  relationship_type TEXT NOT NULL,     -- from taxonomy (see Appendix A)
  relationship_label TEXT,             -- user-facing display label
  cascade_stage TEXT NOT NULL,         -- which cascade layer this connection
                                       -- operates at
  -- Allowed values: 'physics', 'environment', 'biology', 
  -- 'psychology', 'mythology', 'culture', 'cross_cascade'
  -- 'cross_cascade' is for connections that span multiple stages
  
  -- Directionality
  bidirectional BOOLEAN DEFAULT false,
  -- true: "A allied_with B" implies "B allied_with A"
  -- false: "A orbits B" does NOT imply "B orbits A"
  
  -- Strength & Status
  strength INTEGER DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
  -- 1 = tenuous/minor, 10 = fundamental/load-bearing
  -- Visualized as edge thickness in graph view
  
  status TEXT DEFAULT 'active',
  -- 'active', 'historical', 'potential', 'severed'
  -- Enables temporal filtering and what-if scenarios
  
  -- Temporal bounds (for timeline scrubber)
  time_start TEXT,                     -- in-world date/era when connection began
  time_end TEXT,                       -- in-world date/era when connection ended
  -- Text because fictional calendars are not ISO 8601
  
  -- Metadata
  notes TEXT,                          -- user notes about this connection
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- { "trade_goods": ["spice", "technology"], "treaty_name": "Accord of Venn" }
  -- { "evolutionary_pressure": "atmospheric toxicity" }
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent exact duplicate connections
  UNIQUE(world_id, source_entity_id, target_entity_id, relationship_type)
);

-- Indexes for graph queries (both directions)
CREATE INDEX idx_conn_source ON entity_connections(source_entity_id);
CREATE INDEX idx_conn_target ON entity_connections(target_entity_id);
CREATE INDEX idx_conn_world ON entity_connections(world_id);
CREATE INDEX idx_conn_cascade ON entity_connections(world_id, cascade_stage);
CREATE INDEX idx_conn_status ON entity_connections(world_id, status);

-- RLS
ALTER TABLE entity_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON entity_connections
  FOR ALL USING (user_id = auth.uid());
```

### 3.2 Connection Query Helper (both directions)

Since many queries need to find all connections for a given entity regardless of 
whether it is source or target:

```sql
-- View: all connections for an entity, normalized
CREATE OR REPLACE VIEW entity_connections_bidirectional AS
SELECT 
  c.id,
  c.world_id,
  c.source_entity_id,
  c.target_entity_id,
  c.relationship_type,
  c.relationship_label,
  c.cascade_stage,
  c.bidirectional,
  c.strength,
  c.status,
  c.time_start,
  c.time_end,
  c.notes,
  c.metadata,
  se.name as source_name,
  se.entity_type as source_type,
  se.color as source_color,
  se.cascade_stage as source_cascade,
  te.name as target_name,
  te.entity_type as target_type,
  te.color as target_color,
  te.cascade_stage as target_cascade
FROM entity_connections c
JOIN entities se ON c.source_entity_id = se.id
JOIN entities te ON c.target_entity_id = te.id;
```

---

## 4. Graph View: Core Implementation

### 4.1 Technology: @xyflow/react (React Flow)

React Flow is the recommended library. It provides pan, zoom, node dragging, edge 
rendering, minimap, and custom node/edge types out of the box. Force-directed 
layout is achieved by pairing it with d3-force for auto-positioning.

```
Dependencies:
@xyflow/react          — core graph rendering
d3-force               — force-directed layout simulation
d3-force-3d            — (optional, future: 3D view)
```

### 4.2 Custom Node Component: EntityNode

Each entity renders as a custom React Flow node.

```
Visual design:
┌──────────────────────────┐
│ ● [color dot]  PLANET    │  ← entity_type label, muted
│                          │
│   K E T H                │  ← entity name, Space Grotesk 300
│                          │
│   Tidally locked world   │  ← summary, DM Sans, muted
│   in the Voss system     │
│                          │
│   ◉ 7 connections        │  ← connection count badge
└──────────────────────────┘

Node sizing:
- Base size: 160px x 90px
- Gravity-scaled size (when Gravity Analysis is active):
  min 120px x 70px (0-1 connections) to max 240px x 130px (10+ connections)

Node styling:
- Background: var(--sf-surface) rgba(21, 21, 24, 0.95)
- Border: 1px solid rgba(255,255,255,0.08)
- Border-left: 3px solid [entity color]
- Border-radius: 8px
- On hover: border-color transitions to entity color, subtle glow
- On select: border-color = var(--sf-cyan), glow intensifies
- On drag: slight scale(1.02), shadow lift

Connection handles:
- Visible on hover as small dots at top, right, bottom, left
- Color: entity color at 0.4 opacity
- On drag-from-handle: creates new connection (opens connection modal 
  when dropped on another node)
```

### 4.3 Custom Edge Component: CascadeEdge

Each connection renders as a custom React Flow edge, color-coded by cascade stage.

```
Visual design:
- Stroke color: cascade stage color (see section 2.3)
- Stroke width: maps to connection strength
    strength 1-3  → 1px
    strength 4-6  → 2px  
    strength 7-9  → 3px
    strength 10   → 4px with subtle glow
- Stroke style:
    status 'active'     → solid
    status 'historical' → dashed (4, 4)
    status 'potential'  → dotted (2, 4)
    status 'severed'    → dashed with X marker at midpoint
- Edge label: relationship_label (or relationship_type if label is null)
    Font: DM Sans, 10px, cascade stage color at 0.6 opacity
    Background: var(--sf-void) pill
- Directionality: 
    bidirectional = false → arrowhead at target end
    bidirectional = true  → no arrowheads (or double arrowheads)
- Edge path: bezier curve (React Flow default: smoothstep)

Interaction:
- Hover: edge brightens, label becomes fully opaque
- Click: opens connection detail panel (edit, delete, view notes)
- Right-click: context menu (edit, delete, reverse direction)
```

### 4.4 Graph Canvas

```
Background: var(--sf-void) #0D0D0F
Grid: subtle dot grid, rgba(255,255,255,0.02), spacing 20px
Minimap: bottom-right, 180x120px, glass morphism background
Controls: bottom-left, zoom in/out/fit, glass morphism
```

### 4.5 Force-Directed Layout

Auto-layout positions nodes when they lack stored graph_x/graph_y positions, or 
when the user clicks "Auto-Layout."

```javascript
// d3-force configuration tuned for worldbuilding graphs
const simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody()
    .strength(-300)              // repulsion between nodes
  )
  .force('link', d3.forceLink(edges)
    .id(d => d.id)
    .distance(d => {
      // Stronger connections = shorter edges
      return 200 - (d.data.strength * 15);
    })
  )
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius(100)                 // prevent node overlap
  )
  .force('cascade', cascadeForce(nodes))  // custom: see below
  .alphaDecay(0.02)
  .on('tick', updatePositions);

// Custom force: cascade stage gravity
// Pulls nodes toward vertical bands based on their cascade_stage.
// Physics at left, culture at right, creating a left-to-right 
// cascade flow. Strength is low so users can override by dragging.
function cascadeForce(nodes) {
  const stageBands = {
    physics:     0.1,   // 10% from left
    environment: 0.25,
    biology:     0.4,
    psychology:  0.55,
    mythology:   0.7,
    culture:     0.85,
  };
  
  return d3.forceX(d => {
    const band = stageBands[d.data.cascade_stage] || 0.5;
    return band * canvasWidth;
  }).strength(0.05);  // very gentle — suggestion, not constraint
}
```

### 4.6 Node Pinning

When a user drags a node to a position, it becomes "pinned":

```
1. On dragEnd: set entity.graph_x, entity.graph_y, entity.pinned = true
2. Save to Supabase (debounced batch update)
3. Pinned nodes are excluded from force simulation repositioning
4. Visual indicator: small pin icon at top-right of pinned nodes
5. User can unpin via right-click context menu → "Auto-position"
```

### 4.7 Connection Creation Flow

```
Method 1: Drag from handle
1. User hovers over a node → connection handles appear
2. User drags from a handle toward another node
3. Drop on target node → Connection Modal opens

Method 2: Select + click
1. User clicks a node to select it (cyan ring)
2. User clicks a second node
3. Connection Modal opens

Method 3: Right-click context menu
1. Right-click a node → "Connect to..."
2. Cursor changes to crosshair
3. Click target node → Connection Modal opens

Connection Modal:
┌─────────────────────────────────────────────┐
│  NEW CONNECTION                             │
│                                             │
│  [Keth] ──────────→ [Commander Voss]        │
│                                             │
│  Relationship Type:  [homeworld_of    ▾]    │
│  Display Label:      [Homeworld of    ___]  │
│  Cascade Stage:      [environment     ▾]    │
│  Direction:          [◉ One-way ○ Mutual]   │
│  Strength:           [────●────────── ] 6   │
│  Status:             [◉Active ○Historical   │
│                       ○Potential ○Severed]   │
│  Time Start:         [____________]         │
│  Time End:           [____________]         │
│  Notes:              [____________]         │
│                                             │
│              [Cancel]    [Create Connection] │
└─────────────────────────────────────────────┘

Modal follows StellarForge glass morphism aesthetic:
- Background: rgba(15,15,16,0.98)
- Border: 1px solid rgba(0, 212, 255, 0.08)
- Backdrop-filter: blur(20px)
```

---

## 5. List View: Structured Relationship Browser

An alternative view of the same data for users who prefer structured navigation 
over spatial exploration.

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  WORLD CONNECTIONS                   [Graph View] [List View]│
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  FILTER     │  Keth (Planet)                                │
│  ─────────  │  ├── orbited_by → Dara (Moon)         [phys] │
│  ○ All      │  ├── homeworld_of → The Venn (Species) [bio] │
│  ○ Physics  │  ├── seat_of → The Accord (Faction)   [cult] │
│  ○ Environ  │  ├── sacred_to → Sky Temple (Location) [myth]│
│  ○ Biology  │  └── mentioned_in → "Dawn Prayer" (Concept)  │
│  ○ Psychol  │                                               │
│  ○ Mythol   │  Commander Voss (Character)                   │
│  ○ Culture  │  ├── stationed_on → Keth (Planet)      [env] │
│             │  ├── member_of → The Accord (Faction)  [cult] │
│  TYPE       │  └── fears → The Deep (Concept)        [psy] │
│  ─────────  │                                               │
│  ☑ Planets  │  The Venn (Species)                           │
│  ☑ Species  │  ├── evolved_on → Keth (Planet)        [bio] │
│  ☑ Factions │  ├── symbiotic_with → Kari (Species)   [bio] │
│  ☑ ...      │  └── worships → The Silence (Concept)  [myth]│
│             │                                               │
│  STRENGTH   │                                               │
│  [──●─────] │                                               │
│  Min: 3     │                                               │
│             │                                               │
│  STATUS     │                                               │
│  ☑ Active   │                                               │
│  ☑ Historic │                                               │
│  ☐ Potentl  │                                               │
│  ☐ Severed  │                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### 5.2 Interactions

```
- Click entity name → expand/collapse its connections (accordion)
- Click connection row → open Connection Detail panel (same as graph edge click)
- Click the cascade stage badge [phys] [bio] etc. → filter to that stage
- Click the target entity name → scroll to and expand that entity
- Drag connection rows to reorder (updates sort_order)
- Right-click connection → edit, delete, reverse
- "Add Connection" button at bottom of each entity's section
```

---

## 6. The Cascade Graph (StellarForge Differentiator)

This is the feature that makes the World Graph uniquely StellarForge. No other 
worldbuilding tool has the Environmental Cascade as its organizing principle, and 
the Cascade Graph makes that framework visible and interactive.

### 6.1 Cascade Filter Bar

A horizontal bar above the graph canvas with six toggle buttons, one per cascade 
stage. Each button is tinted with that stage's color.

```
┌───────────────────────────────────────────────────────────┐
│ [● PHYSICS] [● ENVIRON] [● BIOLOGY] [● PSYCH] [● MYTH] [● CULTURE] │
│  #4D9FFF     #00D4FF     #00FF88     #9B5DE5   #FF00AA   #FFB800    │
└───────────────────────────────────────────────────────────┘

Behavior:
- All active by default (show everything)
- Click a stage → solo that stage (only show edges at that cascade level; 
  dim nodes that have no connections at that level)
- Shift+click → toggle stage (add/remove from current filter)
- Double-click → reset to all active
- When filtering, nodes with no visible connections fade to 0.15 opacity
- Edges not matching the filter fade to 0.05 opacity
- Active edges retain full cascade-stage coloring
```

### 6.2 Cascade Flow Layout

A special layout mode (activated via toolbar button) that arranges nodes into 
vertical columns by cascade stage, left to right:

```
PHYSICS → ENVIRONMENT → BIOLOGY → PSYCHOLOGY → MYTHOLOGY → CULTURE

  [Star]     [Biome]      [Species]   [Fear of     [Sky God    [The
   Voss       Tundra        Venn        silence]     myth]      Accord]
    │           │             │            │           │          │
    └───────────┘             │            │           │          │
    orbital                   │            │           │          │
    mechanics ────────────────┘            │           │          │
              atmospheric                  │           │          │
              chemistry ───────────────────┘           │          │
                         sensory                       │          │
                         evolution ────────────────────┘          │
                                    cognitive                     │
                                    response ─────────────────────┘
                                              sacred
                                              narrative ──────────┘
                                                        social
                                                        structure
```

This layout makes the cascade chain visually explicit. Users can see how a single 
physics parameter cascades through all six stages. This is the spec's defining 
visualization and the one most likely to appear in marketing materials.

### 6.3 Cascade Path Highlighting

Select any entity and request "Show Cascade Path":

```
1. Starting from the selected entity, trace all connections downstream 
   through the cascade (physics → environment → biology → psychology → 
   mythology → culture).
2. Also trace upstream (back toward physics).
3. Highlight the full cascade chain.
4. Dim everything outside the chain to 0.1 opacity.
5. Animate a pulse along the chain from physics-end to culture-end, 
   showing the direction of causality.

Algorithm:
- From selected entity, BFS outward
- For downstream: only follow edges where target.cascade_stage is LATER 
  in the cascade than source.cascade_stage (or same stage)
- For upstream: only follow edges where target.cascade_stage is EARLIER
- Color the path with a gradient from azure (physics) to amber (culture)
```

---

## 7. Analytical Tools

These features transform the graph from a display tool into a thinking tool.

### 7.1 Narrative Distance

**What it does:** Calculates the shortest path (hop count) between any two 
entities. Each path represents a potential narrative thread.

**How it works:**
```
1. User activates Narrative Distance mode (toolbar button)
2. User clicks Entity A → cyan highlight ring
3. User clicks Entity B → amber highlight ring
4. System runs BFS/Dijkstra from A to B
5. ALL paths between A and B are computed (up to 5 shortest)
6. Paths displayed in a sidebar panel, ranked by hop count:

   Path 1 (3 hops):
   Keth → [orbited_by] → Star Voss → [illuminates] → 
   Tundra Biome → [inhabited_by] → Commander Voss
   
   Path 2 (4 hops):
   Keth → [homeworld_of] → The Venn → [member_of] → 
   The Accord → [led_by] → Commander Voss

7. Clicking a path highlights it in the graph, dimming everything else
8. Each path is annotated with the cascade stages it traverses:
   "This path crosses physics → environment → biology (3 cascade levels)"
```

**Why it matters:** Two characters five hops apart are narratively distant. 
The paths between them *are* the possible story structures for bringing them 
together. A writer looks at Path 1 and sees an astronomical discovery plot. 
They look at Path 2 and see a political intrigue plot. The graph just outlined 
two different stories.

### 7.2 Tension Detection

**What it does:** Identifies structural contradictions in the relationship graph 
that represent story opportunities.

**Tension patterns to detect:**

```
Pattern 1: Triangle Conflict
If A allied_with B, B enemy_of C, A trades_with C
→ Flag: "A is caught between allied B and trading partner C"

Pattern 2: Cascade Contradiction
If entity X has two connections at the same cascade stage that imply 
opposing outcomes (e.g., a species is both "adapted to extreme cold" 
and "native to volcanic region")
→ Flag: "Possible environmental contradiction for [species]"

Pattern 3: Orphaned Downstream
If a biology-stage entity has connections to psychology-stage entities, 
but the physics and environment stages that should logically support 
that biology have no connections
→ Flag: "This species has psychological traits but no environmental 
   grounding. What physical conditions produced this biology?"

Pattern 4: Power Paradox
If Faction A rules Location X, and Faction B also rules Location X 
(two "rules" connections to same target)
→ Flag: "Contested territory: who actually controls [location]?"

Pattern 5: Severed Legacy
If a connection has status 'severed' but downstream connections still 
assume it is active
→ Flag: "These relationships may have changed since [connection] 
   was severed"
```

**Display:**
```
Tension indicators appear as warning-amber diamonds on the graph at the 
point of conflict. Clicking a tension diamond opens a panel explaining the 
contradiction and listing the involved entities and connections.

Tensions are NOT errors to fix. The panel language should frame them as 
creative opportunities:
  "TENSION DETECTED: The Venn worship the Sky God but fear open spaces. 
   How does a species with agoraphobia maintain a sky-centered religion? 
   This tension could drive ritual, architecture, or schism."
```

### 7.3 Gravity Analysis (Node Importance)

**What it does:** Visualizes which entities are structurally central to the world 
(load-bearing) and which are peripheral (underdeveloped or orphaned).

**How it works:**
```
Metric: weighted degree centrality
- For each entity, sum the strengths of all its connections
- Normalize to 0-1 range across the world

Visualization:
- Node size scales with centrality (120px at 0, 240px at 1)
- Node glow intensity scales with centrality
- A "gravity well" radial gradient emanates from high-centrality nodes
- Orphan entities (0 connections) pulse with a subtle amber warning glow

Sidebar panel shows ranked list:
  1. Keth (Planet) .............. 47 weighted connections
  2. The Accord (Faction) ....... 31 weighted connections
  3. The Venn (Species) ......... 28 weighted connections
  ...
  12. Ancient Signal (Event) .... 1 weighted connection  ⚠ ORPHAN
  13. Dream Logic (Concept) ..... 0 weighted connections ⚠ ORPHAN
```

**Why it matters:** At a glance, the writer sees the shape of their world's 
development. Lots of work done on species and factions, almost nothing on 
technology. The Ancient Signal event is connected to exactly one thing, which 
means it is either underdeveloped or deliberately isolated. The gravity map 
reveals structural imbalance that a text list never shows.

### 7.4 Cluster Discovery

**What it does:** Identifies naturally emerging groups of tightly connected 
entities that the writer may not have consciously organized.

**How it works:**
```
Algorithm: community detection (Louvain method or simple modularity-based 
clustering on the adjacency matrix)

Visualization:
- Clusters are highlighted with a subtle tinted background region
- Each cluster gets a label generated from its most common entity types 
  and relationship types: "Species-Faction Cluster" or "Keth System Cluster"
- Clicking a cluster zooms to fit and solos its contents

Sidebar panel:
  Cluster 1: "The Keth System" (8 entities)
  - Keth, Star Voss, Dara, Tundra Biome, The Venn, Kari, 
    Sky Temple, Commander Voss
  - Internal density: 0.72 (tightly connected)
  - External connections: 4 (bridges to other clusters)
  
  Cluster 2: "The Accord Political Network" (5 entities)
  - The Accord, Senate Hall, Trade Route Alpha, Earth Delegation, 
    Ambassador Chen
  - Internal density: 0.60
  - External connections: 3
  
  ⚠ Bridge Entity: Commander Voss appears in BOTH clusters
  → This character links the planetary and political storylines
```

**Why it matters:** Clusters often correspond to storylines, and bridge entities 
between clusters are natural protagonist candidates. "Oh, I didn't realize my 
three unrelated subplots all pass through the same faction." That kind of 
structural insight reorganizes a novel.

---

## 8. Interactive Tools

### 8.1 What-If Removal

**What it does:** Hypothetically removes an entity and shows the structural 
consequences without actually deleting anything.

**How it works:**
```
1. User right-clicks an entity → "What if this didn't exist?"
2. The entity fades to ghost state (0.15 opacity, dashed border)
3. All connections to/from it become dashed and fade
4. The graph re-runs force simulation WITHOUT that entity
5. Sidebar panel shows impact analysis:

   WHAT IF: "Keth" were removed?
   
   SEVERED CONNECTIONS: 7
   - The Venn loses homeworld connection (biology orphaned)
   - Commander Voss loses station connection
   - The Accord loses seat of power
   - Sky Temple loses physical location
   ...
   
   NEWLY ORPHANED ENTITIES: 2
   - Tundra Biome (only connected through Keth)
   - Dara (moon of Keth, no other connections)
   
   CASCADE BREAKS: 3
   - The Venn → psychology chain loses environmental grounding
   - Sky God mythology loses physical referent
   - Accord's legitimacy chain loses territorial anchor
   
   STRUCTURAL IMPACT: HIGH
   "Keth is a load-bearing entity. Removing it disconnects 2 entities 
    and breaks 3 cascade chains."

6. User can click "Undo" or "Actually delete" (with confirmation)
```

**Why it matters:** If you remove a planet and nothing changes, that planet 
isn't load-bearing and might not deserve narrative real estate. If removing a 
single faction disconnects half the graph, that faction is the world's structural 
keystone and you know it.

### 8.2 Story Path Tracing

**What it does:** Finds all paths between two entities and presents each path 
as a potential narrative thread.

(This is the interactive version of Narrative Distance from 7.1. The difference 
is that Story Path Tracing presents results as story summaries, not just hop 
counts.)

```
Each path is annotated with a generated story-seed:

Path 1 (3 hops, crosses physics → environment → culture):
Keth → Star Voss → Tundra Biome → Commander Voss
"A journey from the planet's core to its harshest environment, 
 ending at the officer stationed there. This is a survival story."

Path 2 (4 hops, crosses biology → culture → psychology):
Keth → The Venn → The Accord → Commander Voss
"Through the native species to the political body to the officer. 
 This is a diplomatic first-contact story."
```

**Implementation note:** The story-seed annotations are NOT generated by AI. They 
are template-based, constructed from the cascade stages and relationship types 
along the path. The templates are deterministic:

```javascript
// Template construction
const stageLabel = {
  physics: "the fundamental forces",
  environment: "the physical landscape",
  biology: "the living world",
  psychology: "the inner life",
  mythology: "the sacred narrative",
  culture: "the social fabric",
};

// Path description: "A thread from [first stage] through [middle stages] 
// to [last stage]"
```

### 8.3 Temporal Layers (Timeline Scrubber)

**What it does:** Allows the user to view the state of their world's relationships 
at any point in its fictional history.

**How it works:**
```
Prerequisite: connections must have time_start and/or time_end values.

UI: A horizontal timeline bar below the graph canvas:
┌─────────────────────────────────────────────────┐
│ ◀ [═══════════●═══════════════════════════] ▶   │
│   Year 0              Year 412        Year 1000 │
│              ▲ current view                     │
└─────────────────────────────────────────────────┘

Behavior:
1. Drag the scrubber handle to a point in the timeline
2. Connections whose time_start is AFTER the scrubber position → hidden
3. Connections whose time_end is BEFORE the scrubber position → shown 
   as 'historical' (dashed)
4. Connections whose time range includes the scrubber position → shown 
   as 'active' (solid)
5. Entities with no visible connections at the current time → fade
6. Animation: "Play" button auto-advances the scrubber, showing the 
   world's relationships forming and dissolving over time

Timeline events: Entities of type 'event' are shown as markers on the 
timeline bar itself, creating reference points.
```

**Implementation note:** This is a Phase 3/4 feature. It requires the temporal 
fields on connections to be populated, which many users won't do initially. The 
scrubber should gracefully handle sparse temporal data (connections without 
time bounds are always visible).

---

## 9. Cascade Audit Mode

**What it does:** The single most powerful revision tool in StellarForge. Select 
any entity and see every downstream consequence through the Environmental Cascade.

**How it works:**
```
1. User right-clicks an entity → "Cascade Audit"
2. System traces all connections downstream through the cascade:
   - From the selected entity, find all connections to entities at the 
     SAME or LATER cascade stage
   - From those entities, continue tracing forward
   - Continue until no more forward connections exist
3. Also traces upstream (back toward physics)
4. Display:

THE CASCADE OF: Keth (Planet, physics stage)

UPSTREAM (what produced Keth):
  ← Star Voss [gravitational formation, physics]

DOWNSTREAM (what Keth produces):
  → Tundra Biome [surface conditions, environment]
    → The Venn [evolved in tundra, biology]
      → Fear of open sky [agoraphobia adaptation, psychology]
        → Sky God worship [sacred canopy narrative, mythology]
          → Architecture taboo: no buildings above 3 stories [culture]
          → The Accord's founding charter [culture]
    → Kari [symbiotic tunnel species, biology]
      → Collective dreaming [shared neural network, psychology]
        → Dream-prophecy tradition [mythology]

CASCADE DEPTH: 6 stages (full cascade achieved)
TOTAL AFFECTED ENTITIES: 9
WIDEST BRANCH: biology → 2 species, 4 downstream paths

"WHAT IF" PROMPT:
"If Keth's atmosphere became oxygen-rich, which of these 9 entities 
 would need to be revised?"
```

**Visualization:**
```
- The cascade chain is highlighted as a tree structure overlaid on the 
  graph (or rendered as a separate tree view)
- Each cascade stage is color-coded per section 2.3
- Animated pulse travels from upstream to downstream, showing causality flow
- Entities outside the cascade chain fade to 0.1 opacity
- The tree can be exported as an image or markdown outline
```

**Why it matters:** This is the Environmental Cascade turned into a revision 
assistant. Change a planet's atmospheric composition and the cascade audit shows 
every entity that needs updating. It is the spec's most philosophically aligned 
feature: the cascade is not just a teaching framework or marketing concept, it 
is an operational tool built into the product's deepest functionality.

---

## 10. UI/UX Design Requirements

### 10.1 Graph Toolbar

```
┌──────────────────────────────────────────────────────────────────┐
│ [🔍 Search] [Auto-Layout] [Cascade Flow] [+Entity] [+Connection]│
│ [Gravity] [Tensions] [Paths] [What-If] [Audit] [Timeline]       │
│                                                                  │
│ [● PHYS] [● ENV] [● BIO] [● PSY] [● MYTH] [● CULT]            │
└──────────────────────────────────────────────────────────────────┘

Toolbar styling:
- Glass morphism: rgba(15,15,16,0.92), backdrop-filter: blur(16px)
- Position: top of graph area, sticky
- Buttons: Space Grotesk, 10px, uppercase, letter-spacing 1.2px
- Active tool: cyan underline indicator
- Tool groups separated by subtle dividers (rgba(255,255,255,0.06))
```

### 10.2 Sidebar Panels

All analytical results display in a slide-out panel on the right side of the 
graph canvas (similar to the Entity Panel in the writing space).

```
Panel styling:
- Width: 320px
- Background: rgba(15,15,16,0.95)
- Border-left: 1px solid rgba(255,255,255,0.06)
- Backdrop-filter: blur(16px)
- Header: Space Grotesk, 12px, uppercase, cyan
- Body: DM Sans, 13-14px, text-muted
- Close button: top-right X, subtle
- Slide-in animation: 300ms ease-out from right
```

### 10.3 Empty States

For new worlds with zero entities:

```
CENTER OF GRAPH CANVAS:

     ◇ ─ ─ ─ ◇
     │         │
     ◇ ─ ─ ─ ◇

YOUR WORLD GRAPH

Create your first entity to begin mapping 
the connections between your world's elements.

[+ Create Entity]

Tip: Start with a planet or star. The Environmental 
Cascade flows from physics through culture.
```

### 10.4 Performance Considerations

```
- Maximum nodes rendered: 500 (soft limit, warn user at 200+)
- Maximum edges rendered: 2000
- Node render optimization: use React Flow's built-in virtualization 
  (only render nodes in viewport)
- Edge render optimization: simplify edge paths when zoomed out 
  (straight lines below 0.3 zoom, curves above)
- Force simulation: run for max 300 ticks, then freeze
- Batch Supabase writes: debounce position saves to every 2 seconds
- Entity search: client-side filter for <200 entities, 
  Supabase full-text for 200+
```

---

## 11. Technical Architecture

### 11.1 Component Hierarchy

```
WorldGraphPage
├── GraphToolbar
│   ├── SearchInput
│   ├── ToolButtons (auto-layout, cascade flow, etc.)
│   ├── AnalysisButtons (gravity, tensions, paths, etc.)
│   └── CascadeFilterBar
├── GraphCanvas (ReactFlow provider)
│   ├── EntityNode (custom node type)
│   ├── CascadeEdge (custom edge type)
│   ├── MiniMap
│   ├── Controls
│   └── Background
├── AnalysisPanel (slide-out right)
│   ├── NarrativeDistancePanel
│   ├── TensionDetectionPanel
│   ├── GravityAnalysisPanel
│   ├── ClusterDiscoveryPanel
│   ├── WhatIfPanel
│   ├── StoryPathPanel
│   ├── CascadeAuditPanel
│   └── TimelinePanel
├── ConnectionModal
├── EntityDetailModal
└── ContextMenu
```

### 11.2 State Management

```
Graph state (React Flow controlled):
- nodes: EntityNode[]       — derived from Supabase entities query
- edges: CascadeEdge[]      — derived from Supabase connections query
- viewport: { x, y, zoom }  — local state

Analysis state (React context or Zustand):
- activeAnalysis: string | null
- selectedEntities: UUID[]  — for path tracing, what-if, etc.
- cascadeFilter: Set<CascadeStage>
- timelinePosition: number | null
- analysisResults: object   — computed results from current analysis

Persistence:
- Entity positions → debounced write to entities.graph_x, graph_y
- Viewport → localStorage (per-world)
- Filter state → localStorage (per-world)
```

### 11.3 Data Flow

```
Supabase → React Query (cache) → Transform → React Flow nodes/edges
                                      ↓
                              d3-force simulation (if auto-layout)
                                      ↓
                              React Flow renders
                                      ↓
                              User drags/edits
                                      ↓
                              Debounced write → Supabase
```

### 11.4 Graph Algorithms (client-side)

```javascript
// All algorithms run client-side on the in-memory node/edge arrays.
// No additional Supabase queries needed for analysis.

// BFS for narrative distance / path finding
function findAllPaths(nodes, edges, sourceId, targetId, maxDepth = 8)

// Triangle detection for tension analysis
function findTensionTriangles(nodes, edges)

// Cascade chain tracing for audit mode
function traceCascade(nodes, edges, entityId, direction = 'downstream')

// Weighted degree centrality for gravity analysis
function computeGravity(nodes, edges)

// Community detection for cluster discovery
function detectClusters(nodes, edges)  // simple modularity-based

// What-if impact analysis
function analyzeRemoval(nodes, edges, entityId)
```

---

## 12. Implementation Phases

### Phase 1: Entity Layer + Basic Graph

**Goal: Entities exist in Supabase. Graph renders nodes. Connections work.**
**Depends on: Nothing. This is the foundation.**

```
Data layer:
- [ ] Create entities table (section 2.1)
- [ ] Create entity_connections table (section 3.1) 
- [ ] Create bidirectional view (section 3.2)
- [ ] Entity CRUD API (create, read, update, delete)
- [ ] Connection CRUD API
- [ ] Migrate any existing world data into entity format

Graph rendering:
- [ ] Install @xyflow/react and d3-force
- [ ] Build EntityNode custom component (section 4.2)
- [ ] Build CascadeEdge custom component (section 4.3)
- [ ] Basic graph rendering: entities as nodes, connections as edges
- [ ] Pan, zoom, minimap working
- [ ] Node dragging with position persistence

Graph interaction:
- [ ] Connection creation flow (section 4.7): drag-from-handle and 
      select-click methods
- [ ] Connection Modal (create/edit)
- [ ] Right-click context menus on nodes and edges
- [ ] Force-directed auto-layout with cascade gravity (section 4.5)
- [ ] Node pinning (section 4.6)
- [ ] Empty state for new worlds
```

### Phase 2: Views + Cascade Graph

**Goal: List view works. Cascade filter and flow layout operational.**
**Depends on: Phase 1 complete.**

```
Views and filtering:
- [ ] Build List View (section 5)
- [ ] Graph/List toggle (same route, view switch)
- [ ] Cascade Filter Bar (section 6.1)
- [ ] Stage filtering: solo, toggle, dim non-matching
- [ ] Cascade Flow Layout mode (section 6.2)
- [ ] Wire left sidebar to entity data (font bump, colors, Tool/Wiki toggle)

Cascade visualization:
- [ ] Cascade Path Highlighting (section 6.3)
- [ ] Entity color picker (popover with swatches)
- [ ] Graph search (filter/highlight entities by name)
- [ ] Style polish: match StellarForge aesthetic exactly
```

### Phase 3: Analytical Tools

**Goal: The graph becomes a thinking tool.**
**Depends on: Phase 1 complete. Phase 2 recommended but not required.**

```
Structural analysis:
- [ ] Gravity Analysis (section 7.3) — node sizing by centrality
- [ ] Orphan detection and warning indicators
- [ ] Gravity sidebar panel with ranked entity list

Pathfinding:
- [ ] Narrative Distance (section 7.1) — BFS pathfinding
- [ ] Story Path Tracing (section 8.2) — template-based annotations
- [ ] Path highlighting in graph

Pattern detection:
- [ ] Tension Detection (section 7.2) — triangle conflict patterns
- [ ] Cluster Discovery (section 7.4) — community detection
- [ ] What-If Removal (section 8.1) — impact analysis
```

### Phase 4: Cascade Audit + Timeline

**Goal: The cascade becomes an operational tool. Timeline enables temporal exploration.**
**Depends on: Phase 1 and Phase 2 complete. Phase 3 recommended.**

```
Cascade audit:
- [ ] Cascade Audit Mode (section 9) — full upstream/downstream tracing
- [ ] Audit panel with cascade tree visualization
- [ ] "What if this changed?" prompts based on cascade depth

Temporal layers:
- [ ] Temporal Layer system (section 8.3) — timeline scrubber
- [ ] Connection time_start/time_end UI in Connection Modal
- [ ] Event markers on timeline
- [ ] Play/animate through world history
- [ ] Performance optimization pass (large graph testing)
```

### Phase 5: Polish + Export

**Goal: Production-ready graph experience.**
**Depends on: Phases 1-4 complete.**

```
- [ ] Graph export: PNG screenshot, SVG vector, JSON data
- [ ] Cascade audit export: markdown outline
- [ ] Keyboard shortcuts (Del to delete, Ctrl+Z undo, Space to pan)
- [ ] Undo/redo for graph operations
- [ ] Onboarding tooltips for first-time graph users
- [ ] Mobile/tablet responsive adjustments
- [ ] Performance audit: test with 200+ entity worlds
```

---

## 13. Pre-Flight Protocol (For Claude Code)

Before touching any existing files, the implementing AI instance MUST:

1. **Read `CLAUDE.md`** — canonical project rules
2. **Read `SIMULATOR_AESTHETIC.md`** — for glass panel/button patterns
3. **Audit Supabase schema** — check for existing tables: `worlds`, 
   `world_entities`, `world_notes`, `world_connections`, `world_graph_nodes`, 
   or similar. Do NOT duplicate. Plan migration if partial tables exist.
4. **Audit existing components** — search codebase for: `WorldGraph`, 
   `WorldConnections`, `GraphView`, `ConnectionsList`, `EntityNode`, 
   `ForceGraph`, `MindMap`, `d3`, `react-flow`, `vis-network`, `cytoscape`, 
   or any existing graph library installation.
5. **Check React Flow version** — if `reactflow` (v11) is installed, migrate 
   to `@xyflow/react` (v12). They are not compatible side-by-side.
6. **Verify routing** — check existing routes for `/worlds/[id]/graph`, 
   `/worlds/[id]/connections`. The new unified system should live at 
   `/worlds/[id]/graph` with a view toggle.
7. **Run `npm run build`** — must pass before and after changes.
8. **Check Tailwind CSS version** — if Tailwind 4, import React Flow styles 
   in global.css after tailwindcss import (per React Flow docs).

---

## Appendix A: Relationship Type Taxonomy

Organized by cascade stage. Users can always create custom types.

### Physics Stage
```
orbits, orbited_by, gravitationally_bound_to, 
binary_companion_of, illuminates, illuminated_by,
tidally_locked_to, in_lagrange_point_of
```

### Environment Stage  
```
located_on, located_in, contains, adjacent_to, 
feeds_into, climate_influenced_by, terrain_of,
resource_source_for, geologically_linked_to
```

### Biology Stage
```
evolved_from, evolved_on, native_to, inhabits,
preys_on, symbiotic_with, parasitic_on,
genetic_ancestor_of, diverged_from, adapted_to,
hosts, pollinated_by, domesticated_by
```

### Psychology Stage
```
fears, desires, perceives, bonded_to,
psychologically_shaped_by, traumatized_by,
inspired_by, cognitively_linked_to,
dreaming_of, memory_of
```

### Mythology Stage
```
worships, sacred_to, taboo_for, mythologizes,
prophesied_by, cursed_by, blessed_by,
origin_myth_of, guardian_of, trickster_of,
named_after, ritually_bound_to
```

### Culture Stage
```
allied_with, enemy_of, trades_with, rules,
serves, member_of, founded_by, colonized_by,
descended_from, speaks, practices, invented,
forbids, celebrates, educates, governs,
competes_with, mentors, employs, exiled_from
```

### Cross-Cascade
```
caused_by, led_to, enabled_by, prevented_by,
preceded, followed, concurrent_with,
created_by, destroyed_by, transformed_by,
references, contradicts, depends_on
```

---

## Appendix B: Cascade Stage Definitions (For Tooltip Help Text)

**Physics:** The fundamental parameters of the universe. Gravity, orbital 
mechanics, stellar radiation, electromagnetic forces. What the universe does 
whether anyone is there to see it or not.

**Environment:** The conditions that emerge from physics on a local scale. 
Atmosphere, climate, terrain, ocean currents, day/night cycles, seasons. 
The stage on which life performs.

**Biology:** Living systems shaped by environmental pressures. Evolution, 
adaptation, sensory apparatus, reproduction, neurology. The bodies that 
must survive.

**Psychology:** The inner experience that emerges from biology. Cognition, 
emotion, perception, fear, desire, memory, dreaming. How it feels to be 
this creature in this body on this world.

**Mythology:** The sacred narratives that emerge from psychology. Religion, 
ritual, origin stories, taboos, symbols, archetypes. How beings make meaning 
from their experience.

**Culture:** The social structures that emerge from everything below. 
Government, economics, art, technology, language, law, architecture, warfare. 
How beings organize their collective life.

---

*The Environmental Cascade: Change one element, and everything else shifts.*

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
