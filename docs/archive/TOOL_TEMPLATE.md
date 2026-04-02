# StellarForge Tool Development Template

This document provides a standardized template for creating worldbuilding tools in StellarForge. Follow this structure to ensure consistency across all tools.

---

## Tool Overview

### Required Information

```markdown
# [Tool Name]

## Purpose
One-sentence description of what the tool helps users create/explore.

## Tool Type Constant
`const TOOL_TYPE = "tool-name-kebab-case";`

## Access Tier
- [ ] Free
- [ ] Pro

## Estimated Complexity
- [ ] Simple (4-6 sections, ~400 lines)
- [ ] Medium (7-10 sections, ~600 lines)
- [ ] Complex (11+ sections, ~800+ lines)
```

---

## Form Structure

### Section Template

Each tool should have 6-12 sections. Use this template for each:

```typescript
interface SectionName {
  field1: string;        // Single select or text
  field2: string[];      // Multi-select array
  field3: string;        // Textarea for notes
}
```

### Standard Section Types

1. **Foundation/Context** - What is being designed, basic parameters
2. **Physical/Technical** - Measurable, scientific aspects
3. **Biological/Organic** - Living systems, ecology
4. **Social/Cultural** - Society, customs, values
5. **Political/Economic** - Power structures, resources
6. **Psychological** - Mental, emotional, perceptual
7. **Narrative Integration** - Story hooks, conflicts, sensory details
8. **Synthesis/Consistency** - Cross-check logic, identify contradictions

---

## Key Choices Sidebar

Every tool needs a `KeyChoicesSection[]` for the sidebar:

```typescript
const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
  return [
    {
      id: "section-id",
      title: "1. Section Name",
      choices: [
        { label: "Field Label", value: formState.section.field || "Not set" },
        // 2-4 key choices per section
      ],
    },
    // Repeat for each major section (usually 5-8 sidebar sections)
  ];
}, [formState]);
```

### Guidelines
- Show only the most important decisions (not every field)
- Display "Not set" for empty values
- Use concise labels (1-3 words)
- Limit to 3-4 choices per section

---

## Tool Linking Configuration

### Link Definition

Add to `src/lib/worksheet-links-config.ts`:

```typescript
"tool-type": [
  {
    key: "unique-key",
    targetTool: "target-tool-type",
    label: "Link Label",
    syncFields: [
      "section.field1",
      "section.field2",
      // Dot-notation paths to sync
    ],
    description: "What data this imports and why",
  },
],
```

### Bidirectional Links
If Tool A links to Tool B, ensure Tool B can also link back to Tool A where appropriate.

---

## Data File Structure

Create `src/lib/[tool-name]-data.ts`:

```typescript
// Option arrays for select fields
export const FIELD_OPTIONS = [
  { value: "option-1", label: "Option 1", description: "What this means" },
  { value: "option-2", label: "Option 2", description: "What this means" },
] as const;

// Consequence/implication mappings
export const FIELD_CONSEQUENCES: Record<string, string[]> = {
  "option-1": [
    "Consequence 1",
    "Consequence 2",
  ],
};

// SF examples for inspiration
export const SF_EXAMPLES = [
  {
    name: "Example Name",
    source: "Book/Film",
    description: "How this example illustrates the concept",
  },
];
```

---

## Component Structure

### File Layout

```
src/pages/tools/ToolName.tsx          # Main tool component (~400-800 lines)
src/lib/tool-name-data.ts             # Data/options file
src/lib/pdf/templates/ToolNameTemplates.tsx  # PDF export templates
```

### Standard Imports

```typescript
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useWorksheets, useWorksheet, useWorksheetsByType, useRenameWorksheet } from "@/hooks/use-worksheets";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { CollapsibleSection } from "@/components/tools/CollapsibleSection";
import { KeyChoicesSidebar, KeyChoicesSection } from "@/components/tools/KeyChoicesSidebar";
import { SectionNavigation } from "@/components/tools/SectionNavigation";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolSidebar } from "@/components/tools/ToolSidebar";
import { ExportDialog } from "@/components/tools/ExportDialog";
import { WorksheetSelectorDialog } from "@/components/tools/WorksheetSelectorDialog";
import { WorksheetLinkSelector } from "@/components/tools/WorksheetLinkSelector";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
```

