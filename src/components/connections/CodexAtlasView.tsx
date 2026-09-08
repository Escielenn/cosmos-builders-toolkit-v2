// ---------------------------------------------------------------------------
// CodexAtlasView — the Codex's spatial view (F5, 13-THE-LIFT.md §1).
//
// "The Stellar Cartographer promoted from a Pro toy to the map of the world."
// The Cartographer generates a galaxy; this shows the writer's own. Every pin
// is an entity that already exists, and clicking one lands on its Codex page —
// the same destination as the List and the Web, because there is one URL per
// thing.
//
// Zoom is the entity hierarchy, not a scale factor: the galaxy level shows
// systems, clicking into one shows what is inside it. That is what "galaxy →
// system → planet → region" means when the map is made of entities.
//
// Entities the writer has not placed sit in a tray, visible and named. They
// are never scattered onto the map — see lib/atlas/placement.ts.
// ---------------------------------------------------------------------------

import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Crosshair, MapPin, Route } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  useEntities,
  useEntityConnections,
  useUpdateEntity,
} from "@/hooks/use-entity-graph";
import {
  atlasPins,
  canZoomInto,
  placedPins,
  placementPatch,
  readMapSheet,
  unplacedPins,
  type AtlasPin,
} from "@/lib/atlas/placement";
import {
  CASCADE_STAGE_COLORS,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
} from "@/services/entity-graph-types";
import { bindSystem } from "@/gl/bind/system";
import { buildGalaxyField } from "@/gl/bind/starfield";
import { buildLanes, longestHop, networkLengthLy } from "@/gl/bind/routes";
import { useStarCatalog } from "@/hooks/use-star-catalog";
import { entityToWorldEntry } from "@/gl/bind/entity-entry";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// three.js is heavy and most Atlas levels never need it. Loading it only when
// a system is opened keeps the galaxy level's first paint free of it.
const SystemScene = lazy(() => import("@/gl/scenes/SystemScene"));
const GalaxyScene = lazy(() => import("@/gl/scenes/GalaxyScene"));

interface CodexAtlasViewProps {
  worldId: string;
}

interface Crumb {
  id: string | null;
  label: string;
}

