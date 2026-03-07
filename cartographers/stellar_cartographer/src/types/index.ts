// Stellar Cartographer Types
// StellarForge.tools

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
export type GalaxyType = 'spiral' | 'barred' | 'elliptical' | 'irregular';
export type NamingStyle = 'terran' | 'harsh' | 'flowing' | 'poetic';
export type TerritoryBorderStyle = 'soft' | 'sharp' | 'none';

export interface StarTypeData {
  color: string;
  temp: string;
  mass: string;
  rarity: number;
  habitable: number;
  size: number;
  luminosity: [number, number];
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint extends Position {
  scale: number;
}

export interface Star {
  id: number;
  x: number;
  y: number;
  z: number;
  type: SpectralClass;
  baseColor: string;
  color: string;
  size: number;
  brightness: number;
  luminosity: number;
  name: string;
  empire: Empire | null;
  hasHabitable: boolean;
  labelPriority: number;
}

export interface ScreenStar extends Star {
  screenX: number;
  screenY: number;
  screenZ: number;
  scale: number;
}

export interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export interface Empire {
  id: number;
  name: string;
  color: string;
  namingStyle: NamingStyle;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface TradeRoute {
  id: number;
  name: string;
  color: string;
  stars: Star[];
}

export interface Wormhole {
  id: number;
  name: string;
  starA: Star;
  starB: Star;
  color: string;
  stable: boolean;
}

export interface GalaxyConfig {
  type: GalaxyType;
  starCount: number;
  armCount: number;
  armSpread: number;
  seed: number;
}

export interface ViewConfig {
  rotation: number;
  tilt: number;
  autoRotate: boolean;
}

export interface DisplayConfig {
  showTerritories: boolean;
  showRoutes: boolean;
  showHabitableIndicators: boolean;
  territoryOpacity: number;
  territoryBorderStyle: TerritoryBorderStyle;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface RouteDrawingState {
  active: boolean;
  stars: Star[];
}

export interface WormholeDrawingState {
  active: boolean;
  firstStar: Star | null;
}

export interface CartographerState {
  galaxyName: string;
  config: GalaxyConfig;
  view: ViewConfig;
  display: DisplayConfig;
  camera: CameraState;
  targetCamera: CameraState;
  stars: Star[];
  backgroundStars: BackgroundStar[];
  empires: Empire[];
  tradeRoutes: TradeRoute[];
  wormholes: Wormhole[];
  selectedStar: Star | null;
  routeDrawing: RouteDrawingState;
  wormholeDrawing: WormholeDrawingState;
  nextEmpireId: number;
  nextRouteId: number;
  nextWormholeId: number;
}

export interface NamingStyleData {
  prefixes: string[];
  roots: string[];
  suffixes: string[];
  patterns: string[];
}

export interface ExportData {
  meta: {
    generator: string;
    seed: number;
    exportedAt: string;
  };
  galaxyName: string;
  galaxy: GalaxyConfig;
  empires: Empire[];
  tradeRoutes: Array<{
    id: number;
    name: string;
    color: string;
    stars: Array<{ id: number; name: string }>;
  }>;
  wormholes: Array<{
    id: number;
    name: string;
    starA: string;
    starB: string;
    stable: boolean;
  }>;
  notableSystems: Array<{
    name: string;
    type: SpectralClass;
    empire: string | null;
  }>;
}
