/**
 * Dossier: Character Development — 05-NEW-SYSTEMS.md §A1.
 *
 * "A character in StellarForge is not a card with a bio. It is an entity whose
 * every trait is inherited from the world, with overrides."
 *
 * ── The four questions (sf-new-tool gate) ──────────────────────────────────
 *
 * 1. PRODUCES  `character.*`, which nothing else produces: identity, origins
 *    (homeworld, species, polity/house, culture, native language, birth
 *    epoch), body (height, mass, weight under native g, age in local years),
 *    the effective senses and beliefs after the writer's overrides,
 *    psychology, voice, typed relationships to other characters (mirrored to
 *    world_connections) and arc beats bound to Chronicle events. Written as
 *    worksheet facts (src/lib/dossier/fields.ts → ENTITY_MASTER_FIELDS.
 *    character) and as a `character` world entry on save.
 *
 * 2. CONSUMES  what already exists: Genesis (surface gravity, or mass and
 *    radius; day and year length), Phylo (lifespan, size, biochemistry,
 *    cognition), Sensorium (senses, dominant sense, blind spots), Mythos
 *    (cosmology, gods, funeral customs, taboos), Dominion (government, core
 *    values, factions for the house), Lexdrift (root language, phonology,
 *    drift) and the Chronicle (birth epoch, arc beats). Missing upstream data
 *    reads NOT ON FILE with a link to fill it. Nothing is invented.
 *
 * 3. SCENE IMPACT  Every Studio document now has someone to point a POV at.
 *    The Refs and Check tabs carry the character's own facts with their
 *    provenance ("Phylo, inherited by Kael's dossier"), so prose that gives a
 *    Verrid colour vision or a ninety-year lifespan can be caught. Weight
 *    under local g, felt weight on other worlds and age in local years are
 *    the numbers a scene actually needs. Dramatis personae export for
 *    Compile.
 *
 * 4. ABSORBS  Nothing; this is net-new (05-NEW-SYSTEMS §A1 says so). Law VII
 *    check: it adds no always-on chrome and no new view type; it is one more
 *    ToolPageLayout worksheet, and it replaces the landing page's "Character
 *    Development — coming soon" placeholder.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardCopy, ContactRound, Plus, Trash2, Users } from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import ToolSidebar from "@/components/tools/ToolSidebar";
import SectionNavigation, { MobileSectionNav } from "@/components/tools/SectionNavigation";
import KeyChoicesSidebar, { MobileKeyChoices, type KeyChoicesSection } from "@/components/tools/KeyChoicesSidebar";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OriginPicker } from "@/components/dossier/OriginPicker";
import { TraitRow } from "@/components/dossier/TraitRow";
import { toolHref } from "@/components/dossier/tool-href";
import { useWorldId } from "@/hooks/use-world-id";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWorlds } from "@/hooks/use-worlds";
import { useWorksheet, useWorksheets, useWorksheetsByType, useRenameWorksheet } from "@/hooks/use-worksheets";
import { useEntityMatch } from "@/hooks/use-entity-match";
import { useChronicleData } from "@/hooks/use-chronicle";
import { useWorldEntities } from "@/hooks/use-world-entities";
import { DossierSummaryTemplate } from "@/lib/pdf/templates";
import { VOICE } from "@/lib/ship-voice";
import type { Json } from "@/integrations/supabase/types";
import type { ChronicleEvent } from "@/services/chronicle-data";
import { syncDossierConnections } from "@/services/dossier-connections";
import {
  DOSSIER_TOOL_TYPE,
  RELATIONSHIP_TYPES,
  createEmptyDossier,
  normalizeDossier,
  type DossierArcBeat,
  type DossierFormState,
  type DossierRelationship,
  type DossierSourceRef,
  type OriginSlot,
  type RelationshipType,
} from "@/lib/dossier/types";
import {
  homeworldGravity,
  matchMythosForSpecies,
  matchSensoriumForSpecies,
  resolveTraits,
  setOverride,
  text as plain,
  type ResolvedTrait,
  type UpstreamSheet,
} from "@/lib/dossier/inheritance";
import { buildDossierMarkdown, buildDramatisPersonae, buildSnapshot, deriveBody, formatWeight } from "@/lib/dossier/snapshot";
import { feltWeightRatio, fmt, narrateFeltWeight, narrateLocalAge, narrateNativeGravity } from "@/lib/dossier/derive";
import { RELATIONSHIP_LABELS } from "@/lib/dossier/relationships";
import { CREATABLE_ENTITY_TYPES } from "@/lib/entity-config";

// ─── Constants ───────────────────────────────────────────────────────

const TOOL_TYPE = DOSSIER_TOOL_TYPE;

const SECTIONS = [
  { id: "identity", title: "Identity" },
  { id: "origins", title: "Origins" },
  { id: "body", title: "Body" },
  { id: "senses", title: "Senses" },
  { id: "beliefs", title: "Beliefs" },
  { id: "psychology", title: "Psychology" },
  { id: "voice", title: "Voice" },
  { id: "relationships", title: "Relationships" },
  { id: "arc", title: "Arc" },
  { id: "notes", title: "Notes" },
];

/** Which tool fills each origin slot. */
const SLOT_TOOL: Record<OriginSlot, string> = {
  homeworld: "planetary-profile",
  species: "evolutionary-biology",
  sensorium: "sensorium",
  culture: "xenomythology-framework-builder",
  polity: "empire-designer",
  language: "lexdrift",
};

const NONE = "__none";

