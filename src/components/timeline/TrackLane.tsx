import { memo, useMemo } from "react";
import type { TimelineTrack, TimelineEvent } from "@/lib/timeline/types";
import {
  TRACK_HEIGHT,
  COLLAPSED_TRACK_HEIGHT,
  TRACK_HEADER_WIDTH,
  NESTED_ROW_HEIGHT,
} from "@/lib/timeline/constants";
import {
  getVisibleTrackEvents,
  getEventNestingLevel,
  getTrackReferences,
  getFoldedTracks,
  getVisibleTracks,
} from "@/lib/timeline/utils";
import type { YearMapper } from "@/lib/timeline/utils";
import { useTimeline } from "@/lib/timeline/context";
import EventMarker from "./EventMarker";
import ReferenceBadge from "./ReferenceBadge";
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  FoldVertical,
  Layers,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { eventToDecimalYear } from "@/lib/timeline/utils";

interface TrackLaneProps {
  track: TimelineTrack;
  events: TimelineEvent[];
  foldedEvents?: TimelineEvent[];
  mapper: YearMapper;
  filteredEventIds?: Set<string> | null;
  onEditTrack: (track: TimelineTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  onToggleCollapse: (trackId: string) => void;
  onQuickAddEvent: (trackId: string, year: number) => void;
}

const TrackLane = memo(
  ({
    track,
    events,
    foldedEvents = [],
    mapper,
    filteredEventIds,
    onEditTrack,
    onDeleteTrack,
    onToggleCollapse,
    onQuickAddEvent,
  }: TrackLaneProps) => {
    const { state, selectedEventId, dispatch } = useTimeline();
    const { expandedEventIds, tracks: allTracks, elementLinks } = state;

    // Set of event IDs that have element links (for indicator)
    const elementLinkedEventIds = useMemo(() => {
      const ids = new Set<string>();
      for (const link of elementLinks) ids.add(link.eventId);
      return ids;
    }, [elementLinks]);

    // Get visible events respecting expand/collapse hierarchy
    const visibleEvents = useMemo(
      () => getVisibleTrackEvents(events, track.id, expandedEventIds),
      [events, track.id, expandedEventIds]
    );

    // Tracks folded into this one
    const foldedTracks = useMemo(
      () => getFoldedTracks(allTracks, track.id),
      [allTracks, track.id]
    );

    // Available host tracks for "Fold into..." menu (visible, non-self, not already folded)
    const foldTargets = useMemo(
      () => getVisibleTracks(allTracks).filter((t) => t.id !== track.id),
      [allTracks, track.id]
    );

    // Compute dynamic height: base track height + rows for nested children
    const height = useMemo(() => {
      if (track.isCollapsed) return COLLAPSED_TRACK_HEIGHT;
      // Count how many nested events are visible (level > 0)
      const nestedCount = visibleEvents.filter((e) => {
        const level = getEventNestingLevel(e.id, events);
        return level > 0;
      }).length;
      return TRACK_HEIGHT + nestedCount * NESTED_ROW_HEIGHT;
    }, [track.isCollapsed, visibleEvents, events]);

    // Events from other tracks that reference this track
    const references = useMemo(
      () => getTrackReferences(events, track.id),
      [events, track.id]
    );

    const handleLaneDoubleClick = (_e: React.MouseEvent<HTMLDivElement>) => {
      if (track.isCollapsed) return;
      onQuickAddEvent(track.id, 0);
    };

    return (
      <div
        className="flex border-b border-sf-border group/track"
        style={{ height }}
      >
        {/* Track Header, sticky left */}
        <div
          className="sticky left-0 z-10 flex items-center gap-1.5 px-2 bg-background/95 backdrop-blur-sm border-r border-sf-border shrink-0"
          style={{ width: TRACK_HEADER_WIDTH }}
        >
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => onToggleCollapse(track.id)}
            className="text-t3 hover:text-t1 transition-colors p-0.5"
          >
            {track.isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Color dot + name */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: track.color }}
          />
          <span className="text-xs font-medium truncate flex-1">
            {track.name}
          </span>

          {/* Folded track chips */}
          {foldedTracks.length > 0 && (
            <div className="flex items-center gap-0.5 ml-0.5">
              <Layers className="w-3 h-3 text-t3/60 shrink-0" />
              {foldedTracks.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => dispatch({ type: "UNFOLD_TRACK", payload: ft.id })}
                  className="flex items-center gap-0.5 px-1 py-0 rounded text-[9px] text-t3 hover:text-t1 bg-muted/30 hover:bg-muted/50 transition-colors"
                  title={`Unfold ${ft.name}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: ft.color }}
                  />
                  <X className="w-2 h-2" />
                </button>
              ))}
            </div>
          )}

          {/* Edit/Delete/Fold, shown on hover */}
          <div className="hidden group-hover/track:flex items-center gap-0.5">
            {/* Fold into... */}
            {foldTargets.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-5 h-5" title="Fold into...">
                    <FoldVertical className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1.5" align="start" side="bottom">
                  <p className="text-[10px] font-medium text-t3 px-1.5 mb-1">
                    Fold into...
                  </p>
                  {foldTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "FOLD_TRACK",
                          payload: { trackId: track.id, intoTrackId: target.id },
                        })
                      }
                      className="flex items-center gap-2 w-full px-1.5 py-1 rounded hover:bg-muted/50 text-xs text-left"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: target.color }}
                      />
                      <span className="truncate">{target.name}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5"
              onClick={() => onEditTrack(track)}
              aria-label="Edit track"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 text-sf-crimson hover:text-sf-crimson"
              onClick={() => onDeleteTrack(track.id)}
              aria-label="Delete track"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Event Lane */}
        <div
          className="relative flex-1 min-w-0"
          onDoubleClick={handleLaneDoubleClick}
        >
          {!track.isCollapsed &&
            visibleEvents.map((event) => {
              const nestingLevel = getEventNestingLevel(event.id, events);
              const hasChildren = events.some((e) => e.parentEventId === event.id);
              const isExpanded = expandedEventIds.includes(event.id);

              return (
                <EventMarker
                  key={event.id}
                  event={event}
                  mapper={mapper}
                  isSelected={selectedEventId === event.id}
                  isDimmed={filteredEventIds != null && !filteredEventIds.has(event.id)}
                  hasElementLinks={elementLinkedEventIds.has(event.id)}
                  trackColor={track.color}
                  nestingLevel={nestingLevel as 0 | 1 | 2}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  onClick={() => dispatch({ type: "SELECT_EVENT", payload: event.id })}
                  onToggleExpand={
                    hasChildren && event.hasDuration
                      ? () => dispatch({ type: "TOGGLE_EVENT_EXPAND", payload: event.id })
                      : undefined
                  }
                />
              );
            })}
          {/* Reference badges from other tracks */}
          {!track.isCollapsed &&
            references.map((refEvent) => (
              <ReferenceBadge
                key={`ref-${refEvent.id}`}
                event={refEvent}
                primaryTrack={allTracks.find((t) => t.id === refEvent.trackId)}
                mapper={mapper}
                onClick={() => dispatch({ type: "SELECT_EVENT", payload: refEvent.id })}
              />
            ))}
          {/* Folded events from tracks folded into this one */}
          {!track.isCollapsed &&
            foldedEvents.map((event) => {
              const foldedTrack = allTracks.find((t) => t.id === event.trackId);
              return (
                <EventMarker
                  key={`folded-${event.id}`}
                  event={event}
                  mapper={mapper}
                  isSelected={selectedEventId === event.id}
                  isDimmed={filteredEventIds != null && !filteredEventIds.has(event.id)}
                  isFolded
                  trackColor={foldedTrack?.color || track.color}
                  onClick={() => dispatch({ type: "SELECT_EVENT", payload: event.id })}
                />
              );
            })}
        </div>
      </div>
    );
  }
);

TrackLane.displayName = "TrackLane";

export default TrackLane;
