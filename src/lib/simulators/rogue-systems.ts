// ---------------------------------------------------------------------------
// rogue-systems, the scenarios ROGUE can disrupt and how their bodies are laid out.
//
// The second half of the Rogue port: nbody.ts moves bodies, this decides where
// they start. Setup is where the remaining physics lives, because an orbit is
// only stable if its initial velocity is right, and a binary only holds together
// if both stars are placed about their shared barycentre.
//
// Real systems with published parameters. TRAPPIST-1's orbits are in hundredths
// of an AU and the Solar System's reach 30, a span of four orders of magnitude,
// which is why slider ranges are derived per system rather than fixed.
//
// Pure by design: no canvas, no DOM, no React.
// ---------------------------------------------------------------------------

import { G, M_JUPITER, M_EARTH, AU_PER_YEAR_TO_KM_S, type Body } from "./nbody";

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

export type StarType = "O" | "B" | "A" | "F" | "G" | "K" | "M";

export const STAR_COLORS: Record<StarType, string> = {
  O: "#aaccff",
  B: "#caddff",
  A: "#f0f0ff",
  F: "#fff8e0",
  G: "#ffd43b",
  K: "#ffaa44",
  M: "#ff6633",
};

/** Spectral class from mass, by the main-sequence boundaries the original used. */
export function starTypeFromMass(m: number): StarType {
  if (m > 16) return "O";
  if (m > 2.1) return "B";
  if (m > 1.4) return "A";
  if (m > 1.04) return "F";
  if (m > 0.8) return "G";
  if (m > 0.45) return "K";
  return "M";
}

