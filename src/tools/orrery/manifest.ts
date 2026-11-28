// Orrery: Star System Builder. Sole producer of star.* and system.* (03
// anti-duplication registry, 08 star/system domains).
//
// One home (1.5 item 10): star.spectral_class used to be typed into three
// tools. Orrery owns it; Genesis (stellarEnvironment.starType) and Goldilocks
// (star.spectralType) read it from canon, prefill, and link back here.
// Orrery's own spelling ("g-type") is read through canon/codecs, so the
// stored value is 08's enum ("g"), whatever picker wrote it.

import type { Derivation, ToolManifest } from "@/canon/manifest";
import { mainSequenceTeff } from "@/lib/habitable-zone/calculations";

// 1.9 F-03: Orrery had luminosity, mass and age fields and produced none of
// them, so Goldilocks (which requires star.luminosity) made the writer type
// the number again. They travel now, and Orrery derives the effective
// temperature the Teff-corrected habitable zone needs (F-01).
export const tempEffective: Derivation = {
  id: "orrery.temp_effective_from_luminosity_mass",
  label: "Effective temperature from luminosity and mass (main sequence)",
  inputs: ["star.luminosity", "star.mass"],
  output: "star.temp_effective",
  invalidates: "on_input_change",
  fn: ({ "star.luminosity": l, "star.mass": m }) => mainSequenceTeff(l, m),
  narrative: (t) =>
    t < 3900
      ? `${Math.round(t)} K. Most of its light is infrared; a human eye sees the noon sky as dim amber.`
      : t < 5300
        ? `${Math.round(t)} K. Orange-white light; shadows warm, and blue paint looks dull.`
        : t < 6200
          ? `${Math.round(t)} K. Sunlight as Earth knows it; no one's eyes need to adapt.`
          : `${Math.round(t)} K. Hard blue-white light and heavy ultraviolet; shade is architecture.`,
};

export const manifest: ToolManifest = {
  id: "orrery",
  tool: "star-system-builder",
  name: "Orrery: Star System Builder",
  kind: "worksheet",
  category: "stars-systems",
  accent: "amber",
  layer: "physics",
  route: "/tools/star-system-builder",

  entities: [{ type: "star_system", from: "subject", primary: true }],

  produces: [
    { predicate: "star.spectral_class", from: "field:primaryStar.spectralClass", kind: "enum" },
    { predicate: "system.configuration", from: "field:configuration.type", kind: "enum" },
    { predicate: "star.luminosity", from: "field:primaryStar.luminosity", unit: "solar_lum", kind: "scalar" },
    { predicate: "star.mass", from: "field:primaryStar.mass", unit: "solar_masses", kind: "scalar" },
    { predicate: "star.age", from: "field:primaryStar.age", unit: "gyr", kind: "scalar" },
    // 1.9: Orrery is the domain owner of system.*; Solaris and Rogue promote
    // their body counts through it (08), so it produces the count of its bodies.
    { predicate: "system.body_count", from: "field:bodies", kind: "scalar", parse: "count" },
    { predicate: "star.temp_effective", from: `derive:${tempEffective.id}`, unit: "K", kind: "scalar" },
  ],

  consumes: [],

  derives: [tempEffective],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.light", "scene.weather"],
    narrative: (facts) => {
      const t = Number(facts["star.temp_effective"]);
      if (Number.isFinite(t) && t > 0) return [tempEffective.narrative(t, {})];
      const cls = String(facts["star.spectral_class"] ?? "").toLowerCase();
      if (!cls) return [];
      if (cls.startsWith("m")) return ["A red dwarf. Daylight runs amber; plants that want it go dark."];
      if (cls.startsWith("k")) return ["An orange star. Long-lived and steady; noon is warmer in colour than Earth's."];
      if (cls.startsWith("g")) return ["A sun like Sol. Daylight reads white; nothing about the sky needs explaining."];
      if (cls.startsWith("f") || cls.startsWith("a")) return ["A hot white star. Ultraviolet is a daily hazard; shade is architecture."];
      return [];
    },
  },

  upstream: [],
  downstream: ["goldilocks", "genesis"],
};
