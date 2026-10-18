// Atlas: Surface Gravity Calculator. Sole producer of planet.surface_gravity,
// planet.escape_velocity and planet.density (03-TOOL-CHARTER anti-duplication
// registry), each derived from planet.mass + planet.radius, which Genesis owns.
//
// Today the Atlas worksheet still records its own mass and radius
// (primary.mass / primary.radius) and those project as planet.mass /
// planet.radius. That is the Parallel Truth the Charter's gravity demo
// resolves; this manifest states the target, /sf-wire atlas does the work.

import type { Derivation, ToolManifest } from "@/canon/manifest";

/** Earth: 11.186 km/s escape velocity, 5.514 g/cm³ mean density. */
const EARTH_V_ESC = 11.186;
const EARTH_DENSITY = 5.514;

function pctVsEarth(x: number): string {
  const pct = Math.round(Math.abs(x - 1) * 100);
  if (pct === 0) return "the same as on Earth";
  return `${pct}% ${x > 1 ? "more" : "less"} than on Earth`;
}

const valid = (m: number | undefined, r: number | undefined): m is number =>
  typeof m === "number" && typeof r === "number" && m > 0 && r > 0 && Number.isFinite(m) && Number.isFinite(r);

export const surfaceGravity: Derivation = {
  id: "atlas.surface_gravity_from_mass_radius",
  label: "Surface gravity from mass and radius",
  inputs: ["planet.mass", "planet.radius"],
  output: "planet.surface_gravity",
  invalidates: "on_input_change",
  // g = M / R², Earth units.
  fn: ({ "planet.mass": m, "planet.radius": r }) => (valid(m, r) ? m / (r * r) : null),
  narrative: (g) => {
    const v = g.toFixed(2);
    if (g >= 1.25) return `${v} g. A fall carries ${pctVsEarth(g)}. Stairs are a hazard; architecture goes low and wide.`;
    if (g <= 0.75) return `${v} g. A fall carries ${pctVsEarth(g)}. Bodies grow tall; a thrown stone travels far.`;
    return `${v} g. A fall carries ${pctVsEarth(g)}. Bodies and buildings pass for Earth's.`;
  },
};

export const escapeVelocity: Derivation = {
  id: "atlas.escape_velocity_from_mass_radius",
  label: "Escape velocity from mass and radius",
  inputs: ["planet.mass", "planet.radius"],
  output: "planet.escape_velocity",
  invalidates: "on_input_change",
  // v = v⊕ · √(M / R).
  fn: ({ "planet.mass": m, "planet.radius": r }) => (valid(m, r) ? EARTH_V_ESC * Math.sqrt(m / r) : null),
  narrative: (v) =>
    `Escape velocity ${v.toFixed(1)} km/s. Leaving costs ${pctVsEarth(v / EARTH_V_ESC)} in speed; every launch is ${v > EARTH_V_ESC ? "a harder" : "an easier"} decision.`,
};

export const density: Derivation = {
  id: "atlas.density_from_mass_radius",
  label: "Mean density from mass and radius",
  inputs: ["planet.mass", "planet.radius"],
  output: "planet.density",
  invalidates: "on_input_change",
  // ρ = ρ⊕ · M / R³.
  fn: ({ "planet.mass": m, "planet.radius": r }) => (valid(m, r) ? (EARTH_DENSITY * m) / (r * r * r) : null),
  narrative: (rho) =>
    rho >= 4
      ? `${rho.toFixed(2)} g/cm³. An iron-rich interior; a strong magnetic field is plausible.`
      : `${rho.toFixed(2)} g/cm³. Light for a rock world: water, ice or a thick envelope.`,
};

export const manifest: ToolManifest = {
  id: "atlas",
  tool: "surface-gravity-calculator",
  name: "Atlas: Surface Gravity Calculator",
  kind: "calculator",
  category: "worlds",
  accent: "amber",
  layer: "physics",
  route: "/tools/surface-gravity-calculator",

  entities: [],

  produces: [
    { predicate: "planet.surface_gravity", from: `derive:${surfaceGravity.id}`, unit: "g", kind: "scalar" },
    { predicate: "planet.escape_velocity", from: `derive:${escapeVelocity.id}`, unit: "km_s", kind: "scalar" },
    { predicate: "planet.density", from: `derive:${density.id}`, unit: "g_cm3", kind: "scalar" },
  ],

  consumes: [
    { predicate: "planet.mass", required: true, onMissing: "link", producer: "genesis" },
    { predicate: "planet.radius", required: true, onMissing: "link", producer: "genesis" },
  ],

  derives: [surfaceGravity, escapeVelocity, density],

  situations: ["high-g-spaceflight-ambition"],

  studio: {
    railSection: "World",
    influences: ["scene.physicality", "scene.travel"],
    narrative: (facts) => {
      const g = Number(facts["planet.surface_gravity"]);
      return Number.isFinite(g) && g > 0 ? [surfaceGravity.narrative(g, {})] : [];
    },
  },

  upstream: ["genesis"],
  downstream: ["gravitas", "phylo", "vessel"],
};
