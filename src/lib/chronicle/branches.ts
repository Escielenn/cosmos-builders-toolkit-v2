// ---------------------------------------------------------------------------
// Chronicle branches — pure logic for time-travel timelines.
//
// The Chronicle's BRANCHES view (05-NEW-SYSTEMS B2, Law V) draws one lane per
// timeline: the prime timeline plus every alternate branch, each forking from
// its parent at a divergence point. Jumps are travellers moving between
// (branch, time) coordinates.
//
// This module owns three things and nothing else:
//   1. lane layout (which lanes exist, in what order, where each one starts)
//   2. resolving which lane an event belongs to
//   3. paradox advisories — deterministic, cited, never auto-fixed
//
// Pure: no React, no network, safe during render, unit-tested.
//
// Time unit: the Chronicle's sort_value (estimateSortValue: year × 1000).
// ---------------------------------------------------------------------------

import {
  lorentzFactor,
  formatDuration,
  SECONDS_PER_YEAR,
} from "@/lib/time-dilation/calculations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Branch colours are named-hue token keys, never hex. Crimson is excluded:
 * it means Stop and is reserved for advisories.
 */
export const BRANCH_HUES = [
  "teal",
  "azure",
  "amber",
  "emerald",
  "magenta",
  "stellar",
  "violet",
] as const;

export type BranchHue = (typeof BRANCH_HUES)[number];

export function isBranchHue(v: unknown): v is BranchHue {
  return typeof v === "string" && (BRANCH_HUES as readonly string[]).includes(v);
}

/** Lane key for the prime timeline (branch_id NULL). */
export const PRIME_LANE = "__prime__";

export interface BranchRecord {
  id: string;
  name: string;
  color: BranchHue;
  /** null = forks from the prime timeline. */
  parentBranchId: string | null;
  divergenceSortValue: number | null;
  divergenceEventId: string | null;
  description: string | null;
  sortOrder: number;
}

export interface BranchEventLike {
  id: string;
  title: string;
  eventDate: string;
  sortValue: number;
  endSortValue: number | null;
  branchId: string | null;
  linkedEntryId: string | null;
  tags: string[];
}

export interface JumpRecord {
  id: string;
  travelerEntryId: string | null;
  travelerLabel: string;
  fromBranchId: string | null;
  fromSortValue: number;
  toBranchId: string | null;
  toSortValue: number;
  properDuration: string | null;
  method: string;
  notes: string | null;
}

export interface Lane {
  /** PRIME_LANE or the branch id. */
  key: string;
  branch: BranchRecord | null;
  /** Row index, top to bottom. */
  index: number;
  /** 0 for prime, 1 for its children, ... */
  depth: number;
  /** Lane key of the parent, null for prime. */
  parentKey: string | null;
  /** Where the lane begins (its divergence). -Infinity for prime. */
  start: number;
  /** True when the branch's parent is missing or its ancestry loops. */
  orphaned: boolean;
}

// ---------------------------------------------------------------------------
// Lane layout
// ---------------------------------------------------------------------------

function laneKeyOf(branchId: string | null | undefined): string {
  return branchId ? branchId : PRIME_LANE;
}

function compareSiblings(a: BranchRecord, b: BranchRecord): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  const da = a.divergenceSortValue ?? Number.POSITIVE_INFINITY;
  const db = b.divergenceSortValue ?? Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;
  const n = a.name.localeCompare(b.name);
  return n !== 0 ? n : a.id.localeCompare(b.id);
}

/**
 * The time a branch starts existing. Explicit divergence first, then the
 * divergence event's date, then (unset) the parent's own start.
 */
function rawDivergence(
  branch: BranchRecord,
  eventById: Map<string, BranchEventLike>,
): number | null {
  if (branch.divergenceSortValue != null && Number.isFinite(branch.divergenceSortValue)) {
    return branch.divergenceSortValue;
  }
  if (branch.divergenceEventId) {
    const ev = eventById.get(branch.divergenceEventId);
    if (ev) return ev.sortValue;
  }
  return null;
}

/**
 * Build the lanes: prime on top, then each branch directly beneath its
 * parent's subtree (depth-first), siblings ordered by sort_order, then
 * divergence, then name. Branches whose parent is missing or whose ancestry
 * loops are hung under prime and marked `orphaned`.
 */
