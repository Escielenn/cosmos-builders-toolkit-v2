import { describe, expect, it } from "vitest";
import { dayDiff, isDayKey, localDay, shiftDay, trailingDays } from "@/lib/local-day";

const DENVER = "America/Denver";

describe("localDay across midnight boundaries", () => {
  it("6 pm in Denver is still today there, though UTC has rolled over", () => {
    // 2026-10-19 00:30 UTC = 2026-10-18 18:30 MDT. The old UTC key reset the goal here.
    const t = new Date("2026-10-19T00:30:00Z");
    expect(t.toISOString().slice(0, 10)).toBe("2026-10-19");
    expect(localDay(t, DENVER)).toBe("2026-10-18");
  });

  it("rolls over at local midnight, not at UTC midnight", () => {
    // 23:59 MDT on the 18th = 05:59 UTC on the 19th.
    expect(localDay(new Date("2026-10-19T05:59:00Z"), DENVER)).toBe("2026-10-18");
    // 00:00 MDT on the 19th = 06:00 UTC.
    expect(localDay(new Date("2026-10-19T06:00:00Z"), DENVER)).toBe("2026-10-19");
  });

  it("follows daylight saving: midnight is 07:00 UTC in winter", () => {
    expect(localDay(new Date("2026-12-15T06:30:00Z"), DENVER)).toBe("2026-12-14");
    expect(localDay(new Date("2026-12-15T07:00:00Z"), DENVER)).toBe("2026-12-15");
  });

  it("handles the DST change night itself (2026-11-01 in Denver)", () => {
    // 01:30 MDT then 01:30 MST: both still Nov 1.
    expect(localDay(new Date("2026-11-01T07:30:00Z"), DENVER)).toBe("2026-11-01");
    expect(localDay(new Date("2026-11-01T08:30:00Z"), DENVER)).toBe("2026-11-01");
    expect(localDay(new Date("2026-11-02T06:59:00Z"), DENVER)).toBe("2026-11-01");
    expect(localDay(new Date("2026-11-02T07:00:00Z"), DENVER)).toBe("2026-11-02");
  });

  it("east of UTC the local day starts before the UTC one", () => {
    // 23:30 UTC on the 18th is already the 19th in Tokyo.
    expect(localDay(new Date("2026-10-18T23:30:00Z"), "Asia/Tokyo")).toBe("2026-10-19");
  });

  it("year boundary", () => {
    expect(localDay(new Date("2027-01-01T03:00:00Z"), DENVER)).toBe("2026-12-31");
    expect(localDay(new Date("2027-01-01T03:00:00Z"), "UTC")).toBe("2027-01-01");
  });

  it("without a zone, uses the runtime's local calendar", () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(localDay(new Date(2026, 0, 6, 0, 0))).toBe("2026-01-06");
  });
});

describe("day arithmetic", () => {
  it("shiftDay crosses month, year and leap day", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftDay("2026-03-08", 1)).toBe("2026-03-09"); // US DST start, no skew
  });

  it("dayDiff is whole calendar days", () => {
    expect(dayDiff("2026-10-18", "2026-10-19")).toBe(1);
    expect(dayDiff("2026-11-01", "2026-11-02")).toBe(1);
    expect(dayDiff("2026-10-19", "2026-10-18")).toBe(-1);
    expect(dayDiff("2026-01-01", "2026-12-31")).toBe(364);
  });

  it("trailingDays ends on today, oldest first", () => {
    expect(trailingDays("2026-10-02", 3)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02"]);
    expect(trailingDays("2026-10-02", 30)).toHaveLength(30);
  });

  it("isDayKey", () => {
    expect(isDayKey("2026-10-18")).toBe(true);
    expect(isDayKey("2026-10-18T00:00")).toBe(false);
    expect(isDayKey(null)).toBe(false);
  });
});
