// ---------------------------------------------------------------------------
// BeginSurveyDialog: the "Create a world" dialog (13-THE-LIFT §2, 1.5 item
// 14; relabelled in 1.7 because "Begin survey" did not say it made a world).
//
// Name → Star → Planet → Life. Each of the last three has presets, "Surprise
// me", and "Skip this step". "Create world" on the last step creates the
// world, files the star, planet and species in the Codex with their derived
// values, connects them, adds an empty "Chapter One" set on the planet, and
// opens the world's Bridge. The dialog never writes prose: the only sentence
// it stores is the species line, and that is the writer's own.
//
// The first step also offers "Skip setup and create": a blank world, now.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Shuffle, SkipForward } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/layout/page-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import IconPicker from "@/components/world/IconPicker";
import { cn } from "@/lib/utils";
import { useBeginSurvey } from "@/hooks/use-begin-survey";
import {
  BODY_PLAN_PRESETS,
  PLANET_TYPE_PRESETS,
  STAR_CLASS_PRESETS,
  deriveStar,
  derivePlanet,
  sig,
  surpriseBodyPlan,
  surprisePlanet,
  surpriseSpeciesName,
  surpriseStar,
  type SurveyChoices,
} from "@/lib/onboarding/survey-seed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const STEPS = ["name", "star", "planet", "life"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  name: "Name",
  star: "Star",
  planet: "Planet",
  life: "Life",
};

/** The primary button on each step says where it goes next. */
const NEXT_LABEL: Record<Step, string> = {
  name: "Next: choose a star",
  star: "Next: shape the planet",
  planet: "Next: add life",
  life: "Create world",
};

const STEP_LEDE: Record<Step, string> = {
  name: "Name your world. The next three steps set up its star, its planet, and its first form of life. You can skip any of them and fill them in later.",
  star: "Pick the star your world orbits. Its brightness sets where liquid water can last.",
  planet: "Pick the kind of planet. Gravity, orbit, and surface temperature are worked out from your star.",
  life: "Add one species. The line you write is saved exactly as you wrote it.",
};

export interface EmptyWorldInput {
  name: string;
  icon: string;
  description: string;
}

