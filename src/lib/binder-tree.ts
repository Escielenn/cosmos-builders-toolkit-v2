// ---------------------------------------------------------------------------
// binder-tree, the manuscript binder as a tree of folders and documents.
//
// Rows live in world_entries (entry_type 'folder' | 'document'), linked by
// parent_id and ordered by sort_order within one parent. parent_id always
// supported any depth; the binder only ever drew one level. This module turns
// the flat rows into a tree and plans every structural move (drag and drop,
// the keyboard "Move to" menu, move up/down) as pure data, so the rules can
// be tested without a browser:
//
//   - a folder can never be dropped into itself or its own descendants
//   - only folders accept children
//   - a move rewrites the destination sibling list to i * 10 sort orders
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

export interface BinderEntry {
  id: string;
  parent_id: string | null;
  entry_type: string;
  sort_order: number | null;
  title: string;
}

export interface BinderNode<T extends BinderEntry = BinderEntry> {
  entry: T;
  isFolder: boolean;
  depth: number;
  children: BinderNode<T>[];
}

/** A visible row in the rendered binder (tree flattened, collapsed skipped). */
export interface BinderRow<T extends BinderEntry = BinderEntry> {
  node: BinderNode<T>;
  depth: number;
}

export type DropPosition = "before" | "after" | "inside";

export interface MovePlan {
  /** The moved row. */
  id: string;
  /** Its new parent (null = binder root). */
  parentId: string | null;
  /** The full destination sibling list, in order, moved row included. */
  orderedIds: string[];
}

const isFolder = (e: BinderEntry) => e.entry_type === "folder";

// ---------------------------------------------------------------------------
// Parent resolution (cycle- and orphan-safe)
// ---------------------------------------------------------------------------

/**
 * The effective parent of every entry. A parent that is missing, not a
 * folder, or part of a cycle resolves to the root, so a bad row can never
 * make an item vanish from the binder.
 */
export function effectiveParents<T extends BinderEntry>(entries: T[]): Map<string, string | null> {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const parent = new Map<string, string | null>();
  for (const e of entries) {
    const p = e.parent_id ? byId.get(e.parent_id) : undefined;
    parent.set(e.id, p && isFolder(p) && p.id !== e.id ? p.id : null);
  }
  // Break cycles: walk up from each node; if we meet ourselves, cut at root.
  for (const e of entries) {
    const seen = new Set<string>([e.id]);
    let cur = parent.get(e.id) ?? null;
    while (cur) {
      if (seen.has(cur)) {
        parent.set(e.id, null);
        break;
      }
      seen.add(cur);
      cur = parent.get(cur) ?? null;
    }
  }
  return parent;
}

// ---------------------------------------------------------------------------
// Sibling ordering
// ---------------------------------------------------------------------------

/**
 * Order one sibling list.
 *
 * Before nesting, folders and documents kept independent sort_order
 * sequences (both starting at 0) and the binder drew every folder above the
 * loose documents. A group where a folder and a document share a sort_order
 * is that legacy shape, so it keeps the legacy layout: folders first. Once a
 * writer drags anything in the group, the move rewrites unique i * 10 values
 * from the order on screen and the group becomes a plain sort_order list,
 * with no visual jump.
 */
