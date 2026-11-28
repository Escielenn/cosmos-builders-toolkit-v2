// ---------------------------------------------------------------------------
// Procedural terrain, coloured by physics (14-RENDER-ENGINE §2 Tier 1;
// Brief 2.0-G item 3).
//
// Two stages, split for cost:
//
//   heightField(seed, width)   seeded fBm noise sampled on the sphere (no
//                              seam, no pole pinch). Depends only on the seed
//                              and resolution, so it is computed once per
//                              world and cached. The expensive part.
//   paintSurface(binding, w)   per texel: the temperature the physics gives
//                              at that latitude and longitude decides ocean,
//                              sea ice, snow, desert, scorched rock, dry
//                              basin, vegetation, incandescence and city
//                              lights. Cheap: dragging a slider repaints it.
//
// Sea level is the exact quantile of the height field at the hydrosphere
// fraction, so "71% ocean" means 71% of the texels are under water, not
// "about that, depending on the noise".
//
// A tidally locked world needs nothing special here: its temperature field
// already peaks at the substellar point and falls to the night side, so the
// terminator band where water stays liquid (Tidelock's whole subject) shows
// up as geography: an eye of open ocean or desert facing the star, a ring of
// shoreline, a frozen far side.
//
// Pure: typed arrays out, no three.js, so it is tested and timed in node.
// ---------------------------------------------------------------------------

import { CLOUD_REFLECTANCE, GIANT_BANDS, SURFACE_REFLECTANCE, type LinearRGB } from "@/lib/palettes/planet-surface";
import type { PlanetSceneBinding } from "../bind/planet-scene";
import { blackbodyHue } from "./blackbody";

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

/** Integer lattice hash → [0, 1). Deterministic across engines (no Math.sin). */
function hash3(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(seed, 1597334677);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);
  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

export function fbm(x: number, y: number, z: number, seed: number, octaves: number): number {
  let total = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * freq, y * freq, z * freq, seed + i * 31) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return total / norm;
}

/** Texel centre → latitude, longitude in degrees. Row 0 is the SOUTH pole row (DataTexture, flipY false, uv.y = 0). */
export function texelLatLon(i: number, j: number, width: number, height: number): [number, number] {
  return [-90 + (180 * (j + 0.5)) / height, -180 + (360 * (i + 0.5)) / width];
}

/** Matches bind/globe's globeDirection: lon 0 on +X, lon +90 on −Z. */
function dir(latDeg: number, lonDeg: number): [number, number, number] {
  const phi = (latDeg * Math.PI) / 180;
  const lam = (lonDeg * Math.PI) / 180;
  return [Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam)];
}

// ---------------------------------------------------------------------------
// Height field (cached)
// ---------------------------------------------------------------------------

export interface HeightField {
  width: number;
  height: number;
  /** 0..1 per texel. */
  data: Float32Array;
  /** Ascending copy, for exact quantiles. */
  sorted: Float32Array;
  /** Second, independent field for clouds. */
  clouds: Float32Array;
  cloudsSorted: Float32Array;
  /** Impact relief, −1..1 (bowl negative, rim positive). Scaled by erosion when painted. */
  craters: Float32Array;
}

/**
 * Impact craters with a power-law size distribution, N(>D) ∝ D^−2 (the
 * lunar highlands' cumulative slope; Neukum, Ivanov & Hartmann 2001, Space
 * Sci. Rev. 96:55), each a bowl with a raised rim (simple-crater profile,
 * Melosh 1989 "Impact Cratering", ch. 8). Built once per seed; how much of
 * it survives is decided at paint time by the atmosphere and water that
 * would have eroded it.
 */
