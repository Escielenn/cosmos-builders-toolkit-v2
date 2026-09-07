// ---------------------------------------------------------------------------
// ConnectionEdge — one typed relation in the Web view.
//
// Coloured by the cascade stage that owns the verb, so a `worships` edge and
// a `preys_on` edge are visibly different kinds of claim. `historical` edges
// (outside the scrubber's epoch) draw dashed and dim rather than vanishing.
// ---------------------------------------------------------------------------

import {
  CASCADE_STAGE_COLORS,
  formatRelationshipType,
  type ConnectionCascadeStage,
} from "@/services/entity-graph-types";

export interface ConnectionEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cascadeStage: ConnectionCascadeStage;
  relationshipType: string;
  relationshipLabel?: string | null;
  bidirectional?: boolean;
  highlighted: boolean;
  historical?: boolean;
  /** The verb is only drawn when an endpoint is hovered — otherwise it is noise. */
  showLabel?: boolean;
}

function stageColor(stage: ConnectionCascadeStage): string {
  return stage === "cross_cascade"
    ? "var(--sf-line-emphasis)"
    : CASCADE_STAGE_COLORS[stage];
}

const ConnectionEdge = ({
  x1,
  y1,
  x2,
  y2,
  cascadeStage,
  relationshipType,
  relationshipLabel,
  bidirectional = false,
  highlighted,
  historical = false,
  showLabel = false,
}: ConnectionEdgeProps) => {
  const color = stageColor(cascadeStage);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const label = relationshipLabel || formatRelationshipType(relationshipType);

  // Direction marker sits 65% along, so source→target reads without arrowheads
  // colliding with the node circles.
  const headX = x1 + (x2 - x1) * 0.65;
  const headY = y1 + (y2 - y1) * 0.65;

  return (
    <g opacity={historical ? 0.35 : 1}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeOpacity={highlighted ? 0.9 : 0.45}
        strokeWidth={highlighted ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={historical ? "6 5" : undefined}
        className="transition-all duration-200"
      />

      <circle
        cx={headX}
        cy={headY}
        r={highlighted ? 4 : 3}
        fill={color}
        className="transition-all duration-200"
      />
      {bidirectional && (
        <circle
          cx={x1 + (x2 - x1) * 0.35}
          cy={y1 + (y2 - y1) * 0.35}
          r={highlighted ? 4 : 3}
          fill={color}
        />
      )}

      {showLabel && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          pointerEvents="none"
          style={{ fill: "var(--t3)", fontSize: "12px" }}
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default ConnectionEdge;
