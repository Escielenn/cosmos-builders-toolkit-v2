import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";
const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { Link, useSearchParams } from "react-router-dom";
import { Download, Save, Info, Printer, ExternalLink, HelpCircle, Image as ImageIcon, Calculator } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useWorksheets, useWorksheet, useWorksheetsByType, useRenameWorksheet } from "@/hooks/use-worksheets";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import SectionNavigation, { Section, MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection, MobileKeyChoices } from "@/components/tools/KeyChoicesSidebar";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { useTags } from "@/hooks/use-tags";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import { DrakeSummaryTemplate, DrakeFullReportTemplate } from "@/lib/pdf/templates";
import { Json } from "@/integrations/supabase/types";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-intro", title: "Introduction" },
  { id: "section-variables", title: "Variables" },
  { id: "section-result", title: "Result" },
  { id: "section-worldbuilding", title: "Worldbuilding" },
  { id: "section-presets", title: "Presets" },
];

// Drake Equation variable definitions
const DRAKE_VARIABLES = [
  {
    id: "rStar",
    symbol: "R*",
    name: "Star Formation Rate",
    description: "Average rate of star formation in our galaxy (per year)",
    unit: "stars/year",
    min: 0.1,
    max: 50,
    step: 0.1,
    default: 1.5,
    scientificRange: { low: 1, high: 3, note: "Current scientific estimates" },
    worldbuildingNote: "A higher rate suggests a young, active galaxy with many new stellar nurseries. Lower rates might mean an older, quieter galaxy.",
  },
  {
    id: "fp",
    symbol: "fp",
    name: "Fraction with Planets",
    description: "Fraction of stars that have planetary systems",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 1,
    scientificRange: { low: 0.9, high: 1, note: "Kepler data suggests nearly all stars have planets" },
    worldbuildingNote: "Modern exoplanet surveys show planets are extremely common. A low value might indicate planetary formation is somehow inhibited in your galaxy.",
  },
  {
    id: "ne",
    symbol: "ne",
    name: "Habitable Planets per System",
    description: "Average number of planets that could support life per star with planets",
    unit: "planets",
    min: 0,
    max: 10,
    step: 0.1,
    default: 0.4,
    scientificRange: { low: 0.1, high: 0.5, note: "Highly uncertain, depends on definition of habitable" },
    worldbuildingNote: "This is where your definition of 'habitable' matters most. Strict Earth-like? Or any world life could adapt to?",
  },
  {
    id: "fl",
    symbol: "fl",
    name: "Fraction Where Life Develops",
    description: "Fraction of habitable planets where life actually arises",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.5,
    scientificRange: { low: 0.001, high: 1, note: "Completely unknown, life might be easy or near-miraculous" },
    worldbuildingNote: "The Great Filter might be here. If life is easy, the galaxy should be teeming. If rare, we might be alone.",
  },
  {
    id: "fi",
    symbol: "fi",
    name: "Fraction with Intelligence",
    description: "Fraction of life-bearing planets that develop intelligent life",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.5,
    scientificRange: { low: 0.001, high: 1, note: "Earth took 4 billion years, is intelligence inevitable or a fluke?" },
    worldbuildingNote: "Intelligence might be evolutionarily expensive. Does it always win, or do other strategies dominate?",
  },
  {
    id: "fc",
    symbol: "fc",
    name: "Fraction with Detectable Technology",
    description: "Fraction of intelligent civilizations that develop detectable technology",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.2,
    scientificRange: { low: 0.01, high: 0.2, note: "Technology might not be inevitable, many paths exist" },
    worldbuildingNote: "Not all intelligent species may develop technology. Aquatic species can't smelt metal. Some might choose other paths.",
  },
  {
    id: "L",
    symbol: "L",
    name: "Civilization Longevity",
    description: "Average length of time civilizations release detectable signals (years)",
    unit: "years",
    min: 10,
    max: 1000000000,
    step: 10,
    default: 10000,
    scientificRange: { low: 100, high: 10000000, note: "Humanity has been detectable for ~100 years" },
    worldbuildingNote: "This is the most worldbuilding-relevant variable. What kills civilizations? What lets some persist?",
    useLogScale: true,
  },
];

