// ---------------------------------------------------------------------------
// SheetSurfaceMaterial — the writer's own map, wrapped onto a sphere.
//
// F5 (owner, 2026-09-07): "Build our own standard equirect-on-sphere." The
// procedural SurfaceMaterial draws a planet nobody drew; this one draws the
// one the writer did. Same terminator rule as its sibling — sharp on an
// airless body, soft under thick air, fixed on a locked world — so the two
// read as one product.
//
// The texture is sampled as stored (no colour-space conversion), which is
// what makes the writer's colours come out as they painted them: the shader
// writes the value straight through, as every forge-gl material does.
//
// The star's black-body colour TINTS the light, gently. A red dwarf's world
// should look warm; it should not look like a darkroom.
// ---------------------------------------------------------------------------

import { Color, ShaderMaterial, Vector3, type Texture } from "three";
import type { RGB } from "../engine/theme-uniforms";

export interface SheetSurfaceOptions {
  map: Texture;
  /** World-space direction toward the star. */
  sun: Vector3;
  /** 0..1, from bind: terminator softness of the atmosphere. */
  softness: number;
  starColour: RGB;
}

/** The star colour, normalised so its brightest channel is 1, then softened toward white. */
export function lightTint(c: RGB, strength = 0.35): RGB {
  const m = Math.max(c.r, c.g, c.b, 1e-6);
  const mix = (v: number) => 1 - strength + strength * (v / m);
  return { r: mix(c.r), g: mix(c.g), b: mix(c.b) };
}

export function createSheetSurfaceMaterial(o: SheetSurfaceOptions): ShaderMaterial {
  const tint = lightTint(o.starColour);
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: o.map },
      uSun: { value: o.sun.clone().normalize() },
      uSoftness: { value: o.softness },
      uTint: { value: new Color(tint.r, tint.g, tint.b) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uSun;
      uniform float uSoftness;
      uniform vec3 uTint;
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        vec4 tex = texture2D(uMap, vUv);
        // Where a sheet does not reach (a Mercator sheet's poles) the globe
        // shows a plain cap rather than stretched pixels.
        vec3 base = mix(vec3(0.16, 0.17, 0.19), tex.rgb, tex.a);

        float lit = dot(normalize(vWorldNormal), normalize(uSun));
        float day = smoothstep(-uSoftness - 0.02, uSoftness + 0.02, lit);

        // A dim night side, never black: on a locked world the dark face is
        // where half the story happens, and a pin you cannot see is a pin
        // you cannot find.
        vec3 colour = base * mix(vec3(0.22), uTint, day);
        gl_FragColor = vec4(colour, 1.0);
      }
    `,
  });
}
