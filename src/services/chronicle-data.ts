/**
 * Chronicle Data Service
 *
 * Fetches, creates, updates, and deletes chronicle events.
 * The Chronicle is a vertical-scroll timeline visualization per world.
 */

import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface CalendarConfig {
  era_label: string;
  epoch_label: string;
  date_format: "numeric" | "descriptive";
}

export interface ChronicleEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  sortValue: number;
  endDate: string | null;
  endSortValue: number | null;
  eventType: string;
  layer: string | null;
  parentId: string | null;
  linkedEntryId: string | null;
  linkedEntryTitle: string | null;
  icon: string | null;
  color: string | null;
  tags: string[];
  children: ChronicleEvent[];
}

export interface ChronicleData {
  worldId: string;
  worldName: string;
  calendarConfig: CalendarConfig;
  events: ChronicleEvent[];
  eras: ChronicleEvent[];
}

export interface GapInfo {
  afterEventId: string;
  beforeEventId: string;
  label: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const EVENT_TYPES = [
  "event",
  "era",
  "war",
  "discovery",
  "founding",
  "death",
  "custom",
] as const;

export const CHRONICLE_LAYERS = [
  "environment",
  "biology",
  "culture",
  "mythology",
  "technology",
  "narrative",
] as const;

export const LAYER_COLORS: Record<string, string> = {
  environment: "rgba(61, 255, 205, 0.4)",
  biology: "rgba(74, 222, 128, 0.4)",
  culture: "rgba(255, 179, 71, 0.4)",
  mythology: "rgba(91, 141, 239, 0.4)",
  technology: "rgba(224, 228, 232, 0.4)",
  narrative: "rgba(91, 141, 239, 0.3)",
};

const DEFAULT_CALENDAR: CalendarConfig = {
  era_label: "",
  epoch_label: "Year",
  date_format: "numeric",
};

// ──────────────────────────────────────────────
// Fetch
// ──────────────────────────────────────────────

export async function getChronicleData(
  worldId: string
): Promise<ChronicleData> {
  const [worldResult, eventsResult] = await Promise.all([
    supabase
      .from("worlds")
      .select("name, calendar_config")
      .eq("id", worldId)
      .single(),
    supabase
      .from("chronicle_events")
      .select("*, linked_entry:world_entries(id, title)")
      .eq("world_id", worldId)
      .order("sort_value", { ascending: true }),
  ]);

  const world = worldResult.data;
  const events = eventsResult.data || [];

  const eras = events
    .filter((e) => e.event_type === "era")
    .map(mapEvent);
  const regularEvents = events.filter((e) => e.event_type !== "era");
  const eventTree = buildEventTree(regularEvents);

  return {
    worldId,
    worldName: world?.name || "",
    calendarConfig: parseCalendarConfig(world?.calendar_config),
    events: eventTree,
    eras,
  };
}

function parseCalendarConfig(raw: unknown): CalendarConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_CALENDAR;
  const obj = raw as Record<string, unknown>;
  return {
    era_label: typeof obj.era_label === "string" ? obj.era_label : "",
    epoch_label:
      typeof obj.epoch_label === "string" ? obj.epoch_label : "Year",
    date_format:
      obj.date_format === "descriptive" ? "descriptive" : "numeric",
  };
}

