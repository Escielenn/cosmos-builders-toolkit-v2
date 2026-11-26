import { describe, expect, it } from "vitest";
import { groupInstrumentsByLayer } from "../instrument-layers";
import { FREE_TOOL_IDS, INSTRUMENT_IDS, TOTAL_TOOL_COUNT } from "@/lib/tools-config";

describe("groupInstrumentsByLayer", () => {
  it("lists every catalog tool exactly once", () => {
    const ids = groupInstrumentsByLayer().flatMap((g) => g.tools.map((t) => t.id));
    expect(ids).toHaveLength(TOTAL_TOOL_COUNT);
    expect(new Set(ids)).toEqual(new Set(INSTRUMENT_IDS));
  });

  it("marks exactly the free tools as free", () => {
    const free = groupInstrumentsByLayer().flatMap((g) => g.tools.filter((t) => t.free).map((t) => t.id));
    expect(new Set(free)).toEqual(new Set(FREE_TOOL_IDS));
  });
});
