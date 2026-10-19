import { describe, it, expect } from "vitest";
import { COMPILE_FORMATS } from "@/lib/manuscript/compile";
import { FORMAT_LABELS } from "@/lib/manuscript/export";
import {
  COMPILE_FORMAT_NAMES,
  FREE_PLAN_GROUPS,
  PRO_PLAN_ITEMS,
  PRO_UNLOCK_SUMMARY,
} from "@/lib/plan-features";
import { SIMULATOR_COUNT, TOTAL_TOOL_COUNT, PRO_TOOL_COUNT } from "@/lib/tools-config";

const all = () => [...FREE_PLAN_GROUPS.flatMap((g) => g.items), ...PRO_PLAN_ITEMS, ...PRO_UNLOCK_SUMMARY];

describe("plan features", () => {
  it("names exactly the compile formats that exist, in order", () => {
    expect(COMPILE_FORMAT_NAMES).toHaveLength(COMPILE_FORMATS.length);
    COMPILE_FORMATS.forEach((f, i) => {
      const name = COMPILE_FORMAT_NAMES[i].toLowerCase();
      expect(name.startsWith(FORMAT_LABELS[f].label.toLowerCase())).toBe(true);
    });
  });

  it("never claims unlimited worlds (no world limit is enforced)", () => {
    for (const line of all()) expect(line.toLowerCase()).not.toContain("unlimited");
  });

  it("derives counts from the catalog", () => {
    expect(PRO_PLAN_ITEMS[0]).toContain(String(TOTAL_TOOL_COUNT));
    expect(PRO_PLAN_ITEMS[0]).toContain(String(SIMULATOR_COUNT));
    expect(PRO_UNLOCK_SUMMARY[0]).toContain(String(PRO_TOOL_COUNT));
  });

  it("carries no exclamation points", () => {
    for (const line of all()) expect(line).not.toContain("!");
  });
});
