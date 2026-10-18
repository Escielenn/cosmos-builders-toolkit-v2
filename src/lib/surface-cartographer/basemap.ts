// ---------------------------------------------------------------------------
// The generated base map: a deterministic first draft of a surface.
//
// For the writer who has not drawn their world yet. Same seed, same planet,
// every time, on every machine (Law VI's (seed, params) → outputs). Coloured
// by biome bands that come from the body's canon — ocean fraction sets sea
// level EXACTLY (it is a quantile, not a guess), mean temperature and tilt set
// where ice and desert fall, and a tidally locked world bands around its
// substellar point instead of its equator.
//
// A picture, never a source of facts. The biome under a place is offered as a
// suggestion the writer can adopt into the place's own description; nothing
// is written from here on its own.
//
// Noise is sampled on the unit sphere, not the flat sheet, so the map has no
// seam at ±180° and no pinch at the poles when it is wrapped onto the globe.
//
// Pure: produces an RGBA buffer. The page paints it onto a canvas.
// ---------------------------------------------------------------------------

import { BIOME_COLOURS, type Biome } from "@/lib/palettes/biomes";
import { annualInsolation } from "./illumination";
import { angularDistanceDeg } from "./geo";

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Seeded noise
// ---------------------------------------------------------------------------

/** FNV-1a: a string seed to a 32-bit integer. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function lattice(x: number, y: number, z: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 3D value noise, 0..1. */
export function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const c000 = lattice(xi, yi, zi, seed);
  const c100 = lattice(xi + 1, yi, zi, seed);
  const c010 = lattice(xi, yi + 1, zi, seed);
  const c110 = lattice(xi + 1, yi + 1, zi, seed);
  const c001 = lattice(xi, yi, zi + 1, seed);
  const c101 = lattice(xi + 1, yi, zi + 1, seed);
  const c011 = lattice(xi, yi + 1, zi + 1, seed);
  const c111 = lattice(xi + 1, yi + 1, zi + 1, seed);
  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

export function fbm3(x: number, y: number, z: number, seed: number, octaves: number): number {
  let total = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise3(x * f, y * f, z * f, (seed + i * 1013) >>> 0) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return total / norm;
}

// ---------------------------------------------------------------------------
// The surface model
// ---------------------------------------------------------------------------

export interface BaseMapParams {
  seed: string;
  /** 0..1. Unknown → a mid value, and the map is labelled as such. */
  oceanFraction: number | null;
  meanTempC: number | null;
  tiltDeg: number | null;
  locked: boolean;
  substellarLon: number;
}

/** What a body without the facts gets. Said aloud on the page, never filed. */
export const BASEMAP_DEFAULTS = { oceanFraction: 0.6, meanTempC: 14, tiltDeg: 23.44 } as const;

export interface SurfaceModel {
  params: BaseMapParams;
  seedInt: number;
  seaLevel: number;
  oceanFraction: number;
  meanTempC: number;
  tiltDeg: number;
  /** Global moisture multiplier: a dry world is dry everywhere. */
  wetness: number;
  /** Area-weighted mean insolation, for normalising a latitude's share. */
  meanInsolation: number;
}

const CONTINENT_SCALE = 1.6;

function elevationAt(x: number, y: number, z: number, seedInt: number): number {
  // Continents from low-frequency noise, coastlines from the octaves above it.
  const base = fbm3(x * CONTINENT_SCALE, y * CONTINENT_SCALE, z * CONTINENT_SCALE, seedInt, 6);
  // Ridged detail for mountain belts, kept small so it decorates, not dominates.
  const ridge = 1 - Math.abs(fbm3(x * 4.1, y * 4.1, z * 4.1, (seedInt ^ 0x5bd1e995) >>> 0, 3) * 2 - 1);
  return base * 0.85 + ridge * 0.15;
}

function moistureAt(x: number, y: number, z: number, seedInt: number): number {
  return fbm3(x * 2.4 + 7.1, y * 2.4 - 3.3, z * 2.4 + 1.7, (seedInt ^ 0x68e31da4) >>> 0, 4);
}

function toXYZ(latDeg: number, lonDeg: number): [number, number, number] {
  const phi = latDeg * DEG;
  const lam = lonDeg * DEG;
  return [Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam)];
}

/** Golden-spiral sample of the sphere: uniform by area, deterministic. */
function sphereSamples(n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const yv = 1 - ((i + 0.5) / n) * 2;
    const lat = Math.asin(yv) / DEG;
    const lon = (((i * golden) / DEG) % 360) - 180;
    out.push([lat, lon]);
  }
  return out;
}

