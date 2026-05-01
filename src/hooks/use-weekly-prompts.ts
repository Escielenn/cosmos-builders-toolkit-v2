/**
 * Weekly prompt rotation system.
 *
 * Each Monday-Sunday week, 7 prompts are deterministically selected from the
 * full WRITING_PROMPTS pool (one per day). Selection is seeded by ISO week
 * number + year so every user sees the same set.
 *
 * Persistence (localStorage):
 *   sf-prompt-history  , { weekKey, actedOn: string[] }
 *   sf-expired-prompts , { weekKey, count }
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { WRITING_PROMPTS, type WritingPrompt } from "@/lib/writing/prompts";

// ─── Date helpers ──────────────────────────────────────────────────────

/** ISO week number (Monday = start of week). */
function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** Monday of the ISO week containing `d`. */
function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Sunday (end of ISO week) at 23:59:59. */
function getWeekSunday(d: Date): Date {
  const monday = getWeekMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/** Deterministic week key string, e.g. "2026-W14". */
function weekKey(d: Date): string {
  const week = getISOWeek(d);
  const year = d.getFullYear();
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Simple integer hash from a string seed. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // 32-bit int
  }
  return Math.abs(hash);
}

/** Pick `count` unique indices from [0..length) seeded by `seed`. */
function seededPick(seed: string, length: number, count: number): number[] {
  const picked = new Set<number>();
  let h = hashSeed(seed);
  let attempt = 0;
  while (picked.size < count && picked.size < length) {
    // Mix the hash with each attempt for variety
    h = hashSeed(seed + ":" + attempt);
    picked.add(h % length);
    attempt++;
  }
  return Array.from(picked);
}

// ─── Format helpers ────────────────────────────────────────────────────

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatWeekLabel(monday: Date, sunday: Date): string {
  const mMonth = MONTH_ABBR[monday.getMonth()];
  const sMonth = MONTH_ABBR[sunday.getMonth()];
  const year = sunday.getFullYear();

  if (mMonth === sMonth) {
    return `${mMonth} ${monday.getDate()}-${sunday.getDate()}, ${year}`;
  }
  return `${mMonth} ${monday.getDate()} - ${sMonth} ${sunday.getDate()}, ${year}`;
}

// ─── LocalStorage persistence ──────────────────────────────────────────

interface PromptHistory {
  weekKey: string;
  actedOn: string[];
}

interface ExpiredRecord {
  weekKey: string;
  count: number;
}

function loadHistory(): PromptHistory | null {
  try {
    const raw = localStorage.getItem("sf-prompt-history");
    return raw ? (JSON.parse(raw) as PromptHistory) : null;
  } catch {
    return null;
  }
}

function saveHistory(h: PromptHistory) {
  localStorage.setItem("sf-prompt-history", JSON.stringify(h));
}

function loadExpired(): ExpiredRecord | null {
  try {
    const raw = localStorage.getItem("sf-expired-prompts");
    return raw ? (JSON.parse(raw) as ExpiredRecord) : null;
  } catch {
    return null;
  }
}

function saveExpired(e: ExpiredRecord) {
  localStorage.setItem("sf-expired-prompts", JSON.stringify(e));
}

// ─── Hook ──────────────────────────────────────────────────────────────

export interface UseWeeklyPromptsReturn {
  weekPrompts: WritingPrompt[];
  todayPrompt: WritingPrompt;
  actedOn: Set<string>;
  expiredCount: number;
  markActedOn: (promptId: string) => void;
  daysRemaining: number;
  weekLabel: string;
}

export function useWeeklyPrompts(): UseWeeklyPromptsReturn {
  const now = useMemo(() => new Date(), []);
  const currentKey = useMemo(() => weekKey(now), [now]);
  const monday = useMemo(() => getWeekMonday(now), [now]);
  const sunday = useMemo(() => getWeekSunday(now), [now]);

  // ── Compute expired count from previous week ──────────────────────
  const expiredCount = useMemo(() => {
    const prevMonday = new Date(monday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const prevKey = weekKey(prevMonday);

    const stored = loadExpired();
    if (stored && stored.weekKey === prevKey) return stored.count;

    // Check if there is stale history from last week
    const hist = loadHistory();
    if (hist && hist.weekKey === prevKey) {
      // 7 prompts minus acted-on = expired
      const expired = 7 - hist.actedOn.length;
      saveExpired({ weekKey: prevKey, count: expired });
      return expired;
    }

    // No data for last week, assume all 7 expired
    return 0;
  }, [monday]);

  // ── Deterministically pick this week's 7 prompts ──────────────────
  const weekPrompts = useMemo(() => {
    const indices = seededPick(currentKey, WRITING_PROMPTS.length, 7);
    return indices.map((i) => WRITING_PROMPTS[i]);
  }, [currentKey]);

  // ── Today's prompt (by day of week index: Mon=0 .. Sun=6) ─────────
  const todayPrompt = useMemo(() => {
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0 .. Sun=6
    return weekPrompts[idx] ?? weekPrompts[0];
  }, [now, weekPrompts]);

  // ── Acted-on state ────────────────────────────────────────────────
  const [actedOn, setActedOn] = useState<Set<string>>(() => {
    const hist = loadHistory();
    if (hist && hist.weekKey === currentKey) {
      return new Set(hist.actedOn);
    }
    return new Set();
  });

  // Persist acted-on changes
  useEffect(() => {
    saveHistory({ weekKey: currentKey, actedOn: Array.from(actedOn) });
  }, [actedOn, currentKey]);

  const markActedOn = useCallback(
    (promptId: string) => {
      setActedOn((prev) => {
        const next = new Set(prev);
        next.add(promptId);
        return next;
      });
    },
    [],
  );

  // ── Days remaining until week resets ──────────────────────────────
  const daysRemaining = useMemo(() => {
    const diff = sunday.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }, [now, sunday]);

  // ── Week label ────────────────────────────────────────────────────
  const weekLabel = useMemo(() => formatWeekLabel(monday, sunday), [monday, sunday]);

  return {
    weekPrompts,
    todayPrompt,
    actedOn,
    expiredCount,
    markActedOn,
    daysRemaining,
    weekLabel,
  };
}
