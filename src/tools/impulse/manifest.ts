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

  produces: [
    { predicate: "propulsion.type", from: "field:system.type", kind: "text" },
    // 1.9 F-05: Paradox needs the cruise speed and nothing produced it. The
    // field is "Maximum Velocity (% of light speed)", so it scales to a fraction.
    { predicate: "propulsion.cruise_fraction_c", from: "field:system.maxVelocity", unit: "c", kind: "scalar", scale: 0.01 },
  ],

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
      const b = Number(facts["propulsion.cruise_fraction_c"]);
      const out = t ? [`Ships run on ${t}. Every journey in the story costs what that drive costs.`] : [];
      if (Number.isFinite(b) && b > 0) {
        out.push(
          b < 0.01
            ? `Cruise is ${(b * 100).toFixed(2)}% of light. The nearest star is a lifetime away; ships carry generations.`
            : `Cruise is ${Math.round(b * 100)}% of light. Alpha Centauri is ${(4.37 / b).toFixed(0)} years out at home; letters arrive after the people who sent them.`,
        );
      }
      return out;
    },
  },

  upstream: ["axiom"],
  downstream: ["vessel", "paradox", "exodus"],
};
