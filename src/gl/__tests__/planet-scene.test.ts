// ---------------------------------------------------------------------------
// PlanetScene's physics: every visual property is a function of the facts.
// Each test names the physical claim it checks and the number it checks it
// against, so a regression reads as "Earth's sky stopped being blue", not
// "expected 0.41 to be greater than 0.5".
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { bindPlanetScene, annualInsolationShape, sudarskyClass, EMPTY_FACTS } from "../bind/planet-scene";
import { PLANET_PRESETS, presetById } from "../bind/planet-presets";
import { earthRayleighTau, parseGasMix, scattering } from "../materials/scattering";
import { STAR_CORE_MAX, blackbodyHue, kelvinToRGB, starCoreRadiance } from "../materials/blackbody";
import { heightField, paintSurface, quantile, vegetationReflectance } from "../materials/terrain";

const bind = (id: string) => bindPlanetScene(presetById(id)!.facts);

describe("scattering (Rayleigh, two colours)", () => {
  it("reproduces Earth's sea-level optical depth at 550 nm (Bucholtz 1995: 0.097)", () => {
    expect(earthRayleighTau(0.55)).toBeCloseTo(0.098, 2);
    expect(earthRayleighTau(0.44)).toBeGreaterThan(2 * earthRayleighTau(0.55));
  });

  it("parses compositions as writers type them", () => {
    expect(parseGasMix("N2 78%, O2 21%").fractions.N2).toBeCloseTo(0.788, 2);
    expect(parseGasMix("N₂/CO₂").fractions.CO2).toBeCloseTo(0.5, 5);
    expect(parseGasMix("mostly nitrogen with methane").recognised).toBe(true);
    expect(parseGasMix("").recognised).toBe(false);
  });

  it("gives Earth a blue limb and an orange terminator", () => {
    const s = scattering({ composition: "N2 78%, O2 21%", pressureBar: 1, gravityMs2: 9.81, starColour: blackbodyHue(5772) });
    expect(s.scatter.b).toBe(1);
    expect(s.scatter.r).toBeLessThan(0.4);
    expect(s.sunset.r).toBe(1);
    expect(s.sunset.b).toBeLessThan(0.3);
  });

  it("draws no shell at all for an airless world", () => {
    expect(scattering({ composition: null, pressureBar: 0, gravityMs2: 9.8, starColour: blackbodyHue(3000) }).present).toBe(false);
  });

  it("thickens with pressure: the G2 test, 0.6 → 1.4 bar", () => {
    const at = (p: number) => scattering({ composition: "N2/CO2", pressureBar: p, gravityMs2: 9.8, starColour: blackbodyHue(4600) }).density;
    expect(at(1.4)).toBeGreaterThan(at(0.6) * 1.8);
  });

  it("turns methane skies cyan (red absorbed; Karkoschka 1994)", () => {
    const s = scattering({ composition: "H2 80%, He 17%, CH4 3%", pressureBar: 5, gravityMs2: 11, starColour: blackbodyHue(5772) });
    expect(s.scatter.r).toBeLessThan(s.scatter.g);
  });

  it("lets a Venus-thick atmosphere swallow the grazing light", () => {
    const s = scattering({ composition: "CO2 96.5%, N2 3.5%", pressureBar: 92, gravityMs2: 8.87, starColour: blackbodyHue(5772) });
    expect(s.sunsetStrength).toBeLessThan(1e-6);
    expect(s.density).toBeGreaterThan(0.99);
  });
});

describe("HDR star core", () => {
  it("never exceeds the core ceiling, at any gain", () => {
    for (const gain of [1, 3, 10, 100]) {
      const c = starCoreRadiance(kelvinToRGB(5772), gain);
      expect(Math.max(c.r, c.g, c.b)).toBeLessThanOrEqual(STAR_CORE_MAX);
    }
  });

  it("keeps each class's hue: channel ratios survive the soft clip", () => {
    for (const k of [3000, 4400, 5772, 6600, 18000]) {
      const base = kelvinToRGB(k);
      const hot = starCoreRadiance(base, 50);
      const m = Math.max(base.r, base.g, base.b);
      const mh = Math.max(hot.r, hot.g, hot.b);
      expect(hot.r / mh).toBeCloseTo(base.r / m, 6);
      expect(hot.b / mh).toBeCloseTo(base.b / m, 6);
    }
  });

  it("an M-dwarf core stays red, not white, at bloom-driving gain", () => {
    const c = starCoreRadiance(kelvinToRGB(3000), 20);
    expect(c.r).toBeGreaterThan(1);
    expect(c.b).toBeLessThan(c.r * 0.5);
  });
});

