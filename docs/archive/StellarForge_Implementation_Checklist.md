# StellarForge Implementation Checklist & Verification Guide

**Date:** April 4, 2026  
**Author:** Jason D. Batt, Ph.D. / Claude (Planning)  
**Purpose:** Gap analysis, implementation instructions, and owner verification list

---

## Gap Analysis: Original Request vs. What Was Specced

| # | Original Concern | Specced? | Where | Gap? |
|---|---|---|---|---|
| 1 | World Notes resizable via drag on bottom right | ✓ | Writing System Spec §1.1 | None |
| 2 | Dedicated writing space with pullout left world panel | ✓ | Writing System Spec §5 | None |
| 3 | Bump up fonts on left world column (1-2 pts) | ✓ | Writing System Spec §1.2 | None |
| 4 | World Graph has no node connecting | ✓ | Graph Spec §4 | None |
| 5 | World Connections: clicking icons navigates away | ✓ | Graph Spec §4-5 | None |
| 6 | World Connections: no logic, no functionality | ✓ | Graph Spec §4-5 | None |
| 7 | Graph and Connections should be same thing, different views | ✓ | Graph Spec §4-5 | None |
| 8 | Tool/Wiki dropdown does nothing | ✓ | Writing System Spec §1.3 | None |
| 9 | Drag and drop in left column doesn't work | ✓ | Writing System Spec §1.4 | None |
| 10 | Color coding not changeable | ✓ | Writing System Spec §1.5 | None |
| 11 | Robust plan for writing functionality | ✓ | Writing System + Unified Editor Specs | None |
| 12 | Consider ProseMirror, BlockNote, Tiptap, TinyMCE | ✓ | Writing System Spec §4 | None |
| **13** | **Mind map tool improvements** | **NO** | **Not addressed** | **MISSING** |
| **14** | **@ mentions working in every writing window** | **Partial** | **Added in Unified Editor Spec** | **Was missing from original specs** |
| **15** | **Version number in menu bar** | **NO** | **Not addressed** | **MISSING** |

**Gaps identified: 3 items.** The mind map tool was never addressed. The @ mention 
consistency was raised later and specced separately. Version numbering was not addressed.

---

## Mind Map Tool: Diagnosis and Fix

### Current State

The mind map tool exists as a disconnected feature. Based on the known broken 
integrations list, it does not read from or write to any shared data model. It 
likely renders a static or manually-created tree structure with no connection to 
the entity layer.

### The Fix: Mind Map = Entity Hierarchy View

The mind map should not be a standalone tool. It is a **view of the entity data**, 
specifically the parent-child hierarchy defined by `entities.parent_entity_id`.

Every entity can have a parent entity. A planet's parent might be a star. A 
species' parent might be a planet. A faction's parent might be a species. This 
hierarchy is the mind map.

### Implementation

```
Data source: entities table, using parent_entity_id for hierarchy
Root nodes: entities where parent_entity_id IS NULL
Children: entities where parent_entity_id = [selected entity id]

Rendering: 
- Use the same @xyflow/react library as the World Graph
- OR use a dedicated tree layout library (d3-hierarchy, react-organizational-chart)
- Nodes styled identically to World Graph EntityNode component
- Edges are straight or curved lines indicating parent-child relationship
- Color-coded by entity type or cascade stage (matching Graph)

Interactions:
- Expand/collapse branches (click node to toggle children)
- Drag a node onto another node → changes parent_entity_id (reparenting)
- Right-click → create child entity, edit, delete
- Click node → opens entity detail (same as Graph node click)
- "Add Child" button on each node → create entity modal with 
  parent_entity_id pre-filled

Auto-layout:
- Horizontal tree (root at left, branches flow right) — default
- Vertical tree (root at top, branches flow down) — toggle option
- Radial tree (root at center, branches radiate outward) — toggle option
```

### Relationship to World Graph

The mind map and the world graph are complementary views of the same data:

```
World Graph  = entities + entity_connections (relationship network)
Mind Map     = entities + parent_entity_id (hierarchical tree)
List View    = entities + entity_connections (structured table)
```

All three should be tabs or toggle views on the same page, reading from the 
same Supabase data. A change in any view is immediately reflected in the others.

### Navigation

