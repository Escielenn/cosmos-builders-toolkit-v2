import { describe, it, expect } from "vitest";
import {
  G,
  DT_BASE,
  M_JUPITER,
  step,
  computeAccelerations,
  barycenter,
  stellarBarycenter,
  specificOrbitalEnergy,
  ejectedBodies,
  classifyEncounter,
  totalEnergy,
  totalMomentum,
  circularSpeed,
  orbitalPeriod,
  type Body,
} from "@/lib/simulators/nbody";

// In Gaussian units a 1 AU circular orbit around 1 solar mass takes exactly one
// year at speed 2pi. Almost every assertion below is anchored to that.
const sun = (over: Partial<Body> = {}): Body => ({
  name: "Sun",
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  mass: 1,
  isStar: true,
  ...over,
});

const planetAt = (a: number, over: Partial<Body> = {}): Body => ({
  name: `P${a}`,
  x: a,
  y: 0,
  vx: 0,
  vy: circularSpeed(1, a),
  mass: M_JUPITER,
  isPlanet: true,
  a,
  ...over,
});

/** Run n steps of dt. */
function integrate(bodies: Body[], years: number, dt = DT_BASE, full = true) {
  const steps = Math.round(years / dt);
  for (let i = 0; i < steps; i++) step(bodies, dt, full);
  return steps;
}

describe("units and closed forms", () => {
  it("uses G = 4 pi squared", () => {
    expect(G).toBeCloseTo(39.478, 3);
  });

  it("gives 2 pi for a 1 AU circular orbit around the Sun", () => {
    expect(circularSpeed(1, 1)).toBeCloseTo(2 * Math.PI, 10);
  });

  it("gives a one-year period at 1 AU", () => {
    expect(orbitalPeriod(1, 1)).toBeCloseTo(1, 10);
  });

  it("agrees with Kepler's third law at other radii", () => {
    // Jupiter at 5.2 AU takes about 11.86 years.
    expect(orbitalPeriod(1, 5.2)).toBeCloseTo(11.86, 1);
  });
});

describe("gravity", () => {
  it("pulls two bodies toward each other with equal and opposite force", () => {
    const bodies: Body[] = [
      { name: "a", x: -1, y: 0, vx: 0, vy: 0, mass: 1, isStar: true },
      { name: "b", x: 1, y: 0, vx: 0, vy: 0, mass: 1, isStar: true },
    ];
    const { ax, ay } = computeAccelerations(bodies, true);
    // Equal masses, so equal magnitudes pointing inward.
    expect(ax[0]).toBeGreaterThan(0);
    expect(ax[1]).toBeLessThan(0);
    expect(ax[0]).toBeCloseTo(-ax[1], 12);
    expect(ay[0]).toBeCloseTo(0, 12);
  });

  it("falls off as one over r squared", () => {
    const at = (d: number) => {
      const bodies: Body[] = [
        { name: "s", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true },
        { name: "p", x: d, y: 0, vx: 0, vy: 0, mass: 1e-9, isPlanet: true },
      ];
      return Math.abs(computeAccelerations(bodies, true).ax[1]);
    };
    // Doubling the distance should quarter the pull.
    expect(at(1) / at(2)).toBeCloseTo(4, 1);
  });

  it("ignores an intruder that has not launched", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      { name: "BH", x: 30, y: 0, vx: 0, vy: 0, mass: 10, isIntruder: true, active: false },
    ];
    const parked = computeAccelerations(bodies, true).ax[1];
    bodies[2].active = true;
    const live = computeAccelerations(bodies, true).ax[1];
    expect(parked).not.toBeCloseTo(live, 6);
  });

  it("skips planet-planet forces before launch, and applies them after", () => {
    const build = (): Body[] => [sun(), planetAt(1), planetAt(1.2)];

    const partial = computeAccelerations(build(), false);
    const partialAx = partial.ax[1];
    const full = computeAccelerations(build(), true);
    const fullAx = full.ax[1];

    // The neighbouring planet adds a small but real tug.
    expect(partialAx).not.toBeCloseTo(fullAx, 9);
  });

  it("survives a direct hit without producing infinities", () => {
    // Softening exists for exactly this: two bodies at the same point.
    const bodies: Body[] = [
      { name: "a", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true },
      { name: "b", x: 0, y: 0, vx: 0, vy: 0, mass: 1, isStar: true },
    ];
    const { ax, ay } = computeAccelerations(bodies, true);
    expect(Number.isFinite(ax[0])).toBe(true);
    expect(Number.isFinite(ay[0])).toBe(true);
  });
});

