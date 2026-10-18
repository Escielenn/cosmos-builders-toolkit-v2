import { describe, expect, it } from "vitest";
import { codec, initialFormState } from "@/lib/tool-worksheets/kardashev";
import { expectDefaultsRoundTrip, expectRoundTrip } from "./roundtrip";

describe("K-Scale worksheet codec", () => {
  it("round-trips a saved worksheet unchanged", () => {
    expectRoundTrip(codec, {
      totalPowerWatts: 3.8e26,
      powerLog10: 26.58,
      growthRate: "fast",
      civilizationPreset: "",
      budgetPercentages: { military: 30, industry: 40, research: 30 },
      cascade: { governance: "Council", warfare: "None", economics: "Post-scarcity", biology: "", culture: "Sun cult" },
      storyNotes: { energySources: "Dyson swarm", limitations: "", conflicts: "", dailyLife: "Quiet" },
      generalNotes: "",
      moodboard: [],
    });
  });

  it("fills sections an older sheet lacks from the defaults", () => {
    const state = codec.hydrate({ totalPowerWatts: 1e10, cascade: { governance: "Kings" } }, codec.defaults);
    expect(state.totalPowerWatts).toBe(1e10);
    expect(state.cascade.governance).toBe("Kings");
    expect(state.cascade.warfare).toBe("");
    expect(state.storyNotes).toEqual(initialFormState.storyNotes);
    expect(state.budgetPercentages).toEqual(initialFormState.budgetPercentages);
  });

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));
});
