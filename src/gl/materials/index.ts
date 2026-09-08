// forge-gl materials (Block G2). See docs/stellarforge/14-RENDER-ENGINE.md §2.
export {
  SPECTRAL_CLASS_KELVIN,
  coronaAmplitude,
  kelvinToRGB,
  limbDarkening,
  spectralClassKelvin,
} from "./blackbody";
export {
  AIRLESS_ATMOSPHERE,
  atmosphereUniforms,
  rimThickness,
  terminatorSoftness,
} from "./atmosphere";
export type { AtmosphereUniforms } from "./atmosphere";
export { surfaceUniforms } from "./surface";
export type { SurfaceUniforms } from "./surface";
export { createStarSurfaceMaterial, createStarCoronaMaterial } from "./StarMaterial";
export {
  atmosphereShellScale,
  createAtmosphereMaterial,
  createSurfaceMaterial,
} from "./AtmosphereMaterial";
