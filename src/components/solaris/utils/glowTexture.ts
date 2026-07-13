import * as THREE from "three";

/**
 * A soft radial-gradient sprite texture (opaque white center → transparent
 * edge). Sprites with no map draw as a hard square; mapping this fixes the
 * star's glow so it reads as a soft disc. Built once and cached.
 */
let cached: THREE.CanvasTexture | null = null;

export function getGlowTexture(): THREE.CanvasTexture {
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0.0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.6)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  cached = new THREE.CanvasTexture(canvas);
  cached.needsUpdate = true;
  return cached;
}
