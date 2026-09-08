// ---------------------------------------------------------------------------
// bind/system — a star and what orbits it (Brief G3).
//
// 14-RENDER-ENGINE §5: the System scene is the Atlas's middle level and the
// Orrery's renderer. §1: "bind/ is the ONLY place facts become uniforms."
//
// THE RULE, again, because it is the same one the Atlas and the Timeline hold:
// a planet with no orbital distance on file HAS NO ORBIT. It is reported as
// unplaced, not drawn at a plausible radius. An orrery that invents distances
// is a picture of a solar system, not a picture of THIS one, and the writer
// cannot tell which rings they chose.
//
// Everything here is pure: entities in, numbers out, no three.js.
// ---------------------------------------------------------------------------

import type { WorldEntry } from "@/services/world-data";
import { readPublishedFact } from "@/lib/simulators/published-facts";
import { bindPlanet, bindStar, type PlanetBinding, type StarBinding } from "./index";

function num(entry: WorldEntry, predicate: string): number | null {
  const v = readPublishedFact(entry, predicate)?.value;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(/[^\d.eE+-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  const meta = (entry.metadata ?? {}) as Record<string, unknown>;
  const m = meta[predicate.split(".").pop() ?? ""];
  if (typeof m === "number" && Number.isFinite(m)) return m;
  if (typeof m === "string") {
    const n = Number.parseFloat(m.replace(/[^\d.eE+-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export interface OrbitBinding {
  /** Astronomical units. The fact that decides where the ring goes. */
  semiMajorAxisAU: number;
  /** 0 for a circle. Clamped below 1 — a parabolic orbit is not an orbit. */
  eccentricity: number;
  /** Years, when on file. Only used to animate; never invented. */
  periodYears: number | null;
}

export interface BoundBody {
  id: string;
  name: string;
  planet: PlanetBinding;
  orbit: OrbitBinding;
  /** Scene radius for the sphere, already compressed. */
  displayRadius: number;
  /** Scene radius of the orbit's semi-major axis. */
  displayOrbit: number;
}

export interface BoundSystem {
  star: StarBinding;
  starName: string;
  starDisplayRadius: number;
  bodies: BoundBody[];
  /** Named, and listed — never drawn at a guessed distance. */
  unplaced: Array<{ id: string; name: string; reason: string }>;
}

/**
 * AU → scene units, logarithmically.
 *
 * A real system spans two or three orders of magnitude. Drawn linearly, either
 * Mercury is a dot on the star or Neptune is off-screen — and a writer needs
 * to see both at once to reason about their system at all. Log compression
 * keeps the ORDER and the relative gaps legible, which is what the picture is
 * for, while being honest that it is not to scale.
 *
 * The floor is deliberate. A naive `log10(au)` hits zero at 0.1 AU and goes
 * NEGATIVE below it, which would draw a hot Jupiter inside its own star —
 * and close-in worlds are not an edge case here. Tidelock's entire premise is
 * a tidally locked world at 0.02–0.05 AU. So distances clamp to MIN_AU and
 * every orbit lands outside the largest star this scene will draw.
 */
const MIN_AU = 0.01;
const INNER_RADIUS = 1.6;
const PER_DECADE = 2.6;

export function orbitScale(au: number): number {
  if (!Number.isFinite(au) || au <= 0) return 0;
  const clamped = Math.max(au, MIN_AU);
  return INNER_RADIUS + PER_DECADE * (Math.log10(clamped) - Math.log10(MIN_AU));
}

/**
 * Earth radii → scene units, also compressed.
 *
 * Jupiter is 11× Earth. At true relative scale against a compressed orbit
 * field the gas giants swallow their own rings, so radius is compressed
 * harder than distance — the same choice every orrery diagram makes, and the
 * reason none of them claim to be to scale.
 */
export function bodyScale(earthRadii: number): number {
  if (!Number.isFinite(earthRadii) || earthRadii <= 0) return 0.18;
  return 0.18 * earthRadii ** 0.4;
}

/** Position on an ellipse with the star at a focus. Angle in radians. */
export function orbitPosition(
  semiMajorAxis: number,
  eccentricity: number,
  theta: number,
): { x: number; z: number } {
  const e = Math.min(0.95, Math.max(0, eccentricity));
  const b = semiMajorAxis * Math.sqrt(1 - e * e);
  const focus = semiMajorAxis * e;
  return {
    x: Math.cos(theta) * semiMajorAxis - focus,
    z: Math.sin(theta) * b,
  };
}

/**
 * Bind a star and its children into a system.
 *
 * `children` are the entities whose parent is the star or system — the same
 * hierarchy the Atlas zooms through.
 */
export function bindSystem(
  starEntry: WorldEntry,
  children: WorldEntry[],
): BoundSystem {
  const bodies: BoundBody[] = [];
  const unplaced: BoundSystem["unplaced"] = [];

  for (const child of children) {
    const au = num(child, "orbit.semi_major_axis");
    if (au === null || au <= 0) {
      unplaced.push({
        id: child.id,
        name: child.title,
        reason: "No orbital distance on file.",
      });
      continue;
    }

    const planet = bindPlanet(child);
    const eccentricity = num(child, "orbit.eccentricity");
    const radius = planet.radius.value;

    bodies.push({
      id: child.id,
      name: child.title,
      planet,
      orbit: {
        semiMajorAxisAU: au,
        eccentricity:
          eccentricity !== null ? Math.min(0.95, Math.max(0, eccentricity)) : 0,
        periodYears: num(child, "orbit.period"),
      },
      displayRadius: bodyScale(radius),
      displayOrbit: orbitScale(au),
    });
  }

  bodies.sort((a, b) => a.orbit.semiMajorAxisAU - b.orbit.semiMajorAxisAU);
  unplaced.sort((a, b) => a.name.localeCompare(b.name));

  // A star's own radius is in solar radii when stated; the display size is
  // deliberately modest so it does not eat the inner orbits.
  // Capped below INNER_RADIUS so even a giant cannot swallow the closest
  // orbit this scale can produce.
  const solarRadii = num(starEntry, "star.radius");
  const starDisplayRadius =
    solarRadii !== null && solarRadii > 0
      ? Math.min(1.2, 0.55 * solarRadii ** 0.5)
      : 0.55;

  return {
    star: bindStar(starEntry),
    starName: starEntry.title,
    starDisplayRadius,
    bodies,
    unplaced,
  };
}
