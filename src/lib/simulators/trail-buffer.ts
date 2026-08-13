// ---------------------------------------------------------------------------
// trail-buffer, the path a body has travelled.
//
// A ring buffer over two Float64Arrays rather than an array of points. Trails
// are pushed every few physics steps for every body, so at 120 steps a frame an
// array-of-objects would allocate constantly and an Array.shift() to cap the
// length would be O(n) on each push. This overwrites in place and never
// allocates after construction.
//
// Ported from the original ROGUE's TrailBuffer, with the read path corrected:
// see `get`.
// ---------------------------------------------------------------------------

export const TRAIL_MAX = 2000;

export interface TrailPoint {
  x: number;
  y: number;
}

export class TrailBuffer {
  private xs: Float64Array;
  private ys: Float64Array;
  private head = 0;
  private length = 0;
  readonly capacity: number;

  constructor(capacity: number = TRAIL_MAX) {
    this.capacity = Math.max(1, Math.floor(capacity));
    this.xs = new Float64Array(this.capacity);
    this.ys = new Float64Array(this.capacity);
  }

  get count(): number {
    return this.length;
  }

  push(x: number, y: number): void {
    this.xs[this.head] = x;
    this.ys[this.head] = y;
    this.head = (this.head + 1) % this.capacity;
    if (this.length < this.capacity) this.length++;
  }

  /**
   * The i-th point in age order: 0 is the oldest still held, count-1 the newest.
   *
   * Writes into the caller's object when given one, so a render loop drawing
   * thousands of points per frame allocates nothing.
   */
  get(i: number, into?: TrailPoint): TrailPoint {
    const target = into ?? { x: 0, y: 0 };
    if (i < 0 || i >= this.length) {
      target.x = NaN;
      target.y = NaN;
      return target;
    }
    // head points at the next slot to write, so the oldest live sample is
    // head - length. The double modulo keeps that positive in JS, where
    // -1 % 5 is -1 rather than 4.
    const idx = (((this.head - this.length + i) % this.capacity) + this.capacity) % this.capacity;
    target.x = this.xs[idx];
    target.y = this.ys[idx];
    return target;
  }

  /** Newest point, or null while empty. */
  last(into?: TrailPoint): TrailPoint | null {
    if (this.length === 0) return null;
    return this.get(this.length - 1, into);
  }

  clear(): void {
    this.head = 0;
    this.length = 0;
  }

  /** Plain points, oldest first. For saving; the render loop should use `get`. */
  toArray(): TrailPoint[] {
    const out: TrailPoint[] = [];
    for (let i = 0; i < this.length; i++) out.push(this.get(i));
    return out;
  }
}

/** Trails keyed by body name, created on demand. */
export class TrailSet {
  private trails = new Map<string, TrailBuffer>();

  constructor(private readonly capacity: number = TRAIL_MAX) {}

  for(name: string): TrailBuffer {
    let t = this.trails.get(name);
    if (!t) {
      t = new TrailBuffer(this.capacity);
      this.trails.set(name, t);
    }
    return t;
  }

  has(name: string): boolean {
    return this.trails.has(name);
  }

  clear(): void {
    for (const t of this.trails.values()) t.clear();
  }

  reset(): void {
    this.trails.clear();
  }
}
