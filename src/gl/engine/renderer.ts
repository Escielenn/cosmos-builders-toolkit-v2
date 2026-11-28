// ---------------------------------------------------------------------------
// The renderer and post stack (Brief G1 §1, §2).
//
// One WebGLRenderer, the tier's tone curve (AgX lit, none on chart), pixel
// ratio capped by tier. Mounts
// into a container and — the part that actually matters — UNMOUNTS and
// disposes when that container leaves the DOM. Every disposable goes through
// the registry, so teardown is complete by construction rather than by
// remembering.
//
// Post stack per §2, defined once in post.ts: RenderPass → UnrealBloomPass
// (half res) → OutputPass → one grain and vignette pass. Bloom strength and
// grain both follow --sf-ambient, the single dial 14 §4 requires every
// decorative layer to obey.
//
// This file is not unit-tested: it needs a GL context, and a mocked
// WebGLRenderer would only assert that the mock was called. What IS tested is
// everything it delegates to — disposal, tiers, token binding — which is where
// the bugs that survive review actually live.
// ---------------------------------------------------------------------------

import { PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from "three";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { DisposalRegistry } from "./disposal";
import { buildPostStack, toneMappingFor, type PostStack } from "./post";
import { TIER_SETTINGS, resolvePixelRatio, type QualityTier } from "./tiers";
import type { ThemeUniforms } from "./theme-uniforms";

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
  renderer.toneMapping = toneMappingFor(settings);
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

  // The stack is shared with the r3f <PostStack> (post.ts) so the two ways
  // of mounting the engine cannot drift.
  let post: PostStack | null = null;
  if (settings.bloom || settings.grain) {
    post = buildPostStack({
      renderer,
      scene,
      camera,
      settings,
      ambient: theme.ambient,
      width: Math.max(container.clientWidth, 1),
      height: Math.max(container.clientHeight, 1),
      registry,
    });
  }
  const composer: EffectComposer | null = post?.composer ?? null;

  const applyTheme = (next: ThemeUniforms) => {
    post?.setAmbient(next.ambient);
  };

  const resize = () => {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    post?.setSize(w, h);
  };

  // A container that resizes without the window doing so — a sidebar drag,
  // a panel collapse — still has to re-project.
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    registry.trackFn(() => observer.disconnect());
  }

  const render = (elapsed: number) => {
    if (post) post.render(elapsed);
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
