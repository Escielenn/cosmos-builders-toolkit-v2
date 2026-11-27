// Mythos: Xenomythology Framework. Domain owner of culture.* (08).
//
// 1.9 (lane C wiring): Mythos sent two fields to the writing surface and
// produced nothing in canon. Its cosmology, gods, taboos and death rites are
// facts now, on the people or polity the sheet is linked to. Its sky is read
// from canon: the ExoSky constellations of the world (planet.sky.*, lane E)
// show beside "Sky appearance" when they exist.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "mythos",
  tool: "xenomythology-framework-builder",
  name: "Mythos: Xenomythology Framework",
  kind: "worksheet",
  category: "mythology",
  accent: "stellar",
  layer: "mythology",
  route: "/tools/xenomythology-framework-builder",

  entities: [{ type: "mythology", from: "subject", primary: true }],

  produces: [
    { predicate: "culture.cosmology", from: "field:cosmologicalStructure.dimensionalStructure", kind: "text" },
    { predicate: "culture.deities[]", from: "field:divineConceptualization.deities", kind: "text[]" },
    { predicate: "culture.taboos[]", from: "field:synthesis.ethicalTaboos", kind: "text[]" },
    { predicate: "culture.death_rites", from: "field:deathPractices.deathRituals", kind: "text" },
  ],

  consumes: [
    { predicate: "planet.sky.constellations[]", required: false, onMissing: "link", producer: "exosky" },
    { predicate: "star.spectral_class", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "orbit.tidally_locked", required: false, onMissing: "link", producer: "orrery" },
    { predicate: "species.senses[]", required: false, onMissing: "link", producer: "sensorium" },
    { predicate: "species.body_plan", required: false, onMissing: "link", producer: "phylo" },
  ],

  derives: [],

  situations: [],

  studio: {
    railSection: "Culture",
    influences: ["scene.dialogue", "scene.ritual", "scene.sky"],
    narrative: (facts) => {
      const out: string[] = [];
      const deities = String(facts["culture.deities[]"] ?? "").trim();
      const taboos = String(facts["culture.taboos[]"] ?? "").trim();
      const rites = String(facts["culture.death_rites"] ?? "").trim();
      if (deities) out.push(`Oaths and curses name ${deities.split(",")[0].trim()}. Nobody swears by a god they do not have.`);
      if (taboos) out.push(`What no one does: ${taboos}. A character who does it is making a statement.`);
      if (rites) out.push(`The dead are handled by rite: ${rites.length > 90 ? `${rites.slice(0, 87)}…` : rites}`);
      return out;
    },
  },

  upstream: ["phylo", "sensorium", "orrery"],
  downstream: [],
};
