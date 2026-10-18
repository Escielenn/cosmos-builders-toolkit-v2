// ---------------------------------------------------------------------------
// FlatMap — the sheet, flat, with a graticule and the writer's places on it.
//
// Pan by dragging, zoom with the wheel or the +/− controls, arrow keys pan
// when the map has focus. A click that is not a drag reports a coordinate to
// the page, which is how a place gets put down. Coordinates come from the
// pure projection functions in geo.ts, so a pin on this map and the same pin
// on the globe are the same point.
//
// Pins counter-scale against the zoom so they stay pin-sized, and each is a
// 44px button around a small mark: the hit target the design system demands,
// without a 44px blob covering the map.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { MapProjection } from "@/lib/atlas/placement";
import {
  latLonToSheet,
  sheetToLatLon,
  wrapLon,
  type LatLon,
} from "@/lib/surface-cartographer/geo";
import type { SurfacePlace } from "@/lib/surface-cartographer/places";

interface FlatMapProps {
  imageUrl: string | null;
  projection: MapProjection;
  /** Sheet width / height. */
  aspect: number;
  places: SurfacePlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPick: (at: LatLon) => void;
  /** A coordinate being drafted, not yet filed. */
  draft: LatLon | null;
  locked: boolean;
  substellarLon: number;
  /** Two placed points to join with a great-circle line. */
  measure: [LatLon, LatLon] | null;
  label: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 8;

interface View {
  scale: number;
  tx: number;
  ty: number;
}

const HOME: View = { scale: 1, tx: 0, ty: 0 };

/** Keep the map covering the viewport: never pan off into the void. */
function clampView(v: View): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale));
  const maxShift = (scale - 1) / 2; // in units of the viewport size
  return {
    scale,
    tx: Math.min(maxShift, Math.max(-maxShift, v.tx)),
    ty: Math.min(maxShift, Math.max(-maxShift, v.ty)),
  };
}

/** Sample a great circle between two points for drawing; split at the antimeridian. */
function greatCirclePath(a: LatLon, b: LatLon, steps = 96): LatLon[][] {
  const toV = (p: LatLon) => {
    const phi = (p.lat * Math.PI) / 180;
    const lam = (p.lon * Math.PI) / 180;
    return [Math.cos(phi) * Math.cos(lam), Math.cos(phi) * Math.sin(lam), Math.sin(phi)];
  };
  const va = toV(a);
  const vb = toV(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  const segments: LatLon[][] = [[]];
  let prevLon: number | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let v: number[];
    if (omega < 1e-6) v = va;
    else {
      const s1 = Math.sin((1 - t) * omega) / Math.sin(omega);
      const s2 = Math.sin(t * omega) / Math.sin(omega);
      v = [va[0] * s1 + vb[0] * s2, va[1] * s1 + vb[1] * s2, va[2] * s1 + vb[2] * s2];
    }
    const lat = (Math.asin(Math.max(-1, Math.min(1, v[2]))) * 180) / Math.PI;
    const lon = wrapLon((Math.atan2(v[1], v[0]) * 180) / Math.PI);
    if (prevLon !== null && Math.abs(lon - prevLon) > 180) segments.push([]);
    segments[segments.length - 1].push({ lat, lon });
    prevLon = lon;
  }
  return segments.filter((s) => s.length > 1);
}

