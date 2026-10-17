import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { readSensoriumInsights, type SensoriumInsights } from "@/lib/sensorium/push-to-worksheet";

const insights = (speciesName: string): SensoriumInsights => ({
  speciesName,
  selectedModalities: [],
  metabolicBudget: { total: 0.4, overBudget: false },
  perceptionGaps: { speciesPerceives: [], speciesBlind: [] },
  dominantSense: "",
  syncedAt: "2026-10-01T00:00:00.000Z",
});

describe("readSensoriumInsights", () => {
  it("reads insights from the Sensorium record", () => {
    expect(readSensoriumInsights({ sensoriumInsights: insights("Own") })?.speciesName).toBe("Own");
  });

  it("prefers the Sensorium record over the legacy linked-worksheet copy", () => {
    const got = readSensoriumInsights(
      { sensoriumInsights: insights("Own") },
      { sensoriumInsights: insights("Legacy") }
    );
    expect(got?.speciesName).toBe("Own");
  });

  it("falls back to the legacy key on a linked worksheet", () => {
    const got = readSensoriumInsights({}, { sensoriumInsights: insights("Legacy") });
    expect(got?.speciesName).toBe("Legacy");
  });

  it("returns null when neither location has insights", () => {
    expect(readSensoriumInsights(null, null)).toBeNull();
    expect(readSensoriumInsights({ sensoriumInsights: "junk" })).toBeNull();
  });
});
