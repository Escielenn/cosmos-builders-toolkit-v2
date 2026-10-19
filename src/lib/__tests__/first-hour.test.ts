import { describe, expect, it } from "vitest";
import {
  FIRST_INSTRUMENT_IDS,
  PRO_NEXT_STEPS,
  firstHourProgress,
  instrumentLinks,
  pickSubject,
} from "../onboarding/first-hour";
import { FREE_TOOL_IDS, isProTool } from "../tools-config";

const survey = [
  { id: "s", name: "Sol B", entity_type: "star" },
  { id: "p", name: "Kellis Prime", entity_type: "planet" },
  { id: "v", name: "Verrid", entity_type: "species" },
];

describe("first-hour pathway", () => {
  it("offers only free instruments as the first instrument", () => {
    expect([...FIRST_INSTRUMENT_IDS].sort()).toEqual([...FREE_TOOL_IDS].sort());
    for (const id of FIRST_INSTRUMENT_IDS) expect(isProTool(id)).toBe(false);
  });

  it("marks every optional next step as Pro", () => {
    const ids = PRO_NEXT_STEPS.flatMap((s) => [...s.toolIds]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(isProTool(id)).toBe(true);
  });

  it("opens Cascade on the surveyed planet, inside the world", () => {
    const [cascade] = instrumentLinks(["environmental-chain-reaction"], "W", survey);
    expect(cascade.subject?.id).toBe("p");
    expect(cascade.href).toBe("/worlds/W/tools/environmental-chain-reaction?entityId=p");
    expect(cascade.isPro).toBe(false);
  });

  it("picks by preference order, and opens without a subject rather than on the wrong kind", () => {
    expect(pickSubject("spacecraft-designer", survey)?.id).toBe("v");
    expect(pickSubject("spacecraft-designer", [survey[0], survey[1]])).toBeNull();
    expect(pickSubject("unknown-tool", survey)).toBeNull();
  });

  it("has no link without a world", () => {
    const links = instrumentLinks(FIRST_INSTRUMENT_IDS, null, survey);
    expect(links.every((l) => l.href === null && l.subject === null)).toBe(true);
  });

  it("reads progress from records", () => {
    expect(firstHourProgress({ worldId: null, worksheets: [] })).toEqual({ world: false, instrument: false });
    expect(
      firstHourProgress({
        worldId: "W",
        worksheets: [
          { world_id: "OTHER", tool_type: "spacecraft-designer" },
          { world_id: "W", tool_type: "planetary-profile" },
        ],
      }),
    ).toEqual({ world: true, instrument: false });
    expect(
      firstHourProgress({ worldId: "W", worksheets: [{ world_id: "W", tool_type: "spacecraft-designer" }] }),
    ).toEqual({ world: true, instrument: true });
  });
});
