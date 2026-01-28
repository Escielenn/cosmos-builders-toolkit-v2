# StellarForge Tool Development Standards

This document defines the look, feel, and structure for all worldbuilding tools in StellarForge.

---

## Tool Page Structure

Every tool page must follow this consistent structure:

### 1. Page Container
```tsx
<div className="min-h-screen bg-background">
  <Header />
  <main className="container mx-auto px-4 pt-24 pb-16">
    {/* Content */}
  </main>
</div>
```

### 2. Header Section

```tsx
{/* Back Link & Title */}
<div className="mb-8">
  <Link
    to={worldId ? `/worlds/${worldId}` : "/"}
    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
  >
    <ArrowLeft className="w-4 h-4" />
    {worldId ? "Back to World" : "Back to Dashboard"}
  </Link>

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <Badge className="mb-2">Tool {NUMBER}</Badge>
      <h1 className="font-display text-3xl md:text-4xl font-bold">
        {TOOL_TITLE}
      </h1>
      {worksheetTitle && (
        <div className="flex items-center gap-2 mt-1">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-lg font-medium text-primary">{worksheetTitle}</span>
        </div>
      )}
      <p className="text-muted-foreground mt-2 max-w-2xl">
        {TOOL_DESCRIPTION}
      </p>
    </div>

    <div className="flex items-center gap-2 no-print">
      {/* Cloud Status */}
      {worldId && user ? (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Cloud className="w-3 h-3 text-green-500" />
          Cloud sync enabled
        </span>
      ) : (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <CloudOff className="w-3 h-3" />
          Local only
        </span>
      )}

      {/* Action Buttons */}
      <Button variant="outline" size="sm" onClick={handleSave}>
        <Save className="w-4 h-4 mr-2" />
        Save Draft
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      <Button size="sm" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  </div>
</div>
```

### 3. Introduction Panel

Every tool must have an introduction GlassPanel immediately after the header:

```tsx
<GlassPanel glow className="p-6 md:p-8 mb-8">
  <h2 className="font-display text-xl font-semibold mb-4 gradient-text">
    {INSPIRING_TITLE}
  </h2>
  <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
    "{INSPIRING_QUOTE}"
  </blockquote>
  <p className="text-muted-foreground mb-4">
    {TOOL_PURPOSE_EXPLANATION}
  </p>
  <div className="text-sm text-muted-foreground mb-4">
    <strong className="text-foreground">The {CONCEPT_NAME}:</strong>
    <p className="mt-1">{FLOW_DESCRIPTION}</p>
  </div>

  {/* External Resources */}
  <div className="mt-6 pt-4 border-t border-border">
    <h4 className="text-sm font-medium mb-3">Reference Resources</h4>
    <div className="flex flex-wrap gap-2">
      {EXTERNAL_RESOURCES.map((resource) => (
        <a
          key={resource.name}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {resource.name}
          <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  </div>
</GlassPanel>
```

---

## Required Imports

Every tool page should include these imports:

```tsx
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronUp,
  Info,
  Cloud,
  CloudOff,
  FileText,
  ExternalLink,
  Download,
  Printer,
  // Tool-specific icon
} from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBackground } from "@/hooks/use-background";
import { useWorksheets, useWorksheet, useWorksheetsByType } from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
```

---

## CollapsibleSection Component

Each tool should define a local CollapsibleSection component that follows this pattern:

```tsx
const CollapsibleSection = ({
  id,
  title,
  subtitle,
  levelNumber,
  thinkLike,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  levelNumber?: number;
  thinkLike?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <GlassPanel id={id} className="overflow-hidden scroll-mt-24">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3">
              {levelNumber !== undefined && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {levelNumber}
                </div>
              )}
              <div>
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 md:px-6 pb-6 space-y-6">
            {thinkLike && (
              <p className="text-sm text-primary italic border-l-2 border-primary pl-3">
                Think like {thinkLike}
              </p>
            )}
            {children}
          </div>
        </CollapsibleContent>
      </GlassPanel>
    </Collapsible>
  );
};
```

---

## Data Constants Pattern

Create a separate data file for each tool:

**File:** `src/lib/{tool-name}-data.ts`

```tsx
// Section definitions for navigation
export const TOOL_NAME_SECTIONS = [
  { id: "section-1", title: "1. First Section" },
  { id: "section-2", title: "2. Second Section" },
  // ...
];

// Dropdown/checkbox options with id, name, description pattern
export const OPTION_CATEGORY = [
  { id: "option-1", name: "Option One", description: "What this option means" },
  { id: "option-2", name: "Option Two", description: "What this option means" },
];

// Section guidance prompts
export const SECTION_GUIDANCE = {
  sectionOne: "Helpful guidance for filling out this section...",
  sectionTwo: "More guidance...",
};
```

---

## PDF Templates

Each tool needs two PDF templates:

1. **Summary Template** (1-2 pages): Quick reference with key values
2. **Full Report Template** (complete): All sections with full data

