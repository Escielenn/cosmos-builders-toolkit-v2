// ---------------------------------------------------------------------------
// Camera rig (Brief G1 §5).
//
// "flyTo(target, distance, ms) using the design system's ease-sf-out. No
// spring physics."
//
// §2 Tier 2: "galaxy → click a system → the camera FLIES there and the system
// scene fades in under it. Never a route change with a spinner. This is the
// thing that makes it feel like one universe."
//
// The maths is pure and frame-rate independent — given the same elapsed time
// it produces the same pose on a 60Hz and a 144Hz display. That is what makes
// it testable, and it is why there are no springs: a spring's rest state
// depends on how often you asked it.
// ---------------------------------------------------------------------------

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  /** Where the camera looks. */
  target: Vec3;
  /** How far back it sits from that target. */
  distance: number;
}

export interface Flight {
  from: CameraPose;
  to: CameraPose;
  durationMs: number;
  startedAt: number;
}

/**
 * cubic-bezier(0.2, 0, 0, 1) — `ease-sf-out` in tailwind.config.ts.
 *
 * Solved by bisection rather than approximated: the curve is the design
 * system's, and an eyeballed easing is how a motion language drifts.
 */
export function easeSfOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  if (clamped === 0 || clamped === 1) return clamped;

  const x1 = 0.2;
  const x2 = 0;
  const y1 = 0;
  const y2 = 1;

  const bezier = (p1: number, p2: number, u: number) => {
    const v = 1 - u;
    return 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u;
  };

  // Find u where x(u) = t, then read y(u).
  let lo = 0;
  let hi = 1;
  let u = clamped;
  for (let i = 0; i < 24; i += 1) {
    const x = bezier(x1, x2, u);
    if (Math.abs(x - clamped) < 1e-5) break;
    if (x < clamped) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return bezier(y1, y2, u);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

/**
 * The pose at a moment in a flight.
 *
 * Distance is interpolated in LOG space. Flying from a galaxy view to a planet
 * crosses several orders of magnitude, and a linear approach spends almost the
 * whole animation nearly stationary and then slams the last decade — the
 * "falling into the map" feel comes from constant *relative* rate.
 */
export function poseAt(flight: Flight, now: number): CameraPose {
  const elapsed = now - flight.startedAt;
  const t =
    flight.durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / flight.durationMs));
  const eased = easeSfOut(t);

  const from = Math.max(flight.from.distance, 1e-6);
  const to = Math.max(flight.to.distance, 1e-6);

  return {
    target: lerpVec3(flight.from.target, flight.to.target, eased),
    distance: Math.exp(lerp(Math.log(from), Math.log(to), eased)),
  };
}

export function isFlightDone(flight: Flight, now: number): boolean {
  return now - flight.startedAt >= flight.durationMs;
}

/** Default flight time. Inside 14 §4's motion band; long enough to read as travel. */
export const DEFAULT_FLIGHT_MS = 900;

export class CameraRig {
  private pose: CameraPose;
  private flight: Flight | null = null;

  constructor(initial: CameraPose) {
    this.pose = { target: { ...initial.target }, distance: initial.distance };
  }

  get current(): CameraPose {
    return this.pose;
  }

  get isFlying(): boolean {
    return this.flight !== null;
  }

  /**
   * Begin a flight. Starts from wherever the camera IS, not from where a
   * previous flight was heading, so interrupting one mid-way does not snap.
   */
  flyTo(
    to: CameraPose,
    now: number,
    durationMs: number = DEFAULT_FLIGHT_MS,
    /** Honour the reader's motion preference: arrive immediately. */
    reducedMotion = false,
  ): void {
    if (reducedMotion || durationMs <= 0) {
      this.pose = { target: { ...to.target }, distance: to.distance };
      this.flight = null;
      return;
    }
    this.flight = {
      from: { target: { ...this.pose.target }, distance: this.pose.distance },
      to: { target: { ...to.target }, distance: to.distance },
      durationMs,
      startedAt: now,
    };
  }

  /** Advance to `now`. Returns the pose to apply this frame. */
  update(now: number): CameraPose {
    if (!this.flight) return this.pose;
    this.pose = poseAt(this.flight, now);
    if (isFlightDone(this.flight, now)) this.flight = null;
    return this.pose;
  }

  /** Abandon a flight where it stands — used when the scene unmounts. */
  stop(): void {
    this.flight = null;
  }
}
