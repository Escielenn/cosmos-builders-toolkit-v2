// ---------------------------------------------------------------------------
// exosky-galaxy, the Milky Way model behind ExoSky's band and its "nearest
// arm" readout (1.9, E7).
//
// Spiral arms: Reid et al. (2019), ApJ 885, 131, "Trigonometric Parallaxes of
// High-mass Star-forming Regions: Our View of the Milky Way", Table 2. Each
// arm is a log-periodic spiral with a kink:
//     ln(R / R_kink) = -(β - β_kink) tan ψ
// with β the Galactocentric azimuth measured from the Sun toward Galactic
// rotation, ψ = ψ< for β < β_kink and ψ> beyond. Reid adopts R0 = 8.15 kpc;
// radii here are scaled to astro.ts's R_SUN so the Sun keeps its place
// relative to the arms (it sits just inside the Local Arm, as it should).
//
// The 1.8 model had four symmetric arms and no Local (Orion) Arm, so every
// nearby vantage was told its nearest arm was ~1.9 kpc away. Reid's arms
// cover only the azimuths where masers were measured; beyond those ranges
// they are extrapolated by `ARM_EXTRAPOLATE_DEG` and the readout says so.
//
// The map is indexed by true galactic (l, b) of a viewing direction. Galactic
// axes are directions, the same from anywhere, so the renderer looks up a
// pixel by converting its direction to (l, b) and nothing else. (1.8 indexed
// by an observer-relative longitude with the opposite handedness to the
// lookup, which mirrored the band's structure in longitude.)
//
// Pure: used on the main thread and by exosky-mw.worker.ts.
// ---------------------------------------------------------------------------

import {
  R_SUN,
  DISK_SCALE_H,
  DISK_SCALE_Z,
  DUST_SCALE_Z,
  BULGE_RADIUS,
  DEG,
  eqXYZtoGalactocentric,
  type Vec3,
} from "@/lib/simulators/astro";

export interface SpiralArm {
  name: string;
  betaMin: number;
  betaMax: number;
  betaKink: number;
  rKinkKpc: number;
  psiInner: number;
  psiOuter: number;
  widthKpc: number;
}

/** Reid et al. 2019, Table 2. Angles in degrees, radii in kpc at R0 = 8.15. */
export const REID_2019_ARMS: readonly SpiralArm[] = [
  { name: "3-kpc Arm", betaMin: 15, betaMax: 18, betaKink: 15, rKinkKpc: 3.52, psiInner: -4.2, psiOuter: -4.2, widthKpc: 0.18 },
  { name: "Norma Arm", betaMin: 5, betaMax: 54, betaKink: 18, rKinkKpc: 4.46, psiInner: -1.0, psiOuter: 19.5, widthKpc: 0.14 },
  { name: "Scutum-Centaurus Arm", betaMin: 0, betaMax: 104, betaKink: 23, rKinkKpc: 4.91, psiInner: 14.1, psiOuter: 12.1, widthKpc: 0.23 },
  { name: "Sagittarius-Carina Arm", betaMin: 2, betaMax: 97, betaKink: 24, rKinkKpc: 6.04, psiInner: 17.1, psiOuter: 1.0, widthKpc: 0.27 },
  { name: "Local Arm", betaMin: -8, betaMax: 34, betaKink: 9, rKinkKpc: 8.26, psiInner: 11.4, psiOuter: 11.4, widthKpc: 0.31 },
  { name: "Perseus Arm", betaMin: -23, betaMax: 115, betaKink: 40, rKinkKpc: 8.87, psiInner: 10.3, psiOuter: 8.7, widthKpc: 0.35 },
  { name: "Outer Arm", betaMin: -16, betaMax: 71, betaKink: 18, rKinkKpc: 12.24, psiInner: 3.0, psiOuter: 9.4, widthKpc: 0.65 },
];

const REID_R0_KPC = 8.15;
/** How far past Reid's measured azimuths an arm is extended, degrees. */
export const ARM_EXTRAPOLATE_DEG = 60;
const SCALE = R_SUN / 1000 / REID_R0_KPC;

/** Galactocentric radius (pc) of an arm at azimuth β (deg). */
export function armRadiusPc(arm: SpiralArm, betaDeg: number): number {
  const psi = (betaDeg < arm.betaKink ? arm.psiInner : arm.psiOuter) * DEG;
  return arm.rKinkKpc * Math.exp(-(betaDeg - arm.betaKink) * DEG * Math.tan(psi)) * 1000 * SCALE;
}

