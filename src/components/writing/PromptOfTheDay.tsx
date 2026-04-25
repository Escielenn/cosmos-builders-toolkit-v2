import { PenTool, Target, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WRITING_PROMPTS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type WritingPrompt,
} from "@/lib/writing/prompts";

// ---------------------------------------------------------------------------
// Deterministic date-based hash (same prompt for all users on a given day)
// ---------------------------------------------------------------------------

function hashDateString(dateStr: string): number {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getPromptOfTheDay(): WritingPrompt {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const index = hashDateString(dateStr) % WRITING_PROMPTS.length;
  return WRITING_PROMPTS[index];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PromptOfTheDay() {
  const prompt = getPromptOfTheDay();

  return (
    <GlassPanel glow className="p-6 md:p-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-sf-teal" />
        <span className="font-heading text-xs font-medium uppercase tracking-sf-wide text-t4">
          Today's Prompt
        </span>
      </div>

      {/* Category + Difficulty badges */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="glow" className="text-[10px]">
          {CATEGORY_LABELS[prompt.category]}
        </Badge>
        <Badge variant="glow-amber" className="text-[10px]">
          {DIFFICULTY_LABELS[prompt.difficulty]}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-3">
        {prompt.title}
      </h3>

      {/* Prompt text */}
      <p className="text-t2 italic leading-relaxed line-clamp-3 mb-5">
        {prompt.prompt}
      </p>

      {/* Footer: word goal + CTA */}
      <div className="flex items-center justify-between">
        {prompt.wordGoal && (
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-t4" />
            <span className="font-mono text-xs text-t4">
              {prompt.wordGoal} words
            </span>
          </div>
        )}

        <Button asChild className="ml-auto gap-2">
          <Link to="/writing">
            <PenTool className="w-4 h-4" />
            Start Writing
          </Link>
        </Button>
      </div>
    </GlassPanel>
  );
}
