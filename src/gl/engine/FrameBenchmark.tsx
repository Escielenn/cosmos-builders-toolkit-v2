// ---------------------------------------------------------------------------
// FrameBenchmark — one line inside a Canvas that makes the tier system real.
//
// Drop <FrameBenchmark /> into any scene and that scene's own frames feed the
// measurement in benchmark.ts. It renders nothing, allocates nothing per
// frame, and stops costing anything the moment the benchmark settles.
//
// ON PRIORITY: this MUST use the default (0). In react-three-fiber, any
// positive `useFrame` priority takes over the render loop — the caller becomes
// responsible for calling gl.render() itself, and a scene that does not is
// simply never drawn. A first draft here passed 1000 to measure "after the
// scene's own work" and silently blanked every canvas it was mounted in.
//
// Nothing is lost by dropping it: `delta` is the time since the previous
// frame, so it measures the same interval whatever order the callbacks run in.
// ---------------------------------------------------------------------------

import { useFrame } from "@react-three/fiber";
import { recordFrame } from "./benchmark";

export function FrameBenchmark() {
  useFrame((_, delta) => {
    recordFrame(delta * 1000);
  });
  return null;
}

export default FrameBenchmark;
