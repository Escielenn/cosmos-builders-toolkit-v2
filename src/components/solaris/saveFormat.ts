/**
 * Solaris save format — bidirectional compatibility with the original sim (A).
 *
 * IMPORTANT FINDING (M5): A's save payload is a *regeneration recipe*, not a
 * system snapshot. A stores only settings (starMode/arch/starChoices/
 * planetCount/conditions/separations/spdIdx) and its LOAD handler restores
 * those settings then calls generateSystem(), which uses Math.random(). So:
 *   - An A save cannot restore a specific system (it re-rolls a new one).
 *   - A's format has NO representation for user edits (added planets, slider
 *     changes, moons, rings). Those are silently lost by A.
 *
 * Strategy (additive superset — no schema change, no migration):
 *   - We ALWAYS write A's exact `parameters` keys, so the existing static sim
 *     can still load a save produced here (it regenerates from the settings,
 *     exactly as it does with its own saves).
 *   - We ADDITIONALLY write `parameters.sf2System`: the full native StarSystem
 *     (stars, planets, moons, rings, meta, architecture). A ignores unknown
 *     keys, so this is invisible to it. B prefers it for an exact restore
 *     including edits.
 *   - Loading an A-produced save (no sf2System) falls back to regenerating
 *     from A's settings — matching A's own semantics.
 */
import type { StarSystem, StarClass } from "./types";
import { generateSystem } from "./generator";

export interface SolarisSavePayload {
  outputType?: string;
  name?: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
}

/** A's star palette keys. */
type AStarKey = "blue" | "white" | "yellow" | "orange" | "red" | "random";

const CLASS_TO_A_KEY: Partial<Record<StarClass, AStarKey>> = {
  B: "blue",
  A: "white",
  G: "yellow",
  K: "orange",
  M: "red",
};
const A_KEY_TO_BUCKET: Record<string, "blue" | "white" | "yellow" | "orange" | "red"> = {
  blue: "blue",
  white: "white",
  yellow: "yellow",
  orange: "orange",
  red: "red",
};

/** A's playback speeds; we map our multiplier to the nearest index. */
const A_SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 10];
function toSpdIdx(mult: number): number {
  let best = 0;
  let bestD = Infinity;
  A_SPEEDS.forEach((s, i) => {
    const d = Math.abs(s - mult);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

const clampInt = (n: number, min = 1) => Math.max(min, Math.round(n));

/** Build a save payload that BOTH the original sim (A) and this rebuild can read. */
export function toSavePayload(system: StarSystem, speedMultiplier = 10): SolarisSavePayload {
  const stars = system.stars ?? [system.star];
  const arch = system.architecture ?? "single";

  // A's separation sliders: bsepAU = bsep/8, csepAU = csep/5, dsepAU = dsep/4.
  const sepAB = stars.length > 1 ? (stars[0].orbitRadiusAU ?? 0) + (stars[1].orbitRadiusAU ?? 0) : 0;
  const cSep = stars.length > 2 ? stars[2].orbitRadiusAU ?? 0 : 0;
  const dSep = stars.length > 3 ? stars[3].orbitRadiusAU ?? 0 : 0;

  const starChoices: Record<string, AStarKey> = { a: "random", b: "random", c: "random", d: "random" };
  (["a", "b", "c", "d"] as const).forEach((k, i) => {
    const s = stars[i];
    if (s) starChoices[k] = CLASS_TO_A_KEY[s.classification] ?? "random";
  });

  return {
    outputType: "star_system",
    name: system.name,
    parameters: {
      // ── A-compatible settings (the original sim reads exactly these) ──
      starMode: arch,
      arch: "", // A falls back to starMode when arch is empty
      starChoices,
      systemName: system.name,
      planetCount: system.planets.length,
      conditions: { hab: false, gas: false, tidal: false, rogue: false },
      asteroidBelt: (system.asteroidBelts?.length ?? 0) > 0,
      bsep: sepAB > 0 ? clampInt(sepAB * 8) : 4,
      csep: cSep > 0 ? clampInt(cSep * 5) : 10,
      dsep: dSep > 0 ? clampInt(dSep * 4) : 20,
      spdIdx: toSpdIdx(speedMultiplier),

      // ── Native superset: exact system incl. edits (A ignores unknown keys) ──
      sf2Version: 1,
      sf2System: system,
    },
    results: {
      systemName: system.name,
      starCount: stars.length,
      planetCount: system.planets.length,
      planetNames: system.planets.map((p) => p.name),
      hasSystem: true,
    },
  };
}

export interface RestoreResult {
  system: StarSystem;
  /** true = exact restore from sf2System; false = regenerated from A's settings. */
  exact: boolean;
}

/**
 * Restore a system from a save payload.
 * Prefers the native snapshot (exact, includes edits); otherwise regenerates
 * from A's settings — which is what A itself does with its own saves.
 */
export function fromSavePayload(payload: SolarisSavePayload | null | undefined): RestoreResult | null {
  const p = payload?.parameters as Record<string, unknown> | undefined;
  if (!p) return null;

  const snap = p.sf2System as StarSystem | undefined;
  if (snap && Array.isArray(snap.planets) && snap.star) {
    return { system: snap, exact: true };
  }

  // ── Fallback: A-produced save (settings only) → regenerate ──
  const starMode = typeof p.starMode === "string" ? p.starMode : "single";
  const architecture = (["single", "binary", "trinary", "quaternary"] as const).includes(
    starMode as "single"
  )
    ? (starMode as "single" | "binary" | "trinary" | "quaternary")
    : "single";

  const choices = (p.starChoices as Record<string, string> | undefined) ?? {};
  const bucket = A_KEY_TO_BUCKET[choices.a] ?? undefined;
  const planetCount = typeof p.planetCount === "number" ? p.planetCount : undefined;

  const system = generateSystem({
    architecture,
    planetCount,
    starBucket: bucket,
    includeBelt: typeof p.asteroidBelt === "boolean" ? p.asteroidBelt : undefined,
  });

  const systemName = typeof p.systemName === "string" && p.systemName ? p.systemName : system.name;
  return { system: { ...system, name: systemName }, exact: false };
}
