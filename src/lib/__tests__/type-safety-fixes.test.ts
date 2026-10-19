/**
 * Regression tests for the bugs the tsc-to-zero pass surfaced.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { isJsonObject, rpcArray, rpcObject, RpcShapeError, toJson } from "@/lib/rpc-json";
import { buildSensoriumInsights } from "@/lib/sensorium/push-to-worksheet";
import { calculatePerceptionGaps } from "@/lib/sensorium/calculations";
import { DEFAULT_FORM_STATE, HUMAN_SENSES, MODALITIES } from "@/lib/sensorium/data";
import { SIMULATOR_NARRATIVE_CONFIGS } from "@/lib/simulator-narrative-questions";
import { getCascadeProgress, getDownstreamSuggestions, getToolLayer } from "@/lib/cascade-guidance";

describe("rpc-json", () => {
  it("isJsonObject accepts plain objects only", () => {
    expect(isJsonObject({ a: 1 })).toBe(true);
    expect(isJsonObject([])).toBe(false);
    expect(isJsonObject(null)).toBe(false);
    expect(isJsonObject("x")).toBe(false);
  });

  it("rpcObject passes objects through and rejects other shapes", () => {
    const row = { total_users: 3 };
    expect(rpcObject<{ total_users: number }>(row)).toBe(row);
    expect(() => rpcObject([1])).toThrow(RpcShapeError);
    expect(() => rpcObject(null)).toThrow(RpcShapeError);
  });

  it("rpcArray reads null as empty and rejects non-arrays", () => {
    expect(rpcArray(null)).toEqual([]);
    expect(rpcArray(undefined)).toEqual([]);
    const rows = [{ id: "a" }];
    expect(rpcArray<{ id: string }>(rows)).toBe(rows);
    expect(() => rpcArray({ id: "a" })).toThrow(RpcShapeError);
  });

  it("toJson matches what JSON.stringify would send", () => {
    const at = new Date("2026-10-18T00:00:00.000Z");
    expect(toJson({ a: 1, b: undefined, at, list: [1, "x", null] })).toEqual({
      a: 1,
      at: "2026-10-18T00:00:00.000Z",
      list: [1, "x", null],
    });
    expect(toJson(undefined)).toBeNull();
    expect(toJson("s")).toBe("s");
  });
});

describe("buildSensoriumInsights perception gaps", () => {
  it("pushes modality names, not undefined", () => {
    const nonHuman = MODALITIES.find((m) => !HUMAN_SENSES.includes(m.id));
    expect(nonHuman).toBeDefined();
    const selection = [nonHuman!.id];
    const insights = buildSensoriumInsights({ ...DEFAULT_FORM_STATE, finalSelection: selection });
    const gaps = calculatePerceptionGaps(selection);
    expect(insights.perceptionGaps.speciesPerceives).toEqual(gaps.speciesPerceives);
    expect(insights.perceptionGaps.speciesPerceives).toContain(nonHuman!.name);
    expect(insights.perceptionGaps.speciesBlind.length).toBeGreaterThan(0);
    for (const n of [...insights.perceptionGaps.speciesPerceives, ...insights.perceptionGaps.speciesBlind]) {
      expect(typeof n).toBe("string");
    }
  });
});

describe("simulator narrative questions", () => {
  it("every question carries a layer colour token", () => {
    for (const config of Object.values(SIMULATOR_NARRATIVE_CONFIGS)) {
      for (const q of config.questions) {
        expect(q.layerColor).toMatch(/^var\(--sf-[a-z]+-text\)$/);
      }
    }
  });
});

describe("cascade guidance layers", () => {
  it("maps tools to their guidance layer", () => {
    expect(getToolLayer("star-system-builder")).toBe("stars_and_systems");
    expect(getToolLayer("sensorium")).toBe("life");
    expect(getToolLayer("not-a-tool")).toBeNull();
    expect(getDownstreamSuggestions("planetary-profile")[0]?.toolType).toBe("evolutionary-biology");
  });

  it("reports progress in cascade order", () => {
    const layers = getCascadeProgress(["sensorium"]).map((l) => l.layer);
    expect(layers).toEqual(["stars_and_systems", "worlds", "life", "civilizations", "mythology", "narrative"]);
    expect(getCascadeProgress(["sensorium"]).find((l) => l.layer === "life")?.status).toBe("partial");
  });
});
