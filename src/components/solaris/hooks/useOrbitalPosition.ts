import { auToScene } from "../utils/scaleAU";

/**
 * Keplerian orbital position calculation.
 * Returns [x, z] in scene coordinates (orbits in XZ plane, Y=0).
 */
export function keplerPosition(
  semiMajorAxisAU: number,
  eccentricity: number,
  periodYears: number,
  simulationTimeYears: number,
  phaseOffsetRad: number = 0
): [number, number] {
  if (periodYears <= 0) return [auToScene(semiMajorAxisAU), 0];

  const meanAnomaly =
    ((2 * Math.PI * simulationTimeYears) / periodYears) + phaseOffsetRad;

  // Solve Kepler's equation via Newton-Raphson (5 iterations)
  let E = meanAnomaly;
  for (let i = 0; i < 5; i++) {
    E =
      E -
      (E - eccentricity * Math.sin(E) - meanAnomaly) /
        (1 - eccentricity * Math.cos(E));
  }

  const trueAnomaly =
    2 *
    Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );

  const r = semiMajorAxisAU * (1 - eccentricity * Math.cos(E));

  return [
    auToScene(r * Math.cos(trueAnomaly)),
    auToScene(r * Math.sin(trueAnomaly)),
  ];
}

/** Golden-ratio-based phase offset to avoid planet alignment at t=0. */
export function phaseForIndex(index: number): number {
  return index * 2.399963;
}