export function CodexAtlasView({ worldId }: CodexAtlasViewProps) {
  const navigate = useNavigate();
  const { data: entities, isLoading } = useEntities(worldId);
  const { data: connections } = useEntityConnections(worldId);
  const updateEntity = useUpdateEntity(worldId);

  const [trail, setTrail] = useState<Crumb[]>([{ id: null, label: "Galaxy" }]);
  const here = trail[trail.length - 1];

  const mapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // Set while a drag is in flight so the click it ends with is ignored.
  const draggedRef = useRef<string | null>(null);

  const all = useMemo(() => entities ?? [], [entities]);
  const pins = useMemo(() => atlasPins(all, here.id), [all, here.id]);

  // At planet or moon zoom, the writer's own drawn map IS the map, and the
  // places inside that world pin onto it (F5 scope addition, 2026-09-07).
  const sheet = useMemo(
    () => readMapSheet(all.find((e) => e.id === here.id)),
    [all, here.id],
  );
  const placed = useMemo(() => placedPins(pins), [pins]);
  const unplaced = useMemo(() => unplacedPins(pins), [pins]);
  const reducedMotion = usePrefersReducedMotion();

  // At the galaxy level the writer chooses which sky they are looking at
  // (owner, 2026-09-08: allow both). CHART is their own arrangement, dragged
  // by hand. REAL SKY is the Hipparcos catalogue with their anchored systems
  // on it. Neither is the "true" one — they answer different questions.
  const [galaxyMode, setGalaxyMode] = useState<"chart" | "sky">("chart");
  const atGalaxy = here.id === null;
  const { data: catalog, isLoading: catalogLoading, error: catalogError } =
    useStarCatalog(atGalaxy && galaxyMode === "sky");

  // G3: inside a star or star system, the picture is not a drag-grid — it is
  // an orrery, and every position is a fact (orbit.semi_major_axis). Nothing
  // here is placed by hand, so nothing here can be placed wrongly by hand.
  const hereEntity = useMemo(
    () => all.find((e) => e.id === here.id) ?? null,
    [all, here.id],
  );
  const galaxyField = useMemo(
    () => (catalog ? buildGalaxyField(catalog, all) : null),
    [catalog, all],
  );

  // Hyperlanes: routes the writer already drew in the Web view, measured
  // between the two anchors' real positions. Nothing here is generated, and
  // a route whose ends are not both anchored is reported rather than guessed.
  const laneField = useMemo(
    () =>
      galaxyField
        ? buildLanes(galaxyField.systems, connections ?? [])
        : { lanes: [], undrawable: [] },
    [galaxyField, connections],
  );

  const system = useMemo(() => {
    if (!hereEntity) return null;
    if (hereEntity.entity_type !== "star" && hereEntity.entity_type !== "star_system") {
      return null;
    }
    const children = all.filter((e) => e.parent_entity_id === hereEntity.id);
    const bound = bindSystem(
      entityToWorldEntry(hereEntity),
      children.map(entityToWorldEntry),
    );
    // With nothing orbiting, an orrery is an empty ring. Fall back to the map.
    return bound.bodies.length > 0 ? bound : null;
  }, [hereEntity, all]);

  const place = useCallback(
    (id: string, clientX: number, clientY: number) => {
      const box = mapRef.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;
      updateEntity.mutate({
        id,
        metadata: placementPatch({
          x: (clientX - box.left) / box.width,
          y: (clientY - box.top) / box.height,
        }),
      });
    },
    [updateEntity],
  );

  const onMapDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/sf-entity") || dragging;
      if (id) place(id, e.clientX, e.clientY);
      setDragging(null);
      // Cleared by the pin's own click handler; reset here too in case the
      // drop landed on empty map and no click follows.
      window.setTimeout(() => {
        draggedRef.current = null;
      }, 0);
    },
    [dragging, place],
  );

  const zoomInto = useCallback((pin: AtlasPin) => {
    setTrail((t) => [...t, { id: pin.id, label: pin.name }]);
  }, []);

  const pinColor = (pin: AtlasPin) =>
    ENTITY_TYPE_COLORS[pin.entityType] ?? CASCADE_STAGE_COLORS.physics;

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader size="sm" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="xl:col-span-3">
        {/* Where you are. Each step back is one click. */}
        <nav className="mb-3 flex flex-wrap items-center gap-1" aria-label="Atlas level">
          {trail.map((crumb, i) => (
            <span key={`${crumb.id ?? "root"}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-t4" aria-hidden />}
              <button
                type="button"
                onClick={() => setTrail((t) => t.slice(0, i + 1))}
                disabled={i === trail.length - 1}
                className={`min-h-hit px-2 font-mono text-[12px] uppercase tracking-wider transition-colors ${
                  i === trail.length - 1
                    ? "text-t1"
                    : "text-t3 hover:text-t1"
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}

          {atGalaxy && (
            <div className="ml-auto flex border border-sf-line" role="group" aria-label="Galaxy view">
              {([
                ["chart", "Chart"],
                ["sky", "Real sky"],
              ] as const).map(([id, label], i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGalaxyMode(id)}
                  aria-pressed={galaxyMode === id}
                  className={`min-h-hit px-3 font-mono text-[12px] uppercase tracking-wider transition-colors ${
                    i > 0 ? "border-l border-sf-line" : ""
                  } ${
                    galaxyMode === id
                      ? "bg-sf-surface-elevated text-t1"
                      : "text-t3 hover:text-t1"
                  }`}
                  title={
                    id === "chart"
                      ? "Your own arrangement, placed by hand"
                      : "Real stars from the Hipparcos catalogue, with your anchored systems on them"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {atGalaxy && galaxyMode === "sky" ? (
          <div className="relative aspect-[3/2] w-full overflow-hidden border border-sf-line bg-sf-void">
            {catalogError ? (
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-[12px] uppercase tracking-wider text-sf-crimson-text">
                // STAR CATALOGUE UNAVAILABLE.
              </p>
            ) : catalogLoading || !galaxyField ? (
              <div className="flex h-full items-center justify-center">
                <Loader size="sm" />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <Loader size="sm" />
                  </div>
                }
              >
                <GalaxyScene
                  field={galaxyField}
                  lanes={laneField.lanes}
                  reducedMotion={reducedMotion}
                  onSelectSystem={(id) => navigate(`/worlds/${worldId}/codex/${id}`)}
                  className="h-full w-full"
                />
              </Suspense>
            )}
          </div>
        ) : system ? (
          <div className="relative aspect-[3/2] w-full overflow-hidden border border-sf-line bg-sf-void">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader size="sm" />
                </div>
              }
            >
              <SystemScene
                system={system}
                selectedId={null}
                reducedMotion={reducedMotion}
                onSelectBody={(id) => navigate(`/worlds/${worldId}/codex/${id}`)}
                className="h-full w-full"
              />
            </Suspense>
          </div>
        ) : (
        <div
          ref={mapRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onMapDrop}
          className="relative aspect-[3/2] w-full overflow-hidden border border-sf-line bg-sf-surface"
          role="application"
          aria-label={`Atlas — ${here.label}`}
        >
          {sheet && (
            <img
              src={sheet.url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}

          {/* A grid, not a starfield: this is a chart of what the writer
              decided, and invented background stars would compete with the
              pins that are actually theirs. Over a map sheet it drops back so
              it reads as a graticule rather than a second drawing. */}
          <svg
            className="absolute inset-0 h-full w-full"
            style={sheet ? { opacity: 0.35 } : undefined}
            aria-hidden
          >
            <defs>
              <pattern id="sf-atlas-grid" width="8%" height="12%" patternUnits="objectBoundingBox">
                <path
                  d="M 1000 0 L 0 0 0 1000"
                  fill="none"
                  style={{ stroke: "var(--sf-line-hairline)" }}
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sf-atlas-grid)" />
          </svg>

          {/* Two explicit affordances, no timing.
              A pin used to be one button with onClick=open and
              onDoubleClick=enter, which cannot work: the first click of a
              double-click navigates away before the second arrives. And a
              small nudge-drag that the browser does not treat as a drag also
              fired the click, so trying to move a pin took you off the map.
              Click opens; the chevron enters; a drag suppresses both. */}
          {placed.map((pin) => (
            <div
              key={pin.id}
              style={{
                left: `${pin.at!.x * 100}%`,
                top: `${pin.at!.y * 100}%`,
              }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/sf-entity", pin.id);
                  draggedRef.current = pin.id;
                  setDragging(pin.id);
                }}
                onDragEnd={() => setDragging(null)}
                onClick={() => {
                  // A drag that ended on this pin must not also open it.
                  if (draggedRef.current === pin.id) {
                    draggedRef.current = null;
                    return;
                  }
                  navigate(`/worlds/${worldId}/codex/${pin.id}`);
                }}
                className="block cursor-grab active:cursor-grabbing"
                title={`${pin.name} — open its Codex page`}
              >
                <span
                  className="block h-3 w-3 rounded-full ring-2 ring-sf-surface transition-transform group-hover:scale-125"
                  style={{ background: pinColor(pin) }}
                />
              </button>

              <span className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[12px] text-t2">
                {pin.name}
              </span>

              {canZoomInto(pin) && (
                <button
                  type="button"
                  onClick={() => zoomInto(pin)}
                  className="absolute left-1/2 top-8 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap px-1 font-mono text-[12px] text-t4 transition-colors hover:text-sf-primary-text"
                  title={`Go inside ${pin.name}`}
                >
                  {pin.childCount} inside
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </button>
              )}
            </div>
          ))}

          {placed.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center bg-sf-surface/70 px-6 text-center font-mono text-[12px] uppercase tracking-wider text-t3">
              {pins.length === 0
                ? here.id === null
                  ? "NO SYSTEMS ON FILE. CREATE ONE IN THE CODEX."
                  : "NOTHING INSIDE THIS YET."
                : "NOTHING PLACED YET. DRAG FROM THE TRAY."}
            </p>
          )}
        </div>
        )}

        <p className="mt-2 font-mono text-[12px] uppercase tracking-wider text-t4">
          {atGalaxy && galaxyMode === "sky"
            ? `Drag to orbit · scroll to zoom · ${galaxyField?.stars.length ?? 0} real stars (Hipparcos) · rings are your systems, anchored${
                galaxyField?.unplaced.length
                  ? ` · ${galaxyField.unplaced.length} not anchored`
                  : ""
              }${
                laneField.lanes.length
                  ? ` · ${laneField.lanes.length} route${
                      laneField.lanes.length === 1 ? "" : "s"
                    }, ${(networkLengthLy(laneField.lanes) ?? 0).toFixed(1)} ly of lane, longest hop ${(longestHop(laneField.lanes)?.distanceLy ?? 0).toFixed(1)} ly`
                  : ""
              }`
            : system
            ? "Click a world to open it · orbits are drawn from orbit.semi_major_axis, not placed by hand"
            : `Click a pin to open it · use “inside” to go a level down · drag to move${
                sheet ? ` · ${sheet.projection} sheet` : ""
              }`}
        </p>
      </div>

      <aside className="space-y-4">
        {atGalaxy && galaxyMode === "sky" ? (
          <>
            <div className="border border-sf-line bg-sf-surface p-3">
              <h3 className="mb-2 flex items-center gap-1.5 font-heading text-[12px] uppercase tracking-[2px] text-t3">
                <Route className="h-3 w-3" aria-hidden />
                Routes
              </h3>
              {laneField.lanes.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-t2">
                  No routes yet. Connect two anchored systems with{" "}
                  <span className="font-mono text-[12px] text-t2">
                    travels via
                  </span>
                  ,{" "}
                  <span className="font-mono text-[12px] text-t2">
                    trades with
                  </span>{" "}
                  or{" "}
                  <span className="font-mono text-[12px] text-t2">
                    colonized by
                  </span>{" "}
                  in the Web view and the lane appears here, measured.
                </p>
              ) : (
                <ul className="sf-sb max-h-72 space-y-1 overflow-y-auto">
                  {laneField.lanes.map((lane) => (
                    <li key={lane.id}>
                      {/* The distance is derived and cannot be edited, but the
                          route can — it is a connection. This lands on the
                          system whose page carries it (Law III). */}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/worlds/${worldId}/codex/${lane.from.id}`)
                        }
                        className="flex min-h-hit w-full items-center justify-between gap-3 border border-sf-line-interactive px-2 text-left transition-colors hover:border-sf-line-emphasis"
                      >
                        <span className="truncate text-[13px] text-t2">
                          {lane.from.name} → {lane.to.name}
                        </span>
                        <span className="shrink-0 font-mono text-[12px] text-t3">
                          {lane.distanceLy?.toFixed(1)} ly
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {laneField.lanes.length > 0 && (
                <p className="mt-2 text-[12px] leading-relaxed text-t2">
                  Distances are measured between the two anchors' catalogue
                  positions. Nobody typed them in, so nobody can get them
                  wrong.
                </p>
              )}
            </div>

            {(galaxyField?.unplaced.length || laneField.undrawable.length) ? (
              <div className="border border-sf-line bg-sf-surface p-3">
                <h3 className="mb-2 flex items-center gap-1.5 font-heading text-[12px] uppercase tracking-[2px] text-t3">
                  <Crosshair className="h-3 w-3" aria-hidden />
                  Not anchored
                </h3>
                {galaxyField?.unplaced.length ? (
                  <ul className="sf-sb max-h-56 space-y-1 overflow-y-auto">
                    {galaxyField.unplaced.map((system) => (
                      <li key={system.id}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/worlds/${worldId}/codex/${system.id}`)
                          }
                          className="flex min-h-hit w-full items-center gap-2 border border-sf-line-interactive px-2 text-left transition-colors hover:border-sf-line-emphasis"
                        >
                          <span className="truncate text-[13px] text-t2">
                            {system.name}
                          </span>
                          <span className="ml-auto shrink-0 font-mono text-[12px] uppercase tracking-wider text-t4">
                            Anchor
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {laneField.undrawable.length > 0 && (
                  <p className="mt-2 text-[12px] leading-relaxed text-t2">
                    {laneField.undrawable.length} route
                    {laneField.undrawable.length === 1 ? " is" : "s are"} waiting
                    on an anchor. A lane with one end nowhere real has no
                    length, so it is held here rather than drawn at a guess.
                  </p>
                )}
              </div>
            ) : null}
          </>
        ) : (
        <div className="border border-sf-line bg-sf-surface p-3">
          <h3 className="mb-2 flex items-center gap-1.5 font-heading text-[12px] uppercase tracking-[2px] text-t3">
            <MapPin className="h-3 w-3" aria-hidden />
            Unplaced
          </h3>
          {unplaced.length === 0 ? (
            <p className="text-[13px] text-t3">
              {pins.length === 0
                ? "Nothing at this level yet."
                : "Everything here is on the map."}
            </p>
          ) : (
            <>
              <ul className="sf-sb max-h-72 space-y-1 overflow-y-auto">
                {unplaced.map((pin) => (
                  <li key={pin.id}>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/sf-entity", pin.id);
                        setDragging(pin.id);
                      }}
                      onDragEnd={() => setDragging(null)}
                      className="flex min-h-hit cursor-grab items-center gap-2 border border-sf-line-interactive px-2 active:cursor-grabbing"
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: pinColor(pin) }}
                      />
                      <span className="truncate text-[13px] text-t2">{pin.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-[12px] uppercase tracking-wider text-t4">
                        {ENTITY_TYPE_LABELS[pin.entityType]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-t3">
                <Crosshair className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                Drag one onto the map to place it. Nothing is positioned for
                you — a pin you did not place would be a guess wearing the
                same dot as a decision.
              </p>
            </>
          )}
        </div>
        )}
      </aside>
    </div>
  );
}

export default CodexAtlasView;
