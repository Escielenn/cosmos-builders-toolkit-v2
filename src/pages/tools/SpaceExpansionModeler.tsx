import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";
const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, {
  MobileSectionNav,
} from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, {
  KeyChoicesSection,
  MobileKeyChoices,
} from "@/components/tools/KeyChoicesSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import {
  SpaceExpansionSummaryTemplate,
  SpaceExpansionFullReportTemplate,
} from "@/lib/pdf/templates";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import {
  SPACE_EXPANSION_SECTIONS,
  FORCE_CATEGORIES,
  MODIFIER_TYPES,
  DEFAULT_PHASES,
  FORCE_DIRECTIONS,
  INTERACTION_TYPES,
  SEVERITY_OPTIONS,
  INFRASTRUCTURE_LEVELS,
  TRAJECTORY_OPTIONS,
  SF_EXPANSION_EXAMPLES,
  QUICK_START_TEMPLATES,
  SECTION_HELPERS,
  INITIAL_FORM_STATE,
  getForceDef,
  getModifierDef,
  getInteractionDef,
  getForceConfig,
  getConsequenceMatrix,
  createEmptyConsequenceMatrix,
  applyTemplate,
  generateForcePairs,
  type FormState,
  type ExpansionPhaseId,
  type ForceCategory,
  type ModifierNode,
  type ForceDirection,
  type InteractionResult,
} from "@/lib/space-expansion-data";

const TOOL_TYPE = "space-expansion-modeler";
const LOCAL_STORAGE_KEY = "space-expansion-worksheet";

const EditorSkeleton = () => (
  <div className="min-h-[120px] rounded-md border border-sf-border bg-background/50 animate-pulse" />
);

const PHASE_IDS: ExpansionPhaseId[] = [
  "earth-orbit",
  "luna",
  "mars",
  "belt",
  "outer",
  "interstellar",
];