function craterField(seed: number, width: number, height: number): Float32Array {
  const out = new Float32Array(width * height);
  let a = (seed * 2654435761) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const COUNT = 420;
  const R_MIN = 0.012; // radians
  const R_MAX = 0.22;
  for (let c = 0; c < COUNT; c++) {
    // Inverse-CDF of N(>r) ∝ r^−2 between R_MIN and R_MAX.
    const u = rand();
    const r = R_MIN / Math.sqrt(1 - u * (1 - (R_MIN / R_MAX) ** 2));
    const z = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const cx = Math.sqrt(1 - z * z) * Math.cos(phi);
    const cy = z;
    const cz = Math.sqrt(1 - z * z) * Math.sin(phi);
    const latC = (Math.asin(cy) * 180) / Math.PI;
    const span = r * 1.6;
    const j0 = Math.max(0, Math.floor(((latC - (span * 180) / Math.PI + 90) / 180) * height));
    const j1 = Math.min(height - 1, Math.ceil(((latC + (span * 180) / Math.PI + 90) / 180) * height));
    const depth = Math.min(1, r / 0.06);
    for (let j = j0; j <= j1; j++) {
      for (let i = 0; i < width; i++) {
        const [lat, lon] = texelLatLon(i, j, width, height);
        const [x, y, zz] = dir(lat, lon);
        const d = Math.acos(Math.min(1, Math.max(-1, x * cx + y * cy + zz * cz))) / r;
        if (d > 1.6) continue;
        // Bowl to d = 1, rim peaking just outside, ejecta fading by 1.6.
        const v = d < 1 ? (d * d - 1) * 0.9 + 0.25 * d ** 6 : 0.25 * Math.exp(-(((d - 1) / 0.22) ** 2));
        out[j * width + i] += v * depth;
      }
    }
  }
  return out;
}

const fieldCache = new Map<string, HeightField>();
const MAX_CACHED = 6;

export function heightField(seed: number, width: number): HeightField {
  const key = `${seed}:${width}`;
  const hit = fieldCache.get(key);
  if (hit) return hit;
  const height = width / 2;
  const n = width * height;
  const data = new Float32Array(n);
  const clouds = new Float32Array(n);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const [lat, lon] = texelLatLon(i, j, width, height);
      const [x, y, z] = dir(lat, lon);
      // Continents at ~2 per hemisphere, plus ridged detail for ranges.
      const base = fbm(x * 1.7 + 11.3, y * 1.7 - 4.1, z * 1.7 + 7.7, seed, 6);
      const ridge = 1 - Math.abs(2 * fbm(x * 5 + 3.1, y * 5 + 9.2, z * 5 - 1.7, seed + 101, 3) - 1);
      data[j * width + i] = base * 0.82 + ridge * ridge * 0.18 * base;
      // Clouds: domain-warped and stretched along latitude circles, so
      // turning worlds read as zonal flow and frontal swirls rather than
      // cotton wool; a fine octave set breaks the edges.
      const warp = fbm(x * 1.4 - 3.3, y * 1.4 + 6.1, z * 1.4 + 2.2, seed + 433, 3) - 0.5;
      const broad = fbm((x + warp) * 2.6 + 5.5, (y + warp * 0.6) * 6.5 - 2.2, (z - warp) * 2.6 + 1.3, seed + 977, 5);
      const fine = fbm(x * 11 + 1.1, y * 14 - 4.4, z * 11 + 8.8, seed + 1499, 3);
      clouds[j * width + i] = broad * 0.72 + fine * 0.28;
    }
  }
  const sorted = Float32Array.from(data).sort();
  const cloudsSorted = Float32Array.from(clouds).sort();
  const craters = craterField(seed, width, height);
  const field = { width, height, data, sorted, clouds, cloudsSorted, craters };
  fieldCache.set(key, field);
  if (fieldCache.size > MAX_CACHED) fieldCache.delete(fieldCache.keys().next().value as string);
  return field;
}

export function quantile(sorted: Float32Array, q: number): number {
  if (sorted.length === 0) return 0;
  const k = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[k];
}

// ---------------------------------------------------------------------------
// Painting
// ---------------------------------------------------------------------------

export interface SurfaceMaps {
  width: number;
  height: number;
  /** RGBA8, sRGB-encoded reflectance. */
  albedo: Uint8Array;
  /** RGBA8: R height, G open water (specular), B ice, A 255. Linear data. */
  props: Uint8Array;
  /** RGBA8, sRGB-encoded emitted light (incandescence, city lights). */
  emission: Uint8Array;
  /** RGBA8: R cloud opacity. Linear data. */
  clouds: Uint8Array;
  /** Height of the sea surface in the 0..1 height field. */
  seaLevel: number;
  stats: { ocean: number; ice: number; liquid: number; lit: number };
}

