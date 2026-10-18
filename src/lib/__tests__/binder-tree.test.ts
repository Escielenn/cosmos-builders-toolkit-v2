import { describe, it, expect } from "vitest";
import {
  buildBinderTree,
  flattenVisible,
  flattenFolders,
  descendantIds,
  canMoveInto,
  planDrop,
  planMoveInto,
  planShift,
  moveTargets,
  dropPositionFor,
  orderSiblings,
  type BinderEntry,
} from "@/lib/binder-tree";

const f = (id: string, parent: string | null, sort: number, title = id): BinderEntry => ({
  id, parent_id: parent, entry_type: "folder", sort_order: sort, title,
});
const d = (id: string, parent: string | null, sort: number, title = id): BinderEntry => ({
  id, parent_id: parent, entry_type: "document", sort_order: sort, title,
});

// Part1 > Ch1 > (s1, s2); Part1 > s3; root doc loose
const world = (): BinderEntry[] => [
  f("part1", null, 0),
  f("ch1", "part1", 0),
  d("s1", "ch1", 0),
  d("s2", "ch1", 10),
  d("s3", "part1", 10),
  d("loose", null, 10),
];

const ids = (rows: { node: { entry: { id: string } } }[]) => rows.map((r) => r.node.entry.id);

describe("buildBinderTree", () => {
  it("nests folders at any depth, ordered by sort_order", () => {
    const tree = buildBinderTree(world());
    expect(ids(flattenVisible(tree, new Set()))).toEqual(["part1", "ch1", "s1", "s2", "s3", "loose"]);
    expect(flattenVisible(tree, new Set()).map((r) => r.depth)).toEqual([0, 1, 2, 2, 1, 0]);
  });

  it("hides the contents of collapsed folders", () => {
    const tree = buildBinderTree(world());
    expect(ids(flattenVisible(tree, new Set(["ch1"])))).toEqual(["part1", "ch1", "s3", "loose"]);
  });

  it("sends orphans, doc-parents and cycles to the root instead of losing them", () => {
    const entries: BinderEntry[] = [
      d("orphan", "missing", 0),
      d("child-of-doc", "orphan", 10),
      f("a", "b", 20),
      f("b", "a", 30),
    ];
    const visible = ids(flattenVisible(buildBinderTree(entries), new Set()));
    expect(visible.sort()).toEqual(["a", "b", "child-of-doc", "orphan"]);
  });

  it("keeps the legacy folders-first layout when kinds share sort orders", () => {
    const legacy = [d("doc0", null, 0), f("fold0", null, 0), d("doc10", null, 10), f("fold10", null, 10)];
    expect(orderSiblings(legacy).map((e) => e.id)).toEqual(["fold0", "fold10", "doc0", "doc10"]);
    // After a move rewrites unique values, plain sort_order wins.
    const moved = [d("doc0", null, 0), f("fold0", null, 10), d("doc10", null, 20), f("fold10", null, 30)];
    expect(orderSiblings(moved).map((e) => e.id)).toEqual(["doc0", "fold0", "doc10", "fold10"]);
  });

  it("lists folders with their title paths", () => {
    const out = flattenFolders(buildBinderTree(world()));
    expect(out.map((o) => o.path.join(" / "))).toEqual(["part1", "part1 / ch1"]);
  });
});

describe("descendants and legality", () => {
  it("collects descendants at every depth", () => {
    expect([...descendantIds(world(), "part1")].sort()).toEqual(["ch1", "s1", "s2", "s3"]);
  });

  it("forbids moving a folder into itself or its descendants", () => {
    expect(canMoveInto(world(), "part1", "part1")).toBe(false);
    expect(canMoveInto(world(), "part1", "ch1")).toBe(false);
    expect(canMoveInto(world(), "ch1", "part1")).toBe(true);
    expect(canMoveInto(world(), "s1", null)).toBe(true);
  });

  it("forbids moving into a document", () => {
    expect(canMoveInto(world(), "s1", "loose")).toBe(false);
  });
});

describe("planDrop", () => {
  it("reorders within one folder", () => {
    expect(planDrop(world(), "s2", "s1", "before")).toEqual({
      id: "s2", parentId: "ch1", orderedIds: ["s2", "s1"],
    });
  });

  it("moves a document across levels", () => {
    expect(planDrop(world(), "loose", "s1", "after")).toEqual({
      id: "loose", parentId: "ch1", orderedIds: ["s1", "loose", "s2"],
    });
  });

  it("drops into a folder (appended)", () => {
    expect(planDrop(world(), "loose", "ch1", "inside")).toEqual({
      id: "loose", parentId: "ch1", orderedIds: ["s1", "s2", "loose"],
    });
  });

  it("moves a folder out to the root", () => {
    expect(planDrop(world(), "ch1", "loose", "after")).toEqual({
      id: "ch1", parentId: null, orderedIds: ["part1", "loose", "ch1"],
    });
  });

  it("refuses a folder dropped into its own descendant", () => {
    expect(planDrop(world(), "part1", "ch1", "inside")).toBeNull();
    expect(planDrop(world(), "part1", "s1", "before")).toBeNull();
  });

  it("returns null for no-ops", () => {
    expect(planDrop(world(), "s1", "s1", "before")).toBeNull();
    expect(planDrop(world(), "s1", "s2", "before")).toBeNull();
    expect(planDrop(world(), "s1", "ch1", "inside")).toBeNull();
  });
});

describe("keyboard alternatives", () => {
  it("moves into a folder from the menu", () => {
    expect(planMoveInto(world(), "loose", "part1")).toEqual({
      id: "loose", parentId: "part1", orderedIds: ["ch1", "s3", "loose"],
    });
    expect(planMoveInto(world(), "part1", "ch1")).toBeNull();
  });

  it("shifts up and down within siblings", () => {
    expect(planShift(world(), "s3", -1)).toEqual({ id: "s3", parentId: "part1", orderedIds: ["s3", "ch1"] });
    expect(planShift(world(), "s3", 1)).toBeNull();
  });

  it("offers nested targets and disables illegal ones", () => {
    const targets = moveTargets(world(), "part1");
    expect(targets).toEqual([
      { id: "part1", title: "part1", depth: 0, disabled: true },
      { id: "ch1", title: "ch1", depth: 1, disabled: true },
    ]);
    const forS1 = moveTargets(world(), "s1");
    expect(forS1.find((t) => t.id === "ch1")?.disabled).toBe(true); // current parent
    expect(forS1.find((t) => t.id === "part1")?.disabled).toBe(false);
  });
});

describe("dropPositionFor", () => {
  it("uses thirds for folders and halves for documents", () => {
    expect(dropPositionFor(true, 2, 0, 40)).toBe("before");
    expect(dropPositionFor(true, 20, 0, 40)).toBe("inside");
    expect(dropPositionFor(true, 38, 0, 40)).toBe("after");
    expect(dropPositionFor(false, 10, 0, 40)).toBe("before");
    expect(dropPositionFor(false, 30, 0, 40)).toBe("after");
  });
});
