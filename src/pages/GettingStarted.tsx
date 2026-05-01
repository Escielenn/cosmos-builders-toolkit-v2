import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Bug,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToolDisplayName, isProTool } from "@/lib/tools-config";
import { GuideNav } from "@/components/layout/GuideNav";

// ── Cascade Stage Data ─────────────────────────────────────

const CASCADE_STAGES = [
  {
    id: "physics",
    label: "Physics",
    sublabels: ["Gravity", "Radiation", "Orbit"],
    color: "#FFB800",
    description: "The fundamental laws that govern your universe.",
  },
  {
    id: "environment",
    label: "Environment",
    sublabels: ["Climate", "Terrain", "Resources"],
    color: "#4D9FFF",
    description: "Planetary conditions shaped by physics.",
  },
  {
    id: "biology",
    label: "Biology",
    sublabels: ["Anatomy", "Senses", "Lifecycle"],
    color: "#00FF88",
    description: "Life shaped by environmental pressures.",
  },
  {
    id: "psychology",
    label: "Psychology",
    sublabels: ["Cognition", "Emotion", "Communication"],
    color: "#9B5DE5",
    description: "Minds shaped by bodies and environments.",
  },
  {
    id: "mythology",
    label: "Mythology",
    sublabels: ["Meaning", "Ritual", "Taboo"],
    color: "#5B8DEF",
    description: "The stories civilizations tell to explain their world.",
  },
  {
    id: "culture",
    label: "Culture",
    sublabels: ["Society", "Economy", "Technology"],
    color: "#FF9800",
    description: "How intelligent life organizes itself.",
  },
] as const;

// ── Entry Points ───────────────────────────────────────────

const ENTRY_POINTS = [
  {
    id: "scratch",
    icon: Sparkles,
    label: "I'm starting from scratch",
    description:
      "No specific idea yet. Want to explore what's possible and let a world emerge from the tools.",
    tone: "Let's build from the ground up. Literally. We'll start with a star, find a habitable zone, design a planet, and watch how that environment shapes everything that lives there.",
    action: "pathway",
  },
  {
    id: "story",
    icon: BookOpen,
    label: "I have a story concept",
    description:
      "Has plot or themes but needs a world that serves them. Knows what should happen but not where.",
    tone: "Your story's needs will constrain your world, which actually makes building easier. Start with the tools that match your narrative requirements.",
    action: "tools",
    suggestedTools: [
      "one-big-lie",
      "planetary-profile",
      "propulsion-consequences-map",
    ],
  },
  {
    id: "species",
    icon: Bug,
    label: "I have aliens that need grounding",
    description:
      "Has a creature concept but needs the evolutionary and environmental logic that makes them real.",
    tone: "Reverse-engineer the world that would produce exactly this species. What pressures shaped them? What environment selected for these traits?",
    action: "tools",
    suggestedTools: [
      "evolutionary-biology",
      "planetary-profile",
      "sensorium",
    ],
  },
  {
    id: "explore",
    icon: Compass,
    label: "Just exploring",
    description:
      "Want to browse, experiment, and learn the tools without commitment.",
    tone: "The forge is yours. Browse tools by what they help you build. Try anything; nothing is permanent until you save it.",
    action: "wiki",
  },
] as const;

// ── Guided First World Steps ───────────────────────────────

