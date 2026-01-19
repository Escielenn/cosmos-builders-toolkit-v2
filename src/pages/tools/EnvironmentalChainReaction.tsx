import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Save, ChevronDown, ChevronUp, Info } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Types for form state
interface PlanetaryParameter {
  type: string;
  specificValue: string;
}

interface CascadeLevel {
  responses: Record<string, string>;
}

interface FormState {
  parameter: PlanetaryParameter;
  level1: CascadeLevel;
  level2: CascadeLevel;
  level3: CascadeLevel;
  level4: CascadeLevel;
  level5: CascadeLevel;
  synthesis: {
    logicalFlow: string;
    contradictions: string;
    monoCultureCheck: string;
    vestigialQuestion: string;
    soWhatTest: string;
    surprisingConsequence: string;
    biggestGap: string;
    storyPotential: string;
  };
}

const initialFormState: FormState = {
  parameter: { type: "", specificValue: "" },
  level1: { responses: {} },
  level2: { responses: {} },
  level3: { responses: {} },
  level4: { responses: {} },
  level5: { responses: {} },
  synthesis: {
    logicalFlow: "",
    contradictions: "",
    monoCultureCheck: "",
    vestigialQuestion: "",
    soWhatTest: "",
    surprisingConsequence: "",
    biggestGap: "",
    storyPotential: "",
  },
};

const PLANETARY_PARAMETERS = [
  {
    id: "gravity",
    label: "Gravity",
    options: [
      { value: "high", label: "High gravity (1.5-3x Earth)", description: "Crushing weight, thick atmosphere" },
      { value: "low", label: "Low gravity (0.3-0.8x Earth)", description: "Easier flight, atmosphere loss risk" },
    ],
    placeholder: "e.g., 2.1 Earth gravities",
  },
  {
    id: "rotation",
    label: "Rotation / Day Length",
    options: [
      { value: "slow", label: "Slow rotation (48+ hour days)", description: "Extreme temperature swings" },
      { value: "fast", label: "Fast rotation (6-12 hour days)", description: "Constant day/night cycling" },
      { value: "locked", label: "Tidally locked", description: "Permanent day side/night side/twilight band" },
    ],
    placeholder: "e.g., 72 hours per day, or tidally locked to red dwarf",
  },
  {
    id: "stellar",
    label: "Stellar Environment",
    options: [
      { value: "binary", label: "Binary/multiple star system", description: "Complex seasons, no 'true night'" },
      { value: "reddwarf", label: "Red dwarf orbit", description: "Dim light, tidal locking likely, stellar flares" },
      { value: "rogue", label: "Rogue planet", description: "No star, eternal darkness, internal heat only" },
    ],
    placeholder: "e.g., Binary G-type and K-type stars",
  },
  {
    id: "hydrosphere",
    label: "Hydrosphere",
    options: [
      { value: "ocean", label: "Ocean world (90-100% water)", description: "No landmasses or tiny islands only" },
      { value: "desert", label: "Desert world (0-20% water)", description: "Extreme scarcity, localized sources" },
      { value: "archipelago", label: "Archipelago world (40-60% mixed)", description: "Isolated water-separated cultures" },
    ],
    placeholder: "e.g., 15% surface water coverage",
  },
  {
    id: "atmosphere",
    label: "Atmosphere",
    options: [
      { value: "thick", label: "Thick atmosphere", description: "High pressure, muted light, weather extremes" },
      { value: "thin", label: "Thin atmosphere", description: "Temperature swings, radiation exposure, weak weather" },
      { value: "exotic", label: "Exotic composition", description: "Methane, ammonia, high CO₂" },
    ],
    placeholder: "e.g., 3 atm pressure, 40% CO₂",
  },
  {
    id: "tilt",
    label: "Axial Tilt",
    options: [
      { value: "none", label: "No tilt (0-5°)", description: "No seasons, permanent climate zones" },
      { value: "extreme", label: "Extreme tilt (>45°)", description: "Radical seasonal changes, uninhabitable zones" },
      { value: "chaotic", label: "Chaotic/tumbling", description: "Unpredictable climate (rare)" },
    ],
    placeholder: "e.g., 67 degrees",
  },
  {
    id: "geological",
    label: "Geological Activity",
    options: [
      { value: "high", label: "High tectonic activity", description: "Frequent quakes, volcanic eruptions, mountain building" },
      { value: "dead", label: "Geologically dead", description: "No volcanism, no magnetic field, ancient surface" },
      { value: "cryo", label: "Cryovolcanism", description: "Ice volcanoes (water/ammonia), subsurface ocean" },
    ],
    placeholder: "e.g., Supervolcano every 10,000 years",
  },
  {
    id: "other",
    label: "Other Unique Factor",
    options: [],
    placeholder: "Describe your unique environmental factor...",
  },
];

