// ---------------------------------------------------------------------------
// The SPACING / FONT / WIDTH controls in the Studio.
//
// These three did nothing for months: Write.tsx set `lineHeight` and
// `fontFamily` as inline styles on a WRAPPER, and
// `.sf-writing-serif .ProseMirror` set both properties directly, so the
// descendant's own declaration always beat the inherited value. Measured in
// Chrome before the fix: the wrapper said "DM Sans"/2, the prose rendered
// Lora at 32.04px, whatever the writer picked.
//
// The cascade half of the fix lives in src/index.css and is verified in a
// browser. This locks the half that is pure logic.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  MEASURE_LABELS,
  WRITING_FONTS,
  WRITING_MEASURES,
  writingSurfaceStyle,
} from "../writing-surface-style";
import type {
  LineSpacing,
  WritingFont,
  WritingMeasure,
} from "@/hooks/use-writing-preferences";

const base = {
  lineSpacing: "1.5" as LineSpacing,
  writingFont: "Lora" as WritingFont,
  writingMeasure: "default" as WritingMeasure,
};

describe("writingSurfaceStyle", () => {
  it("emits the three custom properties the stylesheet reads", () => {
    const style = writingSurfaceStyle(base);
    expect(Object.keys(style).sort()).toEqual([
      "--sf-writing-font",
      "--sf-writing-leading",
      "--sf-writing-measure",
    ]);
  });

  it("leaves the default exactly where it was — no document reflows on upgrade", () => {
    // 18px × 1.78 = 32.04px, which is what `.sf-writing-serif .ProseMirror`
    // hardcoded before the fix. Measured in Chrome to confirm.
    const style = writingSurfaceStyle(base);
    expect(style["--sf-writing-leading"]).toBe("1.78");
    expect(style["--sf-writing-measure"]).toBe("68ch");
  });

  it("gives each spacing setting a distinct leading", () => {
    const leadings = (["1", "1.5", "2"] as LineSpacing[]).map(
      (lineSpacing) =>
        writingSurfaceStyle({ ...base, lineSpacing })["--sf-writing-leading"],
    );
    expect(new Set(leadings).size).toBe(3);
    // and they increase
    const nums = leadings.map(Number);
    expect(nums[0]).toBeLessThan(nums[1]);
    expect(nums[1]).toBeLessThan(nums[2]);
  });

  it("gives each font a distinct stack that names the chosen family first", () => {
    const seen = new Set<string>();
    for (const writingFont of WRITING_FONTS) {
      const stack = writingSurfaceStyle({ ...base, writingFont })["--sf-writing-font"];
      expect(stack.replace(/['"]/g, "")).toMatch(
        new RegExp(`^${writingFont.replace(/ /g, "\\s")}`, "i"),
      );
      seen.add(stack);
    }
    expect(seen.size).toBe(WRITING_FONTS.length);
  });

  it("ends every font stack in a generic family, so no writer loses their text", () => {
    for (const writingFont of WRITING_FONTS) {
      const stack = writingSurfaceStyle({ ...base, writingFont })["--sf-writing-font"];
      expect(stack).toMatch(/(serif|sans-serif|monospace)$/);
    }
  });

  it("gives each width a distinct column, widening in order", () => {
    const widths = WRITING_MEASURES.map(
      (writingMeasure) =>
        writingSurfaceStyle({ ...base, writingMeasure })["--sf-writing-measure"],
    );
    expect(new Set(widths).size).toBe(WRITING_MEASURES.length);
    expect(widths).toEqual(["58ch", "68ch", "84ch", "100%"]);
  });

  it("falls back to the default rather than emitting undefined", () => {
    const style = writingSurfaceStyle({
      lineSpacing: "bogus" as LineSpacing,
      writingFont: "Comic Sans" as WritingFont,
      writingMeasure: "enormous" as WritingMeasure,
    });
    expect(style["--sf-writing-leading"]).toBe("1.78");
    expect(style["--sf-writing-measure"]).toBe("68ch");
    expect(style["--sf-writing-font"]).toContain("Lora");
    for (const value of Object.values(style)) {
      expect(value).not.toContain("undefined");
    }
  });

  it("labels every width, so no control renders a raw key", () => {
    for (const m of WRITING_MEASURES) {
      expect(MEASURE_LABELS[m]).toBeTruthy();
      expect(MEASURE_LABELS[m]).not.toBe(m);
    }
  });
});