```
Route: /worlds/[id]/graph   — with view toggle: [Graph] [Tree] [List]

The toggle replaces the current separate World Graph and World Connections 
routes. Mind map becomes the "Tree" view.
```

---

## Version Number Display

### Implementation

Add a version number to the app's navigation header, positioned below or 
beside the STELLARFORGE wordmark.

```
Visual placement:
┌──────────────────────────────────────────────┐
│ ◇ STELLARFORGE                    [nav items]│
│   v0.5967                                    │
└──────────────────────────────────────────────┘

Styling:
- Font: DM Sans, 10px, weight 300
- Color: rgba(255, 255, 255, 0.2) — very muted, not attention-grabbing
- Letter-spacing: 0.5px
- Position: directly below the logo/wordmark, left-aligned with it
- Click behavior: none (or optional: links to changelog page)
```

### Where to Store the Version

Create a version constant in the codebase:

```typescript
// src/config/version.ts
export const APP_VERSION = '0.5967';

// Usage in NavBar component:
import { APP_VERSION } from '@/config/version';
// render: <span className="sf-version">v{APP_VERSION}</span>
```

### StellarForge Versioning Procedure

StellarForge uses a modified pre-1.0 versioning scheme. The format is:

```
0.XXXX

Where:
- 0 = pre-release (StellarForge is not yet at 1.0)
- XXXX = a four-digit build number that increments with each deployment

Current version: 0.5967
```

**Incrementing rules:**

```
Bug fix or minor UI tweak:          +1    (0.5967 → 0.5968)
Small feature addition:             +1-5  (0.5968 → 0.5973)
Significant feature (new tool):     +10   (0.5973 → 0.5983)
Major system (entity layer, editor): +25-50 (0.5983 → 0.6033)
```

**Milestones toward 1.0:**

```
0.60xx  Entity layer operational
0.65xx  World Graph with cascade features
0.70xx  Unified editor deployed across all surfaces
0.75xx  Dedicated writing space functional
0.80xx  Export pipeline (World Bible PDF)
0.85xx  Share system operational
0.90xx  All simulators integrated and stable
0.95xx  Public beta polish pass
1.0000  Public launch
```

**When you deploy, update the version:**

```
1. Open src/config/version.ts
2. Increment APP_VERSION according to the rules above
3. Add a line to CHANGELOG.md:
   
   ## 0.5968
   - Fixed: World Notes resize handle
   - Fixed: Left sidebar font sizes increased 2px
   
4. Commit with message: "release: v0.5968"
5. Deploy
```

This procedure is deliberately simple. No automated tooling needed at this 
stage. When you approach 1.0, you can adopt formal SemVer (1.0.0, 1.1.0, etc.) 
with automated releases.

---

## Complete Implementation Instructions (For Claude Code)

These are ordered by dependency. Do not skip ahead.

### Step 0: Pre-Flight

```
- [ ] Read CLAUDE.md
- [ ] Read SIMULATOR_AESTHETIC.md
- [ ] Run: npm run build (must pass clean)
- [ ] Run: supabase db dump (or inspect schema via dashboard)
- [ ] Search codebase for: textarea, contentEditable, WorldGraph, 
      WorldConnections, MindMap, ForceGraph, d3, react-flow, 
      vis-network, cytoscape, quill, draft-js, slate
- [ ] Document findings in a pre-flight report before touching any files
```

### Step 1: Version Number

```
- [ ] Create src/config/version.ts with APP_VERSION = '0.5967'
- [ ] Add version display to NavBar component
- [ ] Style: DM Sans, 10px, weight 300, rgba(255,255,255,0.2)
- [ ] Position: below STELLARFORGE wordmark
- [ ] Create CHANGELOG.md at project root
```

### Step 2: Quick Bug Fixes (increment to 0.5968-0.5972)

```
- [ ] World Notes: add resize handle (bottom-right drag grip)
      CSS resize: vertical, min-height 200px, max-height 80vh
      Persist preferred height to localStorage
      
- [ ] Left sidebar font bump:
      Category labels: current → +2px
      Entity names: current → +2px  
      Section headers: current → +2px
      DO NOT change simulator panel fonts
      
- [ ] Tool/Wiki dropdown: wire onChange handler to state
      If wiki view doesn't exist: REMOVE the dropdown entirely
      Do not ship non-functional UI
      
- [ ] World Connections: remove navigate-on-click behavior
      Clicking an entity icon should SELECT it (highlight), not navigate
      
- [ ] World Graph: verify nodes can be dragged/repositioned
      If not: add basic drag support (even before full rebuild)
```

