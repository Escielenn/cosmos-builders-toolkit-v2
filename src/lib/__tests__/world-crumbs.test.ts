import { describe, expect, it } from "vitest";
import { worldCrumbs } from "@/lib/world-crumbs";

describe("worldCrumbs", () => {
  const world = { id: "w1", name: "Kepler Reach" };

  it("ends on the space when nothing follows it", () => {
    expect(worldCrumbs(world, "Codex")).toEqual([
      { label: "Kepler Reach", to: "/worlds/w1" },
      { label: "Codex" },
    ]);
  });

  it("links the space when an item follows it", () => {
    expect(worldCrumbs(world, "Codex", "Ashgrave")).toEqual([
      { label: "Kepler Reach", to: "/worlds/w1" },
      { label: "Codex", to: "/worlds/w1/codex" },
      { label: "Ashgrave" },
    ]);
  });

  it("maps Instruments to /tools and drops empty items", () => {
    expect(worldCrumbs(world, "Instruments", null, "", false, { label: "Genesis" })).toEqual([
      { label: "Kepler Reach", to: "/worlds/w1" },
      { label: "Instruments", to: "/worlds/w1/tools" },
      { label: "Genesis" },
    ]);
  });

  it("falls back to 'World' while the name is loading", () => {
    expect(worldCrumbs({ id: "w1", name: undefined }, "Bridge")[0]).toEqual({ label: "World", to: "/worlds/w1" });
  });
});
