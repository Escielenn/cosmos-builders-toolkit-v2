import { describe, it, expect } from "vitest";
import { bindGlobe, globeDirection, yawToFace } from "../bind/globe";
import { lightTint } from "../materials/SheetSurfaceMaterial";

const base = {
  tiltDeg: 23.44,
  tidallyLocked: false,
  dayLengthHours: 24,
  atmoPressureBar: 1,
  atmoComposition: "nitrogen, oxygen",
  starClass: "G2V",
  substellarLon: 0,
};

describe("bindGlobe", () => {
  it("takes tilt, spin and atmosphere from canon", () => {
    const b = bindGlobe(base);
    expect(b.tilt.value).toBeCloseTo((23.44 * Math.PI) / 180, 9);
    expect(b.tilt.derived).toBe(false);
    expect(b.spinRate).toBeGreaterThan(0);
    expect(b.atmosphere.present).toBe(true);
    expect(b.starColourDerived).toBe(false);
  });

  it("never turns a locked world", () => {
    const b = bindGlobe({ ...base, tidallyLocked: true, substellarLon: 40 });
    expect(b.spinRate).toBe(0);
    expect(b.locked.value).toBe(true);
    expect(b.substellarLon).toBe(40);
  });

  it("marks what it inferred, and draws an unknown world airless and upright", () => {
    const b = bindGlobe({ ...base, tiltDeg: null, tidallyLocked: null, atmoPressureBar: null, starClass: null });
    expect(b.tilt.derived).toBe(true);
    expect(b.tilt.value).toBe(0);
    expect(b.locked.derived).toBe(true);
    expect(b.atmosphere.present).toBe(false);
    expect(b.starColourDerived).toBe(true);
  });

  it("warms the light for a cool star", () => {
    const m = lightTint(bindGlobe({ ...base, starClass: "M5V" }).starColour);
    expect(m.r).toBeGreaterThan(m.b);
    const g = lightTint(bindGlobe(base).starColour);
    expect(Math.max(g.r, g.g, g.b)).toBeCloseTo(1, 6);
  });
});

describe("globe geometry", () => {
  it("matches SphereGeometry's UV layout: lon 0 on +X, lon 90 on −Z, north up", () => {
    const [x0, y0, z0] = globeDirection(0, 0);
    expect(x0).toBeCloseTo(1, 9);
    expect(y0).toBeCloseTo(0, 9);
    expect(z0).toBeCloseTo(0, 9);
    const [, , z90] = globeDirection(0, 90);
    expect(z90).toBeCloseTo(-1, 9);
    expect(globeDirection(90, 0)[1]).toBeCloseTo(1, 9);
  });

  it("turns a longitude to face the star", () => {
    for (const lon of [-150, -30, 0, 75, 170]) {
      const [x, , z] = globeDirection(0, lon);
      const t = yawToFace(lon);
      // Rotation about +Y: x' = x cos t + z sin t.
      expect(x * Math.cos(t) + z * Math.sin(t)).toBeCloseTo(1, 9);
    }
  });
});
