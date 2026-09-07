// ---------------------------------------------------------------------------
// TimelineScrubber — the epoch axis of the Web view (Law V).
//
// Written for the retired /connections route and never mounted. Lifted into
// the Codex Web view by F3, with the hardcoded panel rgba and the two hex
// literals replaced by tokens. It scrubs edge validity intervals
// (world_connections.time_start / time_end); when the GLOBAL epoch control
// lands in the top bar (F6) this reads that instead.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimelineEvent } from "./web-graph-time";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TimelineScrubberProps {
  timePoints: string[];
  events: TimelineEvent[];
  currentIndex: number;
  onChange: (index: number) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineScrubber({
  timePoints,
  events,
  currentIndex,
  onChange,
  onClose,
}: TimelineScrubberProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      playInterval.current = setInterval(() => {
        onChange(currentIndex + 1);
      }, 800);
    } else {
      if (playInterval.current) clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, currentIndex, onChange]);

  // Stop at end
  useEffect(() => {
    if (currentIndex >= timePoints.length - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentIndex, timePoints.length, isPlaying]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  const handleRewind = useCallback(() => {
    onChange(0);
    setIsPlaying(false);
  }, [onChange]);

  const togglePlay = useCallback(() => {
    if (currentIndex >= timePoints.length - 1) {
      onChange(0);
    }
    setIsPlaying((p) => !p);
  }, [currentIndex, timePoints.length, onChange]);

  if (timePoints.length === 0) {
    return (
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 border border-sf-line bg-sf-surface px-4 py-2">
        <span className="font-sans text-[13px] text-t3">
          NO EPOCH ON FILE. Date a relation to scrub it.
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the epoch scrubber"
          className="text-t3 hover:text-t1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const currentLabel = timePoints[currentIndex] ?? "-";
  const firstLabel = timePoints[0];
  const lastLabel = timePoints[timePoints.length - 1];

  // Event markers positioned along the scrubber
  const eventPositions = events
    .map((ev) => {
      const idx = timePoints.indexOf(ev.timeLabel);
      if (idx === -1) return null;
      return {
        ...ev,
        percent: (idx / (timePoints.length - 1)) * 100,
      };
    })
    .filter(Boolean) as Array<TimelineEvent & { percent: number }>;

  return (
    <div className="absolute bottom-3 left-1/2 z-10 w-[min(600px,calc(100%-40px))] -translate-x-1/2 border border-sf-line bg-sf-surface px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Transport controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRewind}
            aria-label="Back to the first epoch"
            className="h-8 w-8 p-0 text-t3 hover:text-t1"
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play the epochs"}
            className="h-8 w-8 p-0 text-t3 hover:text-t1"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
        </div>

        {/* Scrubber track */}
        <div className="flex-1 relative">
          {/* Event markers */}
          {eventPositions.map((ev) => (
            <div
              key={ev.entityId}
              className="absolute top-0 w-1 h-2.5 -mt-1"
              style={{
                left: `${ev.percent}%`,
                background: "var(--sf-crimson)",
                transform: "translateX(-50%)",
              }}
              title={`${ev.entityName}: ${ev.timeLabel}`}
            />
          ))}

          <input
            type="range"
            min={0}
            max={timePoints.length - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            aria-label="Epoch"
            className="h-1 w-full accent-sf-primary"
            style={{
              background: `linear-gradient(to right, var(--sf-primary) ${
                (currentIndex / Math.max(1, timePoints.length - 1)) * 100
              }%, var(--sf-line) 0%)`,
            }}
          />

          {/* Labels */}
          <div className="flex justify-between mt-0.5">
            <span className="font-mono text-[12px] text-t4">{firstLabel}</span>
            <span className="font-mono text-[12px] text-t4">{lastLabel}</span>
          </div>
        </div>

        {/* Current time */}
        <div className="shrink-0 text-center min-w-[60px]">
          <span className="text-[12px] font-mono text-sf-primary-text">
            {currentLabel}
          </span>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the epoch scrubber"
          className="shrink-0 text-t3 hover:text-t1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
