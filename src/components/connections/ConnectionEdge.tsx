interface ConnectionEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  linkType: string;
  highlighted: boolean;
}

// Get edge color based on link type
function getEdgeColor(linkType: string): string {
  const colors: Record<string, string> = {
    planet: "190 100% 50%", // Cyan - planet connections
    species: "153 100% 50%", // Emerald - species connections
    ecr: "328 100% 50%", // Magenta - ECR connections
    propulsion: "43 100% 50%", // Amber - propulsion connections
  };
  return colors[linkType] || "0 0% 50%";
}

const ConnectionEdge = ({
  x1,
  y1,
  x2,
  y2,
  linkType,
  highlighted,
}: ConnectionEdgeProps) => {
  const color = getEdgeColor(linkType);

  // Calculate midpoint for gradient
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Generate unique ID for gradient
  const gradientId = `edge-gradient-${x1}-${y1}-${x2}-${y2}`.replace(/\./g, "-");

  return (
    <g>
      {/* Gradient definition */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`hsl(${color} / 0.3)`} />
          <stop offset="50%" stopColor={`hsl(${color} / ${highlighted ? 0.8 : 0.5})`} />
          <stop offset="100%" stopColor={`hsl(${color} / 0.3)`} />
        </linearGradient>
      </defs>

      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={`url(#${gradientId})`}
        strokeWidth={highlighted ? 3 : 2}
        strokeLinecap="round"
        className="transition-all duration-200"
      />

      {/* Animated glow when highlighted */}
      {highlighted && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={`hsl(${color} / 0.3)`}
          strokeWidth={6}
          strokeLinecap="round"
          className="blur-sm"
        />
      )}

      {/* Arrow marker at midpoint indicating direction */}
      <circle
        cx={midX + (x2 - x1) * 0.15}
        cy={midY + (y2 - y1) * 0.15}
        r={highlighted ? 4 : 3}
        fill={`hsl(${color})`}
        className="transition-all duration-200"
      />
    </g>
  );
};

export default ConnectionEdge;
