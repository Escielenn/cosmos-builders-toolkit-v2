import { describe, it, expect } from "vitest";
import { STAR_TYPES } from "../starTypes";

describe("Stellar Cartographer star types (C2)", () => {
  it("gives O and B stars no habitable worlds: they die before life can start", () => {
    expect(STAR_TYPES.O.habitable).toBe(0);
    expect(STAR_TYPES.B.habitable).toBe(0);
  });
});