const PSYCHOLOGY_FIELDS: Array<{ key: keyof DossierFormState["psychology"]; label: string; prompt: string; help: string }> = [
  { key: "want", label: "Want", prompt: "What they are chasing, and would say so if asked.",
    help: "The conscious goal. It drives the plot." },
  { key: "need", label: "Need", prompt: "What would actually make them whole. They do not know it yet.",
    help: "The unconscious lack. It drives the arc. Want and need should pull in different directions." },
  { key: "motivation", label: "Motivation", prompt: "Why this want, and why now?",
    help: "The pressure behind the want. Tie it to an event or a person if you can." },
  { key: "fear", label: "Fear", prompt: "What they will do almost anything to avoid.",
    help: "Put it in the way of the want, and the scene writes itself." },
  { key: "wound", label: "Wound", prompt: "The old injury the fear grew from. Bind it to a Chronicle event below if it happened on the page of history.",
    help: "Backstory that still bleeds into the present tense." },
  { key: "values", label: "Values", prompt: "What they will not trade, and what they would trade it for.",
    help: "Start from the polity's and culture's values above, then decide where this person departs." },
  { key: "temperament", label: "Temperament", prompt: "How they meet pressure: still, volatile, wry, brittle, patient...",
    help: "The default register of their reactions. Species cognition above may bound it." },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function asSheet(ws: { id: string; title: string | null; tool_type: string; data: Json }): UpstreamSheet {
  const data = ws.data && typeof ws.data === "object" && !Array.isArray(ws.data) ? (ws.data as Record<string, unknown>) : {};
  return { id: ws.id, title: ws.title, toolType: ws.tool_type, data };
}

function nameFrom(path: string) {
  return (s: UpstreamSheet): string => {
    let cur: unknown = s.data;
    for (const part of path.split(".")) {
      cur = cur && typeof cur === "object" ? (cur as Record<string, unknown>)[part] : undefined;
    }
    return plain(cur) ?? ((s.title ?? "").trim() || "Untitled");
  };
}

const speciesName = nameFrom("speciesName");
const polityName = nameFrom("foundation.name");

function flattenEvents(events: ChronicleEvent[] | undefined): ChronicleEvent[] {
  const out: ChronicleEvent[] = [];
  const walk = (list: ChronicleEvent[]) => {
    for (const e of list) {
      out.push(e);
      if (e.children?.length) walk(e.children);
    }
  };
  walk(events ?? []);
  return out.sort((a, b) => a.sortValue - b.sortValue);
}

function eventLabel(e: ChronicleEvent): string {
  return `${e.title} · ${e.eventDate}`;
}

/** The form minus the save-time snapshot, for dirty tracking. */
function editableJson(s: DossierFormState): string {
  return JSON.stringify({ ...s, resolved: null, provenance: null });
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Small presentational pieces ─────────────────────────────────────

function Readout({ label, value, unit, note }: { label: string; value: string | null; unit?: string; note?: string }): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border border-sf-line bg-sf-surface p-4">
      <span className="font-heading text-sf-eyebrow uppercase text-t4">{label}</span>
      {value !== null ? (
        <span className="font-mono text-[22px] leading-tight text-t1">
          {value}
          {unit && <span className="ml-1.5 font-mono text-[12px] text-t4">{unit}</span>}
        </span>
      ) : (
        <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">// NOT ON FILE</span>
      )}
      {note && value !== null && (
        <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-magenta-text">{note}</span>
      )}
    </div>
  );
}

