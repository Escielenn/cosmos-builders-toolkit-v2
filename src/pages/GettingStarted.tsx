import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Bug,
  Compass,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Check,
  PenLine,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ProBadge } from "@/components/ui/pro-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import CreateWorldButton from "@/components/dashboard/CreateWorldButton";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";
import { GuideNav } from "@/components/layout/GuideNav";
import { Notice, PageContainer, PageHeader } from "@/components/layout/page-chrome";

// Section headings (15-PAGE-CHROME §4): named blocks, display h3.
const sectionHeading = "font-display text-sf-h3 font-light text-t1 mb-2";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useEntities } from "@/hooks/use-entity-graph";
import { useRecentWork } from "@/hooks/use-recent-work";
import { docHref, latestDocByWorld } from "@/lib/recent-work";
import {
  FIRST_INSTRUMENT_IDS,
  PRO_NEXT_STEPS,
  firstHourProgress,
  instrumentLinks,
} from "@/lib/onboarding/first-hour";

// ── Cascade Stage Data ─────────────────────────────────────

const CASCADE_STAGES = [
  {
    id: "physics",
    label: "Physics",
    sublabels: ["Gravity", "Radiation", "Orbit"],
    color: "var(--sf-amber-text)",
    description: "The fundamental laws that govern your universe.",
  },
  {
    id: "environment",
    label: "Environment",
    sublabels: ["Climate", "Terrain", "Resources"],
    color: "var(--sf-azure-text)",
    description: "Planetary conditions shaped by physics.",
  },
  {
    id: "biology",
    label: "Biology",
    sublabels: ["Anatomy", "Senses", "Lifecycle"],
    color: "var(--sf-emerald-text)",
    description: "Life shaped by environmental pressures.",
  },
  {
    id: "psychology",
    label: "Psychology",
    sublabels: ["Cognition", "Emotion", "Communication"],
    color: "var(--sf-magenta-text)",
    description: "Minds shaped by bodies and environments.",
  },
  {
    id: "mythology",
    label: "Mythology",
    sublabels: ["Meaning", "Ritual", "Taboo"],
    color: "var(--sf-stellar-text)",
    description: "The stories civilizations tell to explain their world.",
  },
  {
    id: "culture",
    label: "Culture",
    sublabels: ["Society", "Economy", "Technology"],
    color: "var(--sf-violet-text)",
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
    tone: "Build from the ground up. Begin a survey: a star, a planet, a first species. Open an instrument on the planet, then write the first scene against what it decided.",
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

// ── Interactive Cascade Diagram ────────────────────────────

function CascadeDiagram({
  activeStage,
  onStageClick,
}: {
  activeStage: string | null;
  onStageClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
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
              className={`w-full md:flex-1 min-h-hit text-left px-3 py-3 border transition-colors duration-slow ease-sf-out ${
                isActive
                  ? "border-sf-line-emphasis bg-sf-surface-elevated"
                  : isDownstream
                  ? "border-sf-line bg-sf-surface-elevated"
                  : "border-sf-line bg-transparent hover:border-sf-line-emphasis"
              }`}
            >
              <div
                className="text-xs font-heading uppercase tracking-wide mb-1 transition-colors duration-slow"
                style={{
                  color: isActive || isDownstream ? stage.color : "var(--t4)",
                }}
              >
                {stage.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {stage.sublabels.map((sub) => (
                  <span
                    key={sub}
                    className={`text-xs transition-colors duration-slow ${
                      isActive || isDownstream ? "text-t3" : "text-t4"
                    }`}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </button>
            {i < CASCADE_STAGES.length - 1 && (
              <ChevronRight
                className={`w-3 h-3 shrink-0 hidden md:block transition-colors duration-slow ${
                  isDownstream || isActive ? "text-t3" : "text-t4"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Pathway step shell ─────────────────────────────────────

function StepShell({
  number,
  title,
  done,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className={`border-l-2 pl-5 pb-8 ${done ? "border-sf-primary" : "border-sf-line"}`}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`w-8 h-8 rounded-none flex items-center justify-center font-mono text-xs ${
            done
              ? "bg-sf-primary/[0.06] border border-sf-primary text-sf-primary-text"
              : "bg-sf-surface-elevated border border-sf-line text-t3"
          }`}
          aria-hidden="true"
        >
          {done ? <Check className="w-3.5 h-3.5" /> : number}
        </span>
        <h3 className="font-sans text-sf-body font-medium text-t1">
          {title}
          {done && <span className="sr-only"> (done)</span>}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </li>
  );
}

// ── Main Page ──────────────────────────────────────────────

const GettingStarted = () => {
  useMetaTags({ title: "Getting Started" });
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const [cascadeActiveStage, setCascadeActiveStage] = useState<string | null>(
    null,
  );
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [chosenWorldId, setChosenWorldId] = useState<string | null>(null);

  // The world the pathway works in: the writer's pick, else the most
  // recently updated (useWorlds orders by updated_at desc).
  const world = worlds.find((w) => w.id === chosenWorldId) ?? worlds[0] ?? null;
  const worldId = world?.id ?? null;
  const worldIds = useMemo(() => (worldId ? [worldId] : []), [worldId]);
  const { data: entities = [] } = useEntities(worldId ?? undefined);
  const { data: recent } = useRecentWork(worldIds, { enabled: !!worldId });

  const progress = firstHourProgress({ worldId, worksheets: recent.worksheets });
  const instruments = instrumentLinks(FIRST_INSTRUMENT_IDS, worldId, entities);
  const latestDoc = worldId ? latestDocByWorld(recent.docs).get(worldId) ?? null : null;

  const handleCascadeClick = (id: string) => {
    setCascadeActiveStage((prev) => (prev === id ? null : id));
  };

  const selectedEntryData = ENTRY_POINTS.find((e) => e.id === selectedEntry);

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main>
        <PageContainer variant="standalone">
        <PageHeader
          size="page"
          back={{ label: "Back to Guide", to: "/guide" }}
          eyebrow="Guide · Getting started"
          title="Getting started"
          lede="Learn the Environmental Cascade, then build your first world in three free steps."
        >
          <GuideNav />
        </PageHeader>

        {/* ── Section 1: Cascade Tutorial ─────────────────── */}
        <section className="mb-16" aria-labelledby="everything-cascades">
          <h2 id="everything-cascades" className={sectionHeading}>
            Everything cascades
          </h2>

          <div className="sf-measure space-y-4 text-t2 text-sf-body leading-relaxed mb-8">
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
            <p className="text-t2">
              You don't have to start at the beginning. But understanding{" "}
              <em>where</em> you're starting helps you know <em>what</em> will
              cascade from your choices.
            </p>
          </div>

          {/* Interactive cascade diagram */}
          <GlassPanel className="p-4">
            <h4 className="font-heading text-sf-eyebrow uppercase text-t4 mb-3">
              // THE ENVIRONMENTAL CASCADE
            </h4>
            <CascadeDiagram
              activeStage={cascadeActiveStage}
              onStageClick={handleCascadeClick}
            />
            {cascadeActiveStage && (
              <p className="text-t3 text-xs mt-3 animate-in fade-in duration-base">
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
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-sf-void px-4 font-mono text-xs tracking-wider text-t4 uppercase">
            Guided Pathway
          </span>
        </div>

        {/* ── Section 2: The first hour ────────────────────── */}
        <section className="mb-16 pt-6" aria-labelledby="first-hour">
          <h2 id="first-hour" className={sectionHeading}>
            Your first hour
          </h2>
          <p className="sf-measure text-t2 text-sm mb-8">
            Three steps, all free: file a world, open an instrument on something in it, and
            write the first scene. Progress below is read from your own records.
          </p>

          {/* World picker, only when there is a choice to make. */}
          {worlds.length > 1 && (
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <Label htmlFor="gs-world">Working in</Label>
              <select
                id="gs-world"
                value={worldId ?? ""}
                onChange={(e) => setChosenWorldId(e.target.value)}
                className="sf-field min-h-hit px-3 text-sf-body text-t1 bg-sf-surface border border-sf-line-interactive rounded-none"
              >
                {worlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <ol className="ml-3">
            <StepShell number={1} title="Create a world" done={progress.world}>
              <p className="sf-measure text-t2 text-sm leading-relaxed">
                BEGIN SURVEY names the world, picks a star, a planet and a first species,
                files all three in the Codex with their derived values, and opens an empty
                Chapter One on the planet.
              </p>
              {world ? (
                <p className="font-mono text-sf-mono uppercase text-t3">
                  WORLD ON FILE: <span className="text-t1">{world.name}</span>
                </p>
              ) : null}
              <CreateWorldButton variant="button" />
            </StepShell>

            <StepShell number={2} title="Open an instrument on it" done={progress.instrument}>
              <p className="sf-measure text-t2 text-sm leading-relaxed">
                Instruments open on a subject from your Codex, so what they produce lands on
                the thing it describes. These three are free.
              </p>
              {worldId ? (
                <ul className="flex flex-col gap-2">
                  {instruments.map((link) => (
                    <li key={link.toolId}>
                      {link.href ? (
                        <Link
                          to={link.href}
                          className="flex min-h-hit items-center justify-between gap-3 px-4 py-2 border border-sf-line hover:border-sf-line-emphasis bg-sf-surface rounded-none transition-colors duration-base"
                        >
                          <span className="text-sf-body text-t1">{getToolDisplayName(link.toolId)}</span>
                          <span className="font-mono text-sf-mono uppercase text-t4 truncate">
                            {link.subject ? `ON ${link.subject.name}` : "NO SUBJECT"}
                          </span>
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <Notice compact label="World required">
                  {user ? "File a world first." : "Sign in and file a world first."}
                </Notice>
              )}
            </StepShell>

            <StepShell number={3} title="Write the first scene" done={false}>
              <p className="sf-measure text-t2 text-sm leading-relaxed">
                The Studio is where the world goes. The rail beside the page shows what
                your instruments decided, so the scene can lean on it.
              </p>
              {worldId ? (
                <Button variant="sf-primary" size="sf-md" className="gap-2" asChild>
                  <Link to={latestDoc ? docHref(latestDoc) : `/worlds/${worldId}/write`}>
                    <PenLine className="w-4 h-4" aria-hidden="true" />
                    {latestDoc
                      ? `Continue ${latestDoc.title?.trim() || "writing"}`
                      : "Open the Studio"}
                  </Link>
                </Button>
              ) : (
                <Notice compact label="World required">File a world first.</Notice>
              )}
            </StepShell>
          </ol>

          {/* ── Optional next: Pro instruments ──────────── */}
          <GlassPanel className="p-5 mt-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-heading text-sf-eyebrow uppercase text-t3">Next, with Pro</h3>
              <ProBadge />
            </div>
            <p className="sf-measure text-t2 text-sm mb-4">
              Optional. Walk the cascade from star to myth. Each opens on its subject in{" "}
              {world ? world.name : "your world"}.
            </p>
            <ol className="space-y-4">
              {PRO_NEXT_STEPS.map((step, i) => (
                <li key={step.title}>
                  <p className="text-sf-body text-t1">
                    <span className="font-mono text-t4 mr-2">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-xs text-t3 mb-2">{step.output}</p>
                  <div className="flex flex-wrap gap-2">
                    {instrumentLinks(step.toolIds, worldId, entities).map((link) => {
                      const href = link.href ?? getToolRoute(link.toolId) ?? "/tools";
                      return (
                        <Link
                          key={link.toolId}
                          to={href}
                          className="inline-flex min-h-hit items-center gap-2 px-3 text-xs border border-sf-line hover:border-sf-line-emphasis text-t2 hover:text-t1 rounded-none transition-colors duration-base"
                        >
                          {getToolDisplayName(link.toolId)}
                          {link.isPro && <ProBadge />}
                        </Link>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
          </GlassPanel>
        </section>

        {/* ── Divider ─────────────────────────────────────── */}
        <div className="sf-divider relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-sf-void px-4 font-mono text-xs tracking-wider text-t4 uppercase">
            Entry Points
          </span>
        </div>

        {/* ── Section 3: Entry Point Router ────────────────── */}
        <section className="pt-6">
          <h2 className={sectionHeading}>
            Where does your world begin?
          </h2>
          <p className="text-t2 text-sm mb-6">
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
                  aria-pressed={isSelected}
                  onClick={() => setSelectedEntry(entry.id)}
                  className={`text-left transition-all ${isSelected ? "" : "sf-card-hover"}`}
                >
                  <GlassPanel
                    className={`p-4 h-full transition-all ${
                      isSelected ? "border-sf-primary bg-sf-primary/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isSelected ? "text-sf-primary-text" : "text-t3"
                        }`}
                      />
                      <div>
                        <h3 className={`text-sm font-medium mb-1 ${isSelected ? "text-t1" : "text-t2"}`}>
                          {entry.label}
                        </h3>
                        <p className="text-t2 text-sm leading-relaxed">{entry.description}</p>
                      </div>
                    </div>
                  </GlassPanel>
                </button>
              );
            })}
          </div>

          {selectedEntryData && (
            <GlassPanel className="p-5 animate-in fade-in slide-in-from-bottom-2 duration-slow">
              <p className="text-t2 text-sm leading-relaxed italic mb-4">
                "{selectedEntryData.tone}"
              </p>

              {selectedEntryData.action === "pathway" && (
                <a
                  href="#first-hour"
                  className="inline-flex min-h-hit items-center gap-2 text-xs text-sf-primary-text"
                >
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  Start with your first hour, above.
                </a>
              )}

              {selectedEntryData.action === "tools" &&
                "suggestedTools" in selectedEntryData && (
                  <div>
                    <span className="text-t4 text-xs uppercase tracking-wider block mb-2">
                      Suggested starting tools
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {instrumentLinks(selectedEntryData.suggestedTools, worldId, entities).map((link) => (
                        <Link
                          key={link.toolId}
                          to={link.href ?? getToolRoute(link.toolId) ?? "/tools"}
                          className="inline-flex min-h-hit items-center gap-2 px-3 text-xs border border-sf-line hover:border-sf-line-emphasis text-t2 hover:text-t1 rounded-none transition-colors duration-base"
                        >
                          {getToolDisplayName(link.toolId)}
                          {link.isPro && <ProBadge />}
                          <ExternalLink className="w-3 h-3 text-t4" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              {selectedEntryData.action === "wiki" && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="sf-ghost" size="sf-sm" asChild>
                    <Link to="/tools">
                      All tools
                      <ArrowRight className="w-3 h-3 ml-1.5" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button variant="sf-ghost" size="sf-sm" asChild>
                    <Link to="/guide/tools">Tool reference</Link>
                  </Button>
                </div>
              )}
            </GlassPanel>
          )}
        </section>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default GettingStarted;
