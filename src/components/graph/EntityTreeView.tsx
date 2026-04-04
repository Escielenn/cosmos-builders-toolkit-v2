// ---------------------------------------------------------------------------
// EntityTreeView — Collapsible tree view of the entity hierarchy.
// Builds a tree from parent_entity_id relationships.
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
} from "lucide-react";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  type Entity,
  type CascadeStage,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EntityTreeViewProps {
  entities: Entity[];
  onCreateChild: (parentId: string) => void;
  onDeleteEntity: (entityId: string) => void;
  onReparent: (entityId: string, newParentId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
}

type TreeLayout = "horizontal" | "vertical" | "radial";

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
// Context menu
// ---------------------------------------------------------------------------

interface ContextMenuState {
  entityId: string;
  x: number;
  y: number;
}

function ContextMenu({
  state,
  onClose,
  onCreateChild,
  onDelete,
  onFocus,
}: {
  state: ContextMenuState;
  onClose: () => void;
  onCreateChild: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
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

  const items = [
    {
      label: "Focus in Graph",
      icon: Circle,
      action: () => { onFocus(state.entityId); onClose(); },
    },
    {
      label: "Create Child",
      icon: GitBranchPlus,
      action: () => { onCreateChild(state.entityId); onClose(); },
    },
    {
      label: "Delete",
      icon: Trash2,
      action: () => { onDelete(state.entityId); onClose(); },
      danger: true,
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
        minWidth: 160,
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] font-sans tracking-[0.5px] transition-colors ${
            item.danger
              ? "text-[#FF3366] hover:bg-[#FF3366]/10"
              : "text-tier-2 hover:bg-white/5 hover:text-tier-1"
          }`}
        >
          <item.icon className="w-3 h-3 shrink-0" />
          {item.label}
        </button>
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
}: {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  onCreateChild: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  onFocusEntity: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const entity = node.entity;
  const hasChildren = node.children.length > 0;
  const nodeColor = entity.color ?? ENTITY_TYPE_COLORS[entity.entity_type] ?? "#00D4FF";
  const cascadeColor = CASCADE_STAGE_COLORS[entity.cascade_stage];

  return (
    <div
      className="group flex items-center gap-1 h-8 cursor-pointer select-none"
      style={{ paddingLeft: depth * 24 + 8 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (hasChildren) {
          onToggle(entity.id);
        } else {
          onFocusEntity(entity.id);
        }
      }}
      onContextMenu={(e) => onContextMenu(e, entity.id)}
    >
      {/* Expand/collapse chevron */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0">
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-tier-3" />
          ) : (
            <ChevronRight className="w-3 h-3 text-tier-4" />
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
      <span className="font-heading text-[13px] font-light tracking-wide text-tier-1 truncate max-w-[200px]">
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
        <span className="text-[9px] font-mono text-tier-4">
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
          className="flex items-center justify-center w-5 h-5 text-tier-4 hover:text-teal transition-colors"
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
}: {
  nodes: TreeNode[];
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onCreateChild: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  onFocusEntity: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
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
}: EntityTreeViewProps) {
  const [layout, setLayout] = useState<TreeLayout>("vertical");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Start with root nodes expanded
    const roots = entities
      .filter((e) => !e.parent_entity_id || !entities.some((p) => p.id === e.parent_entity_id));
    return new Set(roots.map((e) => e.id));
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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

  // Count stats
  const rootCount = tree.length;
  const totalCount = entities.length;

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col"
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
                  ? "text-tier-1 bg-white/5"
                  : "text-tier-4 hover:text-tier-2"
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
            className="text-[9px] font-sans uppercase tracking-[1px] text-tier-4 hover:text-tier-2 px-1.5 py-0.5 transition-colors"
          >
            Expand All
          </button>
          <span className="text-tier-5 text-[9px]">/</span>
          <button
            onClick={collapseAll}
            className="text-[9px] font-sans uppercase tracking-[1px] text-tier-4 hover:text-tier-2 px-1.5 py-0.5 transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[9px] font-mono text-tier-4">
            {rootCount} root{rootCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[9px] font-mono text-tier-5">
            {totalCount} total
          </span>
        </div>
      </div>

      {/* Tree body */}
      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] font-sans text-tier-4">
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
        />
      )}
    </div>
  );
}
