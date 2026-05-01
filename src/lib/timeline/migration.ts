// Timeline, Data Migration (Phase 1 → Phase 2 → Phase 3)

import type { TimelineState } from "./types";
import { initialTimelineState } from "./constants";

/**
 * Normalize raw data from storage (Supabase JSONB or localStorage) into
 * the current TimelineState shape. Handles missing fields by defaulting them.
 */
export function migrateTimelineState(raw: unknown): TimelineState {
  if (!raw || typeof raw !== "object") return { ...initialTimelineState };

  const data = raw as Record<string, unknown>;

  return {
    tracks: Array.isArray(data.tracks) ? data.tracks : [],
    events: Array.isArray(data.events) ? data.events : [],
    viewState:
      data.viewState &&
      typeof data.viewState === "object" &&
      typeof (data.viewState as Record<string, unknown>).pixelsPerYear === "number"
        ? (data.viewState as TimelineState["viewState"])
        : { ...initialTimelineState.viewState },
    generalNotes: typeof data.generalNotes === "string" ? data.generalNotes : "",
    moodboard: Array.isArray(data.moodboard) ? data.moodboard : [],
    // Phase 2 fields, default to empty when absent
    calendars: Array.isArray(data.calendars) ? data.calendars : [],
    compressions: Array.isArray(data.compressions) ? data.compressions : [],
    expandedEventIds: Array.isArray(data.expandedEventIds) ? data.expandedEventIds : [],
    // Phase 3 fields
    eventLinks: Array.isArray(data.eventLinks) ? data.eventLinks : [],
    causalityLinksVisible: typeof data.causalityLinksVisible === "boolean" ? data.causalityLinksVisible : true,
    elementLinks: Array.isArray(data.elementLinks) ? data.elementLinks : [],
  };
}
