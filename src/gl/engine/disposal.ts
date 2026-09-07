// ---------------------------------------------------------------------------
// Disposal discipline (Brief G1).
//
// A WebGL context is not garbage collected the way a React tree is. Geometries,
// materials, textures, render targets and the context itself all have to be
// released by hand, and a leak does not fail — it degrades, until the browser
// drops the oldest context and a canvas somewhere else in the app goes black.
//
// So the engine never news up a disposable without registering it. This
// registry is the one place that knows what is outstanding, which is what
// makes "did we actually clean up?" a testable question rather than a hope.
//
// Deliberately free of any three.js import: anything with a dispose() is a
// disposable. That keeps this unit-testable without a GL context, which is
// the only way it gets tested at all in CI.
// ---------------------------------------------------------------------------

export interface Disposable {
  dispose: () => void;
}

export interface DisposalStats {
  /** Still outstanding. Should be 0 after teardown. */
  live: number;
  /** Successfully disposed over this registry's life. */
  disposed: number;
  /** Threw from their own dispose(). Reported, never swallowed silently. */
  failed: number;
}

export class DisposalRegistry {
  private items = new Set<Disposable>();
  private disposedCount = 0;
  private failedCount = 0;
  private closed = false;

  /**
   * Register and return the value, so a caller reads as
   * `const geo = registry.track(new SphereGeometry())`.
   */
  track<T extends Disposable>(item: T): T {
    if (this.closed) {
      // Registering after teardown means something outlived the engine. Dispose
      // it immediately rather than holding a reference nothing will release.
      this.safeDispose(item);
      return item;
    }
    this.items.add(item);
    return item;
  }

  /** Register a plain teardown function (an event listener, an observer). */
  trackFn(fn: () => void): Disposable {
    return this.track({ dispose: fn });
  }

  /** Release one item early — a material swapped mid-scene, say. */
  release(item: Disposable): void {
    if (this.items.delete(item)) this.safeDispose(item);
  }

  /**
   * Tear everything down. Safe to call twice: the second call is a no-op, so
   * a React StrictMode double-unmount cannot double-dispose a GL object.
   */
  disposeAll(): DisposalStats {
    if (this.closed) return this.stats();
    this.closed = true;
    // Copy first: a dispose() that releases a sibling would otherwise mutate
    // the set mid-iteration. And dispose ONLY if this loop is the one that
    // removed it — a dispose() that calls release() on a sibling already
    // disposed that sibling, and calling dispose twice on a GL object is how
    // a context dies.
    for (const item of [...this.items]) {
      if (this.items.delete(item)) this.safeDispose(item);
    }
    return this.stats();
  }

  stats(): DisposalStats {
    return {
      live: this.items.size,
      disposed: this.disposedCount,
      failed: this.failedCount,
    };
  }

  get isClosed(): boolean {
    return this.closed;
  }

  private safeDispose(item: Disposable): void {
    try {
      item.dispose();
      this.disposedCount += 1;
    } catch {
      // One bad dispose must not strand the rest of the context.
      this.failedCount += 1;
    }
  }
}
