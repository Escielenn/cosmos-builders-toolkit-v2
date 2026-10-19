/**
 * /prompts, Weekly Prompt Browser
 *
 * Shows a weekly rotation of 7 writing prompts (one per day, Mon-Sun).
 * Users can act on prompts ("Start Writing"): they choose a world and a new
 * Studio document opens, seeded with the prompt in its synopsis and notes
 * (never in the prose). The prompt is recorded as acted-upon. Unacted
 * prompts expire at week's end. /workshop redirects here.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenTool,
  Target,
  Clock,
  Check,
  AlertTriangle,
  Calendar,
  Sparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyPrompts } from "@/hooks/use-weekly-prompts";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { StartFromPromptDialog } from "@/components/writing/StartFromPromptDialog";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type WritingPrompt,
  type PromptCategory,
} from "@/lib/writing/prompts";

// ─── Category color mapping ────────────────────────────────────────────

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  worldbuilding: "text-sf-azure-text border-sf-azure bg-sf-azure/[0.06]",
  character: "text-sf-violet-text border-sf-violet bg-sf-violet/[0.06]",
  scene: "text-sf-amber-text border-sf-amber bg-sf-amber/[0.06]",
  dialogue: "text-sf-emerald-text border-sf-emerald bg-sf-emerald/[0.06]",
  theme: "text-sf-primary-text border-sf-primary bg-sf-primary/[0.06]",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-sf-emerald-text border-sf-emerald bg-sf-emerald/[0.06]",
  intermediate: "text-sf-amber-text border-sf-amber bg-sf-amber/[0.06]",
  advanced: "text-sf-crimson-text border-sf-crimson bg-sf-crimson/[0.06]",
};

// ─── Component ─────────────────────────────────────────────────────────

// Section headings (15-PAGE-CHROME §4): the section-header pattern.
const sectionHeading =
  "font-heading text-sf-eyebrow uppercase text-t4 border-b border-sf-line-hairline pb-3";

const PromptBrowserPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pending, setPending] = useState<WritingPrompt | null>(null);

  useMetaTags({
    title: "Writing Prompts",
    description: "Weekly writing prompts for science fiction worldbuilders.",
  });

  const {
    weekPrompts,
    todayPrompt,
    actedOn,
    expiredCount,
    markActedOn,
    daysRemaining,
    weekLabel,
  } = useWeeklyPrompts();

  // ── Handle "Start Writing" ──────────────────────────────────────────

  const handleStartWriting = (prompt: WritingPrompt) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // The dialog picks the world, creates the document and opens it.
    setPending(prompt);
  };

  // ── Day labels for cards ────────────────────────────────────────────

  const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="min-h-screen bg-sf-void">
      <Header />

      <main>
        <PageContainer variant="wide">
        {/* Top-level page: no back link (the logo goes home). */}
        <PageHeader
          size="page"
          eyebrow="Weekly rotation"
          title="Writing prompts"
          lede="Seven prompts rotate each week, one for every day. Act on them before Sunday or they vanish. Each prompt is tuned for science fiction worldbuilders at different experience levels."
        >
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-t2">
              <Calendar className="w-4 h-4 text-sf-primary-text" aria-hidden />
              <span className="font-mono text-sf-mono uppercase">{weekLabel}</span>
            </div>

            <div className="flex items-center gap-2 text-t3">
              <Clock className="w-4 h-4" aria-hidden />
              <span className="font-mono text-sf-mono">
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
              </span>
            </div>

            {expiredCount > 0 && (
              <div className="flex items-center gap-2 text-sf-amber-text">
                <AlertTriangle className="w-4 h-4" aria-hidden />
                <span className="font-mono text-sf-mono">
                  {expiredCount} prompt{expiredCount !== 1 ? "s" : ""} expired last week
                </span>
              </div>
            )}
          </div>
        </PageHeader>

        {/* ── Today's prompt (highlighted) ───────────────────── */}
        <section className="mb-10">
          <h2 className={`${sectionHeading} mb-4 flex items-center gap-2`}>
            <Sparkles className="w-4 h-4 text-sf-primary-text" aria-hidden />
            Today's prompt
          </h2>

          <GlassPanel glow className="p-6 md:p-8">
            <TodayPromptContent
              prompt={todayPrompt}
              isActedOn={actedOn.has(todayPrompt.id)}
              onStartWriting={handleStartWriting}
            />
          </GlassPanel>
        </section>

        {/* ── This Week's Prompts grid ───────────────────────── */}
        <section>
          <h2 className={`${sectionHeading} mb-6`}>
            This week's prompts
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {weekPrompts.map((prompt, idx) => {
              const isToday = prompt.id === todayPrompt.id;
              const isCompleted = actedOn.has(prompt.id);

              return (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  dayLabel={DAY_LABELS[idx]}
                  isToday={isToday}
                  isCompleted={isCompleted}
                  onStartWriting={handleStartWriting}
                />
              );
            })}
          </div>
        </section>

        {/* ── Stats footer ───────────────────────────────────── */}
        <div className="mt-12 border-t border-sf-line-hairline pt-6">
          <div className="flex flex-wrap items-center gap-6 text-xs text-t4">
            <span className="font-mono">
              {actedOn.size}/{weekPrompts.length} prompts acted on this week
            </span>
            <span className="font-mono">
              {weekPrompts.length - actedOn.size} remaining
            </span>
          </div>
        </div>
        </PageContainer>
      </main>

      <Footer />

      <StartFromPromptDialog
        prompt={pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        onStarted={(p) => markActedOn(p.id)}
      />
    </div>
  );
};

