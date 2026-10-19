import { describe, expect, it } from "vitest";
import { PALETTE_LIMITS, shapePaletteGroups } from "../command-palette";

const worlds = [
  { id: "A", name: "Kellis" },
  { id: "B", name: "Tidewater" },
];

describe("shapePaletteGroups", () => {
  it("routes documents to the Studio and Codex entries to their Codex page", () => {
    const g = shapePaletteGroups({
      worlds,
      docs: [{ id: "d1", world_id: "A", title: "Chapter One", updated_at: "" }],
      entries: [{ id: "e1", world_id: "B", title: "The Spires", entry_type: "star_system", updated_at: "" }],
      worksheets: [],
    });
    expect(g.documents[0]).toMatchObject({ label: "Chapter One", detail: "Kellis", href: "/write/d1" });
    expect(g.codex[0]).toMatchObject({
      label: "The Spires",
      detail: "star system · Tidewater",
      href: "/worlds/B/codex/e1",
    });
    expect(g.worlds.map((w) => w.href)).toEqual(["/worlds/A", "/worlds/B"]);
  });

  it("opens a worksheet in its world's instrument route when it has one", () => {
    const g = shapePaletteGroups({
      worlds,
      docs: [],
      entries: [],
      worksheets: [
        { id: "w1", world_id: "A", tool_type: "planetary-profile", title: "Kellis Prime", updated_at: "" },
        { id: "w2", world_id: null, tool_type: "planetary-profile", title: "Loose", updated_at: "" },
        { id: "w3", world_id: "A", tool_type: "exosky", title: "Sky", updated_at: "" },
      ],
    });
    expect(g.worksheets.map((w) => w.href)).toEqual([
      "/worlds/A/tools/planetary-profile?worksheetId=w1",
      "/tools/planetary-profile?worksheetId=w2",
      // Simulators are not mounted in-world; they open standalone with the world.
      "/tools/exosky?worldId=A&worksheetId=w3",
    ]);
  });

  it("drops documents and entries outside the listed worlds", () => {
    const g = shapePaletteGroups({
      worlds,
      docs: [{ id: "d1", world_id: "Z", title: "Elsewhere", updated_at: "" }],
      entries: [{ id: "e1", world_id: "Z", title: "Elsewhere", entry_type: "planet", updated_at: "" }],
      worksheets: [],
    });
    expect(g.documents).toEqual([]);
    expect(g.codex).toEqual([]);
  });

  it("gives every item a unique cmdk value, untitled rows included", () => {
    const g = shapePaletteGroups({
      worlds,
      docs: [
        { id: "d1", world_id: "A", title: null, updated_at: "" },
        { id: "d2", world_id: "A", title: "  ", updated_at: "" },
        { id: "d3", world_id: "A", title: "Untitled", updated_at: "" },
      ],
      entries: [],
      worksheets: [],
    });
    const values = g.documents.map((d) => d.value);
    expect(new Set(values).size).toBe(values.length);
    expect(g.documents.every((d) => d.label === "Untitled")).toBe(true);
  });

  it("caps each group", () => {
    const docs = Array.from({ length: PALETTE_LIMITS.documents + 20 }, (_, i) => ({
      id: `d${i}`,
      world_id: "A",
      title: `Doc ${i}`,
      updated_at: "",
    }));
    const g = shapePaletteGroups({ worlds, docs, entries: [], worksheets: [] });
    expect(g.documents).toHaveLength(PALETTE_LIMITS.documents);
  });
});
