// Gravitas: Spacecraft & Habitat Gravity Simulator. Sole producer of
// vessel.radius, vessel.spin_rate and vessel.spin_gravity (08 vessel domain
// exception; 1.9 /sf-fact).
//
// 1.9 F-04: Vessel's spin-gravity link pointed here and Gravitas had no
// manifest, and the only "gravity" it recorded was the REQUESTED g in its
// artificial-gravity mode. Spin gravity is now derived from the hull it
// actually describes: g = ω²r / g₀, ω = 2π·rpm / 60 (centripetal
// acceleration; g₀ = 9.80665 m/s², CGPM 1901).

import type { Derivation, ToolManifest } from "@/canon/manifest";
import { RPM_COMFORT } from "@/lib/gravitas/data";

const G0 = 9.80665;

export const spinGravity: Derivation = {
  id: "gravitas.spin_gravity_from_radius_rate",
  label: "Spin gravity at the rim from radius and spin rate",
  inputs: ["vessel.radius", "vessel.spin_rate"],
  output: "vessel.spin_gravity",
  invalidates: "on_input_change",
  fn: ({ "vessel.radius": r, "vessel.spin_rate": rpm }) => {
    if (!(r > 0) || !(rpm > 0) || !Number.isFinite(r) || !Number.isFinite(rpm)) return null;
    const omega = (2 * Math.PI * rpm) / 60;
    return (omega * omega * r) / G0;
  },
  narrative: (g, inputs) => {
    const rpm = inputs["vessel.spin_rate"];
    const spin =
      typeof rpm === "number" && rpm > RPM_COMFORT
        ? ` At ${rpm.toFixed(1)} rpm newcomers are sick for days; a turned head makes the deck tilt.`
        : " The spin is slow enough that nobody feels it turn.";
    if (g < 0.3) return `${g.toFixed(2)} g at the rim. People bound rather than walk; spilled water hangs.${spin}`;
    if (g < 0.8) return `${g.toFixed(2)} g at the rim. Light on the feet; bones thin over a long voyage.${spin}`;
    if (g <= 1.1) return `${g.toFixed(2)} g at the rim. A dropped cup falls as it does at home.${spin}`;
    return `${g.toFixed(2)} g at the rim. Heavier than Earth; every shift is a workout.${spin}`;
  },
};

export const manifest: ToolManifest = {
  id: "gravitas",
  tool: "gravitas",
  name: "Gravitas: Spacecraft & Habitat Gravity Simulator",
  kind: "calculator",
  category: "civilizations",
  accent: "violet",
  layer: "culture",
  route: "/tools/gravitas",

  entities: [{ type: "vessel", from: "subject", primary: true }],

  produces: [
    { predicate: "vessel.radius", from: "field:spin.radius_m", unit: "m", kind: "scalar" },
    { predicate: "vessel.spin_rate", from: "field:spin.rotation_rpm", unit: "rpm", kind: "scalar" },
    { predicate: "vessel.spin_gravity", from: `derive:${spinGravity.id}`, unit: "g", kind: "scalar" },
  ],

  consumes: [
    { predicate: "propulsion.type", required: false, onMissing: "link", producer: "impulse" },
    { predicate: "planet.surface_gravity", required: false, onMissing: "link", producer: "atlas" },
  ],

  derives: [spinGravity],

  situations: [],

  studio: {
    railSection: "World",
    influences: ["scene.physicality", "scene.sound"],
    narrative: (facts) => {
      const g = Number(facts["vessel.spin_gravity"]);
      const rpm = Number(facts["vessel.spin_rate"]);
      return Number.isFinite(g) && g > 0 ? [spinGravity.narrative(g, Number.isFinite(rpm) ? { "vessel.spin_rate": rpm } : {})] : [];
    },
  },

  upstream: ["atlas", "impulse"],
  downstream: ["vessel"],
};
