// ---------------------------------------------------------------------------
// PlanetScene materials (doc 14 §2 Tier 1 and Tier 3: planet, atmosphere,
// clouds, rings, city lights; §3 Chart tier).
//
// RULE: no colour lives in this file. Every colour is a uniform:
//   physical colours  computed in bind/planet-scene.ts from physics (star
//                     black body, Rayleigh scattering) or read from the
//                     reflectance data palette (src/lib/palettes);
//   UI colours        read from theme tokens off computed style
//                     (useThemeUniforms): selection rim, chart ink, paper.
// The GLSL only decides HOW light falls, never WHAT colour things are.
//
// Lit materials are colour-managed: they include three's tone-mapping and
// colour-space chunks, so drawn straight to the screen they are correct, and
// drawn into the composer's linear target the chunks are inert and
// OutputPass applies them once. Chart materials are NOT tone-mapped: a
// solved token must come out as the token.
// ---------------------------------------------------------------------------

import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  NormalBlending,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Texture,
} from "three";
import type { RGB } from "../engine/theme-uniforms";

const col = (c: RGB) => new Color(c.r, c.g, c.b);

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

const SPHERE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vObj;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldEast;
  varying vec3 vWorldNorth;
  void main() {
    vUv = uv;
    vObj = normalize(position);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    // The body's own east/north (east = Y × p, matching the texture's
    // longitude direction), carried to world space for relief shading.
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), vObj) + vec3(1e-5, 0.0, 0.0));
    vWorldEast = normalize(mat3(modelMatrix) * east);
    vWorldNorth = normalize(mat3(modelMatrix) * cross(vObj, east));
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/** Ring occlusion of sunlight at a world-space point. Shared by surface and clouds. */
const RING_SHADOW = /* glsl */ `
  uniform vec3 uRingNormal;
  uniform vec2 uRingSpan;      // inner, outer, in planet radii; 0,0 = none
  uniform float uRingOpacity;
  float ringShadow(vec3 p, vec3 L) {
    if (uRingSpan.y <= 0.0) return 1.0;
    float denom = dot(L, uRingNormal);
    if (abs(denom) < 1e-4) return 1.0;
    float t = -dot(p, uRingNormal) / denom;
    if (t <= 0.0) return 1.0;
    float r = length(p + t * L);
    float inside = smoothstep(uRingSpan.x - 0.02, uRingSpan.x + 0.02, r) * (1.0 - smoothstep(uRingSpan.y - 0.02, uRingSpan.y + 0.02, r));
    return 1.0 - inside * uRingOpacity * 0.8;
  }
`;

export interface RingShadowUniforms {
  normal: Vector3;
  inner: number;
  outer: number;
  opacity: number;
}

const ringUniforms = (r: RingShadowUniforms | null) => ({
  uRingNormal: { value: (r?.normal ?? new Vector3(0, 1, 0)).clone() },
  uRingSpan: { value: new Vector2(r?.inner ?? 0, r ? r.outer : 0) },
  uRingOpacity: { value: r?.opacity ?? 0 },
});

// ---------------------------------------------------------------------------
// Lit surface
// ---------------------------------------------------------------------------

export interface PlanetSurfaceOptions {
  albedo: Texture;
  props: Texture;
  emission: Texture;
  /** World-space direction to the star. */
  sun: Vector3;
  /** Star hue (max channel 1). */
  light: RGB;
  /** 0 airless (knife edge) .. 1 thick. */
  softness: number;
  scatter: RGB;
  sunset: RGB;
  sunsetStrength: number;
  /** 0..1, limb haze strength. */
  density: number;
  /** Selection rim colour (--sf-primary). */
  selection: RGB;
  texel: Vector2;
  /** Land relief strength in the shading normal. 0 for giants. */
  relief: number;
  rings: RingShadowUniforms | null;
}

/**
 * Scene-linear exposure. 1: a lit surface's radiance is its reflectance, so
 * nothing reflected exceeds the bloom threshold (snow 0.88); only emitters
 * bloom. Brightness for display is applied AFTER bloom, as the renderer's
 * toneMappingExposure (PLANET_DISPLAY_EXPOSURE), the way a camera's exposure
 * sits after its optics.
 */
