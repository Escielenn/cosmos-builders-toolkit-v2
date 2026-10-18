// Vessel: Lived-In Spacecraft Designer. Primary creator of the vessel entity
// and producer of vessel.* except vessel.spin_gravity (Gravitas).
//
// One home (1.5 item 10): vessel.crew_size is Vessel's, on its own numeric
// field (living.crewSize). Until 2026-10-18 entity-config read the crew
// quarters prose as the crew size; that prose now projects as Crew Quarters.
// Impulse reads the count from canon.
//
// Vessel consumes propulsion.type from Impulse: the drive field is prefilled
// from canon with a provenance tag.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "vessel",
  tool: "spacecraft-designer",
  name: "Vessel: Lived-In Spacecraft Designer",
  kind: "worksheet",
  category: "civilizations",
  accent: "violet",
  layer: "culture",
  route: "/tools/spacecraft-designer",

  entities: [{ type: "vessel", from: "subject", primary: true }],

  produces: [{ predicate: "vessel.crew_size", from: "field:living.crewSize", kind: "scalar" }],

  consumes: [
    { predicate: "propulsion.type", required: false, onMissing: "link", producer: "impulse" },
    { predicate: "vessel.spin_gravity", required: false, onMissing: "link", producer: "gravitas" },
  ],

  derives: [],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.physicality", "scene.sound"],
    narrative: (facts) => {
      const n = Number(facts["vessel.crew_size"]);
      if (!Number.isFinite(n) || n <= 0) return [];
      if (n <= 12) return [`A crew of ${n}. Everyone knows everyone's footsteps.`];
      if (n <= 200) return [`A crew of ${n}. Small enough for gossip, large enough for factions.`];
      return [`A crew of ${n}. A town in a hull: strangers pass in the corridors.`];
    },
  },

  upstream: ["impulse", "gravitas"],
  downstream: [],
};
