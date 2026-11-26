import { describe, it, expect } from "vitest";
import {
  FRAME_MS,
  StepBudget,
  createFrameLoop,
  createRateGate,
  decayFor,
  perFrameToDt,
  smoothingFor,
  type FrameInfo,
} from "@/lib/sim/frame-loop";

/** A hand-cranked requestAnimationFrame and document. */
function clock() {
  let next = 1;
  const queue = new Map<number, (t: number) => void>();
  const listeners = new Set<() => void>();
  const doc = {
    hidden: false,
    addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => void listeners.delete(fn),
  };
  return {
    raf: (cb: (t: number) => void) => {
      const id = next++;
      queue.set(id, cb);
      return id;
    },
    caf: (id: number) => void queue.delete(id),
    doc: doc as unknown as Document,
    pending: () => queue.size,
    listeners: () => listeners.size,
    /** Run every queued callback once at `time`. */
    tick(time: number) {
      const run = [...queue.values()];
      queue.clear();
      for (const cb of run) cb(time);
    },
    setHidden(hidden: boolean) {
      doc.hidden = hidden;
      for (const fn of [...listeners]) fn();
    },
  };
}

describe("createFrameLoop", () => {
  it("reports no elapsed time on the first frame, then real deltas", () => {
    const c = clock();
    const frames: FrameInfo[] = [];
    const loop = createFrameLoop({ render: (f) => frames.push({ ...f }), raf: c.raf, caf: c.caf, doc: c.doc });
    loop.start();
    c.tick(1000);
    c.tick(1016);
    c.tick(1050);
    expect(frames.map((f) => f.dt)).toEqual([0, 16, 34]);
    loop.stop();
    expect(c.pending()).toBe(0);
    expect(c.listeners()).toBe(0);
  });

  it("clamps a long gap instead of teleporting the scene", () => {
    const c = clock();
    const dts: number[] = [];
    const loop = createFrameLoop({ render: (f) => dts.push(f.dt), raf: c.raf, caf: c.caf, doc: c.doc, maxDt: 100 });
    loop.start();
    c.tick(0);
    c.tick(5000);
    expect(dts[1]).toBe(100);
    loop.stop();
  });

  it("runs the same number of fixed steps however the time is sliced", () => {
    const run = (frameMs: number) => {
      const c = clock();
      let steps = 0;
      const loop = createFrameLoop({
        update: () => steps++,
        render: () => undefined,
        fixedDt: 10,
        raf: c.raf,
        caf: c.caf,
        doc: c.doc,
      });
      loop.start();
      for (let t = 0; t <= 1200; t += frameMs) c.tick(t);
      loop.stop();
      return steps;
    };
    // 1200 ms of wall time at 10 ms per step.
    expect(run(8)).toBe(120);
    expect(run(16)).toBe(120);
    expect(run(40)).toBe(120);
  });

  it("exposes the interpolation fraction between fixed steps", () => {
    const c = clock();
    const alphas: number[] = [];
    const loop = createFrameLoop({
      update: () => undefined,
      render: (f) => alphas.push(f.alpha),
      fixedDt: 10,
      raf: c.raf,
      caf: c.caf,
      doc: c.doc,
    });
    loop.start();
    c.tick(0);
    c.tick(15);
    expect(alphas[1]).toBeCloseTo(0.5);
    loop.stop();
  });

  it("caps sub-steps and drops the backlog (no spiral of death)", () => {
    const c = clock();
    let steps = 0;
    const loop = createFrameLoop({
      update: () => steps++,
      render: () => undefined,
      fixedDt: 1,
      maxSubSteps: 5,
      maxDt: 100,
      raf: c.raf,
      caf: c.caf,
      doc: c.doc,
    });
    loop.start();
    c.tick(0);
    c.tick(100);
    expect(steps).toBe(5);
    c.tick(101);
    // Backlog was dropped: one more ms is one more step, not 95.
    expect(steps).toBe(6);
    loop.stop();
  });

  it("parks while hidden and resumes without a time jump", () => {
    const c = clock();
    const dts: number[] = [];
    const loop = createFrameLoop({ render: (f) => dts.push(f.dt), raf: c.raf, caf: c.caf, doc: c.doc });
    loop.start();
    c.tick(0);
    c.tick(16);
    c.setHidden(true);
    c.tick(32); // the queued frame sees hidden and parks
    expect(loop.ticking).toBe(false);
    expect(c.pending()).toBe(0);
    c.setHidden(false);
    expect(loop.ticking).toBe(true);
    c.tick(60_000);
    expect(dts).toEqual([0, 16, 0]);
    loop.stop();
  });

  it("skips render when shouldRender says nothing changed, but keeps time", () => {
    const c = clock();
    let dirty = false;
    const dts: number[] = [];
    const loop = createFrameLoop({
      render: (f) => dts.push(f.dt),
      shouldRender: () => dirty,
      raf: c.raf,
      caf: c.caf,
      doc: c.doc,
    });
    loop.start();
    c.tick(0);
    c.tick(16);
    dirty = true;
    c.tick(32);
    expect(dts).toEqual([16]);
    loop.stop();
  });

  it("start is idempotent: one loop, never two", () => {
    const c = clock();
    const loop = createFrameLoop({ render: () => undefined, raf: c.raf, caf: c.caf, doc: c.doc });
    loop.start();
    loop.start();
    expect(c.pending()).toBe(1);
    loop.stop();
  });
});

