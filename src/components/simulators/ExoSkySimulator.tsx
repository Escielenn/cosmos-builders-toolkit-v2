import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEntities, useCreateEntity } from "@/hooks/use-entity-graph";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAssertFact, useCanonFacts } from "@/canon/hooks";
import { toExoskyPayload, fromExoskySave } from "@/lib/simulators/exosky-save";
import { evaluateExoSkyFlags, flagDismissKey } from "@/sims/flags";
import { useDismissedFlags } from "@/hooks/use-dismissed-flags";
import { tokens, getToken } from "@/styles/tokens";
import { createFrameLoop, smoothingFor } from "@/lib/sim/frame-loop";
import {
  DEG,
  RAD,
  airmass,
  altAz,
  bvToRGB,
  eqToGal,
  eqXYZtoGalactocentric,
  fromFrame,
  lonLatOf,
  planetRaDec,
  toFrame,
  unitFromRaDec,
  xyzToRaDec,
  type Frame3,
  type Vec3,
} from "@/lib/simulators/astro";
import {
  CATALOGUE_CREDIT,
  indexById,
  loadCatalogue,
  searchCatalogue,
  starLabel,
  type CatalogueStar,
} from "@/lib/simulators/exosky-catalogue";
import {
  ATMO_MODELS,
  STATUS_LABEL,
  VANTAGES,
  hostRadiusSolar,
  teffFromBV,
  type AtmoKey,
  type VantagePreset,
} from "@/lib/simulators/exosky-systems";
import {
  NAKED_EYE_LIMIT,
  catalogueReach,
  circumpolar,
  findPoleStar,
  heliacalRising,
  observeCatalogue,
  planetGeometry,
  poleDriftDeg,
  skyBodies,
  synodicMonthDays,
  type ObservedStars,
  type SkyBody,
  type SkyControls,
  type Source,
} from "@/lib/simulators/exosky-sky";
import {
  applyCatalogueOverrides,
  readGalacticPosition,
  resolveVantage,
  type Placement,
  type WriterOverrides,
} from "@/lib/simulators/exosky-vantage";
import { armNote, computeMilkyWayMap, nearestArm, sampleMilkyWay, type MilkyWayMap } from "@/lib/simulators/exosky-galaxy";
import { FOV_MAX, FOV_MIN, makeCamera, pixelsPerDegree, projectInto, unproject, zoomFov } from "@/lib/simulators/exosky-projection";
import { buildStarChartSvg } from "@/lib/simulators/exosky-chart";
import { briefAsText, skyConditionsBrief } from "@/lib/simulators/exosky-brief";
import {
  canonSkyContext,
  constellationEntityInput,
  constellationFacts,
  galacticPositionFact,
  poleFacts,
  skyReadoutFacts,
  type ExoskyAssert,
} from "@/lib/simulators/exosky-canon";
import {
  CONSTELLATION_COLOURS,
  GROUND_RGB,
  MILKY_WAY_BULGE_RGB,
  MILKY_WAY_DISC_RGB,
  SKY_DAY_RGB,
  SKY_TWILIGHT_RGB,
  SOL_MARKER,
} from "@/lib/palettes/exosky";
import { describeHandoffPlanet, type HandoffPayload } from "@/lib/simulators/handoff";
import { SimulatorTitle } from "@/components/simulators/SimulatorTitle";

// ═══════════════════════════════════════════════════════════════
// EXOSKY 1.9 "True Numbers": the sky from any vantage, then the sky
// over the writer's world.
// StellarForge.tools · © 2025–2026 Jason D. Batt, Ph.D.
//
// What this draws, and where each part's maths lives (all tested):
//   - 30,004 real stars from HYG v4.1, translated to the observer
//     (exosky-catalogue.ts, exosky-sky.ts observeCatalogue).
//   - The observer's own sun as a disc of the right size and brightness,
//     sibling planets and moons with phase (exosky-sky.ts skyBodies).
//   - A real horizon from the planet's pole, rotation and the observer's
//     latitude; time of day, date and precession (astro.ts frames).
//   - Extinction by airmass (Kasten & Young 1989), daylight that hides the
//     stars, twilight.
//   - The Milky Way ray-marched through Reid et al. (2019) spiral arms
//     (exosky-galaxy.ts), in a worker.
//   - Seen from inside the sphere: east on the left facing south
//     (exosky-projection.ts; orientation test pins it).
// ═══════════════════════════════════════════════════════════════

/** Earth's IAU stick figures, by proper name in HYG v4.1 (resolved to ids on load). */
const EARTH_FIGURES: ReadonlyArray<[string, string]> = [
  ["Betelgeuse", "Bellatrix"], ["Betelgeuse", "Alnilam"], ["Bellatrix", "Alnilam"], ["Alnilam", "Alnitak"], ["Alnilam", "Mintaka"],
  ["Alnitak", "Saiph"], ["Mintaka", "Rigel"], ["Betelgeuse", "Meissa"], ["Bellatrix", "Meissa"],
  ["Dubhe", "Merak"], ["Merak", "Phecda"], ["Phecda", "Megrez"], ["Megrez", "Dubhe"], ["Megrez", "Alioth"], ["Alioth", "Mizar"], ["Mizar", "Alkaid"],
  ["Antares", "Dschubba"], ["Antares", "Larawag"], ["Larawag", "Shaula"], ["Shaula", "Sargas"], ["Dschubba", "Acrab"],
  ["Schedar", "Caph"], ["Schedar", "Ruchbah"], ["Ruchbah", "Segin"],
  ["Regulus", "Denebola"], ["Regulus", "Algieba"], ["Algieba", "Zosma"], ["Zosma", "Denebola"],
  ["Markab", "Scheat"], ["Scheat", "Alpheratz"], ["Alpheratz", "Algenib"], ["Algenib", "Markab"],
  ["Vega", "Deneb"], ["Deneb", "Altair"], ["Altair", "Vega"],
  ["Sirius", "Adhara"], ["Sirius", "Mirzam"], ["Adhara", "Wezen"], ["Wezen", "Aludra"],
  ["Castor", "Pollux"], ["Castor", "Alhena"], ["Pollux", "Alhena"],
  ["Acrux", "Gacrux"], ["Mimosa", "Imai"],
  ["Aldebaran", "Elnath"], ["Capella", "Menkalinan"], ["Polaris", "Kochab"], ["Fomalhaut", "Diphda"], ["Spica", "Arcturus"],
];

const PRESET_GROUPS: ReadonlyArray<{ label: string; filter: (v: VantagePreset) => boolean }> = [
  { label: "Home", filter: (v) => v.status === "home" },
  { label: "Confirmed planets", filter: (v) => v.status === "confirmed" },
  { label: "Candidates and disputed", filter: (v) => v.status === "candidate" || v.status === "disputed" },
  { label: "Imagined worlds at real stars", filter: (v) => v.status === "hypothetical" || v.status === "refuted" },
];

const SOURCE_LABEL: Record<Source, string> = {
  canon: "canon",
  preset: "published values",
  handoff: "Solaris",
  catalogue: "HYG catalogue",
  writer: "set here",
  default: "not set",
  derived: "derived",
};

const AZ_NAMES = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const CARDINALS: ReadonlyArray<[string, number]> = [["N", 0], ["NE", 45], ["E", 90], ["SE", 135], ["S", 180], ["SW", 225], ["W", 270], ["NW", 315]];

interface DrawnConstellation {
  id: number;
  name: string;
  color: string;
  visible: boolean;
  starIds: string[];
  /** Legacy (1.8) saves carry positions but no ids. */
  legacyDirs?: Vec3[];
  starNames: string[];
  epochYears: number;
  vantageKey: string | null;
  planetName: string;
  entityId: string | null;
}

/** A vantage seeded from a Solaris handoff. It carries no galactic position. */
interface ExoSkyInitialHandoff {
  payload: HandoffPayload;
}

interface ExoSkyV2Props {
  /** The wrapper's NarrativeBridgePanel is open (320px on the right). */
  narrativeBridgeOpen?: boolean;
  /** World context: its planets, stars and moons become vantages, read through canon. */
  worldId?: string;
  /** Open-on subject (?entity=). Selected as the vantage when it is in the world. */
  subjectEntityId?: string | null;
  /** Open-on epoch (?epoch=), years from J2000. */
  subjectEpoch?: number | null;
  initialHandoff?: ExoSkyInitialHandoff | null;
  onHandoffConsumed?: () => void;
}

const parseRgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** B-V for a temperature, inverting Ballesteros (2012) by bisection. */
function bvFromTeff(t: number): number {
  let lo = -0.4, hi = 2.0;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (teffFromBV(mid) > t) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Naked-eye limiting magnitude against the sky's own brightness, by the
 * host star's altitude: ~6.5 under a dark sky (sun 18° down), ~2.5 at the
 * end of civil twilight, about -4 at noon (only Venus-bright points).
 * Piecewise linear; a working figure, not a sky-brightness model.
 */
function limitingMag(sunAlt: number, hasAir: boolean): number {
  if (!hasAir) return NAKED_EYE_LIMIT;
  if (sunAlt <= -18) return NAKED_EYE_LIMIT;
  if (sunAlt <= -6) return 2.5 + ((-6 - sunAlt) / 12) * 4;
  if (sunAlt <= 0) return -1 + ((0 - sunAlt) / 6) * 3.5;
  return Math.max(-4.5, -1 - sunAlt * 0.35);
}

function fmtHours(h: number): string {
  if (!Number.isFinite(h)) return "never (locked)";
  if (h >= 48) return `${(h / 24).toFixed(1)} days`;
  return `${h.toFixed(2)} h`;
}

function fmtYears(y: number): string {
  if (!Number.isFinite(y)) return "none";
  return `${Math.round(y).toLocaleString()} yr`;
}

export default function ExoSkyV2({
  narrativeBridgeOpen = false,
  initialHandoff = null,
  worldId,
  subjectEntityId = null,
  subjectEpoch = null,
  onHandoffConsumed,
}: ExoSkyV2Props = {}) {
  const { toast } = useToast();
  const { data: worldEntities } = useEntities(worldId);
  const createEntity = useCreateEntity(worldId);
  const { data: canonFacts } = useCanonFacts(worldId);
  const assertFact = useAssertFact(worldId);
  const { dismissedIds: dismissedFlagIds, dismiss: dismissFlag } = useDismissedFlags();
  const isMobile = useIsMobile();

  const worldObservationEntities = useMemo(
    () => (worldEntities ?? []).filter((e) => e.entity_type === "planet" || e.entity_type === "star" || e.entity_type === "moon"),
    [worldEntities],
  );

  // ── Catalogue ────────────────────────────────────────────────────
  const [catalogue, setCatalogue] = useState<CatalogueStar[] | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const loadStars = useCallback(() => {
    setCatalogueError(null);
    loadCatalogue()
      .then((s) => setCatalogue(applyCatalogueOverrides(s.map((x) => ({ ...x })))))
      .catch((e: Error) => setCatalogueError(e.message));
  }, []);
  useEffect(() => { loadStars(); }, [loadStars]);
  const catalogueById = useMemo(() => (catalogue ? indexById(catalogue) : null), [catalogue]);
  const earthFigures = useMemo(() => {
    if (!catalogue) return [] as Array<[number, number]>;
    const byName = new Map<string, number>();
    for (const s of catalogue) if (s.name && !byName.has(s.name)) byName.set(s.name, s.i);
    return EARTH_FIGURES.map(([a, b]) => [byName.get(a), byName.get(b)] as [number | undefined, number | undefined])
      .filter((p): p is [number, number] => p[0] !== undefined && p[1] !== undefined);
  }, [catalogue]);
  const solIndex = useMemo(() => catalogue?.find((s) => s.name === "Sol")?.i ?? -1, [catalogue]);

  // ── Vantage ──────────────────────────────────────────────────────
  // "proxima-b" (a preset key), "custom", "handoff" or "world:<uuid>".
  const [vantageKey, setVantageKey] = useState<string>(() => (initialHandoff ? "handoff" : "proxima-b"));
  const [handoffPayload, setHandoffPayload] = useState<HandoffPayload | null>(initialHandoff?.payload ?? null);
  const [placementDraft, setPlacementDraft] = useState<Omit<Placement, "source"> | null>(null);
  const [overrides, setOverrides] = useState<WriterOverrides>({});
  useEffect(() => {
    if (initialHandoff) onHandoffConsumed?.();
    // Mount-only: a handoff seeds the first view once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Open-on: once the world's entities arrive, the subject becomes the vantage.
  const subjectApplied = useRef(false);
  useEffect(() => {
    if (subjectApplied.current || !subjectEntityId || !worldEntities) return;
    if (worldEntities.some((e) => e.id === subjectEntityId)) {
      subjectApplied.current = true;
      setVantageKey(`world:${subjectEntityId}`);
    }
  }, [subjectEntityId, worldEntities]);

  const worldEntityId = vantageKey.startsWith("world:") ? vantageKey.slice(6) : null;
  const worldEntity = useMemo(() => worldObservationEntities.find((e) => e.id === worldEntityId) ?? null, [worldObservationEntities, worldEntityId]);
  const preset = useMemo(() => VANTAGES.find((v) => v.key === vantageKey) ?? null, [vantageKey]);
  const canonSky = useMemo(
    () => (worldEntityId && worldEntities ? canonSkyContext(worldEntities, canonFacts ?? [], worldEntityId) : null),
    [worldEntityId, worldEntities, canonFacts],
  );

  /** Placement in canon (star.galactic_position), or the 1.8 metadata.exoskyCoords fallback. */
  const canonPlacement = useMemo<Placement | null>(() => {
    if (!canonSky) return null;
    const fromFacts = readGalacticPosition(canonSky.starFacts["star.galactic_position"]) ?? readGalacticPosition(canonSky.planet["star.galactic_position"]);
    if (fromFacts) return { ...fromFacts, source: "canon" };
    for (const e of [canonSky.subject, canonSky.star]) {
      const c = (e?.metadata as { exoskyCoords?: { ra?: number; dec?: number; distancePc?: number } } | null)?.exoskyCoords;
      if (c && typeof c.ra === "number" && typeof c.dec === "number" && typeof c.distancePc === "number") {
        const v = unitFromRaDec(c.ra, c.dec);
        const g = eqToGal(v[0], v[1], v[2]);
        return { l: ((Math.atan2(g[1], g[0]) * RAD) + 360) % 360, b: Math.asin(g[2]) * RAD, distPc: c.distancePc, source: "canon" };
      }
    }
    return null;
  }, [canonSky]);

  const placement: Placement | null = placementDraft
    ? { ...placementDraft, source: "writer" }
    : vantageKey === "custom"
      ? { l: 0, b: 0, distPc: 100, source: "writer" }
      : worldEntityId ? canonPlacement : null;

  const resolved = useMemo(
    () => resolveVantage({
      preset: vantageKey === "custom" || vantageKey === "handoff" || worldEntityId ? null : preset,
      catalogue,
      catalogueById,
      canon: canonSky ? { label: canonSky.label, planet: canonSky.planet, star: canonSky.starFacts, siblings: canonSky.siblings, moons: canonSky.moons } : null,
      handoff: vantageKey === "handoff" ? handoffPayload : null,
      placement,
      overrides,
    }),
    // placement is rebuilt each render from stable inputs; key it by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vantageKey, preset, catalogue, catalogueById, canonSky, handoffPayload, JSON.stringify(placement), overrides, worldEntityId],
  );
  const unplaced = resolved.position === null;
  const observer: Vec3 = resolved.position?.value ?? [0, 0, 0];
  const atmo = ATMO_MODELS[resolved.atmo.value];

  // ── Controls ─────────────────────────────────────────────────────
  const [mode, setMode] = useState<"stand" | "space">("stand");
  const [latitude, setLatitude] = useState(30);
  const [timeOfDay, setTimeOfDay] = useState(0);
  const [substellarLongitude, setSubstellarLongitude] = useState(150);
  const [dayNumber, setDayNumber] = useState(0);
  const [epochYears, setEpochYears] = useState(subjectEpoch ?? 0);
  const [atmoDensity, setAtmoDensity] = useState(1);
  const [mwBrightness, setMwBrightness] = useState(1);
  const [showMilkyWay, setShowMilkyWay] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [showStarNames, setShowStarNames] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [highlightSol, setHighlightSol] = useState(true);
  const [showCustomConstellations, setShowCustomConstellations] = useState(true);
  const controls: SkyControls = useMemo(
    () => ({ latitude, timeOfDay, substellarLongitude, dayNumber, epochYears }),
    [latitude, timeOfDay, substellarLongitude, dayNumber, epochYears],
  );

  // ── View (refs during gestures, state at rest) ──────────────────
  const [view, setView] = useState({ lon: 180, lat: 25, fov: 100 });
  const viewRef = useRef({ lon: 180, lat: 25, fov: 100 });
  const fovTargetRef = useRef(100);
  const syncedView = useRef(view);
  if (syncedView.current !== view) {
    syncedView.current = view;
    viewRef.current.lon = view.lon;
    viewRef.current.lat = view.lat;
    fovTargetRef.current = view.fov;
  }
  const publishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishView = useCallback(() => {
    if (publishTimer.current) clearTimeout(publishTimer.current);
    publishTimer.current = setTimeout(() => {
      publishTimer.current = null;
      const v = viewRef.current;
      syncedView.current = { lon: v.lon, lat: v.lat, fov: fovTargetRef.current };
      setView(syncedView.current);
    }, 160);
  }, []);
  const changeMode = useCallback((m: "stand" | "space") => {
    setMode(m);
    setView(m === "stand" ? { lon: 180, lat: 25, fov: 100 } : { lon: 0, lat: 0, fov: 90 });
  }, []);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReducedMotion(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);

  // ── Derived sky ──────────────────────────────────────────────────
  const obs: ObservedStars | null = useMemo(
    () => (catalogue ? observeCatalogue(catalogue, observer) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogue, observer[0], observer[1], observer[2]],
  );
  const geometry = useMemo(() => planetGeometry(resolved, controls), [resolved, controls]);
  const hostRadius = useMemo(
    () => hostRadiusSolar({ absMag: resolved.host.absMag.value, teffK: resolved.host.teffK.value, lumSolar: resolved.host.lumSolar.value, massSolar: resolved.host.massSolar.value }),
    [resolved],
  );
  const bodies = useMemo(() => skyBodies(resolved, geometry, controls, hostRadius), [resolved, geometry, controls, hostRadius]);
  const hostBody = bodies.find((b) => b.kind === "host") ?? null;
  const hostAltAz = useMemo(() => altAz(geometry.horizon, geometry.hostDir), [geometry]);
  const kEff = showAtmosphere && mode === "stand" ? atmo.k * atmoDensity : 0;
  const frame: Frame3 = mode === "stand" ? geometry.horizon : geometry.eqFrame;
  const reach = catalogueReach(obs?.observerFromSunPc ?? 0);
  const poleStar = useMemo(() => (obs ? findPoleStar(obs, geometry.pole) : null), [obs, geometry.pole]);
  const southPoleStar = useMemo(() => (obs ? findPoleStar(obs, [-geometry.pole[0], -geometry.pole[1], -geometry.pole[2]]) : null), [obs, geometry.pole]);
  const circ = useMemo(() => (obs ? circumpolar(obs, geometry.pole, latitude) : null), [obs, geometry.pole, latitude]);
  const brightestStar = obs && obs.index.length ? obs.index[0] : -1;
  // Depends on latitude and epoch, not on the time of day: a scan of a whole
  // year should not rerun while the writer scrubs an hour.
  const heliacal = useMemo(() => {
    if (!obs || brightestStar < 0 || mode !== "stand") return null;
    const i = brightestStar;
    return heliacalRising(resolved, { latitude, epochYears, timeOfDay: 0, substellarLongitude: 0, dayNumber: 0 }, [obs.ux[i], obs.uy[i], obs.uz[i]], obs.mag[i]);
  }, [obs, brightestStar, resolved, latitude, epochYears, mode]);
  const solData = useMemo(() => {
    if (!obs || solIndex < 0 || obs.ownStar === solIndex) return null;
    return { mag: obs.mag[solIndex], dist: obs.dist[solIndex], dir: [obs.ux[solIndex], obs.uy[solIndex], obs.uz[solIndex]] as Vec3 };
  }, [obs, solIndex]);
  const gc = useMemo(() => eqXYZtoGalactocentric(observer[0], observer[1], observer[2]), [observer]);
  const arm = useMemo(() => nearestArm(gc[0], gc[1]), [gc]);

  // ── Milky Way map (worker) ──────────────────────────────────────
  const mwMapRef = useRef<MilkyWayMap | null>(null);
  const [mwVersion, setMwVersion] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const mwRequest = useRef(0);
  useEffect(() => {
    const id = ++mwRequest.current;
    mwMapRef.current = null;
    setMwVersion((v) => v + 1);
    let fallback: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!workerRef.current) workerRef.current = new Worker(new URL("../../lib/simulators/exosky-mw.worker.ts", import.meta.url), { type: "module" });
      workerRef.current.onmessage = (e: MessageEvent<{ id: number; brightness: Float32Array; dust: Float32Array }>) => {
        if (e.data.id !== mwRequest.current) return;
        mwMapRef.current = { brightness: e.data.brightness, dust: e.data.dust };
        setMwVersion((v) => v + 1);
      };
      workerRef.current.postMessage({ id, gc: [gc[0], gc[1], gc[2]] });
    } catch {
      fallback = setTimeout(() => {
        if (id !== mwRequest.current) return;
        mwMapRef.current = computeMilkyWayMap(gc[0], gc[1], gc[2]);
        setMwVersion((v) => v + 1);
      }, 30);
    }
    return () => { if (fallback) clearTimeout(fallback); };
  }, [gc]);
  useEffect(() => () => { workerRef.current?.terminate(); workerRef.current = null; }, []);
  const mwReady = mwMapRef.current !== null;

  // ── Constellations ───────────────────────────────────────────────
  const [drawMode, setDrawMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<number[]>([]);
  const [customConstellations, setCustomConstellations] = useState<DrawnConstellation[]>([]);
  const [drawColor, setDrawColor] = useState(CONSTELLATION_COLOURS[0].hex);
  const [namingMode, setNamingMode] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [consManagerOpen, setConsManagerOpen] = useState(false);
  /** A constellation belongs to the vantage it was drawn from (E14). */
  const vantageConstellations = useMemo(
    () => customConstellations.filter((c) => (c.vantageKey ? c.vantageKey === vantageKey : c.planetName === resolved.label)),
    [customConstellations, vantageKey, resolved.label],
  );

  // ── Selection, search ────────────────────────────────────────────
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const results = useMemo(() => (catalogue ? searchCatalogue(catalogue, query) : []), [catalogue, query]);
  const [placeQuery, setPlaceQuery] = useState("");
  const placeResults = useMemo(() => (catalogue ? searchCatalogue(catalogue, placeQuery, 6) : []), [catalogue, placeQuery]);

  const aimAt = useCallback((dir: Vec3, fov?: number) => {
    const { lon, lat } = lonLatOf(toFrame(frame, dir));
    setView((v) => ({ lon, lat, fov: fov ?? Math.min(v.fov, 60) }));
  }, [frame]);

  // ── Panels ───────────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);
  const [sheet, setSheet] = useState<"none" | "controls" | "data">("none");
  const [briefOpen, setBriefOpen] = useState(false);
  const [showKbHelp, setShowKbHelp] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [conflicts, setConflicts] = useState<ExoskyAssert[]>([]);

  // ── Flags ────────────────────────────────────────────────────────
  const driftDeg = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of vantageConstellations) out[c.name] = poleDriftDeg(resolved.planet.obliquityDeg.value, resolved.planet.precessionYears.value, c.epochYears, epochYears);
    for (const c of canonSky?.constellations ?? []) {
      if (c.epoch !== null) out[c.entity.name] = poleDriftDeg(resolved.planet.obliquityDeg.value, resolved.planet.precessionYears.value, c.epoch, epochYears);
    }
    return out;
  }, [vantageConstellations, canonSky, resolved, epochYears]);
  const simFlags = useMemo(() => evaluateExoSkyFlags({
    visibleCount: obs?.nakedEye ?? 9999,
    catalogueComplete: reach.complete && !unplaced,
    constellations: [
      ...vantageConstellations.map((c) => ({ name: c.name, epochYears: c.epochYears })),
      ...(canonSky?.constellations ?? []).filter((c) => c.epoch !== null).map((c) => ({ name: c.entity.name, epochYears: c.epoch as number })),
    ],
    epochYears,
    driftDeg,
    precessionYears: resolved.planet.precessionYears.value,
  }), [obs, reach.complete, unplaced, vantageConstellations, canonSky, epochYears, driftDeg, resolved]);

  // ── Scene ref for the render loop ───────────────────────────────
  const tokensRef = useRef<{ line: string; lineSoft: string; primary: string; t1: string; t2: string; t3: string } | null>(null);
  useEffect(() => {
    const rgb = (n: string, fallback: string) => {
      const v = getToken(n);
      return v ? `rgb(${v})` : fallback;
    };
    tokensRef.current = {
      line: rgb("--sf-line-interactive-rgb", tokens.text.t4),
      lineSoft: rgb("--sf-line-rgb", tokens.text.t4),
      primary: rgb("--sf-primary-rgb", tokens.accent.base),
      t1: tokens.text.t1,
      t2: tokens.text.t2,
      t3: tokens.text.t3,
    };
  }, []);

  const scene = {
    frame, mode, geometry, obs, catalogue, bodies, kEff, atmoKey: resolved.atmo.value,
    showMilkyWay, showHorizon, showStarNames, showConstellations, showGrid, highlightSol, showCustomConstellations,
    mwBrightness, earthFigures, solIndex, vantageConstellations, catalogueById, drawMode, currentDrawing, drawColor,
    selected, hovered, hostAlt: hostAltAz.alt, reducedMotion, mwVersion, hostTeff: resolved.host.teffK.value,
    geometryKey: `${geometry.sidereal.toFixed(4)}|${latitude}|${epochYears}|${vantageKey}|${resolved.atmo.value}|${mode}`,
  };
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  // ── Canvas ───────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dprRef = useRef(1);
  const bgRef = useRef<{ canvas: HTMLCanvasElement | null; key: string }>({ canvas: null, key: "" });
  const positions = useRef<number[]>([]); // [catalogueIndex, x, y, ...]
  const bodyPositions = useRef<Array<{ id: string; x: number; y: number; r: number }>>([]);
  const lastMove = useRef(0);
  const drawnCount = useRef(0);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const S = sceneRef.current;
    const tk = tokensRef.current;
    if (!canvas || !tk) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    if (W < 2 || H < 2) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = viewRef.current;
    const cam = makeCamera(S.frame, v.lon, v.lat, v.fov, W, H);
    const stand = S.mode === "stand";
    const zen = S.geometry.horizon[2];
    const hostDir = S.geometry.hostDir;
    const sunAlt = S.hostAlt;
    const hasAir = stand && S.kEff > 0;
    const limit = limitingMag(stand ? sunAlt : -90, hasAir);
    const t = time * 0.001;

    // ── 1. Sky, Milky Way and ground, one low-resolution pass ─────
    const moving = performance.now() - lastMove.current < 180;
    const q = moving ? 6 : 3;
    const key = `${v.lon.toFixed(3)}|${v.lat.toFixed(3)}|${v.fov.toFixed(3)}|${W}|${H}|${q}|${S.geometryKey}|${S.kEff}|${S.showMilkyWay}|${S.showHorizon}|${S.mwBrightness}|${S.mwVersion}|${sunAlt.toFixed(2)}`;
    if (bgRef.current.key !== key) {
      const bw = Math.ceil(W / q), bh = Math.ceil(H / q);
      let off = bgRef.current.canvas;
      if (!off) off = bgRef.current.canvas = document.createElement("canvas");
      if (off.width !== bw || off.height !== bh) { off.width = bw; off.height = bh; }
      const octx = off.getContext("2d")!;
      const img = octx.createImageData(bw, bh);
      const data = img.data;
      const [br, bg, bb] = parseRgb(tokens.surface.simCanvas);
      const map = S.showMilkyWay ? mwMapRef.current : null;
      const day = hasAir ? clamp((sunAlt + 4) / 14, 0, 1) : 0;
      const twi = hasAir ? clamp(1 - Math.abs(sunAlt + 5) / 13, 0, 1) : 0;
      const nightFactor = hasAir ? clamp((-sunAlt - 4) / 12, 0, 1) : 1;
      const dayRgb = SKY_DAY_RGB[S.atmoKey as AtmoKey];
      const twRgb = SKY_TWILIGHT_RGB[S.atmoKey as AtmoKey];
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const d = unproject(cam, x * q + q / 2, y * q + q / 2);
          const o = (y * bw + x) * 4;
          let r = br, g = bg, b = bb;
          const sinAlt = stand ? d[0] * zen[0] + d[1] * zen[1] + d[2] * zen[2] : 1;
          if (stand && S.showHorizon && sinAlt < 0) {
            const lit = 0.25 + day * 2.5;
            data[o] = GROUND_RGB[0] * lit; data[o + 1] = GROUND_RGB[1] * lit; data[o + 2] = GROUND_RGB[2] * lit; data[o + 3] = 255;
            continue;
          }
          const altDeg = Math.asin(clamp(sinAlt, -1, 1)) * RAD;
          const trans = hasAir ? Math.pow(10, -0.4 * S.kEff * airmass(Math.max(0, altDeg))) : 1;
          if (map && nightFactor > 0) {
            const gl = eqToGal(d[0], d[1], d[2]);
            const lRad = Math.atan2(gl[1], gl[0]);
            const bRad = Math.asin(clamp(gl[2], -1, 1));
            const mw = sampleMilkyWay(map.brightness, lRad, bRad) * S.mwBrightness * trans * nightFactor;
            if (mw > 0.002) {
              const bulge = 0.5 + 0.5 * Math.cos(lRad);
              const a = Math.min(0.42, mw * 0.5);
              r += (MILKY_WAY_DISC_RGB[0] * (1 - bulge) + MILKY_WAY_BULGE_RGB[0] * bulge) * a;
              g += (MILKY_WAY_DISC_RGB[1] * (1 - bulge) + MILKY_WAY_BULGE_RGB[1] * bulge) * a;
              b += (MILKY_WAY_DISC_RGB[2] * (1 - bulge) + MILKY_WAY_BULGE_RGB[2] * bulge) * a;
            }
          }
          if (hasAir) {
            const toSun = d[0] * hostDir[0] + d[1] * hostDir[1] + d[2] * hostDir[2];
            // Brighter toward the horizon (more air) and toward the sun.
            const horizonGain = 0.55 + 0.45 * (1 - Math.max(0, sinAlt));
            const sunGain = 0.7 + 0.6 * Math.pow(Math.max(0, toSun), 6);
            const dayA = day * horizonGain * sunGain * Math.min(1, S.kEff / 0.2);
            const twA = twi * Math.exp(-Math.max(0, altDeg) / 9) * (0.25 + 0.75 * Math.pow((toSun + 1) / 2, 3)) * Math.min(1, S.kEff / 0.15);
            r = r * (1 - dayA) + dayRgb[0] * dayA + twRgb[0] * twA * 0.8;
            g = g * (1 - dayA) + dayRgb[1] * dayA + twRgb[1] * twA * 0.8;
            b = b * (1 - dayA) + dayRgb[2] * dayA + twRgb[2] * twA * 0.8;
          }
          data[o] = Math.min(255, r); data[o + 1] = Math.min(255, g); data[o + 2] = Math.min(255, b); data[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      bgRef.current.key = key;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bgRef.current.canvas!, 0, 0, W, H);

    const aboveGround = (sx: number, sy: number, sz: number) => !stand || !S.showHorizon || sx * zen[0] + sy * zen[1] + sz * zen[2] >= 0;
    const extinction = (sx: number, sy: number, sz: number) => {
      if (!hasAir) return 0;
      const sa = sx * zen[0] + sy * zen[1] + sz * zen[2];
      return S.kEff * airmass(Math.max(0, Math.asin(clamp(sa, -1, 1)) * RAD));
    };

    // ── 2. Grid ───────────────────────────────────────────────────
    if (S.showGrid) {
      ctx.strokeStyle = tk.lineSoft;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      const line = (pts: Vec3[]) => {
        ctx.beginPath();
        let on = false;
        for (const p of pts) {
          if (projectInto(cam, p[0], p[1], p[2], 200)) { if (on) ctx.lineTo(cam.x, cam.y); else ctx.moveTo(cam.x, cam.y); on = true; } else on = false;
        }
        ctx.stroke();
      };
      for (let lat = -60; lat <= 60; lat += 30) {
        const pts: Vec3[] = [];
        for (let lon = 0; lon <= 360; lon += 4) pts.push(fromFrame(S.frame, [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)]));
        line(pts);
      }
      for (let lon = 0; lon < 360; lon += stand ? 45 : 30) {
        const pts: Vec3[] = [];
        for (let lat = -88; lat <= 88; lat += 4) pts.push(fromFrame(S.frame, [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)]));
        line(pts);
      }
      ctx.setLineDash([]);
    }

    const o = S.obs;
    // ── 3. Earth's stick figures, deformed by the vantage ─────────
    if (o && S.showConstellations) {
      ctx.strokeStyle = tk.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      for (const [a, b] of S.earthFigures) {
        if (Number.isNaN(o.mag[a]) || Number.isNaN(o.mag[b])) continue;
        if (!aboveGround(o.ux[a], o.uy[a], o.uz[a]) || !aboveGround(o.ux[b], o.uy[b], o.uz[b])) continue;
        if (!projectInto(cam, o.ux[a], o.uy[a], o.uz[a], 400)) continue;
        const ax = cam.x, ay = cam.y;
        if (!projectInto(cam, o.ux[b], o.uy[b], o.uz[b], 400)) continue;
        if (Math.hypot(cam.x - ax, cam.y - ay) > Math.max(W, H)) continue;
        ctx.moveTo(ax, ay); ctx.lineTo(cam.x, cam.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── 4. Stars ──────────────────────────────────────────────────
    const pos = positions.current;
    pos.length = 0;
    let drawn = 0;
    // Labels claim a box; a later (fainter) label that would overlap is skipped.
    const placed: number[] = [];
    const claim = (x: number, y: number, w: number, h: number) => {
      for (let k = 0; k < placed.length; k += 4) {
        if (x < placed[k] + placed[k + 2] && x + w > placed[k] && y < placed[k + 1] + placed[k + 3] && y + h > placed[k + 1]) return false;
      }
      placed.push(x, y, w, h);
      return true;
    };
    if (o && S.catalogue) {
      const zoomBoost = clamp(Math.log10(Math.max(1, 30 / Math.max(0.5, v.fov))) * 1.2, 0, 2.5);
      const effLimit = limit + zoomBoost;
      const batches = new Map<string, number[]>();
      ctx.font = '12px "DM Sans", sans-serif';
      ctx.textAlign = "left";
      for (let k = 0; k < o.index.length && drawn < 14000; k++) {
        const i = o.index[k];
        const m = o.mag[i];
        if (m > effLimit) break; // sorted brightest first; extinction only adds
        const sx = o.ux[i], sy = o.uy[i], sz = o.uz[i];
        if (!aboveGround(sx, sy, sz)) continue;
        const eMag = m + extinction(sx, sy, sz);
        if (eMag > effLimit) continue;
        if (!projectInto(cam, sx, sy, sz, 20)) continue;
        const st = S.catalogue[i];
        const [r, g, b] = bvToRGB(st.bv);
        let alpha = clamp((effLimit + 0.8 - eMag) / 2.4, 0.32, 1);
        if (hasAir && !S.reducedMotion) {
          const xm = Math.min(6, airmass(Math.max(0, Math.asin(clamp(sx * zen[0] + sy * zen[1] + sz * zen[2], -1, 1)) * RAD)));
          alpha *= 1 - 0.06 * (xm - 1) * (0.5 + 0.5 * Math.sin(t * 7 + i * 1.7));
        }
        const rad = clamp(3.4 - 0.5 * (eMag - zoomBoost), 0.7, 5.5);
        if (rad < 1.3) {
          const qa = Math.round(alpha * 10) / 10;
          const style = `rgba(${(r >> 4) << 4},${(g >> 4) << 4},${(b >> 4) << 4},${qa})`;
          let arr = batches.get(style);
          if (!arr) { arr = []; batches.set(style, arr); }
          arr.push(cam.x - rad, cam.y - rad, rad * 2);
        } else {
          if (eMag < 1.2) {
            const glowR = rad * (eMag < -0.5 ? 7 : 4.5);
            const grad = ctx.createRadialGradient(cam.x, cam.y, rad * 0.5, cam.x, cam.y, glowR);
            grad.addColorStop(0, `rgba(${r},${g},${b},${0.22 * alpha})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(cam.x - glowR, cam.y - glowR, glowR * 2, glowR * 2);
          }
          ctx.beginPath();
          ctx.arc(cam.x, cam.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
        }
        if (eMag < 6.5 && pos.length < 24000) pos.push(i, cam.x, cam.y);
        if (S.showStarNames && st.name && st.name !== "Sol" && eMag < (v.fov < 25 ? 4.8 : v.fov < 60 ? 3.2 : 2.2)) {
          const lw = ctx.measureText(st.name).width;
          if (claim(cam.x + rad + 3, cam.y - 8, lw + 2, 14)) {
            ctx.fillStyle = tk.t2;
            ctx.fillText(st.name, cam.x + rad + 4, cam.y + 4);
          }
        }
        drawn++;
      }
      for (const [style, arr] of batches) {
        ctx.fillStyle = style;
        for (let k = 0; k < arr.length; k += 3) ctx.fillRect(arr[k], arr[k + 1], arr[k + 2], arr[k + 2]);
      }
    }
    drawnCount.current = drawn;

    // ── 5. Bodies: host star, planets, moons ─────────────────────
    const bp = bodyPositions.current;
    bp.length = 0;
    const ppd = pixelsPerDegree(cam);
    for (const body of S.bodies) {
      const d = body.dir;
      if (!aboveGround(d[0], d[1], d[2])) continue;
      const eMag = body.mag + extinction(d[0], d[1], d[2]);
      if (body.kind !== "host" && eMag > limit + 1) continue;
      if (!projectInto(cam, d[0], d[1], d[2], 60)) continue;
      const discR = (body.sizeDeg / 2) * ppd;
      if (body.kind === "host") {
        const [r, g, b] = bvToRGB(bvFromTeff(S.hostTeff));
        const rr = Math.max(3, discR);
        const glowR = rr * 6 + 18;
        const grad = ctx.createRadialGradient(cam.x, cam.y, rr * 0.8, cam.x, cam.y, glowR);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cam.x - glowR, cam.y - glowR, glowR * 2, glowR * 2);
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})`;
        ctx.fill();
        bp.push({ id: body.id, x: cam.x, y: cam.y, r: rr });
      } else {
        const rr = Math.max(1.6, discR);
        const bx = cam.x, by = cam.y;
        if (rr >= 4) {
          // Phase: the lit limb faces the host star on screen.
          const toward: Vec3 = [d[0] + (hostDir[0] - d[0]) * 0.02, d[1] + (hostDir[1] - d[1]) * 0.02, d[2] + (hostDir[2] - d[2]) * 0.02];
          let ang = 0;
          if (projectInto(cam, toward[0], toward[1], toward[2], 100000)) ang = Math.atan2(cam.y - by, cam.x - bx);
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(ang);
          ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fillStyle = "rgb(28,28,32)"; ctx.fill();
          const tx = (1 - 2 * body.phase) * rr;
          ctx.beginPath();
          ctx.arc(0, 0, rr, -Math.PI / 2, Math.PI / 2, false);
          ctx.ellipse(0, 0, Math.abs(tx), rr, 0, Math.PI / 2, tx < 0 ? (3 * Math.PI) / 2 : -Math.PI / 2, tx >= 0);
          ctx.fillStyle = "rgb(236,232,222)";
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(bx, by, rr, 0, Math.PI * 2); ctx.fillStyle = "rgb(240,236,226)"; ctx.fill();
        }
        bp.push({ id: body.id, x: bx, y: by, r: rr });
        ctx.font = '12px "DM Sans", sans-serif';
        ctx.fillStyle = tk.t1;
        ctx.textAlign = "left";
        ctx.fillText(body.name, bx + rr + 5, by - 4);
      }
    }

    // ── 6. Sol ────────────────────────────────────────────────────
    if (o && S.highlightSol && S.solIndex >= 0 && !Number.isNaN(o.mag[S.solIndex])) {
      const i = S.solIndex;
      if (aboveGround(o.ux[i], o.uy[i], o.uz[i]) && projectInto(cam, o.ux[i], o.uy[i], o.uz[i], 20)) {
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = SOL_MARKER;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = '12px "DM Sans", sans-serif';
        ctx.fillStyle = SOL_MARKER;
        ctx.textAlign = "center";
        ctx.fillText("Sun", cam.x, cam.y - 14);
      }
    }

    // ── 7. The writer's constellations, for this vantage only ────
    const dirOfId = (id: string): Vec3 | null => {
      const s = S.catalogueById?.get(id);
      if (!s || !o || Number.isNaN(o.mag[s.i])) return null;
      return [o.ux[s.i], o.uy[s.i], o.uz[s.i]];
    };
    if (S.showCustomConstellations) {
      for (const c of S.vantageConstellations) {
        if (!c.visible) continue;
        const dirs = c.starIds.length ? c.starIds.map(dirOfId) : (c.legacyDirs ?? []);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let prev: { x: number; y: number } | null = null;
        let cx = 0, cy = 0, cn = 0;
        for (const d of dirs) {
          if (!d || !projectInto(cam, d[0], d[1], d[2], 400)) { prev = null; continue; }
          if (prev && Math.hypot(cam.x - prev.x, cam.y - prev.y) < Math.max(W, H)) { ctx.moveTo(prev.x, prev.y); ctx.lineTo(cam.x, cam.y); }
          prev = { x: cam.x, y: cam.y };
          cx += cam.x; cy += cam.y; cn++;
        }
        ctx.stroke();
        if (cn > 0 && v.fov < 140) {
          ctx.font = '12px "DM Sans", sans-serif';
          ctx.fillStyle = c.color;
          ctx.textAlign = "center";
          ctx.fillText(c.name, cx / cn, cy / cn - 14);
        }
      }
    }
    if (S.drawMode && o) {
      ctx.strokeStyle = S.drawColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      let first = true;
      S.currentDrawing.forEach((i) => {
        if (!projectInto(cam, o.ux[i], o.uy[i], o.uz[i], 400)) { first = true; return; }
        if (first) ctx.moveTo(cam.x, cam.y); else ctx.lineTo(cam.x, cam.y);
        first = false;
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = S.drawColor;
      ctx.textAlign = "center";
      S.currentDrawing.forEach((i, n) => {
        if (projectInto(cam, o.ux[i], o.uy[i], o.uz[i], 0)) {
          ctx.beginPath(); ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2); ctx.strokeStyle = S.drawColor; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillText(String(n + 1), cam.x, cam.y - 10);
        }
      });
    }

    // ── 8. Horizon and compass ───────────────────────────────────
    if (stand) {
      const h = S.geometry.horizon;
      ctx.strokeStyle = tk.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      let on = false;
      for (let az = 0; az <= 360; az += 2) {
        const d = fromFrame(h, [Math.cos(az * DEG), -Math.sin(az * DEG), 0]);
        if (projectInto(cam, d[0], d[1], d[2], 200)) { if (on) ctx.lineTo(cam.x, cam.y); else ctx.moveTo(cam.x, cam.y); on = true; } else on = false;
      }
      ctx.stroke();
      ctx.font = '14px "DM Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = tk.t1;
      for (const [label, az] of CARDINALS) {
        const d = fromFrame(h, [Math.cos(az * DEG) * Math.cos(2 * DEG), -Math.sin(az * DEG) * Math.cos(2 * DEG), Math.sin(2 * DEG)]);
        if (projectInto(cam, d[0], d[1], d[2], 0)) ctx.fillText(label, cam.x, cam.y - 4);
      }
    }

    // ── 9. Selection ──────────────────────────────────────────────
    const mark = (i: number | null, solid: boolean) => {
      if (i === null || !o || Number.isNaN(o.mag[i])) return;
      if (!projectInto(cam, o.ux[i], o.uy[i], o.uz[i], 0)) return;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
      ctx.strokeStyle = tk.primary;
      ctx.lineWidth = solid ? 1.5 : 1;
      if (!solid) ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    mark(S.hovered, false);
    mark(S.selected, true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };
    resize();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => { if (timer) clearTimeout(timer); timer = setTimeout(resize, 80); };
    window.addEventListener("resize", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(canvas);
    const loop = createFrameLoop({
      target: canvas,
      render: ({ time, dt }) => {
        const v = viewRef.current;
        const gap = fovTargetRef.current - v.fov;
        if (gap !== 0) {
          const reduce = sceneRef.current.reducedMotion;
          v.fov = reduce || Math.abs(gap) < 0.01 * v.fov ? fovTargetRef.current : v.fov + gap * smoothingFor(dt);
          lastMove.current = performance.now();
        }
        render(time);
      },
    });
    loop.start();
    return () => {
      loop.stop();
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      if (timer) clearTimeout(timer);
      if (publishTimer.current) clearTimeout(publishTimer.current);
    };
  }, [render]);

  // ── Picking ──────────────────────────────────────────────────────
  const pick = useCallback((mx: number, my: number, radius: number): number | null => {
    const p = positions.current;
    let best: number | null = null, bd = radius * radius;
    for (let k = 0; k < p.length; k += 3) {
      const dx = p[k + 1] - mx, dy = p[k + 2] - my;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = p[k]; }
    }
    return best;
  }, []);

  // ── Pointer: drag, pinch, tap ────────────────────────────────────
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragging = useRef(false);
  const downAt = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const lastHover = useRef(0);
  const localXY = (e: React.PointerEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, w: box.width };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = localXY(e);
    if (pointers.current.size === 1) {
      dragging.current = true;
      downAt.current = { x: p.x, y: p.y };
      last.current = { x: p.x, y: p.y };
    } else if (pointers.current.size === 2) {
      dragging.current = false;
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = localXY(e);
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current > 0 && d > 0) {
        // Ref-only during the gesture (E17): React hears about it at rest.
        fovTargetRef.current = zoomFov(fovTargetRef.current, pinchDist.current / d);
        viewRef.current.fov = fovTargetRef.current;
        lastMove.current = performance.now();
      }
      pinchDist.current = d;
      return;
    }
    if (e.pointerType === "mouse" && !dragging.current) {
      const now = performance.now();
      if (now - lastHover.current > 80) {
        lastHover.current = now;
        setHovered(pick(p.x, p.y, 16));
      }
    }
    if (!dragging.current) return;
    const dx = p.x - last.current.x, dy = p.y - last.current.y;
    last.current = { x: p.x, y: p.y };
    if (Math.hypot(p.x - downAt.current.x, p.y - downAt.current.y) < 6) return;
    // Grab the sky: it follows the pointer. Longitude grows to the LEFT
    // (we are inside the sphere), so a rightward drag increases it.
    const degPerPx = viewRef.current.fov / Math.max(1, p.w);
    viewRef.current.lon = ((viewRef.current.lon + dx * degPerPx) % 360 + 360) % 360;
    viewRef.current.lat = clamp(viewRef.current.lat + dy * degPerPx, -90, 90);
    lastMove.current = performance.now();
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localXY(e);
    const wasTap = pointers.current.size === 1 && Math.hypot(p.x - downAt.current.x, p.y - downAt.current.y) < 6;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
    dragging.current = false;
    publishView();
    if (!wasTap) return;
    const hit = pick(p.x, p.y, e.pointerType === "touch" ? 28 : 18);
    if (drawMode && !namingMode) {
      if (hit !== null) setCurrentDrawing((prev) => (prev[prev.length - 1] === hit ? prev : [...prev, hit]));
      return;
    }
    setSelected(hit);
  };
  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    fovTargetRef.current = zoomFov(fovTargetRef.current, e.deltaY > 0 ? 1.15 : 1 / 1.15);
    publishView();
  };
  // A non-passive wheel listener, so the page does not scroll under the sky.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const stop = (ev: WheelEvent) => ev.preventDefault();
    c.addEventListener("wheel", stop, { passive: false });
    return () => c.removeEventListener("wheel", stop);
  }, []);

  // ── Keyboard (E19) ───────────────────────────────────────────────
  const onCanvasKey = (e: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const step = viewRef.current.fov / 10;
    let handled = true;
    switch (e.key) {
      case "ArrowLeft": viewRef.current.lon = (viewRef.current.lon + step) % 360; break;
      case "ArrowRight": viewRef.current.lon = (viewRef.current.lon - step + 360) % 360; break;
      case "ArrowUp": viewRef.current.lat = clamp(viewRef.current.lat + step, -90, 90); break;
      case "ArrowDown": viewRef.current.lat = clamp(viewRef.current.lat - step, -90, 90); break;
      case "+": case "=": fovTargetRef.current = zoomFov(fovTargetRef.current, 1 / 1.25); break;
      case "-": case "_": fovTargetRef.current = zoomFov(fovTargetRef.current, 1.25); break;
      default: handled = false;
    }
    if (handled) {
      e.preventDefault();
      lastMove.current = performance.now();
      publishView();
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape" && namingMode) { setNamingMode(false); setConstellationName(""); }
        return;
      }
      if (e.key === "?") { setShowKbHelp((p) => !p); return; }
      if (e.key === "Escape") {
        if (showKbHelp) { setShowKbHelp(false); return; }
        if (briefOpen) { setBriefOpen(false); return; }
        if (namingMode) { setNamingMode(false); setConstellationName(""); return; }
        if (drawMode) { setCurrentDrawing([]); setDrawMode(false); return; }
        setSelected(null);
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && drawMode) { e.preventDefault(); setCurrentDrawing((p) => p.slice(0, -1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawMode, namingMode, showKbHelp, briefOpen]);

  // Announce the view at rest (aria-live), so a screen-reader user knows where they look.
  useEffect(() => {
    const fovTxt = view.fov < 10 ? view.fov.toFixed(1) : Math.round(view.fov).toString();
    if (mode === "stand") {
      const az = (360 - view.lon) % 360;
      setAnnounce(`Facing ${AZ_NAMES[Math.round(az / 45) % 8]}, ${Math.round(view.lat)}° up, field ${fovTxt}°.`);
    } else {
      setAnnounce(`Looking at right ascension ${Math.round(view.lon)}°, declination ${Math.round(view.lat)}°, field ${fovTxt}°.`);
    }
  }, [view, mode]);

  // ── Persistence bridge ───────────────────────────────────────────
  const placementForSave = placement && placement.source !== "canon" ? placement : null;
  useEffect(() => {
    const onRequestState = () => {
      const payload = toExoskyPayload({
        mode: worldEntityId ? "entity" : vantageKey === "custom" || placementForSave ? "custom" : "catalog",
        starName: resolved.hostName,
        planetName: resolved.label,
        distPc: resolved.position ? Math.hypot(...resolved.position.value) : 0,
        armNote: armNote(arm),
        atmoDesc: atmo.desc,
        galacticL: placementForSave?.l,
        galacticB: placementForSave?.b,
        vantageKey,
        entityId: worldEntityId,
        stand: { mode, latitude, timeOfDay, substellarLongitude, dayNumber, overrides },
        readouts: { nakedEye: obs?.nakedEye ?? null, poleStar: poleStar && catalogue ? starLabel(catalogue[poleStar.index]) : null },
        viewRa: view.lon, viewDec: view.lat, fov: view.fov,
        epochYears,
        showConstellations, showAtmosphere, showGrid, showMilkyWay, showStarNames, showHorizon,
        customConstellations: customConstellations.map((c) => ({
          name: c.name,
          color: c.color,
          planetName: c.planetName,
          starIds: c.starIds,
          epochYears: c.epochYears,
          vantageKey: c.vantageKey,
          entityId: c.entityId,
          stars: c.starIds.map((id, n) => {
            const s = catalogueById?.get(id);
            const d = s && obs ? xyzToRaDec(obs.ux[s.i], obs.uy[s.i], obs.uz[s.i]) : { ra: 0, dec: 0 };
            return { id, name: c.starNames[n] ?? id, ra: d.ra, dec: d.dec, appMag: s && obs ? obs.mag[s.i] : null };
          }),
        })),
      });
      // Distance for a custom position lives in parameters too.
      if (placementForSave) (payload.parameters.exosky as { vantage: { distPc: number } }).vantage.distPc = placementForSave.distPc;
      window.postMessage({ type: "STELLARFORGE_SAVE", payload }, "*");
    };
    const onLoad = (event: Event) => {
      const save = fromExoskySave((event as CustomEvent).detail);
      if (!save) return;
      setHandoffPayload(null);
      const key = save.vantage.key ?? VANTAGES.find((p) => p.planet === save.vantage.planetName)?.key ?? null;
      if (key && (key.startsWith("world:") || VANTAGES.some((p) => p.key === key))) {
        setVantageKey(key);
        setPlacementDraft(null);
      } else if (save.vantage.galacticL !== null && save.vantage.galacticB !== null) {
        setVantageKey("custom");
        setPlacementDraft({ l: save.vantage.galacticL, b: save.vantage.galacticB, distPc: save.vantage.distPc || 100 });
      }
      if (save.stand) {
        setMode(save.stand.mode);
        setLatitude(save.stand.latitude);
        setTimeOfDay(save.stand.timeOfDay);
        setSubstellarLongitude(save.stand.substellarLongitude);
        setDayNumber(save.stand.dayNumber);
        setOverrides(save.stand.overrides as WriterOverrides);
      }
      setView({ lon: save.view.ra, lat: save.view.dec, fov: clamp(save.view.fov, FOV_MIN, FOV_MAX) });
      setEpochYears(save.view.epochYears);
      setShowConstellations(save.display.constellations);
      setShowAtmosphere(save.display.atmosphere);
      setShowGrid(save.display.grid);
      setShowMilkyWay(save.display.milkyWay);
      setShowStarNames(save.display.starNames);
      setShowHorizon(save.display.horizon);
      setCustomConstellations(save.constellations.map((c, n) => ({
        id: Date.now() + n,
        name: c.name,
        color: c.color,
        visible: true,
        starIds: c.starIds ?? [],
        legacyDirs: c.starIds && c.starIds.length ? undefined : c.stars.map((s) => unitFromRaDec(s.ra, s.dec)),
        starNames: c.stars.map((s) => s.name),
        epochYears: c.epochYears ?? 0,
        vantageKey: c.vantageKey ?? key,
        planetName: c.fromPlanet,
        entityId: c.entityId ?? null,
      })));
    };
    window.addEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
    window.addEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    return () => {
      window.removeEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
      window.removeEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    };
  });

  // ── Canon writes ─────────────────────────────────────────────────
  const canWrite = !!worldId && !!worldEntity;
  const writeFacts = useCallback(async (asserts: ExoskyAssert[], supersede = false) => {
    const conflicted: ExoskyAssert[] = [];
    try {
      for (const a of asserts) {
        const r = await assertFact.mutateAsync({ ...a, supersede });
        if ("status" in r && r.status === "conflict") conflicted.push(a);
      }
    } catch {
      // useAssertFact already showed the mapped error; stop here.
      return;
    }
    setConflicts(conflicted);
    toast({ title: conflicted.length ? `${asserts.length - conflicted.length} FACTS WRITTEN. ${conflicted.length} HELD BY CANON.` : "CANON UPDATED." });
  }, [assertFact, toast]);

  const savePole = () => {
    if (!worldEntity || worldEntity.entity_type === "star") return;
    void writeFacts(poleFacts(worldEntity.id, resolved.planet.pole.value, resolved.planet.precessionYears.source === "default" ? null : resolved.planet.precessionYears.value));
  };
  const savePlacement = () => {
    if (!worldEntity || !placement) return;
    const target = canonSky?.star?.id ?? worldEntity.id;
    void writeFacts([galacticPositionFact(target, placement)]);
    setPlacementDraft(null);
  };
  const saveReadouts = () => {
    if (!worldEntity || !obs) return;
    void writeFacts(skyReadoutFacts(worldEntity.id, {
      poleStar: poleStar && catalogue ? starLabel(catalogue[poleStar.index]) : null,
      nakedEye: obs.nakedEye,
      epochYears,
    }));
  };
  const addConstellationToCanon = async (c: DrawnConstellation) => {
    if (!worldEntity || c.starIds.length < 2) return;
    let created: { id: string };
    try {
      created = await createEntity.mutateAsync(constellationEntityInput({ name: c.name, starIds: c.starIds, epochYears: c.epochYears }, worldEntity));
    } catch {
      return; // useCreateEntity already showed the mapped error.
    }
    const names = [...(canonSky?.constellations ?? []).map((x) => x.entity.name), c.name];
    await writeFacts(constellationFacts(created.id, { name: c.name, starIds: c.starIds, epochYears: c.epochYears }, worldEntity.id, names));
    setCustomConstellations((prev) => prev.map((x) => (x.id === c.id ? { ...x, entityId: created.id } : x)));
  };

  // ── Constellation actions ────────────────────────────────────────
  const finishDrawing = () => { if (currentDrawing.length >= 2) { setNamingMode(true); setConstellationName(""); } };
  const saveConstellation = () => {
    if (!constellationName.trim() || currentDrawing.length < 2 || !catalogue) return;
    setCustomConstellations((prev) => [...prev, {
      id: Date.now(),
      name: constellationName.trim(),
      color: drawColor,
      visible: true,
      starIds: currentDrawing.map((i) => catalogue[i].id),
      starNames: currentDrawing.map((i) => starLabel(catalogue[i])),
      epochYears,
      vantageKey,
      planetName: resolved.label,
      entityId: null,
    }]);
    setCurrentDrawing([]);
    setNamingMode(false);
    setConstellationName("");
    setDrawMode(false);
  };
  const exportConstellations = () => {
    const data = vantageConstellations.map((c) => ({
      name: c.name, color: c.color, seenFrom: c.planetName, epochYears: c.epochYears,
      stars: c.starIds.map((id, n) => ({ id, name: c.starNames[n] })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exosky-constellations-${resolved.label.replace(/[^\w]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Star chart (N10) ─────────────────────────────────────────────
  const printChart = () => {
    if (!obs || !catalogue) return;
    const stars = [];
    for (let k = 0; k < obs.index.length; k++) {
      const i = obs.index[k];
      if (obs.mag[i] > 5.5) break;
      const d: Vec3 = [obs.ux[i], obs.uy[i], obs.uz[i]];
      stars.push({ dir: d, mag: obs.mag[i] + (mode === "stand" ? kEff * airmass(Math.max(0, altAz(geometry.horizon, d).alt)) : 0), label: catalogue[i].name, isSol: i === solIndex });
    }
    const lines = vantageConstellations.flatMap((c) => {
      const ds = c.starIds.map((id) => { const s = catalogueById?.get(id); return s ? [obs.ux[s.i], obs.uy[s.i], obs.uz[s.i]] as Vec3 : null; });
      const out: Array<{ a: Vec3; b: Vec3; colour: string }> = [];
      for (let n = 1; n < ds.length; n++) if (ds[n - 1] && ds[n]) out.push({ a: ds[n - 1]!, b: ds[n]!, colour: c.color });
      return out;
    });
    const svg = buildStarChartSvg({
      layout: mode === "stand" ? "horizon" : "pole",
      frame: mode === "stand" ? geometry.horizon : geometry.eqFrame,
      south: latitude < 0,
      stars,
      lines,
      bodies: bodies.filter((b) => b.kind !== "host").map((b) => ({ dir: b.dir, label: b.name, mag: b.mag })),
      title: `The sky from ${resolved.label}`,
      subtitle: mode === "stand"
        ? `${Math.abs(latitude)}° ${latitude >= 0 ? "N" : "S"} · ${resolved.planet.tidallyLocked.value ? `${Math.round(substellarLongitude)}° from the substellar point` : `local time ${(timeOfDay * 24).toFixed(1)} h`} · epoch ${epochYears === 0 ? "J2000" : `${epochYears > 0 ? "+" : ""}${epochYears} yr`}`
        : `Centred on the ${latitude < 0 ? "south" : "north"} celestial pole · epoch ${epochYears === 0 ? "J2000" : `${epochYears > 0 ? "+" : ""}${epochYears} yr`}`,
      credit: `StellarForge ExoSky · ${CATALOGUE_CREDIT}`,
    });
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<!doctype html><title>Star chart: ${resolved.label.replace(/</g, "")}</title><style>@page{size:auto;margin:12mm}body{margin:0;display:flex;justify-content:center}svg{width:100%;max-width:190mm;height:auto}</style>${svg}`);
      w.document.close();
      setTimeout(() => w.print(), 300);
    } else {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `exosky-chart-${resolved.label.replace(/[^\w]+/g, "-")}.svg`; a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Scene brief (N7) ─────────────────────────────────────────────
  const brief = useMemo(() => {
    let brightestNight: { name: string; mag: number } | null = null;
    for (const b of bodies) if (b.kind !== "host" && (!brightestNight || b.mag < brightestNight.mag)) brightestNight = { name: b.name, mag: b.mag };
    if (obs && catalogue && brightestStar >= 0 && (!brightestNight || obs.mag[brightestStar] < brightestNight.mag)) {
      brightestNight = { name: starLabel(catalogue[brightestStar]), mag: obs.mag[brightestStar] };
    }
    return skyConditionsBrief({
      place: resolved.label,
      epochYears,
      latitude,
      host: hostBody ? { name: hostBody.name, sizeDeg: hostBody.sizeDeg, mag: hostBody.mag, altDeg: hostAltAz.alt } : null,
      locked: resolved.planet.tidallyLocked.value,
      solarDayHours: geometry.solarDayHours,
      orbitDays: resolved.planet.orbitDays.value,
      poleStar: (latitude >= 0 ? poleStar : southPoleStar) && catalogue ? { name: starLabel(catalogue[(latitude >= 0 ? poleStar : southPoleStar)!.index]), separationDeg: (latitude >= 0 ? poleStar : southPoleStar)!.separationDeg } : null,
      nakedEye: obs?.nakedEye ?? 0,
      catalogueComplete: reach.complete && !unplaced,
      brightestNight,
      moons: bodies.filter((b) => b.kind === "moon").map((b) => ({ name: b.name, phase: b.phase, sizeDeg: b.sizeDeg })),
      sol: solData ? { mag: solData.mag, visible: solData.mag <= NAKED_EYE_LIMIT } : null,
      extinctionAtHorizon: atmo.k * atmoDensity * airmass(0),
      atmoName: atmo.name,
    });
  }, [bodies, obs, catalogue, brightestStar, resolved, epochYears, latitude, hostBody, hostAltAz.alt, geometry.solarDayHours, poleStar, southPoleStar, reach.complete, unplaced, solData, atmo, atmoDensity]);

  // ── Readout helpers ──────────────────────────────────────────────
  const canonNakedEye = canonSky?.planet["planet.sky.naked_eye_count"];
  const nakedEyeStale = typeof canonNakedEye === "number" && obs && canonNakedEye !== obs.nakedEye;
  const selectedStar = selected !== null && catalogue && obs ? { s: catalogue[selected], mag: obs.mag[selected], dist: obs.dist[selected], dir: [obs.ux[selected], obs.uy[selected], obs.uz[selected]] as Vec3 } : null;
  const selectedPos = selectedStar ? (mode === "stand" ? altAz(geometry.horizon, selectedStar.dir) : null) : null;
  const selectedEq = selectedStar ? planetRaDec(geometry.eqFrame, selectedStar.dir) : null;
  const locked = resolved.planet.tidallyLocked.value;
  const orbitDays = resolved.planet.orbitDays.value;
  const firstMoon = bodies.find((b) => b.kind === "moon");
  const moonBody = firstMoon ? resolved.moons.find((m) => m.id === firstMoon.id) : null;
  const statusTag = STATUS_LABEL[resolved.status];
  const vantageOptionsWorld = worldId ? worldObservationEntities : [];
  const fovLabel = view.fov < 10 ? view.fov.toFixed(1) : Math.round(view.fov).toString();

  const sourceTag = (s: Source, note?: string) => (
    <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: s === "default" ? "var(--sf-amber-text)" : "var(--t4)", marginLeft: 6 }}>
      {s === "default" ? `// ${note ?? "not set"}` : `(${SOURCE_LABEL[s]})`}
    </span>
  );

  const pickVantage = (val: string) => {
    setHandoffPayload(val === "handoff" ? handoffPayload : null);
    setPlacementDraft(val === "custom" ? { l: 0, b: 0, distPc: 100 } : null);
    setOverrides({});
    setSelected(null);
    setVantageKey(val);
  };

  // ═════════════════════════════════════════════════════════════════
  const controlsPanel = (
    <>
      <label htmlFor="exo-vantage" style={SH}>Observation point</label>
      <select id="exo-vantage" value={vantageKey} onChange={(e) => pickVantage(e.target.value)} style={SEL}>
        {PRESET_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {VANTAGES.filter(g.filter).map((p) => <option key={p.key} value={p.key}>{p.planet}</option>)}
          </optgroup>
        ))}
        {handoffPayload && <option value="handoff">{handoffPayload.planetName} (from Solaris)</option>}
        <option value="custom">Custom location</option>
        {vantageOptionsWorld.length > 0 && (
          <optgroup label="From your world">
            {vantageOptionsWorld.map((e) => <option key={e.id} value={`world:${e.id}`}>{e.name}</option>)}
          </optgroup>
        )}
      </select>
      <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span style={tagStyle(resolved.status)}>{statusTag}</span>
      </div>
      {vantageKey === "handoff" && handoffPayload && (
        <p style={NOTE}>{describeHandoffPlanet(handoffPayload)}</p>
      )}
      {resolved.note && <p style={NOTE}>{resolved.note}</p>}
      {resolved.source && <p style={{ ...NOTE, color: "var(--t4)" }}>Source: {resolved.source}</p>}

      {(unplaced || vantageKey === "custom" || placementDraft || worldEntity) && (
        <section aria-labelledby="exo-place" style={{ marginTop: 14 }}>
          <h3 id="exo-place" style={SH}>Place this system</h3>
          {unplaced && !placementDraft && (
            <div style={WARN}>
              <div style={WARN_TITLE}>// SYSTEM NOT PLACED</div>
              <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>Stars are shown as seen from the Sun. Put this system at a real star or at galactic coordinates.</div>
            </div>
          )}
          <label htmlFor="exo-place-search" style={LBL_BLOCK}>Host it at a real star</label>
          <input id="exo-place-search" type="search" value={placeQuery} onChange={(e) => setPlaceQuery(e.target.value)} placeholder="e.g. Tau Ceti, HIP 8102" style={FIELD} />
          {placeResults.length > 0 && (
            <ul style={LIST}>
              {placeResults.map((s) => (
                <li key={s.id}>
                  <button type="button" style={LIST_BTN} onClick={() => {
                    const g = eqToGal(s.x, s.y, s.z);
                    setPlacementDraft({ l: ((Math.atan2(g[1], g[0]) * RAD) + 360) % 360, b: Math.asin(g[2] / Math.max(1e-9, s.dist)) * RAD, distPc: s.dist, catalogueId: s.id });
                    setPlaceQuery("");
                  }}>
                    {starLabel(s)} <span style={{ color: "var(--t4)", fontFamily: FONT_MONO }}>{s.id} · {(s.dist * 3.2616).toFixed(1)} ly</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>
            {([["Galactic l (°)", "l", 0, 360], ["Galactic b (°)", "b", -90, 90], ["Distance (pc)", "distPc", 0, 20000]] as const).map(([lbl, k, min, max]) => (
              <label key={k} style={LBL_BLOCK}>
                {lbl}
                <input type="number" min={min} max={max} step={k === "distPc" ? 1 : 0.1}
                  value={Number(((placementDraft ?? placement ?? { l: 0, b: 0, distPc: 0 })[k] ?? 0).toFixed(k === "distPc" ? 1 : 2))}
                  onChange={(e) => {
                    const base = placementDraft ?? (placement ? { l: placement.l, b: placement.b, distPc: placement.distPc } : { l: 0, b: 0, distPc: 10 });
                    setPlacementDraft({ ...base, catalogueId: null, [k]: clamp(Number(e.target.value) || 0, min, max) });
                  }} style={NUM_INPUT} />
              </label>
            ))}
          </div>
          <p style={{ ...NOTE, color: "var(--t4)" }}>l 0° is the galactic centre, b 0° the galactic plane. Distance is from the Sun.</p>
          {placement && <p style={{ ...NOTE, fontFamily: FONT_MONO }}>{placement.catalogueId ? `${placement.catalogueId} · ` : ""}{(placement.distPc * 3.2616).toFixed(1)} ly from the Sun {sourceTag(placement.source)}</p>}
          {canWrite && placementDraft && (
            <button type="button" onClick={savePlacement} disabled={assertFact.isPending} style={{ ...BTN, width: "100%", marginTop: 6 }}>
              Save position to canon
            </button>
          )}
        </section>
      )}

      <section aria-labelledby="exo-stand" style={{ marginTop: 14 }}>
        <h3 id="exo-stand" style={SH}>Stand here</h3>
        <div role="radiogroup" aria-label="Viewpoint" style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {([["stand", "On the surface"], ["space", "From space"]] as const).map(([m, label]) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => changeMode(m)} style={{ ...BTN, ...(mode === m ? null : BTN_QUIET), flex: 1 }}>{label}</button>
          ))}
        </div>
        <Slider id="exo-lat" label="Latitude" value={latitude} min={-90} max={90} step={1} onChange={setLatitude} display={`${Math.abs(latitude)}° ${latitude >= 0 ? "N" : "S"}`} />
        {locked ? (
          <Slider id="exo-sub" label="Distance from the substellar point" value={substellarLongitude} min={0} max={180} step={1} onChange={setSubstellarLongitude}
            display={`${substellarLongitude}° (sun ${hostAltAz.alt >= 0 ? `${Math.round(hostAltAz.alt)}° up` : `${Math.round(-hostAltAz.alt)}° down`})`} />
        ) : (
          <Slider id="exo-time" label="Time of day" value={timeOfDay} min={0} max={1} step={0.005} onChange={setTimeOfDay}
            display={`${(timeOfDay * 24).toFixed(1)} h local${timeOfDay < 0.02 || timeOfDay > 0.98 ? " (midnight)" : Math.abs(timeOfDay - 0.5) < 0.02 ? " (noon)" : ""}`} />
        )}
        <Slider id="exo-date" label={locked ? "Orbit (turns the stars)" : "Date in the year"} value={dayNumber % Math.max(1, orbitDays)} min={0} max={Math.max(1, orbitDays)} step="any" onChange={setDayNumber}
          display={`day ${(dayNumber % orbitDays).toFixed(orbitDays < 30 ? 1 : 0)} of ${orbitDays.toFixed(orbitDays < 30 ? 1 : 0)}`} />
        <Slider id="exo-epoch" label="Epoch (years from J2000)" value={epochYears} min={-20000} max={20000} step={50} onChange={setEpochYears}
          display={epochYears === 0 ? "now" : `${epochYears > 0 ? "+" : ""}${epochYears.toLocaleString()}`} />
        <p style={{ ...NOTE, color: "var(--t3)" }}>Epoch moves the pole by this planet's own precession ({fmtYears(resolved.planet.precessionYears.value)} per cycle). Stars' own motions are not modelled.</p>

        <details style={{ marginTop: 8 }}>
          <summary style={SUMMARY}>The planet's spin</summary>
          <label style={CKL}>
            <input type="checkbox" checked={locked} onChange={(e) => setOverrides((o) => ({ ...o, tidallyLocked: e.target.checked }))} style={CK} />
            Tidally locked {sourceTag(resolved.planet.tidallyLocked.source, resolved.planet.tidallyLocked.note)}
          </label>
          {!locked && (
            <>
              <NumberRow id="exo-rot" label="Day length (sidereal, h)" value={resolved.planet.rotationHours.value} step={0.1} min={0.5} max={10000}
                onChange={(v) => setOverrides((o) => ({ ...o, rotationHours: v }))} tag={sourceTag(resolved.planet.rotationHours.source, resolved.planet.rotationHours.note)} />
              <NumberRow id="exo-obl" label="Axial tilt (°)" value={resolved.planet.obliquityDeg.value} step={0.5} min={0} max={180}
                onChange={(v) => setOverrides((o) => ({ ...o, obliquityDeg: v }))} tag={sourceTag(resolved.planet.obliquityDeg.source, resolved.planet.obliquityDeg.note)} />
            </>
          )}
          <NumberRow id="exo-pra" label="Pole right ascension (°)" value={resolved.planet.pole.value.ra} step={1} min={0} max={360}
            onChange={(v) => setOverrides((o) => ({ ...o, poleRa: v, poleDec: o.poleDec ?? resolved.planet.pole.value.dec }))} tag={sourceTag(resolved.planet.pole.source, resolved.planet.pole.note)} />
          <NumberRow id="exo-pdec" label="Pole declination (°)" value={resolved.planet.pole.value.dec} step={1} min={-90} max={90}
            onChange={(v) => setOverrides((o) => ({ ...o, poleDec: v, poleRa: o.poleRa ?? resolved.planet.pole.value.ra }))} />
          <NumberRow id="exo-prec" label="Precession period (yr)" value={Math.round(resolved.planet.precessionYears.value)} step={100} min={100} max={1e9}
            onChange={(v) => setOverrides((o) => ({ ...o, precessionYears: v }))} tag={sourceTag(resolved.planet.precessionYears.source, resolved.planet.precessionYears.note)} />
          <p style={{ ...NOTE, color: "var(--t4)" }}>Solar day {fmtHours(geometry.solarDayHours)} · year {orbitDays.toFixed(orbitDays < 30 ? 2 : 1)} days ({sourceTag(resolved.planet.orbitDays.source, resolved.planet.orbitDays.note)})</p>
          {canWrite && worldEntity?.entity_type !== "star" && (
            <button type="button" onClick={savePole} disabled={assertFact.isPending} style={{ ...BTN, width: "100%", marginTop: 6 }}>Save pole to canon</button>
          )}
        </details>
      </section>

      <section aria-labelledby="exo-atmo" style={{ marginTop: 14 }}>
        <h3 id="exo-atmo" style={SH}>Atmosphere</h3>
        <label htmlFor="exo-atmo-type" style={LBL_BLOCK}>Type {sourceTag(resolved.atmo.source, resolved.atmo.note)}</label>
        <select id="exo-atmo-type" value={resolved.atmo.value} onChange={(e) => setOverrides((o) => ({ ...o, atmo: e.target.value as AtmoKey }))} style={SEL}>
          {(Object.keys(ATMO_MODELS) as AtmoKey[]).map((k) => <option key={k} value={k}>{ATMO_MODELS[k].name}</option>)}
        </select>
        <p style={NOTE}>{atmo.desc}</p>
        <Slider id="exo-dens" label="Density" value={atmoDensity} min={0} max={3} step={0.1} onChange={setAtmoDensity} display={`${atmoDensity.toFixed(1)}× · ${(atmo.k * atmoDensity).toFixed(2)} mag per airmass`} />
        <Slider id="exo-mw" label="Milky Way brightness" value={mwBrightness} min={0} max={3} step={0.1} onChange={setMwBrightness} display={`${mwBrightness.toFixed(1)}×`} />
      </section>

      <section aria-labelledby="exo-display" style={{ marginTop: 14 }}>
        <h3 id="exo-display" style={SH}>Show</h3>
        {([
          ["Milky Way", showMilkyWay, setShowMilkyWay],
          ["Air and daylight", showAtmosphere, setShowAtmosphere],
          ["Ground", showHorizon, setShowHorizon],
          ["Star names", showStarNames, setShowStarNames],
          ["Earth's constellations", showConstellations, setShowConstellations],
          ["Grid", showGrid, setShowGrid],
          ["Mark the Sun", highlightSol, setHighlightSol],
        ] as const satisfies ReadonlyArray<readonly [string, boolean, (v: boolean) => void]>).map(([label, val, set]) => (
          <label key={label} style={CKL}><input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} style={CK} />{label}</label>
        ))}
      </section>

      <section aria-labelledby="exo-draw" style={{ marginTop: 14 }}>
        <h3 id="exo-draw" style={SH}>Constellations</h3>
        {!drawMode ? (
          <button type="button" onClick={() => { setDrawMode(true); setSelected(null); }} style={{ ...BTN, width: "100%", marginTop: 8 }}>Draw a constellation</button>
        ) : (
          <div style={{ marginTop: 6 }}>
            <div role="radiogroup" aria-label="Line colour" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {CONSTELLATION_COLOURS.map((c) => (
                <button key={c.hex} type="button" role="radio" onClick={() => setDrawColor(c.hex)} aria-label={`Line colour: ${c.name}`} aria-checked={drawColor === c.hex} style={swatchStyle(c.hex, drawColor === c.hex)} />
              ))}
            </div>
            <p style={NOTE}>{currentDrawing.length === 0 ? "Tap stars to connect them." : `${currentDrawing.length} star${currentDrawing.length === 1 ? "" : "s"}: ${currentDrawing.map((i) => (catalogue ? starLabel(catalogue[i]) : "")).join(", ")}`}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {currentDrawing.length > 0 && <button type="button" onClick={() => setCurrentDrawing((p) => p.slice(0, -1))} style={{ ...BTN, ...BTN_QUIET, flex: 1 }}>Undo</button>}
              {currentDrawing.length >= 2 && <button type="button" onClick={finishDrawing} style={{ ...BTN, flex: 1 }}>Name it</button>}
              <button type="button" onClick={() => { setCurrentDrawing([]); setDrawMode(false); }} style={{ ...BTN, ...BTN_QUIET, flex: 1 }}>Cancel</button>
            </div>
            <p style={{ ...NOTE, color: "var(--t4)" }}>Esc to cancel · Ctrl+Z to undo</p>
          </div>
        )}
        {vantageConstellations.length > 0 && (
          <>
            <label style={CKL}><input type="checkbox" checked={showCustomConstellations} onChange={(e) => setShowCustomConstellations(e.target.checked)} style={CK} />Your constellations here ({vantageConstellations.length})</label>
            <button type="button" onClick={() => setConsManagerOpen((p) => !p)} aria-expanded={consManagerOpen} style={{ ...BTN, ...BTN_QUIET, width: "100%", marginTop: 6 }}>{consManagerOpen ? "Hide list" : "Manage"}</button>
          </>
        )}
        {consManagerOpen && vantageConstellations.length > 0 && (
          <ul style={{ ...LIST, marginTop: 8 }}>
            {vantageConstellations.map((c) => (
              <li key={c.id} style={{ borderBottom: "1px solid var(--sf-line-hairline)", padding: "6px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden style={{ width: 12, height: 12, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--t1)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "var(--t4)", fontFamily: FONT_MONO }}>{c.starIds.length || (c.legacyDirs?.length ?? 0)}★</span>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  <button type="button" style={MINI} onClick={() => {
                    const s = catalogueById?.get(c.starIds[0] ?? "");
                    if (s && obs) aimAt([obs.ux[s.i], obs.uy[s.i], obs.uz[s.i]]);
                  }}>Go to</button>
                  <button type="button" style={MINI} aria-pressed={c.visible} onClick={() => setCustomConstellations((p) => p.map((x) => (x.id === c.id ? { ...x, visible: !x.visible } : x)))}>{c.visible ? "Hide" : "Show"}</button>
                  {canWrite && !c.entityId && c.starIds.length >= 2 && <button type="button" style={MINI} onClick={() => void addConstellationToCanon(c)}>Add to canon</button>}
                  {c.entityId && <span style={{ ...MINI, border: "none", color: "var(--sf-emerald-text)" }}>In canon</span>}
                  <button type="button" style={{ ...MINI, color: "var(--sf-crimson-text)" }} onClick={() => setCustomConstellations((p) => p.filter((x) => x.id !== c.id))}>Delete</button>
                </div>
              </li>
            ))}
            <li><button type="button" onClick={exportConstellations} style={{ ...BTN, ...BTN_QUIET, width: "100%", marginTop: 8 }}>Export as JSON</button></li>
          </ul>
        )}
        {(canonSky?.constellations.length ?? 0) > 0 && (
          <p style={NOTE}>In canon for {canonSky!.label}: {canonSky!.constellations.map((c) => c.entity.name).join(", ")}</p>
        )}
      </section>

      <section style={{ marginTop: 14 }}>
        <h3 style={SH}>Help</h3>
        <p style={{ ...NOTE, color: "var(--t3)" }}>Drag to look around · scroll, pinch or +/− to zoom · arrow keys pan · tap a star to identify it · ? for shortcuts</p>
      </section>
    </>
  );

  const dataPanel = (
    <>
      <h3 style={SH}>Find</h3>
      <label htmlFor="exo-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Find a star</label>
      <input id="exo-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a star: Vega, α Cen, HIP 70890" style={FIELD} />
      {results.length > 0 && obs && (
        <ul style={LIST}>
          {results.map((s) => (
            <li key={s.id}>
              <button type="button" style={LIST_BTN} onClick={() => {
                if (Number.isNaN(obs.mag[s.i])) { toast({ title: "THAT STAR IS THIS WORLD'S SUN." }); return; }
                aimAt([obs.ux[s.i], obs.uy[s.i], obs.uz[s.i]]);
                setSelected(s.i);
                setQuery("");
              }}>
                {starLabel(s)} <span style={{ color: "var(--t4)", fontFamily: FONT_MONO }}>mag {Number.isNaN(obs.mag[s.i]) ? "sun" : obs.mag[s.i].toFixed(1)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" style={{ ...BTN, flex: 1 }} disabled={!solData} onClick={() => { if (solData) { aimAt(solData.dir, 40); if (solIndex >= 0) setSelected(solIndex); } }}>Find our Sun</button>
        <button type="button" style={{ ...BTN, flex: 1 }} onClick={() => { if (hostBody) aimAt(hostBody.dir, 40); }}>Find this sun</button>
      </div>

      {selectedStar && (
        <section aria-live="polite" style={{ ...CARD, marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ ...SH, border: "none", margin: 0 }}>{starLabel(selectedStar.s)}</h3>
            <button type="button" aria-label="Close star details" onClick={() => setSelected(null)} style={{ ...MINI, minWidth: "var(--hit-min)" }}>Close</button>
          </div>
          <DR l="Catalogue id" v={selectedStar.s.id} />
          <DR l="Magnitude here" v={selectedStar.mag.toFixed(2)} />
          <DR l="Magnitude from Earth" v={(selectedStar.s.absMag + 5 * Math.log10(Math.max(1e-6, selectedStar.s.dist) / 10)).toFixed(2)} />
          <DR l="Distance from here" v={`${(selectedStar.dist * 3.2616).toFixed(2)} ly`} />
          {selectedPos && <DR l="Altitude / azimuth" v={`${selectedPos.alt.toFixed(1)}° / ${selectedPos.az.toFixed(1)}°`} />}
          {selectedEq && <DR l="Local RA / Dec" v={`${selectedEq.ra.toFixed(1)}° / ${selectedEq.dec.toFixed(1)}°`} />}
          <DR l="Colour index (B-V)" v={selectedStar.s.bv.toFixed(2)} />
        </section>
      )}

      <h3 style={{ ...SH, marginTop: 14 }}>This world's sun</h3>
      <DR l="Star" v={resolved.hostName} />
      {hostBody && <>
        <DR l="Magnitude" v={hostBody.mag.toFixed(1)} />
        <DR l="Disc" v={`${hostBody.sizeDeg.toFixed(hostBody.sizeDeg < 1 ? 3 : 1)}° · ${(hostBody.sizeDeg / 0.533).toFixed(2)}× our Sun`} />
      </>}
      {mode === "stand" && <DR l="Altitude" v={`${hostAltAz.alt.toFixed(1)}°`} />}
      <DR l="Orbit" v={`${resolved.planet.au.value.toFixed(resolved.planet.au.value < 0.1 ? 4 : 2)} AU`} />
      <p style={{ ...NOTE, color: "var(--t4)" }}>Luminosity {resolved.host.lumSolar.value.toPrecision(3)} L☉ {sourceTag(resolved.host.lumSolar.source, resolved.host.lumSolar.note)}</p>

      {bodies.some((b) => b.kind !== "host") && (
        <>
          <h3 style={{ ...SH, marginTop: 14 }}>Planets and moons</h3>
          <p style={{ ...NOTE, color: "var(--t4)", marginBottom: 4 }}>Magnitude · lit fraction · size</p>
          {bodies.filter((b) => b.kind !== "host").map((b: SkyBody) => (
            <DR key={b.id} l={b.name} v={`${b.mag.toFixed(1)} · ${Math.round(b.phase * 100)}%${b.sizeDeg > 0.01 ? ` · ${b.sizeDeg.toFixed(2)}°` : ""}`} />
          ))}
          <p style={{ ...NOTE, color: "var(--t4)" }}>{resolved.isEarth ? "Circular orbits in Earth's plane from J2000 mean longitudes: positions good to a few degrees." : "Circular orbits; starting phases are not known, so each body is placed by its id."}</p>
        </>
      )}

      <h3 style={{ ...SH, marginTop: 14 }}>Navigation and calendar</h3>
      {resolved.planet.pole.source === "default" && <p style={{ ...WARN_TITLE, marginTop: 6 }}>// POLE NOT SET. USING EARTH'S AXIS DIRECTION.</p>}
      <DR l="Pole star (north)" v={poleStar && catalogue ? `${starLabel(catalogue[poleStar.index])}, ${poleStar.separationDeg.toFixed(1)}°` : "None"} />
      <DR l="Pole star (south)" v={southPoleStar && catalogue ? `${starLabel(catalogue[southPoleStar.index])}, ${southPoleStar.separationDeg.toFixed(1)}°` : "None"} />
      {circ && <DR l="Never sets here" v={`${Math.round(circ.skyFraction * 100)}% sky · ${Math.round(circ.starFraction * 100)}% stars`} />}
      <DR l="Solar day" v={fmtHours(geometry.solarDayHours)} />
      <DR l="Sidereal day" v={locked ? `${(orbitDays).toFixed(2)} days` : fmtHours(resolved.planet.rotationHours.value)} />
      <DR l="Year" v={locked ? `${orbitDays.toFixed(2)} days` : `${((orbitDays * 24) / geometry.solarDayHours).toFixed(1)} local days`} />
      {moonBody && <DR l={`${moonBody.name}'s month`} v={`${synodicMonthDays(moonBody.periodDays, orbitDays).toFixed(2)} days`} />}
      <DR l="Brightest star rises at dawn" v={heliacal ? `day ${Math.round(heliacal.dayOfYear)}` : locked ? "No dawn here" : "Never (circumpolar or never rises)"} />
      <p style={{ ...NOTE, color: "var(--t4)" }}>Dawn rising uses a rule of thumb: the sun 10° below the horizon for a first-magnitude star, 1° more per magnitude fainter.</p>
      <DR l="Precession" v={fmtYears(resolved.planet.precessionYears.value)} />

      <h3 style={{ ...SH, marginTop: 14 }}>The sky</h3>
      <DR l="Naked-eye stars" v={`${obs ? obs.nakedEye.toLocaleString() : "…"}${reach.complete && !unplaced ? "" : " or more"}`} />
      {nakedEyeStale && <p style={{ ...WARN_TITLE, marginTop: 2 }}>// CANON SAYS {String(canonNakedEye)}. STALE.</p>}
      <DR l="Drawn now" v={`${drawnCount.current.toLocaleString()}`} />
      <DR l="Catalogue complete within" v={`${Math.round(reach.completePc)} pc`} />
      {mode === "stand" && <DR l="Starlight lost at the horizon" v={`${(kEff * airmass(0)).toFixed(1)} mag`} />}
      {solData && <DR l="The Sun from here" v={`mag ${solData.mag.toFixed(2)} · ${(solData.dist * 3.2616).toFixed(2)} ly`} />}
      {simFlags.filter((f) => !dismissedFlagIds.has(flagDismissKey(f))).map((f) => (
        <div key={f.id} style={{ ...WARN, position: "relative" }}>
          <div style={{ ...WARN_TITLE, paddingRight: 48 }}>{"// "}{f.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--t2)", marginTop: 4, paddingRight: 48 }}>{f.body}</div>
          <button type="button" onClick={() => dismissFlag(flagDismissKey(f))} aria-label={`Dismiss: ${f.title}`} style={{ ...MINI, position: "absolute", top: 0, right: 0, border: "none" }}>×</button>
        </div>
      ))}
      {canWrite && worldEntity?.entity_type !== "star" && (
        <button type="button" onClick={saveReadouts} disabled={assertFact.isPending} style={{ ...BTN, width: "100%", marginTop: 8 }}>Add pole star and star count to canon</button>
      )}

      <h3 style={{ ...SH, marginTop: 14 }}>Galactic position</h3>
      <DR l="From the galactic centre" v={`${(Math.hypot(gc[0], gc[1]) / 1000).toFixed(2)} kpc`} />
      <DR l="Above the plane" v={`${Math.round(gc[2])} pc`} />
      <DR l="Nearest spiral arm" v={arm.name} />
      <p style={{ ...NOTE, color: "var(--t3)" }}>{armNote(arm)}. Arms from Reid et al. 2019.</p>

      {conflicts.length > 0 && (
        <div style={WARN}>
          <div style={WARN_TITLE}>// CANON HOLDS A DIFFERENT VALUE</div>
          <div style={{ fontSize: 13, color: "var(--t2)" }}>{conflicts.map((c) => c.predicate).join(", ")}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button type="button" style={{ ...BTN, ...BTN_QUIET, flex: 1 }} onClick={() => setConflicts([])}>Keep canon</button>
            <button type="button" style={{ ...BTN, flex: 1 }} onClick={() => void writeFacts(conflicts, true)}>Replace</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" style={{ ...BTN, flex: 1 }} onClick={printChart} disabled={!obs}>Print star chart</button>
        <button type="button" style={{ ...BTN, flex: 1 }} onClick={() => setBriefOpen(true)}>Scene brief</button>
      </div>
    </>
  );

  // ═════════════════════════════════════════════════════════════════
  const panelBase = { position: "absolute" as const, zIndex: 10, background: PANEL_BG, border: "1px solid var(--sf-line)", overflowY: "auto" as const };
  return (
    <div className="exosky-root" style={{ width: "100%", height: "100%", overflow: "hidden", background: tokens.surface.simCanvas, position: "relative", fontFamily: FONT_SANS }}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-roledescription="sky view"
        aria-label={`The sky from ${resolved.label}. Arrow keys pan, plus and minus zoom, question mark lists shortcuts.`}
        aria-describedby="exo-view-status"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: drawMode ? "crosshair" : "grab", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setHovered(null); }}
        onWheel={onWheel}
        onKeyDown={onCanvasKey}
      />

      <SimulatorTitle name="EXOSKY" subtitle="The sky from any world" context={resolved.label}>
        <div role="status" style={{ display: "inline-block", padding: "6px 14px", fontSize: 12, fontFamily: FONT_MONO, fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase",
          background: catalogueError ? "rgb(var(--sf-crimson-rgb) / 0.06)" : catalogue && mwReady ? "rgb(var(--sf-primary-rgb) / 0.06)" : "rgb(var(--sf-amber-rgb) / 0.06)",
          border: `1px solid ${catalogueError ? "var(--sf-crimson)" : catalogue && mwReady ? "var(--sf-primary)" : "var(--sf-amber)"}`,
          color: catalogueError ? "var(--sf-crimson-text)" : catalogue && mwReady ? "var(--sf-primary-text)" : "var(--sf-amber-text)" }}>
          {catalogueError ? `// ${catalogueError}` : !catalogue ? "// LOADING STARS" : !mwReady ? "// COMPUTING GALAXY" : unplaced ? "// NOT PLACED" : "● OBSERVING"}
        </div>
        {catalogueError && <button type="button" onClick={loadStars} style={{ ...BTN, marginLeft: 8 }}>Retry</button>}
      </SimulatorTitle>

      {!isMobile && (
        <>
          <div className="sf-sb" style={{ ...panelBase, top: 144, left: 18, width: 288, maxHeight: "calc(100% - 200px)", padding: panelOpen ? "12px 16px" : "6px 14px" }}>
            <button type="button" onClick={() => setPanelOpen((p) => !p)} aria-expanded={panelOpen} style={COLLAPSE}>
              <span style={{ ...SH, border: "none" }}>Controls</span><span aria-hidden style={{ color: "var(--t3)" }}>{panelOpen ? "▾" : "▸"}</span>
            </button>
            {panelOpen && controlsPanel}
          </div>
          <div className="sf-sb" style={{ ...panelBase, top: 16, right: narrativeBridgeOpen ? 18 + 320 + 12 : 18, width: 320, maxHeight: "calc(100% - 72px)", padding: dataOpen ? "12px 16px" : "6px 14px", transition: "right 280ms cubic-bezier(0.2, 0, 0, 1)" }}>
            <button type="button" onClick={() => setDataOpen((p) => !p)} aria-expanded={dataOpen} style={COLLAPSE}>
              <span style={{ ...SH, border: "none" }}>Sky data</span><span aria-hidden style={{ color: "var(--t3)" }}>{dataOpen ? "▾" : "▸"}</span>
            </button>
            {dataOpen && dataPanel}
          </div>
        </>
      )}

      {isMobile && (
        <>
          {sheet !== "none" && (
            <div className="sf-sb" role="region" aria-label={sheet === "controls" ? "Controls" : "Sky data"} style={{ ...panelBase, left: 0, right: 0, bottom: 52, maxHeight: "52vh", padding: "12px 16px", borderLeft: "none", borderRight: "none" }}>
              {sheet === "controls" ? controlsPanel : dataPanel}
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 11, display: "flex", gap: 6, padding: 4, background: PANEL_BG, borderTop: "1px solid var(--sf-line)" }}>
            {([["controls", "Controls"], ["data", "Sky data"]] as const).map(([k, label]) => (
              <button key={k} type="button" aria-expanded={sheet === k} onClick={() => setSheet((s) => (s === k ? "none" : k))} style={{ ...BTN, ...(sheet === k ? null : BTN_QUIET), flex: 1 }}>{label}</button>
            ))}
          </div>
        </>
      )}

      {/* View readout: DOM, not canvas, so it is legible and announced. */}
      <div style={{ position: "absolute", right: isMobile ? 12 : narrativeBridgeOpen ? 18 + 320 + 12 + 332 : 18 + 332, bottom: isMobile ? 64 : 40, zIndex: 9, textAlign: "right", pointerEvents: "none" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: "var(--t1)" }}>{fovLabel}°</div>
        <div style={{ fontSize: 12, color: "var(--t3)" }}>field of view</div>
      </div>
      <div id="exo-view-status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{announce}</div>

      {drawMode && (
        <div style={{ position: "absolute", top: isMobile ? 120 : 24, left: "50%", transform: "translateX(-50%)", zIndex: 12, background: PANEL_BG, border: `1px solid ${drawColor}`, padding: "6px 12px", fontSize: 13, color: "var(--t1)" }}>
          Drawing: tap stars to connect ({currentDrawing.length})
        </div>
      )}

      {namingMode && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sf-scrim)" }}>
          <div role="dialog" aria-modal="true" aria-labelledby="exo-name-title" style={{ background: "var(--sf-surface-elevated)", border: "1px solid var(--sf-line)", padding: "24px 28px", width: 360, maxWidth: "92vw" }}>
            <h2 id="exo-name-title" style={{ ...SH, fontSize: 12 }}>Name this constellation</h2>
            <p style={NOTE}>{currentDrawing.length} stars, seen from {resolved.label}, epoch {epochYears === 0 ? "J2000" : `${epochYears > 0 ? "+" : ""}${epochYears} yr`}.</p>
            <label htmlFor="exo-cons-name" style={LBL_BLOCK}>Name</label>
            <input id="exo-cons-name" type="text" value={constellationName} onChange={(e) => setConstellationName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveConstellation(); }} placeholder="e.g. The Wanderer" autoFocus maxLength={40} style={FIELD} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => { setNamingMode(false); setConstellationName(""); }} style={{ ...BTN, ...BTN_QUIET, flex: 1 }}>Back</button>
              <button type="button" onClick={saveConstellation} disabled={!constellationName.trim()} style={{ ...BTN, flex: 2, ...(constellationName.trim() ? null : BTN_DISABLED) }}>Save constellation</button>
            </div>
          </div>
        </div>
      )}

      {briefOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sf-scrim)" }}>
          <div role="dialog" aria-modal="true" aria-labelledby="exo-brief-title" className="sf-sb" style={{ background: "var(--sf-surface-elevated)", border: "1px solid var(--sf-line)", padding: "24px 28px", width: 560, maxWidth: "94vw", maxHeight: "86vh", overflowY: "auto" }}>
            <h2 id="exo-brief-title" style={{ ...SH, fontSize: 12 }}>Scene brief</h2>
            <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.10em", color: "var(--sf-amber-text)", margin: "8px 0" }}>{brief.label}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="sf-measure">
              {brief.lines.map((l, n) => (
                <li key={n} style={{ padding: "8px 0", borderBottom: "1px solid var(--sf-line-hairline)" }}>
                  <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--t2)" }}>{l.text}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "var(--t4)", marginTop: 2 }}>{l.cites.join(" · ")}</div>
                </li>
              ))}
            </ul>
            <p style={{ ...NOTE, color: "var(--t3)" }}>Conditions, not prose. Copy what you need by hand; nothing here goes into your manuscript by itself.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => { void navigator.clipboard?.writeText(briefAsText(brief)); toast({ title: "BRIEF COPIED." }); }} style={{ ...BTN, ...BTN_QUIET, flex: 1 }}>Copy text</button>
              <button type="button" onClick={() => setBriefOpen(false)} style={{ ...BTN, flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showKbHelp && (
        <div role="dialog" aria-label="Keyboard shortcuts" style={{ ...panelBase, top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 50, width: 260, padding: "12px 16px" }}>
          <h3 style={SH}>Keyboard shortcuts</h3>
          {[["Arrows", "Look around"], ["+ / −", "Zoom"], ["Drag", "Look around"], ["Scroll / pinch", "Zoom"], ["Tap", "Identify a star"], ["Esc", "Cancel / close"], ["Ctrl+Z", "Undo star (drawing)"], ["?", "This list"]].map(([k, d]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", lineHeight: 2 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "var(--sf-primary-text)" }}>{k}</span>
              <span style={{ fontSize: 12, color: "var(--t3)" }}>{d}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "absolute", bottom: isMobile ? 60 : 12, left: 18, zIndex: 9, fontSize: 12, color: "var(--t4)", maxWidth: isMobile ? "60%" : 520, lineHeight: 1.5 }}>
        © 2025–2026 Jason D. Batt, Ph.D. · {isMobile ? "Stars: HYG v4.1, CC BY-SA 4.0" : CATALOGUE_CREDIT.replace("Star catalogue: ", "Stars: ")} · <a href="/tools/exosky/science" style={{ color: "var(--sf-primary-text)" }}>The science</a>
      </div>

      <style>{`
        .exosky-root input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:24px;background:transparent}
        .exosky-root input[type=range]::-webkit-slider-runnable-track{height:2px;background:var(--sf-line-interactive)}
        .exosky-root input[type=range]::-moz-range-track{height:2px;background:var(--sf-line-interactive)}
        .exosky-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;margin-top:-7px;background:var(--sf-primary);border:2px solid var(--sf-void);cursor:pointer}
        .exosky-root input[type=range]::-moz-range-thumb{width:16px;height:16px;background:var(--sf-primary);border:2px solid var(--sf-void);border-radius:0;cursor:pointer}
        .exosky-root input[type=checkbox]{accent-color:var(--sf-primary);width:16px;height:16px}
        .exosky-root select option,.exosky-root select optgroup{background:var(--sf-surface);color:var(--t2)}
        .exosky-root details>summary{cursor:pointer}
      `}</style>
    </div>
  );
}

// ── Small controls ──────────────────────────────────────────────────
function Slider({ id, label, value, min, max, step, onChange, display }: { id: string; label: string; value: number; min: number; max: number; step: number | "any"; onChange: (v: number) => void; display: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <label htmlFor={id} style={LBL}>{label}</label>
        <span style={VAL}>{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={display} style={{ width: "100%", minHeight: 32 }} />
    </div>
  );
}

function NumberRow({ id, label, value, min, max, step, onChange, tag }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; tag?: ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <label htmlFor={id} style={LBL_BLOCK}>{label}{tag}</label>
      <input id={id} type="number" min={min} max={max} step={step} value={Number.isFinite(value) ? Number(value.toFixed(3)) : ""}
        onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(clamp(n, min, max)); }} style={NUM_INPUT} />
    </div>
  );
}

function DR({ l, v }: { l: ReactNode; v: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, lineHeight: 1.7, alignItems: "baseline" }}>
      <span style={{ color: "var(--t3)", fontSize: 13 }}>{l}</span>
      <span style={{ color: "var(--t1)", fontWeight: 500, fontFamily: FONT_MONO, fontSize: 13, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function tagStyle(status: string) {
  const hue = status === "confirmed" || status === "home" || status === "yours" ? "emerald" : status === "candidate" || status === "disputed" ? "amber" : status === "refuted" ? "crimson" : "stellar";
  return { display: "inline-block", padding: "2px 8px", fontSize: 12, fontWeight: 500, borderRadius: 0, border: `1px solid var(--sf-${hue})`, background: `rgb(var(--sf-${hue}-rgb) / 0.06)`, color: `var(--sf-${hue}-text)` } as const;
}

// ── Style tokens ────────────────────────────────────────────────────
// DOM chrome reads the generated CSS variables so it follows the theme.
const FONT_HEADING = "var(--font-heading)";
const FONT_SANS = "var(--font-sans)";
const FONT_MONO = "var(--font-mono)";
const EASE = "180ms cubic-bezier(0.2, 0, 0, 1)";
const PANEL_BG = "rgb(var(--sf-surface-rgb))";
const SH = { display: "block", fontSize: 12, fontFamily: FONT_HEADING, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t4)", margin: 0, paddingBottom: 4, borderBottom: "1px solid var(--sf-line-hairline)", width: "100%", textAlign: "left" } as const;
const COLLAPSE = { cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, width: "100%", minHeight: "var(--hit-min)", background: "none", border: "none", padding: 0, color: "inherit" } as const;
const LBL = { fontSize: 13, fontFamily: FONT_SANS, color: "var(--t3)" } as const;
const LBL_BLOCK = { display: "block", fontSize: 13, fontFamily: FONT_SANS, color: "var(--t3)", marginTop: 8 } as const;
const VAL = { fontSize: 13, fontFamily: FONT_MONO, fontWeight: 500, color: "var(--t1)", textAlign: "right" } as const;
const NOTE = { fontSize: 13, color: "var(--t2)", lineHeight: 1.5, margin: "6px 0 0" } as const;
const SEL = { width: "100%", marginTop: 6, fontFamily: FONT_SANS, fontSize: 16, background: "var(--sf-void)", color: "var(--t1)", border: "1px solid var(--sf-line-hairline)", borderBottomColor: "var(--sf-line-interactive)", padding: "7px 10px", minHeight: "var(--hit-min)", borderRadius: 0 } as const;
const FIELD = { width: "100%", marginTop: 6, fontFamily: FONT_SANS, fontSize: 16, background: "var(--sf-void)", color: "var(--t1)", border: "1px solid var(--sf-line-hairline)", borderBottomColor: "var(--sf-line-interactive)", padding: "8px 10px", minHeight: "var(--hit-min)", borderRadius: 0 } as const;
const NUM_INPUT = { ...FIELD, fontFamily: FONT_MONO, marginTop: 4 } as const;
const BTN = { fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, padding: "8px 12px", minHeight: "var(--hit-min)", border: "1px solid var(--sf-primary)", background: "rgb(var(--sf-primary-rgb) / 0.06)", color: "var(--sf-primary-text)", cursor: "pointer", borderRadius: 0, transition: `background-color ${EASE}, border-color ${EASE}, color ${EASE}` } as const;
const BTN_QUIET = { background: "transparent", borderColor: "var(--sf-line)", color: "var(--t2)" } as const;
const BTN_DISABLED = { background: "var(--sf-disabled-bg)", borderColor: "var(--sf-disabled-line)", color: "var(--sf-disabled-text)", cursor: "not-allowed" } as const;
const MINI = { fontFamily: FONT_SANS, fontSize: 13, background: "none", border: "1px solid var(--sf-line)", borderRadius: 0, padding: "4px 10px", minHeight: "var(--hit-min)", cursor: "pointer", color: "var(--t2)" } as const;
const CKL = { display: "flex", alignItems: "center", gap: 8, minHeight: "var(--hit-min)", fontSize: 14, color: "var(--t2)", cursor: "pointer", flexWrap: "wrap" } as const;
const CK = { accentColor: "var(--sf-primary)", width: 16, height: 16 } as const;
const LIST = { listStyle: "none", padding: 0, margin: "6px 0 0" } as const;
const LIST_BTN = { display: "block", width: "100%", textAlign: "left", fontFamily: FONT_SANS, fontSize: 14, background: "none", border: "none", borderBottom: "1px solid var(--sf-line-hairline)", padding: "8px 4px", minHeight: "var(--hit-min)", color: "var(--t1)", cursor: "pointer" } as const;
const CARD = { border: "1px solid var(--sf-line)", background: "var(--sf-surface-elevated)", padding: "8px 12px" } as const;
const WARN = { border: "1px solid var(--sf-amber)", background: "rgb(var(--sf-amber-rgb) / 0.06)", padding: "8px 10px", margin: "8px 0" } as const;
const WARN_TITLE = { fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--sf-amber-text)", marginBottom: 4 } as const;
const SUMMARY = { fontSize: 14, color: "var(--t1)", minHeight: "var(--hit-min)", display: "flex", alignItems: "center" } as const;
function swatchStyle(hex: string, selected: boolean) {
  return { width: 36, height: 36, padding: 0, borderRadius: 0, background: hex, cursor: "pointer", border: selected ? "2px solid var(--t1)" : "2px solid var(--sf-line)", transition: `border-color ${EASE}` } as const;
}
