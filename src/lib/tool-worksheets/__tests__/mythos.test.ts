import { describe, it } from "vitest";
import { codec } from "@/lib/tool-worksheets/mythos";
import { expectDefaultsRoundTrip, expectRoundTrip, fillLeaves, withMoodboard } from "./roundtrip";

describe("Mythos worksheet codec", () => {
  it("round-trips a saved worksheet unchanged", () => {
    expectRoundTrip(codec, withMoodboard(fillLeaves(codec.defaults)));
  });

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));
});
