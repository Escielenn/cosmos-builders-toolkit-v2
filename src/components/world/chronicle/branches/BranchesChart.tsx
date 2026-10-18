// ---------------------------------------------------------------------------
// BranchesChart — the SVG lane diagram for the Chronicle's BRANCHES view.
//
// DOM/SVG, never canvas: the Chronicle is Studio-adjacent and every mark is
// a focusable, labelled control. Visual language borrows from the Timeline
// tool (diamond markers from EventMarker, bezier arrows with arrowheads from
// CausalityOverlay) so the two surfaces read as one family until the
// Timeline merge lands.
//
// Zoom/pan: wheel zooms around the pointer, shift+wheel or a horizontal
// trackpad swipe pans, mouse drag pans, buttons zoom, and with the chart
// focused: + / - zoom, ← / → pan, 0 fits everything.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIME_LANE,
  formatSortValue,
  niceTicks,
  resolveBranchLane,
  resolveEventLane,
  type BranchEventLike,
  type JumpRecord,
  type Lane,
} from "@/lib/chronicle/branches";
import { HUE_CLASSES, PRIME_HUE } from "./branch-hues";

export interface ChartEvent extends BranchEventLike {
  eventType: string;
}

/** "event:<id>", "jump:<id>", "lane:<key>". */
export type MarkId = string;

export interface FitRequest {
  values: number[];
  nonce: number;
}

interface BranchesChartProps {
  lanes: Lane[];
  events: ChartEvent[];
  eras: ChartEvent[];
  jumps: JumpRecord[];
  branchIds: ReadonlySet<string>;
  domain: [number, number];
  eraLabel: string;
  /** Mark ids cited by the advisory the writer is inspecting. */
  highlight: ReadonlySet<MarkId>;
  active: MarkId | null;
  onActiveChange: (id: MarkId | null) => void;
  onOpenEvent: (eventId: string) => void;
  onOpenJump: (jumpId: string) => void;
  onOpenLane: (laneKey: string) => void;
  fitRequest?: FitRequest | null;
}

const LABEL_W = 168;
const RIGHT_PAD = 24;
const AXIS_H = 36;
const ERA_H = 24;
const LANE_H = 64;
const BOTTOM_PAD = 16;
const MIN_WIDTH = 720;
const ZOOM_STEP = 1.5;

function laneHue(lane: Lane) {
  return HUE_CLASSES[lane.branch?.color ?? PRIME_HUE];
}

function laneName(lane: Lane): string {
  return lane.branch ? lane.branch.name : "Prime timeline";
}

