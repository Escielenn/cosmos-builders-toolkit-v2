import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { WorksheetTagsBar } from "@/components/tools/WorksheetTagsBar";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Dna,
  Brain,
  Building2,
  Scroll,
  AlertTriangle,
  Loader2,
  RotateCcw,
  MoveRight,
  Combine,
  Globe,
  Wand2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolIntroSection from "@/components/tools/ToolIntroSection";
import { TOOL_INTROS } from "@/lib/tool-intros";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import { WorksheetTitle } from "@/components/tools/WorksheetTitle";
import { getToolIcon } from "@/components/icons/tool-icons";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import ToolActionBar from "@/components/tools/ToolActionBar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import {
  GravitasSummaryTemplate,
  GravitasFullReportTemplate,
} from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";

import type {
  GravitasFormState,
  CalculationMode,
  RealismMode,
  SpinGravityOutput,
  ThrustGravityOutput,
  CombinedVectorOutput,
  OrbitalOutput,
  ArtificialOutput,
  GravityContext,
} from "@/lib/gravitas/types";
import {
  INITIAL_FORM_STATE,
  SPIN_PRESETS,
  ORBITAL_PRESETS,
  THRUST_PRESETS,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  REALISM_LABELS,
  REALISM_DESCRIPTIONS,
} from "@/lib/gravitas/data";
import {
  calculateSpinGravity,
  calculateThrustGravity,
  calculateCombinedVector,
  calculateOrbitalGravity,
  calculateArtificialGravity,
  getEffectiveG,
  classifyGravity,
  getGravityLabel,
  formatG,
  formatVelocity,
  formatDuration,
  formatPeriod,
  buildCopyText,
} from "@/lib/gravitas/calculations";
import {
  generateMovementDescription,
  generateFluidDescription,
  generateHealthProjection,
  generateArchitectureNotes,
  generateMythologicalSeeds,
  generateNarrativeSnippet,
} from "@/lib/gravitas/experiential";

// ─── Constants ────────────────────────────────────────────────────────

const TOOL_TYPE = "gravitas";
const ToolIcon = getToolIcon(TOOL_TYPE);
const LOCAL_STORAGE_KEY = "gravitas-v1";

const CASCADE_ICONS = {
  biology: Dna,
  psychology: Brain,
  culture: Building2,
  mythology: Scroll,
};

const MODE_ICONS: Record<CalculationMode, typeof RotateCcw> = {
  spin: RotateCcw,
  thrust: MoveRight,
  combined: Combine,
  orbital: Globe,
  artificial: Wand2,
};

// ─── Slider helpers ───────────────────────────────────────────────────

function logSlider(value: number, min: number, max: number, steps = 1000): number {
  return Math.round((Math.log10(value / min) / Math.log10(max / min)) * steps);
}
function sliderLog(slider: number, min: number, max: number, steps = 1000): number {
  return min * Math.pow(max / min, slider / steps);
}

// ─── Component ────────────────────────────────────────────────────────

