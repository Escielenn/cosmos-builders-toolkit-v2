// ---------------------------------------------------------------------------
// writing-activity.ts, streaks, word history, and badge inputs from the
// Studio's own ledgers.
//
// Sources (one writing model):
//   writing_sessions   one row per (user, local day) with the words typed
//                      in the Studio that day. Streaks, totals, history.
//   world_entries      Studio documents (entry_type 'document'). Piece
//                      counts, per-world counts, tags.
// The retired /workshop store (writing_entries) is not read here.
//
// Pure: no React, no network, unit-tested.
// ---------------------------------------------------------------------------

import { dayDiff, isDayKey, shiftDay, trailingDays } from "@/lib/local-day";

export interface SessionRow {
  day: string;
  words: number;
}

export interface StudioDocSummary {
  id: string;
  world_id: string;
  tags: string[] | null;
}

// ─── Streaks ─────────────────────────────────────────────────────────────

/**
 * Current and longest run of consecutive days with words > 0.
 *
 * The current streak counts back from today; a today with no words yet does
 * not break it (it counts back from yesterday instead), so the streak does
 * not read 0 every morning.
 */
export function computeStreaks(
  sessions: SessionRow[],
  today: string,
): { currentStreak: number; longestStreak: number } {
  const days = Array.from(
    new Set(sessions.filter((s) => isDayKey(s.day) && s.words > 0).map((s) => s.day)),
  ).sort();
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = dayDiff(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
  }

  const set = new Set(days);
  let currentStreak = 0;
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  while (set.has(cursor)) {
    currentStreak++;
    cursor = shiftDay(cursor, -1);
  }
  return { currentStreak, longestStreak };
}

// ─── Word history (chart data) ──────────────────────────────────────────

export interface HistoryPoint {
  day: string;
  words: number;
}

export interface WordHistory {
  points: HistoryPoint[];
  total: number;
  max: number;
  /** Days in the window with words > 0. */
  activeDays: number;
}

/**
 * One point per day for the `range` days ending today, oldest first, with
 * missing days filled as 0 so the axis is continuous. Duplicate rows for a
 * day (none expected; the ledger's key is (user, day)) are summed.
 */
export function shapeWordHistory(sessions: SessionRow[], today: string, range: number): WordHistory {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    if (!isDayKey(s.day)) continue;
    const w = Number.isFinite(s.words) && s.words > 0 ? Math.round(s.words) : 0;
    byDay.set(s.day, (byDay.get(s.day) ?? 0) + w);
  }
  const points = trailingDays(today, Math.max(1, Math.floor(range))).map((day) => ({
    day,
    words: byDay.get(day) ?? 0,
  }));
  let total = 0;
  let max = 0;
  let activeDays = 0;
  for (const p of points) {
    total += p.words;
    if (p.words > max) max = p.words;
    if (p.words > 0) activeDays++;
  }
  return { points, total, max, activeDays };
}

/** A "nice" axis ceiling at or above `max`: 1, 2 or 5 times a power of ten. */
export function niceCeiling(max: number): number {
  if (!(max > 0)) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 5, 10]) {
    if (m * pow >= max) return m * pow;
  }
  return 10 * pow;
}

// ─── Badge inputs ───────────────────────────────────────────────────────

export interface WritingBadgeInputs {
  writingEntryCount: number;
  writingEntriesWithWorld: number;
  writingEntryTags: string[][];
  writingEntriesByWorld: Map<string, number>;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
}

/**
 * The writing half of BadgeEvalData, from Studio documents and the session
 * ledger. A document always has a world; "with a world" means a real world,
 * so documents in the per-user Workshop world (where world-less workshop
 * entries were moved) do not count toward it.
 */
export function writingBadgeInputs(
  docs: StudioDocSummary[],
  sessions: SessionRow[],
  today: string,
  workshopWorldIds: ReadonlySet<string> = new Set(),
): WritingBadgeInputs {
  const byWorld = new Map<string, number>();
  let withWorld = 0;
  for (const d of docs) {
    if (workshopWorldIds.has(d.world_id)) continue;
    withWorld++;
    byWorld.set(d.world_id, (byWorld.get(d.world_id) ?? 0) + 1);
  }
  const totalWords = sessions.reduce(
    (n, s) => n + (Number.isFinite(s.words) && s.words > 0 ? s.words : 0),
    0,
  );
  return {
    writingEntryCount: docs.length,
    writingEntriesWithWorld: withWorld,
    writingEntryTags: docs.map((d) => d.tags ?? []),
    writingEntriesByWorld: byWorld,
    ...computeStreaks(sessions, today),
    totalWords,
  };
}
