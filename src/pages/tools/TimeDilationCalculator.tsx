import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import { useWorldId } from "@/hooks/use-world-id";
import { PageBursts } from "@/components/ui/data-burst";
import { TOOL_PAGE_BURSTS } from "@/lib/data-bursts";
import { WorksheetTagsBar } from "@/components/tools/WorksheetTagsBar";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Copy,
  Clock,
  Rocket,
  Gauge,
  Radio,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import ToolIntroSection from "@/components/tools/ToolIntroSection";
import { TOOL_INTROS } from "@/lib/tool-intros";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
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
import { WorksheetTitle } from "@/components/tools/WorksheetTitle";
import { getToolIcon } from "@/components/icons/tool-icons";
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
import ToolActionBar from "@/components/tools/ToolActionBar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
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
const ToolIcon = getToolIcon(TOOL_TYPE);
const LOCAL_STORAGE_KEY = "time-dilation-calculator-v1";

// ─── Severity color helpers ──────────────────────────────────────────

const SEVERITY_STYLES = {
  negligible: { text: "text-emerald-400", border: "border-l-emerald-400", bg: "bg-emerald-400/10" },
  notable: { text: "text-amber-400", border: "border-l-amber-400", bg: "bg-amber-400/10" },
  significant: { text: "text-orange-500", border: "border-l-orange-500", bg: "bg-orange-500/10" },
  extreme: { text: "text-red-500", border: "border-l-red-500", bg: "bg-red-500/10" },
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

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
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
    toast({ title: "Copied", description: "Narrative copied to clipboard." });
  };

  const worldNameForExport = worldId ? worldName : undefined;
  const severity = calculationResult.valid ? calculationResult.severity : "negligible";
  const sColors = SEVERITY_STYLES[severity];

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <PageShell>
      <main className="container relative mx-auto px-4 pt-24 pb-16">
        <PageBursts bursts={TOOL_PAGE_BURSTS["time-dilation"]} />
        {/* Back Link */}
        <Link
          to={worldId ? `/worlds/${worldId}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {worldId ? "Back to World" : "Back to Dashboard"}
        </Link>

        {/* Action Bar */}
        <ToolActionBar
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
          exportLabel="Export Worksheet"
          className="mb-6"
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
        />

        {/* Title */}
        <div className="mb-8">
          <Badge className="mb-2">Pro Tool</Badge>
          <div className="flex items-center gap-3">
            {ToolIcon && <ToolIcon className="w-12 h-12 rounded-sm shrink-0" />}
            <h1 className="font-display text-3xl md:text-4xl tracking-sf-title">
              <span className="font-normal">Paradox:</span>{" "}
              <span className="font-light">Time Dilation Calculator</span>
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Every journey costs time. Know what yours will cost.
          </p>
          {(currentWorksheetId || worksheetId) && (
            <WorksheetTitle
              title={currentWorksheetTitle}
              onRename={handleRename}
              icon={<FileText className="w-4 h-4 text-primary" />}
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

        <ToolIntroSection data={TOOL_INTROS["time-dilation-calculator"]} />

        {/* Introduction */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4 gradient-text">
            Relativistic Time Dilation
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "The faster you travel through space, the slower you travel through time."
          </blockquote>
          <p className="text-muted-foreground">
            Calculate how relativistic speeds affect the passage of time for your travelers.
            Choose a journey, select a propulsion method, and see how much time your characters
            lose—or gain—relative to the people they left behind. All calculations use
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.journey}</p>
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
                              <span className="text-muted-foreground ml-2">({pair.annotation})</span>
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
                <span className="text-xs text-muted-foreground">
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.propulsion}</p>
            <div className="space-y-4">
              <RadioGroup
                value={formState.propulsion.method}
                onValueChange={handlePropulsionChange}
                className="grid gap-2 md:grid-cols-2"
              >
                {PROPULSION_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <RadioGroupItem value={method.id} id={`prop-${method.id}`} className="mt-0.5" />
                    <label htmlFor={`prop-${method.id}`} className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">{method.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {method.isAlcubierre
                          ? `Superluminal (${method.maxVelocityC}×c)`
                          : method.id === "custom"
                            ? "Set your own"
                            : `Max: ${(method.maxVelocityC * 100).toFixed(3)}% c`}
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-0.5 italic">{method.note}</div>
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.velocity}</p>
            <div className="space-y-6">
              <RadioGroup
                value={formState.velocityProfile.mode}
                onValueChange={(val) => updateVelocityProfile("mode", val)}
                className="grid gap-3 md:grid-cols-2"
              >
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="constant" id="vp-constant" className="mt-0.5" />
                  <label htmlFor="vp-constant" className="cursor-pointer">
                    <div className="font-medium text-sm">Constant Velocity</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Instantaneous acceleration to cruising speed. Simple, clean math.
                    </div>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="brachistochrone" id="vp-brach" className="mt-0.5" />
                  <label htmlFor="vp-brach" className="cursor-pointer">
                    <div className="font-medium text-sm">Brachistochrone</div>
                    <div className="text-xs text-muted-foreground mt-1">
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
                        : "—"}
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
                  <div className="flex justify-between text-xs text-muted-foreground">
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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.1g</span>
                    <span>10g</span>
                  </div>
                </div>
              )}

              {/* Alcubierre dilation toggle */}
              {isAlcubierre && (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Alcubierre Drive—Speculative Physics</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Inside the warp bubble, spacetime is flat—the traveler is technically stationary.
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
                  <p className="font-mono text-xs uppercase tracking-sf-ultra text-muted-foreground mb-2">
                    Lorentz Factor (γ)
                  </p>
                  <p className={`font-mono text-5xl md:text-6xl font-sf-light ${sColors.text}`}>
                    {calculationResult.lorentzFactor < 100
                      ? calculationResult.lorentzFactor.toFixed(6)
                      : calculationResult.lorentzFactor.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Peak velocity:{" "}
                    <span className="font-mono text-foreground">
                      {calculationResult.peakVelocityFraction >= 1
                        ? `${calculationResult.peakVelocityFraction.toFixed(1)}×c (FTL)`
                        : `${(calculationResult.peakVelocityFraction * 100).toFixed(4)}% c`}
                    </span>
                    {" · "}Distance:{" "}
                    <span className="font-mono text-foreground">
                      {calculationResult.distanceFormatted}
                    </span>
                  </p>
                </GlassPanel>

                {/* Ship Time / Observer Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-1">
                      Ship Time (Travelers)
                    </p>
                    <p className="font-mono text-2xl font-semibold text-foreground">
                      {calculationResult.shipTimeFormatted}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Time experienced aboard the vessel
                    </p>
                  </GlassPanel>
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-1">
                      Observer Time ({
                        formState.referenceFrame.frame === "custom"
                          ? formState.referenceFrame.customName || "Home"
                          : REFERENCE_FRAMES.find((f) => f.id === formState.referenceFrame.frame)?.label || "Home"
                      })
                    </p>
                    <p className="font-mono text-2xl font-semibold text-foreground">
                      {calculationResult.observerTimeFormatted}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Time elapsed in the stationary frame
                    </p>
                  </GlassPanel>
                </div>

                {/* Time Difference */}
                <GlassPanel className={`p-5 border-l-4 ${sColors.border}`}>
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-1">
                    Time Difference
                  </p>
                  <p className={`font-mono text-3xl font-semibold ${sColors.text}`}>
                    {calculationResult.timeDifferenceFormatted}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formState.roundTrip ? "Total round-trip difference" : "One-way difference"}
                  </p>
                </GlassPanel>

                {/* Brachistochrone Phase Breakdown */}
                {formState.velocityProfile.mode === "brachistochrone" &&
                  calculationResult.accelerationPhaseSeconds !== undefined && (
                    <GlassPanel className="p-5">
                      <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-3">
                        Flight Profile
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Acceleration Phase</span>
                          <span className="font-mono text-sm">
                            {formatDuration(calculationResult.accelerationPhaseSeconds)}
                          </span>
                        </div>
                        {calculationResult.cruisePhaseSeconds !== undefined &&
                          calculationResult.cruisePhaseSeconds > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Cruise Phase (velocity capped)
                              </span>
                              <span className="font-mono text-sm">
                                {formatDuration(calculationResult.cruisePhaseSeconds)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Deceleration Phase</span>
                          <span className="font-mono text-sm">
                            {formatDuration(calculationResult.decelerationPhaseSeconds!)}
                          </span>
                        </div>
                      </div>
                      {calculationResult.peakVelocityCapped && (
                        <p className="text-xs text-amber-400 mt-3 font-mono">
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
                  <p className="text-sm leading-relaxed text-muted-foreground">
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
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground">
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
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {callout.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <GlassPanel className="p-8 text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.reference}</p>
            <div className="space-y-4">
              <RadioGroup
                value={formState.referenceFrame.frame}
                onValueChange={(val) => updateReferenceFrame("frame", val)}
                className="grid gap-2 md:grid-cols-2"
              >
                {REFERENCE_FRAMES.map((frame) => (
                  <div
                    key={frame.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <RadioGroupItem value={frame.id} id={`frame-${frame.id}`} className="mt-0.5" />
                    <label htmlFor={`frame-${frame.id}`} className="cursor-pointer">
                      <div className="font-medium text-sm">{frame.label}</div>
                      <div className="text-xs text-muted-foreground">{frame.description}</div>
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.story}</p>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>The Departure Moment</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Describe the moment of departure. Who is watching? What is being left behind?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <RichTextEditor
                    content={formState.storyNotes.departureMoment}
                    onChange={(html) => updateStoryNotes("departureMoment", html)}
                    placeholder="The departure scene..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>The Time Gap's Impact</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  How does the time difference affect your characters' relationships and plans?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <RichTextEditor
                    content={formState.storyNotes.timeDilationImpact}
                    onChange={(html) => updateStoryNotes("timeDilationImpact", html)}
                    placeholder="The impact of time dilation..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>The Return / Arrival</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  What has changed when they arrive (or return)? What surprises await?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <RichTextEditor
                    content={formState.storyNotes.returnExperience}
                    onChange={(html) => updateStoryNotes("returnExperience", html)}
                    placeholder="What they find when they arrive..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>Social Consequences</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  How does your society handle time-displaced travelers? Are there laws, customs, or stigmas?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
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
      </main>

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
    </PageShell>
  );
};

export default TimeDilationCalculator;
