// Sensorium: Alien Sensory Systems. Sole producer of species.senses[] and
// species.dominant_sense (08 species domain exception; 1.9 /sf-fact).
//
// 1.9 (lane C wiring): the senses a species accepted in Sensorium never left
// it, so a POV character could see in colours their species cannot. They are
// canon on the species now, and the star the senses evolved under is read
// from Orrery.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "sensorium",
  tool: "sensorium",
  name: "Sensorium: Alien Sensory Systems",
  kind: "worksheet",
  category: "life",
  accent: "emerald",
  layer: "biology",
  route: "/tools/sensorium",

  entities: [{ type: "species", from: "subject", primary: true }],

  produces: [
    { predicate: "species.senses[]", from: "field:finalSelection", kind: "text[]" },
    { predicate: "species.dominant_sense", from: "field:perceptionProfile.dominantSense", kind: "text" },
  ],

  consumes: [
    { predicate: "star.spectral_class", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "star.temp_effective", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "planet.atmo_pressure", required: false, onMissing: "link", producer: "genesis" },
  ],

  derives: [],

  situations: [],

  studio: {
    railSection: "Species",
    influences: ["scene.pov", "scene.light", "scene.sound"],
    narrative: (facts) => {
      const dominant = String(facts["species.dominant_sense"] ?? "").trim();
      const senses = String(facts["species.senses[]"] ?? "").trim();
      const out: string[] = [];
      if (dominant) out.push(`A POV of this species leads with ${dominant.toLowerCase()}. Describe that first, sight second or not at all.`);
      if (senses) out.push(`What they can sense: ${senses}. Anything else in the scene they learn about secondhand.`);
      return out;
    },
  },

  upstream: ["orrery", "phylo"],
  downstream: ["mythos"],
};
