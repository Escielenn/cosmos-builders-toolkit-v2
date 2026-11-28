// ---------------------------------------------------------------------------
// exosky-projection, putting the sky on a screen the right way round (1.9, E1 / E17).
//
// The sky is seen from INSIDE the sphere. Facing a direction v with "up" u
// (toward the frame's pole or the zenith), screen-right is v x u. In the
// equatorial frame that puts east on the LEFT when facing south, as on every
// star chart and in the real sky. 1.8 used u x v's opposite (screen-right =
// +RA), the view from outside the sphere: every constellation was mirrored
// (Aldebaran drawn to Orion's left). The orientation test
// (src/lib/__tests__/exosky-orientation.test.ts) pins this.
//
// Projection is stereographic, which is conformal (constellations keep their
// shapes) and stays usable to a 180° field. 1.8 was gnomonic up to 160°,
// where it stretches the edges past recognition. At small fields the two
// are indistinguishable.
//
// One camera for the screen and the printed chart, so they cannot disagree.
// ---------------------------------------------------------------------------

import { DEG, cross3, fromFrame, norm3, type Frame3, type Vec3 } from "@/lib/simulators/astro";

export const FOV_MIN = 0.5;
export const FOV_MAX = 180;

export interface Camera {
  v: Vec3;
  u: Vec3;
  r: Vec3;
  scale: number;
  cx: number;
  cy: number;
  W: number;
  H: number;
  /** Last projected point, written by projectInto. */
  x: number;
  y: number;
}

/**
 * A camera looking along display-frame (lon, lat) with a horizontal field of
 * `fovDeg` over a W x H screen. Up is d(view)/d(lat), defined everywhere,
 * including straight up at the zenith (where it is the frame's +x: north).
 */
export function makeCamera(frame: Frame3, lonDeg: number, latDeg: number, fovDeg: number, W: number, H: number): Camera {
  const lat = Math.max(-90, Math.min(90, latDeg)) * DEG;
  const lon = lonDeg * DEG;
  const vd: Vec3 = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const ud: Vec3 = [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];
  const v = norm3(fromFrame(frame, vd));
  const u = norm3(fromFrame(frame, ud));
  const r = norm3(cross3(v, u));
  const fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fovDeg)) * DEG;
  const scale = W / (4 * Math.tan(fov / 4));
  return { v, u, r, scale, cx: W / 2, cy: H / 2, W, H, x: 0, y: 0 };
}

/**
 * Project a unit vector; writes cam.x / cam.y. False when it is behind the
 * observer (more than ~165° from the view centre) or further than `margin`
 * pixels off screen.
 */
export function projectInto(cam: Camera, sx: number, sy: number, sz: number, margin = 80): boolean {
  const z = sx * cam.v[0] + sy * cam.v[1] + sz * cam.v[2];
  if (z < -0.966) return false;
  const k = 2 / (1 + z);
  const px = cam.cx + k * (sx * cam.r[0] + sy * cam.r[1] + sz * cam.r[2]) * cam.scale;
  const py = cam.cy - k * (sx * cam.u[0] + sy * cam.u[1] + sz * cam.u[2]) * cam.scale;
  if (px < -margin || px > cam.W + margin || py < -margin || py > cam.H + margin) return false;
  cam.x = px;
  cam.y = py;
  return true;
}

export function project(cam: Camera, s: Vec3, margin = 80): { x: number; y: number } | null {
  return projectInto(cam, s[0], s[1], s[2], margin) ? { x: cam.x, y: cam.y } : null;
}

/** The J2000 direction under a screen point (inverse stereographic). */
export function unproject(cam: Camera, px: number, py: number): Vec3 {
  const X = (px - cam.cx) / cam.scale;
  const Y = -(py - cam.cy) / cam.scale;
  const rho2 = X * X + Y * Y;
  const den = 4 + rho2;
  const dr = (4 * X) / den, du = (4 * Y) / den, dv = (4 - rho2) / den;
  return norm3([
    dr * cam.r[0] + du * cam.u[0] + dv * cam.v[0],
    dr * cam.r[1] + du * cam.u[1] + dv * cam.v[1],
    dr * cam.r[2] + du * cam.u[2] + dv * cam.v[2],
  ]);
}

/** Pixels per degree at the centre of the view (for sizing discs). */
export function pixelsPerDegree(cam: Camera): number {
  return cam.scale * DEG;
}

/**
 * Zoom by a factor (multiplicative, E17): a wheel notch or a key press
 * multiplies the field by 1.15 or 1/1.15, so zooming feels the same at 0.5°
 * as at 120°. 1.8 added a flat 5° per notch.
 */
export function zoomFov(fov: number, factor: number): number {
  return Math.max(FOV_MIN, Math.min(FOV_MAX, fov * factor));
}
