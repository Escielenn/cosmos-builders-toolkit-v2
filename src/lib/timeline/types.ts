// Timeline Tool — Type Definitions (Phase 1 + Phase 2)

export type TrackType =
  | "character"
  | "civilization"
  | "organization"
  | "planet"
  | "ship"
  | "system"
  | "artifact"
  | "technology"
  | "biology"
  | "culture"
  | "conflict"
  | "religion";

export type EventType =
  | "birth"
  | "death"
  | "coming_of_age"
  | "transformation"
  | "founding"
  | "collapse"
  | "schism"
  | "unification"
  | "war"
  | "battle"
  | "treaty"
  | "rebellion"
  | "discovery"
  | "invention"
  | "first_contact"
  | "settlement"
  | "terraforming_start"
  | "terraforming_complete"
  | "abandonment"
  | "departure"
  | "arrival"
  | "voyage"
  | "catastrophe"
  | "custom";

export type ImportanceLevel = "minor" | "moderate" | "major" | "epochal";

// ─── Custom Calendar Types (Phase 2) ────────────────────────────────

export interface CalendarUnit {
  name: string;           // "Cycle"
  plural: string;         // "Cycles"
  abbreviation: string;   // "C"
  subunitsPerUnit: number; // how many of the next-smaller unit fit in this one (smallest unit: 1)
}

export interface CustomCalendar {
  id: string;
  name: string;             // "Hegemony Standard Calendar"
  units: CalendarUnit[];    // ordered largest → smallest (e.g., Era > Cycle > Year > Day)
  epochLabel?: string;      // "AF" (After Founding)
  baseYearOffset: number;   // earthYear = calendarLargestUnit + baseYearOffset
}

export interface CalendarDate {
  values: number[];         // one value per unit, ordered largest → smallest
}

export const EARTH_CALENDAR_ID = "__earth__";

// ─── Time Compression Types (Phase 2) ───────────────────────────────

export type CompressionStyle = "break" | "fade" | "spiral";

export interface TimeCompression {
  id: string;
  startYear: number;      // Earth year where compression begins
  endYear: number;         // Earth year where compression ends
  style: CompressionStyle;
  displayWidth: number;    // pixels when compressed (default: 40)
  isExpanded: boolean;     // when true, renders at full scale
  label?: string;          // e.g., "10,000 years of peace"
}

// ─── Causality Link Types (Phase 3) ──────────────────────────────────

export type LinkType = "caused" | "enabled" | "prevented" | "influenced";

export interface EventLink {
  id: string;
  sourceEventId: string;
  targetEventId: string;
  linkType: LinkType;
  label?: string;
  strength: 1 | 2 | 3;
}

// ─── Element Link Types (Phase 3) ────────────────────────────────────

export interface ElementLink {
  id: string;
  eventId: string;           // timeline event
  worksheetId: string;       // linked worksheet from another tool
  worksheetTitle: string;    // cached for display
  toolType: string;          // e.g., "planetary-profile"
}

// ─── Core Types ─────────────────────────────────────────────────────

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  order: number;
  isCollapsed: boolean;
  foldedIntoTrackId?: string;  // Phase 3: when set, this track's events render in the host track
}

export interface TimelineEvent {
  id: string;
  trackId: string;
  name: string;
  shortDescription: string;
  extendedDescription?: string;
  eventType: EventType;
  startYear: number;
  startMonth?: number;
  startDay?: number;
  endYear?: number;
  endMonth?: number;
  endDay?: number;
  hasDuration: boolean;
  color?: string;
  importance: ImportanceLevel;
  parentEventId?: string;
  tags?: string[];
  // Phase 2 additions
  calendarId?: string;          // undefined or EARTH_CALENDAR_ID = Earth Standard
  startDate?: CalendarDate;     // structured date for custom calendars
  endDate?: CalendarDate;       // structured date for custom calendars
  secondaryTrackIds?: string[]; // tracks this event also affects (multi-agent references)
}

export interface ViewState {
  pixelsPerYear: number;
  centerYear: number;
}

export interface MoodboardImage {
  id: string;
  url: string;
  caption?: string;
}

// ─── Filter Types (Phase 3 — ephemeral, not persisted) ──────────────

export interface TimelineFilter {
  searchQuery: string;
  trackIds: string[];              // empty = all tracks
  eventTypes: EventType[];         // empty = all types
  importanceLevels: ImportanceLevel[];  // empty = all levels
  dateRange: { start?: number; end?: number } | null;
  tags: string[];                  // empty = all tags
}

// ─── Auto-Compression Suggestion Types (Phase 4) ────────────────────

export interface CompressionSuggestion {
  id: string;
  startYear: number;
  endYear: number;
  gapYears: number;
  gapPercentage: number;
  suggestedLabel: string;
  confidence: "high" | "medium" | "low";
}

export interface TimelineState {
  tracks: TimelineTrack[];
  events: TimelineEvent[];
  viewState: ViewState;
  generalNotes: string;
  moodboard: MoodboardImage[];
  // Phase 2 additions
  calendars: CustomCalendar[];
  compressions: TimeCompression[];
  expandedEventIds: string[];  // IDs of expanded parent events (default: all expanded)
  // Phase 3 additions
  eventLinks: EventLink[];
  causalityLinksVisible: boolean;
  elementLinks: ElementLink[];
}
