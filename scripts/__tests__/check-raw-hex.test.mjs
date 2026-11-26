import { describe, it, expect } from "vitest";
import { countHex, isAllowedHome, scan } from "../check-raw-hex.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("check-raw-hex", () => {
  it("counts 3, 4, 6 and 8 digit colour literals", () => {
    expect(countHex('color: "#15C17B"')).toBe(1);
    expect(countHex("fill='#fff' stroke='#000F'")).toBe(2);
    expect(countHex("background: #0A0E17CC;")).toBe(1);
    expect(countHex('["#FFA500", "#2ECC71"]')).toBe(2);
  });

  it("ignores entities, anchors, ids and longer words", () => {
    expect(countHex("<span>&#8734;</span>")).toBe(0);
    expect(countHex('href="#section-results"')).toBe(0);
    expect(countHex('stroke="url(#veloArc)"')).toBe(0);
    expect(countHex("issue #1234567")).toBe(0);
    expect(countHex('href="#features"')).toBe(0);
  });

  it("allows only the generated files, the token mirror, palettes, the print palette and tests", () => {
    expect(isAllowedHome("src/styles/tokens.css")).toBe(true);
    expect(isAllowedHome("src/styles/themes.css")).toBe(true);
    expect(isAllowedHome("src/styles/tokens.ts")).toBe(true);
    expect(isAllowedHome("src/lib/palettes/spectral.ts")).toBe(true);
    expect(isAllowedHome("src/lib/pdf/palette.ts")).toBe(true);
    expect(isAllowedHome("src/lib/__tests__/x.test.ts")).toBe(true);
    // a file merely NAMED like an allowed home is not one
    expect(isAllowedHome("src/components/tools/palette.ts")).toBe(false);
    expect(isAllowedHome("src/lib/writing/tokens.ts")).toBe(false);
    expect(isAllowedHome("src/pages/Auth.tsx")).toBe(false);
    expect(isAllowedHome("src/index.css")).toBe(false);
  });

  it("the repo matches its recorded baseline", () => {
    const baseline = JSON.parse(readFileSync(join(process.cwd(), "scripts", "raw-hex-baseline.json"), "utf8"));
    const counts = scan();
    for (const [file, n] of Object.entries(counts)) {
      expect(n, file).toBeLessThanOrEqual(baseline.files[file] ?? 0);
    }
  });
});
