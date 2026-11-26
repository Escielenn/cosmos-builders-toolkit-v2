import { describe, expect, it } from "vitest";
import { buildCover, hashString } from "../CoverArt";

describe("CoverArt", () => {
  it("is deterministic per slug", () => {
    expect(buildCover("drake-equation")).toEqual(buildCover("drake-equation"));
    expect(hashString("drake-equation")).toBe(hashString("drake-equation"));
  });

  it("differs between slugs", () => {
    expect(buildCover("drake-equation")).not.toEqual(buildCover("tidally-locked-worlds"));
  });

  it("keeps the world inside the frame", () => {
    for (const slug of ["a", "b", "drake-equation", "the-one-big-lie", "x".repeat(80)]) {
      const { planet } = buildCover(slug);
      expect(planet.x - planet.r).toBeGreaterThan(0);
      expect(planet.x + planet.r).toBeLessThan(1200);
      expect(planet.y - planet.r).toBeGreaterThanOrEqual(0);
      expect(planet.y + planet.r).toBeLessThanOrEqual(675);
    }
  });
});
