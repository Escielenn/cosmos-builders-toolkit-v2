// ExoSky: the sky over the writer's world (03-TOOL-CHARTER #24, 1.9).
//
// A simulator: it reads the planet and its star from canon, lets the writer
// stand on the surface, and writes back what only it decides: where the
// pole points, how fast it precesses, where the system sits in the galaxy,
// and the constellations the writer names (entities with member star ids,
// the epoch they were drawn in, and the planet they are seen from).
//
// Exosky -> Mythos is the edge the Charter calls the most poetic in the
// product: Mythos reads planet.sky.constellations[] and constellation.*.
//
// Registration in src/canon/manifests/index.ts is done at merge (1.9 brief:
// lane C registers every new sim manifest).

import type { ToolManifest } from "@/canon/manifest";
import { solarPrecessionPeriodYears } from "@/lib/simulators/astro";

export const manifest: ToolManifest = {
  id: "exosky",
  tool: "exosky",
  name: "ExoSky: the sky from any world",
  kind: "simulator",
  category: "stars-systems",
  accent: "amber",
  layer: "physics",
  route: "/tools/exosky",

  entities: [
    { type: "planet", from: "subject", primary: true },
    // Constellations: custom entities, custom_type_label "Constellation".
    { type: "custom", from: "sim:constellations" },
  ],

  produces: [
    { predicate: "planet.pole_ra", from: "sim:pole.ra", unit: "deg", kind: "scalar" },
    { predicate: "planet.pole_dec", from: "sim:pole.dec", unit: "deg", kind: "scalar" },
    { predicate: "planet.precession_period", from: "derive:exosky.precession_period", unit: "yr", kind: "scalar" },
    { predicate: "planet.sky.pole_star", from: "sim:readout.poleStar", kind: "text" },
    { predicate: "planet.sky.naked_eye_count", from: "sim:readout.nakedEye", kind: "scalar" },
    { predicate: "planet.sky.constellations[]", from: "sim:constellations.names", kind: "text[]" },
    { predicate: "star.galactic_position", from: "sim:placement", kind: "struct" },
    { predicate: "constellation.stars[]", from: "sim:constellations.starIds", kind: "text[]" },
    { predicate: "constellation.epoch", from: "sim:constellations.epoch", unit: "yr", kind: "scalar" },
    { predicate: "constellation.seen_from", from: "sim:constellations.planet", kind: "ref" },
  ],

  consumes: [
    { predicate: "star.spectral_class", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "star.luminosity", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "star.temp_effective", required: false, onMissing: "derive" },
    { predicate: "star.mass", required: false, onMissing: "derive" },
    { predicate: "orbit.semi_major_axis", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "orbit.period", required: false, onMissing: "derive" },
    { predicate: "orbit.tidally_locked", required: false, onMissing: "prompt", prompt: "TIDAL LOCK NOT SET. CHOOSE IN STAND HERE." },
    { predicate: "planet.rotation_period", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "planet.obliquity", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "planet.albedo", required: false, onMissing: "ignore" },
    { predicate: "planet.atmo_pressure", required: false, onMissing: "ignore" },
    { predicate: "planet.atmo_composition", required: false, onMissing: "ignore" },
  ],

  derives: [
    {
      id: "exosky.precession_period",
      label: "Precession period (solar torque)",
      inputs: ["planet.rotation_period", "orbit.period", "planet.obliquity"],
      output: "planet.precession_period",
      fn: (i) => {
        const y = solarPrecessionPeriodYears(i["planet.rotation_period"], i["orbit.period"], i["planet.obliquity"]);
        return Number.isFinite(y) ? Math.round(y) : null;
      },
      invalidates: "on_input_change",
      narrative: (out) =>
        out < 30000
          ? `THE POLE CIRCLES IN ${Math.round(out).toLocaleString()} YEARS. THE NORTH STAR OF THE FOUNDING MYTH IS NOT THE NORTH STAR NOW.`
          : `THE POLE CIRCLES IN ${Math.round(out).toLocaleString()} YEARS. NO RECORDED HISTORY SEES IT MOVE.`,
    },
  ],

  situations: ["exosky.empty-sky", "exosky.sky-drift"],

  studio: {
    railSection: "Sky",
    influences: ["scene.sky", "scene.navigation", "scene.calendar", "scene.myth"],
    narrative: (facts) => {
      const out: string[] = [];
      const ps = facts["planet.sky.pole_star"];
      if (typeof ps === "string") out.push(ps === "None" ? "No pole star. Navigators steer by the turning sky." : `The pole star is ${ps}.`);
      const n = Number(facts["planet.sky.naked_eye_count"]);
      if (Number.isFinite(n)) out.push(`${n.toLocaleString()} stars to the naked eye on a dark night.`);
      return out;
    },
  },

  upstream: ["orrery", "genesis", "solaris", "goldilocks"],
  downstream: ["mythos", "xenomythology"],
};