export default PromptBrowserPage;

// ─── Sub-components ────────────────────────────────────────────────────

/** The large featured "today's prompt" card content. */
function TodayPromptContent({
  prompt,
  isActedOn,
  onStartWriting,
}: {
  prompt: WritingPrompt;
  isActedOn: boolean;
  onStartWriting: (p: WritingPrompt) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs px-2 py-0.5 rounded-none border ${CATEGORY_COLORS[prompt.category]}`}
          >
            {CATEGORY_LABELS[prompt.category]}
          </Badge>
          <Badge
            className={`text-xs px-2 py-0.5 rounded-none border ${DIFFICULTY_COLORS[prompt.difficulty]}`}
          >
            {DIFFICULTY_LABELS[prompt.difficulty]}
          </Badge>
        </div>
        {isActedOn && (
          <Badge className="text-xs px-2 py-0.5 rounded-none border border-sf-emerald bg-sf-emerald/[0.06] text-sf-emerald-text ml-auto">
            <Check className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      <h3 className="font-display text-sf-h3 font-light text-t1 mb-3">
        {prompt.title}
      </h3>

      <p className="text-t2 italic leading-relaxed mb-5">
        {prompt.prompt}
      </p>

      <div className="flex items-center justify-between">
        {prompt.wordGoal && (
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-t4" />
            <span className="font-mono text-xs text-t4">
              {prompt.wordGoal} words
            </span>
          </div>
        )}

        <Button
          onClick={() => onStartWriting(prompt)}
          disabled={isActedOn}
          className="ml-auto gap-2 font-sans"
        >
          {isActedOn ? (
            <>
              <Check className="w-4 h-4" />
              Started
            </>
          ) : (
            <>
              <PenTool className="w-4 h-4" />
              Start Writing
            </>
          )}
        </Button>
      </div>
    </>
  );
}

/** Individual prompt card in the weekly grid. */
function PromptCard({
  prompt,
  dayLabel,
  isToday,
  isCompleted,
  onStartWriting,
}: {
  prompt: WritingPrompt;
  dayLabel: string;
  isToday: boolean;
  isCompleted: boolean;
  onStartWriting: (p: WritingPrompt) => void;
}) {
  return (
    <GlassPanel
      hover
      className={`p-5 h-full flex flex-col relative overflow-hidden ${
        isToday ? "ring-1 ring-sf-primary" : ""
      }`}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-sf-void/40 z-10 pointer-events-none flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-sf-emerald/10 border border-sf-emerald rounded-none px-3 py-1.5">
            <Check className="w-4 h-4 text-sf-emerald-text" />
            <span className="font-mono text-xs text-sf-emerald-text uppercase tracking-wider">
              Completed
            </span>
          </div>
        </div>
      )}

      {/* Day label + today badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-t4 uppercase tracking-wide">
          {dayLabel}
        </span>
        {isToday && (
          <Badge className="text-xs px-2 py-0 rounded-none border border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text">
            Today
          </Badge>
        )}
      </div>

      {/* Category + difficulty badges */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Badge
          className={`text-xs px-2 py-0 rounded-none border ${CATEGORY_COLORS[prompt.category]}`}
        >
          {CATEGORY_LABELS[prompt.category]}
        </Badge>
        <Badge
          className={`text-xs px-2 py-0 rounded-none border ${DIFFICULTY_COLORS[prompt.difficulty]}`}
        >
          {DIFFICULTY_LABELS[prompt.difficulty]}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-heading text-xs font-light uppercase tracking-wide text-t1 mb-2">
        {prompt.title}
      </h3>

      {/* Prompt excerpt */}
      <p className="text-xs text-t3 italic leading-relaxed line-clamp-3 mb-auto">
        {prompt.prompt}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-sf-line-hairline">
        {prompt.wordGoal && (
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-t4" />
            <span className="font-mono text-xs text-t4">
              {prompt.wordGoal} words
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onStartWriting(prompt)}
          disabled={isCompleted}
          className={`ml-auto flex items-center gap-1.5 text-xs font-medium uppercase tracking-[1px] transition-colors ${
            isCompleted
              ? "text-t4 cursor-default"
              : "text-sf-primary-text hover:text-sf-primary-text cursor-pointer"
          }`}
        >
          {isCompleted ? (
            <>
              <Check className="w-3 h-3" /> Done
            </>
          ) : (
            <>
              <PenTool className="w-3 h-3" /> Write
            </>
          )}
        </button>
      </div>
    </GlassPanel>
  );
}
