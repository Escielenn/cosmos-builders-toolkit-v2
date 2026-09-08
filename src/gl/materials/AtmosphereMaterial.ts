// ---------------------------------------------------------------------------
// AtmosphereMaterial and SurfaceMaterial (Brief G2 §2, §3).
//
// The atmosphere is a fresnel shell on a slightly larger sphere; its thickness
// comes from atmo_pressure and its colour from atmo_composition. Change the
// pressure in canon and the rim thickens — that is the test G2 is graded on.
//
// The surface carries the terminator. On a tidally locked world it does not
// move, because that band is geography (14 §2 Tier 1).
// ---------------------------------------------------------------------------

import {
  AdditiveBlending,
  BackSide,
  Color,
  ShaderMaterial,
  Vector3,
} from "three";
import type { PlanetBinding } from "../bind";

/** Scale for the shell mesh: 1 + thickness. */
export function atmosphereShellScale(binding: PlanetBinding): number {
  return 1 + binding.atmosphere.thickness;
}

export function createAtmosphereMaterial(
  binding: PlanetBinding,
  sunDirection = new Vector3(1, 0, 0),
): ShaderMaterial {
  const a = binding.atmosphere;
  return new ShaderMaterial({
    transparent: true,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uColour: { value: new Color(a.colour.r, a.colour.g, a.colour.b) },
      uSun: { value: sunDirection.clone().normalize() },
      uSoftness: { value: a.terminatorSoftness },
      // Thicker air scatters more, so the shell is denser as well as taller.
      uDensity: { value: Math.min(1, a.thickness / 0.05) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform vec3 uSun;
      uniform float uSoftness;
      uniform float uDensity;
      varying vec3 vNormal;
      varying vec3 vWorldNormal;

      void main() {
        float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        float rim = pow(1.0 - facing, 3.0);

        // Only the lit limb glows. A shell that glows all the way round reads
        // as a decal, not as air.
        float lit = dot(normalize(vWorldNormal), normalize(uSun));
        // Softness widens the band over which day becomes night. On an airless
        // body this is near zero and the terminator is a knife edge.
        float day = smoothstep(-uSoftness, uSoftness, lit);

        float intensity = rim * day * uDensity;
        gl_FragColor = vec4(uColour * intensity, intensity);
      }
    `,
  });
}

export function createSurfaceMaterial(
  binding: PlanetBinding,
  sunDirection = new Vector3(1, 0, 0),
): ShaderMaterial {
  const s = binding.surface;
  return new ShaderMaterial({
    uniforms: {
      uColour: { value: new Color(s.colour.r, s.colour.g, s.colour.b) },
      uAlbedo: { value: s.albedo },
      uRoughness: { value: s.roughness },
      uNoiseScale: { value: s.noiseScale },
      uNoiseStrength: { value: s.noiseStrength },
      uSun: { value: sunDirection.clone().normalize() },
      uSoftness: { value: binding.atmosphere.terminatorSoftness },
      uTime: { value: 0 },
      // Exactly 0 on a locked world. Its terminator does not move.
      uSpin: { value: s.spin },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uAlbedo;
      uniform float uRoughness;
      uniform float uNoiseScale;
      uniform float uNoiseStrength;
      uniform vec3 uSun;
      uniform float uSoftness;
      uniform float uTime;
      uniform float uSpin;
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      varying vec3 vPosition;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
      }

      float fbm(vec3 p) {
        float total = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          total += noise(p) * amp;
          p *= 2.0;
          amp *= 0.5;
        }
        return total;
      }

      void main() {
        // uSpin is 0 for a locked body, so the terrain does not travel.
        float angle = uTime * uSpin * 0.05;
        float c = cos(angle);
        float sn = sin(angle);
        vec3 p = vec3(vPosition.x * c - vPosition.z * sn,
                      vPosition.y,
                      vPosition.x * sn + vPosition.z * c);

        float terrain = fbm(p * uNoiseScale);
        vec3 base = uColour * (1.0 - uNoiseStrength + terrain * uNoiseStrength * 2.0);

        float lit = dot(normalize(vWorldNormal), normalize(uSun));
        // Sharp on an airless body, soft under thick air.
        float day = smoothstep(-uSoftness - 0.02, uSoftness + 0.02, lit);

        // Albedo MODULATES, it does not gate.
        //
        // The profile colour already encodes what the surface looks like — a
        // rock grey is dark because rock is dark. Multiplying that by albedo
        // again double-counts it: a rock world at albedo 0.25 came out at 6%
        // brightness in full daylight, which is why every body in the first
        // system render was a black disc. Albedo now shifts brightness within
        // a visible band, so an ice world reads bright and a carbon world
        // reads dark without either becoming invisible.
        float reflect = mix(0.5, 1.3, clamp(uAlbedo, 0.0, 1.0));

        // A dim night side, not black: a locked world's dark face is where
        // half the story happens, and this is a chart — a planet you cannot
        // see is a planet you cannot click.
        vec3 colour = base * reflect * mix(0.18, 1.0, day);

        // A cheap specular on smooth surfaces — an ocean should glint.
        float gloss = (1.0 - uRoughness) * pow(max(day, 0.0), 24.0) * 0.35;
        colour += vec3(gloss);

        gl_FragColor = vec4(colour, 1.0);
      }
    `,
  });
}
