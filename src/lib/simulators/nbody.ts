// ---------------------------------------------------------------------------
// nbody, the gravitational core of the ROGUE simulator.
//
// Ported from public/rogue/sim.html, which held real N-body physics with no test
// coverage at all. That file is the authoritative version (977 lines, the one
// RogueSimulator.tsx loads); simulators/Rogue/index.html is a stale copy.
//
// Units are Gaussian, which is why G is 4pi^2 rather than 6.67e-11:
//
//   distance  AU
//   mass      solar masses
//   time      years
//
// In those units a circular orbit at 1 AU around 1 solar mass has speed 2pi and
// a period of exactly 1. Every test here leans on that.
//
// Pure by design: no canvas, no React, no globals. The renderer owns drawing and
// this module owns motion, so the physics can be tested without a browser.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gravitational constant in AU^3 / (Msun * yr^2). */
export const G = 4 * Math.PI * Math.PI;

/** AU/yr to km/s, for reporting speeds a reader recognises. */
export const AU_PER_YEAR_TO_KM_S = 4.7405;

/** Jupiter mass in solar masses. */
export const M_JUPITER = 9.547e-4;

/** Earth mass in solar masses. */
export const M_EARTH = 3.003e-6;

/** Default integration step, in years. */
export const DT_BASE = 0.00008;

/**
 * Plummer softening added to r^2, in AU^2.
 *
 * Without it a close pass divides by something near zero and flings a body to
 * infinity in one step. It is the difference between a grazing encounter and a
 * numerical explosion, and it is why the original could survive a black hole
 * passing through a planetary system.
 */
export const SOFTENING = 0.00005;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Body {
  name: string;
  /** Position in AU. */
  x: number;
  y: number;
  /** Velocity in AU/yr. */
  vx: number;
  vy: number;
  /** Mass in solar masses. */
  mass: number;
  isStar?: boolean;
  isPlanet?: boolean;
  isIntruder?: boolean;
  /**
   * Intruders exist before they are launched, parked off-stage. An inactive one
   * neither feels nor exerts gravity, so the system stays on rails until the
   * writer presses go.
   */
  active?: boolean;
  /** Original semi-major axis in AU, used to judge whether a body has left. */
  a?: number;
}

export interface Accelerations {
  ax: Float64Array;
  ay: Float64Array;
}

// ---------------------------------------------------------------------------
// Forces
// ---------------------------------------------------------------------------

/** Reusable buffers: this runs twice per step, at up to 120 steps a frame. */
const pool: Accelerations = { ax: new Float64Array(32), ay: new Float64Array(32) };

/**
 * Pairwise softened Newtonian acceleration for every body.
 *
 * `fullNBody` false skips planet-planet forces. The original does this before
 * launch, and it matters: mutual planetary tugs accumulate into resonance drift,
 * so a system left idling would slowly deform on its own and the writer would
 * see their setup rot before the encounter began. Once the intruder is live,
 * every pair counts.
 *
 * Returns pooled arrays, valid only until the next call. Copy if you need to
 * keep them.
 */
export function computeAccelerations(bodies: Body[], fullNBody: boolean): Accelerations {
  const n = bodies.length;
  if (pool.ax.length < n) {
    pool.ax = new Float64Array(n);
    pool.ay = new Float64Array(n);
  }
  const { ax, ay } = pool;
  ax.fill(0, 0, n);
  ay.fill(0, 0, n);

  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    if (bi.isIntruder && !bi.active) continue;

    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      if (bj.isIntruder && !bj.active) continue;
      if (!fullNBody && bi.isPlanet && bj.isPlanet) continue;

      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r2 = dx * dx + dy * dy + SOFTENING;
      const r = Math.sqrt(r2);
      // f is the acceleration per unit mass at this separation; multiplying by
      // the *other* body's mass gives each side its own acceleration.
      const f = G / r2;
      const fx = (f * dx) / r;
      const fy = (f * dy) / r;

      ax[i] += bj.mass * fx;
      ay[i] += bj.mass * fy;
      ax[j] -= bi.mass * fx;
      ay[j] -= bi.mass * fy;
    }
  }

  return { ax, ay };
}

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

/**
 * Advance one step by kick-drift-kick leapfrog.
 *
 * Second-order and symplectic, so energy oscillates within a bound instead of
 * drifting away. That property is the whole reason to use it here: a system can
 * be integrated for thousands of orbits and still be recognisably itself, which
 * a simple Euler step cannot promise.
 *
 * Mutates `bodies` in place, as the renderer reads the same objects each frame.
 */
