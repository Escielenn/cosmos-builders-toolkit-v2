// ---------------------------------------------------------------------------
// EntityTreeView — Collapsible tree view of the entity hierarchy.
// Builds a tree from parent_entity_id relationships.
// Supports drag-to-reparent and entity detail side panel.
// ---------------------------------------------------------------------------

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  GitBranchPlus,
  TreePine,
  AlignVerticalSpaceAround,
  Circle,
  X,
  Pencil,
  Unlink,
} from "lucide-react";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  type Entity,
  type CascadeStage,
} from "@/services/entity-graph-types";
import { EntityHistory } from "@/components/world/EntityHistory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EntityTreeViewProps {
  entities: Entity[];
  onCreateChild: (parentId: string) => void;
  onDeleteEntity: (entityId: string) => void;
  onReparent: (entityId: string, newParentId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
  onEditEntity?: (entityId: string) => void;
}

type TreeLayout = "horizontal" | "vertical" | "radial";

// ---------------------------------------------------------------------------
// Drag-and-drop state (shared via props through tree)
// ---------------------------------------------------------------------------

interface DragState {
  draggedId: string | null;
  dragOverId: string | null;
  dragOverValid: boolean;
}

interface TreeNode {
  entity: Entity;
  children: TreeNode[];
}

// ---------------------------------------------------------------------------
// Build tree from flat entity list
// ---------------------------------------------------------------------------

