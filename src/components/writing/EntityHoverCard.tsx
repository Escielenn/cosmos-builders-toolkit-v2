// ---------------------------------------------------------------------------
// EntityHoverCard — floating preview for @mention / wiki-link clicks in the
// writing space.
//
// Rendered as a portal near the clicked mention. Shows:
//   - Entity type badge with entity-type color
//   - Name + one-line summary
//   - Truncated description preview
//   - Action buttons: "Open in graph", "Open full panel", and a dropdown
//     of tools applicable to this entity type (pre-populates via ?entityId=)
//
// Dismisses on Escape, click-outside, or "Open" action.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Layers, PanelLeftOpen, X, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type Entity,
  type EntityType,
} from "@/services/entity-graph-types";
import { getToolsForEntityType } from "@/lib/entity-config";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HoverCardAnchor {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface EntityHoverCardProps {
  entity: Entity;
  anchor: HoverCardAnchor;
  worldId: string;
  onDismiss: () => void;
  onOpenFullPanel?: (entityId: string) => void;
}

const CARD_WIDTH = 320;
const CARD_OFFSET = 8; // px below the anchor

// ---------------------------------------------------------------------------
// Tool slug → display label (fallback to slug if unknown)
// ---------------------------------------------------------------------------

const TOOL_LABELS: Record<string, string> = {
  "planetary-profile": "Planetary Profile",
  "habitable-zone-calculator": "Habitable Zone",
  "surface-gravity-calculator": "Surface Gravity",
  "star-system-builder": "Star System Builder",
  "drake-equation-calculator": "Drake Equation",
  "evolutionary-biology": "Evolutionary Biology",
  "species-interaction-matrix": "Species Interaction",
  sensorium: "Sensorium",
  "empire-designer": "Empire Designer",
  "xenomythology-framework-builder": "Xenomythology",
  lexdrift: "LexDrift",
  "space-expansion-modeler": "Space Expansion",
  "propulsion-consequences-map": "Propulsion Consequences",
  "spacecraft-designer": "Spacecraft Designer",
  gravitas: "Gravitas",
  "time-dilation": "Time Dilation",
  "kardashev-scale": "Kardashev Scale",
  "one-big-lie": "The One Big Lie",
  "environmental-chain-reaction": "Environmental Chain",
  "technology-consequences": "Technology Consequences",
  timeline: "Timeline",
};

function toolLabel(slug: string): string {
  return TOOL_LABELS[slug] ?? slug.replace(/-/g, " ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityHoverCard({
  entity,
  anchor,
  worldId,
  onDismiss,
  onOpenFullPanel,
}: EntityHoverCardProps): JSX.Element {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const entityType = entity.entity_type as EntityType;
  const color =
    entity.color ||
    ENTITY_TYPE_COLORS[entityType] ||
    ENTITY_TYPE_COLORS.custom;
  const typeLabel =
    entity.custom_type_label ||
    ENTITY_TYPE_LABELS[entityType] ||
    "Entity";

  const tools = useMemo(
    () => getToolsForEntityType(entity.entity_type),
    [entity.entity_type]
  );

  // Positioning — keep card inside viewport, flip upward if near bottom
  const ESTIMATED_CARD_HEIGHT = 320;
  const position = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = anchor.left;
    if (left + CARD_WIDTH > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - CARD_WIDTH - 16);
    }

    // Flip above the mention if there isn't room below
    const spaceBelow = viewportHeight - anchor.top;
    const flipUp = spaceBelow < ESTIMATED_CARD_HEIGHT + CARD_OFFSET + 16;

    const top = flipUp
      ? Math.max(16, anchor.top - anchor.height - ESTIMATED_CARD_HEIGHT - CARD_OFFSET)
      : anchor.top + CARD_OFFSET;

    return { top, left, flipUp };
  }, [anchor]);

  // Escape key + click-outside dismissal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    const onClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest("[data-radix-popper-content-wrapper], [data-radix-menu-content]")) return;
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    // Defer so the original click doesn't immediately dismiss
    const t = window.setTimeout(() => {
      window.addEventListener("mousedown", onClick);
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
      window.clearTimeout(t);
    };
  }, [onDismiss]);

  const handleOpenInTool = (toolSlug: string) => {
    navigate(`/worlds/${worldId}/tools/${toolSlug}?entityId=${entity.id}`);
    onDismiss();
  };

  const handleOpenInGraph = () => {
    navigate(`/worlds/${worldId}/connections?focus=${entity.id}`);
    onDismiss();
  };

  const handleOpenPanel = () => {
    if (onOpenFullPanel) onOpenFullPanel(entity.id);
    onDismiss();
  };

  // Strip HTML tags from description for preview
  const descriptionPreview = useMemo(() => {
    if (!entity.description) return null;
    const text = entity.description.replace(/<[^>]+>/g, "").trim();
    return text.length > 180 ? text.slice(0, 180) + "…" : text;
  }, [entity.description]);

  return createPortal(
    <div
      ref={cardRef}
      role="dialog"
      aria-label={`${entity.name} preview`}
      className={cn(
        "fixed z-50 shadow-2xl",
        "bg-[hsl(222_25%_9%_/_0.97)] backdrop-blur-md",
        "border border-white/10"
      )}
      style={{
        top: position.top,
        left: position.left,
        width: CARD_WIDTH,
        maxHeight: `calc(100vh - 32px)`,
        overflowY: "auto",
      }}
    >
      {/* Accent bar */}
      <div
        className="h-0.5 w-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-[1.5px] font-medium border-0 px-1.5 py-0"
                style={{
                  backgroundColor: `${color}14`,
                  color,
                  borderColor: `${color}28`,
                }}
              >
                {typeLabel}
              </Badge>
            </div>
            <h3 className="font-heading text-base font-light text-t1 truncate">
              {entity.name}
            </h3>
            {entity.summary && (
              <p className="text-xs text-t3 mt-1 line-clamp-2">
                {entity.summary}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 -mr-1 -mt-1"
            onClick={onDismiss}
            aria-label="Close preview"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Description preview */}
        {descriptionPreview && (
          <p className="text-xs text-t2 leading-relaxed line-clamp-4 pt-1 border-t border-white/5">
            {descriptionPreview}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
          {onOpenFullPanel && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start h-8 text-xs"
              onClick={handleOpenPanel}
            >
              <PanelLeftOpen className="w-3.5 h-3.5 mr-2" />
              Open in side panel
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-8 text-xs"
            onClick={handleOpenInGraph}
          >
            <Layers className="w-3.5 h-3.5 mr-2" />
            View in graph
          </Button>
          {tools.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 text-xs"
                >
                  <Wrench className="w-3.5 h-3.5 mr-2" />
                  Open in tool ({tools.length})
                  <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {tools.map((slug) => (
                  <DropdownMenuItem
                    key={slug}
                    onClick={() => handleOpenInTool(slug)}
                    className="text-xs"
                  >
                    {toolLabel(slug)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
