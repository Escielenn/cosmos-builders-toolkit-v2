// ---------------------------------------------------------------------------
// forge-gl engine core (Brief G1).
//
// Brief G1: "Write the dispose test first" and "Stop and show me the dispose
// test and the tier benchmark before materials."
//
// A WebGL leak does not fail loudly — it degrades until the browser drops the
// oldest context and some other canvas goes black. So the registry is designed
// to make "did we clean up?" answerable without a GPU, and these are the
// assertions that answer it.
// ---------------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import { DisposalRegistry } from "../disposal";
import {
  CINEMATIC_MAX_FRAME_MS,
  STANDARD_MAX_FRAME_MS,
  TIER_SETTINGS,
  decideTier,
  medianFrameTime,
  resolvePixelRatio,
} from "../tiers";
import {
  BOUND_TOKENS,
  parseAmbient,
  parseTokenColour,
  readThemeUniforms,
  srgbToLinear,
} from "../theme-uniforms";
import {
  CameraRig,
  DEFAULT_FLIGHT_MS,
  easeSfOut,
  poseAt,
} from "../camera-rig";

// ---------------------------------------------------------------------------
// Disposal
// ---------------------------------------------------------------------------

describe("DisposalRegistry", () => {
  const spy = () => ({ dispose: vi.fn() });

  it("disposes everything it tracked, and reports nothing live", () => {
    const r = new DisposalRegistry();
    const items = [spy(), spy(), spy()];
    items.forEach((i) => r.track(i));

    const stats = r.disposeAll();

    for (const i of items) expect(i.dispose).toHaveBeenCalledTimes(1);
    expect(stats).toEqual({ live: 0, disposed: 3, failed: 0 });
  });

  it("returns the tracked value, so tracking reads inline", () => {
    const r = new DisposalRegistry();
    const geo = spy();
    expect(r.track(geo)).toBe(geo);
  });

  it("is idempotent — a StrictMode double-unmount must not double-dispose", () => {
    const r = new DisposalRegistry();
    const item = spy();
    r.track(item);

    r.disposeAll();
    r.disposeAll();

    expect(item.dispose).toHaveBeenCalledTimes(1);
  });

  it("keeps disposing after one item throws, and reports the failure", () => {
    const r = new DisposalRegistry();
    const bad = { dispose: vi.fn(() => { throw new Error("gl lost"); }) };
    const good = spy();
    r.track(bad);
    r.track(good);

    const stats = r.disposeAll();

    // One bad dispose must not strand the rest of the context.
    expect(good.dispose).toHaveBeenCalledTimes(1);
    expect(stats).toEqual({ live: 0, disposed: 1, failed: 1 });
  });

  it("survives a dispose() that releases a sibling mid-teardown", () => {
    const r = new DisposalRegistry();
    const sibling = spy();
    r.track({ dispose: () => r.release(sibling) });
    r.track(sibling);

    const stats = r.disposeAll();

    expect(sibling.dispose).toHaveBeenCalledTimes(1);
    expect(stats.live).toBe(0);
  });

  it("releases one item early without touching the rest", () => {
    const r = new DisposalRegistry();
    const gone = spy();
    const kept = spy();
    r.track(gone);
    r.track(kept);

    r.release(gone);

    expect(gone.dispose).toHaveBeenCalledTimes(1);
    expect(kept.dispose).not.toHaveBeenCalled();
    expect(r.stats().live).toBe(1);
  });

  it("disposes immediately when something registers AFTER teardown", () => {
    // An async loader resolving after unmount would otherwise leak a texture
    // that nothing holds a reference to.
    const r = new DisposalRegistry();
    r.disposeAll();

    const late = spy();
    r.track(late);

    expect(late.dispose).toHaveBeenCalledTimes(1);
    expect(r.stats().live).toBe(0);
  });

  it("tracks plain teardown functions too", () => {
    const r = new DisposalRegistry();
    const off = vi.fn();
    r.trackFn(off);
    r.disposeAll();
    expect(off).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

describe("quality tiers", () => {
  const base = {
    medianFrameMs: 8,
    prefersReducedMotion: false,
    isLightScheme: false,
  };

  it("picks cinematic on a fast machine and chart on a slow one", () => {
    expect(decideTier({ ...base, medianFrameMs: 8 }).tier).toBe("cinematic");
    expect(decideTier({ ...base, medianFrameMs: 20 }).tier).toBe("standard");
    expect(decideTier({ ...base, medianFrameMs: 40 }).tier).toBe("chart");
  });

  it("treats the thresholds as inclusive so a boundary machine is not demoted", () => {
    expect(decideTier({ ...base, medianFrameMs: CINEMATIC_MAX_FRAME_MS }).tier).toBe("cinematic");
    expect(decideTier({ ...base, medianFrameMs: STANDARD_MAX_FRAME_MS }).tier).toBe("standard");
  });

  it("FORCES chart under reduced motion, and an override cannot undo it", () => {
    const d = decideTier({ ...base, prefersReducedMotion: true, override: "cinematic" });
    expect(d.tier).toBe("chart");
    expect(d.forced).toBe(true);
  });

  it("FORCES chart on a light theme — bloom over a light base destroys contrast", () => {
    const d = decideTier({ ...base, isLightScheme: true, override: "cinematic" });
    expect(d.tier).toBe("chart");
    expect(d.forced).toBe(true);
  });

  it("honours an explicit override when nothing forces the tier", () => {
    const d = decideTier({ ...base, medianFrameMs: 40, override: "cinematic" });
    expect(d.tier).toBe("cinematic");
    expect(d.forced).toBe(false);
  });

  it("falls back to standard before the benchmark has run", () => {
    expect(decideTier({ ...base, medianFrameMs: null }).tier).toBe("standard");
  });

  it("always explains itself — the reason is shown in Display settings", () => {
    for (const inputs of [
      base,
      { ...base, medianFrameMs: null },
      { ...base, prefersReducedMotion: true },
      { ...base, isLightScheme: true },
      { ...base, override: "chart" as const },
    ]) {
      expect(decideTier(inputs).reason.length).toBeGreaterThan(0);
    }
  });

  it("gives chart a real configuration, not an empty one", () => {
    // §8: the chart tier is good, not apologetic.
    expect(TIER_SETTINGS.chart.starCount).toBeGreaterThan(0);
    expect(TIER_SETTINGS.chart.bloom).toBe(false);
  });

  it("orders the tiers by cost, so a demotion always costs less", () => {
    const { cinematic, standard, chart } = TIER_SETTINGS;
    expect(cinematic.maxPixelRatio).toBeGreaterThanOrEqual(standard.maxPixelRatio);
    expect(standard.maxPixelRatio).toBeGreaterThanOrEqual(chart.maxPixelRatio);
    expect(cinematic.starCount).toBeGreaterThan(standard.starCount);
    expect(standard.starCount).toBeGreaterThan(chart.starCount);
  });
});

describe("the benchmark", () => {
  it("takes the median, so one scheduler hiccup does not demote a fast machine", () => {
    // A 400ms stall inside an otherwise 8ms run.
    expect(medianFrameTime([8, 8, 8, 400, 8])).toBe(8);
  });

  it("averages the middle pair on an even sample count", () => {
    expect(medianFrameTime([10, 20, 30, 40])).toBe(25);
  });

  it("ignores zero, negative and non-finite samples", () => {
    expect(medianFrameTime([0, -5, Number.NaN, Infinity, 12])).toBe(12);
  });

  it("is null when there is nothing usable, which reads as 'not measured'", () => {
    expect(medianFrameTime([])).toBeNull();
    expect(medianFrameTime([0, Number.NaN])).toBeNull();
    expect(decideTier({
      medianFrameMs: medianFrameTime([]),
      prefersReducedMotion: false,
      isLightScheme: false,
    }).tier).toBe("standard");
  });
});

describe("resolvePixelRatio", () => {
  it("caps a retina display at the tier ceiling", () => {
    expect(resolvePixelRatio("cinematic", 3)).toBe(2);
    expect(resolvePixelRatio("standard", 3)).toBe(1.5);
    expect(resolvePixelRatio("chart", 3)).toBe(1);
  });

  it("never upscales a low-density display", () => {
    expect(resolvePixelRatio("cinematic", 1)).toBe(1);
  });

  it("survives a nonsense devicePixelRatio", () => {
    expect(resolvePixelRatio("standard", 0)).toBe(1);
    expect(resolvePixelRatio("standard", Number.NaN)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Token binding
// ---------------------------------------------------------------------------

describe("theme uniforms", () => {
  it("converts sRGB to linear — the renderer works in linear space", () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBeCloseTo(1, 6);
    // Mid grey is famously NOT 0.5 in linear.
    expect(srgbToLinear(0.5)).toBeCloseTo(0.2140, 3);
  });

  it("parses six and three digit hex, with or without the hash", () => {
    const white = parseTokenColour("#ffffff");
    expect(white?.r).toBeCloseTo(1, 6);
    expect(parseTokenColour("fff")).toEqual(white);
    expect(parseTokenColour("  #FFF  ")).toEqual(white);
  });

  it("parses the generated `r g b` triplets tokens.css also emits", () => {
    expect(parseTokenColour("255 255 255")).toEqual(parseTokenColour("#ffffff"));
  });

  it("returns null for anything that is not a colour, rather than black", () => {
    for (const junk of ["", "  ", "var(--x)", "rgb(1,2,3)", "#ff", null, undefined]) {
      expect(parseTokenColour(junk)).toBeNull();
    }
  });

  it("binds every declared token", () => {
    const uniforms = readThemeUniforms((t) =>
      t === "--sf-ambient" ? "0.5" : "#15C17B",
    );
    for (const token of BOUND_TOKENS) {
      expect(uniforms.colours[token]).toBeDefined();
    }
    expect(uniforms.ambient).toBe(0.5);
  });

  it("clamps ambient into 0..1 and defaults it to full", () => {
    expect(parseAmbient("1")).toBe(1);
    expect(parseAmbient("0")).toBe(0);
    expect(parseAmbient("2")).toBe(1);
    expect(parseAmbient("-1")).toBe(0);
    expect(parseAmbient("nonsense")).toBe(1);
    expect(parseAmbient(undefined)).toBe(1);
  });

  it("names only tokens that tokens.css actually owns", () => {
    // A token the generator does not emit would silently bind to black.
    for (const token of BOUND_TOKENS) {
      expect(token.startsWith("--sf-")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Camera rig
// ---------------------------------------------------------------------------

describe("easeSfOut", () => {
  it("is pinned at both ends", () => {
    expect(easeSfOut(0)).toBe(0);
    expect(easeSfOut(1)).toBe(1);
  });

  it("is monotonic — a fly-through never backs up", () => {
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeSfOut(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("front-loads, as an out-curve should", () => {
    expect(easeSfOut(0.5)).toBeGreaterThan(0.5);
  });

  it("clamps out-of-range input instead of extrapolating", () => {
    expect(easeSfOut(-1)).toBe(0);
    expect(easeSfOut(2)).toBe(1);
  });
});

describe("CameraRig", () => {
  const at = (x: number, distance: number) => ({
    target: { x, y: 0, z: 0 },
    distance,
  });

  it("arrives exactly, not approximately", () => {
    const rig = new CameraRig(at(0, 100));
    rig.flyTo(at(10, 5), 0, 1000);
    const pose = rig.update(1000);
    expect(pose.target.x).toBeCloseTo(10, 6);
    expect(pose.distance).toBeCloseTo(5, 6);
    expect(rig.isFlying).toBe(false);
  });

  it("is frame-rate independent — same elapsed time, same pose", () => {
    const a = new CameraRig(at(0, 100));
    const b = new CameraRig(at(0, 100));
    a.flyTo(at(10, 5), 0, 1000);
    b.flyTo(at(10, 5), 0, 1000);

    // 60Hz vs 144Hz, sampled to the same instant.
    for (let t = 0; t <= 500; t += 16.7) a.update(t);
    for (let t = 0; t <= 500; t += 6.9) b.update(t);
    a.update(500);
    b.update(500);

    expect(a.current.target.x).toBeCloseTo(b.current.target.x, 6);
    expect(a.current.distance).toBeCloseTo(b.current.distance, 6);
  });

  it("interpolates distance logarithmically across orders of magnitude", () => {
    // Galaxy (1e6) to planet (1e0): the midpoint should be the geometric
    // mean, not the arithmetic one, or the flight sits still then slams.
    const flight = {
      from: at(0, 1e6),
      to: at(0, 1),
      durationMs: 1000,
      startedAt: 0,
    };
    const mid = poseAt(flight, 500);
    expect(mid.distance).toBeLessThan(1e5);
    expect(mid.distance).toBeGreaterThan(1);
  });

  it("interrupting a flight starts from where the camera IS, not where it was heading", () => {
    const rig = new CameraRig(at(0, 100));
    rig.flyTo(at(100, 100), 0, 1000);
    rig.update(500);
    const mid = rig.current.target.x;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);

    rig.flyTo(at(0, 100), 500, 1000);
    // No snap back to the origin at the moment of redirection.
    expect(rig.update(500).target.x).toBeCloseTo(mid, 6);
  });

  it("arrives immediately under reduced motion", () => {
    const rig = new CameraRig(at(0, 100));
    rig.flyTo(at(50, 2), 0, DEFAULT_FLIGHT_MS, true);
    expect(rig.isFlying).toBe(false);
    expect(rig.current.target.x).toBe(50);
    expect(rig.current.distance).toBe(2);
  });

  it("stop() leaves the camera where it stands", () => {
    const rig = new CameraRig(at(0, 100));
    rig.flyTo(at(100, 10), 0, 1000);
    rig.update(400);
    const held = rig.current.target.x;
    rig.stop();
    expect(rig.update(900).target.x).toBe(held);
  });

  it("treats a zero-length flight as an immediate arrival, not a divide by zero", () => {
    const rig = new CameraRig(at(0, 100));
    rig.flyTo(at(9, 9), 0, 0);
    expect(rig.current.target.x).toBe(9);
    expect(Number.isFinite(rig.current.distance)).toBe(true);
  });
});