const Gravitas = () => {
  const [formState, setFormState] = useState<GravitasFormState>(INITIAL_FORM_STATE);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const [activeSpinPreset, setActiveSpinPreset] = useState<string | null>(null);
  const [activeThrustPreset, setActiveThrustPreset] = useState<string | null>(null);
  const [activeOrbitalPreset, setActiveOrbitalPreset] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();

  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);

  // Show worksheet selector
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // Load from Supabase
  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const data = existingWorksheet.data as unknown as GravitasFormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet.tags) setWorksheetTags(existingWorksheet.tags);
        toast({ title: "Worksheet Loaded", description: "Your saved work has been restored." });
      } catch {
        console.error("Failed to load worksheet data");
      }
    }
  }, [existingWorksheet]);

  // Load from localStorage fallback
  useEffect(() => {
    if (!worldId && !worksheetId) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) setFormState(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [worldId, worksheetId]);

  // ─── Calculations ───────────────────────────────────────────────────

  const spinResult = useMemo(
    () => calculateSpinGravity(formState.spin),
    [formState.spin]
  );
  const thrustResult = useMemo(
    () => calculateThrustGravity(formState.thrust),
    [formState.thrust]
  );
  const combinedResult = useMemo(
    () => calculateCombinedVector(formState.combined),
    [formState.combined]
  );
  const orbitalResult = useMemo(
    () => calculateOrbitalGravity(formState.orbital),
    [formState.orbital]
  );
  const artificialResult = useMemo(
    () => calculateArtificialGravity(formState.artificial),
    [formState.artificial]
  );

  const allResults = { spin: spinResult, thrust: thrustResult, combined: combinedResult, orbital: orbitalResult, artificial: artificialResult };
  const effectiveG = getEffectiveG(formState, allResults);
  const habitabilityStatus = classifyGravity(effectiveG);
  const gravityLabel = getGravityLabel(effectiveG);

  const gravityContext: GravityContext = useMemo(() => ({
    effective_g: effectiveG,
    source: formState.activeMode,
    spin_rpm: formState.activeMode === "spin" ? formState.spin.rotation_rpm : undefined,
    tilt_angle_deg: formState.activeMode === "combined" ? combinedResult.tilt_angle_deg : undefined,
    coriolis_intensity: formState.activeMode === "spin" ? spinResult.coriolis_intensity : undefined,
    realism_mode: formState.realismMode,
  }), [effectiveG, formState.activeMode, formState.spin.rotation_rpm, formState.realismMode, spinResult, combinedResult]);

  // Experiential text (memoized)
  const movementText = useMemo(() => generateMovementDescription(gravityContext), [gravityContext]);
  const fluidText = useMemo(() => generateFluidDescription(effectiveG), [effectiveG]);
  const healthText = useMemo(
    () => generateHealthProjection(effectiveG, formState.outputOptions.healthDurationMonths),
    [effectiveG, formState.outputOptions.healthDurationMonths]
  );
  const architectureText = useMemo(
    () => generateArchitectureNotes(effectiveG, formState.activeMode, combinedResult.tilt_angle_deg),
    [effectiveG, formState.activeMode, combinedResult.tilt_angle_deg]
  );
  const mythologyText = useMemo(
    () => generateMythologicalSeeds(effectiveG, formState.activeMode, formState.spin.rotation_rpm),
    [effectiveG, formState.activeMode, formState.spin.rotation_rpm]
  );
  const narrativeText = useMemo(() => generateNarrativeSnippet(gravityContext), [gravityContext]);

  // ─── Handlers ───────────────────────────────────────────────────────

  const updateSpin = (key: string, value: number) => {
    setActiveSpinPreset(null);
    setFormState((prev) => ({ ...prev, spin: { ...prev.spin, [key]: value } }));
  };
  const updateThrust = (key: string, value: number | string | boolean) => {
    setActiveThrustPreset(null);
    setFormState((prev) => ({ ...prev, thrust: { ...prev.thrust, [key]: value } }));
  };
  const updateCombined = (key: string, value: number | string) => {
    setFormState((prev) => ({ ...prev, combined: { ...prev.combined, [key]: value } }));
  };
  const updateOrbital = (key: string, value: number) => {
    setActiveOrbitalPreset(null);
    setFormState((prev) => ({ ...prev, orbital: { ...prev.orbital, [key]: value } }));
  };
  const updateArtificial = (key: string, value: number | string) => {
    setFormState((prev) => ({ ...prev, artificial: { ...prev.artificial, [key]: value } }));
  };

  const setMode = (mode: CalculationMode) => {
    setFormState((prev) => ({ ...prev, activeMode: mode }));
  };
  const setRealism = (mode: RealismMode) => {
    setFormState((prev) => ({ ...prev, realismMode: mode }));
  };

  const handleCopyResults = () => {
    const text = buildCopyText(formState.activeMode, allResults);
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Results copied to clipboard." });
  };

  // ─── Save / Worksheet Management ───────────────────────────────────

  const handleSave = async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));

    if (worldId && user) {
      const wsId = currentWorksheetId || worksheetId;
      if (wsId) {
        await updateWorksheet.mutateAsync({
          worksheetId: wsId,
          data: formState as unknown as Json,
        });
        toast({ title: "Saved", description: "Worksheet saved to cloud." });
      } else {
        const ws = await createWorksheet.mutateAsync({
          worldId,
          toolType: TOOL_TYPE,
          title: "Gravitas",
          data: formState as unknown as Json,
        });
        setCurrentWorksheetId(ws.id);
        setCurrentWorksheetTitle(ws.title);
        setSearchParams({ worldId, worksheetId: ws.id });
        toast({ title: "Created", description: "New worksheet created." });
      }
    } else {
      toast({ title: "Saved locally", description: "Data saved to this browser." });
    }
  };

  const handleWorksheetSelect = (wsId: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: wsId });
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const ws = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: INITIAL_FORM_STATE as unknown as Json,
    });
    setCurrentWorksheetId(ws.id);
    setCurrentWorksheetTitle(ws.title);
    setSearchParams({ worldId: worldId!, worksheetId: ws.id });
    return ws.id;
  };

  const handleRename = async (newTitle: string) => {
    const wsId = currentWorksheetId || worksheetId;
    if (wsId) {
      await renameWorksheet.mutateAsync({ worksheetId: wsId, title: newTitle });
      setCurrentWorksheetTitle(newTitle);
    }
  };

  const handleTagsChange = async (tags: string[]) => {
    const wsId = currentWorksheetId || worksheetId;
    if (wsId) {
      await updateWorksheetTags.mutateAsync({ worksheetId: wsId, tags });
      setWorksheetTags(tags);
    }
  };

  const worldNameForExport = worldId ? worldName : undefined;

  // ─── Status Color ──────────────────────────────────────────────────

  const statusColor = (() => {
    if (formState.activeMode === "artificial") return "text-fuchsia-400";
    switch (habitabilityStatus) {
      case "earth_like": return "text-green-400";
      case "reduced_gravity": return "text-green-300";
      case "low_gravity":
      case "high_gravity": return "text-orange-400";
      case "microgravity":
      case "milligravity":
      case "extreme_gravity": return "text-red-400";
      default: return "text-muted-foreground";
    }
  })();

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back link */}
        <Link
          to={worldId ? `/worlds/${worldId}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {worldId ? "Back to World" : "Back to Dashboard"}
        </Link>

        {/* Action bar */}
        <ToolActionBar
          onSave={handleSave}
          isSaving={updateWorksheet.isPending || createWorksheet.isPending}
          onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
          onPrint={() => window.print()}
          onExport={() => setExportDialogOpen(true)}
          onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
          isShared={!!shareConfig?.enabled}
          isCloudEnabled={!!(worldId && user)}
          onNotesClick={() => setNotesSheetOpen(true)}
          onMoodboardClick={() => setMoodboardSheetOpen(true)}
          moodboardCount={formState.moodboard?.length || 0}
          exportLabel="Export Worksheet"
          className="mb-6"
          extraActions={
            <QuickExportButton
              toolName="Gravitas"
              worldName={worldNameForExport}
              formState={formState}
              summaryTemplate={<GravitasSummaryTemplate formState={formState} worldName={worldNameForExport} />}
              fullTemplate={<GravitasFullReportTemplate formState={formState} worldName={worldNameForExport} />}
            />
          }
        />

        {/* Title */}
        <div className="mb-8">
          <Badge className="mb-2">Pro Tool</Badge>
          <div className="flex items-center gap-3">
            {ToolIcon && <ToolIcon className="w-12 h-12 rounded-full shrink-0" />}
            <h1 className="font-display text-3xl md:text-4xl">
              <span className="font-normal">Gravitas:</span>{" "}
              <span className="font-light">Spacecraft & Habitat Gravity Simulator</span>
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Spacecraft & Habitat Gravity Simulator. Calculate effective gravity conditions and trace how weight shapes biology, architecture, mythology, and culture.
          </p>
          {(currentWorksheetId || worksheetId) && (
            <WorksheetTitle
              title={currentWorksheetTitle}
              onRename={handleRename}
              disabled={!user || worksheetLoading}
            />
          )}
          {(currentWorksheetId || worksheetId) && (
            <WorksheetTagsBar
              worksheetId={(currentWorksheetId || worksheetId)!}
              tags={worksheetTags}
              onChange={handleTagsChange}
            />
          )}
        </div>

        <ToolIntroSection data={TOOL_INTROS["gravitas"]} />

        {/* Main Content */}
        <div className="space-y-6">

          {/* Realism Toggle */}
          <CollapsibleSection id="realism" title="Realism Mode" levelNumber={1} defaultOpen>
            <div className="grid grid-cols-3 gap-3">
              {(["hard_sf", "hybrid", "soft_sf"] as RealismMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRealism(mode)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formState.realismMode === mode
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-primary/30 hover:bg-accent/5"
                  }`}
                >
                  <span className="font-medium text-sm">{REALISM_LABELS[mode]}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">{REALISM_DESCRIPTIONS[mode]}</p>
                </button>
              ))}
            </div>
            {formState.realismMode === "hard_sf" && formState.activeMode === "artificial" && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">Artificial gravity is not available in Hard SF mode. Switch to Hybrid or Soft SF.</p>
              </div>
            )}
          </CollapsibleSection>

          {/* Calculation Mode */}
          <CollapsibleSection id="mode" title="Calculation Mode" levelNumber={2} defaultOpen>
            <Tabs value={formState.activeMode} onValueChange={(v) => setMode(v as CalculationMode)}>
              <TabsList className="w-full grid grid-cols-5">
                {(["spin", "thrust", "combined", "orbital", "artificial"] as CalculationMode[]).map((mode) => {
                  const Icon = MODE_ICONS[mode];
                  return (
                    <TabsTrigger key={mode} value={mode} className="gap-1.5 text-xs sm:text-sm">
                      <Icon className="w-3.5 h-3.5 hidden sm:block" />
                      {MODE_LABELS[mode]}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <p className="text-xs text-muted-foreground mt-2">{MODE_DESCRIPTIONS[formState.activeMode]}</p>

              {/* ── Spin Parameters ─── */}
              <TabsContent value="spin" className="mt-4 space-y-6">
                {/* Presets */}
                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPIN_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setActiveSpinPreset(preset.id);
                          setFormState((prev) => ({ ...prev, spin: { ...preset.values } }));
                        }}
                        className={`p-2 rounded-lg border text-left transition-colors ${activeSpinPreset === preset.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-accent/5"}`}
                      >
                        <span className="font-medium text-xs">{preset.name}</span>
                        <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Habitat Radius</Label>
                    <span className="font-mono text-primary text-lg">{formState.spin.radius_m.toFixed(0)} m</span>
                  </div>
                  <Slider
                    value={[logSlider(formState.spin.radius_m, 10, 10000)]}
                    onValueChange={([v]) => updateSpin("radius_m", Math.round(sliderLog(v, 10, 10000)))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>10 m</span><span>10,000 m</span></div>
                </div>

                {/* RPM */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Rotation Rate</Label>
                    <span className="font-mono text-primary text-lg">{formState.spin.rotation_rpm.toFixed(2)} RPM</span>
                  </div>
                  <Slider
                    value={[formState.spin.rotation_rpm * 100]}
                    onValueChange={([v]) => updateSpin("rotation_rpm", v / 100)}
                    min={1} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>0.01 RPM</span><span>10 RPM</span></div>
                </div>

                {/* Human Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Reference Height</Label>
                    <span className="font-mono text-primary">{formState.spin.human_height_m.toFixed(1)} m</span>
                  </div>
                  <Slider
                    value={[formState.spin.human_height_m * 10]}
                    onValueChange={([v]) => updateSpin("human_height_m", v / 10)}
                    min={5} max={25} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>0.5 m</span><span>2.5 m</span></div>
                </div>
              </TabsContent>

              {/* ── Thrust Parameters ─── */}
              <TabsContent value="thrust" className="mt-4 space-y-6">
                {/* Presets */}
                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THRUST_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setActiveThrustPreset(preset.id);
                          setFormState((prev) => ({ ...prev, thrust: { ...prev.thrust, ...preset.values } }));
                        }}
                        className={`p-2 rounded-lg border text-left transition-colors ${activeThrustPreset === preset.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-accent/5"}`}
                      >
                        <span className="font-medium text-xs">{preset.name}</span>
                        <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acceleration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Acceleration</Label>
                    <span className="font-mono text-primary text-lg">{formState.thrust.acceleration_g.toFixed(2)} g</span>
                  </div>
                  <Slider
                    value={[logSlider(formState.thrust.acceleration_g, 0.001, 10)]}
                    onValueChange={([v]) => updateThrust("acceleration_g", parseFloat(sliderLog(v, 0.001, 10).toFixed(3)))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>0.001 g</span><span>10 g</span></div>
                </div>

                {/* Distance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mission Distance</Label>
                    <span className="font-mono text-primary text-lg">{formState.thrust.mission_distance_au.toFixed(2)} AU</span>
                  </div>
                  <Slider
                    value={[logSlider(formState.thrust.mission_distance_au, 0.01, 1000)]}
                    onValueChange={([v]) => updateThrust("mission_distance_au", parseFloat(sliderLog(v, 0.01, 1000).toFixed(2)))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>0.01 AU</span><span>1,000 AU</span></div>
                </div>

                {/* Propulsion Mode */}
                <div className="space-y-2">
                  <Label>Propulsion Profile</Label>
                  <Select value={formState.thrust.propulsion_mode} onValueChange={(v) => updateThrust("propulsion_mode", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brachistochrone">Brachistochrone (flip at midpoint)</SelectItem>
                      <SelectItem value="constant">Constant Thrust (no coast)</SelectItem>
                      <SelectItem value="coast_flip">Coast & Flip (burn/coast/burn)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Relativity */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formState.thrust.include_relativity}
                    onCheckedChange={(v) => updateThrust("include_relativity", v)}
                  />
                  <Label>Include relativistic corrections</Label>
                </div>
              </TabsContent>

              {/* ── Combined Parameters ─── */}
              <TabsContent value="combined" className="mt-4 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Enter the spin and thrust gravity components to calculate the resultant vector.
                  You can use values from the Spin and Thrust modes.
                </p>

                {/* Spin g component */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Spin Component</Label>
                    <span className="font-mono text-primary">{formState.combined.spin_g.toFixed(2)} g</span>
                  </div>
                  <Slider
                    value={[formState.combined.spin_g * 100]}
                    onValueChange={([v]) => updateCombined("spin_g", v / 100)}
                    min={0} max={300} step={1}
                  />
                </div>

                {/* Thrust g component */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Thrust Component</Label>
                    <span className="font-mono text-primary">{formState.combined.thrust_g.toFixed(2)} g</span>
                  </div>
                  <Slider
                    value={[formState.combined.thrust_g * 100]}
                    onValueChange={([v]) => updateCombined("thrust_g", v / 100)}
                    min={0} max={300} step={1}
                  />
                </div>

                {/* Axis orientation */}
                <div className="space-y-2">
                  <Label>Spin Axis Orientation</Label>
                  <Select value={formState.combined.axis_orientation} onValueChange={(v) => updateCombined("axis_orientation", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parallel">Parallel (0°)</SelectItem>
                      <SelectItem value="perpendicular">Perpendicular (90°)</SelectItem>
                      <SelectItem value="custom">Custom Angle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formState.combined.axis_orientation === "custom" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Custom Angle</Label>
                      <span className="font-mono text-primary">{formState.combined.custom_angle_deg}°</span>
                    </div>
                    <Slider
                      value={[formState.combined.custom_angle_deg]}
                      onValueChange={([v]) => updateCombined("custom_angle_deg", v)}
                      min={0} max={180} step={1}
                    />
                  </div>
                )}
              </TabsContent>

              {/* ── Orbital Parameters ─── */}
              <TabsContent value="orbital" className="mt-4 space-y-6">
                {/* Presets */}
                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORBITAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setActiveOrbitalPreset(preset.id);
                          setFormState((prev) => ({ ...prev, orbital: { ...preset.values } }));
                        }}
                        className={`p-2 rounded-lg border text-left transition-colors ${activeOrbitalPreset === preset.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-accent/5"}`}
                      >
                        <span className="font-medium text-xs">{preset.name}</span>
                        <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parent body mass */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Parent Body Mass</Label>
                    <span className="font-mono text-primary text-sm">{formState.orbital.parent_mass_kg.toExponential(3)} kg</span>
                  </div>
                  <Slider
                    value={[logSlider(formState.orbital.parent_mass_kg, 1e15, 1e31)]}
                    onValueChange={([v]) => updateOrbital("parent_mass_kg", sliderLog(v, 1e15, 1e31))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>10¹⁵ kg</span><span>10³¹ kg</span></div>
                </div>

                {/* Parent body radius */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Parent Body Radius</Label>
                    <span className="font-mono text-primary">{formState.orbital.parent_radius_km.toFixed(0)} km</span>
                  </div>
                  <Slider
                    value={[logSlider(formState.orbital.parent_radius_km, 1, 100000)]}
                    onValueChange={([v]) => updateOrbital("parent_radius_km", Math.round(sliderLog(v, 1, 100000)))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>1 km</span><span>100,000 km</span></div>
                </div>

                {/* Altitude */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Altitude</Label>
                    <span className="font-mono text-primary">{formState.orbital.altitude_km.toFixed(0)} km</span>
                  </div>
                  <Slider
                    value={[formState.orbital.altitude_km > 0 ? logSlider(Math.max(1, formState.orbital.altitude_km), 1, 1000000) : 0]}
                    onValueChange={([v]) => updateOrbital("altitude_km", v === 0 ? 0 : Math.round(sliderLog(v, 1, 1000000)))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Surface</span><span>1,000,000 km</span></div>
                </div>

                {/* Habitat size (for tidal gradient) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Station/Habitat Size (for tidal gradient)</Label>
                    <span className="font-mono text-primary">{formState.orbital.habitat_size_km.toFixed(3)} km</span>
                  </div>
                  <Slider
                    value={[logSlider(Math.max(0.001, formState.orbital.habitat_size_km), 0.001, 100)]}
                    onValueChange={([v]) => updateOrbital("habitat_size_km", parseFloat(sliderLog(v, 0.001, 100).toFixed(3)))}
                    min={0} max={1000} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>1 m</span><span>100 km</span></div>
                </div>
              </TabsContent>

              {/* ── Artificial Parameters ─── */}
              <TabsContent value="artificial" className="mt-4 space-y-6">
                {formState.realismMode === "hard_sf" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">
                      Artificial gravity violates known physics. Switch to Hybrid or Soft SF mode to use this module.
                    </p>
                  </div>
                )}

                {/* Desired g */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Desired Gravity</Label>
                    <span className="font-mono text-primary text-lg">{formState.artificial.desired_g.toFixed(2)} g</span>
                  </div>
                  <Slider
                    value={[formState.artificial.desired_g * 100]}
                    onValueChange={([v]) => updateArtificial("desired_g", v / 100)}
                    min={1} max={500} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>0.01 g</span><span>5 g</span></div>
                </div>

                {/* Direction */}
                <div className="space-y-2">
                  <Label>Gravity Direction</Label>
                  <Select value={formState.artificial.direction} onValueChange={(v) => updateArtificial("direction", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="floor">Floor (standard)</SelectItem>
                      <SelectItem value="ceiling">Ceiling (inverted)</SelectItem>
                      <SelectItem value="walls">Walls (radial)</SelectItem>
                      <SelectItem value="variable">Variable (shifting)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Coverage */}
                <div className="space-y-2">
                  <Label>Coverage</Label>
                  <Select value={formState.artificial.coverage} onValueChange={(v) => updateArtificial("coverage", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipwide">Shipwide (uniform)</SelectItem>
                      <SelectItem value="zoned">Zoned (different areas)</SelectItem>
                      <SelectItem value="localized">Localized (specific rooms)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Failure Mode */}
                <div className="space-y-2">
                  <Label>Failure Mode</Label>
                  <Select value={formState.artificial.failure_mode} onValueChange={(v) => updateArtificial("failure_mode", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant (catastrophic loss)</SelectItem>
                      <SelectItem value="gradual">Gradual (slow fade)</SelectItem>
                      <SelectItem value="flickering">Flickering (intermittent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Technobabble Level */}
                <div className="space-y-2">
                  <Label>Technobabble Level</Label>
                  <Select value={formState.artificial.technobabble_level} onValueChange={(v) => updateArtificial("technobabble_level", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="elaborate">Elaborate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CollapsibleSection>

          {/* ── Results Panel ─── */}
          <CollapsibleSection id="results" title="Results" levelNumber={3} defaultOpen>
            <GlassPanel className="p-6">
              {/* Primary readout */}
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Effective Gravity</p>
                <p className={`font-mono text-4xl font-light ${statusColor}`}>{formatG(effectiveG)}</p>
                <p className={`text-sm mt-1 ${statusColor}`}>{gravityLabel}</p>
              </div>

              {/* Mode-specific results */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {formState.activeMode === "spin" && (
                  <>
                    <ResultItem label="Head Gravity" value={formatG(spinResult.head_g)} />
                    <ResultItem label="Gradient" value={`${spinResult.gradient_percent.toFixed(1)}%`} />
                    <ResultItem label="Tangential V" value={`${spinResult.tangential_velocity_ms.toFixed(1)} m/s`} />
                    <ResultItem label="Period" value={`${spinResult.period_s.toFixed(1)} s`} />
                    <ResultItem label="Coriolis" value={spinResult.coriolis_intensity} warn={!spinResult.is_comfortable} />
                    <ResultItem label="Comfortable" value={spinResult.is_comfortable ? "Yes" : "No"} warn={!spinResult.is_comfortable} />
                  </>
                )}
                {formState.activeMode === "thrust" && (
                  <>
                    <ResultItem label="Trip Duration" value={formatDuration(thrustResult.trip_duration_days)} />
                    <ResultItem label="Delta-V" value={`${thrustResult.delta_v_kms.toFixed(1)} km/s`} />
                    <ResultItem label="Peak Velocity" value={`${thrustResult.peak_velocity_kms.toFixed(1)} km/s`} />
                    <ResultItem label="Peak V (%c)" value={`${(thrustResult.peak_velocity_c * 100).toFixed(4)}%`} />
                    {thrustResult.time_dilation_factor > 1.001 && (
                      <>
                        <ResultItem label="Time Dilation (γ)" value={thrustResult.time_dilation_factor.toFixed(4)} />
                        <ResultItem label="Ship Time" value={`${thrustResult.ship_time_years.toFixed(2)} yr`} />
                      </>
                    )}
                  </>
                )}
                {formState.activeMode === "combined" && (
                  <>
                    <ResultItem label="Tilt Angle" value={`${combinedResult.tilt_angle_deg.toFixed(1)}°`} warn={combinedResult.tilt_angle_deg > 15} />
                    <ResultItem label="Walking Difficulty" value={`${combinedResult.walking_difficulty}/10`} warn={combinedResult.walking_difficulty > 5} />
                    <ResultItem label="Architectural Impact" value={combinedResult.architectural_impact} span />
                  </>
                )}
                {formState.activeMode === "orbital" && (
                  <>
                    <ResultItem label="Surface Gravity" value={formatG(orbitalResult.surface_g)} />
                    {formState.orbital.altitude_km > 0 && <ResultItem label="At Altitude" value={formatG(orbitalResult.altitude_g)} />}
                    <ResultItem label="Orbital Velocity" value={`${orbitalResult.orbital_velocity_kms.toFixed(2)} km/s`} />
                    <ResultItem label="Orbital Period" value={formatPeriod(orbitalResult.orbital_period_hours)} />
                    <ResultItem label="Escape Velocity" value={`${orbitalResult.escape_velocity_kms.toFixed(2)} km/s`} />
                    {orbitalResult.tidal_gradient_micro_g_per_km > 0 && (
                      <ResultItem label="Tidal Gradient" value={`${orbitalResult.tidal_gradient_micro_g_per_km.toFixed(2)} μg/km`} />
                    )}
                  </>
                )}
                {formState.activeMode === "artificial" && (
                  <>
                    <ResultItem label="Energy Handwave" value={artificialResult.energy_handwave} />
                    {artificialResult.technobabble_text && (
                      <ResultItem label="Technobabble" value={artificialResult.technobabble_text} span />
                    )}
                  </>
                )}
              </div>

              {/* Physics violations for artificial */}
              {formState.activeMode === "artificial" && formState.realismMode !== "soft_sf" && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs font-medium text-amber-400 mb-2">Physics Violations:</p>
                  <ul className="text-xs text-amber-300/80 space-y-1">
                    {artificialResult.physics_violations.map((v, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Copy button */}
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleCopyResults} className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy Results
                </Button>
              </div>
            </GlassPanel>
          </CollapsibleSection>

          {/* ── Experiential Output ─── */}
          <CollapsibleSection id="experiential" title="Experiential Output" levelNumber={4} defaultOpen>
            <div className="space-y-6">
              {formState.outputOptions.showMovement && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Movement & Locomotion</h4>
                  <GlassPanel className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{movementText}</p>
                  </GlassPanel>
                </div>
              )}

              {formState.outputOptions.showFluids && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Fluid Behavior</h4>
                  <GlassPanel className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{fluidText}</p>
                  </GlassPanel>
                </div>
              )}

              {formState.outputOptions.showHealth && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Health Projections ({formState.outputOptions.healthDurationMonths} months)</h4>
                  <div className="space-y-2">
                    <Slider
                      value={[formState.outputOptions.healthDurationMonths]}
                      onValueChange={([v]) => setFormState((prev) => ({
                        ...prev,
                        outputOptions: { ...prev.outputOptions, healthDurationMonths: v },
                      }))}
                      min={1} max={120} step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>1 month</span><span>10 years</span></div>
                  </div>
                  <GlassPanel className="p-4 mt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">{healthText}</p>
                  </GlassPanel>
                </div>
              )}

              {formState.outputOptions.showArchitecture && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Architectural Requirements</h4>
                  <GlassPanel className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{architectureText}</p>
                  </GlassPanel>
                </div>
              )}

              {formState.outputOptions.showMythology && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Mythological Implications</h4>
                  <GlassPanel className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{mythologyText}</p>
                  </GlassPanel>
                </div>
              )}

              {formState.outputOptions.showNarrative && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Narrative Snippet</h4>
                  <GlassPanel className="p-4 border-primary/20">
                    <p className="text-sm italic text-muted-foreground leading-relaxed">{narrativeText}</p>
                  </GlassPanel>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ── Cascade Notes ─── */}
          <CollapsibleSection id="cascade" title="Cascade Notes" levelNumber={5}>
            <Tabs defaultValue="biology" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                {(Object.keys(CASCADE_ICONS) as Array<keyof typeof CASCADE_ICONS>).map((key) => {
                  const Icon = CASCADE_ICONS[key];
                  return (
                    <TabsTrigger key={key} value={key} className="gap-1.5 capitalize">
                      <Icon className="w-3.5 h-3.5" /> {key}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {(Object.keys(CASCADE_ICONS) as Array<keyof typeof CASCADE_ICONS>).map((key) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <Textarea
                    placeholder={`How does this gravity environment shape ${key}?`}
                    value={formState.cascade[key]}
                    onChange={(e) => setFormState((prev) => ({
                      ...prev,
                      cascade: { ...prev.cascade, [key]: e.target.value },
                    }))}
                    rows={4}
                    className="resize-none"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CollapsibleSection>

          {/* ── Story Notes ─── */}
          <CollapsibleSection id="story" title="Story Notes" levelNumber={6}>
            <div className="space-y-4">
              {[
                { key: "physicalExperience" as const, label: "Physical Experience", placeholder: "What does it feel like to live here day-to-day?" },
                { key: "dailyLife" as const, label: "Daily Life", placeholder: "How do routines, work, and recreation differ?" },
                { key: "architecture" as const, label: "Architecture & Design", placeholder: "How are spaces designed for this gravity?" },
                { key: "culturalIdentity" as const, label: "Cultural Identity", placeholder: "How does gravity shape identity and belonging?" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Textarea
                    placeholder={placeholder}
                    value={formState.storyNotes[key]}
                    onChange={(e) => setFormState((prev) => ({
                      ...prev,
                      storyNotes: { ...prev.storyNotes, [key]: e.target.value },
                    }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </main>

      <Footer />

      {/* Dialogs */}
      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId || ""}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Gravitas"
        worksheets={existingWorksheets}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
        isLoading={worksheetsLoading}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Gravitas"
        worldName={worldNameForExport}
        formState={formState}
        summaryTemplate={<GravitasSummaryTemplate formState={formState} worldName={worldNameForExport} />}
        fullTemplate={<GravitasFullReportTemplate formState={formState} worldName={worldNameForExport} />}
      />

      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          worksheetId={(currentWorksheetId || worksheetId)!}
          toolType={TOOL_TYPE}
        />
      )}

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        notes={formState.generalNotes}
        onNotesChange={(notes) => setFormState((prev) => ({ ...prev, generalNotes: notes }))}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || worksheetId || undefined}
        images={formState.moodboard || []}
        onImagesChange={(images) => setFormState((prev) => ({ ...prev, moodboard: images }))}
      />
    </div>
  );
};

// ─── Result Item Component ────────────────────────────────────────────

function ResultItem({ label, value, warn, span }: { label: string; value: string; warn?: boolean; span?: boolean }) {
  return (
    <div className={span ? "col-span-full" : ""}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`font-mono text-sm ${warn ? "text-amber-400" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

export default Gravitas;
