// ---------------------------------------------------------------------------
// <PostStack> — the post stack inside a react-three-fiber Canvas.
//
// Mount it in a scene and that scene draws through post.ts: half-res bloom,
// the tier's tone curve, grain and vignette on --sf-ambient. On the chart
// tier it renders nothing and the Canvas draws itself, flat.
//
// ON PRIORITY (see FrameBenchmark.tsx for the opposite case): this one
// deliberately uses a POSITIVE useFrame priority, because taking over the
// render loop is the point. r3f stops calling gl.render() and this calls
// composer.render() instead. Exactly one component per Canvas may do this.
// ---------------------------------------------------------------------------

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DisposalRegistry } from "./disposal";
import { buildPostStack, toneMappingFor } from "./post";
import type { TierSettings } from "./tiers";

interface PostStackProps {
  settings: TierSettings;
  /** --sf-ambient, 0..1. */
  ambient: number;
  /** Display exposure, applied after bloom by the tone curve. Default 1. */
  exposure?: number;
}

export function PostStack({ settings, ambient, exposure = 1 }: PostStackProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const enabled = settings.bloom || settings.grain;

  // The tone curve is the tier's whether or not there is a composer: with
  // one, OutputPass applies it; without, the renderer does on the way out.
  useEffect(() => {
    gl.toneMapping = toneMappingFor(settings);
    // The chart tier draws solved tokens: no exposure may move them.
    gl.toneMappingExposure = settings.toneMapping === "none" ? 1 : exposure;
  }, [gl, settings, exposure]);

  const stack = useMemo(() => {
    if (!enabled) return null;
    const registry = new DisposalRegistry();
    const post = buildPostStack({
      renderer: gl,
      scene,
      camera,
      settings,
      ambient,
      width: Math.max(size.width, 1),
      height: Math.max(size.height, 1),
      registry,
    });
    return { post, registry };
    // Ambient and size are applied below without rebuilding render targets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, gl, scene, camera, settings]);

  useEffect(() => () => void stack?.registry.disposeAll(), [stack]);
  useEffect(() => stack?.post.setSize(Math.max(size.width, 1), Math.max(size.height, 1)), [stack, size]);
  useEffect(() => stack?.post.setAmbient(ambient), [stack, ambient]);

  useFrame((state, delta) => {
    if (!stack) return;
    stack.post.render(state.clock.elapsedTime, delta);
  }, enabled ? 1 : 0);

  return null;
}

export default PostStack;
