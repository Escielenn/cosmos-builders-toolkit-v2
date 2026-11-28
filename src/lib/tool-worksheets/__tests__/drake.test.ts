import { describe, it } from "vitest";
import { codec } from "@/lib/tool-worksheets/drake";
import { expectDefaultsRoundTrip, expectRoundTrip, fillLeaves, withMoodboard } from "./roundtrip";

describe("Drake worksheet codec", () => {
  it("round-trips a saved worksheet unchanged", () => {
    // 1.9 F-08: rows carry a derived snapshot, so round-trip a serialized row.
    expectRoundTrip(codec, codec.serialize(withMoodboard(fillLeaves(codec.defaults))));
  });

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));
});
