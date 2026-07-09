// Stellar Cartographer Constants
// Configuration values and defaults

import { GalaxyConfig, ViewConfig, DisplayConfig, CameraState, Empire } from './types';

// Galaxy generation
export const GALAXY_RADIUS = 450;
export const MAX_STARS = 25000;
export const MIN_STARS = 2000;
export const DEFAULT_STARS = 8000;

// Camera
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 12;
export const ZOOM_IN_FACTOR = 1.14;
export const ZOOM_OUT_FACTOR = 0.88;
export const CAMERA_SMOOTHING = 0.1;

// Labels
export const LABEL_ZOOM_THRESHOLD = 2.5;
export const MAX_LABELS = 30;
export const LABEL_COLLISION_DISTANCE = 60;

// Background
export const BACKGROUND_STAR_COUNT = 600;
export const PARALLAX_FACTOR = 0.03;

// Trade routes
export const ROUTE_COLORS = ['#FFA500', '#FFD43B', '#15C17B', '#2ECC71', '#E056FD', '#FF6B6B'];
export const AUTO_ROUTE_COUNT = 5;
export const AUTO_ROUTE_MAX_HOPS = 8;
export const AUTO_ROUTE_MIN_HOPS = 4;
export const AUTO_ROUTE_MAX_REACH = 500;
export const AUTO_ROUTE_MIN_DISTANCE = 50;

// Wormholes
export const WORMHOLE_COLORS = ['#9B59B6', '#8E44AD', '#E056FD'];
export const AUTO_WORMHOLE_COUNT = 2;
export const AUTO_WORMHOLE_MIN_DISTANCE = 280;
export const WORMHOLE_STABLE_CHANCE = 0.7;

// Default configurations
export const DEFAULT_CONFIG: GalaxyConfig = {
  type: 'spiral',
  starCount: 8000,
  armCount: 4,
  armSpread: 0.35,
  seed: 42
};

export const DEFAULT_VIEW: ViewConfig = {
  rotation: 0,
  tilt: 0,
  autoRotate: false
};

export const DEFAULT_DISPLAY: DisplayConfig = {
  showTerritories: true,
  showRoutes: true,
  showHabitableIndicators: true,
  territoryOpacity: 70,
  territoryBorderStyle: 'soft'
};

export const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1
};

export const DEFAULT_EMPIRES: Empire[] = [
  {
    id: 1,
    name: 'Terran Federation',
    color: '#15C17B',
    namingStyle: 'terran',
    centerX: -180,
    centerY: 0,
    radius: 320
  },
  {
    id: 2,
    name: 'Krath Dominion',
    color: '#E74C3C',
    namingStyle: 'harsh',
    centerX: 220,
    centerY: -120,
    radius: 260
  },
  {
    id: 3,
    name: 'Aelarian Collective',
    color: '#E056FD',
    namingStyle: 'flowing',
    centerX: 80,
    centerY: 220,
    radius: 280
  },
  {
    id: 4,
    name: 'Storm Reach Alliance',
    color: '#2ECC71',
    namingStyle: 'poetic',
    centerX: -280,
    centerY: -220,
    radius: 230
  }
];

// Supermassive Black Hole
export const SMBH_ACTIVITY_CONFIG = {
  quiescent: { glowMultiplier: 4, color: '#FFB800', diskArcs: 2, arcOpacity: 0.2 },
  active: { glowMultiplier: 8, color: '#FF6B35', diskArcs: 3, arcOpacity: 0.35 },
  quasar: { glowMultiplier: 12, color: '#15C17B', diskArcs: 4, arcOpacity: 0.5 },
} as const;

export const DEFAULT_SMBH_MASS = 4; // millions of solar masses (Sgr A* ≈ 4M)

// 3D Projection
export const PERSPECTIVE_DISTANCE = 1000;
export const Z_OFFSET = 200;
export const DEPTH_SCALE_FACTOR = 0.4;

// Star rendering
export const STAR_SIZE_ZOOM_EXPONENT = 0.7;
export const STAR_SIZE_MULTIPLIER = 0.5;
export const MIN_STAR_SIZE = 0.3;
export const DEPTH_FADE_DISTANCE = 350;
export const MIN_DEPTH_FADE = 0.25;

// Click detection
export const CLICK_DETECTION_RADIUS = 25; // Screen pixels

// Animation
export const AUTO_ROTATE_SPEED = 0.08; // Degrees per frame

// Export
export const PNG_SCALE = 2;
export const WATERMARK_FONT_SIZE = 14;
export const WATERMARK_OPACITY = 0.4;
