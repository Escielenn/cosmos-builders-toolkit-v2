import { describe, expect, it } from "vitest";
import {
  FREE_TOOL_COUNT,
  INSTRUMENT_IDS,
  PRO_INSTRUMENT_IDS,
  PRO_NON_SIMULATOR_COUNT,
  PRO_TOOL_COUNT,
  SIMULATOR_COUNT,
  SIMULATOR_TOOL_IDS,
  TOTAL_TOOL_COUNT,
} from "@/lib/tools-config";
import { CASCADE_LAYER_LABEL, getToolLayerLabel } from "@/lib/tool-accents";

describe("catalog counts (1.6 finding 7)", () => {
  it("the Workshop is not an instrument", () => {
    expect(INSTRUMENT_IDS).not.toContain("writing-workshop");
    expect(PRO_INSTRUMENT_IDS).not.toContain("writing-workshop");
  });

  it("free + Pro = total, and simulators are a subset of Pro", () => {
    expect(FREE_TOOL_COUNT + PRO_TOOL_COUNT).toBe(TOTAL_TOOL_COUNT);
    expect(PRO_NON_SIMULATOR_COUNT + SIMULATOR_COUNT).toBe(PRO_TOOL_COUNT);
    for (const id of SIMULATOR_TOOL_IDS) expect(PRO_INSTRUMENT_IDS).toContain(id);
  });

  it("no id is counted twice", () => {
    expect(new Set(INSTRUMENT_IDS).size).toBe(INSTRUMENT_IDS.length);
  });
});

describe("tool eyebrow layer names (1.6 finding 13)", () => {
  it("never leaks a colour token name", () => {
    for (const label of Object.values(CASCADE_LAYER_LABEL)) {
      expect(label).not.toMatch(/amber|azure|emerald|violet|stellar|teal|magenta|crimson/i);
    }
    expect(getToolLayerLabel("star-system-builder")).toBe("Physics");
    expect(getToolLayerLabel("planetary-profile")).toBe("Environment");
    expect(getToolLayerLabel("xenomythology-framework-builder")).toBe("Mythology");
  });
});