describe("time-based easing", () => {
  it("smoothingFor matches the documented camera formula", () => {
    expect(smoothingFor(16.67)).toBeCloseTo(1 - Math.pow(0.0001, 16.67 / 1000));
    expect(smoothingFor(0)).toBe(0);
  });

  it("perFrameToDt equals the legacy constant at 60 Hz and composes across frame rates", () => {
    expect(perFrameToDt(0.12, FRAME_MS)).toBeCloseTo(0.12);
    // Two 120 Hz frames close the same share of the gap as one 60 Hz frame.
    const half = perFrameToDt(0.12, FRAME_MS / 2);
    expect(1 - (1 - half) * (1 - half)).toBeCloseTo(0.12);
  });

  it("decayFor equals the legacy friction at 60 Hz and composes", () => {
    expect(decayFor(0.95, FRAME_MS)).toBeCloseTo(0.95);
    expect(decayFor(0.95, FRAME_MS / 2) ** 2).toBeCloseTo(0.95);
    expect(decayFor(0.95, 0)).toBe(1);
  });
});

describe("StepBudget", () => {
  it("hands out the same total for any frame rate", () => {
    const total = (frameMs: number) => {
      const budget = new StepBudget();
      let steps = 0;
      for (let t = 0; t < 2000; t += frameMs) steps += budget.take(frameMs, 5400);
      return steps;
    };
    // 2 s at 5400 steps/s (ROGUE: 90 steps per 60 Hz frame).
    expect(total(1000 / 60)).toBeGreaterThanOrEqual(10799);
    expect(total(1000 / 60)).toBeLessThanOrEqual(10800);
    expect(total(8)).toBe(10800);
    expect(total(40)).toBe(10800);
  });

  it("gives exactly the legacy count on an exact 60 Hz frame", () => {
    const budget = new StepBudget();
    expect(budget.take(FRAME_MS, 90 * 60)).toBe(90);
  });

  it("caps a frame and forgets the overflow", () => {
    const budget = new StepBudget(100);
    expect(budget.take(100, 5400)).toBe(100);
    expect(budget.take(FRAME_MS, 5400)).toBe(90);
  });
});

describe("createRateGate", () => {
  it("opens at most `hz` times a second", () => {
    const gate = createRateGate(10);
    let open = 0;
    for (let t = 0; t < 1000; t += 10) if (gate(t)) open++;
    expect(open).toBe(10);
  });
});
