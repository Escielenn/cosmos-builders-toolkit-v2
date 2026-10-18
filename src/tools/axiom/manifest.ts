// Axiom: The One Big Lie. Sole producer of world.axiom (03 Tier 3 #11, 08
// world domain). A root fact: nothing upstream. Stored world-level
// (subject null), since the premise belongs to the world, not to any entity.
//
// One home (1.5 item 10): Exodus restated the premise in its own field. It
// now reads world.axiom from canon and prefills; editing it there proposes.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "axiom",
  tool: "one-big-lie",
  name: "Axiom: The One Big Lie",
  kind: "worksheet",
  category: "integration",
  accent: "teal",
  layer: "integration",
  route: "/tools/one-big-lie",

  entities: [],

  produces: [{ predicate: "world.axiom", from: "field:coreStatement.statement", kind: "text" }],

  consumes: [],

  derives: [],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.physicality", "scene.travel"],
    narrative: (facts) => {
      const lie = String(facts["world.axiom"] ?? "").trim();
      return lie ? [`The one lie this world tells: ${lie} Everything else obeys physics.`] : [];
    },
  },

  upstream: [],
  downstream: ["impulse", "exodus"],
};
