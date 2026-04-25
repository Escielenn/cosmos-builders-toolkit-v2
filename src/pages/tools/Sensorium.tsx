import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Eye,
  ScanEye,
  Zap,
  AlertTriangle,
  Upload,
  X,
  Sun,
  Waves,
  FlaskConical,
  Magnet,
  Sparkles,
  Check,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, {
  KeyChoicesSection,
  MobileKeyChoices,
} from "@/components/tools/KeyChoicesSidebar";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import WorksheetLinkSelector from "@/components/tools/WorksheetLinkSelector";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, {
  Section,
  MobileSectionNav,
} from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import { motion } from "framer-motion";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import QuestionSection from "@/components/tools/QuestionSection";
import {
  SensoriumSummaryTemplate,
  SensoriumFullReportTemplate,
} from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { useTags } from "@/hooks/use-tags";
import { Json } from "@/integrations/supabase/types";

// Domain-specific imports
import type {
  SensoriumFormState,
  EnvironmentConfig,
} from "@/lib/sensorium/types";
import {
  SENSORIUM_SECTIONS,
  SECTION_GUIDANCE,
  MODALITIES,
  MODALITY_CATEGORIES,
  SPECTRAL_PRESETS,
  ATMOSPHERE_PRESETS,
  MEDIUM_OPTIONS,
  LIQUID_TYPE_OPTIONS,
  CONDUCTIVITY_OPTIONS,
  MAGNETIC_STRENGTH_OPTIONS,
  SEASONAL_VARIATION_OPTIONS,
  DEFAULT_FORM_STATE,
  HUMAN_SENSES,
  getModalityById,
} from "@/lib/sensorium/data";
import {
  deriveModalities,
  validateSelection,
  calculateMetabolicBudget,
  calculatePerceptionGaps,
  aggregateImplications,
  buildSensoriumCopyText,
} from "@/lib/sensorium/calculations";
import { pushSensoriumToWorksheets } from "@/lib/sensorium/push-to-worksheet";
import { generatePerceptualNarrative } from "@/lib/sensorium/perceptual-narrative";
import {
  LinkedWorksheetRef,
  getLinkConfigsForTool,
} from "@/lib/worksheet-links-config";

// UI components
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

// ─── Constants ────────────────────────────────────────────────────

const TOOL_TYPE = "sensorium";
const LOCAL_STORAGE_KEY = "sensorium-v1";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electromagnetic: <Sun className="h-3.5 w-3.5" />,
  mechanical: <Waves className="h-3.5 w-3.5" />,
  chemical: <FlaskConical className="h-3.5 w-3.5" />,
  "magnetic-thermal": <Magnet className="h-3.5 w-3.5" />,
  other: <Sparkles className="h-3.5 w-3.5" />,
};

const sections: Section[] = SENSORIUM_SECTIONS.map((s) => ({
  id: `section-${s.id}`,
  title: s.title,
}));

// ─── Component ────────────────────────────────────────────────────

