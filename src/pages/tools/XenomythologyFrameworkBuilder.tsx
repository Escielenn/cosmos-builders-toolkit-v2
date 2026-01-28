import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Printer,
  Cloud,
  CloudOff,
  Plus,
  Trash2,
  Sparkles,
  Link2,
  FileText,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useBackground } from "@/hooks/use-background";
import { useWorksheets, useWorksheet, useWorksheetsByType } from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import ToolActionBar from "@/components/tools/ToolActionBar";
import SelectedParametersSidebar from "@/components/tools/SelectedParametersSidebar";
import SuggestedImplications from "@/components/tools/SuggestedImplications";
import ImportFromECRModal from "@/components/tools/ImportFromECRModal";
import ExportDialog from "@/components/tools/ExportDialog";
import { XenomythologySummaryTemplate, XenomythologyFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { generateImplications, type Implication } from "@/lib/xenomythology-implications";
import { Json } from "@/integrations/supabase/types";
import {
  SENSORY_MODALITIES,
  SENSORY_INTEGRATION_STYLES,
  SENSORY_RANGES,
  BODY_PLANS,
  MOVEMENT_MODES,
  LIMB_ARRANGEMENTS,
  LIFESPAN_CATEGORIES,
  DEVELOPMENTAL_STAGES,
  REPRODUCTION_STRATEGIES,
  OFFSPRING_INVESTMENT,
  CONSCIOUSNESS_TYPES,
  MEMORY_ARCHITECTURES,
  COGNITIVE_STRENGTHS,
  SELF_AWARENESS_LEVELS,
  PLANET_TYPES,
  ATMOSPHERIC_COMPOSITIONS,
  DAY_NIGHT_CYCLES,
  SEASONAL_VARIATIONS,
  STELLAR_ENVIRONMENTS,
  ENVIRONMENTAL_VOLATILITY,
  GEOGRAPHIC_DIVERSITY,
  SURVIVAL_CHALLENGES,
  SOCIAL_STRUCTURE_EVOLUTION,
  MORTALITY_SALIENCE,
  GENERATIONAL_CONTINUITY,
  TIME_EXPERIENCES,
  TEMPORAL_HORIZONS,
  DIMENSIONAL_STRUCTURES,
  DIVINE_ONTOLOGIES,
  DIVINE_STATUS_LEVELS,
  PHYSICAL_RELATIONSHIPS,
  RITUAL_FUNCTIONS,
  LEADERSHIP_MODELS,
  PILGRIMAGE_TYPES,
  ANCESTOR_RELATIONS,
  COSMIC_ESCHATOLOGIES,
  SCIENCE_RESOLUTIONS,
  XENOMYTHOLOGY_SECTIONS,
  SECTION_GUIDANCE,
} from "@/lib/xenomythology-data";

// Section definitions for navigation
const SECTIONS: Section[] = XENOMYTHOLOGY_SECTIONS.map((s) => ({
  id: `section-${s.id}`,
  title: s.title,
}));

// Types for form state
interface PressureAnalysisEntry {
  pressure: string;
  cognitiveChallenge: string;
  symbolicResolution: string;
  archetypeStructure: string;
  archetypeForm: string;
}

interface ArchetypeEntry {
  name: string;
  evolutionaryOrigin: string;
  cognitiveFunction: string;
  symbolicForm: string;
  narrativeRole: string;
}

interface DeityEntry {
  archetypeName: string;
  divineStatus: string;
  domain: string;
  physicalRelationship: string;
  interaction: string;
}

interface SymbolicEntity {
  entityName: string;
  symbolicImportance: string;
  archetypeAssociation: string;
  mythicRole: string;
}

interface FormState {
  // Section 1: Species Biology & Psychology
  sensoryArchitecture: {
    primaryModalities: string[];
    primaryModalitiesOther?: string;
    integrationStyle: string;
    sensoryRange: string;
    cognitionImpact: string;
  };
  physicalForm: {
    bodyPlan: string;
    bodyPlanOther?: string;
    movementMode: string;
    movementModeOther?: string;
    limbArrangement: string;
    lifespanCategory: string;
    developmentalStages: string;
    reproductionStrategy: string;
    reproductionStrategyOther?: string;
    offspringInvestment: string;
  };
  cognitiveArchitecture: {
    consciousnessType: string;
    consciousnessTypeOther?: string;
    memoryArchitecture: string[];
    memoryArchitectureOther?: string;
    cognitiveStrengths: string[];
    emotionalRange: string;
    selfAwarenessLevel: string;
    cognitiveChallenges: string;
  };

  // Section 2: Environmental Context
  planetaryConditions: {
    planetType: string;
    planetTypeOther?: string;
    atmosphericComposition: string;
    dayNightCycle: string;
    seasonalVariation: string;
    stellarEnvironment: string;
    stellarEnvironmentOther?: string;
    skyAppearance: string;
    environmentalVolatility: string;
    geographicDiversity: string;
  };
  evolutionaryPressures: {
    survivalChallenges: string[];
    survivalChallengesOther?: string;
    socialStructureEvolution: string;
    adaptiveBreakthrough: string;
  };
  existentialParameters: {
    mortalitySalience: string;
    deathPhenomenology: string;
    generationalContinuity: string;
    timeExperience: string;
    temporalHorizon: string;
  };

  // Section 3: Archetypal Foundations
  pressureAnalysis: PressureAnalysisEntry[];
  novelArchetypes: {
    metamorphicArchetype: string;
    hiveMindArchetype: string;
    multiParentalArchetype: string;
    longevityArchetype: string;
    binaryStarArchetype: string;
    tidallyLockedArchetype: string;
    oceanWorldArchetype: string;
    noSkyArchetype: string;
  };
  archetypePantheon: ArchetypeEntry[];

  // Section 4: Mythic Expression
  creationNarrative: {
    primordialArchetypes: string[];
    primordialState: string;
    creativeAct: string;
    firstCreatedThing: string;
    fullNarrative: string;
  };
  cosmologicalStructure: {
    dimensionalStructure: string;
    primaryDivision: string;
    sacredGeography: string;
  };
  divineConceptualization: {
    divineOntology: string;
    deities: DeityEntry[];
  };
  mythicCycles: {
    greatCrisis: string;
    crisisArchetypes: string[];
    crisisResolution: string;
    crisisExplanation: string;
    currentOrder: string;
    unresolvedTension: string;
  };
  symbolicCatalog: SymbolicEntity[];

  // Section 5: Religious/Ritual Practices
  ritualStructure: {
    primaryFunctions: string[];
    sensoryModality: string;
    ritualTiming: string;
  };
  sacredSpecialists: {
    leadershipModel: string;
    specialistAbilities: string;
    identificationMethod: string;
    specialistDangers: string;
  };
  sacredSpaces: {
    whatMakesSacred: string;
    templeCharacteristics: string;
    pilgrimageTypes: string[];
    pilgrimagePurpose: string;
  };
  deathPractices: {
    consciousnessAtDeath: string;
    deathRituals: string;
    ancestorRelations: string;
    cosmicEschatology: string;
    endTimesNarrative: string;
  };

  // Section 6: Synthesis
  synthesis: {
    ethicalVirtues: string;
    ethicalTaboos: string;
    ethicalAmbiguous: string;
    artExpressions: string;
    scienceHarmony: string;
    scienceTension: string;
    scienceResolution: string[];
  };

  // Linked worksheets for cross-tool integration
  _linkedWorksheets?: {
    ecrWorksheetId?: string;
    lastSyncedAt?: string;
  };
}

const initialFormState: FormState = {
  sensoryArchitecture: {
    primaryModalities: [],
    primaryModalitiesOther: "",
    integrationStyle: "",
    sensoryRange: "",
    cognitionImpact: "",
  },
  physicalForm: {
    bodyPlan: "",
    bodyPlanOther: "",
    movementMode: "",
    movementModeOther: "",
    limbArrangement: "",
    lifespanCategory: "",
    developmentalStages: "",
    reproductionStrategy: "",
    reproductionStrategyOther: "",
    offspringInvestment: "",
  },
  cognitiveArchitecture: {
    consciousnessType: "",
    consciousnessTypeOther: "",
    memoryArchitecture: [],
    memoryArchitectureOther: "",
    cognitiveStrengths: [],
    emotionalRange: "",
    selfAwarenessLevel: "",
    cognitiveChallenges: "",
  },
  planetaryConditions: {
    planetType: "",
    planetTypeOther: "",
    atmosphericComposition: "",
    dayNightCycle: "",
    seasonalVariation: "",
    stellarEnvironment: "",
    stellarEnvironmentOther: "",
    skyAppearance: "",
    environmentalVolatility: "",
    geographicDiversity: "",
  },
  evolutionaryPressures: {
    survivalChallenges: [],
    survivalChallengesOther: "",
    socialStructureEvolution: "",
    adaptiveBreakthrough: "",
  },
  existentialParameters: {
    mortalitySalience: "",
    deathPhenomenology: "",
    generationalContinuity: "",
    timeExperience: "",
    temporalHorizon: "",
  },
  pressureAnalysis: [],
  novelArchetypes: {
    metamorphicArchetype: "",
    hiveMindArchetype: "",
    multiParentalArchetype: "",
    longevityArchetype: "",
    binaryStarArchetype: "",
    tidallyLockedArchetype: "",
    oceanWorldArchetype: "",
    noSkyArchetype: "",
  },
  archetypePantheon: [],
  creationNarrative: {
    primordialArchetypes: [],
    primordialState: "",
    creativeAct: "",
    firstCreatedThing: "",
    fullNarrative: "",
  },
  cosmologicalStructure: {
    dimensionalStructure: "",
    primaryDivision: "",
    sacredGeography: "",
  },
  divineConceptualization: {
    divineOntology: "",
    deities: [],
  },
  mythicCycles: {
    greatCrisis: "",
    crisisArchetypes: [],
    crisisResolution: "",
    crisisExplanation: "",
    currentOrder: "",
    unresolvedTension: "",
  },
  symbolicCatalog: [],
  ritualStructure: {
    primaryFunctions: [],
    sensoryModality: "",
    ritualTiming: "",
  },
  sacredSpecialists: {
    leadershipModel: "",
    specialistAbilities: "",
    identificationMethod: "",
    specialistDangers: "",
  },
  sacredSpaces: {
    whatMakesSacred: "",
    templeCharacteristics: "",
    pilgrimageTypes: [],
    pilgrimagePurpose: "",
  },
  deathPractices: {
    consciousnessAtDeath: "",
    deathRituals: "",
    ancestorRelations: "",
    cosmicEschatology: "",
    endTimesNarrative: "",
  },
  synthesis: {
    ethicalVirtues: "",
    ethicalTaboos: "",
    ethicalAmbiguous: "",
    artExpressions: "",
    scienceHarmony: "",
    scienceTension: "",
    scienceResolution: [],
  },
};

const EXTERNAL_RESOURCES = [
  { name: "Stellar Furnace Substack", url: "https://stellarfurnace.substack.com/", description: "Xenomythology research" },
  { name: "Atomic Rockets - Aliens", url: "http://www.projectrho.com/public_html/rocket/aliens.php", description: "Hard SF alien design" },
];

const CollapsibleSection = ({
  id,
  title,
  subtitle,
  levelNumber,
  thinkLike,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  levelNumber?: number;
  thinkLike?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <GlassPanel id={id} className="overflow-hidden scroll-mt-24">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3">
              {levelNumber !== undefined && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {levelNumber}
                </div>
              )}
              <div>
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 md:px-6 pb-6 space-y-6">
            {thinkLike && (
              <p className="text-sm text-primary italic border-l-2 border-primary pl-3">
                Think like {thinkLike}
              </p>
            )}
            {children}
          </div>
        </CollapsibleContent>
      </GlassPanel>
    </Collapsible>
  );
};

