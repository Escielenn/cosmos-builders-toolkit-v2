// ---------------------------------------------------------------------------
// writing-targets, Scrivener's three targets in one place.
//
//   DOCUMENT  per-document word target (metadata.target, Phase 1)
//   SESSION   words this sitting. The existing daily goal
//             (writing_preferences.dailyGoalWords + the writing_sessions
//             ledger) IS the session target when it resets per day; the
//             writer can instead reset it per session (since this tab opened
//             or since they pressed reset). One number, two reset rules.
//   PROJECT   total manuscript words + an optional deadline, which yields the
//             words per day needed to land on time. Belongs to the world:
//             worlds.settings.writingProject.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { readSettingsKey, writeSettingsKey } from "@/lib/world-settings";

export const PROJECT_KEY = "writingProject";
export const MAX_PROJECT_WORDS = 10_000_000;

export type SessionReset = "day" | "session";

export interface ProjectTarget {
  /** Total manuscript words. 0 = no project target. */
  words: number;
  /** Deadline as YYYY-MM-DD (local calendar date). "" = none. */
  deadline: string;
}

export const EMPTY_PROJECT_TARGET: ProjectTarget = { words: 0, deadline: "" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function sanitizeProjectTarget(raw: unknown): ProjectTarget {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...EMPTY_PROJECT_TARGET };
  const r = raw as Record<string, unknown>;
  const n = typeof r.words === "number" ? r.words : typeof r.words === "string" ? Number(r.words) : NaN;
  const words = Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), MAX_PROJECT_WORDS) : 0;
  const deadline = typeof r.deadline === "string" && isValidDate(r.deadline) ? r.deadline : "";
  return { words, deadline };
}

export function readProjectTarget(settings: unknown): ProjectTarget {
  return sanitizeProjectTarget(readSettingsKey(settings, PROJECT_KEY));
}

export function writeProjectTarget(settings: unknown, t: ProjectTarget): Record<string, unknown> {
  return writeSettingsKey(settings, PROJECT_KEY, sanitizeProjectTarget(t));
}

/** Local calendar date of `d` as YYYY-MM-DD. */
export function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Writing days left until the deadline, today included. The deadline day
 * itself counts (finishing on the day is on time). 0 once it has passed.
 */
export function daysRemaining(deadline: string, today: Date = new Date()): number {
  if (!isValidDate(deadline)) return 0;
  const [y, m, d] = deadline.split("-").map(Number);
  const end = Date.UTC(y, m - 1, d);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((end - start) / 86_400_000) + 1;
  return Math.max(0, days);
}

export interface ProjectPace {
  /** 0..1 */
  progress: number;
  remaining: number;
  /** Days left including today; null without a deadline. */
  daysLeft: number | null;
  /** Words per day to land on the deadline; null without one or when done. */
  perDay: number | null;
  /** Deadline passed with words still to write. */
  overdue: boolean;
  done: boolean;
}

export function projectPace(target: ProjectTarget, written: number, today: Date = new Date()): ProjectPace {
  const remaining = Math.max(0, target.words - written);
  const done = target.words > 0 && remaining === 0;
  const progress = target.words > 0 ? Math.min(1, Math.max(0, written / target.words)) : 0;
  if (!target.deadline) {
    return { progress, remaining, daysLeft: null, perDay: null, overdue: false, done };
  }
  const daysLeft = daysRemaining(target.deadline, today);
  const overdue = !done && target.words > 0 && daysLeft === 0;
  const perDay = target.words > 0 && !done && daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null;
  return { progress, remaining, daysLeft, perDay, overdue, done };
}

/** 0..1 progress toward a session goal. */
export function sessionProgress(words: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(1, words / goal));
}
