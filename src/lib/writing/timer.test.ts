import { describe, expect, it } from "vitest";
import {
  FOCUS_LOG_DAYS,
  MAX_TICK_MS,
  formatClock,
  initialTimer,
  recordFocus,
  sanitizeFocusLog,
  timerReducer,
  type TimerAction,
  type TimerState,
} from "./timer";

const DAY = "2026-11-25";
const run = (state: TimerState, ...actions: TimerAction[]) => actions.reduce(timerReducer, state);

describe("timerReducer", () => {
  it("counts nothing until started", () => {
    const s = run(initialTimer(DAY), { type: "tick", now: 5000, day: DAY });
    expect(s).toMatchObject({ running: false, sessionMs: 0, dayMs: 0 });
  });
  it("counts session and day together while running and visible", () => {
    const s = run(
      initialTimer(DAY),
      { type: "start", now: 1000, day: DAY },
      { type: "tick", now: 2000, day: DAY },
      { type: "tick", now: 3000, day: DAY },
    );
    expect(s).toMatchObject({ running: true, sessionMs: 2000, dayMs: 2000, lastTick: 3000 });
  });
  it("credits up to the moment of pausing, then stops", () => {
    const s = run(
      initialTimer(DAY),
      { type: "start", now: 1000, day: DAY },
      { type: "pause", now: 1500, day: DAY },
      { type: "tick", now: 9000, day: DAY },
    );
    expect(s).toMatchObject({ running: false, sessionMs: 500, lastTick: null });
  });
  it("does not count a hidden tab", () => {
    const s = run(
      initialTimer(DAY),
      { type: "start", now: 0, day: DAY },
      { type: "tick", now: 1000, day: DAY },
      { type: "visibility", visible: false, now: 1400, day: DAY },
      { type: "tick", now: 2400, day: DAY },
      { type: "tick", now: 3400, day: DAY },
      { type: "visibility", visible: true, now: 60_000, day: DAY },
      { type: "tick", now: 61_000, day: DAY },
    );
    expect(s.sessionMs).toBe(1400 + 1000);
    expect(s.running).toBe(true);
  });
  it("starting while hidden waits for the tab", () => {
    const s = run(
      initialTimer(DAY, false),
      { type: "start", now: 0, day: DAY },
      { type: "tick", now: 1000, day: DAY },
      { type: "visibility", visible: true, now: 5000, day: DAY },
      { type: "tick", now: 6000, day: DAY },
    );
    expect(s.sessionMs).toBe(1000);
  });
  it("caps a gap: a sleeping machine wrote nothing", () => {
    const s = run(
      initialTimer(DAY),
      { type: "start", now: 0, day: DAY },
      { type: "tick", now: 3_600_000, day: DAY },
    );
    expect(s.sessionMs).toBe(MAX_TICK_MS);
  });
  it("never counts backwards if the clock is set back", () => {
    const s = run(initialTimer(DAY), { type: "start", now: 10_000, day: DAY }, { type: "tick", now: 4000, day: DAY });
    expect(s.sessionMs).toBe(0);
  });
  it("new session zeroes the session, keeps the day and keeps running", () => {
    const s = run(
      initialTimer(DAY),
      { type: "start", now: 0, day: DAY },
      { type: "tick", now: 1000, day: DAY },
      { type: "reset", now: 1500, day: DAY },
      { type: "tick", now: 2500, day: DAY },
    );
    expect(s).toMatchObject({ running: true, sessionMs: 1000, dayMs: 2500 });
  });
  it("rolls the day total at midnight and keeps the session", () => {
    const s = run(
      initialTimer(DAY),
      { type: "start", now: 0, day: DAY },
      { type: "tick", now: 1000, day: DAY },
      { type: "tick", now: 2000, day: "2026-11-26" },
    );
    expect(s).toMatchObject({ day: "2026-11-26", dayMs: 1000, sessionMs: 2000 });
  });
  it("hydrates stored totals without starting", () => {
    const s = timerReducer(initialTimer(DAY), { type: "hydrate", sessionMs: 90_000, day: DAY, dayMs: -4 });
    expect(s).toMatchObject({ running: false, sessionMs: 90_000, dayMs: 0 });
  });
  it("ignores a second start and a pause while stopped", () => {
    const started = run(initialTimer(DAY), { type: "start", now: 0, day: DAY }, { type: "start", now: 800, day: DAY });
    expect(started.sessionMs).toBe(800);
    const idle = initialTimer(DAY);
    expect(timerReducer(idle, { type: "pause", now: 1, day: DAY })).toBe(idle);
  });
});

describe("formatClock", () => {
  it("is mm:ss, then h:mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65_999)).toBe("01:05");
    expect(formatClock(59 * 60_000 + 59_000)).toBe("59:59");
    expect(formatClock(3_600_000 + 61_000)).toBe("1:01:01");
    expect(formatClock(-5)).toBe("00:00");
  });
});

describe("focus log", () => {
  it("keeps valid days only, newest first, capped", () => {
    expect(sanitizeFocusLog({ "2026-11-25": 120.9, "2026-11-24": "60", nope: 5, "2026-11-23": -1 })).toEqual({
      "2026-11-25": 120, "2026-11-24": 60,
    });
    const many = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`2026-01-01`.replace("01-01", `${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`) + "", 60]));
    expect(Object.keys(sanitizeFocusLog(many)).length).toBeLessThanOrEqual(FOCUS_LOG_DAYS);
    expect(sanitizeFocusLog(null)).toEqual({});
  });
  it("never lowers a day another tab wrote", () => {
    expect(recordFocus({ [DAY]: 300 }, DAY, 120)).toEqual({ [DAY]: 300 });
    expect(recordFocus({ [DAY]: 300 }, DAY, 420.7)).toEqual({ [DAY]: 420 });
  });
});
