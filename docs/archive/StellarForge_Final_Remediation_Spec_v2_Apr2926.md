# StellarForge Remediation Spec — Final (v2)
## Code-Verified + Vision-Aligned, April 2026

**For:** Claude Code / VS Code Implementation
**Author:** Jason D. Batt, Ph.D. — StellarForge.tools
**Prepared by:** Claude (Claude.ai), based on analysis of 100+ source files + vision alignment exercise
**Status:** Ready for implementation

---

## EXECUTIVE SUMMARY

StellarForge is a 563-file platform with sophisticated integration infrastructure that is largely functional. The core worksheet→wiki→entity pipeline works for all 21 tools. Three technical gaps exist, one UX discoverability problem, and one layout inconsistency across all tool pages. This spec addresses all five, informed by Jason's explicit design vision for how the platform should behave.

---

## IMPLEMENTATION ORDER

```
0. Layout Normalization (PREREQUISITE — see separate spec)     4-6 hours
1. UX Discoverability Fixes                                     1-2 hours
2. Cross-Tool Entity Recognition (fuzzy match + link dialog)    6-8 hours
3. Export Format Bugs                                           1-2 hours
4. Simulator/Cartographer Publish to World Bridge               8-12 hours
5. Cascade Guidance System                                      6-8 hours
6. Writing ↔ Entity Linking                                     4-6 hours
7. World Bible Dual Export                                      4-6 hours
8. Guided First-World Experience                                4-6 hours
```

**Total estimated effort:** 38-52 hours across all phases.

---

## PRE-FLIGHT PROTOCOL (MANDATORY)

