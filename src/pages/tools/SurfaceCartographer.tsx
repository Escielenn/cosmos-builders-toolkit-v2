// ---------------------------------------------------------------------------
// Surface Cartographer — the Planet / Moon Cartographer (05 Tier C, B5; 13 F5).
//
// THE FOUR QUESTIONS (05-NEW-SYSTEMS.md, gate for /sf-new-tool)
//
// 1. Produces, that nothing else produces:
//      place.* — `location` entities filed under a planet or moon, carrying
//      place.coordinates (metadata lat/lon), place.settlement_type
//      (metadata placeType) and a description in the writer's words. Also the
//      body's map sheet (metadata map_sheet_url/_projection), shared with the
//      Codex's MapSheetSection — one sheet, two doors.
// 2. Consumes, that already exists:
//      Genesis (planet radius, gravity, tilt, day length, tidal state, mean
//      temperature, ocean cover, atmosphere, star class); Tidelock (tidal
//      state, habitable-band share → terminator width); the entity tree (the
//      star that lights the body → globe light colour). Symbiosis biome sets
//      are not yet persisted in a readable shape; the generated map's biome
//      bands are the stand-in and are labelled as a picture, not a fact.
// 3. Changes how a scene reads:
//      Settings become located. A place has a latitude, so it has a climate
//      band, a daylight swing or a fixed star in its sky, and a distance in
//      days from every other place. `setInPlaceId` on a document
//      (src/lib/document-meta.ts) is the hook that makes `set_in` real.
// 4. Absorbs:
//      The roadmapped "Planet / Moon Cartographer" (now a zoom level of the
//      one map, B5): this is the EDITING surface for the Codex Atlas's planet
//      zoom, which stays the reading surface. Places placed here appear there
//      with no adapter, because both read the same entities.
//
// Ephemeral by declaration: travel speed, the measure-to place, the
// generator seed, flat/globe view. Instrument settings, not world claims.
// ---------------------------------------------------------------------------

import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Crosshair, Globe2, ImagePlus, Map as MapIcon, MapPin, Plus, Shuffle, Upload } from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import SectionNavigation, { MobileSectionNav, type Section } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWorldId } from "@/hooks/use-world-id";
import { useWorlds } from "@/hooks/use-worlds";
import { useSubjectEntityId } from "@/hooks/use-subject-entity";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  useWorksheet,
  useWorksheets,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import { useWorksheetSubjects } from "@/hooks/use-worksheet-subjects";
import { useCreateEntity, useEntities, useUpdateEntity } from "@/hooks/use-entity-graph";
import { useEntityAttachedWorksheets } from "@/hooks/use-codex-entity";
import { useWorldSimulations } from "@/hooks/use-world-simulations";
import { attachWorksheetToEntity } from "@/services/worksheet-subjects";
import type { Json } from "@/integrations/supabase/types";
import type { Entity } from "@/services/entity-graph-types";
import { mapError, VOICE } from "@/lib/ship-voice";
import { writeStandaloneBackup } from "@/lib/standalone-backup";
import {
  MAP_PROJECTIONS,
  MAP_PROJECTION_LABELS,
  readMapSheet,
  type MapProjection,
} from "@/lib/atlas/placement";
import { BIOME_LABELS } from "@/lib/palettes/biomes";
import { biomeAt } from "@/lib/surface-cartographer/basemap";
import { findStarFor, resolveBodyFacts } from "@/lib/surface-cartographer/body";
import { clampLat, formatLatLon, isValidLatLon, roundCoord, wrapLon, type LatLon } from "@/lib/surface-cartographer/geo";
import { placeSky, terminatorHalfWidthFromHabitable } from "@/lib/surface-cartographer/illumination";
import {
  INITIAL_STATE,
  PLACE_TYPES,
  PLACE_TYPE_LABELS,
  UNPLACE_PATCH,
  buildGazetteerMarkdown,
  buildGazetteerReport,
  gazetteerSnapshot,
  placeMetadataPatch,
  placesOnBody,
  readState,
  type PlaceType,
  type SurfaceCartographerState,
  type SurfacePlace,
  type GazetteerReport,
} from "@/lib/surface-cartographer/places";
import ExportDialog from "@/components/tools/ExportDialog";
import { SurfaceGazetteerTemplate } from "@/lib/pdf/templates";
import { MAX_SHEET_BYTES, checkSheet } from "@/lib/surface-cartographer/sheet";
import { resolveStorageUrl, uploadMapSheet } from "@/services/storage-urls";
import { bindGlobe } from "@/gl/bind/globe";
import FlatMap from "@/components/tools/surface-cartographer/FlatMap";
import BodyFactsPanel from "@/components/tools/surface-cartographer/BodyFactsPanel";
import PlaceReadouts from "@/components/tools/surface-cartographer/PlaceReadouts";
import { ToolWorldBar } from "@/components/tools/ToolWorldBar";
import {
  canvasToBlob,
  loadImage,
  paintBaseMap,
  readImageSize,
  toEquirectCanvas,
  composeMapSheet,
  type GeneratedMap,
} from "@/components/tools/surface-cartographer/sheet-canvas";

// three.js only loads when the writer opens the globe.
const GlobeScene = lazy(() => import("@/gl/scenes/GlobeScene"));

const TOOL_TYPE = "surface-cartographer";
const LOCAL_STORAGE_KEY = "surface-cartographer-v1";

const SECTIONS: Section[] = [
  { id: "body", title: "Body" },
  { id: "map", title: "Map" },
  { id: "places", title: "Places" },
  { id: "readouts", title: "Readouts" },
];

interface Draft {
  id: string | null;
  name: string;
  placeType: PlaceType;
  description: string;
  lat: string;
  lon: string;
}

const EMPTY_DRAFT: Draft = { id: null, name: "", placeType: "city", description: "", lat: "", lon: "" };

function draftFromPlace(p: SurfacePlace): Draft {
  return {
    id: p.id,
    name: p.name,
    placeType: p.placeType,
    description: p.description,
    lat: p.at ? String(p.at.lat) : "",
    lon: p.at ? String(p.at.lon) : "",
  };
}

