# StellarForge Implementation Guide

**Master Coordination Document**  
February 2026

---

## Document Overview

You have four architecture documents that build on each other. This guide explains the implementation order, dependencies, and provides Claude-ready instructions for each phase.

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: CLAUDE.md                                             │
│  Development Foundation                                         │
│  ↓                                                              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: Tool Inventory Mapping                                │
│  Content Audit & Tagging                                        │
│  ↓                                                              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: Wiki System Architecture                              │
│  Information Structure & Public Pages                           │
│  ↓                                                              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: Getting Started Architecture                          │
│  User Onboarding & Pathways                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

# Phase 1: CLAUDE.md

## Purpose
Establish consistent development standards before building anything else. Every component, page, and feature should follow these conventions.

## Priority
**IMMEDIATE** — Place in project root before any new development.

## Dependencies
None. This is the foundation.

## Implementation Steps

1. **Place file in project root**
   ```bash
   cp CLAUDE.md /path/to/stellarforge-project/CLAUDE.md
   ```

2. **Customize for your actual project structure**
   - Update file paths in "File Structure Conventions" to match your actual directories
   - Verify environment variable names match your `.env` files
   - Add paths to reference implementations (e.g., "See `src/tools/ROGUE/` for canonical simulator")

3. **Create design token file** (if not exists)
   Extract CSS custom properties into a dedicated file that matches the CLAUDE.md color system.

4. **Audit existing components**
   Check that existing code follows these conventions. Flag deviations for refactoring.

## Claude Instructions for Phase 1

```
CONTEXT: You are helping build StellarForge.tools, a science fiction worldbuilding platform. Read CLAUDE.md in the project root for all design and code conventions.

TASK: [Your specific task here]

REQUIREMENTS:
- Follow the color system exactly (especially the 0.08/0.2/1.0 opacity pattern)
- Use correct fonts: MD Nichrome for display H1, Jura for headings, DM Sans for body/buttons, JetBrains Mono for data
- Match the component patterns in CLAUDE.md
- Use TypeScript with explicit types
- Include hover states on all interactive elements

BEFORE WRITING CODE:
1. Read CLAUDE.md thoroughly
2. Check if similar components exist that you should match
3. Confirm you're using the correct color values (not approximations)
```

---

# Phase 2: Tool Inventory Mapping

## Purpose
Audit all existing tools, assign tags, and map relationships before building the wiki UI. You can't organize what you haven't catalogued.

## Priority
**HIGH** — Complete before wiki development begins.

## Dependencies
- CLAUDE.md in place (for consistent terminology)

## Implementation Steps

1. **Verify tool inventory is complete**
   - Cross-reference the document against your actual codebase
   - Add any tools that exist but aren't listed
   - Mark any listed tools that don't exist yet as "Planned"

2. **Create database schema for tool metadata**
   ```sql
   CREATE TABLE tools (
     id UUID PRIMARY KEY,
     slug TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     tagline TEXT,
     description TEXT,
     
     -- Primary tags (exactly one each)
     category TEXT NOT NULL,  -- stars-systems, worlds, life, civilizations, mythology, integration
     complexity TEXT NOT NULL, -- entry, intermediate, advanced
     tool_type TEXT NOT NULL,  -- simulator, calculator, worksheet, generator, reference
     cascade_position TEXT NOT NULL, -- cascade-physics through cascade-meta
     
     -- Metadata
     tier TEXT DEFAULT 'free', -- free, pro
     status TEXT DEFAULT 'live', -- live, beta, planned
     time_estimate TEXT,
     workshop_week INTEGER,
     
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE tool_relationships (
     id UUID PRIMARY KEY,
     source_tool_id UUID REFERENCES tools(id),
     target_tool_id UUID REFERENCES tools(id),
     direction TEXT NOT NULL, -- builds-on, feeds-into
     relationship_type TEXT NOT NULL, -- required, recommended, optional
     note TEXT,
     
     UNIQUE(source_tool_id, target_tool_id, direction)
   );

   CREATE TABLE tool_tags (
     tool_id UUID REFERENCES tools(id),
     tag TEXT NOT NULL,
     PRIMARY KEY (tool_id, tag)
   );
   ```

