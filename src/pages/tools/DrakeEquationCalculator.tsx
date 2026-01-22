import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Save, ChevronDown, ChevronUp, Info, Printer, ExternalLink, Cloud, CloudOff, Calculator, HelpCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import WorldSelectDialog, { SaveSelection } from "@/components/tools/WorldSelectDialog";
import SectionNavigation, { Section } from "@/components/tools/SectionNavigation";
import ToolActionBar from "@/components/tools/ToolActionBar";
import { Json } from "@/integrations/supabase/types";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-intro", title: "Introduction" },
  { id: "section-variables", title: "Variables" },
  { id: "section-result", title: "Result" },
  { id: "section-worldbuilding", title: "Worldbuilding" },
  { id: "section-presets", title: "Presets" },
];

// Drake Equation variable definitions
const DRAKE_VARIABLES = [
  {
    id: "rStar",
    symbol: "R*",
    name: "Star Formation Rate",
    description: "Average rate of star formation in our galaxy (per year)",
    unit: "stars/year",
    min: 0.1,
    max: 50,
    step: 0.1,
    default: 1.5,
    scientificRange: { low: 1, high: 3, note: "Current scientific estimates" },
    worldbuildingNote: "A higher rate suggests a young, active galaxy with many new stellar nurseries. Lower rates might mean an older, quieter galaxy.",
  },
  {
    id: "fp",
    symbol: "fp",
    name: "Fraction with Planets",
    description: "Fraction of stars that have planetary systems",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 1,
    scientificRange: { low: 0.9, high: 1, note: "Kepler data suggests nearly all stars have planets" },
    worldbuildingNote: "Modern exoplanet surveys show planets are extremely common. A low value might indicate planetary formation is somehow inhibited in your galaxy.",
  },
  {
    id: "ne",
    symbol: "ne",
    name: "Habitable Planets per System",
    description: "Average number of planets that could support life per star with planets",
    unit: "planets",
    min: 0,
    max: 10,
    step: 0.1,
    default: 0.4,
    scientificRange: { low: 0.1, high: 0.5, note: "Highly uncertain, depends on definition of habitable" },
    worldbuildingNote: "This is where your definition of 'habitable' matters most. Strict Earth-like? Or any world life could adapt to?",
  },
  {
    id: "fl",
    symbol: "fl",
    name: "Fraction Where Life Develops",
    description: "Fraction of habitable planets where life actually arises",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.5,
    scientificRange: { low: 0.001, high: 1, note: "Completely unknown—life might be easy or near-miraculous" },
    worldbuildingNote: "The Great Filter might be here. If life is easy, the galaxy should be teeming. If rare, we might be alone.",
  },
  {
    id: "fi",
    symbol: "fi",
    name: "Fraction with Intelligence",
    description: "Fraction of life-bearing planets that develop intelligent life",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.5,
    scientificRange: { low: 0.001, high: 1, note: "Earth took 4 billion years—is intelligence inevitable or a fluke?" },
    worldbuildingNote: "Intelligence might be evolutionarily expensive. Does it always win, or do other strategies dominate?",
  },
  {
    id: "fc",
    symbol: "fc",
    name: "Fraction with Detectable Technology",
    description: "Fraction of intelligent civilizations that develop detectable technology",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.2,
    scientificRange: { low: 0.01, high: 0.2, note: "Technology might not be inevitable—many paths exist" },
    worldbuildingNote: "Not all intelligent species may develop technology. Aquatic species can't smelt metal. Some might choose other paths.",
  },
  {
    id: "L",
    symbol: "L",
    name: "Civilization Longevity",
    description: "Average length of time civilizations release detectable signals (years)",
    unit: "years",
    min: 10,
    max: 1000000000,
    step: 10,
    default: 10000,
    scientificRange: { low: 100, high: 10000000, note: "Humanity has been detectable for ~100 years" },
    worldbuildingNote: "This is the most worldbuilding-relevant variable. What kills civilizations? What lets some persist?",
    useLogScale: true,
  },
];

