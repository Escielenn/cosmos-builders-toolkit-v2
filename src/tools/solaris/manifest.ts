// Solaris: multi-star system simulator (public/tools/solaris/sim.html).
//
// A bulk fact generator (00-CONSTITUTION Law VI). From 1.9 the sim posts
// parameters.sf2System on STELLARFORGE_REQUEST_STATE: every star, orbit and
// planet value as a number with its unit (see realSystem() in sim.html).
// Values reach canon through the sim publish path (lane C's extractor and
// canon.promote), so every produce below is `sim:` sourced; Orrery,
// Goldilocks and Genesis stay the producers of record for the predicates
// 08-VOCABULARY assigns them, and a published Solaris run arrives beside
// them with provenance rather than overwriting them.
//
// The derivations restate the sim's physics in TypeScript, from the same
// sources (public/tools/solaris/sf-astro.js), so a recompute in canon gives
// the number the writer saw. src/lib/__tests__/solaris-physics.test.ts
// checks the two agree.

import type { Derivation, ToolManifest } from "@/canon/manifest";

const DAYS_PER_YEAR = 365.25;
/** T☉ √(R☉ / 2 AU) with T☉ = 5772 K, R☉ = 6.957e8 m, AU = 1.496e11 m. */
const TEQ_UNIT_FLUX_K = 278.3;

const positive = (...xs: (number | undefined)[]): boolean =>
  xs.every((x) => typeof x === "number" && Number.isFinite(x) && x > 0);

/** Kepler's third law, P = √(a³ / M) years (planet mass neglected). */
export const orbitalPeriod: Derivation = {
  id: "solaris.orbit_period_from_axis_mass",
  label: "Orbital period from distance and stellar mass",
  inputs: ["orbit.semi_major_axis", "star.mass"],
  output: "orbit.period",
  invalidates: "on_input_change",
  fn: ({ "orbit.semi_major_axis": a, "star.mass": m }) =>
    positive(a, m) ? Math.sqrt((a * a * a) / m) * DAYS_PER_YEAR : null,
  narrative: (d) =>
    d < 30
      ? `A ${d.toFixed(1)}-day year. Seasons, if any, pass in weeks; a calendar counts orbits like months.`
      : d < 1000
        ? `A ${Math.round(d)}-day year. Close enough to ours that a life is measured in familiar spans.`
        : `A ${(d / DAYS_PER_YEAR).toFixed(1)}-Earth-year orbit. A person sees few of this world's years.`,
};

/** Insolation from one star, S = L / a² in Earth units. */
export const insolation: Derivation = {
  id: "solaris.insolation_from_axis_luminosity",
  label: "Insolation from distance and luminosity",
  inputs: ["orbit.semi_major_axis", "star.luminosity"],
  output: "planet.insolation",
  invalidates: "on_input_change",
  fn: ({ "orbit.semi_major_axis": a, "star.luminosity": l }) => (positive(a, l) ? l / (a * a) : null),
  narrative: (s) =>
    s > 1.1
      ? `${s.toFixed(2)} times Earth's sunlight. Oceans boil unless something cools the world.`
      : s < 0.36
        ? `${s.toFixed(2)} times Earth's sunlight. Water freezes unless the atmosphere holds heat.`
        : `${s.toFixed(2)} times Earth's sunlight. Liquid water is possible under the right air.`,
};

/** Equilibrium temperature, 278.3 K · S^¼ · (1 − A)^¼ (full heat redistribution). */
export const equilibriumTemperature: Derivation = {
  id: "solaris.temp_equilibrium_from_insolation",
  label: "Equilibrium temperature from insolation and albedo",
  inputs: ["planet.insolation", "planet.albedo"],
  output: "planet.temp_equilibrium",
  invalidates: "on_input_change",
  fn: ({ "planet.insolation": s, "planet.albedo": a }) =>
    typeof s === "number" && s >= 0 && typeof a === "number" && a >= 0 && a < 1
      ? TEQ_UNIT_FLUX_K * Math.pow(s, 0.25) * Math.pow(1 - a, 0.25)
      : null,
  narrative: (t) =>
    `Equilibrium ${Math.round(t)} K (${Math.round(t - 273.15)} °C) before any greenhouse. Earth's is 254 K; its air adds 34 more.`,
};

