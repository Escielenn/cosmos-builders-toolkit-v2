// ---------------------------------------------------------------------------
// Terrain painting off the main thread.
//
// A cinematic-tier map (1024 × 512) costs about a second the first time a
// seed is seen (the height field and crater pass); on the main thread that
// is a dropped second of frames, which doc 14 §3 forbids. The worker
// receives the FACTS, not the binding (a binding carries a temperature
// function, which cannot cross a thread), binds them itself with the same
// pure code, paints, and transfers the arrays back without copying.
// ---------------------------------------------------------------------------

/// <reference lib="webworker" />
import { bindPlanetScene, type PlanetSceneFacts } from "../bind/planet-scene";
import { paintSurface } from "./terrain";

interface Request {
  id: number;
  facts: PlanetSceneFacts;
  width: number;
}

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, facts, width } = e.data;
  const maps = paintSurface(bindPlanetScene(facts), width);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, maps }, [
    maps.albedo.buffer,
    maps.props.buffer,
    maps.emission.buffer,
    maps.clouds.buffer,
  ]);
};