// Preset scenarios for worldbuilding
const PRESETS = [
  {
    id: "optimistic",
    name: "Optimistic / Space Opera",
    description: "A crowded galaxy with civilizations everywhere. Perfect for space opera, galactic empires, and first contact stories.",
    values: { rStar: 3, fp: 1, ne: 2, fl: 1, fi: 0.5, fc: 0.5, L: 1000000 },
    storyTypes: ["Space opera", "Galactic politics", "Federation stories", "Alien allies"],
  },
  {
    id: "pessimistic",
    name: "Pessimistic / Lonely Universe",
    description: "A quiet galaxy where we might be alone. Perfect for hard SF, existential themes, and exploration stories.",
    values: { rStar: 1, fp: 0.5, ne: 0.1, fl: 0.01, fi: 0.01, fc: 0.01, L: 1000 },
    storyTypes: ["Hard SF", "Generation ships", "Silent cosmos", "Human manifest destiny"],
  },
  {
    id: "rare-earth",
    name: "Rare Earth Hypothesis",
    description: "Life is common but complex life is extremely rare. Many simple organisms, few civilizations.",
    values: { rStar: 2, fp: 1, ne: 0.5, fl: 0.5, fi: 0.001, fc: 0.1, L: 10000 },
    storyTypes: ["Microbial life everywhere", "We're special", "Gardens of simple life"],
  },
  {
    id: "great-filter",
    name: "Great Filter Ahead",
    description: "Civilizations arise but quickly destroy themselves. Ruins everywhere, living civilizations rare.",
    values: { rStar: 2, fp: 1, ne: 1, fl: 0.5, fi: 0.2, fc: 0.5, L: 200 },
    storyTypes: ["Ancient ruins", "Cosmic archaeology", "Warnings from the past", "Existential risk"],
  },
  {
    id: "dark-forest",
    name: "Dark Forest",
    description: "Civilizations exist but hide. Detection means death. A paranoid, dangerous cosmos.",
    values: { rStar: 2, fp: 1, ne: 1, fl: 0.3, fi: 0.1, fc: 0.01, L: 100000 },
    storyTypes: ["Cosmic horror", "Silent running", "First contact as threat", "Hiding civilizations"],
  },
  {
    id: "current-science",
    name: "Current Scientific Estimates",
    description: "Middle-ground values based on modern astrophysics. The 'best guess' scenario.",
    values: { rStar: 1.5, fp: 1, ne: 0.4, fl: 0.5, fi: 0.5, fc: 0.2, L: 10000 },
    storyTypes: ["Near-future SF", "Realistic contact", "SETI themes"],
  },
];

// Form state interface
interface FormState {
  values: {
    rStar: number;
    fp: number;
    ne: number;
    fl: number;
    fi: number;
    fc: number;
    L: number;
  };
  notes: {
    rStar: string;
    fp: string;
    ne: string;
    fl: string;
    fi: string;
    fc: string;
    L: string;
  };
  worldbuilding: {
    fermiAnswer: string;
    greatFilterLocation: string;
    galaxyCharacter: string;
    storyImplications: string;
    civilizationTypes: string;
  };
}

const initialFormState: FormState = {
  values: {
    rStar: 1.5,
    fp: 1,
    ne: 0.4,
    fl: 0.5,
    fi: 0.5,
    fc: 0.2,
    L: 10000,
  },
  notes: {
    rStar: "",
    fp: "",
    ne: "",
    fl: "",
    fi: "",
    fc: "",
    L: "",
  },
  worldbuilding: {
    fermiAnswer: "",
    greatFilterLocation: "",
    galaxyCharacter: "",
    storyImplications: "",
    civilizationTypes: "",
  },
};

// Local storage key
const LOCAL_STORAGE_KEY = "drake-equation-calculator-v1";

// Collapsible section component
const CollapsibleSection = ({
  id,
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <GlassPanel id={id} className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/20 transition-colors rounded-t-xl">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </GlassPanel>
  );
};

