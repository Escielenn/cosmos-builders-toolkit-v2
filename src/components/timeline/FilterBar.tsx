import { useState, useEffect, useMemo } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { EventType, ImportanceLevel } from "@/lib/timeline/types";
import { EVENT_TYPES, IMPORTANCE_LEVELS } from "@/lib/timeline/constants";
import { isFilterActive } from "@/lib/timeline/utils";
import { useTimeline } from "@/lib/timeline/context";
import { cn } from "@/lib/utils";

const FilterBar = () => {
  const { state, filter, dispatch } = useTimeline();
  const [searchInput, setSearchInput] = useState(filter.searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "SET_FILTER", payload: { searchQuery: searchInput } });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  // Sync local input if filter is cleared externally
  useEffect(() => {
    if (filter.searchQuery === "" && searchInput !== "") {
      setSearchInput("");
    }
  }, [filter.searchQuery]);

  const active = isFilterActive(filter);
  const activeCount = useMemo(() => {
    let count = 0;
    if (filter.searchQuery) count++;
    if (filter.trackIds.length > 0) count++;
    if (filter.eventTypes.length > 0) count++;
    if (filter.importanceLevels.length > 0) count++;
    if (filter.dateRange) count++;
    if (filter.tags.length > 0) count++;
    return count;
  }, [filter]);

  // Collect all unique tags from events
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const event of state.events) {
      if (event.tags) event.tags.forEach((t) => tags.add(t));
    }
    return Array.from(tags).sort();
  }, [state.events]);

  const toggleTrackFilter = (trackId: string) => {
    const current = filter.trackIds;
    const updated = current.includes(trackId)
      ? current.filter((id) => id !== trackId)
      : [...current, trackId];
    dispatch({ type: "SET_FILTER", payload: { trackIds: updated } });
  };

  const toggleEventTypeFilter = (eventType: EventType) => {
    const current = filter.eventTypes;
    const updated = current.includes(eventType)
      ? current.filter((et) => et !== eventType)
      : [...current, eventType];
    dispatch({ type: "SET_FILTER", payload: { eventTypes: updated } });
  };

  const toggleImportanceFilter = (level: ImportanceLevel) => {
    const current = filter.importanceLevels;
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    dispatch({ type: "SET_FILTER", payload: { importanceLevels: updated } });
  };

  const toggleTagFilter = (tag: string) => {
    const current = filter.tags;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    dispatch({ type: "SET_FILTER", payload: { tags: updated } });
  };

  // Event type categories for grouped display
  const eventTypeCategories = useMemo(() => [
    { label: "Character", types: EVENT_TYPES.filter((et) => et.category === "character") },
    { label: "Civilization", types: EVENT_TYPES.filter((et) => et.category === "civilization") },
    { label: "Conflict", types: EVENT_TYPES.filter((et) => et.category === "conflict") },
    { label: "Discovery", types: EVENT_TYPES.filter((et) => et.category === "discovery") },
    { label: "Settlement", types: EVENT_TYPES.filter((et) => et.category === "settlement") },
    { label: "Journey", types: EVENT_TYPES.filter((et) => et.category === "journey") },
    { label: "Other", types: EVENT_TYPES.filter((et) => et.category === "custom") },
  ], []);

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      {/* Search Input */}
      <div className="relative w-48">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t3" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search events..."
          className="pl-7 h-8 text-xs"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-t3 hover:text-t1"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Track Filter */}
      {state.tracks.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1",
                filter.trackIds.length > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              Tracks
              {filter.trackIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[12px]">
                  {filter.trackIds.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="start">
            <div className="space-y-1">
              {state.tracks.map((track) => (
                <label
                  key={track.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={filter.trackIds.includes(track.id)}
                    onCheckedChange={() => toggleTrackFilter(track.id)}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-xs truncate">{track.name}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Event Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs gap-1",
              filter.eventTypes.length > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            Type
            {filter.eventTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[12px]">
                {filter.eventTypes.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 max-h-64 overflow-y-auto" align="start">
          <div className="space-y-2">
            {eventTypeCategories.map((cat) => (
              <div key={cat.label}>
                <p className="text-[12px] font-medium text-t3 uppercase tracking-wider px-2 mb-0.5">
                  {cat.label}
                </p>
                {cat.types.map((et) => (
                  <label
                    key={et.id}
                    className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={filter.eventTypes.includes(et.id)}
                      onCheckedChange={() => toggleEventTypeFilter(et.id)}
                    />
                    <span className="text-xs">{et.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Importance Filter */}
      <div className="flex items-center gap-0.5">
        {IMPORTANCE_LEVELS.map((il) => (
          <button
            key={il.id}
            type="button"
            onClick={() => toggleImportanceFilter(il.id)}
            className={cn(
              "px-2 py-1 rounded border text-[12px] font-medium transition-colors h-8",
              filter.importanceLevels.includes(il.id)
                ? "border-primary bg-primary/10 text-t1"
                : "border-sf-border text-t3 hover:border-sf-border"
            )}
          >
            {il.label}
          </button>
        ))}
      </div>

      {/* Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs gap-1",
              filter.dateRange && "border-primary/50 bg-primary/5"
            )}
          >
            Date Range
            {filter.dateRange && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[12px]">1</Badge>
            )}
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[12px] text-t3 font-medium">From Year</label>
              <Input
                type="number"
                className="h-7 text-xs"
                placeholder="Start year"
                value={filter.dateRange?.start ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  const current = filter.dateRange || {};
                  if (val === undefined && current.end === undefined) {
                    dispatch({ type: "SET_FILTER", payload: { dateRange: null } });
                  } else {
                    dispatch({
                      type: "SET_FILTER",
                      payload: { dateRange: { ...current, start: val } },
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-t3 font-medium">To Year</label>
              <Input
                type="number"
                className="h-7 text-xs"
                placeholder="End year"
                value={filter.dateRange?.end ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  const current = filter.dateRange || {};
                  if (val === undefined && current.start === undefined) {
                    dispatch({ type: "SET_FILTER", payload: { dateRange: null } });
                  } else {
                    dispatch({
                      type: "SET_FILTER",
                      payload: { dateRange: { ...current, end: val } },
                    });
                  }
                }}
              />
            </div>
            {filter.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-[12px]"
                onClick={() => dispatch({ type: "SET_FILTER", payload: { dateRange: null } })}
              >
                Clear Range
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1",
                filter.tags.length > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              Tags
              {filter.tags.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[12px]">
                  {filter.tags.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2 max-h-48 overflow-y-auto" align="start">
            <div className="space-y-1">
              {allTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={filter.tags.includes(tag)}
                    onCheckedChange={() => toggleTagFilter(tag)}
                  />
                  <span className="text-xs">{tag}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear All */}
      {active && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-t3 hover:text-t1 gap-1"
          onClick={() => dispatch({ type: "CLEAR_FILTERS" })}
        >
          <X className="w-3 h-3" />
          Clear All
          {activeCount > 1 && (
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[12px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Active filter indicator */}
      {active && (
        <div className="flex items-center gap-1 text-[12px] text-primary/70 ml-auto">
          <Filter className="w-3 h-3" />
          Filtering active
        </div>
      )}
    </div>
  );
};

export default FilterBar;