describe("the integrator holds a circular orbit", () => {
  it("returns a planet to its start after one year", () => {
    const bodies = [sun(), planetAt(1)];
    integrate(bodies, 1);
    const p = bodies[1];
    // Back near (1, 0) after one full revolution.
    expect(p.x).toBeCloseTo(1, 2);
    expect(Math.abs(p.y)).toBeLessThan(0.02);
  });

  it("keeps the radius steady over ten orbits", () => {
    const bodies = [sun(), planetAt(1)];
    const radii: number[] = [];
    for (let orbit = 0; orbit < 10; orbit++) {
      integrate(bodies, 1);
      radii.push(Math.hypot(bodies[1].x - bodies[0].x, bodies[1].y - bodies[0].y));
    }
    for (const r of radii) expect(r).toBeCloseTo(1, 2);
  });

  it("matches Kepler's period at 5.2 AU", () => {
    const bodies = [sun(), planetAt(5.2)];
    // Integrate one Jupiter year and check it came back around.
    integrate(bodies, orbitalPeriod(1, 5.2), 0.0005);
    expect(bodies[1].x).toBeCloseTo(5.2, 0);
    expect(Math.abs(bodies[1].y)).toBeLessThan(0.6);
  });
});

describe("conservation", () => {
  it("conserves energy to better than a tenth of a percent over ten orbits", () => {
    // The point of a symplectic integrator: energy oscillates within a bound
    // rather than drifting, so a long run stays physical.
    const bodies = [sun(), planetAt(1), planetAt(1.9)];
    const before = totalEnergy(bodies);
    integrate(bodies, 10);
    const after = totalEnergy(bodies);
    expect(Math.abs((after - before) / before)).toBeLessThan(1e-3);
  });

  it("conserves momentum", () => {
    const bodies = [sun(), planetAt(1), planetAt(2.5)];
    const before = totalMomentum(bodies);
    integrate(bodies, 5);
    const after = totalMomentum(bodies);
    expect(after.px - before.px).toBeCloseTo(0, 8);
    expect(after.py - before.py).toBeCloseTo(0, 8);
  });

  it("conserves energy through a resolved flyby", () => {
    // Impact parameter around 2 AU, so the closest approach spans thousands of
    // steps and the scheme can actually follow it.
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      planetAt(2),
      { name: "BH", x: -14, y: -2, vx: 5, vy: 0, mass: 8, isIntruder: true, active: true },
    ];
    const before = totalEnergy(bodies);
    integrate(bodies, 4);
    const after = totalEnergy(bodies);
    expect(Math.abs((after - before) / before)).toBeLessThan(0.02);
  });

  // Worth stating plainly, because it constrains how the simulator may be used:
  // energy conservation depends on resolving the closest approach. A body aimed
  // nearly through the star crosses the softening radius in a handful of steps
  // at the default dt, and no fixed-step integrator conserves energy through
  // that. Softening still guarantees the result stays finite rather than
  // becoming NaN and killing the render loop, which is its real job.
  it("stays finite even through a near-direct hit, though energy is not conserved", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      { name: "BH", x: -14, y: -0.001, vx: 5, vy: 0, mass: 8, isIntruder: true, active: true },
    ];
    integrate(bodies, 4);

    for (const b of bodies) {
      expect(Number.isFinite(b.x), `${b.name}.x`).toBe(true);
      expect(Number.isFinite(b.y), `${b.name}.y`).toBe(true);
      expect(Number.isFinite(b.vx), `${b.name}.vx`).toBe(true);
      expect(Number.isFinite(b.vy), `${b.name}.vy`).toBe(true);
    }
    expect(Number.isFinite(totalEnergy(bodies))).toBe(true);
  });

  it("conserves energy better at a smaller step, as a second-order scheme should", () => {
    const run = (dt: number) => {
      const bodies = [sun(), planetAt(1), planetAt(1.9)];
      const before = totalEnergy(bodies);
      integrate(bodies, 4, dt);
      return Math.abs((totalEnergy(bodies) - before) / before);
    };
    const coarse = run(0.0008);
    const fine = run(0.0002);
    // Quartering the step should cut the error, not grow it.
    expect(fine).toBeLessThan(coarse);
  });

  it("is deterministic", () => {
    const run = () => {
      const bodies = [sun(), planetAt(1), planetAt(1.7)];
      integrate(bodies, 2);
      return bodies.map((b) => `${b.x},${b.y},${b.vx},${b.vy}`).join("|");
    };
    expect(run()).toBe(run());
  });
});

describe("barycentre", () => {
  it("sits at the mass-weighted midpoint", () => {
    const c = barycenter([
      { name: "a", x: 0, y: 0, vx: 0, vy: 0, mass: 3 },
      { name: "b", x: 4, y: 0, vx: 0, vy: 0, mass: 1 },
    ]);
    expect(c.x).toBeCloseTo(1, 10);
    expect(c.mass).toBe(4);
  });

  it("counts only the stars, since that is what planets orbit", () => {
    const bodies = [sun({ x: 0 }), sun({ name: "B", x: 10 }), planetAt(1)];
    expect(stellarBarycenter(bodies).x).toBeCloseTo(5, 10);
    expect(stellarBarycenter(bodies).mass).toBe(2);
  });

  it("is safe on an empty set", () => {
    expect(barycenter([]).mass).toBe(0);
  });
});