### Step 3: Entity Layer (increment to 0.5985)

```
- [ ] Create entities table in Supabase (per Graph Spec §2.1)
- [ ] Create entity_connections table (per Graph Spec §3.1)
- [ ] Create bidirectional view (per Graph Spec §3.2)
- [ ] Set up RLS policies on both tables
- [ ] Build entity CRUD API endpoints
- [ ] Build connection CRUD API endpoints
- [ ] Migrate any existing world data into entity format
- [ ] Test: create, read, update, delete entities via API
- [ ] Test: create connections between entities via API
```

### Step 4: Unified Editor Component (increment to 0.6010)

```
- [ ] Install all Tiptap packages (per Unified Editor Spec)
- [ ] Build <StellarForgeEditor /> component with three presets
- [ ] Build EntityMention extension (queries entities table)
- [ ] Build MentionSuggestionList component (floating panel)
- [ ] Build editor toolbar component (full and rich variants)
- [ ] Build resize handle for rich/compact presets
- [ ] Build auto-save hook (debounced and on-blur variants)
- [ ] Style all editor CSS (per Unified Editor Spec styling section)
- [ ] AUDIT: find every <textarea> in codebase
- [ ] REPLACE: World Notes textarea → StellarForgeEditor preset="rich"
- [ ] REPLACE: Entity Description textarea → StellarForgeEditor preset="rich"
- [ ] REPLACE: Entity Notes textarea → StellarForgeEditor preset="rich"
- [ ] REPLACE: Connection Notes → StellarForgeEditor preset="compact"
- [ ] REPLACE: any other identified textareas
- [ ] MIGRATE: existing plain-text content → Tiptap JSON
- [ ] Test: type @ in World Notes, see entity suggestions
- [ ] Test: type @ in Entity Description, see entity suggestions
- [ ] Test: type @ in Connection Notes, see entity suggestions
- [ ] Test: rich formatting (bold, italic, lists) works in all presets
- [ ] Test: content created in rich preset displays correctly in compact
```

### Step 5: World Graph Rebuild (increment to 0.6050)

```
- [ ] Install @xyflow/react and d3-force
- [ ] Build EntityNode custom component
- [ ] Build CascadeEdge custom component
- [ ] Build graph canvas with pan, zoom, minimap
- [ ] Build connection creation flow (drag-from-handle + click-click)
- [ ] Build connection modal (create/edit)
- [ ] Build right-click context menus
- [ ] Build force-directed auto-layout with cascade gravity
- [ ] Build node pinning (save positions to Supabase)
- [ ] Build Cascade Filter Bar (6 stage toggles)
- [ ] Build Cascade Flow Layout mode
- [ ] Build List View (structured relationship browser)
- [ ] Build view toggle: [Graph] [Tree] [List]
- [ ] Remove old World Graph component
- [ ] Remove old World Connections component
- [ ] Route: /worlds/[id]/graph serves unified view
```

### Step 6: Mind Map / Tree View (increment to 0.6060)

```
- [ ] Build Tree View using entity parent_entity_id hierarchy
- [ ] Use @xyflow/react or d3-hierarchy for tree layout
- [ ] Node styling matches EntityNode from Graph View
- [ ] Expand/collapse branches on click
- [ ] Drag node onto another node → reparent (update parent_entity_id)
- [ ] Right-click → create child, edit, delete
- [ ] Layout toggle: horizontal tree / vertical tree / radial
- [ ] Wire into the [Graph] [Tree] [List] view toggle
- [ ] Remove old Mind Map component entirely
```

### Step 7: Entity-Powered Sidebar (increment to 0.6075)

```
- [ ] Rebuild left sidebar to render from entities query
- [ ] Group entities by entity_type
- [ ] Implement drag-and-drop reordering (dnd-kit → sort_order)
- [ ] Implement entity color picker (accent swatches + custom hex)
- [ ] Wire Tool/Wiki dropdown:
      Tool view = entities grouped by cascade stage
      Wiki view = entities alphabetical, searchable
- [ ] Entity CRUD from sidebar: create, edit, delete via modal
- [ ] Click entity in sidebar → navigate to entity detail or 
      insert @mention (context-dependent)
```

