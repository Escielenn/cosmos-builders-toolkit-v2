import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Languages,
  Users,
  Globe,
  GraduationCap,
  BookOpen,
  Ship,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import SectionNavigation from "@/components/tools/SectionNavigation";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, {
  KeyChoicesSection,
  MobileKeyChoices,
} from "@/components/tools/KeyChoicesSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import {
  LexDriftSummaryTemplate,
  LexDriftFullReportTemplate,
} from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";

import {
  STARTING_LANGUAGES,
  SIGN_LANGUAGES,
  ISOLATION_LEVELS,
  EDUCATION_POLICIES,
  MEDIA_ACCESS_LEVELS,
  CONTACT_EVENT_TYPES,
  LINGUA_FRANCA_SPECIAL,
  LEXDRIFT_SECTIONS,
  SECTION_HELPERS,
  SAMPLE_ORIGINAL,
  SAMPLE_TRANSFORMATIONS,
  SCIENTIFIC_NOTES,
} from "@/lib/lexdrift/data";
import {
  calculateLexDrift,
  buildCopyText,
  getIdentityLabel,
} from "@/lib/lexdrift/calculations";
import type { FormStateForCalc, ContactEvent, AdditionalShip } from "@/lib/lexdrift/calculations";

// ─── FormState ───────────────────────────────────────────────────────