const QuestionSection = ({
  id,
  label,
  prompts,
  example,
  examples,
  value,
  onChange,
}: {
  id: string;
  label: string;
  prompts?: string[];
  example?: string;
  examples?: string[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {(example || examples) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            {example && <p className="text-xs">{example}</p>}
            {examples && (
              <ul className="text-xs list-disc list-inside">
                {examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {prompts && prompts.length > 0 && (
      <ul className="text-xs text-muted-foreground mb-2 list-disc list-inside">
        {prompts.map((prompt, i) => (
          <li key={i}>{prompt}</li>
        ))}
      </ul>
    )}
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your response..."
      className="min-h-[100px] bg-background/50"
    />
  </div>
);

const CheckboxGroup = ({
  label,
  description,
  options,
  selected,
  onChange,
  columns = 2,
  allowOther = false,
  otherValue = "",
  onOtherChange,
}: {
  label: string;
  description?: string;
  options: { id: string; name: string; description: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  columns?: number;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}) => {
  const toggleItem = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={`grid gap-2 md:grid-cols-${columns}`}>
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50 transition-colors"
          >
            <Checkbox
              id={`checkbox-${option.id}`}
              checked={selected.includes(option.id)}
              onCheckedChange={() => toggleItem(option.id)}
            />
            <Label htmlFor={`checkbox-${option.id}`} className="cursor-pointer text-sm">
              <span className="font-medium">{option.name}</span>
              <span className="text-muted-foreground block text-xs">{option.description}</span>
            </Label>
          </div>
        ))}
        {allowOther && (
          <div
            className={`flex items-start gap-2 p-2 rounded border transition-colors ${
              selected.includes("__other__") ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <Checkbox
              id={`checkbox-other-${label.replace(/\s+/g, "-")}`}
              checked={selected.includes("__other__")}
              onCheckedChange={() => toggleItem("__other__")}
            />
            <div className="flex-1">
              <Label htmlFor={`checkbox-other-${label.replace(/\s+/g, "-")}`} className="cursor-pointer text-sm">
                <span className="font-medium">Other</span>
                <span className="text-muted-foreground block text-xs">Custom option not listed above</span>
              </Label>
              {selected.includes("__other__") && (
                <Input
                  value={otherValue}
                  onChange={(e) => onOtherChange?.(e.target.value)}
                  placeholder="Describe your custom option..."
                  className="mt-2 text-sm"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RadioGroupField = ({
  label,
  description,
  options,
  value,
  onChange,
  columns = 2,
  allowOther = false,
  otherValue = "",
  onOtherChange,
}: {
  label: string;
  description?: string;
  options: { id: string; name: string; description: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}) => (
  <div className="space-y-3">
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className={`grid gap-2 md:grid-cols-${columns}`}
    >
      {options.map((option) => (
        <div
          key={option.id}
          className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50 transition-colors"
        >
          <RadioGroupItem value={option.id} id={`radio-${option.id}`} className="mt-0.5" />
          <Label htmlFor={`radio-${option.id}`} className="cursor-pointer text-sm">
            <span className="font-medium">{option.name}</span>
            <span className="text-muted-foreground block text-xs">{option.description}</span>
          </Label>
        </div>
      ))}
      {allowOther && (
        <div
          className={`flex items-start gap-2 p-2 rounded border transition-colors ${
            value === "__other__" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="__other__" id={`radio-other-${label.replace(/\s+/g, "-")}`} className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor={`radio-other-${label.replace(/\s+/g, "-")}`} className="cursor-pointer text-sm">
              <span className="font-medium">Other</span>
              <span className="text-muted-foreground block text-xs">Custom option not listed above</span>
            </Label>
            {value === "__other__" && (
              <Input
                value={otherValue}
                onChange={(e) => onOtherChange?.(e.target.value)}
                placeholder="Describe your custom option..."
                className="mt-2 text-sm"
              />
            )}
          </div>
        </div>
      )}
    </RadioGroup>
  </div>
);

const TOOL_TYPE = "xenomythology-framework-builder";

const XenomythologyFrameworkBuilder = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  useBackground();

  // Get URL params for worldId and worksheetId
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  // Get world name from worldId
  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  // Supabase hooks
  const { worksheets, createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // ECR integration state
  const [showECRImport, setShowECRImport] = useState(false);
  const ecrWorksheets = worksheets.filter(w => w.tool_type === "environmental-chain-reaction");

  // Load existing worksheet from Supabase if worksheetId is provided
  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        toast({
          title: "Worksheet Loaded",
          description: "Your saved work has been restored from the cloud.",
        });
      } catch {
        // Ignore parse errors
      }
    }
  }, [existingWorksheet]);

  // Fallback to localStorage if no worldId (standalone mode)
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem("xenomythology-framework-builder");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormState(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [worldId, worksheetId]);

  // Sync pressure analysis with selected survival challenges
  useEffect(() => {
    const challenges = formState.evolutionaryPressures.survivalChallenges;
    const existingPressures = formState.pressureAnalysis.map((p) => p.pressure);

    // Add new entries for new challenges
    const newEntries: PressureAnalysisEntry[] = challenges
      .filter((c) => !existingPressures.includes(c))
      .map((c) => ({
        pressure: c,
        cognitiveChallenge: "",
        symbolicResolution: "",
        archetypeStructure: "",
        archetypeForm: "",
      }));

    // Keep existing entries for still-selected challenges
    const keptEntries = formState.pressureAnalysis.filter((p) =>
      challenges.includes(p.pressure)
    );

    if (newEntries.length > 0 || keptEntries.length !== formState.pressureAnalysis.length) {
      setFormState((prev) => ({
        ...prev,
        pressureAnalysis: [...keptEntries, ...newEntries],
      }));
    }
  }, [formState.evolutionaryPressures.survivalChallenges]);

  // Generic update functions
  const updateField = <T extends keyof FormState>(
    section: T,
    field: keyof FormState[T],
    value: FormState[T][keyof FormState[T]]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const updatePressureAnalysis = (index: number, field: keyof PressureAnalysisEntry, value: string) => {
    setFormState((prev) => ({
      ...prev,
      pressureAnalysis: prev.pressureAnalysis.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const addArchetype = () => {
    setFormState((prev) => ({
      ...prev,
      archetypePantheon: [
        ...prev.archetypePantheon,
        { name: "", evolutionaryOrigin: "", cognitiveFunction: "", symbolicForm: "", narrativeRole: "" },
      ],
    }));
  };

  const updateArchetype = (index: number, field: keyof ArchetypeEntry, value: string) => {
    setFormState((prev) => ({
      ...prev,
      archetypePantheon: prev.archetypePantheon.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    }));
  };

  const removeArchetype = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      archetypePantheon: prev.archetypePantheon.filter((_, i) => i !== index),
    }));
  };

  const addDeity = () => {
    setFormState((prev) => ({
      ...prev,
      divineConceptualization: {
        ...prev.divineConceptualization,
        deities: [
          ...prev.divineConceptualization.deities,
          { archetypeName: "", divineStatus: "", domain: "", physicalRelationship: "", interaction: "" },
        ],
      },
    }));
  };

  const updateDeity = (index: number, field: keyof DeityEntry, value: string) => {
    setFormState((prev) => ({
      ...prev,
      divineConceptualization: {
        ...prev.divineConceptualization,
        deities: prev.divineConceptualization.deities.map((d, i) =>
          i === index ? { ...d, [field]: value } : d
        ),
      },
    }));
  };

  const removeDeity = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      divineConceptualization: {
        ...prev.divineConceptualization,
        deities: prev.divineConceptualization.deities.filter((_, i) => i !== index),
      },
    }));
  };

  const addSymbolicEntity = () => {
    setFormState((prev) => ({
      ...prev,
      symbolicCatalog: [
        ...prev.symbolicCatalog,
        { entityName: "", symbolicImportance: "", archetypeAssociation: "", mythicRole: "" },
      ],
    }));
  };

  const updateSymbolicEntity = (index: number, field: keyof SymbolicEntity, value: string) => {
    setFormState((prev) => ({
      ...prev,
      symbolicCatalog: prev.symbolicCatalog.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  const removeSymbolicEntity = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      symbolicCatalog: prev.symbolicCatalog.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem("xenomythology-framework-builder", JSON.stringify(formState));

    // If we have a worldId and user is authenticated, save to Supabase
    if (worldId && user) {
      const worksheetData = formState as unknown as Json;

      try {
        if (currentWorksheetId || worksheetId) {
          // Update existing worksheet - preserve user-provided title
          await updateWorksheet.mutateAsync({
            worksheetId: currentWorksheetId || worksheetId!,
            data: worksheetData,
          });
        } else {
          // Should not reach here - worksheet must be created via selector first
          toast({
            title: "Error",
            description: "Please select or create a worksheet first.",
            variant: "destructive",
          });
        }
      } catch {
        // Error already handled by the mutation
      }
    } else {
      toast({
        title: "Draft Saved",
        description: "Your work has been saved locally.",
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

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to get challenge name from ID
  const getChallengeName = (id: string) => {
    return SURVIVAL_CHALLENGES.find((c) => c.id === id)?.name || id;
  };

  // Helper for sidebar - extract key selections
  const getSelectedParametersForSidebar = () => {
    const params: Array<{
      typeId: string;
      categoryLabel: string;
      optionLabel: string;
      optionDescription: string;
      specificValue: string;
    }> = [];

    // Sensory modalities (show first 3)
    if (formState.sensoryArchitecture.primaryModalities.length > 0) {
      const modalities = formState.sensoryArchitecture.primaryModalities.slice(0, 3);
      const names = modalities.map(id => SENSORY_MODALITIES.find(m => m.id === id)?.name || id);
      params.push({
        typeId: "sensory",
        categoryLabel: "Primary Senses",
        optionLabel: names.join(", "),
        optionDescription: "",
        specificValue: modalities.length > 3 ? `+${formState.sensoryArchitecture.primaryModalities.length - 3} more` : "",
      });
    }

    // Consciousness type
    if (formState.cognitiveArchitecture.consciousnessType) {
      const opt = CONSCIOUSNESS_TYPES.find(c => c.id === formState.cognitiveArchitecture.consciousnessType);
      if (opt) {
        params.push({
          typeId: "consciousness",
          categoryLabel: "Consciousness",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Body plan
    if (formState.physicalForm.bodyPlan) {
      const opt = BODY_PLANS.find(b => b.id === formState.physicalForm.bodyPlan);
      if (opt) {
        params.push({
          typeId: "body-plan",
          categoryLabel: "Body Plan",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Lifespan
    if (formState.physicalForm.lifespanCategory) {
      const opt = LIFESPAN_CATEGORIES.find(l => l.id === formState.physicalForm.lifespanCategory);
      if (opt) {
        params.push({
          typeId: "lifespan",
          categoryLabel: "Lifespan",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Planet type
    if (formState.planetaryConditions.planetType) {
      const opt = PLANET_TYPES.find(p => p.id === formState.planetaryConditions.planetType);
      if (opt) {
        params.push({
          typeId: "planet-type",
          categoryLabel: "Planet Type",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Stellar environment
    if (formState.planetaryConditions.stellarEnvironment) {
      const opt = STELLAR_ENVIRONMENTS.find(s => s.id === formState.planetaryConditions.stellarEnvironment);
      if (opt) {
        params.push({
          typeId: "stellar",
          categoryLabel: "Stellar Environment",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Day/Night cycle
    if (formState.planetaryConditions.dayNightCycle) {
      const opt = DAY_NIGHT_CYCLES.find(d => d.id === formState.planetaryConditions.dayNightCycle);
      if (opt) {
        params.push({
          typeId: "day-night",
          categoryLabel: "Day/Night Cycle",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Survival challenges (top 3)
    if (formState.evolutionaryPressures.survivalChallenges.length > 0) {
      const challenges = formState.evolutionaryPressures.survivalChallenges.slice(0, 3);
      const names = challenges.map(id => SURVIVAL_CHALLENGES.find(c => c.id === id)?.name || id);
      params.push({
        typeId: "challenges",
        categoryLabel: "Survival Challenges",
        optionLabel: names.join(", "),
        optionDescription: "",
        specificValue: formState.evolutionaryPressures.survivalChallenges.length > 3
          ? `+${formState.evolutionaryPressures.survivalChallenges.length - 3} more`
          : "",
      });
    }

    // --- Additional parameters for expanded sidebar ---

    // Sensory Integration Style
    if (formState.sensoryArchitecture.integrationStyle) {
      const opt = SENSORY_INTEGRATION_STYLES.find(s => s.id === formState.sensoryArchitecture.integrationStyle);
      if (opt) {
        params.push({
          typeId: "integration",
          categoryLabel: "Sensory Integration",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Movement Mode
    if (formState.physicalForm.movementMode) {
      const opt = MOVEMENT_MODES.find(m => m.id === formState.physicalForm.movementMode);
      if (opt) {
        params.push({
          typeId: "movement",
          categoryLabel: "Movement",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Reproduction Strategy
    if (formState.physicalForm.reproductionStrategy) {
      const opt = REPRODUCTION_STRATEGIES.find(r => r.id === formState.physicalForm.reproductionStrategy);
      if (opt) {
        params.push({
          typeId: "reproduction",
          categoryLabel: "Reproduction",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Memory Architecture (show first 2)
    if (formState.cognitiveArchitecture.memoryArchitecture.length > 0) {
      const memories = formState.cognitiveArchitecture.memoryArchitecture.slice(0, 2);
      const names = memories.map(id => MEMORY_ARCHITECTURES.find(m => m.id === id)?.name || id);
      params.push({
        typeId: "memory",
        categoryLabel: "Memory",
        optionLabel: names.join(", "),
        optionDescription: "",
        specificValue: formState.cognitiveArchitecture.memoryArchitecture.length > 2
          ? `+${formState.cognitiveArchitecture.memoryArchitecture.length - 2} more`
          : "",
      });
    }

    // Atmospheric Composition
    if (formState.planetaryConditions.atmosphericComposition) {
      const opt = ATMOSPHERIC_COMPOSITIONS.find(a => a.id === formState.planetaryConditions.atmosphericComposition);
      if (opt) {
        params.push({
          typeId: "atmosphere",
          categoryLabel: "Atmosphere",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Environmental Volatility
    if (formState.planetaryConditions.environmentalVolatility) {
      const opt = ENVIRONMENTAL_VOLATILITY.find(e => e.id === formState.planetaryConditions.environmentalVolatility);
      if (opt) {
        params.push({
          typeId: "volatility",
          categoryLabel: "Volatility",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Seasonal Variation
    if (formState.planetaryConditions.seasonalVariation) {
      const opt = SEASONAL_VARIATIONS.find(s => s.id === formState.planetaryConditions.seasonalVariation);
      if (opt) {
        params.push({
          typeId: "seasons",
          categoryLabel: "Seasons",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Mortality Salience
    if (formState.existentialParameters.mortalitySalience) {
      const opt = MORTALITY_SALIENCE.find(m => m.id === formState.existentialParameters.mortalitySalience);
      if (opt) {
        params.push({
          typeId: "mortality",
          categoryLabel: "Mortality",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    // Temporal Horizon
    if (formState.existentialParameters.temporalHorizon) {
      const opt = TEMPORAL_HORIZONS.find(t => t.id === formState.existentialParameters.temporalHorizon);
      if (opt) {
        params.push({
          typeId: "temporal",
          categoryLabel: "Temporal Horizon",
          optionLabel: opt.name,
          optionDescription: opt.description,
          specificValue: "",
        });
      }
    }

    return params;
  };

  // Check for conditional archetype fields
  const showMetamorphicArchetype = formState.physicalForm.developmentalStages === "metamorphosis" ||
    formState.physicalForm.developmentalStages === "multiple-metamorphosis";
  const showHiveMindArchetype = formState.cognitiveArchitecture.consciousnessType === "hive" ||
    formState.cognitiveArchitecture.consciousnessType === "networked" ||
    formState.cognitiveArchitecture.consciousnessType === "fluid";
  const showMultiParentalArchetype = formState.physicalForm.reproductionStrategy === "sexual-multi";
  const showLongevityArchetype = formState.physicalForm.lifespanCategory === "extreme" ||
    formState.physicalForm.lifespanCategory === "indefinite";
  const showBinaryStarArchetype = formState.planetaryConditions.stellarEnvironment === "binary" ||
    formState.planetaryConditions.stellarEnvironment === "multiple";
  const showTidallyLockedArchetype = formState.planetaryConditions.dayNightCycle === "tidally-locked";
  const showOceanWorldArchetype = formState.planetaryConditions.planetType === "ocean-world";
  const showNoSkyArchetype = formState.planetaryConditions.atmosphericComposition === "toxic" ||
    formState.planetaryConditions.dayNightCycle === "no-distinction";

  // Generate implications from biology + environment
  const implications = useMemo(() => {
    return generateImplications(formState);
  }, [
    formState.sensoryArchitecture.primaryModalities,
    formState.sensoryArchitecture.integrationStyle,
    formState.physicalForm.bodyPlan,
    formState.physicalForm.lifespanCategory,
    formState.physicalForm.developmentalStages,
    formState.physicalForm.offspringInvestment,
    formState.cognitiveArchitecture.consciousnessType,
    formState.cognitiveArchitecture.memoryArchitecture,
    formState.planetaryConditions.planetType,
    formState.planetaryConditions.dayNightCycle,
    formState.planetaryConditions.seasonalVariation,
    formState.planetaryConditions.stellarEnvironment,
    formState.planetaryConditions.environmentalVolatility,
    formState.planetaryConditions.geographicDiversity,
  ]);

  // Handle applying an implication to archetype fields
  const handleApplyImplication = (implication: Implication) => {
    if (implication.suggestedArchetypeForm) {
      // Add a new archetype entry based on the implication
      setFormState((prev) => ({
        ...prev,
        archetypePantheon: [
          ...prev.archetypePantheon,
          {
            name: implication.archetypeChannel.split("/")[0].trim(),
            evolutionaryOrigin: implication.perceivedConstant,
            cognitiveFunction: implication.explanation.split(".")[0] + ".",
            symbolicForm: implication.suggestedArchetypeForm || "",
            narrativeRole: "",
          },
        ],
      }));
      toast({
        title: "Archetype Added",
        description: `Added "${implication.archetypeChannel.split("/")[0].trim()}" to your Archetypal Pantheon.`,
      });
    }
  };

  // Handle importing data from ECR worksheet
  const handleECRImport = (
    importData: Partial<FormState>,
    linkedWorksheetId?: string
  ) => {
    setFormState((prev) => {
      const updated = { ...prev };

      // Merge planetary conditions (only non-empty values)
      if (importData.planetaryConditions) {
        updated.planetaryConditions = {
          ...prev.planetaryConditions,
          ...Object.fromEntries(
            Object.entries(importData.planetaryConditions).filter(
              ([, v]) => v && v !== ""
            )
          ),
        };
      }

      // Set linked worksheets info
      if (linkedWorksheetId) {
        updated._linkedWorksheets = {
          ecrWorksheetId: linkedWorksheetId,
          lastSyncedAt: new Date().toISOString(),
        };
      }

      return updated;
    });

    toast({
      title: "ECR Data Imported",
      description: linkedWorksheetId
        ? "Environmental parameters imported and linked. Changes will sync."
        : "Environmental parameters imported.",
    });
  };

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
              <Badge className="mb-2">Tool 6</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Xenomythology Framework Builder
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.
              </p>
              {currentWorksheetTitle && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{currentWorksheetTitle}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 no-print flex-wrap">
              {/* Linked ECR indicator */}
              {formState._linkedWorksheets?.ecrWorksheetId && (
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Link2 className="w-3 h-3 mr-1" />
                  Linked to ECR
                </Badge>
              )}

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

              {/* ECR Import button - only show if there are ECR worksheets */}
              {ecrWorksheets.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowECRImport(true)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Import from ECR
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleSave} disabled={worksheetLoading}>
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
            What is Xenomythology?
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "The process of creating archetypal structures is likely universal to intelligence, but the actual forms these structures take are entirely species-specific."
          </blockquote>
          <p className="text-muted-foreground mb-4">
            Xenomythology studies how myth and religion might form among extraterrestrial intelligent species. Rather than transplanting human myths to alien contexts, this tool asks: What universal patterns in myth-making arise from intelligence itself, and how would these patterns manifest differently based on radically different biologies, environments, and evolutionary histories?
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <strong className="text-foreground">The Core Principle:</strong>
            <p className="mt-1">Biology + Environment + Evolutionary Pressures → Unique Archetypal Forms → Species-Specific Mythology</p>
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

        {/* Form Sections with Sidebar */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
          {/* Section 1: Species Biology & Psychology */}
          <CollapsibleSection
            id="section-species-biology"
            title="Species Biology & Psychology"
            subtitle="Define the fundamental nature of your intelligent species"
            levelNumber={1}
            defaultOpen={true}
            thinkLike="an evolutionary biologist: Every trait emerged from survival pressures."
          >
            <div className="space-y-8">
              {/* Sensory Architecture */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Sensory Architecture</h4>

                <CheckboxGroup
                  label="Primary Sensory Modalities"
                  description="Select all that apply - most species have 2-4 integrated primary senses"
                  options={SENSORY_MODALITIES}
                  selected={formState.sensoryArchitecture.primaryModalities}
                  onChange={(selected) => updateField("sensoryArchitecture", "primaryModalities", selected)}
                  allowOther
                  otherValue={formState.sensoryArchitecture.primaryModalitiesOther || ""}
                  onOtherChange={(value) => updateField("sensoryArchitecture", "primaryModalitiesOther", value)}
                />

                <RadioGroupField
                  label="Sensory Integration Style"
                  options={SENSORY_INTEGRATION_STYLES}
                  value={formState.sensoryArchitecture.integrationStyle}
                  onChange={(value) => updateField("sensoryArchitecture", "integrationStyle", value)}
                />

                <RadioGroupField
                  label="Sensory Range Compared to Environment"
                  options={SENSORY_RANGES}
                  value={formState.sensoryArchitecture.sensoryRange}
                  onChange={(value) => updateField("sensoryArchitecture", "sensoryRange", value)}
                  columns={3}
                />

                <QuestionSection
                  id="cognition-impact"
                  label="How Sensory Architecture Shapes Cognition"
                  prompts={["How does this sensory suite affect how this species thinks and categorizes reality?"]}
                  example={SECTION_GUIDANCE.sensoryArchitecture.cognitionImpact.example}
                  value={formState.sensoryArchitecture.cognitionImpact}
                  onChange={(value) => updateField("sensoryArchitecture", "cognitionImpact", value)}
                />
              </div>

              {/* Physical Form */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Physical Form</h4>

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Body Plan"
                    options={BODY_PLANS}
                    value={formState.physicalForm.bodyPlan}
                    onChange={(value) => updateField("physicalForm", "bodyPlan", value)}
                    columns={1}
                    allowOther
                    otherValue={formState.physicalForm.bodyPlanOther || ""}
                    onOtherChange={(value) => updateField("physicalForm", "bodyPlanOther", value)}
                  />

                  <RadioGroupField
                    label="Primary Movement Mode"
                    options={MOVEMENT_MODES}
                    value={formState.physicalForm.movementMode}
                    onChange={(value) => updateField("physicalForm", "movementMode", value)}
                    columns={1}
                    allowOther
                    otherValue={formState.physicalForm.movementModeOther || ""}
                    onOtherChange={(value) => updateField("physicalForm", "movementModeOther", value)}
                  />
                </div>

                <RadioGroupField
                  label="Limb/Manipulator Arrangement"
                  options={LIMB_ARRANGEMENTS}
                  value={formState.physicalForm.limbArrangement}
                  onChange={(value) => updateField("physicalForm", "limbArrangement", value)}
                  columns={3}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Lifespan Category"
                    options={LIFESPAN_CATEGORIES}
                    value={formState.physicalForm.lifespanCategory}
                    onChange={(value) => updateField("physicalForm", "lifespanCategory", value)}
                    columns={1}
                  />

                  <RadioGroupField
                    label="Developmental Stages"
                    options={DEVELOPMENTAL_STAGES}
                    value={formState.physicalForm.developmentalStages}
                    onChange={(value) => updateField("physicalForm", "developmentalStages", value)}
                    columns={1}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Reproduction Strategy"
                    options={REPRODUCTION_STRATEGIES}
                    value={formState.physicalForm.reproductionStrategy}
                    onChange={(value) => updateField("physicalForm", "reproductionStrategy", value)}
                    columns={1}
                    allowOther
                    otherValue={formState.physicalForm.reproductionStrategyOther || ""}
                    onOtherChange={(value) => updateField("physicalForm", "reproductionStrategyOther", value)}
                  />

                  <RadioGroupField
                    label="Offspring Investment"
                    options={OFFSPRING_INVESTMENT}
                    value={formState.physicalForm.offspringInvestment}
                    onChange={(value) => updateField("physicalForm", "offspringInvestment", value)}
                    columns={1}
                  />
                </div>
              </div>

              {/* Cognitive Architecture */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Cognitive Architecture</h4>

                <RadioGroupField
                  label="Consciousness Type"
                  options={CONSCIOUSNESS_TYPES}
                  value={formState.cognitiveArchitecture.consciousnessType}
                  onChange={(value) => updateField("cognitiveArchitecture", "consciousnessType", value)}
                  allowOther
                  otherValue={formState.cognitiveArchitecture.consciousnessTypeOther || ""}
                  onOtherChange={(value) => updateField("cognitiveArchitecture", "consciousnessTypeOther", value)}
                />

                <CheckboxGroup
                  label="Memory Architecture"
                  options={MEMORY_ARCHITECTURES}
                  selected={formState.cognitiveArchitecture.memoryArchitecture}
                  onChange={(selected) => updateField("cognitiveArchitecture", "memoryArchitecture", selected)}
                  allowOther
                  otherValue={formState.cognitiveArchitecture.memoryArchitectureOther || ""}
                  onOtherChange={(value) => updateField("cognitiveArchitecture", "memoryArchitectureOther", value)}
                />

                <CheckboxGroup
                  label="Primary Cognitive Strengths"
                  description="Select up to 4"
                  options={COGNITIVE_STRENGTHS}
                  selected={formState.cognitiveArchitecture.cognitiveStrengths}
                  onChange={(selected) => updateField("cognitiveArchitecture", "cognitiveStrengths", selected.slice(0, 4))}
                />

                <QuestionSection
                  id="emotional-range"
                  label="Emotional Range"
                  prompts={["Describe the primary emotions/motivational states this species experiences.", "Don't assume human emotions - derive from their evolutionary needs."]}
                  example={SECTION_GUIDANCE.cognitiveArchitecture.emotionalRange.example}
                  value={formState.cognitiveArchitecture.emotionalRange}
                  onChange={(value) => updateField("cognitiveArchitecture", "emotionalRange", value)}
                />

                <RadioGroupField
                  label="Self-Awareness Level"
                  options={SELF_AWARENESS_LEVELS}
                  value={formState.cognitiveArchitecture.selfAwarenessLevel}
                  onChange={(value) => updateField("cognitiveArchitecture", "selfAwarenessLevel", value)}
                  columns={3}
                />

                <QuestionSection
                  id="cognitive-challenges"
                  label="Primary Cognitive Challenges"
                  prompts={[SECTION_GUIDANCE.cognitiveArchitecture.cognitiveChallenges.prompt]}
                  value={formState.cognitiveArchitecture.cognitiveChallenges}
                  onChange={(value) => updateField("cognitiveArchitecture", "cognitiveChallenges", value)}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: Environmental Context */}
          <CollapsibleSection
            id="section-environmental-context"
            title="Environmental Context"
            subtitle="Establish the world that shaped their evolution"
            levelNumber={2}
            thinkLike="a planetary scientist and ecologist: Environment creates selection pressures."
          >
            <div className="space-y-8">
              {/* Planetary Conditions */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Planetary Conditions</h4>

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Planet Type"
                    options={PLANET_TYPES}
                    value={formState.planetaryConditions.planetType}
                    onChange={(value) => updateField("planetaryConditions", "planetType", value)}
                    columns={1}
                    allowOther
                    otherValue={formState.planetaryConditions.planetTypeOther || ""}
                    onOtherChange={(value) => updateField("planetaryConditions", "planetTypeOther", value)}
                  />

                  <RadioGroupField
                    label="Atmospheric Composition"
                    options={ATMOSPHERIC_COMPOSITIONS}
                    value={formState.planetaryConditions.atmosphericComposition}
                    onChange={(value) => updateField("planetaryConditions", "atmosphericComposition", value)}
                    columns={1}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Day/Night Cycle"
                    options={DAY_NIGHT_CYCLES}
                    value={formState.planetaryConditions.dayNightCycle}
                    onChange={(value) => updateField("planetaryConditions", "dayNightCycle", value)}
                    columns={1}
                  />

                  <RadioGroupField
                    label="Seasonal Variation"
                    options={SEASONAL_VARIATIONS}
                    value={formState.planetaryConditions.seasonalVariation}
                    onChange={(value) => updateField("planetaryConditions", "seasonalVariation", value)}
                    columns={1}
                  />
                </div>

                <RadioGroupField
                  label="Stellar Environment"
                  options={STELLAR_ENVIRONMENTS}
                  value={formState.planetaryConditions.stellarEnvironment}
                  onChange={(value) => updateField("planetaryConditions", "stellarEnvironment", value)}
                  allowOther
                  otherValue={formState.planetaryConditions.stellarEnvironmentOther || ""}
                  onOtherChange={(value) => updateField("planetaryConditions", "stellarEnvironmentOther", value)}
                />

                <QuestionSection
                  id="sky-appearance"
                  label="Sky Appearance & Celestial Objects"
                  prompts={[SECTION_GUIDANCE.planetaryConditions.skyAppearance.prompt]}
                  example={SECTION_GUIDANCE.planetaryConditions.skyAppearance.example}
                  value={formState.planetaryConditions.skyAppearance}
                  onChange={(value) => updateField("planetaryConditions", "skyAppearance", value)}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Environmental Volatility"
                    options={ENVIRONMENTAL_VOLATILITY}
                    value={formState.planetaryConditions.environmentalVolatility}
                    onChange={(value) => updateField("planetaryConditions", "environmentalVolatility", value)}
                    columns={1}
                  />

                  <RadioGroupField
                    label="Geographic Diversity"
                    options={GEOGRAPHIC_DIVERSITY}
                    value={formState.planetaryConditions.geographicDiversity}
                    onChange={(value) => updateField("planetaryConditions", "geographicDiversity", value)}
                    columns={1}
                  />
                </div>
              </div>

              {/* Evolutionary Pressures */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Evolutionary Pressures</h4>

                <CheckboxGroup
                  label="Primary Survival Challenges"
                  description="These will inform archetypal structures in Section 3"
                  options={SURVIVAL_CHALLENGES}
                  selected={formState.evolutionaryPressures.survivalChallenges}
                  onChange={(selected) => updateField("evolutionaryPressures", "survivalChallenges", selected)}
                  allowOther
                  otherValue={formState.evolutionaryPressures.survivalChallengesOther || ""}
                  onOtherChange={(value) => updateField("evolutionaryPressures", "survivalChallengesOther", value)}
                />

                <RadioGroupField
                  label="Social Structure Evolution"
                  options={SOCIAL_STRUCTURE_EVOLUTION}
                  value={formState.evolutionaryPressures.socialStructureEvolution}
                  onChange={(value) => updateField("evolutionaryPressures", "socialStructureEvolution", value)}
                  columns={3}
                />

                <QuestionSection
                  id="adaptive-breakthrough"
                  label="Key Adaptive Breakthrough"
                  prompts={[SECTION_GUIDANCE.evolutionaryPressures.adaptiveBreakthrough.prompt]}
                  example={SECTION_GUIDANCE.evolutionaryPressures.adaptiveBreakthrough.example}
                  value={formState.evolutionaryPressures.adaptiveBreakthrough}
                  onChange={(value) => updateField("evolutionaryPressures", "adaptiveBreakthrough", value)}
                />
              </div>

              {/* Existential Parameters */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Existential Parameters</h4>

                <RadioGroupField
                  label="Mortality Salience"
                  description="How directly and frequently does this species confront death?"
                  options={MORTALITY_SALIENCE}
                  value={formState.existentialParameters.mortalitySalience}
                  onChange={(value) => updateField("existentialParameters", "mortalitySalience", value)}
                  columns={3}
                />

                <QuestionSection
                  id="death-phenomenology"
                  label="Death Phenomenology"
                  prompts={[SECTION_GUIDANCE.existentialParameters.deathPhenomenology.prompt]}
                  example={SECTION_GUIDANCE.existentialParameters.deathPhenomenology.example}
                  value={formState.existentialParameters.deathPhenomenology}
                  onChange={(value) => updateField("existentialParameters", "deathPhenomenology", value)}
                />

                <RadioGroupField
                  label="Generational Continuity"
                  options={GENERATIONAL_CONTINUITY}
                  value={formState.existentialParameters.generationalContinuity}
                  onChange={(value) => updateField("existentialParameters", "generationalContinuity", value)}
                  columns={3}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <RadioGroupField
                    label="Relationship to Time"
                    options={TIME_EXPERIENCES}
                    value={formState.existentialParameters.timeExperience}
                    onChange={(value) => updateField("existentialParameters", "timeExperience", value)}
                    columns={1}
                  />

                  <RadioGroupField
                    label="Temporal Horizon"
                    description="How far into past/future does this species naturally think?"
                    options={TEMPORAL_HORIZONS}
                    value={formState.existentialParameters.temporalHorizon}
                    onChange={(value) => updateField("existentialParameters", "temporalHorizon", value)}
                    columns={1}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Suggested Implications - appears after biology and environment sections */}
          {implications.length > 0 && (
            <SuggestedImplications
              implications={implications}
              onApply={handleApplyImplication}
              className="my-6"
            />
          )}

          {/* Section 3: Archetypal Foundations */}
          <CollapsibleSection
            id="section-archetypal-foundations"
            title="Archetypal Foundations"
            subtitle="Map pressures to unique archetypal structures"
            levelNumber={3}
            thinkLike="a Jungian psychologist: Archetypes emerge from existential pressures that require mythic resolution."
          >
            <div className="space-y-8">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-accent">Critical Insight:</strong> Archetypes are not universal forms like "The Mother" or "The Hero" but universal cognitive structures that emerge from existential pressures requiring mythic resolution. Different species facing different pressures will generate entirely different archetypal forms.
                </p>
              </div>

              {/* Pressure Analysis Matrix */}
              {formState.pressureAnalysis.length > 0 && (
                <div className="space-y-6">
                  <h4 className="font-semibold">Pressure Analysis Matrix</h4>
                  <p className="text-sm text-muted-foreground">
                    For each survival challenge you selected, analyze how it generates archetypal structures.
                  </p>

                  {formState.pressureAnalysis.map((pressure, index) => (
                    <div key={pressure.pressure} className="p-4 rounded-lg border border-border space-y-4">
                      <h5 className="font-medium text-primary">
                        Pressure: {getChallengeName(pressure.pressure)}
                      </h5>

                      <QuestionSection
                        id={`pressure-${index}-cognitive`}
                        label="Cognitive Challenge"
                        prompts={[SECTION_GUIDANCE.pressureAnalysis.cognitiveChallenge.prompt]}
                        example={SECTION_GUIDANCE.pressureAnalysis.cognitiveChallenge.example}
                        value={pressure.cognitiveChallenge}
                        onChange={(value) => updatePressureAnalysis(index, "cognitiveChallenge", value)}
                      />

                      <QuestionSection
                        id={`pressure-${index}-symbolic`}
                        label="What Needs to Be Symbolically Resolved?"
                        prompts={[SECTION_GUIDANCE.pressureAnalysis.symbolicResolution.prompt]}
                        example={SECTION_GUIDANCE.pressureAnalysis.symbolicResolution.example}
                        value={pressure.symbolicResolution}
                        onChange={(value) => updatePressureAnalysis(index, "symbolicResolution", value)}
                      />

                      <QuestionSection
                        id={`pressure-${index}-structure`}
                        label="What Archetypal Structure Emerges?"
                        prompts={[SECTION_GUIDANCE.pressureAnalysis.archetypeStructure.prompt]}
                        example={SECTION_GUIDANCE.pressureAnalysis.archetypeStructure.example}
                        value={pressure.archetypeStructure}
                        onChange={(value) => updatePressureAnalysis(index, "archetypeStructure", value)}
                      />

                      <QuestionSection
                        id={`pressure-${index}-form`}
                        label="What Form Does This Archetype Take?"
                        prompts={[SECTION_GUIDANCE.pressureAnalysis.archetypeForm.prompt]}
                        example={SECTION_GUIDANCE.pressureAnalysis.archetypeForm.example}
                        value={pressure.archetypeForm}
                        onChange={(value) => updatePressureAnalysis(index, "archetypeForm", value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {formState.pressureAnalysis.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-muted text-center">
                  <p className="text-sm text-muted-foreground">
                    Select survival challenges in Section 2 to generate pressure analysis forms.
                  </p>
                </div>
              )}

              {/* Novel Archetypal Forms */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold">Novel Archetypal Forms</h4>
                <p className="text-sm text-muted-foreground">
                  These fields appear based on your species' unique biology and environment.
                </p>

                {showMetamorphicArchetype && (
                  <QuestionSection
                    id="metamorphic-archetype"
                    label="Metamorphosis-Derived Archetype"
                    prompts={["Does metamorphosis create an archetype of 'The One-Who-Was-Other' - the self that is completely different yet continuous?"]}
                    value={formState.novelArchetypes.metamorphicArchetype}
                    onChange={(value) => updateField("novelArchetypes", "metamorphicArchetype", value)}
                  />
                )}

                {showHiveMindArchetype && (
                  <QuestionSection
                    id="hivemind-archetype"
                    label="Collective Consciousness-Derived Archetype"
                    prompts={["Does consciousness-merging create an archetype of 'The Boundary' or 'The Dissolving' - the edge between self and other?"]}
                    value={formState.novelArchetypes.hiveMindArchetype}
                    onChange={(value) => updateField("novelArchetypes", "hiveMindArchetype", value)}
                  />
                )}

                {showMultiParentalArchetype && (
                  <QuestionSection
                    id="multiparental-archetype"
                    label="Multi-Parental-Derived Archetype"
                    prompts={["Does reproduction create an archetype of 'The Triad/Trinity' or 'The Confluence' rather than dyadic parent figures?"]}
                    value={formState.novelArchetypes.multiParentalArchetype}
                    onChange={(value) => updateField("novelArchetypes", "multiParentalArchetype", value)}
                  />
                )}

                {showLongevityArchetype && (
                  <QuestionSection
                    id="longevity-archetype"
                    label="Extreme Longevity-Derived Archetype"
                    prompts={["Does near-immortality create an archetype of 'The Eternal Witness' or 'The Burden-Bearer' - one who remembers all?"]}
                    value={formState.novelArchetypes.longevityArchetype}
                    onChange={(value) => updateField("novelArchetypes", "longevityArchetype", value)}
                  />
                )}

                {showBinaryStarArchetype && (
                  <QuestionSection
                    id="binarystar-archetype"
                    label="Binary/Multiple Star-Derived Archetype"
                    prompts={["Do double shadows create an archetype of 'The Twin-Self' or 'The Shadow-Brother'?"]}
                    value={formState.novelArchetypes.binaryStarArchetype}
                    onChange={(value) => updateField("novelArchetypes", "binaryStarArchetype", value)}
                  />
                )}

                {showTidallyLockedArchetype && (
                  <QuestionSection
                    id="tidallylocked-archetype"
                    label="Tidally Locked-Derived Archetype"
                    prompts={["Does the permanent divide create 'The Day-Face' and 'The Night-Face' - eternal opposition or complementarity?"]}
                    value={formState.novelArchetypes.tidallyLockedArchetype}
                    onChange={(value) => updateField("novelArchetypes", "tidallyLockedArchetype", value)}
                  />
                )}

                {showOceanWorldArchetype && (
                  <QuestionSection
                    id="oceanworld-archetype"
                    label="Ocean World-Derived Archetype"
                    prompts={["Does three-dimensional freedom create an archetype of 'The Depthless' or 'The Weight-Free' - something about vertical freedom vs. limitation?"]}
                    value={formState.novelArchetypes.oceanWorldArchetype}
                    onChange={(value) => updateField("novelArchetypes", "oceanWorldArchetype", value)}
                  />
                )}

                {showNoSkyArchetype && (
                  <QuestionSection
                    id="nosky-archetype"
                    label="Hidden Sky-Derived Archetype"
                    prompts={["Without visible cosmos, does an archetype of 'The Hidden Order' or 'The Beneath-Above' emerge - the sense that meaning exists but cannot be directly perceived?"]}
                    value={formState.novelArchetypes.noSkyArchetype}
                    onChange={(value) => updateField("novelArchetypes", "noSkyArchetype", value)}
                  />
                )}

                {!showMetamorphicArchetype && !showHiveMindArchetype && !showMultiParentalArchetype &&
                 !showLongevityArchetype && !showBinaryStarArchetype && !showTidallyLockedArchetype &&
                 !showOceanWorldArchetype && !showNoSkyArchetype && (
                  <p className="text-sm text-muted-foreground italic">
                    No special archetype fields triggered by current selections. These appear when you select specific biology or environment options.
                  </p>
                )}
              </div>

              {/* Archetypal Pantheon Builder */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Species-Specific Archetypal Pantheon</h4>
                    <p className="text-sm text-muted-foreground">
                      Define 5-12 archetypal forms derived from your species' pressures, biology, and environment.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addArchetype}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Archetype
                  </Button>
                </div>

                {formState.archetypePantheon.map((archetype, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Archetype {index + 1}</h5>
                      <Button variant="ghost" size="sm" onClick={() => removeArchetype(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Archetype Name</Label>
                        <Input
                          placeholder="e.g., The Cycle-Keeper, The Field-Singer"
                          value={archetype.name}
                          onChange={(e) => updateArchetype(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Evolutionary Origin</Label>
                        <Input
                          placeholder="Which pressure(s) generated it"
                          value={archetype.evolutionaryOrigin}
                          onChange={(e) => updateArchetype(index, "evolutionaryOrigin", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cognitive Function</Label>
                      <Textarea
                        placeholder="What existential tension it resolves"
                        value={archetype.cognitiveFunction}
                        onChange={(e) => updateArchetype(index, "cognitiveFunction", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Symbolic Form</Label>
                      <Textarea
                        placeholder="How it manifests in this species' mythology"
                        value={archetype.symbolicForm}
                        onChange={(e) => updateArchetype(index, "symbolicForm", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Narrative Role</Label>
                      <Input
                        placeholder="What it 'does' in myths"
                        value={archetype.narrativeRole}
                        onChange={(e) => updateArchetype(index, "narrativeRole", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {formState.archetypePantheon.length === 0 && (
                  <div className="p-4 rounded-lg border border-dashed border-muted text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click "Add Archetype" to start building your species' unique archetypal pantheon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4: Mythic Expression */}
          <CollapsibleSection
            id="section-mythic-expression"
            title="Mythic Expression"
            subtitle="How archetypes manifest in mythology"
            levelNumber={4}
            thinkLike="a mythologist: Myths encode existential truths in narrative form."
          >
            <div className="space-y-8">
              {/* Creation Narrative */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Creation Narrative</h4>

                <QuestionSection
                  id="primordial-state"
                  label="Primordial State"
                  prompts={[SECTION_GUIDANCE.creationNarrative.primordialState.prompt]}
                  examples={SECTION_GUIDANCE.creationNarrative.primordialState.examples}
                  value={formState.creationNarrative.primordialState}
                  onChange={(value) => updateField("creationNarrative", "primordialState", value)}
                />

                <QuestionSection
                  id="creative-act"
                  label="The Creative Act"
                  prompts={[SECTION_GUIDANCE.creationNarrative.creativeAct.prompt]}
                  example={SECTION_GUIDANCE.creationNarrative.creativeAct.example}
                  value={formState.creationNarrative.creativeAct}
                  onChange={(value) => updateField("creationNarrative", "creativeAct", value)}
                />

                <QuestionSection
                  id="first-created"
                  label="The First Created Thing"
                  prompts={[SECTION_GUIDANCE.creationNarrative.firstCreatedThing.prompt]}
                  value={formState.creationNarrative.firstCreatedThing}
                  onChange={(value) => updateField("creationNarrative", "firstCreatedThing", value)}
                />

                <QuestionSection
                  id="full-narrative"
                  label="Full Creation Narrative"
                  prompts={["Write your creation myth using your species' archetypes and concepts."]}
                  value={formState.creationNarrative.fullNarrative}
                  onChange={(value) => updateField("creationNarrative", "fullNarrative", value)}
                />
              </div>

              {/* Cosmological Structure */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Cosmological Structure</h4>

                <RadioGroupField
                  label="Dimensional Structure"
                  description="How does this species perceive reality's architecture?"
                  options={DIMENSIONAL_STRUCTURES}
                  value={formState.cosmologicalStructure.dimensionalStructure}
                  onChange={(value) => updateField("cosmologicalStructure", "dimensionalStructure", value)}
                />

                <QuestionSection
                  id="primary-division"
                  label="Primary Cosmological Division"
                  prompts={[SECTION_GUIDANCE.cosmologicalStructure.primaryDivision.prompt]}
                  examples={SECTION_GUIDANCE.cosmologicalStructure.primaryDivision.examples}
                  value={formState.cosmologicalStructure.primaryDivision}
                  onChange={(value) => updateField("cosmologicalStructure", "primaryDivision", value)}
                />

                <QuestionSection
                  id="sacred-geography"
                  label="Sacred Geography"
                  prompts={[SECTION_GUIDANCE.cosmologicalStructure.sacredGeography.prompt]}
                  example={SECTION_GUIDANCE.cosmologicalStructure.sacredGeography.example}
                  value={formState.cosmologicalStructure.sacredGeography}
                  onChange={(value) => updateField("cosmologicalStructure", "sacredGeography", value)}
                />
              </div>

              {/* Divine Conceptualization */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Divine Conceptualization</h4>

                <RadioGroupField
                  label="Divine Ontology"
                  description="Are your archetypal forms 'gods' or something else?"
                  options={DIVINE_ONTOLOGIES}
                  value={formState.divineConceptualization.divineOntology}
                  onChange={(value) => updateField("divineConceptualization", "divineOntology", value)}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Divine Characteristics for Each Archetype</Label>
                    <Button variant="outline" size="sm" onClick={addDeity}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deity
                    </Button>
                  </div>

                  {formState.divineConceptualization.deities.map((deity, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Deity {index + 1}</h5>
                        <Button variant="ghost" size="sm" onClick={() => removeDeity(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Archetype Name</Label>
                          <Input
                            placeholder="Which archetype this represents"
                            value={deity.archetypeName}
                            onChange={(e) => updateDeity(index, "archetypeName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Divine Status</Label>
                          <RadioGroup
                            value={deity.divineStatus}
                            onValueChange={(value) => updateDeity(index, "divineStatus", value)}
                            className="flex flex-wrap gap-2"
                          >
                            {DIVINE_STATUS_LEVELS.map((level) => (
                              <div key={level.id} className="flex items-center gap-1">
                                <RadioGroupItem value={level.id} id={`deity-${index}-status-${level.id}`} />
                                <Label htmlFor={`deity-${index}-status-${level.id}`} className="text-xs cursor-pointer">
                                  {level.name}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Domain of Influence</Label>
                        <Input
                          placeholder="What this deity controls or represents"
                          value={deity.domain}
                          onChange={(e) => updateDeity(index, "domain", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Relationship to Physical Reality</Label>
                        <RadioGroup
                          value={deity.physicalRelationship}
                          onValueChange={(value) => updateDeity(index, "physicalRelationship", value)}
                          className="flex flex-wrap gap-2"
                        >
                          {PHYSICAL_RELATIONSHIPS.map((rel) => (
                            <div key={rel.id} className="flex items-center gap-1">
                              <RadioGroupItem value={rel.id} id={`deity-${index}-rel-${rel.id}`} />
                              <Label htmlFor={`deity-${index}-rel-${rel.id}`} className="text-xs cursor-pointer">
                                {rel.name}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>How Species Interacts with This Divine Form</Label>
                        <Textarea
                          placeholder="Worship, propitiation, communication methods..."
                          value={deity.interaction}
                          onChange={(e) => updateDeity(index, "interaction", e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}

                  {formState.divineConceptualization.deities.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      Add deities to define their divine characteristics.
                    </p>
                  )}
                </div>
              </div>

              {/* Mythic Cycles */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Core Mythic Cycles</h4>

                <QuestionSection
                  id="great-crisis"
                  label="The Great Crisis"
                  prompts={[SECTION_GUIDANCE.mythicCycles.greatCrisis.prompt]}
                  example={SECTION_GUIDANCE.mythicCycles.greatCrisis.example}
                  value={formState.mythicCycles.greatCrisis}
                  onChange={(value) => updateField("mythicCycles", "greatCrisis", value)}
                />

                <QuestionSection
                  id="crisis-resolution"
                  label="Crisis Resolution"
                  prompts={["How is the crisis resolved (or not)?"]}
                  value={formState.mythicCycles.crisisResolution}
                  onChange={(value) => updateField("mythicCycles", "crisisResolution", value)}
                />

                <QuestionSection
                  id="crisis-explanation"
                  label="What This Myth Explains"
                  prompts={[SECTION_GUIDANCE.mythicCycles.crisisExplanation.prompt]}
                  example={SECTION_GUIDANCE.mythicCycles.crisisExplanation.example}
                  value={formState.mythicCycles.crisisExplanation}
                  onChange={(value) => updateField("mythicCycles", "crisisExplanation", value)}
                />

                <QuestionSection
                  id="current-order"
                  label="Current Order of Things"
                  prompts={["How does your mythology explain the current order of things?"]}
                  value={formState.mythicCycles.currentOrder}
                  onChange={(value) => updateField("mythicCycles", "currentOrder", value)}
                />

                <QuestionSection
                  id="unresolved-tension"
                  label="Unresolved Tension"
                  prompts={[SECTION_GUIDANCE.mythicCycles.unresolvedTension.prompt]}
                  value={formState.mythicCycles.unresolvedTension}
                  onChange={(value) => updateField("mythicCycles", "unresolvedTension", value)}
                />
              </div>

              {/* Symbolic Catalog */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Symbolic Catalog</h4>
                    <p className="text-sm text-muted-foreground">
                      Sacred/significant entities that carry symbolic weight.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addSymbolicEntity}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entity
                  </Button>
                </div>

                {formState.symbolicCatalog.map((entity, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Entity {index + 1}</h5>
                      <Button variant="ghost" size="sm" onClick={() => removeSymbolicEntity(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Entity Name</Label>
                        <Input
                          value={entity.entityName}
                          onChange={(e) => updateSymbolicEntity(index, "entityName", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Archetype Association</Label>
                        <Input
                          value={entity.archetypeAssociation}
                          onChange={(e) => updateSymbolicEntity(index, "archetypeAssociation", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Why Symbolically Important</Label>
                      <Textarea
                        value={entity.symbolicImportance}
                        onChange={(e) => updateSymbolicEntity(index, "symbolicImportance", e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mythic Role</Label>
                      <Input
                        placeholder="What does it do in stories?"
                        value={entity.mythicRole}
                        onChange={(e) => updateSymbolicEntity(index, "mythicRole", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {formState.symbolicCatalog.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Add symbolic entities to build your mythology's bestiary.
                  </p>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5: Religious/Ritual Practices */}
          <CollapsibleSection
            id="section-religious-practices"
            title="Religious/Ritual Practices"
            subtitle="How myths become lived experience"
            levelNumber={5}
            thinkLike="an anthropologist: Rituals encode and transmit mythic truths."
          >
            <div className="space-y-8">
              {/* Ritual Structure */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Ritual Structure</h4>

                <CheckboxGroup
                  label="Primary Ritual Functions"
                  description="What do rituals need to accomplish?"
                  options={RITUAL_FUNCTIONS}
                  selected={formState.ritualStructure.primaryFunctions}
                  onChange={(selected) => updateField("ritualStructure", "primaryFunctions", selected)}
                />

                <QuestionSection
                  id="ritual-sensory"
                  label="Ritual Sensory Modality"
                  prompts={["Based on your species' primary senses, how are rituals actually experienced?"]}
                  example="For EM-sensing species: 'Rituals center on synchronized electromagnetic emission patterns - the congregation creates complex interference patterns that represent mythic events.'"
                  value={formState.ritualStructure.sensoryModality}
                  onChange={(value) => updateField("ritualStructure", "sensoryModality", value)}
                />

                <QuestionSection
                  id="ritual-timing"
                  label="Ritual Timing"
                  prompts={["What temporal patterns structure ritual life?"]}
                  value={formState.ritualStructure.ritualTiming}
                  onChange={(value) => updateField("ritualStructure", "ritualTiming", value)}
                />
              </div>

              {/* Sacred Specialists */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Sacred Specialists</h4>

                <RadioGroupField
                  label="Religious Leadership Model"
                  options={LEADERSHIP_MODELS}
                  value={formState.sacredSpecialists.leadershipModel}
                  onChange={(value) => updateField("sacredSpecialists", "leadershipModel", value)}
                />

                <QuestionSection
                  id="specialist-abilities"
                  label="Specialist Abilities/Functions"
                  prompts={["What can religious specialists do that others cannot?"]}
                  example="For hive-mind species: 'Communion-Walkers can temporarily merge consciousness with multiple colonies simultaneously, serving as bridges for inter-colony understanding.'"
                  value={formState.sacredSpecialists.specialistAbilities}
                  onChange={(value) => updateField("sacredSpecialists", "specialistAbilities", value)}
                />

                <QuestionSection
                  id="specialist-identification"
                  label="How Are Specialists Identified?"
                  prompts={["What signs or processes identify religious specialists?"]}
                  value={formState.sacredSpecialists.identificationMethod}
                  onChange={(value) => updateField("sacredSpecialists", "identificationMethod", value)}
                />

                <QuestionSection
                  id="specialist-dangers"
                  label="Specialist Dangers/Costs"
                  prompts={["What risks do religious specialists face?"]}
                  example="Field-Singers who maintain ritual electromagnetic patterns too long risk 'signal dissolution' - losing their individual coherence in the collective field."
                  value={formState.sacredSpecialists.specialistDangers}
                  onChange={(value) => updateField("sacredSpecialists", "specialistDangers", value)}
                />
              </div>

              {/* Sacred Spaces */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Sacred Spaces</h4>

                <QuestionSection
                  id="what-makes-sacred"
                  label="What Makes Space Sacred?"
                  prompts={[SECTION_GUIDANCE.sacredSpaces.whatMakesSacred.prompt]}
                  examples={SECTION_GUIDANCE.sacredSpaces.whatMakesSacred.examples}
                  value={formState.sacredSpaces.whatMakesSacred}
                  onChange={(value) => updateField("sacredSpaces", "whatMakesSacred", value)}
                />

                <QuestionSection
                  id="temple-characteristics"
                  label="Temple/Ritual Site Characteristics"
                  prompts={["Describe the physical/environmental features of sacred spaces."]}
                  value={formState.sacredSpaces.templeCharacteristics}
                  onChange={(value) => updateField("sacredSpaces", "templeCharacteristics", value)}
                />

                <CheckboxGroup
                  label="Pilgrimage Practices"
                  options={PILGRIMAGE_TYPES}
                  selected={formState.sacredSpaces.pilgrimageTypes}
                  onChange={(selected) => updateField("sacredSpaces", "pilgrimageTypes", selected)}
                />

                <QuestionSection
                  id="pilgrimage-purpose"
                  label="Pilgrimage Purpose"
                  prompts={["Why do pilgrims travel? What do they seek/achieve?"]}
                  value={formState.sacredSpaces.pilgrimagePurpose}
                  onChange={(value) => updateField("sacredSpaces", "pilgrimagePurpose", value)}
                />
              </div>

              {/* Death Practices & Eschatology */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Death Practices & Eschatology</h4>

                <QuestionSection
                  id="consciousness-at-death"
                  label="What Happens at Death?"
                  prompts={[SECTION_GUIDANCE.deathPractices.consciousnessAtDeath.prompt]}
                  examples={SECTION_GUIDANCE.deathPractices.consciousnessAtDeath.examples}
                  value={formState.deathPractices.consciousnessAtDeath}
                  onChange={(value) => updateField("deathPractices", "consciousnessAtDeath", value)}
                />

                <QuestionSection
                  id="death-rituals"
                  label="Death Rituals"
                  prompts={["What is done with/for the dead? (Should reflect biology and beliefs)"]}
                  value={formState.deathPractices.deathRituals}
                  onChange={(value) => updateField("deathPractices", "deathRituals", value)}
                />

                <RadioGroupField
                  label="Ancestor Relations"
                  options={ANCESTOR_RELATIONS}
                  value={formState.deathPractices.ancestorRelations}
                  onChange={(value) => updateField("deathPractices", "ancestorRelations", value)}
                />

                <RadioGroupField
                  label="Cosmic Eschatology"
                  description="Does this mythology include cosmic destiny/ending?"
                  options={COSMIC_ESCHATOLOGIES}
                  value={formState.deathPractices.cosmicEschatology}
                  onChange={(value) => updateField("deathPractices", "cosmicEschatology", value)}
                />

                <QuestionSection
                  id="end-times"
                  label="End-Times Narrative"
                  prompts={[SECTION_GUIDANCE.deathPractices.endTimesNarrative.prompt]}
                  example={SECTION_GUIDANCE.deathPractices.endTimesNarrative.example}
                  value={formState.deathPractices.endTimesNarrative}
                  onChange={(value) => updateField("deathPractices", "endTimesNarrative", value)}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6: Synthesis */}
          <CollapsibleSection
            id="section-synthesis"
            title="Synthesis & Framework"
            subtitle="Cultural expressions and final framework"
            levelNumber={6}
            thinkLike="a cultural anthropologist: Mythology shapes all aspects of society."
          >
            <div className="space-y-8">
              {/* Ethical Framework */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Ethical Framework</h4>
                <p className="text-sm text-muted-foreground">
                  Based on this mythology, what behaviors are considered virtuous, taboo, or ambiguous?
                </p>

                <QuestionSection
                  id="ethical-virtues"
                  label="Virtuous/Sacred Behaviors"
                  prompts={[SECTION_GUIDANCE.synthesis.ethicalVirtues.prompt]}
                  example={SECTION_GUIDANCE.synthesis.ethicalVirtues.example}
                  value={formState.synthesis.ethicalVirtues}
                  onChange={(value) => updateField("synthesis", "ethicalVirtues", value)}
                />

                <QuestionSection
                  id="ethical-taboos"
                  label="Taboo/Profane Behaviors"
                  prompts={[SECTION_GUIDANCE.synthesis.ethicalTaboos.prompt]}
                  example={SECTION_GUIDANCE.synthesis.ethicalTaboos.example}
                  value={formState.synthesis.ethicalTaboos}
                  onChange={(value) => updateField("synthesis", "ethicalTaboos", value)}
                />

                <QuestionSection
                  id="ethical-ambiguous"
                  label="Ambiguous/Liminal Behaviors"
                  prompts={[SECTION_GUIDANCE.synthesis.ethicalAmbiguous.prompt]}
                  example={SECTION_GUIDANCE.synthesis.ethicalAmbiguous.example}
                  value={formState.synthesis.ethicalAmbiguous}
                  onChange={(value) => updateField("synthesis", "ethicalAmbiguous", value)}
                />
              </div>

              {/* Art & Symbolism */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">Art & Symbolism</h4>

                <QuestionSection
                  id="art-expressions"
                  label="Artistic Expressions"
                  prompts={[
                    "What aesthetic/artistic expressions emerge from this mythology?",
                    "Consider visual arts, sonic arts, chemical arts, performance, narrative..."
                  ]}
                  value={formState.synthesis.artExpressions}
                  onChange={(value) => updateField("synthesis", "artExpressions", value)}
                />
              </div>

              {/* Science/Knowledge Relationship */}
              <div className="space-y-6 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">Science/Knowledge Relationship</h4>
                <p className="text-sm text-muted-foreground">
                  How would this mythology interact with empirical understanding?
                </p>

                <QuestionSection
                  id="science-harmony"
                  label="Areas of Harmony"
                  prompts={["Where do mythology and empirical observation align?"]}
                  value={formState.synthesis.scienceHarmony}
                  onChange={(value) => updateField("synthesis", "scienceHarmony", value)}
                />

                <QuestionSection
                  id="science-tension"
                  label="Areas of Tension"
                  prompts={["Where do mythology and observation conflict?"]}
                  value={formState.synthesis.scienceTension}
                  onChange={(value) => updateField("synthesis", "scienceTension", value)}
                />

                <CheckboxGroup
                  label="Resolution Strategies"
                  options={SCIENCE_RESOLUTIONS}
                  selected={formState.synthesis.scienceResolution}
                  onChange={(selected) => updateField("synthesis", "scienceResolution", selected)}
                  columns={3}
                />
              </div>

              {/* Summary Display */}
              {formState.archetypePantheon.length > 0 && (
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your Archetypal Pantheon Summary
                  </h4>
                  <div className="space-y-3">
                    {formState.archetypePantheon.map((archetype, index) => (
                      <div key={index} className="p-3 rounded bg-background/50">
                        <strong className="text-primary">{archetype.name || `Archetype ${index + 1}`}</strong>
                        {archetype.evolutionaryOrigin && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (from {archetype.evolutionaryOrigin})
                          </span>
                        )}
                        {archetype.cognitiveFunction && (
                          <p className="text-sm text-muted-foreground mt-1">{archetype.cognitiveFunction}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
          </div>

          {/* Sticky Sidebar - visible on large screens when parameters selected */}
          {getSelectedParametersForSidebar().length > 0 && (
            <div className="hidden lg:block">
              <SelectedParametersSidebar
                parameters={getSelectedParametersForSidebar()}
                title="Species & Environment"
                footerText="These foundations shape all archetypal expressions."
              />
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <ToolActionBar
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExport}
          exportLabel="Export Framework"
          className="mt-8"
        />

        {/* Section Navigation */}
        <SectionNavigation sections={SECTIONS} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>

      {/* ECR Import Modal */}
      <ImportFromECRModal
        open={showECRImport}
        onOpenChange={setShowECRImport}
        worksheets={ecrWorksheets}
        onImport={handleECRImport}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Xenomythology Framework"
        worldName={worldName}
        formState={formState}
        summaryTemplate={<XenomythologySummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<XenomythologyFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename="xenomythology-framework"
      />

      {/* Worksheet Selector Dialog */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Xenomythology Framework Builder"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}
    </div>
  );
};

export default XenomythologyFrameworkBuilder;
