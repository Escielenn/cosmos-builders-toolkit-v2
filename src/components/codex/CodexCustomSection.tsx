import { useState, useCallback, useMemo, useRef } from "react";
import { ChevronRight, ChevronDown, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import CodexElementRow from "./CodexElementRow";
import CodexContextMenu from "./CodexContextMenu";
import type { CodexElement } from "@/services/world-data";
import { cn } from "@/lib/utils";

interface CodexCustomSectionProps {
  elements: CodexElement[];
  activeElementId?: string | null;
  pinnedIds?: Set<string>;
  onElementClick: (element: CodexElement) => void;
  onOpenWiki?: (element: CodexElement) => void;
  onOpenTool?: (element: CodexElement) => void;
  onDelete?: (element: CodexElement) => void;
  onRename?: (element: CodexElement, newTitle: string) => void;
  onReorder?: (activeId: string, overId: string, dropIntoFolder?: string | null) => void;
  onSticky?: (element: CodexElement) => void;
  onCreateFolder: () => void;
  onCreateEntry: () => void;
}

// Check if element is a folder (entry_type "lore")
function isFolder(el: CodexElement): boolean {
  return el.kind === "entry" && el.type === "lore";
}

// Sortable wrapper for each element row — drag handle only
const SortableRow = ({
  element,
  isLast,
  isActive,
  isPinned,
  isRenaming,
  isFolderDropTarget,
  isFolderExpanded,
  onToggleFolder,
  onElementClick,
  onOpenWiki,
  onOpenTool,
  onDelete,
  onRename,
  onRenameComplete,
  onSticky,
  onTriggerRename,
}: {
  element: CodexElement;
  isLast: boolean;
  isActive: boolean;
  isPinned?: boolean;
  isRenaming?: boolean;
  isFolderDropTarget?: boolean;
  isFolderExpanded?: boolean;
  onToggleFolder?: () => void;
  onElementClick: (element: CodexElement) => void;
  onOpenWiki?: (element: CodexElement) => void;
  onOpenTool?: (element: CodexElement) => void;
  onDelete?: (element: CodexElement) => void;
  onRename?: (element: CodexElement, newTitle: string) => void;
  onRenameComplete?: () => void;
  onSticky?: (element: CodexElement) => void;
  onTriggerRename?: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const folder = isFolder(element);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/sortable flex items-center",
        isFolderDropTarget && "bg-primary/[0.08] outline outline-1 outline-primary/30"
      )}
    >
      {/* Drag handle — only this triggers drag */}
      <button
        type="button"
        className="shrink-0 p-0.5 cursor-grab active:cursor-grabbing text-tier-5 opacity-0 group-hover/sortable:opacity-100 transition-opacity touch-none"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Folder expand/collapse chevron */}
      {folder && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFolder?.();
          }}
          className="shrink-0 p-0.5 text-tier-4 hover:text-tier-2 transition-colors"
          aria-label={isFolderExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isFolderExpanded ? (
            <ChevronDown className="w-2.5 h-2.5" />
          ) : (
            <ChevronRight className="w-2.5 h-2.5" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <CodexContextMenu
          element={element}
          onOpenWiki={onOpenWiki}
          onOpenTool={onOpenTool}
          onDelete={onDelete}
          onRename={onRename && element.kind === "entry" ? () => onTriggerRename?.(element.id) : undefined}
          onSticky={onSticky}
          isPinned={isPinned}
        >
          <CodexElementRow
            element={element}
            depth={folder ? 1 : (element.depth ?? 0) + 1}
            isLast={isLast}
            isActive={isActive}
            isPinned={isPinned}
            onClick={onElementClick}
            onRename={onRename}
            isRenaming={isRenaming}
            onRenameComplete={onRenameComplete}
          />
        </CodexContextMenu>
      </div>
    </div>
  );
};