describe("orbital energy and ejection", () => {
  it("reports a bound planet as negative energy", () => {
    const bodies = [sun(), planetAt(1)];
    expect(specificOrbitalEnergy(bodies[1], stellarBarycenter(bodies))).toBeLessThan(0);
  });

  it("reports an escaping planet as positive energy", () => {
    const bodies = [sun(), planetAt(1, { vy: 12 })];
    expect(specificOrbitalEnergy(bodies[1], stellarBarycenter(bodies))).toBeGreaterThan(0);
  });

  it("does not call a bound planet ejected however fast it moves at periapsis", () => {
    // Energy alone would be misleading here; the distance condition saves it.
    const bodies = [sun(), planetAt(1, { vy: circularSpeed(1, 1) * 1.3 })];
    expect(ejectedBodies(bodies).size).toBe(0);
  });

  it("calls a planet ejected once it is unbound and far away", () => {
    const bodies = [sun(), planetAt(1, { x: 40, vx: 9, vy: 0, a: 1 })];
    expect(ejectedBodies(bodies).has("P1")).toBe(true);
  });

  it("never counts stars or the intruder as ejected", () => {
    const bodies: Body[] = [
      sun(),
      { name: "far star", x: 500, y: 0, vx: 40, vy: 0, mass: 1, isStar: true },
      { name: "BH", x: 500, y: 0, vx: 40, vy: 0, mass: 5, isIntruder: true, active: true },
    ];
    expect(ejectedBodies(bodies).size).toBe(0);
  });
});

describe("encounter classification", () => {
  const reach = 5;

  it("awaits launch before the intruder is live", () => {
    const bodies = [sun(), planetAt(1)];
    expect(classifyEncounter(bodies, false, reach).status).toBe("awaiting");
  });

  it("reports perturbed while the intruder is inside the system", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      { name: "BH", x: 3, y: 0, vx: 0, vy: 0, mass: 5, isIntruder: true, active: true },
    ];
    expect(classifyEncounter(bodies, true, reach).status).toBe("perturbed");
  });

  it("reports post-encounter once the intruder is well clear", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      { name: "BH", x: 400, y: 0, vx: 0, vy: 0, mass: 5, isIntruder: true, active: true },
    ];
    expect(classifyEncounter(bodies, true, reach).status).toBe("post-encounter");
  });

  it("escalates to disrupted once 40 percent of the planets are gone", () => {
    const gone = (n: number, a: number): Body => ({
      name: `gone${n}`,
      x: 200,
      y: 0,
      vx: 30,
      vy: 0,
      mass: M_JUPITER,
      isPlanet: true,
      a,
    });
    const bodies: Body[] = [sun(), planetAt(1), planetAt(2), gone(1, 3), gone(2, 4)];
    const { status, ejected } = classifyEncounter(bodies, true, reach);
    expect(ejected.size).toBe(2);
    expect(status).toBe("disrupted");
  });

  it("reports a single loss as ejecting, not disruption", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      planetAt(2),
      planetAt(3),
      planetAt(4),
      planetAt(5),
      { name: "gone", x: 200, y: 0, vx: 30, vy: 0, mass: M_JUPITER, isPlanet: true, a: 6 },
      { name: "BH", x: 3, y: 0, vx: 0, vy: 0, mass: 5, isIntruder: true, active: true },
    ];
    expect(classifyEncounter(bodies, true, reach).status).toBe("ejecting");
  });
});

describe("a black hole passing through actually disrupts the system", () => {
  it("ejects at least one planet from a Sun-like system", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      planetAt(1.6),
      planetAt(2.4),
      {
        name: "BH",
        x: -10,
        y: -1.5,
        vx: 6,
        vy: 0.6,
        mass: 12,
        isIntruder: true,
        active: true,
      },
    ];
    integrate(bodies, 6, 0.00005);
    // Not a claim about which planet; a 12 solar mass black hole crossing at
    // this distance should cost the system something.
    expect(ejectedBodies(bodies).size).toBeGreaterThan(0);
  });

  it("leaves the system alone when the intruder never launches", () => {
    const bodies: Body[] = [
      sun(),
      planetAt(1),
      planetAt(1.6),
      { name: "BH", x: -10, y: -1.5, vx: 6, vy: 0.6, mass: 12, isIntruder: true, active: false },
    ];
    integrate(bodies, 3, 0.0001, false);
    expect(ejectedBodies(bodies).size).toBe(0);
    // And the parked intruder has not moved.
    expect(bodies[3].x).toBe(-10);
  });
});