3. **Populate the database**
   Use the Tool Inventory Mapping document to seed all tool records.

4. **Build admin interface** (optional)
   Create a simple admin UI to manage tool metadata without editing database directly.

## Claude Instructions for Phase 2

```
CONTEXT: You are helping build the tool metadata system for StellarForge.tools. Reference these documents:
- CLAUDE.md (design/code conventions)
- stellarforge-tool-inventory-mapping.md (complete tool registry)

TASK: [Your specific task here - e.g., "Create the database migration for tool metadata"]

TOOL TAGGING RULES:
- Every tool gets exactly ONE tag from each primary category:
  - Category: stars-systems | worlds | life | civilizations | mythology | integration
  - Complexity: entry | intermediate | advanced
  - Type: simulator | calculator | worksheet | generator | reference
  - Cascade: cascade-physics | cascade-environment | cascade-biology | cascade-psychology | cascade-mythology | cascade-culture | cascade-meta

- Relationships have direction (builds-on vs feeds-into) and strength (required/recommended/optional)

VALIDATION:
- Ensure no tool has multiple primary tags in the same category
- Ensure all "builds-on" relationships have corresponding "feeds-into" on the target
- Flag any tools without at least one relationship
```

---

# Phase 3: Wiki System Architecture

## Purpose
Build the information architecture that organizes tools, enables navigation, and supports public world pages.

## Priority
**HIGH** — Core infrastructure for tool discovery and user engagement.

## Dependencies
- CLAUDE.md in place
- Tool Inventory populated in database
- Tool relationships mapped

## Implementation Steps

### 3A: Wiki Tagging UI (1-2 days)

1. **Build Tools page with multiple views**
   - Category View (default): Tools grouped by subject
   - Cascade View: Tools arranged along Physics → Culture flow
   - Complexity View: Entry → Intermediate → Advanced grouping
   - Workshop View: Organized by workshop week

2. **Implement filter controls**
   ```tsx
   <ToolFilters
     categories={['all', 'stars-systems', 'worlds', 'life', ...]}
     complexity={['all', 'entry', 'intermediate', 'advanced']}
     types={['all', 'simulators', 'calculators', 'worksheets', ...]}
     features={['pro-only', 'exportable', 'ai-assisted', 'new']}
   />
   ```

3. **Build Tool Detail page**
   - Header with category badge, complexity indicator, time estimate
   - Cascade position visualization
   - "Builds On" / "Feeds Into" relationship panels
   - Full description and sections
   - Related content links

### 3B: Public World Pages (3-5 days)

1. **Database schema for worlds**
   ```sql
   CREATE TABLE worlds (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     name TEXT NOT NULL,
     slug TEXT NOT NULL,
     description TEXT,
     visibility TEXT DEFAULT 'private', -- private, unlisted, public
     license TEXT DEFAULT 'all-rights-reserved',
     banner_url TEXT,
     
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     published_at TIMESTAMPTZ,
     
     UNIQUE(user_id, slug)
   );

   CREATE TABLE world_sections (
     id UUID PRIMARY KEY,
     world_id UUID REFERENCES worlds(id),
     section_type TEXT NOT NULL, -- planet, species, culture, mythology, etc.
     title TEXT NOT NULL,
     content JSONB NOT NULL,
     visibility TEXT DEFAULT 'private',
     sort_order INTEGER DEFAULT 0,
     
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Build publishing flow**
   - Visibility selector (private/unlisted/public)
   - Content preview before publish
   - Field-level redaction controls
   - License selector

3. **Build public world page**
   - World landing page at `/worlds/[username]/[world-slug]`
   - Section pages at `/worlds/[username]/[world-slug]/[section]`
   - "Built with StellarForge" attribution
   - Share buttons

4. **Build gallery** (Phase 2 in doc, can defer)
   - `/gallery` page with world cards
   - Browse by category, environment type, life type
   - Search functionality
   - Favorites system

## Claude Instructions for Phase 3

```
CONTEXT: You are building the wiki and public pages system for StellarForge.tools. Reference:
- CLAUDE.md (design/code conventions)
- stellarforge-wiki-system-architecture.md (full specification)
- stellarforge-tool-inventory-mapping.md (tool data)

