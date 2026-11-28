// ---------------------------------------------------------------------------
// useSurfaceMaps — painted maps for a world, without stalling a frame.
//
// 1. Immediately: a 256-wide paint on the main thread (~25 ms cold), so the
//    world appears at once and every control responds while dragging.
// 2. Then: the tier's full resolution, painted in a worker
//    (terrain.worker.ts) and swapped in when it lands. Stale replies (the
//    writer moved a slider again) are dropped by request id.
//
// Where Worker does not exist (tests, very old browsers) the full paint runs
// on the main thread instead.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlanetSceneBinding, PlanetSceneFacts } from "../bind/planet-scene";
import { paintSurface, type SurfaceMaps } from "../materials/terrain";

export const PREVIEW_RESOLUTION = 256;

export function useSurfaceMaps(facts: PlanetSceneFacts, binding: PlanetSceneBinding, width: number): SurfaceMaps {
  const quick = useMemo(() => paintSurface(binding, Math.min(PREVIEW_RESOLUTION, width)), [binding, width]);
  const [full, setFull] = useState<{ key: string; maps: SurfaceMaps } | null>(null);
  const worker = useRef<Worker | null>(null);
  const seq = useRef(0);
  const key = useMemo(() => `${width}:${JSON.stringify(facts)}`, [facts, width]);

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const w = new Worker(new URL("../materials/terrain.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    if (width <= PREVIEW_RESOLUTION) return;
    const id = ++seq.current;
    const w = worker.current;
    if (!w) {
      setFull({ key, maps: paintSurface(binding, width) });
      return;
    }
    const onMessage = (e: MessageEvent<{ id: number; maps: SurfaceMaps }>) => {
      if (e.data.id === seq.current) setFull({ key, maps: e.data.maps });
    };
    w.addEventListener("message", onMessage);
    w.postMessage({ id, facts, width });
    return () => w.removeEventListener("message", onMessage);
  }, [key, facts, binding, width]);

  return full && full.key === key ? full.maps : quick;
}