```
1. Read CLAUDE.md in the repo root
2. Read StellarForge_Layout_Normalization_Spec.md (execute first)
3. Confirm clean build: npm run build
4. Never rewrite working simulators (ROGUE, ExoSky, TIDELOCK, SOLARIS, ExoForge)
5. Never rewrite working components listed in the "DO NOT TOUCH" section
6. Every new Supabase table needs RLS policies
7. After migrations: npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## DESIGN VISION (From Alignment Exercise)

These are Jason's explicit decisions. Do not deviate from them.

### Entity Philosophy
- **Dossier model:** One entity = one wiki page. Multiple tools stack data profiles onto the same page. A planet built with Planetary Profile AND Surface Gravity Calculator shows both data profiles on one wiki page.
- **Single appearance in Codex:** Entities appear once in their primary cascade layer, with a badge showing which other layers have data informing them.
- **Containment nesting:** Entities can live inside other entities (planet inside system inside empire). Author chooses between Free mode (arbitrary nesting, with dialogs warning when movements break established links) or Structured mode (cascade-logical containment rules).
- **User choice always:** The system surfaces connections via dialog, never silently auto-links. The author confirms every link.

### Name Matching
- **Fuzzy matching:** The system catches near-matches (Kepler-442b vs "Kepler 442b" vs "The Planet Kepler-442b"), not just exact matches.
- **Tolerate false positives:** Better to show a dialog for a non-match than to miss a real connection.
- **Dialog, not blocking:** When a match is detected, present a dialog: "ENTITY MATCH DETECTED. Kepler-442b already exists in this world. Link this worksheet to the existing record?" Author can link or create separate.

### Simulators & Cartographer
- **Consistent Publish to World** across all 5 simulators and the Cartographer. Same interaction pattern everywhere.
- **Cartographer publishes selectively:** Checklist of generated content, author picks what becomes canon. System proposes containment hierarchy placement.

### Writing Integration
- **Writing entries link to specific entities**, not just worlds. One integrated system.
- **Write first, suggest after:** Writer writes, then receives entity-linking suggestions based on content analysis. Pre-tagging before writing is available but optional.
- **Knowledge graph is the visualization** of all connections (entities + worksheets + writing entries + simulator output).

### Cascade Guidance (Three Mechanisms)
1. **Downstream suggestions:** Completing a tool suggests the next cascade step. Suggestions have a shelf life so they decay rather than nag.
2. **Progress indicator:** Dashboard shows cascade layer completion status.
3. **Contextual cross-tool callouts:** Tools read upstream data and surface relevant context ("Based on Kepler-442b's 3g gravity, consider how that constrains body plans").

### World Bible Export
- Two structures offered at export time: **cascade-organized** (reads like a textbook) or **entity-centric** (reads like an encyclopedia). Author chooses.

### Onboarding
- **One universal guided experience**, gentle and subtle. No audience-specific branching.
- Dashboard empty state subtly maps the cascade journey: "Start here, then here, then here."

### Voice & Tone
- Ship's computer voice for all new UI, **slightly warmer on decision points**. Headers stay crisp and technical, body text breathes a little.
- Example: "ENTITY MATCH DETECTED. Kepler-442b already exists in this world. Link this worksheet to the existing record?"
- Not: "An entity designated 'Kepler-442b' has been identified within the current world instance."
- Not: "Hey, looks like you already have this planet!"

---

## DO NOT TOUCH — CONFIRMED WORKING FILES

[Same list as v1 — all 24 files verified. See previous spec.]

| File | System |
|------|--------|
| `src/hooks/use-worksheets.ts` | Worksheet CRUD + auto-draft + entity sync |
| `src/hooks/use-wiki-page.ts` | Wiki page fetching, connections, backlinks, dead links |
| `src/hooks/use-world-entities.ts` | Entity CRUD with metadata |
| `src/hooks/use-world-entries.ts` | Entry CRUD (create, update, delete, move) |
| `src/hooks/use-codex-data.ts` | Thin wrapper around getCodexData |
| `src/hooks/use-writing-entries.ts` | Writing workshop CRUD |
| `src/hooks/use-tags.ts` | Tag CRUD with persistence |
| `src/hooks/use-chronicle.ts` | Chronicle CRUD |
| `src/hooks/use-auto-draft-page.ts` | Auto-create draft wiki page hook |
| `src/hooks/use-connection-suggestions.ts` | Wiki link → connection suggestion |
| `src/services/world-data.ts` | Codex aggregator (770 lines, fully functional) |
| `src/services/world-entries.ts` | Entry creation with upsert deduplication |
| `src/services/entity-sync.ts` | Worksheet → entity diff + pending changes |
| `src/services/infoboxTemplates.ts` | Data profile templates for ALL 21 tools |

---

## ISSUE 0: LAYOUT NORMALIZATION (PREREQUISITE)

**See:** `StellarForge_Layout_Normalization_Spec.md` (separate document)

**Summary of inconsistencies found across 19 tool page screenshots:**
- Back link destination varies ("Back to Dashboard" vs "Back to Tools")
- Quote bar only on 3 of 21 tools
- Tool number badge has 4 different states (Tool N, Tool #N, Pro Tool, nothing)
- Timeline has no brand name prefix
- Export button labels are all different
- Quick Export missing from Timeline
- Star System Builder has standalone name input no other tool has
- ECR has unique accordion pattern no other tool uses

**Resolution:** Create `ToolPageLayout.tsx` shared component + `tool-page-config.ts` metadata file. Migrate all 21 tools to identical structure. Execute before all other work.

---

## ISSUE 1: UX DISCOVERABILITY

### Problem
Features that work in code are invisible to users.

### Fixes
- Add 1-line description text below each Quick Access link in CodexQuickAccess.tsx
- Ensure Narrative section auto-expands in Codex when writing entries exist
- Add persistent tip on wiki page view mode: "Enter Edit mode to start writing. Use [[ to link elements."
- Add descriptions distinguishing Knowledge Graph ("Visualize entities and their relationships") from Connections Graph ("Explore worksheet-to-worksheet data flow")

---

## ISSUE 2: CROSS-TOOL ENTITY RECOGNITION

### Problem
Two different worksheets about "Kepler-442b" create two separate wiki pages. No name-based matching exists.

### Design Intent (from vision exercise)
- Fuzzy matching (catches near-matches, not just exact)
- Always surface via dialog, never silent
- Dossier model: linked worksheet data stacks on existing entity wiki page

### Implementation

**New function in `src/services/world-entries.ts`:**

```typescript
export async function findOrCreateDraftWikiPage(
  input: CreateDraftPageInput,
  userId: string
): Promise<{ entry: WorldEntry; linked: boolean }> {
  // Step 1: Existing behavior — check by tool_data_id
  const { data: existingByTool } = await supabase
    .from("world_entries")
    .select("id")
    .eq("world_id", input.worldId)
    .eq("tool_source", input.toolSource)
    .eq("tool_data_id", input.toolDataId)
    .maybeSingle();

  if (existingByTool) {
    // Update title, return existing (current behavior)
    const updated = await updateTitle(existingByTool.id, input.title);
    return { entry: updated, linked: false };
  }

  // Step 2: NEW — fuzzy name match against existing entries
  const candidates = await fuzzyNameMatch(input.worldId, input.title);

  if (candidates.length > 0) {
    // Return candidates — caller shows dialog
    // (actual linking happens after user confirms)
    return { entry: candidates[0], linked: true, candidates };
  }

  // Step 3: No match — create new draft (current behavior)
  const newEntry = await createDraftWikiPage(input, userId);
  return { entry: newEntry, linked: false };
}
```

**New function for fuzzy matching:**

```typescript
async function fuzzyNameMatch(
  worldId: string,
  title: string
): Promise<WorldEntry[]> {
  // Normalize: lowercase, remove common prefixes/articles, collapse whitespace
  const normalized = normalizeEntityName(title);

  const { data: entries } = await supabase
    .from("world_entries")
    .select("*")
    .eq("world_id", worldId);

  return (entries ?? []).filter(entry => {
    const entryNorm = normalizeEntityName(entry.title);
    return (
      entryNorm === normalized ||
      levenshteinDistance(entryNorm, normalized) <= 2 ||
      entryNorm.includes(normalized) ||
      normalized.includes(entryNorm)
    );
  });
}
```

**New dialog component: `EntityMatchDialog.tsx`**

Ship's-computer voice, slightly warm:
```
ENTITY MATCH DETECTED