const LEVEL1_QUESTIONS = [
  {
    id: "architecture",
    label: "Architecture & Settlement Patterns",
    prompts: [
      "Where can structures be built safely?",
      "What building materials/techniques are necessary?",
      "What forms shelter from environmental pressures?",
    ],
  },
  {
    id: "movement",
    label: "Movement & Transportation",
    prompts: [
      "How do inhabitants move within their environment?",
      "What forms of transportation are possible/impossible?",
      "What distances can be traveled safely?",
    ],
  },
  {
    id: "resources",
    label: "Resource Availability & Distribution",
    prompts: [
      "What resources are abundant vs. scarce?",
      "How are essential resources accessed?",
      "What becomes valuable due to scarcity?",
    ],
  },
  {
    id: "technology",
    label: "Technology Pressures",
    prompts: [
      "What technologies must be developed for survival?",
      "What technologies are impossible or impractical?",
      "What everyday Earth technology wouldn't work here?",
    ],
  },
];

const LEVEL2_QUESTIONS = [
  {
    id: "physical",
    label: "Physical Form & Structure",
    prompts: [
      "Body plan adaptations (size, shape, appendages)",
      "Structural features (shells, exoskeletons, flexibility)",
      "Locomotion methods suited to environment",
    ],
    example: "On a high-gravity world, organisms stay low and wide. On a tidally locked world, life clusters in the twilight band.",
  },
  {
    id: "sensory",
    label: "Sensory Systems",
    prompts: [
      "Which senses are enhanced, diminished, or absent?",
      "Any novel senses evolved for this environment?",
      "How does sensory apparatus shape perception?",
    ],
    example: "Dim red dwarf light might favor infrared vision. Eternal darkness might produce echolocation.",
  },
  {
    id: "metabolic",
    label: "Metabolic & Energy Systems",
    prompts: [
      "Energy sources (photosynthesis, chemosynthesis, predation)",
      "Activity cycles (sleep/wake, hibernation, seasonal)",
      "Reproduction strategy",
    ],
  },
  {
    id: "vestigial",
    label: "Vestigial Traits",
    prompts: [
      "What evolutionary remnant no longer serves its original purpose?",
      "What does this reveal about their evolutionary history?",
    ],
    example: "Like human appendix or whale hip bones—what's your species' vestige?",
  },
];

const LEVEL3_QUESTIONS = [
  {
    id: "normal",
    label: 'Concept of "Normal"',
    prompts: ["What do they consider ordinary that humans would find bizarre or terrifying?"],
    example: "On Gethen (Le Guin), shifting gender monthly is normal. On Mesklin (Clement), 700G gravity at the poles is normal.",
  },
  {
    id: "fears",
    label: "Primal Fears",
    prompts: ["What terrifies them at an instinctive, species-level?"],
    example: "Desert dwellers fear water waste. Ocean worlders might fear emptiness or 'the deep.' Tidally locked species might fear the dark or the burning day.",
  },
  {
    id: "temporal",
    label: "Temporal Perception",
    prompts: [
      "How do they experience time?",
      "Do they have urgency or patience shaped by environmental rhythms?",
      "What constitutes 'long-term' vs. 'short-term' thinking?",
    ],
  },
  {
    id: "values",
    label: "Values & Priorities",
    prompts: ["What matters deeply due to environmental/biological pressures?"],
    example: "Fremen value water above all. Extremely long-lived species might value legacy differently.",
  },
  {
    id: "cognitive",
    label: "Cognitive Differences",
    prompts: [
      "How might their sensory apparatus change how they think?",
      "Do they have cognitive abilities humans lack (or vice versa)?",
      "What metaphors structure their worldview?",
    ],
    example: "Heptapods with non-linear language perception in Arrival. Echolocating species using sound-mapping metaphors.",
  },
];

