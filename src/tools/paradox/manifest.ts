// Paradox: Time Dilation Calculator. Sole producer of route.dilation_factor,
// route.proper_time and route.coordinate_time (08 route domain exception).
// Wired here for its dilation factor; proper and coordinate time depend on
// the acceleration profile the calculator runs and arrive with /sf-wire
// paradox.
//
// One home (1.5 item 10): Paradox no longer owns the drive. It consumes
// propulsion.type from Impulse; the method picker is prefilled from canon
// with a provenance tag. Its velocity fraction stays a local input.

import type { Derivation, ToolManifest } from "@/canon/manifest";

export const dilationFactor: Derivation = {
  id: "paradox.dilation_factor_from_cruise",
  label: "Lorentz factor at cruise",
  inputs: ["propulsion.cruise_fraction_c"],
  output: "route.dilation_factor",
  invalidates: "on_input_change",
  // γ = 1 / √(1 − β²). Undefined at or above c: an FTL drive has no γ.
  fn: ({ "propulsion.cruise_fraction_c": b }) =>
    typeof b === "number" && Number.isFinite(b) && b >= 0 && b < 1 ? 1 / Math.sqrt(1 - b * b) : null,
  narrative: (g) =>
    g < 1.0001
      ? `γ ${g.toFixed(4)}. Clocks aboard and at home agree; no one comes back younger.`
      : `γ ${g.toFixed(3)}. Every year aboard is ${g.toFixed(2)} at home. Arrivals are funerals for someone.`,
};

export const manifest: ToolManifest = {
  id: "paradox",
  tool: "time-dilation",
  name: "Paradox: Time Dilation Calculator",
  kind: "calculator",
  category: "civilizations",
  accent: "violet",
  layer: "culture",
  route: "/tools/time-dilation",

  entities: [],

  produces: [{ predicate: "route.dilation_factor", from: `derive:${dilationFactor.id}`, kind: "scalar" }],

  consumes: [
    { predicate: "propulsion.type", required: false, onMissing: "link", producer: "impulse" },
    {
      predicate: "propulsion.cruise_fraction_c",
      required: true,
      onMissing: "prompt",
      prompt: "NO CRUISE VELOCITY ON FILE. SET IT HERE.",
    },
    { predicate: "route.distance_ly", required: false, onMissing: "prompt", prompt: "NO ROUTE ON FILE. PICK A JOURNEY." },
  ],

  derives: [dilationFactor],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.travel"],
    narrative: (facts) => {
      const g = Number(facts["route.dilation_factor"]);
      return Number.isFinite(g) && g >= 1 ? [dilationFactor.narrative(g, {})] : [];
    },
  },

  upstream: ["impulse"],
  downstream: ["vessel"],
};