const PATHWAY_STEPS = [
  {
    number: 1,
    title: "Star & Habitable Zone",
    toolIds: ["habitable-zone-calculator", "star-system-builder"],
    intro:
      "Every world orbits something. The star you choose determines almost everything else: how much light and heat reach your planet, what colors dominate the sky, how long a \"year\" feels, and whether your world is tidally locked to a red dwarf or spinning freely around a yellow sun like ours.",
    cascadeForward:
      "This star determines where your planet can exist and still have liquid water. Let's place your world in that zone.",
    output: "Star type, habitable zone boundaries, orbital parameters.",
  },
  {
    number: 2,
    title: "Planetary Profile",
    toolIds: ["planetary-profile", "surface-gravity-calculator"],
    intro:
      "Now we build the planet itself. Mass determines gravity: how hard it is to stand up, how high creatures can jump, how thick the atmosphere can be. Rotation determines day length: how organisms sleep, hunt, and photosynthesize. These aren't arbitrary numbers; they're the physics that will shape every living thing.",
    cascadeForward:
      "Gravity and atmosphere determine climate patterns. Higher gravity means denser air, different weather, and constraints on how large flying creatures can be. Let's see what life emerges.",
    output: "Mass, gravity, atmosphere, day length, climate zones.",
  },
  {
    number: 3,
    title: "Life & Evolution",
    toolIds: ["evolutionary-biology", "sensorium"],
    intro:
      "The environment you've built isn't just a backdrop. It's a filter. Every trait your species has exists because it helped their ancestors survive here, in this gravity, under this light, across these biomes. Evolution isn't random; it's a conversation between organisms and their world.",
    cascadeForward:
      "Biology becomes psychology. A species with different senses, metabolism, and social structures doesn't think like a human. Their bodies shape their metaphors, their senses shape their art.",
    output: "Species profile, sensory systems, evolutionary rationale.",
  },
  {
    number: 4,
    title: "Mythology & Meaning",
    toolIds: ["xenomythology-framework-builder"],
    intro:
      "Culture isn't arbitrary. It emerges from bodies, environments, and minds. A species that sees in infrared has different aesthetics. A species that never experienced winter has no harvest festivals. What do they find sacred? What do they fear? What stories do they tell to explain their existence?",
    cascadeForward: null,
    output: "Mythology profile, creation myth, ritual descriptions, cultural foundations.",
  },
];

// ── Interactive Cascade Diagram ────────────────────────────

