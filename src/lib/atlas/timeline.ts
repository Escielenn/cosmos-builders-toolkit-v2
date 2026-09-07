// ---------------------------------------------------------------------------
// The Codex's Timeline view (13-THE-LIFT.md §1: List · Web · Atlas · Timeline).
//
// "Entities laid on the Chronicle by lifespan. Era bands. Scrub, and every
// other view follows."
//
// An entity's span comes from two sources, and they are NOT equivalent:
//
//   DECLARED  metadata.epoch_from / epoch_to — what the writer said.
//   OBSERVED  the earliest and latest chronicle events linked to it — what
//             the world's own record shows.
//
// Where they disagree, the declared span wins and the disagreement is
// reported. That is Law II: a writer who typed "founded 1502" and then wrote
// an event at 1480 has a contradiction worth seeing, not an average worth
// computing. Nothing here silently reconciles them.
//
// An entity with neither is UNDATED. It is listed, not placed — the same rule
// the Atlas holds for unplaced pins.
// ---------------------------------------------------------------------------

import type { ChronicleEvent } from "@/services/chronicle-data";
import type { Entity } from "@/services/entity-graph-types";
import { entityEpochRange } from "@/lib/codex-entity";

export interface TimelineSpan {
  id: string;
  name: string;
  entityType: string;
  /** Numeric sort positions, from the Chronicle's own scale. */
  from: number;
  to: number;
  /** What to show as the label at each end. */
  fromLabel: string;
  toLabel: string;
  /** True when the span came from linked events rather than a declared range. */
  observed: boolean;
  /**
   * Set when the writer declared a range AND linked events fall outside it.
   * A contradiction to surface, never to average away.
   */
  conflict: string | null;
  eventCount: number;
}

export interface TimelineModel {
  spans: TimelineSpan[];
  /** Entities with no date at all. Listed, never placed. */
  undated: Array<{ id: string; name: string; entityType: string }>;
  /** The axis. Null when nothing is dated. */
  bounds: { min: number; max: number } | null;
}

/**
 * Parse a declared epoch label to the Chronicle's numeric scale.
 *
 * Deliberately strict: a label the Chronicle itself cannot place ("the Long
 * Quiet") returns null rather than a guess. The entity then falls back to its
 * observed span, or to undated.
 */
export function parseEpochLabel(label: string | null): number | null {
  if (!label) return null;
  const m = label.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function eventSpan(events: ChronicleEvent[]): { from: number; to: number } | null {
  if (events.length === 0) return null;
  let from = Infinity;
  let to = -Infinity;
  for (const e of events) {
    from = Math.min(from, e.sortValue);
    to = Math.max(to, e.endSortValue ?? e.sortValue);
  }
  return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null;
}

/** Every event in the tree, flattened — children carry links too. */
export function flattenEvents(events: ChronicleEvent[]): ChronicleEvent[] {
  const out: ChronicleEvent[] = [];
  const walk = (list: ChronicleEvent[]) => {
    for (const e of list) {
      out.push(e);
      if (e.children?.length) walk(e.children);
    }
  };
  walk(events);
  return out;
}

export function buildTimeline(
  entities: Entity[],
  events: ChronicleEvent[],
): TimelineModel {
  const flat = flattenEvents(events);

  const byEntity = new Map<string, ChronicleEvent[]>();
  for (const e of flat) {
    if (!e.linkedEntryId) continue;
    const list = byEntity.get(e.linkedEntryId);
    if (list) list.push(e);
    else byEntity.set(e.linkedEntryId, [e]);
  }

  const spans: TimelineSpan[] = [];
  const undated: TimelineModel["undated"] = [];

  for (const entity of entities) {
    const linked = byEntity.get(entity.id) ?? [];
    const observed = eventSpan(linked);

    const declaredRange = entityEpochRange(entity.metadata);
    const declaredFrom = parseEpochLabel(declaredRange.from);
    const declaredTo = parseEpochLabel(declaredRange.to);
    const hasDeclared = declaredFrom !== null || declaredTo !== null;

    if (!hasDeclared && !observed) {
      undated.push({
        id: entity.id,
        name: entity.name,
        entityType: entity.entity_type,
      });
      continue;
    }

    let from: number;
    let to: number;
    let fromLabel: string;
    let toLabel: string;
    let conflict: string | null = null;

    if (hasDeclared) {
      // A half-declared range takes its open end from the events, and from
      // itself when there are none — never from nothing.
      from = declaredFrom ?? observed?.from ?? declaredTo!;
      to = declaredTo ?? observed?.to ?? declaredFrom!;
      fromLabel = declaredRange.from ?? String(from);
      toLabel = declaredRange.to ?? String(to);

      if (observed && (observed.from < from || observed.to > to)) {
        conflict = `Events fall outside the declared range (${observed.from} to ${observed.to}).`;
      }
    } else {
      from = observed!.from;
      to = observed!.to;
      const first = linked.reduce((a, b) => (a.sortValue <= b.sortValue ? a : b));
      const last = linked.reduce((a, b) =>
        (a.endSortValue ?? a.sortValue) >= (b.endSortValue ?? b.sortValue) ? a : b,
      );
      fromLabel = first.eventDate;
      toLabel = last.endDate ?? last.eventDate;
    }

    if (to < from) [from, to] = [to, from];

    spans.push({
      id: entity.id,
      name: entity.name,
      entityType: entity.entity_type,
      from,
      to,
      fromLabel,
      toLabel,
      observed: !hasDeclared,
      conflict,
      eventCount: linked.length,
    });
  }

  spans.sort((a, b) => a.from - b.from || a.name.localeCompare(b.name));
  undated.sort((a, b) => a.name.localeCompare(b.name));

  const bounds = spans.length
    ? {
        min: Math.min(...spans.map((s) => s.from)),
        max: Math.max(...spans.map((s) => s.to)),
      }
    : null;

  return { spans, undated, bounds };
}

/**
 * Where a span sits on the axis, 0..1. A world whose entities all share one
 * instant has no extent to divide by, so everything sits at the left edge and
 * spans the full width rather than dividing by zero.
 */
export function spanGeometry(
  span: TimelineSpan,
  bounds: { min: number; max: number },
): { left: number; width: number } {
  const extent = bounds.max - bounds.min;
  if (extent <= 0) return { left: 0, width: 1 };
  return {
    left: (span.from - bounds.min) / extent,
    width: Math.max((span.to - span.from) / extent, 0),
  };
}
