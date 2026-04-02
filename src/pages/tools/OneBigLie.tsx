import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import { ExternalLink, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection, MobileKeyChoices } from "@/components/tools/KeyChoicesSidebar";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import { OneBigLieSummaryTemplate, OneBigLieFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import {
  ONE_BIG_LIE_SECTIONS,
  APPROACH_OPTIONS,
  SF_EXAMPLES,
  SECTION_HELPERS,
} from "@/lib/one-big-lie-data";

// Types
interface FormState {
  approach: {
    type: "big-lie" | "what-if" | "";
  };
  coreStatement: {
    statement: string;
    scienceBroken: string;
  };
  justification: {
    narrativeJustification: string;
    whatBecomesPossible: string;
    whatBecomesImpossible: string;
  };
  testability: {
    inWorldTest: string;
    rules: string;
    knownUnknowns: string;
  };
  physicalConsequences: {
    primaryImpact: string;
    secondOrderEffects: string;
  };
  techConsequences: {
    technologicalImpact: string;
    economicPowerImpact: string;
  };
  socialConsequences: {
    socialPsychologicalImpact: string;
    culturalMythologicalImpact: string;
  };
  rigorCommitment: {
    rigorArea1: string;
    rigorArea2: string;
    rigorArea3: string;
  };
  consistencyTest: {
    hardestQuestion: string;
    edgeCase: string;
    connectionToWorld: string;
  };
  declaration: {
    formalDeclaration: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  approach: { type: "" },
  coreStatement: { statement: "", scienceBroken: "" },
  justification: {
    narrativeJustification: "",
    whatBecomesPossible: "",
    whatBecomesImpossible: "",
  },
  testability: { inWorldTest: "", rules: "", knownUnknowns: "" },
  physicalConsequences: { primaryImpact: "", secondOrderEffects: "" },
  techConsequences: { technologicalImpact: "", economicPowerImpact: "" },
  socialConsequences: {
    socialPsychologicalImpact: "",
    culturalMythologicalImpact: "",
  },
  rigorCommitment: { rigorArea1: "", rigorArea2: "", rigorArea3: "" },
  consistencyTest: {
    hardestQuestion: "",
    edgeCase: "",
    connectionToWorld: "",
  },
  declaration: { formalDeclaration: "" },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "one-big-lie";

const EXTERNAL_RESOURCES = [
  {
    name: "Mohs Scale of SF Hardness",
    url: "https://tvtropes.org/pmwiki/pmwiki.php/Main/MohsScaleOfScienceFictionHardness",
  },
  {
    name: "Atomic Rockets",
    url: "http://www.projectrho.com/public_html/rocket/",
  },
  {
    name: "SF Physics FAQ",
    url: "https://www.physicsguy.com/ftl/",
  },
];

// Rich text editor skeleton
const EditorSkeleton = () => (
  <div className="min-h-[120px] rounded-md border border-border bg-background/50 animate-pulse" />
);

// Helper: count non-empty string fields in an object
const countFilled = (obj: Record<string, string>): number =>
  Object.values(obj).filter((v) => v && v.trim().length > 0).length;

// Helper: strip HTML for sidebar preview
const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, "").trim();

const OneBigLie = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const { updateWorksheetTags } = useTags();

  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = useWorldId();
  const worksheetId = searchParams.get("worksheetId");

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);

  // Show worksheet selector when worldId present but no worksheetId
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

  // Fallback to localStorage
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem("one-big-lie-worksheet");
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

  // Key choices sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const approachLabel = formState.approach.type
      ? APPROACH_OPTIONS.find((o) => o.id === formState.approach.type)?.label
      : undefined;

    const corePreview = stripHtml(formState.coreStatement.statement);

    return [
      {
        id: "section-approach",
        title: "1. Approach",
        choices: [{ label: "Type", value: approachLabel }],
      },
      {
        id: "section-core",
        title: "2. Core Statement",
        choices: [
          {
            label: "Statement",
            value: corePreview ? corePreview.slice(0, 80) + (corePreview.length > 80 ? "..." : "") : undefined,
          },
          {
            label: "Science",
            value: stripHtml(formState.coreStatement.scienceBroken) ? "Defined" : undefined,
          },
        ],
      },
      {
        id: "section-justification",
        title: "3. Justification",
        choices: [
          {
            label: "Responses",
            value: countFilled(formState.justification) > 0
              ? `${countFilled(formState.justification)}/3 filled`
              : undefined,
          },
        ],
      },
      {
        id: "section-testability",
        title: "4. Testability",
        choices: [
          {
            label: "Responses",
            value: countFilled(formState.testability) > 0
              ? `${countFilled(formState.testability)}/3 filled`
              : undefined,
          },
        ],
      },
      {
        id: "section-physical",
        title: "5A. Physical/Bio",
        choices: [
          {
            label: "Responses",
            value: countFilled(formState.physicalConsequences) > 0
              ? `${countFilled(formState.physicalConsequences)}/2 filled`
              : undefined,
          },
        ],
      },
      {
        id: "section-tech",
        title: "5B. Tech/Economic",
        choices: [
          {
            label: "Responses",
            value: countFilled(formState.techConsequences) > 0
              ? `${countFilled(formState.techConsequences)}/2 filled`
              : undefined,
          },
        ],
      },
      {
        id: "section-social",
        title: "5C. Social/Psych",
        choices: [
          {
            label: "Responses",
            value: countFilled(formState.socialConsequences) > 0
              ? `${countFilled(formState.socialConsequences)}/2 filled`
              : undefined,
          },
        ],
      },
      {
        id: "section-rigor",
        title: "6. Rigor",
        choices: [
          {
            label: "Areas",
            value: countFilled(formState.rigorCommitment) > 0
              ? `${countFilled(formState.rigorCommitment)}/3 defined`
              : undefined,
          },
        ],
      },
      {
        id: "section-consistency",
        title: "7. Stress Test",
        choices: [
          {
            label: "Responses",
            value: countFilled(formState.consistencyTest) > 0
              ? `${countFilled(formState.consistencyTest)}/3 filled`
              : undefined,
          },
        ],
      },
      {
        id: "section-declaration",
        title: "8. Declaration",
        choices: [
          {
            label: "Status",
            value: stripHtml(formState.declaration.formalDeclaration) ? "Complete" : undefined,
          },
        ],
      },
    ];
  }, [formState]);

  // Update helpers
  const updateSection = <K extends keyof FormState>(
    section: K,
    field: keyof FormState[K],
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  // Save
  const handleSave = async () => {
    localStorage.setItem("one-big-lie-worksheet", JSON.stringify(formState));

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

  const handleExport = () => setExportDialogOpen(true);
  const handlePrint = () => window.print();

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={handlePrint}
      onExport={handleExport}
      onShare={
        currentWorksheetId || worksheetId
          ? () => setShareDialogOpen(true)
          : undefined
      }
      isShared={!!shareConfig?.enabled}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Axiom"
          worldName={worldName}
          formState={formState}
          summaryTemplate={
            <OneBigLieSummaryTemplate formState={formState} worldName={worldName} />
          }
          fullTemplate={
            <OneBigLieFullReportTemplate formState={formState} worldName={worldName} />
          }
          defaultFilename="one-big-lie"
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

        {/* Introduction Panel */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] mb-4 gradient-text">
            The One Big Lie Framework
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Pick ONE counterfactual element. Make it plausible-ish. Then follow
            ALL other science rigorously."
          </blockquote>
          <p className="text-tier-2 mb-4">
            The One Big Lie is a foundational principle of hard science fiction:
            you're allowed one major departure from known physics, but everything
            else must follow real science rigorously. This tool guides you through
            declaring that departure and tracing its consequences across your
            entire world—from physics to biology to mythology to culture.
          </p>
          <div className="text-sm text-tier-3 mb-4">
            <strong className="text-foreground">The Cascade Principle:</strong>
            <p className="mt-1">
              Physics shapes environment. Environment shapes biology. Biology shapes psychology. Psychology shapes mythology. Mythology shapes culture. Change one element at the
              foundation and everything above it shifts.
            </p>
          </div>

          {/* SF Examples Accordion */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">
              SF Reference Examples
            </h4>
            <div className="space-y-2">
              {SF_EXAMPLES.map((example) => (
                <Collapsible key={example.name}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-sm"
                    >
                      <span>
                        <strong className="text-foreground">
                          {example.name}
                        </strong>
                        <span className="text-tier-2 ml-2">
                         —{example.source}
                        </span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-tier-2 shrink-0" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 py-2 text-sm text-tier-3 space-y-2">
                      <p>
                        <strong className="text-foreground">The Lie:</strong>{" "}
                        {example.lie}
                      </p>
                      <p>
                        <strong className="text-foreground">The Cascade:</strong>{" "}
                        {example.cascade}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
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
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {resource.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Main Content Sections */}
        <div className="space-y-6">
          {/* Section 1: Choose Your Approach */}
          <CollapsibleSection
            id="section-approach"
            title="Choose Your Approach"
            levelNumber={1}
            thinkLike="a physicist setting the ground rules"
            defaultOpen={true}
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.approach}
            </p>
            <RadioGroup
              value={formState.approach.type}
              onValueChange={(value) =>
                updateSection("approach", "type", value)
              }
              className="space-y-4"
            >
              {APPROACH_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-start gap-3">
                  <RadioGroupItem
                    value={option.id}
                    id={`approach-${option.id}`}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={`approach-${option.id}`}
                    className="cursor-pointer"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-tier-2 ml-2">
                     —{option.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CollapsibleSection>

          {/* Section 2: The Core Statement */}
          <CollapsibleSection
            id="section-core"
            title="The Core Statement"
            levelNumber={2}
            thinkLike="a patent attorney: be precise and specific"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.coreStatement}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Core Statement—State your One Big Lie or One What If in one
                  clear, specific sentence. Then expand: What exactly does it
                  change about known physics or reality?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.coreStatement.statement}
                    onChange={(value) =>
                      updateSection("coreStatement", "statement", value)
                    }
                    placeholder="e.g., 'A warp bubble can be generated by matter-antimatter reaction regulated by dilithium crystals...'"
                    minHeight="140px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  What real science does this bend or break?—Identify the
                  specific scientific principles, laws, or known facts your
                  element violates or reimagines.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.coreStatement.scienceBroken}
                    onChange={(value) =>
                      updateSection("coreStatement", "scienceBroken", value)
                    }
                    placeholder="e.g., 'Violates the light speed limit from special relativity (E=mc²)...'"
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3: The Justification */}
          <CollapsibleSection
            id="section-justification"
            title="The Justification"
            levelNumber={3}
            thinkLike="a story architect: why does this change matter?"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.justification}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Narrative Justification—Why does this particular change
                  interest you narratively or thematically? What story does it
                  let you tell that strict realism would prevent?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.justification.narrativeJustification}
                    onChange={(value) =>
                      updateSection(
                        "justification",
                        "narrativeJustification",
                        value
                      )
                    }
                    placeholder="Your narrative justification..."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  What becomes possible?—Name at least one specific narrative
                  possibility your lie enables that realistic physics would
                  prevent.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.justification.whatBecomesPossible}
                    onChange={(value) =>
                      updateSection(
                        "justification",
                        "whatBecomesPossible",
                        value
                      )
                    }
                    placeholder="What new possibilities does your lie open up?"
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  What becomes impossible or constrained?—Name at least one
                  constraint your lie creates. The best speculative elements
                  create problems as interesting as the possibilities they open.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.justification.whatBecomesImpossible}
                    onChange={(value) =>
                      updateSection(
                        "justification",
                        "whatBecomesImpossible",
                        value
                      )
                    }
                    placeholder="What constraints or problems does your lie create?"
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4: Testability Check */}
          <CollapsibleSection
            id="section-testability"
            title="Testability Check"
            levelNumber={4}
            thinkLike="an experimental scientist: how would you prove it?"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.testability}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  The In-World Test—Describe how a scientist or engineer in
                  your world would demonstrate, test, or prove that your Big Lie
                  works. What experiment would they run?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.testability.inWorldTest}
                    onChange={(value) =>
                      updateSection("testability", "inWorldTest", value)
                    }
                    placeholder="Describe the in-world experiment..."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  The Rules—What are the specific rules and limitations? Under
                  what conditions does it work? Under what conditions does it
                  fail? Vagueness leads to plot holes.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.testability.rules}
                    onChange={(value) =>
                      updateSection("testability", "rules", value)
                    }
                    placeholder="Define the rules and limitations..."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Known Unknowns—What aspects do your characters NOT fully
                  understand? Mystery within a framework of rules creates
                  narrative tension.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.testability.knownUnknowns}
                    onChange={(value) =>
                      updateSection("testability", "knownUnknowns", value)
                    }
                    placeholder="What mysteries remain within your framework?"
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5A: Physical / Biological Consequences */}
          <CollapsibleSection
            id="section-physical"
            title="Physical / Biological Consequences"
            subtitle="Cascading Consequences—Part A"
            levelNumber={5}
            thinkLike="a biologist: what evolves?"
          >
            <p className="text-sm text-tier-3 italic mb-2">
              {SECTION_HELPERS.physicalConsequences}
            </p>
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.physicalSub}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Physical/Biological Impact—How does your Big Lie alter the
                  physical environment or biological reality? What new materials,
                  energy sources, or biological adaptations emerge?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.physicalConsequences.primaryImpact}
                    onChange={(value) =>
                      updateSection(
                        "physicalConsequences",
                        "primaryImpact",
                        value
                      )
                    }
                    placeholder="Describe the primary physical/biological impact..."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Second-Order Physical Effects—Go deeper. What does the first
                  impact cause in turn? If FTL exists, what happens to
                  simultaneity? If telepathy works, how does it affect brain
                  development?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.physicalConsequences.secondOrderEffects}
                    onChange={(value) =>
                      updateSection(
                        "physicalConsequences",
                        "secondOrderEffects",
                        value
                      )
                    }
                    placeholder="What second-order effects cascade from the first?"
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5B: Technological / Economic Consequences */}
          <CollapsibleSection
            id="section-tech"
            title="Technological / Economic Consequences"
            subtitle="Cascading Consequences—Part B"
            levelNumber={6}
            thinkLike="an economist: who profits?"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.techConsequences}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Technological Impact—What technologies become possible (or
                  obsolete)? What industries emerge? What existing industries
                  die?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.techConsequences.technologicalImpact}
                    onChange={(value) =>
                      updateSection(
                        "techConsequences",
                        "technologicalImpact",
                        value
                      )
                    }
                    placeholder="What technologies emerge or die?"
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Economic &amp; Power Impact—Who controls this element? Who
                  profits from it? Who is excluded? Scarcity and access drive
                  every economy and every conflict.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.techConsequences.economicPowerImpact}
                    onChange={(value) =>
                      updateSection(
                        "techConsequences",
                        "economicPowerImpact",
                        value
                      )
                    }
                    placeholder="Who controls, profits, and is excluded?"
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5C: Social / Psychological Consequences */}
          <CollapsibleSection
            id="section-social"
            title="Social / Psychological Consequences"
            subtitle="Cascading Consequences—Part C"
            levelNumber={7}
            thinkLike="a sociologist: how do people change?"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.socialConsequences}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Social/Psychological Impact—How does your Big Lie change the
                  way people think, feel, and relate to each other? How does it
                  reshape families, communities, governance, or identity?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={
                      formState.socialConsequences.socialPsychologicalImpact
                    }
                    onChange={(value) =>
                      updateSection(
                        "socialConsequences",
                        "socialPsychologicalImpact",
                        value
                      )
                    }
                    placeholder="How do people and society change?"
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Cultural &amp; Mythological Impact—What new beliefs, rituals,
                  fears, or aspirations emerge? What stories do people tell about
                  it? What do they worship or dread?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={
                      formState.socialConsequences.culturalMythologicalImpact
                    }
                    onChange={(value) =>
                      updateSection(
                        "socialConsequences",
                        "culturalMythologicalImpact",
                        value
                      )
                    }
                    placeholder="What myths, beliefs, and cultural practices emerge?"
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6: The Rigor Commitment */}
          <CollapsibleSection
            id="section-rigor"
            title="The Rigor Commitment"
            levelNumber={8}
            thinkLike="a hard SF editor: where do you hold the line?"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.rigorCommitment}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Rigor Area 1—Name one specific scientific domain where you
                  will maintain strict accuracy despite your Big Lie.
                </Label>
                <p className="text-xs text-tier-4">
                  e.g., "Orbital mechanics will be realistic—no banking turns
                  in space."
                </p>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.rigorCommitment.rigorArea1}
                    onChange={(value) =>
                      updateSection("rigorCommitment", "rigorArea1", value)
                    }
                    placeholder="First domain of maintained rigor..."
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Rigor Area 2—Name a second domain of maintained rigor.
                </Label>
                <p className="text-xs text-tier-4">
                  e.g., "Biology will follow evolutionary logic—no humanoid
                  aliens without convergent evolution justification."
                </p>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.rigorCommitment.rigorArea2}
                    onChange={(value) =>
                      updateSection("rigorCommitment", "rigorArea2", value)
                    }
                    placeholder="Second domain of maintained rigor..."
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Rigor Area 3—Name a third domain of maintained rigor.
                </Label>
                <p className="text-xs text-tier-4">
                  e.g., "Economics will follow scarcity principles—no
                  post-scarcity handwaving without technological basis."
                </p>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.rigorCommitment.rigorArea3}
                    onChange={(value) =>
                      updateSection("rigorCommitment", "rigorArea3", value)
                    }
                    placeholder="Third domain of maintained rigor..."
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 7: Consistency Stress Test */}
          <CollapsibleSection
            id="section-consistency"
            title="Consistency Stress Test"
            levelNumber={9}
            thinkLike="your harshest critic: try to break your own idea"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.consistencyTest}
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  The Hardest Question—What is the most difficult question
                  someone could ask about your Big Lie? The one that makes you
                  uncomfortable because you're not sure you have a good answer?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.consistencyTest.hardestQuestion}
                    onChange={(value) =>
                      updateSection("consistencyTest", "hardestQuestion", value)
                    }
                    placeholder="The toughest question about your Big Lie..."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  The Edge Case—Describe a scenario where your Big Lie's rules
                  create an awkward or contradictory situation. How do you resolve
                  it—or do you leave it as genuine mystery?
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.consistencyTest.edgeCase}
                    onChange={(value) =>
                      updateSection("consistencyTest", "edgeCase", value)
                    }
                    placeholder="An edge case that tests your rules..."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <Label>
                  Connection to Your World—How does your Big Lie connect to
                  your planetary foundation from the Planetary Profile tool? It
                  should feel like it belongs in this specific world.
                </Label>
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.consistencyTest.connectionToWorld}
                    onChange={(value) =>
                      updateSection(
                        "consistencyTest",
                        "connectionToWorld",
                        value
                      )
                    }
                    placeholder="How does your lie connect to your world's planetary foundation?"
                    minHeight="100px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 8: The Physics Declaration */}
          <CollapsibleSection
            id="section-declaration"
            title="The Physics Declaration"
            levelNumber={10}
            thinkLike="a world's founding legislator"
          >
            <p className="text-sm text-tier-3 italic mb-4">
              {SECTION_HELPERS.declaration}
            </p>

            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Formal Declaration—Write your formal Physics Declaration in
                ~150 words: State your one big lie, your three areas of
                maintained rigor, the one narrative possibility it enables, and
                the one constraint it creates.
              </Label>
              <Suspense fallback={<EditorSkeleton />}>
                <RichTextEditor
                  content={formState.declaration.formalDeclaration}
                  onChange={(value) =>
                    updateSection("declaration", "formalDeclaration", value)
                  }
                  placeholder="I declare that in my world..."
                  minHeight="200px"
                  className="bg-background/50 border-primary/30"
                />
              </Suspense>
            </div>
          </CollapsibleSection>
        </div>

        {/* Desktop Sidebar */}
        <ToolSidebar>
          <SectionNavigation sections={ONE_BIG_LIE_SECTIONS} mode="inline" />
          <KeyChoicesSidebar
            sections={keyChoicesSections}
            title="Summary"
            mode="inline"
          />
        </ToolSidebar>

        {/* Mobile floating buttons */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={ONE_BIG_LIE_SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} title="Summary" />
        </div>
      {/* Notes & Moodboard Sheets */}
      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        content={formState.generalNotes}
        onChange={(html) =>
          setFormState((prev) => ({ ...prev, generalNotes: html }))
        }
      />
      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || "local"}
        images={formState.moodboard || []}
        onImagesChange={(images) =>
          setFormState((prev) => ({ ...prev, moodboard: images }))
        }
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Axiom"
        worldName={worldName || undefined}
        formState={formState}
        summaryTemplate={
          <OneBigLieSummaryTemplate
            formState={formState}
            worldName={worldName}
          />
        }
        fullTemplate={
          <OneBigLieFullReportTemplate
            formState={formState}
            worldName={worldName}
          />
        }
        defaultFilename="one-big-lie"
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        entityType="worksheet"
        entityId={currentWorksheetId || worksheetId || ""}
        entityTitle={currentWorksheetTitle || "Untitled Declaration"}
      />

      {/* Worksheet Selector */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Axiom"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}
    </ToolPageLayout>
  );
};

export default OneBigLie;
