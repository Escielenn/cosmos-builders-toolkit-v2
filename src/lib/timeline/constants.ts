// Timeline Tool, Constants & Configuration

import type { EventType, TrackType, ImportanceLevel, LinkType, TimelineState } from "./types";
import { SWATCH } from "@/lib/palettes/swatches";

// ─── Event Type Configuration ──────────────────────────────────────

export interface EventTypeConfig {
  id: EventType;
  label: string;
  icon: string; // Lucide icon name
  defaultColor: string;
  category: "character" | "civilization" | "conflict" | "discovery" | "settlement" | "journey" | "custom";
}

export const EVENT_TYPES: EventTypeConfig[] = [
  // Character events
  { id: "birth", label: "Birth", icon: "Sprout", defaultColor: SWATCH.green, category: "character" },
  { id: "death", label: "Death", icon: "Skull", defaultColor: SWATCH.grey, category: "character" },
  { id: "coming_of_age", label: "Coming of Age", icon: "Sunrise", defaultColor: SWATCH.amber, category: "character" },
  { id: "transformation", label: "Transformation", icon: "Sparkles", defaultColor: SWATCH.purple, category: "character" },
  // Civilization events
  { id: "founding", label: "Founding", icon: "Landmark", defaultColor: SWATCH.blue, category: "civilization" },
  { id: "collapse", label: "Collapse", icon: "TrendingDown", defaultColor: SWATCH.red, category: "civilization" },
  { id: "schism", label: "Schism", icon: "Split", defaultColor: SWATCH.orange, category: "civilization" },
  { id: "unification", label: "Unification", icon: "Handshake", defaultColor: SWATCH.aqua, category: "civilization" },
  // Conflict events
  { id: "war", label: "War", icon: "Swords", defaultColor: SWATCH.redDeep, category: "conflict" },
  { id: "battle", label: "Battle", icon: "Target", defaultColor: SWATCH.red, category: "conflict" },
  { id: "treaty", label: "Treaty", icon: "ScrollText", defaultColor: SWATCH.yellow, category: "conflict" },
  { id: "rebellion", label: "Rebellion", icon: "Flame", defaultColor: SWATCH.orange, category: "conflict" },
  // Discovery events
  { id: "discovery", label: "Discovery", icon: "Lightbulb", defaultColor: SWATCH.aqua, category: "discovery" },
  { id: "invention", label: "Invention", icon: "Cog", defaultColor: SWATCH.violet, category: "discovery" },
  { id: "first_contact", label: "First Contact", icon: "Eye", defaultColor: SWATCH.fuchsia, category: "discovery" },
  // Settlement events
  { id: "settlement", label: "Settlement", icon: "Home", defaultColor: SWATCH.amber, category: "settlement" },
  { id: "terraforming_start", label: "Terraforming Start", icon: "TreePine", defaultColor: SWATCH.lime, category: "settlement" },
  { id: "terraforming_complete", label: "Terraforming Complete", icon: "Trees", defaultColor: SWATCH.green, category: "settlement" },
  { id: "abandonment", label: "Abandonment", icon: "CircleOff", defaultColor: SWATCH.greyLight, category: "settlement" },
  // Journey events
  { id: "departure", label: "Departure", icon: "Rocket", defaultColor: SWATCH.blue, category: "journey" },
  { id: "arrival", label: "Arrival", icon: "MapPin", defaultColor: SWATCH.green, category: "journey" },
  { id: "voyage", label: "Voyage", icon: "Ship", defaultColor: SWATCH.sky, category: "journey" },
  // Other
  { id: "catastrophe", label: "Catastrophe", icon: "Zap", defaultColor: SWATCH.red, category: "custom" },
  { id: "custom", label: "Custom", icon: "Circle", defaultColor: SWATCH.stellar, category: "custom" },
];

export const EVENT_TYPE_MAP: Record<EventType, EventTypeConfig> = Object.fromEntries(
  EVENT_TYPES.map((et) => [et.id, et])
) as Record<EventType, EventTypeConfig>;

// ─── Track Type Configuration ──────────────────────────────────────

export interface TrackTypeConfig {
  id: TrackType;
  label: string;
  icon: string;
  defaultColor: string;
}

export const TRACK_TYPES: TrackTypeConfig[] = [
  { id: "character", label: "Character", icon: "User", defaultColor: SWATCH.violet },
  { id: "civilization", label: "Civilization", icon: "Globe", defaultColor: SWATCH.blue },
  { id: "organization", label: "Organization", icon: "Building2", defaultColor: SWATCH.amber },
  { id: "planet", label: "Planet", icon: "Globe2", defaultColor: SWATCH.green },
  { id: "ship", label: "Ship", icon: "Rocket", defaultColor: SWATCH.red },
  { id: "system", label: "Star System", icon: "Sun", defaultColor: SWATCH.yellow },
  { id: "artifact", label: "Artifact", icon: "Gem", defaultColor: SWATCH.fuchsia },
  { id: "technology", label: "Technology", icon: "Cpu", defaultColor: SWATCH.aqua },
  { id: "biology", label: "Biology", icon: "Dna", defaultColor: SWATCH.lime },
  { id: "culture", label: "Culture", icon: "Palette", defaultColor: SWATCH.pink },
  { id: "conflict", label: "Conflict", icon: "Swords", defaultColor: SWATCH.redDeep },
  { id: "religion", label: "Religion", icon: "BookOpen", defaultColor: SWATCH.purple },
];