export const manifest: ToolManifest = {
  id: "solaris",
  tool: "solaris",
  name: "Solaris: Procedural Star System Simulator",
  kind: "simulator",
  category: "stars-systems",
  accent: "amber",
  layer: "physics",
  route: "/tools/solaris",

  entities: [
    { type: "star", from: "field:parameters.sf2System.stars", primary: true },
    { type: "planet", from: "field:parameters.sf2System.planets" },
  ],

  produces: [
    { predicate: "system.configuration", from: "sim:sf2System.architecture", kind: "enum" },
    { predicate: "system.body_count", from: "sim:sf2System.planets.length", kind: "scalar" },
    { predicate: "system.hz_inner", from: "sim:sf2System.habitableZone.innerAU", unit: "au", kind: "scalar" },
    { predicate: "system.hz_outer", from: "sim:sf2System.habitableZone.outerAU", unit: "au", kind: "scalar" },
    { predicate: "system.stability", from: "sim:sf2System.planets[].stability", kind: "enum" },
    { predicate: "star.spectral_class", from: "sim:sf2System.stars[].spectralType", kind: "enum" },
    { predicate: "star.mass", from: "sim:sf2System.stars[].massSOL", unit: "solar_masses", kind: "scalar" },
    { predicate: "star.luminosity", from: "sim:sf2System.stars[].luminositySOL", unit: "solar_lum", kind: "scalar" },
    { predicate: "star.temp_effective", from: "sim:sf2System.stars[].temperatureK", unit: "K", kind: "scalar" },
    { predicate: "orbit.semi_major_axis", from: "sim:sf2System.planets[].semiMajorAxisAU", unit: "au", kind: "scalar" },
    { predicate: "orbit.eccentricity", from: "sim:sf2System.planets[].eccentricity", kind: "scalar" },
    { predicate: "orbit.period", from: "sim:sf2System.planets[].orbitalPeriodDays", unit: "days", kind: "scalar" },
    { predicate: "orbit.tidally_locked", from: "sim:sf2System.planets[].tidallyLocked", kind: "bool" },
    { predicate: "planet.insolation", from: "sim:sf2System.planets[].insolationEarth", unit: "earth_flux", kind: "scalar" },
    { predicate: "planet.temp_equilibrium", from: "sim:sf2System.planets[].equilibriumTempK", unit: "K", kind: "scalar" },
    { predicate: "planet.albedo", from: "sim:sf2System.planets[].albedo", unit: "fraction", kind: "scalar" },
    { predicate: "planet.hz_position", from: "sim:sf2System.planets[].hzStatus", kind: "enum" },
  ],

  consumes: [
    // open-on (?entityId=) seeds a run from a star already in canon.
    { predicate: "star.spectral_class", required: false, onMissing: "ignore" },
    { predicate: "star.mass", required: false, onMissing: "ignore" },
  ],

  derives: [orbitalPeriod, insolation, equilibriumTemperature],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.light", "scene.weather", "scene.travel"],
    narrative: (facts) => {
      const out: string[] = [];
      const p = Number(facts["orbit.period"]);
      if (Number.isFinite(p) && p > 0) out.push(orbitalPeriod.narrative(p, {}));
      const s = Number(facts["planet.insolation"]);
      if (Number.isFinite(s) && s > 0) out.push(insolation.narrative(s, {}));
      const t = Number(facts["planet.temp_equilibrium"]);
      if (Number.isFinite(t) && t > 0) out.push(equilibriumTemperature.narrative(t, {}));
      return out;
    },
  },

  upstream: ["orrery"],
  downstream: ["exosky", "tidelock", "exoforge", "rogue", "genesis"],
};
