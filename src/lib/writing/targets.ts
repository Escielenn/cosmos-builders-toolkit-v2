// ---------------------------------------------------------------------------
// targets, the part of Targets that Scribbles had and StellarForge did not:
// writing weekdays, time goals and a separate session word goal.
//
// writing-targets.ts (1.5) owns the project target and the every-day pace.
// This adds the settings that ride beside it on the world
// (worlds.settings.writingTargets) and the weekday-aware calculator: a
// deadline three weeks out is fifteen writing days for someone who writes
// Monday to Friday, not twenty-one.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import type { ProjectTarget } from "@/lib/writing-targets";

export const TARGETS_KEY = "writingTargets";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export interface TargetExtras {
  /** Days of the week the writer plans to write, 0 = Sunday. */
  writingDays: number[];
  /** Daily focus-time goal in minutes. 0 = none. */
  dailyMinutes: number;
  /** Session focus-time goal in minutes. 0 = none. */
  sessionMinutes: number;
  /** Session word goal. 0 = use the daily goal. */
  sessionWords: number;
}

export const DEFAULT_TARGET_EXTRAS: TargetExtras = {
  // Every day: the pace the Manuscript showed before weekdays existed.
  writingDays: EVERY_DAY,
  dailyMinutes: 30,
  sessionMinutes: 25,
  sessionWords: 0,
};

function bounded(v: unknown, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.round(n));
}

export function sanitizeWritingDays(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [...EVERY_DAY];
  const days = [...new Set(raw.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
  return days;
}

export function sanitizeTargetExtras(raw: unknown): TargetExtras {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    writingDays: "writingDays" in r ? sanitizeWritingDays(r.writingDays) : [...EVERY_DAY],
    dailyMinutes: bounded(r.dailyMinutes, 1440, DEFAULT_TARGET_EXTRAS.dailyMinutes),
    sessionMinutes: bounded(r.sessionMinutes, 1440, DEFAULT_TARGET_EXTRAS.sessionMinutes),
    sessionWords: bounded(r.sessionWords, 100_000, 0),
  };
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDay(s: string): { y: number; m: number; d: number } | null {
  const hit = DATE_RE.exec(s);
  if (!hit) return null;
  const y = Number(hit[1]);
  const m = Number(hit[2]);
  const d = Number(hit[3]);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? { y, m, d } : null;
}

/**
 * Planned writing days from today to the deadline, both included, counting
 * only the chosen weekdays. 0 once the deadline has passed, for an invalid
 * date, or when no weekday is chosen. Calendar arithmetic in UTC so a DST
 * change never adds or drops a day.
 */
export function writingDaysRemaining(
  deadline: string,
  writingDays: readonly number[],
  today: Date = new Date(),
): number {
  const end = parseDay(deadline);
  if (!end || writingDays.length === 0) return 0;
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const span = Math.round((Date.UTC(end.y, end.m - 1, end.d) - start) / 86_400_000) + 1;
  if (span <= 0) return 0;
  const chosen = new Set(writingDays);
  let count = Math.floor(span / 7) * chosen.size;
  const firstWeekday = today.getDay();
  for (let i = 0; i < span % 7; i++) if (chosen.has((firstWeekday + i) % 7)) count += 1;
  return count;
}

export interface DeadlinePace {
  /** 0..1 */
  progress: number;
  remaining: number;
  done: boolean;
  /** Planned writing days left, today included; null without a deadline. */
  writingDaysLeft: number | null;
  /** Words per planned writing day; null without a deadline, or when done. */
  perWritingDay: number | null;
  /** The deadline has passed with words still to write. */
  overdue: boolean;
  /** A deadline ahead, but none of the chosen weekdays falls before it. */
  noWritingDays: boolean;
}

/** Calendar days from today to the deadline, both included (0 when past). */
function calendarDays(deadline: string, today: Date): number {
  return writingDaysRemaining(deadline, [0, 1, 2, 3, 4, 5, 6], today);
}

export function deadlinePace(
  target: ProjectTarget,
  written: number,
  writingDays: readonly number[],
  today: Date = new Date(),
): DeadlinePace {
  const remaining = Math.max(0, target.words - written);
  const done = target.words > 0 && remaining === 0;
  const progress = target.words > 0 ? Math.min(1, Math.max(0, written / target.words)) : 0;
  if (!target.deadline || !parseDay(target.deadline)) {
    return { progress, remaining, done, writingDaysLeft: null, perWritingDay: null, overdue: false, noWritingDays: false };
  }
  const left = writingDaysRemaining(target.deadline, writingDays, today);
  const ahead = calendarDays(target.deadline, today) > 0;
  const open = target.words > 0 && !done;
  return {
    progress,
    remaining,
    done,
    writingDaysLeft: left,
    perWritingDay: open && left > 0 ? Math.ceil(remaining / left) : null,
    overdue: open && !ahead,
    noWritingDays: open && ahead && left === 0,
  };
}

/** A meter: whole percent (0..100) and whether the goal is met. */
export function meter(value: number, goal: number): { pct: number; done: boolean } {
  if (!Number.isFinite(goal) || goal <= 0 || !Number.isFinite(value)) return { pct: 0, done: false };
  const pct = Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
  return { pct, done: value >= goal };
}
