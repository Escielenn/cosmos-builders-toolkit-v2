/**
 * Procedural planet textures, one per type.
 *
 * Planets rendered as flat tinted spheres read as billiard balls: a gas giant
 * and a desert world differ only in hue. These give each type a surface, using
 * banding, mottling, craters, cracks and ice caps as appropriate.
 *
 * Generated on a canvas rather than loaded, for three reasons: the artifact CSP
 * blocks remote assets, image files would dwarf the rest of the bundle, and a
 * procedural surface can take the planet's own colour so a renamed or recoloured
 * body stays consistent.
 *
 * Textures are cached by type and colour, so the cost is once per distinct
 * appearance rather than once per planet or per frame.
 */

import * as THREE from "three";
import type { PlanetType } from "../types";

// Equirectangular, so 2:1. 512x256 is enough detail at the sizes planets render
// here and cheap enough to build synchronously.
const W = 512;
const H = 256;

/** Surface families. Several types share a treatment with different parameters. */
type Family = "banded" | "softBanded" | "rocky" | "ocean" | "lava" | "terran";

const FAMILY: Record<PlanetType, Family> = {
  "gas-giant": "banded",
  "hot-jupiter": "banded",
  "ice-giant": "softBanded",
  "sub-neptune": "softBanded",
  rocky: "rocky",
  "desert-world": "rocky",
  "lava-world": "lava",
  "ocean-world": "ocean",
  "super-earth": "terran",
};

// ---------------------------------------------------------------------------
// Deterministic noise
// ---------------------------------------------------------------------------

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Value noise on a lattice that wraps in x.
 *
 * Wrapping matters: an equirectangular texture meets itself at u=0/1, and
 * non-periodic noise leaves a visible seam running pole to pole.
 */
function makeNoise(seed: number, cols: number, rows: number) {
  const rng = mulberry32(seed);
  const grid = new Float32Array(cols * rows);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();

  return (x: number, y: number): number => {
    const fx = x * cols;
    const fy = y * rows;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    // Smoothstep for a less blocky interpolation.
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);

    const wrapX = (i: number) => ((i % cols) + cols) % cols;
    const clampY = (j: number) => Math.max(0, Math.min(rows - 1, j));

    const at = (i: number, j: number) => grid[clampY(j) * cols + wrapX(i)];

    const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
    const bot = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
    return top * (1 - sy) + bot * sy;
  };
}

/** Layered noise, for detail at more than one scale. */
function fbm(seed: number, baseCols: number, baseRows: number, octaves = 4) {
  const layers = Array.from({ length: octaves }, (_, i) =>
    makeNoise(seed + i * 7919, baseCols * 2 ** i, Math.max(2, baseRows * 2 ** i)),
  );
  return (x: number, y: number): number => {
    let sum = 0;
    let amp = 1;
    let norm = 0;
    for (const layer of layers) {
      sum += layer(x, y) * amp;
      norm += amp;
      amp *= 0.5;
    }
    return sum / norm;
  };
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return Number.isFinite(n)
    ? [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    : [139, 115, 85];
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function shade(c: [number, number, number], amount: number): [number, number, number] {
  return amount >= 0
    ? mix(c, [255, 255, 255], amount)
    : mix(c, [0, 0, 0], -amount);
}

// ---------------------------------------------------------------------------
// Painters
// ---------------------------------------------------------------------------

interface PaintCtx {
  data: Uint8ClampedArray;
  base: [number, number, number];
  seed: number;
}

/** Latitude bands with turbulence, plus one storm oval. Jupiter-like. */
function paintBanded({ data, base, seed }: PaintCtx, soft: boolean) {
  const warp = fbm(seed, 4, 2, 4);
  const detail = fbm(seed + 101, 8, 4, 3);
  const rng = mulberry32(seed + 555);

  const bandCount = soft ? 5 + Math.floor(rng() * 3) : 9 + Math.floor(rng() * 6);
  const contrast = soft ? 0.16 : 0.32;

  // One long-lived storm, the feature that makes a gas giant recognisable.
  const stormY = 0.35 + rng() * 0.3;
  const stormX = rng();
  const stormW = soft ? 0 : 0.06 + rng() * 0.05;
  const stormH = stormW * 0.55;

  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);

      // Warping the latitude before banding is what turns flat stripes into
      // the sheared, curdled look of a real atmosphere.
      const warped = v + (warp(u, v) - 0.5) * (soft ? 0.05 : 0.09);
      const band = Math.sin(warped * Math.PI * bandCount);
      let t = band * contrast * 0.5 + (detail(u, v) - 0.5) * (soft ? 0.05 : 0.1);

      // Poles read darker and desaturated on the giants.
      const polar = Math.abs(v - 0.5) * 2;
      t -= polar * polar * 0.12;

      let c = shade(base, t);

      if (stormW > 0) {
        // Wrap the horizontal distance so a storm near the seam is not clipped.
        let dx = Math.abs(u - stormX);
        dx = Math.min(dx, 1 - dx) / stormW;
        const dy = (v - stormY) / stormH;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          const edge = 1 - Math.sqrt(d);
          c = mix(c, shade(base, -0.45), edge * 0.85);
        }
      }

      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
}