interface FormState extends FormStateForCalc {
  storyNotes: {
    linguisticIdentity: string;
    firstContact: string;
    culturalPreservation: string;
    generationalShift: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  mission: {
    duration: 200,
    population: 2500,
    isolation: "high",
  },
  linguistic: {
    selectedLanguages: ["english"],
    customLanguage: "",
    linguaFranca: "english",
    includeSignLanguage: false,
    signLanguage: "",
    liturgicalPreservation: false,
    liturgicalLanguage: "",
  },
  social: {
    educationPolicy: "moderate",
    identityPressure: 50,
    mediaAccess: "archived",
    contactEvents: [],
  },
  multiShip: {
    enabled: false,
    ships: [],
  },
  storyNotes: {
    linguisticIdentity: "",
    firstContact: "",
    culturalPreservation: "",
    generationalShift: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "lexdrift";
const LOCAL_STORAGE_KEY = "lexdrift-v1";

// ─── Severity color helpers ──────────────────────────────────────────

const SEVERITY_STYLES = {
  dialect: { text: "text-sf-emerald", border: "border-l-emerald-400", bg: "bg-emerald-400/10" },
  significant: { text: "text-sf-teal", border: "border-l-sf-teal", bg: "bg-sf-teal/10" },
  reduced: { text: "text-orange-500", border: "border-l-orange-500", bg: "bg-orange-500/10" },
  separate: { text: "text-sf-crimson", border: "border-l-red-500", bg: "bg-red-500/10" },
};

// ─── Component ───────────────────────────────────────────────────────

const LexDrift = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // Load existing worksheet from Supabase
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

  // Fallback to localStorage if no worldId
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          setFormState(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId, worksheetId]);

  // ─── Computed Results ──────────────────────────────────────────────

  const calculationResult = useMemo(() => {
    return calculateLexDrift(formState);
  }, [
    formState.mission,
    formState.linguistic,
    formState.social,
    formState.multiShip,
  ]);

  // ─── Key Choices Sidebar ───────────────────────────────────────────

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    return [
      {
        id: "mission",
        title: "1. Mission",
        choices: [
          { label: "Duration", value: `${formState.mission.duration} years` },
          { label: "Population", value: formState.mission.population.toLocaleString() },
          {
            label: "Isolation",
            value: ISOLATION_LEVELS.find((l) => l.id === formState.mission.isolation)?.label,
          },
        ],
      },
      {
        id: "linguistic",
        title: "2. Linguistic",
        choices: [
          {
            label: "Languages",
            value: formState.linguistic.selectedLanguages.length > 0
              ? `${formState.linguistic.selectedLanguages.length} selected`
              : undefined,
          },
          {
            label: "Lingua Franca",
            value: formState.linguistic.linguaFranca
              ? (STARTING_LANGUAGES.find((l) => l.id === formState.linguistic.linguaFranca)?.label ||
                LINGUA_FRANCA_SPECIAL.find((l) => l.id === formState.linguistic.linguaFranca)?.label)
              : undefined,
          },
        ],
      },
      {
        id: "results",
        title: "3. Results",
        choices: [
          {
            label: "Divergence",
            value: calculationResult.valid
              ? `${calculationResult.divergencePercent.toFixed(1)}%`
              : undefined,
          },
          {
            label: "Intelligibility",
            value: calculationResult.valid
              ? `${calculationResult.intelligibilityPercent.toFixed(0)}%`
              : undefined,
          },
          {
            label: "New Terms",
            value: calculationResult.valid
              ? `~${calculationResult.estimatedNewTerms.toLocaleString()}`
              : undefined,
          },
        ],
      },
    ];
  }, [formState, calculationResult]);

  // ─── Update Helpers ────────────────────────────────────────────────

  const updateMission = (field: keyof FormState["mission"], value: number | string) => {
    setFormState((prev) => ({
      ...prev,
      mission: { ...prev.mission, [field]: value },
    }));
  };

  const updateLinguistic = (field: keyof FormState["linguistic"], value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      linguistic: { ...prev.linguistic, [field]: value },
    }));
  };

  const updateSocial = (field: keyof FormState["social"], value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      social: { ...prev.social, [field]: value },
    }));
  };

  const updateStoryNotes = (field: keyof FormState["storyNotes"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      storyNotes: { ...prev.storyNotes, [field]: value },
    }));
  };

  const toggleLanguage = (langId: string) => {
    setFormState((prev) => {
      const current = prev.linguistic.selectedLanguages;
      const updated = current.includes(langId)
        ? current.filter((id) => id !== langId)
        : [...current, langId];
      // Also update lingua franca if the selected one was removed
      let linguaFranca = prev.linguistic.linguaFranca;
      if (!updated.includes(linguaFranca) && linguaFranca !== "none" && linguaFranca !== "constructed") {
        linguaFranca = updated[0] || "none";
      }
      return {
        ...prev,
        linguistic: { ...prev.linguistic, selectedLanguages: updated, linguaFranca },
      };
    });
  };

  const addContactEvent = () => {
    const newEvent: ContactEvent = {
      id: crypto.randomUUID(),
      year: Math.floor(formState.mission.duration / 2),
      type: "later-ship",
      description: "",
    };
    setFormState((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        contactEvents: [...prev.social.contactEvents, newEvent],
      },
    }));
  };

  const removeContactEvent = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        contactEvents: prev.social.contactEvents.filter((e) => e.id !== id),
      },
    }));
  };

  const updateContactEvent = (id: string, field: keyof ContactEvent, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        contactEvents: prev.social.contactEvents.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      },
    }));
  };

  const addShip = () => {
    const newShip: AdditionalShip = {
      id: crypto.randomUUID(),
      name: `Ship ${formState.multiShip.ships.length + 2}`,
      departureYear: 50,
      population: 1000,
      selectedLanguages: formState.linguistic.selectedLanguages.slice(0, 2),
    };
    setFormState((prev) => ({
      ...prev,
      multiShip: { ...prev.multiShip, ships: [...prev.multiShip.ships, newShip] },
    }));
  };

  const removeShip = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      multiShip: {
        ...prev.multiShip,
        ships: prev.multiShip.ships.filter((s) => s.id !== id),
      },
    }));
  };

  const updateShip = (id: string, field: keyof AdditionalShip, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      multiShip: {
        ...prev.multiShip,
        ships: prev.multiShip.ships.map((s) =>
          s.id === id ? { ...s, [field]: value } : s
        ),
      },
    }));
  };

  // ─── Save / Load / Export ──────────────────────────────────────────

  const handleSave = async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));

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
      toast({ title: "Draft Saved", description: "WORK SECURED TO LOCAL STORAGE." });
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

  const handleCopyNarrative = () => {
    if (!calculationResult.valid) return;
    const text = buildCopyText(calculationResult, formState);
    navigator.clipboard.writeText(text);
    toast({ title: "COPIED TO CLIPBOARD.", description: "ANALYSIS COPIED TO CLIPBOARD." });
  };

  const worldNameForExport = worldId ? worldName : undefined;
  const severity = calculationResult.valid ? calculationResult.severity : "dialect";
  const sColors = SEVERITY_STYLES[severity];

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={() => window.print()}
      onExport={() => setExportDialogOpen(true)}
      onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Lexdrift"
          worldName={worldNameForExport}
          formState={formState}
          summaryTemplate={<LexDriftSummaryTemplate formState={formState} worldName={worldNameForExport} />}
          fullTemplate={<LexDriftFullReportTemplate formState={formState} worldName={worldNameForExport} />}
          defaultFilename="lexdrift"
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

        {/* Introduction */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] mb-4 gradient-text">
            Language Evolution During Interstellar Travel
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Isolation is the engine of linguistic divergence."
          </blockquote>
          <p className="text-t2">
            Model how languages evolve during long-duration space missions and interstellar colonization.
            Based on McKenzie & Punske (2019), Polynesian expansion studies, and colonial dialect research,
            this tool calculates divergence rates, predicts change types, and generates sample texts showing
            your ship's language at different time periods.
          </p>
        </GlassPanel>

        {/* ═══ SECTIONS ═══ */}
        <div className="space-y-6">

          {/* Section 1: Mission Parameters */}
          <CollapsibleSection
            id="section-mission"
            title="Mission Parameters"
            subtitle="How far, how long, how isolated?"
            levelNumber={1}
            icon={<Globe className="w-5 h-5" />}
            defaultOpen={true}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.mission}</p>
            <div className="space-y-6">
              {/* Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Mission Duration</Label>
                  <span className="font-mono text-sm text-primary">
                    {formState.mission.duration} years
                  </span>
                </div>
                <Slider
                  value={[formState.mission.duration]}
                  onValueChange={([val]) => updateMission("duration", val)}
                  min={50}
                  max={1000}
                  step={10}
                  aria-label="Mission duration"
                />
                <div className="flex justify-between text-xs text-t4">
                  <span>50 years</span>
                  <span>1,000 years</span>
                </div>
              </div>

              {/* Population */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Population</Label>
                  <span className="font-mono text-sm text-primary">
                    {formState.mission.population.toLocaleString()} people
                  </span>
                </div>
                <Slider
                  value={[formState.mission.population]}
                  onValueChange={([val]) => updateMission("population", val)}
                  min={50}
                  max={50000}
                  step={50}
                  aria-label="Population"
                />
                <div className="flex justify-between text-xs text-t4">
                  <span>50</span>
                  <span>50,000</span>
                </div>
              </div>

              {/* Isolation Level */}
              <div className="space-y-2">
                <Label>Isolation Level</Label>
                <Select
                  value={formState.mission.isolation}
                  onValueChange={(val) => updateMission("isolation", val)}
                >
                  <SelectTrigger><SelectValue placeholder="Select isolation level..." /></SelectTrigger>
                  <SelectContent>
                    {ISOLATION_LEVELS.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <span className="font-medium">{level.label}</span>
                        <span className="text-t2 ml-2">,  {level.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: Linguistic Configuration */}
          <CollapsibleSection
            id="section-linguistic"
            title="Linguistic Configuration"
            subtitle="What languages does your population carry?"
            levelNumber={2}
            icon={<Languages className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.linguistic}</p>
            <div className="space-y-6">
              {/* Starting Languages */}
              <div className="space-y-3">
                <Label>Starting Languages (select 1–5)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STARTING_LANGUAGES.map((lang) => (
                    <div
                      key={lang.id}
                      className="flex items-center gap-2 p-2 rounded-none border border-sf-border hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        id={`lang-${lang.id}`}
                        checked={formState.linguistic.selectedLanguages.includes(lang.id)}
                        onCheckedChange={() => toggleLanguage(lang.id)}
                        disabled={
                          !formState.linguistic.selectedLanguages.includes(lang.id) &&
                          formState.linguistic.selectedLanguages.length >= 5
                        }
                      />
                      <label htmlFor={`lang-${lang.id}`} className="cursor-pointer text-sm flex-1">
                        <span className="font-medium">{lang.label}</span>
                        <span className="text-t2 ml-1 text-xs">({lang.family})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Language */}
              <div className="space-y-2">
                <Label>Additional Language (optional)</Label>
                <Input
                  value={formState.linguistic.customLanguage}
                  onChange={(e) => updateLinguistic("customLanguage", e.target.value)}
                  placeholder="e.g., Swahili, Korean, Constructed Language..."
                />
              </div>

              {/* Lingua Franca */}
              <div className="space-y-2">
                <Label>Lingua Franca</Label>
                <Select
                  value={formState.linguistic.linguaFranca}
                  onValueChange={(val) => updateLinguistic("linguaFranca", val)}
                >
                  <SelectTrigger><SelectValue placeholder="Select lingua franca..." /></SelectTrigger>
                  <SelectContent>
                    {formState.linguistic.selectedLanguages.map((langId) => {
                      const lang = STARTING_LANGUAGES.find((l) => l.id === langId);
                      return lang ? (
                        <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                      ) : null;
                    })}
                    {formState.linguistic.customLanguage && (
                      <SelectItem value="custom">{formState.linguistic.customLanguage}</SelectItem>
                    )}
                    {LINGUA_FRANCA_SPECIAL.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sign Language */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formState.linguistic.includeSignLanguage}
                    onCheckedChange={(checked) => updateLinguistic("includeSignLanguage", checked)}
                  />
                  <Label className="cursor-pointer">Include Sign Language Community</Label>
                </div>
                {formState.linguistic.includeSignLanguage && (
                  <Select
                    value={formState.linguistic.signLanguage}
                    onValueChange={(val) => updateLinguistic("signLanguage", val)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select sign language..." /></SelectTrigger>
                    <SelectContent>
                      {SIGN_LANGUAGES.map((sl) => (
                        <SelectItem key={sl.id} value={sl.id}>{sl.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Liturgical Preservation */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formState.linguistic.liturgicalPreservation}
                    onCheckedChange={(checked) => updateLinguistic("liturgicalPreservation", checked)}
                  />
                  <Label className="cursor-pointer">Liturgical Preservation</Label>
                  <span className="text-xs text-t4">(preserve one variety for ceremony)</span>
                </div>
                {formState.linguistic.liturgicalPreservation && (
                  <Select
                    value={formState.linguistic.liturgicalLanguage}
                    onValueChange={(val) => updateLinguistic("liturgicalLanguage", val)}
                  >
                    <SelectTrigger><SelectValue placeholder="Language to preserve..." /></SelectTrigger>
                    <SelectContent>
                      {formState.linguistic.selectedLanguages.map((langId) => {
                        const lang = STARTING_LANGUAGES.find((l) => l.id === langId);
                        return lang ? (
                          <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Advanced toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-sf-border bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-t3">
                {showAdvanced ? "▾ Hide" : "▸ Show"} Advanced Parameters
              </span>
            </button>
            {!showAdvanced && (
              <span className="font-mono text-[10px] text-t4">
                Using default social factors
              </span>
            )}
          </div>

          {/* Section 3: Social Factors */}
          {showAdvanced && (
          <CollapsibleSection
            id="section-social"
            title="Social Factors"
            subtitle="What accelerates or brakes language change?"
            levelNumber={3}
            icon={<GraduationCap className="w-5 h-5" />}
            defaultOpen={true}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.social}</p>
            <div className="space-y-6">
              {/* Education Policy */}
              <div className="space-y-2">
                <Label>Education Policy</Label>
                <Select
                  value={formState.social.educationPolicy}
                  onValueChange={(val) => updateSocial("educationPolicy", val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_POLICIES.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        <span className="font-medium">{policy.label}</span>
                        <span className="text-t2 ml-2">,  {policy.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Identity Pressure */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Identity Pressure</Label>
                  <span className="font-mono text-sm text-primary">
                    {formState.social.identityPressure}%, {getIdentityLabel(formState.social.identityPressure)}
                  </span>
                </div>
                <Slider
                  value={[formState.social.identityPressure]}
                  onValueChange={([val]) => updateSocial("identityPressure", val)}
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Identity pressure"
                />
                <div className="flex justify-between text-xs text-t4">
                  <span>Earth-identified</span>
                  <span>Strongly Divergent</span>
                </div>
              </div>

              {/* Media Access */}
              <div className="space-y-2">
                <Label>Media Access</Label>
                <Select
                  value={formState.social.mediaAccess}
                  onValueChange={(val) => updateSocial("mediaAccess", val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDIA_ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <span className="font-medium">{level.label}</span>
                        <span className="text-t2 ml-2">,  {level.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Events */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Contact Events</Label>
                  <Button variant="outline" size="sm" onClick={addContactEvent}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Event
                  </Button>
                </div>
                {formState.social.contactEvents.map((event) => (
                  <div key={event.id} className="flex gap-2 items-start p-3 rounded-none border border-sf-border">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <div className="space-y-1">
                        <span className="text-xs text-t4">Year</span>
                        <Input
                          type="number"
                          value={event.year}
                          onChange={(e) => updateContactEvent(event.id, "year", parseInt(e.target.value) || 0)}
                          min={1}
                          max={formState.mission.duration}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-t4">Type</span>
                        <Select
                          value={event.type}
                          onValueChange={(val) => updateContactEvent(event.id, "type", val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTACT_EVENT_TYPES.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-t4">Notes</span>
                        <Input
                          value={event.description}
                          onChange={(e) => updateContactEvent(event.id, "description", e.target.value)}
                          placeholder="Brief description..."
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 mt-5"
                      onClick={() => removeContactEvent(event.id)}
                      aria-label="Remove contact event"
                    >
                      <Trash2 className="w-4 h-4 text-sf-crimson" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
          )}

          {/* ═══ Section 4: RESULTS ═══ */}
          <div id="section-results" className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-sm bg-primary/20 text-primary flex items-center justify-center font-mono text-sm font-medium">
                4
              </span>
              <h2 className="font-heading text-xl font-medium">
                Predicted Outcomes
              </h2>
            </div>

            {calculationResult.valid ? (
              <>
                {/* Hero: Divergence Score */}
                <GlassPanel glow className="p-6 md:p-8 text-center">
                  <p className="font-mono text-xs uppercase tracking-sf-ultra text-t2 mb-2">
                    Language Divergence
                  </p>
                  <p className={`font-mono text-5xl md:text-6xl font-sf-light ${sColors.text}`}>
                    {calculationResult.divergencePercent.toFixed(1)}%
                  </p>
                  <Badge className={`mt-3 ${sColors.bg} ${sColors.text} border-none`}>
                    {calculationResult.severityLabel}
                  </Badge>
                </GlassPanel>

                {/* Intelligibility / New Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-1">
                      Mutual Intelligibility
                    </p>
                    <p className="font-mono text-2xl font-medium text-t1">
                      {calculationResult.intelligibilityPercent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-t4 mt-1">
                      {calculationResult.intelligibilityDescription}
                    </p>
                  </GlassPanel>
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-1">
                      Estimated New Vocabulary
                    </p>
                    <p className="font-mono text-2xl font-medium text-t1">
                      ~{calculationResult.estimatedNewTerms.toLocaleString()} terms
                    </p>
                    <p className="text-xs text-t4 mt-1">
                      {calculationResult.vocabularyCategories.join(" · ")}
                    </p>
                  </GlassPanel>
                </div>

                {/* Divergence Over Time Chart */}
                {calculationResult.generations > 0 && (() => {
                  const rate = calculationResult.effectiveRate;
                  const totalGen = calculationResult.generations;
                  const W = 440, H = 160;
                  const PL = 40, PR = 12, PT = 14, PB = 32;
                  const pw = W - PL - PR, ph = H - PT - PB;
                  const N = 40;
                  const xP = (f: number) => PL + f * pw;
                  const yP = (v: number) => PT + ph - (v / 100) * ph;

                  const divPts: [number, number][] = [];
                  const intPts: [number, number][] = [];
                  for (let i = 0; i <= N; i++) {
                    const f = i / N;
                    const gen = f * totalGen;
                    const div = Math.min(100, (1 - Math.pow(1 - rate, gen)) * 100);
                    const intel = Math.max(0, 100 - div * 1.5);
                    divPts.push([xP(f), yP(div)]);
                    intPts.push([xP(f), yP(intel)]);
                  }

                  const pathD = (pts: [number, number][]) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
                  const fillD = (pts: [number, number][]) => pathD(pts) + ` L${pts[pts.length - 1][0].toFixed(1)},${yP(0).toFixed(1)} L${pts[0][0].toFixed(1)},${yP(0).toFixed(1)} Z`;

                  return (
                    <div className="px-1 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-[2px] text-t2 mb-2">Divergence Over Time</p>
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[480px]" aria-label="Divergence and intelligibility over generations">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(v => (
                          <g key={v}>
                            <line x1={PL} y1={yP(v)} x2={W - PR} y2={yP(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                            <text x={PL - 4} y={yP(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize={7} fontFamily="monospace">{v}%</text>
                          </g>
                        ))}
                        {/* Intelligibility fill + line */}
                        <path d={fillD(intPts)} fill="rgba(0,229,160,0.06)" />
                        <path d={pathD(intPts)} fill="none" stroke="rgba(0,229,160,0.5)" strokeWidth={1.5} />
                        {/* Divergence fill + line */}
                        <path d={fillD(divPts)} fill="rgba(255,165,0,0.06)" />
                        <path d={pathD(divPts)} fill="none" stroke="rgba(255,165,0,0.7)" strokeWidth={1.5} />
                        {/* End dots */}
                        <circle cx={divPts[N][0]} cy={divPts[N][1]} r={3} fill="rgba(255,165,0,0.8)" />
                        <circle cx={intPts[N][0]} cy={intPts[N][1]} r={3} fill="rgba(0,229,160,0.7)" />
                        {/* X-axis labels */}
                        <text x={PL} y={H - 6} fill="rgba(255,255,255,0.3)" fontSize={7} fontFamily="monospace">0 gen</text>
                        <text x={W - PR} y={H - 6} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={7} fontFamily="monospace">{Math.round(totalGen)} gen</text>
                        <text x={PL + pw / 2} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">({Math.round(totalGen * 25)} yr)</text>
                        {/* Legend */}
                        <rect x={PL} y={2} width={8} height={3} rx={1} fill="rgba(255,165,0,0.7)" />
                        <text x={PL + 11} y={6} fill="rgba(255,255,255,0.35)" fontSize={7} fontFamily="monospace">Divergence</text>
                        <rect x={PL + 80} y={2} width={8} height={3} rx={1} fill="rgba(0,229,160,0.6)" />
                        <text x={PL + 93} y={6} fill="rgba(255,255,255,0.35)" fontSize={7} fontFamily="monospace">Intelligibility</text>
                      </svg>
                    </div>
                  );
                })()}

                {/* Sound & Grammar Changes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassPanel className={`p-5 border-l-4 ${sColors.border}`}>
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-2">
                      Sound Changes
                    </p>
                    <p className="text-sm text-t3 leading-relaxed">
                      {calculationResult.soundChanges}
                    </p>
                  </GlassPanel>
                  <GlassPanel className={`p-5 border-l-4 ${sColors.border}`}>
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-2">
                      Grammar Changes
                    </p>
                    <p className="text-sm text-t3 leading-relaxed">
                      {calculationResult.grammarChanges}
                    </p>
                  </GlassPanel>
                </div>

                {/* Historical Analogue */}
                <GlassPanel className="p-5 bg-primary/5">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-primary/60 mb-2">
                    Historical Analogue
                  </p>
                  <p className="font-heading font-medium text-t1 mb-1">
                    {calculationResult.historicalAnalogue.title}
                    <span className="text-t2 text-sm font-normal ml-2">
                      ({calculationResult.historicalAnalogue.period})
                    </span>
                  </p>
                  <p className="text-sm text-t3 leading-relaxed">
                    {calculationResult.historicalAnalogue.description}
                  </p>
                </GlassPanel>

                {/* Sign Language Results */}
                {calculationResult.signLanguageDivergence !== undefined && (
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-2">
                      Sign Language Track
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-t4">Divergence</span>
                        <p className="font-mono text-lg font-medium">
                          {calculationResult.signLanguageDivergence.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-t4">Intelligibility</span>
                        <p className="font-mono text-lg font-medium">
                          {calculationResult.signLanguageIntelligibility?.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-t4 italic">
                      {calculationResult.signLanguageNote}
                    </p>
                  </GlassPanel>
                )}

                {/* Liturgical Note */}
                {calculationResult.liturgicalNote && (
                  <GlassPanel className="p-5 border-l-4 border-l-amber-500/50">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-sf-amber/60 mb-2">
                      Liturgical Preservation
                    </p>
                    <p className="text-sm text-t3 leading-relaxed">
                      {calculationResult.liturgicalNote}
                    </p>
                  </GlassPanel>
                )}

                {/* Modifier Breakdown */}
                <GlassPanel className="p-5">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-3">
                    Divergence Modifiers
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Population", value: calculationResult.populationModifier },
                      { label: "Isolation", value: calculationResult.isolationModifier },
                      { label: "Education", value: calculationResult.educationModifier },
                      { label: "Identity", value: calculationResult.identityModifier },
                      { label: "Media", value: calculationResult.mediaModifier },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-sm text-t3">{label}</span>
                        <span className={`font-mono text-sm ${value > 1 ? "text-orange-400" : value < 1 ? "text-sf-emerald" : "text-t1"}`}>
                          ×{value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-sf-border flex justify-between items-center">
                      <span className="text-sm font-medium">Combined</span>
                      <span className="font-mono text-sm font-medium text-primary">
                        ×{calculationResult.totalModifier.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </GlassPanel>

                {/* Narrative Summary */}
                <GlassPanel className="p-5 bg-primary/5">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-primary/60 mb-3">
                    Narrative Summary
                  </p>
                  <p className="text-sm leading-relaxed text-t2">
                    {calculationResult.narrativeSummary}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleCopyNarrative}
                  >
                    <Copy className="w-3 h-3 mr-1.5" />
                    Copy Analysis
                  </Button>
                </GlassPanel>

                {/* Story Callouts */}
                {calculationResult.storyCallouts.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2">
                      What This Means For Your Story
                    </p>
                    {calculationResult.storyCallouts.map((callout, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-r-lg border-l-2 ${sColors.border} ${sColors.bg}`}
                      >
                        <p className="font-heading text-sm font-medium mb-1">
                          {callout.title}
                        </p>
                        <p className="text-xs text-t4 leading-relaxed">
                          {callout.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <GlassPanel className="p-8 text-center">
                <Languages className="w-8 h-8 text-t2 mx-auto mb-3 opacity-50" />
                <p className="text-t2">
                  {calculationResult.error || "Configure your mission parameters to see predictions."}
                </p>
              </GlassPanel>
            )}
          </div>

          {/* Section 5: Language Samples */}
          <CollapsibleSection
            id="section-samples"
            title="Language Samples"
            subtitle="How might a sentence evolve over time?"
            levelNumber={5}
            icon={<BookOpen className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.samples}</p>
            <div className="space-y-4">
              <GlassPanel className="p-4 border-l-4 border-l-primary">
                <p className="font-mono text-xs uppercase tracking-sf-wide text-primary/60 mb-2">
                  Original (Earth Standard)
                </p>
                <p className="text-sm font-medium">{SAMPLE_ORIGINAL}</p>
              </GlassPanel>

              {SAMPLE_TRANSFORMATIONS.map((sample) => {
                const isRelevant = formState.mission.duration >= sample.years;
                return (
                  <GlassPanel
                    key={sample.years}
                    className={`p-4 ${isRelevant ? "" : "opacity-40"}`}
                  >
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-t2 mb-2">
                      {sample.label}
                    </p>
                    <p className="text-sm font-medium mb-2 font-mono">{sample.text}</p>
                    <p className="text-xs text-t4 italic">{sample.notes}</p>
                  </GlassPanel>
                );
              })}

              {/* Scientific Notes */}
              <div className="pt-4 space-y-3">
                <p className="font-mono text-xs uppercase tracking-sf-wide text-t2">
                  Linguistic Principles
                </p>
                {SCIENTIFIC_NOTES.map((note) => (
                  <div key={note.title} className="flex gap-3 p-3 rounded-none bg-accent/5">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-0.5">{note.title}</p>
                      <p className="text-xs text-t4">{note.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6: Multi-Ship */}
          <CollapsibleSection
            id="section-multi-ship"
            title="Multi-Ship Calculator"
            subtitle="What happens when ships meet?"
            levelNumber={6}
            icon={<Ship className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.multiShip}</p>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formState.multiShip.enabled}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({
                      ...prev,
                      multiShip: { ...prev.multiShip, enabled: checked },
                    }))
                  }
                />
                <Label className="cursor-pointer">Enable Multi-Ship Scenario</Label>
              </div>

              {formState.multiShip.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Additional Ships</Label>
                    <Button variant="outline" size="sm" onClick={addShip}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Ship
                    </Button>
                  </div>

                  {formState.multiShip.ships.map((ship) => (
                    <GlassPanel key={ship.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          value={ship.name}
                          onChange={(e) => updateShip(ship.id, "name", e.target.value)}
                          className="max-w-xs font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeShip(ship.id)}
                          aria-label="Remove ship"
                        >
                          <Trash2 className="w-4 h-4 text-sf-crimson" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-t4">Departs at Year</span>
                          <Input
                            type="number"
                            value={ship.departureYear}
                            onChange={(e) => updateShip(ship.id, "departureYear", parseInt(e.target.value) || 0)}
                            min={0}
                            max={formState.mission.duration}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-t4">Population</span>
                          <Input
                            type="number"
                            value={ship.population}
                            onChange={(e) => updateShip(ship.id, "population", parseInt(e.target.value) || 50)}
                            min={50}
                          />
                        </div>
                      </div>
                    </GlassPanel>
                  ))}

                  {/* Multi-ship results */}
                  {calculationResult.valid && calculationResult.shipResults && calculationResult.shipResults.length > 0 && (
                    <div className="space-y-3">
                      <p className="font-mono text-xs uppercase tracking-sf-wide text-t2">
                        Inter-Ship Analysis
                      </p>
                      {calculationResult.shipResults.map((sr, i) => (
                        <GlassPanel key={i} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{sr.shipName}</span>
                            {sr.creolePotential && (
                              <Badge variant="secondary" className="text-xs">Creole Potential</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center mb-2">
                            <div>
                              <p className="text-xs text-t4">Departs</p>
                              <p className="font-mono text-sm">Year {sr.departureYear}</p>
                            </div>
                            <div>
                              <p className="text-xs text-t4">Earth Divergence</p>
                              <p className="font-mono text-sm">{sr.divergenceFromEarth.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-t4">Inter-Ship Intel.</p>
                              <p className="font-mono text-sm">{sr.intelligibilityWithPrimary.toFixed(0)}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-t4">{sr.note}</p>
                        </GlassPanel>
                      ))}

                      {/* Language Family Tree */}
                      {(() => {
                        const ships = calculationResult.shipResults || [];
                        const primaryDiv = calculationResult.divergencePercent;
                        const W = 400, H = 40 + ships.length * 50 + 60;
                        const rootX = W / 2, rootY = 30;
                        const branchY = 70;
                        const allBranches = [
                          { name: "Primary Ship", div: primaryDiv, x: 0 },
                          ...ships.map((s, i) => ({ name: s.shipName, div: s.divergenceFromEarth, x: 0 })),
                        ];
                        const count = allBranches.length;
                        const spacing = Math.min(120, (W - 60) / count);
                        const startX = rootX - ((count - 1) * spacing) / 2;
                        allBranches.forEach((b, i) => { b.x = startX + i * spacing; });

                        return (
                          <div className="mt-4">
                            <p className="font-mono text-[10px] uppercase tracking-[2px] text-t2 mb-2">Language Family Tree</p>
                            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[440px]" aria-label="Language family tree showing divergence branches">
                              {/* Root node: Earth Standard */}
                              <circle cx={rootX} cy={rootY} r={4} fill="rgba(21,193,123,0.6)" />
                              <text x={rootX} y={rootY - 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="monospace">Earth Standard</text>

                              {/* Branches */}
                              {allBranches.map((b, i) => {
                                const leafY = branchY + 20 + b.div * 0.8;
                                const hue = i === 0 ? "rgba(255,165,0,0.6)" : `rgba(0,${160 + i * 20},${200 + i * 10},0.5)`;
                                return (
                                  <g key={i}>
                                    {/* Curved branch line */}
                                    <path
                                      d={`M${rootX},${rootY + 4} Q${rootX},${branchY - 10} ${b.x},${branchY} L${b.x},${leafY}`}
                                      fill="none" stroke={hue} strokeWidth={1.5}
                                    />
                                    {/* Leaf node */}
                                    <circle cx={b.x} cy={leafY} r={3} fill={hue} />
                                    {/* Label */}
                                    <text x={b.x} y={leafY + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={7} fontFamily="monospace">
                                      {b.name.length > 14 ? b.name.slice(0, 12) + "…" : b.name}
                                    </text>
                                    <text x={b.x} y={leafY + 24} textAnchor="middle" fill={hue} fontSize={7} fontFamily="monospace">
                                      {b.div.toFixed(0)}%
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 7: Story Notes */}
          <CollapsibleSection
            id="section-story"
            title="Story Notes"
            subtitle="How does language change affect your characters?"
            levelNumber={7}
            icon={<Users className="w-5 h-5" />}
          >
            <p className="text-sm text-t3 italic mb-6">{SECTION_HELPERS.story}</p>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>Linguistic Identity</Label>
                <p className="text-xs text-t4 mb-2">
                  How do your characters relate to their language? Is it a source of pride, shame, or indifference?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.linguisticIdentity}
                    onChange={(html) => updateStoryNotes("linguisticIdentity", html)}
                    placeholder="How characters feel about their language..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>First Contact Moment</Label>
                <p className="text-xs text-t4 mb-2">
                  When your travelers meet someone who speaks "old Earth" standard, what happens?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.firstContact}
                    onChange={(html) => updateStoryNotes("firstContact", html)}
                    placeholder="The moment of linguistic first contact..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>Cultural Preservation</Label>
                <p className="text-xs text-t4 mb-2">
                  What does the community try to preserve? Songs, stories, technical manuals, religious texts?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.culturalPreservation}
                    onChange={(html) => updateStoryNotes("culturalPreservation", html)}
                    placeholder="What language artifacts survive..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>Generational Shift</Label>
                <p className="text-xs text-t4 mb-2">
                  How does the relationship to the old language change across generations?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-none" />}>
                  <RichTextEditor
                    content={formState.storyNotes.generationalShift}
                    onChange={(html) => updateStoryNotes("generationalShift", html)}
                    placeholder="How each generation relates to the language..."
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Desktop Sidebars */}
        <ToolSidebar>
          <SectionNavigation sections={LEXDRIFT_SECTIONS} mode="inline" />
          <KeyChoicesSidebar
            sections={keyChoicesSections}
            title="Lexdrift Summary"
            mode="inline"
          />
        </ToolSidebar>

        {/* Mobile Sidebars */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={LEXDRIFT_SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} title="Lexdrift Summary" />
        </div>
      {/* ═══ Dialogs & Sheets ═══ */}
      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        title="General Notes"
        content={formState.generalNotes}
        onChange={(html) => setFormState((prev) => ({ ...prev, generalNotes: html }))}
      />
      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || worksheetId || "local"}
        images={formState.moodboard || []}
        onImagesChange={(images) => setFormState((prev) => ({ ...prev, moodboard: images }))}
      />
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Lexdrift"
        worldName={worldNameForExport}
        worksheetTitle={currentWorksheetTitle || undefined}
        formState={formState}
        summaryTemplate={
          <LexDriftSummaryTemplate formState={formState} worldName={worldNameForExport} />
        }
        fullTemplate={
          <LexDriftFullReportTemplate formState={formState} worldName={worldNameForExport} />
        }
        defaultFilename="lexdrift"
      />
      {(currentWorksheetId || worksheetId) && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          worksheetId={(currentWorksheetId || worksheetId)!}
          worldId={worldId || undefined}
        />
      )}
      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId || ""}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Lexdrift"
        worksheets={existingWorksheets}
        isLoading={worksheetsLoading}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
      />

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default LexDrift;
