import { describe, expect, it } from "vitest";
import {
  computeStreaks,
  niceCeiling,
  shapeWordHistory,
  writingBadgeInputs,
} from "@/lib/writing-activity";

const s = (day: string, words: number) => ({ day, words });

describe("computeStreaks", () => {
  it("empty ledger", () => {
    expect(computeStreaks([], "2026-10-18")).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("counts back from today", () => {
    const rows = [s("2026-10-16", 10), s("2026-10-17", 5), s("2026-10-18", 1)];
    expect(computeStreaks(rows, "2026-10-18")).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("an unwritten today does not break the streak", () => {
    const rows = [s("2026-10-16", 10), s("2026-10-17", 5)];
    expect(computeStreaks(rows, "2026-10-18").currentStreak).toBe(2);
  });

  it("a missed yesterday ends it", () => {
    const rows = [s("2026-10-15", 10), s("2026-10-16", 5)];
    expect(computeStreaks(rows, "2026-10-18")).toEqual({ currentStreak: 0, longestStreak: 2 });
  });

  it("zero-word days do not count, and runs cross month ends", () => {
    const rows = [s("2026-09-29", 3), s("2026-09-30", 3), s("2026-10-01", 3), s("2026-10-02", 0), s("2026-10-03", 9)];
    expect(computeStreaks(rows, "2026-10-03")).toEqual({ currentStreak: 1, longestStreak: 3 });
  });

  it("ignores malformed day keys", () => {
    expect(computeStreaks([s("garbage", 100)], "2026-10-18").longestStreak).toBe(0);
  });
});

describe("shapeWordHistory", () => {
  it("one point per day, zero-filled, oldest first, ending today", () => {
    const h = shapeWordHistory([s("2026-10-16", 200), s("2026-10-18", 50)], "2026-10-18", 4);
    expect(h.points).toEqual([
      { day: "2026-10-15", words: 0 },
      { day: "2026-10-16", words: 200 },
      { day: "2026-10-17", words: 0 },
      { day: "2026-10-18", words: 50 },
    ]);
    expect(h).toMatchObject({ total: 250, max: 200, activeDays: 2 });
  });

  it("drops rows outside the window", () => {
    const h = shapeWordHistory([s("2026-01-01", 999), s("2026-10-18", 1)], "2026-10-18", 30);
    expect(h.points).toHaveLength(30);
    expect(h.total).toBe(1);
  });

  it("90-day window crosses months", () => {
    const h = shapeWordHistory([], "2026-10-18", 90);
    expect(h.points[0].day).toBe("2026-07-21");
    expect(h.points[89].day).toBe("2026-10-18");
  });

  it("sums duplicate days and clamps junk to 0", () => {
    const h = shapeWordHistory(
      [s("2026-10-18", 10), s("2026-10-18", 5), s("2026-10-17", -4), s("2026-10-16", NaN)],
      "2026-10-18",
      3,
    );
    expect(h.points.map((p) => p.words)).toEqual([0, 0, 15]);
  });
});

describe("niceCeiling", () => {
  it.each([
    [0, 100],
    [1, 1],
    [7, 10],
    [120, 200],
    [480, 500],
    [500, 500],
    [2_300, 5_000],
    [9_100, 10_000],
  ])("%d -> %d", (max, ceil) => {
    expect(niceCeiling(max)).toBe(ceil);
  });
});

describe("writingBadgeInputs", () => {
  it("counts Studio documents, excludes the Workshop world from 'with a world'", () => {
    const docs = [
      { id: "a", world_id: "w1", tags: ["x", "y"] },
      { id: "b", world_id: "w1", tags: null },
      { id: "c", world_id: "ws", tags: [] },
    ];
    const out = writingBadgeInputs(docs, [s("2026-10-17", 300), s("2026-10-18", 700)], "2026-10-18", new Set(["ws"]));
    expect(out.writingEntryCount).toBe(3);
    expect(out.writingEntriesWithWorld).toBe(2);
    expect(out.writingEntriesByWorld.get("w1")).toBe(2);
    expect(out.writingEntriesByWorld.has("ws")).toBe(false);
    expect(out.writingEntryTags).toEqual([["x", "y"], [], []]);
    expect(out.totalWords).toBe(1000);
    expect(out.currentStreak).toBe(2);
  });
});
