import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimelineEvent, TimelineTrack } from "@/lib/timeline/types";
import { eventToDecimalYear, formatDateRange } from "@/lib/timeline/utils";
import type { YearMapper } from "@/lib/timeline/utils";
import { ExternalLink } from "lucide-react";

interface ReferenceBadgeProps {
  event: TimelineEvent;
  primaryTrack: TimelineTrack | undefined;
  mapper: YearMapper;
  onClick: () => void;
}

/**
 * Small pill rendered in a track lane for events that reference this track
 * as a secondary track. Shows abbreviated name + link icon.
 */
const ReferenceBadge = memo(
  ({
    event,
    primaryTrack,
    mapper,
    onClick,
  }: ReferenceBadgeProps) => {
    const startDecimal = eventToDecimalYear(
      event.startYear,
      event.startMonth,
      event.startDay
    );
    const x = mapper.yearToX(startDecimal);
    const color = primaryTrack?.color || "#6366f1";

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="absolute flex items-center gap-0.5 px-1.5 rounded-full cursor-pointer transition-all hover:brightness-125 whitespace-nowrap"
            style={{
              left: x,
              bottom: 2,
              height: 16,
              backgroundColor: `${color}30`,
              borderLeft: `2px solid ${color}`,
            }}
          >
            <span className="text-[10px] font-medium truncate max-w-[60px]" style={{ color }}>
              {event.name}
            </span>
            <ExternalLink className="w-2 h-2 shrink-0" style={{ color }} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium text-xs">{event.name}</p>
          <p className="text-[12px] text-t3">{formatDateRange(event)}</p>
          {primaryTrack && (
            <p className="text-[12px] text-t3 mt-0.5">
              In: {primaryTrack.name}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }
);

ReferenceBadge.displayName = "ReferenceBadge";

export default ReferenceBadge;
