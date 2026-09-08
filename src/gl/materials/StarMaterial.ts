// ---------------------------------------------------------------------------
// StarMaterial (Brief G2 §1).
//
// A sphere with limb darkening, plus a back-face corona shell driven by
// fresnel × 3D noise. Colour is black-body from the bound temperature; the
// corona's amplitude is the star's flare activity, so a flare star LOOKS
// dangerous (14 §2 Tier 1).
//
// Limb darkening is not decoration. Without it the disc blows out to white
// under bloom and every spectral class looks identical — which destroys the
// one effect in the whole catalogue that carries meaning on its own.
// ---------------------------------------------------------------------------

import { AdditiveBlending, BackSide, Color, ShaderMaterial } from "three";
import type { StarBinding } from "../bind";

const NOISE_GLSL = /* glsl */ `
  // Simplex-ish value noise. Cheap, tileable enough for a corona that is
  // always in motion and never inspected closely.
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                       dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                   mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                       dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                       dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                   mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                       dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
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
`;

/** The photosphere. Limb-darkened so the core keeps its colour under bloom. */
export function createStarSurfaceMaterial(binding: StarBinding): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColour: { value: new Color(binding.colour.r, binding.colour.g, binding.colour.b) },
      uLimb: { value: binding.limbDarkening },
      uTime: { value: 0 },
      uActivity: { value: binding.coronaAmplitude.value },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uLimb;
      uniform float uTime;
      uniform float uActivity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      ${NOISE_GLSL}

      void main() {
        // How square-on this fragment faces the camera. 1 at the centre of the
        // disc, 0 at the limb.
        float facing = max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0);

        // Limb darkening: the edge is dimmer AND more saturated, which is what
        // keeps the class readable once bloom has had its way with the core.
        float darken = mix(1.0 - uLimb, 1.0, pow(facing, 0.55));

        // Granulation, so the disc is not a flat plate.
        float granule = fbm(vPosition * 6.0 + uTime * 0.05) * 0.12 * (0.4 + uActivity);

        vec3 colour = uColour * (darken + granule);
        gl_FragColor = vec4(colour, 1.0);
      }
    `,
  });
}

/**
 * The corona, drawn on a slightly larger sphere with BackSide + additive
 * blending so it reads as light around the star rather than a shell on it.
 */
export function createStarCoronaMaterial(binding: StarBinding): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uColour: { value: new Color(binding.colour.r, binding.colour.g, binding.colour.b) },
      uTime: { value: 0 },
      uActivity: { value: binding.coronaAmplitude.value },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uTime;
      uniform float uActivity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      ${NOISE_GLSL}

      void main() {
        // Inverted fresnel: brightest at the rim, falling off outward.
        float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        float rim = pow(1.0 - facing, 2.4);

        // The activity dial. A quiet star gets a smooth halo; an active one
        // gets a churning, asymmetric corona.
        float churn = fbm(vPosition * 3.0 + uTime * 0.15);
        float amplitude = mix(0.35, 1.0, uActivity);
        float intensity = rim * (0.55 + churn * amplitude);

        gl_FragColor = vec4(uColour * intensity, intensity);
      }
    `,
  });
}
