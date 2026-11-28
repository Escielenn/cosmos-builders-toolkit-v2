// ---------------------------------------------------------------------------
// exosky-chart, a printable star chart of the sky ExoSky is showing (1.9, N10).
//
// Two layouts, both oriented as a chart is held:
//   - "horizon": the whole sky from one place and moment, zenith at the
//     centre, horizon at the rim, north at the top and EAST ON THE LEFT
//     (hold it overhead and it matches the sky).
//   - "pole": the planet's sky centred on its visible celestial pole, down
//     to the equator, for a writer who wants the star lore not the night.
// Both use the screen's own camera (exosky-projection.ts), so the chart and
// the simulator cannot disagree about which way round the sky is. The test
// checks east-left on the horizon chart.
//
// Ink on white (palettes/exosky.ts PRINT). Pure string output.
// ---------------------------------------------------------------------------

import { DEG, type Frame3, type Vec3 } from "@/lib/simulators/astro";
import { makeCamera, projectInto, type Camera } from "@/lib/simulators/exosky-projection";
import { PRINT } from "@/lib/palettes/exosky";

export interface ChartStar {
  dir: Vec3;
  mag: number;
  label?: string | null;
  isSol?: boolean;
}

export interface ChartInput {
  layout: "horizon" | "pole";
  /** horizon: the horizon frame [north, west, zenith]; pole: the planet's equatorial frame. */
  frame: Frame3;
  /** For layout "pole": which pole is at the centre. */
  south?: boolean;
  stars: ChartStar[];
  lines: Array<{ a: Vec3; b: Vec3; colour?: string }>;
  bodies: Array<{ dir: Vec3; label: string; mag: number }>;
  title: string;
  subtitle: string;
  credit: string;
  magLimit?: number;
}

const SIZE = 1000;
const R = 440;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Camera that maps the 180° hemisphere onto a circle of radius R. */
function chartCamera(input: ChartInput): Camera {
  // Stereographic 180° field: horizontal half-width = 2 tan(45°) x scale.
  const cam = input.layout === "horizon"
    ? makeCamera(input.frame, 180, 90, 180, SIZE, SIZE)
    : makeCamera(input.frame, 0, input.south ? -90 : 90, 180, SIZE, SIZE);
  cam.scale = R / 2;
  return cam;
}

export function buildStarChartSvg(input: ChartInput): string {
  const cam = chartCamera(input);
  const magLimit = input.magLimit ?? 5.5;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE + 120}" width="${SIZE}" height="${SIZE + 120}" font-family="DM Sans, Helvetica, Arial, sans-serif">`);
  out.push(`<rect width="100%" height="100%" fill="${PRINT.paper}"/>`);
  out.push(`<text x="${SIZE / 2}" y="40" text-anchor="middle" font-size="26" fill="${PRINT.ink}">${esc(input.title)}</text>`);
  out.push(`<text x="${SIZE / 2}" y="68" text-anchor="middle" font-size="15" fill="${PRINT.inkSoft}">${esc(input.subtitle)}</text>`);
  const cy = SIZE / 2 + 30;
  const dy = cy - cam.cy;
  out.push(`<g transform="translate(0 ${dy})">`);
  out.push(`<circle cx="${cam.cx}" cy="${cam.cy}" r="${R}" fill="none" stroke="${PRINT.horizon}" stroke-width="2"/>`);
  // Altitude / declination rings every 30°.
  for (const a of [30, 60]) {
    const rr = (R / 2) * 2 * Math.tan(((90 - a) * DEG) / 2);
    out.push(`<circle cx="${cam.cx}" cy="${cam.cy}" r="${rr.toFixed(1)}" fill="none" stroke="${PRINT.grid}" stroke-width="1" stroke-dasharray="4 6"/>`);
  }
  out.push(`<clipPath id="sky"><circle cx="${cam.cx}" cy="${cam.cy}" r="${R}"/></clipPath><g clip-path="url(#sky)">`);
  for (const l of input.lines) {
    if (!projectInto(cam, l.a[0], l.a[1], l.a[2], 0)) continue;
    const ax = cam.x, ay = cam.y;
    if (!projectInto(cam, l.b[0], l.b[1], l.b[2], 0)) continue;
    out.push(`<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${cam.x.toFixed(1)}" y2="${cam.y.toFixed(1)}" stroke="${l.colour ?? PRINT.line}" stroke-width="1.4"/>`);
  }
  const labels: string[] = [];
  for (const s of input.stars) {
    if (s.mag > magLimit) continue;
    if (!projectInto(cam, s.dir[0], s.dir[1], s.dir[2], 0)) continue;
    if (Math.hypot(cam.x - cam.cx, cam.y - cam.cy) > R) continue;
    const rad = Math.max(0.8, 5.2 - 0.85 * s.mag);
    out.push(`<circle cx="${cam.x.toFixed(1)}" cy="${cam.y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${s.isSol ? PRINT.sol : PRINT.ink}"/>`);
    if (s.label && (s.mag < 2.2 || s.isSol)) {
      labels.push(`<text x="${(cam.x + rad + 3).toFixed(1)}" y="${(cam.y + 4).toFixed(1)}" font-size="13" fill="${s.isSol ? PRINT.sol : PRINT.inkSoft}">${esc(s.label)}</text>`);
    }
  }
  for (const b of input.bodies) {
    if (!projectInto(cam, b.dir[0], b.dir[1], b.dir[2], 0)) continue;
    if (Math.hypot(cam.x - cam.cx, cam.y - cam.cy) > R) continue;
    out.push(`<circle cx="${cam.x.toFixed(1)}" cy="${cam.y.toFixed(1)}" r="5" fill="none" stroke="${PRINT.body}" stroke-width="1.6"/>`);
    labels.push(`<text x="${(cam.x + 8).toFixed(1)}" y="${(cam.y - 6).toFixed(1)}" font-size="13" fill="${PRINT.body}">${esc(b.label)}</text>`);
  }
  out.push(...labels, "</g>");
  if (input.layout === "horizon") {
    // North at the top, east on the LEFT: the camera already put them there.
    const card: Array<[string, number, number]> = [["N", 0, -1], ["E", -1, 0], ["S", 0, 1], ["W", 1, 0]];
    for (const [t, x, y] of card) {
      out.push(`<text x="${(cam.cx + x * (R + 22)).toFixed(1)}" y="${(cam.cy + y * (R + 22) + 6).toFixed(1)}" text-anchor="middle" font-size="18" fill="${PRINT.ink}">${t}</text>`);
    }
  }
  out.push("</g>");
  out.push(`<text x="${SIZE / 2}" y="${SIZE + 100}" text-anchor="middle" font-size="12" fill="${PRINT.inkSoft}">${esc(input.credit)}</text>`);
  out.push("</svg>");
  return out.join("");
}

/** Where a direction lands on the chart, for tests. */
export function chartPoint(input: Pick<ChartInput, "layout" | "frame" | "south">, dir: Vec3): { x: number; y: number } | null {
  const cam = chartCamera({ ...input, stars: [], lines: [], bodies: [], title: "", subtitle: "", credit: "" });
  return projectInto(cam, dir[0], dir[1], dir[2], 0) ? { x: cam.x, y: cam.y } : null;
}
