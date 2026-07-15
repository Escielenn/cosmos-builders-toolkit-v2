/**
 * Solaris N-body physics engine (native port of A's integrator).
 *
 * Model (matches A's documented physics):
 *  - Stars follow prescribed analytic Keplerian orbits about the system
 *    barycenter (not true N-body between stars).
 *  - Single-star planets: exact analytic Kepler (no integration drift; this
 *    is the M1/M2 behavior, preserved so single-star systems don't regress).
 *  - Multi-star planets: Velocity Verlet against ALL stars, adaptive substeps
 *    capped at ~2% of the shortest orbit, with a shell-theorem circular seed
 *    and an ejection guard.
 *
 * Units are physical: AU, years, solar masses, with G = 4π² so that a 1 M☉
 * central body gives a 1 AU circular orbit a 1-year period. (A used an
 * arbitrary "14 sim-second" calibration and luminosity as a mass proxy; this
 * port uses real stellar mass and real time — flagged in the milestone doc.)
 */
import type { StarSystem, PlanetData } from "./types";
import { phaseForIndex } from "./hooks/useOrbitalPosition";

export const G = 4 * Math.PI * Math.PI; // AU³ / (M☉·yr²)
const SOFT2 = 0.02 * 0.02; // softening² (AU²) — avoids singularities on close approach

export interface StarBody {
  massSOL: number;
  lum: number;
  colorHex: string;
  name: string;
  radiusSOL: number;
  orbitR: number; // barycentric orbit radius (AU); 0 = at center
  phase: number;
  omega: number; // rad/yr; 0 = stationary
  x: number;
  z: number;
}

export interface PlanetBody {
  id: string;
  sma: number;
  e: number;
  period: number;
  phase: number;
  retro: boolean;
  // integration state (multi-star)
  x: number;
  z: number;
  vx: number;
  vz: number;
  ejections: number;
}