**Location:** `src/lib/pdf/templates/{ToolName}SummaryTemplate.tsx` and `{ToolName}FullReportTemplate.tsx`

Export from: `src/lib/pdf/templates/index.ts`

---

## Index.tsx Tool Entry

Add tool to homepage with this pattern:

```tsx
{
  id: "tool-route-name",
  title: "Tool Display Name",
  description: "Brief description of what the tool does.",
  icon: ToolIcon,  // Import from lucide-react
  status: "available" as const,  // or "coming-soon"
  week: NUMBER,
},
```

---

## Pro/Free Tool Configuration (REQUIRED)

**CRITICAL:** Every tool must be registered in `src/lib/tools-config.ts` for proper lock/unlock badge display on the homepage.

```tsx
// src/lib/tools-config.ts

export const FREE_TOOL_IDS = [
  'environmental-chain-reaction',
  'spacecraft-designer',
  'propulsion-consequences-map',
];

export const PRO_TOOL_IDS = [
  'planetary-profile',
  'drake-equation-calculator',
  'xenomythology-framework-builder',
  'evolutionary-biology',
  'culture-designer',
  'technology-mapper',
];
```

**What this controls:**
- Homepage ToolCard displays "Unlocked" badge (green) for Pro users
- Homepage ToolCard displays "Pro" badge (amber) for non-Pro users
- Lock icon appears on tool title for non-Pro users
- "Upgrade to Unlock" badge appears at bottom of card

**If you forget this step:** The tool card will not show any lock/unlock status, making it unclear to users whether the tool requires a subscription.

---

## App.tsx Route

Add route with ProToolGuard for premium tools:

```tsx
<Route
  path="/tools/tool-name"
  element={
    <ProToolGuard>
      <ToolComponent />
    </ProToolGuard>
  }
/>
```

Or without guard for free tools:

```tsx
<Route path="/tools/tool-name" element={<ToolComponent />} />
```

**Note:** The `ProToolGuard` wrapper and the `tools-config.ts` entry work together:
- `tools-config.ts` controls the homepage badge display
- `ProToolGuard` controls access to the actual tool page

---

## WorldDashboard Entry

Add to TOOLS array in `src/pages/WorldDashboard.tsx`:

```tsx
{
  type: "tool-type-string",
  name: "Tool Display Name",
  description: "Brief description",
  icon: ToolIcon,
  path: "/tools/tool-route",
},
```

---

## WorksheetSelectorDialog Placeholder

Add placeholder name in `src/components/tools/WorksheetSelectorDialog.tsx`:

```tsx
const TOOL_PLACEHOLDERS: Record<string, string> = {
  // ...existing...
  "tool-type": "New Item Name",
};
```

---

## Styling Guidelines

- Use `gradient-text` class for emphasis headers in introduction panels
- Use `GlassPanel` with `glow` prop for important sections
- Use `Badge` for tool numbers and status indicators
- Maintain consistent spacing: `mb-8` between major sections
- Use `text-muted-foreground` for secondary text
- Use `font-display` for headings
- Use `no-print` class on elements that shouldn't appear in print

---

## Worksheet Integration

All tools must support:
1. **Cloud mode**: When `worldId` and `worksheetId` are in URL
2. **Local mode**: When no URL params (fallback to localStorage)

Show `WorksheetSelectorDialog` when `worldId` exists but no `worksheetId`.

---

## Tool Interoperability & Worksheet Linking

StellarForge tools are designed to work together. Tools can link to other tool worksheets within the same world to import relevant data automatically.

### Architecture Overview

```
World
├── Planetary Profile Worksheet (planet data)
├── Environmental Chain Reaction Worksheet (ecosystem data)
├── Evolutionary Biology Worksheet
│   └── Links to: Planet, ECR
├── Xenomythology Worksheet
│   └── Links to: Planet, ECR, Species
└── Spacecraft Designer Worksheet
    └── Links to: Propulsion
```

### Configuration File

**File:** `src/lib/worksheet-links-config.ts`

This file defines which tools can link to which, and what fields are synced:

```tsx
export const WORKSHEET_LINKS: Record<string, LinkConfig[]> = {
  "evolutionary-biology": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Home Planet",
      syncFields: ["starType", "atmosphereType", "gravity", "dayLength"],
      description: "Link to a planetary profile for environmental context",
    },
  ],
};
```

### Adding Links to a New Tool

1. **Add link configuration** in `worksheet-links-config.ts`
2. **Add FormState field** for `_linkedWorksheets`
3. **Import WorksheetLinkSelector** component
4. **Add handler** for `handleLinkedWorksheetChange`

### LinkedWorksheetRef Structure

```tsx
interface LinkedWorksheetRef {
  worksheetId: string;      // ID of linked worksheet
  syncedAt: string;         // ISO timestamp of last sync
  syncedData: Record<string, unknown>;  // Cached synced field values
}
```

### Current Tool Connections

