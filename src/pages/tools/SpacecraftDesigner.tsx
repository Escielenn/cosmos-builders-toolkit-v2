import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, Info, ExternalLink, Printer, Cloud, CloudOff, Rocket } from "lucide-react";
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
import WorksheetLinkSelector from "@/components/tools/WorksheetLinkSelector";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection } from "@/components/tools/KeyChoicesSidebar";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
import { SpacecraftSummaryTemplate, SpacecraftFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import { LinkedWorksheetRef, getLinkConfigsForTool } from "@/lib/worksheet-links-config";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-identity", title: "1. Identity & History" },
  { id: "section-propulsion", title: "2. Propulsion" },
  { id: "section-lifesupport", title: "3. Life Support" },
  { id: "section-living", title: "4. Living Spaces" },
  { id: "section-cultural", title: "5. Cultural Elements" },
  { id: "section-character", title: "6. Ship Character" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Synthesis" },
];

// Types for form state
interface ShipIdentity {
  name: string;
  class: string;
  customClass: string;
  role: string;
  customRole: string;
  size: string;
  age: string;
  origin: string;
  currentOwner: string;
  history: string;
}

interface PropulsionIntegration {
  driveType: string;
  accelerationProfile: string;
  fuelSource: string;
  rangeLimit: string;
  architecturalConsequences: string;
  thrustOrientation: string;
  noiseVibration: string;
}

interface LifeSupport {
  atmosphere: string;
  water: string;
  food: string;
  waste: string;
  temperature: string;
  radiation: string;
  gravity: string;
  medical: string;
  emergencyBackups: string;
  failureModes: string;
}

interface LivingSpaces {
  crewQuarters: string;
  commonAreas: string;
  privateSpace: string;
  storage: string;
  recreation: string;
  workspaces: string;
  traffic: string;
  soundscape: string;
  lighting: string;
  smells: string;
}

interface CulturalElements {
  originCulture: string;
  decorations: string;
  modifications: string;
  rituals: string;
  taboos: string;
  naming: string;
  superstitions: string;
  memorials: string;
  conflicts: string;
}

interface ShipCharacter {
  personality: string;
  quirks: string;
  secrets: string;
  reputation: string;
  relationships: string;
  evolution: string;
  metaphor: string;
}

interface FormState {
  identity: ShipIdentity;
  propulsion: PropulsionIntegration;
  lifeSupport: LifeSupport;
  living: LivingSpaces;
  cultural: CulturalElements;
  character: ShipCharacter;
  synthesis: {
    livedInDetails: string;
    storyHooks: string;
    sensorySignature: string;
  };
}

const initialFormState: FormState = {
  identity: {
    name: "",
    class: "",
    customClass: "",
    role: "",
    customRole: "",
    size: "",
    age: "",
    origin: "",
    currentOwner: "",
    history: "",
  },
  propulsion: {
    driveType: "",
    accelerationProfile: "",
    fuelSource: "",
    rangeLimit: "",
    architecturalConsequences: "",
    thrustOrientation: "",
    noiseVibration: "",
  },
  lifeSupport: {
    atmosphere: "",
    water: "",
    food: "",
    waste: "",
    temperature: "",
    radiation: "",
    gravity: "",
    medical: "",
    emergencyBackups: "",
    failureModes: "",
  },
  living: {
    crewQuarters: "",
    commonAreas: "",
    privateSpace: "",
    storage: "",
    recreation: "",
    workspaces: "",
    traffic: "",
    soundscape: "",
    lighting: "",
    smells: "",
  },
  cultural: {
    originCulture: "",
    decorations: "",
    modifications: "",
    rituals: "",
    taboos: "",
    naming: "",
    superstitions: "",
    memorials: "",
    conflicts: "",
  },
  character: {
    personality: "",
    quirks: "",
    secrets: "",
    reputation: "",
    relationships: "",
    evolution: "",
    metaphor: "",
  },
  synthesis: {
    livedInDetails: "",
    storyHooks: "",
    sensorySignature: "",
  },
};

const SHIP_CLASSES = [
  { value: "fighter", label: "Fighter/Interceptor", description: "Small, fast, 1-2 crew" },
  { value: "shuttle", label: "Shuttle/Transport", description: "Short-range, passengers/cargo" },
  { value: "freighter", label: "Freighter/Cargo", description: "Bulk transport, small crew" },
  { value: "corvette", label: "Corvette/Patrol", description: "Fast military, 10-50 crew" },
  { value: "frigate", label: "Frigate/Escort", description: "Multi-role military, 50-200 crew" },
  { value: "cruiser", label: "Cruiser", description: "Major warship, 200-1000 crew" },
  { value: "carrier", label: "Carrier", description: "Fighter/shuttle platform, 1000+ crew" },
  { value: "liner", label: "Passenger Liner", description: "Luxury or mass transit" },
  { value: "colony", label: "Colony Ship", description: "Long-duration settlement vessel" },
  { value: "generation", label: "Generation Ship", description: "Multi-generational voyage" },
  { value: "station", label: "Mobile Station", description: "Self-contained habitat" },
  { value: "mining", label: "Mining/Industrial", description: "Resource extraction" },
  { value: "science", label: "Research/Science", description: "Exploration and study" },
  { value: "privateer", label: "Privateer/Pirate", description: "Armed independent vessel" },
  { value: "other", label: "Other", description: "Custom classification" },
];

const SHIP_ROLES = [
  { value: "military", label: "Military Combat" },
  { value: "patrol", label: "Patrol/Security" },
  { value: "transport", label: "Cargo Transport" },
  { value: "passenger", label: "Passenger Service" },
  { value: "exploration", label: "Exploration" },
  { value: "mining", label: "Mining/Industrial" },
  { value: "smuggling", label: "Smuggling" },
  { value: "piracy", label: "Piracy/Raiding" },
  { value: "salvage", label: "Salvage" },
  { value: "medical", label: "Medical/Hospital" },
  { value: "diplomatic", label: "Diplomatic" },
  { value: "private", label: "Private Yacht" },
  { value: "other", label: "Other" },
];

const SIZE_OPTIONS = [
  { value: "tiny", label: "Tiny", description: "Under 20m, 1-4 crew" },
  { value: "small", label: "Small", description: "20-100m, 5-20 crew" },
  { value: "medium", label: "Medium", description: "100-300m, 20-100 crew" },
  { value: "large", label: "Large", description: "300-1000m, 100-500 crew" },
  { value: "huge", label: "Huge", description: "1-5km, 500-5000 crew" },
  { value: "massive", label: "Massive", description: "5km+, 5000+ crew" },
];

const GRAVITY_OPTIONS = [
  { value: "none", label: "Zero-G", description: "No artificial gravity" },
  { value: "spin", label: "Spin Gravity", description: "Rotating sections" },
  { value: "thrust", label: "Thrust Gravity", description: "Acceleration provides 'down'" },
  { value: "artificial", label: "Artificial Gravity", description: "Technology-based" },
  { value: "mixed", label: "Mixed Zones", description: "Different areas have different gravity" },
];

const SF_EXAMPLES = [
  {
    title: "MILLENNIUM FALCON (Star Wars)",
    aspects: [
      { label: "Lived-In Feel", value: "Cluttered corridors, exposed wiring, game table, smuggling compartments" },
      { label: "Cultural Elements", value: "Corellian engineering philosophy, smuggler modifications, Wookiee co-pilot accommodations" },
      { label: "Character", value: "Unreliable but beloved, 'fastest hunk of junk in the galaxy', personality emerges from quirks" },
      { label: "Key Detail", value: "The holochess table—serves no practical purpose but makes it feel like a home" },
    ],
  },
  {
    title: "ROCINANTE (The Expanse)",
    aspects: [
      { label: "Lived-In Feel", value: "Coffee maker as essential equipment, juice (thrust) constantly affects life, crash couches everywhere" },
      { label: "Cultural Elements", value: "Originally Martian military, adapted by Belters, cooking becomes bonding ritual" },
      { label: "Character", value: "Former warship becoming home, crew relationships reflected in who uses what spaces" },
      { label: "Key Detail", value: "The galley as social center—where crew connects between crises" },
    ],
  },
  {
    title: "NOSTROMO (Alien)",
    aspects: [
      { label: "Lived-In Feel", value: "Industrial grunge, coffee stains, worn surfaces, cramped crew quarters vs. pristine company equipment" },
      { label: "Cultural Elements", value: "Working-class aesthetic, 'truckers in space', crew tensions visible in territory" },
      { label: "Character", value: "Hostile environment even before the alien—ship doesn't care about crew comfort" },
      { label: "Key Detail", value: "The mess hall where crew eat together—class tensions visible in seating" },
    ],
  },
  {
    title: "SERENITY (Firefly)",
    aspects: [
      { label: "Lived-In Feel", value: "Kitchen, infirmary, cargo bay as basketball court, individual crew quarters showing personality" },
      { label: "Cultural Elements", value: "Chinese-Western fusion in design, each crew member's space reflects their culture" },
      { label: "Character", value: "Ship as surrogate family home, named for battlefield (trauma embedded in identity)" },
      { label: "Key Detail", value: "Each crew member's bunk is personalized—Kaylee's frilly, Jayne's weapon-covered" },
    ],
  },
];

const EXTERNAL_RESOURCES = [
  { name: "Atomic Rockets - Spacecraft", url: "http://www.projectrho.com/public_html/rocket/spacecraft.php", description: "Technical spacecraft design" },
  { name: "Life Support Systems", url: "http://www.projectrho.com/public_html/rocket/lifesupport.php", description: "Realistic life support" },
  { name: "Spaceship Handbook", url: "https://www.amazon.com/Spaceship-Handbook-Rocket-Science-Future/dp/0976836394", description: "Classic reference" },
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

const TOOL_TYPE = "spacecraft-designer";

const SpacecraftDesigner = () => {
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
      const saved = localStorage.getItem("spacecraft-designer");
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

  // Link configurations for this tool
  const linkConfigs = getLinkConfigsForTool(TOOL_TYPE);

  // Generate key choices for sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    return [
      {
        id: "identity",
        title: "1. Identity",
        choices: [
          { label: "Name", value: formState.identity.name },
          { label: "Class", value: formState.identity.class || formState.identity.customClass },
          { label: "Role", value: formState.identity.role || formState.identity.customRole },
          { label: "Size", value: formState.identity.size },
        ],
      },
      {
        id: "propulsion",
        title: "2. Propulsion",
        choices: [
          { label: "Drive", value: formState.propulsion.driveType },
          { label: "Acceleration", value: formState.propulsion.accelerationProfile },
          { label: "Fuel", value: formState.propulsion.fuelSource },
        ],
      },
      {
        id: "lifesupport",
        title: "3. Life Support",
        choices: [
          { label: "Atmosphere", value: formState.lifeSupport.atmosphere ? "Defined" : undefined },
          { label: "Gravity", value: formState.lifeSupport.gravity ? "Defined" : undefined },
        ],
      },
      {
        id: "living",
        title: "4. Living",
        choices: [
          { label: "Layout", value: formState.living.layout ? "Defined" : undefined },
          { label: "Shared Spaces", value: formState.living.sharedSpaces ? "Defined" : undefined },
        ],
      },
      {
        id: "cultural",
        title: "5. Cultural",
        choices: [
          { label: "Traditions", value: formState.cultural.traditions ? "Defined" : undefined },
          { label: "Rituals", value: formState.cultural.rituals ? "Defined" : undefined },
        ],
      },
      {
        id: "character",
        title: "6. Character",
        choices: [
          { label: "Sounds", value: formState.character.sounds ? "Defined" : undefined },
          { label: "Quirks", value: formState.character.quirks ? "Defined" : undefined },
          { label: "Secret", value: formState.character.secret ? "Defined" : undefined },
        ],
      },
    ];
  }, [formState]);

  const updateIdentity = (field: keyof ShipIdentity, value: string) => {
    setFormState((prev) => ({
      ...prev,
      identity: { ...prev.identity, [field]: value },
    }));
  };

  const updatePropulsion = (field: keyof PropulsionIntegration, value: string) => {
    setFormState((prev) => ({
      ...prev,
      propulsion: { ...prev.propulsion, [field]: value },
    }));
  };

  const updateLifeSupport = (field: keyof LifeSupport, value: string) => {
    setFormState((prev) => ({
      ...prev,
      lifeSupport: { ...prev.lifeSupport, [field]: value },
    }));
  };

  const updateLiving = (field: keyof LivingSpaces, value: string) => {
    setFormState((prev) => ({
      ...prev,
      living: { ...prev.living, [field]: value },
    }));
  };

  const updateCultural = (field: keyof CulturalElements, value: string) => {
    setFormState((prev) => ({
      ...prev,
      cultural: { ...prev.cultural, [field]: value },
    }));
  };

  const updateCharacter = (field: keyof ShipCharacter, value: string) => {
    setFormState((prev) => ({
      ...prev,
      character: { ...prev.character, [field]: value },
    }));
  };

  const updateSynthesis = (field: keyof FormState["synthesis"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem("spacecraft-designer", JSON.stringify(formState));

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
              <Badge className="mb-2">Tool 2</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Lived-In Spacecraft Designer
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Design ships that feel inhabited rather than sterile—with cultural context, life support realities, and ship-as-character development.
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
            Ships as Characters
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "The best SF ships aren't just vehicles—they're places people live, with all the mess, personality, and history that implies."
          </blockquote>
          <p className="text-muted-foreground mb-4">
            A lived-in ship tells stories through its details: the worn patch on the pilot's seat, the coffee stains near the nav console, the shrine in the cargo bay. This tool helps you design vessels that feel real.
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <strong className="text-foreground">The Lived-In Principle:</strong>
            <p className="mt-1">Function → Culture → Personalization → History → Character</p>
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

        {/* Form Sections */}
        <div className="space-y-4">
          {/* Section 1: Ship Identity */}
          <CollapsibleSection
            id="section-identity"
            title="Ship Identity & History"
            subtitle="Who is this ship? Where has it been?"
            levelNumber={1}
            defaultOpen={true}
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shipName">Ship Name</Label>
                  <Input
                    id="shipName"
                    placeholder="e.g., Rocinante, Serenity, Nostromo"
                    value={formState.identity.name}
                    onChange={(e) => updateIdentity("name", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Names carry meaning—what does this one suggest?</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Ship Age</Label>
                  <Input
                    id="age"
                    placeholder="e.g., 15 years, brand new, century-old"
                    value={formState.identity.age}
                    onChange={(e) => updateIdentity("age", e.target.value)}
                  />
                </div>
              </div>

              {/* Ship Class */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Ship Class</Label>
                <RadioGroup
                  value={formState.identity.class}
                  onValueChange={(value) => updateIdentity("class", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  {SHIP_CLASSES.map((cls) => (
                    <div key={cls.value} className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={cls.value} id={`class-${cls.value}`} className="mt-0.5" />
                      <Label htmlFor={`class-${cls.value}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{cls.label}</span>
                        <span className="text-muted-foreground block text-xs">{cls.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {formState.identity.class === "other" && (
                  <Input
                    placeholder="Describe your custom ship class..."
                    value={formState.identity.customClass}
                    onChange={(e) => updateIdentity("customClass", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Ship Role */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Current Role/Function</Label>
                <RadioGroup
                  value={formState.identity.role}
                  onValueChange={(value) => updateIdentity("role", value)}
                  className="grid gap-2 md:grid-cols-4"
                >
                  {SHIP_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center gap-2">
                      <RadioGroupItem value={role.value} id={`role-${role.value}`} />
                      <Label htmlFor={`role-${role.value}`} className="cursor-pointer text-sm">{role.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {formState.identity.role === "other" && (
                  <Input
                    placeholder="Describe the ship's role..."
                    value={formState.identity.customRole}
                    onChange={(e) => updateIdentity("customRole", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Size */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Size Category</Label>
                <RadioGroup
                  value={formState.identity.size}
                  onValueChange={(value) => updateIdentity("size", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  {SIZE_OPTIONS.map((size) => (
                    <div key={size.value} className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50">
                      <RadioGroupItem value={size.value} id={`size-${size.value}`} className="mt-0.5" />
                      <Label htmlFor={`size-${size.value}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{size.label}</span>
                        <span className="text-muted-foreground block text-xs">{size.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin/Builder</Label>
                  <Input
                    id="origin"
                    placeholder="e.g., Earth shipyards, Martian Congressional Navy, Belter salvage"
                    value={formState.identity.origin}
                    onChange={(e) => updateIdentity("origin", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentOwner">Current Owner/Operator</Label>
                  <Input
                    id="currentOwner"
                    placeholder="e.g., Independent crew, corporation, military"
                    value={formState.identity.currentOwner}
                    onChange={(e) => updateIdentity("currentOwner", e.target.value)}
                  />
                </div>
              </div>

              <QuestionSection
                id="identity-history"
                label="Ship History"
                prompts={[
                  "What was this ship originally built for?",
                  "How many owners/operators has it had?",
                  "What major events has it survived?",
                  "What visible evidence of its past remains?",
                ]}
                example="The Falcon was built as a cargo ship, modified for smuggling, and still has hidden compartments even though the current crew uses it legitimately."
                value={formState.identity.history}
                onChange={(value) => updateIdentity("history", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 2: Propulsion Integration */}
          <CollapsibleSection
            id="section-propulsion"
            title="Propulsion & Architecture"
            subtitle="How does the drive system shape daily life?"
            levelNumber={2}
            thinkLike="an engineer who lives aboard: The drive isn't just propulsion—it's the ship's heartbeat."
          >
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-accent">Link to Tool 3:</strong> If you've completed the Propulsion Consequences Map, use your propulsion system here. The drive type fundamentally shapes ship architecture and crew life.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driveType">Drive Type</Label>
                <Input
                  id="driveType"
                  placeholder="e.g., Epstein drive, chemical rockets, Holtzman fold drive"
                  value={formState.propulsion.driveType}
                  onChange={(e) => updatePropulsion("driveType", e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="acceleration">Typical Acceleration Profile</Label>
                  <Input
                    id="acceleration"
                    placeholder="e.g., 1g sustained, 3g for maneuvers"
                    value={formState.propulsion.accelerationProfile}
                    onChange={(e) => updatePropulsion("accelerationProfile", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelSource">Fuel/Energy Source</Label>
                  <Input
                    id="fuelSource"
                    placeholder="e.g., Deuterium pellets, reaction mass, solar"
                    value={formState.propulsion.fuelSource}
                    onChange={(e) => updatePropulsion("fuelSource", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rangeLimit">Range/Endurance</Label>
                <Input
                  id="rangeLimit"
                  placeholder="e.g., 6 months fuel, unlimited with resupply"
                  value={formState.propulsion.rangeLimit}
                  onChange={(e) => updatePropulsion("rangeLimit", e.target.value)}
                />
              </div>

              <QuestionSection
                id="prop-architecture"
                label="Architectural Consequences"
                prompts={[
                  "How does the drive shape the ship's layout?",
                  "Where is 'down' during thrust vs. coast?",
                  "What parts of the ship are off-limits during burns?",
                ]}
                example="In The Expanse, ships are built like towers with decks perpendicular to thrust. 'Down' is toward the engine during burns."
                value={formState.propulsion.architecturalConsequences}
                onChange={(value) => updatePropulsion("architecturalConsequences", value)}
              />

              <QuestionSection
                id="prop-orientation"
                label="Thrust Orientation"
                prompts={[
                  "How do crew members orient during acceleration?",
                  "Are there dedicated acceleration couches/gel tanks?",
                  "What happens to unsecured items during hard burns?",
                ]}
                value={formState.propulsion.thrustOrientation}
                onChange={(value) => updatePropulsion("thrustOrientation", value)}
              />

              <QuestionSection
                id="prop-sensory"
                label="Noise & Vibration"
                prompts={[
                  "What does the drive sound like when running?",
                  "Can crew feel vibration through the deck?",
                  "How does this affect sleep, conversation, work?",
                ]}
                example="The constant thrum of engines becomes white noise—crew notice when it stops, not when it runs."
                value={formState.propulsion.noiseVibration}
                onChange={(value) => updatePropulsion("noiseVibration", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 3: Life Support */}
          <CollapsibleSection
            id="section-lifesupport"
            title="Life Support Systems"
            subtitle="Keeping crew alive—and what happens when things fail"
            levelNumber={3}
            thinkLike="a life support engineer: Everything is connected. One failure cascades into others."
          >
            <div className="space-y-6">
              <QuestionSection
                id="life-atmosphere"
                label="Atmosphere Management"
                prompts={[
                  "How is air recycled and maintained?",
                  "What does the air smell like? (Recycled air has a distinct scent)",
                  "Are there different pressure zones?",
                ]}
                example="Ships often smell of recycled air, ozone from electronics, and whatever the crew is cooking. Different species might need different atmospheres."
                value={formState.lifeSupport.atmosphere}
                onChange={(value) => updateLifeSupport("atmosphere", value)}
              />

              <QuestionSection
                id="life-water"
                label="Water Systems"
                prompts={[
                  "How is water recycled? (Yes, including that water)",
                  "Is there water rationing? Shower limits?",
                  "What do water luxury and scarcity look like?",
                ]}
                value={formState.lifeSupport.water}
                onChange={(value) => updateLifeSupport("water", value)}
              />

              <QuestionSection
                id="life-food"
                label="Food & Nutrition"
                prompts={[
                  "Galley setup: Full kitchen, food printer, ration packs?",
                  "Where does food come from on long voyages?",
                  "What are meal rituals aboard?",
                ]}
                example="The galley on Serenity is where crew bond. On military ships, meals might be formal or shift-based."
                value={formState.lifeSupport.food}
                onChange={(value) => updateLifeSupport("food", value)}
              />

              <QuestionSection
                id="life-waste"
                label="Waste Management"
                prompts={[
                  "Where does waste go? (This matters in zero-G)",
                  "How are toilets designed for your gravity situation?",
                  "Is waste recycled into anything?",
                ]}
                value={formState.lifeSupport.waste}
                onChange={(value) => updateLifeSupport("waste", value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <QuestionSection
                  id="life-temperature"
                  label="Temperature Control"
                  prompts={[
                    "How is heat distributed/removed?",
                    "Hot spots and cold spots aboard?",
                  ]}
                  value={formState.lifeSupport.temperature}
                  onChange={(value) => updateLifeSupport("temperature", value)}
                />

                <QuestionSection
                  id="life-radiation"
                  label="Radiation Protection"
                  prompts={[
                    "Shielding type: mass, magnetic, water jacket?",
                    "Storm shelter locations?",
                  ]}
                  value={formState.lifeSupport.radiation}
                  onChange={(value) => updateLifeSupport("radiation", value)}
                />
              </div>

              {/* Gravity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Gravity Situation</Label>
                <RadioGroup
                  value={formState.lifeSupport.gravity}
                  onValueChange={(value) => updateLifeSupport("gravity", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  {GRAVITY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-start gap-2 p-2 rounded border border-border">
                      <RadioGroupItem value={option.value} id={`gravity-${option.value}`} className="mt-0.5" />
                      <Label htmlFor={`gravity-${option.value}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground block text-xs">{option.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <QuestionSection
                id="life-medical"
                label="Medical Facilities"
                prompts={[
                  "Dedicated medbay or multi-purpose space?",
                  "Autodoc, medic, or trained crew member?",
                  "Cryogenic or emergency stasis capability?",
                ]}
                value={formState.lifeSupport.medical}
                onChange={(value) => updateLifeSupport("medical", value)}
              />

              <QuestionSection
                id="life-emergency"
                label="Emergency Backups"
                prompts={[
                  "Escape pods, lifeboats, emergency suits?",
                  "Backup life support duration?",
                  "What drills does the crew run?",
                ]}
                value={formState.lifeSupport.emergencyBackups}
                onChange={(value) => updateLifeSupport("emergencyBackups", value)}
              />

              <QuestionSection
                id="life-failure"
                label="Failure Modes"
                prompts={[
                  "What breaks most often?",
                  "What's the scariest potential failure?",
                  "What jury-rigged fixes are currently in place?",
                ]}
                example="The Nostromo's crew knows exactly which alarms to ignore and which mean real trouble."
                value={formState.lifeSupport.failureModes}
                onChange={(value) => updateLifeSupport("failureModes", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 4: Living Spaces */}
          {/* Section 4: Living Spaces */}
          <CollapsibleSection
            id="section-living"
            title="Living Spaces & Sensory Experience"
            subtitle="What does it feel like to live aboard?"
            levelNumber={4}
            thinkLike="a crew member who's been aboard for months: You know every sound, smell, and shortcut."
          >
            <div className="space-y-6">
              <QuestionSection
                id="living-quarters"
                label="Crew Quarters"
                prompts={[
                  "Private cabins, shared bunks, or sleeping pods?",
                  "How much personal space does each crew member have?",
                  "What personalization is allowed/common?",
                ]}
                example="On Serenity, each crew member's bunk reflects their personality—Kaylee's is frilly, Jayne's is covered in weapons."
                value={formState.living.crewQuarters}
                onChange={(value) => updateLiving("crewQuarters", value)}
              />

              <QuestionSection
                id="living-common"
                label="Common Areas"
                prompts={[
                  "Where do crew gather socially?",
                  "Mess hall, lounge, recreation area?",
                  "What activities happen in shared spaces?",
                ]}
                example="The holochess table on the Falcon, the galley on the Rocinante—ships need social spaces."
                value={formState.living.commonAreas}
                onChange={(value) => updateLiving("commonAreas", value)}
              />

              <QuestionSection
                id="living-private"
                label="Private/Quiet Spaces"
                prompts={[
                  "Where can crew go to be alone?",
                  "Are there unofficial hiding spots?",
                  "How is privacy managed on a small ship?",
                ]}
                value={formState.living.privateSpace}
                onChange={(value) => updateLiving("privateSpace", value)}
              />

              <QuestionSection
                id="living-storage"
                label="Personal Storage"
                prompts={[
                  "Where do crew keep their possessions?",
                  "What's the limit on personal items?",
                  "What do crew members actually bring aboard?",
                ]}
                value={formState.living.storage}
                onChange={(value) => updateLiving("storage", value)}
              />

              <QuestionSection
                id="living-recreation"
                label="Recreation & Exercise"
                prompts={[
                  "How do crew stay fit (especially in zero-G)?",
                  "Games, hobbies, entertainment options?",
                  "What do crew do during off-hours?",
                ]}
                example="Exercise is mandatory in zero-G to prevent muscle atrophy. What does your crew's workout routine look like?"
                value={formState.living.recreation}
                onChange={(value) => updateLiving("recreation", value)}
              />

              <QuestionSection
                id="living-workspaces"
                label="Work Spaces"
                prompts={[
                  "Bridge/cockpit setup and who's usually there?",
                  "Engineering spaces—accessible or restricted?",
                  "Cargo handling areas?",
                ]}
                value={formState.living.workspaces}
                onChange={(value) => updateLiving("workspaces", value)}
              />

              <QuestionSection
                id="living-traffic"
                label="Traffic Patterns"
                prompts={[
                  "Main corridors vs. maintenance crawlways?",
                  "Where do people naturally congregate?",
                  "Bottleneck points during emergencies?",
                ]}
                value={formState.living.traffic}
                onChange={(value) => updateLiving("traffic", value)}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <QuestionSection
                  id="living-sound"
                  label="Soundscape"
                  prompts={[
                    "Constant background noises?",
                    "Unusual sounds that indicate problems?",
                  ]}
                  value={formState.living.soundscape}
                  onChange={(value) => updateLiving("soundscape", value)}
                />

                <QuestionSection
                  id="living-light"
                  label="Lighting"
                  prompts={[
                    "Day/night cycle simulation?",
                    "Bright work areas vs. dim rest areas?",
                  ]}
                  value={formState.living.lighting}
                  onChange={(value) => updateLiving("lighting", value)}
                />

                <QuestionSection
                  id="living-smells"
                  label="Smells"
                  prompts={[
                    "What does the ship smell like?",
                    "Different areas have different smells?",
                  ]}
                  example="Recycled air, cooking, engine lubricant, unwashed crew, hydroponics..."
                  value={formState.living.smells}
                  onChange={(value) => updateLiving("smells", value)}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5: Cultural Elements */}
          <CollapsibleSection
            id="section-cultural"
            title="Cultural Design Elements"
            subtitle="How does culture show up in the ship's details?"
            levelNumber={5}
            thinkLike="an anthropologist: Every artifact tells a story about who made it and who uses it."
          >
            <div className="space-y-6">
              <QuestionSection
                id="cultural-origin"
                label="Origin Culture"
                prompts={[
                  "What culture/civilization built this ship?",
                  "What values are embedded in the original design?",
                  "What aesthetic choices reflect the builder's culture?",
                ]}
                example="Martian ships in The Expanse are militaristic and efficient. Earth ships are more comfortable but less rugged."
                value={formState.cultural.originCulture}
                onChange={(value) => updateCultural("originCulture", value)}
              />

              <QuestionSection
                id="cultural-decorations"
                label="Decorations & Art"
                prompts={[
                  "What images, icons, or symbols are displayed?",
                  "Religious or spiritual items?",
                  "Graffiti, murals, or unauthorized art?",
                ]}
                value={formState.cultural.decorations}
                onChange={(value) => updateCultural("decorations", value)}
              />

              <QuestionSection
                id="cultural-modifications"
                label="Crew Modifications"
                prompts={[
                  "How has the current crew customized the ship?",
                  "Practical modifications vs. comfort additions?",
                  "What does the crew's style say about them?",
                ]}
                example="The Falcon's smuggling compartments, Serenity's infirmary added after picking up Simon."
                value={formState.cultural.modifications}
                onChange={(value) => updateCultural("modifications", value)}
              />

              <QuestionSection
                id="cultural-rituals"
                label="Shipboard Rituals"
                prompts={[
                  "Meal traditions, shift changes, celebrations?",
                  "How are arrivals and departures marked?",
                  "Any ceremonies unique to this ship?",
                ]}
                value={formState.cultural.rituals}
                onChange={(value) => updateCultural("rituals", value)}
              />

              <QuestionSection
                id="cultural-taboos"
                label="Taboos & Rules"
                prompts={[
                  "What's strictly forbidden aboard?",
                  "Unwritten rules everyone knows?",
                  "What would get you thrown off?",
                ]}
                value={formState.cultural.taboos}
                onChange={(value) => updateCultural("taboos", value)}
              />

              <QuestionSection
                id="cultural-naming"
                label="Naming Conventions"
                prompts={[
                  "Do spaces have official and unofficial names?",
                  "Nicknames for systems, areas, features?",
                  "How did the ship get its name?",
                ]}
                example="The 'lounge' might officially be 'Recreation Area 2' but everyone calls it the 'roach motel.'"
                value={formState.cultural.naming}
                onChange={(value) => updateCultural("naming", value)}
              />

              <QuestionSection
                id="cultural-superstitions"
                label="Superstitions & Traditions"
                prompts={[
                  "Spacer superstitions the crew follows?",
                  "Lucky charms or rituals before danger?",
                  "Things the crew never says/does?",
                ]}
                example="Never say 'quiet shift.' Never rename a ship. Always tap the bulkhead before launch."
                value={formState.cultural.superstitions}
                onChange={(value) => updateCultural("superstitions", value)}
              />

              <QuestionSection
                id="cultural-memorials"
                label="Memorials & Memory"
                prompts={[
                  "How are lost crew members remembered?",
                  "Are there memorial plaques or spaces?",
                  "What stories get told about the ship's past?",
                ]}
                value={formState.cultural.memorials}
                onChange={(value) => updateCultural("memorials", value)}
              />

              <QuestionSection
                id="cultural-conflicts"
                label="Cultural Conflicts"
                prompts={[
                  "Do crew members from different cultures clash?",
                  "What compromises have been made?",
                  "What tensions simmer beneath the surface?",
                ]}
                value={formState.cultural.conflicts}
                onChange={(value) => updateCultural("conflicts", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 6: Ship as Character */}
          <CollapsibleSection
            id="section-character"
            title="Ship as Character"
            subtitle="Developing the vessel's personality and role in story"
            levelNumber={6}
            thinkLike="a novelist: The ship is a character with personality, history, and arc."
          >
            <div className="space-y-6">
              <QuestionSection
                id="character-personality"
                label="Ship Personality"
                prompts={[
                  "If the ship were a person, how would you describe them?",
                  "Reliable workhorse, temperamental diva, battle-scarred veteran?",
                  "How does crew talk about the ship? As 'it' or 'she/he'?",
                ]}
                example="The Falcon is 'a piece of junk' that 'made the Kessel Run in less than twelve parsecs'—contradiction is character."
                value={formState.character.personality}
                onChange={(value) => updateCharacter("personality", value)}
              />

              <QuestionSection
                id="character-quirks"
                label="Quirks & Idiosyncrasies"
                prompts={[
                  "What makes this ship unique to operate?",
                  "Systems that don't work right but crew has adapted to?",
                  "What do newcomers need to learn?",
                ]}
                example="The airlock sticks unless you kick it just right. The autopilot has a bias to port. The coffee maker only works on Tuesdays."
                value={formState.character.quirks}
                onChange={(value) => updateCharacter("quirks", value)}
              />

              <QuestionSection
                id="character-secrets"
                label="Ship's Secrets"
                prompts={[
                  "Hidden compartments, unknown features?",
                  "Things the current crew doesn't know about the ship?",
                  "Previous modifications that might surprise?",
                ]}
                value={formState.character.secrets}
                onChange={(value) => updateCharacter("secrets", value)}
              />

              <QuestionSection
                id="character-reputation"
                label="Reputation"
                prompts={[
                  "How is this ship known to others?",
                  "Is the ship famous, infamous, or anonymous?",
                  "What do other crews think when they see it?",
                ]}
                value={formState.character.reputation}
                onChange={(value) => updateCharacter("reputation", value)}
              />

              <QuestionSection
                id="character-relationships"
                label="Crew Relationships to Ship"
                prompts={[
                  "Who loves this ship? Who hates it?",
                  "Who understands it best?",
                  "What would crew do if it were destroyed?",
                ]}
                value={formState.character.relationships}
                onChange={(value) => updateCharacter("relationships", value)}
              />

              <QuestionSection
                id="character-evolution"
                label="Evolution & Change"
                prompts={[
                  "How has the ship changed over time?",
                  "What might it become in the future?",
                  "What threatens its survival as a vessel?",
                ]}
                value={formState.character.evolution}
                onChange={(value) => updateCharacter("evolution", value)}
              />

              <QuestionSection
                id="character-metaphor"
                label="Thematic Metaphor"
                prompts={[
                  "What does this ship represent in your story?",
                  "Home, freedom, prison, identity, community?",
                  "How does the ship's state reflect characters' arcs?",
                ]}
                example="Serenity represents freedom and found family. The Nostromo represents corporate exploitation. The Rocinante transforms from weapon to home."
                value={formState.character.metaphor}
                onChange={(value) => updateCharacter("metaphor", value)}
              />
            </div>
          </CollapsibleSection>

          {/* SF Examples */}
          <CollapsibleSection
            id="section-examples"
            title="Examples from Master Worldbuilders"
            subtitle="Learn from iconic SF ships"
          >
            <div className="space-y-4">
              {SF_EXAMPLES.map((example, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 rounded-lg border border-border hover:border-primary/50 transition-colors text-left flex items-center justify-between">
                      <span className="font-medium text-sm">{example.title}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 rounded-lg bg-muted/30 space-y-3">
                      {example.aspects.map((aspect, i) => (
                        <div key={i}>
                          <span className="text-sm font-medium text-primary">{aspect.label}:</span>
                          <p className="text-sm text-muted-foreground">{aspect.value}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CollapsibleSection>

          {/* Final Synthesis */}
          <CollapsibleSection
            id="section-synthesis"
            title="Synthesis: Bringing It Together"
            subtitle="The essential details that make your ship live"
          >
            <div className="space-y-6">
              <QuestionSection
                id="synthesis-lived-in"
                label="Key Lived-In Details"
                prompts={[
                  "List 5 specific sensory details that make this ship feel inhabited",
                  "What would a visitor notice immediately?",
                  "What would take time to discover?",
                ]}
                value={formState.synthesis.livedInDetails}
                onChange={(value) => updateSynthesis("livedInDetails", value)}
              />

              <QuestionSection
                id="synthesis-hooks"
                label="Story Hooks"
                prompts={[
                  "What aspects of this ship create narrative opportunities?",
                  "Conflicts between crew and ship limitations?",
                  "Secrets waiting to be discovered?",
                ]}
                value={formState.synthesis.storyHooks}
                onChange={(value) => updateSynthesis("storyHooks", value)}
              />

              <div className="space-y-2">
                <Label htmlFor="sensory-signature" className="text-sm font-medium">
                  Sensory Signature (One Paragraph)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Write a paragraph describing what it's like to step aboard this ship for the first time—sight, sound, smell, feel.
                </p>
                <Textarea
                  id="sensory-signature"
                  placeholder="The airlock hisses open and you step into..."
                  value={formState.synthesis.sensorySignature}
                  onChange={(e) => updateSynthesis("sensorySignature", e.target.value)}
                  className="min-h-[150px] bg-background/50"
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Bottom Action Bar */}
        <ToolActionBar
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExport}
          exportLabel="Export Spacecraft"
          className="mt-8"
        />

        {/* Section Navigation */}
        <SectionNavigation sections={SECTIONS} />

        {/* Key Choices Sidebar */}
        <KeyChoicesSidebar
          sections={keyChoicesSections}
          title="Ship Summary"
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
        toolName="Spacecraft Designer"
        worldName={worldName}
        formState={formState}
        summaryTemplate={<SpacecraftSummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<SpacecraftFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename={`spacecraft-${formState.identity.name || "unnamed"}`}
      />

      {/* Worksheet Selector Dialog */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Spacecraft Designer"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}
    </div>
  );
};

export default SpacecraftDesigner;