const SpaceExpansionModeler = () => {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);
  const [selectedForcePhase, setSelectedForcePhase] = useState<ExpansionPhaseId>("earth-orbit");
  const [selectedMatrixPhase, setSelectedMatrixPhase] = useState<ExpansionPhaseId>("earth-orbit");
  const [templateConfirmId, setTemplateConfirmId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const { updateWorksheetTags } = useTags();

  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = useWorldId();
  const worksheetId = searchParams.get("worksheetId");

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  const entityMatch = useEntityMatch(worldId);
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: entityMatch.check,
  });
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);

  // ── Effects ──────────────────────────────────────────────────────

  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet.tags) {
          setWorksheetTags(existingWorksheet.tags);
        }
        toast({ title: "Worksheet Loaded", description: "WORK RESTORED." });
      } catch { /* ignore */ }
    }
  }, [existingWorksheet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try { setFormState(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
  }, [worldId, worksheetId]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleSave = async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));
    if (worldId && user) {
      const worksheetData = formState as unknown as Json;
      try {
        if (currentWorksheetId || worksheetId) {
          await updateWorksheet.mutateAsync({
            worksheetId: currentWorksheetId || worksheetId!,
            data: worksheetData,
          });
        } else {
          toast({ title: "OPERATION FAILED.", description: "SELECT OR CREATE A WORKSHEET BEFORE TRANSMITTING.", variant: "destructive" });
        }
      } catch { /* handled by mutation */ }
    } else {
      toast({ title: "Draft Saved", description: "WORK SECURED TO LOCAL STORAGE." });
    }
  };

  const handleExport = () => setExportDialogOpen(true);
  const handlePrint = () => window.print();

  const handleWorksheetSelect = (id: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: id });
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const data = INITIAL_FORM_STATE as unknown as Json;
    const result = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data,
    });
    setCurrentWorksheetId(result.id);
    setCurrentWorksheetTitle(result.title);
    setSearchParams({ worldId: worldId!, worksheetId: result.id });
    return result.id;
  };

  const handleRename = async (newTitle: string) => {
    const wsId = currentWorksheetId || worksheetId;
    if (!wsId) return;
    await renameWorksheet.mutateAsync({ worksheetId: wsId, title: newTitle });
    setCurrentWorksheetTitle(newTitle);
  };

  const handleTagsChange = (newTags: string[]) => {
    setWorksheetTags(newTags);
    const wsId = currentWorksheetId || worksheetId;
    if (wsId) {
      updateWorksheetTags.mutate({ worksheetId: wsId, tags: newTags });
    }
  };

  // ── Form Updaters ────────────────────────────────────────────────

  const updateFoundation = (field: keyof FormState["foundation"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      foundation: { ...prev.foundation, [field]: value },
    }));
  };

  const updatePhase = (phaseId: ExpansionPhaseId, field: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const updateForce = (phaseId: ExpansionPhaseId, forceCategory: ForceCategory, field: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      forces: prev.forces.map((f) =>
        f.phaseId === phaseId && f.forceCategory === forceCategory
          ? { ...f, [field]: value }
          : f
      ),
    }));
  };

  const addModifier = () => {
    const newMod: ModifierNode = {
      id: crypto.randomUUID(),
      name: "",
      type: "wall",
      affectedPhases: [],
      affectedForces: [],
      yearOccurred: "",
      description: "",
      impact: "",
      severity: "",
      resolution: "",
    };
    setFormState((prev) => ({ ...prev, modifiers: [...prev.modifiers, newMod] }));
  };

  const removeModifier = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      modifiers: prev.modifiers.filter((m) => m.id !== id),
    }));
  };

  const updateModifier = (id: string, field: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      modifiers: prev.modifiers.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  const toggleModifierPhase = (modId: string, phaseId: ExpansionPhaseId) => {
    setFormState((prev) => ({
      ...prev,
      modifiers: prev.modifiers.map((m) => {
        if (m.id !== modId) return m;
        const has = m.affectedPhases.includes(phaseId);
        return {
          ...m,
          affectedPhases: has
            ? m.affectedPhases.filter((p) => p !== phaseId)
            : [...m.affectedPhases, phaseId],
        };
      }),
    }));
  };

  const toggleModifierForce = (modId: string, forceId: ForceCategory) => {
    setFormState((prev) => ({
      ...prev,
      modifiers: prev.modifiers.map((m) => {
        if (m.id !== modId) return m;
        const has = m.affectedForces.includes(forceId);
        return {
          ...m,
          affectedForces: has
            ? m.affectedForces.filter((f) => f !== forceId)
            : [...m.affectedForces, forceId],
        };
      }),
    }));
  };

  const updateConsequenceCell = (
    phaseId: ExpansionPhaseId,
    forceA: ForceCategory,
    forceB: ForceCategory,
    field: "interaction" | "description" | "narrativeHook",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      consequenceMatrices: prev.consequenceMatrices.map((matrix) => {
        if (matrix.phaseId !== phaseId) return matrix;
        return {
          ...matrix,
          cells: matrix.cells.map((cell) => {
            if (
              (cell.forceA === forceA && cell.forceB === forceB) ||
              (cell.forceA === forceB && cell.forceB === forceA)
            ) {
              return { ...cell, [field]: value };
            }
            return cell;
          }),
        };
      }),
    }));
  };

  const updateSynthesis = (field: keyof FormState["synthesis"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const handleApplyTemplate = (templateId: string) => {
    const hasData = formState.foundation.expansionName || formState.modifiers.length > 0;
    if (hasData) {
      setTemplateConfirmId(templateId);
    } else {
      setFormState(applyTemplate(templateId));
      toast({ title: "Template Applied", description: "You can now customize the expansion model." });
    }
  };

  const confirmApplyTemplate = () => {
    if (templateConfirmId) {
      setFormState(applyTemplate(templateConfirmId));
      setTemplateConfirmId(null);
      toast({ title: "Template Applied", description: "Previous data has been replaced." });
    }
  };

  // ── Derived Data ─────────────────────────────────────────────────

  const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, "").trim();

  const reachedPhases = formState.phases.filter((p) => p.reached);
  const reachedCount = reachedPhases.length;

  const forcePairs = useMemo(() => generateForcePairs(), []);

  const currentMatrix = useMemo(
    () => getConsequenceMatrix(formState.consequenceMatrices, selectedMatrixPhase),
    [formState.consequenceMatrices, selectedMatrixPhase]
  );

  // Ensure matrix exists for selected phase
  useEffect(() => {
    if (!currentMatrix) {
      setFormState((prev) => ({
        ...prev,
        consequenceMatrices: [
          ...prev.consequenceMatrices,
          createEmptyConsequenceMatrix(selectedMatrixPhase),
        ],
      }));
    }
  }, [currentMatrix, selectedMatrixPhase]);

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const dominantLabel = formState.synthesis.dominantForce
      ? getForceDef(formState.synthesis.dominantForce as ForceCategory)?.name
      : undefined;
    const trajectoryLabel = TRAJECTORY_OPTIONS.find(
      (t) => t.value === formState.synthesis.overallTrajectory
    )?.label;

    return [
      {
        id: "section-foundation",
        title: "Foundation",
        choices: [
          { label: "Name", value: formState.foundation.expansionName || undefined },
          { label: "Start Year", value: formState.foundation.startYear || undefined },
          { label: "Origin", value: formState.foundation.originCivilization || undefined },
        ],
      },
      {
        id: "section-phases",
        title: "Progress",
        choices: [
          { label: "Phases Reached", value: reachedCount > 0 ? `${reachedCount}/6` : undefined },
          { label: "Furthest", value: reachedPhases.length > 0 ? reachedPhases[reachedPhases.length - 1].name : undefined },
        ],
      },
      {
        id: "section-modifiers",
        title: "Modifiers",
        choices: [
          { label: "Count", value: formState.modifiers.length > 0 ? `${formState.modifiers.length} defined` : undefined },
        ],
      },
      {
        id: "section-synthesis",
        title: "Synthesis",
        choices: [
          { label: "Dominant Force", value: dominantLabel },
          { label: "Trajectory", value: trajectoryLabel },
        ],
      },
    ];
  }, [formState, reachedCount, reachedPhases]);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={handlePrint}
      onExport={handleExport}
      onShare={currentWorksheetId || worksheetId ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      isSaving={updateWorksheet.isPending}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Exodus"
          worldName={worldName || undefined}
          formState={formState}
          summaryTemplate={<SpaceExpansionSummaryTemplate formState={formState} worldName={worldName || undefined} />}
          fullTemplate={<SpaceExpansionFullReportTemplate formState={formState} worldName={worldName || undefined} />}
          defaultFilename="space-expansion"
        />
      }
      worksheetId={currentWorksheetId || worksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={handleRename}
      worksheetLoading={worksheetLoading}
      worksheetTags={worksheetTags}
      onTagsChange={handleTagsChange}
      isLoggedIn={!!user}
    >
        {/* Intro Panel */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] mb-4 gradient-text">
            The Expansion Dynamics Framework
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "One 'what if?' Follow the ripples. Over time, you get to a full world that fits well together."
            <span className="block text-sm text-t3 mt-1">, Adrian Tchaikovsky</span>
          </blockquote>
          <p className="text-t2 mb-4">
            Space expansion is not a linear march outward. It pulses, stalls, redirects, and sometimes retreats based on the interaction of multiple forces. This tool helps you model those dynamics systematically, revealing consequences and story hooks you hadn't considered.
          </p>
          <div className="text-sm text-t3">
            <strong className="text-t1">The Cascade:</strong>
            <p className="mt-1">
              Resources shape industry. Industry shapes economy. Economy shapes politics. Politics shapes expansion. Each phase emerges from the interplay of six force categories, modified by walls, catalysts, gaps, and barriers.
            </p>
          </div>
        </GlassPanel>

        {/* Main Content Grid */}
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── SF Examples ── */}
            <CollapsibleSection
              id="section-examples"
              title="SF Examples"
              thinkLike="a reader: what stories model these dynamics?"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.examples}
              </p>
              <div className="space-y-2">
                {SF_EXPANSION_EXAMPLES.map((ex) => (
                  <Collapsible key={ex.name}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-between w-full text-left px-3 py-2 rounded-none bg-background/50 hover:bg-background/80 transition-colors text-sm"
                      >
                        <span>
                          <strong className="text-t1">{ex.name}</strong>
                          <span className="text-t2 ml-2">, {ex.source}</span>
                        </span>
                        <ChevronDown className="w-4 h-4 text-t2 shrink-0" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 py-2 text-sm text-t3 space-y-2">
                        <p><strong className="text-t1">Model:</strong> {ex.model}</p>
                        <p><strong className="text-t1">Dominant Forces:</strong> {ex.dominantForces}</p>
                        <p><strong className="text-t1">Consequence:</strong> {ex.consequence}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CollapsibleSection>

            {/* ── Quick-Start Templates ── */}
            <CollapsibleSection
              id="section-templates"
              title="Quick-Start Templates"
              thinkLike="an architect: choose a blueprint to customize"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.templates}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {QUICK_START_TEMPLATES.map((tmpl) => (
                  <GlassPanel key={tmpl.id} className="p-4 hover:border-primary/30 transition-colors">
                    <h4 className="font-heading font-medium text-sm mb-1">{tmpl.name}</h4>
                    <p className="text-xs text-primary mb-2">{tmpl.tagline}</p>
                    <p className="text-xs text-t4 mb-3">{tmpl.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-t2 italic">{tmpl.reference}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleApplyTemplate(tmpl.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </CollapsibleSection>

            {/* ── Section 1: Foundation ── */}
            <CollapsibleSection
              id="section-foundation"
              title="Foundation"
              levelNumber={1}
              thinkLike="a mission planner: what's the starting point?"
              defaultOpen
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.foundation}
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expansion Scenario Name</Label>
                    <Input
                      value={formState.foundation.expansionName}
                      onChange={(e) => updateFoundation("expansionName", e.target.value)}
                      placeholder="e.g., The Corporate Frontier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Year</Label>
                    <Input
                      value={formState.foundation.startYear}
                      onChange={(e) => updateFoundation("startYear", e.target.value)}
                      placeholder="e.g., 2080"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Origin Civilization</Label>
                  <Input
                    value={formState.foundation.originCivilization}
                    onChange={(e) => updateFoundation("originCivilization", e.target.value)}
                    placeholder="e.g., United Earth, Corporate Consortium, Theocratic Alliance"
                  />
                </div>
                <div className="space-y-2">
                  <Label>The One Big Lie (Physics Departure)</Label>
                  <p className="text-xs text-t4">
                    What single physics departure makes this expansion possible?
                  </p>
                  <Suspense fallback={<EditorSkeleton />}>
                    <RichTextEditor
                      content={formState.foundation.oneBigLie}
                      onChange={(v) => updateFoundation("oneBigLie", v)}
                      placeholder="e.g., Practical aneutronic fusion makes interplanetary travel economically viable..."
                      minHeight="100px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
                <div className="space-y-2">
                  <Label>Starting Conditions</Label>
                  <p className="text-xs text-t4">
                    What's the state of civilization when expansion begins?
                  </p>
                  <Suspense fallback={<EditorSkeleton />}>
                    <RichTextEditor
                      content={formState.foundation.startingConditions}
                      onChange={(v) => updateFoundation("startingConditions", v)}
                      placeholder="Describe the political, economic, and social conditions at the start..."
                      minHeight="120px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
              </div>
            </CollapsibleSection>

            {/* ── Section 2: Expansion Phases ── */}
            <CollapsibleSection
              id="section-phases"
              title="Expansion Phases"
              levelNumber={2}
              thinkLike="a historian: what milestones mark each era?"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.phases}
              </p>
              <div className="space-y-4">
                {formState.phases.map((phase, idx) => {
                  const phaseDef = DEFAULT_PHASES.find((d) => d.id === phase.id);
                  return (
                    <div key={phase.id} className="relative">
                      {idx > 0 && (
                        <div className="absolute -top-4 left-6 w-px h-4 bg-border" />
                      )}
                      <GlassPanel className={`p-4 ${phase.reached ? "border-primary/30" : "opacity-60"}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-mono ${phase.reached ? "bg-primary/20 text-primary" : "bg-muted text-t2"}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <Input
                              value={phase.name}
                              onChange={(e) => updatePhase(phase.id, "name", e.target.value)}
                              className="font-heading font-medium h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`reached-${phase.id}`} className="text-xs text-t4">
                              Reached
                            </Label>
                            <Switch
                              id={`reached-${phase.id}`}
                              checked={phase.reached}
                              onCheckedChange={(v) => updatePhase(phase.id, "reached", v)}
                            />
                          </div>
                        </div>
                        {phaseDef && (
                          <p className="text-xs text-t4 mb-3 ml-11">
                            {phaseDef.description}
                          </p>
                        )}
                        {phase.reached && (
                          <div className="ml-11 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Year Reached</Label>
                                <Input
                                  value={phase.yearReached}
                                  onChange={(e) => updatePhase(phase.id, "yearReached", e.target.value)}
                                  placeholder="e.g., 2090"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Infrastructure</Label>
                                <Select
                                  value={phase.infrastructureLevel}
                                  onValueChange={(v) => updatePhase(phase.id, "infrastructureLevel", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INFRASTRUCTURE_LEVELS.map((l) => (
                                      <SelectItem key={l.value} value={l.value}>
                                        {l.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Population</Label>
                                <Input
                                  value={phase.population}
                                  onChange={(e) => updatePhase(phase.id, "population", e.target.value)}
                                  placeholder="e.g., 50,000"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Key Milestone</Label>
                              <Input
                                value={phase.milestone}
                                onChange={(e) => updatePhase(phase.id, "milestone", e.target.value)}
                                placeholder="What event marks reaching this phase?"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Self-Sufficiency ({phase.selfSufficiency}%)</Label>
                              <Slider
                                value={[phase.selfSufficiency]}
                                onValueChange={([v]) => updatePhase(phase.id, "selfSufficiency", v)}
                                max={100}
                                step={5}
                                className="mt-1"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Description</Label>
                              <Suspense fallback={<EditorSkeleton />}>
                                <RichTextEditor
                                  content={phase.description}
                                  onChange={(v) => updatePhase(phase.id, "description", v)}
                                  placeholder="Describe what this phase looks like..."
                                  minHeight="80px"
                                  className="bg-background/50"
                                />
                              </Suspense>
                            </div>
                          </div>
                        )}
                      </GlassPanel>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* ── Section 3: Force Configuration ── */}
            <CollapsibleSection
              id="section-forces"
              title="Force Configuration"
              levelNumber={3}
              thinkLike="a strategic analyst: what's pushing and pulling?"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.forces}
              </p>

              {/* Phase selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {formState.phases.map((phase) => (
                  <Button
                    key={phase.id}
                    variant={selectedForcePhase === phase.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedForcePhase(phase.id)}
                    className="text-xs"
                    disabled={!phase.reached}
                  >
                    {phase.name}
                    {phase.reached && <span className="ml-1 text-[12px] opacity-60">●</span>}
                  </Button>
                ))}
              </div>

              {/* Force cards for selected phase */}
              <div className="space-y-4">
                {FORCE_CATEGORIES.map((forceDef) => {
                  const force = getForceConfig(formState.forces, selectedForcePhase, forceDef.id);
                  if (!force) return null;
                  return (
                    <GlassPanel key={forceDef.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: forceDef.hex }} />
                        <h4 className={`font-heading font-medium text-sm ${forceDef.tailwindColor}`}>
                          {forceDef.name}
                        </h4>
                        <span className="text-xs text-t4 ml-auto font-mono">
                          {force.intensity}%
                        </span>
                      </div>
                      <p className="text-xs text-t4 mb-3 italic">
                        {forceDef.thinkLike}
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Intensity</Label>
                          <Slider
                            value={[force.intensity]}
                            onValueChange={([v]) => updateForce(selectedForcePhase, forceDef.id, "intensity", v)}
                            max={100}
                            step={5}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Direction</Label>
                          <div className="flex gap-2">
                            {FORCE_DIRECTIONS.map((dir) => (
                              <Button
                                key={dir.value}
                                variant={force.direction === dir.value ? "default" : "outline"}
                                size="sm"
                                className="text-xs flex-1"
                                onClick={() => updateForce(selectedForcePhase, forceDef.id, "direction", dir.value)}
                              >
                                {dir.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Key Actors</Label>
                          <Input
                            value={force.keyActors}
                            onChange={(e) => updateForce(selectedForcePhase, forceDef.id, "keyActors", e.target.value)}
                            placeholder="Who embodies this force?"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Suspense fallback={<EditorSkeleton />}>
                            <RichTextEditor
                              content={force.description}
                              onChange={(v) => updateForce(selectedForcePhase, forceDef.id, "description", v)}
                              placeholder={`What is the ${forceDef.name.toLowerCase()} force doing at this phase?`}
                              minHeight="80px"
                              className="bg-background/50"
                            />
                          </Suspense>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dependencies</Label>
                          <Input
                            value={force.dependencies}
                            onChange={(e) => updateForce(selectedForcePhase, forceDef.id, "dependencies", e.target.value)}
                            placeholder="What does this force depend on?"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* ── Section 4: Expansion Modifiers ── */}
            <CollapsibleSection
              id="section-modifiers"
              title="Expansion Modifiers"
              levelNumber={4}
              thinkLike="a crisis analyst: what accelerates, blocks, or redirects?"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.modifiers}
              </p>

              <div className="space-y-4">
                {formState.modifiers.map((mod) => {
                  const modDef = getModifierDef(mod.type);
                  return (
                    <GlassPanel key={mod.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-mono uppercase tracking-wider ${modDef.color}`}>
                          {modDef.name}
                        </span>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-t2 hover:text-sf-crimson"
                          onClick={() => removeModifier(mod.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={mod.name}
                              onChange={(e) => updateModifier(mod.id, "name", e.target.value)}
                              placeholder="e.g., Kessler Syndrome"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={mod.type}
                              onValueChange={(v) => updateModifier(mod.id, "type", v)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MODIFIER_TYPES.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name}, {t.description.slice(0, 50)}...
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Year</Label>
                            <Input
                              value={mod.yearOccurred}
                              onChange={(e) => updateModifier(mod.id, "yearOccurred", e.target.value)}
                              placeholder="e.g., 2045"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Severity</Label>
                            <Select
                              value={mod.severity}
                              onValueChange={(v) => updateModifier(mod.id, "severity", v)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                {SEVERITY_OPTIONS.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Impact Summary</Label>
                            <Input
                              value={mod.impact}
                              onChange={(e) => updateModifier(mod.id, "impact", e.target.value)}
                              placeholder="Brief summary of impact"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Affected Phases</Label>
                          <div className="flex flex-wrap gap-2">
                            {formState.phases.map((phase) => (
                              <label key={phase.id} className="flex items-center gap-1.5 text-xs">
                                <Checkbox
                                  checked={mod.affectedPhases.includes(phase.id)}
                                  onCheckedChange={() => toggleModifierPhase(mod.id, phase.id)}
                                />
                                {phase.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Affected Forces</Label>
                          <div className="flex flex-wrap gap-2">
                            {FORCE_CATEGORIES.map((f) => (
                              <label key={f.id} className="flex items-center gap-1.5 text-xs">
                                <Checkbox
                                  checked={mod.affectedForces.includes(f.id)}
                                  onCheckedChange={() => toggleModifierForce(mod.id, f.id)}
                                />
                                <span className={f.tailwindColor}>{f.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Suspense fallback={<EditorSkeleton />}>
                            <RichTextEditor
                              content={mod.description}
                              onChange={(v) => updateModifier(mod.id, "description", v)}
                              placeholder="Describe this modifier in detail..."
                              minHeight="80px"
                              className="bg-background/50"
                            />
                          </Suspense>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Resolution (if any)</Label>
                          <Input
                            value={mod.resolution}
                            onChange={(e) => updateModifier(mod.id, "resolution", e.target.value)}
                            placeholder="How was this overcome? Leave empty if unresolved."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </GlassPanel>
                  );
                })}

                <Button variant="outline" size="sm" onClick={addModifier} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Modifier
                </Button>
              </div>
            </CollapsibleSection>

            {/* ── Section 5: Consequence Matrix ── */}
            <CollapsibleSection
              id="section-matrix"
              title="Consequence Matrix"
              levelNumber={5}
              thinkLike="a systems analyst: how do forces interact?"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.matrix}
              </p>

              {/* Phase selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {formState.phases.map((phase) => (
                  <Button
                    key={phase.id}
                    variant={selectedMatrixPhase === phase.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMatrixPhase(phase.id)}
                    className="text-xs"
                    disabled={!phase.reached}
                  >
                    {phase.name}
                  </Button>
                ))}
              </div>

              {/* Matrix grid */}
              {currentMatrix && (
                <div className="space-y-3">
                  {forcePairs.map(({ forceA, forceB }) => {
                    const cell = currentMatrix.cells.find(
                      (c) =>
                        (c.forceA === forceA && c.forceB === forceB) ||
                        (c.forceA === forceB && c.forceB === forceA)
                    );
                    const defA = getForceDef(forceA);
                    const defB = getForceDef(forceB);
                    const interDef = cell?.interaction ? getInteractionDef(cell.interaction) : null;
                    return (
                      <GlassPanel key={`${forceA}-${forceB}`} className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium ${defA.tailwindColor}`}>{defA.name}</span>
                          <span className="text-xs text-t4">×</span>
                          <span className={`text-xs font-medium ${defB.tailwindColor}`}>{defB.name}</span>
                          {interDef && (
                            <Badge
                              variant="outline"
                              className="ml-auto text-[12px]"
                              style={{ borderColor: interDef.hex, color: interDef.hex }}
                            >
                              {interDef.label}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Select
                            value={cell?.interaction || ""}
                            onValueChange={(v) =>
                              updateConsequenceCell(
                                selectedMatrixPhase,
                                forceA,
                                forceB,
                                "interaction",
                                v as InteractionResult
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Interaction type" />
                            </SelectTrigger>
                            <SelectContent>
                              {INTERACTION_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.hex }} />
                                    {t.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={cell?.description || ""}
                            onChange={(e) =>
                              updateConsequenceCell(selectedMatrixPhase, forceA, forceB, "description", e.target.value)
                            }
                            placeholder="Brief explanation..."
                            className="h-8 text-xs"
                          />
                        </div>
                        {cell?.interaction && cell.interaction !== "neutral" && (
                          <Input
                            value={cell?.narrativeHook || ""}
                            onChange={(e) =>
                              updateConsequenceCell(selectedMatrixPhase, forceA, forceB, "narrativeHook", e.target.value)
                            }
                            placeholder="Story hook: What drama does this create?"
                            className="h-8 text-xs mt-2"
                          />
                        )}
                      </GlassPanel>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            {/* ── Synthesis ── */}
            <CollapsibleSection
              id="section-synthesis"
              title="Synthesis"
              levelNumber={6}
              thinkLike="a storyteller: what narrative emerges?"
            >
              <p className="text-sm text-t3 italic mb-4">
                {SECTION_HELPERS.synthesis}
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dominant Force</Label>
                    <Select
                      value={formState.synthesis.dominantForce}
                      onValueChange={(v) => updateSynthesis("dominantForce", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Which force dominates?" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORCE_CATEGORIES.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.hex }} />
                              {f.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Overall Trajectory</Label>
                    <Select
                      value={formState.synthesis.overallTrajectory}
                      onValueChange={(v) => updateSynthesis("overallTrajectory", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How is expansion trending?" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRAJECTORY_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}, {t.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Biggest Tension Point</Label>
                  <Input
                    value={formState.synthesis.biggestTensionPoint}
                    onChange={(e) => updateSynthesis("biggestTensionPoint", e.target.value)}
                    placeholder="Where is the biggest conflict or friction in your expansion model?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Narrative Theme</Label>
                  <p className="text-xs text-t4">
                    What story does this expansion model tell? What's the human drama?
                  </p>
                  <Suspense fallback={<EditorSkeleton />}>
                    <RichTextEditor
                      content={formState.synthesis.narrativeTheme}
                      onChange={(v) => updateSynthesis("narrativeTheme", v)}
                      placeholder="The central narrative that emerges from your force configurations..."
                      minHeight="120px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
                <div className="space-y-2">
                  <Label>Story Hooks</Label>
                  <p className="text-xs text-t4">
                    What specific stories, conflicts, or character situations emerge from this model?
                  </p>
                  <Suspense fallback={<EditorSkeleton />}>
                    <RichTextEditor
                      content={formState.synthesis.storyHooks}
                      onChange={(v) => updateSynthesis("storyHooks", v)}
                      placeholder="Story questions and hooks generated by the force dynamics..."
                      minHeight="120px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* ── Desktop Sidebar ── */}
          <ToolSidebar>
            <SectionNavigation sections={SPACE_EXPANSION_SECTIONS} mode="inline" />
            <KeyChoicesSidebar sections={keyChoicesSections} title="Summary" mode="inline" />
          </ToolSidebar>
        </div>

        {/* Mobile nav */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={SPACE_EXPANSION_SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} title="Summary" />
        </div>
      {/* ── Sheets & Dialogs ── */}
      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        content={formState.generalNotes}
        onChange={(html) => setFormState((prev) => ({ ...prev, generalNotes: html }))}
      />
      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || "local"}
        images={formState.moodboard || []}
        onImagesChange={(images) => setFormState((prev) => ({ ...prev, moodboard: images }))}
      />
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Exodus"
        worldName={worldName || undefined}
        formState={formState}
        summaryTemplate={
          <SpaceExpansionSummaryTemplate
            formState={formState}
            worldName={worldName || undefined}
          />
        }
        fullTemplate={
          <SpaceExpansionFullReportTemplate
            formState={formState}
            worldName={worldName || undefined}
          />
        }
        defaultFilename="space-expansion"
      />
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        entityType="worksheet"
        entityId={currentWorksheetId || worksheetId || ""}
        entityTitle={currentWorksheetTitle || "Untitled Expansion Model"}
      />
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Exodus"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}

      {/* Template confirmation dialog */}
      <AlertDialog open={!!templateConfirmId} onOpenChange={(open) => !open && setTemplateConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current expansion model data with the template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApplyTemplate}>Apply Template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default SpaceExpansionModeler;