export function step(bodies: Body[], dt: number, fullNBody: boolean): void {
  const n = bodies.length;
  const moving = (b: Body) => !(b.isIntruder && !b.active);

  // Half kick.
  let acc = computeAccelerations(bodies, fullNBody);
  for (let i = 0; i < n; i++) {
    if (!moving(bodies[i])) continue;
    bodies[i].vx += acc.ax[i] * dt * 0.5;
    bodies[i].vy += acc.ay[i] * dt * 0.5;
  }

  // Drift.
  for (let i = 0; i < n; i++) {
    if (!moving(bodies[i])) continue;
    bodies[i].x += bodies[i].vx * dt;
    bodies[i].y += bodies[i].vy * dt;
  }

  // Second half kick, against forces at the new positions. Recomputing here is
  // what makes the scheme second-order rather than plain Euler.
  acc = computeAccelerations(bodies, fullNBody);
  for (let i = 0; i < n; i++) {
    if (!moving(bodies[i])) continue;
    bodies[i].vx += acc.ax[i] * dt * 0.5;
    bodies[i].vy += acc.ay[i] * dt * 0.5;
  }
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export interface Barycenter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

/** Mass-weighted centre and velocity of the given bodies. */
export function barycenter(bodies: Body[]): Barycenter {
  const mass = bodies.reduce((s, b) => s + b.mass, 0);
  if (mass === 0) return { x: 0, y: 0, vx: 0, vy: 0, mass: 0 };
  return {
    x: bodies.reduce((s, b) => s + b.x * b.mass, 0) / mass,
    y: bodies.reduce((s, b) => s + b.y * b.mass, 0) / mass,
    vx: bodies.reduce((s, b) => s + b.vx * b.mass, 0) / mass,
    vy: bodies.reduce((s, b) => s + b.vy * b.mass, 0) / mass,
    mass,
  };
}

/** The stellar barycenter, which is what planets actually orbit. */
export function stellarBarycenter(bodies: Body[]): Barycenter {
  return barycenter(bodies.filter((b) => b.isStar));
}

/**
 * Specific orbital energy relative to a centre: v^2/2 - GM/r.
 *
 * Negative is bound, positive is escaping. This is the quantity that decides
 * whether a planet is still part of its system.
 */
export function specificOrbitalEnergy(body: Body, centre: Barycenter): number {
  const dx = body.x - centre.x;
  const dy = body.y - centre.y;
  const r = Math.hypot(dx, dy);
  const dvx = body.vx - centre.vx;
  const dvy = body.vy - centre.vy;
  const v2 = dvx * dvx + dvy * dvy;
  return 0.5 * v2 - (G * centre.mass) / Math.max(r, 1e-12);
}

/**
 * Names of bodies that have been thrown out of the system.
 *
 * Two conditions, both required. Positive energy alone is not enough: a planet
 * at periapsis on a wildly perturbed orbit can read as unbound for a moment
 * while still firmly attached, so it must also have travelled well beyond where
 * it started. That is what `a * 1.5` is doing.
 */
export function ejectedBodies(bodies: Body[]): Set<string> {
  const centre = stellarBarycenter(bodies);
  const ejected = new Set<string>();
  if (centre.mass === 0) return ejected;

  for (const b of bodies) {
    if (b.isStar || b.isIntruder) continue;
    const r = Math.hypot(b.x - centre.x, b.y - centre.y);
    if (specificOrbitalEnergy(b, centre) > 0 && r > (b.a ?? 1) * 1.5) {
      ejected.add(b.name);
    }
  }
  return ejected;
}

/** Fastest body in the system, in km/s, for the readout. */
export function maxSpeedKmS(bodies: Body[]): number {
  const centre = stellarBarycenter(bodies);
  let max = 0;
  for (const b of bodies) {
    if (b.isStar || b.isIntruder) continue;
    const speed = Math.hypot(b.vx - centre.vx, b.vy - centre.vy) * AU_PER_YEAR_TO_KM_S;
    if (speed > max) max = speed;
  }
  return max;
}

export type EncounterStatus =
  | "awaiting"
  | "approaching"
  | "perturbed"
  | "post-encounter"
  | "ejecting"
  | "disrupted";

/**
 * What the system is currently doing, for the status badge.
 *
 * `systemReachAU` is the outer edge of the original system; the intruder counts
 * as "still here" out to twice that.
 */
export function classifyEncounter(
  bodies: Body[],
  launched: boolean,
  systemReachAU: number,
): { status: EncounterStatus; ejected: Set<string> } {
  const ejected = ejectedBodies(bodies);
  if (!launched) return { status: "awaiting", ejected };

  const planetCount = bodies.filter((b) => b.isPlanet).length;
  // Losing 40% of the planets is a different story from losing one.
  if (ejected.size >= Math.max(1, Math.floor(planetCount * 0.4))) {
    return { status: "disrupted", ejected };
  }
  if (ejected.size > 0) return { status: "ejecting", ejected };

  const intruder = bodies.find((b) => b.isIntruder && b.active);
  if (intruder) {
    const centre = stellarBarycenter(bodies);
    const r = Math.hypot(intruder.x - centre.x, intruder.y - centre.y);
    return { status: r < systemReachAU * 2 ? "perturbed" : "post-encounter", ejected };
  }
  return { status: "approaching", ejected };
}

// ---------------------------------------------------------------------------
// Conserved quantities, for tests and for a physics readout
// ---------------------------------------------------------------------------

/**
 * Total energy of the system, kinetic plus potential.
 *
 * Uses the same softening as the force calculation. Mixing softened forces with
 * unsoftened potential would show a spurious energy drift and send anyone
 * debugging the integrator on a long detour.
 */
export function totalEnergy(bodies: Body[]): number {
  const active = bodies.filter((b) => !(b.isIntruder && !b.active));
  let kinetic = 0;
  for (const b of active) kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);

  let potential = 0;
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const dx = active[j].x - active[i].x;
      const dy = active[j].y - active[i].y;
      const r = Math.sqrt(dx * dx + dy * dy + SOFTENING);
      potential -= (G * active[i].mass * active[j].mass) / r;
    }
  }
  return kinetic + potential;
}

/** Total linear momentum, which nothing internal should be able to change. */
export function totalMomentum(bodies: Body[]): { px: number; py: number } {
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    if (b.isIntruder && !b.active) continue;
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return { px, py };
}

/** Circular orbit speed at radius `r` around mass `m`, in AU/yr. */
export function circularSpeed(m: number, r: number): number {
  return Math.sqrt((G * m) / r);
}

/** Kepler's third law: period in years for a semi-major axis in AU. */
export function orbitalPeriod(m: number, a: number): number {
  return Math.sqrt((4 * Math.PI * Math.PI * a * a * a) / (G * m));
}
