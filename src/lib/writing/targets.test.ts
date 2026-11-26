import { describe, expect, it } from "vitest";
import {
  DEFAULT_TARGET_EXTRAS,
  deadlinePace,
  meter,
  sanitizeTargetExtras,
  sanitizeWritingDays,
  writingDaysRemaining,
} from "./targets";

// Wednesday 25 November 2026, local.
const WED = new Date(2026, 10, 25, 15, 30);
const WEEKDAYS = [1, 2, 3, 4, 5];
const ALL = [0, 1, 2, 3, 4, 5, 6];

describe("writingDaysRemaining", () => {
  it("counts today and the deadline day", () => {
    expect(writingDaysRemaining("2026-11-25", ALL, WED)).toBe(1);
    expect(writingDaysRemaining("2026-11-26", ALL, WED)).toBe(2);
  });
  it("counts only the chosen weekdays", () => {
    // Wed 25, Thu 26, Fri 27 | Sat 28, Sun 29 | Mon 30
    expect(writingDaysRemaining("2026-11-30", WEEKDAYS, WED)).toBe(4);
    expect(writingDaysRemaining("2026-11-29", WEEKDAYS, WED)).toBe(3);
    expect(writingDaysRemaining("2026-11-29", [0, 6], WED)).toBe(2);
  });
  it("handles whole weeks plus a remainder", () => {
    // 25 Nov to 15 Dec inclusive: 21 days = 3 weeks, 15 weekdays.
    expect(writingDaysRemaining("2026-12-15", WEEKDAYS, WED)).toBe(15);
    expect(writingDaysRemaining("2026-12-15", ALL, WED)).toBe(21);
    // One more day (Wed 16 Dec).
    expect(writingDaysRemaining("2026-12-16", WEEKDAYS, WED)).toBe(16);
  });
  it("is zero for a past or invalid deadline, or no writing days", () => {
    expect(writingDaysRemaining("2026-11-24", ALL, WED)).toBe(0);
    expect(writingDaysRemaining("2026-02-31", ALL, WED)).toBe(0);
    expect(writingDaysRemaining("soon", ALL, WED)).toBe(0);
    expect(writingDaysRemaining("2026-12-15", [], WED)).toBe(0);
  });
  it("does not drift across a daylight-saving change", () => {
    // US clocks go forward on 14 March 2027.
    const before = new Date(2027, 2, 12, 23, 30);
    expect(writingDaysRemaining("2027-03-16", ALL, before)).toBe(5);
  });
});

describe("deadlinePace", () => {
  it("gives words per writing day, rounded up", () => {
    const p = deadlinePace({ words: 80_000, deadline: "2026-12-15" }, 50_000, WEEKDAYS, WED);
    expect(p).toMatchObject({ remaining: 30_000, writingDaysLeft: 15, perWritingDay: 2000, overdue: false, done: false });
    expect(deadlinePace({ words: 1000, deadline: "2026-11-27" }, 0, WEEKDAYS, WED).perWritingDay).toBe(334);
  });
  it("reports done, overdue and no-writing-days apart", () => {
    expect(deadlinePace({ words: 1000, deadline: "2026-12-15" }, 1200, WEEKDAYS, WED)).toMatchObject({
      done: true, perWritingDay: null, overdue: false, progress: 1,
    });
    expect(deadlinePace({ words: 1000, deadline: "2026-11-20" }, 200, WEEKDAYS, WED)).toMatchObject({
      overdue: true, perWritingDay: null, noWritingDays: false,
    });
    // Deadline on Sunday, writer only writes Mondays: the day is ahead but unplanned.
    expect(deadlinePace({ words: 1000, deadline: "2026-11-29" }, 200, [1], WED)).toMatchObject({
      overdue: false, noWritingDays: true, perWritingDay: null, writingDaysLeft: 0,
    });
  });
  it("has no pace without a deadline or a target", () => {
    expect(deadlinePace({ words: 1000, deadline: "" }, 250, WEEKDAYS, WED)).toMatchObject({
      progress: 0.25, writingDaysLeft: null, perWritingDay: null,
    });
    expect(deadlinePace({ words: 0, deadline: "2026-12-15" }, 250, WEEKDAYS, WED)).toMatchObject({
      progress: 0, perWritingDay: null, overdue: false, done: false,
    });
  });
});

describe("sanitizeTargetExtras", () => {
  it("defaults to every day and the stock time goals", () => {
    expect(sanitizeTargetExtras(undefined)).toEqual(DEFAULT_TARGET_EXTRAS);
    expect(sanitizeTargetExtras([])).toEqual(DEFAULT_TARGET_EXTRAS);
  });
  it("keeps valid values and an explicitly empty week", () => {
    expect(sanitizeTargetExtras({ writingDays: [5, 1, 1, 9, "2"], dailyMinutes: "45", sessionMinutes: 0, sessionWords: 750.4 })).toEqual({
      writingDays: [1, 5], dailyMinutes: 45, sessionMinutes: 0, sessionWords: 750,
    });
    expect(sanitizeTargetExtras({ writingDays: [] }).writingDays).toEqual([]);
    expect(sanitizeWritingDays("x")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it("bounds junk", () => {
    expect(sanitizeTargetExtras({ dailyMinutes: -5, sessionMinutes: 99_999, sessionWords: NaN })).toMatchObject({
      dailyMinutes: 30, sessionMinutes: 1440, sessionWords: 0,
    });
  });
});

describe("meter", () => {
  it("is a whole percent, capped, with a met flag", () => {
    expect(meter(250, 1000)).toEqual({ pct: 25, done: false });
    expect(meter(1200, 1000)).toEqual({ pct: 100, done: true });
    expect(meter(5, 0)).toEqual({ pct: 0, done: false });
  });
});