export const TRACK_TYPE_MAP: Record<TrackType, TrackTypeConfig> = Object.fromEntries(
  TRACK_TYPES.map((tt) => [tt.id, tt])
) as Record<TrackType, TrackTypeConfig>;

// ─── Importance Configuration ──────────────────────────────────────

export interface ImportanceConfig {
  id: ImportanceLevel;
  label: string;
  dotSize: number; // px
  barHeight: number; // px
  opacity: number;
}

export const IMPORTANCE_LEVELS: ImportanceConfig[] = [
  { id: "minor", label: "Minor", dotSize: 6, barHeight: 16, opacity: 0.5 },
  { id: "moderate", label: "Moderate", dotSize: 8, barHeight: 20, opacity: 0.7 },
  { id: "major", label: "Major", dotSize: 10, barHeight: 24, opacity: 0.9 },
  { id: "epochal", label: "Epochal", dotSize: 14, barHeight: 28, opacity: 1.0 },
];

export const IMPORTANCE_MAP: Record<ImportanceLevel, ImportanceConfig> = Object.fromEntries(
  IMPORTANCE_LEVELS.map((il) => [il.id, il])
) as Record<ImportanceLevel, ImportanceConfig>;

// ─── Nesting Configuration (Phase 2) ──────────────────────────────

export const NESTING_CONFIG = {
  0: { barHeight: 28, indent: 0, dotScale: 1.0, fontSize: 10 },
  1: { barHeight: 22, indent: 16, dotScale: 0.8, fontSize: 9 },
  2: { barHeight: 16, indent: 32, dotScale: 0.6, fontSize: 8 },
} as const;

export const MAX_NESTING_DEPTH = 2;
export const NESTED_ROW_HEIGHT = 32; // height per nested child row

// ─── Layout Constants ──────────────────────────────────────────────

export const TRACK_HEADER_WIDTH = 200;
/** Track header width on narrow viewports (phones): leaves the lanes room to read. */
export const TRACK_HEADER_WIDTH_COMPACT = 112;
/** Timeline viewport widths below this use the compact track header. */
export const COMPACT_TIMELINE_WIDTH = 560;
export const TRACK_HEIGHT = 72;
export const COLLAPSED_TRACK_HEIGHT = 32;
export const TIME_AXIS_HEIGHT = 40;
export const TOOLBAR_HEIGHT = 48;

// ─── Zoom Constants ────────────────────────────────────────────────

export const MIN_PIXELS_PER_YEAR = 0.005; // ~200,000 year span in 1000px
export const MAX_PIXELS_PER_YEAR = 365; // ~1px per day
export const DEFAULT_PIXELS_PER_YEAR = 0.5;
export const DEFAULT_CENTER_YEAR = 2200;
export const ZOOM_SPEED = 0.002;

// ─── Color Palette ─────────────────────────────────────────────────

export const TRACK_COLOR_PALETTE: string[] = [
  SWATCH.violet,
  SWATCH.blue,
  SWATCH.aqua,
  SWATCH.green,
  SWATCH.yellow,
  SWATCH.amber,
  SWATCH.red,
  SWATCH.fuchsia,
  SWATCH.orange,
  SWATCH.teal,
  SWATCH.pink,
  SWATCH.stellar,
];

// ─── Month Names ───────────────────────────────────────────────────

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Causality Link Configuration (Phase 3) ──────────────────────

export interface LinkTypeConfig {
  label: string;
  color: string;
  dashArray?: string;
}

export const LINK_TYPE_CONFIG: Record<LinkType, LinkTypeConfig> = {
  caused:     { label: "Caused",     color: SWATCH.red },
  enabled:    { label: "Enabled",    color: SWATCH.blue },
  prevented:  { label: "Prevented",  color: SWATCH.grey, dashArray: "4 3" },
  influenced: { label: "Influenced", color: SWATCH.purple, dashArray: "8 4" },
};

export const LINK_TYPES: { id: LinkType; label: string }[] = [
  { id: "caused", label: "Caused" },
  { id: "enabled", label: "Enabled" },
  { id: "prevented", label: "Prevented" },
  { id: "influenced", label: "Influenced" },
];

// ─── Initial State ─────────────────────────────────────────────────

export const initialTimelineState: TimelineState = {
  tracks: [],
  events: [],
  viewState: {
    pixelsPerYear: DEFAULT_PIXELS_PER_YEAR,
    centerYear: DEFAULT_CENTER_YEAR,
  },
  generalNotes: "",
  moodboard: [],
  calendars: [],
  compressions: [],
  expandedEventIds: [],
  eventLinks: [],
  causalityLinksVisible: true,
  elementLinks: [],
};