export const PLANET_EXPOSURE = 1;
export const PLANET_DISPLAY_EXPOSURE = 1.5;
/** City lights and lava are stored 0..1; scaled into HDR so they bloom at night. */
export const EMISSION_GAIN = 1.4;

export function createPlanetSurfaceMaterial(o: PlanetSurfaceOptions): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: true,
    uniforms: {
      uAlbedo: { value: o.albedo },
      uProps: { value: o.props },
      uEmission: { value: o.emission },
      uSun: { value: o.sun.clone().normalize() },
      uLight: { value: col(o.light) },
      uSoft: { value: o.softness },
      uScatter: { value: col(o.scatter) },
      uSunset: { value: col(o.sunset) },
      uSunsetStrength: { value: o.sunsetStrength },
      uDensity: { value: o.density },
      uSelection: { value: col(o.selection) },
      uHover: { value: 0 },
      uTexel: { value: o.texel.clone() },
      uRelief: { value: o.relief },
      uExposure: { value: PLANET_EXPOSURE },
      uEmissionGain: { value: EMISSION_GAIN },
      ...ringUniforms(o.rings),
    },
    vertexShader: SPHERE_VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAlbedo;
      uniform sampler2D uProps;
      uniform sampler2D uEmission;
      uniform vec3 uSun;
      uniform vec3 uLight;
      uniform float uSoft;
      uniform vec3 uScatter;
      uniform vec3 uSunset;
      uniform float uSunsetStrength;
      uniform float uDensity;
      uniform vec3 uSelection;
      uniform float uHover;
      uniform vec2 uTexel;
      uniform float uRelief;
      uniform float uExposure;
      uniform float uEmissionGain;
      varying vec2 vUv;
      varying vec3 vObj;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldEast;
      varying vec3 vWorldNorth;
      ${RING_SHADOW}

      void main() {
        vec3 albedo = texture2D(uAlbedo, vUv).rgb;
        vec4 props = texture2D(uProps, vUv);
        float water = props.g;
        float ice = props.b;

        // Relief: the height field's gradient tilts the shading normal on land.
        float hE = texture2D(uProps, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uProps, vUv - vec2(uTexel.x, 0.0)).r;
        float hN = texture2D(uProps, vUv + vec2(0.0, uTexel.y)).r - texture2D(uProps, vUv - vec2(0.0, uTexel.y)).r;
        vec3 N = normalize(vWorldNormal);
        vec3 Nb = normalize(N - (normalize(vWorldEast) * hE + normalize(vWorldNorth) * hN) * uRelief * (1.0 - water));
        vec3 L = normalize(uSun);
        vec3 V = normalize(cameraPosition - vWorldPos);

        // Terminator: Lambert, wrapped by the atmosphere. Airless (uSoft 0)
        // is a true knife edge; thick air carries light past the geometric
        // terminator (twilight).
        float geo = dot(N, L);
        float w = uSoft * 0.6;
        float diffuse = clamp((dot(Nb, L) + w) / (1.0 + w), 0.0, 1.0);

        // Light that grazes the terminator has crossed the most air: tint it
        // with the transmitted (sunset) colour, scaled by how much survives.
        float band = exp(-pow(geo / (0.12 + 0.35 * uSoft), 2.0)) * uDensity;
        vec3 light = mix(uLight, uSunset * uSunsetStrength, clamp(band, 0.0, 1.0));

        float shadow = ringShadow(vWorldPos, L);
        vec3 colour = albedo * light * diffuse * shadow * uExposure;

        // Specular: open water glints, ice a little.
        vec3 H = normalize(L + V);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        float spec = pow(max(dot(N, H), 0.0), 160.0) * water * 6.0 + pow(max(dot(Nb, H), 0.0), 24.0) * ice * 0.25;
        colour += uLight * spec * fres * step(0.0, geo) * shadow;

        // Aerial perspective: the day-side limb is seen through more air.
        float facing = max(dot(N, V), 0.0);
        float haze = uDensity * pow(1.0 - facing, 2.0) * smoothstep(-0.1, 0.3, geo);
        colour = mix(colour, uScatter * uExposure * 0.5, clamp(haze, 0.0, 0.85));

        // Night side: what the surface itself emits (city lights, lava).
        float night = 1.0 - smoothstep(-0.16, 0.0, geo);
        colour += texture2D(uEmission, vUv).rgb * uEmissionGain * night;

        // Selection: a rim in the theme's primary. Glow is decoration; the
        // readout panel carries the state in words.
        colour += uSelection * pow(1.0 - facing, 3.0) * uHover * 0.9;

        gl_FragColor = vec4(colour, 1.0);
        ${OUTPUT}
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Clouds
// ---------------------------------------------------------------------------

export interface CloudOptions {
  map: Texture;
  sun: Vector3;
  light: RGB;
  /** Cloud reflectance (palette). */
  colour: RGB;
  softness: number;
  rings: RingShadowUniforms | null;
}

export function createCloudMaterial(o: CloudOptions): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: true,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: {
      uMap: { value: o.map },
      uSun: { value: o.sun.clone().normalize() },
      uLight: { value: col(o.light) },
      uColour: { value: col(o.colour) },
      uSoft: { value: o.softness },
      uExposure: { value: PLANET_EXPOSURE },
      ...ringUniforms(o.rings),
    },
    vertexShader: SPHERE_VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uSun;
      uniform vec3 uLight;
      uniform vec3 uColour;
      uniform float uSoft;
      uniform float uExposure;
      varying vec2 vUv;
      varying vec3 vObj;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      ${RING_SHADOW}
      void main() {
        float a = texture2D(uMap, vUv).r;
        if (a < 0.01) discard;
        vec3 L = normalize(uSun);
        float w = uSoft * 0.6;
        float diffuse = clamp((dot(normalize(vWorldNormal), L) + w) / (1.0 + w), 0.0, 1.0);
        vec3 colour = uColour * uLight * diffuse * ringShadow(vWorldPos, L) * uExposure;
        gl_FragColor = vec4(colour, a * 0.96);
        ${OUTPUT}
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Atmosphere shell (scattering-coloured)
// ---------------------------------------------------------------------------

export interface ScatterShellOptions {
  sun: Vector3;
  scatter: RGB;
  sunset: RGB;
  sunsetStrength: number;
  density: number;
  softness: number;
  light: RGB;
  /** Shell radius / planet radius. Sets where the planet's limb falls on the shell. */
  shellScale: number;
}

export function createScatterShellMaterial(o: ScatterShellOptions): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: true,
    transparent: true,
    depthWrite: false,
    side: BackSide,
    blending: AdditiveBlending,
    uniforms: {
      uSun: { value: o.sun.clone().normalize() },
      uScatter: { value: col(o.scatter) },
      uSunset: { value: col(o.sunset) },
      uSunsetStrength: { value: o.sunsetStrength },
      uDensity: { value: o.density },
      uSoft: { value: o.softness },
      uLight: { value: col(o.light) },
      uExposure: { value: PLANET_EXPOSURE },
      // |N·V| on the shell's back face where the line of sight grazes the
      // planet: sqrt(1 − 1/s²). The visible annulus runs from 0 (shell
      // edge) to this (planet limb).
      uInnerFacing: { value: Math.sqrt(Math.max(1e-4, 1 - 1 / (o.shellScale * o.shellScale))) },
    },
    vertexShader: SPHERE_VERT,
    fragmentShader: /* glsl */ `
      uniform float uInnerFacing;
      uniform vec3 uSun;
      uniform vec3 uScatter;
      uniform vec3 uSunset;
      uniform float uSunsetStrength;
      uniform float uDensity;
      uniform float uSoft;
      uniform vec3 uLight;
      uniform float uExposure;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        // Back faces of the shell: brightest where the line of sight grazes
        // the planet's limb, falling off outward.
        float facing = abs(dot(N, V));
        float rim = pow(clamp(facing / uInnerFacing, 0.0, 1.0), 1.6);
        float lit = dot(N, normalize(uSun));
        float day = smoothstep(-0.25 - uSoft * 0.3, 0.35, lit);
        float band = exp(-pow(lit / 0.28, 2.0));
        // uScatter already carries the star's (adapted) light: scattering.ts
        // weighted it by the illuminant.
        vec3 hue = mix(uScatter, uSunset * sqrt(uSunsetStrength), band * 0.7);
        float intensity = rim * day * uDensity * 1.2;
        gl_FragColor = vec4(hue * intensity * uExposure, intensity);
        ${OUTPUT}
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Rings
// ---------------------------------------------------------------------------

export interface RingOptions {
  inner: number;
  outer: number;
  colour: RGB;
  light: RGB;
  sun: Vector3;
  seed: number;
}

/** Procedural radial structure. Density is not a colour; the colour is uColour. */
const RING_DENSITY = /* glsl */ `
  float h1(float n) { return fract(sin(n * 12.9898 + uSeed) * 43758.5453); }
  float n1(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
  float density(float r) {
    float t = (r - uSpan.x) / (uSpan.y - uSpan.x);
    float d = 0.55 * n1(t * 18.0) + 0.3 * n1(t * 70.0) + 0.15 * n1(t * 260.0);
    // A Cassini-like gap at a seeded radius: resonances clear lanes.
    float gap = 0.62 + 0.1 * h1(3.0);
    d *= smoothstep(0.0, 0.015, abs(t - gap));
    d *= smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.92, t);
    return clamp(d * 1.25, 0.0, 1.0);
  }
`;

export function createRingMaterial(o: RingOptions): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: true,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uSpan: { value: new Vector2(o.inner, o.outer) },
      uColour: { value: col(o.colour) },
      uLight: { value: col(o.light) },
      uSun: { value: o.sun.clone().normalize() },
      uSeed: { value: o.seed % 97 },
      uExposure: { value: PLANET_EXPOSURE },
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vLocal = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uSpan;
      uniform vec3 uColour;
      uniform vec3 uLight;
      uniform vec3 uSun;
      uniform float uSeed;
      uniform float uExposure;
      varying vec3 vLocal;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      ${RING_DENSITY}
      void main() {
        float r = length(vLocal.xy);
        float d = density(r);
        if (d < 0.01) discard;
        vec3 L = normalize(uSun);
        // The planet's shadow: the ray toward the star passes within one
        // planet radius of the centre, on the far side.
        vec3 p = vWorldPos;
        float along = dot(p, L);
        float miss = length(p - along * L);
        float shadow = along < 0.0 ? smoothstep(0.97, 1.03, miss) : 1.0;
        // Lit from either face; a thin ring is translucent.
        float lambert = 0.35 + 0.65 * abs(dot(normalize(vWorldNormal), L));
        vec3 colour = uColour * uLight * lambert * shadow * uExposure;
        gl_FragColor = vec4(colour, d * 0.92);
        ${OUTPUT}
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Starfield
// ---------------------------------------------------------------------------

export function createStarfieldMaterial(ambient: number, pixelRatio: number): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
    uniforms: { uAmbient: { value: ambient }, uPixelRatio: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      varying vec3 vColour;
      uniform float uPixelRatio;
      void main() {
        vColour = color;
        gl_PointSize = aSize * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uAmbient;
      varying vec3 vColour;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        // An ambient layer: it multiplies --sf-ambient (CLAUDE.md).
        gl_FragColor = vec4(vColour * a * uAmbient, a * uAmbient);
        ${OUTPUT}
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Chart tier: ink on paper (doc 14 §3, §4)
//
// "On light themes and on low-end hardware, the Atlas becomes a star chart:
// lines and dots on paper, no bloom, no grain, orbit rings as ink. ... It
// should look like it was drafted."
//
// Drafting conventions borrowed from printed maps and plates: coastlines in
// line, WATERLINING (offset lines that follow a coast seaward, a 19th-century
// engraver's device), a graticule every 30°, the night side hatched, the
// terminator a dashed rule, ice ruled horizontally, the limb a firm line.
// Every colour is a theme token: paper = --sf-surface, ink = --sf-line-
// emphasis, fine = --sf-line-hairline, physics marks = --sf-amber (a
// meaning hue: Physics), selection = --sf-primary. On a light theme those
// tokens are a pale paper and dark ink, so this is the light-theme render.
// ---------------------------------------------------------------------------

export interface ChartInk {
  paper: RGB;
  ink: RGB;
  fine: RGB;
  physics: RGB;
  selection: RGB;
}

export interface ChartPlanetOptions {
  ink: ChartInk;
  props: Texture;
  seaLevel: number;
  sun: Vector3;
  locked: boolean;
  /** Gas giant band count, 0 for rocky. */
  bands: number;
}

const LINE = /* glsl */ `
  float lineAt(float v, float width) {
    float fw = max(fwidth(v), 1e-5);
    return 1.0 - smoothstep(0.0, fw * width, abs(v));
  }
`;

export function createChartPlanetMaterial(o: ChartPlanetOptions): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uPaper: { value: col(o.ink.paper) },
      uInk: { value: col(o.ink.ink) },
      uFine: { value: col(o.ink.fine) },
      uPhysics: { value: col(o.ink.physics) },
      uSelection: { value: col(o.ink.selection) },
      uHover: { value: 0 },
      uProps: { value: o.props },
      uSea: { value: o.seaLevel },
      uSun: { value: o.sun.clone().normalize() },
      uLocked: { value: o.locked ? 1 : 0 },
      uBands: { value: o.bands },
    },
    vertexShader: SPHERE_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uPaper;
      uniform vec3 uInk;
      uniform vec3 uFine;
      uniform vec3 uPhysics;
      uniform vec3 uSelection;
      uniform float uHover;
      uniform sampler2D uProps;
      uniform float uSea;
      uniform vec3 uSun;
      uniform float uLocked;
      uniform float uBands;
      varying vec2 vUv;
      varying vec3 vObj;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      ${LINE}
      void main() {
        vec4 props = texture2D(uProps, vUv);
        float h = props.r;
        float ice = props.b;
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float geo = dot(N, normalize(uSun));
        float lat = (vUv.y - 0.5) * 180.0;
        float lon = vUv.x * 360.0;
        vec2 px = gl_FragCoord.xy;

        vec3 c = uPaper;
        float fine = 0.0;
        float ink = 0.0;

        // Graticule, every 30 degrees.
        fine = max(fine, lineAt(mod(lat + 15.0, 30.0) - 15.0, 0.8));
        fine = max(fine, lineAt(mod(lon + 15.0, 30.0) - 15.0, 0.8) * step(abs(lat), 80.0));

        if (uBands > 0.0) {
          // Giants: belt boundaries as contour lines of the band function.
          float s = sin(radians(lat) * uBands + (h - 0.5) * 2.2);
          ink = max(ink, lineAt(s, 1.1));
        } else if (uSea > 0.0) {
          float d = h - uSea;
          ink = max(ink, lineAt(d, 1.3));
          // Waterlining: three offset lines seaward of every coast.
          for (int k = 1; k <= 3; k++) {
            float off = d + float(k) * 0.012;
            fine = max(fine, lineAt(off, 0.9) * step(d, 0.0) * (1.0 - float(k) * 0.22));
          }
        } else {
          // Dry worlds: relief contours stand in for coasts.
          fine = max(fine, lineAt(fract(h * 12.0) - 0.5, 0.8) * 0.8);
        }

        // Ice ruled horizontally.
        fine = max(fine, step(0.5, ice) * step(mod(px.y, 5.0), 1.0));

        // Night side hatched; deeper night cross-hatched.
        float hatchA = step(mod(px.x + px.y, 6.0), 1.0);
        float hatchB = step(mod(px.x - px.y, 6.0), 1.0);
        float night = step(geo, 0.0);
        fine = max(fine, night * hatchA);
        fine = max(fine, step(geo, -0.45) * hatchB);

        // The terminator, dashed along longitude.
        ink = max(ink, lineAt(geo, 1.6) * step(fract(lat / 5.0), 0.6));

        // Limb.
        float facing = dot(N, V);
        float limb = lineAt(facing, 2.0 + uHover * 2.0);

        c = mix(c, uFine, fine);
        c = mix(c, uInk, ink);

        // A locked world's eye: a ring around the substellar point, in the
        // Physics hue because it is a physics fact.
        if (uLocked > 0.5) {
          float ang = degrees(acos(clamp(dot(normalize(vObj), vec3(1.0, 0.0, 0.0)), -1.0, 1.0)));
          float eye = max(lineAt(ang - 6.0, 1.4), lineAt(ang - 1.2, 1.4));
          c = mix(c, uPhysics, eye);
        }

        c = mix(c, mix(uInk, uSelection, uHover), limb);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** A sphere drawn only as its silhouette: the chart's atmosphere line. */
export function createChartLimbMaterial(colour: RGB, width = 1.6): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    uniforms: { uColour: { value: col(colour) }, uWidth: { value: width } },
    vertexShader: SPHERE_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uWidth;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      ${LINE}
      void main() {
        float facing = dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos));
        float a = lineAt(facing, uWidth);
        if (a < 0.02) discard;
        gl_FragColor = vec4(uColour, a);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Chart rings: ink at the edges and at the density structure, the planet's shadow hatched. */
export function createChartRingMaterial(o: { inner: number; outer: number; ink: ChartInk; sun: Vector3; seed: number }): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uSpan: { value: new Vector2(o.inner, o.outer) },
      uInk: { value: col(o.ink.ink) },
      uFine: { value: col(o.ink.fine) },
      uPaper: { value: col(o.ink.paper) },
      uSun: { value: o.sun.clone().normalize() },
      uSeed: { value: o.seed % 97 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      varying vec3 vWorldPos;
      void main() {
        vLocal = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uSpan;
      uniform vec3 uInk;
      uniform vec3 uFine;
      uniform vec3 uPaper;
      uniform vec3 uSun;
      uniform float uSeed;
      varying vec3 vLocal;
      varying vec3 vWorldPos;
      ${RING_DENSITY}
      ${LINE}
      void main() {
        float r = length(vLocal.xy);
        float edge = max(lineAt(r - uSpan.x, 1.2), lineAt(r - uSpan.y, 1.2));
        float d = density(r);
        float contour = lineAt(fract(d * 4.0) - 0.5, 0.7) * step(0.05, d);
        vec3 L = normalize(uSun);
        float along = dot(vWorldPos, L);
        float shade = along < 0.0 ? 1.0 - smoothstep(0.97, 1.03, length(vWorldPos - along * L)) : 0.0;
        float hatch = shade * step(mod(gl_FragCoord.x + gl_FragCoord.y, 5.0), 1.0);
        float a = max(edge, max(contour * 0.8, hatch));
        if (a < 0.05) discard;
        vec3 c = mix(uFine, uInk, edge);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Chart star: a paper disc with a firm ink limb (the drafted "ringed disc"). */
export function createChartDiscMaterial(ink: ChartInk): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: false,
    uniforms: { uPaper: { value: col(ink.paper) }, uInk: { value: col(ink.ink) }, uSelection: { value: col(ink.selection) }, uHover: { value: 0 } },
    vertexShader: SPHERE_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uPaper;
      uniform vec3 uInk;
      uniform vec3 uSelection;
      uniform float uHover;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      ${LINE}
      void main() {
        float facing = dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos));
        float limb = lineAt(facing, 2.0);
        float inner = lineAt(facing - 0.5, 1.2);
        vec3 c = mix(uPaper, mix(uInk, uSelection, uHover), max(limb, inner));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

export function createChartStarfieldMaterial(ink: RGB, pixelRatio: number): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    uniforms: { uInk: { value: col(ink) }, uPixelRatio: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      uniform float uPixelRatio;
      void main() {
        gl_PointSize = max(1.5, aSize * 0.8) * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.32, 0.5, d);
        if (a < 0.05) discard;
        gl_FragColor = vec4(uInk, a);
        #include <colorspace_fragment>
      }
    `,
  });
}
