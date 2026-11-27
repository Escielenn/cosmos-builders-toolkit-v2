// Rogue 1.9: energy conservation, bound S-type planets and honest outcomes,
// tested on the file the simulator ships (public/rogue/rogue-physics.js) and
// on its typed twin (src/lib/simulators/nbody.ts).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { advance, step, totalEnergy, softeningFor, SOFTENING } from "@/lib/simulators/nbody";
import { SYSTEMS, buildBodies } from "@/lib/simulators/rogue-systems";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sandbox: any = {};
new Function("window", readFileSync(join(process.cwd(), "public/rogue/rogue-physics.js"), "utf8"))(sandbox);
const R = sandbox.RoguePhysics;
const ME = R.M_EARTH;

// TRAPPIST-1: Agol et al. 2021 (a in AU, masses in M⊕), star 0.0898 M☉.
const TRAPPIST = {
  starMass: 0.0898,
  binary: null,
  planets: [
    [0.01154, 1.374], [0.0158, 1.308], [0.02227, 0.388], [0.02925, 0.692],
    [0.03849, 1.039], [0.04683, 1.321], [0.06189, 0.326],
  ].map(([a, m], i) => ({ name: `T-1${"bcdefgh"[i]}`, a, mass: m * ME })),
};
// Alpha Centauri AB: Kervella et al. 2016, e from Pourbaix & Boffin 2016.
const ALPHACEN = {
  starMass: 1.1055,
  binary: { mass: 0.9373, separation: 23.64, e: 0.5208 },
  planets: [
    { name: "α Cen Bb*", a: 0.7, mass: 5 * ME, host: "B" },
    { name: "α Cen Ab*", a: 1.1, mass: 1.5 * ME, host: "A" },
  ],
};

function maxEnergyError(sys: any, years: number, dt: number, full = true) {
  const b = R.initialState(sys), s = R.softening(sys);
  const E0 = R.totalEnergy(b, full, s);
  const n = Math.round(years / dt);
  let max = 0;
  for (let i = 0; i < n; i++) {
    R.step(b, dt, full, s);
    if (i % 500 === 0) max = Math.max(max, R.energyError(R.totalEnergy(b, full, s), E0));
  }
  return { max, bodies: b };
}

describe("step plan (R3): dt is never enlarged", () => {
  it("uses the same step at 1× and at the 100× maximum, and caps the rate instead", () => {
    const one = R.stepPlan(TRAPPIST, 1), max = R.stepPlan(TRAPPIST, 100);
    expect(max.dt).toBe(one.dt);
    expect(max.perFrame).toBeLessThanOrEqual(R.STEP_CAP_PER_FRAME);
    expect(max.capped).toBe(true);
    expect(max.effectiveTs).toBeLessThan(100);
  });
  it("resolves TRAPPIST-1b with thousands of steps per orbit", () => {
    const pb = Math.sqrt(0.01154 ** 3 / 0.0898);
    expect(pb / R.stepPlan(TRAPPIST, 100).dt).toBeGreaterThan(1000);
  });
});

describe("energy conservation on TRAPPIST-1 (R2, R3)", () => {
  it("holds |ΔE/E| below 1e-6 over 25 orbits of planet b at the 1× step", () => {
    const { max } = maxEnergyError(TRAPPIST, 0.1, R.stepPlan(TRAPPIST, 1).dt);
    expect(max).toBeLessThan(1e-6);
  });
  it("holds the same at maximum time scale (same dt, more steps per frame)", () => {
    const { max } = maxEnergyError(TRAPPIST, 0.1, R.stepPlan(TRAPPIST, 100).dt);
    expect(max).toBeLessThan(1e-6);
    expect(max).toBeLessThan(R.PUBLISH_MAX_ENERGY_ERROR);
  });
  it("keeps every planet on its orbit (the old 0.0071 AU softening bent them)", () => {
    const { bodies } = maxEnergyError(TRAPPIST, 0.1, R.stepPlan(TRAPPIST, 1).dt);
    for (const p of bodies.filter((b: any) => b.isPlanet)) {
      const o = R.outcome(p, bodies);
      expect(o.outcome, p.name).toBe("retained");
      expect(Math.abs(o.a - p.a) / p.a, p.name).toBeLessThan(0.01);
    }
  });
  it("scales softening to the system: 0.5% of TRAPPIST-1b's orbit, not 62%", () => {
    expect(Math.sqrt(R.softening(TRAPPIST).eps2)).toBeCloseTo(0.005 * 0.01154, 12);
  });
});

