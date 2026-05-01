/**
 * CascadeProgressBar, Shows cascade layer completion status.
 *
 * Renders as a horizontal row of layer badges, each showing
 * empty / partial / populated status.
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 5
 */

import { getCascadeProgress, type CascadeLayerStatus } from "@/lib/cascade-guidance";

/** Category accent colors matching the design system */
const LAYER_COLORS: Record<string, string> = {
  stars_and_systems: "#FFB800",
  worlds: "#4D9FFF",
  life: "#00FF88",
  civilizations: "#9B5DE5",
  mythology: "#5B8DEF",
  narrative: "#15C17B",
};

interface CascadeProgressBarProps {
  /** Tool types of existing worksheets in this world */
  worksheetToolTypes: string[];
  className?: string;
}

export default function CascadeProgressBar({
  worksheetToolTypes,
  className = "",
}: CascadeProgressBarProps) {
  const progress = getCascadeProgress(worksheetToolTypes);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {progress.map((layer, i) => (
        <CascadeLayerBadge key={layer.layer} layer={layer} isLast={i === progress.length - 1} />
      ))}
    </div>
  );
}

function CascadeLayerBadge({
  layer,
  isLast,
}: {
  layer: CascadeLayerStatus;
  isLast: boolean;
}) {
  const color = LAYER_COLORS[layer.layer] ?? "#15C17B";
  const opacity = layer.status === "empty" ? 0.15 : layer.status === "partial" ? 0.5 : 1;

  return (
    <div className="flex items-center gap-1">
      <div
        className="group relative flex items-center"
        title={`${layer.label}: ${layer.worksheetCount} worksheet${layer.worksheetCount !== 1 ? "s" : ""}`}
      >
        <div
          className="h-1.5 w-6 rounded-full transition-opacity"
          style={{ backgroundColor: color, opacity }}
        />
        <span
          className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[7px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
          style={{ color }}
        >
          {layer.label}
        </span>
      </div>
      {!isLast && (
        <div className="w-1 h-px bg-white/10" />
      )}
    </div>
  );
}
