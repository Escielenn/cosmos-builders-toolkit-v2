// Timeline Tool — Utility Functions

import type {
  TimelineEvent,
  TimelineTrack,
  TimelineFilter,
  EventLink,
  ElementLink,
  ViewState,
  CustomCalendar,
  CalendarDate,
} from "./types";
import { EARTH_CALENDAR_ID } from "./types";
import {
  MIN_PIXELS_PER_YEAR,
  MAX_PIXELS_PER_YEAR,
  TRACK_HEADER_WIDTH,
  MONTH_NAMES,
  MONTH_NAMES_FULL,
} from "./constants";

// ─── ID Generation ────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
}

// ─── Coordinate Conversion ────────────────────────────────────────

/** Convert a year value to an x-pixel position in the viewport. */
export function yearToX(
  year: number,
  centerYear: number,
  pixelsPerYear: number,
  viewportWidth: number
): number {
  const contentWidth = viewportWidth - TRACK_HEADER_WIDTH;
  const contentCenter = contentWidth / 2;
  return TRACK_HEADER_WIDTH + contentCenter + (year - centerYear) * pixelsPerYear;
}

/** Convert an x-pixel position in the viewport to a year value. */
export function xToYear(
  x: number,
  centerYear: number,
  pixelsPerYear: number,
  viewportWidth: number
): number {
  const contentWidth = viewportWidth - TRACK_HEADER_WIDTH;
  const contentCenter = contentWidth / 2;
  return centerYear + (x - TRACK_HEADER_WIDTH - contentCenter) / pixelsPerYear;
}

// ─── Visible Range ────────────────────────────────────────────────

export interface VisibleRange {
  startYear: number;
  endYear: number;
}

/** Get the range of years currently visible in the viewport. */
export function getVisibleRange(
  centerYear: number,
  pixelsPerYear: number,
  viewportWidth: number
): VisibleRange {
  const contentWidth = viewportWidth - TRACK_HEADER_WIDTH;
  const halfSpan = contentWidth / 2 / pixelsPerYear;
  return {
    startYear: centerYear - halfSpan,
    endYear: centerYear + halfSpan,
  };
}

/** Filter events to only those visible in the given range, with a small buffer. */
export function getEventsInRange(
  events: TimelineEvent[],
  range: VisibleRange
): TimelineEvent[] {
  const buffer = (range.endYear - range.startYear) * 0.1;
  const start = range.startYear - buffer;
  const end = range.endYear + buffer;

  return events.filter((e) => {
    const eventEnd = e.endYear ?? e.startYear;
    return eventEnd >= start && e.startYear <= end;
  });
}

// ─── Fit All ──────────────────────────────────────────────────────

/** Compute a ViewState that fits all events into the viewport. */
export function fitAllEvents(
  events: TimelineEvent[],
  viewportWidth: number
): ViewState | null {
  if (events.length === 0) return null;

  let minYear = Infinity;
  let maxYear = -Infinity;

  for (const e of events) {
    const start = eventToDecimalYear(e.startYear, e.startMonth, e.startDay);
    const end = e.endYear != null
      ? eventToDecimalYear(e.endYear, e.endMonth, e.endDay)
      : start;
    if (start < minYear) minYear = start;
    if (end > maxYear) maxYear = end;
  }

  const span = maxYear - minYear;
  const padding = Math.max(span * 0.1, 1); // at least 1 year padding
  const totalSpan = span + padding * 2;
  const contentWidth = viewportWidth - TRACK_HEADER_WIDTH;

  const pixelsPerYear = clampZoom(contentWidth / totalSpan);
  const centerYear = minYear + span / 2;

  return { pixelsPerYear, centerYear };
}

// ─── Zoom Helpers ─────────────────────────────────────────────────

/** Clamp pixelsPerYear to valid range. */
export function clampZoom(ppy: number): number {
  return Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, ppy));
}