/** Linear 0..1 → sRGB byte. */
function toSrgbByte(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

const mixC = (a: LinearRGB, b: LinearRGB, t: number): LinearRGB => {
  const k = Math.min(1, Math.max(0, t));
  return { r: a.r + (b.r - a.r) * k, g: a.g + (b.g - a.g) * k, b: a.b + (b.b - a.b) * k };
};
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Draper point: every solid starts to glow a dull red near 798 K (Draper 1847). */
export const DRAPER_POINT_K = 798;
/** Correlated colour temperature of mixed sodium and warm-LED street light. */
export const CITY_LIGHT_K = 2700;
/** Tropospheric lapse rate, K per km (US Standard Atmosphere 1976). */
const LAPSE_K_PER_KM = 6.5;
/** Height of the highest peaks above sea level, km. Earth: 8.8. */
const PEAK_KM = 9;

/**
 * Plant reflectance under a star of this temperature (Kiang et al. 2007):
 * Earth's green near the Sun, darkening toward near-black under M dwarfs,
 * warming toward yellow-orange under F stars.
 */
export function vegetationReflectance(teffK: number): LinearRGB {
  const v = SURFACE_REFLECTANCE;
  if (teffK < 5000) return mixC(v.vegetationDark, v.vegetationEarth, smooth(3000, 5000, teffK));
  if (teffK > 6200) return mixC(v.vegetationEarth, v.vegetationWarm, smooth(6200, 7500, teffK));
  return v.vegetationEarth;
}

export function paintSurface(b: PlanetSceneBinding, width: number): SurfaceMaps {
  const field = heightField(b.seed, width);
  const { height } = field;
  // Craters survive where nothing erodes them: they fade with atmosphere
  // (wind, weathering) and vanish under oceans and active water. Mars at
  // 0.006 bar keeps most; Earth keeps almost none.
  const erosion = b.kind !== "rocky" ? 0 : Math.exp(-b.pressureBar * 6) * (b.water.fraction > 0.05 ? 0.15 : 1);
  const data =
    erosion > 0.01
      ? field.data.map((h, k) => h + field.craters[k] * 0.07 * erosion)
      : field.data;
  const sortedH = erosion > 0.01 ? Float32Array.from(data).sort() : field.sorted;
  const n = width * height;
  const albedo = new Uint8Array(n * 4);
  const props = new Uint8Array(n * 4);
  const emission = new Uint8Array(n * 4);
  const clouds = new Uint8Array(n * 4);
  const sea = b.water.fraction > 0 ? quantile(sortedH, b.water.fraction) : -1;
  const hiH = sortedH[sortedH.length - 1] || 1;
  const loH = sortedH[0] || 0;
  const P = SURFACE_REFLECTANCE;
  const veg = b.life ? vegetationReflectance(b.star.teffK) : null;
  const cityHue = blackbodyHue(CITY_LIGHT_K);
  const anyWater = b.water.fraction > 0 && b.water.liquidPossible;
  const thinAir = b.pressureBar < 0.01;
  // Gas giants: band count from the Rhines scale, which sets jet spacing:
  // L ∝ √(U/β), β ∝ Ω, so faster rotation means more, narrower bands
  // (Rhines 1975, J. Fluid Mech. 69:417). Jupiter (~10 h) shows ~7 per
  // hemisphere.
  const bands = Math.min(14, Math.max(3, 7 * Math.sqrt(10 / Math.max(b.rotationHours, 1))));
  const [zone, belt] = b.kind === "ice" ? GIANT_BANDS.ice : GIANT_BANDS[b.sudarsky ?? "I"];

  let oceanCount = 0;
  let iceCount = 0;
  let liquidCount = 0;
  let litCount = 0;

  // Rotating worlds: temperature depends on latitude only. Cache per row.
  const rowT = new Float32Array(height);
  if (!b.tidallyLocked) for (let j = 0; j < height; j++) rowT[j] = b.temperature.at(texelLatLon(0, j, width, height)[0], 0);

  // Cloud field and threshold for the requested cover. A locked world's deck
  // piles up over the substellar point (Yang, Cowan & Abbot 2013, ApJL
  // 771:L45); the threshold is taken AFTER that bias, so the cover stays the
  // stated fraction of the globe and only its placement moves.
  let cloudField = field.clouds;
  let cloudSorted = field.cloudsSorted;
  if (b.clouds.substellarDeck && b.clouds.coverage > 0 && b.clouds.coverage < 0.999) {
    cloudField = new Float32Array(n);
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const [lat, lon] = texelLatLon(i, j, width, height);
        const cosTheta = Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180);
        cloudField[j * width + i] = field.clouds[j * width + i] + 0.22 * cosTheta;
      }
    }
    cloudSorted = Float32Array.from(cloudField).sort();
  }
  const cloudCut = quantile(cloudSorted, 1 - b.clouds.coverage);

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const k = j * width + i;
      const o = k * 4;
      const [lat, lon] = texelLatLon(i, j, width, height);
      const h = data[k];
      const T = b.tidallyLocked ? b.temperature.at(lat, lon) : rowT[j];
      let colour: LinearRGB;
      let water = 0;
      let ice = 0;
      let emit: LinearRGB = { r: 0, g: 0, b: 0 };

      if (b.kind !== "rocky") {
        const turbulence = (h - 0.5) * 2.2;
        const s = Math.sin(((lat * Math.PI) / 180) * bands + turbulence);
        const contrast = b.kind === "ice" ? 0.35 : 1;
        colour = mixC(zone, belt, (0.5 + 0.5 * s) * contrast + (1 - contrast) * 0.3);
      } else {
        const below = h < sea;
        // Hypsometry: most land is low, a little is very high. rel³ puts the
        // median land surface near 1 km and the peaks at 9 km, close to
        // Earth's (mean land elevation 0.84 km; Everest 8.8 km).
        const rel = Math.max(0, (h - Math.max(sea, loH)) / Math.max(hiH - Math.max(sea, loH), 1e-3));
        const elevKm = rel * rel * rel * PEAK_KM;
        if (below) {
          const depth = (sea - h) / Math.max(sea, 1e-3);
          if (!b.water.liquidPossible || T >= b.water.boilK) {
            // Too thin to hold liquid, or boiled off: an empty basin.
            if (T < b.water.freezeK) {
              colour = P.seaIce;
              ice = 1;
            } else colour = mixC(P.evaporite, P.regolith, depth * 0.6);
          } else if (T < b.water.seaIceK) {
            colour = P.seaIce;
            ice = 1;
          } else {
            const open = mixC(P.oceanShallow, P.oceanDeep, smooth(0, 0.25, depth));
            const frozen = 1 - smooth(b.water.seaIceK, b.water.freezeK, T);
            colour = mixC(open, P.seaIce, frozen);
            ice = frozen;
            water = 1 - frozen;
            liquidCount += 1 - frozen;
          }
          oceanCount++;
        } else {
          // Land. Dry worlds: regolith when airless or cold, oxidised desert
          // when warm under air. Wet worlds: soil, greened where life is.
          const dry = !anyWater;
          let ground: LinearRGB;
          if (T > 1000) ground = P.scorched;
          else if (dry) {
            ground = thinAir || T < 230 ? P.regolith : mixC(P.regolith, P.desert, smooth(230, 300, T));
            // Airless plains: low basins flooded by dark basalt, bright
            // anorthositic highlands (the Moon's maria 0.07 vs highlands
            // 0.15; Lucey et al. 2006, Rev. Mineral. Geochem. 60:83).
            if (thinAir) {
              const rel = (h - loH) / Math.max(hiH - loH, 1e-3);
              const k = 0.55 + 0.75 * smooth(0.25, 0.6, rel);
              ground = { r: ground.r * k, g: ground.g * k, b: ground.b * k };
            }
          }
          else {
            // Warm, wet lowlands are soil; hot ones dry toward desert.
            ground = mixC(P.soil, P.desert, smooth(305, 340, T));
            if (veg && T > 273 && T < 318) {
              const moisture = fbm(i * 0.02, j * 0.02, 3.3, b.seed + 55, 3);
              const cover = smooth(273, 285, T) * (1 - smooth(305, 318, T)) * smooth(0.35, 0.6, moisture + 0.25 * (1 - elevKm / 6));
              ground = mixC(ground, veg, cover);
            }
          }
          // High ground is paler rock.
          ground = mixC(ground, mixC(P.regolith, P.evaporite, 0.4), smooth(1.5, 5, elevKm) * 0.5);
          colour = ground;
          // Snow: where the air above a range is colder than the ice line,
          // and only if the world has water to make snow from.
          const Tlocal = T - (b.pressureBar > 0.05 ? LAPSE_K_PER_KM * elevKm : 0);
          if (b.water.fraction > 0 && Tlocal < b.water.seaIceK) {
            const snow = smooth(b.water.seaIceK, b.water.seaIceK - 12, Tlocal);
            colour = mixC(colour, P.snow, snow);
            ice = snow;
          }
          // Cities: only where canon says someone lives, on habitable land,
          // clustered and drawn to coasts.
          if (b.cityLights && T > 268 && T < 315 && ice < 0.5) {
            const coast = sea > 0 ? 1 - smooth(0, 0.05, h - sea) : 0.4;
            const [x, y, z] = dir(lat, lon);
            const region = fbm(x * 3 + 9, y * 3 + 4, z * 3 + 1.7, b.seed + 313, 3);
            const town = fbm(x * 38 + 2, y * 38 - 7, z * 38 + 5, b.seed + 719, 2);
            const density = smooth(0.5, 0.62, region + coast * 0.15) * smooth(0.52, 0.7, town);
            if (density > 0.02) {
              emit = { r: cityHue.r * density * 0.8, g: cityHue.g * density * 0.8, b: cityHue.b * density * 0.8 };
              litCount++;
            }
          }
        }
        if (T > DRAPER_POINT_K) {
          const glow = smooth(DRAPER_POINT_K, DRAPER_POINT_K + 900, T) * (0.4 + 0.6 * (1 - h));
          const bb = blackbodyHue(T);
          emit = { r: emit.r + bb.r * glow, g: emit.g + bb.g * glow, b: emit.b + bb.b * glow };
        }
      }
      if (ice > 0.5) iceCount++;

      albedo[o] = toSrgbByte(colour.r);
      albedo[o + 1] = toSrgbByte(colour.g);
      albedo[o + 2] = toSrgbByte(colour.b);
      albedo[o + 3] = 255;
      props[o] = Math.round(Math.min(1, Math.max(0, h)) * 255);
      props[o + 1] = Math.round(water * 255);
      props[o + 2] = Math.round(ice * 255);
      props[o + 3] = 255;
      emission[o] = toSrgbByte(emit.r);
      emission[o + 1] = toSrgbByte(emit.g);
      emission[o + 2] = toSrgbByte(emit.b);
      emission[o + 3] = 255;

      // Clouds.
      let cloud = 0;
      if (b.clouds.coverage >= 0.999) {
        // A global deck (Venus): near-opaque, with faint planetary-scale
        // streaks so the disc is not a flat plate.
        cloud = 0.9 + 0.1 * field.clouds[k];
      } else if (b.clouds.coverage > 0) {
        const c = cloudField[k];
        // Soft edges and thin cirrus: opacity ramps over a band rather than
        // switching on at the threshold.
        cloud = smooth(cloudCut - 0.03, cloudCut + 0.1, c) * (0.55 + 0.45 * smooth(cloudCut, cloudCut + 0.18, c));
      }
      clouds[o] = Math.round(cloud * 255);
      clouds[o + 3] = 255;
    }
  }

  return {
    width,
    height,
    albedo,
    props,
    emission,
    clouds,
    seaLevel: sea,
    stats: { ocean: oceanCount / n, ice: iceCount / n, liquid: liquidCount / n, lit: litCount / n },
  };
}

/** Cloud reflectance for a binding's cloud kind. */
export function cloudReflectance(b: PlanetSceneBinding): LinearRGB {
  return CLOUD_REFLECTANCE[b.clouds.colourKey];
}
