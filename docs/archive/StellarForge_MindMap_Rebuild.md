# StellarForge Mind Map: Functional Rebuild
# This Is Not a Cosmetic Pass — This Is a Functional Rebuild

**Date:** April 4, 2026  
**Priority:** HIGH  
**Handoff Target:** Claude Code

---

## The Problem

The mind map tool was restyled but not functionally rebuilt. It looks 
cleaner but does not do anything it couldn't do before. The following 
functional requirements are NOT cosmetic. Each one describes a user 
action that must work. If the action doesn't work, the feature is 
not implemented.

---

## Prerequisite: Entity Layer Must Exist

The mind map CANNOT be functionally rebuilt without the entity layer.
Before starting this work, verify:

```sql
-- Run in Supabase SQL editor. Both must return results.
SELECT COUNT(*) FROM entities;
SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'entities' AND column_name = 'parent_entity_id';
```

If the entities table does not exist, or does not have a parent_entity_id 
column, STOP. Build the entity layer first (Graph Spec §2.1). The mind 
map cannot function without it.

If the entities table exists but is empty, that is fine. The mind map 
should show an empty state and let users create their first entity.

---

## Functional Requirement 1: Nodes ARE Entities

The mind map must read its nodes from the `entities` table. Not from 
a separate mind_map_nodes table. Not from local state. Not from a 
hardcoded array. From `entities`.

```typescript
// The data source for mind map nodes:
const { data: entities } = await supabase
  .from('entities')
  .select('id, name, entity_type, color, summary, cascade_stage, parent_entity_id, sort_order')
  .eq('world_id', worldId)
  .order('sort_order');

// Convert to tree structure:
function buildTree(entities: Entity[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  
  // Create node for each entity
  entities.forEach(e => {
    map.set(e.id, { ...e, children: [] });
  });
  
  // Build parent-child relationships
  entities.forEach(e => {
    const node = map.get(e.id)!;
    if (e.parent_entity_id && map.has(e.parent_entity_id)) {
      map.get(e.parent_entity_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}
```

### How to verify
Create an entity in the sidebar (or entity creation modal). Refresh 
the mind map. The entity MUST appear as a node. If it doesn't, the 
mind map is not reading from the entities table.

### What to delete
Search the codebase for any mind-map-specific data storage:
```bash
grep -rn "mind.map\|mindmap\|mind_map" src/ --include="*.tsx" --include="*.ts"
```
If there is a separate data model (local state, separate Supabase table, 
localStorage), it must be removed and replaced with the entities query.

---

## Functional Requirement 2: Drag-to-Reparent

A user must be able to drag a node and drop it onto another node to 
change its parent. This updates `parent_entity_id` in the database.

```typescript
// On drop:
async function handleReparent(draggedEntityId: string, newParentId: string) {
  // Prevent circular references
  if (isAncestor(draggedEntityId, newParentId, entities)) {
    toast.error("Cannot make an entity a child of its own descendant.");
    return;
  }
  
  const { error } = await supabase
    .from('entities')
    .update({ 
      parent_entity_id: newParentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', draggedEntityId);
    
  if (!error) {
    // Refetch or optimistically update local tree
    refetchEntities();
  }
}

// Drop on empty space = make root (remove parent):
async function handleMakeRoot(draggedEntityId: string) {
  await supabase
    .from('entities')
    .update({ parent_entity_id: null })
    .eq('id', draggedEntityId);
}
```

### Visual feedback during drag
```
- Dragged node: slight transparency (0.6 opacity), lifted shadow
- Valid drop target (another node): highlight border with cyan glow
- Invalid drop target (own descendant): red border, cursor: not-allowed
- Drop on empty canvas: node becomes a root (parent_entity_id = null)
```

### How to verify
Drag "Species: The Venn" onto "Planet: Keth". Release. The Venn should 
now appear as a child of Keth in the tree. Refresh the page. The 
relationship persists. Check the sidebar: The Venn's parent should 
show as Keth.

---

## Functional Requirement 3: Create Child Entity From Node

Right-clicking a node must show a context menu with "Add Child Entity."
Selecting it opens the entity creation modal with `parent_entity_id` 
pre-filled to the clicked node's entity ID.

```typescript
// Context menu items for a mind map node:
const contextMenuItems = [
  {
    label: 'Add Child Entity',
    action: () => openCreateEntityModal({ parentId: node.id }),
  },
  {
    label: 'Edit Entity',
    action: () => openEditEntityModal(node.id),
  },
  {
    label: 'Remove from Tree',
    sublabel: 'Makes this a root node (does not delete)',
    action: () => handleMakeRoot(node.id),
  },
  { divider: true },
  {
    label: 'Delete Entity',
    danger: true,
    action: () => confirmDeleteEntity(node.id),
  },
];
```

