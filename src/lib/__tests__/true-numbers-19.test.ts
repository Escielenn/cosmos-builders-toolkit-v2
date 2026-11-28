// 1.9 "True Numbers", lane C: reference values for every formula changed.
import { describe, it, expect } from "vitest";
import { calculateSurfaceGravity, exobaseTemperature } from "@/lib/surface-gravity/calculations";
import { calculateBrachistochrone, LY_IN_METERS } from "@/lib/time-dilation/calculations";
import { calculateThrustGravity } from "@/lib/gravitas/calculations";
import { mainSequenceTeff, calcHZBoundaries } from "@/lib/habitable-zone/calculations";
import { hzInner, hzOuter } from "@/tools/goldilocks/manifest";
import { spinGravity } from "@/tools/gravitas/manifest";
import { tempEffective } from "@/tools/orrery/manifest";
import { deriveAll, dependentsOf } from "@/canon/derive";
import { SPIN_PRESETS } from "@/lib/gravitas/data";

const status = (r: ReturnType<typeof calculateSurfaceGravity>, id: string) => r.gasRetention.find((g) => g.id === id)?.status;

describe("F-06 Ballast: retention at the exobase", () => {
  const earth = calculateSurfaceGravity({ primary: { mass: 1, radius: 1 }, advanced: { surfaceTemp: 288 } } as never);
  it("Earth keeps N₂, O₂, water; does not keep hydrogen or helium", () => {
    expect(Math.round(earth.exobaseTemp)).toBe(1008);
    expect(status(earth, "n2")).toBe("retained");
    expect(status(earth, "o2")).toBe("retained");
    expect(status(earth, "h2o")).toBe("retained");
    expect(status(earth, "he")).not.toBe("retained");
    expect(status(earth, "h2")).toBe("escapes");
  });
  it("Mars (0.107 M⊕, 0.532 R⊕, 210 K) no longer keeps water outright", () => {
    const mars = calculateSurfaceGravity({ primary: { mass: 0.107, radius: 0.532 }, advanced: { surfaceTemp: 210 } } as never);
    expect(status(mars, "h2o")).not.toBe("retained");
    expect(status(mars, "co2")).toBe("retained");
  });
  it("never estimates an exobase colder than the surface", () => {
    expect(exobaseTemperature(100)).toBe(350);
    expect(exobaseTemperature(5000)).toBe(5000);
  });
});

describe("F-10 one relativistic travel engine", () => {
  it("Sol to Alpha Centauri (4.37 ly) at 1 g, stop to stop: ≈6.0 yr at home, ≈3.6 yr aboard", () => {
    const r = calculateBrachistochrone(4.37 * LY_IN_METERS, 1, 1, false);
    const yr = 365.25 * 86400;
    expect(r.observerTimeSeconds / yr).toBeCloseTo(5.97, 1);
    expect(r.shipTimeSeconds / yr).toBeCloseTo(3.58, 1);
  });
  it("Gravitas agrees with Paradox for the same trip", () => {
    const g = calculateThrustGravity({ acceleration_g: 1, mission_distance_au: (4.37 * LY_IN_METERS) / 1.496e11, propulsion_mode: "brachistochrone", include_relativity: true });
    expect(g.earth_time_years).toBeCloseTo(5.97, 1);
  });
});

describe("F-01 Teff-corrected habitable zone in canon", () => {
  it("an M3V (0.013 L☉, 3250 K) saves 0.127 to 0.248 AU, what the screen draws", () => {
    expect(hzInner.fn({ "star.luminosity": 0.013, "star.temp_effective": 3250 })!).toBeCloseTo(calcHZBoundaries(0.013, 3250).runawayGreenhouse, 6);
    expect(hzInner.fn({ "star.luminosity": 0.013, "star.temp_effective": 3250 })!).toBeCloseTo(0.12, 1);
    expect(hzOuter.fn({ "star.luminosity": 0.013, "star.temp_effective": 3250 })!).toBeGreaterThan(0.22);
  });
  it("the Sun without a Teff fact keeps Kopparapu's solar edges, 0.95 to 1.68 AU", () => {
    expect(hzInner.fn({ "star.luminosity": 1 })!).toBeCloseTo(0.95, 2);
    expect(hzOuter.fn({ "star.luminosity": 1 })!).toBeCloseTo(1.68, 2);
  });
});

describe("main-sequence Teff (Orrery derivation)", () => {
  it("Sun 5772 K; Proxima and Alpha Cen A within 6% of measured 3042 K and 5790 K", () => {
    expect(mainSequenceTeff(1, 1)).toBeCloseTo(5772, 0);
    expect(Math.abs(mainSequenceTeff(0.00155, 0.122)! / 3042 - 1)).toBeLessThan(0.06);
    expect(Math.abs(mainSequenceTeff(1.519, 1.1)! / 5790 - 1)).toBeLessThan(0.06);
  });
  it("chains: L + M → Teff → HZ edges, each with a narrative", () => {
    const out = deriveAll({ "star.luminosity": 0.013, "star.mass": 0.33 });
    expect(out.map((d) => d.output)).toEqual(expect.arrayContaining(["star.temp_effective", "system.hz_inner", "system.hz_outer"]));
    for (const d of out) expect(d.narrative.length).toBeGreaterThan(10);
    expect(tempEffective.narrative(3200, {})).toMatch(/amber/);
  });
  it("knows what a change reaches (Law II)", () => {
    expect(dependentsOf(["star.mass"]).map((r) => r.derivation.output)).toEqual(
      expect.arrayContaining(["star.temp_effective", "system.hz_inner", "system.hz_outer"]),
    );
  });
});

describe("F-04 / F-18 spin gravity", () => {
  it("g = ω²r/g₀: Stanford Torus 900 m at 1 rpm ≈ 1.01 g", () => {
    expect(spinGravity.fn({ "vessel.radius": 900, "vessel.spin_rate": 1 })!).toBeCloseTo(1.006, 2);
  });
  it("every preset that says 1g is within 2% of it", () => {
    for (const p of SPIN_PRESETS) {
      if (!/~?1g/.test(p.description)) continue;
      const g = spinGravity.fn({ "vessel.radius": p.values.radius_m, "vessel.spin_rate": p.values.rotation_rpm })!;
      expect(Math.abs(g - 1), p.id).toBeLessThan(0.02);
    }
  });
});

describe("Genesis temperature text into canon kelvin", async () => {
  const { parseTemperatureK } = await import("@/canon/field");
  it("reads °C (the form's unit), K and °F", () => {
    expect(parseTemperatureK("15°C (Earth)")).toBe(288.15);
    expect(parseTemperatureK("15")).toBe(288.15);
    expect(parseTemperatureK("288 K")).toBe(288);
    expect(parseTemperatureK("59°F")).toBe(288.15);
    expect(parseTemperatureK("-300 C")).toBeNull();
    expect(parseTemperatureK("warm")).toBeNull();
  });
});
