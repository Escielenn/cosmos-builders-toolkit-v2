import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { tokens } from "@/styles/tokens";

interface PlanetSizeComparisonProps {
  planetRadiusEarth: number;
  planetGravity: number;
  planetName?: string;
  compositionColor?: string;
  className?: string;
}

const PlanetSizeComparison = ({
  planetRadiusEarth,
  planetGravity,
  planetName = "Your Planet",
  compositionColor = tokens.accent.base,
  className,
}: PlanetSizeComparisonProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Clear
    ctx.fillStyle = "#0D0D0F";
    ctx.fillRect(0, 0, w, h);

    // Layout: two planets side by side
    const padding = 40;
    const maxPlanetArea = (w - padding * 3) / 2;
    const maxRadius = Math.min(maxPlanetArea / 2, (h - padding * 3) / 2);

    // Scale: Earth reference radius
    const maxDisplayR = Math.max(1, planetRadiusEarth);
    const scale = maxRadius / maxDisplayR;
    const earthR = Math.max(scale * 1, 8);
    const planetR = Math.max(scale * planetRadiusEarth, 8);

    const earthX = w * 0.3;
    const planetX = w * 0.7;
    const centerY = h * 0.45;

    // Draw Earth
    drawPlanet(ctx, earthX, centerY, earthR, "#3B82F6", "Earth", "1.00g", 1);

    // Draw user's planet
    drawPlanet(ctx, planetX, centerY, planetR, compositionColor, planetName, `${planetGravity.toFixed(2)}g`, planetGravity);

    // Draw gravity arrows
    const arrowBaseY = centerY + Math.max(earthR, planetR) + 20;
    const earthArrowLen = 30;
    const planetArrowLen = Math.min(30 * planetGravity, h - arrowBaseY - 20);

    if (planetArrowLen > 0 && earthArrowLen > 0) {
      drawGravityArrow(ctx, earthX, arrowBaseY, earthArrowLen, "#3B82F6");
      drawGravityArrow(ctx, planetX, arrowBaseY, Math.max(planetArrowLen, 5), compositionColor);
    }

    // Labels
    ctx.font = "10px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.textAlign = "center";
    ctx.fillText("Size comparison (to scale by radius)", w / 2, h - 10);
  }, [planetRadiusEarth, planetGravity, planetName, compositionColor]);

  useEffect(() => {
    draw();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className={cn("w-full aspect-[2/1] min-h-[200px]", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-none"
        aria-label={`Planet size comparison: ${planetName} (${planetRadiusEarth.toFixed(2)} R⊕, ${planetGravity.toFixed(2)}g) vs Earth`}
      />
    </div>
  );
};

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  name: string,
  gravityLabel: string,
  gravity: number
) {
  // Glow
  const gradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.5);
  gradient.addColorStop(0, color + "20");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Planet body
  const bodyGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  bodyGrad.addColorStop(0, color + "60");
  bodyGrad.addColorStop(0.7, color + "30");
  bodyGrad.addColorStop(1, color + "15");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = color + "80";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Name label
  ctx.font = "500 11px 'Jura', sans-serif";
  ctx.fillStyle = tokens.text.t1;
  ctx.textAlign = "center";
  ctx.fillText(name, x, y - r - 14);

  // Gravity label
  ctx.font = "500 13px 'JetBrains Mono', monospace";
  ctx.fillStyle = color;
  ctx.fillText(gravityLabel, x, y - r - 2);
}

function drawGravityArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  startY: number,
  length: number,
  color: string
) {
  const endY = startY + length;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, startY);
  ctx.lineTo(x, endY);
  ctx.stroke();

  // Arrow head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 5, endY - 5);
  ctx.lineTo(x, endY);
  ctx.lineTo(x + 5, endY - 5);
  ctx.fill();
}

export default PlanetSizeComparison;
