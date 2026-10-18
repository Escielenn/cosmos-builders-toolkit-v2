/**
 * Ark: Generation Ship Designer.
 *
 * The four questions (docs/stellarforge/05-NEW-SYSTEMS.md, /sf-new-tool):
 *
 * 1. What does it produce that nothing else produces?
 *    vessel.closed_loop_efficiency (mass-weighted O2/water/food recovery),
 *    vessel.pop_genetics (founding N, effective Ne, inbreeding F at arrival,
 *    generations aboard), and drift events offered to the Chronicle as
 *    dated, cited history. Surfaced today through entity-config worksheetPaths
 *    (vessel fields) so the Studio Refs/Check tabs can read them.
 *
 * 2. What does it consume that already exists?
 *    Paradox (route distance, cruise fraction of c, acceleration, origin and
 *    destination), Impulse (drive speed and acceleration when written as c and
 *    g), Vessel (ship name, builder), Phylo (species, lifespan category, mating
 *    system), Gravitas (spin radius and rpm; Gravitas stays the sole producer
 *    of vessel.spin_gravity). Every imported value carries a provenance chip
 *    linking back to the worksheet that owns it. Voyage time is computed by
 *    Paradox's own engine and language drift by LexDrift's modifiers, so the
 *    tools cannot disagree.
 *
 * 3. What does it change about how a scene reads?
 *    Shipboard scenes get real numbers: which generation the POV belongs to,
 *    whether anyone alive remembers home, how related everyone is, what the
 *    air ration is, how heavy a step is on deck 3, how far a thrown ball
 *    curves. The drift events are the ship's history, ready to be set in.
 *
 * 4. What does it absorb or replace?
 *    The "Generation Ship Designer" roadmap card, and the generation-ship
 *    arithmetic writers currently do by hand across Vessel's free-text life
 *    support fields, Paradox and LexDrift. It adds no new always-on chrome;
 *    it renders inside ToolPageLayout like every other instrument.
 */
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ToolWorldBar } from "@/components/tools/ToolWorldBar";
import { Copy, Download, FileText, History, Ship } from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import SectionNavigation, { MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import KeyChoicesSidebar, { MobileKeyChoices, type KeyChoicesSection } from "@/components/tools/KeyChoicesSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberField, ProvenanceChip, Readout, WarningList } from "@/components/tools/generation-ship/ArkFields";
import {
  DeckPlan,
  GenerationsStrip,
  HabitatSchematic,
  InbreedingCurve,
  MvpScale,
} from "@/components/tools/generation-ship/ArkVisuals";
import { LAYER_LABEL, LAYER_TEXT } from "@/components/tools/generation-ship/layers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWorldId } from "@/hooks/use-world-id";
import { useWorlds } from "@/hooks/use-worlds";
import { useWorksheets, useWorksheet, useWorksheetsByType, useRenameWorksheet } from "@/hooks/use-worksheets";
import { useEntityMatch } from "@/hooks/use-entity-match";
import { useWorksheetShare } from "@/hooks/use-sharing";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { useTags } from "@/hooks/use-tags";
import { useChronicleData, useCreateChronicleEvent } from "@/hooks/use-chronicle";
import { estimateSortValue, type ChronicleEvent } from "@/services/chronicle-data";
import { writeStandaloneBackup } from "@/lib/standalone-backup";
import { mapError, VOICE } from "@/lib/ship-voice";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { GenerationShipSummaryTemplate, GenerationShipFullReportTemplate } from "@/lib/pdf/templates";
import {
  INITIAL_GENSHIP_STATE,
  buildDerivedSnapshot,
  computeGenShip,
  normalizeGenShipState,
  DAYS_PER_YEAR,
  type GenShipFormState,
} from "@/lib/generation-ship/calculations";
import { buildDriftEvents, chronicleYear, type DriftEvent } from "@/lib/generation-ship/drift-events";
import { IMPORT_READERS, IMPORT_SOURCES, applyPatch } from "@/lib/generation-ship/imports";
import { buildGenShipMarkdown, fmt, fmtYears } from "@/lib/generation-ship/markdown";
import {
  CONSUMABLES_SOURCE,
  CROP_AREA_NOTE,
  GENSHIP_SECTIONS,
  GLOTTO_NOTE,
  LOOP_BENCHMARKS,
  MVP_REFERENCES,
  PER_CAPITA_KG_PER_DAY,
  SECTION_IDS,
  SPIN_SOURCE,
  STANFORD_TORUS_SHIELD_T_PER_M2,
  VARIANCE_PRESETS,
} from "@/lib/generation-ship/data";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

const TOOL_TYPE = "generation-ship";
const LOCAL_STORAGE_KEY = "generation-ship";

interface SourceWorksheet {
  id: string;
  title: string | null;
  data: Json | null;
}

/** Everything that counts as an unsaved edit: the inputs, not the bookkeeping. */
function editableJson(f: GenShipFormState): string {
  return JSON.stringify({ ...f, loggedEvents: {}, derived: undefined });
}

/** Every chronicle event id in the world, including nested children. */
function collectEventIds(events: ChronicleEvent[], into = new Set<string>()): Set<string> {
  for (const e of events) {
    into.add(e.id);
    if (e.children?.length) collectEventIds(e.children, into);
  }
  return into;
}

// ─── Import menu ────────────────────────────────────────────────────────

function ImportMenu({
  tool,
  worksheets,
  onImport,
}: {
  tool: string;
  worksheets: SourceWorksheet[];
  onImport: (tool: string, ws: SourceWorksheet) => void;
}): JSX.Element | null {
  if (worksheets.length === 0) return null;
  const brand = IMPORT_SOURCES[tool]?.brand ?? tool;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="sf-ghost" size="sf-sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Import from {brand}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto sf-sb">
        <DropdownMenuLabel className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">
          {brand} worksheets on file
        </DropdownMenuLabel>
        {worksheets.map((ws) => (
          <DropdownMenuItem key={ws.id} onSelect={() => onImport(tool, ws)} className="min-h-hit">
            {ws.title || "Untitled worksheet"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

const GenerationShipDesigner = () => {
  const [form, setForm] = useState<GenShipFormState>(INITIAL_GENSHIP_STATE);
  const [savedJson, setSavedJson] = useState<string>(editableJson(INITIAL_GENSHIP_STATE));
  const savedDataRef = useRef<GenShipFormState | null>(null);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const worldId = useWorldId();
  const [searchParams, setSearchParams] = useSearchParams();
  const worksheetId = searchParams.get("worksheetId");
  const worldName = worldId ? worlds.find((w) => w.id === worldId)?.name : undefined;

  const entityMatch = useEntityMatch(worldId);
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: entityMatch.check,
  });
  const renameWorksheet = useRenameWorksheet();
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: ownWorksheets = [], isLoading: ownLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();

  // Upstream worksheets this tool can read.
  const { data: paradoxSheets = [] } = useWorksheetsByType(worldId || undefined, "time-dilation");
  const { data: impulseSheets = [] } = useWorksheetsByType(worldId || undefined, "propulsion-consequences-map");
  const { data: vesselSheets = [] } = useWorksheetsByType(worldId || undefined, "spacecraft-designer");
  const { data: phyloSheets = [] } = useWorksheetsByType(worldId || undefined, "evolutionary-biology");
  const { data: gravitasSheets = [] } = useWorksheetsByType(worldId || undefined, "gravitas");

  const { data: chronicle } = useChronicleData(worldId || undefined);
  const createEvent = useCreateChronicleEvent(worldId || "");

  // ── Calculation ──────────────────────────────────────────────────────
  const results = useMemo(() => computeGenShip(form), [form]);
  const events = useMemo(() => buildDriftEvents(form, results), [form, results]);
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  const dirty = editableJson(form) !== savedJson;
  useUnsavedChangesGuard(dirty);

  const chronicleIds = useMemo(
    () => (chronicle ? collectEventIds(chronicle.events.concat(chronicle.eras ?? [])) : null),
    [chronicle],
  );
  /** Logged and still present in the Chronicle (if the writer deleted it there, it can be logged again). */
  const isOnFile = useCallback(
    (id: string) => {
      const cid = form.loggedEvents[id];
      if (!cid) return false;
      return chronicleIds ? chronicleIds.has(cid) : true;
    },
    [form.loggedEvents, chronicleIds],
  );

  // ── Load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (worldId && !worksheetId && !ownLoading && user) setWorksheetSelectorOpen(true);
  }, [worldId, worksheetId, ownLoading, user]);

  useEffect(() => {
    if (!existingWorksheet) return;
    const next = normalizeGenShipState(existingWorksheet.data);
    setForm(next);
    savedDataRef.current = next;
    setSavedJson(editableJson(next));
    setCurrentWorksheetId(existingWorksheet.id);
    setCurrentWorksheetTitle(existingWorksheet.title);
    setWorksheetTags(existingWorksheet.tags ?? []);
  }, [existingWorksheet]);

  useEffect(() => {
    if (worldId || worksheetId) return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const next = normalizeGenShipState(JSON.parse(raw));
        setForm(next);
        setSavedJson(editableJson(next));
      }
    } catch {
      // Storage blocked or corrupt: start from defaults.
    }
  }, [worldId, worksheetId]);

  // ── Field updates ────────────────────────────────────────────────────
  /** Set one value by path. A hand edit drops that field's provenance: it is the writer's now. */
  const setField = useCallback((path: string, value: string | number | boolean) => {
    setForm((prev) => {
      const next = applyPatch(prev, { [path]: value as string | number });
      if (path in next.provenance) {
        const provenance = { ...next.provenance };
        delete provenance[path];
        next.provenance = provenance;
      }
      return next;
    });
  }, []);

  const handleImport = useCallback(
    (tool: string, ws: SourceWorksheet) => {
      const reader = IMPORT_READERS[tool];
      const patch = reader ? reader(ws.data) : {};
      const keys = Object.keys(patch);
      const brand = IMPORT_SOURCES[tool]?.brand ?? tool;
      if (keys.length === 0) {
        toast({ title: "NOTHING TO IMPORT.", description: `NO READABLE VALUES ON FILE IN ${brand.toUpperCase()}.` });
        return;
      }
      setForm((prev) => {
        const next = applyPatch(prev, patch);
        const provenance = { ...next.provenance };
        for (const k of keys) provenance[k] = { tool, worksheetId: ws.id, worksheetTitle: ws.title ?? "" };
        return normalizeGenShipState({ ...next, provenance });
      });
      toast({ title: `${keys.length} VALUE${keys.length === 1 ? "" : "S"} IMPORTED FROM ${brand.toUpperCase()}.` });
    },
    [toast],
  );

  // ── Save ─────────────────────────────────────────────────────────────
  const buildRow = useCallback(
    (f: GenShipFormState) => ({ ...f, derived: buildDerivedSnapshot(computeGenShip(f)) }) as unknown as Json,
    [],
  );

  const handleSave = useCallback(async () => {
    try {
      writeStandaloneBackup(LOCAL_STORAGE_KEY, form, { worldId, signedIn: !!user });
    } catch {
      // Storage unavailable; the cloud path below still runs.
    }
    const wsId = currentWorksheetId || worksheetId;
    if (worldId && user) {
      try {
        if (wsId) {
          await updateWorksheet.mutateAsync({ worksheetId: wsId, data: buildRow(form) });
        } else {
          const created = await createWorksheet.mutateAsync({
            worldId,
            toolType: TOOL_TYPE,
            title: form.identity.shipName.trim() || "Generation Ship",
            data: buildRow(form),
          });
          setCurrentWorksheetId(created.id);
          setCurrentWorksheetTitle(created.title);
          setSearchParams({ worldId, worksheetId: created.id });
        }
        savedDataRef.current = form;
        setSavedJson(editableJson(form));
      } catch {
        // The mutation reports its own failure in Ship's Voice.
      }
    } else {
      setSavedJson(editableJson(form));
      toast({ title: "DRAFT SAVED.", description: "WORK SECURED TO LOCAL STORAGE." });
    }
  }, [form, currentWorksheetId, worksheetId, worldId, user, updateWorksheet, createWorksheet, buildRow, setSearchParams, toast]);

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const result = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: buildRow(INITIAL_GENSHIP_STATE),
    });
    setCurrentWorksheetId(result.id);
    setCurrentWorksheetTitle(result.title);
    setSearchParams({ worldId: worldId!, worksheetId: result.id });
    return result.id;
  };

  // ── Chronicle ────────────────────────────────────────────────────────
  const handleLogEvent = useCallback(
    async (e: DriftEvent) => {
      if (!worldId || !user) {
        toast({ title: "WORLD REQUIRED.", description: "OPEN THIS SHIP INSIDE A WORLD TO WRITE ITS HISTORY TO THE CHRONICLE." });
        return;
      }
      if (isOnFile(e.id)) return;
      setLoggingId(e.id);
      const year = chronicleYear(form.identity.launchYear, e);
      const ship = form.identity.shipName.trim();
      try {
        const res = await createEvent.mutateAsync({
          title: e.title,
          description: `${e.description}\n\nGeneration ${e.generation} aboard${ship ? ` the ${ship}` : ""}, year ${Math.round(e.shipYear)} of the voyage.`,
          eventDate: String(year),
          sortValue: estimateSortValue(String(year)),
          eventType: e.eventType,
          layer: e.layer,
          tags: ["generation ship", ...(ship ? [ship] : [])],
        });
        if (res.error || !res.data) throw res.error ?? new Error("insert failed");
        const chronicleId = (res.data as { id: string }).id;
        const loggedEvents = { ...form.loggedEvents, [e.id]: chronicleId };
        setForm((prev) => ({ ...prev, loggedEvents: { ...prev.loggedEvents, [e.id]: chronicleId } }));
        // Record the link on the saved row without saving the writer's other unsaved edits.
        const wsId = currentWorksheetId || worksheetId;
        if (wsId && savedDataRef.current) {
          const base = { ...savedDataRef.current, loggedEvents };
          savedDataRef.current = base;
          updateWorksheet.mutate({ worksheetId: wsId, data: buildRow(base) });
        }
        toast({ title: "EVENT LOGGED TO CHRONICLE.", description: `${year}: ${e.title.toUpperCase()}.` });
      } catch (err) {
        toast({ title: "LOG FAILED.", description: mapError(err), variant: "destructive" });
      } finally {
        setLoggingId(null);
      }
    },
    [worldId, user, isOnFile, form, createEvent, currentWorksheetId, worksheetId, updateWorksheet, buildRow, toast],
  );

  // ── Export ───────────────────────────────────────────────────────────
  const markdown = useMemo(() => buildGenShipMarkdown(form, results, events, worldName), [form, results, events, worldName]);
  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast({ title: VOICE.copyToClipboard, description: "MARKDOWN READY TO PASTE." });
    } catch (err) {
      toast({ title: VOICE.genericError, description: mapError(err), variant: "destructive" });
    }
  }, [markdown, toast]);

  const exportState = useMemo(() => ({ ...form, derived: buildDerivedSnapshot(results) }), [form, results]);
  const fileBase = `ark-${(form.identity.shipName || "generation-ship").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  // ── Sidebar ──────────────────────────────────────────────────────────
  const { voyage: v, genetics: g, lifeSupport: ls, habitat: h, drift: d } = results;
  const keyChoices: KeyChoicesSection[] = useMemo(
    () => [
      {
        id: "voyage",
        title: "Voyage",
        choices: [
          { label: "Ship", value: form.identity.shipName || undefined },
          { label: "Aboard", value: v.valid ? fmtYears(v.shipYears) : undefined },
          { label: "Generations", value: v.valid ? fmt(g.generations, 1) : undefined },
        ],
      },
      {
        id: "genetics",
        title: "Genetics",
        choices: [
          { label: "Crew", value: fmt(form.population.founding, 0) },
          { label: "Ne", value: fmt(g.eff.ne, 0) },
          { label: "F at arrival", value: g.fAtArrival.toFixed(3) },
        ],
      },
      {
        id: "loop",
        title: "Closed loop",
        choices: [{ label: "Efficiency", value: `${fmt(ls.closedLoopEfficiency * 100, 2)}%` }],
      },
      {
        id: "habitat",
        title: "Habitat",
        choices: [
          { label: "Rim gravity", value: `${h.rimG.toFixed(2)} g` },
          { label: "Spin", value: `${fmt(form.habitat.rpm, 2)} rpm` },
        ],
      },
    ],
    [form, v, g, ls, h],
  );

  const warningsFor = (section: string) => results.warnings.filter((w) => w.section === section);
  const pv = (path: string) => form.provenance[path];
  const cloud = !!(worldId && user);
  const loggedCount = events.filter((e) => isOnFile(e.id)).length;

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={() => window.print()}
      onExport={() => setExportDialogOpen(true)}
      onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      hasUnsavedChanges={dirty}
      isSaving={updateWorksheet.isPending || createWorksheet.isPending}
      isCloudEnabled={cloud}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={form.moodboard.length}
      extraActions={
        <QuickExportButton
          toolName="Ark"
          worldName={worldName}
          formState={exportState}
          summaryTemplate={<GenerationShipSummaryTemplate formState={exportState as unknown as Record<string, unknown>} worldName={worldName} />}
          fullTemplate={<GenerationShipFullReportTemplate formState={exportState as unknown as Record<string, unknown>} worldName={worldName} />}
          defaultFilename={fileBase}
        />
      }
      worksheetId={currentWorksheetId || worksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={async (title) => {
        const wsId = currentWorksheetId || worksheetId;
        if (!wsId) return;
        await renameWorksheet.mutateAsync({ worksheetId: wsId, title });
        setCurrentWorksheetTitle(title);
      }}
      worksheetLoading={worksheetLoading}
      worksheetTags={worksheetTags}
      onTagsChange={(tags) => {
        setWorksheetTags(tags);
        const wsId = currentWorksheetId || worksheetId;
        if (wsId) updateWorksheetTags.mutate({ worksheetId: wsId, tags });
      }}
      worksheetIcon={<Ship className="h-4 w-4 text-sf-primary-text" aria-hidden="true" />}
      isLoggedIn={!!user}
    >
      {!worldId && (
        <ToolWorldBar accent="teal" reason="IMPORTS AND CHRONICLE LOGGING NEED A WORLD. CHOOSE ONE." />
      )}
      <div className="space-y-6">
        {/* ── 1. Voyage ──────────────────────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.voyage}
          title="Voyage"
          subtitle="How far, how fast, and how long the ship is a world"
          levelNumber={1}
          defaultOpen
          thinkLike="a mission planner: every year of travel is a year of air, food and children."
        >
          <div className="space-y-6">
            {worldId && (paradoxSheets.length + impulseSheets.length + vesselSheets.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">On file in this world</span>
                <ImportMenu tool="time-dilation" worksheets={paradoxSheets} onImport={handleImport} />
                <ImportMenu tool="propulsion-consequences-map" worksheets={impulseSheets} onImport={handleImport} />
                <ImportMenu tool="spacecraft-designer" worksheets={vesselSheets} onImport={handleImport} />
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <Label htmlFor="ark-ship-name">Ship name</Label>
                  {pv("identity.shipName") && <ProvenanceChip provenance={pv("identity.shipName")!} worldId={worldId} />}
                </div>
                <Input
                  id="ark-ship-name"
                  value={form.identity.shipName}
                  placeholder="e.g. Long Patience"
                  onChange={(e) => setField("identity.shipName", e.target.value)}
                />
              </div>
              <NumberField
                label="Launch year"
                value={form.identity.launchYear}
                onChange={(n) => setField("identity.launchYear", Math.round(n))}
                unit="year"
                help="In your world's calendar. Drift events are dated from it."
                worldId={worldId}
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <Label htmlFor="ark-origin">Origin</Label>
                  {pv("identity.originName") && <ProvenanceChip provenance={pv("identity.originName")!} worldId={worldId} />}
                </div>
                <Input id="ark-origin" value={form.identity.originName} onChange={(e) => setField("identity.originName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <Label htmlFor="ark-dest">Destination</Label>
                  {pv("identity.destinationName") && <ProvenanceChip provenance={pv("identity.destinationName")!} worldId={worldId} />}
                </div>
                <Input id="ark-dest" value={form.identity.destinationName} placeholder="e.g. Proxima Centauri b" onChange={(e) => setField("identity.destinationName", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField
                label="Distance"
                value={form.voyage.distanceLy}
                onChange={(n) => setField("voyage.distanceLy", n)}
                unit="ly"
                min={0}
                provenance={pv("voyage.distanceLy")}
                worldId={worldId}
                help="Alpha Centauri 4.24 · Tau Ceti 11.9 · TRAPPIST-1 40.7"
              />
              <NumberField
                label="Cruise speed"
                value={form.voyage.cruiseFractionC}
                onChange={(n) => setField("voyage.cruiseFractionC", n)}
                unit="c"
                min={0}
                max={0.999}
                provenance={pv("voyage.cruiseFractionC")}
                worldId={worldId}
                help="Fraction of light speed. Fusion arks of the Daedalus/Icarus school: 0.01–0.1 c."
              />
              <NumberField
                label="Boost acceleration"
                value={form.voyage.accelG}
                onChange={(n) => setField("voyage.accelG", n)}
                unit="g"
                min={0}
                provenance={pv("voyage.accelG")}
                worldId={worldId}
                help="0 = start already at cruise. Otherwise the ship boosts, coasts, and brakes."
              />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Readout label="Aboard" value={v.valid ? fmt(v.shipYears, v.shipYears < 10 ? 2 : 0) : "-"} unit="ship-years" />
              <Readout label="At home" value={v.valid ? fmt(v.earthYears, v.earthYears < 10 ? 2 : 0) : "-"} unit="years" note={v.valid && v.lorentzFactor > 1.001 ? `γ ${v.lorentzFactor.toFixed(3)}: the crew ages slower than home.` : "Relativity barely touches a ship this slow."} />
              <Readout label="Generations" value={v.valid ? fmt(g.generations, 1) : "-"} note={`at ${fmt(form.population.generationYears, 1)} years each`} />
              <Readout label="Boost / brake" value={form.voyage.accelG > 0 && v.valid ? fmt(v.boostYearsEach, 1) : "0"} unit="years each" note={form.voyage.accelG > 0 ? (v.reachesCruise ? "Then silence: coasting is weightless unless the ship spins." : "Never reaches cruise: turnover at the midpoint.") : undefined} />
            </div>
            <WarningList warnings={warningsFor("voyage")} />
          </div>
        </CollapsibleSection>

        {/* ── 2. Population genetics ─────────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.genetics}
          title="Population Genetics"
          subtitle="Who boards, who has children, and how related everyone becomes"
          levelNumber={2}
          defaultOpen
          thinkLike="a conservation geneticist: the crew is a small, isolated population, and drift never sleeps."
        >
          <div className="space-y-6">
            {worldId && phyloSheets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">Crew species</span>
                <ImportMenu tool="evolutionary-biology" worksheets={phyloSheets} onImport={handleImport} />
                {form.identity.speciesName && (
                  <span className="text-[13px] text-t2">
                    {form.identity.speciesName}
                    {pv("identity.speciesName") && <> <ProvenanceChip provenance={pv("identity.speciesName")!} worldId={worldId} /></>}
                  </span>
                )}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField label="Founding population" value={form.population.founding} onChange={(n) => setField("population.founding", Math.max(0, Math.round(n)))} unit="people" min={0} worldId={worldId} help="Held steady through the voyage: births replace deaths." />
              <NumberField label="Breeding share" value={form.population.breedingPct} onChange={(n) => setField("population.breedingPct", n)} unit="%" min={1} max={100} worldId={worldId} help="Of the census, the share who are parents in any one generation." />
              <NumberField label="Female share of breeders" value={form.population.femalePct} onChange={(n) => setField("population.femalePct", n)} unit="%" min={1} max={99} provenance={pv("population.femalePct")} worldId={worldId} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="ark-vk-preset">Family-size pattern</Label>
                <Select
                  value={VARIANCE_PRESETS.find((p) => p.vk === form.population.familySizeVariance)?.id ?? "custom"}
                  onValueChange={(id) => {
                    const p = VARIANCE_PRESETS.find((x) => x.id === id);
                    if (p) setField("population.familySizeVariance", p.vk);
                  }}
                >
                  <SelectTrigger id="ark-vk-preset" className="min-h-hit">
                    <SelectValue placeholder="Custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANCE_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                    <SelectItem value="custom" disabled>Custom</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[13px] leading-snug text-t3">
                  {VARIANCE_PRESETS.find((p) => p.vk === form.population.familySizeVariance)?.note ?? "Set by hand or imported."}
                </p>
              </div>
              <NumberField label="Family-size variance (Vk)" value={form.population.familySizeVariance} onChange={(n) => setField("population.familySizeVariance", Math.max(0, n))} min={0} provenance={pv("population.familySizeVariance")} worldId={worldId} help="Variance in children per parent. Ne/N ≈ 4/(Vk + 2)." />
              <NumberField label="Generation length" value={form.population.generationYears} onChange={(n) => setField("population.generationYears", n)} unit="years" min={0.1} provenance={pv("population.generationYears")} worldId={worldId} help="Mean parental age at birth. Humans: 25–30." />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField label="Lifespan" value={form.population.lifespanYears} onChange={(n) => setField("population.lifespanYears", n)} unit="years" min={0.2} provenance={pv("population.lifespanYears")} worldId={worldId} />
              <NumberField label="Mean age at launch" value={form.population.meanAgeAtLaunch} onChange={(n) => setField("population.meanAgeAtLaunch", n)} unit="years" min={0} worldId={worldId} help="Dates the death of the last crew member born at home." />
              <div className="space-y-3 border border-sf-line p-3">
                <div className="flex min-h-hit items-center justify-between gap-3">
                  <Label htmlFor="ark-bank">Frozen embryo / gamete bank</Label>
                  <Switch id="ark-bank" checked={form.population.bank.enabled} onCheckedChange={(c) => setField("population.bank.enabled", c)} />
                </div>
                {form.population.bank.enabled && (
                  <div className="grid gap-3">
                    <NumberField label="Births from the bank" value={form.population.bank.contributionPct} onChange={(n) => setField("population.bank.contributionPct", n)} unit="%" min={0} max={100} worldId={worldId} />
                    <NumberField label="Samples aboard" value={form.population.bank.samples} onChange={(n) => setField("population.bank.samples", Math.max(0, Math.round(n)))} unit="units" min={0} worldId={worldId} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Readout label="Effective pop." value={fmt(g.eff.ne, 0)} unit="Nₑ" note={`${fmt(g.eff.neOverN * 100, 0)}% of the crew counts, genetically.`} tone={g.eff.ne < 50 ? "danger" : g.eff.ne < 500 ? "caution" : "default"} />
              <Readout label="F at arrival" value={g.fAtArrival.toFixed(4)} tone={g.fAtArrival > 0.1 ? "danger" : g.fAtArrival > 0.0625 ? "caution" : "ok"} note={g.fAtArrival > 0.0625 ? "Every marriage is a cousin marriage." : "Relatedness stays below first cousins."} />
              <Readout label="Diversity kept" value={fmt(g.heterozygosityRetained * 100, 1)} unit="%" note="Heterozygosity relative to launch." />
              <Readout label="Nₑ to stay clear" value={Number.isFinite(g.neNeededFirstCousin) ? fmt(g.neNeededFirstCousin, 0) : "-"} note="Needed to arrive below first-cousin F 0.0625." />
            </div>
            {g.bank.enabled && (
              <p className="sf-measure text-[13px] text-t3">
                The bank supplies {fmt(g.bank.usedPerGeneration, 1)} births a generation from unrelated donors and lasts {Number.isFinite(g.bank.lastsGenerations) ? `${fmt(g.bank.lastsGenerations, 1)} generations` : "the whole voyage"}. Modelled as immigration in Wright's island model: each generation, F′ = [1/2Nₑ + (1 − 1/2Nₑ)F](1 − m)².
              </p>
            )}
            <InbreedingCurve fSeries={g.fSeries} generations={g.generations} />
            <WarningList warnings={warningsFor("genetics")} />

            <div className="space-y-3">
              <h3 className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">// How many is enough? Published answers</h3>
              <MvpScale founding={form.population.founding} ne={g.eff.ne} />
              <ul className="grid gap-2 md:grid-cols-2">
                {MVP_REFERENCES.map((m) => (
                  <li key={m.id} className="border border-sf-line bg-sf-surface p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-heading text-[13px] uppercase tracking-[0.12em] text-t1">{m.label}</span>
                      <span className="font-mono text-[13px] text-sf-stellar-text">{m.figure}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-t2">{m.note}</p>
                    <p className="mt-1 font-mono text-[12px] text-t4">{m.source}</p>
                  </li>
                ))}
              </ul>
              <p className="sf-measure text-[13px] text-t3">
                The answers differ because the questions do: how long the voyage, how strictly breeding is managed, whether a frozen bank exists, and how much margin for a plague or a mutiny. There is no single minimum; pick the rule your ship's culture actually follows.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── 3. Closed loop ─────────────────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.lifeSupport}
          title="Closed-Loop Life Support"
          subtitle="Air, water and food: what the loops recover, what leaks, and when the margin runs out"
          levelNumber={3}
          thinkLike="a life support engineer: a loop that is 99% closed loses everything in a hundred reserve-lengths."
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <NumberField label="Oxygen recovery" value={form.lifeSupport.airEfficiencyPct} onChange={(n) => setField("lifeSupport.airEfficiencyPct", n)} unit="%" min={0} max={100} worldId={worldId} />
              <NumberField label="Water recovery" value={form.lifeSupport.waterEfficiencyPct} onChange={(n) => setField("lifeSupport.waterEfficiencyPct", n)} unit="%" min={0} max={100} worldId={worldId} />
              <NumberField label="Food grown aboard" value={form.lifeSupport.foodEfficiencyPct} onChange={(n) => setField("lifeSupport.foodEfficiencyPct", n)} unit="%" min={0} max={100} worldId={worldId} />
              <NumberField label="Reserve tanks" value={form.lifeSupport.reserveDays} onChange={(n) => setField("lifeSupport.reserveDays", Math.max(0, n))} unit="days" min={0} worldId={worldId} help="Stored margin per loop, in days of full consumption." />
            </div>

            <div className="overflow-x-auto sf-sb">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <caption className="sr-only">Life support loops</caption>
                <thead>
                  <tr className="border-b border-sf-line-hairline font-heading text-[12px] uppercase tracking-[0.12em] text-t4">
                    <th className="py-2 pr-3">Loop</th>
                    <th className="py-2 pr-3">Per person</th>
                    <th className="py-2 pr-3">Lost per day</th>
                    <th className="py-2 pr-3">Reserves last</th>
                    <th className="py-2">Needed to arrive</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {ls.loops.map((l) => (
                    <tr key={l.id} className="border-b border-sf-line-hairline">
                      <td className="py-2 pr-3 font-sans text-t1">{l.label}</td>
                      <td className="py-2 pr-3 text-t2">{l.perCapitaKgDay} <span className="text-t4">kg/day</span></td>
                      <td className="py-2 pr-3 text-t2">{fmt(l.makeupKgDay, 1)} <span className="text-t4">kg/day</span></td>
                      <td className={cn("py-2 pr-3", l.failsBeforeArrival ? "text-sf-crimson-text" : "text-t1")}>
                        {l.failsBeforeArrival ? "// " : ""}
                        {Number.isFinite(l.daysToFailure) ? fmtYears(l.daysToFailure / DAYS_PER_YEAR) : "indefinitely"}
                      </td>
                      <td className="py-2 text-t2">{(l.requiredEfficiency * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Readout label="Closed-loop eff." value={fmt(ls.closedLoopEfficiency * 100, 2)} unit="%" note="Mass-weighted across O₂, water, food." tone={ls.firstFailureLoop ? "danger" : "default"} />
              <Readout label="CO₂ to scrub" value={fmt(ls.co2KgDay, 0)} unit="kg/day" note={`${PER_CAPITA_KG_PER_DAY.carbonDioxide} kg per person per day.`} />
              <Readout label="Reserve mass" value={fmt(ls.reserveTonnes, 0)} unit="t" note="O₂, water and food stored at launch." />
              <Readout label="Voyage" value={fmt(ls.voyageDays, 0)} unit="ship-days" />
            </div>
            <WarningList warnings={warningsFor("lifeSupport")} />
            <div className="grid gap-2 md:grid-cols-2">
              {LOOP_BENCHMARKS.map((b) => (
                <div key={b.id} className="border border-sf-line bg-sf-surface p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[13px] text-t1">{b.label}</span>
                    <span className="font-mono text-[13px] text-sf-amber-text">{b.value}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-t3">{b.note}</p>
                </div>
              ))}
            </div>
            <p className="font-mono text-[12px] text-t4">PER-CAPITA: {CONSUMABLES_SOURCE}. Hygiene water excluded.</p>
          </div>
        </CollapsibleSection>

        {/* ── 4. Habitat ─────────────────────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.habitat}
          title="Habitat"
          subtitle="The spinning decks: gravity, Coriolis, floor area and shielding"
          levelNumber={4}
          thinkLike="an architect who has to fit fields, homes and machinery inside a wheel."
        >
          <div className="space-y-6">
            {worldId && gravitasSheets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">Spin on file</span>
                <ImportMenu tool="gravitas" worksheets={gravitasSheets} onImport={handleImport} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Habitat shape">
              {(["ring", "cylinder"] as const).map((shape) => (
                <Button
                  key={shape}
                  variant={form.habitat.shape === shape ? "sf-primary" : "sf-ghost"}
                  size="sf-sm"
                  aria-pressed={form.habitat.shape === shape}
                  onClick={() => setField("habitat.shape", shape)}
                >
                  {shape === "ring" ? "Ring (torus)" : "Cylinder (O'Neill)"}
                </Button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField label="Radius" value={form.habitat.radiusM} onChange={(n) => setField("habitat.radiusM", n)} unit="m" min={0} provenance={pv("habitat.radiusM")} worldId={worldId} help={`1 g at 2 rpm needs ${fmt(h.radiusFor1gAtComfort, 0)} m.`} />
              <NumberField label="Spin rate" value={form.habitat.rpm} onChange={(n) => setField("habitat.rpm", n)} unit="rpm" min={0} provenance={pv("habitat.rpm")} worldId={worldId} help="2 rpm: most people never notice. Above 4: many never adapt." />
              <NumberField label={form.habitat.shape === "ring" ? "Ring width" : "Cylinder length"} value={form.habitat.lengthM} onChange={(n) => setField("habitat.lengthM", n)} unit="m" min={0} worldId={worldId} />
              <NumberField label="Decks" value={form.habitat.decks} onChange={(n) => setField("habitat.decks", Math.max(1, Math.round(n)))} min={1} max={50} worldId={worldId} help="Stacked inward from the hull." />
              <NumberField label="Deck height" value={form.habitat.deckHeightM} onChange={(n) => setField("habitat.deckHeightM", n)} unit="m" min={0.5} worldId={worldId} />
              <NumberField label="Shielding" value={form.habitat.shieldingTPerM2} onChange={(n) => setField("habitat.shieldingTPerM2", n)} unit="t/m²" min={0} worldId={worldId} help={`Stanford Torus (NASA SP-413): ${STANFORD_TORUS_SHIELD_T_PER_M2} t/m² of slag.`} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <NumberField label="Crop area per person" value={form.lifeSupport.cropAreaPerPerson} onChange={(n) => setField("lifeSupport.cropAreaPerPerson", n)} unit="m²" min={0} worldId={worldId} help={CROP_AREA_NOTE} />
              <NumberField label="Living area per person" value={form.lifeSupport.livingAreaPerPerson} onChange={(n) => setField("lifeSupport.livingAreaPerPerson", n)} unit="m²" min={0} worldId={worldId} help="Homes, schools, commons. A dense Earth city: 20–40 m² of floor per resident." />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Readout label="Rim gravity" value={h.rimG.toFixed(2)} unit="g" tone={h.rimG > 0 && (h.rimG < 0.3 || h.rimG > 1.5) ? "caution" : "default"} />
              <Readout label="Spin comfort" value={h.comfort === "none" ? "NO SPIN" : h.comfort.toUpperCase()} tone={h.comfort === "severe" ? "danger" : h.comfort === "adaptable" ? "caution" : "ok"} />
              <Readout label="Coriolis" value={fmt(h.coriolisRatio * 100, 1)} unit="% of g" note="Sideways push on someone walking spinward. Dropped objects miss their mark." />
              <Readout label="Head-to-foot" value={fmt(h.headToFootGradient * 100, 2)} unit="% lighter" note={`Rim speed ${fmt(h.rimSpeedMs, 0)} m/s.`} />
            </div>
            <HabitatSchematic form={form} results={results} />
            <div className="space-y-2">
              <h3 className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">// Deck plan, all decks</h3>
              <DeckPlan results={results} />
              <p className="text-[13px] text-t3">
                {fmt(h.availableAreaM2, 0)} m² of floor; {fmt(h.requiredAreaM2, 0)} m² required (crops and living plus 25% for corridors, machinery and storage). Shield envelope ~{fmt(h.shieldMassTonnes, 0)} t.
              </p>
            </div>
            <WarningList warnings={warningsFor("habitat")} />
            <p className="font-mono text-[12px] text-t4">SPIN: {SPIN_SOURCE}.</p>
          </div>
        </CollapsibleSection>

        {/* ── 5. Social drift ────────────────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.drift}
          title="Social Drift"
          subtitle="What the voyage does to language, memory and purpose"
          levelNumber={5}
          thinkLike="an anthropologist: no one aboard chose this, and every generation knows less of why."
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Readout label="Core words shared" value={fmt(d.sharedCoreVocabulary * 100, 0)} unit="%" note="With home on arrival (Swadesh rate, both lines drifting)." />
              <Readout label="LexDrift model" value={fmt(d.lexdrift.divergencePct, 0)} unit="% diverged" note={d.lexdrift.severityLabel} tone={d.lexdrift.severity === "separate" ? "danger" : d.lexdrift.severity === "dialect" ? "default" : "caution"} />
              <Readout label="Last home-born dies" value={`Y${fmt(d.lastHomeBornYears, 0)}`} note={`Generation ${Math.floor(d.lastHomeBornYears / form.population.generationYears) + 1}.`} />
              <Readout label="Living memory ends" value={`Y${fmt(d.secondHandMemoryEndsYears, 0)}`} note="No one left who heard home described by someone born there." />
            </div>
            <p className="sf-measure text-[13px] text-t3">
              {GLOTTO_NOTE} The LexDrift figure uses the same population and isolation modifiers as the{" "}
              <Link to={worldId ? `/tools/lexdrift?worldId=${worldId}` : "/tools/lexdrift"} className="text-sf-primary-text underline-offset-2 hover:underline">
                LexDrift
              </Link>{" "}
              tool ({d.lexdrift.isolation} isolation at {fmt(form.voyage.distanceLy, 1)} ly), so the two agree. Open it to work out what the ship's speech actually sounds like.
            </p>
          </div>
        </CollapsibleSection>

        {/* ── 6. Generations & Chronicle ─────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.chronicle}
          title="Generations"
          subtitle="The history the voyage writes. Log the events you want into the Chronicle"
          levelNumber={6}
          defaultOpen
        >
          <div className="space-y-4">
            {v.valid ? (
              <>
                <GenerationsStrip
                  totalYears={v.shipYears}
                  generationYears={form.population.generationYears}
                  events={events}
                  selectedId={selectedEventId}
                  onSelect={(id) => {
                    setSelectedEventId(id);
                    document.getElementById(`ark-event-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[12px] text-t4">
                    {events.length} EVENTS · {loggedCount} ON FILE · DATED FROM LAUNCH {form.identity.launchYear} IN THE HOME CALENDAR
                  </p>
                  {worldId && (
                    <Link to={`/worlds/${worldId}/chronicle`} className="inline-flex min-h-hit items-center gap-1.5 text-[13px] text-sf-primary-text hover:underline">
                      <History className="h-4 w-4" aria-hidden="true" />
                      Open the Chronicle
                    </Link>
                  )}
                </div>
                <ol className="max-h-[560px] space-y-2 overflow-y-auto pr-1 sf-sb">
                  {events.map((e) => {
                    const onFile = isOnFile(e.id);
                    const sel = e.id === selectedEventId;
                    return (
                      <li
                        key={e.id}
                        id={`ark-event-${e.id}`}
                        className={cn(
                          "grid gap-3 border p-3 transition-colors duration-fast md:grid-cols-[96px_1fr_auto] md:items-start",
                          sel ? "border-sf-line-emphasis bg-sf-surface-elevated" : "border-sf-line bg-sf-surface",
                        )}
                      >
                        <div className="font-mono text-[13px] leading-tight">
                          <div className="text-t1">{chronicleYear(form.identity.launchYear, e)}</div>
                          <div className="text-[12px] text-t4">G{e.generation} · Y{Math.round(e.shipYear)}</div>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] text-t1">{e.title}</span>
                            <span className={cn("font-mono text-[12px]", LAYER_TEXT[e.layer])}>{LAYER_LABEL[e.layer]}</span>
                            {e.kind === "seeded" && <span className="font-mono text-[12px] text-t4">SEEDED</span>}
                          </div>
                          <p className="sf-measure text-[13px] leading-snug text-t2">{e.description}</p>
                        </div>
                        <div className="md:justify-self-end">
                          {onFile ? (
                            <Tag variant="teal">ON FILE</Tag>
                          ) : (
                            <Button
                              variant="sf-ghost"
                              size="sf-sm"
                              disabled={!cloud || loggingId === e.id}
                              onClick={() => handleLogEvent(e)}
                              aria-label={`Log to Chronicle: ${e.title}`}
                              className="disabled:border-sf-disabled-line disabled:bg-sf-disabled-bg disabled:text-sf-disabled-text"
                            >
                              {loggingId === e.id ? "Logging..." : "Log to Chronicle"}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {!cloud && (
                  <p className="font-mono text-[12px] text-t4">OPEN THIS SHIP INSIDE A WORLD TO LOG EVENTS TO ITS CHRONICLE.</p>
                )}
                {selectedEvent && (
                  <p className="sr-only" aria-live="polite">Selected: {selectedEvent.title}</p>
                )}
              </>
            ) : (
              <p className="font-mono text-[13px] text-t3">{v.error ?? "VOYAGE UNRESOLVED."} NO HISTORY TO WRITE.</p>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Notes & export ─────────────────────────────────────────── */}
        <CollapsibleSection
          id={SECTION_IDS.notes}
          title="Shipboard Notes"
          subtitle="What life aboard is like, in your words"
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        >
          <div className="space-y-6">
            {[
              { key: "shipboardLife" as const, label: "Daily life aboard", placeholder: "The gardens never go dark. Children learn to throw a ball spinward..." },
              { key: "forgotten" as const, label: "What the ship has forgotten", placeholder: "No one remembers why deck four is sealed..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Suspense fallback={<div className="min-h-[120px] border border-sf-line bg-sf-surface" />}>
                  <RichTextEditor
                    content={form.notes[key]}
                    onChange={(html) => setForm((prev) => ({ ...prev, notes: { ...prev.notes, [key]: html } }))}
                    placeholder={placeholder}
                    minHeight="120px"
                    worldId={worldId || undefined}
                  />
                </Suspense>
              </div>
            ))}
            <Button variant="sf-ghost" size="sf-sm" onClick={handleCopyMarkdown} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy as Markdown
            </Button>
          </div>
        </CollapsibleSection>
      </div>

      <ToolSidebar>
        <SectionNavigation sections={GENSHIP_SECTIONS} mode="inline" />
        <KeyChoicesSidebar sections={keyChoices} title="Ark Summary" mode="inline" />
      </ToolSidebar>
      <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-2 xl:hidden no-print">
        <MobileSectionNav sections={GENSHIP_SECTIONS} />
        <MobileKeyChoices sections={keyChoices} title="Ark Summary" />
      </div>

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        content={form.generalNotes}
        onChange={(html) => setForm((prev) => ({ ...prev, generalNotes: html }))}
      />
      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || "local"}
        images={form.moodboard as MoodboardImage[]}
        onImagesChange={(images) => setForm((prev) => ({ ...prev, moodboard: images }))}
      />
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Ark"
        worldName={worldName}
        worksheetTitle={currentWorksheetTitle ?? undefined}
        formState={exportState}
        summaryTemplate={<GenerationShipSummaryTemplate formState={exportState as unknown as Record<string, unknown>} worldName={worldName} />}
        fullTemplate={<GenerationShipFullReportTemplate formState={exportState as unknown as Record<string, unknown>} worldName={worldName} />}
        defaultFilename={fileBase}
      />
      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          entityType="worksheet"
          entityId={currentWorksheetId || worksheetId || ""}
          entityTitle={currentWorksheetTitle || "Generation Ship"}
        />
      )}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Ark"
          worksheets={ownWorksheets}
          isLoading={ownLoading}
          onSelect={(id) => {
            setSearchParams({ worldId, worksheetId: id });
            setWorksheetSelectorOpen(false);
          }}
          onCreate={handleWorksheetCreate}
        />
      )}
      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default GenerationShipDesigner;
