import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, Info, Printer, Cloud, CloudOff, Sun, Plus, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWorksheets, useWorksheet, useWorksheetsByType, useRenameWorksheet } from "@/hooks/use-worksheets";
import { WorksheetTitle } from "@/components/tools/WorksheetTitle";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import SectionNavigation, { Section, MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection, MobileKeyChoices } from "@/components/tools/KeyChoicesSidebar";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
import { MoodboardSection } from "@/components/moodboard";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import {
  SPECTRAL_CLASSES,
  STELLAR_CONFIGURATIONS,
  PLANETARY_BODY_TYPES,
  ORBITAL_ZONES,
  ORBITAL_RESONANCES,
  SYSTEM_AGES,
  SF_SYSTEM_EXAMPLES,
  FORMATION_SCENARIOS,
  MOON_TYPES,
  HZ_MODIFIERS,
} from "@/lib/star-system-data";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-primary", title: "1. Primary Star" },
  { id: "section-configuration", title: "2. Stellar Configuration" },
  { id: "section-bodies", title: "3. Planetary Bodies" },
  { id: "section-orbits", title: "4. Orbital Mechanics" },
  { id: "section-history", title: "5. System History" },
  { id: "section-habitability", title: "6. Habitability" },
  { id: "section-narrative", title: "7. Narrative Elements" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Final Synthesis" },
  { id: "section-notes", title: "Notes & Ideas" },
  { id: "section-moodboard", title: "Moodboard" },
];

// Types for form state
interface PrimaryStar {
  name: string;
  spectralClass: string;
  customClass: string;
  age: string;
  luminosity: string;
  mass: string;
  notes: string;
}

interface StellarConfiguration {
  type: string;
  secondaryStarClass: string;
  tertiaryStarClass: string;
  binaryOrbitalPeriod: string;
  binarySeparation: string;
  configurationNotes: string;
}

interface PlanetaryBody {
  id: string;
  name: string;
  type: string;
  subtype: string;
  orbitalZone: string;
  orbitalPeriod: string;
  distanceFromStar: string;
  moons: string;
  rings: boolean;
  tidallyLocked: boolean;
  notes: string;
}

interface OrbitalMechanics {
  resonancePattern: string;
  resonanceNotes: string;
  stabilityAssessment: string;
  asteroidBelts: string[];
  kuiperBelt: boolean;
  oortCloud: boolean;
  hazards: string;
}

interface SystemHistory {
  age: string;
  formationScenario: string;
  majorEvents: string;
  collisionHistory: string;
  migrationHistory: string;
  futureProjection: string;
}

interface Habitability {
  habitableZoneInner: string;
  habitableZoneOuter: string;
  modifiers: string[];
  bestCandidate: string;
  terraformingPotential: string;
  resourceRichness: string;
}

interface NarrativeElements {
  systemCharacter: string;
  visualSignature: string;
  navigationChallenges: string;
  travelTimes: string;
  culturalSignificance: string;
  mysteries: string;
  storyHooks: string;
}

interface Synthesis {
  consistencyChecks: string[];
  primaryConflict: string;
  uniqueFeature: string;
  connectionToPlanetary: string;
  oneSentenceSummary: string;
}

