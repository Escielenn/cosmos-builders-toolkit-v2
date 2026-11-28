// Solaris 1.9 "True Numbers": the physics and the save format, tested on the
// exact files the simulator ships (public/tools/solaris/sf-astro.js and
// solaris-core.js), loaded as the browser loads them.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateManifest } from "@/canon/manifest";
import { manifest as solarisManifest, orbitalPeriod, insolation, equilibriumTemperature } from "@/tools/solaris/manifest";
import { manifest as rogueManifest } from "@/tools/rogue/manifest";

/* eslint-disable @typescript-eslint/no-explicit-any */
function loadScripts(...files: string[]): any {
  const sandbox: any = {};
  for (const f of files) {
    const code = readFileSync(join(process.cwd(), f), "utf8");
    new Function("window", code)(sandbox);
  }
  return sandbox;
}
const W = loadScripts("public/tools/solaris/sf-astro.js", "public/tools/solaris/solaris-core.js");
const A = W.SFAstro;
const C = W.SolarisCore;

describe("Kepler's third law (sf-astro)", () => {
  it("gives Earth 365.25 days and Mars 687 days", () => {
    expect(A.periodDays(1, 1)).toBeCloseTo(365.25, 6);
    expect(A.periodDays(1.5237, 1)).toBeCloseTo(687.0, 0);
  });
  it("gives Proxima b 11.19 days (0.04857 AU, 0.1221 M☉; Anglada-Escudé 2016: 11.186 d)", () => {
    expect(A.periodDays(0.04857, 0.1221)).toBeCloseTo(11.19, 1);
  });
  it("gives TRAPPIST-1e 6.10 days (0.02925 AU, 0.0898 M☉; Agol 2021: 6.101 d)", () => {
    expect(A.periodDays(0.02925, 0.0898)).toBeCloseTo(6.1, 1);
  });
  it("uses the stellar mass: a red dwarf's 1 AU year is longer than the Sun's", () => {
    expect(A.periodYears(1, 0.23)).toBeCloseTo(1 / Math.sqrt(0.23), 6);
  });
});

describe("insolation and equilibrium temperature", () => {
  it("is 1 S⊕ at 1 AU from 1 L☉ and falls as 1/d²", () => {
    expect(A.insolation(1, 1)).toBe(1);
    expect(A.insolation(1, 1.5237)).toBeCloseTo(0.4307, 3);
  });
  it("gives Earth T_eq ≈ 254 K at Bond albedo 0.306", () => {
    expect(A.equilibriumTempK(1, 0.306)).toBeCloseTo(254, 0);
  });
  it("gives Mars T_eq ≈ 210 K at albedo 0.25", () => {
    expect(A.equilibriumTempK(A.insolation(1, 1.5237), 0.25)).toBeCloseTo(210, 0);
  });
  it("gives Proxima b 0.66 S⊕ and TRAPPIST-1e 0.65 S⊕", () => {
    expect(A.insolation(0.00155, 0.04857)).toBeCloseTo(0.657, 2);
    expect(A.insolation(0.000553, 0.02925)).toBeCloseTo(0.646, 2);
  });
  it("averages a moving star's flux exactly: ⟨1/d²⟩ = 1/(a² − r²)", () => {
    // Numerical average over a circle of radius r seen from distance a.
    const a = 3, r = 1, n = 20000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const t = (2 * Math.PI * i) / n;
      sum += 1 / ((a - r * Math.cos(t)) ** 2 + (r * Math.sin(t)) ** 2);
    }
    expect(A.meanInsolation(a, [{ lum: 1, r }])).toBeCloseTo(sum / n, 6);
  });
});

describe("habitable zone (Kopparapu et al. 2014)", () => {
  it("puts the Sun's conservative zone at 0.95–1.68 AU", () => {
    const [i, o] = A.hz(1, 5780);
    expect(i).toBeCloseTo(0.95, 2);
    expect(o).toBeCloseTo(1.68, 2);
  });
  it("calls Earth habitable, Venus hot and TRAPPIST-1e habitable", () => {
    expect(A.hzStatus(1, 5772)).toBe("habitable");
    expect(A.hzStatus(1.91, 5772)).toBe("hot");
    expect(A.hzStatus(0.646, 2566)).toBe("habitable");
  });
  it("flags temperatures outside the fitted 2600–7200 K range", () => {
    expect(A.hzExtrapolated(12300)).toBe(true);
    expect(A.hzExtrapolated(5772)).toBe(false);
  });
});

