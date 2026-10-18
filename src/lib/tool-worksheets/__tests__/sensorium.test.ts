import { describe, expect, it } from "vitest";
import { codec } from "@/lib/tool-worksheets/sensorium";
import { expectDefaultsRoundTrip, expectRoundTrip, fillLeaves, withMoodboard } from "./roundtrip";

describe("Sensorium worksheet codec", () => {
  it("round-trips a saved worksheet unchanged", () => {
    expectRoundTrip(codec, withMoodboard(fillLeaves(codec.defaults)));
  });

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));

  it("opens an older sheet with the keys it lacks filled from the defaults", () => {
    const keys = Object.keys(codec.defaults);
    const [kept, ...rest] = keys;
    const older = { [kept]: fillLeaves(codec.defaults)[kept as keyof typeof codec.defaults] };
    const state = codec.hydrate(older, codec.defaults);
    expect(state[kept as keyof typeof state]).toEqual(older[kept]);
    for (const k of rest) expect(state[k as keyof typeof state]).toEqual(codec.defaults[k as keyof typeof codec.defaults]);
  });
});
