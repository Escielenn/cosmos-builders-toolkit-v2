// ---------------------------------------------------------------------------
// Reference worlds for the planet preview.
//
// These are the preview's sim inputs, nothing more: the same quantities a
// writer sets in Tidelock or ExoForge, filled with published values for
// real or archetypal worlds so the scene can be checked against something
// known. They are EPHEMERAL (Law I): never written to canon. A world from
// canon arrives through planetSceneFactsFromCanon instead.
//
// Values: NASA Planetary Fact Sheets (Earth, Venus, Saturn); Proxima b,
// Anglada-Escudé et al. 2016 (Nature 536:437); TRAPPIST-1e, Agol et al.
// 2021 (PSJ 2:1). Kellis Prime is the render-engine doc's test world
// (14-RENDER-ENGINE, Brief G2).
// ---------------------------------------------------------------------------

import { EMPTY_FACTS, type PlanetSceneFacts } from "./planet-scene";

export interface PlanetPreset {
  id: string;
  label: string;
  facts: PlanetSceneFacts;
}

const f = (over: Partial<PlanetSceneFacts>): PlanetSceneFacts => ({ ...EMPTY_FACTS, ...over });

export const PLANET_PRESETS: PlanetPreset[] = [
  {
    id: "earth",
    label: "Earth-like",
    facts: f({
      name: "Earth analogue",
      spectralClass: "G2V",
      aAU: 1,
      massEarth: 1,
      radiusEarth: 1,
      albedo: 0.3,
      pressureBar: 1,
      composition: "N2 78%, O2 21%, Ar 1%",
      greenhouseTau: 0.84,
      hydrosphere: 0.71,
      obliquityDeg: 23.4,
      rotationHours: 23.93,
      tidallyLocked: false,
      life: true,
      civilisation: true,
      seed: 3,
    }),
  },
  {
    id: "eyeball",
    label: "Locked ocean world",
    facts: f({
      name: "TRAPPIST-1e analogue",
      spectralClass: "M8V",
      aAU: 0.02925,
      massEarth: 0.69,
      radiusEarth: 0.92,
      albedo: 0.3,
      pressureBar: 1,
      composition: "N2 90%, CO2 10%",
      hydrosphere: 0.6,
      tidallyLocked: true,
      seed: 11,
    }),
  },
  {
    id: "airless-m-dwarf",
    label: "Airless locked world",
    facts: f({
      name: "Proxima b analogue",
      spectralClass: "M5V",
      aAU: 0.0485,
      massEarth: 1.07,
      radiusEarth: 1.03,
      albedo: 0.12,
      pressureBar: 0,
      hydrosphere: 0,
      tidallyLocked: true,
      seed: 7,
    }),
  },
  {
    id: "venus",
    label: "Thick CO₂ world",
    facts: f({
      name: "Venus analogue",
      spectralClass: "G2V",
      aAU: 0.723,
      massEarth: 0.815,
      radiusEarth: 0.949,
      albedo: 0.77,
      pressureBar: 92,
      composition: "CO2 96.5%, N2 3.5%",
      hydrosphere: 0,
      obliquityDeg: 177.4,
      rotationHours: -5832,
      tidallyLocked: false,
      seed: 5,
    }),
  },
  {
    id: "ringed-giant",
    label: "Ringed giant",
    facts: f({
      name: "Saturn analogue",
      spectralClass: "G2V",
      aAU: 9.58,
      massEarth: 95.2,
      radiusEarth: 9.45,
      albedo: 0.34,
      obliquityDeg: 26.7,
      rotationHours: 10.7,
      tidallyLocked: false,
      rings: { inner: 1.24, outer: 2.27 },
      seed: 9,
    }),
  },
  {
    id: "kellis-prime",
    label: "Kellis Prime",
    facts: f({
      name: "Kellis Prime",
      spectralClass: "K3V",
      massEarth: 1.3,
      radiusEarth: 1.1,
      pressureBar: 0.6,
      composition: "N2/CO2",
      hydrosphere: 0.4,
      tidallyLocked: true,
      seed: 21,
    }),
  },
];

export function presetById(id: string | null | undefined): PlanetPreset | undefined {
  return PLANET_PRESETS.find((p) => p.id === id);
}
