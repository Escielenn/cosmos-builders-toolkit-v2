import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FileText, Folder, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import TreeContextMenu from "./TreeContextMenu";
import type { CompletionStatus } from "@/services/world-data";

export interface TreeItem {
  id: string;
  kind: "worksheet" | "entry";
  title: string;
  toolType?: string;
  toolDisplayName?: string;
  entryType?: string;
  completionStatus: CompletionStatus;
  parentId: string | null;
  sortOrder: number;
  children: TreeItem[];
  depth: number;
}

interface TreeNodeProps {
  item: TreeItem;
  isSelected: boolean;
  isOver: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onOpenInTool: (id: string, toolType: string) => void;
  expandedIds: Set<string>;
}

const TreeNode = ({
  item,
  isSelected,
  isOver,
  onSelect,
  onRename,
  onDelete,
  onToggleExpand,
  onOpenInTool,
  expandedIds,
}: TreeNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${item.depth * 20 + 8}px`,
  };

  const isExpanded = expandedIds.has(item.id);
  const hasChildren = item.children.length > 0;
  const isFolder = item.entryType === "lore" && hasChildren;

  const handleDoubleClick = () => {
    if (item.kind === "worksheet" && item.toolType) {
      onOpenInTool(item.id, item.toolType);
    } else {
      setIsEditing(true);
      setEditValue(item.title);
    }
  };

  const handleRenameSubmit = () => {
    if (editValue.trim() && editValue.trim() !== item.title) {
      onRename(item.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") setIsEditing(false);
  };

  const completionDot = (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        item.completionStatus === "complete" && "bg-primary",
        item.completionStatus === "partial" && "bg-amber-400",
        item.completionStatus === "empty" && "border border-muted-foreground/40"
      )}
    />
  );

  const nodeContent = (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 py-1 pr-2 transition-colors",
        "hover:bg-accent/10",
        isSelected && "bg-primary/10",
        isOver && "bg-primary/5 border-t border-primary/30",
        isDragging && "opacity-50"
      )}
      onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-40 transition-opacity"
      >
        <GripVertical className="w-3 h-3" />
      </span>

      {/* Expand/collapse toggle */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(item.id);
          }}
          className="shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      ) : (
        <span className="w-3.5" />
      )}

      {/* Icon */}
      {isFolder ? (
        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}

      {/* Completion dot */}
      {completionDot}

      {/* Title */}
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm py-0 px-1"
          autoFocus
        />
      ) : (
        <span className="text-sm truncate flex-1">{item.title}</span>
      )}

      {/* Tool badge */}
      {item.toolDisplayName && (
        <Badge
          variant="outline"
          className="text-[8px] px-1 py-0 uppercase tracking-wider shrink-0 font-mono opacity-60"
        >
          {item.toolDisplayName}
        </Badge>
      )}
    </div>
  );

  return (
    <>
      <TreeContextMenu
        isWorksheet={item.kind === "worksheet"}
        onRename={() => {
          setIsEditing(true);
          setEditValue(item.title);
        }}
        onDelete={() => onDelete(item.id)}
        onOpenInTool={
          item.kind === "worksheet" && item.toolType
            ? () => onOpenInTool(item.id, item.toolType!)
            : undefined
        }
      >
        {nodeContent}
      </TreeContextMenu>

      {/* Render children if expanded */}
      {isExpanded &&
        item.children.map((child) => (
          <TreeNode
            key={child.id}
            item={child}
            isSelected={isSelected}
            isOver={false}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
            onToggleExpand={onToggleExpand}
            onOpenInTool={onOpenInTool}
            expandedIds={expandedIds}
          />
        ))}
    </>
  );
};

export default TreeNode;