/** Compute new view state after a zoom centered at a cursor position. */
export function zoomAtCursor(
  viewState: ViewState,
  cursorX: number,
  deltaY: number,
  viewportWidth: number
): ViewState {
  const cursorYear = xToYear(cursorX, viewState.centerYear, viewState.pixelsPerYear, viewportWidth);
  const factor = 1 - deltaY * 0.002;
  const newPPY = clampZoom(viewState.pixelsPerYear * factor);

  const contentWidth = viewportWidth - TRACK_HEADER_WIDTH;
  const contentCenter = contentWidth / 2;
  const newCenterYear = cursorYear - (cursorX - TRACK_HEADER_WIDTH - contentCenter) / newPPY;

  return { pixelsPerYear: newPPY, centerYear: newCenterYear };
}

// ─── Tick Generation ──────────────────────────────────────────────

export interface Tick {
  year: number;
  label: string;
  isMajor: boolean;
}

interface TickConfig {
  interval: number;
  majorEvery: number;
  format: (year: number) => string;
}

/** Determine appropriate tick interval based on zoom level. */
function getTickConfig(pixelsPerYear: number): TickConfig {
  if (pixelsPerYear < 0.01) {
    return { interval: 10000, majorEvery: 5, format: (y) => formatLargeYear(y) };
  }
  if (pixelsPerYear < 0.05) {
    return { interval: 1000, majorEvery: 5, format: (y) => formatLargeYear(y) };
  }
  if (pixelsPerYear < 0.5) {
    return { interval: 100, majorEvery: 5, format: (y) => String(y) };
  }
  if (pixelsPerYear < 5) {
    return { interval: 10, majorEvery: 5, format: (y) => String(y) };
  }
  if (pixelsPerYear < 50) {
    return { interval: 1, majorEvery: 10, format: (y) => String(y) };
  }
  // Sub-year ticks (monthly)
  return {
    interval: 1 / 12,
    majorEvery: 12,
    format: (y) => {
      const wholeYear = Math.floor(y);
      const monthIndex = Math.round((y - wholeYear) * 12);
      if (monthIndex === 0) return String(wholeYear);
      return MONTH_NAMES[monthIndex % 12];
    },
  };
}

/** Format large years with K/M suffixes. */
function formatLargeYear(year: number): string {
  const abs = Math.abs(year);
  const sign = year < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${sign}${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
  return String(year);
}

/** Generate tick marks for the visible range. */
export function generateTicks(
  range: VisibleRange,
  pixelsPerYear: number
): Tick[] {
  const config = getTickConfig(pixelsPerYear);
  const { interval, majorEvery, format } = config;

  const start = Math.floor(range.startYear / interval) * interval;
  const end = Math.ceil(range.endYear / interval) * interval;

  const ticks: Tick[] = [];
  const majorInterval = interval * majorEvery;

  for (let y = start; y <= end; y += interval) {
    // Avoid floating point drift for sub-year ticks
    const rounded = Math.round(y * 1200) / 1200;
    const isMajor =
      interval < 1
        ? Math.abs(rounded - Math.round(rounded)) < 0.001
        : Math.abs(rounded % majorInterval) < 0.001;

    ticks.push({
      year: rounded,
      label: format(rounded),
      isMajor,
    });
  }

  return ticks;
}

// ─── Date Formatting ──────────────────────────────────────────────

/** Convert year/month/day to a decimal year for positioning. */
export function eventToDecimalYear(
  year: number,
  month?: number,
  day?: number
): number {
  if (month == null) return year;
  const m = month - 1; // 0-indexed
  const d = (day ?? 1) - 1;
  return year + (m * 30.44 + d) / 365.25;
}

/** Format a timeline date for display. */
export function formatTimelineDate(
  year: number,
  month?: number,
  day?: number
): string {
  if (month == null) return formatLargeYear(year);
  const monthName = MONTH_NAMES_FULL[(month - 1) % 12];
  if (day == null) return `${monthName} ${year}`;
  return `${day} ${monthName} ${year}`;
}

/** Format a date range for display. */
export function formatDateRange(event: TimelineEvent): string {
  const start = formatTimelineDate(event.startYear, event.startMonth, event.startDay);
  if (!event.hasDuration || event.endYear == null) return start;
  const end = formatTimelineDate(event.endYear, event.endMonth, event.endDay);
  return `${start} — ${end}`;
}

// ─── Event Helpers ────────────────────────────────────────────────

/** Get child events of a parent event. */
export function getChildEvents(
  events: TimelineEvent[],
  parentId: string
): TimelineEvent[] {
  return events.filter((e) => e.parentEventId === parentId);
}

/** Sort events by start date. */
export function sortEventsByDate(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const aYear = eventToDecimalYear(a.startYear, a.startMonth, a.startDay);
    const bYear = eventToDecimalYear(b.startYear, b.startMonth, b.startDay);
    return aYear - bYear;
  });
}