interface FormState {
  systemName: string;
  primaryStar: PrimaryStar;
  configuration: StellarConfiguration;
  bodies: PlanetaryBody[];
  orbits: OrbitalMechanics;
  history: SystemHistory;
  habitability: Habitability;
  narrative: NarrativeElements;
  synthesis: Synthesis;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const createEmptyBody = (): PlanetaryBody => ({
  id: crypto.randomUUID(),
  name: "",
  type: "",
  subtype: "",
  orbitalZone: "",
  orbitalPeriod: "",
  distanceFromStar: "",
  moons: "",
  rings: false,
  tidallyLocked: false,
  notes: "",
});

const initialFormState: FormState = {
  systemName: "",
  primaryStar: {
    name: "",
    spectralClass: "",
    customClass: "",
    age: "",
    luminosity: "",
    mass: "",
    notes: "",
  },
  configuration: {
    type: "single",
    secondaryStarClass: "",
    tertiaryStarClass: "",
    binaryOrbitalPeriod: "",
    binarySeparation: "",
    configurationNotes: "",
  },
  bodies: [createEmptyBody()],
  orbits: {
    resonancePattern: "",
    resonanceNotes: "",
    stabilityAssessment: "",
    asteroidBelts: [],
    kuiperBelt: false,
    oortCloud: false,
    hazards: "",
  },
  history: {
    age: "",
    formationScenario: "",
    majorEvents: "",
    collisionHistory: "",
    migrationHistory: "",
    futureProjection: "",
  },
  habitability: {
    habitableZoneInner: "",
    habitableZoneOuter: "",
    modifiers: [],
    bestCandidate: "",
    terraformingPotential: "",
    resourceRichness: "",
  },
  narrative: {
    systemCharacter: "",
    visualSignature: "",
    navigationChallenges: "",
    travelTimes: "",
    culturalSignificance: "",
    mysteries: "",
    storyHooks: "",
  },
  synthesis: {
    consistencyChecks: [],
    primaryConflict: "",
    uniqueFeature: "",
    connectionToPlanetary: "",
    oneSentenceSummary: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "star-system-builder";

const StarSystemBuilder = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const { worlds } = useWorlds();

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
  const renameWorksheet = useRenameWorksheet();

  // Check Pro access
  useEffect(() => {
    if (user && !isSubscribed) {
      setUpgradeDialogOpen(true);
    }
  }, [user, isSubscribed]);

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
      const saved = localStorage.getItem("ssb-worksheet");
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

  // Generate key choices for sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const starClass = SPECTRAL_CLASSES.find(s => s.id === formState.primaryStar.spectralClass);
    const configType = STELLAR_CONFIGURATIONS.find(c => c.id === formState.configuration.type);
    const planetCount = formState.bodies.filter(b => b.type).length;
    const ageInfo = SYSTEM_AGES.find(a => a.id === formState.history.age);

    return [
      {
        id: "primary",
        title: "1. Primary Star",
        choices: [
          { label: "Class", value: starClass?.name || formState.primaryStar.spectralClass },
          { label: "Name", value: formState.primaryStar.name || undefined },
        ],
      },
      {
        id: "configuration",
        title: "2. Configuration",
        choices: [
          { label: "Type", value: configType?.name || formState.configuration.type },
        ],
      },
      {
        id: "bodies",
        title: "3. Bodies",
        choices: [
          { label: "Planets", value: planetCount > 0 ? `${planetCount} defined` : undefined },
        ],
      },
      {
        id: "orbits",
        title: "4. Orbits",
        choices: [
          { label: "Resonance", value: formState.orbits.resonancePattern || undefined },
          { label: "Stability", value: formState.orbits.stabilityAssessment || undefined },
        ],
      },
      {
        id: "history",
        title: "5. History",
        choices: [
          { label: "Age", value: ageInfo?.name || formState.history.age || undefined },
          { label: "Formation", value: formState.history.formationScenario || undefined },
        ],
      },
      {
        id: "habitability",
        title: "6. Habitability",
        choices: [
          { label: "Best Candidate", value: formState.habitability.bestCandidate || undefined },
        ],
      },
      {
        id: "narrative",
        title: "7. Narrative",
        choices: [
          { label: "Character", value: formState.narrative.systemCharacter ? "Defined" : undefined },
        ],
      },
    ];
  }, [formState]);

  // Update functions
  const updatePrimaryStar = (field: keyof PrimaryStar, value: string) => {
    setFormState((prev) => ({
      ...prev,
      primaryStar: { ...prev.primaryStar, [field]: value },
    }));
  };

  const updateConfiguration = (field: keyof StellarConfiguration, value: string) => {
    setFormState((prev) => ({
      ...prev,
      configuration: { ...prev.configuration, [field]: value },
    }));
  };

