import { useState, useCallback, useMemo } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CodexElementRow from "./CodexElementRow";
import CodexContextMenu from "./CodexContextMenu";
import type { CodexElement } from "@/services/world-data";

interface CodexCustomSectionProps {
  elements: CodexElement[];
  activeElementId?: string | null;
  pinnedIds?: Set<string>;
  onElementClick: (element: CodexElement) => void;
  onOpenWiki?: (element: CodexElement) => void;
  onOpenTool?: (element: CodexElement) => void;
  onDelete?: (element: CodexElement) => void;
  onRename?: (element: CodexElement, newTitle: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
  onSticky?: (element: CodexElement) => void;
  onCreateFolder: () => void;
  onCreateEntry: () => void;
}

// Sortable wrapper for each element row
const SortableRow = ({
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
          depth={(element.depth ?? 0) + 1}
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
  );
};

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

  // Sort pinned items first
  const sortedElements = useMemo(() => {
    if (!pinnedIds || pinnedIds.size === 0) return elements;
    return [...elements].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [elements, pinnedIds]);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id && onReorder) {
        onReorder(active.id as string, over.id as string);
      }
    },
    [onReorder]
  );

  return (
    <div className="mb-0.5">
      {/* Section header */}
      <button
        onClick={toggle}
        className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center gap-1.5 px-3 py-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
        )}
        <span className="font-heading text-[9px] uppercase tracking-[3px] text-muted-foreground/50 flex-1">
          Custom
        </span>
        {elements.length > 0 && (
          <span className="font-mono text-[8px] text-muted-foreground/30">
            {elements.length}
          </span>
        )}
      </button>

      {expanded && (
        <div>
          {sortedElements.length === 0 ? (
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground/25 italic">
              No entries on file.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedElements.map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedElements.map((el, idx) => (
                  <SortableRow
                    key={el.id}
                    element={el}
                    isLast={idx === sortedElements.length - 1}
                    isActive={activeElementId === el.id}
                    isPinned={pinnedIds?.has(el.id)}
                    isRenaming={renamingId === el.id}
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
              </SortableContext>
            </DndContext>
          )}

          {/* Create buttons */}
          <div className="flex gap-2 px-3 py-2">
            <button
              onClick={onCreateFolder}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-border/15 text-[10px] font-heading uppercase tracking-wider text-muted-foreground/40 hover:text-primary/60 hover:border-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Folder
            </button>
            <button
              onClick={onCreateEntry}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-border/15 text-[10px] font-heading uppercase tracking-wider text-muted-foreground/40 hover:text-primary/60 hover:border-primary/20 transition-colors"
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