export function FlatMap({
  imageUrl,
  projection,
  aspect,
  places,
  selectedId,
  onSelect,
  onPick,
  draft,
  locked,
  substellarLon,
  measure,
  label,
}: FlatMapProps) {
  const [view, setView] = useState<View>(HOME);
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);

  const toSheet = useCallback(
    (p: LatLon) => latLonToSheet(p, projection, aspect),
    [projection, aspect],
  );

  // Graticule every 30°, drawn in sheet space so it bends correctly on Mercator.
  const graticule = useMemo(() => {
    const lats = [-60, -30, 0, 30, 60].map((lat) => ({ lat, y: toSheet({ lat, lon: 0 }).y }));
    const lons = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => ({
      lon,
      x: toSheet({ lat: 0, lon }).x,
    }));
    return {
      lats: lats.filter((l) => l.y > 0 && l.y < 1),
      lons,
    };
  }, [toSheet]);

  const zoomBy = useCallback((factor: number) => {
    setView((v) => clampView({ ...v, scale: v.scale * factor }));
  }, []);

  // Wheel zoom toward the cursor. Registered by hand so it can be non-passive
  // and stop the page from scrolling under the map.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const cx = (e.clientX - box.left) / box.width - 0.5;
      const cy = (e.clientY - box.top) / box.height - 0.5;
      setView((v) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
        const k = scale / v.scale;
        // Keep the point under the cursor where it is.
        return clampView({ scale, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k });
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = frameRef.current;
    if (!d || !el) return;
    const box = el.getBoundingClientRect();
    const dx = (e.clientX - d.x) / box.width;
    const dy = (e.clientY - d.y) / box.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.004) d.moved = true;
    if (d.moved) setView(clampView({ ...d.view, tx: d.view.tx + dx, ty: d.view.ty + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const layer = layerRef.current;
    if (!layer) return;
    const box = layer.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    onPick(sheetToLatLon({ x, y }, projection, aspect));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.08;
    const map: Record<string, () => void> = {
      ArrowLeft: () => setView((v) => clampView({ ...v, tx: v.tx + step })),
      ArrowRight: () => setView((v) => clampView({ ...v, tx: v.tx - step })),
      ArrowUp: () => setView((v) => clampView({ ...v, ty: v.ty + step })),
      ArrowDown: () => setView((v) => clampView({ ...v, ty: v.ty - step })),
      "+": () => zoomBy(1.25),
      "=": () => zoomBy(1.25),
      "-": () => zoomBy(0.8),
      "0": () => setView(HOME),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const terminatorXs = locked
    ? [wrapLon(substellarLon - 90), wrapLon(substellarLon + 90)].map((lon) => toSheet({ lat: 0, lon }).x)
    : [];
  const substellar = locked ? toSheet({ lat: 0, lon: substellarLon }) : null;
  const measurePaths = measure ? greatCirclePath(measure[0], measure[1]) : [];

  const placed = places.filter((p): p is SurfacePlace & { at: LatLon } => p.at !== null);
  const pinScale = 1 / view.scale;

  return (
    <div className="space-y-2">
      <div
        ref={frameRef}
        role="application"
        aria-label={`${label}. Drag to pan, wheel or plus and minus to zoom, click to pick a coordinate.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        className="relative w-full cursor-crosshair touch-none select-none overflow-hidden border border-sf-line bg-sf-surface"
        style={{ aspectRatio: `${aspect}` }}
      >
        <div
          ref={layerRef}
          className="absolute inset-0 origin-center"
          style={{
            transform: `translate(${view.tx * 100}%, ${view.ty * 100}%) scale(${view.scale})`,
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
          ) : null}

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
            {locked && substellar && (
              <>
                {/* The night face, dimmed. On equirect the terminator of a
                    locked, upright world is two meridians, 90° either side. */}
                {(() => {
                  const [a, b] = terminatorXs.map((x) => x * 1000);
                  const lo = Math.min(a, b);
                  const hi = Math.max(a, b);
                  const dayInside = substellar.x * 1000 > lo && substellar.x * 1000 < hi;
                  return dayInside ? (
                    <>
                      <rect x={0} y={0} width={lo} height={1000} style={{ fill: "var(--sf-void)" }} fillOpacity={0.45} />
                      <rect x={hi} y={0} width={1000 - hi} height={1000} style={{ fill: "var(--sf-void)" }} fillOpacity={0.45} />
                    </>
                  ) : (
                    <rect x={lo} y={0} width={hi - lo} height={1000} style={{ fill: "var(--sf-void)" }} fillOpacity={0.45} />
                  );
                })()}
                {terminatorXs.map((x, i) => (
                  <line
                    key={i}
                    x1={x * 1000}
                    x2={x * 1000}
                    y1={0}
                    y2={1000}
                    style={{ stroke: "var(--sf-amber)" }}
                    strokeWidth={1.5}
                    strokeDasharray="6 6"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </>
            )}

            {graticule.lats.map((l) => (
              <line
                key={`lat${l.lat}`}
                x1={0}
                x2={1000}
                y1={l.y * 1000}
                y2={l.y * 1000}
                style={{ stroke: l.lat === 0 ? "var(--sf-line-emphasis)" : "var(--sf-line-hairline)" }}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {graticule.lons.map((l) => (
              <line
                key={`lon${l.lon}`}
                x1={l.x * 1000}
                x2={l.x * 1000}
                y1={0}
                y2={1000}
                style={{ stroke: l.lon === 0 ? "var(--sf-line-emphasis)" : "var(--sf-line-hairline)" }}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {measurePaths.map((seg, i) => (
              <polyline
                key={`m${i}`}
                points={seg
                  .map((p) => {
                    const s = toSheet(p);
                    return `${s.x * 1000},${s.y * 1000}`;
                  })
                  .join(" ")}
                fill="none"
                style={{ stroke: "var(--sf-primary-bright)" }}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {substellar && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${substellar.x * 100}%`,
                top: `${substellar.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${pinScale})`,
              }}
              aria-hidden
            >
              {/* The eye of a locked world. Amber: a physics fact, not a selection. */}
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="8" fill="none" style={{ stroke: "var(--sf-amber)" }} strokeWidth="2" />
                <circle cx="11" cy="11" r="2" style={{ fill: "var(--sf-amber)" }} />
              </svg>
            </div>
          )}

          {draft && (() => {
            const s = toSheet(draft);
            return (
              <div
                className="pointer-events-none absolute"
                style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: `translate(-50%, -50%) scale(${pinScale})` }}
                aria-hidden
              >
                <div className="h-4 w-4 rotate-45 border-2 border-dashed border-sf-primary-bright" />
              </div>
            );
          })()}

          {placed.map((p) => {
            const s = toSheet(p.at);
            if (s.y < 0 || s.y > 1) return null;
            const selected = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                data-pin
                aria-label={`${p.name}${selected ? ", selected" : ""}`}
                aria-pressed={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(p.id);
                }}
                className="group absolute flex h-11 w-11 items-center justify-center"
                style={{
                  left: `${s.x * 100}%`,
                  top: `${s.y * 100}%`,
                  transform: `translate(-50%, -50%) scale(${pinScale})`,
                }}
              >
                <span
                  className={`block rotate-45 border transition-transform duration-fast ease-sf-out group-hover:scale-125 ${
                    selected
                      ? "h-3.5 w-3.5 border-sf-on-primary bg-sf-primary"
                      : "h-2.5 w-2.5 border-sf-void bg-sf-primary"
                  }`}
                />
                <span
                  className={`pointer-events-none absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap border px-1.5 py-0.5 font-sans text-[12px] ${
                    selected
                      ? "border-sf-primary bg-sf-surface-elevated text-t1"
                      : "border-sf-line bg-sf-surface text-t2"
                  }`}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Graticule labels stay on the frame, not the zoomed layer. */}
        <div className="pointer-events-none absolute bottom-1 left-1 bg-sf-surface px-1.5 font-mono text-[12px] text-t4">
          {projection === "mercator" ? "MERCATOR" : "EQUIRECT"} · 30° GRID · ×{view.scale.toFixed(1)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          className="flex h-11 w-11 items-center justify-center border border-sf-line-interactive text-t2 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom out"
          className="flex h-11 w-11 items-center justify-center border border-sf-line-interactive text-t2 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setView(HOME)}
          aria-label="Reset view"
          className="flex h-11 w-11 items-center justify-center border border-sf-line-interactive text-t2 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
        <p className="ml-2 text-[13px] text-t3">Click the map to set a coordinate. Drag to pan.</p>
      </div>
    </div>
  );
}

export default FlatMap;
