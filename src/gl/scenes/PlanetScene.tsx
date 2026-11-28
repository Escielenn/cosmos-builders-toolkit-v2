// ---------------------------------------------------------------------------
// PlanetScene — one React surface for a planet, on forge-gl.
//
// Built to replace the Tidelock and ExoForge iframes (doc 14 §5: "Genesis
// (with ExoForge as its generate mode) → Planet"; "Tidelock → Planet,
// locked"). It renders from a PlanetSceneBinding (bind/planet-scene.ts) and
// nothing else, so the same world looks the same whether its numbers came
// from canon or from the preview controls.
//
// Lazy-loaded: three.js and this file never reach the main entry bundle.
//
// Law III (every surface is two-way): the planet and the star are buttons.
// Clicking either calls onSelect, and the page opens that body's canon
// entry. The page also offers the same two actions as real DOM buttons,
// because a canvas is not keyboard-reachable.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color, type PerspectiveCamera } from "three";

/** The slice of drei's OrbitControls this scene touches. */
interface ControlsLike {
  minDistance: number;
  maxDistance: number;
  update: () => void;
}
import { useQualityTier } from "../engine/use-quality-tier";
import { useThemeUniforms } from "../engine/use-theme-uniforms";
import { CameraRig } from "../engine/camera-rig";
import { PostStack } from "../engine/PostStack";
import FrameBenchmark from "../engine/FrameBenchmark";
import { toneMappingFor } from "../engine/post";
import type { PlanetSceneBinding, PlanetSceneFacts } from "../bind/planet-scene";
import { useSurfaceMaps } from "./use-surface-maps";
import { createPlanetRig } from "./planet-rig";
import { PLANET_DISPLAY_EXPOSURE } from "../materials/PlanetSceneMaterials";

export type PlanetSceneTarget = "planet" | "star";

export interface PlanetSceneProps {
  /** The inputs, for the worker that paints full-resolution maps. */
  facts: PlanetSceneFacts;
  /** bindPlanetScene(facts): the caller already has it for its readout. */
  binding: PlanetSceneBinding;
  onSelect?: (target: PlanetSceneTarget) => void;
  /** Called with the tier actually used, for the readout. */
  onTier?: (tier: string, reason: string) => void;
  className?: string;
}

const FOV = 35;

/** Rolling median frame time, written to the container for the perf readout and e2e. */
function FrameProbe({ target }: { target: React.RefObject<HTMLDivElement> }) {
  const samples = useRef<number[]>([]);
  useFrame((_, delta) => {
    const s = samples.current;
    s.push(delta * 1000);
    if (s.length >= 60) {
      const sorted = [...s].sort((a, b) => a - b);
      target.current?.setAttribute("data-frame-ms", sorted[30].toFixed(1));
      s.length = 0;
    }
  });
  return null;
}