/** Get events for a specific track. */
export function getTrackEvents(
  events: TimelineEvent[],
  trackId: string
): TimelineEvent[] {
  return events.filter((e) => e.trackId === trackId);
}

// ─── Nesting Helpers (Phase 2) ────────────────────────────────────

/** Get the nesting level of an event (0 = top-level, 1 = child, 2 = grandchild). */
export function getEventNestingLevel(
  eventId: string,
  events: TimelineEvent[]
): number {
  let level = 0;
  let current = events.find((e) => e.id === eventId);
  while (current?.parentEventId && level < 2) {
    current = events.find((e) => e.id === current!.parentEventId);
    level++;
  }
  return level;
}

/** Check if proposedParentId is a valid parent for eventId. */
export function canSetParent(
  eventId: string,
  proposedParentId: string,
  events: TimelineEvent[]
): boolean {
  // Can't parent to self
  if (eventId === proposedParentId) return false;
  // Parent must be a duration event
  const parent = events.find((e) => e.id === proposedParentId);
  if (!parent || !parent.hasDuration) return false;
  // Parent must be at level 0 or 1 (max depth = 2)
  const parentLevel = getEventNestingLevel(proposedParentId, events);
  if (parentLevel > 1) return false;
  // Can't create circular references — check if proposedParent is a descendant
  const descendants = getDescendants(eventId, events);
  if (descendants.some((d) => d.id === proposedParentId)) return false;
  return true;
}

/** Get all descendants (children + grandchildren) of an event. */
export function getDescendants(
  eventId: string,
  events: TimelineEvent[]
): TimelineEvent[] {
  const result: TimelineEvent[] = [];
  const children = events.filter((e) => e.parentEventId === eventId);
  for (const child of children) {
    result.push(child);
    result.push(...getDescendants(child.id, events));
  }
  return result;
}

/**
 * Get events for a track, filtered by expand/collapse state.
 * Returns events grouped by hierarchy for rendering.
 */
export function getVisibleTrackEvents(
  events: TimelineEvent[],
  trackId: string,
  expandedEventIds: string[]
): TimelineEvent[] {
  const trackEvents = events.filter((e) => e.trackId === trackId);
  const visible: TimelineEvent[] = [];

  // Get top-level events (no parent or parent not in this track)
  const topLevel = trackEvents.filter(
    (e) => !e.parentEventId || !trackEvents.some((te) => te.id === e.parentEventId)
  );

  for (const event of sortEventsByDate(topLevel)) {
    visible.push(event);
    // If this is a duration event and it's expanded, add children
    if (event.hasDuration && expandedEventIds.includes(event.id)) {
      const children = sortEventsByDate(
        trackEvents.filter((e) => e.parentEventId === event.id)
      );
      for (const child of children) {
        visible.push(child);
        // Level 2: grandchildren
        if (child.hasDuration && expandedEventIds.includes(child.id)) {
          const grandchildren = sortEventsByDate(
            trackEvents.filter((e) => e.parentEventId === child.id)
          );
          visible.push(...grandchildren);
        }
      }
    }
  }

  return visible;
}

// ─── Track Helpers ────────────────────────────────────────────────

/** Get the next available order number for a new track. */
export function getNextTrackOrder(tracks: TimelineTrack[]): number {
  if (tracks.length === 0) return 0;
  return Math.max(...tracks.map((t) => t.order)) + 1;
}