function CascadeDiagram({
  activeStage,
  onStageClick,
}: {
  activeStage: string | null;
  onStageClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-1 md:gap-0">
      {CASCADE_STAGES.map((stage, i) => {
        const isActive = activeStage === stage.id;
        const isDownstream =
          activeStage !== null &&
          CASCADE_STAGES.findIndex((s) => s.id === activeStage) <
            CASCADE_STAGES.findIndex((s) => s.id === stage.id);

        return (
          <div key={stage.id} className="flex items-center md:flex-1">
            <button
              type="button"
              onClick={() => onStageClick(stage.id)}
              className={`w-full md:flex-1 text-left px-3 py-3 border transition-all duration-300 ${
                isActive
                  ? "border-white/20 bg-white/5"
                  : isDownstream
                  ? "border-white/8 bg-white/[0.02]"
                  : "border-white/5 bg-transparent hover:border-white/10"
              }`}
            >
              <div
                className="text-[10px] font-heading uppercase tracking-[2px] mb-1 transition-colors duration-300"
                style={{
                  color: isActive
                    ? stage.color
                    : isDownstream
                    ? `${stage.color}99`
                    : "hsla(0,0%,100%,0.28)",
                }}
              >
                {stage.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {stage.sublabels.map((sub) => (
                  <span
                    key={sub}
                    className={`text-[9px] font-mono transition-colors duration-300 ${
                      isActive || isDownstream ? "text-t4" : "text-t5"
                    }`}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </button>
            {i < CASCADE_STAGES.length - 1 && (
              <ChevronRight
                className={`w-3 h-3 shrink-0 hidden md:block transition-colors duration-300 ${
                  isDownstream || isActive ? "text-t3" : "text-t5"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Pathway Step Card ──────────────────────────────────────

function PathwayStep({
  step,
  isActive,
  isComplete,
  onActivate,
}: {
  step: (typeof PATHWAY_STEPS)[number];
  isActive: boolean;
  isComplete: boolean;
  onActivate: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`border-l-2 pl-5 pb-8 transition-colors ${
        isActive
          ? "border-primary"
          : isComplete
          ? "border-primary/30"
          : "border-white/5"
      }`}
    >
      {/* Step header */}
      <button
        type="button"
        onClick={onActivate}
        className="flex items-center gap-3 mb-3 group w-full text-left"
      >
        <div
          className={`w-7 h-7 rounded-sm flex items-center justify-center font-mono text-xs transition-colors ${
            isActive
              ? "bg-primary/10 border border-primary/30 text-primary"
              : isComplete
              ? "bg-primary/5 border border-primary/15 text-primary/60"
              : "bg-white/[0.03] border border-white/10 text-t4"
          }`}
        >
          {isComplete ? <Check className="w-3.5 h-3.5" /> : step.number}
        </div>
        <h3
          className={`font-heading text-sm uppercase tracking-[2px] transition-colors ${
            isActive
              ? "text-[hsl(var(--sf-section-green))]"
              : isComplete
              ? "text-t3"
              : "text-t4"
          }`}
        >
          {step.title}
        </h3>
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-t2 text-sm leading-relaxed">{step.intro}</p>

          {/* Tool links */}
          <div className="flex flex-wrap gap-2">
            {step.toolIds.map((toolId) => {
              const isPro = isProTool(toolId);
              return (
                <Button
                  key={toolId}
                  variant="outline"
                  size="sm"
                  className="rounded-none text-xs gap-1.5"
                  onClick={() => navigate(`/tools/${toolId}`)}
                >
                  {getToolDisplayName(toolId)}
                  {isPro && (
                    <Badge variant="outline" className="text-[8px] text-sf-violet border-violet-400/20 px-1 py-0 ml-1">
                      PRO
                    </Badge>
                  )}
                  <ExternalLink className="w-3 h-3 ml-0.5 text-t4" />
                </Button>
              );
            })}
          </div>

          {/* Expected output */}
          <GlassPanel className="p-3">
            <span className="text-t4 text-[10px] uppercase tracking-wider block mb-1">
              What you'll create
            </span>
            <span className="text-t2 text-xs">{step.output}</span>
          </GlassPanel>

          {/* Cascade forward */}
          {step.cascadeForward && (
            <div className="flex items-start gap-2 pt-1">
              <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-primary/80 text-xs italic leading-relaxed">
                {step.cascadeForward}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const GettingStarted = () => {
  const [cascadeActiveStage, setCascadeActiveStage] = useState<string | null>(
    null,
  );
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();

  const handleCascadeClick = (id: string) => {
    setCascadeActiveStage((prev) => (prev === id ? null : id));
  };

  const handleEntrySelect = (entryId: string) => {
    setSelectedEntry(entryId);
  };

  const handleStepComplete = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps((prev) => [...prev, activeStep]);
    }
    if (activeStep < PATHWAY_STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const selectedEntryData = ENTRY_POINTS.find((e) => e.id === selectedEntry);

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="max-w-[900px] mx-auto px-4 md:px-6 pt-24 pb-16">
        <GuideNav />

        {/* ── Section 1: Cascade Tutorial ─────────────────── */}
        <section className="mb-16">
          <h1 className="font-display text-3xl md:text-4xl tracking-sf-title text-t1 mb-4">
            EVERYTHING CASCADES.
          </h1>

          <div className="space-y-4 text-t2 text-sm leading-relaxed max-w-2xl mb-8">
            <p>
              In science fiction, nothing exists in isolation. A planet's gravity
              shapes how life moves. How life moves shapes how minds develop. How
              minds develop shapes what they worship. What they worship shapes how
              they organize society.
            </p>
            <p className="text-t1 font-medium">
              Physics → Environment → Biology → Psychology → Mythology → Culture
            </p>
            <p>
              Change something upstream, and everything downstream shifts with it.
              StellarForge tools are organized around this principle. Each tool
              builds on what comes before. Each output becomes input for what
              follows.
            </p>
            <p className="text-t3">
              You don't have to start at the beginning. But understanding{" "}
              <em>where</em> you're starting helps you know <em>what</em> will
              cascade from your choices.
            </p>
          </div>

          {/* Interactive cascade diagram */}
          <GlassPanel className="p-4">
            <h4 className="font-mono text-[9px] tracking-[2px] uppercase text-t3/60 mb-3">
              // THE ENVIRONMENTAL CASCADE
            </h4>
            <CascadeDiagram
              activeStage={cascadeActiveStage}
              onStageClick={handleCascadeClick}
            />
            {cascadeActiveStage && (
              <p className="text-t3 text-xs mt-3 animate-in fade-in duration-200">
                {
                  CASCADE_STAGES.find((s) => s.id === cascadeActiveStage)
                    ?.description
                }
                {" "}
                <span className="text-t4">
                  Everything to the right shifts when this changes.
                </span>
              </p>
            )}
          </GlassPanel>
        </section>

        {/* ── Divider ─────────────────────────────────────── */}
        <div className="sf-divider relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-background px-4 font-mono text-[7px] tracking-wider text-sf-amber/30 uppercase">
            Entry Points
          </span>
        </div>

        {/* ── Section 2: Entry Point Router ────────────────── */}
        <section className="mb-16 pt-6">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] gradient-text mb-2">
            Where Does Your World Begin?
          </h2>
          <p className="text-t3 text-sm mb-6">
            Most stories start with a spark: a scene, a creature, a concept.
            Where's yours?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {ENTRY_POINTS.map((entry) => {
              const Icon = entry.icon;
              const isSelected = selectedEntry === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleEntrySelect(entry.id)}
                  className={`text-left transition-all ${
                    isSelected ? "" : "sf-card-hover"
                  }`}
                >
                  <GlassPanel
                    className={`p-4 h-full transition-all ${
                      isSelected ? "border-primary/30 bg-primary/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isSelected ? "text-primary" : "text-t3"
                        }`}
                      />
                      <div>
                        <h3
                          className={`text-sm font-medium mb-1 ${
                            isSelected ? "text-t1" : "text-t2"
                          }`}
                        >
                          {entry.label}
                        </h3>
                        <p className="text-t4 text-xs leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                </button>
              );
            })}
          </div>

          {/* Selected entry response */}
          {selectedEntryData && (
            <GlassPanel className="p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-t2 text-sm leading-relaxed italic mb-4">
                "{selectedEntryData.tone}"
              </p>

              {selectedEntryData.action === "pathway" && (
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="text-t3 text-xs">
                    Scroll down for the Guided First World pathway.
                  </span>
                </div>
              )}

              {selectedEntryData.action === "tools" &&
                "suggestedTools" in selectedEntryData && (
                  <div>
                    <span className="text-t4 text-[10px] uppercase tracking-wider block mb-2">
                      Suggested starting tools
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntryData.suggestedTools.map((toolId) => (
                        <Button
                          key={toolId}
                          variant="outline"
                          size="sm"
                          className="rounded-none text-xs"
                          onClick={() => navigate(`/tools/${toolId}`)}
                        >
                          {getToolDisplayName(toolId)}
                          <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

              {selectedEntryData.action === "wiki" && (
                <Link to="/guide/tools">
                  <Button variant="outline" size="sm" className="rounded-none text-xs">
                    Browse All Tools
                    <ArrowRight className="w-3 h-3 ml-1.5" />
                  </Button>
                </Link>
              )}
            </GlassPanel>
          )}
        </section>

        {/* ── Divider ─────────────────────────────────────── */}
        <div className="sf-divider relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-background px-4 font-mono text-[7px] tracking-wider text-sf-amber/30 uppercase">
            Guided Pathway
          </span>
        </div>

        {/* ── Section 3: Guided First World ────────────────── */}
        <section className="pt-6">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] gradient-text mb-2">
            The Guided First World
          </h2>
          <p className="text-t3 text-sm mb-2">
            Build a documented planet with life and cultural implications in 4 steps.
          </p>
          <p className="text-t4 text-xs mb-8">
            Each step links to the actual tool. Complete them in order to experience the cascade firsthand.
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-1 mb-8">
            {PATHWAY_STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`h-1 flex-1 rounded-sm transition-colors ${
                  completedSteps.includes(i)
                    ? "bg-primary"
                    : i === activeStep
                    ? "bg-primary/40"
                    : "bg-white/5"
                }`}
              />
            ))}
          </div>

          {/* Steps */}
          <div className="ml-3">
            {PATHWAY_STEPS.map((step, i) => (
              <PathwayStep
                key={step.number}
                step={step}
                isActive={activeStep === i}
                isComplete={completedSteps.includes(i)}
                onActivate={() => setActiveStep(i)}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeStep === 0}
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Previous
            </Button>

            {activeStep < PATHWAY_STEPS.length - 1 ? (
              <Button size="sm" className="rounded-none" onClick={handleStepComplete}>
                Mark Complete & Continue
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="rounded-none"
                onClick={() => {
                  handleStepComplete();
                }}
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Complete Pathway
              </Button>
            )}
          </div>

          {/* Completion message */}
          {completedSteps.length === PATHWAY_STEPS.length && (
            <GlassPanel glow className="p-5 mt-8 text-center animate-in fade-in duration-500">
              <h3 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-2">
                You've Built a World
              </h3>
              <p className="text-t2 text-sm leading-relaxed max-w-lg mx-auto mb-4">
                Not just a planet, but a cascading system where physics led to environment,
                environment led to biology, biology led to psychology, and psychology
                led to culture. Everything connects. This is your foundation.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/guide/tools">
                  <Button variant="outline" size="sm" className="rounded-none text-xs">
                    Explore All Tools
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="sm" className="rounded-none text-xs">
                    Go to Dashboard
                    <ArrowRight className="w-3 h-3 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </GlassPanel>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GettingStarted;