export function BranchesChart({
  lanes,
  events,
  eras,
  jumps,
  branchIds,
  domain,
  eraLabel,
  highlight,
  active,
  onActiveChange,
  onOpenEvent,
  onOpenJump,
  onOpenLane,
  fitRequest,
}: BranchesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(MIN_WIDTH);
  const [view, setView] = useState<[number, number]>(domain);
  const [focused, setFocused] = useState<MarkId | null>(null);
  const dragRef = useRef<{ x: number; view: [number, number] } | null>(null);

  // Reset the view whenever the data's extent changes.
  const domainKey = `${domain[0]}:${domain[1]}`;
  useEffect(() => {
    setView(domain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainKey]);

  // Advisory "show" requests: fit the cited marks, padded.
  useEffect(() => {
    if (!fitRequest || fitRequest.values.length === 0) return;
    const finite = fitRequest.values.filter(Number.isFinite);
    if (finite.length === 0) return;
    let lo = Math.min(...finite);
    let hi = Math.max(...finite);
    const span = Math.max(hi - lo, (domain[1] - domain[0]) * 0.05, 1);
    lo -= span * 0.25;
    hi += span * 0.25;
    setView([lo, hi]);
  }, [fitRequest, domain]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? MIN_WIDTH;
      setWidth(Math.max(MIN_WIDTH, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = width - LABEL_W - RIGHT_PAD;
  const hasEras = eras.length > 0;
  const lanesTop = AXIS_H + (hasEras ? ERA_H : 0);
  const height = lanesTop + lanes.length * LANE_H + BOTTOM_PAD;

  const [v0, v1] = view;
  const x = useCallback(
    (sv: number) => LABEL_W + ((sv - v0) / (v1 - v0)) * plotW,
    [v0, v1, plotW],
  );
  const laneY = useCallback((index: number) => lanesTop + index * LANE_H + LANE_H / 2, [lanesTop]);
  const laneByKey = useMemo(() => new Map(lanes.map((l) => [l.key, l])), [lanes]);

  // ── zoom / pan ────────────────────────────────────────────────
  const zoomAt = useCallback((factor: number, anchor?: number) => {
    setView(([a, b]) => {
      const mid = anchor ?? (a + b) / 2;
      const span = (b - a) / factor;
      if (span < 1) return [a, b];
      const t = (mid - a) / (b - a);
      return [mid - span * t, mid + span * (1 - t)];
    });
  }, []);

  const panBy = useCallback((fraction: number) => {
    setView(([a, b]) => {
      const d = (b - a) * fraction;
      return [a + d, b + d];
    });
  }, []);

  const fitAll = useCallback(() => setView(domain), [domain]);

  // Wheel needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      if (px < LABEL_W) return;
      e.preventDefault();
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const d = e.shiftKey ? e.deltaY : e.deltaX;
        panBy(d / plotW);
        return;
      }
      const anchor = v0 + ((px - LABEL_W) / plotW) * (v1 - v0);
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, anchor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [panBy, zoomAt, plotW, v0, v1]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if ((e.target as Element).closest("[data-mark]")) return;
    dragRef.current = { x: e.clientX, view };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const [a, b] = drag.view;
    const d = (-dx / plotW) * (b - a);
    setView([a + d, b + d]);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomAt(ZOOM_STEP);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomAt(1 / ZOOM_STEP);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      panBy(-0.1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      panBy(0.1);
    } else if (e.key === "0") {
      e.preventDefault();
      fitAll();
    }
  };

  // ── marks ─────────────────────────────────────────────────────
  const ticks = useMemo(() => niceTicks(v0, v1, Math.max(3, Math.floor(plotW / 120))), [v0, v1, plotW]);

  const markProps = (id: MarkId, label: string, open: () => void) => ({
    "data-mark": id,
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onMouseEnter: () => onActiveChange(id),
    onMouseLeave: () => onActiveChange(focused),
    onFocus: () => {
      setFocused(id);
      onActiveChange(id);
    },
    onBlur: () => {
      setFocused(null);
      onActiveChange(null);
    },
    onClick: open,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    },
    className: "cursor-pointer",
  });

  const isLit = (id: MarkId) => active === id || focused === id;
  const isCited = (id: MarkId) => highlight.has(id);

  const plotClipId = "sf-branches-plot";

  return (
    <div className="border border-sf-line bg-sf-surface">
      {/* Zoom controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sf-line-hairline px-3 py-1">
        <span className="font-mono text-[12px] text-t4">
          {formatSortValue(v0, eraLabel)} – {formatSortValue(v1, eraLabel)}
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => zoomAt(1 / ZOOM_STEP)}
            aria-label="Zoom out"
            className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast ease-sf-out hover:text-t1"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => zoomAt(ZOOM_STEP)}
            aria-label="Zoom in"
            className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast ease-sf-out hover:text-t1"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={fitAll}
            aria-label="Fit all"
            className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast ease-sf-out hover:text-t1"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Branch chart. Plus and minus zoom, arrow keys pan, zero fits everything. Tab moves between marks."
        className="sf-sb overflow-x-auto"
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Timeline branches"
          className="block select-none font-sans"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <clipPath id={plotClipId}>
              <rect x={LABEL_W} y={0} width={plotW} height={height} />
            </clipPath>
            <marker
              id="sf-branches-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-t2" />
            </marker>
            <marker
              id="sf-branches-arrow-lit"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-sf-primary" />
            </marker>
            <marker
              id="sf-branches-arrow-cited"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-sf-crimson" />
            </marker>
          </defs>

          {/* Axis + grid */}
          <g clipPath={`url(#${plotClipId})`} aria-hidden>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={x(t)}
                  x2={x(t)}
                  y1={AXIS_H - 6}
                  y2={height - BOTTOM_PAD}
                  className="stroke-sf-line-hairline"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
                <text x={x(t)} y={AXIS_H - 12} textAnchor="middle" className="fill-t4 font-mono text-[12px]">
                  {formatSortValue(t, eraLabel)}
                </text>
              </g>
            ))}
          </g>
          <line x1={LABEL_W} x2={width - RIGHT_PAD} y1={AXIS_H} y2={AXIS_H} className="stroke-sf-line" strokeWidth={1} />

          {/* Era band */}
          {hasEras && (
            <g clipPath={`url(#${plotClipId})`}>
              {eras.map((era) => {
                const id = `event:${era.id}`;
                const x0 = x(era.sortValue);
                const x1 = x(era.endSortValue ?? era.sortValue);
                const w = Math.max(x1 - x0, 4);
                const lit = isLit(id) || isCited(id);
                return (
                  <g
                    key={era.id}
                    {...markProps(id, `Era: ${era.title}, ${era.eventDate}`, () => onOpenEvent(era.id))}
                  >
                    <rect
                      x={x0}
                      y={AXIS_H + 3}
                      width={w}
                      height={ERA_H - 6}
                      className={cn(
                        "fill-sf-surface-elevated",
                        lit ? "stroke-sf-primary" : "stroke-sf-line",
                      )}
                      strokeWidth={1}
                    />
                    <text
                      x={Math.max(x0, LABEL_W) + 6}
                      y={AXIS_H + ERA_H / 2 + 4}
                      className="fill-t3 text-[12px]"
                    >
                      {era.title}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Lane labels */}
          {lanes.map((lane) => {
            const id = `lane:${lane.key}`;
            const y = laneY(lane.index);
            const hue = laneHue(lane);
            const lit = isLit(id) || isCited(id);
            const label = laneName(lane);
            return (
              <g
                key={`label-${lane.key}`}
                {...markProps(
                  id,
                  `${label} lane${lane.branch ? "" : ", the main timeline"}. Open to edit.`,
                  () => onOpenLane(lane.key),
                )}
              >
                <rect
                  x={4}
                  y={y - 20}
                  width={LABEL_W - 16}
                  height={40}
                  className={cn(
                    "fill-sf-surface",
                    isCited(id) ? "stroke-sf-crimson" : lit ? "stroke-sf-primary" : "stroke-transparent",
                  )}
                  strokeWidth={1}
                />
                <rect x={8 + lane.depth * 8} y={y - 5} width={10} height={10} className={hue.fill} />
                <text x={24 + lane.depth * 8} y={y + 4} className="fill-t1 text-[13px]">
                  {label.length > 16 - lane.depth ? `${label.slice(0, 15 - lane.depth)}…` : label}
                </text>
              </g>
            );
          })}

          <g clipPath={`url(#${plotClipId})`}>
            {/* Lanes + forks */}
            {lanes.map((lane) => {
              const y = laneY(lane.index);
              const hue = laneHue(lane);
              const startX = Number.isFinite(lane.start) ? Math.max(x(lane.start), LABEL_W) : LABEL_W;
              const parent = lane.parentKey ? laneByKey.get(lane.parentKey) : undefined;
              const cited = isCited(`lane:${lane.key}`);
              return (
                <g key={`lane-${lane.key}`} aria-hidden>
                  <line
                    x1={startX}
                    x2={width - RIGHT_PAD}
                    y1={y}
                    y2={y}
                    className={cited ? "stroke-sf-crimson" : hue.stroke}
                    strokeWidth={lane.key === PRIME_LANE ? 3 : 2}
                  />
                  {parent && Number.isFinite(lane.start) && (
                    <>
                      <path
                        d={`M ${x(lane.start)} ${laneY(parent.index)} C ${x(lane.start)} ${
                          laneY(parent.index) + LANE_H * 0.5
                        }, ${x(lane.start)} ${y - LANE_H * 0.3}, ${x(lane.start)} ${y}`}
                        fill="none"
                        className={cited ? "stroke-sf-crimson" : hue.stroke}
                        strokeWidth={2}
                      />
                      <circle cx={x(lane.start)} cy={laneY(parent.index)} r={4} className={cn(hue.fill, "stroke-sf-void")} strokeWidth={2} />
                    </>
                  )}
                </g>
              );
            })}

            {/* Events */}
            {events.map((ev) => {
              const id = `event:${ev.id}`;
              const lane = laneByKey.get(resolveEventLane(ev, branchIds));
              if (!lane) return null;
              const y = laneY(lane.index);
              const cx = x(ev.sortValue);
              const hue = laneHue(lane);
              const lit = isLit(id);
              const cited = isCited(id);
              const hasEnd = ev.endSortValue != null && ev.endSortValue > ev.sortValue;
              const s = lit || cited ? 8 : 6;
              return (
                <g
                  key={ev.id}
                  {...markProps(
                    id,
                    `Event: ${ev.title}, ${ev.eventDate}, on ${laneName(lane)}. Open to edit.`,
                    () => onOpenEvent(ev.id),
                  )}
                >
                  {/* Generous invisible hit area */}
                  <rect x={cx - 12} y={y - 16} width={24} height={32} className="fill-transparent" />
                  {hasEnd && (
                    <rect
                      x={cx}
                      y={y - 3}
                      width={Math.max(x(ev.endSortValue!) - cx, 2)}
                      height={6}
                      className={cn(hue.fill)}
                    />
                  )}
                  <rect
                    x={cx - s}
                    y={y - s}
                    width={s * 2}
                    height={s * 2}
                    transform={`rotate(45 ${cx} ${y})`}
                    className={cn(
                      hue.fill,
                      cited ? "stroke-sf-crimson" : lit ? "stroke-sf-focus" : "stroke-sf-void",
                    )}
                    strokeWidth={cited || lit ? 2 : 1.5}
                  />
                </g>
              );
            })}

            {/* Jumps */}
            {jumps.map((j) => {
              const id = `jump:${j.id}`;
              const from = laneByKey.get(resolveBranchLane(j.fromBranchId, branchIds));
              const to = laneByKey.get(resolveBranchLane(j.toBranchId, branchIds));
              if (!from || !to) return null;
              const x1 = x(j.fromSortValue);
              const y1 = laneY(from.index);
              const x2 = x(j.toSortValue);
              const y2 = laneY(to.index);
              const lift = Math.min(28 + Math.abs(x2 - x1) * 0.12, LANE_H * 0.9);
              const cy = Math.min(y1, y2) - lift;
              const cx = (x1 + x2) / 2;
              const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
              const lit = isLit(id);
              const cited = isCited(id);
              const apexY = (y1 + 2 * cy + y2) / 4;
              const name = j.travelerLabel.trim() || "Traveler";
              return (
                <g
                  key={j.id}
                  {...markProps(
                    id,
                    `Jump: ${name}, from ${formatSortValue(j.fromSortValue, eraLabel)} on ${laneName(from)} to ${formatSortValue(
                      j.toSortValue,
                      eraLabel,
                    )} on ${laneName(to)}. Open to edit.`,
                    () => onOpenJump(j.id),
                  )}
                >
                  <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                  <path
                    d={d}
                    fill="none"
                    className={cited ? "stroke-sf-crimson" : lit ? "stroke-sf-primary" : "stroke-t2"}
                    strokeWidth={lit || cited ? 2.5 : 1.5}
                    strokeDasharray="6 4"
                    markerEnd={`url(#${cited ? "sf-branches-arrow-cited" : lit ? "sf-branches-arrow-lit" : "sf-branches-arrow"})`}
                  />
                  <circle cx={x1} cy={y1} r={3.5} className={cited ? "fill-sf-crimson" : "fill-t2"} />
                  <text
                    x={cx}
                    y={apexY - 6}
                    textAnchor="middle"
                    className={cn("text-[12px]", lit ? "fill-t1" : "fill-t2")}
                    style={{ paintOrder: "stroke", stroke: "var(--sf-surface)", strokeWidth: 4 }}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
