# StellarForge Worksheet Layout Normalization Spec

**For:** Claude Code / VS Code Implementation
**Priority:** Execute BEFORE all other remediation work
**Scope:** All 21 worksheet tool pages in `src/pages/tools/`

---

## WHY THIS COMES FIRST

Every feature in the remediation spec (entity-match dialogs, cascade suggestions, Publish to World) adds new UI elements to tool pages. If the underlying layout is inconsistent, every new feature compounds the problem. Normalize first, build on top of a stable frame.

---

## INCONSISTENCIES IDENTIFIED (Visual Audit)

### 1. Back Link Destination
- **Current:** Most say "← Back to Dashboard", some say "← Back to Tools"
- **Fix:** Context-aware. If accessed from within a world (`/worlds/:worldId/tools/:toolName`), show "← Back to Dashboard". If accessed from standalone tools index (`/tools/:toolName`), show "← Back to Tools". Logic-based, never hardcoded.

### 2. Quote Bar
- **Current:** Only 3 tools (Genesis, Phylo, Vessel) have the SF quote bar with attribution + Amazon/Bookshop links
- **Fix:** All 21 tools get a quote bar. Togglable via a small dismiss/expand control. Quote data lives in `src/lib/tool-intros.ts` (or a new `src/lib/tool-quotes.ts` if needed). Each tool gets 1 curated quote. Dismissed state persists via the existing `useHintDismissed` pattern with a key like `tool-quote-{toolType}`.

### 3. Tool Number Badge
- **Current:** Three different states: "Tool 4" (green pill), "Tool #3" (with hash), "Pro Tool" (gray pill), or nothing at all
- **Fix:** Remove all "Tool N" / "Tool #N" numbering entirely. Replace with a small inline Pro indicator for Pro tools only. Implementation: a small `PRO` text badge (JetBrains Mono, 9px, teal at 40% opacity) positioned inline after the tool brand name in the title. Free tools show nothing. No separate pill element taking its own line.

### 4. Title Format
- **Current:** Most follow "BrandName: Full Tool Name" but Timeline has no brand prefix
- **Fix:** Every tool uses the format: `[Icon] BrandName: Full Tool Name`. All tools must have a brand name defined. Timeline needs one assigned (e.g., "Chronolog: Timeline" or whatever Jason designates). Font: MD Nichrome, weight 300. Icon: 32px tool icon from existing icon set, vertically centered with title.

### 5. Subtitle
- **Current:** Varies from 1 to 3 lines, inconsistent line count
- **Fix:** Max 2 lines. DM Sans, standard body text opacity. If the current description exceeds 2 lines, shorten it. The intro panel below provides the full explanation.

### 6. Export Button Label
- **Current:** Wild inconsistency: "Export", "Export Profile", "Export Expansion Model", "Export Framework", "Export Declaration", "Export Spacecraft", "Export Worksheet", "Export Timeline"
- **Fix:** Standardize to "Export [BrandName]" for all tools. Examples: "Export Genesis", "Export Phylo", "Export Dominion", "Export Paradigm", "Export Axiom". This is short, consistent, and uses the brand vocabulary the user already sees in the title. The third button in the action bar always follows this pattern.

### 7. Quick Export Button
- **Current:** Missing from Timeline
- **Fix:** Present on all 21 tools, no exceptions.

### 8. Standalone Name Input
- **Current:** Star System Builder has a "SYSTEM NAME" input above the intro panel, no other tool does this
- **Fix:** Remove the standalone name input. The name field belongs inside the first CollapsibleSection, same as every other tool. The worksheet title (set via Save Draft or rename) serves as the display name in the Codex.

### 9. Intro Panel Structure
- **Current:** Most tools follow a consistent pattern but ECR (Cascade) uses a unique accordion pattern with expandable world case studies
- **Fix:** All tools use identical intro panel structure (see Canonical Layout below). ECR's accordion content moves into a standard "SF EXAMPLES" subsection within the intro panel, not a custom accordion.

### 10. Action Bar
- **Current:** All tools show roughly the same buttons but with label inconsistencies
- **Fix:** Exact same 6 buttons on every tool, in this order:
  1. Save Draft (with sync icon)
  2. Print / PDF
  3. Export [BrandName]
  4. Quick Export
  5. Notes
  6. Moodboard

---

## CANONICAL LAYOUT (Top to Bottom)

