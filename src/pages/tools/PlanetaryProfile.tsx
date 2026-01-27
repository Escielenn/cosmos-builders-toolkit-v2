import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, ChevronDown, ChevronUp, Info, ExternalLink, Printer, Cloud, CloudOff, Check, AlertCircle, FileText } from "lucide-react";
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
import { useWorksheets, useWorksheet } from "@/hooks/use-worksheets";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
import { PlanetarySummaryTemplate, PlanetaryFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import {
  STAR_TYPES,
  ATMOSPHERIC_GASES,
  HYDROSPHERE_OPTIONS,
  HABITABILITY_TIERS,
  ADAPTATION_OPTIONS,
  TECTONIC_LEVELS,
  EXOPLANET_EXAMPLES,
  PLANETARY_PROFILE_SECTIONS,
} from "@/lib/planetary-profile-data";

// Section definitions for navigation
const SECTIONS: Section[] = PLANETARY_PROFILE_SECTIONS.map((s) => ({
  id: `section-${s.id}`,
  title: s.title,
}));

// Types for form state
interface StellarEnvironment {
  starType: string;
  starTypeNotes: string;
  luminosity: string;
  habitableZonePosition: string;
  orbitalPeriod: string;
  orbitalEccentricity: string;
  tidalLocking: string;
  tidalLockingNotes: string;
}

interface PhysicalCharacteristics {
  planetaryMass: string;
  surfaceGravity: string;
  planetaryRadius: string;
  dayLength: string;
  axialTilt: string;
  seasonalVariation: string;
}

interface AtmosphericComposition {
  primaryGases: string[];
  secondaryGases: string[];
  atmosphericPressure: string;
  greenhouseEffect: string;
  skyColor: string;
  weatherPatterns: string;
}

interface Hydrosphere {
  waterPresence: string;
  oceanCoverage: string;
  waterComposition: string;
  icePresence: string;
  hydrosphereNotes: string;
}

interface TemperatureProfile {
  averageSurfaceTemp: string;
  temperatureRange: string;
  climateZones: string;
  temperatureNotes: string;
}

interface HabitabilityAssessment {
  habitabilityTier: string;
  tierJustification: string;
  requiredAdaptations: string[];
  adaptationNotes: string;
}

interface GeologicalFeatures {
  tectonicActivity: string;
  volcanism: string;
  mountainRanges: string;
  uniqueFormations: string;
  naturalResources: string;
  geologicalHazards: string;
}

interface ThreePressures {
  survivalPressure: string;
  survivalManifestations: string;
  socialPressure: string;
  socialManifestations: string;
  psychologicalPressure: string;
  psychologicalManifestations: string;
  pressureInteractions: string;
}

interface NarrativeIntegration {
  environmentAsCharacter: string;
  conflictSources: string;
  plotOpportunities: string;
  sensoryDetails: string;
  uniqueMoments: string;
}

interface ConsistencyCheck {
  starGravityConsistent: boolean;
  atmosphereTempConsistent: boolean;
  waterTempConsistent: boolean;
  gravityBiologyConsistent: boolean;
  pressuresEnvironmentConsistent: boolean;
  consistencyNotes: string;
}

interface FormState {
  stellarEnvironment: StellarEnvironment;
  physicalCharacteristics: PhysicalCharacteristics;
  atmosphericComposition: AtmosphericComposition;
  hydrosphere: Hydrosphere;
  temperatureProfile: TemperatureProfile;
  habitability: HabitabilityAssessment;
  geological: GeologicalFeatures;
  threePressures: ThreePressures;
  narrative: NarrativeIntegration;
  consistencyCheck: ConsistencyCheck;
}

const initialFormState: FormState = {
  stellarEnvironment: {
    starType: "",
    starTypeNotes: "",
    luminosity: "",
    habitableZonePosition: "",
    orbitalPeriod: "",
    orbitalEccentricity: "",
    tidalLocking: "",
    tidalLockingNotes: "",
  },
  physicalCharacteristics: {
    planetaryMass: "",
    surfaceGravity: "",
    planetaryRadius: "",
    dayLength: "",
    axialTilt: "",
    seasonalVariation: "",
  },
  atmosphericComposition: {
    primaryGases: [],
    secondaryGases: [],
    atmosphericPressure: "",
    greenhouseEffect: "",
    skyColor: "",
    weatherPatterns: "",
  },
  hydrosphere: {
    waterPresence: "",
    oceanCoverage: "",
    waterComposition: "",
    icePresence: "",
    hydrosphereNotes: "",
  },
  temperatureProfile: {
    averageSurfaceTemp: "",
    temperatureRange: "",
    climateZones: "",
    temperatureNotes: "",
  },
  habitability: {
    habitabilityTier: "",
    tierJustification: "",
    requiredAdaptations: [],
    adaptationNotes: "",
  },
  geological: {
    tectonicActivity: "",
    volcanism: "",
    mountainRanges: "",
    uniqueFormations: "",
    naturalResources: "",
    geologicalHazards: "",
  },
  threePressures: {
    survivalPressure: "",
    survivalManifestations: "",
    socialPressure: "",
    socialManifestations: "",
    psychologicalPressure: "",
    psychologicalManifestations: "",
    pressureInteractions: "",
  },
  narrative: {
    environmentAsCharacter: "",
    conflictSources: "",
    plotOpportunities: "",
    sensoryDetails: "",
    uniqueMoments: "",
  },
  consistencyCheck: {
    starGravityConsistent: false,
    atmosphereTempConsistent: false,
    waterTempConsistent: false,
    gravityBiologyConsistent: false,
    pressuresEnvironmentConsistent: false,
    consistencyNotes: "",
  },
};

const EXTERNAL_RESOURCES = [
  { name: "NASA Exoplanet Archive", url: "https://exoplanetarchive.ipac.caltech.edu/", description: "Real exoplanet data" },
  { name: "Habitable Zone Calculator", url: "https://www.planetarybiology.com/calculating_habitable_zone.html", description: "Calculate habitable zones" },
  { name: "Atomic Rockets - Planets", url: "http://www.projectrho.com/public_html/rocket/worldbuilding.php", description: "Hard SF worldbuilding" },
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

const TOOL_TYPE = "planetary-profile";

const PlanetaryProfile = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
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
      const saved = localStorage.getItem("planetary-profile");
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

  // Update functions for each section
  const updateStellarEnvironment = (field: keyof StellarEnvironment, value: string) => {
    setFormState((prev) => ({
      ...prev,
      stellarEnvironment: { ...prev.stellarEnvironment, [field]: value },
    }));
  };

  const updatePhysicalCharacteristics = (field: keyof PhysicalCharacteristics, value: string) => {
    setFormState((prev) => ({
      ...prev,
      physicalCharacteristics: { ...prev.physicalCharacteristics, [field]: value },
    }));
  };

  const updateAtmosphericComposition = (field: keyof AtmosphericComposition, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      atmosphericComposition: { ...prev.atmosphericComposition, [field]: value },
    }));
  };

  const updateHydrosphere = (field: keyof Hydrosphere, value: string) => {
    setFormState((prev) => ({
      ...prev,
      hydrosphere: { ...prev.hydrosphere, [field]: value },
    }));
  };

  const updateTemperatureProfile = (field: keyof TemperatureProfile, value: string) => {
    setFormState((prev) => ({
      ...prev,
      temperatureProfile: { ...prev.temperatureProfile, [field]: value },
    }));
  };

  const updateHabitability = (field: keyof HabitabilityAssessment, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      habitability: { ...prev.habitability, [field]: value },
    }));
  };

  const updateGeological = (field: keyof GeologicalFeatures, value: string) => {
    setFormState((prev) => ({
      ...prev,
      geological: { ...prev.geological, [field]: value },
    }));
  };

  const updateThreePressures = (field: keyof ThreePressures, value: string) => {
    setFormState((prev) => ({
      ...prev,
      threePressures: { ...prev.threePressures, [field]: value },
    }));
  };

  const updateNarrative = (field: keyof NarrativeIntegration, value: string) => {
    setFormState((prev) => ({
      ...prev,
      narrative: { ...prev.narrative, [field]: value },
    }));
  };

  const updateConsistencyCheck = (field: keyof ConsistencyCheck, value: boolean | string) => {
    setFormState((prev) => ({
      ...prev,
      consistencyCheck: { ...prev.consistencyCheck, [field]: value },
    }));
  };

  const toggleArrayItem = (
    section: "atmosphericComposition" | "habitability",
    field: "primaryGases" | "secondaryGases" | "requiredAdaptations",
    item: string
  ) => {
    setFormState((prev) => {
      const currentArray = prev[section][field] as string[];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return {
        ...prev,
        [section]: { ...prev[section], [field]: newArray },
      };
    });
  };

  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem("planetary-profile", JSON.stringify(formState));

    // If we have a worldId and user is authenticated, save to Supabase
    if (worldId && user) {
      const worksheetData = formState as unknown as Json;
      const starType = STAR_TYPES.find((s) => s.id === formState.stellarEnvironment.starType);
      const title = starType
        ? `Planet: ${starType.name} System`
        : "Planetary Profile";

      try {
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
            worldId,
            toolType: TOOL_TYPE,
            title,
            data: worksheetData,
          });
          setCurrentWorksheetId(result.id);
          // Update URL with new worksheetId
          setSearchParams({ worldId, worksheetId: result.id });
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

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate consistency score
  const consistencyScore = Object.entries(formState.consistencyCheck)
    .filter(([key]) => key !== "consistencyNotes")
    .filter(([, value]) => value === true).length;
  const totalChecks = 5;

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
              <Badge className="mb-2">Tool 4</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Planetary Profile Template
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Define your world's stellar environment, physical characteristics, atmosphere, habitability, and the narrative pressures that shape life.
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
            Building Believable Worlds
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "The environment isn't just a backdrop—it's a character that shapes every aspect of the story."
          </blockquote>
          <p className="text-muted-foreground mb-4">
            This tool helps you create scientifically-grounded planetary environments and explore how they shape the societies, psychology, and narratives of their inhabitants. Start with the physical parameters, then trace their consequences through to story.
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <strong className="text-foreground">The Cascade Principle:</strong>
            <p className="mt-1">Star Type → Orbital Parameters → Physical Characteristics → Atmosphere → Climate → Habitability → Three Pressures → Narrative</p>
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
          {/* Section 1: Stellar Environment */}
          <CollapsibleSection
            id="section-stellar-environment"
            title="Stellar Environment"
            subtitle="Your star determines everything else"
            levelNumber={1}
            defaultOpen={true}
            thinkLike="an astronomer: The star is the engine that drives the entire system."
          >
            <div className="space-y-6">
              {/* Star Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Star Type</Label>
                <p className="text-xs text-muted-foreground">
                  Your star's type determines habitable zone distance, radiation levels, stellar lifetime, and likelihood of tidal locking.
                </p>
                <RadioGroup
                  value={formState.stellarEnvironment.starType}
                  onValueChange={(value) => updateStellarEnvironment("starType", value)}
                  className="space-y-2"
                >
                  {STAR_TYPES.map((star) => (
                    <div key={star.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={star.id} id={`star-${star.id}`} className="mt-1" />
                      <Label htmlFor={`star-${star.id}`} className="cursor-pointer flex-1">
                        <div className="font-medium">{star.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{star.description}</div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Examples:</strong> {star.examples.join(", ")}
                        </div>
                        {formState.stellarEnvironment.starType === star.id && (
                          <div className="mt-2 p-2 rounded bg-accent/10 text-xs">
                            <strong className="text-accent">Consequences:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              {star.consequences.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <QuestionSection
                id="star-type-notes"
                label="Star Type Notes"
                prompts={[
                  "How does your star's type affect daily life on your planet?",
                  "What does the sky look like? What color is sunlight?",
                  "How does the star's lifetime affect your civilization's perspective?",
                ]}
                value={formState.stellarEnvironment.starTypeNotes}
                onChange={(value) => updateStellarEnvironment("starTypeNotes", value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="luminosity">Stellar Luminosity</Label>
                  <Input
                    id="luminosity"
                    placeholder="e.g., 0.05 L☉ (M-dwarf), 1.0 L☉ (Sun-like)"
                    value={formState.stellarEnvironment.luminosity}
                    onChange={(e) => updateStellarEnvironment("luminosity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hz-position">Habitable Zone Position</Label>
                  <Input
                    id="hz-position"
                    placeholder="e.g., inner edge, middle, outer edge"
                    value={formState.stellarEnvironment.habitableZonePosition}
                    onChange={(e) => updateStellarEnvironment("habitableZonePosition", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orbital-period">Orbital Period (Year Length)</Label>
                  <Input
                    id="orbital-period"
                    placeholder="e.g., 11 days, 365 days, 4.2 years"
                    value={formState.stellarEnvironment.orbitalPeriod}
                    onChange={(e) => updateStellarEnvironment("orbitalPeriod", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orbital-eccentricity">Orbital Eccentricity</Label>
                  <Input
                    id="orbital-eccentricity"
                    placeholder="e.g., nearly circular (0.02), moderate (0.2), highly elliptical (0.5)"
                    value={formState.stellarEnvironment.orbitalEccentricity}
                    onChange={(e) => updateStellarEnvironment("orbitalEccentricity", e.target.value)}
                  />
                </div>
              </div>

              {/* Tidal Locking */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tidal Locking Status</Label>
                <RadioGroup
                  value={formState.stellarEnvironment.tidalLocking}
                  onValueChange={(value) => updateStellarEnvironment("tidalLocking", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  <div className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50">
                    <RadioGroupItem value="locked" id="tidal-locked" className="mt-0.5" />
                    <Label htmlFor="tidal-locked" className="cursor-pointer text-sm">
                      <span className="font-medium">Tidally Locked</span>
                      <span className="text-muted-foreground block text-xs">Same side always faces star</span>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50">
                    <RadioGroupItem value="resonance" id="tidal-resonance" className="mt-0.5" />
                    <Label htmlFor="tidal-resonance" className="cursor-pointer text-sm">
                      <span className="font-medium">Spin-Orbit Resonance</span>
                      <span className="text-muted-foreground block text-xs">Like Mercury (3:2 ratio)</span>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50">
                    <RadioGroupItem value="free" id="tidal-free" className="mt-0.5" />
                    <Label htmlFor="tidal-free" className="cursor-pointer text-sm">
                      <span className="font-medium">Free Rotation</span>
                      <span className="text-muted-foreground block text-xs">Normal day/night cycle</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <QuestionSection
                id="tidal-locking-notes"
                label="Tidal Locking Consequences"
                prompts={[
                  "If locked: How do inhabitants deal with eternal day/night?",
                  "Where do settlements cluster? (Terminator zone?)",
                  "How does this affect weather, culture, psychology?",
                ]}
                example="On a tidally locked world, civilization might cluster in the twilight terminator zone, with 'Dawnward' and 'Nightward' having distinct cultural meanings."
                value={formState.stellarEnvironment.tidalLockingNotes}
                onChange={(value) => updateStellarEnvironment("tidalLockingNotes", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 2: Physical Characteristics */}
          <CollapsibleSection
            id="section-physical-characteristics"
            title="Physical Characteristics"
            subtitle="Mass, gravity, and planetary dimensions"
            levelNumber={2}
            thinkLike="a planetary scientist: These numbers shape what's possible for life and technology."
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="planetary-mass">Planetary Mass</Label>
                  <Input
                    id="planetary-mass"
                    placeholder="e.g., 0.5 Earth masses, 2.3 Earth masses"
                    value={formState.physicalCharacteristics.planetaryMass}
                    onChange={(e) => updatePhysicalCharacteristics("planetaryMass", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Affects gravity, atmosphere retention, and tectonics</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surface-gravity">Surface Gravity</Label>
                  <Input
                    id="surface-gravity"
                    placeholder="e.g., 0.8g, 1.0g, 1.5g"
                    value={formState.physicalCharacteristics.surfaceGravity}
                    onChange={(e) => updatePhysicalCharacteristics("surfaceGravity", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Directly impacts biology, architecture, and movement</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="planetary-radius">Planetary Radius</Label>
                  <Input
                    id="planetary-radius"
                    placeholder="e.g., 0.9 Earth radii, 1.6 Earth radii"
                    value={formState.physicalCharacteristics.planetaryRadius}
                    onChange={(e) => updatePhysicalCharacteristics("planetaryRadius", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day-length">Day Length (Rotation Period)</Label>
                  <Input
                    id="day-length"
                    placeholder="e.g., 24 hours, 48 hours, tidally locked"
                    value={formState.physicalCharacteristics.dayLength}
                    onChange={(e) => updatePhysicalCharacteristics("dayLength", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="axial-tilt">Axial Tilt</Label>
                  <Input
                    id="axial-tilt"
                    placeholder="e.g., 0° (no seasons), 23.4° (Earth-like), 90° (extreme)"
                    value={formState.physicalCharacteristics.axialTilt}
                    onChange={(e) => updatePhysicalCharacteristics("axialTilt", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seasonal-variation">Seasonal Variation</Label>
                  <Input
                    id="seasonal-variation"
                    placeholder="e.g., none, mild, extreme"
                    value={formState.physicalCharacteristics.seasonalVariation}
                    onChange={(e) => updatePhysicalCharacteristics("seasonalVariation", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3: Atmospheric Composition */}
          <CollapsibleSection
            id="section-atmospheric-composition"
            title="Atmospheric Composition"
            subtitle="What's in the air?"
            levelNumber={3}
            thinkLike="a chemist: Atmosphere determines breathability, temperature, sky color, and weather."
          >
            <div className="space-y-6">
              {/* Primary Gases */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Primary Atmospheric Gases</Label>
                <p className="text-xs text-muted-foreground">Select the dominant gases in your atmosphere</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {ATMOSPHERIC_GASES.primary.map((gas) => (
                    <div key={gas.id} className="flex items-start gap-2 p-2 rounded border border-border">
                      <Checkbox
                        id={`primary-${gas.id}`}
                        checked={formState.atmosphericComposition.primaryGases.includes(gas.id)}
                        onCheckedChange={() => toggleArrayItem("atmosphericComposition", "primaryGases", gas.id)}
                      />
                      <Label htmlFor={`primary-${gas.id}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{gas.name}</span>
                        <span className="text-muted-foreground block text-xs">{gas.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Gases */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Secondary/Trace Gases</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {ATMOSPHERIC_GASES.secondary.map((gas) => (
                    <div key={gas.id} className="flex items-start gap-2 p-2 rounded border border-border">
                      <Checkbox
                        id={`secondary-${gas.id}`}
                        checked={formState.atmosphericComposition.secondaryGases.includes(gas.id)}
                        onCheckedChange={() => toggleArrayItem("atmosphericComposition", "secondaryGases", gas.id)}
                      />
                      <Label htmlFor={`secondary-${gas.id}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{gas.name}</span>
                        <span className="text-muted-foreground block text-xs">{gas.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="atmospheric-pressure">Atmospheric Pressure</Label>
                  <Input
                    id="atmospheric-pressure"
                    placeholder="e.g., 0.5 atm (thin), 1.0 atm (Earth-like), 3.0 atm (dense)"
                    value={formState.atmosphericComposition.atmosphericPressure}
                    onChange={(e) => updateAtmosphericComposition("atmosphericPressure", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="greenhouse-effect">Greenhouse Effect Strength</Label>
                  <Input
                    id="greenhouse-effect"
                    placeholder="e.g., minimal, moderate, runaway"
                    value={formState.atmosphericComposition.greenhouseEffect}
                    onChange={(e) => updateAtmosphericComposition("greenhouseEffect", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sky-color">Sky Color</Label>
                <Input
                  id="sky-color"
                  placeholder="e.g., blue (Earth-like), orange (high dust), green (chlorine)"
                  value={formState.atmosphericComposition.skyColor}
                  onChange={(e) => updateAtmosphericComposition("skyColor", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Depends on atmospheric composition and stellar light</p>
              </div>

              <QuestionSection
                id="weather-patterns"
                label="Weather Patterns"
                prompts={[
                  "What are typical weather phenomena?",
                  "Are there extreme weather events?",
                  "How does the atmosphere affect daily life?",
                ]}
                example="A dense CO₂ atmosphere might have acid rain, while a thin atmosphere might have extreme temperature swings between day and night."
                value={formState.atmosphericComposition.weatherPatterns}
                onChange={(value) => updateAtmosphericComposition("weatherPatterns", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 4: Hydrosphere */}
          <CollapsibleSection
            id="section-hydrosphere"
            title="Hydrosphere"
            subtitle="Water and liquid distribution"
            levelNumber={4}
            thinkLike="a geographer: Water shapes climate, ecosystems, and settlement patterns."
          >
            <div className="space-y-6">
              {/* Water Presence */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Water Presence Type</Label>
                <RadioGroup
                  value={formState.hydrosphere.waterPresence}
                  onValueChange={(value) => updateHydrosphere("waterPresence", value)}
                  className="grid gap-2 md:grid-cols-2"
                >
                  {HYDROSPHERE_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50">
                      <RadioGroupItem value={option.id} id={`water-${option.id}`} className="mt-0.5" />
                      <Label htmlFor={`water-${option.id}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-muted-foreground block text-xs">{option.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ocean-coverage">Ocean/Water Coverage</Label>
                  <Input
                    id="ocean-coverage"
                    placeholder="e.g., 30%, 70%, 100%"
                    value={formState.hydrosphere.oceanCoverage}
                    onChange={(e) => updateHydrosphere("oceanCoverage", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water-composition">Water Composition</Label>
                  <Input
                    id="water-composition"
                    placeholder="e.g., freshwater, saline, ammonia-based"
                    value={formState.hydrosphere.waterComposition}
                    onChange={(e) => updateHydrosphere("waterComposition", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ice-presence">Ice Presence</Label>
                <Input
                  id="ice-presence"
                  placeholder="e.g., polar caps, global glaciation, none"
                  value={formState.hydrosphere.icePresence}
                  onChange={(e) => updateHydrosphere("icePresence", e.target.value)}
                />
              </div>

              <QuestionSection
                id="hydrosphere-notes"
                label="Hydrosphere Notes"
                prompts={[
                  "How does water distribution affect settlement patterns?",
                  "Are there unique water features (tides, currents, underground rivers)?",
                  "What role does water play in culture and conflict?",
                ]}
                value={formState.hydrosphere.hydrosphereNotes}
                onChange={(value) => updateHydrosphere("hydrosphereNotes", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 5: Temperature Profile */}
          <CollapsibleSection
            id="section-temperature-profile"
            title="Temperature Profile"
            subtitle="Thermal environment across the planet"
            levelNumber={5}
            thinkLike="a climatologist: Temperature determines where life can thrive."
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="avg-temp">Average Surface Temperature</Label>
                  <Input
                    id="avg-temp"
                    placeholder="e.g., -20°C, 15°C (Earth), 40°C"
                    value={formState.temperatureProfile.averageSurfaceTemp}
                    onChange={(e) => updateTemperatureProfile("averageSurfaceTemp", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temp-range">Temperature Range</Label>
                  <Input
                    id="temp-range"
                    placeholder="e.g., -40°C to +50°C, narrow (10°C variance)"
                    value={formState.temperatureProfile.temperatureRange}
                    onChange={(e) => updateTemperatureProfile("temperatureRange", e.target.value)}
                  />
                </div>
              </div>

              <QuestionSection
                id="climate-zones"
                label="Climate Zones"
                prompts={[
                  "What distinct climate zones exist?",
                  "How do zones affect habitability?",
                  "Are there extreme hot/cold regions?",
                ]}
                example="A tidally locked world might have a scorching dayside, frozen nightside, and habitable terminator. A high-tilt world might have extreme polar seasons."
                value={formState.temperatureProfile.climateZones}
                onChange={(value) => updateTemperatureProfile("climateZones", value)}
              />

              <QuestionSection
                id="temperature-notes"
                label="Temperature Narrative Impact"
                prompts={[
                  "How do inhabitants adapt to temperature?",
                  "What technologies are required?",
                  "How does temperature affect daily rhythms?",
                ]}
                value={formState.temperatureProfile.temperatureNotes}
                onChange={(value) => updateTemperatureProfile("temperatureNotes", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 6: Habitability Assessment */}
          <CollapsibleSection
            id="section-habitability"
            title="Habitability Assessment"
            subtitle="How livable is this world for humans (or your species)?"
            levelNumber={6}
            thinkLike="a colonization planner: What does it take to survive here?"
          >
            <div className="space-y-6">
              {/* Habitability Tier */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Habitability Tier</Label>
                <RadioGroup
                  value={formState.habitability.habitabilityTier}
                  onValueChange={(value) => updateHabitability("habitabilityTier", value)}
                  className="space-y-2"
                >
                  {HABITABILITY_TIERS.map((tier) => (
                    <div key={tier.tier} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={tier.tier.toString()} id={`tier-${tier.tier}`} className="mt-1" />
                      <Label htmlFor={`tier-${tier.tier}`} className="cursor-pointer flex-1">
                        <div className="font-medium">Tier {tier.tier}: {tier.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{tier.description}</div>
                        {formState.habitability.habitabilityTier === tier.tier.toString() && (
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {tier.characteristics.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <QuestionSection
                id="tier-justification"
                label="Tier Justification"
                prompts={[
                  "Why did you choose this habitability tier?",
                  "What are the primary challenges?",
                  "What makes this world more or less hospitable?",
                ]}
                value={formState.habitability.tierJustification}
                onChange={(value) => updateHabitability("tierJustification", value)}
              />

              {/* Required Adaptations */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Required Adaptations</Label>
                <p className="text-xs text-muted-foreground">What do inhabitants need to survive?</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {ADAPTATION_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-start gap-2 p-2 rounded border border-border">
                      <Checkbox
                        id={`adapt-${option.id}`}
                        checked={formState.habitability.requiredAdaptations.includes(option.id)}
                        onCheckedChange={() => toggleArrayItem("habitability", "requiredAdaptations", option.id)}
                      />
                      <Label htmlFor={`adapt-${option.id}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-muted-foreground block text-xs">{option.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="adaptation-notes"
                label="Adaptation Notes"
                prompts={[
                  "How have inhabitants adapted over time?",
                  "What technologies are essential?",
                  "What cultural practices emerged from adaptation?",
                ]}
                value={formState.habitability.adaptationNotes}
                onChange={(value) => updateHabitability("adaptationNotes", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 7: Geological Features */}
          <CollapsibleSection
            id="section-geological"
            title="Geological & Environmental Features"
            subtitle="The planet's surface and what lies beneath"
            levelNumber={7}
            thinkLike="a geologist: The ground tells a story billions of years old."
          >
            <div className="space-y-6">
              {/* Tectonic Activity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tectonic Activity</Label>
                <RadioGroup
                  value={formState.geological.tectonicActivity}
                  onValueChange={(value) => updateGeological("tectonicActivity", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  {TECTONIC_LEVELS.map((level) => (
                    <div key={level.id} className="flex items-start gap-2 p-2 rounded border border-border hover:border-primary/50">
                      <RadioGroupItem value={level.id} id={`tectonic-${level.id}`} className="mt-0.5" />
                      <Label htmlFor={`tectonic-${level.id}`} className="cursor-pointer text-sm">
                        <span className="font-medium">{level.name}</span>
                        <span className="text-muted-foreground block text-xs">{level.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <QuestionSection
                  id="volcanism"
                  label="Volcanism"
                  prompts={[
                    "Are there active volcanoes?",
                    "What role do they play in the ecosystem?",
                  ]}
                  value={formState.geological.volcanism}
                  onChange={(value) => updateGeological("volcanism", value)}
                />

                <QuestionSection
                  id="mountain-ranges"
                  label="Mountain Ranges"
                  prompts={[
                    "Major mountain chains?",
                    "How do they affect climate and culture?",
                  ]}
                  value={formState.geological.mountainRanges}
                  onChange={(value) => updateGeological("mountainRanges", value)}
                />
              </div>

              <QuestionSection
                id="unique-formations"
                label="Unique Geological Formations"
                prompts={[
                  "Any unusual or alien geological features?",
                  "Crystal formations, impact craters, exotic minerals?",
                  "How do these affect the world's appearance and resources?",
                ]}
                example="Massive crystal caves, kilometer-deep canyons, floating islands (if lighter-than-air rock exists), bioluminescent mineral deposits..."
                value={formState.geological.uniqueFormations}
                onChange={(value) => updateGeological("uniqueFormations", value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <QuestionSection
                  id="natural-resources"
                  label="Natural Resources"
                  prompts={[
                    "What valuable resources exist?",
                    "How do they drive economics and conflict?",
                  ]}
                  value={formState.geological.naturalResources}
                  onChange={(value) => updateGeological("naturalResources", value)}
                />

                <QuestionSection
                  id="geological-hazards"
                  label="Geological Hazards"
                  prompts={[
                    "Earthquakes, volcanic eruptions, sinkholes?",
                    "How do inhabitants prepare and respond?",
                  ]}
                  value={formState.geological.geologicalHazards}
                  onChange={(value) => updateGeological("geologicalHazards", value)}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 8: The Three Pressures */}
          <CollapsibleSection
            id="section-three-pressures"
            title="The Three Pressures"
            subtitle="How does this environment shape life, society, and psyche?"
            levelNumber={8}
            thinkLike="an anthropologist and psychologist: Environment creates culture creates psychology."
          >
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-accent">The Three Pressures Framework:</strong> Every environment exerts three types of pressure on its inhabitants—survival pressure (physical challenges), social pressure (how environment shapes society), and psychological pressure (mental and emotional effects).
                </p>
              </div>

              {/* Survival Pressure */}
              <div className="space-y-4 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">1. Survival Pressure</h4>
                <p className="text-xs text-muted-foreground">The physical challenges of staying alive</p>

                <QuestionSection
                  id="survival-pressure"
                  label="Primary Survival Challenge"
                  prompts={[
                    "What's the biggest threat to physical survival?",
                    "Is it temperature, atmosphere, radiation, predators, resources?",
                    "How constant or variable is this threat?",
                  ]}
                  value={formState.threePressures.survivalPressure}
                  onChange={(value) => updateThreePressures("survivalPressure", value)}
                />

                <QuestionSection
                  id="survival-manifestations"
                  label="Survival Pressure Manifestations"
                  prompts={[
                    "How has biology adapted to this pressure?",
                    "What technologies emerged to address it?",
                    "What daily rituals exist because of it?",
                  ]}
                  example="On a high-radiation world: thick skin/fur, underground cities, radiation medicine as a profession, 'sunburn' as a serious medical condition..."
                  value={formState.threePressures.survivalManifestations}
                  onChange={(value) => updateThreePressures("survivalManifestations", value)}
                />
              </div>

              {/* Social Pressure */}
              <div className="space-y-4 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-accent">2. Social Pressure</h4>
                <p className="text-xs text-muted-foreground">How the environment shapes society and culture</p>

                <QuestionSection
                  id="social-pressure"
                  label="Primary Social Structure Driver"
                  prompts={[
                    "How does the environment force people to organize?",
                    "What social structures emerged from environmental necessity?",
                    "Is cooperation or competition more valuable for survival?",
                  ]}
                  value={formState.threePressures.socialPressure}
                  onChange={(value) => updateThreePressures("socialPressure", value)}
                />

                <QuestionSection
                  id="social-manifestations"
                  label="Social Pressure Manifestations"
                  prompts={[
                    "What values does this environment promote?",
                    "How are resources shared or hoarded?",
                    "What social hierarchies emerged?",
                  ]}
                  example="On a water-scarce world: water rights as primary law, communal water storage as sacred duty, 'water-waster' as the worst insult, elaborate rituals around sharing water..."
                  value={formState.threePressures.socialManifestations}
                  onChange={(value) => updateThreePressures("socialManifestations", value)}
                />
              </div>

              {/* Psychological Pressure */}
              <div className="space-y-4 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-primary">3. Psychological Pressure</h4>
                <p className="text-xs text-muted-foreground">Mental and emotional effects of the environment</p>

                <QuestionSection
                  id="psychological-pressure"
                  label="Primary Psychological Challenge"
                  prompts={[
                    "What mental/emotional toll does this environment take?",
                    "Is it isolation, fear, sensory deprivation/overload?",
                    "How does the environment affect the psyche over generations?",
                  ]}
                  value={formState.threePressures.psychologicalPressure}
                  onChange={(value) => updateThreePressures("psychologicalPressure", value)}
                />

                <QuestionSection
                  id="psychological-manifestations"
                  label="Psychological Pressure Manifestations"
                  prompts={[
                    "What coping mechanisms developed?",
                    "What mental health challenges are common?",
                    "How does art/religion/philosophy reflect this pressure?",
                  ]}
                  example="On an eternally dark world: light-worship, fear of the 'empty dark,' elaborate lighting traditions, different concepts of privacy and visibility..."
                  value={formState.threePressures.psychologicalManifestations}
                  onChange={(value) => updateThreePressures("psychologicalManifestations", value)}
                />
              </div>

              <QuestionSection
                id="pressure-interactions"
                label="Pressure Interactions"
                prompts={[
                  "How do these three pressures interact and reinforce each other?",
                  "Where do they create interesting tensions or contradictions?",
                  "What unique cultural phenomena emerge from their combination?",
                ]}
                example="High survival pressure might demand cooperation (social), but scarcity might breed suspicion (psychological). The tension between 'we must work together' and 'I can't trust anyone' could define the culture."
                value={formState.threePressures.pressureInteractions}
                onChange={(value) => updateThreePressures("pressureInteractions", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Section 9: Narrative Integration */}
          <CollapsibleSection
            id="section-narrative"
            title="Narrative Integration"
            subtitle="Turning planetary parameters into story"
            levelNumber={9}
            thinkLike="a novelist: The world is a character with its own arc and agency."
          >
            <div className="space-y-6">
              <QuestionSection
                id="environment-as-character"
                label="Environment as Character"
                prompts={[
                  "If your planet were a character, what would its personality be?",
                  "Is it hostile, nurturing, indifferent, capricious?",
                  "What 'mood' does it evoke?",
                ]}
                example="Arrakis is hostile but vital—a stern teacher that rewards those who learn its ways. Pandora is lush but alien—beautiful but never quite safe."
                value={formState.narrative.environmentAsCharacter}
                onChange={(value) => updateNarrative("environmentAsCharacter", value)}
              />

              <QuestionSection
                id="conflict-sources"
                label="Conflict Sources"
                prompts={[
                  "What conflicts does the environment naturally generate?",
                  "Resource conflicts, territorial disputes, survival challenges?",
                  "How do different groups relate to the same environment differently?",
                ]}
                value={formState.narrative.conflictSources}
                onChange={(value) => updateNarrative("conflictSources", value)}
              />

              <QuestionSection
                id="plot-opportunities"
                label="Plot Opportunities"
                prompts={[
                  "What natural events could drive plot?",
                  "Storms, eclipses, migrations, geological events?",
                  "What environmental 'ticking clocks' exist?",
                ]}
                example="A solar flare cycle that makes surface travel deadly every 11 years. A continent-spanning dust storm season. The annual 'long dark' when the sun doesn't rise."
                value={formState.narrative.plotOpportunities}
                onChange={(value) => updateNarrative("plotOpportunities", value)}
              />

              <QuestionSection
                id="sensory-details"
                label="Sensory Details"
                prompts={[
                  "What does this world look, sound, smell, and feel like?",
                  "What sensory experiences are unique to this place?",
                  "What would a visitor notice first?",
                ]}
                value={formState.narrative.sensoryDetails}
                onChange={(value) => updateNarrative("sensoryDetails", value)}
              />

              <QuestionSection
                id="unique-moments"
                label="Unique Moments"
                prompts={[
                  "What experiences can only happen on this world?",
                  "What would make a reader say 'I've never read that before'?",
                  "What's the 'wow' factor of this environment?",
                ]}
                example="Double sunsets, bioluminescent storms, the sound of ice singing, the silence of a world without insects, the weight of heavy gravity..."
                value={formState.narrative.uniqueMoments}
                onChange={(value) => updateNarrative("uniqueMoments", value)}
              />
            </div>
          </CollapsibleSection>

          {/* SF Examples */}
          <CollapsibleSection
            id="section-sf-examples"
            title="Real Exoplanet Examples"
            subtitle="Inspiration from actual discovered worlds"
          >
            <div className="space-y-4">
              {EXOPLANET_EXAMPLES.map((example, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 rounded-lg border border-border hover:border-primary/50 transition-colors text-left flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{example.name}</span>
                        <span className="text-xs text-muted-foreground block">{example.type} • {example.distance}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 rounded-lg bg-muted/30 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-primary">Star Type:</span>
                        <span className="text-sm text-muted-foreground ml-2">{example.starType}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary">Characteristics:</span>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                          {example.characteristics.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-accent">Story Potential:</span>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                          {example.storyPotential.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CollapsibleSection>

          {/* Consistency Check */}
          <CollapsibleSection
            id="section-consistency"
            title="Internal Consistency Check"
            subtitle="Verify your world hangs together logically"
          >
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  {consistencyScore === totalChecks ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-medium">
                    Consistency Score: {consistencyScore}/{totalChecks}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Check each item to confirm you've considered how these elements interact.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded border border-border">
                  <Checkbox
                    id="check-star-gravity"
                    checked={formState.consistencyCheck.starGravityConsistent}
                    onCheckedChange={(checked) => updateConsistencyCheck("starGravityConsistent", checked as boolean)}
                  />
                  <Label htmlFor="check-star-gravity" className="cursor-pointer text-sm">
                    <span className="font-medium">Star Type ↔ Gravity Consistent</span>
                    <span className="text-muted-foreground block text-xs">
                      Does your star type make sense with your planet's mass and orbital parameters?
                    </span>
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-3 rounded border border-border">
                  <Checkbox
                    id="check-atmosphere-temp"
                    checked={formState.consistencyCheck.atmosphereTempConsistent}
                    onCheckedChange={(checked) => updateConsistencyCheck("atmosphereTempConsistent", checked as boolean)}
                  />
                  <Label htmlFor="check-atmosphere-temp" className="cursor-pointer text-sm">
                    <span className="font-medium">Atmosphere ↔ Temperature Consistent</span>
                    <span className="text-muted-foreground block text-xs">
                      Does your atmospheric composition support your temperature profile?
                    </span>
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-3 rounded border border-border">
                  <Checkbox
                    id="check-water-temp"
                    checked={formState.consistencyCheck.waterTempConsistent}
                    onCheckedChange={(checked) => updateConsistencyCheck("waterTempConsistent", checked as boolean)}
                  />
                  <Label htmlFor="check-water-temp" className="cursor-pointer text-sm">
                    <span className="font-medium">Water State ↔ Temperature Consistent</span>
                    <span className="text-muted-foreground block text-xs">
                      Is water in the right state (liquid, ice, vapor) for your temperature range?
                    </span>
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-3 rounded border border-border">
                  <Checkbox
                    id="check-gravity-biology"
                    checked={formState.consistencyCheck.gravityBiologyConsistent}
                    onCheckedChange={(checked) => updateConsistencyCheck("gravityBiologyConsistent", checked as boolean)}
                  />
                  <Label htmlFor="check-gravity-biology" className="cursor-pointer text-sm">
                    <span className="font-medium">Gravity ↔ Biology Consistent</span>
                    <span className="text-muted-foreground block text-xs">
                      Do your habitability adaptations make sense for your gravity level?
                    </span>
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-3 rounded border border-border">
                  <Checkbox
                    id="check-pressures-environment"
                    checked={formState.consistencyCheck.pressuresEnvironmentConsistent}
                    onCheckedChange={(checked) => updateConsistencyCheck("pressuresEnvironmentConsistent", checked as boolean)}
                  />
                  <Label htmlFor="check-pressures-environment" className="cursor-pointer text-sm">
                    <span className="font-medium">Three Pressures ↔ Environment Consistent</span>
                    <span className="text-muted-foreground block text-xs">
                      Do your survival/social/psychological pressures logically flow from your environment?
                    </span>
                  </Label>
                </div>
              </div>

              <QuestionSection
                id="consistency-notes"
                label="Consistency Notes"
                prompts={[
                  "Any intentional inconsistencies that need explanation?",
                  "Are there handwaves or soft-SF elements?",
                  "What aspects need more research or development?",
                ]}
                value={formState.consistencyCheck.consistencyNotes}
                onChange={(value) => updateConsistencyCheck("consistencyNotes", value)}
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Bottom Action Bar */}
        <ToolActionBar
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExport}
          exportLabel="Export Profile"
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

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Planetary Profile"
        worldName={worldName}
        formState={formState}
        summaryTemplate={<PlanetarySummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<PlanetaryFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename="planetary-profile"
      />
    </div>
  );
};

export default PlanetaryProfile;