describe("bindPlanetScene: physics, not tuning", () => {
  it("puts Earth's mean near 288 K and its poles below the ice line", () => {
    const b = bind("earth");
    expect(b.temperature.mean).toBeGreaterThan(280);
    expect(b.temperature.mean).toBeLessThan(296);
    expect(b.temperature.at(0, 0)).toBeGreaterThan(292);
    expect(b.temperature.at(90, 0)).toBeLessThan(b.water.seaIceK);
  });

  it("uses the North et al. insolation shape (Earth: equator 1.24, pole 0.52)", () => {
    expect(annualInsolationShape(0, 23.44)).toBeCloseTo(1.238, 2);
    expect(annualInsolationShape(90, 23.44)).toBeCloseTo(0.523, 2);
  });

  it("gives a locked world a hot substellar point and a frozen far side", () => {
    const b = bind("eyeball");
    expect(b.tidallyLocked).toBe(true);
    expect(b.spinRate).toBe(0);
    expect(b.temperature.at(0, 0)).toBeGreaterThan(b.water.freezeK);
    expect(b.temperature.at(0, 180)).toBeLessThan(b.water.seaIceK);
    expect(b.water.bandDeg).not.toBeNull();
  });

  it("draws an airless world with a knife-edge terminator and no sky", () => {
    const b = bind("airless-m-dwarf");
    expect(b.atmosphere.present).toBe(false);
    expect(b.atmosphere.terminatorSoftness).toBe(0);
    expect(b.clouds.coverage).toBe(0);
  });

  it("shrouds a Venus analogue in a sulphuric deck at Venus-like heat", () => {
    const b = bind("venus");
    expect(b.temperature.mean).toBeGreaterThan(600);
    expect(b.clouds.coverage).toBe(1);
    expect(b.clouds.colourKey).toBe("sulphuric");
    expect(b.atmosphere.terminatorSoftness).toBeGreaterThan(bind("earth").atmosphere.terminatorSoftness);
  });

  it("gives the ringed giant icy rings (beyond the snow line) and Sudarsky class I", () => {
    const b = bind("ringed-giant");
    expect(b.kind).toBe("gas");
    expect(b.sudarsky).toBe("I");
    expect(b.rings?.material).toBe("ice");
    expect(sudarskyClass(1000)).toBe("IV");
  });

  it("lights cities only when canon says someone lives there", () => {
    const earth = presetById("earth")!.facts;
    expect(bindPlanetScene(earth).cityLights).toBe(true);
    expect(bindPlanetScene({ ...earth, civilisation: null }).cityLights).toBe(false);
  });

  it("sizes the star from R★/a: an M dwarf looms over a close-in world", () => {
    expect(bind("eyeball").star.angularRadius).toBeGreaterThan(bind("earth").star.angularRadius * 3);
  });

  it("decides locking from the despin time when canon is silent, and says so", () => {
    const b = bindPlanetScene({ ...presetById("airless-m-dwarf")!.facts, tidallyLocked: null });
    expect(b.tidallyLocked).toBe(true);
    expect(b.notes.some((n) => /Gladman/.test(n))).toBe(true);
    const e = bindPlanetScene({ ...presetById("earth")!.facts, tidallyLocked: null });
    expect(e.tidallyLocked).toBe(false);
  });

  it("labels every inference on an empty input instead of inventing quietly", () => {
    const b = bindPlanetScene(EMPTY_FACTS);
    expect(b.notes.length).toBeGreaterThan(4);
    expect(b.atmosphere.present).toBe(false);
  });

  it("binds every preset without throwing", () => {
    for (const p of PLANET_PRESETS) expect(() => bindPlanetScene(p.facts)).not.toThrow();
  });
});