function TraitList({
  traits,
  worldId,
  overrides,
  onOverride,
  narratives = {},
}: {
  traits: ResolvedTrait[];
  worldId: string | null;
  overrides: Record<string, string>;
  onOverride: (key: string, value: string | null) => void;
  narratives?: Record<string, string>;
}): JSX.Element {
  return (
    <div>
      {traits.map((t) => (
        <TraitRow
          key={t.key}
          trait={t}
          worldId={worldId}
          override={overrides[t.key]}
          onOverride={(v) => onOverride(t.key, v)}
          narrative={narratives[t.key]}
        />
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  help,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && <p className="font-sans text-sm text-t3 sf-measure">{help}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

const Dossier = (): JSX.Element => {
  const [formState, setFormState] = useState<DossierFormState>(createEmptyDossier);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [savedJson, setSavedJson] = useState<string>(() => editableJson(createEmptyDossier()));
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  /** Relationships as last loaded or saved: the baseline for edge sync. */
  const savedRelationships = useRef<DossierRelationship[]>([]);

  const worldId = useWorldId();
  const { user } = useAuth();
  const { toast } = useToast();
  const { worlds } = useWorlds();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentWorld = worlds.find((w) => w.id === worldId);

  const entityMatch = useEntityMatch(worldId || undefined);
  const { createWorksheet, updateWorksheet, worksheets } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: entityMatch.check,
  });
  const renameWorksheet = useRenameWorksheet();
  const { data: worksheetsByType = [] } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const requestedWorksheetId = searchParams.get("worksheetId");
  const { data: loadedWorksheet } = useWorksheet(requestedWorksheetId ?? undefined);
  const { data: chronicle } = useChronicleData(worldId || undefined);
  const { entities } = useWorldEntities(worldId || undefined);

  // ─── Upstream records in this world ────────────────────────────────

  const sheetsByTool = useMemo(() => {
    const out: Record<string, UpstreamSheet[]> = {};
    for (const ws of worksheets ?? []) {
      (out[ws.tool_type] ??= []).push(asSheet(ws));
    }
    return out;
  }, [worksheets]);

  const sheetsFor = useCallback((slot: OriginSlot) => sheetsByTool[SLOT_TOOL[slot]] ?? [], [sheetsByTool]);

  const sheetsBySlot = useMemo(() => {
    const out: Partial<Record<OriginSlot, UpstreamSheet | null>> = {};
    for (const slot of Object.keys(SLOT_TOOL) as OriginSlot[]) {
      const id = formState.origins[slot].worksheetId;
      out[slot] = id ? sheetsFor(slot).find((s) => s.id === id) ?? null : null;
    }
    return out;
  }, [formState.origins, sheetsFor]);

  const traits = useMemo(() => resolveTraits(sheetsBySlot, formState.overrides), [sheetsBySlot, formState.overrides]);
  const group = useCallback((g: ResolvedTrait["group"]) => traits.filter((t) => t.group === g), [traits]);
  const body = useMemo(() => deriveBody(formState, traits), [formState, traits]);
  const snapshot = useMemo(() => buildSnapshot(formState, traits), [formState, traits]);

  const otherWorlds = useMemo(() => {
    const homeId = formState.origins.homeworld.worksheetId;
    return sheetsFor("homeworld")
      .filter((s) => s.id !== homeId)
      .map((s) => {
        const g = homeworldGravity(s.data);
        const ratio = feltWeightRatio(body.nativeG, g);
        return { sheet: s, g, ratio };
      })
      .filter((w) => w.g !== null);
  }, [sheetsFor, formState.origins.homeworld.worksheetId, body.nativeG]);

  const events = useMemo(() => flattenEvents(chronicle?.events), [chronicle]);

  const otherDossiers = useMemo(
    () => (sheetsByTool[TOOL_TYPE] ?? []).filter((s) => s.id !== currentWorksheetId),
    [sheetsByTool, currentWorksheetId],
  );
  const entityTargets = useMemo(
    () =>
      (entities ?? []).filter((e) =>
        (CREATABLE_ENTITY_TYPES as readonly string[]).includes(e.entry_type),
      ),
    [entities],
  );

  const polityFactions = useMemo(() => {
    const raw = sheetsBySlot.polity?.data?.factions;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((f) => (f && typeof f === "object" ? plain((f as Record<string, unknown>).name) : null))
      .filter((n): n is string => !!n);
  }, [sheetsBySlot.polity]);

  const hasUnsavedChanges = editableJson(formState) !== savedJson;

  // ─── Load ──────────────────────────────────────────────────────────

  const loadWorksheet = useCallback(
    (ws: { id: string; title: string | null; data: Json | null }) => {
      const next = normalizeDossier(ws.data);
      setCurrentWorksheetId(ws.id);
      setCurrentWorksheetTitle(ws.title);
      setFormState(next);
      setSavedJson(editableJson(next));
      savedRelationships.current = next.relationships;
    },
    [],
  );

  useEffect(() => {
    if (loadedWorksheet && loadedWorksheet.id !== currentWorksheetId && loadedWorksheet.tool_type === TOOL_TYPE) {
      loadWorksheet(loadedWorksheet);
    }
  }, [loadedWorksheet, currentWorksheetId, loadWorksheet]);

  // ─── Updaters ──────────────────────────────────────────────────────

  const patch = useCallback(<K extends keyof DossierFormState>(key: K, value: DossierFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setIdentity = (k: keyof DossierFormState["identity"], v: string) =>
    setFormState((prev) => ({ ...prev, identity: { ...prev.identity, [k]: v } }));
  const setBody = <K extends keyof DossierFormState["body"]>(k: K, v: DossierFormState["body"][K]) =>
    setFormState((prev) => ({ ...prev, body: { ...prev.body, [k]: v } }));
  const setPsych = (k: keyof DossierFormState["psychology"], v: string) =>
    setFormState((prev) => ({ ...prev, psychology: { ...prev.psychology, [k]: v } }));
  const setVoice = (k: keyof DossierFormState["voice"], v: string) =>
    setFormState((prev) => ({ ...prev, voice: { ...prev.voice, [k]: v } }));

  const setOrigin = useCallback(
    (slot: OriginSlot, ref: DossierSourceRef) => {
      setFormState((prev) => {
        const origins = { ...prev.origins, [slot]: ref };
        // Picking a species pulls in its sensory profile and mythology when
        // those are explicitly linked to it, and only into empty slots: an
        // origin the writer chose is never replaced behind their back.
        if (slot === "species" && ref.worksheetId) {
          const species = sheetsFor("species").find((s) => s.id === ref.worksheetId) ?? null;
          if (!prev.origins.sensorium.worksheetId) {
            const sens = matchSensoriumForSpecies(sheetsFor("sensorium"), species);
            if (sens) origins.sensorium = { worksheetId: sens.id, name: (sens.title ?? "").trim() || "Untitled" };
          }
          if (!prev.origins.culture.worksheetId) {
            const myth = matchMythosForSpecies(sheetsFor("culture"), species);
            if (myth) origins.culture = { worksheetId: myth.id, name: (myth.title ?? "").trim() || "Untitled" };
          }
        }
        return { ...prev, origins };
      });
    },
    [sheetsFor],
  );

  const onOverride = useCallback((key: string, value: string | null) => {
    setFormState((prev) => ({ ...prev, overrides: setOverride(prev.overrides, key, value) }));
  }, []);

  const updateRel = (id: string, change: Partial<DossierRelationship>) =>
    patch(
      "relationships",
      formState.relationships.map((r) => (r.id === id ? { ...r, ...change } : r)),
    );
  const updateBeat = (id: string, change: Partial<DossierArcBeat>) =>
    patch(
      "arc",
      formState.arc.map((b) => (b.id === id ? { ...b, ...change } : b)),
    );

  // ─── Save ──────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!user || !worldId) {
      toast({ title: "SIGN IN AND OPEN A WORLD TO SECURE THIS FILE.", variant: "destructive" });
      return;
    }
    const snap = buildSnapshot(formState, traits);
    const title = formState.identity.name.trim() || "Unnamed Character";
    setIsSyncing(true);
    try {
      let id = currentWorksheetId;
      let relationships = formState.relationships;
      let failed = 0;

      if (id) {
        const sync = await syncDossierConnections({
          worldId, worksheetId: id, userId: user.id, current: relationships, saved: savedRelationships.current,
        });
        relationships = sync.relationships;
        failed = sync.failed;
        const data = { ...formState, ...snap, relationships } as unknown as Json;
        await updateWorksheet.mutateAsync({ worksheetId: id, title, data });
      } else {
        const data = { ...formState, ...snap } as unknown as Json;
        const ws = await createWorksheet.mutateAsync({ worldId, toolType: TOOL_TYPE, title, data });
        id = ws.id;
        setCurrentWorksheetId(ws.id);
        setSearchParams((p) => { p.set("worksheetId", ws.id); return p; });
        if (relationships.length > 0) {
          const sync = await syncDossierConnections({
            worldId, worksheetId: ws.id, userId: user.id, current: relationships, saved: [],
          });
          relationships = sync.relationships;
          failed = sync.failed;
          await updateWorksheet.mutateAsync({
            worksheetId: ws.id,
            data: { ...formState, ...snap, relationships } as unknown as Json,
          });
        }
      }

      setCurrentWorksheetTitle(title);
      savedRelationships.current = relationships;
      const ids = new Map(relationships.map((r) => [r.id, r.connectionId]));
      setFormState((prev) => {
        const next = {
          ...prev,
          ...snap,
          relationships: prev.relationships.map((r) => (ids.has(r.id) ? { ...r, connectionId: ids.get(r.id) ?? null } : r)),
        };
        return next;
      });
      setSavedJson(editableJson({ ...formState, relationships }));
      if (failed > 0) {
        toast({
          title: `FILE SECURED. ${failed} RELATIONSHIP EDGE${failed === 1 ? "" : "S"} NOT MIRRORED TO THE WORLD GRAPH.`,
          description: "RETRY ON NEXT SAVE.",
        });
      }
    } catch {
      // useWorksheets reports the failure in Ship's Voice; the form keeps every word.
    } finally {
      setIsSyncing(false);
    }
  }, [user, worldId, formState, traits, currentWorksheetId, updateWorksheet, createWorksheet, setSearchParams, toast]);

  const handleNew = useCallback(() => {
    const fresh = createEmptyDossier();
    setFormState(fresh);
    setSavedJson(editableJson(fresh));
    setCurrentWorksheetId(null);
    setCurrentWorksheetTitle(null);
    savedRelationships.current = [];
    setSearchParams((p) => { p.delete("worksheetId"); return p; });
  }, [setSearchParams]);

  // ─── Exports ───────────────────────────────────────────────────────

  const exportState = useMemo(() => ({ ...formState, ...snapshot }), [formState, snapshot]);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: VOICE.copyToClipboard });
      } catch {
        toast({ title: VOICE.genericError, variant: "destructive" });
      }
    },
    [toast],
  );

  const copyDossier = () => copy(buildDossierMarkdown(formState, traits));
  const copyCast = () => {
    const cast = (sheetsByTool[TOOL_TYPE] ?? []).map((s) =>
      s.id === currentWorksheetId ? { title: s.title, data: exportState } : { title: s.title, data: s.data },
    );
    if (!currentWorksheetId) cast.push({ title: formState.identity.name, data: exportState });
    const md = buildDramatisPersonae(cast);
    if (!md) {
      toast({ title: "NO NAMED CHARACTERS ON FILE.", variant: "destructive" });
      return;
    }
    void copy(md);
  };

  // ─── Sidebar summary ───────────────────────────────────────────────

  const keyChoices: KeyChoicesSection[] = useMemo(() => {
    const overridden = traits.filter((t) => t.status === "overridden" || t.status === "manual").length;
    const missing = traits.filter((t) => t.status === "missing" || t.status === "unrecorded").length;
    return [
      {
        id: "who",
        title: "Who",
        choices: [
          { label: "Name", value: formState.identity.name || undefined },
          { label: "Role", value: formState.identity.role || undefined },
          { label: "Species", value: formState.origins.species.name || undefined },
          { label: "Homeworld", value: formState.origins.homeworld.name || undefined },
          { label: "House", value: formState.origins.house || undefined },
        ],
      },
      {
        id: "body",
        title: "Body",
        choices: [
          { label: "Native g", value: body.nativeG !== null ? `${fmt(body.nativeG)} g` : undefined },
          { label: "Weight at home", value: body.weightAtHome ? `${fmt(body.weightAtHome.earthScaleKg)} kg-eq` : undefined },
          { label: "Age (local)", value: body.ageLocal !== null ? fmt(body.ageLocal) : undefined },
        ],
      },
      {
        id: "inheritance",
        title: "Inheritance",
        choices: [
          { label: "Inherited", value: String(traits.filter((t) => t.status === "inherited").length) },
          { label: "Overridden", value: String(overridden) },
          { label: "Not on file", value: String(missing) },
        ],
      },
    ];
  }, [formState, body, traits]);

  // ─── Render ────────────────────────────────────────────────────────

  const originLine = [
    formState.origins.homeworld.name && `BORN ON ${formState.origins.homeworld.name}`,
    formState.origins.species.name,
    formState.origins.house,
  ]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  const inherited = (key: string) => traits.find((t) => t.key === key)?.value ?? null;

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={() => { void handleSave(); }}
      onPrint={() => window.print()}
      onExport={() => setExportDialogOpen(true)}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onShare={currentWorksheetId ? () => setShareDialogOpen(true) : undefined}
      hasUnsavedChanges={hasUnsavedChanges}
      isSaving={isSyncing || updateWorksheet.isPending || createWorksheet.isPending}
      isCloudEnabled={!!(worldId && user)}
      extraActions={
        <>
          <Button type="button" variant="sf-ghost" size="sf-sm" onClick={copyDossier}>
            <ClipboardCopy aria-hidden />
            Copy Dossier
          </Button>
          <Button type="button" variant="sf-ghost" size="sf-sm" onClick={copyCast}>
            <Users aria-hidden />
            Copy Dramatis Personae
          </Button>
        </>
      }
      worksheetId={currentWorksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={async (newTitle) => {
        if (!currentWorksheetId) return;
        await renameWorksheet.mutateAsync({ worksheetId: currentWorksheetId, title: newTitle });
        setCurrentWorksheetTitle(newTitle);
      }}
      worksheetIcon={<ContactRound className="h-5 w-5 text-sf-magenta" aria-hidden />}
      isLoggedIn={!!user}
      worldBar={{ accent: "magenta", reason: "A CHARACTER INHERITS FROM A WORLD. CHOOSE ONE." }}
    >

      {originLine && (
        <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.10em] text-sf-magenta-text" aria-live="polite">
          // {originLine}
        </p>
      )}

      <div className="space-y-6">
        {/* ── 1 · Identity ─────────────────────────────────────────── */}
        <CollapsibleSection id="identity" title="IDENTITY" levelNumber={1} defaultOpen
          subtitle="Who this is, in the words the story will use.">
          <div className="grid gap-6 md:grid-cols-2">
            <Field id="dossier-name" label="Name" help="Becomes the character's entry in the Codex, ready to @mention.">
              <Input id="dossier-name" value={formState.identity.name} onChange={(e) => setIdentity("name", e.target.value)}
                placeholder="e.g. Kael Ithren-Adran" />
            </Field>
            <Field id="dossier-aliases" label="Also Known As">
              <Input id="dossier-aliases" value={formState.identity.aliases} onChange={(e) => setIdentity("aliases", e.target.value)}
                placeholder="Titles, epithets, the name their mother uses" />
            </Field>
            <Field id="dossier-role" label="Role In Story">
              <Input id="dossier-role" value={formState.identity.role} onChange={(e) => setIdentity("role", e.target.value)}
                placeholder="Protagonist, antagonist, foil, witness, mentor..." />
            </Field>
            <Field id="dossier-pronouns" label="Pronouns (optional)">
              <Input id="dossier-pronouns" value={formState.identity.pronouns} onChange={(e) => setIdentity("pronouns", e.target.value)}
                placeholder="As the narration will use them" />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── 2 · Origins ──────────────────────────────────────────── */}
        <CollapsibleSection id="origins" title="ORIGINS" levelNumber={2} defaultOpen
          subtitle="Where they come from. Every pick below fills the traits that follow.">
          <div className="grid gap-8 md:grid-cols-2">
            <OriginPicker label="Homeworld" noun="homeworld" tool={SLOT_TOOL.homeworld} sheets={sheetsFor("homeworld")}
              value={formState.origins.homeworld} onChange={(r) => setOrigin("homeworld", r)} worldId={worldId} />
            <OriginPicker label="Species" noun="species" tool={SLOT_TOOL.species} sheets={sheetsFor("species")}
              value={formState.origins.species} onChange={(r) => setOrigin("species", r)} worldId={worldId} nameOf={speciesName} />
            <OriginPicker label="Sensory Profile" noun="sensory profile" tool={SLOT_TOOL.sensorium} sheets={sheetsFor("sensorium")}
              value={formState.origins.sensorium} onChange={(r) => setOrigin("sensorium", r)} worldId={worldId} />
            <OriginPicker label="Culture & Belief" noun="culture" tool={SLOT_TOOL.culture} sheets={sheetsFor("culture")}
              value={formState.origins.culture} onChange={(r) => setOrigin("culture", r)} worldId={worldId} />
            <OriginPicker label="Polity" noun="polity" tool={SLOT_TOOL.polity} sheets={sheetsFor("polity")}
              value={formState.origins.polity} onChange={(r) => setOrigin("polity", r)} worldId={worldId} nameOf={polityName} />
            <Field id="dossier-house" label="House, Clan Or Faction"
              help={polityFactions.length ? undefined : "Free text. Factions recorded in Dominion appear here as suggestions."}>
              <Input id="dossier-house" value={formState.origins.house}
                onChange={(e) => setFormState((p) => ({ ...p, origins: { ...p.origins, house: e.target.value } }))}
                placeholder="e.g. House Adran" />
              {polityFactions.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Factions on file in Dominion">
                  {polityFactions.map((f) => (
                    <Button key={f} type="button" variant="sf-ghost" size="sf-sm"
                      aria-pressed={formState.origins.house === f}
                      onClick={() => setFormState((p) => ({ ...p, origins: { ...p.origins, house: f } }))}>
                      {f}
                    </Button>
                  ))}
                </div>
              )}
            </Field>
            <OriginPicker label="Native Language" noun="language" tool={SLOT_TOOL.language} sheets={sheetsFor("language")}
              value={formState.origins.language} onChange={(r) => setOrigin("language", r)} worldId={worldId} />
            <Field id="dossier-birth" label="Born" help="Bind birth to a Chronicle event, or write the date as the world reckons it.">
              <Select
                value={formState.origins.birth.eventId ?? NONE}
                onValueChange={(v) => {
                  const ev = events.find((e) => e.id === v);
                  setFormState((p) => ({
                    ...p,
                    origins: { ...p.origins, birth: ev ? { eventId: ev.id, label: eventLabel(ev) } : { eventId: null, label: p.origins.birth.label } },
                  }));
                }}
              >
                <SelectTrigger id="dossier-birth" aria-label="Birth: Chronicle event">
                  <SelectValue placeholder="Chronicle event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not bound to an event</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{eventLabel(e)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formState.origins.birth.eventId && (
                <Input aria-label="Birth date as written" value={formState.origins.birth.label}
                  onChange={(e) => setFormState((p) => ({ ...p, origins: { ...p.origins, birth: { eventId: null, label: e.target.value } } }))}
                  placeholder="e.g. 2290, the year of the Long Thaw" />
              )}
              {events.length === 0 && worldId && (
                <Link to={`/worlds/${worldId}/chronicle`} className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-primary-text underline-offset-4 hover:underline">
                  // NO CHRONICLE EVENTS ON FILE. OPEN THE CHRONICLE.
                </Link>
              )}
            </Field>
          </div>

          <div className="mt-8">
            <h4 className="mb-2 font-heading text-sf-eyebrow uppercase text-t4">// Inherited: polity and language</h4>
            <TraitList traits={group("origins")} worldId={worldId} overrides={formState.overrides} onOverride={onOverride} />
          </div>
        </CollapsibleSection>

        {/* ── 3 · Body ─────────────────────────────────────────────── */}
        <CollapsibleSection id="body" title="BODY" levelNumber={3}
          subtitle="What this body weighs, where, and how old it is by whose calendar.">
          <div className="grid gap-6 md:grid-cols-4">
            <Field id="dossier-height" label="Height (cm)">
              <Input id="dossier-height" inputMode="decimal" value={formState.body.heightCm}
                onChange={(e) => setBody("heightCm", e.target.value)} placeholder="e.g. 158" />
            </Field>
            <Field id="dossier-mass" label="Mass (kg)">
              <Input id="dossier-mass" inputMode="decimal" value={formState.body.massKg}
                onChange={(e) => setBody("massKg", e.target.value)} placeholder="e.g. 70" />
            </Field>
            <Field id="dossier-age" label="Age">
              <Input id="dossier-age" inputMode="decimal" value={formState.body.age}
                onChange={(e) => setBody("age", e.target.value)} placeholder="e.g. 34" />
            </Field>
            <Field id="dossier-age-unit" label="Age Is In">
              <Select value={formState.body.ageUnit} onValueChange={(v) => setBody("ageUnit", v === "local" ? "local" : "standard")}>
                <SelectTrigger id="dossier-age-unit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard years (365.25 d)</SelectItem>
                  <SelectItem value="local">Homeworld years</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Readout label="Native gravity" value={body.nativeG !== null ? fmt(body.nativeG) : null} unit="g"
              note={narrateNativeGravity(body.nativeG)} />
            <Readout label="Weight at home" value={body.weightAtHome ? fmt(body.weightAtHome.earthScaleKg) : null} unit="kg on an Earth scale"
              note={body.weightAtHome ? `${fmt(body.weightAtHome.newtons)} N` : undefined} />
            <Readout label="Age, standard years" value={body.ageStandard !== null ? fmt(body.ageStandard) : null} />
            <Readout label="Age, local years" value={body.ageLocal !== null ? fmt(body.ageLocal) : null}
              note={narrateLocalAge(body.ageStandard, body.ageLocal)} />
          </div>

          {otherWorlds.length > 0 && body.nativeG !== null && (
            <div className="space-y-2">
              <h4 className="font-heading text-sf-eyebrow uppercase text-t4">// Felt weight on other worlds on file</h4>
              <ul className="divide-y divide-sf-line-hairline border border-sf-line">
                {otherWorlds.map(({ sheet, g, ratio }) => (
                  <li key={sheet.id} className="grid gap-2 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
                    <Link to={toolHref("planetary-profile", worldId, sheet.id)}
                      className="min-h-hit inline-flex items-center font-sans text-t1 underline-offset-4 hover:text-sf-primary-text hover:underline">
                      {(sheet.title ?? "").trim() || "Untitled"}
                    </Link>
                    <span className="font-mono text-sm text-t2">
                      {fmt(g as number)} g · ×{fmt(ratio as number)}
                      {formState.body.massKg && ratio !== null && body.weightAtHome
                        ? ` · feels like ${fmt(body.weightAtHome.earthScaleKg * (ratio as number))} kg`
                        : ""}
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-magenta-text">
                      {narrateFeltWeight(ratio)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="mb-2 font-heading text-sf-eyebrow uppercase text-t4">// Inherited: physiology and homeworld</h4>
            <TraitList traits={group("body")} worldId={worldId} overrides={formState.overrides} onOverride={onOverride}
              narratives={{ gravityAdaptation: narrateNativeGravity(body.nativeG) }} />
          </div>
        </CollapsibleSection>

        {/* ── 4 · Senses ───────────────────────────────────────────── */}
        <CollapsibleSection id="senses" title="SENSES" levelNumber={4}
          subtitle="Inherited from the species' sensory profile. Override what this one individual lacks or exceeds.">
          <TraitList traits={group("senses")} worldId={worldId} overrides={formState.overrides} onOverride={onOverride} />
        </CollapsibleSection>

        {/* ── 5 · Beliefs ──────────────────────────────────────────── */}
        <CollapsibleSection id="beliefs" title="BELIEFS" levelNumber={5}
          subtitle="What they were raised to swear by, fear and refuse. Override where they broke faith.">
          <TraitList traits={group("beliefs")} worldId={worldId} overrides={formState.overrides} onOverride={onOverride} />
        </CollapsibleSection>

        {/* ── 6 · Psychology ───────────────────────────────────────── */}
        <CollapsibleSection id="psychology" title="PSYCHOLOGY" levelNumber={6}
          subtitle="Yours to decide. The world above bounds it; it does not write it.">
          <div className="grid gap-6 md:grid-cols-2">
            {PSYCHOLOGY_FIELDS.map((f) => (
              <Field key={f.key} id={`dossier-psych-${f.key}`} label={f.label}
                help={f.key === "values" && inherited("polityValues") ? `${f.help} Polity values on file: ${inherited("polityValues")}.` : f.help}>
                <Textarea id={`dossier-psych-${f.key}`} value={formState.psychology[f.key]}
                  onChange={(e) => setPsych(f.key, e.target.value)} placeholder={f.prompt} className="min-h-[96px]" />
              </Field>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── 7 · Voice ────────────────────────────────────────────── */}
        <CollapsibleSection id="voice" title="VOICE" levelNumber={7}
          subtitle="How they sound. Nothing here is generated; the lines are yours.">
          {(inherited("phonology") || formState.origins.language.name) && (
            <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">
              // NATIVE LANGUAGE: {formState.origins.language.name || "UNNAMED"}
              {inherited("phonology") ? ` · PHONOLOGY: ${inherited("phonology")}` : ""}
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <Field id="dossier-dialect" label="Dialect" help="Region, class and generation as heard in their speech.">
              <Textarea id="dossier-dialect" value={formState.voice.dialect} onChange={(e) => setVoice("dialect", e.target.value)}
                placeholder="Which variety of the native tongue, and what it marks them as" className="min-h-[96px]" />
            </Field>
            <Field id="dossier-idiolect" label="Idiolect" help="The habits that are theirs alone.">
              <Textarea id="dossier-idiolect" value={formState.voice.idiolect} onChange={(e) => setVoice("idiolect", e.target.value)}
                placeholder="Pet words, oaths, what they never say, how they end a sentence" className="min-h-[96px]" />
            </Field>
          </div>
          <Field id="dossier-lines" label="Sample Lines" help="Write a few lines in their voice. One per line.">
            <Textarea id="dossier-lines" value={formState.voice.sampleLines} onChange={(e) => setVoice("sampleLines", e.target.value)}
              placeholder="A line they would say under pressure. A line they would say to a child." className="min-h-[120px]" />
          </Field>
        </CollapsibleSection>

        {/* ── 8 · Relationships ────────────────────────────────────── */}
        <CollapsibleSection id="relationships" title="RELATIONSHIPS" levelNumber={8}
          subtitle="Typed links to other characters and entities. Mirrored to the world graph on save.">
          {formState.relationships.length === 0 && (
            <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">// NO RELATIONSHIPS ON FILE.</p>
          )}
          <ul className="space-y-4">
            {formState.relationships.map((r) => {
              const targetValue = r.targetId ? `${r.targetKind}:${r.targetId}` : NONE;
              const targetHref = r.targetKind === "dossier"
                ? toolHref(TOOL_TYPE, worldId, r.targetId)
                : worldId ? `/worlds/${worldId}/codex/${r.targetId}` : null;
              return (
                <li key={r.id} className="grid gap-3 border border-sf-line bg-sf-surface p-4 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                  <Field id={`rel-type-${r.id}`} label="Type">
                    <Select value={r.type} onValueChange={(v) => updateRel(r.id, { type: v as RelationshipType })}>
                      <SelectTrigger id={`rel-type-${r.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{RELATIONSHIP_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {r.type === "custom" && (
                      <Input aria-label="Custom relationship label" value={r.customLabel}
                        onChange={(e) => updateRel(r.id, { customLabel: e.target.value })} placeholder="e.g. Oath-sibling" />
                    )}
                  </Field>
                  <Field id={`rel-target-${r.id}`} label="With">
                    <Select
                      value={targetValue}
                      onValueChange={(v) => {
                        if (v === NONE) return updateRel(r.id, { targetId: "", targetName: "" });
                        const [kind, id] = [v.slice(0, v.indexOf(":")), v.slice(v.indexOf(":") + 1)];
                        if (kind === "dossier") {
                          const s = otherDossiers.find((d) => d.id === id);
                          updateRel(r.id, { targetKind: "dossier", targetId: id, targetName: (s?.title ?? "").trim() || "Untitled" });
                        } else {
                          const e = entityTargets.find((x) => x.id === id);
                          updateRel(r.id, { targetKind: "entry", targetId: id, targetName: e?.title ?? "Untitled" });
                        }
                      }}
                    >
                      <SelectTrigger id={`rel-target-${r.id}`}><SelectValue placeholder="Choose a character or entity" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Not chosen</SelectItem>
                        {otherDossiers.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>Dossiers</SelectLabel>
                            {otherDossiers.map((d) => (
                              <SelectItem key={d.id} value={`dossier:${d.id}`}>{(d.title ?? "").trim() || "Untitled"}</SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        {entityTargets.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>Codex entities</SelectLabel>
                            {entityTargets.map((e) => (
                              <SelectItem key={e.id} value={`entry:${e.id}`}>{e.title}</SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                    {r.targetId && targetHref && (
                      <Link to={targetHref} className="inline-flex min-h-hit items-center font-mono text-[12px] uppercase tracking-[0.10em] text-sf-primary-text underline-offset-4 hover:underline">
                        Open {r.targetName || "record"}
                      </Link>
                    )}
                  </Field>
                  <Field id={`rel-note-${r.id}`} label="Note">
                    <Input id={`rel-note-${r.id}`} value={r.note} onChange={(e) => updateRel(r.id, { note: e.target.value })}
                      placeholder="What is between them" />
                  </Field>
                  <Button type="button" variant="sf-ghost" size="icon" aria-label={`Remove relationship with ${r.targetName || "unchosen target"}`}
                    onClick={() => patch("relationships", formState.relationships.filter((x) => x.id !== r.id))}>
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
          <Button type="button" variant="sf-ghost" size="sf-sm"
            onClick={() => patch("relationships", [
              ...formState.relationships,
              { id: newId(), type: "ally", customLabel: "", targetKind: "dossier", targetId: "", targetName: "", note: "", connectionId: null },
            ])}>
            <Plus aria-hidden />
            Add Relationship
          </Button>
          {otherDossiers.length === 0 && entityTargets.length === 0 && (
            <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">
              // NO OTHER CHARACTERS OR ENTITIES ON FILE. SAVE ANOTHER DOSSIER TO LINK THEM.
            </p>
          )}
        </CollapsibleSection>

        {/* ── 9 · Arc ──────────────────────────────────────────────── */}
        <CollapsibleSection id="arc" title="ARC" levelNumber={9}
          subtitle="Beats bound to events in the world's Chronicle, in story order.">
          {formState.arc.length === 0 && (
            <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">// NO ARC BEATS ON FILE.</p>
          )}
          <ol className="space-y-4">
            {formState.arc.map((b, i) => (
              <li key={b.id} className="grid gap-3 border border-sf-line bg-sf-surface p-4 md:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-start">
                <span className="font-mono text-sm text-sf-magenta-text" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <Field id={`beat-event-${b.id}`} label="Chronicle Event">
                  <Select
                    value={b.eventId ?? NONE}
                    onValueChange={(v) => {
                      const ev = events.find((e) => e.id === v);
                      updateBeat(b.id, ev ? { eventId: ev.id, eventLabel: eventLabel(ev) } : { eventId: null, eventLabel: "" });
                    }}
                  >
                    <SelectTrigger id={`beat-event-${b.id}`}><SelectValue placeholder="Bind to an event" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not bound</SelectItem>
                      {events.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{eventLabel(e)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {b.eventId && !events.some((e) => e.id === b.eventId) && events.length > 0 && (
                    <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-crimson-text">
                      // BOUND EVENT NOT FOUND: {b.eventLabel || "UNKNOWN"}. REBIND.
                    </p>
                  )}
                </Field>
                <Field id={`beat-note-${b.id}`} label="What Happens To Them">
                  <Textarea id={`beat-note-${b.id}`} value={b.note} onChange={(e) => updateBeat(b.id, { note: e.target.value })}
                    placeholder="What this event takes from them, or gives" className="min-h-[72px]" />
                </Field>
                <Button type="button" variant="sf-ghost" size="icon" aria-label={`Remove beat ${i + 1}`}
                  onClick={() => patch("arc", formState.arc.filter((x) => x.id !== b.id))}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="sf-ghost" size="sf-sm"
              onClick={() => patch("arc", [...formState.arc, { id: newId(), eventId: null, eventLabel: "", note: "" }])}>
              <Plus aria-hidden />
              Add Beat
            </Button>
            {worldId && (
              <Link to={`/worlds/${worldId}/chronicle`} className="inline-flex min-h-hit items-center font-mono text-[12px] uppercase tracking-[0.10em] text-sf-primary-text underline-offset-4 hover:underline">
                {events.length === 0 ? "// No Chronicle events on file. Open the Chronicle." : "Open the Chronicle"}
              </Link>
            )}
          </div>
        </CollapsibleSection>

        {/* ── 10 · Notes ───────────────────────────────────────────── */}
        <CollapsibleSection id="notes" title="NOTES" levelNumber={10}
          subtitle="Anything else. Kept with the dossier; not surfaced as a fact.">
          <Textarea aria-label="Notes" value={formState.generalNotes} onChange={(e) => patch("generalNotes", e.target.value)}
            placeholder="Scratch, questions, what you have not decided yet" className="min-h-[120px]" />
          {worldId && (
            <p className="font-sans text-sm text-t3 sf-measure">
              Saved dossiers reach the{" "}
              <Link to={`/worlds/${worldId}/write`} className="text-sf-primary-text underline-offset-4 hover:underline">Studio</Link>
              : their facts appear in the Refs and Check tabs with the tool each value came from, and the character becomes a Codex entity you can @mention.
            </p>
          )}
          {currentWorksheetId && (
            <Button type="button" variant="sf-ghost" size="sf-sm" onClick={handleNew}>
              <Plus aria-hidden />
              New Dossier
            </Button>
          )}
        </CollapsibleSection>
      </div>

      {/* Sidebar */}
      <ToolSidebar>
        <SectionNavigation sections={SECTIONS} mode="inline" />
        <KeyChoicesSidebar sections={keyChoices} title="Dossier Summary" mode="inline" />
      </ToolSidebar>
      <div className="no-print fixed bottom-4 right-4 z-40 flex flex-col gap-2 xl:hidden">
        <MobileSectionNav sections={SECTIONS} />
        <MobileKeyChoices sections={keyChoices} title="Dossier Summary" />
      </div>

      {/* Dialogs */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={currentWorld?.name}
          toolType={TOOL_TYPE}
          toolDisplayName="Dossier"
          worksheets={worksheetsByType || []}
          isLoading={false}
          onSelect={(selectedId) => {
            setSearchParams({ worldId, worksheetId: selectedId });
            setWorksheetSelectorOpen(false);
          }}
          onCreate={async (name) => {
            const fresh = createEmptyDossier();
            fresh.identity.name = name;
            const result = await createWorksheet.mutateAsync({
              worldId, toolType: TOOL_TYPE, title: name, data: fresh as unknown as Json,
            });
            loadWorksheet({ id: result.id, title: result.title, data: fresh as unknown as Json });
            setSearchParams({ worldId, worksheetId: result.id });
            return result.id;
          }}
        />
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Dossier"
        worldName={currentWorld?.name}
        worksheetTitle={formState.identity.name || undefined}
        formState={exportState}
        summaryTemplate={<DossierSummaryTemplate formState={exportState as unknown as Record<string, unknown>} worldName={currentWorld?.name} />}
        fullTemplate={<DossierSummaryTemplate formState={exportState as unknown as Record<string, unknown>} worldName={currentWorld?.name} />}
        defaultFilename={`dossier-${(formState.identity.name || "character").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      />

      {currentWorksheetId && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          entityType="worksheet"
          entityId={currentWorksheetId}
          entityTitle={currentWorksheetTitle || "Dossier"}
        />
      )}

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default Dossier;
