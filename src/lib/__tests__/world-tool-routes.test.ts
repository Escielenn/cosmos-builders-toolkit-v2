import { describe, expect, it } from "vitest";
import { IN_WORLD_TOOL_IDS, toolHref, worksheetHref } from "../world-tool-routes";
import { WORLD_TOOL_SLUGS } from "@/pages/WorldToolPage";

describe("world-tool-routes", () => {
  it("mirrors the slugs WorldToolPage mounts", () => {
    expect([...IN_WORLD_TOOL_IDS].sort()).toEqual([...WORLD_TOOL_SLUGS].sort());
  });

  it("opens an in-world tool on its subject", () => {
    expect(toolHref("environmental-chain-reaction", "W", { entityId: "E" })).toBe(
      "/worlds/W/tools/environmental-chain-reaction?entityId=E",
    );
    expect(toolHref("spacecraft-designer", "W")).toBe("/worlds/W/tools/spacecraft-designer");
  });

  it("falls back to the standalone route, carrying the world", () => {
    expect(toolHref("rogue", "W")).toBe("/rogue?worldId=W");
    expect(toolHref("planetary-profile", null)).toBe("/tools/planetary-profile");
    expect(toolHref("not-a-tool", "W")).toBeNull();
  });

  it("opens a saved worksheet in its world", () => {
    expect(worksheetHref({ id: "S", world_id: "W", tool_type: "dossier" })).toBe(
      "/worlds/W/tools/dossier?worksheetId=S",
    );
  });
});
