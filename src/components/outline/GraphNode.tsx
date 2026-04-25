import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Folder } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletionStatus, CascadeLayer } from "@/services/world-data";
import { ENTITY_TYPE_ICONS } from "@/services/world-data";

// Layer-specific border colors (HSL at low opacity)
const LAYER_COLORS: Record<CascadeLayer, string> = {
  environment: "rgba(61, 255, 205, 0.15)",
  biology: "rgba(76, 217, 100, 0.15)",
  psychology: "rgba(255, 179, 71, 0.15)",
  culture: "rgba(91, 141, 239, 0.15)",
  mythology: "rgba(175, 82, 222, 0.15)",
  technology: "rgba(255, 69, 58, 0.15)",
  narrative: "rgba(255, 214, 10, 0.15)",
};

const LAYER_HOVER_COLORS: Record<CascadeLayer, string> = {
  environment: "rgba(61, 255, 205, 0.4)",
  biology: "rgba(76, 217, 100, 0.4)",
  psychology: "rgba(255, 179, 71, 0.4)",
  culture: "rgba(91, 141, 239, 0.4)",
  mythology: "rgba(175, 82, 222, 0.4)",
  technology: "rgba(255, 69, 58, 0.4)",
  narrative: "rgba(255, 214, 10, 0.4)",
};

export interface GraphNodeData {
  label: string;
  kind: "worksheet" | "entry";
  layerId: CascadeLayer;
  completionStatus: CompletionStatus;
  toolDisplayName?: string;
  entryType?: string;
  [key: string]: unknown;
}

// Entity-type accent colors for entry nodes
const ENTITY_TYPE_COLORS: Record<string, string> = {
  planet: "rgba(77, 159, 255, 0.15)",
  star_system: "rgba(255, 184, 0, 0.15)",
  species: "rgba(0, 255, 136, 0.15)",
  faction: "rgba(155, 93, 229, 0.15)",
  character: "rgba(255, 179, 71, 0.15)",
  technology: "rgba(255, 69, 58, 0.15)",
  location: "rgba(77, 159, 255, 0.15)",
  vessel: "rgba(61, 255, 205, 0.15)",
  mythology: "rgba(91, 141, 239, 0.15)",
};

const ENTITY_TYPE_HOVER_COLORS: Record<string, string> = {
  planet: "rgba(77, 159, 255, 0.4)",
  star_system: "rgba(255, 184, 0, 0.4)",
  species: "rgba(0, 255, 136, 0.4)",
  faction: "rgba(155, 93, 229, 0.4)",
  character: "rgba(255, 179, 71, 0.4)",
  technology: "rgba(255, 69, 58, 0.4)",
  location: "rgba(77, 159, 255, 0.4)",
  vessel: "rgba(61, 255, 205, 0.4)",
  mythology: "rgba(91, 141, 239, 0.4)",
};

function getEntryIcon(entryType?: string) {
  if (!entryType) return Folder;
  const iconName = ENTITY_TYPE_ICONS[entryType];
  if (iconName) {
    const Icon = (LucideIcons as any)[iconName];
    if (Icon) return Icon;
  }
  return Folder;
}

const GraphNodeComponent = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;

  // Use entity-type colors for entries when available
  const useEntityColor = nodeData.kind === "entry" && nodeData.entryType;
  const borderColor = selected
    ? (useEntityColor ? (ENTITY_TYPE_HOVER_COLORS[nodeData.entryType!] ?? LAYER_HOVER_COLORS[nodeData.layerId]) : LAYER_HOVER_COLORS[nodeData.layerId])
    : (useEntityColor ? (ENTITY_TYPE_COLORS[nodeData.entryType!] ?? LAYER_COLORS[nodeData.layerId]) : LAYER_COLORS[nodeData.layerId]);

  return (
    <div
      className={cn(
        "sf-fill-sweep sf-fill-sweep--primary",
        "relative w-[140px] px-2.5 py-2 bg-sf-void transition-colors",
        "border",
        selected && "shadow-lg"
      )}
      style={{ borderColor }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-muted-foreground/40 !border-0"
      />

      <div className="flex items-center gap-1.5">
        {/* Status dot */}
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            nodeData.completionStatus === "complete" && "bg-primary",
            nodeData.completionStatus === "partial" && "bg-amber-400",
            nodeData.completionStatus === "empty" && "border border-muted-foreground/40"
          )}
        />

        {/* Icon */}
        {nodeData.kind === "entry" ? (
          (() => { const EntryIcon = getEntryIcon(nodeData.entryType); return <EntryIcon className="w-3 h-3 text-t3 shrink-0" />; })()
        ) : (
          <FileText className="w-3 h-3 text-t3 shrink-0" />
        )}

        {/* Title */}
        <span className="text-[10px] text-t2 truncate flex-1 leading-tight">
          {nodeData.label}
        </span>
      </div>

      {nodeData.toolDisplayName && (
        <span className="block text-[7px] text-t3/50 uppercase tracking-wider mt-0.5 font-mono">
          {nodeData.toolDisplayName}
        </span>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-1.5 !h-1.5 !bg-muted-foreground/40 !border-0"
      />
    </div>
  );
});

GraphNodeComponent.displayName = "GraphNodeComponent";

export default GraphNodeComponent;
