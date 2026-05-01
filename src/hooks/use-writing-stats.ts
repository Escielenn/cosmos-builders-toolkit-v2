/**
 * Client-side stats computation from the writing entries array.
 * No additional DB queries, everything derived from the entries already loaded.
 */

import { useMemo } from "react";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  differenceInCalendarDays,
  isToday,
  isYesterday,
} from "date-fns";
import type { WritingEntryWithWorld } from "@/hooks/use-writing-entries";

export interface WritingStats {
  totalWords: number;
  totalEntries: number;
  wordsToday: number;
  wordsThisWeek: number;
  entriesThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoalProgress: number;
}

function computeStreaks(entries: WritingEntryWithWorld[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Get unique dates (as epoch ms) from entries
  const dateSet = new Set<number>();
  for (const e of entries) {
    dateSet.add(startOfDay(new Date(e.created_at)).getTime());
  }

  const sortedDates = Array.from(dateSet).sort((a, b) => a - b);
  if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Longest streak: walk forward through sorted dates
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = differenceInCalendarDays(
      new Date(sortedDates[i]),
      new Date(sortedDates[i - 1])
    );
    if (diff === 1) {
      currentRun++;
      if (currentRun > longestStreak) longestStreak = currentRun;
    } else {
      currentRun = 1;
    }
  }

  // Current streak: walk backwards from most recent date
  const mostRecent = new Date(sortedDates[sortedDates.length - 1]);
  const todayStart = startOfDay(new Date());

  // Only count if most recent entry is today or yesterday
  if (!isToday(mostRecent) && !isYesterday(mostRecent)) {
    return { currentStreak: 0, longestStreak };
  }

  let currentStreak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const diff = differenceInCalendarDays(
      new Date(sortedDates[i + 1]),
      new Date(sortedDates[i])
    );
    if (diff === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

export function useWritingStats(
  entries: WritingEntryWithWorld[],
  dailyGoalWords: number
): WritingStats {
  return useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const monthStart = startOfMonth(now);

    let totalWords = 0;
    let wordsToday = 0;
    let wordsThisWeek = 0;
    let entriesThisMonth = 0;

    for (const entry of entries) {
      const entryDate = new Date(entry.created_at);
      const wc = entry.word_count;

      totalWords += wc;

      if (entryDate >= todayStart) {
        wordsToday += wc;
      }
      if (entryDate >= weekStart) {
        wordsThisWeek += wc;
      }
      if (entryDate >= monthStart) {
        entriesThisMonth++;
      }
    }

    const { currentStreak, longestStreak } = computeStreaks(entries);

    const dailyGoalProgress =
      dailyGoalWords > 0 ? wordsToday / dailyGoalWords : 0;

    return {
      totalWords,
      totalEntries: entries.length,
      wordsToday,
      wordsThisWeek,
      entriesThisMonth,
      currentStreak,
      longestStreak,
      dailyGoalProgress,
    };
  }, [entries, dailyGoalWords]);
}
