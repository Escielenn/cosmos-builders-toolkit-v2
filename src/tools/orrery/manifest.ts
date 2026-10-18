// Orrery: Star System Builder. Sole producer of star.* and system.* (03
// anti-duplication registry, 08 star/system domains).
//
// One home (1.5 item 10): star.spectral_class used to be typed into three
// tools. Orrery owns it; Genesis (stellarEnvironment.starType) and Goldilocks
// (star.spectralType) read it from canon, prefill, and link back here.
// Orrery's own spelling ("g-type") is read through canon/codecs, so the
// stored value is 08's enum ("g"), whatever picker wrote it.

import type { ToolManifest } from "@/canon/manifest";

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
  ],

  consumes: [],

  derives: [],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.light", "scene.weather"],
    narrative: (facts) => {
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
