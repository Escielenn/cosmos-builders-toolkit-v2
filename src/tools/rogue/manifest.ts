// Rogue: wandering-object encounter simulator (public/rogue/sim.html).
//
// Simulation is canon-generating (Law VI): an encounter changes orbits at a
// date. Publish Aftermath posts, per body, the outcome (retained,
// orbit_changed, captured, ejected), the new semi-major axis and
// eccentricity about whatever now holds it, and the encounter epoch in years
// since launch (results.outcomes, results.epoch), for the Chronicle
// (11-SIMULATOR-CONSTELLATION §2, S2). A run whose relative energy error is
// above 1e-3 cannot be published (rogue-physics.js PUBLISH_MAX_ENERGY_ERROR).
//
// Everything is `sim:` sourced. The derivation is Kepler's third law about
// the body's new host, so the year length of a perturbed world follows from
// the orbit Rogue left it on.

import type { Derivation, ToolManifest } from "@/canon/manifest";

export const postEncounterPeriod: Derivation = {
  id: "rogue.orbit_period_after_encounter",
  label: "Orbital period after the encounter",
  inputs: ["orbit.semi_major_axis", "star.mass"],
  output: "orbit.period",
  invalidates: "on_input_change",
  // P = √(a³ / M) years, in days.
  fn: ({ "orbit.semi_major_axis": a, "star.mass": m }) =>
    typeof a === "number" && typeof m === "number" && a > 0 && m > 0 ? Math.sqrt((a * a * a) / m) * 365.25 : null,
  narrative: (d) =>
    `After the encounter a year lasts ${d < 1000 ? `${Math.round(d)} days` : `${(d / 365.25).toFixed(1)} Earth years`}. Every calendar written before it is wrong.`,
};

export const manifest: ToolManifest = {
  id: "rogue",
  tool: "rogue",
  name: "Rogue: Wandering Object Encounters",
  kind: "simulator",
  category: "stars-systems",
  accent: "amber",
  layer: "physics",
  route: "/rogue",

  entities: [{ type: "planet", from: "field:results.outcomes" }],

  produces: [
    { predicate: "system.perturbation_events[]", from: "sim:results.epoch+results.outcomes", kind: "struct[]" },
    { predicate: "orbit.semi_major_axis", from: "sim:results.outcomes[].a", unit: "au", kind: "scalar" },
    { predicate: "orbit.eccentricity", from: "sim:results.outcomes[].e", kind: "scalar" },
    { predicate: "system.body_count", from: "sim:parameters.p.length", kind: "scalar" },
  ],

  consumes: [
    { predicate: "star.mass", required: false, onMissing: "ignore" },
    { predicate: "orbit.semi_major_axis", required: false, onMissing: "ignore" },
  ],

  derives: [postEncounterPeriod],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.travel", "scene.light"],
    narrative: (facts) => {
      const p = Number(facts["orbit.period"]);
      return Number.isFinite(p) && p > 0 ? [postEncounterPeriod.narrative(p, {})] : [];
    },
  },

  upstream: ["solaris"],
  downstream: ["exosky", "tidelock"],
};