export function buildLaneLayout(
  branches: BranchRecord[],
  events: BranchEventLike[] = [],
): Lane[] {
  const byId = new Map(branches.map((b) => [b.id, b]));
  const eventById = new Map(events.map((e) => [e.id, e]));

  // Detect ancestry loops / missing parents.
  const orphaned = new Set<string>();
  for (const b of branches) {
    if (b.parentBranchId && !byId.has(b.parentBranchId)) {
      orphaned.add(b.id);
      continue;
    }
    const seen = new Set<string>([b.id]);
    let cur = b.parentBranchId ? byId.get(b.parentBranchId) : undefined;
    while (cur) {
      if (seen.has(cur.id)) {
        orphaned.add(b.id);
        break;
      }
      seen.add(cur.id);
      cur = cur.parentBranchId ? byId.get(cur.parentBranchId) : undefined;
    }
  }

  const effectiveParent = (b: BranchRecord): string | null =>
    orphaned.has(b.id) ? null : b.parentBranchId;

  const children = new Map<string, BranchRecord[]>();
  for (const b of branches) {
    const key = laneKeyOf(effectiveParent(b));
    const list = children.get(key) ?? [];
    list.push(b);
    children.set(key, list);
  }
  for (const list of children.values()) list.sort(compareSiblings);

  const lanes: Lane[] = [
    {
      key: PRIME_LANE,
      branch: null,
      index: 0,
      depth: 0,
      parentKey: null,
      start: Number.NEGATIVE_INFINITY,
      orphaned: false,
    },
  ];
  const startOf = new Map<string, number>([[PRIME_LANE, Number.NEGATIVE_INFINITY]]);

  const visit = (parentKey: string, depth: number) => {
    for (const b of children.get(parentKey) ?? []) {
      const parentStart = startOf.get(parentKey) ?? Number.NEGATIVE_INFINITY;
      const start = rawDivergence(b, eventById) ?? parentStart;
      startOf.set(b.id, start);
      lanes.push({
        key: b.id,
        branch: b,
        index: lanes.length,
        depth,
        parentKey,
        start,
        orphaned: orphaned.has(b.id),
      });
      visit(b.id, depth + 1);
    }
  };
  visit(PRIME_LANE, 1);

  return lanes;
}

/** Lane key an event belongs to. Unknown branch ids fall back to prime. */
export function resolveEventLane(
  event: Pick<BranchEventLike, "branchId">,
  branchIds: ReadonlySet<string>,
): string {
  return event.branchId && branchIds.has(event.branchId) ? event.branchId : PRIME_LANE;
}

/** Lane key for a jump endpoint, with the same fallback. */
export function resolveBranchLane(
  branchId: string | null,
  branchIds: ReadonlySet<string>,
): string {
  return branchId && branchIds.has(branchId) ? branchId : PRIME_LANE;
}

// ---------------------------------------------------------------------------
// Domain + axis
// ---------------------------------------------------------------------------

/** Extent of everything drawable, padded 5% each side. Never zero-width. */
export function computeDomain(
  events: BranchEventLike[],
  branches: BranchRecord[],
  jumps: JumpRecord[],
): [number, number] {
  const values: number[] = [];
  for (const e of events) {
    values.push(e.sortValue);
    if (e.endSortValue != null) values.push(e.endSortValue);
  }
  for (const b of branches) {
    if (b.divergenceSortValue != null) values.push(b.divergenceSortValue);
  }
  for (const j of jumps) values.push(j.fromSortValue, j.toSortValue);
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0, 100_000];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    min -= 10_000;
    max += 10_000;
  }
  const pad = (max - min) * 0.05;
  return [min - pad, max + pad];
}

/**
 * Evenly spaced "nice" tick values (1/2/5 × 10^n) across [min, max], in
 * sort-value units. Returns at most ~target+2 ticks.
 */
export function niceTicks(min: number, max: number, target = 6): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const raw = (max - min) / Math.max(1, target);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const first = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = first; v <= max + step * 1e-9; v += step) {
    // Avoid -0 and float dust like 2999.9999999.
    const clean = Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12));
    ticks.push(clean);
  }
  return ticks;
}

/**
 * A sort value rendered in the world's calendar: "1128 EO", "4.5B", "-300".
 * Sort values are year × 1000 (estimateSortValue).
 */
