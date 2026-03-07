import { useRef, useState, useCallback, useEffect, useMemo, forwardRef } from "react";
import { Layers, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GlassPanel } from "@/components/ui/glass-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TimelineTrack } from "@/lib/timeline/types";
import {
  TRACK_HEADER_WIDTH,
  TRACK_HEIGHT,
  COLLAPSED_TRACK_HEIGHT,
  TIME_AXIS_HEIGHT,
  MIN_PIXELS_PER_YEAR,
  MAX_PIXELS_PER_YEAR,
  NESTED_ROW_HEIGHT,
} from "@/lib/timeline/constants";
import {
  getVisibleRange,
  getEventsInRange,
  generateTicksWithCompressions,
  zoomAtCursor,
  clampZoom,
  fitAllEvents,
  getVisibleTrackEvents,
  getEventNestingLevel,
  createYearMapper,
  isFilterActive,
  getFilteredEventIds,
  getVisibleTracks,
  getFoldedTrackEvents,
} from "@/lib/timeline/utils";
import { useTimeline } from "@/lib/timeline/context";
import TrackLane from "./TrackLane";
import CompressionMarker from "./CompressionMarker";
import CausalityOverlay from "./CausalityOverlay";

interface TimelineViewProps {
  onEditTrack: (track: TimelineTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  onToggleCollapse: (trackId: string) => void;
  onQuickAddEvent: (trackId: string, year: number) => void;
}

const TimelineView = forwardRef<HTMLDivElement, TimelineViewProps>(({
  onEditTrack,
  onDeleteTrack,
  onToggleCollapse,
  onQuickAddEvent,
}, ref) => {
  const { state, filter, dispatch } = useTimeline();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1000);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; centerYear: number } | null>(null);

  const { pixelsPerYear, centerYear } = state.viewState;
  const visibleTracks = getVisibleTracks(state.tracks);
  const sortedTracks = [...visibleTracks].sort((a, b) => a.order - b.order);
  const hasTracks = state.tracks.length > 0;