export function starColor(type: string): string {
  return STAR_COLORS[type as StarType] ?? STAR_COLORS.G;
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

export interface PlanetDef {
  name: string;
  /** Semi-major axis in AU. */
  a: number;
  /** Mass in solar masses. */
  mass: number;
  type: "rocky" | "gas" | "ice";
  color: string;
  size: number;
  /** Short glyph for compact camera buttons. */
  sym: string;
}

export interface SystemDef {
  name: string;
  starMass: number;
  starType: StarType;
  binary: { mass: number; type: StarType; separation: number } | null;
  planets: PlanetDef[];
  /** Habitable zone bounds in AU, for the overlay. */
  habZone: [number, number];
  defaultZoom: number;
  note: string;
}

export const SYSTEMS: Record<string, SystemDef> = {
  solar: {
    name: "Our Solar System",
    starMass: 1.0,
    starType: "G",
    binary: null,
    planets: [
      { name: "Mercury", a: 0.387, mass: 1.66e-7, type: "rocky", color: "#a0a0a0", size: 0.3, sym: "☿" },
      { name: "Venus", a: 0.723, mass: 2.45e-6, type: "rocky", color: "#e8cda0", size: 0.5, sym: "♀" },
      { name: "Earth", a: 1.0, mass: M_EARTH, type: "rocky", color: "#4a9eff", size: 0.5, sym: "⊕" },
      { name: "Mars", a: 1.524, mass: 3.23e-7, type: "rocky", color: "#c1440e", size: 0.35, sym: "♂" },
      { name: "Jupiter", a: 5.203, mass: 9.55e-4, type: "gas", color: "#c88b3a", size: 1.4, sym: "♃" },
      { name: "Saturn", a: 9.537, mass: 2.86e-4, type: "gas", color: "#e8d08a", size: 1.2, sym: "♄" },
      { name: "Uranus", a: 19.19, mass: 4.37e-5, type: "ice", color: "#7ec8c8", size: 0.8, sym: "⛢" },
      { name: "Neptune", a: 30.07, mass: 5.15e-5, type: "ice", color: "#4466ff", size: 0.8, sym: "♆" },
    ],
    habZone: [0.95, 1.37],
    defaultZoom: 55,
    note: "8 planets, 4.6 billion years old",
  },
  trappist: {
    name: "TRAPPIST-1",
    starMass: 0.0898,
    starType: "M",
    binary: null,
    planets: [
      { name: "T-1b", a: 0.01154, mass: 1.374 * M_EARTH, type: "rocky", color: "#cc6644", size: 0.45, sym: "b" },
      { name: "T-1c", a: 0.0158, mass: 1.308 * M_EARTH, type: "rocky", color: "#cc8855", size: 0.45, sym: "c" },
      { name: "T-1d", a: 0.02227, mass: 0.388 * M_EARTH, type: "rocky", color: "#aa7744", size: 0.35, sym: "d" },
      { name: "T-1e", a: 0.02925, mass: 0.692 * M_EARTH, type: "rocky", color: "#5588cc", size: 0.4, sym: "e" },
      { name: "T-1f", a: 0.03849, mass: 1.039 * M_EARTH, type: "rocky", color: "#4a9eff", size: 0.45, sym: "f" },
      { name: "T-1g", a: 0.04683, mass: 1.321 * M_EARTH, type: "rocky", color: "#6699bb", size: 0.48, sym: "g" },
      { name: "T-1h", a: 0.06189, mass: 0.326 * M_EARTH, type: "rocky", color: "#8899aa", size: 0.3, sym: "h" },
    ],
    habZone: [0.029, 0.046],
    defaultZoom: 3500,
    note: "Ultra-compact, 7 Earth-sized worlds in a resonance chain. 39 light-years away.",
  },
  kepler90: {
    name: "Kepler-90",
    starMass: 1.2,
    starType: "G",
    binary: null,
    planets: [
      { name: "K90b", a: 0.074, mass: 2.0 * M_EARTH, type: "rocky", color: "#aa8866", size: 0.35, sym: "b" },
      { name: "K90c", a: 0.089, mass: 3.0 * M_EARTH, type: "rocky", color: "#bb9977", size: 0.4, sym: "c" },
      { name: "K90i", a: 0.1234, mass: 2.5 * M_EARTH, type: "rocky", color: "#cc8855", size: 0.35, sym: "i" },
      { name: "K90d", a: 0.32, mass: 8.0 * M_EARTH, type: "ice", color: "#7799bb", size: 0.55, sym: "d" },
      { name: "K90e", a: 0.42, mass: 10.0 * M_EARTH, type: "ice", color: "#6688aa", size: 0.6, sym: "e" },
      { name: "K90f", a: 0.48, mass: 12.0 * M_EARTH, type: "ice", color: "#88aacc", size: 0.65, sym: "f" },
      { name: "K90g", a: 0.71, mass: 200 * M_EARTH, type: "gas", color: "#c88b3a", size: 1.3, sym: "g" },
      { name: "K90h", a: 1.01, mass: 200 * M_EARTH, type: "gas", color: "#d4956a", size: 1.3, sym: "h" },
    ],
    habZone: [1.0, 1.5],
    defaultZoom: 180,
    note: "8 planets, the most found in any system besides ours. 2,545 light-years away.",
  },
  proxima: {
    name: "Proxima Centauri",
    starMass: 0.122,
    starType: "M",
    binary: null,
    planets: [
      { name: "Prox d", a: 0.02885, mass: 0.26 * M_EARTH, type: "rocky", color: "#aa8877", size: 0.25, sym: "d" },
      { name: "Prox b", a: 0.0485, mass: 1.07 * M_EARTH, type: "rocky", color: "#5588cc", size: 0.45, sym: "b" },
      { name: "Prox c", a: 1.489, mass: 7.0 * M_EARTH, type: "ice", color: "#7799bb", size: 0.65, sym: "c" },
    ],
    habZone: [0.038, 0.082],
    defaultZoom: 2500,
    note: "The nearest star, 4.24 light-years away. Proxima b sits in the habitable zone.",
  },
  alphacen: {
    name: "Alpha Centauri AB",
    starMass: 1.1,
    starType: "G",
    binary: { mass: 0.907, type: "K", separation: 23 },
    planets: [
      { name: "α Cen Ab*", a: 1.1, mass: 1.5 * M_EARTH, type: "rocky", color: "#5588cc", size: 0.45, sym: "b" },
      { name: "α Cen Ac*", a: 2.0, mass: 5 * M_EARTH, type: "rocky", color: "#88aacc", size: 0.5, sym: "c" },
    ],
    habZone: [1.0, 1.6],
    defaultZoom: 10,
    note: "A binary pair 4.37 light-years away. The planets are hypothetical. Separation about 23 AU.",
  },
};

// ---------------------------------------------------------------------------
// Intruders
// ---------------------------------------------------------------------------

export type IntruderKind = "bh" | "bd" | "rp";

export interface IntruderType {
  name: string;
  /** Unit the mass slider reports in. */
  unit: string;
  min: number;
  max: number;
  color: string;
  /** Solar masses per slider unit. Black holes are already in solar masses. */
  massScale: number;
}

export const INTRUDER_TYPES: Record<IntruderKind, IntruderType> = {
  bh: { name: "Black Hole", unit: "M☉", min: 3, max: 100, color: "#e74c3c", massScale: 1 },
  bd: { name: "Brown Dwarf", unit: "Mⱼ", min: 13, max: 80, color: "#c8553d", massScale: M_JUPITER },
  rp: { name: "Rogue Planet", unit: "Mⱼ", min: 0.5, max: 13, color: "#8b6914", massScale: M_JUPITER },
};

export interface IntruderConfig {
  kind: IntruderKind;
  /** Slider position, 0 to 1, mapped across the type's mass range. */
  massFraction: number;
  /** Impact parameter in AU: how far off-centre the approach is aimed. */
  distanceAU: number;
  /** Approach speed in km/s, the unit a reader recognises. */
  speedKmS: number;
  /** Approach bearing in degrees. */
  angleDeg: number;
}

export interface IntruderMass {
  /** Human label, e.g. "12.0 M☉". */
  display: string;
  /** Mass in solar masses, for the physics. */
  solar: number;
}

/** Slider position to a real mass, in both the display unit and solar masses. */
export function intruderMass(kind: IntruderKind, massFraction: number): IntruderMass {
  const t = INTRUDER_TYPES[kind];
  const clamped = Math.max(0, Math.min(1, massFraction));
  const raw = t.min + clamped * (t.max - t.min);
  return { display: `${raw.toFixed(1)} ${t.unit}`, solar: raw * t.massScale };
}

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

export interface SystemScale {
  maxOrbitAU: number;
  minOrbitAU: number;
  /** Outer reach of the system, used for framing and status. */
  extentAU: number;
  distMin: number;
  distMax: number;
  distDefault: number;
  distStep: number;
  speedMin: number;
  speedMax: number;
  speedDefault: number;
}

/**
 * Control ranges derived from the system's own size.
 *
 * A fixed set of slider bounds cannot serve both TRAPPIST-1, whose planets sit
 * inside 0.07 AU, and the Solar System, which reaches 30. The speed defaults are
 * tied to orbital velocity at the relevant radius, so "fast" means fast compared
 * to the system rather than compared to an arbitrary constant.
 */
export function systemScale(sys: SystemDef): SystemScale {
  const orbits = sys.planets.map((p) => p.a);
  const maxOrbitAU = Math.max(0.1, ...orbits);
  const minOrbitAU = orbits.length ? Math.min(maxOrbitAU, ...orbits) : maxOrbitAU;
  const separation = sys.binary ? sys.binary.separation : 0;
  const extentAU = Math.max(maxOrbitAU, separation * 0.5);

  return {
    maxOrbitAU,
    minOrbitAU,
    extentAU,
    distMin: Math.max(0.005, minOrbitAU * 0.3),
    distMax: Math.max(0.5, extentAU * 3),
    distDefault: Math.max(0.01, maxOrbitAU * 0.4),
    distStep: extentAU < 1 ? 0.005 : 0.1,
    speedMin: 1,
    speedMax: Math.max(
      30,
      Math.round(Math.sqrt((G * sys.starMass) / minOrbitAU) * AU_PER_YEAR_TO_KM_S * 1.5),
    ),
    speedDefault: Math.max(
      3,
      Math.round(Math.sqrt((G * sys.starMass) / maxOrbitAU) * AU_PER_YEAR_TO_KM_S * 0.8),
    ),
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Golden-angle spacing, so planets do not start in a line.
 *
 * 2.39996 radians is roughly 137.5 degrees. Successive multiples never repeat a
 * bearing, which spreads the system out instead of leaving every planet aligned
 * for the intruder to sweep in one pass.
 */
export function orbitalPhase(index: number): number {
  return index * 2.39996 + 0.1;
}

export interface RogueBody extends Body {
  color: string;
  size: number;
  sym?: string;
  starType?: string;
  ptype?: string;
  intruderKind?: IntruderKind;
}

/**
 * Lay out every body for a scenario: stars, planets, and a parked intruder.
 *
 * The binary case is the delicate part. Both stars are placed about their shared
 * barycentre at r = separation * (other mass / total), and each is given the
 * barycentric circular speed sqrt(G * M_total / separation) * (other / total).
 * Placing a companion without also offsetting the primary would leave the pair
 * lurching around a point that is not their centre of mass.
 *
 * Planets in a binary orbit the barycentre using the combined mass, which is the
 * circumbinary approximation the original chose for stability. It is not exact
 * for a wide pair, and it keeps orbits from tearing apart on the first pass.
 */
export function buildBodies(sys: SystemDef, intruder?: IntruderConfig): RogueBody[] {
  const bodies: RogueBody[] = [];

  const primary: RogueBody = {
    name: sys.binary ? "Star A" : "Star",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: sys.starMass,
    color: starColor(sys.starType),
    size: 2,
    isStar: true,
    starType: sys.starType,
  };
  bodies.push(primary);

  if (sys.binary) {
    const sep = sys.binary.separation;
    const total = sys.starMass + sys.binary.mass;
    const rA = (sep * sys.binary.mass) / total;
    const rB = (sep * sys.starMass) / total;
    const vOrbit = Math.sqrt((G * total) / sep);

    primary.x = -rA;
    primary.vy = -vOrbit * (sys.binary.mass / total);

    bodies.push({
      name: "Star B",
      x: rB,
      y: 0,
      vx: 0,
      vy: vOrbit * (sys.starMass / total),
      mass: sys.binary.mass,
      color: starColor(sys.binary.type),
      size: 1.8,
      isStar: true,
      starType: sys.binary.type,
    });
  }

  const centralMass = sys.binary ? sys.starMass + sys.binary.mass : sys.starMass;
  sys.planets.forEach((pd, i) => {
    const angle = orbitalPhase(i);
    const v = Math.sqrt((G * centralMass) / pd.a);
    bodies.push({
      name: pd.name,
      x: pd.a * Math.cos(angle),
      y: pd.a * Math.sin(angle),
      // Perpendicular to the radius, which is what makes the orbit circular
      // rather than a plunge toward the star.
      vx: -v * Math.sin(angle),
      vy: v * Math.cos(angle),
      mass: pd.mass,
      color: pd.color,
      size: pd.size,
      sym: pd.sym,
      a: pd.a,
      ptype: pd.type,
      isPlanet: true,
    });
  });

  if (intruder) bodies.push(buildIntruder(sys, intruder));
  return bodies;
}

/**
 * The intruder, parked off-stage and inactive until launch.
 *
 * Start distance scales with the system so the approach is visible from the
 * default framing in TRAPPIST-1 and in the Solar System alike.
 */
export function buildIntruder(sys: SystemDef, cfg: IntruderConfig): RogueBody {
  const scale = systemScale(sys);
  const mass = intruderMass(cfg.kind, cfg.massFraction);
  const angle = (cfg.angleDeg * Math.PI) / 180;
  const speed = cfg.speedKmS / AU_PER_YEAR_TO_KM_S;
  const startDist = Math.max(
    scale.extentAU * 2.5 + scale.extentAU * 0.5,
    cfg.distanceAU * 4 + scale.extentAU,
  );

  return {
    name: "Intruder",
    x: -startDist * Math.cos(angle),
    // The impact parameter is applied across the approach, which is what turns a
    // head-on collision into a flyby.
    y: -startDist * Math.sin(angle) + cfg.distanceAU,
    vx: speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    mass: mass.solar,
    color: INTRUDER_TYPES[cfg.kind].color,
    size: 1.5,
    isIntruder: true,
    active: false,
    intruderKind: cfg.kind,
  };
}

/** Default intruder settings for a system, matching its scale. */
export function defaultIntruder(sys: SystemDef): IntruderConfig {
  const scale = systemScale(sys);
  return {
    kind: "bh",
    massFraction: 0.15,
    distanceAU: Math.min(scale.distMax, Math.max(scale.distMin, scale.distDefault)),
    speedKmS: Math.min(scale.speedMax, Math.max(scale.speedMin, scale.speedDefault)),
    angleDeg: 0,
  };
}
