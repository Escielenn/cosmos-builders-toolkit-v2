/**
 * RogueCanvas, the orrery view for the native ROGUE rebuild.
 *
 * Canvas 2D, matching the original: this is a top-down plane of orbits, so a 3D
 * pipeline would buy nothing and cost the crisp hairline orbits the look depends
 * on.
 *
 * Physics lives in lib/simulators/nbody.ts and layout in rogue-systems.ts, both
 * tested. This file only draws and handles the camera, so a rendering change can
 * never quietly alter the simulation.
 *
 * Drawing order matters and is deliberate: starfield, grid, habitable zone,
 * orbit guides, trails, then bodies. Everything structural sits behind the
 * things a reader is meant to look at.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { type Body } from "@/lib/simulators/nbody";
import { gridStep, type Camera, type RogueDisplay } from "./rogueView";
import type { TrailSet } from "@/lib/simulators/trail-buffer";
import type { RogueBody } from "@/lib/simulators/rogue-systems";

interface RogueCanvasProps {
  bodies: RogueBody[];
  trails: TrailSet;
  camera: Camera;
  onCameraChange: (next: Camera) => void;
  display: RogueDisplay;
  /** Habitable zone bounds in AU. */
  habZone: [number, number];
  ejected: Set<string>;
  /** Body name to keep centred, or null to stay put. */
  followName: string | null;
  onSelect?: (name: string | null) => void;
  selectedName?: string | null;
  height: number;
}

// ---------------------------------------------------------------------------
// Static starfield
// ---------------------------------------------------------------------------

interface FieldStar {
  x: number;
  y: number;
  brightness: number;
  size: number;
}

/**
 * A fixed field of 500 stars, drawn with parallax at a small fraction of the
 * camera rate so panning reads as motion through space rather than a sliding
 * backdrop. Generated once; regenerating per frame would make it shimmer.
 */