interface BeginSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Creates a blank world from the first step. Omit to hide "Skip setup and create". */
  onInitializeEmpty?: (input: EmptyWorldInput) => Promise<void> | void;
  initializingEmpty?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BeginSurveyDialog({
  open,
  onOpenChange,
  onInitializeEmpty,
  initializingEmpty = false,
}: BeginSurveyDialogProps) {
  const navigate = useNavigate();
  const survey = useBeginSurvey();

  const [step, setStep] = useState<Step>("name");
  const [worldName, setWorldName] = useState("");
  const [worldIcon, setWorldIcon] = useState("globe");
  const [worldDescription, setWorldDescription] = useState("");
  const [starId, setStarId] = useState<string | null>("G2");
  const [starName, setStarName] = useState("");
  const [planetId, setPlanetId] = useState<string | null>("earth-like");
  const [planetName, setPlanetName] = useState("");
  const [speciesName, setSpeciesName] = useState("");
  const [bodyPlanId, setBodyPlanId] = useState<string | null>(null);
  const [speciesLine, setSpeciesLine] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const { toast } = useToast();
  const resetSurvey = useRef(survey.reset);
  resetSurvey.current = survey.reset;

  // Fresh survey every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    resetSurvey.current();
    setStep("name");
    setWorldName("");
    setWorldIcon("globe");
    setWorldDescription("");
    setStarId("G2");
    setStarName("");
    setPlanetId("earth-like");
    setPlanetName("");
    setSpeciesName("");
    setBodyPlanId(null);
    setSpeciesLine("");
  }, [open]);

  // Move focus to the step heading so screen readers announce the step.
  useEffect(() => {
    if (open && step !== "name") headingRef.current?.focus();
  }, [step, open]);

  const star = useMemo(() => (starId ? deriveStar(starId) : null), [starId]);
  const planet = useMemo(() => (planetId ? derivePlanet(planetId, star) : null), [planetId, star]);

  const index = STEPS.indexOf(step);
  const busy = survey.isPending || initializingEmpty;
  // Setup failed after the world was created. The run is kept: Retry
  // resumes it from the failed step, never a second world.
  const partialWorldId = survey.partialWorldId;
  const stalled = !!partialWorldId && !survey.isPending;

  const openWorld = useCallback(
    (worldId: string) => {
      resetSurvey.current();
      onOpenChange(false);
      navigate(`/worlds/${worldId}`);
    },
    [onOpenChange, navigate],
  );

  const handleOpenChange = (o: boolean) => {
    if (busy) return;
    if (!o && partialWorldId) {
      // Cancelled after a partial failure: the world stays, and says so.
      const worldId = partialWorldId;
      toast({
        title: "WORLD CREATED. SETUP INCOMPLETE.",
        description: "The world is saved. Some of its star, planet, or life details are not.",
        action: (
          <ToastAction altText="Open world" onClick={() => navigate(`/worlds/${worldId}`)}>
            Open world
          </ToastAction>
        ),
      });
      resetSurvey.current();
    }
    onOpenChange(o);
  };
  const nameOk = worldName.trim().length > 0;

  const go = (delta: number) => {
    const next = STEPS[Math.max(0, Math.min(STEPS.length - 1, index + delta))];
    setStep(next);
  };

  const fileSurvey = useCallback(
    (overrides?: { skipLife?: boolean }) => {
      const choices: SurveyChoices = {
        worldName,
        star: starId ? { classId: starId, name: starName } : null,
        planet: planetId ? { presetId: planetId, name: planetName } : null,
        species:
          overrides?.skipLife || (!speciesName.trim() && !bodyPlanId)
            ? null
            : { name: speciesName, bodyPlanId: bodyPlanId ?? "", line: speciesLine },
      };
      survey.mutate(
        { choices, icon: worldIcon, description: worldDescription },
        {
          onSuccess: ({ worldId }) => {
            onOpenChange(false);
            // The new world's Bridge: Chapter One is one click away there.
            navigate(`/worlds/${worldId}`);
          },
        },
      );
    },
    [worldName, starId, starName, planetId, planetName, speciesName, bodyPlanId, speciesLine, worldIcon, worldDescription, survey, onOpenChange, navigate],
  );

  const skip = () => {
    if (step === "star") setStarId(null);
    if (step === "planet") setPlanetId(null);
    if (step === "life") {
      fileSurvey({ skipLife: true });
      return;
    }
    go(1);
  };

  const surprise = () => {
    const rng = Math.random;
    if (step === "star") setStarId(surpriseStar(rng));
    if (step === "planet") setPlanetId(surprisePlanet(rng, starId));
    if (step === "life") {
      setSpeciesName(surpriseSpeciesName(rng));
      setBodyPlanId(surpriseBodyPlan(rng));
    }
  };

  const canAdvance =
    step === "name" ? nameOk :
    step === "star" ? !!starId :
    step === "planet" ? !!planetId :
    true;

  const primary = () => {
    if (!canAdvance || busy) return;
    if (step === "life") fileSurvey();
    else go(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-sf-surface-elevated gap-5 p-4 sm:p-6">
        <DialogHeader className="text-left space-y-2 pr-10">
          <p className="font-sans text-sm text-t3">
            Step {index + 1} of {STEPS.length}: {STEP_LABELS[step]}
          </p>
          <DialogTitle asChild>
            <h2 ref={headingRef} tabIndex={-1} className="outline-none">
              Create a world
            </h2>
          </DialogTitle>
          <DialogDescription className="text-t2">{STEP_LEDE[step]}</DialogDescription>
          <StepTrack index={index} />
        </DialogHeader>

        {/* ── Setup incomplete ───────────────────────────────────── */}
        {stalled && partialWorldId && (
          <div className="space-y-4">
            {/* Notice tone="danger" carries role="alert". */}
            <Notice
              tone="danger"
              icon={<AlertTriangle className="w-4 h-4" />}
              label="WORLD CREATED. SETUP INCOMPLETE."
            >
              The world is saved, but some of its star, planet, or life details are not. Retry finishes them without making a second world.
            </Notice>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="sf-ghost" size="sf-md" className="sm:mr-auto" onClick={() => openWorld(partialWorldId)}>
                Open world
              </Button>
              <Button type="button" variant="sf-primary" size="sf-md" onClick={() => fileSurvey()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* ── Name ───────────────────────────────────────────────── */}
        {!stalled && step === "name" && (
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); primary(); }}
          >
            <div className="space-y-2">
              <div className="flex gap-4">
                <Label className="w-12 shrink-0 text-center">Icon</Label>
                <Label htmlFor="survey-world-name">World name</Label>
              </div>
              <div className="flex items-end gap-4">
                <IconPicker value={worldIcon} onChange={setWorldIcon} disabled={busy} />
                <Input
                  id="survey-world-name"
                  autoFocus
                  placeholder="e.g., Kepler-442b Colony"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-world-description">Description (optional)</Label>
              <Textarea
                id="survey-world-description"
                placeholder="A sentence or two about this world."
                value={worldDescription}
                onChange={(e) => setWorldDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              {onInitializeEmpty && (
                <Button
                  type="button"
                  variant="sf-ghost"
                  size="sf-md"
                  className="sm:mr-auto"
                  disabled={!nameOk || busy}
                  onClick={() =>
                    onInitializeEmpty({ name: worldName.trim(), icon: worldIcon, description: worldDescription.trim() })
                  }
                >
                  {initializingEmpty ? <Loader variant="inline" size="sm" /> : null}
                  Skip setup and create
                </Button>
              )}
              <Button type="submit" variant="sf-primary" size="sf-md" disabled={!nameOk || busy}>
                {NEXT_LABEL.name}
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
            <p className="text-sm text-t3">
              {nameOk
                ? onInitializeEmpty
                  ? "Nothing is saved until you create the world. Skip setup to create it blank now."
                  : "Nothing is saved until you create the world on the last step."
                : "Give the world a name to continue."}
            </p>
          </form>
        )}

        {/* ── STAR ────────────────────────────────────────────────── */}
        {!stalled && step === "star" && (
          <div className="space-y-4">
            <ChoiceGroup
              label="Spectral class"
              value={starId}
              onChange={setStarId}
              options={STAR_CLASS_PRESETS.map((s) => ({
                id: s.id,
                title: `${s.id}V`,
                tag: s.tag,
              }))}
            />
            <div className="space-y-2">
              <Label htmlFor="survey-star-name">Star name (optional)</Label>
              <Input
                id="survey-star-name"
                placeholder={`${worldName.trim() || "World"} Primary`}
                value={starName}
                onChange={(e) => setStarName(e.target.value)}
              />
            </div>
            <Readout title="Star readout">
              {star ? (
                <>
                  <ReadoutRow label="Class" value={star.designation} />
                  <ReadoutRow label="Luminosity" value={`${sig(star.preset.luminosity)}`} unit="L☉" />
                  <ReadoutRow label="Temperature" value={`${star.preset.temperature}`} unit="K" />
                  <ReadoutRow label="Mass" value={`${sig(star.preset.mass)}`} unit="M☉" />
                  <ReadoutRow
                    label="Habitable zone"
                    value={`${sig(star.hz.runawayGreenhouse)} – ${sig(star.hz.maxGreenhouse)}`}
                    unit="AU"
                  />
                </>
              ) : (
                <p className="text-sm text-t2">No star chosen.</p>
              )}
            </Readout>
          </div>
        )}

        {/* ── Planet ─────────────────────────────────────────────── */}
        {!stalled && step === "planet" && (
          <div className="space-y-4">
            <ChoiceGroup
              label="Planet type"
              value={planetId}
              onChange={setPlanetId}
              options={PLANET_TYPE_PRESETS.map((p) => ({ id: p.id, title: p.label, tag: p.tag }))}
            />
            <div className="space-y-2">
              <Label htmlFor="survey-planet-name">Planet name (optional)</Label>
              <Input
                id="survey-planet-name"
                placeholder={worldName.trim() || "Planet"}
                value={planetName}
                onChange={(e) => setPlanetName(e.target.value)}
              />
            </div>
            <Readout title="Planet readout">
              {planet ? (
                <>
                  <ReadoutRow label="Mass" value={`${sig(planet.mass)}`} unit="M⊕" />
                  <ReadoutRow label="Radius" value={`${sig(planet.radius)}`} unit="R⊕" />
                  <ReadoutRow label="Surface gravity" value={`${sig(planet.gravity)}`} unit={`g · ${planet.gravityRegime.toUpperCase()}`} />
                  {planet.orbit ? (
                    <>
                      <ReadoutRow label="Orbit" value={`${sig(planet.orbit.distanceAU)}`} unit="AU" />
                      <ReadoutRow label="Year" value={`${sig(planet.orbit.periodDays)}`} unit="days" />
                      <ReadoutRow label="Est. surface" value={`${Math.round(planet.orbit.surfaceK)}`} unit="K" />
                      <ReadoutRow
                        label="Habitable zone"
                        value={planet.orbit.inHabitableZone ? "INSIDE" : "OUTSIDE"}
                        unit={planet.orbit.zoneLabel.toUpperCase()}
                        icon={planet.orbit.inHabitableZone
                          ? <Check className="w-4 h-4 text-sf-emerald" aria-hidden="true" />
                          : <AlertTriangle className="w-4 h-4 text-sf-amber" aria-hidden="true" />}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-t2 pt-1">No star chosen, so the orbit is left unset.</p>
                  )}
                  {planet.starMismatch && (
                    <p className="flex items-start gap-2 text-sm text-sf-amber-text pt-1">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-sf-amber" aria-hidden="true" />
                      {"// This preset assumes a red dwarf (M-class) star. Around this star the planet is unlikely to be tidally locked."}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-t2">No planet chosen.</p>
              )}
            </Readout>
          </div>
        )}

        {/* ── LIFE ────────────────────────────────────────────────── */}
        {!stalled && step === "life" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="survey-species-name">Species name</Label>
              <Input
                id="survey-species-name"
                placeholder="e.g., Vethari"
                value={speciesName}
                onChange={(e) => setSpeciesName(e.target.value)}
              />
            </div>
            <ChoiceGroup
              label="Body plan"
              value={bodyPlanId}
              onChange={setBodyPlanId}
              options={BODY_PLAN_PRESETS.map((b) => ({ id: b.id, title: b.label, tag: b.description }))}
            />
            <div className="space-y-2">
              <Label htmlFor="survey-species-line">One line about them (optional)</Label>
              <Input
                id="survey-species-line"
                placeholder="What a reader should know first."
                maxLength={200}
                value={speciesLine}
                onChange={(e) => setSpeciesLine(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Transport ───────────────────────────────────────────── */}
        {!stalled && step !== "name" && (
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 border-t border-sf-line-hairline pt-4">
            <Button type="button" variant="sf-ghost" size="sf-md" onClick={() => go(-1)} disabled={busy}>
              <ChevronLeft aria-hidden="true" />
              Back
            </Button>
            <Button type="button" variant="sf-ghost" size="sf-md" onClick={surprise} disabled={busy}>
              <Shuffle aria-hidden="true" />
              Surprise me
            </Button>
            <Button type="button" variant="sf-ghost" size="sf-md" className="sm:ml-auto" onClick={skip} disabled={busy}>
              <SkipForward aria-hidden="true" />
              {step === "life" ? "Skip and create" : "Skip this step"}
            </Button>
            <Button type="button" variant="sf-primary" size="sf-md" onClick={primary} disabled={!canAdvance || busy}>
              {survey.isPending ? <Loader variant="inline" size="sm" /> : null}
              {step === "life" && survey.isPending ? "Creating world" : NEXT_LABEL[step]}
              {step !== "life" && <ChevronRight aria-hidden="true" />}
            </Button>
          </div>
        )}
        {!stalled && step === "life" && (
          <p className="text-sm text-t3">
            Creating the world saves it with everything you chose and opens its Bridge.
          </p>
        )}
        {survey.isPending && (
          <p role="status" className="sr-only">Creating world.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function StepTrack({ index }: { index: number }) {
  return (
    <ol className="flex gap-1 pt-1" aria-label="Steps">
      {STEPS.map((s, i) => (
        <li key={s} className="flex-1 min-w-0">
          <span
            className={cn(
              "block h-[2px]",
              i < index ? "bg-sf-primary" : i === index ? "bg-sf-primary-text" : "bg-sf-line",
            )}
            aria-hidden="true"
          />
          <span className={cn("block pt-1 font-sans text-[13px] truncate", i === index ? "text-t1" : "text-t3")}>
            <span className="sr-only">{i < index ? "Done: " : i === index ? "Current: " : ""}</span>
            {STEP_LABELS[s]}
          </span>
        </li>
      ))}
    </ol>
  );
}

interface ChoiceOption {
  id: string;
  title: string;
  tag: string;
}

/**
 * A radio group of preset chips with a roving tab stop: Tab enters on the
 * selected chip, arrows move and select, Space/Enter select.
 */
function ChoiceGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (id: string) => void;
  options: ChoiceOption[];
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelId = useId();
  const selectedIndex = options.findIndex((o) => o.id === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (!forward && !back) return;
    e.preventDefault();
    const next = (i + (forward ? 1 : -1) + options.length) % options.length;
    onChange(options[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="space-y-2">
      <p id={labelId} className="text-[12px] font-medium uppercase tracking-[1.5px] leading-none text-t3">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {options.map((o, i) => {
          const selected = o.id === value;
          return (
            <button
              key={o.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={i === tabStop ? 0 : -1}
              onClick={() => onChange(o.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "min-h-hit text-left px-3 py-2 rounded-none border transition-sf duration-fast ease-sf-out",
                selected
                  ? "bg-sf-primary/[0.06] border-sf-primary"
                  : "sf-quiet bg-transparent",
              )}
            >
              <span className={cn("block font-sans text-sm font-medium", selected ? "text-sf-primary-text" : "text-t1")}>
                {o.title}
              </span>
              <span className="block text-[12px] text-t3 leading-snug pt-0.5">{o.tag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Readout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="border border-sf-line bg-sf-surface px-4 py-3 space-y-1.5">
      <p className="font-heading text-sf-eyebrow uppercase text-t4 pb-1 border-b border-sf-line-hairline">
        {title}
      </p>
      <div aria-live="polite" className="space-y-1.5">
        {children}
      </div>
    </section>
  );
}

function ReadoutRow({ label, value, unit, icon }: { label: string; value: string; unit?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-sf-mono uppercase text-t3 shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 text-right min-w-0">
        {icon}
        <span className="font-mono text-t1">{value}</span>
        {unit && <span className="font-mono text-[12px] text-t4 truncate">{unit}</span>}
      </span>
    </div>
  );
}
