# StellarForge Implementation Memory

> **Purpose**: Persistent context file for maintaining continuity across Claude Code sessions. Read this first when resuming work.

## Last Updated
2026-01-29

---

## Completed Phases

| Phase | Description | Key Commits | Date |
|-------|-------------|-------------|------|
| 1-6 | Core Tools & Architecture | Various | Pre-2026 |
| 7 | UI/UX Consistency & Bug Fixes | Multiple | 2026-01 |
| 9 | StellarForge Design System Overhaul | 8b89414 | 2026-01 |
| 10 | Marketing Showcase Page (`/features`) | 5eef549 | 2026-01 |
| 11 | Background Fix, Tool Visualizations, Text Contrast | dfb2919 | 2026-01 |
| 12 | World Interconnections System | 69c1c58 | 2026-01-29 |
| 8 | Export Expansion (Text, Word) | TBD | 2026-01-29 |

---

## Current State

### Phase 8 Features (Just Completed)
- **Plain Text Export**: `src/lib/text/` - ASCII formatted output
- **Word Export**: `src/lib/docx/` - Editable .docx documents
- **Updated ExportDialog**: Tabbed interface for PDF/Text/Word/JSON

### Background Fix (Just Completed)
- **BackgroundProvider**: `src/components/providers/BackgroundProvider.tsx`
- Background now applied at app level, works on all pages
- Removed redundant `useBackground()` calls from 15+ pages

### Phase 12 Features (Committed Earlier)
- **Species Naming**: `speciesName` field in EvoBio tool
- **Field Mappings**: EvoBio → Xenomyth auto-population (`src/lib/field-mappings/`)
- **Species Link Modal**: Select and import species data in Xenomythology
- **World Connections Page**: `/worlds/:worldId/connections` with d3-force graph
- **Drake Context**: Suggestions based on N value and species count
- **Graph Components**: `src/components/connections/` directory

### Future Considerations
- **Notion Integration**: Would require OAuth flow, complex to implement

---

## Architecture Quick Reference

### Tool Colors (for graphs)
```typescript
const TOOL_COLORS = {
  "planetary-profile": "cyan",
  "evolutionary-biology": "emerald",
  "xenomythology-framework-builder": "violet",
  "environmental-chain-reaction": "magenta",
  "spacecraft-designer": "azure",
  "propulsion-consequences-map": "amber",
  "drake-equation-calculator": "crimson",
};
```

### Cascading Interdependence
```
Drake Equation (context)
       ↓
Planetary Profile → ECR, EvoBio, Xenomyth, Spacecraft
       ↓
     EvoBio → Xenomyth
       ↓
    Xenomyth (terminal)
```

### Key Hooks
| Hook | Purpose | File |
|------|---------|------|
| `useWorksheets` | CRUD for worksheets | `src/hooks/use-worksheets.ts` |
| `useWorksheetsByType` | Filter by tool type | `src/hooks/use-worksheets.ts` |
| `useWorldGraph` | Build graph nodes/edges | `src/hooks/use-world-graph.ts` |
| `useDrakeContext` | N value & suggestions | `src/hooks/use-drake-context.ts` |
| `useBackground` | Background selector | `src/hooks/use-background.tsx` |

### Key Components
| Component | Purpose | Location |
|-----------|---------|----------|
| `WorksheetLinkSelector` | Link worksheets with data sync | `src/components/tools/` |
| `SpeciesLinkModal` | EvoBio → Xenomyth linking | `src/components/tools/` |
| `WorldConnectionsGraph` | D3-force SVG visualization | `src/components/connections/` |
| `GlassPanel` | StellarForge card component | `src/components/ui/` |
| `CollapsibleSection` | Tool section container | Inline in each tool |

### Database Schema (worksheets table)
```sql
worksheets (
  id UUID PRIMARY KEY,
  world_id UUID NOT NULL,      -- FK to worlds
  user_id UUID NOT NULL,       -- FK to profiles
  tool_type TEXT NOT NULL,     -- e.g., "planetary-profile"
  title TEXT,                  -- User-provided name
  data JSONB NOT NULL,         -- Tool-specific form state
  created_at, updated_at
)
```

### _linkedWorksheets Pattern
Tools store cross-references in their `data` field:
```typescript
data: {
  // ... tool-specific fields ...
  _linkedWorksheets?: {
    planet?: { worksheetId, syncedAt, syncedData },
    species?: { worksheetId, syncedAt, syncedData },
    ecr?: { worksheetId, syncedAt, syncedData },
  }
}
```

---

## File Locations

### Config & Data
- `src/lib/worksheet-links-config.ts` - Link definitions & syncFields
- `src/lib/field-mappings/` - Transform functions for cross-tool data
- `src/lib/evolutionary-biology-data.ts` - EvoBio dropdown options
- `src/lib/STELLARFORGE-DESIGN-SYSTEM.md` - Design guidelines

### Tool Pages
- `src/pages/tools/EvolutionaryBiology.tsx` (~2500 lines)
- `src/pages/tools/XenomythologyFrameworkBuilder.tsx`
- `src/pages/tools/PlanetaryProfile.tsx`
- `src/pages/tools/DrakeEquationCalculator.tsx`
- `src/pages/tools/SpacecraftDesigner.tsx`
- `src/pages/tools/PropulsionConsequencesMap.tsx`
- `src/pages/tools/EnvironmentalChainReaction.tsx`

### Graph Visualization
- `src/pages/WorldConnections.tsx` - Main page
- `src/components/connections/` - Graph components
- `src/hooks/use-world-graph.ts` - Data extraction
- `src/hooks/use-drake-context.ts` - Drake integration

---

## Resume Instructions

### Starting a New Session
1. Read this file first
2. Check `git status` for any uncommitted work
3. Check the plan file at `.claude/plans/whimsical-bouncing-metcalfe.md`
4. Run `npm run build` to verify current state

### Common Tasks
- **Add new tool interconnection**: Update `worksheet-links-config.ts`, create field mapping if needed
- **Modify graph visualization**: Edit components in `src/components/connections/`
- **Update design system**: Reference `src/lib/STELLARFORGE-DESIGN-SYSTEM.md`
- **Add export format**: Create in `src/lib/` (pdf/, docx/, text/)

### Known Issues / TODOs
- Background selector: Some tools may still have conflicts (check `useBackground()` calls)
- Screenshots needed for Features page (`public/screenshots/`)
- Phase 8 Export Expansion not started

---

## Recent Git History
```
69c1c58 Implement World Interconnections System (Phase 12)
e8b4495 Add tool screenshots for Features page
dfb2919 Fix background selector, improve text contrast, align Features mockups
5eef549 Add Marketing Showcase Page with animated tool mockups
8b89414 Implement StellarForge Design System overhaul
```

---

## Contact / Attribution
- **Project**: StellarForge Cosmos Builders Toolkit
- **Author**: Jason D. Batt, Ph.D.
- **Website**: jbatt.com
