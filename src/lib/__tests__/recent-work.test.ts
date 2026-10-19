import { describe, expect, it } from "vitest";
import {
  continueTargets,
  latestDocByWorld,
  mergeActivity,
  worksheetTitle,
  type RecentDoc,
} from "../recent-work";

const doc = (id: string, world_id: string, updated_at: string, title: string | null = id): RecentDoc => ({
  id,
  world_id,
  title,
  updated_at,
});

const world = (id: string, updated_at: string) => ({ id, name: id.toUpperCase(), icon: "globe", updated_at });

describe("latestDocByWorld", () => {
  it("keeps the newest document per world regardless of input order", () => {
    const m = latestDocByWorld([
      doc("a1", "A", "2026-10-01T00:00:00Z"),
      doc("b1", "B", "2026-10-05T00:00:00Z"),
      doc("a2", "A", "2026-10-03T00:00:00Z"),
    ]);
    expect(m.get("A")?.id).toBe("a2");
    expect(m.get("B")?.id).toBe("b1");
  });

  it("keeps the first row on a tie", () => {
    const m = latestDocByWorld([
      doc("first", "A", "2026-10-01T00:00:00Z"),
      doc("second", "A", "2026-10-01T00:00:00Z"),
    ]);
    expect(m.get("A")?.id).toBe("first");
  });
});

describe("continueTargets", () => {
  it("ranks a world by its latest prose, not only its own updated_at", () => {
    const worlds = [world("A", "2026-10-10T00:00:00Z"), world("B", "2026-09-01T00:00:00Z")];
    const docs = [doc("b1", "B", "2026-10-15T00:00:00Z"), doc("a1", "A", "2026-10-02T00:00:00Z")];
    const out = continueTargets(worlds, docs);
    expect(out.map((t) => t.world.id)).toEqual(["B", "A"]);
    expect(out[0].doc?.id).toBe("b1");
    expect(out[0].lastTouched).toBe("2026-10-15T00:00:00Z");
    expect(out[1].lastTouched).toBe("2026-10-10T00:00:00Z");
  });

  it("pairs a world with no documents with null and respects the limit", () => {
    const worlds = [world("A", "2026-10-03T00:00:00Z"), world("B", "2026-10-02T00:00:00Z"), world("C", "2026-10-01T00:00:00Z")];
    const out = continueTargets(worlds, [], 2);
    expect(out).toHaveLength(2);
    expect(out.every((t) => t.doc === null)).toBe(true);
    expect(continueTargets(worlds, [], 0)).toEqual([]);
  });
});

describe("mergeActivity", () => {
  const names = new Map([["A", "Kellis"]]);

  it("merges kinds newest first and links each where it lives", () => {
    const items = mergeActivity(
      {
        docs: [doc("d1", "A", "2026-10-03T00:00:00Z", "Chapter One")],
        entries: [{ id: "e1", world_id: "A", title: "Kellis Prime", entry_type: "planet", updated_at: "2026-10-04T00:00:00Z" }],
        worksheets: [
          { id: "w1", world_id: "A", tool_type: "environmental-chain-reaction", title: null, updated_at: "2026-10-02T00:00:00Z" },
        ],
      },
      names,
    );
    expect(items.map((i) => i.key)).toEqual(["codex:e1", "document:d1", "worksheet:w1"]);
    expect(items[0].href).toBe("/worlds/A/codex/e1");
    expect(items[0].label).toBe("PLANET");
    expect(items[1].href).toBe("/write/d1");
    expect(items[2].href).toBe("/worlds/A/tools/environmental-chain-reaction?worksheetId=w1");
    expect(items[2].worldName).toBe("Kellis");
  });

  it("drops rows in worlds the home page does not list", () => {
    const items = mergeActivity(
      {
        docs: [doc("d1", "ARCHIVED", "2026-10-03T00:00:00Z")],
        entries: [],
        worksheets: [{ id: "w1", world_id: null, tool_type: "dossier", title: "x", updated_at: "2026-10-01T00:00:00Z" }],
      },
      names,
    );
    expect(items).toEqual([]);
  });

  it("caps the feed", () => {
    const docs = Array.from({ length: 20 }, (_, i) => doc(`d${i}`, "A", `2026-10-${String(i + 1).padStart(2, "0")}T00:00:00Z`));
    const items = mergeActivity({ docs, entries: [], worksheets: [] }, names, 5);
    expect(items).toHaveLength(5);
    expect(items[0].key).toBe("document:d19");
  });
});

describe("worksheetTitle", () => {
  it("prefers a Phylo species name, then the title, then the tool name", () => {
    const base = { id: "w", world_id: "A", tool_type: "evolutionary-biology", updated_at: "" };
    expect(worksheetTitle({ ...base, title: "T", data: { speciesName: "Verrid" } })).toBe("Verrid");
    expect(worksheetTitle({ ...base, title: "T", data: {} })).toBe("T");
    expect(worksheetTitle({ ...base, title: null })).toMatch(/Phylo/);
  });
});
