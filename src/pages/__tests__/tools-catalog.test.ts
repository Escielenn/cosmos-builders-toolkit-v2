import { describe, expect, it } from "vitest";
import { CATALOG_TOOL_IDS, COMING_SOON_ITEMS } from "../Tools";
import { TOOL_ROUTES } from "@/lib/tools-config";

describe("/tools catalog", () => {
  it("lists every routed tool (the Workshop excepted: it is the prompts page)", () => {
    const missing = Object.keys(TOOL_ROUTES).filter(
      (id) => id !== "writing-workshop" && !CATALOG_TOOL_IDS.includes(id),
    );
    expect(missing).toEqual([]);
  });

  it("never lists as coming soon something that already ships", () => {
    const shipped = /generation ship|planet \/ moon cartographer|solar system cartographer|warp travel|year calculator/i;
    for (const item of COMING_SOON_ITEMS) expect(item.title).not.toMatch(shipped);
  });
});
