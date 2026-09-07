// ---------------------------------------------------------------------------
// ConnectionNode — one entity in the Web view.
//
// Before F3 this drew a worksheet, coloured by tool. A worksheet is a
// property of an entity, not a node (F3-ONE-GRAPH-PROPOSAL.md §1), so it now
// draws an entity, coloured by the cascade layer of its type
// (F3-ONE-GRAPH-PROPOSAL.md §1). ONE colour per node: an entity-type ring on
// top of a cascade ring gave the node two colours and made the legend — which
// explains the cascade — false. Colour here is a MEANING, not a role: it does
// not follow the theme's primary.
// ---------------------------------------------------------------------------

import {
  CASCADE_STAGE_COLORS,
  ENTITY_TYPE_LABELS,
  type CascadeStage,
  type EntityType,
} from "@/services/entity-graph-types";

export interface ConnectionNodeProps {
  x: number;
  y: number;
  entityType: EntityType;
  cascadeStage: CascadeStage;
  /** User colour override, when the writer picked one. */
  color?: string | null;
  title: string;
  /** One line, shown on hover. */
  summary?: string | null;
  typeLabel?: string | null;
  isHovered: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

const MAX_LABEL = 18;

/** Wraps a summary to a fixed column so the hover card can size itself. */
function wrap(text: string, columns: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= columns) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, columns - 1)}…`;
  }
  return lines;
}

const ConnectionNode = ({
  x,
  y,
  entityType,
  cascadeStage,
  color,
  title,
  summary,
  typeLabel,
  isHovered,
  isSelected = false,
  isDragging = false,
  onHover,
  onLeave,
  onClick,
}: ConnectionNodeProps) => {
  // The writer's own colour wins; otherwise the cascade layer, which is what
  // the legend beside the graph explains.
  const stroke = color ?? CASCADE_STAGE_COLORS[cascadeStage];
  const displayTitle =
    title.length > MAX_LABEL ? `${title.slice(0, MAX_LABEL - 3)}…` : title;
  const kind = typeLabel ?? ENTITY_TYPE_LABELS[entityType];

  // The hover card carries the type and, when there is one, the summary —
  // Brief F3 item 4, "hover → infobox summary".
  const summaryLines = isHovered && summary ? wrap(summary, 34, 3) : [];
  const cardLines = isHovered ? 1 + summaryLines.length : 0;
  const cardHeight = cardLines * 14 + 12;
  const cardWidth = 240;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${title}, ${kind}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {(isHovered || isDragging || isSelected) && (
        <circle
          r={isDragging ? 40 : 35}
          fill={stroke}
          opacity={isDragging ? 0.3 : 0.2}
          className="transition-all duration-200"
        />
      )}

      <circle
        r={24}
        style={{ fill: "var(--sf-surface)" }}
        stroke={stroke}
        strokeWidth={isDragging ? 4 : isHovered || isSelected ? 3 : 2}
        className="transition-all duration-200"
      />

      <circle r={18} fill={stroke} opacity={0.15} />

      <text
        y={44}
        textAnchor="middle"
        style={{ fill: "var(--t2)", fontSize: "12px" }}
      >
        {displayTitle}
      </text>

      {isHovered && (
        <g pointerEvents="none">
          <rect
            x={-cardWidth / 2}
            y={-40 - cardHeight}
            width={cardWidth}
            height={cardHeight}
            style={{ fill: "var(--sf-surface-elevated)" }}
            stroke="var(--sf-line-emphasis)"
            strokeWidth={1}
          />
          <text
            x={-cardWidth / 2 + 10}
            y={-40 - cardHeight + 18}
            style={{ fill: "var(--t1)", fontSize: "12px" }}
          >
            {title.length > 30 ? `${title.slice(0, 29)}…` : title}
            <tspan style={{ fill: "var(--t4)" }}>{`  ${kind}`}</tspan>
          </text>
          {summaryLines.map((line, i) => (
            <text
              key={line + String(i)}
              x={-cardWidth / 2 + 10}
              y={-40 - cardHeight + 18 + (i + 1) * 14}
              style={{ fill: "var(--t3)", fontSize: "12px" }}
            >
              {line}
            </text>
          ))}
        </g>
      )}
    </g>
  );
};

export default ConnectionNode;