function buildEventTree(
  events: Array<Record<string, unknown>>
): ChronicleEvent[] {
  const map = new Map<string, ChronicleEvent>();
  const roots: ChronicleEvent[] = [];

  for (const e of events) {
    map.set(e.id as string, mapEvent(e));
  }

  for (const e of events) {
    const node = map.get(e.id as string)!;
    if (e.parent_id && map.has(e.parent_id as string)) {
      map.get(e.parent_id as string)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function mapEvent(e: Record<string, unknown>): ChronicleEvent {
  const linked = e.linked_entry as Record<string, unknown> | null;
  return {
    id: e.id as string,
    title: e.title as string,
    description: (e.description as string) || null,
    eventDate: e.event_date as string,
    sortValue: Number(e.sort_value),
    endDate: (e.end_date as string) || null,
    endSortValue: e.end_sort_value != null ? Number(e.end_sort_value) : null,
    eventType: e.event_type as string,
    layer: (e.layer as string) || null,
    parentId: (e.parent_id as string) || null,
    linkedEntryId: linked?.id as string || (e.linked_entry_id as string) || null,
    linkedEntryTitle: (linked?.title as string) || null,
    icon: (e.icon as string) || null,
    color: (e.color as string) || null,
    tags: (e.tags as string[]) || [],
    children: [],
  };
}

// ──────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────

export interface CreateEventInput {
  title: string;
  description?: string;
  eventDate: string;
  sortValue: number;
  endDate?: string;
  endSortValue?: number;
  eventType?: string;
  layer?: string;
  parentId?: string;
  linkedEntryId?: string;
  icon?: string;
  color?: string;
  tags?: string[];
}

export async function createChronicleEvent(
  worldId: string,
  input: CreateEventInput
) {
  return supabase
    .from("chronicle_events")
    .insert({
      world_id: worldId,
      title: input.title,
      description: input.description || null,
      event_date: input.eventDate,
      sort_value: input.sortValue,
      end_date: input.endDate || null,
      end_sort_value: input.endSortValue ?? null,
      event_type: input.eventType || "event",
      layer: input.layer || null,
      parent_id: input.parentId || null,
      linked_entry_id: input.linkedEntryId || null,
      icon: input.icon || null,
      color: input.color || null,
      tags: input.tags || [],
    })
    .select()
    .single();
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  eventDate?: string;
  sortValue?: number;
  endDate?: string | null;
  endSortValue?: number | null;
  eventType?: string;
  layer?: string | null;
  parentId?: string | null;
  linkedEntryId?: string | null;
  icon?: string | null;
  color?: string | null;
  tags?: string[];
}

export async function updateChronicleEvent(
  eventId: string,
  updates: UpdateEventInput
) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.eventDate !== undefined)
    dbUpdates.event_date = updates.eventDate;
  if (updates.sortValue !== undefined)
    dbUpdates.sort_value = updates.sortValue;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.endSortValue !== undefined)
    dbUpdates.end_sort_value = updates.endSortValue;
  if (updates.eventType !== undefined)
    dbUpdates.event_type = updates.eventType;
  if (updates.layer !== undefined) dbUpdates.layer = updates.layer;
  if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
  if (updates.linkedEntryId !== undefined)
    dbUpdates.linked_entry_id = updates.linkedEntryId;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

  return supabase
    .from("chronicle_events")
    .update(dbUpdates)
    .eq("id", eventId);
}

export async function deleteChronicleEvent(eventId: string) {
  return supabase.from("chronicle_events").delete().eq("id", eventId);
}

export async function updateCalendarConfig(
  worldId: string,
  config: CalendarConfig
) {
  return supabase
    .from("worlds")
    .update({ calendar_config: config as unknown as Record<string, unknown> })
    .eq("id", worldId);
}

// ──────────────────────────────────────────────
// Sort Value Estimation
// ──────────────────────────────────────────────

/**
 * Parse a display date into an approximate sort value.
 * Best-effort heuristic — user can manually adjust.
 */
export function estimateSortValue(displayDate: string): number {
  const match = displayDate.match(/-?[\d.]+/);
  if (match) {
    const num = parseFloat(match[0]);
    return Math.round(num * 1000);
  }
  return 0;
}

// ──────────────────────────────────────────────
// Gap Computation
// ──────────────────────────────────────────────

export function computeGaps(events: ChronicleEvent[]): GapInfo[] {
  if (events.length < 2) return [];

  const gaps: { after: number; before: number; size: number }[] = [];
  for (let i = 0; i < events.length - 1; i++) {
    gaps.push({
      after: i,
      before: i + 1,
      size: events[i + 1].sortValue - events[i].sortValue,
    });
  }

  const sorted = gaps.map((g) => g.size).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median <= 0) return [];

  const threshold = median * 10;

  return gaps
    .filter((g) => g.size > threshold)
    .map((g) => ({
      afterEventId: events[g.after].id,
      beforeEventId: events[g.before].id,
      label: formatGapDuration(g.size),
    }));
}

function formatGapDuration(sortValueDiff: number): string {
  const years = sortValueDiff / 1000;
  if (years > 1_000_000_000) return `~${(years / 1_000_000_000).toFixed(1)}B YEARS`;
  if (years > 1_000_000) return `~${(years / 1_000_000).toFixed(1)}M YEARS`;
  if (years > 1000) return `~${Math.round(years / 1000)}K YEARS`;
  if (years > 1) return `~${Math.round(years)} YEARS`;
  return `~${Math.round(years * 365)} DAYS`;
}
