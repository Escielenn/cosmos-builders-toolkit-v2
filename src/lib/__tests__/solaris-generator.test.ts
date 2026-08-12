import { describe, it, expect } from "vitest";
import { generateSystem } from "@/components/solaris/generator";
import type { GenerateConditions } from "@/components/solaris/generator";

// A condition that only *usually* holds is a broken condition, so every case
// runs across many seeds rather than one lucky one.
const SEEDS = Array.from({ length: 40 }, (_, i) => `seed-${i}`);

const withCond = (conditions: GenerateConditions, seed: string, planetCount?: number) =>
  generateSystem({ seed, conditions, planetCount });

// Two fields are deliberately not reproducible: `generatedAt` is a wall-clock
// timestamp, and planet `id` is minted from Date.now() so that adding a planet
// to a live system can never collide with an existing one. Ids are for engine
// reconciliation, not identity, and a save carries its own snapshot of them.
const comparable = (sys: ReturnType<typeof generateSystem>) => ({
  ...sys,
  generatedAt: null,
  planets: sys.planets.map((p) => ({ ...p, id: null })),
});

describe("determinism", () => {
  it("gives the same system for the same seed", () => {
    expect(comparable(generateSystem({ seed: "sol" }))).toEqual(
      comparable(generateSystem({ seed: "sol" })),
    );
  });

  it("gives different systems for different seeds", () => {
    const a = generateSystem({ seed: "one" });
    const b = generateSystem({ seed: "two" });
    expect(a.planets.map((p) => p.type).join()).not.toBe(b.planets.map((p) => p.type).join());
  });

  it("honours an explicit planet count", () => {
    for (const n of [1, 3, 5, 9, 12]) {
      expect(generateSystem({ seed: "n", planetCount: n }).planets).toHaveLength(n);
    }
  });
});

describe("condition: habitable", () => {
  it("always yields a genuinely habitable world in the zone", () => {
    for (const seed of SEEDS) {
      const sys = withCond({ habitable: true }, seed);
      const good = sys.planets.filter(
        (p) =>
          p.inHabitableZone &&
          ["Terrestrial", "Ocean World", "Super-Earth", "Water World", "Hycean", "Jungle"].includes(
            p.meta?.displayName ?? "",
          ),
      );
      expect(good.length, `seed ${seed} produced none`).toBeGreaterThan(0);
    }
  });

  it("holds even when there is only one planet to work with", () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const sys = withCond({ habitable: true }, seed, 1);
      expect(sys.planets).toHaveLength(1);
      expect(sys.planets[0].meta?.band, `seed ${seed}`).toBe("habitable");
    }
  });

  it("does not fill the whole zone with habitable worlds", () => {
    // Asking for one habitable world should not remove all variety.
    const types = new Set<string>();
    for (const seed of SEEDS) {
      withCond({ habitable: true }, seed, 8).planets.forEach((p) =>
        types.add(p.meta?.displayName ?? p.type),
      );
    }
    expect(types.size).toBeGreaterThan(6);
  });
});

describe("condition: gas giant", () => {
  it("always yields a gas giant", () => {
    for (const seed of SEEDS) {
      const sys = withCond({ gasGiant: true }, seed);
      expect(
        sys.planets.some((p) => p.type === "gas-giant"),
        `seed ${seed} produced none`,
      ).toBe(true);
    }
  });
});

describe("condition: tidal lock", () => {
  it("always yields a tidally locked world", () => {
    for (const seed of SEEDS) {
      const sys = withCond({ tidalLock: true }, seed);
      const locked = sys.planets.filter((p) => p.meta?.displayName === "Tidal Lock");
      expect(locked.length, `seed ${seed} produced none`).toBeGreaterThan(0);
      // The generator zeroes axial tilt for this archetype; a locked world that
      // still reports a tilt would contradict the continuity engine.
      expect(locked[0].axialTiltDeg).toBe(0);
    }
  });

  it("survives being combined with habitable, which the original loses", () => {
    // In the static simulator the habitable rule overwrites the pool after the
    // tidal rule, so both switched on silently drops the lock.
    for (const seed of SEEDS) {
      const sys = withCond({ habitable: true, tidalLock: true }, seed);
      expect(
        sys.planets.some((p) => p.meta?.displayName === "Tidal Lock"),
        `seed ${seed} lost the tidal lock`,
      ).toBe(true);
    }
  });
});

