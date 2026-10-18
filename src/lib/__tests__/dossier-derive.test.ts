import { describe, it, expect } from "vitest";
import {
  G0,
  convertAge,
  feltWeightRatio,
  fmt,
  gravityFromMassRadius,
  narrateFeltWeight,
  narrateNativeGravity,
  parseGravityG,
  parseLeadingNumber,
  parseOrbitalPeriodDays,
  weightUnderGravity,
} from "@/lib/dossier/derive";

describe("parseLeadingNumber", () => {
  it("reads the first number in free text", () => {
    expect(parseLeadingNumber("1.4g")).toBe(1.4);
    expect(parseLeadingNumber("about 1,200 kg")).toBe(1200);
    expect(parseLeadingNumber(42)).toBe(42);
  });
  it("refuses text with no number and non-finite input", () => {
    expect(parseLeadingNumber("heavy")).toBeNull();
    expect(parseLeadingNumber(Number.NaN)).toBeNull();
    expect(parseLeadingNumber(undefined)).toBeNull();
  });
});

describe("parseGravityG", () => {
  it("reads g in the forms writers type into Genesis", () => {
    expect(parseGravityG("1.4")).toBe(1.4);
    expect(parseGravityG("1.4g")).toBe(1.4);
    expect(parseGravityG("0.8 Earth gravities")).toBe(0.8);
  });
  it("converts m/s² to g", () => {
    expect(parseGravityG("9.80665 m/s²")).toBeCloseTo(1, 6);
    expect(parseGravityG("19.6 m/s2")).toBeCloseTo(19.6 / G0, 6);
  });
  it("refuses zero and negative gravity", () => {
    expect(parseGravityG("0")).toBeNull();
    expect(parseGravityG("-1 g")).toBeNull();
  });
});

describe("gravityFromMassRadius", () => {
  it("is M / R² in Earth units", () => {
    expect(gravityFromMassRadius(1, 1)).toBe(1);
    expect(gravityFromMassRadius("4 Earth masses", "2 Earth radii")).toBe(1);
    expect(gravityFromMassRadius(2, 1)).toBe(2);
  });
  it("needs both values", () => {
    expect(gravityFromMassRadius("", 1)).toBeNull();
    expect(gravityFromMassRadius(1, 0)).toBeNull();
  });
});

describe("parseOrbitalPeriodDays", () => {
  it("reads days, years, hours and weeks", () => {
    expect(parseOrbitalPeriodDays("347 days")).toBe(347);
    expect(parseOrbitalPeriodDays("4.2 years")).toBeCloseTo(4.2 * 365.25, 6);
    expect(parseOrbitalPeriodDays("2 yr")).toBeCloseTo(730.5, 6);
    expect(parseOrbitalPeriodDays("36 hours")).toBe(1.5);
    expect(parseOrbitalPeriodDays("3 weeks")).toBe(21);
  });
  it("reads a bare number as days", () => {
    expect(parseOrbitalPeriodDays("11")).toBe(11);
  });
  it("refuses blank and non-positive input", () => {
    expect(parseOrbitalPeriodDays("")).toBeNull();
    expect(parseOrbitalPeriodDays("0 days")).toBeNull();
  });
});

describe("weightUnderGravity", () => {
  it("gives newtons and the Earth-scale reading", () => {
    const w = weightUnderGravity("70", 1.5);
    expect(w?.earthScaleKg).toBeCloseTo(105, 6);
    expect(w?.newtons).toBeCloseTo(70 * 1.5 * G0, 6);
  });
  it("is null without a mass or a gravity", () => {
    expect(weightUnderGravity("", 1)).toBeNull();
    expect(weightUnderGravity("70", null)).toBeNull();
    expect(weightUnderGravity("70", 0)).toBeNull();
  });
});

describe("feltWeightRatio", () => {
  it("is relative to the body's home gravity, not Earth's", () => {
    // Raised at 0.4 g, Earth is 2.5× home.
    expect(feltWeightRatio(0.4, 1)).toBeCloseTo(2.5, 6);
    expect(feltWeightRatio(1, 1)).toBe(1);
  });
  it("is null when either side is unknown", () => {
    expect(feltWeightRatio(null, 1)).toBeNull();
    expect(feltWeightRatio(1, null)).toBeNull();
  });
});

describe("convertAge", () => {
  it("converts standard years to local years on a short-year world", () => {
    // Local year = half a standard year → twice as many local years.
    expect(convertAge(30, "standard", 365.25 / 2)).toBeCloseTo(60, 6);
  });
  it("converts local years back to standard years", () => {
    expect(convertAge("60", "local", 365.25 / 2)).toBeCloseTo(30, 6);
  });
  it("round-trips", () => {
    const local = convertAge(41, "standard", 347) as number;
    expect(convertAge(local, "local", 347)).toBeCloseTo(41, 6);
  });
  it("is null without a year length", () => {
    expect(convertAge(30, "standard", null)).toBeNull();
    expect(convertAge("", "standard", 300)).toBeNull();
  });
});

describe("narration", () => {
  it("narrates felt weight in Ship's Voice", () => {
    expect(narrateFeltWeight(2.5)).toMatch(/^[A-Z .,]+$/);
    expect(narrateFeltWeight(1)).toBe("FEELS LIKE HOME.");
    expect(narrateFeltWeight(null)).toBe("");
  });
  it("narrates native gravity", () => {
    expect(narrateNativeGravity(1.6)).toContain("HEAVY");
    expect(narrateNativeGravity(0.3)).toContain("WEIGHTLESS");
    expect(narrateNativeGravity(null)).toBe("");
  });
  it("never uses an exclamation point", () => {
    for (const r of [0.1, 0.5, 0.9, 1, 1.1, 1.4, 3]) {
      expect(narrateFeltWeight(r)).not.toContain("!");
      expect(narrateNativeGravity(r)).not.toContain("!");
    }
  });
});

describe("fmt", () => {
  it("rounds to three significant figures", () => {
    expect(fmt(1.23456)).toBe("1.23");
    expect(fmt(0.000123456)).toBe("0.000123");
    expect(fmt(12345)).toBe("12,345");
  });
});
