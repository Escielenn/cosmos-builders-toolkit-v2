import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import {
  CASCADE_STAGE_COLORS,
  type CascadeStage,
  type ConnectionStatus,
  formatRelationshipType,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Data shape attached to each React Flow edge
// ---------------------------------------------------------------------------

export interface CascadeEdgeData {
  connectionId: string;
  relationshipType: string;
  relationshipLabel: string | null;
  cascadeStage: string;
  bidirectional: boolean;
  strength: number;
  status: ConnectionStatus;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function strokeWidthFromStrength(strength: number): number {
  if (strength <= 3) return 1;
  if (strength <= 6) return 2;
  if (strength <= 9) return 3;
  return 4;
}

function strokeDashFromStatus(status: ConnectionStatus): string | undefined {
  switch (status) {
    case "historical":
      return "4 4";
    case "potential":
      return "2 4";
    case "severed":
      return "6 3";
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CascadeEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps) => {
    const [hovered, setHovered] = useState(false);
    const d = data as unknown as CascadeEdgeData | undefined;

    const cascadeStage = (d?.cascadeStage ?? "culture") as CascadeStage;
    const stageColor =
      CASCADE_STAGE_COLORS[cascadeStage] ?? CASCADE_STAGE_COLORS.culture;

    const strength = d?.strength ?? 5;
    const status = d?.status ?? "active";

    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });

    const label =
      d?.relationshipLabel ??
      (d?.relationshipType ? formatRelationshipType(d.relationshipType) : "");

    const isActive = hovered || selected;
    const strokeOpacity = isActive ? 0.9 : 0.6;
    const strokeWidth = strokeWidthFromStrength(strength);

    return (
      <>
        {/* Visible edge */}
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: stageColor,
            strokeWidth: isActive ? strokeWidth + 1 : strokeWidth,
            strokeOpacity,
            strokeDasharray: strokeDashFromStatus(status),
            filter:
              strength === 10
                ? `drop-shadow(0 0 4px ${stageColor}44)`
                : undefined,
          }}
          markerEnd={
            d?.bidirectional ? undefined : `url(#arrow-${cascadeStage})`
          }
        />

        {/* Wider invisible hit area */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />

        {/* Severed X marker at midpoint */}
        {status === "severed" && (
          <EdgeLabelRenderer>
            <div
              className="absolute pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              }}
            >
              <span
                className="text-[12px] font-mono font-medium"
                style={{ color: "#FF3366" }}
              >
                X
              </span>
            </div>
          </EdgeLabelRenderer>
        )}

        {/* Label on hover */}
        {isActive && label && (
          <EdgeLabelRenderer>
            <div
              className="absolute pointer-events-none px-1.5 py-0.5"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 12}px)`,
                background: "#0A0E17",
                border: `1px solid ${stageColor}33`,
                borderRadius: 3,
              }}
            >
              <span
                className="text-[10px] font-sans"
                style={{ color: `${stageColor}99` }}
              >
                {label}
              </span>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

CascadeEdge.displayName = "CascadeEdge";

export default CascadeEdge;
