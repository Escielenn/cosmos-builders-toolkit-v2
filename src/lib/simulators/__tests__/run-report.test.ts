import { describe, it, expect } from "vitest";
import {
  buildSimRunReport,
  flattenRunRecord,
  formatRunValue,
  humanizeKey,
  simRunReportToMarkdown,
  MAX_ROWS,
} from "../run-report";

const NOW = new Date("2026-10-18T12:00:00Z");

const tidelock = {
  name: "Ashgrave",
  parameters: { starType: "M4V", orbitalDistance: 0.0712, showClouds: true },
  results: { starType: "M4V", tSSP: 391.4, tASP: 61.2, tTerm: 288, habPct: 18.5 },
};

describe("humanizeKey", () => {
  it("splits camelCase, snake_case and acronym runs", () => {
    expect(humanizeKey("orbitalDistance")).toBe("Orbital Distance");
    expect(humanizeKey("orbital_distance")).toBe("Orbital Distance");
    expect(humanizeKey("tSSP")).toBe("T SSP");
    expect(humanizeKey("habPct")).toBe("Hab Pct");
  });
});

describe("formatRunValue", () => {
  it("formats numbers the way a writer would type them", () => {
    expect(formatRunValue(1234)).toBe("1,234");
    expect(formatRunValue(391.4)).toBe("391");
    expect(formatRunValue(1.5)).toBe("1.5");
    expect(formatRunValue(0.0712)).toBe("0.0712");
    expect(formatRunValue(0.00001234)).toBe("1.23e-5");
  });

  it("drops what has no readable form", () => {
    expect(formatRunValue(null)).toBeNull();
    expect(formatRunValue(undefined)).toBeNull();
    expect(formatRunValue(Number.NaN)).toBeNull();
    expect(formatRunValue("   ")).toBeNull();
    expect(formatRunValue([])).toBeNull();
    expect(formatRunValue({ a: 1 })).toBeNull();
  });

  it("summarises arrays", () => {
    expect(formatRunValue(["a", "b"])).toBe("a, b");
    expect(formatRunValue([{ x: 1 }, { x: 2 }])).toBe("2 items");
    expect(formatRunValue(true)).toBe("Yes");
  });
});

describe("flattenRunRecord", () => {
  it("flattens one level and skips snapshot blobs", () => {
    const rows = flattenRunRecord({ star: { mass: 0.4, name: "Vega" }, sf2System: { huge: true }, planets: [{}, {}, {}] });
    expect(rows).toEqual([
      { label: "Star Mass", value: "0.4" },
      { label: "Star Name", value: "Vega" },
      { label: "Planets", value: "3 items" },
    ]);
  });

  it("caps long records with a pointer to the JSON export", () => {
    const big = Object.fromEntries(Array.from({ length: MAX_ROWS + 5 }, (_, i) => [`k${i}`, i]));
    const rows = flattenRunRecord(big);
    expect(rows).toHaveLength(MAX_ROWS + 1);
    expect(rows[MAX_ROWS]).toEqual({ label: "Further values", value: "5 more in the JSON export" });
  });
});

describe("buildSimRunReport", () => {
  it("collects inputs, outputs, publishable facts and notes", () => {
    const r = buildSimRunReport({
      simulatorType: "tidelock",
      payload: tidelock,
      worldName: "Kethra",
      narrativeNotes: { terminatorLife: "Moss cities along the ring.", empty: "  " },
      now: NOW,
    });
    expect(r.simulatorName).toBe("Tidelock");
    expect(r.runName).toBe("Ashgrave");
    expect(r.generatedAt).toBe("2026-10-18T12:00:00.000Z");
    expect(r.inputs).toContainEqual({ label: "Orbital Distance", value: "0.0712" });
    expect(r.outputs).toContainEqual({ label: "T Term", value: "288" });
    // Same extractor Publish uses: terminator is a fact for canon.
    expect(r.facts.some((f) => f.key === "locked.terminator")).toBe(true);
    expect(r.notes).toEqual([{ label: "Terminator Life", value: "Moss cities along the ring." }]);
  });

  it("survives a missing payload", () => {
    const r = buildSimRunReport({ simulatorType: "solaris", payload: null, now: NOW });
    expect(r.inputs).toEqual([]);
    expect(r.outputs).toEqual([]);
    expect(r.facts).toEqual([]);
  });
});

describe("simRunReportToMarkdown", () => {
  it("renders title, provenance and one table per part", () => {
    const md = simRunReportToMarkdown(
      buildSimRunReport({ simulatorType: "tidelock", payload: tidelock, worldName: "Kethra", now: NOW }),
    );
    expect(md.startsWith("# Tidelock run: Ashgrave\n")).toBe(true);
    expect(md).toContain("_World: Kethra · Generated 2026-10-18 · StellarForge.tools_");
    expect(md).toContain("## Inputs\n\n| Parameter | Value |");
    expect(md).toContain("| Orbital Distance | 0.0712 |");
    expect(md).toContain("## Facts for canon");
    expect(md.endsWith("\n")).toBe(true);
  });

  it("escapes table pipes and says so when a part is empty", () => {
    const md = simRunReportToMarkdown(
      buildSimRunReport({ simulatorType: "rogue", payload: { parameters: { label: "a|b" }, results: {} }, now: NOW }),
    );
    expect(md).toContain("| Label | a\\|b |");
    expect(md).toContain("_No outputs recorded._");
  });
});
