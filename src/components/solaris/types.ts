export type StarClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export interface StarData {
  name: string;
  classification: StarClass;
  massSOL: number;
  luminositySOL: number;
  radiusSOL: number;
  temperatureK: number;
  colorHex: string;
  habitableZoneInnerAU: number;
  habitableZoneOuterAU: number;
  // Multi-star orbit about the system barycenter (undefined/0 = at the center).
  orbitRadiusAU?: number;
  orbitPhase?: number;
  orbitPeriodYears?: number;
}

export type PlanetType =
  | 'rocky'
  | 'super-earth'
  | 'sub-neptune'
  | 'ice-giant'
  | 'gas-giant'
  | 'hot-jupiter'
  | 'ocean-world'
  | 'desert-world'
  | 'lava-world';

export interface MoonData {
  name: string;
  radiusKM: number;
  orbitRadiusKM: number;
  periodDays: number;
  colorHex: string;
  tidally_locked: boolean;
}

/**
 * Rich narrative attributes carried over from the original Solaris (A). Not
 * used by the renderer, but preserved for the info panel (M4) and
 * publish-to-world (M5). Optional so hand-built systems need not supply it.
 */
export interface PlanetMeta {
  archetype: string; // A's planet-type key, e.g. "terrestrial", "gasgiant"
  displayName: string; // A's human label, e.g. "Terrestrial"
  band: 'inner' | 'habitable' | 'outer' | 'remote';
  life: string;
  atmosphere: string;
  water: string;
  hazard: string;
  resources: string;
  note: string;
}

export interface PlanetData {
  /** Stable id so the physics engine can reconcile edits without resetting orbits. */
  id?: string;
  name: string;
  type: PlanetType;
  massEarth: number;
  radiusEarth: number;
  semiMajorAxisAU: number;
  eccentricity: number;
  orbitalPeriodYears: number;
  axialTiltDeg: number;
  colorHex: string;
  atmosphereColorHex?: string;
  hasRings: boolean;
  ringColorHex?: string;
  moons: MoonData[];
  inHabitableZone: boolean;
  surfaceTempK: number;
  meta?: PlanetMeta;
}

export interface AsteroidBeltData {
  innerAU: number;
  outerAU: number;
  density: 'sparse' | 'moderate' | 'dense';
  colorHex: string;
}

export interface StarSystem {
  id: string;
  worldId?: string;
  name: string;
  star: StarData;
  /** All stars incl. the primary (stars[0] === star). Absent/length 1 = single-star. */
  stars?: StarData[];
  architecture?: 'single' | 'binary' | 'trinary' | 'quaternary';
  planets: PlanetData[];
  asteroidBelts: AsteroidBeltData[];
  generatedAt: string;
  seed?: string;
}

export interface SolarisViewerProps {
  system: StarSystem;
  width?: number;
  height?: number;
  initialCameraMode?: CameraMode;
  showUI?: boolean;
  onBodySelect?: (body: SelectedBody | null) => void;
}

export type CameraMode = 'free' | 'star' | `planet-${number}`;

export interface SelectedBody {
  type: 'star' | 'planet' | 'moon';
  name: string;
  data: StarData | PlanetData | MoonData;
}
