import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Search, FolderPlus, FilePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import TreeNode, { type TreeItem } from "./TreeNode";
import {
  type WorldElement,
  type WorldEntry,
  buildEntryTree,
} from "@/services/world-data";
import { TOOL_DISPLAY_NAMES } from "@/lib/worksheet-links-config";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FreeformTreeViewProps {
  elements: WorldElement[];
  entries: WorldEntry[];
  onElementClick: (element: WorldElement) => void;
  onCreateEntry: (input: { title: string; entryType: string; parentId?: string | null }) => void;
  onRenameEntry: (entryId: string, newTitle: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onMoveEntry: (entryId: string, newParentId: string | null, newSortOrder: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTreeItems(
  elements: WorldElement[],
  entries: WorldEntry[]
): TreeItem[] {
  const items: TreeItem[] = [];

  // Add worksheets as top-level items
  for (const el of elements) {
    items.push({
      id: el.id,
      kind: "worksheet",
      title: el.title,
      toolType: el.toolType,
      toolDisplayName: el.toolDisplayName,
      entryType: undefined,
      completionStatus: el.completionStatus,
      parentId: null,
      sortOrder: 0,
      children: [],
      depth: 0,
    });
  }

  // Build entry tree
  const entryTree = buildEntryTree(entries);

  function addEntryNode(entry: ReturnType<typeof buildEntryTree>[0], depth: number): TreeItem {
    return {
      id: entry.id,
      kind: "entry",
      title: entry.title,
      entryType: entry.entry_type,
      completionStatus: entry.content ? "partial" : "empty",
      parentId: entry.parent_id,
      sortOrder: entry.sort_order,
      children: entry.children.map((c) => addEntryNode(c, depth + 1)),
      depth,
    };
  }

  for (const root of entryTree) {
    items.push(addEntryNode(root, 0));
  }

  return items;
}

function flattenTree(items: TreeItem[], expandedIds: Set<string>): TreeItem[] {
  const flat: TreeItem[] = [];
  function walk(nodes: TreeItem[]) {
    for (const node of nodes) {
      flat.push(node);
      if (expandedIds.has(node.id) && node.children.length > 0) {
        walk(node.children);
      }
    }
  }
  walk(items);
  return flat;
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

const FreeformTreeView = ({
  elements,
  entries,
  onElementClick,
  onCreateEntry,
  onRenameEntry,
  onDeleteEntry,
  onMoveEntry,
}: FreeformTreeViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Build tree
  const treeItems = useMemo(
    () => buildTreeItems(elements, entries),
    [elements, entries]
  );

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return treeItems;
    const q = searchQuery.toLowerCase();
    function matchesSearch(item: TreeItem): boolean {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.toolDisplayName?.toLowerCase().includes(q)) return true;
      if (item.entryType?.toLowerCase().includes(q)) return true;
      return item.children.some(matchesSearch);
    }
    return treeItems.filter(matchesSearch);
  }, [treeItems, searchQuery]);

  // Flatten for sortable context
  const flatItems = useMemo(
    () => flattenTree(filteredItems, expandedIds),
    [filteredItems, expandedIds]
  );

  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRename = useCallback(
    (id: string, newTitle: string) => {
      // Only entries can be renamed (worksheets rename via their tool page)
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        onRenameEntry(id, newTitle);
      }
    },
    [entries, onRenameEntry]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const item = flatItems.find((i) => i.id === id);
      if (item) {
        setDeleteTarget({ id, title: item.title });
      }
    },
    [flatItems]
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    onDeleteEntry(deleteTarget.id);
    setDeleteTarget(null);
    setIsDeleting(false);
  }, [deleteTarget, onDeleteEntry]);

  const handleOpenInTool = useCallback(
    (id: string, toolType: string) => {
      const el = elements.find((e) => e.id === id);
      if (el) onElementClick(el);
    },
    [elements, onElementClick]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeItem = flatItems.find((i) => i.id === active.id);
      const overItem = flatItems.find((i) => i.id === over.id);
      if (!activeItem || !overItem) return;

      // Only move entries (not worksheets)
      if (activeItem.kind !== "entry") return;

      // Move to same parent as the over item, at its position
      onMoveEntry(
        activeItem.id,
        overItem.parentId,
        overItem.sortOrder
      );
    },
    [flatItems, onMoveEntry]
  );

  const handleCreateFolder = () => {
    onCreateEntry({ title: "New Folder", entryType: "lore", parentId: null });
  };

  const handleCreateEntry = () => {
    onCreateEntry({ title: "New Entry", entryType: "note", parentId: null });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search + Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] uppercase tracking-wider"
          onClick={handleCreateFolder}
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1" />
          Folder
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] uppercase tracking-wider"
          onClick={handleCreateEntry}
        >
          <FilePlus className="w-3.5 h-3.5 mr-1" />
          Entry
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        {flatItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground/60 italic text-center px-4">
              {searchQuery
                ? "No elements match your search."
                : "No entries on file. Create a folder or entry to begin organizing."}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flatItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredItems.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  isOver={false}
                  onSelect={handleSelect}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onToggleExpand={handleToggleExpand}
                  onOpenInTool={handleOpenInTool}
                  expandedIds={expandedIds}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? ""}
        itemType="entry"
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default FreeformTreeView;
