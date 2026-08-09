// ---------------------------------------------------------------------------
// TimelineScrubber, Horizontal timeline bar for temporal layer filtering.
// Section 8.3 of the spec.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimelineEvent } from "./graph-algorithms";

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
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2"
        style={{
          background: "rgba(15,15,16,0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-[12px] text-t4 font-sans">
          No temporal data. Add time_start / time_end to connections.
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-t4 hover:text-t2"
        >
          <X className="w-3 h-3" />
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
    <div
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[min(600px,calc(100%-40px))]"
      style={{
        background: "rgba(15,15,16,0.92)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 16px",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Transport controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRewind}
            className="h-6 w-6 p-0 text-t3 hover:text-t1"
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-6 w-6 p-0 text-t3 hover:text-t1"
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
                background: "#FF3366",
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
            className="w-full accent-teal h-1"
            style={{
              background: `linear-gradient(to right, #15C17B ${(currentIndex / (timePoints.length - 1)) * 100}%, rgba(255,255,255,0.1) 0%)`,
            }}
          />

          {/* Labels */}
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] font-mono text-t5">{firstLabel}</span>
            <span className="text-[10px] font-mono text-t5">{lastLabel}</span>
          </div>
        </div>

        {/* Current time */}
        <div className="shrink-0 text-center min-w-[60px]">
          <span className="text-[12px] font-mono text-teal">
            {currentLabel}
          </span>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="text-t4 hover:text-t2 shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