export function formatSortValue(sortValue: number, eraLabel = ""): string {
  const year = sortValue / 1000;
  const abs = Math.abs(year);
  let num: string;
  if (abs >= 1e9) num = `${(year / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  else if (abs >= 1e6) num = `${(year / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  else if (abs >= 1e5) num = `${Math.round(year / 1e3)}K`;
  else if (Number.isInteger(year)) num = String(year);
  else num = String(Number(year.toFixed(2)));
  return eraLabel ? `${num} ${eraLabel}` : num;
}

// ---------------------------------------------------------------------------
// Advisories
// ---------------------------------------------------------------------------

export type AdvisoryKind =
  | "causal-loop"
  | "event-predates-divergence"
  | "divergence-outside-parent"
  | "arrival-before-branch"
  | "orphan-branch";

export interface BranchAdvisory {
  /** Stable id: kind + cited ids. */
  id: string;
  kind: AdvisoryKind;
  /** Ship's Voice headline. */
  title: string;
  /** Ship's Voice explanation. Names nothing the writer did not enter. */
  detail: string;
  eventIds: string[];
  jumpIds: string[];
  branchIds: string[];
}

export const ADVISORY_TITLES: Record<AdvisoryKind, string> = {
  "causal-loop": "CAUSAL LOOP",
  "event-predates-divergence": "EVENT PREDATES DIVERGENCE",
  "divergence-outside-parent": "DIVERGENCE OUTSIDE PARENT SPAN",
  "arrival-before-branch": "BRANCH NOT YET IN EXISTENCE",
  "orphan-branch": "BRANCH PARENT MISSING",
};

/** Does an event involve this traveller? Linked entity, tag, or whole-word title. */
export function eventInvolvesTraveler(
  event: BranchEventLike,
  jump: Pick<JumpRecord, "travelerEntryId" | "travelerLabel">,
): boolean {
  if (jump.travelerEntryId && event.linkedEntryId === jump.travelerEntryId) return true;
  const label = jump.travelerLabel.trim().toLowerCase();
  if (!label) return false;
  if (event.tags.some((t) => t.trim().toLowerCase() === label)) return true;
  if (label.length < 3) return false;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu").test(
    event.title,
  );
}

function travelerName(j: JumpRecord): string {
  return j.travelerLabel.trim() || "UNNAMED TRAVELER";
}

/**
 * Run every paradox check. Deterministic: the same inputs always produce the
 * same advisories in the same order. Nothing is ever corrected — the writer
 * decides whether a loop is a bug or the plot.
 */
export function detectBranchAdvisories(
  branches: BranchRecord[],
  events: BranchEventLike[],
  jumps: JumpRecord[],
  eraLabel = "",
): BranchAdvisory[] {
  const lanes = buildLaneLayout(branches, events);
  const laneByKey = new Map(lanes.map((l) => [l.key, l]));
  const branchIds = new Set(branches.map((b) => b.id));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const out: BranchAdvisory[] = [];
  const fmt = (v: number) => formatSortValue(v, eraLabel);

  // (orphan) parent missing or ancestry loops.
  for (const lane of lanes) {
    if (!lane.orphaned || !lane.branch) continue;
    out.push({
      id: `orphan-branch:${lane.key}`,
      kind: "orphan-branch",
      title: ADVISORY_TITLES["orphan-branch"],
      detail: `${lane.branch.name.toUpperCase()} NAMES A PARENT THAT IS NOT ON FILE OR DESCENDS FROM ITSELF. DRAWN FROM THE PRIME TIMELINE UNTIL A PARENT IS SET.`,
      eventIds: [],
      jumpIds: [],
      branchIds: [lane.key],
    });
  }

  // (c) divergence outside the parent's span.
  for (const lane of lanes) {
    const b = lane.branch;
    if (!b || lane.orphaned || !lane.parentKey) continue;
    const parent = laneByKey.get(lane.parentKey);
    if (!parent) continue;
    const explicit = rawDivergence(b, eventById);
    if (explicit != null && explicit < parent.start) {
      out.push({
        id: `divergence-outside-parent:${b.id}`,
        kind: "divergence-outside-parent",
        title: ADVISORY_TITLES["divergence-outside-parent"],
        detail: `${b.name.toUpperCase()} DIVERGES AT ${fmt(explicit)}, BEFORE ITS PARENT ${
          parent.branch ? parent.branch.name.toUpperCase() : "PRIME"
        } EXISTS (${fmt(parent.start)}).`,
        eventIds: b.divergenceEventId && eventById.has(b.divergenceEventId) ? [b.divergenceEventId] : [],
        jumpIds: [],
        branchIds: [b.id, ...(parent.branch ? [parent.branch.id] : [])],
      });
    }
    // A divergence event that sits on another lane than the parent.
    if (b.divergenceEventId) {
      const ev = eventById.get(b.divergenceEventId);
      if (ev) {
        const evLane = resolveEventLane(ev, branchIds);
        if (evLane !== lane.parentKey) {
          out.push({
            id: `divergence-outside-parent:event:${b.id}`,
            kind: "divergence-outside-parent",
            title: ADVISORY_TITLES["divergence-outside-parent"],
            detail: `${b.name.toUpperCase()} SPLITS AT AN EVENT THAT IS NOT ON ITS PARENT TIMELINE.`,
            eventIds: [ev.id],
            jumpIds: [],
            branchIds: [b.id],
          });
        }
      }
    }
  }

  // (b) events dated before their branch diverged.
  for (const ev of events) {
    const key = resolveEventLane(ev, branchIds);
    if (key === PRIME_LANE) continue;
    const lane = laneByKey.get(key);
    if (!lane || !lane.branch) continue;
    if (Number.isFinite(lane.start) && ev.sortValue < lane.start) {
      out.push({
        id: `event-predates-divergence:${ev.id}`,
        kind: "event-predates-divergence",
        title: ADVISORY_TITLES["event-predates-divergence"],
        detail: `LOGGED ON ${lane.branch.name.toUpperCase()} AT ${fmt(ev.sortValue)}. THE BRANCH SPLITS AT ${fmt(lane.start)}.`,
        eventIds: [ev.id],
        jumpIds: [],
        branchIds: [lane.branch.id],
      });
    }
  }

  // (d) a jump touching a branch at a time it does not exist yet.
  for (const j of jumps) {
    const ends: Array<["departure" | "arrival", string | null, number]> = [
      ["departure", j.fromBranchId, j.fromSortValue],
      ["arrival", j.toBranchId, j.toSortValue],
    ];
    for (const [which, branchId, at] of ends) {
      const key = resolveBranchLane(branchId, branchIds);
      const lane = laneByKey.get(key);
      if (!lane || !lane.branch || !Number.isFinite(lane.start)) continue;
      if (at < lane.start) {
        out.push({
          id: `arrival-before-branch:${which}:${j.id}`,
          kind: "arrival-before-branch",
          title: ADVISORY_TITLES["arrival-before-branch"],
          detail: `${travelerName(j).toUpperCase()} ${
            which === "arrival" ? "ARRIVES ON" : "DEPARTS FROM"
          } ${lane.branch.name.toUpperCase()} AT ${fmt(at)}. THE BRANCH SPLITS AT ${fmt(lane.start)}.`,
          eventIds: [],
          jumpIds: [j.id],
          branchIds: [lane.branch.id],
        });
      }
    }
  }

  // (a) closed causal loops: same lane, arrival before departure, and the
  // traveller appears in events inside the window where both selves coexist.
  for (const j of jumps) {
    const fromKey = resolveBranchLane(j.fromBranchId, branchIds);
    const toKey = resolveBranchLane(j.toBranchId, branchIds);
    if (fromKey !== toKey) continue;
    if (!(j.toSortValue < j.fromSortValue)) continue;
    const inLoop = events.filter(
      (ev) =>
        resolveEventLane(ev, branchIds) === fromKey &&
        ev.sortValue >= j.toSortValue &&
        ev.sortValue <= j.fromSortValue &&
        eventInvolvesTraveler(ev, j),
    );
    if (inLoop.length === 0) continue;
    const laneName = laneByKey.get(fromKey)?.branch?.name.toUpperCase() ?? "PRIME";
    out.push({
      id: `causal-loop:${j.id}`,
      kind: "causal-loop",
      title: ADVISORY_TITLES["causal-loop"],
      detail: `${travelerName(j).toUpperCase()} ARRIVES AT ${fmt(j.toSortValue)} BEFORE DEPARTING AT ${fmt(
        j.fromSortValue,
      )} ON ${laneName}, AND APPEARS IN ${inLoop.length} ${
        inLoop.length === 1 ? "EVENT" : "EVENTS"
      } INSIDE THE LOOP. TWO SELVES ON ONE TIMELINE. INTENDED?`,
      eventIds: inLoop.map((e) => e.id),
      jumpIds: [j.id],
      branchIds: fromKey === PRIME_LANE ? [] : [fromKey],
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Proper time (Time Dilation helper)
// ---------------------------------------------------------------------------

export interface ProperTimeResult {
  gamma: number;
  properYears: number;
  /** "4.36 years", from the Time Dilation tool's own formatter. */
  label: string;
}

/**
 * Traveller's own elapsed time for a cruise at constant velocity:
 * τ = t / γ. Uses the same Lorentz factor the Time Dilation tool uses.
 * Returns null for inputs outside physical range (v ≥ c, negative time).
 */
export function computeProperDuration(
  velocityFractionC: number,
  coordinateYears: number,
): ProperTimeResult | null {
  if (!Number.isFinite(velocityFractionC) || !Number.isFinite(coordinateYears)) return null;
  if (velocityFractionC < 0 || velocityFractionC >= 1 || coordinateYears < 0) return null;
  const gamma = lorentzFactor(velocityFractionC);
  const properYears = coordinateYears / gamma;
  return {
    gamma,
    properYears,
    label: formatDuration(properYears * SECONDS_PER_YEAR),
  };
}
