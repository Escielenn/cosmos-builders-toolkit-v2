/**
 * /prompts, Weekly Prompt Browser
 *
 * Shows a weekly rotation of 7 writing prompts (one per day, Mon-Sun).
 * Users can act on prompts ("Start Writing") which creates a writing entry
 * and records the prompt as acted-upon. Unacted prompts expire at week's end.
 */

import { useNavigate } from "react-router-dom";
import {
  PenTool,
  Target,
  Clock,
  Check,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Sparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useCreateEntry } from "@/hooks/use-writing-entries";
import { useWeeklyPrompts } from "@/hooks/use-weekly-prompts";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type WritingPrompt,
  type PromptCategory,
} from "@/lib/writing/prompts";

// ─── Category color mapping ────────────────────────────────────────────

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  worldbuilding: "text-blue-400 border-blue-400/20 bg-blue-400/[0.06]",
  character: "text-sf-violet border-violet-400/20 bg-violet-400/[0.06]",
  scene: "text-sf-amber border-amber-400/20 bg-amber-400/[0.06]",
  dialogue: "text-sf-emerald border-emerald-400/20 bg-emerald-400/[0.06]",
  theme: "text-sf-teal border-cyan-400/20 bg-cyan-400/[0.06]",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-sf-emerald border-emerald-400/15 bg-emerald-400/[0.06]",
  intermediate: "text-sf-amber border-amber-400/15 bg-amber-400/[0.06]",
  advanced: "text-rose-400 border-rose-400/15 bg-rose-400/[0.06]",
};

// ─── Component ─────────────────────────────────────────────────────────

const PromptBrowserPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const createEntry = useCreateEntry();
  const { toast } = useToast();

  useMetaTags({
    title: "Prompt Browser",
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

  const handleStartWriting = async (prompt: WritingPrompt) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Mark acted-on in localStorage
    markActedOn(prompt.id);

    // Create a writing entry
    try {
      const entry = await createEntry.mutateAsync({
        promptId: prompt.id,
        title: prompt.title,
        worldId: worlds.length > 0 ? worlds[0].id : undefined,
      });

      // Navigate to writing space
      if (entry.world_id) {
        navigate(`/worlds/${entry.world_id}/write`);
      } else {
        navigate("/workshop");
      }
    } catch {
      toast({
        title: "Could not create entry",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ── Day labels for cards ────────────────────────────────────────────

  const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="min-h-screen bg-sf-void">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* ── Back link ──────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-t4 hover:text-t2 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {/* ── Page header ────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.08em] text-t1 mb-3">
            PROMPT BROWSER
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-t2">
              <Calendar className="w-4 h-4 text-primary/60" />
              <span className="font-heading text-sm font-light uppercase tracking-[1.5px]">
                {weekLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 text-t3">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
              </span>
            </div>

            {expiredCount > 0 && (
              <div className="flex items-center gap-2 text-sf-amber/70">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-mono text-xs">
                  {expiredCount} prompt{expiredCount !== 1 ? "s" : ""} expired last week
                </span>
              </div>
            )}
          </div>

          <p className="text-t3 text-sm mt-3 max-w-2xl leading-relaxed">
            Seven prompts rotate each week, one for every day. Act on them before
            Sunday or they vanish. Each prompt is tuned for science fiction
            worldbuilders at different experience levels.
          </p>
        </div>

        {/* ── Today's prompt (highlighted) ───────────────────── */}
        <section className="mb-10">
          <p className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3 mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            Today's Prompt
          </p>

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
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-t1 mb-6">
            This Week's Prompts
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
        <div className="mt-12 border-t border-white/[0.06] pt-6">
          <div className="flex flex-wrap items-center gap-6 text-xs text-t4">
            <span className="font-mono">
              {actedOn.size}/{weekPrompts.length} prompts acted on this week
            </span>
            <span className="font-mono">
              {weekPrompts.length - actedOn.size} remaining
            </span>
          </div>
        </div>
      </main>

      <Footer />
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
            className={`text-[12px] px-2 py-0.5 rounded-sm border ${CATEGORY_COLORS[prompt.category]}`}
          >
            {CATEGORY_LABELS[prompt.category]}
          </Badge>
          <Badge
            className={`text-[12px] px-2 py-0.5 rounded-sm border ${DIFFICULTY_COLORS[prompt.difficulty]}`}
          >
            {DIFFICULTY_LABELS[prompt.difficulty]}
          </Badge>
        </div>
        {isActedOn && (
          <Badge className="text-[12px] px-2 py-0.5 rounded-sm border border-emerald-400/20 bg-emerald-400/[0.06] text-sf-emerald ml-auto">
            <Check className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      <h2 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-3">
        {prompt.title}
      </h2>

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
        isToday ? "ring-1 ring-primary/30" : ""
      }`}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-sf-void/40 z-10 pointer-events-none flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-sm px-3 py-1.5">
            <Check className="w-4 h-4 text-sf-emerald" />
            <span className="font-mono text-xs text-sf-emerald uppercase tracking-wider">
              Completed
            </span>
          </div>
        </div>
      )}

      {/* Day label + today badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[12px] text-t4 uppercase tracking-[1.5px]">
          {dayLabel}
        </span>
        {isToday && (
          <Badge className="text-[11px] px-1.5 py-0 rounded-sm border border-primary/20 bg-primary/[0.06] text-primary">
            Today
          </Badge>
        )}
      </div>

      {/* Category + difficulty badges */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Badge
          className={`text-[11px] px-1.5 py-0 rounded-sm border ${CATEGORY_COLORS[prompt.category]}`}
        >
          {CATEGORY_LABELS[prompt.category]}
        </Badge>
        <Badge
          className={`text-[11px] px-1.5 py-0 rounded-sm border ${DIFFICULTY_COLORS[prompt.difficulty]}`}
        >
          {DIFFICULTY_LABELS[prompt.difficulty]}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-heading text-xs font-light uppercase tracking-[1.5px] text-t1 mb-2">
        {prompt.title}
      </h3>

      {/* Prompt excerpt */}
      <p className="text-xs text-t3 italic leading-relaxed line-clamp-3 mb-auto">
        {prompt.prompt}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
        {prompt.wordGoal && (
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-t5" />
            <span className="font-mono text-[12px] text-t5">
              {prompt.wordGoal} words
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onStartWriting(prompt)}
          disabled={isCompleted}
          className={`ml-auto flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[1px] transition-colors ${
            isCompleted
              ? "text-t5 cursor-default"
              : "text-primary hover:text-primary/80 cursor-pointer"
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
