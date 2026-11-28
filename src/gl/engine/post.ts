// ---------------------------------------------------------------------------
// The post stack, built once, used by both ways of mounting the engine
// (14-RENDER-ENGINE §2 Tier 2, §3).
//
// G1 wrote this stack inside createEngine(), and every scene since mounted
// through react-three-fiber instead, so no scene ever had bloom, grain or a
// tone curve: the stack existed and nothing drew through it. This module is
// the stack on its own, so createEngine() and the r3f <PostStack> share one
// definition and cannot drift.
//
//   RenderPass        scene → half-float target, LINEAR and HDR. Nothing
//                     is tone mapped here (three.js only tone maps when
//                     drawing to the screen), so a star at 1.6 stays 1.6.
//   UnrealBloomPass   half resolution (§3: "Full-res bloom is the classic
//                     mistake"). Threshold 1.0: in a linear HDR target only
//                     emitters exceed 1 (a photosphere, lava, city lights);
//                     a lit ice cap at albedo 0.8 does not bloom.
//   OutputPass        the tier's tone curve and the sRGB transfer, once.
//   AmbientGrain      vignette and grain, AFTER the tone curve so grain is
//                     a fixed fraction of what the reader sees. Both scale
//                     by --sf-ambient (CLAUDE.md: "New ambient layers
//                     multiply var(--sf-ambient)").
//
// §3 also says "--sf-ambient: 0 → bloom down to 0.2": bloom is how an
// emitter reads as bright, so it is turned down with the atmosphere, never
// off. Strength = 0.2 + 0.3 · ambient.
// ---------------------------------------------------------------------------

import {
  AgXToneMapping,
  NoToneMapping,
  Vector2,
  type ToneMapping,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { DisposalRegistry } from "./disposal";
import type { TierSettings } from "./tiers";

/** Linear HDR level above which a pixel blooms. See the header. */
export const BLOOM_THRESHOLD = 1.0;
export const BLOOM_RADIUS = 0.4;

/** §3: bloom never goes to zero, it goes to 0.2. */
export function bloomStrength(ambient: number): number {
  const a = Number.isFinite(ambient) ? Math.min(1, Math.max(0, ambient)) : 1;
  return 0.2 + 0.3 * a;
}

/** The three.js constant for a tier's output transform. */
export function toneMappingFor(settings: TierSettings): ToneMapping {
  return settings.toneMapping === "agx" ? AgXToneMapping : NoToneMapping;
}

/**
 * Grain and vignette in one pass. Two passes would mean two full-screen
 * draws for two multiplies.
 */
export const AmbientGrainShader = {
  uniforms: {
    tDiffuse: { value: null as unknown },
    uTime: { value: 0 },
    uAmbient: { value: 1 },
    uVignette: { value: 0.35 },
    uGrain: { value: 0.035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmbient;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    // Cheap hash noise. A texture lookup would be steadier but costs a
    // sampler and a fetch for something at 3% amplitude.
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 colour = texture2D(tDiffuse, vUv);
      float d = distance(vUv, vec2(0.5));
      colour.rgb *= 1.0 - uVignette * uAmbient * smoothstep(0.35, 0.85, d);
      colour.rgb += (hash(vUv * 1024.0 + uTime) - 0.5) * uGrain * uAmbient;
      gl_FragColor = colour;
    }
  `,
};

/** Just the renderer surface the composer touches. Lets a test pass a fake. */
export type PostRenderer = Pick<
  WebGLRenderer,
  "getPixelRatio" | "getSize" | "getRenderTarget" | "setRenderTarget" | "render"
> &
  Partial<WebGLRenderer>;

export interface PostStack {
  composer: EffectComposer;
  bloom: UnrealBloomPass | null;
  grain: ShaderPass | null;
  /** Draw a frame. `elapsed` (seconds) moves the grain. */
  render: (elapsed: number, deltaSeconds?: number) => void;
  setSize: (width: number, height: number) => void;
  setAmbient: (ambient: number) => void;
}

export interface PostStackOptions {
  renderer: PostRenderer;
  scene: Scene;
  camera: Camera;
  settings: TierSettings;
  ambient: number;
  width: number;
  height: number;
  /** Every pass and the composer go here, so teardown is complete by construction. */
  registry: DisposalRegistry;
}

export function buildPostStack({
  renderer,
  scene,
  camera,
  settings,
  ambient,
  width,
  height,
  registry,
}: PostStackOptions): PostStack {
  const composer = registry.track(new EffectComposer(renderer as WebGLRenderer));
  const renderPass = registry.track(new RenderPass(scene, camera));
  composer.addPass(renderPass);

  // UnrealBloomPass halves whatever size it is given before its first mip,
  // so "bloom at scale s of the drawing buffer" means handing it 2·s of the
  // buffer. (G1 passed s directly, which would have made it quarter res.)
  const bloomSize = (w: number, h: number): [number, number] => {
    const k = renderer.getPixelRatio() * settings.bloomResolutionScale * 2;
    return [Math.max(2, Math.round(w * k)), Math.max(2, Math.round(h * k))];
  };

  let bloom: UnrealBloomPass | null = null;
  if (settings.bloom) {
    const [bw, bh] = bloomSize(width, height);
    bloom = registry.track(
      new UnrealBloomPass(
        new Vector2(bw, bh),
        bloomStrength(ambient),
        BLOOM_RADIUS,
        BLOOM_THRESHOLD,
      ),
    );
    composer.addPass(bloom);
  }

  // OutputPass reads renderer.toneMapping and outputColorSpace; the caller
  // sets those from the tier (toneMappingFor).
  composer.addPass(registry.track(new OutputPass()));

  let grain: ShaderPass | null = null;
  if (settings.grain) {
    grain = registry.track(new ShaderPass(AmbientGrainShader as never));
    grain.uniforms.uAmbient.value = ambient;
    composer.addPass(grain);
  }

  composer.setSize(width, height);
  const fitBloom = (w: number, h: number) => {
    if (!bloom) return;
    const [bw, bh] = bloomSize(w, h);
    bloom.setSize(bw, bh);
  };
  fitBloom(width, height);

  return {
    composer,
    bloom,
    grain,
    render: (elapsed, deltaSeconds) => {
      if (grain) grain.uniforms.uTime.value = elapsed;
      composer.render(deltaSeconds);
    },
    setSize: (w, h) => {
      composer.setSize(w, h);
      // EffectComposer.setSize hands every pass the full buffer; put the
      // bloom back to its budgeted resolution.
      fitBloom(w, h);
    },
    setAmbient: (a) => {
      if (bloom) bloom.strength = bloomStrength(a);
      if (grain) grain.uniforms.uAmbient.value = a;
    },
  };
}
