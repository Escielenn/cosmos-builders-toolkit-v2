// Goldilocks: Habitable Zone Calculator. Sole producer of system.hz_inner
// and system.hz_outer (08 system domain exception), derived from
// star.luminosity and star.temp_effective with Kopparapu et al. (2014)
// conservative limits, the same S_eff(Teff) the calculator draws.
//
// One home (1.5 item 10): Goldilocks no longer owns the star's class. It
// consumes star.spectral_class from Orrery: on open the picker is prefilled
// from canon with a provenance tag, and changing it here is either EDIT AT
// ORRERY or an explicit OVERRIDE HERE that proposes, never overwrites.

import type { Derivation, ToolManifest } from "@/canon/manifest";
import { kopparapuEdges, KOPPARAPU_T_SUN } from "@/lib/habitable-zone/kopparapu";

const validL = (l: number | undefined): l is number => typeof l === "number" && Number.isFinite(l) && l > 0;
const teffOf = (t: number | undefined): number => (typeof t === "number" && Number.isFinite(t) && t > 0 ? t : KOPPARAPU_T_SUN);

// 1.9 F-01: the edges take the star's effective temperature too. Before, canon
// stored solar-coefficient edges (S_eff at 5780 K) while the calculator's own
// screen drew Teff-corrected ones, so an M3V's saved HZ was 0.116 to 0.205 AU
// against 0.127 to 0.248 AU on screen. Kopparapu et al. 2014 (ApJ 787:L29)
// S_eff(Teff) polynomial, ./lib/habitable-zone/kopparapu.ts. Without a Teff
// fact the Sun's is used, which reproduces the old numbers for a G2V.

export const hzInner: Derivation = {
  id: "goldilocks.hz_inner_from_luminosity",
  label: "Habitable zone inner edge (runaway greenhouse)",
  inputs: ["star.luminosity"],
  optionalInputs: ["star.temp_effective"],
  output: "system.hz_inner",
  invalidates: "on_input_change",
  // d = √(L / S_eff(Teff)), AU.
  fn: ({ "star.luminosity": l, "star.temp_effective": t }) =>
    validL(l) ? kopparapuEdges(teffOf(t), l).runawayGreenhouse : null,
  narrative: (d) =>
    `Inside ${d.toFixed(2)} AU the oceans boil off. Any world closer than this is a Venus, whatever its name.`,
};

export const hzOuter: Derivation = {
  id: "goldilocks.hz_outer_from_luminosity",
  label: "Habitable zone outer edge (maximum greenhouse)",
  inputs: ["star.luminosity"],
  optionalInputs: ["star.temp_effective"],
  output: "system.hz_outer",
  invalidates: "on_input_change",
  fn: ({ "star.luminosity": l, "star.temp_effective": t }) =>
    validL(l) ? kopparapuEdges(teffOf(t), l).maxGreenhouse : null,
  narrative: (d) =>
    `Beyond ${d.toFixed(2)} AU no greenhouse keeps water liquid. Life out there lives under ice or not at all.`,
};

export const manifest: ToolManifest = {
  id: "goldilocks",
  tool: "habitable-zone-calculator",
  name: "Goldilocks: Habitable Zone Calculator",
  kind: "calculator",
  category: "stars-systems",
  accent: "amber",
  layer: "physics",
  route: "/tools/habitable-zone-calculator",

  entities: [],

  produces: [
    { predicate: "system.hz_inner", from: `derive:${hzInner.id}`, unit: "au", kind: "scalar" },
    { predicate: "system.hz_outer", from: `derive:${hzOuter.id}`, unit: "au", kind: "scalar" },
  ],

  consumes: [
    { predicate: "star.spectral_class", required: false, onMissing: "link", producer: "orrery" },
    {
      predicate: "star.luminosity",
      required: true,
      onMissing: "prompt",
      prompt: "NO STAR BRIGHTNESS SET. ENTER IT HERE OR RUN ORRERY.",
      producer: "orrery",
    },
    { predicate: "star.temp_effective", required: false, onMissing: "link", producer: "orrery" },
    {
      predicate: "orbit.semi_major_axis",
      required: false,
      onMissing: "prompt",
      prompt: "NO ORBITAL DISTANCE SET. PLACE THE PLANET HERE.",
    },
  ],

  derives: [hzInner, hzOuter],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.weather", "scene.light"],
    narrative: (facts) => {
      const inner = Number(facts["system.hz_inner"]);
      const outer = Number(facts["system.hz_outer"]);
      return Number.isFinite(inner) && Number.isFinite(outer) && inner > 0 && outer > 0
        ? [`Liquid water is possible between ${inner.toFixed(2)} and ${outer.toFixed(2)} AU.`]
        : [];
    },
  },

  upstream: ["orrery"],
  downstream: ["genesis"],
};
