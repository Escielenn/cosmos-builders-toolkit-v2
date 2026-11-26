// ---------------------------------------------------------------------------
// timer, the focus timer's arithmetic.
//
// Counts time the writer could actually have been writing: the timer is
// running AND the tab is visible. Hidden tabs, a sleeping laptop and a paused
// timer add nothing. Two totals move together: this session, and today (the
// writer's local calendar day, like the word ledger).
//
// A reducer, so every rule here is tested without a clock. The controller
// (room-store) owns the interval, the visibility listener and storage.
//
// Pure: no React, no timers, no storage.
// ---------------------------------------------------------------------------

/**
 * The longest gap one tick may credit. The controller ticks every second; a
 * gap past this means the machine slept or the page was frozen, and that
 * time was not spent writing.
 */
export const MAX_TICK_MS = 5_000;

export interface TimerState {
  running: boolean;
  /** Is the tab visible. Only visible time counts. */
  visible: boolean;
  /** Focus time this session, ms. */
  sessionMs: number;
  /** The local day `dayMs` belongs to, YYYY-MM-DD. */
  day: string;
  /** Focus time today, ms. */
  dayMs: number;
  /** When time was last credited (epoch ms); null while not counting. */
  lastTick: number | null;
}

export type TimerAction =
  | { type: "start"; now: number; day: string }
  | { type: "pause"; now: number; day: string }
  | { type: "tick"; now: number; day: string }
  | { type: "visibility"; visible: boolean; now: number; day: string }
  /** New session: the session total returns to zero; today's stays. */
  | { type: "reset"; now: number; day: string }
  | { type: "hydrate"; sessionMs: number; day: string; dayMs: number };

export function initialTimer(day: string, visible = true): TimerState {
  return { running: false, visible, sessionMs: 0, day, dayMs: 0, lastTick: null };
}

/** Credit the time since the last tick, then stamp `now`. */
function credit(state: TimerState, now: number, day: string): TimerState {
  const counting = state.running && state.visible && state.lastTick !== null;
  const delta = counting ? Math.min(MAX_TICK_MS, Math.max(0, now - (state.lastTick as number))) : 0;
  // Midnight: time credited now belongs to the new day; yesterday's total is
  // already saved under its own key.
  const rolled = day !== state.day;
  return {
    ...state,
    sessionMs: state.sessionMs + delta,
    day,
    dayMs: (rolled ? 0 : state.dayMs) + delta,
    lastTick: state.running && state.visible ? now : null,
  };
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "start": {
      if (state.running) return credit(state, action.now, action.day);
      const next = credit(state, action.now, action.day);
      return { ...next, running: true, lastTick: next.visible ? action.now : null };
    }
    case "pause": {
      if (!state.running) return state;
      const next = credit(state, action.now, action.day);
      return { ...next, running: false, lastTick: null };
    }
    case "tick":
      return state.running ? credit(state, action.now, action.day) : state;
    case "visibility": {
      if (action.visible === state.visible) return state;
      // Going hidden credits up to this moment; coming back starts a fresh
      // stamp so the hidden stretch is never counted.
      const next = credit(state, action.now, action.day);
      return { ...next, visible: action.visible, lastTick: next.running && action.visible ? action.now : null };
    }
    case "reset": {
      const next = credit(state, action.now, action.day);
      return { ...next, sessionMs: 0 };
    }
    case "hydrate":
      return {
        ...state,
        sessionMs: Math.max(0, action.sessionMs),
        day: action.day,
        dayMs: Math.max(0, action.dayMs),
      };
    default:
      return state;
  }
}

/** 0:00 clock: mm:ss under an hour, h:mm:ss past it. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

// ---------------------------------------------------------------------------
// The per-device day log (focus seconds per local day)
// ---------------------------------------------------------------------------

export const FOCUS_LOG_DAYS = 90;

export type FocusLog = Record<string, number>;

/** Stored value -> { day: seconds }, newest FOCUS_LOG_DAYS days only. */
export function sanitizeFocusLog(raw: unknown): FocusLog {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const entries: Array<[string, number]> = [];
  for (const [day, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) entries.push([day, Math.min(86_400, Math.floor(n))]);
  }
  entries.sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0));
  return Object.fromEntries(entries.slice(0, FOCUS_LOG_DAYS));
}

/** The log with `day` set to `seconds` (never lowered by a stale tab). */
export function recordFocus(log: FocusLog, day: string, seconds: number): FocusLog {
  const s = Math.max(Math.floor(seconds), log[day] ?? 0);
  return sanitizeFocusLog({ ...log, [day]: s });
}
