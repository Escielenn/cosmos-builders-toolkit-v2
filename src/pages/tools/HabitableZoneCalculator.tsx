import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";
import { logToSlider, sliderToLog } from "@/lib/sliders";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Copy,
  Sun,
  Globe,
  Thermometer,
  Orbit,
  BookOpen,
  Import,
  ChevronDown,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, {
  KeyChoicesSection,
  MobileKeyChoices,
} from "@/components/tools/KeyChoicesSidebar";
import SectionNavigation, { Section, MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
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
  HZSummaryTemplate,
  HZFullReportTemplate,
} from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import OrbitalDiagram from "@/components/tools/OrbitalDiagram";

import {
  STAR_PRESETS,
  SPECTRAL_COLORS,
  SECTION_HELPERS,
  ZONE_COLORS,
  getSpectralDefaults,
} from "@/lib/habitable-zone/data";
import {
  calculateHabitableZone,
  buildCopyText,
  luminosityFromMass,
  equilibriumTemperature,
  estimatedSurfaceTemperature,
  formatTemperature,
} from "@/lib/habitable-zone/calculations";
import type { FormStateForCalc } from "@/lib/habitable-zone/calculations";

// ─── FormState ───────────────────────────────────────────────────────

interface FormState extends FormStateForCalc {
  storyNotes: {
    starDescription: string;
    planetSetting: string;
    habitabilityNarrative: string;
    worldbuildingNotes: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  star: {
    presetId: "sol",
    spectralType: "G",
    mass: 1.0,
    luminosity: 1.0,
    temperature: 5778,
    autoLuminosity: true,
  },
  planet: {
    orbitalDistance: 1.0,
    name: "",
    greenhouseWarming: 33,
  },
  storyNotes: {
    starDescription: "",
    planetSetting: "",
    habitabilityNarrative: "",
    worldbuildingNotes: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "habitable-zone-calculator";
const LOCAL_STORAGE_KEY = "habitable-zone-calculator-v1";

const SECTIONS: Section[] = [
  { id: "section-star", title: "Define Your Star" },
  { id: "section-diagram", title: "Orbital Diagram" },
  { id: "section-planet", title: "Planet Placement" },
  { id: "section-results", title: "Results" },
  { id: "section-implications", title: "Implications" },
  { id: "section-story", title: "Story Notes" },
];

// ─── Zone Color Helper ──────────────────────────────────────────────

const ZONE_BADGE_STYLES: Record<string, string> = {
  "#E74C3C": "bg-red-500/20 text-red-400 border-red-500/30",
  "#FFA500": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "#2ECC71": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "#4D9FFF": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "#ADD8E6": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const SPECTRAL_LABELS = ["O", "B", "A", "F", "G", "K", "M"];

// ─── Component ───────────────────────────────────────────────────────

const HabitableZoneCalculator = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [additionalPlanets, setAdditionalPlanets] = useState<{ name: string; distanceAU: number }[]>([]);
  const [importOpen, setImportOpen] = useState(false);
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);

  // Star System worksheets for planet import
  const { data: starSystemWorksheets = [] } = useWorksheetsByType(worldId || undefined, "star-system-builder");

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // Load existing worksheet from Supabase
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
        toast({
          title: "Worksheet Loaded",
          description: "Your saved work has been restored from the cloud.",
        });
      } catch {
        // Ignore parse errors
      }
    }
  }, [existingWorksheet]);

  // Fallback to localStorage if no worldId
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          setFormState(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId, worksheetId]);

  // ─── Computed Results ──────────────────────────────────────────────

  const result = useMemo(() => {
    return calculateHabitableZone(formState);
  }, [
    formState.star.mass,
    formState.star.luminosity,
    formState.star.temperature,
    formState.star.spectralType,
    formState.star.autoLuminosity,
    formState.planet.orbitalDistance,
    formState.planet.greenhouseWarming,
  ]);

  // ─── Key Choices Sidebar ───────────────────────────────────────────

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    return [
      {
        id: "star",
        title: "1. Star",
        choices: [
          { label: "Type", value: formState.star.spectralType },
          { label: "Mass", value: `${formState.star.mass.toFixed(3)} M\u2609` },
          { label: "Luminosity", value: `${formState.star.luminosity.toFixed(4)} L\u2609` },
        ],
      },
      {
        id: "hz",
        title: "2. Habitable Zone",
        choices: [
          { label: "Inner Edge", value: result.valid ? result.innerEdgeRunawayFormatted : undefined },
          { label: "Outer Edge", value: result.valid ? result.outerEdgeMaxGreenhouseFormatted : undefined },
          { label: "Snowline", value: result.valid ? result.snowlineFormatted : undefined },
        ],
      },
      {
        id: "planet",
        title: "3. Planet",
        choices: [
          { label: "Distance", value: `${formState.planet.orbitalDistance.toFixed(3)} AU` },
          { label: "Zone", value: result.valid ? result.zoneName : undefined },
          { label: "Eq. Temp", value: result.valid ? result.equilibriumTempFormatted : undefined },
          { label: "Surface", value: result.valid ? result.estimatedSurfaceTempFormatted : undefined },
          { label: "Year", value: result.valid ? result.orbitalPeriodFormatted : undefined },
        ],
      },
    ];
  }, [formState, result]);

  // ─── Update Helpers ────────────────────────────────────────────────

  const updateStar = (updates: Partial<FormState["star"]>) => {
    setFormState((prev) => {
      const newStar = { ...prev.star, ...updates };
      // Auto-calc luminosity when mass changes and autoLuminosity is on
      if (newStar.autoLuminosity && ("mass" in updates || "autoLuminosity" in updates)) {
        newStar.luminosity = luminosityFromMass(newStar.mass);
      }
      // If any field is manually changed (not from preset), switch to custom
      if (!("presetId" in updates)) {
        newStar.presetId = "custom";
      }
      return { ...prev, star: newStar };
    });
  };

  const updatePlanet = (updates: Partial<FormState["planet"]>) => {
    setFormState((prev) => ({
      ...prev,
      planet: { ...prev.planet, ...updates },
    }));
  };

  const updateStoryNotes = (field: keyof FormState["storyNotes"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      storyNotes: { ...prev.storyNotes, [field]: value },
    }));
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = STAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      star: {
        presetId: preset.id,
        spectralType: preset.spectralType,
        mass: preset.mass,
        luminosity: preset.luminosity,
        temperature: preset.temperature,
        autoLuminosity: preset.id !== "custom",
      },
    }));
  };

  const handleSpectralTypeChange = (type: string) => {
    const defaults = getSpectralDefaults(type);
    if (defaults) {
      updateStar({
        presetId: "custom",
        spectralType: type,
        mass: defaults.mass,
        luminosity: defaults.luminosity,
        temperature: defaults.temperature,
      });
    } else {
      updateStar({ spectralType: type, presetId: "custom" });
    }
  };

  // ─── Save / Load / Export ──────────────────────────────────────────

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
          toast({
            title: "Error",
            description: "Please select or create a worksheet first.",
            variant: "destructive",
          });
        }
      } catch {
        // Error handled by mutation
      }
    } else {
      toast({ title: "Draft Saved", description: "Your work has been saved locally." });
    }
  };

  const handleWorksheetSelect = (selectedWorksheetId: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: selectedWorksheetId });
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const worksheetData = initialFormState as unknown as Json;
    const wsResult = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: worksheetData,
    });
    setCurrentWorksheetId(wsResult.id);
    setCurrentWorksheetTitle(wsResult.title);
    setSearchParams({ worldId: worldId!, worksheetId: wsResult.id });
    return wsResult.id;
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

  const handleCopyResults = () => {
    if (!result.valid) return;
    const text = buildCopyText(result, formState);
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Results copied to clipboard." });
  };

  const worldNameForExport = worldId ? worldName : undefined;
  const zoneColor = result.valid ? ZONE_COLORS[result.planetZone] : "#2ECC71";
  const zoneBadgeStyle = ZONE_BADGE_STYLES[zoneColor] || "bg-emerald-500/20 text-emerald-400";

  // Get known planets for the current preset + user-added planets
  const currentPreset = STAR_PRESETS.find((p) => p.id === formState.star.presetId);
  const allKnownPlanets = [
    ...(currentPreset?.knownPlanets || []),
    ...additionalPlanets.filter((p) => p.distanceAU > 0),
  ];

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
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
          toolName="Goldilocks"
          worldName={worldNameForExport}
          formState={formState}
          summaryTemplate={<HZSummaryTemplate formState={formState} worldName={worldNameForExport} />}
          fullTemplate={<HZFullReportTemplate formState={formState} worldName={worldNameForExport} />}
          defaultFilename="habitable-zone"
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
        {/* Introduction */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] mb-4 gradient-text">
            The Goldilocks Zone
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "The highest function of ecology is the understanding of consequences."
            <span className="block text-sm text-tier-3 mt-1">— Frank Herbert, Dune</span>
          </blockquote>
          <p className="text-tier-2">
            Define your host star and place your planet. See instantly where it falls relative to the
            habitable zone — and what that means for climate, biology, psychology, mythology, and culture.
            All calculations use Kopparapu et al. (2013) habitable zone boundaries.
          </p>
        </GlassPanel>

        {/* Your Planet — name + import from star system */}
        <GlassPanel className="p-4 md:p-6 mb-8">
          <h2 className="font-heading text-[11px] font-light uppercase tracking-[3px] text-[hsl(var(--sf-section-green))] mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Your Planet
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="planet-name-top">Planet Name</Label>
              <Input
                id="planet-name-top"
                value={formState.planet.name}
                onChange={(e) => updatePlanet({ name: e.target.value })}
                placeholder="e.g., Kepler-442b, Arrakis, Winter..."
              />
            </div>
            {worldId && starSystemWorksheets.length > 0 && (
              <div className="sm:w-48 space-y-2">
                <Label>Import from Star System</Label>
                <button
                  type="button"
                  onClick={() => setImportOpen(!importOpen)}
                  className="w-full h-10 px-3 flex items-center justify-between gap-2 rounded-xs border border-border bg-muted/30 text-sm text-tier-2 hover:border-primary/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Import className="w-3.5 h-3.5 text-tier-4" />
                    Import
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-tier-4 transition-transform ${importOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>

          {/* Import body picker */}
          {importOpen && worldId && starSystemWorksheets.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs text-tier-4 mb-3">Select a body from your Star System worksheets:</p>
              <div className="space-y-3">
                {starSystemWorksheets.map((ws) => {
                  const wsData = ws.data as Record<string, unknown> | null;
                  const bodies = (wsData?.bodies as { id: string; name: string; distanceFromStar: string }[] | undefined) || [];
                  if (bodies.length === 0) return null;
                  return (
                    <div key={ws.id}>
                      <div className="text-xs font-medium text-tier-3 mb-1.5">{ws.title}</div>
                      <div className="flex flex-wrap gap-2">
                        {bodies.map((body) => {
                          const dist = parseFloat(body.distanceFromStar);
                          if (!dist || dist <= 0) return null;
                          return (
                            <button
                              key={body.id}
                              type="button"
                              onClick={() => {
                                updatePlanet({ name: body.name, orbitalDistance: dist });
                                setImportOpen(false);
                                toast({ title: "Imported", description: `${body.name} at ${dist} AU` });
                              }}
                              className="px-3 py-1.5 rounded-sm border border-border text-xs hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            >
                              <span className="text-tier-1">{body.name}</span>
                              <span className="text-tier-4 ml-2">{dist} AU</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Mobile Sidebars - Right side floating buttons */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} />
        </div>

        {/* Main layout: content + sidebar */}
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Section 1: Define Your Star */}
            <CollapsibleSection
              id="section-star"
              title="Define Your Star"
              subtitle="Choose a preset or customize stellar parameters"
              levelNumber={1}
              icon={<Sun className="w-5 h-5" />}
              defaultOpen={true}
            >
              <p className="text-sm text-tier-3 italic mb-6">{SECTION_HELPERS.star}</p>

              {/* Star Presets */}
              <div className="space-y-2 mb-6">
                <Label>Star Presets</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formState.star.presetId === preset.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted/50 text-tier-2"
                      }`}
                    >
                      <div className="font-medium text-sm">{preset.label}</div>
                      <div className="text-xs text-tier-4 mt-0.5 line-clamp-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spectral Type */}
              <div className="space-y-2 mb-6">
                <Label>Spectral Type</Label>
                <div className="flex gap-1">
                  {SPECTRAL_LABELS.map((type) => {
                    const colors = SPECTRAL_COLORS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => handleSpectralTypeChange(type)}
                        className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                          formState.star.spectralType === type
                            ? "ring-2 ring-primary"
                            : "hover:opacity-80"
                        }`}
                        style={{
                          backgroundColor: `${colors.fill}20`,
                          color: colors.fill,
                          border: `1px solid ${colors.fill}40`,
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Mass */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <Label>Star Mass</Label>
                  <span className="text-sm font-mono text-primary">
                    {formState.star.mass.toFixed(3)} M&#x2609;
                  </span>
                </div>
                <Slider
                  value={[logToSlider(formState.star.mass, 0.08, 50)]}
                  min={0}
                  max={1000}
                  step={1}
                  onValueChange={([v]) => updateStar({ mass: sliderToLog(v, 0.08, 50) })}
                  aria-label="Star mass in solar masses"
                />
                <div className="flex justify-between text-xs text-tier-4">
                  <span>0.08 M&#x2609;</span>
                  <span>50 M&#x2609;</span>
                </div>
              </div>

              {/* Star Luminosity */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <Label>Star Luminosity</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-tier-4 cursor-pointer">
                      <Switch
                        checked={formState.star.autoLuminosity}
                        onCheckedChange={(checked) => updateStar({ autoLuminosity: checked })}
                      />
                      Auto from mass
                    </label>
                    <span className="text-sm font-mono text-primary">
                      {formState.star.luminosity < 0.01
                        ? formState.star.luminosity.toExponential(2)
                        : formState.star.luminosity.toFixed(4)} L&#x2609;
                    </span>
                  </div>
                </div>
                <Slider
                  value={[logToSlider(formState.star.luminosity, 0.0001, 100000)]}
                  min={0}
                  max={1000}
                  step={1}
                  onValueChange={([v]) => {
                    if (!formState.star.autoLuminosity) {
                      updateStar({ luminosity: sliderToLog(v, 0.0001, 100000) });
                    }
                  }}
                  disabled={formState.star.autoLuminosity}
                  aria-label="Star luminosity in solar luminosities"
                />
                <div className="flex justify-between text-xs text-tier-4">
                  <span>0.0001 L&#x2609;</span>
                  <span>100,000 L&#x2609;</span>
                </div>
              </div>

              {/* Star Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Surface Temperature</Label>
                  <span className="text-sm font-mono text-primary">
                    {Math.round(formState.star.temperature).toLocaleString()} K
                  </span>
                </div>
                <Slider
                  value={[logToSlider(formState.star.temperature, 2000, 50000)]}
                  min={0}
                  max={1000}
                  step={1}
                  onValueChange={([v]) => updateStar({ temperature: sliderToLog(v, 2000, 50000) })}
                  aria-label="Star surface temperature in Kelvin"
                />
                <div className="flex justify-between text-xs text-tier-4">
                  <span>2,000 K</span>
                  <span>50,000 K</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 2: Orbital Diagram (always visible, hero element) */}
            <div id="section-diagram">
              <GlassPanel className="p-4 md:p-6">
                <h2 className="font-heading text-[11px] font-light uppercase tracking-[3px] text-[hsl(var(--sf-section-green))] mb-4 flex items-center gap-2">
                  <Orbit className="w-5 h-5 text-primary" />
                  Orbital Diagram
                </h2>
                <OrbitalDiagram
                  spectralType={formState.star.spectralType}
                  starMass={formState.star.mass}
                  innerRecentVenus={result.valid ? result.hz.recentVenus : 0}
                  innerRunaway={result.valid ? result.hz.runawayGreenhouse : 0}
                  outerMaxGreenhouse={result.valid ? result.hz.maxGreenhouse : 0}
                  outerEarlyMars={result.valid ? result.hz.earlyMars : 0}
                  snowline={result.valid ? result.hz.snowline : 0}
                  planetDistance={formState.planet.orbitalDistance}
                  planetName={formState.planet.name || "Planet"}
                  knownPlanets={allKnownPlanets.length > 0 ? allKnownPlanets : undefined}
                  className="h-[350px] md:h-[450px] lg:h-[500px]"
                />
                {/* Planet distance slider under diagram */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Planet Orbital Distance</Label>
                    <span className="text-sm font-mono text-primary">
                      {formState.planet.orbitalDistance.toFixed(3)} AU
                    </span>
                  </div>
                  <Slider
                    value={[logToSlider(formState.planet.orbitalDistance, 0.01, 100)]}
                    min={0}
                    max={1000}
                    step={1}
                    onValueChange={([v]) => updatePlanet({ orbitalDistance: sliderToLog(v, 0.01, 100) })}
                    aria-label="Planet orbital distance in AU"
                  />
                  <div className="flex justify-between text-xs text-tier-4">
                    <span>0.01 AU</span>
                    <span>100 AU</span>
                  </div>
                </div>

                {/* Live temperature readout — connected to distance slider */}
                {result.valid && (
                  <div className="mt-4 rounded-sm border p-3" style={{ borderColor: `${zoneColor}30`, backgroundColor: `${zoneColor}08` }}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-tier-4">Equilibrium</div>
                        <div className="text-lg font-mono font-light" style={{ color: zoneColor }}>
                          {result.equilibriumTempFormatted}
                        </div>
                      </div>
                      <div className="text-tier-4 text-lg">→</div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-tier-4">Est. Surface (+{formState.planet.greenhouseWarming ?? 33} K)</div>
                        <div className="text-lg font-mono font-light text-tier-1">
                          {result.estimatedSurfaceTempFormatted}
                        </div>
                      </div>
                      <Badge variant="outline" className={zoneBadgeStyle}>
                        {result.zoneName}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Greenhouse warming slider */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Greenhouse Warming</Label>
                    <span className="text-sm font-mono text-primary">
                      +{formState.planet.greenhouseWarming ?? 33} K
                    </span>
                  </div>
                  <Slider
                    value={[formState.planet.greenhouseWarming ?? 33]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updatePlanet({ greenhouseWarming: v })}
                    aria-label="Greenhouse warming in Kelvin"
                  />
                  <div className="flex justify-between text-xs text-tier-4">
                    <span>0 K (none)</span>
                    <span>100 K (extreme)</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { label: "None", value: 0 },
                      { label: "Mars ~5K", value: 5 },
                      { label: "Earth ~33K", value: 33 },
                      { label: "Dense ~60K", value: 60 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => updatePlanet({ greenhouseWarming: preset.value })}
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-mono border transition-colors ${
                          (formState.planet.greenhouseWarming ?? 33) === preset.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-tier-4 hover:border-primary/50"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Section 3: Planet Placement */}
            <CollapsibleSection
              id="section-planet"
              title="Planet Placement"
              subtitle="Position your world and see where it falls"
              levelNumber={3}
              icon={<Globe className="w-5 h-5" />}
              defaultOpen={true}
            >
              <p className="text-sm text-tier-3 italic mb-6">{SECTION_HELPERS.planet}</p>

              <div className="space-y-6">
                {/* Zone Classification */}
                {result.valid && (
                  <GlassPanel className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Zone Classification</span>
                      <Badge variant="outline" className={zoneBadgeStyle}>
                        {result.zoneName}
                      </Badge>
                    </div>
                    {result.percentThroughHZ >= 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-tier-4">
                          <span>Inner Edge</span>
                          <span>{Math.round(result.percentThroughHZ)}% through HZ</span>
                          <span>Outer Edge</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.max(2, Math.min(100, result.percentThroughHZ))}%`,
                              backgroundColor: zoneColor,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </GlassPanel>
                )}

                {/* Additional Planets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Additional Planets</Label>
                    <button
                      type="button"
                      onClick={() => setAdditionalPlanets((prev) => [...prev, { name: `Planet ${prev.length + 2}`, distanceAU: 1.0 }])}
                      className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
                    >
                      + Add Planet
                    </button>
                  </div>
                  {additionalPlanets.length === 0 && (
                    <p className="text-xs text-tier-4 italic">Add planets to compare positions on the orbital diagram.</p>
                  )}
                  {additionalPlanets.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={p.name}
                        onChange={(e) => {
                          const next = [...additionalPlanets];
                          next[i] = { ...next[i], name: e.target.value };
                          setAdditionalPlanets(next);
                        }}
                        className="w-28 text-xs h-8"
                        placeholder="Name"
                      />
                      <Input
                        type="number"
                        value={p.distanceAU}
                        onChange={(e) => {
                          const next = [...additionalPlanets];
                          next[i] = { ...next[i], distanceAU: Math.max(0.001, parseFloat(e.target.value) || 0.001) };
                          setAdditionalPlanets(next);
                        }}
                        className="w-24 text-xs h-8 font-mono"
                        step={0.01}
                        min={0.001}
                      />
                      <span className="text-xs text-tier-4">AU</span>
                      <button
                        type="button"
                        onClick={() => setAdditionalPlanets((prev) => prev.filter((_, j) => j !== i))}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-auto"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Analysis Results (always visible) */}
            <div id="section-results">
              <GlassPanel className="p-4 md:p-6">
                <h2 className="font-heading text-[11px] font-light uppercase tracking-[3px] text-[hsl(var(--sf-section-green))] mb-4 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-primary" />
                  Analysis Results
                </h2>
                <p className="text-sm text-tier-3 italic mb-6">{SECTION_HELPERS.results}</p>

                {result.valid ? (
                  <div className="space-y-6">
                    {/* Hero: Temperature Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-center p-5 rounded-sm bg-muted/30">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-tier-4 mb-1">
                          Equilibrium Temperature
                        </div>
                        <div className="text-3xl font-mono font-light" style={{ color: zoneColor }}>
                          {Math.round(result.equilibriumTemp)} K
                        </div>
                        <div className="text-sm text-tier-3 mt-1">
                          ({Math.round(result.equilibriumTemp - 273.15)}&deg;C)
                        </div>
                        <div className="text-[10px] text-tier-5 mt-2">No atmosphere</div>
                      </div>
                      <div className="text-center p-5 rounded-sm bg-muted/30 border border-primary/10">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-tier-4 mb-1">
                          Est. Surface Temperature
                        </div>
                        <div className="text-3xl font-mono font-light text-tier-1">
                          {Math.round(result.estimatedSurfaceTemp)} K
                        </div>
                        <div className="text-sm text-tier-3 mt-1">
                          ({Math.round(result.estimatedSurfaceTemp - 273.15)}&deg;C)
                        </div>
                        <div className="text-[10px] text-tier-5 mt-2">+{formState.planet.greenhouseWarming ?? 33} K greenhouse</div>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-tier-4 uppercase tracking-wider">Stellar Flux</div>
                        <div className="text-lg font-mono">{result.stellarFluxFormatted}</div>
                        <div className="text-xs text-tier-4">Earth = 1.0</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-tier-4 uppercase tracking-wider">Year Length</div>
                        <div className="text-lg font-mono">{result.orbitalPeriodFormatted}</div>
                      </div>
                    </div>

                    {/* HZ Boundaries */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Habitable Zone Boundaries</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-tier-2">Recent Venus (optimistic inner)</span>
                          <span className="font-mono">{result.innerEdgeRecentVenusFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tier-2">Runaway Greenhouse (conservative)</span>
                          <span className="font-mono">{result.innerEdgeRunawayFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tier-2">Maximum Greenhouse (conservative)</span>
                          <span className="font-mono">{result.outerEdgeMaxGreenhouseFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tier-2">Early Mars (optimistic outer)</span>
                          <span className="font-mono">{result.outerEdgeEarlyMarsFormatted}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 mt-2">
                          <span className="text-tier-2">Snowline (frost line)</span>
                          <span className="font-mono">{result.snowlineFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tier-2">Conservative HZ Width</span>
                          <span className="font-mono">{result.conservativeWidthFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tier-2">Optimistic HZ Width</span>
                          <span className="font-mono">{result.optimisticWidthFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Narrative */}
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Narrative Summary</h3>
                        <Button variant="ghost" size="sm" onClick={handleCopyResults}>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm text-tier-3 italic">
                        {result.narrativeSummary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-tier-3">{result.error || "Adjust parameters to see results."}</p>
                )}
              </GlassPanel>
            </div>

            {/* Section 5: Worldbuilding Implications */}
            <CollapsibleSection
              id="section-implications"
              title="Worldbuilding Implications"
              subtitle="How orbital position shapes your world"
              levelNumber={5}
              icon={<BookOpen className="w-5 h-5" />}
              defaultOpen={true}
            >
              <p className="text-sm text-tier-3 italic mb-6">{SECTION_HELPERS.implications}</p>

              {result.valid && (
                <div className="space-y-4">
                  {/* Zone Description */}
                  <GlassPanel className="p-4 border-l-4" style={{ borderLeftColor: zoneColor }}>
                    <p className="text-sm">{result.zoneDescription}</p>
                  </GlassPanel>

                  {/* Implication Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.implications.map((impl, i) => {
                      const categoryColors: Record<string, string> = {
                        climate: "border-l-amber-500",
                        biology: "border-l-emerald-500",
                        culture: "border-l-violet-500",
                        technology: "border-l-cyan-500",
                      };
                      const categoryLabels: Record<string, string> = {
                        climate: "Climate",
                        biology: "Biology",
                        culture: "Culture",
                        technology: "Technology",
                      };
                      return (
                        <GlassPanel
                          key={i}
                          className={`p-4 border-l-4 ${categoryColors[impl.category] || ""}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabels[impl.category] || impl.category}
                            </Badge>
                            <span className="text-sm font-medium">{impl.title}</span>
                          </div>
                          <p className="text-xs text-tier-4">{impl.description}</p>
                        </GlassPanel>
                      );
                    })}
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Section 6: Story Notes */}
            <CollapsibleSection
              id="section-story"
              title="Story Notes"
              subtitle="Capture narrative ideas for your world"
              levelNumber={6}
              icon={<FileText className="w-5 h-5" />}
            >
              <p className="text-sm text-tier-3 italic mb-6">{SECTION_HELPERS.story}</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Star Description</Label>
                  <p className="text-xs text-tier-4">How does this star appear from the planet's surface?</p>
                  <Suspense fallback={<div className="h-24 bg-muted rounded animate-pulse" />}>
                    <RichTextEditor
                      content={formState.storyNotes.starDescription}
                      onChange={(val) => updateStoryNotes("starDescription", val)}
                      placeholder="Describe the star as your characters see it..."
                    />
                  </Suspense>
                </div>

                <div className="space-y-2">
                  <Label>Planet Setting</Label>
                  <p className="text-xs text-tier-4">What does daily life look like on this world?</p>
                  <Suspense fallback={<div className="h-24 bg-muted rounded animate-pulse" />}>
                    <RichTextEditor
                      content={formState.storyNotes.planetSetting}
                      onChange={(val) => updateStoryNotes("planetSetting", val)}
                      placeholder="The morning light filters through..."
                    />
                  </Suspense>
                </div>

                <div className="space-y-2">
                  <Label>Habitability Narrative</Label>
                  <p className="text-xs text-tier-4">How does the HZ position shape survival?</p>
                  <Suspense fallback={<div className="h-24 bg-muted rounded animate-pulse" />}>
                    <RichTextEditor
                      content={formState.storyNotes.habitabilityNarrative}
                      onChange={(val) => updateStoryNotes("habitabilityNarrative", val)}
                      placeholder="The struggle to maintain liquid water..."
                    />
                  </Suspense>
                </div>

                <div className="space-y-2">
                  <Label>Worldbuilding Notes</Label>
                  <p className="text-xs text-tier-4">Additional notes for your universe</p>
                  <Suspense fallback={<div className="h-24 bg-muted rounded animate-pulse" />}>
                    <RichTextEditor
                      content={formState.storyNotes.worldbuildingNotes}
                      onChange={(val) => updateStoryNotes("worldbuildingNotes", val)}
                      placeholder="Additional worldbuilding notes..."
                    />
                  </Suspense>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Desktop Sidebars - Right side */}
          <ToolSidebar>
            <SectionNavigation sections={SECTIONS} mode="inline" />
            <KeyChoicesSidebar sections={keyChoicesSections} mode="inline" />
          </ToolSidebar>
        </div>

      {/* Dialogs */}
      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId || ""}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Goldilocks"
        worksheets={existingWorksheets.map((w) => ({
          id: w.id,
          title: w.title,
          updated_at: w.updated_at,
          tags: w.tags || undefined,
        }))}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Goldilocks"
        worldName={worldNameForExport}
        formState={formState}
        summaryTemplate={<HZSummaryTemplate formState={formState} worldName={worldNameForExport} />}
        fullTemplate={<HZFullReportTemplate formState={formState} worldName={worldNameForExport} />}
        defaultFilename="habitable-zone"
      />

      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          worksheetId={(currentWorksheetId || worksheetId)!}
          worksheetTitle={currentWorksheetTitle || "Habitable Zone Calculator"}
          toolType={TOOL_TYPE}
        />
      )}

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        notes={formState.generalNotes}
        onNotesChange={(val) => setFormState((prev) => ({ ...prev, generalNotes: val }))}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        images={formState.moodboard || []}
        onImagesChange={(imgs) => setFormState((prev) => ({ ...prev, moodboard: imgs }))}
        worksheetId={currentWorksheetId || worksheetId || undefined}
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default HabitableZoneCalculator;