/**
 * Galactocentric (x, y) of the arm at azimuth β. astro.ts's frame has the Sun
 * at (+R_SUN, 0) and Galactic rotation toward -y there, so β (toward
 * rotation) maps to angle -β.
 */
function armPoint(arm: SpiralArm, betaDeg: number): [number, number] {
  const r = armRadiusPc(arm, betaDeg);
  return [r * Math.cos(-betaDeg * DEG), r * Math.sin(-betaDeg * DEG)];
}

interface ArmTrace {
  arm: SpiralArm;
  pts: Float64Array;
  /** Per point: 1 inside Reid's measured range, 0 extrapolated. */
  measured: Uint8Array;
}

let traces: ArmTrace[] | null = null;
function armTraces(): ArmTrace[] {
  if (traces) return traces;
  traces = REID_2019_ARMS.map((arm) => {
    const lo = arm.betaMin - ARM_EXTRAPOLATE_DEG;
    const hi = arm.betaMax + ARM_EXTRAPOLATE_DEG;
    const n = Math.ceil(hi - lo) + 1;
    const pts = new Float64Array(n * 2);
    const measured = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      const b = lo + k;
      const [x, y] = armPoint(arm, b);
      pts[2 * k] = x;
      pts[2 * k + 1] = y;
      measured[k] = b >= arm.betaMin && b <= arm.betaMax ? 1 : 0;
    }
    return { arm, pts, measured };
  });
  return traces;
}

export interface NearestArm {
  name: string;
  /** In-plane distance from the observer to the arm's centreline, pc. */
  distancePc: number;
  /** Half the arm's width, pc: inside this the observer is "in" the arm. */
  halfWidthPc: number;
  inArm: boolean;
  /** False when the nearest stretch is extrapolated beyond Reid's data. */
  measured: boolean;
}

/** The arm whose centreline passes closest to a galactocentric point. */
export function nearestArm(gcX: number, gcY: number): NearestArm {
  let best: NearestArm = { name: "Inter-arm region", distancePc: Infinity, halfWidthPc: 0, inArm: false, measured: false };
  for (const t of armTraces()) {
    for (let k = 0; k < t.measured.length; k++) {
      const d = Math.hypot(t.pts[2 * k] - gcX, t.pts[2 * k + 1] - gcY);
      if (d < best.distancePc) {
        const half = (t.arm.widthKpc * 1000 * SCALE) / 2;
        best = { name: t.arm.name, distancePc: d, halfWidthPc: half, inArm: d <= half, measured: t.measured[k] === 1 };
      }
    }
  }
  return best;
}

/** Nearest arm to an observer given their heliocentric equatorial position (pc). */
export function nearestArmForObserver(eqPos: Vec3): NearestArm & { gc: Vec3 } {
  const gc = eqXYZtoGalactocentric(eqPos[0], eqPos[1], eqPos[2]);
  return { ...nearestArm(gc[0], gc[1]), gc };
}

/** A one-line arm note derived from the model, never typed by hand. */
export function armNote(a: NearestArm): string {
  const where = a.inArm ? `Inside the ${a.name}` : `${Math.round(a.distancePc)} pc from the ${a.name}`;
  return a.measured ? where : `${where} (arm extrapolated beyond measured masers)`;
}

// ---------------------------------------------------------------------------
// Density and the band
// ---------------------------------------------------------------------------

function armEnhancement(gcX: number, gcY: number): number {
  const a = nearestArm(gcX, gcY);
  const w = Math.max(150, a.halfWidthPc * 2);
  return 1 + 2.5 * Math.exp(-(a.distancePc * a.distancePc) / (2 * w * w));
}

/** Stellar luminosity density (arbitrary units): disc x arms + bulge. */
export function galacticDensity(gcX: number, gcY: number, gcZ: number): number {
  const R = Math.hypot(gcX, gcY);
  let d = Math.exp(-R / DISK_SCALE_H) * Math.exp(-Math.abs(gcZ) / DISK_SCALE_Z);
  d *= armEnhancement(gcX, gcY);
  const bulgeR = Math.sqrt(R * R + gcZ * gcZ * 4);
  d += 3.0 * Math.exp(-(bulgeR * bulgeR) / (BULGE_RADIUS * BULGE_RADIUS));
  return d;
}