/** Analytic Kepler position in AU (orbit in the x–z plane, star at focus). */
export function keplerPosAU(
  sma: number,
  e: number,
  period: number,
  tYears: number,
  phase: number
): [number, number] {
  if (period <= 0) return [sma, 0];
  const M = (2 * Math.PI * tYears) / period + phase;
  let E = M;
  for (let i = 0; i < 6; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = sma * (1 - e * Math.cos(E));
  return [r * Math.cos(nu), r * Math.sin(nu)];
}

export class SolarisSim {
  stars: StarBody[];
  planets: PlanetBody[];
  readonly multi: boolean;
  tYears = 0;
  private outerStableR: number;

  constructor(system: StarSystem) {
    const list = system.stars && system.stars.length ? system.stars : [system.star];
    this.multi = list.length > 1;
    this.stars = list.map((s) => ({
      massSOL: s.massSOL,
      lum: s.luminositySOL,
      colorHex: s.colorHex,
      name: s.name,
      radiusSOL: s.radiusSOL,
      orbitR: s.orbitRadiusAU ?? 0,
      phase: s.orbitPhase ?? 0,
      omega: s.orbitPeriodYears ? (2 * Math.PI) / s.orbitPeriodYears : 0,
      x: 0,
      z: 0,
    }));
    this.updateStarPositions();

    const maxStarR = this.stars.reduce((m, s) => Math.max(m, s.orbitR), 0);
    this.outerStableR = maxStarR > 0 ? maxStarR * 8 + 60 : 200;

    this.planets = system.planets.map((p, i) => this.makeBody(p, i));
  }

  /** Create a planet body, positioned for the current time (analytic for single-star, circular seed for multi). */
  private makeBody(p: PlanetData, index: number): PlanetBody {
    const body: PlanetBody = {
      id: p.id ?? `idx-${index}`,
      sma: p.semiMajorAxisAU,
      e: p.eccentricity,
      period: p.orbitalPeriodYears,
      phase: phaseForIndex(index),
      retro: false,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      ejections: 0,
    };
    if (this.multi) {
      this.seedPlanet(body);
    } else {
      const [x, z] = keplerPosAU(body.sma, body.e, body.period, this.tYears, body.phase);
      body.x = x;
      body.z = z;
    }
    return body;
  }

  /**
   * Reconcile the engine with an edited system WITHOUT resetting the running
   * simulation. Existing planets (matched by id) keep their integration state
   * and just take updated orbital params; new planets are seeded at the
   * current time; removed planets are dropped. Star edits rebuild the star set.
   * tYears is preserved throughout, so editing stays smooth.
   */
  reconcile(system: StarSystem) {
    const list = system.stars && system.stars.length ? system.stars : [system.star];
    if (list.length === this.stars.length) {
      list.forEach((s, i) => {
        const b = this.stars[i];
        b.massSOL = s.massSOL;
        b.lum = s.luminositySOL;
        b.colorHex = s.colorHex;
        b.radiusSOL = s.radiusSOL;
        b.name = s.name;
        b.orbitR = s.orbitRadiusAU ?? 0;
        b.phase = s.orbitPhase ?? 0;
        b.omega = s.orbitPeriodYears ? (2 * Math.PI) / s.orbitPeriodYears : 0;
      });
      this.updateStarPositions();
    }
    // (multi-ness change from a star add/remove is out of scope for editing; the
    //  dev route remounts on Generate, which reconstructs the engine fresh.)

    const byId = new Map(this.planets.map((b) => [b.id, b]));
    this.planets = system.planets.map((p, i) => {
      const id = p.id ?? `idx-${i}`;
      const existing = byId.get(id);
      if (existing) {
        existing.sma = p.semiMajorAxisAU;
        existing.e = p.eccentricity;
        existing.period = p.orbitalPeriodYears;
        return existing;
      }
      return this.makeBody(p, i);
    });
  }

  private updateStarPositions() {
    for (const s of this.stars) {
      if (s.orbitR <= 0) {
        s.x = 0;
        s.z = 0;
      } else {
        const a = s.phase + s.omega * this.tYears;
        s.x = Math.cos(a) * s.orbitR;
        s.z = Math.sin(a) * s.orbitR;
      }
    }
  }

  /** Shell-theorem circular seed: v_circ from the mass interior to the planet's radius. */
  private seedPlanet(p: PlanetBody) {
    const r = p.sma;
    let gmInterior = 0;
    for (const s of this.stars) if (Math.hypot(s.x, s.z) < r) gmInterior += G * s.massSOL;
    if (gmInterior <= 0) gmInterior = G * this.stars[0].massSOL;
    const vc = Math.sqrt(gmInterior / r);
    const sign = p.retro ? -1 : 1;
    p.x = Math.cos(p.phase) * r;
    p.z = Math.sin(p.phase) * r;
    p.vx = -Math.sin(p.phase) * vc * sign;
    p.vz = Math.cos(p.phase) * vc * sign;
  }

  private accel(px: number, pz: number): [number, number] {
    let ax = 0;
    let az = 0;
    for (const s of this.stars) {
      const dx = s.x - px;
      const dz = s.z - pz;
      const d2 = dx * dx + dz * dz + SOFT2;
      const inv = (G * s.massSOL) / (d2 * Math.sqrt(d2));
      ax += inv * dx;
      az += inv * dz;
    }
    return [ax, az];
  }

  /** Advance the simulation by dtYears. */
  step(dtYears: number) {
    if (dtYears <= 0) return;
    this.tYears += dtYears;
    this.updateStarPositions();

    if (!this.multi) {
      for (const p of this.planets) {
        const [x, z] = keplerPosAU(p.sma, p.e, p.period, this.tYears, p.phase);
        p.x = x;
        p.z = z;
      }
      return;
    }

    // Adaptive substeps: cap at ~2% of the shortest orbital period.
    let minPeriod = Infinity;
    for (const p of this.planets) minPeriod = Math.min(minPeriod, p.period);
    const maxSub = Math.max(1e-4, 0.02 * minPeriod);
    const nSteps = Math.max(1, Math.ceil(dtYears / maxSub));
    const h = dtYears / nSteps;

    for (const p of this.planets) {
      let [ax0, az0] = this.accel(p.x, p.z);
      for (let s = 0; s < nSteps; s++) {
        p.x += p.vx * h + 0.5 * ax0 * h * h;
        p.z += p.vz * h + 0.5 * az0 * h * h;
        const [ax1, az1] = this.accel(p.x, p.z);
        p.vx += 0.5 * (ax0 + ax1) * h;
        p.vz += 0.5 * (az0 + az1) * h;
        ax0 = ax1;
        az0 = az1;
      }
      // Ejection guard: if unbound or flung far, re-seed a circular orbit.
      const v2 = p.vx * p.vx + p.vz * p.vz;
      let vEsc2 = 0;
      for (const st of this.stars) {
        const d = Math.hypot(p.x - st.x, p.z - st.z);
        if (d > 0.05) vEsc2 += (2 * G * st.massSOL) / d;
      }
      if (v2 > vEsc2 * 2.5 || Math.hypot(p.x, p.z) > this.outerStableR) {
        p.ejections++;
        this.seedPlanet(p);
      }
    }
  }

  /** Current planet positions in AU (x,z). */
  planetPositionsAU(): [number, number][] {
    return this.planets.map((p) => [p.x, p.z]);
  }

  /** Current star positions in AU (x,z). */
  starPositionsAU(): [number, number][] {
    return this.stars.map((s) => [s.x, s.z]);
  }

  /**
   * Instantaneous specific orbital energy of each planet (KE + PE per unit
   * mass) in the current star field. For a static potential (single fixed
   * star) this is conserved; with moving stars it varies slightly by design.
   * Used by tests to check the integrator doesn't drift/blow up.
   */
  planetEnergies(): number[] {
    return this.planets.map((p) => {
      const ke = 0.5 * (p.vx * p.vx + p.vz * p.vz);
      let pe = 0;
      for (const s of this.stars) {
        const d = Math.hypot(p.x - s.x, p.z - s.z);
        if (d > 0.01) pe -= (G * s.massSOL) / d;
      }
      return ke + pe;
    });
  }
}
