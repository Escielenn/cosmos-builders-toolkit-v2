import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Dna,
  Brain,
  Building2,
  Scroll,
  AlertTriangle,
} from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import SectionNavigation from "@/components/tools/SectionNavigation";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, {
  KeyChoicesSection,
  MobileKeyChoices,
} from "@/components/tools/KeyChoicesSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import {
  SurfaceGravitySummaryTemplate,
  SurfaceGravityFullReportTemplate,
} from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";

import {
  COMPOSITION_PRESETS,
  PLANET_PRESETS,
  ATMOSPHERIC_PRESETS,
  SURFACE_GRAVITY_SECTIONS,
  SECTION_HELPERS,
  CASCADE_CONTENT,
} from "@/lib/surface-gravity/data";
import {
  calculateSurfaceGravity,
  applyCompositionPreset,
  buildCopyText,
  formatGravity,
  formatVelocity,
} from "@/lib/surface-gravity/calculations";
import type { FormStateForCalc } from "@/lib/surface-gravity/calculations";

import PlanetSizeComparison from "@/components/tools/PlanetSizeComparison";
import GravityScaleBar from "@/components/tools/GravityScaleBar";
import AtmosphericRetentionChart from "@/components/tools/AtmosphericRetentionChart";

// ─── FormState ───────────────────────────────────────────────────────

