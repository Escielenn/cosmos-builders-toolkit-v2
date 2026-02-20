import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimelineEvent } from "@/lib/timeline/types";
import {
  EVENT_TYPE_MAP,
  IMPORTANCE_MAP,
  NESTING_CONFIG,
} from "@/lib/timeline/constants";
import {
  eventToDecimalYear,
  formatDateRange,
} from "@/lib/timeline/utils";
import type { YearMapper } from "@/lib/timeline/utils";
import { ChevronRight, ChevronDown, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventMarkerProps {
  event: TimelineEvent;
  mapper: YearMapper;
  isSelected: boolean;
  isDimmed?: boolean;
  isFolded?: boolean;
  hasElementLinks?: boolean;
  trackColor: string;
  nestingLevel?: 0 | 1 | 2;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick: () => void;
  onToggleExpand?: () => void;
}

const EventMarker = memo(
  ({
    event,
    mapper,
    isSelected,
    isDimmed = false,
    isFolded = false,
    hasElementLinks = false,
    trackColor,
    nestingLevel = 0,
    hasChildren = false,
    isExpanded = false,
    onClick,
    onToggleExpand,
  }: EventMarkerProps) => {
    const eventConfig = EVENT_TYPE_MAP[event.eventType];
    const importanceConfig = IMPORTANCE_MAP[event.importance];
    const color = event.color || eventConfig?.defaultColor || trackColor;
    const nesting = NESTING_CONFIG[nestingLevel];

    const startDecimal = eventToDecimalYear(
      event.startYear,
      event.startMonth,
      event.startDay
    );
    const x = mapper.yearToX(startDecimal);

    // Expand/collapse chevron for parent events
    const expandChevron = hasChildren && onToggleExpand ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        className="absolute -left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
        style={{ marginLeft: nesting.indent }}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
    ) : null;

    if (event.hasDuration && event.endYear != null) {
      // Duration event — render as a bar
      const endDecimal = eventToDecimalYear(
        event.endYear,
        event.endMonth,
        event.endDay
      );
      const endX = mapper.yearToX(endDecimal);
      const width = Math.max(endX - x, 4);

      // Child count badge when collapsed
      const childBadge = hasChildren && !isExpanded ? (
        <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-muted text-[8px] font-bold flex items-center justify-center text-foreground/70 border border-border/50">
          +
        </span>
      ) : null;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={isDimmed ? undefined : onClick}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all",
                "hover:brightness-110",
                isSelected && "ring-2 ring-white ring-offset-1 ring-offset-background",
                isDimmed && "opacity-20 pointer-events-none",
                isFolded && "border border-dashed border-white/30"
              )}
              style={{
                left: x + nesting.indent,
                width,
                height: nesting.barHeight,
                backgroundColor: color,
                ...(!isDimmed && { opacity: isFolded ? 0.55 : importanceConfig.opacity }),
                fontSize: nesting.fontSize,
              }}
            >
              {width > 60 && (
                <span
                  className="text-white font-medium px-2 truncate block leading-none"
                  style={{
                    lineHeight: `${nesting.barHeight}px`,
                    fontSize: nesting.fontSize,
                  }}
                >
                  {event.name}
                </span>
              )}
              {childBadge}
              {hasElementLinks && (
                <Link2 className="absolute -bottom-1 -right-1 w-3 h-3 text-white/70" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-semibold text-sm">{event.name}</p>
            <p className="text-xs text-muted-foreground">{formatDateRange(event)}</p>
            {event.shortDescription && (
              <p className="text-xs mt-1">{event.shortDescription}</p>
            )}
          </TooltipContent>
          {expandChevron}
        </Tooltip>
      );
    }

    // Point event — render as a dot
    const dotSize = importanceConfig.dotSize * nesting.dotScale;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={isDimmed ? undefined : onClick}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all",
              "hover:scale-125 hover:brightness-110",
              isSelected && "ring-2 ring-white ring-offset-1 ring-offset-background scale-125",
              isDimmed && "opacity-20 pointer-events-none",
              isFolded && "border border-dashed border-white/30"
            )}
            style={{
              left: x - dotSize / 2 + nesting.indent,
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              ...(!isDimmed && { opacity: isFolded ? 0.55 : importanceConfig.opacity }),
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold text-sm">{event.name}</p>
          <p className="text-xs text-muted-foreground">{formatDateRange(event)}</p>
          {event.shortDescription && (
            <p className="text-xs mt-1">{event.shortDescription}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }
);

EventMarker.displayName = "EventMarker";

export default EventMarker;