export function dustDensity(gcX: number, gcY: number, gcZ: number): number {
  const R = Math.hypot(gcX, gcY);
  return Math.exp(-R / (DISK_SCALE_H * 1.2)) * Math.exp(-Math.abs(gcZ) / DUST_SCALE_Z) * 0.5;
}

export const L_STEPS = 360;
export const B_STEPS = 180;
const RAY_STEPS = 48;
const RAY_MAX = 15000;

export interface MilkyWayMap {
  brightness: Float32Array;
  dust: Float32Array;
}

/**
 * Ray-march the band from an observer at galactocentric (x, y, z), for every
 * galactic (l, b) on a 1° grid. Index: li * B_STEPS + bi, l = li°, b = bi - 90 + 0.5.
 *
 * The arm lookup is cached per ray step on a coarse grid so the march stays
 * inside a worker's budget.
 */
export function computeMilkyWayMap(ox: number, oy: number, oz: number): MilkyWayMap {
  const brightness = new Float32Array(L_STEPS * B_STEPS);
  const dust = new Float32Array(L_STEPS * B_STEPS);
  const armCache = new Map<number, number>();
  const armAt = (x: number, y: number) => {
    const key = Math.round(x / 100) * 100003 + Math.round(y / 100);
    let v = armCache.get(key);
    if (v === undefined) {
      v = armEnhancement(Math.round(x / 100) * 100, Math.round(y / 100) * 100);
      armCache.set(key, v);
    }
    return v;
  };
  const dt = RAY_MAX / RAY_STEPS;
  for (let li = 0; li < L_STEPS; li++) {
    const l = (li + 0.5) * DEG;
    for (let bi = 0; bi < B_STEPS; bi++) {
      const b = (bi + 0.5 - 90) * DEG;
      // Sun-centred galactic axes -> galactocentric frame: (-gx, -gy, gz).
      const dx = -Math.cos(b) * Math.cos(l);
      const dy = -Math.cos(b) * Math.sin(l);
      const dz = Math.sin(b);
      let bright = 0;
      let cum = 0;
      for (let s = 1; s <= RAY_STEPS; s++) {
        const t = s * dt;
        const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
        const R = Math.hypot(px, py);
        if (R > 20000 || Math.abs(pz) > 5000) continue;
        let d = Math.exp(-R / DISK_SCALE_H) * Math.exp(-Math.abs(pz) / DISK_SCALE_Z) * armAt(px, py);
        const bulgeR = Math.sqrt(R * R + pz * pz * 4);
        d += 3.0 * Math.exp(-(bulgeR * bulgeR) / (BULGE_RADIUS * BULGE_RADIUS));
        cum += dustDensity(px, py, pz) * dt * 0.0001;
        bright += d * Math.exp(-cum) * dt * 0.00004;
      }
      brightness[li * B_STEPS + bi] = Math.min(bright, 1);
      dust[li * B_STEPS + bi] = Math.min(cum, 1);
    }
  }
  return { brightness, dust };
}

/** Bilinear sample at galactic (l, b) in radians. */
export function sampleMilkyWay(map: Float32Array, lRad: number, bRad: number): number {
  const lDeg = ((lRad / DEG) % 360 + 360) % 360;
  const bDeg = bRad / DEG;
  const lf = lDeg - 0.5;
  const bf = bDeg + 90 - 0.5;
  const l0 = ((Math.floor(lf) % L_STEPS) + L_STEPS) % L_STEPS;
  const l1 = (l0 + 1) % L_STEPS;
  const b0 = Math.max(0, Math.min(B_STEPS - 1, Math.floor(bf)));
  const b1 = Math.min(B_STEPS - 1, b0 + 1);
  const lt = lf - Math.floor(lf);
  const bt = Math.max(0, Math.min(1, bf - Math.floor(bf)));
  return (
    map[l0 * B_STEPS + b0] * (1 - lt) * (1 - bt) +
    map[l1 * B_STEPS + b0] * lt * (1 - bt) +
    map[l0 * B_STEPS + b1] * (1 - lt) * bt +
    map[l1 * B_STEPS + b1] * lt * bt
  );
}