function Rig({
  facts,
  binding,
  still,
  onSelect,
}: {
  facts: PlanetSceneFacts;
  binding: PlanetSceneBinding;
  still: boolean;
  onSelect?: (t: PlanetSceneTarget) => void;
}) {
  const tier = useQualityTier();
  const theme = useThemeUniforms();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const invalidate = useThree((s) => s.invalidate);
  const chart = tier.tier === "chart";
  const resolution = tier.settings.surfaceResolution;

  const maps = useSurfaceMaps(facts, binding, resolution);
  const rig = useMemo(
    () =>
      createPlanetRig({
        binding,
        maps,
        mode: chart ? "chart" : "lit",
        theme,
        starCount: tier.settings.starCount,
        pixelRatio: gl.getPixelRatio(),
      }),
    [binding, maps, chart, theme, tier.settings.starCount, gl],
  );
  useEffect(() => () => void rig.dispose(), [rig]);

  // The scene background is the void token (doc 14 §4), or the chart's paper.
  useEffect(() => {
    const c = theme.colours["--sf-void"];
    scene.background = new Color(c.r, c.g, c.b);
    gl.toneMapping = toneMappingFor(tier.settings);
  }, [scene, gl, theme, tier.settings]);


  // Camera: framed for this world, flown there with the design system's
  // ease (CameraRig: ease-sf-out, log-distance, no springs). Reduced motion
  // arrives immediately.
  const camRig = useRef<CameraRig | null>(null);
  const halfFov = useMemo(() => {
    const v = ((FOV / 2) * Math.PI) / 180;
    const h = Math.atan(Math.tan(v) * (size.width / Math.max(size.height, 1)));
    return Math.min(v, h);
  }, [size.width, size.height]);
  const framing = rig.framingDistance(halfFov);
  // A new world starts from its own view direction; a resize or tier change
  // keeps wherever the reader has turned the camera.
  const viewKey = `${binding.name}:${binding.tidallyLocked}`;
  const lastView = useRef<string | null>(null);
  useEffect(() => {
    if (lastView.current === viewKey) return;
    lastView.current = viewKey;
    camera.position.copy(rig.viewDirection).multiplyScalar(Math.max(camera.position.length(), framing));
    camera.lookAt(0, 0, 0);
    controls?.update();
  }, [viewKey, rig, camera, controls, framing]);

  useEffect(() => {
    const now = performance.now();
    const current = camera.position.length() || framing * 1.6;
    if (!camRig.current) camRig.current = new CameraRig({ target: { x: 0, y: 0, z: 0 }, distance: current });
    camRig.current.flyTo({ target: { x: 0, y: 0, z: 0 }, distance: framing }, now, 700, still);
    if (controls) {
      controls.minDistance = framing * 0.45;
      controls.maxDistance = framing * 3;
    }
    if (!camRig.current.isFlying) {
      // Reduced motion: arrive now, and ask a demand-mode canvas to draw.
      camera.position.setLength(framing);
      camera.lookAt(0, 0, 0);
      controls?.update();
      invalidate();
    }
  }, [framing, camera, controls, still, invalidate]);

  useFrame((state) => {
    const cr = camRig.current;
    if (cr && cr.isFlying) {
      const pose = cr.update(performance.now());
      const dir = camera.position.clone().normalize();
      if (dir.lengthSq() < 0.5) dir.set(0.18, 0.12, 1).normalize();
      camera.position.copy(dir.multiplyScalar(pose.distance));
      camera.lookAt(0, 0, 0);
      controls?.update();
    }
    rig.update(state.clock.elapsedTime, still);
  });

  const [hover, setHover] = useState<PlanetSceneTarget | null>(null);
  useEffect(() => {
    rig.setHover(hover);
    invalidate();
    document.body.style.cursor = hover ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [rig, hover, invalidate]);

  const targetOf = (e: ThreeEvent<PointerEvent | MouseEvent>): PlanetSceneTarget | null =>
    e.object.name === "planet" ? "planet" : e.object.name === "star" ? "star" : null;

  return (
    <primitive
      object={rig.root}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const t = targetOf(e);
        if (t !== hover) setHover(t);
      }}
      onPointerOut={() => setHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const t = targetOf(e);
        if (t) onSelect?.(t);
      }}
    />
  );
}

export function PlanetScene({ facts, binding, onSelect, onTier, className }: PlanetSceneProps) {
  const tier = useQualityTier();
  const theme = useThemeUniforms();
  const container = useRef<HTMLDivElement>(null);
  const chart = tier.tier === "chart";
  const still = tier.still;

  useEffect(() => onTier?.(tier.tier, tier.reason), [tier.tier, tier.reason, onTier]);

  return (
    <div ref={container} className={className} data-tier={tier.tier} data-testid="planet-scene">
      <Canvas
        // Re-create the context when the tier changes: antialiasing and the
        // drawing buffer are fixed at context creation.
        key={tier.tier}
        dpr={tier.dpr}
        camera={{ position: [1.2, 0.8, 7], fov: FOV, near: 0.05, far: 400 }}
        gl={{ antialias: !chart, alpha: false, powerPreference: tier.tier === "cinematic" ? "high-performance" : "default" }}
        frameloop={still ? "demand" : "always"}
      >
        <FrameBenchmark />
        <FrameProbe target={container} />
        <Rig facts={facts} binding={binding} still={still} onSelect={onSelect} />
        <PostStack settings={tier.settings} ambient={theme.ambient} exposure={PLANET_DISPLAY_EXPOSURE} />
        <OrbitControls
          makeDefault
          enablePan={false}
          // Damping is exponential smoothing of the reader's own drag, not a
          // spring with overshoot; off when motion is reduced.
          enableDamping={!still}
          dampingFactor={0.1}
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}

export default PlanetScene;