function draftCoords(d: Draft | null): LatLon | null {
  if (!d || d.lat.trim() === "" || d.lon.trim() === "") return null;
  const lat = Number(d.lat);
  const lon = Number(d.lon);
  return isValidLatLon(lat, lon) ? { lat, lon } : null;
}

/** WebGL can be missing or lost. The flat map must survive that. */
class GlobeBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <p className="font-mono text-[13px] text-sf-crimson-text">
            // GLOBE UNAVAILABLE ON THIS DEVICE. THE FLAT MAP CARRIES EVERY PLACE.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const SurfaceCartographer = () => {
  useMetaTags({ title: "Surface Cartographer" });
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const worldId = useWorldId();
  const subjectId = useSubjectEntityId();
  const [searchParams, setSearchParams] = useSearchParams();
  const worksheetId = searchParams.get("worksheetId");
  const reducedMotion = usePrefersReducedMotion();
  const worldName = worldId ? worlds.find((w) => w.id === worldId)?.name : undefined;

  const [state, setState] = useState<SurfaceCartographerState>(INITIAL_STATE);
  const [savedJson, setSavedJson] = useState<string>(JSON.stringify(INITIAL_STATE));
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<null | "upload" | "attach" | "place" | "body">(null);

  // ── Data ────────────────────────────────────────────────────────────
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: myWorksheets = [], isLoading: myWorksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { data: entitiesData } = useEntities(worldId || undefined);
  const entities = useMemo(() => entitiesData ?? [], [entitiesData]);
  const createEntity = useCreateEntity(worldId || undefined);
  const updateEntity = useUpdateEntity(worldId || undefined);
  const { data: profiles = [] } = useWorksheetsByType(worldId || undefined, "planetary-profile");
  const profileIds = useMemo(() => profiles.map((p) => p.id), [profiles]);
  const { data: profileSubjects = {} } = useWorksheetSubjects(profileIds);
  const { simulations } = useWorldSimulations(worldId || undefined);
  const tidelockSaves = useMemo(() => simulations.filter((s) => s.simulator_type === "tidelock"), [simulations]);

  const bodyEntity = useMemo(
    () => entities.find((e) => e.id === state.bodyEntityId) ?? null,
    [entities, state.bodyEntityId],
  );
  const { data: attached = [] } = useEntityAttachedWorksheets(bodyEntity?.id);

  // Genesis for this body: the entity's attached profile (primary first),
  // else the profile the writer picked directly.
  const profile = useMemo(() => {
    const linked = [...attached]
      .filter((a) => a.toolType === "planetary-profile")
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))[0];
    if (linked) return { id: linked.worksheetId, title: linked.worksheetTitle, data: linked.data };
    const chosen = profiles.find((p) => p.id === state.bodyWorksheetId);
    return chosen ? { id: chosen.id, title: chosen.title, data: chosen.data } : null;
  }, [attached, profiles, state.bodyWorksheetId]);

  const tidelock = useMemo(() => {
    const s = tidelockSaves.find((t) => t.id === state.tidelockSaveId);
    return s ? { id: s.id, name: s.name, data: s.data } : null;
  }, [tidelockSaves, state.tidelockSaveId]);

  const star = useMemo(() => findStarFor(bodyEntity, entities), [bodyEntity, entities]);

  const facts = useMemo(
    () => resolveBodyFacts({ worldId, entity: bodyEntity, profile, tidelock, star }),
    [worldId, bodyEntity, profile, tidelock, star],
  );
  const locked = facts.tidallyLocked?.value === true;

  const places = useMemo(() => placesOnBody(entities, bodyEntity?.id ?? null), [entities, bodyEntity]);
  const selected = places.find((p) => p.id === selectedId) ?? null;

  // Bodies: planet and moon entities, plus Genesis profiles not yet filed
  // under one. A linked profile collapses into its entity.
  const bodyOptions = useMemo(() => {
    const ents = entities
      .filter((e) => e.entity_type === "planet" || e.entity_type === "moon")
      .map((e) => ({ value: `entity:${e.id}`, label: `${e.name} · ${e.entity_type === "moon" ? "MOON" : "PLANET"}` }));
    const loose = profiles
      .filter((p) => !profileSubjects[p.id])
      .map((p) => ({ value: `worksheet:${p.id}`, label: `${p.title || "Untitled profile"} · GENESIS ONLY` }));
    return [...ents, ...loose];
  }, [entities, profiles, profileSubjects]);

  const sheet = readMapSheet(bodyEntity);
  const showingSheet = state.mapSource === "sheet" && !!sheet;

  // Where a missing number gets set: the Codex page if there is an entity,
  // else the Genesis worksheet, else a fresh Genesis.
  const setHref = bodyEntity
    ? `/worlds/${worldId}/codex/${bodyEntity.id}`
    : profile
      ? `/tools/planetary-profile?worldId=${worldId ?? ""}&worksheetId=${profile.id}`
      : `/tools/planetary-profile${worldId ? `?worldId=${worldId}` : ""}`;
  const setLabel = bodyEntity ? "SET IN CODEX" : "SET IN GENESIS";

  // ── Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (worldId && !worksheetId && !myWorksheetsLoading && user && !subjectId) setSelectorOpen(true);
  }, [worldId, worksheetId, myWorksheetsLoading, user, subjectId]);

  useEffect(() => {
    if (!existingWorksheet) return;
    const loaded = readState(existingWorksheet.data);
    setState(loaded);
    setSavedJson(JSON.stringify(loaded));
    setCurrentWorksheetId(existingWorksheet.id);
    setCurrentWorksheetTitle(existingWorksheet.title);
    toast({ title: "WORKSHEET LOADED.", description: "MAP RESTORED." });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingWorksheet]);

  // Opened ON an entity (F4): that entity is the body.
  useEffect(() => {
    if (!subjectId || worksheetId) return;
    const e = entities.find((x) => x.id === subjectId);
    if (e && (e.entity_type === "planet" || e.entity_type === "moon") && state.bodyEntityId !== e.id) {
      setState((s) => ({ ...s, bodyEntityId: e.id, bodyWorksheetId: null, bodyName: e.name }));
    }
  }, [subjectId, worksheetId, entities, state.bodyEntityId]);

  useEffect(() => {
    if (worldId || worksheetId) return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) setState(readState(JSON.parse(saved)));
    } catch {
      // A private window or blocked storage starts fresh.
    }
  }, [worldId, worksheetId]);

  // A body with a sheet opens on its sheet the first time.
  const sheetSeenFor = useRef<string | null>(null);
  useEffect(() => {
    if (sheet && bodyEntity && sheetSeenFor.current !== bodyEntity.id) {
      sheetSeenFor.current = bodyEntity.id;
      setState((s) => (s.mapSource === "sheet" ? s : { ...s, mapSource: "sheet" }));
    }
  }, [sheet, bodyEntity]);

  const dirty = JSON.stringify(state) !== savedJson;
  useUnsavedChangesGuard(dirty);

  // ── Sheet image ─────────────────────────────────────────────────────
  const [sheetImg, setSheetImg] = useState<HTMLImageElement | null>(null);
  const [sheetFailed, setSheetFailed] = useState(false);
  useEffect(() => {
    setSheetImg(null);
    setSheetFailed(false);
    if (!sheet?.url) return;
    let alive = true;
    resolveStorageUrl(sheet.url)
      .then((src) => loadImage(src))
      .then((img) => alive && setSheetImg(img))
      .catch(() => alive && setSheetFailed(true));
    return () => {
      alive = false;
    };
  }, [sheet?.url]);
  const sheetCheck =
    sheet && sheetImg ? checkSheet(sheetImg.naturalWidth, sheetImg.naturalHeight, sheet.projection) : null;

  // ── Generated map ───────────────────────────────────────────────────
  const [generated, setGenerated] = useState<GeneratedMap | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const genParams = useMemo(
    () => ({
      seed: state.generatorSeed,
      oceanFraction: facts.oceanFraction?.value ?? null,
      meanTempC: facts.meanTempC?.value ?? null,
      tiltDeg: facts.tiltDeg?.value ?? null,
      locked,
      substellarLon: state.substellarLon,
    }),
    [state.generatorSeed, facts.oceanFraction, facts.meanTempC, facts.tiltDeg, locked, state.substellarLon],
  );
  const genKey = JSON.stringify(genParams);
  useEffect(() => {
    if (showingSheet) return;
    let alive = true;
    setGenerating(true);
    // Debounced, and off the input's own frame so a slider never stutters.
    const t = window.setTimeout(() => {
      const g = paintBaseMap(genParams);
      if (!alive) return;
      setGenerated(g);
      canvasToBlob(g.canvas)
        .then((blob) => {
          if (!alive) return;
          setGeneratedUrl((old) => {
            if (old) URL.revokeObjectURL(old);
            return URL.createObjectURL(blob);
          });
        })
        .finally(() => alive && setGenerating(false));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
    // genKey stands for genParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genKey, showingSheet]);
  useEffect(() => () => {
    setGeneratedUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, []);

  // ── Globe texture ───────────────────────────────────────────────────
  const [globeFailed, setGlobeFailed] = useState(false);
  const globeCanvas = useMemo(() => {
    if (state.view !== "globe") return null;
    if (showingSheet) return sheetImg && sheet ? toEquirectCanvas(sheetImg, sheet.projection) : null;
    return generated?.canvas ?? null;
  }, [state.view, showingSheet, sheetImg, sheet, generated]);
  const globeBinding = useMemo(
    () =>
      bindGlobe({
        tiltDeg: facts.tiltDeg?.value ?? null,
        tidallyLocked: facts.tidallyLocked?.value ?? null,
        dayLengthHours: facts.dayLengthHours?.value ?? null,
        atmoPressureBar: facts.atmoPressureBar?.value ?? null,
        atmoComposition: facts.atmoComposition?.value ?? null,
        starClass: facts.starClass?.value ?? null,
        substellarLon: state.substellarLon,
      }),
    [facts, state.substellarLon],
  );

  // ── Body selection ──────────────────────────────────────────────────
  const chooseBody = (value: string) => {
    const [kind, id] = value.split(":");
    setSelectedId(null);
    setDraft(null);
    if (kind === "entity") {
      const e = entities.find((x) => x.id === id);
      setState((s) => ({ ...s, bodyEntityId: id, bodyWorksheetId: null, bodyName: e?.name ?? "" }));
    } else {
      const p = profiles.find((x) => x.id === id);
      setState((s) => ({ ...s, bodyEntityId: null, bodyWorksheetId: id, bodyName: p?.title ?? "" }));
    }
  };

  /** A Genesis-only body cannot hold places. File it as a planet, linked to its profile. */
  const fileBodyAsEntity = async () => {
    if (!profile || !worldId || !user) return;
    setBusy("body");
    try {
      const entity = await createEntity.mutateAsync({
        name: profile.title || "Unnamed world",
        entity_type: "planet",
      });
      const link = await attachWorksheetToEntity(entity.id, profile.id);
      if ("error" in link) throw new Error(link.error);
      setState((s) => ({ ...s, bodyEntityId: entity.id, bodyWorksheetId: null, bodyName: entity.name }));
      toast({ title: "PLANET FILED.", description: "GENESIS PROFILE LINKED. PLACES CAN NOW BE DROPPED." });
    } catch (err) {
      toast({ title: VOICE.genericError, description: mapError(err), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  // ── Sheet upload ────────────────────────────────────────────────────
  const [pendingProjection, setPendingProjection] = useState<MapProjection>("equirectangular");
  const uploadSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !bodyEntity) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "UNSUPPORTED FILE.", description: "A MAP SHEET MUST BE AN IMAGE.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SHEET_BYTES) {
      toast({ title: "FILE TOO LARGE.", description: `MAP SHEETS ARE CAPPED AT ${MAX_SHEET_BYTES / 1024 / 1024} MB.`, variant: "destructive" });
      return;
    }
    setBusy("upload");
    try {
      const size = await readImageSize(file);
      const check = checkSheet(size.width, size.height, pendingProjection);
      const storedUrl = await uploadMapSheet({
        userId: user.id,
        worldId: bodyEntity.world_id,
        entityId: bodyEntity.id,
        body: file,
        ext: file.name.split(".").pop() ?? "png",
      });
      await updateEntity.mutateAsync({
        id: bodyEntity.id,
        metadata: { map_sheet_url: storedUrl, map_sheet_projection: pendingProjection },
      });
      setState((s) => ({ ...s, mapSource: "sheet" }));
      toast({
        title: "MAP SHEET ATTACHED.",
        description: check.warning ?? `${MAP_PROJECTION_LABELS[pendingProjection].toUpperCase()} SHEET ON FILE. THE ATLAS NOW SHOWS IT.`,
        variant: check.ok ? undefined : "destructive",
      });
    } catch (err) {
      toast({ title: "UPLOAD FAILED.", description: mapError(err), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const setSheetProjection = (projection: MapProjection) => {
    if (!bodyEntity) return;
    updateEntity.mutate({ id: bodyEntity.id, metadata: { map_sheet_projection: projection } });
  };

  /** Keep the generated draft as the body's sheet, so the Atlas shows it too. */
  const attachGenerated = async () => {
    if (!generated || !user || !bodyEntity) return;
    setBusy("attach");
    try {
      const blob = await canvasToBlob(generated.canvas);
      const storedUrl = await uploadMapSheet({
        userId: user.id,
        worldId: bodyEntity.world_id,
        entityId: bodyEntity.id,
        body: blob,
        ext: "png",
        contentType: "image/png",
      });
      await updateEntity.mutateAsync({
        id: bodyEntity.id,
        metadata: { map_sheet_url: storedUrl, map_sheet_projection: "equirectangular" },
      });
      setState((s) => ({ ...s, mapSource: "sheet" }));
      toast({ title: "GENERATED MAP FILED AS SHEET.", description: "PAINT OVER IT ELSEWHERE AND ATTACH THE RESULT WHEN READY." });
    } catch (err) {
      toast({ title: "UPLOAD FAILED.", description: mapError(err), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  // ── Places ──────────────────────────────────────────────────────────
  const sheetGeometry = sheet && sheetImg
    ? { projection: sheet.projection, aspect: sheetImg.naturalWidth / sheetImg.naturalHeight }
    : { projection: "equirectangular" as MapProjection, aspect: 2 };

  const onPick = useCallback((at: LatLon) => {
    const lat = roundCoord(clampLat(at.lat));
    const lon = roundCoord(wrapLon(at.lon));
    setDraft((d) => ({ ...(d ?? EMPTY_DRAFT), lat: String(lat), lon: String(lon) }));
  }, []);

  const selectPlace = (id: string) => {
    setSelectedId(id);
    const p = places.find((x) => x.id === id);
    if (p) setDraft(draftFromPlace(p));
  };

  const fileDraft = async () => {
    if (!draft || !bodyEntity) return;
    const name = draft.name.trim();
    if (!name) {
      toast({ title: VOICE.requiredField, description: "NAME THE PLACE.", variant: "destructive" });
      return;
    }
    const at = draftCoords(draft);
    if ((draft.lat.trim() || draft.lon.trim()) && !at) {
      toast({ title: VOICE.outsideRange, description: "LATITUDE −90 TO 90, LONGITUDE −180 TO 180.", variant: "destructive" });
      return;
    }
    const metadata = at
      ? placeMetadataPatch(at, bodyEntity.id, draft.placeType, sheetGeometry)
      : { ...UNPLACE_PATCH, placeType: draft.placeType, bodyEntityId: bodyEntity.id };
    setBusy("place");
    try {
      if (draft.id) {
        await updateEntity.mutateAsync({ id: draft.id, name, description: draft.description, metadata });
        toast({ title: "PLACE REVISED.", description: at ? formatLatLon(at) : "UNPLACED. ENTRY KEPT IN CODEX." });
      } else {
        const created: Entity = await createEntity.mutateAsync({
          name,
          entity_type: "location",
          description: draft.description,
          parent_entity_id: bodyEntity.id,
          metadata,
        });
        setSelectedId(created.id);
        setDraft(draftFromPlace({ id: created.id, name, placeType: draft.placeType, description: draft.description, at }));
        toast({ title: "PLACE FILED.", description: at ? `${formatLatLon(at)}. NOW IN THE CODEX AND @-MENTIONABLE.` : "UNPLACED. SET COORDINATES WHEN READY." });
      }
    } catch {
      // The entity hooks already toast a mapped error.
    } finally {
      setBusy(null);
    }
  };

  const unplace = async () => {
    if (!draft?.id) return;
    setBusy("place");
    try {
      await updateEntity.mutateAsync({ id: draft.id, metadata: UNPLACE_PATCH });
      setDraft((d) => (d ? { ...d, lat: "", lon: "" } : d));
      toast({ title: "PLACE UNPLACED.", description: "ENTRY, NAME AND WORDS KEPT IN CODEX." });
    } finally {
      setBusy(null);
    }
  };

  // ── Save / export ───────────────────────────────────────────────────
  const stateForSave = useCallback(
    (): SurfaceCartographerState => ({ ...state, bodyName: facts.name, gazetteer: gazetteerSnapshot(places) }),
    [state, facts.name, places],
  );

  const handleSave = async () => {
    const toSave = stateForSave();
    writeStandaloneBackup(LOCAL_STORAGE_KEY, toSave, { worldId, signedIn: !!user });
    if (worldId && user) {
      const wsId = currentWorksheetId || worksheetId;
      try {
        if (wsId) {
          await updateWorksheet.mutateAsync({ worksheetId: wsId, data: toSave as unknown as Json });
          toast({ title: VOICE.savedWorksheet, description: "MAP SETTINGS AND GAZETTEER SNAPSHOT ON FILE." });
        } else {
          const ws = await createWorksheet.mutateAsync({
            worldId,
            toolType: TOOL_TYPE,
            title: facts.name ? `${facts.name} surface` : "Surface map",
            data: toSave as unknown as Json,
            subjectEntityId: bodyEntity?.id ?? null,
          });
          setCurrentWorksheetId(ws.id);
          setCurrentWorksheetTitle(ws.title);
          setSearchParams({ worldId, worksheetId: ws.id });
          toast({ title: "CREATED.", description: "NEW SURFACE MAP ON FILE." });
        }
        setState(toSave);
        setSavedJson(JSON.stringify(toSave));
      } catch (err) {
        toast({ title: VOICE.saveFailed, description: mapError(err), variant: "destructive" });
      }
    } else {
      setSavedJson(JSON.stringify(state));
      toast({ title: "SAVED LOCALLY.", description: "MAP SETTINGS SECURED TO THIS BROWSER." });
    }
  };

  const gazetteerRows = () =>
    places.map((p) => {
      if (!p.at) return { place: p };
      const sky = placeSky(p.at, {
        tiltDeg: facts.tiltDeg?.value ?? null,
        dayLengthHours: facts.dayLengthHours?.value ?? null,
        tidallyLocked: locked,
        substellarLon: state.substellarLon,
        terminatorHalfWidthDeg: terminatorHalfWidthFromHabitable(facts.habitablePercent?.value),
      });
      return { place: p, band: sky.band };
    });
  const gazetteerExtras = () => ({
    radiusKm: facts.radiusEarth ? facts.radiusEarth.value * 6371 : null,
    locked,
    substellarLon: state.substellarLon,
  });
  const gazetteerMarkdown = () => buildGazetteerMarkdown(facts.name, gazetteerRows(), gazetteerExtras());

  // Export: the format dialog (Markdown, PDF map sheet, JSON). The PDF's map
  // image is composed once, when the dialog opens, with numbered pins that
  // match the printed gazetteer.
  const [exportOpen, setExportOpen] = useState(false);
  const [exportReport, setExportReport] = useState<GazetteerReport | null>(null);
  const [exportMap, setExportMap] = useState<string | null>(null);
  const handleExport = async () => {
    const report = buildGazetteerReport(facts.name, gazetteerRows(), gazetteerExtras());
    setExportReport(report);
    setExportMap(null);
    if (imageUrl) {
      try {
        setExportMap(await composeMapSheet(imageUrl, mapProjection, report.groups.flatMap((g) => g.entries)));
      } catch {
        // The gazetteer still prints; the template says the map is unavailable.
      }
    }
    setExportOpen(true);
  };

  const copyGazetteer = async () => {
    try {
      await navigator.clipboard.writeText(gazetteerMarkdown());
      toast({ title: VOICE.copyToClipboard, description: "GAZETTEER COPIED AS MARKDOWN." });
    } catch {
      toast({ title: VOICE.exportFailed, variant: "destructive" });
    }
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const ws = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: INITIAL_STATE as unknown as Json,
    });
    setCurrentWorksheetId(ws.id);
    setCurrentWorksheetTitle(ws.title);
    setSearchParams({ worldId: worldId!, worksheetId: ws.id });
    return ws.id;
  };

  // ── Derived for render ──────────────────────────────────────────────
  const imageUrl = showingSheet ? sheet!.url : generatedUrl;
  const mapProjection: MapProjection = showingSheet ? sheet!.projection : "equirectangular";
  const mapAspect = showingSheet && sheetImg ? sheetImg.naturalWidth / sheetImg.naturalHeight : 2;
  const selectedPlaced = selected && selected.at ? (selected as SurfacePlace & { at: LatLon }) : null;
  const measureTarget = places.find((p) => p.id === state.measureTo && p.at) ?? null;
  const measure: [LatLon, LatLon] | null =
    selectedPlaced && measureTarget?.at ? [selectedPlaced.at, measureTarget.at] : null;
  const generatedBiome =
    !showingSheet && generated && selectedPlaced
      ? BIOME_LABELS[biomeAt(generated.model, selectedPlaced.at.lat, selectedPlaced.at.lon)]
      : null;
  const unplacedCount = places.filter((p) => !p.at).length;
  const bodyValue = bodyEntity ? `entity:${bodyEntity.id}` : state.bodyWorksheetId ? `worksheet:${state.bodyWorksheetId}` : "";
  const canPlace = !!bodyEntity && !!user;

  const missingDefaults = !showingSheet
    ? [
        !facts.oceanFraction && "OCEAN COVER",
        !facts.meanTempC && "MEAN TEMPERATURE",
        !facts.tiltDeg && "AXIAL TILT",
      ].filter(Boolean)
    : [];

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      isSaving={updateWorksheet.isPending || createWorksheet.isPending}
      hasUnsavedChanges={dirty}
      onOpen={worldId ? () => setSelectorOpen(true) : undefined}
      onPrint={() => window.print()}
      onExport={handleExport}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesOpen(true)}
      worksheetId={currentWorksheetId || worksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={async (title) => {
        const id = currentWorksheetId || worksheetId;
        if (!id) return;
        await renameWorksheet.mutateAsync({ worksheetId: id, title });
        setCurrentWorksheetTitle(title);
      }}
      worksheetLoading={worksheetLoading}
      isLoggedIn={!!user}
      // The world bar sits in the Body section, where the body picker goes.
      worldBar={false}
    >
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 no-print xl:hidden">
        <MobileSectionNav sections={SECTIONS} />
      </div>

      <div className="space-y-6">
        {/* ── 1 · Body ─────────────────────────────────────────────── */}
        <CollapsibleSection id="body" title="Body" levelNumber={1} defaultOpen>
          {!worldId ? (
            <ToolWorldBar
              accent="azure"
              className="mb-0"
              reason="MAPS ARE DRAWN ON THE PLANETS AND MOONS OF A WORLD. CHOOSE ONE. THE GENERATED MAP BELOW WORKS WITHOUT ONE."
            />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sc-body">Planet or moon</Label>
                  <Select value={bodyValue} onValueChange={chooseBody}>
                    <SelectTrigger id="sc-body" className="min-h-hit">
                      <SelectValue placeholder={bodyOptions.length ? "Choose a body" : "No planets on file"} />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bodyOptions.length === 0 && (
                    <p className="font-mono text-[12px] text-t3">
                      // NO PLANET ON FILE.{" "}
                      <Link
                        to={`/tools/planetary-profile?worldId=${worldId}`}
                        className="text-sf-primary-text underline underline-offset-2"
                      >
                        DEFINE ONE IN GENESIS.
                      </Link>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sc-tidelock">Tidelock run</Label>
                  <Select
                    value={state.tidelockSaveId ?? "none"}
                    onValueChange={(v) => setState((s) => ({ ...s, tidelockSaveId: v === "none" ? null : v }))}
                  >
                    <SelectTrigger id="sc-tidelock" className="min-h-hit">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tidelockSaves.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name || "Untitled run"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[13px] text-t3">Reads tidal state and the width of the habitable band.</p>
                </div>
              </div>

              {(bodyEntity || profile) && (
                <BodyFactsPanel facts={facts} setHref={setHref} setLabel={setLabel} />
              )}

              {!bodyEntity && profile && (
                <div className="flex flex-wrap items-center gap-3 border border-sf-azure bg-sf-azure/[0.06] p-3">
                  <p className="flex-1 font-mono text-[12px] text-sf-azure-text">
                    // GENESIS PROFILE ONLY. PLACES ARE FILED UNDER A PLANET ENTITY.
                  </p>
                  <Button variant="sf-ghost" size="sf-sm" onClick={fileBodyAsEntity} disabled={busy === "body"}>
                    {busy === "body" ? "FILING…" : "FILE AS PLANET"}
                  </Button>
                </div>
              )}

              {locked && (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="sc-substellar">Substellar longitude</Label>
                    <span className="font-mono text-[14px] text-t1">
                      {formatLatLon({ lat: 0, lon: state.substellarLon })}
                    </span>
                  </div>
                  <Slider
                    id="sc-substellar"
                    aria-label="Substellar longitude"
                    min={-180}
                    max={180}
                    step={1}
                    value={[state.substellarLon]}
                    onValueChange={([v]) => setState((s) => ({ ...s, substellarLon: v }))}
                  />
                  <p className="sf-measure text-[13px] text-t3">
                    Where on your map the star stands overhead, forever. The lock is canon; this only places the
                    eye of the world on the drawing.
                  </p>
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* ── 2 · Map ──────────────────────────────────────────────── */}
        <CollapsibleSection id="map" title="Map" levelNumber={2} defaultOpen>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Map source" className="flex">
                {(["sheet", "generated"] as const).map((src) => {
                  const active = (src === "sheet") === showingSheet;
                  const disabled = src === "sheet" && !sheet;
                  return (
                    <button
                      key={src}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => setState((s) => ({ ...s, mapSource: src }))}
                      className={`flex min-h-hit items-center gap-2 border px-4 font-sans text-[13px] font-medium uppercase transition-colors duration-fast ease-sf-out ${
                        disabled
                          ? "cursor-not-allowed border-sf-disabled-line bg-sf-disabled-bg text-sf-disabled-text"
                          : active
                            ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                            : "border-sf-line text-t2 hover:border-sf-line-emphasis"
                      }`}
                    >
                      {src === "sheet" ? <MapIcon className="h-4 w-4" aria-hidden /> : <Shuffle className="h-4 w-4" aria-hidden />}
                      {src === "sheet" ? "Your sheet" : "Generated"}
                    </button>
                  );
                })}
              </div>
              <div role="group" aria-label="View" className="ml-auto flex">
                {(["flat", "globe"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={state.view === v}
                    onClick={() => setState((s) => ({ ...s, view: v }))}
                    className={`flex min-h-hit items-center gap-2 border px-4 font-sans text-[13px] font-medium uppercase transition-colors duration-fast ease-sf-out ${
                      state.view === v
                        ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                        : "border-sf-line text-t2 hover:border-sf-line-emphasis"
                    }`}
                  >
                    {v === "flat" ? <MapIcon className="h-4 w-4" aria-hidden /> : <Globe2 className="h-4 w-4" aria-hidden />}
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Sheet controls */}
            {bodyEntity && (
              <div className="grid gap-3 border border-sf-line p-3 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="sc-projection">Sheet projection</Label>
                  <Select
                    value={sheet ? sheet.projection : pendingProjection}
                    onValueChange={(v) => {
                      const p = v as MapProjection;
                      setPendingProjection(p);
                      if (sheet) setSheetProjection(p);
                    }}
                  >
                    <SelectTrigger id="sc-projection" className="min-h-hit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAP_PROJECTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {MAP_PROJECTION_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label
                  className={`flex min-h-hit cursor-pointer items-center justify-center gap-2 border px-4 font-sans text-[13px] font-medium uppercase transition-colors duration-fast ${
                    busy === "upload"
                      ? "border-sf-disabled-line bg-sf-disabled-bg text-sf-disabled-text"
                      : "border-sf-line text-t1 hover:border-sf-primary hover:text-sf-primary-text"
                  }`}
                >
                  {sheet ? <Upload className="h-4 w-4" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
                  {busy === "upload" ? "Uploading…" : sheet ? "Replace sheet" : "Attach a sheet"}
                  <input type="file" accept="image/*" className="sr-only" onChange={uploadSheet} disabled={busy === "upload"} />
                </label>
                <p className="text-[13px] text-t3 md:col-span-2">
                  Equirectangular sheets are 2:1; Mercator sheets reach as far toward the poles as their shape allows.
                  The sheet is a picture: tilt, spin, lock and atmosphere still come from canon. It is also the map the
                  Codex Atlas shows at this body's zoom.
                </p>
              </div>
            )}

            {showingSheet && sheetCheck && !sheetCheck.ok && (
              <p className="border border-sf-amber bg-sf-amber/[0.06] p-3 font-mono text-[12px] text-sf-amber-text">
                // {sheetCheck.warning}
              </p>
            )}
            {showingSheet && sheetCheck?.latLimit && (
              <p className="font-mono text-[12px] text-t3">
                MERCATOR SHEET REACHES ±{sheetCheck.latLimit.toFixed(1)}°. PLACES BEYOND IT KEEP THEIR COORDINATES.
              </p>
            )}
            {showingSheet && sheetFailed && (
              <p className="font-mono text-[12px] text-sf-crimson-text">// SHEET COULD NOT BE LOADED. RE-ATTACH IT.</p>
            )}

            {/* Generator controls */}
            {!showingSheet && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sc-seed">Seed</Label>
                  <Input
                    id="sc-seed"
                    value={state.generatorSeed}
                    onChange={(e) => setState((s) => ({ ...s, generatorSeed: e.target.value }))}
                    className="w-48 font-mono"
                  />
                </div>
                <Button
                  variant="sf-ghost"
                  size="sf-sm"
                  onClick={() =>
                    setState((s) => ({ ...s, generatorSeed: Math.random().toString(36).slice(2, 8) }))
                  }
                >
                  <Shuffle className="h-4 w-4" aria-hidden /> Reroll
                </Button>
                {bodyEntity && user && (
                  <Button
                    variant="sf-ghost"
                    size="sf-sm"
                    onClick={attachGenerated}
                    disabled={!generated || busy === "attach"}
                    className="disabled:border-sf-disabled-line disabled:bg-sf-disabled-bg disabled:text-sf-disabled-text"
                  >
                    {busy === "attach" ? "Filing…" : "Keep as sheet"}
                  </Button>
                )}
                {missingDefaults.length > 0 && (
                  <p className="w-full font-mono text-[12px] text-t3">
                    // {missingDefaults.join(", ")} NOT ON FILE. DRAWN WITH EARTH-LIKE DEFAULTS. NOTHING IS FILED FROM THIS PICTURE.
                  </p>
                )}
              </div>
            )}

            {/* The map */}
            {state.view === "flat" ? (
              imageUrl || !generating ? (
                <FlatMap
                  imageUrl={imageUrl}
                  projection={mapProjection}
                  aspect={mapAspect}
                  places={places}
                  selectedId={selectedId}
                  onSelect={selectPlace}
                  onPick={onPick}
                  draft={draftCoords(draft)}
                  locked={locked}
                  substellarLon={state.substellarLon}
                  measure={measure}
                  label={`Surface map of ${facts.name}`}
                />
              ) : (
                <div className="flex aspect-[2/1] items-center justify-center border border-sf-line bg-sf-surface">
                  <Loader message="SURVEYING SURFACE" />
                </div>
              )
            ) : (
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-sf-line bg-sf-void sm:aspect-[16/9]">
                {globeFailed ? null : globeCanvas ? (
                  <GlobeBoundary onFail={() => setGlobeFailed(true)}>
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <Loader message="SPINNING UP GLOBE" />
                        </div>
                      }
                    >
                      <GlobeScene
                        binding={globeBinding}
                        sheet={globeCanvas}
                        sheetVersion={genKey.length + (sheetImg ? sheetImg.naturalWidth : 0)}
                        pins={places.flatMap((p) => (p.at ? [{ id: p.id, lat: p.at.lat, lon: p.at.lon }] : []))}
                        selectedId={selectedId}
                        onSelectPin={selectPlace}
                        reducedMotion={reducedMotion}
                        className="h-full w-full"
                      />
                    </Suspense>
                  </GlobeBoundary>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader message="PREPARING TEXTURE" />
                  </div>
                )}
                {globeFailed && (
                  <div className="flex h-full items-center justify-center p-6">
                    <p className="font-mono text-[13px] text-sf-crimson-text">
                      // GLOBE UNAVAILABLE ON THIS DEVICE. THE FLAT MAP CARRIES EVERY PLACE.
                    </p>
                  </div>
                )}
                <div className="pointer-events-none absolute left-2 top-2 border border-sf-line bg-sf-surface px-2 py-1 font-mono text-[12px] text-t2">
                  TILT {facts.tiltDeg ? `${facts.tiltDeg.value.toFixed(1)}°` : "—"} ·{" "}
                  {locked ? `LOCKED · EYE ${formatLatLon({ lat: 0, lon: state.substellarLon })}` : "TURNING"}
                  {globeBinding.atmosphere.present ? ` · ${globeBinding.atmosphere.label.toUpperCase()}` : " · AIRLESS"}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── 3 · Places ───────────────────────────────────────────── */}
        <CollapsibleSection id="places" title="Places" levelNumber={3} defaultOpen>
          {!canPlace ? (
            <p className="sf-measure text-[15px] text-t2">
              {!user
                ? "Sign in to file places. Each one becomes an entry in your world's Codex."
                : "Choose a planet or moon above. Places are filed under it, so they appear in the Codex, on the Atlas, and as @-mentions in the Studio."}
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              {/* Gazetteer list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sf-eyebrow uppercase text-t4">
                    {places.length} on file{unplacedCount ? ` · ${unplacedCount} unplaced` : ""}
                  </span>
                  <Button
                    variant="sf-ghost"
                    size="sf-sm"
                    onClick={() => {
                      setSelectedId(null);
                      setDraft({ ...EMPTY_DRAFT });
                    }}
                  >
                    <Plus className="h-4 w-4" aria-hidden /> New place
                  </Button>
                </div>
                <ul className="sf-sb max-h-[420px] overflow-y-auto border border-sf-line">
                  {places.length === 0 && (
                    <li className="p-3 font-mono text-[12px] text-t3">// NO PLACES ON FILE. CLICK THE MAP TO BEGIN.</li>
                  )}
                  {places.map((p) => (
                    <li key={p.id} className="border-b border-sf-line-hairline last:border-b-0">
                      <button
                        type="button"
                        onClick={() => selectPlace(p.id)}
                        aria-pressed={p.id === selectedId}
                        className={`flex min-h-hit w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-fast ${
                          p.id === selectedId ? "bg-sf-primary/[0.06]" : "hover:bg-sf-surface-elevated"
                        }`}
                      >
                        <MapPin className={`h-4 w-4 shrink-0 ${p.at ? "text-sf-azure" : "text-t4"}`} aria-hidden />
                        <span className="flex-1 truncate text-[15px] text-t1">{p.name}</span>
                        <span className="font-mono text-[12px] text-t3">
                          {p.at ? formatLatLon(p.at) : "UNPLACED"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editor */}
              {draft ? (
                <div className="space-y-3 border border-sf-line p-4">
                  <span className="font-heading text-sf-eyebrow uppercase text-t4">
                    {draft.id ? "Revise place" : "New place"}
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="sc-name">Name</Label>
                      <Input
                        id="sc-name"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder="e.g., Vel Haran"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sc-type">Type</Label>
                      <Select
                        value={draft.placeType}
                        onValueChange={(v) => setDraft({ ...draft, placeType: v as PlaceType })}
                      >
                        <SelectTrigger id="sc-type" className="min-h-hit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLACE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {PLACE_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sc-lat">Latitude, °N</Label>
                      <Input
                        id="sc-lat"
                        type="number"
                        inputMode="decimal"
                        min={-90}
                        max={90}
                        step={0.1}
                        value={draft.lat}
                        onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sc-lon">Longitude, °E</Label>
                      <Input
                        id="sc-lon"
                        type="number"
                        inputMode="decimal"
                        min={-180}
                        max={180}
                        step={0.1}
                        value={draft.lon}
                        onChange={(e) => setDraft({ ...draft, lon: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-[13px] text-t3">
                    <Crosshair className="h-4 w-4" aria-hidden /> Click the map to set the coordinate.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="sc-desc">Description</Label>
                    <Textarea
                      id="sc-desc"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      rows={4}
                      placeholder="What is here, who lives here, what it smells like."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="sf-primary" size="sf-sm" onClick={fileDraft} disabled={busy === "place"}>
                      {busy === "place" ? "Filing…" : draft.id ? "Revise" : "File place"}
                    </Button>
                    {draft.id && (draft.lat || draft.lon) && (
                      <Button variant="sf-ghost" size="sf-sm" onClick={unplace} disabled={busy === "place"}>
                        Unplace
                      </Button>
                    )}
                    {draft.id && worldId && (
                      <Button variant="sf-ghost" size="sf-sm" asChild>
                        <Link to={`/worlds/${worldId}/codex/${draft.id}`}>Open in Codex</Link>
                      </Button>
                    )}
                    <Button
                      variant="sf-ghost"
                      size="sf-sm"
                      onClick={() => {
                        setDraft(null);
                        setSelectedId(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border border-dashed border-sf-line-hairline p-6">
                  <p className="font-mono text-[12px] text-t3">// SELECT A PLACE OR CLICK THE MAP.</p>
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* ── 4 · Readouts ─────────────────────────────────────────── */}
        <CollapsibleSection id="readouts" title="Readouts" levelNumber={4} defaultOpen>
          {selectedPlaced ? (
            <PlaceReadouts
              place={selectedPlaced}
              facts={facts}
              substellarLon={state.substellarLon}
              places={places}
              measureToId={state.measureTo}
              onMeasureTo={(id) => setState((s) => ({ ...s, measureTo: id }))}
              travelKmh={state.travelKmh}
              onTravelKmh={(kmh) => setState((s) => ({ ...s, travelKmh: kmh }))}
              generatedBiome={generatedBiome}
              setHref={setHref}
            />
          ) : (
            <p className="font-mono text-[12px] text-t3">// SELECT A PLACED LOCATION TO READ ITS SKY, CLIMATE AND DISTANCES.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-sf-line-hairline pt-4">
            <Button variant="sf-ghost" size="sf-sm" onClick={handleExport} disabled={places.length === 0}>
              Export gazetteer
            </Button>
            <Button variant="sf-ghost" size="sf-sm" onClick={copyGazetteer} disabled={places.length === 0}>
              Copy as markdown
            </Button>
          </div>
        </CollapsibleSection>
      </div>

      <ToolSidebar>
        <SectionNavigation sections={SECTIONS} mode="inline" />
        <GlassPanel className="w-56 p-4">
          <h4 className="mb-3 font-mono text-[12px] uppercase text-t4">// SURVEY</h4>
          <div className="space-y-1.5 font-mono text-[12px]">
            <div className="flex justify-between gap-2">
              <span className="text-t4">BODY</span>
              <span className="truncate text-t2">{facts.name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-t4">MAP</span>
              <span className="text-t2">{showingSheet ? "SHEET" : "GENERATED"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-t4">PLACES</span>
              <span className="text-t2">{places.length}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-t4">ROTATION</span>
              <span className="text-t2">{locked ? "LOCKED" : facts.tidallyLocked ? "FREE" : "UNKNOWN"}</span>
            </div>
          </div>
        </GlassPanel>
      </ToolSidebar>

      <WorksheetSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        worldId={worldId || ""}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Surface Cartographer"
        worksheets={myWorksheets}
        onSelect={(id) => {
          setSearchParams({ worldId: worldId!, worksheetId: id });
          setSelectorOpen(false);
        }}
        onCreate={handleWorksheetCreate}
        isLoading={myWorksheetsLoading}
      />

      <WorksheetNotesSheet
        open={notesOpen}
        onOpenChange={setNotesOpen}
        content={state.generalNotes}
        onChange={(html) => setState((s) => ({ ...s, generalNotes: html }))}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        toolName="Surface Cartographer"
        worldName={worldName}
        worksheetTitle={facts.name || undefined}
        formState={{ bodyName: facts.name, gazetteer: gazetteerSnapshot(places) }}
        summaryTemplate={
          exportReport ? (
            <SurfaceGazetteerTemplate report={exportReport} mapImage={exportMap} worldName={worldName} />
          ) : undefined
        }
        markdown={gazetteerMarkdown}
        defaultFilename={`${(facts.name || "surface").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gazetteer`}
      />
    </ToolPageLayout>
  );
};

export default SurfaceCartographer;
