import { describe, it, expect } from "vitest";
import {
  SYSTEMS,
  INTRUDER_TYPES,
  starTypeFromMass,
  starColor,
  intruderMass,
  systemScale,
  orbitalPhase,
  buildBodies,
  buildIntruder,
  defaultIntruder,
} from "@/lib/simulators/rogue-systems";
import {
  step,
  barycenter,
  stellarBarycenter,
  totalMomentum,
  specificOrbitalEnergy,
  ejectedBodies,
  M_JUPITER,
  M_EARTH,
  type Body,
} from "@/lib/simulators/nbody";

const systemKeys = Object.keys(SYSTEMS);

describe("scenario data is internally consistent", () => {
  it("has every system the UI offers", () => {
    expect(systemKeys).toEqual(
      expect.arrayContaining(["solar", "trappist", "kepler90", "proxima", "alphacen"]),
    );
  });

  it.each(systemKeys)("%s is well formed", (key) => {
    const sys = SYSTEMS[key];
    expect(sys.name).toBeTruthy();
    expect(sys.starMass).toBeGreaterThan(0);
    expect(sys.planets.length).toBeGreaterThan(0);
    expect(sys.habZone[1]).toBeGreaterThan(sys.habZone[0]);
    expect(sys.defaultZoom).toBeGreaterThan(0);

    for (const p of sys.planets) {
      expect(p.name, `${key} planet name`).toBeTruthy();
      expect(p.a, `${key} ${p.name} orbit`).toBeGreaterThan(0);
      expect(p.mass, `${key} ${p.name} mass`).toBeGreaterThan(0);
      // Nothing here should be remotely stellar.
      expect(p.mass, `${key} ${p.name} mass`).toBeLessThan(0.05);
      expect(p.color, `${key} ${p.name} colour`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("lists planets in ascending orbit, which the readout assumes", () => {
    for (const key of systemKeys) {
      const orbits = SYSTEMS[key].planets.map((p) => p.a);
      for (let i = 1; i < orbits.length; i++) {
        expect(orbits[i], `${key} planet ${i}`).toBeGreaterThan(orbits[i - 1]);
      }
    }
  });

  it("keeps the published figures for bodies worth spot-checking", () => {
    const solar = SYSTEMS.solar;
    const earth = solar.planets.find((p) => p.name === "Earth");
    expect(earth?.a).toBe(1.0);
    expect(earth?.mass).toBeCloseTo(M_EARTH, 12);

    const jupiter = solar.planets.find((p) => p.name === "Jupiter");
    expect(jupiter?.a).toBeCloseTo(5.203, 3);
    expect(jupiter?.mass).toBeCloseTo(M_JUPITER, 5);

    // TRAPPIST-1 is an ultra-cool dwarf, under a tenth of a solar mass.
    expect(SYSTEMS.trappist.starMass).toBeLessThan(0.1);
    // Proxima b sits in its star's habitable zone; that is the point of it.
    const proxB = SYSTEMS.proxima.planets.find((p) => p.name === "Prox b");
    const [hzIn, hzOut] = SYSTEMS.proxima.habZone;
    expect(proxB!.a).toBeGreaterThanOrEqual(hzIn);
    expect(proxB!.a).toBeLessThanOrEqual(hzOut);
  });
});

describe("star classification", () => {
  it("maps mass to spectral class at the documented boundaries", () => {
    expect(starTypeFromMass(20)).toBe("O");
    expect(starTypeFromMass(3)).toBe("B");
    expect(starTypeFromMass(1.6)).toBe("A");
    expect(starTypeFromMass(1.1)).toBe("F");
    expect(starTypeFromMass(1.0)).toBe("G");
    expect(starTypeFromMass(0.6)).toBe("K");
    expect(starTypeFromMass(0.1)).toBe("M");
  });

  it("gives the Sun a G and a yellow", () => {
    expect(starTypeFromMass(1.0)).toBe("G");
    expect(starColor("G")).toBe("#ffd43b");
  });

  it("falls back rather than returning undefined for a bad class", () => {
    expect(starColor("Z")).toBe(STAR_FALLBACK);
  });
});
const STAR_FALLBACK = "#ffd43b";

describe("intruder mass", () => {
  it("reads black holes directly in solar masses", () => {
    const min = intruderMass("bh", 0);
    const max = intruderMass("bh", 1);
    expect(min.solar).toBeCloseTo(3, 6);
    expect(max.solar).toBeCloseTo(100, 6);
    expect(max.display).toContain("M☉");
  });

  it("converts Jupiter masses to solar for the physics but shows Mⱼ", () => {
    const bd = intruderMass("bd", 0);
    // 13 Jupiter masses is the brown dwarf floor.
    expect(bd.display).toBe("13.0 Mⱼ");
    expect(bd.solar).toBeCloseTo(13 * M_JUPITER, 12);
  });

  it("keeps a rogue planet far lighter than a brown dwarf", () => {
    expect(intruderMass("rp", 1).solar).toBeLessThanOrEqual(intruderMass("bd", 0).solar);
  });

  it("clamps a slider outside 0 to 1", () => {
    expect(intruderMass("bh", -5).solar).toBeCloseTo(INTRUDER_TYPES.bh.min, 6);
    expect(intruderMass("bh", 9).solar).toBeCloseTo(INTRUDER_TYPES.bh.max, 6);
  });
});

describe("per-system control ranges", () => {
  it("adapts to systems four orders of magnitude apart", () => {
    const trappist = systemScale(SYSTEMS.trappist);
    const solar = systemScale(SYSTEMS.solar);
    // TRAPPIST-1's outermost planet is at 0.062 AU, but systemScale floors the
    // max orbit at 0.1 so a hyper-compact system still gets usable ranges.
    expect(trappist.extentAU).toBeLessThanOrEqual(0.1);
    expect(solar.extentAU).toBeGreaterThan(29);
    // A single fixed slider range could not serve both.
    expect(solar.distMax / trappist.distMax).toBeGreaterThan(50);
  });

  it("keeps every default inside its own range", () => {
    for (const key of systemKeys) {
      const s = systemScale(SYSTEMS[key]);
      expect(s.distDefault, `${key} dist`).toBeGreaterThanOrEqual(s.distMin);
      expect(s.distDefault, `${key} dist`).toBeLessThanOrEqual(s.distMax);
      expect(s.speedDefault, `${key} speed`).toBeGreaterThanOrEqual(s.speedMin);
      expect(s.speedDefault, `${key} speed`).toBeLessThanOrEqual(s.speedMax);
      expect(s.distStep).toBeGreaterThan(0);
    }
  });

  it("counts a binary's separation toward the system's reach", () => {
    const s = systemScale(SYSTEMS.alphacen);
    // Planets only reach 2 AU, but the stars are 23 AU apart.
    expect(s.extentAU).toBeGreaterThan(2);
  });

  it("scales default speed with orbital velocity, so it means something", () => {
    // TRAPPIST-1's planets move far faster than ours, so its slider must reach
    // higher even though the star is tiny.
    expect(systemScale(SYSTEMS.trappist).speedMax).toBeGreaterThan(
      systemScale(SYSTEMS.solar).speedMax,
    );
  });
});

describe("orbital phase spreads the planets", () => {
  it("never repeats a bearing", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const deg = ((orbitalPhase(i) * 180) / Math.PI) % 360;
      const bucket = Math.round(deg / 5);
      expect(seen.has(String(bucket)), `phase ${i} collided`).toBe(false);
      seen.add(String(bucket));
    }
  });
});

describe("body layout", () => {
  it("builds a star plus every planet", () => {
    const bodies = buildBodies(SYSTEMS.solar);
    expect(bodies.filter((b) => b.isStar)).toHaveLength(1);
    expect(bodies.filter((b) => b.isPlanet)).toHaveLength(SYSTEMS.solar.planets.length);
  });

  it("places each planet at its own semi-major axis", () => {
    const bodies = buildBodies(SYSTEMS.solar);
    for (const p of SYSTEMS.solar.planets) {
      const body = bodies.find((b) => b.name === p.name)!;
      expect(Math.hypot(body.x, body.y)).toBeCloseTo(p.a, 6);
    }
  });

  it("gives every planet a velocity perpendicular to its radius", () => {
    // This is what makes the orbit circular instead of a plunge into the star.
    for (const b of buildBodies(SYSTEMS.solar).filter((x) => x.isPlanet)) {
      const dot = b.x * b.vx + b.y * b.vy;
      const scale = Math.hypot(b.x, b.y) * Math.hypot(b.vx, b.vy);
      expect(Math.abs(dot) / scale).toBeLessThan(1e-9);
    }
  });

  it("gives circular speed, so orbits are stable rather than falling in", () => {
    const bodies = buildBodies(SYSTEMS.solar);
    for (const p of SYSTEMS.solar.planets) {
      const b = bodies.find((x) => x.name === p.name)!;
      expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(Math.sqrt((4 * Math.PI ** 2) / p.a), 6);
    }
  });

  it("leaves every planet bound", () => {
    for (const key of systemKeys) {
      const bodies = buildBodies(SYSTEMS[key]);
      const centre = stellarBarycenter(bodies);
      for (const b of bodies.filter((x) => x.isPlanet)) {
        expect(specificOrbitalEnergy(b, centre), `${key} ${b.name}`).toBeLessThan(0);
      }
      expect(ejectedBodies(bodies).size, key).toBe(0);
    }
  });
});

describe("binary layout", () => {
  const bodies = buildBodies(SYSTEMS.alphacen);
  const stars = bodies.filter((b) => b.isStar);

  it("creates two stars", () => {
    expect(stars).toHaveLength(2);
  });

  it("puts the barycentre at the origin, not on the primary", () => {
    // Offsetting the companion without moving the primary would leave the pair
    // lurching around a point that is not their centre of mass.
    const c = barycenter(stars);
    expect(c.x).toBeCloseTo(0, 9);
    expect(c.y).toBeCloseTo(0, 9);
  });

  it("separates them by the published distance", () => {
    const sep = Math.hypot(stars[0].x - stars[1].x, stars[0].y - stars[1].y);
    expect(sep).toBeCloseTo(SYSTEMS.alphacen.binary!.separation, 6);
  });

  it("gives the pair zero net momentum, so the system does not drift", () => {
    const p = totalMomentum(stars);
    expect(p.px).toBeCloseTo(0, 9);
    expect(p.py).toBeCloseTo(0, 9);
  });

  it("weights each star's speed by the other's mass", () => {
    // The lighter star moves faster; that ratio is the mass ratio inverted.
    const [a, b] = stars;
    const speedA = Math.hypot(a.vx, a.vy);
    const speedB = Math.hypot(b.vx, b.vy);
    expect(speedB / speedA).toBeCloseTo(a.mass / b.mass, 6);
  });

  it("holds the pair together over several orbits", () => {
    const live = buildBodies(SYSTEMS.alphacen);
    const seps: number[] = [];
    for (let i = 0; i < 6000; i++) {
      step(live, 0.002, true);
      if (i % 1000 === 0) {
        const s = live.filter((b) => b.isStar);
        seps.push(Math.hypot(s[0].x - s[1].x, s[0].y - s[1].y));
      }
    }
    // A circular binary should keep a near-constant separation.
    for (const s of seps) expect(s).toBeCloseTo(SYSTEMS.alphacen.binary!.separation, 0);
  });
});

describe("the intruder", () => {
  it("starts parked and inactive", () => {
    const cfg = defaultIntruder(SYSTEMS.solar);
    const i = buildIntruder(SYSTEMS.solar, cfg);
    expect(i.isIntruder).toBe(true);
    expect(i.active).toBe(false);
  });

  it("starts outside the system it is aimed at", () => {
    for (const key of systemKeys) {
      const sys = SYSTEMS[key];
      const i = buildIntruder(sys, defaultIntruder(sys));
      const reach = systemScale(sys).extentAU;
      expect(Math.hypot(i.x, i.y), `${key}`).toBeGreaterThan(reach);
    }
  });

  it("moves inward, not away", () => {
    const sys = SYSTEMS.solar;
    const i = buildIntruder(sys, { ...defaultIntruder(sys), angleDeg: 0 });
    // Positioned at negative x with positive vx: heading toward the system.
    expect(i.x).toBeLessThan(0);
    expect(i.vx).toBeGreaterThan(0);
  });

  it("applies the impact parameter across the approach", () => {
    const sys = SYSTEMS.solar;
    const head = buildIntruder(sys, { ...defaultIntruder(sys), distanceAU: 0, angleDeg: 0 });
    const grazing = buildIntruder(sys, { ...defaultIntruder(sys), distanceAU: 8, angleDeg: 0 });
    // Offsetting it is what turns a collision course into a flyby.
    expect(head.y).toBeCloseTo(0, 6);
    expect(grazing.y).toBeCloseTo(8, 6);
  });

  it("respects the approach bearing", () => {
    const sys = SYSTEMS.solar;
    const cfg = { ...defaultIntruder(sys), distanceAU: 0 };
    const east = buildIntruder(sys, { ...cfg, angleDeg: 0 });
    const north = buildIntruder(sys, { ...cfg, angleDeg: 90 });
    expect(Math.abs(east.vy)).toBeLessThan(1e-9);
    expect(Math.abs(north.vx)).toBeLessThan(1e-9);
  });

  it("carries the mass the slider asked for", () => {
    const sys = SYSTEMS.solar;
    const i = buildIntruder(sys, { ...defaultIntruder(sys), kind: "bh", massFraction: 1 });
    expect(i.mass).toBeCloseTo(100, 6);
  });

  it("exerts no influence while parked", () => {
    const withIntruder = buildBodies(SYSTEMS.solar, defaultIntruder(SYSTEMS.solar));
    const without = buildBodies(SYSTEMS.solar);
    for (let i = 0; i < 400; i++) {
      step(withIntruder, 0.0005, false);
      step(without, 0.0005, false);
    }
    const earthA = withIntruder.find((b) => b.name === "Earth")!;
    const earthB = without.find((b) => b.name === "Earth")!;
    expect(earthA.x).toBeCloseTo(earthB.x, 10);
    expect(earthA.y).toBeCloseTo(earthB.y, 10);
  });
});

describe("a launched black hole disrupts a real system", () => {
  it("costs the Solar System planets", () => {
    const sys = SYSTEMS.solar;
    const bodies = buildBodies(sys, {
      kind: "bh",
      massFraction: 0.5,
      distanceAU: 2,
      speedKmS: 30,
      angleDeg: 0,
    }) as Body[];
    const intruder = bodies.find((b) => b.isIntruder)!;
    intruder.active = true;

    for (let i = 0; i < 60000; i++) step(bodies, 0.0004, true);

    // A ~50 solar mass black hole crossing at 2 AU should not leave eight
    // planets neatly in place.
    expect(ejectedBodies(bodies).size).toBeGreaterThan(0);
  });
});
