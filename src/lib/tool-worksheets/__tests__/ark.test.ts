import { describe, expect, it } from "vitest";
import { codec, dirtyKey, titleFor } from "@/lib/tool-worksheets/ark";
import { buildDerivedSnapshot, computeGenShip } from "@/lib/generation-ship/calculations";
import { expectDefaultsRoundTrip, expectRoundTrip } from "./roundtrip";

const d = codec.defaults;
const edited = {
  ...d,
  identity: { ...d.identity, shipName: "Long Patience", originName: "Sol", destinationName: "Tau Ceti", launchYear: 2310 },
  voyage: { ...d.voyage, distanceLy: 11.9, cruiseFractionC: 0.02 },
  population: { ...d.population, founding: 1800 },
  loggedEvents: { "drift-1": "chronicle-abc" },
  provenance: { "voyage.distanceLy": { tool: "time-dilation", worksheetId: "ws-1", worksheetTitle: "Route" } },
  moodboard: [{ id: "m1", url: "https://example.test/a.png", caption: "hull" }],
};

describe("Ark worksheet codec", () => {
  it("round-trips a saved worksheet, derived snapshot included", () => {
    expectRoundTrip(codec, codec.serialize(edited));
  });

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));

  it("writes a derived snapshot computed from the inputs", () => {
    const row = codec.serialize(edited) as Record<string, unknown>;
    expect(row.derived).toEqual(JSON.parse(JSON.stringify(buildDerivedSnapshot(computeGenShip(edited)))));
  });

  it("names a first-saved sheet for its ship", () => {
    expect(titleFor(edited)).toBe("Long Patience");
    expect(titleFor({ ...d, identity: { ...d.identity, shipName: "  " } })).toBe("Generation Ship");
  });

  it("does not count a logged Chronicle link as an unsaved edit", () => {
    expect(dirtyKey({ ...edited, loggedEvents: {} })).toBe(dirtyKey(edited));
    expect(dirtyKey({ ...edited, population: { ...edited.population, founding: 900 } })).not.toBe(dirtyKey(edited));
  });
});
