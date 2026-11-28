// forge-gl materials (Block G2). See docs/stellarforge/14-RENDER-ENGINE.md §2.
export {
  SPECTRAL_CLASS_KELVIN,
  coronaAmplitude,
  kelvinToRGB,
  limbDarkening,
  spectralClassKelvin,
  STAR_CORE_MAX,
  starCoreRadiance,
  blackbodyHue,
  adaptedLight,
  CHROMATIC_ADAPTATION_D,
} from "./blackbody";
export { scattering, parseGasMix, earthRayleighTau } from "./scattering";
export type { Scattering, GasMix } from "./scattering";
export { paintSurface, heightField, vegetationReflectance } from "./terrain";
export type { SurfaceMaps, HeightField } from "./terrain";
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