const LEVEL4_QUESTIONS = [
  {
    id: "social",
    label: "Social Organization",
    prompts: [
      "Family/kinship structures",
      "Community organization",
      "Power hierarchies (if any)",
    ],
    example: "Hive species might have caste systems. Solitary evolved species might resist collective authority.",
  },
  {
    id: "economic",
    label: "Economic Systems",
    prompts: [
      "What constitutes wealth/value?",
      "How are resources distributed or controlled?",
      "What economic activities are possible/necessary?",
    ],
    example: "On Arrakis, water is currency. On an ocean world, salt or land might be precious.",
  },
  {
    id: "status",
    label: "Status Symbols & Achievement",
    prompts: ["What demonstrates success, power, or prestige in this culture?"],
  },
  {
    id: "taboos",
    label: "Taboos & Prohibitions",
    prompts: ["What's forbidden or dangerous due to environmental/biological realities?"],
    example: "Fremen never waste water. A low-gravity species might forbid heavy construction. A tidally locked species might forbid venturing into the burning day.",
  },
  {
    id: "art",
    label: "Art & Aesthetics",
    prompts: [
      "What do they consider beautiful, and why?",
      "What art forms emerge from their sensory capabilities?",
      "How do they record history or express meaning?",
    ],
    example: "A species without vision wouldn't paint. An echolocating species might create sound sculptures.",
  },
  {
    id: "conflict",
    label: "Conflict & Resolution",
    prompts: [
      "What do they fight over?",
      "How do they resolve disputes?",
      "What constitutes justice?",
    ],
  },
];

const LEVEL5_QUESTIONS = [
  {
    id: "creation",
    label: "Creation Myth",
    prompts: ["How does your environmental factor appear in their origin story?"],
    example: "Desert peoples often have emergence myths from underground. Ocean peoples might have primordial sea myths. Tidally locked peoples might have dualistic light/dark creation.",
  },
  {
    id: "sacred",
    label: "Sacred/Divine Associations",
    prompts: ["What's worshipped, revered, or considered holy because of environmental realities?"],
    example: "Water gods on desert worlds. The Stillness in a tectonically unstable world (Broken Earth). Sandworms as sacred in Dune.",
  },
  {
    id: "cosmological",
    label: "Central Cosmological Metaphor",
    prompts: ["What metaphor derived from lived environment structures their entire worldview?"],
    example: '"Life is a river" for water-dependent culture. "Existence is a cycle" for strong seasonal worlds. "Balance between light and dark" for tidally locked.',
  },
  {
    id: "ritual",
    label: "Ritual Practices",
    prompts: ["What ceremonies/rituals emerge from environmental realities and biological needs?"],
    example: "Fremen water-reclamation death rituals. Coming-of-age rituals tied to environmental mastery (first surface walk, first dive, surviving the dark, etc.)",
  },
  {
    id: "suffering",
    label: "Mythological Explanation of Suffering",
    prompts: [
      "How do they explain why life is hard?",
      "What gives suffering meaning?",
    ],
  },
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
    <ul className="text-xs text-muted-foreground mb-2 list-disc list-inside">
      {prompts.map((prompt, i) => (
        <li key={i}>{prompt}</li>
      ))}
    </ul>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your response..."
      className="min-h-[100px] bg-background/50"
    />
  </div>
);