describe("Alpha Centauri (R1): S-type planets stay bound without an intruder", () => {
  it("keeps both planets on their own stars for 100 years (1.25 binary orbits)", () => {
    const { max, bodies } = maxEnergyError(ALPHACEN, 100, R.stepPlan(ALPHACEN, 1).dt);
    expect(max).toBeLessThan(1e-6);
    const out = Object.fromEntries(bodies.filter((b: any) => b.isPlanet).map((p: any) => [p.name, R.outcome(p, bodies)]));
    expect(out["α Cen Ab*"].boundTo).toBe("Star A");
    expect(out["α Cen Bb*"].boundTo).toBe("Star B");
    for (const o of Object.values(out) as any[]) {
      expect(o.outcome).toBe("retained");
      expect(o.e).toBeLessThan(0.1);
    }
  });
  it("starts the binary at apoastron with the vis-viva speed", () => {
    const b = R.initialState(ALPHACEN);
    const [A, B] = b;
    expect(Math.hypot(A.x - B.x, A.y - B.y)).toBeCloseTo(23.64 * 1.5208, 9);
    // Relative orbit: B about A with the total mass.
    const el = R.elements(B, { ...A, mass: A.mass + B.mass });
    expect(el.e).toBeCloseTo(0.5208, 6);
    expect(el.a).toBeCloseTo(23.64, 6);
  });
});

describe("outcomes (R4)", () => {
  it("calls a planet the intruder carries off captured, not ejected", () => {
    const star = { name: "Star", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true };
    const intr = { name: "Intruder", x: 200, y: 0, vx: 2, vy: 0, mass: 10, isIntruder: true, active: true };
    const v = Math.sqrt((R.G * 10) / 1);
    const p = { name: "P", x: 201, y: 0, vx: 2, vy: v, mass: 3e-6, a: 1, isPlanet: true };
    expect(R.outcome(p, [star, intr, p]).outcome).toBe("captured");
  });
  it("calls an unbound planet ejected and reports a = null, not a clamped value", () => {
    const star = { name: "Star", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true };
    const p = { name: "P", x: 50, y: 0, vx: 30, vy: 5, mass: 3e-6, a: 1, isPlanet: true };
    const o = R.outcome(p, [star, p]);
    expect(o.outcome).toBe("ejected");
    expect(o.a).toBeNull();
    expect(o.e).toBeGreaterThan(1);
  });
  it("keeps a wide surviving orbit unclamped (the old aftermath capped a at 500 AU)", () => {
    const star = { name: "Star", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true };
    const r = 400, v = Math.sqrt(R.G * (2 / r - 1 / 900));
    const p = { name: "P", x: r, y: 0, vx: 0, vy: v, mass: 3e-6, a: 5, isPlanet: true };
    const o = R.outcome(p, [star, p]);
    expect(o.outcome).toBe("orbit_changed");
    expect(o.a).toBeCloseTo(900, 6);
  });
});

describe("nbody.ts twin", () => {
  it("scales softening to the innermost orbit and falls back to the old constant without planets", () => {
    const b = buildBodies(SYSTEMS.trappist);
    expect(Math.sqrt(softeningFor(b).eps2)).toBeCloseTo(0.005 * 0.01154, 12);
    expect(softeningFor([{ name: "s", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true }]).eps2).toBe(SOFTENING);
  });
  it("conserves energy on TRAPPIST-1 to 1e-6 at the sim's step", () => {
    const b = buildBodies(SYSTEMS.trappist);
    const dt = R.stepPlan(TRAPPIST, 1).dt;
    const E0 = totalEnergy(b);
    for (let i = 0; i < 20000; i++) step(b, dt, true);
    expect(Math.abs((totalEnergy(b) - E0) / E0)).toBeLessThan(1e-6);
  });
  it("keeps Alpha Cen's S-type planets near their stars for a binary orbit", () => {
    const b = buildBodies(SYSTEMS.alphacen);
    for (let i = 0; i < 1_000_000; i++) step(b, 0.00008, true);
    const [A, B] = b.filter((x) => x.isStar);
    const ab = b.find((x) => x.name === "α Cen Ab*")!, bb = b.find((x) => x.name === "α Cen Bb*")!;
    expect(Math.hypot(ab.x - A.x, ab.y - A.y)).toBeLessThan(1.3);
    expect(Math.hypot(bb.x - B.x, bb.y - B.y)).toBeLessThan(0.85);
  });
  it("subdivides, never enlarges, near the intruder", () => {
    const b = buildBodies(SYSTEMS.solar);
    b.push({ name: "Intruder", x: 1.001, y: 0.001, vx: 0, vy: 0, mass: 10, isIntruder: true, active: true });
    expect(advance(b, 0.001, true)).toBeGreaterThan(1);
  });
});
