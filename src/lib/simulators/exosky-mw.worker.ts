// ExoSky Milky Way worker: ray-marches the band off the main thread.
// The model lives in exosky-galaxy.ts, shared with the main-thread fallback,
// so there is one copy of the arms (1.8 kept a second, drifting copy in
// public/exosky-mw-worker.js).
import { computeMilkyWayMap } from "@/lib/simulators/exosky-galaxy";

self.onmessage = (e: MessageEvent<{ id: number; gc: [number, number, number] }>) => {
  const { id, gc } = e.data;
  const map = computeMilkyWayMap(gc[0], gc[1], gc[2]);
  (self as unknown as Worker).postMessage({ id, brightness: map.brightness, dust: map.dust }, [
    map.brightness.buffer,
    map.dust.buffer,
  ]);
};
