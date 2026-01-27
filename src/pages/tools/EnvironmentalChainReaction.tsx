import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, ChevronDown, ChevronUp, Info, Printer, ExternalLink, Cloud, CloudOff, FileText } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { useWorksheets, useWorksheet } from "@/hooks/use-worksheets";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import WorldSelectDialog, { SaveSelection } from "@/components/tools/WorldSelectDialog";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import ToolActionBar from "@/components/tools/ToolActionBar";
import SelectedParametersSidebar from "@/components/tools/SelectedParametersSidebar";
import ExportDialog from "@/components/tools/ExportDialog";
import { ECRSummaryTemplate, ECRFullReportTemplate } from "@/lib/pdf/templates";
import { Json } from "@/integrations/supabase/types";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-examples", title: "SF Examples" },
  { id: "section-parameter", title: "Planetary Parameter" },
  { id: "section-level1", title: "1. Physical" },
  { id: "section-level2", title: "2. Biological" },
  { id: "section-level3", title: "3. Psychological" },
  { id: "section-level4", title: "4. Cultural" },
  { id: "section-level5", title: "5. Mythological" },
  { id: "section-consistency", title: "Consistency Check" },
  { id: "section-synthesis", title: "Synthesis" },
];

// SF Examples for cascade demonstration
const SF_CASCADE_EXAMPLES = [
  {
    title: "ARRAKIS (Dune) — Desert World",
    parameter: "Extreme water scarcity",
    cascade: [
      { level: "Physical", details: "Stillsuits to reclaim moisture, underground sietches, travel at night, sandworm transportation" },
      { level: "Biological", details: "Blue-within-blue spice eyes, efficient water metabolism, desert-adapted physiology" },
      { level: "Psychological", details: "Water as life itself, patience as survival, spice-induced prescience, fear of the worm" },
      { level: "Cultural", details: "Water as currency, water-sharing as bond, tau (ritual water gift), water discipline, sietch democracy" },
      { level: "Mythological", details: "Shai-Hulud as god/devil, spice as sacred substance, water-paradise afterlife, Lisan al-Gaib prophecy" },
    ],
    insight: "Frank Herbert traced every cultural element back to water scarcity—even their messiah myth.",
  },
  {
    title: "GETHEN (The Left Hand of Darkness) — Frozen World + Kemmer Biology",
    parameter: "Ice age climate + ambisexual biology",
    cascade: [
      { level: "Physical", details: "Heavy insulated clothing, hearth-centered architecture, limited growing season, sled transport" },
      { level: "Biological", details: "Kemmer cycle (monthly sexuality), ambisexual nature, cold adaptation, no permanent sex" },
      { level: "Psychological", details: "No permanent gender identity, shifgrethor (social positioning), patience with change, less aggression" },
      { level: "Cultural", details: "No war (without permanent male aggression), no rape, complex kinship, performance of honor, communal hearths" },
      { level: "Mythological", details: "Origin myths of duality, light/dark balance, no gendered deities, the Place Inside the Blizzard" },
    ],
    insight: "Le Guin used environment + biology to reimagine human society without permanent gender.",
  },
  {
    title: "MESKLIN (Mission of Gravity) — Extreme Variable Gravity",
    parameter: "3g at equator, 700g at poles",
    cascade: [
      { level: "Physical", details: "Flattened disc-shaped bodies, clinging locomotion, no throwing, no falling, crawling movement" },
      { level: "Biological", details: "Caterpillar-like segmented body, extremely strong for size, cannot jump, low profile" },
      { level: "Psychological", details: "Intense acrophobia, conceptual difficulty with 'up', fear of leverage, terror of heights" },
      { level: "Cultural", details: "Ground-hugging architecture, trade-based society (equatorial Mesklinites), territorial poles, raft-sailing" },
      { level: "Mythological", details: "The Fall as ultimate evil, vertical as supernatural realm, weight as virtue, sky as void/death" },
    ],
    insight: "Hal Clement built an entire psychology from the terror of falling in extreme gravity.",
  },
];

// Types for form state
interface PlanetaryParameter {
  type: string;
  specificValue: string;
  mode: "single" | "multiple";
  types?: string[];
  specificValues?: Record<string, string>;
}

interface CascadeLevel {
  responses: Record<string, string>;
}

interface FormState {
  parameter: PlanetaryParameter;
  level1: CascadeLevel;
  level2: CascadeLevel;
  level3: CascadeLevel;
  level4: CascadeLevel;
  level5: CascadeLevel;
  synthesis: {
    logicalFlow: string;
    contradictions: string;
    monoCultureCheck: string;
    vestigialQuestion: string;
    soWhatTest: string;
    surprisingConsequence: string;
    biggestGap: string;
    storyPotential: string;
  };
}

const initialFormState: FormState = {
  parameter: { type: "", specificValue: "", mode: "single", types: [], specificValues: {} },
  level1: { responses: {} },
  level2: { responses: {} },
  level3: { responses: {} },
  level4: { responses: {} },
  level5: { responses: {} },
  synthesis: {
    logicalFlow: "",
    contradictions: "",
    monoCultureCheck: "",
    vestigialQuestion: "",
    soWhatTest: "",
    surprisingConsequence: "",
    biggestGap: "",
    storyPotential: "",
  },
};

const PLANETARY_PARAMETERS = [
  {
    id: "gravity",
    label: "Gravity",
    options: [
      { value: "high", label: "High gravity (1.5-3x Earth)", description: "Crushing weight, thick atmosphere" },
      { value: "low", label: "Low gravity (0.3-0.8x Earth)", description: "Easier flight, atmosphere loss risk" },
    ],
    placeholder: "e.g., 2.1 Earth gravities",
  },
  {
    id: "rotation",
    label: "Rotation / Day Length",
    options: [
      { value: "slow", label: "Slow rotation (48+ hour days)", description: "Extreme temperature swings" },
      { value: "fast", label: "Fast rotation (6-12 hour days)", description: "Constant day/night cycling" },
      { value: "locked", label: "Tidally locked", description: "Permanent day side/night side/twilight band" },
    ],
    placeholder: "e.g., 72 hours per day, or tidally locked to red dwarf",
  },
  {
    id: "stellar",
    label: "Stellar Environment",
    options: [
      { value: "binary", label: "Binary/multiple star system", description: "Complex seasons, no 'true night'" },
      { value: "reddwarf", label: "Red dwarf orbit", description: "Dim light, tidal locking likely, stellar flares" },
      { value: "rogue", label: "Rogue planet", description: "No star, eternal darkness, internal heat only" },
    ],
    placeholder: "e.g., Binary G-type and K-type stars",
  },
  {
    id: "hydrosphere",
    label: "Hydrosphere",
    options: [
      { value: "ocean", label: "Ocean world (90-100% water)", description: "No landmasses or tiny islands only" },
      { value: "desert", label: "Desert world (0-20% water)", description: "Extreme scarcity, localized sources" },
      { value: "archipelago", label: "Archipelago world (40-60% mixed)", description: "Isolated water-separated cultures" },
    ],
    placeholder: "e.g., 15% surface water coverage",
  },
  {
    id: "atmosphere",
    label: "Atmosphere",
    options: [
      { value: "thick", label: "Thick atmosphere", description: "High pressure, muted light, weather extremes" },
      { value: "thin", label: "Thin atmosphere", description: "Temperature swings, radiation exposure, weak weather" },
      { value: "exotic", label: "Exotic composition", description: "Methane, ammonia, high CO₂" },
    ],
    placeholder: "e.g., 3 atm pressure, 40% CO₂",
  },
  {
    id: "tilt",
    label: "Axial Tilt",
    options: [
      { value: "none", label: "No tilt (0-5°)", description: "No seasons, permanent climate zones" },
      { value: "extreme", label: "Extreme tilt (>45°)", description: "Radical seasonal changes, uninhabitable zones" },
      { value: "chaotic", label: "Chaotic/tumbling", description: "Unpredictable climate (rare)" },
    ],
    placeholder: "e.g., 67 degrees",
  },
  {
    id: "geological",
    label: "Geological Activity",
    options: [
      { value: "high", label: "High tectonic activity", description: "Frequent quakes, volcanic eruptions, mountain building" },
      { value: "dead", label: "Geologically dead", description: "No volcanism, no magnetic field, ancient surface" },
      { value: "cryo", label: "Cryovolcanism", description: "Ice volcanoes (water/ammonia), subsurface ocean" },
    ],
    placeholder: "e.g., Supervolcano every 10,000 years",
  },
  {
    id: "other",
    label: "Other Unique Factor",
    options: [],
    placeholder: "Describe your unique environmental factor...",
  },
];

const LEVEL1_QUESTIONS = [
  {
    id: "architecture",
    label: "Architecture & Settlement Patterns",
    prompts: [
      "Where can structures be built safely?",
      "What building materials/techniques are necessary?",
      "What forms shelter from environmental pressures?",
    ],
  },
  {
    id: "movement",
    label: "Movement & Transportation",
    prompts: [
      "How do inhabitants move within their environment?",
      "What forms of transportation are possible/impossible?",
      "What distances can be traveled safely?",
    ],
  },
  {
    id: "resources",
    label: "Resource Availability & Distribution",
    prompts: [
      "What resources are abundant vs. scarce?",
      "How are essential resources accessed?",
      "What becomes valuable due to scarcity?",
    ],
  },
  {
    id: "technology",
    label: "Technology Pressures",
    prompts: [
      "What technologies must be developed for survival?",
      "What technologies are impossible or impractical?",
      "What everyday Earth technology wouldn't work here?",
    ],
  },
];

const LEVEL2_QUESTIONS = [
  {
    id: "physical",
    label: "Physical Form & Structure",
    prompts: [
      "Body plan adaptations (size, shape, appendages)",
      "Structural features (shells, exoskeletons, flexibility)",
      "Locomotion methods suited to environment",
    ],
    example: "On a high-gravity world, organisms stay low and wide. On a tidally locked world, life clusters in the twilight band.",
  },
  {
    id: "sensory",
    label: "Sensory Systems",
    prompts: [
      "Which senses are enhanced, diminished, or absent?",
      "Any novel senses evolved for this environment?",
      "How does sensory apparatus shape perception?",
    ],
    example: "Dim red dwarf light might favor infrared vision. Eternal darkness might produce echolocation.",
  },
  {
    id: "metabolic",
    label: "Metabolic & Energy Systems",
    prompts: [
      "Energy sources (photosynthesis, chemosynthesis, predation)",
      "Activity cycles (sleep/wake, hibernation, seasonal)",
      "Reproduction strategy",
    ],
  },
  {
    id: "vestigial",
    label: "Vestigial Traits",
    prompts: [
      "What evolutionary remnant no longer serves its original purpose?",
      "What does this reveal about their evolutionary history?",
    ],
    example: "Like human appendix or whale hip bones—what's your species' vestige?",
  },
];

const LEVEL3_QUESTIONS = [
  {
    id: "normal",
    label: 'Concept of "Normal"',
    prompts: ["What do they consider ordinary that humans would find bizarre or terrifying?"],
    example: "On Gethen (Le Guin), shifting gender monthly is normal. On Mesklin (Clement), 700G gravity at the poles is normal.",
  },
  {
    id: "fears",
    label: "Primal Fears",
    prompts: ["What terrifies them at an instinctive, species-level?"],
    example: "Desert dwellers fear water waste. Ocean worlders might fear emptiness or 'the deep.' Tidally locked species might fear the dark or the burning day.",
  },
  {
    id: "temporal",
    label: "Temporal Perception",
    prompts: [
      "How do they experience time?",
      "Do they have urgency or patience shaped by environmental rhythms?",
      "What constitutes 'long-term' vs. 'short-term' thinking?",
    ],
  },
  {
    id: "values",
    label: "Values & Priorities",
    prompts: ["What matters deeply due to environmental/biological pressures?"],
    example: "Fremen value water above all. Extremely long-lived species might value legacy differently.",
  },
  {
    id: "cognitive",
    label: "Cognitive Differences",
    prompts: [
      "How might their sensory apparatus change how they think?",
      "Do they have cognitive abilities humans lack (or vice versa)?",
      "What metaphors structure their worldview?",
    ],
    example: "Heptapods with non-linear language perception in Arrival. Echolocating species using sound-mapping metaphors.",
  },
];

const LEVEL4_QUESTIONS = [
  {
    id: "social",
    label: "Social Organization",
    prompts: [
      "Family/kinship structures",
      "Community organization",
      "Power hierarchies (if any)",
    ],
    example: "Hive species might have caste systems. Solitary evolved species might resist collective authority.",
  },
  {
    id: "economic",
    label: "Economic Systems",
    prompts: [
      "What constitutes wealth/value?",
      "How are resources distributed or controlled?",
      "What economic activities are possible/necessary?",
    ],
    example: "On Arrakis, water is currency. On an ocean world, salt or land might be precious.",
  },
  {
    id: "status",
    label: "Status Symbols & Achievement",
    prompts: ["What demonstrates success, power, or prestige in this culture?"],
  },
  {
    id: "taboos",
    label: "Taboos & Prohibitions",
    prompts: ["What's forbidden or dangerous due to environmental/biological realities?"],
    example: "Fremen never waste water. A low-gravity species might forbid heavy construction. A tidally locked species might forbid venturing into the burning day.",
  },
  {
    id: "art",
    label: "Art & Aesthetics",
    prompts: [
      "What do they consider beautiful, and why?",
      "What art forms emerge from their sensory capabilities?",
      "How do they record history or express meaning?",
    ],
    example: "A species without vision wouldn't paint. An echolocating species might create sound sculptures.",
  },
  {
    id: "conflict",
    label: "Conflict & Resolution",
    prompts: [
      "What do they fight over?",
      "How do they resolve disputes?",
      "What constitutes justice?",
    ],
  },
];

const LEVEL5_QUESTIONS = [
  {
    id: "creation",
    label: "Creation Myth",
    prompts: ["How does your environmental factor appear in their origin story?"],
    example: "Desert peoples often have emergence myths from underground. Ocean peoples might have primordial sea myths. Tidally locked peoples might have dualistic light/dark creation.",
  },
  {
    id: "sacred",
    label: "Sacred/Divine Associations",
    prompts: ["What's worshipped, revered, or considered holy because of environmental realities?"],
    example: "Water gods on desert worlds. The Stillness in a tectonically unstable world (Broken Earth). Sandworms as sacred in Dune.",
  },
  {
    id: "cosmological",
    label: "Central Cosmological Metaphor",
    prompts: ["What metaphor derived from lived environment structures their entire worldview?"],
    example: '"Life is a river" for water-dependent culture. "Existence is a cycle" for strong seasonal worlds. "Balance between light and dark" for tidally locked.',
  },
  {
    id: "ritual",
    label: "Ritual Practices",
    prompts: ["What ceremonies/rituals emerge from environmental realities and biological needs?"],
    example: "Fremen water-reclamation death rituals. Coming-of-age rituals tied to environmental mastery (first surface walk, first dive, surviving the dark, etc.)",
  },
  {
    id: "suffering",
    label: "Mythological Explanation of Suffering",
    prompts: [
      "How do they explain why life is hard?",
      "What gives suffering meaning?",
    ],
  },
];

const QuestionSection = ({
  id,
  label,
  prompts,
  example,
  value,
  onChange,
}: {
  id: string;
  label: string;
  prompts: string[];
  example?: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {example && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p className="text-xs">{example}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    <ul className="text-xs text-muted-foreground mb-2 list-disc list-inside">
      {prompts.map((prompt, i) => (
        <li key={i}>{prompt}</li>
      ))}
    </ul>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your response..."
      className="min-h-[100px] bg-background/50"
    />
  </div>
);

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

const TOOL_TYPE = "environmental-chain-reaction";

const EnvironmentalChainReaction = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [showWorldSelectDialog, setShowWorldSelectDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds, createWorld } = useWorlds();
  useBackground();

  // Get URL params for worldId and worksheetId
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  // Get world name from worldId
  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  // Supabase hooks
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);

  // Load existing worksheet from Supabase if worksheetId is provided
  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
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
      const saved = localStorage.getItem("ecr-worksheet");
      if (saved) {
        try {
          setFormState(JSON.parse(saved));
          toast({
            title: "Draft Loaded",
            description: "Your previous work has been restored.",
          });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [worldId, worksheetId]);

  const updateParameter = (field: keyof PlanetaryParameter, value: string) => {
    setFormState((prev) => ({
      ...prev,
      parameter: { ...prev.parameter, [field]: value },
    }));
  };

  const updateLevel = (
    level: "level1" | "level2" | "level3" | "level4" | "level5",
    questionId: string,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [level]: {
        responses: { ...prev[level].responses, [questionId]: value },
      },
    }));
  };

  const updateSynthesis = (field: keyof FormState["synthesis"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const toggleParameterMode = (isMultiple: boolean) => {
    setFormState((prev) => ({
      ...prev,
      parameter: {
        ...prev.parameter,
        mode: isMultiple ? "multiple" : "single",
      },
    }));
  };

  const toggleMultipleParameter = (paramType: string, checked: boolean) => {
    setFormState((prev) => {
      const currentTypes = prev.parameter.types || [];
      const newTypes = checked
        ? [...currentTypes, paramType]
        : currentTypes.filter((t) => t !== paramType);

      // Also remove the specific value if unchecking
      const newSpecificValues = { ...prev.parameter.specificValues };
      if (!checked) {
        delete newSpecificValues[paramType];
      }

      return {
        ...prev,
        parameter: {
          ...prev.parameter,
          types: newTypes,
          specificValues: newSpecificValues,
        },
      };
    });
  };

  const updateMultipleSpecificValue = (paramType: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      parameter: {
        ...prev.parameter,
        specificValues: {
          ...prev.parameter.specificValues,
          [paramType]: value,
        },
      },
    }));
  };

  // Helper to get selected parameters for sidebar
  const getSelectedParametersForSidebar = () => {
    const mode = formState.parameter.mode || "single";
    const selectedParams: Array<{
      typeId: string;
      categoryLabel: string;
      optionLabel: string;
      optionDescription: string;
      specificValue: string;
    }> = [];

    if (mode === "single" && formState.parameter.type) {
      const [categoryId, optionValue] = formState.parameter.type.split("-");
      const category = PLANETARY_PARAMETERS.find((p) => p.id === categoryId);
      const option = category?.options.find((o) => o.value === optionValue);

      if (category) {
        selectedParams.push({
          typeId: formState.parameter.type,
          categoryLabel: category.label,
          optionLabel: option?.label || category.label,
          optionDescription: option?.description || "",
          specificValue: formState.parameter.specificValue,
        });
      }
    } else if (mode === "multiple" && formState.parameter.types) {
      for (const typeId of formState.parameter.types) {
        const [categoryId, optionValue] = typeId.split("-");
        const category = PLANETARY_PARAMETERS.find((p) => p.id === categoryId);
        const option = category?.options.find((o) => o.value === optionValue);

        if (category) {
          selectedParams.push({
            typeId,
            categoryLabel: category.label,
            optionLabel: option?.label || category.label,
            optionDescription: option?.description || "",
            specificValue: formState.parameter.specificValues?.[typeId] || "",
          });
        }
      }
    }

    return selectedParams;
  };

  const saveToSupabase = async (targetWorldId: string) => {
    const worksheetData = formState as unknown as Json;
    const title = formState.parameter.specificValue
      ? `ECR: ${formState.parameter.specificValue}`
      : "Environmental Chain Reaction";

    if (currentWorksheetId || worksheetId) {
      // Update existing worksheet
      await updateWorksheet.mutateAsync({
        worksheetId: currentWorksheetId || worksheetId!,
        title,
        data: worksheetData,
      });
    } else {
      // Create new worksheet
      const result = await createWorksheet.mutateAsync({
        worldId: targetWorldId,
        toolType: TOOL_TYPE,
        title,
        data: worksheetData,
      });
      setCurrentWorksheetId(result.id);
      // Update URL with new worksheetId
      setSearchParams({ worldId: targetWorldId, worksheetId: result.id });
    }
  };

  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem("ecr-worksheet", JSON.stringify(formState));

    // If we have a worldId and user is authenticated, save directly to Supabase
    if (worldId && user) {
      try {
        await saveToSupabase(worldId);
      } catch {
        // Error already handled by the mutation
      }
    } else if (user) {
      // User is logged in but no worldId - show selection dialog
      setShowWorldSelectDialog(true);
    } else {
      toast({
        title: "Draft Saved",
        description: "Your work has been saved locally.",
      });
    }
  };

  const handleWorldSelection = async (selection: SaveSelection) => {
    setIsSaving(true);
    try {
      if (selection.type === "local") {
        toast({
          title: "Draft Saved",
          description: "Your work has been saved locally.",
        });
      } else if (selection.type === "existing") {
        await saveToSupabase(selection.worldId);
        toast({
          title: "Saved to Cloud",
          description: `Worksheet saved to "${selection.worldName}".`,
        });
      } else if (selection.type === "new") {
        const newWorld = await createWorld.mutateAsync({
          name: selection.worldName,
          description: selection.worldDescription,
        });
        await saveToSupabase(newWorld.id);
        toast({
          title: "World Created & Saved",
          description: `Worksheet saved to "${newWorld.name}".`,
        });
      }
      setShowWorldSelectDialog(false);
    } catch {
      // Errors handled by mutations
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background starfield">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            to={worldId ? `/world/${worldId}` : "/"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {worldId ? "Back to World" : "Back to Dashboard"}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className="mb-2">Tool 1</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Environmental Chain Reaction
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Map how planetary parameters cascade into biology, psychology,
                culture, and mythology.
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
            The Cascade Principle
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Environment shapes biology, biology shapes psychology, psychology
            shapes culture, culture shapes mythology."
          </blockquote>
          <p className="text-muted-foreground">
            This tool applies the xenomythological principle that planetary
            conditions generate unique cultures, psychologies, and
            spiritualities. A desert world doesn't just have different
            weather—it produces different religions, social structures,
            technologies, and concepts of value.
          </p>
        </GlassPanel>

        {/* SF Examples Section */}
        <CollapsibleSection
          id="section-examples"
          title="SF Examples: The Cascade in Action"
          subtitle="See how master worldbuilders traced environmental parameters to their consequences"
        >
          <div className="space-y-6">
            {SF_CASCADE_EXAMPLES.map((example) => (
              <div key={example.title} className="border border-border rounded-lg p-4">
                <h4 className="font-display font-semibold text-lg mb-2">{example.title}</h4>
                <p className="text-sm text-primary mb-3">
                  <strong>Core Parameter:</strong> {example.parameter}
                </p>
                <div className="space-y-2 mb-3">
                  {example.cascade.map((level) => (
                    <div key={level.level} className="flex gap-2 text-sm">
                      <span className="font-medium text-primary min-w-[100px]">{level.level}:</span>
                      <span className="text-muted-foreground">{level.details}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-primary/10 rounded p-3 text-sm">
                  <strong className="text-primary">Key Insight:</strong>{" "}
                  <span className="text-muted-foreground">{example.insight}</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Form Sections with Sidebar */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
          {/* Step 1: Planetary Parameter */}
          <CollapsibleSection
            id="section-parameter"
            title="Select Your Planetary Parameter"
            subtitle={
              (formState.parameter.mode || "single") === "single"
                ? "What single environmental factor most defines your world?"
                : "Select multiple environmental factors that define your world"
            }
            defaultOpen={true}
          >
            {/* Mode Toggle */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label htmlFor="mode-toggle" className="text-sm font-medium">
                Selection Mode:
              </Label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    (formState.parameter.mode || "single") === "single"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  Single Factor
                </span>
                <Switch
                  id="mode-toggle"
                  checked={(formState.parameter.mode || "single") === "multiple"}
                  onCheckedChange={toggleParameterMode}
                />
                <span
                  className={`text-sm ${
                    formState.parameter.mode === "multiple"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  Multiple Factors
                </span>
              </div>
            </div>

            {/* Single Mode - RadioGroup */}
            {(formState.parameter.mode || "single") === "single" ? (
              <>
                <RadioGroup
                  value={formState.parameter.type}
                  onValueChange={(value) => updateParameter("type", value)}
                  className="space-y-4"
                >
                  {PLANETARY_PARAMETERS.map((param) => (
                    <div key={param.id} className="space-y-3">
                      <div className="font-medium text-sm text-primary">
                        {param.label}
                      </div>
                      {param.options.length > 0 ? (
                        <div className="grid gap-2 pl-4">
                          {param.options.map((option) => (
                            <div
                              key={`${param.id}-${option.value}`}
                              className="flex items-start gap-3"
                            >
                              <RadioGroupItem
                                value={`${param.id}-${option.value}`}
                                id={`single-${param.id}-${option.value}`}
                                className="mt-1"
                              />
                              <Label
                                htmlFor={`single-${param.id}-${option.value}`}
                                className="cursor-pointer"
                              >
                                <span className="font-medium">{option.label}</span>
                                <span className="text-muted-foreground ml-2">
                                  — {option.description}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-4">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value={param.id}
                              id={`single-${param.id}`}
                              className="mt-1"
                            />
                            <Label htmlFor={`single-${param.id}`} className="cursor-pointer">
                              <span className="font-medium">
                                Define your own unique factor
                              </span>
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-6">
                  <Label htmlFor="specificValue" className="text-sm font-medium">
                    Specific Value
                  </Label>
                  <Input
                    id="specificValue"
                    value={formState.parameter.specificValue}
                    onChange={(e) =>
                      updateParameter("specificValue", e.target.value)
                    }
                    placeholder={
                      PLANETARY_PARAMETERS.find(
                        (p) =>
                          formState.parameter.type.startsWith(p.id)
                      )?.placeholder || "Enter the specific value..."
                    }
                    className="mt-2 bg-background/50"
                  />
                </div>
              </>
            ) : (
              /* Multiple Mode - Checkboxes */
              <div className="space-y-6">
                {PLANETARY_PARAMETERS.map((param) => (
                  <div key={param.id} className="space-y-3">
                    <div className="font-medium text-sm text-primary">
                      {param.label}
                    </div>
                    {param.options.length > 0 ? (
                      <div className="grid gap-3 pl-4">
                        {param.options.map((option) => {
                          const typeId = `${param.id}-${option.value}`;
                          const isChecked = formState.parameter.types?.includes(typeId) || false;
                          return (
                            <div key={typeId} className="space-y-2">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`multi-${typeId}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    toggleMultipleParameter(typeId, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <Label
                                  htmlFor={`multi-${typeId}`}
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-muted-foreground ml-2">
                                    — {option.description}
                                  </span>
                                </Label>
                              </div>
                              {isChecked && (
                                <Input
                                  value={formState.parameter.specificValues?.[typeId] || ""}
                                  onChange={(e) =>
                                    updateMultipleSpecificValue(typeId, e.target.value)
                                  }
                                  placeholder={param.placeholder}
                                  className="ml-7 max-w-md bg-background/50"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pl-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`multi-${param.id}`}
                              checked={formState.parameter.types?.includes(param.id) || false}
                              onCheckedChange={(checked) =>
                                toggleMultipleParameter(param.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <Label htmlFor={`multi-${param.id}`} className="cursor-pointer">
                              <span className="font-medium">
                                Define your own unique factor
                              </span>
                            </Label>
                          </div>
                          {formState.parameter.types?.includes(param.id) && (
                            <Input
                              value={formState.parameter.specificValues?.[param.id] || ""}
                              onChange={(e) =>
                                updateMultipleSpecificValue(param.id, e.target.value)
                              }
                              placeholder={param.placeholder}
                              className="ml-7 max-w-md bg-background/50"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {(formState.parameter.types?.length || 0) > 0 && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-primary">
                        {formState.parameter.types?.length} factor
                        {(formState.parameter.types?.length || 0) !== 1 ? "s" : ""} selected.
                      </strong>{" "}
                      These will appear in the sidebar as you work through the cascade.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Level 1: Physical Implications */}
          <CollapsibleSection
            id="section-level1"
            title="Physical Implications"
            subtitle="What does this environmental factor directly affect?"
            levelNumber={1}
            thinkLike="a systems engineer: How does physics constrain everything?"
          >
            {LEVEL1_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level1-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                value={formState.level1.responses[q.id] || ""}
                onChange={(value) => updateLevel("level1", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 2: Biological Adaptations */}
          <CollapsibleSection
            id="section-level2"
            title="Biological Adaptations"
            subtitle="How would life evolve to survive/thrive here?"
            levelNumber={2}
            thinkLike="an evolutionary biologist: Every trait serves survival or is vestigial."
          >
            {LEVEL2_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level2-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level2.responses[q.id] || ""}
                onChange={(value) => updateLevel("level2", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 3: Psychological Consequences */}
          <CollapsibleSection
            id="section-level3"
            title="Psychological Consequences"
            subtitle="How do physical/biological factors shape perception, emotion, and thought?"
            levelNumber={3}
            thinkLike="a psychologist: Biology determines baseline psychology."
          >
            {LEVEL3_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level3-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level3.responses[q.id] || ""}
                onChange={(value) => updateLevel("level3", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 4: Cultural Expressions */}
          <CollapsibleSection
            id="section-level4"
            title="Cultural Expressions"
            subtitle="How do psychology and biology create social systems?"
            levelNumber={4}
            thinkLike="an anthropologist: Culture is collective psychology made visible."
          >
            {LEVEL4_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level4-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level4.responses[q.id] || ""}
                onChange={(value) => updateLevel("level4", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 5: Mythological Framework */}
          <CollapsibleSection
            id="section-level5"
            title="Mythological Framework"
            subtitle="How do all previous levels generate sacred beliefs and stories?"
            levelNumber={5}
            thinkLike="a mythographer: Myth explains existence and validates culture."
          >
            {LEVEL5_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level5-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level5.responses[q.id] || ""}
                onChange={(value) => updateLevel("level5", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Cascade Consistency Check */}
          <CollapsibleSection
            id="section-consistency"
            title="Cascade Consistency Check"
            subtitle="Review your five levels and validate internal consistency"
          >
            <div className="space-y-6">
              <QuestionSection
                id="synthesis-logical"
                label="1. Logical Flow"
                prompts={[
                  "Does each level follow naturally from the previous one?",
                  "Where are unexpected leaps?",
                ]}
                value={formState.synthesis.logicalFlow}
                onChange={(value) => updateSynthesis("logicalFlow", value)}
              />

              <QuestionSection
                id="synthesis-contradictions"
                label="2. Internal Contradictions"
                prompts={[
                  "Do any elements conflict?",
                  "(Some contradictions are good—they create cultural tension!)",
                ]}
                value={formState.synthesis.contradictions}
                onChange={(value) => updateSynthesis("contradictions", value)}
              />

              <QuestionSection
                id="synthesis-monoculture"
                label="3. Mono-Culture Warning"
                prompts={[
                  "Have you created variety within this framework?",
                  "Remember: Earth has deserts, but not all desert cultures are identical.",
                ]}
                value={formState.synthesis.monoCultureCheck}
                onChange={(value) => updateSynthesis("monoCultureCheck", value)}
              />

              <QuestionSection
                id="synthesis-vestigial"
                label="4. The Vestigial Question"
                prompts={[
                  "What element persists from their past that no longer makes sense?",
                  "(This often creates the most interesting conflicts.)",
                ]}
                value={formState.synthesis.vestigialQuestion}
                onChange={(value) => updateSynthesis("vestigialQuestion", value)}
              />

              <QuestionSection
                id="synthesis-sowhat"
                label='5. The "So What?" Test'
                prompts={[
                  "Would removing this planetary parameter fundamentally change everything you've built?",
                  "If not, it's not actually core to your world.",
                ]}
                value={formState.synthesis.soWhatTest}
                onChange={(value) => updateSynthesis("soWhatTest", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Synthesis */}
          <CollapsibleSection
            id="section-synthesis"
            title="Synthesis"
            subtitle="Capture your key discoveries"
          >
            <div className="space-y-6">
              <div>
                <Label htmlFor="surprising" className="text-sm font-medium">
                  Most surprising consequence you discovered:
                </Label>
                <Textarea
                  id="surprising"
                  value={formState.synthesis.surprisingConsequence}
                  onChange={(e) =>
                    updateSynthesis("surprisingConsequence", e.target.value)
                  }
                  placeholder="What unexpected connection emerged from working through the cascade?"
                  className="mt-2 min-h-[80px] bg-background/50"
                />
              </div>

              <div>
                <Label htmlFor="gap" className="text-sm font-medium">
                  Biggest gap or unresolved tension:
                </Label>
                <Textarea
                  id="gap"
                  value={formState.synthesis.biggestGap}
                  onChange={(e) =>
                    updateSynthesis("biggestGap", e.target.value)
                  }
                  placeholder="What needs more development or contains productive contradictions?"
                  className="mt-2 min-h-[80px] bg-background/50"
                />
              </div>

              <div>
                <Label htmlFor="story" className="text-sm font-medium">
                  Story potential this creates:
                </Label>
                <Textarea
                  id="story"
                  value={formState.synthesis.storyPotential}
                  onChange={(e) =>
                    updateSynthesis("storyPotential", e.target.value)
                  }
                  placeholder="What conflicts, characters, or narratives does this world naturally generate?"
                  className="mt-2 min-h-[80px] bg-background/50"
                />
              </div>
            </div>
          </CollapsibleSection>
          </div>

          {/* Sticky Sidebar - visible when parameters are selected */}
          {getSelectedParametersForSidebar().length > 0 && (
            <div className="hidden lg:block">
              <SelectedParametersSidebar
                parameters={getSelectedParametersForSidebar()}
              />
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <ToolActionBar
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExport}
          className="mt-8"
        />

        {/* Final Reminder */}
        <GlassPanel className="p-6 mt-8 text-center">
          <p className="text-muted-foreground italic">
            The most believable worlds aren't the most complex—they're the most
            internally consistent. Every element should cascade logically from
            your core environmental choice.
          </p>
        </GlassPanel>

        {/* Section Navigation */}
        <SectionNavigation sections={SECTIONS} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>

      {/* World Selection Dialog */}
      <WorldSelectDialog
        open={showWorldSelectDialog}
        onOpenChange={setShowWorldSelectDialog}
        onSave={handleWorldSelection}
        isLoading={isSaving}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Environmental Chain Reaction"
        worldName={worldName || undefined}
        formState={formState}
        summaryTemplate={<ECRSummaryTemplate formState={formState} worldName={worldName || undefined} />}
        fullTemplate={<ECRFullReportTemplate formState={formState} worldName={worldName || undefined} />}
        defaultFilename="environmental-chain-reaction"
      />
    </div>
  );
};

export default EnvironmentalChainReaction;
