// Phylo: Evolutionary Biology. Domain owner of species.* (08), except the
// senses, which Sensorium owns.
//
// 1.9 (lane C wiring): Phylo sent four free-text fields to the writing
// surface and produced nothing in canon, so a species' biochemistry, body
// plan and society reached no scene. They are facts now, on the species the
// sheet is linked to, and the planet it evolved on is read from canon
// (Genesis, Atlas, Orrery) instead of retyped.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "phylo",
  tool: "evolutionary-biology",
  name: "Phylo: Evolutionary Biology",
  kind: "worksheet",
  category: "life",
  accent: "emerald",
  layer: "biology",
  route: "/tools/evolutionary-biology",

  entities: [{ type: "species", from: "subject", primary: true }],

  produces: [
    { predicate: "species.biochemistry", from: "field:biochemistry.biochemicalBasis", kind: "enum" },
    { predicate: "species.body_plan", from: "field:bodyPlan.symmetry", kind: "text" },
    { predicate: "species.cognition_profile", from: "field:cognition.cognitionType", kind: "text" },
    { predicate: "species.reproduction_mode", from: "field:reproduction.reproductionMode", kind: "enum" },
    { predicate: "species.social_structure", from: "field:social.socialStructure", kind: "enum" },
  ],

  consumes: [
    { predicate: "planet.surface_gravity", required: false, onMissing: "link", producer: "atlas" },
    { predicate: "planet.temp_mean", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "planet.atmo_composition", required: false, onMissing: "link", producer: "genesis" },
    { predicate: "star.spectral_class", required: false, onMissing: "link", producer: "orrery" },
  ],

  derives: [],

  situations: [],

  studio: {
    railSection: "Species",
    influences: ["scene.physicality", "scene.dialogue", "scene.pov"],
    narrative: (facts) => {
      const out: string[] = [];
      const bio = String(facts["species.biochemistry"] ?? "").toLowerCase();
      const plan = String(facts["species.body_plan"] ?? "").toLowerCase();
      const social = String(facts["species.social_structure"] ?? "").toLowerCase();
      if (bio && !bio.startsWith("carbon")) out.push(`A ${bio} biochemistry. Nothing on a human table is food to them, or safe.`);
      if (plan.includes("radial")) out.push("Radial bodies have no front. They do not turn to look; there is no behind them to sneak up on.");
      else if (plan.includes("bilateral")) out.push("Bilateral, like us: a face, a front, a direction they are going.");
      if (social.includes("hive") || social.includes("eusocial")) out.push("A hive. 'I' is a word they borrow from other species.");
      else if (social.includes("solitary")) out.push("Solitary. Meetings are negotiations; crowds are a threat display.");
      return out;
    },
  },

  upstream: ["genesis", "atlas", "orrery"],
  downstream: ["sensorium", "mythos"],
};