// Child entry inside a folder (not sortable — just displays)
const ChildRow = ({
  element,
  isLast,
  isActive,
  isPinned,
  isRenaming,
  onElementClick,
  onOpenWiki,
  onOpenTool,
  onDelete,
  onRename,
  onRenameComplete,
  onSticky,
  onTriggerRename,
}: {
  element: CodexElement;
  isLast: boolean;
  isActive: boolean;
  isPinned?: boolean;
  isRenaming?: boolean;
  onElementClick: (element: CodexElement) => void;
  onOpenWiki?: (element: CodexElement) => void;
  onOpenTool?: (element: CodexElement) => void;
  onDelete?: (element: CodexElement) => void;
  onRename?: (element: CodexElement, newTitle: string) => void;
  onRenameComplete?: () => void;
  onSticky?: (element: CodexElement) => void;
  onTriggerRename?: (id: string) => void;
}) => {
  return (
    <div className="group/sortable flex items-center">
      {/* Spacer to align with drag handle + chevron width */}
      <div className="shrink-0 w-[34px]" />

      <div className="flex-1 min-w-0">
        <CodexContextMenu
          element={element}
          onOpenWiki={onOpenWiki}
          onOpenTool={onOpenTool}
          onDelete={onDelete}
          onRename={onRename && element.kind === "entry" ? () => onTriggerRename?.(element.id) : undefined}
          onSticky={onSticky}
          isPinned={isPinned}
        >
          <CodexElementRow
            element={element}
            depth={2}
            isLast={isLast}
            isActive={isActive}
            isPinned={isPinned}
            onClick={onElementClick}
            onRename={onRename}
            isRenaming={isRenaming}
            onRenameComplete={onRenameComplete}
          />
        </CodexContextMenu>
      </div>
    </div>
  );
};

// Static preview row shown in DragOverlay (no interactivity needed)
const DragPreviewRow = ({ element }: { element: CodexElement }) => (
  <div className="flex items-center gap-1.5 px-3 py-[3px] bg-sf-surface-elevated border border-primary/20 shadow-lg shadow-primary/5">
    <GripVertical className="w-3 h-3 text-primary/60 shrink-0" />
    <span className="text-[12px] text-t1 truncate">
      {element.title}
    </span>
  </div>
);