### Step 8: Dedicated Writing Space (increment to 0.6100)

```
- [ ] Build /worlds/[id]/write route
- [ ] Layout: collapsible sidebar + StellarForgeEditor preset="full"
- [ ] Sidebar shows entities from active world (click to insert mention)
- [ ] Entity Panel: slide-out right panel showing entity detail on 
      mention hover/click
- [ ] Focus Mode: toggle hides sidebar, dims toolbar, centers text
- [ ] Word count display in footer
- [ ] Document management: create, list, rename, delete documents
- [ ] Version history: snapshot on manual save / every 5 minutes
```

---

## Owner Verification Checklist

Jason, use this list to personally verify each item after implementation. 
Check each one in the running app.

### Quick Fixes
```
□ Open a world → World Notes → drag bottom-right corner → panel resizes
□ Left sidebar text is visibly larger than before (not straining to read)
□ Tool/Wiki dropdown either changes the sidebar view OR has been removed
□ World Connections: click an entity icon → it highlights, does NOT navigate away
□ World Graph: nodes can be dragged to new positions on the canvas
```

### Entity System
```
□ Can create a new entity (planet, species, character, etc.) from the sidebar
□ Can edit an entity's name, type, description, color
□ Can delete an entity
□ Entities persist after page refresh
□ Entity color dot in sidebar matches the color you set
□ Can drag entities in sidebar to reorder them
```

### Editor & Mentions (test in EVERY surface)
```
□ World Notes: type @ → see entity suggestion dropdown → select → chip inserted
□ Entity Description: type @ → suggestion dropdown → chip inserted
□ Entity Notes: type @ → suggestion dropdown → chip inserted  
□ Connection Notes: type @ → suggestion dropdown → chip inserted
□ World Notes: bold text with Ctrl+B → text is bold
□ World Notes: drag resize handle → editor area grows/shrinks
□ Mention chip: hover → shows entity summary tooltip
□ Mention chip: click → opens entity detail or navigates
□ Content with mentions created in World Notes renders correctly when 
  viewed elsewhere (mentions not broken, formatting preserved)
```

### World Graph
```
□ Entities from your world appear as nodes on the graph canvas
□ Can pan the graph (click and drag background)
□ Can zoom in/out (scroll wheel or controls)
□ Minimap visible in corner
□ Drag a connection from one node to another → connection modal opens
□ Fill out connection modal → edge appears between nodes
□ Edge is color-coded by cascade stage
□ Click an edge → can edit or delete the connection
□ Cascade Filter Bar: click "Biology" → only biology-stage edges visible, 
  unrelated nodes fade
□ Cascade Flow Layout: nodes arrange into physics→culture columns
□ Right-click a node → context menu appears (edit, delete, connect)
□ Node positions persist after page refresh (pinning works)
```

### Tree / Mind Map View
```
□ Toggle to Tree view from Graph view → see entity hierarchy
□ Entities with children show expandable branches
□ Can collapse/expand branches by clicking
□ Drag a node onto another node → it becomes a child of that node
□ Right-click a node → "Add Child Entity" option works
□ Tree layout is readable (not overlapping)
```

### List View
```
□ Toggle to List view → entities listed with their connections
□ Click entity name → expands to show connections
□ Click connection → can edit it
□ Filter by cascade stage works
□ Filter by entity type works
```

### Writing Space
```
□ Navigate to /worlds/[id]/write → writing space loads
□ Left sidebar shows world entities
□ Click entity in sidebar → @mention inserted at cursor in editor
□ Full toolbar visible (bold, italic, headings, lists, etc.)
□ Type @ in editor → entity suggestions appear
□ Focus Mode toggle → sidebar hides, toolbar dims, text centers
□ Word count updates as you type
□ Content auto-saves (type, wait 3 seconds, refresh → content preserved)
□ Can create multiple documents within a world
```

### Version Number
```
□ Version number visible in navigation bar below STELLARFORGE
□ Displays v0.XXXX (current version number)
□ Text is muted (not distracting, but readable on inspection)
```

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