describe("Holman & Wiegert 1999", () => {
  it("reproduces eq. 1 at μ = 0.5: 0.274 (e = 0) and 0.208 (e = 0.2)", () => {
    expect(A.hwSType(0.5, 0)).toBeCloseTo(0.274, 3);
    expect(A.hwSType(0.5, 0.2)).toBeCloseTo(0.208, 3);
  });
  it("reproduces eq. 3 at μ = 0.5, e = 0: 2.39 binary separations", () => {
    expect(A.hwPType(0.5, 0)).toBeCloseTo(2.39, 2);
  });
  it("gives Alpha Cen A an S-type limit near 2.7 AU (μ = 0.459, e = 0.52, a = 23.64 AU)", () => {
    expect(A.hwSType(0.9373 / (1.1055 + 0.9373), 0.5208) * 23.64).toBeCloseTo(2.73, 1);
  });
});

describe("main-sequence table (Mamajek 2022)", () => {
  it("obeys Stefan–Boltzmann, L = R² (T / 5772)⁴, within 10% on every row", () => {
    for (const r of A.MS) {
      const L = r.radius ** 2 * (r.teffK / 5772) ** 4;
      expect(Math.abs(L / r.lum - 1), r.spt).toBeLessThan(0.1);
    }
  });
  it("gives the palette stars real rows (the 1.8 table had a 0.92 R☉ red dwarf)", () => {
    expect(C.STAR_TYPES.red.spt).toBe("M4V");
    expect(C.STAR_TYPES.red.radius).toBeCloseTo(0.274, 3);
    expect(C.STAR_TYPES.yellow.mass).toBe(1);
    expect(C.STAR_TYPES.blue.teffK).toBe(12300);
  });
});

// ---------------------------------------------------------------------------
// System model and save format
// ---------------------------------------------------------------------------

const PTYPES = {
  terrestrial: { name: "Terrestrial", color: "#4A90D9", alt: "#2ECC71", band: "habitable" },
  gasgiant: { name: "Gas Giant", color: "#D4875A", alt: "#9B5A2E", band: "outer" },
  barren: { name: "Barren", color: "#7A7A7A", alt: "#4A4A4A", band: "outer" },
};

function sampleSystem(AU = 72) {
  const sys: any = {
    name: "KESTREL", seed: 123456789, starMode: "trinary", arch: "tri_31", t: 3.25, AU,
    sep: { ab: 1, c: 20, d: 13.75, cd: 1 }, phase: { ab: 0.3, c: 1.7, cd: 0, d: 2.2 },
    stars: [
      { key: "yellow", nameStr: "KESTREL A" },
      { key: "orange", nameStr: "KESTREL B" },
      { key: "red", nameStr: "KESTREL C" },
    ],
    planets: [
      { name: "KESTREL-I", typeKey: "terrestrial", band: "habitable", orbitPx: 3.1 * AU, angle: 0.4, sz: 9.2,
        tidalLock: false, retrograde: true, rotSpeed: 1.6, rotAngle: 2.1, glowPh: 0.5, albedo: 0.3,
        startPx: 3.0 * AU, px: 3.0 * AU, py: 0.7 * AU, vx: -1.2 * AU, vy: 4.4 * AU,
        moons: [{ r: 20, angle: 1.1, spd: 1.3, sz: 2.2 }] },
      { name: "RENAMED BY WRITER", typeKey: "gasgiant", band: "outer", orbitPx: 5.4 * AU, angle: 2.4, sz: 19,
        tidalLock: false, retrograde: false, rotSpeed: 1, rotAngle: 0, glowPh: 1.2, albedo: 0.34,
        ejected: true, ejectedAtYears: 2.9, moons: [] },
    ],
    asteroidBelt: { r: 4.2 * AU, pts: [{ r: 4.1 * AU, ang: 1, spd: 0.01, sz: 2, col: "rgba(1,2,3,0.5)" }] },
    oort: { hillsMax: 40 * AU, outerMax: 140 * AU, pts: [{ r: 30 * AU, ang: 2, spd: 0.001, sz: 1, col: "x", elev: 0.1, zone: "hills" }],
      comets: [{ r: 50 * AU, ang: 0.2, perihelion: 2 * AU, spd: 0.01, sz: 2, tailLen: 80, startR: 60 * AU }] },
  };
  return sys;
}