"Kepler-442b" already exists in this world as a Planet
in the Environment layer.

Link this worksheet to the existing record?
The data profile will be added to the existing wiki page.

[Link to Existing]  [Create Separate Entry]
```

### Dossier Stacking (Wiki Page)

When multiple worksheets link to the same entity, `useWikiPage` already fetches tool data via `tool_data_id`. Extend `WikiPage.tsx` to render multiple data profile infoboxes when the entity has multiple linked worksheets via `entity_worksheets`. Each infobox shows its tool brand name as a header.

---

## ISSUE 3: EXPORT FORMAT BUGS

### Problem
DOCX saves as .txt, JSON saves as text, PDF preview broken.

### Fix
Audit download handlers in:
- `src/components/world/WorldExportDialog.tsx`
- `src/components/world/WorldBibleDialog.tsx`
- `src/components/tools/ExportDialog.tsx`

Set correct MIME types and file extensions.

---

## ISSUE 4: SIMULATOR/CARTOGRAPHER PUBLISH TO WORLD

### Design Intent (from vision exercise)
- Consistent "Publish to World" pattern across all 5 simulators and Cartographer
- Cartographer: checklist of generated content, author picks what to publish, system proposes containment hierarchy
- All simulators: detect whether output is entity-like (ExoForge planet, Solaris system) or attachment-like (ExoSky view, ROGUE event), propose creating new entity or attaching to existing

### Implementation

**PostMessage bridge for simulators:**

Each simulator wrapper in `src/pages/simulators/` adds:
```typescript
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'STELLARFORGE_PUBLISH') {
      // event.data.payload contains structured simulator output
      // Show PublishToWorldDialog with entity-match integration
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

Each simulator HTML adds a "Publish to World" button that posts:
```javascript
window.parent.postMessage({
  type: 'STELLARFORGE_PUBLISH',
  payload: {
    outputType: 'planet', // or 'star_system', 'event', 'observation'
    name: 'Generated Planet Name',
    data: { /* structured output */ }
  }
}, '*');
```

**Cartographer publish:**

New `PublishCartographerDialog.tsx` with:
- Checklist of empires, star systems, trade routes, wormholes
- Each item shows proposed entity type and containment parent
- Author confirms, system creates entities via existing `createEntityEntry` + `entity_worksheets` linking

---

## ISSUE 5: CASCADE GUIDANCE SYSTEM

### Design Intent (from vision exercise)
Three mechanisms, all with a shelf life on suggestions:

1. **Downstream suggestions on tool completion**
2. **Cascade progress indicator on dashboard**
3. **Contextual cross-tool callouts within tools**

### Implementation

**Downstream suggestions:**
After worksheet save, check what cascade layers have no data yet. If the next downstream layer is empty, show a suggestion toast with a shelf life (dismiss persists for 7 days per tool via `useHintDismissed` pattern).

**Progress indicator:**
Add cascade layer badges to the World Dashboard header. Each badge shows filled/empty/partial using the existing `determineCompletionStatus` from `world-data.ts`.

**Cross-tool callouts:**
When a tool page loads, query upstream worksheet data and surface 1-2 relevant contextual notes. Example: Evolutionary Biology reads planetary-profile data for gravity and atmosphere, displays: "Your planet has 3g surface gravity. Consider how this constrains body plans and locomotion." Data comes from `useWorksheetsByType` which already exists.

---

## ISSUE 6: WRITING ↔ ENTITY LINKING

### Design Intent (from vision exercise)
- Writing entries link to specific entities, not just worlds
- Write first, get entity-linking suggestions after
- Pre-tagging available but optional

### Implementation

**New junction table:** `writing_entry_entities` (writing_entry_id, entity_id)

**Post-write suggestion:**
After a writing entry is saved, extract entity names from the text content (simple substring matching against existing world_entries titles in the same world). If matches found, show a suggestion bar: "This entry mentions Kepler-442b and Voss. Link to these entities?"

**Pre-tag option:**
Add an optional "Entities" field to the writing entry metadata panel (alongside the existing World dropdown). Uses the existing entity picker pattern.

---

## ISSUE 7: WORLD BIBLE DUAL EXPORT

### Design Intent
Two structures at export time: cascade-organized or entity-centric.

### Implementation
Extend `WorldBibleDialog.tsx` with a format toggle. Both formats use the same underlying data from `getCodexData` but organize it differently:
- **Cascade:** Chapters are Environment, Biology, Psychology, Culture, Mythology, Technology, Narrative. Each chapter contains all entities in that layer.
- **Entity:** Chapters are one per major entity, with all tool data, wiki content, connections, and writing entries compiled per entity.

---

## ISSUE 8: GUIDED FIRST-WORLD EXPERIENCE

### Design Intent
Universal, gentle, subtle. Cascade path implied, not enforced.

### Implementation
When a world has zero worksheets and zero entries, the dashboard shows a guided empty state:
- Cascade layers displayed as a vertical path with labels
- First layer highlighted: "Begin with the physics of your world"
- Suggested first tool with a prominent "Start Here" button
- Subsequent layers shown dimmed with "Then explore..." labels
- Entire guide dismissable and never reappears once any content is created

---

## PHASE 0 VERIFICATION COMMANDS

```bash
# Verify auto-draft pipeline
grep -n "createDraftWikiPage" src/hooks/use-worksheets.ts

# Verify entity sync
grep -n "syncWorksheetToEntity" src/hooks/use-worksheets.ts

# Verify writing entries in codex
grep -n "writing_entries" src/services/world-data.ts

# Verify infobox coverage
grep -c "\":" src/services/infoboxTemplates.ts

# Verify deduplication
grep -n "maybeSingle" src/services/world-entries.ts

# Find export dialogs
find src -name "*Export*" -o -name "*Bible*" | grep -i dialog

# Confirm simulators are iframes
grep -rn "iframe\|src=" src/pages/simulators/ --include="*.tsx" | head -10

# Confirm Cartographer is separate
ls cartographers/stellar_cartographer/src/

# Clean build
npm run build
```

---

## AESTHETIC COMPLIANCE

All new UI must follow CLAUDE.md and the design system:

- Void: `#0A0E17` | Surface: `#0E1320` | Elevated: `#161C2B`
- Primary: `--sf-teal: #15C17B` (solid) | `--sf-teal-bright: #3DFFCD` (glow only)
- Fonts: MD Nichrome (display titles only) | Jura (headings, nav) | DM Sans (body, ALL buttons) | JetBrains Mono (data only)
- Zero border-radius on primary containers
- Simulator legacy aesthetic: cyan `#00D4FF`, deeper black `#09090B`
- Dialog voice: Ship's computer, slightly warmer on decision points
- Category accent colors: Stars & Systems = Amber, Worlds = Azure, Life = Emerald, Civilizations = Violet, Mythology = Stellar blue, Integration = Teal

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
