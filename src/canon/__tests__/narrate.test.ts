import { describe, it, expect } from "vitest";
import { narrativeBlocks, factRecord } from "@/canon/narrate";
import { manifestSuggestion } from "@/components/tools/CascadeSuggestionToast";
import { MANIFESTS } from "@/canon/manifests";
import { LAYER_ACCENT, toolLayer } from "@/canon/tool-layers";
import { getToolAccent } from "@/lib/tool-accents";
import { LAYER_TOOL_MAP, getLayerForTool } from "@/services/world-data";

const fact = (predicate: string, value: number | string, confidence: "canon" | "proposed" | "projected" = "canon") => ({
  predicate,
  valueText: String(value),
  value: typeof value === "number" ? ({ kind: "scalar", value } as const) : ({ kind: "text", value } as const),
  confidence,
  provenance: { kind: "tool", label: "", href: null, ref: {} },
});

describe("F-02 manifest narratives reach the page", () => {
  it("turns canon facts into each tool's sentences, in cascade order", () => {
    const blocks = narrativeBlocks([fact("planet.surface_gravity", 1.4), fact("star.temp_effective", 3200), fact("vessel.crew_size", 40)]);
    expect(blocks.map((b) => b.layer)).toEqual(["physics", "physics", "culture"]);
    expect(blocks.find((b) => b.toolId === "atlas")!.lines[0]).toMatch(/Stairs are a hazard/);
  });
  it("narrates the decided value, not a projection", () => {
    const { values } = factRecord([fact("vessel.crew_size", 900, "projected"), fact("vessel.crew_size", 8, "canon")]);
    expect(values["vessel.crew_size"]).toBe(8);
  });
  it("flags a block whose fact is stale", () => {
    const stale = { ...fact("planet.surface_gravity", 1.4), provenance: { kind: "tool", label: "", href: null, ref: { stale: { since: "x" } } } };
    expect(narrativeBlocks([stale]).find((b) => b.toolId === "atlas")?.stale).toBe(true);
  });
  it("suggests the next tool by what it reads (cascade toast)", () => {
    expect(manifestSuggestion("star-system-builder")?.toolType).toBe("habitable-zone-calculator");
    expect(manifestSuggestion("star-system-builder")?.prompt).toMatch(/stellar luminosity/);
    expect(manifestSuggestion("not-a-tool")).toBeNull();
  });
});

describe("F-07 one cascade-layer scheme", () => {
  it("every manifest's accent is its layer's colour", () => {
    for (const m of MANIFESTS) expect(m.accent, m.id).toBe(LAYER_ACCENT[m.layer]);
  });
  it("accents, sidebar and manifests agree for every wired tool", () => {
    for (const m of MANIFESTS) {
      expect(getToolAccent(m.tool), m.id).toBe(m.accent);
      expect(toolLayer(m.tool)).toBe(m.layer);
    }
  });
  it("the sidebar has Physics, files Paradox and Gravitas under Culture, and lists the Ark and K-Scale", () => {
    expect(LAYER_TOOL_MAP.physics).toContain("star-system-builder");
    expect(getLayerForTool("time-dilation")).toBe("culture");
    expect(getLayerForTool("gravitas")).toBe("culture");
    expect(getLayerForTool("drake-equation-calculator")).toBe("physics");
    expect(Object.values(LAYER_TOOL_MAP).flat()).toEqual(expect.arrayContaining(["generation-ship", "kardashev-scale"]));
    expect(LAYER_TOOL_MAP.technology).toEqual([]);
  });
});

describe("F-09 copied links notice a revised source", async () => {
  const { isLinkStale } = await import("@/components/tools/WorksheetLinkSelector");
  it("is stale only when the source saved after the copy", () => {
    expect(isLinkStale("2026-11-01T00:00:00Z", "2026-11-02T00:00:00Z")).toBe(true);
    expect(isLinkStale("2026-11-02T00:00:00Z", "2026-11-01T00:00:00Z")).toBe(false);
    expect(isLinkStale("2026-11-01T00:00:00.000Z", "2026-11-01T00:00:00.500Z")).toBe(false);
    expect(isLinkStale(undefined, "2026-11-01T00:00:00Z")).toBe(false);
  });
});
