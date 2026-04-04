# StellarForge Hotfix: Title Sizing + World Graph Crash
# Handoff to Claude Code — Immediate Priority

**Date:** April 4, 2026  
**Priority:** CRITICAL (World Graph is non-functional)

---

## Bug 1: Note/Document Title Header Too Large

### Symptom
The "Untitled" title input / header in the writing space works but is 
visually oversized. Needs to be scaled down.

### Severity
Low. Cosmetic. But fix while you're in there.

### Fix

Find the title input component in the writing/workshop space. Reduce the 
font size. The current size is likely 28-32px or larger. Target: 20px.

```css
/* Find the title input and adjust: */

/* FROM something like: */
.note-title-input,
.document-title,
[class*="title"] {
  font-size: 28px;    /* or 32px, or 2rem, or similar */
}

/* TO: */
.note-title-input,
.document-title,
[class*="title"] {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: rgba(250, 250, 250, 0.9);
}
```

If using Tailwind, the class is likely `text-3xl` or `text-4xl`. 
Change to `text-xl` or `text-lg`:

```tsx
// FROM:
<input className="text-3xl font-light ..." />

// TO:
<input className="text-xl font-light ..." />
```

### Verify
Open a note in the writing space. The "Untitled" placeholder and any 
typed title should feel like a heading, not a billboard. It should be 
noticeably larger than body text but not dominate the view. Roughly 
1.3-1.5x the size of body text, not 2-3x.

---

## Bug 2: World Graph Crashes — Shows Retry / Return to Dashboard

### Symptom
Opening the World Graph page results in a crash. Instead of rendering 
the graph, the user sees an error boundary screen with "Retry" and 
"Return to Dashboard" options. The graph is completely non-functional.

### Severity
CRITICAL. A core feature is entirely broken.

### Diagnosis Procedure

**Step 1: Check the browser console**

Open the World Graph page with browser dev tools open (F12 → Console tab). 
The error message will tell you exactly what's crashing. Common causes:

```
Likely error patterns:

A) "Cannot read properties of undefined (reading 'map')"
   → Data query returns null/undefined instead of an array
   → Fix: add null checks and default to empty array

B) "X is not a function" or "X is not defined"  
   → A library import is broken or a component reference is wrong
   → Fix: check imports, verify package is installed

C) "Maximum update depth exceeded"
   → Infinite re-render loop, often from useEffect dependencies
   → Fix: check useEffect dependency arrays

D) "ChunkLoadError" or "Failed to fetch dynamically imported module"
   → Code splitting / lazy loading failure
   → Fix: rebuild, check route configuration

E) React Flow / @xyflow specific:
   "ReactFlow: Seems like you have not used zustand provider as an ancestor"
   → ReactFlow component not wrapped in <ReactFlowProvider>
   → Fix: wrap component in provider

F) Supabase query error:
   "relation 'entities' does not exist" or "relation 'world_graph_nodes' does not exist"
   → The query references a table that doesn't exist yet
   → Fix: either create the table or update the query to use existing tables
```

**Step 2: Identify the exact error**

```bash
# Search for the error boundary component
grep -rn "retry\|Return to Dashboard\|ErrorBoundary\|error-boundary" src/ \
  --include="*.tsx" --include="*.ts" --include="*.jsx"

# Search for the World Graph component
grep -rn "WorldGraph\|world-graph\|worldGraph\|GraphView\|graph-view" src/ \
  --include="*.tsx" --include="*.ts" --include="*.jsx"

# Check what data the graph component tries to load on mount
# Look at useEffect hooks and data fetching in the graph component
```

**Step 3: Check if this is a data problem or a rendering problem**

```bash
# Check if the graph's data source table exists
# Run in Supabase SQL editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%graph%' OR table_name LIKE '%node%' 
OR table_name LIKE '%entity%' OR table_name LIKE '%connection%';
```

### Most Likely Fix Scenarios

**Scenario A: Graph queries a table that doesn't exist**

The graph component was built expecting a table (like `entities` or 
`world_graph_nodes`) that hasn't been created yet, or was renamed, 
or the entity layer from the new spec hasn't been deployed.

```typescript
// The component probably does something like:
const { data: nodes } = await supabase
  .from('world_graph_nodes')  // THIS TABLE MAY NOT EXIST
  .select('*')
  .eq('world_id', worldId);

// Fix: either create the table, or update to query whatever table 
// currently holds world data. Check what tables DO exist.
```

**Scenario B: Null data crashes the renderer**

The query returns null or undefined (maybe the world has no entities yet) 
and the rendering code tries to .map() over it without a null check.

```typescript
// BROKEN:
const nodes = data.map(entity => ({  // crashes if data is null
  id: entity.id,
  position: { x: entity.x, y: entity.y },
  data: entity,
}));

// FIXED:
const nodes = (data || []).map(entity => ({
  id: entity.id,
  position: { x: entity.x ?? 0, y: entity.y ?? 0 },
  data: entity,
}));
```

**Scenario C: React Flow not properly initialized**

```tsx
// BROKEN: ReactFlow used without provider
function WorldGraph() {
  return <ReactFlow nodes={nodes} edges={edges} />;
}

// FIXED: Wrap in provider
import { ReactFlowProvider } from '@xyflow/react';

function WorldGraphPage() {
  return (
    <ReactFlowProvider>
      <WorldGraph />
    </ReactFlowProvider>
  );
}
```

**Scenario D: Import/package error**

```bash
# Check if the graph library is actually installed
npm ls @xyflow/react
npm ls reactflow
npm ls react-flow-renderer
npm ls d3
npm ls vis-network

# If nothing is installed, that's the problem.
# If an old version (reactflow v11) is installed but code references 
# @xyflow/react (v12), that's a mismatch.
```

**Scenario E: The error boundary itself is masking the real error**

```bash
# Find the error boundary and temporarily add console logging
grep -rn "componentDidCatch\|ErrorBoundary" src/ --include="*.tsx" --include="*.ts"
```

Add to the error boundary:
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('World Graph crashed:', error);
  console.error('Component stack:', errorInfo.componentStack);
  // existing error handling...
}
```

### Fix Procedure

```
1. Open browser console, navigate to World Graph, capture the EXACT error
2. Paste the error into your Claude Code session
3. Follow the error to its source file and line number
4. Apply the appropriate fix from the scenarios above
5. If the error is a missing table: 
   - Check if the entity tables from the spec have been created
   - If not, create them first (Graph Spec §2.1 and §3.1)
   - If yes, update the graph component to query the correct table name
6. Run npm run build — must pass
7. Test: open World Graph — should render without crashing
8. If graph renders but is empty (no nodes), that's EXPECTED for a world 
   with no entities. Show an empty state message, not a crash.
```

### Empty State (Required)

Even after fixing the crash, a world with zero entities should NOT show 
a blank screen or an error. It should show:

```tsx
if (!nodes || nodes.length === 0) {
  return (
    <div className="graph-empty-state">
      <p>No entities in this world yet.</p>
      <p>Create your first entity to begin building your world graph.</p>
      <button onClick={openCreateEntityModal}>+ Create Entity</button>
    </div>
  );
}
```

### Verify
After fix:
- Open World Graph for a world WITH data → graph renders, no crash
- Open World Graph for a world with NO data → empty state message, no crash
- Console shows no errors in either case

---

## After Both Fixes

```
Increment version: 0.5967 → 0.5968
Update CHANGELOG.md:

## 0.5968
- Fixed: World Graph crash (retry/return to dashboard error)
- Fixed: Note title header reduced from ~28px to 20px
```

---

*These worlds exist in you. Waiting to be found.*
