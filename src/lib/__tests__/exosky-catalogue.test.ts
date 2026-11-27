import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCatalogue, indexById, searchCatalogue, prettyDesignation, starLabel, type CatalogueStar } from "@/lib/simulators/exosky-catalogue";
import { VANTAGES } from "@/lib/simulators/exosky-systems";
import { applyCatalogueOverrides, resolveVantage } from "@/lib/simulators/exosky-vantage";
import { observeCatalogue, catalogueReach, findPoleStar, NAKED_EYE_LIMIT } from "@/lib/simulators/exosky-sky";
import { xyzToRaDec, EARTH_POLE } from "@/lib/simulators/astro";

let stars: CatalogueStar[];
let byId: Map<string, CatalogueStar>;

beforeAll(() => {
  const buf = readFileSync(join(process.cwd(), "public/tools/exosky/hyg-v41.bin"));
  stars = applyCatalogueOverrides(parseCatalogue(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  byId = indexById(stars);
});

describe("the HYG catalogue asset (N3 / E5)", () => {
  it("holds ~30,000 stars, brightest first", () => {
    expect(stars.length).toBeGreaterThan(29000);
    expect(stars[1].name).toBe("Sirius");
  });
  it("has Sirius where Hipparcos puts it", () => {
    const s = byId.get("HIP 32349")!;
    const p = xyzToRaDec(s.x, s.y, s.z);
    expect(p.ra).toBeCloseTo(101.287, 2);
    expect(p.dec).toBeCloseTo(-16.716, 2);
    expect(s.dist).toBeCloseTo(2.637, 2);
    expect(s.absMag).toBeCloseTo(1.45, 1);
  });
  it("has the Alpha Centauri system, which 1.8's 178 stars lacked", () => {
    expect(byId.get("HIP 71683")?.name).toBe("Rigil Kentaurus");
    expect(byId.get("HIP 71681")).toBeTruthy();
    expect(byId.get("HIP 70890")?.name).toBe("Proxima Centauri");
  });
  it("has every preset's host star", () => {
    for (const v of VANTAGES) if (v.hostId) expect(byId.get(v.hostId), v.key).toBeTruthy();
  });
  it("carries Betelgeuse at 168 pc (Joyce et al. 2020)", () => {
    expect(byId.get("HIP 27989")!.dist).toBeCloseTo(168, 3);
  });
  it("searches names and designations", () => {
    expect(searchCatalogue(stars, "vega")[0].id).toBe("HIP 91262");
    expect(prettyDesignation("9Alp CMa")).toBe("α CMa");
    expect(prettyDesignation("Alp1Cen")).toBe("α1 Cen");
    expect(starLabel({ name: null, bf: "18Eps Eri", id: "HIP 16537" })).toBe("ε Eri");
  });
});

describe("the sky from here (E2 / E6)", () => {
  it("from Earth: ~8,900 naked-eye stars, the Sun excluded, Polaris at the pole", () => {
    const o = observeCatalogue(stars, [0, 0, 0]);
    expect(o.nakedEye).toBeGreaterThan(8500);
    expect(o.nakedEye).toBeLessThan(9300);
    expect(stars[o.ownStar].name).toBe("Sol");
    const ps = findPoleStar(o, EARTH_POLE);
    expect(stars[ps!.index].name).toBe("Polaris");
    expect(ps!.separationDeg).toBeLessThan(1);
  });
  it("standing at Sirius: Sirius is the observer's sun, not a phantom point", () => {
    const s = byId.get("HIP 32349")!;
    const o = observeCatalogue(stars, [s.x, s.y, s.z]);
    expect(o.ownStar).toBe(s.i);
    let brightest = Infinity;
    for (let k = 0; k < o.index.length; k++) brightest = Math.min(brightest, o.mag[o.index[k]]);
    expect(brightest).toBeGreaterThan(-3);
  });
  it("from Alpha Centauri A: the Sun is a ~0.5 mag star in Cassiopeia, Proxima naked-eye", () => {
    const a = byId.get("HIP 71683")!;
    const o = observeCatalogue(stars, [a.x, a.y, a.z]);
    const sol = stars.find((s) => s.name === "Sol")!;
    expect(o.mag[sol.i]).toBeCloseTo(0.44, 0);
    const p = xyzToRaDec(o.ux[sol.i], o.uy[sol.i], o.uz[sol.i]);
    expect(p.ra).toBeCloseTo(39.9, 0);
    expect(p.dec).toBeCloseTo(60.8, 0);
    expect(o.mag[byId.get("HIP 70890")!.i]).toBeLessThan(NAKED_EYE_LIMIT);
  });
  it("says when the catalogue thins (Kepler-452 is 552 pc out)", () => {
    expect(catalogueReach(552).complete).toBe(false);
    expect(catalogueReach(3).complete).toBe(true);
  });
  it("resolves the Earth vantage onto the catalogue Sun", () => {
    const v = resolveVantage({ preset: VANTAGES[0], catalogue: stars, catalogueById: byId });
    expect(v.isEarth).toBe(true);
    expect(v.hostId).toBe("HYG 0");
  });
});