TASK: [Your specific task here]

WIKI NAVIGATION REQUIREMENTS:
- Support 4 view modes: Category, Cascade, Complexity, Workshop
- Each tool card shows: name, tagline, category badge (colored), complexity indicator (○/◐/●), Pro badge if applicable
- Tool detail pages show relationship graph (Builds On / Feeds Into)
- Filter controls persist in URL params for shareability

PUBLIC PAGES REQUIREMENTS:
- Default visibility is ALWAYS private
- Respect granular visibility (world-level, section-level, field-level)
- All public pages include "Built with StellarForge" attribution
- Support Open Graph meta tags for social sharing
- Never expose private/redacted content in any API response

PRIVACY IS PARAMOUNT:
- "Your Worlds Are Yours Alone" is a core principle
- Triple-check that RLS policies prevent data leaks
- Test visibility controls thoroughly before deployment
```

---

# Phase 4: Getting Started Architecture

## Purpose
Create the onboarding experience that helps new users navigate the toolkit and start building worlds.

## Priority
**MEDIUM-HIGH** — Important for conversion, but requires wiki infrastructure first.

## Dependencies
- CLAUDE.md in place
- Tool Inventory populated
- Wiki navigation working
- Tool detail pages built

## Implementation Steps

### 4A: Cascade Tutorial (1 day)

1. **Create `/getting-started` page**
   - Hero section with "Everything Cascades" headline
   - Animated cascade diagram (Physics → Environment → Biology → Psychology → Mythology → Culture)
   - 60-second explanatory copy

2. **Build interactive cascade diagram**
   - Clicking any stage highlights downstream effects
   - Links to tools at each stage

### 4B: Entry Point Router (1-2 days)

1. **Build entry point selector**
   ```tsx
   <EntryPointSelector
     options={[
       { id: 'scratch', label: "I'm starting from scratch", pathway: 'guided-first-world' },
       { id: 'story', label: "I have a story concept and need a setting", pathway: 'story-first' },
       { id: 'species', label: "I have aliens/species and need to ground them", pathway: 'biology-up' },
       { id: 'explore', label: "Just exploring", pathway: 'tool-explorer' },
     ]}
   />
   ```

2. **Implement pathway routing**
   - Store selected pathway in user session/localStorage
   - Show pathway-specific UI hints in tool pages

### 4C: Guided First World Pathway (3-5 days)

1. **Build step-by-step flow**
   - Step 1: Star Builder / Habitable Zone Calculator
   - Step 2: Planetary Parameters (Surface Gravity + Planetary Profile)
   - Step 3: Biome Designer
   - Step 4: Biology Foundations (simplified Biology Worksheet)
   - Step 5: Culture Seed (simplified Cultural Matrix)

2. **Create pathway progress tracker**
   ```tsx
   <PathwayProgress
     steps={['Star', 'Planet', 'Biomes', 'Biology', 'Culture']}
     currentStep={2}
     completedSteps={[0, 1]}
   />
   ```

3. **Build step transition screens**
   - "Cascade Forward" explanations between steps
   - Preview of what the next step will use from current step

4. **Generate completion summary**
   - Compiled world overview from all 5 steps
   - Export options
   - "What's Next" suggestions

### 4D: Other Pathways (2-3 days each, can defer)

- Story-First Worldbuilding pathway
- Biology-Up Worldbuilding pathway
- Tool Explorer mode with "Recommended First" badges

## Claude Instructions for Phase 4

```
CONTEXT: You are building the onboarding and getting started experience for StellarForge.tools. Reference:
- CLAUDE.md (design/code conventions)
- stellarforge-getting-started-architecture.md (full specification)
- stellarforge-tool-inventory-mapping.md (tool relationships)