function buildTree(entities: Entity[]): TreeNode[] {
  const entityMap = new Map<string, Entity>();
  const childrenMap = new Map<string, Entity[]>();

  for (const e of entities) {
    entityMap.set(e.id, e);
    const parentId = e.parent_entity_id ?? "__root__";
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(e);
  }

  function buildSubtree(entity: Entity): TreeNode {
    const children = (childrenMap.get(entity.id) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    return {
      entity,
      children: children.map(buildSubtree),
    };
  }

  // Root nodes: parent_entity_id is null OR parent doesn't exist in entities
  const roots = entities
    .filter((e) => !e.parent_entity_id || !entityMap.has(e.parent_entity_id))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  return roots.map(buildSubtree);
}

// ---------------------------------------------------------------------------
// Descendant check — prevents circular reparenting
// ---------------------------------------------------------------------------

function isDescendant(
  entityId: string,
  potentialAncestorId: string,
  entities: Entity[]
): boolean {
  const entityMap = new Map<string, Entity>();
  for (const e of entities) entityMap.set(e.id, e);

  let current = entityMap.get(entityId);
  while (current) {
    if (current.parent_entity_id === potentialAncestorId) return true;
    if (!current.parent_entity_id) break;
    current = entityMap.get(current.parent_entity_id);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Entity Detail Side Panel
// ---------------------------------------------------------------------------

function EntityDetailPanel({
  entity,
  entities,
  onClose,
  onEdit,
  onDelete,
  onReparent,
}: {
  entity: Entity;
  entities: Entity[];
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  onReparent: (id: string, newParentId: string | null) => void;
}) {
  const nodeColor =
    entity.color ?? ENTITY_TYPE_COLORS[entity.entity_type] ?? "#00D4FF";
  const cascadeColor = CASCADE_STAGE_COLORS[entity.cascade_stage];
  const parentEntity = entity.parent_entity_id
    ? entities.find((e) => e.id === entity.parent_entity_id)
    : null;
  const childCount = entities.filter(
    (e) => e.parent_entity_id === entity.id
  ).length;

  return (
    <div
      className="absolute top-0 right-0 h-full z-40 flex flex-col"
      style={{
        width: 280,
        background: "rgba(14, 19, 32, 0.96)",
        backdropFilter: "blur(16px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        animation: "slideInRight 200ms ease-out",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-[10px] font-sans font-medium uppercase tracking-[1.5px] text-t3">
          Entity Details
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 text-t4 hover:text-t2 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Entity name */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: nodeColor }}
            />
            <span className="font-heading text-lg font-light tracking-wide text-t1 truncate">
              {entity.name}
            </span>
          </div>
        </div>

        {/* Type + Cascade badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-sans font-medium uppercase tracking-[1px] px-2 py-0.5"
            style={{
              background: `${nodeColor}0F`,
              border: `1px solid ${nodeColor}26`,
              color: nodeColor,
              borderRadius: 3,
            }}
          >
            {ENTITY_TYPE_LABELS[entity.entity_type]}
          </span>
          <span
            className="text-[9px] font-mono uppercase tracking-[0.8px] px-2 py-0.5"
            style={{
              background: `${cascadeColor}0F`,
              border: `1px solid ${cascadeColor}26`,
              color: cascadeColor,
              borderRadius: 3,
            }}
          >
            {CASCADE_STAGE_LABELS[entity.cascade_stage]}
          </span>
        </div>

        {/* Summary */}
        {entity.summary && (
          <div>
            <label className="block text-[10px] font-sans font-medium uppercase tracking-[1.5px] text-t3 mb-1.5">
              Summary
            </label>
            <p className="text-[12px] font-sans text-t2 leading-relaxed">
              {entity.summary}
            </p>
          </div>
        )}

        {/* Description */}
        {entity.description && (
          <div>
            <label className="block text-[10px] font-sans font-medium uppercase tracking-[1.5px] text-t3 mb-1.5">
              Description
            </label>
            <p className="text-[12px] font-sans text-t2 leading-relaxed whitespace-pre-wrap">
              {entity.description}
            </p>
          </div>
        )}

        {/* Parent entity */}
        <div>
          <label className="block text-[10px] font-sans font-medium uppercase tracking-[1.5px] text-t3 mb-1.5">
            Parent
          </label>
          {parentEntity ? (
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background:
                    parentEntity.color ??
                    ENTITY_TYPE_COLORS[parentEntity.entity_type] ??
                    "#00D4FF",
                }}
              />
              <span className="text-[12px] font-heading text-t2 truncate">
                {parentEntity.name}
              </span>
              <button
                onClick={() => onReparent(entity.id, null)}
                className="text-[9px] font-sans text-[#FF3366] hover:text-[#FF3366]/80 uppercase tracking-[0.5px] ml-auto shrink-0 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-sans text-t4 italic">
              Root entity (no parent)
            </span>
          )}
        </div>

        {/* Child count */}
        <div>
          <label className="block text-[10px] font-sans font-medium uppercase tracking-[1.5px] text-t3 mb-1.5">
            Children
          </label>
          <span className="text-[13px] font-mono text-t2">
            {childCount}
          </span>
        </div>

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div>
            <label className="block text-[10px] font-sans font-medium uppercase tracking-[1.5px] text-t3 mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-1.5 py-0.5 text-t3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 3,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <EntityHistory
          createdAt={entity.created_at}
          updatedAt={entity.updated_at}
          className="pt-3 border-t border-white/[0.04]"
        />
      </div>

      {/* Panel footer actions */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {onEdit && (
          <button
            onClick={() => onEdit(entity.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans font-medium text-t2 hover:text-t1 transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
        <button
          onClick={() => onDelete(entity.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans font-medium text-[#FF3366] hover:bg-[#FF3366]/10 transition-colors ml-auto"
          style={{
            background: "rgba(255, 51, 102, 0.04)",
            border: "1px solid rgba(255, 51, 102, 0.15)",
          }}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------

interface ContextMenuState {
  entityId: string;
  x: number;
  y: number;
}

interface ContextMenuItem {
  label: string;
  icon: typeof Circle;
  action: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
}

function ContextMenu({
  state,
  onClose,
  onCreateChild,
  onDelete,
  onFocus,
  onSelectEntity,
  onReparent,
  hasParent,
}: {
  state: ContextMenuState;
  onClose: () => void;
  onCreateChild: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
  onSelectEntity: (id: string) => void;
  onReparent: (id: string, newParentId: string | null) => void;
  hasParent: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const items: ContextMenuItem[] = [
    {
      label: "Focus in Graph",
      icon: Circle,
      action: () => { onFocus(state.entityId); onClose(); },
    },
    {
      label: "Edit Entity",
      icon: Pencil,
      action: () => { onSelectEntity(state.entityId); onClose(); },
    },
    {
      label: "Create Child",
      icon: GitBranchPlus,
      action: () => { onCreateChild(state.entityId); onClose(); },
    },
    ...(hasParent
      ? [
          {
            label: "Remove from Tree",
            icon: Unlink,
            action: () => { onReparent(state.entityId, null); onClose(); },
          } as ContextMenuItem,
        ]
      : []),
    {
      label: "Delete Entity",
      icon: Trash2,
      action: () => { onDelete(state.entityId); onClose(); },
      danger: true,
      dividerBefore: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: state.x,
        top: state.y,
        background: "rgba(14, 19, 32, 0.96)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "4px 0",
        minWidth: 180,
      }}
    >
      {items.map((item) => (
        <div key={item.label}>
          {item.dividerBefore && (
            <div
              className="my-1"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            />
          )}
          <button
            onClick={item.action}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] font-sans tracking-[0.5px] transition-colors ${
              item.danger
                ? "text-[#FF3366] hover:bg-[#FF3366]/10"
                : "text-t2 hover:bg-white/5 hover:text-t1"
            }`}
          >
            <item.icon className="w-3 h-3 shrink-0" />
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single tree node row
// ---------------------------------------------------------------------------

function TreeNodeRow({
  node,
  depth,
  expanded,
  onToggle,
  onCreateChild,
  onDeleteEntity,
  onFocusEntity,
  onContextMenu,
  onSelectEntity,
  dragState,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isSelected,
}: {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  onCreateChild: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  onFocusEntity: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onSelectEntity: (id: string) => void;
  dragState: DragState;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const entity = node.entity;
  const hasChildren = node.children.length > 0;
  const nodeColor = entity.color ?? ENTITY_TYPE_COLORS[entity.entity_type] ?? "#00D4FF";
  const cascadeColor = CASCADE_STAGE_COLORS[entity.cascade_stage];

  const isDragged = dragState.draggedId === entity.id;
  const isDragTarget = dragState.dragOverId === entity.id;
  const isDragTargetValid = isDragTarget && dragState.dragOverValid;
  const isDragTargetInvalid = isDragTarget && !dragState.dragOverValid;

  // Compute border style for drag feedback
  let borderStyle = "1px solid transparent";
  if (isSelected) {
    borderStyle = "1px solid rgba(0, 212, 255, 0.3)";
  }
  if (isDragTargetValid) {
    borderStyle = "1px solid #00D4FF";
  } else if (isDragTargetInvalid) {
    borderStyle = "1px solid #FF3366";
  }

  return (
    <div
      className="group flex items-center gap-1 h-8 cursor-pointer select-none transition-all duration-150"
      style={{
        paddingLeft: depth * 24 + 8,
        opacity: isDragged ? 0.5 : 1,
        boxShadow: isDragged ? "0 4px 12px rgba(0,0,0,0.4)" : "none",
        border: borderStyle,
        background: isDragTargetValid
          ? "rgba(0, 212, 255, 0.04)"
          : isDragTargetInvalid
          ? "rgba(255, 51, 102, 0.04)"
          : isSelected
          ? "rgba(0, 212, 255, 0.03)"
          : "transparent",
        cursor: isDragTargetInvalid ? "not-allowed" : "pointer",
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", entity.id);
        onDragStart(entity.id);
      }}
      onDragOver={(e) => onDragOver(e, entity.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, entity.id)}
      onDragEnd={onDragLeave}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        // If clicking the chevron area, toggle expand
        const target = e.target as HTMLElement;
        if (target.closest("[data-chevron]")) {
          onToggle(entity.id);
          return;
        }
        // Otherwise select the entity to show detail panel
        onSelectEntity(entity.id);
      }}
      onContextMenu={(e) => onContextMenu(e, entity.id)}
    >
      {/* Expand/collapse chevron */}
      <span
        className="w-4 h-4 flex items-center justify-center shrink-0"
        data-chevron
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggle(entity.id);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-t3" />
          ) : (
            <ChevronRight className="w-3 h-3 text-t4" />
          )
        ) : (
          <span className="w-1 h-1 rounded-full bg-tier-5" />
        )}
      </span>

      {/* Color dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: nodeColor }}
      />

      {/* Entity name */}
      <span className="font-heading text-[13px] font-light tracking-wide text-t1 truncate max-w-[200px]">
        {entity.name}
      </span>

      {/* Entity type label */}
      <span
        className="text-[9px] font-sans font-medium uppercase tracking-[1px] shrink-0"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {ENTITY_TYPE_LABELS[entity.entity_type]}
      </span>

      {/* Cascade stage badge */}
      <span
        className="text-[8px] font-mono uppercase tracking-[0.8px] px-1.5 py-0.5 shrink-0"
        style={{
          background: `${cascadeColor}0F`,
          border: `1px solid ${cascadeColor}26`,
          color: cascadeColor,
          borderRadius: 3,
        }}
      >
        {CASCADE_STAGE_LABELS[entity.cascade_stage]}
      </span>

      {/* Child count */}
      {hasChildren && (
        <span className="text-[9px] font-mono text-t4">
          {node.children.length}
        </span>
      )}

      {/* Add child button on hover */}
      <span
        className="ml-auto shrink-0 transition-opacity duration-150"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateChild(entity.id);
          }}
          className="flex items-center justify-center w-5 h-5 text-t4 hover:text-teal transition-colors"
          title="Add child entity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recursive tree renderer
// ---------------------------------------------------------------------------

function TreeBranch({
  nodes,
  depth,
  expandedIds,
  onToggle,
  onCreateChild,
  onDeleteEntity,
  onFocusEntity,
  onContextMenu,
  onSelectEntity,
  dragState,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  selectedEntityId,
}: {
  nodes: TreeNode[];
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onCreateChild: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  onFocusEntity: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onSelectEntity: (id: string) => void;
  dragState: DragState;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  selectedEntityId: string | null;
}) {
  return (
    <>
      {nodes.map((node) => {
        const isExpanded = expandedIds.has(node.entity.id);
        return (
          <div key={node.entity.id}>
            <TreeNodeRow
              node={node}
              depth={depth}
              expanded={isExpanded}
              onToggle={onToggle}
              onCreateChild={onCreateChild}
              onDeleteEntity={onDeleteEntity}
              onFocusEntity={onFocusEntity}
              onContextMenu={onContextMenu}
              onSelectEntity={onSelectEntity}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isSelected={selectedEntityId === node.entity.id}
            />
            {isExpanded && node.children.length > 0 && (
              <div
                className="relative"
                style={{
                  borderLeft: "1px solid rgba(255,255,255,0.04)",
                  marginLeft: depth * 24 + 20,
                }}
              >
                <TreeBranch
                  nodes={node.children}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onCreateChild={onCreateChild}
                  onDeleteEntity={onDeleteEntity}
                  onFocusEntity={onFocusEntity}
                  onContextMenu={onContextMenu}
                  onSelectEntity={onSelectEntity}
                  dragState={dragState}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  selectedEntityId={selectedEntityId}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EntityTreeView({
  entities,
  onCreateChild,
  onDeleteEntity,
  onReparent,
  onFocusEntity,
  onEditEntity,
}: EntityTreeViewProps) {
  const [layout, setLayout] = useState<TreeLayout>("vertical");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Start with root nodes expanded
    const roots = entities
      .filter((e) => !e.parent_entity_id || !entities.some((p) => p.id === e.parent_entity_id));
    return new Set(roots.map((e) => e.id));
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Drag-and-drop state
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    dragOverId: null,
    dragOverValid: true,
  });

  const tree = useMemo(() => buildTree(entities), [entities]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(entities.map((e) => e.id)));
  }, [entities]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, entityId: string) => {
      e.preventDefault();
      setContextMenu({ entityId, x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleSelectEntity = useCallback((id: string) => {
    setSelectedEntityId((prev) => (prev === id ? null : id));
  }, []);

  // --- Drag handlers ---

  const handleDragStart = useCallback((id: string) => {
    setDragState({ draggedId: id, dragOverId: null, dragOverValid: true });
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragState((prev) => {
        if (!prev.draggedId || prev.draggedId === targetId) {
          return { ...prev, dragOverId: targetId, dragOverValid: false };
        }
        // Check if target is a descendant of dragged entity (invalid — would create cycle)
        const wouldCreateCycle = isDescendant(targetId, prev.draggedId, entities);
        e.dataTransfer.dropEffect = wouldCreateCycle ? "none" : "move";
        return {
          ...prev,
          dragOverId: targetId,
          dragOverValid: !wouldCreateCycle,
        };
      });
    },
    [entities]
  );

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({ ...prev, dragOverId: null, dragOverValid: true }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const draggedId = dragState.draggedId;
      setDragState({ draggedId: null, dragOverId: null, dragOverValid: true });

      if (!draggedId || draggedId === targetId) return;

      // Prevent circular: can't drop onto own descendant
      if (isDescendant(targetId, draggedId, entities)) return;

      onReparent(draggedId, targetId);
    },
    [dragState.draggedId, entities, onReparent]
  );

  const handleDropOnEmpty = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const draggedId = dragState.draggedId;
      setDragState({ draggedId: null, dragOverId: null, dragOverValid: true });
      if (draggedId) {
        onReparent(draggedId, null);
      }
    },
    [dragState.draggedId, onReparent]
  );

  // Selected entity for detail panel
  const selectedEntity = selectedEntityId
    ? entities.find((e) => e.id === selectedEntityId) ?? null
    : null;

  // Context menu entity to check if it has a parent
  const contextMenuEntity = contextMenu
    ? entities.find((e) => e.id === contextMenu.entityId)
    : null;

  // Count stats
  const rootCount = tree.length;
  const totalCount = entities.length;

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col relative"
      style={{ background: "#0A0E17" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{
          background: "rgba(14, 19, 32, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Layout toggle */}
        <div
          className="flex items-center gap-0.5 p-0.5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {([
            { key: "horizontal" as TreeLayout, icon: AlignVerticalSpaceAround, label: "Horizontal" },
            { key: "vertical" as TreeLayout, icon: TreePine, label: "Vertical" },
            { key: "radial" as TreeLayout, icon: Circle, label: "Radial" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setLayout(key)}
              className={`flex items-center gap-1 px-2 py-1 text-[9px] font-sans uppercase tracking-[1px] transition-colors ${
                layout === key
                  ? "text-t1 bg-white/5"
                  : "text-t4 hover:text-t2"
              }`}
              title={label}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Expand / collapse */}
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="text-[9px] font-sans uppercase tracking-[1px] text-t4 hover:text-t2 px-1.5 py-0.5 transition-colors"
          >
            Expand All
          </button>
          <span className="text-t5 text-[9px]">/</span>
          <button
            onClick={collapseAll}
            className="text-[9px] font-sans uppercase tracking-[1px] text-t4 hover:text-t2 px-1.5 py-0.5 transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[9px] font-mono text-t4">
            {rootCount} root{rootCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[9px] font-mono text-t5">
            {totalCount} total
          </span>
        </div>
      </div>

      {/* Tree body — acts as drop zone for "make root" when dropping on empty space */}
      <div
        className="flex-1 overflow-y-auto py-2"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={handleDropOnEmpty}
      >
        {tree.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] font-sans text-t4">
              No entities yet. Create one to begin.
            </p>
          </div>
        ) : (
          <TreeBranch
            nodes={tree}
            depth={0}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onCreateChild={onCreateChild}
            onDeleteEntity={onDeleteEntity}
            onFocusEntity={onFocusEntity}
            onContextMenu={handleContextMenu}
            onSelectEntity={handleSelectEntity}
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            selectedEntityId={selectedEntityId}
          />
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onCreateChild={onCreateChild}
          onDelete={onDeleteEntity}
          onFocus={onFocusEntity}
          onSelectEntity={handleSelectEntity}
          onReparent={onReparent}
          hasParent={!!contextMenuEntity?.parent_entity_id}
        />
      )}

      {/* Entity detail side panel */}
      {selectedEntity && (
        <EntityDetailPanel
          entity={selectedEntity}
          entities={entities}
          onClose={() => setSelectedEntityId(null)}
          onEdit={onEditEntity}
          onDelete={(id) => {
            onDeleteEntity(id);
            setSelectedEntityId(null);
          }}
          onReparent={onReparent}
        />
      )}
    </div>
  );
}
