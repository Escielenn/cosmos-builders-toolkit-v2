// Timeline Tool — Constants & Configuration

import type { EventType, TrackType, ImportanceLevel, LinkType, TimelineState } from "./types";

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
  { id: "birth", label: "Birth", icon: "Sprout", defaultColor: "#22c55e", category: "character" },
  { id: "death", label: "Death", icon: "Skull", defaultColor: "#6b7280", category: "character" },
  { id: "coming_of_age", label: "Coming of Age", icon: "Sunrise", defaultColor: "#f59e0b", category: "character" },
  { id: "transformation", label: "Transformation", icon: "Sparkles", defaultColor: "#a855f7", category: "character" },
  // Civilization events
  { id: "founding", label: "Founding", icon: "Landmark", defaultColor: "#3b82f6", category: "civilization" },
  { id: "collapse", label: "Collapse", icon: "TrendingDown", defaultColor: "#ef4444", category: "civilization" },
  { id: "schism", label: "Schism", icon: "Split", defaultColor: "#f97316", category: "civilization" },
  { id: "unification", label: "Unification", icon: "Handshake", defaultColor: "#06b6d4", category: "civilization" },
  // Conflict events
  { id: "war", label: "War", icon: "Swords", defaultColor: "#dc2626", category: "conflict" },
  { id: "battle", label: "Battle", icon: "Target", defaultColor: "#ef4444", category: "conflict" },
  { id: "treaty", label: "Treaty", icon: "ScrollText", defaultColor: "#eab308", category: "conflict" },
  { id: "rebellion", label: "Rebellion", icon: "Flame", defaultColor: "#f97316", category: "conflict" },
  // Discovery events
  { id: "discovery", label: "Discovery", icon: "Lightbulb", defaultColor: "#06b6d4", category: "discovery" },
  { id: "invention", label: "Invention", icon: "Cog", defaultColor: "#8b5cf6", category: "discovery" },
  { id: "first_contact", label: "First Contact", icon: "Eye", defaultColor: "#d946ef", category: "discovery" },
  // Settlement events
  { id: "settlement", label: "Settlement", icon: "Home", defaultColor: "#f59e0b", category: "settlement" },
  { id: "terraforming_start", label: "Terraforming Start", icon: "TreePine", defaultColor: "#84cc16", category: "settlement" },
  { id: "terraforming_complete", label: "Terraforming Complete", icon: "Trees", defaultColor: "#22c55e", category: "settlement" },
  { id: "abandonment", label: "Abandonment", icon: "CircleOff", defaultColor: "#9ca3af", category: "settlement" },
  // Journey events
  { id: "departure", label: "Departure", icon: "Rocket", defaultColor: "#3b82f6", category: "journey" },
  { id: "arrival", label: "Arrival", icon: "MapPin", defaultColor: "#22c55e", category: "journey" },
  { id: "voyage", label: "Voyage", icon: "Ship", defaultColor: "#0ea5e9", category: "journey" },
  // Other
  { id: "catastrophe", label: "Catastrophe", icon: "Zap", defaultColor: "#ef4444", category: "custom" },
  { id: "custom", label: "Custom", icon: "Circle", defaultColor: "#6366f1", category: "custom" },
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
  { id: "character", label: "Character", icon: "User", defaultColor: "#8b5cf6" },
  { id: "civilization", label: "Civilization", icon: "Globe", defaultColor: "#3b82f6" },
  { id: "organization", label: "Organization", icon: "Building2", defaultColor: "#f59e0b" },
  { id: "planet", label: "Planet", icon: "Globe2", defaultColor: "#22c55e" },
  { id: "ship", label: "Ship", icon: "Rocket", defaultColor: "#ef4444" },
  { id: "system", label: "Star System", icon: "Sun", defaultColor: "#eab308" },
  { id: "artifact", label: "Artifact", icon: "Gem", defaultColor: "#d946ef" },
  { id: "technology", label: "Technology", icon: "Cpu", defaultColor: "#06b6d4" },
  { id: "biology", label: "Biology", icon: "Dna", defaultColor: "#84cc16" },
  { id: "culture", label: "Culture", icon: "Palette", defaultColor: "#ec4899" },
  { id: "conflict", label: "Conflict", icon: "Swords", defaultColor: "#dc2626" },
  { id: "religion", label: "Religion", icon: "BookOpen", defaultColor: "#a855f7" },
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

export const TRACK_COLOR_PALETTE = [
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#22c55e", // green
  "#eab308", // yellow
  "#f59e0b", // amber
  "#ef4444", // red
  "#d946ef", // fuchsia
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#6366f1", // indigo
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
  caused:     { label: "Caused",     color: "#ef4444" },
  enabled:    { label: "Enabled",    color: "#3b82f6" },
  prevented:  { label: "Prevented",  color: "#6b7280", dashArray: "4 3" },
  influenced: { label: "Influenced", color: "#a855f7", dashArray: "8 4" },
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
