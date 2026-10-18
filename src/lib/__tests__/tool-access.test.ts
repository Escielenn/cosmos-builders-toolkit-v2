import { describe, expect, it } from "vitest";
import {
  FREE_TOOL_IDS,
  PRO_TOOL_IDS,
  SIMULATOR_TOOL_IDS,
  getToolAccess,
} from "../tools-config";
import { WORLD_TOOL_SLUGS } from "@/pages/WorldToolPage";

describe("getToolAccess", () => {
  it("leaves the listed free tools free", () => {
    for (const id of FREE_TOOL_IDS) expect(getToolAccess(id)).toBe("free");
  });

  it("gates every listed Pro tool, simulators included", () => {
    for (const id of PRO_TOOL_IDS) expect(getToolAccess(id)).toBe("pro");
    expect(getToolAccess("exosky")).toBe("pro");
    expect(getToolAccess("solaris")).toBe("pro");
    for (const id of SIMULATOR_TOOL_IDS) expect(getToolAccess(id)).toBe("pro");
  });

  it("fails closed for an unlisted tool id", () => {
    expect(getToolAccess("some-new-tool")).toBe("pro");
    expect(getToolAccess("")).toBe("pro");
  });
});

describe("in-world tool routes", () => {
  it("every /worlds/:id/tools/:slug is classified in tools-config", () => {
    const known = new Set([...FREE_TOOL_IDS, ...PRO_TOOL_IDS]);
    const unclassified = WORLD_TOOL_SLUGS.filter((slug) => !known.has(slug));
    expect(unclassified).toEqual([]);
  });

  it("the in-world free set is exactly the catalog free set", () => {
    const freeInWorld = WORLD_TOOL_SLUGS.filter((slug) => getToolAccess(slug) === "free").sort();
    expect(freeInWorld).toEqual([...FREE_TOOL_IDS].sort());
  });
});
