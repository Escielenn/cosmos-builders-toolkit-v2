import { describe, expect, it } from "vitest";
import { NUM_SRC, isHedged, parseQuantity } from "@/lib/writing/capture/numbers";
import { convert, readFactNumber, unitFromToken } from "@/lib/writing/capture/units";

const close = (a: number | null | undefined, b: number, eps = 1e-6) => {
  expect(a).not.toBeNull();
  expect(Math.abs((a as number) - b)).toBeLessThan(eps * Math.max(1, Math.abs(b)));
};

describe("parseQuantity", () => {
  it.each([
    ["1.47", 1.47, 0.005],
    ["26", 26, 0.5],
    ["1,200", 1200, 0.5],
    [".5", 0.5, 0.05],
    ["3.8e26", 3.8e26, 0.05e26],
    ["forty", 40, 0.5],
    ["forty-two", 42, 0.5],
    ["forty two", 42, 0.5],
    ["seven", 7, 0.5],
    ["twelve", 12, 0.5],
    ["a dozen", 12, 0.5],
    ["nine billion", 9e9, 0.5e9],
    ["two hundred thousand", 2e5, 0.5e5],
    ["a hundred", 100, 50],
    ["1.2 million", 1.2e6, 0.05e6],
    ["one and a half", 1.5, 0.25],
    ["half a", 0.5, 0.25],
    ["a tenth", 0.1, 0.05],
    ["one-fifth", 0.2, 0.1],
  ])("%s → %d", (raw, value, half) => {
    const q = parseQuantity(raw);
    expect(q).not.toBeNull();
    close(q!.value, value);
    close(q!.halfStep, half);
  });

  it("rejects what is not a number", () => {
    expect(parseQuantity("")).toBeNull();
    expect(parseQuantity("several")).toBeNull();
    expect(parseQuantity("the")).toBeNull();
  });

  it("marks spelled numbers as words", () => {
    expect(parseQuantity("forty")!.words).toBe(true);
    expect(parseQuantity("40")!.words).toBe(false);
  });

  it("NUM_SRC matches the forms parseQuantity reads", () => {
    const re = new RegExp(`^${NUM_SRC}$`, "i");
    for (const s of ["1.4", "forty-two", "nine billion", "a hundred", "one and a half", "half a", "1,200", "3.8e26"]) {
      expect(re.test(s)).toBe(true);
    }
    expect(re.test("someone")).toBe(false);
  });

  it("knows a hedge", () => {
    expect(isHedged("about")).toBe(true);
    expect(isHedged("nearly")).toBe(true);
    expect(isHedged("exactly")).toBe(false);
    expect(isHedged("")).toBe(false);
  });
});

describe("units", () => {
  it("converts within a dimension", () => {
    close(convert(1, "mi", "m"), 1609.344);
    close(convert(1, "atm", "bar"), 1.01325);
    close(convert(0, "C", "K"), 273.15);
    close(convert(32, "F", "K"), 273.15);
    close(convert(1, "yr", "days"), 365.25);
    close(convert(4.6e9, "yr", "gyr"), 4.6);
    close(convert(6371, "km", "earth_radii"), 1);
  });

  it("refuses to convert across dimensions or in-world units", () => {
    expect(convert(1, "hours", "m")).toBeNull();
    expect(convert(1, "local_days", "days")).toBeNull();
    expect(convert(1, "nope", "m")).toBeNull();
  });

  it("reads surface tokens, with c by context", () => {
    expect(unitFromToken("gees")).toBe("g");
    expect(unitFromToken("Miles")).toBe("mi");
    expect(unitFromToken("c", "K")).toBe("C");
    expect(unitFromToken("c", "c")).toBe("c");
    expect(unitFromToken("light years")).toBe("ly");
    expect(unitFromToken("R⊕")).toBe("earth_radii");
    expect(unitFromToken("furlongs")).toBeNull();
  });

  it("reads a fact's display value in the target unit", () => {
    close(readFactNumber("1.4 g", "g"), 1.4);
    close(readFactNumber("1.4", "g"), 1.4);
    close(readFactNumber("288 K", "K"), 288);
    close(readFactNumber("15 °C", "K"), 288.15);
    close(readFactNumber("26 h", "hours"), 26);
    close(readFactNumber("8.7e9", "individuals"), 8.7e9);
    close(readFactNumber("12 billion", "individuals"), 1.2e10);
    close(readFactNumber("0.95 R⊕", "earth_radii"), 0.95);
    close(readFactNumber("1,200 m", "m"), 1200);
    expect(readFactNumber("Tidally locked", "hours")).toBeNull();
    // A unit that measures something else is not comparable.
    expect(readFactNumber("26 hours", "m")).toBeNull();
  });
});
