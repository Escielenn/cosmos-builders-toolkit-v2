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

export interface PlanetData {
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
  planets: PlanetData[];
  asteroidBelts: AsteroidBeltData[];
  generatedAt: string;
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
