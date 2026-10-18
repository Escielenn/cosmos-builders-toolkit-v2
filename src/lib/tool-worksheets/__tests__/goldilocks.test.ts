import { describe, it } from "vitest";
import { codec } from "@/lib/tool-worksheets/goldilocks";
import { expectDefaultsRoundTrip, expectRoundTrip } from "./roundtrip";

describe("Goldilocks worksheet codec", () => {
  it("round-trips a saved worksheet unchanged", () => {
    expectRoundTrip(codec, {
      star: { presetId: "custom", spectralType: "K", mass: 0.78, luminosity: 0.34, temperature: 4900, autoLuminosity: false },
      planet: { orbitalDistance: 0.61, name: "Arrakis", greenhouseWarming: 48 },
      storyNotes: {
        starDescription: "<p>An orange sun.</p>",
        planetSetting: "Dunes.",
        habitabilityNarrative: "",
        worldbuildingNotes: "Spice.",
      },
      generalNotes: "notes",
      moodboard: [{ id: "m1", url: "https://example.test/a.png", caption: "dune" }],
    });
  });

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));
});