TASK: [Your specific task here]

ONBOARDING PRINCIPLES:
- The Cascade Tutorial teaches "why" (60 seconds max)
- Entry Points route users based on where their idea currently lives
- Guided pathways reduce blank-page paralysis
- Every pathway should produce something tangible (exportable output)

CASCADE FRAMEWORK:
Physics → Environment → Biology → Psychology → Mythology → Culture
- Always explain what "cascades forward" from each tool
- Show users how their choices constrain/enable what comes next

USER EXPERIENCE:
- Never overwhelm with all 30+ tools at once
- Progressive disclosure: show what's relevant to current pathway
- Clear progress indication in multi-step flows
- Allow users to exit pathways and explore freely at any time
- Remember pathway state across sessions

COPY TONE:
- Second person ("your world", "your species")
- Emphasize causality ("Define X, watch how it shapes Y")
- Scientific but accessible
- Avoid jargon without explanation
```

---

# Implementation Timeline

## Pre-Launch (Now → Beta)

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Phase 1 + 2 | CLAUDE.md in place, tool inventory audited and in database |
| 2 | Phase 3A | Wiki navigation with 4 views, tool detail pages |
| 3 | Phase 4A + 4B | Cascade Tutorial, Entry Point selector |
| 4 | Phase 4C | Guided First World pathway (5 steps) |
| 5 | Polish | Testing, bug fixes, copy refinement |

## Post-Launch

| Phase | Focus | Priority |
|-------|-------|----------|
| 3B | Public World Pages | High (organic marketing) |
| 4D | Additional pathways | Medium |
| 3B+ | Gallery + Discovery | Medium |
| — | Gap tools (Atmosphere Builder, etc.) | Low-Medium |

---

# Quick Reference: File Purposes

| File | Purpose | When to Reference |
|------|---------|-------------------|
| **CLAUDE.md** | Design system, code conventions, component patterns | Every development task |
| **Tool Inventory Mapping** | Complete tool registry with tags and relationships | Building wiki, navigation, pathways |
| **Wiki System Architecture** | Tagging taxonomy, navigation views, public pages spec | Building wiki UI, publishing features |
| **Getting Started Architecture** | Onboarding flows, pathways, tutorial content | Building onboarding experience |

---

# Claude Meta-Instructions

When starting any StellarForge development session, use this prompt structure:

```
I'm working on StellarForge.tools. Please read these documents in order:

1. CLAUDE.md - Design and code conventions (ALWAYS read first)
2. [Relevant architecture doc for current task]

Current task: [Describe what you're building]

Specific requirements:
- [List any specific requirements]

Questions before starting:
- [Any clarifications needed]
```

For complex tasks spanning multiple documents:

```
I'm working on StellarForge.tools. This task spans multiple systems.

Documents to reference:
1. CLAUDE.md - Design conventions
2. stellarforge-tool-inventory-mapping.md - Tool data and relationships
3. stellarforge-wiki-system-architecture.md - Navigation and tagging
4. stellarforge-getting-started-architecture.md - Onboarding flows

Current task: [e.g., "Build the Guided First World pathway step 2: Planetary Parameters"]

This task involves:
- Fetching tool data (Inventory doc)
- Displaying with correct tags/badges (Wiki doc)
- Step progression UI (Getting Started doc)
- All styled per design system (CLAUDE.md)

Please confirm you understand the relationships between these systems before proceeding.
```

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
