// Exodus: Space Expansion Modeler. Producer of expansion.* (08 domain owner).
// expansion.trajectory and expansion.dominant_force were added for it
// (/sf-fact, 2026-10-18); expansion.phase_timeline[] waits on a registered
// struct schema.
//
// One home (1.5 item 10): the One Big Lie is Axiom's. Exodus's
// foundation.oneBigLie is prefilled from canon world.axiom with a provenance
// tag; editing it here proposes rather than overwrites.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "exodus",
  tool: "space-expansion-modeler",
  name: "Exodus: Space Expansion Modeler",
  kind: "worksheet",
  category: "civilizations",
  accent: "violet",
  layer: "culture",
  route: "/tools/space-expansion-modeler",

  entities: [],

  produces: [
    { predicate: "expansion.trajectory", from: "field:synthesis.overallTrajectory", kind: "enum" },
    { predicate: "expansion.dominant_force", from: "field:synthesis.dominantForce", kind: "text" },
  ],

  consumes: [
    { predicate: "world.axiom", required: false, onMissing: "link", producer: "axiom" },
    { predicate: "propulsion.type", required: false, onMissing: "link", producer: "impulse" },
  ],

  derives: [],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.travel"],
    narrative: (facts) => {
      const t = String(facts["expansion.trajectory"] ?? "");
      const f = String(facts["expansion.dominant_force"] ?? "").trim();
      const out: string[] = [];
      if (t === "stalled") out.push("Expansion has hit a wall. The frontier is a place people leave.");
      else if (t === "accelerating" || t === "exponential") out.push("Expansion is speeding up. Every frontier town is newer than its residents.");
      else if (t === "cyclical") out.push("Expansion comes in waves. Ruins sit beside boomtowns.");
      if (f) out.push(`What drives it: ${f}`);
      return out;
    },
  },

  upstream: ["axiom", "impulse"],
  downstream: [],
};
