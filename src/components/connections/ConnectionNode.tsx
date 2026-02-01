import { Globe, Dna, Sparkles, GitBranch, Rocket, Zap, Calculator, FileText } from "lucide-react";
import { getToolColor, getToolIconName } from "@/hooks/use-world-graph";

interface ConnectionNodeProps {
  x: number;
  y: number;
  toolType: string;
  title: string;
  isHovered: boolean;
  isDragging?: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

// Icon components mapping
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Dna,
  Sparkles,
  GitBranch,
  Rocket,
  Zap,
  Calculator,
  FileText,
};

const ConnectionNode = ({
  x,
  y,
  toolType,
  title,
  isHovered,
  isDragging = false,
  onHover,
  onLeave,
  onClick,
}: ConnectionNodeProps) => {
  const color = getToolColor(toolType);
  const iconName = getToolIconName(toolType);
  const Icon = ICONS[iconName] || FileText;

  // Truncate title if too long
  const displayTitle = title.length > 18 ? title.slice(0, 15) + "..." : title;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      {/* Glow effect when hovered or dragging */}
      {(isHovered || isDragging) && (
        <circle
          r={isDragging ? "40" : "35"}
          fill={`hsl(${color} / ${isDragging ? 0.3 : 0.2})`}
          className="transition-all duration-200"
        />
      )}

      {/* Outer ring */}
      <circle
        r="24"
        fill="hsl(var(--sf-surface))"
        stroke={`hsl(${color})`}
        strokeWidth={isDragging ? "4" : isHovered ? "3" : "2"}
        className="transition-all duration-200"
      />

      {/* Inner circle with icon background */}
      <circle r="18" fill={`hsl(${color} / 0.15)`} />

      {/* Icon - centered */}
      <foreignObject x="-10" y="-10" width="20" height="20">
        <div className="w-full h-full flex items-center justify-center">
          <Icon
            className={`w-4 h-4`}
            style={{ color: `hsl(${color})` }}
          />
        </div>
      </foreignObject>

      {/* Label */}
      <text
        y="40"
        textAnchor="middle"
        className="fill-muted-foreground text-xs"
        style={{ fontSize: "11px" }}
      >
        {displayTitle}
      </text>

      {/* Hover tooltip with full title */}
      {isHovered && title.length > 18 && (
        <g>
          <rect
            x={-title.length * 3.5}
            y="-55"
            width={title.length * 7}
            height="20"
            rx="4"
            fill="hsl(var(--sf-surface-elevated))"
            stroke="hsl(var(--border))"
          />
          <text
            y="-42"
            textAnchor="middle"
            className="fill-foreground text-xs"
            style={{ fontSize: "10px" }}
          >
            {title}
          </text>
        </g>
      )}
    </g>
  );
};

export default ConnectionNode;