// Preset scenarios for worldbuilding
const PRESETS = [
  {
    id: "optimistic",
    name: "Optimistic / Space Opera",
    description: "A crowded galaxy with civilizations everywhere. Perfect for space opera, galactic empires, and first contact stories.",
    values: { rStar: 3, fp: 1, ne: 2, fl: 1, fi: 0.5, fc: 0.5, L: 1000000 },
    storyTypes: ["Space opera", "Galactic politics", "Federation stories", "Alien allies"],
  },
  {
    id: "pessimistic",
    name: "Pessimistic / Lonely Universe",
    description: "A quiet galaxy where we might be alone. Perfect for hard SF, existential themes, and exploration stories.",
    values: { rStar: 1, fp: 0.5, ne: 0.1, fl: 0.01, fi: 0.01, fc: 0.01, L: 1000 },
    storyTypes: ["Hard SF", "Generation ships", "Silent cosmos", "Human manifest destiny"],
  },
  {
    id: "rare-earth",
    name: "Rare Earth Hypothesis",
    description: "Life is common but complex life is extremely rare. Many simple organisms, few civilizations.",
    values: { rStar: 2, fp: 1, ne: 0.5, fl: 0.5, fi: 0.001, fc: 0.1, L: 10000 },
    storyTypes: ["Microbial life everywhere", "We're special", "Gardens of simple life"],
  },
  {
    id: "great-filter",
    name: "Great Filter Ahead",
    description: "Civilizations arise but quickly destroy themselves. Ruins everywhere, living civilizations rare.",
    values: { rStar: 2, fp: 1, ne: 1, fl: 0.5, fi: 0.2, fc: 0.5, L: 200 },
    storyTypes: ["Ancient ruins", "Cosmic archaeology", "Warnings from the past", "Existential risk"],
  },
  {
    id: "dark-forest",
    name: "Dark Forest",
    description: "Civilizations exist but hide. Detection means death. A paranoid, dangerous cosmos.",
    values: { rStar: 2, fp: 1, ne: 1, fl: 0.3, fi: 0.1, fc: 0.01, L: 100000 },
    storyTypes: ["Cosmic horror", "Silent running", "First contact as threat", "Hiding civilizations"],
  },
  {
    id: "current-science",
    name: "Current Scientific Estimates",
    description: "Middle-ground values based on modern astrophysics. The 'best guess' scenario.",
    values: { rStar: 1.5, fp: 1, ne: 0.4, fl: 0.5, fi: 0.5, fc: 0.2, L: 10000 },
    storyTypes: ["Near-future SF", "Realistic contact", "SETI themes"],
  },
];

// Form state interface
interface FormState {
  values: {
    rStar: number;
    fp: number;
    ne: number;
    fl: number;
    fi: number;
    fc: number;
    L: number;
  };
  notes: {
    rStar: string;
    fp: string;
    ne: string;
    fl: string;
    fi: string;
    fc: string;
    L: string;
  };
  worldbuilding: {
    fermiAnswer: string;
    greatFilterLocation: string;
    galaxyCharacter: string;
    storyImplications: string;
    civilizationTypes: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  values: {
    rStar: 1.5,
    fp: 1,
    ne: 0.4,
    fl: 0.5,
    fi: 0.5,
    fc: 0.2,
    L: 10000,
  },
  notes: {
    rStar: "",
    fp: "",
    ne: "",
    fl: "",
    fi: "",
    fc: "",
    L: "",
  },
  worldbuilding: {
    fermiAnswer: "",
    greatFilterLocation: "",
    galaxyCharacter: "",
    storyImplications: "",
    civilizationTypes: "",
  },
  generalNotes: "",
  moodboard: [],
};

// Local storage key
const LOCAL_STORAGE_KEY = "drake-equation-calculator-v1";

const TOOL_TYPE = "drake-equation-calculator";

const DrakeEquationCalculator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = useWorldId();
  const worksheetId = searchParams.get("worksheetId");