const CollapsibleSection = ({
  title,
  subtitle,
  levelNumber,
  thinkLike,
  children,
  defaultOpen = false,
}: {
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
      <GlassPanel className="overflow-hidden">
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

const EnvironmentalChainReaction = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const updateParameter = (field: keyof PlanetaryParameter, value: string) => {
    setFormState((prev) => ({
      ...prev,
      parameter: { ...prev.parameter, [field]: value },
    }));
  };

  const updateLevel = (
    level: "level1" | "level2" | "level3" | "level4" | "level5",
    questionId: string,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [level]: {
        responses: { ...prev[level].responses, [questionId]: value },
      },
    }));
  };

  const updateSynthesis = (field: keyof FormState["synthesis"], value: string) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const handleSave = () => {
    // For now, save to localStorage
    localStorage.setItem("ecr-worksheet", JSON.stringify(formState));
    console.log("Saved to localStorage");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formState, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "environmental-chain-reaction.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background starfield">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className="mb-2">Week 1 Tool</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Environmental Chain Reaction
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Map how planetary parameters cascade into biology, psychology,
                culture, and mythology.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
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
            The Cascade Principle
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Environment shapes biology, biology shapes psychology, psychology
            shapes culture, culture shapes mythology."
          </blockquote>
          <p className="text-muted-foreground">
            This tool applies the xenomythological principle that planetary
            conditions generate unique cultures, psychologies, and
            spiritualities. A desert world doesn't just have different
            weather—it produces different religions, social structures,
            technologies, and concepts of value.
          </p>
        </GlassPanel>

        {/* Form Sections */}
        <div className="space-y-4">
          {/* Step 1: Planetary Parameter */}
          <CollapsibleSection
            title="Select Your Planetary Parameter"
            subtitle="What single environmental factor most defines your world?"
            defaultOpen={true}
          >
            <RadioGroup
              value={formState.parameter.type}
              onValueChange={(value) => updateParameter("type", value)}
              className="space-y-4"
            >
              {PLANETARY_PARAMETERS.map((param) => (
                <div key={param.id} className="space-y-3">
                  <div className="font-medium text-sm text-primary">
                    {param.label}
                  </div>
                  {param.options.length > 0 ? (
                    <div className="grid gap-2 pl-4">
                      {param.options.map((option) => (
                        <div
                          key={`${param.id}-${option.value}`}
                          className="flex items-start gap-3"
                        >
                          <RadioGroupItem
                            value={`${param.id}-${option.value}`}
                            id={`${param.id}-${option.value}`}
                            className="mt-1"
                          />
                          <Label
                            htmlFor={`${param.id}-${option.value}`}
                            className="cursor-pointer"
                          >
                            <span className="font-medium">{option.label}</span>
                            <span className="text-muted-foreground ml-2">
                              — {option.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem
                          value={param.id}
                          id={param.id}
                          className="mt-1"
                        />
                        <Label htmlFor={param.id} className="cursor-pointer">
                          <span className="font-medium">
                            Define your own unique factor
                          </span>
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>

            <div className="mt-6">
              <Label htmlFor="specificValue" className="text-sm font-medium">
                Specific Value
              </Label>
              <Input
                id="specificValue"
                value={formState.parameter.specificValue}
                onChange={(e) =>
                  updateParameter("specificValue", e.target.value)
                }
                placeholder={
                  PLANETARY_PARAMETERS.find(
                    (p) =>
                      formState.parameter.type.startsWith(p.id)
                  )?.placeholder || "Enter the specific value..."
                }
                className="mt-2 bg-background/50"
              />
            </div>
          </CollapsibleSection>

          {/* Level 1: Physical Implications */}
          <CollapsibleSection
            title="Physical Implications"
            subtitle="What does this environmental factor directly affect?"
            levelNumber={1}
            thinkLike="a systems engineer: How does physics constrain everything?"
          >
            {LEVEL1_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level1-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                value={formState.level1.responses[q.id] || ""}
                onChange={(value) => updateLevel("level1", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 2: Biological Adaptations */}
          <CollapsibleSection
            title="Biological Adaptations"
            subtitle="How would life evolve to survive/thrive here?"
            levelNumber={2}
            thinkLike="an evolutionary biologist: Every trait serves survival or is vestigial."
          >
            {LEVEL2_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level2-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level2.responses[q.id] || ""}
                onChange={(value) => updateLevel("level2", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 3: Psychological Consequences */}
          <CollapsibleSection
            title="Psychological Consequences"
            subtitle="How do physical/biological factors shape perception, emotion, and thought?"
            levelNumber={3}
            thinkLike="a psychologist: Biology determines baseline psychology."
          >
            {LEVEL3_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level3-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level3.responses[q.id] || ""}
                onChange={(value) => updateLevel("level3", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 4: Cultural Expressions */}
          <CollapsibleSection
            title="Cultural Expressions"
            subtitle="How do psychology and biology create social systems?"
            levelNumber={4}
            thinkLike="an anthropologist: Culture is collective psychology made visible."
          >
            {LEVEL4_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level4-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level4.responses[q.id] || ""}
                onChange={(value) => updateLevel("level4", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Level 5: Mythological Framework */}
          <CollapsibleSection
            title="Mythological Framework"
            subtitle="How do all previous levels generate sacred beliefs and stories?"
            levelNumber={5}
            thinkLike="a mythographer: Myth explains existence and validates culture."
          >
            {LEVEL5_QUESTIONS.map((q) => (
              <QuestionSection
                key={q.id}
                id={`level5-${q.id}`}
                label={q.label}
                prompts={q.prompts}
                example={q.example}
                value={formState.level5.responses[q.id] || ""}
                onChange={(value) => updateLevel("level5", q.id, value)}
              />
            ))}
          </CollapsibleSection>

          {/* Cascade Consistency Check */}
          <CollapsibleSection
            title="Cascade Consistency Check"
            subtitle="Review your five levels and validate internal consistency"
          >
            <div className="space-y-6">
              <QuestionSection
                id="synthesis-logical"
                label="1. Logical Flow"
                prompts={[
                  "Does each level follow naturally from the previous one?",
                  "Where are unexpected leaps?",
                ]}
                value={formState.synthesis.logicalFlow}
                onChange={(value) => updateSynthesis("logicalFlow", value)}
              />

              <QuestionSection
                id="synthesis-contradictions"
                label="2. Internal Contradictions"
                prompts={[
                  "Do any elements conflict?",
                  "(Some contradictions are good—they create cultural tension!)",
                ]}
                value={formState.synthesis.contradictions}
                onChange={(value) => updateSynthesis("contradictions", value)}
              />

              <QuestionSection
                id="synthesis-monoculture"
                label="3. Mono-Culture Warning"
                prompts={[
                  "Have you created variety within this framework?",
                  "Remember: Earth has deserts, but not all desert cultures are identical.",
                ]}
                value={formState.synthesis.monoCultureCheck}
                onChange={(value) => updateSynthesis("monoCultureCheck", value)}
              />

              <QuestionSection
                id="synthesis-vestigial"
                label="4. The Vestigial Question"
                prompts={[
                  "What element persists from their past that no longer makes sense?",
                  "(This often creates the most interesting conflicts.)",
                ]}
                value={formState.synthesis.vestigialQuestion}
                onChange={(value) => updateSynthesis("vestigialQuestion", value)}
              />

              <QuestionSection
                id="synthesis-sowhat"
                label='5. The "So What?" Test'
                prompts={[
                  "Would removing this planetary parameter fundamentally change everything you've built?",
                  "If not, it's not actually core to your world.",
                ]}
                value={formState.synthesis.soWhatTest}
                onChange={(value) => updateSynthesis("soWhatTest", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Synthesis */}
          <CollapsibleSection
            title="Synthesis"
            subtitle="Capture your key discoveries"
          >
            <div className="space-y-6">
              <div>
                <Label htmlFor="surprising" className="text-sm font-medium">
                  Most surprising consequence you discovered:
                </Label>
                <Textarea
                  id="surprising"
                  value={formState.synthesis.surprisingConsequence}
                  onChange={(e) =>
                    updateSynthesis("surprisingConsequence", e.target.value)
                  }
                  placeholder="What unexpected connection emerged from working through the cascade?"
                  className="mt-2 min-h-[80px] bg-background/50"
                />
              </div>

              <div>
                <Label htmlFor="gap" className="text-sm font-medium">
                  Biggest gap or unresolved tension:
                </Label>
                <Textarea
                  id="gap"
                  value={formState.synthesis.biggestGap}
                  onChange={(e) =>
                    updateSynthesis("biggestGap", e.target.value)
                  }
                  placeholder="What needs more development or contains productive contradictions?"
                  className="mt-2 min-h-[80px] bg-background/50"
                />
              </div>

              <div>
                <Label htmlFor="story" className="text-sm font-medium">
                  Story potential this creates:
                </Label>
                <Textarea
                  id="story"
                  value={formState.synthesis.storyPotential}
                  onChange={(e) =>
                    updateSynthesis("storyPotential", e.target.value)
                  }
                  placeholder="What conflicts, characters, or narratives does this world naturally generate?"
                  className="mt-2 min-h-[80px] bg-background/50"
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Final Reminder */}
        <GlassPanel className="p-6 mt-8 text-center">
          <p className="text-muted-foreground italic">
            The most believable worlds aren't the most complex—they're the most
            internally consistent. Every element should cascade logically from
            your core environmental choice.
          </p>
        </GlassPanel>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
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

export default EnvironmentalChainReaction;