describe("condition: rogue", () => {
  it("makes the outermost body a rogue world", () => {
    for (const seed of SEEDS) {
      const sys = withCond({ rogue: true }, seed);
      const outermost = sys.planets[sys.planets.length - 1];
      expect(outermost.meta?.displayName, `seed ${seed}`).toBe("Rogue World");
    }
  });
});

describe("all conditions at once", () => {
  it("satisfies every one of them together", () => {
    for (const seed of SEEDS) {
      const sys = withCond(
        { habitable: true, gasGiant: true, tidalLock: true, rogue: true },
        seed,
        8,
      );
      const names = sys.planets.map((p) => p.meta?.displayName ?? "");
      expect(names, `seed ${seed}`).toContain("Tidal Lock");
      expect(sys.planets.some((p) => p.type === "gas-giant"), `seed ${seed}`).toBe(true);
      expect(names[names.length - 1], `seed ${seed}`).toBe("Rogue World");
    }
  });

  it("stays deterministic with conditions applied", () => {
    const opts = { seed: "fixed", conditions: { habitable: true, rogue: true }, planetCount: 6 };
    const a = generateSystem(opts);
    const b = generateSystem(opts);
    expect(a.planets.map((p) => p.name + p.semiMajorAxisAU)).toEqual(
      b.planets.map((p) => p.name + p.semiMajorAxisAU),
    );
  });
});

describe("physical sanity of generated systems", () => {
  it("keeps Kepler's third law between orbit and period", () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const sys = generateSystem({ seed });
      const mass = (sys.stars ?? [sys.star]).reduce((s, st) => s + st.massSOL, 0);
      for (const p of sys.planets) {
        const expected = Math.sqrt(p.semiMajorAxisAU ** 3 / Math.max(mass, 0.05));
        // Stored rounded to 3dp, so allow a little slack.
        expect(Math.abs(p.orbitalPeriodYears - expected)).toBeLessThan(0.01);
      }
    }
  });

  it("orders planets outward and never collides two orbits", () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const sys = generateSystem({ seed });
      for (let i = 1; i < sys.planets.length; i++) {
        expect(sys.planets[i].semiMajorAxisAU).toBeGreaterThan(
          sys.planets[i - 1].semiMajorAxisAU,
        );
      }
    }
  });

  it("agrees with itself about which planets are in the habitable zone", () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const sys = generateSystem({ seed });
      const { habitableZoneInnerAU: inner, habitableZoneOuterAU: outer } = sys.star;
      expect(outer).toBeGreaterThan(inner);
      for (const p of sys.planets) {
        const inside = p.semiMajorAxisAU >= inner && p.semiMajorAxisAU <= outer;
        expect(p.inHabitableZone, `${p.name} at ${p.semiMajorAxisAU} AU`).toBe(inside);
      }
    }
  });

  it("gives every body a name", () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const sys = generateSystem({ seed });
      expect(sys.name).toBeTruthy();
      sys.planets.forEach((p) => expect(p.name).toBeTruthy());
      (sys.stars ?? []).forEach((s) => expect(s.name).toBeTruthy());
    }
  });
});

describe("architecture", () => {
  it("produces the requested star count", () => {
    const counts: Record<string, number> = { single: 1, binary: 2, trinary: 3, quaternary: 4 };
    for (const [arch, n] of Object.entries(counts)) {
      const sys = generateSystem({ seed: "arch", architecture: arch as "single" });
      expect(sys.stars ?? [sys.star], arch).toHaveLength(n);
      expect(sys.architecture).toBe(arch);
    }
  });

  it("keeps stars[0] and star the same object's data", () => {
    const sys = generateSystem({ seed: "arch", architecture: "trinary" });
    expect(sys.stars?.[0].name).toBe(sys.star.name);
    // The HZ realignment writes onto the primary; both views must agree.
    expect(sys.stars?.[0].habitableZoneInnerAU).toBe(sys.star.habitableZoneInnerAU);
  });
});
