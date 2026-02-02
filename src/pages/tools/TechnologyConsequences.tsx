import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, Cloud, CloudOff, Cpu, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWorksheets, useWorksheet, useWorksheetsByType } from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import SectionNavigation, { Section, MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection, MobileKeyChoices } from "@/components/tools/KeyChoicesSidebar";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ExportDialog from "@/components/tools/ExportDialog";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import {
  TECHNOLOGY_CATEGORIES,
  TECHNOLOGY_MATURITY,
  ACCESS_LEVELS,
  PHYSICAL_CONSEQUENCES,
  ECONOMIC_CONSEQUENCES,
  SOCIAL_CONSEQUENCES,
  POLITICAL_CONSEQUENCES,
  MILITARY_CONSEQUENCES,
  PSYCHOLOGICAL_CONSEQUENCES,
  CONSEQUENCE_TIMEFRAMES,
  SF_TECHNOLOGY_EXAMPLES,
  CONTRADICTION_PROMPTS,
  STORY_CONFLICT_PROMPTS,
} from "@/lib/technology-data";

const SECTIONS: Section[] = [
  { id: "section-definition", title: "1. Technology Definition" },
  { id: "section-physical", title: "2. Physical Consequences" },
  { id: "section-economic", title: "3. Economic Consequences" },
  { id: "section-social", title: "4. Social Consequences" },
  { id: "section-political", title: "5. Political Consequences" },
  { id: "section-military", title: "6. Military Consequences" },
  { id: "section-psychological", title: "7. Psychological Consequences" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Synthesis" },
];

interface FormState {
  // Technology Definition
  technologyName: string;
  technologyCategory: string;
  technologyDescription: string;
  maturityLevel: string;
  accessLevel: string;
  keyCapabilities: string;
  limitations: string;

  // Physical Consequences
  infrastructureEffect: string;
  infrastructureNotes: string;
  environmentEffect: string;
  environmentNotes: string;
  resourceEffect: string;
  resourceNotes: string;
  physicalTimeframe: string;

  // Economic Consequences
  industryEffect: string;
  industryNotes: string;
  employmentEffect: string;
  employmentNotes: string;
  wealthEffect: string;
  wealthNotes: string;
  economicTimeframe: string;

  // Social Consequences
  classEffect: string;
  classNotes: string;
  familyEffect: string;
  familyNotes: string;
  communityEffect: string;
  communityNotes: string;
  identityEffect: string;
  identityNotes: string;
  socialTimeframe: string;

  // Political Consequences
  powerEffect: string;
  powerNotes: string;
  surveillanceEffect: string;
  surveillanceNotes: string;
  governanceEffect: string;
  governanceNotes: string;
  politicalTimeframe: string;

  // Military Consequences
  warfareEffect: string;
  warfareNotes: string;
  defenseEffect: string;
  defenseNotes: string;
  deterrenceEffect: string;
  deterrenceNotes: string;
  militaryTimeframe: string;

  // Psychological Consequences
  perceptionEffect: string;
  perceptionNotes: string;
  valuesEffect: string;
  valuesNotes: string;
  fearsEffect: string;
  fearsNotes: string;
  psychologicalTimeframe: string;

  // Synthesis
  primaryContradiction: string;
  contradictionAnalysis: string;
  storyConflicts: string;
  winnersLosers: string;
  unexpectedUses: string;
  technologyCharacter: string;

  // Additional
  notes: string;
}

const initialFormState: FormState = {
  technologyName: "",
  technologyCategory: "",
  technologyDescription: "",
  maturityLevel: "",
  accessLevel: "",
  keyCapabilities: "",
  limitations: "",

  infrastructureEffect: "",
  infrastructureNotes: "",
  environmentEffect: "",
  environmentNotes: "",
  resourceEffect: "",
  resourceNotes: "",
  physicalTimeframe: "",

  industryEffect: "",
  industryNotes: "",
  employmentEffect: "",
  employmentNotes: "",
  wealthEffect: "",
  wealthNotes: "",
  economicTimeframe: "",

  classEffect: "",
  classNotes: "",
  familyEffect: "",
  familyNotes: "",
  communityEffect: "",
  communityNotes: "",
  identityEffect: "",
  identityNotes: "",
  socialTimeframe: "",

  powerEffect: "",
  powerNotes: "",
  surveillanceEffect: "",
  surveillanceNotes: "",
  governanceEffect: "",
  governanceNotes: "",
  politicalTimeframe: "",

  warfareEffect: "",
  warfareNotes: "",
  defenseEffect: "",
  defenseNotes: "",
  deterrenceEffect: "",
  deterrenceNotes: "",
  militaryTimeframe: "",

  perceptionEffect: "",
  perceptionNotes: "",
  valuesEffect: "",
  valuesNotes: "",
  fearsEffect: "",
  fearsNotes: "",
  psychologicalTimeframe: "",

  primaryContradiction: "",
  contradictionAnalysis: "",
  storyConflicts: "",
  winnersLosers: "",
  unexpectedUses: "",
  technologyCharacter: "",

  notes: "",
};

const TOOL_TYPE = "technology-consequences";

const TechnologyConsequences = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [randomContradiction, setRandomContradiction] = useState("");
  const [randomConflict, setRandomConflict] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const { worlds } = useWorlds();

  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);

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
      const saved = localStorage.getItem("tc-worksheet");
      if (saved) {
        try {
          setFormState(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [worldId, worksheetId]);

  useEffect(() => {
    setRandomContradiction(CONTRADICTION_PROMPTS[Math.floor(Math.random() * CONTRADICTION_PROMPTS.length)]);
    setRandomConflict(STORY_CONFLICT_PROMPTS[Math.floor(Math.random() * STORY_CONFLICT_PROMPTS.length)]);
  }, []);

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const cat = TECHNOLOGY_CATEGORIES.find(c => c.value === formState.technologyCategory);
    const mat = TECHNOLOGY_MATURITY.find(m => m.value === formState.maturityLevel);
    const acc = ACCESS_LEVELS.find(a => a.value === formState.accessLevel);
    const power = POLITICAL_CONSEQUENCES.power.find(p => p.value === formState.powerEffect);
    const wealth = ECONOMIC_CONSEQUENCES.wealth.find(w => w.value === formState.wealthEffect);

    return [
      {
        id: "definition",
        title: "1. Definition",
        choices: [
          { label: "Name", value: formState.technologyName || undefined },
          { label: "Category", value: cat?.label || undefined },
          { label: "Maturity", value: mat?.label || undefined },
          { label: "Access", value: acc?.label || undefined },
        ],
      },
      {
        id: "physical",
        title: "2. Physical",
        choices: [
          { label: "Infrastructure", value: PHYSICAL_CONSEQUENCES.infrastructure.find(i => i.value === formState.infrastructureEffect)?.label || undefined },
          { label: "Environment", value: PHYSICAL_CONSEQUENCES.environment.find(e => e.value === formState.environmentEffect)?.label || undefined },
        ],
      },
      {
        id: "economic",
        title: "3. Economic",
        choices: [
          { label: "Industry", value: ECONOMIC_CONSEQUENCES.industries.find(i => i.value === formState.industryEffect)?.label || undefined },
          { label: "Wealth", value: wealth?.label || undefined },
        ],
      },
      {
        id: "political",
        title: "5. Political",
        choices: [
          { label: "Power", value: power?.label || undefined },
          { label: "Governance", value: POLITICAL_CONSEQUENCES.governance.find(g => g.value === formState.governanceEffect)?.label || undefined },
        ],
      },
      {
        id: "military",
        title: "6. Military",
        choices: [
          { label: "Warfare", value: MILITARY_CONSEQUENCES.warfare.find(w => w.value === formState.warfareEffect)?.label || undefined },
        ],
      },
    ];
  }, [formState]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    localStorage.setItem("tc-worksheet", JSON.stringify(formState));

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

  const generateRandomContradiction = () => {
    setRandomContradiction(CONTRADICTION_PROMPTS[Math.floor(Math.random() * CONTRADICTION_PROMPTS.length)]);
  };

  const generateRandomConflict = () => {
    setRandomConflict(STORY_CONFLICT_PROMPTS[Math.floor(Math.random() * STORY_CONFLICT_PROMPTS.length)]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-24">
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
            {currentWorksheetTitle && (
              <Badge variant="outline">{currentWorksheetTitle}</Badge>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-light">
                Technology Consequences Map
              </h1>
              <p className="text-sm text-muted-foreground">
                Map how any technology cascades through society
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">Pro Tool</Badge>
        </div>

        <div className="lg:hidden mb-6 space-y-4">
          <MobileSectionNav sections={SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} />
        </div>

        <div className="flex gap-8">
          <div className="flex-1 space-y-6 max-w-4xl">
            {/* Section 1: Technology Definition */}
            <CollapsibleSection
              id="section-definition"
              title="1. Technology Definition"
              description="Define the core technology and its basic parameters"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Technology Name</Label>
                    <Input
                      value={formState.technologyName}
                      onChange={(e) => updateField("technologyName", e.target.value)}
                      placeholder="e.g., Cortical Stack, Ansible, Replicator"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formState.technologyCategory}
                      onValueChange={(value) => updateField("technologyCategory", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNOLOGY_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Technology Description</Label>
                  <Textarea
                    value={formState.technologyDescription}
                    onChange={(e) => updateField("technologyDescription", e.target.value)}
                    placeholder="What does this technology do? How does it work?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maturity Level</Label>
                    <Select
                      value={formState.maturityLevel}
                      onValueChange={(value) => updateField("maturityLevel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How developed?" />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNOLOGY_MATURITY.map((mat) => (
                          <SelectItem key={mat.value} value={mat.value}>
                            {mat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <Select
                      value={formState.accessLevel}
                      onValueChange={(value) => updateField("accessLevel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Who has access?" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Key Capabilities</Label>
                  <Textarea
                    value={formState.keyCapabilities}
                    onChange={(e) => updateField("keyCapabilities", e.target.value)}
                    placeholder="What can this technology do?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Limitations & Costs</Label>
                  <Textarea
                    value={formState.limitations}
                    onChange={(e) => updateField("limitations", e.target.value)}
                    placeholder="What can't it do? What does it cost?"
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 2: Physical Consequences */}
            <CollapsibleSection
              id="section-physical"
              title="2. Physical Consequences"
              description="Infrastructure, environment, and resource effects"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Infrastructure Effect</Label>
                  <RadioGroup
                    value={formState.infrastructureEffect}
                    onValueChange={(value) => updateField("infrastructureEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {PHYSICAL_CONSEQUENCES.infrastructure.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`infra-${opt.value}`} />
                        <Label htmlFor={`infra-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.infrastructureNotes}
                    onChange={(e) => updateField("infrastructureNotes", e.target.value)}
                    placeholder="Describe specific infrastructure changes..."
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Environmental Effect</Label>
                  <RadioGroup
                    value={formState.environmentEffect}
                    onValueChange={(value) => updateField("environmentEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {PHYSICAL_CONSEQUENCES.environment.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`env-${opt.value}`} />
                        <Label htmlFor={`env-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.environmentNotes}
                    onChange={(e) => updateField("environmentNotes", e.target.value)}
                    placeholder="Describe specific environmental impacts..."
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Resource Effect</Label>
                  <RadioGroup
                    value={formState.resourceEffect}
                    onValueChange={(value) => updateField("resourceEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {PHYSICAL_CONSEQUENCES.resources.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`res-${opt.value}`} />
                        <Label htmlFor={`res-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.resourceNotes}
                    onChange={(e) => updateField("resourceNotes", e.target.value)}
                    placeholder="Describe specific resource implications..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Physical Consequence Timeframe</Label>
                  <Select
                    value={formState.physicalTimeframe}
                    onValueChange={(value) => updateField("physicalTimeframe", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="When do effects manifest?" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSEQUENCE_TIMEFRAMES.map((tf) => (
                        <SelectItem key={tf.value} value={tf.value}>
                          {tf.label} - {tf.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 3: Economic Consequences */}
            <CollapsibleSection
              id="section-economic"
              title="3. Economic Consequences"
              description="Industries, employment, and wealth distribution"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Industry Effect</Label>
                  <RadioGroup
                    value={formState.industryEffect}
                    onValueChange={(value) => updateField("industryEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {ECONOMIC_CONSEQUENCES.industries.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`ind-${opt.value}`} />
                        <Label htmlFor={`ind-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.industryNotes}
                    onChange={(e) => updateField("industryNotes", e.target.value)}
                    placeholder="Which industries are affected?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Employment Effect</Label>
                  <RadioGroup
                    value={formState.employmentEffect}
                    onValueChange={(value) => updateField("employmentEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {ECONOMIC_CONSEQUENCES.employment.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`emp-${opt.value}`} />
                        <Label htmlFor={`emp-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.employmentNotes}
                    onChange={(e) => updateField("employmentNotes", e.target.value)}
                    placeholder="What jobs appear or disappear?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Wealth Distribution Effect</Label>
                  <RadioGroup
                    value={formState.wealthEffect}
                    onValueChange={(value) => updateField("wealthEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {ECONOMIC_CONSEQUENCES.wealth.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`wea-${opt.value}`} />
                        <Label htmlFor={`wea-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.wealthNotes}
                    onChange={(e) => updateField("wealthNotes", e.target.value)}
                    placeholder="Who gets richer? Who gets poorer?"
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Social Consequences */}
            <CollapsibleSection
              id="section-social"
              title="4. Social Consequences"
              description="Class, family, community, and identity"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Class Structure Effect</Label>
                  <RadioGroup
                    value={formState.classEffect}
                    onValueChange={(value) => updateField("classEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {SOCIAL_CONSEQUENCES.class.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`cls-${opt.value}`} />
                        <Label htmlFor={`cls-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.classNotes}
                    onChange={(e) => updateField("classNotes", e.target.value)}
                    placeholder="How does this affect social stratification?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Family Structure Effect</Label>
                  <RadioGroup
                    value={formState.familyEffect}
                    onValueChange={(value) => updateField("familyEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {SOCIAL_CONSEQUENCES.family.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`fam-${opt.value}`} />
                        <Label htmlFor={`fam-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.familyNotes}
                    onChange={(e) => updateField("familyNotes", e.target.value)}
                    placeholder="How does this affect family structures?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Community Effect</Label>
                  <RadioGroup
                    value={formState.communityEffect}
                    onValueChange={(value) => updateField("communityEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {SOCIAL_CONSEQUENCES.community.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`com-${opt.value}`} />
                        <Label htmlFor={`com-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.communityNotes}
                    onChange={(e) => updateField("communityNotes", e.target.value)}
                    placeholder="How does this affect communities?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Identity Effect</Label>
                  <RadioGroup
                    value={formState.identityEffect}
                    onValueChange={(value) => updateField("identityEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {SOCIAL_CONSEQUENCES.identity.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`idt-${opt.value}`} />
                        <Label htmlFor={`idt-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.identityNotes}
                    onChange={(e) => updateField("identityNotes", e.target.value)}
                    placeholder="How does this affect identity?"
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 5: Political Consequences */}
            <CollapsibleSection
              id="section-political"
              title="5. Political Consequences"
              description="Power, surveillance, and governance"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Power Distribution Effect</Label>
                  <RadioGroup
                    value={formState.powerEffect}
                    onValueChange={(value) => updateField("powerEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {POLITICAL_CONSEQUENCES.power.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`pow-${opt.value}`} />
                        <Label htmlFor={`pow-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.powerNotes}
                    onChange={(e) => updateField("powerNotes", e.target.value)}
                    placeholder="Who gains power? Who loses it?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Surveillance Effect</Label>
                  <RadioGroup
                    value={formState.surveillanceEffect}
                    onValueChange={(value) => updateField("surveillanceEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {POLITICAL_CONSEQUENCES.surveillance.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`sur-${opt.value}`} />
                        <Label htmlFor={`sur-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.surveillanceNotes}
                    onChange={(e) => updateField("surveillanceNotes", e.target.value)}
                    placeholder="How does this affect surveillance?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Governance Effect</Label>
                  <RadioGroup
                    value={formState.governanceEffect}
                    onValueChange={(value) => updateField("governanceEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {POLITICAL_CONSEQUENCES.governance.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`gov-${opt.value}`} />
                        <Label htmlFor={`gov-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.governanceNotes}
                    onChange={(e) => updateField("governanceNotes", e.target.value)}
                    placeholder="How does this affect governance?"
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 6: Military Consequences */}
            <CollapsibleSection
              id="section-military"
              title="6. Military Consequences"
              description="Warfare, defense, and deterrence"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Warfare Effect</Label>
                  <RadioGroup
                    value={formState.warfareEffect}
                    onValueChange={(value) => updateField("warfareEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {MILITARY_CONSEQUENCES.warfare.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`war-${opt.value}`} />
                        <Label htmlFor={`war-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.warfareNotes}
                    onChange={(e) => updateField("warfareNotes", e.target.value)}
                    placeholder="How does this change warfare?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Defense Balance</Label>
                  <RadioGroup
                    value={formState.defenseEffect}
                    onValueChange={(value) => updateField("defenseEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {MILITARY_CONSEQUENCES.defense.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`def-${opt.value}`} />
                        <Label htmlFor={`def-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.defenseNotes}
                    onChange={(e) => updateField("defenseNotes", e.target.value)}
                    placeholder="Attack vs defense balance?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Deterrence Effect</Label>
                  <RadioGroup
                    value={formState.deterrenceEffect}
                    onValueChange={(value) => updateField("deterrenceEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {MILITARY_CONSEQUENCES.deterrence.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`det-${opt.value}`} />
                        <Label htmlFor={`det-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.deterrenceNotes}
                    onChange={(e) => updateField("deterrenceNotes", e.target.value)}
                    placeholder="How does this affect deterrence?"
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 7: Psychological Consequences */}
            <CollapsibleSection
              id="section-psychological"
              title="7. Psychological Consequences"
              description="Perception, values, and fears"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Perception Effect</Label>
                  <RadioGroup
                    value={formState.perceptionEffect}
                    onValueChange={(value) => updateField("perceptionEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {PSYCHOLOGICAL_CONSEQUENCES.perception.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`per-${opt.value}`} />
                        <Label htmlFor={`per-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.perceptionNotes}
                    onChange={(e) => updateField("perceptionNotes", e.target.value)}
                    placeholder="How does this change perception?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Values Effect</Label>
                  <RadioGroup
                    value={formState.valuesEffect}
                    onValueChange={(value) => updateField("valuesEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {PSYCHOLOGICAL_CONSEQUENCES.values.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`val-${opt.value}`} />
                        <Label htmlFor={`val-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.valuesNotes}
                    onChange={(e) => updateField("valuesNotes", e.target.value)}
                    placeholder="How does this affect values?"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Fears Effect</Label>
                  <RadioGroup
                    value={formState.fearsEffect}
                    onValueChange={(value) => updateField("fearsEffect", value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {PSYCHOLOGICAL_CONSEQUENCES.fears.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <RadioGroupItem value={opt.value} id={`fea-${opt.value}`} />
                        <Label htmlFor={`fea-${opt.value}`} className="font-normal cursor-pointer">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground block">{opt.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Textarea
                    value={formState.fearsNotes}
                    onChange={(e) => updateField("fearsNotes", e.target.value)}
                    placeholder="What new fears emerge?"
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 8: SF Examples */}
            <CollapsibleSection
              id="section-examples"
              title="SF Technology Examples"
              description="How similar technologies have been explored in SF"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SF_TECHNOLOGY_EXAMPLES.map((example, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{example.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {TECHNOLOGY_CATEGORIES.find(c => c.value === example.category)?.label}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{example.description}</p>
                      <p className="text-xs text-muted-foreground italic">{example.consequences}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleSection>

            {/* Section 9: Synthesis */}
            <CollapsibleSection
              id="section-synthesis"
              title="Synthesis & Story Potential"
              description="Contradictions, conflicts, and narrative opportunities"
            >
              <div className="space-y-6">
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Contradiction Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm italic mb-3">{randomContradiction}</p>
                    <Button variant="outline" size="sm" onClick={generateRandomContradiction} className="gap-2">
                      <RefreshCw className="w-3 h-3" />
                      Generate New
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Primary Contradiction</Label>
                  <Select
                    value={formState.primaryContradiction}
                    onValueChange={(value) => updateField("primaryContradiction", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the most interesting tension" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRADICTION_PROMPTS.map((prompt, index) => (
                        <SelectItem key={index} value={prompt}>
                          {prompt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Contradiction Analysis</Label>
                  <Textarea
                    value={formState.contradictionAnalysis}
                    onChange={(e) => updateField("contradictionAnalysis", e.target.value)}
                    placeholder="How does this contradiction manifest in your world?"
                    rows={3}
                  />
                </div>

                <Card className="bg-purple-500/10 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Story Conflict Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm italic mb-3">{randomConflict}</p>
                    <Button variant="outline" size="sm" onClick={generateRandomConflict} className="gap-2">
                      <RefreshCw className="w-3 h-3" />
                      Generate New
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Story Conflicts</Label>
                  <Textarea
                    value={formState.storyConflicts}
                    onChange={(e) => updateField("storyConflicts", e.target.value)}
                    placeholder="What conflicts naturally emerge from this technology?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Winners & Losers</Label>
                    <Textarea
                      value={formState.winnersLosers}
                      onChange={(e) => updateField("winnersLosers", e.target.value)}
                      placeholder="Who benefits? Who is harmed?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unexpected Uses</Label>
                    <Textarea
                      value={formState.unexpectedUses}
                      onChange={(e) => updateField("unexpectedUses", e.target.value)}
                      placeholder="How might people misuse this technology?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Technology as Character</Label>
                  <Textarea
                    value={formState.technologyCharacter}
                    onChange={(e) => updateField("technologyCharacter", e.target.value)}
                    placeholder="If this technology were a character, what would its personality be?"
                    rows={3}
                  />
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
            <SectionNavigation sections={SECTIONS} />
          </ToolSidebar>

          <KeyChoicesSidebar sections={keyChoicesSections} />
        </div>
      </main>

      <ToolActionBar
        onSave={handleSave}
        onExport={() => setExportDialogOpen(true)}
        isSaving={updateWorksheet.isPending}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolType={TOOL_TYPE}
        formData={formState}
        title={formState.technologyName || "Technology Consequences Map"}
      />

      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        existingWorksheets={existingWorksheets}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
        toolName="Technology Consequences"
      />

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  );
};

export default TechnologyConsequences;
