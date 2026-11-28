import { describe, it, expect } from "vitest";
import { validateManifest } from "@/canon/manifest";
import { manifest } from "../manifest";
import { TIDELOCK_RULES } from "@/sims/flags/tidelock";

describe("tidelock manifest", () => {
  it("passes the /sf-audit manifest rules", () => {
    expect(validateManifest(manifest)).toEqual([]);
  });
  it("lists one situation per flag rule", () => {
    expect(manifest.situations.length).toBe(TIDELOCK_RULES.length);
  });
  it("reaches the page", () => {
    expect(manifest.studio.narrative!({ "planet.terminator_band_width": 1820, "orbit.tidally_locked": "Locked" })).toEqual([
      "THE STAR NEVER MOVES IN THIS SKY.",
      "LIQUID WATER IN A BAND 1820 KM WIDE.",
    ]);
  });
});