| Tool | Can Link To |
|------|-------------|
| Evolutionary Biology | Planetary Profile, ECR |
| Xenomythology | Planetary Profile, ECR, Evolutionary Biology |
| Spacecraft Designer | Propulsion Consequences Map |

---

## Required External Resources

Each tool should have 2-4 external resources for users to reference:
- NASA/scientific databases
- Community resources (wikis, forums)
- Hard SF reference sites (Atomic Rockets, etc.)
- Educational resources

---

## Complete File Reference for Tool Addition

When adding a new tool, these files MUST be updated:

| File | Purpose | Required |
|------|---------|----------|
| `src/lib/{tool-name}-data.ts` | Data constants, sections, dropdowns | Yes |
| `src/pages/tools/{ToolName}.tsx` | Main tool page component | Yes |
| `src/App.tsx` | Route definition | Yes |
| `src/pages/Index.tsx` | Homepage tools array (logged-in view) | Yes |
| `src/components/landing/ToolShowcase.tsx` | Landing page tools (logged-out view) | Yes |
| `src/lib/tools-config.ts` | Pro/Free tool classification | Yes |
| `src/pages/WorldDashboard.tsx` | World detail page TOOLS array | Yes |
| `src/components/tools/WorksheetSelectorDialog.tsx` | New worksheet placeholders | Yes |
| `src/lib/pdf/templates/{ToolName}SummaryTemplate.tsx` | PDF summary export | Yes |
| `src/lib/pdf/templates/{ToolName}FullReportTemplate.tsx` | PDF full report export | Yes |
| `src/lib/pdf/templates/index.ts` | Export PDF templates | Yes |
| `src/lib/worksheet-links-config.ts` | Cross-tool linking | If linking |
| `src/components/icons/tool-icons.tsx` | Custom tool icon | Optional |

---

## Checklist for New Tools

### 1. Core Setup
- [ ] Create data file: `src/lib/{tool-name}-data.ts`
  - Section definitions
  - Dropdown options with id/name/description
  - Section guidance text
- [ ] Create tool page: `src/pages/tools/{ToolName}.tsx`
  - Follow header structure pattern
  - Include introduction GlassPanel
  - CollapsibleSection components
  - WorksheetSelectorDialog integration
- [ ] Add route in `App.tsx` (with `ProToolGuard` if Pro tool)

### 2. Homepage & Navigation (ALL REQUIRED)
- [ ] Add to `src/pages/Index.tsx` tools array (logged-in homepage)
- [ ] Add to `src/components/landing/ToolShowcase.tsx` (logged-out landing page)
- [ ] **Add to `src/lib/tools-config.ts`** - CRITICAL for lock/unlock badges
- [ ] Add to `src/pages/WorldDashboard.tsx` TOOLS array
- [ ] Add placeholder in `src/components/tools/WorksheetSelectorDialog.tsx`

### 3. PDF Export
- [ ] Create `src/lib/pdf/templates/{ToolName}SummaryTemplate.tsx`
- [ ] Create `src/lib/pdf/templates/{ToolName}FullReportTemplate.tsx`
- [ ] Export from `src/lib/pdf/templates/index.ts`
- [ ] Pass templates correctly in ExportDialog:
  ```tsx
  <ExportDialog
    summaryTemplate={<SummaryTemplate formState={formState} worldName={worldName} />}
    fullTemplate={<FullReportTemplate formState={formState} worldName={worldName} />}
  />
  ```

### 4. Interoperability (if applicable)
- [ ] Add link configurations in `src/lib/worksheet-links-config.ts`
- [ ] Add `_linkedWorksheets` field to FormState
- [ ] Implement `WorksheetLinkSelector` in Foundations section
- [ ] Add tool to `TOOL_DISPLAY_NAMES` in worksheet-links-config.ts

### 5. UI Best Practices
- [ ] Add `type="button"` to all button elements (prevents scroll jumping)
- [ ] Use accessible checkbox/toggle patterns
- [ ] Ensure consistent header structure with Badge, title, description
- [ ] Include external resources in introduction panel

### 6. Testing
- [ ] Test cloud save/load with worksheet
- [ ] Test local storage fallback
- [ ] Test PDF export (both Summary and Full Report)
- [ ] Verify mobile responsiveness
- [ ] Verify print styling
- [ ] Verify Pro/Free badge shows correctly on homepage (logged-in)
- [ ] Verify tool appears in ToolShowcase (logged-out)
- [ ] Test worksheet linking (if applicable)

---

## Common Mistakes to Avoid

1. **Missing ToolShowcase entry** - Tool won't appear on landing page for non-logged-in users
2. **Missing tools-config.ts entry** - No lock/unlock badge on homepage
3. **Wrong ExportDialog props** - Pass templates as JSX elements with props, not component references
4. **Missing `type="button"`** - Can cause scroll-to-top issues on button clicks
5. **Inconsistent header structure** - Doesn't match other tools visually