  const updateBody = (id: string, field: keyof PlanetaryBody, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      bodies: prev.bodies.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      ),
    }));
  };

  const addBody = () => {
    setFormState((prev) => ({
      ...prev,
      bodies: [...prev.bodies, createEmptyBody()],
    }));
  };

  const removeBody = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      bodies: prev.bodies.filter((b) => b.id !== id),
    }));
  };

  const updateOrbits = (field: keyof OrbitalMechanics, value: string | string[] | boolean) => {
    setFormState((prev) => ({
      ...prev,
      orbits: { ...prev.orbits, [field]: value },
    }));
  };

  const updateHistory = (field: keyof SystemHistory, value: string) => {
    setFormState((prev) => ({
      ...prev,
      history: { ...prev.history, [field]: value },
    }));
  };

  const updateHabitability = (field: keyof Habitability, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      habitability: { ...prev.habitability, [field]: value },
    }));
  };

  const updateNarrative = (field: keyof NarrativeElements, value: string) => {
    setFormState((prev) => ({
      ...prev,
      narrative: { ...prev.narrative, [field]: value },
    }));
  };

  const updateSynthesis = (field: keyof Synthesis, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const toggleArrayItem = (
    section: "orbits" | "habitability" | "synthesis",
    field: string,
    item: string
  ) => {
    setFormState((prev) => {
      const currentArray = (prev[section] as Record<string, unknown>)[field] as string[];
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
    localStorage.setItem("ssb-worksheet", JSON.stringify(formState));

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

  // Handle worksheet rename
  const handleRename = async (newTitle: string) => {
    const wsId = currentWorksheetId || worksheetId;
    if (!wsId) return;

    await renameWorksheet.mutateAsync({ worksheetId: wsId, title: newTitle });
    setCurrentWorksheetTitle(newTitle);
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get selected star class info for display
  const selectedStarClass = SPECTRAL_CLASSES.find(
    (s) => s.id === formState.primaryStar.spectralClass
  );

  // Get selected configuration info
  const selectedConfig = STELLAR_CONFIGURATIONS.find(
    (c) => c.id === formState.configuration.type
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-24">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={worldId ? `/worlds/${worldId}` : "/"}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">
                {worldId ? `Back to ${worldName || "World"}` : "Back to Tools"}
              </span>
            </Link>
          </div>

          {/* Sync Status */}
          <div className="flex items-center gap-2">
            {worldId && user ? (
              <Badge variant="outline" className="gap-1.5">
                <Cloud className="w-3 h-3" />
                Cloud Sync
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <CloudOff className="w-3 h-3" />
                Local Only
              </Badge>
            )}
            {(currentWorksheetId || worksheetId) && (
              <WorksheetTitle
                title={currentWorksheetTitle}
                onRename={handleRename}
                icon={<FileText className="w-4 h-4 text-primary" />}
                disabled={!user || worksheetLoading}
              />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-light">
                Star System Builder
              </h1>
              <p className="text-sm text-muted-foreground">
                Design multi-planet systems with stellar relationships
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">Pro Tool</Badge>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden mb-6 space-y-4">
          <MobileSectionNav sections={SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} />
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Form Sections */}
          <div className="flex-1 space-y-6 max-w-4xl">
            {/* System Name */}
            <GlassPanel className="p-6">
              <div className="space-y-2">
                <Label htmlFor="system-name" className="text-lg font-medium">
                  System Name
                </Label>
                <Input
                  id="system-name"
                  value={formState.systemName}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, systemName: e.target.value }))
                  }
                  placeholder="e.g., Kepler-442, Tau Ceti, The Forge"
                  className="text-lg"
                />
              </div>
            </GlassPanel>

            {/* Section 1: Primary Star */}
            <CollapsibleSection
              id="section-primary"
              title="1. Primary Star"
              levelNumber={1}
              guidance="The heart of your system. The star's properties determine everything else - habitable zones, planetary formation, and the visual character of your worlds."
              thinkLike="an astronomer cataloging a new discovery"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Star Name</Label>
                  <Input
                    value={formState.primaryStar.name}
                    onChange={(e) => updatePrimaryStar("name", e.target.value)}
                    placeholder="e.g., Sol, Proxima, Kepler-442"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Spectral Class</Label>
                  <p className="text-sm text-muted-foreground">
                    The star's temperature and color determine habitability, planetary formation, and visual atmosphere.
                  </p>
                  <RadioGroup
                    value={formState.primaryStar.spectralClass}
                    onValueChange={(v) => updatePrimaryStar("spectralClass", v)}
                    className="grid gap-3"
                  >
                    {SPECTRAL_CLASSES.map((star) => (
                      <div
                        key={star.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <RadioGroupItem value={star.id} id={star.id} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={star.id} className="font-medium cursor-pointer">
                            {star.name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {star.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Temp: {star.temperature} | Lifetime: {star.lifetime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Show consequences for selected star */}
                {selectedStarClass && (
                  <GlassPanel className="p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm font-medium mb-2">Worldbuilding Implications:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {selectedStarClass.consequences.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      {selectedStarClass.worldbuilding}
                    </p>
                  </GlassPanel>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Luminosity (relative to Sun)</Label>
                    <Input
                      value={formState.primaryStar.luminosity}
                      onChange={(e) => updatePrimaryStar("luminosity", e.target.value)}
                      placeholder="e.g., 1.0, 0.05, 25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mass (relative to Sun)</Label>
                    <Input
                      value={formState.primaryStar.mass}
                      onChange={(e) => updatePrimaryStar("mass", e.target.value)}
                      placeholder="e.g., 1.0, 0.12, 2.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes on Primary Star</Label>
                  <Textarea
                    value={formState.primaryStar.notes}
                    onChange={(e) => updatePrimaryStar("notes", e.target.value)}
                    placeholder="Any special characteristics, variability, or story significance..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 2: Stellar Configuration */}
            <CollapsibleSection
              id="section-configuration"
              title="2. Stellar Configuration"
              levelNumber={2}
              guidance="Most stars have companions. Binary and triple systems create complex orbital dynamics and spectacular sky phenomena."
              thinkLike="a navigator plotting courses through multiple suns"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>System Type</Label>
                  <RadioGroup
                    value={formState.configuration.type}
                    onValueChange={(v) => updateConfiguration("type", v)}
                    className="grid gap-3"
                  >
                    {STELLAR_CONFIGURATIONS.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <RadioGroupItem value={config.id} id={`config-${config.id}`} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`config-${config.id}`} className="font-medium cursor-pointer">
                              {config.name}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {config.stability}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Show configuration consequences */}
                {selectedConfig && (
                  <GlassPanel className="p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm font-medium mb-2">Consequences:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {selectedConfig.consequences.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </GlassPanel>
                )}

                {/* Binary/Multiple star details */}
                {formState.configuration.type !== "single" && (
                  <div className="space-y-4 p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium">Companion Star Details</p>

                    <div className="space-y-2">
                      <Label>Secondary Star Spectral Class</Label>
                      <Select
                        value={formState.configuration.secondaryStarClass}
                        onValueChange={(v) => updateConfiguration("secondaryStarClass", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select spectral class" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECTRAL_CLASSES.map((star) => (
                            <SelectItem key={star.id} value={star.id}>
                              {star.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(formState.configuration.type === "hierarchical-triple" ||
                      formState.configuration.type === "trinary" ||
                      formState.configuration.type === "quadruple") && (
                      <div className="space-y-2">
                        <Label>Tertiary Star Spectral Class</Label>
                        <Select
                          value={formState.configuration.tertiaryStarClass}
                          onValueChange={(v) => updateConfiguration("tertiaryStarClass", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select spectral class" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECTRAL_CLASSES.map((star) => (
                              <SelectItem key={star.id} value={star.id}>
                                {star.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Binary Orbital Period</Label>
                        <Input
                          value={formState.configuration.binaryOrbitalPeriod}
                          onChange={(e) => updateConfiguration("binaryOrbitalPeriod", e.target.value)}
                          placeholder="e.g., 80 years, 11 days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Binary Separation</Label>
                        <Input
                          value={formState.configuration.binarySeparation}
                          onChange={(e) => updateConfiguration("binarySeparation", e.target.value)}
                          placeholder="e.g., 23 AU, 0.05 AU"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Configuration Notes</Label>
                  <Textarea
                    value={formState.configuration.configurationNotes}
                    onChange={(e) => updateConfiguration("configurationNotes", e.target.value)}
                    placeholder="How do the stars interact? What does the sky look like from planets?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 3: Planetary Bodies */}
            <CollapsibleSection
              id="section-bodies"
              title="3. Planetary Bodies"
              levelNumber={3}
              guidance="Define each major body in your system. Consider orbital zones, resonances, and how bodies influence each other."
              thinkLike="a planetary scientist surveying a newly discovered system"
            >
              <div className="space-y-6">
                {formState.bodies.map((body, index) => (
                  <div
                    key={body.id}
                    className="p-4 border border-border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Body {index + 1}</p>
                      {formState.bodies.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBody(body.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={body.name}
                          onChange={(e) => updateBody(body.id, "name", e.target.value)}
                          placeholder="e.g., Kepler-442b, New Terra"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={body.type}
                          onValueChange={(v) => updateBody(body.id, "type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select body type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANETARY_BODY_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {body.type && (
                      <div className="space-y-2">
                        <Label>Subtype</Label>
                        <Select
                          value={body.subtype}
                          onValueChange={(v) => updateBody(body.id, "subtype", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subtype" />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANETARY_BODY_TYPES.find((t) => t.id === body.type)?.subtypes?.map(
                              (sub) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                  {sub.name} - {sub.description}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Orbital Zone</Label>
                        <Select
                          value={body.orbitalZone}
                          onValueChange={(v) => updateBody(body.id, "orbitalZone", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORBITAL_ZONES.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Distance from Star (AU)</Label>
                        <Input
                          value={body.distanceFromStar}
                          onChange={(e) => updateBody(body.id, "distanceFromStar", e.target.value)}
                          placeholder="e.g., 1.0, 5.2, 30"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Orbital Period</Label>
                        <Input
                          value={body.orbitalPeriod}
                          onChange={(e) => updateBody(body.id, "orbitalPeriod", e.target.value)}
                          placeholder="e.g., 365 days, 12 years"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Moons</Label>
                        <Input
                          value={body.moons}
                          onChange={(e) => updateBody(body.id, "moons", e.target.value)}
                          placeholder="e.g., 1 large, 67 (4 major)"
                        />
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`rings-${body.id}`}
                          checked={body.rings}
                          onCheckedChange={(v) => updateBody(body.id, "rings", !!v)}
                        />
                        <Label htmlFor={`rings-${body.id}`} className="text-sm cursor-pointer">
                          Has rings
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`locked-${body.id}`}
                          checked={body.tidallyLocked}
                          onCheckedChange={(v) => updateBody(body.id, "tidallyLocked", !!v)}
                        />
                        <Label htmlFor={`locked-${body.id}`} className="text-sm cursor-pointer">
                          Tidally locked
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={body.notes}
                        onChange={(e) => updateBody(body.id, "notes", e.target.value)}
                        placeholder="Special features, story significance..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addBody} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add Planetary Body
                </Button>
              </div>
            </CollapsibleSection>

            {/* Section 4: Orbital Mechanics */}
            <CollapsibleSection
              id="section-orbits"
              title="4. Orbital Mechanics"
              levelNumber={4}
              guidance="How do orbits interact? Resonances create stability or chaos. Belts and clouds provide resources and hazards."
              thinkLike="a celestial mechanic plotting centuries of motion"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Resonance Pattern</Label>
                  <RadioGroup
                    value={formState.orbits.resonancePattern}
                    onValueChange={(v) => updateOrbits("resonancePattern", v)}
                    className="grid gap-3"
                  >
                    {ORBITAL_RESONANCES.map((res) => (
                      <div
                        key={res.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <RadioGroupItem value={res.id} id={`res-${res.id}`} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={`res-${res.id}`} className="font-medium cursor-pointer">
                            {res.name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {res.description}
                          </p>
                          {res.examples && (
                            <p className="text-xs text-muted-foreground italic">
                              Examples: {res.examples.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Resonance Notes</Label>
                  <Textarea
                    value={formState.orbits.resonanceNotes}
                    onChange={(e) => updateOrbits("resonanceNotes", e.target.value)}
                    placeholder="How do the orbital resonances affect the system? Any special conjunctions or eclipses?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stability Assessment</Label>
                  <Select
                    value={formState.orbits.stabilityAssessment}
                    onValueChange={(v) => updateOrbits("stabilityAssessment", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How stable is the system?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very-stable">Very Stable - Billions of years</SelectItem>
                      <SelectItem value="stable">Stable - Tens of millions of years</SelectItem>
                      <SelectItem value="meta-stable">Meta-stable - Currently stable but could shift</SelectItem>
                      <SelectItem value="chaotic">Chaotic - Unpredictable, ejections possible</SelectItem>
                      <SelectItem value="transitional">Transitional - Currently changing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>System Features</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="kuiper"
                        checked={formState.orbits.kuiperBelt}
                        onCheckedChange={(v) => updateOrbits("kuiperBelt", !!v)}
                      />
                      <Label htmlFor="kuiper" className="text-sm cursor-pointer">
                        Kuiper Belt (outer ice belt)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="oort"
                        checked={formState.orbits.oortCloud}
                        onCheckedChange={(v) => updateOrbits("oortCloud", !!v)}
                      />
                      <Label htmlFor="oort" className="text-sm cursor-pointer">
                        Oort Cloud (cometary reservoir)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Navigation Hazards</Label>
                  <Textarea
                    value={formState.orbits.hazards}
                    onChange={(e) => updateOrbits("hazards", e.target.value)}
                    placeholder="Asteroid belts, radiation zones, debris fields, gravitational anomalies..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 5: System History */}
            <CollapsibleSection
              id="section-history"
              title="5. System History"
              levelNumber={5}
              guidance="Every system has a history written in its architecture. Formation events, collisions, and migrations shape what exists today."
              thinkLike="a cosmic archaeologist reading orbital fossils"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>System Age</Label>
                  <RadioGroup
                    value={formState.history.age}
                    onValueChange={(v) => updateHistory("age", v)}
                    className="grid gap-3"
                  >
                    {SYSTEM_AGES.map((age) => (
                      <div
                        key={age.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <RadioGroupItem value={age.id} id={`age-${age.id}`} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={`age-${age.id}`} className="font-medium cursor-pointer">
                            {age.name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {age.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Formation Scenario</Label>
                  <Select
                    value={formState.history.formationScenario}
                    onValueChange={(v) => updateHistory("formationScenario", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How did the system form?" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATION_SCENARIOS.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Major Historical Events</Label>
                  <Textarea
                    value={formState.history.majorEvents}
                    onChange={(e) => updateHistory("majorEvents", e.target.value)}
                    placeholder="Giant impacts, planetary ejections, capture events, stellar evolution..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Collision History</Label>
                  <Textarea
                    value={formState.history.collisionHistory}
                    onChange={(e) => updateHistory("collisionHistory", e.target.value)}
                    placeholder="Major impacts that shaped planets, created moons, or left scars..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Migration History</Label>
                  <Textarea
                    value={formState.history.migrationHistory}
                    onChange={(e) => updateHistory("migrationHistory", e.target.value)}
                    placeholder="Did any planets move from their formation locations? Hot Jupiter migration?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Future Projection</Label>
                  <Textarea
                    value={formState.history.futureProjection}
                    onChange={(e) => updateHistory("futureProjection", e.target.value)}
                    placeholder="What will happen to this system? Stellar death? Orbital instability?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 6: Habitability */}
            <CollapsibleSection
              id="section-habitability"
              title="6. Habitability"
              levelNumber={6}
              guidance="Where could life exist? Consider the habitable zone, but also moons, subsurface oceans, and exotic possibilities."
              thinkLike="an astrobiologist searching for life"
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Habitable Zone Inner Edge (AU)</Label>
                    <Input
                      value={formState.habitability.habitableZoneInner}
                      onChange={(e) => updateHabitability("habitableZoneInner", e.target.value)}
                      placeholder="e.g., 0.95"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Habitable Zone Outer Edge (AU)</Label>
                    <Input
                      value={formState.habitability.habitableZoneOuter}
                      onChange={(e) => updateHabitability("habitableZoneOuter", e.target.value)}
                      placeholder="e.g., 1.37"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Habitability Modifiers</Label>
                  <p className="text-sm text-muted-foreground">
                    Factors that extend or contract the habitable zone
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {HZ_MODIFIERS.map((mod) => (
                      <div
                        key={mod.id}
                        className="flex items-start gap-2 p-2 rounded border border-border"
                      >
                        <Checkbox
                          id={`mod-${mod.id}`}
                          checked={formState.habitability.modifiers.includes(mod.id)}
                          onCheckedChange={() => toggleArrayItem("habitability", "modifiers", mod.id)}
                        />
                        <div>
                          <Label htmlFor={`mod-${mod.id}`} className="text-sm cursor-pointer">
                            {mod.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Best Habitability Candidate</Label>
                  <Textarea
                    value={formState.habitability.bestCandidate}
                    onChange={(e) => updateHabitability("bestCandidate", e.target.value)}
                    placeholder="Which body is most promising for life? Why?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Terraforming Potential</Label>
                  <Textarea
                    value={formState.habitability.terraformingPotential}
                    onChange={(e) => updateHabitability("terraformingPotential", e.target.value)}
                    placeholder="Which bodies could be terraformed? What would it take?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resource Richness</Label>
                  <Textarea
                    value={formState.habitability.resourceRichness}
                    onChange={(e) => updateHabitability("resourceRichness", e.target.value)}
                    placeholder="Water ice, metals, fuel, rare elements - what's available and where?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 7: Narrative Elements */}
            <CollapsibleSection
              id="section-narrative"
              title="7. Narrative Elements"
              levelNumber={7}
              guidance="Transform astronomical data into story. What makes this system memorable? What stories does it want to tell?"
              thinkLike="a writer using astronomy as worldbuilding"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>System Character</Label>
                  <p className="text-sm text-muted-foreground">
                    If this system were a character, what would its personality be?
                  </p>
                  <Textarea
                    value={formState.narrative.systemCharacter}
                    onChange={(e) => updateNarrative("systemCharacter", e.target.value)}
                    placeholder="Ancient and patient? Young and violent? Orderly and predictable? Chaotic and mysterious?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visual Signature</Label>
                  <p className="text-sm text-muted-foreground">
                    What would you see from a ship entering this system?
                  </p>
                  <Textarea
                    value={formState.narrative.visualSignature}
                    onChange={(e) => updateNarrative("visualSignature", e.target.value)}
                    placeholder="The dominant colors, the most striking features, what makes it recognizable..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Navigation Challenges</Label>
                  <Textarea
                    value={formState.narrative.navigationChallenges}
                    onChange={(e) => updateNarrative("navigationChallenges", e.target.value)}
                    placeholder="What makes traveling through this system difficult or dangerous?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Typical Travel Times</Label>
                  <Textarea
                    value={formState.narrative.travelTimes}
                    onChange={(e) => updateNarrative("travelTimes", e.target.value)}
                    placeholder="How long to travel between major bodies? With what propulsion?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cultural Significance</Label>
                  <Textarea
                    value={formState.narrative.culturalSignificance}
                    onChange={(e) => updateNarrative("culturalSignificance", e.target.value)}
                    placeholder="How do inhabitants view their system? Religious significance? Origin myths?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mysteries</Label>
                  <Textarea
                    value={formState.narrative.mysteries}
                    onChange={(e) => updateNarrative("mysteries", e.target.value)}
                    placeholder="What's unexplained? Anomalies, artifacts, missing planets, strange signals..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Story Hooks</Label>
                  <Textarea
                    value={formState.narrative.storyHooks}
                    onChange={(e) => updateNarrative("storyHooks", e.target.value)}
                    placeholder="What conflicts, adventures, or discoveries does this system enable?"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* SF Examples */}
            <CollapsibleSection
              id="section-examples"
              title="SF Examples"
              levelNumber={8}
              guidance="See how other creators have used star system design to enhance their worldbuilding."
            >
              <div className="space-y-4">
                {SF_SYSTEM_EXAMPLES.map((example, i) => (
                  <GlassPanel key={i} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{example.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {example.configuration}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          {example.description}
                        </p>
                        <p className="text-sm text-primary mt-2 italic">
                          {example.notable}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </CollapsibleSection>

            {/* Final Synthesis */}
            <CollapsibleSection
              id="section-synthesis"
              title="Final Synthesis"
              levelNumber={9}
              guidance="Bring it all together. Check consistency and articulate what makes this system unique."
              thinkLike="an editor reviewing for internal logic"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Consistency Checks</Label>
                  <p className="text-sm text-muted-foreground">
                    Verify your system makes physical sense
                  </p>
                  <div className="space-y-2">
                    {[
                      "Star type matches planetary formation expectations",
                      "Habitable zone placement is consistent with star luminosity",
                      "Orbital resonances are physically possible",
                      "System age allows for current state to have developed",
                      "Binary/multiple star configuration allows stable planetary orbits",
                    ].map((check) => (
                      <div key={check} className="flex items-center gap-2">
                        <Checkbox
                          id={`check-${check}`}
                          checked={formState.synthesis.consistencyChecks.includes(check)}
                          onCheckedChange={() =>
                            toggleArrayItem("synthesis", "consistencyChecks", check)
                          }
                        />
                        <Label htmlFor={`check-${check}`} className="text-sm cursor-pointer">
                          {check}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Conflict/Tension</Label>
                  <Textarea
                    value={formState.synthesis.primaryConflict}
                    onChange={(e) => updateSynthesis("primaryConflict", e.target.value)}
                    placeholder="What's the central tension in this system? Resource competition? Environmental threat? Political division?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unique Feature</Label>
                  <Textarea
                    value={formState.synthesis.uniqueFeature}
                    onChange={(e) => updateSynthesis("uniqueFeature", e.target.value)}
                    placeholder="What single feature makes this system memorable and different from others?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Connection to Planetary Profile</Label>
                  <Textarea
                    value={formState.synthesis.connectionToPlanetary}
                    onChange={(e) => updateSynthesis("connectionToPlanetary", e.target.value)}
                    placeholder="How does this system context inform individual planet designs? What should carry over?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>One-Sentence Summary</Label>
                  <Textarea
                    value={formState.synthesis.oneSentenceSummary}
                    onChange={(e) => updateSynthesis("oneSentenceSummary", e.target.value)}
                    placeholder="Describe your entire system in one evocative sentence."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Notes & Ideas Section */}
            <CollapsibleSection
              id="section-notes"
              title="Notes & Ideas"
              icon={<FileText className="w-5 h-5 text-primary" />}
              defaultOpen={false}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Jot down ideas, story hooks, or reminders for this worksheet.
                </p>
                <Textarea
                  placeholder="Your notes and ideas..."
                  value={formState.generalNotes}
                  onChange={(e) => setFormState(prev => ({ ...prev, generalNotes: e.target.value }))}
                  className="min-h-[150px] resize-y"
                />
              </div>
            </CollapsibleSection>

            {/* Moodboard Section */}
            <CollapsibleSection
              id="section-moodboard"
              title="Moodboard"
              icon={<ImageIcon className="w-5 h-5 text-primary" />}
              defaultOpen={false}
              badge={formState.moodboard?.length || undefined}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add reference images to inspire your design.
                </p>
                <MoodboardSection
                  worksheetId={currentWorksheetId || "local"}
                  images={formState.moodboard || []}
                  onImagesChange={(images) => setFormState(prev => ({ ...prev, moodboard: images }))}
                />
              </div>
            </CollapsibleSection>
          </div>

          {/* Sidebar */}
          <ToolSidebar>
            <SectionNavigation sections={SECTIONS} />
            <KeyChoicesSidebar sections={keyChoicesSections} />
          </ToolSidebar>
        </div>
      </main>

      <Footer />

      {/* Action Bar */}
      <ToolActionBar
        onSave={handleSave}
        onExport={handleExport}
        onPrint={handlePrint}
        isSaving={updateWorksheet.isPending}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Star System Builder"
        worksheetTitle={currentWorksheetTitle || formState.systemName || "Star System"}
        formState={formState}
        worldName={worldName}
      />

      {/* Worksheet Selector Dialog */}
      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId!}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Star System Builder"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        toolName="Star System Builder"
      />
    </div>
  );
};

export default StarSystemBuilder;
