import { memo, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimelineEvent, TimelineTrack, EventLink } from "@/lib/timeline/types";
import type { YearMapper } from "@/lib/timeline/utils";
import { eventToDecimalYear } from "@/lib/timeline/utils";
import { LINK_TYPE_CONFIG } from "@/lib/timeline/constants";
import {
  TRACK_HEIGHT,
  COLLAPSED_TRACK_HEIGHT,
  TRACK_HEADER_WIDTH,
} from "@/lib/timeline/constants";

interface CausalityOverlayProps {
  links: EventLink[];
  events: TimelineEvent[];
  tracks: TimelineTrack[];
  mapper: YearMapper;
  totalHeight: number;
  onSelectLink?: (link: EventLink) => void;
}

/** Compute the Y center of a track lane given its index in the sorted visible tracks. */
function getTrackY(
  trackId: string,
  sortedTracks: TimelineTrack[],
): number {
  let y = 0;
  for (const track of sortedTracks) {
    const h = track.isCollapsed ? COLLAPSED_TRACK_HEIGHT : TRACK_HEIGHT;
    if (track.id === trackId) return y + h / 2;
    y += h;
  }
  return y; // fallback
}

const CausalityOverlay = memo(
  ({ links, events, tracks, mapper, totalHeight, onSelectLink }: CausalityOverlayProps) => {
    const eventMap = useMemo(() => {
      const map = new Map<string, TimelineEvent>();
      for (const e of events) map.set(e.id, e);
      return map;
    }, [events]);

    const sortedTracks = useMemo(
      () => [...tracks].sort((a, b) => a.order - b.order),
      [tracks]
    );

    if (links.length === 0) return null;

    return (
      <svg
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{ height: totalHeight, marginLeft: TRACK_HEADER_WIDTH }}
      >
        {/* Arrowhead marker */}
        <defs>
          {Object.entries(LINK_TYPE_CONFIG).map(([type, config]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={config.color} />
            </marker>
          ))}
        </defs>

        {links.map((link) => {
          const sourceEvent = eventMap.get(link.sourceEventId);
          const targetEvent = eventMap.get(link.targetEventId);
          if (!sourceEvent || !targetEvent) return null;

          const config = LINK_TYPE_CONFIG[link.linkType];

          // X positions
          const sourceDecimal = eventToDecimalYear(
            sourceEvent.startYear,
            sourceEvent.startMonth,
            sourceEvent.startDay
          );
          const targetDecimal = eventToDecimalYear(
            targetEvent.startYear,
            targetEvent.startMonth,
            targetEvent.startDay
          );

          const sourceX = mapper.yearToX(sourceDecimal) - TRACK_HEADER_WIDTH;
          const targetX = mapper.yearToX(targetDecimal) - TRACK_HEADER_WIDTH;

          // For duration events, use the end of the source bar
          let adjustedSourceX = sourceX;
          if (sourceEvent.hasDuration && sourceEvent.endYear != null) {
            const endDecimal = eventToDecimalYear(
              sourceEvent.endYear,
              sourceEvent.endMonth,
              sourceEvent.endDay
            );
            adjustedSourceX = mapper.yearToX(endDecimal) - TRACK_HEADER_WIDTH;
          }

          // Y positions
          const sourceY = getTrackY(sourceEvent.trackId, sortedTracks);
          const targetY = getTrackY(targetEvent.trackId, sortedTracks);

          // Bezier control points
          const dx = targetX - adjustedSourceX;
          const cpOffset = Math.min(Math.abs(dx) * 0.4, 120);
          const sameTrack = sourceEvent.trackId === targetEvent.trackId;

          const cp1x = adjustedSourceX + cpOffset;
          const cp1y = sameTrack ? sourceY - 20 : sourceY;
          const cp2x = targetX - cpOffset;
          const cp2y = sameTrack ? targetY - 20 : targetY;

          const d = `M ${adjustedSourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;

          const strokeWidth = link.strength === 1 ? 1.5 : link.strength === 2 ? 2.5 : 3.5;

          return (
            <g key={link.id}>
              {/* Invisible wider hit area for interaction */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={strokeWidth + 10}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => onSelectLink?.(link)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs font-semibold" style={{ color: config.color }}>
                    {config.label}
                  </p>
                  <p className="text-[10px] text-t3">
                    {sourceEvent.name} → {targetEvent.name}
                  </p>
                  {link.label && (
                    <p className="text-[10px] mt-0.5">{link.label}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Visible curve */}
              <path
                d={d}
                fill="none"
                stroke={config.color}
                strokeWidth={strokeWidth}
                strokeDasharray={config.dashArray}
                markerEnd={`url(#arrow-${link.linkType})`}
                opacity={0.7}
              />
            </g>
          );
        })}
      </svg>
    );
  }
);

CausalityOverlay.displayName = "CausalityOverlay";

export default CausalityOverlay;
