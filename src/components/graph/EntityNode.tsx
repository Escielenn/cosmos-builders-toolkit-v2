import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Pin } from "lucide-react";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type EntityType,
  type CascadeStage,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Data shape attached to each React Flow node
// ---------------------------------------------------------------------------

export interface EntityNodeData {
  entityId: string;
  label: string;
  entityType: EntityType;
  cascadeStage: CascadeStage;
  color: string | null;
  summary: string | null;
  pinned: boolean;
  connectionCount: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EntityNode = memo(({ data, selected }: NodeProps) => {
  const d = data as unknown as EntityNodeData;
  const nodeColor = d.color ?? ENTITY_TYPE_COLORS[d.entityType] ?? "#15C17B";

  return (
    <div
      className="relative group transition-all duration-200"
      style={{
        width: 160,
        minHeight: 90,
        background: "rgba(21, 21, 24, 0.95)",
        border: `1px solid ${selected ? nodeColor : "rgba(255,255,255,0.08)"}`,
        borderLeft: `3px solid ${nodeColor}`,
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: selected
          ? `0 0 20px ${nodeColor}33`
          : "none",
      }}
    >
      {/* Connection handles, visible on hover */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !border-0 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: `${nodeColor}66` }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-0 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: `${nodeColor}66` }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-0 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: `${nodeColor}66` }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border-0 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: `${nodeColor}66` }}
      />

      {/* Pinned indicator */}
      {d.pinned && (
        <Pin
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5"
          style={{ color: `${nodeColor}88` }}
        />
      )}

      {/* Entity type label */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: nodeColor }}
        />
        <span
          className="text-[12px] font-sans font-medium uppercase tracking-[1.2px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {ENTITY_TYPE_LABELS[d.entityType] ?? d.entityType}
        </span>
      </div>

      {/* Entity name */}
      <div
        className="font-heading text-sm font-light tracking-wide leading-tight mb-1"
        style={{ color: "#FAFAFA" }}
      >
        {d.label}
      </div>

      {/* Summary */}
      {d.summary && (
        <div
          className="text-[12px] font-sans leading-snug line-clamp-2"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {d.summary}
        </div>
      )}

      {/* Connection count */}
      {d.connectionCount > 0 && (
        <div
          className="mt-1.5 text-[12px] font-mono"
          style={{ color: `${nodeColor}99` }}
        >
          {d.connectionCount} connection{d.connectionCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
});

EntityNode.displayName = "EntityNode";

export default EntityNode;