describe("save and load (S1)", () => {
  it("round-trips the exact system: serialize ∘ deserialize ∘ serialize is the identity", () => {
    const snap = C.serialize(sampleSystem());
    const again = C.serialize(C.deserialize(JSON.parse(JSON.stringify(snap)), 72, PTYPES));
    expect(again).toEqual(snap);
  });
  it("keeps edits, names, moons, live orbital state, flags, belt, Oort cloud, clock and seed", () => {
    const back = C.deserialize(C.serialize(sampleSystem()), 72, PTYPES);
    expect(back.name).toBe("KESTREL");
    expect(back.seed).toBe(123456789);
    expect(back.t).toBe(3.25);
    expect(back.planets[1].name).toBe("RENAMED BY WRITER");
    expect(back.planets[1].ejected).toBe(true);
    expect(back.planets[0].retrograde).toBe(true);
    expect(back.planets[0].moons).toEqual([{ r: 20, angle: 1.1, spd: 1.3, sz: 2.2 }]);
    expect(back.planets[0].vy / 72).toBeCloseTo(4.4, 12);
    expect(back.asteroidBelt.pts).toHaveLength(1);
    expect(back.oort.comets[0].perihelion / 72).toBeCloseTo(2, 12);
    expect(back.sep).toEqual({ ab: 1, c: 20, d: 13.75, cd: 1 });
  });
  it("is independent of screen size: a save at one AU scale loads at another", () => {
    const snap = C.serialize(sampleSystem(72));
    const big = C.deserialize(snap, 150, PTYPES);
    expect(big.planets[0].orbitPx / 150).toBeCloseTo(3.1, 12);
    expect(C.serialize(big)).toEqual(snap);
  });
  it("regenerates the same stream from the same seed (mulberry32)", () => {
    const a = C.mulberry32(42), b = C.mulberry32(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
    expect(new Set(xs).size).toBe(5);
  });
});

describe("star motion and stability limits", () => {
  it("keeps the A–B separation and puts their barycentre at the origin (binary)", () => {
    const sys: any = { starMode: "binary", arch: "binary", sep: { ab: 2 }, phase: { ab: 0 },
      stars: [{ key: "yellow" }, { key: "red" }] };
    for (const t of [0, 0.37, 5.2]) {
      const [a, b] = C.starPositionsAU(sys, t);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(2, 10);
      const mA = C.STAR_TYPES.yellow.mass, mB = C.STAR_TYPES.red.mass;
      expect((mA * a.x + mB * b.x) / (mA + mB)).toBeCloseTo(0, 10);
    }
  });
  it("moves the pair at the Kepler period with their real masses", () => {
    const sys: any = { starMode: "binary", arch: "binary", sep: { ab: 1 }, phase: { ab: 0 },
      stars: [{ key: "yellow" }, { key: "yellow" }] };
    const P = Math.sqrt(1 / 2);
    const p0 = C.starPositionsAU(sys, 0)[1], p1 = C.starPositionsAU(sys, P)[1];
    expect(p1.x).toBeCloseTo(p0.x, 10);
    expect(p1.y).toBeCloseTo(p0.y, 10);
  });
  it("applies eq. 3 inside and eq. 1 outside for a 3+1 triple", () => {
    const sys: any = { starMode: "trinary", arch: "tri_31", sep: { ab: 1, c: 20 }, phase: {},
      stars: [{ key: "yellow" }, { key: "yellow" }, { key: "yellow" }] };
    const lim = C.limits(sys);
    expect(lim.inner).toBeCloseTo(A.hwPType(0.5, 0), 6);
    expect(lim.outer).toBeCloseTo(A.hwSType(1 / 3, 0) * 20, 6);
  });
  it("reports real per-planet values for a planet at 1 AU around the Sun", () => {
    const sys: any = { starMode: "single", arch: "single", sep: {}, phase: {}, stars: [{ key: "yellow" }] };
    const m = C.planetMetrics(sys, 1, 0.306);
    expect(m.periodDays).toBeCloseTo(365.25, 6);
    expect(m.insolation).toBeCloseTo(C.STAR_TYPES.yellow.lum, 6);
    expect(m.hzStatus).toBe("habitable");
  });
});

describe("Solaris and Rogue manifests", () => {
  it("pass the /sf-audit manifest rules", () => {
    expect(validateManifest(solarisManifest)).toEqual([]);
    expect(validateManifest(rogueManifest)).toEqual([]);
  });
  it("derive the same numbers the sim shows", () => {
    expect(orbitalPeriod.fn({ "orbit.semi_major_axis": 0.02925, "star.mass": 0.0898 })).toBeCloseTo(A.periodDays(0.02925, 0.0898), 9);
    expect(insolation.fn({ "orbit.semi_major_axis": 1.5237, "star.luminosity": 1 })).toBeCloseTo(A.insolation(1, 1.5237), 12);
    expect(equilibriumTemperature.fn({ "planet.insolation": 1, "planet.albedo": 0.306 })).toBeCloseTo(A.equilibriumTempK(1, 0.306), 9);
  });
});
