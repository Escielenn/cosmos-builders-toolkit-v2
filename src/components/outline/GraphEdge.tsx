import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import { CONNECTION_TYPE_LABELS, type ConnectionType } from "@/services/world-connections-crud";

export interface GraphEdgeData {
  connectionType: string;
  description?: string | null;
  [key: string]: unknown;
}

const GraphEdgeComponent = memo(
  ({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps) => {
    const [hovered, setHovered] = useState(false);
    const edgeData = data as unknown as GraphEdgeData | undefined;

    const [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });

    const label =
      edgeData?.connectionType &&
      CONNECTION_TYPE_LABELS[edgeData.connectionType as ConnectionType]
        ? CONNECTION_TYPE_LABELS[edgeData.connectionType as ConnectionType]
        : edgeData?.connectionType ?? "";

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: selected
              ? "rgba(61, 255, 205, 0.5)"
              : "rgba(255, 255, 255, 0.12)",
            strokeWidth: selected ? 2 : 1,
            strokeDasharray: edgeData?.connectionType === "speculative" ? "4 4" : undefined,
          }}
          markerEnd="url(#arrowhead)"
        />
        {/* Wider invisible hit area for hover */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
        {hovered && label && (
          <EdgeLabelRenderer>
            <div
              className="absolute pointer-events-none bg-sf-void border border-sf-border px-1.5 py-0.5"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              }}
            >
              <span className="text-[12px] font-mono text-t3 uppercase tracking-wider">
                {label}
              </span>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

GraphEdgeComponent.displayName = "GraphEdgeComponent";

export default GraphEdgeComponent;
