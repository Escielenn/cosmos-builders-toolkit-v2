// Territory Geometry Utilities
// StellarForge.tools — Stellar Cartographer
//
// Empire territories are rendered as circles ("sphere of influence" around
// each empire's center), but star ownership (findOwningEmpire in the main
// component) assigns every point in space to at most one empire — whichever
// claimed circle contains it and is nearest. That makes the true shape of a
// territory the empire's circle intersected with the half-plane closer to it
// than to every other empire (a standard, unweighted Voronoi cell), not the
// raw unclipped circle. Drawing raw circles lets two territories' borders
// visually cross even though the underlying ownership model never assigns a
// point to two empires at once — this module produces the clipped polygon
// so the rendered border matches the ownership model.

export interface Point2D {
  x: number;
  y: number;
}

/** Approximates a circle as a closed polygon of `segments` points. */
export function buildCirclePolygon(cx: number, cy: number, r: number, segments = 64): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

/**
 * Clips a convex polygon to the half-plane of points at least as close to
 * `keep` as to `other` (Sutherland–Hodgman, single clip edge = the
 * perpendicular bisector of `keep` and `other`). Mirrors the nearest-center
 * tie-break used by findOwningEmpire.
 */
export function clipPolygonByBisector(polygon: Point2D[], keep: Point2D, other: Point2D): Point2D[] {
  if (polygon.length === 0) return polygon;

  const nx = other.x - keep.x;
  const ny = other.y - keep.y;
  // Points p with p·n <= c are at least as close to `keep` as to `other`.
  const c = (other.x * other.x + other.y * other.y - keep.x * keep.x - keep.y * keep.y) / 2;
  const inside = (p: Point2D) => p.x * nx + p.y * ny <= c;

  const result: Point2D[] = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const curr = polygon[i];
    const prev = polygon[(i - 1 + n) % n];
    const currIn = inside(curr);
    const prevIn = inside(prev);

    if (currIn !== prevIn) {
      const da = prev.x * nx + prev.y * ny - c;
      const db = curr.x * nx + curr.y * ny - c;
      const t = da / (da - db);
      result.push({ x: prev.x + (curr.x - prev.x) * t, y: prev.y + (curr.y - prev.y) * t });
    }
    if (currIn) result.push(curr);
  }
  return result;
}

/**
 * Builds a circle of radius `r` around `centers[index]` and clips it against
 * every other center's nearer half-plane, producing the polygon that
 * matches findOwningEmpire's ownership rule for that empire at that radius.
 * `centers` and the returned points share whatever coordinate space the
 * caller passes in (world space or already-projected screen space).
 */
export function getClippedTerritoryPolygon(
  centers: Point2D[],
  index: number,
  r: number,
  segments = 64
): Point2D[] {
  const self = centers[index];
  let poly = buildCirclePolygon(self.x, self.y, r, segments);
  for (let j = 0; j < centers.length; j++) {
    if (j === index) continue;
    poly = clipPolygonByBisector(poly, self, centers[j]);
    if (poly.length === 0) break;
  }
  return poly;
}
