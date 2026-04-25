import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimeCompression } from "@/lib/timeline/types";
import type { YearMapper } from "@/lib/timeline/utils";
import { TRACK_HEADER_WIDTH } from "@/lib/timeline/constants";
import { cn } from "@/lib/utils";

interface CompressionMarkerProps {
  compression: TimeCompression;
  mapper: YearMapper;
  totalHeight: number;
  onClick: () => void;
}

/**
 * Visual indicator spanning all tracks at the compression's position.
 * Three styles: break (parallel lines), fade (gradient edges), spiral (icon).
 */
const CompressionMarker = memo(
  ({ compression, mapper, totalHeight, onClick }: CompressionMarkerProps) => {
    const startX = mapper.yearToX(compression.startYear) - TRACK_HEADER_WIDTH;
    const endX = mapper.yearToX(compression.endYear) - TRACK_HEADER_WIDTH;
    const width = Math.max(endX - startX, compression.displayWidth);

    const yearSpan = compression.endYear - compression.startYear;
    const label =
      compression.label || `${formatYearSpan(yearSpan)} compressed`;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              "absolute top-0 z-10 cursor-pointer transition-opacity hover:opacity-90",
              "flex items-center justify-center"
            )}
            style={{
              left: startX,
              width,
              height: totalHeight,
            }}
          >
            {/* Style-specific visuals */}
            {compression.style === "break" && (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-muted/30 to-background/80" />
                {/* Angled parallel lines */}
                <svg className="w-full h-full absolute inset-0 opacity-30" preserveAspectRatio="none">
                  <line x1="35%" y1="0" x2="40%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="text-foreground/40" />
                  <line x1="55%" y1="0" x2="60%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="text-foreground/40" />
                </svg>
                {compression.label && (
                  <span className="relative text-[9px] text-t3 font-medium px-1 bg-background/60 rounded whitespace-nowrap">
                    {compression.label}
                  </span>
                )}
              </div>
            )}

            {compression.style === "fade" && (
              <div className="w-full h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-muted/20 to-background" />
                {compression.label && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-t3 font-medium px-1 bg-background/60 rounded whitespace-nowrap">
                    {compression.label}
                  </span>
                )}
              </div>
            )}

            {compression.style === "spiral" && (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-primary/5 to-background/80" />
                <div className="relative flex flex-col items-center gap-0.5">
                  <span className="text-primary/40 text-lg">&#8734;</span>
                  {compression.label && (
                    <span className="text-[9px] text-t3 font-medium px-1 bg-background/60 rounded whitespace-nowrap">
                      {compression.label}
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold text-xs">{label}</p>
          <p className="text-[10px] text-t3">
            {compression.startYear.toLocaleString()} — {compression.endYear.toLocaleString()} ({formatYearSpan(yearSpan)})
          </p>
          <p className="text-[10px] text-t3 mt-0.5">
            Click to {compression.isExpanded ? "compress" : "expand"}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }
);

function formatYearSpan(years: number): string {
  if (years >= 1_000_000) return `${(years / 1_000_000).toFixed(1)}M years`;
  if (years >= 1_000) return `${(years / 1_000).toFixed(1)}K years`;
  return `${years} years`;
}

CompressionMarker.displayName = "CompressionMarker";

export default CompressionMarker;
