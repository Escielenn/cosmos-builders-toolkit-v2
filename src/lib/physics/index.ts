/**
 * src/lib/physics: one source of formulas for the app and the static sims.
 * The static twin is public/tools/_shared/physics.js (window.SFPhysics);
 * __tests__/parity.test.ts keeps the two identical.
 */
export * from "./constants";
export * from "./mainSequence";
export * from "./formulas";
export {
  kopparapuEdges,
  seff as kopparapuSeff,
  KOPPARAPU_2014,
  type KopparapuEdges,
  type KopparapuLimit,
} from "@/lib/habitable-zone/kopparapu";