const CodexCustomSection = ({
  elements,
  activeElementId,
  pinnedIds,
  onElementClick,
  onOpenWiki,
  onOpenTool,
  onDelete,
  onRename,
  onReorder,
  onSticky,
  onCreateFolder,
  onCreateEntry,
}: CodexCustomSectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [folderDropTargetId, setFolderDropTargetId] = useState<string | null>(null);
  const folderDropRef = useRef<string | null>(null);

  // Track which folders are expanded — persist per session
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set());

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Separate top-level items from children (depth > 0)
  const { topLevel, childrenByParent } = useMemo(() => {
    const top: CodexElement[] = [];
    const byParent = new Map<string, CodexElement[]>();

    for (const el of elements) {
      if ((el.depth ?? 0) === 0) {
        top.push(el);
      } else {
        // Find parent: it's the last folder in topLevel before this element
        // Since elements are pre-flattened in tree order, walk backwards
        // Actually, we need a different approach — scan to find the parent
        // The elements array is flattened depth-first, so the parent is the
        // most recent depth-0 folder before this element
      }
    }

    // Better approach: walk in order, tracking current parent
    top.length = 0;
    byParent.clear();
    let currentParentId: string | null = null;

    for (const el of elements) {
      if ((el.depth ?? 0) === 0) {
        top.push(el);
        if (isFolder(el)) {
          currentParentId = el.id;
        } else {
          currentParentId = null;
        }
      } else if (currentParentId) {
        const children = byParent.get(currentParentId) ?? [];
        children.push(el);
        byParent.set(currentParentId, children);
      }
    }

    return { topLevel: top, childrenByParent: byParent };
  }, [elements]);

  // Sort pinned items first among top-level
  const sortedTopLevel = useMemo(() => {
    if (!pinnedIds || pinnedIds.size === 0) return topLevel;
    return [...topLevel].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [topLevel, pinnedIds]);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
    folderDropRef.current = null;
    setFolderDropTargetId(null);
  }, []);

  // Detect when dragging over a folder — use ref to survive re-renders
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, active } = event;
      if (!over || !active) {
        folderDropRef.current = null;
        setFolderDropTargetId(null);
        return;
      }

      const overId = over.id as string;
      const activeId = active.id as string;

      // Find the element being hovered over
      const overEl = sortedTopLevel.find((el) => el.id === overId);
      const activeEl = sortedTopLevel.find((el) => el.id === activeId);

      // Only allow drop-into if dragging a non-folder onto a folder
      if (overEl && isFolder(overEl) && overId !== activeId && (!activeEl || !isFolder(activeEl))) {
        folderDropRef.current = overId;
        setFolderDropTargetId(overId);
      } else {
        folderDropRef.current = null;
        setFolderDropTargetId(null);
      }
    },
    [sortedTopLevel]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      // Read from ref — stable across re-renders during drag
      const dropTarget = folderDropRef.current;
      setDraggingId(null);
      folderDropRef.current = null;
      setFolderDropTargetId(null);

      if (!over || !onReorder) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // If dropping onto a folder (highlighted via ref), move into folder
      if (dropTarget && dropTarget !== activeId) {
        onReorder(activeId, overId, dropTarget);
        // Auto-expand the folder so user can see the result
        setExpandedFolders((prev) => new Set(prev).add(dropTarget));
        return;
      }

      // Otherwise, normal reorder (sibling swap)
      if (activeId !== overId) {
        onReorder(activeId, overId, null);
      }
    },
    [onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setDraggingId(null);
    folderDropRef.current = null;
    setFolderDropTargetId(null);
  }, []);

  const draggingElement = draggingId
    ? elements.find((el) => el.id === draggingId)
    : null;

  return (
    <div className="mb-0.5">
      {/* Section header */}
      <button
        onClick={toggle}
        className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center gap-1.5 px-3 py-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-2.5 h-2.5 text-t3/40 shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-t3/40 shrink-0" />
        )}
        <span className="font-heading text-[11px] uppercase tracking-[3px] text-t3/50 flex-1">
          Custom
        </span>
        {elements.length > 0 && (
          <span className="font-mono text-[10px] text-t3/30">
            {elements.length}
          </span>
        )}
      </button>

      {expanded && (
        <div>
          {sortedTopLevel.length === 0 ? (
            <p className="px-3 py-1.5 text-[10px] text-t3/25 italic">
              No entries on file.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={sortedTopLevel.map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedTopLevel.map((el, idx) => {
                  const folder = isFolder(el);
                  const folderExpanded = folder && expandedFolders.has(el.id);
                  const children = folder ? (childrenByParent.get(el.id) ?? []) : [];

                  return (
                    <div key={el.id}>
                      <SortableRow
                        element={el}
                        isLast={idx === sortedTopLevel.length - 1 && children.length === 0}
                        isActive={activeElementId === el.id}
                        isPinned={pinnedIds?.has(el.id)}
                        isRenaming={renamingId === el.id}
                        isFolderDropTarget={folderDropTargetId === el.id}
                        isFolderExpanded={folderExpanded}
                        onToggleFolder={folder ? () => toggleFolder(el.id) : undefined}
                        onElementClick={onElementClick}
                        onOpenWiki={onOpenWiki}
                        onOpenTool={onOpenTool}
                        onDelete={onDelete}
                        onRename={onRename}
                        onRenameComplete={() => setRenamingId(null)}
                        onTriggerRename={setRenamingId}
                        onSticky={onSticky}
                      />

                      {/* Folder children — shown when expanded */}
                      {folder && folderExpanded && children.length > 0 && (
                        <div className="border-l border-sf-border ml-[18px]">
                          {children.map((child, cidx) => (
                            <ChildRow
                              key={child.id}
                              element={child}
                              isLast={cidx === children.length - 1}
                              isActive={activeElementId === child.id}
                              isPinned={pinnedIds?.has(child.id)}
                              isRenaming={renamingId === child.id}
                              onElementClick={onElementClick}
                              onOpenWiki={onOpenWiki}
                              onOpenTool={onOpenTool}
                              onDelete={onDelete}
                              onRename={onRename}
                              onRenameComplete={() => setRenamingId(null)}
                              onTriggerRename={setRenamingId}
                              onSticky={onSticky}
                            />
                          ))}
                        </div>
                      )}

                      {/* Empty folder hint */}
                      {folder && folderExpanded && children.length === 0 && (
                        <div className="ml-[18px] border-l border-sf-border px-3 py-1">
                          <span className="text-[10px] text-t3/20 italic">
                            Drag entries here
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </SortableContext>

              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {draggingElement ? (
                  <DragPreviewRow element={draggingElement} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* Create buttons */}
          <div className="flex gap-2 px-3 py-2">
            <button
              onClick={onCreateFolder}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-border/15 text-[10px] font-heading uppercase tracking-wider text-t3/40 hover:text-primary/60 hover:border-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Folder
            </button>
            <button
              onClick={onCreateEntry}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-border/15 text-[10px] font-heading uppercase tracking-wider text-t3/40 hover:text-primary/60 hover:border-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodexCustomSection;
