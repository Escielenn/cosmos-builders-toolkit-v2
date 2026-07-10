import { describe, it, expect } from "vitest";
import { LAUNCH_DATE, LAUNCH_DATE_STAMP, daysUntilLaunch } from "./launch";

describe("launch date (single source of truth)", () => {
  it("stamp matches the canonical date", () => {
    expect(LAUNCH_DATE_STAMP).toBe("2026.08.11");
    expect(LAUNCH_DATE.getUTCFullYear()).toBe(2026);
  });
  it("counts whole days down and never goes negative", () => {
    const dayBefore = new Date("2026-08-10T09:00:00-07:00");
    expect(daysUntilLaunch(dayBefore)).toBe(1);
    const afterLaunch = new Date("2026-09-01T00:00:00-07:00");
    expect(daysUntilLaunch(afterLaunch)).toBe(0);
    const atLaunch = new Date(LAUNCH_DATE.getTime());
    expect(daysUntilLaunch(atLaunch)).toBe(0);
  });
});