  // ─── Resize observer ───────────────────────────────────────────────
  // Re-run when hasTracks changes so the observer attaches after the
  // empty-state early return stops rendering containerRef.

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTracks]);

  // ─── YearMapper (compression-aware positioning) ────────────────────

  const mapper = useMemo(
    () => createYearMapper(centerYear, pixelsPerYear, viewportWidth, state.compressions),
    [centerYear, pixelsPerYear, viewportWidth, state.compressions]
  );

  // ─── Filtering (Phase 3) ───────────────────────────────────────────

  const filterActive = isFilterActive(filter);
  const filteredEventIds = useMemo(
    () => (filterActive ? getFilteredEventIds(state.events, filter) : null),
    [filterActive, state.events, filter]
  );

  // ─── Visible range + ticks ─────────────────────────────────────────

  const visibleRange = getVisibleRange(centerYear, pixelsPerYear, viewportWidth);
  const visibleEvents = getEventsInRange(state.events, visibleRange);
  const ticks = generateTicksWithCompressions(visibleRange, pixelsPerYear, state.compressions);

  // ─── Mouse wheel zoom (native listener for passive: false) ───────

  const viewStateRef = useRef(state.viewState);
  viewStateRef.current = state.viewState;
  const viewportWidthRef = useRef(viewportWidth);
  viewportWidthRef.current = viewportWidth;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const newView = zoomAtCursor(
        viewStateRef.current,
        cursorX,
        e.deltaY,
        viewportWidthRef.current
      );
      dispatchRef.current({ type: "SET_VIEW_STATE", payload: newView });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [hasTracks]);

  // ─── Pan (mouse drag) ─────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickX = e.clientX - rect.left;
      if (clickX < TRACK_HEADER_WIDTH) return;

      setIsPanning(true);
      panStart.current = { x: e.clientX, centerYear };
    },
    [centerYear]
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panStart.current) return;
      const dx = e.clientX - panStart.current.x;
      const yearDelta = dx / pixelsPerYear;
      dispatch({
        type: "SET_VIEW_STATE",
        payload: {
          pixelsPerYear,
          centerYear: panStart.current.centerYear - yearDelta,
        },
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStart.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, pixelsPerYear, dispatch]);

  // ─── Zoom controls ─────────────────────────────────────────────────

  const handleFitAll = useCallback(() => {
    const fit = fitAllEvents(state.events, viewportWidth);
    if (fit) dispatch({ type: "SET_VIEW_STATE", payload: fit });
  }, [state.events, viewportWidth, dispatch]);

  const handleZoomSlider = useCallback(
    (value: number[]) => {
      const t = value[0] / 100;
      const logMin = Math.log10(MIN_PIXELS_PER_YEAR);
      const logMax = Math.log10(MAX_PIXELS_PER_YEAR);
      const ppy = Math.pow(10, logMin + t * (logMax - logMin));
      dispatch({
        type: "SET_VIEW_STATE",
        payload: { pixelsPerYear: clampZoom(ppy), centerYear },
      });
    },
    [centerYear, dispatch]
  );

  const sliderValue = (() => {
    const logMin = Math.log10(MIN_PIXELS_PER_YEAR);
    const logMax = Math.log10(MAX_PIXELS_PER_YEAR);
    const t = (Math.log10(pixelsPerYear) - logMin) / (logMax - logMin);
    return Math.round(t * 100);
  })();

  // ─── Empty State ───────────────────────────────────────────────────

  if (state.tracks.length === 0) {
    return (
      <GlassPanel className="flex flex-col items-center justify-center py-24 text-center">
        <Layers className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-heading text-lg font-semibold mb-2">
          NO TRACKS DEFINED
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Tracks are swim lanes for different entities—characters, civilizations,
          ships, planets. Add a track, then place events on it.
        </p>
      </GlassPanel>
    );
  }

  // ─── Compute total height ──────────────────────────────────────────

  const totalHeight = sortedTracks.reduce((sum, t) => {
    if (t.isCollapsed) return sum + COLLAPSED_TRACK_HEIGHT;
    const visible = getVisibleTrackEvents(state.events, t.id, state.expandedEventIds);
    const nestedCount = visible.filter(
      (e) => getEventNestingLevel(e.id, state.events) > 0
    ).length;
    return sum + TRACK_HEIGHT + nestedCount * NESTED_ROW_HEIGHT;
  }, 0);

  return (
    <div ref={ref} className="space-y-2">
      {/* Zoom Toolbar */}
      <div className="flex items-center gap-3 px-2">
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => {
          dispatch({
            type: "SET_VIEW_STATE",
            payload: { pixelsPerYear: clampZoom(pixelsPerYear * 0.5), centerYear },
          });
        }}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <div className="w-32">
          <Slider
            value={[sliderValue]}
            onValueChange={handleZoomSlider}
            min={0}
            max={100}
            step={1}
          />
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => {
          dispatch({
            type: "SET_VIEW_STATE",
            payload: { pixelsPerYear: clampZoom(pixelsPerYear * 2), centerYear },
          });
        }}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={handleFitAll}
          disabled={state.events.length === 0}
        >
          <Maximize2 className="w-3.5 h-3.5 mr-1" />
          Fit All
        </Button>
      </div>

      {/* Timeline Container */}
      <GlassPanel className="overflow-hidden">
        <TooltipProvider delayDuration={200}>
          <div
            ref={containerRef}
            className="relative overflow-x-hidden overflow-y-auto select-none"
            style={{
              cursor: isPanning ? "grabbing" : "grab",
              maxHeight: "60vh",
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Time Axis */}
            <div
              className="sticky top-0 z-20 flex border-b border-border/40 bg-background/95 backdrop-blur-sm"
              style={{ height: TIME_AXIS_HEIGHT }}
            >
              {/* Header spacer */}
              <div
                className="shrink-0 border-r border-border/30"
                style={{ width: TRACK_HEADER_WIDTH }}
              />
              {/* Tick marks */}
              <div className="relative flex-1 min-w-0 overflow-hidden">
                {ticks.map((tick, i) => {
                  const x = mapper.yearToX(tick.year);
                  if (x < TRACK_HEADER_WIDTH || x > viewportWidth + 50) return null;

                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex flex-col items-center justify-end"
                      style={{ left: x - TRACK_HEADER_WIDTH }}
                    >
                      <span
                        className={`text-[10px] leading-none mb-1 whitespace-nowrap ${
                          tick.isMajor
                            ? "text-foreground/70 font-medium"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {tick.label}
                      </span>
                      <div
                        className={`w-px ${
                          tick.isMajor ? "h-2 bg-foreground/30" : "h-1 bg-foreground/15"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Track Lanes */}
            <div>
              {sortedTracks.map((track) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  events={visibleEvents}
                  foldedEvents={getFoldedTrackEvents(visibleEvents, state.tracks, track.id)}
                  mapper={mapper}
                  filteredEventIds={filteredEventIds}
                  onEditTrack={onEditTrack}
                  onDeleteTrack={onDeleteTrack}
                  onToggleCollapse={onToggleCollapse}
                  onQuickAddEvent={onQuickAddEvent}
                />
              ))}
            </div>

            {/* Tick grid lines (behind events) */}
            <div
              className="absolute top-0 left-0 w-full pointer-events-none"
              style={{
                height: totalHeight + TIME_AXIS_HEIGHT,
                marginLeft: TRACK_HEADER_WIDTH,
              }}
            >
              {ticks
                .filter((t) => t.isMajor)
                .map((tick, i) => {
                  const x = mapper.yearToX(tick.year);
                  if (x < TRACK_HEADER_WIDTH || x > viewportWidth + 50) return null;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 w-px h-full bg-foreground/5"
                      style={{ left: x - TRACK_HEADER_WIDTH }}
                    />
                  );
                })}
            </div>

            {/* Compression markers */}
            {state.compressions.length > 0 && (
              <div
                className="absolute left-0 w-full pointer-events-none"
                style={{
                  top: TIME_AXIS_HEIGHT,
                  height: totalHeight,
                  paddingLeft: TRACK_HEADER_WIDTH,
                }}
              >
                <div className="relative w-full h-full pointer-events-auto">
                  {state.compressions.map((comp) => (
                    <CompressionMarker
                      key={comp.id}
                      compression={comp}
                      mapper={mapper}
                      totalHeight={totalHeight}
                      onClick={() =>
                        dispatch({
                          type: "TOGGLE_COMPRESSION_EXPAND",
                          payload: comp.id,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Causality link curves */}
            {state.causalityLinksVisible && state.eventLinks.length > 0 && (
              <div
                className="absolute left-0 w-full pointer-events-none"
                style={{
                  top: TIME_AXIS_HEIGHT,
                  height: totalHeight,
                }}
              >
                <CausalityOverlay
                  links={state.eventLinks}
                  events={state.events}
                  tracks={sortedTracks}
                  mapper={mapper}
                  totalHeight={totalHeight}
                />
              </div>
            )}
          </div>
        </TooltipProvider>
      </GlassPanel>
    </div>
  );
});

TimelineView.displayName = "TimelineView";

export default TimelineView;