/** Reorder tracks by moving a track from one index to another. */
export function reorderTracks(
  tracks: TimelineTrack[],
  fromIndex: number,
  toIndex: number
): TimelineTrack[] {
  const sorted = [...tracks].sort((a, b) => a.order - b.order);
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);
  return sorted.map((t, i) => ({ ...t, order: i }));
}

// ─── Multi-Agent Reference Helpers (Phase 2) ─────────────────────

/** Get events that reference a given track as a secondary track. */
export function getTrackReferences(
  events: TimelineEvent[],
  trackId: string
): TimelineEvent[] {
  return events.filter(
    (e) => e.secondaryTrackIds?.includes(trackId) && e.trackId !== trackId
  );
}

// ─── Custom Calendar Helpers (Phase 2) ────────────────────────────

/**
 * Convert a custom CalendarDate to an Earth decimal year for timeline positioning.
 * The largest calendar unit maps directly to Earth years via baseYearOffset.
 * Smaller units contribute fractional years based on their subunit ratios.
 *
 * Example: Calendar has units [Era(100 cycles), Cycle(365 days), Day(1)]
 *   CalendarDate { values: [3, 45, 100] } with baseYearOffset = 1000
 *   → earthYear = (3 * 100 + 45) + (100 / 365) + 1000
 */
export function calendarDateToEarthYear(
  date: CalendarDate,
  calendar: CustomCalendar
): number {
  if (!calendar.units.length || !date.values.length) return 0;

  // Work from smallest unit up to convert into the largest unit's scale
  // units[0] = largest, units[last] = smallest
  const units = calendar.units;
  let total = 0;
  let scale = 1; // scale in terms of the largest unit

  // Build scale factors from largest to smallest
  // units[0].subunitsPerUnit = how many of units[1] fit in units[0]
  // So units[1] represents 1/subunitsPerUnit[0] of units[0]
  for (let i = 0; i < units.length; i++) {
    if (i > 0) {
      scale /= units[i - 1].subunitsPerUnit || 1;
    }
    const val = date.values[i] ?? 0;
    total += val * scale;
  }

  return total + calendar.baseYearOffset;
}

/**
 * Convert an Earth decimal year back to a CalendarDate for display.
 */
export function earthYearToCalendarDate(
  earthYear: number,
  calendar: CustomCalendar
): CalendarDate {
  if (!calendar.units.length) return { values: [] };

  let remaining = earthYear - calendar.baseYearOffset;
  const values: number[] = [];

  for (let i = 0; i < calendar.units.length; i++) {
    if (i === calendar.units.length - 1) {
      // Smallest unit — take whatever is left
      values.push(Math.round(remaining));
    } else {
      const subunits = calendar.units[i].subunitsPerUnit || 1;
      const unitValue = Math.floor(remaining / 1);
      // For the largest unit, the value IS the remaining
      // For sub-units, we need to extract the fractional part
      if (i === 0) {
        values.push(Math.floor(remaining));
        remaining = (remaining - Math.floor(remaining)) * subunits;
      } else {
        values.push(Math.floor(remaining));
        remaining = (remaining - Math.floor(remaining)) * subunits;
      }
    }
  }

  return { values };
}

/**
 * Format a CalendarDate for display using the calendar's unit names.
 * e.g., "Era 3, Cycle 45, Day 100"
 */
