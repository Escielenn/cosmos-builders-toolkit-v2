// ---------------------------------------------------------------------------
// useSessionTarget, the session half of Targets.
//
// One goal number (writing_preferences.dailyGoalWords, the daily goal that
// already existed) with the writer's choice of reset:
//   "day"      today's words from the writing_sessions ledger (unchanged)
//   "session"  words added since this session began; it begins when the tab
//              opens or when the writer presses NEW SESSION
// Session words are counted from session-words-bus, which every editor in the
// writing space reports to. Mount ONE instance (Write.tsx) and pass it down.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { useSessionWords } from "@/hooks/use-session-words";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { onWordsWritten } from "@/lib/session-words-bus";
import type { SessionReset } from "@/lib/writing-targets";

const STORE = "sf-writing-session";

interface SessionState {
  start: string;
  words: number;
}

function readStore(): SessionState {
  try {
    const raw = sessionStorage.getItem(STORE);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SessionState>;
      if (typeof p.start === "string" && typeof p.words === "number" && p.words >= 0) {
        return { start: p.start, words: p.words };
      }
    }
  } catch {
    /* storage unavailable */
  }
  return { start: new Date().toISOString(), words: 0 };
}

function writeStore(s: SessionState): void {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

export interface SessionTarget {
  mode: SessionReset;
  /** Words counted toward the goal under the current reset rule. */
  words: number;
  goal: number;
  todayWords: number;
  sessionWords: number;
  sessionStart: string;
  setGoal: (n: number) => void;
  setMode: (m: SessionReset) => void;
  /** Start a new session (session mode's counter back to zero). */
  reset: () => void;
  /** Re-read today's ledger after a write. */
  refreshToday: () => void;
}

export function useSessionTarget(): SessionTarget {
  const { preferences, updatePreferences } = useWritingPreferences();
  const { sessionWords: todayWords, refresh } = useSessionWords();
  const [session, setSession] = useState<SessionState>(readStore);

  useEffect(
    () =>
      onWordsWritten((delta) =>
        setSession((s) => {
          const next = { ...s, words: s.words + delta };
          writeStore(next);
          return next;
        }),
      ),
    [],
  );

  const reset = useCallback(() => {
    const next = { start: new Date().toISOString(), words: 0 };
    writeStore(next);
    setSession(next);
  }, []);

  const mode: SessionReset = preferences.sessionReset === "session" ? "session" : "day";
  const goal = preferences.dailyGoalWords || 500;

  return {
    mode,
    words: mode === "day" ? todayWords : session.words,
    goal,
    todayWords,
    sessionWords: session.words,
    sessionStart: session.start,
    setGoal: (n) => updatePreferences({ dailyGoalWords: Math.max(100, Math.min(10_000, Math.round(n))) }),
    setMode: (m) => updatePreferences({ sessionReset: m }),
    reset,
    refreshToday: refresh,
  };
}
