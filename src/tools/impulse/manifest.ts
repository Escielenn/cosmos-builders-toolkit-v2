// Impulse: Propulsion Consequences Map. Sole producer of propulsion.type
// (08 propulsion domain owner).
//
// One home (1.5 item 10): the drive used to be entered in three tools. Impulse
// owns it; Vessel (propulsion.driveType) and Paradox (propulsion.method) read
// it from canon. The canonical value is Impulse's own propulsion slug
// ("fusion", "solar-sail"), or the writer's words for a custom drive; see
// canon/codecs propulsionCodec.
//
// Impulse in turn reads vessel.crew_size from Vessel: costs.crewCapacity is
// prefilled from canon and an edit here proposes rather than overwrites.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "impulse",
  tool: "propulsion-consequences-map",
  name: "Impulse: Propulsion Consequences",
  kind: "worksheet",
  category: "civilizations",
  accent: "violet",
  layer: "culture",
  route: "/tools/propulsion-consequences-map",

  entities: [],

  produces: [{ predicate: "propulsion.type", from: "field:system.type", kind: "text" }],

  consumes: [
    { predicate: "vessel.crew_size", required: false, onMissing: "link", producer: "vessel" },
    { predicate: "world.axiom", required: false, onMissing: "link", producer: "axiom" },
  ],

  derives: [],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.travel"],
    narrative: (facts) => {
      const t = String(facts["propulsion.type"] ?? "");
      return t ? [`Ships run on ${t}. Every journey in the story costs what that drive costs.`] : [];
    },
  },

  upstream: ["axiom"],
  downstream: ["vessel", "paradox", "exodus"],
};
