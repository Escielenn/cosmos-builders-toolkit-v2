import { describe, it, expect } from "vitest";
import { validateManifest } from "@/canon/manifest";
import { manifest } from "../manifest";
import { EXOFORGE_RULES } from "@/sims/flags/exoforge";

describe("exoforge manifest", () => {
  it("passes the /sf-audit manifest rules", () => {
    expect(validateManifest(manifest)).toEqual([]);
  });
  it("lists one situation per flag rule", () => {
    expect(manifest.situations.length).toBe(EXOFORGE_RULES.length);
  });
  it("reaches the page", () => {
    expect(manifest.studio.narrative!({ "planet.surface_type": "Super-Earth", "planet.temp_mean": 288 })).toEqual([
      "SUPER-EARTH.",
      "SURFACE 288 K (15 °C).",
    ]);
  });
});
