import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Info,
  Cloud,
  CloudOff,
  Plus,
  Trash2,
  Dna,
  ExternalLink,
  Download,
  Printer,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection } from "@/components/tools/KeyChoicesSidebar";
import { useToast } from "@/hooks/use-toast";
import { useBackground } from "@/hooks/use-background";
import { useWorksheets, useWorksheet, useWorksheetsByType } from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import WorksheetLinkSelector from "@/components/tools/WorksheetLinkSelector";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
import { EvolutionarySummaryTemplate, EvolutionaryFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import { LinkedWorksheetRef, getLinkConfigsForTool } from "@/lib/worksheet-links-config";
import {
  EVOLUTIONARY_BIOLOGY_SECTIONS,
  SURVIVAL_PRESSURES,
  EXTREMOPHILE_INSPIRATIONS,
  BIOCHEMICAL_BASES,
  SOLVENTS,
  ENERGY_SOURCES,
  METABOLIC_RATES,
  RESPIRATION_TYPES,
  ADAPTATION_CATEGORIES,
  COMMON_TRADEOFFS,
  SYMMETRY_TYPES,
  BODY_SEGMENTS,
  LIMB_TYPES,
  INTEGUMENT_TYPES,
  INTERNAL_STRUCTURES,
  COLORATION_FUNCTIONS,
  SENSORY_TYPES,
  SENSORY_ORGAN_LOCATIONS,
  REPRODUCTION_MODES,
  MATING_SYSTEMS,
  FERTILIZATION_TYPES,
  GESTATION_TYPES,
  PARENTAL_CARE_LEVELS,
  LIFESPAN_CATEGORIES,
  SENESCENCE_TYPES,
  GROUP_SIZES,
  SOCIAL_STRUCTURES,
  COOPERATION_MECHANISMS,
  CONFLICT_RESOLUTIONS,
  TERRITORIALITY_TYPES,
  BRAIN_ANALOGS,
  COGNITION_TYPES,
  MEMORY_TYPES,
  LEARNING_MECHANISMS,
  TOOL_USE_LEVELS,
  COMMUNICATION_CHANNELS,
  SIGNAL_RANGES,
  INFORMATION_CAPACITIES,
  EMOTION_ANALOGS,
  MOTIVATIONAL_DRIVES,
  STRESS_RESPONSES,
  CURIOSITY_LEVELS,
  VESTIGIAL_TRAIT_STATES,
  HUMAN_ASSUMPTIONS_TO_AVOID,
  SECTION_GUIDANCE,
} from "@/lib/evolutionary-biology-data";

// Section definitions for navigation
const SECTIONS: Section[] = EVOLUTIONARY_BIOLOGY_SECTIONS.map((s) => ({
  id: `section-${s.id}`,
  title: s.title,
}));

// Types for form state
interface AdaptationEntry {
  trait: string;
  selectivePressure: string;
  tradeoff: string;
}

interface LimbEntry {
  type: string;
  count: string;
  function: string;
}

interface SensoryOrganEntry {
  sense: string;
  location: string;
  capabilities: string;
}

interface LifeStageEntry {
  stage: string;
  duration: string;
  characteristics: string;
}

interface VestigialTraitEntry {
  trait: string;
  ancestralFunction: string;
  currentState: string;
}

interface FormState {
  // Section 1: Foundations
  foundations: {
    primarySurvivalPressures: string[];
    extremophileInspiration: string;
    survivalPressuresNotes: string;
  };

  // Section 2: Biochemistry & Metabolism
  biochemistry: {
    biochemicalBasis: string;
    solvent: string;
    energySource: string;
    metabolicRate: string;
    respirationType: string;
    wasteProducts: string;
    temperatureRange: { min: string; max: string; optimal: string };
    biochemistryNotes: string;
  };

  // Section 3: Evolutionary Adaptations
  adaptations: {
    keyAdaptations: AdaptationEntry[];
    convergentEvolution: string;
    uniqueAdaptations: string;
    adaptationsNotes: string;
  };

  // Section 4: Body Plan & Morphology
  bodyPlan: {
    symmetry: string;
    bodySegments: string;
    limbs: LimbEntry[];
    sizeRange: { min: string; max: string };
    integument: string;
    coloration: string;
    colorationFunction: string;
    internalStructure: string;
    bodyPlanNotes: string;
  };

  // Section 5: Sensory Systems
  sensory: {
    primarySenses: string[];
    sensoryOrgans: SensoryOrganEntry[];
    blindSpots: string;
    environmentalTuning: string;
    sensoryNotes: string;
  };

  // Section 6: Reproduction & Life Cycle
  reproduction: {
    reproductionMode: string;
    matingSystem: string;
    fertilizationType: string;
    gestationType: string;
    offspringCount: string;
    parentalCare: string;
    lifeStages: LifeStageEntry[];
    lifespan: string;
    senescence: string;
    reproductionNotes: string;
  };

  // Section 7: Social Evolution & Structure
  social: {
    groupSize: string;
    socialStructure: string;
    hierarchyType: string;
    cooperationMechanisms: string[];
    conflictResolution: string;
    kinRecognition: string;
    territoriality: string;
    socialNotes: string;
  };

  // Section 8: Intelligence & Cognition
  cognition: {
    brainAnalog: string;
    cognitionType: string;
    problemSolving: string;
    memoryType: string;
    learningMechanisms: string[];
    toolUse: string;
    abstractThinking: string;
    cognitionNotes: string;
  };

  // Section 9: Communication Biology
  communication: {
    primaryChannel: string;
    secondaryChannels: string[];
    signalRange: string;
    informationCapacity: string;
    deception: string;
    culturalTransmission: string;
    communicationNotes: string;
  };

  // Section 10: Psychology from Biology
  psychology: {
    emotionAnalogs: string[];
    motivationalDrives: string[];
    fearResponses: string;
    pleasureResponses: string;
    stressResponse: string;
    curiosityLevel: string;
    psychologyNotes: string;
  };

  // Section 11: Vestigial & Transitional Traits
  vestigial: {
    vestigialTraits: VestigialTraitEntry[];
    transitionalFeatures: string;
    evolutionaryHistory: string;
    vestigialNotes: string;
  };

  // Section 12: Non-Human Viewpoint Test
  viewpointTest: {
    alienPerceptionDifferences: string;
    humanAssumptionsAvoided: string[];
    uniqueWorldview: string;
    viewpointNotes: string;
  };

  // Section 13: Integration & Consistency
  integration: {
    traitInteractions: string;
    ecologicalNiche: string;
    evolutionaryPlausibility: string;
    potentialContradictions: string;
    integrationNotes: string;
  };

  // Worksheet linking
  _linkedWorksheets?: {
    planet?: LinkedWorksheetRef;
    ecr?: LinkedWorksheetRef;
  };
}

const DEFAULT_FORM_STATE: FormState = {
  foundations: {
    primarySurvivalPressures: [],
    extremophileInspiration: "",
    survivalPressuresNotes: "",
  },
  biochemistry: {
    biochemicalBasis: "",
    solvent: "",
    energySource: "",
    metabolicRate: "",
    respirationType: "",
    wasteProducts: "",
    temperatureRange: { min: "", max: "", optimal: "" },
    biochemistryNotes: "",
  },
  adaptations: {
    keyAdaptations: [],
    convergentEvolution: "",
    uniqueAdaptations: "",
    adaptationsNotes: "",
  },
  bodyPlan: {
    symmetry: "",
    bodySegments: "",
    limbs: [],
    sizeRange: { min: "", max: "" },
    integument: "",
    coloration: "",
    colorationFunction: "",
    internalStructure: "",
    bodyPlanNotes: "",
  },
  sensory: {
    primarySenses: [],
    sensoryOrgans: [],
    blindSpots: "",
    environmentalTuning: "",
    sensoryNotes: "",
  },
  reproduction: {
    reproductionMode: "",
    matingSystem: "",
    fertilizationType: "",
    gestationType: "",
    offspringCount: "",
    parentalCare: "",
    lifeStages: [],
    lifespan: "",
    senescence: "",
    reproductionNotes: "",
  },
  social: {
    groupSize: "",
    socialStructure: "",
    hierarchyType: "",
    cooperationMechanisms: [],
    conflictResolution: "",
    kinRecognition: "",
    territoriality: "",
    socialNotes: "",
  },
  cognition: {
    brainAnalog: "",
    cognitionType: "",
    problemSolving: "",
    memoryType: "",
    learningMechanisms: [],
    toolUse: "",
    abstractThinking: "",
    cognitionNotes: "",
  },
  communication: {
    primaryChannel: "",
    secondaryChannels: [],
    signalRange: "",
    informationCapacity: "",
    deception: "",
    culturalTransmission: "",
    communicationNotes: "",
  },
  psychology: {
    emotionAnalogs: [],
    motivationalDrives: [],
    fearResponses: "",
    pleasureResponses: "",
    stressResponse: "",
    curiosityLevel: "",
    psychologyNotes: "",
  },
  vestigial: {
    vestigialTraits: [],
    transitionalFeatures: "",
    evolutionaryHistory: "",
    vestigialNotes: "",
  },
  viewpointTest: {
    alienPerceptionDifferences: "",
    humanAssumptionsAvoided: [],
    uniqueWorldview: "",
    viewpointNotes: "",
  },
  integration: {
    traitInteractions: "",
    ecologicalNiche: "",
    evolutionaryPlausibility: "",
    potentialContradictions: "",
    integrationNotes: "",
  },
};

const TOOL_TYPE = "evolutionary-biology";
const TOOL_DISPLAY_NAME = "Evolutionary Biology";

const EvolutionaryBiology = () => {
  useBackground("dark-galaxy");
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const worldId = searchParams.get("worldId") || undefined;
  const worksheetId = searchParams.get("worksheetId") || undefined;

  // Worksheet management
  const { worlds } = useWorlds();
  const currentWorld = worlds.find((w) => w.id === worldId);
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId);
  const { data: worksheets = [], isLoading: loadingWorksheets } = useWorksheetsByType(worldId, TOOL_TYPE);
  const { data: currentWorksheet, isLoading: loadingWorksheet } = useWorksheet(worksheetId);

  // UI state
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [worksheetTitle, setWorksheetTitle] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showWorksheetSelector, setShowWorksheetSelector] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["section-foundations"])
  );

  // Link configurations for this tool
  const linkConfigs = getLinkConfigsForTool(TOOL_TYPE);

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !loadingWorksheets) {
      setShowWorksheetSelector(true);
    }
  }, [worldId, worksheetId, loadingWorksheets]);

  // Load worksheet data when worksheetId changes
  useEffect(() => {
    if (currentWorksheet) {
      const data = currentWorksheet.data as unknown as FormState;
      setFormState({ ...DEFAULT_FORM_STATE, ...data });
      setWorksheetTitle(currentWorksheet.title || "");
      setHasUnsavedChanges(false);
    }
  }, [currentWorksheet]);

  // Load from localStorage for non-cloud sessions
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem("evolutionary-biology-local");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormState({ ...DEFAULT_FORM_STATE, ...parsed });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [worldId, worksheetId]);

  // Auto-save to localStorage for non-cloud sessions
  useEffect(() => {
    if (!worldId && !worksheetId && hasUnsavedChanges) {
      localStorage.setItem("evolutionary-biology-local", JSON.stringify(formState));
    }
  }, [formState, hasUnsavedChanges, worldId, worksheetId]);

  const updateFormState = <K extends keyof FormState>(
    section: K,
    updates: Partial<FormState[K]>
  ) => {
    setFormState((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!worksheetId || !worldId) {
      toast({
        title: "Cannot save",
        description: "No worksheet selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateWorksheet.mutateAsync({
        worksheetId,
        data: formState as unknown as Json,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateWorksheet = async (name: string): Promise<string> => {
    if (!worldId) throw new Error("No world selected");

    const result = await createWorksheet.mutateAsync({
      worldId,
      toolType: TOOL_TYPE,
      title: name,
      data: DEFAULT_FORM_STATE as unknown as Json,
    });

    return result.id;
  };

  const handleSelectWorksheet = (id: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: id });
    setShowWorksheetSelector(false);
  };

  const toggleSection = (sectionId: string) => {
    // Preserve scroll position to prevent jumping to top
    const scrollY = window.scrollY;
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const handleLinkedWorksheetChange = (
    key: "planet" | "ecr",
    ref: LinkedWorksheetRef | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      _linkedWorksheets: {
        ...prev._linkedWorksheets,
        [key]: ref,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Multi-select checkbox group
  const CheckboxGroup = ({
    options,
    selected,
    onChange,
    columns = 2,
  }: {
    options: { id: string; name: string; description?: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    columns?: number;
  }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-3`}>
      {options.map((option) => {
        const isChecked = selected.includes(option.id);
        return (
          <div
            key={option.id}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={0}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              if (isChecked) {
                onChange(selected.filter((id) => id !== option.id));
              } else {
                onChange([...selected, option.id]);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (isChecked) {
                  onChange(selected.filter((id) => id !== option.id));
                } else {
                  onChange([...selected, option.id]);
                }
              }
            }}
          >
            <Checkbox
              checked={isChecked}
              tabIndex={-1}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...selected, option.id]);
                } else {
                  onChange(selected.filter((id) => id !== option.id));
                }
              }}
            />
            <div>
              <span className="font-medium text-sm">{option.name}</span>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Dynamic list with add/remove
  const DynamicList = <T extends Record<string, string>>({
    items,
    onChange,
    renderItem,
    newItem,
    addLabel,
  }: {
    items: T[];
    onChange: (items: T[]) => void;
    renderItem: (item: T, index: number, updateItem: (updates: Partial<T>) => void) => React.ReactNode;
    newItem: T;
    addLabel: string;
  }) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1">{renderItem(item, index, (updates) => {
            const newItems = [...items];
            newItems[index] = { ...item, ...updates };
            onChange(newItems);
          })}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="h-10 w-10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, newItem])}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        {addLabel}
      </Button>
    </div>
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const EXTERNAL_RESOURCES = [
    { name: "Atomic Rockets - Aliens", url: "http://www.projectrho.com/public_html/rocket/aliens.php", description: "Hard SF alien design" },
    { name: "Speculative Evolution Wiki", url: "https://speculativeevolution.fandom.com/", description: "Community speculative biology" },
    { name: "Evolution 101", url: "https://evolution.berkeley.edu/evolution-101/", description: "Evolutionary principles" },
  ];

  // Generate key choices for sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const getName = <T extends { id: string; name: string }>(arr: T[], id: string) =>
      arr.find((item) => item.id === id)?.name || id;
    const getNames = <T extends { id: string; name: string }>(arr: T[], ids: string[]) =>
      ids.map((id) => getName(arr, id)).filter(Boolean);

    return [
      {
        id: "linked",
        title: "Linked Worksheets",
        choices: [
          {
            label: "Planet",
            value: formState._linkedWorksheets?.planet?.syncedData?.title as string | undefined,
          },
          {
            label: "Environment",
            value: formState._linkedWorksheets?.ecr?.syncedData?.title as string | undefined,
          },
        ],
      },
      {
        id: "foundations",
        title: "1. Foundations",
        choices: [
          {
            label: "Survival Pressures",
            value: getNames(SURVIVAL_PRESSURES, formState.foundations.primarySurvivalPressures),
            asList: true,
          },
          {
            label: "Extremophile",
            value: getName(EXTREMOPHILE_INSPIRATIONS, formState.foundations.extremophileInspiration),
          },
        ],
      },
      {
        id: "biochemistry",
        title: "2. Biochemistry",
        choices: [
          { label: "Basis", value: getName(BIOCHEMICAL_BASES, formState.biochemistry.biochemicalBasis) },
          { label: "Solvent", value: getName(SOLVENTS, formState.biochemistry.solvent) },
          { label: "Energy", value: getName(ENERGY_SOURCES, formState.biochemistry.energySource) },
          { label: "Metabolism", value: getName(METABOLIC_RATES, formState.biochemistry.metabolicRate) },
        ],
      },
      {
        id: "body-plan",
        title: "4. Body Plan",
        choices: [
          { label: "Symmetry", value: getName(SYMMETRY_TYPES, formState.bodyPlan.symmetry) },
          { label: "Integument", value: getName(INTEGUMENT_TYPES, formState.bodyPlan.integument) },
          { label: "Size", value: formState.bodyPlan.sizeRange.min && formState.bodyPlan.sizeRange.max
            ? `${formState.bodyPlan.sizeRange.min} - ${formState.bodyPlan.sizeRange.max}`
            : undefined },
        ],
      },
      {
        id: "sensory",
        title: "5. Sensory",
        choices: [
          { label: "Primary Senses", value: getNames(SENSORY_TYPES, formState.sensory.primarySenses), asList: true },
        ],
      },
      {
        id: "reproduction",
        title: "6. Reproduction",
        choices: [
          { label: "Mode", value: getName(REPRODUCTION_MODES, formState.reproduction.reproductionMode) },
          { label: "Mating System", value: getName(MATING_SYSTEMS, formState.reproduction.matingSystem) },
          { label: "Parental Care", value: getName(PARENTAL_CARE_LEVELS, formState.reproduction.parentalCare) },
          { label: "Lifespan", value: getName(LIFESPAN_CATEGORIES, formState.reproduction.lifespan) },
        ],
      },
      {
        id: "social",
        title: "7. Social",
        choices: [
          { label: "Group Size", value: getName(GROUP_SIZES, formState.social.groupSize) },
          { label: "Structure", value: getName(SOCIAL_STRUCTURES, formState.social.socialStructure) },
          { label: "Territoriality", value: getName(TERRITORIALITY_TYPES, formState.social.territoriality) },
        ],
      },
      {
        id: "cognition",
        title: "8. Cognition",
        choices: [
          { label: "Brain Analog", value: getName(BRAIN_ANALOGS, formState.cognition.brainAnalog) },
          { label: "Type", value: getName(COGNITION_TYPES, formState.cognition.cognitionType) },
          { label: "Tool Use", value: getName(TOOL_USE_LEVELS, formState.cognition.toolUse) },
        ],
      },
      {
        id: "communication",
        title: "9. Communication",
        choices: [
          { label: "Primary Channel", value: getName(COMMUNICATION_CHANNELS, formState.communication.primaryChannel) },
          { label: "Signal Range", value: getName(SIGNAL_RANGES, formState.communication.signalRange) },
        ],
      },
      {
        id: "psychology",
        title: "10. Psychology",
        choices: [
          { label: "Emotions", value: getNames(EMOTION_ANALOGS, formState.psychology.emotionAnalogs), asList: true },
          { label: "Stress Response", value: getName(STRESS_RESPONSES, formState.psychology.stressResponse) },
          { label: "Curiosity", value: getName(CURIOSITY_LEVELS, formState.psychology.curiosityLevel) },
        ],
      },
    ];
  }, [formState]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            to={worldId ? `/worlds/${worldId}` : "/"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {worldId ? "Back to World" : "Back to Dashboard"}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className="mb-2">Tool 7</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Evolutionary Biology Design Sheet
              </h1>
              {worksheetTitle && (
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-primary/10 w-fit">
                  <Dna className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">{worksheetTitle}</span>
                </div>
              )}
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Design biologically plausible alien species by tracing every trait back to evolutionary pressures.
              </p>
            </div>

            <div className="flex items-center gap-2 no-print">
              {worldId && user ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-green-500" />
                  Cloud sync enabled
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CloudOff className="w-3 h-3" />
                  Local only
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleSave} disabled={!worksheetId}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-display text-xl font-semibold mb-4 gradient-text">
            Building Believable Biology
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Every trait is a solution to a problem. Every solution creates new problems."
          </blockquote>
          <p className="text-muted-foreground mb-4">
            This tool helps you design alien species where biology emerges from environment, and psychology emerges from biology. Start with the survival pressures your world creates, then trace their consequences through biochemistry, body plan, sensory systems, reproduction, social structure, cognition, and psychology.
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <strong className="text-foreground">The Evolutionary Cascade:</strong>
            <p className="mt-1">Environment → Survival Pressures → Biochemistry → Body Plan → Sensory Systems → Reproduction → Social Structure → Cognition → Communication → Psychology</p>
          </div>

          {/* External Resources */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Reference Resources</h4>
            <div className="flex flex-wrap gap-2">
              {EXTERNAL_RESOURCES.map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {resource.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </GlassPanel>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <GlassPanel className="p-6">

              {/* Section 1: Foundations */}
              <CollapsibleSection
                id="section-foundations"
                title="1. Foundations"
                guidance={SECTION_GUIDANCE.foundations}
                variant="minimal"
                open={expandedSections.has("section-foundations")}
                onOpenChange={() => toggleSection("section-foundations")}
              >
                {/* Worksheet Links */}
                {worldId && (
                  <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/20">
                    <h4 className="font-medium text-sm">Link to Existing Worksheets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {linkConfigs.map((config) => (
                        <WorksheetLinkSelector
                          key={config.key}
                          worldId={worldId}
                          targetToolType={config.targetTool}
                          label={config.label}
                          description={config.description}
                          syncFields={config.syncFields}
                          value={formState._linkedWorksheets?.[config.key as "planet" | "ecr"]}
                          onChange={(ref) => handleLinkedWorksheetChange(config.key as "planet" | "ecr", ref)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Primary Survival Pressures</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    What environmental challenges shaped this species?
                  </p>
                  <CheckboxGroup
                    options={SURVIVAL_PRESSURES}
                    selected={formState.foundations.primarySurvivalPressures}
                    onChange={(selected) =>
                      updateFormState("foundations", { primarySurvivalPressures: selected })
                    }
                    columns={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Extremophile Inspiration</Label>
                  <Select
                    value={formState.foundations.extremophileInspiration}
                    onValueChange={(value) =>
                      updateFormState("foundations", { extremophileInspiration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select extremophile type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTREMOPHILE_INSPIRATIONS.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.foundations.survivalPressuresNotes}
                    onChange={(e) =>
                      updateFormState("foundations", { survivalPressuresNotes: e.target.value })
                    }
                    placeholder="How do these pressures connect to your world's environment?"
                    className="min-h-[100px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 2: Biochemistry */}
              <CollapsibleSection
                id="section-biochemistry"
                title="2. Biochemistry & Metabolism"
                guidance={SECTION_GUIDANCE.biochemistry}
                variant="minimal"
                open={expandedSections.has("section-biochemistry")}
                onOpenChange={() => toggleSection("section-biochemistry")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Biochemical Basis</Label>
                    <Select
                      value={formState.biochemistry.biochemicalBasis}
                      onValueChange={(value) =>
                        updateFormState("biochemistry", { biochemicalBasis: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BIOCHEMICAL_BASES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Solvent</Label>
                    <Select
                      value={formState.biochemistry.solvent}
                      onValueChange={(value) =>
                        updateFormState("biochemistry", { solvent: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SOLVENTS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Energy Source</Label>
                    <Select
                      value={formState.biochemistry.energySource}
                      onValueChange={(value) =>
                        updateFormState("biochemistry", { energySource: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ENERGY_SOURCES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Metabolic Rate</Label>
                    <Select
                      value={formState.biochemistry.metabolicRate}
                      onValueChange={(value) =>
                        updateFormState("biochemistry", { metabolicRate: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {METABOLIC_RATES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Respiration Type</Label>
                    <Select
                      value={formState.biochemistry.respirationType}
                      onValueChange={(value) =>
                        updateFormState("biochemistry", { respirationType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {RESPIRATION_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Waste Products</Label>
                  <Input
                    value={formState.biochemistry.wasteProducts}
                    onChange={(e) =>
                      updateFormState("biochemistry", { wasteProducts: e.target.value })
                    }
                    placeholder="What metabolic byproducts does this species produce?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Temperature Range (°C)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Min</Label>
                      <Input
                        value={formState.biochemistry.temperatureRange.min}
                        onChange={(e) =>
                          updateFormState("biochemistry", {
                            temperatureRange: { ...formState.biochemistry.temperatureRange, min: e.target.value },
                          })
                        }
                        placeholder="-20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Optimal</Label>
                      <Input
                        value={formState.biochemistry.temperatureRange.optimal}
                        onChange={(e) =>
                          updateFormState("biochemistry", {
                            temperatureRange: { ...formState.biochemistry.temperatureRange, optimal: e.target.value },
                          })
                        }
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max</Label>
                      <Input
                        value={formState.biochemistry.temperatureRange.max}
                        onChange={(e) =>
                          updateFormState("biochemistry", {
                            temperatureRange: { ...formState.biochemistry.temperatureRange, max: e.target.value },
                          })
                        }
                        placeholder="45"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.biochemistry.biochemistryNotes}
                    onChange={(e) =>
                      updateFormState("biochemistry", { biochemistryNotes: e.target.value })
                    }
                    placeholder="How does the biochemistry connect to the environment?"
                    className="min-h-[100px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 3: Evolutionary Adaptations */}
              <CollapsibleSection
                id="section-adaptations"
                title="3. Evolutionary Adaptations"
                guidance={SECTION_GUIDANCE.adaptations}
                variant="minimal"
                open={expandedSections.has("section-adaptations")}
                onOpenChange={() => toggleSection("section-adaptations")}
              >
                <div className="space-y-2">
                  <Label>Key Adaptations</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    For each trait, identify what pressure selected for it and what tradeoff it required.
                  </p>
                  <DynamicList
                    items={formState.adaptations.keyAdaptations}
                    onChange={(items) => updateFormState("adaptations", { keyAdaptations: items })}
                    newItem={{ trait: "", selectivePressure: "", tradeoff: "" }}
                    addLabel="Add Adaptation"
                    renderItem={(item, _, updateItem) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border/50">
                        <Input
                          value={item.trait}
                          onChange={(e) => updateItem({ trait: e.target.value })}
                          placeholder="Trait (e.g., thick hide)"
                        />
                        <Input
                          value={item.selectivePressure}
                          onChange={(e) => updateItem({ selectivePressure: e.target.value })}
                          placeholder="Pressure (e.g., predation)"
                        />
                        <Input
                          value={item.tradeoff}
                          onChange={(e) => updateItem({ tradeoff: e.target.value })}
                          placeholder="Tradeoff (e.g., slow movement)"
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Convergent Evolution</Label>
                  <Textarea
                    value={formState.adaptations.convergentEvolution}
                    onChange={(e) =>
                      updateFormState("adaptations", { convergentEvolution: e.target.value })
                    }
                    placeholder="What Earth organisms does this species resemble and why?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unique Adaptations</Label>
                  <Textarea
                    value={formState.adaptations.uniqueAdaptations}
                    onChange={(e) =>
                      updateFormState("adaptations", { uniqueAdaptations: e.target.value })
                    }
                    placeholder="What traits have no Earth parallel? Why did they evolve?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.adaptations.adaptationsNotes}
                    onChange={(e) =>
                      updateFormState("adaptations", { adaptationsNotes: e.target.value })
                    }
                    placeholder="Additional notes on adaptations..."
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 4: Body Plan */}
              <CollapsibleSection
                id="section-body-plan"
                title="4. Body Plan & Morphology"
                guidance={SECTION_GUIDANCE["body-plan"]}
                variant="minimal"
                open={expandedSections.has("section-body-plan")}
                onOpenChange={() => toggleSection("section-body-plan")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symmetry</Label>
                    <Select
                      value={formState.bodyPlan.symmetry}
                      onValueChange={(value) =>
                        updateFormState("bodyPlan", { symmetry: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMMETRY_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Body Segments</Label>
                    <Select
                      value={formState.bodyPlan.bodySegments}
                      onValueChange={(value) =>
                        updateFormState("bodyPlan", { bodySegments: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_SEGMENTS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Integument (Covering)</Label>
                    <Select
                      value={formState.bodyPlan.integument}
                      onValueChange={(value) =>
                        updateFormState("bodyPlan", { integument: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEGUMENT_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Structure</Label>
                    <Select
                      value={formState.bodyPlan.internalStructure}
                      onValueChange={(value) =>
                        updateFormState("bodyPlan", { internalStructure: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERNAL_STRUCTURES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Limbs & Appendages</Label>
                  <DynamicList
                    items={formState.bodyPlan.limbs}
                    onChange={(items) => updateFormState("bodyPlan", { limbs: items })}
                    newItem={{ type: "", count: "", function: "" }}
                    addLabel="Add Limb Type"
                    renderItem={(item, _, updateItem) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border/50">
                        <Select
                          value={item.type}
                          onValueChange={(value) => updateItem({ type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {LIMB_TYPES.map((lt) => (
                              <SelectItem key={lt.id} value={lt.id}>
                                {lt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={item.count}
                          onChange={(e) => updateItem({ count: e.target.value })}
                          placeholder="Count (e.g., 4)"
                        />
                        <Input
                          value={item.function}
                          onChange={(e) => updateItem({ function: e.target.value })}
                          placeholder="Function (e.g., locomotion)"
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Size Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      value={formState.bodyPlan.sizeRange.min}
                      onChange={(e) =>
                        updateFormState("bodyPlan", {
                          sizeRange: { ...formState.bodyPlan.sizeRange, min: e.target.value },
                        })
                      }
                      placeholder="Min size (e.g., 1m)"
                    />
                    <Input
                      value={formState.bodyPlan.sizeRange.max}
                      onChange={(e) =>
                        updateFormState("bodyPlan", {
                          sizeRange: { ...formState.bodyPlan.sizeRange, max: e.target.value },
                        })
                      }
                      placeholder="Max size (e.g., 3m)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coloration</Label>
                    <Input
                      value={formState.bodyPlan.coloration}
                      onChange={(e) =>
                        updateFormState("bodyPlan", { coloration: e.target.value })
                      }
                      placeholder="Describe colors and patterns..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coloration Function</Label>
                    <Select
                      value={formState.bodyPlan.colorationFunction}
                      onValueChange={(value) =>
                        updateFormState("bodyPlan", { colorationFunction: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORATION_FUNCTIONS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.bodyPlan.bodyPlanNotes}
                    onChange={(e) =>
                      updateFormState("bodyPlan", { bodyPlanNotes: e.target.value })
                    }
                    placeholder="How does the body plan serve survival needs?"
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 5: Sensory Systems */}
              <CollapsibleSection
                id="section-sensory"
                title="5. Sensory Systems"
                guidance={SECTION_GUIDANCE.sensory}
                variant="minimal"
                open={expandedSections.has("section-sensory")}
                onOpenChange={() => toggleSection("section-sensory")}
              >
                <div className="space-y-2">
                  <Label>Primary Senses</Label>
                  <CheckboxGroup
                    options={SENSORY_TYPES}
                    selected={formState.sensory.primarySenses}
                    onChange={(selected) =>
                      updateFormState("sensory", { primarySenses: selected })
                    }
                    columns={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sensory Organs</Label>
                  <DynamicList
                    items={formState.sensory.sensoryOrgans}
                    onChange={(items) => updateFormState("sensory", { sensoryOrgans: items })}
                    newItem={{ sense: "", location: "", capabilities: "" }}
                    addLabel="Add Sensory Organ"
                    renderItem={(item, _, updateItem) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border/50">
                        <Select
                          value={item.sense}
                          onValueChange={(value) => updateItem({ sense: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sense..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SENSORY_TYPES.map((st) => (
                              <SelectItem key={st.id} value={st.id}>
                                {st.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={item.location}
                          onValueChange={(value) => updateItem({ location: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Location..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SENSORY_ORGAN_LOCATIONS.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={item.capabilities}
                          onChange={(e) => updateItem({ capabilities: e.target.value })}
                          placeholder="Capabilities..."
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Blind Spots / Limitations</Label>
                  <Textarea
                    value={formState.sensory.blindSpots}
                    onChange={(e) =>
                      updateFormState("sensory", { blindSpots: e.target.value })
                    }
                    placeholder="What can't this species perceive? What's invisible to them?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Environmental Tuning</Label>
                  <Textarea
                    value={formState.sensory.environmentalTuning}
                    onChange={(e) =>
                      updateFormState("sensory", { environmentalTuning: e.target.value })
                    }
                    placeholder="How are senses adapted to the specific environment?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.sensory.sensoryNotes}
                    onChange={(e) =>
                      updateFormState("sensory", { sensoryNotes: e.target.value })
                    }
                    placeholder="Additional notes on sensory systems..."
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 6: Reproduction */}
              <CollapsibleSection
                id="section-reproduction"
                title="6. Reproduction & Life Cycle"
                guidance={SECTION_GUIDANCE.reproduction}
                variant="minimal"
                open={expandedSections.has("section-reproduction")}
                onOpenChange={() => toggleSection("section-reproduction")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reproduction Mode</Label>
                    <Select
                      value={formState.reproduction.reproductionMode}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { reproductionMode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REPRODUCTION_MODES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mating System</Label>
                    <Select
                      value={formState.reproduction.matingSystem}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { matingSystem: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MATING_SYSTEMS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fertilization Type</Label>
                    <Select
                      value={formState.reproduction.fertilizationType}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { fertilizationType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FERTILIZATION_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gestation Type</Label>
                    <Select
                      value={formState.reproduction.gestationType}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { gestationType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GESTATION_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Parental Care</Label>
                    <Select
                      value={formState.reproduction.parentalCare}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { parentalCare: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PARENTAL_CARE_LEVELS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Offspring Count</Label>
                    <Input
                      value={formState.reproduction.offspringCount}
                      onChange={(e) =>
                        updateFormState("reproduction", { offspringCount: e.target.value })
                      }
                      placeholder="e.g., 1-3 per cycle"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Life Stages</Label>
                  <DynamicList
                    items={formState.reproduction.lifeStages}
                    onChange={(items) => updateFormState("reproduction", { lifeStages: items })}
                    newItem={{ stage: "", duration: "", characteristics: "" }}
                    addLabel="Add Life Stage"
                    renderItem={(item, _, updateItem) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border/50">
                        <Input
                          value={item.stage}
                          onChange={(e) => updateItem({ stage: e.target.value })}
                          placeholder="Stage name"
                        />
                        <Input
                          value={item.duration}
                          onChange={(e) => updateItem({ duration: e.target.value })}
                          placeholder="Duration"
                        />
                        <Input
                          value={item.characteristics}
                          onChange={(e) => updateItem({ characteristics: e.target.value })}
                          placeholder="Key characteristics"
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lifespan</Label>
                    <Select
                      value={formState.reproduction.lifespan}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { lifespan: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LIFESPAN_CATEGORIES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Senescence</Label>
                    <Select
                      value={formState.reproduction.senescence}
                      onValueChange={(value) =>
                        updateFormState("reproduction", { senescence: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SENESCENCE_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.reproduction.reproductionNotes}
                    onChange={(e) =>
                      updateFormState("reproduction", { reproductionNotes: e.target.value })
                    }
                    placeholder="How does reproduction strategy fit the environment?"
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 7: Social */}
              <CollapsibleSection
                id="section-social"
                title="7. Social Evolution & Structure"
                guidance={SECTION_GUIDANCE.social}
                variant="minimal"
                open={expandedSections.has("section-social")}
                onOpenChange={() => toggleSection("section-social")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Group Size</Label>
                    <Select
                      value={formState.social.groupSize}
                      onValueChange={(value) =>
                        updateFormState("social", { groupSize: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_SIZES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Social Structure</Label>
                    <Select
                      value={formState.social.socialStructure}
                      onValueChange={(value) =>
                        updateFormState("social", { socialStructure: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_STRUCTURES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Conflict Resolution</Label>
                    <Select
                      value={formState.social.conflictResolution}
                      onValueChange={(value) =>
                        updateFormState("social", { conflictResolution: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CONFLICT_RESOLUTIONS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Territoriality</Label>
                    <Select
                      value={formState.social.territoriality}
                      onValueChange={(value) =>
                        updateFormState("social", { territoriality: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TERRITORIALITY_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cooperation Mechanisms</Label>
                  <CheckboxGroup
                    options={COOPERATION_MECHANISMS}
                    selected={formState.social.cooperationMechanisms}
                    onChange={(selected) =>
                      updateFormState("social", { cooperationMechanisms: selected })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hierarchy Type</Label>
                  <Input
                    value={formState.social.hierarchyType}
                    onChange={(e) =>
                      updateFormState("social", { hierarchyType: e.target.value })
                    }
                    placeholder="Describe the hierarchy structure..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kin Recognition</Label>
                  <Input
                    value={formState.social.kinRecognition}
                    onChange={(e) =>
                      updateFormState("social", { kinRecognition: e.target.value })
                    }
                    placeholder="How do they recognize relatives?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.social.socialNotes}
                    onChange={(e) =>
                      updateFormState("social", { socialNotes: e.target.value })
                    }
                    placeholder="How did social structure evolve from survival needs?"
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 8: Cognition */}
              <CollapsibleSection
                id="section-cognition"
                title="8. Intelligence & Cognition"
                guidance={SECTION_GUIDANCE.cognition}
                variant="minimal"
                open={expandedSections.has("section-cognition")}
                onOpenChange={() => toggleSection("section-cognition")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brain Analog</Label>
                    <Select
                      value={formState.cognition.brainAnalog}
                      onValueChange={(value) =>
                        updateFormState("cognition", { brainAnalog: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAIN_ANALOGS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cognition Type</Label>
                    <Select
                      value={formState.cognition.cognitionType}
                      onValueChange={(value) =>
                        updateFormState("cognition", { cognitionType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COGNITION_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Memory Type</Label>
                    <Select
                      value={formState.cognition.memoryType}
                      onValueChange={(value) =>
                        updateFormState("cognition", { memoryType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMORY_TYPES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tool Use</Label>
                    <Select
                      value={formState.cognition.toolUse}
                      onValueChange={(value) =>
                        updateFormState("cognition", { toolUse: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TOOL_USE_LEVELS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Learning Mechanisms</Label>
                  <CheckboxGroup
                    options={LEARNING_MECHANISMS}
                    selected={formState.cognition.learningMechanisms}
                    onChange={(selected) =>
                      updateFormState("cognition", { learningMechanisms: selected })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Problem Solving</Label>
                  <Textarea
                    value={formState.cognition.problemSolving}
                    onChange={(e) =>
                      updateFormState("cognition", { problemSolving: e.target.value })
                    }
                    placeholder="How does this species approach novel challenges?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Abstract Thinking</Label>
                  <Textarea
                    value={formState.cognition.abstractThinking}
                    onChange={(e) =>
                      updateFormState("cognition", { abstractThinking: e.target.value })
                    }
                    placeholder="Can they think about non-present things? Plan for the future?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.cognition.cognitionNotes}
                    onChange={(e) =>
                      updateFormState("cognition", { cognitionNotes: e.target.value })
                    }
                    placeholder="What survival challenge demanded this level of intelligence?"
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 9: Communication */}
              <CollapsibleSection
                id="section-communication"
                title="9. Communication Biology"
                guidance={SECTION_GUIDANCE.communication}
                variant="minimal"
                open={expandedSections.has("section-communication")}
                onOpenChange={() => toggleSection("section-communication")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Channel</Label>
                    <Select
                      value={formState.communication.primaryChannel}
                      onValueChange={(value) =>
                        updateFormState("communication", { primaryChannel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_CHANNELS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Signal Range</Label>
                    <Select
                      value={formState.communication.signalRange}
                      onValueChange={(value) =>
                        updateFormState("communication", { signalRange: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNAL_RANGES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Information Capacity</Label>
                    <Select
                      value={formState.communication.informationCapacity}
                      onValueChange={(value) =>
                        updateFormState("communication", { informationCapacity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {INFORMATION_CAPACITIES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Channels</Label>
                  <CheckboxGroup
                    options={COMMUNICATION_CHANNELS}
                    selected={formState.communication.secondaryChannels}
                    onChange={(selected) =>
                      updateFormState("communication", { secondaryChannels: selected })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deception</Label>
                  <Textarea
                    value={formState.communication.deception}
                    onChange={(e) =>
                      updateFormState("communication", { deception: e.target.value })
                    }
                    placeholder="Can they deceive? How do they detect deception?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cultural Transmission</Label>
                  <Textarea
                    value={formState.communication.culturalTransmission}
                    onChange={(e) =>
                      updateFormState("communication", { culturalTransmission: e.target.value })
                    }
                    placeholder="How is knowledge passed between generations?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.communication.communicationNotes}
                    onChange={(e) =>
                      updateFormState("communication", { communicationNotes: e.target.value })
                    }
                    placeholder="How does the environment shape communication?"
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 10: Psychology */}
              <CollapsibleSection
                id="section-psychology"
                title="10. Psychology from Biology"
                guidance={SECTION_GUIDANCE.psychology}
                variant="minimal"
                open={expandedSections.has("section-psychology")}
                onOpenChange={() => toggleSection("section-psychology")}
              >
                <div className="space-y-2">
                  <Label>Emotion Analogs</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    What emotional states would evolution have selected for?
                  </p>
                  <CheckboxGroup
                    options={EMOTION_ANALOGS}
                    selected={formState.psychology.emotionAnalogs}
                    onChange={(selected) =>
                      updateFormState("psychology", { emotionAnalogs: selected })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Motivational Drives</Label>
                  <CheckboxGroup
                    options={MOTIVATIONAL_DRIVES}
                    selected={formState.psychology.motivationalDrives}
                    onChange={(selected) =>
                      updateFormState("psychology", { motivationalDrives: selected })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stress Response</Label>
                    <Select
                      value={formState.psychology.stressResponse}
                      onValueChange={(value) =>
                        updateFormState("psychology", { stressResponse: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STRESS_RESPONSES.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Curiosity Level</Label>
                    <Select
                      value={formState.psychology.curiosityLevel}
                      onValueChange={(value) =>
                        updateFormState("psychology", { curiosityLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CURIOSITY_LEVELS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fear Responses</Label>
                  <Textarea
                    value={formState.psychology.fearResponses}
                    onChange={(e) =>
                      updateFormState("psychology", { fearResponses: e.target.value })
                    }
                    placeholder="What triggers fear? How do they respond?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pleasure Responses</Label>
                  <Textarea
                    value={formState.psychology.pleasureResponses}
                    onChange={(e) =>
                      updateFormState("psychology", { pleasureResponses: e.target.value })
                    }
                    placeholder="What triggers pleasure/reward? What feels good?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.psychology.psychologyNotes}
                    onChange={(e) =>
                      updateFormState("psychology", { psychologyNotes: e.target.value })
                    }
                    placeholder="What human emotions might be absent or alien?"
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 11: Vestigial */}
              <CollapsibleSection
                id="section-vestigial"
                title="11. Vestigial & Transitional Traits"
                guidance={SECTION_GUIDANCE.vestigial}
                variant="minimal"
                open={expandedSections.has("section-vestigial")}
                onOpenChange={() => toggleSection("section-vestigial")}
              >
                <div className="space-y-2">
                  <Label>Vestigial Traits</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    What evolutionary leftovers hint at their history?
                  </p>
                  <DynamicList
                    items={formState.vestigial.vestigialTraits}
                    onChange={(items) => updateFormState("vestigial", { vestigialTraits: items })}
                    newItem={{ trait: "", ancestralFunction: "", currentState: "" }}
                    addLabel="Add Vestigial Trait"
                    renderItem={(item, _, updateItem) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border/50">
                        <Input
                          value={item.trait}
                          onChange={(e) => updateItem({ trait: e.target.value })}
                          placeholder="Trait"
                        />
                        <Input
                          value={item.ancestralFunction}
                          onChange={(e) => updateItem({ ancestralFunction: e.target.value })}
                          placeholder="Original function"
                        />
                        <Select
                          value={item.currentState}
                          onValueChange={(value) => updateItem({ currentState: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Current state..." />
                          </SelectTrigger>
                          <SelectContent>
                            {VESTIGIAL_TRAIT_STATES.map((state) => (
                              <SelectItem key={state.id} value={state.id}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transitional Features</Label>
                  <Textarea
                    value={formState.vestigial.transitionalFeatures}
                    onChange={(e) =>
                      updateFormState("vestigial", { transitionalFeatures: e.target.value })
                    }
                    placeholder="What features are currently evolving or changing?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Evolutionary History</Label>
                  <Textarea
                    value={formState.vestigial.evolutionaryHistory}
                    onChange={(e) =>
                      updateFormState("vestigial", { evolutionaryHistory: e.target.value })
                    }
                    placeholder="Describe the species' evolutionary journey..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.vestigial.vestigialNotes}
                    onChange={(e) =>
                      updateFormState("vestigial", { vestigialNotes: e.target.value })
                    }
                    placeholder="Additional notes on evolutionary history..."
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 12: Viewpoint Test */}
              <CollapsibleSection
                id="section-viewpoint-test"
                title="12. Non-Human Viewpoint Test"
                guidance={SECTION_GUIDANCE["viewpoint-test"]}
                variant="minimal"
                open={expandedSections.has("section-viewpoint-test")}
                onOpenChange={() => toggleSection("section-viewpoint-test")}
              >
                <div className="space-y-2">
                  <Label>Human Assumptions Avoided</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Check the human assumptions this species genuinely differs from.
                  </p>
                  <CheckboxGroup
                    options={HUMAN_ASSUMPTIONS_TO_AVOID}
                    selected={formState.viewpointTest.humanAssumptionsAvoided}
                    onChange={(selected) =>
                      updateFormState("viewpointTest", { humanAssumptionsAvoided: selected })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alien Perception Differences</Label>
                  <Textarea
                    value={formState.viewpointTest.alienPerceptionDifferences}
                    onChange={(e) =>
                      updateFormState("viewpointTest", { alienPerceptionDifferences: e.target.value })
                    }
                    placeholder="How does this species perceive reality differently than humans?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unique Worldview</Label>
                  <Textarea
                    value={formState.viewpointTest.uniqueWorldview}
                    onChange={(e) =>
                      updateFormState("viewpointTest", { uniqueWorldview: e.target.value })
                    }
                    placeholder="What would be utterly obvious to them but incomprehensible to us?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.viewpointTest.viewpointNotes}
                    onChange={(e) =>
                      updateFormState("viewpointTest", { viewpointNotes: e.target.value })
                    }
                    placeholder="Additional notes on alien perspective..."
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>

              {/* Section 13: Integration */}
              <CollapsibleSection
                id="section-integration"
                title="13. Integration & Consistency"
                guidance={SECTION_GUIDANCE.integration}
                variant="minimal"
                open={expandedSections.has("section-integration")}
                onOpenChange={() => toggleSection("section-integration")}
              >
                <div className="space-y-2">
                  <Label>Trait Interactions</Label>
                  <Textarea
                    value={formState.integration.traitInteractions}
                    onChange={(e) =>
                      updateFormState("integration", { traitInteractions: e.target.value })
                    }
                    placeholder="How do the different traits work together as a system?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ecological Niche</Label>
                  <Textarea
                    value={formState.integration.ecologicalNiche}
                    onChange={(e) =>
                      updateFormState("integration", { ecologicalNiche: e.target.value })
                    }
                    placeholder="What role does this species play in its ecosystem?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Evolutionary Plausibility</Label>
                  <Textarea
                    value={formState.integration.evolutionaryPlausibility}
                    onChange={(e) =>
                      updateFormState("integration", { evolutionaryPlausibility: e.target.value })
                    }
                    placeholder="Could this species realistically evolve? What's the evolutionary pathway?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Potential Contradictions</Label>
                  <Textarea
                    value={formState.integration.potentialContradictions}
                    onChange={(e) =>
                      updateFormState("integration", { potentialContradictions: e.target.value })
                    }
                    placeholder="Are there any internal contradictions? How are they resolved?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.integration.integrationNotes}
                    onChange={(e) =>
                      updateFormState("integration", { integrationNotes: e.target.value })
                    }
                    placeholder="Final integration notes..."
                    className="min-h-[80px]"
                  />
                </div>
              </CollapsibleSection>
            </GlassPanel>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SectionNavigation sections={SECTIONS} />
          </div>
        </div>

        {/* Action Bar */}
        <ToolActionBar
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          isSaving={updateWorksheet.isPending}
          isCloudMode={!!worldId && !!worksheetId}
          onExport={() => setShowExportDialog(true)}
        />

        {/* Worksheet Selector Dialog */}
        <WorksheetSelectorDialog
          open={showWorksheetSelector}
          onOpenChange={setShowWorksheetSelector}
          worldId={worldId || ""}
          worldName={currentWorld?.name}
          toolType={TOOL_TYPE}
          toolDisplayName={TOOL_DISPLAY_NAME}
          worksheets={worksheets}
          isLoading={loadingWorksheets}
          onSelect={handleSelectWorksheet}
          onCreate={handleCreateWorksheet}
        />

        {/* Export Dialog */}
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          toolName="Evolutionary Biology"
          worldName={currentWorld?.name}
          formState={formState}
          summaryTemplate={<EvolutionarySummaryTemplate formState={formState} worldName={currentWorld?.name} />}
          fullTemplate={<EvolutionaryFullReportTemplate formState={formState} worldName={currentWorld?.name} />}
          defaultFilename="evolutionary-biology"
        />

        {/* Key Choices Sidebar */}
        <KeyChoicesSidebar
          sections={keyChoicesSections}
          title="Species Summary"
        />
      </main>
    </div>
  );
};

export default EvolutionaryBiology;