const DrakeEquationCalculator = () => {
  useBackground();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");
  const worksheetId = searchParams.get("worksheetId");

  const { worlds } = useWorlds();
  const { worksheets, createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet } = useWorksheet(worksheetId || undefined);

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedToCloud, setLastSavedToCloud] = useState<Date | null>(null);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  // Calculate N (result of Drake Equation)
  const N = useMemo(() => {
    const { rStar, fp, ne, fl, fi, fc, L } = formState.values;
    return rStar * fp * ne * fl * fi * fc * L;
  }, [formState.values]);

  // Format large numbers
  const formatNumber = (n: number): string => {
    if (n < 1) return n.toFixed(4);
    if (n < 10) return n.toFixed(2);
    if (n < 1000) return n.toFixed(1);
    if (n < 1000000) return Math.round(n).toLocaleString();
    if (n < 1000000000) return (n / 1000000).toFixed(1) + " million";
    return (n / 1000000000).toFixed(1) + " billion";
  };

  // Get interpretation of result
  const getInterpretation = (n: number): { label: string; color: string; description: string } => {
    if (n < 1) return {
      label: "Very Lonely",
      color: "text-blue-400",
      description: "Fewer than one civilization expected. We may be alone in the galaxy, or civilizations are so rare that contact is essentially impossible."
    };
    if (n < 10) return {
      label: "Lonely",
      color: "text-cyan-400",
      description: "A handful of civilizations might exist. Finding each other would be like finding needles in a cosmic haystack."
    };
    if (n < 100) return {
      label: "Sparse",
      color: "text-green-400",
      description: "Dozens of civilizations. Contact is possible but requires patience and luck. Good for stories about first contact as a rare, meaningful event."
    };
    if (n < 1000) return {
      label: "Moderate",
      color: "text-yellow-400",
      description: "Hundreds of civilizations. Enough for a network, but vast distances mean most remain isolated. Good for stories about distant rumors."
    };
    if (n < 10000) return {
      label: "Crowded",
      color: "text-orange-400",
      description: "Thousands of civilizations. Regional groupings, alliances, and conflicts become possible. Classic space opera territory."
    };
    return {
      label: "Teeming",
      color: "text-red-400",
      description: "A galaxy full of life. Civilizations bump into each other regularly. Think Star Trek or Star Wars. The Fermi Paradox becomes very pressing."
    };
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && !worksheetId) {
      try {
        const parsed = JSON.parse(saved);
        setFormState(parsed);
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
  }, [worksheetId]);

  // Load from worksheet if editing
  useEffect(() => {
    if (existingWorksheet?.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setLastSavedToCloud(new Date(existingWorksheet.updated_at));
      } catch (e) {
        console.error("Failed to load worksheet:", e);
      }
    }
  }, [existingWorksheet]);

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));
      setHasUnsavedChanges(true);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formState]);

  // Update a single value
  const updateValue = (key: keyof FormState["values"], value: number) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [key]: value },
    }));
  };

  // Update a note
  const updateNote = (key: keyof FormState["notes"], value: string) => {
    setFormState(prev => ({
      ...prev,
      notes: { ...prev.notes, [key]: value },
    }));
  };

  // Update worldbuilding notes
  const updateWorldbuilding = (key: keyof FormState["worldbuilding"], value: string) => {
    setFormState(prev => ({
      ...prev,
      worldbuilding: { ...prev.worldbuilding, [key]: value },
    }));
  };

  // Apply a preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormState(prev => ({
      ...prev,
      values: { ...preset.values },
    }));
    toast({
      title: `Applied: ${preset.name}`,
      description: preset.description,
    });
  };

  // Save to cloud
  const handleSave = async (selection: SaveSelection) => {
    setIsSavingToCloud(true);
    try {
      const worksheetData = {
        world_id: selection.worldId,
        tool_type: "drake-equation-calculator",
        name: selection.name,
        data: formState as unknown as Json,
      };

      if (selection.worksheetId) {
        await updateWorksheet.mutateAsync({
          id: selection.worksheetId,
          data: formState as unknown as Json,
          name: selection.name,
        });
      } else {
        await createWorksheet.mutateAsync(worksheetData);
      }

      setLastSavedToCloud(new Date());
      setHasUnsavedChanges(false);
      setSaveDialogOpen(false);

      toast({
        title: "Saved to cloud",
        description: `Your Drake Equation calculator has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save to cloud. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Export as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(formState, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drake-equation-calculator.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Downloaded as JSON file." });
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  const interpretation = getInterpretation(N);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* Back Link */}
        <Link
          to={worldId ? `/worlds/${worldId}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {worldId ? "Back to World" : "Back to Dashboard"}
        </Link>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold">Drake Equation Calculator</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Calculate the number of detectable civilizations in your galaxy. Use this tool to establish
              the cosmic context for your science fiction world—from lonely universe to teeming galaxy.
            </p>
          </div>

          {/* Cloud Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lastSavedToCloud ? (
              <>
                <Cloud className="w-4 h-4 text-green-500" />
                <span>Saved {lastSavedToCloud.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" />
                <span>Local only</span>
              </>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <ToolActionBar
          onSave={() => setSaveDialogOpen(true)}
          onPrint={handlePrint}
          onExport={handleExport}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSavingToCloud}
        />

        {/* Section Navigation */}
        <SectionNavigation sections={SECTIONS} />

        {/* Introduction Section */}
        <CollapsibleSection
          id="section-intro"
          title="The Drake Equation"
          icon={<Info className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              In 1961, astronomer Frank Drake created an equation to estimate the number of
              active, communicative extraterrestrial civilizations in the Milky Way. For worldbuilders,
              it's a framework for deciding how populated your galaxy should be.
            </p>

            <div className="bg-accent/20 p-4 rounded-lg my-4 font-mono text-center text-lg">
              N = R* × f<sub>p</sub> × n<sub>e</sub> × f<sub>l</sub> × f<sub>i</sub> × f<sub>c</sub> × L
            </div>

            <p className="text-sm text-muted-foreground">
              Each variable represents a step from star formation to detectable civilization.
              Adjust the sliders below to explore different scenarios for your world.
            </p>
          </div>
        </CollapsibleSection>

        {/* Variables Section */}
        <CollapsibleSection
          id="section-variables"
          title="Variables"
          icon={<Calculator className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="space-y-8">
            {DRAKE_VARIABLES.map((variable) => (
              <div key={variable.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-base font-semibold">
                        {variable.symbol} — {variable.name}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">{variable.description}</p>
                          <p className="text-xs text-muted-foreground">{variable.scientificRange.note}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{variable.description}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <span className="text-2xl font-mono font-bold text-primary">
                      {variable.useLogScale
                        ? formatNumber(formState.values[variable.id as keyof FormState["values"]])
                        : formState.values[variable.id as keyof FormState["values"]].toFixed(variable.step < 1 ? 2 : 0)
                      }
                    </span>
                    {variable.unit && (
                      <span className="text-xs text-muted-foreground block">{variable.unit}</span>
                    )}
                  </div>
                </div>

                <Slider
                  value={[variable.useLogScale
                    ? Math.log10(formState.values[variable.id as keyof FormState["values"]])
                    : formState.values[variable.id as keyof FormState["values"]]
                  ]}
                  min={variable.useLogScale ? Math.log10(variable.min) : variable.min}
                  max={variable.useLogScale ? Math.log10(variable.max) : variable.max}
                  step={variable.useLogScale ? 0.1 : variable.step}
                  onValueChange={([val]) => {
                    const actualValue = variable.useLogScale ? Math.pow(10, val) : val;
                    updateValue(variable.id as keyof FormState["values"], actualValue);
                  }}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{variable.useLogScale ? formatNumber(variable.min) : variable.min}</span>
                  <span className="text-primary/70">
                    Scientific range: {variable.scientificRange.low}–{variable.useLogScale ? formatNumber(variable.scientificRange.high) : variable.scientificRange.high}
                  </span>
                  <span>{variable.useLogScale ? formatNumber(variable.max) : variable.max}</span>
                </div>

                <p className="text-xs text-muted-foreground/70 italic">{variable.worldbuildingNote}</p>

                <Textarea
                  placeholder={`Your notes on ${variable.name.toLowerCase()} in your world...`}
                  value={formState.notes[variable.id as keyof FormState["notes"]]}
                  onChange={(e) => updateNote(variable.id as keyof FormState["notes"], e.target.value)}
                  className="mt-2 text-sm"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Result Section */}
        <CollapsibleSection
          id="section-result"
          title="Result: N"
          icon={<Calculator className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground mb-2">
              Estimated number of detectable civilizations:
            </div>
            <div className={`text-6xl font-mono font-bold mb-4 ${interpretation.color}`}>
              {formatNumber(N)}
            </div>
            <Badge variant="outline" className={`text-lg px-4 py-1 ${interpretation.color}`}>
              {interpretation.label}
            </Badge>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              {interpretation.description}
            </p>

            <div className="mt-8 bg-accent/20 rounded-lg p-4 text-left">
              <h4 className="font-semibold mb-2">The Equation</h4>
              <div className="font-mono text-sm overflow-x-auto">
                N = {formState.values.rStar} × {formState.values.fp} × {formState.values.ne} × {formState.values.fl} × {formState.values.fi} × {formState.values.fc} × {formatNumber(formState.values.L)}
              </div>
              <div className="font-mono text-sm mt-1 text-primary">
                N = {formatNumber(N)}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Worldbuilding Section */}
        <CollapsibleSection
          id="section-worldbuilding"
          title="Worldbuilding Implications"
          icon={<ExternalLink className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Your Answer to the Fermi Paradox</Label>
              <p className="text-sm text-muted-foreground mb-2">
                If your N is high but your galaxy seems empty, why? If N is low, what does that mean for your characters?
              </p>
              <Textarea
                placeholder="Why haven't we found them? Or why are they everywhere? What's your galaxy's answer to 'Where is everyone?'"
                value={formState.worldbuilding.fermiAnswer}
                onChange={(e) => updateWorldbuilding("fermiAnswer", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Where Is the Great Filter?</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Which step is hardest to pass? This shapes whether your ruins are biological or technological.
              </p>
              <Textarea
                placeholder="Is life hard to start? Intelligence rare? Technology self-destructive? Civilizations short-lived?"
                value={formState.worldbuilding.greatFilterLocation}
                onChange={(e) => updateWorldbuilding("greatFilterLocation", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Character of Your Galaxy</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Based on your N, what's the general feel of space travel in your world?
              </p>
              <Textarea
                placeholder="Crowded and political? Empty and haunting? Scattered with ancient ruins? Teeming with diversity?"
                value={formState.worldbuilding.galaxyCharacter}
                onChange={(e) => updateWorldbuilding("galaxyCharacter", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Story Implications</Label>
              <p className="text-sm text-muted-foreground mb-2">
                What kinds of stories does your galactic population enable or prevent?
              </p>
              <Textarea
                placeholder="First contact stories? Galactic wars? Lonely exploration? Ancient mysteries?"
                value={formState.worldbuilding.storyImplications}
                onChange={(e) => updateWorldbuilding("storyImplications", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Types of Civilizations</Label>
              <p className="text-sm text-muted-foreground mb-2">
                What kinds of civilizations exist in your galaxy? What are their relationships?
              </p>
              <Textarea
                placeholder="Elder races? Young upstarts? Hive minds? Artificial intelligences? Machine civilizations?"
                value={formState.worldbuilding.civilizationTypes}
                onChange={(e) => updateWorldbuilding("civilizationTypes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Presets Section */}
        <CollapsibleSection
          id="section-presets"
          title="Scenario Presets"
          icon={<Info className="w-5 h-5 text-primary" />}
          defaultOpen={true}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Click a preset to load its values. These represent common science fiction scenarios.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {PRESETS.map((preset) => (
              <GlassPanel
                key={preset.id}
                className="p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <h4 className="font-semibold mb-1">{preset.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.storyTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </GlassPanel>
            ))}
          </div>
        </CollapsibleSection>

        {/* Learn More Link */}
        <div className="mt-8 text-center">
          <Link
            to="/learn/drake-equation"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Learn more about the Drake Equation for worldbuilding
          </Link>
        </div>
      </main>

      {/* Save Dialog */}
      {user && (
        <WorldSelectDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSave}
          worlds={worlds}
          worksheets={worksheets}
          toolType="drake-equation-calculator"
          currentWorldId={worldId || undefined}
          currentWorksheetId={worksheetId || undefined}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 print:hidden">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 Jason D. Batt, Ph.D. •{" "}
            <a
              href="https://jbatt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              jbatt.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DrakeEquationCalculator;