describe("terrain", () => {
  const W = 128;

  it("is deterministic per seed and differs between seeds", () => {
    expect(heightField(3, W).data[500]).toBe(heightField(3, W).data[500]);
    expect(heightField(4, W).data[500]).not.toBe(heightField(3, W).data[500]);
  });

  it("puts exactly the hydrosphere fraction under water", () => {
    const maps = paintSurface(bind("earth"), W);
    expect(maps.stats.ocean).toBeCloseTo(0.71, 2);
    expect(maps.seaLevel).toBe(quantile(heightField(3, W).sorted, 0.71));
  });

  it("caps Earth's poles with ice and leaves its tropics open", () => {
    const maps = paintSurface(bind("earth"), W);
    const iceAtRow = (j: number) => {
      let n = 0;
      for (let i = 0; i < W; i++) if (maps.props[(j * W + i) * 4 + 2] > 128) n++;
      return n / W;
    };
    expect(iceAtRow(1)).toBeGreaterThan(0.9); // south pole row
    expect(iceAtRow(W / 4)).toBeLessThan(0.05); // equator
  });

  it("freezes a locked world's far side and keeps water liquid toward the star", () => {
    const b = bind("eyeball");
    const maps = paintSurface(b, W);
    const H = W / 2;
    const at = (lon: number) => {
      const i = Math.round(((lon + 180) / 360) * W - 0.5);
      let water = 0;
      let ice = 0;
      for (let j = H / 4; j < (3 * H) / 4; j++) {
        const o = (j * W + i) * 4;
        water += maps.props[o + 1];
        ice += maps.props[o + 2];
      }
      return { water, ice };
    };
    expect(at(178).ice).toBeGreaterThan(at(0).ice);
    expect(at(0).water + at(30).water).toBeGreaterThan(0);
  });

  it("emits city light only with a civilisation", () => {
    const earth = presetById("earth")!.facts;
    expect(paintSurface(bindPlanetScene(earth), W).stats.lit).toBeGreaterThan(0);
    expect(paintSurface(bindPlanetScene({ ...earth, civilisation: false }), W).stats.lit).toBe(0);
  });

  it("darkens plants under M dwarfs (Kiang et al. 2007)", () => {
    const m = vegetationReflectance(3000);
    const g = vegetationReflectance(5772);
    expect(m.g).toBeLessThan(g.g * 0.5);
  });

  it("paints a standard-tier map inside the frame budget's slack", () => {
    // Cold path (height field) plus warm path (colouring) at 512 × 256.
    const b = bind("earth");
    const t0 = performance.now();
    paintSurface({ ...b, seed: 999 }, 512);
    const cold = performance.now() - t0;
    const t1 = performance.now();
    paintSurface({ ...b, seed: 999 }, 512);
    const warm = performance.now() - t1;
    // Generous ceilings: CI machines are slow. Logged for the report.
    console.info(`[terrain] 512x256 cold ${cold.toFixed(0)}ms, warm ${warm.toFixed(0)}ms`);
    expect(warm).toBeLessThan(cold);
    expect(cold).toBeLessThan(4000);
  });
});

describe("clouds", () => {
  it("keep the stated cover on a locked world; the substellar deck moves cloud, it does not add it", () => {
    const b = bind("kellis-prime");
    const W = 128;
    const maps = paintSurface(b, W);
    let covered = 0;
    let day = 0;
    let night = 0;
    for (let k = 0; k < W * (W / 2); k++) {
      const a = maps.clouds[k * 4] / 255;
      covered += a > 0.5 ? 1 : 0;
      const i = k % W;
      const lon = -180 + (360 * (i + 0.5)) / W;
      if (Math.abs(lon) < 60) day += a;
      if (Math.abs(lon) > 120) night += a;
    }
    expect(covered / (W * (W / 2))).toBeLessThan(b.clouds.coverage + 0.12);
    expect(day).toBeGreaterThan(night);
  });
});
