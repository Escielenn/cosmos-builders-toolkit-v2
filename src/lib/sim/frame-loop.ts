/**
 * frame-loop: the one animation loop every React simulator runs on.
 *
 * Jason, 1.7: "I just want them to function smoothly, they seem jittery."
 * The jitter had the same four causes in every simulator, so the cure lives
 * in one tested place instead of in each draw loop:
 *
 *   1. Motion tied to the frame count. A loop that advances "one step per
 *      frame" runs half speed on a slow frame and double speed on a 120 Hz
 *      panel, so any hitch reads as a stutter in the motion itself. Here the
 *      simulation advances by elapsed time: a fixed-step accumulator for
 *      physics (`update`), a clamped real dt for everything else (`render`).
 *   2. An unclamped dt after the tab was hidden, which teleports the scene.
 *      dt is clamped to `maxDt`, and the accumulator is capped at
 *      `maxSubSteps` so a slow machine degrades to slow motion instead of a
 *      spiral of death.
 *   3. Loops that keep running while the tab is hidden or the canvas is
 *      scrolled off screen. The loop parks itself and resumes with a fresh
 *      clock, so the first frame back is an ordinary frame.
 *   4. Smoothing written as "move 12% per frame". `smoothingFor` and
 *      `perFrameToDt` turn those into time-based factors (CLAUDE.md, Camera
 *      Smoothing).
 *
 * Nothing here draws, and nothing here knows about React: the browser
 * clock is injected so the whole file is unit-tested (frame-loop.test.ts).
 * The static iframe simulators use the plain-JS twin,
 * public/tools/_shared/sim-loop.js; keep the two in step.
 */

/** One 60 Hz frame, in ms. Legacy per-frame constants were tuned against it. */
export const FRAME_MS = 1000 / 60;

/** Default dt clamp: anything longer is a tab switch, not a frame. */
export const MAX_FRAME_DT_MS = 100;

export interface FrameInfo {
  /** Clamped wall time since the previous frame, in ms. */
  dt: number;
  /** rAF timestamp of this frame, in ms. */
  time: number;
  /** 0..1: how far the render sits between the last two fixed steps. */
  alpha: number;
  /** Fixed steps run this frame (0 when no `update` was given). */
  steps: number;
}

export interface FrameLoopOptions {
  /** Called once per rendered frame, after any fixed steps. */
  render: (frame: FrameInfo) => void;
  /** Fixed-timestep simulation step. Receives `fixedDt` every time. */
  update?: (fixedDtMs: number) => void;
  /** Size of one fixed step in ms. Default: one 60 Hz frame. */
  fixedDt?: number;
  /** Longest dt a frame may report. Default 100 ms. */
  maxDt?: number;
  /** Most fixed steps one frame may run before time is dropped. Default 8. */
  maxSubSteps?: number;
  /** Park while `document.hidden`. Default true. */
  pauseWhenHidden?: boolean;
  /** Park while this element is off screen (IntersectionObserver). */
  target?: Element | null;
  /** Return false to skip `render` this frame (on-demand rendering). */
  shouldRender?: () => boolean;
  /** Test seams. */
  raf?: (cb: (time: number) => void) => number;
  caf?: (id: number) => void;
  doc?: Pick<Document, "hidden" | "addEventListener" | "removeEventListener"> | null;
}

export interface FrameLoop {
  start(): void;
  stop(): void;
  /** True between start() and stop(), parked or not. */
  readonly active: boolean;
  /** True while frames are actually being requested. */
  readonly ticking: boolean;
}

/**
 * Build a loop. It does not start until `start()`; `stop()` removes every
 * listener, so `useEffect(() => { loop.start(); return () => loop.stop(); })`
 * is the whole lifecycle.
 */
