import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Clock,
  Rocket,
  Gauge,
  Radio,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
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
  TimeDilationSummaryTemplate,
  TimeDilationFullReportTemplate,
} from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";

import {
  JOURNEY_PRESETS,
  PROPULSION_METHODS,
  REFERENCE_FRAMES,
  TIME_DILATION_SECTIONS,
  SECTION_HELPERS,
} from "@/lib/time-dilation/data";
import {
  calculateTimeDilation,
  buildCopyText,
  formatDuration,
} from "@/lib/time-dilation/calculations";
import type { FormStateForCalc } from "@/lib/time-dilation/calculations";

// ─── FormState ───────────────────────────────────────────────────────

interface FormState extends FormStateForCalc {
  storyNotes: {
    departureMoment: string;
    timeDilationImpact: string;
    returnExperience: string;
    socialConsequences: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  journey: {
    presetCategory: "",
    presetId: "",
    customDistance: "",
    customDistanceUnit: "ly",
    originName: "",
    destinationName: "",
  },
  propulsion: {
    method: "",
    customMaxVelocity: "",
  },
  velocityProfile: {
    mode: "constant",
    velocityFraction: "",
    gForce: "1",
  },
  referenceFrame: {
    frame: "earth",
    customName: "",
  },
  roundTrip: false,
  alcubierreNoDilation: true,
  storyNotes: {
    departureMoment: "",
    timeDilationImpact: "",
    returnExperience: "",
    socialConsequences: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "time-dilation";
const LOCAL_STORAGE_KEY = "time-dilation-calculator-v1";

// ─── Severity color helpers ──────────────────────────────────────────

const SEVERITY_STYLES = {
  negligible: { text: "text-sf-emerald", border: "border-l-emerald-400", bg: "bg-emerald-400/10" },
  notable: { text: "text-sf-amber", border: "border-l-amber-400", bg: "bg-amber-400/10" },
  significant: { text: "text-orange-500", border: "border-l-orange-500", bg: "bg-orange-500/10" },
  extreme: { text: "text-sf-crimson", border: "border-l-red-500", bg: "bg-red-500/10" },
};

// ─── Logarithmic slider mapping ──────────────────────────────────────

// Maps slider [0..1000] to velocity [0..maxV] on a logarithmic scale
function sliderToVelocity(sliderValue: number, maxV: number): number {
  if (sliderValue <= 0) return 0;
  const t = sliderValue / 1000;
  // Logarithmic mapping: v = maxV * (10^(t*3) - 1) / (10^3 - 1)
  // This gives fine control at high fractions of c
  const v = maxV * (Math.pow(10, t * 3) - 1) / (Math.pow(10, 3) - 1);
  return Math.min(v, maxV);
}

function velocityToSlider(velocity: number, maxV: number): number {
  if (velocity <= 0 || maxV <= 0) return 0;
  const ratio = velocity / maxV;
  // Inverse: t = log10(ratio * (10^3 - 1) + 1) / 3
  const inner = ratio * (Math.pow(10, 3) - 1) + 1;
  if (inner <= 1) return 0;
  const t = Math.log10(inner) / 3;
  return Math.round(t * 1000);
}

// ─── Component ───────────────────────────────────────────────────────

const TimeDilationCalculator = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
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
          description: "WORK RESTORED FROM CLOUD.",
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

  const calculationResult = useMemo(() => {
    return calculateTimeDilation(formState);
  }, [
    formState.journey,
    formState.propulsion,
    formState.velocityProfile,
    formState.roundTrip,
    formState.alcubierreNoDilation,
    formState.referenceFrame,
  ]);

  // Get current propulsion method's max velocity
  const currentMaxVelocity = useMemo(() => {
    if (formState.propulsion.method === "custom") {
      return parseFloat(formState.propulsion.customMaxVelocity) || 0.5;
    }
    const method = PROPULSION_METHODS.find((m) => m.id === formState.propulsion.method);
    return method?.maxVelocityC || 0.5;
  }, [formState.propulsion]);

  // Current journey pairs for selected category
  const currentJourneyPairs = useMemo(() => {
    const category = JOURNEY_PRESETS.find((c) => c.id === formState.journey.presetCategory);
    return category?.pairs || [];
  }, [formState.journey.presetCategory]);

  // Is Alcubierre selected?
  const isAlcubierre = useMemo(() => {
    const method = PROPULSION_METHODS.find((m) => m.id === formState.propulsion.method);
    return method?.isAlcubierre === true;
  }, [formState.propulsion.method]);

  // ─── Key Choices Sidebar ───────────────────────────────────────────

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const method = PROPULSION_METHODS.find((m) => m.id === formState.propulsion.method);
    return [
      {
        id: "journey",
        title: "1. Journey",
        choices: [
          {
            label: "Route",
            value:
              formState.journey.originName && formState.journey.destinationName
                ? `${formState.journey.originName} → ${formState.journey.destinationName}`
                : undefined,
          },
          {
            label: "Round Trip",
            value: formState.roundTrip ? "Yes" : "No",
          },
        ],
      },
      {
        id: "propulsion",
        title: "2. Propulsion",
        choices: [
          { label: "Method", value: method?.label || undefined },
          {
            label: "Max v",
            value: method
              ? method.isAlcubierre
                ? `${method.maxVelocityC}×c (FTL)`
                : `${(method.maxVelocityC * 100).toFixed(3)}% c`
              : undefined,
          },
        ],
      },
      {
        id: "results",
        title: "3. Results",
        choices: [
          {
            label: "γ (Lorentz)",
            value: calculationResult.valid
              ? calculationResult.lorentzFactor.toFixed(4)
              : undefined,
          },
          {
            label: "Ship Time",
            value: calculationResult.valid
              ? calculationResult.shipTimeFormatted
              : undefined,
          },
          {
            label: "Observer Time",
            value: calculationResult.valid
              ? calculationResult.observerTimeFormatted
              : undefined,
          },
          {
            label: "Difference",
            value: calculationResult.valid && calculationResult.timeDifferenceSeconds > 0
              ? calculationResult.timeDifferenceFormatted
              : undefined,
          },
        ],
      },
    ];
  }, [formState, calculationResult]);

