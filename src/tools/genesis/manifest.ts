// Genesis: Planetary Profile. Primary creator of the planet entity and sole
// producer of its physical parameters (03-TOOL-CHARTER, Tier 1 #1).
//
// Gravity is Atlas's, not Genesis's (the Charter's gravity demo): Genesis
// consumes planet.surface_gravity as a readout with a one-click path to
// Atlas. The Genesis worksheet still stores physicalCharacteristics.
// surfaceGravity today, and it still projects; retiring that field is the
// /sf-wire genesis session, not this manifest.

import type { ToolManifest } from "@/canon/manifest";

export const manifest: ToolManifest = {
  id: "genesis",
  tool: "planetary-profile",
  name: "Genesis: Planetary Profile",
  kind: "worksheet",
  category: "worlds",
  accent: "azure",
  layer: "environment",
  route: "/tools/planetary-profile",

  entities: [{ type: "planet", from: "subject", primary: true }],

  // `from` paths are the same paths entity-config's worksheetPaths map, so
  // the manifest and the computed-on-read projection cannot drift (tested).
  produces: [
    { predicate: "planet.mass", from: "field:physicalCharacteristics.planetaryMass", unit: "earth_masses", kind: "scalar" },
    { predicate: "planet.radius", from: "field:physicalCharacteristics.planetaryRadius", unit: "earth_radii", kind: "scalar" },
    { predicate: "planet.rotation_period", from: "field:physicalCharacteristics.dayLength", unit: "hours", kind: "scalar" },
    { predicate: "planet.obliquity", from: "field:physicalCharacteristics.axialTilt", unit: "deg", kind: "scalar" },
  ],

  consumes: [
    {
      predicate: "star.spectral_class",
      required: false,
      onMissing: "prompt",
      prompt: "NO PRIMARY STAR ON FILE. RUN ORRERY OR ENTER MANUALLY.",
    },
    {
      predicate: "star.luminosity",
      required: false,
      onMissing: "prompt",
      prompt: "NO STELLAR LUMINOSITY ON FILE. RUN GOLDILOCKS OR ENTER MANUALLY.",
    },
    { predicate: "planet.surface_gravity", required: false, onMissing: "link", producer: "atlas" },
  ],

  derives: [],

  situations: ["high-g-spaceflight-ambition", "atmo-biochem-mismatch"],

  studio: {
    railSection: "World",
    influences: ["scene.physicality", "scene.weather", "scene.travel"],
    narrative: (facts) => {
      const out: string[] = [];
      const day = Number(facts["planet.rotation_period"]);
      if (Number.isFinite(day) && day > 0) {
        out.push(`A day lasts ${day} hours.${day > 36 ? " Sleep does not follow the sun." : ""}`);
      }
      const tilt = Number(facts["planet.obliquity"]);
      if (Number.isFinite(tilt)) {
        out.push(tilt >= 35 ? `Axial tilt ${tilt}°. Seasons are violent.` : `Axial tilt ${tilt}°.`);
      }
      return out;
    },
  },

  upstream: ["orrery", "goldilocks", "solaris"],
  downstream: ["atlas", "phylo", "cascade"],
};