### Component Pattern

```typescript
const TOOL_TYPE = "tool-name";

interface FormState {
  section1: Section1Type;
  section2: Section2Type;
  // ...
}

const initialFormState: FormState = {
  section1: { /* defaults */ },
  section2: { /* defaults */ },
};

const ToolName = () => {
  // URL params
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  // Auth & subscription
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();

  // Form state
  const [formState, setFormState] = useState<FormState>(initialFormState);

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Data hooks
  const { worlds } = useWorlds();
  const { worksheets, createWorksheet, updateWorksheet } = useWorksheets(worldId);
  const { worksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId);

  // ... implementation
};
```

---

## Export Templates

### PDF Summary Template

```typescript
export const ToolSummaryTemplate = ({ data, worldName, date }: TemplateProps) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.title || "Untitled"}</Text>
        <Text style={styles.subtitle}>Tool Name Summary</Text>
      </View>

      {/* Key Results Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Results</Text>
        {/* 4-6 most important outputs */}
      </View>

      <View style={styles.footer}>
        <Text>Generated by StellarForge</Text>
      </View>
    </Page>
  </Document>
);
```

### PDF Full Report Template

```typescript
export const ToolFullReportTemplate = ({ data, worldName, date }: TemplateProps) => (
  <Document>
    <Page style={styles.page}>
      {/* Cover page */}
    </Page>
    <Page style={styles.page}>
      {/* All sections with full detail */}
    </Page>
  </Document>
);
```

---

## Routing

Add to `src/App.tsx`:

```typescript
<Route path="/tools/tool-name" element={<ToolName />} />
```

---

## Tool Card

Add to tools list in `src/pages/Index.tsx` or tool registry:

```typescript
{
  id: "tool-name",
  title: "Tool Display Name",
  description: "What the tool helps you create",
  icon: IconComponent,
  path: "/tools/tool-name",
  tier: "pro", // or "free"
  category: "category-name",
}
```

---

## Quality Checklist

Before submitting a new tool:

- [ ] TOOL_TYPE constant defined and unique
- [ ] FormState interface with all sections
- [ ] initialFormState with sensible defaults
- [ ] KeyChoicesSidebar showing key decisions
- [ ] SectionNavigation with all sections
- [ ] CollapsibleSection for each form section
- [ ] Data file with options, consequences, examples
- [ ] PDF Summary template (1-2 pages)
- [ ] PDF Full Report template (all sections)
- [ ] WorksheetSelectorDialog integration
- [ ] LocalStorage fallback (no worldId)
- [ ] Cloud sync (with worldId)
- [ ] Export to JSON, Text, Word, Notion
- [ ] Mobile responsive layout
- [ ] Link configuration in worksheet-links-config.ts
- [ ] Route added to App.tsx
- [ ] Tool card added to index/registry

---

## Existing Tools Reference

| Tool | Type Constant | Lines | Sections | Tier |
|------|---------------|-------|----------|------|
| Planetary Profile | `planetary-profile` | ~1730 | 11 | Pro |
| Evolutionary Biology | `evolutionary-biology` | ~600 | 12 | Pro |
| Environmental Chain Reaction | `environmental-chain-reaction` | ~700 | 7 | Free |
| Xenomythology Framework | `xenomythology-framework-builder` | ~500 | 12 | Pro |
| Spacecraft Designer | `spacecraft-designer` | ~600 | 7 | Free |
| Propulsion Consequences | `propulsion-consequences-map` | ~700 | 6 | Free |
| Drake Equation | `drake-equation-calculator` | ~400 | 1 (sliders) | Pro |

Use these as references when building new tools.