export function formatCalendarDate(
  date: CalendarDate,
  calendar: CustomCalendar
): string {
  return calendar.units
    .map((unit, i) => {
      const val = date.values[i];
      if (val == null) return null;
      return `${unit.name} ${val}`;
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * Format a calendar-aware date range for an event.
 * Uses the event's calendar for display if available, falls back to Earth dates.
 */
export function formatEventDateRange(
  event: TimelineEvent,
  calendars: CustomCalendar[]
): string {
  const calId = event.calendarId;
  if (!calId || calId === EARTH_CALENDAR_ID || !event.startDate) {
    return formatDateRange(event);
  }

  const calendar = calendars.find((c) => c.id === calId);
  if (!calendar || !event.startDate) {
    return formatDateRange(event);
  }

  const start = formatCalendarDate(event.startDate, calendar);
  const suffix = calendar.epochLabel ? ` ${calendar.epochLabel}` : "";

  if (!event.hasDuration || !event.endDate) {
    return `${start}${suffix}`;
  }

  const end = formatCalendarDate(event.endDate, calendar);
  return `${start}${suffix} — ${end}${suffix}`;
}

/**
 * Validate that a CalendarDate's values are within bounds for the given calendar.
 */
export function validateCalendarDate(
  date: CalendarDate,
  calendar: CustomCalendar
): boolean {
  for (let i = 0; i < calendar.units.length; i++) {
    const val = date.values[i];
    if (val == null) return i > 0; // first unit is required
    // Sub-units must be >= 0 and < parent's subunitsPerUnit
    if (i > 0) {
      const parentSubunits = calendar.units[i - 1].subunitsPerUnit;
      if (val < 0 || val >= parentSubunits) return false;
    }
  }
  return true;
}

// ─── YearMapper / Time Compression (Phase 2) ─────────────────────

import type { TimeCompression } from "./types";

export interface YearMapper {
  yearToX(year: number): number;
  xToYear(x: number): number;
}

/**
 * Create a piecewise year-to-pixel mapper that accounts for compressed regions.
 * Each non-expanded compression saves pixels by replacing a large year span
 * with a small fixed displayWidth. Years outside compressions use normal scale.
 */
export function createYearMapper(
  centerYear: number,
  pixelsPerYear: number,
  viewportWidth: number,
  compressions: TimeCompression[]
): YearMapper {
  // Filter to only active (non-expanded) compressions, sorted by startYear
  const active = compressions
    .filter((c) => !c.isExpanded)
    .sort((a, b) => a.startYear - b.startYear);

  if (active.length === 0) {
    // No compressions — use standard conversion
    return {
      yearToX: (year: number) => yearToX(year, centerYear, pixelsPerYear, viewportWidth),
      xToYear: (x: number) => xToYear(x, centerYear, pixelsPerYear, viewportWidth),
    };
  }

  // Precompute cumulative pixel savings at each compression boundary
  // For a compression spanning [startYear, endYear]:
  //   normalWidth = (endYear - startYear) * pixelsPerYear
  //   compressedWidth = displayWidth
  //   saved = normalWidth - displayWidth
  const segments = active.map((c) => {
    const normalWidth = (c.endYear - c.startYear) * pixelsPerYear;
    const saved = Math.max(normalWidth - c.displayWidth, 0);
    return { ...c, normalWidth, saved };
  });

  return {
    yearToX(year: number): number {
      // Start from the standard position, then adjust for compressions
      let adjustment = 0;

      for (const seg of segments) {
        if (year <= seg.startYear) {
          // Before this compression — no more adjustments
          break;
        } else if (year >= seg.endYear) {
          // Past this compression — subtract full saved pixels
          adjustment -= seg.saved;
        } else {
          // Inside this compression — interpolate within displayWidth
          const fraction = (year - seg.startYear) / (seg.endYear - seg.startYear);
          const normalOffset = (year - seg.startYear) * pixelsPerYear;
          const compressedOffset = fraction * seg.displayWidth;
          adjustment -= normalOffset - compressedOffset;
          break;
        }
      }

      return yearToX(year, centerYear, pixelsPerYear, viewportWidth) + adjustment;
    },

    xToYear(x: number): number {
      // Inverse mapping — binary search approach for accuracy
      // Start with the standard conversion as an estimate
      const estimate = xToYear(x, centerYear, pixelsPerYear, viewportWidth);

      // Refine: test the forward mapping and adjust
      // Simple Newton-style iteration (3 iterations is usually enough)
      let year = estimate;
      for (let i = 0; i < 5; i++) {
        const mappedX = this.yearToX(year);
        const error = x - mappedX;
        if (Math.abs(error) < 0.5) break;
        year += error / pixelsPerYear;
      }

      return year;
    },
  };
}

/**
 * Generate tick marks that skip compressed regions.
 * Ticks inside a non-expanded compression are replaced by a single label.
 */
export function generateTicksWithCompressions(
  range: VisibleRange,
  pixelsPerYear: number,
  compressions: TimeCompression[]
): Tick[] {
  const baseTicks = generateTicks(range, pixelsPerYear);
  const active = compressions.filter((c) => !c.isExpanded);

  if (active.length === 0) return baseTicks;

  return baseTicks.filter((tick) => {
    // Remove ticks that fall inside any active compression
    return !active.some((c) => tick.year > c.startYear && tick.year < c.endYear);
  });
}

// ─── Track Folding (Phase 3) ──────────────────────────────────────

/** Returns only tracks that are visible (not folded into another track). */
export function getVisibleTracks(tracks: TimelineTrack[]): TimelineTrack[] {
  return tracks.filter((t) => !t.foldedIntoTrackId);
}

/** Returns tracks that are folded into a specific host track. */
export function getFoldedTracks(tracks: TimelineTrack[], hostTrackId: string): TimelineTrack[] {
  return tracks.filter((t) => t.foldedIntoTrackId === hostTrackId);
}

/** Returns events from all tracks folded into the given host track. */
export function getFoldedTrackEvents(
  events: TimelineEvent[],
  allTracks: TimelineTrack[],
  hostTrackId: string
): TimelineEvent[] {
  const foldedTrackIds = new Set(
    allTracks
      .filter((t) => t.foldedIntoTrackId === hostTrackId)
      .map((t) => t.id)
  );
  if (foldedTrackIds.size === 0) return [];
  return events.filter((e) => foldedTrackIds.has(e.trackId));
}

// ─── Filtering (Phase 3) ──────────────────────────────────────────

/** Returns true if any filter criterion is active. */
export function isFilterActive(filter: TimelineFilter): boolean {
  return (
    filter.searchQuery.length > 0 ||
    filter.trackIds.length > 0 ||
    filter.eventTypes.length > 0 ||
    filter.importanceLevels.length > 0 ||
    filter.dateRange !== null ||
    filter.tags.length > 0
  );
}

/** Check whether a single event matches all active filter criteria. */
export function eventMatchesFilter(
  event: TimelineEvent,
  filter: TimelineFilter,
): boolean {
  // Search query — match name or description (case-insensitive)
  if (filter.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    const nameMatch = event.name.toLowerCase().includes(q);
    const descMatch = event.shortDescription?.toLowerCase().includes(q);
    const extMatch = event.extendedDescription?.toLowerCase().includes(q);
    if (!nameMatch && !descMatch && !extMatch) return false;
  }

  // Track filter
  if (filter.trackIds.length > 0 && !filter.trackIds.includes(event.trackId)) {
    return false;
  }

  // Event type filter
  if (filter.eventTypes.length > 0 && !filter.eventTypes.includes(event.eventType)) {
    return false;
  }

  // Importance filter
  if (filter.importanceLevels.length > 0 && !filter.importanceLevels.includes(event.importance)) {
    return false;
  }

  // Date range filter
  if (filter.dateRange) {
    const { start, end } = filter.dateRange;
    if (start != null && event.startYear < start) return false;
    if (end != null) {
      const eventEnd = event.hasDuration && event.endYear != null ? event.endYear : event.startYear;
      if (eventEnd > end) return false;
    }
  }

  // Tags filter
  if (filter.tags.length > 0) {
    const eventTags = event.tags || [];
    if (!filter.tags.some((t) => eventTags.includes(t))) return false;
  }

  return true;
}

/** Returns the set of event IDs matching the current filter. */
export function getFilteredEventIds(
  events: TimelineEvent[],
  filter: TimelineFilter,
): Set<string> {
  const ids = new Set<string>();
  for (const event of events) {
    if (eventMatchesFilter(event, filter)) {
      ids.add(event.id);
    }
  }
  return ids;
}

// ─── Causality Links (Phase 3) ────────────────────────────────────

/** Get all links where the given event is source or target. */
export function getEventLinks(
  eventId: string,
  links: EventLink[]
): { outgoing: EventLink[]; incoming: EventLink[] } {
  const outgoing: EventLink[] = [];
  const incoming: EventLink[] = [];
  for (const link of links) {
    if (link.sourceEventId === eventId) outgoing.push(link);
    if (link.targetEventId === eventId) incoming.push(link);
  }
  return { outgoing, incoming };
}

// ─── Element Links (Phase 3) ──────────────────────────────────────

/** Get all element links for a given event. */
export function getEventElementLinks(
  eventId: string,
  elementLinks: ElementLink[]
): ElementLink[] {
  return elementLinks.filter((l) => l.eventId === eventId);
}

// ─── Auto-Compression Gap Detection (Phase 4) ────────────────────

import type { CompressionSuggestion } from "./types";

interface DetectGapOptions {
  minGapPercentage?: number; // minimum gap as % of total span (default: 15)
  maxSuggestions?: number;   // maximum suggestions to return (default: 5)
}

/**
 * Detect large time gaps between events that could benefit from compression.
 * Excludes ranges already covered by existing compressions.
 */
export function detectCompressionGaps(
  events: TimelineEvent[],
  compressions: TimeCompression[],
  options: DetectGapOptions = {}
): CompressionSuggestion[] {
  const { minGapPercentage = 15, maxSuggestions = 5 } = options;

  // Only consider top-level events (no parents or parents outside track)
  const topLevel = events.filter((e) => !e.parentEventId);
  if (topLevel.length < 2) return [];

  // Sort chronologically
  const sorted = [...topLevel].sort((a, b) => a.startYear - b.startYear);

  // Total timeline span
  let minYear = Infinity;
  let maxYear = -Infinity;
  for (const e of sorted) {
    if (e.startYear < minYear) minYear = e.startYear;
    const end = e.endYear ?? e.startYear;
    if (end > maxYear) maxYear = end;
  }
  const totalSpan = maxYear - minYear;
  if (totalSpan <= 0) return [];

  // Active (non-expanded) compressions
  const activeCompressions = compressions.filter((c) => !c.isExpanded);

  const suggestions: CompressionSuggestion[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = sorted[i].endYear ?? sorted[i].startYear;
    const nextStart = sorted[i + 1].startYear;
    const gapYears = nextStart - currentEnd;

    if (gapYears <= 0) continue;

    const gapPercentage = (gapYears / totalSpan) * 100;
    if (gapPercentage < minGapPercentage) continue;

    // Check if already covered by a compression
    const alreadyCovered = activeCompressions.some(
      (c) => c.startYear <= currentEnd && c.endYear >= nextStart
    );
    if (alreadyCovered) continue;

    suggestions.push({
      id: `gap-${i}`,
      startYear: currentEnd,
      endYear: nextStart,
      gapYears,
      gapPercentage,
      suggestedLabel: formatGapLabel(gapYears),
      confidence: gapPercentage > 30 ? "high" : gapPercentage > 20 ? "medium" : "low",
    });
  }

  return suggestions
    .sort((a, b) => b.gapPercentage - a.gapPercentage)
    .slice(0, maxSuggestions);
}

function formatGapLabel(years: number): string {
  const abs = Math.abs(years);
  if (abs >= 1_000_000) return `~${(abs / 1_000_000).toFixed(1)}M years`;
  if (abs >= 1_000) return `~${(abs / 1_000).toFixed(1)}K years`;
  if (abs >= 100) return `~${Math.round(abs)} years`;
  if (abs >= 1) return `~${Math.round(abs)} year${abs >= 2 ? "s" : ""}`;
  return `~${Math.round(abs * 12)} months`;
}

// ─── Index Export ─────────────────────────────────────────────────

export { MONTH_NAMES, MONTH_NAMES_FULL } from "./constants";
