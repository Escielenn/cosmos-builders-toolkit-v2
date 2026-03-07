import { useRef, useEffect, useCallback } from "react";
import { SPECTRAL_COLORS } from "@/lib/habitable-zone/data";

interface OrbitalDiagramProps {
  spectralType: string;
  starMass: number;
  innerRecentVenus: number;
  innerRunaway: number;
  outerMaxGreenhouse: number;
  outerEarlyMars: number;
  snowline: number;
  planetDistance: number;
  planetName?: string;
  knownPlanets?: { name: string; distanceAU: number }[];
  /** When true, knownPlanets render with the same cyan glow as the active planet */
  highlightAllPlanets?: boolean;
  className?: string;
}

const VOID_COLOR = "#0D0D0F";
const CYAN = "#00D4FF";
const HZ_GREEN = "rgba(46, 204, 113,";
const SNOWLINE_BLUE = "rgba(173, 216, 230, 0.35)";
const GRID_COLOR = "rgba(255, 255, 255, 0.06)";
const GRID_LABEL_COLOR = "rgba(255, 255, 255, 0.25)";
const LEGEND_BG = "rgba(15, 15, 16, 0.85)";
const LEGEND_BORDER = "rgba(255, 255, 255, 0.08)";

export default function OrbitalDiagram({
  spectralType,
  starMass,
  innerRecentVenus,
  innerRunaway,
  outerMaxGreenhouse,
  outerEarlyMars,
  snowline,
  planetDistance,
  planetName,
  knownPlanets,
  highlightAllPlanets = false,
  className = "",
}: OrbitalDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const minDim = Math.min(w, h);

    // Determine the outermost feature to show
    const maxKnownPlanet = knownPlanets?.length ? Math.max(...knownPlanets.map(p => p.distanceAU)) : 0;
    const maxFeature = Math.max(outerEarlyMars, snowline, planetDistance, maxKnownPlanet) || 1;
    const viewRadius = maxFeature * 1.3; // 30% padding
    const auToPx = (minDim * 0.42 * zoomRef.current) / viewRadius;

    // ─── Background ──────────────────────────────────────────────
    ctx.fillStyle = VOID_COLOR;
    ctx.fillRect(0, 0, w, h);

    // ─── AU Grid Rings ───────────────────────────────────────────
    const auStep = getAUStep(viewRadius / zoomRef.current);
    const maxAU = viewRadius / zoomRef.current * 2;
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = GRID_COLOR;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = GRID_LABEL_COLOR;
    ctx.textAlign = "center";

    for (let au = auStep; au < maxAU; au += auStep) {
      const r = au * auToPx;
      if (r < 15 || r > minDim) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Label at top
      ctx.fillText(`${formatAULabel(au)} AU`, cx, cy - r - 3);
    }
    ctx.setLineDash([]);

    // ─── HZ Bands ────────────────────────────────────────────────
    // Draw from outermost to innermost so inner bands overlay outer

    // Optimistic outer: Early Mars → Max Greenhouse
    drawAnnulus(ctx, cx, cy, outerMaxGreenhouse * auToPx, outerEarlyMars * auToPx, `${HZ_GREEN} 0.06)`);

    // Conservative HZ: Max Greenhouse → Runaway Greenhouse
    drawAnnulus(ctx, cx, cy, innerRunaway * auToPx, outerMaxGreenhouse * auToPx, `${HZ_GREEN} 0.12)`);

    // Optimistic inner: Runaway Greenhouse → Recent Venus
    drawAnnulus(ctx, cx, cy, innerRecentVenus * auToPx, innerRunaway * auToPx, `${HZ_GREEN} 0.06)`);

    // HZ edge lines
    ctx.lineWidth = 0.8;
    drawCircle(ctx, cx, cy, innerRecentVenus * auToPx, "rgba(46, 204, 113, 0.2)");
    drawCircle(ctx, cx, cy, innerRunaway * auToPx, "rgba(46, 204, 113, 0.35)");
    drawCircle(ctx, cx, cy, outerMaxGreenhouse * auToPx, "rgba(46, 204, 113, 0.35)");
    drawCircle(ctx, cx, cy, outerEarlyMars * auToPx, "rgba(46, 204, 113, 0.2)");

    // ─── Snowline ────────────────────────────────────────────────
    if (snowline > 0 && snowline * auToPx < minDim) {
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = SNOWLINE_BLUE;
      ctx.beginPath();
      ctx.arc(cx, cy, snowline * auToPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(173, 216, 230, 0.5)";
      ctx.textAlign = "left";
      ctx.fillText("SNOWLINE", cx + snowline * auToPx * 0.707 + 4, cy - snowline * auToPx * 0.707 - 2);
    }

    // ─── Known Planets ──────────────────────────────────────────
    if (knownPlanets && knownPlanets.length > 0) {
      for (const kp of knownPlanets) {
        const r = kp.distanceAU * auToPx;
        if (r < 5 || r > minDim) continue;

        if (highlightAllPlanets) {
          // Active style — same cyan glow as the primary planet
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // Planet marker with glow
          ctx.shadowColor = CYAN;
          ctx.shadowBlur = 12;
          ctx.fillStyle = CYAN;
          ctx.beginPath();
          ctx.arc(cx + r, cy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          // Label
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = CYAN;
          ctx.textAlign = "left";
          ctx.fillText(kp.name, cx + r + 10, cy - 4);
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
          ctx.fillText(`${kp.distanceAU.toFixed(3)} AU`, cx + r + 10, cy + 8);
        } else {
          // Ghost style
          ctx.setLineDash([2, 6]);
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.beginPath();
          ctx.arc(cx + r, cy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '7px "DM Sans", sans-serif';
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.textAlign = "left";
          ctx.fillText(kp.name, cx + r + 6, cy - 2);
        }
      }
    }

    // ─── Planet Orbit Path ───────────────────────────────────────
    const planetR = planetDistance * auToPx;
    if (planetR > 0 && planetR < minDim * 2) {
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgba(0, 212, 255, 0.2)`;
      ctx.beginPath();
      ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Radial distance line
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = `rgba(0, 212, 255, 0.12)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + planetR, cy);
      ctx.stroke();

      // Planet marker
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 12;
      ctx.fillStyle = CYAN;
      ctx.beginPath();
      ctx.arc(cx + planetR, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet label
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = CYAN;
      ctx.textAlign = "left";
      const label = planetName || "Planet";
      ctx.fillText(label, cx + planetR + 10, cy - 4);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
      ctx.fillText(`${planetDistance.toFixed(3)} AU`, cx + planetR + 10, cy + 8);
    }

    // ─── Central Star ────────────────────────────────────────────
    const colors = SPECTRAL_COLORS[spectralType] || SPECTRAL_COLORS.G;
    const starRadius = Math.max(4, Math.min(20, starMass * 8));

    // Glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, starRadius * 4);
    glow.addColorStop(0, colors.glow);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, starRadius * 4, 0, Math.PI * 2);
    ctx.fill();

    // Star body
    const starGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, starRadius);
    starGrad.addColorStop(0, "#FFFFFF");
    starGrad.addColorStop(0.4, colors.fill);
    starGrad.addColorStop(1, colors.glow);
    ctx.fillStyle = starGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
    ctx.fill();

    // ─── Legend ───────────────────────────────────────────────────
    const legendX = 12;
    const legendY = h - 100;
    const legendW = 160;
    const legendH = 88;

    ctx.fillStyle = LEGEND_BG;
    ctx.strokeStyle = LEGEND_BORDER;
    ctx.lineWidth = 1;
    roundRect(ctx, legendX, legendY, legendW, legendH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '7px "DM Sans", sans-serif';
    ctx.textAlign = "left";
    const items = [
      { color: `${HZ_GREEN} 0.4)`, label: "Conservative HZ" },
      { color: `${HZ_GREEN} 0.2)`, label: "Optimistic HZ" },
      { color: SNOWLINE_BLUE, label: "Snowline (frost line)" },
      { color: CYAN, label: highlightAllPlanets ? "Planets" : "Your planet" },
    ];
    items.forEach((item, i) => {
      const y = legendY + 16 + i * 18;
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX + 10, y - 4, 10, 10);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText(item.label, legendX + 26, y + 4);
    });
  }, [
    spectralType, starMass,
    innerRecentVenus, innerRunaway, outerMaxGreenhouse, outerEarlyMars,
    snowline, planetDistance, planetName, knownPlanets, highlightAllPlanets,
  ]);

  // Redraw on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });
    observer.observe(container);
    // Initial draw after fonts load
    document.fonts.ready.then(() => draw());

    return () => observer.disconnect();
  }, [draw]);

  // Redraw on prop changes
  useEffect(() => {
    requestAnimationFrame(draw);
  }, [draw]);

  // Zoom handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.3, Math.min(5, zoomRef.current * delta));
      requestAnimationFrame(draw);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#0D0D0F] rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: 300 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        role="img"
        aria-label={`Orbital diagram showing habitable zone for a ${spectralType}-type star. Planet at ${planetDistance.toFixed(3)} AU.`}
      />
      <div className="absolute top-3 right-3 text-[7px] font-mono text-white/20">
        Scroll to zoom
      </div>
    </div>
  );
}

// ─── Canvas Helpers ──────────────────────────────────────────────────

function drawAnnulus(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  innerR: number, outerR: number,
  fillStyle: string
) {
  if (innerR < 0) innerR = 0;
  if (outerR <= innerR) return;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
  ctx.fill();
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number, strokeStyle: string
) {
  if (r <= 0) return;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getAUStep(viewRadius: number): number {
  if (viewRadius < 0.05) return 0.005;
  if (viewRadius < 0.2) return 0.02;
  if (viewRadius < 0.5) return 0.05;
  if (viewRadius < 2) return 0.2;
  if (viewRadius < 5) return 0.5;
  if (viewRadius < 20) return 2;
  if (viewRadius < 50) return 5;
  return 10;
}

function formatAULabel(au: number): string {
  if (au < 0.01) return au.toFixed(3);
  if (au < 1) return au.toFixed(2);
  if (au < 10) return au.toFixed(1);
  return Math.round(au).toString();
}
