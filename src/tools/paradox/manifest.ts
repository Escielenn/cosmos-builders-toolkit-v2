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

  // 1.9 F-05: the calculator's own engine (lib/time-dilation, the one
  // relativistic travel engine, F-10) computes these for whichever mode is
  // active, so they are `computed:` at save time rather than derived from
  // the constant-speed field alone. dilationFactor stays registered: it is
  // the narrative and the derivation canon/derive runs when only a cruise
  // speed is known.
  produces: [
    { predicate: "route.dilation_factor", from: "computed:active-mode", kind: "scalar" },
    { predicate: "route.proper_time", from: "computed:active-mode", unit: "yr", kind: "scalar" },
    { predicate: "route.coordinate_time", from: "computed:active-mode", unit: "yr", kind: "scalar" },
  ],

  consumes: [
    { predicate: "propulsion.type", required: false, onMissing: "link", producer: "impulse" },
    {
      predicate: "propulsion.cruise_fraction_c",
      required: true,
      onMissing: "prompt",
      prompt: "NO CRUISE SPEED SET. SET IT HERE.",
      producer: "impulse",
    },
    { predicate: "route.distance_ly", required: false, onMissing: "prompt", prompt: "NO ROUTE SET. PICK A JOURNEY." },
  ],

  derives: [dilationFactor],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.travel"],
    narrative: (facts) => {
      const g = Number(facts["route.dilation_factor"]);
      const ship = Number(facts["route.proper_time"]);
      const home = Number(facts["route.coordinate_time"]);
      const out = Number.isFinite(g) && g >= 1 ? [dilationFactor.narrative(g, {})] : [];
      if (Number.isFinite(ship) && Number.isFinite(home) && ship > 0 && home > 0) {
        out.push(`${ship.toFixed(1)} years pass aboard; ${home.toFixed(1)} pass at home.`);
      }
      return out;
    },
  },

  upstream: ["impulse"],
  downstream: ["vessel"],
};
