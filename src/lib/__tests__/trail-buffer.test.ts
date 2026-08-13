import { describe, it, expect } from "vitest";
import { TrailBuffer, TrailSet, TRAIL_MAX } from "@/lib/simulators/trail-buffer";

describe("TrailBuffer", () => {
  it("returns points oldest first", () => {
    const t = new TrailBuffer(5);
    t.push(1, 10);
    t.push(2, 20);
    t.push(3, 30);
    expect(t.count).toBe(3);
    expect(t.get(0)).toEqual({ x: 1, y: 10 });
    expect(t.get(2)).toEqual({ x: 3, y: 30 });
  });

  it("overwrites the oldest once full, keeping order", () => {
    const t = new TrailBuffer(3);
    for (let i = 1; i <= 5; i++) t.push(i, i * 10);
    expect(t.count).toBe(3);
    // 1 and 2 are gone; 3, 4, 5 remain in order.
    expect(t.toArray()).toEqual([
      { x: 3, y: 30 },
      { x: 4, y: 40 },
      { x: 5, y: 50 },
    ]);
  });

  it("wraps without producing a negative index", () => {
    // The original's read used a single modulo, which in JS yields a negative
    // index once head - count goes below zero.
    const t = new TrailBuffer(4);
    for (let i = 0; i < 6; i++) t.push(i, i);
    for (let i = 0; i < t.count; i++) {
      const p = t.get(i);
      expect(Number.isFinite(p.x), `point ${i}`).toBe(true);
      expect(Number.isFinite(p.y), `point ${i}`).toBe(true);
    }
  });

  it("tracks the newest point", () => {
    const t = new TrailBuffer(4);
    expect(t.last()).toBeNull();
    t.push(7, 8);
    t.push(9, 10);
    expect(t.last()).toEqual({ x: 9, y: 10 });
  });

  it("writes into a caller's object so the render loop allocates nothing", () => {
    const t = new TrailBuffer(3);
    t.push(1, 2);
    const into = { x: 0, y: 0 };
    const out = t.get(0, into);
    expect(out).toBe(into);
    expect(into).toEqual({ x: 1, y: 2 });
  });

  it("reports NaN for an out-of-range read rather than stale data", () => {
    const t = new TrailBuffer(3);
    t.push(1, 1);
    expect(Number.isNaN(t.get(5).x)).toBe(true);
    expect(Number.isNaN(t.get(-1).x)).toBe(true);
  });

  it("clears", () => {
    const t = new TrailBuffer(3);
    t.push(1, 1);
    t.clear();
    expect(t.count).toBe(0);
    expect(t.last()).toBeNull();
  });

  it("defaults to the documented capacity", () => {
    expect(new TrailBuffer().capacity).toBe(TRAIL_MAX);
  });

  it("refuses a zero or negative capacity", () => {
    expect(new TrailBuffer(0).capacity).toBe(1);
    expect(new TrailBuffer(-9).capacity).toBe(1);
  });
});

describe("TrailSet", () => {
  it("creates a trail per body on first use", () => {
    const set = new TrailSet(4);
    expect(set.has("Earth")).toBe(false);
    set.for("Earth").push(1, 1);
    expect(set.has("Earth")).toBe(true);
    expect(set.for("Earth").count).toBe(1);
  });

  it("keeps bodies separate", () => {
    const set = new TrailSet(4);
    set.for("Earth").push(1, 1);
    set.for("Mars").push(2, 2);
    expect(set.for("Earth").toArray()).toEqual([{ x: 1, y: 1 }]);
    expect(set.for("Mars").toArray()).toEqual([{ x: 2, y: 2 }]);
  });

  it("clear empties the paths but keeps the bodies", () => {
    const set = new TrailSet(4);
    set.for("Earth").push(1, 1);
    set.clear();
    expect(set.has("Earth")).toBe(true);
    expect(set.for("Earth").count).toBe(0);
  });

  it("reset forgets the bodies, for a new system", () => {
    const set = new TrailSet(4);
    set.for("Earth").push(1, 1);
    set.reset();
    expect(set.has("Earth")).toBe(false);
  });
});