export function buildSurfaceModel(params: BaseMapParams): SurfaceModel {
  const seedInt = hashSeed(params.seed || "forge");
  const oceanFraction = Math.min(1, Math.max(0, params.oceanFraction ?? BASEMAP_DEFAULTS.oceanFraction));
  const meanTempC = params.meanTempC ?? BASEMAP_DEFAULTS.meanTempC;
  const tiltDeg = Math.abs(params.tiltDeg ?? BASEMAP_DEFAULTS.tiltDeg);

  // Sea level is the elevation below which exactly `oceanFraction` of the
  // surface lies, measured on an area-uniform sample. The writer said 70%
  // water; the map shows 70% water.
  const samples = sphereSamples(4096)
    .map(([lat, lon]) => elevationAt(...toXYZ(lat, lon), seedInt))
    .sort((a, b) => a - b);
  let seaLevel: number;
  if (oceanFraction <= 0) seaLevel = -Infinity;
  else if (oceanFraction >= 1) seaLevel = Infinity;
  else seaLevel = samples[Math.min(samples.length - 1, Math.floor(oceanFraction * samples.length))];

  let meanInsolation = 0;
  for (let i = 0; i < 90; i++) {
    const lat = -89 + i * 2;
    meanInsolation += annualInsolation(lat, tiltDeg, 24) * Math.cos(lat * DEG);
  }
  let weight = 0;
  for (let i = 0; i < 90; i++) weight += Math.cos((-89 + i * 2) * DEG);
  meanInsolation /= weight;

  return {
    params,
    seedInt,
    seaLevel,
    oceanFraction,
    meanTempC,
    tiltDeg,
    wetness: Math.min(1, 0.15 + oceanFraction * 1.2),
    meanInsolation,
  };
}

/**
 * Surface temperature estimate at a point, °C. A picture-maker's model:
 * insolation share relative to the global mean, scaled so an Earth-like
 * world spans roughly 27 °C at the equator to −15 °C at the poles, minus a
 * lapse for height above the sea.
 */
export function temperatureAt(model: SurfaceModel, latDeg: number, lonDeg: number, heightAboveSea: number): number {
  let share: number;
  if (model.params.locked) {
    const elev = 90 - angularDistanceDeg({ lat: latDeg, lon: lonDeg }, { lat: 0, lon: model.params.substellarLon });
    // A sphere lit from one side averages 1/4 of the substellar flux.
    share = Math.max(0, Math.sin(elev * DEG)) * 4;
  } else {
    share = annualInsolation(latDeg, model.tiltDeg, 24) / (model.meanInsolation || 1);
  }
  const k = model.params.locked ? 34 : 60;
  return model.meanTempC + k * (share - 1) - Math.max(0, heightAboveSea) * 120;
}

export function classifyBiome(
  height: number,
  seaLevel: number,
  tempC: number,
  moisture: number,
): Biome {
  // Past this no sea stays liquid at the surface for long; everything bakes.
  if (tempC > 70) return "scorched";
  if (height < seaLevel) {
    if (tempC < -6) return "sea_ice";
    return height < seaLevel - 0.06 ? "deep_ocean" : "shallow_ocean";
  }
  const above = height - seaLevel;
  if (tempC < -12) return "ice_sheet";
  if (above > 0.22) return tempC < 2 ? "ice_sheet" : "highland";
  if (tempC < 0) return "tundra";
  if (tempC < 6) return moisture > 0.35 ? "boreal" : "tundra";
  if (tempC < 18) {
    if (moisture < 0.22) return "desert";
    return moisture > 0.45 ? "temperate_forest" : "grassland";
  }
  if (moisture < 0.3) return "desert";
  if (moisture < 0.5) return "savanna";
  return "jungle";
}

function sample(model: SurfaceModel, latDeg: number, lonDeg: number): { biome: Biome; above: number } {
  const [x, y, z] = toXYZ(latDeg, lonDeg);
  const h = elevationAt(x, y, z, model.seedInt);
  const m = moistureAt(x, y, z, model.seedInt) * model.wetness;
  // Height above the sea. An oceanless world measures from the noise floor;
  // a world entirely under water is entirely below it.
  const above = Number.isFinite(model.seaLevel) ? h - model.seaLevel : model.seaLevel === -Infinity ? h : -1;
  const t = temperatureAt(model, latDeg, lonDeg, above);
  const biome =
    model.oceanFraction <= 0 && m < 0.12 ? (t > 70 ? "scorched" : "barren") : classifyBiome(h, model.seaLevel, t, m);
  return { biome, above };
}

export function biomeAt(model: SurfaceModel, latDeg: number, lonDeg: number): Biome {
  return sample(model, latDeg, lonDeg).biome;
}

/**
 * Paint the whole sheet, equirectangular, row-major RGBA. Light shading from
 * height so coastlines and ranges read without a legend.
 */
export function renderBaseMap(model: SurfaceModel, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    const lat = 90 - ((row + 0.5) / height) * 180;
    for (let col = 0; col < width; col++) {
      const lon = ((col + 0.5) / width) * 360 - 180;
      const { biome, above } = sample(model, lat, lon);
      const [r, g, b] = BIOME_COLOURS[biome];
      // Gentle relief: land brightens with height, water darkens with depth.
      const shade = above >= 0 ? 0.9 + Math.min(0.25, above * 0.9) : 0.85 + Math.max(-0.2, above * 1.5);
      const i = (row * width + col) * 4;
      out[i] = r * shade;
      out[i + 1] = g * shade;
      out[i + 2] = b * shade;
      out[i + 3] = 255;
    }
  }
  return out;
}
