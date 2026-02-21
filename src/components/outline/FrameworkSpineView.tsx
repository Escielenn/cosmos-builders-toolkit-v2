import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LAYER_ORDER,
  LAYER_LABELS,
  type WorldLayerData,
  type WorldElement,
  type CompletionStatus,
} from "@/services/world-data";

// ---------------------------------------------------------------------------
// Completion indicator
// ---------------------------------------------------------------------------

function CompletionDot({ status }: { status: CompletionStatus }) {
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full shrink-0",
        status === "complete" && "bg-primary",
        status === "partial" && "bg-amber-400",
        status === "empty" && "border border-muted-foreground/40"
      )}
      title={status}
    />
  );
}

// ---------------------------------------------------------------------------
// Framework Element (single row)
// ---------------------------------------------------------------------------

interface FrameworkElementProps {
  element: WorldElement;
  isLast: boolean;
  onElementClick: (element: WorldElement) => void;
}

function FrameworkElement({ element, isLast, onElementClick }: FrameworkElementProps) {
  return (
    <button
      onClick={() => onElementClick(element)}
      className="group flex items-center gap-2 w-full text-left py-1.5 pl-4 pr-2 hover:bg-accent/10 transition-colors"
    >
      {/* Tree line */}
      <span className="text-muted-foreground/40 font-mono text-xs select-none w-4 shrink-0">
        {isLast ? "└" : "├"}
      </span>

      <CompletionDot status={element.completionStatus} />

      <span className="text-sm text-foreground/90 truncate flex-1 group-hover:text-primary transition-colors">
        {element.title}
      </span>

      {element.toolDisplayName && (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 uppercase tracking-wider shrink-0 font-mono"
        >
          {element.toolDisplayName}
        </Badge>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Framework Section (collapsible layer)
// ---------------------------------------------------------------------------

interface FrameworkSectionProps {
  layer: WorldLayerData;
  defaultExpanded: boolean;
  onElementClick: (element: WorldElement) => void;
  onAddEntry: (layerId: string) => void;
}

function FrameworkSection({
  layer,
  defaultExpanded,
  onElementClick,
  onAddEntry,
}: FrameworkSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-border/30 last:border-b-0">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/5 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}

        <CompletionDot status={layer.completionStatus} />

        <span className="font-heading text-xs uppercase tracking-sf-wide text-foreground/80 flex-1">
          {layer.label}
        </span>

        {layer.elements.length > 0 && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
            {layer.elements.length}
          </Badge>
        )}
      </button>

      {/* Section content */}
      {expanded && (
        <div className="pb-2">
          {layer.elements.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic px-4 py-2 pl-10">
              No {layer.label.toLowerCase()} data on file. Begin survey when ready.
            </p>
          ) : (
            layer.elements.map((element, i) => (
              <FrameworkElement
                key={element.id}
                element={element}
                isLast={i === layer.elements.length - 1}
                onElementClick={onElementClick}
              />
            ))
          )}

          <Button
            variant="ghost"
            size="sm"
            className="ml-10 mt-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary h-6 px-2"
            onClick={() => onAddEntry(layer.layerId)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Entry
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion Bar
// ---------------------------------------------------------------------------

function CompletionBar({ percentage }: { percentage: number }) {
  return (
    <div className="px-3 py-3 border-t border-border/30">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Survey Completeness
        </span>
        <span className="font-mono text-[10px] text-primary">
          {percentage}%
        </span>
      </div>
      <div className="h-1 bg-border/30 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

interface FrameworkSpineViewProps {
  layers: WorldLayerData[];
  totalCompletion: number;
  onElementClick: (element: WorldElement) => void;
  onAddEntry: (layerId: string) => void;
}

const FrameworkSpineView = ({
  layers,
  totalCompletion,
  onElementClick,
  onAddEntry,
}: FrameworkSpineViewProps) => {
  // Sort layers to match canonical cascade order
  const orderedLayers = useMemo(() => {
    return LAYER_ORDER.map(
      (layerId) =>
        layers.find((l) => l.layerId === layerId) ?? {
          layerId,
          label: LAYER_LABELS[layerId],
          elements: [],
          completionStatus: "empty" as CompletionStatus,
        }
    );
  }, [layers]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {orderedLayers.map((layer) => (
          <FrameworkSection
            key={layer.layerId}
            layer={layer}
            defaultExpanded={layer.elements.length > 0}
            onElementClick={onElementClick}
            onAddEntry={onAddEntry}
          />
        ))}
      </div>

      <CompletionBar percentage={totalCompletion} />
    </div>
  );
};

export default FrameworkSpineView;
