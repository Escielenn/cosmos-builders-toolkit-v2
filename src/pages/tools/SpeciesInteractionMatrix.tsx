import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";
import { useTags } from "@/hooks/use-tags";
const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, ArrowRight, RefreshCw, Dna, Users } from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SpeciesMatrixSummaryTemplate, SpeciesMatrixFullReportTemplate } from "@/lib/pdf/templates";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
import EvoBioImportModal from "@/components/tools/EvoBioImportModal";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import { useWorlds } from "@/hooks/use-worlds";
import type { SpeciesMatrixSpecies } from "@/lib/field-mappings";
import { Json } from "@/integrations/supabase/types";
import {
  RELATIONSHIP_LEVELS,
  PHYSICAL_COMPATIBILITY,
  COMMUNICATION,
  ECONOMIC_RELATIONS,
  POLITICAL_RELATIONS,
  CULTURAL_EXCHANGE,
  HISTORICAL_CONTEXT,
  TENSION_POINTS,
  SYNTHESIS_OPTIONS,
  SF_INTERACTION_EXAMPLES,
  STORY_PROMPT_TEMPLATES,
} from "@/lib/species-interaction-data";

const SECTIONS: Section[] = [
  { id: "section-registry", title: "1. Species Registry" },
  { id: "section-pairs", title: "2. Pair Selection" },
  { id: "section-physical", title: "3. Physical" },
  { id: "section-communication", title: "4. Communication" },
  { id: "section-economic", title: "5. Economic" },
  { id: "section-political", title: "6. Political" },
  { id: "section-cultural", title: "7. Cultural" },
  { id: "section-historical", title: "8. Historical" },
  { id: "section-tensions", title: "9. Tensions" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Synthesis" },
];

interface Species {
  id: string;
  name: string;
  shortDescription: string;
  homeworld: string;
  physicalTraits: string;
  culturalTraits: string;
}

interface SpeciesPair {
  speciesAId: string;
  speciesBId: string;
  overallRelationship: string;
  environmentCompatibility: string;
  biologyCompatibility: string;
  reproductionCompatibility: string;
  lifespanDifference: string;
  physicalNotes: string;
  languageStatus: string;
  perceptionOverlap: string;
  nonverbalUnderstanding: string;
  culturalConceptGap: string;
  communicationNotes: string;
  tradeRelationship: string;
  resourceRelationship: string;
  laborRelationship: string;
  economicDependency: string;
  economicNotes: string;
  sovereignty: string;
  alliance: string;
  representation: string;
  treatyStatus: string;
  politicalNotes: string;
  culturalAdoption: string;
  populationMixing: string;
  attitudesEach: string;
  hybridStatus: string;
  culturalNotes: string;
  firstContactTime: string;
  firstContactType: string;
  warHistory: string;
  cooperationHistory: string;
  historicalNotes: string;
  currentTensions: string;
  futureRisks: string;
  tensionNotes: string;
}

interface FormState {
  species: Species[];
  pairs: SpeciesPair[];
  overallEquilibrium: string;
  overallTrajectory: string;
  dominantSpecies: string;
  mostVolatilePair: string;
  synthesisNotes: string;
  storyPrompt: string;
  centralConflict: string;
  peaceOpportunity: string;
  wildcardFactor: string;
  notes: string;
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const createEmptySpecies = (): Species => ({
  id: crypto.randomUUID(),
  name: "",
  shortDescription: "",
  homeworld: "",
  physicalTraits: "",
  culturalTraits: "",
});

const createEmptyPair = (speciesAId: string, speciesBId: string): SpeciesPair => ({
  speciesAId,
  speciesBId,
  overallRelationship: "",
  environmentCompatibility: "",
  biologyCompatibility: "",
  reproductionCompatibility: "",
  lifespanDifference: "",
  physicalNotes: "",
  languageStatus: "",
  perceptionOverlap: "",
  nonverbalUnderstanding: "",
  culturalConceptGap: "",
  communicationNotes: "",
  tradeRelationship: "",
  resourceRelationship: "",
  laborRelationship: "",
  economicDependency: "",
  economicNotes: "",
  sovereignty: "",
  alliance: "",
  representation: "",
  treatyStatus: "",
  politicalNotes: "",
  culturalAdoption: "",
  populationMixing: "",
  attitudesEach: "",
  hybridStatus: "",
  culturalNotes: "",
  firstContactTime: "",
  firstContactType: "",
  warHistory: "",
  cooperationHistory: "",
  historicalNotes: "",
  currentTensions: "",
  futureRisks: "",
  tensionNotes: "",
});

const initialFormState: FormState = {
  species: [createEmptySpecies(), createEmptySpecies()],
  pairs: [],
  overallEquilibrium: "",
  overallTrajectory: "",
  dominantSpecies: "",
  mostVolatilePair: "",
  synthesisNotes: "",
  storyPrompt: "",
  centralConflict: "",
  peaceOpportunity: "",
  wildcardFactor: "",
  notes: "",
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "species-interaction-matrix";

const SpeciesInteractionMatrix = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTargetIndex, setImportTargetIndex] = useState<number | null>(null);
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const { worlds } = useWorlds();

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
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);

  // Generate all pairs when species change
  const allPairs = useMemo(() => {
    const pairs: { a: Species; b: Species; pairKey: string }[] = [];
    for (let i = 0; i < formState.species.length; i++) {
      for (let j = i + 1; j < formState.species.length; j++) {
        const a = formState.species[i];
        const b = formState.species[j];
        pairs.push({
          a,
          b,
          pairKey: `${a.id}-${b.id}`,
        });
      }
    }
    return pairs;
  }, [formState.species]);

  // Sync pairs array with current species
  useEffect(() => {
    const neededPairs: SpeciesPair[] = [];
    for (const { a, b } of allPairs) {
      const existing = formState.pairs.find(
        (p) =>
          (p.speciesAId === a.id && p.speciesBId === b.id) ||
          (p.speciesAId === b.id && p.speciesBId === a.id)
      );
      if (existing) {
        neededPairs.push(existing);
      } else {
        neededPairs.push(createEmptyPair(a.id, b.id));
      }
    }
    if (JSON.stringify(neededPairs) !== JSON.stringify(formState.pairs)) {
      setFormState((prev) => ({ ...prev, pairs: neededPairs }));
    }
  }, [allPairs]);

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
        if (existingWorksheet.tags) {
          setWorksheetTags(existingWorksheet.tags);
        }
        toast({
          title: "Worksheet Loaded",
          description: "WORK RESTORED FROM CLOUD.",
        });
      } catch {
        // Ignore parse errors
      }
    }
  }, [existingWorksheet]);

  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem("sim-worksheet");
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
    const speciesCount = formState.species.filter(s => s.name).length;
    const eq = SYNTHESIS_OPTIONS.equilibrium.find(e => e.value === formState.overallEquilibrium);
    const tr = SYNTHESIS_OPTIONS.trajectory.find(t => t.value === formState.overallTrajectory);

    let selectedPairRel: string | undefined;
    if (selectedPairIndex < formState.pairs.length) {
      const pair = formState.pairs[selectedPairIndex];
      if (pair?.overallRelationship) {
        selectedPairRel = RELATIONSHIP_LEVELS.find(r => r.value === pair.overallRelationship)?.label;
      }
    }

    return [
      {
        id: "overview",
        title: "Overview",
        choices: [
          { label: "Species", value: speciesCount > 0 ? `${speciesCount} defined` : undefined },
          { label: "Pairs", value: allPairs.length > 0 ? `${allPairs.length} pairs` : undefined },
        ],
      },
      {
        id: "selected",
        title: "Selected Pair",
        choices: [
          { label: "Relationship", value: selectedPairRel || undefined },
        ],
      },
      {
        id: "synthesis",
        title: "Synthesis",
        choices: [
          { label: "Equilibrium", value: eq?.label || undefined },
          { label: "Trajectory", value: tr?.label || undefined },
        ],
      },
    ];
  }, [formState, selectedPairIndex, allPairs]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateSpecies = (index: number, updates: Partial<Species>) => {
    setFormState((prev) => ({
      ...prev,
      species: prev.species.map((s, i) =>
        i === index ? { ...s, ...updates } : s
      ),
    }));
  };

  const addSpecies = () => {
    if (formState.species.length >= 6) {
      toast({
        title: "Maximum species reached",
        description: "You can compare up to 6 species.",
        variant: "destructive",
      });
      return;
    }
    setFormState((prev) => ({
      ...prev,
      species: [...prev.species, createEmptySpecies()],
    }));
  };

  const removeSpecies = (index: number) => {
    if (formState.species.length <= 2) {
      toast({
        title: "Minimum species required",
        description: "You need at least 2 species to compare.",
        variant: "destructive",
      });
      return;
    }
    const speciesId = formState.species[index].id;
    setFormState((prev) => ({
      ...prev,
      species: prev.species.filter((_, i) => i !== index),
      pairs: prev.pairs.filter(
        (p) => p.speciesAId !== speciesId && p.speciesBId !== speciesId
      ),
    }));
  };

  const handleImportFromEvoBio = (index: number) => {
    setImportTargetIndex(index);
    setImportModalOpen(true);
  };

  const handleEvoBioImport = (speciesData: Partial<SpeciesMatrixSpecies>) => {
    if (importTargetIndex === null) return;

    updateSpecies(importTargetIndex, {
      name: speciesData.name || "",
      shortDescription: speciesData.shortDescription || "",
      homeworld: speciesData.homeworld || "",
      physicalTraits: speciesData.physicalTraits || "",
      culturalTraits: speciesData.culturalTraits || "",
    });

    toast({
      title: "Species Imported",
      description: `${speciesData.name || "Species"} has been imported from Evolutionary Biology.`,
    });

    setImportTargetIndex(null);
  };

  const handleAddFromEvoBio = () => {
    if (formState.species.length >= 6) {
      toast({
        title: "Maximum species reached",
        description: "You can compare up to 6 species.",
        variant: "destructive",
      });
      return;
    }
    // Add a new empty species then open import modal for it
    const newSpecies = createEmptySpecies();
    setFormState((prev) => ({
      ...prev,
      species: [...prev.species, newSpecies],
    }));
    setImportTargetIndex(formState.species.length);
    setImportModalOpen(true);
  };

  const updatePair = (pairIndex: number, updates: Partial<SpeciesPair>) => {
    setFormState((prev) => ({
      ...prev,
      pairs: prev.pairs.map((p, i) =>
        i === pairIndex ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleSave = async () => {
    localStorage.setItem("sim-worksheet", JSON.stringify(formState));

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
            title: "OPERATION FAILED.",
            description: "SELECT OR CREATE A WORKSHEET BEFORE TRANSMITTING.",
            variant: "destructive",
          });
        }
      } catch {
        // Error handled by mutation
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

  const getSpeciesById = (id: string) => formState.species.find((s) => s.id === id);

  const generateRandomStoryPrompt = () => {
    const random = STORY_PROMPT_TEMPLATES[Math.floor(Math.random() * STORY_PROMPT_TEMPLATES.length)];
    updateField("storyPrompt", random);
  };

  const currentPair = formState.pairs[selectedPairIndex];
  const speciesA = currentPair ? getSpeciesById(currentPair.speciesAId) : null;
  const speciesB = currentPair ? getSpeciesById(currentPair.speciesBId) : null;

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
          toolName="Symbiosis"
          worldName={worldName}
          formState={formState}
          summaryTemplate={<SpeciesMatrixSummaryTemplate formState={formState} worldName={worldName} />}
          fullTemplate={<SpeciesMatrixFullReportTemplate formState={formState} worldName={worldName} />}
          defaultFilename="species-interaction-matrix"
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

            {/* Section 1: Species Registry */}
            <CollapsibleSection
              id="section-registry"
              levelNumber={1}
              title="Species Registry"
              guidance="Define the species you want to compare (2-6 species)"
            >
              <div className="space-y-4">
                {formState.species.map((species, index) => (
                  <Card key={species.id} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Species {index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {worldId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleImportFromEvoBio(index)}
                              className="text-sf-emerald hover:text-emerald-600"
                              title="Import from Evolutionary Biology"
                            >
                              <Dna className="w-4 h-4" />
                            </Button>
                          )}
                          {formState.species.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpecies(index)}
                              className="text-sf-crimson"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Species Name</Label>
                          <Input
                            value={species.name}
                            onChange={(e) => updateSpecies(index, { name: e.target.value })}
                            placeholder="e.g., Human, Vulcan, Klingon"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Homeworld</Label>
                          <Input
                            value={species.homeworld}
                            onChange={(e) => updateSpecies(index, { homeworld: e.target.value })}
                            placeholder="e.g., Earth, Vulcan, Qo'noS"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Brief Description</Label>
                        <Input
                          value={species.shortDescription}
                          onChange={(e) => updateSpecies(index, { shortDescription: e.target.value })}
                          placeholder="One sentence description"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Key Physical Traits</Label>
                          <Textarea
                            value={species.physicalTraits}
                            onChange={(e) => updateSpecies(index, { physicalTraits: e.target.value })}
                            placeholder="Appearance, biology, environment"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Key Cultural Traits</Label>
                          <Textarea
                            value={species.culturalTraits}
                            onChange={(e) => updateSpecies(index, { culturalTraits: e.target.value })}
                            placeholder="Values, society, psychology"
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formState.species.length < 6 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={addSpecies} className="flex-1 gap-2">
                      <Plus className="w-4 h-4" />
                      Add Species ({formState.species.length}/6)
                    </Button>
                    {worldId && (
                      <Button
                        variant="outline"
                        onClick={handleAddFromEvoBio}
                        className="flex-1 gap-2 text-emerald-600 border-emerald-600 hover:bg-emerald-500/10"
                      >
                        <Dna className="w-4 h-4" />
                        Import from Evolutionary Biology
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Section 2: Pair Selection */}
            {allPairs.length > 0 && (
              <CollapsibleSection
                id="section-pairs"
                levelNumber={2}
                title="Species Pair Selection"
                guidance="Select a pair to define their relationship"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allPairs.map((pair, index) => (
                    <Card
                      key={pair.pairKey}
                      className={`cursor-pointer transition-colors ${
                        selectedPairIndex === index
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary"
                      }`}
                      onClick={() => setSelectedPairIndex(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pair.a.name || `Species ${formState.species.indexOf(pair.a) + 1}`}</span>
                            <ArrowRight className="w-4 h-4 text-t2" />
                            <span className="font-medium">{pair.b.name || `Species ${formState.species.indexOf(pair.b) + 1}`}</span>
                          </div>
                        </div>
                        {formState.pairs[index]?.overallRelationship && (
                          <p className="text-xs text-t4 mt-2">
                            {RELATIONSHIP_LEVELS.find(r => r.value === formState.pairs[index].overallRelationship)?.label}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Pairwise Relationship Sections - Only show if pair is selected */}
            {currentPair && speciesA && speciesB && (
              <>
                {/* Section 3: Physical Compatibility */}
                <CollapsibleSection
                  id="section-physical"
                  levelNumber={3}
                  title={`${speciesA.name || "A"} ↔ ${speciesB.name || "B"}: Physical`}
                  guidance="Overall relationship and physical compatibility"
                >
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Overall Relationship</Label>
                      <RadioGroup
                        value={currentPair.overallRelationship}
                        onValueChange={(value) => updatePair(selectedPairIndex, { overallRelationship: value })}
                        className="grid grid-cols-2 md:grid-cols-3 gap-3"
                      >
                        {RELATIONSHIP_LEVELS.map((opt) => (
                          <div key={opt.value} className="flex items-start space-x-2">
                            <RadioGroupItem value={opt.value} id={`rel-${opt.value}`} />
                            <Label htmlFor={`rel-${opt.value}`} className="font-normal cursor-pointer">
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-xs text-t4 block">{opt.description}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Environment Compatibility</Label>
                        <Select
                          value={currentPair.environmentCompatibility}
                          onValueChange={(value) => updatePair(selectedPairIndex, { environmentCompatibility: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PHYSICAL_COMPATIBILITY.environment.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Biology Compatibility</Label>
                        <Select
                          value={currentPair.biologyCompatibility}
                          onValueChange={(value) => updatePair(selectedPairIndex, { biologyCompatibility: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PHYSICAL_COMPATIBILITY.biology.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reproduction Compatibility</Label>
                        <Select
                          value={currentPair.reproductionCompatibility}
                          onValueChange={(value) => updatePair(selectedPairIndex, { reproductionCompatibility: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PHYSICAL_COMPATIBILITY.reproduction.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Lifespan Difference</Label>
                        <Select
                          value={currentPair.lifespanDifference}
                          onValueChange={(value) => updatePair(selectedPairIndex, { lifespanDifference: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PHYSICAL_COMPATIBILITY.lifespan.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.physicalNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { physicalNotes: value })}
                        placeholder="Additional notes on physical compatibility..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>

                {/* Section 4: Communication */}
                <CollapsibleSection
                  id="section-communication"
                  levelNumber={4}
                  title="Communication"
                  guidance="Language, perception, nonverbal, cultural concepts"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Language Status</Label>
                        <Select
                          value={currentPair.languageStatus}
                          onValueChange={(value) => updatePair(selectedPairIndex, { languageStatus: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMUNICATION.language.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Perception Overlap</Label>
                        <Select
                          value={currentPair.perceptionOverlap}
                          onValueChange={(value) => updatePair(selectedPairIndex, { perceptionOverlap: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMUNICATION.perception.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nonverbal Understanding</Label>
                        <Select
                          value={currentPair.nonverbalUnderstanding}
                          onValueChange={(value) => updatePair(selectedPairIndex, { nonverbalUnderstanding: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMUNICATION.nonverbal.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cultural Concept Gap</Label>
                        <Select
                          value={currentPair.culturalConceptGap}
                          onValueChange={(value) => updatePair(selectedPairIndex, { culturalConceptGap: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMUNICATION.cultural.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.communicationNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { communicationNotes: value })}
                        placeholder="Additional notes on communication..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>

                {/* Section 5: Economic */}
                <CollapsibleSection
                  id="section-economic"
                  levelNumber={5}
                  title="Economic Relations"
                  guidance="Trade, resources, labor, dependencies"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Trade Relationship</Label>
                        <Select
                          value={currentPair.tradeRelationship}
                          onValueChange={(value) => updatePair(selectedPairIndex, { tradeRelationship: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ECONOMIC_RELATIONS.trade.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Resource Relationship</Label>
                        <Select
                          value={currentPair.resourceRelationship}
                          onValueChange={(value) => updatePair(selectedPairIndex, { resourceRelationship: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ECONOMIC_RELATIONS.resources.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Labor Relationship</Label>
                        <Select
                          value={currentPair.laborRelationship}
                          onValueChange={(value) => updatePair(selectedPairIndex, { laborRelationship: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ECONOMIC_RELATIONS.labor.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Economic Dependency</Label>
                        <Select
                          value={currentPair.economicDependency}
                          onValueChange={(value) => updatePair(selectedPairIndex, { economicDependency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ECONOMIC_RELATIONS.dependencies.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.economicNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { economicNotes: value })}
                        placeholder="Additional notes on economic relations..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>

                {/* Section 6: Political */}
                <CollapsibleSection
                  id="section-political"
                  levelNumber={6}
                  title="Political Relations"
                  guidance="Sovereignty, alliances, representation, treaties"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sovereignty</Label>
                        <Select
                          value={currentPair.sovereignty}
                          onValueChange={(value) => updatePair(selectedPairIndex, { sovereignty: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {POLITICAL_RELATIONS.sovereignty.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Alliance Status</Label>
                        <Select
                          value={currentPair.alliance}
                          onValueChange={(value) => updatePair(selectedPairIndex, { alliance: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {POLITICAL_RELATIONS.alliance.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Representation</Label>
                        <Select
                          value={currentPair.representation}
                          onValueChange={(value) => updatePair(selectedPairIndex, { representation: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {POLITICAL_RELATIONS.representation.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Treaty Status</Label>
                        <Select
                          value={currentPair.treatyStatus}
                          onValueChange={(value) => updatePair(selectedPairIndex, { treatyStatus: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {POLITICAL_RELATIONS.treaties.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.politicalNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { politicalNotes: value })}
                        placeholder="Additional notes on political relations..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>

                {/* Section 7: Cultural */}
                <CollapsibleSection
                  id="section-cultural"
                  levelNumber={7}
                  title="Cultural Exchange"
                  guidance="Adoption, mixing, attitudes, hybrids"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cultural Adoption</Label>
                        <Select
                          value={currentPair.culturalAdoption}
                          onValueChange={(value) => updatePair(selectedPairIndex, { culturalAdoption: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CULTURAL_EXCHANGE.adoption.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Population Mixing</Label>
                        <Select
                          value={currentPair.populationMixing}
                          onValueChange={(value) => updatePair(selectedPairIndex, { populationMixing: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CULTURAL_EXCHANGE.mixing.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Attitudes Toward Each Other</Label>
                        <Select
                          value={currentPair.attitudesEach}
                          onValueChange={(value) => updatePair(selectedPairIndex, { attitudesEach: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CULTURAL_EXCHANGE.attitudes.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Hybrid Status</Label>
                        <Select
                          value={currentPair.hybridStatus}
                          onValueChange={(value) => updatePair(selectedPairIndex, { hybridStatus: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CULTURAL_EXCHANGE.hybrid.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.culturalNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { culturalNotes: value })}
                        placeholder="Additional notes on cultural exchange..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>

                {/* Section 8: Historical */}
                <CollapsibleSection
                  id="section-historical"
                  levelNumber={8}
                  title="Historical Context"
                  guidance="First contact, conflicts, cooperation"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Contact Timing</Label>
                        <Select
                          value={currentPair.firstContactTime}
                          onValueChange={(value) => updatePair(selectedPairIndex, { firstContactTime: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {HISTORICAL_CONTEXT.firstContact.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>First Contact Type</Label>
                        <Select
                          value={currentPair.firstContactType}
                          onValueChange={(value) => updatePair(selectedPairIndex, { firstContactType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {HISTORICAL_CONTEXT.contactType.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>War History</Label>
                        <Select
                          value={currentPair.warHistory}
                          onValueChange={(value) => updatePair(selectedPairIndex, { warHistory: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {HISTORICAL_CONTEXT.conflicts.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cooperation History</Label>
                        <Select
                          value={currentPair.cooperationHistory}
                          onValueChange={(value) => updatePair(selectedPairIndex, { cooperationHistory: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {HISTORICAL_CONTEXT.cooperation.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.historicalNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { historicalNotes: value })}
                        placeholder="Key historical events between these species..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>

                {/* Section 9: Tensions */}
                <CollapsibleSection
                  id="section-tensions"
                  levelNumber={9}
                  title="Tension Points"
                  guidance="Current conflicts and future risks"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Current Tensions</Label>
                        <Select
                          value={currentPair.currentTensions}
                          onValueChange={(value) => updatePair(selectedPairIndex, { currentTensions: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TENSION_POINTS.current.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Future Risks</Label>
                        <Select
                          value={currentPair.futureRisks}
                          onValueChange={(value) => updatePair(selectedPairIndex, { futureRisks: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TENSION_POINTS.futureRisks.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                      <RichTextEditor
                        content={currentPair.tensionNotes}
                        onChange={(value) => updatePair(selectedPairIndex, { tensionNotes: value })}
                        placeholder="Describe the specific points of tension..."
                        minHeight="100px"
                      />
                    </Suspense>
                  </div>
                </CollapsibleSection>
              </>
            )}

            {/* Section: SF Examples */}
            <CollapsibleSection
              id="section-examples"
              title="SF Interaction Examples"
              guidance="How species interactions have been explored in SF"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SF_INTERACTION_EXAMPLES.map((example, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{example.name}</CardTitle>
                      <CardDescription className="text-xs">{example.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{example.description}</p>
                      <p className="text-xs text-t4 italic">{example.dynamics}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleSection>

            {/* Section: Overall Synthesis */}
            <CollapsibleSection
              id="section-synthesis"
              title="Overall Synthesis"
              guidance="Big picture assessment of multi-species dynamics"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Overall Equilibrium</Label>
                    <Select
                      value={formState.overallEquilibrium}
                      onValueChange={(value) => updateField("overallEquilibrium", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How stable?" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNTHESIS_OPTIONS.equilibrium.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Overall Trajectory</Label>
                    <Select
                      value={formState.overallTrajectory}
                      onValueChange={(value) => updateField("overallTrajectory", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Where heading?" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNTHESIS_OPTIONS.trajectory.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Synthesis Notes</Label>
                  <Suspense fallback={<div className="min-h-[100px] rounded-md border border-sf-line-interactive bg-background/50 animate-pulse" />}>
                    <RichTextEditor
                      content={formState.synthesisNotes}
                      onChange={(value) => updateField("synthesisNotes", value)}
                      placeholder="How do all these species dynamics interact?"
                      minHeight="100px"
                    />
                  </Suspense>
                </div>

                <Card className="bg-purple-500/10 border-sf-violet">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Story Prompt Generator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm italic mb-3">{formState.storyPrompt || "Click generate for a story prompt"}</p>
                    <Button variant="outline" size="sm" onClick={generateRandomStoryPrompt} className="gap-2">
                      <RefreshCw className="w-3 h-3" />
                      Generate New
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Central Conflict</Label>
                  <Textarea
                    value={formState.centralConflict}
                    onChange={(e) => updateField("centralConflict", e.target.value)}
                    placeholder="What's the main conflict from these interactions?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Opportunity for Peace</Label>
                    <Textarea
                      value={formState.peaceOpportunity}
                      onChange={(e) => updateField("peaceOpportunity", e.target.value)}
                      placeholder="What could bring these species together?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wildcard Factor</Label>
                    <Textarea
                      value={formState.wildcardFactor}
                      onChange={(e) => updateField("wildcardFactor", e.target.value)}
                      placeholder="What unexpected element could change everything?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={formState.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Additional notes, questions, or ideas..."
                    rows={3}
                  />
                </div>
              </div>
            </CollapsibleSection>

        </div>

        {/* Sidebars */}
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
        toolName="Symbiosis"
        formState={formState}
        worksheetTitle={
          formState.species.filter(s => s.name).map(s => s.name).join(" & ") ||
          "Species Interaction Matrix"
        }
        worldName={worldName}
        summaryTemplate={<SpeciesMatrixSummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<SpeciesMatrixFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename="species-interaction-matrix"
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
        toolDisplayName="Symbiosis"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />

      {worldId && (
        <EvoBioImportModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          worldId={worldId}
          onImport={handleEvoBioImport}
        />
      )}

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default SpeciesInteractionMatrix;
