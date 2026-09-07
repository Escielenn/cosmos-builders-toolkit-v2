// ---------------------------------------------------------------------------
// The epoch axis of the Web view (Law V: time is an axis, not a page).
//
// Lifted intact from the deleted src/components/graph/graph-algorithms.ts,
// which was 1,157 lines of analysis reachable only from the retired
// /connections route. These four exports are the part the Web view uses.
//
// The scrubber is LOCAL to this view for now. When the global epoch control
// lands in the top bar (F6), this reads it instead and the local one goes.
// ---------------------------------------------------------------------------

import type { Entity, EntityConnection } from "@/services/entity-graph-types";

export interface TimelineEvent {
  entityId: string;
  entityName: string;
  timeLabel: string;
}

export interface TimelineBounds {
  /** All unique time labels from connections, sorted */
  timePoints: string[];
  /** Events (entities of type 'event') with their temporal markers */
  events: TimelineEvent[];
}

export function extractTimelineBounds(
  entities: Entity[],
  connections: EntityConnection[]
): TimelineBounds {
  const timeSet = new Set<string>();

  for (const c of connections) {
    if (c.time_start) timeSet.add(c.time_start);
    if (c.time_end) timeSet.add(c.time_end);
  }

  // Sort time points, attempt numeric sort, fall back to alphabetical
  const timePoints = Array.from(timeSet).sort((a, b) => {
    const numA = parseFloat(a.replace(/[^\d.-]/g, ""));
    const numB = parseFloat(b.replace(/[^\d.-]/g, ""));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Extract event entities
  const events: TimelineEvent[] = [];
  for (const e of entities) {
    if (e.entity_type === "event") {
      const meta = e.metadata as Record<string, unknown>;
      const dateStart = (meta?.date_start as string) ?? "";
      if (dateStart) {
        events.push({
          entityId: e.id,
          entityName: e.name,
          timeLabel: dateStart,
        });
      }
    }
  }

  return { timePoints, events };
}

/**
 * Which connections are visible at a given time point.
 * A connection with no time bounds is always visible — an edge the writer
 * never dated must not vanish because they touched the scrubber.
 */
export function filterConnectionsByTime(
  connections: EntityConnection[],
  timePoints: string[],
  currentIndex: number
): { visible: Set<string>; historical: Set<string> } {
  const currentTime = timePoints[currentIndex];
  if (!currentTime) {
    return {
      visible: new Set(connections.map((c) => c.id)),
      historical: new Set(),
    };
  }

  const visible = new Set<string>();
  const historical = new Set<string>();

  for (const c of connections) {
    if (!c.time_start && !c.time_end) {
      visible.add(c.id);
      continue;
    }

    const startIdx = c.time_start ? timePoints.indexOf(c.time_start) : -1;
    const endIdx = c.time_end ? timePoints.indexOf(c.time_end) : timePoints.length;

    if (startIdx > currentIndex) {
      // Hasn't started yet — in neither set.
      continue;
    }

    if (endIdx !== -1 && endIdx < currentIndex) {
      historical.add(c.id);
    } else {
      visible.add(c.id);
    }
  }

  return { visible, historical };
}