const Sensorium = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const worldId = useWorldId();
  const worksheetId = searchParams.get("worksheetId");
  const { data: worlds = [] } = useWorlds();
  const currentWorld = worlds.find((w) => w.id === worldId);

  // State
  const [formState, setFormState] = useState<SensoriumFormState>(DEFAULT_FORM_STATE);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(worksheetId);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["section-environment"])
  );
  const [activeCategory, setActiveCategory] = useState<string>("electromagnetic");
  const [isPushing, setIsPushing] = useState(false);
  const [tutorialDismissed, setTutorialDismissed] = useState(
    () => localStorage.getItem("sf-sensorium-tutorial-seen") === "true"
  );

  // Worksheet hooks
  const entityMatch = useEntityMatch(worldId);
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: entityMatch.check,
  });
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();

  // Link configurations
  const linkConfigs = getLinkConfigsForTool(TOOL_TYPE);

  // ─── Effects ──────────────────────────────────────────────────

  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading]);

  useEffect(() => {
    if (existingWorksheet) {
      const wsData = existingWorksheet.data as Record<string, unknown> | null;
      if (wsData) {
        setFormState({ ...DEFAULT_FORM_STATE, ...wsData } as SensoriumFormState);
      }
      setCurrentWorksheetId(existingWorksheet.id);
      setCurrentWorksheetTitle(existingWorksheet.title);
      setWorksheetTags((existingWorksheet as Record<string, unknown>).tags as string[] || []);
    }
  }, [existingWorksheet]);

  useEffect(() => {
    if (!worldId && !worksheetId) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormState({ ...DEFAULT_FORM_STATE, ...parsed });
        }
      } catch (e) {
        console.error("Failed to load from localStorage", e);
      }
    }
  }, [worldId, worksheetId]);

  // ─── Computed Values ──────────────────────────────────────────

  const derivedResults = useMemo(
    () => deriveModalities(formState.environment),
    [formState.environment]
  );

  const metabolicBudget = useMemo(
    () => calculateMetabolicBudget(formState.finalSelection),
    [formState.finalSelection]
  );

  const perceptionGaps = useMemo(
    () => calculatePerceptionGaps(formState.finalSelection),
    [formState.finalSelection]
  );

  const implications = useMemo(
    () => aggregateImplications(formState.finalSelection),
    [formState.finalSelection]
  );

  const perceptualNarrative = useMemo(
    () =>
      formState.finalSelection.length > 0
        ? generatePerceptualNarrative(formState.finalSelection, formState.environment)
        : "",
    [formState.finalSelection, formState.environment]
  );

  const validationResult = useMemo(() => {
    if (formState.mode === "validate" && formState.selectedModalities.length > 0) {
      return validateSelection(formState.selectedModalities, formState.environment);
    }
    return null;
  }, [formState.mode, formState.selectedModalities, formState.environment]);

  // World name for exports
  const worldNameForExport = currentWorld?.name || "";

  // ─── Key Choices ──────────────────────────────────────────────

  const keyChoices: KeyChoicesSection[] = [
    {
      id: "environment",
      title: "Environment",
      choices: [
        {
          label: "Star",
          value: SPECTRAL_PRESETS.find((p) => p.id === formState.environment.star.preset)?.label || "Custom",
        },
        {
          label: "Atmosphere",
          value: ATMOSPHERE_PRESETS.find((p) => p.id === formState.environment.atmosphere.preset)?.label || "Custom",
        },
        { label: "Medium", value: MEDIUM_OPTIONS.find((m) => m.id === formState.environment.medium.type)?.label || formState.environment.medium.type },
      ],
    },
    {
      id: "senses",
      title: "Senses",
      choices: [
        { label: "Selected", value: `${formState.finalSelection.length} senses` },
        {
          label: "Budget",
          value: `${(metabolicBudget.totalCost * 100).toFixed(0)}%`,
        },
        {
          label: "Dominant",
          value: formState.perceptionProfile.dominantSense
            ? getModalityById(formState.perceptionProfile.dominantSense)?.name || "—"
            : "—",
        },
      ],
    },
  ];

  // ─── Handlers ─────────────────────────────────────────────────

  const updateEnvironment = (path: string, value: unknown) => {
    const scrollY = window.scrollY;
    setFormState((prev) => {
      const next = { ...prev, environment: { ...prev.environment } };
      const parts = path.split(".");
      let target: Record<string, unknown> = next.environment as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...(target[parts[i]] as Record<string, unknown>) };
        target = target[parts[i]] as Record<string, unknown>;
      }
      target[parts[parts.length - 1]] = value;
      return next;
    });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const handleStarPresetChange = (presetId: string) => {
    const preset = SPECTRAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      environment: {
        ...prev.environment,
        star: {
          preset: presetId,
          temperature: preset.temperature,
          peakWavelength: preset.peakWavelength,
          uvOutput: preset.uvOutput,
          luminosity: preset.luminosity,
        },
      },
    }));
  };

  const handleAtmospherePresetChange = (presetId: string) => {
    const preset = ATMOSPHERE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      environment: {
        ...prev.environment,
        atmosphere: {
          preset: presetId,
          hasAtmosphere: preset.hasAtmosphere,
          pressure: preset.pressure,
          opacity: preset.opacity,
        },
      },
    }));
  };

  const toggleFinalSelection = (modalityId: string) => {
    setFormState((prev) => {
      const current = prev.finalSelection;
      const next = current.includes(modalityId)
        ? current.filter((id) => id !== modalityId)
        : [...current, modalityId];
      return { ...prev, finalSelection: next };
    });
  };

  const toggleValidateSelection = (modalityId: string) => {
    setFormState((prev) => {
      const current = prev.selectedModalities;
      const next = current.includes(modalityId)
        ? current.filter((id) => id !== modalityId)
        : [...current, modalityId];
      return { ...prev, selectedModalities: next };
    });
  };

  const handleLinkedWorksheetChange = (
    key: "starSystem" | "planet" | "evoBio",
    ref: LinkedWorksheetRef | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      _linkedWorksheets: {
        ...prev._linkedWorksheets,
        [key]: ref,
      },
    }));
  };

  const handlePushToWorksheets = useCallback(async () => {
    setIsPushing(true);
    try {
      const result = await pushSensoriumToWorksheets(formState);
      if (result.updated.length > 0) {
        toast({ title: `Pushed to ${result.updated.length} worksheet(s)` });
      }
      if (result.errors.length > 0) {
        toast({
          title: "Some pushes failed",
          description: result.errors.join("; "),
          variant: "destructive",
        });
      }
      if (result.updated.length === 0 && result.errors.length === 0) {
        toast({ title: "No linked worksheets to push to" });
      }
    } catch {
      toast({ title: "Push failed", variant: "destructive" });
    } finally {
      setIsPushing(false);
    }
  }, [formState, toast]);

  const handleCopyResults = () => {
    const text = buildSensoriumCopyText(formState);
    navigator.clipboard.writeText(text);
    toast({ title: "COPIED TO CLIPBOARD." });
  };

  const handleSave = async () => {
    // Always save to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));
    } catch (e) {
      console.error("localStorage save failed", e);
    }

    if (!worldId || !user) {
      toast({ title: "Saved locally" });
      return;
    }

    const payload = {
      title: currentWorksheetTitle || "Untitled Sensorium",
      tool_type: TOOL_TYPE,
      data: formState as unknown as Json,
      world_id: worldId,
    };

    if (currentWorksheetId) {
      await updateWorksheet.mutateAsync({
        id: currentWorksheetId,
        updates: payload,
      });
    } else {
      const created = await createWorksheet.mutateAsync(payload);
      setCurrentWorksheetId(created.id);
      if (!currentWorksheetTitle) setCurrentWorksheetTitle(created.title);
    }
    toast({ title: "Saved to cloud" });
  };

  const handleWorksheetSelect = (ws: { id: string; title: string; data: unknown }) => {
    const wsData = ws.data as Record<string, unknown> | null;
    if (wsData) {
      setFormState({ ...DEFAULT_FORM_STATE, ...wsData } as SensoriumFormState);
    }
    setCurrentWorksheetId(ws.id);
    setCurrentWorksheetTitle(ws.title);
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (title: string) => {
    if (!worldId || !user) return;
    const created = await createWorksheet.mutateAsync({
      title,
      tool_type: TOOL_TYPE,
      data: DEFAULT_FORM_STATE as unknown as Json,
      world_id: worldId,
    });
    setFormState(DEFAULT_FORM_STATE);
    setCurrentWorksheetId(created.id);
    setCurrentWorksheetTitle(created.title);
    setWorksheetSelectorOpen(false);
  };

  const handleRename = async (newTitle: string) => {
    const id = currentWorksheetId || worksheetId;
    if (!id) return;
    await renameWorksheet.mutateAsync({ worksheetId: id, title: newTitle });
    setCurrentWorksheetTitle(newTitle);
  };

  const handleTagsChange = async (tags: string[]) => {
    setWorksheetTags(tags);
    const id = currentWorksheetId || worksheetId;
    if (id) {
      await updateWorksheetTags.mutateAsync({ worksheetId: id, tags });
    }
  };

  // ─── Keyboard Shortcuts ────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId, user, currentWorksheetId, formState]);

  const dismissTutorial = () => {
    setTutorialDismissed(true);
    localStorage.setItem("sf-sensorium-tutorial-seen", "true");
  };

  // ─── Render Helpers ───────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recommended": return "text-sf-cyan border-cyan-500/50 bg-cyan-500/10";
      case "possible": return "text-sf-amber border-amber-500/50 bg-amber-500/10";
      case "implausible": return "text-t2 border-border bg-muted/20 opacity-60";
      default: return "";
    }
  };

  const getBudgetColor = () => {
    if (metabolicBudget.overBudget) return "bg-red-500";
    if (metabolicBudget.totalCost > metabolicBudget.warningThreshold) return "bg-amber-500";
    return "bg-cyan-500";
  };

  // ─── Render ───────────────────────────────────────────────────

  if (worksheetLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      isSaving={updateWorksheet.isPending || createWorksheet.isPending}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={() => window.print()}
      onExport={() => setExportDialogOpen(true)}
      onShare={
        currentWorksheetId || worksheetId
          ? () => setShareDialogOpen(true)
          : undefined
      }
      isShared={!!shareConfig?.enabled}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Sensorium"
          worldName={worldNameForExport}
          worksheetTitle={currentWorksheetTitle || undefined}
          formState={formState}
          summaryTemplate={
            <SensoriumSummaryTemplate
              formState={formState}
              worldName={worldNameForExport}
            />
          }
          fullTemplate={
            <SensoriumFullReportTemplate
              formState={formState}
              worldName={worldNameForExport}
            />
          }
          defaultFilename="sensorium"
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
        {/* Main layout: sidebar + content */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <ToolSidebar>
            <SectionNavigation sections={sections} mode="inline" />
            <KeyChoicesSidebar sections={keyChoices} mode="inline" />
          </ToolSidebar>

          {/* Mobile Sidebars - Right side floating buttons */}
          <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
            <MobileSectionNav sections={sections} />
            <MobileKeyChoices sections={keyChoices} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Tutorial banner */}
            {!tutorialDismissed && (
              <GlassPanel className="p-4 flex items-start gap-3 border-l-2 border-l-primary/40">
                <div className="flex-1">
                  <p className="text-sm text-t2">
                    Start by selecting your environment, then choose sensory modalities. SENSORIUM will score their plausibility and budget.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissTutorial}
                  className="text-t4 hover:text-t2 transition-colors flex-shrink-0 mt-0.5"
                  aria-label="Dismiss tutorial"
                >
                  <X className="h-4 w-4" />
                </button>
              </GlassPanel>
            )}

            {/* ═══ Section 1: Environment ═══ */}
            <CollapsibleSection
              id="section-environment"
              title="Environment"
              levelNumber={1}
              guidance={SECTION_GUIDANCE.environment}
              defaultOpen
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-6">
                {/* Star Preset */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="cursor-help">Star Type</Label>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Spectral class determines peak light wavelength and UV output, shaping which visual senses evolve.
                      </TooltipContent>
                    </Tooltip>
                    <Select
                      value={formState.environment.star.preset}
                      onValueChange={handleStarPresetChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select star type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECTRAL_PRESETS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-t4">
                      Peak λ: {formState.environment.star.peakWavelength} nm · UV: {formState.environment.star.uvOutput} · {formState.environment.star.temperature} K
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="cursor-help">Atmosphere</Label>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Atmospheric pressure and opacity affect sound transmission, chemical senses, and light scattering.
                      </TooltipContent>
                    </Tooltip>
                    <Select
                      value={formState.environment.atmosphere.preset}
                      onValueChange={handleAtmospherePresetChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select atmosphere" />
                      </SelectTrigger>
                      <SelectContent>
                        {ATMOSPHERE_PRESETS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-t4">
                      {formState.environment.atmosphere.hasAtmosphere
                        ? `${formState.environment.atmosphere.pressure} atm · ${formState.environment.atmosphere.opacity}`
                        : "No atmosphere (vacuum)"}
                    </p>
                  </div>
                </div>

                {/* Medium & Conductivity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Medium</Label>
                    <Select
                      value={formState.environment.medium.type}
                      onValueChange={(v) => updateEnvironment("medium.type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIUM_OPTIONS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formState.environment.medium.type === "aquatic" && (
                    <div className="space-y-2">
                      <Label>Liquid Type</Label>
                      <Select
                        value={formState.environment.medium.liquidType || "water"}
                        onValueChange={(v) => updateEnvironment("medium.liquidType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LIQUID_TYPE_OPTIONS.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Conductivity</Label>
                    <Select
                      value={formState.environment.medium.conductivity}
                      onValueChange={(v) => updateEnvironment("medium.conductivity", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDUCTIVITY_OPTIONS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Magnetic Field & Lighting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassPanel className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Magnetic Field</Label>
                      <Switch
                        checked={formState.environment.magneticField.present}
                        onCheckedChange={(v) => updateEnvironment("magneticField.present", v)}
                      />
                    </div>
                    {formState.environment.magneticField.present && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Strength</Label>
                          <Select
                            value={formState.environment.magneticField.strength}
                            onValueChange={(v) => updateEnvironment("magneticField.strength", v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MAGNETIC_STRENGTH_OPTIONS.map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stability</Label>
                          <Select
                            value={formState.environment.magneticField.stability}
                            onValueChange={(v) => updateEnvironment("magneticField.stability", v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stable">Stable</SelectItem>
                              <SelectItem value="variable">Variable</SelectItem>
                              <SelectItem value="chaotic">Chaotic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </GlassPanel>

                  <GlassPanel className="p-4 space-y-3">
                    <Label>Lighting Conditions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Day/Night Cycle</span>
                        <Switch
                          checked={formState.environment.lighting.dayNightCycle}
                          onCheckedChange={(v) => updateEnvironment("lighting.dayNightCycle", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tidally Locked</span>
                        <Switch
                          checked={formState.environment.lighting.tidallyLocked}
                          onCheckedChange={(v) => updateEnvironment("lighting.tidallyLocked", v)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Seasonal Variation</Label>
                        <Select
                          value={formState.environment.lighting.seasonalVariation}
                          onValueChange={(v) => updateEnvironment("lighting.seasonalVariation", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEASONAL_VARIATION_OPTIONS.map((o) => (
                              <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </GlassPanel>
                </div>

                {/* Worksheet Links */}
                {worldId && (
                  <div className="pt-4 border-t border-sf-border">
                    <h4 className="text-sm font-medium mb-3">Link Worksheets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {linkConfigs.map((config) => (
                        <WorksheetLinkSelector
                          key={config.key}
                          worldId={worldId}
                          targetToolType={config.targetTool}
                          label={config.label}
                          description={config.description}
                          syncFields={config.syncFields}
                          value={formState._linkedWorksheets?.[config.key as keyof NonNullable<SensoriumFormState["_linkedWorksheets"]>]}
                          onChange={(ref) =>
                            handleLinkedWorksheetChange(
                              config.key as "starSystem" | "planet" | "evoBio",
                              ref
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Fine-Tuning Sliders */}
                <GlassPanel className="p-4 space-y-4 mt-2">
                  <h4 className="font-heading text-sm font-light uppercase tracking-[3px] text-emerald">
                    FINE-TUNING
                  </h4>
                  {(
                    [
                      ["atmosphericDensity", "Atmospheric Density"],
                      ["lightLevel", "Light Level"],
                      ["temperatureRange", "Temperature Range"],
                      ["conductivity", "Conductivity"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="cursor-help">{label}</Label>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {key === "atmosphericDensity" && "How dense is the atmosphere? Affects sound propagation and chemical senses."}
                            {key === "lightLevel" && "Ambient light level. Low values favor non-visual senses."}
                            {key === "temperatureRange" && "Range of temperatures the species encounters. Wider ranges favor thermoreception."}
                            {key === "conductivity" && "Electrical conductivity of the environment. High values enable electroreception."}
                          </TooltipContent>
                        </Tooltip>
                        <span className="font-mono text-xs text-t3">
                          {formState.environmentSliders?.[key] ?? 5}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[formState.environmentSliders?.[key] ?? 5]}
                        onValueChange={([v]) =>
                          setFormState((prev) => ({
                            ...prev,
                            environmentSliders: {
                              ...prev.environmentSliders!,
                              [key]: v,
                            },
                          }))
                        }
                        aria-label={label}
                      />
                    </div>
                  ))}
                </GlassPanel>
              </div>
            </CollapsibleSection>

            {/* ═══ Section 2: Sensory Palette ═══ */}
            <CollapsibleSection
              id="section-sensory-palette"
              title="Sensory Palette"
              levelNumber={2}
              guidance={SECTION_GUIDANCE["sensory-palette"]}
              defaultOpen
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-4">
                {/* Species name */}
                <div className="space-y-2">
                  <Label>Species Name</Label>
                  <Input
                    value={formState.speciesName}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, speciesName: e.target.value }))
                    }
                    placeholder="Name your species..."
                    className="text-lg"
                  />
                </div>

                {/* Mode toggle */}
                <Tabs
                  value={formState.mode}
                  onValueChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      mode: v as "derive" | "validate",
                    }))
                  }
                >
                  <TabsList className="grid w-full grid-cols-2 max-w-sm">
                    <TabsTrigger value="derive">
                      <ScanEye className="h-4 w-4 mr-2" />
                      Derive
                    </TabsTrigger>
                    <TabsTrigger value="validate">
                      <Check className="h-4 w-4 mr-2" />
                      Validate
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="derive" className="mt-4">
                    <div className="space-y-3 mb-4">
                      <p className="text-sm text-t3">
                        Based on your environment, each sense is scored for plausibility. <strong className="text-foreground">Click any card to add it to your species' final sensory suite.</strong> You can select implausible senses too—sometimes the best stories break the rules.
                      </p>
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-500/60" /> Recommended</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500/60" /> Possible</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-muted-foreground/40" /> Implausible</span>
                        <span className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border"><Check className="h-3 w-3 text-sf-emerald" /> Selected by you</span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="validate" className="mt-4">
                    <div className="space-y-3 mb-4">
                      <p className="text-sm text-t3">
                        Pick senses freely without environmental guidance, then validate them. <strong className="text-foreground">Click cards to select, then review plausibility scores below.</strong>
                      </p>
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-sf-amber" /> Selected for validation</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Category tabs */}
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="flex flex-wrap h-auto gap-1">
                    {MODALITY_CATEGORIES.map((cat) => (
                      <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="gap-1.5 text-xs"
                      >
                        {CATEGORY_ICONS[cat.id]}
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {MODALITY_CATEGORIES.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {MODALITIES.filter((m) => m.category === cat.id).map((mod) => {
                          const derived = derivedResults.find((d) => d.modality.id === mod.id);
                          const isInFinal = formState.finalSelection.includes(mod.id);
                          const isInValidate = formState.selectedModalities.includes(mod.id);
                          const status = derived?.status || "implausible";
                          const score = derived?.confidenceScore || 0;

                          const isSelected = isInFinal || isInValidate;

                          return (
                            <button
                              type="button"
                              key={mod.id}
                              onClick={() => {
                                if (formState.mode === "derive") {
                                  toggleFinalSelection(mod.id);
                                } else {
                                  toggleValidateSelection(mod.id);
                                }
                              }}
                              className={`relative p-3 rounded-lg border text-left transition-all hover:scale-[1.02] cursor-pointer ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/30"
                                  : getStatusColor(status)
                              }`}
                            >
                              {/* Selected indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <Check className="h-4 w-4 text-sf-emerald" />
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                <div
                                  className="w-2 h-2 mt-1.5 flex-shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium truncate pr-6">
                                    {mod.name}
                                  </h4>
                                  <p className="text-xs text-t4 line-clamp-2 mt-0.5">
                                    {mod.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 ${getStatusColor(status)}`}
                                    >
                                      {status} ({score})
                                    </Badge>
                                    <span className="text-[10px] text-t2">
                                      {mod.evolution.metabolicCost} cost
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Validation result */}
                {formState.mode === "validate" && validationResult && (
                  <GlassPanel className="p-4 mt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Validation Result: {validationResult.overallPlausibility}% plausible
                    </h4>
                    {validationResult.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-sf-amber flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {w}
                      </p>
                    ))}
                    {validationResult.conflictingSenses.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-t4 font-medium">Conflicts:</p>
                        {validationResult.conflictingSenses.map((c, i) => (
                          <p key={i} className="text-xs text-sf-crimson">
                            {getModalityById(c.a)?.name} ↔ {getModalityById(c.b)?.name}: {c.reason}
                          </p>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          finalSelection: [...prev.selectedModalities],
                          validationResult,
                        }));
                        toast({ title: "Selection accepted into final palette" });
                      }}
                    >
                      Accept into Final Selection
                    </Button>
                  </GlassPanel>
                )}
              </div>
            </CollapsibleSection>

            {/* ═══ Section 3: Metabolic Budget ═══ */}
            <CollapsibleSection
              id="section-metabolic-budget"
              title="Metabolic Budget"
              levelNumber={3}
              guidance={SECTION_GUIDANCE["metabolic-budget"]}
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-4">
                {/* Budget bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Total: <span className="font-bold">{(metabolicBudget.totalCost * 100).toFixed(0)}%</span>
                    </span>
                    <span className="text-t2">Max sustainable: 100%</span>
                  </div>
                  <div className="h-4 bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${getBudgetColor()}`}
                      style={{ width: `${Math.min(metabolicBudget.totalCost * 100, 100)}%` }}
                    />
                  </div>
                  {metabolicBudget.overBudget && (
                    <p className="text-xs text-sf-crimson flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Over budget—this sensory suite requires extraordinary metabolic justification.
                    </p>
                  )}
                  {!metabolicBudget.overBudget && metabolicBudget.totalCost > metabolicBudget.warningThreshold && (
                    <p className="text-xs text-sf-amber flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Approaching metabolic limit. Consider the energy demands on your species.
                    </p>
                  )}
                </div>

                {/* Per-sense breakdown */}
                {metabolicBudget.perSense.length > 0 && (
                  <div className="space-y-1">
                    {metabolicBudget.perSense.map((s) => (
                      <div key={s.modalityId} className="flex items-center gap-2 text-xs">
                        <div className="flex-1 truncate">{s.name}</div>
                        <div className="w-20 h-2 bg-muted overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${s.cost * 100}%` }}
                          />
                        </div>
                        <div className="w-10 text-right text-t2">
                          {(s.cost * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* ═══ Section 4: Perception Profile ═══ */}
            <CollapsibleSection
              id="section-perception-profile"
              title="Perception Profile"
              levelNumber={4}
              guidance={SECTION_GUIDANCE["perception-profile"]}
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-4">
                {formState.finalSelection.length > 0 && (
                  <div className="space-y-2">
                    <Label>Dominant Sense</Label>
                    <Select
                      value={formState.perceptionProfile.dominantSense}
                      onValueChange={(v) =>
                        setFormState((prev) => ({
                          ...prev,
                          perceptionProfile: {
                            ...prev.perceptionProfile,
                            dominantSense: v,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose the dominant sense" />
                      </SelectTrigger>
                      <SelectContent>
                        {formState.finalSelection.map((id) => {
                          const mod = getModalityById(id);
                          return mod ? (
                            <SelectItem key={id} value={id}>
                              {mod.name}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <QuestionSection
                  id="sensory-hierarchy"
                  label="Sensory Hierarchy"
                  prompts={[
                    "How does your species rank its senses? Which takes priority in conflict?",
                    "How does the dominant sense shape instinctive reactions?",
                  ]}
                  value={formState.perceptionProfile.sensoryHierarchy}
                  onChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      perceptionProfile: {
                        ...prev.perceptionProfile,
                        sensoryHierarchy: v,
                      },
                    }))
                  }
                />

                <QuestionSection
                  id="perception-notes"
                  label="Perception Notes"
                  prompts={[
                    "What does 'paying attention' feel like for this species?",
                    "How does sensory overload manifest?",
                  ]}
                  value={formState.perceptionProfile.perceptionNotes}
                  onChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      perceptionProfile: {
                        ...prev.perceptionProfile,
                        perceptionNotes: v,
                      },
                    }))
                  }
                />
              </div>
            </CollapsibleSection>

            {/* ═══ Section 5: Worldbuilding Implications ═══ */}
            <CollapsibleSection
              id="section-worldbuilding"
              title="Worldbuilding Implications"
              levelNumber={5}
              guidance={SECTION_GUIDANCE.worldbuilding}
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-6">
                {formState.finalSelection.length === 0 ? (
                  <p className="text-sm text-t3 italic">
                    Select senses in the Sensory Palette to see worldbuilding implications.
                  </p>
                ) : (
                  <>
                    {/* Auto-generated implication cards */}
                    {Object.entries(implications).map(([category, entries]) => {
                      if (entries.length === 0) return null;
                      const label = category.charAt(0).toUpperCase() + category.slice(1);
                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-sm font-medium text-primary">{label}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {entries.map((entry, i) => (
                              <GlassPanel key={i} className="p-3">
                                <p className="text-xs font-medium text-foreground">
                                  {entry.modalityName}
                                </p>
                                <p className="text-xs text-t4 mt-1">
                                  {entry.text}
                                </p>
                              </GlassPanel>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* User notes per category */}
                    <div className="space-y-4 pt-4 border-t border-sf-border">
                      <h4 className="text-sm font-medium">Your Worldbuilding Notes</h4>
                      {(
                        [
                          ["communicationNotes", "Communication", ["How does this species communicate? What's conversation like?"]],
                          ["artNotes", "Art & Expression", ["What forms of art emerge from these senses? What's beautiful?"]],
                          ["architectureNotes", "Architecture", ["How does architecture serve these senses? What makes a building comfortable?"]],
                          ["technologyNotes", "Technology", ["What technologies develop from these sensory capabilities?"]],
                          ["mythologyNotes", "Mythology", ["What myths and beliefs arise from how this species perceives reality?"]],
                          ["socialNotes", "Social Behavior", ["How do these senses shape social structures and rituals?"]],
                        ] as [string, string, string[]][]
                      ).map(([key, label, prompts]) => (
                        <QuestionSection
                          key={key}
                          id={`wb-${key}`}
                          label={label}
                          prompts={prompts}
                          value={
                            (formState.worldbuildingNotes as Record<string, string>)[key] || ""
                          }
                          onChange={(v) =>
                            setFormState((prev) => ({
                              ...prev,
                              worldbuildingNotes: {
                                ...prev.worldbuildingNotes,
                                [key]: v,
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CollapsibleSection>

            {/* ═══ Section 6: Perception Gaps ═══ */}
            <CollapsibleSection
              id="section-perception-gaps"
              title="Perception Gaps"
              levelNumber={6}
              guidance={SECTION_GUIDANCE["perception-gaps"]}
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-4">
                {formState.finalSelection.length === 0 ? (
                  <p className="text-sm text-t3 italic">
                    Select senses to see perception gaps vs. human baseline.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GlassPanel className="p-4">
                        <h4 className="text-sm font-medium text-sf-cyan mb-2">
                          Species Perceives (Humans Don't)
                        </h4>
                        {perceptionGaps.speciesPerceives.length > 0 ? (
                          perceptionGaps.speciesPerceives.map((name) => (
                            <p key={name} className="text-sm text-foreground">
                              + {name}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-t3 italic">
                            No alien senses beyond human range
                          </p>
                        )}
                      </GlassPanel>

                      <GlassPanel className="p-4">
                        <h4 className="text-sm font-medium text-sf-crimson mb-2">
                          Species Blind (Humans Have)
                        </h4>
                        {perceptionGaps.speciesBlind.length > 0 ? (
                          perceptionGaps.speciesBlind.map((name) => (
                            <p key={name} className="text-sm text-foreground">
                              − {name}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-t3 italic">
                            No human senses missing
                          </p>
                        )}
                      </GlassPanel>
                    </div>

                    {/* Comparative Species View */}
                    <GlassPanel className="p-4 mt-2">
                      <h4 className="font-heading text-sm font-light uppercase tracking-[3px] text-emerald mb-3">
                        COMPARATIVE VIEW
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-t3 mb-2">
                            Your Species
                          </p>
                          <div className="space-y-1">
                            {MODALITIES.map((mod) => {
                              const has = formState.finalSelection.includes(mod.id);
                              return (
                                <div key={mod.id} className={`flex items-center gap-2 text-xs ${has ? "text-t2" : "text-t4 opacity-40"}`}>
                                  <span className={`w-1.5 h-1.5 flex-shrink-0 ${has ? "bg-emerald-400" : "bg-tier-4"}`} />
                                  {mod.name}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-t3 mb-2">
                            Human Baseline
                          </p>
                          <div className="space-y-1">
                            {MODALITIES.map((mod) => {
                              const has = HUMAN_SENSES.includes(mod.id);
                              return (
                                <div key={mod.id} className={`flex items-center gap-2 text-xs ${has ? "text-t2" : "text-t4 opacity-40"}`}>
                                  <span className={`w-1.5 h-1.5 flex-shrink-0 ${has ? "bg-cyan-400" : "bg-tier-4"}`} />
                                  {mod.name}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </GlassPanel>

                    {perceptionGaps.conflictPotential.length > 0 && (
                      <GlassPanel className="p-4">
                        <h4 className="text-sm font-medium text-sf-amber mb-2">
                          Conflict Potential
                        </h4>
                        {perceptionGaps.conflictPotential.map((hook, i) => (
                          <p key={i} className="text-sm text-t3">
                            • {hook}
                          </p>
                        ))}
                      </GlassPanel>
                    )}

                    <QuestionSection
                      id="gap-perceives"
                      label="Species Perceives—Story Notes"
                      prompts={[
                        "How do these extra senses create misunderstanding with humans?",
                        "What do they find obvious that humans miss entirely?",
                      ]}
                      value={formState.perceptionGapNotes.speciesPerceives}
                      onChange={(v) =>
                        setFormState((prev) => ({
                          ...prev,
                          perceptionGapNotes: {
                            ...prev.perceptionGapNotes,
                            speciesPerceives: v,
                          },
                        }))
                      }
                    />
                    <QuestionSection
                      id="gap-blind"
                      label="Species Blind—Story Notes"
                      prompts={[
                        "What human experiences are they completely blind to?",
                        "How does this blindness create vulnerability or misunderstanding?",
                      ]}
                      value={formState.perceptionGapNotes.speciesBlind}
                      onChange={(v) =>
                        setFormState((prev) => ({
                          ...prev,
                          perceptionGapNotes: {
                            ...prev.perceptionGapNotes,
                            speciesBlind: v,
                          },
                        }))
                      }
                    />
                    <QuestionSection
                      id="gap-conflict"
                      label="Conflict Potential—Story Notes"
                      prompts={[
                        "How do perception differences create dramatic tension?",
                        "What miscommunications arise from different sensory worlds?",
                      ]}
                      value={formState.perceptionGapNotes.conflictPotential}
                      onChange={(v) =>
                        setFormState((prev) => ({
                          ...prev,
                          perceptionGapNotes: {
                            ...prev.perceptionGapNotes,
                            conflictPotential: v,
                          },
                        }))
                      }
                    />
                  </>
                )}
              </div>
            </CollapsibleSection>

            {/* ═══ Section 7: Synthesis ═══ */}
            <CollapsibleSection
              id="section-synthesis"
              title="Synthesis"
              levelNumber={7}
              guidance={SECTION_GUIDANCE.synthesis}
              expandedSections={expandedSections}
              onToggle={(id) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            >
              <div className="space-y-4">
                <QuestionSection
                  id="narrative-summary"
                  label="Narrative Summary"
                  prompts={[
                    "Describe what it's like to BE this species—how they experience reality.",
                    "Write a brief passage from their sensory perspective.",
                  ]}
                  value={formState.synthesis.narrativeSummary}
                  onChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      synthesis: { ...prev.synthesis, narrativeSummary: v },
                    }))
                  }
                />
                <QuestionSection
                  id="story-hooks"
                  label="Story Hooks"
                  prompts={[
                    "What plot points emerge from this sensory profile?",
                    "How might first contact play out given these senses?",
                  ]}
                  value={formState.synthesis.storyHooks}
                  onChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      synthesis: { ...prev.synthesis, storyHooks: v },
                    }))
                  }
                />
                <QuestionSection
                  id="integration-notes"
                  label="Integration Notes"
                  prompts={[
                    "How does this connect to your species' biology and culture?",
                    "What needs updating in other worksheets based on this sensory profile?",
                  ]}
                  value={formState.synthesis.integrationNotes}
                  onChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      synthesis: { ...prev.synthesis, integrationNotes: v },
                    }))
                  }
                />

                {/* Perceptual Snapshot */}
                {perceptualNarrative && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <GlassPanel className="p-4">
                      <h4 className="font-heading text-sm font-light uppercase tracking-[3px] text-emerald mb-3">
                        PERCEPTUAL SNAPSHOT
                      </h4>
                      <p className="text-sm text-t2 italic font-sans leading-relaxed">
                        {perceptualNarrative}
                      </p>
                    </GlassPanel>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleCopyResults}
                  >
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </Button>

                  {worldId && formState._linkedWorksheets && (
                    Object.values(formState._linkedWorksheets).some((ref) => ref?.worksheetId)
                  ) && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handlePushToWorksheets}
                      disabled={isPushing}
                    >
                      <Upload className="h-4 w-4" />
                      {isPushing ? "Pushing..." : "Push to Worksheets"}
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      {/* ─── Dialogs & Sheets ──────────────────────────────────── */}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Sensorium"
        worldName={worldNameForExport}
        worksheetTitle={currentWorksheetTitle || undefined}
        formState={formState}
        summaryTemplate={
          <SensoriumSummaryTemplate
            formState={formState}
            worldName={worldNameForExport}
          />
        }
        fullTemplate={
          <SensoriumFullReportTemplate
            formState={formState}
            worldName={worldNameForExport}
          />
        }
        defaultFilename="sensorium"
      />

      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          worksheetId={(currentWorksheetId || worksheetId)!}
          worksheetTitle={currentWorksheetTitle || "Untitled Sensorium"}
          worldId={worldId || undefined}
        />
      )}

      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId || ""}
        worldName={currentWorld?.name}
        toolType={TOOL_TYPE}
        toolDisplayName="Sensorium"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        value={formState.generalNotes}
        onChange={(v) => setFormState((prev) => ({ ...prev, generalNotes: v }))}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        images={formState.moodboard || []}
        onChange={(imgs) => setFormState((prev) => ({ ...prev, moodboard: imgs }))}
        worksheetId={currentWorksheetId || worksheetId || undefined}
        worldId={worldId || undefined}
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default Sensorium;