function makeStarField(): FieldStar[] {
  const stars: FieldStar[] = [];
  for (let i = 0; i < 500; i++) {
    const roll = Math.random();
    stars.push({
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 4000 - 2000,
      brightness: Math.random() * 0.3 + 0.05,
      size: roll < 0.07 ? 1.6 : roll < 0.2 ? 1.1 : 0.6,
    });
  }
  return stars;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RogueCanvas({
  bodies,
  trails,
  camera,
  onCameraChange,
  display,
  habZone,
  ejected,
  followName,
  onSelect,
  selectedName,
  height,
}: RogueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starField = useMemo(makeStarField, []);

  // Refs so the draw loop reads current values without re-subscribing each frame.
  const bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;
  const camRef = useRef(camera);
  camRef.current = camera;
  const displayRef = useRef(display);
  displayRef.current = display;
  const ejectedRef = useRef(ejected);
  ejectedRef.current = ejected;
  const selectedRef = useRef(selectedName);
  selectedRef.current = selectedName;
  const habRef = useRef(habZone);
  habRef.current = habZone;
  const followRef = useRef(followName);
  followRef.current = followName;

  // ── Draw ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const point = { x: 0, y: 0 };

    const frame = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cam = camRef.current;
      const d = displayRef.current;
      const list = bodiesRef.current;
      const gone = ejectedRef.current;

      // World to screen. y is flipped so +y is up, as an orbital diagram expects.
      const sx = (wx: number) => w / 2 + (wx - cam.x) * cam.zoom;
      const sy = (wy: number) => h / 2 - (wy - cam.y) * cam.zoom;

      // Simulator canvases run deeper than the site's void.
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, w, h);

      // ── Starfield, parallax at 0.04x ──
      for (const s of starField) {
        const px = (((w / 2 + s.x - cam.x * 0.04 * cam.zoom) % w) + w) % w;
        const py = (((h / 2 + s.y + cam.y * 0.04 * cam.zoom) % h) + h) % h;
        ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Grid, one line per AU while that is legible ──
      if (d.grid) {
        const stepAU = gridStep(cam.zoom);
        ctx.strokeStyle = "rgba(255,255,255,0.045)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const leftAU = cam.x - w / 2 / cam.zoom;
        const rightAU = cam.x + w / 2 / cam.zoom;
        const topAU = cam.y + h / 2 / cam.zoom;
        const botAU = cam.y - h / 2 / cam.zoom;
        for (let gx = Math.ceil(leftAU / stepAU) * stepAU; gx < rightAU; gx += stepAU) {
          ctx.moveTo(sx(gx), 0);
          ctx.lineTo(sx(gx), h);
        }
        for (let gy = Math.ceil(botAU / stepAU) * stepAU; gy < topAU; gy += stepAU) {
          ctx.moveTo(0, sy(gy));
          ctx.lineTo(w, sy(gy));
        }
        ctx.stroke();
      }

      // ── Habitable zone, drawn as a filled annulus ──
      if (d.habitableZone) {
        const [inner, outer] = habRef.current;
        const cx = sx(0);
        const cy = sy(0);
        ctx.fillStyle = "rgba(46,204,113,0.055)";
        ctx.beginPath();
        ctx.arc(cx, cy, outer * cam.zoom, 0, Math.PI * 2);
        ctx.arc(cx, cy, inner * cam.zoom, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.strokeStyle = "rgba(46,204,113,0.22)";
        ctx.lineWidth = 1;
        for (const r of [inner, outer]) {
          ctx.beginPath();
          ctx.arc(cx, cy, r * cam.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── Orbit guides: where each planet started ──
      if (d.orbits) {
        ctx.lineWidth = 1;
        for (const b of list) {
          if (!b.isPlanet || !b.a) continue;
          ctx.strokeStyle = gone.has(b.name)
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.11)";
          ctx.beginPath();
          ctx.arc(sx(0), sy(0), b.a * cam.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── Trails ──
      if (d.trails) {
        for (const b of list) {
          if (b.isIntruder && !b.active) continue;
          const trail = trails.has(b.name) ? trails.for(b.name) : null;
          if (!trail || trail.count < 2) continue;

          // Fade along the path so the head reads as "now". Drawn in a few
          // segments rather than per-point so the stroke count stays small.
          const segments = 6;
          const per = Math.floor(trail.count / segments);
          if (per < 2) continue;
          for (let s = 0; s < segments; s++) {
            const alpha = 0.06 + (0.34 * (s + 1)) / segments;
            ctx.strokeStyle = withAlpha(b.color, gone.has(b.name) ? alpha * 0.4 : alpha);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = s * per; i < Math.min((s + 1) * per + 1, trail.count); i++) {
              trail.get(i, point);
              const px = sx(point.x);
              const py = sy(point.y);
              if (i === s * per) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
        }
      }

      // ── Gravity lines from the intruder to what it is pulling on ──
      if (d.gravityLines) {
        const intruder = list.find((b) => b.isIntruder && b.active);
        if (intruder) {
          for (const b of list) {
            if (b === intruder || b.isIntruder) continue;
            const dist = Math.hypot(b.x - intruder.x, b.y - intruder.y);
            // Only the ones close enough for it to matter, or the screen fills.
            if (dist > 12) continue;
            ctx.strokeStyle = `rgba(231,76,60,${Math.max(0, 0.3 - dist * 0.02)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx(intruder.x), sy(intruder.y));
            ctx.lineTo(sx(b.x), sy(b.y));
            ctx.stroke();
          }
        }
      }

      // ── Bodies ──
      for (const b of list) {
        if (b.isIntruder && !b.active) continue;
        const px = sx(b.x);
        const py = sy(b.y);
        // Off-screen with margin: skip the draw but keep labels for near misses.
        if (px < -80 || px > w + 80 || py < -80 || py > h + 80) continue;

        const isSelected = selectedRef.current === b.name;
        const ejectedHere = gone.has(b.name);

        if (b.isStar) {
          drawStar(ctx, px, py, b, cam.zoom);
        } else if (b.isIntruder) {
          drawIntruder(ctx, px, py, b, cam.zoom);
        } else {
          drawPlanet(ctx, px, py, b, cam.zoom, ejectedHere);
        }

        if (isSelected) {
          ctx.strokeStyle = "rgba(61,255,205,0.8)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, bodyRadius(b, cam.zoom) + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (d.labels) {
          const r = bodyRadius(b, cam.zoom);
          ctx.textAlign = "center";
          ctx.font = '10px "DM Sans", sans-serif';
          ctx.fillStyle = withAlpha(b.color, ejectedHere ? 0.35 : 0.72);
          const glyph = b.isIntruder ? "◉" : b.sym ? `${b.sym} ` : "";
          ctx.fillText(`${glyph}${b.name.toUpperCase()}`, px, py + r + 13);
          if (ejectedHere) {
            ctx.fillStyle = "rgba(46,204,113,0.65)";
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillText("EJECTED", px, py + r + 25);
          }
        }
      }

      // ── Follow ──
      const follow = followRef.current;
      if (follow) {
        const target = list.find((b) => b.name === follow);
        if (target && (target.x !== cam.x || target.y !== cam.y)) {
          // Eased, so a fast body does not jerk the whole view.
          camRef.current = {
            ...cam,
            x: cam.x + (target.x - cam.x) * 0.12,
            y: cam.y + (target.y - cam.y) * 0.12,
          };
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [starField, trails]);

  // ── Pan, zoom, select ───────────────────────────────────────────
  const drag = useRef<{ active: boolean; x: number; y: number; moved: boolean }>({
    active: false,
    x: 0,
    y: 0,
    moved: false,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      const cam = camRef.current;
      onCameraChange({ ...cam, x: cam.x - dx / cam.zoom, y: cam.y + dy / cam.zoom });
    },
    [onCameraChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasDrag = drag.current.moved;
      drag.current.active = false;
      if (wasDrag || !onSelect) return;

      // A click, not a pan: pick the nearest body within a forgiving radius.
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cam = camRef.current;
      const wx = (e.clientX - rect.left - rect.width / 2) / cam.zoom + cam.x;
      const wy = -(e.clientY - rect.top - rect.height / 2) / cam.zoom + cam.y;

      let closest: string | null = null;
      let best = Infinity;
      for (const b of bodiesRef.current) {
        if (b.isIntruder && !b.active) continue;
        const dist = Math.hypot(b.x - wx, b.y - wy);
        // Scale the hit radius with zoom so distant systems stay clickable.
        if (dist < best && dist < 24 / cam.zoom) {
          best = dist;
          closest = b.name;
        }
      }
      onSelect(closest);
    },
    [onSelect],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      // Clamped hard: TRAPPIST-1 needs thousands of px/AU, the Solar System 50.
      onCameraChange({ ...cam, zoom: Math.max(0.5, Math.min(200000, cam.zoom * factor)) });
    },
    [onCameraChange],
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="block w-full cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (drag.current.active = false)}
      onWheel={handleWheel}
      aria-label="Orbital view. Drag to pan, scroll to zoom, click a body to inspect."
    />
  );
}

// ---------------------------------------------------------------------------
// Body drawing
// ---------------------------------------------------------------------------

/** Screen radius. Sub-linear in zoom so bodies stay visible when zoomed out. */
function bodyRadius(b: Body & { size?: number }, zoom: number): number {
  const base = b.size ?? 0.5;
  if (b.isStar) return Math.max(4, Math.min(28, base * 3 + Math.sqrt(zoom) * 0.35));
  return Math.max(2.5, Math.min(16, base * 4 + Math.sqrt(zoom) * 0.12));
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  b: RogueBody,
  zoom: number,
) {
  const r = bodyRadius(b, zoom);
  // Glow first, then the disc, so the disc edge stays crisp.
  const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
  glow.addColorStop(0, withAlpha(b.color, 0.5));
  glow.addColorStop(0.4, withAlpha(b.color, 0.12));
  glow.addColorStop(1, withAlpha(b.color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, r * 5, 0, Math.PI * 2);
  ctx.fill();

  const disc = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
  disc.addColorStop(0, "#ffffff");
  disc.addColorStop(0.45, b.color);
  disc.addColorStop(1, shade(b.color, -60));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  b: RogueBody,
  zoom: number,
  isEjected: boolean,
) {
  const r = bodyRadius(b, zoom);
  const g = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, 0, px, py, r);
  g.addColorStop(0, shade(b.color, 55));
  g.addColorStop(0.6, b.color);
  g.addColorStop(1, shade(b.color, -70));
  ctx.fillStyle = g;
  ctx.globalAlpha = isEjected ? 0.55 : 1;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * The intruder. A black hole gets an accretion ring and a dark centre rather
 * than a lit sphere, because a lit sphere is the one thing it cannot be.
 */
function drawIntruder(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  b: RogueBody,
  zoom: number,
) {
  const r = bodyRadius(b, zoom);

  if (b.intruderKind === "bh") {
    const halo = ctx.createRadialGradient(px, py, r * 0.9, px, py, r * 4);
    halo.addColorStop(0, "rgba(231,76,60,0.55)");
    halo.addColorStop(0.5, "rgba(231,76,60,0.16)");
    halo.addColorStop(1, "rgba(231,76,60,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(px, py, r * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,180,120,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, r * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
  g.addColorStop(0, shade(b.color, 70));
  g.addColorStop(0.7, b.color);
  g.addColorStop(1, shade(b.color, -60));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const rgbCache = new Map<string, [number, number, number]>();

function toRgb(hex: string): [number, number, number] {
  const hit = rgbCache.get(hex);
  if (hit) return hit;
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const rgb: [number, number, number] = Number.isFinite(n)
    ? [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    : [200, 200, 200];
  rgbCache.set(hex, rgb);
  return rgb;
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
}