export function orderSiblings<T extends BinderEntry>(siblings: T[]): T[] {
  const folderOrders = new Set(siblings.filter(isFolder).map((s) => s.sort_order ?? 0));
  const legacy = siblings.some((s) => !isFolder(s) && folderOrders.has(s.sort_order ?? 0));
  return [...siblings].sort((a, b) => {
    if (legacy && isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
    const d = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (d !== 0) return d;
    if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
    return (a.title || "").localeCompare(b.title || "");
  });
}

// ---------------------------------------------------------------------------
// Tree
// ---------------------------------------------------------------------------

export function buildBinderTree<T extends BinderEntry>(entries: T[]): BinderNode<T>[] {
  const parent = effectiveParents(entries);
  const childrenOf = new Map<string | null, T[]>();
  for (const e of entries) {
    const p = parent.get(e.id) ?? null;
    const list = childrenOf.get(p);
    if (list) list.push(e);
    else childrenOf.set(p, [e]);
  }
  const build = (p: string | null, depth: number): BinderNode<T>[] =>
    orderSiblings(childrenOf.get(p) ?? []).map((entry) => ({
      entry,
      isFolder: isFolder(entry),
      depth,
      children: isFolder(entry) ? build(entry.id, depth + 1) : [],
    }));
  return build(null, 0);
}

/** Depth-first rows, skipping the children of collapsed folders. */
export function flattenVisible<T extends BinderEntry>(
  tree: BinderNode<T>[],
  collapsed: ReadonlySet<string>,
): BinderRow<T>[] {
  const out: BinderRow<T>[] = [];
  const walk = (nodes: BinderNode<T>[]) => {
    for (const n of nodes) {
      out.push({ node: n, depth: n.depth });
      if (n.isFolder && !collapsed.has(n.entry.id)) walk(n.children);
    }
  };
  walk(tree);
  return out;
}

/** Every folder, depth-first, with its depth and its title path. */
export function flattenFolders<T extends BinderEntry>(
  tree: BinderNode<T>[],
): { node: BinderNode<T>; path: string[] }[] {
  const out: { node: BinderNode<T>; path: string[] }[] = [];
  const walk = (nodes: BinderNode<T>[], path: string[]) => {
    for (const n of nodes) {
      if (!n.isFolder) continue;
      const p = [...path, n.entry.title || "Untitled"];
      out.push({ node: n, path: p });
      walk(n.children, p);
    }
  };
  walk(tree, []);
  return out;
}

/** Ids of every row inside a folder, at any depth (the folder excluded). */
export function descendantIds<T extends BinderEntry>(entries: T[], folderId: string): Set<string> {
  const parent = effectiveParents(entries);
  const out = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of entries) {
      if (out.has(e.id)) continue;
      const p = parent.get(e.id);
      if (p && (p === folderId || out.has(p))) {
        out.add(e.id);
        grew = true;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Move planning
// ---------------------------------------------------------------------------

function siblingsOf<T extends BinderEntry>(
  entries: T[],
  parent: Map<string, string | null>,
  parentId: string | null,
): T[] {
  return orderSiblings(entries.filter((e) => (parent.get(e.id) ?? null) === parentId));
}

/** True when `activeId` may be placed under `parentId`. */
export function canMoveInto<T extends BinderEntry>(
  entries: T[],
  activeId: string,
  parentId: string | null,
): boolean {
  if (parentId === null) return true;
  if (parentId === activeId) return false;
  const target = entries.find((e) => e.id === parentId);
  if (!target || !isFolder(target)) return false;
  return !descendantIds(entries, activeId).has(parentId);
}

/**
 * Plan a drop of `activeId` relative to `overId`.
 * Returns null when the drop is illegal or would change nothing.
 */
export function planDrop<T extends BinderEntry>(
  entries: T[],
  activeId: string,
  overId: string,
  position: DropPosition,
): MovePlan | null {
  if (activeId === overId) return null;
  const parent = effectiveParents(entries);
  const over = entries.find((e) => e.id === overId);
  if (!over || !entries.some((e) => e.id === activeId)) return null;

  if (position === "inside") {
    if (!isFolder(over)) return null;
    return planMoveInto(entries, activeId, over.id);
  }

  const parentId = parent.get(over.id) ?? null;
  if (!canMoveInto(entries, activeId, parentId)) return null;
  const list = siblingsOf(entries, parent, parentId)
    .map((e) => e.id)
    .filter((id) => id !== activeId);
  const at = list.indexOf(overId);
  list.splice(position === "before" ? at : at + 1, 0, activeId);

  const before = siblingsOf(entries, parent, parent.get(activeId) ?? null).map((e) => e.id);
  if ((parent.get(activeId) ?? null) === parentId && before.join() === list.join()) return null;
  return { id: activeId, parentId, orderedIds: list };
}

/** Plan "move into this folder" (appended at the end). Null if illegal or a no-op. */
export function planMoveInto<T extends BinderEntry>(
  entries: T[],
  activeId: string,
  parentId: string | null,
): MovePlan | null {
  if (!canMoveInto(entries, activeId, parentId)) return null;
  const parent = effectiveParents(entries);
  if ((parent.get(activeId) ?? null) === parentId) return null;
  const list = siblingsOf(entries, parent, parentId).map((e) => e.id);
  list.push(activeId);
  return { id: activeId, parentId, orderedIds: list };
}

/** Plan "move up" (-1) / "move down" (+1) within the current sibling list. */
export function planShift<T extends BinderEntry>(
  entries: T[],
  activeId: string,
  delta: -1 | 1,
): MovePlan | null {
  const parent = effectiveParents(entries);
  const parentId = parent.get(activeId) ?? null;
  const list = siblingsOf(entries, parent, parentId).map((e) => e.id);
  const i = list.indexOf(activeId);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= list.length) return null;
  [list[i], list[j]] = [list[j], list[i]];
  return { id: activeId, parentId, orderedIds: list };
}

/**
 * Folders `activeId` could be moved into, depth-first with indentation depth.
 * `disabled` marks the current parent and anything that would create a cycle.
 */
export function moveTargets<T extends BinderEntry>(
  entries: T[],
  activeId: string,
): { id: string; title: string; depth: number; disabled: boolean }[] {
  const parent = effectiveParents(entries);
  const current = parent.get(activeId) ?? null;
  const blocked = descendantIds(entries, activeId);
  return flattenFolders(buildBinderTree(entries)).map(({ node }) => ({
    id: node.entry.id,
    title: node.entry.title || "Untitled",
    depth: node.depth,
    disabled: node.entry.id === activeId || blocked.has(node.entry.id) || node.entry.id === current,
  }));
}

/** Decide before / inside / after from the pointer's height within a row. */
export function dropPositionFor(
  isFolderRow: boolean,
  pointerY: number,
  rowTop: number,
  rowHeight: number,
): DropPosition {
  const f = rowHeight > 0 ? (pointerY - rowTop) / rowHeight : 0.5;
  if (isFolderRow) {
    if (f < 0.25) return "before";
    if (f > 0.75) return "after";
    return "inside";
  }
  return f < 0.5 ? "before" : "after";
}