interface FormState extends FormStateForCalc {
  cascade: {
    biology: string;
    psychology: string;
    culture: string;
    mythology: string;
  };
  storyNotes: {
    physicalExperience: string;
    dailyLife: string;
    architecture: string;
    culturalIdentity: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  primary: {
    mass: 1.0,
    radius: 1.0,
    compositionPreset: "rocky",
    planetPreset: "earth",
    linked: true,
  },
  advanced: {
    surfaceTemp: 288,
    molecularWeightPreset: "earth",
    molecularWeight: 29,
  },
  cascade: {
    biology: "",
    psychology: "",
    culture: "",
    mythology: "",
  },
  storyNotes: {
    physicalExperience: "",
    dailyLife: "",
    architecture: "",
    culturalIdentity: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "surface-gravity-calculator";
const LOCAL_STORAGE_KEY = "surface-gravity-calculator-v1";

// Cascade tab icons
const CASCADE_ICONS = {
  biology: Dna,
  psychology: Brain,
  culture: Building2,
  mythology: Scroll,
};

// ─── Log slider helpers (mass: 0.01–20) ─────────────────────────────

function massToSlider(mass: number): number {
  // Map 0.01–20 to 0–1000 on log scale
  return Math.round((Math.log10(mass / 0.01) / Math.log10(20 / 0.01)) * 1000);
}
function sliderToMass(slider: number): number {
  const t = slider / 1000;
  return 0.01 * Math.pow(20 / 0.01, t);
}

// ─── Ball Drop Animation ─────────────────────────────────────────────

function BallDropAnimation({ earthG, planetG, planetLabel }: { earthG: number; planetG: number; planetLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const H_DROP = 2; // meters
    const earthT = Math.sqrt((2 * H_DROP) / earthG);
    const planetT = Math.sqrt((2 * H_DROP) / Math.max(planetG, 0.01));
    const maxT = Math.max(earthT, planetT);
    const cycle = maxT + 0.6;

    let start: number | null = null;
    const loop = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ((ts - start) / 1000) % cycle;

      const W = canvas.width;
      const CH = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cw = W / dpr, ch = CH / dpr;
      ctx.clearRect(0, 0, cw, ch);

      const colW = cw / 2;
      const trackTop = 20;
      const trackH = ch - 40;
      const ballR = 5;

      // Ground lines
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, trackTop + trackH);
      ctx.lineTo(colW - 10, trackTop + trackH);
      ctx.moveTo(colW + 10, trackTop + trackH);
      ctx.lineTo(cw - 10, trackTop + trackH);
      ctx.stroke();

      // Height ticks
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("2m", 10, trackTop + 4);
      ctx.fillText("0m", 10, trackTop + trackH - 3);

      // Earth ball
      const eFrac = Math.min(elapsed / earthT, 1);
      const eY = trackTop + eFrac * eFrac * (trackH - ballR * 2) + ballR;
      ctx.beginPath();
      ctx.arc(colW / 2, eY, ballR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,229,160,0.75)";
      ctx.fill();

      // Planet ball
      const pFrac = Math.min(elapsed / planetT, 1);
      const pY = trackTop + pFrac * pFrac * (trackH - ballR * 2) + ballR;
      ctx.beginPath();
      ctx.arc(colW + colW / 2, pY, ballR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,212,255,0.75)";
      ctx.fill();

      // Labels
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Earth (${earthT.toFixed(2)}s)`, colW / 2, ch - 4);
      ctx.fillText(`Planet ${planetLabel} (${planetT.toFixed(2)}s)`, colW + colW / 2, ch - 4);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  }, [earthG, planetG, planetLabel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 160 * dpr;
    draw();
    return () => { cancelAnimationFrame(animRef.current); };
  }, [draw]);

  return (
    <div className="flex flex-col items-center">
      <p className="font-mono text-[10px] uppercase tracking-[1px] text-t4 mb-2">2m Ball Drop Comparison</p>
      <canvas ref={canvasRef} style={{ width: 300, height: 160 }} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

const SurfaceGravityCalculator = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();

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
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet.tags) setWorksheetTags(existingWorksheet.tags);
        toast({ title: "Worksheet Loaded", description: "WORK RESTORED." });
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

  // ─── Calculations ──────────────────────────────────────────────────
  const result = useMemo(() => calculateSurfaceGravity(formState), [formState]);

  const compositionPreset = COMPOSITION_PRESETS.find(
    (p) => p.id === formState.primary.compositionPreset
  );

  // ─── Key Choices ───────────────────────────────────────────────────
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => [
    {
      id: "planet",
      title: "Planet",
      choices: [
        { label: "Preset", value: PLANET_PRESETS.find((p) => p.id === formState.primary.planetPreset)?.label },
        { label: "Mass", value: `${formState.primary.mass.toFixed(3)} M⊕` },
        { label: "Radius", value: `${formState.primary.radius.toFixed(3)} R⊕` },
        { label: "Composition", value: compositionPreset?.label },
      ],
    },
    {
      id: "results",
      title: "Results",
      choices: [
        { label: "Gravity", value: result.valid ? formatGravity(result.gravity) : undefined },
        { label: "Regime", value: result.valid ? result.regimeLabel : undefined },
        { label: "Escape V", value: result.valid ? formatVelocity(result.escapeVelocity) : undefined },
        { label: "Δv to Orbit", value: result.valid ? `${result.deltaV.deltaVToOrbit.toFixed(1)} km/s` : undefined },
      ],
    },
  ], [formState, result, compositionPreset]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const updatePrimary = (key: string, value: number | string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      primary: { ...prev.primary, [key]: value },
    }));
  };

  const handleMassChange = (mass: number) => {
    if (formState.primary.linked && formState.primary.compositionPreset !== "custom") {
      const { radius } = applyCompositionPreset(formState.primary.compositionPreset, mass, formState.primary.radius, "mass");
      setFormState((prev) => ({
        ...prev,
        primary: { ...prev.primary, mass, radius, planetPreset: "" },
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        primary: { ...prev.primary, mass, planetPreset: "" },
      }));
    }
  };

  const handleRadiusChange = (radius: number) => {
    if (formState.primary.linked && formState.primary.compositionPreset !== "custom") {
      const { mass } = applyCompositionPreset(formState.primary.compositionPreset, formState.primary.mass, radius, "radius");
      setFormState((prev) => ({
        ...prev,
        primary: { ...prev.primary, mass, radius, planetPreset: "" },
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        primary: { ...prev.primary, radius, planetPreset: "" },
      }));
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PLANET_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      primary: {
        ...prev.primary,
        mass: preset.mass,
        radius: preset.radius,
        compositionPreset: preset.compositionPreset,
        planetPreset: presetId,
        linked: preset.compositionPreset !== "custom",
      },
      advanced: {
        ...prev.advanced,
        surfaceTemp: preset.surfaceTemp ?? prev.advanced.surfaceTemp,
      },
    }));
  };

  const handleCompositionChange = (presetId: string) => {
    const linked = presetId !== "custom";
    if (linked) {
      const { mass, radius } = applyCompositionPreset(presetId, formState.primary.mass, formState.primary.radius, "mass");
      setFormState((prev) => ({
        ...prev,
        primary: { ...prev.primary, compositionPreset: presetId, linked, mass, radius, planetPreset: "" },
      }));
    } else {
      updatePrimary("compositionPreset", presetId);
      updatePrimary("linked", false);
    }
  };

  const handleAtmosphericPresetChange = (presetId: string) => {
    const preset = ATMOSPHERIC_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        molecularWeightPreset: presetId,
        molecularWeight: preset.molecularWeight,
      },
    }));
  };

  const handleCopyResults = () => {
    const text = buildCopyText(result, formState);
    navigator.clipboard.writeText(text);
    toast({ title: "COPIED TO CLIPBOARD.", description: "RESULTS COPIED TO CLIPBOARD." });
  };

  // ─── Save ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    // Always save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));

    if (worldId && user) {
      const wsId = currentWorksheetId || worksheetId;
      if (wsId) {
        await updateWorksheet.mutateAsync({
          worksheetId: wsId,
          data: formState as unknown as Json,
        });
        toast({ title: "FILE SECURED.", description: "WORKSHEET SECURED TO CLOUD." });
      } else {
        const ws = await createWorksheet.mutateAsync({
          worldId,
          toolType: TOOL_TYPE,
          title: "Surface Gravity Calculator",
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
    const worksheetData = initialFormState as unknown as Json;
    const ws = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: worksheetData,
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

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
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
      extraActions={
        <QuickExportButton
          toolName="Atlas"
          worldName={worldNameForExport}
          formState={formState}
          summaryTemplate={<SurfaceGravitySummaryTemplate formState={formState} worldName={worldNameForExport} />}
          fullTemplate={<SurfaceGravityFullReportTemplate formState={formState} worldName={worldNameForExport} />}
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

        {/* Main Content Grid */}
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-6">

            {/* Section 1: Planet Presets */}
            <CollapsibleSection
              id="presets"
              title="Planet Presets"
              levelNumber={1}
              guidance={SECTION_HELPERS["presets"]}
              defaultOpen
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {PLANET_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-3 rounded-none border text-left transition-colors ${
                      formState.primary.planetPreset === preset.id
                        ? "border-primary bg-primary/10"
                        : "border-sf-border hover:border-primary/30 hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{preset.emoji}</span>
                      <span className="font-medium text-sm">{preset.label}</span>
                    </div>
                    <p className="text-[11px] text-t2 line-clamp-2">{preset.description}</p>
                    {preset.source === "fictional" && (
                      <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0">Fiction</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* Section 2: Primary Inputs */}
            <CollapsibleSection
              id="primary-inputs"
              title="Primary Inputs"
              levelNumber={2}
              guidance={SECTION_HELPERS["primary-inputs"]}
              defaultOpen
            >
              <div className="space-y-6">
                {/* Composition preset */}
                <div className="space-y-2">
                  <Label>Composition Preset</Label>
                  <Select value={formState.primary.compositionPreset} onValueChange={handleCompositionChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPOSITION_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {compositionPreset && compositionPreset.id !== "custom" && (
                    <p className="text-xs text-t4">{compositionPreset.description}</p>
                  )}
                </div>

                {/* Mass slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Planet Mass</Label>
                    <span className="font-mono text-primary text-lg">
                      {formState.primary.mass.toFixed(3)} M⊕
                    </span>
                  </div>
                  <Slider
                    value={[massToSlider(formState.primary.mass)]}
                    onValueChange={([v]) => handleMassChange(sliderToMass(v))}
                    min={0}
                    max={1000}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-t4">
                    <span>0.01 M⊕</span>
                    <span>20 M⊕</span>
                  </div>
                </div>

                {/* Radius slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Planet Radius</Label>
                    <span className="font-mono text-primary text-lg">
                      {formState.primary.radius.toFixed(3)} R⊕
                    </span>
                  </div>
                  <Slider
                    value={[Math.round(((formState.primary.radius - 0.3) / (4.0 - 0.3)) * 1000)]}
                    onValueChange={([v]) => handleRadiusChange(0.3 + (v / 1000) * (4.0 - 0.3))}
                    min={0}
                    max={1000}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-t4">
                    <span>0.3 R⊕</span>
                    <span>4.0 R⊕</span>
                  </div>
                </div>

                {formState.primary.linked && formState.primary.compositionPreset !== "custom" && (
                  <p className="text-xs text-t4 flex items-center gap-1">
                    🔗 Mass and radius linked via {compositionPreset?.label} composition
                    <button
                      onClick={() => {
                        updatePrimary("linked", false);
                        updatePrimary("compositionPreset", "custom");
                      }}
                      className="text-primary hover:underline ml-1"
                    >
                      Unlink
                    </button>
                  </p>
                )}

                {/* Density warning */}
                {result.valid && result.meanDensity > 15 && (
                  <div className="flex items-center gap-2 text-sf-amber text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Density ({result.meanDensity.toFixed(1)} g/cm³) exceeds any known planet, intentional?
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Section 3: Advanced Parameters */}
            <CollapsibleSection
              id="advanced"
              title="Advanced Parameters"
              levelNumber={3}
              guidance={SECTION_HELPERS["advanced"]}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Surface Temperature</Label>
                    <span className="font-mono text-primary">{formState.advanced.surfaceTemp} K</span>
                  </div>
                  <Slider
                    value={[formState.advanced.surfaceTemp]}
                    onValueChange={([v]) =>
                      setFormState((prev) => ({ ...prev, advanced: { ...prev.advanced, surfaceTemp: v } }))
                    }
                    min={50}
                    max={1000}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-t4">
                    <span>50 K</span>
                    <span>288 K (Earth)</span>
                    <span>1000 K</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Atmospheric Molecular Weight</Label>
                  <Select value={formState.advanced.molecularWeightPreset} onValueChange={handleAtmosphericPresetChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATMOSPHERIC_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.label} ({p.molecularWeight} g/mol)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formState.advanced.molecularWeightPreset === "custom" && (
                    <Input
                      type="number"
                      value={formState.advanced.molecularWeight}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          advanced: { ...prev.advanced, molecularWeight: Number(e.target.value) || 29 },
                        }))
                      }
                      min={1}
                      max={100}
                      placeholder="Molecular weight (g/mol)"
                    />
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Results Dashboard */}
            <CollapsibleSection
              id="results"
              title="Results"
              levelNumber={4}
              guidance={SECTION_HELPERS["results"]}
              defaultOpen
            >
              {result.valid && (
                <div className="space-y-6">
                  {/* Big gravity readout, display-font hero */}
                  <div className="text-center py-6">
                    <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-sf-amber mb-3">// SURFACE GRAVITY</p>
                    <div className="font-display font-light text-6xl md:text-7xl tracking-[0.02em] text-sf-amber">
                      {formatGravity(result.gravity)}
                    </div>
                    <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-t4 mt-2">
                      {result.gravityMs2.toFixed(2)} M/S²
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Badge className={`${result.regimeColor}`}>
                        {result.regimeLabel}
                      </Badge>
                      {result.deltaV.gravityLocked && (
                        <Badge className="bg-sf-crimson/[0.06] text-sf-crimson border-sf-crimson/[0.15]">
                          GRAVITY-LOCKED
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Data grid, StatGrid primitive */}
                  <StatGrid cols={4}>
                    <StatGrid.Cell
                      label="ESCAPE VELOCITY"
                      value={result.escapeVelocity.toFixed(2)}
                      unit="km/s"
                      accent="amber"
                    />
                    <StatGrid.Cell
                      label="ORBITAL VELOCITY"
                      value={result.orbitalVelocity.toFixed(2)}
                      unit="km/s"
                      accent="amber"
                    />
                    <StatGrid.Cell
                      label="MEAN DENSITY"
                      value={result.meanDensity.toFixed(2)}
                      unit={`g/cm³ · ${result.densityRatio.toFixed(2)}× EARTH`}
                      accent="amber"
                    />
                    <StatGrid.Cell
                      label="Δv TO ORBIT"
                      value={result.deltaV.deltaVToOrbit.toFixed(1)}
                      unit={`km/s · ${result.deltaV.earthComparison.toFixed(2)}× EARTH`}
                      accent="amber"
                    />
                  </StatGrid>

                  <div className="flex justify-end">
                    <Button variant="sf-ghost" size="sf-sm" onClick={handleCopyResults} className="gap-1.5">
                      <Copy className="w-3.5 h-3.5" />
                      COPY RESULTS
                    </Button>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Section 5: Weight Comparisons */}
            <CollapsibleSection
              id="weight-comparisons"
              title="Weight Comparisons"
              levelNumber={5}
              guidance={SECTION_HELPERS["weight-comparisons"]}
            >
              {result.valid && (
                <div className="space-y-6">
                  <StatGrid cols={4}>
                    <StatGrid.Cell
                      label="70 KG HUMAN WEIGHS"
                      value={result.humanWeight.planetWeightKg.toFixed(1)}
                      unit="kg"
                      accent="amber"
                    />
                    <StatGrid.Cell
                      label="2M DROP TIME"
                      value={result.dropTime.toFixed(2)}
                      unit={`s · IMPACT ${result.dropSpeed.toFixed(1)} km/h`}
                      accent="amber"
                    />
                    <StatGrid.Cell
                      label="HIGH JUMP (2M ON EARTH)"
                      value={result.jumpHeight.toFixed(2)}
                      unit="m"
                      accent="amber"
                    />
                    <StatGrid.Cell
                      label="TERMINAL VELOCITY"
                      value={`~${result.terminalVelocity.toFixed(0)}`}
                      unit="km/h"
                      accent="amber"
                    />
                  </StatGrid>

                  {/* Ball Drop Animation */}
                  <BallDropAnimation earthG={9.80665} planetG={result.gravityMs2} planetLabel={`${result.gravity.toFixed(2)}g`} />
                </div>
              )}
            </CollapsibleSection>

            {/* Section 6: Atmospheric Retention */}
            <CollapsibleSection
              id="atmospheric-retention"
              title="Atmospheric Retention"
              levelNumber={6}
              guidance={SECTION_HELPERS["atmospheric-retention"]}
            >
              {result.valid && (
                <AtmosphericRetentionChart retentionData={result.gasRetention} />
              )}
            </CollapsibleSection>

            {/* Section 7: Delta-V to Orbit */}
            <CollapsibleSection
              id="delta-v"
              title="Delta-V to Orbit"
              levelNumber={7}
              guidance={SECTION_HELPERS["delta-v"]}
            >
              {result.valid && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-3xl text-primary">
                      {result.deltaV.deltaVToOrbit.toFixed(1)} km/s
                    </div>
                    <Badge className={result.deltaV.verdict.color}>
                      {result.deltaV.verdict.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-t3">{result.deltaV.verdict.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <GlassPanel className="p-3">
                      <div className="text-xs text-t4 mb-1">vs Earth (9.4 km/s)</div>
                      <div className="font-mono text-lg">{result.deltaV.earthComparison.toFixed(2)}×</div>
                    </GlassPanel>
                    <GlassPanel className="p-3">
                      <div className="text-xs text-t4 mb-1">Chemical Rocket Mass Ratio</div>
                      <div className="font-mono text-lg">
                        {result.deltaV.massRatio > 10000 ? "∞" : result.deltaV.massRatio.toFixed(1)}:1
                      </div>
                    </GlassPanel>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Section 8: Visualization */}
            <CollapsibleSection
              id="visualization"
              title="Visualization"
              levelNumber={8}
              guidance={SECTION_HELPERS["visualization"]}
            >
              {result.valid && (
                <div className="space-y-6">
                  <PlanetSizeComparison
                    planetRadiusEarth={formState.primary.radius}
                    planetGravity={result.gravity}
                    planetName={PLANET_PRESETS.find((p) => p.id === formState.primary.planetPreset)?.label || "Your Planet"}
                    compositionColor={compositionPreset?.color || "#00D4FF"}
                  />
                  <GravityScaleBar gravityRatio={result.gravity} />
                </div>
              )}
            </CollapsibleSection>

            {/* Section 9: Worldbuilding Cascade */}
            <CollapsibleSection
              id="worldbuilding-cascade"
              title="Worldbuilding Cascade"
              levelNumber={9}
              guidance={SECTION_HELPERS["worldbuilding-cascade"]}
              defaultOpen
            >
              <Tabs defaultValue="biology" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  {CASCADE_CONTENT.map((cat) => {
                    const Icon = CASCADE_ICONS[cat.id as keyof typeof CASCADE_ICONS];
                    return (
                      <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5 text-xs sm:text-sm">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{cat.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {CASCADE_CONTENT.map((cat) => {
                  const block = cat.blocks.find((b) => b.regime === result.gravityRegime) || cat.blocks[2]; // fallback to earthlike
                  const noteKey = cat.id as keyof typeof formState.cascade;

                  return (
                    <TabsContent key={cat.id} value={cat.id} className="space-y-4 mt-4">
                      <h3 className="font-heading text-[11px] font-light uppercase tracking-[3px] text-[hsl(var(--sf-section-green))]">{block.heading}</h3>

                      {block.paragraphs.map((p, i) => (
                        <p key={i} className="text-sm text-t3 leading-relaxed">{p}</p>
                      ))}

                      {block.prompts.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs uppercase tracking-wider text-t2">Writing Prompts</Label>
                          {block.prompts.map((prompt, i) => (
                            <p key={i} className="text-sm text-primary/80 italic">• {prompt}</p>
                          ))}
                        </div>
                      )}

                      <div className="pt-4 space-y-2">
                        <Label>Your Notes, {cat.label}</Label>
                        <Suspense fallback={<div className="min-h-[100px] bg-muted/30 animate-pulse rounded-none" />}>
                          <RichTextEditor
                            content={formState.cascade[noteKey]}
                            onChange={(val) =>
                              setFormState((prev) => ({
                                ...prev,
                                cascade: { ...prev.cascade, [noteKey]: val },
                              }))
                            }
                            placeholder={`How does ${cat.label.toLowerCase()} manifest in your world?`}
                            minHeight="100px"
                          />
                        </Suspense>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CollapsibleSection>

            {/* Section 10: Story Notes */}
            <CollapsibleSection
              id="story-notes"
              title="Story Notes"
              levelNumber={10}
              guidance={SECTION_HELPERS["story-notes"]}
            >
              <div className="space-y-6">
                {[
                  { key: "physicalExperience", label: "Physical Experience", placeholder: "What does it feel like to exist at this gravity? The weight of your own body, the effort of standing, the impact of sitting down..." },
                  { key: "dailyLife", label: "Daily Life Impact", placeholder: "How does gravity shape mundane activities? Cooking, sleeping, transportation, sports..." },
                  { key: "architecture", label: "Architectural Consequences", placeholder: "How are buildings, cities, and infrastructure designed? What's structurally possible or impossible?" },
                  { key: "culturalIdentity", label: "Cultural Identity", placeholder: "How does gravity shape identity, values, and social structure? What do they take for granted that we wouldn't?" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Suspense fallback={<div className="min-h-[100px] bg-muted/30 animate-pulse rounded-none" />}>
                      <RichTextEditor
                        content={formState.storyNotes[key as keyof typeof formState.storyNotes]}
                        onChange={(val) =>
                          setFormState((prev) => ({
                            ...prev,
                            storyNotes: { ...prev.storyNotes, [key]: val },
                          }))
                        }
                        placeholder={placeholder}
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* Desktop Sidebar */}
          <ToolSidebar>
            <SectionNavigation sections={SURFACE_GRAVITY_SECTIONS} mode="inline" />
            <KeyChoicesSidebar sections={keyChoicesSections} mode="inline" />
          </ToolSidebar>
        </div>

        {/* Mobile navigation */}
        <MobileSectionNav sections={SURFACE_GRAVITY_SECTIONS} />
        <MobileKeyChoices sections={keyChoicesSections} />
      {/* Dialogs */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Atlas"
        worldName={worldNameForExport}
        worksheetTitle={currentWorksheetTitle || undefined}
        formState={formState}
        summaryTemplate={
          <SurfaceGravitySummaryTemplate formState={formState} worldName={worldNameForExport} />
        }
        fullTemplate={
          <SurfaceGravityFullReportTemplate formState={formState} worldName={worldNameForExport} />
        }
        defaultFilename="surface-gravity"
      />

      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          entityType="worksheet"
          entityId={(currentWorksheetId || worksheetId)!}
          entityTitle={currentWorksheetTitle || "Surface Gravity Calculator"}
        />
      )}

      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId || ""}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Atlas"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        notes={formState.generalNotes}
        onNotesChange={(val) => setFormState((prev) => ({ ...prev, generalNotes: val }))}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        images={formState.moodboard}
        onImagesChange={(images) => setFormState((prev) => ({ ...prev, moodboard: images }))}
        worksheetId={currentWorksheetId || worksheetId || undefined}
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default SurfaceGravityCalculator;
