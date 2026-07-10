import { describe, it, expect } from "vitest";
import { printPalette } from "./palette";
import { tokens } from "@/styles/tokens";

const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("print palette (derived from tokens)", () => {
  it("produces valid hex for every brand slot", () => {
    for (const v of [printPalette.primary, printPalette.primaryLight, printPalette.accent]) {
      expect(v).toMatch(HEX);
    }
  });
  it("darkens the accent for legibility on white paper", () => {
    // primary (print) must be darker than the on-screen accent
    expect(luminance(printPalette.primary)).toBeLessThan(luminance(tokens.accent.base));
    // primaryLight must be near-white (a tint behind dark text)
    expect(luminance(printPalette.primaryLight)).toBeGreaterThan(220);
  });
});
