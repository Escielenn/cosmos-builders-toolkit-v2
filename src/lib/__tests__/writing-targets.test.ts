import { describe, it, expect } from "vitest";
import {
  daysRemaining,
  projectPace,
  readProjectTarget,
  sanitizeProjectTarget,
  sessionProgress,
  writeProjectTarget,
  localDay,
} from "@/lib/writing-targets";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 15, 30);

describe("sanitizeProjectTarget", () => {
  it("accepts numbers and valid dates, rejects the rest", () => {
    expect(sanitizeProjectTarget({ words: "80000", deadline: "2026-12-31" })).toEqual({ words: 80000, deadline: "2026-12-31" });
    expect(sanitizeProjectTarget({ words: -5, deadline: "2026-02-30" })).toEqual({ words: 0, deadline: "" });
    expect(sanitizeProjectTarget(null)).toEqual({ words: 0, deadline: "" });
    expect(sanitizeProjectTarget({ words: 1e12 }).words).toBe(10_000_000);
  });

  it("round-trips through worlds.settings", () => {
    const s = writeProjectTarget({ other: 1 }, { words: 1000, deadline: "2027-01-01" });
    expect(s.other).toBe(1);
    expect(readProjectTarget(s)).toEqual({ words: 1000, deadline: "2027-01-01" });
  });
});

describe("daysRemaining", () => {
  it("counts today and the deadline day", () => {
    expect(daysRemaining("2026-10-17", day(2026, 10, 17))).toBe(1);
    expect(daysRemaining("2026-10-20", day(2026, 10, 17))).toBe(4);
    expect(daysRemaining("2026-10-16", day(2026, 10, 17))).toBe(0);
    expect(daysRemaining("nonsense", day(2026, 10, 17))).toBe(0);
  });

  it("crosses a month boundary", () => {
    expect(daysRemaining("2026-11-01", day(2026, 10, 31))).toBe(2);
  });
});

describe("projectPace", () => {
  it("computes words per day needed", () => {
    const p = projectPace({ words: 10_000, deadline: "2026-10-20" }, 6_000, day(2026, 10, 17));
    expect(p.remaining).toBe(4_000);
    expect(p.daysLeft).toBe(4);
    expect(p.perDay).toBe(1_000);
    expect(p.progress).toBeCloseTo(0.6);
    expect(p.overdue).toBe(false);
  });

  it("rounds per-day up so the pace lands on time", () => {
    expect(projectPace({ words: 100, deadline: "2026-10-19" }, 0, day(2026, 10, 17)).perDay).toBe(34);
  });

  it("reports overdue and done", () => {
    expect(projectPace({ words: 100, deadline: "2026-10-01" }, 10, day(2026, 10, 17)).overdue).toBe(true);
    const done = projectPace({ words: 100, deadline: "2026-10-01" }, 150, day(2026, 10, 17));
    expect(done.done).toBe(true);
    expect(done.overdue).toBe(false);
    expect(done.perDay).toBeNull();
    expect(done.progress).toBe(1);
  });

  it("has no pace without a deadline", () => {
    const p = projectPace({ words: 100, deadline: "" }, 50);
    expect(p.daysLeft).toBeNull();
    expect(p.perDay).toBeNull();
  });
});

describe("helpers", () => {
  it("formats the local day and session progress", () => {
    expect(localDay(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(sessionProgress(250, 500)).toBe(0.5);
    expect(sessionProgress(900, 500)).toBe(1);
    expect(sessionProgress(10, 0)).toBe(0);
  });
});
