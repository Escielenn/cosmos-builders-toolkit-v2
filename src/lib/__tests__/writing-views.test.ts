import { describe, it, expect } from "vitest";
import {
  buildBinderTree,
  readingOrderDocs,
  docsUnderFolder,
  inReadingOrder,
  rangeBetween,
} from "@/lib/binder-tree";
import {
  buildOutlinerRows,
  outlinerTotals,
  sanitizeColumns,
  toggleColumn,
  truncateText,
  DEFAULT_COLUMNS,
  type OutlinerEntry,
} from "@/lib/outliner";
import { writeSettingsKey, readSettingsKey } from "@/lib/world-settings";

const f = (id: string, parent: string | null, sort: number): OutlinerEntry => ({
  id, parent_id: parent, entry_type: "folder", sort_order: sort, title: id,
});
const d = (
  id: string,
  parent: string | null,
  sort: number,
  content = "",
  metadata: unknown = {},
): OutlinerEntry => ({
  id, parent_id: parent, entry_type: "document", sort_order: sort, title: id, content, metadata,
});

// part1 > ch1 > (s1, s2); part1 > s3; loose at root
const world = (): OutlinerEntry[] => [
  f("part1", null, 0),
  f("ch1", "part1", 0),
  d("s1", "ch1", 0, "<p>one two three</p>", { target: 10, status: "draft" }),
  d("s2", "ch1", 10, "<p>four five</p>", { target: 5 }),
  d("s3", "part1", 10, "<p>six</p>"),
  d("loose", null, 10, "<p>seven eight</p>", { target: 100 }),
];

describe("reading order helpers", () => {
  const tree = buildBinderTree(world());

  it("lists documents depth-first", () => {
    expect(readingOrderDocs(tree).map((e) => e.id)).toEqual(["s1", "s2", "s3", "loose"]);
  });

  it("collects a folder's documents at any depth", () => {
    expect(docsUnderFolder(tree, "part1").map((e) => e.id)).toEqual(["s1", "s2", "s3"]);
    expect(docsUnderFolder(tree, "ch1").map((e) => e.id)).toEqual(["s1", "s2"]);
    expect(docsUnderFolder(tree, "s1")).toEqual([]);
    expect(docsUnderFolder(tree, "missing")).toEqual([]);
  });

  it("orders a pick by reading order, dropping unknown ids", () => {
    expect(inReadingOrder(tree, ["loose", "s1", "gone"]).map((e) => e.id)).toEqual(["s1", "loose"]);
  });

  it("computes shift-click ranges both ways", () => {
    const vis = ["a", "b", "c", "d"];
    expect(rangeBetween(vis, "b", "d")).toEqual(["b", "c", "d"]);
    expect(rangeBetween(vis, "d", "b")).toEqual(["b", "c", "d"]);
    expect(rangeBetween(vis, null, "c")).toEqual(["c"]);
    expect(rangeBetween(vis, "zz", "c")).toEqual(["c"]);
    expect(rangeBetween(vis, "a", "zz")).toEqual([]);
  });
});

describe("outliner rows", () => {
  it("emits reading order with depth and folder aggregates", () => {
    const rows = buildOutlinerRows(buildBinderTree(world()));
    expect(rows.map((r) => r.entry.id)).toEqual(["part1", "ch1", "s1", "s2", "s3", "loose"]);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 2, 1, 0]);
    const part1 = rows[0];
    expect(part1.words).toBe(6);
    expect(part1.target).toBe(15);
    expect(part1.docCount).toBe(3);
    expect(rows[2].meta?.status).toBe("draft");
    expect(rows[0].meta).toBeNull();
  });

  it("hides children of collapsed folders but keeps their totals", () => {
    const rows = buildOutlinerRows(buildBinderTree(world()), new Set(["ch1"]));
    expect(rows.map((r) => r.entry.id)).toEqual(["part1", "ch1", "s3", "loose"]);
    expect(rows[1].words).toBe(5);
  });

  it("totals count documents only", () => {
    expect(outlinerTotals(buildBinderTree(world()))).toEqual({ words: 8, target: 115, docs: 4 });
  });
});

describe("outliner columns", () => {
  it("sanitizes into canonical order and falls back to default", () => {
    expect(sanitizeColumns(["words", "synopsis", "bogus", "words"])).toEqual(["synopsis", "words"]);
    expect(sanitizeColumns("nope")).toEqual(DEFAULT_COLUMNS);
    expect(sanitizeColumns([])).toEqual([]);
  });

  it("toggles a column on and off", () => {
    expect(toggleColumn(["synopsis"], "pov")).toEqual(["synopsis", "pov"]);
    expect(toggleColumn(["synopsis", "pov"], "synopsis")).toEqual(["pov"]);
  });

  it("truncates at a word boundary", () => {
    expect(truncateText("short", 10)).toBe("short");
    expect(truncateText("the quick brown fox jumps", 12)).toBe("the quick…");
  });
});

describe("world settings keys", () => {
  it("merges one key and keeps the rest", () => {
    const next = writeSettingsKey({ writingLabels: [1] }, "writingProject", { words: 5 });
    expect(next).toEqual({ writingLabels: [1], writingProject: { words: 5 } });
    expect(readSettingsKey(next, "writingProject")).toEqual({ words: 5 });
    expect(writeSettingsKey(null, "a", 1)).toEqual({ a: 1 });
    expect(readSettingsKey([], "a")).toBeUndefined();
  });
});