  // ─── Update Helpers ────────────────────────────────────────────────

  const updateJourney = (field: keyof FormState["journey"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      journey: { ...prev.journey, [field]: value },
    }));
  };

  const updatePropulsion = (field: keyof FormState["propulsion"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      propulsion: { ...prev.propulsion, [field]: value },
    }));
  };

  const updateVelocityProfile = (field: keyof FormState["velocityProfile"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      velocityProfile: { ...prev.velocityProfile, [field]: value },
    }));
  };

  const updateReferenceFrame = (field: keyof FormState["referenceFrame"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      referenceFrame: { ...prev.referenceFrame, [field]: value },
    }));
  };

  const updateStoryNotes = (field: keyof FormState["storyNotes"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      storyNotes: { ...prev.storyNotes, [field]: value },
    }));
  };

  // When a journey preset is selected, auto-populate origin/destination
  const handleJourneyPairChange = (pairId: string) => {
    const category = JOURNEY_PRESETS.find((c) => c.id === formState.journey.presetCategory);
    const pair = category?.pairs.find((p) => p.id === pairId);
    if (pair) {
      setFormState((prev) => ({
        ...prev,
        journey: {
          ...prev.journey,
          presetId: pairId,
          originName: pair.origin,
          destinationName: pair.destination,
          customDistance: String(pair.distanceLY),
          customDistanceUnit: "ly",
        },
      }));
    }
  };

  // When propulsion method changes, reset velocity slider
  const handlePropulsionChange = (methodId: string) => {
    const method = PROPULSION_METHODS.find((m) => m.id === methodId);
    setFormState((prev) => ({
      ...prev,
      propulsion: {
        ...prev.propulsion,
        method: methodId,
      },
      velocityProfile: {
        ...prev.velocityProfile,
        velocityFraction: method && !method.isAlcubierre
          ? String(method.maxVelocityC)
          : prev.velocityProfile.velocityFraction,
      },
    }));
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
            title: "OPERATION FAILED.",
            description: "SELECT OR CREATE A WORKSHEET BEFORE TRANSMITTING.",
            variant: "destructive",
          });
        }
      } catch {
        // Error handled by mutation
      }
    } else {
      toast({ title: "Draft Saved", description: "WORK SECURED TO LOCAL STORAGE." });
    }
  };

  const handleWorksheetSelect = (selectedWorksheetId: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: selectedWorksheetId });
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const worksheetData = initialFormState as unknown as Json;
    const result = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: worksheetData,
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

  const handleCopyNarrative = () => {
    if (!calculationResult.valid) return;
    const text = buildCopyText(calculationResult, formState);
    navigator.clipboard.writeText(text);
    toast({ title: "COPIED TO CLIPBOARD.", description: "NARRATIVE COPIED TO CLIPBOARD." });
  };

  const worldNameForExport = worldId ? worldName : undefined;
  const severity = calculationResult.valid ? calculationResult.severity : "negligible";
  const sColors = SEVERITY_STYLES[severity];

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
          toolName="Paradox"
          worldName={worldNameForExport}
          formState={formState}
          summaryTemplate={<TimeDilationSummaryTemplate formState={formState} worldName={worldNameForExport} />}
          fullTemplate={<TimeDilationFullReportTemplate formState={formState} worldName={worldNameForExport} />}
          defaultFilename="time-dilation"
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
            Relativistic Time Dilation
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "The faster you travel through space, the slower you travel through time."
          </blockquote>
          <p className="text-t2">
            Calculate how relativistic speeds affect the passage of time for your travelers.
            Choose a journey, select a propulsion method, and see how much time your characters
            lose, or gain, relative to the people they left behind. All calculations use
            special relativity; results update in real time.
          </p>
        </GlassPanel>

        {/* ═══ SECTIONS ═══ */}
        <div className="space-y-6">

          {/* Section 1: Journey */}
          <CollapsibleSection
            id="section-journey"
            title="Define Your Journey"
            subtitle="Where are you going, and how far is it?"
            levelNumber={1}
            icon={<Rocket className="w-5 h-5" />}
            defaultOpen={true}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.journey}</p>
            <div className="space-y-6">
              {/* Category select */}
              <div className="space-y-2">
                <Label>Journey Category</Label>
                <Select
                  value={formState.journey.presetCategory}
                  onValueChange={(val) => {
                    setFormState((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        presetCategory: val,
                        presetId: "",
                        originName: "",
                        destinationName: "",
                        customDistance: "",
                      },
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                  <SelectContent>
                    {JOURNEY_PRESETS.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Journey pair select */}
              {formState.journey.presetCategory && formState.journey.presetCategory !== "custom" && currentJourneyPairs.length > 0 && (
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select
                    value={formState.journey.presetId}
                    onValueChange={handleJourneyPairChange}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a route..." /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{JOURNEY_PRESETS.find((c) => c.id === formState.journey.presetCategory)?.label}</SelectLabel>
                        {currentJourneyPairs.map((pair) => (
                          <SelectItem key={pair.id} value={pair.id}>
                            {pair.origin} → {pair.destination}
                            {pair.annotation && (
                              <span className="text-t2 ml-2">({pair.annotation})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom distance entry */}
              {formState.journey.presetCategory === "custom" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Origin Name</Label>
                      <Input
                        value={formState.journey.originName}
                        onChange={(e) => updateJourney("originName", e.target.value)}
                        placeholder="e.g., Earth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Name</Label>
                      <Input
                        value={formState.journey.destinationName}
                        onChange={(e) => updateJourney("destinationName", e.target.value)}
                        placeholder="e.g., Proxima Centauri"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Distance</Label>
                      <Input
                        type="number"
                        value={formState.journey.customDistance}
                        onChange={(e) => updateJourney("customDistance", e.target.value)}
                        placeholder="Enter distance..."
                        min={0}
                        step="any"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={formState.journey.customDistanceUnit}
                        onValueChange={(val) => updateJourney("customDistanceUnit", val)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ly">Light-years</SelectItem>
                          <SelectItem value="au">AU</SelectItem>
                          <SelectItem value="km">km</SelectItem>
                          <SelectItem value="pc">Parsecs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Round Trip Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={formState.roundTrip}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, roundTrip: checked }))
                  }
                />
                <Label className="cursor-pointer">Calculate Round Trip</Label>
                <span className="text-xs text-t4">
                  (doubles the journey distance)
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: Propulsion */}
          <CollapsibleSection
            id="section-propulsion"
            title="Propulsion System"
            subtitle="What drives your ship?"
            levelNumber={2}
            icon={<Gauge className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.propulsion}</p>
            <div className="space-y-4">
              <RadioGroup
                value={formState.propulsion.method}
                onValueChange={handlePropulsionChange}
                className="grid gap-2 md:grid-cols-2"
              >
                {PROPULSION_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-start gap-3 p-3 rounded-none border border-sf-border hover:border-primary/50 transition-colors"
                  >
                    <RadioGroupItem value={method.id} id={`prop-${method.id}`} className="mt-0.5" />
                    <label htmlFor={`prop-${method.id}`} className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">{method.label}</div>
                      <div className="text-xs text-t4 mt-0.5">
                        {method.isAlcubierre
                          ? `Superluminal (${method.maxVelocityC}×c)`
                          : method.id === "custom"
                            ? "Set your own"
                            : `Max: ${(method.maxVelocityC * 100).toFixed(3)}% c`}
                      </div>
                      <div className="text-xs text-t4/70 mt-0.5 italic">{method.note}</div>
                    </label>
                  </div>
                ))}
              </RadioGroup>

              {/* Custom max velocity */}
              {formState.propulsion.method === "custom" && (
                <div className="space-y-2 pt-2">
                  <Label>Maximum Velocity (fraction of c)</Label>
                  <Input
                    type="number"
                    value={formState.propulsion.customMaxVelocity}
                    onChange={(e) => updatePropulsion("customMaxVelocity", e.target.value)}
                    placeholder="e.g., 0.5"
                    min={0}
                    max={0.9999}
                    step={0.001}
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 3: Velocity Profile */}
          <CollapsibleSection
            id="section-velocity"
            title="Velocity Profile"
            subtitle="How does your ship reach cruising speed?"
            levelNumber={3}
            icon={<Clock className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.velocity}</p>
            <div className="space-y-6">
              <RadioGroup
                value={formState.velocityProfile.mode}
                onValueChange={(val) => updateVelocityProfile("mode", val)}
                className="grid gap-3 md:grid-cols-2"
              >
                <div className="flex items-start gap-3 p-4 rounded-none border border-sf-border hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="constant" id="vp-constant" className="mt-0.5" />
                  <label htmlFor="vp-constant" className="cursor-pointer">
                    <div className="font-medium text-sm">Constant Velocity</div>
                    <div className="text-xs text-t4 mt-1">
                      Instantaneous acceleration to cruising speed. Simple, clean math.
                    </div>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-none border border-sf-border hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="brachistochrone" id="vp-brach" className="mt-0.5" />
                  <label htmlFor="vp-brach" className="cursor-pointer">
                    <div className="font-medium text-sm">Brachistochrone</div>
                    <div className="text-xs text-t4 mt-1">
                      Accelerate halfway, decelerate the rest. Realistic flight profile.
                    </div>
                  </label>
                </div>
              </RadioGroup>

              {/* Constant velocity slider */}
              {formState.velocityProfile.mode === "constant" && formState.propulsion.method && !isAlcubierre && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Travel Velocity</Label>
                    <span className="font-mono text-sm text-primary">
                      {parseFloat(formState.velocityProfile.velocityFraction)
                        ? `${(parseFloat(formState.velocityProfile.velocityFraction) * 100).toFixed(4)}% c`
                        : "-"}
                    </span>
                  </div>
                  <Slider
                    value={[velocityToSlider(
                      parseFloat(formState.velocityProfile.velocityFraction) || 0,
                      currentMaxVelocity
                    )]}
                    onValueChange={([val]) => {
                      const v = sliderToVelocity(val, currentMaxVelocity);
                      updateVelocityProfile("velocityFraction", v.toPrecision(6));
                    }}
                    min={0}
                    max={1000}
                    step={1}
                    aria-label="Travel velocity"
                  />
                  <div className="flex justify-between text-xs text-t4">
                    <span>0</span>
                    <span>Max: {(currentMaxVelocity * 100).toFixed(3)}% c</span>
                  </div>
                </div>
              )}

              {/* Brachistochrone g-force slider */}
              {formState.velocityProfile.mode === "brachistochrone" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Acceleration</Label>
                    <span className="font-mono text-sm text-primary">
                      {formState.velocityProfile.gForce || "1"}g
                    </span>
                  </div>
                  <Slider
                    value={[parseFloat(formState.velocityProfile.gForce) * 10 || 10]}
                    onValueChange={([val]) =>
                      updateVelocityProfile("gForce", (val / 10).toFixed(1))
                    }
                    min={1}
                    max={100}
                    step={1}
                    aria-label="Acceleration in g-forces"
                  />
                  <div className="flex justify-between text-xs text-t4">
                    <span>0.1g</span>
                    <span>10g</span>
                  </div>
                </div>
              )}

              {/* Alcubierre dilation toggle */}
              {isAlcubierre && (
                <div className="p-4 rounded-none border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-4 h-4 text-sf-amber" />
                    <span className="text-sm font-medium text-sf-amber">Alcubierre Drive, Speculative Physics</span>
                  </div>
                  <p className="text-xs text-t4 mb-3">
                    Inside the warp bubble, spacetime is flat, the traveler is technically stationary.
                    Choose how your story interprets the time dilation effect.
                  </p>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formState.alcubierreNoDilation}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({ ...prev, alcubierreNoDilation: checked }))
                      }
                    />
                    <Label className="cursor-pointer text-sm">
                      {formState.alcubierreNoDilation
                        ? "No dilation inside bubble (consensus interpretation)"
                        : "Apply effective dilation (dramatic interpretation)"}
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ═══ Section 4: RESULTS (always visible, instrument readout) ═══ */}
          <div id="section-results" className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-sm bg-primary/20 text-primary flex items-center justify-center font-mono text-sm font-bold">
                4
              </span>
              <h2 className="font-heading text-xl font-semibold">
                Time Dilation Results
              </h2>
            </div>

            {calculationResult.valid ? (
              <>
                {/* Hero: Lorentz Factor */}
                <GlassPanel glow className="p-6 md:p-8 text-center">
                  <p className="font-mono text-xs uppercase tracking-sf-ultra text-t2 mb-2">
                    Lorentz Factor (γ)
                  </p>
                  <p className={`font-mono text-5xl md:text-6xl font-sf-light ${sColors.text}`}>
                    {calculationResult.lorentzFactor < 100
                      ? calculationResult.lorentzFactor.toFixed(6)
                      : calculationResult.lorentzFactor.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-t3 mt-3">
                    Peak velocity:{" "}
                    <span className="font-mono text-t1">
                      {calculationResult.peakVelocityFraction >= 1
                        ? `${calculationResult.peakVelocityFraction.toFixed(1)}×c (FTL)`
                        : `${(calculationResult.peakVelocityFraction * 100).toFixed(4)}% c`}
                    </span>
                    {" · "}Distance:{" "}
                    <span className="font-mono text-t1">
                      {calculationResult.distanceFormatted}
                    </span>
                  </p>
                </GlassPanel>

                {/* Speed of Light Bar */}
                <div className="px-1 py-4">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-3">
                    Velocity Scale
                  </p>
                  <div className="relative h-6 rounded-sm overflow-hidden bg-accent/10 border border-sf-border">
                    <div className="absolute inset-0" style={{
                      background: 'linear-gradient(90deg, rgba(0,229,160,0.15) 0%, rgba(0,212,255,0.2) 50%, rgba(255,165,0,0.25) 85%, rgba(255,69,0,0.35) 100%)'
                    }} />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-primary transition-all duration-500"
                      style={{
                        left: `${Math.min(calculationResult.peakVelocityFraction, 1) * 100}%`,
                        boxShadow: '0 0 8px rgba(0,212,255,0.6)',
                      }}
                    />
                    {[0.1, 0.5, 0.9, 0.99].map((v) => (
                      <div
                        key={v}
                        className="absolute top-0 w-px h-2 bg-white/20"
                        style={{ left: `${v * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="relative mt-1 h-3">
                    <span className="absolute left-0 font-mono text-[7px] text-t4">0</span>
                    {[
                      { v: 10, label: "10%" },
                      { v: 50, label: "50%" },
                      { v: 90, label: "90%" },
                      { v: 99, label: "99%" },
                    ].map((ref) => (
                      <span
                        key={ref.label}
                        className="absolute font-mono text-[7px] text-t4 -translate-x-1/2"
                        style={{ left: `${ref.v}%` }}
                      >
                        {ref.label}
                      </span>
                    ))}
                    <span className="absolute right-0 font-mono text-[7px] text-t4">c</span>
                  </div>
                  <p className="font-mono text-[8px] text-center text-t4 mt-1">
                    {calculationResult.peakVelocityFraction >= 1
                      ? `${calculationResult.peakVelocityFraction.toFixed(1)}× the speed of light (FTL)`
                      : calculationResult.peakVelocityFraction >= 0.99
                      ? "Deep relativistic, extreme time dilation"
                      : calculationResult.peakVelocityFraction >= 0.5
                      ? "Relativistic, significant time dilation effects"
                      : calculationResult.peakVelocityFraction >= 0.1
                      ? "Sub-relativistic, minimal dilation effects"
                      : "Non-relativistic, negligible dilation"
                    }
                  </p>
                </div>

                {/* Ship Time / Observer Time, StatGrid primitive */}
                <StatGrid cols={2}>
                  <StatGrid.Cell
                    label="SHIP TIME (TRAVELERS)"
                    value={calculationResult.shipTimeFormatted}
                    unit="TIME EXPERIENCED ABOARD VESSEL"
                    accent="amber"
                  />
                  <StatGrid.Cell
                    label={`OBSERVER TIME (${(
                      formState.referenceFrame.frame === "custom"
                        ? formState.referenceFrame.customName || "HOME"
                        : REFERENCE_FRAMES.find(
                            (f) => f.id === formState.referenceFrame.frame,
                          )?.label || "HOME"
                    ).toUpperCase()})`}
                    value={calculationResult.observerTimeFormatted}
                    unit="TIME ELAPSED IN STATIONARY FRAME"
                    accent="amber"
                  />
                </StatGrid>

                {/* Time Difference */}
                <GlassPanel className={`p-5 border-l-4 ${sColors.border}`}>
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-1">
                    Time Difference
                  </p>
                  <p className={`font-mono text-3xl font-semibold ${sColors.text}`}>
                    {calculationResult.timeDifferenceFormatted}
                  </p>
                  <p className="text-sm text-t3 mt-2">
                    {formState.roundTrip ? "Total round-trip difference" : "One-way difference"}
                  </p>
                </GlassPanel>

                {/* Time Divergence Graph */}
                {calculationResult.severity !== "negligible" && calculationResult.shipTimeSeconds > 0 && calculationResult.observerTimeSeconds > 0 && (() => {
                  const ship = calculationResult.shipTimeSeconds;
                  const earth = calculationResult.observerTimeSeconds;
                  const maxT = Math.max(ship, earth);
                  const W = 440, H = 140;
                  const PL = 8, PR = 74, PT = 14, PB = 26;
                  const pw = W - PL - PR, ph = H - PT - PB;

                  const xP = (f: number) => PL + f * pw;
                  const yP = (t: number) => PT + ph - (t / maxT) * ph;

                  const N = 40;
                  const eCoords: [number, number][] = [];
                  const sCoords: [number, number][] = [];
                  for (let i = 0; i <= N; i++) {
                    const f = i / N;
                    eCoords.push([xP(f), yP(f * earth)]);
                    sCoords.push([xP(f), yP(f * ship)]);
                  }

                  const toLine = (pts: [number, number][]) =>
                    pts.map(([cx, cy], i) => `${i === 0 ? "M" : "L"}${cx.toFixed(1)},${cy.toFixed(1)}`).join(" ");

                  const eLine = toLine(eCoords);
                  const sLine = toLine(sCoords);
                  const fill = eLine + " " + [...sCoords].reverse().map(([cx, cy]) => `L${cx.toFixed(1)},${cy.toFixed(1)}`).join(" ") + " Z";

                  const eEnd = eCoords[N];
                  const sEnd = sCoords[N];

                  return (
                    <div className="px-1 py-4">
                      <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-3">
                        Time Divergence
                      </p>
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                        {[0.25, 0.5, 0.75].map((f) => (
                          <line key={f} x1={xP(f)} y1={PT} x2={xP(f)} y2={PT + ph} stroke="rgba(255,255,255,0.04)" />
                        ))}
                        <line x1={PL} y1={PT + ph} x2={PL + pw} y2={PT + ph} stroke="rgba(255,255,255,0.08)" />
                        <line x1={PL} y1={PT} x2={PL} y2={PT + ph} stroke="rgba(255,255,255,0.08)" />
                        <path d={fill} fill="rgba(0,212,255,0.06)" />
                        <path d={eLine} fill="none" stroke="rgba(255,165,0,0.55)" strokeWidth="1.5" />
                        <path d={sLine} fill="none" stroke="rgba(0,229,160,0.7)" strokeWidth="1.5" />
                        <circle cx={eEnd[0]} cy={eEnd[1]} r="3" fill="rgba(255,165,0,0.8)" />
                        <circle cx={sEnd[0]} cy={sEnd[1]} r="3" fill="rgba(0,229,160,0.8)" />
                        <text x={eEnd[0] + 6} y={eEnd[1] + 3} fill="rgba(255,165,0,0.7)" fontSize="8" fontFamily="'JetBrains Mono',monospace">{calculationResult.observerTimeFormatted}</text>
                        <text x={sEnd[0] + 6} y={sEnd[1] + 3} fill="rgba(0,229,160,0.7)" fontSize="8" fontFamily="'JetBrains Mono',monospace">{calculationResult.shipTimeFormatted}</text>
                        {eEnd[1] < sEnd[1] - 10 && (
                          <line x1={eEnd[0] + 3} y1={eEnd[1] + 6} x2={sEnd[0] + 3} y2={sEnd[1] - 6} stroke="rgba(0,212,255,0.2)" strokeWidth="1" strokeDasharray="2,2" />
                        )}
                        <text x={PL} y={H - 4} fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="'JetBrains Mono',monospace">Depart</text>
                        <text x={PL + pw} y={H - 4} fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="'JetBrains Mono',monospace" textAnchor="end">Arrive</text>
                        <line x1={PL + pw * 0.3} y1={H - 6} x2={PL + pw * 0.3 + 14} y2={H - 6} stroke="rgba(255,165,0,0.55)" strokeWidth="1.5" />
                        <text x={PL + pw * 0.3 + 17} y={H - 3} fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="'JetBrains Mono',monospace">Observer</text>
                        <line x1={PL + pw * 0.6} y1={H - 6} x2={PL + pw * 0.6 + 14} y2={H - 6} stroke="rgba(0,229,160,0.7)" strokeWidth="1.5" />
                        <text x={PL + pw * 0.6 + 17} y={H - 3} fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="'JetBrains Mono',monospace">Ship</text>
                      </svg>
                    </div>
                  );
                })()}

                {/* Brachistochrone Phase Breakdown */}
                {formState.velocityProfile.mode === "brachistochrone" &&
                  calculationResult.accelerationPhaseSeconds !== undefined && (
                    <GlassPanel className="p-5">
                      <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-3">
                        Flight Profile
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-t3">Acceleration Phase</span>
                          <span className="font-mono text-sm">
                            {formatDuration(calculationResult.accelerationPhaseSeconds)}
                          </span>
                        </div>
                        {calculationResult.cruisePhaseSeconds !== undefined &&
                          calculationResult.cruisePhaseSeconds > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-t3">
                                Cruise Phase (velocity capped)
                              </span>
                              <span className="font-mono text-sm">
                                {formatDuration(calculationResult.cruisePhaseSeconds)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-t3">Deceleration Phase</span>
                          <span className="font-mono text-sm">
                            {formatDuration(calculationResult.decelerationPhaseSeconds!)}
                          </span>
                        </div>
                      </div>
                      {calculationResult.peakVelocityCapped && (
                        <p className="text-xs text-sf-amber mt-3 font-mono">
                          ⚠ Peak velocity capped at propulsion maximum
                        </p>
                      )}
                    </GlassPanel>
                  )}

                {/* Narrative Summary */}
                <GlassPanel className="p-5 bg-primary/5">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-primary/60 mb-3">
                    Narrative Summary
                  </p>
                  <p className="text-sm leading-relaxed text-t2">
                    {calculationResult.narrativeSummary}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleCopyNarrative}
                  >
                    <Copy className="w-3 h-3 mr-1.5" />
                    Copy Narrative
                  </Button>
                </GlassPanel>

                {/* Story Callouts */}
                {calculationResult.storyCallouts.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2">
                      What This Means For Your Story
                    </p>
                    {calculationResult.storyCallouts.map((callout, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-r-lg border-l-2 ${sColors.border} ${sColors.bg}`}
                      >
                        <p className="font-heading text-sm font-semibold mb-1">
                          {callout.title}
                        </p>
                        <p className="text-xs text-t4 leading-relaxed">
                          {callout.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <GlassPanel className="p-8 text-center">
                <Clock className="w-8 h-8 text-t2 mx-auto mb-3 opacity-50" />
                <p className="text-t2">
                  {calculationResult.error || "Configure your journey and propulsion to see results."}
                </p>
              </GlassPanel>
            )}
          </div>

          {/* Section 5: Reference Frame */}
          <CollapsibleSection
            id="section-reference"
            title="Reference Frame"
            subtitle="Where does your story keep time?"
            levelNumber={5}
            icon={<Radio className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.reference}</p>
            <div className="space-y-4">
              <RadioGroup
                value={formState.referenceFrame.frame}
                onValueChange={(val) => updateReferenceFrame("frame", val)}
                className="grid gap-2 md:grid-cols-2"
              >
                {REFERENCE_FRAMES.map((frame) => (
                  <div
                    key={frame.id}
                    className="flex items-start gap-3 p-3 rounded-none border border-sf-border hover:border-primary/50 transition-colors"
                  >
                    <RadioGroupItem value={frame.id} id={`frame-${frame.id}`} className="mt-0.5" />
                    <label htmlFor={`frame-${frame.id}`} className="cursor-pointer">
                      <div className="font-medium text-sm">{frame.label}</div>
                      <div className="text-xs text-t4">{frame.description}</div>
                    </label>
                  </div>
                ))}
              </RadioGroup>

              {formState.referenceFrame.frame === "custom" && (
                <div className="space-y-2 pt-2">
                  <Label>Custom Frame Name</Label>
                  <Input
                    value={formState.referenceFrame.customName}
                    onChange={(e) => updateReferenceFrame("customName", e.target.value)}
                    placeholder="e.g., Kepler-442b Colony"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 6: Story Notes */}
          <CollapsibleSection
            id="section-story"
            title="Story Notes"
            subtitle="How does time dilation affect your characters?"
            levelNumber={6}
            icon={<BookOpen className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.story}</p>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>The Departure Moment</Label>
                <p className="text-xs text-t4 mb-2">
                  Describe the moment of departure. Who is watching? What is being left behind?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.departureMoment}
                    onChange={(html) => updateStoryNotes("departureMoment", html)}
                    placeholder="The departure scene..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>The Time Gap's Impact</Label>
                <p className="text-xs text-t4 mb-2">
                  How does the time difference affect your characters' relationships and plans?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.timeDilationImpact}
                    onChange={(html) => updateStoryNotes("timeDilationImpact", html)}
                    placeholder="The impact of time dilation..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>The Return / Arrival</Label>
                <p className="text-xs text-t4 mb-2">
                  What has changed when they arrive (or return)? What surprises await?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.returnExperience}
                    onChange={(html) => updateStoryNotes("returnExperience", html)}
                    placeholder="What they find when they arrive..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>Social Consequences</Label>
                <p className="text-xs text-t4 mb-2">
                  How does your society handle time-displaced travelers? Are there laws, customs, or stigmas?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.socialConsequences}
                    onChange={(html) => updateStoryNotes("socialConsequences", html)}
                    placeholder="Social and cultural effects..."
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Desktop Sidebars */}
        <ToolSidebar>
          <SectionNavigation sections={TIME_DILATION_SECTIONS} mode="inline" />
          <KeyChoicesSidebar
            sections={keyChoicesSections}
            title="Dilation Summary"
            mode="inline"
          />
        </ToolSidebar>

        {/* Mobile Sidebars */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={TIME_DILATION_SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} title="Dilation Summary" />
        </div>

      {/* ═══ Dialogs & Sheets ═══ */}
      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        title="General Notes"
        content={formState.generalNotes}
        onChange={(html) => setFormState((prev) => ({ ...prev, generalNotes: html }))}
      />
      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || worksheetId || "local"}
        images={formState.moodboard || []}
        onImagesChange={(images) => setFormState((prev) => ({ ...prev, moodboard: images }))}
      />
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Paradox"
        worldName={worldNameForExport}
        worksheetTitle={currentWorksheetTitle || undefined}
        formState={formState}
        summaryTemplate={
          <TimeDilationSummaryTemplate formState={formState} worldName={worldNameForExport} />
        }
        fullTemplate={
          <TimeDilationFullReportTemplate formState={formState} worldName={worldNameForExport} />
        }
        defaultFilename="time-dilation"
      />
      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          worksheetId={(currentWorksheetId || worksheetId)!}
          worldId={worldId || undefined}
        />
      )}
      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId || ""}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Paradox"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default TimeDilationCalculator;