  const { worlds } = useWorlds();
  const entityMatch = useEntityMatch(worldId);
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: entityMatch.check,
  });
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { updateWorksheetTags } = useTags();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedToCloud, setLastSavedToCloud] = useState<Date | null>(null);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  // Calculate N (result of Drake Equation)
  const N = useMemo(() => {
    const { rStar, fp, ne, fl, fi, fc, L } = formState.values;
    return rStar * fp * ne * fl * fi * fc * L;
  }, [formState.values]);

  // Format large numbers
  const formatNumber = (n: number): string => {
    if (n < 1) return n.toFixed(4);
    if (n < 10) return n.toFixed(2);
    if (n < 1000) return n.toFixed(1);
    if (n < 1000000) return Math.round(n).toLocaleString();
    if (n < 1000000000) return (n / 1000000).toFixed(1) + " million";
    return (n / 1000000000).toFixed(1) + " billion";
  };

  // Get interpretation of result
  const getInterpretation = (n: number): { label: string; color: string; description: string } => {
    if (n < 1) return {
      label: "Very Lonely",
      color: "text-blue-400",
      description: "Fewer than one civilization expected. We may be alone in the galaxy, or civilizations are so rare that contact is essentially impossible."
    };
    if (n < 10) return {
      label: "Lonely",
      color: "text-sf-teal",
      description: "A handful of civilizations might exist. Finding each other would be like finding needles in a cosmic haystack."
    };
    if (n < 100) return {
      label: "Sparse",
      color: "text-green-400",
      description: "Dozens of civilizations. Contact is possible but requires patience and luck. Good for stories about first contact as a rare, meaningful event."
    };
    if (n < 1000) return {
      label: "Moderate",
      color: "text-yellow-400",
      description: "Hundreds of civilizations. Enough for a network, but vast distances mean most remain isolated. Good for stories about distant rumors."
    };
    if (n < 10000) return {
      label: "Crowded",
      color: "text-orange-400",
      description: "Thousands of civilizations. Regional groupings, alliances, and conflicts become possible. Classic space opera territory."
    };
    return {
      label: "Teeming",
      color: "text-sf-crimson",
      description: "A galaxy full of life. Civilizations bump into each other regularly. Think Star Trek or Star Wars. The Fermi Paradox becomes very pressing."
    };
  };

  const interpretation = getInterpretation(N);

  // Generate key choices for sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const { rStar, fp, ne, fl, fi, fc, L } = formState.values;
    return [
      {
        id: "variables",
        title: "Variables",
        choices: [
          { label: "R*", value: rStar.toFixed(1) },
          { label: "fp", value: fp.toFixed(2) },
          { label: "ne", value: ne.toFixed(2) },
          { label: "fl", value: fl.toFixed(2) },
          { label: "fi", value: fi.toFixed(2) },
          { label: "fc", value: fc.toFixed(2) },
          { label: "L", value: L.toLocaleString() },
        ],
      },
      {
        id: "result",
        title: "Result",
        choices: [
          { label: "N", value: formatNumber(N) },
          { label: "Interpretation", value: interpretation.label },
        ],
      },
      {
        id: "worldbuilding",
        title: "Worldbuilding",
        choices: [
          { label: "Fermi Answer", value: formState.worldbuilding.fermiAnswer ? "Defined" : undefined },
          { label: "Galaxy Character", value: formState.worldbuilding.galaxyCharacter ? "Defined" : undefined },
        ],
      },
    ];
  }, [formState, N, interpretation.label]);

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // Load from localStorage on mount (standalone mode)
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormState(parsed);
        } catch (e) {
          console.error("Failed to load saved data:", e);
        }
      }
    }
  }, [worldId, worksheetId]);

  // Load from worksheet if editing
  useEffect(() => {
    if (existingWorksheet?.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet?.tags) {
          setWorksheetTags(existingWorksheet.tags);
        }
        setLastSavedToCloud(new Date(existingWorksheet.updated_at));
        toast({
          title: "Worksheet Loaded",
          description: "WORK RESTORED FROM CLOUD.",
        });
      } catch (e) {
        console.error("Failed to load worksheet:", e);
      }
    }
  }, [existingWorksheet]);

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));
      setHasUnsavedChanges(true);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formState]);

  // Update a single value
  const updateValue = (key: keyof FormState["values"], value: number) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [key]: value },
    }));
  };

  // Update a note
  const updateNote = (key: keyof FormState["notes"], value: string) => {
    setFormState(prev => ({
      ...prev,
      notes: { ...prev.notes, [key]: value },
    }));
  };

  // Update worldbuilding notes
  const updateWorldbuilding = (key: keyof FormState["worldbuilding"], value: string) => {
    setFormState(prev => ({
      ...prev,
      worldbuilding: { ...prev.worldbuilding, [key]: value },
    }));
  };

  // Apply a preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormState(prev => ({
      ...prev,
      values: { ...preset.values },
    }));
    toast({
      title: `Applied: ${preset.name}`,
      description: preset.description,
    });
  };

  // Save to cloud
  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));

    // If we have a worldId and user is authenticated, save to Supabase
    if (worldId && user) {
      const worksheetData = formState as unknown as Json;
      setIsSavingToCloud(true);

      try {
        if (currentWorksheetId || worksheetId) {
          // Update existing worksheet - preserve user-provided title
          await updateWorksheet.mutateAsync({
            worksheetId: currentWorksheetId || worksheetId!,
            data: worksheetData,
          });
          setLastSavedToCloud(new Date());
          setHasUnsavedChanges(false);
        } else {
          // Should not reach here - worksheet must be created via selector first
          toast({
            title: "OPERATION FAILED.",
            description: "SELECT OR CREATE A WORKSHEET BEFORE TRANSMITTING.",
            variant: "destructive",
          });
        }
      } catch {
        // Error already handled by the mutation
      } finally {
        setIsSavingToCloud(false);
      }
    } else {
      toast({
        title: "Draft Saved",
        description: "WORK SECURED TO LOCAL STORAGE.",
      });
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

  // Handle worksheet rename
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

  // Open export dialog
  const handleExport = () => {
    setExportDialogOpen(true);
  };

  // Print (keep for quick access)
  const handlePrint = () => {
    window.print();
  };

  // Get world name for export
  const currentWorld = worlds.find(w => w.id === worldId);
  const worldNameForExport = currentWorld?.name;

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={handlePrint}
      onExport={handleExport}
      onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      hasUnsavedChanges={hasUnsavedChanges}
      isSaving={isSavingToCloud}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Signal"
          worldName={worldNameForExport}
          formState={formState}
          summaryTemplate={<DrakeSummaryTemplate formState={formState} worldName={worldNameForExport} />}
          fullTemplate={<DrakeFullReportTemplate formState={formState} worldName={worldNameForExport} />}
          defaultFilename="drake-equation"
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
        {/* Desktop Sidebars - Right side */}
        <ToolSidebar>
          <SectionNavigation sections={SECTIONS} mode="inline" />
          <KeyChoicesSidebar sections={keyChoicesSections} title="Drake Summary" mode="inline" />
        </ToolSidebar>

        {/* Mobile Sidebars - Right side floating buttons */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} title="Drake Summary" />
        </div>

        {/* Introduction Section */}
        <CollapsibleSection
          id="section-intro"
          title="The Drake Equation"
          icon={<Info className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="prose prose-invert max-w-none">
            <p className="text-t2">
              In 1961, astronomer Frank Drake created an equation to estimate the number of
              active, communicative extraterrestrial civilizations in the Milky Way. For worldbuilders,
              it's a framework for deciding how populated your galaxy should be.
            </p>

            <div className="bg-accent/20 p-4 rounded-none my-4 font-mono text-center text-lg">
              N = R* × f<sub>p</sub> × n<sub>e</sub> × f<sub>l</sub> × f<sub>i</sub> × f<sub>c</sub> × L
            </div>

            <p className="text-sm text-t3">
              Each variable represents a step from star formation to detectable civilization.
              Adjust the sliders below to explore different scenarios for your world.
            </p>
          </div>
        </CollapsibleSection>

        {/* Variables Section */}
        <CollapsibleSection
          id="section-variables"
          title="Variables"
          icon={<Calculator className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="space-y-8">
            {DRAKE_VARIABLES.map((variable) => (
              <div key={variable.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-base font-medium">
                        {variable.symbol}, {variable.name}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-t2" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">{variable.description}</p>
                          <p className="text-xs text-t4">{variable.scientificRange.note}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-t3 mb-2">{variable.description}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <span className="text-2xl font-mono font-medium text-primary">
                      {variable.useLogScale
                        ? formatNumber(formState.values[variable.id as keyof FormState["values"]])
                        : formState.values[variable.id as keyof FormState["values"]].toFixed(variable.step < 1 ? 2 : 0)
                      }
                    </span>
                    {variable.unit && (
                      <span className="text-xs text-t4 block">{variable.unit}</span>
                    )}
                  </div>
                </div>

                <Slider
                  value={[variable.useLogScale
                    ? Math.log10(formState.values[variable.id as keyof FormState["values"]])
                    : formState.values[variable.id as keyof FormState["values"]]
                  ]}
                  min={variable.useLogScale ? Math.log10(variable.min) : variable.min}
                  max={variable.useLogScale ? Math.log10(variable.max) : variable.max}
                  step={variable.useLogScale ? 0.1 : variable.step}
                  onValueChange={([val]) => {
                    const actualValue = variable.useLogScale ? Math.pow(10, val) : val;
                    updateValue(variable.id as keyof FormState["values"], actualValue);
                  }}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-t4">
                  <span>{variable.useLogScale ? formatNumber(variable.min) : variable.min}</span>
                  <span className="text-primary/70">
                    Scientific range: {variable.scientificRange.low}–{variable.useLogScale ? formatNumber(variable.scientificRange.high) : variable.scientificRange.high}
                  </span>
                  <span>{variable.useLogScale ? formatNumber(variable.max) : variable.max}</span>
                </div>

                <p className="text-xs text-t4 italic">{variable.worldbuildingNote}</p>

                <Textarea
                  placeholder={`Your notes on ${variable.name.toLowerCase()} in your world...`}
                  value={formState.notes[variable.id as keyof FormState["notes"]]}
                  onChange={(e) => updateNote(variable.id as keyof FormState["notes"], e.target.value)}
                  className="mt-2 text-sm"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Result Section */}
        <CollapsibleSection
          id="section-result"
          title="Result: N"
          icon={<Calculator className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="text-center py-8">
            <div className="text-sm text-t3 mb-2">
              Estimated number of detectable civilizations:
            </div>
            <div className={`text-6xl font-mono font-medium mb-4 ${interpretation.color}`}>
              {formatNumber(N)}
            </div>
            <Badge variant="outline" className={`text-lg px-4 py-1 ${interpretation.color}`}>
              {interpretation.label}
            </Badge>
            <p className="text-t2 mt-4 max-w-xl mx-auto">
              {interpretation.description}
            </p>

            <div className="mt-8 bg-accent/20 rounded-none p-4 text-left">
              <h4 className="font-medium mb-2">The Equation</h4>
              <div className="font-mono text-sm overflow-x-auto">
                N = {formState.values.rStar} × {formState.values.fp} × {formState.values.ne} × {formState.values.fl} × {formState.values.fi} × {formState.values.fc} × {formatNumber(formState.values.L)}
              </div>
              <div className="font-mono text-sm mt-1 text-primary">
                N = {formatNumber(N)}
              </div>
            </div>

            {/* Multiplicative Chain Visualization */}
            <div className="mt-8 space-y-2">
              <h4 className="font-mono text-xs uppercase tracking-sf-wide text-t2 text-center mb-4">
                Factor Contribution
              </h4>
              {(() => {
                const factors = [
                  { symbol: "R*", value: formState.values.rStar, label: "Star Formation" },
                  { symbol: "fp", value: formState.values.fp, label: "Have Planets" },
                  { symbol: "ne", value: formState.values.ne, label: "Habitable" },
                  { symbol: "fl", value: formState.values.fl, label: "Life Develops" },
                  { symbol: "fi", value: formState.values.fi, label: "Intelligence" },
                  { symbol: "fc", value: formState.values.fc, label: "Technology" },
                  { symbol: "L", value: formState.values.L, label: "Longevity" },
                ];
                let running = 1;
                const steps = factors.map((f) => {
                  running *= f.value;
                  return { ...f, cumulative: running };
                });
                const maxLog = Math.log10(Math.max(...steps.map((s) => Math.max(s.cumulative, 0.0001))));
                const minLog = Math.log10(Math.max(Math.min(...steps.map((s) => Math.max(s.cumulative, 0.0001))), 0.0001));
                const range = Math.max(maxLog - minLog, 1);
                return steps.map((step, i) => {
                  const logVal = Math.log10(Math.max(step.cumulative, 0.0001));
                  const barWidth = Math.max(6, ((logVal - minLog) / range) * 80 + 10);
                  return (
                    <div key={step.symbol} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-t3 w-8 text-right shrink-0">
                        {step.symbol}
                      </span>
                      <div className="flex-1 relative h-5">
                        <div
                          className="absolute left-1/2 top-0 h-full rounded-sm transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            transform: 'translateX(-50%)',
                            background: `linear-gradient(90deg, rgba(21,193,123,0.1), rgba(21,193,123,${0.12 + (1 - i / 7) * 0.3}), rgba(21,193,123,0.1))`,
                            border: '1px solid rgba(21,193,123,0.12)',
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-t4 w-20 text-right shrink-0">
                        {step.cumulative < 0.01
                          ? step.cumulative.toExponential(1)
                          : step.cumulative < 1000
                          ? step.cumulative.toFixed(2)
                          : step.cumulative < 1000000
                          ? `${(step.cumulative / 1000).toFixed(1)}k`
                          : `${(step.cumulative / 1000000).toFixed(1)}M`}
                      </span>
                    </div>
                  );
                });
              })()}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-sf-border">
                <span className="font-mono text-xs text-primary w-8 text-right shrink-0 font-medium">
                  N
                </span>
                <div className="flex-1 text-center">
                  <span className={`font-mono text-lg font-medium ${interpretation.color}`}>
                    {formatNumber(N)}
                  </span>
                </div>
                <Badge variant="outline" className={`text-xs ${interpretation.color} shrink-0`}>
                  {interpretation.label}
                </Badge>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Worldbuilding Section */}
        <CollapsibleSection
          id="section-worldbuilding"
          title="Worldbuilding Implications"
          icon={<ExternalLink className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Your Answer to the Fermi Paradox</Label>
              <p className="text-sm text-t3 mb-2">
                If your N is high but your galaxy seems empty, why? If N is low, what does that mean for your characters?
              </p>
              <Suspense fallback={<div className="h-24 rounded-md bg-accent/10 animate-pulse" />}>
                <RichTextEditor
                  content={formState.worldbuilding.fermiAnswer}
                  onChange={(html) => updateWorldbuilding("fermiAnswer", html)}
                  placeholder="Why haven't we found them? Or why are they everywhere? What's your galaxy's answer to 'Where is everyone?'"
                />
              </Suspense>
            </div>

            <div>
              <Label className="text-base font-medium">Where Is the Great Filter?</Label>
              <p className="text-sm text-t3 mb-2">
                Which step is hardest to pass? This shapes whether your ruins are biological or technological.
              </p>
              <Suspense fallback={<div className="h-24 rounded-md bg-accent/10 animate-pulse" />}>
                <RichTextEditor
                  content={formState.worldbuilding.greatFilterLocation}
                  onChange={(html) => updateWorldbuilding("greatFilterLocation", html)}
                  placeholder="Is life hard to start? Intelligence rare? Technology self-destructive? Civilizations short-lived?"
                />
              </Suspense>
            </div>

            <div>
              <Label className="text-base font-medium">Character of Your Galaxy</Label>
              <p className="text-sm text-t3 mb-2">
                Based on your N, what's the general feel of space travel in your world?
              </p>
              <Suspense fallback={<div className="h-24 rounded-md bg-accent/10 animate-pulse" />}>
                <RichTextEditor
                  content={formState.worldbuilding.galaxyCharacter}
                  onChange={(html) => updateWorldbuilding("galaxyCharacter", html)}
                  placeholder="Crowded and political? Empty and haunting? Scattered with ancient ruins? Teeming with diversity?"
                />
              </Suspense>
            </div>

            <div>
              <Label className="text-base font-medium">Story Implications</Label>
              <p className="text-sm text-t3 mb-2">
                What kinds of stories does your galactic population enable or prevent?
              </p>
              <Suspense fallback={<div className="h-24 rounded-md bg-accent/10 animate-pulse" />}>
                <RichTextEditor
                  content={formState.worldbuilding.storyImplications}
                  onChange={(html) => updateWorldbuilding("storyImplications", html)}
                  placeholder="First contact stories? Galactic wars? Lonely exploration? Ancient mysteries?"
                />
              </Suspense>
            </div>

            <div>
              <Label className="text-base font-medium">Types of Civilizations</Label>
              <p className="text-sm text-t3 mb-2">
                What kinds of civilizations exist in your galaxy? What are their relationships?
              </p>
              <Suspense fallback={<div className="h-24 rounded-md bg-accent/10 animate-pulse" />}>
                <RichTextEditor
                  content={formState.worldbuilding.civilizationTypes}
                  onChange={(html) => updateWorldbuilding("civilizationTypes", html)}
                  placeholder="Elder races? Young upstarts? Hive minds? Artificial intelligences? Machine civilizations?"
                />
              </Suspense>
            </div>
          </div>
        </CollapsibleSection>

        {/* Presets Section */}
        <CollapsibleSection
          id="section-presets"
          title="Scenario Presets"
          icon={<Info className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <p className="text-sm text-t3 mb-4">
            Click a preset to load its values. These represent common science fiction scenarios.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {PRESETS.map((preset) => (
              <GlassPanel
                key={preset.id}
                className="p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <h4 className="font-medium mb-1">{preset.name}</h4>
                <p className="text-sm text-t3 mb-2">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.storyTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </GlassPanel>
            ))}
          </div>
        </CollapsibleSection>

        {/* Learn More Link */}
        <div className="mt-8 text-center">
          <Link
            to="/learn/drake-equation"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Learn more about the Drake Equation for worldbuilding
          </Link>
        </div>


      {/* Worksheet Selector Dialog */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={currentWorld?.name}
          toolType={TOOL_TYPE}
          toolDisplayName="Signal"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Signal"
        worldName={worldNameForExport}
        formState={formState}
        summaryTemplate={
          <DrakeSummaryTemplate
            formState={formState}
            worldName={worldNameForExport}
          />
        }
        fullTemplate={
          <DrakeFullReportTemplate
            formState={formState}
            worldName={worldNameForExport}
          />
        }
        defaultFilename="drake-equation"
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        entityType="worksheet"
        entityId={currentWorksheetId || worksheetId || ""}
        entityTitle={currentWorksheetTitle || "Untitled Worksheet"}
      />

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        content={formState.generalNotes}
        onChange={(html) => setFormState(prev => ({ ...prev, generalNotes: html }))}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || "local"}
        images={formState.moodboard || []}
        onImagesChange={(images) => setFormState(prev => ({ ...prev, moodboard: images }))}
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default DrakeEquationCalculator;