export function createFrameLoop(options: FrameLoopOptions): FrameLoop {
  const {
    render,
    update,
    fixedDt = FRAME_MS,
    maxDt = MAX_FRAME_DT_MS,
    maxSubSteps = 8,
    pauseWhenHidden = true,
    target = null,
    shouldRender,
  } = options;
  const raf = options.raf ?? ((cb) => requestAnimationFrame(cb));
  const caf = options.caf ?? ((id) => cancelAnimationFrame(id));
  const doc = options.doc === undefined ? (typeof document === "undefined" ? null : document) : options.doc;

  let active = false;
  let handle: number | null = null;
  let last: number | null = null;
  let acc = 0;
  let onScreen = true;
  let observer: IntersectionObserver | null = null;

  const info: FrameInfo = { dt: 0, time: 0, alpha: 1, steps: 0 };

  const parked = () => (pauseWhenHidden && !!doc?.hidden) || !onScreen;

  const frame = (time: number) => {
    handle = null;
    if (!active) return;
    if (parked()) {
      last = null;
      return;
    }
    // First frame after start or a park: no elapsed time, never a jump.
    let dt = last === null ? 0 : time - last;
    last = time;
    if (dt < 0) dt = 0;
    if (dt > maxDt) dt = maxDt;

    let steps = 0;
    if (update) {
      acc += dt;
      while (acc >= fixedDt && steps < maxSubSteps) {
        update(fixedDt);
        acc -= fixedDt;
        steps++;
      }
      // Could not keep up: drop the backlog rather than chase it forever.
      if (acc >= fixedDt) acc = 0;
    }

    info.dt = dt;
    info.time = time;
    info.steps = steps;
    info.alpha = update ? acc / fixedDt : 1;
    if (!shouldRender || shouldRender()) render(info);

    if (active && handle === null) handle = raf(frame);
  };

  const wake = () => {
    if (!active || handle !== null || parked()) return;
    last = null;
    handle = raf(frame);
  };

  const onVisibility = () => wake();

  return {
    start() {
      if (active) return;
      active = true;
      last = null;
      acc = 0;
      if (pauseWhenHidden && doc) doc.addEventListener("visibilitychange", onVisibility);
      if (target && typeof IntersectionObserver !== "undefined") {
        observer = new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          onScreen = entry ? entry.isIntersecting : true;
          wake();
        });
        observer.observe(target);
      }
      wake();
    },
    stop() {
      if (!active) return;
      active = false;
      if (handle !== null) caf(handle);
      handle = null;
      if (pauseWhenHidden && doc) doc.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      observer = null;
      onScreen = true;
    },
    get active() {
      return active;
    },
    get ticking() {
      return handle !== null;
    },
  };
}

/**
 * Framerate-independent exponential smoothing factor (CLAUDE.md, Camera
 * Smoothing): `value += (target - value) * smoothingFor(dt)`.
 * `residual` is the fraction of the gap left after one second.
 */
export function smoothingFor(dtMs: number, residual = 0.0001): number {
  if (dtMs <= 0) return 0;
  return 1 - Math.pow(residual, dtMs / 1000);
}

/**
 * Convert a legacy "fraction per 60 Hz frame" easing constant to the factor
 * for an arbitrary dt. Identical at 16.67 ms, so the tuned feel is kept.
 */
export function perFrameToDt(perFrame: number, dtMs: number): number {
  if (dtMs <= 0) return 0;
  return 1 - Math.pow(1 - perFrame, dtMs / FRAME_MS);
}

/** A per-60 Hz-frame multiplier (friction 0.95) applied over an arbitrary dt. */
export function decayFor(perFrame: number, dtMs: number): number {
  if (dtMs <= 0) return 1;
  return Math.pow(perFrame, dtMs / FRAME_MS);
}

/**
 * Whole-step budget for simulations that run many small integrator steps per
 * frame. `take(dt, stepsPerSecond)` returns how many to run now and carries
 * the fraction, so the step count over any stretch of wall time is the same
 * whether it arrived as 60, 120 or 37 frames a second.
 */
export class StepBudget {
  private carry = 0;

  constructor(private readonly maxPerFrame = Infinity) {}

  take(dtMs: number, stepsPerSecond: number): number {
    if (dtMs <= 0 || stepsPerSecond <= 0) return 0;
    this.carry += (dtMs / 1000) * stepsPerSecond;
    // The epsilon keeps an exact 60 Hz frame from landing on 89.999… steps.
    let whole = Math.floor(this.carry + 1e-9);
    this.carry = Math.max(0, this.carry - whole);
    if (whole > this.maxPerFrame) {
      // Over budget: run what fits and forget the rest (slow motion, not a stall).
      whole = this.maxPerFrame;
      this.carry = 0;
    }
    return whole;
  }

  reset(): void {
    this.carry = 0;
  }
}

/**
 * Rate limiter for publishing loop state to React (readouts at ~10 Hz
 * instead of a re-render per frame).
 */
export function createRateGate(hz: number): (timeMs: number) => boolean {
  const interval = 1000 / hz;
  let last = -Infinity;
  return (timeMs) => {
    if (timeMs - last < interval) return false;
    last = timeMs;
    return true;
  };
}

/** Device pixel ratio capped for canvas backing stores. */
export function cappedDpr(cap = 2): number {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.max(1, Math.min(dpr, cap));
}