### How to verify
Right-click a planet node. Select "Add Child Entity." The creation modal 
opens. The parent field shows the planet's name. Create a species. The 
new species appears immediately as a child of that planet in the tree.

---

## Functional Requirement 4: Expand and Collapse Branches

Nodes with children must be expandable/collapsible. This is basic tree 
behavior but must actually work.

```typescript
// Track collapsed state locally (not persisted):
const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

function toggleCollapse(entityId: string) {
  setCollapsed(prev => {
    const next = new Set(prev);
    if (next.has(entityId)) {
      next.delete(entityId);
    } else {
      next.add(entityId);
    }
    return next;
  });
}

// When rendering: if a node's ID is in the collapsed set, 
// hide its children from the tree layout
```

### Visual indicators
```
▶ Collapsed node (has hidden children): small arrow/chevron pointing right
▼ Expanded node (children visible): small arrow/chevron pointing down
● Leaf node (no children): no arrow, just the node

The arrow is part of the node component, positioned at the left edge.
Click the arrow OR double-click the node to toggle.
```

### How to verify
A planet with three child species shows all three. Click the collapse 
arrow on the planet. The three species disappear. Click again. They 
reappear. The rest of the tree is unaffected.

---

## Functional Requirement 5: Node Click Shows Entity Detail

Single-clicking a node must show that entity's information. Not navigate 
away. Not do nothing. Show information.

```
Options (choose one):

A) Sidebar panel: clicking a node highlights it and shows its details 
   (name, type, cascade stage, description, connections) in a side panel.
   
B) Inline expansion: clicking a node expands it to show a summary card 
   below the node label.
   
C) Modal: clicking a node opens the entity detail/edit modal.

Option A is recommended. It matches the pattern used in the writing space 
(entity panel) and the graph view (analysis panel).
```

### How to verify
Click a node. Entity details appear somewhere visible without leaving 
the mind map page. You can see the entity's name, type, description, 
and any connections it has.

---

## Functional Requirement 6: Bidirectional Sync

Changes made outside the mind map must appear in the mind map, and 
vice versa. This is automatic if Requirement 1 is met (nodes are 
entities), but must be explicitly tested.

### How to verify
Test A: Create an entity in the sidebar. Switch to mind map. New entity 
  appears as a root node.
Test B: In the mind map, drag entity X under entity Y (reparent). Switch 
  to sidebar. Entity X now shows under entity Y.
Test C: Edit an entity's name in the entity edit modal. The name updates 
  in the mind map.
Test D: Delete an entity from the sidebar. It disappears from the mind map.

If any of these fail, the mind map is maintaining its own data store 
instead of reading from the entity table.

---

## Functional Requirement 7: Empty State

A world with no entities must show a useful empty state, not a blank 
canvas or a crash.

```tsx
if (roots.length === 0) {
  return (
    <div className="mindmap-empty">
      <h3>Your World Map</h3>
      <p>
        No entities yet. Start by creating a star or planet 
        and watch your world's hierarchy grow.
      </p>
      <button onClick={openCreateEntityModal}>
        + Create First Entity
      </button>
    </div>
  );
}
```

### How to verify
Open the mind map for a brand new, empty world. You see a message and 
a create button. Not a blank screen. Not a crash.

---

## Implementation Checklist

```
□ Verify entities table exists with parent_entity_id column
□ Remove any separate mind-map-specific data storage
□ Mind map queries entities table for its nodes
□ Tree built from parent_entity_id relationships
□ Drag a node onto another node → updates parent_entity_id in Supabase
□ Drag a node to empty space → sets parent_entity_id to null (root)
□ Circular reference prevention (can't make X a child of its own descendant)
□ Right-click context menu: Add Child, Edit, Remove from Tree, Delete
□ "Add Child Entity" pre-fills parent in creation modal
□ Expand/collapse arrows on nodes with children
□ Click node → entity detail appears (panel, card, or modal)
□ Entities created elsewhere appear in mind map without refresh
□ Entities reparented in mind map reflect in sidebar
□ Empty world shows helpful empty state with create button
□ Node styling: color-coded by entity type, shows name and type label
```

## Owner Verification (Jason's Test List)

```
□ Create a planet in the sidebar → appears in mind map
□ Right-click planet in mind map → "Add Child Entity" → create a species
  → species appears under planet immediately
□ Drag species onto a different planet → species moves in tree
□ Refresh page → the move persists
□ Collapse a planet's children → they hide
□ Expand → they reappear
□ Click a node → see its details somewhere without leaving the page
□ Delete an entity → it disappears from mind map
□ Empty world → friendly message, not blank or crash
□ Mind map data matches sidebar data exactly (same entities, same hierarchy)
```

---

**After this rebuild, increment version by +10 (significant feature fix).**

*These worlds exist in you. Waiting to be found.*
