import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { WorksheetTagsBar } from "@/components/tools/WorksheetTagsBar";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
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
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolIntroSection from "@/components/tools/ToolIntroSection";
import { TOOL_INTROS } from "@/lib/tool-intros";
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
import { WorksheetTitle } from "@/components/tools/WorksheetTitle";
import { getToolIcon } from "@/components/icons/tool-icons";
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
import ToolActionBar from "@/components/tools/ToolActionBar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
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
const ToolIcon = getToolIcon(TOOL_TYPE);
const LOCAL_STORAGE_KEY = "lexdrift-v1";

// ─── Severity color helpers ──────────────────────────────────────────

const SEVERITY_STYLES = {
  dialect: { text: "text-emerald-400", border: "border-l-emerald-400", bg: "bg-emerald-400/10" },
  significant: { text: "text-cyan-400", border: "border-l-cyan-400", bg: "bg-cyan-400/10" },
  reduced: { text: "text-orange-500", border: "border-l-orange-500", bg: "bg-orange-500/10" },
  separate: { text: "text-red-500", border: "border-l-red-500", bg: "bg-red-500/10" },
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
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);

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
          description: "Your saved work has been restored from the cloud.",
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
            title: "Error",
            description: "Please select or create a worksheet first.",
            variant: "destructive",
          });
        }
      } catch {
        // Error handled by mutation
      }
    } else {
      toast({ title: "Draft Saved", description: "Your work has been saved locally." });
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
    toast({ title: "Copied", description: "Analysis copied to clipboard." });
  };

  const worldNameForExport = worldId ? worldName : undefined;
  const severity = calculationResult.valid ? calculationResult.severity : "dialect";
  const sColors = SEVERITY_STYLES[severity];

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Link */}
        <Link
          to={worldId ? `/worlds/${worldId}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {worldId ? "Back to World" : "Back to Dashboard"}
        </Link>

        {/* Action Bar */}
        <ToolActionBar
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
          exportLabel="Export Worksheet"
          className="mb-6"
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
        />

        {/* Title */}
        <div className="mb-8">
          <Badge className="mb-2">Pro Tool</Badge>
          <div className="flex items-center gap-3">
            {ToolIcon && <ToolIcon className="w-12 h-12 rounded-full shrink-0" />}
            <h1 className="font-display text-3xl md:text-4xl">
              <span className="font-normal">Lexdrift:</span>{" "}
              <span className="font-light">Language Evolution</span>
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Language Evolution & Xenolinguistic Drift Simulator
          </p>
          {(currentWorksheetId || worksheetId) && (
            <WorksheetTitle
              title={currentWorksheetTitle}
              onRename={handleRename}
              icon={<FileText className="w-4 h-4 text-primary" />}
              disabled={!user || worksheetLoading}
            />
          )}
          {(currentWorksheetId || worksheetId) && (
            <WorksheetTagsBar
              worksheetId={(currentWorksheetId || worksheetId)!}
              tags={worksheetTags}
              onChange={handleTagsChange}
            />
          )}
        </div>

        <ToolIntroSection data={TOOL_INTROS["lexdrift"]} />

        {/* Introduction */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4 gradient-text">
            Language Evolution During Interstellar Travel
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Isolation is the engine of linguistic divergence."
          </blockquote>
          <p className="text-muted-foreground">
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.mission}</p>
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
                <div className="flex justify-between text-xs text-muted-foreground">
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
                <div className="flex justify-between text-xs text-muted-foreground">
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
                        <span className="text-muted-foreground ml-2">— {level.description}</span>
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.linguistic}</p>
            <div className="space-y-6">
              {/* Starting Languages */}
              <div className="space-y-3">
                <Label>Starting Languages (select 1–5)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STARTING_LANGUAGES.map((lang) => (
                    <div
                      key={lang.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
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
                        <span className="text-muted-foreground ml-1 text-xs">({lang.family})</span>
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
                  <span className="text-xs text-muted-foreground">(preserve one variety for ceremony)</span>
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

          {/* Section 3: Social Factors */}
          <CollapsibleSection
            id="section-social"
            title="Social Factors"
            subtitle="What accelerates or brakes language change?"
            levelNumber={3}
            icon={<GraduationCap className="w-5 h-5" />}
          >
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.social}</p>
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
                        <span className="text-muted-foreground ml-2">— {policy.description}</span>
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
                    {formState.social.identityPressure}% — {getIdentityLabel(formState.social.identityPressure)}
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
                <div className="flex justify-between text-xs text-muted-foreground">
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
                        <span className="text-muted-foreground ml-2">— {level.description}</span>
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
                  <div key={event.id} className="flex gap-2 items-start p-3 rounded-lg border border-border">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Year</span>
                        <Input
                          type="number"
                          value={event.year}
                          onChange={(e) => updateContactEvent(event.id, "year", parseInt(e.target.value) || 0)}
                          min={1}
                          max={formState.mission.duration}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Type</span>
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
                        <span className="text-xs text-muted-foreground">Notes</span>
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
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* ═══ Section 4: RESULTS ═══ */}
          <div id="section-results" className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono text-sm font-bold">
                4
              </span>
              <h2 className="font-heading text-xl font-semibold">
                Predicted Outcomes
              </h2>
            </div>

            {calculationResult.valid ? (
              <>
                {/* Hero: Divergence Score */}
                <GlassPanel glow className="p-6 md:p-8 text-center">
                  <p className="font-mono text-xs uppercase tracking-sf-ultra text-muted-foreground mb-2">
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
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-1">
                      Mutual Intelligibility
                    </p>
                    <p className="font-mono text-2xl font-semibold text-foreground">
                      {calculationResult.intelligibilityPercent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculationResult.intelligibilityDescription}
                    </p>
                  </GlassPanel>
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-1">
                      Estimated New Vocabulary
                    </p>
                    <p className="font-mono text-2xl font-semibold text-foreground">
                      ~{calculationResult.estimatedNewTerms.toLocaleString()} terms
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculationResult.vocabularyCategories.join(" · ")}
                    </p>
                  </GlassPanel>
                </div>

                {/* Sound & Grammar Changes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassPanel className={`p-5 border-l-4 ${sColors.border}`}>
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-2">
                      Sound Changes
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {calculationResult.soundChanges}
                    </p>
                  </GlassPanel>
                  <GlassPanel className={`p-5 border-l-4 ${sColors.border}`}>
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-2">
                      Grammar Changes
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {calculationResult.grammarChanges}
                    </p>
                  </GlassPanel>
                </div>

                {/* Historical Analogue */}
                <GlassPanel className="p-5 bg-primary/5">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-primary/60 mb-2">
                    Historical Analogue
                  </p>
                  <p className="font-heading font-semibold text-foreground mb-1">
                    {calculationResult.historicalAnalogue.title}
                    <span className="text-muted-foreground text-sm font-normal ml-2">
                      ({calculationResult.historicalAnalogue.period})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {calculationResult.historicalAnalogue.description}
                  </p>
                </GlassPanel>

                {/* Sign Language Results */}
                {calculationResult.signLanguageDivergence !== undefined && (
                  <GlassPanel className="p-5">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-2">
                      Sign Language Track
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-muted-foreground">Divergence</span>
                        <p className="font-mono text-lg font-semibold">
                          {calculationResult.signLanguageDivergence.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Intelligibility</span>
                        <p className="font-mono text-lg font-semibold">
                          {calculationResult.signLanguageIntelligibility?.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {calculationResult.signLanguageNote}
                    </p>
                  </GlassPanel>
                )}

                {/* Liturgical Note */}
                {calculationResult.liturgicalNote && (
                  <GlassPanel className="p-5 border-l-4 border-l-amber-500/50">
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-amber-400/60 mb-2">
                      Liturgical Preservation
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {calculationResult.liturgicalNote}
                    </p>
                  </GlassPanel>
                )}

                {/* Modifier Breakdown */}
                <GlassPanel className="p-5">
                  <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-3">
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
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={`font-mono text-sm ${value > 1 ? "text-orange-400" : value < 1 ? "text-emerald-400" : "text-foreground"}`}>
                          ×{value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                      <span className="text-sm font-medium">Combined</span>
                      <span className="font-mono text-sm font-bold text-primary">
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
                  <p className="text-sm leading-relaxed text-muted-foreground">
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
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground">
                      What This Means For Your Story
                    </p>
                    {calculationResult.storyCallouts.map((callout, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-r-lg border-l-2 ${sColors.border} ${sColors.bg}`}
                      >
                        <p className="font-heading text-sm font-semibold mb-1">
                          {callout.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {callout.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <GlassPanel className="p-8 text-center">
                <Languages className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.samples}</p>
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
                    <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground mb-2">
                      {sample.label}
                    </p>
                    <p className="text-sm font-medium mb-2 font-mono">{sample.text}</p>
                    <p className="text-xs text-muted-foreground italic">{sample.notes}</p>
                  </GlassPanel>
                );
              })}

              {/* Scientific Notes */}
              <div className="pt-4 space-y-3">
                <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground">
                  Linguistic Principles
                </p>
                {SCIENTIFIC_NOTES.map((note) => (
                  <div key={note.title} className="flex gap-3 p-3 rounded-lg bg-accent/5">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-0.5">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{note.text}</p>
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.multiShip}</p>
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
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Departs at Year</span>
                          <Input
                            type="number"
                            value={ship.departureYear}
                            onChange={(e) => updateShip(ship.id, "departureYear", parseInt(e.target.value) || 0)}
                            min={0}
                            max={formState.mission.duration}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Population</span>
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
                      <p className="font-mono text-xs uppercase tracking-sf-wide text-muted-foreground">
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
                              <p className="text-xs text-muted-foreground">Departs</p>
                              <p className="font-mono text-sm">Year {sr.departureYear}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Earth Divergence</p>
                              <p className="font-mono text-sm">{sr.divergenceFromEarth.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Inter-Ship Intel.</p>
                              <p className="font-mono text-sm">{sr.intelligibilityWithPrimary.toFixed(0)}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{sr.note}</p>
                        </GlassPanel>
                      ))}
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
            <p className="text-sm text-muted-foreground italic mb-6">{SECTION_HELPERS.story}</p>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>Linguistic Identity</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  How do your characters relate to their language? Is it a source of pride, shame, or indifference?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <RichTextEditor
                    content={formState.storyNotes.linguisticIdentity}
                    onChange={(html) => updateStoryNotes("linguisticIdentity", html)}
                    placeholder="How characters feel about their language..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>First Contact Moment</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  When your travelers meet someone who speaks "old Earth" standard, what happens?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <RichTextEditor
                    content={formState.storyNotes.firstContact}
                    onChange={(html) => updateStoryNotes("firstContact", html)}
                    placeholder="The moment of linguistic first contact..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>Cultural Preservation</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  What does the community try to preserve? Songs, stories, technical manuals, religious texts?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <RichTextEditor
                    content={formState.storyNotes.culturalPreservation}
                    onChange={(html) => updateStoryNotes("culturalPreservation", html)}
                    placeholder="What language artifacts survive..."
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>Generational Shift</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  How does the relationship to the old language change across generations?
                </p>
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
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
      </main>

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

      <Footer />
    </div>
  );
};

export default LexDrift;
