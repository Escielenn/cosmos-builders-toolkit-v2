// Tidelock: the locked-world simulator (public/tools/tidelock/sim.html).
//
// Sole producer of planet.temp_gradient[] and planet.terminator_band_width
// (08-VOCABULARY). Everything else it posts (star, orbit, bulk planet) is a
// simulation-sourced copy of facts other tools own: those rows use
// `sim:` sources, which validateManifest exempts from the second-producer
// rule because a sim run is evidence, promoted by the writer, never a
// silent overwrite of canon (canon.assert never overwrites confidence
// 'canon').
//
// `from: "sim:<block>.<key>"` names the field in the STELLARFORGE_SAVE
// payload (parameters or results). Units are the sim's own (results.units):
// temperatures K, distances AU, period days, pressure bar, band km.
//
// Registration in src/canon/manifests/index.ts happens at merge (lane C).

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "tidelock",
  tool: "tidelock",
  name: "Tidelock: Locked World Simulator",
  kind: "simulator",
  category: "worlds",
  accent: "azure",
  layer: "environment",
  route: "/tools/tidelock",
  entities: [{ type: "planet", from: "subject", primary: true }],

  produces: [
    // Sole-producer predicates.
    { predicate: "planet.temp_gradient[]", from: "sim:results.tSSP,tTerm,tASP", unit: "K" },
    { predicate: "planet.terminator_band_width", from: "sim:results.bandWidthKm", unit: "km", kind: "scalar" },
    // Simulation copies of facts owned elsewhere (promoted, never overwritten).
    { predicate: "orbit.tidally_locked", from: "sim:results.tidalLock", kind: "bool" },
    { predicate: "orbit.period", from: "sim:results.orbPeriod", unit: "days", kind: "scalar" },
    { predicate: "orbit.semi_major_axis", from: "sim:results.orbDistAU", unit: "au", kind: "scalar" },
    { predicate: "planet.atmo_pressure", from: "sim:results.pressureBar", unit: "bar", kind: "scalar" },
    { predicate: "planet.atmo_composition", from: "sim:parameters.composition", kind: "text" },
    { predicate: "planet.albedo", from: "sim:results.albedo", unit: "fraction", kind: "scalar" },
    { predicate: "planet.mass", from: "sim:parameters.planetMass", unit: "earth_masses", kind: "scalar" },
    { predicate: "planet.radius", from: "sim:parameters.planetRadius", unit: "earth_radii", kind: "scalar" },
    { predicate: "planet.surface_gravity", from: "sim:results.surfGrav", unit: "g", kind: "scalar" },
    { predicate: "planet.escape_velocity", from: "sim:results.escVel", unit: "km_s", kind: "scalar" },
    { predicate: "planet.density", from: "sim:results.bulkDensity", unit: "g_cm3", kind: "scalar" },
    { predicate: "star.spectral_class", from: "sim:results.starType", kind: "enum" },
    { predicate: "star.mass", from: "sim:results.starMass", unit: "solar_masses", kind: "scalar" },
    { predicate: "star.luminosity", from: "sim:results.starLum", unit: "solar_lum", kind: "scalar" },
    { predicate: "star.temp_effective", from: "sim:results.starTeff", unit: "K", kind: "scalar" },
    { predicate: "star.age", from: "sim:results.systemAgeGyr", unit: "gyr", kind: "scalar" },
  ],

  // Open-on (?entityId=) seeds the sim from these when present; a missing
  // one just leaves the sim's own default (Law III: nothing dead-ends).
  consumes: [
    { predicate: "star.temp_effective", required: false, onMissing: "ignore" },
    { predicate: "star.luminosity", required: false, onMissing: "ignore" },
    { predicate: "orbit.semi_major_axis", required: false, onMissing: "ignore" },
    { predicate: "planet.mass", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "planet.radius", required: false, onMissing: "link", producer: "genesis" },
  ],

  // The sim computes in the browser (public/tools/_shared/physics.js, the
  // twin of src/lib/physics); no app-side derivations.
  derives: [],

  // src/sims/flags/tidelock.ts
  situations: [
    "tidelock.atmosphere-collapse",
    "tidelock.not-locked",
    "tidelock.narrow-habitable-band",
    "tidelock.no-heat-transport",
    "tidelock.atmosphere-escapes",
    "tidelock.star-past-main-sequence",
  ],

  studio: {
    railSection: "World",
    influences: ["scene.light", "scene.temperature", "scene.sky"],
    narrative: (facts) => {
      const km = Number(facts["planet.terminator_band_width"]);
      const locked = facts["orbit.tidally_locked"];
      const out: string[] = [];
      if (locked === "true" || locked === "Locked") out.push("THE STAR NEVER MOVES IN THIS SKY.");
      if (Number.isFinite(km)) out.push(km > 0 ? `LIQUID WATER IN A BAND ${Math.round(km)} KM WIDE.` : "NOWHERE ON THE SURFACE HOLDS LIQUID WATER.");
      return out;
    },
  },

  upstream: ["orrery", "genesis", "solaris"],
  downstream: ["exosky", "phylo", "sensorium"],
};
