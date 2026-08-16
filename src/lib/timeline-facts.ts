// ---------------------------------------------------------------------------
// timeline-facts, a world's history as facts the writing surface can reach.
//
// Timeline is the one worksheet tool whose shape the `worksheetPaths` mechanism
// cannot express. Every other tool records scalars at fixed paths, so a dot
// path plus a label is enough. A timeline records a *list*: `events`, each with
// a name, a year and an importance. Pointing a path at `events` would hand the
// panel an array of objects and render "[object Object]".
//
// So this reads the list directly, the same way `simulation-facts` reads a
// saved simulation. What a writer wants from their timeline mid-sentence is
// "when did that happen" and "what was it called", so each event becomes one
// fact: the name as the label, the year as the value, and the name as what
// gets inserted, because the name is the thing that goes in the prose.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function obj(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function fin(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/**
 * A year as a writer would write it.
 *
 * Negative years are the convention for "before the reckoning" in the timeline
 * tool, and reading "-417" in a panel is a stumble where "417 BCE" is not.
 */
function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year);
}

/** Which events are worth surfacing, most consequential first. */
const IMPORTANCE_RANK: Record<string, number> = {
  epochal: 0,
  major: 1,
  moderate: 2,
  minor: 3,
};

/**
 * Cap on how many events reach the panel.
 *
 * A long timeline can hold hundreds of events, and a Refs panel listing all of
 * them is no more usable than the timeline itself. The most consequential ones
 * are what prose refers to, so those are what survive the cut.
 */
const MAX_EVENTS = 40;

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * A saved timeline, as facts.
 *
 * Returns [] for a timeline with no events, which is the honest answer for a
 * worksheet that has been created but not filled in.
 */
export function extractTimelineFacts(raw: unknown): WorksheetFact[] {
  const state = obj(raw);
  if (!state) return [];

  const events = (Array.isArray(state.events) ? state.events : [])
    .map(obj)
    .filter((e): e is Record<string, unknown> => e !== null)
    .filter((e) => str(e.name) !== "" && fin(e.startYear) !== null);

  if (events.length === 0) return [];

  const facts: WorksheetFact[] = [];

  // The span first: it is the one thing about a timeline that is true of the
  // whole of it, and it is what a writer checks when placing a new scene.
  const years = events.map((e) => fin(e.startYear) as number);
  const first = Math.min(...years);
  const last = Math.max(...years);
  facts.push({
    key: "timeline.span",
    label: "History spans",
    value:
      first === last
        ? formatYear(first)
        : `${formatYear(first)} to ${formatYear(last)}`,
  });

  facts.push({
    key: "timeline.eventCount",
    label: "Recorded events",
    value: String(events.length),
  });

  // Then the events themselves, most consequential first, then chronological
  // within a rank so a run of equals reads as history rather than a shuffle.
  const ordered = [...events].sort((a, b) => {
    const ra = IMPORTANCE_RANK[str(a.importance)] ?? 2;
    const rb = IMPORTANCE_RANK[str(b.importance)] ?? 2;
    if (ra !== rb) return ra - rb;
    return (fin(a.startYear) as number) - (fin(b.startYear) as number);
  });

  const seen = new Set<string>();
  for (const e of ordered.slice(0, MAX_EVENTS)) {
    const name = str(e.name);
    const startYear = fin(e.startYear) as number;
    const endYear = fin(e.endYear);

    // Two events can legitimately share a name across tracks; keep the key
    // unique so React and the fact panel do not collapse them into one.
    const base = name.toLowerCase().replace(/\s+/g, "-");
    let key = `timeline.event.${base}`;
    let n = 2;
    while (seen.has(key)) key = `timeline.event.${base}-${n++}`;
    seen.add(key);

    const when =
      e.hasDuration === true && endYear !== null && endYear !== startYear
        ? `${formatYear(startYear)} to ${formatYear(endYear)}`
        : formatYear(startYear);

    const detail = str(e.shortDescription);

    facts.push({
      key,
      label: name,
      value: detail ? `${when} · ${detail}` : when,
      // The event's name is what goes in the sentence, not its date.
      insert: name,
    });
  }

  return facts;
}
