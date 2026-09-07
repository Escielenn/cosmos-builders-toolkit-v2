// ---------------------------------------------------------------------------
// The renderer and post stack (Brief G1 §1, §2).
//
// One WebGLRenderer, ACES tone mapping, pixel ratio capped by tier. Mounts
// into a container and — the part that actually matters — UNMOUNTS and
// disposes when that container leaves the DOM. Every disposable goes through
// the registry, so teardown is complete by construction rather than by
// remembering.
//
// Post stack per §2: RenderPass → UnrealBloomPass (half res) → one grain and
// vignette ShaderPass. Bloom strength and grain both multiply --sf-ambient,
// which is the single dial 14 §4 requires every decorative layer to obey.
//
// This file is not unit-tested: it needs a GL context, and a mocked
// WebGLRenderer would only assert that the mock was called. What IS tested is
// everything it delegates to — disposal, tiers, token binding — which is where
// the bugs that survive review actually live.
// ---------------------------------------------------------------------------

import {
  ACESFilmicToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { DisposalRegistry } from "./disposal";
import { TIER_SETTINGS, resolvePixelRatio, type QualityTier } from "./tiers";
import type { ThemeUniforms } from "./theme-uniforms";

/**
 * Grain and vignette in one pass. Two passes would mean two full-screen
 * draws for two multiplies.
 *
 * Both terms scale by uAmbient so the ambient dial genuinely reaches them —
 * 14 §4: "New ambient layers multiply var(--sf-ambient) or they don't ship."
 */
const AmbientGrainShader = {
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
      float vignette = 1.0 - uVignette * uAmbient * smoothstep(0.35, 0.85, d);
      colour.rgb *= vignette;

      float grain = (hash(vUv * 1024.0 + uTime) - 0.5) * uGrain * uAmbient;
      colour.rgb += grain;

      gl_FragColor = colour;
    }
  `,
};

export interface EngineOptions {
  container: HTMLElement;
  tier: QualityTier;
  theme: ThemeUniforms;
  /** Provided so tests and callers can inject; defaults to window. */
  devicePixelRatio?: number;
}

export interface Engine {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  composer: EffectComposer | null;
  registry: DisposalRegistry;
  /** Draw one frame. `elapsed` is seconds since start, for the grain. */
  render: (elapsed: number) => void;
  /** Re-read tokens without rebuilding the context. */
  applyTheme: (theme: ThemeUniforms) => void;
  resize: () => void;
  dispose: () => void;
}

export function createEngine({
  container,
  tier,
  theme,
  devicePixelRatio,
}: EngineOptions): Engine {
  const registry = new DisposalRegistry();
  const settings = TIER_SETTINGS[tier];

  const renderer = new WebGLRenderer({
    antialias: tier !== "chart",
    alpha: true,
    powerPreference: tier === "cinematic" ? "high-performance" : "default",
  });
  renderer.setPixelRatio(
    resolvePixelRatio(tier, devicePixelRatio ?? window.devicePixelRatio),
  );
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = settings.shadows;
  registry.track(renderer);

  container.appendChild(renderer.domElement);
  registry.trackFn(() => {
    renderer.domElement.remove();
    // forceContextLoss releases the GPU-side context immediately rather than
    // waiting for GC. Without it a page that mounts several scenes in a
    // session will hit the browser's context limit and blank an older canvas.
    renderer.forceContextLoss();
  });

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    50,
    Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
    0.1,
    1e7,
  );

  let composer: EffectComposer | null = null;
  let grainPass: ShaderPass | null = null;
  let bloomPass: UnrealBloomPass | null = null;

  if (settings.bloom || settings.grain) {
    composer = new EffectComposer(renderer);
    registry.track(composer);
    composer.addPass(new RenderPass(scene, camera));

    if (settings.bloom) {
      bloomPass = new UnrealBloomPass(
        new Vector2(
          container.clientWidth * settings.bloomResolutionScale,
          container.clientHeight * settings.bloomResolutionScale,
        ),
        0.5 * theme.ambient,
        0.4,
        0.75,
      );
      registry.track(bloomPass);
      composer.addPass(bloomPass);
    }

    if (settings.grain) {
      grainPass = new ShaderPass(AmbientGrainShader as never);
      registry.track(grainPass);
      composer.addPass(grainPass);
    }
  }

  const applyTheme = (next: ThemeUniforms) => {
    if (bloomPass) bloomPass.strength = 0.5 * next.ambient;
    if (grainPass) grainPass.uniforms.uAmbient.value = next.ambient;
  };

  const resize = () => {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer?.setSize(w, h);
    bloomPass?.resolution.set(
      w * settings.bloomResolutionScale,
      h * settings.bloomResolutionScale,
    );
  };

  // A container that resizes without the window doing so — a sidebar drag,
  // a panel collapse — still has to re-project.
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    registry.trackFn(() => observer.disconnect());
  }

  const render = (elapsed: number) => {
    if (grainPass) grainPass.uniforms.uTime.value = elapsed;
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };

  return {
    renderer,
    scene,
    camera,
    composer,
    registry,
    render,
    applyTheme,
    resize,
    dispose: () => {
      registry.disposeAll();
    },
  };
}