/** Mottled crust with craters, and dust-toned highs. */
function paintRocky({ data, base, seed }: PaintCtx) {
  const surface = fbm(seed, 6, 3, 5);
  const rng = mulberry32(seed + 77);

  // Craters as a list of circles, drawn analytically so rims stay crisp.
  const craters = Array.from({ length: 26 }, () => ({
    x: rng(),
    y: rng() * 0.9 + 0.05,
    r: 0.012 + rng() * 0.05,
  }));

  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const n = surface(u, v);
      let c = shade(base, (n - 0.5) * 0.5);

      for (const cr of craters) {
        let dx = Math.abs(u - cr.x);
        dx = Math.min(dx, 1 - dx);
        // Latitude squeeze: near the poles a circle in texture space would
        // smear into a band on the sphere.
        const squeeze = Math.max(0.25, Math.sin(v * Math.PI));
        const d = Math.sqrt((dx / squeeze) ** 2 + (v - cr.y) ** 2) / cr.r;
        if (d < 1.15) {
          // Dark floor, bright rim.
          c = d > 0.85 ? mix(c, shade(base, 0.3), 0.5) : mix(c, shade(base, -0.35), 1 - d * 0.6);
        }
      }

      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
}

/** Deep water with lighter shelves, swirled currents and ice caps. */
function paintOcean({ data, base, seed }: PaintCtx) {
  const depth = fbm(seed, 4, 2, 5);
  const swirl = fbm(seed + 31, 10, 5, 3);

  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const d = depth(u, v);
      // Shallows are lighter and slightly greener.
      let c = mix(shade(base, -0.3), shade(base, 0.35), d);
      c = shade(c, (swirl(u, v) - 0.5) * 0.12);

      // Ice caps, wider than a terran world's because these are water worlds.
      const polar = Math.abs(v - 0.5) * 2;
      if (polar > 0.82) {
        c = mix(c, [235, 245, 255], (polar - 0.82) / 0.18 * 0.9);
      }

      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
}

/** Dark crust fractured by glowing magma. */
function paintLava({ data, base, seed }: PaintCtx) {
  const crust = fbm(seed, 5, 3, 5);
  const veins = fbm(seed + 17, 7, 4, 4);
  const crustColor = shade(base, -0.62);
  const hot: [number, number, number] = [255, 180, 60];

  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      let c = shade(crustColor, (crust(u, v) - 0.5) * 0.3);

      // Ridged noise: the creases of |n - 0.5| make convincing cracks.
      const ridge = 1 - Math.abs(veins(u, v) - 0.5) * 2;
      if (ridge > 0.82) {
        const heat = (ridge - 0.82) / 0.18;
        c = mix(c, hot, Math.min(1, heat * 1.1));
      } else if (ridge > 0.7) {
        c = mix(c, base, (ridge - 0.7) / 0.12 * 0.5);
      }

      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
}

/** Continents, ocean, and modest ice caps. */
function paintTerran({ data, base, seed }: PaintCtx) {
  const land = fbm(seed, 4, 2, 5);
  const detail = fbm(seed + 43, 12, 6, 3);
  const ocean: [number, number, number] = mix(hexToRgb("#1B4F86"), base, 0.15);

  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      // Bias the threshold toward water at the equator so continents cluster
      // rather than forming an even speckle.
      const h = land(u, v);
      let c: [number, number, number];
      if (h > 0.52) {
        const alt = (h - 0.52) / 0.48;
        c = mix(shade(base, -0.1), shade(base, 0.32), alt);
        c = shade(c, (detail(u, v) - 0.5) * 0.14);
      } else {
        c = shade(ocean, (h - 0.26) * 0.35);
      }

      const polar = Math.abs(v - 0.5) * 2;
      if (polar > 0.88) {
        c = mix(c, [240, 248, 255], (polar - 0.88) / 0.12 * 0.85);
      }

      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

const cache = new Map<string, THREE.CanvasTexture | null>();

/**
 * A texture for this planet type and colour, or null where no canvas is
 * available (server render, or a jsdom test without a 2D context). Callers must
 * treat null as "fall back to a flat tint" rather than an error.
 */
export function getPlanetTexture(type: PlanetType, colorHex: string): THREE.CanvasTexture | null {
  const key = `${type}|${colorHex}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const texture = buildTexture(type, colorHex);
  cache.set(key, texture);
  return texture;
}

function buildTexture(type: PlanetType, colorHex: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = ctx.createImageData(W, H);
  const paintCtx: PaintCtx = {
    data: image.data,
    base: hexToRgb(colorHex),
    // Seeded from type and colour, so the same planet looks the same every
    // mount and two planets of a type are not identical twins.
    seed: hashSeed(`${type}|${colorHex}`),
  };

  switch (FAMILY[type] ?? "rocky") {
    case "banded":
      paintBanded(paintCtx, false);
      break;
    case "softBanded":
      paintBanded(paintCtx, true);
      break;
    case "ocean":
      paintOcean(paintCtx);
      break;
    case "lava":
      paintLava(paintCtx);
      break;
    case "terran":
      paintTerran(paintCtx);
      break;
    default:
      paintRocky(paintCtx);
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Wrap in longitude only; latitude is clamped so poles do not mirror.
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}

/** Which surface treatment a type receives. Exported for tests. */
export function planetFamily(type: PlanetType): Family {
  return FAMILY[type] ?? "rocky";
}