Every worksheet tool page must follow this exact structure. No variations.

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard / Back to Tools (context-aware)         │
├─────────────────────────────────────────────────────────────┤
│ [Quote Bar - togglable]                                      │
│ "Quote text here."                                           │
│  Author — Title | Amazon  Bookshop                           │
├─────────────────────────────────────────────────────────────┤
│ [Save Draft] [Print/PDF] [Export BrandName] [Quick Export]   │
│ [Notes] [Moodboard]                                          │
├─────────────────────────────────────────────────────────────┤
│ [Icon] BrandName: Full Tool Name  PRO (tiny, inline, if pro) │
│ 1-2 line description in DM Sans                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Intro Panel (glass panel) ────────────────────────────┐  │
│ │ EVOCATIVE TITLE (green, uppercase, Jura)               │  │
│ │                                                         │  │
│ │ 1-line tool description (DM Sans)                       │  │
│ │                                                         │  │
│ │ IN PUBLISHED SCIENCE FICTION                             │  │
│ │                                                         │  │
│ │ Book Title by Author (Year)                             │  │
│ │   "Optional quote" (blockquote)                         │  │
│ │ 2-3 sentence analysis paragraph                         │  │
│ │                                                         │  │
│ │ Book Title by Author (Year)                             │  │
│ │   "Optional quote" (blockquote)                         │  │
│ │ 2-3 sentence analysis paragraph                         │  │
│ │                                                         │  │
│ │ [Optional 3rd book example]                             │  │
│ └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ [1] FIRST SECTION TITLE ⓘ                              ˅   │
│     (CollapsibleSection with numbered teal badge)            │
├─────────────────────────────────────────────────────────────┤
│ [2] SECOND SECTION TITLE ⓘ                             ˅   │
├─────────────────────────────────────────────────────────────┤
│ ... remaining sections ...                                   │
└─────────────────────────────────────────────────────────────┘
```

### Right Sidebar (consistent across all tools)
```
┌── // NAVIGATION ──────────┐
│ 01 SECTION NAME            │
│ 02 SECTION NAME            │
│ ... (numbered, all caps)   │
├── // READOUT ─────────────┤
│ 1. FIELD GROUP        ˅    │
│   — NO DATA —              │
│ 2. FIELD GROUP        ˅    │
│   — NO DATA —              │
│ ... (mirrors sections)     │
└────────────────────────────┘
```

---

## IMPLEMENTATION APPROACH

### Step 1: Create a Shared Layout Component

Create `src/components/tools/ToolPageLayout.tsx` that enforces the canonical structure. Every tool page wraps its content in this layout, passing props:

```typescript
interface ToolPageLayoutProps {
  toolType: string;           // tool slug
  brandName: string;          // "Genesis", "Phylo", etc.
  fullName: string;           // "Planetary Profile"
  subtitle: string;           // 1-2 line description
  isPro: boolean;             // show tiny PRO badge
  quote?: ToolQuote;          // SF quote for the bar
  introTitle: string;         // "THE WORLD AS CHARACTER"
  introDescription: string;   // 1-line tool description
  sfExamples: SFExample[];    // published SF book examples
  children: ReactNode;        // the CollapsibleSections
}
```

### Step 2: Extract Tool Metadata

Create `src/lib/tool-page-config.ts` with a single source of truth for every tool's metadata:

```typescript
export const TOOL_PAGE_CONFIG: Record<string, ToolPageConfig> = {
  "planetary-profile": {
    brandName: "Genesis",
    fullName: "Planetary Profile",
    subtitle: "Define your world's stellar environment, physical characteristics, atmosphere, and habitability.",
    isPro: true,
    introTitle: "THE WORLD AS CHARACTER",
    exportLabel: "Export Genesis",
    // ... quote, SF examples
  },
  // ... all 21 tools
};
```

### Step 3: Migrate Each Tool Page

For each of the 21 tool pages:
1. Replace the ad-hoc header section with `<ToolPageLayout {...config}>`
2. Keep only the CollapsibleSections as children
3. Remove any tool-specific header variations
4. Verify the right sidebar Navigation + Readout still works

### Step 4: Verify

After migration, every tool page should be visually identical in structure. The only differences between tools should be:
- The content of the intro panel (quotes, SF examples)
- The names and number of CollapsibleSections
- The fields within each section

---

## TOOLS NEEDING SPECIFIC ATTENTION

| Tool | Issue | Fix |
|------|-------|-----|
| Timeline | Missing brand name | Assign brand name (Jason to decide) |
| Star System Builder | Standalone "SYSTEM NAME" input above intro | Move into first CollapsibleSection |
| ECR (Cascade) | Custom accordion pattern for SF examples | Convert to standard intro panel format |
| Planetary Profile | Quote bar present | Keep, extend to all tools |
| Evolutionary Biology | Quote bar present | Keep, extend to all tools |
| Vessel | Quote bar present | Keep, extend to all tools |
| Timeline | Missing Quick Export button | Add Quick Export button |
| Axiom | "Tool #3" with hash | Remove numbering |

---

## DO NOT TOUCH

- CollapsibleSection component itself (working)
- SectionNavigation sidebar (working)
- Readout panel (working)
- Save Draft / worksheet persistence logic (working)
- The SF example text content (just normalize the container)
- Any simulator pages (different aesthetic, separate spec)

---

## AESTHETIC COMPLIANCE

- Title: MD Nichrome, weight 300
- Subtitle: DM Sans, standard body opacity
- Intro panel evocative title: Jura or Space Grotesk, uppercase, green (#3DFFCD or category accent)
- "IN PUBLISHED SCIENCE FICTION": Jura, uppercase, 45% white opacity, letter-spacing 0.08em
- Book titles: italicized, category accent color, linked
- Blockquotes: left border, italic, slightly reduced opacity
- Pro badge: JetBrains Mono, 9px, teal at 40% opacity, inline with title
- Zero border-radius on intro panel
- Glass-panel treatment on intro panel (existing pattern)

---

## TIMELINE

Estimated effort: 4-6 hours for full migration of all 21 tools.
Execute before any remediation spec work.

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools
