import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, Info, ExternalLink, Printer, Cloud, CloudOff, Atom } from "lucide-react";
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
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection } from "@/components/tools/KeyChoicesSidebar";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
import { PropulsionSummaryTemplate, PropulsionFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-propulsion", title: "1. Define Propulsion" },
  { id: "section-economic", title: "2. Economic" },
  { id: "section-political", title: "3. Political" },
  { id: "section-military", title: "4. Military" },
  { id: "section-social", title: "5. Social" },
  { id: "section-psychological", title: "6. Psychological" },
  { id: "section-integration", title: "7. Integration" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Final Synthesis" },
];

// Types for form state
interface PropulsionSystem {
  type: string;
  customType: string;
  maxVelocity: string;
  acceleration: string;
  energySource: string;
  communicationSpeed: string;
  costComparison: string;
}

interface TravelBenchmark {
  earthMars: string;
  earthJupiter: string;
  earthNeptune: string;
  solAlphaCentauri: string;
  solProximaB: string;
  customRoute: string;
  customRouteTime: string;
}

interface EconomicCosts {
  fuelEnergy: string;
  construction: string;
  maintenance: string;
  crewCapacity: string;
  cargoCapacity: string;
  serviceLife: string;
}

interface DomainResponses {
  [key: string]: string | string[];
}

interface FormState {
  system: PropulsionSystem;
  benchmarks: TravelBenchmark;
  costs: EconomicCosts;
  economic: DomainResponses;
  political: DomainResponses;
  military: DomainResponses;
  social: DomainResponses;
  psychological: DomainResponses;
  synthesis: {
    consistencyChecks: string[];
    inconsistency: string;
    unexpectedConsequences: string;
    economicConflicts: string;
    politicalConflicts: string;
    socialConflicts: string;
    propulsionThesis: string;
    mostImportant: string;
    storyConflict: string;
  };
}

const initialFormState: FormState = {
  system: {
    type: "",
    customType: "",
    maxVelocity: "",
    acceleration: "",
    energySource: "",
    communicationSpeed: "",
    costComparison: "",
  },
  benchmarks: {
    earthMars: "",
    earthJupiter: "",
    earthNeptune: "",
    solAlphaCentauri: "",
    solProximaB: "",
    customRoute: "",
    customRouteTime: "",
  },
  costs: {
    fuelEnergy: "",
    construction: "",
    maintenance: "",
    crewCapacity: "",
    cargoCapacity: "",
    serviceLife: "",
  },
  economic: {},
  political: {},
  military: {},
  social: {},
  psychological: {},
  synthesis: {
    consistencyChecks: [],
    inconsistency: "",
    unexpectedConsequences: "",
    economicConflicts: "",
    politicalConflicts: "",
    socialConflicts: "",
    propulsionThesis: "",
    mostImportant: "",
    storyConflict: "",
  },
};

const PROPULSION_TYPES = [
  { value: "chemical", label: "Chemical rockets", description: "Current technology" },
  { value: "ion", label: "Ion drives", description: "Proven, slow acceleration" },
  { value: "nuclear-thermal", label: "Nuclear thermal", description: "High thrust, tested 1960s-70s" },
  { value: "nuclear-pulse", label: "Nuclear pulse", description: "Orion-style, requires bombs" },
  { value: "fusion", label: "Fusion drive", description: "Theoretical, high efficiency" },
  { value: "antimatter", label: "Antimatter", description: "Theoretical, enormous energy" },
  { value: "solar-sail", label: "Solar/laser sails", description: "Continuous low thrust" },
  { value: "bussard", label: "Bussard ramjet", description: "Theoretical hydrogen scoop" },
  { value: "alcubierre", label: "Alcubierre warp drive", description: "Speculative FTL" },
  { value: "hyperspace", label: "Hyperspace/jump drive", description: "Speculative FTL" },
  { value: "wormhole", label: "Wormholes/portals", description: "Speculative instant travel" },
  { value: "generation", label: "Generation ships", description: "Subluminal, multi-century" },
  { value: "other", label: "Other", description: "Custom propulsion system" },
];

const ENERGY_SOURCES = [
  { value: "chemical", label: "Chemical combustion" },
  { value: "fission", label: "Nuclear fission" },
  { value: "fusion", label: "Nuclear fusion" },
  { value: "antimatter", label: "Matter-antimatter annihilation" },
  { value: "zero-point", label: "Zero-point energy" },
  { value: "other", label: "Other" },
];

const COST_COMPARISONS = [
  { value: "cheap", label: "Cheaper than air travel", description: "Democratized" },
  { value: "air", label: "Like air travel", description: "Middle class accessible" },
  { value: "private-jet", label: "Like private jet", description: "Wealthy only" },
  { value: "government", label: "Like space program", description: "Governments/corporations only" },
  { value: "ruinous", label: "Ruinously expensive", description: "Rare, desperate journeys" },
];

const ACCESS_STRATIFICATIONS = [
  { id: "universal", label: "Universal access", description: "Everyone can afford travel (cheap/subsidized)" },
  { id: "middle", label: "Middle class & up", description: "Like modern air travel—affordable but significant expense" },
  { id: "elite", label: "Elite only", description: "Wealthy individuals, corporations, governments" },
  { id: "state", label: "State monopoly", description: "Only government-authorized travel" },
  { id: "corporate", label: "Corporate control", description: "Companies own all ships, control access" },
];

const TRADE_VIABILITY = [
  { id: "high-value", label: "High-value, low-mass goods only", description: "Data, rare elements, luxury items" },
  { id: "specialized", label: "Specialized products unavailable locally", description: "Unique biosphere products" },
  { id: "bulk", label: "Bulk commodities viable", description: "Food, raw materials" },
  { id: "people", label: "People as cargo", description: "Labor migration, colonists" },
  { id: "information", label: "Information only", description: "If FTL communication exists" },
];

const GOVERNANCE_STRUCTURES = [
  { id: "empire", label: "Centralized Empire", description: "Fast travel/communication enables tight control", example: "Star Wars (hyperspace), Star Trek (warp drive)" },
  { id: "feudal", label: "Feudal/Autonomous Systems", description: "Slow travel creates independent fiefdoms", example: "Foundation series, Dune's Great Houses" },
  { id: "corporate", label: "Corporate States", description: "Expensive travel means corporations control access", example: "Alien franchise (Weyland-Yutani), The Expanse" },
  { id: "confederation", label: "Loose Confederation", description: "Worlds coordinate but remain independent", example: "Firefly's Alliance, Ancillary Justice" },
  { id: "isolated", label: "Isolated Settlements", description: "No effective governance beyond local", example: "Revelation Space, Aurora" },
];

const MILITARY_STRUCTURES = [
  { id: "large-fleets", label: "Large fleets", description: "If travel is fast/cheap" },
  { id: "system-defense", label: "System defense forces", description: "If travel is slow/expensive" },
  { id: "q-ships", label: "Q-ships/raiders", description: "If identification is difficult" },
  { id: "privateers", label: "Privateers/mercenaries", description: "If state control is weak" },
];

const EXTERNAL_RESOURCES = [
  { name: "Atomic Rockets", url: "http://www.projectrho.com/public_html/rocket/", description: "Comprehensive propulsion encyclopedia" },
  { name: "Relativistic Travel Calculator", url: "https://www.omnicalculator.com/physics/time-dilation", description: "Time dilation effects" },
  { name: "NASA Technology Roadmaps", url: "https://www.nasa.gov/general/nasa-technology-taxonomy/", description: "Current and near-future propulsion" },
];

const SF_EXAMPLES = [
  {
    title: "THE EXPANSE - Epstein Drive (Efficient Fusion)",
    data: [
      { domain: "Economics", consequence: "Allows Belt mining; Ice haulers viable; Middle class can afford travel" },
      { domain: "Politics", consequence: "Three-way power balance (Earth/Mars/Belt); Regional autonomy with central tension" },
      { domain: "Military", consequence: "Ships = missiles; Constant burn & flip maneuver; Stealth is critical" },
      { domain: "Social", consequence: 'Belter culture distinct from planets; "Gravity wells" vs. spacers; Long-term health effects' },
      { domain: "Psychology", consequence: 'Direction is relative; "Down" is thrust direction; Belters distrust grounders' },
    ],
    insight: "Architecture follows thrust—ships built like towers with decks perpendicular to drive",
  },
  {
    title: "DUNE - Holtzman Effect (Instantaneous FTL)",
    data: [
      { domain: "Economics", consequence: "Only spice-enabled Navigators can pilot safely = total spice dependency" },
      { domain: "Politics", consequence: "Spacing Guild controls all travel = political kingmaker; Centralized empire possible despite vast distances" },
      { domain: "Military", consequence: "No-ships develop to counter prescience; Atomics exist but are taboo; Personal shields change melee combat" },
      { domain: "Social", consequence: "Aristocratic houses travel freely; Common people rarely leave planets; Cultural homogeneity across empire" },
      { domain: "Psychology", consequence: '"Distance" becomes political rather than physical; Fear of being trapped on-planet; Navigator mutation accepted' },
    ],
    insight: "FTL doesn't create freedom—it creates monopoly. Whoever controls travel controls everything.",
  },
  {
    title: "REVELATION SPACE - Lighthugger Ships (Relativistic, No FTL)",
    data: [
      { domain: "Economics", consequence: "Only ultra-rich or desperate travel; Self-contained ship economies; Information is primary trade good" },
      { domain: "Politics", consequence: "Complete planetary independence; No empires possible; Each system isolated" },
      { domain: "Military", consequence: "Weapons deployment requires decades of planning; System defense only; No star-spanning wars" },
      { domain: "Social", consequence: 'Ship crews experience years while centuries pass outside; "Ultras" become separate culture/species; Family bonds impossible across systems' },
      { domain: "Psychology", consequence: "Time as weapon and barrier; Present = moving target; Spacers psychologically alien to grounders" },
    ],
    insight: "Time dilation creates permanent cultural divide—spacers and grounders are effectively different species.",
  },
  {
    title: "HYPERION CANTOS - Hawking Drive + Farcaster Network",
    data: [
      { domain: "Economics", consequence: "Farcasters enable instant portals = centralized economy; Hawking drives for non-network travel = slow/expensive backup" },
      { domain: "Politics", consequence: "Hegemony controls farcasters = absolute power; Lose network access = isolation; Outcasts trapped on slow ships" },
      { domain: "Military", consequence: "Farcaster warfare = instant troop deployment; Control portals = control everything; Severing worlds = ultimate punishment" },
      { domain: "Social", consequence: "Elite live in multi-world houses (breakfast on Renaissance V, dinner on Tau Ceti); Working class stuck on single worlds; Massive inequality" },
      { domain: "Psychology", consequence: '"Place" becomes meaningless for elite; Omnipresence as status symbol; Disconnected life as poverty marker' },
    ],
    insight: "Two-tier travel system creates two-tier society. The story explores what happens when the network fails.",
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
    {prompts.length > 0 && (
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

const TOOL_TYPE = "propulsion-consequences-map";

const PropulsionConsequencesMap = () => {
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
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

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
      const saved = localStorage.getItem("pcm-worksheet");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormState(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId, worksheetId]);

  // Generate key choices for sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const countFilledDomain = (domain: Record<string, string>) =>
      Object.values(domain).filter((v) => v && v.trim()).length;

    return [
      {
        id: "propulsion",
        title: "1. Propulsion",
        choices: [
          { label: "Type", value: formState.system.type },
          { label: "Range", value: formState.system.interstellarCapability ? "Interstellar" : formState.benchmarks.solarSystemTravel ? "System-wide" : undefined },
          { label: "Speed", value: formState.system.topSpeed },
        ],
      },
      {
        id: "economic",
        title: "2. Economic",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.economic) > 0 ? `${countFilledDomain(formState.economic)} filled` : undefined },
        ],
      },
      {
        id: "political",
        title: "3. Political",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.political) > 0 ? `${countFilledDomain(formState.political)} filled` : undefined },
        ],
      },
      {
        id: "military",
        title: "4. Military",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.military) > 0 ? `${countFilledDomain(formState.military)} filled` : undefined },
        ],
      },
      {
        id: "social",
        title: "5. Social",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.social) > 0 ? `${countFilledDomain(formState.social)} filled` : undefined },
        ],
      },
      {
        id: "psychological",
        title: "6. Psychological",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.psychological) > 0 ? `${countFilledDomain(formState.psychological)} filled` : undefined },
        ],
      },
      {
        id: "integration",
        title: "7. Integration",
        choices: [
          { label: "Defining Consequence", value: formState.integration.definingConsequence ? "Defined" : undefined },
        ],
      },
    ];
  }, [formState]);

  const updateSystem = (field: keyof PropulsionSystem, value: string) => {
    setFormState((prev) => ({
      ...prev,
      system: { ...prev.system, [field]: value },
    }));
  };

  const updateBenchmarks = (field: keyof TravelBenchmark, value: string) => {
    setFormState((prev) => ({
      ...prev,
      benchmarks: { ...prev.benchmarks, [field]: value },
    }));
  };

  const updateCosts = (field: keyof EconomicCosts, value: string) => {
    setFormState((prev) => ({
      ...prev,
      costs: { ...prev.costs, [field]: value },
    }));
  };

  const updateDomain = (
    domain: "economic" | "political" | "military" | "social" | "psychological",
    field: string,
    value: string | string[]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [domain]: { ...prev[domain], [field]: value },
    }));
  };

  const updateSynthesis = (field: keyof FormState["synthesis"], value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem("pcm-worksheet", JSON.stringify(formState));

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

  return (
    <div className="min-h-screen bg-background">
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
              <Badge className="mb-2">Tool 3</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Propulsion Consequences Map
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Trace how your propulsion system shapes economics, politics, social structures, and psychology.
              </p>
              {currentWorksheetTitle && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{currentWorksheetTitle}</span>
                </div>
              )}
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
            Propulsion as Worldbuilding
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Your propulsion system isn't just a way to move the plot between locations—it fundamentally shapes economics, politics, relationships, and psychology."
          </blockquote>
          <p className="text-muted-foreground mb-4">
            Fast travel creates empires; slow travel creates autonomous colonies. Cheap travel democratizes; expensive travel stratifies.
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <strong className="text-foreground">The Cascading Principle for Propulsion:</strong>
            <p className="mt-1">Travel speed → Economics → Politics → Social structures → Psychology → Culture</p>
          </div>
          
          {/* External Resources */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Essential Resources</h4>
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

        {/* Form Sections */}
        <div className="space-y-4">
          {/* Section 1: Define Propulsion System */}
          <CollapsibleSection
            id="section-propulsion"
            title="Define Your Propulsion System"
            subtitle="What technology moves your ships?"
            levelNumber={1}
            defaultOpen={true}
          >
            <div className="space-y-6">
              {/* Propulsion Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Propulsion Type</Label>
                <RadioGroup
                  value={formState.system.type}
                  onValueChange={(value) => updateSystem("type", value)}
                  className="grid gap-2 md:grid-cols-2"
                >
                  {PROPULSION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={type.value} id={type.value} className="mt-0.5" />
                      <Label htmlFor={type.value} className="cursor-pointer flex-1">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">— {type.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {formState.system.type === "other" && (
                  <Input
                    placeholder="Describe your custom propulsion system..."
                    value={formState.system.customType}
                    onChange={(e) => updateSystem("customType", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Performance Specifications */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxVelocity">Maximum Velocity (% of light speed)</Label>
                  <Input
                    id="maxVelocity"
                    placeholder="e.g., 10% c for fusion, 99.99% c for relativistic"
                    value={formState.system.maxVelocity}
                    onChange={(e) => updateSystem("maxVelocity", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Chemical: &lt;0.001% c; Fusion: ~10% c; Theoretical limit: 99.99% c</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acceleration">Acceleration (g)</Label>
                  <Input
                    id="acceleration"
                    placeholder="e.g., 1g sustained, 0.001g for ion"
                    value={formState.system.acceleration}
                    onChange={(e) => updateSystem("acceleration", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Chemical: ~3g; Ion: 0.001g; Epstein (Expanse): ~5g sustained</p>
                </div>
              </div>

              {/* Energy Source */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Energy Source</Label>
                <RadioGroup
                  value={formState.system.energySource}
                  onValueChange={(value) => updateSystem("energySource", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  {ENERGY_SOURCES.map((source) => (
                    <div key={source.value} className="flex items-center gap-2">
                      <RadioGroupItem value={source.value} id={`energy-${source.value}`} />
                      <Label htmlFor={`energy-${source.value}`} className="cursor-pointer">{source.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Travel Time Benchmarks */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Travel Time Benchmarks</Label>
                <p className="text-xs text-muted-foreground">Calculate journey times for your system</p>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Earth to Mars (0.5-2.5 AU)</span>
                    <Input
                      placeholder="e.g., 2 weeks, 6 months"
                      value={formState.benchmarks.earthMars}
                      onChange={(e) => updateBenchmarks("earthMars", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Earth to Jupiter (4-6 AU)</span>
                    <Input
                      placeholder="e.g., 3 months"
                      value={formState.benchmarks.earthJupiter}
                      onChange={(e) => updateBenchmarks("earthJupiter", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Earth to Neptune (~30 AU)</span>
                    <Input
                      placeholder="e.g., 1 year"
                      value={formState.benchmarks.earthNeptune}
                      onChange={(e) => updateBenchmarks("earthNeptune", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Sol to Alpha Centauri (4.37 ly)</span>
                    <Input
                      placeholder="e.g., 43 years at 10% c"
                      value={formState.benchmarks.solAlphaCentauri}
                      onChange={(e) => updateBenchmarks("solAlphaCentauri", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Sol to Proxima b (4.24 ly)</span>
                    <Input
                      placeholder="e.g., instant via jump drive"
                      value={formState.benchmarks.solProximaB}
                      onChange={(e) => updateBenchmarks("solProximaB", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Input
                      placeholder="Custom route (e.g., Between your worlds)"
                      value={formState.benchmarks.customRoute}
                      onChange={(e) => updateBenchmarks("customRoute", e.target.value)}
                    />
                    <Input
                      placeholder="Travel time"
                      value={formState.benchmarks.customRouteTime}
                      onChange={(e) => updateBenchmarks("customRouteTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Communication Lag */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Communication Speed</Label>
                <RadioGroup
                  value={formState.system.communicationSpeed}
                  onValueChange={(value) => updateSystem("communicationSpeed", value)}
                  className="grid gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ftl" id="comm-ftl" />
                    <Label htmlFor="comm-ftl">Faster than ships (FTL communication)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="same" id="comm-same" />
                    <Label htmlFor="comm-same">Same speed as ships</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="slower" id="comm-slower" />
                    <Label htmlFor="comm-slower">Slower than ships (ships carry messages)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Economic Parameters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Economic Costs</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="fuelEnergy" className="text-xs">Fuel/Energy Cost</Label>
                    <Input
                      id="fuelEnergy"
                      placeholder="e.g., Antimatter: astronomical"
                      value={formState.costs.fuelEnergy}
                      onChange={(e) => updateCosts("fuelEnergy", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="construction" className="text-xs">Construction Cost (per ship)</Label>
                    <Input
                      id="construction"
                      placeholder="e.g., GDP of small nation"
                      value={formState.costs.construction}
                      onChange={(e) => updateCosts("construction", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="crewCapacity" className="text-xs">Crew/Passenger Capacity</Label>
                    <Input
                      id="crewCapacity"
                      placeholder="e.g., 50 crew, 200 passengers"
                      value={formState.costs.crewCapacity}
                      onChange={(e) => updateCosts("crewCapacity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cargoCapacity" className="text-xs">Cargo Capacity</Label>
                    <Input
                      id="cargoCapacity"
                      placeholder="e.g., 10,000 tons"
                      value={formState.costs.cargoCapacity}
                      onChange={(e) => updateCosts("cargoCapacity", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cost Comparison</Label>
                <RadioGroup
                  value={formState.system.costComparison}
                  onValueChange={(value) => updateSystem("costComparison", value)}
                  className="grid gap-2 md:grid-cols-2"
                >
                  {COST_COMPARISONS.map((comp) => (
                    <div key={comp.value} className="flex items-start gap-2 p-2 rounded border border-border">
                      <RadioGroupItem value={comp.value} id={`cost-${comp.value}`} className="mt-0.5" />
                      <Label htmlFor={`cost-${comp.value}`} className="cursor-pointer">
                        <span className="font-medium">{comp.label}</span>
                        <span className="text-muted-foreground ml-1 text-xs">({comp.description})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CollapsibleSection>

          {/* Domain 1: Economic Implications */}
          <CollapsibleSection
            id="section-economic"
            title="Domain 1: Economic Implications"
            subtitle="Who can afford this travel? What's worth shipping?"
            levelNumber={2}
            thinkLike="an economist: Price determines who moves, what moves, and why."
          >
            <div className="space-y-6">
              {/* Access Stratification */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Access Stratification</Label>
                <div className="grid gap-2">
                  {ACCESS_STRATIFICATIONS.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`access-${option.id}`}
                        checked={(formState.economic.accessStratification as string[] || []).includes(option.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.economic.accessStratification as string[]) || [];
                          updateDomain(
                            "economic",
                            "accessStratification",
                            checked
                              ? [...current, option.id]
                              : current.filter((id) => id !== option.id)
                          );
                        }}
                      />
                      <Label htmlFor={`access-${option.id}`} className="cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">— {option.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="economic-immediate"
                label="Immediate Consequence"
                prompts={["What immediately results from this access pattern?"]}
                value={(formState.economic.immediateConsequence as string) || ""}
                onChange={(value) => updateDomain("economic", "immediateConsequence", value)}
              />

              {/* Trade Viability */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Trade Viability</Label>
                <p className="text-xs text-muted-foreground">What's worth shipping given travel costs and time?</p>
                <div className="grid gap-2">
                  {TRADE_VIABILITY.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`trade-${option.id}`}
                        checked={(formState.economic.tradeViability as string[] || []).includes(option.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.economic.tradeViability as string[]) || [];
                          updateDomain(
                            "economic",
                            "tradeViability",
                            checked
                              ? [...current, option.id]
                              : current.filter((id) => id !== option.id)
                          );
                        }}
                      />
                      <Label htmlFor={`trade-${option.id}`} className="cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">— {option.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="economic-trade-goods"
                label="Primary Interstellar Trade Goods"
                prompts={["What specific goods are worth the cost of interstellar shipping in your setting?"]}
                example="In The Expanse, ice from Saturn's rings is valuable for water. In Dune, spice is the only commodity worth interstellar shipping costs."
                value={(formState.economic.tradeGoods as string) || ""}
                onChange={(value) => updateDomain("economic", "tradeGoods", value)}
              />

              <QuestionSection
                id="economic-wealth"
                label="Wealth Disparities Created"
                prompts={[
                  "If travel is expensive: Trapped populations? Elite mobility? Spacer vs. grounder split?",
                  "If travel is cheap: Resource competition? Brain drain? Cultural homogenization?",
                ]}
                value={(formState.economic.wealthDisparities as string) || ""}
                onChange={(value) => updateDomain("economic", "wealthDisparities", value)}
              />

              <QuestionSection
                id="economic-labor"
                label="Labor & Migration Patterns"
                prompts={[
                  "Job markets: How do travel costs affect employment?",
                  "Skilled labor migration: Where do experts go?",
                  "Colonization economics: Who can afford to settle new worlds?",
                ]}
                value={(formState.economic.laborPatterns as string) || ""}
                onChange={(value) => updateDomain("economic", "laborPatterns", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 2: Political & Governance */}
          <CollapsibleSection
            id="section-political"
            title="Domain 2: Political & Governance"
            subtitle="How does travel time affect control?"
            levelNumber={3}
            thinkLike="a political scientist: Communication lag and travel time determine possible governance structures."
          >
            <div className="space-y-6">
              <QuestionSection
                id="political-transit"
                label="Message/Command Transit Time"
                prompts={["How long to send orders to distant colonies? Days, months, years?"]}
                value={(formState.political.transitTime as string) || ""}
                onChange={(value) => updateDomain("political", "transitTime", value)}
              />

              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="text-sm font-medium">What This Means for Governance:</h4>
                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="font-medium text-primary">If transit time &lt;1 week:</span>
                    <p className="text-muted-foreground">Centralized empire possible, real-time oversight, unified legal systems, fast military response</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">If transit time 1 month - 1 year:</span>
                    <p className="text-muted-foreground">Regional autonomy necessary, colonial governors with broad authority, rebellions can establish before response</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">If transit time &gt;1 year:</span>
                    <p className="text-muted-foreground">Effective independence, governance like letters to medieval lords, cultural drift accelerates</p>
                  </div>
                </div>
              </div>

              <QuestionSection
                id="political-implications"
                label="Your World's Implications"
                prompts={["Based on your transit times, what governance is actually possible?"]}
                value={(formState.political.implications as string) || ""}
                onChange={(value) => updateDomain("political", "implications", value)}
              />

              {/* Governance Structures */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Governance Structures</Label>
                <p className="text-xs text-muted-foreground">Select the model(s) that fit your propulsion parameters</p>
                <div className="grid gap-2">
                  {GOVERNANCE_STRUCTURES.map((structure) => (
                    <div key={structure.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`gov-${structure.id}`}
                        checked={(formState.political.governanceStructures as string[] || []).includes(structure.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.political.governanceStructures as string[]) || [];
                          updateDomain(
                            "political",
                            "governanceStructures",
                            checked
                              ? [...current, structure.id]
                              : current.filter((id) => id !== structure.id)
                          );
                        }}
                      />
                      <Label htmlFor={`gov-${structure.id}`} className="cursor-pointer flex-1">
                        <span className="font-medium">{structure.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">— {structure.description}</span>
                        <p className="text-xs text-primary mt-1">Example: {structure.example}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="political-enforcement"
                label="How Is This Structure Enforced/Maintained?"
                prompts={["What mechanisms keep this political structure stable?"]}
                value={(formState.political.enforcement as string) || ""}
                onChange={(value) => updateDomain("political", "enforcement", value)}
              />

              <QuestionSection
                id="political-tensions"
                label="Political Tensions Created"
                prompts={[
                  "Core vs. Periphery conflicts?",
                  "Independence movements?",
                  "Resource control disputes?",
                ]}
                value={(formState.political.tensions as string) || ""}
                onChange={(value) => updateDomain("political", "tensions", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 3: Military & Conflict */}
          <CollapsibleSection
            id="section-military"
            title="Domain 3: Military & Conflict"
            subtitle="Combat implications of your propulsion"
            levelNumber={4}
            thinkLike="a military strategist: Propulsion determines tactics, strategy, and what's even worth fighting over."
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Response Time to Threats</Label>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Respond to distress call (same system)</span>
                    <Input
                      placeholder="e.g., hours, days"
                      value={(formState.military.responseDistress as string) || ""}
                      onChange={(e) => updateDomain("military", "responseDistress", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Respond to invasion (neighboring system)</span>
                    <Input
                      placeholder="e.g., weeks, months"
                      value={(formState.military.responseInvasion as string) || ""}
                      onChange={(e) => updateDomain("military", "responseInvasion", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Project force across territory</span>
                    <Input
                      placeholder="e.g., months, years"
                      value={(formState.military.projectForce as string) || ""}
                      onChange={(e) => updateDomain("military", "projectForce", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Retreat/escape pursuit</span>
                    <Input
                      placeholder="e.g., depends on drive efficiency"
                      value={(formState.military.retreatEscape as string) || ""}
                      onChange={(e) => updateDomain("military", "retreatEscape", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <QuestionSection
                id="military-strategic"
                label="Strategic Implications"
                prompts={["What do these response times mean for military doctrine?"]}
                value={(formState.military.strategicImplications as string) || ""}
                onChange={(value) => updateDomain("military", "strategicImplications", value)}
              />

              <QuestionSection
                id="military-drive-weapon"
                label="Drive as Weapon"
                prompts={[
                  "Can the drive be used offensively? (Epstein drive in The Expanse = kinetic weapon)",
                  "Engagement ranges: Does slow acceleration mean long-range missile combat?",
                  "Escape/pursuit dynamics: Can ships outrun weapons? Can attackers catch fleeing targets?",
                ]}
                value={(formState.military.driveAsWeapon as string) || ""}
                onChange={(value) => updateDomain("military", "driveAsWeapon", value)}
              />

              <QuestionSection
                id="military-offensive"
                label="Offensive Capabilities"
                prompts={["What can your military do well given propulsion constraints?"]}
                value={(formState.military.offensive as string) || ""}
                onChange={(value) => updateDomain("military", "offensive", value)}
              />

              <QuestionSection
                id="military-defensive"
                label="Defensive Vulnerabilities"
                prompts={["What weaknesses does your propulsion system create?"]}
                value={(formState.military.defensive as string) || ""}
                onChange={(value) => updateDomain("military", "defensive", value)}
              />

              <QuestionSection
                id="military-chokepoints"
                label="Chokepoints & Strategic Locations"
                prompts={["What locations become militarily critical given your propulsion?"]}
                value={(formState.military.chokepoints as string) || ""}
                onChange={(value) => updateDomain("military", "chokepoints", value)}
              />

              {/* Military Organization */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Military Organization</Label>
                <p className="text-xs text-muted-foreground">What military structures fit your propulsion?</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {MILITARY_STRUCTURES.map((structure) => (
                    <div key={structure.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`mil-${structure.id}`}
                        checked={(formState.military.organization as string[] || []).includes(structure.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.military.organization as string[]) || [];
                          updateDomain(
                            "military",
                            "organization",
                            checked
                              ? [...current, structure.id]
                              : current.filter((id) => id !== structure.id)
                          );
                        }}
                      />
                      <Label htmlFor={`mil-${structure.id}`} className="cursor-pointer">
                        <span className="font-medium">{structure.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">— {structure.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="military-structure"
                label="Your Military Structure"
                prompts={["Describe the military organization that emerges from your propulsion constraints"]}
                value={(formState.military.structure as string) || ""}
                onChange={(value) => updateDomain("military", "structure", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 4: Social & Family Structures */}
          <CollapsibleSection
            id="section-social"
            title="Domain 4: Social & Family Structures"
            subtitle="How does travel time affect human relationships?"
            levelNumber={5}
            thinkLike="a sociologist: Long absences and relativity reshape families, careers, and social bonds."
          >
            <div className="space-y-6">
              <QuestionSection
                id="social-romantic"
                label="Romantic Relationships"
                prompts={[
                  "Long-distance relationships across systems",
                  '"Spacer" vs. "grounder" relationship difficulties',
                  "Crew relationships and regulations",
                ]}
                value={(formState.social.romantic as string) || ""}
                onChange={(value) => updateDomain("social", "romantic", value)}
              />

              <QuestionSection
                id="social-family"
                label="Family Structures"
                prompts={[
                  "Families separated by light-years for careers",
                  "Children born during multi-year journeys",
                  "Generational disconnection",
                ]}
                value={(formState.social.family as string) || ""}
                onChange={(value) => updateDomain("social", "family", value)}
              />

              <QuestionSection
                id="social-career"
                label="Career Implications"
                prompts={[
                  "Career mobility: Can you change jobs across systems?",
                  "Expertise concentration: Do experts travel to problems, or problems to experts?",
                  "Training/education: Study off-world and return, or local-only?",
                ]}
                value={(formState.social.career as string) || ""}
                onChange={(value) => updateDomain("social", "career", value)}
              />

              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-accent" />
                  Time Dilation Effects (If Applicable)
                </h4>
                <p className="text-xs text-muted-foreground">
                  If traveling at relativistic speeds, travelers experience less time than stationary observers.
                </p>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium text-accent">For travelers:</span> Outlive friends/family, return to changed societies, professional obsolescence</p>
                  <p><span className="font-medium text-accent">For stay-at-homes:</span> Loved ones age slowly, "temporal immigrants" from past returning</p>
                  <p className="text-xs text-muted-foreground italic">Example: Joe Haldeman's The Forever War—soldiers fight centuries-long war, experience only years</p>
                </div>
              </div>

              <QuestionSection
                id="social-dilation"
                label="Your World's Time Dilation Consequences"
                prompts={["If applicable, how does time dilation affect society?"]}
                value={(formState.social.timeDilation as string) || ""}
                onChange={(value) => updateDomain("social", "timeDilation", value)}
              />

              <QuestionSection
                id="social-drift"
                label="Cultural Drift & Isolation"
                prompts={[
                  "If travel is rare/slow: Languages diverge, cultural practices evolve independently, 'founder effects' amplified",
                  "If travel is common/fast: Cultural homogenization, shared media/trends, less diversity",
                ]}
                value={(formState.social.culturalDrift as string) || ""}
                onChange={(value) => updateDomain("social", "culturalDrift", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 5: Psychological Concepts */}
          <CollapsibleSection
            id="section-psychological"
            title="Domain 5: Psychological Concepts"
            subtitle="How does your propulsion change fundamental concepts?"
            levelNumber={6}
            thinkLike="a psychologist: Travel systems reshape how people conceptualize reality."
          >
            <div className="space-y-6">
              <QuestionSection
                id="psych-distance"
                label='Concept of "Distance"'
                prompts={[
                  "What feels 'close'? What feels 'impossibly far'?",
                  "How do they describe distance? Time ('three months away') or space ('40 light-years')?",
                ]}
                example="In The Expanse, everything is measured in travel time and fuel (delta-v), not kilometers."
                value={(formState.psychological.distance as string) || ""}
                onChange={(value) => updateDomain("psychological", "distance", value)}
              />

              <QuestionSection
                id="psych-time"
                label='Concept of "Time"'
                prompts={[
                  "Relativistic travel: Subjective vs. objective time becomes meaningful",
                  "Cryosleep: Experienced time vs. calendar time ('I'm 30 but born 200 years ago')",
                  "FTL with no dilation: Time remains universal, simultaneity preserved",
                ]}
                value={(formState.psychological.time as string) || ""}
                onChange={(value) => updateDomain("psychological", "time", value)}
              />

              <QuestionSection
                id="psych-home"
                label='Concept of "Home"'
                prompts={[
                  "If travel is easy: Multiple homes possible, fluid belonging, cosmopolitan identity",
                  "If travel is difficult: 'Home' is permanent, strong planetary identity, fear of displacement",
                  "If relativistic: 'Home' is a time as much as a place, can never truly return",
                ]}
                value={(formState.psychological.home as string) || ""}
                onChange={(value) => updateDomain("psychological", "home", value)}
              />

              <QuestionSection
                id="psych-other"
                label='Concept of "Foreign" and "Other"'
                prompts={[
                  "Frequent contact: Cosmopolitan tolerance, 'we're all spacers together', less xenophobia",
                  "Rare contact: Strong in-group/out-group boundaries, colony loyalty trumps species loyalty, suspicion of outsiders",
                ]}
                value={(formState.psychological.other as string) || ""}
                onChange={(value) => updateDomain("psychological", "other", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Integration & Story Potential */}
          <CollapsibleSection
            id="section-integration"
            title="Integration & Story Potential"
            subtitle="Bringing it all together"
            levelNumber={7}
          >
            <div className="space-y-6">
              {/* Consistency Check */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Consistency Check</Label>
                <p className="text-xs text-muted-foreground">Review all five domains. Do they fit together logically?</p>
                <div className="grid gap-2">
                  {[
                    { id: "economics", label: "Economics → Does your political structure match travel costs?" },
                    { id: "politics", label: "Politics → Does your military match communication lag?" },
                    { id: "military", label: "Military → Do your tactics match drive capabilities?" },
                    { id: "social", label: "Social → Do family structures match travel times?" },
                    { id: "psychology", label: "Psychology → Do cultural concepts match travel experience?" },
                  ].map((check) => (
                    <div key={check.id} className="flex items-center gap-3 p-2 rounded border border-border">
                      <Checkbox
                        id={`check-${check.id}`}
                        checked={formState.synthesis.consistencyChecks.includes(check.id)}
                        onCheckedChange={(checked) => {
                          updateSynthesis(
                            "consistencyChecks",
                            checked
                              ? [...formState.synthesis.consistencyChecks, check.id]
                              : formState.synthesis.consistencyChecks.filter((id) => id !== check.id)
                          );
                        }}
                      />
                      <Label htmlFor={`check-${check.id}`} className="cursor-pointer text-sm">
                        {check.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="synthesis-inconsistency"
                label="Biggest Inconsistency to Resolve"
                prompts={["What doesn't quite fit together? How might you fix it?"]}
                value={formState.synthesis.inconsistency}
                onChange={(value) => updateSynthesis("inconsistency", value)}
              />

              <QuestionSection
                id="synthesis-unexpected"
                label="Unexpected Consequences"
                prompts={["What surprising implications emerged from this exercise?"]}
                value={formState.synthesis.unexpectedConsequences}
                onChange={(value) => updateSynthesis("unexpectedConsequences", value)}
              />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Story Conflicts Generated</Label>
                <p className="text-xs text-muted-foreground">These become your narrative engines.</p>
                
                <div className="space-y-2">
                  <Label htmlFor="conflict-economic" className="text-xs">Economic Conflicts</Label>
                  <Textarea
                    id="conflict-economic"
                    placeholder="What economic tensions drive conflict in your world?"
                    value={formState.synthesis.economicConflicts}
                    onChange={(e) => updateSynthesis("economicConflicts", e.target.value)}
                    className="min-h-[80px] bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conflict-political" className="text-xs">Political Conflicts</Label>
                  <Textarea
                    id="conflict-political"
                    placeholder="What political tensions emerge from your travel system?"
                    value={formState.synthesis.politicalConflicts}
                    onChange={(e) => updateSynthesis("politicalConflicts", e.target.value)}
                    className="min-h-[80px] bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conflict-social" className="text-xs">Social Conflicts</Label>
                  <Textarea
                    id="conflict-social"
                    placeholder="What social tensions arise from propulsion constraints?"
                    value={formState.synthesis.socialConflicts}
                    onChange={(e) => updateSynthesis("socialConflicts", e.target.value)}
                    className="min-h-[80px] bg-background/50"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* SF Examples */}
          <CollapsibleSection
            id="section-examples"
            title="Examples from Master Worldbuilders"
            subtitle="Learn from published SF settings"
          >
            <div className="space-y-6">
              {SF_EXAMPLES.map((example, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 rounded-lg border border-border hover:border-primary/50 transition-colors text-left flex items-center justify-between">
                      <span className="font-medium text-sm">{example.title}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 rounded-lg bg-muted/30 space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-2 font-medium">Domain</th>
                              <th className="text-left p-2 font-medium">Consequence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {example.data.map((row, i) => (
                              <tr key={i} className="border-b border-border/50">
                                <td className="p-2 text-primary font-medium">{row.domain}</td>
                                <td className="p-2 text-muted-foreground">{row.consequence}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-sm italic border-l-2 border-accent pl-3">
                        <strong>Key insight:</strong> {example.insight}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CollapsibleSection>

          {/* Final Synthesis */}
          <CollapsibleSection
            id="section-synthesis"
            title="Final Synthesis: The Propulsion Thesis"
            subtitle="Distill your worldbuilding into key insights"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="thesis" className="text-sm font-medium">
                  Propulsion Thesis (2-3 sentences)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Summarize how your travel system shapes your world.
                </p>
                <Textarea
                  id="thesis"
                  placeholder="In my world, [propulsion type] means that [key consequence], which leads to [cultural/political result]. The most important tension is between [X] and [Y]."
                  value={formState.synthesis.propulsionThesis}
                  onChange={(e) => updateSynthesis("propulsionThesis", e.target.value)}
                  className="min-h-[120px] bg-background/50"
                />
              </div>

              <QuestionSection
                id="synthesis-most-important"
                label="The Single Most Important Consequence"
                prompts={["What one thing about your propulsion system matters most for your stories?"]}
                value={formState.synthesis.mostImportant}
                onChange={(value) => updateSynthesis("mostImportant", value)}
              />

              <QuestionSection
                id="synthesis-story-conflict"
                label="The Most Interesting Story Conflict"
                prompts={["What tension, generated by your propulsion system, will drive your narratives?"]}
                value={formState.synthesis.storyConflict}
                onChange={(value) => updateSynthesis("storyConflict", value)}
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Bottom Action Bar */}
        <ToolActionBar
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExport}
          exportLabel="Export Worksheet"
          className="mt-8"
        />

        {/* Section Navigation */}
        <SectionNavigation sections={SECTIONS} />

        {/* Key Choices Sidebar */}
        <KeyChoicesSidebar
          sections={keyChoicesSections}
          title="Propulsion Summary"
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Propulsion Consequences Map"
        worldName={worldName}
        formState={formState}
        summaryTemplate={<PropulsionSummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<PropulsionFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename="propulsion-consequences-map"
      />

      {/* Worksheet Selector Dialog */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Propulsion Consequences Map"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}
    </div>
  );
};

export default PropulsionConsequencesMap;
