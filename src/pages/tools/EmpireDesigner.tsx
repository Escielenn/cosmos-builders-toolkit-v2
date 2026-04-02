import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";
import { useSearchParams } from "react-router-dom";
import { Download, Save, Info, Printer, Plus, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
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
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import SectionNavigation, { Section, MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection, MobileKeyChoices } from "@/components/tools/KeyChoicesSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import { EmpireSummaryTemplate, EmpireFullReportTemplate } from "@/lib/pdf/templates";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { useTags } from "@/hooks/use-tags";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
import { useWorlds } from "@/hooks/use-worlds";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import { Json } from "@/integrations/supabase/types";
import {
  GOVERNMENT_TYPES,
  LEGITIMACY_SOURCES,
  POWER_BRANCHES,
  SUCCESSION_METHODS,
  TERRITORY_SCALES,
  ECONOMIC_SYSTEMS,
  MILITARY_DOCTRINES,
  CULTURAL_VALUES,
  FACTION_TYPES,
  DIPLOMATIC_STANCES,
  STABILITY_FACTORS,
  SF_EMPIRE_EXAMPLES,
} from "@/lib/empire-data";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

const SECTIONS: Section[] = [
  { id: "section-foundation", title: "1. Foundation" },
  { id: "section-power", title: "2. Power Structure" },
  { id: "section-territory", title: "3. Territory & Scale" },
  { id: "section-economy", title: "4. Economy" },
  { id: "section-military", title: "5. Military" },
  { id: "section-culture", title: "6. Culture & Identity" },
  { id: "section-factions", title: "7. Internal Factions" },
  { id: "section-external", title: "8. External Relations" },
  { id: "section-stability", title: "9. Stability" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Final Synthesis" },
];

interface Foundation {
  name: string;
  governmentType: string;
  governmentSubtype: string;
  legitimacySource: string;
  age: string;
  foundingStory: string;
  rulerTitle: string;
  currentRuler: string;
}

interface PowerStructure {
  branches: string[];
  checksAndBalances: string;
  successionMethod: string;
  powerCenters: string;
  bureaucracyStyle: string;
  corruptionLevel: string;
}

interface TerritoryScale {
  scale: string;
  population: string;
  capitalLocation: string;
  regions: string;
  administrationStyle: string;
  bordersSecurity: string;
}

interface Economy {
  system: string;
  primaryResources: string;
  tradeRelations: string;
  currency: string;
  wealthDistribution: string;
  economicChallenges: string;
}

interface Military {
  doctrine: string;
  size: string;
  technology: string;
  specialUnits: string;
  veteranStatus: string;
  civilianRelations: string;
}

interface Culture {
  coreValues: string[];
  symbols: string;
  propaganda: string;
  language: string;
  religion: string;
  socialClasses: string;
  culturalTaboos: string;
}

interface Faction {
  id: string;
  name: string;
  type: string;
  goals: string;
  strength: string;
  leader: string;
}

interface ExternalRelations {
  diplomaticStance: string;
  allies: string;
  enemies: string;
  treaties: string;
  foreignPerception: string;
  expansionPlans: string;
}

interface Stability {
  strengths: string[];
  vulnerabilities: string[];
  currentCrisis: string;
  trajectory: string;
  projectedLifespan: string;
}

interface Synthesis {
  primaryConflict: string;
  uniqueFeature: string;
  storyPotential: string;
  consistencyNotes: string;
  oneSentenceSummary: string;
}

interface FormState {
  foundation: Foundation;
  power: PowerStructure;
  territory: TerritoryScale;
  economy: Economy;
  military: Military;
  culture: Culture;
  factions: Faction[];
  external: ExternalRelations;
  stability: Stability;
  synthesis: Synthesis;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const createEmptyFaction = (): Faction => ({
  id: crypto.randomUUID(),
  name: "",
  type: "",
  goals: "",
  strength: "",
  leader: "",
});

const initialFormState: FormState = {
  foundation: {
    name: "",
    governmentType: "",
    governmentSubtype: "",
    legitimacySource: "",
    age: "",
    foundingStory: "",
    rulerTitle: "",
    currentRuler: "",
  },
  power: {
    branches: [],
    checksAndBalances: "",
    successionMethod: "",
    powerCenters: "",
    bureaucracyStyle: "",
    corruptionLevel: "",
  },
  territory: {
    scale: "",
    population: "",
    capitalLocation: "",
    regions: "",
    administrationStyle: "",
    bordersSecurity: "",
  },
  economy: {
    system: "",
    primaryResources: "",
    tradeRelations: "",
    currency: "",
    wealthDistribution: "",
    economicChallenges: "",
  },
  military: {
    doctrine: "",
    size: "",
    technology: "",
    specialUnits: "",
    veteranStatus: "",
    civilianRelations: "",
  },
  culture: {
    coreValues: [],
    symbols: "",
    propaganda: "",
    language: "",
    religion: "",
    socialClasses: "",
    culturalTaboos: "",
  },
  factions: [createEmptyFaction()],
  external: {
    diplomaticStance: "",
    allies: "",
    enemies: "",
    treaties: "",
    foreignPerception: "",
    expansionPlans: "",
  },
  stability: {
    strengths: [],
    vulnerabilities: [],
    currentCrisis: "",
    trajectory: "",
    projectedLifespan: "",
  },
  synthesis: {
    primaryConflict: "",
    uniqueFeature: "",
    storyPotential: "",
    consistencyNotes: "",
    oneSentenceSummary: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "empire-designer";

const EmpireDesigner = () => {
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
  const { updateWorksheetTags } = useTags();

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
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);

  useEffect(() => {
    if (user && !isSubscribed) {
      setUpgradeDialogOpen(true);
    }
  }, [user, isSubscribed]);

  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet?.tags) {
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

  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem("ed-worksheet");
      if (saved) {
        try {
          setFormState(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [worldId, worksheetId]);

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const govType = GOVERNMENT_TYPES.find(g => g.id === formState.foundation.governmentType);
    const scale = TERRITORY_SCALES.find(s => s.id === formState.territory.scale);
    const factionCount = formState.factions.filter(f => f.name).length;

    return [
      {
        id: "foundation",
        title: "1. Foundation",
        choices: [
          { label: "Name", value: formState.foundation.name || undefined },
          { label: "Government", value: govType?.name || undefined },
          { label: "Ruler", value: formState.foundation.currentRuler || undefined },
        ],
      },
      {
        id: "power",
        title: "2. Power",
        choices: [
          { label: "Branches", value: formState.power.branches.length > 0 ? `${formState.power.branches.length} active` : undefined },
          { label: "Succession", value: formState.power.successionMethod || undefined },
        ],
      },
      {
        id: "territory",
        title: "3. Territory",
        choices: [
          { label: "Scale", value: scale?.name || undefined },
          { label: "Capital", value: formState.territory.capitalLocation || undefined },
        ],
      },
      {
        id: "economy",
        title: "4. Economy",
        choices: [
          { label: "System", value: formState.economy.system || undefined },
        ],
      },
      {
        id: "military",
        title: "5. Military",
        choices: [
          { label: "Doctrine", value: formState.military.doctrine || undefined },
        ],
      },
      {
        id: "culture",
        title: "6. Culture",
        choices: [
          { label: "Values", value: formState.culture.coreValues.length > 0 ? `${formState.culture.coreValues.length} core` : undefined },
        ],
      },
      {
        id: "factions",
        title: "7. Factions",
        choices: [
          { label: "Groups", value: factionCount > 0 ? `${factionCount} defined` : undefined },
        ],
      },
      {
        id: "external",
        title: "8. External",
        choices: [
          { label: "Stance", value: formState.external.diplomaticStance || undefined },
        ],
      },
      {
        id: "stability",
        title: "9. Stability",
        choices: [
          { label: "Trajectory", value: formState.stability.trajectory || undefined },
        ],
      },
    ];
  }, [formState]);

  const updateFoundation = (field: keyof Foundation, value: string) => {
    setFormState((prev) => ({
      ...prev,
      foundation: { ...prev.foundation, [field]: value },
    }));
  };

  const updatePower = (field: keyof PowerStructure, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      power: { ...prev.power, [field]: value },
    }));
  };

  const updateTerritory = (field: keyof TerritoryScale, value: string) => {
    setFormState((prev) => ({
      ...prev,
      territory: { ...prev.territory, [field]: value },
    }));
  };

  const updateEconomy = (field: keyof Economy, value: string) => {
    setFormState((prev) => ({
      ...prev,
      economy: { ...prev.economy, [field]: value },
    }));
  };

  const updateMilitary = (field: keyof Military, value: string) => {
    setFormState((prev) => ({
      ...prev,
      military: { ...prev.military, [field]: value },
    }));
  };

  const updateCulture = (field: keyof Culture, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      culture: { ...prev.culture, [field]: value },
    }));
  };

  const updateFaction = (id: string, field: keyof Faction, value: string) => {
    setFormState((prev) => ({
      ...prev,
      factions: prev.factions.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    }));
  };

  const addFaction = () => {
    setFormState((prev) => ({
      ...prev,
      factions: [...prev.factions, createEmptyFaction()],
    }));
  };

  const removeFaction = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      factions: prev.factions.filter((f) => f.id !== id),
    }));
  };

  const updateExternal = (field: keyof ExternalRelations, value: string) => {
    setFormState((prev) => ({
      ...prev,
      external: { ...prev.external, [field]: value },
    }));
  };

  const updateStability = (field: keyof Stability, value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      stability: { ...prev.stability, [field]: value },
    }));
  };

  const updateSynthesis = (field: keyof Synthesis, value: string) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const toggleArrayItem = (
    section: "power" | "culture" | "stability",
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
    localStorage.setItem("ed-worksheet", JSON.stringify(formState));

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

  const handleTagsChange = (newTags: string[]) => {
    setWorksheetTags(newTags);
    const wsId = currentWorksheetId || worksheetId;
    if (wsId) {
      updateWorksheetTags.mutate({ worksheetId: wsId, tags: newTags });
    }
  };

  const selectedGovType = GOVERNMENT_TYPES.find(
    (g) => g.id === formState.foundation.governmentType
  );

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onExport={() => setExportDialogOpen(true)}
      onPrint={() => window.print()}
      onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      isSaving={updateWorksheet.isPending}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Dominion"
          worldName={worldName}
          formState={formState}
          summaryTemplate={<EmpireSummaryTemplate formState={formState} worldName={worldName} />}
          fullTemplate={<EmpireFullReportTemplate formState={formState} worldName={worldName} />}
          defaultFilename="empire-designer"
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
        {/* Mobile Sidebars - Right side floating buttons */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} />
        </div>

        <div className="space-y-6">

            {/* Section 1: Foundation */}
            <CollapsibleSection
              id="section-foundation"
              title="Foundation"
              levelNumber={1}
              guidance="Every government has a foundation - the type of rule, source of legitimacy, and origin story that defines its identity."
              thinkLike="a political scientist categorizing a new regime"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Empire/Nation Name</Label>
                  <Input
                    value={formState.foundation.name}
                    onChange={(e) => updateFoundation("name", e.target.value)}
                    placeholder="e.g., The Terran Hegemony, Republic of Nova"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Government Type</Label>
                  <RadioGroup
                    value={formState.foundation.governmentType}
                    onValueChange={(v) => updateFoundation("governmentType", v)}
                    className="grid gap-3"
                  >
                    {GOVERNMENT_TYPES.map((gov) => (
                      <div
                        key={gov.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <RadioGroupItem value={gov.id} id={gov.id} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={gov.id} className="font-medium cursor-pointer">
                            {gov.name}
                          </Label>
                          <p className="text-xs text-tier-4 mt-1">
                            {gov.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {selectedGovType && selectedGovType.subtypes && (
                  <div className="space-y-2">
                    <Label>Subtype</Label>
                    <Select
                      value={formState.foundation.governmentSubtype}
                      onValueChange={(v) => updateFoundation("governmentSubtype", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subtype" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedGovType.subtypes.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name} - {sub.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedGovType && (
                  <GlassPanel className="p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm font-medium mb-2">Consequences of {selectedGovType.name}:</p>
                    <ul className="text-sm text-tier-3 space-y-1">
                      {selectedGovType.consequences.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </GlassPanel>
                )}

                <div className="space-y-2">
                  <Label>Source of Legitimacy</Label>
                  <Select
                    value={formState.foundation.legitimacySource}
                    onValueChange={(v) => updateFoundation("legitimacySource", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Why do people accept this rule?" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGITIMACY_SOURCES.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name} - {source.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ruler's Title</Label>
                    <Input
                      value={formState.foundation.rulerTitle}
                      onChange={(e) => updateFoundation("rulerTitle", e.target.value)}
                      placeholder="e.g., Emperor, President, High Council"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Ruler</Label>
                    <Input
                      value={formState.foundation.currentRuler}
                      onChange={(e) => updateFoundation("currentRuler", e.target.value)}
                      placeholder="Name of current ruler(s)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Age of the State</Label>
                  <Input
                    value={formState.foundation.age}
                    onChange={(e) => updateFoundation("age", e.target.value)}
                    placeholder="e.g., 500 years, 3 generations, ancient"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Founding Story</Label>
                  <Textarea
                    value={formState.foundation.foundingStory}
                    onChange={(e) => updateFoundation("foundingStory", e.target.value)}
                    placeholder="How did this government come to power? What's the origin myth?"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 2: Power Structure */}
            <CollapsibleSection
              id="section-power"
              title="Power Structure"
              levelNumber={2}
              guidance="How is power organized and transferred? The structure determines stability, efficiency, and who really rules."
              thinkLike="a constitutional scholar analyzing checks and balances"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Active Branches/Power Centers</Label>
                  <p className="text-sm text-tier-3">
                    Select all that have significant independent power
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {POWER_BRANCHES.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-start gap-2 p-2 rounded border border-border"
                      >
                        <Checkbox
                          id={`branch-${branch.id}`}
                          checked={formState.power.branches.includes(branch.id)}
                          onCheckedChange={() => toggleArrayItem("power", "branches", branch.id)}
                        />
                        <div>
                          <Label htmlFor={`branch-${branch.id}`} className="text-sm cursor-pointer">
                            {branch.name}
                          </Label>
                          <p className="text-xs text-tier-4">{branch.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Checks and Balances</Label>
                  <Textarea
                    value={formState.power.checksAndBalances}
                    onChange={(e) => updatePower("checksAndBalances", e.target.value)}
                    placeholder="How do power centers limit each other? What prevents abuse?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Succession Method</Label>
                  <Select
                    value={formState.power.successionMethod}
                    onValueChange={(v) => updatePower("successionMethod", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How does power transfer?" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUCCESSION_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name} - {method.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Informal Power Centers</Label>
                  <Textarea
                    value={formState.power.powerCenters}
                    onChange={(e) => updatePower("powerCenters", e.target.value)}
                    placeholder="Who has power outside official structures? Advisors, families, corporations?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bureaucracy Style</Label>
                  <Textarea
                    value={formState.power.bureaucracyStyle}
                    onChange={(e) => updatePower("bureaucracyStyle", e.target.value)}
                    placeholder="How efficient is administration? Meritocratic, nepotistic, corrupt?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Corruption Level</Label>
                  <Select
                    value={formState.power.corruptionLevel}
                    onValueChange={(v) => updatePower("corruptionLevel", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How corrupt is the system?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal - rare and punished</SelectItem>
                      <SelectItem value="low">Low - exists but controlled</SelectItem>
                      <SelectItem value="moderate">Moderate - common at local level</SelectItem>
                      <SelectItem value="high">High - endemic throughout</SelectItem>
                      <SelectItem value="systemic">Systemic - built into the system</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 3: Territory */}
            <CollapsibleSection
              id="section-territory"
              title="Territory & Scale"
              levelNumber={3}
              guidance="Size matters. A city-state governs differently than a galactic empire. Scale shapes everything."
              thinkLike="a geographer mapping spheres of influence"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <Select
                    value={formState.territory.scale}
                    onValueChange={(v) => updateTerritory("scale", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How large is this state?" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERRITORY_SCALES.map((scale) => (
                        <SelectItem key={scale.id} value={scale.id}>
                          {scale.name} - {scale.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Population</Label>
                    <Input
                      value={formState.territory.population}
                      onChange={(e) => updateTerritory("population", e.target.value)}
                      placeholder="e.g., 12 billion, 500 million"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capital Location</Label>
                    <Input
                      value={formState.territory.capitalLocation}
                      onChange={(e) => updateTerritory("capitalLocation", e.target.value)}
                      placeholder="Name and significance of capital"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Regions/Divisions</Label>
                  <Textarea
                    value={formState.territory.regions}
                    onChange={(e) => updateTerritory("regions", e.target.value)}
                    placeholder="Major regions, provinces, sectors. Any with special status?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Administration Style</Label>
                  <Textarea
                    value={formState.territory.administrationStyle}
                    onChange={(e) => updateTerritory("administrationStyle", e.target.value)}
                    placeholder="Centralized vs. federated? How much local autonomy?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Borders & Security</Label>
                  <Textarea
                    value={formState.territory.bordersSecurity}
                    onChange={(e) => updateTerritory("bordersSecurity", e.target.value)}
                    placeholder="How are borders defended? Open or closed? Disputed territories?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Economy */}
            <CollapsibleSection
              id="section-economy"
              title="Economy & Resources"
              levelNumber={4}
              guidance="Economics shapes politics. Who controls resources controls power. What does this state produce and trade?"
              thinkLike="an economist analyzing resource flows"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Economic System</Label>
                  <Select
                    value={formState.economy.system}
                    onValueChange={(v) => updateEconomy("system", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="What economic model?" />
                    </SelectTrigger>
                    <SelectContent>
                      {ECONOMIC_SYSTEMS.map((sys) => (
                        <SelectItem key={sys.id} value={sys.id}>
                          {sys.name} - {sys.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Primary Resources/Industries</Label>
                  <Textarea
                    value={formState.economy.primaryResources}
                    onChange={(e) => updateEconomy("primaryResources", e.target.value)}
                    placeholder="What does this state produce? What resources does it control?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trade Relations</Label>
                  <Textarea
                    value={formState.economy.tradeRelations}
                    onChange={(e) => updateEconomy("tradeRelations", e.target.value)}
                    placeholder="Who do they trade with? What do they import/export?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    value={formState.economy.currency}
                    onChange={(e) => updateEconomy("currency", e.target.value)}
                    placeholder="Name and nature of currency, or barter/credit systems"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Wealth Distribution</Label>
                  <Textarea
                    value={formState.economy.wealthDistribution}
                    onChange={(e) => updateEconomy("wealthDistribution", e.target.value)}
                    placeholder="How equal/unequal? Social mobility? Class structure?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Economic Challenges</Label>
                  <Textarea
                    value={formState.economy.economicChallenges}
                    onChange={(e) => updateEconomy("economicChallenges", e.target.value)}
                    placeholder="Debt, inflation, unemployment, resource depletion?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 5: Military */}
            <CollapsibleSection
              id="section-military"
              title="Military & Security"
              levelNumber={5}
              guidance="The monopoly on violence. How does this state defend itself and project power?"
              thinkLike="a military strategist assessing capabilities"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Military Doctrine</Label>
                  <Select
                    value={formState.military.doctrine}
                    onValueChange={(v) => updateMilitary("doctrine", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="What's the military philosophy?" />
                    </SelectTrigger>
                    <SelectContent>
                      {MILITARY_DOCTRINES.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name} - {doc.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Military Size</Label>
                    <Input
                      value={formState.military.size}
                      onChange={(e) => updateMilitary("size", e.target.value)}
                      placeholder="e.g., 2 million active, 10% of population"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technology Level</Label>
                    <Input
                      value={formState.military.technology}
                      onChange={(e) => updateMilitary("technology", e.target.value)}
                      placeholder="Relative to neighbors and era"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Special Units/Capabilities</Label>
                  <Textarea
                    value={formState.military.specialUnits}
                    onChange={(e) => updateMilitary("specialUnits", e.target.value)}
                    placeholder="Elite forces, unique weapons, special capabilities?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Veteran Status</Label>
                  <Textarea
                    value={formState.military.veteranStatus}
                    onChange={(e) => updateMilitary("veteranStatus", e.target.value)}
                    placeholder="Recent wars? Battle-hardened or untested? Morale?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Military-Civilian Relations</Label>
                  <Textarea
                    value={formState.military.civilianRelations}
                    onChange={(e) => updateMilitary("civilianRelations", e.target.value)}
                    placeholder="How is the military viewed? Civilian control or military influence?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 6: Culture */}
            <CollapsibleSection
              id="section-culture"
              title="Culture & Identity"
              levelNumber={6}
              guidance="What binds the people together? Shared values, symbols, and beliefs create national identity."
              thinkLike="an anthropologist studying national character"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Core Cultural Values</Label>
                  <div className="grid md:grid-cols-3 gap-2">
                    {CULTURAL_VALUES.map((value) => (
                      <div key={value.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`value-${value.id}`}
                          checked={formState.culture.coreValues.includes(value.id)}
                          onCheckedChange={() => toggleArrayItem("culture", "coreValues", value.id)}
                        />
                        <Label htmlFor={`value-${value.id}`} className="text-sm cursor-pointer">
                          {value.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>National Symbols</Label>
                  <Textarea
                    value={formState.culture.symbols}
                    onChange={(e) => updateCulture("symbols", e.target.value)}
                    placeholder="Flag, anthem, monuments, heroes, founding myths..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Propaganda/Media</Label>
                  <Textarea
                    value={formState.culture.propaganda}
                    onChange={(e) => updateCulture("propaganda", e.target.value)}
                    placeholder="How does the state shape public opinion? Free or controlled media?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Language(s)</Label>
                  <Input
                    value={formState.culture.language}
                    onChange={(e) => updateCulture("language", e.target.value)}
                    placeholder="Official language(s), linguistic diversity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Religion/Spirituality</Label>
                  <Textarea
                    value={formState.culture.religion}
                    onChange={(e) => updateCulture("religion", e.target.value)}
                    placeholder="State religion? Religious freedom? Role of faith in governance?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Social Classes</Label>
                  <Textarea
                    value={formState.culture.socialClasses}
                    onChange={(e) => updateCulture("socialClasses", e.target.value)}
                    placeholder="What are the social strata? How rigid? How visible?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cultural Taboos</Label>
                  <Textarea
                    value={formState.culture.culturalTaboos}
                    onChange={(e) => updateCulture("culturalTaboos", e.target.value)}
                    placeholder="What's forbidden? What topics are never discussed?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 7: Factions */}
            <CollapsibleSection
              id="section-factions"
              title="Internal Factions"
              levelNumber={7}
              guidance="No state is monolithic. Internal groups compete for power and push different agendas."
              thinkLike="a political operative mapping the landscape"
            >
              <div className="space-y-6">
                {formState.factions.map((faction, index) => (
                  <div
                    key={faction.id}
                    className="p-4 border border-border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Faction {index + 1}</p>
                      {formState.factions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFaction(faction.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Faction Name</Label>
                        <Input
                          value={faction.name}
                          onChange={(e) => updateFaction(faction.id, "name", e.target.value)}
                          placeholder="e.g., The Reformist Coalition"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Faction Type</Label>
                        <Select
                          value={faction.type}
                          onValueChange={(v) => updateFaction(faction.id, "type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACTION_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Goals</Label>
                      <Textarea
                        value={faction.goals}
                        onChange={(e) => updateFaction(faction.id, "goals", e.target.value)}
                        placeholder="What does this faction want?"
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Strength/Influence</Label>
                        <Input
                          value={faction.strength}
                          onChange={(e) => updateFaction(faction.id, "strength", e.target.value)}
                          placeholder="e.g., Strong, Growing, Declining"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Key Leader(s)</Label>
                        <Input
                          value={faction.leader}
                          onChange={(e) => updateFaction(faction.id, "leader", e.target.value)}
                          placeholder="Named leaders or type of leadership"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addFaction} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add Faction
                </Button>
              </div>
            </CollapsibleSection>

            {/* Section 8: External Relations */}
            <CollapsibleSection
              id="section-external"
              title="External Relations"
              levelNumber={8}
              guidance="No state exists in isolation. Allies, enemies, and neutral parties shape foreign policy."
              thinkLike="a diplomat mapping international relationships"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Diplomatic Stance</Label>
                  <Select
                    value={formState.external.diplomaticStance}
                    onValueChange={(v) => updateExternal("diplomaticStance", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="General approach to foreign relations" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIPLOMATIC_STANCES.map((stance) => (
                        <SelectItem key={stance.id} value={stance.id}>
                          {stance.name} - {stance.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Allies</Label>
                  <Textarea
                    value={formState.external.allies}
                    onChange={(e) => updateExternal("allies", e.target.value)}
                    placeholder="Who are the friends? How strong are these alliances?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Enemies/Rivals</Label>
                  <Textarea
                    value={formState.external.enemies}
                    onChange={(e) => updateExternal("enemies", e.target.value)}
                    placeholder="Who are the adversaries? Historical grudges? Active conflicts?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Treaties & Obligations</Label>
                  <Textarea
                    value={formState.external.treaties}
                    onChange={(e) => updateExternal("treaties", e.target.value)}
                    placeholder="Major treaties, alliances, international organizations"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>How Others See Them</Label>
                  <Textarea
                    value={formState.external.foreignPerception}
                    onChange={(e) => updateExternal("foreignPerception", e.target.value)}
                    placeholder="Reputation abroad. Respected? Feared? Pitied?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expansion Plans</Label>
                  <Textarea
                    value={formState.external.expansionPlans}
                    onChange={(e) => updateExternal("expansionPlans", e.target.value)}
                    placeholder="Territorial ambitions? Defensive posture? Colonial interests?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 9: Stability */}
            <CollapsibleSection
              id="section-stability"
              title="Stability Assessment"
              levelNumber={9}
              guidance="Every state has strengths and weaknesses. Understanding them reveals where stories emerge."
              thinkLike="a risk analyst predicting the future"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Strengths</Label>
                  <div className="grid md:grid-cols-2 gap-2">
                    {STABILITY_FACTORS.strengths.map((strength) => (
                      <div key={strength} className="flex items-center gap-2">
                        <Checkbox
                          id={`strength-${strength}`}
                          checked={formState.stability.strengths.includes(strength)}
                          onCheckedChange={() => toggleArrayItem("stability", "strengths", strength)}
                        />
                        <Label htmlFor={`strength-${strength}`} className="text-sm cursor-pointer">
                          {strength}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Vulnerabilities</Label>
                  <div className="grid md:grid-cols-2 gap-2">
                    {STABILITY_FACTORS.vulnerabilities.map((vuln) => (
                      <div key={vuln} className="flex items-center gap-2">
                        <Checkbox
                          id={`vuln-${vuln}`}
                          checked={formState.stability.vulnerabilities.includes(vuln)}
                          onCheckedChange={() => toggleArrayItem("stability", "vulnerabilities", vuln)}
                        />
                        <Label htmlFor={`vuln-${vuln}`} className="text-sm cursor-pointer">
                          {vuln}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Crisis</Label>
                  <Textarea
                    value={formState.stability.currentCrisis}
                    onChange={(e) => updateStability("currentCrisis", e.target.value)}
                    placeholder="What's the most pressing challenge right now?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trajectory</Label>
                  <Select
                    value={formState.stability.trajectory}
                    onValueChange={(v) => updateStability("trajectory", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Where is this state heading?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ascending">Ascending - Growing in power</SelectItem>
                      <SelectItem value="stable">Stable - Maintaining position</SelectItem>
                      <SelectItem value="stagnant">Stagnant - Neither growing nor declining</SelectItem>
                      <SelectItem value="declining">Declining - Losing power</SelectItem>
                      <SelectItem value="crisis">In Crisis - Major instability</SelectItem>
                      <SelectItem value="collapsing">Collapsing - Near dissolution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Projected Lifespan</Label>
                  <Textarea
                    value={formState.stability.projectedLifespan}
                    onChange={(e) => updateStability("projectedLifespan", e.target.value)}
                    placeholder="How long will this state last? What might end it?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* SF Examples */}
            <CollapsibleSection
              id="section-examples"
              title="SF Examples"
              levelNumber={10}
              guidance="See how other creators have designed memorable governments and empires."
            >
              <div className="space-y-4">
                {SF_EMPIRE_EXAMPLES.map((example, i) => (
                  <GlassPanel key={i} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{example.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {example.type}
                        </Badge>
                        <p className="text-sm text-tier-3 mt-2">
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
              levelNumber={11}
              guidance="Bring it all together. What makes this government unique and story-worthy?"
              thinkLike="an author crafting a setting"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Primary Conflict/Tension</Label>
                  <Textarea
                    value={formState.synthesis.primaryConflict}
                    onChange={(e) => updateSynthesis("primaryConflict", e.target.value)}
                    placeholder="What's the central dramatic tension in this government?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unique Feature</Label>
                  <Textarea
                    value={formState.synthesis.uniqueFeature}
                    onChange={(e) => updateSynthesis("uniqueFeature", e.target.value)}
                    placeholder="What makes this government memorable and different?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Story Potential</Label>
                  <Textarea
                    value={formState.synthesis.storyPotential}
                    onChange={(e) => updateSynthesis("storyPotential", e.target.value)}
                    placeholder="What kinds of stories does this government enable?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Consistency Notes</Label>
                  <Suspense fallback={<div className="min-h-[100px] rounded-md border border-border bg-background/50 animate-pulse" />}>
                    <RichTextEditor
                      content={formState.synthesis.consistencyNotes}
                      onChange={(value) => updateSynthesis("consistencyNotes", value)}
                      placeholder="Any contradictions to resolve? Elements to develop further?"
                      minHeight="100px"
                    />
                  </Suspense>
                </div>

                <div className="space-y-2">
                  <Label>One-Sentence Summary</Label>
                  <Textarea
                    value={formState.synthesis.oneSentenceSummary}
                    onChange={(e) => updateSynthesis("oneSentenceSummary", e.target.value)}
                    placeholder="Describe this government in one evocative sentence."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

        </div>

        <ToolSidebar>
          <SectionNavigation sections={SECTIONS} mode="inline" />
          <KeyChoicesSidebar sections={keyChoicesSections} mode="inline" />
        </ToolSidebar>
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
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Dominion"
        worksheetTitle={currentWorksheetTitle || formState.foundation.name || "Government"}
        formState={formState}
        worldName={worldName}
        summaryTemplate={<EmpireSummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<EmpireFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename="empire-designer"
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        entityType="worksheet"
        entityId={currentWorksheetId || worksheetId || ""}
        entityTitle={currentWorksheetTitle || "Untitled Worksheet"}
      />

      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId!}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Dominion"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        toolName="Dominion"
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default EmpireDesigner;
