// ExoForge: the exoplanet forge (public/tools/exoforge/sim.html).
//
// Sole producer of planet.surface_type (its classification, derived from
// mass and radius with Chen & Kipping 2017, 08-VOCABULARY). Everything else
// it posts is a simulation-sourced copy of facts other tools own (`sim:`
// sources; promoted by the writer, never a silent overwrite of canon).
//
// 1.9 (EF1): temperature and orbital period are DERIVED from the star and
// orbit, not sliders, so `temp_mean` and `orbit.period` here are real
// consequences of the inputs. planet.composition (also ExoForge's) is not
// produced: the "look" slider is appearance only.
//
// Units are the sim's own (results.units). `parameters.ocean` is a percent
// 0–100; the extractor divides by 100 for hydrosphere_fraction.
// Registration in src/canon/manifests/index.ts happens at merge (lane C).

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "exoforge",
  tool: "exoforge",
  name: "ExoForge: Exoplanet Forge",
  kind: "simulator",
  category: "worlds",
  accent: "azure",
  layer: "environment",
  route: "/tools/exoforge",
  entities: [{ type: "planet", from: "subject", primary: true }],

  produces: [
    { predicate: "planet.surface_type", from: "sim:results.classification", kind: "enum" },
    { predicate: "planet.mass", from: "sim:parameters.mass", unit: "earth_masses", kind: "scalar" },
    { predicate: "planet.radius", from: "sim:parameters.radius", unit: "earth_radii", kind: "scalar" },
    { predicate: "planet.density", from: "sim:results.density", unit: "g_cm3", kind: "scalar" },
    { predicate: "planet.surface_gravity", from: "sim:results.gravity", unit: "g", kind: "scalar" },
    { predicate: "planet.escape_velocity", from: "sim:results.escapeVelocity", unit: "km_s", kind: "scalar" },
    { predicate: "planet.temp_mean", from: "sim:results.surfaceTemp", unit: "K", kind: "scalar" },
    { predicate: "planet.albedo", from: "sim:parameters.albedo", unit: "fraction", kind: "scalar" },
    { predicate: "planet.hydrosphere_fraction", from: "sim:parameters.ocean", unit: "fraction", kind: "scalar" },
    { predicate: "planet.hz_position", from: "sim:results.hzZone", kind: "enum" },
    { predicate: "orbit.semi_major_axis", from: "sim:results.orbDistAU", unit: "au", kind: "scalar" },
    { predicate: "orbit.period", from: "sim:results.periodDays", unit: "days", kind: "scalar" },
    { predicate: "star.spectral_class", from: "sim:results.starType", kind: "enum" },
    { predicate: "star.mass", from: "sim:results.starMass", unit: "solar_masses", kind: "scalar" },
    { predicate: "star.luminosity", from: "sim:results.starLum", unit: "solar_lum", kind: "scalar" },
    { predicate: "star.temp_effective", from: "sim:results.starTeff", unit: "K", kind: "scalar" },
  ],

  consumes: [
    { predicate: "planet.mass", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "planet.radius", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "orbit.period", required: false, onMissing: "ignore" },
    { predicate: "planet.hydrosphere_fraction", required: false, onMissing: "ignore" },
    { predicate: "star.temp_effective", required: false, onMissing: "ignore" },
  ],

  derives: [],

  // src/sims/flags/exoforge.ts
  situations: ["exoforge.impossible-density", "exoforge.iron-core-no-tectonics", "exoforge.below-photosynthesis-floor"],

  studio: {
    railSection: "World",
    influences: ["scene.physicality", "scene.temperature"],
    narrative: (facts) => {
      const t = Number(facts["planet.temp_mean"]);
      const type = facts["planet.surface_type"];
      const out: string[] = [];
      if (typeof type === "string" && type) out.push(`${type.toUpperCase()}.`);
      if (Number.isFinite(t)) out.push(`SURFACE ${Math.round(t)} K (${Math.round(t - 273.15)} °C).`);
      return out;
    },
  },

  upstream: ["orrery", "genesis"],
  downstream: ["atlas", "tidelock", "exosky", "phylo"],
};
